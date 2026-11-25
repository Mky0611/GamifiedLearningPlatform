(function(){
  const FRAME_W = 192;
  const FRAME_H = 192;
  const HERO_SHEETS = (window.RaidPhaserConfig && window.RaidPhaserConfig.heroes) || {};
  const BOSS_SHEETS = (window.RaidPhaserConfig && window.RaidPhaserConfig.bosses) || {};
  let phaserLoader = null;

  function preloadImage(src){ return new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=src; }); }
  function loadPhaserFromCdn(){
    if(window.Phaser) return Promise.resolve(true);
    if(phaserLoader) return phaserLoader;
    phaserLoader = new Promise((resolve)=>{
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js';
      script.async = true;
      script.onload = ()=>resolve(Boolean(window.Phaser));
      script.onerror = ()=>resolve(false);
      document.head.appendChild(script);
    });
    return phaserLoader;
  }

  function createCanvasFallback(mount, initialState){
    const canvas = document.createElement('canvas');
    canvas.width = 960; canvas.height = 420; canvas.className = 'raid-phaser-canvas';
    mount.innerHTML = ''; mount.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const state = { heroMode:'idle', bossMode:'idle', unitCode:'warrior', bossTheme:'crabby', ...initialState };
    const cache = new Map(); let mounted = true; let heroFrame=0; let bossFrame=0; let heroClock=0; let bossClock=0; let lastTs=0;
    function heroMeta(){ const unit = HERO_SHEETS[state.unitCode] || HERO_SHEETS.warrior; return unit?.[state.heroMode] || unit?.idle; }
    function bossMeta(){ const theme = BOSS_SHEETS[state.bossTheme] || BOSS_SHEETS.crabby; return theme?.[state.bossMode] || theme?.idle; }
    async function getImg(key, src){ if(!cache.has(key)) cache.set(key, preloadImage(src).catch(()=>null)); return cache.get(key); }
    async function render(ts){
      if(!mounted) return; if(!lastTs) lastTs = ts; const dt = ts - lastTs; lastTs = ts;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const bg = await getImg('bg','/ui/assets/imgs/map2.gif');
      if(bg) ctx.drawImage(bg,0,0,canvas.width,canvas.height); else { ctx.fillStyle='#1f1712'; ctx.fillRect(0,0,canvas.width,canvas.height); }

      const cfg = window.RaidPhaserConfig || {};
      const heroCfg = (cfg.heroes && cfg.heroes[state.unitCode]) || (cfg.heroes && cfg.heroes.warrior) || {};
      const bossCfg = (cfg.bosses && cfg.bosses[state.bossTheme]) || (cfg.bosses && cfg.bosses.crabby) || {};
      const groundY = cfg.groundY || 350;
      const heroX = (cfg.heroX || 406) + Number(heroCfg.battleOffsetX || 0);
      const bossX = cfg.bossX || 554;

      // Ground plane shadows under feet
      ctx.beginPath();
      ctx.ellipse(heroX, groundY + 2, 48 * Number(heroCfg.shadowScale || 0.82), 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(bossX, groundY + 2, 54 * Math.max(0.66, Number(bossCfg.scale || 2.5) / 3.8), 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.fill();

      // Hero sprite grounded at groundY
      const hm = heroMeta();
      if (hm && hm.url) {
        const img = await getImg(`hero:${state.unitCode}:${state.heroMode}`, hm.url);
        if (img) {
          heroClock += dt;
          if (heroClock >= 1000 / (hm.rate || 8)) {
            heroClock = 0;
            heroFrame = (heroFrame + 1) % hm.frames;
          }
          const scale = Number(heroCfg.scale || 0.9);
          const originX = Number(heroCfg.originX || 0.5);
          const originY = Number(heroCfg.originY || 0.7135);
          const destW = FRAME_W * scale;
          const destH = FRAME_H * scale;
          const destX = heroX - (originX * destW);
          const destY = groundY - (originY * destH);
          ctx.drawImage(img, heroFrame * FRAME_W, 0, FRAME_W, FRAME_H, destX, destY, destW, destH);
        }
      }

      // Boss sprite grounded at groundY and flipped to face hero
      const bm = bossMeta();
      if (bm && Array.isArray(bm.frames)) {
        bossClock += dt;
        if (bossClock >= 1000 / (bm.rate || 8)) {
          bossClock = 0;
          bossFrame = (bossFrame + 1) % bm.frames.length;
        }
        const img = await getImg(`bossframe:${bm.frames[bossFrame]}`, bm.frames[bossFrame]);
        if (img) {
          const scale = Number(bossCfg.scale || 2.5);
          const originX = Number(bossCfg.originX || 0.5);
          const originY = Number(bossCfg.originY || 0.9);
          const destW = img.width * scale;
          const destH = img.height * scale;
          const destY = groundY - (originY * destH);
          ctx.save();
          ctx.translate(bossX, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, img.width, img.height, -(originX * destW), destY, destW, destH);
          ctx.restore();
        }
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    return { renderer:'canvas-fallback', errorText:'Không tải được Phaser runtime. Đang dùng canvas fallback.', setState(next){ Object.assign(state, next || {}); }, destroy(){ mounted=false; mount.innerHTML=''; } };
  }

  window.RaidPhaserBridge = {
    async mount(target, initialState){
      const mount = typeof target === 'string' ? document.querySelector(target) : target;
      if(!mount) return null;
      const forceCanvas = new URLSearchParams(location.search).get('renderer') === 'canvas';
      if(!forceCanvas && !window.Phaser){ await loadPhaserFromCdn(); }
      if(!forceCanvas && window.Phaser && window.RaidPhaserStarter && typeof window.RaidPhaserStarter.mount === 'function'){
        mount.dataset.renderer = 'phaser';
        return window.RaidPhaserStarter.mount(mount, initialState || {});
      }
      mount.dataset.renderer = 'canvas-fallback';
      return createCanvasFallback(mount, initialState || {});
    }
  };
})();
