// Alt text for images that have none. Applied by scripts/rebrand.mjs to every page body.
// Rules, in order: a known file name, the caption of the figure the image sits in, the accommodation
// slide it belongs to, the heading of the card it links from. Images that stay without a text are
// listed by `node scripts/alt-text.mjs --report` (for docs/meta-report.md).
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const root = path.resolve(import.meta.dirname, "..");
const load = (html) => cheerio.load(html, { xml: { xmlMode: false, decodeEntities: false } }, false);

// File name (without size suffix) -> alt text. Photos were looked at or are named after their subject.
export const KNOWN = {
  "IM_TZ_SER_Guide-and-guests-looking-at-tree": "Guide and guests at a lake on the floor of the Ngorongoro Crater",
  "Serengetei-NP-2": "Hot-air balloon over wildebeest herds in the Serengeti",
  "baraka-dalali": "Baraka Dalali, founder of Kilimanjaro Nature Tours",
  "crew-summit": "The Kilimanjaro Nature Tours crew on the summit of Kilimanjaro",
  "safari-lions": "Lionesses and cubs walking down a track in the Serengeti",
  "safari-loop-poster": "Safari vehicle among wildlife on the plains",
  "Mara-River-3": "Wildebeest crossing the Mara River",
  "Kilimanjaro-Tanzania-full-view": "Mount Kilimanjaro with its snow-capped summit",
  "Ruaha-elephants-1900x640-1": "Elephants in Ruaha National Park",
  "Serengeti-Jeep": "Safari vehicle on the Serengeti plains",
  "Elephants-jeep-Tarangire": "Elephants beside a safari vehicle in Tarangire",
  "balloon_home": "Hot-air balloon flight over the Serengeti",
  "Accommodation-example-Tanzania-Specialist": "Example of a safari lodge room",
  "Mount-Kilimanjaro-snow-scaled": "Snow on the summit of Kilimanjaro",
  "Mount-Kilimanjaro-snow-1-scaled": "The summit of Kilimanjaro seen from the plains",
  "Elephant-calf-scaled": "Elephant calf in Tarangire National Park",
  "Design-with-right-dimensions-for-website-28529-scaled": "Wildlife on the plains of the central Serengeti",
  "Design-with-right-dimensions-for-website-281429-scaled": "Wildebeest herds in the northern Serengeti near the Mara River",
  "Design-with-right-dimensions-for-website-28329-4-scaled": "Lake Manyara National Park",
  "Rhino-Website-pics-scaled": "Black rhino in the Ngorongoro Crater",
  "IM_TZ_ZNZ_Flight-to-Zanzibar_View-from-flight28129": "The coast of Zanzibar seen from the plane",
  "Dhow--scaled": "Dhow sailing off a Zanzibar beach",
  "Plane-scaled": "Small plane on the runway at Zanzibar airport",
  "Relaxing-Day-in-Arusha-1": "A relaxed day at a lodge near Arusha",
  "Giraffes2C-zebras-scaled": "Giraffes and zebras in Arusha National Park",
  "Title-28329-scaled": "The Mount Meru waterfalls near Arusha",
  "Title-28129-5-scaled": "Departure from Kilimanjaro International Airport",
  "Title-28129-18.57.46-scaled": "Transfer to Kilimanjaro International Airport",
  "Title-28129-18.57.46-1-scaled": "Flight back to Dar es Salaam",
  "Machame-Route-7-days_Day-1-Climbers-hiking-through-tropical-rainforest-on-the-way-to-Machame-Camp-Website-pics-scaled": "Climbers hiking through the rainforest on the way to Machame Camp",
  "Shira-I-26-II-Camp-sign-1": "Shira Camp sign on Kilimanjaro",
  "Machame-Route-7-days_Day-3-Lava-Tower-Camp-sign-Website-pics-1-scaled": "Lava Tower Camp sign at 4,630 metres",
  "Machame-Route-7-days_Day-4-Descent-towards-Karanga-Valley-on-the-way-to-Karanga-Camp-Website-pics-scaled": "Descent into the Karanga Valley on the way to Karanga Camp",
  "Machame-Route-7-days_Day-5-Crew-Website-pics-scaled": "The Kilimanjaro Nature Tours crew on the Machame Route",
  "Uhuru-peak-sign-1-scaled": "The Uhuru Peak sign, the summit of Kilimanjaro",
  "Mweka-Gate-1": "Mweka Gate, the end of the Machame Route",
  "pexels-droneafrica-17732689-scaled": "Aerial view of a Zanzibar beach",
  "Dar-es-Salaam--scaled": "The skyline of Dar es Salaam",
  "Elephant-family-scaled": "Elephant family in Mikumi National Park",
  "Waterfall-Udzungwa-scaled": "The Sanje waterfalls in the Udzungwa Mountains",
  "Wild-dog-ruaha-NP-scaled": "African wild dog in Ruaha National Park",
  "Flight-to-Selous": "Light aircraft flight to Nyerere National Park",
  "Hippos-in-water-scaled": "Hippos in the Rufiji River, Nyerere National Park",
  "Tanzania-specialist69": "Small-group safari vehicle in northern Tanzania",
  "IM_TZ_TAR_Guests-and-guide-in-jeep-scaled": "Guests and their guide in the safari vehicle in Tarangire",
  "IM_TZ_SER_Guests-looking-through-their-binoculars-scaled": "Guests looking through binoculars on safari in the Serengeti",
  "IM_TZ_ARU_Arusha-city-aerial-view": "Aerial view of Arusha",
  "03.kilimanjaro_tanzania": "Climbers on the trail up Kilimanjaro",
  "07.kilimanjaro_tanzania": "Climbers at sunrise near the summit of Kilimanjaro",
  "North-Serengeti-2B-Great-Migration-28mara-crossing29-compressed": "Wildebeest crossing the Mara River in the northern Serengeti",
  "Great-Migration-in-Tanzania-English-1": "Map of the Great Migration through the Serengeti, month by month",
  "wildebeest": "Wildebeest herd on the Serengeti plains",
  "wildebeest-calf": "Newborn wildebeest calf in the southern Serengeti",
  "Wildebeest-Migration-Tierwanderung-2": "Columns of wildebeest crossing the plains during the migration",
  "Beach-and-shaded-area": "Beach with palm shade on Zanzibar's east coast",
  "Stone-town-view": "View over the rooftops of Stone Town",
  "Nakupenda-Sandbank_Snorkelling-scaled": "Snorkelling at the Nakupenda sandbank",
  "Jozani-Forest_Trees-and-path-scaled": "Path through Jozani Forest on Zanzibar",
  "Dolphin-Adventure_Dolphins-swimming-scaled": "Dolphins off the coast of Zanzibar",
  "Dhow-on-the-sand": "Dhow on the sand at low tide",
  "Jozani-Forest_Zanzibar-red-colobus-close-up-scaled": "Zanzibar red colobus monkey in Jozani Forest",
  "Prison-Island-Tour_Scuba-diving-scaled": "Diving near Prison Island",
  "Sunset-and-boat": "Sunset and a dhow off Zanzibar",
  "Sayari-Pool-with-lounge-area": "Pool and lounge area of a Zanzibar resort",
  "Guides": "Guides of Kilimanjaro Nature Tours in Arusha",
  "Hakuna-Matata-Icon-Roundle-FC": "Hakuna Matata Package icon",
  "IM_TZ_MAK_Giraffes-2-scaled-1": "Giraffes in the Makuyuni area between Arusha and Tarangire",
  "Hot-air-Balloon-Giraffe-from-Above-Website-pics-compressed": "Giraffe seen from a hot-air balloon",
  "Rondreis-tanzania-specialist-Tarangrire-1900x1000-1": "Safari in Tarangire National Park",
  "Lake-Manyara-Flamingo-Tanzania-Specialist-1900x1000-1": "Flamingos on Lake Manyara",
  "Tanzania-Specialist-safari-vehicule-1": "Safari vehicle with a pop-up roof",
  "DSC03002-2": "Travellers on safari in Tanzania",
};

