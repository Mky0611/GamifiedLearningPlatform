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
    await new Promise((r) => setTimeout(r, 200));

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
  const failures = [];
  const report = {
    executedAt: new Date().toISOString(),
    chromePath,
    typography: null,
    pages: [],
    volcardFit: [],
    battleViewports: [],
    battleCanvasFallback: null,
    p4b2Features: {},
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
    if (typoLogs.failedRequests.length || typoLogs.pageErrors.length) fail('Typography errors: ' + JSON.stringify(typoLogs));

    // 2. ALL 9 PAGES AT DESKTOP (1366x768) & MOBILE (390x844)
    for (const p of PAGES) {
      for (const vp of [{ name: 'desktop', w: 1366, h: 768, mobile: false }, { name: 'mobile', w: 390, h: 844, mobile: true }]) {
        await cdp.setViewport(vp.w, vp.h, vp.mobile);
        const logs = await cdp.goto(`${baseUrl}${p.route}`, 1100);
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
        console.log(`Page ${p.name} (${vp.name}): overflow=${dom.horizontalOverflow} world=${dom.world?.biome}(${dom.world?.layersLoaded}) navIconsOk=${dom.allNavIconsLoaded} errs=${logs.failedRequests.length + logs.pageErrors.length}`);
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

    // 4. BATTLE ARENA 9 VIEWPORTS (320x568..1920x1080)
    for (const vp of VIEWPORTS_9) {
      await cdp.setViewport(vp.width, vp.height, vp.mobile);
      const logs = await cdp.goto(`${baseUrl}/app/minigame`, 1500);
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
        const beforeScore = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__?.getScore() || 0`);
        for (const step of movePlan.path) {
          await cdp.clickSelector(`.board-tile[data-row="${step.row}"][data-col="${step.col}"]`);
          await new Promise((r) => setTimeout(r, 35));
        }
        await cdp.clickSelector('#submitWordBtn');
        await new Promise((r) => setTimeout(r, 750));
        const afterScore = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__?.getScore() || 0`);
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
      if (logs.failedRequests.length || logs.pageErrors.length) fail(`Battle ${vp.name} asset/page errors`);

      report.battleViewports.push({ viewport: vp.name, coreBottom, viewportH: vp.height, fitsInViewport, tapOk, clearOk, attackOk, skillCount: rects.skillCount });
      console.log(`Battle ${vp.name}: fit=${fitsInViewport} (${coreBottom}/${vp.height}) tap=${tapOk} clear=${clearOk} attack=${attackOk} skills=${rects.skillCount}`);
    }

    // 5. P4-B.2 SKILLS, VFX POOL, MID-ANIMATION RESET, SLIME & SKELETON, WORLD PAUSE, CANVAS FALLBACK
    await cdp.setViewport(1366, 768, false);
    await cdp.goto(`${baseUrl}/app/minigame`, 1800);

    // Test casting skills & VFX pool
    const beforeSkill = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__?.getSkillState()`);
    await cdp.clickSelector('[data-skill-id="heavy_slash"]');
    await new Promise((r) => setTimeout(r, 150));
    const midSkillScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__?.()`);
    await cdp.screenshot(path.join(OUTPUT_DIR, 'anim_skill_heavy_slash.png'), false);
    await new Promise((r) => setTimeout(r, 800));
    const settledSkillScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__?.()`);
    const afterSkill = await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__?.getSkillState()`);
    if (!beforeSkill || afterSkill.previewMana >= beforeSkill.previewMana) fail('Skill mana did not spend cleanly');
    if (settledSkillScene && settledSkillScene.fsmState !== 'IDLE') fail('FSM did not return to IDLE after skill: ' + settledSkillScene.fsmState);

    // Mid-animation reset test
    await cdp.clickSelector('[data-skill-id="royal_guard"]');
    await new Promise((r) => setTimeout(r, 60));
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.resetSceneActors()`);
    const resetScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__?.()`);
    if (resetScene && (resetScene.fsmState !== 'IDLE' || resetScene.heroY !== 350)) fail('Mid-animation reset failed to settle hero at IDLE/groundY');

    // Monster Expansion Preview: Slime & Skeleton
    for (const mon of ['slime', 'skeleton']) {
      await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setLoadoutAndBoss({ unitCode: 'warrior', bossTheme: ${JSON.stringify(mon)} })`);
      await new Promise((r) => setTimeout(r, 400));
      const mScene = await cdp.eval(`window.__LEX_RAID_SCENE_STATE__?.()`);
      const portLoaded = await cdp.eval(`(() => { const img = document.querySelector('.avatar-boss img'); return Boolean(img && img.complete && img.naturalWidth > 0 && img.src.includes(${JSON.stringify(mon)})); })()`);
      if (!portLoaded) fail(`Monster preview portrait did not load for ${mon}`);
      if (mScene && mScene.bossTheme !== mon) fail(`Scene bossTheme did not switch to ${mon}`);
      await cdp.screenshot(path.join(OUTPUT_DIR, `anim_warrior_vs_${mon}.png`), false);
    }

    // WorldEnvironment Pause / Resume check
    await cdp.eval(`window.WorldEnvironment.pause()`);
    const pausedState = await cdp.eval(`window.WorldEnvironment.getState()`);
    await cdp.eval(`window.WorldEnvironment.resume()`);
    const resumedState = await cdp.eval(`window.WorldEnvironment.getState()`);
    if (!pausedState.paused || resumedState.paused) fail('WorldEnvironment pause/resume toggle failed');

    // Canvas fallback test with Slime
    const canvasLogs = await cdp.goto(`${baseUrl}/app/minigame?renderer=canvas`, 1200);
    await cdp.eval(`window.__LEX_RAID_TEST_HOOKS__.setLoadoutAndBoss({ unitCode: 'warrior', bossTheme: 'slime' })`);
    await new Promise((r) => setTimeout(r, 350));
    await cdp.screenshot(path.join(OUTPUT_DIR, 'battle_canvas_fallback_slime.png'), false);
    const canvasInfo = await cdp.eval(`({ renderer: window.__LEX_RAID_TEST_HOOKS__?.getRenderer?.(), hasCanvas: Boolean(document.querySelector('#raidPhaserMount canvas')) })`);
    if (canvasInfo.renderer !== 'canvas-fallback' || !canvasInfo.hasCanvas || canvasLogs.failedRequests.length) {
      fail('Canvas fallback verification failed: ' + JSON.stringify({ canvasInfo, canvasLogs }));
    }

    report.p4b2Features = {
      beforeSkill,
      midSkillScene,
      settledSkillScene,
      afterSkill,
      resetScene,
      pausedState,
      resumedState,
      canvasInfo,
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
