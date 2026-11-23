# CHANGELOG — LEX RAID DEVELOPMENT & FIXES

**Dự án:** Gamified Learning Platform — Lex Raid  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Giai đoạn:** P2 (Vocabulary Engine, CEFR A1–C2, IT Taxonomy, Balanced Board, Volcard UI)  

---

## [P2-A & P2-B & P2-C & P2-D & P2-E & P2-F] — 23/11/2026: Phase P2 Master Delivery

### 1. Database & Schema Audit (P2-A)
- **`src/main/resources/tools/audit_vocabulary_db.py`:**
  - Viết bộ parser đọc và giải mã file seed SQL Server `script_GPL_v2.sql` (UTF-16 LE).
  - Phân tích toàn bộ 2.098 rows trong `vocabulary_words`: 2.096 từ tiếng Anh, 2 từ tiếng Nhật (`ohayou`, `arigatou`).
  - Thống kê tỷ lệ CEFR: 75 từ có nhãn (B1: 23, B2: 41, C1: 11); 2.023 từ là `NULL` (96.43%).
  - Đánh giá khả năng ghép chữ bàn cờ 1-tile 5x5: 1.998 từ hợp lệ (95.5%), 94 từ không hợp lệ (28 từ <3 ký tự, 48 từ >10 ký tự, 19 từ có dấu gạch/kí tự đặc biệt).
- **`docs/P2_VOCABULARY_AUDIT.md` & `Agent & Skill/docs/P2_VOCABULARY_AUDIT.md`:**
  - Xuất bản báo cáo kiểm toán đầy đủ 9 bảng số liệu và đề xuất kỹ thuật.

### 2. Architecture & Taxonomy Design (P2-B)
- **`docs/P2_VOCABULARY_DESIGN.md` & `Agent & Skill/docs/P2_VOCABULARY_DESIGN.md`:**
  - Định hình kiến trúc 2 trục độc lập: Trục 1 (CEFR A1-C2 + UNKNOWN/NULL theo sense-level với grounding học thuật nghiêm ngặt) và Trục 2 (IT Tier: Foundation, Practitioner, Advanced, Specialist).
  - Chuẩn hóa danh mục 35 IT Domains (Computer Fundamentals, OS, Networks, OOP, DSA, Backend API, DevOps, Containers, Cloud, AI/ML, Cybersecurity,...).
  - Xác lập quy tắc phân loại `boardEligible = true` (từ đơn 3..10 ký tự [A-Za-z]) vs `boardEligible = false` (cụm từ nhiều chữ cho Flashcard/Quiz).
- **`src/main/resources/db/migration/V2__vocabulary_senses_cefr_it.sql`:**
  - Soạn thảo lược đồ mở rộng an toàn (non-breaking) cho bảng `vocabulary_word_senses` và `it_curriculum_domains` (draft migration, không áp dụng trực tiếp lên DB live).

### 3. Data Importer Pipeline & DRY RUN (P2-C)
- **`src/main/resources/tools/vocabulary_importer.py`:**
  - Pipeline CLI kiểm tra dữ liệu từ vựng với chế độ `--dry-run` mặc định.
  - Chuẩn hóa Part of Speech (POS): `n.` -> `noun`, `v.` -> `verb`, `adj.` -> `adjective`, `adv.` -> `adverb`, `prep.` -> `preposition`, `conj.` -> `conjunction`, `phrase`.
  - Kiểm tra tính hợp lệ trên bàn cờ (`boardEligible`), kiểm tra CEFR và IT domains, phát hiện trùng lặp với 2.098 từ trong seed database.
- **`src/main/resources/tools/test_vocabulary_importer.py`:**
  - Bộ kiểm thử tự động 3/3 tests PASS: `test_pos_normalization`, `test_board_eligibility`, `test_validation_pipeline_dry_run`.
- **`docs/P2_IMPORT_DRY_RUN_REPORT.json` & `Agent & Skill/docs/P2_IMPORT_DRY_RUN_REPORT.json`:**
  - Báo cáo chạy thử nghiệm 26 mục mẫu: 26 hợp lệ, 0 rejected, 22 board-eligible, 4 flashcard-only, 0 hallucinated CEFR.

