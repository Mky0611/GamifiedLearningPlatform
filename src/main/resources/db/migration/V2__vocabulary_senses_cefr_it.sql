-- =============================================================================
-- V2__vocabulary_senses_cefr_it.sql
-- Lex Raid Phase P2: Vocabulary Engine & IT English Extension
-- =============================================================================
-- IMPORTANT NOTICE:
-- This is a non-breaking extension schema definition script.
-- DO NOT execute directly on the production/live database without change review.
-- It preserves all existing tables (vocabulary_words, vocabulary_sets, vocabulary_topics, etc.)
-- and introduces sense-level modeling with CEFR and IT domains.
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vocabulary_word_senses')
BEGIN
    CREATE TABLE vocabulary_word_senses (
        sense_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        word_id BIGINT NOT NULL,
        language_code VARCHAR(10) DEFAULT 'en' NOT NULL,
        sense_key VARCHAR(50) NOT NULL,
        definition_en NVARCHAR(500) NULL,
        meaning_vi NVARCHAR(500) NOT NULL,
        part_of_speech VARCHAR(50) NULL,
        cefr_level VARCHAR(10) NULL,              -- A1, A2, B1, B2, C1, C2 or NULL
        cefr_source_uri NVARCHAR(500) NULL,        -- Academic source citation URI
        cefr_review_status VARCHAR(30) DEFAULT 'DRAFT_NOT_VALIDATED' NOT NULL,
        it_domain VARCHAR(50) NULL,               -- e.g., IT_PROG_FUND, IT_OOP, IT_DEVOPS
        it_tier VARCHAR(30) NULL,                 -- Foundation, Practitioner, Advanced, Specialist
        is_board_eligible BIT DEFAULT 1 NOT NULL, -- 1 = single-word 3-10 chars for combat board
        source_uri NVARCHAR(500) NULL,
        license VARCHAR(100) NULL,
        review_status VARCHAR(30) DEFAULT 'DRAFT_NOT_VALIDATED' NOT NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
        CONSTRAINT FK_word_senses_word FOREIGN KEY (word_id) 
            REFERENCES vocabulary_words(word_id) ON DELETE CASCADE
    );

    CREATE INDEX IX_word_senses_word_id ON vocabulary_word_senses(word_id);
    CREATE INDEX IX_word_senses_cefr ON vocabulary_word_senses(cefr_level);
    CREATE INDEX IX_word_senses_it_domain ON vocabulary_word_senses(it_domain);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'it_curriculum_domains')
BEGIN
    CREATE TABLE it_curriculum_domains (
        domain_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        domain_code VARCHAR(50) NOT NULL UNIQUE,
        domain_name_vi NVARCHAR(100) NOT NULL,
        domain_name_en VARCHAR(100) NOT NULL,
        primary_tier VARCHAR(30) NOT NULL,
        sort_order INT NOT NULL,
        is_active BIT DEFAULT 1 NOT NULL
    );
END;
