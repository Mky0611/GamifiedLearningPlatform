# CHANGELOG — LEX RAID DEVELOPMENT & FIXES

**Dự án:** Gamified Learning Platform — Lex Raid  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Giai đoạn:** P5 (Path of Legends — RPG Character Progression, Skill Evolution & 10 Animation Profiles)

---

## [P6-A..G Backend Persistence, Server-Authoritative Combat & DB Audit] — 2026-11-27
- **P6-A/B SQL Server Baseline & Live Schema Audit (`docs/P6_DATABASE_AUDIT.md`):** Xác nhận `MSSQL$SQL2022` đang **Running** và TCP `1433` mở; xác định `MainTests.contextLoads` lỗi `ErrorCode 18456` do thiếu env `SPRING_DATASOURCE_PASSWORD` (không tự reset pass). Audit read-only `55` base tables qua `sqlcmd -E`, phát hiện `20` rows `dbo.stages` (`stage_id 1..6,8..21`), `CK_user_loadouts_unit` chỉ cho `WARRIOR|LANCER|ARCHER`, `CK_word_submit_events_word_type` thiếu `'GLOBAL'`; thiết kế DDL + Backfill + Rollback T-SQL an toàn.
- **P6-C/G Persistent Progression (`RpgCatalogRegistry`, `ProgressionServiceImpl`, `ProgressionController`, `AccountServiceImpl`):** Triển khai catalog 4 Hero & 27 Skills Lv1–3, thực thi ví SP khóa `PESSIMISTIC_WRITE` (`user_progression_wallets`), tách milestone `stage_first_clear_*` / `skill_unlock_*` / `hero_unlock_arcane_mage`, và gỡ unsafe fallback user #1 ở `AccountServiceImpl`.
- **P6-D/E Server-Authoritative Combat (`LexRaidServiceImpl`, `LexRaidController`, `SkillCastEvent`):** Thêm `/api/v1/lex-raid/sessions/{id}/cast-skill` (`actionId` idempotency, ownership check `403`, anti-spam `MAX_ZERO_MANA_CASTS_PER_TURN = 1`, server multi-hit split & wave advancement, Campaign Stage Lock, Core Word không auto-win sớm).
- **P6-F Server-Verified Word Mastery (`MasteryServiceImpl`, `MasteryController`):** Tạo Recall challenge ẩn đáp án, chấm đáp án theo `VocabularyWord`, tách TTS, dedupe unique review & bảo toàn `MASTERED` (`38/38` Mockito PASS).

## [P5.1 Progression Integrity & Full 27-Skill QA] — 2026-11-27
- **Mage Permanent Lock & Milestone Separation (`progression-store.js`):** Tách `stage_first_clear_*`, `skill_unlock_*`, `hero_unlock_*`; sửa triệt để lỗi clear Stage 1 với 0 từ Topic khiến khóa vĩnh viễn Arcane Mage khi replay, chống cấp trùng SP, và không hạ cấp Chapter `MASTERED` khi replay điểm thấp.
- **Strict Skill Unlock Rules (`raid-registry.js`, `progression-store.js`):** Bỏ SP bypass trên `STAGE_CLEAR` / `LEARNING`, bỏ `celestial_arrow` & `dragon_lance` khỏi starter `archer`/`lancer`, bổ sung `upgradeRequirements` Lv2–3 cho Ultimate và giữ nguyên dữ liệu sở hữu cũ trong `localStorage`.
- **Loadout Enforcement, Stage Guard & Multi-Hit (`minigame.js`):** Xóa fallback ngầm ở `castKnightSkill`, chặn skill chưa học/chưa equip/sai lớp, chặn mở URL `?stage=` đang khóa về Stage đã mở cao nhất kèm banner, và trừ Boss HP theo nhiều nhịp thật (`hitCount > 1`).
- **Word Mastery Recall UI (`account.js`, `account.css`):** Tách lượt nghe TTS (`pronunciationPlays`) khỏi `uniqueReviewedWords` / `masteredWords`; thêm thử thách Recall kiểm tra nghĩa tiếng Việt + dedupe theo từ duy nhất (`issues=0` Daylight/Moonlight).
- **Backend Readiness & SQL Server Draft (`LexRaidServiceImpl.java`, `AccountServiceImpl.java`, `docs/P5_BACKEND_DRAFT.md`):** Bảo toàn Boss HP còn lại khi chuyển sang Core Word kế tiếp, giữ `arcane_mage` ở phạm vi Demo Progression cho tới khi migrate SQL Server, chuẩn hóa `WITH (UPDLOCK, ROWLOCK)` + bảng `user_milestone_rewards` + Rollback T-SQL (`29/29` Mockito PASS; SQL Server live `NOT TESTED`).
- **Full P5.1 QA Acceptance (`chromium_p4b2_acceptance.js`):** Kiểm chứng `27/27` public skills, `10/10` Canvas 2D fallback profiles, true UI E2E flow, locked stage guard, Mage replay unlock, Mastery Recall UI và 5-run telemetry (`activeTempObjects = 0`, `pendingTimers = 0`, `Total failures: 0`).

