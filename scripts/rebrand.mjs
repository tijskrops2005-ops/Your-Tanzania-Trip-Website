// Rebrands the freshly extracted site (content/, src/partials/, public/ajax, public/facetwp-static)
// to Your Tanzania Trip. Runs right after extract.mjs; brand-theme.mjs handles colours and fonts.
// Everything comes from docs/brand-tokens.json; nothing about the business is invented here.
//
// What it changes
//  - brand name, domain, e-mail addresses, phone numbers, company details (address, KvK, VAT)
//  - logos (public/brand/), favicons are set in BaseLayout.astro
//  - the old operator's review scores, badges and review cards -> the local partner's attributed score
//  - former founders, sister company and memberships -> owner facts or visible [FILL] placeholders
//  - header/footer chrome, a home-page partner section and the /our-partner/ page
//  - pages removed by the rebrand get redirects (content/redirects-brand.json)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tokens = JSON.parse(fs.readFileSync(path.join(root, "docs/brand-tokens.json"), "utf8"));
const CO = tokens.company;
const P = tokens.partner;
const BRAND = CO.brand;
const DOMAIN = CO.domain;
const SITE = `https://${DOMAIN}`;
const isFill = (v) => typeof v === "string" && v.startsWith("[FILL");
const PHONE_TEL = "tel:" + CO.phone.replace(/[^\d+]/g, "");
const PARTNER_REVIEWS_HREF = isFill(P.tripadvisor.url) ? "/our-partner/" : P.tripadvisor.url;
const PARTNER_REVIEWS_TARGET = isFill(P.tripadvisor.url) ? "" : ' target="_blank" rel="noopener noreferrer"';

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------
function walk(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

/** End index (exclusive) of the <div> that opens at `start`, counting nested divs. */
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

/** Replace every <div …> matching `openRe` (and its subtree) with `replacement`; `test` filters by inner HTML. */
function replaceDivs(s, openRe, replacement, test = () => true) {
  const re = new RegExp(openRe.source, "g");
  let out = "", last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index < last) continue;
    const end = matchDiv(s, m.index);
    if (end === -1) break;
    const inner = s.slice(m.index, end);
    if (test(inner)) {
      out += s.slice(last, m.index) + (typeof replacement === "function" ? replacement(inner) : replacement);
      last = end;
      re.lastIndex = end;
    }
  }
  return out + s.slice(last);
}

// ---------------------------------------------------------------------------------------------
// Text rules (order matters)
// ---------------------------------------------------------------------------------------------
const oldPhones = ["15186341139", "442038084213", "255786447455", "255688592339", "31174352016", "33257280079", "34932206115", "494087407061", "255695164515"];
const phoneText = oldPhones.map((d) => [new RegExp("\\+?\\(?" + d.split("").join("[\\s\\u00a0.()-]{0,2}") + "(?!\\d)", "g"), CO.phone]);
const phoneHref = [new RegExp("tel:\\+?(?:" + oldPhones.join("|") + ")", "g"), PHONE_TEL];

