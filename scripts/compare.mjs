// Usage: node scripts/compare.mjs /path/ [/other/ ...] [--width=1440]
// Full-page screenshots of live vs local; prints height + pixel difference per page and
// writes live/local/diff PNGs to "temporary screenshots/compare/".
import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const width = Number((args.find(a => a.startsWith('--width=')) || '').split('=')[1]) || 1440;
const paths = args.filter(a => !a.startsWith('--'));
const outDir = path.resolve(import.meta.dirname, '../temporary screenshots/compare');
fs.mkdirSync(outDir, { recursive: true });

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: fs.existsSync(chrome) ? chrome : undefined, protocolTimeout: 300000 });

async function shoot(url) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  // Live site loads scripts on first interaction; trigger it so both run the same JS.
  await page.mouse.move(10, 10);
  // Full-page captures skip content-visibility:auto sections; render everything for the capture.
  await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); }
    window.scrollTo(0, 0);
    // Hide things that legitimately differ between loads.
    document.querySelectorAll('input[type=date], .ginput_container_date input').forEach(i => (i.value = ''));
  });

  // Wait until every image has loaded (local server is HTTP/1.1, so lazy images arrive slower).
  await page.evaluate(() => Promise.race([
    Promise.all([...document.images].map(i => i.complete || new Promise(r => { i.onload = i.onerror = r; }))),
    new Promise(r => setTimeout(r, 20000)),
  ]));
  await new Promise(r => setTimeout(r, 1200));
  const buf = await page.screenshot({ fullPage: true });
  await page.close();
  return PNG.sync.read(Buffer.from(buf));
}

for (const p of paths) {
  try { await comparePage(p); } catch (e) { console.log(`${p}\tFAILED ${e.message.split('\n')[0]}`); }
}
await browser.close();

async function comparePage(p) {
  const name = p.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home';
  const [live, local] = await Promise.all([shoot('https://tanzania-specialist.com' + p), shoot('http://localhost:3000' + p)]);
  const h = Math.min(live.height, local.height);
  const crop = img => { const c = new PNG({ width, height: h }); PNG.bitblt(img, c, 0, 0, width, h, 0, 0); return c; };
  const a = crop(live), b = crop(local), diff = new PNG({ width, height: h });
  const changed = pixelmatch(a.data, b.data, diff.data, width, h, { threshold: 0.15 });
  for (const [k, img] of [['live', live], ['local', local], ['diff', diff]])
    fs.writeFileSync(path.join(outDir, `${name}-${k}.png`), PNG.sync.write(img));
  console.log(`${p}\tlive ${live.height}px\tlocal ${local.height}px\tdiff ${(changed / (width * h) * 100).toFixed(2)}%`);
}