### 4. Backend Services Enhancement (P2-D & P2-E)
- **`src/main/java/org/example/dto/VocabularyWordDto.java`:**
  - Bổ sung các trường tùy chọn: `normalizedText`, `itDomain`, `itTier`, `boardEligible`. Duy trì tương thích JSON 100%.
- **`src/main/java/org/example/service/VolcardService.java` & `VolcardServiceImpl.java`:**
  - Mở rộng phương thức `getCards(vocabularySetId, offset, limit, cefrLevel, search)`.
  - Lọc theo cấp độ CEFR linh hoạt (A1, A2, B1, B2, C1, C2, UNKNOWN/NULL, ALL).
  - Tìm kiếm từ vựng theo thời gian thực hai chiều (tiếng Anh và tiếng Việt).
  - Chuẩn hóa Part of Speech và fallback định nghĩa khi `meaning_en` là NULL.
- **`src/main/java/org/example/controller/VolcardController.java`:**
  - Tiếp nhận query params `@RequestParam(required = false) String cefrLevel` và `@RequestParam(required = false) String search`.
- **`src/main/java/org/example/service/LexRaidServiceImpl.java`:**
  - Tối ưu hóa thuật toán `buildBoard()`: Loại bỏ sinh ngẫu nhiên đồng đều `A-Z` (vốn chỉ có 19% nguyên âm), thay thế bằng bảng tần suất chữ cái chuẩn tiếng Anh (~42% nguyên âm A, E, I, O, U và phụ âm thông dụng T, N, S, R, H, L, D, C, M, P) khắc phục triệt để tình trạng thiếu nguyên âm (vowel starvation).
  - Đảm bảo ghép từ thành công: Bố trí các chữ cái của `coreWord` và 1-2 từ vựng phụ (`topicWords`) vào các vị trí ưu tiên gần tâm bàn cờ theo khoảng cách Manhattan.
  - Lọc bỏ triệt để từ tiếng Nhật và từ không hợp lệ khỏi Lex Raid battle runtime.

### 5. Frontend UI & UX Polish (P2-F)
- **`src/main/resources/FrontEnd/assets/js/api.js`:**
  - Cập nhật `getVolcardCards(setId, offset, limit, cefrLevel, search)` hỗ trợ truyền params lọc lên backend.
- **`src/main/resources/FrontEnd/src/pages/volcard.html` & `assets/css/volcard.css`:**
  - Tích hợp `pixel-rpg.css` và hệ thống khung viền gỗ sẫm `.pixel-panel`.
  - Bổ sung thanh 8 nút lọc CEFR Pills (Tất cả, A1, A2, B1, B2, C1, C2, Chưa gán).
  - Bổ sung ô tìm kiếm từ vựng tiếng Anh / tiếng Việt có icon và bo góc retro.
  - Thiết kế thẻ lật Flashcard 2 mặt với huy hiệu Pixel RPG cho POS, CEFR Level, IT Domain, IT Tier.
  - Tích hợp nút phát âm Web Speech API TTS (`ttsBtn`) kèm disclaimer về chất lượng giọng máy.
  - Bổ sung nút điều hướng trước/sau: Trước (`prevBtn`), Lật thẻ (`flipBtn`), Tiếp (`nextBtn`).
- **`src/main/resources/FrontEnd/assets/js/volcard.js`:**
  - Quản lý trạng thái bộ lọc `cefrFilter`, tìm kiếm debounce `searchQuery`, TTS Web Speech API phát âm chuẩn `en-US`.
- **`src/main/resources/FrontEnd/src/pages/quiz.html`:**
  - Tích hợp `pixel-rpg.css` đồng bộ phong cách Pixel RPG.

---

## [P1-A & P1-B & P1-C & P1-D] — 23/11/2026: Pixel RPG Design System & Java 21 LTS
- Nâng cấp Java 21 LTS, Spring Boot 4.2.0, Lombok 1.18.36.
- Thiết lập Pixel RPG Design System tokens trong `pixel-rpg.css`.
- Đồng bộ giao diện Lex Raid Battle và Home Page.

---

## [P0-Finalization] — 23/11/2026: Animation, Battle Loop & Mobile Responsive
- Căn chỉnh trọng tâm chân Hero & 9 Boss Quái vật (baseline Y=350).
- Khắc phục 9 kịch bản hồi quy và race conditions trong gameplay.
- Tối ưu hóa giao diện di động 320x568 không cần cuộn trang.
