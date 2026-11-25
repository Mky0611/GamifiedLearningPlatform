# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 2026-11-25  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh hiện tại:** `feature/p4b-fantasy-pixel-redesign`  

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN (PHÂN LOẠI BẰNG CHỨNG CHUẨN)

| Giai đoạn | Nội dung trọng tâm | Mức chứng nhận | Chi tiết & Ghi chú |
| :---: | :--- | :---: | :--- |
| **SEC** | Security Post-Audit & Credential Sanitization | **STATIC PASS** | Scanner sạch working tree; không chứa secret mới trong mã nguồn. |
| **P0/P1** | Java 21 / Spring Boot 4.2.0 / Pixel UI Foundation | **CODE COMPLETE / BROWSER PASS (FE)** | Giao diện FE & responsiveness đã nghiệm thu trên Chromium thật ở P4-B; Backend runtime live SQL `NOT TESTED` trong phiên này. |
| **P2** | Vocabulary Engine, CEFR A1–C2, IT Taxonomy | **UNIT PASS (3/3) / STATIC REVIEW** | DB seed audit (2,098 rows); Importer DRY RUN + `VolcardServiceImpl`/`LexRaidServiceImpl` giữ nguyên. |
| **P3** | RPG Progression, XP, Coins, Level, Idempotency | **UNIT PASS (20/20)** | Java 21 Mockito unit tests pass ở P3 (`Pessimistic Locking`, Anti-Double-Reward). Live SQL concurrency `NOT TESTED`. |
| **P4-A** | Vercel Static Deployment & Preview Mode Fallbacks | **HTTP PASS (P4-A)** | `probe_deployment.py` đạt 16/16 HTTP 200 OK trên URL P4-A; routing clean, `/api/**` trả 404 kích hoạt fallback. |
| **P4-B** | Visual Acceptance, Asset Normalization & Browser QA | **STATIC PASS (43/43) & BROWSER PASS** | Audit 316 assets (`123 actual_renamed`), logo emblem+mark tách sạch, typography specimen, Volcard fit, Battle 9/9 viewports `fit=true` & `canvasClipped=false`, XSS-safe `renderStatus()`, Canvas fallback OK. |
| **P5** | Docker, CI/CD, Containerized Deployment | `TODO` | Chưa thực hiện. |

---

## 2. CHI TIẾT CÁC TASKS P4-B VISUAL ACCEPTANCE & ASSET CORRECTION

| Task | Nội dung | Bằng chứng | Kết quả thực tế |
| :--- | :--- | :--- | :--- |
| **Task 1** | Sửa phân loại QA trung thực (`STATIC` vs `HTTP` vs `BROWSER` vs `NOT TESTED`) | `QA_REPORT.md`, `P4B_VISUAL_QA_REPORT.md`, `TASK_TRACKER.md`, `CURRENT_STATE.md` | **DONE** |
| **Task 2** | Đổi tên 123 assets chuẩn semantic (`git mv`), phân loại rõ 316 assets, không xóa file pending/compat | `docs/P4B_ASSET_RENAME_MAP.csv`, `docs/p4b_actual_renames.json`, `raid-config.js` | **DONE** (`actual_renamed=123`) |
| **Task 3** | Sửa pipeline `audit_assets.py` loại thư mục rác, chuyển contact sheets sang `test_output/asset_audit/` | `src/main/resources/tools/audit_assets.py`, `git rm -rf FrontEnd/assets/qa_audit` | **DONE** (`STATIC PASS`) |
| **Task 4** | Cắt tách `logo-mark.png` (`192x192`), `favicon.png` (`64x64`), thống nhất nav 5 link & contrast drawer | `optimize_logo.py`, `base.css`, 9 trang HTML | **DONE** (`BROWSER PASS`) |
| **Task 5** | Typography specimen (`/app/typography`), kiểm tra dấu tiếng Việt & fallback trong Chromium | `typography-specimen.html`, `P4B_TYPOGRAPHY_RESEARCH.md` | **DONE** (`BROWSER PASS`) |
| **Task 6** | Volcard word fit (gỡ ellipsis/nowrap, xếp dọc TTS, auto-fit `POLYMORPHISM` & `CONTINUOUS INTEGRATION`) | `volcard.css`, `volcard.js` | **DONE** (`BROWSER PASS`) |
| **Task 7** | Battle Visual QA 9 viewports, sửa cắt canvas trên 768/1024/1920, test Phaser + `?renderer=canvas` | `minigame.css`, `battle-scene.js`, `raid-phaser-main.js` | **DONE** (`9/9 BROWSER PASS`) |
| **Task 8** | Bỏ `<span` raw HTML shortcut trong `minigame.js` `renderStatus()`, render DOM an toàn | `src/main/resources/FrontEnd/assets/js/minigame.js` | **DONE** (`BROWSER PASS`) |
| **Task 9** | Automation Headless Chromium toàn diện (`chromium_p4b_acceptance.js`), ảnh chụp & DOM rects thật | `Agent & Skill/scripts/chromium_p4b_acceptance.js`, `test_output/p4b_browser/` | **DONE** (`BROWSER PASS`) |
| **Task 10** | Commit có cấu trúc, push `feature/p4b-fantasy-pixel-redesign`, deploy Vercel Preview (NO `--prod`) | Git + Vercel CLI Preview URL | **IN PROGRESS** |
