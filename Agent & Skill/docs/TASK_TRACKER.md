# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 24/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh hiện tại:** `feature/p4-vercel-preview`  

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN

| Giai đoạn | Nội dung trọng tâm | Trạng thái | Đánh giá & Tiến độ |
| :---: | :--- | :---: | :--- |
| **SEC** | **Security Post-Audit & Credential Sanitization** | **COMPLETED / PENDING LOCAL ROTATION** | Mã nguồn sạch 0 secrets; test scanner 13/13 pass; chờ user đổi pass local DB. |
| **P0** | **Animation, Gameplay UI, Mobile Responsive, Runtime QA** | **CODE COMPLETE** | Sửa dứt điểm 9 lỗi animation/battle; mobile 320px no-scroll; script Playwright sẵn sàng. |
| **P1** | **Pixel RPG Design System & Java 21 / Spring Boot 4.2** | **CODE COMPLETE** | Java 21 LTS & Spring Boot 4.2.0; Design system tokens; minigame & home pixel hóa. |
| **P2** | **Vocabulary Engine, CEFR A1–C2, IT Taxonomy** | **COMPLETE** | Audit DB UTF-16; 2 trục độc lập; Pipeline importer DRY RUN; Thuật toán sinh bàn cờ cân bằng; Volcard & Quiz UI polish. |
| **P3** | **RPG Progression, XP, Coins, Level, Sessions & Profile** | **POST-AUDIT ACCEPTANCE READY** | Động cơ cấp độ O(1); Toàn vẹn dữ liệu thưởng (Verified Score); Chống hack điểm/thắng giả; Khóa bi quan chống double reward & mất XP; Chống tráo đề/đáp án Quiz; Sửa toán học thanh EXP; UI 4 trạng thái; 20/20 Unit Tests PASS. |
| **P4-A** | **Vercel Preview Deployment (Frontend Static + Fallbacks)** | **COMPLETED (VERIFIED LIVE)** | Triển khai production Vercel thành công; routing 11 pages; probe 16/16 endpoints đạt HTTP 200 OK; không catch-all `/api/**` (404); audit 348 assets pass 0 lỗi; direct refresh hoạt động mượt mà. |
| **P4-B** | **Docker, CI/CD, Deployment** | `TODO` | Dockerfile, docker-compose, script build tự động, môi trường test. |
| **P5** | **Microservices Evaluation** | `TODO` | Đánh giá kiến trúc mở rộng và tối ưu hóa hệ thống. |

---

## 2. CHI TIẾT CÁC TASKS GIAI ĐOẠN P4-A (VERCEL PREVIEW DEPLOYMENT)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu & Kết quả |
| :--- | :--- | :---: | :--- | :--- |
| **P4-A1** | Cấu hình Vercel Routing & Clean URLs | **DONE (PASS)** | `FrontEnd/vercel.json`, `vercel.json` | Cấu hình 11 routes chính; map `/ui/assets/**` sang `/assets/**`; không dùng catch-all; API trả về 404 sạch sẽ. |
| **P4-A2** | Kiểm toán Phân biệt Hoa/Thường (Linux Case Sensitivity) | **DONE (PASS)** | `check_case_sensitivity.py` | Kiểm tra toàn bộ 348 file trên đĩa và 129 URLs animation động trong `raid-config.js`: 0 missing assets, 0 case mismatches. |
| **P4-A3** | Nâng cấp Giao diện Chế độ Xem trước (Preview Mode) | **DONE (PASS)** | `minigame.js`, `home.js`, `account.js`, `auth.html` | Hiển thị rõ chip và banner Preview Mode; giải thích rõ dữ liệu demo chưa đồng bộ DB; không tạo phần thưởng ảo. |
| **P4-A4** | Tài liệu Hướng dẫn Triển khai Vercel | **DONE (PASS)** | `docs/VERCEL_DEPLOYMENT.md` | Tài liệu nghiệm thu chi tiết, bảng routes, hướng dẫn và kết quả probe trực tiếp. |
| **P4-A5** | Triển khai Production & Probe Trực tiếp | **DONE (PASS)** | `tools/probe_deployment.py` | Triển khai thành công tới `https://gamified-learning-platform-sandy.vercel.app`; probe 16/16 endpoints đạt HTTP 200 OK (0 fail); kiểm tra route `/api/**` trả về 404 chuẩn. |

---

