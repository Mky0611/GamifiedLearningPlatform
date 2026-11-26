(function () {
  const FRAME_W = 192;
  const FRAME_H = 192;
  let phaserLoader = null;

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function loadPhaserFromCdn() {
    if (window.Phaser) return Promise.resolve(true);
    if (phaserLoader) return phaserLoader;
    phaserLoader = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js';
      script.async = true;
      script.onload = () => resolve(Boolean(window.Phaser));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
    return phaserLoader;
  }

  function isQaEnvironment() {
    if (typeof window === 'undefined' || !window.location) return false;
    const host = String(window.location.hostname || '').toLowerCase();
    const isLoopback = host === '127.0.0.1' || host === 'localhost' || host === '::1';
    if (!isLoopback) return false;
    return new URLSearchParams(window.location.search || '').get('qa') === '1';
  }

  function createCanvasFallback(mount, initialState) {
    const cfgInit = window.RaidPhaserConfig || {};
    const canvas = document.createElement('canvas');
    canvas.width = cfgInit.canvasWidth || 960;
    canvas.height = cfgInit.canvasHeight || 360;
    canvas.className = 'raid-phaser-canvas';
    mount.innerHTML = '';
    mount.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const HERO_SHEETS = window.RaidPhaserConfig?.heroes || {};
    const BOSS_SHEETS = window.RaidPhaserConfig?.bosses || {};
    const state = { heroMode: 'idle', bossMode: 'idle', unitCode: 'warrior', bossTheme: 'crabby', bossRarity: 'NORMAL', biome: 'dusk', ...initialState };
    const cache = new Map();
    let mounted = true;
    let heroFrame = 0;
    let bossFrame = 0;
    let heroClock = 0;
    let bossClock = 0;
    let lastTs = 0;
    let lungeOffset = 0;
    let lungeTimer = 0;
    let lungeTotal = 460;
    let isSupportCast = false;
    let currentProfile = 'MELEE_SLASH';
    let bossTurnTimer = 0;
    let slashFxClock = 0;
    let slashFxActive = false;
    let activeFloatingLabel = '';
    let lastHeroMovedX = 0;

    function heroMeta() {
      const unit = HERO_SHEETS[state.unitCode] || HERO_SHEETS.warrior;
      return unit?.[state.heroMode] || unit?.idle;
    }
    function bossMeta() {
      const theme = BOSS_SHEETS[state.bossTheme] || BOSS_SHEETS.crabby;
      return theme?.[state.bossMode] || theme?.idle;
    }
    async function getImg(key, src) {
      if (!src) return null;
      if (!cache.has(key)) cache.set(key, preloadImage(src).catch(() => null));
      return cache.get(key);
    }

    async function render(ts) {
      if (!mounted) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min(80, ts - lastTs);
      lastTs = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      const cfg = window.RaidPhaserConfig || {};
      const bgUrl = (cfg.biomeStages && cfg.biomeStages[state.biome]) || cfg.backgroundUrl || '/ui/assets/backgrounds/worlds/mountain-dusk/mountain-dusk-a.png';
      const bg = await getImg(`bg:${state.biome}`, bgUrl);
      if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      else { ctx.fillStyle = '#1f1712'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

      const heroCfg = (cfg.heroes && cfg.heroes[state.unitCode]) || (cfg.heroes && cfg.heroes.warrior) || {};
      const bossCfg = (cfg.bosses && cfg.bosses[state.bossTheme]) || (cfg.bosses && cfg.bosses.crabby) || {};
      const groundY = cfg.groundY || 302;
      const rarityMul = Number((cfg.rarityScales && cfg.rarityScales[String(state.bossRarity || 'NORMAL').toUpperCase()]) || 1.0);

      if (lungeTimer > 0) {
        lungeTimer = Math.max(0, lungeTimer - dt);
        const phase = 1 - (lungeTimer / Math.max(1, lungeTotal));
        const staysAtRange = isSupportCast || ['PROJECTILE', 'CHANNEL_BEAM', 'GROUND_CAST', 'SKY_STRIKE', 'SHIELD_CAST', 'SELF_HEAL', 'ULTIMATE'].includes(currentProfile) || state.unitCode === 'archer' || state.unitCode === 'arcane_mage';
        lungeOffset = staysAtRange ? 0 : Math.round(Math.sin(phase * Math.PI) * 120);
        lastHeroMovedX = Math.max(lastHeroMovedX, Math.abs(lungeOffset));
        if (lungeTimer === 0) {
          state.heroMode = 'idle';
          state.bossMode = 'idle';
          isSupportCast = false;
          activeFloatingLabel = '';
        }
      } else {
        lungeOffset = 0;
      }

      let bossOffset = 0;
      if (bossTurnTimer > 0) {
        bossTurnTimer = Math.max(0, bossTurnTimer - dt);
        const bPhase = 1 - (bossTurnTimer / 420);
        bossOffset = -Math.round(Math.sin(bPhase * Math.PI) * 36);
        if (bossTurnTimer === 0) {
          state.bossMode = 'idle';
          state.heroMode = 'idle';
        }
      }

      const heroX = (cfg.heroX || 300) + Number(heroCfg.battleOffsetX || 0) + lungeOffset;
      const bossX = (cfg.bossX || 660) + bossOffset;

      ctx.beginPath();
      ctx.ellipse(heroX, groundY + 2, 48 * Number(heroCfg.shadowScale || 1.3), 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(bossX, groundY + 2, 54 * Math.max(0.8, (Number(bossCfg.scale || 3.4) * rarityMul) / 3.4), 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fill();

      const hm = heroMeta();
      if (hm && hm.url) {
        const img = await getImg(`hero:${state.unitCode}:${state.heroMode}`, hm.url);
        if (img) {
          heroClock += dt;
          if (heroClock >= 1000 / (hm.rate || 8)) {
            heroClock = 0;
            heroFrame = (heroFrame + 1) % hm.frames;
          }
          const fw = Number(heroCfg.frameWidth || FRAME_W);
          const fh = Number(heroCfg.frameHeight || FRAME_H);
          const scale = Number(heroCfg.scale || 1.56);
          const originX = Number(heroCfg.originX || 0.5);
          const originY = Number(heroCfg.originY || 0.7135);
          const destW = fw * scale;
          const destH = fh * scale;
          ctx.drawImage(img, heroFrame * fw, 0, fw, fh, heroX - (originX * destW), groundY - (originY * destH), destW, destH);
        }
      }

      const bm = bossMeta();
      const flipBoss = bossCfg.nativeFacingLeft ? false : true;
      if (bm && bm.sheetUrl) {
        const img = await getImg(`boss:${state.bossTheme}:${state.bossMode}:sheet`, bm.sheetUrl);
        if (img) {
          bossClock += dt;
          if (bossClock >= 1000 / (bm.rate || 8)) {
            bossClock = 0;
            bossFrame = (bossFrame + 1) % (bm.frames || 4);
          }
          const fw = bm.fw || 32;
          const fh = bm.fh || 32;
          const scale = Number(bossCfg.scale || 3.5) * rarityMul;
          const destW = fw * scale;
          const destH = fh * scale;
          const destY = groundY - (Number(bossCfg.originY || 0.96) * destH);
          ctx.save();
          ctx.translate(bossX, 0);
          if (flipBoss) ctx.scale(-1, 1);
          ctx.drawImage(img, bossFrame * fw, 0, fw, fh, -(Number(bossCfg.originX || 0.5) * destW), destY, destW, destH);
          ctx.restore();
        }
      } else if (bm && Array.isArray(bm.frames)) {
        bossClock += dt;
        if (bossClock >= 1000 / (bm.rate || 8)) {
          bossClock = 0;
          bossFrame = (bossFrame + 1) % bm.frames.length;
        }
        const fUrl = bm.frames[bossFrame];
        const img = await getImg(`bossframe:${fUrl}`, fUrl);
        if (img) {
          const scale = Number(bossCfg.scale || 3.4) * rarityMul;
          const destW = img.width * scale;
          const destH = img.height * scale;
          const destY = groundY - (Number(bossCfg.originY || 0.9) * destH);
          ctx.save();
          ctx.translate(bossX, 0);
          if (flipBoss) ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, img.width, img.height, -(Number(bossCfg.originX || 0.5) * destW), destY, destW, destH);
          ctx.restore();
        }
      }

      if (slashFxActive) {
        slashFxClock += dt;
        const pPhase = Math.min(1, slashFxClock / Math.max(220, lungeTotal * 0.85));
        if (currentProfile === 'PROJECTILE' || (currentProfile === 'MULTI_HIT' && (state.unitCode === 'archer' || state.unitCode === 'arcane_mage'))) {
          const px = heroX + 48 + Math.round((bossX - heroX - 64) * pPhase);
          const py = groundY - 62;
          ctx.save();
          ctx.fillStyle = state.unitCode === 'arcane_mage' ? '#a855f7' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (currentProfile === 'CHANNEL_BEAM') {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(heroX + 44, groundY - 62);
          ctx.lineTo(bossX - 16, groundY - 58);
          ctx.stroke();
          ctx.restore();
        } else if (currentProfile === 'GROUND_CAST') {
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(bossX, groundY - 6, 48 * pPhase + 14, 14, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (currentProfile === 'SKY_STRIKE' || currentProfile === 'ULTIMATE') {
          ctx.save();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(bossX, 30);
          ctx.lineTo(bossX, 30 + (groundY - 70) * pPhase);
          ctx.stroke();
          ctx.restore();
        } else {
          const fIdx = Math.floor(slashFxClock / 45);
          if (fIdx < 7) {
            const slashImg = await getImg('fx-slash-clean', '/ui/assets/effects/vfx/fx-slash-clean.png');
            if (slashImg) {
              const fxX = isSupportCast ? heroX - 80 : bossX - 96;
              ctx.drawImage(slashImg, fIdx * 80, 0, 80, 64, fxX, groundY - 128, 160, 128);
            }
          }
        }
        if (activeFloatingLabel) {
          ctx.save();
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = isSupportCast ? '#4ade80' : '#fde047';
          ctx.fillText(activeFloatingLabel, isSupportCast ? heroX : bossX, groundY - 110 - Math.round(pPhase * 22));
          ctx.restore();
        }
        if (lungeTimer === 0 && slashFxClock >= 340) {
          slashFxActive = false;
        }
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    if (isQaEnvironment()) {
      window.__LEX_RAID_SCENE_STATE__ = () => {
        const cfg = window.RaidPhaserConfig || {};
        const heroCfg = (cfg.heroes && cfg.heroes[state.unitCode]) || (cfg.heroes && cfg.heroes.warrior) || {};
        const groundY = cfg.groundY || 302;
        return {
          fsmState: lungeTimer > 0 ? (isSupportCast ? 'GUARD' : 'ATTACK') : (bossTurnTimer > 0 ? 'HURT' : 'IDLE'),
          unitCode: state.unitCode,
          bossTheme: state.bossTheme,
          bossRarity: state.bossRarity || 'NORMAL',
          heroMode: state.heroMode,
          bossMode: state.bossMode,
          isBossDying: false,
          groundY,
          heroX: Math.round((cfg.heroX || 300) + Number(heroCfg.battleOffsetX || 0) + lungeOffset),
          heroY: Number(heroCfg.battleY || groundY),
          bossX: Math.round(cfg.bossX || 660),
          bossY: groundY,
          activeVfxCount: slashFxActive ? 1 : 0,
          activeTempObjects: 0,
          poolSize: 1,
          pendingTimers: 0,
          lastProfile: currentProfile,
          lastHeroMovedX
        };
      };
    }

    return {
      renderer: 'canvas-fallback',
      errorText: 'Đang dùng Canvas 2D fallback (không có WebGL/Phaser).',
      isBusy() {
        return lungeTimer > 0 || bossTurnTimer > 0 || slashFxActive;
      },
      setState(next) {
        Object.assign(state, next || {});
        if (next && (next.playAttack || next.playSkill)) {
          const sm = next.skillMeta || {};
          currentProfile = window.RaidRegistry?.resolveAnimationProfile?.(sm, state.unitCode)
            || (sm.selfTarget ? (sm.healHp ? 'SELF_HEAL' : 'SHIELD_CAST') : (sm.animationProfile || ((state.unitCode === 'archer' || state.unitCode === 'arcane_mage') ? 'PROJECTILE' : 'MELEE_SLASH')));
          isSupportCast = Boolean(sm.selfTarget || currentProfile === 'SHIELD_CAST' || currentProfile === 'SELF_HEAL');
          lastHeroMovedX = 0;
          state.heroMode = sm.heroAnim || 'attack2';
          const unit = HERO_SHEETS[state.unitCode] || HERO_SHEETS.warrior;
          const hm = unit?.[state.heroMode] || unit?.idle;
          lungeTotal = hm ? Math.max(420, Math.round((hm.frames / Math.max(1, hm.rate || 10)) * 1000) + 140) : 480;
          lungeTimer = lungeTotal;
          heroFrame = 0;
          heroClock = 0;
          slashFxActive = true;
          slashFxClock = 0;
          const dmgVal = Number(next.damage || sm.previewDmg || 0);
          activeFloatingLabel = sm.healHp ? `+${sm.healHp} HP` : (sm.mitigationPct ? `GUARD -${sm.mitigationPct}%` : (dmgVal > 0 ? `-${dmgVal}` : ''));
        }
        if (next && next.playBossTurn) {
          bossTurnTimer = 420;
          state.bossMode = 'attack';
          state.heroMode = 'guard';
          bossFrame = 0;
        }
        if (next && next.resetActors) {
          lungeTimer = 0;
          lungeOffset = 0;
          bossTurnTimer = 0;
          isSupportCast = false;
          slashFxActive = false;
          activeFloatingLabel = '';
          state.heroMode = 'idle';
          state.bossMode = 'idle';
        }
      },
      destroy() {
        mounted = false;
        mount.innerHTML = '';
        if (typeof window !== 'undefined' && window.__LEX_RAID_SCENE_STATE__) {
          delete window.__LEX_RAID_SCENE_STATE__;
        }
      }
    };
  }

  window.RaidPhaserBridge = {
    async mount(target, initialState) {
      const mount = typeof target === 'string' ? document.querySelector(target) : target;
      if (!mount) return null;
      const forceCanvas = new URLSearchParams(location.search).get('renderer') === 'canvas';
      if (!forceCanvas && !window.Phaser) { await loadPhaserFromCdn(); }
      if (!forceCanvas && window.Phaser && window.RaidPhaserStarter && typeof window.RaidPhaserStarter.mount === 'function') {
        mount.dataset.renderer = 'phaser';
        return window.RaidPhaserStarter.mount(mount, initialState || {});
      }
      mount.dataset.renderer = 'canvas-fallback';
      return createCanvasFallback(mount, initialState || {});
    }
  };
})();
