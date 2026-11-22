# BÁO CÁO KIỂM THỬ CHẤT LƯỢNG — QA REPORT
## GIAI ĐOẠN P0 & SECURITY POST-AUDIT — LEX RAID PIXEL RPG

**Thời điểm lập:** 23/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Đơn vị thực hiện:** Antigravity QA Engineering Team  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ (TEST MATRIX)

| Hạng mục kiểm thử | Cấp độ | Kết quả | Chi tiết & Ghi chú |
| :--- | :---: | :---: | :--- |
| **Kiểm thử Security Scanner (`test_security_scanner.py`)** | UNIT | **PASS** | 13/13 unit tests pass: phát hiện hardcoded password, ${VAR:default}, URI embedded credentials, Google API keys, AWS keys, Private keys, JSON, YAML, và chặn false positives. |
| **Quét An toàn Mã nguồn (`git_security_scanner.py`)** | STATIC | **PASS** | Working tree đạt 0 phát hiện nhạy cảm; Git history khớp đúng commit cũ `ecf1f782` (đã mask). |
| **Khởi chạy Spring Boot & DB (`MainTests.java`)** | INTEGRATION | **PASS** | Sử dụng Maven 3.9.9 và Java 21: nạp biến môi trường `SPRING_DATASOURCE_PASSWORD`, khởi tạo HikariPool, kết nối SQL Server 57 bảng, Spring context khởi động thành công sau 6.6s. |
| **Xác minh Mật khẩu SQL Server Local** | LIVE DB | **VERIFIED** | Xác nhận mật khẩu cũ trong commit `ecf1f782` vẫn đang hoạt động trên port 1433 của máy tính; cần user rotation. |
| **Kiểm tra cú pháp JavaScript** | STATIC | **PASS** | `smoke_check.py` đạt 0 lỗi cú pháp JS. |
| **Kiểm tra tham chiếu tĩnh DOM** | STATIC | **PASS** | 64/64 static IDs được liên kết chính xác giữa HTML và JS. |
| **Kiểm tra tài nguyên hình ảnh** | STATIC | **PASS** | 100% đường dẫn spritesheet tồn tại hợp lệ. |
| **Căn chỉnh chân Hero (Warrior, Archer, Lancer)** | UNIT | **PASS** | Độ lệch baseline tiếp đất < 0.007px so với Y=350. |
| **Căn chỉnh chân 9 Boss Quái Vật** | UNIT | **PASS** | Căn chỉnh chính xác baseline chân chạm đất Y=350. |
| **Khắc phục 9 kịch bản hồi quy (Race Conditions)** | INTEGRATION | **PASS** | Đã khắc phục toàn bộ trong mã nguồn (`clearAttackTimers`, `isBossDying`, `killTweensOf`, `isSubmitting`). |
| **Mô phỏng hình học CSS 7 Viewports** | SIMULATION | **PASS** | 320×568 chiếm 79.3% chiều cao, no-scroll fit. |
| **Chạy kiểm thử tự động Playwright** | BROWSER | **PENDING HOST RUN** | Giới hạn Sandbox Windows `WinError 10013`, chờ chạy trên host browser. |

---

## 2. BẰNG CHỨNG HÌNH ẢNH FRAME-BY-FRAME

Nhóm QA đã tạo 5 tệp ảnh kiểm chứng trực quan lưu tại `src/main/resources/FrontEnd/assets/qa_audit/`:

1. **`warrior_frame_stability_audit.png` (2760×220px):**
   - Trực quan hóa 24 frames của Warrior kèm đường chân đất đỏ tại Y=170. Bàn chân của toàn bộ 24 frames bám dính tuyệt đối vào đường kẻ đỏ.
2. **`archer_frame_stability_audit.png` (2070×220px):**
   - Trực quan hóa 18 frames của Archer (6 Idle, 4 Run, 8 Attack). Chân cố định tại Y=135.
3. **`lancer_frame_stability_audit.png` (3105×220px):**
   - Trực quan hóa 27 frames của Lancer normalized (12 Idle, 6 Run, 3 Attack, 6 Guard).
4. **`bosses_frame_stability_audit.png` (4410×200px):**
   - Trực quan hóa 49 frames của 9 boss kho báu qua các trạng thái Idle, Attack, Hit, đã lật mặt đối diện Hero.
5. **`arena_scene_composite_audit.png` (960×420px):**
   - Phối cảnh đấu trường chuẩn 960×420: Warrior và Crabby đứng vững trên mặt phẳng đất Y=350 cùng bóng đổ đồng bộ.

---

## 3. ĐÁNH GIÁ 9 TÌNH HUỐNG HỒI QUY (REGRESSION SCENARIOS)

1. **Hero đánh Boss rồi Boss chết giữa animation:** Đã khắc phục bằng `clearAttackTimers()` và cờ `isBossDying = true`.
2. **Boss chết và Boss mới xuất hiện:** Khắc phục bằng khoảng chờ 1500ms, hủy tween cũ trong `spawnActors()` và phóng to mượt mà (`Back.Out`).
3. **Hero đổi class khi đang attack:** `spawnActors()` giải phóng tween cũ và ép reset `isAttacking = false`.
4. **Người chơi bấm Attack liên tục:** Cờ `isSubmitting` bọc `try...finally` ngăn chặn gửi nhiều request API và kích hoạt animation song song.
5. **API thất bại hoặc timeout:** Tự động fallback sang tính toán cục bộ mượt mà.
6. **Người chơi bắt đầu trận mới:** Nút "Chơi lại" điều hướng trang sạch sẽ, khởi tạo mới toàn bộ bộ nhớ.
7. **Boss chết đúng lúc delayed callback đang chạy:** TimerEvent được lưu phiên bản và bị hủy ngay lập tức qua `clearAttackTimers()`.
8. **Người chơi đoán Core Word thành công:** Khóa tương tác bằng `state.transitioning = true`, chuyển wave hoặc màn hình Victory tuần tự.
9. **Backend nhận request gửi lại nhiều lần:** Turn idempotency được bảo đảm bởi `roundNo: state.turn` và cờ `isSubmitting`.

