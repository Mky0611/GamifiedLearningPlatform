# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 23/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát triển:** `feature/p3-rpg-progression`  
**Trạng thái hiện tại:** **PHASE P3 COMPLETE (RPG PROGRESSION, LEVEL FORMULAS, COINS, XP, PERSISTENT SESSIONS & PLAYER PROFILE)**  
**Lead AI Engineering Agent:** Antigravity  
**Cộng tác viên Review/QA/Planning:** ChatGPT  

---

## 1. TỔNG QUAN DỰ ÁN

Lex Raid là một web game học tiếng Anh kết hợp phong cách Pixel RPG chiến đấu bằng từ vựng. Dự án được xây dựng trên nền tảng:
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security.
- **Database:** Microsoft SQL Server (`script_GPL_v2.sql` — 57 bảng).
- **Frontend:** Vanilla HTML5, CSS3 Pixel Design System, JavaScript ES6+.
- **Game Engine:** Phaser 3.90.0 (kèm Canvas 2D Fallback khi không có mạng/CDN).
- **Phục vụ tĩnh / Xem trước:** `preview-server.js` (Node.js HTTP Server).

---

## 2. KẾT QUẢ THỰC HIỆN PHASE P2 (VOCABULARY ENGINE & IT ENGLISH)

### A. Kiểm toán Cơ sở Dữ liệu Từ vựng (P2-A Database & Schema Audit)
- **Công cụ tự động:** Xây dựng `src/main/resources/tools/audit_vocabulary_db.py` đọc trực tiếp file seed `script_GPL_v2.sql` (mã hóa UTF-16 LE, 2.65 MB).
- **Báo cáo kiểm toán:** Xuất bản tài liệu chi tiết `docs/P2_VOCABULARY_AUDIT.md` và `Agent & Skill/docs/P2_VOCABULARY_AUDIT.md`.
- **Thống kê thực tế:**
  - 9 Topics (`vocabulary_topics`), 17 Sets (`vocabulary_sets`), 2.098 Words (`vocabulary_words`).
  - 2.096 từ tiếng Anh (`en`) và 2 từ tiếng Nhật (`ja`: *ohayou*, *arigatou* trong set ID 17).
  - Tỷ lệ CEFR hiện có: Chỉ 75 từ có nhãn CEFR (B1: 23, B2: 41, C1: 11, nằm trong các bộ IELTS Tech/Business Core); 2.023 từ còn lại là `NULL` (96.43%).
  - 100% từ có giải nghĩa tiếng Việt (`meaning_vi`), nhưng 2.021 từ chưa có định nghĩa tiếng Anh (`meaning_en = NULL`).
  - Đánh giá khả năng ghép chữ trên bàn cờ $5 \times 5$: 1.998 từ hợp lệ; 94 từ không hợp lệ (28 từ $< 3$ ký tự, 48 từ $> 10$ ký tự, 19 từ chứa dấu gạch nối hoặc ký tự đặc biệt).

### B. Thiết kế Kiến trúc Hai trục Độc lập (P2-B CEFR & IT Taxonomy Architecture)
- **Tài liệu thiết kế:** Xuất bản `docs/P2_VOCABULARY_DESIGN.md` và `Agent & Skill/docs/P2_VOCABULARY_DESIGN.md`.
- **Trục 1 — CEFR Level:** A1, A2, B1, B2, C1, C2 hoặc `UNVERIFIED`/`NULL`. Gắn nhãn theo nét nghĩa (*sense-level*) và bắt buộc có nguồn đối chiếu học thuật uy tín (Cambridge English Profile, Oxford 3000/5000). Tuyệt đối cấm đoán mò hoặc dùng LLM gán nhãn tự do.
- **Trục 2 — IT Tier:** 4 cấp độ kỹ năng nghề nghiệp: `Foundation`, `Practitioner`, `Advanced`, `Specialist`.
- **Taxonomy 35 IT Domains:** Chuẩn hóa toàn bộ 35 chuyên mục kỹ thuật (từ Computer Fundamentals, OS, Networks, OOP, DSA, Backend API, Devops, Containers, Cloud đến AI/ML, Cybersecurity).
- **Lược đồ mở rộng (Non-breaking):** Soạn thảo `src/main/resources/db/migration/V2__vocabulary_senses_cefr_it.sql` cho bảng `vocabulary_word_senses` và `it_curriculum_domains` (lưu trữ phục vụ nâng cấp tương lai, không chạy DDL trực tiếp trên DB live).

