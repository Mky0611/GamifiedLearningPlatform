# BÁO CÁO KIỂM TOÁN CƠ SỞ DỮ LIỆU TỪ VỰNG — P2-A AUDIT
## LEX RAID PIXEL RPG — VOCABULARY ENGINE & IT ENGLISH

**Thời điểm kiểm toán:** 23/11/2026  
**Nguồn dữ liệu:** `script_GPL_v2.sql` (Encoding: **UTF-16 LE**, kích thước 2.65 MB) & Microsoft SQL Server Database `GamifiedLearningPlatform`.  
**Công cụ phân tích:** `src/main/resources/tools/audit_vocabulary_db.py` (Parser trực tiếp SQL Server INSERT scripts).

---

## 1. TỔNG QUAN BẢNG DỮ LIỆU TỪ VỰNG & TIẾN TRÌNH

| Tên bảng trong SQL Server | Số dòng thực tế (Rows) | Ghi chú cấu trúc |
| :--- | :---: | :--- |
| `vocabulary_topics` | **9** | 9 chủ đề lớn: General, Animals, Business, Tech, Science, Environment, Education, Common 6000, Japanese Basic. |
| `vocabulary_sets` | **17** | 16 bộ tiếng Anh (`language_code = 'en'`) + 1 bộ tiếng Nhật (`language_code = 'ja'`). |
| `vocabulary_words` | **2,098** | Tổng số từ vựng nạp sẵn trong hệ thống seed ban đầu. |
| `stages` | **6** | 6 stage chiến đấu hiện có trong database (tương ứng 6 Boss Chapter 1–6). |
| `stage_core_words` | **6** | 6 từ khóa cốt lõi gắn liền với 6 stage và 6 quái thú. |
| `user_word_mastery` | Tồn tại | Bảng lưu lịch sử học: `times_seen`, `times_found`, `mastery_score`, `mastery_state`. |

---

## 2. PHÂN TÍCH THEO NGÔN NGỮ (LANGUAGE CODE)

| Ngôn ngữ | Số từ (Words) | Tỷ lệ | Phân bổ bộ từ vựng (Vocabulary Sets) |
| :--- | :---: | :---: | :--- |
| **English (`en`)** | **2,096** | 99.90% | Set 1 đến Set 16 (Gồm 5 sets IELTS Academic 125 từ + 11 sets Common 6000 1,971 từ). |
| **Japanese (`ja`)** | **2** | 0.10% | Set 17 (`Japanese Basic Set 01` - Topic 9 `JP_BASIC`): `ohayou`, `arigatou`. |

> [!IMPORTANT]
> **Quy tắc bảo toàn:** Tuyệt đối không xóa dữ liệu tiếng Nhật trong database. Thay vào đó, trong chế độ học tiếng Anh (English Battle / Volcard English), hệ thống lọc nghiêm ngặt theo `language_code = 'en'` ở tầng Repository/Service.

---

## 3. PHÂN BỐ CẤP ĐỘ CEFR THỰC TẾ

| Cấp độ CEFR | Số lượng từ thực tế | Tỷ lệ | Đánh giá & Hiện trạng |
| :--- | :---: | :---: | :--- |
| **A1** | **0** | 0.0% | Chưa có từ nào được gắn nhãn A1 trong database gốc. |
| **A2** | **0** | 0.0% | Chưa có từ nào được gắn nhãn A2 trong database gốc. |
| **B1** | **23** | 1.10% | Nằm trong các bộ IELTS Core (Topic Tech, Business, Science, Environment, Education). |
| **B2** | **41** | 1.95% | Nằm trong các bộ IELTS Core. |
| **C1** | **11** | 0.52% | Nằm trong các bộ IELTS Core. |
| **C2** | **0** | 0.0% | Chưa có từ nào được gắn nhãn C2. |
| **NULL / UNVERIFIED**| **2,023** | 96.43% | Thuộc các bộ Common 6000 (Sets 6–16) và Set tiếng Nhật. |

> [!WARNING]
> **Phát hiện quan trọng:** Chỉ có **75 / 2,098 từ** (3.57%) có nhãn CEFR (B1, B2, C1). Đại đa số (96.43%) đang có giá trị `level_cefr = NULL`.
> **Nguyên tắc P2:** Tuyệt đối không tự suy đoán gán nhãn CEFR hàng loạt bằng LLM. Giữ nguyên giá trị `NULL` hoặc đánh dấu `UNVERIFIED` cho đến khi được đối chiếu với nguồn kiểm định có bản quyền cho phép (English Vocabulary Profile / Council of Europe).

---

## 4. CHẤT LƯỢNG NỘI DUNG TỪ VỰNG

### A. Từ loại (Part of Speech)
- **Từ thiếu từ loại (Missing / Empty):** **2 từ** (0.09%).
- **Hiện tượng phân mảnh ký hiệu từ loại:**
  - Viết tắt có dấu chấm: `n.` (860 từ), `v.` (570 từ), `adj.` (300 từ), `adv.` (96 từ), `prep.` (37 từ), `pron.` (36 từ), `det.` (27 từ), `conj.` (19 từ), `no.` (13 từ).
  - Viết đầy đủ: `noun` (59 từ), `verb` (có xuất hiện).
  - *Giải pháp P2:* Chuẩn hóa mapper trong tầng Service/DTO để đồng nhất hiển thị (ví dụ: `n.` $\rightarrow$ `noun`, `v.` $\rightarrow$ `verb`).

