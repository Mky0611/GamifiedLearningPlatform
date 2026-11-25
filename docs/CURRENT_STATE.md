# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-25  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát triển:** `feature/p4b2-kingdom-of-words` (branced from `7e725ed`)  
**Trạng thái hiện tại:** **PHASE P4-B.2 KINGDOM OF WORDS VERIFIED IN CHROMIUM — READY FOR VERCEL PREVIEW DEPLOY**

---

## 1. TỔNG QUAN HỆ THỐNG (GIỮ NGUYÊN KHÔNG PHÁ VỠ)
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security (không sửa mã nguồn hay schema SQL Server trong P4-B.2; đã kiểm tra tương thích read-only với `LexRaidController` & `LexRaidServiceImpl`).
- **Database:** Microsoft SQL Server (`script_GPL_v2.sql` — 57 bảng, không thay đổi schema).
- **Frontend:** Vanilla HTML5, CSS3 Asset-Driven Fantasy Pixel Design System, ES6+ JS, Phaser 3.90.0 + Canvas 2D Fallback + Shared Animated `WorldEnvironment`.

---

## 2. TỔNG HỢP THÀNH TỰU ĐÃ XÁC MINH Ở P4-B.2 (`BROWSER PASS` + `STATIC PASS`)
1. **Asset Audit, Curation & Cursors (`STATIC PASS`):**
   - Kiểm toán toàn bộ `UI Extra` (`3,676` raw files -> `2,881` non-OS files) bằng `audit_ui_extra.py`; giữ `UI Extra/` & `UI Extra.zip` trong `.gitignore`, cách ly `428` tệp `Tiny Swords (Free Pack)` có trạng thái `LICENSE_PENDING`.
   - Sửa lỗi đảo ngược `cursor-action.png` <-> `cursor-forbidden.png`; ghép `13` sheet `9-slice`/`3-slice` chuẩn pixel tại `assets/ui/slices/`; trích xuất có chọn lọc `113` assets (`Kibyra` icons, `Kenney` Ancient 9-slice, `Sword Slash Pixel FX`, `Tiny Pixel FX Vol.1`, `Mira Forge`, `Tall Forest`, `Super Mountain Dusk`, `GothicVania Town`, `Pixel Art Waterfall` kèm credit bắt buộc, và 2 quái preview `Slime` & `Skeleton`).
2. **Asset-Driven Design System & Typography (`BROWSER PASS`):**
   - Nâng cấp `pixel-rpg.css` & `base.css`: viền gỗ/giấy cổ 9-slice thật (`paper-regular.png`, `wood-board.png`, `banner-scroll.png`, `paper-special.png`), ruy-băng 3-slice (`ribbon-*.png`), nút & skill slot phản hồi xúc giác.
   - `/app/typography` xác nhận Chromium load đủ `Lora`, `Pixelify Sans`, `Be Vietnam Pro`, `JetBrains Mono`, `Silkscreen`.
3. **Animated World Environments & Battle Engine (`BROWSER PASS`):**
   - `world-environment.js` vẽ bối cảnh động (rừng thẳm, núi hoàng hôn, thị trấn, thác nước) theo trang, tự tạm dừng khi ẩn tab và tôn trọng `prefers-reduced-motion`.
   - `battle-scene.js` tái cấu trúc theo Finite State Machine 10 trạng thái với object-pooled VFX (`poolSize: 12`), tích hợp `Warrior_Attack2.png`, phục hồi sạch khi reset giữa đòn (`resetSceneActors`) và đồng bộ 2 chiều với Canvas 2D Fallback (`?renderer=canvas`).
4. **Knight Skill Bar & Monster Preview (`BROWSER PASS`):**
   - Thanh 6 kỹ năng Hiệp sĩ Preview Mode + âm thanh mặc định tắt (`fx-slash-swing.wav`), không làm sai lệch công thức XP/Coins server (`LexRaidServiceImpl`).
   - Hỗ trợ xem trước `Verdant Slime` & `Cursed Skeleton` kèm chân dung front-facing đồng nhất.
   - Toàn bộ **9 viewports (`320x568` → `1920x1080`)** đạt `fit=true`, `tap=true`, `clear=true`, `attack=true`, **0 failures** (`chromium_p4b2_acceptance.js`).
5. **Untested Boundaries (`NOT TESTED`):**
   - Tương tác trình duyệt kết nối trực tiếp Spring Boot + SQL Server (`NOT TESTED` trong phiên này; chỉ kiểm tra frontend + Vercel Preview fallback).
