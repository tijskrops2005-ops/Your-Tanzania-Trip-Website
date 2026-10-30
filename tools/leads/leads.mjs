#!/usr/bin/env node
// Lead finder for Your Tanzania Trip. Business contacts only (travel agencies, bloggers, creators), plus
// public forum threads of people planning a safari (links only, no personal contact details).
//
//   node tools/leads/leads.mjs <agencies|bloggers|creators|safari|intent|all> [--market nl|de,gb|all]
//     [--limit 30] [--budget 0.5] [--city Utrecht] [--minFollowers 1000] [--since year|month|week]
//
// Every Apify run is capped at --budget USD. New rows go to leads/<date>-<type>-<markets>.csv and are merged
// into leads/leads.csv, or leads/intent.csv for `intent` (de-duplicated; your status column there is kept).
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, runActor, spent, monthlyCredit } from './apify.mjs';
import { toCsv, mergeIntoMaster, domainOf, INTENT_COLUMNS, intentKeys } from './csv.mjs';
import { pickMarkets } from './markets.mjs';

const OUT_DIR = path.join(ROOT, 'leads');
const TODAY = new Date().toISOString().slice(0, 10);

const TRAVEL_CATEGORY = /travel|tour|reis|reise|rese|rejse|voyage|viaje|viagg|safari/i;
const TRAVEL_BUSINESS = /travel (company|agency|agent)|tour (agency|operator|guide)|reisbureau|reiseb(ü|u)ro/i;
const TOUR_SITE = /tour|safari|travel|reizen|reisbureau|reiseb(ü|u)ro|voyages|viajes|viaggi|resor|rejser/i;
const TRAVEL_BIO = /travel|trip|reis|reise|rese|rejse|voyage|viaje|viagg|wander|explor|safari|africa|afrika|afrique|nomad|backpack|world|wereld|welt|✈|🌍|🌎|🌏|🧳/i;
const BAD_EMAIL = /example\.|sentry|wixpress|wix\.com|domain\.(com|nl)|email\.com|yourname|your-?email|noreply|no-reply|privacy@|gdpr@|abuse@|datenschutz|meldestelle|dsa\.|\.(png|jpe?g|webp|gif|svg)$/i;
// Accounts that sell travel rather than show their own trips.
const SELLS_TRAVEL = /\btours?\b|safaris\b|operator|agency|\bagent\b|lodge|\bcamps?\b|hotel|resort|booking|book now|reservation|travel company|reisbureau|reisebüro|\bguide\b|driver|transfer|whatsapp|\+255|📞|☎|reisadvis|reisspecialist|maatwerk|tailor-?made|bespoke/i;
// Where a profile says it is based: flag emoji or place name, first mention wins.
const HOME_HINTS = [
  ['nl', /🇳🇱|nederland|netherlands|holland|dutch|amsterdam|rotterdam|utrecht|den haag|eindhoven|groningen/i],
  ['be', /🇧🇪|belgi|antwerp|brussel|bruxelles|gent\b|ghent|leuven|liège/i],
  ['de', /🇩🇪|deutschland|germany|german\b|berlin|münchen|munich|hamburg|köln|cologne|frankfurt|stuttgart|düsseldorf/i],
  ['ch', /🇨🇭|schweiz|switzerland|suisse|zürich|zurich|bern\b|basel|genève|geneva/i],
  ['gb', /🇬🇧|🏴|united kingdom|\buk\b|england|scotland|wales|london|manchester|bristol|edinburgh/i],
  ['us', /🇺🇸|\busa\b|united states|new york|nyc|california|texas|florida|chicago|seattle|boston/i],
  ['se', /🇸🇪|sverige|sweden|swedish|stockholm|göteborg|gothenburg|malmö/i],
  ['dk', /🇩🇰|danmark|denmark|danish|københavn|copenhagen|aarhus/i],
  ['no', /🇳🇴|norge|norway|norwegian|oslo|bergen/i],
  ['fr', /🇫🇷|france|french|paris|lyon|marseille|bordeaux/i],
  ['es', /🇪🇸|españa|spain|spanish|madrid|barcelona|valencia|sevilla/i],
  ['it', /🇮🇹|italia|italy|italian|roma|rome|milano|milan|torino|firenze/i],
];
function homeCountry(text) {
  let best = null;
  for (const [id, re] of HOME_HINTS) {
    const i = String(text || '').search(re);
    if (i >= 0 && (!best || i < best.i)) best = { id, i };
  }
  return best?.id || '';
}
const EMAIL_IN_TEXT = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// Big platforms, media and chains that show up in search results but are not blogger leads.
const SKIP_DOMAINS = /(^|\.)(tripadvisor|booking|expedia|lonelyplanet|wikipedia|wikitravel|wikivoyage|youtube|instagram|facebook|pinterest|reddit|tiktok|twitter|x|linkedin|amazon|google|safaribookings|viator|getyourguide|airbnb|hotels|trivago|skyscanner|kayak|tui|anwb|sunweb|corendon|kras|cnn|bbc|nytimes|theguardian|telegraph|independent|forbes|nationalgeographic|natgeo|cntraveler|travelandleisure|timeout|msn|yahoo|medium|quora|yourtanzaniatrip|kilimanjaronaturetours|tanzania-specialist)\.[a-z.]+$|\.gov(\.[a-z]+)?$/i;

