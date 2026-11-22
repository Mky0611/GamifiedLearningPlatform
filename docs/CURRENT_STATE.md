# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 23/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát triển:** `feature/p1-pixel-rpg-java21`  
**Trạng thái hiện tại:** **P1 COMPLETED (Java 21 + Spring Boot 4.2.0 + Pixel RPG Design System) | READY FOR REVIEW**  
**Lead AI Engineering Agent:** Antigravity  
**Cộng tác viên Review/QA/Planning:** ChatGPT  

---

## 1. TỔNG QUAN DỰ ÁN

Lex Raid là một web game học tiếng Anh kết hợp phong cách Pixel RPG chiến đấu bằng từ vựng. Dự án được xây dựng trên nền tảng:
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security.
- **Database:** Microsoft SQL Server (`script_GPL_v2.sql` — 57 bảng).
- **Frontend:** Vanilla HTML5, CSS3 Pixel Design, JavaScript ES6+.
- **Game Engine:** Phaser 3.90.0 (kèm Canvas 2D Fallback khi không có mạng/CDN).
- **Phục vụ tĩnh / Xem trước:** `preview-server.js` (Node.js HTTP Server).

---

## 2. KẾT QUẢ KIỂM TOÁN BẢO MẬT & DATABASE (POST-SECURITY AUDIT)

### A. Tình trạng Thông tin Xác thực (Credentials & Rotation)
- **Git Commit:** Commit `3f5d488` đã loại bỏ mật khẩu bản rõ khỏi `src/main/resources/application.properties`, tham số hóa bằng `${SPRING_DATASOURCE_PASSWORD:}`.
- **Xác minh SQL Server thực tế:** Đã kiểm tra kết nối tới Microsoft SQL Server tại `127.0.0.1:1433`. Kết quả xác nhận: **Mật khẩu cũ trong commit `ecf1f782` vẫn đang hoạt động trên tài khoản `sa` của SQL Server local**.
- **Chính sách Rotation:** Tuân thủ quy định không tự ý đổi credentials của người dùng. Đã cung cấp câu lệnh `ALTER LOGIN sa WITH PASSWORD = '...'` an toàn và quy trình thiết lập biến môi trường `SPRING_DATASOURCE_PASSWORD`.

### B. Kiểm thử Khởi chạy & Kết nối Database qua Environment Variable
- Đã chạy kiểm thử ngữ cảnh Spring Boot (`MainTests.java`) sử dụng Maven 3.9.9 và Java 21:
  - Khi **không có** `SPRING_DATASOURCE_PASSWORD`: Ứng dụng từ chối kết nối (đúng hành vi bảo mật).
  - Khi **truyền `SPRING_DATASOURCE_PASSWORD` qua biến môi trường**: HikariCP khởi tạo thành công kết nối tới database `GamifiedLearningPlatform` (57 bảng), JPA/Hibernate ánh xạ đầy đủ entities, kiểm thử `MainTests` đạt **BUILD SUCCESS (1/1 tests pass)**.

### C. Nâng cấp Công cụ Quét `git_security_scanner.py` & Test Suite
- Đã loại bỏ cơ chế bỏ qua toàn bộ dòng sơ sài (naive skip).
- Bổ sung bộ phân tích chuyên sâu cho:
  - Giá trị mặc định ẩn trong biến môi trường `${VAR:DEFAULT}` (phát hiện nếu default là secret thật).
  - Nhận diện Connection URI có chứa mật khẩu (`jdbc:...://user:pass@host`).
  - Nhận diện Cloud API Keys (Google, AWS, GitHub PATs, Slack, Private Keys PEM).
  - Phân tích cú pháp gán Key-Value trong Properties, YAML, JSON, .env.
- Tạo bộ kiểm thử đơn vị với dữ liệu giả lập (`test_security_scanner.py`): **13/13 unit tests PASS**.

### D. Tách biệt Cấu hình Dev vs. Production cho SQL Server
- Tạo `application-dev.properties`: Dành cho môi trường phát triển local (hỗ trợ self-signed certificates, debug logs).
- Tạo `application-prod.properties`: Dành cho môi trường sản xuất (bắt buộc `encrypt=true;trustServerCertificate=false`, sử dụng tài khoản phân quyền tối thiểu `glp_app`, tắt show-sql và log nhạy cảm).
- Thêm `spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}` vào cấu hình gốc.

