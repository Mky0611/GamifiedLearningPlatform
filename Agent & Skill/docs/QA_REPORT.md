# BÁO CÁO KIỂM THỬ CHẤT LƯỢNG — QA REPORT
## PHÂN LOẠI CHẶT CHẼ BẰNG CHỨNG KIỂM THỬ — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-25  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh kiểm thử:** `feature/p4b-fantasy-pixel-redesign`  

---

## 1. PHÂN LOẠI KẾT QUẢ KIỂM THỬ (TEST MATRIX CHUẨN HÓA)

Mọi kết quả được phân loại đúng bản chất kiểm thử thực tế đã chạy:

| Hạng mục kiểm thử | Loại bằng chứng | Kết quả | Chi tiết quan sát được |
| :--- | :---: | :---: | :--- |
| **Headless Chromium Acceptance (`chromium_p4b_acceptance.js`)** | `BROWSER` | **BROWSER PASS** | Chrome thật qua CDP (`browser_qa_report.json`): 9/9 viewports Battle (`320x568`..`1920x1080`) `fit=true`, `overflow=false`, `canvasClipped=false`, `tapTarget40px=true`, `clear=true`, `attack=true`, `rawHTML=false`; 18/18 trang (`9` trang x Desktop/Mobile) `errs=0`; Canvas fallback OK; Typography specimen 5/5 fonts OK. |
| **Volcard Word Fit & Filter (`chromium_p4b_acceptance.js`)** | `BROWSER` | **BROWSER PASS** | Kiểm tra trực tiếp trên `320x568`, `390x844`, `1366x768`: `polymorphism`, `continuous integration`, `authentication`, `infrastructure` (`clippedX=false`, `ttsOverlap=false`, back card `clippedY=false`); filter `C1` & search `"continuous"` OK. |
| **P4-B Static Code & Config Audit (`test_p4b_verification.py`)** | `STATIC` | **STATIC PASS (43/43)** | Kiểm tra tĩnh công thức `originY`/`scale` vs `groundY=350`, dung lượng logo/portrait, nav/font strings trên 9 HTML, WCAG 2.2 AA hex-pair math (`5.36:1`–`17.14:1`). Không thay thế browser QA. |
| **Static Typography Check (`test_typography.py`)** | `STATIC` | **STATIC PASS (14/14)** | Kiểm tra UTF-8 encode/decode và ước lượng toán học chiều rộng ký tự (không chứng minh render font thật). |
| **Full Asset Audit Pipeline (`audit_assets.py`)** | `STATIC` | **STATIC PASS** | 316 assets (`123` `actual_renamed`, `35` `canonical_path`, `83` `legacy_compatibility_alias`, `75` `pending_review`; `300` `unverified_license`, `16` `derived_from_project_assets`). Contact sheets xuất ra `test_output/asset_audit/`. |
| **Case Sensitivity & Dynamic Phaser URLs (`check_case_sensitivity.py`)** | `STATIC` | **STATIC PASS** | 712 file trên đĩa + 130 URLs từ `raid-config.js`: `0` missing, `0` case mismatches. |
| **JS Syntax & DOM IDs & Static Paths (`smoke_check.py`)** | `STATIC` | **STATIC PASS** | `0` JS syntax errors, `0` missing DOM ids, `0` missing asset paths. |
| **P4-A Previous Production HTTP Probe (`probe_deployment.py`)** | `HTTP` | **HTTP PASS (P4-A)** | Probe HTTP lịch sử trên `gamified-learning-platform-sandy.vercel.app`: 16/16 HTTP 200 OK, `/api/lex-raid/test` -> 404 sạch. Chỉ chứng minh HTTP response, không chứng minh giao diện/gameplay. |
| **RPG Progression, Session & Quiz Backend (`mvn test` P3)** | `UNIT (Mockito)` | **UNIT PASS (20/20)** | Log Maven P3 trước đây (JDK 21): `RpgProgressionServiceTest` (9), `LexRaidProgressionTest` (4), `QuizProgressionTest` (5), `AccountProfileServiceTest` (2) pass với Mockito mocks; P4-B không sửa file Java. |
| **Vocabulary Importer Pipeline (`test_vocabulary_importer.py`)** | `UNIT` | **UNIT PASS (3/3)** | Dry-run 26 items (`22` board-eligible, `4` multi-word, `0` rejected). |
| **Live Spring Boot + SQL Server Browser E2E** | `INTEGRATION` | **NOT TESTED** | Môi trường Preview tĩnh dùng fallback; chưa chạy browser test nối trực tiếp Tomcat + SQL Server port 1433 trong phiên P4-B. |

---

## 2. GHI NHẬN SỬA LỖI BẢO MẬT & RUNTIME QUAN TRỌNG TRONG P4-B

1. **Khắc phục Render Trạng Thái Thô (`minigame.js` `renderStatus()`):**
   - Trước đây kiểm tra `text.includes('<span')` và gán `innerHTML` nếu có ký tự `<`.
   - Đã thay thế hoàn toàn bằng `document.createElement` + `textContent` và thuộc tính cấu trúc `{ badge, icon, tone, isPreview }`. Không còn đường dẫn render HTML thô từ chuỗi status.
2. **Khắc phục Cắt Chân Nhân Vật Trong Phaser Canvas:**
   - Gỡ quy tắc `.raid-phaser-mount canvas { height: auto !important }` và grid track giãn hàng làm cắt mép dưới canvas ở `768x1024`, `1024x768`, `1920x1080`; thay bằng `position: absolute; inset: 0; width: 100% !important; height: 100% !important; object-fit: contain !important;`.
3. **Khắc phục Tự Cuộn Trang Trên Mobile `speed-math.html`:**
   - Hủy auto-scroll khi mount input lần đầu trong `games-lite.js`, giữ nguyên header/hero trong viewport (`headerOverlapsContent: false`).
4. **Sửa Highlight Active Navbar Sai Tại `auth.html`:**
   - Gỡ class `is-active` khỏi mục `Nhân vật` trên trang đăng nhập.