### C. Pipeline Nhập Dữ liệu & Chế độ DRY RUN (P2-C Vocabulary Importer)
- **Công cụ nhập liệu:** `src/main/resources/tools/vocabulary_importer.py` với chế độ `--dry-run` mặc định.
- **Quy tắc kiểm định:** Kiểm tra UTF-8, mã ngôn ngữ `en`, chuẩn hóa từ loại (POS: `n.` $\rightarrow$ `noun`, `v.` $\rightarrow$ `verb`, etc.), kiểm tra độ dài từ và tính hợp lệ trên bàn cờ (`boardEligible`), đối chiếu trùng lặp với 2.098 từ trong seed database.
- **Kiểm thử tự động:** `src/main/resources/tools/test_vocabulary_importer.py` đạt **3/3 unit tests PASS**.
- **Báo cáo Dry Run:** Xuất bản `docs/P2_IMPORT_DRY_RUN_REPORT.json` (26/26 mục mẫu được phân loại chính xác, 22 board-eligible, 4 flashcard-only).

### D. Nâng cấp Backend Services (P2-D Volcard, Quiz & Lex Raid Engine)
- **Volcard Service & Controller:**
  - Hỗ trợ thêm tham số tùy chọn `cefrLevel` và `search` trên endpoint `GET /api/v1/volcard/sets/{setId}/cards`. Duy trì tương thích ngược 100%.
  - Chuẩn hóa Part of Speech (POS) và sinh dữ liệu DTO mở rộng: `itDomain`, `itTier`, `boardEligible`.
  - Fallback an toàn khi `meaning_en` là NULL.
- **Thuật toán sinh bàn cờ Lex Raid (`buildBoard`):**
  - Khắc phục triệt để tình trạng thiếu nguyên âm (vowel starvation): Thay thế việc sinh ngẫu nhiên đồng đều `A-Z` (chỉ có 19% nguyên âm) bằng bảng tần suất chữ cái tiếng Anh chuẩn với tỷ lệ nguyên âm đạt ~42% (`A, E, I, O, U`) và phụ âm thông dụng (`T, N, S, R, H, L, D, C, M, P`).
  - Đảm bảo ghép từ thành công: Bàn cờ luôn chứa đầy đủ các chữ cái của `coreWord` đặt gần tâm bàn cờ, đồng thời cấy thêm các chữ cái của 1-2 từ vựng phụ trong stage vocabulary set.
  - Lọc bỏ triệt để từ tiếng Nhật và từ không hợp lệ khỏi Lex Raid battle runtime.

### E. Nâng cấp Giao diện Học Từ vựng (P2-E Volcard & Quiz Frontend Polish)
- **Volcard UI:**
  - Tích hợp thanh lọc CEFR (Pills: Tất cả, A1, A2, B1, B2, C1, C2, Chưa gán).
  - Tích hợp ô tìm kiếm từ vựng theo thời gian thực (Search box debounced).
  - Tích hợp nút phát âm Web Speech API TTS (`ttsBtn`) với thông báo ghi chú rõ ràng về công nghệ giọng máy.
  - Hiển thị đầy đủ huy hiệu Pixel RPG cho POS, CEFR, IT Domain, và IT Tier.
  - Nút chuyển thẻ mượt mà: Lật thẻ (`flipBtn`), Từ tiếp (`nextBtn`), Từ trước (`prevBtn`).
- **Quiz UI:**
  - Áp dụng các token viền gỗ, bóng pixel từ `pixel-rpg.css`.

---

## 3. KẾT QUẢ THỰC HIỆN PHASE P3 (RPG PROGRESSION, LEVEL, XP, COINS & SESSIONS)

### A. Kiến trúc Tiến trình RPG & Cấp độ $O(1)$ (P3-A & P3-B)
- **Công thức cấp độ chuẩn:** $L = \max(1, \lfloor (1 + \sqrt{1 + X / 12.5}) / 2 \rfloor)$. Cấp 1 xuất phát từ 0 XP; ngưỡng L1: 0-99 XP, L2: 100-299 XP, L3: 300-599 XP, L5: 1000-1499 XP, L10: 4500+ XP.
- **Dịch vụ `RpgProgressionService` & `RpgProgressionServiceImpl`:**
  - Tính toán XP và Coins cho Lex Raid (thắng/thua, có giới hạn trần chống lạm phát) và Quiz.
  - Xử lý cộng thưởng vào `User` (`xp_total`, `level_current`, `coins`) và phát hiện chính xác thăng cấp (Level Up) hoặc nhảy cóc nhiều cấp độ (Multi-level jump).
  - Tự động đồng bộ / tự phục hồi (self-healing) cấp độ nếu `level_current` trong DB lệch khỏi công thức toán học.

