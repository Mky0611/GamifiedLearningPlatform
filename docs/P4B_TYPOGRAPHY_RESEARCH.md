# BÁO CÁO NGHIÊN CỨU & QUY CHUẨN TYPOGRAPHY — PHASE P4-B
## LEX RAID PIXEL RPG TYPOGRAPHY SPECIFICATION

**Thời điểm cập nhật:** 2026-11-25  
**Dự án:** Gamified Learning Platform — Lex Raid  
**Specimen Page:** `/app/typography` (`src/main/resources/FrontEnd/src/pages/typography-specimen.html`)  
**Tập tin kiểm thử:** `Agent & Skill/scripts/chromium_p4b_acceptance.js` (Browser Specimen) & `src/main/resources/tools/test_typography.py` (Static UTF-8 / Math Estimation)  

---

## 1. ĐÁNH GIÁ CHỨNG CỨ TRÊN TRÌNH DUYỆT THẬT (CHROMIUM SPECIMEN)

Qua chạy thực tế trang `/app/typography` trong Headless Chromium (`test_output/p4b_browser/typography_specimen.png`) với cả 5 font Google (`silkscreenLoaded: true`, `beVietnamLoaded: true`, `jetbrainsMonoLoaded: true`, `vt323Loaded: true`, `spaceGroteskLoaded: true`):
- **Combination A (Pure `Silkscreen` cho toàn bộ UI & Tiếng Việt):** Bị **loại bỏ** cho tiếng Việt vì `Silkscreen` thiếu glyphs có dấu (`Đ`, `Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ệ Ứ Ừ Ự`), trình duyệt phải fallback sang font serif mảnh hệ thống tạo độ cao lệch hàng.
- **Combination B (Đã áp dụng chính thức):**
  - `'Silkscreen', monospace`: Dùng cho thương hiệu `"LEX RAID"`, chỉ số ASCII HUD, timer, turn, HP/Shield, ô chữ 5x5 và mã/cấp CEFR ngắn.
  - `'Be Vietnam Pro', system-ui, sans-serif`: Dùng cho tiêu đề tiếng Việt, thanh điều hướng, giải thích nghĩa từ vựng, nút hành động và mặt chữ chính trên Flashcard.
  - `'JetBrains Mono', 'VT323', monospace`: Dùng cho mã nguồn `code-puzzle.html` và cặp số dễ nhầm (`O0`, `I1l`, `rn / m`).
- **Combination C (`Space Grotesk + VT323` & System Fallback):** Lưu làm tham chiếu đối chứng và fallback offline an toàn.

---

## 2. KIỂM CHỨNG HIỂN THỊ CHUỖI KHẮT KHE (`BROWSER PASS` + `STATIC PASS`)

- **`STATIC PASS` (`test_typography.py`):** 14/14 chuỗi kiểm tra hợp lệ UTF-8 & ước tính độ rộng CSS (không phải chứng cứ render trình duyệt).
- **`BROWSER PASS` (`chromium_p4b_acceptance.js` trên Volcard `320x568`, `390x844`, `1366x768`):**
  - `polymorphism`: `22.4px` (`320x568`, `390x844`) và `40px` (`1366x768`) — `clippedX: false`, `ttsOverlap: false`.
  - `continuous integration` (22 ký tự): `18.4px` (`320x568`), `22.4px` (`390x844`), `40px` (`1366x768`) — ngắt dòng tự nhiên tại dấu cách giữa 2 từ, không cắt cụt `...`, không gãy giữa từ (`clippedX: false`).
  - `authentication` (14 ký tự) & `infrastructure` (14 ký tự): `22.4px..40px` — nằm gọn hoàn toàn, `clippedX: false`.

---

## 3. CƠ CHẾ HIỂN THỊ TỪ DÀI KHÔNG CẮT CỤT TRÊN VOLCARD

1. Bỏ hoàn toàn `white-space: nowrap` và `text-overflow: ellipsis` khỏi `.flash-word` trong `volcard.css`.
2. Sử dụng `display: inline-block; max-width: 100%; white-space: normal; word-break: normal; overflow-wrap: normal; hyphens: none;` kết hợp `clamp(1.4rem, 3.6vw + 0.35rem, 2.5rem)`.
3. Hàm `fitFlashWord()` trong `volcard.js` đo chính xác `elWord.scrollWidth` so với vùng chứa của `.flash-word-wrap` (`parentElement.clientWidth - 2`) khi mở thẻ hoặc resize màn hình, chỉ thu nhỏ khi một từ đơn vượt chiều rộng thẻ, giúp từ dài như `POLYMORPHISM` luôn rõ nét và cụm nhiều từ như `CONTINUOUS INTEGRATION` tự xuống dòng sạch sẽ tại ranh giới từ.
4. Nút phát âm `#ttsBtn` (`"Nghe phát âm"`) đặt dọc phía dưới `#flashWord` để không bao giờ chèn ép chiều ngang của từ vựng.
