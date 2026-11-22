# PIXEL RPG DESIGN SYSTEM — LEX RAID

**Phiên bản:** 1.0.0  
**Giai đoạn:** Phase P1 (Pixel RPG Design System & Foundation)  
**Tác giả:** Antigravity Engineering & Design Team  
**Mục tiêu:** Định hình ngôn ngữ thiết kế **Classic Fantasy Pixel RPG** kết hợp tính trực quan, công thái học (ergonomics) và trải nghiệm chiến đấu bằng từ vựng phong cách retro, vận hành mượt mà trên cả Mobile (320px–430px) và Desktop (1366px–1920px).

---

## 1. NGUYÊN TẮC THIẾT KẾ CỐT LÕI (DESIGN PRINCIPLES)

1. **Pixel Art Authenticity (Không nửa vời):**
   - Loại bỏ hoàn toàn bo tròn hiện đại dạng pill/squircle (`border-radius: 28px`, `border-radius: 999px`) và hiệu ứng mờ nhạt SaaS Dashboard.
   - Sử dụng các đường viền sắc nét, khung gỗ viền vàng, góc khía pixel (stepped box-shadows hoặc 9-slice borders) và bề mặt parchment (giấy cổ).
2. **Combat-First Visual Hierarchy (Trọng tâm chiến đấu):**
   - Trên mobile: Toàn bộ vòng lặp (Battle Arena + Word Board + Selected Word + Attack Dock) phải nằm trọn trong 1 màn hình duy nhất (**No-Scroll Battle Loop**).
   - Thông tin phụ (stage details, quest inventory, vocabulary list) được ẩn trong drawer hoặc panel thu gọn để không tranh chấp thị giác với trận đấu.
3. **Tactile & Responsive Feedback:**
   - Mọi nút bấm pixel có đủ 4 trạng thái: Default, Hover (sáng viền), Pressed (lún xuống 2px–4px bằng `transform: translateY`), Disabled (tối màu, chìm xuống).
   - Ô chữ (Letter Tiles) có cảm giác ấn nảy rõ ràng, hỗ trợ cả Click chuột và Chạm cảm ứng (Touch), kèm thao tác Tap-to-Undo trực tiếp.
4. **Bilingual Typography (Hỗ trợ tiếng Việt hoàn hảo):**
   - Tiêu đề, HUD, nút bấm, điểm số: Dùng font retro/pixel (`'Silkscreen'`, sans-serif fallback).
   - Nội dung học tập dài, phiên âm IPA, giải nghĩa tiếng Việt: Dùng font sans-serif hình học rõ nét (`'Be Vietnam Pro'`), không dùng font pixel quá nhỏ gây mỏi mắt cho người học.

---

## 2. HỆ THỐNG MÀU SẮC (COLOR TOKENS)

### A. Bảng màu Gỗ & Khung viền (Wood & Timber)
* `--wood-dark: #1c120c;` — Viền bóng tối sâu nhất, tạo viền pixel 1px/2px.
* `--wood-frame: #3c2a1a;` — Màu khung gỗ chính của panel và bảng chữ.
* `--wood-medium: #5a3d24;` — Mặt gỗ sồi trung tính.
* `--wood-light: #7a5432;` — Vệt sáng gỗ trên mép trên cùng.

### B. Bảng màu Vàng kim & Huy hiệu (Gold & Brass)
* `--gold-bright: #f6c344;` — Viền sáng, ánh kim loại, trạng thái Active.
* `--gold-base: #d49b29;` — Màu vàng đồng cổ điển cho đường viền chính.
* `--gold-shadow: #8f6010;` — Bóng đổ vàng đồng.
* `--gold-highlight: #ffebb3;` — Vệt sáng góc 45 độ trên nút và khung.

### C. Bảng màu Giấy cổ (Parchment & Slate)
* `--parchment-base: #fae9c5;` — Nền giấy da cổ sáng cho bảng chữ và card.
* `--parchment-light: #fff5df;` — Vùng chọn chữ, nền ô chữ sẵn sàng.
* `--parchment-dark: #dfd0b0;` — Nền rãnh trũng của ô chữ đã chọn.

### D. Chỉ số Chiến đấu (Combat Gauge Accents)
* `--hp-crimson: #d9383a;` — Máu người chơi và Boss.
* `--hp-shadow: #8b181a;` — Vùng bóng thanh máu.
* `--mana-azure: #3b72d9;` — Năng lượng / Khiên chắn (Shield).
* `--xp-emerald: #2ea44f;` — Kinh nghiệm / Từ vựng chính xác.
* `--gold-coin: #f59e0b;` — Tiền xu / Phần thưởng màn chơi.

