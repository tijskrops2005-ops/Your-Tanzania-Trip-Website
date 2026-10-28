// Extracts the rewritable text blocks of the informative pages (blogs, parks, activities,
// practical information, destination pages) into .cache/rewrite-src/<slug>.json so they can be
// paraphrased. scripts/rebrand.mjs splices the paraphrases in content/rewrites/<slug>.json back in.
//
// A block is the inner HTML of a <p>, <h2>, <h3>, <h4> or <li> inside a ts-prose container.
// Forms, images, partner blocks and very short fragments are left alone.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "content/pages");
const out = path.join(root, ".cache/rewrite-src");
fs.mkdirSync(out, { recursive: true });

const SKIP_PREFIX = ["itineraries__", "accommodation__", "wishlist", "travel-proposal", "travel-quiz", "newsletter", "processing-your-payment", "privacy-policy", "terms-conditions", "sustainability-policy", "review-your-opinion-matters", "contact", "our-partner", "app", "tanzania-traveller-reviews", "about-tanzania-specialist", "practical-information__guarantees"];
const SKIP_TEXT = /Kilimanjaro Nature Tours|Tripadvisor|Baraka|Your Tanzania Trip is run by|Edrian|gfield|<input|<img|<iframe|<svg|<form|<select|<button/;

function matchDiv(s, start) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(s))) {
    depth += m[0] === "<div" ? 1 : -1;
    if (depth === 0) return m.index + m[0].length;
  }
  return -1;
}

export function extractBlocks(html) {
  const blocks = [];
  const seen = new Set();
  const re = /<div class="[^"]*\bts-prose\b[^"]*"[^>]*>/g;
  let m;
  while ((m = re.exec(html))) {
    const end = matchDiv(html, m.index);
    if (end === -1) continue;
    const region = html.slice(m.index, end);
    const bre = /<(p|h2|h3|h4|li)\b([^>]*)>([\s\S]*?)<\/\1>/g;
    let b;
    while ((b = bre.exec(region))) {
      const inner = b[3];
      const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length < 40 || SKIP_TEXT.test(inner) || /<(p|li|div)\b/.test(inner)) continue;
      if (seen.has(inner)) continue;
      seen.add(inner);
      blocks.push({ id: blocks.length + 1, tag: b[1], html: inner });
    }
    re.lastIndex = end;
  }
  return blocks;
}

import { fileURLToPath } from "node:url";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let pages = 0, total = 0;
  const index = [];
  for (const f of fs.readdirSync(src).sort()) {
    if (!f.endsWith(".html")) continue;
    const slug = f.slice(0, -5);
    if (SKIP_PREFIX.some((p) => slug === p || slug.startsWith(p))) continue;
    const blocks = extractBlocks(fs.readFileSync(path.join(src, f), "utf8"));
    if (blocks.length < 3) continue;
    fs.writeFileSync(path.join(out, slug + ".json"), JSON.stringify({ slug, blocks }, null, 1));
    const words = blocks.reduce((n, b) => n + b.html.split(/\s+/).length, 0);
    index.push({ slug, blocks: blocks.length, words });
    pages++;
    total += blocks.length;
  }
  fs.writeFileSync(path.join(out, "_index.json"), JSON.stringify(index, null, 1));
  console.log(`rewrite-extract: ${pages} pages, ${total} blocks, ${index.reduce((n, p) => n + p.words, 0)} words`);
}
