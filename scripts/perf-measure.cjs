// Baseline perf measurement: mobile emulation, CPU x4, "Fast 3G"-like network.
// Usage: npm run build && npm run preview -- --port 4173, then
//        node scripts/perf-measure.cjs [url] [runs] [screenshot-dir]
// Baseline numbers: docs/performance-baseline.md
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const TARGET = process.argv[2] || 'http://localhost:4173/';
const RUNS = Number(process.argv[3] || 3);
const SHOT_DIR = process.argv[4] || require('os').tmpdir();

const initScript = () => {
  window.__perf = { lcp: 0, lcpEl: '', longTasks: [], fcp: 0 };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__perf.lcp = e.startTime;
        window.__perf.lcpEl = e.element ? e.element.tagName + (e.element.className ? '.' + String(e.element.className).slice(0, 40) : '') : (e.url || '');
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__perf.longTasks.push([e.startTime, e.duration]);
    }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__perf.fcp = e.startTime;
    }).observe({ type: 'paint', buffered: true });
  } catch (e) { window.__perfErr = String(e); }
};

async function run(browser, i) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    serviceWorkers: 'block',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const blocked = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 200)));
  // Third-party hosts (Google Fonts, Supabase) are blocked: the container has no direct
  // internet, and blocking makes runs reproducible across PRs.
  await page.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return r.continue();
    blocked.push(u.hostname);
    return r.abort();
  });
  await page.addInitScript(initScript);

  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });

  const reqs = new Map();
  cdp.on('Network.responseReceived', (e) => reqs.set(e.requestId, { url: e.response.url, type: e.type, bytes: 0, t: null }));
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.bytes = e.encodedDataLength; r.t = e.timestamp; } });

  const t0 = Date.now();
  await page.goto(TARGET, { waitUntil: 'load', timeout: 120000 });
  const loadWall = Date.now() - t0;
  // capture state at load
  const atLoad = [...reqs.values()].filter((r) => r.bytes > 0);
  await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(4000); // let idle-time prefetch (KazakhTalesApp) settle; LCP finalize
  // Finalize LCP by simulated interaction-free read
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const p = window.__perf;
    const fcp = p.fcp;
    let tbtAll = 0, tbtAfterFcp = 0;
    for (const [s, d] of p.longTasks) {
      if (d > 50) { tbtAll += d - 50; if (s >= fcp) tbtAfterFcp += d - 50; }
    }
    return {
      fcp, lcp: p.lcp, lcpEl: p.lcpEl,
      dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd,
      tbtAll, tbtAfterFcp, longTasks: p.longTasks.length,
      maxLongTask: p.longTasks.reduce((a, [, d]) => Math.max(a, d), 0),
      text: document.body.innerText.slice(0, 160).replace(/\s+/g, ' '),
      err: window.__perfErr || null,
    };
  });
  const all = [...reqs.values()];
  const js = (list) => list.filter((r) => r.type === 'Script');
  const sum = (list) => list.reduce((a, r) => a + r.bytes, 0);
  const res = {
    run: i, ...m, loadWall,
    reqTotal: all.length, bytesTotal: sum(all),
    jsReqTotal: js(all).length, jsBytesTotal: sum(js(all)),
    jsReqAtLoad: js(atLoad).length, jsBytesAtLoad: sum(js(atLoad)),
    reqAtLoad: atLoad.length, bytesAtLoad: sum(atLoad),
    jsFiles: js(all).map((r) => r.url.split('/').pop() + ':' + r.bytes),
    blocked: [...new Set(blocked)], blockedCount: blocked.length,
    consoleErrors,
  };
  if (i === 1) await page.screenshot({ path: SHOT_DIR + '/baseline-first-screen.png' });
  await ctx.close();
  return res;
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (let i = 1; i <= RUNS; i++) results.push(await run(browser, i));
  await browser.close();
  const med = (k) => { const v = results.map((r) => r[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  const keys = ['fcp', 'lcp', 'tbtAll', 'tbtAfterFcp', 'dcl', 'load', 'reqTotal', 'bytesTotal', 'jsReqTotal', 'jsBytesTotal', 'reqAtLoad', 'jsReqAtLoad', 'jsBytesAtLoad', 'longTasks', 'maxLongTask'];
  const median = Object.fromEntries(keys.map((k) => [k, med(k)]));
  console.log(JSON.stringify({ results, median }, null, 2));
})();
