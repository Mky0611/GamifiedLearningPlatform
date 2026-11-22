# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 23/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN

| Giai đoạn | Nội dung trọng tâm | Trạng thái | Đánh giá & Tiến độ |
| :---: | :--- | :---: | :--- |
| **SEC** | **Security Post-Audit & Credential Sanitization** | **IN PROGRESS (MÃ NGUỒN SẠCH / CHỜ ROTATION LOCAL)** | Main branch sạch; test suite 13/13 pass; chờ đổi mật khẩu local DB. |
| **P0** | **Animation, Gameplay UI, Mobile Responsive, Runtime QA** | **PARTIALLY COMPLETE** | Mã nguồn đã sửa xong; chờ xác nhận trình duyệt thật (Playwright). |
| **P1** | **Pixel RPG Design System & Java 21 / Spring Boot 4.2** | **COMPLETED & QA VERIFIED** | Nâng Java 21 + Spring Boot 4.2 hoàn tất; Design System, Battle UI, Home & Nav đồng bộ. Tap target 320px tối ưu >=40px. |
| **P2** | **Vocabulary Engine, CEFR A1–C2, IT Taxonomy** | `TODO` | Xây dựng bộ từ vựng 6 cấp độ CEFR và taxonomy chuyên ngành IT. |
| **P3** | **Backend, XP/Coin, Progression, Security** | `TODO` | Sửa entity JPA, lưu trữ session, tích lũy XP/Coin, JWT Auth Filter. |
| **P4** | **Docker, CI/CD, Deployment** | `TODO` | Dockerfile, docker-compose, script build tự động, môi trường test. |
| **P5** | **Microservices Evaluation** | `TODO` | Đánh giá kiến trúc mở rộng và tối ưu hóa hệ thống. |

---

## 4. CHI TIẾT CÁC TASKS GIAI ĐOẠN P1 (INDEPENDENT QA & COMPLETION)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu & Kết quả |
| :--- | :--- | :---: | :--- | :--- |
| **P1-T1** | Nâng cấp Java 21 LTS & Spring Boot 4.2.0 | **BUILD PASS** | `pom.xml`, `effective-pom.xml` | Maven compiler 3.16.0 release 21, Lombok 1.18.36, HikariCP + SQL Server context load 5.8s. |
| **P1-T2** | Xác minh Starter Web (`web` vs `webmvc`) | **STATIC PASS** | `pom.xml`, dependency:tree | `spring-boot-starter-web:4.2.0` chuẩn, tích hợp Tomcat 11.0.27 + Spring WebMVC. |
| **P1-T3** | API Regression Smoke Test | **API INTEGRATION PASS** | `src/main/java/.../controller` | Khảo sát & kiểm thử contracts các endpoint Auth, Account, Home, Lex Raid, Quiz, Volcard. |
| **P1-T4** | Thiết lập Design Tokens Pixel RPG | **STATIC PASS** | `pixel-rpg.css`, `DESIGN_SYSTEM.md` | Bộ tokens chuẩn Wood, Gold, Parchment, Combat Indicators; các classes `.pixel-panel`, `.pixel-btn`, `.pixel-bar`. |
| **P1-T5** | Pixel hóa Đấu trường Lex Raid & Word Board | **BROWSER PASS** | `minigame.css`, `minigame.html` | Đấu trường retro, thanh máu pixel, bảng chữ gỗ parchment, nút tấn công vàng đồng. |
| **P1-T6** | Pixel hóa Trang chủ (Home) & Navigation | **BROWSER PASS** | `home.css`, `base.css`, `home.html` | Main navigation khung gỗ viền vàng, pixel chips, pixel quick stats, pixel game cards. |
| **P1-T7** | Tối ưu hóa Touch Target nút Clear / Attack (320px) | **BROWSER PASS** | `minigame.css` | Nâng min-height từ 32px lên 40px (chuẩn mobile tap target >=40px), no-scroll chiều cao 452px/568px. |
| **P1-T8** | Kiểm toán trực quan 8 Viewports | **BROWSER PASS** | 8 viewports chuẩn | Không tràn ngang (zero horizontal overflow), không che chữ, không chồng chéo nút bấm. |
| **P1-T9** | Kiểm toán giao diện các trang còn lại | **STATIC PASS** | `quiz`, `volcard`, `auth`, `account`,... | Kế thừa base.css + pixel navbar; phân loại hiện trạng và lập lộ trình hoàn thiện cho P2/P3. |

---

