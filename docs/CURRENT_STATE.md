# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-27  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát hành:** `feature/p4b3-rpg-combat-learning` (verified code SHA `5906f12`)  
**Trạng thái hiện tại:** **PHASE P5.1 — PROGRESSION INTEGRITY VERIFIED (`29/29` BACKEND UNIT PASS, `43/43` STATIC PASS, `0` CONTRAST ISSUES, `27/27` SKILLS & `0` CHROMIUM FAILURES; SQL SERVER `NOT TESTED`)**

---

## 1. TỔNG QUAN HỆ THỐNG (KIẾN TRÚC & RANH GIỚI DEMO VS BACKEND)
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security. Thống nhất `LexRaidServiceImpl.guessCoreWord` để không reset Boss HP về `baseHp` khi qua Core Word tiếp theo nếu Boss vẫn còn HP (`> 0`), giữ nguyên authoritative `BoardSnapshot`, và giữ `arcane_mage` ở phạm vi **Demo Progression only** trong `AccountServiceImpl.saveLoadout` (không cấp lén trên DB khi chưa có schema ownership/learning migration).
- **Database & Migration Draft:** Microsoft SQL Server (`script_GPL_v2.sql`) giữ nguyên, **chưa** chạy migration mới. Tài liệu thiết kế DDL/API P5 tại `docs/P5_BACKEND_DRAFT.md` đã chuẩn hóa sang SQL Server locking (`WITH (UPDLOCK, ROWLOCK)` / JPA `@Lock(LockModeType.PESSIMISTIC_WRITE)`), bổ sung `user_milestone_rewards` và script Rollback T-SQL tường minh.
- **Frontend (`demo-static`):** Vanilla HTML5, CSS3 Pixel RPG + Semantic Daylight/Moonlight/Combat (`theme.css`), ES6+ (`raid-registry.js`, `progression-store.js`, `minigame.js`, `account.js`), Phaser 3.90.0 + Canvas 2D Fallback.

---

## 2. THÀNH TỰU PHASE P5.1 ĐÃ NGHIỆM THU
1. **Progression Integrity (`progression-store.js`, `raid-registry.js`):**
   - Tách độc lập milestone `stage_first_clear_*`, `skill_unlock_*`, `hero_unlock_*` (`evaluateHeroUnlocks`); clear Stage 1 không đủ Topic word vẫn mở khóa Stage 2 nhưng chưa mở Arcane Mage, và replay đủ Topic word sẽ mở Arcane Mage mà **không** cấp trùng SP.
   - Bỏ toàn bộ bypass SP cho `STAGE_CLEAR` / `LEARNING`, gỡ miễn phí `celestial_arrow` / `dragon_lance` ở starter profile, giữ non-destructive cho `localStorage` cũ, bảo vệ trạng thái `MASTERED` khi replay điểm thấp.
2. **Combat Loadout, Stage Lock & Multi-Hit (`minigame.js`):**
   - Bỏ fallback raw registry trong `castKnightSkill()`, kiểm tra strict Hero unlock, `skillLevels >= 1`, prerequisite, membership Loadout/Spell deck, Mana, Cooldown, Class & trạng thái trận; chặn truy cập `?stage=3` khi `LOCKED`.
   - Chia tick sát thương thật cho mọi kỹ năng `hitCount > 1` (`MULTI_HIT` / `Channel Beam` / `Dash Strike` / `Dragon Lance`) kèm dọn timer khi kết thúc trận.
3. **Word Mastery Integrity (`account.js`, `account.css`):**
   - Tách `pronunciationPlays` (chỉ tăng khi bấm `"Nghe phát âm"`) khỏi `uniqueReviewedWords` / `masteredWords` (chỉ tăng qua thử thách Recall đúng và dedupe theo từ duy nhất), giữ contrast `0` issues ở Daylight/Moonlight.
4. **Untested Boundaries (`NOT TESTED`):**
   - Tích hợp Spring Boot + Microsoft SQL Server live (`MainTests.contextLoads` cần SQL Server bật cục bộ; chưa triển khai P5 DB persistence).
