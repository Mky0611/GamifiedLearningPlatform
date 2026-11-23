# LEX RAID — KIẾN TRÚC TỪ VỰNG CEFR VÀ IT ENGLISH (PHASE P2)

**Tài liệu:** P2 Vocabulary & IT English Architecture Design  
**Phiên bản:** 1.0.0 (Phase P2)  
**Nhánh Git:** `feature/p2-vocabulary-cefr-it`  
**Trạng thái:** HOÀN THIỆN THIẾT KẾ & HƯỚNG DẪN TRIỂN KHAI  

---

## 1. TỔNG QUAN VÀ MỤC TIÊU KIẾN TRÚC

Hệ thống học từ vựng tiếng Anh trong **Gamified Learning Platform — Lex Raid** được thiết kế để kết hợp giữa:
1. **Năng lực tiếng Anh chuẩn hóa theo Khung tham chiếu trình độ ngôn ngữ chung Châu Âu (CEFR)** từ A1 đến C2.
2. **Năng lực tiếng Anh chuyên ngành Công nghệ Thông tin (IT Professional English)** phân tầng theo lộ trình phát triển nghề nghiệp thực tế.
3. **Cơ chế Gamification đa kênh**: Học qua Thẻ ghi nhớ thông minh (**Volcard**), Thử thách trắc nghiệm (**Quiz**), và Chiến đấu diệt quái bằng từ vựng (**Lex Raid**).

---

## 2. NGUYÊN TẮC HAI TRỤC ĐỘC LẬP (TWO INDEPENDENT AXES)

Kiến trúc từ vựng của Lex Raid phân tách triệt để giữa năng lực ngôn ngữ tổng quát và độ phức tạp chuyên môn kỹ thuật. Tuyệt đối không quy đổi máy móc giữa hai trục này.

```
                      ▲ TRỤC 2: IT TIER (Chuyên môn Kỹ thuật)
                      │
           Specialist │   • polymorphism (C1)    • idempotency (C1)
                      │   • sharding (B2)        • backpressure (B2)
                      │
             Advanced │   • middleware (B1)      • latency (B2)
                      │   • transaction (B1)     • orchestration (C1)
                      │
         Practitioner │   • inheritance (B1)     • deployment (B1)
                      │   • endpoint (B1)        • container (A2/B1)
                      │
           Foundation │   • compile (B1)         • variable (B1)
                      │   • loop (A2)            • debug (A2)
                      └────────────────────────────────────────────►
                        A1     A2     B1     B2     C1     C2
                               TRỤC 1: CEFR LEVEL (Năng lực Ngôn ngữ)
```

### 2.1. Trục 1 — CEFR Level (Common European Framework of Reference)
* **Các cấp độ:** `A1`, `A2`, `B1`, `B2`, `C1`, `C2`, và `UNKNOWN` (hoặc `NULL`).
* **Đặc tính:** Gắn với từng nét nghĩa (*sense*) cụ thể của từ trong ngữ cảnh. Ví dụ, từ "host" ở nghĩa danh từ đời thường (*chủ nhà*) thuộc B1, nhưng ở nghĩa động từ kỹ thuật (*lưu trữ/chạy ứng dụng*) có thể thuộc B2.
* **Nguyên tắc căn cứ (Grounding Principle):**
  * Chỉ gán nhãn CEFR khi có đối chiếu với các nguồn học thuật uy tín: *Cambridge English Vocabulary Profile*, *Oxford 3000/5000*, hoặc bộ tiêu chí mô tả năng lực của *Council of Europe*.
  * **Tuyệt đối cấm đoán mò hoặc dùng LLM để tự gán nhãn hàng loạt không có nguồn.** Mọi từ chưa được đối chiếu thực tế với nguồn học thuật được giữ nguyên giá trị `NULL` hoặc đánh dấu `reviewStatus = 'DRAFT_NOT_VALIDATED'`.

