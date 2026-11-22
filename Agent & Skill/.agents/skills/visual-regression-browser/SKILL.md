---
name: visual-regression-browser
description: "Run repeatable browser/mobile regression checks for Lex Raid game screens."
---
# visual-regression-browser
## Workflow
1. Start local backend or supported preview safely; confirm it responds before browser automation.
2. Use Playwright or Antigravity built-in browser only when actually available; capture baseline screenshots for specified viewport sizes.
3. Test click/tap on first/last word tiles, show boss HP/hero HP, Attack, popup and stage completion.
4. Test resize, orientation, text overflow, layout shift, missing images, JS console exceptions and blocked pointer targets.
5. Compare screenshots with explicit thresholds and manually inspect false positives from animations.
6. Report test name, command, observed result and screenshot path; never invent a pass.
