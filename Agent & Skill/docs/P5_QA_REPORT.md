# LEX RAID — P5.1 QA & VISUAL ACCEPTANCE REPORT (PROGRESSION INTEGRITY)

**Ngày kiểm định:** 2026-11-27  
**Nhánh:** `feature/p4b3-rpg-combat-learning`  
**Chế độ frontend công khai:** `demo-static` (`Demo Progression` trên trình duyệt; SQL Server offline chưa áp dụng P5 schema)

---

## 1. BẢNG PHÂN LOẠI BẰNG CHỨNG KIỂM THỬ

| Hạng mục | Lệnh / Công cụ | Kết quả thực tế | Trạng thái chuẩn |
| :--- | :--- | :--- | :---: |
| **Java Mockito Unit Tests** | `mvn test -Dtest=*ServiceTest,*ProgressionTest,*GlobalLexiconTest` | `Tests run: 29, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` | **BACKEND UNIT PASS** |
| **Spring Boot + SQL Server (`MainTests`)** | `mvn -q test` (`MainTests.contextLoads`) | Kết nối TCP `localhost:1433` chưa bật ở máy local; draft P5 DDL chưa chạy lên live DB | **NOT TESTED** |
| **Static Verification Suite** | `python src/main/resources/tools/test_p4b_verification.py` | `STATIC CHECKS: 43 \| STATIC PASS: 43 \| FAILED: 0` | **STATIC PASS** |
| **Case Sensitivity & Asset Map** | `python src/main/resources/tools/check_case_sensitivity.py` | `544` file trên đĩa, `134` Phaser URLs, `0` missing, `0` case mismatches | **STATIC PASS** |
| **Technical SEO Verification** | `node src/main/resources/tools/verify_seo.js` | `11 routes + sitemap + robots + 404 + JSON-LD + og:image all valid` | **HTTP / SEO PASS** |
| **Scoped Contrast Audit** | `node src/main/resources/tools/audit_contrast_chromium.js` | `issues=0` trên cả 9 trang + 6 tab `/app/account` (gồm `account-mastery`) ở `daylight` & `moonlight` + `minigame [combat]` | **BROWSER PASS** |
| **Chromium E2E & Visual Acceptance** | `node "Agent & Skill/scripts/chromium_p4b2_acceptance.js"` | `Total failures: 0` (`browser_qa_report.json`), bao gồm `27/27` public skills, `10/10` Canvas fallback profiles, UI DOM E2E & 5-run cleanup telemetry | **BROWSER PASS** |

---

## 2. XÁC MINH P5.1 PROGRESSION INTEGRITY (TRÌNH DUYỆT THẬT)

1. **Mage Permanent Lock Fix (`progression-store.js`):**
   - Clear Stage 1 với `0` Topic word: `arcane_mage` vẫn bị khóa (`lockedMageAfter0Topic: true`), nhận thưởng Stage (`spBefore: 3 -> spAfterClear1: 5`), Stage 1 đạt `COMPLETED`.
   - Replay Stage 1 với `>= 1` Topic word: `arcane_mage` mở khóa (`mageUnlockedOnReplay: true`, `statusAfterTopicReplay: MASTERED`), `skillPoints` giữ nguyên `5` (không cấp trùng SP Stage 1).
   - Replay Stage 1 kém hơn (`0` Topic word, score `120`): trạng thái vẫn giữ `MASTERED` và `bestScore: 920` (không hạ cấp về `COMPLETED`).
2. **Strict Skill Rules & Starter Hygiene (`raid-registry.js` / `progression-store.js`):**
   - Starter `archer` & `lancer` không còn sở hữu sẵn `celestial_arrow` / `dragon_lance` (`starterCelestial: 0`, `starterDragon: 0`).
   - Dù có sẵn `3 SP`, toàn bộ `9` skill khóa theo Stage/Chapter/Learning (`phantom_dash`, `shield_counter`, `rune_prison`, `earthbreaker`, `heavens_pillar`, `divine_aegis`, `celestial_arrow`, `dragon_lance`, `meteor_fall`) đều trả `state: "LOCKED"`, `canLearn: false`, `learnOrUpgradeSkill() === false`.
3. **Loadout Enforcement & Locked Stage Guard (`minigame.js`):**
   - Mở `/app/minigame?qa=1&stage=3` khi Stage 3 đang `LOCKED` bị chặn và chuyển an toàn về Stage đã mở (`lockedAttempt: { requestedStageId: 3, fallbackStageId: 2 }`, hiển thị cảnh báo).
   - `castKnightSkill` từ chối rõ ràng khi skill chưa học (`earthbreaker`: `false`) hoặc đã học nhưng chưa trang bị vào Loadout (`phantom_dash`: `false`).