## [P5 Path of Legends — Frontend Demo & Combat Parity] — 2026-11-26
- **P5 Asset Curation (`audit_p5_assets.py`, `P5_ASSET_DELTA.json`):** Tích hợp `63` asset đã xác minh license (`Arcane Mage v1.1` 9 strips `210x180`, 12 `PVFX` CC0, 12 `Mira Forge` 64px, 13 `Byte Progression Kit` CC-BY-4.0 kèm attribution, 16 `Questwood UI`); giữ `monk` (`LICENSE_PENDING`) và `rogue` (`32x32` mismatch) ngoài runtime công khai.
- **Registry & Demo Progression (`raid-registry.js`, `progression-store.js`):** Xây dựng cấu trúc chuẩn cho `4` Hero playable, `27` kỹ năng tiến hóa `Lv 1..3`, `10` hồ sơ hoạt ảnh, `5` Stage Chapter; bảo tồn starter `warrior`/`archer`/`lancer`, chống equip sai class/vượt 4+1 slot và chống cấp trùng milestone.
- **10 Animation Profiles & Lazy Loading (`boot-scene.js`, `battle-scene.js`, `raid-phaser-embed.js`):** Tối ưu nạp chọn lọc giảm còn `202` requests lúc vào trận (so với `407` ở P4-B.3); triển khai đủ 10 profile (`MELEE_SLASH`, `DASH_STRIKE`, `PROJECTILE`, `CHANNEL_BEAM`, `GROUND_CAST`, `SKY_STRIKE`, `SHIELD_CAST`, `SELF_HEAL`, `MULTI_HIT`, `ULTIMATE`), giữ Archer & Mage đứng tầm xa và hỗ trợ Canvas 2D fallback parity.
- **Character Hall 6 Tabs & Chapter Unlocks (`account.*`, `minigame.*`, `base.css`):** Nâng cấp `/app/account` thành 6 tab (`Heroes & Avatar`, `Skill Tree`, `Spellbook & Dummy`, `Loadout (4+1)`, `Chapter Map`, `Word Mastery`), khắc phục sạch lỗi tương phản Daylight/Moonlight bằng semantic tokens (`0` contrast issues trên mọi trang & tab).
- **Backend Parity & Draft (`LexRaidBalanceConfig`, `LexRaidServiceImpl`, `AccountServiceImpl`, `docs/P5_BACKEND_DRAFT.md`):** Thống nhất sát thương Core Word `>= 55`, ràng buộc kiểm tra stage-clear server-side trước khi lưu `arcane_mage`, và hoàn thành bản nháp DDL SQL Server P5 (`28/28` Mockito PASS; SQL Server live `NOT TESTED`).

## [P4-B.3 Post-Release Correction] — 2026-11-26 (`870faac`)
- **Authoritative Core Word Board (`LexRaidServiceImpl.guessCoreWord`):** Sinh `nextBoard` một lần khi giải đúng Core Word còn lượt, lưu `POST_CORE_GUESS` snapshot trong transaction và trả đúng bảng đó cho client; bổ sung regression test `Core Word -> nextBoard -> submitWord -> POST_SUBMIT` (`26/26` Mockito PASS). Ghi nhận cho **P4-C**: Demo mode (`55` DMG, giữ wave nếu Boss còn HP) và Backend (`bossHpRemaining = 0`, `rewardDamage = max(20, bonusDamage)`) hiện có công thức Core Word damage khác nhau.
- **Encounter Boss Pool (`encounter-registry.js`, `minigame.js`):** Giữ cố định Chapter Boss lore ở Campaign khi không bật Random Encounter; mở pool boss ngẫu nhiên ở Practice hoặc `?encounter=random`, giữ deterministic seed cho `?qa=1`, không ảnh hưởng backend session.
- **QA & Contrast Hardening:** Sửa assertion bắt buộc quan sát `#bossEntranceBanner` hiển thị thực, kiểm tra Victory thật, tách riêng Defeat `playerHp === 0`, chờ sprite load trước ảnh chụp và ép chạy đủ `fire_blade`/`frost_seal`/`thunder_strike`; mở rộng `audit_contrast_chromium.js` sang gradient stops, opacity blending, placeholders và sửa `.skill-preview-chip:disabled` trong `minigame.css`.
- **SEO `robots.txt`:** Gỡ `Disallow` cho các trang `noindex` công khai (`/app/account`, `/app/auth`, `/app/typography`) để crawler đọc được `<meta name="robots" content="noindex, nofollow">`.

## [P4-B.3 Final Release] — 2026-11-26: Vocabulary Pool, 5-Wave Combat Polish, Contrast Fix, Technical SEO & Production Release
- **Common Vocabulary & Continuous Core Word Loop (`9787501`):** Tạo `common-words.txt` (`2,789` từ thông dụng) và `lexicon-manifest.json` từ bộ `77,017` từ (`en-wl/wordlist/v2`), mở khóa 24 từ 2 chữ cái (`GO`, `DO`, `BE`, `UP`, `IN`...), đạt 100/100 seed khả giải (`minCommon: 95`), tự động nạp từ khóa & gợi ý mới sau khi giải Core Word, ghi nhận từ sai/dùng gợi ý vào `glp.wordJournal`.
- **Spell VFX, Boss Entrance & Boss HUD (`fae6a84`):** Phân biệt VFX từng phép, floating damage text, status aura trên Boss, sửa co giãn bóng Boss, encounter ngẫu nhiên mỗi trận (cố định khi `?qa=1`), Dramatic Boss Entrance + Chapter Boss HUD (`.boss-panel.is-chapter-boss`, `#bossCrownBadge`) ở Wave 5.
- **Backend Correctness (`a50a1ae`):** Bắt buộc tile path không rỗng, bỏ qua `boardJson` giả mạo, lưu `POST_SUBMIT` `BoardSnapshot`, chặn thao tác sau khi đóng session, guard `applySync`, lưu event trước `finalizeGameSessionAndAward()`, mở rộng `LexRaidGlobalLexiconTest` (**25/25 Mockito PASS**).
- **Light/Dark Semantic Tokens (`b91546e`):** Chuẩn hóa 16 semantic CSS variables trong `theme.css` cho `daylight`, `moonlight`, `combat`; gỡ inline styles và sửa `.hero-crest` `tan.png`, đạt **0 lỗi tương phản** trên cả 9 trang.
- **Technical SEO & Production Routing (`8af521a`):** Thêm `robots.txt`, `sitemap.xml` (7 canonical routes), `404.html`, banner `og-preview.png` (1200×630), canonical/OG/Twitter/JSON-LD, `noindex` trên `/app/account`, `/app/auth`, `/app/typography`.
- **5-Wave Real Playthrough & Bugfix (`5d8ecaa`):** Sửa lỗi `ReferenceError` biến `damageDealt`/`isTopicMatch` trong `guessCoreWord()` (`minigame.js`), kiểm chứng playthrough đủ 5 Wave bằng thao tác bảng chữ thật trong `chromium_p4b2_acceptance.js` (**0 failures**).

