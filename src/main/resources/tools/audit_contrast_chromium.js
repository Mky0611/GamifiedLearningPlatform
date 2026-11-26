const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const ROOT = path.resolve(__dirname, '../../../..');
require(path.join(ROOT, 'preview-server.js'));

// Minimal Chrome CDP finder reused from chromium_p4b2_acceptance.js
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Edge not found');
}

class CDP {
  async connect() {
    const userDataDir = path.join(ROOT, 'test_output/.chrome_contrast');
    fs.mkdirSync(userDataDir, { recursive: true });
    this.proc = spawn(findChrome(), [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--remote-debugging-pipe',
      `--user-data-dir=${userDataDir}`, 'about:blank'
    ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
    this.toChrome = this.proc.stdio[3];
    this.fromChrome = this.proc.stdio[4];
    this.idCounter = 1;
    this.pending = new Map();
    let buf = Buffer.alloc(0);
    this.fromChrome.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (true) {
        const idx = buf.indexOf(0);
        if (idx === -1) break;
        const raw = buf.slice(0, idx).toString('utf8');
        buf = buf.slice(idx + 1);
        const msg = JSON.parse(raw);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
        }
      }
    });
    const targets = await this.send('Target.getTargets');
    const pt = targets.targetInfos.find((t) => t.type === 'page') || (await this.send('Target.createTarget', { url: 'about:blank' }));
    const att = await this.send('Target.attachToTarget', { targetId: pt.targetId, flatten: true });
    this.sid = att.sessionId;
    await this.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 850, deviceScaleFactor: 1, mobile: false }, this.sid);
  }
  send(method, params = {}, sessionId = undefined) {
    return new Promise((resolve, reject) => {
      const id = this.idCounter++;
      this.pending.set(id, { resolve, reject });
      this.toChrome.write(JSON.stringify({ id, method, params, sessionId }) + '\0');
    });
  }
  async eval(expr) {
    const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, this.sid);
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
    return res.result?.value;
  }
  async goto(url, waitMs = 950) {
    await this.send('Page.enable', {}, this.sid);
    await this.send('Page.navigate', { url }, this.sid);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  async snap(outFile, width = 1366, height = 850) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }, this.sid);
    await new Promise((r) => setTimeout(r, 250));
    const shot = await this.send('Page.captureScreenshot', { format: 'png' }, this.sid);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
  }
  async close() { try { this.proc.kill(); } catch (e) {} }
}

