---
name: phaser3-sprite-alignment
description: "Diagnose Phaser 3 actor spritesheets, alpha bounds, feet baseline and animation race conditions."
---
# phaser3-sprite-alignment
## Workflow
1. Read `assets/js/phaser/raid-config.js`, `battle-scene.js`, `raid-phaser-embed.js` and spritesheets; confirm actual paths in archive.
2. Measure frame width/height and alpha bbox for all relevant animation frames, including Idle, Attack, Hit, Death.
3. Define per-animation feet offset and shared groundY. Test shadow alignment and switching animation without position jump.
4. Distinguish actor baseX/baseY from tween delta; avoid resetting tween x/y in `applyState`.
5. Align Phaser render dimensions and Canvas fallback with the same logical stage geometry.
6. Inspect browser output at normal and high DPR and verify pixelated rendering; no untested claims.
