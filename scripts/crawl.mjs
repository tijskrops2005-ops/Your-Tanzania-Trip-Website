// Downloads the raw HTML of every URL in .cache/urls.tsv into .cache/raw/
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const rows = (await fs.readFile(path.join(root, '.cache/urls.tsv'), 'utf8'))
  .trim().split('\n').map(l => l.split('\t'));

export const slugFor = url => new URL(url).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'index';

let i = 0, done = 0, failed = [];
async function worker() {
  while (i < rows.length) {
    const [, url] = rows[i++];
    const file = path.join(root, '.cache/raw', slugFor(url) + '.html');
    try { await fs.access(file); done++; continue; } catch {}
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) site-rebuild' } });
      if (!res.ok) throw new Error(res.status);
      await fs.writeFile(file, await res.text());
    } catch (e) { failed.push(`${url} ${e.message}`); }
    if (++done % 50 === 0) console.log(`${done}/${rows.length}`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log('done', done, 'failed', failed.length, failed.join('\n'));
