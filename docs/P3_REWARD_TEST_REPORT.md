# BÁO CÁO KIỂM THỬ TIẾN TRÌNH RPG & HỆ THỐNG PHẦN THƯỞNG — PHASE P3
## RPG PROGRESSION, XP, COINS, LEVEL UP & IDEMPOTENCY TEST REPORT

**Thời điểm lập:** 23/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh kiểm thử:** `feature/p3-rpg-progression`  
**Đơn vị thực hiện:** Antigravity AI Engineering & QA Team  

---

## 1. TỔNG QUAN VÀ MỤC TIÊU PHASE P3

Giai đoạn Phase P3 giải quyết triệt để vấn đề mất liên kết giữa gameplay và cơ sở dữ liệu:
1. **Lưu trữ thực tế XP và Gold Coins:** Sau khi kết thúc trận đấu Lex Raid hoặc hoàn thành bộ câu hỏi Quiz, điểm thưởng được tích lũy trực tiếp vào thực thể `User` (`xp_total`, `level_current`, `coins`) và `GameSession` trong SQL Server.
2. **Hệ thống cấp độ chuẩn toán học ($O(1)$ Quadratic Curve):** Cấp độ xuất phát từ Level 1 tại 0 XP, tính toán trực tiếp thời gian thực, hỗ trợ nhảy cóc nhiều cấp độ (multi-level jump) khi tích lũy lượng lớn XP.
3. **Tiến trình ải (`UserStageProgress`):** Ghi nhận chính xác số lần thắng (`clear_count`), số lần thua (`fail_count`), điểm cao nhất (`best_score`), và số sao đạt được theo nguyên tắc **không bao giờ giảm** (`Math.max(existingStars, newStars)`).
4. **Bảo mật & Chống gian lận / Anti-Double Reward:** Idempotency tuyệt đối — ngăn chặn việc nhận thưởng nhiều lần do reload trang, retry network, hoặc gọi lặp lại API `/finish`. Phạt/chặn tính điểm tùy tiện từ phía frontend.
5. **Player Profile API (`GET /api/v1/account/profile`):** Cung cấp toàn bộ chỉ số thực tế từ DB cho trang Tài khoản, Trang chủ và Đấu trường.
6. **Pixel RPG UI Polish:** Nâng cấp hoàn thiện Modal Kết thúc Trận đấu (Battle Result Modal), thẻ thông tin tiến trình tài khoản (Account Profile Card) và thanh EXP Progress Bar.

---

## 2. KIẾN TRÚC TOÁN HỌC & CÔNG THỨC TIẾN TRÌNH

### A. Công thức Tính Cấp độ ($O(1)$ Level Curve)

Hệ thống sử dụng đường cong lũy tiến bậc hai:
$$\text{XP Base}(L) = 50 \times L \times (L - 1)$$

Từ đó, cấp độ $L$ được tính toán trực tiếp với độ phức tạp $O(1)$:
$$L = \max\left(1, \left\lfloor \frac{1 + \sqrt{1 + \frac{X}{12.5}}}{2} \right\rfloor\right)$$

#### Bảng ngưỡng cấp độ cụ thể:
| Level | XP Tối thiểu | XP Tới Level kế | Khoảng cách Level | Ghi chú |
| :---: | :---: | :---: | :---: | :--- |
| **1** | 0 XP | 100 XP | 100 XP | Cấp khởi đầu của tân thủ |
| **2** | 100 XP | 300 XP | 200 XP | Đạt sau 1–2 trận thắng |
| **3** | 300 XP | 600 XP | 300 XP | Người chơi sơ cấp |
| **4** | 600 XP | 1.000 XP | 400 XP | Thành thạo từ vựng cơ bản |
| **5** | 1.000 XP | 1.500 XP | 500 XP | Cột mốc mở khóa tính năng nâng cao |
| **6** | 1.500 XP | 2.100 XP | 600 XP | Người chơi trung cấp |
| **10** | 4.500 XP | 5.500 XP | 1.000 XP | Bậc thầy từ vựng |

### B. Công thức Tính Phần thưởng (Reward Formulas)

1. **Lex Raid Battle:**
   - **Chiến thắng (WON):**
     $$\text{XP} = \min(300, 50 + \lfloor\text{Score} / 10\rfloor)$$
     $$\text{Coins} = \min(50, \max(10, \lfloor\text{Score} / 20\rfloor))$$
   - **Thất bại (LOST):**
     $$\text{XP} = \min(50, \max(5, \lfloor\text{Score} / 20\rfloor))$$
     $$\text{Coins} = \min(10, \max(2, \lfloor\text{Score} / 50\rfloor))$$
2. **Quiz Session:**
   - Hoàn thành quiz: $\text{XP} = \min(150, \max(10, \lfloor\text{Score} / 5\rfloor \times 3))$
   - Gold coins: $\text{Coins} = \min(30, \max(5, \lfloor\text{Score} / 10\rfloor))$

### C. Cơ chế Tự Phục hồi Cấp độ (Level Self-Healing)
Khi gọi `GET /api/v1/account/profile`, nếu dữ liệu lịch sử trong DB có `level_current` không khớp với giá trị toán học của `xp_total`, hệ thống sẽ tự động cập nhật và lưu lại giá trị `level_current` chuẩn vào bảng `users`.

---

## 3. BẢNG TỔNG KẾT KIỂM THỬ ĐƠN VỊ & TÍCH HỢP (TEST MATRIX)

