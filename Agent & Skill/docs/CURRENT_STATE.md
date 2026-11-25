# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-25  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát triển:** `feature/p4b-fantasy-pixel-redesign`  
**Trạng thái hiện tại:** **PHASE P4-B VISUAL ACCEPTANCE & ASSET CORRECTION VERIFIED IN CHROMIUM — READY FOR PREVIEW DEPLOY**  

---

## 1. TỔNG QUAN HỆ THỐNG (GIỮ NGUYÊN KHÔNG PHÁ VỠ)
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security (không sửa đổi trong P4-B).
- **Database:** Microsoft SQL Server (`script_GPL_v2.sql` — 57 bảng, không thay đổi schema).
- **Frontend:** Vanilla HTML5, CSS3 Pure Fantasy Pixel Design System, ES6+ JS, Phaser 3.90.0 + Canvas 2D Fallback.

---

## 2. TỔNG HỢP CÁC THAY ĐỔI ĐÃ XÁC MINH Ở P4-B ACCEPTANCE

1. **Asset Hygiene & Semantic Naming (`STATIC PASS`):**
   - Quét sạch 316 media assets trong `src/main/resources/FrontEnd/assets/` sau khi gỡ `assets/qa_audit/` ra ngoài cây public (`test_output/asset_audit/`).
   - 123 assets đổi tên chuẩn via `git mv` (`117` boss spritesheets vào `assets/bosses/<boss>/`, `5` UI icons sau kiểm tra contact sheet, `1` battle background vào `assets/backgrounds/`). `check_case_sensitivity.py` pass **712 disk files / 130 Phaser URLs / 0 errors**.
2. **Logo & Unified Navigation (`BROWSER PASS`):**
   - `logo-mark.png` (`192x192`, 42.78 KB) hiển thị sắc nét `40x40` không cắt chữ trên thanh điều hướng gỗ tối (`#241a14`) ở cả 9 trang HTML; drawer mobile dùng chữ kem `#f3e4be` tương phản cao trên nền `#241a14`.
3. **Typography & Volcard Readability (`BROWSER PASS`):**
   - Trang `/app/typography` xác nhận Chromium load đủ 5 font (`Silkscreen` cho ASCII HUD/số, `Be Vietnam Pro` cho tiếng Việt & mặt chính từ vựng, `JetBrains Mono`/`VT323` cho code/chỉ số).
   - Volcard gỡ bỏ `nowrap`/`ellipsis`, xếp nút nghe phát âm gọn dưới từ, hiển thị trọn vẹn `POLYMORPHISM`, `CONTINUOUS INTEGRATION`, `AUTHENTICATION`, `INFRASTRUCTURE` từ `320x568` tới `1366x768` (`clippedX=false`, `ttsOverlap=false`).
4. **Battle Arena Render & Above-The-Fold (`9/9 BROWSER PASS`):**
   - Sửa lỗi CSS Grid khiến canvas Phaser bị cắt chân ở `768x1024`, `1024x768`, `1920x1080` (`canvasClipped: false` tất cả 9/9 viewports).
   - Cả 9 viewports (`320x568` đến `1920x1080`) đưa toàn bộ Đấu trường, Dock tấn công, nút Clear/Attack (`>=40px`) và Bàn cờ chữ `5x5` nằm trọn trong màn hình đầu (`fit=true`), `0` lỗi JS console/page, an toàn DOM trong `renderStatus()`.
   - Đã kiểm tra cả `Phaser` (Warrior, Lancer, Archer + 9 Bosses + Guard/Attack) lẫn Canvas 2D Fallback (`?renderer=canvas`).
5. **Untested Boundaries (`NOT TESTED`):**
   - Tương tác trình duyệt nối sống Spring Boot + SQL Server chưa chạy trong phiên này (chỉ test frontend fallback).
