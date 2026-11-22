---
name: phaser-sprite-pivots
description: Use when pixel sprites drift, jump, clip, float above ground, swap feet positions or animations interfere with Phaser tweens.
---
# Phaser Sprite Pivots

Read `AGENTS.md`, `docs/SOURCE_AUDIT.md`, and related source files. Provide Vietnamese progress and exact file-level changes.

## Workflow
1. Read animation and image config from source; inspect actual PNG frame dimensions and alpha bbox (Pillow optional `scripts/audit_pixel_assets.py`).
2. Identify visual foot anchor per *animation frame*, not just Phaser origin; prefer normalized frames with foot position consistent or a frame offset metadata map.
3. Inspect scene baseline, actor shadow, scale and camera, and `applyState` vs attack tween conflict; split logical base position from animated offsets. Avoid animation state updates resetting X mid-tween.
4. Reconcile 960x420 Phaser with 960x360 fallback and CSS aspect ratios. If web GL and canvas fallback differ, record divergence explicitly.
5. Visual assertions warrior/lancer/archer idle-run-attack-guard, boss crabby/fierce/captain/totem attack/hit/death. Record before/after screenshots.
## Acceptance
Feet alignment stable and no clipping/teleporting; no CSS translateY hardcode as sole fix.
