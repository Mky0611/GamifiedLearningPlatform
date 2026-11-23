# LEX RAID — THIẾT KẾ KIẾN TRÚC TIẾN TRÌNH RPG (PHASE P3)
## RPG Progression, XP, Coins, Level-Up, Persistent Game Sessions & Player Profile

**Tài liệu:** P3 Progression & Player Profile Architecture  
**Phiên bản:** 1.0.0 (Phase P3)  
**Nhánh Git:** `feature/p3-rpg-progression`  
**Trạng thái:** HOÀN TẤT THIẾT KẾ VÀ KIỂM TOÁN LỖI  

---

## 1. TỔNG QUAN VÀ MỤC TIÊU KIẾN TRÚC

Trong Phase P3, mọi hành động học tập và chiến đấu trong Lex Raid (Boss Hunt, Quiz Challenge, Vocabulary) được chuyển hóa thành hệ thống tiến trình RPG thực tế, được lưu trữ bền vững vào Microsoft SQL Server.

Mục tiêu cốt lõi:
1. **Tích lũy XP & Gold Coins:** Ghi nhận chính xác XP và Coins kiếm được vào `game_sessions` và cộng dồn vào bảng `users`.
2. **Hệ thống Level-Up minh bạch:** Tính toán cấp độ ($Level \ge 1$) dựa trên tổng XP thực tế qua công thức toán học $O(1)$, hỗ trợ thăng nhiều cấp cùng lúc (multi-level jump).
3. **Tiến trình Màn chơi (`user_stage_progress`):** Lưu trữ kỷ lục điểm số cao nhất (*best score*), chuỗi combo cao nhất (*highest combo*), số sao đạt được (*stars earned*), số từ tìm thấy, số core word đoán trúng, số lần chiến thắng (*clear count*) và số lần thất bại (*fail count*).
4. **Bảo vệ Tính Bất biến & Chống Nhận Thưởng Trùng (Strict Idempotency):**
   - Không cộng thưởng hai lần khi người chơi reload trang.
   - Không cộng thưởng lặp khi endpoint `/finish` được gọi nhiều lần hoặc gửi song song (concurrent requests).
   - Không tăng `clear_count` nhiều lần trong cùng một trận đấu (khi tiếp tục đánh chữ sau khi Boss đã chết).
   - Không tin tưởng điểm thưởng XP/Coin do client tự gửi.
5. **Đồng bộ Hồ sơ Người chơi (Player Profile API):** Cung cấp endpoint đọc hồ sơ thời gian thực và đồng bộ lên giao diện Home, Account và màn hình Kết quả trận đấu (Battle Result Screen) theo chuẩn Pixel RPG Design System.

---

## 2. KẾT QUẢ KIỂM TOÁN LỖI THỰC TẾ (P3-A PROGRESSION AUDIT)

Trước khi thực hiện sửa mã, nhóm kỹ thuật đã kiểm toán toàn bộ luồng xử lý phiên chơi và phát hiện các khiếm khuyết nghiêm trọng trong mã nguồn cũ:

### 2.1. Lỗi Ngắt kết nối giữa GameSession và User (User Never Rewarded)
- Trong `LexRaidServiceImpl.java` (`finalizeGameSession`), hệ thống chỉ cập nhật `gameSession.setXpEarned(...)` và lưu `gameSessionRepository.save(gameSession)`.
- **Thực trạng:** Đối tượng `User` (`user.getXpTotal()`, `user.getLevelCurrent()`, `user.getCoins()`) **hoàn toàn không được cập nhật hay lưu vào cơ sở dữ liệu**!
- Trong `QuizServiceImpl.java`, khi người chơi hoàn thành bộ câu hỏi (`COMPLETED`), `session.getUser()` cũng không được cộng dồn XP hay Coins!
- **Hệ quả:** Dù người chơi thắng bao nhiêu trận hay làm bao nhiêu quiz, tài khoản trong cơ sở dữ liệu vẫn mãi mãi ở Level 1, 0 XP, 0 Coins.

### 2.2. Lỗi Cộng thưởng Trùng lặp (Double Reward Flaw)
- Khi Boss chết trong `submitWord()` (dòng 250) hoặc `guessCoreWord()` (dòng 367), backend gọi `finalizeGameSession(raidSession, WON, null)`:
  ```java
  gameSession.setXpEarned(defaultIfNull(gameSession.getXpEarned(), 0) + Math.max(5, totalScore / 20));
  ```
