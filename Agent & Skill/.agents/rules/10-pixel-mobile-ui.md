---
trigger: model_decision
description: "Use for any mobile layout, word-board, attack-dock, pixel HUD or responsive UI work in Lex Raid."
---
# Pixel Mobile UX rules
- Preserve the game loop: battlefield + boss HP feedback, word board, selected word, Clear/Attack actions must be jointly usable without repeated vertical scrolling during active combat.
- Test 320x568, 360x800, 390x844, 430x932, 1366x768 and 1440x900; account for safe-area insets and mobile browser viewport changes.
- Keep hit targets ~44 CSS px when feasible; if board width cannot accommodate every column, implement an explicit playable policy (tap-to-select and a defined zoom/pan strategy), not tiny illegible tiles.
- No copied Bookworm Adventures assets. Build original pixel frame, icons, HUD, panel grid and sprites. Avoid smooth blur and generic dashboard cards in game UI.
- Check keyboard focus, touch tap, swipe, drag cancellation, stacking contexts, overlays, and end-of-battle dialogs.
- See `prompts/PHASE_0_PIXEL_UI.md` and `docs/UX_UI_SPEC.md`.
