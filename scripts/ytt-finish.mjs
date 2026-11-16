// Post-build step (runs after `astro build`, see package.json "build").
// 1. Replaces every legacy photo from /wp-content/uploads/ (Tanzania Specialist material) in dist/ with a
//    freely licensed Unsplash photo that matches the subject (docs/photo-pool.json, Unsplash License).
// 2. Turns links to pages outside the core set (src/lib/scope.js) into plain text.
// 3. Leaves the legacy photo files out of the published site.
// 4. Writes the redirects for removed pages into vercel.json.
import fs from 'node:fs';
import path from 'node:path';
import { removedTarget } from '../src/lib/scope.js';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const pool = JSON.parse(fs.readFileSync(path.join(root, 'docs/photo-pool.json'), 'utf8'));

// Subject keywords (file name, alt text, page path) → pool topic. First match wins.
const RULES = [
  [/migration|wildebeest|gnu|mara-river|river-crossing/, 'migration'],
  [/balloon/, 'balloon'],
  [/meru/, 'meru'],
  [/kilimanjaro|-kili-|summit|uhuru|machame|lemosho|marangu|rongai|umbwe|shira|barranco|climb|trek|hike|hiking|porter/, 'kilimanjaro|hiking'],
  [/ngorongoro|crater/, 'ngorongoro'],
  [/tarangire/, 'tarangire'],
  [/manyara/, 'manyara'],
  [/flamingo|natron/, 'flamingo'],
  [/stone-?town|spice|forodhani/, 'stonetown'],
  [/dhow|sail/, 'dhow'],
  [/snorkel|div(e|ing)|reef|turtle|dolphin|mnemba/, 'snorkel'],
  [/waterfall|udzungwa|materuni|sanje/, 'waterfall'], [/forest|usambara|amani|jungle|jozani|bos-/, 'forest'],
  [/zanzibar|nungwi|paje|kendwa|jambiani|matemwe|michamvi|beach|strand|ocean|chumbe|mafia|pemba|fanjove|island|-sea-/, 'zanzibar|pemba'],
  [/lion|leeuw|leeuwen/, 'lion'], [/elephant|olifant/, 'elephant'], [/giraffe|giraf/, 'giraffe'], [/zebra/, 'zebra'], [/leopard|luipaard/, 'leopard'],
  [/cheetah/, 'cheetah'], [/rhino/, 'rhino'], [/hippo|nijlpaard/, 'hippo'], [/buffalo/, 'buffalo'],
  [/chimp|gombe|mahale|monkey|primate|baboon/, 'chimp'], [/bird|eagle|hornbill/, 'birds'],
  [/maasai|masai|hadzabe|datoga|tribe|cultur|village|school|-people-|local/, 'maasai|village'],
  [/jeep|vehicle|cruiser|-car-|game-?drive|4x4/, 'jeep'],
  [/camp|tent|lodge|hotel|room|-pool|villa|accommodation|bungalow|suite|resort|-bed-|glamping/, 'camp|lodge'],
  [/arusha|moshi/, 'arusha'], [/dar-?es-?salaam|bagamoyo|-dar-/, 'dar'],
  [/coffee/, 'coffee'], [/food|dinner|breakfast|lunch|cook|meal|bbq/, 'food'],
  [/baobab|ruaha/, 'baobab'],
  [/honeymoon|couple|romantic|wedding/, 'couple'], [/family|kid|child/, 'family'],
  [/sunset|sunrise|dusk|dawn/, 'sunset'],
  [/serengeti|seronera|ndutu|savanna|safari|nyerere|selous|mikumi|katavi|park|wildlife|animal/, 'serengeti|lion|elephant|giraffe|zebra'],
];
const FALLBACK = 'serengeti|sunset|elephant|giraffe|zebra|tarangire';

const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const used = new Map(); // photo id -> [slug, author]