### 2.2. Trục 2 — IT Tier & Domain (Phân tầng Kỹ thuật & Chuyên ngành)
* **4 Tiers chuyên môn:**
  1. `Foundation`: Khái niệm nhập môn, nền tảng điện toán và lập trình cơ bản (hardware, CPU, variable, condition, function).
  2. `Practitioner`: Kỹ năng lập trình thực tế, kiến trúc phần mềm thông dụng, API, cơ sở dữ liệu cơ bản, công cụ làm việc hàng ngày (endpoint, repository, commit, branch, JSON, query).
  3. `Advanced`: Hệ thống phân tán, container, bảo mật ứng dụng, CI/CD, tối ưu hóa hiệu năng, cloud computing (Kubernetes, JWT, thread pool, cache invalidation, load balancer).
  4. `Specialist`: Chuyên sâu kiến trúc vi dịch vụ quy mô lớn, mật mã học, phân tích tĩnh bảo mật, SRE/Observability cấp cao, AI/ML internal, kernel/runtimes (zero-trust, eventual consistency, raft consensus, AST traversal).

---

## 3. TAXONOMY 35 DOMAINS CÔNG NGHỆ THÔNG TIN

Toàn bộ hệ thống từ vựng chuyên ngành được tổ chức thành 35 chuyên mục kỹ thuật chuẩn hóa:

| STT | Domain Code | Domain Name (VN/EN) | Phạm vi thuật ngữ chính | IT Tier chủ đạo |
|:---:|:---|:---|:---|:---:|
| 01 | `IT_COMP_FUND` | Computer Fundamentals | CPU, RAM, storage, firmware, bit, byte, peripheral, bus, encoding | Foundation |
| 02 | `IT_OS` | Operating Systems | Process, thread, scheduler, kernel, filesystem, permission, syscall | Foundation - Practitioner |
| 03 | `IT_NETWORKS` | Computer Networks | IP, subnet, DNS, routing, TCP, UDP, HTTP, TLS, proxy, firewall | Foundation - Practitioner |
| 04 | `IT_PROG_FUND` | Programming Fundamentals | Variable, constant, condition, loop, function, scope, recursion | Foundation |
| 05 | `IT_OOP` | Object-Oriented Programming | Class, object, inheritance, interface, abstraction, polymorphism | Foundation - Practitioner |
| 06 | `IT_FP` | Functional Programming | Lambda, pure function, immutability, closure, higher-order function | Practitioner - Advanced |
| 07 | `IT_DSA` | Data Structures & Algorithms | Array, linked list, stack, queue, hash table, tree, graph, sort, BFS | Foundation - Advanced |
| 08 | `IT_RUNTIMES` | Languages & Runtimes | JVM, JIT, compiler, bytecode, garbage collection, heap, stack | Practitioner - Advanced |
| 09 | `IT_FE_CORE` | Frontend Core | DOM, CSS, flexbox, grid, viewport, rendering, event bubbling | Foundation - Practitioner |
| 10 | `IT_FE_FRAMEWORKS` | Frontend Frameworks | Component, virtual DOM, state, hook, props, hydration, SPA | Practitioner - Advanced |
| 11 | `IT_A11Y_PERF` | Web Quality & Accessibility | Semantics, ARIA, focus, tap target, color contrast, LCP, CLS | Practitioner - Advanced |
| 12 | `IT_BACKEND_API` | Backend & REST API | Endpoint, controller, service, repository, DTO, middleware, status code | Practitioner |
| 13 | `IT_AUTH_SEC` | Authentication & App Security | JWT, OAuth2, session, hashing, encryption, XSS, CSRF, SQL injection | Practitioner - Advanced |
| 14 | `IT_DB_RELATIONAL` | Relational Databases | Schema, table, foreign key, index, JOIN, transaction, ACID, view | Practitioner - Advanced |
| 15 | `IT_DB_NOSQL` | NoSQL, Search & Cache | Document store, key-value, Redis, cache invalidation, vector DB | Practitioner - Advanced |
| 16 | `IT_SW_DESIGN` | Software Design & Patterns | SOLID, design pattern, MVC, dependency injection, clean architecture | Practitioner - Advanced |
| 17 | `IT_DISTRIBUTED` | Distributed Systems | Microservices, message queue, idempotency, event sourcing, circuit breaker | Advanced - Specialist |
| 18 | `IT_DEVOPS` | DevOps & CI/CD | Pipeline, artifact, build, automated deploy, feature flag, rollback | Practitioner - Advanced |
| 19 | `IT_CONTAINERS` | Containers & Orchestration | Docker, container, image, Dockerfile, Kubernetes, pod, cluster, Helm | Practitioner - Advanced |
| 20 | `IT_CLOUD` | Cloud & Infrastructure | IaaS, PaaS, serverless, VPC, IAM, load balancer, CDN, object storage | Practitioner - Advanced |
| 21 | `IT_OBSERVABILITY` | Observability & SRE | Logging, tracing, metrics, OpenTelemetry, alert, SLO, SLA, postmortem | Advanced - Specialist |
| 22 | `IT_TESTING_QA` | Quality Assurance & Testing | Unit test, integration test, mock, stub, fixture, regression, e2e | Practitioner - Advanced |
| 23 | `IT_BUILD_TOOLS` | Build Tools & Package Mgmt | Maven, Gradle, npm, pnpm, dependency, bundler, linter, lockfile | Foundation - Practitioner |
| 24 | `IT_VCS` | Version Control & Git | Commit, rebase, merge, cherry-pick, conflict, branch, PR, blame | Foundation - Practitioner |
| 25 | `IT_MOBILE` | Mobile App Development | Activity, widget, intent, lifecycle, responsive layout, platform channel | Practitioner - Advanced |
| 26 | `IT_GAME_DEV` | Game Development & Graphics | Sprite, spritesheet, animation loop, collision, tilemap, canvas, tween | Practitioner - Advanced |
| 27 | `IT_AI_ML` | Artificial Intelligence & ML | Neural network, model, inference, transformer, token, RAG, embedding | Advanced - Specialist |
| 28 | `IT_DATA_ENG` | Data Engineering | ETL, ELT, pipeline, data warehouse, data lakehouse, streaming, batch | Advanced - Specialist |
| 29 | `IT_CYBERSECURITY` | Advanced Cybersecurity | Zero-trust, threat modeling, vulnerability, pentest, CVE, exploit | Advanced - Specialist |
| 30 | `IT_PERFORMANCE` | Performance & Profiling | Throughput, latency, profiling, memory leak, CPU flamegraph, bottleneck | Advanced - Specialist |
| 31 | `IT_UX_PRODUCT` | Product & UX Design | User story, persona, wireframe, usability test, user flow, journey | Foundation - Practitioner |
| 32 | `IT_COLLAB_MGMT` | IT Collaboration & Agile | Scrum, sprint, backlog, kanban, epic, spike, retrospective, criteria | Foundation - Practitioner |
| 33 | `IT_IAC` | Infrastructure as Code | Terraform, Ansible, state file, declarative, config drift, GitOps | Advanced - Specialist |
| 34 | `IT_EMBEDDED_IOT` | Embedded Systems & IoT | Sensor, microcontroller, firmware, actuator, UART, SPI, real-time | Advanced - Specialist |
| 35 | `IT_DOMAIN_FINTECH` | Specialized Industry IT | Ledger, payment gateway, settlement, PCI-DSS, compliance, KYC | Advanced - Specialist |