## [P4-B.3] — 2026-11-25: Expanded Battle Arena, Global English Lexicon, 5-Wave Encounters, Spells & Cozy Themes
- **Milestone A (Arena, Scaling & HUD):** Mở rộng canvas đấu trường `960x360` (`groundY: 302`), nâng scale Hero (`1.56x` / `1.50x`, `heroDisplayH: 300`) và Boss theo `rarityScales` (`1.0x..1.36x`), thu gọn HUD, chuyển ô chữ bàn cờ sang `Be Vietnam Pro` 800/900.
- **Milestone B (Global Lexicon & Topic Bonus):** Tạo `build_en_wl_lexicon.py` sinh `76,993` từ tiếng Anh chuẩn từ `en-wl/wordlist/v2` (`LICENSE_EN_WL.txt`), bổ sung `EnglishLexiconService`, `LexRaidBalanceConfig`, lưu `BoardSnapshot` khởi đầu & xác thực đường chọn không trùng ô trên `LexRaidServiceImpl`, kiểm chứng bởi `LexRaidGlobalLexiconTest` (`3/3 PASS`).
- **Milestone C (Learning Loop & Solvable Board):** Triển khai `#wordFeedbackToast` kèm TTS, Hint Toolbar (`Gợi ý nghĩa`, `Mở 1 chữ`, `Đổi bảng`), bộ sinh bảng khả giải 20/20 seeds, `glp.wordJournal` và Sổ Tay Từ Vựng cuối trận (`/app/volcard`).
- **Milestone D (Difficulty, 5-Wave & Monster Traits):** Thêm `encounter-registry.js` cho `5-Wave Encounter` (`Normal -> Normal -> Elite -> Guardian -> Chapter Boss`), chế độ `Campaign` (`Ch1 45s -> Ch2 38s`) và `Practice` (`∞`), Boss Traits + Phase 2 (`<50% HP`), và Lexical Judgment khi giải Core Word.
- **Milestone E (Expanded Spells & Pooled VFX):** Bổ sung `Fire Blade` (Burn), `Frost Seal` (Frost +4s), `Thunder Strike` (x2 Shield Break + Stun) vào `raid-config.js`, bộ lọc hotbar $\le 6$ nút để tránh rối mắt.
- **Milestones F–G (Cozy Daylight/Moonlight Themes, QA & Docs):** Xuất bản `theme.css` + `theme-system.js` kèm nút Sun/Moon lưu `localStorage('glp.theme')`, giữ Combat Theme khi vào trận & khôi phục theme khi ra ngoài; kiểm chứng **23/23** Java unit tests, **43/43 STATIC PASS**, và **0 failures** trên Chromium full QA (`docs/P4B3_QA_REPORT.md`, `docs/P4B3_BACKEND_DRAFT.md`).

## [P4-B.2] — 2026-11-25: Kingdom of Words, Asset-Driven 9-Slice UI, Combat VFX State Machine & World Environment
- **Milestone A (Asset Audit & Provenance):** Thêm `audit_ui_extra.py` (`3,676` raw / `2,881` non-OS files) và `curate_p4b2_assets.py` (cách ly `UI Extra/` trong `.gitignore` và loại `428` tệp `Tiny Swords` `LICENSE_PENDING`); sửa lỗi đảo `cursor-action.png` <-> `cursor-forbidden.png`; xuất bản `P4B2_ASSET_MANIFEST.json`, `P4B2_COMPONENT_ASSET_MAP.csv`, `P4B2_THIRD_PARTY_ASSETS.md`, `P4B2_EXECUTION_PLAN.md`, `P4B2_DECISIONS.md`.
- **Milestone B (Asset-Driven Design System):** Ghép contiguous 9-slice/3-slice (`paper-regular`, `wood-board`, `banner-scroll`, `paper-special`, 5 `ribbon-*`, `kenney/Ancient`); tích hợp bộ icon Kibyra cho Navbar và Skill Bar; nạp thêm `Lora` + `Pixelify Sans` vào `typography-specimen.html`.
- **Milestone C (Shared Animated Worlds):** Tạo `world-environment.js` hỗ trợ `village`, `forest`, `mountain-dusk`, `academy`, `gate`, `waterfall` (kèm credit `"Waterfall pixel art by Burcu Sak"`), tự dừng khi `document.hidden` hoặc `prefers-reduced-motion`.
- **Milestone D (Knight FSM & Pooled VFX):** Nâng cấp `battle-scene.js` thành FSM (`IDLE`, `APPROACH`, `ATTACK`, `IMPACT`, `RECOVERY`, `RETURN`, `GUARD`, `HURT`, `DEATH`, `VICTORY`), tách base coords khỏi tweens, dùng pool 12 VFX (`fx-slash-clean`, `tiny-pixel-fx-vol1`, `Mira Forge`), thêm `Warrior_Attack2.png` và đồng bộ `raid-phaser-embed.js` Canvas 2D fallback.
- **Milestone E (Skills & Monster Preview + Backend Compatibility):** Thêm 6 kỹ năng Hiệp sĩ (Preview Mode, SFX tắt mặc định) và 2 quái vật xem trước (`Verdant Slime`, `Cursed Skeleton` kèm portrait), đã đối chiếu an toàn với `LexRaidController`/`LexRaidServiceImpl` (không thay đổi schema/XP/coins).
- **Milestones F–H (9-Page Redesign, Optimization & Chromium QA):** Tinh gọn toàn bộ 9 trang HTML, loại bỏ tham chiếu nặng (`background.png`, `map*.gif`), tinh chỉnh `320x568` (`543/568`) và `1440x900` (`733/900`), chạy `chromium_p4b2_acceptance.js` đạt **0 failures**.

