// After `astro build` and ytt-finish: apply the 2026-11-23 brand and contact rules (src/lib/polish.js)
// to the plain-text files that are copied from public/ without passing through BaseLayout:
// llms.txt, llms-full.txt, the site search index and the cached AJAX fragments (dist/ajax/).
import fs from 'node:fs';
import path from 'node:path';
import { polishText, polishFragment } from '../src/lib/polish.js';

const tokens = JSON.parse(fs.readFileSync(new URL('../docs/brand-tokens.json', import.meta.url), 'utf8'));
const files = ['dist/llms.txt', 'dist/llms-full.txt', 'dist/search-index.json'];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  let after;
  if (file.endsWith('.json')) {
    // Rewrite string values only, so the JSON stays valid.
    const walk = v => typeof v === 'string' ? polishText(v, tokens)
      : Array.isArray(v) ? v.map(walk)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;
    after = JSON.stringify(walk(JSON.parse(before)));
  } else {
    after = polishText(before, tokens);
  }
  if (after !== before) fs.writeFileSync(file, after);
  console.log(`polish-finish: ${file} ${after === before ? 'unchanged' : 'updated'}`);
}

// Cached AJAX fragments (practical-information tabs and the like).
let fragments = 0;
const walkDir = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walkDir(path.join(dir, d.name)) : [path.join(dir, d.name)]) : [];
for (const file of walkDir('dist/ajax').filter(f => f.endsWith('.html'))) {
  const before = fs.readFileSync(file, 'utf8');
  const after = polishFragment(before, tokens);
  if (after !== before) { fs.writeFileSync(file, after); fragments++; }
}
console.log(`polish-finish: ${fragments} AJAX fragments updated`);
