# Từ vựng English A1–C2 + IT Vocabulary — Taxonomy, nguồn và cấu trúc dữ liệu

## Thực trạng
Seed hiện tại có 2.098 `vocabulary_words` rows, chỉ 75 có CEFR tag B1/B2/C1, 2.023 NULL, nhiều English và một số Japanese. Tránh coi tất cả là từ tiếng Anh hoặc là đã kiểm định CEFR. `vocabulary_sets` hiện liên kết `vocabulary_topics`; `word_examples` / `user_word_mastery` tồn tại.

## Hai trục phân loại độc lập
1. `cefrLevel`: A1, A2, B1, B2, C1, C2 hoặc NULL/UNVERIFIED. Gắn theo sense/ngữ cảnh và nguồn học thuật được phép tái sử dụng. CEFR là mô tả năng lực, không có một danh sách từ duy nhất đầy đủ cho tất cả cấp.
2. `itTier`: Foundation, Practitioner, Advanced, Specialist (hoặc Beginner/Intermediate/Advanced/Expert) cho khóa nghề nghiệp; không được map máy móc sang CEFR.

## Nhóm CEFR đề xuất (coverage blueprint, không phải list từ đầy đủ)
- A1: greetings, personal info, family, home, food, colors, days, routine, numbers, simple verbs.
- A2: travel, shopping, directions, workplace basics, hobbies, city, health everyday, comparative forms.
- B1: opinions, experience, problem-solving, study, workplace, news, environment, technology general.
- B2: academic discussion, complex tasks, argumentation, analysis, social issues, abstract vocabulary.
- C1: nuanced register, collocations, research, workplace negotiation, precise discourse.
- C2: idioms/register/pragmatics/rare senses and advanced discourse; cannot be sourced by extrapolating Oxford 5000.

## IT domain taxonomy (mở rộng theo chương)
01. Computer fundamentals: hardware, CPU, RAM, storage, firmware, peripherals, bits, encoding, Unicode.
02. Operating systems: process, thread, scheduler, kernel, filesystem, permission, syscall, virtual memory.
03. Networks: IP, subnet, DNS, routing, TCP, UDP, HTTP, TLS, proxy, firewall, bandwidth, latency.
04. Programming fundamentals: variable, constant, condition, loop, function, scope, type, recursion.
05. OOP: class, object, inheritance, interface, abstraction, encapsulation, polymorphism, generics.
06. Functional programming: lambda, pure function, immutability, composition, higher-order function.
07. Algorithms and data structures: array, linked list, stack, queue, hash table, tree, graph, BFS, DFS, dynamic programming, complexity.
08. Languages and runtimes: Java, JavaScript, TypeScript, Python, C, C++, C#, Go, Rust, Kotlin, Dart, Swift, Ruby, PHP, JVM, JIT, compiler, interpreter.
09. Frontend core: HTML, CSS, DOM, event, layout, flexbox, grid, viewport, responsive design, browser rendering.
10. Frontend frameworks: React, Vue, Angular, Svelte, Next.js, Nuxt, component, hydration, state management.
11. Web quality/a11y: semantics, ARIA, focus, keyboard support, color contrast, web performance, Core Web Vitals.
12. API/backend: endpoint, REST, GraphQL, gRPC, middleware, controller, service, repository, DTO, HTTP status.
13. Auth/security: session, JWT, OAuth, OpenID Connect, authentication, authorization, XSS, CSRF, SQL injection, hashing, encryption, threat modeling.
14. Databases relational: schema, table, row, column, primary key, foreign key, transaction, index, JOIN, query, normalization, ACID.
15. Databases NoSQL/search/cache: document store, Redis, key-value, search index, vector DB, cache invalidation.
16. Software design: SOLID, cohesion, coupling, dependency injection, design pattern, MVC, CQRS, DDD, clean architecture, hexagonal architecture.
17. Distributed systems: microservice, API gateway, service discovery, message queue, retry, idempotency, eventual consistency, outbox, saga, circuit breaker.
18. DevOps: Git, branching, pull request, pipeline, CI/CD, artifact, deployment, environment, feature flag, release.
19. Containers/orchestration: Docker, image, container, Dockerfile, Docker Compose, registry, volume, Kubernetes, pod, cluster, Helm.
20. Cloud & infrastructure: IaaS, PaaS, serverless, CDN, load balancer, object storage, IAM, VPC, DNS, edge computing.
21. Observability/SRE: logging, tracing, metrics, OpenTelemetry, Grafana, alerting, SLI, SLO, uptime.
22. Quality/testing: unit test, integration test, end-to-end, mocking, regression, smoke, load, fuzzing, static analysis.
23. Build/tools: Maven, Gradle, npm, pnpm, bundling, transpilation, linting, formatting, package manager.
24. Version control/workflows: commit, rebase, merge, cherry-pick, issue, milestone, semantic versioning.
25. Mobile: Flutter, Android, iOS, widget, platform channel, responsive layout, offline-first, lifecycle.
26. Game development: frame, spritesheet, atlas, sprite pivot, collision, state machine, tween, tilemap, animation loop, canvas, Phaser.
27. AI/ML: dataset, feature, train/test split, inference, neural network, transformer, fine-tuning, embedding, RAG, agent, tool calling, hallucination.
28. Data engineering: ETL, ELT, warehouse, lakehouse, batch, stream, data pipeline, data governance.
29. Cybersecurity advanced: zero trust, least privilege, pentesting, secrets rotation, SBOM, supply chain, vulnerability.
30. Performance: profiling, bottleneck, throughput, concurrency, memory leak, caching, rate limiting, latency.
31. UX/product: user story, prototype, wireframe, usability test, accessibility, product analytics, A/B testing.
32. Collaboration/IT communication: bug report, reproduce, acceptance criteria, backlog, sprint, incident report, postmortem.
33. Infrastructure as Code: Terraform, Ansible, configuration drift, immutable infrastructure, GitOps.
34. Blockchain/embedded/IoT (optional branches): smart contract, consensus, sensor, microcontroller, real-time system.
35. Industry specializations: fintech, healthcare IT, e-commerce, edtech, gaming, ERP, GIS (optional domain packs).