---

## 4. QUY TẮC PHÂN LOẠI WORD BOARD VS FLASHCARD/QUIZ

Trong Lex Raid, gameplay yêu cầu ghép các ô chữ cái đơn (single-letter tiles) trên bàn cờ kích thước $5 \times 5$. Do đó, việc xác định tính hợp lệ của từ trên bàn cờ (*boardEligible*) là cực kỳ nghiêm ngặt:

### 4.1. Điều kiện Board-Eligible (`boardEligible = true`)
1. **Từ đơn (Single-word lemma):** Tuyệt đối không chứa khoảng trắng (` `), dấu gạch nối (`-`), hoặc dấu chấm (`.`).
2. **Ký tự chuẩn:** 100% ký tự thuộc bảng chữ cái tiếng Anh `[A-Za-z]`.
3. **Độ dài hợp lệ:** Tối thiểu 3 ký tự, tối đa 10 ký tự ($3 \le \text{length} \le 10$).
   * Từ $< 3$ ký tự (ví dụ: `to`, `in`, `go`, `if`) quá ngắn, dễ gây spam điểm hoặc không mang giá trị học thuật cao trong trận đấu.
   * Từ $> 10$ ký tự (ví dụ: `congratulation`, `infrastructure`) chiếm quá nhiều diện tích bàn cờ $5 \times 5$ (25 ô), gây bế tắc ghép từ.
