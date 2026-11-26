# LEX RAID — P5 CHECKPOINT (PATH OF LEGENDS)

**Nhánh:** `feature/p4b3-rpg-combat-learning` (code SHA `95bdfa5`)  
**Cập nhật:** 2026-11-26  

| Milestone | Status | Files | Decisions | Tests | Blockers | Next action |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **P5-A Asset Audit** | `DONE` | `audit_p5_assets.py`, `P5_ASSET_DELTA.json`, `assets/units/arcane_mage/*`, `assets/effects/vfx/p5/*`, `assets/ui/{questwood,progression}/*` | Chọn 4 Hero hợp lệ (`warrior`, `archer`, `lancer`, `arcane_mage`); giữ `monk` (`LICENSE_PENDING`) và `rogue` (`32x32` mismatch) ở backlog | `audit_p5_assets.py --curate` | None | Implement P5-B Registries (`raid-registry.js`, `progression-store.js`) |
| **P5-B Registry Architecture** | `DONE` | `raid-registry.js`, `progression-store.js`, `api.js` | Single source of truth cho 4 Hero, 27 Skill Lv 1–3, 10 Profile; legacy starter (`warrior`, `archer`, `lancer`) preserved | Pending browser QA | None | — |
| **P5-C Animation Profiles** | `DONE` | `raid-config.js`, `boot-scene.js`, `battle-scene.js`, `raid-phaser-embed.js` | Lazy VFX/Hero/Boss loading; 10 profiles & ranged hold-position + Canvas fallback parity | Pending browser QA | None | — |
| **P5-D/E Heroes, Skills & Evolution** | `DONE` | `minigame.html`, `minigame.css`, `minigame.js` | Arcane Mage (`210x180`, `originY=0.9222`), 4+1 Loadout hotbar, Lv1–3 evolution stats, Core Word 60 DMG parity | Pending browser QA | None | — |
| **P5-F/G Character Hall, Chapter Map & Rewards** | `DONE` | `account.html`, `account.js`, `account.css`, `base.css` | 6-tab Character Hall + Training Dummy Preview (zero reward mutation) + Victory Unlock UI | Pending contrast & Chromium QA | None | Start P5-H Backend Parity & Draft |
| **P5-H Backend Parity & Draft** | `DONE` | `LexRaidBalanceConfig.java`, `LexRaidServiceImpl.java`, `AccountServiceImpl.java`, `docs/P5_BACKEND_DRAFT.md`, `LexRaidGlobalLexiconTest.java`, `AccountProfileServiceTest.java` | Thống nhất Core Word damage >=55 + server-side stage-clear check cho `arcane_mage` trong `saveLoadout`; draft SQL Server DDL cho P5 | `28/28` Mockito PASS (`MainTests` SQL offline `NOT TESTED`) | SQL Server offline locally | Commit & release to Production |
| **P5-I/J Regression & Prod Release** | `DONE` | `chromium_p4b2_acceptance.js`, `audit_contrast_chromium.js`, `P5_QA_REPORT.md`, `build-info.json`, docs | `43/43` static, `0/134` asset mismatch, SEO PASS, contrast `0` issues (9 pages + 6 Hall tabs), Chromium E2E `0` failures | Full local QA PASS | None (ready to push & deploy `--prod`) | Stamp `build-info.json`, push & verify live Vercel Production |
