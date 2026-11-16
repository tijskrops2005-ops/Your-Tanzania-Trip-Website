// Site audit over dist/: links, images, videos, markers, meta. Usage: node scripts/audit-site.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
const root = path.resolve(import.meta.dirname, '..', 'dist');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const s = fs.statSync(p); if (s.isDirectory()) walk(p); else if (f === 'index.html') files.push(p); } })(root);
const exists = u => { const clean = decodeURIComponent(u.split(/[?#]/)[0]); const p = path.join(root, clean); if (!p.startsWith(root)) return false; return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html'))); };
const issues = {}; const add = (k, page, detail) => { (issues[k] ||= []).push(`${page} :: ${detail}`); };
const titles = {}, descs = {};
for (const f of files) {
  const page = '/' + path.relative(root, path.dirname(f)).split(path.sep).join('/') + '/';
  const html = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/i.test(html) && html.length < 3000) continue; // redirect stub
  const $ = cheerio.load(html);
  const title = $('title').text().trim(); (titles[title] ||= []).push(page);
  const desc = $('meta[name=description]').attr('content') || ''; if (!desc) add('no-meta-description', page, ''); else (descs[desc] ||= []).push(page);
  const h1 = $('h1').length; if (h1 !== 1) add('h1-count', page, h1);
  $('a[href]').each((_, a) => { const h = $(a).attr('href'); const txt = ($(a).text() + ($(a).attr('aria-label') || '') + $(a).find('img').attr('alt') || '').trim();
    if (!txt) add('empty-link-text', page, h);
    if (h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/_vercel') && !exists(h)) add('broken-internal-link', page, h);
    if (/tanzania-specialist\.com/i.test(h)) add('legacy-domain-link', page, h); });
  $('img').each((_, i) => { const s = $(i).attr('src') || ''; const alt = $(i).attr('alt');
    if (alt === undefined) add('img-no-alt', page, s);
    if (s.startsWith('/') && !exists(s)) add('broken-image', page, s);
    if (/^https?:/.test(s) && !/unsplash|placehold/.test(s)) add('external-image', page, s.slice(0, 90)); });
  $('video source[src], video[src]').each((_, v) => { const s = $(v).attr('src'); if (s.startsWith('/') && !exists(s)) add('broken-video', page, s); });
  $('[style*="background-image"]').each((_, e) => { const m = ($(e).attr('style') || '').match(/url\(['"]?([^'")]+)/); if (m && m[1].startsWith('/') && !exists(m[1])) add('broken-bg-image', page, m[1]); });
  $('script,style,noscript').remove();
  const text = $('body').text();
  for (const [k, re] of [['fill-marker', /\[(FILL|INVULLEN|AANVULLEN)[^\]]*\]/gi], ['legacy-brand-text', /Tanzania[- ]Specialist/gi], ['lorem', /lorem ipsum/gi]]) {
    const m = text.match(re); if (m) add(k, page, [...new Set(m)].slice(0, 3).join(' | '));
  }
}
for (const [t, p] of Object.entries(titles)) if (p.length > 1) add('duplicate-title', p.slice(0, 4).join(', '), t);
for (const [t, p] of Object.entries(descs)) if (p.length > 1) add('duplicate-description', p.slice(0, 4).join(', ') + ` (+${p.length})`, t.slice(0, 80));
if (process.argv.includes('--json')) { fs.writeFileSync(path.resolve(import.meta.dirname, '..', '.cache', 'audit.json'), JSON.stringify(issues, null, 1)); }
console.log(`pages: ${files.length}`);
for (const [k, v] of Object.entries(issues)) { console.log(`\n## ${k}: ${v.length}`); for (const l of v.slice(0, 6)) console.log('  ' + l); }