## [P4-B-ACCEPTANCE] — 2026-11-25: Visual Acceptance, Asset Correction & Chromium 9-Viewport Verification
- **Strict QA Reclassification:** Phân biệt rõ `STATIC PASS` (`audit_assets.py`, `check_case_sensitivity.py`, `smoke_check.py`, `test_p4b_verification.py`, `test_typography.py`), `UNIT PASS`, `HTTP PASS`, `BROWSER PASS` (`chromium_p4b_acceptance.js`), và `NOT TESTED`.
- **Safe Asset Renames & Pipeline Hygiene:** Tách contact sheets khỏi `FrontEnd/assets/qa_audit/` vào `test_output/asset_audit/`; thực hiện **123 `git mv` renames** (`assets/bosses/<boss>/boss-<boss>-<mode>-<nn>.png`, `ui/icons/icon-*.png`, `backgrounds/fantasy-arena-bg.png`); cập nhật `raid-config.js`, `generate_portraits.py`, `audit_assets.py`. Kiểm toán lại: **316 assets**, `130/130` Phaser URLs pass `0` missing / `0` case mismatch.
- **Logo, Favicon & Unified Navbar:** Cắt tách `logo-mark.png` (`192x192`, `42.78 KB`), `favicon.png` (`64x64`, `8.34 KB`), `logo.png` (`281x240`, `65.94 KB`); đồng bộ nav 5 link, contrast menu mobile (`#241a14` / `#f3e4be`), và sửa active link sai trên `auth.html`.
- **Typography & Volcard Fix:** Xuất bản `/app/typography` (`typography-specimen.html`), tách `Silkscreen` cho ASCII HUD khỏi `Be Vietnam Pro` cho tiếng Việt/từ vựng; sửa lỗi `fitFlashWord()` bị co về `15px` và bỏ `nowrap`/`ellipsis`, đảm bảo `POLYMORPHISM` và `CONTINUOUS INTEGRATION` hiển thị trọn vẹn từ `320x568` tới `1366x768`.
- **Battle Arena & Safe Status Rendering:** Sửa lỗi CSS Grid làm cắt chân sprite trên `768x1024`, `1024x768`, `1920x1080` (`position: absolute; inset: 0; object-fit: contain`), gọn lưới desktop (`'fighter arena boss' 'core board boss'`) giúp 9/9 viewports fit above-the-fold (`coreBottom <= H`); thay raw HTML trong `renderStatus()` bằng DOM API (`textContent`); kiểm chứng cả Phaser lẫn Canvas 2D fallback (`?renderer=canvas`).
- **Speed-Math & Auth Polish:** Chặn auto-focus gây nhảy cuộn trên `speed-math` mobile, thêm `min-width: 0` chống tràn nội dung grid, nâng tap target eye-toggle lên `40x40px`.

## [P4-B] — 25/11/2026: Pure Fantasy Pixel RPG Redesign, Asset Reorganization & Visual QA

### 1. Kiểm toán Toàn Diện Tài Nguyên & Tối Ưu Băng Thông (Asset Audit & Pipeline)
- **`src/main/resources/tools/audit_assets.py`:**
  - Kiểm toán 306 assets đồ họa (86.17 MB), phân loại thành 12 danh mục, phát hiện 98 tệp trùng hash và 121 tệp vi phạm quy tắc đặt tên.
  - Xuất bản `docs/P4B_ASSET_AUDIT.md`, `P4B_ASSET_MANIFEST.json`, `P4B_ASSET_INVENTORY.csv`, `P4B_ASSET_RENAME_MAP.csv` và 12 contact sheets tại `assets/qa_audit/`.
- **`src/main/resources/tools/optimize_logo.py`:**
  - Tách nền, cắt viền chính xác logo chữ Lex Raid từ file gốc 2816x1536 (5.87 MB) xuống file retina sắc nét **16.74 KB** (`assets/imgs/logo-clean.png` và cập nhật `logo.png`). Tiết kiệm 99.7% payload logo trên 100% các trang.
- **Triệt tiêu 22 MB Avatar Bloat:**
  - Thay thế các tệp hình nền 6–8.5 MB (`imgs/avatar1..3.png`) trong `api.js` và `account.js` bằng các ảnh chân dung pixel tối ưu 1.1–5 KB (`assets/ui/avatars/`). Tiết kiệm ~28 MB mỗi phiên tải trang.

### 2. Đồng Bộ Danh Tính & Chân Dung Hiệp Sĩ / Quái Vật (Identity Mapping)
- **`src/main/resources/tools/generate_portraits.py`:**
  - Tạo 9 chân dung Boss (`Crabby`, `Captain`, `Fierce`, `Pink`, `Totem 1-3`, `Seashell`, `Cannon`) và 3 chân dung Hero (`Warrior`, `Lancer`, `Archer`) kích thước chuẩn 64x64px.
  - Đồng bộ HUD avatar và in-game sprite trong `minigame.js` và `raid-config.js`.

### 3. Đại Tu Đấu Trường Boss Hunt (Battle Arena, Sprite Scale & Fold)
- **`raid-config.js`:**
  - Tăng tỷ lệ Hero: Warrior & Archer lên **1.35x**, Lancer lên **1.29x**.
  - Tăng tỷ lệ Boss: Crabby (3.2x), Fierce (3.6x), Pink (3.6x), Totem (3.4x), Seashell (3.4x), Cannon (3.5x), Captain (2.8x).
  - Căn chân tiếp đất hoàn hảo tại $Y = 350.00\text{px}$ với sai số nhỏ hơn $0.0108\text{px}$.
- **`minigame.html` & `minigame.css`:**
  - Thu gọn chiều cao sàn đấu tối đa 360px (`aspect-ratio: 960/420`), đưa toàn bộ HUD, Stage, Attack Dock và Bàn cờ chữ lên phía trên đường cuộn trang (above the fold) trên cả mobile 320x568.
  - Viết lại `.pixel-bar` bằng CSS retro gradients sắc nét, loại bỏ khung ảnh 822KB gây tràn viền.
  - Sửa lỗi escape chuỗi HTML trong `renderStatus()` của `minigame.js`.

