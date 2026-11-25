# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 2026-11-25  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh hiện tại:** `feature/p4b2-kingdom-of-words`

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN (PHÂN LOẠI BẰNG CHỨNG CHUẨN)

| Giai đoạn | Nội dung trọng tâm | Mức chứng nhận | Chi tiết & Ghi chú |
| :---: | :--- | :---: | :--- |
| **SEC** | Security Post-Audit & Credential Sanitization | **STATIC PASS** | Scanner sạch working tree; không chứa secret mới trong mã nguồn. |
| **P0/P1** | Java 21 / Spring Boot 4.2.0 / Pixel UI Foundation | **CODE COMPLETE / BROWSER PASS (FE)** | Giao diện FE & responsiveness đã nghiệm thu trên Chromium thật; Backend live SQL `NOT TESTED`. |
| **P2** | Vocabulary Engine, CEFR A1–C2, IT Taxonomy | **UNIT PASS (3/3) / STATIC REVIEW** | DB seed audit (2,098 rows); giữ nguyên dịch vụ & dữ liệu. |
| **P3** | RPG Progression, XP, Coins, Level, Idempotency | **UNIT PASS (20/20)** | Java 21 Mockito tests pass ở P3; không sửa công thức/schema ở P4-B.2. |
| **P4-A** | Vercel Static Deployment & Preview Mode Fallbacks | **HTTP PASS (P4-A)** | `vercel.json` routing clean, `/api/**` 404 kích hoạt Preview fallback. |
| **P4-B** | Visual Acceptance, Asset Normalization & Browser QA | **STATIC PASS (43/43) & BROWSER PASS** | Audit assets, logo/nav, Volcard fit, Battle 9/9 viewports, XSS-safe DOM. |
| **P4-B.2** | Kingdom of Words — Asset-Driven Pixel RPG, Skills, VFX & World Env | **STATIC PASS & BROWSER PASS (0 failures)** | Milestones A–H hoàn tất: curated 113 runtime assets, stitched 9-slice, fixed cursors, `WorldEnvironment`, `BattleScene` FSM + pooled VFX, 6 Knight Skills Preview, Slime & Skeleton Preview, 9/9 viewports + 9/9 pages PASS trên Chrome thật. |
| **P5** | Docker, CI/CD, Containerized Deployment | `TODO` | Chưa thực hiện. |

---

## 2. CHI TIẾT MILESTONES P4-B.2

| Milestone | Nội dung | Bằng chứng | Kết quả |
| :---: | :--- | :--- | :---: |
| **B.2A** | Asset audit (`UI Extra`), license verification, fixed swapped cursors, manifest CSV/JSON | `docs/P4B2_ASSET_MANIFEST.json`, `docs/P4B2_COMPONENT_ASSET_MAP.csv`, `curate_p4b2_assets.py` | **DONE** |
| **B.2B** | Asset-driven Fantasy Design System, contiguous 9-slice/3-slice CSS, `Lora` + `Pixelify Sans` + `Be Vietnam Pro`, Adventure Guild Nav | `pixel-rpg.css`, `base.css`, `typography-specimen.html` | **DONE** |
| **B.2C** | Shared Animated World Environment System (`village`, `forest`, `mountain-dusk`, `academy`, `gate`, `waterfall`) | `world-environment.js` | **DONE** |
| **B.2D** | Knight Animation Engine FSM (`IDLE`..`VICTORY`), `Warrior_Attack2`, Pooled VFX, Canvas fallback parity | `battle-scene.js`, `boot-scene.js`, `raid-config.js`, `raid-phaser-embed.js` | **DONE** |
| **B.2E** | 6 Knight Skills (Preview Mode) + `Verdant Slime` & `Cursed Skeleton` Preview + Backend Reviewer compatibility check | `minigame.js`, `docs/P4B2_DECISIONS.md` | **DONE** |
| **B.2F** | All 9 Pages Redesign, compact Royal Academy hero, English/IT fallback quiz questions, `320x568` & `1440x900` layout fit | `home.*`, `volcard.html`, `account.html`, `quiz.html`, `games-lite.*`, `auth.*`, `minigame.*` | **DONE** |
| **B.2G** | Performance hygiene (removed heavy `background.png` & multi-MB `map*.gif` page refs, route-scoped lightweight assets) | Static asset audit (`0` missing) | **DONE** |
| **B.2H** | Real Headless Chromium QA (`0` failures), docs sync, Git commit/push & Vercel Preview deploy (NO `--prod`) | `chromium_p4b2_acceptance.js`, `docs/P4B2_QA_REPORT.md` | **DONE / DEPLOYING PREVIEW** |
