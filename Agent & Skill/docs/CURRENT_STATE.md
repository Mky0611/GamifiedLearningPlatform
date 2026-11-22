# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 23/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Trạng thái hiện tại:** **P0 PARTIALLY COMPLETE (CHƯA NGHIỆM THU HOÀN TOÀN)**  
**Lead AI Engineering Agent:** Antigravity  
**Cộng tác viên Review/QA/Planning:** ChatGPT  

---

## 1. TỔNG QUAN DỰ ÁN

Lex Raid là một web game học tiếng Anh kết hợp phong cách Pixel RPG (lấy cảm hứng từ lối chơi săn boss của Bookworm Adventures nhưng mang bản sắc đồ họa và nội dung riêng). Dự án được xây dựng trên nền tảng:
- **Backend:** Java 17, Spring Boot 3.3.5, Spring Data JPA.
- **Database:** Microsoft SQL Server (`script_GPL_v2.sql`).
- **Frontend:** Vanilla HTML5, CSS3 Pixel Design, JavaScript ES6+.
- **Game Engine:** Phaser 3.90.0 (kèm Canvas 2D Fallback khi không có mạng/CDN).
- **Phục vụ tĩnh / Xem trước:** `preview-server.js` (Node.js HTTP Server).

---

## 2. KẾT QUẢ ĐÃ THỰC HIỆN TRONG GIAI ĐOẠN P0

Toàn bộ các mục tiêu cốt lõi của P0 về sửa lỗi nhân vật, hoạt ảnh, đấu trường và giao diện di động đã được hoàn thiện trong mã nguồn:

### A. Chuẩn hóa Trọng tâm và Hoạt ảnh Sprite (Sprite Pivots & Ground Alignment)
- Thiết lập mặt phẳng đất thống nhất tại `World Ground Y = 350` trên khung Canvas `960×420`.
- Đo đạc chính xác tọa độ chân thực tế của từng frame bằng công cụ xử lý ảnh chuyên sâu (Pillow 12.2.0):
  - **Warrior:** Đặt `originY = 0.7135` ($137 / 192$). Cố định chân tại $Y=136$ trên toàn bộ 24 frames (Idle, Run, Guard, Attack). Vệt chém kiếm ở Frame 2 & 3 lún xuống $Y=155$ tạo cảm giác va chạm mặt đất tự nhiên mà không làm giật chân.
  - **Archer:** Đặt `originY = 0.7083` ($136 / 192$). Cố định chân tại $Y=135$ trên cả 18 frames.
  - **Lancer:** Đặt `originY = 0.9271` ($178 / 192$). Đồng bộ chân tại $Y=177$ trên 27 frames.
  - **9 Boss Quái Vật Kho Báu:** Chuẩn hóa `originY` bám sát đất: Captain (0.8), Crabby (0.9062), Fierce (0.9333), Pink (0.9667), Totem 1 (0.9688), Totem 2/3 (1.0), Seashell (1.0), Cannon (1.0).
- Đồng bộ bóng đổ chân (`heroShadow` và `bossShadow`) bám dính theo thời gian thực trong mọi tween đòn đánh.
- Đồng bộ hoàn toàn Canvas Fallback (`raid-phaser-embed.js`) khớp tỷ lệ 960×420, groundY=350 và cơ chế lật mặt Boss đối diện Hero.

### B. Khắc phục 9 Tình huống Hồi quy & Đua lệnh (Race Conditions)
1. **Triệt tiêu lỗi hồi sinh Boss ma:** Khi quái vật chết trong lúc đòn đánh đang diễn ra, các delayed callbacks của attack sequence bị hủy lập tức qua `clearAttackTimers()`. Cờ `isBossDying = true` ngăn chặn tuyệt đối hàm `applyState()` tái tạo sprite boss đè lên animation nổ chết.
2. **Khắc phục kẹt trạng thái tấn công khi đổi Class:** Trong `spawnActors()`, scene hủy sạch tween cũ bằng `killTweensOf`, giải phóng timers và ép đặt lại `isAttacking = false`.
3. **Chống spam phím Attack/Guess:** Bổ sung cờ `isSubmitting` bọc trong `try ... finally` tại `minigame.js` để ngăn chặn gửi nhiều request API trùng lặp và lồng ghép animation.
4. **Fallback khi mất backend/timeout:** Trận đấu tự động chuyển sang cơ chế xác thực và tính điểm cục bộ khi API ngoại tuyến, người chơi không bị treo trận.

### C. Tái cấu trúc Giao diện Mobile — Đặc trị Viewport 320×568 (No-Scroll Fit)
- Tự động ẩn thẻ `.raid-header` cồng kềnh khi ở chế độ chiến đấu mobile (`max-width: 720px`).
- Đưa trực tiếp Máu người chơi (`playerHpHudValue`) và Đồng hồ đếm ngược (`timerHudValue`) lên góc trên bên trái của Canvas Arena (`.arena-hud-player`). Người chơi không cần cuộn trang xuống dưới để xem máu/thời gian.
- Gắn kết chặt chẽ Attack Dock và Bảng 25 ô chữ.
- Tổng chiều cao giao diện chiến đấu trên màn hình 320×568 được tối ưu từ 548px xuống còn **450.5px / 568px** (chiếm **79.3%** màn hình, dư ra 117.5px an toàn, hoàn toàn không cần cuộn trang).

---

## 3. PHÂN LOẠI KẾT QUẢ KIỂM THỬ THỰC TẾ

| Cấp độ kiểm thử | Tên bài test / Script | Kết quả | Chi tiết |
| :--- | :--- | :---: | :--- |
| **STATIC PASS** | `smoke_check.py` | **PASS** | 0 lỗi cú pháp JS, 0 ID DOM thiếu, 0 asset hỏng. |
| **STATIC PASS** | `check_dom_refs.py` | **PASS** | 64/64 static IDs khớp tuyệt đối giữa HTML và JS. |
| **UNIT PASS** | `test_sprite_alignment` | **PASS** | Sai số chân tiếp đất so với Ground Y=350 nhỏ hơn 0.007px. |
| **SIMULATION PASS** | `test_mobile_viewports_simulation` | **PASS** | 7 viewports (320px đến 1920px) đều vừa vặn ngân sách hiển thị. |
| **BROWSER TEST** | `playwright_p0_acceptance.js` | **NOT TESTED** | Chưa thể chạy tự động trong Sandbox do hạn chế socket loopback `WinError 10013`. |

---

## 4. ĐIỀU KIỆN CHƯA HOÀN THÀNH & BLOCKERS

- **Lý do P0 chưa được đánh dấu COMPLETE:** Bài kiểm thử trình duyệt thực tế (Live Headless Browser Acceptance) đo lường DOM `getBoundingClientRect()` và sự kiện chạm thực trên trình duyệt thật chưa được chạy tự động trong môi trường sandbox hiện tại.
- **Kế hoạch giải quyết:** Đã lập trình sẵn kịch bản kiểm thử Playwright tại `Agent & Skill/scripts/playwright_p0_acceptance.js` để người dùng hoặc môi trường CI/host thực thi ngoài sandbox.

---

## 5. CÔNG VIỆC TIẾP THEO

1. Xác nhận nghiệm thu P0 qua kịch bản Playwright hoặc kiểm tra trực tiếp trên Chrome.
2. Chuyển sang **Phase P1: Pixel RPG Design System** (Chuẩn hóa giao diện pixel art, panel gỗ, font chữ, icon, bảng màu thống nhất trên toàn bộ các trang).
