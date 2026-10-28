// Recolours and re-fonts the theme CSS and its coloured assets to the Your Tanzania Trip brand
// (docs/brand-tokens.json). Works from the untouched copies in .cache/theme-original/, so the
// result is the same every run. Runs after rebrand.mjs: `npm run rebrand`.
//
// Shapes stay as they are (brush masks, photo masks, button shapes); only colours and fonts change.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const tokens = JSON.parse(fs.readFileSync(path.join(root, "docs/brand-tokens.json"), "utf8"));
const C = Object.fromEntries(Object.entries(tokens.color).map(([k, v]) => [k, v.hex.toLowerCase()]));

const themeDir = path.join(root, "public/wp-content/themes/tanzania-specialist/public");
const original = path.join(root, ".cache/theme-original");
if (!fs.existsSync(original)) throw new Error("Missing .cache/theme-original (untouched theme copy)");

// Old colour -> brand colour. Keys are lower-case hex without '#'.
const colorMap = {
  "465b2d": C.forest, // green: headings, header bar, icons
  "3d1f17": C.forest, // brown: body text, titles
  "3c3c3b": C.forest, // anthracite: text
  "2c391c": C.mountain, // dark green (datepicker low season)
  "252525": C.forest, // near-black overlays
  "576d3d": C.mountain, // green-light: review cards, carousel edges
  "664537": C.mountain, // brown-light: bullets, placeholders
  "452f25": C["copper-dark"], // datepicker high season
  "2a1510": C["copper-dark"], // quiz CTA hover
  "cc4b25": C.copper, // red: buttons, links
  "b5421f": C["copper-dark"], // red hover
  "ffbe3d": C.gold, // yellow: highlights, stars, CTA buttons
  "cd9015": C.gold, // orange
  "9f7010": C.gold, // datepicker mid season
  "e4d8c6": C.sand, // sand: sections, borders
  "f7f4ee": C.ivory, // sand-light
  "f5f0ec": C.ivory, // beige
  "f8f4ee": C.ivory,
  "f7f3ee": C.ivory,
  "d4c4a8": C.sand, // quiz image panel
  "b6bdac": C.sand, // timeline dashes
  "b3a695": C.sand, // mobile chevron
  "8a7873": C.mountain, // placeholders
  "2563eb": C.gold, // Tailwind focus ring (form focus)
};
// rgb triplets written as "R G B" or "R,G,B" (Tailwind v3 and rgba forms)
const rgbMap = {
  "70 91 45": C.forest,
  "61 31 23": C.forest,
  "60 60 59": C.forest,
  "43 30 20": C.forest,
  "37 37 37": C.forest,
  "87 109 61": C.mountain,
  "102 69 55": C.mountain,
  "122 111 98": C.mountain,
  "122 110 99": C.mountain,
  "138 120 115": C.mountain,
  "204 75 37": C.copper,
  "255 190 61": C.gold,
  "205 144 21": C.gold,
  "228 216 198": C.sand,
  "213 201 186": C.sand,
  "179 166 149": C.sand,
  "214 208 196": C.sand,
  "247 244 238": C.ivory,
  "245 240 236": C.ivory,
  "238 238 238": C.ivory, // grey
  "59,130,246": C.gold, // default Tailwind ring colour
};

const hexToRgb = (hex) => hex.replace("#", "").match(/../g).map((h) => parseInt(h, 16));

function recolorCss(css) {
  // Base64 SVG data URIs: decode, recolour, re-encode.
  css = css.replace(/data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)/g, (all, b64) => {
    const svg = Buffer.from(b64, "base64").toString("utf8");
    return "data:image/svg+xml;base64," + Buffer.from(recolorPlain(svg), "utf8").toString("base64");
  });
  return recolorPlain(css);
}

function recolorPlain(s) {
  for (const [old, to] of Object.entries(colorMap)) {
    s = s.replace(new RegExp("#" + old + "\\b", "gi"), to);
    s = s.replace(new RegExp("#" + old + "(?=[0-9a-f]{2}\\b)", "gi"), to); // 8-digit hex with alpha

    s = s.replace(new RegExp("%23" + old + "\\b", "gi"), "%23" + to.slice(1));
  }
  for (const [old, to] of Object.entries(rgbMap)) {
    const [r, g, b] = hexToRgb(to);
    const parts = old.split(/[ ,]/);
    // "rgb(70 91 45" / "rgb(70 91 45/" and "rgba(70,91,45,"
    s = s.replace(new RegExp("rgba?\\(" + parts.join(" ") + "(?=[\\s/)])", "g"), `rgb(${r} ${g} ${b}`);
    s = s.replace(new RegExp("rgba?\\(" + parts.join(",\\s*") + "(?=[,)])", "g"), (m) => (m.startsWith("rgba") ? `rgba(${r},${g},${b}` : `rgb(${r},${g},${b}`));
  }
  return s;
}

