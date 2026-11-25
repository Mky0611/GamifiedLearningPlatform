# LEX RAID — P4-B.3 BACKEND & DATABASE MIGRATION DRAFT

> **Status:** PROPOSAL / DRAFT (NOT APPLIED to SQL Server `script_GPL_v2.sql`).
> Existing P3 database schema (`raid_sessions`, `word_submit_events`, `user_word_mastery`) remains 100% intact. Global English Lexicon attacks already work cleanly on the existing schema because `word_submit_events.vocabulary_word_id` is nullable and `UserWordMastery` is skipped when `vocabulary_word_id IS NULL`.

---

## 1. Compatibility Summary (Implemented in P4-B.3)

| Feature | Current Backend Support | Persistence Strategy |
| :--- | :--- | :--- |
| Global English Lexicon (`76,993` offline words via `EnglishLexiconService`) | **LIVE (Java)** | Persisted as `word_submit_events.word_type = 'GLOBAL'`, `vocabulary_word_id = NULL`; does NOT create fake `VocabularyWord` or `UserWordMastery`. |
| Topic Word `+30%` Bonus & Mana Cap (`6`) | **LIVE (Java)** | Computed server-side in `LexRaidServiceImpl` using `LexRaidBalanceConfig`. |
| Initial `BoardSnapshot` & Non-Adjacent Tile Validation | **LIVE (Java)** | `startSession()` saves `SESSION_START` snapshot; `submitWord()` verifies tile coords without reuse against latest `BoardSnapshot`. |
| 5-Wave Encounter Progression (`Normal -> Normal -> Elite -> Guardian -> Chapter Boss`) | **Preview Mode Only** | Client-side `encounter-registry.js`; requires SQL migration below to persist server-side. |
| Monster Traits, Phase 2 & Burn/Frost/Stun Statuses | **Preview Mode Only** | Client-side combat simulation; requires SQL columns below for server validation. |
| Expanded Spell Casts (`Fire Blade`, `Frost Seal`, `Thunder Strike`, etc.) | **Preview Mode Only** | Blocked when `raidSessionId != null`; requires `/api/lex-raid/sessions/{id}/cast-spell` endpoint. |

---

## 2. Proposed SQL Server DDL Migration (For Future P5 Review)

```sql
-- 1. Extend raid_sessions for multi-wave encounters & active battle statuses
ALTER TABLE dbo.raid_sessions ADD
    wave_index INT NOT NULL CONSTRAINT DF_raid_sessions_wave_index DEFAULT 1,
    total_waves INT NOT NULL CONSTRAINT DF_raid_sessions_total_waves DEFAULT 5,
    current_monster_code VARCHAR(50) NULL,
    current_monster_rarity VARCHAR(24) NULL,
    boss_status_json NVARCHAR(500) NULL,
    spell_cooldowns_json NVARCHAR(500) NULL,
    hint_charges_remaining INT NOT NULL CONSTRAINT DF_raid_sessions_hint_charges DEFAULT 3;
GO

-- 2. Optional audit table for spell casts & hint usage
CREATE TABLE dbo.raid_spell_events (
    spell_event_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    raid_session_id BIGINT NOT NULL REFERENCES dbo.raid_sessions(raid_session_id),
    wave_index INT NOT NULL,
    spell_code VARCHAR(50) NOT NULL,
    mana_spent INT NOT NULL,
    damage_dealt INT NOT NULL DEFAULT 0,
    status_applied VARCHAR(32) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
```

---

## 3. Proposed REST API Extensions (Future P5)

- `POST /api/lex-raid/sessions/{raidSessionId}/cast-spell`
  - Request: `{ "spellCode": "FIRE_BLADE", "roundNo": 2 }`
  - Validation: checks authoritative `mana_value >= manaCost`, verifies `spellCooldownsJson`, applies server-authoritative Burn/Frost/Stun or Shield damage, persists `raid_spell_events`.
- `POST /api/lex-raid/sessions/{raidSessionId}/hint`
  - Request: `{ "hintType": "REVEAL_LETTER" | "REFRESH_BOARD" }`
  - Validation: decrements `hint_charges_remaining` for `REVEAL_LETTER` or regenerates solvable `BoardSnapshot`.