4. **Word Mastery Integrity (`account.js` / `progression-store.js`):**
   - Bấm `"Nghe phát âm"` 3 lần chỉ tăng `pronunciationPlays: 3`, giữ `uniqueReviewedWords: []`, `reviewedWordsCount: 0`.
   - Sai đáp án Recall không tăng mốc; đúng đáp án Recall trên cùng 1 từ 2 lần chỉ đếm `1`, đúng trên `LEARN` và `CACHE` đạt `uniqueReviewedWords: ["LEARN", "CACHE"]`, `masteredWords: ["LEARN", "CACHE"]`, `reviewedWordsCount: 2`.
5. **True UI DOM E2E Flow & Canvas Parity (`10/10` Profiles):**
   - Play Stage 1 đến Victory -> mở Character Hall via DOM -> kiểm tra Stage 2 trên Chapter Map -> học/nâng cấp `Phantom Dash` -> gỡ `Royal Guard` & trang bị `Phantom Dash` trên tab Loadout -> vào Stage 2 bấm `[data-skill-id="phantom_dash"]` thành công -> chọn `Arcane Mage` bấm `#saveLoadoutBtn` -> reload Stage 2 xác nhận `unit: "arcane_mage"` và cast `fireball`.
   - `?renderer=canvas` kiểm chứng đủ 10 animation profiles (`MELEE_SLASH`, `DASH_STRIKE`, `SHIELD_CAST`, `SELF_HEAL`, `MULTI_HIT`, `PROJECTILE`, `CHANNEL_BEAM`, `GROUND_CAST`, `SKY_STRIKE`, `ULTIMATE`), ranged hero giữ `movedX: 0`, kết thúc đều `IDLE`.

---

## 3. MA TRẬN KIỂM THỬ TOÀN BỘ 27 KỸ NĂNG CÔNG KHAI (`browser_qa_report.json`)

Toàn bộ `27/27` skill đều xác nhận tăng tiến số liệu `Lv1 -> Lv2 -> Lv3`, trừ đúng Mana/CD, phản hồi đúng Animation Profile, dọn `activeTempObjects === 0`, và mọi skill đa nhịp (`hitCount > 1`) đều giảm HP/EHP Boss qua nhiều tick thật (`PRE -> TICK1 -> POST`):

