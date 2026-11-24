# CHANGELOG — LEX RAID DEVELOPMENT & FIXES

**Dự án:** Gamified Learning Platform — Lex Raid  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Giai đoạn:** P3 (RPG Progression, XP, Coins, Level Up, Persistent Game Sessions & Player Profile)  

---

## [P4-A] — 24/11/2026: Vercel Preview Deployment, Static Routing & Asset Case-Audit

### 1. Cấu hình Vercel Static Routing & Clean URLs
- **`src/main/resources/FrontEnd/vercel.json` & `vercel.json` (Root):**
  - Cấu hình rewrites tĩnh chuẩn xác cho toàn bộ 11 routes trang: `/`, `/app`, `/app/home`, `/app/auth`, `/app/minigame`, `/app/quiz`, `/app/volcard`, `/app/memory`, `/app/speed-math`, `/app/code-puzzle`, `/app/account`.
  - Ánh xạ đường dẫn `/ui/assets/**` về `/assets/**` và `/ui/src/**` về `/src/**`.
  - Refresh trang trực tiếp 100% không bị 404.
  - Không sử dụng catch-all rewrite đưa `/api/**` về `home.html`, đảm bảo các request API khi không có backend sẽ trả về mã 404 sạch để kích hoạt graceful fallback trong frontend JS.

### 2. Kiểm toán Tài nguyên & Phân biệt Hoa/Thường (Linux Case Sensitivity)
- **`src/main/resources/tools/check_case_sensitivity.py`:**
  - Viết công cụ tự động kiểm tra đối chiếu phân biệt chữ hoa/thường trên toàn bộ 348 file tĩnh và 129 URLs hoạt ảnh Phaser động từ `raid-config.js`.
  - Kết quả: **0 missing assets, 0 case mismatches** (100% tài nguyên tương thích môi trường Linux của Vercel).

### 3. Nâng cấp Giao diện Chế độ Xem trước (Preview Mode UX Polish)
- **`minigame.js`, `home.js`, `account.js`, `auth.html`:**
  - Bổ sung chip và thông báo Preview Mode rõ ràng, giải thích trải nghiệm demo độc lập không có kết nối cơ sở dữ liệu.
  - Modal kết thúc trận đấu hiển thị `PREVIEW` mode chuẩn xác, không ghi nhận điểm hoặc XP ảo vào DB.

### 4. Triển khai Production & Probe Trực tiếp (Live Probe Verification)
- **Production URL:** `https://gamified-learning-platform-sandy.vercel.app`
- **Deployment URL:** `https://gamified-learning-platform-82avq2pma-mky0624.vercel.app` (Deployment ID: `dpl_C3Vqob2As8xs3CAX71DWcyjrRBk2`).
- **`src/main/resources/tools/probe_deployment.py`:**
  - Probe tự động toàn bộ 16 routes và tài nguyên tĩnh: 16/16 endpoints đạt **HTTP 200 OK (0 FAIL)**.
  - Route `/api/lex-raid/test` trả về đúng HTTP 404 sạch, không bị ghi đè.
  - Direct refresh trên trình duyệt hoạt động ổn định 100%.

### 5. Tài liệu Nghiệm thu & Hướng dẫn Deploy
- **`docs/VERCEL_DEPLOYMENT.md`:**
  - Xuất bản tài liệu nghiệm thu triển khai Vercel, bảng ma trận route, kết quả probe thực tế và hướng dẫn kiểm thử.

---

## [P3-POST-AUDIT] — 23/11/2026: Reward Data Integrity, Concurrency Locking & Battle UI Polish

### 1. Toàn vẹn Dữ liệu Thưởng & Chống Hack Điểm (Reward Data Integrity)
- **`LexRaidServiceImpl.java` & `CoreWordGuessEventRepository.java`:**
  - Backend tự tính toán điểm tin cậy (`verifiedScore = wordScore + guessScore`) từ danh sách sự kiện hợp lệ đã lưu trong DB (`WordSubmitEvent` và `CoreWordGuessEvent`).
  - Trạng thái chiến thắng (`verifiedWon`) được xác thực độc lập từ lượng máu còn lại của Boss (`bossHpRemaining <= 0` hoặc trạng thái hợp lệ trên backend).
  - Không cho phép client gửi giá trị `totalScore` hoặc `resultCode: WON` tùy tiện để lấy thưởng; nếu phát hiện hành vi gửi điểm giả mạo mà không có event log hợp lệ và boss chưa chết, điểm số được gán về 0, kết quả là LOST và 0 XP / 0 Coins.

