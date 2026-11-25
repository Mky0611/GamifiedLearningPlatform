# P4-B.3 Execution Plan — RPG Combat, English Learning Loop & Cozy Fantasy Themes

## 1. Branch & Scope
- **Base commit**: `2491615` (`feature/p4b2-kingdom-of-words`)
- **Working branch**: `feature/p4b3-rpg-combat-learning` (P4-B.2 branch kept untouched for rollback)
- **Goal**: Upgrade Lex Raid gameplay, battle arena layout, global English lexicon + topic bonus, guided learning loop, 5-wave encounter + Boss mechanics, Spell registry, Daylight/Moonlight cozy themes, backend compatibility, hardened Chromium QA & Vercel Preview deploy.
- **Preserved Invariants**: Java 21, Spring Boot 4.2.0, SQL Server schema (no unapproved DDL/DML), `SecurityConfig`, P2 Vocabulary Engine, P3 XP/Coin progression integrity, Phaser 3.90 + Canvas fallback, existing routes.

## 2. Baseline Root Causes Verified
1. `minigame.css` capped `.battle-stage` height (`clamp(165px, 24.5vh, 248px)`) inside a `960:420` aspect-ratio lock while side panels consumed 472px horizontally, leaving empty side gutters and tiny Knight/Boss sprites.
2. `LexRaidServiceImpl.submitWord()` validated only against `findByVocabularySetVocabularySetIdAndNormalizedText(...)`, blocking valid general English words and lacking board-tile verification (free-pick, no tile reuse).
3. `LexRaidServiceImpl` path check still had unused adjacency rejection (`dr > 1 || dc > 1`), while UI lets players pick non-adjacent tiles.
4. No Daylight/Moonlight cozy theme toggle across pages; learning pages used heavy dark panels; Word Board used chunky `Silkscreen` font reducing `W/M/I/L` legibility.

## 3. Milestones & Verification Gates
| Milestone | Focus | Key Deliverables | Verification Gate |
|---|---|---|---|
| **A** | Large Battle Arena & HUD | Expanded arena focus (`280–360px` desktop responsive), larger Knight/Boss (`~30–50%` visible height increase), rarity scaling (`Normal/Elite/Guardian/Chapter Boss`), compact top/integrated Hero & Boss HUD, visible Boss phase/telegraph bar, legible `Be Vietnam Pro` board tiles | Browser measurement across all 9 viewports (`320x568..1920x1080`), 0 clipping/overlap, Canvas fallback parity |
| **B** | Global English Lexicon & Combat Balance | Verified offline English lexicon (`en-wl/wordlist` 12Dicts / SCOWL MIT/BSD/PD + DB vocab fallback), centralized `CombatBalanceConfig` & `combat-balance.js`, 9-step validation (normalize, coords, board match, no reuse, lexicon, no duplicate, topic bonus, core word, combat), non-nullable-safe `WordSubmitEvent` (`vocabularyWord = null` for global words) | Java unit tests (`LexRaidServiceImpl`) + browser valid/invalid/topic/duplicate/reuse checks |
| **C** | Learning Loop (Hints, Solvable Board, Journal & Review) | Rich compact Word Feedback toast (word, dmg, mana, +30% topic bonus, meaning/IPA/Web Speech TTS when data exists — zero fabricated meanings), Hint dock (meaning, length, 1st letter, reveal letter, board refresh), solvable letter-frequency board generator, Word Journal & Post-Battle Review + Volcard handoff | Multi-seed board solvability test + browser hint/feedback/review test |
| **D** | 5-Wave Encounter & Boss Mechanics | Practice vs Campaign difficulty progression (Chapter 1 gentle/45s -> tighter later chapters), timer starts only when playable & pauses on modals/help/preview, 5-wave encounter (`Normal -> Normal -> Elite -> Guardian -> Chapter Boss`), seeded weighted random encounter pool, distinct boss behaviors & telegraphs | 5-wave run test, seeded reproducibility, Boss telegraph & mechanics check + migration/API draft for unpersisted encounter/spell fields |
| **E** | Spell Registry & VFX | Preserved 6 Knight skills + extended Spell Registry (`Fire Blade`, `Frost Seal`, `Thunder Strike`, `Royal Guard`, `Sacred Recovery`, `Lexical Judgment`, `Heavy Slash`, `Blade Storm`), chapter/hero-filtered hotbar, pooled Tiny Pixel FX / Sword Slash / Mira Forge VFX, strict Preview vs Backend separation | Spell unlock/mana/cooldown/status effect/animation sync tests |
| **F** | Daylight & Moonlight Cozy Themes | Shared `theme.css` + `theme-system.js` (`data-theme="light"/"dark"`, no reload flash, `localStorage` + system default, navbar Sun/Moon button), cozy palettes across Home/Volcard/Quiz/Account/Auth/Memory/Speed-Math/Code-Puzzle, biome-tuned Combat Theme that restores user preference on exit | Theme switch & persistence test across pages + WCAG contrast check |
| **G** | Backend Integration & Full QA | Clean `LexRaidServiceImpl` global lexicon + board + balance integration, P3 reward integrity preserved, draft migration/API doc (`docs/P4B3_BACKEND_DRAFT.md`), expanded `chromium_p4b2_acceptance.js` covering all 9 viewports + gameplay + perf | `mvn test` (Java 21) + Chromium `0` failures + perf telemetry |
| **H** | Vercel Preview Deployment | Deploy new Vercel Preview (**NO `--prod`**), verify live build version / commit SHA, assets, themes, battle interactions, and clear Preview vs Backend labels | Live Preview browser + HTTP verification |
