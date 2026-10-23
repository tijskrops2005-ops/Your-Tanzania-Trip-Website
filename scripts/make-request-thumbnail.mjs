// Renders the "Request a proposal at no charge" menu thumbnail in the brand style
// (replaces the old handwriting-font image). Output: public/brand/request-thumbnail.jpg (472x280).
import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const font = fs.readFileSync(path.join(root, "node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff2")).toString("base64");
const html = `<!doctype html><html><head><style>
@font-face{font-family:Marcellus;src:url(data:font/woff2;base64,${font}) format("woff2")}
html,body{margin:0}
body{width:472px;height:280px;background:#e69016;display:flex;align-items:center;justify-content:center}
p{margin:0;padding:0 36px;font:400 40px/1.2 Marcellus,serif;color:#20281b;text-align:center}
</style></head><body><p>Request a proposal at no charge</p></body></html>`;

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({ executablePath: fs.existsSync(chrome) ? chrome : undefined });
const page = await browser.newPage();
await page.setViewport({ width: 472, height: 280, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle0" });
await page.evaluateHandle("document.fonts.ready");
await page.screenshot({ path: path.join(root, "public/brand/request-thumbnail.jpg"), type: "jpeg", quality: 85 });
await browser.close();
console.log("public/brand/request-thumbnail.jpg written");
