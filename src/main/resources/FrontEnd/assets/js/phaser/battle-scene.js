/**
 * Phaser BattleScene State Machine, Lazy Asset Loader & 10-Profile Combat VFX Engine (P5)
 * Profiles: MELEE_SLASH, DASH_STRIKE, PROJECTILE, CHANNEL_BEAM, GROUND_CAST,
 *           SKY_STRIKE, SHIELD_CAST, SELF_HEAL, MULTI_HIT, ULTIMATE
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

  function isQaEnvironment() {
    if (typeof window === 'undefined' || !window.location) return false;
    const host = String(window.location.hostname || '').toLowerCase();
    const isLoopback = host === '127.0.0.1' || host === 'localhost' || host === '::1';
    if (!isLoopback) return false;
    return new URLSearchParams(window.location.search || '').get('qa') === '1';
  }

  class BattleScene extends Phaser.Scene {
    constructor() {
      super('BattleScene');
      const initial = window.__RAID_INITIAL_STATE__ || {};
      window.__RAID_INITIAL_STATE__ = null;
      this.battleState = {
        unitCode: 'warrior',
        bossTheme: 'crabby',
        bossRarity: 'NORMAL',
        waveIndex: 1,
        heroMode: 'idle',
        bossMode: 'idle',
        biome: 'dusk',
        bossStatusAura: null,
        errorText: '',
        ...initial
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
      this.tempObjects = new Set();
      this.vfxPool = [];
      this.lastAnimCombo = 0;
      this._actionToken = 0;
      this._heroAnimHooks = [];
      this._pendingLoads = new Map();
      this._lastProfile = null;
      this._lastHeroMovedX = 0;

      if (isQaEnvironment()) {
        window.__LEX_RAID_SCENE_STATE__ = () => ({
          fsmState: this.fsmState,
          unitCode: this.battleState.unitCode,
          bossTheme: this.battleState.bossTheme,
          bossRarity: this.battleState.bossRarity || 'NORMAL',
          heroMode: this.battleState.heroMode,
          bossMode: this.battleState.bossMode,
          isBossDying: this.isBossDying,
          groundY: (window.RaidPhaserConfig && window.RaidPhaserConfig.groundY) || 302,
          heroX: this.hero ? Math.round(this.hero.x) : null,
          heroY: this.hero ? Math.round(this.hero.y) : null,
          heroScale: this.hero ? Number(this.hero.scaleX.toFixed(2)) : null,
          heroDisplayH: this.hero ? Math.round(this.hero.displayHeight) : null,
          bossX: this.boss ? Math.round(this.boss.x) : null,
          bossY: this.boss ? Math.round(this.boss.y) : null,
          bossScale: this.boss ? Number(this.boss.scaleX.toFixed(2)) : null,
          bossDisplayH: this.boss ? Math.round(this.boss.displayHeight) : null,
          activeVfxCount: this.vfxPool.filter((s) => s.visible).length,
          activeTempObjects: this.tempObjects.size,
          poolSize: this.vfxPool.length,
          pendingTimers: this.activeTimers.size,
          actionToken: this._actionToken,
          lastProfile: this._lastProfile,
          lastHeroMovedX: Math.round(this._lastHeroMovedX)
        });
      }
    }

    isBusy() {
      return this.isInLockedCombatState() || this.fsmState === STATES.GUARD || this.isBossDying;
    }

    clearHeroAnimListeners() {
      if (this.hero && this._heroAnimHooks.length) {
        for (const { event, fn } of this._heroAnimHooks) {
          this.hero.off(event, fn);
        }
      }
      this._heroAnimHooks = [];
    }

    onHeroAnimEvent(event, fn) {
      if (!this.hero) return;
      this.hero.on(event, fn);
      this._heroAnimHooks.push({ event, fn });
    }

    trackTempObject(obj) {
      if (obj) this.tempObjects.add(obj);
      return obj;
    }

    destroyTempObject(obj) {
      if (!obj) return;
      this.tempObjects.delete(obj);
      if (this.tweens) this.tweens.killTweensOf(obj);
      if (obj.destroy && obj.scene) obj.destroy();
    }

    cleanupTempObjects() {
      for (const obj of Array.from(this.tempObjects)) {
        if (this.tweens) this.tweens.killTweensOf(obj);
        if (obj && obj.destroy && obj.scene) obj.destroy();
      }
      this.tempObjects.clear();
    }

    create() {
      const cfg = window.RaidPhaserConfig;
      const groundY = cfg.groundY || 302;
      this.cameras.main.roundPixels = true;

      const initBgKey = this.textures.exists(`raid-bg-${this.battleState.biome}`) ? `raid-bg-${this.battleState.biome}` : cfg.backgroundKey;
      this.bgSprite = this.add.image(cfg.canvasWidth / 2, cfg.canvasHeight / 2, initBgKey)
        .setDisplaySize(cfg.canvasWidth, cfg.canvasHeight)
        .setAlpha(0.95);

      this.heroShadow = this.add.ellipse(cfg.heroX, groundY + 2, 96, 16, 0x000000, 0.25).setDepth(2);
      this.bossShadow = this.add.ellipse(cfg.bossX, groundY + 2, 108, 18, 0x000000, 0.28).setDepth(2);

      this.registerLoadedAnims();
      this.initVfxPool(16);
      this.spawnActors();

      this.events.on('set-battle-state', this.setBattleState, this);
      this.events.on('play-attack-sequence', this.playAttackSequence, this);
      this.events.on('play-skill-sequence', this.playSkillSequence, this);
      this.events.on('play-boss-turn-sequence', this.playBossTurnSequence, this);
      this.events.on('play-boss-death-sequence', this.playBossDeathSequence, this);
      this.events.on('play-boss-spawn-sequence', this.playBossSpawnSequence, this);
      this.events.on('show-hit-flash', this.showHitFlash, this);
      this.events.on('reset-actors', this.resetToIdleClean, this);
      this.events.on('preload-loadout-vfx', (animKeys) => this.ensureVfxLoaded(animKeys), this);

      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
      this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupScene, this);

      this._onVisibility = () => {
        if (document.hidden) this.settleActiveActionImmediately();
      };
      document.addEventListener('visibilitychange', this._onVisibility);

      this._onScaleResize = () => {
        this.cameras.main.roundPixels = true;
        const base = this.getBaseCoords();
        if (this.hero) {
          this.hero.y = base.heroY;
          if (!this.isInLockedCombatState() && this.fsmState !== STATES.GUARD) {
            this.hero.x = base.heroX;
          }
          if (this.heroShadow) this.heroShadow.setPosition(this.hero.x, base.heroY + 2);
        }
        if (this.boss && !this.isBossDying) {
          this.boss.y = base.bossY;
          if (!this.isInLockedCombatState()) this.boss.x = base.bossX;
          if (this.bossShadow) this.bossShadow.setPosition(this.boss.x, base.bossY + 2);
        }
      };
      this.scale.on('resize', this._onScaleResize);
    }

    cleanupScene() {
      this._actionToken += 1;
      this.clearAllTimers();
      this.stopBossTimer();
      this.clearHeroAnimListeners();
      this.cleanupTempObjects();
      if (this.hero) this.tweens.killTweensOf(this.hero);
      if (this.boss) this.tweens.killTweensOf(this.boss);
      if (this._onVisibility) {
        document.removeEventListener('visibilitychange', this._onVisibility);
        this._onVisibility = null;
      }
      if (this._onScaleResize && this.scale) {
        this.scale.off('resize', this._onScaleResize);
        this._onScaleResize = null;
      }
      this.vfxPool.forEach((s) => s.destroy());
      this.vfxPool = [];
      if (typeof window !== 'undefined' && window.__LEX_RAID_SCENE_STATE__) {
        delete window.__LEX_RAID_SCENE_STATE__;
      }
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

    registerLoadedAnims() {
      const cfg = window.RaidPhaserConfig;
      Object.entries(cfg.heroes || {}).forEach(([unit, modes]) => {
        Object.entries(modes).forEach(([mode, meta]) => {
          if (!meta || typeof meta !== 'object' || !meta.url) return;
          const texKey = `hero-${unit}-${mode}`;
          const key = `anim-hero-${unit}-${mode}`;
          if (!this.textures.exists(texKey) || this.anims.exists(key)) return;
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: meta.frames - 1 }),
            frameRate: meta.rate,
            repeat: mode.startsWith('attack') ? 0 : -1
          });
        });
      });

      Object.entries(cfg.bosses || {}).forEach(([theme, modes]) => {
        Object.entries(modes).forEach(([mode, meta]) => {
          if (!meta || typeof meta !== 'object' || !meta.sheetUrl) return;
          const texKey = `boss-${theme}-${mode}-sheet`;
          const key = `anim-boss-${theme}-${mode}`;
          if (!this.textures.exists(texKey) || this.anims.exists(key)) return;
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: meta.frames - 1 }),
            frameRate: meta.rate || 8,
            repeat: (mode === 'hit' || mode === 'death') ? 0 : -1
          });
        });
      });

      if (cfg.vfx) {
        Object.entries(cfg.vfx).forEach(([texKey, meta]) => {
          if (!this.textures.exists(texKey)) return;
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

    runLazyLoad(cacheKey, queueFn, onDone) {
      if (this._pendingLoads.has(cacheKey)) {
        this._pendingLoads.get(cacheKey).push(onDone);
        return;
      }
      this._pendingLoads.set(cacheKey, [onDone]);
      const queued = queueFn();
      const finishAll = () => {
        this.registerLoadedAnims();
        const cbs = this._pendingLoads.get(cacheKey) || [];
        this._pendingLoads.delete(cacheKey);
        cbs.forEach((cb) => { try { cb && cb(); } catch (_) {} });
      };
      if (!queued) {
        finishAll();
        return;
      }
      this.load.once('complete', finishAll);
      if (!this.load.isLoading()) this.load.start();
    }

    ensureHeroLoaded(unit, onDone) {
      const cfg = window.RaidPhaserConfig;
      const modes = cfg.heroes && cfg.heroes[unit];
      if (!modes || this.textures.exists(`hero-${unit}-idle`)) {
        if (onDone) onDone();
        return;
      }
      this.runLazyLoad(`hero:${unit}`, () => {
        let count = 0;
        Object.entries(modes).forEach(([mode, meta]) => {
          if (!meta || typeof meta !== 'object' || !meta.url) return;
          const texKey = `hero-${unit}-${mode}`;
          if (!this.textures.exists(texKey)) {
            this.load.spritesheet(texKey, meta.url, {
              frameWidth: Number(modes.frameWidth || cfg.heroFrameWidth || 192),
              frameHeight: Number(modes.frameHeight || cfg.heroFrameHeight || 192)
            });
            count++;
          }
        });
        return count > 0;
      }, onDone);
    }

    ensureBossLoaded(theme, onDone) {
      const cfg = window.RaidPhaserConfig;
      const modes = cfg.bosses && cfg.bosses[theme];
      if (!modes) { if (onDone) onDone(); return; }
      const alreadyLoaded = modes.isSheet
        ? this.textures.exists(`boss-${theme}-idle-sheet`)
        : this.textures.exists(`boss-${theme}-idle-0`);
      if (alreadyLoaded) {
        if (onDone) onDone();
        return;
      }
      this.runLazyLoad(`boss:${theme}`, () => {
        let count = 0;
        Object.entries(modes).forEach(([mode, meta]) => {
          if (!meta || typeof meta !== 'object') return;
          if (meta.sheetUrl) {
            const key = `boss-${theme}-${mode}-sheet`;
            if (!this.textures.exists(key)) {
              this.load.spritesheet(key, meta.sheetUrl, {
                frameWidth: Number(meta.fw || 32),
                frameHeight: Number(meta.fh || 32)
              });
              count++;
            }
          } else if (Array.isArray(meta.frames)) {
            meta.frames.forEach((src, idx) => {
              const key = `boss-${theme}-${mode}-${idx}`;
              if (!this.textures.exists(key)) {
                this.load.image(key, src);
                count++;
              }
            });
          }
        });
        return count > 0;
      }, onDone);
    }

    ensureBiomeLoaded(biome, onDone) {
      const cfg = window.RaidPhaserConfig;
      const url = cfg.biomeStages && cfg.biomeStages[biome];
      const texKey = `raid-bg-${biome}`;
      if (!url || this.textures.exists(texKey)) {
        if (onDone) onDone();
        return;
      }
      this.runLazyLoad(`biome:${biome}`, () => {
        this.load.image(texKey, url);
        return true;
      }, onDone);
    }

    ensureVfxLoaded(animKeys = [], onDone) {
      const cfg = window.RaidPhaserConfig;
      const list = Array.isArray(animKeys) ? animKeys.filter(Boolean) : [animKeys].filter(Boolean);
      const missingTextures = [];
      for (const aKey of list) {
        const texKey = this.resolveVfxTexture(aKey);
        if (texKey && !this.textures.exists(texKey) && !missingTextures.includes(texKey)) {
          missingTextures.push(texKey);
        }
      }
      if (missingTextures.length === 0) {
        if (onDone) onDone();
        return;
      }
      this.runLazyLoad(`vfx:${missingTextures.join(',')}`, () => {
        let count = 0;
        missingTextures.forEach((texKey) => {
          const meta = cfg.vfx[texKey];
          if (meta && !this.textures.exists(texKey)) {
            this.load.spritesheet(texKey, meta.url, {
              frameWidth: Number(meta.fw || 64),
              frameHeight: Number(meta.fh || 64)
            });
            count++;
          }
        });
        return count > 0;
      }, onDone);
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
      if (!cfg.vfx || !animKey) return null;
      for (const [texKey, meta] of Object.entries(cfg.vfx)) {
        if (meta.anims && meta.anims[animKey]) return texKey;
      }
      return null;
    }

    spawnPooledVfx(animKey, x, y, scale = 2.0, flipX = false, extraOpts = {}) {
      if (!animKey || !this.anims.exists(animKey)) return null;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (reduced && !extraOpts.allowReduced) return null;
      let sp = this.vfxPool.find((item) => !item.active);
      if (!sp) {
        sp = this.vfxPool[0];
        sp.stop();
      }
      const texKey = this.resolveVfxTexture(animKey);
      if (!texKey || !this.textures.exists(texKey)) return null;
      sp.setTexture(texKey);
      sp.setPosition(Math.round(x), Math.round(y));
      sp.setScale(scale);
      sp.setFlipX(Boolean(flipX));
      sp.setAngle(Number(extraOpts.angle || 0));
      sp.setDepth(Number(extraOpts.depth || 15));
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
      const groundY = cfg.groundY || 302;
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
      this.cleanupTempObjects();
      this.fsmState = STATES.IDLE;
      this.isBossDying = false;

      if (this.hero) { this.tweens.killTweensOf(this.hero); this.hero.destroy(); this.hero = null; }
      if (this.boss) { this.tweens.killTweensOf(this.boss); this.boss.destroy(); this.boss = null; }

      const cfg = window.RaidPhaserConfig;
      const unitCode = this.battleState.unitCode;
      if (!this.textures.exists(`hero-${unitCode}-idle`)) {
        this.ensureHeroLoaded(unitCode, () => {
          if (this.battleState.unitCode === unitCode && this.scene.isActive()) this.spawnActors();
        });
      }
      if (!this.textures.exists(`boss-${this.battleState.bossTheme}-idle-0`) && !this.textures.exists(`boss-${this.battleState.bossTheme}-idle-sheet`)) {
        const bTheme = this.battleState.bossTheme;
        this.ensureBossLoaded(bTheme, () => {
          if (this.battleState.bossTheme === bTheme && this.scene.isActive()) this.applyVisualState(true);
        });
      }

      const heroCfg = this.getHeroConfig(unitCode);
      const base = this.getBaseCoords();
      const heroTex = this.textures.exists(`hero-${unitCode}-idle`) ? `hero-${unitCode}-idle` : 'hero-warrior-idle';

      this.hero = this.add.sprite(base.heroX, base.heroY, heroTex, 0);
      this.hero.setScale(Number(heroCfg.scale || cfg.heroScale || 1.35));
      this.hero.setOrigin(Number(heroCfg.originX || 0.5), Number(heroCfg.originY || 0.7135));
      this.hero.setDepth(5);

      this.heroShadow.setPosition(base.heroX, base.heroY + 2).setScale(Number(heroCfg.shadowScale || 1.1), 1).setVisible(true).setAlpha(0.25);

      this.boss = this.createBossSprite(this.battleState.bossTheme, this.battleState.bossMode);
      this.applyVisualState(true);
    }

    getEffectiveBossScale(theme) {
      const cfg = window.RaidPhaserConfig || {};
      const themeMeta = cfg.bosses[theme] || cfg.bosses.crabby || {};
      const baseScale = Number(themeMeta.scale || 3.4);
      const rarityKey = String(this.battleState.bossRarity || 'NORMAL').toUpperCase();
      const rarityMul = Number((cfg.rarityScales && cfg.rarityScales[rarityKey]) || 1.0);
      return Number((baseScale * rarityMul).toFixed(2));
    }

    createBossSprite(theme, mode) {
      const cfg = window.RaidPhaserConfig;
      const groundY = cfg.groundY || 302;
      const themeMeta = cfg.bosses[theme] || cfg.bosses.crabby;
      const modeMeta = themeMeta[mode] || themeMeta.idle;
      const flip = themeMeta.nativeFacingLeft ? false : true;
      const effScale = this.getEffectiveBossScale(theme);

      let sprite;
      if (themeMeta.isSheet && modeMeta.sheetUrl && this.textures.exists(`boss-${theme}-${mode}-sheet`)) {
        sprite = this.add.sprite(cfg.bossX, groundY, `boss-${theme}-${mode}-sheet`, 0).setDepth(5);
        sprite.__isSheet = true;
        const animKey = `anim-boss-${theme}-${mode}`;
        if (this.anims.exists(animKey)) sprite.play(animKey);
      } else if (!themeMeta.isSheet && this.textures.exists(`boss-${theme}-${mode}-0`)) {
        sprite = this.add.image(cfg.bossX, groundY, `boss-${theme}-${mode}-0`).setDepth(5);
        sprite.__frameImages = (modeMeta.frames || []).map((_, idx) => `boss-${theme}-${mode}-${idx}`);
        sprite.__frameIndex = 0;
        if (sprite.__frameImages[0]) sprite.setTexture(sprite.__frameImages[0]);
        this.startBossFrames(sprite, modeMeta.rate || 8, mode !== 'hit');
      } else {
        // Fallback placeholder sprite while lazy-load completes
        const fallbackKey = this.textures.exists('boss-crabby-idle-0') ? 'boss-crabby-idle-0' : cfg.backgroundKey;
        sprite = this.add.image(cfg.bossX, groundY, fallbackKey).setDepth(5);
        sprite.__pendingTheme = theme;
        this.ensureBossLoaded(theme, () => {
          if (this.battleState.bossTheme === theme && this.scene.isActive() && !this.isBossDying) {
            this.applyVisualState(true);
          }
        });
      }

      sprite.setScale(effScale);
      sprite.setOrigin(Number(themeMeta.originX || 0.5), Number(themeMeta.originY || 0.9));
      sprite.setFlipX(flip);
      sprite.__theme = theme;
      sprite.__mode = mode;
      sprite.__rarity = this.battleState.bossRarity || 'NORMAL';

      this.bossShadow.setPosition(cfg.bossX, groundY + 2).setScale(Math.max(0.8, effScale / 3.4), 1).setVisible(true).setAlpha(0.28);
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
          if (this.textures.exists(image.__frameImages[image.__frameIndex])) {
            image.setTexture(image.__frameImages[image.__frameIndex]);
          }
        }
      });
    }

    setBattleState(next) {
      const prevUnit = this.battleState.unitCode;
      const prevBoss = this.battleState.bossTheme;
      const prevRarity = this.battleState.bossRarity;
      const prevBiome = this.battleState.biome;
      Object.assign(this.battleState, next || {});

      if (next && Array.isArray(next.activeVfxAnims)) {
        this.ensureVfxLoaded(next.activeVfxAnims);
      }

      if (this.bgSprite && next?.biome && next.biome !== prevBiome) {
        const bKey = `raid-bg-${next.biome}`;
        if (this.textures.exists(bKey)) this.bgSprite.setTexture(bKey);
        else {
          this.ensureBiomeLoaded(next.biome, () => {
            if (this.bgSprite && this.battleState.biome === next.biome && this.textures.exists(bKey)) {
              this.bgSprite.setTexture(bKey);
            }
          });
        }
      }

      const unitChanged = Boolean(next && Object.prototype.hasOwnProperty.call(next, 'unitCode') && next.unitCode !== prevUnit);
      const bossChanged = Boolean(next && ((Object.prototype.hasOwnProperty.call(next, 'bossTheme') && next.bossTheme !== prevBoss) || (Object.prototype.hasOwnProperty.call(next, 'bossRarity') && next.bossRarity !== prevRarity)));

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
      if (!this.anims.exists(heroKey)) heroKey = 'anim-hero-warrior-idle';
      if (this.anims.exists(heroKey)) this.hero.play(heroKey, true);

      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      const base = this.getBaseCoords();
      this.hero.setScale(Number(heroCfg.scale || 1.56));
      this.hero.setOrigin(Number(heroCfg.originX || 0.5), Number(heroCfg.originY || 0.7135));

      if (!this.isInLockedCombatState() && !this.isBossDying) {
        this.hero.setPosition(base.heroX, base.heroY);
        this.heroShadow.setPosition(base.heroX, base.heroY + 2).setScale(Number(heroCfg.shadowScale || 1.3), 1);
      }

      if (!this.isBossDying && this.boss) {
        const bossDiff = forceBossRecreate || this.boss.__pendingTheme || this.boss.__theme !== this.battleState.bossTheme || this.boss.__mode !== this.battleState.bossMode || this.boss.__rarity !== (this.battleState.bossRarity || 'NORMAL');
        if (bossDiff) {
          const prevX = this.boss.x;
          this.tweens.killTweensOf(this.boss);
          this.boss.destroy();
          this.stopBossTimer();
          this.boss = this.createBossSprite(this.battleState.bossTheme, this.battleState.bossMode);
          if (this.isInLockedCombatState() && this.boss) this.boss.x = prevX;
        }
        const aura = this.battleState.bossStatusAura;
        if (aura === 'frost') this.boss.setTint(0x9be7ff);
        else if (aura === 'burn') this.boss.setTint(0xffb088);
        else if (aura === 'stun') this.boss.setTint(0xffe57f);
        else this.boss.clearTint();
      }
    }

    settleActiveActionImmediately() {
      this._actionToken += 1;
      this.clearAllTimers();
      this.clearHeroAnimListeners();
      this.cleanupTempObjects();
      if (this.hero) {
        this.tweens.killTweensOf(this.hero);
        this.hero.clearTint();
      }
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

    spawnFloatingText(text, x, y, color = '#ffebb3', big = false) {
      if (!text || !this.scene || !this.scene.isActive()) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const label = this.add.text(Math.round(x), Math.round(y), String(text), {
        fontFamily: 'Pixelify Sans, sans-serif',
        fontSize: big ? '24px' : '18px',
        fontStyle: 'bold',
        color,
        stroke: '#140d09',
        strokeThickness: 5
      }).setOrigin(0.5, 1).setDepth(22);
      this.trackTempObject(label);
      if (reduced) {
        this.addSafeTimer(420, () => this.destroyTempObject(label));
        return;
      }
      this.tweens.add({
        targets: label,
        y: Math.round(y) - 34,
        alpha: { from: 1, to: 0 },
        duration: 720,
        ease: 'Cubic.Out',
        onComplete: () => this.destroyTempObject(label)
      });
    }

    applyBossHitReaction(dmgVal, payload, hitVfxAnim, labelSuffix = '', customY = null) {
      const base = this.getBaseCoords();
      this.showHitFlash();
      this.setBattleState({ bossMode: 'hit' });
      if (hitVfxAnim) {
        this.spawnPooledVfx(hitVfxAnim, base.bossX - 10, customY ?? (base.bossY - 54), 2.1, false);
      }
      if (dmgVal > 0) {
        const floatText = `${payload?.isTopicWord && !labelSuffix ? `-${dmgVal} CRIT!` : `-${dmgVal}${labelSuffix}`}`;
        const floatColor = payload?.isTopicWord ? '#fde047' : '#ffffff';
        this.spawnFloatingText(floatText, base.bossX + (Math.random() * 14 - 7), (customY ?? (base.bossY - 96)), floatColor, Boolean(payload?.isTopicWord || payload?.skillMeta));
      } else if (payload?.combatLabel) {
        this.spawnFloatingText(payload.combatLabel, base.bossX, base.bossY - 96, '#fde047', true);
      }
      if (this.boss && !this.isBossDying) {
        this.tweens.killTweensOf(this.boss);
        this.boss.setPosition(base.bossX, base.bossY);
        this.tweens.add({
          targets: this.boss,
          x: base.bossX + 12,
          y: base.bossY,
          duration: 75,
          yoyo: true,
          ease: 'Sine.InOut',
          onUpdate: () => { if (this.bossShadow) this.bossShadow.setPosition(this.boss.x, base.bossY + 2); },
          onComplete: () => {
            if (this.boss && !this.isBossDying) {
              this.boss.setPosition(base.bossX, base.bossY);
              if (this.bossShadow) this.bossShadow.setPosition(base.bossX, base.bossY + 2);
            }
          }
        });
      }
    }

    playHeroAnimSafe(heroMode) {
      const unit = this.battleState.unitCode;
      const targetKey = this.anims.exists(`anim-hero-${unit}-${heroMode}`)
        ? `anim-hero-${unit}-${heroMode}`
        : (this.anims.exists(`anim-hero-${unit}-attack`) ? `anim-hero-${unit}-attack` : `anim-hero-${unit}-idle`);
      this.setBattleState({ heroMode });
      if (this.hero && this.anims.exists(targetKey)) {
        this.hero.play(targetKey, false);
      }
      return targetKey;
    }

    finishSkillToIdle(token, delayMs = 200) {
      this.addSafeTimer(delayMs, () => {
        if (token !== this._actionToken) return;
        this.clearHeroAnimListeners();
        this.fsmState = STATES.IDLE;
        this.setBattleState({
          heroMode: 'idle',
          bossMode: this.isBossDying ? this.battleState.bossMode : 'idle'
        });
      });
    }

    resolveProfile(skillMeta) {
      const reg = window.RaidRegistry;
      if (reg?.resolveAnimationProfile && skillMeta) {
        return reg.resolveAnimationProfile(skillMeta, this.battleState.unitCode);
      }
      if (skillMeta?.selfTarget) return skillMeta.healHp ? 'SELF_HEAL' : 'SHIELD_CAST';
      if (skillMeta?.animationProfile) return skillMeta.animationProfile;
      return this.battleState.unitCode === 'archer' || this.battleState.unitCode === 'arcane_mage' ? 'PROJECTILE' : 'MELEE_SLASH';
    }

    playAttackSequence(payload = {}) {
      this.playSkillSequence(payload);
    }

    playSkillSequence(payload = {}) {
      if (this.isBossDying) return;
      if (this.isInLockedCombatState() || this.fsmState === STATES.GUARD) {
        this.settleActiveActionImmediately();
      }

      const skillMeta = payload.skillMeta || null;
      const neededVfx = [skillMeta?.vfxAnim, skillMeta?.vfxExtraAnim, skillMeta?.vfxHitAnim].filter(Boolean);
      const hasUnloaded = neededVfx.some((a) => {
        const tx = this.resolveVfxTexture(a);
        return tx && !this.textures.exists(tx);
      });

      this._actionToken += 1;
      const token = this._actionToken;

      if (hasUnloaded) {
        this.ensureVfxLoaded(neededVfx, () => {
          if (token !== this._actionToken || this.isBossDying) return;
          this.executeProfileSequence(token, skillMeta, payload);
        });
        return;
      }
      this.executeProfileSequence(token, skillMeta, payload);
    }

    executeProfileSequence(token, skillMeta, payload) {
      const profile = this.resolveProfile(skillMeta);
      this._lastProfile = profile;
      this._lastHeroMovedX = 0;

      if (profile === 'SHIELD_CAST' || profile === 'SELF_HEAL') {
        this.playSupportSkillSequence(token, skillMeta || {}, payload, profile);
        return;
      }
      if (profile === 'PROJECTILE') {
        this.playProjectileSequence(token, skillMeta || {}, payload, 1);
        return;
      }
      if (profile === 'CHANNEL_BEAM') {
        this.playChannelBeamSequence(token, skillMeta || {}, payload);
        return;
      }
      if (profile === 'GROUND_CAST') {
        this.playGroundCastSequence(token, skillMeta || {}, payload);
        return;
      }
      if (profile === 'SKY_STRIKE') {
        this.playSkyStrikeSequence(token, skillMeta || {}, payload);
        return;
      }
      if (profile === 'DASH_STRIKE') {
        this.playDashStrikeSequence(token, skillMeta || {}, payload);
        return;
      }
      if (profile === 'MULTI_HIT') {
        const isRangedMulti = Boolean(skillMeta?.subProfile === 'PROJECTILE' || this.battleState.unitCode === 'archer' || this.battleState.unitCode === 'arcane_mage');
        if (isRangedMulti) {
          this.playProjectileSequence(token, skillMeta || {}, payload, Math.max(2, Number(skillMeta?.hitCount || 3)));
        } else {
          this.playMeleeSequence(token, skillMeta, payload, Math.max(2, Number(skillMeta?.hitCount || 3)));
        }
        return;
      }
      if (profile === 'ULTIMATE') {
        this.playUltimateSequence(token, skillMeta || {}, payload);
        return;
      }
      // Default: MELEE_SLASH (and ranged fallback guard if Archer/Mage somehow casts unmapped skill)
      if (this.battleState.unitCode === 'archer' || this.battleState.unitCode === 'arcane_mage') {
        this.playProjectileSequence(token, skillMeta || {}, payload, 1);
        return;
      }
      this.playMeleeSequence(token, skillMeta, payload, 1);
    }

    // Profile 1 & 9 (Melee): MELEE_SLASH / Melee MULTI_HIT
    playMeleeSequence(token, skillMeta, payload, hitCount = 1) {
      const base = this.getBaseCoords();
      const gap = Math.max(56, base.bossX - base.heroX);
      const targetX = Math.min(base.bossX - 84, base.heroX + Math.max(84, gap * 0.6));
      this._lastHeroMovedX = Math.abs(targetX - base.heroX);

      this.lastAnimCombo = (this.lastAnimCombo + 1) % 3;
      const heroAttackMode = skillMeta?.heroAnim || (this.lastAnimCombo === 2 ? 'attack2' : 'attack');
      const vfxMain = skillMeta?.vfxAnim || (heroAttackMode === 'attack2' ? 'vfx-slash-down' : 'vfx-slash-side');
      const vfxExtra = skillMeta?.vfxExtraAnim || null;
      const vfxHit = skillMeta?.vfxHitAnim || 'vfx-slash-hit';
      const vfxScale = skillMeta?.vfxScale || 2.2;

      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      const heroModeMeta = heroCfg[heroAttackMode] || heroCfg.attack || { frames: 4, rate: 10, hitFrame: 2 };
      const totalFrames = Math.max(1, Number(heroModeMeta.frames || 4));
      const animRate = Math.max(1, Number(heroModeMeta.rate || 10));
      const animDurationMs = Math.round((totalFrames / animRate) * 1000);
      const targetHitFrame = Math.min(totalFrames - 1, Math.max(0, Number(heroModeMeta.hitFrame ?? Math.floor(totalFrames / 2))));

      this.fsmState = STATES.APPROACH;
      this.setBattleState({ heroMode: 'run', bossMode: 'idle' });
      this.spawnPooledVfx('vfx-dash-mono-anim', base.heroX - 12, base.heroY - 12, 1.8, false);

      this.tweens.killTweensOf(this.hero);
      this.tweens.add({
        targets: this.hero,
        x: targetX,
        y: base.heroY,
        duration: 160,
        ease: 'Quad.Out',
        onUpdate: () => { if (this.heroShadow) this.heroShadow.setPosition(this.hero.x, base.heroY + 2); },
        onComplete: () => {
          if (token !== this._actionToken || this.isBossDying) return;
          this.fsmState = STATES.ATTACK;
          let impactFired = false;
          let returning = false;
          const totalDmg = Number(payload.damage || skillMeta?.previewDmg || 0);
          const dmgPerHit = hitCount > 1 ? Math.max(1, Math.round(totalDmg / hitCount)) : totalDmg;

          const triggerImpact = () => {
            if (impactFired || token !== this._actionToken || this.isBossDying) return;
            impactFired = true;
            this.fsmState = STATES.IMPACT;
            for (let i = 0; i < hitCount; i++) {
              this.addSafeTimer(i * 115, () => {
                if (token !== this._actionToken || this.isBossDying) return;
                this.spawnPooledVfx(vfxMain, this.hero.x + 56, base.bossY - 56 + (i * 8 - 8), vfxScale, i % 2 === 1);
                if (i === 0 && vfxExtra) {
                  this.spawnPooledVfx(vfxExtra, base.bossX - 14, base.bossY - 60, Math.max(1.8, vfxScale * 0.9), false);
                }
                this.applyBossHitReaction(dmgPerHit, payload, vfxHit, hitCount > 1 ? ` x${i + 1}` : '', base.bossY - 96 - (i * 18));
              });
            }
          };

          const startReturn = () => {
            if (returning || token !== this._actionToken || this.isBossDying) return;
            returning = true;
            if (!impactFired) triggerImpact();
            this.clearHeroAnimListeners();
            this.fsmState = STATES.RETURN;
            this.tweens.killTweensOf(this.hero);
            this.tweens.add({
              targets: this.hero,
              x: base.heroX,
              y: base.heroY,
              duration: 165,
              ease: 'Quad.Out',
              onUpdate: () => { if (this.heroShadow) this.heroShadow.setPosition(this.hero.x, base.heroY + 2); },
              onComplete: () => {
                if (token !== this._actionToken) return;
                this.fsmState = STATES.IDLE;
                this.setBattleState({ heroMode: 'idle', bossMode: this.isBossDying ? this.battleState.bossMode : 'idle' });
              }
            });
          };

          const resolvedKey = this.playHeroAnimSafe(heroAttackMode);
          this.clearHeroAnimListeners();
          this.onHeroAnimEvent('animationupdate', (anim, frame) => {
            if (token !== this._actionToken || !anim || anim.key !== resolvedKey) return;
            const zeroIdx = Math.max(0, Number(frame && frame.index ? frame.index - 1 : 0));
            if (zeroIdx >= targetHitFrame) triggerImpact();
          });
          this.onHeroAnimEvent('animationcomplete', (anim) => {
            if (token !== this._actionToken || !anim || anim.key !== resolvedKey) return;
            if (!impactFired) triggerImpact();
            this.fsmState = STATES.RECOVERY;
            this.addSafeTimer((hitCount - 1) * 115 + 50, startReturn);
          });

          this.addSafeTimer(Math.round((targetHitFrame / animRate) * 1000) + 25, triggerImpact);
          this.addSafeTimer(animDurationMs + (hitCount - 1) * 115 + 150, startReturn);
        }
      });
    }

    // Profile 2: DASH_STRIKE (Anticipation + Blink Dash + Afterimage + Double Hit)
    playDashStrikeSequence(token, skillMeta, payload) {
      const base = this.getBaseCoords();
      const dashTargetX = Math.min(base.bossX - 78, base.bossX - 72);
      this._lastHeroMovedX = Math.abs(dashTargetX - base.heroX);
      const totalDmg = Number(payload.damage || skillMeta?.previewDmg || 20);
      const hitCount = Math.max(1, Number(skillMeta?.hitCount || 2));
      const dmgPerHit = Math.max(1, Math.round(totalDmg / hitCount));

      this.fsmState = STATES.APPROACH;
      this.playHeroAnimSafe(skillMeta.heroAnim || 'attack2');
      this.spawnPooledVfx(skillMeta.vfxAnim || 'vfx-pvfx-blink-dash', base.heroX + 18, base.heroY - 46, 2.0, false);

      // Spawn translucent afterimage clone that fades smoothly
      if (this.hero && this.textures.exists(this.hero.texture.key)) {
        const ghost = this.add.sprite(base.heroX + 40, base.heroY, this.hero.texture.key, 0)
          .setScale(this.hero.scaleX, this.hero.scaleY)
          .setOrigin(this.hero.originX, this.hero.originY)
          .setAlpha(0.55)
          .setTint(0x7dd3fc)
          .setDepth(4);
        this.trackTempObject(ghost);
        this.tweens.add({ targets: ghost, alpha: 0, duration: 240, onComplete: () => this.destroyTempObject(ghost) });
      }

      this.tweens.killTweensOf(this.hero);
      this.tweens.add({
        targets: this.hero,
        x: dashTargetX,
        y: base.heroY,
        duration: 115,
        ease: 'Cubic.InOut',
        onUpdate: () => { if (this.heroShadow) this.heroShadow.setPosition(this.hero.x, base.heroY + 2); },
        onComplete: () => {
          if (token !== this._actionToken || this.isBossDying) return;
          this.fsmState = STATES.IMPACT;
          for (let i = 0; i < hitCount; i++) {
            this.addSafeTimer(i * 110, () => {
              if (token !== this._actionToken || this.isBossDying) return;
              this.spawnPooledVfx('vfx-slash-side', base.bossX - 18, base.bossY - 56, 2.1, i % 2 === 1);
              this.applyBossHitReaction(dmgPerHit, payload, skillMeta.vfxHitAnim || 'vfx-slash-hit', hitCount > 1 ? ` x${i + 1}` : '', base.bossY - 94 - i * 16);
            });
          }
          this.addSafeTimer(hitCount * 110 + 130, () => {
            if (token !== this._actionToken) return;
            this.fsmState = STATES.RETURN;
            this.tweens.add({
              targets: this.hero,
              x: base.heroX,
              y: base.heroY,
              duration: 150,
              ease: 'Quad.Out',
              onUpdate: () => { if (this.heroShadow) this.heroShadow.setPosition(this.hero.x, base.heroY + 2); },
              onComplete: () => {
                if (token !== this._actionToken) return;
                this.fsmState = STATES.IDLE;
                this.setBattleState({ heroMode: 'idle', bossMode: this.isBossDying ? this.battleState.bossMode : 'idle' });
              }
            });
          });
        }
      });
    }

    // Profile 3 & 9 (Ranged): PROJECTILE / Ranged MULTI_HIT (Hero strictly holds base position!)
    playProjectileSequence(token, skillMeta, payload, volleyCount = 1) {
      const base = this.getBaseCoords();
      this._lastHeroMovedX = 0;
      this.fsmState = STATES.ATTACK;
      this.playHeroAnimSafe(skillMeta.heroAnim || 'attack');

      const totalDmg = Number(payload.damage || skillMeta?.previewDmg || 15);
      const dmgPerBolt = Math.max(1, Math.round(totalDmg / volleyCount));
      const projAnim = skillMeta.vfxAnim || (this.battleState.unitCode === 'archer' ? 'vfx-proj-steel' : 'vfx-proj-arcane');
      const projTex = this.resolveVfxTexture(projAnim) || 'vfx-slash';
      const hitAnim = skillMeta.vfxHitAnim || 'vfx-impact-arcane';

      for (let i = 0; i < volleyCount; i++) {
        this.addSafeTimer(95 + i * 105, () => {
          if (token !== this._actionToken || this.isBossDying) return;
          const startX = base.heroX + 52;
          const startY = base.heroY - 62 + ((i - (volleyCount - 1) / 2) * 14);
          const endX = base.bossX - 18;
          const endY = base.bossY - 56 + ((i - (volleyCount - 1) / 2) * 10);

          const proj = this.add.sprite(startX, startY, this.textures.exists(projTex) ? projTex : 'vfx-slash')
            .setScale(1.65)
            .setDepth(16);
          if (this.anims.exists(projAnim)) proj.play(projAnim);
          this.trackTempObject(proj);

          const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
          this.tweens.add({
            targets: proj,
            x: endX,
            y: endY,
            duration: reduced ? 60 : 210,
            ease: 'Linear',
            onComplete: () => {
              this.destroyTempObject(proj);
              if (token !== this._actionToken || this.isBossDying) return;
              this.fsmState = STATES.IMPACT;
              this.applyBossHitReaction(dmgPerBolt, payload, hitAnim, volleyCount > 1 ? ` #${i + 1}` : '', base.bossY - 92 - i * 16);
            }
          });
        });
      }

      this.finishSkillToIdle(token, 95 + (volleyCount - 1) * 105 + 310);
    }

    // Profile 4: CHANNEL_BEAM (Magic Circle + Beam across Arena + Multi Ticks)
    playChannelBeamSequence(token, skillMeta, payload) {
      const base = this.getBaseCoords();
      this._lastHeroMovedX = 0;
      this.fsmState = STATES.ATTACK;
      this.playHeroAnimSafe(skillMeta.heroAnim || 'attack3');

      this.spawnPooledVfx('vfx-pvfx-magic-circle', base.heroX + 46, base.heroY - 60, 1.35, false);

      const isDivineVertical = String(skillMeta.vfxAnim || '').includes('divine-beam');
      const beamAnim = skillMeta.vfxAnim || 'vfx-pvfx-arcane-beam';
      const beamTex = this.resolveVfxTexture(beamAnim);

      this.addSafeTimer(140, () => {
        if (token !== this._actionToken || this.isBossDying) return;
        let beamObj = null;
        if (beamTex && this.textures.exists(beamTex)) {
          if (isDivineVertical) {
            beamObj = this.add.sprite(base.bossX, base.bossY - 68, beamTex).setScale(2.8, 2.3).setDepth(16);
          } else {
            const midX = (base.heroX + 54 + base.bossX - 18) / 2;
            const span = Math.max(180, (base.bossX - base.heroX) - 60);
            beamObj = this.add.sprite(midX, base.heroY - 64, beamTex).setDisplaySize(span, 74).setDepth(16);
          }
          if (this.anims.exists(beamAnim)) beamObj.play(beamAnim);
          this.trackTempObject(beamObj);
        }

        const totalDmg = Number(payload.damage || skillMeta?.previewDmg || 30);
        const ticks = Math.max(2, Number(skillMeta?.hitCount || 3));
        const perTick = Math.max(1, Math.round(totalDmg / ticks));

        for (let t = 0; t < ticks; t++) {
          this.addSafeTimer(t * 135, () => {
            if (token !== this._actionToken || this.isBossDying) return;
            this.fsmState = STATES.IMPACT;
            this.applyBossHitReaction(perTick, payload, skillMeta.vfxHitAnim || 'vfx-impact-arcane', ` x${t + 1}`, base.bossY - 96 - t * 14);
          });
        }

        this.addSafeTimer(ticks * 135 + 140, () => {
          this.destroyTempObject(beamObj);
        });
      });

      this.finishSkillToIdle(token, 140 + 460 + 180);
    }

    // Profile 5: GROUND_CAST (Rune Trap / Ring beneath Boss -> Eruption)
    playGroundCastSequence(token, skillMeta, payload) {
      const base = this.getBaseCoords();
      this._lastHeroMovedX = 0;
      this.fsmState = STATES.ATTACK;
      this.playHeroAnimSafe(skillMeta.heroAnim || 'guard');

      // Summon ground rune underneath Boss
      this.spawnPooledVfx(skillMeta.vfxAnim || 'vfx-pvfx-rune-trap', base.bossX, base.bossY - 8, Number(skillMeta.vfxScale || 2.3), false, { depth: 4 });
      if (skillMeta.vfxExtraAnim) {
        this.spawnPooledVfx(skillMeta.vfxExtraAnim, base.bossX, base.bossY - 12, 2.2, false, { depth: 4 });
      }

      this.addSafeTimer(190, () => {
        if (token !== this._actionToken || this.isBossDying) return;
        this.fsmState = STATES.IMPACT;
        const totalDmg = Number(payload.damage || skillMeta?.previewDmg || 18);
        this.applyBossHitReaction(totalDmg, payload, skillMeta.vfxHitAnim || 'vfx-spell-ice-shatter', '', base.bossY - 96);
      });

      this.finishSkillToIdle(token, 520);
    }

    // Profile 6: SKY_STRIKE (Telegraph Aura -> Sky Strike Descending onto Boss)
    playSkyStrikeSequence(token, skillMeta, payload) {
      const base = this.getBaseCoords();
      this._lastHeroMovedX = 0;
      this.fsmState = STATES.ATTACK;
      this.playHeroAnimSafe(skillMeta.heroAnim || 'attack2');

      this.spawnPooledVfx('vfx-ring-arcane-anim', base.bossX, base.bossY - 12, 2.1, false, { depth: 4 });
      const strikeAnim = skillMeta.vfxAnim || 'vfx-spell-lightning-strike';
      const strikeTex = this.resolveVfxTexture(strikeAnim);

      this.addSafeTimer(120, () => {
        if (token !== this._actionToken || this.isBossDying) return;
        if (strikeTex && this.textures.exists(strikeTex)) {
          const sky = this.add.sprite(base.bossX, base.bossY - 175, strikeTex).setScale(2.6).setDepth(17);
          if (this.anims.exists(strikeAnim)) sky.play(strikeAnim);
          this.trackTempObject(sky);
          this.tweens.add({
            targets: sky,
            y: base.bossY - 54,
            duration: 185,
            ease: 'Quad.In',
            onComplete: () => {
              this.addSafeTimer(180, () => this.destroyTempObject(sky));
              if (token !== this._actionToken || this.isBossDying) return;
              this.fsmState = STATES.IMPACT;
              const totalDmg = Number(payload.damage || skillMeta?.previewDmg || 22);
              this.applyBossHitReaction(totalDmg, payload, skillMeta.vfxHitAnim || 'vfx-thunder-burst-anim', '', base.bossY - 102);
            }
          });
        } else {
          this.fsmState = STATES.IMPACT;
          this.applyBossHitReaction(Number(payload.damage || skillMeta?.previewDmg || 22), payload, 'vfx-thunder-burst-anim');
        }
      });

      this.finishSkillToIdle(token, 640);
    }

    // Profile 7 & 8: SHIELD_CAST & SELF_HEAL (Self Support around Hero)
    playSupportSkillSequence(token, skillMeta, payload = {}, profile = 'SHIELD_CAST') {
      const base = this.getBaseCoords();
      this._lastHeroMovedX = 0;
      const heroCfg = this.getHeroConfig(this.battleState.unitCode);
      const guardMode = skillMeta.heroAnim || 'guard';
      const guardMeta = heroCfg[guardMode] || heroCfg.guard || { frames: 6, rate: 8, hitFrame: 2 };
      const animRate = Math.max(1, Number(guardMeta.rate || 8));
      const totalFrames = Math.max(1, Number(guardMeta.frames || 6));
      const animMs = Math.max(460, Math.round((totalFrames / animRate) * 1000));
      const hitMs = Math.max(90, Math.round((Number(guardMeta.hitFrame ?? 2) / animRate) * 1000));

      this.fsmState = STATES.GUARD;
      this.clearHeroAnimListeners();
      let secondaryFired = false;

      const fireSecondary = () => {
        if (secondaryFired || token !== this._actionToken) return;
        secondaryFired = true;
        if (skillMeta.vfxHitAnim) {
          this.spawnPooledVfx(skillMeta.vfxHitAnim, base.heroX, base.heroY - 42, 2.2, false);
        }
        const floatMsg = skillMeta.healHp
          ? `+${skillMeta.healHp} HP`
          : (skillMeta.mitigationPct ? `GUARD -${skillMeta.mitigationPct}%` : '');
        if (floatMsg) {
          this.spawnFloatingText(floatMsg, base.heroX, base.heroY - 96, skillMeta.healHp ? '#4ade80' : '#93c5fd', true);
        }
      };

      const resolvedKey = this.playHeroAnimSafe(guardMode);
      this.onHeroAnimEvent('animationupdate', (anim, frame) => {
        if (token !== this._actionToken || !anim || anim.key !== resolvedKey) return;
        const zeroIdx = Math.max(0, Number(frame && frame.index ? frame.index - 1 : 0));
        if (zeroIdx >= Number(guardMeta.hitFrame ?? 2)) fireSecondary();
      });

      const primaryVfx = skillMeta.vfxAnim || (profile === 'SELF_HEAL' ? 'vfx-pvfx-holy-heal' : 'vfx-pvfx-shield-bubble');
      this.spawnPooledVfx(primaryVfx, base.heroX, base.heroY - 50, Number(skillMeta.vfxScale || 2.3), false);
      this.addSafeTimer(hitMs, fireSecondary);
      this.addSafeTimer(animMs, () => {
        if (token !== this._actionToken) return;
        this.clearHeroAnimListeners();
        this.fsmState = STATES.IDLE;
        this.setBattleState({ heroMode: 'idle' });
      });
    }

    // Profile 10: ULTIMATE (Dramatic Vignette + Summon Magic Circle + SubProfile Burst)
    playUltimateSequence(token, skillMeta, payload) {
      const cfg = window.RaidPhaserConfig;
      const base = this.getBaseCoords();
      this._lastHeroMovedX = 0;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      this.fsmState = STATES.ATTACK;
      this.playHeroAnimSafe(skillMeta.heroAnim || 'attack2');

      if (!reduced) {
        const dim = this.add.rectangle(cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.canvasWidth, cfg.canvasHeight, 0x0c0705, 0.42).setDepth(3);
        this.trackTempObject(dim);
        this.tweens.add({ targets: dim, alpha: 0, duration: 720, onComplete: () => this.destroyTempObject(dim) });
      }

      this.spawnPooledVfx(skillMeta.vfxExtraAnim || 'vfx-pvfx-magic-circle', base.bossX, base.bossY - 46, 2.7, false);

      this.addSafeTimer(170, () => {
        if (token !== this._actionToken || this.isBossDying) return;
        const sub = skillMeta.subProfile || 'SKY_STRIKE';
        if (sub === 'PROJECTILE') {
          this.playProjectileSequence(token, skillMeta, payload, 1);
        } else if (sub === 'CHANNEL_BEAM') {
          this.playChannelBeamSequence(token, skillMeta, payload);
        } else {
          this.playSkyStrikeSequence(token, skillMeta, payload);
        }
      });
    }

    playBossTurnSequence() {
      if (!this.boss || this.isBossDying) return;
      if (this.isInLockedCombatState() || this.fsmState === STATES.GUARD) this.settleActiveActionImmediately();

      this._actionToken += 1;
      const token = this._actionToken;
      const base = this.getBaseCoords();
      const cfg = window.RaidPhaserConfig;
      const bossCfg = cfg.bosses[this.battleState.bossTheme] || cfg.bosses.crabby;
      const bossAtkMeta = bossCfg.attack || { frames: 4, rate: 10 };
      const atkFrameCount = Array.isArray(bossAtkMeta.frames) ? bossAtkMeta.frames.length : Number(bossAtkMeta.frames || 4);
      const bossAtkMs = Math.max(360, Math.round((atkFrameCount / Math.max(1, Number(bossAtkMeta.rate || 10))) * 1000));

      this.fsmState = STATES.HURT;
      this.setBattleState({ bossMode: 'attack' });

      this.tweens.killTweensOf(this.boss);
      this.tweens.add({
        targets: this.boss,
        x: base.bossX - 42,
        y: base.bossY,
        duration: 160,
        yoyo: true,
        ease: 'Quad.Out',
        onUpdate: () => { if (this.bossShadow) this.bossShadow.setPosition(this.boss.x, base.bossY + 2); },
        onComplete: () => {
          if (token !== this._actionToken || this.isBossDying) return;
          this.boss.setPosition(base.bossX, base.bossY);
          if (this.bossShadow) this.bossShadow.setPosition(base.bossX, base.bossY + 2);
          this.cameras.main.shake(110, 0.003);
          this.spawnPooledVfx('vfx-ring-ember-anim', base.heroX + 18, base.heroY - 48, 2.2, true);
          if (this.hero) {
            this.hero.setTint(0xff9999);
            this.tweens.add({
              targets: this.hero,
              x: base.heroX - 8,
              duration: 75,
              yoyo: true,
              onComplete: () => {
                if (this.hero) {
                  this.hero.clearTint();
                  this.hero.x = base.heroX;
                }
              }
            });
          }
          this.addSafeTimer(90, () => {
            if (token !== this._actionToken || this.isBossDying) return;
            this.setBattleState({ bossMode: 'idle', heroMode: 'guard' });
          });
          this.addSafeTimer(bossAtkMs, () => {
            if (token !== this._actionToken || this.isBossDying) return;
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
      this.trackTempObject(flash);
      this.tweens.add({
        targets: flash,
        alpha: { from: 0.24, to: 0 },
        duration: 120,
        onComplete: () => this.destroyTempObject(flash)
      });
      this.cameras.main.shake(80, 0.0022);
    }

    playBossDeathSequence() {
      if (!this.boss) return;
      this._actionToken += 1;
      this.isBossDying = true;
      this.fsmState = STATES.DEATH;
      this.clearAllTimers();
      this.clearHeroAnimListeners();
      this.cleanupTempObjects();
      this.stopBossTimer();
      if (this.hero) this.tweens.killTweensOf(this.hero);
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
          if (this.hero) {
            this.hero.setPosition(base.heroX, base.heroY);
            this.heroShadow.setPosition(base.heroX, base.heroY + 2);
          }
          this.setBattleState({ heroMode: 'guard' });
        }
      });
    }

    playBossSpawnSequence(payload = {}) {
      this.isBossDying = false;
      this.spawnActors();
      const base = this.getBaseCoords();
      const rarity = String(this.battleState.bossRarity || 'NORMAL').toUpperCase();
      const isMajorBoss = rarity === 'CHAPTER_BOSS' || rarity === 'GUARDIAN' || Boolean(payload?.dramatic);
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (isMajorBoss && !reduced) {
        const cfg = window.RaidPhaserConfig;
        const dim = this.add.rectangle(cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.canvasWidth, cfg.canvasHeight, 0x0c0705, 0.48).setDepth(3);
        this.trackTempObject(dim);
        this.tweens.add({ targets: dim, alpha: 0, duration: 920, ease: 'Quad.Out', onComplete: () => this.destroyTempObject(dim) });
        this.spawnPooledVfx('vfx-ring-arcane-anim', base.bossX, base.bossY - 46, 2.8, false);
        if (rarity === 'CHAPTER_BOSS') {
          this.spawnPooledVfx('vfx-fire-burst-anim', base.bossX, base.bossY - 52, 2.4, false);
        }
      } else {
        this.spawnPooledVfx('vfx-dash-mono-anim', base.bossX, base.bossY - 20, 2.0, true);
      }
      if (this.boss) {
        const finalScale = this.getEffectiveBossScale(this.battleState.bossTheme);
        this.boss.alpha = 0;
        this.boss.scaleY = 0;
        this.boss.visible = true;
        if (this.bossShadow) {
          this.bossShadow.visible = true;
          this.bossShadow.alpha = 0;
          this.tweens.add({ targets: this.bossShadow, alpha: 0.28, duration: reduced ? 120 : 460 });
        }
        this.tweens.add({
          targets: this.boss,
          alpha: 1,
          scaleY: finalScale,
          duration: reduced ? 120 : (isMajorBoss ? 680 : 460),
          ease: 'Back.Out'
        });
      }
    }
  }

  window.RaidBattleScene = BattleScene;
  window.RAID_BATTLE_STATES = STATES;
})();
