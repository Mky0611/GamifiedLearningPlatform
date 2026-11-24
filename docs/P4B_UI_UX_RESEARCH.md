# NGHIÊN CỨU THIẾT KẾ GIAO DIỆN FANTASY PIXEL RPG — PHASE P4-B
## LEX RAID UI/UX RESEARCH & ART DIRECTION SPECIFICATION

**Thời điểm lập:** 25/11/2026  
**Dự án:** Gamified Learning Platform — Lex Raid  
**Vai trò:** Lead Game UI/UX Designer, Pixel Art Technical Artist & Frontend Architect  
**Nhánh thực hiện:** `feature/p4b-fantasy-pixel-redesign`  

---

## 1. NGUỒN THAM KHẢO VÀ NGUYÊN LÝ KỸ THUẬT (SOURCES & REFERENCES)

| Nguồn tham khảo | URL chính thức | Ngày truy cập | Nguyên lý kỹ thuật rút ra | Ứng dụng cụ thể cho Lex Raid |
| :--- | :--- | :---: | :--- | :--- |
| **Kenney Pixel UI Pack** | [https://kenney.nl/assets/pixel-ui-pack](https://kenney.nl/assets/pixel-ui-pack) | 25/11/2026 | Quy chuẩn 9-slice panel, nút bấm wood/gold với state pressed lệch 2px Y, icon 16x16 pixel chuẩn. | Áp dụng cấu trúc viền khung gỗ, parchment panel và button depth cho toàn bộ hệ thống UI. |
| **Kenney Pixel Adventure** | [https://kenney.nl/assets/ui-pack-pixel-adventure](https://kenney.nl/assets/ui-pack-pixel-adventure) | 25/11/2026 | HUD tối giản, health bar có viền kim loại antique gold, font bitmap tương phản cao. | Thiết kế lại thanh máu Hero/Boss, chỉ số Turn/Timer và word dock. |
| **MDN Border Image Slice** | [https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image-slice](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image-slice) | 25/11/2026 | Cơ chế 9-slice native trong CSS không làm méo góc họa tiết pixel khi kích thước co giãn. | Thay thế `background-size: 100% 100%` bằng `border-image` chuẩn xác cho các panel và dialog box. |
| **MDN Crisp Pixel Art Look** | [https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look) | 25/11/2026 | `image-rendering: pixelated;` và `crisp-edges;`, tránh bilinear interpolation làm mờ sprite pixel. | Cấu hình CSS canvas và pixel components giữ sắc nét trên màn hình retina/high-DPI. |
| **Phaser 3.90 Types & Scale** | [https://docs.phaser.io/api-documentation/3.90.0/typedef/types-core](https://docs.phaser.io/api-documentation/3.90.0/typedef/types-core) | 25/11/2026 | `pixelArt: true`, `roundPixels: true`, anchor feet grounding và scale manager mode FIT. | Tối ưu hóa render đấu trường, căn chỉnh chân Hero/Boss bám sàn Y=350, tăng scale nhìn rõ. |
| **W3C WCAG 2.2** | [https://www.w3.org/TR/wcag/](https://www.w3.org/TR/wcag/) | 25/11/2026 | Độ tương phản tối thiểu 4.5:1 cho body text, 3:1 cho UI components; tap target tối thiểu 44x44px. | Đảm bảo tính khả dụng trên mobile word board, chữ nghĩa từ vựng tiếng Anh rõ ràng. |
| **Google Fonts** | [https://fonts.google.com/](https://fonts.google.com/) | 25/11/2026 | Kết hợp font pixel cho title/HUD với font geometric sans-serif hỗ trợ tiếng Việt đầy đủ cho body/educational text. | Silkscreen/VT323 cho title + Be Vietnam Pro cho nội dung học thuật, chống rách chữ. |

---

## 2. PHÂN TÍCH 5 HƯỚNG THIẾT KẾ FANTASY PIXEL RPG

### Hướng 1: Medieval Fantasy Game Menus (Menu Trung Cổ & Tavern Guild)
- **Đặc trưng:** Bảng gỗ sồi sẫm màu (`#241A14`), viền đinh tán đồng hoặc vàng cổ (`#D6A64C`), bề mặt giấy da cổ (parchment `#F3E4BE`), ruy băng tiêu đề (ribbons).
- **Trải nghiệm:** Mang lại cảm giác người chơi đang bước vào một quán trọ phiêu lưu giả tưởng (Adventurer's Guild Tavern).
- **Áp dụng cho Lex Raid:** Áp dụng cho Main Navigation, Trang chủ (Home), Auth (Guild Gate) và Menu chính.

### Hướng 2: Turn-Based Pixel RPG Battle HUD (Đấu trường Theo Lượt)
- **Tham khảo:** Cảm hứng từ Octopath Traveler, Sea of Stars và Bookworm Adventures cổ điển.
- **Đặc trưng:**
  - Hero đứng cánh trái, hướng sang phải. Boss đứng cánh phải, hướng sang trái.
  - Tỉ lệ nhân vật nổi bật trong không gian sàn đấu, không bị lọt thỏm.
  - HUD chia đôi đối xứng: Cánh trái hiển thị HP/Mana/Shield của Hero; cánh phải hiển thị HP/Shield/Rage của Boss.
  - Khu vực thao tác (Action & Word Deck) nằm tập trung bên dưới, tầm mắt dễ quan sát cả đấu trường lẫn bảng chữ.
- **Áp dụng cho Lex Raid:** Bố cục lại hoàn toàn trang `minigame.html` và Phaser Scene. Đưa Word Board và nút Attack lên trên nếp gấp màn hình (above-the-fold) trên desktop.

### Hướng 3: Character Profile & Equipment Screen (Hồ sơ Nhân vật RPG)
- **Tham khảo:** Stardew Valley inventory, CrossCode character status, Final Fantasy Tactics.
- **Đặc trưng:**
  - Chân dung nhân vật nổi bật (Portrait Frame) với viền vàng cổ.
  - Thanh EXP toán học có độ sâu, hiển thị rõ tiến độ cấp bậc, level badge retro.
  - Thống kê (Coins, Streak, Trận đánh, Sao kỷ lục) hiển thị dưới dạng slot huy hiệu, không dùng thẻ dashboard văn phòng.
  - Lưới chọn Hero / Avatar hiển thị dạng các thẻ bài phiêu lưu (Adventurer License / Class Cards).
- **Áp dụng cho Lex Raid:** Trang `/app/account` loại bỏ toàn bộ gradient xanh dương SaaS phẳng, chuyển thành thẻ phiêu lưu Guild License.

### Hướng 4: Quest Journal, Spellbook & Adventure Map (Sách Phép & Cuốn Sách Từ Vựng)
- **Tham khảo:** Grimoire trong các game nhập vai pháp thuật, cuốn sổ nhiệm vụ viết trên giấy da.
- **Đặc trưng:**
  - Thẻ bài từ vựng là một trang sách cổ (Spellbook Page).
  - Nền giấy da parchment tự nhiên, chữ mực nâu sẫm (`#302219`) đạt độ tương phản > 7:1.
  - Các huy hiệu POS, CEFR, IT Domain được thể hiện như các dấu triện phép thuật (Rune Seals).
  - Từ tiếng Anh dài (như `POLYMORPHISM`) hiển thị toàn vẹn trên 1 dòng, không bị ngắt gãy ngang chữ.
- **Áp dụng cho Lex Raid:** Trang `/app/volcard` và `/app/quiz`.

### Hướng 5: Pixel Game Design Systems (Hệ Thống Thành Phần Độc Bản)
- **Tham khảo:** Kenney Pixel UI, Celeste UI, Shovel Knight interface tokens.
- **Đặc trưng:**
  - Các nút bấm có hiệu ứng 3D dập nổi (bevel): cạnh trên sáng hơn, cạnh dưới tối hơn 2-3px. Khi click (`:active`), toàn bộ nội dung dịch xuống 2px tạo cảm giác cơ học chân thật.
  - 100% icon đồng bộ kích thước lưới pixel (16x16 hoặc 24x24).
  - Không pha trộn các hiệu ứng đổ bóng mờ nhòe (soft blur shadow) của CSS hiện đại vào thế giới pixel art.

---

## 3. CÁC THIẾT KẾ KHÔNG PHÙ HỢP CẦN LOẠI BỎ (ANTI-PATTERNS)

1. **Dashboard SaaS bo tròn (Rounded Flat Cards):** Các góc `border-radius: 16px` kết hợp nền trắng phẳng và icon SVG mảnh làm mất hoàn toàn chất game RPG. $\rightarrow$ Thay bằng khung gỗ góc cạnh hoặc 9-slice pixel.
2. **Gradient xanh dương hiện đại (`linear-gradient(135deg, #3b82f6, #1d4ed8)`):** Tạo cảm giác ứng dụng quản lý tài chính hoặc công nghệ fintech. $\rightarrow$ Thay bằng tone màu gỗ ấm, vàng cổ và giấy da.
3. **Kéo dãn hình ảnh (Stretched Backgrounds):** Dùng `background-size: 100% 100%` trên các ảnh panel trang trí vuông làm biến dạng nghiêm trọng họa tiết. $\rightarrow$ Dùng `border-image` hoặc CSS pattern repeating.
4. **Font Pixel gượng ép trên đoạn văn dài:** Dùng font 8-bit cho toàn bộ văn bản giải nghĩa tiếng Anh và tiếng Việt khiến người dùng mỏi mắt và rách chữ. $\rightarrow$ Dùng font Sans-Serif chuẩn cho phần đọc hiểu.
5. **Đổ bóng mờ nhòe (Fuzzy Drop Shadows):** Dùng `box-shadow: 0 10px 25px rgba(0,0,0,0.5)` mờ ảo kiểu web 2.0. $\rightarrow$ Thay bằng `box-shadow: 3px 3px 0 #18100c` sắc nét chuẩn pixel.

---

## 4. WIREFRAME CHI TIẾT

### Desktop Wireframe (1440x900 / 1366x768) — Battle Screen (`/app/minigame`)
```text
+--------------------------------------------------------------------------------------------------+
| [LOGO LEX RAID]  [Home]  [Boss Hunt*]  [Quiz]  [Volcard]  [Account]         [User: Lv.2 | 150 G]  | (H: 56px)
+--------------------------------------------------------------------------------------------------+
| <Chương 1: Whispering Rain Gate>  [NORMAL]  [Turn 1/5]  [Timer: 20s]  [Preview Demo Mode]         | (H: 36px)
+--------------------------------------------------------------------------------------------------+
| +---------------------+ +----------------------------------------------+ +---------------------+ |
| | HERO HUD            | | PHASER BATTLE ARENA (960 x 360 logical)      | | BOSS HUD            | |
| | [Warrior Portrait]  | |                                              | | [Crabby Portrait]   | |
| | Sir Lancelot (L.1)  | |        [Hero: Warrior]        [Boss: Crabby] | | Raincap Warden      | |
| | HP: [|||||||||] 100 | |            (Y=350)                (Y=350)    | | HP: [|||||||||] 100 | |
| | Shield: [||||]  20  | |     (Scale 1.4, bám sàn)   (Scale 2.8, bám)  | | Shield: [|||]   30  | |
| | Combo: x1           | |         ~~~~~~~~ SÀN ĐẤU GỖ ~~~~~~~~         | | Rage:   [|]     20  | |
| +---------------------+ +----------------------------------------------+ +---------------------+ |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | WORD COMBAT DOCK (Nằm gọn gàng ngay dưới Arena - Không cần cuộn chuột)                       | |
| | +-----------------------------------------------+ +---------------------------------------+ | |
| | | TỪ ĐANG GHÉP: [ B ] [ O ] [ O ] [ K ] [ _ ]   | | CORE CLUE: "Sách / Học từ vựng"         | | |
| | |                                               | | Core Target: [ L ] [ E ] [ A ] [ R ] [N]| | |
| | | BÀNG CHỮ 5x5:                                 | |                                         | | |
| | | [ A ] [ B ] [ C ] [ D ] [ E ]                 | | [CLEAR WORD] (Wood Button)              | | |
| | | [ F ] [ G ] [ H ] [ I ] [ J ]                 | | [ATTACK BOSS] (Gold 3D Pixel Button)    | | |
| | | [ K ] [ L ] [ M ] [ N ] [ O ]                 | | [GUESS CORE] (Mana Blue Button)         | | |
| | | [ P ] [ Q ] [ R ] [ S ] [ T ]                 | |                                         | | |
| | | [ U ] [ V ] [ W ] [ X ] [ Y ]                 | | Objectives: 3 topic words, 1 core guess | | |
| | +-----------------------------------------------+ +---------------------------------------+ | |
| +----------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

### Mobile Wireframe (390x844) — Battle Screen (`/app/minigame`)
```text
+-----------------------------------+
| [=] [LOGO]            [Lv.2 | 150G|
+-----------------------------------+
| Stage 1 · 20s/turn · Demo Mode    |
+-----------------------------------+
| COMPACT BATTLE ARENA (360x220)    |
| Hero HP: 100       Boss HP: 100   |
|     [Hero]           [Boss]       |
|    ~~~~~~~~ Sàn Đấu ~~~~~~~~      |
+-----------------------------------+
| SELECTED: [ B ][ O ][ O ][ K ]    |
| Core Clue: "Sách / Học tập"       |
+-----------------------------------+
| WORD BOARD 5x5 (Tap Target 44px)  |
| [ A ] [ B ] [ C ] [ D ] [ E ]     |
| [ F ] [ G ] [ H ] [ I ] [ J ]     |
| [ K ] [ L ] [ M ] [ N ] [ O ]     |
| [ P ] [ Q ] [ R ] [ S ] [ T ]     |
| [ U ] [ V ] [ W ] [ X ] [ Y ]     |
+-----------------------------------+
| [ CLEAR ]   [ ATTACK BOSS (x1) ]  |
+-----------------------------------+
```

---

## 5. KẾT LUẬN & ĐỀ XUẤT ÁP DỤNG

1. **Chuẩn hóa Design Tokens:** Tạo file `pixel-rpg.css` tinh chỉnh với bảng màu Fantasy chuẩn: Gỗ sẫm `#241A14`, Khung vàng cổ `#D6A64C`, Giấy da `#F3E4BE`, Máu `#A63D40`, Mana `#3B668E`.
2. **Typography phân lớp:** Dùng font pixel sắc nét cho Title & HUD, dùng font geometric chuẩn (`Be Vietnam Pro`) cho từ vựng và giải nghĩa học tập.
3. **Căn chỉnh chân nhân vật & scale:** Tăng scale Hero từ 0.9 lên 1.35–1.4, tăng scale Boss cân đối (2.5–3.0), cố định chân trên sàn đấu Y=350.
4. **Tối ưu hóa độ cao Viewport:** Giảm padding dư thừa, co gọn arena thành 960x360 để Word Board và Attack Dock hiển thị trọn vẹn trong màn hình 768px/800px/900px chiều cao.