function args(argv) {
  const o = { cmd: argv[0], market: 'nl', limit: 30, budget: 0.5, city: '', minFollowers: 1000, since: 'year' };
  for (let i = 1; i < argv.length; i += 2) {
    const k = argv[i]?.replace(/^--/, '');
    if (!(k in o)) throw new Error(`Unknown option --${k}`);
    o[k] = typeof o[k] === 'number' ? Number(argv[i + 1]) : argv[i + 1];
  }
  return o;
}

const emails = (list) => [...new Set((list || []).map((e) => String(e).trim().toLowerCase()).filter((e) => e && !BAD_EMAIL.test(e)))].slice(0, 3).join('; ');
const igUrl = (v) => {
  const h = String(v || '').match(/instagram\.com\/([A-Za-z0-9._]+)/)?.[1] || (/^[A-Za-z0-9._]+$/.test(v || '') ? v : '');
  return h && !['p', 'reel', 'explore', 'accounts', 'wix', 'wordpress', 'shopify', 'squarespace', 'instagram'].includes(h) ? `https://www.instagram.com/${h}/` : '';
};
const cleanUrl = (u) => String(u || '').replace(/[?#].*$/, '');
const lead = (fields) => ({ status: 'new', found_at: TODAY, ...fields });

async function agencies(m, o) {
  const places = await runActor('compass/crawler-google-places', {
    searchStringsArray: m.agencyTerms,
    countryCode: m.code,
    ...(o.city ? { city: o.city } : {}),
    language: m.lang,
    maxCrawledPlacesPerSearch: o.limit,
    scrapeContacts: true, // emails + socials from the agency's own website (~$0.002 per place)
  }, { maxCostUsd: o.budget, label: `Google Maps · reisbureaus ${m.name}${o.city ? ` (${o.city})` : ''}` });

  return places
    .filter((p) => !p.permanentlyClosed && !p.temporarilyClosed && (p.website || p.phone))
    .filter((p) => !p.countryCode || p.countryCode.toLowerCase() === m.code) // e.g. NL search also returns Sint Maarten
    .filter((p) => TRAVEL_CATEGORY.test([p.categoryName, ...(p.categories || [])].join(' ')))
    .map((p) => lead({
      type: 'agency', market: m.id, name: p.title,
      email: emails(p.emails), phone: p.phone || '', website: cleanUrl(p.website),
      instagram: igUrl(p.instagrams?.[0]), city: p.city || '', country: p.countryCode || m.code.toUpperCase(),
      category: p.categoryName || '',
      notes: p.totalScore ? `Google ${p.totalScore} (${p.reviewsCount} reviews)` : '',
      source: 'Google Maps', source_url: p.url || '',
    }));
}

async function bloggers(m, o) {
  const pages = await runActor('apify/google-search-scraper', {
    queries: m.blogQueries.join('\n'),
    countryCode: m.code, searchLanguage: m.lang, languageCode: m.lang,
    maxPagesPerQuery: 1,
  }, { maxCostUsd: o.budget, label: `Google · reisblogs ${m.name}` });

  const sites = new Map();
  for (const r of pages.flatMap((p) => p.organicResults || [])) {
    const d = domainOf(r.url);
    if (!d || SKIP_DOMAINS.test(d) || sites.has(d)) continue;
    sites.set(d, { domain: d, home: new URL(r.url).origin + '/', title: r.title, url: r.url });
  }
  const picked = [...sites.values()].slice(0, o.limit);
  if (!picked.length) return [];

  const contacts = await findContacts(picked.map((s) => s.home), o);
  return picked.map((s) => {
    const c = contacts.get(s.home) || {};
    return lead({
      type: TOUR_SITE.test(s.domain) && !/blog/i.test(`${s.domain} ${s.title}`) ? 'agency' : 'blogger', market: m.id, name: s.domain,
      email: emails(c.emails), phone: (c.phones || [])[0] || '', website: s.home,
      instagram: igUrl(c.instagrams?.[0]), country: m.code.toUpperCase(),
      notes: s.title, source: 'Google', source_url: s.url,
    });
  }).filter((l) => l.email || l.instagram);
}

async function creators(m, o) {
  const perTag = Math.max(10, Math.ceil((o.limit * 2) / m.hashtags.length));
  const posts = await runActor('apify/instagram-hashtag-scraper', {
    hashtags: m.hashtags, resultsType: 'posts', resultsLimit: perTag,
  }, { maxCostUsd: o.budget, label: `Instagram · #${m.hashtags.join(' #')}` });

  const counts = new Map();
  for (const p of posts) if (p.ownerUsername) counts.set(p.ownerUsername, (counts.get(p.ownerUsername) || 0) + 1);
  const usernames = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a)).slice(0, o.limit);
  if (!usernames.length) return [];

  const profiles = await runActor('apify/instagram-profile-scraper', { usernames }, {
    maxCostUsd: o.budget, label: `Instagram-profielen · ${usernames.length}`,
  });

  // Travel businesses are kept whatever their size; creators need a real audience.
  const kept = profiles
    .filter((p) => !p.private && p.followersCount <= 2_000_000)
    .filter((p) => TRAVEL_BIO.test(`${p.biography} ${p.fullName} ${p.businessCategoryName}`))
    .map((p) => ({ ...p, isAgency: TRAVEL_BUSINESS.test(p.businessCategoryName || '') }))
    .filter((p) => p.isAgency || p.followersCount >= o.minFollowers);

  // Instagram hides contact buttons from scrapers, so read the profile's own link (site or link-in-bio page).
  const links = [...new Set(kept.map((p) => p.externalUrl).filter((u) => u && !SKIP_DOMAINS.test(domainOf(u))))];
  const contacts = links.length ? await findContacts(links, o) : new Map();

  return kept.map((p) => {
    const c = contacts.get(p.externalUrl) || {};
    return lead({
      type: p.isAgency ? 'agency' : 'creator', market: m.id, name: p.fullName || p.username,
      email: emails([...(String(p.biography || '').match(EMAIL_IN_TEXT) || []), ...(c.emails || [])]),
      phone: (c.phones || [])[0] || '',
      website: p.externalUrl || '', instagram: igUrl(p.username), followers: p.followersCount,
      category: p.businessCategoryName || '', notes: String(p.biography || '').replace(/\s+/g, ' ').slice(0, 160),
      source: 'Instagram', source_url: p.url || igUrl(p.username),
    });
  });
}

