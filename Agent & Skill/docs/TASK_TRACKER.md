# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 25/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh hiện tại:** `feature/p4b-fantasy-pixel-redesign`  

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN

| Giai đoạn | Nội dung trọng tâm | Trạng thái | Đánh giá & Tiến độ |
| :---: | :--- | :---: | :--- |
| **SEC** | **Security Post-Audit & Credential Sanitization** | **COMPLETED** | Mã nguồn sạch 0 secrets; test scanner 13/13 pass; git history được bảo vệ. |
| **P0** | **Animation, Gameplay UI, Mobile Responsive, Runtime QA** | **CODE COMPLETE** | Sửa 9 lỗi animation/battle; mobile 320px no-scroll; script Playwright sẵn sàng. |
| **P1** | **Pixel RPG Design System & Java 21 / Spring Boot 4.2** | **CODE COMPLETE** | Java 21 LTS & Spring Boot 4.2.0; Design system tokens; minigame & home pixel hóa. |
| **P2** | **Vocabulary Engine, CEFR A1–C2, IT Taxonomy** | **COMPLETE** | Audit DB UTF-16; 2 trục độc lập; Pipeline importer DRY RUN; Thuật toán sinh bàn cờ cân bằng; Volcard & Quiz UI polish. |
| **P3** | **RPG Progression, XP, Coins, Level, Sessions & Profile** | **COMPLETE** | Động cơ cấp độ O(1); Toàn vẹn dữ liệu thưởng (Verified Score); Chống hack điểm/thắng giả; Khóa bi quan chống double reward & mất XP; 20/20 Unit Tests PASS. |
| **P4-A** | **Vercel Preview Deployment (Frontend Static + Fallbacks)** | **COMPLETED (VERIFIED LIVE)** | Triển khai production Vercel thành công; routing 11 pages; probe 16/16 endpoints đạt HTTP 200 OK; không catch-all `/api/**` (404). |
| **P4-B** | **Pure Fantasy Pixel RPG Redesign, Asset Audit & Visual QA** | **COMPLETED (PASS 43/43)** | Kiểm toán 306 assets; tối ưu logo (16.7KB) & avatar (1-5KB) tiết kiệm ~28MB/lần tải; hero 1.35x, boss 2.8x-3.6x, chân Y=350 diff<0.01px; life bar không tràn; Volcard clamp ngừa gãy chữ; thống nhất 5-link Dark Oak Tavern bar; 100% loại bỏ dev-speak trên 9 pages. |
| **P5** | **Docker, CI/CD, Containerized Deployment** | `TODO` | Dockerfile, docker-compose, script build tự động, môi trường test. |

---

