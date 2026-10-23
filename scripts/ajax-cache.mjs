// Pre-fetches the HTML the theme loads through admin-ajax.php (practical-information tabs,
// accommodation modals, excursion modals) so it can be served statically from
// public/ajax/<action>/<post_id>.html. public/assets/js/static-ajax.js routes the requests there.
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ORIGIN = 'https://tanzania-specialist.com';
const localize = html => html
  .replace(/https?:\/\/tanzania-specialist\.com\/(?!wp-json|wp-admin)/g, '/')
  .replace(/https?:\\\/\\\/tanzania-specialist\.com\\\//g, '\\/')
  .replace(/<iframe\b[^>]*>/gi, tag => tag.replace(/\sdata-lazy-src=/, ' src='))
  .replace(/ flying-press-lazy-bg/g, '')
  // Cloudflare bot-check snippet injected into some responses.
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, tag => /cdn-cgi|__CF\$cv\$params/.test(tag) ? '' : tag);

// Scan page bodies and FacetWP item data for the elements that trigger each action.
const sources = [];
for (const f of await fs.readdir(path.join(root, 'content/pages'))) sources.push(await fs.readFile(path.join(root, 'content/pages', f), 'utf8'));
for (const f of await fs.readdir(path.join(root, 'public/facetwp-static')))
  sources.push(Object.values(JSON.parse(await fs.readFile(path.join(root, 'public/facetwp-static', f), 'utf8')).items).join('\n'));

const ids = { fetch_post_content: new Set(), fetch_modal_object: new Set(), fetch_inner_modal_object: new Set() };
const scan = html => {
  for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
    const id = (tag.match(/data-id="(\d+)"/) || [])[1];
    if (!id) continue;
    if (tag.includes('js-open-modal-link')) ids.fetch_modal_object.add(id);
    else if (tag.includes('js-excursions-toggle')) ids.fetch_inner_modal_object.add(id);
  }
  for (const [block] of html.matchAll(/id="sidebar-nav"[\s\S]*?<\/ul>/g))
    for (const [, id] of block.matchAll(/data-id="(\d+)"/g)) ids.fetch_post_content.add(id);
};
sources.forEach(scan);

const assets = new Set();
const jobs = Object.entries(ids).flatMap(([action, set]) => [...set].map(id => ({ action, id })));
let i = 0, done = 0, failed = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < jobs.length) {
    const { action, id } = jobs[i++];
    const file = path.join(root, 'public/ajax', action, `${id}.html`);
    try {
      const body = new URLSearchParams({ action, post_id: id });
      const res = await fetch(`${ORIGIN}/wp-admin/admin-ajax.php`, { method: 'POST', body, headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) site-rebuild' } });
      if (!res.ok) throw new Error(res.status);
      const html = localize(await res.text());
      for (const [a] of html.matchAll(/\/wp-(?:content|includes)\/[^"'\s,)\\?]+/g)) assets.add(ORIGIN + a);
      // Modals can contain further modal/excursion triggers.
      scan(html);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, html);
      done++;
    } catch (e) { failed++; console.log(`FAILED ${action} ${id}: ${e.message}`); }
  }
}));
await fs.writeFile(path.join(root, '.cache/ajax-assets.txt'), [...assets].join('\n') + '\n');
console.log(Object.fromEntries(Object.entries(ids).map(([k, v]) => [k, v.size])), `saved ${done}, failed ${failed}`);