Toàn bộ 14 bài kiểm thử tự động đã được biên dịch với **JDK 21 LTS** và chạy kiểm thử thành công **100% PASS**:

```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running org.example.service.AccountProfileServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.452 s -- in org.example.service.AccountProfileServiceTest
[INFO] Running org.example.service.LexRaidProgressionTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.471 s -- in org.example.service.LexRaidProgressionTest
[INFO] Running org.example.service.QuizProgressionTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.184 s -- in org.example.service.QuizProgressionTest
[INFO] Running org.example.service.RpgProgressionServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.018 s -- in org.example.service.RpgProgressionServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  11.027 s
```

### Chi tiết từng bài test:

| Suite kiểm thử | Tên test case | Mục đích kiểm thử | Kết quả |
| :--- | :--- | :--- | :---: |
| **`RpgProgressionServiceTest`** | `testLevelCalculationExactBoundaries` | Kiểm tra chính xác ngưỡng cấp độ 0-99 (L1), 100-299 (L2), 300-599 (L3), 600-999 (L4), 1000-1499 (L5), 4500 (L10). | **PASS** |
| | `testNegativeOrZeroXpAlwaysLevelOne` | Kiểm tra XP âm hoặc 0 luôn trả về Level 1 (không bao giờ Level 0). | **PASS** |
| | `testXpRequiredForLevel` | Kiểm tra hàm ngược tính XP cơ sở của từng cấp độ. | **PASS** |
| | `testGetLevelProgressDetails` | Kiểm tra tính toán `xpCurrentInLevel`, `xpNeededForNextLevel`, và `progressPercent` (chính xác 25% tại 150 XP). | **PASS** |
| | `testRewardCalculationLexRaid` | Kiểm tra công thức thưởng thắng/thua của Lex Raid kèm giới hạn trần (cap). | **PASS** |
| | `testApplyRewardSingleLevelUp` | Kiểm tra cộng XP/Coins và phát hiện chính xác 1 lần Level Up. | **PASS** |
| | `testApplyRewardMultiLevelJump` | Kiểm tra cộng lượng lớn XP (từ 50 lên 1250 XP) dẫn đến nhảy cóc nhiều cấp độ (L1 $\rightarrow$ L5) và `levelsGained = 4`. | **PASS** |
| **`AccountProfileServiceTest`** | `testGetProfileSuccess` | Kiểm tra tổng hợp profile người chơi: level, exp bar, loadout, stages cleared, best score, total battles. | **PASS** |
| | `testGetProfileSelfHealsLevelIfOutOfSync` | Kiểm tra cơ chế tự phục hồi cấp độ khi `level_current` trong DB không khớp với `xp_total`. | **PASS** |
| **`LexRaidProgressionTest`** | `testFinishSessionAwardsRewardsOnce` | Kiểm tra hoàn thành trận đấu lần đầu: cộng đúng XP/Coins vào User và GameSession, ghi nhận tiến trình ải. | **PASS** |
| | `testFinishSessionStrictIdempotencyNoDoubleReward` | **Chống nhận thưởng 2 lần:** Kiểm tra gọi lại `finishSession` khi session đã `COMPLETED` sẽ không gọi lại `applyReward` vào User. | **PASS** |
| | `testStageProgressStarsNonDecreasing` | **Bảo toàn kỷ lục:** Kiểm tra số sao đạt được không bao giờ bị giảm nếu chơi lại trận sau được ít sao hơn. | **PASS** |
| **`QuizProgressionTest`** | `testQuizCompletionAwardsXpAndCoins` | Kiểm tra hoàn thành câu hỏi cuối của Quiz session: tính toán XP/Coins chuẩn và cập nhật User. | **PASS** |
| | `testSubmittingAnswerToCompletedSessionThrowsException` | **Idempotency Quiz:** Kiểm tra việc nộp thêm câu hỏi vào session đã kết thúc sẽ bị từ chối với ngoại lệ `IllegalArgumentException`. | **PASS** |

---

## 4. KIỂM TOÁN TĨNH & AN TOÀN MÃ NGUỒN

1. **Smoke Check Frontend (`smoke_check.py`):**
   - JS syntax errors: **0**
   - Missing DOM IDs: **0**
   - Missing asset paths: **0**
2. **Git Security Scanner (`git_security_scanner.py`):**
   - Working tree scan: **0 matches** (Mã nguồn sạch hoàn toàn, không có secret nào trong code mới).
3. **Preview Server (`preview-server.js`):**
   - Cú pháp Node.js: **PASS** (`node -c preview-server.js` exit code 0).
   - Đã bổ sung route `/app/account` trả về đúng `src/pages/account.html`.

---

## 5. KẾT LUẬN VÀ BÀN GIAO

Giai đoạn Phase P3 đã hoàn thành xuất sắc toàn bộ các mục tiêu đặt ra:
- [x] Tạo Service `RpgProgressionService` với đường cong cấp độ $O(1)$ và công thức thưởng cân bằng.
- [x] Đảm bảo tính Idempotency và Anti-Double Reward trong cả Lex Raid và Quiz.
- [x] Ghi nhận tiến trình ải với số sao không suy giảm.
- [x] Xây dựng Player Profile API và cơ chế tự phục hồi cấp độ.
- [x] Hoàn thiện giao diện Pixel RPG Battle Result Modal, EXP Progress Bar, và đồng bộ thanh điều hướng thời gian thực.
- [x] Đạt 14/14 Unit & Integration Tests PASS trên Java 21 LTS.
