const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../../../..');
require(path.join(ROOT, 'preview-server.js'));

const PROD_ORIGIN = 'https://gamified-learning-platform-sandy.vercel.app';

function get(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:4173${urlPath}`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

(async () => {
  await new Promise((r) => setTimeout(r, 300));
  const failures = [];
  const check = (cond, msg) => {
    if (!cond) failures.push(msg);
  };

  // 1. robots.txt & sitemap.xml & 404
  const robots = await get('/robots.txt');
  check(robots.status === 200, `/robots.txt status ${robots.status}`);
  check(robots.body.includes(`Sitemap: ${PROD_ORIGIN}/sitemap.xml`), 'robots missing canonical sitemap');
  check(robots.body.includes('Disallow: /app/account'), 'robots missing /app/account disallow');
  check(robots.body.includes('Disallow: /app/auth'), 'robots missing /app/auth disallow');

  const sitemap = await get('/sitemap.xml');
  check(sitemap.status === 200, `/sitemap.xml status ${sitemap.status}`);
  const locs = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  check(locs.length === 7, `Expected 7 sitemap URLs, got ${locs.length}`);
  check(locs.every((u) => u.startsWith(PROD_ORIGIN)), 'Sitemap contains non-prod origin');
  check(!locs.some((u) => u.includes('/app/account') || u.includes('/app/auth')), 'Sitemap includes noindex page');

  const notFound = await get('/definitely-nonexistent-seo-route-404');
  check(notFound.status === 404, `Expected 404 for unknown route, got ${notFound.status}`);

  // 2. Public indexable routes
  const publicRoutes = [
    { path: '/', canonical: `${PROD_ORIGIN}/` },
    { path: '/app/home', canonical: `${PROD_ORIGIN}/` },
    { path: '/app/minigame', canonical: `${PROD_ORIGIN}/app/minigame` },
    { path: '/app/volcard', canonical: `${PROD_ORIGIN}/app/volcard` },
    { path: '/app/quiz', canonical: `${PROD_ORIGIN}/app/quiz` },
    { path: '/app/memory', canonical: `${PROD_ORIGIN}/app/memory` },
    { path: '/app/speed-math', canonical: `${PROD_ORIGIN}/app/speed-math` },
    { path: '/app/code-puzzle', canonical: `${PROD_ORIGIN}/app/code-puzzle` },
  ];

  const titles = new Map();
  const descs = new Map();
  for (const r of publicRoutes) {
    const res = await get(r.path);
    check(res.status === 200, `${r.path} returned ${res.status}`);
    const title = res.body.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || '';
    const desc = res.body.match(/<meta\s+name="description"\s+content="(.*?)"/i)?.[1]?.trim() || '';
    const canon = res.body.match(/<link\s+rel="canonical"\s+href="(.*?)"/i)?.[1]?.trim() || '';
    const robotsMeta = res.body.match(/<meta\s+name="robots"\s+content="(.*?)"/i)?.[1]?.trim() || '';
    const ogImg = res.body.match(/<meta\s+property="og:image"\s+content="(.*?)"/i)?.[1]?.trim() || '';
    const h1Count = (res.body.match(/<h1[\s>]/gi) || []).length;
    check(title.length >= 15, `${r.path} weak title: ${title}`);
    check(desc.length >= 50, `${r.path} weak description: ${desc}`);
    check(canon === r.canonical, `${r.path} canonical mismatch: got "${canon}", expected "${r.canonical}"`);
    check(robotsMeta.includes('index'), `${r.path} robots should allow indexing`);
    check(ogImg.startsWith(PROD_ORIGIN), `${r.path} og:image missing or non-prod: ${ogImg}`);
    check(h1Count === 1, `${r.path} expected 1 <h1>, got ${h1Count}`);
    check(!res.body.includes('58yehd3e2') && !res.body.includes('c4of7d6fz'), `${r.path} leaks preview URL`);
    if (r.path !== '/app/home') {
      check(!titles.has(title), `Duplicate title on ${r.path}: ${title}`);
      check(!descs.has(desc), `Duplicate description on ${r.path}`);
      titles.set(title, r.path);
      descs.set(desc, r.path);
    }
    const jsonLds = [...res.body.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    for (const m of jsonLds) {
      try {
        JSON.parse(m[1]);
      } catch (e) {
        failures.push(`${r.path} invalid JSON-LD: ${e.message}`);
      }
    }
  }

  // 3. Noindex routes
  for (const p of ['/app/account', '/app/auth', '/app/typography']) {
    const res = await get(p);
    check(res.status === 200, `${p} returned ${res.status}`);
    const robotsMeta = res.body.match(/<meta\s+name="robots"\s+content="(.*?)"/i)?.[1]?.toLowerCase() || '';
    check(robotsMeta.includes('noindex'), `${p} missing noindex meta`);
    const h1Count = (res.body.match(/<h1[\s>]/gi) || []).length;
    check(h1Count === 1, `${p} expected 1 <h1>, got ${h1Count}`);
  }

  // 4. Verify og-preview.png exists
  const og = await get('/ui/assets/imgs/og-preview.png');
  check(og.status === 200, `og-preview.png returned ${og.status}`);

  if (failures.length) {
    console.error('SEO VERIFICATION FAILED:\n' + failures.map((f) => ' - ' + f).join('\n'));
    process.exit(1);
  }
  console.log('SEO VERIFICATION PASSED: 11 routes + sitemap + robots + 404 + JSON-LD + og:image all valid.');
  process.exit(0);
})();
