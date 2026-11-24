# BÁO CÁO KIỂM THỬ CHẤT LƯỢNG — QA REPORT
## GIAI ĐOẠN P0, P1, P2, P3, P4-A & SECURITY AUDIT — LEX RAID PIXEL RPG

**Thời điểm lập:** 24/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh kiểm thử:** `feature/p4-vercel-preview`  
**Đơn vị thực hiện:** Antigravity QA Engineering Team  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ (TEST MATRIX)

| Hạng mục kiểm thử | Cấp độ | Kết quả | Chi tiết & Ghi chú |
| :--- | :---: | :---: | :--- |
| **Vercel Live Production Deployment** | LIVE HTTP | **PASS** | `gamified-learning-platform-sandy.vercel.app`: probe 16/16 endpoints đạt HTTP 200 OK (0 fail); direct refresh không 404; API unmapped trả về 404 sạch. |
| **Vercel Routing & Clean URLs** | CONFIG | **PASS** | Định tuyến 11 routes HTML tĩnh; map `/ui/assets/**` chuẩn; không catch-all `/api/**`. |
| **Kiểm toán Chữ hoa/thường Linux (`check_case_sensitivity.py`)** | STATIC | **PASS** | 348 files trên đĩa và 129 dynamic Phaser URLs: 0 missing assets, 0 case mismatches. |
| **Giao diện Chế độ Xem trước (Preview Mode Fallbacks)** | E2E STATIC | **PASS** | 0 lỗi JS, hiển thị rõ chip & banner Preview Mode; Boss Hunt, Volcard, Quiz, Account hoạt động demo mượt mà. |
| **RPG Level & Reward Engine (`RpgProgressionServiceTest`)** | UNIT | **PASS** | 9/9 tests pass: ngưỡng cấp độ L1..L10, XP bậc 2 $O(1)$, thưởng Lex Raid, single level-up, multi-level jump, tính chuẩn thanh EXP tại 150 XP (25%), khóa bi quan chống mất cập nhật XP giữa các session. |
| **Player Profile Calculation (`AccountProfileServiceTest`)** | UNIT | **PASS** | 2/2 tests pass: tổng hợp profile, exp bar, loadout, stages cleared, best score, self-healing cấp độ lệch trong DB. |
| **Lex Raid Session Progression (`LexRaidProgressionTest`)** | UNIT | **PASS** | 4/4 tests pass: thưởng trận đấu từ verified events, chống hack điểm/thắng giả, chống nhận thưởng 2 lần (idempotency), sao kỷ lục không suy giảm. |
| **Quiz Session Progression (`QuizProgressionTest`)** | UNIT | **PASS** | 5/5 tests pass: thưởng hoàn thành quiz, từ chối nộp sau khi COMPLETED, từ chối tráo đáp án từ câu hỏi khác, từ chối câu hỏi không thuộc bộ đề session, từ chối nộp trùng câu hỏi. |
| **Kiểm thử Concurrency Khóa Bi quan trên SQL Server Thật** | LIVE DB | **NOT TESTED** | Yêu cầu kết nối SQL Server thật đang chạy dịch vụ; logic `findByIdForUpdate` đã được bao phủ qua Mockito unit tests. |
| **Khởi chạy Spring Boot & DB Context (`MainTests.java`)** | INTEGRATION | **NOT TESTED** | Tạm thời không kết nối được `localhost:1433` trên môi trường sandbox do service SQL Server cục bộ chưa được bật. |
| **Kiểm thử Security Scanner (`test_security_scanner.py`)** | UNIT | **PASS** | 13/13 unit tests pass: phát hiện hardcoded password, ${VAR:default}, URI credentials, Cloud keys, JSON, YAML. |
| **Quét An toàn Mã nguồn (`git_security_scanner.py`)** | STATIC | **PASS** | Working tree sạch 0 secrets; Git history khớp đúng commit cũ `ecf1f782` (đã mask). |
| **Kiểm toán DB Seed (`audit_vocabulary_db.py`)** | DB STATIC | **PASS** | Đọc trực tiếp `script_GPL_v2.sql` (UTF-16 LE): 2.098 từ, 17 sets, 9 topics, 6 stages. |
| **Kiểm thử Importer Pipeline (`test_vocabulary_importer.py`)** | UNIT | **PASS** | 3/3 unit tests pass: chuẩn hóa POS, kiểm tra board-eligibility, dry-run validation. |
| **Chạy Thử nghiệm Import (`vocabulary_importer.py --dry-run`)** | CLI DRY RUN | **PASS** | 26 mục mẫu xử lý thành công: 22 board-eligible, 4 flashcard-only, 0 hallucinated CEFR. |
| **Kiểm tra cú pháp JavaScript & DOM IDs (`smoke_check.py`)** | STATIC | **PASS** | 0 lỗi cú pháp JS, 0 ID DOM thiếu, 0 asset hỏng trên toàn bộ thư mục FrontEnd. |
| **Xác minh Mật khẩu SQL Server Local** | LIVE DB | **VERIFIED** | Xác nhận mật khẩu cũ trong commit `ecf1f782` từng hoạt động trên port 1433; cần user rotation an toàn. |
| **Căn chỉnh chân Hero (Warrior, Archer, Lancer)** | UNIT | **PASS** | Độ lệch baseline tiếp đất < 0.007px so với Y=350. |
| **Căn chỉnh chân 9 Boss Quái Vật** | UNIT | **PASS** | Căn chỉnh chính xác baseline chân chạm đất Y=350. |
| **Khắc phục 9 kịch bản hồi quy (Race Conditions)** | INTEGRATION | **PASS** | Đã khắc phục toàn bộ trong mã nguồn (`clearAttackTimers`, `isBossDying`, `killTweensOf`, `isSubmitting`). |
| **Mô phỏng hình học CSS 8 Viewports** | SIMULATION | **PASS** | 320×568 chiếm 79.3% chiều cao, no-scroll fit; đã bổ sung 1440×900. |
| **Chạy kiểm thử tự động Playwright** | BROWSER | **CODE READY** | Script Playwright 8 viewports hoàn thiện; chờ chạy trên host browser ngoài sandbox. |

