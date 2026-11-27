# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 2026-11-27  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát hành:** `feature/p4b3-rpg-combat-learning`

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN (PHÂN LOẠI BẰNG CHỨNG CHUẨN)

| Giai đoạn | Nội dung trọng tâm | Mức chứng nhận | Chi tiết & Ghi chú |
| :---: | :--- | :---: | :--- |
| **SEC** | Security Post-Audit & Credential Sanitization | **STATIC PASS** | Không lộ secret/token hay QA hook ra public domain. |
| **P0/P1** | Java 21 / Spring Boot 4.2.0 / Pixel UI Foundation | **CODE COMPLETE / BROWSER PASS (FE)** | Giao diện FE & responsiveness đã nghiệm thu trên Chromium thật; Backend live SQL `NOT TESTED`. |
| **P2** | Vocabulary Engine, CEFR A1–C2, IT Taxonomy | **UNIT PASS / STATIC REVIEW** | DB seed audit; giữ nguyên dịch vụ & dữ liệu. |
| **P3** | RPG Progression, XP, Coins, Level, Idempotency | **UNIT PASS** | Java 21 Mockito tests pass (`26/26`). |
| **P4-A** | Vercel Static Deployment & Preview Mode Fallbacks | **HTTP PASS** | `vercel.json` routing clean, `/api/**` trả về 404 kích hoạt Preview fallback. |
| **P4-B / B.2** | Visual Redesign, 9-Slice UI, Animation FSM & World Env | **STATIC PASS (43/43) & BROWSER PASS** | Curated runtime assets, FSM pooled VFX, Canvas 2D fallback, 9/9 viewports PASS. |
| **P4-B.3** | Final Polish, Post-Release Correction, 5-Wave QA, SEO & Production Release | **BACKEND UNIT PASS (26/26), STATIC PASS (43/43), SCOPED CONTRAST (0), SEO PASS, BROWSER PASS (0)** | Hoàn tất tới `870faac`, deploy **Vercel Production** & verify live. |
| **P5 (Frontend Demo + Parity)** | Path of Legends: 4 Heroes (`Arcane Mage`), 27 Evolved Skills (Lv1–3), 10 Animation Profiles, 6-Tab Character Hall, Chapter Map | **BACKEND UNIT PASS (28/28), STATIC PASS (43/43), CONTRAST (0), SEO PASS, BROWSER PASS (0)** | P5 progression chạy Demo cục bộ (`localStorage`), backend P5 migration vẫn ở dạng draft; SQL Server live `NOT TESTED`. |
| **P5.1 (Progression Integrity & Full QA)** | Fix Mage lock, strict SP/unlock/loadout/stage-lock rules, Word Mastery Recall UI, Multi-hit HP ticks, `27/27` skills matrix, Boss HP carry-over, SQL Server lock draft | **BACKEND UNIT PASS (29/29), STATIC PASS (43/43), CONTRAST (0), SEO PASS, BROWSER PASS (`27/27` skills, `0` failures)** | Giữ `arcane_mage` ở Demo Only trên DB; SQL Server live `NOT TESTED`. |
| **P5-DB / CI-CD** | Docker, CI/CD & SQL Server Migration Apply cho Skill Tree / Hero Ownership | `DRAFT ONLY` | Bản nháp DDL/API tại `docs/P5_BACKEND_DRAFT.md` chờ phê duyệt DB migration. |

---

## 2. CHI TIẾT MILESTONES P5 PATH OF LEGENDS

| Milestone | Nội dung | Bằng chứng / Tài liệu | Kết quả |
| :---: | :--- | :--- | :---: |
| **P5-A** | Audit & curate 63 asset mới (`Arcane Mage`, `PVFX`, `Mira Forge`, `Byte Kit`, `Questwood`), cô lập `monk`/`rogue` | `docs/P5_ASSET_DELTA.json`, `docs/P4B2_THIRD_PARTY_ASSETS.md` | **DONE** |
| **P5-B** | `RaidRegistry` (4 Hero, 27 Skill, 10 Profile, 5 Stage) & `RaidProgressionStore` (`localStorage` demo + unlock rules) | `raid-registry.js`, `progression-store.js`, `api.js` | **DONE** |
| **P5-C** | Selective boot, lazy VFX loading, 10 Animation Profiles, ranged hold-position & Canvas 2D fallback parity | `boot-scene.js`, `battle-scene.js`, `raid-phaser-embed.js` | **DONE** |
| **P5-D/E** | Playable `Arcane Mage`, evolved Skill Bar (4+1), Victory Demo Reward Unlock Banner & Core Word 60 DMG parity | `minigame.html`, `minigame.css`, `minigame.js` | **DONE** |
| **P5-F/G** | Nâng cấp `/app/account` thành 6-Tab Character Hall + Training Dummy Preview + sửa sạch contrast Daylight/Moonlight (`0` issues) | `account.html`, `account.css`, `account.js`, `base.css` | **DONE** |
| **P5-H** | Parity `LexRaidBalanceConfig.computeCoreWordDamage`, stage-unlock check cho `arcane_mage`, `28/28` Mockito PASS & P5 SQL Draft | `LexRaidServiceImpl.java`, `AccountServiceImpl.java`, `docs/P5_BACKEND_DRAFT.md` | **DONE** |
| **P5-I/J** | Extended Chromium QA (`0` failures), `P5_QA_REPORT.md`, stamp `build-info.json` (`95bdfa5`), push & deploy Production | `95bdfa5`, `docs/P5_QA_REPORT.md` | **DONE** |
| **P5.1-K** | Mage unlock decoupling, strict unlock/loadout/stage-lock guards, Word Mastery Recall, `27/27` skills + 5-run telemetry (`0` failures), Backend readiness | `docs/P5_QA_REPORT.md`, `docs/P5_CHECKPOINT.md` | **DONE** |
