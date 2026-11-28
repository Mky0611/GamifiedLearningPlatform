-- ============================================================================
-- LEX RAID P6.1 — SYMMETRIC ROLLBACK SCRIPT
-- Drops P6/P6.1 additions cleanly and restores original constraints.
-- WARNING: Never run against production once real P6 user progression exists
-- without archiving data first. Intended for P6.1 migration verification on
-- GamifiedLearningPlatform_P6_Test and emergency recovery.
-- ============================================================================

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    DROP TABLE IF EXISTS dbo.mastery_recall_challenges;
    DROP TABLE IF EXISTS dbo.skill_cast_events;
    DROP TABLE IF EXISTS dbo.user_milestone_rewards;
    DROP TABLE IF EXISTS dbo.user_hero_loadouts;
    DROP TABLE IF EXISTS dbo.user_skill_unlocks;
    DROP TABLE IF EXISTS dbo.hero_ownership;
    DROP TABLE IF EXISTS dbo.user_progression_wallets;

    IF COL_LENGTH('dbo.raid_sessions', 'wave_index') IS NOT NULL
    BEGIN
        -- Drop check & default constraints added in Up-Migration on raid_sessions
        DECLARE @dropConstraintsSql NVARCHAR(MAX) = N'';
        SELECT @dropConstraintsSql += N'ALTER TABLE dbo.raid_sessions DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(10)
        FROM (
            SELECT name FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID('dbo.raid_sessions')
              AND name IN (
                  'DF_raid_sessions_wave_idx', 'DF_raid_sessions_total_waves',
                  'DF_raid_sessions_play_mode', 'DF_raid_sessions_hero_code',
                  'DF_raid_sessions_player_hp', 'DF_raid_sessions_player_max_hp',
                  'DF_raid_sessions_zero_mana_turn', 'DF_raid_sessions_topic_words'
              )
            UNION ALL
            SELECT name FROM sys.check_constraints
            WHERE parent_object_id = OBJECT_ID('dbo.raid_sessions')
              AND name IN (
                  'CK_raid_sessions_wave_idx', 'CK_raid_sessions_total_waves',
                  'CK_raid_sessions_play_mode', 'CK_raid_sessions_hero_code',
                  'CK_raid_sessions_player_hp', 'CK_raid_sessions_player_max_hp',
                  'CK_raid_sessions_zero_mana_turn', 'CK_raid_sessions_topic_words',
                  'CK_raid_sessions_boss_statuses_json', 'CK_raid_sessions_skill_cooldowns_json',
                  'CK_raid_sessions_encounter_roster_json'
              )
        ) c;
        IF LEN(@dropConstraintsSql) > 0 EXEC sp_executesql @dropConstraintsSql;

        ALTER TABLE dbo.raid_sessions DROP COLUMN
            wave_index, total_waves, play_mode, hero_code,
            player_hp, player_max_hp, zero_mana_casts_turn, topic_words_solved,
            boss_statuses_json, skill_cooldowns_json, encounter_roster_json;
    END;

    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_user_loadouts_unit' AND parent_object_id = OBJECT_ID('dbo.user_loadouts'))
    BEGIN
        ALTER TABLE dbo.user_loadouts DROP CONSTRAINT CK_user_loadouts_unit;
        ALTER TABLE dbo.user_loadouts ADD CONSTRAINT CK_user_loadouts_unit
            CHECK (selected_unit_code IN (N'ARCHER', N'LANCER', N'WARRIOR'));
    END;

    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_word_submit_events_word_type' AND parent_object_id = OBJECT_ID('dbo.word_submit_events'))
    BEGIN
        ALTER TABLE dbo.word_submit_events DROP CONSTRAINT CK_word_submit_events_word_type;
        ALTER TABLE dbo.word_submit_events ADD CONSTRAINT CK_word_submit_events_word_type
            CHECK (word_type IN (N'INVALID', N'REVIEW', N'CORE', N'TOPIC', N'NORMAL'));
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
