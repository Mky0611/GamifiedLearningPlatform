# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 23/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN

| Giai đoạn | Nội dung trọng tâm | Trạng thái | Đánh giá & Tiến độ |
| :---: | :--- | :---: | :--- |
| **P0** | **Animation, Gameplay UI, Mobile Responsive, Runtime QA** | **PARTIALLY COMPLETE** | Mã nguồn đã sửa xong; chờ xác nhận trình duyệt thật. |
| **P1** | **Pixel RPG Design System** | `TODO` | Chuẩn hóa bảng màu, khung viền gỗ/vàng, font pixel, UI components. |
| **P2** | **Vocabulary Engine, CEFR A1–C2, IT Taxonomy** | `TODO` | Xây dựng bộ từ vựng 6 cấp độ CEFR và taxonomy chuyên ngành IT. |
| **P3** | **Backend, XP/Coin, Progression, Security** | `TODO` | Sửa entity JPA, lưu trữ session, tích lũy XP/Coin, validation. |
| **P4** | **Docker, CI/CD, Deployment** | `TODO` | Dockerfile, docker-compose, script build tự động, môi trường test. |
| **P5** | **Microservices Evaluation** | `TODO` | Đánh giá kiến trúc mở rộng và tối ưu hóa hệ thống. |

---

## 2. CHI TIẾT CÁC TASKS GIAI ĐOẠN P0

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
| **P0-T10** | Nghiệm thu trên trình duyệt thật (Live Host Browser) | `PENDING` | Host Machine / Chrome | Chạy kiểm thử Playwright hoặc mở Chrome ngoài sandbox để nghiệm thu cuối cùng. |

---

## 3. CHI TIẾT KẾ HOẠCH GIAI ĐOẠN P1 (PIXEL RPG DESIGN SYSTEM)

| Mã Task | Tên nhiệm vụ | Trạng thái | Mục tiêu chi tiết |
| :--- | :--- | :---: | :--- |
| **P1-T1** | Chuẩn hóa bảng màu Pixel RPG Palette | `TODO` | Màu gỗ, viền vàng kim, nền giấy parchment, hiệu ứng bóng pixel. |
| **P1-T2** | Bộ UI Components dùng chung (Buttons, Panels, Banners) | `TODO` | 9-slice borders cho khung thoại, nút bấm có trạng thái pressed/disabled. |
| **P1-T3** | Đồng bộ hóa toàn bộ các trang con | `TODO` | Áp dụng phong cách Pixel đồng nhất lên `home.html`, `quiz.html`, `memory.html`, `speed-math.html`, `code-puzzle.html`. |
| **P1-T4** | Font chữ Pixel & Retro Typography | `TODO` | Tích hợp font pixel hỗ trợ đầy đủ tiếng Việt không bị lỗi dấu. |
