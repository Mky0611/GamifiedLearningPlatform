/**
 * LEX RAID P5 — Selective Asset BootScene (Fast Cold Start)
 * Preloads ONLY the active initial Hero, active Biome, active Boss, and core baseline VFX.
 * Remaining Heroes, Bosses, Biomes, and P5 Spell VFX are lazy-loaded on demand in BattleScene.
 */
(function () {
  function preloadSelective(scene) {
    const cfg = window.RaidPhaserConfig || {};
    const init = window.__RAID_INITIAL_STATE__ || {};
    const initialUnit = String(init.unitCode || 'warrior').toLowerCase();
    const initialBiome = String(init.biome || 'dusk').toLowerCase();
    const initialBoss = String(init.bossTheme || 'crabby').toLowerCase();

    // Active biome + fallback default background
    scene.load.image(cfg.backgroundKey, cfg.backgroundUrl);
    if (cfg.biomeStages && cfg.biomeStages[initialBiome]) {
      scene.load.image(`raid-bg-${initialBiome}`, cfg.biomeStages[initialBiome]);
    }

    // Load active hero (+ warrior baseline safety fallback if different)
    const heroesToLoad = Array.from(new Set([initialUnit, 'warrior']));
    heroesToLoad.forEach((unit) => {
      const modes = cfg.heroes && cfg.heroes[unit];
      if (!modes) return;
      Object.entries(modes).forEach(([mode, meta]) => {
        if (!meta || typeof meta !== 'object' || !meta.url) return;
        scene.load.spritesheet(`hero-${unit}-${mode}`, meta.url, {
          frameWidth: Number(modes.frameWidth || cfg.heroFrameWidth || 192),
          frameHeight: Number(modes.frameHeight || cfg.heroFrameHeight || 192)
        });
      });
    });

    // Load ONLY active boss initially (next wave bosses lazy-loaded seamlessly)
    const bossMeta = cfg.bosses && cfg.bosses[initialBoss];
    if (bossMeta) {
      Object.entries(bossMeta).forEach(([mode, meta]) => {
        if (!meta || typeof meta !== 'object') return;
        if (meta.sheetUrl) {
          scene.load.spritesheet(`boss-${initialBoss}-${mode}-sheet`, meta.sheetUrl, {
            frameWidth: Number(meta.fw || 32),
            frameHeight: Number(meta.fh || 32)
          });
        } else if (Array.isArray(meta.frames)) {
          meta.frames.forEach((src, idx) => scene.load.image(`boss-${initialBoss}-${mode}-${idx}`, src));
        }
      });
    }

    // Load core (non-lazy) VFX + any VFX required by initial active loadout
    const activeVfxAnimSet = new Set(Array.isArray(init.activeVfxAnims) ? init.activeVfxAnims : []);
    if (cfg.vfx) {
      Object.entries(cfg.vfx).forEach(([key, meta]) => {
        const neededByLoadout = meta.anims && Object.keys(meta.anims).some((a) => activeVfxAnimSet.has(a));
        if (meta.lazy && !neededByLoadout) return;
        scene.load.spritesheet(key, meta.url, {
          frameWidth: Number(meta.fw || 32),
          frameHeight: Number(meta.fh || 32)
        });
      });
    }
  }

  class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    preload() { preloadSelective(this); }
    create() {
      this.scene.start('BattleScene');
      this.scene.launch('UIScene');
    }
  }

  window.RaidBootScene = BootScene;
})();
