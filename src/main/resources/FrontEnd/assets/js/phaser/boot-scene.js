(function(){
  function preloadAll(scene){
    const cfg = window.RaidPhaserConfig;
    scene.load.image(cfg.backgroundKey, cfg.backgroundUrl);

    Object.entries(cfg.heroes).forEach(([unit, modes])=>{
      Object.entries(modes).forEach(([mode, meta])=>{
        if (!meta || typeof meta !== 'object' || !meta.url) return;
        scene.load.spritesheet(`hero-${unit}-${mode}`, meta.url, {
          frameWidth: Number(modes.frameWidth || cfg.heroFrameWidth || 192),
          frameHeight: Number(modes.frameHeight || cfg.heroFrameHeight || 192)
        });
      });
    });

    Object.entries(cfg.bosses).forEach(([theme, modes])=>{
      Object.entries(modes).forEach(([mode, meta])=>{
        if (Array.isArray(meta.frames)) {
          meta.frames.forEach((src, idx)=>scene.load.image(`boss-${theme}-${mode}-${idx}`, src));
        }
      });
    });

    scene.load.spritesheet('fx-explosion', '/ui/assets/ui/fx/explosion_01.png', {
      frameWidth: 192,
      frameHeight: 192
    });
  }

  class BootScene extends Phaser.Scene {
    constructor(){ super('BootScene'); }
    preload(){ preloadAll(this); }
    create(){ this.scene.start('BattleScene'); this.scene.launch('UIScene'); }
  }

  window.RaidBootScene = BootScene;
})();