### 4. Khắc Phục Gãy Chữ & Giao Diện Kho Từ Vựng (Volcard Redesign)
- **`volcard.html` & `volcard.css`:**
  - Giao diện Kinh Thư Cổ Đại (Ancient Spellbook Lexicon) với cuộn giấy vàng và khung gỗ sồi tối.
  - Khắc phục triệt để lỗi gãy chữ `POLYMORPHISM` trên mobile bằng `font-size: clamp(1.35rem, 3.8vw + 0.3rem, 2.35rem); white-space: nowrap; word-break: keep-all; overflow-wrap: normal;`.
  - Phân loại màu sắc thẻ CEFR pills chuẩn xác (A1..C2).

### 5. Hồ Sơ Nhân Vật & Lựa Chọn Đơn Vị (Account Loadout Redesign)
- **`account.html`, `account.css`, `account.js`:**
  - Thiết kế Bảng Hồ Sơ Nhân Vật RPG (Character Sheet) với khung gỗ sồi và viền vàng kim.
  - Bảo toàn công thức tính toán toán học thanh EXP ($50/200\text{ XP}$, 25.0%).
  - Xóa bỏ 100% dev-speak ("FE first, BE ready", "Khóa lưu BE").

### 6. Thống Nhất Giao Diện 9 Trang & Xác Thực
- **`quiz.html`, `memory.html`, `speed-math.html`, `code-puzzle.html`, `auth.html`, `games-lite.css`, `auth.css`:**
  - Thống nhất font chữ: `Silkscreen`, `VT323`, `Be Vietnam Pro`.
  - Thống nhất thanh điều hướng Dark Oak Tavern `#241a14` với 5 liên kết chuẩn.
  - Chuyển hóa 100% nội dung sang cốt truyện phiêu lưu hiệp sĩ thuần khiết.

### 7. Bộ Kiểm Thử Chất Lượng Hình Ảnh & Đạt Chuẩn WCAG 2.2 AA
- **`src/main/resources/tools/test_p4b_verification.py`:**
  - Xây dựng bộ kiểm thử 43 tiêu chí: **43/43 PASSED**.
  - Độ tương phản WCAG 2.2 AA từ 5.36:1 đến 17.14:1 (chuẩn $\ge 4.5:1$).
  - `check_case_sensitivity.py`: 129/129 URLs Phaser đạt chuẩn 100%.
  - `smoke_check.py`: 0 lỗi cú pháp, 0 thiếu DOM ID, 0 hỏng đường dẫn.

---

## [P4-A] — 24/11/2026: Vercel Preview Deployment, Static Routing & Asset Case-Audit

### 1. Cấu hình Vercel Static Routing & Clean URLs
- **`src/main/resources/FrontEnd/vercel.json` & `vercel.json` (Root):**
  - Cấu hình rewrites tĩnh chuẩn xác cho toàn bộ 11 routes trang: `/`, `/app`, `/app/home`, `/app/auth`, `/app/minigame`, `/app/quiz`, `/app/volcard`, `/app/memory`, `/app/speed-math`, `/app/code-puzzle`, `/app/account`.
  - Ánh xạ đường dẫn `/ui/assets/**` về `/assets/**` và `/ui/src/**` về `/src/**`.
  - Refresh trang trực tiếp 100% không bị 404.
  - Không sử dụng catch-all rewrite đưa `/api/**` về `home.html`, đảm bảo các request API khi không có backend sẽ trả về mã 404 sạch để kích hoạt graceful fallback trong frontend JS.

### 2. Kiểm toán Tài nguyên & Phân biệt Hoa/Thường (Linux Case Sensitivity)
- **`src/main/resources/tools/check_case_sensitivity.py`:**
  - Viết công cụ tự động kiểm tra đối chiếu phân biệt chữ hoa/thường trên toàn bộ 348 file tĩnh và 129 URLs hoạt ảnh Phaser động từ `raid-config.js`.
  - Kết quả: **0 missing assets, 0 case mismatches** (100% tài nguyên tương thích môi trường Linux của Vercel).

### 3. Nâng cấp Giao diện Chế độ Xem trước (Preview Mode UX Polish)
- **`minigame.js`, `home.js`, `account.js`, `auth.html`:**
  - Bổ sung chip và thông báo Preview Mode rõ ràng, giải thích trải nghiệm demo độc lập không có kết nối cơ sở dữ liệu.
  - Modal kết thúc trận đấu hiển thị `PREVIEW` mode chuẩn xác, không ghi nhận điểm hoặc XP ảo vào DB.

### 4. Triển khai Production & Probe Trực tiếp (Live Probe Verification)
- **Production URL:** `https://gamified-learning-platform-sandy.vercel.app`
- **Deployment URL:** `https://gamified-learning-platform-82avq2pma-mky0624.vercel.app` (Deployment ID: `dpl_C3Vqob2As8xs3CAX71DWcyjrRBk2`).
- **`src/main/resources/tools/probe_deployment.py`:**
  - Probe tự động toàn bộ 16 routes và tài nguyên tĩnh: 16/16 endpoints đạt **HTTP 200 OK (0 FAIL)**.
  - Route `/api/lex-raid/test` trả về đúng HTTP 404 sạch, không bị ghi đè.
  - Direct refresh trên trình duyệt hoạt động ổn định 100%.

### 5. Tài liệu Nghiệm thu & Hướng dẫn Deploy
- **`docs/VERCEL_DEPLOYMENT.md`:**
  - Xuất bản tài liệu nghiệm thu triển khai Vercel, bảng ma trận route, kết quả probe thực tế và hướng dẫn kiểm thử.

---

## [P3-POST-AUDIT] — 23/11/2026: Reward Data Integrity, Concurrency Locking & Battle UI Polish

