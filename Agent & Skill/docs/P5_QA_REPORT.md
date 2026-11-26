# LEX RAID — P5 QA & VISUAL ACCEPTANCE REPORT (PATH OF LEGENDS)

**Ngày kiểm định:** 2026-11-26  
**Nhánh:** `feature/p4b3-rpg-combat-learning`  
**Chế độ frontend công khai:** `demo-static` (`Demo Progression` trên trình duyệt; SQL Server offline chưa áp dụng P5 schema)

---

## 1. BẢNG PHÂN LOẠI BẰNG CHỨNG KIỂM THỬ

| Hạng mục | Lệnh / Công cụ | Kết quả thực tế | Trạng thái chuẩn |
| :--- | :--- | :--- | :---: |
| **Java Mockito Unit Tests** | `mvn test -Dtest=*ServiceTest,*ProgressionTest,*GlobalLexiconTest` | `Tests run: 28, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` | **BACKEND UNIT PASS** |
| **Spring Boot + SQL Server (`MainTests`)** | `mvn -q test` (`MainTests.contextLoads`) | Lỗi kết nối TCP `localhost:1433` (SQL Server offline cục bộ); draft P5 DDL chưa chạy lên live DB | **NOT TESTED** |
| **Static Verification Suite** | `python src/main/resources/tools/test_p4b_verification.py` | `STATIC CHECKS: 43 \| STATIC PASS: 43 \| FAILED: 0` | **STATIC PASS** |
| **Case Sensitivity & Asset Map** | `python src/main/resources/tools/check_case_sensitivity.py` | `544` file trên đĩa, `134` Phaser URLs, `0` missing, `0` case mismatches | **STATIC PASS** |
| **Technical SEO Verification** | `node src/main/resources/tools/verify_seo.js` | `11 routes + sitemap + robots + 404 + JSON-LD + og:image all valid` | **HTTP / SEO PASS** |
| **Scoped Contrast Audit** | `node src/main/resources/tools/audit_contrast_chromium.js` | `issues=0` trên cả 9 trang + 6 tab `/app/account` ở `daylight` & `moonlight` + `minigame [combat]` | **BROWSER PASS** |
| **Chromium E2E & Visual Acceptance** | `node "Agent & Skill/scripts/chromium_p4b2_acceptance.js"` | `Total failures: 0` (`browser_qa_report.json`) | **BROWSER PASS** |

---

## 2. XÁC MINH P5 PATH OF LEGENDS (TRÌNH DUYỆT THẬT)

1. **Registry Integrity (`RaidRegistry.validateRegistry()`):**
   - `4` Playable Heroes (`warrior`, `archer`, `lancer`, `arcane_mage`), `27` Active Skills (tiến hóa `Lv 1..3`), `10` Animation Profiles, `5` Chapter Stages, `valid: true, errors: []`.
   - Đã kiểm tra khóa `arcane_mage` ban đầu, chặn chọn trái phép, chặn equip sai class (`Archer` không lắp được `Knight Slash`), chặn vượt `4 Active + 1 Ultimate`.
2. **All 10 Animation Profiles + Ranged Hold Position + Canvas Fallback:**
   - Kiểm chứng cả 10 hồ sơ qua BattleScene (`warrior`, `lancer`, `archer`, `arcane_mage`): `lastHeroMovedX === 0` với `archer` (`quick_shot`, `triple_shot`) và `arcane_mage` (`fireball`, `arcane_beam`, `meteor_fall`); mọi profile đều trả `endFsm: "IDLE"` và `tempLeft: 0` (dọn sạch projectile/beam/floating text).
   - Canvas 2D Fallback (`?qa=1&renderer=canvas`) kiểm chứng `arcane_mage` đánh tầm xa giữ nguyên vị trí (`lastHeroMovedX <= 10`) và về `IDLE`.
3. **Full Unlock & Progression Loop (Không dùng hook skip trận):**
   - Chơi thật Stage 1 đến Victory (`score=1023`, `topicWordsSolved=1`) -> nhận `+2 SP`, mở khóa `Phantom Dash` & `Arcane Mage`, mở khóa Stage 2 (`AVAILABLE`) -> kiểm chứng không cấp trùng thưởng khi replay -> trang bị `Phantom Dash` trên Warrior & đổi sang `Arcane Mage` vào Stage 2 (`Đầm Lầy Răng Nanh`) -> reload trang xác nhận giữ nguyên dữ liệu Demo.
   - Training Dummy trong Character Hall xác nhận `battleHistory.length === 0`, không cộng SP/unlock.
   - Practice Mode xác nhận không cấp Campaign Milestone unlock.
4. **Responsive 9 Viewports (`320x568` .. `1920x1080`) & 6 Tab Character Hall:**
   - Toàn bộ `9/9` viewport Đấu Boss đạt `fit=true`, `tap=true`, `clear=true`, `attack=true`, `skills=5`.
   - `/app/account` đạt `overflow=false` ở Desktop (`1366x768`) lẫn Mobile (`390x844`, `320x568`).

---

## 3. HIỆU NĂNG QUAN SÁT THỰC TẾ (`browser_qa_report.json`)

- **Cold start `/app/minigame`:** `202` requests, `1,963,529` bytes (giảm từ `407` requests / `~2.86 MB` ở P4-B.3 nhờ `BootScene` nạp chọn lọc & lazy VFX).
- **Combat Frame Timing (74 mẫu rAF):** `avgFrameMs = 16.67 ms`, `p95FrameMs = 16.7 ms`, `maxFrameMs = 16.8 ms`, `longTaskCount = 0`.
- **VFX Pool & Heap:** `poolSize = 16`, `activeVfxAfterCombat = 0`, `heapBeforeBytes = 17,821,236`, `heapAfterBytes = 23,244,560`.
