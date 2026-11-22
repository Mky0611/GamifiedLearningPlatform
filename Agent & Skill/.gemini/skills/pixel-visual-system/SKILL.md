---
name: pixel-visual-system
description: Use when designing consistent pixel RPG interface panels, buttons, typography, palettes, accessible states and non-generic web game aesthetics.
---
# Pixel Visual System

Read `AGENTS.md`, `docs/SOURCE_AUDIT.md`, and related source files. Provide Vietnamese progress and exact file-level changes.

## Workflow
1. Identify current visual primitives from `minigame.css`, `base.css`, `theme.css` and image assets. Inventory radius, border, font and color inconsistencies.
2. Propose pixel design tokens, 4px rhythm, sharp edges, non-blurred 9-slice panel framing, hover/focus/pressed/disabled/loading states, and Vietnamese-readable body typography.
3. Keep sprite resolution and nearest-neighbor; validate contrast; do not add UI libraries without approval.
4. Deliver token CSS plus minimal changed components and screenshots; preserve DOM IDs and page routes.
## Acceptance
No generic glass/rounded-pill styles in main RPG combat; all actionable UI visually unambiguous and keyboard focus visible.
