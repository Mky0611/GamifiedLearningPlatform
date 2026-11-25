(function () {
  function preloadAll(scene) {
    const cfg = window.RaidPhaserConfig;
    scene.load.image(cfg.backgroundKey, cfg.backgroundUrl);
    if (cfg.biomeStages) {
      Object.entries(cfg.biomeStages).forEach(([key, url]) => {
        scene.load.image(`raid-bg-${key}`, url);
      });
    }

    Object.entries(cfg.heroes).forEach(([unit, modes]) => {
      Object.entries(modes).forEach(([mode, meta]) => {
        if (!meta || typeof meta !== 'object' || !meta.url) return;
        scene.load.spritesheet(`hero-${unit}-${mode}`, meta.url, {
          frameWidth: Number(modes.frameWidth || cfg.heroFrameWidth || 192),
          frameHeight: Number(modes.frameHeight || cfg.heroFrameHeight || 192)
        });
      });
    });

    Object.entries(cfg.bosses).forEach(([theme, modes]) => {
      Object.entries(modes).forEach(([mode, meta]) => {
        if (!meta || typeof meta !== 'object') return;
        if (meta.sheetUrl) {
          scene.load.spritesheet(`boss-${theme}-${mode}-sheet`, meta.sheetUrl, {
            frameWidth: Number(meta.fw || 32),
            frameHeight: Number(meta.fh || 32)
          });
        } else if (Array.isArray(meta.frames)) {
          meta.frames.forEach((src, idx) => scene.load.image(`boss-${theme}-${mode}-${idx}`, src));
        }
      });
    });

    if (cfg.vfx) {
      Object.entries(cfg.vfx).forEach(([key, meta]) => {
        scene.load.spritesheet(key, meta.url, {
          frameWidth: Number(meta.fw || 32),
          frameHeight: Number(meta.fh || 32)
        });
      });
    }
  }

  class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    preload() { preloadAll(this); }
    create() {
      this.scene.start('BattleScene');
      this.scene.launch('UIScene');
    }
  }

  window.RaidBootScene = BootScene;
})();
