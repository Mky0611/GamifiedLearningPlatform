---
name: mobile-word-battle
description: Use when player scrolls between word board and combat, buttons or letters are hidden on mobile, grid overflows or touch gestures fail.
---
# Mobile Word Battle

Read `AGENTS.md`, `docs/SOURCE_AUDIT.md`, and related source files. Provide Vietnamese progress and exact file-level changes.

## Workflow
1. Capture 320x568/360x800/390x844/430x932 and landscape; record first viewport and page scroll height.
2. Restructure active workspace: compact battle viewport + board + current word/Attack dock + optional secondary drawer. Use 100dvh and safe-area insets carefully; keep primary controls in one interaction view.
3. Remove inline `repeat(cols, minmax(56px,76px))` or compute it responsively from measured available board width. Ensure no tile clipping; do not silently reduce 7x7 below ~44px target on 320px.
4. Test pointer/touch/click/keyboard input, pointercancel, selection clear, loading and duplicate submissions.
5. Verify status feedback visible after action (combat hit, damage, new tile, invalid word).
## Acceptance
No required vertical scroll between selecting letters and seeing boss result on phone.