### E. Phân tích `SecurityConfig.java` & Rủi ro IDOR
- Hiện tại các API `/api/v1/account/**`, `/api/v1/lex-raid/**`, `/api/v1/quiz/**`, `/api/v1/volcard/**` đang để `permitAll()` để duy trì tương thích client JavaScript.
- Phân tích rủi ro: Endpoint `GET/PUT /api/v1/account/loadout` nhận trực tiếp `userId` từ client, tiềm ẩn nguy cơ Insecure Direct Object Reference (IDOR).
- Giải pháp: Giữ nguyên hợp đồng hiện tại để không làm gián đoạn gameplay P0/P1; lên kế hoạch tích hợp JWT filter và lấy `userId` từ `Authentication.getPrincipal()` trong Phase P3.

---

## 3. KẾT QUẢ ĐÃ THỰC HIỆN TRONG GIAI ĐOẠN P0

Toàn bộ các mục tiêu cốt lõi của P0 về sửa lỗi nhân vật, hoạt ảnh, đấu trường và giao diện di động đã được hoàn thiện trong mã nguồn:
- **Chuẩn hóa Sprite Pivots & Ground Alignment:** Ground Y = 350, Warrior (originY=0.7135), Archer (originY=0.7083), Lancer (originY=0.9271), 9 Boss bám đất chuẩn xác.
- **Khắc phục 9 Tình huống Đua lệnh:** Triệt tiêu lỗi hồi sinh Boss ma (`clearAttackTimers`, `isBossDying`), khắc phục kẹt tween khi đổi Class (`killTweensOf`), chống spam phím Attack/Guess (`isSubmitting`), fallback ngoại tuyến khi timeout.
- **Tối ưu Mobile 320×568:** Chiều cao 450.5px / 568px (79.3%), không cuộn trang. Đưa Player HP & Timer lên Arena HUD.

---

## 4. PHÂN LOẠI KẾT QUẢ KIỂM THỬ THỰC TẾ

| Cấp độ kiểm thử | Tên bài test / Script | Kết quả | Chi tiết |
| :--- | :--- | :---: | :--- |
| **SECURITY UNIT** | `test_security_scanner.py` | **PASS** | 13/13 tests pass (URI, JSON, YAML, Cloud Keys, False Positive checks). |
| **SECURITY SCAN** | `git_security_scanner.py` | **VERIFIED** | Working tree sạch 0 lỗi; phát hiện đúng 1 commit lịch sử `ecf1f782` (masked). |
| **BACKEND INTEGRATION** | `MainTests.java` (Spring Boot + SQL Server) | **PASS** | HikariCP kết nối thành công 57 bảng qua `SPRING_DATASOURCE_PASSWORD`. |
| **STATIC PASS** | `smoke_check.py` | **PASS** | 0 lỗi cú pháp JS, 0 ID DOM thiếu, 0 asset hỏng. |
| **SIMULATION PASS** | `test_mobile_viewports_simulation` | **PASS** | 7 viewports (320px đến 1920px) vừa vặn khung nhìn. |
| **BROWSER TEST** | `playwright_p0_acceptance.js` | **PENDING HOST RUN** | Cần chạy trên host machine hoặc ngoài sandbox để hoàn tất nghiệm thu P0. |

---

## 5. ĐIỀU KIỆN CHƯA HOÀN THÀNH & RỦI RO CÒN TỒN TẠI

1. **Nghiệm thu Trình duyệt thật (P0 Acceptance):** Chưa chạy trực tiếp trên browser thật do môi trường sandbox giới hạn port socket ngoại vi.
2. **Commit cũ trong Git History:** Commit `ecf1f782` vẫn lưu chuỗi cũ trong lịch sử Git. Cần sự phê duyệt của người dùng trước khi thực hiện viết lại lịch sử (nếu muốn).
3. **Mật khẩu SQL Server Local:** Người dùng cần thực hiện rotation mật khẩu `sa` trên SSMS theo hướng dẫn an toàn.

---

## 6. CÔNG VIỆC TIẾP THEO

1. Người dùng thực hiện rotation mật khẩu SQL Server local và thiết lập `.env`.
2. Chạy kịch bản Playwright nghiệm thu P0 trên host browser.
3. Bước vào **Phase P1: Pixel RPG Design System** (Bảng màu, Khung viền gỗ/vàng kim, Typography Pixel, UI Components đồng nhất).
