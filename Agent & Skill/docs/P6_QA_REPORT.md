# LEX RAID — P6 QA & DATABASE INTEGRATION REPORT

**Ngày kiểm định:** 2026-11-27  
**Nhánh:** `feature/p4b3-rpg-combat-learning`  
**Phạm vi kiểm định:** P6-A Database Baseline, P6-B Schema Audit, P6-C/D/E/F/G Backend Domain & Unit Tests (Frontend `demo-static` giữ nguyên từ P5.1 `5906f12`).

---

## 1. BẢNG PHÂN LOẠI BẰNG CHỨNG KIỂM THỬ (PHÂN BIỆT RÕ BỊ CHẶN VS ĐÃ PASS)

| Hạng mục | Công cụ / Lệnh | Kết quả thực tế | Phân loại chuẩn |
| :--- | :--- | :--- | :---: |
| **SQL Server Environment** | `Get-Service *SQL*`, `Test-NetConnection localhost -Port 1433`, `sqlcmd -S localhost -E` (`BypassSandbox: true`) | `MSSQL$SQL2022` **Running**, Port `1433` mở (`True`), DB `GamifiedLearningPlatform` **ONLINE** (`55` base tables, `20` stages, `14` bosses, `2,098` words) | **READ-ONLY AUDIT PASS** |
| **Spring Boot + SQL Server (`MainTests.contextLoads`)** | `mvn test -Dtest=MainTests` (`BypassSandbox: true`, profile `dev`) | `ErrorCode: 18456, SQLState: S0001 — Login failed for user 'sa'` (`SPRING_DATASOURCE_PASSWORD` chưa được set) | **FAIL / BLOCKED (CREDENTIAL)** |
| **SQL Server Migration Execution** | `docs/P6_DATABASE_AUDIT.md` DDL + Backfill | Chưa áp dụng DDL lên live DB theo quy tắc chờ người dùng phê duyệt | **NOT TESTED / PENDING APPROVAL** |
| **Java Backend Mockito Suite** | `mvn.cmd surefire:test -Dtest=*ServiceTest,*ProgressionTest,*GlobalLexiconTest,*CombatTest` | **`Tests run: 38, Failures: 0, Errors: 0, Skipped: 0`**, `BUILD SUCCESS` | **BACKEND UNIT PASS** |
| **Static Verification Suite** | `python src/main/resources/tools/test_p4b_verification.py` | `43/43 PASS` (`0` failed) | **STATIC PASS** |
| **Case Sensitivity & Asset Map** | `python src/main/resources/tools/check_case_sensitivity.py` | `544` files on disk, `134` Phaser URLs, `0` missing, `0` case mismatches | **STATIC PASS** |
| **HTTP Integration & Full-Stack E2E (DB + FE)** | N/A | Chờ cấp `SPRING_DATASOURCE_PASSWORD`, phê duyệt chạy migration DDL và phê duyệt JWT/HttpSession Principal trên `SecurityConfig` | **NOT TESTED** |
| **Vercel Production (`demo-static`)** | `https://gamified-learning-platform-sandy.vercel.app/` | Không thay đổi codebase frontend trong P6; bản `P5.1` (`5906f12`) giữ nguyên trạng thái hoạt động | **LIVE DEMO HEALTHY** |

---

## 2. CHI TIẾT CÁC SUITE BACKEND UNIT TEST (`38/38 PASS`)

1. **`AccountProfileServiceTest` (`3/3`):** Profile self-healing, `saveLoadout` từ chối `arcane_mage` trên DB trước migration & từ chối `userId` không tồn tại.
2. **`LexRaidGlobalLexiconTest` (`8/8`):** Global lexicon attacks, non-adjacent tiles, Topic +30% bonus, Mana cap 6, 2-letter whitelist (`GO`), saving event trước finalize, giữ nguyên HP Boss khi giải Core Word còn sống, và authoritative `nextBoard` round-trip.
3. **`LexRaidProgressionTest` (`4/4`):** Score tampering protection, duplicate finish idempotency, stage stars non-decreasing.
4. **`LexRaidP6CombatTest` (`2/2`):** Campaign stage-lock vs Practice allow, cross-user `SecurityException`, unlearned skill rejection, anti-spam `0 MP` max `1/turn`, duplicate `actionId` idempotency, `MULTI_HIT` server split `[11, 11, 10]` và wave advance `1 -> 2` không auto-win sớm.
5. **`ProgressionServiceTest` (`5/5`):** Catalog parity (`4` heroes, `27` skills, Archer/Lancer không có sẵn Ultimate), chống dùng SP bypass Stage Lock (SP giữ nguyên), **Mage permanent lock fix** (clear Stage 1 với 0 Topic -> replay với Topic mở Mage không cấp trùng SP Stage 1), Loadout enforcement (`<=4 Active`, đúng class, owned hero), Practice không cấp Campaign rewards.
6. **`MasteryServiceTest` (`2/2`):** Recall challenge ẩn đáp án, chấm đáp án theo `VocabularyWord.wordText`, chống farm lặp trên cùng 1 từ, không hạ cấp `MASTERED`, và `AccountServiceImpl` chặn unsafe fallback user #1.
7. **`QuizProgressionTest` (`5/5`) & `RpgProgressionServiceTest` (`9/9`):** Economy XP/Coin/Level giữ nguyên ổn định.

---

## 3. BLOCKERS CẦN NGƯỜI DÙNG PHÊ DUYỆT TRƯỚC KHI CHẠY P6-H/I FULL-STACK

1. **DB Dev Credential (`P6-A`):** Cấp biến môi trường `SPRING_DATASOURCE_PASSWORD` cho `sa` (hoặc tài khoản dev riêng) để `MainTests.contextLoads` và Spring integration tests chạy được trên SQL Server `localhost:1433`.
2. **Duyệt thực thi Migration T-SQL (`P6-B`):** Phê duyệt script tại `docs/P6_DATABASE_AUDIT.md` (tạo 6 bảng mới + nới `CK_user_loadouts_unit` & `CK_word_submit_events_word_type` + thêm cột combat state trên `raid_sessions`).
3. **Duyệt kiến trúc Authentication / Principal (`SecurityConfig`):** Chuyển các route `/api/v1/progression/**`, `/api/v1/lex-raid/**`, `/api/v1/mastery/**`, `/api/v1/account/**` từ `.permitAll()` sang xác thực JWT / HttpSession Principal trước khi public Backend hoặc chuyển Vercel sang `BACKEND_CONNECTED`.