### 2. Khóa Bi quan & Tuần tự hóa Đồng thời (Concurrent Locking & Idempotency)
- **`GameSessionRepository.java` & `UserRepository.java`:**
  - Bổ sung `findByIdForUpdate` với `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`WITH (UPDLOCK, ROWLOCK)` trên SQL Server).
- **`RpgProgressionServiceImpl.java` & `LexRaidServiceImpl.java`:**
  - `applyReward`: Khóa hàng dữ liệu của `User` trước khi tính toán và ghi nhận XP/Coins mới, ngăn chặn triệt để hiện tượng mất cập nhật (lost update) khi nhiều session của cùng 1 user kết thúc đồng thời.
  - `finishSession`: Kiểm tra trạng thái `COMPLETED` ngay đầu hàm; session đã hoàn thành là bất biến (immutable), không cho phép gọi lặp lại để nhận thưởng nhiều lần.

### 3. Kiểm tra Tính Hợp Lệ Đề & Đáp Án Quiz (Quiz Integrity Validation)
- **`QuizServiceImpl.java`:**
  - Kiểm tra ràng buộc câu trả lời được chọn phải thuộc về chính câu hỏi đang nộp (`selected.getQuestion().getQuestionId().equals(question.getQuestionId())`), chống tráo đáp án đúng từ câu hỏi khác.
  - Kiểm tra câu hỏi phải thuộc đúng `QuestionSet` của session hiện tại (đối chiếu qua `metadataJson`), chống nộp câu hỏi từ đề khác.
  - Chặn nộp trùng câu hỏi đã trả lời trong session (`quizAttemptRepository.existsByGameSession...`).
  - Chặn nộp câu hỏi vào session đã `COMPLETED`.

### 4. Sửa Lỗi Toán học Thanh EXP Tài khoản (Account XP Bar Math)
- **`account.js`:**
  - Tính chính xác khoảng cấp độ: `const levelSpan = xpInLevel + xpNeeded;`.
  - Hiển thị đầy đủ thông số: `${xpInLevel}/${levelSpan} XP (${xpTotal.toLocaleString('vi-VN')} tổng)` và `Còn ${xpNeeded.toLocaleString('vi-VN')} XP tới cấp tiếp theo (${progressPercent.toFixed(1)}%)`.
  - Đã xác minh toán học: Tại 150 XP $\rightarrow$ Level 2, 50/200 XP, Còn 150 XP tới cấp tiếp theo (25.0%).

### 5. Giao diện Kết quả Trận đấu 4 Trạng thái (Battle Result UI Polish)
- **`minigame.js`:**
  - Xóa bỏ việc hiển thị số XP/Coins ảo trước khi server xác nhận.
  - Triển khai hàm `renderBattleResultOverlay(stateType, data, win)` với 4 trạng thái độc lập:
    - `PENDING`: "Đang xác nhận..." trong khi chờ backend phản hồi.
    - `CONFIRMED`: Hiển thị số XP, Gold và sao chính thức được backend trả về; kèm banner Level Up nếu thăng cấp.
    - `ERROR`: "Chưa lưu (Lỗi mạng)", thông báo không kết nối được máy chủ, không ghi nhận thưởng ảo.
    - `PREVIEW`: Chế độ xem trước (không có session id), thông báo không tích lũy phần thưởng.

### 6. Bộ Kiểm thử Đơn vị Mở rộng (Extended Unit Test Suite)
- **20/20 Unit Tests PASS trên Java 21 LTS:**
  - `RpgProgressionServiceTest`: 9/9 tests PASS (+2 tests: toán học thanh EXP 150 XP, giả lập khóa bi quan User).
  - `LexRaidProgressionTest`: 4/4 tests PASS (+1 test: từ chối điểm số và kết quả WON giả mạo).
  - `QuizProgressionTest`: 5/5 tests PASS (+3 tests: chống tráo đáp án, chống tráo đề thi, chống nộp trùng câu hỏi).
  - `AccountProfileServiceTest`: 2/2 tests PASS.

---

## [P3-A & P3-B & P3-C & P3-D & P3-E & P3-F & P3-G] — 23/11/2026: Phase P3 Master Delivery

### 1. RPG Progression Engine & Level Mathematics (P3-A & P3-B)
- **`src/main/java/org/example/service/RpgProgressionService.java` & `RpgProgressionServiceImpl.java`:**
  - Xây dựng đường cong cấp độ bậc hai chuẩn $O(1)$: $L = \max(1, \lfloor (1 + \sqrt{1 + X / 12.5}) / 2 \rfloor)$. Cấp 1 tại 0 XP; ngưỡng L1: 0-99 XP, L2: 100-299 XP, L3: 300-599 XP, L5: 1000-1499 XP, L10: 4500+ XP.
  - Công thức tính thưởng Lex Raid (WON/LOST, có trần chống lạm phát) và Quiz.
  - Phương thức `applyReward(User user, int xpEarned, int coinsEarned)` cập nhật `User` (`xp_total`, `level_current`, `coins`) và phát hiện chính xác thăng cấp đơn hoặc nhảy cóc nhiều cấp độ.
- **DTOs:**
  - `LevelProgressDto.java`: Cung cấp chi tiết level, xpBase, xpNext, xpCurrentInLevel, xpNeededForNextLevel, progressPercent.
  - `UserRewardResultDto.java`: oldLevel, newLevel, levelUpOccurred, levelsGained, xpEarned, coinsEarned, newXpTotal, newCoins.
  - `PlayerProfileDto.java`: Toàn bộ chỉ số thực tế của người chơi từ DB.

### 2. Idempotency & Anti-Double Reward (P3-C & P3-D)
- **`src/main/java/org/example/service/LexRaidServiceImpl.java`:**
  - Khắc phục triệt để lỗi người chơi không bao giờ được cộng thưởng vào thực thể `User`.
  - Triệt tiêu lỗi nhận thưởng nhiều lần (Double Reward) do reload trang hoặc gọi lặp lại `/finish`: Bổ sung guard check `if (COMPLETED.equalsIgnoreCase(gameSession.getStatus())) return;`.
  - Tách riêng `updateStageWordProgress` (cập nhật từ tìm thấy khi chơi) và `updateStageProgressOnCompletion` (chỉ cập nhật kết quả ải khi session kết thúc).
  - Bảo toàn số sao kỷ lục: Sử dụng `Math.max(existingStars, newStars)`, ngăn chặn việc hạ sao khi chơi lại ải với điểm thấp hơn.
- **`src/main/java/org/example/service/QuizServiceImpl.java`:**
  - Tính toán và trao thưởng thực tế XP/Coins vào `User` khi kết thúc câu hỏi cuối cùng của quiz.
  - Từ chối việc nộp câu hỏi vào session đã `COMPLETED`.

### 3. Player Profile API & Backend Integration (P3-E)
- **`src/main/java/org/example/controller/AccountController.java` & `AccountServiceImpl.java`:**
  - Thêm endpoint `GET /api/v1/account/profile?userId={userId}`.
  - Tổng hợp số ải đã vượt qua (`stagesCleared`), tổng trận đấu (`totalBattles`), điểm cao nhất (`bestScore`), loadout và thanh tiến độ EXP.
  - Tự động phục hồi / đồng bộ (self-healing) `level_current` trong bảng `users` nếu phát hiện lệch so với công thức toán học.

### 4. Pixel RPG Frontend Polish & Real Data Sync (P3-F)
- **`minigame.html`, `minigame.css`, `minigame.js`:**
  - Nâng cấp Modal Kết thúc Trận đấu (`#finishOverlay`) thành Pixel RPG Battle Result Modal hoàn chỉnh: Cờ Victory/Defeat, đánh giá số sao (★★★), EXP nhận được, Gold Coins nhận được, điểm số, và banner LEVEL UP có hiệu ứng chuyển động ăn mừng khi thăng cấp.
  - Tự động cập nhật `auth` local và Navigation bar ngay khi kết thúc trận đấu.
- **`account.html`, `account.css`, `account.js`:**
  - Tích hợp thẻ thông tin người chơi: Huy hiệu cấp độ, thanh EXP Progress Bar (`.pixel-bar`) kèm % tiến độ, số dư Gold, chuỗi ngày học Streak, và lưới RPG Metrics (Stages Cleared, Total Battles, Best Score).
- **`home.js`, `api.js`, `games-lite.js`:**
  - Bổ sung `window.appApi.getAccountProfile(userId)`.
  - Quiz completion hiển thị phần thưởng EXP & Gold, kèm thông báo thăng cấp.

### 5. Automated Tests & Quality Assurance (P3-G)
- **14/14 Unit & Integration Tests PASS trên Java 21 LTS:**
  - `RpgProgressionServiceTest` (7/7 tests PASS).
  - `AccountProfileServiceTest` (2/2 tests PASS).
  - `LexRaidProgressionTest` (3/3 tests PASS).
  - `QuizProgressionTest` (2/2 tests PASS).
- **`docs/P3_PROGRESSION_DESIGN.md` & `docs/P3_REWARD_TEST_REPORT.md`:** Xuất bản tài liệu thiết kế và báo cáo kiểm thử chi tiết.

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
