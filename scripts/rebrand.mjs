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
  // Claims about the old operator's scale, rewritten to the partner's reality
  [/Thousands of travelers have explored Tanzania with us and had an unforgettable experience\./g, "Hundreds of travellers have explored Tanzania with Baraka and his crew, and their reviews say it all."],
  [/Our past travelers confirm: it(?:’|'|&#8217;)s an unforgettable experience\./g, "Travellers who went before you confirm it: an unforgettable experience."],
  // Plain wording instead of the idiom (read as an error message by some visitors)
  [/No strings attached\. We(?:’|'|&#8217;)ll design your trip - no cost, no commitment\./g, "Free and without obligation. We design your trip, you decide."],
  [/\bno strings attached\b/g, "without obligation"],
  // Form intro: the "* indicates a required field." line reads like an error; the asterisks say enough.
  [/\s*<div class="mb-10 font-medium tracking-wide text-white text-md">\s*<span class="text-red"><span class="gfield_required gfield_required_asterisk">\*<\/span><\/span> indicates a required field\.\s*<\/div>/g, ""],
  // Flight booking help: the owner's fee
  [/from \$1,000 extra p\.p\./g, "from $250 extra p.p."],
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
  [/<p><strong>Rabobank<\/strong><\/p>\s*<p>Croeselaan 18<\/p>\s*<p>3521 CB Utrecht<\/p>/g, `<p><strong>${CO.bank}</strong></p>\n<p>IBAN ${CO.iban}</p>\n<p>BIC ${CO.bic}</p>`],
  [/\bHonselersdijk\b/g, "Nagele"],
  [/<strong>Mlimani Mateves[^<]*<\/strong>[^<]*Arusha,? Tanzania/g, `<strong>${P.name} (our local partner)</strong> ${P.postal}, Tanzania`],
  [/Mlimani Mateves[^<]*Arusha,? Tanzania/g, `${P.name} (our local partner), ${P.postal}, Tanzania`],
  [/\b65050401\b/g, CO.kvk],
  [/NL ?8559 ?61 ?351 ?B\.?01/g, CO.vat],
  [/NL39 RABO 0308 5684 78/g, CO.iban],
  [/\bRABONL2U\b/g, CO.bic],
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

// The company is not a member of a travel guarantee fund; the texts say what does apply.
const PROTECTION_TEXT = `you book with ${CO.brand} (${CO.legalName}, KvK ${CO.kvk}), pay a deposit on confirmation and the balance before departure, and your trip is operated by ${P.name}, a licensed Tanzanian tour operator and member of the Tanzania Association of Tour Operators. We confirm every booking with them in writing before we invoice you`;
const membershipRules = [
  // Repair file names an earlier (unguarded) run touched in persisted ajax fragments.
  [/uploads\/(\d{4}\/\d{2})\/\[FILL: sustainability certification\]/g, "uploads/$1/Travelife"],
  [/we are an active member of the SGR[\s\S]*?Certificate can be viewed via this link: <a[^>]*>[^<]*<\/a>\.?/g, `${PROTECTION_TEXT}.`],
  // Claims of being bonded under the old operator's guarantee fund (About, Terms)
  [/Your Tanzania Trip is fully accredited and bonded under the\s*(?:<a[^>]*>)?Dutch SGR\s*(?:<\/a>)?\((?:<a[^>]*>)?ATOL(?:<\/a>)?\s*in the UK\), which secures all online payments\./g, `${PROTECTION_TEXT.charAt(0).toUpperCase() + PROTECTION_TEXT.slice(1)}.`],
  [/All payments you make to us will be secured by SGR, as Your Tanzania Trip is a fully accredited and bonded SGR member \(SGR number: 3700\)\.\s*You can find more information about this certificate\s*(?:<\/span>|<span[^>]*>|<a[^>]*>|<\/a>)*here(?:<\/span>|<span[^>]*>|<\/a>)*\.?/g, `${PROTECTION_TEXT.charAt(0).toUpperCase() + PROTECTION_TEXT.slice(1)}.`],
  // Terms and conditions: the old operator's ANVR/SGR clauses
  [/Your Tanzania Trip Terms and Conditions and the ANVR Traveller Terms/g, `${CO.brand} Terms and Conditions`],
  [/On all booked trips, both the additional terms and conditions from Your Tanzania Trip and the ANVR Traveller Terms<\/span>[\s\S]*?regardless of the year of travel\./g, `On all booked trips the terms and conditions of ${CO.brand} apply.</span><span style="font-weight: 400">`],
  [/,\s*mobile app “Africa Safari App”/g, ""],
  [/,\s*including those of the ANVR \(Algemene Nederlandse Vereniging van Reisondernemingen\), that are also applicable to all trips operated by us/g, ""],
  [/<p><span style="font-weight: 400">As a Dutch company, we cannot be a member of, for example ATOL, but we are a member of the Dutch Guarantee Fund \(SGR\), which gives you the same coverage\. When you pay, your payment will be secured by SGR\.\s*<\/span><\/p>\s*/g, ""],
  // Traveller guide and its meta description
  [/<a href="https?:\/\/(?:www\.)?anvr\.nl[^"]*"[^>]*>ANVR Member<\/a> • <a href="https?:\/\/(?:www\.)?sgr\.nl[^"]*"[^>]*>SGR Affiliated<\/a>/g, '<a href="/our-partner/">Licensed Tanzanian operator (TATO member)</a> • <a href="/practical-information/guarantees/">Written booking confirmation</a>'],
  [/<a href="[^"]*travelife-partner-status\/"[^>]*>Travelife Partner<\/a> \(globally recognized tourism sustainability standard\) • <a href="[^"]*"[^>]*>Certified Kilimanjaro Responsible Trekking Organization<\/a> \(KRTO\)/g, '<a href="/practical-information/responsible-travel/">Fair pay and proper gear for porters</a> • <a href="/our-partner/">5% of each trip funds local schooling</a>'],
  // KRTO certification of the old operator -> what the partner's crew actually does
  [/And did we mention that we are a partner of the Kilimanjaro Responsible Travel Organisation \(KRTO\)\? That means we take care of our crew and the mountain during our climb, making sure you can climb with a clear conscience\./g, "And our partner Kilimanjaro Nature Tours hires its porters fairly, with proper gear, weighed loads and daily health checks on the mountain, so you can climb with a clear conscience."],
  [/<h2>A Milestone in Ethical Climbing: Our KRTO Certification<\/h2>\s*<p>We’re proud to announce[\s\S]*?<\/p>\s*<p><img[^>]*Kilimanjaro-vertified[\s\S]*?<\/p>/g, `<h2>How we climb responsibly</h2>\n<p>Every climb is run by our partner Kilimanjaro Nature Tours in Arusha. Their guides are licensed by the Kilimanjaro National Park authority and trained in Wilderness First Response, first aid and CPR; porters are hired properly, with fair pay, proper gear and weighed loads, and everyone gets a daily health check on the mountain. About 5% of each trip funds schooling in a village near the mountain. When you climb with us, you climb with a crew that is looked after, and that is how you reach the summit with a clear conscience.</p>`],
  [/Certified for Ethical Climbing/g, "Fairly paid, well-equipped crew"],
  [/>\s*About our experts\s*</gi, ">About our local partner<"],
  [/<h2 id="certified-sustainable-travel-africa"[^>]*>[\s\S]*?<p><img[^>]*Kilimanjaro-vertified[\s\S]*?<\/p>/g, `<h2 id="fair-practices-on-kilimanjaro">Fair practices on Kilimanjaro</h2>\n<p>Every climb is run by our partner Kilimanjaro Nature Tours in Arusha, founded by Baraka Dalali, who started on the mountain as a porter himself. Porters are hired properly, with fair pay, proper gear and weighed loads; guides are licensed by the Kilimanjaro National Park authority and trained in Wilderness First Response, first aid and CPR; and everyone on the mountain gets a daily health check. Anyone with serious symptoms descends.</p>\n<p>The crew follows <em>Leave No Trace</em> principles to keep the impact of trekking on Kilimanjaro's ecosystem as small as possible, and about 5% of each trip funds schooling in a village near the mountain. Choosing Your Tanzania Trip means choosing a crew that is looked after, on a mountain that is looked after.</p>`],
  [/each Your Tanzania Trip employee undergoes an exhaustive selection process\. With a team filled with the best of the best, we are proud to pay our team substantially higher than the average\./g, "every guide and driver in our partner's crew is selected by Baraka personally, and the crew is paid above the local average."],
  [/<p>To know the reputation of a company, it is best to listen to the people who have already used it\. You can do this by checking their reviews on [\s\S]*?SafariBookings<\/a>\.<\/p>/g, `<p>To know the reputation of a company, listen to the people who travelled before you: read the reviews of our partner Kilimanjaro Nature Tours on <a href="${P.tripadvisor.url}" target="_blank" rel="noopener noreferrer">Tripadvisor</a> and <a href="${P.google.url}" target="_blank" rel="noopener noreferrer">Google</a>.</p>`],
  [/alt="Travelife-Tanzania-Specialist_zebras"/g, 'alt="Zebras on the plains of Tanzania"'],
  [/<a href="#travelife-partner-status"[\s\S]*?<\/a>\s*/g, ""],
  [/ANVR Member • SGR Affiliated/g, "Licensed Tanzanian operator (TATO member) • Written booking confirmation"],
  [/Travelife Partner \(globally recognized tourism sustainability standard\) • Certified Kilimanjaro Responsible Trekking Organization \(KRTO\)/g, "Fair pay and proper gear for porters • 5% of each trip funds local schooling"],
  // About: listings and awards of the old operator
  [/<p>We are also partners and listed on renowned websites such as <a[^>]*safaribookings\.com[^>]*>SafariBookings\.com<\/a>\.<\/p>\s*/g, ""],
  [/<a[^>]*href="https?:\/\/(?:www\.)?(?:sgr|anvr)\.nl[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1"],
  [/<img[^>]*(?:ANVR_logo|logo-sgr|sgr-logo|anvr-logo|Travelife_logo|partner-Travelife)[^>]*\/?>/g, ""],
  [/\s*More information can be found on https?:\/\/(?:www\.)?sgr\.nl[^\s<]*/g, ""],
  [/\s*\(SGR-3700\)/g, ""],
  [/\bSGR-3700\b/g, ""],
  // Text only: file names and URLs with these words stay intact.
  [/(?<![/_-])\bANVR\b(?![-_])/g, "the Dutch travel trade"],
  [/(?<![/_-])\bSGR\b(?![-_])/g, "a travel guarantee fund"],
  [/<li\b[^>]*>\s*<a[^>]*travelife-partner-status[^>]*>[\s\S]*?<\/a>\s*<\/li>\s*/g, ""],
  [/Travelife Partner Status/g, "responsible travel"],
  [/(?<![/_-])\bTravelife\b(?![-_])/g, "responsible-travel"],
];

const reviewRules = [
  // YouTube videos of the old operator (its logo is in every thumbnail and video), with the headings that introduce them
  [/<h[2-4][^>]*>[^<]*(?:video is worth|worth watching|watching this video)[^<]*<\/h[2-4]>\s*/gi, ""],
  [/<h[2-4][^>]*>The (?:Tanzania Specialist|Your Tanzania Trip) Kilimanjaro Preparation Guide<\/h[2-4]>\s*(?=(?:<p>\s*)?<span class='flying-press-youtube')/g, ""],
  [/<p>\s*<span class='flying-press-youtube'[\s\S]*?<\/span>\s*<\/p>/g, "<!--VIDEO-->"],
  [/<span class='flying-press-youtube'[\s\S]*?<\/span>/g, "<!--VIDEO-->"],
  [/<iframe[^>]*youtube(?:-nocookie)?\.com\/embed\/[^>]*>\s*<\/iframe>/g, ""],
  [/<h[2-4][^>]*>\s*Curious for more\? You won(?:’|'|&#8217;)t regret watching this video\s*<\/h[2-4]>/g, ""],
  // The old operator's park videos ("Watch the video of the park here.") and Drive/YouTube links
  [/\s*(?:<em>)?\s*Watch the video of the park\s*(?:<\/em>)?\s*<a[^>]*youtu\.be[^>]*>\s*(?:<em>)?here(?:<\/em>)?\s*<\/a>\s*(?:<em>)?\.?(?:<\/em>)?/g, ""],
  [/\s*Access our Kilimanjaro gets Connected <a[^>]*drive\.google\.com[^>]*>[^<]*<\/a>\.?/g, ""],
  [/<a[^>]*href="https:\/\/(?:youtu\.be|www\.youtube\.com\/watch|drive\.google\.com)[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1"],
  // Insurance affiliate links of the old operator -> plain insurer link
  [/https:\/\/www\.chapkadirect\.com\/index\.php\?action=produit&amp;id=824&amp;app=(?:cd_tanzaniaspecialist|afrikasafari)/g, "https://www.chapkadirect.com/"],
  [/https:\/\/www\.google\.com\/url\?q=https:\/\/www\.chapkadirect\.com\/index\.php\?action%3Dproduit%26id%3D824%26app%3D(?:cd_tanzaniaspecialist|afrikasafari)[^"']*/g, "https://www.chapkadirect.com/"],
  [/<a class="ts-award[^"]*"[\s\S]*?<\/a>/g, ""],
  [/<img[^>]*(?:Tripadvisor-TC-Badge|Tripadvisor-travellers-choice|tripadvisor-tc-badge|tripadvisorlogo|tripadvisor-tc-title)[^>]*\/?>/g, ""],
  [/<a[^>]*>\s*<\/a>/g, ""],
  [/https?:\/\/(?:www\.)?tripadvisor\.[a-z.]+\/[^"'\s<]*d12997236[^"'\s<]*/g, PARTNER_REVIEWS_HREF],
  [/https?:\/\/(?:www\.)?tripadvisor\.[a-z.]+\/ShowUserReviews[^"'\s<]*/g, PARTNER_REVIEWS_HREF],
  [/https?:\/\/g\.co\/kgs\/[^"'\s<]*/g, "/our-partner/"],
  [/https?:\/\/www\.google\.[a-z.]+\/maps\/place\/[^"'\s<]*/g, "/our-partner/"],
  [/https?:\/\/www\.google\.[a-z.]+\/search\?[^"'\s<]*tanzania\+specialist[^"'\s<]*/g, "/our-partner/"],
  [/✓ TripAdvisor Travell?ers(?:’|'|&#8217;|&#039;)? Choice(?: Award)?(?: \d{4})?/g, "✓ Local partner rated 5.0 on Tripadvisor"],
  [/Travell?ers(?:’|'|&#8217;|&#039;)? Choice(?: Award)?(?: \d{4})?/g, "[FILL: award]"],
  // The old operator's responsible-travel award (certificate image, heading and paragraph)
  [/<p><img[^>]*Kilimanjaro-vertified[^>]*\/><\/p>\s*/g, ""],
  [/(?:<h3><\/h3>\s*)?<h2>We(?:’|'|&#8217;)re Proud to Have Achieved [^<]*<\/h2>\s*<p>[\s\S]*?<\/p>\s*/g, ""],
  [/<i>\s*Based on <u>(?:5247|1689)\+ reviews<\/u>\s*<\/i>/g, ""],
  // USP bar under the hero: the 5-star claim belongs to the partner
  [/5-star customer reviews/g, `Local partner rated ${P.tripadvisor.score}/${P.tripadvisor.scale}`],
  [/\b(?:5247|1689)\+ reviews\b/g, "[FILL: review count]"],
  // Factual slips and borrowed claims in the source texts
  [/<p><strong>THIS SUMMER:[^<]*<\/strong>(?:<br \/>)?[\s\S]*?<\/p>\s*/g, ""],
  [/\bCoyotes\b/g, "Jackals"],
  [/\bcoyotes\b/g, "jackals"],
  [/\bmoose\b/g, "eland"],
  [/,?\s*officially the most beautiful climbing route in the world!/g, ", known as one of the most scenic routes on the mountain."],
  [/was once voted the most beautiful climbing route in the world!/g, "is known as one of the most scenic routes on Kilimanjaro."],
  [/(?:is|was) (?:once )?(?:voted )?the most beautiful climbing route in the world/g, "is one of the most scenic routes on Kilimanjaro"],
  [/voted (?:the )?most beautiful (?:climbing )?route in the world/g, "known as one of the most scenic routes on Kilimanjaro"],
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
    s = s.replace(new RegExp(re.source.replace(/\\\//g, "(?:\\\\)?\\/"), re.flags), to.replace(/\//g, "\\/"));
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

const TA = P.tripadvisor;
const GOOGLE_HREF = P.google.url;
const EXT = ' target="_blank" rel="noopener noreferrer"';
const WA_HREF = "https://wa.me/" + CO.whatsapp.replace(/[^\d]/g, "");
const BARAKA_IMG = "/brand/partner/baraka-dalali.webp";
const CREW_IMG = "/brand/partner/crew-summit.webp";
const AWARDS = TA.awards.join(" · ");
const scoreLine = () => `${TA.score}/${TA.scale} on Tripadvisor · ${TA.count} reviews · checked ${TA.checkedOn}`;
const quoteCards = (cls = "") =>
  P.quotes
    .map(
      (q) => `<figure class="quote-card ${cls}">
  <blockquote><p>“${q.text}”</p></blockquote>
  <figcaption>${q.name} · review on <a href="${GOOGLE_HREF}"${EXT}>${q.platform}</a></figcaption>
</figure>`
    )
    .join("\n");
const badgeRow = () => `<ul class="badge-row" aria-label="Recognised by">
  <li><img src="/brand/partner/badge-tripadvisor-2023.webp" width="83" height="104" alt="Tripadvisor Travellers' Choice 2023" loading="lazy"></li>
  <li><img src="/brand/partner/badge-tripadvisor-2024.webp" width="83" height="104" alt="Tripadvisor Travellers' Choice 2024" loading="lazy"></li>
  <li><img src="/brand/partner/badge-tato.webp" width="80" height="80" alt="Tanzania Association of Tour Operators" loading="lazy"></li>
  <li><img src="/brand/partner/badge-tanapa.webp" width="71" height="80" alt="Tanzania National Parks" loading="lazy"></li>
  <li><img src="/brand/partner/badge-ttb.webp" width="116" height="80" alt="Tanzania Tourist Board" loading="lazy"></li>
</ul>`;

function headerTrustItem() {
  return `<div class="flex relative gap-4 items-center md:gap-6 lg:mx-auto">
  <a href="${TA.url}"${EXT} class="flex items-center gap-3 text-white partner-line">
    <span class="i-cib-tripadvisor text-2xl" aria-hidden="true"></span>
    <span class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 14)}</span>
    <span class="hidden md:inline"><strong>${TA.score}/${TA.scale}</strong> · ${TA.count} reviews of our local partner ${P.name}</span>
    <span class="sr-only">Tripadvisor score checked ${TA.checkedOn}</span>
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
          <div class="flex items-center gap-2"><span class="text-lg font-bold tracking-widest">${TA.score}/${TA.scale}</span><span class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 18)}</span></div>
          <p class="text-sm"><i>${TA.count} reviews of ${P.name} · ${AWARDS} · checked ${TA.checkedOn}</i></p>
        </div>
      </div>
      <a href="${TA.url}"${EXT} class="font-bold tracking-wider uppercase underline">Read reviews on Tripadvisor</a>
    </div>
  </div>
</div>
`;
}

function footerPartnerLine() {
  return `<p class="mt-8 text-sm partner-line">Trips operated on the ground by <a href="/our-partner/" class="underline">${P.name}</a>, ${P.city}.</p>
<p class="mt-2 text-sm partner-line">E-mail <a href="mailto:${CO.email}" class="underline">${CO.email}</a> · WhatsApp <a href="${WA_HREF}"${EXT} class="underline">${CO.whatsapp}</a></p>
`;
}

/** Compact partner block that replaces a review carousel on inner pages. */
function partnerCompact(stacked = false) {
  return `<div class="mx-auto max-w-4xl partner-card rounded-md">
  <div class="flex flex-col gap-6 px-6 py-8 ${stacked ? "" : "md:flex-row md:items-center "}md:px-10">
    <img src="${BARAKA_IMG}" alt="${P.owner}, founder of ${P.name}" width="700" height="700" class="w-24 h-24 rounded-full object-cover shrink-0 ${stacked ? "" : "md:w-28 md:h-28"}" loading="lazy" />
    <div class="flex-1">
      <h3 class="text-2xl text-white">Reviews of our local partner</h3>
      <p class="mt-2">Every trip is run on the ground by ${P.name} in ${P.city}, led by ${P.owner}. Travellers rate them ${TA.score} out of ${TA.scale} on Tripadvisor (${AWARDS}). We show the score with the date we last checked it and link to the original profile.</p>
      <p class="mt-3 flex flex-wrap items-center gap-2"><span class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 18)}</span><span class="partner-score font-bold tracking-wider">${scoreLine()}</span></p>
    </div>
    <div class="flex flex-col gap-3 shrink-0">
      <a href="${TA.url}"${EXT} class="btn btn-small btn-yellow text-center">Read reviews on Tripadvisor</a>
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
        <p class="mt-3">${BRAND} is the party you book with: we plan the trip with you, send the proposal and the invoice, and are your contact before departure. The trip itself is operated by <strong>${P.name}</strong>, a licensed tour operator in ${P.city} founded by ${P.owner}. His guides, drivers, cooks and mountain crew are the people you will meet every day.</p>
        <ul class="mt-5 grid gap-3 sm:grid-cols-2">
          <li class="flex gap-3"><span class="text-yellow" aria-hidden="true">✓</span> ${P.whatDoesWhat.ytt}</li>
          <li class="flex gap-3"><span class="text-yellow" aria-hidden="true">✓</span> ${P.whatDoesWhat.knt}</li>
        </ul>
        <div class="mt-6 grid gap-4 sm:grid-cols-3">
${quoteCards("quote-card--dark")}
        </div>
        <p class="mt-6 flex flex-wrap gap-3">
          <a href="/our-partner/" class="btn btn-small btn-yellow">Meet our partner</a>
          <a href="${TA.url}"${EXT} class="btn btn-small btn-red--outlined !text-white !border-white">Read reviews on Tripadvisor</a>
        </p>
      </div>
      <div class="partner-card rounded-md p-6 text-center flex flex-col justify-center">
        <img src="${BARAKA_IMG}" alt="${P.owner}, founder of ${P.name}" width="700" height="700" class="mx-auto w-44 h-44 rounded-full object-cover" loading="lazy" />
        <h4 class="mt-4 text-xl text-white">${P.owner}</h4>
        <p class="text-sm">Founder and licensed Kilimanjaro guide, ${P.name}, ${P.city}</p>
        <p class="mt-4 flex justify-center" aria-hidden="true">${stars(5, "text-yellow", 20)}</p>
        <p class="partner-score font-bold tracking-wider">${TA.score}/${TA.scale} on Tripadvisor</p>
        <p class="text-sm">${TA.count} reviews · ${AWARDS}<br>checked ${TA.checkedOn}</p>
      </div>
    </div>
  </div>
</div>`;
}

/** The /our-partner/ page body. */
function partnerPageBody() {
  const video = P.youtubeVideoId ? `
      <h2>On the mountain with Baraka's crew</h2>
      <p>A short clip from the ${P.name} YouTube channel: the last stretch to the roof of Africa.</p>
      <div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${P.youtubeVideoId}" title="Kilimanjaro Nature Tours: the last stretch to the summit" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
      <p><a href="${P.youtube}"${EXT}>More videos on the ${P.name} channel</a>.</p>` : "";
  return `<div class="relative z-10 px-5 pt-6 pb-12 mx-auto max-w-7xl container-2xl">
  <ul id="breadcrumbs" class="flex items-center py-4 md:py-6 gap-x-3"><li><a href="/">Home</a><span class="breadcrumb-separator i-ion-chevron-right"></span></li><li class="active"><a href="/our-partner/">Our local partner</a></li></ul>
  <div class="grid grid-cols-1 gap-y-8 gap-x-12 lg:grid-cols-2">
    <div class="col-span-1 ts-prose">
      <h1>Our local partner: ${P.name}</h1>
      <p>Every trip you book with ${BRAND} is operated in Tanzania by ${P.name}. This page tells you who they are, who you will meet, and how the roles are divided, so you know exactly who you are dealing with before and during your trip.</p>
      <h2>Meet ${P.owner}</h2>
      <p>${P.founderBio}</p>
      <p>Baraka was also where ${BRAND} began: ${CO.owner} and ${CO.cofounder} did their internship with him in Arusha, helped him set up his company for international guests, and decided to keep working together. You can read that story on our <a href="/about-tanzania-specialist/">About page</a>.</p>
      <h2>The crew you will meet</h2>
      <p>${P.crew}</p>
      <p>On safari you travel in a private 4×4 with your own driver-guide; on Kilimanjaro you climb with a guide, assistant guides, a cook and porters, with daily health checks on the mountain. On Zanzibar the team hands you over to trusted local hosts and picks you up again for the flight home.</p>
      <h2>Who does what</h2>
      <ul>
        <li><strong>${BRAND}</strong> (${CO.owner}, Nagele, the Netherlands): ${P.whatDoesWhat.ytt}</li>
        <li><strong>${P.name}</strong> (${P.owner}, ${P.city}): ${P.whatDoesWhat.knt}</li>
      </ul>
      <h2>How a booking works</h2>
      <ol>
        <li><strong>Plan with us.</strong> Send us your dates and wishes; you get a day-by-day proposal and a price from ${BRAND}, free and without obligation.</li>
        <li><strong>We confirm with Baraka.</strong> Once you say yes, we fix the itinerary, lodges and permits with ${P.name} and send you the invoice and the travel documents.</li>
        <li><strong>You travel with his crew.</strong> From the airport in Kilimanjaro or Arusha onwards, Baraka's team takes care of you. We stay reachable in the Netherlands throughout.</li>
      </ol>
      <h2>Recognised by</h2>
      <p>${P.name} is a member of the Tanzania Association of Tour Operators, works under Tanzania National Parks and the Tanzania Tourist Board, and has received the Tripadvisor Travellers' Choice award in 2023 and 2024.</p>
      ${badgeRow()}
      <h2>What travellers say about ${P.name}</h2>
      <p><span class="stars-ratings inline-flex align-middle" aria-hidden="true">${stars(5, "text-yellow", 18)}</span> <strong>${scoreLine()}</strong></p>
      <div class="grid gap-4 md:grid-cols-3 not-prose">
${quoteCards()}
      </div>
      <p class="flex flex-wrap gap-3"><a class="btn btn-small btn-red" href="${TA.url}"${EXT}>Read reviews on Tripadvisor</a> <a class="btn btn-small btn-green--outlined" href="${GOOGLE_HREF}"${EXT}>Reviews on Google</a></p>
      ${video}
      <h2>Contact before and during your trip</h2>
      <p>Before departure everything goes through ${BRAND}: <a href="mailto:${CO.email}">${CO.email}</a>, <a href="tel:${CO.phone.replace(/[^\d+]/g, "")}">${CO.phone}</a> or <a href="${WA_HREF}"${EXT}>WhatsApp</a>. During the trip you also have the direct contact details of ${P.name}:</p>
      <ul>
        <li>Email: <a href="mailto:${P.email}">${P.email}</a></li>
        <li>Website: <a href="${P.url}"${EXT}>${P.url.replace("https://", "")}</a></li>
        <li>Postal address: ${P.postal}, Tanzania</li>
      </ul>
    </div>
    <div class="col-span-1">
      <div class="partner-card rounded-md p-6 text-center">
        <img src="${BARAKA_IMG}" alt="${P.owner}, founder of ${P.name}, on the trail with Kilimanjaro behind him" width="700" height="700" class="mx-auto w-48 h-48 rounded-full object-cover" loading="lazy" />
        <h3 class="mt-4 text-2xl text-white">${P.owner}</h3>
        <p>Founder and licensed Kilimanjaro guide, ${P.name}</p>
        <p class="mt-3 flex justify-center" aria-hidden="true">${stars(5, "text-yellow", 20)}</p>
        <p class="partner-score font-bold tracking-wider">${TA.score}/${TA.scale} on Tripadvisor · ${TA.count} reviews</p>
        <p class="text-sm">${AWARDS}</p>
      </div>
      <figure class="mt-6">
        <img src="${CREW_IMG}" alt="The ${P.name} crew on the summit of Kilimanjaro" width="1920" height="663" class="w-full rounded-md" loading="lazy" />
        <figcaption class="mt-2 text-sm text-anthracite">Baraka's crew on the summit of Kilimanjaro. You climb with a team, not with a name on a website.</figcaption>
      </figure>
      <figure class="mt-6">
        <img src="/brand/partner/safari-lions.webp" alt="Lions seen from a ${P.name} safari vehicle" width="1920" height="663" class="w-full rounded-md" loading="lazy" />
        <figcaption class="mt-2 text-sm text-anthracite">On safari you travel in a private 4×4 with your own driver-guide.</figcaption>
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
      <div class="flex items-center"><div class="mr-2 text-base font-bold tracking-wider text-white">${TA.score}/${TA.scale}</div><div class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 14)}</div></div>
      <p class="text-sm text-white"><i>${P.name}, our local partner · ${TA.count} reviews · ${AWARDS} · checked ${TA.checkedOn}</i></p>
    </div>
  </div>
</div>`;
}
const TILE_SCORES_OPEN = /<div class="flex flex-wrap gap-3 items-center mt-6 md:gap-6">/;

/** Sidebar widget "How previous guests rated us" (travel-proposal and similar templates). */
function sidebarPartnerWidget() {
  return `<section id="ts_reviews_widget-4" class="widget widget_ts_reviews_widget"><h2 class="text-lg font-bold tracking-widest uppercase text-anthracite">Our local partner</h2>
<p class="mt-3 text-sm">Your trip is operated on the ground by <a href="/our-partner/" class="underline">${P.name}</a>, ${P.city}, founded by ${P.owner}.</p>
<p class="mt-2 flex items-center gap-2"><span class="stars-ratings flex" aria-hidden="true">${stars(5, "text-yellow", 16)}</span><strong>${TA.score}/${TA.scale}</strong></p>
<p class="text-sm partner-line">${TA.count} reviews on Tripadvisor · ${AWARDS} · checked ${TA.checkedOn}</p>
<p class="mt-2 text-sm"><a href="${TA.url}"${EXT} class="underline">Read reviews on Tripadvisor</a></p>
</section>`;
}

function stripOldTrust(html) {
  html = replaceDivs(html, RATINGS_OPEN, "");
  // Instagram "social feed" rows: posts of the old operator's followers
  html = replaceDivs(html, /<div class="relative isolate -mt-1 overflow-hidden flexible-content flexible-content-row-\d+[^"]*">/, "", (inner) => inner.includes("Published on: Instagram"));
  // FAQ items about the old operator's Travelife status
  html = replaceDivs(html, /<div x-data="\{ open: false \}"[^>]*>/, "", (inner) => /Travelife|KRTO|responsible-travel Partner/.test(inner));
  html = replaceDivs(html, /<div id="travelife-partner-status"[^>]*>/, "");
  html = html.replace(/<option value="travelife-partner-status"[^>]*>[^<]*<\/option>\s*/g, "");
  html = html.replace(/<section id="ts_reviews_widget-\d+"[^>]*>[\s\S]*?<\/section>/g, sidebarPartnerWidget());
  html = replaceDivs(html, TILE_SCORES_OPEN, tileScoreRow(), (inner) => /4\.[79]\/5/.test(inner));
  html = replaceDivs(html, CAROUSEL_OPEN, partnerCompact(), (inner) => inner.includes("review-card"));
  return html;
}

function callAnExpert(html) {
  // Two office buttons (USA, UK) -> one phone button and a WhatsApp button; the portrait is Baraka's.
  html = html.replace(/<span class="!w-\[2\.01em\] !h-\[1\.50em\] text-white ts-flag-usa"><\/span>\s*<span class="!text-base">USA: <\/span>/g, '<span class="!w-[2.01em] !h-[1.50em] text-white ts-flag-nl"></span>\n<span class="!text-base">NL: </span>');
  html = html.replace(/<a class="([^"]*btn-red)"\s+href="[^"]*"\s+target="">\s*<span class="flex gap-2\.5 items-center">\s*<span class="[^"]*ts-flag-gb"><\/span>[\s\S]*?<\/a>\s*/g, (m, cls) => `<a class="${cls}" href="${WA_HREF}" target="_blank" rel="noopener noreferrer"><span class="flex gap-2.5 items-center"><span class="i-cib-whatsapp text-xl" aria-hidden="true"></span><span class="!text-base">WhatsApp: </span>${CO.whatsapp}</span></a>\n`);
  html = html.replace(/Our specialists are here to assist you/gi, `${CO.owner} in the Netherlands and ${P.owner} in Arusha are here to help`);
  html = html.replace(/<a class="([^"]*)"\s+href="\/contact\/">\s*<u>other countries<\/u>\s*<\/a>/gi, (m, cls) => `<a class="${cls}" href="mailto:${CO.email}"><u>${CO.email}</u></a>`);
  return html;
}

function contactPage(html) {
  html = html.replace(/<p><strong><span style="font-weight: 400">Founded by [\s\S]*?<\/span><\/strong><\/p>/, `<p>${BRAND} is run by ${CO.owner} and ${CO.cofounder} from Nagele in the Netherlands. Every trip is operated on the ground by our local partner <a href="/our-partner/">${P.name}</a> in Arusha, Tanzania, founded by ${P.owner}: his guides, drivers and mountain crew are the people you meet during your trip.</p>`);
  html = html.replace(/<p><strong>To speak with one of our amazing travel consultants:<\/strong><\/p>\s*<ul[^>]*>[\s\S]*?<\/ul>/, `<p><strong>To talk about your trip:</strong></p>\n<ul>\n<li>Email: <a href="mailto:${CO.email}">${CO.email}</a></li>\n<li>Phone: <a href="${PHONE_TEL}">${CO.phone}</a> (Netherlands, English and Dutch)</li>\n<li>WhatsApp: <a href="${WA_HREF}" target="_blank" rel="noopener noreferrer">${CO.whatsapp}</a></li>\n</ul>`);
  html = html.replace(/<p><strong>For suppliers to get in touch with our reservations team:<\/strong><\/p>\s*<ul>[\s\S]*?<\/ul>/, `<p><strong>During your trip in Tanzania:</strong></p>\n<ul>\n<li>${P.name}, ${P.city}: <a href="mailto:${P.email}">${P.email}</a> · <a href="${P.url}" target="_blank" rel="noopener noreferrer">${P.url.replace("https://", "")}</a></li>\n</ul>`);
  html = html.replace(/<p><strong>Questions about our <a[^>]*>sustainability policy<\/a>:<\/strong><\/p>\s*<ul>[\s\S]*?<\/ul>/, `<p><strong>Suppliers, partners and press:</strong></p>\n<ul>\n<li>Email: <a href="mailto:${CO.email}">${CO.email}</a></li>\n</ul>`);
  html = html.replace(/<h2>Financial Information<\/h2>\s*<p>[\s\S]*?<\/p>/, `<h2>Company details</h2>\n<p><span style="text-decoration: underline">Company</span>: ${CO.legalName}, trading as ${BRAND}<br />\n<span style="text-decoration: underline">Chamber of Commerce (KvK)</span>: ${CO.kvk}<br />\n<span style="text-decoration: underline">VAT (BTW)</span>: ${CO.vat}<br />\n<span style="text-decoration: underline">Bank</span>: ${CO.bank} · IBAN ${CO.iban} · BIC ${CO.bic}</p>`);
  html = html.replace(/<p><span class='flying-press-youtube'[\s\S]*?<\/span><\/p>/, "");
  html = html.replace(/\s*Check out all the latest travel stories from our guests on the <a[^>]*>[^<]*<\/a> page!/, "");
  return html;
}

/** Guarantees page: the old fund/association texts become what the company actually guarantees. */
function guaranteesPage(html) {
  const body = `<h2>No worries… or… Hakuna Matata!</h2>
<p>A well-known phrase to anyone who has ever travelled to Africa, and exactly how we want you to feel when you book with us. So here is, in plain words, what ${BRAND} guarantees and how your money and your trip are protected.</p>
<h3>Who you book with</h3>
<p>You book with ${BRAND} (${CO.legalName}, Chamber of Commerce ${CO.kvk}, VAT ${CO.vat}) in the Netherlands. Your trip is operated in Tanzania by <a href="/our-partner/">${P.name}</a>, a licensed Tanzanian tour operator and member of the Tanzania Association of Tour Operators, founded by ${P.owner}. We confirm every booking with them in writing before we send you an invoice.</p>
<h3>How your payment works</h3>
<ul>
<li>You pay a deposit when you confirm your trip and the balance before departure; the exact amounts and dates are on your proposal and invoice.</li>
<li>Park fees, permits and lodges are reserved in your name as soon as your deposit is in, so your dates are fixed.</li>
<li>We do not use a travel guarantee fund. We tell you that up front, and we keep the money trail short: one invoice, one bank account (${CO.bank}, IBAN ${CO.iban}), no third parties in between.</li>
</ul>
<h3>What we guarantee</h3>
<ul>
<li><strong>A clear price.</strong> The price on your proposal is the price you pay. Park fees, accommodation, transport, guide, meals as listed and the permits are in it; what is not included is written down.</li>
<li><strong>A licensed crew.</strong> Guides are licensed by the Kilimanjaro National Park authority and trained in Wilderness First Response, first aid and CPR; porters are hired fairly, with proper gear and weighed loads.</li>
<li><strong>One contact, two time zones.</strong> ${CO.owner} in the Netherlands before and during your trip, and Baraka's team in Arusha on the ground, by phone, e-mail and WhatsApp.</li>
<li><strong>Flexibility.</strong> Change your dates, route or lodges before departure and we rework the proposal; on the ground the crew adapts the day to the weather and the wildlife.</li>
<li><strong>Honest reviews.</strong> We show our partner's score with the date we checked it and link to the source, and we ask you to review your trip where the next traveller can read it.</li>
</ul>
<h3>Travel insurance</h3>
<p>Take out travel insurance that covers cancellation, medical costs and, if you climb Kilimanjaro, high-altitude evacuation. We are happy to tell you what to look for; see <a href="/practical-information/travel-insurance/">travel insurance</a>.</p>
`;
  return html.replace(/(<h1>Our Guarantees<\/h1>)[\s\S]*?(<p><img[^>]*Walking-safari-Masaai[\s\S]*?<\/p>)/, (m, h1, img) => `${h1}\n${body}${img}`);
}

function aboutPage(html) {
  html = html.replace(/<p>Your Tanzania Trip was founded in 2017 by [^<]*?\. /, `<p>${BRAND} is run by ${CO.owner} and ${CO.cofounder} from the Netherlands and works with one local partner in Tanzania: <a href="/our-partner/">${P.name}</a> in Arusha, founded by ${P.owner}. `);
  // The old founders' story, staff count and office video do not apply to the new company.
  html = html.replace(/\s*<p><em>Your Tanzania Trip founders:[^<]*<\/em><\/p>/, "");
  html = html.replace(/the prestigious <a[^>]*>TripAdvisor \[FILL: award\] for 2026<\/a>,\s*<strong>placing us among the top 10% attractions worldwide<\/strong>/, `the <a href="${TA.url}" target="_blank" rel="noopener noreferrer">Tripadvisor Travellers' Choice award in 2023 and 2024</a> for ${P.name}, <strong>the crew that runs your trip on the ground</strong>`);
  html = html.replace(/(<h2 id="our-story">Our Story<\/h2>)\s*<p>Born from a passion[\s\S]*?<\/p>/, `$1\n<p>${tokens.story.en}</p>\n<figure><img src="${CREW_IMG}" alt="The ${P.name} crew on the summit of Kilimanjaro" width="1920" height="663" loading="lazy" /><figcaption>Baraka's crew on the summit of Kilimanjaro.</figcaption></figure>`);
  html = html.replace(/(<h2 id="our-offices">Our Offices<\/h2>)\s*<p>Your Tanzania Trip has two offices[\s\S]*?<\/p>/, `$1\n<p>${BRAND} is based in Nagele, the Netherlands. Our local partner <a href="/our-partner/">${P.name}</a> works from ${P.city}, close to the northern parks and Kilimanjaro. You plan and book with us in the Netherlands; on the ground you are looked after by Baraka and his crew. We are a small team on both sides, which is exactly why you always speak to someone who knows your trip.</p>`);
  html = html.replace(/(<h2 id="guaranteed-security">Guaranteed Security<\/h2>)\s*<p>[\s\S]*?<\/p>/, `$1\n<p>You book with ${BRAND} (${CO.legalName}, KvK ${CO.kvk}) and pay a deposit on confirmation and the balance before departure. Your trip is operated by ${P.name}, a licensed Tanzanian tour operator and member of the Tanzania Association of Tour Operators. We confirm every booking with them in writing before we invoice you, and we are reachable by phone, e-mail and WhatsApp before and during your trip. More questions? <a href="/contact/">Get in touch</a>.</p>`);
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
      <p>Every ${BRAND} journey is run on the ground by ${P.name} in Arusha, the crew travellers have been reviewing for years. We show their score with the date we checked it and link to the original profiles, so you can read every review at the source.</p>
      <p><span class="stars-ratings inline-flex align-middle" aria-hidden="true">${stars(5, "text-yellow", 18)}</span> <strong>${scoreLine()}</strong><br><span class="text-sm">${AWARDS}</span></p>
      <div class="grid gap-4 not-prose">
${quoteCards()}
      </div>
      <p class="flex flex-wrap gap-3"><a class="btn btn-small btn-red" href="${TA.url}"${EXT}>Read reviews on Tripadvisor</a> <a class="btn btn-small btn-green--outlined" href="${GOOGLE_HREF}"${EXT}>Reviews on Google</a></p>
      <h2>Share your own story</h2>
      <p>After your trip we ask you to leave a review on Tripadvisor or Google, with your first name and the date, so the next traveller can read it where it was written. <a href="/our-partner/">Meet our local partner</a> or <a href="/travel-proposal/">request a travel proposal</a>.</p>
    </div>
    <div class="col-span-1">
      ${partnerCompact(true)}
      <figure class="mt-6">
        <img src="${CREW_IMG}" alt="The ${P.name} crew on the summit of Kilimanjaro" width="1920" height="663" class="w-full rounded-md" loading="lazy" />
        <figcaption class="mt-2 text-sm text-anthracite">Baraka's crew on the summit of Kilimanjaro.</figcaption>
      </figure>
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
  "/app/": "/", // the old operator's "Africa Safari App"
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
  // Home hero and quiz intro: jeeps with both old logos on the spare wheels (AVIF, so swapped by path)
  [/\/wp-content\/uploads\/2026\/10\/IM_TZ_LNDU_Meulemans-safari_Looking-at-zebras-and-another-TS-jeep-scaled-1(?:-scaled)?(?:-\d+x\d+)?\.avif/g, "/brand/partner/safari-lions.webp"],
  [/\/wp-content\/uploads\/2025\/06\/Tanzania-vacation(?:-scaled)?(?:-\d+x\d+)?\.jpg/g, `${U}2025/10/IM_TZ_SER_Guide-and-guests-looking-at-tree-1024x683.jpg`],
  // Hero videos of the old operator (its crew, jeeps and logo) -> our own slow-pan loop from partner photos
  [/\/wp-content\/uploads\/20\d\d\/\d\d\/(?:Video-TS-20s-169-NO-TEXT|50-16-9-20s-3|Photographic-safari-Tanzania-TS|YTDown\.com_YouTube_[^"'\s]*|Couple-16-9-20s|Family-young-children-1-1-20s-2)\.mp4/g, "/brand/video/safari-loop.mp4"],
  [/\/wp-content\/uploads\/20\d\d\/\d\d\/(?:WhatsApp-Image-2026-02-28-at-18\.32\.46|DSC_1116|photographer-jeep-2-e1769950478451|Tanzania-Travel-Tanzania-Specialist-jeep|DSC08965-1|Family-holiday)(?:-\d+x\d+)?\.(?:avif|jpg)/g, "/brand/video/safari-loop-poster.jpg"],
  // Consultant portraits of the old team (hero form, "Call an expert", contact)
  [/\/wp-content\/uploads\/2023\/11\/team_member_tanzania_yellow(?:-\d+x\d+)?\.jpg/g, "/brand/partner/baraka-dalali.webp"],
  [/\/wp-content\/uploads\/2023\/11\/test_image_2-1(?:-\d+x\d+)?\.jpg/g, "/brand/partner/baraka-dalali.webp"],
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
    if (slug === "practical-information__guarantees") s = guaranteesPage(s);
    // Traveller guide: the reviews tile lost its badge image and title with the old awards
    if (slug === "traveller-guide") s = s.replace(/(Read the reviews from our travellers[\s\S]*?<h3 class="theme-card-title">)\s*(<\/h3>\s*<\/div>)(\s*<\/div>\s*<\/a>)/, `$1Partner reviews$2\n<img width="920" height="580" src="${CREW_IMG}" class="object-cover" alt="Baraka's crew on the summit of Kilimanjaro" loading="lazy" decoding="async"/>$3`);
    if (slug === "tanzania-traveller-reviews") s = reviewsPage(s);
    return s;
  });
}
fs.writeFileSync(path.join(root, "content/pages/our-partner.html"), partnerPageBody());

// 2a. Paraphrased text blocks (content/rewrites/<slug>.json, made with scripts/rewrite-extract.mjs):
// each block's original inner HTML is replaced by the rewritten one when the tags still match.
{
  const dir = path.join(root, "content/rewrites");
  let pages = 0, applied = 0, skipped = 0;
  const tagsOf = (h) => (h.match(/<[^>]+>/g) || []).map((t) => t.replace(/\s+/g, " ").trim()).join("|");
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const page = path.join(root, "content/pages", f.replace(/\.json$/, ".html"));
      if (!fs.existsSync(page)) continue;
      let html = fs.readFileSync(page, "utf8");
      let data;
      try {
        data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      } catch {
        console.warn("rewrites: invalid JSON in", f);
        continue;
      }
      let changed = false;
      for (const b of data.blocks || []) {
        if (!b.orig || !b.html || b.orig === b.html) continue;
        // Rules added after the paraphrases were made apply to both sides, so they keep matching.
        b.orig = rebrandText(b.orig);
        b.html = rebrandText(b.html);
        if (tagsOf(b.orig) !== tagsOf(b.html) || !html.includes(b.orig)) {
          skipped++;
          continue;
        }
        html = html.split(b.orig).join(b.html); // every copy of a repeated block
        applied++;
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(page, html);
        pages++;
      }
    }
  }
  console.log(`rewrites: ${pages} pages, ${applied} blocks applied, ${skipped} skipped`);

  // Claims about the old operator's offices, sister company and size, in original or paraphrased form.
  const P_FIX = [
    [/<p[^>]*>(?:(?!<\/p>)[\s\S])*?(?:Through our|Our) sister company,? <strong[^>]*>our partners in East Africa<\/strong>[\s\S]*?<\/p>\s*/g, ""],
    [/<p>[^<]*two offices[^<]*(?:headquarters|head office)[^<]*<\/p>/gi, `<p>${BRAND} is based in Nagele, the Netherlands; our local partner ${P.name} works from ${P.city}, close to the northern parks and Kilimanjaro.</p>`],
    [/<p>(?:Our|Through our) sister company,? (?:<strong[^>]*>)?our partners in East Africa(?:<\/strong>)?,? (?:also )?has offices in Nairobi \(Kenya\) and Kampala \(Uganda\)\.<\/p>\s*/gi, ""],
    [/<p>[^<]*having our headquarters in Europe[^<]*<\/p>/gi, `<p>Planning with us in the Netherlands and travelling with ${P.name} on the ground gives you one clear contact before departure and an experienced crew in Tanzania.</p>`],
    [/<p>[^<]*headquarters in Europe[^<]*<\/p>/gi, `<p>Planning with us in the Netherlands and travelling with ${P.name} on the ground gives you one clear contact before departure and an experienced crew in Tanzania.</p>`],
    [/(?:Our headquarters are right here on the ground in Tanzania|We are based right here in Tanzania)\./g, `Our partner ${P.name} is based right here in Tanzania.`],
    [/\s*(?:With|Together with) its sister company,? our partners in East Africa,? it(?:’|'|&#8217;)?s? (?:is )?<strong>one of the leading safari companies in East Africa<\/strong>\./g, ` Every trip is run on the ground by our partner <strong>${P.name}</strong> in ${P.city}.`],
    [/<p[^>]*>(?:Through our|Our) sister company,? <strong[^>]*>our partners in East Africa<\/strong>,?[\s\S]*?<\/p>\s*/g, ""],
    [/<p>[^<]*sister company,? our partners in East Africa[^<]*<\/p>\s*/g, ""],
    [/\s*Our sister company,? (?:<strong[^>]*>)?our partners in East Africa(?:<\/strong>)?,?[^.]*\./g, ""],
    // Time-limited lodge offers of the old site (no fake urgency) and factual slips in the source
    // The old operator's payment terms (25% deposit when departure is more than 120 days away)
    [/,? and when your departure is more than 120 days away, a 25% deposit is all you pay at booking\./g, ". You pay a deposit when you confirm your trip and the balance before departure; the amounts and dates are on your proposal."],
    [/alt="Flexible safari payment option with 25% due at booking when departure is more than 120 days away"/g, 'alt="Clear payments: a deposit on confirmation and the balance before departure"'],
    [/\bFlexible payment options\b/g, "Clear payment schedule"],
    [/\bflexible payment options\b/g, "a clear payment schedule"],
    [/Swahili for (?:“|")long rush(?:”|")/g, "Swahili for “slowly, slowly”"],
    [/\bHarabi\b/g, "Habari"],
  ];
  let fixed = 0;
  for (const f of fs.readdirSync(path.join(root, "content/pages"))) {
    const p = path.join(root, "content/pages", f);
    const before = fs.readFileSync(p, "utf8");
    let after = before;
    for (const [re, to] of P_FIX) after = after.replace(re, to);
    if (after !== before) { fs.writeFileSync(p, after); fixed++; }
  }
  console.log(`old-company claims fixed on ${fixed} pages`);
}

// 2b. Practical-information fragments (public/ajax/fetch_post_content/<id>.html) are the article body of the
// page with that id; regenerate them from the rebranded pages so tabs and pages never drift apart.
{
  const dir = path.join(root, "public/ajax/fetch_post_content");
  const idToPath = {};
  for (const p of walk(path.join(root, "content/pages"), [".html"])) {
    const s = fs.readFileSync(p, "utf8");
    for (const m of s.matchAll(/<a href="(\/[^"]*\/)"\s+data-id="(\d+)"/g)) idToPath[m[2]] = m[1];
  }
  let regenerated = 0;
  for (const [id, urlPath] of Object.entries(idToPath)) {
    const file = path.join(dir, `${id}.html`);
    if (removed[urlPath]) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
      continue;
    }
    const page = path.join(root, "content/pages", urlPath.replace(/^\/|\/$/g, "").replace(/\//g, "__") + ".html");
    if (!fs.existsSync(page)) continue;
    const html = fs.readFileSync(page, "utf8");
    const open = html.indexOf('<div class="content-wrapper ts-prose">');
    if (open === -1) continue;
    const end = matchDiv(html, open);
    const inner = html.slice(open + '<div class="content-wrapper ts-prose">'.length, end - "</div>".length).trim();
    fs.writeFileSync(file, inner + "\n");
    regenerated++;
  }
  console.log(`practical-information fragments regenerated: ${regenerated}`);
}

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
// Stale fragments that still carry placeholders belong to removed pages; drop them.
for (const p of walk(path.join(root, "public/ajax"), [".html"])) if (fs.readFileSync(p, "utf8").includes("[FILL")) fs.unlinkSync(p);

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

// 6b. Site search index (public/search-index.json) for public/assets/js/site-search.js,
// replacing the old operator's Algolia index.
{
  const pages = JSON.parse(fs.readFileSync(path.join(root, "content/pages.json"), "utf8"));
  const skip = /^\/(wishlist|travel-proposal|travel-quiz|newsletter|processing-your-payment|privacy-policy|terms-conditions|review-your-opinion-matters|sustainability-policy)\//;
  const kind = (p) => {
    const seg = p.split("/")[1] || "";
    if (p.includes("/request-this-trip/")) return null;
    if (/\/(itinerary|prices|accommodations|activities|practical-information|diamond-luxury|family-tours|honeymoon)\/$/.test(p) && seg === "itineraries") return null;
    return { itineraries: "Trip", accommodation: "Accommodation", activity: "Activity", blog: "Blog", "national-parks": "Destination", islands: "Island", "practical-information": "Practical information", faqs: "FAQ" }[seg] || "Page";
  };
  const index = pages
    .filter((p) => !skip.test(p.path) && kind(p.path))
    .map((p) => ({ u: p.path, t: (p.title || "").replace(/\s*[|l·-]\s*Your Tanzania Trip\s*$/i, "").trim(), d: (p.description || "").slice(0, 160), k: kind(p.path) }));
  fs.writeFileSync(path.join(root, "public/search-index.json"), JSON.stringify(index));
  console.log(`search index: ${index.length} entries`);
}

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
