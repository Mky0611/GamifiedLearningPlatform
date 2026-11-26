# LEX RAID — P5 BACKEND & SQL SERVER MIGRATION DRAFT

> **Trạng thái nghiệm thu:** Tài liệu thiết kế schema, rule validation server-authoritative và parity combat cho Phase P5.
> **Ghi chú:** KHÔNG tự ý sửa live schema SQL Server khi chưa được user phê duyệt/chạy DB migration script. Mọi thay đổi P5 hiện tại trên `/app/account` và `/app/minigame` đang chạy ở chế độ **Demo Progression (`localStorage`)** nếu SQL Server chưa được nâng cấp.

---

## 1. Combat & Core Word Parity (Đã cập nhật vào Java Backend)

1. **`LexRaidBalanceConfig.computeCoreWordDamage(configuredBonusDamage, wordLength)`**
   - Thống nhất sát thương Core Word giữa Frontend (`60` DMG) và Java Backend (`max(55, configuredBonusDamage, wordLength * 10)`).
   - Phá vỡ toàn bộ `bossShieldRemaining = 0` và trừ `rewardDamage` vào `bossHpRemaining` thay vì xóa mù quáng mọi Boss HP cao về `0`.
   - Khi còn Core Word/Wave tiếp theo, chuyển sang Boss Wave mới (`stage.getBoss().getBaseHp()`) và persist `nextBoard` trong snapshot `POST_CORE_GUESS`.
2. **`AccountServiceImpl.ALLOWED_UNITS`**
   - Mở rộng tập đơn vị hợp lệ gồm `warrior`, `lancer`, `archer`, `arcane_mage` mà không làm gãy cột `selected_unit_code` (`VARCHAR(32)`) hiện có.

---

## 2. Draft SQL Server DDL Cho Phase P5 (Chờ duyệt áp dụng DB)

```sql
-- 1. Sở hữu Hero theo tài khoản
CREATE TABLE dbo.hero_ownership (
    hero_ownership_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    hero_code VARCHAR(32) NOT NULL,
    unlock_source VARCHAR(64) NOT NULL, -- 'STARTER' | 'STAGE_CLEAR' | 'LEARNING_MILESTONE'
    unlocked_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_hero_ownership UNIQUE (user_id, hero_code)
);

-- 2. Cây kỹ năng & Tiến hóa cấp Lv 1..3
CREATE TABLE dbo.user_skill_unlocks (
    user_skill_unlock_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    skill_code VARCHAR(64) NOT NULL,
    skill_level INT NOT NULL DEFAULT 1 CHECK (skill_level BETWEEN 1 AND 3),
    unlocked_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_user_skill UNIQUE (user_id, skill_code)
);

-- 3. Loadout xuất chiến (4 Active + max 1 Ultimate)
CREATE TABLE dbo.user_hero_loadouts (
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    hero_code VARCHAR(32) NOT NULL,
    active_slots_json NVARCHAR(256) NOT NULL, -- tối đa 4 skill ID
    ultimate_slot_code VARCHAR(64) NULL,      -- tối đa 1 ultimate ID
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_user_hero_loadouts PRIMARY KEY (user_id, hero_code)
);

-- 4. Điểm kỹ năng & Tiến độ Chapter
ALTER TABLE dbo.users ADD skill_points INT NOT NULL DEFAULT 3;

-- 5. Nhật ký sử dụng Skill trong RaidSession (chống gian lận Mana/Cooldown)
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
```

---

## 3. Quy Tắc Server-Authoritative Validation Khi Tích Hợp DB

1. **Skill Unlock / Evolution (`POST /api/v1/progression/skills/upgrade`):**
   - Khóa bi quan `SELECT ... FOR UPDATE` (`findByIdForUpdate`) trên bản ghi `users` để chống race condition SP.
   - Kiểm tra skill tồn tại trong `SkillDefinitionRegistry` trên server, đủ `prerequisites` ở Lv >= 1, đạt điều kiện Chapter/Learning (`UserStageProgress` + `UserWordMastery`), còn đủ `skill_points >= 1`, và `skill_level < 3`.
2. **Loadout Validation (`PUT /api/v1/progression/loadout`):**
   - Kiểm tra `hero_code` đã tồn tại trong `hero_ownership` (hoặc starter `warrior`).
   - Kiểm tra từng `skill_code` đều đã mở khóa ở `user_skill_unlocks`, `allowedHeroes.contains(hero_code)`, `activeSlots.size() <= 4`, `ultimateCount <= 1`, không trùng ID.
3. **In-Battle Skill Cast (`POST /api/v1/lex-raid/sessions/{id}/cast-skill`):**
   - Không tin sát thương/cooldown từ client.
   - Server tính lại từ `raid_session.mana_value`, kiểm tra cooldown từ `skill_cast_events` gần nhất, trừ `mana_cost`, tính damage/heal/status theo `SkillLevel` trong DB và lưu `SkillCastEvent` trước khi trả kết quả.
4. **Reward Deduplication:**
   - Cột `reward_granted_bit` hoặc bảng `user_milestone_rewards (user_id, milestone_key UNIQUE)` đảm bảo hoàn thành Stage nhiều lần không cấp trùng `Skill Point` hay `Hero Unlock`.