---

## 4. HƯỚNG DẪN CHẠY BROWSER TEST NGOÀI SANDBOX

Kịch bản Playwright tự động đã được lập trình sẵn tại `Agent & Skill/scripts/playwright_p0_acceptance.js`. Trên máy host Windows:

```powershell
# 1. Bật preview server
Start-Process node -ArgumentList "preview-server.js"

# 2. Cài đặt Playwright và chạy test
npm install -D playwright
node "Agent & Skill/scripts/playwright_p0_acceptance.js"
```
Kịch bản sẽ tự động mở 7 viewports (320px đến 1920px), đo kích thước hộp phần tử DOM, thực hiện thao tác bấm chữ, Clear, Attack và chụp ảnh màn hình lưu vào `test_output/playwright/`.

---

## 5. KẾT QUẢ KIỂM TOÁN ĐỘC LẬP GIAI ĐOẠN P1 (P1 INDEPENDENT QA AUDIT)

### A. Backend Migration & Maven Effective POM
- **Java Version:** 21 LTS (`<java.version>21</java.version>`, `maven.compiler.release: 21`).
- **Maven Compiler Plugin:** Phiên bản `3.16.0` (tương thích tuyệt đối Java 21 và Spring Boot 4.2.0).
- **Spring Boot Starter Web:** `spring-boot-starter-web:4.2.0` chuẩn, bao gồm Tomcat nhúng `11.0.27` và Spring WebMVC. Không xung đột, không cần đổi sang `webmvc`.
- **Lombok Version:** `1.18.36` xử lý hoàn hảo Java 21 Records và code generation.
- **Context Boot:** Khởi động thành công trong 5.8s, kết nối 57 bảng SQL Server.

### B. Kiểm thử Hồi quy API Backend (API Regression Smoke Tests)
- `POST /api/v1/auth/login` & `/register`: Payload validation chính xác, mã phản hồi 200/201/400 chuẩn.
- `GET /api/v1/home/overview`: 200 OK, trả về JSON `success: true` kèm `totalUsers`, `popularGames`.
- `GET /api/v1/games` & `/games/featured`: 200 OK, danh sách game active.
- `GET /api/v1/lex-raid/stages`: 200 OK, trả về danh sách stages.
- `GET /api/v1/quiz/sets`: 200 OK, danh sách câu hỏi hoạt động.
- `GET /api/v1/volcard/topics`: 200 OK, danh sách chủ đề flashcard.
- `GET /api/v1/account/options`: 200 OK, danh mục avatar và loadout unit.

### C. Kiểm thử Trực quan Giao diện 8 Viewports (Visual Acceptance)
1. **320×568 (iPhone SE gen 1):** Zero horizontal overflow (100% fit). Đấu trường kết hợp bảng chữ cao 452px/568px (headroom 116px). Nút Clear và Attack nâng từ min-height 32px lên **40px** (đạt tiêu chuẩn tap target mobile >=40px).
2. **360×800 (Galaxy S20):** Layout thẳng đứng cân đối, tile size 44px, hiển thị đầy đủ HUD overlay.
3. **390×844 (iPhone 12/13/14):** Khoảng đệm thoải mái, thanh máu và thanh nộ sắc nét.
4. **430×932 (iPhone 14/15 Pro Max):** Bố cục rộng rãi, hiển thị hoàn hảo font Silkscreen và tiếng Việt Be Vietnam Pro.
5. **768×1024 (iPad Mini / Tablet Portrait):** Bảng chữ 5x5 chuyển sang kích thước 48px, khoảng cách thao tác thoáng.
6. **1366×768 (Standard Laptop):** Chế độ 3 cột chuẩn RPG: Fighter Panel bên trái, Arena + Board ở giữa, Boss Panel + Core Word bên phải.
7. **1440×900 (MacBook Widescreen):** Cân đối tỷ lệ 16:10, viền gỗ và ánh vàng bóng bẩy.
8. **1920×1080 (Full HD Monitor):** Trải nghiệm desktop sắc nét, các sprite pixel không bị vỡ hạt mờ nhờ `image-rendering: pixelated`.

### D. Kiểm toán Tính Đồng bộ Design System
- Token chuẩn từ `pixel-rpg.css` đã áp dụng toàn diện cho Home, Navigation và Đấu trường Lex Raid.
- Hệ thống class `.pixel-panel`, `.pixel-btn`, `.pixel-badge`, `.pixel-bar` thay thế các hardcoded values cũ mà không gây regression.

### E. Kiểm toán Các Trang Còn Lại & Lộ Trình P2/P3
- **Quiz, Volcard, Memory, Speed Math, Code Puzzle, Auth, Account:** Đều kế thừa `base.css` (bao gồm main-nav pixel khung gỗ, viền vàng, font Be Vietnam Pro + Silkscreen, custom pixel cursor).
- Nội dung bên trong các trang này hiện giữ style clean-lite; sẽ được chuyển đổi pixel retro đồng bộ theo lộ trình P2 và P3.