4. **Ngôn ngữ:** Chỉ các từ tiếng Anh (`language_code = 'en'`). Tuyệt đối loại bỏ các từ tiếng Nhật hoặc ngoại ngữ khác khỏi bàn cờ trận đấu tiếng Anh.

### 4.2. Xử lý Multi-Word Phrases & Flashcards (`boardEligible = false`)
* Các thuật ngữ kỹ thuật nhiều từ (như `continuous integration`, `pull request`, `dependency injection`, `single page application`) mang giá trị học tập rất cao cho kỹ sư IT nhưng **không thể ghép trên bàn cờ chữ cái đơn**.
* Các thuật ngữ này được phân luồng tự động vào:
  * **Volcard (Flashcards):** Hiển thị đầy đủ định nghĩa tiếng Anh, giải nghĩa tiếng Việt, ví dụ ứng dụng thực tế và phát âm.
  * **Quiz System:** Tạo câu hỏi trắc nghiệm ngữ nghĩa, điền khuyết và nối từ.

---

## 5. THIẾT KẾ THUẬT TOÁN TẠO BÀN CỜ LEX RAID CÂN BẰNG (BALANCED BOARD GENERATION)

### 5.1. Vấn đề của thuật toán cũ
Thuật toán trước đây sinh các ô ngẫu nhiên không có core word bằng phân phối đều:
$$\text{char} = 'A' + \text{random}(26)$$
Phân phối đều cho xác suất xuất hiện nguyên âm (A, E, I, O, U) chỉ là $5/26 \approx 19.2\%$. Trong khi đó, tiếng Anh chuẩn yêu cầu tỷ lệ nguyên âm khoảng $38\% - 42\%$. Việc thiếu nguyên âm (vowel starvation) khiến người chơi không thể ghép được từ vựng hợp lệ.

### 5.2. Giải thuật phân phối trọng số mới (Letter Frequency Distribution)
Thuật toán mới trong `LexRaidServiceImpl.java` áp dụng quy trình 4 bước:

```
[BƯỚC 1: Lấy Core Word & 1-2 Topic Words]
  ├── Core Word của stage (ví dụ: "COMPILE")
  └── 1 hoặc 2 từ vựng hợp lệ từ vocabulary set (ví dụ: "CODE", "JAVA")
         │
         ▼
[BƯỚC 2: Đặt các chữ cái vào vị trí ưu tiên gần trung tâm bàn cờ]
  ├── Tính khoảng cách Manhattan đến tâm bàn cờ (centerRow, centerCol)
  └── Đảm bảo ít nhất 1-2 từ có thể ghép được từ các chữ cái trên bàn
         │
         ▼
[BƯỚC 3: Điền các ô trống còn lại bằng Phân phối chữ cái tiếng Anh chuẩn]
  ├── Nguyên âm (A, E, I, O, U): Tỷ lệ trọng số ~40%
  ├── Phụ âm thông dụng (T, N, S, R, H, L, D, C, M, P): Tỷ lệ trọng số ~45%
  └── Phụ âm hiếm (B, F, G, V, W, K, X, Y, Z, Q, J): Tỷ lệ trọng số ~15%
         │
         ▼
[BƯỚC 4: Xáo trộn vị trí có kiểm soát (Controlled Shuffle)]
  └── Bàn cờ đảm bảo tính giải đố công bằng và giàu nguyên âm.
```

---

## 6. ĐỀ XUẤT LƯỢC ĐỒ CƠ SỞ DỮ LIỆU MỞ RỘNG (NON-BREAKING MIGRATION)

Tuân thủ nghiêm ngặt nguyên tắc **KHÔNG thay đổi cấu trúc bảng đang chạy** và **KHÔNG chạy DDL migrate trực tiếp**, thiết kế mở rộng được chuẩn bị sẵn dưới dạng migration script độc lập (`V2__vocabulary_senses_cefr_it.sql`) để dùng khi hệ thống tiến hành nâng cấp có kế hoạch.

