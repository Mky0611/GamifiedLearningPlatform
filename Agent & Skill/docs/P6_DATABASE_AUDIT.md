# LEX RAID — P6 DATABASE AUDIT & MIGRATION SPECIFICATION

**Ngày audit:** 2026-11-27  
**Cơ sở dữ liệu mục tiêu:** Microsoft SQL Server `MSSQL$SQL2022` · Database `GamifiedLearningPlatform` (`ONLINE`, `localhost:1433`)  
**Phương pháp audit:** Truy vấn read-only trực tiếp `INFORMATION_SCHEMA.TABLES`, `INFORMATION_SCHEMA.COLUMNS`, `sys.foreign_keys`, `sys.indexes`, `sys.check_constraints` qua `sqlcmd -S localhost -d GamifiedLearningPlatform -E`. **KHÔNG thực thi DDL/DML ghi dữ liệu.**

---

## 1. CHẨN ĐOÁN KẾT NỐI P6-A (`localhost:1433` & `MainTests.contextLoads`)

| Kiểm tra | Môi trường | Kết quả thực tế | Kết luận |
| :--- | :---: | :--- | :--- |
| `Get-Service *SQL*` | Sandbox | `Cannot open Service Control Manager` | Hạn chế quyền sandbox |
| `Get-Service *SQL*` | Unsandboxed | `MSSQL$SQL2022` = **`Running`** | SQL Server 2022 đã cài và đang chạy |
| `Test-NetConnection localhost -Port 1433` | Unsandboxed | `TcpTestSucceeded: True` | Cổng `1433` đang lắng nghe |
| `sqlcmd -S localhost -E` | Unsandboxed | `GamifiedLearningPlatform` = **`ONLINE`** (`20` stages, `1` user, `2098` vocab words) | Windows Auth đọc metadata hoạt động |
| `mvn test -Dtest=MainTests` | Unsandboxed (`dev`) | `ErrorCode: 18456, SQLState: S0001 — Login failed for user 'sa'` | **BLOCKER:** Biến môi trường `SPRING_DATASOURCE_PASSWORD` chưa được cấp (`HasPass: False`), `sa` login thất bại; **KHÔNG** tự reset mật khẩu |

---

## 2. KIỂM TOÁN SCHEMA THỰC TẾ (`55` BASE TABLES & `2` VIEWS)

- **Tổng số bảng vật lý (`BASE TABLE`):** `55` (gồm `54` bảng nghiệp vụ + `sysdiagrams`). **Views:** `2` (`vw_latest_ranked_scores`, `vw_user_public_profile_summary`).
- **Dữ liệu nền hiện có trong `GamifiedLearningPlatform`:**
  - `dbo.users`: `1` row (`user_id BIGINT IDENTITY`)
  - `dbo.user_loadouts`: `1` row
  - `dbo.stages`: **`20` rows** (`stage_id = 1..6, 8..21` — chú ý có khoảng trống `stage_id = 7`, Stage `1..6` map Chapter `1..5`, Stage `8..21` là test progression routes Chapter `6..12`, mỗi stage có đúng `3` `stage_core_words`)
  - `dbo.bosses`: `14` rows (`boss_id = 1..14`)
  - `dbo.user_stage_progress`: `20` rows
  - `dbo.user_word_mastery`: `1` row
  - `dbo.vocabulary_words`: `2,098` rows
  - `dbo.player_skills`: `4` rows (`SCAN`, `SHUFFLE`, `FREEZE`, `PURIFY`), `dbo.stage_skills`: `60` rows, `dbo.skill_use_events`: `0` rows
  - `dbo.reward_transactions`: `0` rows, `dbo.review_questions`: `0` rows
  - `dbo.raid_sessions`: `159` rows, `dbo.game_sessions`: `170` rows

### Những sai lệch / Rủi ro phát hiện so với `P5_BACKEND_DRAFT.md` (Quan trọng!)

1. **Constraint chặn `arcane_mage` trên `dbo.user_loadouts`:**
   - Ràng buộc hiện hữu `CK_user_loadouts_unit`: `([selected_unit_code]=N'ARCHER' OR [selected_unit_code]=N'LANCER' OR [selected_unit_code]=N'WARRIOR')`.
   - Nếu không nới constraint này (bổ sung `N'ARCANE_MAGE'`), mọi lệnh `INSERT/UPDATE` lưu Mage vào SQL Server đều bị lỗi CHECK constraint!
