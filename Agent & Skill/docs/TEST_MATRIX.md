# Pixel RPG test matrix + acceptance

## Browsers / viewport
- Desktop Chrome and Firefox: 1920x1080, 1440x900, 1366x768, 1280x720.
- Laptop Chrome/Edge 100% and 200% zoom.
- Tablet Chrome/Safari: 768x1024, 1024x768.
- Android Chrome portrait: 360x800, 390x844, 412x915; landscape 800x360.
- iOS Safari portrait: 375x667, 390x844, 430x932; iPhone compact 320x568; landscape as supported.
- Dynamic viewport (show/hide browser address bar), rotate, keyboard open, reduce motion, offline/slow network, touch and keyboard.

## Sprite tests
1. For warrior/lancer/archer: idle > run > attack > guard > idle keeps same ground feet and stable shadow.
2. Attack tween actually reaches enemy before hit; switching modes does not reset hero.x prematurely.
3. Boss crabby/fierce/captain/totem: idle/attack/hit/death do not jump or crop; frame dimensions and pivot stable.
4. Phaser main renderer and canvas fallback generate equivalent positions/animations (compare screenshots at same logical scale); fallback must animate with offline local assets.
5. No duplicate DOM/CSS actors; no missing texture or console errors; no load races.

## Mobile UX tests
6. At 390x844 without page scroll: boss HP, tiles, current word, Attack remain available.
7. At 320x568 compact game remains playable and not horizontally clipped; 7x7 board displays explicit pan/zoom affordance if needed.
8. Tap multiple tiles then Clear then Attack; no ghost double submission.
9. Drag gesture only selects intended tiles; page does not freeze after pointercancel.
10. Scroll secondary panel, open Core Word modal, dismiss modal and return to battle exactly where it was.
11. Attack feedback (damage, boss reaction and new words) visible without manually swiping back to top.
12. 200% zoom no clipping/horizontal overflow on essential controls.
13. Keyboard navigation, Enter/Space tile, focus indicator, ARIA names, Esc closes modal.

## Data tests
14. Import duplicate lemma with different senses/languages without accidental overwrites.
15. Every imported CEFR label has source/provenance and review status; IT tier not misused as CEFR.
16. Unknown/invalid word not awarded XP. Known valid word shows correct sense+meaning+example.
17. Battle result stored exactly once; replay API cannot earn XP twice.
18. User review session retains progress after refresh/login.

## Backend/deploy tests
19. API unauthenticated access rejected except declared public endpoints.
20. SQL Server non-null timestamp inserts, no exceptions.
21. Docker compose app reaches DB with healthcheck, no secrets checked in.
22. Remote preview has valid HTTPS, /health, `/api/...`, game assets and browser CORS; environment isolated; DB persists outside container instances.

## Report format
For each case: ID | viewport/platform | expected | actual | pass/fail/not-tested | screenshot/log | file patch / reason. Do not claim success from static code inspection alone.