### B. Chống Nhận Thưởng Lặp & Idempotency Tuyệt Đối (P3-C & P3-D)
- **Lex Raid Service:**
  - Chốt trạng thái session sang `COMPLETED` nguyên tử.
  - Kiểm tra nghiêm ngặt `if (COMPLETED.equalsIgnoreCase(gameSession.getStatus())) return;` đảm bảo chỉ trao thưởng XP/Coin và tăng `clear_count`/`fail_count` đúng 1 lần duy nhất cho mỗi phiên chơi.
  - Ngăn chặn triệt để tình trạng reload trang hoặc gọi lặp lại `/finish` để farm thưởng.
  - Bảo toàn kỷ lục số sao: `Math.max(existingStars, newStars)`, không bao giờ bị giảm điểm đánh giá ải.
- **Quiz Service:**
  - Trao thưởng XP và Coins vào User khi hoàn thành toàn bộ câu hỏi.
  - Ngăn chặn nộp thêm câu hỏi sau khi session đã `COMPLETED`.

### C. Player Profile API & Đồng bộ Frontend (P3-E & P3-F)
- **API `GET /api/v1/account/profile?userId={userId}`:** Trả về đầy đủ profile: Level, XP tổng, XP trong level, XP tới level kế, % tiến độ, Coins, Streak, Loadout, Stages Cleared, Total Battles, Best Score.
- **Pixel RPG UI Polish:**
  - **Account Profile Card:** Tích hợp thanh EXP Progress Bar (`.pixel-bar`), huy hiệu cấp độ, lưới RPG metrics 3 cột.
  - **Battle Result Modal:** Thiết kế lại hoàn toàn bảng tổng kết trận đấu pixel art: cờ Victory/Defeat, số sao đạt được (★★★), EXP & Gold nhận được, điểm số, và banner ăn mừng LEVEL UP khi thăng cấp.
  - **Đồng bộ thời gian thực:** Tự động cập nhật `auth` local và thanh điều hướng (Navigation Bar) ngay khi trận đấu hoặc quiz kết thúc.

---

## 4. PHÂN LOẠI KẾT QUẢ KIỂM THỬ THỰC TẾ (QA STATUS)

| Cấp độ kiểm thử | Tên bài test / Script | Kết quả | Chi tiết |
| :--- | :--- | :---: | :--- |
| **RPG PROGRESSION UNIT** | `RpgProgressionServiceTest` | **PASS** | 7/7 tests pass (ngưỡng cấp độ, công thức thưởng, single level-up, multi-level jump). |
| **ACCOUNT PROFILE UNIT** | `AccountProfileServiceTest` | **PASS** | 2/2 tests pass (profile calculation, self-healing level synchronization). |
| **LEX RAID PROGRESSION** | `LexRaidProgressionTest` | **PASS** | 3/3 tests pass (thưởng trận đấu, chống nhận thưởng 2 lần idempotency, sao không suy giảm). |
| **QUIZ PROGRESSION** | `QuizProgressionTest` | **PASS** | 2/2 tests pass (thưởng quiz completion, từ chối nộp sau khi hoàn thành). |
| **SECURITY SCAN** | `git_security_scanner.py` | **PASS** | Working tree sạch 0 lỗi; 1 commit lịch sử `ecf1f782` được mask an toàn. |
| **SECURITY UNIT** | `test_security_scanner.py` | **PASS** | 13/13 tests pass (URI, JSON, YAML, Cloud Keys, False Positive checks). |
| **IMPORTER UNIT** | `test_vocabulary_importer.py` | **PASS** | 3/3 tests pass (POS normalization, board eligibility, dry-run pipeline). |
| **DATABASE AUDIT** | `audit_vocabulary_db.py` | **PASS** | 2.098 words, 17 sets, 9 topics, 6 stages parsed từ file UTF-16 LE. |
| **STATIC PASS** | `smoke_check.py` | **PASS** | 0 lỗi cú pháp JS, 0 ID DOM thiếu, 0 asset hỏng. |
| **PREVIEW SERVER** | `preview-server.js` | **PASS** | Node.js route đúng `/app/volcard`, `/app/quiz`, `/app/account`. |

---

## 5. CÔNG VIỆC TIẾP THEO

1. Commit các thay đổi Phase P3 lên nhánh `feature/p3-rpg-progression`.
2. Push lên repository GitHub `Mky0611/GamifiedLearningPlatform`.
3. Bàn giao báo cáo nghiệm thu Phase P3 cho người dùng và ChatGPT.
