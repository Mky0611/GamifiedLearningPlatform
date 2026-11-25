(function () {
  const seq = (count, pattern) => Array.from({ length: count }, (_, i) => pattern(i + 1));

  window.RaidPhaserConfig = {
    canvasWidth: 960,
    canvasHeight: 420,
    groundY: 350,
    heroScale: 1.35,
    heroX: 330,
    heroY: 350,
    bossX: 630,
    bossY: 350,
    backgroundKey: 'raid-bg',
    backgroundUrl: '/ui/assets/backgrounds/worlds/mountain-dusk/mountain-dusk-a.png',
    biomeStages: {
      forest: '/ui/assets/backgrounds/worlds/tall-forest/forest-preview.png',
      dusk: '/ui/assets/backgrounds/worlds/mountain-dusk/mountain-dusk-a.png',
      canyon: '/ui/assets/backgrounds/worlds/mountain-dusk/mountain-dusk-b.png',
      town: '/ui/assets/backgrounds/worlds/gothicvania-town/environment-preview.png'
    },
    heroes: {
      warrior: {
        frameWidth: 192,
        frameHeight: 192,
        scale: 1.35,
        battleY: 350,
        battleOffsetX: -4,
        originX: 0.5,
        originY: 0.7135, // 137 / 192
        shadowScale: 1.2,
        previewScale: 1.3,
        portrait: '/ui/assets/ui/avatars/portrait-hero-warrior.png',
        idle: { url: '/ui/assets/units/warrior/idle.png', frames: 8, rate: 8 },
        run: { url: '/ui/assets/units/warrior/run.png', frames: 6, rate: 10 },
        attack: { url: '/ui/assets/units/warrior/attack.png', frames: 4, rate: 10, hitFrame: 2 },
        attack2: { url: '/ui/assets/sprites/tiny-swords/Warrior_Attack2.png', frames: 4, rate: 11, hitFrame: 2 },
        guard: { url: '/ui/assets/units/warrior/guard.png', frames: 6, rate: 8, hitFrame: 2 }
      },
      lancer: {
        frameWidth: 192,
        frameHeight: 192,
        scale: 1.32,
        battleY: 350,
        battleOffsetX: -2,
        originX: 0.5,
        originY: 0.9271, // 178 / 192
        shadowScale: 1.15,
        previewScale: 1.25,
        portrait: '/ui/assets/ui/avatars/portrait-hero-lancer.png',
        idle: { url: '/ui/assets/units/lancer/normalized/idle.png', frames: 12, rate: 10 },
        run: { url: '/ui/assets/units/lancer/normalized/run.png', frames: 6, rate: 12 },
        attack: { url: '/ui/assets/units/lancer/normalized/attack.png', frames: 3, rate: 10, hitFrame: 2 },
        attack2: { url: '/ui/assets/units/lancer/normalized/attack.png', frames: 3, rate: 12, hitFrame: 2 },
        guard: { url: '/ui/assets/units/lancer/normalized/guard.png', frames: 6, rate: 8, hitFrame: 2 }
      },
      archer: {
        frameWidth: 192,
        frameHeight: 192,
        scale: 1.35,
        battleY: 350,
        battleOffsetX: 2,
        originX: 0.5,
        originY: 0.7083, // 136 / 192
        shadowScale: 1.2,
        previewScale: 1.3,
        portrait: '/ui/assets/ui/avatars/portrait-hero-archer.png',
        idle: { url: '/ui/assets/units/archer/idle.png', frames: 6, rate: 8 },
        run: { url: '/ui/assets/units/archer/run.png', frames: 4, rate: 10 },
        attack: { url: '/ui/assets/units/archer/attack.png', frames: 8, rate: 12, hitFrame: 5 },
        attack2: { url: '/ui/assets/units/archer/attack.png', frames: 8, rate: 14, hitFrame: 5 },
        guard: { url: '/ui/assets/units/archer/idle.png', frames: 6, rate: 8, hitFrame: 2 }
      }
    },
    vfx: {
      'vfx-slash': { url: '/ui/assets/effects/vfx/fx-slash-clean.png', fw: 80, fh: 64, anims: {
        'vfx-slash-side': { start: 0, end: 6, rate: 18 },
        'vfx-slash-down': { start: 8, end: 14, rate: 18 },
        'vfx-slash-spin': { start: 16, end: 24, rate: 20 },
        'vfx-slash-hit': { start: 26, end: 29, rate: 18 }
      } },
      'vfx-spark-ember': { url: '/ui/assets/effects/vfx/hit_spark_ember.png', fw: 32, fh: 32, anims: { 'vfx-spark-ember-anim': { start: 0, end: 5, rate: 16 } } },
      'vfx-spark-frost': { url: '/ui/assets/effects/vfx/hit_spark_frost.png', fw: 32, fh: 32, anims: { 'vfx-spark-frost-anim': { start: 0, end: 5, rate: 16 } } },
      'vfx-spark-arcane': { url: '/ui/assets/effects/vfx/hit_spark_arcane.png', fw: 32, fh: 32, anims: { 'vfx-spark-arcane-anim': { start: 0, end: 5, rate: 16 } } },
      'vfx-ring-ember': { url: '/ui/assets/effects/vfx/impact_ring_ember.png', fw: 32, fh: 32, anims: { 'vfx-ring-ember-anim': { start: 0, end: 6, rate: 16 } } },
      'vfx-ring-frost': { url: '/ui/assets/effects/vfx/impact_ring_frost.png', fw: 32, fh: 32, anims: { 'vfx-ring-frost-anim': { start: 0, end: 6, rate: 16 } } },
      'vfx-ring-arcane': { url: '/ui/assets/effects/vfx/impact_ring_arcane.png', fw: 32, fh: 32, anims: { 'vfx-ring-arcane-anim': { start: 0, end: 6, rate: 16 } } },
      'vfx-heal-frost': { url: '/ui/assets/effects/vfx/heal_plus_frost.png', fw: 32, fh: 32, anims: { 'vfx-heal-frost-anim': { start: 0, end: 7, rate: 14 } } },
      'vfx-parry-frost': { url: '/ui/assets/effects/vfx/parry_flash_frost.png', fw: 32, fh: 32, anims: { 'vfx-parry-frost-anim': { start: 0, end: 5, rate: 16 } } },
      'vfx-dash-mono': { url: '/ui/assets/effects/vfx/dash_dust_mono.png', fw: 32, fh: 32, anims: { 'vfx-dash-mono-anim': { start: 0, end: 7, rate: 16 } } },
      'vfx-fire-burst': { url: '/ui/assets/effects/vfx/fire_explosion_64x64.png', fw: 64, fh: 64, anims: { 'vfx-fire-burst-anim': { start: 0, end: 11, rate: 16 } } },
      'vfx-ice-spikes': { url: '/ui/assets/effects/vfx/ice_spikes_64x64.png', fw: 64, fh: 64, anims: { 'vfx-ice-spikes-anim': { start: 0, end: 9, rate: 14 } } },
      'vfx-thunder-burst': { url: '/ui/assets/effects/vfx/thunder_burst_64x64.png', fw: 64, fh: 64, anims: { 'vfx-thunder-burst-anim': { start: 0, end: 8, rate: 15 } } },
      'vfx-acid-splash': { url: '/ui/assets/effects/vfx/acid_splash_64x64.png', fw: 64, fh: 64, anims: { 'vfx-acid-splash-anim': { start: 0, end: 9, rate: 14 } } },
      'fx-explosion': { url: '/ui/assets/ui/fx/explosion_01.png', fw: 192, fh: 192, anims: { 'fx-explosion-anim': { start: 0, end: 7, rate: 12 } } }
    },
    knightSkills: [
      { id: 'knight_slash', name: 'Knight Slash', icon: '/ui/assets/ui/kibyra/icon17.png', manaCost: 0, cooldown: 0, heroAnim: 'attack', vfxAnim: 'vfx-slash-side', vfxScale: 2.2, vfxHitAnim: 'vfx-spark-ember-anim', allowedHeroes: ['warrior'], previewDmg: 14, desc: 'Nhát chém hiệp sĩ chuẩn mực kèm tia lửa công kích (Warrior).' },
      { id: 'heavy_slash', name: 'Heavy Slash', icon: '/ui/assets/ui/kibyra/icon18.png', manaCost: 2, cooldown: 2, heroAnim: 'attack2', vfxAnim: 'vfx-slash-down', vfxScale: 2.5, vfxHitAnim: 'vfx-fire-burst-anim', allowedHeroes: ['warrior'], previewDmg: 20, desc: 'Bổ kiếm hạng nặng kích nổ hỏa diễm (+45% preview, Warrior).' },
      { id: 'royal_guard', name: 'Royal Guard', icon: '/ui/assets/ui/kibyra/icon19.png', manaCost: 1, cooldown: 2, heroAnim: 'guard', vfxAnim: 'vfx-parry-frost-anim', vfxScale: 2.8, vfxHitAnim: 'vfx-ring-frost-anim', selfTarget: true, allowedHeroes: ['warrior', 'lancer'], mitigationPct: 75, reflectDmg: 6, desc: 'Dựng khiên hoàng gia giảm 75% sát thương đòn boss kế & phản 6 băng.' },
      { id: 'blade_storm', name: 'Blade Storm', icon: '/ui/assets/ui/kibyra/icon26.png', manaCost: 3, cooldown: 3, heroAnim: 'attack2', vfxAnim: 'vfx-slash-spin', vfxScale: 2.6, vfxHitAnim: 'vfx-ring-ember-anim', allowedHeroes: ['warrior'], minCombo: 2, previewDmg: 18, desc: 'Xoáy kiếm đa vòng càn quét boss (Yêu cầu Combo >= x2, Warrior).' },
      { id: 'sacred_recovery', name: 'Sacred Recovery', icon: '/ui/assets/ui/kibyra/icon14.png', manaCost: 2, cooldown: 3, heroAnim: 'guard', vfxAnim: 'vfx-heal-frost-anim', vfxScale: 2.8, vfxHitAnim: 'vfx-ring-arcane-anim', selfTarget: true, allowedHeroes: ['warrior', 'lancer', 'archer'], healHp: 18, desc: 'Hồi phục 18 sinh lực hiệp sĩ trong chế độ xem trước kỹ năng.' },
      { id: 'lexical_judgment', name: 'Lexical Judgment', icon: '/ui/assets/ui/kibyra/icon59.png', manaCost: 4, cooldown: 4, heroAnim: 'attack2', vfxAnim: 'vfx-thunder-burst-anim', vfxScale: 2.5, vfxHitAnim: 'vfx-ring-arcane-anim', allowedHeroes: ['warrior', 'lancer', 'archer'], requiresCoreClue: true, previewDmg: 24, desc: 'Triệu hồi Thiên Lôi Ngôn Từ (Yêu cầu mở manh mối Core Word).' }
    ],
    bosses: {
      captain: {
        label: 'Captain Clown Nose', scale: 3.0,
        portrait: '/ui/assets/ui/avatars/portrait-boss-captain.png',
        originX: 0.5, originY: 0.8,
        idle: { frames: seq(5, n => `/ui/assets/bosses/captain/boss-captain-idle-${String(n).padStart(2, '0')}.png`), rate: 8 },
        attack: { frames: seq(3, n => `/ui/assets/bosses/captain/boss-captain-attack-${String(n).padStart(2, '0')}.png`), rate: 10 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/captain/boss-captain-hit-${String(n).padStart(2, '0')}.png`), rate: 10 }
      },
      crabby: {
        label: 'Crabby', scale: 3.2,
        portrait: '/ui/assets/ui/avatars/portrait-boss-crabby.png',
        originX: 0.5, originY: 0.9062,
        idle: { frames: seq(9, n => `/ui/assets/bosses/crabby/boss-crabby-idle-${String(n).padStart(2, '0')}.png`), rate: 10 },
        attack: { frames: seq(4, n => `/ui/assets/bosses/crabby/boss-crabby-attack-${String(n).padStart(2, '0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/crabby/boss-crabby-hit-${String(n).padStart(2, '0')}.png`), rate: 12 }
      },
      fierce: {
        label: 'Fierce Tooth', scale: 3.6,
        portrait: '/ui/assets/ui/avatars/portrait-boss-fierce.png',
        originX: 0.5, originY: 0.9333,
        idle: { frames: seq(8, n => `/ui/assets/bosses/fierce/boss-fierce-idle-${String(n).padStart(2, '0')}.png`), rate: 10 },
        attack: { frames: seq(5, n => `/ui/assets/bosses/fierce/boss-fierce-attack-${String(n).padStart(2, '0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/fierce/boss-fierce-hit-${String(n).padStart(2, '0')}.png`), rate: 12 }
      },
      pink: {
        label: 'Pink Star', scale: 3.6,
        portrait: '/ui/assets/ui/avatars/portrait-boss-pink.png',
        originX: 0.5, originY: 0.9667,
        idle: { frames: seq(8, n => `/ui/assets/bosses/pink/boss-pink-idle-${String(n).padStart(2, '0')}.png`), rate: 10 },
        attack: { frames: seq(4, n => `/ui/assets/bosses/pink/boss-pink-attack-${String(n).padStart(2, '0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/pink/boss-pink-hit-${String(n).padStart(2, '0')}.png`), rate: 12 }
      },
      totem1: {
        label: 'Totem Head I', scale: 3.4,
        portrait: '/ui/assets/ui/avatars/portrait-boss-totem1.png',
        originX: 0.5, originY: 0.9688,
        idle: { frames: ['/ui/assets/bosses/totem1/boss-totem1-idle-01.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/bosses/totem1/boss-totem1-attack-${String(n).padStart(2, '0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/totem1/boss-totem1-hit-${String(n).padStart(2, '0')}.png`), rate: 12 }
      },
      totem2: {
        label: 'Totem Head II', scale: 3.4,
        portrait: '/ui/assets/ui/avatars/portrait-boss-totem2.png',
        originX: 0.5, originY: 1.0,
        idle: { frames: ['/ui/assets/bosses/totem2/boss-totem2-idle-01.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/bosses/totem2/boss-totem2-attack-${String(n).padStart(2, '0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/totem2/boss-totem2-hit-${String(n).padStart(2, '0')}.png`), rate: 12 }
      },
      totem3: {
        label: 'Totem Head III', scale: 3.4,
        portrait: '/ui/assets/ui/avatars/portrait-boss-totem3.png',
        originX: 0.5, originY: 1.0,
        idle: { frames: ['/ui/assets/bosses/totem3/boss-totem3-idle-01.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/bosses/totem3/boss-totem3-attack-${String(n).padStart(2, '0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/totem3/boss-totem3-hit-${String(n).padStart(2, '0')}.png`), rate: 12 }
      },
      seashell: {
        label: 'Seashell', scale: 3.4,
        portrait: '/ui/assets/ui/avatars/portrait-boss-seashell.png',
        originX: 0.5, originY: 1.0,
        idle: { frames: ['/ui/assets/bosses/seashell/boss-seashell-idle-01.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/bosses/seashell/boss-seashell-attack-${String(n).padStart(2, '0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/seashell/boss-seashell-hit-${String(n).padStart(2, '0')}.png`), rate: 12 }
      },
      cannon: {
        label: 'Cannon', scale: 3.5,
        portrait: '/ui/assets/ui/avatars/portrait-boss-cannon.png',
        originX: 0.5, originY: 1.0,
        idle: { frames: ['/ui/assets/bosses/cannon/boss-cannon-idle-01.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/bosses/cannon/boss-cannon-attack-${String(n).padStart(2, '0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/bosses/cannon/boss-cannon-hit-${String(n).padStart(2, '0')}.png`), rate: 12 }
      },
      slime: {
        label: 'Verdant Slime (Preview)', scale: 3.5, isSheet: true, nativeFacingLeft: true,
        portrait: '/ui/assets/ui/avatars/portrait-boss-slime.png',
        originX: 0.5, originY: 0.9688,
        idle: { sheetUrl: '/ui/assets/monsters/slime/idle.png', fw: 32, fh: 32, frames: 4, rate: 7 },
        run: { sheetUrl: '/ui/assets/monsters/slime/run.png', fw: 32, fh: 32, frames: 6, rate: 10 },
        attack: { sheetUrl: '/ui/assets/monsters/slime/attack.png', fw: 32, fh: 32, frames: 6, rate: 12, hitFrame: 3 },
        hit: { sheetUrl: '/ui/assets/monsters/slime/hit.png', fw: 32, fh: 32, frames: 3, rate: 10 },
        death: { sheetUrl: '/ui/assets/monsters/slime/death.png', fw: 32, fh: 32, frames: 8, rate: 10 }
      },
      skeleton: {
        label: 'Cursed Skeleton (Preview)', scale: 3.6, isSheet: true, nativeFacingLeft: true,
        portrait: '/ui/assets/ui/avatars/portrait-boss-skeleton.png',
        originX: 0.5, originY: 1.0,
        idle: { sheetUrl: '/ui/assets/monsters/skeleton/idle.png', fw: 32, fh: 32, frames: 4, rate: 7 },
        run: { sheetUrl: '/ui/assets/monsters/skeleton/run.png', fw: 32, fh: 32, frames: 6, rate: 10 },
        attack: { sheetUrl: '/ui/assets/monsters/skeleton/attack.png', fw: 32, fh: 32, frames: 6, rate: 12, hitFrame: 3 },
        hit: { sheetUrl: '/ui/assets/monsters/skeleton/hit.png', fw: 32, fh: 32, frames: 3, rate: 10 },
        death: { sheetUrl: '/ui/assets/monsters/skeleton/death.png', fw: 32, fh: 32, frames: 8, rate: 10 }
      }
    },
    bossOrder: ['crabby', 'fierce', 'pink', 'captain', 'totem1', 'totem2', 'totem3', 'seashell', 'cannon'],
    previewBossOrder: ['crabby', 'fierce', 'pink', 'captain', 'totem1', 'totem2', 'totem3', 'seashell', 'cannon', 'slime', 'skeleton']
  };
})();
