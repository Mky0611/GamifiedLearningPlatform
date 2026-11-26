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
    const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
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
  function getEffectiveBg(el) {
    const chain = [];
    let cur = el;
    while (cur && cur.nodeType === 1) {
      const st = getComputedStyle(cur);
      const bg = parseColor(st.backgroundColor);
      if (bg && bg.a > 0) chain.unshift(bg);
      cur = cur.parentElement;
    }
    let acc = { r: 243, g: 238, b: 220, a: 1 };
    const docTheme = document.documentElement.dataset.theme;
    if (docTheme === 'moonlight' || docTheme === 'combat') acc = { r: 33, g: 42, b: 52, a: 1 };
    for (const c of chain) acc = blend(c, acc);
    return acc;
  }

  const els = document.querySelectorAll('h1,h2,h3,h4,p,a,button,label,span,strong,li,td,th,input,select,textarea,.section-title,.section-text,.muted,.small-muted,.quiz-option,.stat-pill,.hero-fact,.auth-cardlet,.topic-item,.set-item,.flash-meaning,.flash-word,.cefr-pill,.pixel-badge,.tile,.board-tile');
  const issues = [];
  const seen = new Set();
  for (const el of els) {
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    const hasDirectText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0) || el.tagName === 'INPUT';
    if (!hasDirectText) continue;
    if (el.disabled) continue;

    const fgRaw = parseColor(st.color);
    if (!fgRaw) continue;
    const bg = getEffectiveBg(el);
    const fg = blend(fgRaw, bg);
    const ratio = contrast(fg, bg);
    const fs = parseFloat(st.fontSize) || 14;
    const fw = parseInt(st.fontWeight, 10) || 400;
    const isLarge = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const minReq = isLarge ? 3.0 : 4.5;
    if (ratio < minReq) {
      const txt = (el.tagName === 'INPUT' ? el.placeholder : el.innerText || '').trim().slice(0, 45);
      const key = el.tagName + '|' + el.className + '|' + txt;
      if (!seen.has(key)) {
        seen.add(key);
        issues.push({
          tag: el.tagName,
          id: el.id || '',
          cls: String(el.className || '').slice(0, 50),
          text: txt,
          fg: st.color,
          bg: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')',
          ratio: Number(ratio.toFixed(2)),
          req: minReq
        });
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
        }
      }
    }
  } finally {
    await cdp.close();
  }
  process.exit(totalIssues > 0 ? 1 : 0);
})();
