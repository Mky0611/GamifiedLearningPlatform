# P4-B.2 Architectural & Visual Decisions Log

## Decision 1 — Strict `Tiny Swords (Free Pack)` License Discipline
- `UI Extra/Tiny Swords (Free Pack)` contains 428 files with no bundled `LICENSE` file (`LICENSE_PENDING` in `docs/P4B2_ASSET_MANIFEST.json`).
- **Decision**: Do NOT redistribute or deploy unverified new files from `UI Extra/Tiny Swords (Free Pack)` (such as new Pawn/Monk/Building sheets). Instead:
  1. Reuse the **51 files already tracked in the repository** under `src/main/resources/FrontEnd/assets/` (`warrior/`, `archer/`, `lancer/`, `Warrior_Attack2.png`, `banner.png`, `woodtable.png`, `regular-paper.png`, `special-paper.png`, `big-ribbons.png`, `bigbar-base/fill.png`, `smallbar-base/fill.png`, `ui/tiny/button-*.png`, `ui/avatars/avatar-ts-*.png`, `ui/cursors/*`).
  2. Use **100% verified CC0 / Permitted packs** from `UI Extra` (`Kenney Pixel UI Pack`, `Free Medieval Fantasy UI Pack`, `Sword Slash Pixel FX v1`, `Tiny Pixel FX Vol.1`, `Free Pixel Fire & Elemental Effects v1.0.1`, `Tall Forest`, `Super Mountain Dusk`, `GothicVania Town`, `Top-Down Monsters LITE v1`, and `Pixel Art Waterfall v1.0` with mandatory credit).

## Decision 2 — Fixing Gapped 3x3 Atlases for True CSS `border-image` 9-Slice
- Visual inspection (`contact_fe_ui_panels.png`) confirmed `banner.png`, `woodtable.png`, `regular-paper.png`, `special-paper.png`, `bigbar-base.png`, `smallbar-base.png`, and `tiny/button-*-pressed.png` are **spaced 3x3 sprite grids** (separated by transparent gutters).
- **Decision**: Assemble their exact non-transparent cells cleanly into contiguous 9-slice / 3-slice PNGs under `FrontEnd/assets/ui/slices/` so CSS `border-image` renders seamless corners and edges without transparent gaps.

## Decision 3 — Swapped Cursor Bug Fix
- Visual check (`contact_cursors_and_icons_check.png`) verified `ui/cursors/cursor-action.png` contained `Cursor_03.png` (prohibition circle) while `cursor-forbidden.png` contained `Cursor_04.png` (4-corner target brackets).
- **Decision**: Swap and normalize both to `64x64` transparent PNGs at their existing paths (`cursor-action.png` = target bracket, `cursor-forbidden.png` = prohibition circle).

## Decision 4 — Dual-Script Typography Architecture (`Lora` + `Be Vietnam Pro` + `Pixelify Sans` + `JetBrains Mono`)
- Pure bitmap English pixel fonts break Vietnamese diacritics (`ă, ơ, ư, đ, ế, ệ, ộ`) or reduce paragraph legibility.
- **Decision**:
  - Brand/short uppercase ASCII labels & numeric HUD chips: `'Pixelify Sans', 'Silkscreen', monospace`
  - Fantasy narrative/hero display titles (VN-compatible): `'Lora', 'Merriweather', Georgia, serif`
  - Primary UI, Vietnamese vocabulary cards, Quiz options & buttons: `'Be Vietnam Pro', system-ui, sans-serif`
  - Code puzzles, IPA phonetics & telemetry numbers: `'JetBrains Mono', 'VT323', monospace`

## Decision 5 — Knight Skill System & Monster Expansion in Preview Mode
- **Verified Backend Constraints (`LexRaidController.java` & `LexRaidServiceImpl.java`)**:
  - Server computes `xpEarned`, `coinsEarned`, and `starsEarned` exclusively in `LexRaidServiceImpl.finalizeGameSessionAndAward(...)` using persisted `WordSubmitEvent` & `CoreWordGuessEvent` rows and server `bossHpRemaining`.
  - `LexRaidServiceImpl.applySync(...)` deliberately **ignores** client-sent `bossHpRemaining`, `bossShieldRemaining`, `manaValue`, `comboCount`, `rageValue`, `totalScore`, `status`, and `resultCode`.
  - `startSession(...)` picks a random boss from `bossRepository.findAll()` for initial HP/shield (`LexRaidSessionDto` does not include `bossId`), whereas `toStageCardDto(...)` picks a seeded boss per `stageId`.
- **Decision**:
  1. Implement the 6 Knight Skills (`Knight Slash`, `Heavy Slash`, `Royal Guard`, `Blade Storm`, `Sacred Recovery`, `Lexical Judgment`) and Monster Previews (`Verdant Slime`, `Cursed Skeleton`) strictly as **client-side Preview Mode prototypes** isolated from SQL Server writes or fake XP/Coin awards.
  2. When a live backend session (`state.raidSessionId !== null`) is active, skill casts trigger full Phaser/Canvas VFX & stance previews without desynchronizing server boss HP or `finishSession` results; in offline Vercel Preview (`raidSessionId === null`), skills demonstrate preview damage/heal/guard mechanics safely.
  3. HP gauge max scales cleanly with `Math.max(Number(boss.baseHp || 100), state.bossHp)` to prevent overflow whenever `startSession` selects a different boss from `stage.boss`.
  4. Future P5 Backend extension: if server-authoritative skills are later approved, expose `POST /api/v1/lex-raid/sessions/{id}/cast-skill` with server-side `manaValue` deduction and cooldown tracking.

## Decision 6 — Top-Down Monster LITE Adaptation
- `slime.png` and `skeleton.png` are 32x32 4-directional RPG sheets (`down/up/right/left`).
- **Decision**: Extract left-facing battle rows (`idle_left`, `move_left`, `attack1_left`, `hurt_left`, `death_left`) into horizontal Phaser/Canvas sprite strips (`assets/monsters/{slime,skeleton}/`) with measured foot anchors, and derive front-facing `48x48` HUD portraits (`idle_down 0`) so they match existing Pixel Frog bosses visually without altering existing stage data.
