(function(){
  class BattleScene extends Phaser.Scene {
    constructor(){
      super('BattleScene');
      this.battleState = { unitCode: 'warrior', bossTheme: 'crabby', heroMode: 'idle', bossMode: 'idle', errorText: '', ...(window.__RAID_INITIAL_STATE__ || {}) };
      this.hero = null;
      this.boss = null;
      this.bossTimer = null;
      this.heroShadow = null;
      this.bossShadow = null;
      this.isAttacking = false;
      this.isBossDying = false;
      this.attackHitTimer = null;
      this.attackResetTimer = null;
      this.bossTurnTimer1 = null;
      this.bossTurnTimer2 = null;
    }

    create(){
      const cfg = window.RaidPhaserConfig;
      const groundY = cfg.groundY || 350;
      this.cameras.main.roundPixels = true;
      this.add.image(cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.backgroundKey)
        .setDisplaySize(cfg.canvasWidth, cfg.canvasHeight)
        .setAlpha(0.98);

      this.heroShadow = this.add.ellipse(cfg.heroX, groundY + 2, 96, 16, 0x000000, 0.22).setDepth(2);
      this.bossShadow = this.add.ellipse(cfg.bossX, groundY + 2, 108, 18, 0x000000, 0.24).setDepth(2);

      this.createHeroAnims();
      this.spawnActors();
      this.events.on('set-battle-state', this.setBattleState, this);
      this.events.on('play-attack-sequence', this.playAttackSequence, this);
      this.events.on('play-boss-turn-sequence', this.playBossTurnSequence, this);
      this.events.on('play-boss-death-sequence', this.playBossDeathSequence, this);
      this.events.on('play-boss-spawn-sequence', this.playBossSpawnSequence, this);
      this.events.on('show-hit-flash', this.showHitFlash, this);

      if (!this.anims.exists('fx-explosion-anim')) {
        this.anims.create({
          key: 'fx-explosion-anim',
          frames: this.anims.generateFrameNumbers('fx-explosion', { start: 0, end: 7 }),
          frameRate: 12,
          repeat: 0
        });
      }
      this.events.on('scene-error', (text)=>{
        this.battleState.errorText = text || '';
        this.scene.get('UIScene').events.emit('set-ui-state', { errorText: this.battleState.errorText });
      });
    }

    getHeroConfig(unitCode){
      const cfg = window.RaidPhaserConfig;
      return cfg.heroes[unitCode] || cfg.heroes.warrior;
    }

    createHeroAnims(){
      const cfg = window.RaidPhaserConfig;
      Object.entries(cfg.heroes).forEach(([unit, modes])=>{
        Object.entries(modes).forEach(([mode, meta])=>{
          if (!meta || typeof meta !== 'object' || !meta.url) return;
          const key = `anim-hero-${unit}-${mode}`;
          if (this.anims.exists(key)) return;
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(`hero-${unit}-${mode}`, { start: 0, end: meta.frames - 1 }),
            frameRate: meta.rate,
            repeat: mode === 'attack' ? 0 : -1
          });
        });
      });
    }

    stopBossTimer(){
      if (this.bossTimer) {
        this.bossTimer.remove(false);
        this.bossTimer = null;
      }
    }

    clearAttackTimers(){
      if (this.attackHitTimer) {
        this.attackHitTimer.remove(false);
        this.attackHitTimer = null;
      }
      if (this.attackResetTimer) {
        this.attackResetTimer.remove(false);
        this.attackResetTimer = null;
      }
    }

    clearBossTurnTimers(){
      if (this.bossTurnTimer1) {
        this.bossTurnTimer1.remove(false);
        this.bossTurnTimer1 = null;
      }
      if (this.bossTurnTimer2) {
        this.bossTurnTimer2.remove(false);
        this.bossTurnTimer2 = null;
      }
    }

    spawnActors(){
      const cfg = window.RaidPhaserConfig;
      const groundY = cfg.groundY || 350;
      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      this.isAttacking = false;
      this.isBossDying = false;
      this.clearAttackTimers();
      this.clearBossTurnTimers();
      if (this.hero) {
        this.tweens.killTweensOf(this.hero);
        this.hero.destroy();
      }
      if (this.boss) {
        this.tweens.killTweensOf(this.boss);
        this.boss.destroy();
      }
      this.stopBossTimer();

      const heroX = cfg.heroX + Number(heroCfg.battleOffsetX || 0);
      const heroY = Number(heroCfg.battleY || groundY);
      this.hero = this.add.sprite(heroX, heroY, `hero-${this.battleState.unitCode}-idle`, 0);
      this.hero.setScale(Number(heroCfg.scale || cfg.heroScale || 0.9));
      this.hero.setOrigin(Number(heroCfg.originX || 0.5), Number(heroCfg.originY || 0.7135));
      this.hero.setDepth(5);

      this.heroShadow.setPosition(heroX, groundY + 2);
      this.heroShadow.setScale(Number(heroCfg.shadowScale || 0.82), 1);
      this.boss = this.createBossSprite(this.battleState.bossTheme, this.battleState.bossMode);
      this.applyState();
    }

    createBossSprite(theme, mode){
      const cfg = window.RaidPhaserConfig;
      const groundY = cfg.groundY || 350;
      const themeMeta = cfg.bosses[theme] || cfg.bosses.crabby;
      const modeMeta = themeMeta[mode] || themeMeta.idle;
      const image = this.add.image(cfg.bossX, groundY, `boss-${theme}-${mode}-0`).setDepth(5);
      image.setScale(themeMeta.scale || cfg.bossScale || 2.5);
      image.setOrigin(Number(themeMeta.originX || 0.5), Number(themeMeta.originY || 0.9));
      image.setFlipX(true); // Face the hero on the left
      image.__theme = theme;
      image.__mode = mode;
      image.__frameImages = modeMeta.frames.map((_, idx)=>`boss-${theme}-${mode}-${idx}`);
      image.__frameIndex = 0;
      image.setTexture(image.__frameImages[0]);
      this.bossShadow.setPosition(cfg.bossX, groundY + 2);
      this.bossShadow.setScale(Math.max(0.66, (themeMeta.scale || 2.5) / 3.8), 1);
      this.startBossFrames(image, modeMeta.rate || 8, mode === 'hit' ? false : true);
      return image;
    }

    startBossFrames(image, rate, loop){
      this.stopBossTimer();
      if (!image || !image.__frameImages || image.__frameImages.length <= 1) return;
      const delay = Math.max(70, Math.round(1000 / Math.max(1, rate || 8)));
      this.bossTimer = this.time.addEvent({
        delay,
        loop,
        callback: ()=>{
          if (!image.active) return;
          image.__frameIndex += 1;
          if (image.__frameIndex >= image.__frameImages.length) {
            if (loop) image.__frameIndex = 0;
            else {
              image.__frameIndex = image.__frameImages.length - 1;
              this.stopBossTimer();
              return;
            }
          }
          image.setTexture(image.__frameImages[image.__frameIndex]);
        }
      });
    }

    setBattleState(next){
      const prevUnit = this.battleState.unitCode;
      Object.assign(this.battleState, next || {});
      const heroUnitChanged = next && Object.prototype.hasOwnProperty.call(next, 'unitCode') && next.unitCode !== prevUnit;
      if (this.scene.isActive() && (!this.hero || !this.boss || heroUnitChanged)) {
        this.spawnActors();
      } else {
        this.applyState();
      }
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.events) uiScene.events.emit('set-ui-state', this.battleState);
    }

    applyState(){
      if (!this.hero || !this.boss) return;
      const heroKey = `anim-hero-${this.battleState.unitCode}-${this.battleState.heroMode}`;
      if (this.anims.exists(heroKey)) this.hero.play(heroKey, true);

      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      const groundY = window.RaidPhaserConfig.groundY || 350;
      this.hero.setScale(Number(heroCfg.scale || window.RaidPhaserConfig.heroScale || 0.9));
      this.hero.setOrigin(Number(heroCfg.originX || 0.5), Number(heroCfg.originY || 0.7135));

      if (!this.isAttacking) {
        this.hero.x = window.RaidPhaserConfig.heroX + Number(heroCfg.battleOffsetX || 0);
        this.hero.y = Number(heroCfg.battleY || groundY);
        this.heroShadow.setPosition(this.hero.x, groundY + 2);
        this.heroShadow.setScale(Number(heroCfg.shadowScale || 0.82), 1);
      }

      if (!this.isBossDying && this.boss) {
        const bossModeChanged = this.boss.__theme !== this.battleState.bossTheme || this.boss.__mode !== this.battleState.bossMode;
        if (bossModeChanged) {
          this.tweens.killTweensOf(this.boss);
          this.boss.destroy();
          this.stopBossTimer();
          this.boss = this.createBossSprite(this.battleState.bossTheme, this.battleState.bossMode);
        }
      }
    }

    playAttackSequence(){
      if (this.isAttacking || this.isBossDying) return;
      this.isAttacking = true;
      this.clearAttackTimers();
      const cfg = window.RaidPhaserConfig;
      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      const heroStartX = cfg.heroX + Number(heroCfg.battleOffsetX || 0);
      const gapToBoss = Math.max(56, cfg.bossX - heroStartX);
      const heroAttackX = this.battleState.unitCode === 'archer'
        ? Math.min(cfg.bossX - 112, heroStartX + 48)
        : this.battleState.unitCode === 'lancer'
        ? Math.min(cfg.bossX - 92, heroStartX + Math.max(74, gapToBoss * 0.52))
        : Math.min(cfg.bossX - 82, heroStartX + Math.max(82, gapToBoss * 0.58));
      const bossHitX = cfg.bossX - 8;

      const resetToIdle = ()=>{
        this.tweens.add({
          targets: this.hero,
          x: heroStartX,
          duration: 180,
          ease: 'Quad.Out',
          onUpdate: ()=>{
            if (this.heroShadow) this.heroShadow.x = this.hero.x;
          },
          onComplete: ()=>{
            this.isAttacking = false;
            const nextState = { heroMode: 'idle' };
            if (!this.isBossDying) nextState.bossMode = 'idle';
            this.setBattleState(nextState);
          }
        });
        if (this.boss && !this.isBossDying) {
          this.tweens.add({
            targets: this.boss,
            x: cfg.bossX,
            duration: 180,
            ease: 'Quad.Out',
            onUpdate: ()=>{
              if (this.bossShadow) this.bossShadow.x = this.boss.x;
            }
          });
        }
      };

      this.setBattleState({ heroMode: this.battleState.unitCode === 'lancer' ? 'run' : 'attack', bossMode: 'idle' });
      this.tweens.add({
        targets: this.hero,
        x: heroAttackX,
        duration: this.battleState.unitCode === 'archer' ? 100 : 180,
        ease: 'Quad.Out',
        onUpdate: ()=>{
          if (this.heroShadow) this.heroShadow.x = this.hero.x;
        },
        onComplete: ()=>{
          this.setBattleState({ heroMode: 'attack' });
          this.showHitFlash();
          this.attackHitTimer = this.time.delayedCall(70, ()=>{
            if (this.isBossDying) return;
            this.setBattleState({ bossMode: 'hit' });
            if (this.boss) {
              this.tweens.add({
                targets: this.boss,
                x: bossHitX,
                duration: 70,
                yoyo: true,
                ease: 'Sine.InOut',
                onUpdate: ()=>{
                  if (this.bossShadow) this.bossShadow.x = this.boss.x;
                }
              });
            }
          });
          this.attackResetTimer = this.time.delayedCall(500, resetToIdle);
        }
      });
    }

    playBossTurnSequence(){
      if (!this.boss || this.isBossDying) return;
      this.clearBossTurnTimers();
      const cfg = window.RaidPhaserConfig;
      this.setBattleState({ bossMode: 'attack' });
      this.tweens.add({
        targets: this.boss,
        x: cfg.bossX - 36,
        duration: 160,
        yoyo: true,
        ease: 'Quad.Out',
        onUpdate: ()=>{
          if (this.bossShadow) this.bossShadow.x = this.boss.x;
        },
        onComplete: ()=>{
          this.cameras.main.shake(120, 0.003);
          this.bossTurnTimer1 = this.time.delayedCall(120, ()=>{
            if (this.isBossDying) return;
            this.setBattleState({ bossMode: 'idle', heroMode: 'guard' });
          });
          this.bossTurnTimer2 = this.time.delayedCall(480, ()=>{
            this.setBattleState({ heroMode: 'idle' });
          });
        }
      });
    }

    showHitFlash(){
      const cfg = window.RaidPhaserConfig;
      const flash = this.add.rectangle(cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.canvasWidth, cfg.canvasHeight, 0xffffff, 0.0).setDepth(20);
      this.tweens.add({
        targets: flash,
        alpha: { from: 0.28, to: 0 },
        duration: 130,
        onComplete: ()=>flash.destroy()
      });
      this.cameras.main.shake(90, 0.0025);
    }

    playBossDeathSequence(){
      if (!this.boss) return;
      this.isBossDying = true;
      this.stopBossTimer();
      this.clearAttackTimers();
      this.clearBossTurnTimers();
      this.tweens.killTweensOf(this.boss);
      this.tweens.killTweensOf(this.bossShadow);
      const cfg = window.RaidPhaserConfig;
      const themeMeta = cfg.bosses[this.battleState.bossTheme] || cfg.bosses.crabby;
      const scale = themeMeta.scale || 3;
      
      const explosion = this.add.sprite(this.boss.x, this.boss.y - 20, 'fx-explosion').setDepth(10);
      explosion.setScale(scale * 1.3);
      explosion.play('fx-explosion-anim');
      explosion.on('animationcomplete', () => {
        explosion.destroy();
      });

      this.cameras.main.shake(300, 0.008);

      this.tweens.add({
        targets: [this.boss, this.bossShadow],
        alpha: 0,
        scaleY: 0,
        duration: 700,
        ease: 'Quad.In',
        onComplete: () => {
          this.stopBossTimer();
          if (this.boss) this.boss.visible = false;
          if (this.bossShadow) this.bossShadow.visible = false;
        }
      });
    }

    playBossSpawnSequence(){
      this.isBossDying = false;
      const cfg = window.RaidPhaserConfig;
      this.spawnActors(); // Recreate boss
      if (this.boss) {
        this.boss.alpha = 0;
        this.boss.scaleY = 0;
        this.boss.visible = true;
        if (this.bossShadow) this.bossShadow.visible = true;
        this.tweens.add({
          targets: [this.boss, this.bossShadow],
          alpha: 1,
          scaleY: (cfg.bosses[this.battleState.bossTheme] || cfg.bosses.crabby).scale || 3,
          duration: 500,
          ease: 'Back.Out'
        });
      }
    }
  }

  window.RaidBattleScene = BattleScene;
})();
