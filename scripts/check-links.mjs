// Checks every internal href/src/srcset in dist/ (pages + ajax fragments + facet data) against dist/.
import fs from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '../dist');
const files = [];
async function walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!p.includes(`${path.sep}wp-content`)) await walk(p); }
    else if (/\.(html|json)$/.test(e.name)) files.push(p);
  }
}
await walk(dist);

const exists = new Map();
const check = async rel => {
  if (!exists.has(rel)) {
    let p = path.join(dist, decodeURIComponent(rel));
    exists.set(rel, fs.stat(p).then(s => s.isDirectory() ? fs.access(path.join(p, 'index.html')).then(() => true, () => false) : true, () => false));
  }
  return exists.get(rel);
};

const missing = new Map();
for (const f of files) {
  const text = (await fs.readFile(f, 'utf8')).replace(/\\\//g, '/');
  const urls = new Set();
  for (const [, , u] of text.matchAll(/\b(href|src)=["'](\/[^"'#?\s]*)/g)) urls.add(u);
  for (const [, set] of text.matchAll(/srcset=["']([^"']+)["']/g))
    for (const part of set.split(',')) { const u = part.trim().split(/\s+/)[0]; if (u.startsWith('/')) urls.add(u.split('?')[0]); }
  for (const u of urls) {
    if (u.startsWith('//') || u.startsWith('/wp-json') || u.startsWith('/wp-admin')) continue;
    if (!(await check(u))) {
      if (!missing.has(u)) missing.set(u, []);
      missing.get(u).push(path.relative(dist, f));
    }
  }
}
const list = [...missing].sort((a, b) => b[1].length - a[1].length);
console.log(`${files.length} files checked, ${list.length} missing targets`);
for (const [u, from] of list.slice(0, 60)) console.log(`${from.length}x\t${u}\t(e.g. ${from[0]})`);
