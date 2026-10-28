// Re-renders the Hakuna Matata info cards and the "Four reasons" flyer in the Your Tanzania Trip
// style, with text that is true for Your Tanzania Trip and Kilimanjaro Nature Tours.
// Card photo + icon circle come from the original card (or a logo-free replacement photo);
// title and text are rendered in Marcellus / Inter. Originals stay in .cache/photos-original/.
// Usage: node scripts/render-cards.mjs
import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const UP = path.join(root, "public/wp-content/uploads");
const BACKUP = path.join(root, ".cache/photos-original");
const b64 = (p) => fs.readFileSync(p).toString("base64");
const font = (f) => b64(path.join(root, "node_modules/@fontsource", f));
const FONTS = `
@font-face{font-family:Marcellus;src:url(data:font/woff2;base64,${font("marcellus/files/marcellus-latin-400-normal.woff2")}) format("woff2")}
@font-face{font-family:Inter;font-weight:400;src:url(data:font/woff2;base64,${font("inter/files/inter-latin-400-normal.woff2")}) format("woff2")}
@font-face{font-family:Inter;font-weight:600;src:url(data:font/woff2;base64,${font("inter/files/inter-latin-600-normal.woff2")}) format("woff2")}`;

function original(rel) {
  const pub = path.join(UP, rel);
  const bak = path.join(BACKUP, rel);
  if (!fs.existsSync(bak)) {
    fs.mkdirSync(path.dirname(bak), { recursive: true });
    fs.copyFileSync(pub, bak);
  }
  return bak;
}

// PNG data URL of any image (AVIF/WebP included) via Pillow, so Chrome always decodes it.
function pngData(file, crop) {
  const out = path.join(root, ".cache/card-tmp.png");
  const py = `from PIL import Image\nim=Image.open(${JSON.stringify(file)}).convert('RGB')\n${crop ? `im=im.crop(${JSON.stringify(crop)})` : ""}\nim.save(${JSON.stringify(out)})`;
  execFileSync(fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : "python3", ["-c", py]);
  return "data:image/png;base64," + b64(out);
}

const CARDS = [
  {
    file: "2026/07/24_7-support-TS.avif", photoBottom: 1077, cy: 1054,
    title: "24/7 support", color: "#E69016",
    text: "Need help during your trip? Baraka’s team in Arusha and we in the Netherlands are reachable by phone, e-mail and WhatsApp, in English and Dutch.",
  },
  {
    file: "2026/07/Airport-meet-greet-TS.png", photoBottom: 1058, cy: 1037,
    photo: "2025/10/IM_TZ_TAR_Guests-and-guide-in-jeep-scaled.jpg",
    title: "Airport meet & greet", color: "#20281B",
    text: "A driver-guide from Kilimanjaro Nature Tours picks you up at the airport, so your first minutes in Tanzania are relaxed. At the end of your trip you are brought back for your flight.",
  },
  {
    file: "2026/07/Expert-guide-TS.png", photoBottom: 1075, cy: 1069,
    title: "Expert guide", color: "#E69016",
    text: "On safari a licensed local guide from Kilimanjaro Nature Tours shows you the country’s nature, history, wildlife and culture, and answers all your questions.",
  },
  {
    file: "2026/07/No-big-payments-TS.png", photoBottom: 1058, cy: 1037,
    title: "Clear payments", color: "#20281B",
    text: "You pay a deposit when you confirm your trip and the balance before departure. The amounts and dates are on your proposal and invoice, with no surprises afterwards.",
  },
  {
    file: "2026/07/Safe-on-the-road-TS.avif", photoBottom: 1105, cy: 1054,
    photo: "2024/06/Safari-Jeep-lion.jpg",
    title: "Safe on the road", color: "#E69016",
    text: "You travel in a private 4×4 with an experienced driver-guide who knows the roads. The vehicles are checked before every trip, and if one breaks down a replacement is arranged.",
  },
];

const CARD_HTML = (c, photo, circle) => `<!doctype html><html><head><style>${FONTS}
html,body{margin:0}
.card{position:relative;width:1587px;height:2245px;background:#f5f0ec;overflow:hidden}
.photo{position:absolute;left:0;top:0;width:1587px;height:${c.photoBottom}px;background:url(${photo}) center/cover no-repeat}
.circle{position:absolute;left:${(1587 - 250) / 2}px;top:${c.cy - 125}px;width:250px;height:250px;border-radius:50%;background:url(${circle}) center/cover no-repeat;box-shadow:0 0 0 6px #fff}
.body{position:absolute;left:160px;right:160px;top:${c.photoBottom + 210}px;text-align:center}
h1{margin:0 0 56px;font:400 118px/1.05 Marcellus,serif;white-space:nowrap;color:${c.color};letter-spacing:.01em}
p{margin:0;font:400 64px/1.55 Inter,sans-serif;color:#4a4f45}
</style></head><body><div class="card"><div class="photo"></div><div class="circle"></div>
<div class="body"><h1>${c.title}</h1><p>${c.text}</p></div></div></body></html>`;

