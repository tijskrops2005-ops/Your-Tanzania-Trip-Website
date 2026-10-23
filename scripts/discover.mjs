// Follows internal links that are not in the sitemap. Pages that resolve to a new URL
// are saved to .cache/raw; redirects are recorded in .cache/redirects.json.
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const rawDir = path.join(root, '.cache/raw');
const ORIGIN = 'https://tanzania-specialist.com';
const slugFor = p => p.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'index';

const tsv = (await fs.readFile(path.join(root, '.cache/urls.tsv'), 'utf8')).trim().split('\n').map(l => l.split('\t'));
const known = new Set(tsv.map(([, u]) => new URL(u).pathname));
const extra = JSON.parse(await fs.readFile(path.join(root, '.cache/extra-pages.json'), 'utf8').catch(() => '[]'));
extra.forEach(p => known.add(p));
const redirects = JSON.parse(await fs.readFile(path.join(root, '.cache/redirects.json'), 'utf8').catch(() => '{}'));
const dead = new Set(JSON.parse(await fs.readFile(path.join(root, '.cache/dead.json'), 'utf8').catch(() => '[]')));

const linksIn = html => [...html.matchAll(/href="https:\/\/tanzania-specialist\.com(\/[^"#?]*)/g)]
  .map(m => m[1]).filter(p => !/^\/(wp-|feed|xmlrpc|comments)/.test(p) && !/\.[a-z0-9]{2,4}$/i.test(p));

for (let round = 1; round <= 5; round++) {
  const files = await fs.readdir(rawDir);
  const todo = new Set();
  for (const f of files) for (const p of linksIn(await fs.readFile(path.join(rawDir, f), 'utf8')))
    if (!known.has(p) && !redirects[p] && !dead.has(p)) todo.add(p);
  console.log(`round ${round}: ${todo.size} new paths`);
  if (!todo.size) break;
  const list = [...todo];
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < list.length) {
      const p = list[i++];
      try {
        const res = await fetch(ORIGIN + p, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) site-rebuild' } });
        const finalUrl = new URL(res.url);
        if (!res.ok) { dead.add(p); continue; }
        if (finalUrl.host !== 'tanzania-specialist.com') { redirects[p] = finalUrl.href; continue; }
        const fp = finalUrl.pathname;
        if (fp !== p) redirects[p] = fp;
        if (!(res.headers.get('content-type') || '').includes('text/html')) { redirects[p] = fp; continue; }
        if (!known.has(fp)) {
          known.add(fp); extra.push(fp);
          await fs.writeFile(path.join(rawDir, slugFor(fp) + '.html'), await res.text());
        }
      } catch (e) { dead.add(p); }
    }
  }));
  await fs.writeFile(path.join(root, '.cache/extra-pages.json'), JSON.stringify(extra, null, 1));
  await fs.writeFile(path.join(root, '.cache/redirects.json'), JSON.stringify(redirects, null, 1));
  await fs.writeFile(path.join(root, '.cache/dead.json'), JSON.stringify([...dead], null, 1));
}
console.log('extra pages', extra.length, 'redirects', Object.keys(redirects).length, 'dead', dead.size);
