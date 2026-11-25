(function(){
  async function mount(mountEl, initialState){
    if (!window.Phaser || !window.RaidBootScene || !window.RaidBattleScene || !window.RaidUIScene) {
      return { renderer: 'canvas-fallback', errorText: 'Phaser runtime chưa sẵn sàng.', setState(){}, destroy(){} };
    }

    const cfg = window.RaidPhaserConfig;
    const bootState = { ...(initialState || {}) };
    window.__RAID_INITIAL_STATE__ = bootState;
    mountEl.innerHTML = '';
    if (!mountEl.id) mountEl.id = 'raidPhaserMount';

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: cfg.canvasWidth,
      height: cfg.canvasHeight,
      parent: mountEl.id,
      pixelArt: true,
      transparent: true,
      backgroundColor: 'rgba(0,0,0,0)',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: cfg.canvasWidth,
        height: cfg.canvasHeight
      },
      scene: [window.RaidBootScene, window.RaidBattleScene, window.RaidUIScene]
    });

    const applyWhenReady = (callback)=>{
      const tryRun = ()=>{
        const battle = game.scene.getScene('BattleScene');
        const ui = game.scene.getScene('UIScene');
        if (battle && ui && game.scene.isActive('BattleScene') && game.scene.isActive('UIScene')) {
          return callback();
        }
        setTimeout(tryRun, 60);
      };
      tryRun();
    };

    applyWhenReady(()=>{
      const battle = game.scene.getScene('BattleScene');
      const ui = game.scene.getScene('UIScene');
      battle.events.emit('set-battle-state', bootState);
      ui.events.emit('set-ui-state', bootState);
    });

    return {
      renderer: 'phaser',
      errorText: '',
      setState(next){
        const battle = game.scene.getScene('BattleScene');
        const ui = game.scene.getScene('UIScene');
        if (battle) {
          battle.events.emit('set-battle-state', next || {});
          if (next && next.playAttack) battle.events.emit('play-attack-sequence', next);
          if (next && next.playBossTurn) battle.events.emit('play-boss-turn-sequence', next);
          if (next && next.playBossDeath) battle.events.emit('play-boss-death-sequence', next);
          if (next && next.playBossSpawn) battle.events.emit('play-boss-spawn-sequence', next);
        }
        if (ui) ui.events.emit('set-ui-state', next || {});
      },
      destroy(){ game.destroy(true); mountEl.innerHTML = ''; window.__RAID_INITIAL_STATE__ = null; }
    };
  }

  window.RaidPhaserStarter = { mount };
})();