2. **Constraint `CK_word_submit_events_word_type` trên `dbo.word_submit_events`:**
   - Chỉ cho phép `('INVALID', 'REVIEW', 'CORE', 'TOPIC', 'NORMAL')`.
   - `LexRaidServiceImpl.submitWord()` đang truyền `"GLOBAL"` khi gặp từ Global Lexicon (`line 403`) -> sẽ văng SQL error khi persist thật nếu không map `wordType = "NORMAL"` ở DB layer hoặc mở rộng CHECK constraint thêm `N'GLOBAL'`! (P6 fix trong Java: map DB `word_type = "NORMAL"` để tương thích 100% schema hiện tại, giữ DTO `wordCategory = "GLOBAL"`).
3. **Bảng P3 RPG có sẵn nhưng chưa tận dụng hết:**
   - `player_skills`, `skill_use_events`, `reward_transactions`, `raid_rounds`, `user_boss_records`, `review_questions`, `review_attempt_events` đã tồn tại sẵn với khóa ngoại hợp lệ tới `users`, `raid_sessions`, `stages`, `bosses`.
4. **An toàn tương thích ngược với `dbo.users`:**
   - Thay vì `ALTER TABLE dbo.users ADD skill_points` dễ làm gãy Hibernate mapping khi chưa chạy migration trên DB khác, tách ví progression thành bảng riêng **`dbo.user_progression_wallets`** (`user_id PK`, `skill_points INT DEFAULT 3`, `selected_hero_code VARCHAR(32) DEFAULT 'warrior'`, `updated_at DATETIME2`).

---

## 3. SCHEMA DIFF ĐỀ XUẤT & KỊCH BẢN MIGRATION T-SQL (CHỜ PHÊ DUYỆT — CHƯA CHẠY)

### Phần A — Preflight Verification (Read-only trước khi chạy)
```sql
SELECT DB_NAME() AS current_db, OBJECT_ID('dbo.users') AS has_users, OBJECT_ID('dbo.raid_sessions') AS has_raid_sessions,
       (SELECT COUNT(*) FROM dbo.users) AS existing_users,
       (SELECT COUNT(*) FROM dbo.user_stage_progress) AS existing_stage_prog;
```

