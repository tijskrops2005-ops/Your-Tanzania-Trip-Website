// Site-wide content fixes (2026-11-16 audit). Applied at build time to every page, after content
// generation, so they survive `npm run rebrand`. Run `node scripts/audit-site.mjs` after a build to check.
import fs from 'node:fs';
import * as cheerio from 'cheerio';

const pages = JSON.parse(fs.readFileSync(new URL('../../content/pages.json', import.meta.url), 'utf8'));
const titleByPath = new Map(pages.map(p => [p.path, p.title]));

// Dead internal links (pages that never existed in the core set) → the closest live page.
const LINKS = {
  '/about-us/our-tanzania-travel-experts/': '/about-us/',
  '/activity/day-hike-on-mount-meru-half-way-to-first-camp-miriakamba/': '/national-parks/arusha-national-park/',
  '/activity/walk-to-kilimanjaro-waterfall/': '/activity/walk-from-materuni-village-to-kuringe-waterfall/',
  '/blog/how-to-plan-your-first-safari/': '/blog/how-to-plan-your-first-safari-vacation/',
  '/national-parks-tanzania/udzungwa-national-park/': '/national-parks/udzungwa-mountains-national-park/',
  '/national-parks-tanzania/selous-game-reserve/': '/national-parks/selous-game-reserve/',
  '/itineraries/8-days-climbing-kilimanjaro-marangu-route/': '/itineraries/marangu-route/',
  '/itineraries/10-days-climbing-kilimanjaro-umbwe-route/': '/itineraries/climbing-kilimanjaro-umbwe-route/',
  '/why-we-only-offer-private-safaris/': '/blog/private-vs-group-safari/',
  '/practical-information/hakuna-matata-academy/': '/practical-information/responsible-travel/',
  '/wp-content/uploads/2025/05/FAQ-FDI_ENG.pdf': '/practical-information/flying-doctors/',
};

// Missing or shared meta descriptions.
const DESCRIPTIONS = {
  '/honeymoon-faq/tanzania/': 'Questions honeymooners ask about Tanzania: when to go, romantic lodges, combining safari with Zanzibar, and how we plan a private honeymoon.',
  '/families-faq/tanzania/': 'Questions families ask about Tanzania: safaris with children, age limits, malaria, family rooms and how we pace a trip for kids.',
  '/what-to-expect/tanzania/': 'What a game drive in Tanzania is like: start times, the vehicle, your guide, what you see and how to make the most of each drive.',
  '/activity/semi-submarine-experience-the-classic-reef-tour-corals-reef/': 'The classic semi-submarine reef tour off Zanzibar: watch corals and reef fish through the windows without getting wet.',
  '/activity/semi-submarine-experience-the-royal-beach-tour-reef-and-sandbank/': 'Semi-submarine tour off Zanzibar to the reef and a sandbank, with time on the sandbank for swimming and photos.',
};
const fixHref = href => {
  if (LINKS[href]) return LINKS[href];
  // Lodge overview pages are not part of the site any more; filtered lodge lists go to the matching area.
  if (/^\/accommodations\/\?/.test(href)) return /zanzibar/.test(href) ? '/zanzibar-island/' : '/travel-proposal/';
  return null;
};

// Claims that belonged to the previous operator, or promises nobody has confirmed, in plain words.
const TEXT = [
  [/we send you a free proposal within 24 hours/g, 'we send you a free, personal proposal'],
  [/Tell us your wishes and we send you a free proposal within 24 hours\./g, 'Tell us your wishes and we send you a free, personal proposal.'],
  [/>(\s*)Best price guarantee(\s*)</g, '>$1Clear quote before you book$2<'],
  [/>(\s*)Response within 24 hours(\s*)</g, '>$1Personal contact in the Netherlands$2<'],
  [/Drawing on nearly ten years of experience, we are proud to provide personalised Tanzania travel advice of the highest standard\./g,
    'Together with our local partner in Arusha, we give personal and practical Tanzania travel advice.'],
  [/Because we run our own office in the country, have built up years of experience and employ multilingual staff on the ground, we make sure your time in Tanzania runs without a hitch\./g,
    'Our partner Kilimanjaro Nature Tours runs every trip from Arusha with its own licensed guides, so your time in Tanzania runs without a hitch.'],
  [/Soctratesstraat 1\s*2675XD Nagele/g, 'Sluitgatweg 10 8308 RE Nagele'],
  [/Name of the bank: Rabobank/g, 'Name of the bank: Knab'],
  [/(<strong>Name of the bank:<\/strong>(?:&nbsp;|\s)*)Rabobank/g, '$1Knab'],
  [/<p>Soctratesstraat 1<\/p>\s*<p>2675XD Nagele<\/p>/g, '<p>Sluitgatweg 10</p>\n<p>8308 RE Nagele</p>'],
  [/, and we take part in a number of initiatives that do exactly that\./g, '.'],
  [/All your Your Tanzania Trip guides and hosts will speak English/g, 'All guides and hosts speak English'],
  [/planting trees and training vulnerable street children\. You can read more about it on our responsible travel page\./g, 'planning private trips with a local company and lodges with a lower footprint. You can read more about it on our responsible travel page.'],
];


