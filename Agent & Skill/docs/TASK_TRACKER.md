# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 2026-11-25  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh hiện tại:** `feature/p4b3-rpg-combat-learning`

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN (PHÂN LOẠI BẰNG CHỨNG CHUẨN)

| Giai đoạn | Nội dung trọng tâm | Mức chứng nhận | Chi tiết & Ghi chú |
| :---: | :--- | :---: | :--- |
| **SEC** | Security Post-Audit & Credential Sanitization | **STATIC PASS** | Scanner sạch working tree; không chứa secret mới trong mã nguồn. |
| **P0/P1** | Java 21 / Spring Boot 4.2.0 / Pixel UI Foundation | **CODE COMPLETE / BROWSER PASS (FE)** | Giao diện FE & responsiveness đã nghiệm thu trên Chromium thật; Backend live SQL `NOT TESTED`. |
| **P2** | Vocabulary Engine, CEFR A1–C2, IT Taxonomy | **UNIT PASS / STATIC REVIEW** | DB seed audit (2,098 rows); giữ nguyên dịch vụ & dữ liệu. |
| **P3** | RPG Progression, XP, Coins, Level, Idempotency | **UNIT PASS** | Java 21 Mockito tests pass (`LexRaidProgressionTest` 4/4, `QuizProgressionTest` 5/5, `RpgProgressionServiceTest` 9/9, `AccountProfileServiceTest` 2/2). |
| **P4-A** | Vercel Static Deployment & Preview Mode Fallbacks | **HTTP PASS (P4-A)** | `vercel.json` routing clean, `/api/**` 404 kích hoạt Preview fallback. |
| **P4-B / B.2** | Visual Redesign, 9-Slice UI, Animation FSM & World Env | **STATIC PASS (43/43) & BROWSER PASS** | Curated runtime assets, FSM pooled VFX, Canvas 2D fallback, 9/9 viewports PASS. |
| **P4-B.3** | RPG Combat, English Learning Loop & Cozy Fantasy Themes | **BACKEND UNIT PASS (23/23), STATIC PASS (43/43) & BROWSER PASS (0 failures)** | Milestones A–G hoàn tất: Global English Lexicon (`76,993` words), Topic `+30%`, Hints & Review, 5-Wave + Spells, Daylight & Moonlight Cozy Themes trên toàn bộ trang. |
| **P5** | Docker, CI/CD & SQL Server Migration Apply | `TODO (DRAFT ONLY)` | Bản nháp DDL/API tại `docs/P4B3_BACKEND_DRAFT.md`. |

---

## 2. CHI TIẾT MILESTONES P4-B.3

| Milestone | Nội dung | Bằng chứng / Commit | Kết quả |
| :---: | :--- | :--- | :---: |
| **B.3A** | Large Battle Arena (`960x360`, `273px` desktop), Hero `~1.56x` / Rarity Boss scale, compact HUD, `Be Vietnam Pro` tiles | `0d94b86` | **DONE** |
| **B.3B** | Offline `en-wl/wordlist/v2` (`76,993` words), `LexRaidBalanceConfig`, `EnglishLexiconService`, authoritative board path check | `d917f37`, `LexRaidGlobalLexiconTest` (`3/3`) | **DONE** |
| **B.3C** | Compact Word Toast + TTS, Hint Toolbar (`Meaning`/`Reveal`/`Refresh`), 20-seed solvable board, Word Journal & Post-battle Review | `22fc098` | **DONE** |
| **B.3D** | Campaign (`45s` Ch1 -> faster) vs Practice (`∞`), 5-Wave Encounters, Boss Traits & Phase 2, Core Word Lexical Judgment | `bad2934` | **DONE** |
| **B.3E** | Expanded Spell Registry (`Fire Blade`, `Frost Seal`, `Thunder Strike`), Burn/Frost/Stun statuses, filtered $\le 6$ hotbar | `bec8235` | **DONE** |
| **B.3F** | Cozy **Daylight** & **Moonlight** palettes (`theme.css`/`theme-system.js`) trên toàn trang + Sun/Moon toggle + Biome Combat restoration | `25834b7` | **DONE** |
| **B.3G** | Backend Draft (`P4B3_BACKEND_DRAFT.md`), `23/23` Java Unit PASS, Chromium Full QA (`0` failures), docs & mirrors sync | `docs/P4B3_QA_REPORT.md` | **DONE** |
| **B.3H** | Git push + NEW Vercel Preview deploy (KHÔNG `--prod`) + live check | Đang thực hiện | **NEXT** |
