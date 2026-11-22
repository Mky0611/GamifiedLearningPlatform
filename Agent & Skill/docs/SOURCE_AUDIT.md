# Source audit — evidence từ GamifiedLearningPlatform.zip (22/11/2026)

## Verified by inspecting archive (static only)
- `pom.xml`: Java 17 + Spring Boot 3.3.5 (bản phân tích trước); Java source trong `src/main/java/org/example`; JS/HTML/CSS ở `src/main/resources/FrontEnd/`.
- `script_GPL_v2.sql` UTF-16: 56 `CREATE TABLE`. `vocabulary_words`: 2.098 INSERT rows (IDs 1..2098 trong bản seed), 75 rows có `level_cefr` điền B1/B2/C1 (B1=23, B2=41, C1=11), còn 2.023 NULL. Không phải 2.098 từ tiếng Anh A1-C2: có word sets tiếng Nhật (ví dụ row 2098 là ありがとう) và các chủ đề IELTS/IT.
- `raid-config.js` lines 5–11: base 960x420, heroX 406 heroY312, bossX554 bossY304; heroes' battleY 384/386; originY .9, scales khác nhau.
- PNG alpha bounds (đọc asset thực, quan sát 1 frame Idle): warrior 192x192 visible y=48..137, archer y=48..136, lancer y=60..178 (lancer normalized). Mỗi state có alpha bbox khác nữa, ví dụ warrior attack tới 156. Nếu dùng chung origin 0.9 và cùng groundY thì chân có thể lệch đáng kể.
- `assets/js/phaser/battle-scene.js` ~lines 82–90 spawnActors, ~143–154 applyState set `hero.x` và `hero.y` lại mỗi lần; ~165–195 có tween x cho attack. Phải kiểm tra race: khi đổi heroMode giữa tween, `applyState()` có thể reset X.
- `assets/js/raid-phaser-embed.js` lines 23–50: fallback canvas 960x360, vẽ hero/boss hard-coded tại tọa độ khác Phaser 960x420; render async/await preload inside requestAnimationFrame có nguy cơ lệch pacing/timing, cần test.
- `assets/css/minigame.css` line 17: 3-column grid; ~398–420: mobile/tables breakpoints; `.battle-stage` 16/7 vs canvas 960/420; `.board-grid` touch-action none; `.board-horizontal-container` có columns cố định 210px 1fr 230px.
- `assets/js/minigame.js` ~line 643: `el.style.gridTemplateColumns = repeat(${cols}, minmax(56px, 76px))` thắng CSS resize. ~line 431 checks bossSpriteSheet missing; ~516/518 optional HUD refs missing in minigame HTML.
- `src/pages/minigame.html`: DOM order arena with Attack Dock first, then separate Word Board; Objectives nested inside Word Board; CSS grid template includes distinct `objectives` region without corresponding DOM grid cell, creating dead zone.
- `src/pages/minigame.html` has `<script src=/ui/assets/vendor/phaser.min.js>` so local vendor exists, and bridge still has CDN fallback.
- Backend security/reward/audit concerns from previous written audit are hypotheses for fresh runtime tests, not confirmed end-to-end by current source inspection.

## Important distinction
THIS IS A STATIC AUDIT. No browser screenshot, no working SQL Server, no demonstrated complete Maven build, and no deployed URL have been verified. Do not pretend any of these have passed.

## Key files to inspect next
- `assets/js/phaser/{raid-config,boot-scene,battle-scene,raid-phaser-main}.js`
- `assets/js/{raid-phaser-embed,minigame}.js`
- `assets/css/{base,minigame}.css`
- `src/pages/minigame.html`
- `src/main/java/org/example/{config,service,controller,entity}/`
- `src/main/resources/tools/smoke_check.py`

## Root cause possibilities for shifts
A. Different opaque feet position within a 192x192 transparent frame; B. sprite `.originY` while actual feet at <192px; C. multiple `x/y` setters fighting tweens; D. backing canvas CSS aspect ratio/parent height mismatch; E. boss PNG frame dimension differences, anchor changes; F. fallback vs Phaser diverge.
