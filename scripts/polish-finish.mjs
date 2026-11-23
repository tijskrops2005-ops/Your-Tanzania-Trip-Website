// After `astro build` and ytt-finish: apply the site rules to the files that are copied from public/
// without passing through BaseLayout: llms.txt, llms-full.txt, the site search index and the cached
// AJAX fragments (dist/ajax/, opened as pop-ups from the itinerary tabs).
import fs from 'node:fs';
import path from 'node:path';
import { polishText, polishBody } from '../src/lib/polish.js';
import { fixBody } from '../src/lib/fixes.js';
import { isRemoved } from '../src/lib/scope.js';

const tokens = JSON.parse(fs.readFileSync(new URL('../docs/brand-tokens.json', import.meta.url), 'utf8'));
const pages = JSON.parse(fs.readFileSync(new URL('../content/pages.json', import.meta.url), 'utf8'));
const SITE = 'https://yourtanzaniatrip.com';

// 1. llms.txt / llms-full.txt: no lines for pages that are not part of the site, then the text rules.
for (const file of ['dist/llms.txt', 'dist/llms-full.txt']) {
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  let after = before.split('\n').filter(line => {
    const m = line.match(/\]\(https:\/\/yourtanzaniatrip\.com(\/[^)]*)\)/);
    return !(m && isRemoved(m[1].replace(/[?#].*$/, '')));
  }).join('\n');
  after = after.replace(/^## [^\n]+\n(?=\s*(?:## |$))/gm, '').replace(/\n{3,}/g, '\n\n');
  after = polishText(after, tokens).replace(/^## hakuna-matata-package$/m, '## trip-care');
  if (after !== before) fs.writeFileSync(file, after);
  console.log(`polish-finish: ${file} ${after === before ? 'unchanged' : 'updated'}`);
}

// 2. Search index: drop removed pages, rewrite the strings.
const indexFile = 'dist/search-index.json';
if (fs.existsSync(indexFile)) {
  const walk = v => typeof v === 'string' ? polishText(v, tokens)
    : Array.isArray(v) ? v.filter(x => !(x && typeof x === 'object' && typeof x.u === 'string' && isRemoved(x.u.replace(SITE, '').replace(/[?#].*$/, '')))).map(walk)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;
  const before = fs.readFileSync(indexFile, 'utf8');
  const after = JSON.stringify(walk(JSON.parse(before)));
  if (after !== before) fs.writeFileSync(indexFile, after);
  console.log(`polish-finish: ${indexFile} ${after === before ? 'unchanged' : 'updated'}`);
}

// 3. AJAX fragments: the same fixes as the page they belong to (matched by their h1 title).
const titleOf = t => t.replace(/\s+[|l–-]\s+Your Tanzania Trip$/i, '').trim().toLowerCase().replace(/^the /, '');
const byTitle = new Map(pages.map(p => [titleOf(p.title || ''), p]));
const walkDir = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walkDir(path.join(dir, d.name)) : [path.join(dir, d.name)]) : [];
let updated = 0, dropped = 0;
for (const file of walkDir('dist/ajax').filter(f => f.endsWith('.html'))) {
  const before = fs.readFileSync(file, 'utf8');
  const h1 = (before.match(/<h1>([^<]+)<\/h1>/) || [])[1];
  const page = h1 && byTitle.get(titleOf(h1));
  if (page && isRemoved(page.path)) { fs.rmSync(file); dropped++; continue; }
  const ctx = page ? { ...page, slug: page.slug || 'fragment' } : { path: '/ajax/', slug: 'fragment' };
  // fixBody keeps a single h1; a fragment opens in a pop-up, so its own h1 stays as it was.
  let after = polishBody(fixBody(before, ctx, tokens), ctx, tokens);
  if (h1) after = after.replace(/<h2>([^<]*)<\/h2>/, (m, t) => (t === h1 ? `<h1>${t}</h1>` : m));
  if (after !== before) { fs.writeFileSync(file, after); updated++; }
}
console.log(`polish-finish: ${updated} AJAX fragments updated, ${dropped} of removed pages left out`);
