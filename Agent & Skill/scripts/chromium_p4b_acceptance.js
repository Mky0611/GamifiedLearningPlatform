#!/usr/bin/env node
/**
 * Real Headless Chromium Acceptance & Visual QA Suite for Lex Raid (Phase P4-B)
 * Zero external dependencies: uses Node.js built-in HTTP server + Chrome DevTools Protocol (--remote-debugging-pipe).
 * Tests:
 * - All 9 required viewports on Battle Arena (/app/minigame) + Canvas fallback (?renderer=canvas)
 * - All 9 pages at Desktop (1366x768) and Mobile (390x844) + Navbar & Logo rendering
 * - Typography Specimen comparison (/app/typography)
 * - Volcard long word / phrase fit & flip interaction (/app/volcard at 320x568, 390x844, 1366x768)
 * - Account unit/avatar selection + Quiz demo interaction
 * - Console errors, page errors, failed asset requests, font loading, horizontal overflow, tap targets
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_ROOT = path.join(REPO_ROOT, 'src/main/resources/FrontEnd');
const OUTPUT_DIR = path.join(REPO_ROOT, 'test_output/p4b_browser');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const VIEWPORTS_9 = [
  { name: '320x568', width: 320, height: 568, mobile: true },
  { name: '360x800', width: 360, height: 800, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '430x932', width: 430, height: 932, mobile: true },
  { name: '768x1024', width: 768, height: 1024, mobile: true },
  { name: '1024x768', width: 1024, height: 768, mobile: false },
  { name: '1366x768', width: 1366, height: 768, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '1920x1080', width: 1920, height: 1080, mobile: false },
];

const PAGES = [
  { route: '/app/home', name: 'home' },
  { route: '/app/minigame', name: 'minigame' },
  { route: '/app/volcard', name: 'volcard' },
  { route: '/app/account', name: 'account' },
  { route: '/app/quiz', name: 'quiz' },
  { route: '/app/memory', name: 'memory' },
  { route: '/app/speed-math', name: 'speed-math' },
  { route: '/app/code-puzzle', name: 'code-puzzle' },
  { route: '/app/auth', name: 'auth' },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const ROUTE_MAP = {
  '/': 'src/pages/home.html',
  '/app': 'src/pages/home.html',
  '/app/': 'src/pages/home.html',
  '/app/home': 'src/pages/home.html',
  '/app/auth': 'src/pages/auth.html',
  '/app/minigame': 'src/pages/minigame.html',
  '/app/quiz': 'src/pages/quiz.html',
  '/app/volcard': 'src/pages/volcard.html',
  '/app/memory': 'src/pages/memory.html',
  '/app/speed-math': 'src/pages/speed-math.html',
  '/app/code-puzzle': 'src/pages/code-puzzle.html',
  '/app/account': 'src/pages/account.html',
  '/app/typography': 'src/pages/typography-specimen.html',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath.startsWith('/api/')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Preview Mode: API offline' }));
        return;
      }
      let rel = ROUTE_MAP[urlPath];
      if (!rel && urlPath.startsWith('/ui/assets/')) rel = 'assets/' + urlPath.slice('/ui/assets/'.length);
      else if (!rel && urlPath.startsWith('/ui/src/')) rel = 'src/' + urlPath.slice('/ui/src/'.length);
      else if (!rel && urlPath.startsWith('/ui/')) rel = urlPath.slice('/ui/'.length);
      else if (!rel && urlPath.startsWith('/assets/')) rel = urlPath.slice(1);

      if (!rel) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const fullPath = path.join(FRONTEND_ROOT, rel);
      if (!fullPath.startsWith(FRONTEND_ROOT) || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        res.writeHead(404);
        res.end('Missing: ' + rel);
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(fullPath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

class CDPClient {
  constructor(chromePath) {
    this.chromePath = chromePath;
    this.idCounter = 1;
    this.pending = new Map();
    this.events = [];
    this.buf = Buffer.alloc(0);
    this.userDataDir = path.join(OUTPUT_DIR, 'chrome-profile-' + Date.now());
  }

  async launch() {
    fs.mkdirSync(this.userDataDir, { recursive: true });
    this.proc = spawn(this.chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--remote-debugging-pipe',
      '--autoplay-policy=no-user-gesture-required',
      '--user-data-dir=' + this.userDataDir,
      'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });

    this.toChrome = this.proc.stdio[3];
    this.fromChrome = this.proc.stdio[4];
    this.fromChrome.on('data', (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) !== -1) {
        const raw = this.buf.subarray(0, idx).toString('utf8');
        this.buf = this.buf.subarray(idx + 1);
        if (!raw) continue;
        const msg = JSON.parse(raw);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        } else if (msg.method) {
          for (const fn of this.events) fn(msg);
        }
      }
    });

    const targets = await this.send('Target.getTargets');
    const pageTarget = targets.targetInfos.find((t) => t.type === 'page') || (await this.createTarget());
    const attach = await this.send('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });
    this.sessionId = attach.sessionId;
    await this.send('Page.enable', {}, this.sessionId);
    await this.send('Runtime.enable', {}, this.sessionId);
    await this.send('Network.enable', {}, this.sessionId);
  }

  async createTarget() {
    const r = await this.send('Target.createTarget', { url: 'about:blank' });
    return { targetId: r.targetId };
  }

  send(method, params = {}, sessionId = undefined) {
    return new Promise((resolve, reject) => {
      const id = this.idCounter++;
      this.pending.set(id, { resolve, reject });
      this.toChrome.write(JSON.stringify({ id, method, params, sessionId }) + '\0');
    });
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile,
      screenWidth: width,
      screenHeight: height,
    }, this.sessionId);
  }

  async goto(url, waitMs = 1100) {
    const logs = { consoleErrors: [], pageErrors: [], failedRequests: [] };
    const handler = (ev) => {
      if (ev.sessionId !== this.sessionId) return;
      if (ev.method === 'Runtime.exceptionThrown') {
        const txt = ev.params.exceptionDetails?.exception?.description || ev.params.exceptionDetails?.text || 'Page exception';
        logs.pageErrors.push(txt);
      } else if (ev.method === 'Runtime.consoleAPICalled' && ev.params.type === 'error') {
        const text = (ev.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        if (!text.includes('404')) logs.consoleErrors.push(text);
      } else if (ev.method === 'Network.responseReceived') {
        const { url: rUrl, status } = ev.params.response;
        if (status >= 400 && !rUrl.includes('/api/')) {
          logs.failedRequests.push({ url: rUrl, status });
        }
      } else if (ev.method === 'Network.loadingFailed') {
        if (!ev.params.canceled && ev.params.errorText !== 'net::ERR_ABORTED') {
          logs.failedRequests.push({ url: 'loadingFailed:' + ev.params.type, error: ev.params.errorText });
        }
      }
    };
    this.events.push(handler);

    await this.send('Page.navigate', { url }, this.sessionId);
    await new Promise((r) => setTimeout(r, waitMs));
    await this.eval('document.fonts && document.fonts.ready ? document.fonts.ready.then(()=>true) : true');
    await new Promise((r) => setTimeout(r, 250));

    this.events = this.events.filter((fn) => fn !== handler);
    return logs;
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    }, this.sessionId);
    if (r.exceptionDetails) {
      throw new Error('Eval exception: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    }
    return r.result ? r.result.value : undefined;
  }

  async clickSelector(selector) {
    const pt = await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    })()`);
    if (!pt || pt.w === 0 || pt.h === 0) throw new Error('Element not visible: ' + selector);
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 }, this.sessionId);
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 }, this.sessionId);
  }

  async typeSelector(selector, value) {
    await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('Missing input');
      el.focus();
      el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
  }

  async screenshot(outFile, fullPage = false) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: fullPage }, this.sessionId);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, Buffer.from(res.data, 'base64'));
  }

  async close() {
    try { if (this.proc) this.proc.kill(); } catch {}
    try { fs.rmSync(this.userDataDir, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chromePath) {
    console.error('No Chromium/Edge binary found!');
    process.exit(1);
  }
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { server, port } = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const cdp = new CDPClient(chromePath);
  const report = {
    executedAt: new Date().toISOString(),
    chromePath,
    typography: null,
    pages: [],
    volcardFit: [],
    battleViewports: [],
    battleCanvasFallback: null,
    battleAnimations: [],
    interactions: {},
  };

  try {
    await cdp.launch();
    console.log('Chrome launched via CDP pipe. Testing against', baseUrl);

    // 1. TYPOGRAPHY SPECIMEN
    await cdp.setViewport(1280, 900, false);
    const typoLogs = await cdp.goto(`${baseUrl}/app/typography`, 1400);
    const typoMetrics = await cdp.eval(`(() => {
      const getBox = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { text: el.innerText.slice(0, 48), fontFamily: cs.fontFamily, fontSize: cs.fontSize, w: Math.round(r.width), h: Math.round(r.height), scrollW: el.scrollWidth, clientW: el.clientWidth };
      };
      return {
        fonts: window.__TYPO_SPECIMEN_READY__ || null,
        comboA_vn: getBox('#comboA [data-sample="vn-diacritics"]'),
        comboB_vn: getBox('#comboB [data-sample="vn-diacritics"]'),
        comboB_hud: getBox('#comboB [data-sample="ascii-hud"]'),
        comboB_mono: getBox('#comboB [data-sample="ambig"]'),
        comboC_vn: getBox('#comboC [data-sample="vn-diacritics"]')
      };
    })()`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'typography_specimen.png'), true);
    report.typography = { ...typoLogs, metrics: typoMetrics };
    console.log('Typography specimen fonts:', JSON.stringify(typoMetrics.fonts));

    // 2. ALL 9 PAGES AT DESKTOP (1366x768) & MOBILE (390x844)
    for (const p of PAGES) {
      for (const vp of [{ name: 'desktop', w: 1366, h: 768, mobile: false }, { name: 'mobile', w: 390, h: 844, mobile: true }]) {
        await cdp.setViewport(vp.w, vp.h, vp.mobile);
        const logs = await cdp.goto(`${baseUrl}${p.route}`, 1200);
        const dom = await cdp.eval(`(() => {
          const de = document.documentElement;
          const nav = document.querySelector('.main-nav')?.getBoundingClientRect();
          const logo = document.querySelector('.brand__logo');
          const logoRect = logo?.getBoundingClientRect();
          const h1 = document.querySelector('h1, .raid-title');
          const h1Rect = h1?.getBoundingClientRect();
          const navLinks = Array.from(document.querySelectorAll('.nav-link-soft')).map(a => ({
            text: a.innerText.trim(), href: a.getAttribute('href'), active: a.classList.contains('is-active'), h: Math.round(a.getBoundingClientRect().height)
          }));
          const btns = Array.from(document.querySelectorAll('button:not([style*="display: none"]), a.pixel-btn, a.btn-soft')).filter(el => el.offsetParent !== null);
          const minBtnH = btns.length ? Math.min(...btns.map(b => b.getBoundingClientRect().height)) : 0;
          return {
            title: document.title,
            hasFavicon: Boolean(document.querySelector('link[rel="icon"]')),
            horizontalOverflow: de.scrollWidth > window.innerWidth + 1,
            scrollW: de.scrollWidth,
            innerW: window.innerWidth,
            navHeight: nav ? Math.round(nav.height) : 0,
            headerOverlapsContent: (nav && h1Rect) ? (nav.bottom > h1Rect.top + 2 && h1Rect.height > 0) : false,
            logoRendered: logoRect ? { w: Math.round(logoRect.width), h: Math.round(logoRect.height), natW: logo.naturalWidth, natH: logo.naturalHeight } : null,
            navLinksCount: navLinks.length,
            hasRequiredLinks: ['/app/home','/app/minigame','/app/volcard','/app/quiz','/app/account'].every(req => navLinks.some(l => l.href === req)),
            minButtonHeight: Math.round(minBtnH),
            fontsLoaded: {
              silkscreen: document.fonts.check('700 16px Silkscreen') || document.fonts.check('16px Silkscreen'),
              beVietnam: document.fonts.check('16px "Be Vietnam Pro"')
            }
          };
        })()`);
        if (vp.mobile) {
          // Test mobile nav drawer toggle visibility & contrast
          await cdp.clickSelector('#mobileNavToggle');
          await new Promise((r) => setTimeout(r, 150));
          dom.mobileMenuOpenOk = await cdp.eval(`(() => {
            const nl = document.getElementById('mainNavLinks');
            if (!nl || !nl.classList.contains('is-open')) return false;
            const cs = getComputedStyle(nl);
            const normalLink = nl.querySelector('.nav-link-soft:not(.is-active)') || nl.querySelector('.nav-link-soft');
            const lc = normalLink ? getComputedStyle(normalLink).color : '';
            return { bg: cs.backgroundColor, linkColor: lc, h: Math.round(nl.getBoundingClientRect().height) };
          })()`);
        }
        const shot = path.join(OUTPUT_DIR, `page_${p.name}_${vp.name}.png`);
        await cdp.screenshot(shot, false);
        report.pages.push({ page: p.name, viewport: vp.name, ...dom, logs, screenshot: path.relative(REPO_ROOT, shot).replace(/\\/g, '/') });
        console.log(`Page ${p.name} (${vp.name}): overflow=${dom.horizontalOverflow} nav=${dom.navLinksCount} reqLinks=${dom.hasRequiredLinks} logo=${dom.logoRendered?.w}x${dom.logoRendered?.h} errs=${logs.consoleErrors.length + logs.pageErrors.length + logs.failedRequests.length}`);
      }
    }

    // 3. VOLCARD WORD FIT & INTERACTIONS AT 320x568, 390x844, 1366x768
    for (const vp of [{ name: '320x568', w: 320, h: 568, mobile: true }, { name: '390x844', w: 390, h: 844, mobile: true }, { name: '1366x768', w: 1366, h: 768, mobile: false }]) {
      await cdp.setViewport(vp.w, vp.h, vp.mobile);
      await cdp.goto(`${baseUrl}/app/volcard`, 1200);
      const wordResults = [];
      for (let i = 0; i < 4; i++) {
        const wInfo = await cdp.eval(`(() => {
          const w = document.getElementById('flashWord');
          const face = document.querySelector('.flash-face--front');
          const tts = document.getElementById('ttsBtn');
          if (!w || !face) return null;
          const wr = w.getBoundingClientRect();
          const fr = face.getBoundingClientRect();
          const cs = getComputedStyle(w);
          return {
            word: w.textContent.trim(),
            fontSize: cs.fontSize,
            textOverflow: cs.textOverflow,
            wordW: Math.round(wr.width),
            wordScrollW: w.scrollWidth,
            cardW: Math.round(fr.width),
            clippedX: w.scrollWidth > w.clientWidth + 1 || wr.right > fr.right - 2,
            ttsOverlap: tts ? (wr.bottom > tts.getBoundingClientRect().top + 1) : false
          };
        })()`);
        wordResults.push(wInfo);
        if (i === 0 || (vp.name === '320x568' && wInfo && wInfo.word.toLowerCase().includes('continuous'))) {
          await cdp.eval(`document.getElementById('flashCard')?.scrollIntoView({ block: 'center' })`);
          await new Promise((r) => setTimeout(r, 120));
          const tag = i === 0 ? 'front' : 'continuous';
          await cdp.screenshot(path.join(OUTPUT_DIR, `volcard_${vp.name}_${tag}.png`), false);
        }
        if (i === 0) {
          await cdp.clickSelector('#flipBtn');
          await new Promise((r) => setTimeout(r, 520));
          await cdp.eval(`document.getElementById('flashCard')?.scrollIntoView({ block: 'center' })`);
          await new Promise((r) => setTimeout(r, 80));
          const backInfo = await cdp.eval(`(() => {
            const b = document.querySelector('.flash-face--back');
            const c = b?.querySelector('.flash-face__content');
            return b && c ? { backH: Math.round(b.getBoundingClientRect().height), contentScrollH: c.scrollHeight, clippedY: c.scrollHeight > b.clientHeight + 2 } : null;
          })()`);
          wordResults.push({ flippedBackCheck: backInfo });
          await cdp.screenshot(path.join(OUTPUT_DIR, `volcard_${vp.name}_back.png`), false);
        }
        await cdp.clickSelector('#nextBtn');
        await new Promise((r) => setTimeout(r, 250));
      }
      // Test CEFR filter & search on desktop
      if (vp.name === '1366x768') {
        await cdp.clickSelector('[data-level="C1"]');
        await new Promise((r) => setTimeout(r, 250));
        const cefrWord = await cdp.eval(`document.getElementById('flashWord')?.textContent.trim()`);
        await cdp.clickSelector('[data-level="ALL"]');
        await cdp.typeSelector('#volcardSearch', 'continuous');
        await new Promise((r) => setTimeout(r, 450));
        const searchWord = await cdp.eval(`document.getElementById('flashWord')?.textContent.trim()`);
        report.interactions.volcard = { cefrC1Word: cefrWord, searchContinuousWord: searchWord };
      }
      report.volcardFit.push({ viewport: vp.name, words: wordResults });
      console.log(`Volcard (${vp.name}): checked ${wordResults.length} states, cefr/search=${JSON.stringify(report.interactions.volcard || {})}`);
    }

    // 4. BATTLE VISUAL QA ACROSS ALL 9 VIEWPORTS + ANIMATIONS + CANVAS FALLBACK
    for (const vp of VIEWPORTS_9) {
      await cdp.setViewport(vp.width, vp.height, vp.mobile);
      const logs = await cdp.goto(`${baseUrl}/app/minigame`, 1600);
      await cdp.screenshot(path.join(OUTPUT_DIR, `battle_${vp.name}_init.png`), false);

      const rects = await cdp.eval(`(() => {
        const box = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none' };
        };
        const statusEl = document.getElementById('raidStatus');
        const renderer = window.__LEX_RAID_TEST_HOOKS__?.getRenderer?.() || document.querySelector('.battle-stage')?.dataset.renderer || '';
        return {
          winW: window.innerWidth,
          winH: window.innerHeight,
          scrollW: document.documentElement.scrollWidth,
          scrollH: document.documentElement.scrollHeight,
          renderer,
          canvasClipped: (() => {
            const st = document.querySelector('.battle-stage')?.getBoundingClientRect();
            const cv = document.querySelector('#raidPhaserMount canvas')?.getBoundingClientRect();
            return (st && cv) ? (cv.bottom > st.bottom + 2 || cv.right > st.right + 2) : false;
          })(),
          statusText: statusEl ? statusEl.innerText : '',
          hasRawHtmlInStatus: statusEl ? statusEl.innerText.includes('<span') : false,
          navbar: box('.main-nav'),
          raidHeader: box('.raid-header'),
          heroHud: box('.fighter-panel'),
          bossHud: box('.boss-panel'),
          arenaHudOverlay: box('.arena-hud-overlay'),
          arena: box('.battle-stage'),
          timerDesktop: box('#timerValue'),
          timerOverlay: box('#timerHudValue'),
          selectedWord: box('#currentWordValue'),
          attackDock: box('.attack-dock'),
          wordBoard: box('#boardGrid'),
          clearBtn: box('#clearPathBtn'),
          attackBtn: box('#submitWordBtn'),
        };
      })()`);

      // Test interactive Clear & Attack
      await cdp.clickSelector('.board-tile[data-row="0"][data-col="0"]');
      await new Promise((r) => setTimeout(r, 80));
      const wordBeforeClear = await cdp.eval(`document.getElementById('currentWordValue')?.innerText.trim()`);
      await cdp.clickSelector('#clearPathBtn');
      await new Promise((r) => setTimeout(r, 120));
      const wordAfterClear = await cdp.eval(`document.getElementById('currentWordValue')?.innerText.trim()`);

      const movePlan = await cdp.eval(`(() => {
        const tiles = Array.from(document.querySelectorAll('.board-tile')).map(el => ({
          row: el.dataset.row, col: el.dataset.col, letter: (el.dataset.letter || '').toUpperCase()
        }));
        const words = window.__LEX_RAID_TEST_HOOKS__ ? [window.__LEX_RAID_TEST_HOOKS__.getActiveCoreWord(), ...window.__LEX_RAID_TEST_HOOKS__.getValidWords()] : ['LEARN'];
        for (const w of words) {
          const used = new Set(); const path = [];
          let ok = true;
          for (const ch of w.toUpperCase()) {
            const hit = tiles.find((t, idx) => !used.has(idx) && t.letter === ch);
            if (!hit) { ok = false; break; }
            used.add(tiles.indexOf(hit));
            path.push(hit);
          }
          if (ok && path.length >= 3) return { word: w, path };
        }
        return null;
      })()`);

      let attackOk = false;
      let afterAttack = null;
      if (movePlan) {
        const beforeScore = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__?.getScore() || 0`);
        const beforeHp = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__?.getBossHp() || 100`);
        const beforeShield = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__?.getBossShield() || 30`);
        for (const step of movePlan.path) {
          await cdp.clickSelector(`.board-tile[data-row="${step.row}"][data-col="${step.col}"]`);
          await new Promise((r) => setTimeout(r, 40));
        }
        await cdp.clickSelector('#submitWordBtn');
        await new Promise((r) => setTimeout(r, 900));
        afterAttack = await cdp.eval(`({
          score: window.__LEX_RAID_TEST_HOOKS__?.getScore() || 0,
          bossHp: window.__LEX_RAID_TEST_HOOKS__?.getBossHp(),
          bossShield: window.__LEX_RAID_TEST_HOOKS__?.getBossShield(),
          status: document.getElementById('raidStatus')?.innerText || ''
        })`);
        attackOk = afterAttack.score > beforeScore || afterAttack.bossHp < beforeHp || afterAttack.bossShield < beforeShield;
      }

      await cdp.screenshot(path.join(OUTPUT_DIR, `battle_${vp.name}_after.png`), false);

      const coreBottom = Math.max(rects.arena?.bottom || 0, rects.attackDock?.bottom || 0, rects.wordBoard?.bottom || 0);
      const fitsInViewport = coreBottom <= vp.height + 2;
      report.battleViewports.push({
        viewport: vp.name,
        renderer: rects.renderer,
        horizontalOverflow: rects.scrollW > vp.width + 1,
        coreControlsBottom: coreBottom,
        viewportHeight: vp.height,
        fitsInViewport,
        clearBtnH: rects.clearBtn?.h || 0,
        attackBtnH: rects.attackBtn?.h || 0,
        tapTarget40px: (rects.clearBtn?.h || 0) >= 40 && (rects.attackBtn?.h || 0) >= 40,
        clearFunctional: wordBeforeClear.length > 0 && (wordAfterClear === '—' || wordAfterClear === ''),
        attackFunctional: attackOk,
        hasRawHtmlInStatus: rects.hasRawHtmlInStatus,
        rects,
        logs,
      });
      console.log(`Battle ${vp.name}: renderer=${rects.renderer} overflow=${rects.scrollW > vp.width + 1} coreBottom=${coreBottom}/${vp.height} (fit=${fitsInViewport}) clear=${wordAfterClear==='—'} attack=${attackOk} rawHTML=${rects.hasRawHtmlInStatus}`);
    }

    // 5. TEST ALL HEROES (warrior, lancer, archer) & MULTIPLE BOSSES + CANVAS FALLBACK & FINISH OVERLAY
    await cdp.setViewport(1366, 768, false);
    await cdp.goto(`${baseUrl}/app/minigame?renderer=canvas`, 1200);
    await new Promise((r) => setTimeout(r, 400));
    const canvasInfo = await cdp.eval(`({
      renderer: window.__LEX_RAID_TEST_HOOKS__?.getRenderer?.(),
      hasCanvas: Boolean(document.querySelector('#raidPhaserMount canvas')),
      fallbackDomHidden: getComputedStyle(document.querySelector('.battle-stage__actors--fallback')).display === 'none'
    })`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'battle_canvas_fallback_1366x768.png'), false);
    report.battleCanvasFallback = canvasInfo;
    console.log('Canvas Fallback check:', JSON.stringify(canvasInfo));

    // Switch hero units & boss themes in Phaser mode and capture attack frames + boss turn + defeat/finish
    await cdp.goto(`${baseUrl}/app/minigame`, 2000);
    for (const combo of [{ unit: 'warrior', boss: 'crabby' }, { unit: 'lancer', boss: 'fierce' }, { unit: 'archer', boss: 'captain' }]) {
      await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setLoadoutAndBoss({ unitCode: ${JSON.stringify(combo.unit)}, bossTheme: ${JSON.stringify(combo.boss)} })`);
      await new Promise((r) => setTimeout(r, 550));
      await cdp.screenshot(path.join(OUTPUT_DIR, `anim_${combo.unit}_vs_${combo.boss}.png`), false);
      report.battleAnimations.push({ ...combo, screenshot: `test_output/p4b_browser/anim_${combo.unit}_vs_${combo.boss}.png` });
    }
    // Exercise actual Warrior Attack sequence & Boss Counter sequence in Phaser
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setLoadoutAndBoss({ unitCode: 'warrior', bossTheme: 'crabby' })`);
    await new Promise((r) => setTimeout(r, 200));
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.triggerBossTurn()`);
    await new Promise((r) => setTimeout(r, 300));
    await cdp.screenshot(path.join(OUTPUT_DIR, 'anim_boss_turn_guard.png'), false);
    // Trigger timer / finish modal check
    const timerBefore = await cdp.eval(`document.getElementById('timerValue')?.innerText.trim()`);
    await new Promise((r) => setTimeout(r, 1200));
    const timerAfter = await cdp.eval(`document.getElementById('timerValue')?.innerText.trim()`);
    await cdp.clickSelector('#finishBattleBtn');
    await new Promise((r) => setTimeout(r, 300));
    const finishOpen = await cdp.eval(`document.getElementById('finishOverlay')?.classList.contains('is-open')`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'battle_finish_overlay.png'), false);
    report.interactions.battleTimerAndFinish = { timerBefore, timerAfter, timerTicked: timerBefore !== timerAfter, finishOpen };

    // 6. ACCOUNT & QUIZ INTERACTIONS
    await cdp.setViewport(1366, 768, false);
    await cdp.goto(`${baseUrl}/app/account`, 1000);
    await cdp.clickSelector('[data-unit="archer"]');
    await cdp.clickSelector('[data-avatar="avatar3"]');
    await cdp.clickSelector('#saveLoadoutBtn');
    await new Promise((r) => setTimeout(r, 250));
    const accountSummary = await cdp.eval(`document.getElementById('accountSummary')?.innerText`);
    report.interactions.account = { accountSummary };

    await cdp.goto(`${baseUrl}/app/quiz`, 1000);
    await cdp.clickSelector('.choice-btn');
    await new Promise((r) => setTimeout(r, 250));
    const quizProgress = await cdp.eval(`({ score: document.getElementById('quizScore')?.innerText, progress: document.getElementById('quizProgress')?.innerText })`);
    report.interactions.quiz = quizProgress;

    const jsonOut = path.join(OUTPUT_DIR, 'browser_qa_report.json');
    fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), 'utf-8');
    console.log('Full real-browser report saved to:', jsonOut);
  } finally {
    await cdp.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('Acceptance failed:', err);
  process.exit(1);
});