const FLYER = {
  file: "2026/07/TS_EN-724x1024.png",
  icons: [[322, 190, 80, 80], [322, 412, 80, 72], [320, 606, 84, 70], [330, 776, 64, 60]],
  items: [
    ["Planned with care, run by locals", "Planned with you from the Netherlands, operated on the ground by Kilimanjaro Nature Tours in Arusha. Personally selected lodges and activities. Private 4×4 safari vehicles with pop-up roofs."],
    ["Personal service", "You are never alone. You plan with us in English or Dutch; Baraka’s crew looks after you in Tanzania."],
    ["African dream holidays, made easy", "You tell us your wishes, we make it happen. 100% tailored to your needs."],
    ["Worry-free travel", "Honest, transparent pricing. We take care of everything."],
  ],
};

async function main() {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await puppeteer.launch({ executablePath: fs.existsSync(chrome) ? chrome : undefined });
  const page = await browser.newPage();

  for (const c of CARDS) {
    const orig = original(c.file);
    const photo = c.photo ? pngData(path.join(UP, c.photo)) : pngData(orig, [0, 0, 1587, c.photoBottom]);
    const circle = pngData(orig, [793 - 125, c.cy - 125, 793 + 125, c.cy + 125]);
    await page.setViewport({ width: 1587, height: 2245 });
    await page.setContent(CARD_HTML(c, photo, circle), { waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");
    const shot = path.join(root, ".cache/card-shot.png");
    await page.screenshot({ path: shot, clip: { x: 0, y: 0, width: 1587, height: 2245 } });
    const dest = path.join(UP, c.file);
    // Write the card and every WordPress size variant of it (name-WxH.ext), so srcset never serves the old one.
    execFileSync(fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : "python3", ["-c", `
import os, re
from PIL import Image
dest = ${JSON.stringify(dest)}
im = Image.open(${JSON.stringify(shot)}).convert('RGB')
d, n = os.path.split(dest); stem, ext = os.path.splitext(n)
q = {'quality': 72} if ext == '.avif' else {}
im.save(dest, **q)
for f in os.listdir(d):
    m = re.fullmatch(re.escape(stem) + r'-(\\d+)x(\\d+)' + re.escape(ext), f)
    if m:
        w, h = int(m.group(1)), int(m.group(2))
        im.resize((w, h), Image.LANCZOS).save(os.path.join(d, f), **q)
`]);
    console.log("card", c.file);
  }

  // Flyer: our logo, the same four themes with true text, icons from the original.
  const orig = original(FLYER.file);
  const logo = "data:image/png;base64," + b64(path.join(root, "public/brand/logo-primary.png"));
  const icons = FLYER.icons.map((r) => pngData(orig, [r[0], r[1], r[0] + r[2], r[1] + r[3]]));
  const html = `<!doctype html><html><head><style>${FONTS}
html,body{margin:0}
.f{width:724px;height:1024px;background:#fff;text-align:center;font-family:Inter,sans-serif;color:#20281B;box-sizing:border-box;padding:40px 56px 0;display:flex;flex-direction:column}
img.logo{height:84px;margin:0 auto}
.sub{margin:16px 0 4px;font:600 15px Inter;letter-spacing:.12em;text-transform:uppercase;color:#355248}
h1{margin:0 0 34px;font:400 34px Marcellus,serif;color:#A83800}
.i{margin:0 0 30px}
.i img{height:78px;display:block;margin:0 auto 10px}
h2{margin:0 0 8px;font:600 22px Inter}
p{margin:0;font:400 16px/1.5 Inter;color:#3c4237}
</style></head><body><div class="f"><img class="logo" src="${logo}"><div class="sub">Your guide to Tanzania’s wonders</div><h1>Four reasons to travel with us</h1>
${FLYER.items.map((it, k) => `<div class="i"><img src="${icons[k]}"><h2>${it[0]}</h2><p>${it[1]}</p></div>`).join("")}
</div></body></html>`;
  await page.setViewport({ width: 724, height: 1024, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluateHandle("document.fonts.ready");
  await page.screenshot({ path: path.join(UP, FLYER.file), clip: { x: 0, y: 0, width: 724, height: 1024 } });
  console.log("flyer", FLYER.file);
  await browser.close();
  for (const f of [".cache/card-tmp.png", ".cache/card-shot.png"]) fs.rmSync(path.join(root, f), { force: true });
}

main();