---

## 2. KẾT QUẢ KIỂM THỬ TRIỂN KHAI VERCEL THỰC TẾ (PHASE P4-A)

- **URL Production:** [https://gamified-learning-platform-sandy.vercel.app](https://gamified-learning-platform-sandy.vercel.app)
- **Deployment URL:** [https://gamified-learning-platform-82avq2pma-mky0624.vercel.app](https://gamified-learning-platform-82avq2pma-mky0624.vercel.app)
- **Deployment ID:** `dpl_C3Vqob2As8xs3CAX71DWcyjrRBk2`
- **Tài khoản / Tổ chức:** `mky0611` (Team: `mky0624`)
- **Dự án:** `gamified-learning-platform`
- **Kết quả Probe tự động (`tools/probe_deployment.py`):** **16/16 PASS (0 FAIL)**
  - 11 routes HTML tĩnh (`/`, `/app`, `/app/home`, `/app/auth`, `/app/minigame`, `/app/quiz`, `/app/volcard`, `/app/account`, `/app/memory`, `/app/speed-math`, `/app/code-puzzle`): 100% trả về `HTTP 200 OK` (Content-Type: `text/html; charset=utf-8`).
  - 5 tài nguyên cốt lõi (`/ui/assets/css/base.css`, `/ui/assets/js/minigame.js`, `/ui/assets/vendor/phaser.min.js`, `/ui/assets/imgs/logo.png`, `/ui/assets/units/warrior/idle.png`): 100% trả về `HTTP 200 OK` với Content-Type chuẩn xác (`text/css`, `application/javascript`, `image/png`).
  - Route API chưa triển khai trên Vercel (`GET /api/lex-raid/test`): Trả về `HTTP 404` sạch sẽ, không bị catch-all ghi đè sang `home.html`.
  - Direct refresh trên trình duyệt: 100% các trang khi F5 / tải lại trực tiếp trả về `HTTP 200 OK`, không bị 404 hoặc vòng lặp redirect.
- **Kiểm toán Chữ hoa/thường Linux (`tools/check_case_sensitivity.py`):**
  - Đã quét 348 file trên đĩa và 129 URLs động Phaser từ `raid-config.js`.
  - Kết quả: **0 missing assets, 0 case mismatches**.
- **Kiểm tra cú pháp & ID DOM (`tools/smoke_check.py`):**
  - JS syntax errors: **0**
  - Missing DOM IDs: **0**
  - Missing asset paths: **0**
- **Kiểm tra rò rỉ mã nguồn (`tools/git_security_scanner.py`):**
  - Working tree: **0 secrets** (Sạch hoàn toàn).

---

## 3. KẾT QUẢ KIỂM THỬ CHI TIẾT GIAI ĐOẠN P3 (RPG PROGRESSION & IDEMPOTENCY)

- **Chi tiết báo cáo:** Tham chiếu tài liệu độc lập `docs/P3_REWARD_TEST_REPORT.md`.
- **Bộ kiểm thử tự động (Maven Surefire + JDK 21 LTS):** Đạt **20/20 tests PASS** (0 failures, 0 errors, 0 skipped).
  1. **`RpgProgressionServiceTest` (9 tests PASS):**
     - `testLevelCalculationExactBoundaries`: Ngưỡng L1 (0-99), L2 (100-299), L3 (300-599), L4 (600-999), L5 (1000-1499), L10 (4500).
     - `testNegativeOrZeroXpAlwaysLevelOne`: Luôn đảm bảo level tối thiểu là 1.
     - `testXpRequiredForLevel`: Đảo ngược công thức chính xác.
     - `testGetLevelProgressDetails`: Tính toán chi tiết `xpCurrentInLevel`, `xpNeededForNextLevel`, `progressPercent`.
     - `testRewardCalculationLexRaid`: Thưởng Lex Raid thắng/thua có cap.
     - `testApplyRewardSingleLevelUp`: Cập nhật user và phát hiện thăng cấp đơn.
     - `testApplyRewardMultiLevelJump`: Hỗ trợ nhảy nhiều cấp độ khi cộng lượng lớn XP (50 -> 650 XP = L1 -> L4).
     - `testAccountXpBarExactSpanAndProgressFor150Xp`: Xác minh chuẩn tại 150 XP (Level 2, span 200 XP, 50/200 XP, còn 150 XP, 25.0%).
     - `testTwoConsecutiveRewardsPessimisticLockingNoLostUpdate`: Giả lập 2 session hoàn thành liên tiếp cho cùng 1 user, áp dụng `findByIdForUpdate` tuần tự không mất XP/Coins.
  2. **`AccountProfileServiceTest` (2 tests PASS):**
     - `testGetProfileSuccess`: Tính toán profile đầy đủ, EXP bar, stages cleared, best score, total battles.
     - `testGetProfileSelfHealsLevelIfOutOfSync`: Tự phục hồi `level_current` trong DB khi out-of-sync.
  3. **`LexRaidProgressionTest` (4 tests PASS):**
     - `testFinishSessionAwardsRewardsOnce`: Cộng thưởng trận đấu và cập nhật tiến trình ải lần đầu.
     - `testCannotSendFakeScoreOrResultToGetRewards`: Chống hack điểm/thắng giả; backend tính từ event log và boss HP $\rightarrow$ kết quả LOST, 0 XP, 0 Coin.
     - `testFinishSessionStrictIdempotencyNoDoubleReward`: Chống nhận thưởng lặp khi gọi lại `/finish` trên session `COMPLETED`.
     - `testStageProgressStarsNonDecreasing`: Bảo toàn kỷ lục số sao cao nhất, không suy giảm khi chơi lại ít điểm hơn.
  4. **`QuizProgressionTest` (5 tests PASS):**
     - `testQuizCompletionAwardsXpAndCoins`: Trao thưởng XP/Coins khi hoàn thành câu hỏi cuối.
     - `testQuizAnswerBelongingToAnotherQuestionIsRejected`: Nộp câu trả lời thuộc câu hỏi khác bị từ chối với ngoại lệ `IllegalArgumentException`.
     - `testQuizQuestionBelongingToAnotherSetIsRejected`: Nộp câu hỏi thuộc bộ đề khác bị từ chối với ngoại lệ `IllegalArgumentException`.
     - `testSubmittingAnswerToAlreadyAttemptedQuestionThrowsException`: Chống nộp trùng câu hỏi trong cùng session.
     - `testSubmittingAnswerToCompletedSessionThrowsException`: Từ chối nộp câu hỏi vào session đã kết thúc.
- **Frontend & Static Checks:**
  - `smoke_check.py`: 0 lỗi cú pháp JS, 0 ID DOM thiếu, 0 asset hỏng.
  - `git_security_scanner.py`: 0 secrets trong working tree.
  - `preview-server.js`: Node.js syntax PASS, route `/app/account` hoạt động chuẩn.

---

## 4. KẾT QUẢ KIỂM THỬ CHI TIẾT GIAI ĐOẠN P2 (VOCABULARY & IT TAXONOMY)

### A. Kiểm toán Cơ sở Dữ liệu Từ vựng Seed (P2-A Audit)
- **Tập tin công cụ:** `src/main/resources/tools/audit_vocabulary_db.py`
- **Tập tin báo cáo:** `docs/P2_VOCABULARY_AUDIT.md` và `Agent & Skill/docs/P2_VOCABULARY_AUDIT.md`
- **Kết quả thực tế từ 2.098 rows:**
  - 2.096 từ tiếng Anh và 2 từ tiếng Nhật (Set 17: `ohayou`, `arigatou`).
  - Phân bổ CEFR hiện tại: B1 (23 từ), B2 (41 từ), C1 (11 từ). 2.023 từ còn lại (96.43%) có `level_cefr = NULL`.
  - Phân tích nghĩa: 100% từ có nghĩa tiếng Việt (`meaning_vi`), nhưng 2.021 từ thiếu định nghĩa tiếng Anh (`meaning_en = NULL`).
  - Đánh giá bàn cờ ghép chữ đơn ($5 \times 5$): 1.998 từ hợp lệ (95.5%), 94 từ không hợp lệ (28 từ $< 3$ ký tự, 48 từ $> 10$ ký tự, 19 từ chứa dấu gạch nối/ký tự đặc biệt).

### B. Kiểm thử Bộ công cụ Nhập liệu Từ vựng (P2-C Importer & Unit Tests)
- **Kiểm thử đơn vị:** Chạy lệnh `python -m unittest "src/main/resources/tools/test_vocabulary_importer.py"`:
  ```text
  ...
  ----------------------------------------------------------------------
  Ran 3 tests in 0.006s
  OK
  ```
  1. `test_pos_normalization`: Chuẩn hóa chính xác các biến thể `n.`, `v.`, `adj.`, `adv.`, `prep.`, `conj.`, `phrase`.
  2. `test_board_eligibility`: Nhận diện chính xác từ đơn hợp lệ 3..10 ký tự thuần alphabet vs cụm từ nhiều chữ (*continuous integration*), từ gạch nối (*real-time*), từ quá ngắn (*go*) hoặc quá dài (*congratulations*).
  3. `test_validation_pipeline_dry_run`: Kiểm tra toàn diện luồng import không ghi đè DB, phát hiện trùng lặp trong file và trong seed database.

- **Chạy thực tế chế độ Dry Run:** Chạy lệnh `python src/main/resources/tools/vocabulary_importer.py --input "Agent & Skill/data/vocabulary_import_template.json" --output "docs/P2_IMPORT_DRY_RUN_REPORT.json"`:
  - Tổng số mục xử lý: 26/26.
  - Số mục hợp lệ: 26.
  - Số mục bị từ chối: 0.
  - Cảnh báo (Warnings): 32 (bao gồm phát hiện từ trùng lặp với seed và thiếu `cefrSourceUri`).
  - Phân loại Board-Eligible: 22 từ (ghép chữ trận đấu Lex Raid).
  - Phân loại Flashcard/Quiz Only: 4 cụm từ (chỉ hiển thị trên Volcard/Quiz).
  - Phân bổ CEFR: 26 UNVERIFIED (tuân thủ nghiêm ngặt nguyên tắc chống gán nhãn CEFR tự do không có nguồn đối chiếu).

### C. Kiểm thử Backend Services (P2-D Volcard, Quiz & Lex Raid Engine)
- **`VolcardServiceImpl.java`:**
  - Hỗ trợ tham số truy vấn tùy chọn `cefrLevel` (lọc chính xác A1, A2, B1, B2, C1, C2, hoặc UNKNOWN/NULL).
  - Hỗ trợ tham số truy vấn tùy chọn `search` (tìm kiếm hai chiều: tiếng Anh và tiếng Việt).
  - Chuẩn hóa Part of Speech tự động trong `toDto()`.
  - Fallback an toàn khi `meaning_en` là NULL.
  - DTO mở rộng: cung cấp `itDomain`, `itTier`, `boardEligible`.
- **`LexRaidServiceImpl.java` (Thuật toán sinh bàn cờ `buildBoard`):**
  - Khắc phục lỗi thiếu nguyên âm (vowel starvation): Thay thế việc sinh ngẫu nhiên phân phối đều (chỉ ~19% nguyên âm) bằng bảng tần suất chữ cái chuẩn tiếng Anh đạt ~42% nguyên âm (`A, E, I, O, U`) và các phụ âm thông dụng (`T, N, S, R, H, L, D, C, M, P`).
  - Đảm bảo tính giải đố: Luôn đưa toàn bộ chữ cái của `coreWord` và 1-2 từ vựng phụ (`topicWords`) vào các ô gần tâm bàn cờ (sắp xếp theo khoảng cách Manhattan).
  - Lọc bỏ triệt để từ tiếng Nhật (`languageCode == 'ja'`) và các từ không hợp lệ khỏi Lex Raid battle runtime.

### D. Kiểm thử Frontend & UI Components (P2-E Volcard & Quiz UI)
- Chạy kiểm thử cú pháp và DOM `smoke_check.py`:
  ```text
  Smoke check results
  ===================
  Root: D:\Program Files\HFR\PE_Test\GamifiedLearningPlatform\src\main\resources\FrontEnd
  JS syntax errors: 0
  Missing DOM ids: 0
  Missing asset paths: 0
  ```
- Kiểm tra tính tương thích của server xem trước `preview-server.js` trên Node.js v24.15.0:
  - Khởi chạy mượt mà tại `http://127.0.0.1:4173`.
  - Định tuyến chính xác trang `/app/volcard` và `/app/quiz`.
- Tính năng giao diện mới trên Volcard:
  - 8 nút lọc CEFR Pills (Tất cả, A1, A2, B1, B2, C1, C2, Chưa gán).
  - Ô tìm kiếm từ vựng thời gian thực có debounce chống giật lag.
  - Nút phát âm Web Speech API TTS (`ttsBtn`) kèm cảnh báo giọng máy.
  - Hệ thống huy hiệu Pixel RPG cho POS, CEFR, IT Domain và IT Tier.
  - Điều hướng đa chiều: Lật thẻ (`flipBtn`), Từ tiếp theo (`nextBtn`), Từ trước đó (`prevBtn`).

---

## 5. BẰNG CHỨNG HÌNH ẢNH FRAME-BY-FRAME P0

1. `warrior_frame_stability_audit.png` (2760×220px): Chân cố định tại Y=170.
2. `archer_frame_stability_audit.png` (2070×220px): Chân cố định tại Y=135.
3. `lancer_frame_stability_audit.png` (3105×220px): 27 frames normalized, chân chạm đất.
4. `bosses_frame_stability_audit.png` (4410×200px): 49 frames của 9 boss, bám đất Y=350.
5. `arena_scene_composite_audit.png` (960×420px): Đấu trường chuẩn 960×420.

---

## 6. KẾT LUẬN & ĐIỀU KIỆN NGHIỆM THU PHASE P4-A

Giai đoạn **P4-A Vercel Preview Deployment** đã hoàn thành xuất sắc toàn bộ các mục tiêu kỹ thuật:
1. Triển khai production Vercel thành công tại `https://gamified-learning-platform-sandy.vercel.app` với chứng chỉ SSL hợp lệ.
2. Cấu hình điều hướng tĩnh 11 routes chính xác, không dùng catch-all ghi đè `/api/**` về `home.html`, direct refresh không bị 404.
3. Kiểm toán phân biệt hoa thường Linux đạt 100% (348 assets disk + 129 URLs động: 0 lỗi).
4. Kiểm tra probe thực tế 16/16 endpoints đạt chuẩn HTTP 200 OK (0 fail).
5. Giao diện chế độ xem trước (Preview Mode) cho Lex Raid, Volcard, Quiz, Account hoạt động độc lập, mượt mà, không ghi nhận thưởng ảo khi chưa có backend SQL Server.
6. Toàn bộ mã nguồn đạt chuẩn an toàn 0 sensitive leaks và 0 smoke check errors.
