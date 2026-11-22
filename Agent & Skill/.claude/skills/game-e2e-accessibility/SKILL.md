---
name: game-e2e-accessibility
description: Use when testing mobile pixel game, touch target sizing, canvas scaling, keyboard inputs, accessibility and releases with Playwright.
---
# Game E2E Accessibility

Read `AGENTS.md`, `docs/SOURCE_AUDIT.md`, and related source files. Provide Vietnamese progress and exact file-level changes.

## Workflow
1. Use Playwright devices and manual viewports: 320x568, 360x800, 390x844, 430x932, 768x1024, 1366x768, 1440x900.
2. Capture screenshots before/after per viewport and inspect layout overflow by comparing scrollWidth/clientWidth. Record all `.board-tile` and Attack boundingClientRect within viewport.
3. Test buttons, repeated attacks, disabled states, pointercancel, touch, keyboard/focus, modal, auth flow and game result; try landscape and reduced-motion.
4. Compare sprite visual feet against ground anchors at idle/run/attack in each unit type. Check console/network errors, missing assets and smoke check.
5. Report `PASS/FAIL/NOT_TESTED` with logs and screenshots, never declare success without running browser.
## Acceptance
All P0 tests green across core mobile and laptop cases, no hide/show jump while attacking.