### 1. Toàn vẹn Dữ liệu Thưởng & Chống Hack Điểm (Reward Data Integrity)
- **`LexRaidServiceImpl.java` & `CoreWordGuessEventRepository.java`:**
  - Backend tự tính toán điểm tin cậy (`verifiedScore = wordScore + guessScore`) từ danh sách sự kiện hợp lệ đã lưu trong DB (`WordSubmitEvent` và `CoreWordGuessEvent`).
  - Trạng thái chiến thắng (`verifiedWon`) được xác thực độc lập từ lượng máu còn lại của Boss (`bossHpRemaining <= 0` hoặc trạng thái hợp lệ trên backend).
  - Không cho phép client gửi giá trị `totalScore` hoặc `resultCode: WON` tùy tiện để lấy thưởng; nếu phát hiện hành vi gửi điểm giả mạo mà không có event log hợp lệ và boss chưa chết, điểm số được gán về 0, kết quả là LOST và 0 XP / 0 Coins.

### 2. Khóa Bi quan & Tuần tự hóa Đồng thời (Concurrent Locking & Idempotency)
- **`GameSessionRepository.java` & `UserRepository.java`:**
  - Bổ sung `findByIdForUpdate` với `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`WITH (UPDLOCK, ROWLOCK)` trên SQL Server).
- **`RpgProgressionServiceImpl.java` & `LexRaidServiceImpl.java`:**
  - `applyReward`: Khóa hàng dữ liệu của `User` trước khi tính toán và ghi nhận XP/Coins mới, ngăn chặn triệt để hiện tượng mất cập nhật (lost update) khi nhiều session của cùng 1 user kết thúc đồng thời.
  - `finishSession`: Kiểm tra trạng thái `COMPLETED` ngay đầu hàm; session đã hoàn thành là bất biến (immutable), không cho phép gọi lặp lại để nhận thưởng nhiều lần.

### 3. Kiểm tra Tính Hợp Lệ Đề & Đáp Án Quiz (Quiz Integrity Validation)
- **`QuizServiceImpl.java`:**
  - Kiểm tra ràng buộc câu trả lời được chọn phải thuộc về chính câu hỏi đang nộp (`selected.getQuestion().getQuestionId().equals(question.getQuestionId())`), chống tráo đáp án đúng từ câu hỏi khác.
  - Kiểm tra câu hỏi phải thuộc đúng `QuestionSet` của session hiện tại (đối chiếu qua `metadataJson`), chống nộp câu hỏi từ đề khác.
  - Chặn nộp trùng câu hỏi đã trả lời trong session (`quizAttemptRepository.existsByGameSession...`).
  - Chặn nộp câu hỏi vào session đã `COMPLETED`.

### 4. Sửa Lỗi Toán học Thanh EXP Tài khoản (Account XP Bar Math)
- **`account.js`:**
  - Tính chính xác khoảng cấp độ: `const levelSpan = xpInLevel + xpNeeded;`.
  - Hiển thị đầy đủ thông số: `${xpInLevel}/${levelSpan} XP (${xpTotal.toLocaleString('vi-VN')} tổng)` và `Còn ${xpNeeded.toLocaleString('vi-VN')} XP tới cấp tiếp theo (${progressPercent.toFixed(1)}%)`.
  - Đã xác minh toán học: Tại 150 XP $\rightarrow$ Level 2, 50/200 XP, Còn 150 XP tới cấp tiếp theo (25.0%).

### 5. Giao diện Kết quả Trận đấu 4 Trạng thái (Battle Result UI Polish)
- **`minigame.js`:**
  - Xóa bỏ việc hiển thị số XP/Coins ảo trước khi server xác nhận.
  - Triển khai hàm `renderBattleResultOverlay(stateType, data, win)` với 4 trạng thái độc lập:
    - `PENDING`: "Đang xác nhận..." trong khi chờ backend phản hồi.
    - `CONFIRMED`: Hiển thị số XP, Gold và sao chính thức được backend trả về; kèm banner Level Up nếu thăng cấp.
    - `ERROR`: "Chưa lưu (Lỗi mạng)", thông báo không kết nối được máy chủ, không ghi nhận thưởng ảo.
    - `PREVIEW`: Chế độ xem trước (không có session id), thông báo không tích lũy phần thưởng.

### 6. Bộ Kiểm thử Đơn vị Mở rộng (Extended Unit Test Suite)
- **20/20 Unit Tests PASS trên Java 21 LTS:**
  - `RpgProgressionServiceTest`: 9/9 tests PASS (+2 tests: toán học thanh EXP 150 XP, giả lập khóa bi quan User).
  - `LexRaidProgressionTest`: 4/4 tests PASS (+1 test: từ chối điểm số và kết quả WON giả mạo).
  - `QuizProgressionTest`: 5/5 tests PASS (+3 tests: chống tráo đáp án, chống tráo đề thi, chống nộp trùng câu hỏi).
  - `AccountProfileServiceTest`: 2/2 tests PASS.

---

## [P3-A & P3-B & P3-C & P3-D & P3-E & P3-F & P3-G] — 23/11/2026: Phase P3 Master Delivery

### 1. RPG Progression Engine & Level Mathematics (P3-A & P3-B)
- **`src/main/java/org/example/service/RpgProgressionService.java` & `RpgProgressionServiceImpl.java`:**
  - Xây dựng đường cong cấp độ bậc hai chuẩn $O(1)$: $L = \max(1, \lfloor (1 + \sqrt{1 + X / 12.5}) / 2 \rfloor)$. Cấp 1 tại 0 XP; ngưỡng L1: 0-99 XP, L2: 100-299 XP, L3: 300-599 XP, L5: 1000-1499 XP, L10: 4500+ XP.
  - Công thức tính thưởng Lex Raid (WON/LOST, có trần chống lạm phát) và Quiz.
  - Phương thức `applyReward(User user, int xpEarned, int coinsEarned)` cập nhật `User` (`xp_total`, `level_current`, `coins`) và phát hiện chính xác thăng cấp đơn hoặc nhảy cóc nhiều cấp độ.
- **DTOs:**
  - `LevelProgressDto.java`: Cung cấp chi tiết level, xpBase, xpNext, xpCurrentInLevel, xpNeededForNextLevel, progressPercent.
  - `UserRewardResultDto.java`: oldLevel, newLevel, levelUpOccurred, levelsGained, xpEarned, coinsEarned, newXpTotal, newCoins.
  - `PlayerProfileDto.java`: Toàn bộ chỉ số thực tế của người chơi từ DB.

### 2. Idempotency & Anti-Double Reward (P3-C & P3-D)
- **`src/main/java/org/example/service/LexRaidServiceImpl.java`:**
  - Khắc phục triệt để lỗi người chơi không bao giờ được cộng thưởng vào thực thể `User`.
  - Triệt tiêu lỗi nhận thưởng nhiều lần (Double Reward) do reload trang hoặc gọi lặp lại `/finish`: Bổ sung guard check `if (COMPLETED.equalsIgnoreCase(gameSession.getStatus())) return;`.
  - Tách riêng `updateStageWordProgress` (cập nhật từ tìm thấy khi chơi) và `updateStageProgressOnCompletion` (chỉ cập nhật kết quả ải khi session kết thúc).
  - Bảo toàn số sao kỷ lục: Sử dụng `Math.max(existingStars, newStars)`, ngăn chặn việc hạ sao khi chơi lại ải với điểm thấp hơn.
- **`src/main/java/org/example/service/QuizServiceImpl.java`:**
  - Tính toán và trao thưởng thực tế XP/Coins vào `User` khi kết thúc câu hỏi cuối cùng của quiz.
  - Từ chối việc nộp câu hỏi vào session đã `COMPLETED`.

### 3. Player Profile API & Backend Integration (P3-E)
- **`src/main/java/org/example/controller/AccountController.java` & `AccountServiceImpl.java`:**
  - Thêm endpoint `GET /api/v1/account/profile?userId={userId}`.
  - Tổng hợp số ải đã vượt qua (`stagesCleared`), tổng trận đấu (`totalBattles`), điểm cao nhất (`bestScore`), loadout và thanh tiến độ EXP.
  - Tự động phục hồi / đồng bộ (self-healing) `level_current` trong bảng `users` nếu phát hiện lệch so với công thức toán học.

### 4. Pixel RPG Frontend Polish & Real Data Sync (P3-F)
- **`minigame.html`, `minigame.css`, `minigame.js`:**
  - Nâng cấp Modal Kết thúc Trận đấu (`#finishOverlay`) thành Pixel RPG Battle Result Modal hoàn chỉnh: Cờ Victory/Defeat, đánh giá số sao (★★★), EXP nhận được, Gold Coins nhận được, điểm số, và banner LEVEL UP có hiệu ứng chuyển động ăn mừng khi thăng cấp.
  - Tự động cập nhật `auth` local và Navigation bar ngay khi kết thúc trận đấu.
