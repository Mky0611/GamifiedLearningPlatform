# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 25/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát triển:** `feature/p4b-fantasy-pixel-redesign`  
**Trạng thái hiện tại:** **PHASE P4-B COMPLETED (PURE FANTASY PIXEL RPG REDESIGN, ASSET REORGANIZATION & VISUAL QA ACCEPTED)**  
**Lead AI Engineering Agent:** Antigravity  
**Cộng tác viên Review/QA/Planning:** ChatGPT  

---

## 1. TỔNG QUAN DỰ ÁN

Lex Raid là một web game học tiếng Anh kết hợp phong cách Pure Fantasy Pixel RPG chiến đấu bằng từ vựng. Dự án được xây dựng trên nền tảng:
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security.
- **Database:** Microsoft SQL Server (`script_GPL_v2.sql` — 57 bảng).
- **Frontend:** Vanilla HTML5, CSS3 Pure Fantasy Pixel Design System, JavaScript ES6+.
- **Game Engine:** Phaser 3.90.0 (kèm Canvas 2D Fallback khi không có mạng/CDN).
- **Hosting / Preview:** Vercel Production Preview Deployment.

---

## 2. KẾT QUẢ THỰC HIỆN PHASE P4-B (PURE FANTASY PIXEL RPG REDESIGN)

Phase P4-B là cuộc đại tu toàn diện về mặt thẩm mỹ, tối ưu hiệu năng tải trang và trải nghiệm người dùng RPG cho toàn bộ 9 trang của Lex Raid:

### A. Kiểm toán Tài nguyên & Tối ưu Băng thông (Asset Audit & Pipeline)
- **Kiểm toán 306 assets (86.17 MB):** Xây dựng `src/main/resources/tools/audit_assets.py`, xuất bản `docs/P4B_ASSET_AUDIT.md`, `P4B_ASSET_MANIFEST.json`, `P4B_ASSET_INVENTORY.csv`, `P4B_ASSET_RENAME_MAP.csv` và 12 tấm contact sheets tại `assets/qa_audit/`.
- **Giảm tải Logo 99.7%:** Tách nền và cắt chuẩn retina logo chữ sắc nét từ file gốc 2816x1536 (5.87 MB) xuống còn **16.74 KB** (`logo-clean.png` và cập nhật trực tiếp `logo.png`).
- **Triệt tiêu 22 MB Avatar Bloat:** Thay thế toàn bộ các hình nền nặng 6–8.5 MB (`imgs/avatar1..3.png`) dùng trong avatar 48px bằng các ảnh chân dung pixel tối ưu 1.1–5 KB (`assets/ui/avatars/`). Tiết kiệm **~28 MB mỗi lượt tải trang**.

### B. Đồng bộ Danh tính & Chân dung Hiệp sĩ / Quái thú (Identity Mapping)
- Tự động sinh 9 chân dung Boss (`Crabby`, `Captain`, `Fierce`, `Pink`, `Totem 1-3`, `Seashell`, `Cannon`) và 3 chân dung Hero (`Warrior`, `Lancer`, `Archer`) kích thước chuẩn $64 \times 64\text{px}$.
- Đồng bộ hoàn toàn giữa avatar hiển thị trên thanh HUD và sprite hoạt họa đang chiến đấu trong đấu trường.

### C. Đại tu Đấu Trường Boss Hunt (Battle Arena & Sprite Scale)
- **Tăng kích thước Sprite:**
  - Hero tăng từ 0.90x lên **1.35x** (Warrior, Archer) và **1.29x** (Lancer), tạo vị thế anh hùng oai vệ.
  - Boss tăng từ 2.50x lên **2.80x–3.60x** (Crabby 3.2x, Fierce 3.6x, Pink 3.6x, Totem 3.4x, Seashell 3.4x, Cannon 3.5x, Captain 2.8x), tái hiện đúng cảm giác đối đầu quái vật thần thoại.
