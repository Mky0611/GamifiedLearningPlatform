---
name: mobile-battle-viewport
description: "Fix mobile UX so arena, word selection and attack actions work without repeated scroll."
---
# mobile-battle-viewport
## Workflow
1. Reproduce on 320x568, 360x800, 390x844, 430x932, tablet and laptop. Capture initial viewport and active combat states.
2. Inspect actual DOM source and DOM order. Record stage/board/dock height in CSS pixels, scroll height and viewport safe area.
3. Convert battle to compact playable mobile composition, with consistent viewport units and browser-toolbar/safe-area handling.
4. Keep touch targets usable. Use tap selection; do not trap page scroll outside board. Resolve inline board grid sizing before adding new media queries.
5. Test selecting letters, Clear, Attack, results, keyboard and screen reader labels; include screenshot diffs.
