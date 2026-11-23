// Website polish (owner brief 2026-11-23): brand positioning, WhatsApp number, navigation, footer,
// About us, Plan my Trip. Applied at build time in BaseLayout.astro after redesign.js and fixes.js,
// so it survives `npm run rebrand` and later update folders that replace those two files.
// The client-side part lives in public/assets/js/site-ui.js; plain-text files are handled by
// scripts/polish-finish.mjs after the build.
import * as cheerio from 'cheerio';

const digits = s => String(s || '').replace(/\D/g, '');

/** WhatsApp link from the brand tokens (company.whatsapp). */
export const whatsappUrl = tokens => `https://wa.me/${digits(tokens.company.whatsapp)}`;

// ---------------------------------------------------------------------------------------------
// 1. Brand positioning: Your Tanzania Trip is the brand visitors deal with; Baraka Dalali and his
//    team are "our local partner in Arusha". The legal name of the partner company stays only in the
//    sentence that says who operates the trip (consumer information) and in "Recognised by".
// ---------------------------------------------------------------------------------------------
const LEGAL = '⁣KNT⁣';
const PROTECT = [
  // "your trip is operated by Kilimanjaro Nature Tours, a licensed Tanzanian tour operator and member of TATO"
  [/(operated (?:in Tanzania )?by\s*(?:<a\b[^>]*>)?\s*)Kilimanjaro Nature Tours(\s*(?:<\/a>)?\s*,\s*a licensed Tanzanian tour operator)/g, `$1${LEGAL}$2`],
];
const PARTNER = [
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
  // Contact details and links of the partner company
  [/\s*·?\s*<a\b[^>]*href="mailto:info@kilimanjaronaturetours\.com"[^>]*>[\s\S]*?<\/a>/g, ''],
  [/\s*·?\s*<a\b[^>]*href="https?:\/\/(?:www\.)?kilimanjaronaturetours\.com[^"]*"[^>]*>[\s\S]*?<\/a>/g, ''],
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
  for (const [re, to] of PROTECT) html = html.replace(re, to);
  for (const [re, to] of rules) html = html.replace(re, to);
  return html.split(LEGAL).join('Kilimanjaro Nature Tours');
}

// ---------------------------------------------------------------------------------------------
// 2. WhatsApp: one number from the tokens. The phone line (company.phone) stays as it is.
// ---------------------------------------------------------------------------------------------
function rewriteWhatsapp(html, tokens) {
  const phone = tokens.company.phone;              // +31 6 29351377
  const wa = tokens.company.whatsapp;              // +31 6 12729607
  if (!wa || digits(wa) === digits(phone)) return html;
  const oldDigits = digits(phone);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const p = esc(phone);
  return html
    .replace(new RegExp(`(wa\\.me/|api\\.whatsapp\\.com/send/?\\?phone=)${oldDigits}`, 'g'), `$1${digits(wa)}`)
    .replace(new RegExp(`(WhatsApp:\\s*</span>\\s*)${p}`, 'g'), `$1${wa}`)
    .replace(new RegExp(`(href="https://wa\\.me/${digits(wa)}"[^>]*>\\s*)${p}`, 'g'), `$1${wa}`)
    .replace(new RegExp(`${p} \\(WhatsApp\\)`, 'g'), `${phone} (phone) · WhatsApp <a href="https://wa.me/${digits(wa)}">${wa}</a>`)
    .replace(new RegExp(`Phone and WhatsApp ${p}`, 'g'), `Phone ${phone}, WhatsApp ${wa}`)
    .replace(new RegExp(`Phone/WhatsApp ${p}`, 'g'), `Phone ${phone}, WhatsApp ${wa}`)
    .replace(new RegExp(`WhatsApp or call ${p}`, 'g'), `WhatsApp ${wa} or call ${phone}`);
}
function rewriteWhatsappText(text, tokens) {
  const phone = tokens.company.phone, wa = tokens.company.whatsapp;
  if (!wa || digits(wa) === digits(phone)) return text;
  const p = phone.replace(/[+]/g, '\\+');
  return text
    .replace(new RegExp(`WhatsApp or call ${p}`, 'g'), `WhatsApp ${wa} or call ${phone}`)
    .replace(new RegExp(`Phone/WhatsApp ${p}`, 'g'), `Phone ${phone}, WhatsApp ${wa}`)
    .replace(new RegExp(`wa\\.me/${digits(phone)}`, 'g'), `wa.me/${digits(wa)}`);
}

