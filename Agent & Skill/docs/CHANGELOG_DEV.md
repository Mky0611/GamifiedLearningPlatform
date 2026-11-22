# CHANGELOG — LEX RAID DEVELOPMENT & FIXES

**Dự án:** Gamified Learning Platform — Lex Raid  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Giai đoạn:** P0 (Animation, Gameplay UI, Mobile Responsive, Runtime QA)  

---

## [P0-Finalization] — 23/11/2026

### 1. Phaser 3 Engine & Animation System
- **`src/main/resources/FrontEnd/assets/js/phaser/raid-config.js`:**
  - Thiết lập `groundY: 350`, `heroY: 350`, `bossY: 350` trên khung Canvas `960×420`.
  - Tính toán chính xác `originY` bám đất cho:
    - Warrior: `0.7135` ($137 / 192$)
    - Archer: `0.7083` ($136 / 192$)
    - Lancer: `0.9271` ($178 / 192$)
    - 9 Boss quái vật kho báu: Captain (0.8), Crabby (0.9062), Fierce (0.9333), Pink (0.9667), Totem 1 (0.9688), Totem 2/3 (1.0), Seashell (1.0), Cannon (1.0).
- **`src/main/resources/FrontEnd/assets/js/phaser/battle-scene.js`:**
  - Thêm cờ `isBossDying = false`.
  - Bổ sung hàm `clearAttackTimers()` và `clearBossTurnTimers()` để hủy các `Phaser.Time.TimerEvent` delayed callbacks khi nhân vật hoặc quái vật chết / đổi trạng thái.
  - Ngăn chặn lỗi hồi sinh sprite Boss ma khi chết trong `applyState()`.
  - Trong `spawnActors()`: Bổ sung lệnh hủy tween an toàn `this.tweens.killTweensOf` và reset `this.isAttacking = false`.
  - Đồng bộ tọa độ bóng `heroShadow.x = hero.x` và `bossShadow.x = boss.x` liên tục theo thời gian thực trong mọi tween đòn đánh.
- **`src/main/resources/FrontEnd/assets/js/raid-phaser-embed.js`:**
  - Đồng bộ Canvas Fallback 2D khớp tỷ lệ 960×420, groundY=350, heroX=406, bossX=554 và thuật toán vẽ flipped boss đối diện hero.

### 2. Frontend Gameplay & Mobile Responsive
- **`src/main/resources/FrontEnd/assets/js/minigame.js`:**
  - Thêm cờ `isSubmitting` bọc trong `try ... finally { state.isSubmitting = false; }` cho cả `submitWord()` và `guessCoreWord()` để chống spam phím.
  - Đồng bộ Máu người chơi (`#playerHpHudValue`) và Đồng hồ (`#timerHudValue`) lên Arena Quick HUD trong `fillBars()` và `tickTimer()`.
  - Bổ sung thao tác tap-to-undo trên ô chữ vừa chọn.
  - Thêm fallback tính toán điểm và trừ máu cục bộ khi backend API timeout hoặc mất kết nối.
- **`src/main/resources/FrontEnd/src/pages/minigame.html`:**
  - Bổ sung cấu trúc `.arena-hud-player` vào `.arena-hud-overlay` (hiển thị Player HP & Timer ngay trên góc Canvas).
  - Bổ sung các ID DOM thiếu hụt: `#bossHpHudValue`, `#bossShieldHudValue`, `#bossSpriteSheet`.
- **`src/main/resources/FrontEnd/assets/css/minigame.css`:**
  - Tối ưu hóa layout compact cho mobile (< 720px): tự động ẩn thẻ `.raid-header` cồng kềnh trong lúc chiến đấu.
  - Tối ưu hóa cho viewport 320×568 (iPhone SE): giảm padding, thu hẹp gap, sử dụng `--tile-size: clamp(38px, ...)` giúp toàn bộ màn hình combat chỉ chiếm 450.5px (79.3% màn hình), loại bỏ hoàn toàn việc phải cuộn trang.
  - Bổ sung `.arena-hud-overlay` hiển thị đồng thời cả Player HUD (góc trái) và Boss HUD (góc phải).

### 3. Server & Tools
- **`preview-server.js`:**
  - Bổ sung MIME types cho font chữ (`.woff`, `.woff2`, `.ttf`), dữ liệu (`.json`), và âm thanh (`.mp3`, `.wav`, `.ogg`).
- **`Agent & Skill/scripts/test_p0_verification.py`:**
  - Cập nhật bộ test phân cấp minh bạch: STATIC PASS, UNIT PASS, SIMULATION PASS, BROWSER NOT TESTED.
- **`Agent & Skill/scripts/playwright_p0_acceptance.js`:**
  - Tạo mới kịch bản kiểm thử tự động Playwright đo đạc 7 viewports và thực hiện tương tác chiến đấu thực tế.
- **`src/main/resources/FrontEnd/assets/qa_audit/`:**
  - Tạo 5 tệp ảnh kiểm chứng trực quan frame-by-frame và phối cảnh đấu trường.
