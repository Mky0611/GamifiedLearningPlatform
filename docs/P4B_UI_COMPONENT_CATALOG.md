# DANH MỤC THÀNH PHẦN GIAO DIỆN FANTASY PIXEL RPG — PHASE P4-B
## LEX RAID UI COMPONENT CATALOG & DESIGN SPECIFICATION

**Thời điểm lập:** 25/11/2026  
**Dự án:** Gamified Learning Platform — Lex Raid  
**Tập tin CSS triển khai:** `src/main/resources/FrontEnd/assets/css/pixel-rpg.css`, `base.css`  
**Nhánh thực hiện:** `feature/p4b-fantasy-pixel-redesign`  

---

## 1. HỆ THỐNG DESIGN TOKENS CHUẨN FANTASY PIXEL RPG

```css
:root {
  /* Gỗ sẫm & Gỗ sồi (Dark Wood & Oak Timber) */
  --wood-dark: #1c120c;
  --wood-frame: #3c2a1a;
  --wood-medium: #5a3d24;
  --wood-light: #7a5432;
  --wood-bevel: #8b5f39;

  /* Vàng cổ & Kim loại đồng (Antique Gold & Brass) */
  --gold-bright: #f6c344;
  --gold-base: #d49b29;
  --gold-shadow: #8f6010;
  --gold-highlight: #ffebb3;

  /* Giấy da cổ & Giấy thư viện (Parchment & Library Papyrus) */
  --parchment-base: #fae9c5;
  --parchment-light: #fff5df;
  --parchment-dark: #dfd0b0;
  --parchment-border: #b89c72;

  /* Đá ngục tối (Stone Dungeon) */
  --stone-dark: #2a2c30;
  --stone-base: #4a4e57;
  --stone-light: #727885;

  /* Chỉ số Chiến đấu (Combat & Stats) */
  --hp-crimson: #d9383a;
  --hp-shadow: #8b181a;
  --hp-highlight: #ff7b7d;
  --shield-iron: #64748b;
  --shield-shadow: #334155;
  --shield-highlight: #94a3b8;
  --mana-azure: #3b72d9;
  --mana-shadow: #1e4594;
  --mana-highlight: #709eff;
  --xp-emerald: #2ea44f;
  --xp-shadow: #17652e;
  --xp-highlight: #5bd47e;
  --rage-amber: #ea580c;
  --rage-shadow: #9a3412;
  --rage-highlight: #fb923c;
  --gold-coin: #f59e0b;

  /* Mực viết & Typography (Ink & Lettering) */
  --ink-deep: #140e0a;
  --ink-primary: #2b1d14;
  --ink-muted: #695241;
  --font-pixel: 'Silkscreen', 'VT323', monospace;
  --font-body: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;

  /* Bóng Pixel Sắc Nét (Hard Stepped Shadows) */
  --pixel-shadow-sm: 0 2px 0 0 rgba(28, 18, 12, 0.45);
  --pixel-shadow-md: 0 4px 0 0 rgba(28, 18, 12, 0.6);
  --pixel-shadow-lg: 0 6px 0 0 rgba(28, 18, 12, 0.7);
}
```

---

## 2. BẢNG QUY CHUẨN THÀNH PHẦN (COMPONENT MATRIX)

### 1. Pixel Button (`.pixel-btn`)
- **Mô tả:** Nút bấm 3D nổi khối cơ học mang phong cách game thùng cổ điển.
- **Biến thể:**
  - `.pixel-btn--primary` (Vàng hoàng gia): Nút hành động chính (Attack, Bắt đầu chơi).
  - `.pixel-btn--wood` (Gỗ sồi): Nút phụ, điều hướng (Clear, Quay lại).
  - `.pixel-btn--mana` (Xanh lam): Nút đoán từ đặc biệt (Guess Core).
  - `.pixel-btn--danger` (Đỏ thẫm): Nút đầu hàng, thoát trận.