### Phần B — Up-Migration T-SQL Chuẩn (`TRY/CATCH` + `XACT_ABORT ON`)
```sql
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Ví Skill Point & Hero đang chọn (tách khỏi dbo.users để an toàn backward-compat & PESSIMISTIC_WRITE)
    IF OBJECT_ID('dbo.user_progression_wallets', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_progression_wallets (
            user_id BIGINT NOT NULL PRIMARY KEY
                CONSTRAINT FK_user_progression_wallets_user FOREIGN KEY REFERENCES dbo.users(user_id),
            skill_points INT NOT NULL CONSTRAINT DF_user_prog_wallet_sp DEFAULT (3)
                CONSTRAINT CK_user_prog_wallet_sp CHECK (skill_points >= 0),
            selected_hero_code VARCHAR(32) NOT NULL CONSTRAINT DF_user_prog_wallet_hero DEFAULT ('warrior')
                CONSTRAINT CK_user_prog_wallet_hero CHECK (selected_hero_code IN ('warrior', 'archer', 'lancer', 'arcane_mage')),
            updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_prog_wallet_upd DEFAULT (SYSUTCDATETIME())
        );
    END;

    -- 2. Mở rộng CHECK constraint trên dbo.user_loadouts để hỗ trợ ARCANE_MAGE
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_user_loadouts_unit' AND parent_object_id = OBJECT_ID('dbo.user_loadouts'))
    BEGIN
        ALTER TABLE dbo.user_loadouts DROP CONSTRAINT CK_user_loadouts_unit;
    END;
    ALTER TABLE dbo.user_loadouts ADD CONSTRAINT CK_user_loadouts_unit
        CHECK (selected_unit_code IN (N'WARRIOR', N'LANCER', N'ARCHER', N'ARCANE_MAGE'));

    -- 2b. Mở rộng CHECK constraint trên dbo.word_submit_events để hỗ trợ GLOBAL lexicon attacks
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_word_submit_events_word_type' AND parent_object_id = OBJECT_ID('dbo.word_submit_events'))
    BEGIN
        ALTER TABLE dbo.word_submit_events DROP CONSTRAINT CK_word_submit_events_word_type;
    END;
    ALTER TABLE dbo.word_submit_events ADD CONSTRAINT CK_word_submit_events_word_type
        CHECK (word_type IN (N'INVALID', N'REVIEW', N'CORE', N'TOPIC', N'NORMAL', N'GLOBAL'));

    -- 3. Sở hữu Hero (tách khỏi stage completion)
    IF OBJECT_ID('dbo.hero_ownership', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.hero_ownership (
            hero_ownership_id BIGINT IDENTITY(1,1) PRIMARY KEY,
            user_id BIGINT NOT NULL CONSTRAINT FK_hero_ownership_user FOREIGN KEY REFERENCES dbo.users(user_id),
            hero_code VARCHAR(32) NOT NULL CONSTRAINT CK_hero_ownership_code CHECK (hero_code IN ('warrior', 'archer', 'lancer', 'arcane_mage')),
            unlock_source VARCHAR(64) NOT NULL,
            unlocked_at DATETIME2 NOT NULL CONSTRAINT DF_hero_ownership_unlocked DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_hero_ownership_user_hero UNIQUE (user_id, hero_code)
        );
    END;

    -- 4. Sở hữu & cấp độ Skill Lv 1..3
    IF OBJECT_ID('dbo.user_skill_unlocks', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_skill_unlocks (
            user_skill_unlock_id BIGINT IDENTITY(1,1) PRIMARY KEY,
            user_id BIGINT NOT NULL CONSTRAINT FK_user_skill_unlocks_user FOREIGN KEY REFERENCES dbo.users(user_id),
            skill_code VARCHAR(64) NOT NULL,
            skill_level INT NOT NULL CONSTRAINT DF_user_skill_level DEFAULT (1)
                CONSTRAINT CK_user_skill_level CHECK (skill_level BETWEEN 1 AND 3),
            unlocked_at DATETIME2 NOT NULL CONSTRAINT DF_user_skill_unlocked DEFAULT (SYSUTCDATETIME()),
            updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_skill_updated DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_user_skill_unlocks_user_skill UNIQUE (user_id, skill_code)
        );
    END;

    -- 5. Loadout 4 Active + 1 Ultimate theo từng Hero
    IF OBJECT_ID('dbo.user_hero_loadouts', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_hero_loadouts (
            user_id BIGINT NOT NULL CONSTRAINT FK_user_hero_loadouts_user FOREIGN KEY REFERENCES dbo.users(user_id),
            hero_code VARCHAR(32) NOT NULL CONSTRAINT CK_user_hero_loadout_hero CHECK (hero_code IN ('warrior', 'archer', 'lancer', 'arcane_mage')),
            active_slots_json NVARCHAR(512) NOT NULL CONSTRAINT CK_user_hero_loadouts_json CHECK (ISJSON(active_slots_json) = 1),
            ultimate_slot_code VARCHAR(64) NULL,
            updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_hero_loadouts_upd DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT PK_user_hero_loadouts PRIMARY KEY (user_id, hero_code)
        );
    END;

    -- 6. Milestone Rewards Deduplication (stage_first_clear_*, hero_unlock_*, skill_unlock_*)
    IF OBJECT_ID('dbo.user_milestone_rewards', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_milestone_rewards (
            user_milestone_reward_id BIGINT IDENTITY(1,1) PRIMARY KEY,
            user_id BIGINT NOT NULL CONSTRAINT FK_user_milestone_user FOREIGN KEY REFERENCES dbo.users(user_id),
            milestone_key VARCHAR(96) NOT NULL,
            reward_type VARCHAR(32) NOT NULL,
            sp_granted INT NOT NULL CONSTRAINT DF_user_milestone_sp DEFAULT (0) CHECK (sp_granted >= 0),
            granted_at DATETIME2 NOT NULL CONSTRAINT DF_user_milestone_granted DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_user_milestone_rewards_user_key UNIQUE (user_id, milestone_key)
        );
    END;

    -- 7. Combat Session State & Authoritative Skill Cast Idempotency
    IF COL_LENGTH('dbo.raid_sessions', 'wave_index') IS NULL
    BEGIN
        ALTER TABLE dbo.raid_sessions ADD
            wave_index INT NOT NULL CONSTRAINT DF_raid_sessions_wave_idx DEFAULT (1),
            total_waves INT NOT NULL CONSTRAINT DF_raid_sessions_total_waves DEFAULT (5),
            play_mode VARCHAR(16) NOT NULL CONSTRAINT DF_raid_sessions_play_mode DEFAULT ('CAMPAIGN')
                CONSTRAINT CK_raid_sessions_play_mode CHECK (play_mode IN ('CAMPAIGN', 'PRACTICE')),
            hero_code VARCHAR(32) NOT NULL CONSTRAINT DF_raid_sessions_hero_code DEFAULT ('warrior'),
            player_hp INT NOT NULL CONSTRAINT DF_raid_sessions_player_hp DEFAULT (112),
            player_max_hp INT NOT NULL CONSTRAINT DF_raid_sessions_player_max_hp DEFAULT (112),
            boss_statuses_json NVARCHAR(512) NULL,
            skill_cooldowns_json NVARCHAR(512) NULL,
            encounter_roster_json NVARCHAR(MAX) NULL;
    END;

    IF OBJECT_ID('dbo.skill_cast_events', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.skill_cast_events (
            skill_cast_event_id BIGINT IDENTITY(1,1) PRIMARY KEY,
            raid_session_id BIGINT NOT NULL CONSTRAINT FK_skill_cast_session FOREIGN KEY REFERENCES dbo.raid_sessions(raid_session_id),
            user_id BIGINT NOT NULL CONSTRAINT FK_skill_cast_user FOREIGN KEY REFERENCES dbo.users(user_id),
            action_id VARCHAR(64) NOT NULL,
            round_no INT NOT NULL CHECK (round_no >= 1),
            wave_index INT NOT NULL CHECK (wave_index >= 1),
            hero_code VARCHAR(32) NOT NULL,
            skill_code VARCHAR(64) NOT NULL,
            skill_level INT NOT NULL CHECK (skill_level BETWEEN 1 AND 3),
            mana_cost INT NOT NULL CHECK (mana_cost >= 0),
            damage_dealt INT NOT NULL DEFAULT (0) CHECK (damage_dealt >= 0),
            shield_damage INT NOT NULL DEFAULT (0) CHECK (shield_damage >= 0),
            heal_value INT NOT NULL DEFAULT (0) CHECK (heal_value >= 0),
            status_applied VARCHAR(32) NULL,
            is_valid BIT NOT NULL,
            rejection_reason NVARCHAR(255) NULL,
            created_at DATETIME2 NOT NULL CONSTRAINT DF_skill_cast_created DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_skill_cast_session_action UNIQUE (raid_session_id, action_id)
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

### Phần C — Backfill Idempotent (Không cấp sai Mage / Không trùng SP)
- Khởi tạo `dbo.user_progression_wallets` (`skill_points = 3`, `selected_hero_code = 'warrior'`) cho mọi user hiện có (`WHERE NOT EXISTS`).
- Cấp starter ownership (`'warrior'`, `'archer'`, `'lancer'`) và starter skills tương ứng trong `hero_ownership` / `user_skill_unlocks` (`WHERE NOT EXISTS`), giữ `arcane_mage` khóa cho tới khi user đạt cả `Stage 1 clear` lẫn topic/mastery learning condition.

### Phần D — Rollback Script T-SQL (Chỉ chạy khi được duyệt & đã backup)
```sql
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    DROP TABLE IF EXISTS dbo.skill_cast_events;
    DROP TABLE IF EXISTS dbo.user_milestone_rewards;
    DROP TABLE IF EXISTS dbo.user_hero_loadouts;
    DROP TABLE IF EXISTS dbo.user_skill_unlocks;
    DROP TABLE IF EXISTS dbo.hero_ownership;
    DROP TABLE IF EXISTS dbo.user_progression_wallets;

    IF COL_LENGTH('dbo.raid_sessions', 'wave_index') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.raid_sessions DROP CONSTRAINT DF_raid_sessions_wave_idx, DF_raid_sessions_total_waves,
            DF_raid_sessions_play_mode, CK_raid_sessions_play_mode, DF_raid_sessions_hero_code,
            DF_raid_sessions_player_hp, DF_raid_sessions_player_max_hp;
        ALTER TABLE dbo.raid_sessions DROP COLUMN wave_index, total_waves, play_mode, hero_code,
            player_hp, player_max_hp, boss_statuses_json, skill_cooldowns_json, encounter_roster_json;
    END;

    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_user_loadouts_unit')
    BEGIN
        ALTER TABLE dbo.user_loadouts DROP CONSTRAINT CK_user_loadouts_unit;
        ALTER TABLE dbo.user_loadouts ADD CONSTRAINT CK_user_loadouts_unit
            CHECK (selected_unit_code IN (N'WARRIOR', N'LANCER', N'ARCHER'));
    END;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

---

## 4. BLOCKER CẦN NGƯỜI DÙNG PHÊ DUYỆT TRƯỚC KHI CHẠY LIVE DB

1. **Cung cấp biến môi trường `SPRING_DATASOURCE_PASSWORD`** (hoặc tạo SQL login dev riêng với least privilege) để Spring Boot `MainTests.contextLoads` kết nối được `GamifiedLearningPlatform`.
2. **Phê duyệt thực thi Migration T-SQL** (Phần B & C ở trên) trên bản DB test / local `GamifiedLearningPlatform`.
3. **Phê duyệt thiết kế Authentication/Ownership (`SecurityConfig`):** Hiện `SecurityConfig` đặt `.permitAll()` cho `/api/v1/account/**`, `/api/v1/lex-raid/**`, `/api/v1/quiz/**` và `AuthServiceImpl` chưa phát hành JWT/HttpSession principal. Cần quyết định chuyển sang JWT filter / HttpSession principal trước khi mở API công khai ra Internet.
