# Lex Raid — project agent contract

You are working on an EXISTING educational pixel RPG. Read `docs/SOURCE_AUDIT.md` and `prompts/MASTER_PROMPT.md` before modifying anything.

## Invariants
1. Maintain current Spring Boot + SQL Server + HTML/CSS/JS + Phaser 3 unless user explicitly approves a migration. Retain current APIs, routes, feature behavior and existing data.
2. Begin with source inventory, failing tests/repro, minimal patch, before/after screenshots and smoke regression. Work in small independently reversible changes.
3. Fix the root cause of feet baseline, animation state and responsive layout; do not hide actors, move everything with arbitrary `translateY`, or use global zoom as a band-aid.
4. Prioritize **no mandatory vertical scrolling between word tiles, current word, Attack and boss result** at 320x568, 360x800, 390x844, 430x932; allow scrolling on secondary screens.
5. For 7+ columns on narrow phones, keep touch targets usable via board zoom/pan or a clearly documented responsive gameplay policy; never silently shrink targets below 44 CSS px or change game logic unfairly.
6. Retain crisp pixel sprites. Normalize feet anchor per character and per animation after inspecting actual alpha bounds; use one coordinate system and renderer-equivalent layout.
7. Use authentic English learning: CEFR as educational classification, NOT raw word-length difficulty. Store language, lemma, sense, example, phonetics, citations/license and review status. IT topic level and CEFR are independent dimensions.
8. Preserve user data; database changes must be reversible migrations; no destructive schema reset. New content import only after license check and validation.
9. Validate auth on server, not trusted userId sent by browser; apply rewards once with idempotency.
10. Do not claim work is complete without actual tests. Distinguish code-reviewed, implemented, built, browser-tested, deployed.

## Output expected for every change
- Summary with files/lines and root cause.
- Minimal exact patch and explanation in Vietnamese.
- Tests run and observed results, screenshots where UI changes.
- Remaining risks and next small step.
- No unrequested architectural overhaul or dependencies.