// FAQ answers that described the previous operator's team, offices and reviews (visible FAQ and FAQPage schema).
const FAQ = {
  'How do you ensure accommodation quality?': 'We propose lodges and camps that our partner Kilimanjaro Nature Tours knows from its own trips, and we check recent guest reviews before we suggest a place. After your trip we ask how it was, and we use that for the next traveller.',
  'Do you work directly with the lodges?': 'Our partner Kilimanjaro Nature Tours books the lodges and camps in Tanzania. You have one point of contact with us, and we confirm every booking with our partner in writing.',
  'What makes your guides special?': 'Your guide comes from the crew of our partner Kilimanjaro Nature Tours in Arusha: licensed local guides who know the parks, the wildlife and the culture. Founder Baraka Dalali selects them himself.',
  'What languages do your guides speak?': 'All guides speak English. Would you prefer another language? Tell us, and we check with our partner whether a guide who speaks it is free on your dates.',
  'Are the guides trained?': 'Yes. The guides of Kilimanjaro Nature Tours are licensed, and the crew is trained in first aid.',
  'Will someone meet me at the airport?': 'Yes. A driver from our partner Kilimanjaro Nature Tours meets you at the airport and takes you to your first place to stay.',
  'What do you do to travel responsibly?': 'Your trip is private and run by a local company, and we can plan it around lodges and activities with a lower footprint. Read what we and our partner do on our <a href="/practical-information/responsible-travel/">responsible travel page</a>.',
  'What is the Hakuna Matata Academy?': null,
  'How can I reach the offices?': 'We work from the Netherlands and our partner has its office in Arusha. Everything you need is on our <a href="/contact/">contact page</a>.',
  'What kind of expertise does your team have?': 'Your Tanzania Trip is Tijs Krops and Edrian Waterman, who plan your trip from the Netherlands. Both did an internship in Arusha. In Tanzania, Baraka Dalali and the crew of Kilimanjaro Nature Tours bring their local experience as guides and trip organisers.',
  'Which languages does your team speak?': 'We speak Dutch and English. Our partner\'s team in Arusha speaks English and Swahili.',
  'Are your guides part of the team?': 'Your guides work for our partner Kilimanjaro Nature Tours, not for Your Tanzania Trip. We plan and book your trip; they run it on the ground.',
  'Is your team available during my trip?': 'Yes. During your trip you can reach Baraka and his team in Arusha, and you can always message us on WhatsApp.',
  'Where can I read your reviews?': 'Your Tanzania Trip is new, so we don\'t have reviews of our own yet. You can read reviews of our partner Kilimanjaro Nature Tours on <a href="https://www.tripadvisor.com/Attraction_Review-g297913-d12179305-Reviews-Kilimanjaro_Nature_Tours-Arusha_Arusha_Region.html" target="_blank" rel="noopener noreferrer">Tripadvisor</a>. Those reviews are about their service in Tanzania.',
  'Contact': 'Planning a trip, looking for advice or need help during your trip? Message us on WhatsApp or by email, or use the form on our <a href="/contact/">contact page</a>. During your trip, our partner\'s team in Arusha is your first contact.',
  'How can I get in touch with you?': 'By email, WhatsApp or phone, or with the form on our website. We reply personally.',
  'What are your opening hours?': 'We don\'t have a call centre with fixed opening hours. Send us a message and we reply personally. During your trip, our partner\'s team in Tanzania can be reached whenever needed.',
  'Is someone available during my trip?': 'Yes. Our partner\'s team in Arusha supports you for the whole trip, and you can reach us on WhatsApp.',
};
const plain = h => h.replace(/<[^>]+>/g, '');
/** FAQPage schema: same answers as the visible FAQ. */
export function fixSchema(json, tokens) {
  json = useCompanyEmail(json, tokens);
  for (const [re, to] of TEXT) json = json.replace(re, to);
  if (!json.includes('"Question"')) return json;
  const walk = v => {
    if (Array.isArray(v)) return v.map(walk).filter(x => x !== undefined);
    if (!v || typeof v !== 'object') return v;
    if (v['@type'] === 'Question' && v.name in FAQ) {
      if (FAQ[v.name] === null) return undefined;
      return { ...v, acceptedAnswer: { ...v.acceptedAnswer, text: plain(FAQ[v.name]) } };
    }
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
  };
  return JSON.stringify(walk(JSON.parse(json)));
}
function fixFaqItems($) {
  $('.faq-question-text').each((_, el) => {
    const q = $(el).text().trim();
    if (!(q in FAQ)) return;
    const item = $(el).closest('[x-data]');
    const id = $(el).closest('button').attr('aria-controls');
    if (FAQ[q] === null) { item.remove(); return; }
    const answer = id ? $(`#${id}`) : item.find('.faq-answer');
    const target = answer.find('p').first().parent();
    (target.length ? target : answer).html(`<p>${FAQ[q]}</p>`);
  });
}

