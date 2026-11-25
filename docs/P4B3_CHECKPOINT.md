# P4-B.3 Execution Checkpoint

- **Branch**: `feature/p4b3-rpg-combat-learning` (branched from `2491615` on `feature/p4b2-kingdom-of-words`)
- **Current Stage**: Milestone 0 (Baseline Audit & Plan Initialized) -> Starting Milestone A

## Milestone Log
- [x] **Plan & Branch**: Branched `feature/p4b3-rpg-combat-learning` from `2491615`; inspected `battle_1366x768_init.png`, `battle_320x568_init.png`, `minigame.css`, `LexRaidServiceImpl.java`, `WordSubmitEvent.java`, `script_GPL_v2.sql` schemas.
  - **Key Finding**: `word_submit_events.vocabulary_word_id` is `NULL`-able in SQL Server (`script_GPL_v2.sql:1367`) and JPA, and `updateWordMastery()` skips `null` words cleanly — enabling real backend Global English Lexicon attacks with `wordType = "GLOBAL"` without DB schema changes or fake vocab rows.
  - **Key Finding**: `raid_sessions` lacks wave index, encounter monster ID, and active spell cooldown columns — 5-wave encounters & spell casts run cleanly in Preview Mode and are documented in a separate backend migration/API draft (`docs/P4B3_BACKEND_DRAFT.md`) pending approval.
- [ ] **Milestone A**: Large Battle Arena & Combat HUD
- [ ] **Milestone B**: Global English Lexicon & Combat Balance
- [ ] **Milestone C**: Learning Loop (Hints, Solvable Board, Journal & Review)
- [ ] **Milestone D**: 5-Wave Encounter System & Boss Mechanics
- [ ] **Milestone E**: Spell System & Pooled Elemental VFX
- [ ] **Milestone F**: Daylight & Moonlight Cozy Themes
- [ ] **Milestone G**: Backend Integration Tests & Full Browser QA
- [ ] **Milestone H**: Vercel Preview Deployment & Final Report
