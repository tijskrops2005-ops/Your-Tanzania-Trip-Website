#!/usr/bin/env node
// Business lead finder for Your Tanzania Trip (B2B only: travel agencies, travel bloggers, travel creators).
//
//   node tools/leads/leads.mjs <agencies|bloggers|creators|all> [--market nl|de,gb|all] [--limit 30] [--budget 0.5] [--city Utrecht] [--minFollowers 1000]
//
// Every Apify run is capped at --budget USD. New leads go to leads/<date>-<type>-<markets>.csv and are
// merged into leads/leads.csv (de-duplicated; your status column there is kept).
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, runActor, spent, monthlyCredit } from './apify.mjs';
import { toCsv, mergeIntoMaster, domainOf } from './csv.mjs';
import { pickMarkets } from './markets.mjs';

const OUT_DIR = path.join(ROOT, 'leads');
const TODAY = new Date().toISOString().slice(0, 10);

const TRAVEL_CATEGORY = /travel|tour|reis|reise|rese|rejse|voyage|viaje|viagg|safari/i;
const TRAVEL_BUSINESS = /travel (company|agency|agent)|tour (agency|operator|guide)|reisbureau|reiseb(ü|u)ro/i;
const TOUR_SITE = /tour|safari|travel|reizen|reisbureau|reiseb(ü|u)ro|voyages|viajes|viaggi|resor|rejser/i;
const TRAVEL_BIO = /travel|trip|reis|reise|rese|rejse|voyage|viaje|viagg|wander|explor|safari|africa|afrika|afrique|nomad|backpack|world|wereld|welt|✈|🌍|🌎|🌏|🧳/i;
const BAD_EMAIL = /example\.|sentry|wixpress|wix\.com|domain\.(com|nl)|email\.com|yourname|your-?email|noreply|no-reply|privacy@|gdpr@|abuse@|datenschutz|meldestelle|dsa\.|\.(png|jpe?g|webp|gif|svg)$/i;
const EMAIL_IN_TEXT = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// Big platforms, media and chains that show up in search results but are not blogger leads.
const SKIP_DOMAINS = /(^|\.)(tripadvisor|booking|expedia|lonelyplanet|wikipedia|wikitravel|wikivoyage|youtube|instagram|facebook|pinterest|reddit|tiktok|twitter|x|linkedin|amazon|google|safaribookings|viator|getyourguide|airbnb|hotels|trivago|skyscanner|kayak|tui|anwb|sunweb|corendon|kras|cnn|bbc|nytimes|theguardian|telegraph|independent|forbes|nationalgeographic|natgeo|cntraveler|travelandleisure|timeout|msn|yahoo|medium|quora|yourtanzaniatrip|kilimanjaronaturetours|tanzania-specialist)\.[a-z.]+$|\.gov(\.[a-z]+)?$/i;

function args(argv) {
  const o = { cmd: argv[0], market: 'nl', limit: 30, budget: 0.5, city: '', minFollowers: 1000 };
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

const PIPELINES = { agencies, bloggers, creators };

async function main() {
  const o = args(process.argv.slice(2));
  const types = o.cmd === 'all' ? Object.keys(PIPELINES) : [o.cmd];
  if (!types.every((t) => PIPELINES[t])) {
    console.log('Gebruik: node tools/leads/leads.mjs <agencies|bloggers|creators|all> [--market nl|de,gb|all] [--limit 30] [--budget 0.5] [--city Utrecht]');
    process.exit(1);
  }
  const markets = pickMarkets(o.market);
  const before = await monthlyCredit();
  console.log(`Apify-tegoed deze maand: $${before.used.toFixed(2)} van $${before.max.toFixed(2)} gebruikt. Max per run: $${o.budget}.`);

  const found = [];
  for (const m of markets) {
    for (const t of types) {
      console.log(`\n${t} · ${m.name}`);
      try {
        const rows = await PIPELINES[t](m, o);
        console.log(`  → ${rows.length} leads`);
        found.push(...rows);
      } catch (err) {
        console.error(`  ✗ ${err.message}`);
      }
    }
  }

  const { file, fresh, total } = mergeIntoMaster(OUT_DIR, found);
  const runFile = path.join(OUT_DIR, `${TODAY}-${o.cmd}-${markets.map((m) => m.id).join('-')}.csv`);
  if (fresh.length) writeFileSync(runFile, toCsv(fresh));
  const withEmail = fresh.filter((l) => l.email).length;
  console.log(`\nKlaar: ${found.length} gevonden, ${fresh.length} nieuw (${withEmail} met e-mail). Kosten: $${spent.usd.toFixed(3)}.`);
  if (fresh.length) console.log(`Nieuw: ${path.relative(ROOT, runFile)}`);
  console.log(`Alles: ${path.relative(ROOT, file)} (${total} leads)`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
