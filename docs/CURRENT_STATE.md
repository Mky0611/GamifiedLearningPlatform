# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-28  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát hành:** `feature/p4b3-rpg-combat-learning`  
**Trạng thái hiện tại:** **PHASE P6.1 COMPLETE (LOCAL FULL-STACK VERIFIED) — `41/41` JAVA UNIT PASS, `2/2` LIVE SQL SERVER + JWT HTTP IT PASS (`GamifiedLearningPlatform_P6_Test`), `43/43` STATIC PASS, LOCAL CHROMIUM E2E `BACKEND_CONNECTED` RE-LOGIN PASS; VERCEL PROD GIỮ AN TOÀN `demo-static` (`5906f12`)**

---

## 1. HIỆN TRẠNG DATABASE, AUTH & BACKEND P6.1
- **Database Backup & Test Clone (`MSSQL$SQL2022`, `localhost:1433`):**
  - Backup gốc: `GamifiedLearningPlatform_P6_PreMigration.bak` (`COPY_ONLY`, `RESTORE VERIFYONLY` PASS). Database gốc `GamifiedLearningPlatform` được bảo toàn nguyên vẹn (chưa chạy DDL).
  - Database test: `GamifiedLearningPlatform_P6_Test` đã chạy sạch kịch bản `Up -> Rollback -> Up -> Idempotent Up` từ `docs/sql/P6_1_MIGRATION_UP.sql` & `docs/sql/P6_1_MIGRATION_ROLLBACK.sql`.
  - Kết nối JDBC xác thực bằng login test-only `lexraid_p6_test` (`db_owner` chỉ trên DB test, password env tạm trong bộ nhớ); `MainTests` & `P61SqlServerIntegrationTest` PASS hoàn toàn.
- **JWT Authentication & Ownership (`org.example.security.*`):**
  - `JwtTokenService` (HS256), `JwtAuthenticationFilter`, `RestAuthenticationEntryPoint`, `SecurityPrincipalUtils` + `SecurityConfig` (`STATELESS`).
  - Bảo vệ toàn bộ `/api/v1/progression/**`, `/api/v1/mastery/**`, `/api/v1/account/{profile,loadout}`, `/api/v1/lex-raid/sessions/**`, `/api/v1/quiz/sessions/**` (`401` khi thiếu/sai/hết hạn JWT; `403` khi cross-user `userId` hoặc cross-session).
- **P6.1 Integrity & Single Combat Store:**
  - `RaidSession.java` là nguồn lưu combat state duy nhất (`waveIndex`, `totalWaves`, `playMode`, `heroCode`, `playerHp`, `playerMaxHp`, `bossStatusesJson`, `skillCooldownsJson`, `encounterRosterJson` 5 wave), bỏ trùng lặp `CombatMeta` ở `GameSession.metadataJson`.
  - Fix transaction lock (`findByIdForUpdate`), Practice không tăng `clearCount`, tách Topic vs Global words trong `ProgressionServiceImpl`, `MasteryRecallChallenge` có UUID + expiry 5 phút + single-use, anti-tamper `/sync` `currentRound`, và chuẩn hóa `CK_board_snapshots_reason_code`.

## 2. HIỆN TRẠNG FRONTEND & PRODUCTION
- **Local `BACKEND_CONNECTED` (`api.js`, `progression-store.js`, `account.js`, `minigame.js`):** Tự động đính kèm `Authorization: Bearer <token>` khi đăng nhập có JWT, đồng bộ Character Hall / Skill Tree / Loadout / 5-Wave Battle / Word Mastery Recall với SQL Server, đã verify đăng nhập lại trên Chrome context mới vẫn còn `2 SP` và `knight_slash Lv 2`.
- **Vercel Production (`https://gamified-learning-platform-sandy.vercel.app/`):** Giữ nguyên trạng thái `demo-static` (`5906f12`) lành mạnh (`verify_live_prod.js` PASS), không public backend hoặc SQL Server ra Internet.
