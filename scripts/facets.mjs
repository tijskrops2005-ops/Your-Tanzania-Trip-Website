// Pre-computes FacetWP filter data for every archive page so filtering works on the static site.
// For each page it asks the live site for: all items (default order and every sort option)
// and, per filter choice, which items match. Output: public/facetwp-static/<slug>.json,
// consumed by public/assets/js/facetwp-static.js.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public/facetwp-static');
await fs.mkdir(outDir, { recursive: true });
const pages = JSON.parse(await fs.readFile(path.join(root, 'content/pages.json'), 'utf8'));
const only = process.argv[2];

const ORIGIN = 'https://tanzania-specialist.com';
const localize = html => html
  .replace(/https?:\/\/tanzania-specialist\.com\/(?!wp-json|wp-admin)/g, '/')
  .replace(/<iframe\b[^>]*>/gi, tag => tag.replace(/\sdata-lazy-src=/, ' src='))
  .replace(/ flying-press-lazy-bg/g, '');

function encode(params, prefix, v) {
  if (Array.isArray(v)) v.forEach((x, i) => encode(params, `${prefix}[${i}]`, x));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => encode(params, `${prefix}[${k}]`, x));
  else params.append(prefix, v ?? '');
}

async function refresh(urlPath, facets, paged) {
  const body = new URLSearchParams();
  body.set('action', 'facetwp_refresh');
  encode(body, 'data', {
    facets, frozen_facets: {}, template: 'wp', extras: {}, soft_refresh: 0, is_bfcache: 0, first_load: 0, paged,
    http_params: { get: [], uri: urlPath.replace(/^\/|\/$/g, ''), url_vars: [] },
  });
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(ORIGIN + urlPath, { method: 'POST', body, headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) site-rebuild' } });
      const text = await res.text();
      return JSON.parse(text.slice(text.indexOf('{"facets')));
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

const itemKey = html => (html.match(/data-wishlist-post-id="(\d+)"/) || html.match(/href="([^"#][^"]*)"/) || [])[1];

// All items for one filter state, across every result page. Elements without a post key
// (e.g. the banner FacetWP's template repeats on each result page) are returned as inserts
// with their position on the page.
async function allItems(urlPath, facets) {
  const items = [], inserts = [];
  for (let paged = 1, total = 1; paged <= total; paged++) {
    const r = await refresh(urlPath, facets, paged);
    total = r.settings.pager.total_pages;
    const $ = cheerio.load(r.template);
    $('.facetwp-template').first().children().each((index, el) => {
      const html = localize($.html(el));
      if (itemKey(html)) items.push(html);
      else if (paged === 1) inserts.push({ index, html });
    });
  }
  items.inserts = inserts;
  return items;
}

async function build(page) {
  const script = page.extraScripts.find(s => s.includes('FWP_JSON'));
  const json = JSON.parse(script.match(/FWP_JSON = (\{.*?\});\s*(window\.FWP_HTTP|<\/script>)/s)[1]);
  const preload = json.preload_data;
  const choiceFacets = {}, sortFacets = {};
  for (const [name, html] of Object.entries(preload.facets)) {
    if (html.includes('facetwp-checkbox')) choiceFacets[name] = [...html.matchAll(/data-value="([^"]*)"/g)].map(m => m[1]);
    else if (html.includes('<select')) sortFacets[name] = [...html.matchAll(/<option value="([^"]*)"/g)].map(m => m[1]).filter(Boolean);
  }
  const empty = Object.fromEntries(Object.keys(preload.facets).map(n => [n, []]));

  const defaultItems = await allItems(page.path, empty);
  const items = {};
  for (const html of defaultItems) items[itemKey(html)] = html;
  const order = { '': defaultItems.map(itemKey) };
  for (const [name, values] of Object.entries(sortFacets))
    for (const v of values) order[v] = (await allItems(page.path, { ...empty, [name]: [v] })).map(itemKey);

  const matches = {};
  for (const [name, values] of Object.entries(choiceFacets)) {
    matches[name] = {};
    for (const v of values) matches[name][v] = (await allItems(page.path, { ...empty, [name]: [v] })).map(itemKey);
  }

  const data = { inserts: defaultItems.inserts, perPage: preload.settings.pager.per_page, sortFacets: Object.keys(sortFacets), items, order, matches };
  await fs.writeFile(path.join(outDir, page.slug + '.json'), JSON.stringify(data));
  return `${page.path}: ${defaultItems.length} items, ${Object.keys(choiceFacets).length} filters`;
}

const todo = pages.filter(p => p.extraScripts.some(s => s.includes('FWP_JSON')) && (!only || p.path === only));
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < todo.length) {
    const page = todo[i++];
    try { console.log(await build(page)); } catch (e) { console.log(`FAILED ${page.path}: ${e.message}`); }
  }
}));

// Images referenced by the pre-computed items, for download-assets.mjs.
const assets = new Set();
for (const f of await fs.readdir(outDir)) {
  const text = (await fs.readFile(path.join(outDir, f), 'utf8')).replace(/\\\//g, '/');
  for (const [a] of text.matchAll(/\/wp-(?:content|includes)\/[^"'\s,)\\?]+/g)) assets.add(ORIGIN + a);
}
await fs.writeFile(path.join(root, '.cache/facet-assets.txt'), [...assets].join('\n') + '\n');