- **Căn chân tiếp đất hoàn hảo:** Căn chuẩn vị trí tiếp đất tại $Y = 350.00\text{px}$ với sai số dưới $0.0108\text{px}$.
- **Tránh che khuất (Above the fold):** Thu gọn chiều cao sàn đấu từ 620px xuống tối đa 360px (`aspect-ratio: 960/420`). Đảm bảo thanh HUD, Đấu trường, Dock tấn công và Bàn cờ chữ $5 \times 5$ hiển thị trọn vẹn trong màn hình (kể cả trên màn hình mobile 320x568).
- **Khắc phục tràn thanh máu:** Viết lại `.pixel-bar` bằng CSS retro gradients gọn gàng, loại bỏ overlay ảnh khung 822KB bị méo, triệt tiêu 100% hiện tượng gauge tràn mép.
- **Sửa lỗi hiển thị Status:** Khắc phục lỗi parse chuỗi HTML thoát `<span class="pixel-chip"...>` thành raw string `&lt;span...&gt;` trong `minigame.js`.

### D. Khắc phục Gãy Chữ & Giao Diện Kho Từ Vựng (Volcard Redesign)
- Thiết kế theo phong cách **Kinh Thư Cổ Đại (Ancient Spellbook Lexicon)** với nền da dê cuộn giấy vàng và khung gỗ sồi đen viền vàng.
- **Sửa triệt để lỗi gãy chữ `POLYMORPHISM`:** Áp dụng công thức CSS `font-size: clamp(1.35rem, 3.8vw + 0.3rem, 2.35rem); white-space: nowrap; word-break: keep-all; overflow-wrap: normal;` giúp từ 12 ký tự luôn nằm trọn vẹn trên 1 dòng ở mọi độ phân giải từ 320px đến 1920px.
- Định dạng thẻ CEFR pills chuẩn màu sắc theo từng cấp bậc (A1 Xanh lục, A2 Xanh dương, B1 Vàng, B2 Cam, C1 Đỏ ruby, C2 Tím thạch anh).

### E. Hồ Sơ Nhân Vật & Quân Đoàn Hiệp Sĩ (Account Loadout Redesign)
- Chuyển đổi card SaaS xanh dương hiện đại thành **Bảng Hồ Sơ Nhân Vật RPG (Character Sheet)** phong cách Tavern.
- Giữ vững công thức tính toán toán học thanh EXP chuẩn xác ($50/200\text{ XP}$, 25.0%).
- Loại bỏ 100% dev-speak ("FE first, BE ready", "Khóa lưu BE: avatar-a", "Monk/Tu sĩ đã bỏ khỏi flow").

### F. Thống nhất Phong cách Toàn Bộ Các Trang Phụ & Xác thực
- Redesign toàn bộ các trang: `quiz.html`, `memory.html`, `speed-math.html`, `code-puzzle.html`, `auth.html`.
- Áp dụng font chữ thống nhất: **Silkscreen** (tiêu đề pixel retro), **VT323** (số liệu/chỉ số), **Be Vietnam Pro** (nội dung tiếng Việt đọc mượt mà).
- Thống nhất thanh điều hướng Dark Oak Tavern `#241a14` với 5 liên kết chuẩn: Trang chủ, Đấu Boss, Kho từ vựng, Quiz & Thử thách, Nhân vật.

### G. Kiểm Thử Chất Lượng Hình Ảnh & Hồi Quy (Visual QA & Regression)
- `check_case_sensitivity.py`: 129/129 URLs Phaser kiểm tra đạt 0 missing, 0 case mismatch.
- `smoke_check.py`: 0 JS syntax errors, 0 missing DOM IDs, 0 missing asset paths.
- `test_p4b_verification.py`: **43/43 tests PASSED**.
- Độ tương phản WCAG 2.2 AA đạt từ 11.22:1 đến 17.14:1 (vượt xa ngưỡng yêu cầu 4.5:1).
- Hoàn toàn không đụng chạm đến Java 21, Spring Boot 4.2.0, hay SQL Server.