// Per page: paragraphs and sections that describe projects of the previous operator as our own.
const HONEST_PARTNER = `<p>Who better to ask about what tourism means for Tanzania than someone who lives there? Baraka Dalali, who founded our partner Kilimanjaro Nature Tours, started on Kilimanjaro as a porter and worked his way up to licensed guide. Tourism gave him a career, and today it gives his crew of guides, cooks and porters a steady income for their families.</p>`;
const HONEST_COMMIT = `<h2>What we do, and what we don't claim</h2>
<p>Your Tanzania Trip is a young company. We plan and book trips from the Netherlands; our partner Kilimanjaro Nature Tours runs them in Tanzania. We don't run our own conservation or training projects yet, and we won't pretend we do. When we start one, we'll report it here with facts and figures.</p>
<p>What we can do today:</p>
<ul>
<li><strong>Private trips at your pace.</strong> Your own guide and vehicle, so you can keep your distance from wildlife and avoid the busiest spots.</li>
<li><strong>Fair work on the ground.</strong> Our partner hires guides, cooks and porters properly, with fair pay and proper gear, and on Kilimanjaro loads are weighed and the crew follows Leave No Trace principles.</li>
<li><strong>Lodges you choose with us.</strong> Ask for lodges and camps that run on solar power and limit waste; we'll show you the options for your route.</li>
<li><strong>Low-impact days.</strong> Walking safaris, cycling, canoeing and village visits with local guides fit into almost every itinerary.</li>
</ul>`;
const PAGE_EDITS = {
  '/blog/responsible-tourism-tanzania/': $ => {
    const p = $('p').filter((_, e) => /^Who better to ask about the benefits tourism/.test($(e).text().trim()));
    p.next('p').filter((_, e) => /^Tourism gives him/.test($(e).text().trim())).remove();
    p.replaceWith(HONEST_PARTNER);
    const start = $('h2').filter((_, e) => /What we commit to for responsible tourism/.test($(e).text())).first();
    const end = $('p').filter((_, e) => /^So responsible tourism is not just something we talk about/.test($(e).text().trim())).first();
    if (start.length && end.length) {
      start.nextUntil(end).remove(); end.remove(); start.replaceWith(HONEST_COMMIT);
    }
    $('p').filter((_, e) => /^And finally: travel with Your Tanzania Trip/.test($(e).text().trim()))
      .replaceWith('<p>And finally: tell us what matters to you when you plan your trip. We are happy to build it around lodges and activities with a lower footprint.</p>');
    $('p').filter((_, e) => /^Would you like to hear more about any of these initiatives/.test($(e).text().trim()))
      .html('Would you like to travel more responsibly in Tanzania? <a href="/contact/">Contact us</a> and we will show you the options for your trip.');
  },
  '/practical-information/responsible-travel/': $ => {
    $('p').filter((_, e) => /^Because we are a trusted Tanzanian travel company/.test($(e).text().trim()))
      .replaceWith('<p>We are a small company from the Netherlands, and our trips are run in Tanzania by our partner Kilimanjaro Nature Tours. Below you read what we and our partner do today. We only list what is true now.</p>');
    $('li').filter((_, e) => /strict environmental checklist/.test($(e).text()))
      .html('When we plan your route, we can choose lodges and camps that run on solar power, limit waste and work with local staff. Ask us for these options.');
    for (const head of [/^Tree planting$/, /^Training vulnerable street kids$/]) {
      const h = $('h2').filter((_, e) => head.test($(e).text().trim())).first();
      if (h.length) { h.nextUntil('h2').remove(); h.remove(); }
    }
    const emp = $('h2').filter((_, e) => /^Supporting our employees$/.test($(e).text().trim())).first();
    emp.text('Fair work for the crew');
    emp.nextAll('p').filter((_, e) => /^Our dedicated employees are our most important capital/.test($(e).text().trim())).first()
      .text("Every guide and driver in our partner's crew is selected by Baraka Dalali personally. Kilimanjaro Nature Tours trains its crew in first aid and pays fair wages.");
  },
  '/faqs/tanzania/': $ => {
    fixFaqItems($);
    $('a[href="#hakuna-matata-academy"]').each((_, a) => { const item = $(a).closest('li, .f-carousel__slide'); (item.length ? item : $(a)).remove(); });
    const h = $('#hakuna-matata-academy');
    (h.closest('.faq-section').length ? h.closest('.faq-section') : h.parent()).remove();
    $('p').filter((_, e) => /founders of Your Tanzania Trip/.test($(e).text())).remove();
  },
};

