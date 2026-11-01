// Writes content/lastmod.json: the date each page last changed, for the <lastmod> in the sitemap.
// A page's date is the commit that last touched its body (content/pages/<slug>.html); a page with
// uncommitted changes gets today's date. Vercel clones shallowly, so this runs locally (npm run rebrand)
// and the result is committed.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const pagesDir = "content/pages";
const git = (cmd) => execSync(`git ${cmd}`, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const today = new Date().toISOString().slice(0, 10);
const dates = {};

// One pass over the history: the first commit that names a file is its latest change.
const log = git(`log --format=%cI --name-only -- ${pagesDir}`);
let current = null;
for (const line of log.split("\n")) {
  if (/^\d{4}-\d{2}-\d{2}T/.test(line)) current = line.slice(0, 10);
  else if (line.startsWith(pagesDir + "/") && current && !(line in dates)) dates[line] = current;
}
// Dirty or new files change in the next commit.
for (const line of git("status --porcelain -- " + pagesDir).split("\n")) {
  const file = line.slice(3).trim();
  if (file) dates[file] = today;
}

const out = {};
for (const f of fs.readdirSync(path.join(root, pagesDir))) {
  if (!f.endsWith(".html")) continue;
  const slug = f.slice(0, -5);
  out[slug] = dates[`${pagesDir}/${f}`] || today;
}
fs.writeFileSync(path.join(root, "content/lastmod.json"), JSON.stringify(out, null, 1));
const changedToday = Object.values(out).filter((d) => d === today).length;
console.log(`lastmod: ${Object.keys(out).length} pages, ${changedToday} changed today`);
