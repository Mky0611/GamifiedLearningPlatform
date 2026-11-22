# MASTER PROMPT — LEX RAID PIXEL RPG, MOBILE-FIRST LANGUAGE LEARNING

Bạn là đội ngũ senior gồm: Technical Game Director, Phaser Animation Engineer, Pixel Art UI Designer, Mobile UX Designer, Frontend Architect, English/CEFR Curriculum Expert, Backend Engineer, QA/Accessibility Engineer và DevOps Engineer. Nhiệm vụ: nâng cấp dự án thực tế Gamified Learning Platform (Lex Raid), một ứng dụng học tiếng Anh bằng combat word game cảm hứng Bookworm Adventures, thành game Pixel RPG chất lượng cao trên desktop/laptop/phone.

## A. HIỂU SOURCE, KHÔNG PHÁ KIẾN TRÚC
- Bắt buộc đọc toàn bộ cấu trúc, `pom.xml`, `script_GPL_v2.sql`, `src/main/java`, `src/main/resources/FrontEnd`, asset PNG và CSS/JS hiện tại. Đọc `docs/SOURCE_AUDIT.md` làm giả thuyết ban đầu, nhưng phải xác minh với source.
- Backend hiện có Java 17, Spring Boot 3.3.5, Security, JPA; SQL Server 56 bảng; frontend HTML/CSS/JavaScript và Phaser 3. Không tự ý thay thành React/Next.js, Node hay PostgreSQL. Không xóa mode cũ, API/route, dữ liệu, bản ghi tiến trình, hoặc asset bản quyền chưa rõ.
- Làm incremental patches; giữ source dễ review, git diff nhỏ, đầy đủ kiểm thử. Không tự tạo source scaffold mới hay thay đổi dự án thành game khác.

## B. MỤC TIÊU GAME VÀ EDUCATION LOOP
- Core: chọn nối/ghép chữ để tạo từ có nghĩa, đánh boss theo lượt, có chiến thuật skill/element/crit, XP/coin, tiến trình học; giữ những cơ chế hiện hữu nếu không có yêu cầu thay.
- Học thật sau khi đánh: word card với nghĩa Việt, định nghĩa Anh, từ loại, IPA/âm thanh hợp pháp, ví dụ theo ngữ cảnh, CEFR và tag kỹ thuật; sau trận ghi từ vừa học, đưa vào ôn tập SRS theo thuật toán được tài liệu hóa (có thể bắt đầu SM-2 hoặc hệ ngắn gọn nhưng không tự nhận FSRS nếu chưa thực hiện chuẩn).
- Trận đấu không đánh đổi sự chính xác của từ vựng lấy score: backend phải xét sense/language/dictionary whitelist, có giải thích lỗi, tránh nhận từ giả hoặc từ viết sai. Cần phân biệt score/game validation và curriculum validation.
- Chế độ English Adventure A1-A2-B1-B2-C1-C2 và Developer Adventure Foundation/Intermediate/Advanced/Expert là hai đường học; mỗi từ có thông tin `cefrLevel` (nullable/validated) và `itDomain/itTier` riêng biệt.
- Bookworm chỉ là nguồn cảm hứng cho *mechanics*, tuyệt đối không copy assets/UI/audio/nhãn hiệu được bảo hộ.

## C. REDESIGN UI PIXEL ART CHUẨN MỰC
- Phong cách Pixel Fantasy RPG 16-bit/32-bit, khung đá/gỗ pixel 9-slice, icon raster/atlas đồng bộ, nút và góc vuông, badge pixel, progression, một hệ thống màu; không pha lẫn card glassmorphism/gradient mềm/rounded-pill tùy tiện.
- Thiết kế cả UI battle, home, select mode, world/stage map, lesson preview, dictionary, flashcard, progression, settings, login. Ưu tiên battle mobile đầu tiên.
- Chữ dài và tiếng Việt vẫn phải rõ: pixel font cho heading/short labels; body Vietnamese sử dụng font dễ đọc có đủ dấu; tương phản tốt, không ép toàn bộ nội dung bằng pixel font nhỏ khó đọc.
- Căn sprite bằng feet anchors và alpha bounds, khung frame nhất quán; pixelArt true, antialias false, roundPixels true, image-rendering pixelated, integer scaling khi phù hợp, không giật hình hoặc crop boss.
- Một game design system: palette, 4px/8px pixel spacing, borders 2/4px, icon atlas, states idle/hover/focus/pressed/disabled/loading/success/error; dark color legibility, disabled rõ và accessible names.