// Crawls each start URL (plus a few pages one click deep on the same site) for emails, phones and socials.
// Returns a Map keyed by the start URL as given.
async function findContacts(urls, o) {
  const items = await runActor('vdrmota/contact-info-scraper', {
    startUrls: urls.map((url) => ({ url })),
    maxDepth: 1, maxRequestsPerStartUrl: 8, sameDomain: true, mergeContacts: true, considerChildFrames: false,
  }, { maxCostUsd: o.budget, label: `Contactgegevens · ${urls.length} sites` });
  const norm = (u) => String(u || '').replace(/\/$/, '');
  const byStart = new Map(items.map((c) => [norm(c.originalStartUrl), c]));
  return new Map(urls.map((u) => [u, byStart.get(norm(u))]).filter(([, c]) => c));
}

// Instagram accounts of people who travel and post about safari themselves (micro creators, 1k–100k).
// Approach them for a collaboration, not for a sale.
async function safari(m, o) {
  const perTag = Math.max(15, Math.ceil((o.limit * 3) / m.safariTags.length));
  const posts = await runActor('apify/instagram-hashtag-scraper', {
    hashtags: m.safariTags, resultsType: 'posts', resultsLimit: perTag,
  }, { maxCostUsd: o.budget, label: `Instagram · #${m.safariTags.join(' #')}` });

  const usernames = [...new Set(posts.map((p) => p.ownerUsername).filter(Boolean))].slice(0, o.limit * 2);
  if (!usernames.length) return [];
  const profiles = await runActor('apify/instagram-profile-scraper', { usernames }, {
    maxCostUsd: o.budget, label: `Instagram-profielen · ${usernames.length}`,
  });

  // Safari hashtags are full of companies selling Africa trips: keep those as agency leads.
  const kept = profiles
    .filter((p) => !p.private && p.followersCount <= 100_000)
    .map((p) => ({
      ...p,
      home: homeCountry(`${p.biography} ${p.fullName}`),
      sells: SELLS_TRAVEL.test(`${p.biography} ${p.fullName} ${p.businessCategoryName}`) || TRAVEL_BUSINESS.test(p.businessCategoryName || ''),
    }))
    .filter((p) => p.sells || p.followersCount >= o.minFollowers)
    .filter((p) => !/\+255|tanzania based|arusha|moshi|zanzibar based/i.test(p.biography || '')) // skip operators in Tanzania itself
    // English hashtags are worldwide, so there we need the profile itself to say where it is based.
    .filter((p) => p.home === m.id || (!p.home && m.lang !== 'en'))
    .slice(0, o.limit * 2);

  const links = [...new Set(kept.map((p) => p.externalUrl).filter((u) => u && !SKIP_DOMAINS.test(domainOf(u))))];
  const contacts = links.length ? await findContacts(links, o) : new Map();

  return kept.map((p) => {
    const c = contacts.get(p.externalUrl) || {};
    return lead({
      type: p.sells ? 'agency' : 'creator', market: m.id, name: p.fullName || p.username,
      email: emails([...(String(p.biography || '').match(EMAIL_IN_TEXT) || []), ...(c.emails || [])]),
      website: p.externalUrl || '', instagram: igUrl(p.username), followers: p.followersCount,
      country: (p.home || m.id).toUpperCase(), category: p.sells ? 'afrika-specialist' : 'safari-reiziger',
      notes: `${p.home ? '' : '(land geschat uit hashtag) '}${String(p.biography || '').replace(/\s+/g, ' ').slice(0, 140)}`,
      source: 'Instagram', source_url: p.url || igUrl(p.username),
    });
  });
}

