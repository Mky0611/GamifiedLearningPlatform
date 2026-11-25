# P4-B.3 Combat Balance & Progression Specification

## 1. Centralized Balance Configuration
All damage, mana, bonus, and progression values are centralized in:
- **Backend (`Java`):** `org.example.config.LexRaidBalanceConfig`
- **Frontend (`JS`):** `src/main/resources/FrontEnd/assets/js/combat-balance.js` (`window.LexRaidBalance`)

## 2. Word Classification & Damage Formula
| Word Tier | Definition | Damage Formula | Mana Gain | DB Reward / Mastery |
| :--- | :--- | :--- | :--- | :--- |
| **Normal (Global)** | Valid English word (`>= 3` letters) in offline `en-wl` / SCOWL lexicon & formable from board without tile reuse | `base = len * 5 + combo * 2` | `clamp(floor(len / 2), 1, 6)` | Logged as `WordSubmitEvent` (`wordType = "GLOBAL"`, `vocabularyWord = null`); NO fake mastery |
| **Topic Word** | Valid word belonging to the Stage's `VocabularySet` / `Topic` | `round(base * 1.30)` (`+30%` Topic Bonus) | `clamp(floor(len / 2) + 1, 1, 6)` (`+1` Topic MP) | Logged with `vocabularyWord`; updates `UserWordMastery` (`timesSeen`, `timesFound`) |
| **Long Word** | Valid word with `len >= 5` | Counts toward `LONG_WORD_COUNT` objective; `+10%` synergy flare | Included in length scaling (cap `6`) | Standard score/reward integrity |
| **Core Word** | Stage target keyword | Unlocks **Lexical Judgment** Ultimate in Combat + reveals full clue; critical damage or finishes current wave when Boss HP reaches threshold | `+2 MP` on solve (`cap 6`) | Persists `CoreWordGuessEvent` + `UserWordMastery` |

- **Mana Cap:** `MAX_MANA = 6` (never exceeds `6`; skills never have 0-cost spam loop — basic `Knight Slash` has a `1` turn cooldown when used outside word-submit or minimal preview dmg). Wait: `Knight Slash` keeps `0 MP` with `1T` cooldown (or free tactical probe with cooldown 1) so players cannot spam infinite free damage without solving words!
- **Economy Integrity:** XP (`calculateLexRaidXp`) and Coins (`calculateLexRaidCoins`) in `RpgProgressionServiceImpl` remain unchanged — combat damage scales battle pacing without inflating XP/Coin rates.

## 3. Chapter Difficulty Curve & Timer Policy
- **Practice Mode (`mode=practice`):** Untimed (no forced boss timer strike), unlimited non-spoiling hints, non-competitive (no inflated rewards).
- **Campaign Mode (`mode=campaign`):**
  - **Chapter 1:** `45s / turn`, basic boss strikes, `3` free hints per encounter.
  - **Chapter 2:** `38s / turn`, Shield Stance & Slime Regen introduced, `2` hints.
  - **Chapter 3:** `32s / turn`, Counter & Rune Shield active, `2` hints.
  - **Chapter 4+:** `26s / turn`, full phase telegraphs & armor mechanics, `1` hint.
- **Timer Start Rule:** Countdown starts **only** after board tiles + encounter render and transition animations settle (`!state.transitioning && !state.paused`). Pauses automatically when opening Hint, Review, Help, Boss Info modals, or when tab is hidden.

## 4. Five-Wave Encounter Curve
1. **Wave 1 (`NORMAL`):** Scale `1.0x`, base HP factor `0.75x`, gentle attack telegraph.
2. **Wave 2 (`NORMAL`):** Scale `1.05x`, base HP factor `0.85x`.
3. **Wave 3 (`ELITE`):** Scale `1.15x`, base HP factor `1.05x`, active monster trait (Regen / Shield Stance / Rage Charge).
4. **Wave 4 (`GUARDIAN`):** Scale `1.22x`, base HP factor `1.20x`, armored shield + stronger telegraph.
5. **Wave 5 (`CHAPTER_BOSS`):** Scale `1.32x`, base HP factor `1.45x`, Phase 2 trigger below `50%` HP.
