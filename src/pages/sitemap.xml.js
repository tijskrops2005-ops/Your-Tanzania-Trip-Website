// /sitemap.xml: every indexable page (pages marked noindex are left out), for Google Search Console.
import fs from 'node:fs';
import { blogPostPages } from '../lib/blog-posts.js';

export function GET() {
  const pages = JSON.parse(fs.readFileSync(new URL('../../content/pages.json', import.meta.url), 'utf8'));
  const site = 'https://yourtanzaniatrip.com';
  const today = new Date().toISOString().slice(0, 10);
  const priority = (p) => (p === '/' ? '1.0' : /^\/(itineraries|tanzania-safari|zanzibar-holiday|climbing-kilimanjaro|tanzania-travel|our-partner)\//.test(p) ? '0.8' : /^\/blog\//.test(p) ? '0.6' : '0.5');
  const urls = pages
    .filter((p) => !(p.robots || '').includes('noindex'))
    .concat(blogPostPages)
    .map((p) => `  <url><loc>${site}${p.path}</loc><lastmod>${p.lastmod || today}</lastmod><priority>${priority(p.path)}</priority></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
