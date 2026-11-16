// Finds text with low contrast on a set of pages. Usage: node scripts/contrast-probe.mjs [width] path...
import puppeteer from 'puppeteer';
const [w, ...paths] = process.argv.slice(2);
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: Number(w) || 1440, height: 900 });
for (const p of paths) {
  await page.goto('http://localhost:3000' + p, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 800));
  const bad = await page.evaluate(() => {
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(',').map(Number); return { r, g, b, a }; };
    const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const bgOf = el => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none' && !s.backgroundImage.startsWith('linear')) return 'img'; const c = parse(s.backgroundColor); if (c && c.a > .5) return c; } return { r: 255, g: 255, b: 255 }; };
    const out = []; const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode; const txt = t.textContent.trim(); if (txt.length < 2) continue;
      const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      let hidden = false; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || (cs.position === 'fixed' && +cs.opacity === 0)) { hidden = true; break; } } if (hidden) continue;
      const fg = parse(s.color); const bg = bgOf(el); if (!fg || bg === 'img') continue;
      const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.6 && +s.fontWeight >= 700);
      if (ratio < (big ? 3 : 4.5)) out.push(`${ratio.toFixed(2)} ${s.color} on rgb(${bg.r},${bg.g},${bg.b}) <${el.tagName.toLowerCase()} class="${(el.className + '').slice(0, 60)}"> ${txt.slice(0, 60)}`);
    }
    return out;
  });
  console.log(`\n== ${p} (${bad.length})`); for (const b of bad.slice(0, 25)) console.log('  ' + b);
}
await browser.close();
