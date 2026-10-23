// Usage: node screenshot.mjs <url> [label] [--width=1440] [--full]
// Saves to "temporary screenshots/screenshot-N[-label].png" (auto-increment, never overwrites).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [url = 'http://localhost:3000', label] = args.filter(a => !a.startsWith('--'));
const width = Number(flags.width) || 1440;

const dir = path.resolve(import.meta.dirname, 'temporary screenshots');
fs.mkdirSync(dir, { recursive: true });
const taken = fs.readdirSync(dir).map(f => Number((f.match(/^screenshot-(\d+)/) || [])[1]) || 0);
const n = Math.max(0, ...taken) + 1;
const out = path.join(dir, `screenshot-${n}${label ? '-' + label : ''}.png`);

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: fs.existsSync(chrome) ? chrome : undefined });
const page = await browser.newPage();
await page.setViewport({ width, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.mouse.move(10, 10);
// Full-page captures skip content-visibility:auto sections; render everything for the capture.
await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
if ('full' in flags) {
  // Scroll through slowly so lazy images and on-scroll reveals run before the full-page capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); }
    window.scrollTo(0, 0);
  });
}
// Wait until every image has loaded (local server is HTTP/1.1, so lazy images arrive slower).
await page.evaluate(() => Promise.race([
  Promise.all([...document.images].map(i => i.complete || new Promise(r => { i.onload = i.onerror = r; }))),
  new Promise(r => setTimeout(r, 20000)),
]));
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: out, fullPage: 'full' in flags });
await browser.close();
console.log(out);
