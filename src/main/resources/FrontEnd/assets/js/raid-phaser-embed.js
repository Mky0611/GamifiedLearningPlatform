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

  function createCanvasFallback(mount, initialState) {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 420;
    canvas.className = 'raid-phaser-canvas';
    mount.innerHTML = '';
    mount.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const HERO_SHEETS = window.RaidPhaserConfig?.heroes || {};
    const BOSS_SHEETS = window.RaidPhaserConfig?.bosses || {};
    const state = { heroMode: 'idle', bossMode: 'idle', unitCode: 'warrior', bossTheme: 'crabby', biome: 'dusk', ...initialState };
    const cache = new Map();
    let mounted = true;
    let heroFrame = 0;
    let bossFrame = 0;
    let heroClock = 0;
    let bossClock = 0;
    let lastTs = 0;
    let lungeOffset = 0;
    let lungeTimer = 0;
    let slashFxClock = 0;
    let slashFxActive = false;

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
      const groundY = cfg.groundY || 350;

      if (lungeTimer > 0) {
        lungeTimer = Math.max(0, lungeTimer - dt);
        const phase = 1 - (lungeTimer / 460);
        lungeOffset = Math.round(Math.sin(phase * Math.PI) * (state.unitCode === 'archer' ? 40 : 120));
        if (lungeTimer === 0) state.heroMode = 'idle';
      } else {
        lungeOffset = 0;
      }

      const heroX = (cfg.heroX || 330) + Number(heroCfg.battleOffsetX || 0) + lungeOffset;
      const bossX = cfg.bossX || 630;

      ctx.beginPath();
      ctx.ellipse(heroX, groundY + 2, 48 * Number(heroCfg.shadowScale || 1.1), 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(bossX, groundY + 2, 54 * Math.max(0.7, Number(bossCfg.scale || 3.0) / 3.5), 9, 0, 0, Math.PI * 2);
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
          const scale = Number(heroCfg.scale || 1.35);
          const originX = Number(heroCfg.originX || 0.5);
          const originY = Number(heroCfg.originY || 0.7135);
          const destW = FRAME_W * scale;
          const destH = FRAME_H * scale;
          ctx.drawImage(img, heroFrame * FRAME_W, 0, FRAME_W, FRAME_H, heroX - (originX * destW), groundY - (originY * destH), destW, destH);
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
          const scale = Number(bossCfg.scale || 3.4);
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
          const scale = Number(bossCfg.scale || 3.0);
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
        const fIdx = Math.floor(slashFxClock / 45);
        if (fIdx >= 8) {
          slashFxActive = false;
        } else {
          const slashImg = await getImg('fx-slash-clean', '/ui/assets/effects/vfx/fx-slash-clean.png');
          if (slashImg) {
            ctx.drawImage(slashImg, fIdx * 80, 0, 80, 64, bossX - 96, groundY - 128, 160, 128);
          }
        }
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    return {
      renderer: 'canvas-fallback',
      errorText: 'Đang dùng Canvas 2D fallback (không có WebGL/Phaser).',
      setState(next) {
        Object.assign(state, next || {});
        if (next && (next.playAttack || next.playSkill)) {
          state.heroMode = (next.skillMeta && next.skillMeta.heroAnim) || 'attack2';
          lungeTimer = 460;
          slashFxActive = true;
          slashFxClock = 0;
        }
        if (next && next.resetActors) {
          lungeTimer = 0;
          lungeOffset = 0;
          slashFxActive = false;
          state.heroMode = 'idle';
          state.bossMode = 'idle';
        }
      },
      destroy() {
        mounted = false;
        mount.innerHTML = '';
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
