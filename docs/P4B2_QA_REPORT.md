# P4-B.2 Visual, Interactive & Real Browser QA Report — Kingdom of Words

**Branch:** `feature/p4b2-kingdom-of-words` (base: `7e725ed`)  
**Scope:** Asset-driven Fantasy Pixel RPG redesign, 9-slice UI assembly, World Environments, BattleScene State Machine + Pooled VFX, Knight Skill Bar (Preview Mode), Monster Expansion Preview (`Verdant Slime`, `Cursed Skeleton`), and all-page UX refinement.  
**Note on Evidence Classification:** Every check below strictly separates `STATIC PASS` (disk/code checks), `BROWSER PASS` (real headless Chrome CDP run in `test_output/p4b2_browser/browser_qa_report.json`), and `NOT TESTED` (live Java 21 / Spring Boot + SQL Server runtime).

---

## 1. Automated Verification Summary

| Suite / Command | Classification | Scope | Result |
|---|---|---|---|
| `src/main/resources/tools/audit_ui_extra.py` | `STATIC PASS` | Audited `UI Extra` (`3,676` raw, `2,881` non-OS, `428` Tiny Swords `LICENSE_PENDING` isolated) | `0` errors |
| `src/main/resources/tools/curate_p4b2_assets.py` | `STATIC PASS` | Fixed cursor swap (`cursor-action` <-> `cursor-forbidden`), assembled 13 contiguous 9-slice/3-slice sheets, curated 113 runtime assets into `FrontEnd/assets/` | `0` errors |
| `src/main/resources/tools/check_case_sensitivity.py` | `STATIC PASS` | `468` indexed files on disk, `130` Phaser URLs | `0` missing / `0` mismatch |
| `src/main/resources/tools/test_p4b_verification.py` | `STATIC PASS` | Sprite baseline math, logo/portrait weight bounds, nav & contrast checks | `43 / 43 STATIC PASS` |
| `Agent & Skill/scripts/chromium_p4b2_acceptance.js` | `BROWSER PASS` | Headless Chrome CDP (`C:\Program Files\Google\Chrome\Application\chrome.exe`): 9 pages (desktop & mobile), typography, Volcard, 9 Battle viewports, Skill Bar + VFX pool + FSM reset, Slime & Skeleton preview, World pause/resume, Canvas fallback | **0 failures** |
| Spring Boot + SQL Server Live End-to-End Flow | `NOT TESTED` | Backend persistence (`/api/v1/**` returns `404` in static preview server by design) | **NOT TESTED** |

---

## 2. Real Headless Chromium Verification Details (`test_output/p4b2_browser/`)

1. **All 9 Pages (Desktop `1366x768` & Mobile `390x844`):**
   - `home`, `minigame`, `volcard`, `account`, `quiz`, `memory`, `speed-math`, `code-puzzle`, `auth`
   - Horizontal overflow: `false` across all 18 runs.
   - Brand emblem loaded cleanly (`logo-mark.png`, `192x192`), Kibyra `32x32` navbar icons `naturalWidth > 0`, `0` page errors, `0` non-API failed requests.
   - `WorldEnvironment` initialized matching biome (`village`, `mountain-dusk`, `forest`, `gate`, `academy`, `waterfall`) with layers > 0.
2. **Typography (`/app/typography`):**
   - Chromium `document.fonts.check(...)` confirmed all fonts loaded: `loraLoaded: true`, `pixelifyLoaded: true`, `beVietnamLoaded: true`, `jetbrainsMonoLoaded: true`, `silkscreenLoaded: true`.
3. **Volcard (`320x568`, `390x844`, `1366x768`):**
   - `POLYMORPHISM` & `CONTINUOUS INTEGRATION` rendered without clipping (`clippedX: false`).
4. **Battle Arena Across All 9 Viewports:**
   - `320x568`: `fit=true (543/568)`, `tap=true`, `clear=true`, `attack=true`, `skills=6`
   - `360x800`: `fit=true (543/800)` | `390x844`: `fit=true (637/844)` | `430x932`: `fit=true (648/932)`
   - `768x1024`: `fit=true (924/1024)` | `1024x768`: `fit=true (715/768)` | `1366x768`: `fit=true (715/768)`
   - `1440x900`: `fit=true (733/900)` | `1920x1080`: `fit=true (927/1080)`
5. **P4-B.2 Combat Polish, QA Hook Gating, 6 Knight Skills & Performance Telemetry (`BROWSER PASS`):**
   - **Normal Deployment Hook Restriction:** `/app/minigame` without `?qa=1` verified `__LEX_RAID_TEST_HOOKS__ === undefined` and `__LEX_RAID_SCENE_STATE__ === undefined`.
   - **6 Knight Skills (`?qa=1`):** `Knight Slash` (`0 MP`), `Heavy Slash` (`2 MP`, `CD:2T`), `Royal Guard` (no HP heal; mitigates next boss hit `100 -> 98` HP & reflects 6 frost dmg), `Blade Storm` (blocked at `combo=1`, unlocked at `combo>=2`), `Sacred Recovery` (`+18 HP` heal), `Lexical Judgment` (blocked at `revealed=0`, unlocked after Core Word clue reveal), Hero compatibility (`Archer` blocks Warrior sword skills), `finished` state disable, and mocked Backend Mode (`raidSessionId: 9001` disables all 6 skill chips cleanly).
   - **Animation Frame Sync & Edge Cases:** Rapid-click protection (`busyDuringAttack: true`, 2nd click blocked), mid-animation `resetSceneActors()` & mid-animation viewport resize settled cleanly (`IDLE`, `heroX: 326, heroY: 350, bossX: 630, bossY: 350, activeVfxCount: 0, pendingTimers: 0`). `Slime` & `Skeleton` verified across both Phaser (`?qa=1`) and Canvas 2D fallback (`?renderer=canvas&qa=1`). `WorldEnvironment` pause/resume and `prefers-reduced-motion: reduce` verified.
   - **Measured Performance (`browser_qa_report.json`):** Home Desktop `66 reqs / 668,185 B`; Minigame Normal `402 reqs / 1,961,850 B`; Combat Frame Timing (`74` rAF samples): `avg 16.67 ms`, `p95 16.80 ms`, `max 16.80 ms`, `longTaskCount: 0`, VFX `poolSize: 12` (`activeVfxAfterCombat: 0`), Heap `11,544,720 B -> 16,962,060 B`.

---

## 3. Attribution & License Hygiene
- `UI Extra/` & `UI Extra.zip` are gitignored and never deployed.
- `Tiny Swords (Free Pack)` unverified files remain excluded (`LICENSE_PENDING`).
- Verified `Kibyra` (`Free_Medieval_Fantasy_UI_Pack/Readme.txt`), `Mira Forge` (`Free_Pixel_Fire_and_Elemental_Effects/LICENSE.txt`), and `Tiny Tileset` (`README.md`) permit free personal/commercial game integration without raw pack redistribution.
- Mandatory credit included cleanly when Waterfall biome renders: `"Waterfall pixel art by Burcu Sak"` (documented in `docs/P4B2_THIRD_PARTY_ASSETS.md`).