const base = (src) =>
  (src || "")
    .split("/")
    .pop()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-\d+x\d+$/, "");

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

/** Adds alt text to images without one; returns the html and the file names still without text. */
export function applyAltText(html) {
  if (!/<img\b/i.test(html)) return { html, missing: [] };
  const $ = load(html);
  const missing = [];
  const auto = [];
  let changed = false;
  $("img").each((i, el) => {
    const img = $(el);
    if (clean(img.attr("alt"))) return;
    if (img.attr("role") === "presentation" || img.attr("aria-hidden") === "true") return;
    const src = img.attr("data-lazy-src") || img.attr("src") || "";
    if (!src || src.startsWith("data:")) {
      // lazy placeholder without a real source: nothing to describe
      if (!img.attr("data-lazy-src")) return;
    }
    const name = base(img.attr("data-lazy-src") || src);
    let alt = KNOWN[name] || KNOWN[name.replace(/-scaled$/, "")] || "";
    if (!alt) {
      const caption = clean(img.closest("figure").find("figcaption").first().text());
      const slide = clean(img.closest("[data-accommodation-title]").attr("data-accommodation-title")).replace(/^View /, "");
      const card = img.closest("a");
      const heading = card.length ? clean(card.find("h1,h2,h3,h4,.ts-item-overlay-title,.theme-card-title").first().text()) : "";
      alt = caption || slide || heading;
    }
    // Last resort: a readable version of the file name ("Leopard_Night-Game-Drive-Website-pics" ->
    // "Leopard night game drive"). Better than nothing; listed as "auto" in the report.
    if (!alt && name) {
      const words = name
        .replace(/(-|_)?(Website-pics|compressed|scaled|copy|final|new|e\d{10,})(?=[-_.]|$)/gi, "")
        .replace(/^(IM_TZ_[A-Z]{3}_|DSC_?\d*|IMG_?\d*|pexels-[a-z]+-\d+|unnamed)/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\d{1,4}x\d{1,4}\b/g, "")
        .replace(/\b(28\d{3}29|\d{4,})\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const junk = /design with right|^title\b|untitled|screenshot|schermafbeelding|^download|^image\b|^photo\b|^foto\b|^img\b|^dsc\b/i;
      if (words.length > 3 && /[a-z]{3}/i.test(words) && !junk.test(words)) {
        alt = words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
        auto.push(name);
      }
    }
    if (alt) {
      img.attr("alt", alt);
      changed = true;
    } else missing.push(name);
  });
  return { html: changed ? $.html() : html, missing, auto };
}

if (process.argv.includes("--report")) {
  const dir = path.join(root, "content/pages");
  const counts = {}, autos = {};
  let total = 0, autoTotal = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".html")) continue;
    const { missing, auto } = applyAltText(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const m of missing) { counts[m] = (counts[m] || 0) + 1; total++; }
    for (const m of auto) { autos[m] = (autos[m] || 0) + 1; autoTotal++; }
  }
  console.log(`images with an alt text derived from the file name: ${autoTotal} on ${Object.keys(autos).length} distinct files`);
  console.log(`images still without alt text: ${total} on ${Object.keys(counts).length} distinct files`);
  console.log("\nMost used file-name alts (file -> proposed text):");
  for (const [k, v] of Object.entries(autos).sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(String(v).padStart(4), k);
  if (total) { console.log("\nStill empty:"); for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(String(v).padStart(4), k); }
}
