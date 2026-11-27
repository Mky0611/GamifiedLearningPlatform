# LEX RAID — P5.1 BACKEND READINESS & SQL SERVER MIGRATION DRAFT

> **Trạng thái nghiệm thu:** Tài liệu thiết kế schema SQL Server T-SQL, cơ chế khóa đồng thời, deduplication phần thưởng, parity combat và kịch bản Rollback cho Phase P5/P5.1.
> **Ràng buộc:** KHÔNG tự ý áp dụng DDL vào SQL Server khi chưa được phê duyệt. Tính năng Skill Tree, Hero Unlock (`arcane_mage`) và Chapter Map hiện chạy độc lập ở chế độ **Demo Progression (`localStorage`)**; live DB endpoint `/api/v1/account/loadout` giữ nguyên `ALLOWED_UNITS = {warrior, lancer, archer}` để đồng nhất với policy chưa bật `hero_ownership`.

---

## 1. Parity Đã Đồng Bộ & Kiểm Chứng Bằng Mockito (`LexRaidServiceImpl` / `AccountServiceImpl`)

1. **`LexRaidBalanceConfig.computeCoreWordDamage(configuredBonusDamage, wordLength)`**
   - Thống nhất sát thương Core Word `max(55, configuredBonusDamage, wordLength * 10)`.
2. **Core Word Wave Transition vs Mid-Fight Damage (`LexRaidServiceImpl.guessCoreWord`):**
   - Phá vỡ `bossShieldRemaining = 0` và trừ `rewardDamage` vào `bossHpRemaining` (`nextHp = max(0, curHp - rewardDamage)`).
   - **Chỉ** reset `bossHpRemaining = stage.getBoss().getBaseHp()` (chuyển Boss Wave mới) khi `nextHp <= 0 && nextWordCheck != null`. Nếu Boss còn HP (`nextHp > 0`) dù vẫn còn Core Word tiếp theo, Boss giữ nguyên HP còn lại chứ không hồi đầy 100% trái phép.
3. **`AccountServiceImpl.saveLoadout` (Mage Policy Integrity):**
   - Giữ `ALLOWED_UNITS = Set.of("warrior", "lancer", "archer")` cho tới khi bảng `dbo.hero_ownership` và `user_word_mastery` validation được triển khai đồng bộ với điều kiện Demo (`Stage 1 clear + >= 1 Topic Word`).

---

## 2. Bản Nháp T-SQL Server Up-Migration (Chờ Phê Duyệt)

> Khảo sát schema hiện có: sử dụng khóa ngoại tham chiếu chuẩn bảng thực `dbo.users(user_id)` và `dbo.raid_sessions(raid_session_id)` (`dbo.stages(stage_id)` được kiểm tra tồn tại khi triển khai thực tế).

```sql
-- UP MIGRATION (SQL Server T-SQL)
BEGIN TRANSACTION;

CREATE TABLE dbo.hero_ownership (
    hero_ownership_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    hero_code VARCHAR(32) NOT NULL,
    unlock_source VARCHAR(64) NOT NULL, -- 'STARTER' | 'STAGE_AND_LEARNING'
    unlocked_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_hero_ownership UNIQUE (user_id, hero_code)
);

CREATE TABLE dbo.user_skill_unlocks (
    user_skill_unlock_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    skill_code VARCHAR(64) NOT NULL,
    skill_level INT NOT NULL DEFAULT 1 CHECK (skill_level BETWEEN 1 AND 3),
    unlocked_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_user_skill UNIQUE (user_id, skill_code)
);

CREATE TABLE dbo.user_hero_loadouts (
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    hero_code VARCHAR(32) NOT NULL,
    active_slots_json NVARCHAR(256) NOT NULL, -- tối đa 4 Active Skill IDs
    ultimate_slot_code VARCHAR(64) NULL,      -- tối đa 1 Ultimate Skill ID
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_user_hero_loadouts PRIMARY KEY (user_id, hero_code)
);

CREATE TABLE dbo.user_milestone_rewards (
    user_milestone_reward_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    milestone_key VARCHAR(96) NOT NULL, -- e.g. 'stage_first_clear_1', 'hero_unlock_arcane_mage', 'skill_unlock_phantom_dash'
    granted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_user_milestone UNIQUE (user_id, milestone_key)
);

ALTER TABLE dbo.users ADD skill_points INT NOT NULL CONSTRAINT df_users_skill_points DEFAULT 3;

CREATE TABLE dbo.skill_cast_events (
    skill_cast_event_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    raid_session_id BIGINT NOT NULL REFERENCES dbo.raid_sessions(raid_session_id),
    round_no INT NOT NULL,
    hero_code VARCHAR(32) NOT NULL,
    skill_code VARCHAR(64) NOT NULL,
    skill_level INT NOT NULL,
    mana_cost INT NOT NULL,
    damage_value INT NOT NULL DEFAULT 0,
    heal_value INT NOT NULL DEFAULT 0,
    is_valid BIT NOT NULL,
    rejection_reason NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

COMMIT TRANSACTION;
```

---

## 3. Rollback Script T-SQL Server (An Toàn Khi Cần Hoàn Tác)

```sql
-- ROLLBACK MIGRATION (Reverse Dependency Order)
BEGIN TRANSACTION;

DROP TABLE IF EXISTS dbo.skill_cast_events;
DROP TABLE IF EXISTS dbo.user_milestone_rewards;
DROP TABLE IF EXISTS dbo.user_hero_loadouts;
DROP TABLE IF EXISTS dbo.user_skill_unlocks;
DROP TABLE IF EXISTS dbo.hero_ownership;

IF COL_LENGTH('dbo.users', 'skill_points') IS NOT NULL
BEGIN
    ALTER TABLE dbo.users DROP CONSTRAINT df_users_skill_points;
    ALTER TABLE dbo.users DROP COLUMN skill_points;
END;

COMMIT TRANSACTION;
```

---

## 4. Locking Strategy & Server-Authoritative Validation (SQL Server Compatible)

1. **Khóa bi quan (Không dùng `SELECT ... FOR UPDATE`):**
   - Với **Spring Data JPA**: sử dụng `@Lock(LockModeType.PESSIMISTIC_WRITE)` kết hợp `@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))` trên `UserRepository.findByIdForUpdate(userId)` — Hibernate SQL Server Dialect tự dịch sang `WITH (UPDLOCK, ROWLOCK)`.
   - Với **Native SQL Server T-SQL**: dùng tường minh `SELECT user_id, skill_points FROM dbo.users WITH (UPDLOCK, ROWLOCK) WHERE user_id = :userId`.
2. **Skill Upgrade & Hero Unlock Validation (`POST /api/v1/progression/skills/upgrade`):**
   - Xác thực Stage/Chapter clears qua `UserStageProgress` (`clear_count >= 1`), `UserWordMastery` (topic & reviewed words), prerequisite skills ở `user_skill_unlocks` (`skill_level >= 1`), và SP còn lại (`skill_points >= 1`).
3. **Reward Deduplication:**
   - Ràng buộc `UNIQUE (user_id, milestone_key)` trên `dbo.user_milestone_rewards` tách riêng `stage_first_clear_{stageId}`, `skill_unlock_{skillId}`, `hero_unlock_{heroId}` — tránh bug gộp milestone khiến replay không thể mở khóa Hero khi đủ Topic Word.
4. **Loadout & In-Battle Skill Validation:**
   - Kiểm tra `hero_ownership`, `skill_level >= 1`, `allowedHeroes`, `activeSlots <= 4`, `ultimateSlots <= 1`; không dùng thông số damage/mana từ client.
