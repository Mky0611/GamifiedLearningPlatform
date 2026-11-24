(function(){
  const seq = (count, pattern) => Array.from({length: count}, (_, i) => pattern(i + 1));

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
    backgroundUrl: '/ui/assets/imgs/map2.gif',
    heroes: {
      warrior: {
        frameWidth: 192,
        frameHeight: 192,
        scale: 1.35,
        battleY: 350,
        battleOffsetX: -4,
        originX: 0.5,
        originY: 0.7135, // 137 / 192 (actual foot baseline in idle/run/guard)
        shadowScale: 1.2,
        previewScale: 1.3,
        portrait: '/ui/assets/ui/avatars/portrait-hero-warrior.png',
        idle: { url: '/ui/assets/units/warrior/idle.png', frames: 8, rate: 8 },
        run: { url: '/ui/assets/units/warrior/run.png', frames: 6, rate: 10 },
        attack: { url: '/ui/assets/units/warrior/attack.png', frames: 4, rate: 10 },
        guard: { url: '/ui/assets/units/warrior/guard.png', frames: 6, rate: 8 }
      },
      lancer: {
        frameWidth: 192,
        frameHeight: 192,
        scale: 1.32,
        battleY: 350,
        battleOffsetX: -2,
        originX: 0.5,
        originY: 0.9271, // 178 / 192 (normalized foot baseline in idle/run)
        shadowScale: 1.15,
        previewScale: 1.25,
        portrait: '/ui/assets/ui/avatars/portrait-hero-lancer.png',
        idle: { url: '/ui/assets/units/lancer/normalized/idle.png', frames: 12, rate: 10 },
        run: { url: '/ui/assets/units/lancer/normalized/run.png', frames: 6, rate: 12 },
        attack: { url: '/ui/assets/units/lancer/normalized/attack.png', frames: 3, rate: 10 },
        guard: { url: '/ui/assets/units/lancer/normalized/guard.png', frames: 6, rate: 8 }
      },
      archer: {
        frameWidth: 192,
        frameHeight: 192,
        scale: 1.35,
        battleY: 350,
        battleOffsetX: 2,
        originX: 0.5,
        originY: 0.7083, // 136 / 192 (actual foot baseline in idle/run/attack)
        shadowScale: 1.2,
        previewScale: 1.3,
        portrait: '/ui/assets/ui/avatars/portrait-hero-archer.png',
        idle: { url: '/ui/assets/units/archer/idle.png', frames: 6, rate: 8 },
        run: { url: '/ui/assets/units/archer/run.png', frames: 4, rate: 10 },
        attack: { url: '/ui/assets/units/archer/attack.png', frames: 8, rate: 12 },
        guard: { url: '/ui/assets/units/archer/idle.png', frames: 6, rate: 8 }
      }
    },
    bosses: {
      captain: {
        label: 'Captain Clown Nose', scale: 2.8,
        portrait: '/ui/assets/ui/avatars/portrait-boss-captain.png',
        originX: 0.5, originY: 0.8, // 32 / 40
        idle: { frames: seq(5, n => `/ui/assets/monsters/treasure/captain/idle/Idle Sword ${String(n).padStart(2,'0')}.png`), rate: 8 },
        attack: { frames: seq(3, n => `/ui/assets/monsters/treasure/captain/attack/Attack 1 ${String(n).padStart(2,'0')}.png`), rate: 10 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/captain/hit/Hit Sword ${String(n).padStart(2,'0')}.png`), rate: 10 }
      },
      crabby: {
        label: 'Crabby', scale: 3.2,
        portrait: '/ui/assets/ui/avatars/portrait-boss-crabby.png',
        originX: 0.5, originY: 0.9062, // 29 / 32
        idle: { frames: seq(9, n => `/ui/assets/monsters/treasure/crabby/idle/Idle ${String(n).padStart(2,'0')}.png`), rate: 10 },
        attack: { frames: seq(4, n => `/ui/assets/monsters/treasure/crabby/attack/Attack ${String(n).padStart(2,'0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/crabby/hit/Hit ${String(n).padStart(2,'0')}.png`), rate: 12 }
      },
      fierce: {
        label: 'Fierce Tooth', scale: 3.6,
        portrait: '/ui/assets/ui/avatars/portrait-boss-fierce.png',
        originX: 0.5, originY: 0.9333, // 28 / 30
        idle: { frames: seq(8, n => `/ui/assets/monsters/treasure/fierce/idle/Idle ${String(n).padStart(2,'0')}.png`), rate: 10 },
        attack: { frames: seq(4, n => `/ui/assets/monsters/treasure/fierce/attack/Attack ${String(n).padStart(2,'0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/fierce/hit/Hit ${String(n).padStart(2,'0')}.png`), rate: 12 }
      },
      pink: {
        label: 'Pink Star', scale: 3.6,
        portrait: '/ui/assets/ui/avatars/portrait-boss-pink.png',
        originX: 0.5, originY: 0.9667, // 29 / 30
        idle: { frames: seq(8, n => `/ui/assets/monsters/treasure/pink/idle/Idle ${String(n).padStart(2,'0')}.png`), rate: 10 },
        attack: { frames: seq(4, n => `/ui/assets/monsters/treasure/pink/attack/Attack ${String(n).padStart(2,'0')}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/pink/hit/Hit ${String(n).padStart(2,'0')}.png`), rate: 12 }
      },
      totem1: {
        label: 'Totem Head I', scale: 3.4,
        portrait: '/ui/assets/ui/avatars/portrait-boss-totem1.png',
        originX: 0.5, originY: 0.9688, // 31 / 32
        idle: { frames: ['/ui/assets/monsters/treasure/totem1/idle/1.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/monsters/treasure/totem1/attack/${n}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/totem1/hit/${n}.png`), rate: 12 }
      },
      totem2: {
        label: 'Totem Head II', scale: 3.4,
        portrait: '/ui/assets/ui/avatars/portrait-boss-totem2.png',
        originX: 0.5, originY: 1.0,
        idle: { frames: ['/ui/assets/monsters/treasure/totem2/idle/1.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/monsters/treasure/totem2/attack/${n}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/totem2/hit/${n}.png`), rate: 12 }
      },
      totem3: {
        label: 'Totem Head III', scale: 3.4,
        portrait: '/ui/assets/ui/avatars/portrait-boss-totem3.png',
        originX: 0.5, originY: 1.0,
        idle: { frames: ['/ui/assets/monsters/treasure/totem3/idle/1.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/monsters/treasure/totem3/attack/${n}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/totem3/hit/${n}.png`), rate: 12 }
      },
      seashell: {
        label: 'Seashell', scale: 3.4,
        portrait: '/ui/assets/ui/avatars/portrait-boss-seashell.png',
        originX: 0.5, originY: 1.0,
        idle: { frames: ['/ui/assets/monsters/treasure/seashell/idle/1.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/monsters/treasure/seashell/attack/${n}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/seashell/hit/${n}.png`), rate: 12 }
      },
      cannon: {
        label: 'Cannon', scale: 3.5,
        portrait: '/ui/assets/ui/avatars/portrait-boss-cannon.png',
        originX: 0.5, originY: 1.0,
        idle: { frames: ['/ui/assets/monsters/treasure/cannon/idle/1.png'], rate: 6 },
        attack: { frames: seq(6, n => `/ui/assets/monsters/treasure/cannon/attack/${n}.png`), rate: 12 },
        hit: { frames: seq(4, n => `/ui/assets/monsters/treasure/cannon/hit/${n}.png`), rate: 12 }
      }
    },
    bossOrder: ['crabby', 'fierce', 'pink', 'captain', 'totem1', 'totem2', 'totem3', 'seashell', 'cannon']
  };
})();
