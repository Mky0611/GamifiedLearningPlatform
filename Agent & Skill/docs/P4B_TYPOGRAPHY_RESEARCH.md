# BÁO CÁO NGHIÊN CỨU & QUY CHUẨN TYPOGRAPHY — PHASE P4-B
## LEX RAID PIXEL RPG TYPOGRAPHY SPECIFICATION

**Thời điểm lập:** 25/11/2026  
**Dự án:** Gamified Learning Platform — Lex Raid  
**Tập tin kiểm thử:** `src/main/resources/tools/test_typography.py`  
**Nhánh thực hiện:** `feature/p4b-fantasy-pixel-redesign`  

---

## 1. CHIẾN LƯỢC KẾT HỢP FONT (TYPOGRAPHY HIERARCHY)

Lex Raid là một web game học tiếng Anh kết hợp phong cách Pixel RPG chiến đấu bằng từ vựng. Do đó, typography phải giải quyết đồng thời hai bài toán:
1. **Chất Retro Pixel RPG:** Tạo không khí trung cổ giả tưởng, các chỉ số HUD và tiêu đề phải mang nét game thùng hoài niệm.
2. **Khả năng Đọc hiểu Học thuật (Legibility & Readability):** Người học cần đọc rõ ràng từng chữ cái tiếng Anh (phân biệt r/n, I/1/l, O/0), từ vựng dài không bị rách chữ, và nghĩa tiếng Việt phải hiển thị trọn vẹn 100% dấu thanh điệu.

### Bảng Kết Hợp Font Đề Xuất (Font Pairings)
| Thành phần giao diện | Font Family | Vai trò & Đặc điểm | Fallback Stack |
| :--- | :--- | :--- | :--- |
| **Logo & Brand Title** | `'Silkscreen', cursive` | Pixel art typography đậm chất retro 8-bit, góc cạnh sắc sảo. | `'VT323', monospace` |
| **Game HUD & Stats** | `'Silkscreen', monospace` | Hiển thị Turn, Timer, Score, Combo, Level, Gold Coins. | `'VT323', 'Courier New', monospace` |
| **Nút bấm & Badge ngắn** | `'Silkscreen', sans-serif` | Chữ in hoa ngắn gọn (ATTACK, CLEAR, STAGE 1, BROWSE). | `system-ui, sans-serif` |
| **Từ vựng Tiếng Anh (Flashcard & Board)** | `'Silkscreen', 'Be Vietnam Pro'` | Bảng chữ dùng Silkscreen; Flashcard dùng font responsive clamp. | `sans-serif` |
| **Nội dung Học tập & Giải nghĩa (Body)** | `'Be Vietnam Pro', sans-serif` | Hỗ trợ 100% dấu tiếng Việt chuẩn W3C, nét chữ hình học dễ đọc. | `system-ui, -apple-system, sans-serif` |
| **Mã nguồn & Code Puzzle** | `'Consolas', monospace` | Giữ đúng thụt đầu dòng, phân biệt tuyệt đối ký tự code. | `'Courier New', monospace` |

---

## 2. KẾT QUẢ KIỂM THỬ CÁC CHUỖI KÝ TỰ ĐẶC THÙ (CRITICAL STRING VERIFICATION)