- Sau đó, khi client JavaScript gửi request kết thúc trận lên `/api/v1/lex-raid/sessions/{id}/finish` (`finishSession()`), hàm `finalizeGameSession()` được gọi **lần thứ hai**, cộng tiếp XP một lần nữa!
- Nếu người chơi double-click nút hoặc gửi lại request retry, XP tiếp tục được cộng dồn vô hạn.

### 2.3. Lỗi Đếm Trùng Số Trận Thắng (`clear_count` Flaw)
- Trong `updateStageProgress()` (dòng 522-530):
  ```java
  if (WON.equalsIgnoreCase(raidSession.getStatus())) {
      progress.setClearCount(defaultIfNull(progress.getClearCount(), 0) + 1);
  }
  ```
- Hàm `updateStageProgress()` được gọi mỗi khi `submitWord()` hợp lệ (dòng 243) và được gọi thêm một lần nữa trong `finishSession()` (dòng 191).
- Khi trạng thái session đã là `WON`, mọi lần gọi tiếp theo đều tăng `clearCount` lên 1, dẫn đến 1 trận thắng có thể làm tăng `clear_count` từ 2 đến hàng chục lần!

### 2.4. Lỗi Hạ Số Sao Kỷ Lục (Stars Downgrade Bug)
- Trong `updateStageProgress()`, dòng 525:
  ```java
  progress.setStarsEarned(resolveStars(raidSession));
  ```
- Nếu người chơi đã từng đạt 3 sao trong lần chơi trước, nhưng lần chơi sau chỉ đạt 1 sao, giá trị `starsEarned` bị ghi đè xuống 1 sao thay vì giữ giá trị cao nhất `Math.max(previousStars, newStars)`.

### 2.5. Lỗ hổng Tin tưởng Client (Untrusted Client Payload)
- Client gửi `scoreTotal`, `xpEarned`, `coinsEarned` tùy ý trong `LexRaidSessionSyncRequest`.
- Backend cần tính toán giá trị thực tế dựa trên tiến trình đã xác minh của trận đấu, giới hạn trần thưởng hợp lý.

---

## 3. CÔNG THỨC TOÁN HỌC & LEVEL-UP ENGINE (P3-B & P3-C)

### 3.1. Công thức Level dựa trên Tổng XP
Hệ thống sử dụng công thức tăng trưởng bậc hai (quadratic progression) chuẩn mực của game RPG:
- Mọi người chơi bắt đầu tại **Level 1** với **0 XP**.
- Ngưỡng XP tích lũy để đạt cấp độ $L$ ($L \ge 1$):
  $$\text{XP}_{\text{req}}(L) = 50 \times (L - 1) \times L$$

Bảng đối chiếu cấp độ:
| Level ($L$) | Tổng XP yêu cầu ($\text{XP}_{\text{req}}$) | Delta XP từ cấp trước |
| :---: | :---: | :---: |
| **1** | 0 XP | 0 |
| **2** | 100 XP | 100 XP |
| **3** | 300 XP | 200 XP |
| **4** | 600 XP | 300 XP |
| **5** | 1,000 XP | 400 XP |
| **6** | 1,500 XP | 500 XP |
| **7** | 2,100 XP | 600 XP |
| **8** | 2,800 XP | 700 XP |
| **9** | 3,600 XP | 800 XP |
| **10** | 4,500 XP | 900 XP |

Từ tổng XP hiện tại $X \ge 0$, Cấp độ $L$ được tính toán trực tiếp với độ phức tạp $O(1)$:
$$L = \left\lfloor \frac{1 + \sqrt{1 + \frac{X}{12.5}}}{2} \right\rfloor$$

Thông số tiến trình cấp độ:
- **XP gốc của cấp hiện tại:** $\text{XP}_{\text{base}} = 50 \times (L - 1) \times L$
- **XP ngưỡng cấp tiếp theo:** $\text{XP}_{\text{next}} = 50 \times L \times (L + 1)$
- **XP hiện có trong cấp:** $\text{XP}_{\text{current\_in\_level}} = X - \text{XP}_{\text{base}}$
- **XP còn thiếu để lên cấp:** $\text{XP}_{\text{needed}} = \text{XP}_{\text{next}} - X$
- **Tỷ lệ phần trăm thanh XP:**
  $$\text{Progress \%} = \frac{X - \text{XP}_{\text{base}}}{\text{XP}_{\text{next}} - \text{XP}_{\text{base}}} \times 100\%$$