const brandRules = [
  [/Tanzania Specialist B\.V\./g, BRAND],
  [/Tanzania Specialist(’s|'s|&#8217;s|&#039;s)/g, `${BRAND}$1`],
  [/Tanzania Specialist/g, BRAND],
  [/TANZANIA SPECIALIST/g, BRAND.toUpperCase()],
  [/Tanzania_Specialist/g, "Your_Tanzania_Trip"],
  [/\bTanzaniaSpecialist\.com\b/gi, DOMAIN],
  [/https?:\/\/test\.tanzania-specialist\.com\//g, "/"],
  [/https?:\/\/(?:www\.)?tanzania-specialist\.com/g, SITE],
  [/tanzania-specialist\.com/g, DOMAIN],
  [/@tanzaniaspecialist\.com/g, `@${DOMAIN}`],
  [/@tanzaniaspecialist\.co\.tz/g, `@${DOMAIN}`],
  [/https?:\/\/(?:www\.)?facebook\.com\/tanzaniaspecialist\/?/g, "#"],
  [/https?:\/\/tanzania(?:-)?specialist\.(?:com|nl|de|fr|es|dk|no|it|se)(?:\/[^"'\s]*)?/g, "/"],
  [/The specialist in Tanzania safari/g, BRAND],
  [/Tanzania Specialist logo/g, `${BRAND} logo`],
  // lower-case "Tanzania specialist(s)" in running text; the brand name itself is handled above
  [/\b[Tt]anzania specialists?\b/g, "Tanzania experts"],
  [/\ba Your Tanzania Trip\b/g, "our"],
  [/\bA Your Tanzania Trip\b/g, "Our"],
];

const contactRules = [
  phoneHref,
  ...phoneText,
  [/[a-z0-9._-]+@yourtanzaniatrip\.com/gi, CO.email],
  [/careers@africasafaritrips\.com/g, CO.email],
  [/<strong>Socratesstraat 1,<\/strong>\s*2675 XD,?\s*Honselersdijk,?\s*The Netherlands/g, `<strong>Sluitgatweg 10,</strong> 8308 RE Nagele, The Netherlands`],
  [/Socratesstraat 1[^<]{0,40}Honselersdijk[^<]{0,30}Netherlands/g, "Sluitgatweg 10, 8308 RE Nagele, The Netherlands"],
  [/<p>Socratesstraat 1<\/p>\s*<p>2675 ?XD (?:Honselersdijk|Nagele)<\/p>/g, "<p>Sluitgatweg 10</p>\n<p>8308 RE Nagele</p>"],
  [/<p><strong>Rabobank<\/strong><\/p>\s*<p>Croeselaan 18<\/p>\s*<p>3521 CB Utrecht<\/p>/g, "<p>[FILL: bank name and address]</p>"],
  [/\bHonselersdijk\b/g, "Nagele"],
  [/<strong>Mlimani Mateves[^<]*<\/strong>[^<]*Arusha,? Tanzania/g, `<strong>${P.name} (our local partner)</strong> ${P.postal}, Tanzania`],
  [/Mlimani Mateves[^<]*Arusha,? Tanzania/g, `${P.name} (our local partner), ${P.postal}, Tanzania`],
  [/\b65050401\b/g, CO.kvk],
  [/NL ?8559 ?61 ?351 ?B\.?01/g, CO.vat],
  [/NL39 RABO 0308 5684 78/g, "[FILL: IBAN]"],
  [/\bRABONL2U\b/g, "[FILL: BIC]"],
  [/\s*\(Rabobank\)/g, ""],
  [/\s*\((?:<span[^>]*>)?NL and (?:<span[^>]*>)?RABO written in letters, the rest are numbers\)?(?:<\/span>)?/g, ""],
  [/\s*\((?:<span[^>]*>)?RABO is all letters(?:<\/span>)?\)/g, ""],
  [/\s*<p><em>\(NL and RABO[^<]*\)<\/em><\/p>/g, ""],
  [/\s*\(NL and RABO[^)<]*\)/g, ""],
];

const founderRules = [
  // quotes and portraits attributed to the former founders go, before the names are replaced
  [/<blockquote>[\s\S]*?Robbin Meulemans[\s\S]*?<\/blockquote>/g, ""],
  [/<p>\s*<img[^>]*Robbin-Meulemans-and-Epimark-Bernard[^>]*>\s*<\/p>/g, ""],
  [/<img[^>]*Robbin-Meulemans-and-Epimark-Bernard[^>]*>/g, ""],
  [/<a href="\/blog\/5-questions-with-[^"]*">([^<]*)<\/a>/g, "$1"],
  [/(?<![/_-])\bRobbin Meulemans\b(?![-_])/g, "our founder"],
  [/(?<![/_-])\bEpimark Bernard\b(?![-_])/g, "our team in Arusha"],
  [/(?<![/_-])\bRobbin\b(?![-_])/g, "our founder"],
  [/(?<![/_-])\bEpimark\b(?![-_])/g, "our team in Arusha"],
  [/(?<![/_-])\bMeulemans\b(?![-_])/g, "our founder"],
];

const sisterRules = [
  [/\s*In addition, we may occasionally inform you about[^.]*Africa Safari Trips[^.]*\.(\s*These communications[^.]*\.)?/g, ""],
  [/\(in collaboration with our sister company <a[^>]*>Africa Safari Trips<\/a>\)/g, "(together with our partners in East Africa)"],
  [/for Your Tanzania Trip and Africa Safari Trips/g, `for ${BRAND}`],
  [/Your Tanzania Trip (?:&amp;|and) Africa Safari Trips/g, BRAND],
  [/\s*by Africa Safari Trips/g, ""],
  [/<a[^>]*africasafaritrips\.com[^>]*>([\s\S]*?)<\/a>/g, "$1"],
  [/https?:\/\/(?:www\.)?africasafaritrips\.com[^"'\s<)]*/g, "/"],
  [/\bAfrica Safari Trips\b/g, "our partners in East Africa"],
  [/our sister company,? our partners in East Africa,?/g, "our partners in East Africa"],
];

const PROTECTION_FILL = "[FILL: package-travel protection / insolvency cover, if any]";
const membershipRules = [
  // Repair file names an earlier (unguarded) run touched in persisted ajax fragments.
  [/uploads\/(\d{4}\/\d{2})\/\[FILL: sustainability certification\]/g, "uploads/$1/Travelife"],
  [/we are an active member of the SGR[\s\S]*?Certificate can be viewed via this link: <a[^>]*>[^<]*<\/a>\.?/g, `we will list our package-travel protection here: ${PROTECTION_FILL}.`],
  // Claims of being bonded under the old operator's guarantee fund (About, Terms)
  [/Your Tanzania Trip is fully accredited and bonded under the\s*(?:<a[^>]*>)?Dutch SGR\s*(?:<\/a>)?\((?:<a[^>]*>)?ATOL(?:<\/a>)?\s*in the UK\), which secures all online payments\./g, `Package-travel protection: ${PROTECTION_FILL}.`],
  [/All payments you make to us will be secured by SGR, as Your Tanzania Trip is a fully accredited and bonded SGR member \(SGR number: 3700\)\.\s*You can find more information about this certificate\s*(?:<\/span>|<span[^>]*>|<a[^>]*>|<\/a>)*here(?:<\/span>|<span[^>]*>|<\/a>)*\.?/g, `Package-travel protection: ${PROTECTION_FILL}.`],
  [/<a[^>]*href="https?:\/\/(?:www\.)?(?:sgr|anvr)\.nl[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1"],
  [/<img[^>]*(?:ANVR_logo|logo-sgr|sgr-logo|anvr-logo|Travelife_logo|partner-Travelife)[^>]*\/?>/g, ""],
  [/\s*More information can be found on https?:\/\/(?:www\.)?sgr\.nl[^\s<]*/g, ""],
  [/\bSGR-3700\b/g, "[FILL: member number]"],
  // Text only: file names and URLs with these words stay intact.
  [/(?<![/_-])\bANVR\b(?![-_])/g, "[FILL: travel association]"],
  [/(?<![/_-])\bSGR\b(?![-_])/g, "[FILL: travel guarantee fund]"],
  [/<li\b[^>]*>\s*<a[^>]*travelife-partner-status[^>]*>[\s\S]*?<\/a>\s*<\/li>\s*/g, ""],
  [/Travelife Partner Status/g, "[FILL: sustainability certification]"],
  [/(?<![/_-])\bTravelife\b(?![-_])/g, "[FILL: sustainability certification]"],
];

const reviewRules = [
  // YouTube videos of the old operator (its logo is in every thumbnail and video), with the headings that introduce them
  [/<h[2-4][^>]*>[^<]*(?:video is worth|worth watching|watching this video)[^<]*<\/h[2-4]>\s*/gi, ""],
  [/<h[2-4][^>]*>The (?:Tanzania Specialist|Your Tanzania Trip) Kilimanjaro Preparation Guide<\/h[2-4]>\s*(?=(?:<p>\s*)?<span class='flying-press-youtube')/g, ""],
  [/<p>\s*<span class='flying-press-youtube'[\s\S]*?<\/span>\s*<\/p>/g, "<!--VIDEO-->"],
  [/<span class='flying-press-youtube'[\s\S]*?<\/span>/g, "<!--VIDEO-->"],
  [/<iframe[^>]*youtube(?:-nocookie)?\.com\/embed\/[^>]*>\s*<\/iframe>/g, ""],
  [/<h[2-4][^>]*>\s*Curious for more\? You won(?:’|'|&#8217;)t regret watching this video\s*<\/h[2-4]>/g, ""],
  [/<a class="ts-award[^"]*"[\s\S]*?<\/a>/g, ""],
  [/<img[^>]*(?:Tripadvisor-TC-Badge|Tripadvisor-travellers-choice|tripadvisor-tc-badge|tripadvisorlogo|tripadvisor-tc-title)[^>]*\/?>/g, ""],
  [/<a[^>]*>\s*<\/a>/g, ""],
  [/https?:\/\/(?:www\.)?tripadvisor\.[a-z.]+\/[^"'\s<]*d12997236[^"'\s<]*/g, PARTNER_REVIEWS_HREF],
  [/https?:\/\/(?:www\.)?tripadvisor\.[a-z.]+\/ShowUserReviews[^"'\s<]*/g, PARTNER_REVIEWS_HREF],
  [/https?:\/\/g\.co\/kgs\/[^"'\s<]*/g, "/our-partner/"],
  [/https?:\/\/www\.google\.[a-z.]+\/maps\/place\/[^"'\s<]*/g, "/our-partner/"],
  [/https?:\/\/www\.google\.[a-z.]+\/search\?[^"'\s<]*tanzania\+specialist[^"'\s<]*/g, "/our-partner/"],
  [/Travell?ers(?:’|'|&#8217;|&#039;)? Choice(?: Award)?(?: \d{4})?/g, "[FILL: award]"],
  [/<i>\s*Based on <u>(?:5247|1689)\+ reviews<\/u>\s*<\/i>/g, ""],
  // USP bar under the hero: the 5-star claim belongs to the partner
  [/5-star customer reviews/g, `Local partner rated ${P.tripadvisor.score}/${P.tripadvisor.scale}`],
  [/\b(?:5247|1689)\+ reviews\b/g, "[FILL: review count]"],
  // Park pages: "Tripadvisor experiences" heading over the (now removed) old profile link
  [/<h4>Tripadvisor experiences<\/h4>\s*<p>\s*<\/p>/g, ""],
];

const svgColorRules = [
  [/#465b2d\b/gi, tokens.color.forest.hex],
  [/#3d1f17\b/gi, tokens.color.forest.hex],
  [/#3c3c3b\b/gi, tokens.color.forest.hex],
  [/#ffbe3d\b/gi, tokens.color.gold.hex],
  [/#cc4b25\b/gi, tokens.color.copper.hex],
  [/#b6bdac\b/gi, tokens.color.sand.hex],
  [/#e4d8c6\b/gi, tokens.color.sand.hex],
  [/#f7f4ee\b/gi, tokens.color.ivory.hex],
];

const allRules = [...brandRules, ...contactRules, ...founderRules, ...sisterRules, ...membershipRules, ...reviewRules, ...svgColorRules];

function rebrandText(s) {
  for (const [re, to] of allRules) s = s.replace(re, to);
  for (const [re, to] of imageRules) {
    s = s.replace(re, to);
    // The same paths inside JSON strings, where slashes are escaped
    s = s.replace(new RegExp(re.source.replace(/\\\//g, "(?:\\\\\\\\)?\\/"), re.flags), to.replace(/\//g, "\\/"));
  }
  // Sentence starts after the founder replacements.
  s = s.replace(/(^|[.!?]\s+|<p>|<h\d[^>]*>|<li>|<em>)our (founder|team in Arusha)/g, (m, pre, rest) => `${pre}Our ${rest}`);
  return s;
}

// ---------------------------------------------------------------------------------------------
// Partner markup (theme classes, so it looks like the rest of the site)
// ---------------------------------------------------------------------------------------------
const star = (cls = "text-yellow", size = 16) =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .587l3.668 7.431 8.199 1.191-5.914 5.88 1.398 8.174L12 18.897l-7.351 3.86 1.398-8.174-5.914-5.88 8.199-1.191z"/></svg>`;
const stars = (n = 5, cls, size) => Array.from({ length: n }, () => star(cls, size)).join("");
const fillSpan = (v) => String(v).replace(/\[FILL:[^\]]*\]/g, (m) => `<span class="fill-marker">${m}</span>`);

const scoreLine = () => `${P.tripadvisor.score}/${P.tripadvisor.scale} on Tripadvisor · ${P.tripadvisor.count} reviews · checked ${fillSpan(P.tripadvisor.checkedOn)}`;

function headerTrustItem() {
  return `<div class="flex relative gap-4 items-center md:gap-6 lg:mx-auto">
  <a href="${PARTNER_REVIEWS_HREF}"${PARTNER_REVIEWS_TARGET} class="flex items-center gap-3 text-white partner-line">
    <span class="i-cib-tripadvisor text-2xl" aria-hidden="true"></span>
    <span class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 14)}</span>
    <span class="hidden md:inline"><strong>${P.tripadvisor.score}/${P.tripadvisor.scale}</strong> · ${P.tripadvisor.count} reviews of our local partner ${P.name}</span>
    <span class="sr-only">Tripadvisor score checked ${P.tripadvisor.checkedOn}</span>
  </a>
</div>
`;
}

function footerBand() {
  return `<div class="text-white ts-mask-bottom bg-green">
  <div class="flex flex-col gap-6 px-5 py-10 mx-auto max-w-7xl container-2xl lg:flex-row lg:items-center lg:justify-between lg:py-6">
    <a href="/our-partner/" class="flex items-center text-lg font-black tracking-widest text-white uppercase md:text-xl lg:text-lg">
      Your trip is run on the ground by ${P.name}, Arusha
      <span class="hidden flex-shrink-0 justify-center items-center ml-5 w-10 h-10 bg-white rounded-full md:flex" aria-hidden="true">
        <svg height="18" viewBox="0 0 24 18" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m.53074988 10.2361066 7.40207744 7.2619666c.68214781.6692357 1.81894053.6692357 2.50108838 0 .6821478-.6692357.6821478-1.7845106 0-2.4537463l-4.37064526-4.3124787h16.16836026c.9852595 0 1.7683693-.76828663 1.7683693-1.73489652s-.7831098-1.73489656-1.7683693-1.73489656h-16.16836026l4.37046476-4.28773807c.6821478-.66923572.6821478-1.78451056 0-2.45374628-.3536738-.34697932-.80850823-.52057077-1.26315313-.52057077-.45464491 0-.90947027.17357817-1.26315315.52057077l-7.37681437 7.23718172c-.32847396.32225641-.53061455.76828668-.53061455 1.23924345s.17692715.91699589.53061455 1.23924346z" fill="${tokens.color.forest.hex}" transform="matrix(-1 0 0 1 24 0)"/></svg>
      </span>
    </a>
    <div class="flex relative flex-col gap-3 items-start md:flex-row md:items-center md:gap-6 partner-line">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 text-2xl rounded-full text-anthracite bg-yellow" aria-hidden="true"><span class="i-cib-tripadvisor"></span></div>
        <div>
          <div class="flex items-center gap-2"><span class="text-lg font-bold tracking-widest">${P.tripadvisor.score}/${P.tripadvisor.scale}</span><span class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 18)}</span></div>
          <p class="text-sm"><i>${P.tripadvisor.count} reviews of ${P.name} · checked ${fillSpan(P.tripadvisor.checkedOn)}</i></p>
        </div>
      </div>
      <a href="${PARTNER_REVIEWS_HREF}"${PARTNER_REVIEWS_TARGET} class="font-bold tracking-wider uppercase underline">Read reviews on Tripadvisor</a>
    </div>
  </div>
</div>
`;
}

function footerPartnerLine() {
  return `<p class="mt-8 text-sm partner-line">Trips operated on the ground by <a href="/our-partner/" class="underline">${P.name}</a>, ${P.city}.</p>
<p class="mt-2 text-sm partner-line">${fillSpan("[FILL: package-travel protection / memberships, if any]")}</p>
`;
}

/** Compact partner block that replaces a review carousel on inner pages. */
function partnerCompact(stacked = false) {
  return `<div class="mx-auto max-w-4xl partner-card rounded-md">
  <div class="flex flex-col gap-6 px-6 py-8 ${stacked ? "" : "md:flex-row md:items-center "}md:px-10">
    <div class="flex-1">
      <h3 class="text-2xl text-white">Reviews of our local partner</h3>
      <p class="mt-2 text-white/90">Every trip is run on the ground by ${P.name} in ${P.city}. Travellers review them on Tripadvisor; we show the score with the date we last checked it and link to the original profile.</p>
      <p class="mt-3 flex flex-wrap items-center gap-2"><span class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 18)}</span><span class="partner-score font-bold tracking-wider">${scoreLine()}</span></p>
    </div>
    <div class="flex flex-col gap-3 shrink-0">
      <a href="${PARTNER_REVIEWS_HREF}"${PARTNER_REVIEWS_TARGET} class="btn btn-small btn-yellow text-center">Read reviews on Tripadvisor</a>
      <a href="/our-partner/" class="btn btn-small btn-red--outlined text-center !text-white !border-white">Meet our partner</a>
    </div>
  </div>
</div>`;
}

/** Home-page section replacing the review carousel: who runs the trip and who you will meet. */
function partnerHomeSection() {
  return `<div class="pt-8 pb-12 -mb-1.5 bg-green ts-mask-bottom md:pt-20 md:pb-24">
  <div class="px-4 mx-auto">
    <div class="mx-auto mb-12 max-w-7xl text-center ts-prose ts-prose-xl">
      <h2>Our local partner in Arusha</h2>
      <h3>The people you will meet in Tanzania</h3>
    </div>
    <div class="grid gap-6 mx-auto max-w-7xl container-2xl md:grid-cols-3">
      <div class="partner-card rounded-md p-6 md:col-span-2 md:p-10">
        <h3 class="text-2xl text-white">Who runs your trip on the ground</h3>
        <p class="mt-3 text-white/90">${BRAND} is the party you book with: we plan the trip with you, send the proposal and the invoice, and are your contact before departure. The trip itself is operated by <strong>${P.name}</strong>, a tour operator in ${P.city} led by ${P.owner}. Their guides, drivers, cooks and mountain crew are the people you will meet every day.</p>
        <ul class="mt-5 grid gap-3 sm:grid-cols-2">
          <li class="flex gap-3 text-white/90"><span class="text-yellow" aria-hidden="true">✓</span> ${P.whatDoesWhat.ytt}</li>
          <li class="flex gap-3 text-white/90"><span class="text-yellow" aria-hidden="true">✓</span> ${P.whatDoesWhat.knt}</li>
        </ul>
        <p class="mt-6 flex flex-wrap gap-3">
          <a href="/our-partner/" class="btn btn-small btn-yellow">Meet our partner</a>
          <a href="${PARTNER_REVIEWS_HREF}"${PARTNER_REVIEWS_TARGET} class="btn btn-small btn-red--outlined !text-white !border-white">Read reviews on Tripadvisor</a>
        </p>
      </div>
      <div class="partner-card rounded-md p-6 text-center">
        <img src="/brand/placeholder-photo.jpg" alt="${P.owner}, ${P.name}" width="800" height="800" class="mx-auto w-40 h-40 rounded-full object-cover" loading="lazy" />
        <h4 class="mt-4 text-xl text-white">${P.owner}</h4>
        <p class="text-sm text-white/80">Founder of ${P.name}, ${P.city}</p>
        <p class="mt-4 flex justify-center" aria-hidden="true">${stars(5, "text-yellow", 20)}</p>
        <p class="partner-score font-bold tracking-wider">${P.tripadvisor.score}/${P.tripadvisor.scale} on Tripadvisor</p>
        <p class="text-sm text-white/80">${P.tripadvisor.count} reviews · checked ${fillSpan(P.tripadvisor.checkedOn)}</p>
      </div>
    </div>
  </div>
</div>`;
}

/** The /our-partner/ page body. */
function partnerPageBody() {
  const credentials = P.credentials.items.map((c) => `<li>${fillSpan(c)}</li>`).join("\n");
  return `<div class="relative z-10 px-5 pt-6 pb-12 mx-auto max-w-7xl container-2xl">
  <ul id="breadcrumbs" class="flex items-center py-4 md:py-6 gap-x-3"><li><a href="/">Home</a><span class="breadcrumb-separator i-ion-chevron-right"></span></li><li class="active"><a href="/our-partner/">Our local partner</a></li></ul>
  <div class="grid grid-cols-1 gap-y-8 gap-x-12 lg:grid-cols-2">
    <div class="col-span-1 ts-prose">
      <h1>Our local partner: ${P.name}</h1>
      <p>Every trip you book with ${BRAND} is operated in Tanzania by ${P.name}. This page explains who they are and how the roles are divided, so you know who you are dealing with before and during your trip.</p>
      <h2>Who is ${P.name}?</h2>
      <p>${P.name} is a tour operator based in ${P.city}, in northern Tanzania, led by ${P.owner}. From Arusha they run safaris on the northern and southern circuits, trips around the Great Migration, Kilimanjaro climbs and Mount Meru climbs, and combinations with Zanzibar.</p>
      <p>When you travel with us, their guides, drivers, cooks and porters are the people you see every day. They know the parks, the roads and the lodges, and they make the decisions on the ground, for example when the weather changes or a route can be improved.</p>
      <h2>Who does what</h2>
      <ul>
        <li><strong>${BRAND}</strong>: ${P.whatDoesWhat.ytt}</li>
        <li><strong>${P.name}</strong>: ${P.whatDoesWhat.knt}</li>
      </ul>
      <h2>Contact during your trip</h2>
      <p>Before departure everything goes through ${BRAND}. During the trip you also have the direct contact details of ${P.name}:</p>
      <ul>
        <li>Email: <a href="mailto:${P.email}">${P.email}</a></li>
        <li>Website: <a href="${P.url}" target="_blank" rel="noopener noreferrer">${P.url.replace("https://", "")}</a></li>
        <li>Postal address: ${P.postal}, Tanzania</li>
      </ul>
      <h2>Licences and memberships</h2>
      <p>${P.name} has told us it holds licences and memberships with the organisations below. We show the numbers once we have their written permission and have verified them.</p>
      <ul>
${credentials}
      </ul>
      <h2>Reviews of ${P.name}</h2>
      <p>Travellers review ${P.name} on independent platforms. We show the score per platform with the date we checked it and link to the original profile, so you can read the reviews there. These scores belong to our partner, not to ${BRAND}.</p>
      <p><span class="stars-ratings inline-flex align-middle" aria-hidden="true">${stars(5, "text-yellow", 18)}</span> <strong>${scoreLine()}</strong></p>
      <p><a class="btn btn-small btn-red" href="${PARTNER_REVIEWS_HREF}"${PARTNER_REVIEWS_TARGET}>Read reviews on Tripadvisor</a></p>
    </div>
    <div class="col-span-1">
      <div class="partner-card rounded-md p-6 text-center">
        <img src="/brand/placeholder-photo.jpg" alt="${P.owner}, ${P.name}" width="800" height="800" class="mx-auto w-48 h-48 rounded-full object-cover" loading="lazy" />
        <h3 class="mt-4 text-2xl text-white">${P.owner}</h3>
        <p class="text-white/80">Founder, ${P.name}</p>
      </div>
      <figure class="mt-6">
        <img src="/brand/placeholder-team.jpg" alt="The ${P.name} team in ${P.city}" width="1200" height="800" class="w-full rounded-md" loading="lazy" />
        <figcaption class="mt-2 text-sm text-anthracite">Team photo: <span class="fill-marker">[FILL: photo of the ${P.name} team, with permission]</span></figcaption>
      </figure>
      <div class="mt-8 p-6 bg-sand rounded-md">
        <h3 class="text-2xl">Plan your trip</h3>
        <p class="mt-2">Tell us your dates and what you want to see. You get a day-by-day proposal and a price, free and without obligation.</p>
        <a class="mt-4 btn btn-small btn-red" href="/travel-proposal/">Request a travel proposal</a>
      </div>
    </div>
  </div>
</div>
`;
}

// ---------------------------------------------------------------------------------------------
// Content transforms
// ---------------------------------------------------------------------------------------------
const RATINGS_OPEN = /<div class="[^"]*\bratings-wrapper\b[^"]*"[^>]*>/;
const CAROUSEL_OPEN = /<div class="[^"]*\bf-carousel js-f-carousel[^"]*"[^>]*>/;

/** Score row inside the "Great customer experiences" tile (home, review page): one attributed partner line. */
function tileScoreRow() {
  return `<div class="flex flex-wrap gap-3 items-center mt-6 md:gap-6 partner-line">
  <div class="flex items-center">
    <div class="flex justify-center items-center mr-2 w-7 h-7 text-xl bg-white rounded-full text-green md:mr-3 md:h-8 md:w-8" aria-hidden="true"><span class="i-cib-tripadvisor ![mask-size:contain] ![mask-position:center]"></span></div>
    <div class="flex flex-col items-start">
      <div class="flex items-center"><div class="mr-2 text-base font-bold tracking-wider text-white">${P.tripadvisor.score}/${P.tripadvisor.scale}</div><div class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 14)}</div></div>
      <p class="text-sm text-white"><i>${P.name}, our local partner · ${P.tripadvisor.count} reviews · checked ${fillSpan(P.tripadvisor.checkedOn)}</i></p>
    </div>
  </div>
</div>`;
}
const TILE_SCORES_OPEN = /<div class="flex flex-wrap gap-3 items-center mt-6 md:gap-6">/;

/** Sidebar widget "How previous guests rated us" (travel-proposal and similar templates). */
function sidebarPartnerWidget() {
  return `<section id="ts_reviews_widget-4" class="widget widget_ts_reviews_widget"><h2 class="text-lg font-bold tracking-widest uppercase text-anthracite">Our local partner</h2>
<p class="mt-3 text-sm">Your trip is operated on the ground by <a href="/our-partner/" class="underline">${P.name}</a>, ${P.city}.</p>
<p class="mt-2 flex items-center gap-2"><span class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 16)}</span><strong>${P.tripadvisor.score}/${P.tripadvisor.scale}</strong></p>
<p class="text-sm partner-line">${P.tripadvisor.count} reviews on Tripadvisor · checked ${fillSpan(P.tripadvisor.checkedOn)}</p>
<p class="mt-2 text-sm"><a href="${PARTNER_REVIEWS_HREF}"${PARTNER_REVIEWS_TARGET} class="underline">Read reviews on Tripadvisor</a></p>
</section>`;
}

function stripOldTrust(html) {
  html = replaceDivs(html, RATINGS_OPEN, "");
  html = html.replace(/<section id="ts_reviews_widget-\d+"[^>]*>[\s\S]*?<\/section>/g, sidebarPartnerWidget());
  html = replaceDivs(html, TILE_SCORES_OPEN, tileScoreRow(), (inner) => /4\.[79]\/5/.test(inner));
  html = replaceDivs(html, CAROUSEL_OPEN, partnerCompact(), (inner) => inner.includes("review-card"));
  return html;
}

function callAnExpert(html) {
  // Two office buttons (USA, UK) -> one button with the brand's phone number.
  html = html.replace(/<span class="!w-\[2\.01em\] !h-\[1\.50em\] text-white ts-flag-usa"><\/span>\s*<span class="!text-base">USA: <\/span>/g, '<span class="!w-[2.01em] !h-[1.50em] text-white ts-flag-nl"></span>\n<span class="!text-base">NL: </span>');
  html = html.replace(/<a class="[^"]*btn-red"\s+href="[^"]*"\s+target="">\s*<span class="flex gap-2\.5 items-center">\s*<span class="[^"]*ts-flag-gb"><\/span>[\s\S]*?<\/a>\s*/g, "");
  return html;
}

function contactPage(html) {
  html = html.replace(/<p><strong><span style="font-weight: 400">Founded by [\s\S]*?<\/span><\/strong><\/p>/, `<p>${BRAND} is run by ${CO.owner} from Nagele in the Netherlands. Every trip is operated on the ground by our local partner <a href="/our-partner/">${P.name}</a> in Arusha, Tanzania: their guides, drivers and mountain crew are the people you meet during your trip.</p>`);
  html = html.replace(/<p><strong>To speak with one of our amazing travel consultants:<\/strong><\/p>\s*<ul[^>]*>[\s\S]*?<\/ul>/, `<p><strong>To talk about your trip:</strong></p>\n<ul>\n<li>Email: <a href="mailto:${CO.email}">${CO.email}</a></li>\n<li>Phone: <a href="${PHONE_TEL}">${CO.phone}</a> (Netherlands / English and Dutch)</li>\n<li>WhatsApp: ${fillSpan(CO.whatsapp)}</li>\n</ul>`);
  html = html.replace(/<p><strong>For suppliers to get in touch with our reservations team:<\/strong><\/p>\s*<ul>[\s\S]*?<\/ul>/, `<p><strong>For suppliers and partners:</strong></p>\n<ul>\n<li>Email: <a href="mailto:${CO.email}">${CO.email}</a></li>\n<li>Local operations in Tanzania: ${P.name}, <a href="mailto:${P.email}">${P.email}</a></li>\n</ul>`);
  html = html.replace(/<h2>Financial Information<\/h2>\s*<p>[\s\S]*?<\/p>/, `<h2>Company details</h2>\n<p><span style="text-decoration: underline">Chamber of Commerce (KvK)</span>: ${CO.kvk}<br />\n<span style="text-decoration: underline">VAT (BTW)</span>: ${CO.vat}<br />\n<span style="text-decoration: underline">Bank account</span>: ${fillSpan("[FILL: IBAN]")} · BIC ${fillSpan("[FILL: BIC]")}</p>`);
  html = html.replace(/<p><span class='flying-press-youtube'[\s\S]*?<\/span><\/p>/, "");
  html = html.replace(/\s*Check out all the latest travel stories from our guests on the <a[^>]*>[^<]*<\/a> page!/, "");
  return html;
}

function aboutPage(html) {
  html = html.replace(/<p>Your Tanzania Trip was founded in 2017 by [^<]*?\. /, `<p>${BRAND} is run by ${CO.owner} from the Netherlands and works with one local partner in Tanzania: <a href="/our-partner/">${P.name}</a> in Arusha, led by ${P.owner}. `);
  // The old founders' story, staff count and office video do not apply to the new company.
  html = html.replace(/\s*<p><em>Your Tanzania Trip founders:[^<]*<\/em><\/p>/, "");
  html = html.replace(/(<h2 id="our-story">Our Story<\/h2>)\s*<p>Born from a passion[\s\S]*?<\/p>/, `$1\n<p>${fillSpan("[FILL: the story of Your Tanzania Trip in a few sentences: why Tijs Krops started it, and how the partnership with Kilimanjaro Nature Tours came about]")}</p>`);
  html = html.replace(/(<h2 id="our-offices">Our Offices<\/h2>)\s*<p>Your Tanzania Trip has two offices[\s\S]*?<\/p>/, `$1\n<p>${BRAND} is based in Nagele, the Netherlands. Our local partner <a href="/our-partner/">${P.name}</a> works from ${P.city}, close to the northern parks and Kilimanjaro. You plan and book with us in the Netherlands; on the ground you are looked after by their team.</p>`);
  html = html.replace(/<p><span class='flying-press-youtube'[\s\S]*?<\/span><\/p>/, "");
  // Tab to the old team page (the page itself redirects to /our-partner/)
  html = html.replace(/(<a href="\/our-partner\/"[\s\S]{0,400}?)Our experts/i, "$1Our local partner");
  html = html.replace(/<option value="[^"]*"\s*>\s*Our experts\s*<\/option>/i, '<option value="/our-partner/">Our local partner</option>');
  return html;
}

function reviewsPage(html) {
  const cut = html.indexOf('<div class="relative z-10 px-5 mx-auto max-w-7xl container-2xl"><ul id="breadcrumbs"');
  if (cut === -1) return html;
  const crumbsEnd = matchDiv(html, cut);
  const prefix = html.slice(0, crumbsEnd);
  const open = (prefix.match(/<div\b/g) || []).length - (prefix.match(/<\/div>/g) || []).length;
  const body = `
<div class="relative z-10 px-5 pb-12 mx-auto max-w-7xl container-2xl">
  <div class="grid grid-cols-1 gap-y-8 gap-x-12 lg:grid-cols-2">
    <div class="col-span-1 ts-prose">
      <h2>What travellers say about our local partner</h2>
      <p>${BRAND} is new. The trips are operated by ${P.name} in Arusha, which travellers have been reviewing for longer. We show their score per platform with the date we checked it, and link to the original profile so you can read the reviews there. These scores belong to our partner, not to ${BRAND}.</p>
      <p><span class="stars-ratings inline-flex align-middle" aria-hidden="true">${stars(5, "text-yellow", 18)}</span> <strong>${scoreLine()}</strong></p>
      <p><a class="btn btn-small btn-red" href="${PARTNER_REVIEWS_HREF}"${PARTNER_REVIEWS_TARGET}>Read reviews on Tripadvisor</a></p>
      <h2>Reviews of ${BRAND}</h2>
      <p>We only publish individual reviews with the reviewer's first name, the date and a link to the source. None have been added yet. After your trip we will ask you to share your experience on an independent platform.</p>
      <p><a href="/our-partner/">Meet our local partner</a> or <a href="/travel-proposal/">request a travel proposal</a>.</p>
    </div>
    <div class="col-span-1">
      ${partnerCompact(true)}
    </div>
  </div>
</div>
${"</div>".repeat(Math.max(0, open))}
`;
  return prefix + body;
}

// ---------------------------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------------------------
let changed = 0;
function processFile(p, extra = (s) => s) {
  const before = fs.readFileSync(p, "utf8");
  const after = extra(rebrandText(before));
  if (after !== before) {
    fs.writeFileSync(p, after);
    changed++;
  }
}

// 1. Pages removed by the rebrand (old founders' interviews, sister company, old certification)
const removed = {
  "/blog/5-questions-with-tanzania-specialist-founder-robbin-meulemans/": "/blog/",
  "/blog/5-questions-with-tanzania-specialist-director-epimark-bernard/": "/blog/",
  "/africa-safari-trips/": "/",
  "/practical-information/travelife-partner-status/": "/practical-information/responsible-travel/",
  // Posts and pages about the old operator's staff, team events, certifications and partnerships
  "/blog/get-to-know-the-faces-behind-tanzania-specialist-in-the-hot-seat-killow/": "/our-partner/",
  "/blog/get-to-know-the-faces-behind-tanzania-specialist-in-the-hot-seat-tyo/": "/our-partner/",
  "/blog/get-to-know-the-team-esther/": "/our-partner/",
  "/blog/get-to-know-the-faces-behind-tanzania-specialist-in-the-hot-seat-elke/": "/our-partner/",
  "/blog/get-to-know-the-team-romina/": "/our-partner/",
  "/blog/meet-our-experts-mathanje-tanzania/": "/our-partner/",
  "/blog/meet-our-experts-willemijn-tanzania/": "/our-partner/",
  "/blog/safari-guide-tanzania-interview-albino-animals/": "/our-partner/",
  "/blog/serengeti-safari-marathon-2022/": "/blog/",
  "/blog/serengeti-safari-marathon-2023/": "/blog/",
  "/blog/serengeti-safari-marathon-photos/": "/blog/",
  "/blog/press-release-increased-sightings-of-rare-albino-animals/": "/blog/",
  "/blog/why-choose-tanzania-specialist/": "/about-tanzania-specialist/",
  "/blog/certified-responsible-climbing-on-kilimanjaro/": "/climbing-kilimanjaro/",
  "/blog/why-chapka-travel-insurance/": "/practical-information/travel-insurance/",
  "/about-tanzania-specialist/our-tanzania-travel-experts/": "/our-partner/",
  "/job-offers/": "/contact/",
  "/job-offers-content-writer-translator/": "/contact/",
};
const removedHref = new RegExp('href="(?:https?://[^/"]+)?(' + Object.keys(removed).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ')"');

/** Cards, list items and tab links that point to a removed page go with it. */
function stripRemovedLinks(html) {
  html = html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g, (m) => (removedHref.test(m) ? "" : m));
  html = html.replace(/<li\b[^>]*>(?:(?!<li\b)[\s\S]){0,1500}?<\/li>/g, (m) => (removedHref.test(m) ? "" : m));
  // Blog overview: the result count follows the number of cards left.
  html = html.replace(/(\d+) results\b/, () => `${(html.match(/<article class="post-item/g) || []).length} results`);
  // Remaining links in running text and buttons follow the redirect.
  html = html.replace(/href="(?:https?:\/\/[^/"]+)?(\/[^"]*\/)"/g, (m, p) => (removed[p] ? `href="${removed[p]}"` : m));
  html = html.replace(/<a href="\/our-partner\/"([^>]*)>(\s*)Meet our experts(\s*)<\/a>/g, '<a href="/our-partner/"$1>$2Meet our local partner$3</a>');
  return html;
}

// Photos that show the old operator's logo (jeeps, uniforms) or its staff -> logo-free photos from
// the same library, or the brand placeholder where it shows a person who is not part of the team.
const U = "/wp-content/uploads/";
const imageRules = [
  [/\/wp-content\/uploads\/2023\/08\/guide_tanzania_specialist(?:-\d+x\d+)?\.jpg/g, `${U}2025/10/IM_TZ_SER_Guide-and-guests-looking-at-tree-1024x683.jpg`],
  [/\/wp-content\/uploads\/2023\/08\/people_taking_pictures_in_jeep(?:_v2|-1)?(?:-\d+x\d+)?\.jpg/g, `${U}2023/07/Elephants-jeep-Tarangire-1024x683.jpg`],
  [/\/wp-content\/uploads\/2026\/01\/IM_TZ_SER_Meulemans-safari-couple-on-jeep-roof-2(?:-scaled)?(?:-1)?(?:-\d+x\d+)?\.jpg/g, `${U}2023/07/Serengeti-Jeep-1024x683.jpg`],
  [/\/wp-content\/uploads\/2023\/08\/jeep-[345](?:-\d+x\d+)?\.jpg/g, `${U}2024/12/Africa-Safari-jeep-2-1024x682.jpg`],
  [/\/wp-content\/uploads\/2023\/07\/Jeep(?:-\d+x\d+)?\.jpg/g, `${U}2024/12/Africa-Safari-jeep-2-1024x682.jpg`],
  [/\/wp-content\/uploads\/2025\/04\/Safari-jeep-3(?:-\d+x\d+)?\.jpg/g, `${U}2024/12/Africa-Safari-jeep-2-1024x682.jpg`],
  [/\/wp-content\/uploads\/2024\/12\/Africa-Safari-jeep-3(?:-\d+x\d+)?\.jpg/g, `${U}2024/12/Africa-Safari-jeep-2-1024x682.jpg`],
  [/\/wp-content\/uploads\/2026\/01\/CI_Jeep-and-clients-4(?:-scaled)?(?:-\d+x\d+)?\.jpg/g, `${U}2023/07/Serengeti-Jeep-1024x683.jpg`],
  [/\/wp-content\/uploads\/2024\/07\/Safari-jeep-cheetahs-private(?:-\d+x\d+)?\.jpg/g, `${U}2024/06/Safari-Jeep-lion.jpg`],
  [/\/wp-content\/uploads\/2023\/11\/team_tanzania_specialist_jeeps(?:-\d+x\d+)?\.jpg/g, `${U}2024/12/Africa-Safari-jeep-2-1024x682.jpg`],
  [/\/wp-content\/uploads\/2025\/02\/IM_TZ_MAK_Sunset-and-jeep-TS-logo(?:-scaled)?(?:-1)?(?:-\d+x\d+)?\.jpg/g, `${U}2024/06/Safari-Jeep-lion.jpg`],
  // Consultant portraits of the old team (hero form, "Call an expert", contact)
  [/\/wp-content\/uploads\/2023\/11\/team_member_tanzania_yellow(?:-\d+x\d+)?\.jpg/g, "/brand/placeholder-photo.jpg"],
  [/\/wp-content\/uploads\/2023\/11\/test_image_2-1(?:-\d+x\d+)?\.jpg/g, "/brand/placeholder-photo.jpg"],
  // Menu thumbnail in the old handwriting style -> brand version (scripts/make-request-thumbnail.mjs)
  [/\/wp-content\/uploads\/2023\/08\/request_thumbnail(?:-\d+x\d+)?\.jpeg/g, "/brand/request-thumbnail.jpg"],
  [/\/wp-content\/uploads\/2023\/10\/C0453\.00_00_00_000\.Still001(?:-\d+x\d+)?\.jpg/g, `${U}2025/10/IM_TZ_SER_Guide-and-guests-looking-at-tree-1024x683.jpg`],
  [/alt="guide_tanzania_specialist"/g, 'alt="Guide and guests on safari"'],
  [/alt="(?:people_taking_pictures_in_jeep(?:_v2)?|team_tanzania_specialist_jeeps|jeep-\d)"/g, 'alt="Safari jeep in Tanzania"'],
  [/alt="request_thumbnail"/g, 'alt="Request a proposal at no charge"'],
];
fs.writeFileSync(path.join(root, "content/redirects-brand.json"), JSON.stringify(removed, null, 1));

// 2. Page content
for (const p of walk(path.join(root, "content/pages"), [".html"])) {
  const slug = path.basename(p, ".html");
  const urlPath = slug === "index" ? "/" : "/" + slug.replace(/__/g, "/") + "/";
  if (removed[urlPath]) {
    fs.unlinkSync(p);
    continue;
  }
  processFile(p, (s) => {
    s = stripOldTrust(s);
    s = stripRemovedLinks(s);
    s = callAnExpert(s);
    // Trip pages: the old promo video sat next to the price box; the partner block fills that spot.
    if (slug.startsWith("itineraries__") && slug.split("__").length === 2) s = s.replace("<!--VIDEO-->", `<div class="mt-8">${partnerCompact(true)}</div>`);
    s = s.replace(/<!--VIDEO-->/g, "");
    if (slug === "index") s = replaceDivs(s, /<div class="pt-8 pb-12 -mb-1\.5 bg-green ts-mask-bottom md:pt-20 md:pb-24">/, partnerHomeSection(), (inner) => inner.includes("What Travellers Say"));
    if (slug === "contact") s = contactPage(s);
    if (slug === "about-tanzania-specialist") s = aboutPage(s);
    if (slug === "tanzania-traveller-reviews") s = reviewsPage(s);
    return s;
  });
}
fs.writeFileSync(path.join(root, "content/pages/our-partner.html"), partnerPageBody());

// 3. AJAX fragments and FacetWP card data (wishlist/post lists lose the removed pages)
for (const p of walk(path.join(root, "public/ajax"), [".html", ".json"])) {
  processFile(p, (s) => {
    s = stripOldTrust(s);
    s = stripRemovedLinks(s);
    if (p.endsWith(".json")) {
      try {
        const data = JSON.parse(s);
        if (data && typeof data === "object" && !Array.isArray(data)) {
          for (const [k, v] of Object.entries(data)) if (v && removed[v.post_permalink]) delete data[k];
          s = JSON.stringify(data);
        }
      } catch {}
    }
    return s;
  });
}
for (const p of walk(path.join(root, "public/facetwp-static"), [".json"])) processFile(p);

// 4. Metadata and JSON-LD (structural, so escaped JSON strings are handled correctly)
function fixJsonLd(json) {
  let data;
  try {
    data = JSON.parse(rebrandText(json));
  } catch {
    return rebrandText(json);
  }
  const nodes = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
  const kept = nodes.filter((n) => !["AggregateRating", "Review"].includes(n["@type"]));
  for (const n of kept) {
    delete n.aggregateRating;
    delete n.review;
    if (n["@type"] === "Organization") {
      n.name = BRAND;
      n.url = SITE + "/";
      n.logo = { "@type": "ImageObject", "@id": "/#/schema/logo/image/", url: `${SITE}/brand/logo-primary.png`, contentUrl: `${SITE}/brand/logo-primary.png`, width: 1888, height: 732, caption: BRAND };
      n.image = { "@id": "/#/schema/logo/image/" };
      n.address = { "@type": "PostalAddress", streetAddress: "Sluitgatweg 10", postalCode: "8308 RE", addressLocality: "Nagele", addressCountry: "NL" };
      n.email = CO.email;
      n.telephone = CO.phone;
      n.sameAs = [];
    }
    if (n["@type"] === "WebSite") {
      n.name = BRAND;
      n.description = "Tailor-made safaris, Kilimanjaro climbs and Zanzibar trips in Tanzania";
    }
  }
  if (Array.isArray(data["@graph"])) data["@graph"] = kept;
  return rebrandText(JSON.stringify(data)); // second pass: image paths were escaped before parsing
}

{
  const file = path.join(root, "content/pages.json");
  const pages = JSON.parse(fs.readFileSync(file, "utf8")).filter((pg) => !removed[pg.path]);
  for (const pg of pages) {
    for (const k of ["title", "description", "ogTitle", "ogDescription"]) if (pg[k]) pg[k] = rebrandText(pg[k]);
    if (!pg.ogImage || /DSC04060|social\.png/.test(pg.ogImage)) pg.ogImage = "/brand/og-image.jpg";
    pg.ogImage = rebrandText(pg.ogImage);
    // Blog overview: the preloaded result count follows the cards that are left after removals.
    if (pg.slug === "blog") {
      const n = pages.filter((q) => /^\/blog\/.+/.test(q.path)).length;
      pg.extraScripts = pg.extraScripts.map((s) => s.replace(/"_total_rows":"\d+ results"/, `"_total_rows":"${n} results"`));
    }
    pg.extraScripts = (pg.extraScripts || []).map(rebrandText);
    pg.extraStyles = (pg.extraStyles || []).map(rebrandText);
    pg.ldJson = (pg.ldJson || []).map(fixJsonLd).filter(Boolean);
    if (pg.stickyCta) pg.stickyCta.label = rebrandText(pg.stickyCta.label);
  }
  pages.push({
    slug: "our-partner",
    path: "/our-partner/",
    title: `Our local partner in Arusha: ${P.name} | ${BRAND}`,
    description: `${P.name} in Arusha operates every ${BRAND} itinerary on the ground. Who they are, where they are and exactly what they do.`,
    robots: null,
    ogType: "website",
    ogTitle: `Our local partner: ${P.name}`,
    ogDescription: "Who runs your trip on the ground, and who you will meet in Tanzania.",
    ogImage: "/brand/og-image.jpg",
    bodyClass: "page wp-singular page-template-default",
    extraScripts: [],
    extraStyles: [],
    stickyCta: { href: "/travel-proposal/", label: "Make a request" },
    ldJson: [],
  });
  fs.writeFileSync(file, JSON.stringify(pages, null, 1));
}

// 5. Header
processFile(path.join(root, "src/partials/header.html"), (s) => {
  s = stripRemovedLinks(s);
  s = s.replace(/<picture>[\s\S]*?<\/picture>/, `<img src="/brand/logo-primary.png" class="brand-logo no-lazyload" width="1888" height="732" alt="${BRAND}" fetchpriority="high" loading="eager" decoding="async">`);
  // Cross-sell to the former sister company (its anchor is already unwrapped by the text rules).
  s = s.replace(/<a href="https:\/\/africasafaritrips\.com"[^>]*class="top-header-cross-sell">[\s\S]*?<\/a>/, "");
  s = s.replace(/<span class="top-header-cross-sell-text">[\s\S]*?<\/span>\s*/, "");
  s = s.replace(/<img src="[^"]*ast-logo[^"]*"[\s\S]*?\/>\s*/, "");
  s = s.replace(/<a href="\/"[^>]*class="flex items-center px-1 py-1\.5[^"]*">\s*<span class="mr-2 text-base text-white ts-flag ts-flag-(?!en)[a-z]+"><\/span>[^<]*<\/a>\s*/g, "");
  s = s.replace(/(<div class="px-3\.5 py-3 w-44[^"]*">)\s*(<\/div>)/, '$1 <a href="/" class="flex items-center px-1 py-1.5 leading-[normal] hover:underline"><span class="mr-2 text-base text-white ts-flag ts-flag-en"></span> English </a> $2');
  s = s.replace(/<div class="flex relative gap-4 items-center md:gap-6 lg:mx-auto">[\s\S]*?(?=\s*<ul id="menu-header-secondary")/, headerTrustItem());
  s = s.replace(/(<li id="menu-item-212"[^>]*><a href="\/about-tanzania-specialist\/">[^<]*<\/a><\/li>)/, '$1\n <li class="menu-item menu-item-type-post_type menu-item-object-page"><a href="/our-partner/">Our local partner</a></li>');
  s = s.replace(/(<li id="menu-item-14294"[^>]*><a href="\/about-tanzania-specialist\/">About us<\/a><\/li>)/, '$1\n<li class="mobile-menu-divider menu-item menu-item-type-post_type menu-item-object-page"><a href="/our-partner/">Our local partner</a></li>');
  s = s.replace(/href="https:\/\/yourtanzaniatrip\.com" class="header-logo-link"/, 'href="/" class="header-logo-link"');
  return s;
});

// 6. Footer
processFile(path.join(root, "src/partials/footer.html"), (s) => {
  s = stripRemovedLinks(s);
  const bandStart = s.indexOf('<div class="text-white ts-mask-bottom bg-green">');
  const bandEnd = s.indexOf('<div class="px-5 py-12 mx-auto max-w-7xl md:pb-24 container-2xl">');
  if (bandStart !== -1 && bandEnd > bandStart) s = s.slice(0, bandStart) + footerBand() + "\n " + s.slice(bandEnd);
  s = s.replace(/<img class="w-auto h-24"[^>]*logo-en-footer\.svg[^>]*>/, `<img src="/brand/logo-reversed.png" class="w-auto h-24" width="1913" height="722" alt="${BRAND}" loading="lazy" decoding="async">`);
  // Badge rows: the first held the sister-company and Hakuna Matata logos, the second SGR/ANVR/Travelife.
  s = s.replace(/<ul class="flex gap-x-8 items-center mt-8">([\s\S]*?)<\/ul>/g, (m, inner) => {
    const hakuna = inner.match(/<li>\s*<a href="\/hakuna-matata-package\/"[\s\S]*?<\/li>/);
    return hakuna ? `<ul class="flex gap-x-8 items-center mt-8">\n${hakuna[0]}\n</ul>` : footerPartnerLine();
  });
  s = s.replace(/<section id="ts_follow_widget-2"[\s\S]*?<\/section>/, "");
  s = s.replace(/<li>\s*<a[^>]*href="https:\/\/(?:www\.|nl\.)?(?:instagram|facebook|pinterest|linkedin|youtube)\.com\/[^"]*"[^>]*>[\s\S]*?<\/a>\s*<\/li>/g, "");
  s = s.replace(/<li><a aria-label="Google"[\s\S]*?<\/li>/, "");
  s = s.replace(/<li>\s*<a[^>]*href="https:\/\/africasafaritrips\.com"[^>]*>[\s\S]*?<\/a>\s*<\/li>/g, "");
  s = s.replace(/<a[^>]*href="https:\/\/africasafaritrips\.com"[^>]*>[\s\S]*?<\/a>/g, "");
  s = s.replace(/(<ul id="menu-footer-reisinformatie"[^>]*>)/, '$1<li class="menu-item menu-item-type-post_type menu-item-object-page"><a href="/our-partner/">Our local partner</a></li>');
  s = s.replace(/&copy; 2026 Your Tanzania Trip/g, `&copy; 2026 ${BRAND} · KvK ${CO.kvk} · BTW ${CO.vat}`);
  s = s.replace(/href="https:\/\/yourtanzaniatrip\.com">\s*<span class="sr-only">/, 'href="/">\n <span class="sr-only">');
  return s;
});

// 7. Layout text (og:site_name etc.)
processFile(path.join(root, "src/layouts/BaseLayout.astro"));

console.log(`rebrand: ${changed} files changed, ${Object.keys(removed).length} pages removed, our-partner page written`);

// 8. Report leftovers for TODO-OWNER.md
const leftovers = {};
const needles = ["Africa Safari Trips", "africasafaritrips", "tanzaniaspecialist", "Tanzania Specialist", "Honselersdijk", "65050401", "RABO", "Robbin", "Epimark", "5247", "1689", "4.9/5", "4.7/5", "Travelers' Choice", "Travellers' Choice", "anvr.nl", "sgr.nl", "d12997236", "[FILL"];
for (const p of [...walk(path.join(root, "content/pages"), [".html"]), path.join(root, "src/partials/header.html"), path.join(root, "src/partials/footer.html")]) {
  const s = fs.readFileSync(p, "utf8");
  for (const n of needles) {
    const k = s.split(n).length - 1;
    if (k) leftovers[n] = (leftovers[n] || 0) + k;
  }
}
console.log("remaining mentions:", leftovers);