const AUDIT_SCRIPT = `(() => {
  function parseColor(str) {
    if (!str) return null;
    const hex = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      let h = hex[1];
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
    }
    const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }
  function extractGradientStops(bgImage) {
    if (!bgImage || bgImage === 'none' || !bgImage.includes('gradient')) return [];
    const tokens = bgImage.match(/rgba?\\([^)]+\\)|#[0-9a-fA-F]{3,6}/g) || [];
    return tokens.map(parseColor).filter((c) => c && c.a > 0);
  }
  function blend(fg, bg) {
    const a = fg.a;
    return { r: Math.round(fg.r * a + bg.r * (1 - a)), g: Math.round(fg.g * a + bg.g * (1 - a)), b: Math.round(fg.b * a + bg.b * (1 - a)), a: 1 };
  }
  function lum(c) {
    const conv = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * conv(c.r) + 0.7152 * conv(c.g) + 0.0722 * conv(c.b);
  }
  function contrast(c1, c2) {
    const l1 = lum(c1), l2 = lum(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function getEffectiveBgCandidates(el) {
    const layers = [];
    let cur = el;
    while (cur && cur.nodeType === 1) {
      const st = getComputedStyle(cur);
      const op = Math.max(0, Math.min(1, parseFloat(st.opacity ?? '1')));
      const bg = parseColor(st.backgroundColor);
      const gradStops = extractGradientStops(st.backgroundImage);
      layers.unshift({ bg: bg && bg.a > 0 ? { ...bg, a: bg.a * op } : null, gradStops: gradStops.map((g) => ({ ...g, a: g.a * op })) });
      cur = cur.parentElement;
    }
    let base = { r: 243, g: 238, b: 220, a: 1 };
    const docTheme = document.documentElement.dataset.theme;
    if (docTheme === 'moonlight' || docTheme === 'combat') base = { r: 33, g: 42, b: 52, a: 1 };
    let candidates = [base];
    for (const layer of layers) {
      if (layer.bg) {
        candidates = candidates.map((b) => blend(layer.bg, b));
      }
      if (layer.gradStops.length > 0) {
        const next = [];
        for (const baseC of candidates.slice(0, 2)) {
          for (const stop of layer.gradStops.slice(0, 4)) next.push(blend(stop, baseC));
        }
        candidates = next;
      }
    }
    return candidates;
  }
  function getEffectiveOpacity(el) {
    let op = 1;
    let cur = el;
    while (cur && cur.nodeType === 1) {
      op *= Math.max(0, Math.min(1, parseFloat(getComputedStyle(cur).opacity ?? '1')));
      cur = cur.parentElement;
    }
    return op;
  }

  const els = document.querySelectorAll('h1,h2,h3,h4,p,a,button,label,span,strong,li,td,th,input,select,textarea,.section-title,.section-text,.muted,.small-muted,.quiz-option,.choice-btn,.option-card,.stat-pill,.hero-fact,.auth-cardlet,.topic-item,.set-item,.flash-meaning,.flash-word,.cefr-pill,.pixel-badge,.tile,.board-tile');
  const issues = [];
  const seen = new Set();
  for (const el of els) {
    const st = getComputedStyle(el);
    const effOp = getEffectiveOpacity(el);
    if (st.display === 'none' || st.visibility === 'hidden' || effOp === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    const isInputLike = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
    const hasDirectText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0) || isInputLike;
    if (!hasDirectText) continue;

    const bgCandidates = getEffectiveBgCandidates(el);
    const checks = [];
    const fgRaw = parseColor(st.color);
    if (fgRaw) checks.push({ label: 'text', raw: { ...fgRaw, a: fgRaw.a * effOp }, txt: (el.innerText || el.value || '').trim().slice(0, 45) });
    if (isInputLike && el.placeholder && !el.value) {
      const phColor = parseColor(getComputedStyle(el, '::placeholder').color);
      if (phColor) checks.push({ label: 'placeholder', raw: { ...phColor, a: phColor.a * effOp }, txt: '[placeholder] ' + el.placeholder.slice(0, 35) });
    }

    const fs = parseFloat(st.fontSize) || 14;
    const fw = parseInt(st.fontWeight, 10) || 400;
    const isLarge = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const minReq = isLarge ? 3.0 : 4.5;

    for (const chk of checks) {
      let worstRatio = Infinity;
      let worstBg = bgCandidates[0];
      for (const bg of bgCandidates) {
        const fg = blend(chk.raw, bg);
        const r = contrast(fg, bg);
        if (r < worstRatio) { worstRatio = r; worstBg = bg; }
      }
      if (worstRatio < minReq) {
        const key = chk.label + '|' + el.tagName + '|' + el.className + '|' + chk.txt;
        if (!seen.has(key)) {
          seen.add(key);
          issues.push({
            kind: chk.label,
            tag: el.tagName,
            id: el.id || '',
            cls: String(el.className || '').slice(0, 45),
            text: chk.txt,
            disabled: Boolean(el.disabled),
            fg: st.color,
            bg: 'rgb(' + worstBg.r + ',' + worstBg.g + ',' + worstBg.b + ')',
            ratio: Number(worstRatio.toFixed(2)),
            req: minReq
          });
        }
      }
    }
  }
  return { theme: document.documentElement.dataset.theme, issueCount: issues.length, issues: issues.slice(0, 20) };
})()`;

