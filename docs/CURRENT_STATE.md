# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-26  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát hành:** `feature/p4b3-rpg-combat-learning` (verified code SHA `95bdfa5`)  
**Trạng thái hiện tại:** **PHASE P5 — PATH OF LEGENDS VERIFIED (`28/28` BACKEND UNIT PASS, `43/43` STATIC PASS, `0` CONTRAST ISSUES, `0` CHROMIUM FAILURES; SQL SERVER `NOT TESTED`)**

---

## 1. TỔNG QUAN HỆ THỐNG (KIẾN TRÚC & RANH GIỚI DEMO VS BACKEND)
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security. Thống nhất công thức Core Word damage (`computeCoreWordDamage >= 55` tại `LexRaidBalanceConfig`), giữ nguyên authoritative `BoardSnapshot` và bổ sung kiểm tra `userStageProgressRepository` cho `arcane_mage` trong `AccountServiceImpl.saveLoadout`.
- **Database & Migration Draft:** Microsoft SQL Server (`script_GPL_v2.sql`) giữ nguyên, **chưa** chạy migration mới. Thiết kế bảng `hero_ownership`, `user_skill_unlocks`, `user_hero_loadouts`, `skill_cast_events` và quy tắc validation nằm tại `docs/P5_BACKEND_DRAFT.md`.
- **Frontend (`demo-static`):** Vanilla HTML5, CSS3 Pixel RPG + Semantic Daylight/Moonlight/Combat (`theme.css`), ES6+ (`raid-registry.js`, `progression-store.js`, `minigame.js`, `account.js`), Phaser 3.90.0 (selective boot + lazy VFX + 10 Animation Profiles) + Canvas 2D Fallback.

---

## 2. THÀNH TỰU PHASE P5 ĐÃ NGHIỆM THU
1. **4 Playable Heroes & License Hygiene (`BROWSER PASS` + `STATIC PASS`):**
   - `warrior`, `archer`, `lancer` (bảo toàn starter), `arcane_mage` (NightCat Works OÜ `210x180`, mở khóa qua Stage 1 + Topic word); giữ `monk` (`LICENSE_PENDING`) và `rogue` (`32x32` mismatch) ở backlog.
   - Đã curate `63` asset mới vào `assets/{units/arcane_mage,effects/vfx/p5,ui/progression,ui/questwood}` với attribution đầy đủ (`Byte Progression Kit` CC-BY-4.0, PVFX CC0, Mira Forge, Questwood).
2. **27 Kỹ Năng Tiến Hóa Lv 1–3 & 10 Animation Profiles (`BROWSER PASS`):**
   - Kiểm chứng cả 10 profile (`MELEE_SLASH`, `DASH_STRIKE`, `PROJECTILE`, `CHANNEL_BEAM`, `GROUND_CAST`, `SKY_STRIKE`, `SHIELD_CAST`, `SELF_HEAL`, `MULTI_HIT`, `ULTIMATE`), Loadout `4 Active + 1 Ultimate`, giữ `archer` và `arcane_mage` đứng tầm xa (`lastHeroMovedX = 0`), và Canvas 2D fallback parity.
3. **Character Hall 6 Tabs & Training Dummy (`BROWSER PASS` + `0` Contrast Issues):**
   - `/app/account` nâng cấp thành 6 tab (`Heroes & Avatar`, `Skill Tree`, `Spellbook & Dummy`, `Loadout (4+1)`, `Chapter Map`, `Word Mastery`), `issues=0` ở cả Daylight và Moonlight trên mọi tab.
4. **Untested Boundaries (`NOT TESTED`):**
   - Tích hợp Spring Boot + Microsoft SQL Server live (`MainTests.contextLoads` cần SQL Server bật cục bộ; chưa triển khai P5 DB persistence).
