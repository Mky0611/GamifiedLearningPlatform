# PURE FANTASY PIXEL RPG DESIGN SYSTEM — LEX RAID

**Phiên bản:** 2.1.0 (Phase P4-B Visual Acceptance Update)  
**Trạng thái:** `STATIC PASS (43/43)` & `BROWSER PASS (Chromium 9 Viewports / 9 Pages)`  
**Mục tiêu:** Ngôn ngữ thiết kế **Pure Fantasy Pixel RPG** kết hợp công thái học retro, tương phản đạt chuẩn, asset tách gọn (`logo-mark.png` `42.78 KB`, `favicon.png` `8.34 KB`, portraits `< 15 KB`), và hiển thị hoàn chỉnh trên mọi độ phân giải từ `320x568` đến `1920x1080`.

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