// Recent public Reddit posts where someone is planning an Africa trip. Output is links to answer in the open;
// usernames are not stored. Reddit is English-speaking, so this runs once for all markets.
const REDDIT_SOURCES = [
  'https://www.reddit.com/r/travel/search/?q=tanzania%20safari&restrict_sr=1&sort=new',
  'https://www.reddit.com/r/travel/search/?q=serengeti&restrict_sr=1&sort=new',
  'https://www.reddit.com/r/solotravel/search/?q=safari&restrict_sr=1&sort=new',
  'https://www.reddit.com/r/safaris/new/',
  'https://www.reddit.com/r/tanzania/search/?q=safari&restrict_sr=1&sort=new',
  'https://www.reddit.com/r/Honeymoon/search/?q=safari&restrict_sr=1&sort=new',
];
const AFRICA = /tanzania|serengeti|kilimanjaro|zanzibar|ngorongoro|tarangire|kenya|masai|maasai|amboseli|botswana|namibia|rwanda|uganda|south africa|africa|game drive|big five/i;
const NOT_TRAVEL = /ad ?block|mac ?os|\bios\b|iphone|ipad|browser|extension|webkit/i;
// Posts by people who sell safaris rather than plan one.
const SALES_POST = /we offer|book (now|with us)|our (company|tours|packages)|whatsapp|\+255|dm (me|us) for|discount/i;