### B. Nghĩa Tiếng Việt và Tiếng Anh
- **`meaning_vi`:** **2,098 / 2,098 từ (100%)** có đầy đủ nghĩa tiếng Việt. Không có từ nào bị thiếu nghĩa tiếng Việt.
- **`meaning_en`:** **2,021 từ bị thiếu (NULL)**. Chỉ có **77 từ** có định nghĩa tiếng Anh (tập trung ở 5 bộ IELTS Core).
- *Giải pháp P2:* Trong Volcard và Quiz, ưu tiên hiển thị `meaning_vi`; với `meaning_en`, nếu NULL hiển thị nhãn nhẹ nhàng `(Đang cập nhật định nghĩa tiếng Anh)` thay vì để trống lỗi UI.

### C. Tính toàn vẹn & Trùng lặp (Duplicates)
- **Trùng lặp `normalized_text` trong cùng một `vocabulary_set`:** **0 từ** (Dữ liệu hoàn toàn sạch, không có từ bị insert đúp trong cùng 1 set).

---

## 5. ĐÁNH GIÁ SỰ PHÙ HỢP CHO ĐẤU TRƯỜNG WORD BOARD (LEX RAID)

Đấu trường Lex Raid sử dụng cơ chế ghép chữ cái đơn trên ma trận $5 \times 5$ (hoặc $6 \times 6$). Phân tích 2,092 từ tiếng Anh cho thấy:
- **Từ phù hợp hoàn toàn cho Word Board:** **1,998 từ** (95.5%).
- **Từ KHÔNG phù hợp cho Word Board đơn lẻ:** **94 từ** (4.5%):
  - **Quá ngắn ($< 3$ ký tự):** 28 từ (Ví dụ: `a`, `to`, `in`, `is`, `be`, `of`, `he`, `it`, `as`). Luật game Lex Raid yêu cầu từ tối thiểu 3 ký tự.
  - **Quá dài ($> 10$ ký tự):** 48 từ (Ví dụ: `scholarship` - 11 ký tự; một số từ 12–14 ký tự).
  - **Chứa ký tự không phải chữ cái (Hyphen, Dấu chấm, Ký tự đặc biệt):** 19 từ (Ví dụ: từ ghép có dấu gạch ngang).

> [!TIP]
> **Chiến lược điều hướng P2:**
> - Các từ $< 3$ ký tự, $> 10$ ký tự hoặc chứa cụm từ/ký tự đặc biệt sẽ được phân loại là **`boardEligible = false`**.
> - Các từ này vẫn được giữ nguyên vẹn trong hệ thống cho **Volcard Flashcards** và **Quiz Challenge**, nhưng sẽ được loại khỏi thuật toán sinh ma trận chữ của **Lex Raid Word Board** để đảm bảo người chơi luôn có thể tạo được từ hợp lệ.

---

## 6. LIÊN KẾT STAGES & CORE WORDS HIỆN TẠI

Hệ thống hiện có 6 Stages kết nối trực tiếp với 6 Bộ từ vựng và 6 Core Words:

| Stage ID | Tên Stage (Vùng đất) | Bộ từ vựng liên kết | Ngôn ngữ | Số lượng từ trong set | Core Word thực tế | Gợi ý (Clue Text) |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **Stage 1** | Compiler Gate | Set 1 (`IELTS Tech Core`) | `en` | 25 | **compile** | `verb - biên dịch` |
| **Stage 2** | Network Citadel | Set 1 (`IELTS Tech Core`) | `en` | 25 | **firewall** | `noun - tường lửa` |
| **Stage 3** | Market Mirage | Set 2 (`IELTS Business Core`) | `en` | 25 | **revenue** | `noun - doanh thu` |
| **Stage 4** | Forest of Spores | Set 3 (`IELTS Environment Core`) | `en` | 25 | **ecosystem** | `noun - hệ sinh thái` |
| **Stage 5** | Scholar Hall | Set 4 (`IELTS Education Core`) | `en` | 25 | **curriculum** | `noun - chương trình học` |
| **Stage 6** | Lab Abyss | Set 5 (`IELTS Science Core`) | `en` | 25 | **analysis** | `noun - phân tích` |

---

## 7. KẾT LUẬN & KIẾN NGHỊ CHO PHASE P2

1. **Về Schema Database:**
   - Schema hiện tại (`vocabulary_topics`, `vocabulary_sets`, `vocabulary_words`, `stage_core_words`, `user_word_mastery`) đã đủ để vận hành đầy đủ chức năng P2 (phân loại CEFR, lọc topic, phân biệt ngôn ngữ, theo dõi tiến độ).
   - Chưa cần thêm bảng mới hoặc migration làm thay đổi schema database. Toàn bộ tính năng P2 có thể triển khai tương thích 100% với schema hiện hành.
2. **Về Dữ liệu:**
   - Bảo toàn nguyên vẹn 2,098 records hiện có.
   - Thêm cờ lọc `language_code = 'en'` ở backend để bảo đảm không bị lọt từ tiếng Nhật vào trận đánh tiếng Anh.
   - Chuẩn hóa hiển thị Part of Speech trong DTO.
   - Bổ sung bộ lọc CEFR và IT Domain tương thích ngược cho Volcard và Quiz.
