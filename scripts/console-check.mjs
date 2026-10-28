// Visits a sample of every page type on the local build and reports JavaScript errors,
// failed requests and console errors. Usage: node scripts/console-check.mjs [baseUrl]
import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] || "http://localhost:3000";
const pages = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../content/pages.json"), "utf8")).map((p) => p.path);
const pick = (re, n) => pages.filter((p) => re.test(p)).slice(0, n);
const urls = [
  ...new Set([
    "/", "/travel-proposal/", "/contact/", "/our-partner/", "/about-tanzania-specialist/", "/tanzania-traveller-reviews/",
    "/tanzania-safari/", "/zanzibar-holiday/", "/climbing-kilimanjaro/", "/blog/", "/accommodations/", "/activities/",
    "/national-parks-tanzania/", "/hakuna-matata-package/", "/travel-quiz/", "/wishlist/", "/faqs/tanzania/", "/practical-information/",
    ...pick(/^\/itineraries\/[^/]+\/$/, 3), ...pick(/^\/itineraries\/[^/]+\/(itinerary|prices|request-this-trip)\/$/, 3),
    ...pick(/^\/blog\/.+/, 3), ...pick(/^\/national-parks\/.+/, 2), ...pick(/^\/accommodation\/.+/, 2), ...pick(/^\/activity\/.+/, 2), ...pick(/^\/islands\/.+/, 1),
  ]),
];

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({ executablePath: fs.existsSync(chrome) ? chrome : undefined });
const report = {};
for (const u of urls) {
  const page = await browser.newPage();
  const issues = [];
  page.on("pageerror", (e) => issues.push("JS: " + String(e.message || e).split("\n")[0].slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) issues.push("console: " + m.text().slice(0, 200)); });
  page.on("requestfailed", (r) => { const url = r.url(); if (!/google-analytics|googletagmanager|doubleclick|facebook|hotjar|clarity|_vercel/.test(url)) issues.push("failed: " + url.slice(0, 160) + " " + (r.failure() || {}).errorText); });
  page.on("response", (r) => { if (r.status() >= 400 && !/_vercel/.test(r.url())) issues.push(`HTTP ${r.status()}: ${r.url().slice(0, 160)}`); });
  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(base + u, { waitUntil: "networkidle2", timeout: 60000 });
    await page.mouse.move(200, 300);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } });
    await new Promise((r) => setTimeout(r, 1200));
  } catch (e) {
    issues.push("load: " + e.message);
  }
  report[u] = [...new Set(issues)];
  await page.close();
}
await browser.close();
const bad = Object.entries(report).filter(([, v]) => v.length);
for (const [u, v] of bad) { console.log(u); for (const i of v.slice(0, 8)) console.log("   " + i); }
console.log(`console-check: ${urls.length} pages, ${bad.length} with issues`);
