/**
 * Phaser BattleScene State Machine & Pooled Combat VFX Engine (Phase P4-B.2)
 * States: IDLE, APPROACH, ATTACK, IMPACT, RECOVERY, RETURN, GUARD, HURT, DEATH, VICTORY
 * Separates logical/visual state and base coordinates vs tween offsets so state sync
 * never teleports actors or orphans timers on rapid attack, unit swap, or tab hide.
 */
(function () {
  const STATES = {
    IDLE: 'IDLE',
    APPROACH: 'APPROACH',
    ATTACK: 'ATTACK',
    IMPACT: 'IMPACT',
    RECOVERY: 'RECOVERY',
    RETURN: 'RETURN',
    GUARD: 'GUARD',
    HURT: 'HURT',
    DEATH: 'DEATH',
    VICTORY: 'VICTORY'
  };

  class BattleScene extends Phaser.Scene {
    constructor() {
      super('BattleScene');
      this.battleState = {
        unitCode: 'warrior',
        bossTheme: 'crabby',
        heroMode: 'idle',
        bossMode: 'idle',
        biome: 'dusk',
        errorText: '',
        ...(window.__RAID_INITIAL_STATE__ || {})
      };
      this.fsmState = STATES.IDLE;
      this.hero = null;
      this.boss = null;
      this.bgSprite = null;
      this.heroShadow = null;
      this.bossShadow = null;
      this.bossTimer = null;
      this.isBossDying = false;
      this.activeTimers = new Set();
      this.vfxPool = [];
      this.lastAnimCombo = 0;

      // Global scene readout hook for deterministic Playwright/Chromium QA
      window.__LEX_RAID_SCENE_STATE__ = () => ({
        fsmState: this.fsmState,
        unitCode: this.battleState.unitCode,
        bossTheme: this.battleState.bossTheme,
        heroMode: this.battleState.heroMode,
        bossMode: this.battleState.bossMode,
        isBossDying: this.isBossDying,
        heroX: this.hero ? Math.round(this.hero.x) : null,
        heroY: this.hero ? Math.round(this.hero.y) : null,
        bossX: this.boss ? Math.round(this.boss.x) : null,
        bossY: this.boss ? Math.round(this.boss.y) : null,
        activeVfxCount: this.vfxPool.filter((s) => s.visible).length,
        poolSize: this.vfxPool.length,
        pendingTimers: this.activeTimers.size
      });
    }

    create() {
      const cfg = window.RaidPhaserConfig;
      const groundY = cfg.groundY || 350;
      this.cameras.main.roundPixels = true;

      this.bgSprite = this.add.image(cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.backgroundKey)
        .setDisplaySize(cfg.canvasWidth, cfg.canvasHeight)
        .setAlpha(0.95);

      this.heroShadow = this.add.ellipse(cfg.heroX, groundY + 2, 96, 16, 0x000000, 0.25).setDepth(2);
      this.bossShadow = this.add.ellipse(cfg.bossX, groundY + 2, 108, 18, 0x000000, 0.28).setDepth(2);

      this.createAllAnims();
      this.initVfxPool(12);
      this.spawnActors();

      this.events.on('set-battle-state', this.setBattleState, this);
      this.events.on('play-attack-sequence', this.playAttackSequence, this);
      this.events.on('play-skill-sequence', this.playSkillSequence, this);
      this.events.on('play-boss-turn-sequence', this.playBossTurnSequence, this);
      this.events.on('play-boss-death-sequence', this.playBossDeathSequence, this);
      this.events.on('play-boss-spawn-sequence', this.playBossSpawnSequence, this);
      this.events.on('show-hit-flash', this.showHitFlash, this);
      this.events.on('reset-actors', this.resetToIdleClean, this);

      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
      this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupScene, this);

      this._onVisibility = () => {
        if (document.hidden) {
          this.settleActiveActionImmediately();
        }
      };
      document.addEventListener('visibilitychange', this._onVisibility);
    }

    cleanupScene() {
      this.clearAllTimers();
      this.stopBossTimer();
      if (this.hero) this.tweens.killTweensOf(this.hero);
      if (this.boss) this.tweens.killTweensOf(this.boss);
      if (this._onVisibility) {
        document.removeEventListener('visibilitychange', this._onVisibility);
        this._onVisibility = null;
      }
      this.vfxPool.forEach((s) => s.destroy());
      this.vfxPool = [];
    }

    addSafeTimer(delay, callback) {
      const ev = this.time.delayedCall(delay, () => {
        this.activeTimers.delete(ev);
        if (this.scene && this.scene.isActive()) callback();
      });
      this.activeTimers.add(ev);
      return ev;
    }

    clearAllTimers() {
      for (const ev of this.activeTimers) {
        if (ev && ev.remove) ev.remove(false);
      }
      this.activeTimers.clear();
    }

    createAllAnims() {
      const cfg = window.RaidPhaserConfig;
      Object.entries(cfg.heroes).forEach(([unit, modes]) => {
        Object.entries(modes).forEach(([mode, meta]) => {
          if (!meta || typeof meta !== 'object' || !meta.url) return;
          const key = `anim-hero-${unit}-${mode}`;
          if (this.anims.exists(key)) return;
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(`hero-${unit}-${mode}`, { start: 0, end: meta.frames - 1 }),
            frameRate: meta.rate,
            repeat: mode.startsWith('attack') ? 0 : -1
          });
        });
      });

      Object.entries(cfg.bosses).forEach(([theme, modes]) => {
        Object.entries(modes).forEach(([mode, meta]) => {
          if (!meta || typeof meta !== 'object' || !meta.sheetUrl) return;
          const key = `anim-boss-${theme}-${mode}`;
          if (this.anims.exists(key)) return;
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(`boss-${theme}-${mode}-sheet`, { start: 0, end: meta.frames - 1 }),
            frameRate: meta.rate || 8,
            repeat: (mode === 'hit' || mode === 'death') ? 0 : -1
          });
        });
      });

      if (cfg.vfx) {
        Object.entries(cfg.vfx).forEach(([texKey, meta]) => {
          Object.entries(meta.anims || {}).forEach(([animKey, range]) => {
            if (this.anims.exists(animKey)) return;
            this.anims.create({
              key: animKey,
              frames: this.anims.generateFrameNumbers(texKey, { start: range.start, end: range.end }),
              frameRate: range.rate || 14,
              repeat: 0
            });
          });
        });
      }
    }

    initVfxPool(size) {
      for (let i = 0; i < size; i++) {
        const sp = this.add.sprite(0, 0, 'vfx-slash').setDepth(15).setVisible(false).setActive(false);
        sp.on('animationcomplete', () => {
          sp.setVisible(false).setActive(false);
        });
        this.vfxPool.push(sp);
      }
    }

    resolveVfxTexture(animKey) {
      const cfg = window.RaidPhaserConfig;
      if (!cfg.vfx) return null;
      for (const [texKey, meta] of Object.entries(cfg.vfx)) {
        if (meta.anims && meta.anims[animKey]) return texKey;
      }
      return null;
    }

    spawnPooledVfx(animKey, x, y, scale = 2.0, flipX = false) {
      if (!animKey || !this.anims.exists(animKey)) return null;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (reduced) return null;
      let sp = this.vfxPool.find((item) => !item.active);
      if (!sp) {
        sp = this.vfxPool[0];
        sp.stop();
      }
      const texKey = this.resolveVfxTexture(animKey);
      if (!texKey) return null;
      sp.setTexture(texKey);
      sp.setPosition(Math.round(x), Math.round(y));
      sp.setScale(scale);
      sp.setFlipX(Boolean(flipX));
      sp.setAlpha(1);
      sp.setActive(true).setVisible(true);
      sp.play(animKey);
      return sp;
    }

    getHeroConfig(unitCode) {
      const cfg = window.RaidPhaserConfig;
      return cfg.heroes[unitCode] || cfg.heroes.warrior;
    }

    getBaseCoords() {
      const cfg = window.RaidPhaserConfig;
      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      const groundY = cfg.groundY || 350;
      return {
        heroX: cfg.heroX + Number(heroCfg.battleOffsetX || 0),
        heroY: Number(heroCfg.battleY || groundY),
        bossX: cfg.bossX,
        bossY: groundY
      };
    }

    isInLockedCombatState() {
      return [STATES.APPROACH, STATES.ATTACK, STATES.IMPACT, STATES.RECOVERY, STATES.RETURN, STATES.HURT].includes(this.fsmState);
    }

    stopBossTimer() {
      if (this.bossTimer) {
        this.bossTimer.remove(false);
        this.bossTimer = null;
      }
    }

    spawnActors() {
      this.clearAllTimers();
      this.stopBossTimer();
      this.fsmState = STATES.IDLE;
      this.isBossDying = false;

      if (this.hero) { this.tweens.killTweensOf(this.hero); this.hero.destroy(); this.hero = null; }
      if (this.boss) { this.tweens.killTweensOf(this.boss); this.boss.destroy(); this.boss = null; }

      const cfg = window.RaidPhaserConfig;
      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      const base = this.getBaseCoords();

      this.hero = this.add.sprite(base.heroX, base.heroY, `hero-${this.battleState.unitCode}-idle`, 0);
      this.hero.setScale(Number(heroCfg.scale || cfg.heroScale || 1.35));
      this.hero.setOrigin(Number(heroCfg.originX || 0.5), Number(heroCfg.originY || 0.7135));
      this.hero.setDepth(5);

      this.heroShadow.setPosition(base.heroX, base.heroY + 2).setScale(Number(heroCfg.shadowScale || 1.1), 1).setVisible(true).setAlpha(0.25);

      this.boss = this.createBossSprite(this.battleState.bossTheme, this.battleState.bossMode);
      this.applyVisualState(true);
    }

    createBossSprite(theme, mode) {
      const cfg = window.RaidPhaserConfig;
      const groundY = cfg.groundY || 350;
      const themeMeta = cfg.bosses[theme] || cfg.bosses.crabby;
      const modeMeta = themeMeta[mode] || themeMeta.idle;
      const flip = themeMeta.nativeFacingLeft ? false : true;

      let sprite;
      if (themeMeta.isSheet && modeMeta.sheetUrl) {
        sprite = this.add.sprite(cfg.bossX, groundY, `boss-${theme}-${mode}-sheet`, 0).setDepth(5);
        sprite.__isSheet = true;
        const animKey = `anim-boss-${theme}-${mode}`;
        if (this.anims.exists(animKey)) sprite.play(animKey);
      } else {
        sprite = this.add.image(cfg.bossX, groundY, `boss-${theme}-${mode}-0`).setDepth(5);
        sprite.__frameImages = (modeMeta.frames || []).map((_, idx) => `boss-${theme}-${mode}-${idx}`);
        sprite.__frameIndex = 0;
        if (sprite.__frameImages[0]) sprite.setTexture(sprite.__frameImages[0]);
        this.startBossFrames(sprite, modeMeta.rate || 8, mode !== 'hit');
      }

      sprite.setScale(themeMeta.scale || 3.0);
      sprite.setOrigin(Number(themeMeta.originX || 0.5), Number(themeMeta.originY || 0.9));
      sprite.setFlipX(flip);
      sprite.__theme = theme;
      sprite.__mode = mode;

      this.bossShadow.setPosition(cfg.bossX, groundY + 2).setScale(Math.max(0.7, (themeMeta.scale || 3.0) / 3.5), 1).setVisible(true).setAlpha(0.28);
      return sprite;
    }

    startBossFrames(image, rate, loop) {
      this.stopBossTimer();
      if (!image || !image.__frameImages || image.__frameImages.length <= 1) return;
      const delay = Math.max(70, Math.round(1000 / Math.max(1, rate || 8)));
      this.bossTimer = this.time.addEvent({
        delay,
        loop,
        callback: () => {
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

    setBattleState(next) {
      const prevUnit = this.battleState.unitCode;
      const prevBoss = this.battleState.bossTheme;
      const prevBiome = this.battleState.biome;
      Object.assign(this.battleState, next || {});

      if (this.bgSprite && next?.biome && next.biome !== prevBiome) {
        const key = `raid-bg-${next.biome}`;
        if (this.textures.exists(key)) this.bgSprite.setTexture(key);
      }

      const unitChanged = Boolean(next && Object.prototype.hasOwnProperty.call(next, 'unitCode') && next.unitCode !== prevUnit);
      const bossChanged = Boolean(next && Object.prototype.hasOwnProperty.call(next, 'bossTheme') && next.bossTheme !== prevBoss);

      if (this.scene.isActive() && (!this.hero || !this.boss || unitChanged)) {
        this.spawnActors();
      } else {
        this.applyVisualState(bossChanged);
      }
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.events) uiScene.events.emit('set-ui-state', this.battleState);
    }

    applyVisualState(forceBossRecreate = false) {
      if (!this.hero || !this.boss) return;
      const desiredHeroMode = this.battleState.heroMode || 'idle';
      let heroKey = `anim-hero-${this.battleState.unitCode}-${desiredHeroMode}`;
      if (!this.anims.exists(heroKey)) heroKey = `anim-hero-${this.battleState.unitCode}-idle`;
      if (this.anims.exists(heroKey)) this.hero.play(heroKey, true);

      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      const base = this.getBaseCoords();
      this.hero.setScale(Number(heroCfg.scale || 1.35));
      this.hero.setOrigin(Number(heroCfg.originX || 0.5), Number(heroCfg.originY || 0.7135));

      // Guard: never overwrite hero/boss X/Y mid-lunge unless strictly idle!
      if (!this.isInLockedCombatState() && !this.isBossDying) {
        this.hero.setPosition(base.heroX, base.heroY);
        this.heroShadow.setPosition(base.heroX, base.heroY + 2).setScale(Number(heroCfg.shadowScale || 1.1), 1);
      }

      if (!this.isBossDying && this.boss) {
        const bossDiff = forceBossRecreate || this.boss.__theme !== this.battleState.bossTheme || this.boss.__mode !== this.battleState.bossMode;
        if (bossDiff) {
          const prevX = this.boss.x;
          this.tweens.killTweensOf(this.boss);
          this.boss.destroy();
          this.stopBossTimer();
          this.boss = this.createBossSprite(this.battleState.bossTheme, this.battleState.bossMode);
          if (this.isInLockedCombatState() && this.boss) this.boss.x = prevX;
        }
      }
    }

    settleActiveActionImmediately() {
      this.clearAllTimers();
      if (this.hero) this.tweens.killTweensOf(this.hero);
      if (this.boss && !this.isBossDying) this.tweens.killTweensOf(this.boss);
      this.fsmState = STATES.IDLE;
      const base = this.getBaseCoords();
      if (this.hero) {
        this.hero.setPosition(base.heroX, base.heroY);
        this.heroShadow.setPosition(base.heroX, base.heroY + 2);
      }
      if (this.boss && !this.isBossDying) {
        this.boss.setPosition(base.bossX, base.bossY);
        this.bossShadow.setPosition(base.bossX, base.bossY + 2);
      }
      this.vfxPool.forEach((s) => s.stop().setVisible(false).setActive(false));
      this.battleState.heroMode = 'idle';
      if (!this.isBossDying) this.battleState.bossMode = 'idle';
      this.applyVisualState(false);
    }

    resetToIdleClean() {
      this.settleActiveActionImmediately();
    }

    playAttackSequence(payload = {}) {
      if (this.isInLockedCombatState()) {
        this.settleActiveActionImmediately();
      }
      if (this.isBossDying) return;

      const skillMeta = payload.skillMeta || null;
      if (skillMeta && skillMeta.selfTarget) {
        this.playSupportSkillSequence(skillMeta);
        return;
      }

      const cfg = window.RaidPhaserConfig;
      const base = this.getBaseCoords();
      const gap = Math.max(56, base.bossX - base.heroX);
      const isRanged = this.battleState.unitCode === 'archer';
      const targetX = isRanged
        ? Math.min(base.bossX - 116, base.heroX + 46)
        : Math.min(base.bossX - 84, base.heroX + Math.max(84, gap * 0.6));

      this.lastAnimCombo = (this.lastAnimCombo + 1) % 3;
      const heroAttackMode = skillMeta?.heroAnim || ((this.battleState.unitCode === 'warrior' && (payload.isCrit || this.lastAnimCombo === 2)) ? 'attack2' : 'attack');
      const vfxMain = skillMeta?.vfxAnim || (heroAttackMode === 'attack2' ? 'vfx-slash-down' : 'vfx-slash-side');
      const vfxHit = skillMeta?.vfxHitAnim || 'vfx-slash-hit';
      const vfxScale = skillMeta?.vfxScale || 2.1;

      this.fsmState = STATES.APPROACH;
      this.setBattleState({ heroMode: isRanged ? 'attack' : 'run', bossMode: 'idle' });
      this.spawnPooledVfx('vfx-dash-mono-anim', base.heroX - 12, base.heroY - 12, 1.8, false);

      this.tweens.add({
        targets: this.hero,
        x: targetX,
        duration: isRanged ? 90 : 165,
        ease: 'Quad.Out',
        onUpdate: () => { if (this.heroShadow) this.heroShadow.x = this.hero.x; },
        onComplete: () => {
          this.fsmState = STATES.ATTACK;
          this.setBattleState({ heroMode: heroAttackMode });

          // Slash VFX near target
          const slashX = isRanged ? base.bossX - 24 : this.hero.x + 58;
          const slashY = base.bossY - 56;
          this.spawnPooledVfx(vfxMain, slashX, slashY, vfxScale, false);

          this.addSafeTimer(75, () => {
            if (this.isBossDying) return;
            this.fsmState = STATES.IMPACT;
            this.showHitFlash();
            this.setBattleState({ bossMode: 'hit' });
            this.spawnPooledVfx(vfxHit, base.bossX - 10, base.bossY - 54, 1.9, false);

            if (this.boss) {
              this.tweens.add({
                targets: this.boss,
                x: base.bossX + 12,
                duration: 75,
                yoyo: true,
                ease: 'Sine.InOut',
                onUpdate: () => { if (this.bossShadow) this.bossShadow.x = this.boss.x; }
              });
            }
          });

          this.addSafeTimer(420, () => {
            this.fsmState = STATES.RECOVERY;
            this.tweens.add({
              targets: this.hero,
              x: base.heroX,
              duration: 180,
              ease: 'Quad.Out',
              onUpdate: () => { if (this.heroShadow) this.heroShadow.x = this.hero.x; },
              onComplete: () => {
                this.fsmState = STATES.IDLE;
                this.setBattleState({ heroMode: 'idle', bossMode: this.isBossDying ? this.battleState.bossMode : 'idle' });
              }
            });
          });
        }
      });
    }

    playSkillSequence(payload = {}) {
      this.playAttackSequence(payload);
    }

    playSupportSkillSequence(skillMeta) {
      const base = this.getBaseCoords();
      this.fsmState = STATES.GUARD;
      this.setBattleState({ heroMode: skillMeta.heroAnim || 'guard', bossMode: 'idle' });
      this.spawnPooledVfx(skillMeta.vfxAnim || 'vfx-heal-frost-anim', base.heroX, base.heroY - 54, skillMeta.vfxScale || 2.6, false);
      if (skillMeta.vfxHitAnim) {
        this.addSafeTimer(120, () => {
          this.spawnPooledVfx(skillMeta.vfxHitAnim, base.heroX, base.heroY - 40, 2.2, false);
        });
      }
      this.addSafeTimer(620, () => {
        this.fsmState = STATES.IDLE;
        this.setBattleState({ heroMode: 'idle' });
      });
    }

    playBossTurnSequence() {
      if (!this.boss || this.isBossDying) return;
      if (this.isInLockedCombatState()) this.settleActiveActionImmediately();

      const base = this.getBaseCoords();
      this.fsmState = STATES.HURT;
      this.setBattleState({ bossMode: 'attack' });

      this.tweens.add({
        targets: this.boss,
        x: base.bossX - 42,
        duration: 160,
        yoyo: true,
        ease: 'Quad.Out',
        onUpdate: () => { if (this.bossShadow) this.bossShadow.x = this.boss.x; },
        onComplete: () => {
          this.cameras.main.shake(110, 0.003);
          this.spawnPooledVfx('vfx-ring-ember-anim', base.heroX + 18, base.heroY - 48, 2.2, true);
          this.addSafeTimer(90, () => {
            if (this.isBossDying) return;
            this.setBattleState({ bossMode: 'idle', heroMode: 'guard' });
          });
          this.addSafeTimer(480, () => {
            this.fsmState = STATES.IDLE;
            this.setBattleState({ heroMode: 'idle' });
          });
        }
      });
    }

    showHitFlash() {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (reduced) return;
      const cfg = window.RaidPhaserConfig;
      const flash = this.add.rectangle(cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.canvasWidth, cfg.canvasHeight, 0xfff5df, 0.0).setDepth(20);
      this.tweens.add({
        targets: flash,
        alpha: { from: 0.24, to: 0 },
        duration: 120,
        onComplete: () => flash.destroy()
      });
      this.cameras.main.shake(80, 0.0022);
    }

    playBossDeathSequence() {
      if (!this.boss) return;
      this.isBossDying = true;
      this.fsmState = STATES.DEATH;
      this.clearAllTimers();
      this.stopBossTimer();
      this.tweens.killTweensOf(this.boss);
      this.tweens.killTweensOf(this.bossShadow);

      const base = this.getBaseCoords();
      this.spawnPooledVfx('vfx-fire-burst-anim', this.boss.x, this.boss.y - 36, 2.6, false);
      this.spawnPooledVfx('fx-explosion-anim', this.boss.x, this.boss.y - 24, 1.5, false);
      this.cameras.main.shake(260, 0.007);

      this.tweens.add({
        targets: [this.boss, this.bossShadow],
        alpha: 0,
        scaleY: 0,
        duration: 620,
        ease: 'Quad.In',
        onComplete: () => {
          this.stopBossTimer();
          if (this.boss) this.boss.visible = false;
          if (this.bossShadow) this.bossShadow.visible = false;
          this.fsmState = STATES.VICTORY;
          const baseCoords = base;
          if (this.hero) {
            this.hero.setPosition(baseCoords.heroX, baseCoords.heroY);
            this.heroShadow.setPosition(baseCoords.heroX, baseCoords.heroY + 2);
          }
          this.setBattleState({ heroMode: 'guard' });
        }
      });
    }

    playBossSpawnSequence() {
      this.isBossDying = false;
      const cfg = window.RaidPhaserConfig;
      this.spawnActors();
      if (this.boss) {
        const finalScale = (cfg.bosses[this.battleState.bossTheme] || cfg.bosses.crabby).scale || 3.0;
        this.boss.alpha = 0;
        this.boss.scaleY = 0;
        this.boss.visible = true;
        if (this.bossShadow) this.bossShadow.visible = true;
        this.tweens.add({
          targets: [this.boss, this.bossShadow],
          alpha: 1,
          scaleY: finalScale,
          duration: 460,
          ease: 'Back.Out'
        });
      }
    }
  }

  window.RaidBattleScene = BattleScene;
  window.RAID_BATTLE_STATES = STATES;
})();