### 6.1. Bảng `vocabulary_word_senses` (Sense-level storage)
```sql
CREATE TABLE vocabulary_word_senses (
    sense_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    word_id BIGINT NOT NULL,
    language_code VARCHAR(10) DEFAULT 'en' NOT NULL,
    sense_key VARCHAR(50) NOT NULL,
    definition_en NVARCHAR(500) NULL,
    meaning_vi NVARCHAR(500) NOT NULL,
    part_of_speech VARCHAR(50) NULL,
    cefr_level VARCHAR(10) NULL,           -- A1, A2, B1, B2, C1, C2 hoặc NULL
    cefr_source_uri NVARCHAR(500) NULL,     -- URI dẫn chứng học thuật
    cefr_review_status VARCHAR(30) DEFAULT 'DRAFT_NOT_VALIDATED',
    it_domain VARCHAR(50) NULL,            -- Mã chuẩn từ 35 domains
    it_tier VARCHAR(30) NULL,              -- Foundation, Practitioner, Advanced, Specialist
    is_board_eligible BIT DEFAULT 1 NOT NULL,
    source_uri NVARCHAR(500) NULL,
    license VARCHAR(100) NULL,
    review_status VARCHAR(30) DEFAULT 'DRAFT_NOT_VALIDATED' NOT NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL,
    CONSTRAINT FK_word_senses_word FOREIGN KEY (word_id) 
        REFERENCES vocabulary_words(word_id) ON DELETE CASCADE
);
```

### 6.2. Tính tương thích ngược với Code Java hiện tại
* Code Java hiện tại (`VocabularyWord`, `VocabularySet`, `VocabularyTopic`) tiếp tục đọc và ghi vào bảng `vocabulary_words` mà không phụ thuộc vào bảng mới.
* Các thuộc tính như `itDomain`, `itTier`, `boardEligible` trong DTO được xử lý thông minh qua logic service (fallback & derivation) để đảm bảo API frontend nhận được dữ liệu đầy đủ mà DB không bị thay đổi đột ngột.

---

## 7. QUY TRÌNH IMPORT DỮ LIỆU & KIỂM TRA CHẶT CHẼ (DRY RUN PIPELINE)

Quy trình nhập dữ liệu từ vựng được thực hiện thông qua công cụ CLI `vocabulary_importer.py` với chế độ kiểm tra **DRY RUN** nghiêm ngặt:

1. **Kiểm tra cú pháp & Mã hóa:** Đảm bảo file JSON hợp lệ, mã hóa UTF-8 không lỗi.
2. **Kiểm tra trường bắt buộc:** `id`, `languageCode`, `lemma`, `normalizedText`, `partOfSpeech`, `meaningVi`.
3. **Chuẩn hóa Từ loại (POS Normalization):**
   * `n.` / `noun` $\rightarrow$ `noun`
   * `v.` / `verb` $\rightarrow$ `verb`
   * `adj.` / `adjective` $\rightarrow$ `adjective`
   * `adv.` / `adverb` $\rightarrow$ `adverb`
   * `prep.` $\rightarrow$ `preposition`, `conj.` $\rightarrow$ `conjunction`
4. **Kiểm tra CEFR Level:** Chỉ chấp nhận `A1`, `A2`, `B1`, `B2`, `C1`, `C2` hoặc `null`. Nếu có giá trị khác, cảnh báo và tự động chuyển về `null`.
5. **Kiểm tra IT Domain & Tier:** Đối chiếu với danh mục 35 domains và 4 tiers chuẩn.
6. **Kiểm tra Board-Eligibility:** Tự động phát hiện khoảng trắng, ký tự đặc biệt và độ dài từ để gắn cờ chính xác.
7. **Phát hiện trùng lặp (Duplicate Detection):** Phát hiện trùng lặp giữa các mục nhập mới và giữa mục nhập mới với 2.098 từ hiện có trong cơ sở dữ liệu.
8. **Báo cáo JSON thống kê:** Xuất báo cáo chi tiết về số lượng hợp lệ, số lượng bị từ chối, lý do từ chối và tỷ lệ CEFR coverage mà KHÔNG ghi đè dữ liệu thật.
