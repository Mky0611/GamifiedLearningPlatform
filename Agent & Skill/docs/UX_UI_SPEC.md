# UX/UI Spec — Pure Pixel Lex Raid

## Design principles
A pixel RPG interface is a system, not just a font filter: integer-bound pixel edges, stable art scale, nine-slice panels and window frames, clear status icons, distinct hover/press/focus states, readable Vietnamese copy. Use existing sprite/image assets where license permits. Differentiate original work from Bookworm Adventures.

## Design tokens (proposed, validate contrast)
```
--px: 4px;
--bg-deep: #161725;
--bg-pane: #26293e;
--pane-mid: #383c51;
--frame-dark: #12131e;
--frame-light: #777a91;
--ink: #fff3d2;
--muted-ink: #c6c8d6;
--accent-gold: #f3c46a;
--accent-blue: #71bfea;
--danger: #eb6c67;
--success: #8bd19b;
--tile-size: 52px;
```
- Typography: headings Silkscreen or validated pixel font; body Be Vietnam Pro with full Vietnamese glyphs. Don't force pixel font to render long paragraph/IPA.
- Border radius: 0 or pixel steps; 2/4px pixel borders; 9-slice (CSS border-image or asset tile) for panels; button square corners and crisp inset shadows.
- Spacing multiples of 4 or 8; buttons min ~44px height; focus ring at least 2px contrasting. Contrast test before acceptance.
- Pixel sprites: nearest-neighbor, integer-aligned geometry where possible, single origin coordinate spec per asset; avoid CSS transforms on the sprite container that conflict with Phaser.

## Desktop target 1366x768
```
┌────────────────── Header: logo · stage · player XP · settings ────────────────┐
│ PLAYER PANEL (HP/skills) │     GAME ARENA (Hero ↔ Boss, HP overlays)   │ BOSS│
│                        │          stable feet/ground baseline       │ INFO│
├────────────────────────┬┴────────────────────────────────────────────┴─────┤
│ CORE WORD / OBJECTIVES │ WORD BOARD (grid) │ Current Word + ATTACK + clear│
└────────────────────────┴───────────────────┴───────────────────────────────┘
```
Avoid huge intro header pushing gameplay below fold; make panel compact on laptop.

## Mobile portrait target 390x844
```
┌────────────── STAGE · MENU ───────────────┐
│ PLAYER HP   [HERO ↔ BOSS]    BOSS HP      │  ~170-200 px
│       animated hit + combat feedback     │
├──────────────────────────────────────────┤
│            WORD BOARD 5x5                │  ~260-310 px
│          [tiles ≥44px targets]           │
├──────────────────────────────────────────┤
│ WORD: COMPILER   (+ DAMAGE PREVIEW)      │
│ [Clear]                     [ATTACK]     │  sticky/docked, safe area
├──────────────────────────────────────────┤
│ [Skills] [Clues] [Objectives] [Dictionary]│  optional collapsible tray
└──────────────────────────────────────────┘
```
Gameplay controls visible together; route secondary objectives/inventory into drawer, and allow scroll only for non-battle pages. Respect `env(safe-area-inset-bottom)` and `100dvh` but test browser address-bar variations. Header can collapse on active battle. If phone is 320x568, use compact battle and optional combat-only visual shrink; 5x5 targets 44px + 4px gaps =244px plus margins; 7x7 44px cannot fit 320px, so explicitly introduce pan/zoom mode or approved board-size changes.

## Critical DOM architecture
Current DOM has arena/attack separate above board. New layout should present one `battle-workspace` with `battle-viewport`, `word-board`, `word-dock`; player/boss info as compact status overlays within viewport; secondary tabs outside/hidden. Keep all IDs/events or adapt JS and tests together. Do not duplicate element IDs to support old and new layout.

## Sprite alignment contract
World canvas logical dimensions should be singular (currently Phaser 960x420); measure actual asset frame W,H and per-frame alpha bounds. For each unit+animation, store `footX`, `footY` in source frame coordinates or normalize source sprite sheets to consistent feet anchors. Compute scene position from `targetFeetWorldX/Y - (footInFrame - origin*frameSize)*scale`. Validate 5-frame sample across state switches and different monster dimensions. Do not use global CSS top/translate to repair data-specific offsets. Use assets spritesheets not DOM background-position while actor is managed in Phaser.

## Responsiveness and interactions
- 320,360,375,390,430,768,1024,1366,1440,1920 widths, and heights 568..1080. Zoom 200%.
- Tile selection tap: click/keyboard/pointer; optional drag with pointer capture. `pointercancel` resets drag safely. Prevent passive scroll only when on active tile grid and pointer action intentional.
- Button states: disabled while submitting, loading indicator, recoverable error, no duplicated attack, visual and accessible feedback for invalid word.
- Stage controls should be discoverable. Pixel modal should trap focus, close with Esc/outside, restore focus; touch overlay should not hide Attack.
- User can open definition of word after combat without losing progress. Add optional pronunciation control and learning note without polluting critical gameplay viewport.

## Success definition
A first-time user on mobile can start stage, see combat, assemble a word, attack, read meaning, continue next turn and exit without vertical scroll tug-of-war, hidden controls or misaligned sprites. Must be verified by actual e2e/device tests.