## 2. CHI TIẾT CÁC TASKS BẢO MẬT (SECURITY AUDIT)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-T1** | Khử mật khẩu bản rõ trong config | **DONE** | `application.properties` | Đổi sang `${SPRING_DATASOURCE_PASSWORD:}` không còn mật khẩu cứng. |
| **SEC-T2** | Tạo template môi trường an toàn | **DONE** | `.env.example`, `application.properties.example` | Cung cấp tài liệu biến môi trường chuẩn cho team dev. |
| **SEC-T3** | Cải tiến scanner & bổ sung Unit Tests | **DONE** | `git_security_scanner.py`, `test_security_scanner.py` | 13/13 tests pass; bắt đúng ${VAR:default}, URI credentials, cloud tokens. |
| **SEC-T4** | Tách cấu hình Dev vs. Production SQL Server | **DONE** | `application-dev.properties`, `application-prod.properties` | Prod dùng `encrypt=true`, `trustServerCertificate=false`, user `glp_app`. |
| **SEC-T5** | Kiểm thử kết nối Spring Boot qua Env Var | **DONE** | `src/test/java/.../MainTests.java` | Spring Boot kết nối thành công 57 bảng qua `SPRING_DATASOURCE_PASSWORD`. |
| **SEC-T6** | Đổi mật khẩu SQL Server local (Rotation) | `PENDING USER ACTION` | SQL Server Host / SSMS | Người dùng chạy lệnh `ALTER LOGIN` đổi mật khẩu tài khoản `sa`. |
| **SEC-T7** | Xử lý Commit cũ trong Git History | `PENDING APPROVAL` | GitHub / Git DAG | Chờ quyết định của người dùng về việc force-push rewrite hay giữ nguyên. |

---

## 3. CHI TIẾT CÁC TASKS GIAI ĐOẠN P0

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu |
| :--- | :--- | :---: | :--- | :--- |
| **P0-T1** | Căn chỉnh trọng tâm chân Hero & Boss (Sprite Pivots) | **DONE** | `raid-config.js`, `battle-scene.js` | Nhân vật đứng trên mặt đất Y=350, không bị dịch chuyển khi đổi animation. |
| **P0-T2** | Đồng bộ Canvas Fallback 2D | **DONE** | `raid-phaser-embed.js` | Kích thước 960×420, groundY=350, flipped boss hiển thị chuẩn. |
| **P0-T3** | Khắc phục lỗi hồi sinh Boss ma giữa chừng | **DONE** | `battle-scene.js` | Hủy `TimerEvent`, cờ `isBossDying` ngăn tái tạo sprite trong lúc nổ chết. |
| **P0-T4** | Khắc phục kẹt attack tween khi đổi class | **DONE** | `battle-scene.js` | `spawnActors()` giải phóng tween cũ, reset `isAttacking = false`. |
| **P0-T5** | Chống spam phím Attack / Guess | **DONE** | `minigame.js` | Cờ `isSubmitting` bọc `try...finally` ngăn gửi request API trùng lặp. |
| **P0-T6** | Bổ sung phần tử DOM và an toàn null check | **DONE** | `minigame.html`, `minigame.js` | `smoke_check.py` và `check_dom_refs.py` đạt 0 lỗi. |
| **P0-T7** | Tối ưu hóa giao diện di động 320×568 (No-Scroll) | **DONE** | `minigame.css`, `minigame.html` | Chiều cao vùng chiến đấu = 450.5px (chiếm 79.3% màn hình), không cần cuộn. |
| **P0-T8** | Đưa Player HP & Timer lên Arena HUD Overlay | **DONE** | `minigame.html`, `minigame.js`, `minigame.css` | Chỉ số người chơi và boss hiển thị đồng thời ngay trên góc Canvas. |
| **P0-T9** | Kịch bản kiểm thử tự động Playwright | **DONE** (Code) | `playwright_p0_acceptance.js` | Script đo 7 viewports và tương tác thực tế đã sẵn sàng. |
| **P0-T10** | Nghiệm thu trên trình duyệt thật (Live Host Browser) | `PENDING HOST RUN` | Host Machine / Chrome | Chạy kiểm thử Playwright hoặc mở Chrome ngoài sandbox để nghiệm thu cuối cùng. |

---

## 4. KẾ HOẠCH GIAI ĐOẠN P1 (PIXEL RPG DESIGN SYSTEM)

| Mã Task | Tên nhiệm vụ | Trạng thái | Mục tiêu chi tiết |
| :--- | :--- | :---: | :--- |
| **P1-A** | Nâng cấp Java 21 LTS & Spring Boot 4.2.0 | **DONE** | Cập nhật pom.xml, Lombok 1.18.36, compile 112 classes, test MainTests pass. |
| **P1-T1** | Chuẩn hóa bảng màu Pixel RPG Palette | **DONE** | Màu gỗ sồi, viền vàng kim, nền giấy da parchment, hiệu ứng viền bóng pixel. |
| **P1-T2** | Bộ UI Components dùng chung (Buttons, Panels, Banners) | **DONE** | Khung .pixel-panel, nút bấm .pixel-btn 3D stepped, thanh máu .pixel-bar, huy hiệu .pixel-badge. |
| **P1-T3** | Đồng bộ hóa giao diện Lex Raid Battle & Home Page | **DONE** | Nâng cấp toàn diện minigame.css và home.css theo chuẩn Pixel RPG retro. |
| **P1-T4** | Font chữ Pixel & Retro Typography | **DONE** | Tích hợp font Silkscreen/VT323 kết hợp Be Vietnam Pro hỗ trợ tiếng Việt hoàn hảo. |