### 3.2. Quy tắc Tính Thưởng XP & Gold Coins
Mọi phần thưởng được tính toán khép kín trên Backend:

1. **Lex Raid (Boss Hunt):**
   - **Chiến thắng (`WON`):**
     - Base XP: `50 XP`
     - Score Bonus XP: $\min(50, \lfloor \text{totalScore} / 10 \rfloor)$
     - Tổng XP nhận: $50 \le \text{xpEarned} \le 100$
     - Gold Coins: $\max(10, \min(50, \lfloor \text{totalScore} / 20 \rfloor))$
   - **Thất bại (`LOST`):**
     - Consolation XP: $\max(5, \min(20, \lfloor \text{totalScore} / 25 \rfloor))$
     - Consolation Coins: $\max(2, \min(10, \lfloor \text{totalScore} / 50 \rfloor))$

2. **Quiz Challenge:**
   - Hoàn thành bộ câu hỏi:
     - XP nhận: $\max(10, \min(60, \lfloor \text{scoreTotal} / 2 \rfloor))$
     - Gold Coins: $\max(5, \min(30, \lfloor \text{scoreTotal} / 5 \rfloor))$

---

## 4. CƠ CHẾ BẢO ĐẢM IDEMPOTENCY & CHỐNG CỘNG TRÙNG

Để triệt tiêu hoàn toàn nguy cơ cộng trùng thưởng và số lần chiến thắng:

1. **Khóa trạng thái phiên (`GameSession.status`):**
   - `GameSession` khởi tạo ở trạng thái `IN_PROGRESS`.
   - Khi trận đấu kết thúc, hệ thống chuyển trạng thái sang `COMPLETED` trong giao dịch `@Transactional`.
   - **Quy tắc vàng:** Chỉ khi trạng thái trước đó là `IN_PROGRESS` thì mới thực hiện:
     1. Cộng `xpEarned` và `coinsEarned` vào `User.xpTotal` và `User.coins`.
     2. Tính toán cấp độ mới `User.levelCurrent` từ `User.xpTotal`.
     3. Tăng `clear_count` (nếu `WON`) hoặc `fail_count` (nếu `LOST`) trong `UserStageProgress`.
   - Nếu phiên chơi đã ở trạng thái `COMPLETED` (do đã kết thúc trước đó, hoặc do request thứ 2 gửi đến):
     - Tuyệt đối **KHÔNG** cộng dồn thêm XP, Coin vào User.
     - Tuyệt đối **KHÔNG** tăng thêm `clearCount` hay `failCount`.
     - Chỉ trả về kết quả đã được ghi nhận trước đó.

2. **Cập nhật lũy tiến không suy giảm (`UserStageProgress`):**
   - `bestScore = max(oldBestScore, sessionScore)`
   - `highestCombo = max(oldHighestCombo, sessionCombo)`
   - `starsEarned = max(oldStars, sessionStars)`
   - `firstClearedAt`: Chỉ gán timestamp trong lần đầu tiên hoàn thành màn chơi (`firstClearedAt == null`).

---

## 5. THIẾT KẾ DTO & API HỒ SƠ NGƯỜI CHƠI (P3-E & P3-F)

Để Frontend có thể hiển thị dữ liệu RPG thực tế và cập nhật liên tục:

### 5.1. DTO `PlayerProfileDto`
```java
public class PlayerProfileDto {
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String selectedUnitCode;
    private String selectedAvatarKey;
    private Integer levelCurrent;
    private Integer xpTotal;
    private Integer xpCurrentInLevel;
    private Integer xpNeededForNextLevel;
    private Double levelProgressPercent;
    private Integer coins;
    private Integer streakDays;
    private Integer stagesCleared;
    private Integer totalBattles;
    private Integer bestScore;
}
```

### 5.2. Endpoint `GET /api/v1/account/profile`
- Trả về thông tin hồ sơ RPG hoàn chỉnh của người chơi kèm tiến độ thanh XP.
- Tự động đồng bộ với avatar và unit đang trang bị từ `UserLoadout`.

### 5.3. Mở rộng `LexRaidSessionDto`
- Bổ sung các trường trả về khi kết thúc trận:
  - `xpEarned`, `coinsEarned`
  - `userLevelCurrent`, `userXpTotal`, `userCoins`
  - `levelUpOccurred`, `levelsGained`
  - `starsEarned`
- Frontend đọc trực tiếp các trường này từ response của `/finish` để hiển thị trên popup chiến thắng/thất bại Pixel RPG.