## 2. CHI TIẾT CÁC TASKS GIAI ĐOẠN P4-B (FANTASY PIXEL RPG REDESIGN)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu & Kết quả |
| :--- | :--- | :---: | :--- | :--- |
| **P4-B01** | UI/UX Research & Reference Analysis | **DONE (PASS)** | `docs/P4B_UI_UX_RESEARCH.md` | Khảo sát 5 hướng thiết kế, tham chiếu Kenney Pixel UI, MDN pixel art, WCAG 2.2, Stardew Valley, Sea of Stars; phác thảo wireframes desktop & mobile. |
| **P4-B02** | Full Asset Audit & Manifest Generation | **DONE (PASS)** | `tools/audit_assets.py`, `docs/P4B_ASSET_AUDIT.md`, `P4B_ASSET_MANIFEST.json`, `P4B_ASSET_INVENTORY.csv` | Kiểm toán 306 media assets (86.17 MB), phát hiện 98 duplicates, 121 naming issues; xuất bản contact sheets trong `assets/qa_audit/`. |
| **P4-B03** | Asset Naming Standard & Aliasing | **DONE (PASS)** | `docs/P4B_ASSET_RENAME_MAP.csv`, `check_case_sensitivity.py` | Áp dụng quy chuẩn kebab-case không phá vỡ liên kết cũ; 129/129 URLs Phaser kiểm tra đạt 0 missing, 0 case mismatch. |
| **P4-B04** | Identity Mapping & 64x64 Pixel Portraits | **DONE (PASS)** | `tools/generate_portraits.py`, `assets/ui/avatars/portrait-*.png` | Tạo 9 boss portraits + 3 hero portraits; đồng bộ chính xác avatar HUD với sprite xuất hiện trong đấu trường. |
| **P4-B05** | Pure Fantasy Pixel Design Tokens | **DONE (PASS)** | `pixel-rpg.css`, `docs/P4B_UI_COMPONENT_CATALOG.md` | Hệ thống design tokens Dark Oak Tavern, Parchment Scroll, Gold Trims; 9-slice components, pixel bars, pixel inputs, modal boxes. |
| **P4-B06** | Typography Overhaul & Test Suite | **DONE (PASS)** | `tools/test_typography.py`, `docs/P4B_TYPOGRAPHY_RESEARCH.md` | Nhập Silkscreen + VT323 + Be Vietnam Pro; kiểm thử 14 chuỗi ký tự khắt khe (tiếng Việt có dấu, thuật ngữ IT dài): 14/14 PASS. |
| **P4-B07** | Logo & Navigation Redesign | **DONE (PASS)** | `tools/optimize_logo.py`, `base.css`, `assets/imgs/logo.png` | Cắt gọn logo từ 5.87 MB xuống 16.74 KB transparent retina asset; thanh điều hướng Dark Oak Tavern `#241a14` thống nhất 5 mục. |
| **P4-B08** | Battle Screen Redesign (Hero/Boss Scale & Fold) | **DONE (PASS)** | `raid-config.js`, `minigame.html`, `minigame.css` | Tăng tỷ lệ Hero lên 1.35x, Boss lên 2.8x–3.6x; chân căn chuẩn $Y=350.00\text{px}$ (diff $< 0.0108\text{px}$); thu gọn stage (max 360px), dock và word board hiển thị trọn vẹn trong viewport; sửa tràn thanh máu HP. |
| **P4-B09** | Sửa Lỗi Escaped Raw HTML Trong Battle Status | **DONE (PASS)** | `minigame.js` | Loại bỏ lỗi escape `<span class="pixel-chip"...>` thành raw string `&lt;span...&gt;` trong `renderStatus()`. |
| **P4-B10** | Trang Chủ (Home Page) Fantasy Redesign | **DONE (PASS)** | `home.html`, `home.css`, `home.js` | Thay thế dev-speak bằng cốt truyện hiệp sĩ; thay avatar 22MB bằng pixel avatar 5KB; cập nhật nút `.pixel-btn` và căn chỉnh layout. |
| **P4-B11** | Trang Kho Từ Vựng (Volcard) Redesign | **DONE (PASS)** | `volcard.html`, `volcard.css` | Giao diện Kinh Thư Cổ Đại (Ancient Spellbook); áp dụng CSS `clamp()` ngăn ngừa gãy từ `POLYMORPHISM`; định dạng CEFR pills chuẩn màu. |
| **P4-B12** | Trang Hồ Sơ Nhân Vật (Account Loadout) Redesign | **DONE (PASS)** | `account.html`, `account.css`, `account.js`, `api.js` | Giao diện RPG Character Sheet; xóa bỏ toàn bộ dev-speak ("FE first, BE ready", "Khóa lưu BE"); loại bỏ 22MB avatar wallpapers. |
| **P4-B13** | Redesign Các Trang Minigame Còn Lại & Auth | **DONE (PASS)** | `quiz.html`, `memory.html`, `speed-math.html`, `code-puzzle.html`, `auth.html`, `games-lite.css`, `auth.css` | Đồng bộ font chữ, pixel-rpg.css, navbar 5 mục, theme Dark Oak Tavern và cốt truyện phiêu lưu trên 100% các trang. |
| **P4-B14 & 15** | Kiểm Thử Responsive & Visual QA Toàn Diện | **DONE (PASS)** | `tools/test_p4b_verification.py`, `docs/P4B_VISUAL_QA_REPORT.md` | Kiểm thử 43/43 tiêu chí đạt PASS: 7 viewports (320px đến 1920px), tap targets $\ge 40\text{px}$, độ tương phản WCAG 2.2 AA (11.22:1 - 17.14:1). |
| **P4-B16** | Cập Nhật Tài Liệu Kỹ Thuật & Tracking | **DONE (PASS)** | `TASK_TRACKER.md`, `CURRENT_STATE.md`, `QA_REPORT.md`, `DESIGN_SYSTEM.md`, `CHANGELOG_DEV.md` | Đồng bộ đầy đủ báo cáo, bảng đối chiếu trước/sau, tài liệu thiết kế. |
| **P4-B17** | Phân Nhóm Commit, Push Git & Vercel Preview Deploy | **IN PROGRESS** | Git branch `feature/p4b-fantasy-pixel-redesign` | Tạo các commit nhóm logic, push nhánh, deploy Vercel và xác minh trực tiếp. |

---

## 3. CHI TIẾT CÁC TASKS GIAI ĐOẠN P4-A (VERCEL PREVIEW DEPLOYMENT)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu & Kết quả |
| :--- | :--- | :---: | :--- | :--- |
| **P4-A1** | Cấu hình Vercel Routing & Clean URLs | **DONE (PASS)** | `FrontEnd/vercel.json`, `vercel.json` | Cấu hình 11 routes chính; map `/ui/assets/**` sang `/assets/**`; không dùng catch-all; API trả về 404 sạch sẽ. |
| **P4-A2** | Kiểm toán Phân biệt Hoa/Thường (Linux Case Sensitivity) | **DONE (PASS)** | `check_case_sensitivity.py` | Kiểm tra toàn bộ 348 file trên đĩa và 129 URLs animation động trong `raid-config.js`: 0 missing assets, 0 case mismatches. |
| **P4-A3** | Nâng cấp Giao diện Chế độ Xem trước (Preview Mode) | **DONE (PASS)** | `minigame.js`, `home.js`, `account.js`, `auth.html` | Hiển thị rõ chip và banner Preview Mode; giải thích rõ dữ liệu demo chưa đồng bộ DB; không tạo phần thưởng ảo. |
| **P4-A4** | Tài liệu Hướng dẫn Triển khai Vercel | **DONE (PASS)** | `docs/VERCEL_DEPLOYMENT.md` | Tài liệu nghiệm thu chi tiết, bảng routes, hướng dẫn và kết quả probe trực tiếp. |
| **P4-A5** | Triển khai Production & Probe Trực tiếp | **DONE (PASS)** | `tools/probe_deployment.py` | Triển khai thành công tới `https://gamified-learning-platform-sandy.vercel.app`; probe 16/16 endpoints đạt HTTP 200 OK (0 fail). |