## Curriculum implementation
- Seed from existing 2.098 entries, group by languageCode+normalized lemma+sense; detect duplicates and invalid unicode/typos. Verify referenced terms and licensing before imports.
- Each lesson: 12–20 target senses, 3–5 sample sentences, knowledge check, spaced reviews; bosses can test recognized words but must not introduce 200 new words per battle.
- Store sourceUri, provenance, license, editorialStatus (DRAFT/REVIEWED/APPROVED), reviewer and version. Do not mass-label CEFR using LLM guesses alone; use AI suggestions as drafts then review.
- Audio source per item must have appropriate rights; if unavailable, use browser TTS with clear speech-quality disclaimer.

## Schema extension proposal (migration only; not drop)
```
vocabulary_word_senses(id, vocabulary_word_id, language_code, sense_key,
  definition_en, meaning_vi, cefr_level NULL, cefr_source_uri NULL,
  cefr_review_status, it_domain NULL, it_tier NULL, source_uri, license, status)
word_examples(id, word_sense_id, example_en, translation_vi, source_uri, license)
review_schedule(user_id, word_sense_id, due_at, stability_or_ease, interval_days,
  review_count, last_result, ...)
```
First map the 56-table schema and existing `word_examples`/`user_word_mastery` before creating any new table or column; favor extending current models rather than duplicating.

## Useful sources
- Oxford 3000/5000 CEFR (Oxford 3000 A1–B2, extra 2000 B2–C1); not exhaustive C2 and licensing must be checked.
- Cambridge English Vocabulary Profile/English Profile A1–C2 for sense-level progression (https://englishprofile.org/?menu=english-vocabulary-profile), subject to licensing.
- Council of Europe CEFR descriptors for skill progression.
- MDN Web Glossary for terminology and authoritative definitions.
- Microsoft Learn, Java docs, Docker docs, OWASP, CNCF glossary, official language docs; paraphrase and cite, avoid bulk copyrighted copy.