| Skill ID | Hero | Profile | Mana | CD | Hits | Lv1→3 Scale | Boss EHP (`Pre -> Tick1 -> Post`) | End State (`temp`) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `knight_slash` | `warrior` | `MELEE_SLASH` | 0 | 0 | 1 | PASS | `232 -> 214 -> 214` | `IDLE` (`0`) |
| `heavy_slash` | `warrior` | `MELEE_SLASH` | 2 | 2 | 1 | PASS | `214 -> 186 -> 186` | `IDLE` (`0`) |
| `phantom_dash` | `warrior` | `DASH_STRIKE` | 2 | 2 | 2 | PASS | `232 -> 218 -> 205` (multi-tick) | `IDLE` (`0`) |
| `blade_storm` | `warrior` | `MULTI_HIT` | 3 | 3 | 3 | PASS | `127 -> 116 -> 107` (multi-tick) | `IDLE` (`0`) |
| `earthbreaker` | `warrior` | `GROUND_CAST` | 3 | 3 | 1 | PASS | `232 -> 189 -> 189` | `IDLE` (`0`) |
| `royal_guard` | `warrior` | `SHIELD_CAST` | 1 | 2 | 1 | PASS | `151 -> 151 -> 151` (Guard) | `IDLE` (`0`) |
| `shield_counter` | `warrior` | `SHIELD_CAST` | 2 | 2 | 1 | PASS | `232 -> 232 -> 232` (Guard) | `IDLE` (`0`) |
| `divine_aegis` | `warrior` | `SHIELD_CAST` | 3 | 3 | 1 | PASS | `232 -> 232 -> 232` (Guard+Heal) | `IDLE` (`0`) |
| `sacred_recovery` | `warrior` | `SELF_HEAL` | 2 | 3 | 1 | PASS | `232 -> 232 -> 232` (Heal) | `IDLE` (`0`) |
| `rune_prison` | `warrior` | `GROUND_CAST` | 2 | 3 | 1 | PASS | `232 -> 208 -> 208` | `IDLE` (`0`) |
| `heavens_pillar` | `warrior` | `CHANNEL_BEAM` | 3 | 3 | 3 | PASS | `232 -> 219 -> 193` (multi-tick) | `IDLE` (`0`) |
| `lexical_judgment` | `warrior` | `ULTIMATE` | 4 | 4 | 1 | PASS | `155 -> 107 -> 107` | `IDLE` (`0`) |
| `quick_shot` | `archer` | `PROJECTILE` | 0 | 0 | 1 | PASS | `232 -> 214 -> 214` | `IDLE` (`0`) |
| `piercing_arrow` | `archer` | `PROJECTILE` | 2 | 2 | 1 | PASS | `214 -> 185 -> 185` | `IDLE` (`0`) |
| `triple_shot` | `archer` | `MULTI_HIT` | 3 | 3 | 3 | PASS | `232 -> 220 -> 196` (multi-tick) | `IDLE` (`0`) |
| `celestial_arrow` | `archer` | `ULTIMATE` | 4 | 4 | 1 | PASS | `196 -> 146 -> 146` | `IDLE` (`0`) |
| `spear_thrust` | `lancer` | `MELEE_SLASH` | 0 | 0 | 1 | PASS | `232 -> 206 -> 206` | `IDLE` (`0`) |
| `impaling_charge` | `lancer` | `DASH_STRIKE` | 2 | 2 | 2 | PASS | `206 -> 190 -> 175` (multi-tick) | `IDLE` (`0`) |
| `iron_fortress` | `lancer` | `SHIELD_CAST` | 2 | 2 | 1 | PASS | `232 -> 232 -> 232` (Guard) | `IDLE` (`0`) |
| `dragon_lance` | `lancer` | `ULTIMATE` | 4 | 4 | 3 | PASS | `232 -> 203 -> 170` (multi-tick) | `IDLE` (`0`) |
| `magic_bolt` | `arcane_mage` | `PROJECTILE` | 0 | 0 | 1 | PASS | `232 -> 213 -> 213` | `IDLE` (`0`) |
| `fireball` | `arcane_mage` | `PROJECTILE` | 2 | 2 | 1 | PASS | `213 -> 185 -> 185` | `IDLE` (`0`) |
| `arcane_beam` | `arcane_mage` | `CHANNEL_BEAM` | 3 | 3 | 3 | PASS | `232 -> 219 -> 193` (multi-tick) | `IDLE` (`0`) |
| `meteor_fall` | `arcane_mage` | `ULTIMATE` | 4 | 4 | 1 | PASS | `193 -> 139 -> 139` | `IDLE` (`0`) |
| `fire_blade` | `warrior` | `MELEE_SLASH` | 2 | 2 | 1 | PASS | `232 -> 210 -> 210` | `IDLE` (`0`) |
| `frost_seal` | `warrior` | `GROUND_CAST` | 2 | 3 | 1 | PASS | `210 -> 190 -> 190` | `IDLE` (`0`) |
| `thunder_strike` | `warrior` | `SKY_STRIKE` | 3 | 3 | 1 | PASS | `232 -> 195 -> 195` | `IDLE` (`0`) |

---

## 4. HIỆU NĂNG & DỌN DẸP ĐA LƯỢT (`5` TRẬN LIÊN TIẾP)

- **Cold start `/app/minigame?stage=5` (`p5ColdStartMetrics`):** `requests = 122`, `transferKB = 1,907 KB`, `domReadyMs = 56 ms`, `heapMB = 36.52 MB` (page load đầu `/app/minigame` desktop: `190` reqs, `2,775,766` bytes).
- **5-Run Consecutive Combat Telemetry (`fireball` -> `magic_bolt` mỗi trận Stage 2):**
  - Run 1: `46.29 -> 44.98 MB`, `IDLE`, `activeTempObjects = 0`, `pendingTimers = 0`
  - Run 2: `47.08 -> 49.41 MB`, `IDLE`, `activeTempObjects = 0`, `pendingTimers = 0`
  - Run 3: `50.55 -> 49.24 MB`, `IDLE`, `activeTempObjects = 0`, `pendingTimers = 0`
  - Run 4: `52.72 -> 55.02 MB`, `IDLE`, `activeTempObjects = 0`, `pendingTimers = 0`
  - Run 5: `56.34 -> 55.03 MB`, `IDLE`, `activeTempObjects = 0`, `pendingTimers = 0`