- **`account.html`, `account.css`, `account.js`:**
  - Tích hợp thẻ thông tin người chơi: Huy hiệu cấp độ, thanh EXP Progress Bar (`.pixel-bar`) kèm % tiến độ, số dư Gold, chuỗi ngày học Streak, và lưới RPG Metrics (Stages Cleared, Total Battles, Best Score).
- **`home.js`, `api.js`, `games-lite.js`:**
  - Bổ sung `window.appApi.getAccountProfile(userId)`.
  - Quiz completion hiển thị phần thưởng EXP & Gold, kèm thông báo thăng cấp.

### 5. Automated Tests & Quality Assurance (P3-G)
- **14/14 Unit & Integration Tests PASS trên Java 21 LTS:**
  - `RpgProgressionServiceTest` (7/7 tests PASS).
  - `AccountProfileServiceTest` (2/2 tests PASS).
  - `LexRaidProgressionTest` (3/3 tests PASS).
  - `QuizProgressionTest` (2/2 tests PASS).
- **`docs/P3_PROGRESSION_DESIGN.md` & `docs/P3_REWARD_TEST_REPORT.md`:** Xuất bản tài liệu thiết kế và báo cáo kiểm thử chi tiết.

---

## [P2-A & P2-B & P2-C & P2-D & P2-E & P2-F] — 23/11/2026: Phase P2 Master Delivery

### 1. Database & Schema Audit (P2-A)
- **`src/main/resources/tools/audit_vocabulary_db.py`:**
  - Viết bộ parser đọc và giải mã file seed SQL Server `script_GPL_v2.sql` (UTF-16 LE).
  - Phân tích toàn bộ 2.098 rows trong `vocabulary_words`: 2.096 từ tiếng Anh, 2 từ tiếng Nhật (`ohayou`, `arigatou`).
  - Thống kê tỷ lệ CEFR: 75 từ có nhãn (B1: 23, B2: 41, C1: 11); 2.023 từ là `NULL` (96.43%).
  - Đánh giá khả năng ghép chữ bàn cờ 1-tile 5x5: 1.998 từ hợp lệ (95.5%), 94 từ không hợp lệ (28 từ <3 ký tự, 48 từ >10 ký tự, 19 từ có dấu gạch/kí tự đặc biệt).
- **`docs/P2_VOCABULARY_AUDIT.md` & `Agent & Skill/docs/P2_VOCABULARY_AUDIT.md`:**
  - Xuất bản báo cáo kiểm toán đầy đủ 9 bảng số liệu và đề xuất kỹ thuật.

### 2. Architecture & Taxonomy Design (P2-B)
- **`docs/P2_VOCABULARY_DESIGN.md` & `Agent & Skill/docs/P2_VOCABULARY_DESIGN.md`:**
  - Định hình kiến trúc 2 trục độc lập: Trục 1 (CEFR A1-C2 + UNKNOWN/NULL theo sense-level với grounding học thuật nghiêm ngặt) và Trục 2 (IT Tier: Foundation, Practitioner, Advanced, Specialist).
  - Chuẩn hóa danh mục 35 IT Domains (Computer Fundamentals, OS, Networks, OOP, DSA, Backend API, DevOps, Containers, Cloud, AI/ML, Cybersecurity,...).
  - Xác lập quy tắc phân loại `boardEligible = true` (từ đơn 3..10 ký tự [A-Za-z]) vs `boardEligible = false` (cụm từ nhiều chữ cho Flashcard/Quiz).