(async () => {
  const baseUrl = 'http://127.0.0.1:4173';
  await new Promise((r) => setTimeout(r, 350));
  const cdp = new CDP();
  await cdp.connect();
  const pages = ['home', 'volcard', 'quiz', 'memory', 'speed-math', 'code-puzzle', 'account', 'auth', 'minigame'];
  let totalIssues = 0;
  try {
    await cdp.goto(`${baseUrl}/app/home`, 600);
    for (const p of pages) {
      for (const theme of ['daylight', 'moonlight']) {
        await cdp.eval(`localStorage.setItem('glp.theme', ${JSON.stringify(theme)})`);
        await cdp.goto(`${baseUrl}/app/${p}`, 1000);
        const res = await cdp.eval(AUDIT_SCRIPT);
        totalIssues += res.issueCount;
        console.log(`${p} [${res.theme}]: issues=${res.issueCount}`);
        if (res.issueCount > 0) {
          res.issues.forEach((it) => console.log('  ->', JSON.stringify(it)));
        }
        if (process.argv.includes('--snap') && ['home', 'volcard', 'quiz', 'account'].includes(p)) {
          const snapDir = path.join(ROOT, 'test_output/contrast_snaps');
          await cdp.snap(path.join(snapDir, `${p}_${theme}_desktop.png`), 1366, 850);
          if (['home', 'quiz'].includes(p)) {
            await cdp.snap(path.join(snapDir, `${p}_${theme}_mobile.png`), 390, 844);
          }
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 850, deviceScaleFactor: 1, mobile: false }, cdp.sid);
        }
        if (p === 'quiz') {
          await cdp.eval(`document.querySelector('#quizMount .choice-btn')?.click()`);
          await new Promise((r) => setTimeout(r, 250));
          const resQuiz = await cdp.eval(AUDIT_SCRIPT);
          totalIssues += resQuiz.issueCount;
          console.log(`${p}-answered [${resQuiz.theme}]: issues=${resQuiz.issueCount}`);
          if (resQuiz.issueCount > 0) resQuiz.issues.forEach((it) => console.log('  ->', JSON.stringify(it)));
        } else if (p === 'volcard') {
          await cdp.eval(`document.getElementById('flipBtn')?.click()`);
          await new Promise((r) => setTimeout(r, 350));
          const resFlip = await cdp.eval(AUDIT_SCRIPT);
          totalIssues += resFlip.issueCount;
          console.log(`${p}-flipped [${resFlip.theme}]: issues=${resFlip.issueCount}`);
          if (resFlip.issueCount > 0) resFlip.issues.forEach((it) => console.log('  ->', JSON.stringify(it)));
        } else if (p === 'auth') {
          await cdp.eval(`document.getElementById('registerTab')?.click()`);
          await new Promise((r) => setTimeout(r, 180));
          const resReg = await cdp.eval(AUDIT_SCRIPT);
          totalIssues += resReg.issueCount;
          console.log(`${p}-register [${resReg.theme}]: issues=${resReg.issueCount}`);
          if (resReg.issueCount > 0) resReg.issues.forEach((it) => console.log('  ->', JSON.stringify(it)));
        } else if (p === 'account') {
          for (const tabKey of ['tree', 'spellbook', 'loadout', 'chapters', 'mastery']) {
            await cdp.eval(`document.querySelector('[data-hall-tab="${tabKey}"]')?.click()`);
            await new Promise((r) => setTimeout(r, 220));
            const resTab = await cdp.eval(AUDIT_SCRIPT);
            totalIssues += resTab.issueCount;
            console.log(`${p}-${tabKey} [${resTab.theme}]: issues=${resTab.issueCount}`);
            if (resTab.issueCount > 0) resTab.issues.forEach((it) => console.log('  ->', JSON.stringify(it)));
          }
        }
      }
    }
  } finally {
    await cdp.close();
  }
  if (totalIssues === 0) {
    console.log('SCOPED CONTRAST AUDIT PASS (DOM text, gradient stops, opacity blending, placeholders & tested interactive states; bitmap sprite art excluded).');
  }
  process.exit(totalIssues > 0 ? 1 : 0);
})();
