---
trigger: model_decision
description: "Use when modifying Phaser 3 actors, sprite frames, animation transitions, hit effects and canvas fallback."
---
# Phaser 3 animation rules
- Never assume visually aligned frames share one feet anchor. Inspect alpha bounds and feet pivot per character AND animation state.
- Keep single world baseline and consistent logical coordinate system in Phaser and Canvas fallback. Match canvas DOM aspect ratio to engine logical bounds.
- Distinguish base position from tween offset. Do not overwrite x/y from periodic state sync while a movement tween is active.
- Keep pixel-perfect scaling and do not resample assets with smooth image interpolation.
- Validate Idle -> Move -> Attack -> Hit -> Idle, boss guard/hit/death, actor replacement and viewport resize using rendered screenshots or a video.
- Preserve existing Phaser 3 APIs; do not copy Phaser 4-only snippets unreviewed.
- See `docs/SOURCE_AUDIT.md` and `scripts/audit_pixel_assets.py`.