- **`src/main/resources/db/migration/V2__vocabulary_senses_cefr_it.sql`:**
  - Soạn thảo lược đồ mở rộng an toàn (non-breaking) cho bảng `vocabulary_word_senses` và `it_curriculum_domains` (draft migration, không áp dụng trực tiếp lên DB live).

### 3. Data Importer Pipeline & DRY RUN (P2-C)
- **`src/main/resources/tools/vocabulary_importer.py`:**
  - Pipeline CLI kiểm tra dữ liệu từ vựng với chế độ `--dry-run` mặc định.
  - Chuẩn hóa Part of Speech (POS): `n.` -> `noun`, `v.` -> `verb`, `adj.` -> `adjective`, `adv.` -> `adverb`, `prep.` -> `preposition`, `conj.` -> `conjunction`, `phrase`.
  - Kiểm tra tính hợp lệ trên bàn cờ (`boardEligible`), kiểm tra CEFR và IT domains, phát hiện trùng lặp với 2.098 từ trong seed database.
- **`src/main/resources/tools/test_vocabulary_importer.py`:**
  - Bộ kiểm thử tự động 3/3 tests PASS: `test_pos_normalization`, `test_board_eligibility`, `test_validation_pipeline_dry_run`.
- **`docs/P2_IMPORT_DRY_RUN_REPORT.json` & `Agent & Skill/docs/P2_IMPORT_DRY_RUN_REPORT.json`:**
  - Báo cáo chạy thử nghiệm 26 mục mẫu: 26 hợp lệ, 0 rejected, 22 board-eligible, 4 flashcard-only, 0 hallucinated CEFR.

### 4. Backend Services Enhancement (P2-D & P2-E)
- **`src/main/java/org/example/dto/VocabularyWordDto.java`:**
  - Bổ sung các trường tùy chọn: `normalizedText`, `itDomain`, `itTier`, `boardEligible`. Duy trì tương thích JSON 100%.
- **`src/main/java/org/example/service/VolcardService.java` & `VolcardServiceImpl.java`:**
  - Mở rộng phương thức `getCards(vocabularySetId, offset, limit, cefrLevel, search)`.
  - Lọc theo cấp độ CEFR linh hoạt (A1, A2, B1, B2, C1, C2, UNKNOWN/NULL, ALL).
  - Tìm kiếm từ vựng theo thời gian thực hai chiều (tiếng Anh và tiếng Việt).
  - Chuẩn hóa Part of Speech và fallback định nghĩa khi `meaning_en` là NULL.
- **`src/main/java/org/example/controller/VolcardController.java`:**
  - Tiếp nhận query params `@RequestParam(required = false) String cefrLevel` và `@RequestParam(required = false) String search`.
- **`src/main/java/org/example/service/LexRaidServiceImpl.java`:**
  - Tối ưu hóa thuật toán `buildBoard()`: Loại bỏ sinh ngẫu nhiên đồng đều `A-Z` (vốn chỉ có 19% nguyên âm), thay thế bằng bảng tần suất chữ cái chuẩn tiếng Anh (~42% nguyên âm A, E, I, O, U và phụ âm thông dụng T, N, S, R, H, L, D, C, M, P) khắc phục triệt để tình trạng thiếu nguyên âm (vowel starvation).
  - Đảm bảo ghép từ thành công: Bố trí các chữ cái của `coreWord` và 1-2 từ vựng phụ (`topicWords`) vào các vị trí ưu tiên gần tâm bàn cờ theo khoảng cách Manhattan.
  - Lọc bỏ triệt để từ tiếng Nhật và từ không hợp lệ khỏi Lex Raid battle runtime.

### 5. Frontend UI & UX Polish (P2-F)
- **`src/main/resources/FrontEnd/assets/js/api.js`:**
  - Cập nhật `getVolcardCards(setId, offset, limit, cefrLevel, search)` hỗ trợ truyền params lọc lên backend.
- **`src/main/resources/FrontEnd/src/pages/volcard.html` & `assets/css/volcard.css`:**
  - Tích hợp `pixel-rpg.css` và hệ thống khung viền gỗ sẫm `.pixel-panel`.
  - Bổ sung thanh 8 nút lọc CEFR Pills (Tất cả, A1, A2, B1, B2, C1, C2, Chưa gán).
  - Bổ sung ô tìm kiếm từ vựng tiếng Anh / tiếng Việt có icon và bo góc retro.
  - Thiết kế thẻ lật Flashcard 2 mặt với huy hiệu Pixel RPG cho POS, CEFR Level, IT Domain, IT Tier.
  - Tích hợp nút phát âm Web Speech API TTS (`ttsBtn`) kèm disclaimer về chất lượng giọng máy.
  - Bổ sung nút điều hướng trước/sau: Trước (`prevBtn`), Lật thẻ (`flipBtn`), Tiếp (`nextBtn`).
- **`src/main/resources/FrontEnd/assets/js/volcard.js`:**
  - Quản lý trạng thái bộ lọc `cefrFilter`, tìm kiếm debounce `searchQuery`, TTS Web Speech API phát âm chuẩn `en-US`.
- **`src/main/resources/FrontEnd/src/pages/quiz.html`:**
  - Tích hợp `pixel-rpg.css` đồng bộ phong cách Pixel RPG.

---

## [P1-A & P1-B & P1-C & P1-D] — 23/11/2026: Pixel RPG Design System & Java 21 LTS
- Nâng cấp Java 21 LTS, Spring Boot 4.2.0, Lombok 1.18.36.
- Thiết lập Pixel RPG Design System tokens trong `pixel-rpg.css`.
- Đồng bộ giao diện Lex Raid Battle và Home Page.

---

## [P0-Finalization] — 23/11/2026: Animation, Battle Loop & Mobile Responsive
- Căn chỉnh trọng tâm chân Hero & 9 Boss Quái vật (baseline Y=350).
- Khắc phục 9 kịch bản hồi quy và race conditions trong gameplay.
- Tối ưu hóa giao diện di động 320x568 không cần cuộn trang.