async function intent(m, o) {
  const posts = await runActor('trudax/reddit-scraper-lite', {
    startUrls: REDDIT_SOURCES.map((url) => ({ url })),
    skipComments: true, skipUserPosts: true, skipCommunity: true, includeNSFW: false,
    maxPostCount: o.limit, maxItems: o.limit * REDDIT_SOURCES.length,
  }, { maxCostUsd: o.budget, timeoutSecs: 300, label: `Reddit · ${REDDIT_SOURCES.length} reisfora` });

  const since = Date.now() - ({ week: 7, month: 31, year: 366 }[o.since] || 366) * 864e5;
  return posts
    .filter((p) => p.url && p.title && (!p.createdAt || Date.parse(p.createdAt) >= since))
    .filter((p) => (AFRICA.test(`${p.title} ${p.body}`) || /safaris/i.test(p.communityName || '')) && !NOT_TRAVEL.test(p.title))
    .filter((p) => !SALES_POST.test(`${p.title} ${p.body}`))
    .map((p) => ({
      status: 'new', market: 'en', platform: p.communityName || 'reddit',
      title: p.title, url: p.url, snippet: String(p.body || '').replace(/\s+/g, ' ').slice(0, 300),
      date: String(p.createdAt || '').slice(0, 10), comments: p.numberOfComments ?? '', found_at: TODAY,
    }));
}

const PIPELINES = { agencies, bloggers, creators, safari, intent };
const ALL = ['agencies', 'bloggers', 'creators'];

async function main() {
  const o = args(process.argv.slice(2));
  const types = o.cmd === 'all' ? ALL : [o.cmd];
  if (!types.every((t) => PIPELINES[t])) {
    console.log('Gebruik: node tools/leads/leads.mjs <agencies|bloggers|creators|safari|intent|all> [--market nl|de,gb|all] [--limit 30] [--budget 0.5] [--city Utrecht] [--minFollowers 1000] [--since year|month|week]');
    process.exit(1);
  }
  const isIntent = o.cmd === 'intent';
  const markets = isIntent ? [{ id: 'en', name: 'Engelstalig (Reddit)' }] : pickMarkets(o.market);
  const before = await monthlyCredit();
  console.log(`Apify-tegoed deze maand: $${before.used.toFixed(2)} van $${before.max.toFixed(2)} gebruikt. Max per run: $${o.budget}.`);

  const found = [];
  for (const m of markets) {
    for (const t of types) {
      console.log(`\n${t} · ${m.name}`);
      try {
        const rows = await PIPELINES[t](m, o);
        console.log(`  → ${rows.length} ${isIntent ? 'topics' : 'leads'}`);
        found.push(...rows);
      } catch (err) {
        console.error(`  ✗ ${err.message}`);
      }
    }
  }

  const master = isIntent ? { name: 'intent.csv', columns: INTENT_COLUMNS, keys: intentKeys } : {};
  const { file, fresh, total } = mergeIntoMaster(OUT_DIR, found, master);
  const runFile = path.join(OUT_DIR, `${TODAY}-${o.cmd}-${markets.map((m) => m.id).join('-')}.csv`);
  if (fresh.length) writeFileSync(runFile, toCsv(fresh, master.columns));
  const extra = isIntent ? '' : ` (${fresh.filter((l) => l.email).length} met e-mail)`;
  console.log(`\nKlaar: ${found.length} gevonden, ${fresh.length} nieuw${extra}. Kosten: $${spent.usd.toFixed(3)}.`);
  if (fresh.length) console.log(`Nieuw: ${path.relative(ROOT, runFile)}`);
  console.log(`Alles: ${path.relative(ROOT, file)} (${total} ${isIntent ? 'topics' : 'leads'})`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