- **Trạng thái:**
  - `Default`: Khung viền 3px `#1c120c`, viền trong sáng màu trên/trái, viền trong tối màu dưới/phải, bóng cứng 3px.
  - `:hover`: Dịch lên hoặc tăng sáng 5%, con trỏ pointer pixel.
  - `:active` (Pressed): `transform: translateY(2px); box-shadow: 0 1px 0 #1c120c;` tạo độ lún phím cơ học.
  - `:disabled`: Nền xám đá `#555`, viền mờ, không nhận tương tác, `cursor: not-allowed`.
  - `:focus-visible`: Viền sáng outline 2px vàng `#f6c344` hỗ trợ bàn phím WCAG.

### 2. Wood Panel (`.pixel-panel-wood`)
- **Mô tả:** Khung gỗ sẫm kết hợp viền kép vàng cổ đập nổi.
- **Cấu trúc:**
  ```css
  background: #251b14;
  color: #fff4df;
  border: 4px solid #1c120c;
  box-shadow: inset 0 0 0 2px #5a3d24, inset 0 0 0 4px #1c120c, 0 4px 0 0 rgba(0,0,0,0.45);
  ```
- **Ứng dụng:** Khung HUD Hero, Khung HUD Boss, Đấu trường Phaser arena container.

### 3. Parchment Panel (`.pixel-panel-parchment`)
- **Mô tả:** Nền giấy da cổ kết hợp chữ mực nâu sẫm, độ tương phản > 10:1.
- **Cấu trúc:**
  ```css
  background: #fae9c5;
  color: #2b1d14;
  border: 4px solid #1c120c;
  box-shadow: inset 0 0 0 2px #d49b29, inset 0 0 0 4px #3c2a1a, 0 4px 0 0 rgba(0,0,0,0.4);
  ```
- **Ứng dụng:** Thẻ bài từ vựng Volcard, Bảng câu hỏi Quiz, Bảng chữ cái $5 \times 5$.

### 4. Thanh Chỉ Số Pixel (Pixel Bars)
- **Cấu trúc chung:** Khung rãnh trũng viền kép đen `#1c120c`, nền lòng sẫm màu với bóng âm (`box-shadow: inset 2px 2px 0 rgba(0,0,0,0.6)`), thanh fill dải màu retro có vệt sáng pixel trên đỉnh (highlight).
- **Các thanh:**
  - `.pixel-bar--hp`: Máu đỏ (`#d9383a` $\rightarrow$ highlight `#ff7b7d`).
  - `.pixel-bar--shield`: Giáp sắt (`#64748b` $\rightarrow$ highlight `#94a3b8`).
  - `.pixel-bar--rage`: Nộ khí quái vật (`#ea580c` $\rightarrow$ highlight `#fb923c`).
  - `.pixel-bar--xp`: Kinh nghiệm xanh lục (`#2ea44f` $\rightarrow$ highlight `#5bd47e`).
  - `.pixel-bar--mana`: Năng lượng xanh lam (`#3b72d9` $\rightarrow$ highlight `#709eff`).

### 5. Dialog & Modal (`.pixel-modal`)
- **Mô tả:** Hộp thoại chiến thắng / thất bại / thông báo xuất hiện giữa màn hình.
- **Cấu trúc:** Overlay nền tối bán trong suốt (`rgba(14, 9, 6, 0.82)`), khung modal dạng rương báu hoặc văn thư hoàng gia, tiêu đề nằm trên ruy băng pixel (ribbon), các nút hành động phân cấp rõ ràng.

### 6. Ô Ghép Chữ & Bảng Đấu Từ Vựng (Letter Tile & Slot)
- **Kích thước:** Tối thiểu $44 \times 44$ px trên mobile (đạt chuẩn WCAG Touch Target).
- **Hiệu ứng:** Khi được chọn, ô chữ thụt lún (`:active` / `.is-selected`), đổi màu nền sang vàng hổ phách và có vệt sáng viền.

### 7. Badge & Status Chips (`.pixel-chip`, `.pixel-badge`)
- **Mô tả:** Huy hiệu nhỏ hiển thị thông tin: Chapter 1, Turn, CEFR Level, IT Domain, Demo Mode.
- **Cấu trúc:** Padding $4px \times 8px$, viền 2px gỗ sẫm, font `Silkscreen` 12px, nền tùy biến theo sắc thái (Information, Success, Warning, Error, Preview).