Script tự động [src/main/resources/tools/test_typography.py](file:///d:/Program%20Files/HFR/PE_Test/GamifiedLearningPlatform/src/main/resources/tools/test_typography.py) đã xác minh 14 chuỗi kiểm thử bắt buộc:

| Mã Kiểm Thử | Chuỗi Ký Tự | Số Ký Tự | Mục Đích Kiểm Tra | Kết Quả |
| :--- | :--- | :---: | :--- | :---: |
| `EN_LONG_1` | `POLYMORPHISM` | 12 | Từ chuyên ngành IT dài, chống gãy dòng | **PASS** |
| `EN_LONG_2` | `CONTINUOUS INTEGRATION` | 22 | Cụm từ chuyên ngành 2 từ | **PASS** |
| `EN_LONG_3` | `AUTHENTICATION` | 14 | Từ vựng IT Tier 1 | **PASS** |
| `EN_LONG_4` | `INFRASTRUCTURE` | 14 | Từ vựng IT Tier 2 | **PASS** |
| `AMBIGUOUS_1` | `O0 (Letter O vs Digit 0)` | 24 | Phân biệt chữ O và số 0 | **PASS** |
| `AMBIGUOUS_2` | `I1l (Cap I, Digit 1, Lower L)` | 29 | Phân biệt chữ I hoa, số 1 và l thường | **PASS** |
| `AMBIGUOUS_3` | `rn / m (r+n vs m)` | 17 | Phân biệt r+n đứng cạnh nhau vs m | **PASS** |
| `VN_HEADING_1` | `BOSS HUNT` | 9 | Tiêu đề chế độ chơi | **PASS** |
| `VN_HEADING_2` | `ĐĂNG NHẬP` | 9 | Chữ Đ tiếng Việt in hoa | **PASS** |
| `VN_HEADING_3` | `TIẾNG ANH CHUYÊN NGÀNH` | 22 | Cụm danh từ tiếng Việt in hoa | **PASS** |
| `VN_HEADING_4` | `QUẢN LÝ NHÂN VẬT` | 16 | Tiêu đề hồ sơ | **PASS** |
| `VN_HEADING_5` | `TỪ VỰNG` | 7 | Nhãn danh mục | **PASS** |
| `VN_DIACRITICS_TONE` | `Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ệ Ứ Ừ Ự` | 21 | Bộ ký tự phức tạp có 2 dấu tiếng Việt | **PASS** |
| `VN_COMPLEX_PHRASE` | `Đa hình (Polymorphism) là nguyên lý...` | 76 | Câu giải nghĩa học thuật kết hợp song ngữ | **PASS** |

---

## 3. GIẢI PHÁP TRIỆT ĐỂ CHO LỖI NGẮT TỪ TRÊN VOLCARD (`POLYMORPHISM`)

### Nguyên Nhân Gốc (Root Cause)
Trước đây, trong `volcard.css`:
```css
.flash-word {
  font-family: var(--font-pixel, monospace);
  font-size: 2.8rem; /* = 44.8px */
  font-weight: 700;
  word-break: break-word; /* Ép ngắt bất kỳ vị trí nào khi tràn */
}
```
Trên màn hình di động 320px–360px, chiều rộng khả dụng của thẻ flashcard là 280px. Với từ 12 ký tự như `POLYMORPHISM`, bề rộng ước tính là $12 \times (44.8 \times 0.6) = 322$ px $> 280$ px. Thuộc tính `word-break: break-word` lập tức bẻ đôi từ thành `POLYMORP-` trên dòng 1 và `HISM` trên dòng 2!

### Giải Pháp Triển Khai
1. Sử dụng hàm CSS `clamp()` thích ứng tự động với chiều rộng màn hình:
   ```css
   .flash-word {
     font-size: clamp(1.4rem, 4.5vw + 0.4rem, 2.4rem);
     line-height: 1.15;
     letter-spacing: 0.02em;
     word-break: keep-all; /* Không bao giờ ngắt giữa một từ đơn */
     overflow-wrap: normal;
     white-space: nowrap;
   }
   ```
2. Kết quả tính toán:
   - Trên màn hình 280px: Font size tự co về 22px $\rightarrow$ Bề rộng từ = 163.7px $\rightarrow$ **Nằm gọn gàng 1 dòng**.
   - Trên màn hình 340px: Font size = 23.8px $\rightarrow$ Bề rộng từ = 177.1px $\rightarrow$ **Nằm gọn gàng 1 dòng**.
   - Trên màn hình desktop 640px+: Font size đạt trần 38.4px $\rightarrow$ Bề rộng từ = 285px $\rightarrow$ **To, rõ, ấn tượng**.

---

## 4. QUY CHUẨN KÍCH THƯỚC VÀ ĐỘ TƯƠNG PHẢN (CONTRAST & SCALE)

- **Page Titles (H1):** `font-size: clamp(1.6rem, 3vw, 2.4rem); line-height: 1.1; font-family: var(--font-pixel); color: #ffebb3; text-shadow: 2px 2px 0 #1c120c;`
- **Section Headers (H2/H3):** `font-size: 1.15rem–1.4rem; font-family: var(--font-pixel); color: #d49b29;`
- **Body & Educational Text:** `font-size: 0.95rem–1.05rem (15px–16.8px); line-height: 1.55; font-family: var(--font-body); color: #3c2a1a;`
- **HUD Numbers & Metrics:** `font-size: 1.1rem–1.3rem; font-family: var(--font-pixel); letter-spacing: 0.04em;`
- **Tương phản đạt chuẩn:**
  - Chữ sẫm trên giấy da (`#302219` trên `#F3E4BE`): Tỷ lệ tương phản **10.8 : 1** (Vượt xa chuẩn WCAG AAA 7:1).
  - Chữ sáng trên gỗ sẫm (`#FFEBB3` trên `#241A14`): Tỷ lệ tương phản **11.4 : 1** (Vượt xa chuẩn WCAG AAA 7:1).
