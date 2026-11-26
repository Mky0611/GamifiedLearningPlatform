# LEX RAID — P5 EXECUTION PLAN (PATH OF LEGENDS)

**Nhánh:** `feature/p4b3-rpg-combat-learning`  
**Cơ sở mã nguồn:** `870faac` (code) / `d0961d5` (docs)  
**Production URL:** `https://gamified-learning-platform-sandy.vercel.app/`

## 1. Kiến trúc & Phân công Vai trò
- **Master Agent:** Điều phối P5-A → P5-J, ownership file, checkpoints, regression & release gates. (Runtime không hỗ trợ native custom subagent cho pack cục bộ nên thực hiện tuần tự từng vai trò).
- **phaser-3-sprite-investigator + sprite-animation-engineer:** Chuẩn hóa frame metadata `Arcane Mage`, `PVFX Foundry` & `Mira Forge`; mở rộng FSM thành **10 Animation Profiles** (`MELEE_SLASH`, `DASH_STRIKE`, `PROJECTILE`, `CHANNEL_BEAM`, `GROUND_CAST`, `SKY_STRIKE`, `SHIELD_CAST`, `SELF_HEAL`, `MULTI_HIT`, `ULTIMATE`).
- **learning-combat-loop:** Thiết kế `Hero Registry` (`4` Hero playable: `warrior`, `archer`, `lancer`, `arcane_mage`; giữ `monk`/`rogue` ở backlog theo kiểm định license), `Skill Registry` (`22` kỹ năng hoạt động thực sự có progression/evolution Tier I→IV), `Unlock Registry` gắn kết Stage/Chapter/Boss + từ vựng học tập, và bảo tồn tài sản cũ (`warrior`, `archer`, `lancer` grandfathered).
- **pixel-ui-director + mobile-game-ux:** Nâng cấp `/app/account` thành **Character Hall & Spellbook** gồm 6 tab (`Heroes`, `Skill Tree`, `Spellbook`, `Loadout`, `Chapter Progress`, `Word Mastery`), tái sử dụng Byte Progression Kit (CC-BY-4.0) & Questwood UI ở cả Daylight/Moonlight và mobile.
- **sqlserver-backend-reviewer:** Kiểm tra SQL Server baseline (nếu offline giữ `NOT TESTED`), thống nhất **Core Word damage parity** giữa demo & `LexRaidServiceImpl`, tạo draft `docs/P5_BACKEND_DRAFT.md` cho Skill Ownership / Loadout / Unlock Authoritative Validation và viết Mockito progression/skill tests (không làm mất dữ liệu hay lộ endpoint chưa an toàn).
- **qa-release-guardian:** Mở rộng `chromium_p4b2_acceptance.js` cho Registry integrity, Hero selection/lock, Skill Tree/Evolution/Loadout, Training Preview, 10 animation profiles, playthrough thực tế + Victory + Unlock + Equip + trận tiếp theo, performance delta & live Vercel Production verification.