const norm = t => '-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-';
function pick(subject, seed, context = '') {
  // The photo's own name and alt text decide first; the page subject only when they say nothing.
  const rule = RULES.find(([re]) => re.test(norm(subject))) || RULES.find(([re]) => re.test(norm(context)));
  const topics = (rule ? rule[1] : FALLBACK).split('|').filter(t => pool[t]?.length);
  const list = topics.flatMap(t => pool[t]);
  const [photo, slug, , author] = list[hash(seed) % list.length];
  used.set(photo, [slug, author]);
  return photo;
}
const url = (photo, w) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&q=75`;
const srcset = photo => [480, 960, 1600].map(w => `${url(photo, w)} ${w}w`).join(', ');

const UPLOAD = /(?:https?:\/\/[^"'\s)]+)?\/wp-content\/uploads\/[^"'\s),]+?\.(?:jpe?g|png|webp|avif|gif)/gi;
const baseName = u => u.split('/').pop().replace(/-\d+x\d+(?=\.)/, '').replace(/\.[a-z]+$/i, '');

function replacePhotos(html, pagePath) {
  // <img> and <source>: choose by file name + alt + page, and rewrite src/srcset/data-* together.
  html = html.replace(/<(img|source)\b[^>]*>/gi, tag => {
    const m = tag.match(UPLOAD);
    if (!m) return tag;
    const alt = (tag.match(/\balt="([^"]*)"/i) || [])[1] || '';
    const key = baseName(m[0]);
    const photo = pick(`${key} ${alt}`, key, pagePath);
    return tag
      .replace(/\b((?:data-)?(?:lazy-)?srcset)="[^"]*"/gi, (_, a) => `${a}="${srcset(photo)}"`)
      .replace(/\b((?:data-)?(?:lazy-)?src)="[^"]*\/wp-content\/uploads\/[^"]*"/gi, (_, a) => `${a}="${url(photo, 1280)}"`)
      .replace(/\bsizes="[^"]*"/i, 'sizes="(max-width: 768px) 100vw, 60vw"');
  });
  // Anything left (CSS backgrounds, lightbox links, JSON strings).
  return html.replace(UPLOAD, u => { const key = baseName(u); return url(pick(key, key, pagePath), 1600); });
}

// Links to removed pages become plain text (cards keep their content, without the dead link).
function unlinkRemoved(html) {
  return html.replace(/<a\b([^>]*?)href="(?:https?:\/\/(?:www\.)?(?:yourtanzaniatrip\.com|tanzania-specialist\.com))?(\/[^"#?]*)"([^>]*)>([\s\S]*?)<\/a>/gi,
    (m, pre, href, post, inner) => {
      const p = href.endsWith('/') ? href : href + '/';
      if (!removedTarget(p)) return m;
      const cls = ((pre + post).match(/\bclass="([^"]*)"/) || [])[1];
      return `<span${cls ? ` class="${cls}"` : ''}>${inner}</span>`;
    });
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!p.startsWith(path.join(dist, 'wp-content'))) walk(p, out); }
    else if (/\.(html|json|js|txt|xml)$/.test(e.name) && !p.includes(`${path.sep}_astro${path.sep}`)) out.push(p);
  }
  return out;
}

let files = 0;
for (const file of walk(dist)) {
  const rel = '/' + path.relative(dist, file).replace(/\\/g, '/');
  const pagePath = rel.replace(/index\.html$/, '').replace(/\.(json|js|txt|xml)$/, '');
  const src = fs.readFileSync(file, 'utf8');
  if (!/\\?\/wp-content\\?\/uploads\\?\//.test(src) && !/href="[^"]*\/accommodation/.test(src)) continue;
  // JSON inside pages escapes slashes (\/wp-content\/uploads\/…); unescape first so every photo is found.
  const plain = /\.(html|json)$/.test(file) ? src.replace(/\\\//g, '/') : src;
  let out = replacePhotos(plain, pagePath);
  if (/\.(html|json)$/.test(file)) out = unlinkRemoved(out);
  if (out !== src) { fs.writeFileSync(file, out); files++; }
}

// Palette of the 2026-11-15 redesign (forest, ivory, gold) in the legacy theme CSS: copper buttons,
// orange checkboxes and sliders and the sand tones of the first rebrand become the homepage colours.
const THEME_CSS = path.join(dist, 'wp-content/themes/tanzania-specialist/public/css/app.css');
if (fs.existsSync(THEME_CSS)) {
  const PALETTE = [
    [/#a83800\b|#A83800\b/g, '#183e35'], [/168 56 0\b/g, '24 62 53'], [/168,\s?56,\s?0\b/g, '24,62,53'],
    [/#8c2f00\b|#8C2F00\b/g, '#285448'],
    [/#e69016\b|#E69016\b/g, '#d5a34d'], [/230 144 22\b/g, '213 163 77'], [/230,\s?144,\s?22\b/g, '213,163,77'],
    [/#fcab2a\b|#FCAB2A\b/g, '#e4b763'], [/252 171 42\b/g, '228 183 99'],
    [/#20281b\b|#20281B\b/g, '#183e35'], [/32 40 27\b/g, '24 62 53'], [/32,\s?40,\s?27\b/g, '24,62,53'],
    [/#dcc496\b|#DCC496\b/g, '#c9d2c8'], [/220 196 150\b/g, '201 210 200'],
    [/#faf6ec\b|#FAF6EC\b/g, '#f7f4ec'], [/250 246 236\b/g, '247 244 236'],
  ];
  let css = fs.readFileSync(THEME_CSS, 'utf8');
  for (const [re, to] of PALETTE) css = css.replace(re, to);
  fs.writeFileSync(THEME_CSS, css);
}

// Legacy photos are no longer referenced: keep only uploads that are still linked (PDFs and the like).
const uploads = path.join(dist, 'wp-content/uploads');
let removedFiles = 0;
if (fs.existsSync(uploads)) {
  const stillUsed = new Set();
  for (const file of walk(dist)) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/\/wp-content\/uploads\/[^"'\s)<>]+/g)) stillUsed.add(decodeURI(m[0]));
  }
  const prune = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) prune(p);
      else if (!stillUsed.has('/' + path.relative(dist, p).replace(/\\/g, '/'))) { fs.rmSync(p); removedFiles++; }
    }
  };
  prune(uploads);
}

// Credits for every Unsplash photo now on the site (the /photo-credits/ page reads this list).
fs.writeFileSync(path.join(dist, 'photo-credits.json'), JSON.stringify([...used].map(([photo, [slug, author]]) => ({ photo, slug, author }))));

// Redirects for removed pages (301 on Vercel).
const pages = JSON.parse(fs.readFileSync(path.join(root, 'content/pages.json'), 'utf8'));
const vercelFile = path.join(root, 'vercel.json');
const vercel = JSON.parse(fs.readFileSync(vercelFile, 'utf8'));
const existing = new Set(vercel.redirects.map(r => r.source));
let added = 0;
for (const p of pages) {
  const target = removedTarget(p.path);
  const source = `${p.path.replace(/\/$/, '')}{/}?`;
  if (target && !existing.has(source)) { vercel.redirects.push({ source, destination: target, statusCode: 301 }); added++; }
}
if (added) fs.writeFileSync(vercelFile, JSON.stringify(vercel, null, 2) + '\n');

console.log(`ytt-finish: ${files} files updated, ${used.size} Unsplash photos in use, ${removedFiles} legacy upload files left out, ${added} redirects added`);
