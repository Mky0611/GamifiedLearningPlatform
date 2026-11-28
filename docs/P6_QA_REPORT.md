# LEX RAID — P6 & P6.1 QA & FULL-STACK INTEGRATION REPORT

**Ngày kiểm định:** 2026-11-28  
**Nhánh:** `feature/p4b3-rpg-combat-learning`  
**Phạm vi kiểm định:** P6.1 Database Backup/Clone, T-SQL Up/Rollback Migration trên `GamifiedLearningPlatform_P6_Test`, HS256 JWT + Ownership, P6.1 Integrity Fixes, Java Unit Suite, Live SQL Server + HTTP Integration Test, và Local Full-Stack Chromium E2E (`BACKEND_CONNECTED`).

---

## 1. BẢNG BẰNG CHỨNG KIỂM THỬ THỰC TẾ P6.1

| Hạng mục | Lệnh / Phạm vi | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **1. DB Backup & Isolated Test DB** | `BACKUP DATABASE [GamifiedLearningPlatform] WITH COPY_ONLY`, `RESTORE VERIFYONLY`, `RESTORE DATABASE [GamifiedLearningPlatform_P6_Test]` | Backup thành công (`1674` pages), Verifyvalid, DB test `GamifiedLearningPlatform_P6_Test` `ONLINE`; DB gốc `GamifiedLearningPlatform` không bị sửa đổi | **PASS** |
| **2. T-SQL Up / Rollback / Idempotent** | `docs/sql/P6_1_MIGRATION_UP.sql` & `docs/sql/P6_1_MIGRATION_ROLLBACK.sql` chạy tuần tự `Up -> Rollback -> Up -> Up` trên `GamifiedLearningPlatform_P6_Test` | Exit code `0`; backfill `1` wallet, `3` starter heroes, `15` starter/shared skills, `3` loadouts; bảo toàn `159` `raid_sessions`, `20` `stages`, `1` `user_word_mastery`; nới & rollback đối xứng `CK_user_loadouts_unit` & `CK_word_submit_events_word_type` | **PASS (TEST DB)** |
| **3. Java Unit + JWT Suite** | `mvn.cmd surefire:test -Dtest=*ServiceTest,*ProgressionTest,*GlobalLexiconTest,*CombatTest,JwtSecurityTest` | **`Tests run: 41, Failures: 0, Errors: 0, Skipped: 0`**, `BUILD SUCCESS` | **BACKEND UNIT PASS** |
| **4. Live SQL Server & HTTP Auth IT** | `mvn.cmd surefire:test -Dtest=MainTests,P61SqlServerIntegrationTest` kết nối JDBC tới `GamifiedLearningPlatform_P6_Test` (`SQL Server 16.0`) | **`Tests run: 2, Failures: 0, Errors: 0, Skipped: 0`**, `BUILD SUCCESS` (BCrypt JWT `register/login`, `401` missing/invalid/expired, `403` cross-user/session/challenge, 4-thread concurrent wallet init `UPDLOCK`, Skill upgrade/Loadout, Practice non-`clearCount`, 5-wave roster + `cast-skill` `actionId` idempotency, `/sync` anti-tamper, Recall challenge UUID + expiry + single-use) | **SQL + HTTP IT PASS** |
| **5. Static & Case Sensitivity** | `python test_p4b_verification.py ; python check_case_sensitivity.py` | **`43/43 PASS`**, `544` files on disk, `134` Phaser URLs, `0` missing, `0` case mismatches | **STATIC PASS** |
| **6. Local Full-Stack Chromium E2E** | Spring Boot JAR (`127.0.0.1:18080` + `GamifiedLearningPlatform_P6_Test`) + Chrome 2 isolated contexts (`verify_p61_fullstack_e2e.js`) | Context 1 đăng ký -> nâng `knight_slash` Lv2 (`3 SP -> 2 SP`) -> vào trận Stage 1 (`Compiler Gate`, `backendConnected: true`); Context 2 profile mới hoàn toàn đăng nhập lại -> đọc trực tiếp SQL Server xác nhận `2 SP`, `knightSlashLv: 2`, `modeLabel: BACKEND_CONNECTED (SQL Server)` | **LOCAL FULL-STACK E2E PASS** |
| **7. Vercel Production (`demo-static`)** | `node verify_live_prod.js` trên `https://gamified-learning-platform-sandy.vercel.app/` | HTTP `200`, `codeCommit: 5906f12`, `failedAssets: 0`, Stage Guard & Demo Hall hoạt động bình thường | **LIVE DEMO HEALTHY** |

---

## 2. LỖI THẬT ĐƯỢC PHÁT HIỆN & SỬA TRONG QUÁ TRÌNH CHẠY SQL SERVER THỰC TẾ
1. **`LazyInitializationException` trên `User.role` khi ký JWT (`JwtTokenService`):** Do `User.role` `LAZY` + `open-in-view=false`, `JwtTokenService.generateTokenWithTtl` đã được bảo vệ bằng `Hibernate.isInitialized(user.getRole())` với fallback `"USER"`.
2. **`CK_board_snapshots_reason_code` conflict trên `GamifiedLearningPlatform_P6_Test`:** `LexRaidServiceImpl` trước đây ghi `"SESSION_START"`, `"POST_CORE_GUESS"`, `"FINISH_SYNC"`, `"MANUAL_SYNC"` trái với constraint SQL Server (`'MANUAL_SAVE'`, `'POST_BOSS_ACTION'`, `'POST_REFILL'`, `'POST_SUBMIT'`, `'INITIAL'`). Đã chuẩn hóa toàn bộ về `'INITIAL'`, `'POST_SUBMIT'` và `'MANUAL_SAVE'`.
3. **Duplication combat state & `totalWordsFound` leak:** Đã bỏ `CombatMeta` khỏi `GameSession.metadataJson`, chuyển 100% về cột của `dbo.raid_sessions`, và loại bỏ fallback lấy Global Words cộng dồn vào điều kiện mở Topic Hero/Skill.

---

## 3. LƯU Ý PHẠM VI & BLOCKER TRIỂN KHAI PUBLIC
1. Migration mới chỉ thực thi và nghiệm thu trên bản test `GamifiedLearningPlatform_P6_Test`; database gốc `GamifiedLearningPlatform` được giữ nguyên vẹn chờ quyết định nâng cấp chính thức.
2. Spring Boot + SQL Server mới chạy nghiệm thu trên máy local (`127.0.0.1`), chưa có server/cloud hosting cho Backend nên Vercel Production vẫn giữ ở chế độ `demo-static` (không tuyên bố Production Backend live).
3. Trong môi trường dev/local của người dùng, nếu kết nối DB bằng tài khoản `sa` hoặc login riêng, cần set các biến môi trường `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` và `APP_JWT_SECRET`.
