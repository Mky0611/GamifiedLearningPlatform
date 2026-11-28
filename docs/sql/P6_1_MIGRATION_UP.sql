-- ============================================================================
-- LEX RAID P6.1 — AUTHORITATIVE UP-MIGRATION & IDEMPOTENT BACKFILL
-- Target: Microsoft SQL Server (Tested on GamifiedLearningPlatform_P6_Test)
-- Safety: Transactional (XACT_ABORT ON), Idempotent, Preserves Legacy Data
-- ============================================================================

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. User progression wallet (decoupled from dbo.users for zero breaking change)
    IF OBJECT_ID('dbo.user_progression_wallets', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_progression_wallets (
            user_id BIGINT NOT NULL PRIMARY KEY
                CONSTRAINT FK_user_progression_wallets_user FOREIGN KEY REFERENCES dbo.users(user_id),
            skill_points INT NOT NULL
                CONSTRAINT DF_user_prog_wallet_sp DEFAULT (3)
                CONSTRAINT CK_user_prog_wallet_sp CHECK (skill_points >= 0),
            selected_hero_code VARCHAR(32) NOT NULL
                CONSTRAINT DF_user_prog_wallet_hero DEFAULT ('warrior')
                CONSTRAINT CK_user_prog_wallet_hero CHECK (selected_hero_code IN ('warrior', 'archer', 'lancer', 'arcane_mage')),
            updated_at DATETIME2 NOT NULL
                CONSTRAINT DF_user_prog_wallet_upd DEFAULT (SYSUTCDATETIME())
        );
    END;

    -- 2. Extend legacy constraints for Arcane Mage & Global Lexicon attacks
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'CK_user_loadouts_unit' AND parent_object_id = OBJECT_ID('dbo.user_loadouts')
    )
    BEGIN
        ALTER TABLE dbo.user_loadouts DROP CONSTRAINT CK_user_loadouts_unit;
    END;
    IF OBJECT_ID('dbo.user_loadouts', 'U') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.user_loadouts ADD CONSTRAINT CK_user_loadouts_unit
            CHECK (selected_unit_code IN (N'WARRIOR', N'LANCER', N'ARCHER', N'ARCANE_MAGE'));
    END;

    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'CK_word_submit_events_word_type' AND parent_object_id = OBJECT_ID('dbo.word_submit_events')
    )
    BEGIN
        ALTER TABLE dbo.word_submit_events DROP CONSTRAINT CK_word_submit_events_word_type;
    END;
    IF OBJECT_ID('dbo.word_submit_events', 'U') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.word_submit_events ADD CONSTRAINT CK_word_submit_events_word_type
            CHECK (word_type IN (N'INVALID', N'REVIEW', N'CORE', N'TOPIC', N'NORMAL', N'GLOBAL'));
    END;

    -- 3. Hero ownership
    IF OBJECT_ID('dbo.hero_ownership', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.hero_ownership (
            hero_ownership_id BIGINT IDENTITY(1,1) PRIMARY KEY,
            user_id BIGINT NOT NULL
                CONSTRAINT FK_hero_ownership_user FOREIGN KEY REFERENCES dbo.users(user_id),
            hero_code VARCHAR(32) NOT NULL
                CONSTRAINT CK_hero_ownership_code CHECK (hero_code IN ('warrior', 'archer', 'lancer', 'arcane_mage')),
            unlock_source VARCHAR(64) NOT NULL,
            unlocked_at DATETIME2 NOT NULL
                CONSTRAINT DF_hero_ownership_unlocked DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_hero_ownership_user_hero UNIQUE (user_id, hero_code)
        );
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_hero_ownership_user' AND object_id = OBJECT_ID('dbo.hero_ownership'))
    BEGIN
        CREATE INDEX IX_hero_ownership_user ON dbo.hero_ownership (user_id);
    END;

    -- 4. User skill unlocks (Lv 1..3)
    IF OBJECT_ID('dbo.user_skill_unlocks', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_skill_unlocks (
            user_skill_unlock_id BIGINT IDENTITY(1,1) PRIMARY KEY,
            user_id BIGINT NOT NULL
                CONSTRAINT FK_user_skill_unlocks_user FOREIGN KEY REFERENCES dbo.users(user_id),
            skill_code VARCHAR(64) NOT NULL,
            skill_level INT NOT NULL
                CONSTRAINT DF_user_skill_level DEFAULT (1)
                CONSTRAINT CK_user_skill_level CHECK (skill_level BETWEEN 1 AND 3),
            unlocked_at DATETIME2 NOT NULL
                CONSTRAINT DF_user_skill_unlocked DEFAULT (SYSUTCDATETIME()),
            updated_at DATETIME2 NOT NULL
                CONSTRAINT DF_user_skill_updated DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_user_skill_unlocks_user_skill UNIQUE (user_id, skill_code)
        );
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_user_skill_unlocks_user' AND object_id = OBJECT_ID('dbo.user_skill_unlocks'))
    BEGIN
        CREATE INDEX IX_user_skill_unlocks_user ON dbo.user_skill_unlocks (user_id);
    END;

    -- 5. Hero loadouts (4 Active + 1 Ultimate per hero)
    IF OBJECT_ID('dbo.user_hero_loadouts', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_hero_loadouts (
            user_id BIGINT NOT NULL
                CONSTRAINT FK_user_hero_loadouts_user FOREIGN KEY REFERENCES dbo.users(user_id),
            hero_code VARCHAR(32) NOT NULL
                CONSTRAINT CK_user_hero_loadout_hero CHECK (hero_code IN ('warrior', 'archer', 'lancer', 'arcane_mage')),
            active_slots_json NVARCHAR(512) NOT NULL
                CONSTRAINT CK_user_hero_loadouts_json CHECK (ISJSON(active_slots_json) = 1),
            ultimate_slot_code VARCHAR(64) NULL,
            updated_at DATETIME2 NOT NULL
                CONSTRAINT DF_user_hero_loadouts_upd DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT PK_user_hero_loadouts PRIMARY KEY (user_id, hero_code)
        );
    END;

    -- 6. Milestone reward deduplication
    IF OBJECT_ID('dbo.user_milestone_rewards', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_milestone_rewards (
            user_milestone_reward_id BIGINT IDENTITY(1,1) PRIMARY KEY,
            user_id BIGINT NOT NULL
                CONSTRAINT FK_user_milestone_user FOREIGN KEY REFERENCES dbo.users(user_id),
            milestone_key VARCHAR(96) NOT NULL,
            reward_type VARCHAR(32) NOT NULL,
            sp_granted INT NOT NULL
                CONSTRAINT DF_user_milestone_sp DEFAULT (0)
                CONSTRAINT CK_user_milestone_sp CHECK (sp_granted >= 0),
            granted_at DATETIME2 NOT NULL
                CONSTRAINT DF_user_milestone_granted DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_user_milestone_rewards_user_key UNIQUE (user_id, milestone_key)
        );
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_user_milestone_rewards_user' AND object_id = OBJECT_ID('dbo.user_milestone_rewards'))
    BEGIN
        CREATE INDEX IX_user_milestone_rewards_user ON dbo.user_milestone_rewards (user_id);
    END;

    -- 7. Single authoritative combat state on dbo.raid_sessions (removes CombatMeta duplication)
    IF COL_LENGTH('dbo.raid_sessions', 'wave_index') IS NULL
    BEGIN
        ALTER TABLE dbo.raid_sessions ADD
            wave_index INT NOT NULL
                CONSTRAINT DF_raid_sessions_wave_idx DEFAULT (1)
                CONSTRAINT CK_raid_sessions_wave_idx CHECK (wave_index >= 1),
            total_waves INT NOT NULL
                CONSTRAINT DF_raid_sessions_total_waves DEFAULT (5)
                CONSTRAINT CK_raid_sessions_total_waves CHECK (total_waves >= 1),
            play_mode VARCHAR(16) NOT NULL
                CONSTRAINT DF_raid_sessions_play_mode DEFAULT ('CAMPAIGN')
                CONSTRAINT CK_raid_sessions_play_mode CHECK (play_mode IN ('CAMPAIGN', 'PRACTICE')),
            hero_code VARCHAR(32) NOT NULL
                CONSTRAINT DF_raid_sessions_hero_code DEFAULT ('warrior')
                CONSTRAINT CK_raid_sessions_hero_code CHECK (hero_code IN ('warrior', 'archer', 'lancer', 'arcane_mage')),
            player_hp INT NOT NULL
                CONSTRAINT DF_raid_sessions_player_hp DEFAULT (112)
                CONSTRAINT CK_raid_sessions_player_hp CHECK (player_hp >= 0),
            player_max_hp INT NOT NULL
                CONSTRAINT DF_raid_sessions_player_max_hp DEFAULT (112)
                CONSTRAINT CK_raid_sessions_player_max_hp CHECK (player_max_hp >= 1),
            zero_mana_casts_turn INT NOT NULL
                CONSTRAINT DF_raid_sessions_zero_mana_turn DEFAULT (0)
                CONSTRAINT CK_raid_sessions_zero_mana_turn CHECK (zero_mana_casts_turn >= 0),
            topic_words_solved INT NOT NULL
                CONSTRAINT DF_raid_sessions_topic_words DEFAULT (0)
                CONSTRAINT CK_raid_sessions_topic_words CHECK (topic_words_solved >= 0),
            boss_statuses_json NVARCHAR(1024) NULL
                CONSTRAINT CK_raid_sessions_boss_statuses_json CHECK (boss_statuses_json IS NULL OR ISJSON(boss_statuses_json) = 1),
            skill_cooldowns_json NVARCHAR(1024) NULL
                CONSTRAINT CK_raid_sessions_skill_cooldowns_json CHECK (skill_cooldowns_json IS NULL OR ISJSON(skill_cooldowns_json) = 1),
            encounter_roster_json NVARCHAR(MAX) NULL
                CONSTRAINT CK_raid_sessions_encounter_roster_json CHECK (encounter_roster_json IS NULL OR ISJSON(encounter_roster_json) = 1);
    END;

    -- 8. Authoritative Skill Cast audit & idempotency
    IF OBJECT_ID('dbo.skill_cast_events', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.skill_cast_events (
            skill_cast_event_id BIGINT IDENTITY(1,1) PRIMARY KEY,
            raid_session_id BIGINT NOT NULL
                CONSTRAINT FK_skill_cast_session FOREIGN KEY REFERENCES dbo.raid_sessions(raid_session_id),
            user_id BIGINT NOT NULL
                CONSTRAINT FK_skill_cast_user FOREIGN KEY REFERENCES dbo.users(user_id),
            action_id VARCHAR(64) NOT NULL,
            round_no INT NOT NULL CONSTRAINT CK_skill_cast_round_no CHECK (round_no >= 1),
            wave_index INT NOT NULL CONSTRAINT CK_skill_cast_wave_index CHECK (wave_index >= 1),
            hero_code VARCHAR(32) NOT NULL,
            skill_code VARCHAR(64) NOT NULL,
            skill_level INT NOT NULL CONSTRAINT CK_skill_cast_skill_level CHECK (skill_level BETWEEN 1 AND 3),
            mana_cost INT NOT NULL CONSTRAINT CK_skill_cast_mana_cost CHECK (mana_cost >= 0),
            damage_dealt INT NOT NULL CONSTRAINT DF_skill_cast_dmg DEFAULT (0) CONSTRAINT CK_skill_cast_dmg CHECK (damage_dealt >= 0),
            shield_damage INT NOT NULL CONSTRAINT DF_skill_cast_shield DEFAULT (0) CONSTRAINT CK_skill_cast_shield CHECK (shield_damage >= 0),
            heal_value INT NOT NULL CONSTRAINT DF_skill_cast_heal DEFAULT (0) CONSTRAINT CK_skill_cast_heal CHECK (heal_value >= 0),
            status_applied VARCHAR(32) NULL,
            is_valid BIT NOT NULL,
            rejection_reason NVARCHAR(255) NULL,
            created_at DATETIME2 NOT NULL CONSTRAINT DF_skill_cast_created DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_skill_cast_session_action UNIQUE (raid_session_id, action_id)
        );
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_skill_cast_events_session' AND object_id = OBJECT_ID('dbo.skill_cast_events'))
    BEGIN
        CREATE INDEX IX_skill_cast_events_session ON dbo.skill_cast_events (raid_session_id, created_at);
    END;

    -- 9. Single-use time-bounded Recall challenges
    IF OBJECT_ID('dbo.mastery_recall_challenges', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.mastery_recall_challenges (
            challenge_id VARCHAR(64) NOT NULL PRIMARY KEY,
            user_id BIGINT NOT NULL
                CONSTRAINT FK_mastery_challenge_user FOREIGN KEY REFERENCES dbo.users(user_id),
            word_id BIGINT NOT NULL
                CONSTRAINT FK_mastery_challenge_word FOREIGN KEY REFERENCES dbo.vocabulary_words(word_id),
            options_json NVARCHAR(512) NOT NULL
                CONSTRAINT CK_mastery_challenge_options_json CHECK (ISJSON(options_json) = 1),
            expires_at DATETIME2 NOT NULL,
            consumed_at DATETIME2 NULL,
            is_correct BIT NULL,
            created_at DATETIME2 NOT NULL CONSTRAINT DF_mastery_challenge_created DEFAULT (SYSUTCDATETIME())
        );
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_mastery_recall_challenges_user' AND object_id = OBJECT_ID('dbo.mastery_recall_challenges'))
    BEGIN
        CREATE INDEX IX_mastery_recall_challenges_user ON dbo.mastery_recall_challenges (user_id, expires_at);
    END;

    -- 10. Idempotent Backfill (Dynamic SQL so new columns bind cleanly in same transaction)
    EXEC sp_executesql N'
        -- Preserve legacy closed raid sessions as 1-wave pre-P6 records
        UPDATE dbo.raid_sessions
        SET total_waves = 1
        WHERE status IN (N''WON'', N''LOST'', N''ABANDONED'')
          AND encounter_roster_json IS NULL;

        -- Initialize missing wallets from existing user loadouts where present
        INSERT INTO dbo.user_progression_wallets (user_id, skill_points, selected_hero_code)
        SELECT u.user_id,
               3,
               CASE LOWER(ISNULL(ul.selected_unit_code, N''WARRIOR''))
                   WHEN ''archer'' THEN ''archer''
                   WHEN ''lancer'' THEN ''lancer''
                   ELSE ''warrior''
               END
        FROM dbo.users u
        LEFT JOIN dbo.user_loadouts ul ON ul.user_id = u.user_id
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.user_progression_wallets w WHERE w.user_id = u.user_id
        );

        -- Backfill starter heroes ONLY (arcane_mage stays locked until criteria met)
        INSERT INTO dbo.hero_ownership (user_id, hero_code, unlock_source)
        SELECT u.user_id, h.hero_code, ''STARTER''
        FROM dbo.users u
        CROSS JOIN (VALUES (''warrior''), (''archer''), (''lancer'')) AS h(hero_code)
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.hero_ownership ho WHERE ho.user_id = u.user_id AND ho.hero_code = h.hero_code
        );

        -- Backfill starter skill unlocks & shared elemental spells
        INSERT INTO dbo.user_skill_unlocks (user_id, skill_code, skill_level)
        SELECT u.user_id, s.skill_code, 1
        FROM dbo.users u
        CROSS JOIN (VALUES
            (''knight_slash''), (''heavy_slash''), (''royal_guard''), (''blade_storm''), (''lexical_judgment''),
            (''quick_shot''), (''piercing_arrow''), (''triple_shot''),
            (''spear_thrust''), (''impaling_charge''), (''iron_fortress''),
            (''fire_blade''), (''frost_seal''), (''thunder_strike''), (''sacred_recovery'')
        ) AS s(skill_code)
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.user_skill_unlocks su WHERE su.user_id = u.user_id AND su.skill_code = s.skill_code
        );

        -- Backfill starter hero loadouts
        INSERT INTO dbo.user_hero_loadouts (user_id, hero_code, active_slots_json, ultimate_slot_code)
        SELECT u.user_id, l.hero_code, l.active_slots_json, l.ultimate_slot_code
        FROM dbo.users u
        CROSS JOIN (VALUES
            (''warrior'', N''["knight_slash","heavy_slash","royal_guard","sacred_recovery"]'', ''lexical_judgment''),
            (''archer'',  N''["quick_shot","piercing_arrow","triple_shot","sacred_recovery"]'', NULL),
            (''lancer'',  N''["spear_thrust","impaling_charge","iron_fortress","sacred_recovery"]'', NULL)
        ) AS l(hero_code, active_slots_json, ultimate_slot_code)
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.user_hero_loadouts hl WHERE hl.user_id = u.user_id AND hl.hero_code = l.hero_code
        );
    ';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
