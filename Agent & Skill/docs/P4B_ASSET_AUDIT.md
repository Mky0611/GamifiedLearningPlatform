# BÁO CÁO KIỂM TOÁN TÀI NGUYÊN HÌNH ẢNH TOÀN DIỆN — PHASE P4-B
## LEX RAID COMPREHENSIVE ASSET AUDIT & PIPELINE REPORT

**Thời điểm cập nhật:** 2026-11-25  
**Dự án:** Gamified Learning Platform — Lex Raid  
**Tập tin công cụ:** `src/main/resources/tools/audit_assets.py`  
**Dữ liệu đi kèm:** `docs/P4B_ASSET_INVENTORY.csv`, `docs/P4B_ASSET_MANIFEST.json`, `docs/P4B_ASSET_RENAME_MAP.csv`, `docs/p4b_actual_renames.json`  

---

## 1. TỔNG QUAN DỮ LIỆU KIỂM TOÁN THỰC TẾ (POST-RENAME AUDIT)

Chạy kiểm toán sau khi hoàn tất dọn dẹp pipeline và đổi tên an toàn (loại trừ `.git`, `.idea`, `.mvn`, `.vercel`, `.vscode`, `__pycache__`, `node_modules`, `qa_audit`, `target`, `test_output`, `vendor`):
- **Tổng số tài nguyên media thực tế trong dự án:** **316 assets** (contact sheets đã tách ra khỏi `FrontEnd/assets/qa_audit/` vào `test_output/asset_audit/`).
- **Phân loại trạng thái tên file (`classification`):**
  - `actual_renamed`: **123 files** (đã thực sự `git mv` sang chuẩn kebab-case, không trùng tên).
  - `canonical_path`: **35 files** (đạt chuẩn sẵn từ trước).
  - `legacy_compatibility_alias`: **83 files** (giữ nguyên đường dẫn tương thích cho Java `AccountServiceImpl.java` như `imgs/avatar1..3.png` hoặc trang tĩnh hiện hành).
  - `pending_review`: **75 files** (tài nguyên cũ hoặc chưa rõ nguồn/chưa sử dụng — không xóa mù).
- **Phân loại bản quyền (`license_status`):**
  - `derived_from_project_assets`: **16 files** (các chân dung/logo được cắt/tổng hợp từ asset hiện có).
  - `unverified_license`: **300 files** (chưa có metadata giấy phép gốc xác minh tự động trong repo).
- **Số tài nguyên còn vấn đề đặt tên trên nhánh tương thích/chờ duyệt:** **68 files**.

---

## 2. XỬ LÝ TỪNG NHÓM TÀI NGUYÊN TRỌNG ĐIỂM

### A. Logo Thương Hiệu & Favicon (`assets/imgs/`)
- Nguyên bản từ commit `7350529`: `2816 x 1536 px` (~5.87 MB), nền tím lavender.
- Dùng `src/main/resources/tools/optimize_logo.py` tự động dò khoảng trống alpha tách riêng biểu tượng khiên/sách khỏi chữ `"LEX RAID"` (tránh cắt dở chữ):
  - `assets/imgs/logo-mark.png`: **`192 x 192 px`** (**42.78 KB**) — dùng cho Navbar `.brand__logo` (`40x40`).
  - `assets/imgs/favicon.png`: **`64 x 64 px`** (**8.34 KB**) — favicon / icon trang chủ.
  - `assets/imgs/logo.png` & `logo-clean.png`: **`281 x 240 px`** (**65.94 KB**) — lockup toàn phần trang chủ (giảm ~98.9% dung lượng so với 5.87 MB).

### B. Avatar Người Chơi & Đồng Bộ Danh Tính Boss/Hero (`assets/ui/avatars/`)
- Triệt tiêu **21.94 MB** wallpaper (`imgs/avatar1..3.png`) khỏi giao diện frontend bằng 15 pixel portraits (`1–14 KB`, tổng `< 30 KB`), trong khi giữ file gốc trên đĩa để không làm gãy hằng số đường dẫn trong `AccountServiceImpl.java`.
- Các chân dung boss (`portrait-boss-*.png`) được sinh trực tiếp từ frame idle của 9 Boss đã đổi tên chuẩn hóa tại `assets/bosses/<boss>/boss-<boss>-<mode>-<nn>.png`.

### C. Đổi Tên Bosses & UI Icons An Toàn (`git mv`)
- **117 spritesheets/frames Boss** chuyển từ `assets/monsters/treasure/<boss>/<mode>/<Space Name>.png` sang `assets/bosses/<boss>/boss-<boss>-<mode>-<nn>.png` (ví dụ `boss-crabby-attack-01.png`, `boss-fierce-attack-01.png`), cập nhật đồng bộ `raid-config.js` (`130/130` dynamic URLs PASS `check_case_sensitivity.py`) và `generate_portraits.py`.
- **UI icons** kiểm tra trực quan từ contact sheets:
  - `imgs/Icon_10.png` -> `ui/icons/icon-settings.png` (bánh răng).
  - `imgs/Icon_11.png` -> `ui/icons/icon-info.png` (icon thông tin).
  - `ui/icons/icon-05.png` -> `ui/icons/icon-sword.png` (thanh kiếm thật).
  - `ui/icons/icon-09.png` -> `ui/icons/icon-cross-red.png` (dấu X đỏ).
  - `ui/icons/icon-01.png` -> `ui/icons/icon-mallet.png` (búa gỗ).
- **Arena background**: `imgs/fantasy_bg.png` -> `backgrounds/fantasy-arena-bg.png`.

---

## 3. HỒ SƠ KIỂM CHỨNG ĐƯỜNG DẪN (`STATIC PASS`)
- `check_case_sensitivity.py`: Quét **712 file** trên đĩa và **130 URL Phaser** từ `raid-config.js` $\rightarrow$ **0 missing, 0 case mismatch**.
- `smoke_check.py`: **0 JS syntax errors, 0 missing DOM ids, 0 missing asset paths**.