---

## 3. TYPOGRAPHY TOKENS

```css
:root {
  --font-pixel: 'Silkscreen', 'Press Start 2P', monospace, sans-serif;
  --font-body: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
}
```

* **Game Titles & Boss Names:** `font-family: var(--font-pixel); font-size: 1.2rem - 1.8rem; text-transform: uppercase;`
* **HUD Labels & Gauges:** `font-family: var(--font-pixel); font-size: 0.75rem - 0.95rem;`
* **Letter Tiles:** `font-family: var(--font-pixel); font-weight: 700; font-size: 1.35rem;`
* **Definitions & Content:** `font-family: var(--font-body); font-weight: 500; font-size: 0.95rem; line-height: 1.45;`

---

## 4. BỘ UI COMPONENTS DÙNG CHUNG (PIXEL UI SUITE)

### A. Khung Pixel Panel (`.pixel-panel`)
Khung viền gỗ nhiều lớp với góc vuông pixel, tạo chiều sâu 3D cổ điển mà không dùng gradient mềm hiện đại:
```css
.pixel-panel {
  background: var(--parchment-base);
  border: 4px solid var(--wood-dark);
  box-shadow: 
    inset 0 0 0 2px var(--gold-base),
    inset 0 0 0 4px var(--wood-frame),
    0 4px 0 0 rgba(0, 0, 0, 0.45);
  border-radius: 0;
  position: relative;
}
```

### B. Nút Bấm Pixel 3D (`.pixel-btn`)
Nút bấm pixel nổi khối có độ lún thật khi bấm chuột/chạm:
* **Default:** Nhô lên 4px (`box-shadow: inset -4px -4px 0 var(--gold-shadow), inset 4px 4px 0 var(--gold-highlight), 0 4px 0 #1c120c`).
* **Hover:** Sáng viền, nhô lên 3px.
* **Active (Pressed):** Lún xuống (`transform: translateY(4px); box-shadow: 0 0 0;`).
* **Disabled:** Chìm màu, không nhận tương tác pointer.

### C. Thanh Máu & Năng Lượng Pixel (`.pixel-bar`)
Thanh hiển thị có viền đen pixel 3px, nền rãnh tối, lớp fill phân mảnh từng pixel và con số hiển thị sắc nét bằng font Silkscreen.

### D. Ô Chữ Đấu Trường (`.pixel-tile`)
* Kích thước chuẩn trên mobile: `min-width: 44px; min-height: 44px;` đảm bảo diện tích chạm ngón tay cái.
* Trạng thái đã chọn (Selected): Thu nhỏ và chìm vào bảng rãnh, đổi sang màu nâu gỗ tối.
* Trạng thái từ vựng Core Word: Viền vàng lấp lánh nhẹ nhàng.

---

## 5. BỐ CỤC ĐẤU TRƯỜNG MOBILE-FIRST (NO-SCROLL SPECIFICATION)

Để đảm bảo người chơi trên điện thoại nhỏ (đặc biệt **320×568 iPhone SE / Galaxy Z Flip cover**):
1. **Phần tử trên cùng:** Arena View (Phaser Canvas 960×420 thu phóng tự nhiên, giữ nguyên tỷ lệ `16:7`).
2. **Arena Overlay HUD:** Máu Hero (góc trái) và Máu Boss (góc phải) gắn nổi trực tiếp trên canvas, không chiếm thêm diện tích dọc bên ngoài.
3. **Vòng chiến đấu cốt lõi:**
   - Selected Word Tray (Khay chữ đang ghép)
   - Attack Dock (Nút Clear bên trái, Nút Attack nổi bật bên phải, Damage Counter ở giữa)
   - Word Board (Lưới 5×5 ô chữ)
4. **Tổng ngân sách chiều cao dọc:** Giới hạn tối đa **455px / 568px** trên màn hình 320×568, dư ra 113px cho an toàn vùng vuốt thanh điều hướng hệ điều hành.

---

## 6. KẾ HOẠCH TRIỂN KHAI VÀO CODEBASE

1. `src/main/resources/FrontEnd/assets/css/pixel-rpg.css`: Chứa toàn bộ design tokens và lớp dùng chung.
2. Cập nhật `base.css`: Tích hợp `pixel-rpg.css`, chuẩn hóa navigation bar và các biến màu gốc.
3. Áp dụng vào `minigame.css` & `minigame.html`: Chuẩn hóa giao diện Lex Raid Battle.
4. Áp dụng vào `home.css` & `home.html`: Chuẩn hóa trang chủ phiêu lưu.