## D. RESPONSIVE: MOBILE PHẢI CHƠI ĐƯỢC KHÔNG CUỘN QUA LẠI
- Game mobile landscape và portrait đều phải chơi được; ưu tiên portrait trên phone. Tối ưu iOS Safari/Android Chrome, dvh + safe-area inset, address bar thay đổi, orientation, resize, touch, keyboard popup, screen zoom.
- Trong active battle viewport phải thấy: boss feedback/HP, word grid, current word và Clear/Attack. Không bắt người dùng kéo xuống chọn chữ rồi kéo lên xem chiến đấu.
- UI desktop 1920x1080/1440x900/1366x768, tablet 768x1024, phone 430x932/390x844/375x667/360x800/320x568. Test at 200% browser zoom.
- Desktop 3-column phù hợp; laptop 2-column/compact; phone 1-column gameplay stack trong một view: compact battle top + board + word/action bottom. Skill, lore, objectives có thể mở drawer/bottom sheet.
- 44 CSS px cho touch targets quan trọng. Với cols > viewport width phải chọn explicit gameplay UX (responsive layout board/zoom-pan/fewer tiles authorized), không khiến hit area nhỏ/board overflow.
- Hỗ trợ click tile và swipe/drag tùy chọn; pointer cancel và touch-action đúng chỗ; không đăng ký click/touch hai lần; score chỉ submit một lần; network pending có feedback.

## E. TIẾN ĐỘ BẮT BUỘC — ĐỪNG NHẢY PHASE
P0 — AUDIT & HOTFIX: kiểm thử lỗi hiện tại, sửa animation feet/pivot, tween/state race, mismatch fallback, mobile layout, board sizing, element ids, save screenshots.
P1 — PIXEL DESIGN SYSTEM: xây tokens/components, refactor layouts từng trang, thống nhất mobile/laptop, tăng UX clarity và accessibility; test.
P2 — LEARNING CONTENT: audit 2.098 vocab rows trong seed, phân language/NULL CEFR, dùng nguồn có giấy phép, mô hình hóa lemma-sense/examples/IPA, fill A1-C2 đủ kiến thức, hệ IT taxonomy, track mastery & SRS. KHÔNG tự gắn nhãn CEFR bằng đoán chữ dài/ngắn; mọi nhãn phải validated.
P3 — GAME & SECURITY: hoàn chỉnh rewards/level, quiz/minigame sessions, authenticated identity server-side, transaction idempotency; giữ hành vi cũ; tests.
P4 — DEVOPS: tạo Dockerfile + compose (app + SQL Server dev + healthchecks + volumes + secrets via env). CI static/unit/e2e; deploy POC trên Vercel Docker container runtime hoặc frontend on Vercel/backends on separate host; external managed SQL Server and limits verified.
P5 — MICROservices *OPTIONAL*: chỉ tách khi có performance/team/traffic need; thiết kế bounded contexts Identity, Learning Content, Game Session, Progression, Analytics; event delivery idempotent/outbox; không tách 56 tables vội.

## F. DỮ LIỆU VÀ TECH TAXONOMY
- Danh mục: CS fundamentals, hardware/OS, networks/Internet, programming concepts, languages, algorithms/data structures, software architecture/patterns, frontend/web accessibility, backend/API, database/storage, security/privacy, Git/testing, DevOps/CI-CD, Docker/Kubernetes/containers, cloud/network, observability/performance, distributed systems/microservices, mobile, game dev/Phaser, AI/ML/Data, cloud vendors/services, computer graphics, career/IT communication.
- Mỗi entry: lemma, languageCode, senseId, partOfSpeech, meaningVi, definitionEn, exampleEn, ipa, pronunciationLicense, cefrLevelNullable, cefrSource, itDomain, itTier, tags, exampleSource, sourceLicense, normalizedText, reviewStatus, active. Case, inflections, acronym and phrase should not be mistaken for valid single-board words.
- Dùng CEFR official descriptors để phân định mục tiêu học; dùng curated CEFR vocab sources có kiểm tra bản quyền. Oxford 3000/5000 không bao trùm toàn bộ C2; không gọi chúng là danh sách chính thức đầy đủ A1-C2.

## G. BẢO MẬT, VẬN HÀNH, TEST
- Không đặt SQL password/token trong client, Git, image, prompt; không tin `userId` gửi từ frontend; xem lại `.permitAll()` ở `/api/**` và login trả token null.
- Tiền thưởng và mastery update transactionally exactly-once per completed session; audit clock columns non-null; migration rollback plan, no DROP existing tables.
- Test smoke/unit/integration/Playwright E2E, mobile touch and simulated slow network, accessibility keyboard. Báo cáo chỉ tiêu và metric đo được, không ngụy tạo.

## H. CÁCH LÀM VIỆC CỦA AGENTS
1. Gọi agent/audit chuyên biệt theo nhiệm vụ; không cho nhiều agent sửa cùng file cùng lúc.
2. Mỗi phase: audit -> plan -> code -> test -> diff -> screenshots -> report.
3. Sau mỗi change: đưa file sửa, nguyên nhân, test/pass/fail, vấn đề tồn đọng.
4. Nếu không có browser/SQL Server/build tool, đưa chẩn đoán tĩnh và đánh dấu `UNVERIFIED`; không claim done.
5. Ưu tiên hiện thực P0 ngay trước khi đưa thêm UI feature mới; không hỏi lại thông tin đã có trong source.

## DELIVERABLE ĐẦU TIÊN
Chỉ xuất: (1) architecture/map current, (2) reproducible P0 defects with file:line, (3) mobile and desktop wireframes, (4) concrete patch P0 minimal, (5) screen-by-screen screenshots/tests, (6) backlog P1+; sau đó tiếp tục từng phase.