function fixHeadings(html) {
  // Exactly one h1 per page: later h1s become h2; a page without h1 promotes its first filled h2.
  let n = 0;
  html = html.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/g, (m, attrs, inner) => (++n === 1 ? m : `<h2${attrs}>${inner}</h2>`));
  if (n === 0) {
    html = html.replace(/<h2(\b[^>]*)>([\s\S]*?)<\/h2>/, (m, attrs, inner) => (inner.replace(/<[^>]+>/g, '').trim() ? `<h1${attrs}>${inner}</h1>` : m));
  }
  return html;
}

/** Body fixes for one page. */
export function fixBody(html, page, tokens) {
  html = removeAcademy(html);
  html = useCompanyEmail(html, tokens);
  html = fixLinks(html);
  for (const [re, to] of TEXT) html = html.replace(re, to);
  const edit = PAGE_EDITS[page.path];
  if (edit) { const $ = cheerio.load(html, null, false); edit($); html = $.html(); }
  return page.slug === 'index' ? html : fixHeadings(html);
}

/** Header and footer partials: dead links, the e-mail placeholder, the academy menu item. */
export function fixChrome(html, tokens) {
  html = removeAcademy(html);
  // "Our Experts" pointed to a page that does not exist; "About Us" already covers the team.
  html = html.replace(/<li\b[^>]*>\s*<a\b[^>]*href="\/about-us\/our-tanzania-travel-experts\/"[^>]*>[\s\S]*?<\/a>\s*<\/li>/g, '');
  html = html.replace(/<span class="fill-marker">\[INVULLEN: e-mail\]<\/span>/g,
    `<a href="mailto:${tokens.company.email}">${tokens.company.email}</a>`);
  html = useCompanyEmail(html, tokens);
  html = fixLinks(html);
  for (const [re, to] of TEXT) html = html.replace(re, to);
  return html;
}

// One public address everywhere (brand-tokens.json company.email): older generated content still
// carries the temporary Gmail address or info@, which does not exist.
function useCompanyEmail(html, tokens) {
  const mail = tokens?.company?.email;
  return mail ? html.replace(/info@yourtanzaniatrip\.com|tijskrops2005@gmail\.com/g, mail) : html;
}

function removeAcademy(html) {
  return html
    .replace(/<li\b[^>]*>\s*<a\b[^>]*href="[^"]*\/practical-information\/hakuna-matata-academy\/"[^>]*>[\s\S]*?<\/a>\s*<\/li>/g, '')
    .replace(/<option\b[^>]*hakuna-matata-academy[^>]*>[\s\S]*?<\/option>/g, '');
}

function fixLinks(html) {
  return html.replace(/href="(\/[^"]*)"/g, (m, href) => { const to = fixHref(href.replace(/&amp;/g, '&')); return to ? `href="${to}"` : m; });
}

/** Itinerary tabs share generic titles ("Prices | Your Tanzania Trip"): add the trip name. */
export function pageTitle(page) {
  const m = page.path.match(/^\/itineraries\/([^/]+)\/([^/]+)\/$/);
  if (!m) return page.title;
  const parent = (titleByPath.get(`/itineraries/${m[1]}/`) || '').replace(/\s*\|\s*Your Tanzania Trip$/, '').trim();
  const tab = page.title.replace(/\s*\|\s*Your Tanzania Trip$/, '').trim();
  if (!parent || page.title.includes(parent)) return page.title;
  return `${tab}: ${parent} | Your Tanzania Trip`;
}
export function pageDescription(page) {
  if (DESCRIPTIONS[page.path]) return DESCRIPTIONS[page.path];
  if (page.description) return page.description;
  const m = page.path.match(/^\/itineraries\/([^/]+)\/([^/]+)\/$/);
  if (!m) return '';
  const parent = (titleByPath.get(`/itineraries/${m[1]}/`) || '').replace(/\s*\|\s*Your Tanzania Trip$/, '').trim();
  const tab = page.title.replace(/\s*\|\s*Your Tanzania Trip$/, '').trim().toLowerCase();
  return parent ? `${parent}: ${tab}. Every itinerary is a starting point; we adjust it to your dates and wishes.` : '';
}
