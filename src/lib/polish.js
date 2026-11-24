// Website polish (owner brief 2026-11-23): brand positioning, WhatsApp number, navigation, footer,
// About us, Plan my Trip. Applied at build time in BaseLayout.astro after redesign.js and fixes.js,
// so it survives `npm run rebrand` and later update folders that replace those two files.
// The client-side part lives in public/assets/js/site-ui.js; plain-text files are handled by
// scripts/polish-finish.mjs after the build.
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------------------------------
// 0. SEO (2026-11-24): own titles, descriptions and trip names (content/seo/*.json), category pages.
// ---------------------------------------------------------------------------------------------
const SEO_DIR = path.resolve('content/seo');
const SEO = Object.assign({}, ...(fs.existsSync(SEO_DIR) ? fs.readdirSync(SEO_DIR) : [])
  .filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(SEO_DIR, f), 'utf8'))));
// Category pages, written by hand.
const CATEGORY = {
  '/tanzania-safari/': {
    title: 'Private Tanzania Safaris With a Local Team | Your Tanzania Trip',
    description: 'Private safaris in Tanzania, planned with you and run by our local partner in Arusha: the Serengeti, Ngorongoro, Tarangire and the south, at your own pace.',
    h1: 'Private Tanzania Safaris',
    intro: 'Your own vehicle, your own guide and a route built around your dates. We plan your safari with you, and Baraka’s team in Arusha runs it on the ground: from the Serengeti and the Ngorongoro Crater to Tarangire and the quiet parks of the south. Start from one of the sample itineraries below, or tell us what you would like to see.',
  },
  '/climbing-kilimanjaro/': {
    title: 'Climb Kilimanjaro With a Local Crew | Your Tanzania Trip',
    h1: 'Climb Kilimanjaro With a Local Crew',
  },
  '/zanzibar-holiday/': {
    title: 'Zanzibar Beach Holidays, Tailor-Made | Your Tanzania Trip',
    description: 'Zanzibar, Pemba and Mafia: white beaches, Stone Town and trips to the reef. Stay on the island only or add a few beach days to your safari, planned around you.',
    h1: 'Zanzibar Beach Holidays',
    intro: 'White beaches on the east coast, the old streets of Stone Town, spice farms and snorkelling on the reef. Zanzibar works on its own or as the relaxed end of a safari, and Pemba and Mafia are quieter islands for divers and anyone who wants space. Below are sample itineraries; we adjust each one to your dates and travel style.',
  },
  '/tanzania-travel/': {
    title: 'Tanzania Trips and Sample Itineraries | Your Tanzania Trip',
    description: 'All our sample itineraries in one place: private safaris, Kilimanjaro climbs, Zanzibar stays and combinations. Each one is a starting point we adapt to you.',
    h1: 'Tanzania Trips and Sample Itineraries',
    intro: 'All our sample itineraries in one place: private safaris, Kilimanjaro climbs, Zanzibar stays and combinations of all three. Each one is a starting point. We adapt the route, the lodges and the pace to your dates, budget and wishes.',
  },
};
const metaFor = p => ({ ...(SEO[p] || {}), ...(CATEGORY[p] || {}) });
/** Title, description and H1 for a page path (empty fields fall back to the page's own). */
export function seoMeta(pagePath) {
  const m = metaFor(pagePath);
  return { title: m.title || '', description: m.description || '', h1: m.h1 || m.name || '' };
}
// Old trip names of the previous operator -> our own names, everywhere they appear (cards, menus, links).
const RENAMES = (() => {
  const pairs = Object.values(SEO).filter(v => v && v.oldName && v.name && v.oldName !== v.name).map(v => [v.oldName, v.name]);
  // Card titles (the original post names, sometimes different from the H1), linked to the trip by its URL.
  const facetFile = path.resolve('public/facetwp-static/tanzania-travel.json');
  if (fs.existsSync(facetFile)) {
    const items = JSON.parse(fs.readFileSync(facetFile, 'utf8')).items || {};
    for (const card of Object.values(items)) {
      const href = (String(card).match(/href="(\/itineraries\/[^"/]+\/)"/) || [])[1];
      const title = (String(card).match(/<h[23]\b[^>]*>\s*<a\b[^>]*>([\s\S]*?)<\/a>/) || String(card).match(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/) || [])[1];
      const name = href && SEO[href]?.name;
      const old = title && title.replace(/<[^>]+>/g, '').replace(/&amp;|&#038;/g, '&').replace(/\s+/g, ' ').trim();
      if (name && old && old !== name && !pairs.some(([o]) => o.toLowerCase() === old.toLowerCase())) pairs.push([old, name]);
    }
  }
  return pairs.sort((a, b) => b[0].length - a[0].length);
})();
const reEscName = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '(?:&|&amp;|&#038;)').replace(/[–—]/g, '(?:–|—|&#8211;|&#8212;|&ndash;|&mdash;)').replace(/['’]/g, "(?:'|’|&#8217;|&#039;|&#39;)").replace(/\s+/g, '\\s+');
function renameTrips(html) {
  for (const [from, to] of RENAMES) {
    const f = reEscName(from);
    html = html.replace(new RegExp(`(>\\s*(?:“|&#8220;)?)${f}((?:”|&#8221;)?\\s*<)`, 'gi'), `$1${to}$2`)
      .replace(new RegExp(`((?:alt|title|aria-label)=")${f}(")`, 'gi'), `$1${to}$2`)
      .replace(new RegExp(`("(?:name|t)":")${f}(")`, 'gi'), `$1${to}$2`)
      .replace(new RegExp(`(\\[)${f}(\\])`, 'gi'), `$1${to}$2`)
      .replace(new RegExp(`^(\\s*)${f}(\\s*)$`, 'i'), `$1${to}$2`);
  }
  return html;
}
function seoBody(html, page) {
  const m = metaFor(page.path);
  const h1 = m.h1 || m.name;
  if (h1) html = html.replace(/(<h1\b[^>]*>)([\s\S]*?)(<\/h1>)/, (all, a, inner, c) => a + h1 + c);
  if (m.intro) {
    // The intro paragraph directly under the page heading (category heroes).
    html = html.replace(/(<\/h1>[\s\S]{0,1200}?<p\b[^>]*>)([\s\S]*?)(<\/p>)/, (all, a, inner, c) => a + m.intro + c);
  }
  return renameTrips(html);
}


const digits = s => String(s || '').replace(/\D/g, '');

/** WhatsApp link from the brand tokens (company.whatsapp). */
export const whatsappUrl = tokens => `https://wa.me/${digits(tokens.company.whatsapp)}`;

// ---------------------------------------------------------------------------------------------
// 1. Brand positioning (owner, 2026-11-23): Your Tanzania Trip is the brand visitors deal with; the
//    partner is always "Baraka" or "our local partner (in Arusha)". The company name of the partner is
//    not shown anywhere, also not in the licensed-operator sentence, and none of its links remain.
// ---------------------------------------------------------------------------------------------
const PARTNER = [
  // Licensed-operator sentence (Terms, Guarantees, Easy payments, FAQ): same meaning, no company name.
  [/(\s*)(<a\b[^>]*>)?\s*Kilimanjaro Nature Tours\s*(<\/a>)?\s*,\s*a licensed Tanzanian tour operator and member of the Tanzania Association of Tour Operators(?:, founded by Baraka Dalali)?/g,
    (m, sp, a) => `${sp || ' '}${a ? a + 'our local partner in Arusha</a>' : 'our local partner in Arusha'}, a licensed Tanzanian tour operator led by Baraka Dalali and a member of the Tanzania Association of Tour Operators`],
  [/Baraka’s company, Kilimanjaro Nature Tours, is/g, 'Baraka’s company is'],
  // Shared header, sidebar and footer blocks
  [/208 reviews of our local partner Kilimanjaro Nature Tours/g, '208 Tripadvisor reviews of our local partner in Arusha'],
  [/208 reviews of Kilimanjaro Nature Tours/g, '208 Tripadvisor reviews of our local partner in Arusha'],
  [/Your trip is run on the ground by Kilimanjaro Nature Tours, Arusha/g, 'Your trip is run on the ground by Baraka’s team in Arusha'],
  [/operated on the ground by (<a\b[^>]*>)\s*Kilimanjaro Nature Tours\s*<\/a>\s*,? Arusha, Tanzania, founded by Baraka Dalali\./g,
    'run on the ground by $1Baraka Dalali and his team</a> in Arusha, Tanzania.'],
  [/Trips are operated on the ground by our partner (<a\b[^>]*>)\s*Kilimanjaro Nature Tours\s*<\/a>\s*, Arusha\./g,
    'Trips are run on the ground by $1our local partner in Arusha</a>, Baraka Dalali and his team.'],
  [/<span>During your trip: Baraka Dalali, Kilimanjaro Nature Tours, Arusha · <a href="tel:\+255787301259"[^>]*>[^<]*<\/a><\/span>/g,
    '<span>During your trip, Baraka Dalali and his team in Arusha look after you, and we stay reachable on WhatsApp.</span>'],
  // Contact page
  [/our local partner (<a\b[^>]*>)\s*Kilimanjaro Nature Tours\s*<\/a> in Arusha, Tanzania, founded by Baraka Dalali/g,
    'our local partner $1Baraka Dalali and his team</a> in Arusha, Tanzania'],
  [/<li>Kilimanjaro Nature Tours, Arusha, Tanzania: <a href="mailto:info@kilimanjaronaturetours\.com">[\s\S]*?<\/li>/g,
    '<li>Baraka Dalali and his team in Arusha look after you on the ground, and we stay reachable on WhatsApp throughout your trip.</li>'],
  [/<strong>Kilimanjaro Nature Tours \(our local partner\)<\/strong>\s*P\.O\. Box 611, USA River, Arusha, Tanzania/g,
    '<strong>Our local partner:</strong> Baraka Dalali and his team, Arusha, Tanzania'],
  // People and photos
  [/Baraka Dalali, founder of Kilimanjaro Nature Tours, on the trail/g, 'Baraka Dalali, our local partner, on the trail'],
  [/(Baraka Dalali), founder of Kilimanjaro Nature Tours/g, '$1, our local partner in Arusha'],
  [/Baraka Dalali, Kilimanjaro Nature Tours/g, 'Baraka Dalali, our local partner in Arusha'],
  [/Founder and licensed Kilimanjaro guide, Kilimanjaro Nature Tours/g, 'Founder of our partner team in Arusha and licensed Kilimanjaro guide'],
  [/Founder of Kilimanjaro Nature Tours in Arusha/g, 'Our local partner in Arusha, founder of his own tour company'],
  [/before founding Kilimanjaro Nature Tours in Arusha/g, 'before founding his own tour company in Arusha'],
  [/who founded our partner Kilimanjaro Nature Tours/g, 'who founded our local partner company'],
  [/Lions seen from a Kilimanjaro Nature Tours safari vehicle/g, 'Lions seen from one of our partner’s safari vehicles'],
  [/(T|t)he Kilimanjaro Nature Tours crew/g, (m, t) => `${t === 'T' ? 'O' : 'o'}ur local partner’s crew`],
  [/the Kilimanjaro Nature Tours YouTube channel/g, 'our partner’s own YouTube channel'],
  [/Kilimanjaro Nature Tours: the last stretch to the summit/g, 'Baraka’s crew: the last stretch to the summit'],
  // Sentences about who does what
  [/by Kilimanjaro Nature Tours in Arusha, Tanzania, led by Baraka Dalali/g, 'by Baraka Dalali and his team in Arusha, Tanzania'],
  [/one local partner, Kilimanjaro Nature Tours in Arusha, founded by Baraka Dalali/g, 'one local partner: Baraka Dalali and his team in Arusha'],
  [/We work with Kilimanjaro Nature Tours in Arusha, led by Baraka Dalali/g, 'We work with Baraka Dalali and his team in Arusha'],
  [/We work with Kilimanjaro Nature Tours, our partner in Arusha/g, 'We work with Baraka Dalali and his team, our partner in Arusha'],
  [/with Kilimanjaro Nature Tours, our local partner/g, 'with our local partner, Baraka Dalali and his team'],
  [/Baraka(’|')s crew at Kilimanjaro Nature Tours/g, 'Baraka$1s crew'],
  [/the crew of (?:our partner )?Kilimanjaro Nature Tours/g, 'our partner’s crew'],
  [/(T|t)he guides of Kilimanjaro Nature Tours/g, '$1he guides of our local partner'],
  [/(G|g)uides of Kilimanjaro Nature Tours/g, '$1uides of our local partner'],
  [/the office of Kilimanjaro Nature Tours/g, 'our partner’s office'],
  [/\b(guide|driver|4×4|vehicle|crew) from Kilimanjaro Nature Tours/g, '$1 from our local team'],
  [/our local partner Kilimanjaro Nature Tours/g, 'our local partner'],
  [/(O|o)ur partner Kilimanjaro Nature Tours/g, '$1ur local partner'],
  // Dutch blog posts
  [/onze lokale partner Kilimanjaro Nature Tours/g, 'onze lokale partner'],
  [/samen met Kilimanjaro Nature Tours/g, 'samen met onze lokale partner Baraka Dalali en zijn team'],
  // Anything left: plain wording, with a capital at the start of a sentence
  [/(^|[.!?:>]\s*|"\s*)Kilimanjaro Nature Tours/g, '$1Our local partner'],
  [/Kilimanjaro Nature Tours/g, 'our local partner'],
  // A capital is only right at the start of a sentence, not after "from", "with" or a link tag mid-sentence.
  [/([a-z,]\s+(?:<a\b[^>]*>\s*)?)Our local partner/g, '$1our local partner'],
  // Contact details and links of the partner company: the e-mail goes, a website link keeps its text.
  [/\s*·?\s*<a\b[^>]*href="mailto:info@kilimanjaronaturetours\.com"[^>]*>[\s\S]*?<\/a>/g, ''],
  [/(\s*·\s*)?<a\b[^>]*href="https?:\/\/(?:www\.)?kilimanjaronaturetours\.com[^"]*"[^>]*>([\s\S]*?)<\/a>/g,
    (m, sep, text) => (/kilimanjaronaturetours/i.test(text) || !text.trim() ? '' : (sep || '') + text)],
  [/\s*·?\s*<a\b[^>]*href="tel:\+255787301259"[^>]*>[\s\S]*?<\/a>/g, ''],
];
// Plain text (titles, descriptions, schema, llms.txt): same rules without markup.
const PARTNER_TEXT = [
  [/Our local partner in Arusha: Kilimanjaro Nature Tours/g, 'Our local partner in Arusha: Baraka Dalali and his team'],
  [/Our local partner: Kilimanjaro Nature Tours/g, 'Our local partner in Arusha: Baraka Dalali and his team'],
  [/Local partner: Kilimanjaro Nature Tours, P\.O\. Box 611, USA River, Arusha, Tanzania\.[^\n]*?(Rated 5\.0)/g,
    'Local partner: Baraka Dalali and his team in Arusha, Tanzania. $1'],
  [/,?\s*info@kilimanjaronaturetours\.com/g, ''],
  [/,?\s*https?:\/\/(?:www\.)?kilimanjaronaturetours\.com\/?/g, ''],
  [/,?\s*\+255 787 301 259/g, ''],
];

function rewritePartner(html, rules = PARTNER) {
  if (!/Kilimanjaro Nature Tours|kilimanjaronaturetours|255 ?787/.test(html)) return html;
  for (const [re, to] of rules) html = html.replace(re, to);
  return html;
}

// ---------------------------------------------------------------------------------------------
// 2. Phone and WhatsApp from the tokens (both +31 6 12729607 since 2026-11-23). Every former number
//    (company.formerPhones) is replaced in links, labels, schema and text.
// ---------------------------------------------------------------------------------------------
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function rewriteContacts(html, tokens, text = false) {
  const phone = tokens.company.phone, wa = tokens.company.whatsapp || phone;
  const same = digits(phone) === digits(wa);
  for (const old of tokens.company.formerPhones || []) {
    const d = digits(old), spaced = reEsc(old), local = '0' + d.slice(2);
    if (!html.includes(d.slice(3))) continue;
    html = html
      .replace(new RegExp(`(wa\\.me/|api\\.whatsapp\\.com/send/?\\?phone=)${d}`, 'g'), `$1${digits(wa)}`)
      .replace(new RegExp(`tel:\\+?${d}`, 'g'), `tel:+${digits(phone)}`)
      .replace(new RegExp(`(WhatsApp:\\s*(?:</span>)?\\s*)${spaced}`, 'g'), `$1${wa}`)
      .replace(new RegExp(`(href="https://wa\\.me/${digits(wa)}"[^>]*>\\s*)${spaced}`, 'g'), `$1${wa}`)
      .replace(new RegExp(`${spaced} \\(WhatsApp\\)`, 'g'), same || text ? `${phone} (phone and WhatsApp)` : `${phone} (phone) · WhatsApp <a href="https://wa.me/${digits(wa)}">${wa}</a>`)
      .replace(new RegExp(`Phone(?: and |/)WhatsApp ${spaced}`, 'g'), same ? `Phone and WhatsApp ${phone}` : `Phone ${phone}, WhatsApp ${wa}`)
      .replace(new RegExp(`WhatsApp or call ${spaced}`, 'g'), same ? `WhatsApp or call ${phone}` : `WhatsApp ${wa} or call ${phone}`)
      .replace(new RegExp(spaced, 'g'), phone)
      .replace(new RegExp(`\\b${local}\\b|\\b06[ -]${d.slice(3)}\\b`, 'g'), phone);
  }
  // Payment page: one phone line instead of five country labels with the same number.
  return html.replace(/<p><strong>Phone Number \(if required\):<\/strong><\/p>(?:\s*<p><strong>[A-Z]{2}:<\/strong>\s*[^<]*<\/p>)+/g,
    `<p><strong>Phone number (if your bank asks for one):</strong> ${phone}</p>`);
}

// Reviews (owner, 2026-11-23): Baraka's Tripadvisor and Google reviews, both linked, for trust.
function quotesHtml(tokens) {
  const p = tokens.partner, g = (p.google?.reviewUrl || '').replace(/&/g, '&amp;');
  return (p.quotes || []).map(q => `<figure class="ytt-quote"><blockquote>“${esc(q.text)}”</blockquote><figcaption>${esc(q.name)}, review on <a href="${g}" target="_blank" rel="noopener noreferrer">Google</a></figcaption></figure>`).join('');
}
function rewriteReviews(html, tokens) {
  const g = tokens.partner?.google?.reviewUrl;
  if (!g) return html;
  const gEsc = g.replace(/&/g, '&amp;');
  html = html.replace(/href="https:\/\/www\.google\.com\/search\?q=Kilimanjaro\+Nature\+Tours[^"]*"/g, `href="${gEsc}"`);
  html = html.replace(/<!--\s*\[INVULLEN: Google reviews[\s\S]*?-->/g, quotesHtml(tokens));
  // A Google link next to every "Read … reviews on Tripadvisor" link (unless one is already there).
  return html.replace(/<a\b([^>]*?)href="https:\/\/www\.tripadvisor\.com\/[^"]*"([^>]*)>\s*(Read (?:partner |the )?reviews on Tripadvisor)\s*<\/a>/g, (m, a, b, label, off, str) => {
    if (str.slice(off, off + m.length + 700).includes('google.com/maps')) return m;
    const sep = /\bbtn\b/.test(a + b) ? ' ' : '<span class="ytt-sep" aria-hidden="true"> · </span>';
    return `${m}${sep}<a${a}href="${gEsc}"${b}>${label.replace('Tripadvisor', 'Google')}</a>`;
  });
}

// Promises nobody has confirmed (reply time, "100 lodges visited").
const PROMISES = [
  [/ We reply within 24 hours, usually sooner\./g, ' We reply personally.'],
  [/Free travel proposal within 24 hours\./g, 'Free, personal travel proposal.'],
  [/A free, no-obligation travel proposal within 24 hours\./g, 'A free, no-obligation travel proposal.'],
  [/Free proposal within 24 hours\./g, 'Free, personal proposal.'],
  [/(>\s*)Free proposal within 24 hours(\s*<)/g, '$1Free, personal proposal$2'],
  [/(>\s*)Reply within 24 hours(\s*<)/g, '$1Personal reply$2'],
  [/, with a reply within 24 hours\./g, ', with a personal reply.'],
  [/; we answer within 24 hours\./g, '; we reply personally.'],
  [/Every trip includes Trip Care: travel file, airport pick-up, private guide, 24\/7 support, replacement vehicle and help with flights\./g,
    'Every trip includes Trip Care: personal planning, everything confirmed before you pay, airport pick-up, a private guide and support day and night.'],
  [/Budget EXCLUDING INTERNATIONAL FLIGHTS\. Of course, we can book the flights for you as well, if you want!/g,
    'Your budget per person, excluding international flights. We can also arrange your flights if you like.'],
  [/Pick one, two,\.\.\. or even all of the following options\./g, 'Choose one or more.'],
  [/Select a <strong>date<\/strong>\. You can always change it later on, if you are not sure\./g,
    'Your planned arrival date in Tanzania. Not sure yet? Pick an approximate date; you can change it later.'],
  // "Who does what" on the partner page (runs after the partner rules).
  [/<strong>Our local partner<\/strong> \(Baraka Dalali, Arusha, Tanzania\): Our local partner provides/g,
    '<strong>Our local partner</strong> (Baraka Dalali and his team, Arusha, Tanzania): They provide'],
  // About-us tabs: "Our experts" led back to About us; the partner page is the real second tab.
  [/<a href="\/about-us\/" (class="child-pages-tab[^"]*")>\s*Our experts\s*<\/a>/g, '<a href="/our-partner/" $1>Our local partner</a>'],
  [/value="\/\?page_id=184"/g, 'value="/about-us/"'],
  // Phone buttons that still carry the flag and label of an old foreign office.
  [/ts-flag-(?:gb|us)("[^>]*><\/span>\s*<span class="!text-base"[^>]*>)(?:UK|USA): /g, 'ts-flag-nl$1NL: '],
  // How it began (owner, 2026-11-23): a safari with Baraka, not an internship.
  [/An internship in Arusha brought us together with Baraka and his team\. That partnership became Your Tanzania Trip\./g,
    'A safari with Baraka and his team brought us together, and we kept in touch. That contact became Your Tanzania Trip.'],
  [/Both did an internship in Arusha\./g, 'Both travelled through Tanzania with Baraka and his team.'],
  [/did their internship with him in Arusha, helped him set up his company for international guests, and decided to keep working together\./g,
    'did a safari with him and his team, kept in touch after the trip, and decided to work together.'],
  [/from his months in Arusha/g, 'from his own travels in Tanzania'],
  [/Your Tanzania Trip started with an internship\.[^\n"]*?(?=\n|"|$)/g, 'Your Tanzania Trip started on safari with Baraka Dalali and his team. We kept in touch after the trip, and today Baraka is our local partner in Arusha.'],
  // Our own support package instead of the previous operator's "Hakuna Matata Package".
  [/<li>\s*<a href="\/hakuna-matata-package\/"[^>]*>\s*<img[^>]*logo-hakuna-matata[^>]*>\s*<\/a>\s*<\/li>/g, ''],
  [/\/hakuna-matata-package\//g, '/trip-care/'],
  [/alt="Hakuna Matata[^"]*"/g, 'alt=""'],
  [/No worries… or… Hakuna Matata!/g, 'No worries: what we guarantee'],
  [/A well-known phrase to anyone who has ever travelled to Africa, and exactly how we want you to feel when you book with us\./g, 'That is how we want you to feel when you book with us.'],
  [/From A to Z, we take care of everything for a true Hakuna Matata journey/g, 'From your first question to your flight home, we take care of the details'],
  [/(>\s*)Flight disruption support(\s*<)/g, '$1Flights on request$2'],
  [/Booked international flights with us\? We handle any delays and cancellations!/g, 'We can book your international flights for you, from $250 extra per person.'],
  [/That is Hakuna Matata\./g, 'That is how we travel.'],
  [/Free Hakuna Matata (?:support )?(?:P|p)ackage/g, 'Trip Care included'],
  [/Hakuna Matata,? [Tt]he [Ww]orry-free [Pp]ackage/g, 'Trip Care'],
  [/(?:our (?:free |exclusive )?)?Hakuna Matata (?:support )?(?:P|p)ackage/g, 'Trip Care'],
  // A small team: no "consultants" or "experts" departments.
  [/Call an expert/g, 'Talk to us'],
  [/Our travel consultants know the country through and through/g, 'We know the country well'],
  [/(O|o)ur (?:travel )?(?:experts|consultants)( will| are| know)?/g, (m, o, verb) => `${o}ur team${verb ? { ' will': ' will', ' are': ' is', ' know': ' knows' }[verb] : ''}`],
  [/with our travel (?:experts|consultants)/gi, 'with our team'],
  // Old team: a named consultant of the previous operator and claims of specialists in Tanzania.
  [/In this article our experienced travel consultant Julia Trento shares her insights, tips and tricks/g, 'In this article we share our insights, tips and tricks'],
  [/But let’s hear what Julia suggests\./g, 'Here is what we suggest.'],
  [/Julia has one more good tip for families on the road:/g, 'One more good tip for families on the road:'],
  [/Julia also has five further tips/g, 'And five more tips'],
  [/At Your Tanzania Trip, everything revolves around our team\. With experienced travel consultants, multilingual specialists and well-trained local guides, we bring together international standards and genuine local knowledge\. Our specialists live and work in Tanzania, so every itinerary is put together with real expertise and first-hand experience\./g,
    'Your Tanzania Trip is a small, personal team. Tijs and Edrian plan your trip with you, and Baraka and his licensed guides run it in Tanzania. That way you get personal planning and real local knowledge in one trip.'],
  [/Our professional Tanzania travel consultants are specialists in/g, 'We specialise in'],
  [/(O|o)ur (?:luxury |professional |experienced |Serengeti )*(?:Tanzania )?travel (?:experts|consultants)(?: in Tanzania)?( are| curate| put together| know)?/g,
    (m, o, verb) => `${o}ur team${verb ? { ' are': ' is', ' curate': ' curates', ' put together': ' puts together', ' know': ' knows' }[verb] : ''}`],
  [/the travel experts at Your Tanzania Trip/g, 'Your Tanzania Trip'],
  [/ask your travel consultant/g, 'ask us'],
  // Claims of the previous operator about itself (local operator in Arusha, own team, own projects).
  [/We are a local tour operator with our base in Arusha, Tanzania, and we organise and oversee your whole trip from A to Z\. Our team brings together many nationalities, among them Tanzanians who know the country and its culture inside out\. Our professional (<a href="\/tanzania-travel\/">)Tanzania travel(<\/a>) consultants are specialists in Tanzania safaris,/g,
    'We plan your whole trip with you, and our local partner in Arusha, Baraka Dalali and his team, run it on the ground. Baraka’s guides know the country and its culture inside out. Together we specialise in $1Tanzania safaris$2,'],
  [/Our <strong>luxury travel consultants <\/strong>are carefully creating/g, 'We are carefully creating'],
  [/(let |asking |with |contact )your travel consultant/g, '$1us'],
  [/just let us know\. They can give you/g, 'just let us know. We can give you'],
  [/As a company, we are committed to supporting Tanzania’s social and economic development, and we take part in several initiatives with that aim\./g,
    'As a company, we want our trips to support Tanzania’s social and economic development.'],
  [/As a trusted Tanzanian travel company offering outstanding wildlife and nature experiences, we know that Tanzania’s vast wilderness needs to be protected and preserved\. We are therefore committed to sustainable business practices and actively support environmental projects across the country\./g,
    'Because our trips are built around Tanzania’s wildlife and nature, we know how much its wilderness needs to be protected. That is why we plan private trips with a local partner and can suggest lodges with a lower footprint.'],
  [/our drivers and guides will take you wherever you need to go!/g, 'Baraka’s drivers and guides take you wherever you need to go.'],
  [/Holland \/ The Netherlands/g, 'the Netherlands'],
  [/Our jeeps always have bottles of water in the fridge\./g, 'Your safari vehicle has bottles of water in the fridge.'],
  // Family page highlights: titles that match their own text, no unconfirmed discounts.
  [/(<p class="usp-row-title">)30% off for children up to 15(<\/p>)/g, '$1Family-friendly stays$2'],
  [/(<p class="usp-row-title">)Babies travel for free(<\/p>)/g, '$1Car seats on request$2'],
  // Old certification logo of the previous operator, replaced by a random photo in the hero.
  [/<img\b[^>]*class="jumbotron-custom-logo-img"[^>]*>/g, ''],
  // Calm, concrete tone on the main landing pages.
  [/The Zanzibar Archipelago is an awesome world class beach destination!/g, 'The Zanzibar Archipelago has white beaches, warm turquoise water and the old streets of Stone Town.'],
  [/Start planning your dream trip/g, 'Start planning your trip'],
  // Phone button: same number as WhatsApp, so name what it does.
  [/(<span class="!text-base"[^>]*>)NL: (<\/span>)/g, '$1Call: $2'],
  // Old orange in inline icons (zoom button on itinerary photos) becomes the house gold.
  [/<use fill="#E69016"/g, '<use fill="#d5a34d"'],
  // Safari + Zanzibar has its own page now (was a filter on the overview).
  [/href="\/tanzania-travel\/\?_types=safari(?:%2C|,)zanzibar"/g, 'href="/safari-and-zanzibar/"'],
  // Old brand leftovers found in the SEO review (2026-11-24). The owner keeps the 95% summit line,
  // the vehicles text and the sustainability targets as they are.
  [/TanazaniaSpecialist\.com/g, 'Your Tanzania Trip'],
  [/alt="[^"]*tanzaniaspecialist[^"]*"/gi, 'alt=""'],
  // Countries we do not sell: an honest invitation instead of a promise.
  // We only sell Tanzania (owner, 2026-11-23: no gorilla trips in Rwanda or Uganda).
  [/Exceptional Travel Beyond Tanzania/g, 'Safari, summit and sea in one trip'],
  [/Keen to add gorilla trekking in Uganda or the Great Migration in Kenya\?/g, 'Combine your safari with a Kilimanjaro climb or a few days on Zanzibar. We plan it as one trip, with one point of contact.'],
  [/Replace the south with Kilimanjaro, or add (?:<a\b[^>]*>)?Rwanda(?:’|')s gorillas(?:<\/a>)?\s*\./g, 'Replace the south with Kilimanjaro, or end with a few days on Zanzibar.'],
  // The optional "Flight to Kigali" (Rwanda) is not offered: its activity card goes.
  [/<article\b[^>]*>(?:(?!<article\b)[\s\S])*?data-wishlist-post-id="21932"[\s\S]*?<\/article>/g, ''],
  // Bank details are on the Easy payments page (owner confirmed 2026-11-23).
  [/Bank details are on your invoice, never on this website\./g, 'Bank details are on your invoice and on our <a href="/practical-information/easy-payments/">Easy payments</a> page.'],
  // A company "based in Africa" that runs trips in four countries was the previous operator.
  [/Your Tanzania Trip is a company based in Africa with Dutch roots\s*\.?/g, 'Your Tanzania Trip is a Dutch travel company for trips to Tanzania.'],
  [/We jointly organise safaris in Tanzania, Kenya, Uganda and South Africa\.?/g, 'Together we organise safaris, Kilimanjaro climbs and Zanzibar stays in Tanzania.'],
];

// ---------------------------------------------------------------------------------------------
// 3. Footer: no photo notice, a company column, link columns visible on phones.
// ---------------------------------------------------------------------------------------------
function footerColumn() {
  const links = [
    ['/about-us/', 'About us'], ['/our-partner/', 'Our local partner'], ['/trip-care/', 'Trip Care'], ['/travel-proposal/', 'Plan my Trip'],
    ['/contact/', 'Contact'], ['/faqs/tanzania/', 'Frequently asked questions'], ['/blog/', 'Blog'],
  ];
  return `<div class="ytt-footer-company"><section class="widget widget_nav_menu"><h2 class="text-lg font-bold tracking-widest uppercase text-anthracite">Your Tanzania Trip</h2><ul class="menu">${
    links.map(([href, label]) => `<li class="menu-item"><a href="${href}">${label}</a></li>`).join('')}</ul></section></div>`;
}
function polishFooter(html) {
  html = html.replace(/<div class="ytt-credits">[\s\S]*?<\/div>/g, '');
  // Show the two link columns on phones as well (they were desktop-only).
  html = html.replace(/<div class="hidden md:block">(\s*<section id="nav_menu-(?:5|9)")/g, '<div class="ytt-footer-links">$1');
  // Company column after "Travel information".
  html = html.replace(/(<section id="nav_menu-9"[\s\S]*?<\/section>\s*<\/div>)/, `$1${footerColumn()}`);
  // Sentence case for the footer headings.
  html = html.replace(/>ITINERARIES</g, '>Itineraries<').replace(/>Travel Information</g, '>Travel information<');
  return html;
}

// ---------------------------------------------------------------------------------------------
// 4. Header: dropdown semantics (arrows themselves are CSS; keyboard and touch in site-ui.js).
// ---------------------------------------------------------------------------------------------
function polishHeader(html) {
  return html
    .replace(/(<li\b[^>]*menu-item-has-children hide[^>]*>\s*<a\b)(?![^>]*aria-haspopup)/g, '$1 aria-haspopup="true" aria-expanded="false"')
    // An old "Currency selector has been added" announcement popped up on every first visit.
    .replace(/\s*data-tooltip(?:-title|-content|-close-btn)?(?:="[^"]*")?/g, '')
    // The mobile menu still showed the old label; the desktop button already says "Plan my Trip".
    .replace(/(<li\b[^>]*mobile-menu-cta-btn[^>]*>\s*<a href="\/travel-proposal\/">)Travel proposal(<\/a>)/g, '$1Plan my Trip$2')
    // "Accommodations" pointed at a page that is no longer part of the site (it redirects); the review tile goes to the partner reviews.
    .replace(/<li\b[^>]*>\s*<a href="\/accommodations\/"[^>]*>[\s\S]*?<\/a>\s*<\/li>/g, '')
    .replace(/href="\/tanzania-traveller-reviews\/"/g, 'href="/our-partner/#reviews"')
    // Proposal tile: the old orange text image becomes a photo of Baraka's crew, with the current button label.
    .replace(/<img src="\/brand\/request-thumbnail\.jpg"[^>]*>/g, '<img src="/brand/partner/safari.webp" alt="Safari vehicle of our local partner on the plains" width="920" height="580" loading="lazy" decoding="async">')
    .replace(/(<a href="\/travel-proposal\/"><img src="\/brand\/partner\/safari\.webp"[^>]*>)\s*Make a Request/g, '$1Plan my Trip');
}

// ---------------------------------------------------------------------------------------------
// 5. About us and Our local partner pages.
// ---------------------------------------------------------------------------------------------
// Safari photos with Baraka: every image dropped in public/brand/safari-with-baraka/ appears on About us.
// The file name becomes the description (baraka-with-guests-in-the-serengeti.jpg).
const SAFARI_DIR = 'public/brand/safari-with-baraka';
function safariPhotos() {
  const dir = path.resolve(SAFARI_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort().map(f => {
    const words = f.replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '').replace(/[-_]+/g, ' ').trim();
    return { src: `/brand/safari-with-baraka/${encodeURIComponent(f)}`, alt: words ? words[0].toUpperCase() + words.slice(1) : 'On safari with Baraka' };
  });
}
function safariGallery() {
  const photos = safariPhotos();
  if (!photos.length) {
    // Until the owner's own safari photos arrive: photos of Baraka's team and Tanzania (public/brand/partner).
    photos.push(
      { src: '/brand/partner/crew-summit.webp', alt: 'Baraka’s crew on the summit of Kilimanjaro' },
      { src: '/brand/partner/safari-lions.webp', alt: 'Lions on a game drive' },
      { src: '/brand/partner/safari.webp', alt: 'On the plains of northern Tanzania' },
      { src: '/brand/partner/kilimanjaro-dawn.webp', alt: 'Kilimanjaro at dawn' },
      { src: '/brand/partner/great-migration.jpg', alt: 'The Great Migration in the Serengeti' },
      { src: '/brand/partner/zanzibar.webp', alt: 'The coast of Zanzibar' },
    );
  }
  return `<div class="ytt-safari-gallery">${photos.map(ph => `<figure><img src="${ph.src}" alt="${esc(ph.alt)}" loading="lazy" decoding="async"><figcaption>${esc(ph.alt)}</figcaption></figure>`).join('')}</div>`;
}
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function aboutHtml(tokens) {
  const co = tokens.company, p = tokens.partner, wa = whatsappUrl(tokens);
  const bio = rewritePartner(p.founderBio, PARTNER);
  const same = digits(co.phone) === digits(co.whatsapp);
  const reach = same
    ? `phone and WhatsApp <a href="${wa}">${co.phone}</a>`
    : `WhatsApp <a href="${wa}">${co.whatsapp}</a>, phone <a href="tel:${co.phone.replace(/[^\d+]/g, '')}">${co.phone}</a>`;
  return `
<p class="ytt-lead">Your Tanzania Trip is a travel company for tailor-made trips to Tanzania: safaris, Kilimanjaro climbs, Zanzibar and combinations of all three. We plan and book your trip with you. Our local partner in Arusha, Baraka Dalali, and his team run it on the ground.</p>
<h2>Our story</h2>
<p>Your Tanzania Trip started on safari. Tijs Krops and Edrian Waterman travelled through Tanzania with Baraka Dalali and his team. On the road and in the parks we saw how much Baraka knows: the wildlife, the routes, the lodges and the people.</p>
<p>After the trip we kept in touch, and the idea grew to work together. In ${co.foundingDate || '2025'} we started, and today Baraka is our local partner in Arusha: Your Tanzania Trip plans and books your trip, and Baraka and his team run it in Tanzania. It works because both sides do what they are best at.</p>
<p>That is what you get when you travel with us: our own knowledge and experience of Tanzania, combined with Baraka’s years as a guide in the parks and on Kilimanjaro.</p>
${safariGallery()}
<h2>Why we work this way</h2>
<ul>
<li><strong>Personal planning.</strong> You plan in English or Dutch, with people who know what international travellers ask about: flights, insurance, payments and a clear quote.</li>
<li><strong>Local knowledge in Tanzania.</strong> Baraka and his team live and work in Tanzania. They know the parks, the routes, the lodges and the mountain, and they look after you during your trip.</li>
<li><strong>Everything confirmed before you pay.</strong> Lodges, activities and transfers are confirmed with Baraka’s team in writing before we send an invoice.</li>
<li><strong>A private trip with support day and night.</strong> On safari the vehicle and the guide are yours alone; on Kilimanjaro you climb with your own crew. During your trip you can reach us and Baraka’s team 24/7.</li>
</ul>
<h2>Who you deal with</h2>
<div class="ytt-people">
<div class="ytt-person"><span class="ytt-initials" aria-hidden="true">TK</span><h3>Tijs Krops</h3><p>Plans and books your trip and is your contact before departure: the proposal, your questions, the invoice and the travel documents. Speaks English and Dutch.</p></div>
<div class="ytt-person"><span class="ytt-initials" aria-hidden="true">EW</span><h3>Edrian Waterman</h3><p>Plans and books trips together with Tijs and knows the lodges and the routes from his own travels in Tanzania. You can reach Edrian on ${co.phone}.</p></div>
<div class="ytt-person ytt-person-photo"><img src="/brand/partner/baraka-dalali.webp" alt="Baraka Dalali, our local partner in Arusha" width="160" height="160" loading="lazy" decoding="async"><h3>Baraka Dalali</h3><p>${bio}</p><p><a href="/our-partner/">More about Baraka and his team</a></p></div>
</div>
<h2>How we work</h2>
<ol>
<li>You tell us what you have in mind: dates, who is travelling, budget and pace.</li>
<li>We send you a personal proposal, free and without obligation, and adjust it with you until it fits.</li>
<li>When you confirm, you pay a deposit and later the balance, and you receive your travel documents.</li>
<li>In Tanzania, Baraka’s team welcomes you and looks after you. You can reach us and Baraka’s team day and night.</li>
</ol>
<p>Everything that comes with every trip is on our <a href="/trip-care/">Trip Care</a> page. Also read why you need <a href="/practical-information/travel-insurance/">travel insurance</a>.</p>
<h2>Reviews of our local partner</h2>
<p>Baraka’s team is rated ${p.tripadvisor.score} out of 5 on Tripadvisor (${p.tripadvisor.count} reviews, checked ${p.tripadvisor.checkedOn}) and received the Travellers’ Choice award in 2023 and 2024. <a href="${p.tripadvisor.url}" target="_blank" rel="noopener noreferrer">Read the reviews on Tripadvisor</a>. These reviews are about Baraka’s service in Tanzania. Your Tanzania Trip is new and does not have reviews of its own yet.</p>
<h2>Contact</h2>
<p>Your Tanzania Trip, ${co.address.replace(', Netherlands', ', the Netherlands')}. E-mail <a href="mailto:${co.email}">${co.email}</a>, ${reach}. <a href="/contact/">All contact details</a>.</p>
<h2>Ready to start?</h2>
<p>Browse the <a href="/tanzania-travel/">sample itineraries</a> or <a href="/travel-proposal/">plan your trip with us</a>. Karibu.</p>`;
}

const PAGE = {
  '/adventure-trips-tanzania/': $ => {
    // "Kenya & Uganda with our partners in East Africa": we have no partners there and only sell Tanzania.
    const h = $('h2').filter((_, e) => /Adventure Travel Beyond Tanzania/.test($(e).text())).first();
    if (!h.length) return;
    h.nextAll().remove();
    h.html('More adventure in Tanzania').after('<p>Add a day of something active to your trip: a <a href="/activity/walking-safari-in-arusha-national-park/">walking safari in Arusha National Park</a>, <a href="/activity/canoeing-on-lake-duluti/">canoeing on Lake Duluti</a> or a <a href="/activity/mountainbike-tour-mto-wa-mbu/">mountain bike tour around Mto wa Mbu</a>. Tell us what you like and we fit it into your route.</p>');
  },
  '/blog/preparing-your-first-safari-in-tanzania/': $ => {
    const h = $('h2').filter((_, e) => /Hakuna Matata Package/.test($(e).text())).first();
    if (!h.length) return;
    h.text('Peace of mind: Trip Care, included in every trip');
    h.nextAll('p').filter((_, e) => /Pumbaa/.test($(e).text())).first().remove();
    h.nextAll('p').filter((_, e) => /Hakuna Matata Package/.test($(e).text())).first()
      .html('Travelling far can bring the odd surprise. That is why every trip with us comes with <a href="/trip-care/">Trip Care</a>: your trip confirmed in writing before you pay, Baraka’s team waiting for you at the airport, a private guide, and support day and night from Baraka’s team in Arusha and from us.');
  },
  '/travel-proposal/': $ => {
    // International visitors: no country preselected (it was United States).
    const country = $('#input_5_16');
    country.find('option[selected]').removeAttr('selected');
    country.prepend('<option value="" selected="selected">Select your country</option>');
  },
  '/about-us/': ($, tokens) => {
    const story = $('h2').filter((_, e) => /^Our story$/.test($(e).text().trim())).first();
    const prose = story.parent();
    if (prose.length) prose.html(aboutHtml(tokens)).addClass('ytt-about');
    // Sidebar "Call an expert" and the page sub-navigation: one "About us" entry is enough.
    $('a[href="/about-us/our-tanzania-travel-experts/"]').closest('li, option').remove();
  },
  '/our-partner/': $ => {
    $('h1').first().text('Our local partner in Arusha: Baraka Dalali and his team');
    $('p').each((_, e) => {
      const el = $(e), t = el.text().trim();
      if (/^Every trip you book with Your Tanzania Trip is operated in Tanzania by/.test(t)) {
        el.html(el.html().replace(/is operated in Tanzania by Kilimanjaro Nature Tours\./, 'is run in Tanzania by Baraka Dalali and his team in Arusha.'));
      }
      if (/^Kilimanjaro Nature Tours is a member of the Tanzania Association of Tour Operators/.test(t)) {
        el.html(el.html().replace(/^Kilimanjaro Nature Tours is/, 'Baraka’s company is'));
      }
      if (/^More videos on the Kilimanjaro Nature Tours channel/.test(t)) el.remove();
      if (/During the trip you also have the direct contact details of Kilimanjaro Nature Tours/.test(t)) {
        el.html(el.html().replace(/During the trip you also have the direct contact details of Kilimanjaro Nature Tours:?/, 'During your trip, Baraka’s team looks after you on the ground, and we stay reachable on WhatsApp.'));
        el.nextAll('ul').first().filter((_, u) => /kilimanjaronaturetours|P\.O\. Box/.test($(u).text())).remove();
      }
    });
    // The partner's postal address, e-mail and website (list items or paragraphs).
    $('li, p').filter((_, e) => /^(Email|E-mail|Website|Postal address):/.test($(e).text().trim()) && /kilimanjaronaturetours|P\.O\. Box 611/.test($(e).text())).remove();
    $('h2, h3').each((_, e) => {
      const el = $(e);
      if (/^What travellers say about Kilimanjaro Nature Tours$/.test(el.text().trim())) el.text('What travellers say about Baraka’s team').attr('id', 'reviews');
    });
    $('img[src*="knt-logo"]').remove();
    // "Who does what": the role line names the company twice.
    $('p, li').each((_, e) => {
      const el = $(e);
      const h = el.html();
      if (h && /Kilimanjaro Nature Tours \(Baraka Dalali, Arusha, Tanzania\)/.test(h)) {
        el.html(h.replace(/Kilimanjaro Nature Tours \(Baraka Dalali, Arusha, Tanzania\)/, 'Our local partner (Baraka Dalali and his team, Arusha, Tanzania)')
          .replace(/Kilimanjaro Nature Tours provides/, 'They provide'));
      }
      if (h && /with Kilimanjaro Nature Tours and send you the invoice/.test(h)) el.html(h.replace('with Kilimanjaro Nature Tours', 'with Baraka’s team'));
    });
  },
};

// ---------------------------------------------------------------------------------------------
// Exports used by BaseLayout.astro
// ---------------------------------------------------------------------------------------------
export function polishBody(html, page, tokens) {
  const edit = PAGE[page.path];
  if (edit) { const $ = cheerio.load(html, null, false); edit($, tokens); html = $.html(); }
  html = rewritePartner(html);
  html = rewriteContacts(html, tokens);
  for (const [re, to] of PROMISES) html = html.replace(re, to);
  return shortName(rewriteReviews(uspIcons(seoBody(fixCapsHeadings(html), page)), tokens));
}
export function polishChrome(html, tokens, part) {
  html = part === 'footer' ? polishFooter(html) : polishHeader(html);
  html = rewritePartner(html);
  html = rewriteContacts(html, tokens);
  for (const [re, to] of PROMISES) html = html.replace(re, to);
  return shortName(renameTrips(rewriteReviews(html, tokens)));
}
/** Inline scripts of a page (Gravity Forms settings). */
export function polishScripts(js, page) {
  // Plan my Trip: conditional logic resets hidden fields to their defaults; no preselected country.
  if (page.path === '/travel-proposal/') js = js.replace(/"16":"US"/g, '"16":""');
  return js;
}
// ---------------------------------------------------------------------------------------------
// 6. Presentation details: headings in capitals, highlight icons.
// ---------------------------------------------------------------------------------------------
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
const KEEP_CAPS = new Set(['UNESCO', 'USD', 'EUR', 'KLM', 'TATO']);
function titleCase(text) {
  return text.trim().replace(/!+$/, '').replace(/\.$/, '').split(/(\s+)/).map((w, i) => {
    if (/^\s+$/.test(w) || KEEP_CAPS.has(w)) return w;
    const lower = w.toLowerCase();
    if (i > 0 && SMALL.has(lower)) return lower;
    return lower.replace(/(^|[-(])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }).join('');
}
function fixCapsHeadings(html) {
  return html.replace(/(<h([1-3])\b[^>]*>)([^<]{6,})(<\/h\2>)/g, (m, open, lvl, text, close) => {
    const letters = text.replace(/&[a-z]+;|[^A-Za-z]/g, '');
    if (letters.length < 5 || letters !== letters.toUpperCase() || KEEP_CAPS.has(text.trim())) return m;
    return open + titleCase(text) + close;
  });
}
const USP_ICON = {
  'Worry-free travel': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  'Flights on request': '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  'Safari &amp; Beach': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  'Private guides': '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  'Family-friendly stays': '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  'Car seats on request': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
};
function uspIcons(html) {
  return html.replace(/<img\b[^>]*>(\s*<div class="usp-row-text">\s*<p class="usp-row-title">([^<]*)<\/p>)/g, (m, rest, title) => {
    const paths = USP_ICON[title.trim()];
    return paths ? `<span class="ytt-usp-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>${rest}` : m;
  });
}

// Photos that must not appear (another operator's logo on a jeep, Madagascar baobabs, camping tents),
// also where a blog cover links to them directly: swapped for photos from the pool.
const PHOTO_SWAP = {
  'photo-1779388762527-0d4c5d8f4a92': 'photo-1564101160531-4838e8a5f4e7',
  'photo-1632315152441-465a943cc211': 'photo-1709420838688-ccd0517d6a2d',
  'photo-1659944984855-776187144baf': 'photo-1728238054897-05023133fe90',
  'photo-1659944975073-453265ccf3a6': 'photo-1728238054897-05023133fe90',
};
const swapPhotos = s => s.replace(/photo-1779388762527-0d4c5d8f4a92|photo-1632315152441-465a943cc211|photo-1659944984855-776187144baf|photo-1659944975073-453265ccf3a6/g, id => PHOTO_SWAP[id]);

// Owner, 2026-11-24: the partner is just "Baraka" (no surname) everywhere on the site.
function shortName(s) {
  return swapPhotos(s).replace(/Baraka Dalali(’|'|&#8217;)s/g, 'Baraka$1s').replace(/\bBaraka Dalali\b/g, 'Baraka').replace(/\bMr\.? Dalali\b/g, 'Baraka');
}

/** TouristTrip with price for itinerary pages that do not have one yet (from the page itself). */
export function tripSchema(html, page, seo, schemas, image) {
  if (!/^\/itineraries\/[^/]+\/$/.test(page.path) || schemas.some(j => j.includes('"TouristTrip"'))) return null;
  const site = 'https://yourtanzaniatrip.com', url = site + page.path;
  const strip = v => String(v || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const name = seo.h1 || strip((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1]);
  if (!name) return null;
  const price = ((html.match(/From \$([\d,]+)/) || [])[1] || '').replace(/,/g, '');
  const note = strip((html.match(/\*(Per person[^<]{0,200})/) || [])[1]);
  const days = [...html.matchAll(/<strong\b[^>]*>\s*(Day\s*[\d\s–-]+?)\s*:?\s*<\/strong>\s*([^<]+)/g)]
    .map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: `${strip(m[1])}: ${strip(m[2])}` }));
  const trip = {
    '@context': 'https://schema.org', '@type': 'TouristTrip', '@id': url + '#trip', name, url,
    description: seo.description || undefined, image: image || undefined,
    provider: { '@id': site + '/#organization' },
    itinerary: days.length ? { '@type': 'ItemList', numberOfItems: days.length, itemListElement: days } : undefined,
    offers: price ? { '@type': 'Offer', price, priceCurrency: 'USD', availability: 'https://schema.org/InStock', url,
      priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'USD', unitText: 'per person', description: note || undefined } } : undefined,
  };
  return JSON.stringify(trip);
}

/** HTML fragments that skip BaseLayout (dist/ajax/**, loaded by static-ajax.js). */
export function polishFragment(html, tokens) {
  html = rewritePartner(html);
  html = rewriteContacts(html, tokens);
  for (const [re, to] of PROMISES) html = html.replace(re, to);
  return shortName(renameTrips(html));
}
/** JSON-LD: no separate, nameless partner organisation; founding year on our own organisation. */
export function polishSchema(json, tokens) {
  json = renameTrips(json);
  let data;
  try { data = JSON.parse(json); } catch { return json; }
  const isPartner = v => v && typeof v === 'object' && v['@id'] === '#organization';
  const walk = v => {
    if (Array.isArray(v)) return v.filter(x => !isPartner(x)).map(walk);
    if (!v || typeof v !== 'object') return v;
    const out = {};
    for (const [k, x] of Object.entries(v)) {
      if (isPartner(x)) continue;                      // "mentions": {"@id": "#organization"}
      out[k] = walk(x);
    }
    if (out['@type'] === 'Organization' && /\/#organization$/.test(out['@id'] || '') && tokens.company.foundingDate && !out.foundingDate) {
      out.foundingDate = tokens.company.foundingDate;
    }
    return out;
  };
  return JSON.stringify(walk(data));
}
/** Titles, descriptions, Open Graph text, JSON-LD and plain-text files. */
export function polishText(text, tokens) {
  if (!text) return text;
  text = rewritePartner(text, [...PARTNER_TEXT, ...PARTNER]);
  text = rewriteContacts(text, tokens, true);
  for (const [re, to] of PROMISES) text = text.replace(re, to);
  return shortName(renameTrips(text));
}

// ---------------------------------------------------------------------------------------------
// Styles (forest #183e35 / ivory / gold / Inter, see redesign.js). Only transform and opacity animate.
// ---------------------------------------------------------------------------------------------
export const polishCss = `
/* ===== Polish 2026-11-23 ===== */
/* Navigation: dropdown arrows always visible, one type style for every menu item */
.js-header #menu-header-primary .menu-toggle--icon-down,.js-header #menu-header-primary .menu-toggle--icon-up{background-color:currentColor!important;color:var(--ytt-forest)!important;width:16px;height:16px;margin-left:4px;top:0!important;vertical-align:-3px}
#menu-header-secondary .menu-toggle--icon-down,#menu-header-secondary .menu-toggle--icon-up{background-color:currentColor!important;color:#fff!important;width:16px;height:16px;margin-left:4px;vertical-align:-3px}
.js-header #menu-header-primary .menu-toggle{transition:transform .2s cubic-bezier(.2,.8,.2,1)}
.js-header #menu-header-primary>li>a,.js-header #menu-header-primary>li>a .menu-title{font:600 14px/1.2 Inter,Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;color:var(--ytt-forest)!important;display:inline-flex;align-items:center}
.js-header #menu-header-primary>li>a:hover .menu-title,.js-header #menu-header-primary>li:not(.menu-item-has-children)>a:hover{text-decoration:underline;text-underline-offset:9px;text-decoration-thickness:2px;text-decoration-color:var(--ytt-gold)}
#primary-navigation .menu-toggle-on>a{text-decoration-color:var(--ytt-gold)!important}
.js-header #menu-header-primary>li>a:focus-visible{outline:2px solid var(--ytt-gold);outline-offset:4px;border-radius:4px}
#menu-header-secondary>li>a{text-transform:none!important;letter-spacing:0!important;font-weight:600!important}
/* Mega menu: sentence case, calm tracking */
.js-header .sub-menu a,.js-header .sub-menu .menu-title,.js-header .menu-cta-title,.js-header .menu-landing-item a,.js-header .menu-repeater a{text-transform:none!important;letter-spacing:0!important;font-family:Inter,Arial,sans-serif!important}
.js-header .menu-landing-item a{font-weight:700!important;font-size:18px!important}
.js-header .menu-repeater *,.js-header .menu-cta *{letter-spacing:0!important;text-transform:none!important}
.js-header .menu-cta-title{font-weight:700!important;font-size:20px!important}
.js-header .menu-collage img{border-radius:8px}
.js-header .menu-collage a:hover img{transform:scale(1.03)}.js-header .menu-collage img{transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.js-header .sub-menu a:focus-visible{outline:2px solid var(--ytt-gold);outline-offset:3px}
/* Mobile menu: same type, clear toggles */
.hamburger-wrapper .mobile-menu .mobile-menu-toggle,.hamburger-wrapper .mobile-menu>li>a{text-transform:none!important;letter-spacing:0!important;font:600 17px/1.3 Inter,Arial,sans-serif!important;min-height:52px}
.hamburger-wrapper .mobile-menu .sub-menu a{min-height:48px;display:flex;align-items:center;font-size:16px!important;text-transform:none!important;letter-spacing:0!important}
.hamburger-wrapper .mobile-menu .mobile-menu-toggle[aria-expanded="true"]:after{transform:rotate(-90deg)!important}
.hamburger-wrapper .mobile-menu-dock a{text-transform:none!important;letter-spacing:0!important;border-radius:8px!important;background:var(--ytt-gold)!important;color:var(--ytt-forest)!important}

/* Mobile menu open: a visible white close button and readable language/currency switchers */
.hamburger-wrapper.menu-open .js-hamburger{position:relative;z-index:60}
.hamburger-wrapper.menu-open .js-hamburger .hamburger-inner,.hamburger-wrapper.menu-open .js-hamburger .hamburger-inner:before,.hamburger-wrapper.menu-open .js-hamburger .hamburger-inner:after{background-color:#fff!important}
.hamburger-wrapper.menu-open .js-hamburger:focus-visible{outline:2px solid var(--ytt-gold);outline-offset:4px}
.hamburger-wrapper .mobile-menu-switchers>div>button,.hamburger-wrapper .mobile-menu-switchers>div>button span{color:#fff!important}

/* ===== Footer, refined (2026-11-24) ===== */
body.home #ts-footer{margin-top:0!important}
#ts-footer{margin-top:64px!important}
#ts-footer .ts-mask-bottom{background:#1f4a40!important;border-bottom:1px solid #ffffff14}
#ts-footer .ts-mask-bottom>div{padding-top:28px!important;padding-bottom:28px!important;gap:24px!important}
#ts-footer .ts-mask-bottom>div>a{font:700 18px/1.35 Inter,Arial,sans-serif!important;letter-spacing:-.01em!important;text-transform:none!important;max-width:420px}
#ts-footer .ts-mask-bottom i{font-style:normal}
#ts-footer .ts-mask-bottom .partner-line{gap:28px!important;align-items:center}
#ts-footer .ts-mask-bottom .partner-line p{font-size:14px!important;line-height:1.5;opacity:.85;max-width:460px}
#ts-footer .ts-mask-bottom .partner-line a{font:600 14px/1.3 Inter,Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;white-space:nowrap}
#ts-footer .ts-mask-bottom .ytt-sep{display:none}
#ts-footer .px-5.py-12{padding-top:56px!important;padding-bottom:40px!important}
#ts-footer h2,#ts-footer .wp-block-heading{font:700 16px/1.3 Inter,Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;margin-bottom:18px!important}
#ts-footer .menu{margin:0;padding:0;list-style:none}
#ts-footer .menu{row-gap:12px!important;gap:12px!important}
#ts-footer .menu li{margin:0!important}
#ts-footer .menu a,#ts-footer .ytt-footer-company a,#ts-footer .ytt-footer-links a{font:500 15px/1.45 Inter,Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;color:#ffffffd9!important;text-decoration:none!important}
#ts-footer .menu a:hover,#ts-footer .ytt-footer-company a:hover,#ts-footer .ytt-footer-links a:hover{color:#fff!important;text-decoration:underline!important;text-underline-offset:4px}
#ts-footer a[href^="tel:"].text-xl{font:700 20px/1.2 Inter,Arial,sans-serif!important;letter-spacing:0!important;margin-top:24px!important;align-items:center;gap:4px}
#ts-footer a[href^="tel:"].text-xl svg{width:24px;height:24px}
#ts-footer a[href^="tel:"].text-xl svg path{fill:var(--ytt-gold)}
#ts-footer p.partner-line{font-size:13px!important;line-height:1.65!important;opacity:.8;margin-top:18px!important}
#ts-footer .ts-footer-copyright ul{display:flex;flex-wrap:wrap;gap:6px 18px}
#ts-footer .ts-footer-copyright li{margin:0!important}
#ts-footer .ts-footer-copyright a{font-size:13px!important;font-weight:500!important;opacity:.75;text-decoration:none!important}
#ts-footer .ts-footer-copyright a:hover{opacity:1;text-decoration:underline!important}
#ts-footer p.font-bold.mt-8,#ts-footer p.hidden.mt-12{font-size:13px!important;font-weight:500!important;opacity:.75;margin-top:24px!important}
#ts-footer .ts-footer-form input[type=text],#ts-footer .ts-footer-form input[type=email]{border-radius:8px!important;min-height:46px;border:0!important}
#ts-footer .ts-footer-form .gform_button,#ts-footer .ts-footer-form button[type=submit],#ts-footer .ts-footer-form input[type=submit]{border-radius:8px!important;text-transform:none!important;letter-spacing:0!important;background:var(--ytt-gold)!important;color:var(--ytt-forest)!important;border:0!important;font-weight:700!important;min-height:46px}
#ts-footer .ts-footer-form p,#ts-footer .ts-footer-form .gfield_html,#ts-footer .ts-footer-form .gfield_html *{font-size:14px!important;font-weight:400!important;letter-spacing:0!important;line-height:1.55!important;opacity:.9}
#ts-footer .ts-footer-form input::placeholder{letter-spacing:0}
@media(min-width:1280px){#ts-footer .xl\:grid.xl\:grid-cols-3{gap:48px}}

#ts-footer .ts-footer-form strong.wp-block-heading{text-transform:none!important;letter-spacing:0!important;font-size:16px!important;line-height:1.3!important;margin-bottom:12px!important}

/* ===== Homepage rhythm (2026-11-24): calmer spacing, aligned blocks ===== */
@media(min-width:761px){
.ytt-home .ytt-section{padding-block:64px}
.ytt-home .ytt-film{padding-block:8px 64px}
.ytt-home .ytt-questions{max-width:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.7fr);column-gap:72px;align-items:start}
.ytt-home .ytt-questions h2{grid-column:1;grid-row:1 / span 6;margin:0!important;position:sticky;top:120px}
.ytt-home .ytt-questions details,.ytt-home .ytt-questions>.ytt-text-link{grid-column:2}
.ytt-home .ytt-questions details:first-of-type{padding-top:0}
}
.ytt-home .ytt-last{padding:72px 0;text-align:center}
.ytt-home .ytt-last p{margin-inline:auto}
.ytt-home .ytt-last .ytt-actions{justify-content:center}
.ytt-home .ytt-assurance{justify-content:center;gap:48px}

/* ===== Itinerary days and closing blocks (2026-11-24) ===== */
.timeline-pointer,.timeline-item-mask-y,.timeline-item-mask-x{display:none!important}
.timeline-inner>*+*{margin-top:28px!important}
.timeline-item{background:#fff!important;border:1px solid #183e3518;border-radius:12px;box-shadow:0 18px 40px -32px #0b1f1a40}
@media(min-width:1024px){.timeline-item{padding-bottom:48px!important}}
.grid.grid-cols-12:has(.cta-title){border-radius:16px;overflow:hidden;box-shadow:0 24px 48px -36px #0b1f1a66}
.grid.grid-cols-12:has(.cta-title) img,.grid.grid-cols-12:has(.cta-title)>div{border-radius:0!important}
.grid.grid-cols-12:has(.cta-title) .bg-white{border:0!important}
.grid.grid-cols-12:has(.cta-title) img.rounded-full,.grid.grid-cols-12:has(.cta-title) img[class*="rounded-full"]{border-radius:50%!important}
.grid.grid-cols-12:has(.cta-title)>div:has(>img:only-child){position:relative;min-height:280px}
.grid.grid-cols-12:has(.cta-title)>div>img:only-child{position:absolute;inset:0;width:100%!important;height:100%!important;object-fit:cover}

/* Language switcher removed (2026-11-24): the site is in English; machine translation is not offered */
.language-switcher{display:none!important}

/* ===== Content pages built here (Trip Care, Safari & Zanzibar) ===== */
.ytt-care{font:400 17px/1.65 Inter,Arial,sans-serif;color:#183e35}
.ytt-care *{box-sizing:border-box}
.ytt-care-hero{display:grid;grid-template-columns:1.1fr 1fr;background:#183e35;color:#fff;min-height:440px}
.ytt-care-hero-inner{padding:56px 48px 56px max(24px,calc((100vw - 1240px)/2));align-self:center}
.ytt-care-hero img{width:100%;height:100%;object-fit:cover;display:block}
.ytt-care-crumbs{font-size:14px;margin-bottom:20px;color:#ffffffcc}.ytt-care-crumbs a{color:#fff!important;text-decoration:underline}
.ytt-care-hero h1{color:#fff!important;font-size:clamp(34px,4vw,52px)!important;line-height:1.08!important;margin:0 0 18px}
.ytt-care-hero p{max-width:46ch;color:#ffffffe6;margin:0}
.ytt-care-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.ytt-care-btn{display:inline-flex;align-items:center;min-height:48px;padding:12px 22px;border-radius:8px;background:#d5a34d;color:#183e35!important;font-weight:700;text-decoration:none!important;transition:transform .15s cubic-bezier(.2,.8,.2,1)}
.ytt-care-btn:hover{background:#e4b763}.ytt-care-btn:active{transform:translateY(1px)}.ytt-care-btn:focus-visible{outline:2px solid #fff;outline-offset:3px}
.ytt-care-btn-ghost{background:transparent;border:1.5px solid #fff;color:#fff!important}.ytt-care-btn-ghost:hover{background:#ffffff1a}
.ytt-care-block{width:min(1240px,calc(100% - 48px));margin:0 auto;padding:64px 0}
.ytt-care-block h2,.ytt-care-last h2{font-size:clamp(26px,3vw,36px)!important;margin:0 0 28px}
.ytt-care-block-tint{width:100%;padding-inline:max(24px,calc((100% - 1240px)/2));background:#dde6db}
.ytt-care-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}
.ytt-care-list li{background:#fff;border:1px solid #183e3518;border-radius:12px;padding:22px 24px;margin:0}
.ytt-care-list h3{font-size:19px!important;margin:0 0 8px}.ytt-care-list p{margin:0;color:#3b4d45}
.ytt-care-faq{max-width:820px}.ytt-care-faq details{border-bottom:1px solid #c9d2c8;padding:16px 0}
.ytt-care-faq summary{cursor:pointer;font-weight:600;font-size:18px}.ytt-care-faq summary:focus-visible{outline:2px solid #d5a34d;outline-offset:4px}
.ytt-care-faq p{margin:10px 0 0;color:#3b4d45}
.ytt-care-more{margin-top:28px}.ytt-care-more a,.ytt-care-faq a{color:#183e35!important;text-decoration:underline}
.ytt-care-last{background:#183e35;color:#fff;text-align:center;padding:64px 24px}.ytt-care-last h2{color:#fff!important}.ytt-care-last p{color:#ffffffe6;margin:0 auto;max-width:52ch}.ytt-care-last .ytt-care-actions{justify-content:center}
@media(max-width:860px){.ytt-care-hero{grid-template-columns:1fr}.ytt-care-hero img{height:260px;order:-1}.ytt-care-hero-inner{padding:32px 20px 40px}.ytt-care-block{width:calc(100% - 36px);padding:48px 0}.ytt-care-block-tint{width:100%;padding-inline:18px}}
@media(prefers-reduced-motion:reduce){.ytt-care-btn{transition:none}}

.ytt-care-sub{margin:-12px 0 24px;color:#3b4d45}
.ytt-sz-cards article{border-radius:12px;overflow:hidden;background:#fff!important}

/* ===== One calm type style everywhere (2026-11-24) ===== */
.tracking-wide,.tracking-wider,.tracking-widest,[class*="!tracking-wide"]{letter-spacing:0!important}
.font-black{font-weight:700!important}
body:not(.home) .widget h2.uppercase,body:not(.home) h2.text-lg.uppercase{text-transform:none!important}
body:not(.home) .child-pages-tab{border-radius:8px!important;letter-spacing:0!important}
body:not(.home) .ts-prose li a,body:not(.home) .sidebar a{letter-spacing:0!important}

/* Footer: four tidy columns, link columns on phones too, no photo notice */
#ts-footer .ytt-footer-company h2,#ts-footer .ytt-footer-links h2{text-transform:none!important;letter-spacing:0!important;font-size:17px!important}
#ts-footer .ytt-footer-company ul{list-style:none;margin:16px 0 0;padding:0}#ts-footer .ytt-footer-company li{margin:0 0 12px}
#ts-footer .ytt-footer-company a,#ts-footer .ytt-footer-links a{color:#fff!important;text-decoration:none;font-weight:500}
#ts-footer .ytt-footer-company a:hover,#ts-footer .ytt-footer-links a:hover{text-decoration:underline;text-underline-offset:4px}
@media(min-width:768px){#ts-footer .xl\\:col-span-2.md\\:grid-cols-3{grid-template-columns:1.25fr 1fr 1fr 1fr}}
@media(max-width:767px){#ts-footer .ytt-footer-links,#ts-footer .ytt-footer-company{margin-top:32px}#ts-footer .ytt-footer-links li a,#ts-footer .ytt-footer-company li a{display:inline-block;padding:6px 0}}
#ts-footer .partner-line a{color:#fff!important;text-decoration:underline}
/* Same footer on the homepage as on every other page */
#ts-footer .uppercase:not(.sr-only){text-transform:none!important;letter-spacing:0!important}
#ts-footer .tracking-widest,#ts-footer .tracking-wider{letter-spacing:0!important}
#ts-footer a[href^="tel:"]{white-space:nowrap}

/* Partner video: 16:9 from its own width (percentage padding followed the wider grid) */
.video-frame{padding-top:0!important;aspect-ratio:16/9;height:auto}

/* Highlight icons (outline, gold on sage) */
.ytt-usp-icon{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:#dde6db;color:var(--ytt-forest);flex:none}
.ytt-usp-icon svg{color:var(--ytt-forest)}
@media(max-width:1023px){.ytt-usp-icon{width:44px;height:44px}.ytt-usp-icon svg{width:22px;height:22px}}

/* Reviews: Google quotes and the second review link */
.ytt-quote{margin:0;background:#fff;border:1px solid #183e3518;border-radius:12px;padding:20px 22px}
.ytt-quote blockquote{margin:0;font-size:17px;line-height:1.6;color:var(--ytt-forest);font-style:normal;border:0;padding:0}
.ytt-quote figcaption{margin-top:12px;font-size:14px;font-weight:600;color:var(--ytt-muted)}.ytt-quote figcaption a{color:var(--ytt-forest)!important;text-decoration:underline}
.ytt-sep{color:inherit;opacity:.7}
.ytt-initials{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:var(--ytt-forest);color:#fff;font:700 18px/1 Inter,Arial,sans-serif;letter-spacing:.02em;margin-bottom:12px}

/* About us */
.ytt-safari-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin:24px 0}.ytt-safari-gallery figure{margin:0}.ytt-safari-gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px}.ytt-safari-gallery figcaption{font-size:13px;margin-top:6px;color:var(--ytt-muted)}
.ytt-about .ytt-lead{font-size:20px;line-height:1.6;font-weight:500}
.ytt-about-figure{margin:28px 0}.ytt-about-figure img{width:100%;height:auto;border-radius:12px}.ytt-about-figure figcaption{font-size:14px;margin-top:8px;color:var(--ytt-muted)}
.ytt-people{display:grid;gap:20px;margin:20px 0 8px}@media(min-width:900px){.ytt-people{grid-template-columns:1fr 1fr}}
.ytt-person{background:#fff;border:1px solid #183e3518;border-radius:12px;padding:22px 24px}.ytt-person h3{margin-top:0!important}
.ytt-person-photo{grid-column:1/-1}.ytt-person-photo img{float:right;width:120px!important;height:120px!important;border-radius:50%!important;object-fit:cover;margin:0 0 12px 20px}
@media(max-width:600px){.ytt-person-photo img{float:none;display:block;margin:0 0 14px}}

/* Plan my Trip: readable fields, real counters, clear errors */
#gform_wrapper_5 input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=range]),#gform_wrapper_5 select,#gform_wrapper_5 textarea{background:#fff!important;color:var(--ytt-forest)!important;border:1px solid #ffffff59!important;border-radius:8px!important;font-size:16px!important;min-height:48px}
#gform_wrapper_5 ::placeholder{color:#5b6b63!important;opacity:1}
#gform_wrapper_5 .ytt-required-note{font-size:14px;color:#ffffffd9;margin:0 0 8px}
#gform_wrapper_5 .gfield_list_groups .gfield_label:not(.ytt-age-label){display:none!important}
#gform_wrapper_5 .ginput_container_number{width:auto!important;display:inline-flex!important;align-items:center;gap:0;background:#fff;border-radius:8px;overflow:hidden;min-height:48px}
#gform_wrapper_5 .ginput_container_number .quantity-button{width:48px!important;height:48px!important;min-height:48px;background:#fff!important;border:0!important;border-radius:0!important;position:relative;cursor:pointer;flex:none}
#gform_wrapper_5 .ginput_container_number .quantity-button:before{content:"";position:absolute;left:50%;top:50%;width:16px;height:2px;background:var(--ytt-forest);transform:translate(-50%,-50%);border-radius:2px}
#gform_wrapper_5 .ginput_container_number .quantity-button_increment:after{content:"";position:absolute;left:50%;top:50%;width:2px;height:16px;background:var(--ytt-forest);transform:translate(-50%,-50%);border-radius:2px}
#gform_wrapper_5 .ginput_container_number .quantity-button:hover{background:#dde6db!important}
#gform_wrapper_5 .ginput_container_number .quantity-button:active:before{transform:translate(-50%,-50%) scale(.85)}
#gform_wrapper_5 .ginput_container_number .quantity-button:disabled{cursor:not-allowed;opacity:.35}
#gform_wrapper_5 .ginput_container_number .quantity-button:focus-visible{outline:2px solid var(--ytt-gold);outline-offset:-2px}
#gform_wrapper_5 .ginput_container_number input{width:44px!important;min-height:48px!important;border:0!important;border-radius:0!important;text-align:right;font:700 18px/1 Inter,Arial,sans-serif!important;color:var(--ytt-forest)!important;-webkit-text-fill-color:var(--ytt-forest);opacity:1!important;padding:0 4px!important;background:#fff!important;-moz-appearance:textfield}
#gform_wrapper_5 .ginput_container_number input::-webkit-inner-spin-button{-webkit-appearance:none}
#gform_wrapper_5 .ytt-unit{font:600 16px/48px Inter,Arial,sans-serif;color:var(--ytt-forest);padding:0 8px 0 2px;min-width:74px;white-space:nowrap}
#gform_wrapper_5 .ginput_container_number .instruction{display:none!important}
#gform_wrapper_5 .ytt-age-label{display:block;font-size:14px;font-weight:600;color:#fff;margin:0 0 6px}
.ytt-error{display:block;margin:8px 0 0;padding:8px 12px;border-radius:8px;background:#fff4e0;color:#7a2e00!important;font:600 14px/1.4 Inter,Arial,sans-serif}
.gfield_error .ytt-error{animation:ytt-pop .25s cubic-bezier(.2,.8,.2,1)}
@keyframes ytt-pop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.gfield_error .ytt-error{animation:none}.js-header #menu-header-primary .menu-toggle,.js-header .menu-collage img{transition:none}}

/* Phones and tablets: no sideways scrolling, tap targets of at least 44px */
html,body{max-width:100%;overflow-x:clip}
@media(max-width:767px){body:not(.home) .btn,body:not(.home) .button,body:not(.home) .gform_button{min-height:48px}body:not(.home) h1{font-size:clamp(30px,8vw,40px)!important;overflow-wrap:anywhere}}
`;
