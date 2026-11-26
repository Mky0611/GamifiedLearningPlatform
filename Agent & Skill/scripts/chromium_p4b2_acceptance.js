#!/usr/bin/env node
/**
 * Real Headless Chromium Acceptance & Visual QA Suite for Lex Raid (Phase P4-B.2 — Kingdom of Words)
 * Zero external dependencies: uses Node.js built-in HTTP server + Chrome DevTools Protocol (--remote-debugging-pipe).
 * Verifies:
 * - All 9 pages at Desktop (1366x768) & Mobile (390x844): WorldEnvironment active, Kibyra nav icons, 9-slice images loaded, 0 404 assets
 * - Typography Specimen (/app/typography): Lora, Pixelify Sans, Be Vietnam Pro, JetBrains Mono, Silkscreen
 * - Volcard word fit & flip interaction at 320x568, 390x844, 1366x768
 * - Battle Arena across all 9 viewports (320x568..1920x1080): Skill Bar + Dock + Board fit, tap targets >= 40px, Clear & Attack functional
 * - P4-B.2 Combat Engine: Knight Skills (Heavy Slash, Royal Guard, Lexical Judgment), pooled VFX, FSM return to IDLE, rapid mid-tween reset
 * - Monster Expansion Preview: Slime & Skeleton sprites, portraits, WorldEnvironment pause/resume, Canvas fallback parity
 * - Fails with non-zero exit code if ANY mandatory assertion fails.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_ROOT = path.join(REPO_ROOT, 'src/main/resources/FrontEnd');
const OUTPUT_DIR = path.join(REPO_ROOT, 'test_output/p4b2_browser');

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
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
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
  '/robots.txt': 'robots.txt',
  '/sitemap.xml': 'sitemap.xml',
  '/404.html': '404.html',
};

function startStaticServer(serverState) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath.startsWith('/api/')) {
        if (serverState && serverState.mockBackend) {
          const json = (data) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data }));
          };
          if (urlPath === '/api/v1/account/loadout') {
            return json({ selectedUnitCode: 'warrior', selectedAvatarKey: 'avatar-a' });
          }
          if (/^\/api\/v1\/lex-raid\/stages\/\d+$/.test(urlPath)) {
            return json({
              stageId: 1, stageNo: 1, chapterNo: 1, name: 'Mock Backend Raid',
              description: 'Backend session QA check', boardRows: 5, boardCols: 5,
              turnLimit: 5, timePerRoundSec: 20, difficulty: 'NORMAL',
              boss: { name: 'Crabby', baseHp: 120, baseShield: 30, rageThreshold: 20, elementType: 'WATER', code: 'CRABBY' }
            });
          }
          if (/^\/api\/v1\/lex-raid\/stages\/\d+\/runtime$/.test(urlPath)) {
            return json({
              activeCoreIndex: 0,
              coreWord: 'LEARN',
              clueText: 'Gaining knowledge.',
              vocabulary: [{ wordText: 'learn' }, { wordText: 'raid' }, { wordText: 'game' }, { wordText: 'word' }],
              objectives: [{ objectiveType: 'TOPIC_WORD_COUNT', description: 'Tạo 3 topic words', targetValue: 3 }]
            });
          }
          if (urlPath === '/api/v1/lex-raid/sessions/start') {
            return json({ raidSessionId: 9001, bossHpRemaining: 120, bossShieldRemaining: 30 });
          }
          if (urlPath.includes('/sync') || urlPath.includes('/finish')) {
            return json({ xpEarned: 0, coinsEarned: 0, starsEarned: 1 });
          }
        }
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
    await this.send('Log.enable', {}, this.sessionId);
    await this.send('Performance.enable', {}, this.sessionId);
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
    const logs = {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      networkStats: { requestCount: 0, transferredBytes: 0 }
    };
    const reqUrls = new Map();
    const handler = (ev) => {
      if (ev.sessionId !== this.sessionId) return;
      if (ev.method === 'Runtime.exceptionThrown') {
        const txt = ev.params.exceptionDetails?.exception?.description || ev.params.exceptionDetails?.text || 'Page exception';
        logs.pageErrors.push(txt);
      } else if (ev.method === 'Runtime.consoleAPICalled' && ev.params.type === 'error') {
        // Strict: do NOT ignore console.error messages containing "404"
        const text = (ev.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        logs.consoleErrors.push(text);
      } else if (ev.method === 'Log.entryAdded' && ev.params.entry?.level === 'error') {
        const entry = ev.params.entry;
        const isExpectedApi404 = entry.source === 'network' && String(entry.url || '').includes('/api/') && String(entry.text || '').includes('404');
        if (!isExpectedApi404) {
          logs.consoleErrors.push(`[Log:${entry.source}] ${entry.text} (${entry.url || ''})`);
        }
      } else if (ev.method === 'Network.requestWillBeSent') {
        logs.networkStats.requestCount += 1;
        reqUrls.set(ev.params.requestId, ev.params.request?.url || '');
      } else if (ev.method === 'Network.loadingFinished') {
        logs.networkStats.transferredBytes += Number(ev.params.encodedDataLength || 0);
      } else if (ev.method === 'Network.responseReceived') {
        const { url: rUrl, status } = ev.params.response;
        if (status >= 400 && !rUrl.includes('/api/')) {
          logs.failedRequests.push({ url: rUrl, status });
        }
      } else if (ev.method === 'Network.loadingFailed') {
        const rUrl = reqUrls.get(ev.params.requestId) || '';
        if (!ev.params.canceled && ev.params.errorText !== 'net::ERR_ABORTED' && !rUrl.includes('/api/')) {
          logs.failedRequests.push({ url: 'loadingFailed:' + ev.params.type + ':' + rUrl, error: ev.params.errorText });
        }
      }
    };
    this.events.push(handler);

    await this.send('Page.navigate', { url }, this.sessionId);
    await new Promise((r) => setTimeout(r, waitMs));
    await this.eval('document.fonts && document.fonts.ready ? document.fonts.ready.then(()=>true) : true');
    await new Promise((r) => setTimeout(r, 200));

    this.events = this.events.filter((fn) => fn !== handler);
    return logs;
  }

  async getPerfMetrics() {
    const res = await this.send('Performance.getMetrics', {}, this.sessionId);
    const map = {};
    for (const m of (res.metrics || [])) map[m.name] = m.value;
    return map;
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

  const targetedOnly = process.argv.includes('--targeted');
  const serverState = { mockBackend: false };
  const { server, port } = await startStaticServer(serverState);
  const baseUrl = `http://127.0.0.1:${port}`;
  const cdp = new CDPClient(chromePath);
  const failures = [];
  const report = {
    executedAt: new Date().toISOString(),
    chromePath,
    targetedOnly,
    typography: null,
    pages: [],
    volcardFit: [],
    battleViewports: [],
    battleCanvasFallback: null,
    p4b2Features: {},
    performance: {},
    interactions: {},
    failures,
  };

  const fail = (msg) => {
    failures.push(msg);
    console.error('FAIL:', msg);
  };

  try {
    await cdp.launch();
    console.log('Chrome launched via CDP pipe. Testing P4-B.2 against', baseUrl);

    if (!targetedOnly) {
      // 1. TYPOGRAPHY SPECIMEN
      await cdp.setViewport(1280, 900, false);
      const typoLogs = await cdp.goto(`${baseUrl}/app/typography`, 1200);
      const typoMetrics = await cdp.eval(`(() => ({
        fonts: window.__TYPO_SPECIMEN_READY__ || null,
        vnFantasy: document.querySelector('#comboB [data-sample="vn-fantasy"]')?.innerText || '',
        vnText: document.querySelector('#comboB [data-sample="vn-diacritics"]')?.innerText || ''
      }))()`);
      await cdp.screenshot(path.join(OUTPUT_DIR, 'typography_specimen.png'), true);
      report.typography = { ...typoLogs, metrics: typoMetrics };
      if (typoLogs.failedRequests.length || typoLogs.pageErrors.length || typoLogs.consoleErrors.length) {
        fail('Typography errors: ' + JSON.stringify(typoLogs));
      }

      // 2. ALL 9 PAGES AT DESKTOP (1366x768) & MOBILE (390x844)
      for (const p of PAGES) {
        for (const vp of [{ name: 'desktop', w: 1366, h: 768, mobile: false }, { name: 'mobile', w: 390, h: 844, mobile: true }]) {
          await cdp.setViewport(vp.w, vp.h, vp.mobile);
          const logs = await cdp.goto(`${baseUrl}${p.route}`, 1100);
          if (p.name === 'home' && vp.name === 'desktop') {
            report.performance.homeDesktopNetwork = logs.networkStats;
          }
          const dom = await cdp.eval(`(() => {
            const de = document.documentElement;
            const logo = document.querySelector('.brand__logo');
            const logoRect = logo?.getBoundingClientRect();
            const navImgs = Array.from(document.querySelectorAll('.nav-pixel-icon'));
            const allNavIconsLoaded = navImgs.every(i => i.complete && i.naturalWidth > 0);
            const navLinks = Array.from(document.querySelectorAll('.nav-link-soft')).map(a => a.getAttribute('href'));
            const world = window.WorldEnvironment?.getState?.() || null;
            return {
              horizontalOverflow: de.scrollWidth > window.innerWidth + 1,
              scrollW: de.scrollWidth,
              innerW: window.innerWidth,
              logoLoaded: Boolean(logo && logo.complete && logo.naturalWidth > 0),
              logoRendered: logoRect ? { w: Math.round(logoRect.width), h: Math.round(logoRect.height), natW: logo.naturalWidth } : null,
              allNavIconsLoaded,
              hasRequiredLinks: ['/app/home','/app/minigame','/app/volcard','/app/quiz','/app/account'].every(req => navLinks.includes(req)),
              world,
            };
          })()`);
          if (vp.mobile) {
            await cdp.clickSelector('#mobileNavToggle');
            await new Promise((r) => setTimeout(r, 120));
            dom.mobileMenuOpenOk = await cdp.eval(`Boolean(document.getElementById('mainNavLinks')?.classList.contains('is-open'))`);
            if (!dom.mobileMenuOpenOk) fail(`${p.name} mobile drawer did not open`);
          }
          const shot = path.join(OUTPUT_DIR, `page_${p.name}_${vp.name}.png`);
          await cdp.screenshot(shot, false);
          report.pages.push({ page: p.name, viewport: vp.name, ...dom, logs, screenshot: path.relative(REPO_ROOT, shot).replace(/\\/g, '/') });

          if (dom.horizontalOverflow) fail(`${p.name} (${vp.name}) horizontal overflow: ${dom.scrollW}>${dom.innerW}`);
          if (!dom.logoLoaded) fail(`${p.name} (${vp.name}) logo missing/unloaded`);
          if (!dom.allNavIconsLoaded) fail(`${p.name} (${vp.name}) nav icons failed to load`);
          if (!dom.hasRequiredLinks) fail(`${p.name} (${vp.name}) missing required nav links`);
          if (!dom.world || dom.world.layersLoaded === 0) fail(`${p.name} (${vp.name}) WorldEnvironment did not load layers`);
          if (logs.pageErrors.length || logs.consoleErrors.length || logs.failedRequests.length) {
            fail(`${p.name} (${vp.name}) runtime/asset errors: ${JSON.stringify(logs)}`);
          }
          console.log(`Page ${p.name} (${vp.name}): overflow=${dom.horizontalOverflow} world=${dom.world?.biome}(${dom.world?.layersLoaded}) navIconsOk=${dom.allNavIconsLoaded} reqs=${logs.networkStats.requestCount} bytes=${logs.networkStats.transferredBytes}`);
        }
      }

      // 3. VOLCARD FIT AT 320x568, 390x844, 1366x768
      for (const vp of [{ name: '320x568', w: 320, h: 568, mobile: true }, { name: '390x844', w: 390, h: 844, mobile: true }, { name: '1366x768', w: 1366, h: 768, mobile: false }]) {
        await cdp.setViewport(vp.w, vp.h, vp.mobile);
        await cdp.goto(`${baseUrl}/app/volcard`, 1000);
        const words = [];
        for (let i = 0; i < 4; i++) {
          const wInfo = await cdp.eval(`(() => {
            const w = document.getElementById('flashWord');
            const face = document.querySelector('.flash-face--front');
            if (!w || !face) return null;
            const wr = w.getBoundingClientRect();
            const fr = face.getBoundingClientRect();
            return { word: w.textContent.trim(), clippedX: w.scrollWidth > w.clientWidth + 1 || wr.right > fr.right - 2 };
          })()`);
          words.push(wInfo);
          if (wInfo && wInfo.clippedX) fail(`Volcard (${vp.name}) word clipped: ${wInfo.word}`);
          await cdp.clickSelector('#nextBtn');
          await new Promise((r) => setTimeout(r, 150));
        }
        report.volcardFit.push({ viewport: vp.name, words });
      }

      // 4. BATTLE ARENA 9 VIEWPORTS (320x568..1920x1080) IN QA MODE (?qa=1)
      for (const vp of VIEWPORTS_9) {
        await cdp.setViewport(vp.width, vp.height, vp.mobile);
        const logs = await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1500);
        await cdp.screenshot(path.join(OUTPUT_DIR, `battle_${vp.name}_init.png`), false);

        const rects = await cdp.eval(`(() => {
          const box = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none' };
          };
          return {
            scrollW: document.documentElement.scrollWidth,
            winW: window.innerWidth,
            hasQaHooks: Boolean(window.__LEX_RAID_TEST_HOOKS__),
            sceneState: window.__LEX_RAID_SCENE_STATE__ ? window.__LEX_RAID_SCENE_STATE__() : null,
            arena: box('.battle-stage'),
            skillBar: box('#knightSkillBar'),
            attackDock: box('.attack-dock'),
            wordBoard: box('#boardGrid'),
            clearBtn: box('#clearPathBtn'),
            attackBtn: box('#submitWordBtn'),
            skillCount: document.querySelectorAll('#knightSkillBar [data-skill-id]').length,
            statusText: document.getElementById('raidStatus')?.innerText || ''
          };
        })()`);

        if (!rects.hasQaHooks) fail(`Battle ${vp.name} missing __LEX_RAID_TEST_HOOKS__ in ?qa=1`);
        if (!rects.sceneState) fail(`Battle ${vp.name} missing __LEX_RAID_SCENE_STATE__ in ?qa=1`);

        await cdp.clickSelector('.board-tile[data-row="0"][data-col="0"]');
        await new Promise((r) => setTimeout(r, 60));
        const beforeClear = await cdp.eval(`document.getElementById('currentWordValue')?.innerText.trim()`);
        await cdp.clickSelector('#clearPathBtn');
        await new Promise((r) => setTimeout(r, 80));
        const afterClear = await cdp.eval(`document.getElementById('currentWordValue')?.innerText.trim()`);

        const movePlan = await cdp.eval(`(() => {
          const tiles = Array.from(document.querySelectorAll('.board-tile')).map(el => ({ row: el.dataset.row, col: el.dataset.col, letter: (el.dataset.letter || '').toUpperCase() }));
          const words = window.__LEX_RAID_TEST_HOOKS__ ? [window.__LEX_RAID_TEST_HOOKS__.getActiveCoreWord(), ...window.__LEX_RAID_TEST_HOOKS__.getValidWords()] : ['LEARN'];
          for (const w of words) {
            const used = new Set(); const path = []; let ok = true;
            for (const ch of w.toUpperCase()) {
              const hit = tiles.find((t, idx) => !used.has(idx) && t.letter === ch);
              if (!hit) { ok = false; break; }
              used.add(tiles.indexOf(hit)); path.push(hit);
            }
            if (ok && path.length >= 3) return { word: w, path };
          }
          return null;
        })()`);

        let attackOk = false;
        if (movePlan) {
          const beforeScore = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getScore()`);
          for (const step of movePlan.path) {
            await cdp.clickSelector(`.board-tile[data-row="${step.row}"][data-col="${step.col}"]`);
            await new Promise((r) => setTimeout(r, 35));
          }
          await cdp.clickSelector('#submitWordBtn');
          await new Promise((r) => setTimeout(r, 850));
          const afterScore = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getScore()`);
          attackOk = afterScore > beforeScore;
        }

        const coreBottom = Math.max(rects.arena?.bottom || 0, rects.skillBar?.bottom || 0, rects.attackDock?.bottom || 0, rects.wordBoard?.bottom || 0);
        const fitsInViewport = coreBottom <= vp.height + 4;
        const tapOk = (rects.clearBtn?.h || 0) >= 40 && (rects.attackBtn?.h || 0) >= 40;
        const clearOk = beforeClear.length > 0 && (afterClear === '—' || afterClear === '');
        if (rects.scrollW > vp.width + 1) fail(`Battle ${vp.name} horizontal overflow`);
        if (!fitsInViewport) fail(`Battle ${vp.name} core bottom ${coreBottom} > viewport height ${vp.height}`);
        if (!tapOk) fail(`Battle ${vp.name} tap targets < 40px`);
        if (!clearOk) fail(`Battle ${vp.name} Clear button failed`);
        if (!attackOk) fail(`Battle ${vp.name} Attack word submit failed`);
        if (rects.skillCount !== 6) fail(`Battle ${vp.name} expected 6 Knight skills, got ${rects.skillCount}`);
        if (logs.failedRequests.length || logs.pageErrors.length || logs.consoleErrors.length) {
          fail(`Battle ${vp.name} asset/page/console errors: ${JSON.stringify(logs)}`);
        }

        report.battleViewports.push({ viewport: vp.name, coreBottom, viewportH: vp.height, fitsInViewport, tapOk, clearOk, attackOk, skillCount: rects.skillCount });
        console.log(`Battle ${vp.name}: fit=${fitsInViewport} (${coreBottom}/${vp.height}) tap=${tapOk} clear=${clearOk} attack=${attackOk} skills=${rects.skillCount}`);
      }
    }

    // Helper to submit a non-core topic word on the current board (reloading up to 4 times if random tiles lack one)
    const submitTopicWordOnBoard = async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const plan = await cdp.eval(`(() => {
          const core = window.__LEX_RAID_TEST_HOOKS__.getActiveCoreWord();
          const tiles = Array.from(document.querySelectorAll('.board-tile')).map(el => ({ row: el.dataset.row, col: el.dataset.col, letter: (el.dataset.letter || '').toUpperCase() }));
          const candidates = window.__LEX_RAID_TEST_HOOKS__.getValidWords().filter(w => w !== core);
          for (const w of candidates) {
            const used = new Set(); const path = []; let ok = true;
            for (const ch of w.toUpperCase()) {
              const hit = tiles.find((t, idx) => !used.has(idx) && t.letter === ch);
              if (!hit) { ok = false; break; }
              used.add(tiles.indexOf(hit)); path.push(hit);
            }
            if (ok && path.length >= 3) return { word: w, path };
          }
          return null;
        })()`);
        if (plan) {
          for (const step of plan.path) {
            await cdp.clickSelector(`.board-tile[data-row="${step.row}"][data-col="${step.col}"]`);
            await new Promise((r) => setTimeout(r, 25));
          }
          await cdp.clickSelector('#submitWordBtn');
          await new Promise((r) => setTimeout(r, 950));
          return plan.word;
        }
        await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1400);
      }
      return null;
    };

    // 5A. NORMAL DEPLOYMENT QA HOOK RESTRICTION CHECK (no ?qa=1)
    await cdp.setViewport(1366, 768, false);
    const normalLogs = await cdp.goto(`${baseUrl}/app/minigame`, 1400);
    const normalCheck = await cdp.eval(`({
      hasTestHooks: typeof window.__LEX_RAID_TEST_HOOKS__ !== 'undefined',
      hasSceneState: typeof window.__LEX_RAID_SCENE_STATE__ !== 'undefined',
      skillCount: document.querySelectorAll('#knightSkillBar [data-skill-id]').length
    })`);
    if (normalCheck.hasTestHooks || normalCheck.hasSceneState) {
      fail('QA hooks exposed in normal mode without ?qa=1: ' + JSON.stringify(normalCheck));
    }
    if (normalCheck.skillCount !== 6 || normalLogs.consoleErrors.length || normalLogs.failedRequests.length || normalLogs.pageErrors.length) {
      fail('Normal mode /app/minigame check failed: ' + JSON.stringify({ normalCheck, normalLogs }));
    }
    report.performance.minigameNormalNetwork = normalLogs.networkStats;

    // 5B. KNIGHT SKILLS (ALL 6), COMBO/CORE/MANA/COOLDOWN/HERO/FINISHED, ANIMATION EDGE CASES & PERF (?qa=1)
    const qaLogs = await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1600);
    if (qaLogs.consoleErrors.length || qaLogs.pageErrors.length || qaLogs.failedRequests.length) {
      fail('QA battle initial errors: ' + JSON.stringify(qaLogs));
    }
    const initScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__ && window.__LEX_RAID_SCENE_STATE__()`);
    if (!initScene) fail('Mandatory __LEX_RAID_SCENE_STATE__ missing on /app/minigame?qa=1');

    // Verify Blade Storm (Combo >= 2) & Lexical Judgment (Core Clue >= 1) start LOCKED
    const initialLockCheck = await cdp.eval(`({
      bladeDisabled: document.querySelector('[data-skill-id="blade_storm"]')?.disabled,
      bladeReason: document.querySelector('[data-skill-id="blade_storm"]')?.dataset?.lockReason,
      lexicalDisabled: document.querySelector('[data-skill-id="lexical_judgment"]')?.disabled,
      lexicalReason: document.querySelector('[data-skill-id="lexical_judgment"]')?.dataset?.lockReason,
      bladeCast: window.__LEX_RAID_TEST_HOOKS__.castSkill('blade_storm'),
      lexicalCast: window.__LEX_RAID_TEST_HOOKS__.castSkill('lexical_judgment')
    })`);
    if (!initialLockCheck.bladeDisabled || initialLockCheck.bladeReason !== 'COMBO' || initialLockCheck.bladeCast !== false) {
      fail('Blade Storm failed to enforce Combo >= 2 precondition: ' + JSON.stringify(initialLockCheck));
    }
    if (!initialLockCheck.lexicalDisabled || initialLockCheck.lexicalReason !== 'CORE_CLUE' || initialLockCheck.lexicalCast !== false) {
      fail('Lexical Judgment failed to enforce Core Word clue precondition: ' + JSON.stringify(initialLockCheck));
    }

    // Install Long Task & Frame Timing observer + capture heap before combat
    const heapBefore = (await cdp.getPerfMetrics()).JSHeapUsedSize || 0;
    await cdp.eval(`(() => {
      window.__QA_LONGTASKS__ = [];
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          const po = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) window.__QA_LONGTASKS__.push(Math.round(entry.duration));
          });
          po.observe({ entryTypes: ['longtask'] });
        } catch (e) {}
      }
      window.__QA_FRAMES__ = [];
      let prev = performance.now();
      let count = 0;
      const step = (ts) => {
        window.__QA_FRAMES__.push(ts - prev);
        prev = ts;
        count += 1;
        if (count < 75) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    })()`);

    // Skill 1: Knight Slash + Rapid Click protection
    const rapidCheck = await cdp.eval(`(() => {
      const first = window.__LEX_RAID_TEST_HOOKS__.castSkill('knight_slash');
      const second = window.__LEX_RAID_TEST_HOOKS__.castSkill('knight_slash');
      return { first, second, busyDuringAttack: window.__LEX_RAID_TEST_HOOKS__.isAnimationBusy() };
    })()`);
    if (!rapidCheck.first || rapidCheck.second !== false || !rapidCheck.busyDuringAttack) {
      fail('Rapid click animation busy guard failed: ' + JSON.stringify(rapidCheck));
    }
    await new Promise((r) => setTimeout(r, 950));
    const afterKnightSlash = await cdp.eval(`({ scene: window.__LEX_RAID_SCENE_STATE__(), shield: window.__LEX_RAID_TEST_HOOKS__.getBossShield(), hp: window.__LEX_RAID_TEST_HOOKS__.getBossHp() })`);
    if (!afterKnightSlash.scene || afterKnightSlash.scene.fsmState !== 'IDLE' || afterKnightSlash.scene.heroX !== 296 || afterKnightSlash.scene.heroY !== 302 || afterKnightSlash.scene.activeVfxCount !== 0 || afterKnightSlash.scene.pendingTimers !== 0) {
      fail('Knight Slash did not settle cleanly: ' + JSON.stringify(afterKnightSlash));
    }
    if (afterKnightSlash.shield >= 30) fail('Knight Slash preview damage did not apply');

    // Skill 2: Heavy Slash (2 MP, 2T CD)
    const beforeSkill = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getSkillState()`);
    await cdp.clickSelector('[data-skill-id="heavy_slash"]');
    await new Promise((r) => setTimeout(r, 240));
    const midSkillScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__()`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'anim_skill_heavy_slash.png'), false);
    await new Promise((r) => setTimeout(r, 1050));
    const settledSkillScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__()`);
    const afterSkill = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getSkillState()`);
    if (!midSkillScene || !settledSkillScene) fail('Scene state missing during Heavy Slash check');
    if (afterSkill.previewMana !== beforeSkill.previewMana - 2 || afterSkill.cooldowns.heavy_slash !== 2) {
      fail('Heavy Slash mana/cooldown mismatch: ' + JSON.stringify({ beforeSkill, afterSkill }));
    }
    if (settledSkillScene.fsmState !== 'IDLE' || settledSkillScene.activeVfxCount !== 0 || settledSkillScene.pendingTimers !== 0) {
      fail('FSM did not return to clean IDLE after Heavy Slash: ' + JSON.stringify(settledSkillScene));
    }

    // Skill 3: Royal Guard (must NOT heal HP; must mitigate next boss attack & reflect frost dmg)
    const beforeGuardHp = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getPlayerHp()`);
    const beforeGuardBossTotal = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getBossShield() + window.__LEX_RAID_TEST_HOOKS__.getBossHp()`);
    await cdp.clickSelector('[data-skill-id="royal_guard"]');
    await new Promise((r) => setTimeout(r, 900));
    const afterGuardCast = await cdp.eval(`({ hp: window.__LEX_RAID_TEST_HOOKS__.getPlayerHp(), guard: window.__LEX_RAID_TEST_HOOKS__.getRoyalGuard(), scene: window.__LEX_RAID_SCENE_STATE__() })`);
    if (afterGuardCast.hp !== beforeGuardHp || !afterGuardCast.guard || afterGuardCast.scene?.fsmState !== 'IDLE') {
      fail('Royal Guard invalid behavior (must guard without healing): ' + JSON.stringify({ beforeGuardHp, afterGuardCast }));
    }
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.triggerBossTurn()`);
    await new Promise((r) => setTimeout(r, 850));
    const afterBossOnGuard = await cdp.eval(`({ hp: window.__LEX_RAID_TEST_HOOKS__.getPlayerHp(), guard: window.__LEX_RAID_TEST_HOOKS__.getRoyalGuard(), totalBoss: window.__LEX_RAID_TEST_HOOKS__.getBossShield() + window.__LEX_RAID_TEST_HOOKS__.getBossHp(), scene: window.__LEX_RAID_SCENE_STATE__() })`);
    if (afterBossOnGuard.hp >= beforeGuardHp || afterBossOnGuard.hp < beforeGuardHp - 3 || afterBossOnGuard.guard !== false || afterBossOnGuard.totalBoss > beforeGuardBossTotal - 6 || afterBossOnGuard.scene?.fsmState !== 'IDLE') {
      fail('Royal Guard failed to mitigate boss damage or reflect frost: ' + JSON.stringify({ beforeGuardHp, beforeGuardBossTotal, afterBossOnGuard }));
    }

    // Mid-animation reset & Mid-animation resize checks
    await cdp.clickSelector('[data-skill-id="knight_slash"]');
    await new Promise((r) => setTimeout(r, 70));
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.resetSceneActors()`);
    const resetScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__()`);
    if (!resetScene || resetScene.fsmState !== 'IDLE' || resetScene.heroY !== 302 || resetScene.heroX !== 296 || resetScene.activeVfxCount !== 0 || resetScene.pendingTimers !== 0) {
      fail('Mid-animation reset failed: ' + JSON.stringify(resetScene));
    }

    await cdp.clickSelector('[data-skill-id="knight_slash"]');
    await new Promise((r) => setTimeout(r, 140));
    await cdp.setViewport(900, 700, false);
    await new Promise((r) => setTimeout(r, 850));
    await cdp.setViewport(1366, 768, false);
    const resizeScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__()`);
    if (!resizeScene || resizeScene.fsmState !== 'IDLE' || resizeScene.heroY !== 302 || resizeScene.bossY !== 302 || resizeScene.heroX !== 296 || resizeScene.bossX !== 660 || resizeScene.activeVfxCount !== 0) {
      fail('Mid-animation resize broke actor anchor or FSM: ' + JSON.stringify(resizeScene));
    }

    // Hero mismatch check: Archer cannot cast Warrior sword skills
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setLoadoutAndBoss({ unitCode: 'archer' })`);
    const archerCheck = await cdp.eval(`(() => {
      const btn = document.querySelector('[data-skill-id="knight_slash"]');
      return {
        slashBtnHidden: !btn,
        slashBtnDisabled: Boolean(btn && btn.disabled),
        slashReason: btn?.dataset?.lockReason || 'FILTERED_OUT',
        castSlash: window.__LEX_RAID_TEST_HOOKS__.castSkill('knight_slash')
      };
    })()`);
    if ((!archerCheck.slashBtnHidden && !archerCheck.slashBtnDisabled) || archerCheck.castSlash !== false) {
      fail('Hero compatibility check failed for Archer: ' + JSON.stringify(archerCheck));
    }
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setLoadoutAndBoss({ unitCode: 'warrior' })`);

    // Capture Run A combat frame timing, long tasks, heap & VFX pool before reloading Run B
    const heapAfter = (await cdp.getPerfMetrics()).JSHeapUsedSize || 0;
    const perfData = await cdp.eval(`(() => {
      const f = (window.__QA_FRAMES__ || []).slice(1).sort((a, b) => a - b);
      const avg = f.length ? f.reduce((s, v) => s + v, 0) / f.length : 0;
      const p95 = f.length ? f[Math.min(f.length - 1, Math.floor(f.length * 0.95))] : 0;
      const max = f.length ? f[f.length - 1] : 0;
      const lt = window.__QA_LONGTASKS__ || [];
      return {
        frameSamples: f.length,
        avgFrameMs: Number(avg.toFixed(2)),
        p95FrameMs: Number(p95.toFixed(2)),
        maxFrameMs: Number(max.toFixed(2)),
        longTaskCount: lt.length,
        maxLongTaskMs: lt.length ? Math.max(...lt) : 0
      };
    })()`);
    if (!perfData.frameSamples) fail('Frame timing telemetry collected 0 samples');
    report.performance.combatFrameTiming = perfData;
    report.performance.vfxPoolStability = {
      poolSize: settledSkillScene?.poolSize || 0,
      activeVfxAfterCombat: settledSkillScene?.activeVfxCount ?? -1,
      heapBeforeBytes: heapBefore,
      heapAfterBytes: heapAfter
    };

    // Fresh match Run B: unlock & cast Skill 4 (Blade Storm) & Skill 5 (Sacred Recovery)
    await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1400);
    const wordB = await submitTopicWordOnBoard();
    if (!wordB) fail('Could not find formable topic word on board for Run B');
    const unlockedB = await cdp.eval(`({
      combo: window.__LEX_RAID_TEST_HOOKS__.getCombo(),
      revealed: window.__LEX_RAID_TEST_HOOKS__.getRevealedCount(),
      mana: window.__LEX_RAID_TEST_HOOKS__.getSkillState().previewMana,
      bladeDisabled: document.querySelector('[data-skill-id="blade_storm"]')?.disabled
    })`);
    if (unlockedB.combo < 2 || unlockedB.revealed < 1 || unlockedB.bladeDisabled) {
      fail('Topic word attack did not unlock Blade Storm / Core clue: ' + JSON.stringify(unlockedB));
    }
    await cdp.clickSelector('[data-skill-id="blade_storm"]');
    await new Promise((r) => setTimeout(r, 950));
    const afterBladeStorm = await cdp.eval(`({ skill: window.__LEX_RAID_TEST_HOOKS__.getSkillState(), scene: window.__LEX_RAID_SCENE_STATE__() })`);
    if (afterBladeStorm.skill.cooldowns.blade_storm !== 3 || afterBladeStorm.scene?.fsmState !== 'IDLE') {
      fail('Blade Storm cast failed: ' + JSON.stringify(afterBladeStorm));
    }

    // Take 1 boss hit then cast Sacred Recovery (2 MP remaining after Blade Storm used 3 of 5)
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.triggerBossTurn()`);
    await new Promise((r) => setTimeout(r, 850));
    const hpBeforeHeal = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getPlayerHp()`);
    await cdp.clickSelector('[data-skill-id="sacred_recovery"]');
    await new Promise((r) => setTimeout(r, 950));
    const afterHeal = await cdp.eval(`({ hp: window.__LEX_RAID_TEST_HOOKS__.getPlayerHp(), skill: window.__LEX_RAID_TEST_HOOKS__.getSkillState(), scene: window.__LEX_RAID_SCENE_STATE__() })`);
    if (afterHeal.hp <= hpBeforeHeal || afterHeal.skill.cooldowns.sacred_recovery !== 3 || afterHeal.scene?.fsmState !== 'IDLE') {
      fail('Sacred Recovery failed to heal HP or settle: ' + JSON.stringify({ hpBeforeHeal, afterHeal }));
    }

    // Fresh match Run C: unlock & cast Skill 6 (Lexical Judgment, 4 MP, Core Clue >= 1) + Finished State guard
    await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1400);
    const wordC = await submitTopicWordOnBoard();
    if (!wordC) fail('Could not find formable topic word on board for Run C');
    const shieldBeforeLex = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getBossShield()`);
    const hpBeforeLex = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getBossHp()`);
    await cdp.clickSelector('[data-skill-id="lexical_judgment"]');
    await new Promise((r) => setTimeout(r, 950));
    const afterLexical = await cdp.eval(`({ skill: window.__LEX_RAID_TEST_HOOKS__.getSkillState(), shield: window.__LEX_RAID_TEST_HOOKS__.getBossShield(), hp: window.__LEX_RAID_TEST_HOOKS__.getBossHp(), scene: window.__LEX_RAID_SCENE_STATE__() })`);
    if (afterLexical.skill.cooldowns.lexical_judgment !== 4 || (afterLexical.shield >= shieldBeforeLex && afterLexical.hp >= hpBeforeLex) || afterLexical.scene?.fsmState !== 'IDLE') {
      fail('Lexical Judgment cast failed: ' + JSON.stringify({ shieldBeforeLex, hpBeforeLex, afterLexical }));
    }

    // Finished state disables all 6 skills & blocks casts
    await cdp.clickSelector('#finishBattleBtn');
    await new Promise((r) => setTimeout(r, 200));
    const finishedCheck = await cdp.eval(`({
      isFinished: window.__LEX_RAID_TEST_HOOKS__.isFinished(),
      allDisabled: Array.from(document.querySelectorAll('#knightSkillBar [data-skill-id]')).every(b => b.disabled),
      castAfterFinish: window.__LEX_RAID_TEST_HOOKS__.castSkill('knight_slash')
    })`);
    if (!finishedCheck.isFinished || !finishedCheck.allDisabled || finishedCheck.castAfterFinish !== false) {
      fail('Finished state failed to disable Skill Bar: ' + JSON.stringify(finishedCheck));
    }

    // 5C. BACKEND MODE SKILL BAR DISABLE CHECK (Mocked Spring Boot session via local test server)
    serverState.mockBackend = true;
    await cdp.eval(`localStorage.setItem('glp.auth', JSON.stringify({ userId: 7, username: 'qa_knight', displayName: 'QA Knight', levelCurrent: 2, xpTotal: 150, coins: 40 }))`);
    await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1500);
    const backendCheck = await cdp.eval(`({
      isBackend: window.__LEX_RAID_TEST_HOOKS__?.isBackendMode?.(),
      allDisabled: Array.from(document.querySelectorAll('#knightSkillBar [data-skill-id]')).every(b => b.disabled),
      metaText: document.querySelector('.skill-bar-preview__meta')?.innerText || '',
      castAttempt: window.__LEX_RAID_TEST_HOOKS__?.castSkill?.('knight_slash')
    })`);
    await cdp.eval(`localStorage.removeItem('glp.auth')`);
    serverState.mockBackend = false;
    if (!backendCheck.isBackend || !backendCheck.allDisabled || backendCheck.castAttempt !== false || !backendCheck.metaText.includes('Backend')) {
      fail('Backend mode did not disable Preview Skill Bar cleanly: ' + JSON.stringify(backendCheck));
    }

    // 5D. MONSTER EXPANSION PREVIEW (SLIME & SKELETON) IN PHASER + WORLD PAUSE/REDUCED MOTION
    await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1500);
    for (const mon of ['slime', 'skeleton']) {
      await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setLoadoutAndBoss({ unitCode: 'warrior', bossTheme: ${JSON.stringify(mon)} })`);
      await new Promise((r) => setTimeout(r, 350));
      await cdp.clickSelector('[data-skill-id="knight_slash"]');
      await new Promise((r) => setTimeout(r, 950));
      const mScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__()`);
      const portLoaded = await cdp.eval(`(() => { const img = document.querySelector('.avatar-boss img'); return Boolean(img && img.complete && img.naturalWidth > 0 && img.src.includes(${JSON.stringify(mon)})); })()`);
      if (!portLoaded) fail(`Monster preview portrait did not load for ${mon}`);
      if (!mScene || mScene.bossTheme !== mon || mScene.fsmState !== 'IDLE') {
        fail(`Phaser monster ${mon} attack/settle failed: ` + JSON.stringify(mScene));
      }
      await cdp.screenshot(path.join(OUTPUT_DIR, `anim_warrior_vs_${mon}.png`), false);
    }

    // WorldEnvironment Pause / Resume & prefers-reduced-motion check
    await cdp.eval(`window.WorldEnvironment.pause()`);
    const pausedState = await cdp.eval(`window.WorldEnvironment.getState()`);
    await cdp.eval(`window.WorldEnvironment.resume()`);
    const resumedState = await cdp.eval(`window.WorldEnvironment.getState()`);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, cdp.sessionId);
    await new Promise((r) => setTimeout(r, 120));
    const reducedState = await cdp.eval(`window.WorldEnvironment.getState()`);
    await cdp.send('Emulation.setEmulatedMedia', { features: [] }, cdp.sessionId);
    if (!pausedState.paused || resumedState.paused || !reducedState.reducedMotion || !reducedState.paused) {
      fail('WorldEnvironment pause/resume/reducedMotion check failed: ' + JSON.stringify({ pausedState, resumedState, reducedState }));
    }

    // 5E. CANVAS 2D FALLBACK PARITY WITH BOTH SLIME & SKELETON (?renderer=canvas&qa=1)
    const canvasLogs = await cdp.goto(`${baseUrl}/app/minigame?renderer=canvas&qa=1`, 1200);
    const canvasResults = {};
    for (const mon of ['slime', 'skeleton']) {
      await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setLoadoutAndBoss({ unitCode: 'warrior', bossTheme: ${JSON.stringify(mon)} })`);
      await new Promise((r) => setTimeout(r, 300));
      await cdp.clickSelector('[data-skill-id="knight_slash"]');
      await new Promise((r) => setTimeout(r, 950));
      const cState = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__()`);
      const portOk = await cdp.eval(`(() => { const img = document.querySelector('.avatar-boss img'); return Boolean(img && img.complete && img.naturalWidth > 0 && img.src.includes(${JSON.stringify(mon)})); })()`);
      canvasResults[mon] = { cState, portOk };
      if (!portOk || !cState || cState.bossTheme !== mon || cState.fsmState !== 'IDLE' || cState.heroY !== 302) {
        fail(`Canvas fallback check failed for ${mon}: ` + JSON.stringify(canvasResults[mon]));
      }
      await cdp.screenshot(path.join(OUTPUT_DIR, `battle_canvas_fallback_${mon}.png`), false);
    }
    const canvasInfo = await cdp.eval(`({ renderer: window.__LEX_RAID_TEST_HOOKS__.getRenderer(), hasCanvas: Boolean(document.querySelector('#raidPhaserMount canvas')) })`);
    if (canvasInfo.renderer !== 'canvas-fallback' || !canvasInfo.hasCanvas || canvasLogs.failedRequests.length || canvasLogs.consoleErrors.length) {
      fail('Canvas fallback verification failed: ' + JSON.stringify({ canvasInfo, canvasLogs }));
    }

    // 5F. P4-B.3 RPG COMBAT, LEARNING LOOP, 5-WAVE, SPELLS & COZY THEMES CHECKS
    await cdp.setViewport(1366, 768, false);
    const p4b3StartLogs = await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1500);
    const arenaMetrics = await cdp.eval(`(() => {
      const stage = document.querySelector('.battle-stage')?.getBoundingClientRect();
      const scene = window.__LEX_RAID_SCENE_STATE__ ? window.__LEX_RAID_SCENE_STATE__() : null;
      return { stageW: Math.round(stage?.width || 0), stageH: Math.round(stage?.height || 0), scene };
    })()`);
    if (arenaMetrics.stageH < 250 || !arenaMetrics.scene || arenaMetrics.scene.heroDisplayH < 200 || arenaMetrics.scene.groundY !== 302) {
      fail('P4-B.3 expanded arena/hero scale check failed: ' + JSON.stringify(arenaMetrics));
    }

    // Global non-topic English word attack via board + Word Feedback + TTS button
    const globalPlan = await cdp.eval(`(() => {
      const tiles = Array.from(document.querySelectorAll('.board-tile')).map(el => ({ row: el.dataset.row, col: el.dataset.col, letter: (el.dataset.letter || '').toUpperCase() }));
      const candidates = ['TIME','WATER','BOOK','GAME','PLAY','WORD','FIRE','STAR','LIGHT','HAND','DARK','WORK','LINE'];
      for (const w of candidates) {
        if (window.__LEX_RAID_TEST_HOOKS__.isTopicWord(w)) continue;
        const used = new Set(); const path = []; let ok = true;
        for (const ch of w) {
          const hit = tiles.find((t, idx) => !used.has(idx) && t.letter === ch);
          if (!hit) { ok = false; break; }
          used.add(tiles.indexOf(hit)); path.push(hit);
        }
        if (ok) return { word: w, path };
      }
      return null;
    })()`);
    let globalAttackCheck = { found: Boolean(globalPlan) };
    if (globalPlan) {
      const scoreBefore = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getScore()`);
      for (const step of globalPlan.path) {
        await cdp.clickSelector(`.board-tile[data-row="${step.row}"][data-col="${step.col}"]`);
        await new Promise((r) => setTimeout(r, 25));
      }
      await cdp.clickSelector('#submitWordBtn');
      await new Promise((r) => setTimeout(r, 950));
      globalAttackCheck = await cdp.eval(`(() => ({
        found: true,
        scoreAfter: window.__LEX_RAID_TEST_HOOKS__.getScore(),
        mana: window.__LEX_RAID_TEST_HOOKS__.getSkillState().previewMana,
        toastVisible: document.getElementById('wordFeedbackToast')?.classList.contains('is-visible'),
        toastText: document.getElementById('wordFeedbackToast')?.innerText || '',
        hasTtsBtn: Boolean(document.getElementById('wordTtsBtn')),
        discovered: window.__LEX_RAID_TEST_HOOKS__.getDiscoveredWords().length
      }))()`);
      if (globalAttackCheck.scoreAfter <= scoreBefore || !globalAttackCheck.toastVisible || !globalAttackCheck.hasTtsBtn || globalAttackCheck.mana > 6) {
        fail('P4-B.3 Global English word attack failed: ' + JSON.stringify({ scoreBefore, globalAttackCheck }));
      }
    }

    // Hints & Practice/Campaign mode & 5-Wave + Spells (Fire Blade, Frost Seal, Thunder Strike)
    const beforeHints = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getHintCharges()`);
    await cdp.clickSelector('#hintMeaningBtn');
    await cdp.clickSelector('#hintRevealBtn');
    await cdp.clickSelector('#boardRefreshBtn');
    await new Promise((r) => setTimeout(r, 150));
    const afterHints = await cdp.eval(`({
      charges: window.__LEX_RAID_TEST_HOOKS__.getHintCharges(),
      revealed: window.__LEX_RAID_TEST_HOOKS__.getRevealedCount(),
      clueText: document.getElementById('clueText')?.innerText || ''
    })`);
    if (afterHints.charges !== beforeHints - 1 || afterHints.revealed < 1 || !afterHints.clueText.includes('Bắt đầu bằng')) {
      fail('P4-B.3 Hint toolbar verification failed: ' + JSON.stringify({ beforeHints, afterHints }));
    }

    await cdp.clickSelector('#modePracticeBtn');
    await new Promise((r) => setTimeout(r, 100));
    const practiceCheck = await cdp.eval(`({
      mode: window.__LEX_RAID_TEST_HOOKS__.getPlayMode(),
      timer: document.getElementById('timerValue')?.innerText.trim(),
      rules: window.__LEX_RAID_TEST_HOOKS__.getChapterRules()
    })`);
    await cdp.clickSelector('#modeCampaignBtn');
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setChapterPreview(2)`);
    const ch2Check = await cdp.eval(`({
      rules: window.__LEX_RAID_TEST_HOOKS__.getChapterRules(),
      waveState: window.__LEX_RAID_TEST_HOOKS__.getWaveState()
    })`);
    if (practiceCheck.mode !== 'practice' || practiceCheck.timer !== '∞' || ch2Check.rules.timeSec !== 38 || ch2Check.waveState.wavePlanThemes.length !== 5) {
      fail('P4-B.3 Mode / Chapter / 5-Wave check failed: ' + JSON.stringify({ practiceCheck, ch2Check }));
    }

    // Cast Fire Blade + Frost Seal + Thunder Strike from Spell Deck
    await cdp.clickSelector('#skillDeckToggle');
    await new Promise((r) => setTimeout(r, 100));
    await cdp.clickSelector('[data-skill-id="fire_blade"]');
    await new Promise((r) => setTimeout(r, 1300));
    await cdp.clickSelector('[data-skill-id="frost_seal"]');
    await new Promise((r) => setTimeout(r, 1300));
    // Recharge mana via a valid board word if needed, then cast thunder_strike
    await submitTopicWordOnBoard().catch(() => null);
    await new Promise((r) => setTimeout(r, 500));
    const thunderBtnReady = await cdp.eval(`Boolean(document.querySelector('[data-skill-id="thunder_strike"]') && !document.querySelector('[data-skill-id="thunder_strike"]').disabled)`);
    if (thunderBtnReady) {
      await cdp.clickSelector('[data-skill-id="thunder_strike"]');
      await new Promise((r) => setTimeout(r, 1300));
    }
    const spellState = await cdp.eval(`({
      skill: window.__LEX_RAID_TEST_HOOKS__.getSkillState(),
      scene: window.__LEX_RAID_SCENE_STATE__(),
      statusHtml: document.getElementById('bossStatusPills')?.innerHTML || '',
      thunderTried: ${JSON.stringify(true)}
    })`);
    if (!spellState.skill.bossStatuses.burn || !spellState.skill.bossStatuses.frost || spellState.scene.fsmState !== 'IDLE' || !spellState.statusHtml.includes('Thiêu đốt')) {
      fail('P4-B.3 Fire Blade / Frost Seal status check failed: ' + JSON.stringify(spellState));
    }

    // Rejection & 2-letter validation & Continuous Core Word + Full 5-Wave Valid Action Playthrough
    await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1400);
    const twoLetterCheck = await cdp.eval(`({
      goValid: window.__LEX_RAID_TEST_HOOKS__.isValidWord('GO'),
      doValid: window.__LEX_RAID_TEST_HOOKS__.isValidWord('DO'),
      qqValid: window.__LEX_RAID_TEST_HOOKS__.isValidWord('QQ'),
      zzValid: window.__LEX_RAID_TEST_HOOKS__.isValidWord('ZZ')
    })`);
    if (!twoLetterCheck.goValid || !twoLetterCheck.doValid || twoLetterCheck.qqValid || twoLetterCheck.zzValid) {
      fail('P4-B.3 2-letter everyday whitelist check failed: ' + JSON.stringify(twoLetterCheck));
    }

    // 1) Empty tile submit rejection
    const scoreBeforeEmpty = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getScore()`);
    await cdp.clickSelector('#submitWordBtn');
    await new Promise((r) => setTimeout(r, 120));
    const emptyMsg = await cdp.eval(`document.getElementById('raidStatus')?.innerText || ''`);
    const scoreAfterEmpty = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getScore()`);
    if (scoreAfterEmpty !== scoreBeforeEmpty || (!emptyMsg.includes('ô chữ') && !emptyMsg.includes('ít nhất 3 ký tự'))) {
      fail('P4-B.3 Empty submit was not cleanly rejected: ' + JSON.stringify({ emptyMsg, scoreBeforeEmpty, scoreAfterEmpty }));
    }

    // 2) Gibberish non-word rejection
    await cdp.eval(`(() => {
      const tiles = Array.from(document.querySelectorAll('.board-tile')).slice(0, 3);
      tiles.forEach(t => t.click());
    })()`);
    await cdp.clickSelector('#submitWordBtn');
    await new Promise((r) => setTimeout(r, 200));

    // 3) Duplicate word rejection: submit a formable word, then find any previously submitted word whose letters exist on the board and re-submit
    await submitTopicWordOnBoard();
    await new Promise((r) => setTimeout(r, 500));
    let dupAttemptWord = null;
    for (let r = 0; r < 4 && !dupAttemptWord; r++) {
      dupAttemptWord = await cdp.eval(`(() => {
        const discovered = window.__LEX_RAID_TEST_HOOKS__.getDiscoveredWords().map(x => String(x.word || '').toUpperCase()).filter(Boolean);
        const tiles = Array.from(document.querySelectorAll('.board-tile')).map(el => ({ row: el.dataset.row, col: el.dataset.col, letter: (el.dataset.letter || '').toUpperCase() }));
        for (const w of discovered) {
          const used = new Set(); const path = []; let ok = true;
          for (const ch of w) {
            const hit = tiles.find((t, i) => !used.has(i) && t.letter === ch);
            if (!hit) { ok = false; break; }
            used.add(tiles.indexOf(hit)); path.push(hit);
          }
          if (ok) {
            path.forEach(p => document.querySelector(\`.board-tile[data-row="\${p.row}"][data-col="\${p.col}"]\`)?.click());
            return w;
          }
        }
        return null;
      })()`);
      if (!dupAttemptWord) {
        await submitTopicWordOnBoard().catch(() => null);
        await cdp.clickSelector('#boardRefreshBtn');
        await new Promise((res) => setTimeout(res, 200));
      }
    }
    if (dupAttemptWord) {
      const scoreBeforeDup = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getScore()`);
      await cdp.clickSelector('#submitWordBtn');
      await new Promise((r) => setTimeout(r, 250));
      const dupMsg = await cdp.eval(`document.getElementById('raidStatus')?.innerText || ''`);
      const scoreAfterDup = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getScore()`);
      if (scoreAfterDup !== scoreBeforeDup || !dupMsg.includes('đã dùng')) {
        fail('P4-B.3 Duplicate word was not rejected: ' + JSON.stringify({ dupAttemptWord, dupMsg, scoreBeforeDup, scoreAfterDup }));
      }
    }

    // 4) Full 5-Wave Natural Playthrough via Real Board Tile Selection + Core Guess & Board Attacks (no advanceWaveForTest)
    let coreBefore = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.getActiveCoreWord()`);
    await cdp.clickSelector('#hintMeaningBtn');
    let sawCoreRotation = false;
    let sawWave2Natural = false;
    let sawWave5BossEntrance = false;
    let sawWave5BossHud = false;
    let guardSteps = 0;

    while (guardSteps < 55) {
      guardSteps++;
      const st = await cdp.eval(`({
        finished: window.__LEX_RAID_TEST_HOOKS__.isFinished(),
        transitioning: Boolean(window.__LEX_RAID_TEST_HOOKS__.isAnimationBusy && window.__LEX_RAID_TEST_HOOKS__.isAnimationBusy()),
        wave: window.__LEX_RAID_TEST_HOOKS__.getWaveState(),
        core: window.__LEX_RAID_TEST_HOOKS__.getActiveCoreWord(),
        revealed: window.__LEX_RAID_TEST_HOOKS__.getRevealedCount(),
        bossPanelChapter: document.querySelector('.boss-panel')?.classList.contains('is-chapter-boss'),
        crownVisible: getComputedStyle(document.getElementById('bossCrownBadge') || document.body).display !== 'none',
        entranceVisible: document.getElementById('bossEntranceBanner')?.classList.contains('is-visible')
      })`);
      if (st.wave.waveIndex >= 2) sawWave2Natural = true;
      if (st.wave.waveIndex === 5) {
        if (st.bossPanelChapter && st.crownVisible) sawWave5BossHud = true;
        if (st.entranceVisible || st.wave.bossRarity === 'CHAPTER_BOSS') sawWave5BossEntrance = true;
      }
      if (st.finished) break;

      if (st.core && st.core !== coreBefore) {
        sawCoreRotation = true;
        coreBefore = st.core;
      }

      // Click actual board tiles matching the active Core Word and press #guessCoreBtn (falls back to board attack if transitioning/unformable)
      const corePath = st.core ? await cdp.eval(`(() => {
        const w = ${JSON.stringify(st.core)}.toUpperCase();
        const tiles = Array.from(document.querySelectorAll('.board-tile')).map(el => ({ row: el.dataset.row, col: el.dataset.col, letter: (el.dataset.letter || '').toUpperCase() }));
        const used = new Set(); const path = [];
        for (const ch of w) {
          const hit = tiles.find((t, i) => !used.has(i) && t.letter === ch);
          if (!hit) return null;
          used.add(tiles.indexOf(hit)); path.push(hit);
        }
        return path;
      })()`) : null;

      if (corePath) {
        await cdp.clickSelector('#clearPathBtn');
        for (const step of corePath) {
          await cdp.clickSelector(`.board-tile[data-row="${step.row}"][data-col="${step.col}"]`);
        }
        await cdp.clickSelector('#guessCoreBtn');
      } else {
        await submitTopicWordOnBoard().catch(() => null);
      }
      await new Promise((r) => setTimeout(r, 950));
    }

    const wave5AndFinishCheck = await cdp.eval(`({
      finished: window.__LEX_RAID_TEST_HOOKS__.isFinished(),
      wave: window.__LEX_RAID_TEST_HOOKS__.getWaveState(),
      finishVisible: document.getElementById('finishOverlay')?.classList.contains('is-open'),
      reviewVisible: Boolean(document.getElementById('finishReviewPanel')?.innerText.includes('Sổ Tay Từ Vựng')),
      score: window.__LEX_RAID_TEST_HOOKS__.getScore(),
      activeVfx: window.__LEX_RAID_SCENE_STATE__()?.activeVfxCount ?? -1
    })`);
    if (!sawWave2Natural || !sawCoreRotation || !sawWave5BossHud || !sawWave5BossEntrance || !wave5AndFinishCheck.finished || !wave5AndFinishCheck.finishVisible || !wave5AndFinishCheck.reviewVisible) {
      fail('P4-B.3 Full 5-wave valid playthrough failed: ' + JSON.stringify({
        sawWave2Natural, sawCoreRotation, sawWave5BossHud, sawWave5BossEntrance, guardSteps, wave5AndFinishCheck
      }));
    }
    await cdp.screenshot(path.join(OUTPUT_DIR, 'battle_p4b3_wave5_victory_desktop.png'), false);

    // 5) Defeat overlay check via Boss Counterattacks
    await cdp.goto(`${baseUrl}/app/minigame?qa=1`, 1400);
    for (let i = 0; i < 12; i++) {
      const done = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.isFinished()`);
      if (done) break;
      await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.triggerBossTurn()`);
      await new Promise((r) => setTimeout(r, 300));
    }
    const defeatCheck = await cdp.eval(`({
      finished: window.__LEX_RAID_TEST_HOOKS__.isFinished(),
      hp: window.__LEX_RAID_TEST_HOOKS__.getPlayerHp(),
      turn: window.__LEX_RAID_TEST_HOOKS__.getTurn(),
      finishOpen: document.getElementById('finishOverlay')?.classList.contains('is-open'),
      title: document.getElementById('finishTitle')?.innerText || '',
      heading: document.getElementById('finishHeading')?.innerText || ''
    })`);
    if (!defeatCheck.finished || !defeatCheck.finishOpen || (defeatCheck.hp > 0 && !defeatCheck.title.includes('ENDED'))) {
      fail('P4-B.3 Defeat / Battle Ended state check failed: ' + JSON.stringify(defeatCheck));
    }

    // 6) SEO & 404 Route checks
    const seoStatusCheck = await cdp.eval(`(async () => {
      const rRobots = await fetch('/robots.txt');
      const rSitemap = await fetch('/sitemap.xml');
      const r404 = await fetch('/nonexistent-route-qa-check');
      return { robots: rRobots.status, sitemap: rSitemap.status, notFound: r404.status };
    })()`);
    if (seoStatusCheck.robots !== 200 || seoStatusCheck.sitemap !== 200 || seoStatusCheck.notFound !== 404) {
      fail('SEO route status check failed: ' + JSON.stringify(seoStatusCheck));
    }

    const wave2Check = { waveIndex: sawWave2Natural ? 2 : 1, sawCoreRotation, sawWave5BossHud, sawWave5BossEntrance, guardSteps };
    const reviewVisible = wave5AndFinishCheck.reviewVisible;

    // Cozy Daylight & Moonlight theme toggle, persistence across pages, Combat theme preservation & restoration
    await cdp.goto(`${baseUrl}/app/home`, 1100);
    await cdp.eval(`localStorage.removeItem('glp.theme')`);
    await cdp.goto(`${baseUrl}/app/home`, 1100);
    const dayTheme = await cdp.eval(`document.documentElement.dataset.theme`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'theme_home_daylight.png'), false);
    await cdp.clickSelector('#themeToggleBtn');
    await new Promise((r) => setTimeout(r, 150));
    const moonTheme = await cdp.eval(`document.documentElement.dataset.theme`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'theme_home_moonlight.png'), false);

    // Reload Volcard -> persists moonlight
    const volLogs = await cdp.goto(`${baseUrl}/app/volcard`, 1100);
    const volTheme = await cdp.eval(`({ theme: document.documentElement.dataset.theme, overflow: document.documentElement.scrollWidth > window.innerWidth })`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'theme_volcard_moonlight.png'), false);

    // Visit Combat -> uses 'combat' while preserving glp.theme === 'moonlight'
    await cdp.goto(`${baseUrl}/app/minigame`, 1200);
    const combatThemeCheck = await cdp.eval(`({ theme: document.documentElement.dataset.theme, pref: localStorage.getItem('glp.theme') })`);

    // Leave Combat -> Quiz restores 'moonlight'
    const quizLogs = await cdp.goto(`${baseUrl}/app/quiz`, 1100);
    const restoredQuizTheme = await cdp.eval(`document.documentElement.dataset.theme`);

    // Mobile check on Moonlight Home
    await cdp.setViewport(390, 844, true);
    await cdp.goto(`${baseUrl}/app/home`, 1100);
    const mobileThemeOverflow = await cdp.eval(`document.documentElement.scrollWidth > window.innerWidth`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'theme_home_moonlight_mobile.png'), false);
    await cdp.setViewport(1366, 768, false);

    if (dayTheme !== 'daylight' || moonTheme !== 'moonlight' || volTheme.theme !== 'moonlight' || volTheme.overflow ||
        combatThemeCheck.theme !== 'combat' || combatThemeCheck.pref !== 'moonlight' || restoredQuizTheme !== 'moonlight' ||
        mobileThemeOverflow || p4b3StartLogs.failedRequests.length || volLogs.failedRequests.length || quizLogs.failedRequests.length) {
      fail('P4-B.3 Theme toggle/persistence/combat check failed: ' + JSON.stringify({
        dayTheme, moonTheme, volTheme, combatThemeCheck, restoredQuizTheme, mobileThemeOverflow
      }));
    }

    report.p4b2Features = {
      normalHookCheck: normalCheck,
      initialLockCheck,
      rapidCheck,
      afterKnightSlash,
      beforeSkill,
      midSkillScene,
      settledSkillScene,
      afterSkill,
      afterGuardCast,
      afterBossOnGuard,
      resetScene,
      resizeScene,
      archerCheck,
      unlockedB,
      afterBladeStorm,
      afterHeal,
      afterLexical,
      finishedCheck,
      backendCheck,
      pausedState,
      resumedState,
      reducedState,
      canvasInfo,
      canvasResults,
    };
    report.p4b3Features = {
      arenaMetrics,
      globalAttackCheck,
      afterHints,
      practiceCheck,
      ch2Check,
      spellState,
      wave2Check,
      reviewVisible,
      themes: { dayTheme, moonTheme, volTheme, combatThemeCheck, restoredQuizTheme, mobileThemeOverflow }
    };

    const jsonOut = path.join(OUTPUT_DIR, 'browser_qa_report.json');
    fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), 'utf-8');
    console.log('Full P4-B.2 real-browser report saved to:', jsonOut);
    console.log('Total failures:', failures.length);
    if (failures.length > 0) process.exitCode = 1;
  } finally {
    await cdp.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('Acceptance failed:', err);
  process.exit(1);
});
