# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-27  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát hành:** `feature/p4b3-rpg-combat-learning` (Frontend Prod `demo-static`: `5906f12`; P6 Backend Domain implemented & Mockito verified)  
**Trạng thái hiện tại:** **PHASE P6 (BACKEND DOMAIN & AUDIT COMPLETE) — `38/38` JAVA MOCKITO PASS, `43/43` STATIC PASS, SQL SERVER SCHEMA AUDITED READ-ONLY (`55` tables); LIVE `MainTests` BLOCKED ON `ErrorCode 18456` (`SPRING_DATASOURCE_PASSWORD` UNSET) & PENDING DDL/AUTH APPROVAL**

---

## 1. HIỆN TRẠNG TÍCH HỢP P6 (BACKEND VS DEMO FRONTEND)
- **Database Environment (`localhost:1433`):** `MSSQL$SQL2022` **Running**, Port `1433` **Open**, DB `GamifiedLearningPlatform` **ONLINE** (`55` base tables, `20` stages thực `1..6,8..21`, `14` bosses, `2,098` words). Kết nối read-only `sqlcmd -E` thành công, nhưng JDBC profile `dev` thất bại `Login failed for user 'sa'` (`ErrorCode 18456`) do thiếu env `SPRING_DATASOURCE_PASSWORD`.
- **P6 Backend Domain (Implemented & Unit-Tested `38/38 PASS`):**
  - `RpgCatalogRegistry`: Single source of truth cho `4` Hero, `27` Skills `Lv1–3`, Unlock/Upgrade rules, Loadout `4+1`.
  - `ProgressionServiceImpl` (`/api/v1/progression/**`): Tách `user_progression_wallets` + `PESSIMISTIC_WRITE` (`WITH (UPDLOCK, ROWLOCK)`), `hero_ownership`, `user_skill_unlocks`, `user_hero_loadouts`, `user_milestone_rewards` (tách riêng `stage_first_clear_*`, `skill_unlock_*`, `hero_unlock_arcane_mage`).
  - `LexRaidServiceImpl` (`/api/v1/lex-raid/sessions/{id}/cast-skill`): Ownership check, Stage Lock check theo `CAMPAIGN` vs `PRACTICE`, anti-spam `0 MP` (`MAX_ZERO_MANA_CASTS_PER_TURN = 1`), `actionId` idempotency (`SkillCastEvent`), multi-hit split & wave advancement, Core Word damage không auto-win sớm.
  - `MasteryServiceImpl` (`/api/v1/mastery/**`): Server-verified Recall Quiz (không gửi đáp án, tách TTS, không hạ cấp `MASTERED`).
  - `AccountServiceImpl`: Đã gỡ unsafe fallback `findAll().stream().findFirst()`.
- **Frontend (`demo-static` trên Vercel Production):** Vẫn phục vụ bản `P5.1` (`5906f12`) ổn định tại `https://gamified-learning-platform-sandy.vercel.app/` — chưa bật `BACKEND_CONNECTED` cho tới khi Auth Principal & DB Migration được duyệt và kiểm thử full-stack thực tế.
