# PURE FANTASY PIXEL RPG DESIGN SYSTEM — LEX RAID ("KINGDOM OF WORDS")

**Phiên bản:** 3.1.0 (Phase P4-B.3 Cozy Daylight & Moonlight + Arena-First Combat Update)  
**Trạng thái:** `BACKEND UNIT PASS (23/23)` · `STATIC PASS (43/43)` · `BROWSER PASS (9 Viewports / 9 Pages / 0 Failures)`  
**Mục tiêu:** Hệ thống UI 9-slice/3-slice ghép từ asset pixel thật (`Tiny Swords` slices + `Kenney Ancient` + `Kibyra` UI icons), kết hợp hệ màu Cozy **Daylight** & **Moonlight** chuẩn WCAG AA trên 8 trang ngoài trận và Combat Theme tương phản cao trong đấu trường `960x360`.

### Bổ sung P4-B.3 (Cozy Fantasy Theme System & Combat Tokens)
- **Daylight ("Sáng Ấm Cozy" — `data-theme="daylight"`):** Backdrop `#F3EEDC`, Card `#FFF7E6`, Accent xô thơm `#738F62`, Gold `#C4A16A`, Ink chính `#4D3927` (tỷ lệ tương phản `9.4:1`–`10.1:1`).
- **Moonlight ("Tối Thư Giãn Cozy" — `data-theme="moonlight"`):** Backdrop `#212A34`, Card `#34424B`, Accent `#526B8A`, Ink kem `#E6D7B7` (`7.6:1`–`10.7:1`), Muted sage `#A9C0AC` (`5.5:1`). Bảo toàn card gỗ `.pixel-panel-wood` (`#352317`) & thẻ flashcard `#faebd2` không đảo màu CSS filter.
- **Theme Persistence (`theme-system.js`):** Nút Sun/Moon trên Navbar lưu `glp.theme`; `/app/minigame` tự khóa `combat` để giữ độ nét arena mà không ghi đè lựa chọn Daylight/Moonlight khi thoát về trang khác.

### Bổ sung P4-B.2 (Asset-Driven Components & Biomes)
- **Contiguous 9-Slice/3-Slice (`assets/ui/slices/`):** `paper-regular.png`, `wood-board.png`, `banner-scroll.png`, `paper-special.png`, `ribbon-{blue,red,yellow,purple,steel}.png`, `bigbar-track.png`, `smallbar-track.png`, và `kenney/{brown,tan,grey}*.png` dùng CSS `border-image-repeat: stretch` tránh vân lặp lưới.
- **Adventure Guild Navbar:** Bộ 5 icon `Kibyra 32x32` (`icon40`, `icon26`, `icon32`, `icon37`, `icon4`) kết hợp `logo-mark.png` (`42x42` desktop / `32x32` <= 720px).
- **World Environments (`world-environment.js`):** Ánh xạ biome theo trang (`village`, `mountain-dusk`, `forest`, `academy`, `gate`, `waterfall`), tạm dừng tự động theo `document.hidden` và `prefers-reduced-motion`.

---

## 1. NGUYÊN TẮC THIẾT KẾ CỐT LÕI (CORE PRINCIPLES)

1. **Pure Pixel Art Authenticity:**
   - Góc vuông pixel (`border-radius: 0`), viền gỗ sồi tối `#1c120c`, khía kim loại vàng đồng `#d49b29`, nền giấy cổ `#faebd2`.
2. **Above-The-Fold Combat Loop (9/9 Viewports):**
   - Trên mobile (`320x568`..`430x932`), tablet (`768x1024`) và desktop (`1024x768`..`1920x1080`), Stage đấu trường + Attack Dock (`Xóa`/`Tấn Công` $\ge 40\text{px}$) + Bàn cờ `5x5` nằm trọn trong viewport đầu (`coreBottom <= viewportHeight`).
   - Canvas dùng `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain` giữ tỷ lệ `960:420` không bị cắt chân nhân vật.
3. **Typography Separation (Verified in Chromium Specimen):**
   - `--font-pixel: 'Silkscreen', monospace`: Dành cho thương hiệu ASCII, HUD, Turn, Timer, Combo, Board letters, badges ngắn.
   - `--font-display` / `--font-body: 'Be Vietnam Pro', system-ui, sans-serif`: Dành cho tiêu đề tiếng Việt, nút điều hướng, mặt từ vựng Volcard và giải nghĩa (tránh fallback gãy dấu trên `Silkscreen`).
   - `--font-mono: 'JetBrains Mono', 'VT323', monospace`: Mã nguồn và số liệu phân biệt `O0 / I1l / rn`.
4. **Volcard Full-Word Visibility:**
   - `white-space: normal; word-break: normal; overflow-wrap: normal; hyphens: none;` kết hợp `clamp(1.4rem, 3.6vw + 0.35rem, 2.5rem)` và auto-fit JS `fitFlashWord()`; nút TTS xếp dọc phía dưới.

---

## 2. DESIGN TOKENS & WCAG CONTRAST MATH (`STATIC AUDIT`)

| Cặp màu | Tỷ lệ toán học | Chuẩn WCAG 2.2 AA | Kết quả |
| :--- | :---: | :---: | :---: |
| Vàng sáng `#f6c344` trên Gỗ tối `#1c120c` | **11.22 : 1** | $\ge 4.5 : 1$ | **PASS** |
| Chữ mực `#140e0a` trên Giấy cổ `#faebd2` | **16.30 : 1** | $\ge 4.5 : 1$ | **PASS** |
| Chữ kem `#fffdf8` trên Panel gỗ `#241710` | **17.14 : 1** | $\ge 4.5 : 1$ | **PASS** |
| Chữ trắng `#ffffff` trên Nút đỏ `#cf222e` | **5.36 : 1** | $\ge 4.5 : 1$ | **PASS** |
| Chữ gỗ `#1c120c` trên Vàng `#f6c344` | **11.22 : 1** | $\ge 4.5 : 1$ | **PASS** |
