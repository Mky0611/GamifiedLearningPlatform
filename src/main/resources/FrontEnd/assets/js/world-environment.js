/**
 * Shared Animated World Environment System (Phase P4-B.2)
 * Renders lightweight pixel-art layered parallax, flickering torches/campfires,
 * clouds, and optional waterfall across pages while respecting tab visibility
 * and prefers-reduced-motion.
 */
(function () {
  const BIOMES = {
    village: {
      label: 'Kingdom Village',
      sky: ['#4d344f', '#895b69'],
      layers: [
        { src: '/ui/assets/backgrounds/worlds/gothicvania-town/background.png', speed: 4, align: 'bottom', scaleMode: 'coverY' },
        { src: '/ui/assets/backgrounds/worlds/gothicvania-town/middleground.png', speed: 10, align: 'bottom', scaleMode: 'coverY' }
      ],
      fx: { src: '/ui/assets/effects/vfx/torch_flame_32x32.png', fw: 32, fh: 32, frames: 8, fps: 10, xPct: 0.08, yPct: 0.78, scale: 2 },
      motes: '#ffd670',
      credit: ''
    },
    forest: {
      label: 'Ancient Lexicon Grove',
      sky: ['#243b24', '#4d7337'],
      layers: [
        { src: '/ui/assets/backgrounds/worlds/tall-forest/back.png', speed: 3, align: 'bottom', scaleMode: 'coverY' },
        { src: '/ui/assets/backgrounds/worlds/tall-forest/far.png', speed: 7, align: 'bottom', scaleMode: 'coverY' },
        { src: '/ui/assets/backgrounds/worlds/tall-forest/middle.png', speed: 12, align: 'bottom', scaleMode: 'coverY' }
      ],
      motes: '#d8f58d',
      credit: ''
    },
    'mountain-dusk': {
      label: 'Super Mountain Dusk',
      sky: ['#261d3a', '#8c4c63'],
      layers: [
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/sky.png', speed: 0, align: 'top', scaleMode: 'cover' },
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/far-clouds.png', speed: 6, align: 'top', scaleMode: 'coverWidth' },
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/far-mountains.png', speed: 3, align: 'bottom', scaleMode: 'coverY' },
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/mountains.png', speed: 6, align: 'bottom', scaleMode: 'coverY' },
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/near-clouds.png', speed: 11, align: 'top', scaleMode: 'coverWidth' },
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/trees.png', speed: 14, align: 'bottom', scaleMode: 'coverY' }
      ],
      motes: '#ffcf87',
      credit: ''
    },
    waterfall: {
      label: 'Sapphire Falls Sanctuary',
      sky: ['#142438', '#204568'],
      layers: [
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/sky.png', speed: 0, align: 'top', scaleMode: 'cover' },
        { src: '/ui/assets/backgrounds/worlds/tall-forest/far.png', speed: 4, align: 'bottom', scaleMode: 'coverY' }
      ],
      waterfall: {
        src: '/ui/assets/backgrounds/worlds/waterfall/waterfall_spritesheet.png',
        fw: 404,
        fh: 640,
        frames: 5,
        fps: 4.76
      },
      motes: '#9de5ff',
      credit: 'Waterfall pixel art by Burcu Sak'
    },
    academy: {
      label: 'Royal Academy Archive',
      sky: ['#231d36', '#4a3554'],
      layers: [
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/sky.png', speed: 0, align: 'top', scaleMode: 'cover' },
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/far-mountains.png', speed: 2, align: 'bottom', scaleMode: 'coverY' },
        { src: '/ui/assets/backgrounds/worlds/mountain-dusk/far-clouds.png', speed: 5, align: 'top', scaleMode: 'coverWidth' }
      ],
      fx: { src: '/ui/assets/effects/vfx/campfire_64x64.png', fw: 64, fh: 64, frames: 12, fps: 10, xPct: 0.92, yPct: 0.84, scale: 1.5 },
      motes: '#ffe596',
      credit: ''
    },
    gate: {
      label: 'Adventure Citadel Gate',
      sky: ['#261d30', '#543547'],
      layers: [
        { src: '/ui/assets/backgrounds/worlds/gothicvania-town/background.png', speed: 3, align: 'bottom', scaleMode: 'coverY' },
        { src: '/ui/assets/backgrounds/worlds/gothicvania-town/middleground.png', speed: 8, align: 'bottom', scaleMode: 'coverY' }
      ],
      fx: { src: '/ui/assets/effects/vfx/torch_flame_32x32.png', fw: 32, fh: 32, frames: 8, fps: 10, xPct: 0.12, yPct: 0.72, scale: 2 },
      motes: '#ffb454',
      credit: ''
    }
  };

  const ROUTE_BIOME = [
    ['/app/minigame', 'mountain-dusk'],
    ['/app/volcard', 'forest'],
    ['/app/quiz', 'academy'],
    ['/app/memory', 'waterfall'],
    ['/app/speed-math', 'mountain-dusk'],
    ['/app/code-puzzle', 'academy'],
    ['/app/account', 'gate'],
    ['/app/auth', 'gate'],
    ['/app/home', 'village'],
    ['/app', 'village']
  ];

  const imageCache = new Map();
  function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) return imageCache.get(src);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    imageCache.set(src, p);
    return p;
  }

  let hostEl = null;
  let canvas = null;
  let ctx = null;
  let creditEl = null;
  let activeBiomeId = 'village';
  let loadedLayers = [];
  let loadedFx = null;
  let loadedWaterfall = null;
  let rafId = 0;
  let lastDrawTs = 0;
  let paused = false;
  let animTimeSec = 0;
  let reducedMotion = false;

  const motes = Array.from({ length: 18 }, (_, idx) => ({
    x: ((idx * 53) % 97) / 100,
    y: ((idx * 37) % 89) / 100,
    speedY: 0.015 + (idx % 5) * 0.004,
    drift: (idx % 3 === 0 ? 1 : -1) * 0.008,
    size: idx % 4 === 0 ? 3 : 2
  }));

  function detectDefaultBiome() {
    const attr = document.body?.dataset?.world;
    if (attr && BIOMES[attr]) return attr;
    const p = (window.location?.pathname || '').toLowerCase();
    const hit = ROUTE_BIOME.find(([prefix]) => p.startsWith(prefix));
    return hit ? hit[1] : 'village';
  }

  function ensureHost() {
    if (hostEl && document.body.contains(hostEl)) return;
    hostEl = document.createElement('div');
    hostEl.id = 'worldBackdrop';
    hostEl.className = 'world-backdrop';
    hostEl.setAttribute('aria-hidden', 'true');

    canvas = document.createElement('canvas');
    canvas.className = 'world-backdrop__canvas';
    ctx = canvas.getContext('2d');

    const scrim = document.createElement('div');
    scrim.className = 'world-backdrop__scrim';

    creditEl = document.createElement('div');
    creditEl.className = 'world-backdrop__credit';
    creditEl.style.display = 'none';

    hostEl.appendChild(canvas);
    hostEl.appendChild(scrim);
    document.body.prepend(hostEl);
    document.body.appendChild(creditEl);
    resizeCanvas();
  }

  function resizeCanvas() {
    if (!canvas) return;
    // Render at ~480px base width for crisp pixel scaling and low GPU/CPU overhead
    const aspect = Math.max(0.5, window.innerWidth / Math.max(1, window.innerHeight));
    const targetH = 270;
    const targetW = Math.max(240, Math.round(targetH * aspect));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    if (ctx) ctx.imageSmoothingEnabled = false;
  }

  async function setBiome(biomeId) {
    const id = BIOMES[biomeId] ? biomeId : 'village';
    activeBiomeId = id;
    const spec = BIOMES[id];
    ensureHost();

    if (creditEl) {
      if (spec.credit) {
        creditEl.textContent = spec.credit;
        creditEl.style.display = 'block';
      } else {
        creditEl.style.display = 'none';
      }
    }

    const layerImgs = await Promise.all((spec.layers || []).map((l) => loadImage(l.src)));
    if (activeBiomeId !== id) return;
    loadedLayers = (spec.layers || []).map((l, idx) => ({ ...l, img: layerImgs[idx] })).filter((l) => l.img);
    loadedFx = spec.fx ? { ...spec.fx, img: await loadImage(spec.fx.src) } : null;
    loadedWaterfall = spec.waterfall ? { ...spec.waterfall, img: await loadImage(spec.waterfall.src) } : null;
    drawFrame(true);
  }

  function drawTiledLayer(img, speed, align, scaleMode) {
    if (!img || !ctx || !canvas) return;
    const cw = canvas.width;
    const ch = canvas.height;
    let drawW = img.width;
    let drawH = img.height;
    if (scaleMode === 'cover' || scaleMode === 'coverY') {
      const s = Math.max(ch / img.height, 1);
      drawW = Math.round(img.width * s);
      drawH = Math.round(img.height * s);
    } else if (scaleMode === 'coverWidth') {
      const s = Math.max(cw / img.width, ch * 0.55 / img.height);
      drawW = Math.round(img.width * s);
      drawH = Math.round(img.height * s);
    }
    const y = align === 'top' ? 0 : ch - drawH;
    const shift = speed ? Math.floor((animTimeSec * speed) % drawW) : 0;
    for (let x = -shift; x < cw; x += drawW) {
      ctx.drawImage(img, Math.round(x), Math.round(y), drawW, drawH);
    }
  }

  function drawFrame(force) {
    if (!ctx || !canvas) return;
    const spec = BIOMES[activeBiomeId] || BIOMES.village;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.imageSmoothingEnabled = false;

    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, spec.sky[0]);
    grad.addColorStop(1, spec.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    for (const layer of loadedLayers) {
      drawTiledLayer(layer.img, reducedMotion ? 0 : layer.speed, layer.align, layer.scaleMode);
    }

    if (loadedWaterfall && loadedWaterfall.img) {
      const wf = loadedWaterfall;
      const frameIdx = reducedMotion ? 0 : Math.floor(animTimeSec * wf.fps) % wf.frames;
      const destH = ch;
      const destW = Math.round((wf.fw / wf.fh) * destH);
      const destX = Math.round(cw * 0.72 - destW * 0.5);
      ctx.globalAlpha = 0.72;
      ctx.drawImage(wf.img, frameIdx * wf.fw, 0, wf.fw, wf.fh, destX, 0, destW, destH);
      ctx.globalAlpha = 1;
    }

    if (loadedFx && loadedFx.img) {
      const fx = loadedFx;
      const frameIdx = reducedMotion ? 0 : Math.floor(animTimeSec * fx.fps) % fx.frames;
      const dw = fx.fw * (fx.scale || 1);
      const dh = fx.fh * (fx.scale || 1);
      const dx = Math.round(cw * fx.xPct - dw * 0.5);
      const dy = Math.round(ch * fx.yPct - dh * 0.5);
      ctx.drawImage(fx.img, frameIdx * fx.fw, 0, fx.fw, fx.fh, dx, dy, dw, dh);
    }

    if (spec.motes) {
      ctx.fillStyle = spec.motes;
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const t = reducedMotion ? 0 : animTimeSec;
        const px = Math.round(((m.x + Math.sin(t + i) * 0.015 + t * m.drift) % 1 + 1) % 1 * cw);
        const py = Math.round(((m.y - t * m.speedY) % 1 + 1) % 1 * ch);
        ctx.globalAlpha = 0.45;
        ctx.fillRect(px, py, m.size, m.size);
      }
      ctx.globalAlpha = 1;
    }

    const activeTheme = document.documentElement.dataset.theme;
    if (activeTheme === 'daylight') {
      ctx.fillStyle = 'rgba(243, 238, 220, 0.24)';
      ctx.fillRect(0, 0, cw, ch);
    } else if (activeTheme === 'moonlight') {
      ctx.fillStyle = 'rgba(33, 42, 52, 0.36)';
      ctx.fillRect(0, 0, cw, ch);
    }
    if (force) lastDrawTs = performance.now();
  }

  function tick(ts) {
    if (paused || document.hidden || reducedMotion) {
      rafId = 0;
      return;
    }
    if (!lastDrawTs) lastDrawTs = ts;
    const elapsed = ts - lastDrawTs;
    if (elapsed >= 42) { // ~24fps lightweight world background
      animTimeSec += Math.min(0.15, elapsed / 1000);
      lastDrawTs = ts;
      drawFrame(false);
    }
    rafId = window.requestAnimationFrame(tick);
  }

  function pause() {
    paused = true;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function resume() {
    paused = false;
    lastDrawTs = 0;
    if (!reducedMotion && !document.hidden && !rafId) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  function mount(biomeId) {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    reducedMotion = Boolean(mq?.matches);
    mq?.addEventListener?.('change', (e) => {
      reducedMotion = Boolean(e.matches);
      if (reducedMotion) {
        drawFrame(true);
      } else if (!paused && !document.hidden) {
        resume();
      }
    });

    ensureHost();
    window.addEventListener('resize', () => {
      resizeCanvas();
      drawFrame(true);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
      else resume();
    });

    window.addEventListener('glp:themechange', () => {
      drawFrame(true);
    });

    setBiome(biomeId || detectDefaultBiome());
    if (!reducedMotion && !document.hidden) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  window.WorldEnvironment = {
    mount,
    setBiome,
    pause,
    resume,
    getState: () => ({
      biome: activeBiomeId,
      paused: paused || document.hidden || reducedMotion,
      reducedMotion,
      hidden: Boolean(document.hidden),
      layersLoaded: loadedLayers.length
    })
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mount());
  } else {
    mount();
  }
})();
