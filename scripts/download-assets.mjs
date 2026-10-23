// Downloads every referenced wp-content file into public/, keeping the original path
// so that HTML and CSS references only need the domain stripped.
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const lists = process.argv.slice(2);
const urls = [...new Set((await Promise.all(lists.map(f => fs.readFile(f, 'utf8'))))
  .join('\n').split('\n').map(u => u.trim()).filter(Boolean))];

let i = 0, done = 0;
const failed = [];
async function worker() {
  while (i < urls.length) {
    const url = urls[i++];
    const rel = decodeURIComponent(new URL(url).pathname);
    const file = path.join(root, 'public', rel);
    try { await fs.access(file); done++; continue; } catch {}
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) site-rebuild' } });
      if (!res.ok) throw new Error(res.status);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    } catch (e) { failed.push(`${url}\t${e.message}`); }
    if (++done % 250 === 0) console.log(`${done}/${urls.length}`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
await fs.writeFile(path.join(root, '.cache/failed-downloads.txt'), failed.join('\n'));
console.log('done', done, 'failed', failed.length);
