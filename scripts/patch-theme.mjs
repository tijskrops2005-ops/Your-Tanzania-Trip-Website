// Small, idempotent patches to the downloaded theme JS so it works off the live domain.
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const file = path.join(root, 'public/wp-content/themes/tanzania-specialist/public/js/app.js');
let js = await fs.readFile(file, 'utf8');

const patches = [
  {
    name: 'search results: map live-site URLs to this site',
    from: 'return t.origin===window.location.origin?t.href:""',
    to: 'return t.origin===window.location.origin||/(^|\\.)tanzania-specialist\\.com$/.test(t.hostname)?window.location.origin+t.pathname+t.search+t.hash:""',
  },
];
for (const p of patches) {
  if (js.includes(p.to)) { console.log(`already applied: ${p.name}`); continue; }
  if (!js.includes(p.from)) throw new Error(`patch target not found: ${p.name}`);
  js = js.replace(p.from, p.to);
  console.log(`applied: ${p.name}`);
}
await fs.writeFile(file, js);