// Promises nobody has confirmed (reply time, "100 lodges visited").
const PROMISES = [
  [/ We reply within 24 hours, usually sooner\./g, ' We reply personally.'],
  [/Free travel proposal within 24 hours\./g, 'Free, personal travel proposal.'],
  [/A free, no-obligation travel proposal within 24 hours\./g, 'A free, no-obligation travel proposal.'],
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
  // A company "based in Africa" that runs trips in four countries was the previous operator.
  [/Your Tanzania Trip is a company based in Africa with Dutch roots\s*\.?/g, 'Your Tanzania Trip is a Dutch travel company for trips to Tanzania.'],
  [/We jointly organise safaris in Tanzania, Kenya, Uganda and South Africa\.?/g, 'Together we organise safaris, Kilimanjaro climbs and Zanzibar stays in Tanzania.'],
];

// ---------------------------------------------------------------------------------------------
// 3. Footer: no photo notice, a company column, link columns visible on phones.
// ---------------------------------------------------------------------------------------------
function footerColumn() {
  const links = [
    ['/about-us/', 'About us'], ['/our-partner/', 'Our local partner'], ['/travel-proposal/', 'Plan my Trip'],
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
const fill = text => `<span class="fill-marker">[INVULLEN: ${text}]</span>`;
function aboutHtml(tokens) {
  const co = tokens.company, p = tokens.partner, wa = whatsappUrl(tokens);
  const bio = rewritePartner(p.founderBio, PARTNER);
  return `
<p class="ytt-lead">Your Tanzania Trip is a travel company for tailor-made trips to Tanzania: safaris, Kilimanjaro climbs, Zanzibar and combinations of all three. We plan and book your trip with you from the Netherlands. Our local partner in Arusha, Baraka Dalali, and his team run it on the ground.</p>
<h2>Our story</h2>
<p>Your Tanzania Trip started with an internship. Tijs Krops and Edrian Waterman, two students from the Netherlands, spent their internship in Arusha with Baraka Dalali and his crew. They helped Baraka with marketing and with preparing his company for international guests, climbed with his guides and drove along on safari.</p>
<p>When it was time to go home, none of us wanted to stop working together. So we set up this partnership ${fill('startjaar')}: Your Tanzania Trip plans and books your trip from the Netherlands, and Baraka and his crew run it in Tanzania. It works because both sides do what they are best at.</p>
<p>${fill('meer over hoe de samenwerking met Baraka is begonnen (aan te leveren door de eigenaar)')}</p>
<figure class="ytt-about-figure"><img src="/brand/partner/crew-summit.webp" alt="Baraka’s crew on the summit of Kilimanjaro" width="1280" height="800" loading="lazy" decoding="async"><figcaption>Baraka’s crew on the summit of Kilimanjaro.</figcaption></figure>
<h2>Why we work this way</h2>
<ul>
<li><strong>Planning with a team in Europe.</strong> You plan in English or Dutch, with people who know what international travellers ask about: flights, insurance, payments and a clear quote.</li>
<li><strong>Local knowledge in Tanzania.</strong> Baraka and his team live and work in Tanzania. They know the parks, the routes, the lodges and the mountain, and they look after you during your trip.</li>
<li><strong>Everything confirmed before you pay.</strong> Lodges, activities and transfers are confirmed with our partner in writing before we send an invoice.</li>
<li><strong>A private trip.</strong> On safari the vehicle and the guide are yours alone; on Kilimanjaro you climb with your own crew.</li>
</ul>
<h2>Who you deal with</h2>
<div class="ytt-people">
<div class="ytt-person"><h3>Tijs Krops</h3><p>Plans and books your trip from Nagele in the Netherlands and is your contact before departure: the proposal, your questions, the invoice and the travel documents. Speaks English and Dutch.</p><p>${fill('foto en 2–3 zinnen over Tijs')}</p></div>
<div class="ytt-person"><h3>Edrian Waterman</h3><p>Plans and books trips together with Tijs, and knows the lodges and the routes from his months in Arusha.</p><p>${fill('foto en 2–3 zinnen over Edrian')}</p></div>
<div class="ytt-person ytt-person-photo"><img src="/brand/partner/baraka-dalali.webp" alt="Baraka Dalali, our local partner in Arusha" width="160" height="160" loading="lazy" decoding="async"><h3>Baraka Dalali</h3><p>${bio}</p><p><a href="/our-partner/">More about Baraka and his team</a></p></div>
</div>
<h2>How we work</h2>
<ol>
<li>You tell us what you have in mind: dates, who is travelling, budget and pace.</li>
<li>We send you a personal proposal, free and without obligation, and adjust it with you until it fits.</li>
<li>When you confirm, you pay a deposit and later the balance, and you receive your travel documents.</li>
<li>In Tanzania, Baraka’s team welcomes you and looks after you. We stay reachable on WhatsApp throughout your trip.</li>
</ol>
<p>Read what every trip includes in the <a href="/hakuna-matata-package/">Hakuna Matata Package</a>, and why you need <a href="/practical-information/travel-insurance/">travel insurance</a>.</p>
<h2>Reviews of our local partner</h2>
<p>Baraka’s team is rated ${p.tripadvisor.score} out of 5 on Tripadvisor (${p.tripadvisor.count} reviews, checked ${p.tripadvisor.checkedOn}) and received the Travellers’ Choice award in 2023 and 2024. <a href="${p.tripadvisor.url}" target="_blank" rel="noopener noreferrer">Read the reviews on Tripadvisor</a>. These reviews are about our partner’s service in Tanzania. Your Tanzania Trip is new and does not have reviews of its own yet.</p>
<h2>Contact</h2>
<p>Your Tanzania Trip, ${co.address.replace(', Netherlands', ', the Netherlands')}. E-mail <a href="mailto:${co.email}">${co.email}</a>, WhatsApp <a href="${wa}">${co.whatsapp}</a>, phone <a href="tel:${co.phone.replace(/[^\d+]/g, '')}">${co.phone}</a>. <a href="/contact/">All contact details</a>.</p>
<h2>Ready to start?</h2>
<p>Browse the <a href="/tanzania-travel/">sample itineraries</a> or <a href="/travel-proposal/">plan your trip with us</a>. Karibu.</p>`;
}

const PAGE = {
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
        el.html(el.html().replace(/^Kilimanjaro Nature Tours is/, `Baraka’s company, ${LEGAL}, is`));
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
  html = rewriteWhatsapp(html, tokens);
  for (const [re, to] of PROMISES) html = html.replace(re, to);
  return html;
}
export function polishChrome(html, tokens, part) {
  html = part === 'footer' ? polishFooter(html) : polishHeader(html);
  html = rewritePartner(html);
  html = rewriteWhatsapp(html, tokens);
  for (const [re, to] of PROMISES) html = html.replace(re, to);
  return html;
}
/** Inline scripts of a page (Gravity Forms settings). */
export function polishScripts(js, page) {
  // Plan my Trip: conditional logic resets hidden fields to their defaults; no preselected country.
  if (page.path === '/travel-proposal/') js = js.replace(/"16":"US"/g, '"16":""');
  return js;
}
/** HTML fragments that skip BaseLayout (dist/ajax/**, loaded by static-ajax.js). */
export function polishFragment(html, tokens) {
  html = rewritePartner(html);
  html = rewriteWhatsapp(html, tokens);
  for (const [re, to] of PROMISES) html = html.replace(re, to);
  return html;
}
/** Titles, descriptions, Open Graph text, JSON-LD and plain-text files. */
export function polishText(text, tokens) {
  if (!text) return text;
  text = rewritePartner(text, [...PARTNER_TEXT, ...PARTNER]);
  text = rewriteWhatsappText(text, tokens);
  for (const [re, to] of PROMISES) text = text.replace(re, to);
  return text;
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

/* About us */
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