## 2. CHI TIẾT CÁC TASKS GIAI ĐOẠN P3 (RPG PROGRESSION & INTEGRITY FIXES)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu & Kết quả |
| :--- | :--- | :---: | :--- | :--- |
| **P3-A** | Kiểm toán Entities & Luồng Dữ liệu Tiến trình | **DONE (PASS)** | `docs/P3_PROGRESSION_DESIGN.md` | Phát hiện 4 nguyên nhân gốc: user chưa từng được cộng thưởng, double reward khi gọi /finish, clear_count tăng liên tục, hạ sao kỷ lục cũ. |
| **P3-B** | Động cơ Cấp độ $O(1)$ & Phần thưởng Cân bằng | **DONE (PASS)** | `RpgProgressionService.java`, `RpgProgressionServiceImpl.java`, `RpgProgressionServiceTest.java` | Công thức bậc 2: $L = \max(1, \lfloor (1 + \sqrt{1 + X / 12.5}) / 2 \rfloor)$. Bắt đầu L1 tại 0 XP. Ngưỡng L1..L10 chuẩn xác. Hỗ trợ multi-level jump. Test 9/9 PASS. |
| **P3-C** | Toàn vẹn Dữ liệu Thưởng & Chống Hack Điểm | **DONE (PASS)** | `LexRaidServiceImpl.java`, `CoreWordGuessEventRepository.java`, `LexRaidProgressionTest.java` | Backend tính `verifiedScore` từ event log thật (`WordSubmitEvent` + `CoreWordGuessEvent`); kiểm tra thắng chỉ khi boss bị hạ gục thật; từ chối mọi điểm số hoặc kết quả WON giả mạo từ client. Test 4/4 PASS. |
| **P3-D** | Khóa Bi quan & Idempotency Tuyệt đối | **DONE (PASS)** | `GameSessionRepository.java`, `UserRepository.java`, `RpgProgressionServiceImpl.java` | Bổ sung `findByIdForUpdate` với `PESSIMISTIC_WRITE` trên GameSession và User; session `COMPLETED` là bất biến; tuần tự hóa cộng thưởng không mất cập nhật XP giữa các session đồng thời. |
| **P3-E** | Kiểm tra Tính hợp lệ Đề & Đáp án Quiz | **DONE (PASS)** | `QuizServiceImpl.java`, `QuizProgressionTest.java` | Ngăn chặn tráo đáp án từ câu hỏi khác (`selected.question == question`), từ chối câu hỏi không thuộc bộ đề session, chặn nộp trùng câu hỏi, chặn nộp vào session đã kết thúc. Test 5/5 PASS. |
| **P3-F** | Sửa Toán học Thanh EXP & Player Profile | **DONE (PASS)** | `account.js`, `account.html`, `AccountProfileServiceTest.java`, `RpgProgressionServiceTest.java` | Tính `levelSpan = xpInLevel + xpNeeded`; hiển thị `${xpInLevel}/${levelSpan} XP` và `Còn ${xpNeeded} XP (${progressPercent}%)`; test tại 150 XP chuẩn xác 50/200 XP (25.0%). Test 2/2 PASS. |
| **P3-G** | Hoàn thiện Giao diện Kết quả Trận đấu (Battle Result UI) | **DONE (PASS)** | `minigame.js`, `minigame.html` | Không hiển thị số XP/Coins ảo trước khi server xác nhận; phân tách 4 trạng thái rõ ràng: PENDING ("Đang xác nhận..."), CONFIRMED (+XP, +Gold xác thực từ server), ERROR ("Chưa lưu (Lỗi mạng)", 0 fake reward), PREVIEW ("Chế độ xem trước"). |

---

## 3. CHI TIẾT CÁC TASKS GIAI ĐOẠN P2 (VOCABULARY ENGINE & IT ENGLISH)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu & Kết quả |
| :--- | :--- | :---: | :--- | :--- |
| **P2-A** | Kiểm toán toàn diện Cơ sở Dữ liệu từ vựng | **DONE (PASS)** | `tools/audit_vocabulary_db.py`, `docs/P2_VOCABULARY_AUDIT.md` | Đọc trực tiếp UTF-16 LE: 2.098 từ, 17 sets, 9 topics, 6 stages. Phân tích 75 từ có CEFR vs 2.023 NULL, 2 từ JP, 94 từ không hợp lệ cho 1-tile board. |
| **P2-B** | Thiết kế Kiến trúc Hai trục Độc lập (CEFR & IT) | **DONE (PASS)** | `docs/P2_VOCABULARY_DESIGN.md`, `db/migration/V2__vocabulary_senses_cefr_it.sql` | Xác lập 2 trục độc lập: CEFR A1-C2 + UNKNOWN (bắt buộc nguồn học thuật) và 4 Tiers IT (35 domains). Lược đồ mở rộng non-breaking `vocabulary_word_senses`. |
| **P2-C** | Pipeline Nhập dữ liệu Từ vựng & Chế độ DRY RUN | **DONE (PASS)** | `tools/vocabulary_importer.py`, `tools/test_vocabulary_importer.py` | Kiểm tra UTF-8, mã ngôn ngữ `en`, chuẩn hóa POS, kiểm tra board-eligibility, phát hiện trùng lặp với 2.098 từ seed. Unit test 3/3 pass. Report dry-run 26 items: 22 board-eligible, 4 flashcard-only. |
| **P2-D** | Nâng cấp Backend Service Volcard & Quiz | **DONE (PASS)** | `VolcardService.java`, `VolcardServiceImpl.java`, `VolcardController.java`, `VocabularyWordDto.java` | Bổ sung lọc `cefrLevel` và `search` tùy chọn. Chuẩn hóa POS, fallback định nghĩa an toàn. Bổ sung `itDomain`, `itTier`, `boardEligible` trong DTO mà không làm thay đổi DB schema. |
| **P2-E** | Tối ưu hóa Thuật toán Bàn cờ Lex Raid (`buildBoard`) | **DONE (PASS)** | `LexRaidServiceImpl.java` | Khắc phục thiếu nguyên âm (vowel starvation): Áp dụng phân phối tần suất chữ cái tiếng Anh chuẩn (~42% nguyên âm). Đảm bảo xuất hiện core word và 1-2 topic words phụ gần tâm. Lọc bỏ từ tiếng Nhật và từ không hợp lệ khỏi combat runtime. |
| **P2-F** | Hoàn thiện Giao diện Volcard & Quiz (Pixel RPG) | **DONE (PASS)** | `volcard.html`, `volcard.js`, `volcard.css`, `quiz.html`, `api.js` | Tích hợp thanh lọc CEFR pills, ô tìm kiếm thời gian thực, nút phát âm Web Speech API TTS kèm disclaimer, huy hiệu Pixel RPG, nút Trước/Sau/Lật thẻ mượt mà. |