// The theme's hover state was "turn brown/green": after recolouring both are the near-black forest,
// which is invisible on dark panels (forms, footer). Hover surfaces become mountain with white text.
function fixHovers(css) {
  const [mr, mg, mb] = hexToRgb(C.mountain);
  return css.replace(/([^{}]*:hover[^{]*)\{([^}]*)\}/g, (all, sel, body) => {
    if (!/background-color:rgb\(32 40 27/.test(body)) return all;
    body = body
      .replace(/background-color:rgb\(32 40 27\//g, `background-color:rgb(${mr} ${mg} ${mb}/`)
      .replace(/border-color:rgb\(32 40 27\//g, `border-color:rgb(${mr} ${mg} ${mb}/`)
      .replace(/color:rgb\(230 144 22\//g, "color:rgb(255 255 255/");
    return `${sel}{${body}}`;
  });
}

function refont(css) {
  return css
    .replace(/https?:\/\/(?:www\.)?tanzania-specialist\.com/g, "") // asset URLs become site-relative
    .replace(/@font-face\{[^}]*(?:museo-sans|dk-liquid-embrace)[^}]*\}/g, "")
    .replace(/museo-sans/g, "Inter")
    .replace(/dk-liquid-embrace/g, "Marcellus")
    .replace(/font-weight:900/g, "font-weight:700");
}

// 1. Theme CSS
const appCss = fs.readFileSync(path.join(original, "css/app.css"), "utf8");
fs.writeFileSync(path.join(themeDir, "css/app.css"), fixHovers(refont(recolorCss(appCss))));
for (const f of fs.readdirSync(path.join(original, "cache"))) {
  const css = fs.readFileSync(path.join(original, "cache", f), "utf8");
  fs.writeFileSync(path.join(root, "public/wp-content/cache/flying-press", f), fixHovers(refont(recolorCss(css))));
}

// 2. fonts.css: only the Gravity Forms icon font remains; Inter and Marcellus come from @fontsource.
const fontsCss = fs.readFileSync(path.join(root, "src/styles/fonts.css"), "utf8");
const iconFaces = (fontsCss.match(/@font-face\{[^}]*gform-icons-theme[^}]*\}/g) || []).join("\n");
fs.writeFileSync(path.join(root, "src/styles/fonts.css"), `/* Generated by scripts/brand-theme.mjs. Brand fonts are loaded from @fontsource in BaseLayout.astro. */\n${iconFaces}\n`);

// 3. Coloured SVG assets (the shapes stay; only the fill changes)
const svgMap = {
  "fill-masked-itinerary.svg": { "#f7f3ee": C.ivory },
  "fill-masked-widget.svg": { "#e4d8c6": C.sand },
  "mobile-menu-bg.svg": { "#E4D8C6": C.sand },
  "logo-hakuna-matata.svg": { "#465b2d": C.forest },
  "mask.svg": {},
  "mask-top.svg": {},
  "image-mask.svg": {},
};
for (const [file, map] of Object.entries(svgMap)) {
  let svg = fs.readFileSync(path.join(original, "images", file), "utf8");
  for (const [from, to] of Object.entries(map)) svg = svg.split(from).join(to);
  fs.writeFileSync(path.join(themeDir, "images", file), svg);
}

// 4. Coloured raster assets
const rasterMap = {
  "hover-bg.png": C.gold, // brush-shaped hover panel on trip cards
  "page-bg.png": "#f0e8d5", // soft blob behind sections, between ivory and sand
};
for (const [file, color] of Object.entries(rasterMap)) {
  execFileSync(fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : "python3", [path.join(root, "scripts/recolor-assets.py"), path.join(original, "images", file), path.join(themeDir, "images", file), color], { stdio: "inherit" });
}

// 5. Theme header comment (metadata only)
const styleCss = path.join(themeDir, "../style.css");
if (fs.existsSync(styleCss)) {
  fs.writeFileSync(styleCss, fs.readFileSync(styleCss, "utf8").replace(/Theme Name:(\s*)Tanzania Specialist/, "Theme Name:$1Your Tanzania Trip").replace(/Theme URI:(\s*)https:\/\/tanzaniaspecialist\.com/, "Theme URI:$1https://yourtanzaniatrip.com"));
}

// 6. Report
const out = fs.readFileSync(path.join(themeDir, "css/app.css"), "utf8");
const leftovers = ["#465b2d", "70 91 45", "#cc4b25", "204 75 37", "#ffbe3d", "255 190 61", "#e4d8c6", "#3d1f17", "museo-sans", "dk-liquid-embrace"].filter((k) => out.toLowerCase().includes(k));
console.log(`brand-theme: app.css recoloured (${(out.length / 1024).toFixed(0)} KB); leftovers: ${leftovers.length ? leftovers.join(", ") : "none"}`);