---

## 3. CHI TIẾT CÁC TASKS GIAI ĐOẠN P1 (PIXEL RPG & JAVA 21)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu & Kết quả |
| :--- | :--- | :---: | :--- | :--- |
| **P1-T1** | Nâng cấp Java 21 LTS & Spring Boot 4.2.0 | **BUILD PASS** | `pom.xml`, `effective-pom.xml` | Maven compiler 3.16.0 release 21, Lombok 1.18.36, HikariCP + SQL Server context load 5.8s. |
| **P1-T2** | Xác minh Starter Web (`web` vs `webmvc`) | **STATIC PASS** | `pom.xml`, dependency:tree | `spring-boot-starter-web:4.2.0` chuẩn, tích hợp Tomcat 11.0.27 + Spring WebMVC. |
| **P1-T3** | API Regression Smoke Test | **STATIC REVIEW** | `src/main/java/.../controller` | Khảo sát và đối chiếu contracts các endpoint Auth, Account, Home, Lex Raid, Quiz, Volcard. |
| **P1-T4** | Thiết lập Design Tokens Pixel RPG | **STATIC PASS** | `pixel-rpg.css`, `DESIGN_SYSTEM.md` | Bộ tokens chuẩn Wood, Gold, Parchment, Combat Indicators; các classes `.pixel-panel`, `.pixel-btn`, `.pixel-bar`. |
| **P1-T5** | Pixel hóa Đấu trường Lex Raid & Word Board | **CODE PASS** | `minigame.css`, `minigame.html` | Đấu trường retro, thanh máu pixel, bảng chữ gỗ parchment. |
| **P1-T6** | Pixel hóa Trang chủ (Home) & Navigation | **CODE PASS** | `home.css`, `base.css`, `home.html` | Main navigation khung gỗ viền vàng, pixel chips, pixel quick stats, pixel game cards. |
| **P1-T7** | Tối ưu hóa Touch Target nút Clear / Attack (320px) | **CODE PASS** | `minigame.css` | Nâng min-height từ 32px lên 40px trong CSS (chuẩn mobile tap target >=40px). |
| **P1-T8** | Kiểm toán trực quan 8 Viewports | **CODE READY** | 8 viewports chuẩn | Kịch bản Playwright 8 viewports đã hoàn thiện. |

---

## 4. CHI TIẾT CÁC TASKS BẢO MẬT (SECURITY AUDIT)

| Mã Task | Tên nhiệm vụ | Trạng thái | Tập tin liên quan | Tiêu chí nghiệm thu |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-T1** | Khử mật khẩu bản rõ trong config | **DONE** | `application.properties` | Đổi sang `${SPRING_DATASOURCE_PASSWORD:}` không còn mật khẩu cứng. |
| **SEC-T2** | Tạo template môi trường an toàn | **DONE** | `.env.example`, `application.properties.example` | Cung cấp tài liệu biến môi trường chuẩn cho team dev. |
| **SEC-T3** | Cải tiến scanner & bổ sung Unit Tests | **DONE** | `git_security_scanner.py`, `test_security_scanner.py` | 13/13 tests pass; bắt đúng ${VAR:default}, URI credentials, cloud tokens. |
| **SEC-T4** | Tách cấu hình Dev vs. Production SQL Server | **DONE** | `application-dev.properties`, `application-prod.properties` | Prod dùng `encrypt=true`, `trustServerCertificate=false`, user `glp_app`. |
| **SEC-T5** | Kiểm thử kết nối Spring Boot qua Env Var | **DONE** | `src/test/java/.../MainTests.java` | Spring Boot kết nối thành công 57 bảng qua `SPRING_DATASOURCE_PASSWORD`. |
| **SEC-T6** | Đổi mật khẩu SQL Server local (Rotation) | `PENDING USER ACTION` | SQL Server Host / SSMS | Người dùng chạy lệnh `ALTER LOGIN` đổi mật khẩu tài khoản `sa`. |
| **SEC-T7** | Xử lý Commit cũ trong Git History | `PENDING APPROVAL` | GitHub / Git DAG | Chờ quyết định của người dùng về việc force-push rewrite hay giữ nguyên. |
