// Own content for the pages that are written from scratch: content/own/<slug>.json.
// scripts/rebrand.mjs applies it after the paraphrases (content/rewrites) and takes the title,
// meta description and JSON-LD (FAQPage, TouristTrip) from the same file, so the visible text and
// the structured data can never drift apart.
//
// A file can hold:
//   title, description          page <title> and meta description (also used for og:*)
//   h1                          text of every <h1> on the page
//   replace: [{selector, html|text, index?}]   inner HTML/text of the matched elements
//   remove:  [selector]
//   before/after: [{selector, html}]           insert HTML around the first match
//   alts:    [{match, alt}]     alt text for every <img> whose src contains `match`
//   faq:     {heading?, headingTag?, at?, mode?, items:[{q, a}]}
//            FAQ block in the theme's accordion markup; `at` is the element it replaces
//            (mode "replace", default), or is appended to / inserted after (mode "append"/"after").
//            Trip pages replace their existing FAQ accordion when `at` is omitted.
//   trip:    {intro:[html], why:{heading, items:[html]}, heroNote, priceNote,
//             cta:{heading, text, button}, days:[{title?, html?}], schema:{...}}
//            trip-page sections (hero footnote, intro, "why this trip", price footnote,
//            request block, day descriptions) and the facts for the TouristTrip schema.
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "content/own");
const SITE = "https://yourtanzaniatrip.com";
const BRAND = "Your Tanzania Trip";

export const ownSlugs = () => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort() : []);

export function loadOwn(slug) {
  const file = path.join(dir, slug + ".json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

// htmlparser2 keeps entities and attribute values as they are; the third argument keeps fragments.
const load = (html) => cheerio.load(html, { xml: { xmlMode: false, decodeEntities: false } }, false);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (html) => load(String(html)).root().text().replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "’").replace(/\s+/g, " ").trim();

// Day titles and headings found while applying, for the schema built later in rebrand.mjs.
const derived = new Map();

function faqHtml(faq) {
  const items = faq.items
    .map(
      (it, i) => `<div x-data="{ open: false }">
<h3 class="faq-question-heading">
<button type="button" class="flex justify-between items-center px-5 py-3 w-full text-left md:py-4" :class="{ 'bg-sand': open }" aria-controls="faq-answer-${i + 1}" @click="open = !open" aria-expanded="false" x-bind:aria-expanded="open.toString()">
<span class="tracking-wider leading-6 text-md text-brown lg:text-lg" :class="{ 'font-bold': open }">${esc(it.q)}</span>
<span class="flex items-center ml-6 h-8 text-green"><svg class="hidden w-8 h-8" :class="{ 'hidden': open }" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6"/></svg><svg class="w-8 h-8" :class="{ 'hidden': !(open) }" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6"/></svg></span>
</button>
</h3>
<div id="faq-answer-${i + 1}" class="flex bg-sand-light py-6 pr-5 pl-6 text-brown tracking-wider faq-content" x-show="open" style="display: none">
<div class="text-base md:text-lg !leading-relaxed not-prose">${it.a}</div>
</div>
</div>`
    )
    .join("\n");
  const tag = faq.headingTag || "h3";
  const heading = faq.heading ? `<${tag}>${esc(faq.heading)}</${tag}>\n` : "";
  const block = `${heading}<div class="mx-auto max-w-4xl faq-wrapper own-faq"><div class="-mx-5 mt-10 md:mx-0 border-y border-green"><div class="divide-y divide-green">\n${items}\n</div></div></div>`;
  return faq.wrapClass ? `<div class="${esc(faq.wrapClass)}">${block}</div>` : block;
}

function applyFaq($, own) {
  const block = faqHtml(own.faq);
  const mode = own.faq.mode || "replace";
  let at = own.faq.at ? $(own.faq.at).first() : $("div.ts-prose").first().children(".faq-wrapper").first();
  if (!at.length) at = $("div.ts-prose").first();
  if (mode === "append" || (!own.faq.at && !at.hasClass("faq-wrapper"))) at.append(block);
  else if (mode === "after") at.after(block);
  else at.replaceWith(block);
}

function applyTrip($, trip, slug) {
  const prose = $("div.ts-prose").first();
  if (trip.intro) {
    prose.children("p").remove();
    const h2 = prose.children("h2").first();
    if (h2.length) h2.after(trip.intro.join("\n"));
    else prose.prepend(trip.intro.join("\n"));
  }
  if (trip.why) {
    const why = `<h3>${esc(trip.why.heading)}</h3>\n<ul>\n${trip.why.items.map((i) => `<li>${i}</li>`).join("\n")}\n</ul>`;
    const faq = prose.children(".faq-wrapper").first();
    if (faq.length) faq.before(why);
    else prose.append(why);
  }
  if (trip.heroNote) $("[class*=ts-jumbotron-content] p").first().html(trip.heroNote);
  if (trip.priceNote) $("p").filter((i, e) => /Indicative costs per person/.test($(e).text())).html(trip.priceNote);
  if (trip.cta) {
    $("div[class*=call-to-action]").each((i, el) => {
      const cta = $(el);
      if (trip.cta.heading) cta.find("h2").first().text(trip.cta.heading);
      if (trip.cta.text) cta.find("p").first().html(trip.cta.text);
      if (trip.cta.button) cta.find("a[class*=btn]").first().text(trip.cta.button);
    });
  }
  const renamed = new Map();
  if (trip.days) {
    const labels = [];
    $("div[class*=timeline-item]").each((i, el) => {
      const item = $(el);
      const label = item.find("h4").first().text().replace(/\s+/g, " ").trim();
      if (!labels.includes(label)) labels.push(label);
      const day = trip.days[labels.indexOf(label)];
      if (!day) return;
      if (day.title) {
        const span = item.find("h2 span").first();
        const old = span.text().replace(/\s+/g, " ").trim();
        span.text(day.title);
        renamed.set(old, day.title);
        item.find("figcaption").each((j, f) => {
          if ($(f).text().replace(/\s+/g, " ").trim() === old) $(f).text(day.title);
        });
        item.find("img").each((j, im) => {
          if (($(im).attr("alt") || "").trim() === old) $(im).attr("alt", day.title);
        });
      }
      if (day.html) {
        const body = item.find('[class*="prose-p:text-anthracite"]').first();
        if (!body.length) return;
        body.children("p").remove();
        body.prepend(day.html);
      }
    });
    // The day list in the sidebar repeats the titles.
    $("li").each((i, li) => {
      const el = $(li);
      const strong = el.children("strong").first();
      if (!strong.length) return;
      const title = el.contents().filter((j, n) => n.type === "text").text().replace(/\s+/g, " ").trim();
      if (renamed.has(title)) el.html(`${$.html(strong)} ${esc(renamed.get(title))}`);
    });
  }
  const dayTitles = [];
  $("div[class*=timeline-item] h2 span").each((i, e) => {
    const t = $(e).text().replace(/\s+/g, " ").trim();
    if (!dayTitles.includes(t)) dayTitles.push(t);
  });
  derived.set(slug, { dayTitles });
}

function applyGeneric($, own) {
  if (own.h1) $("h1").text(own.h1);
  for (const r of own.replace || []) {
    const els = r.index == null ? $(r.selector) : $(r.selector).eq(r.index);
    if (!els.length) console.warn(`own-content: no match for ${r.selector}`);
    if (r.tail) {
      // Replace only the text after the element's children (icon + label items).
      els.each((i, el) => {
        $(el).contents().filter((j, n) => n.type === "text").remove();
        $(el).append(" " + esc(r.text));
      });
    } else if (r.html != null) {
      els.each((i, el) => {
        // keepImages: the block's images and figures survive the rewrite (appended after the new text,
        // or put where the new html says "<!--IMG-->").
        const kept = r.keepImages ? $(el).find("figure, img").filter((j, k) => !$(k).parents("figure").length).map((j, k) => $.html(k)).get() : [];
        let html = r.html;
        for (const k of kept) html = html.includes("<!--IMG-->") ? html.replace("<!--IMG-->", k) : html + "\n" + k;
        $(el).html(html);
      });
    } else if (r.text != null) els.text(r.text);
  }
  for (const sel of own.remove || []) $(sel).remove();
  // retag: change the element name (a second <h1> becomes an <h2>)
  for (const r of own.retag || []) $(r.selector).each((i, el) => { el.name = r.tag; el.tagName = r.tag; });
  for (const r of own.before || []) $(r.selector).first().before(r.html);
  for (const r of own.after || []) $(r.selector).first().after(r.html);
  for (const a of own.alts || []) {
    $("img").each((i, im) => {
      const src = ($(im).attr("src") || "") + " " + ($(im).attr("data-lazy-src") || "");
      if (src.includes(a.match)) $(im).attr("alt", a.alt);
    });
  }
}

/** Applies content/own/<slug>.json to a page body; returns the html unchanged when there is none. */
export function applyOwnContent(slug, html) {
  let own = loadOwn(slug);
  // The tabs of a trip (/itinerary/, /prices/, ...) repeat its hero and, on /itinerary/, the day programme.
  if (!own && slug.startsWith("itineraries__") && slug.split("__").length === 3) {
    const parent = loadOwn(slug.replace(/__[^_]+$/, ""));
    if (parent?.trip) own = { h1: parent.h1, trip: { days: parent.trip.days, heroNote: parent.trip.heroNote } };
  }
  if (!own) return html;
  const $ = load(html);
  applyGeneric($, own);
  if (own.trip) applyTrip($, own.trip, slug);
  if (own.faq) applyFaq($, own);
  return $.html();
}

function faqLd(faq, url) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: faq.items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: plain(it.a) },
    })),
  };
}

function tripLd(own, slug, pagePath) {
  const s = own.trip.schema || {};
  const url = SITE + pagePath;
  const days = s.days || derived.get(slug)?.dayTitles || [];
  const ld = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: s.name || own.h1 || own.title,
    description: s.description || own.description,
    url,
    touristType: s.touristType || ["Couples", "Honeymooners", "Families", "Groups of friends", "Solo travellers"],
    provider: { "@type": "Organization", name: BRAND, url: `${SITE}/` },
    itinerary: {
      "@type": "ItemList",
      numberOfItems: days.length,
      itemListElement: days.map((name, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "TouristDestination", name } })),
    },
  };
  if (s.price) {
    ld.offers = {
      "@type": "Offer",
      price: String(s.price),
      priceCurrency: s.currency || "USD",
      availability: "https://schema.org/InStock",
      url,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: String(s.price),
        priceCurrency: s.currency || "USD",
        unitText: "per person",
        description: s.priceNote || "Per person, based on 6 travellers, low season, excluding international flights",
      },
    };
  }
  return ld;
}

/** The questions and answers of an existing accordion on the page (.faq-question-heading + .faq-content). */
function faqOnPage(slug) {
  const file = path.join(root, "content/pages", slug + ".html");
  if (!fs.existsSync(file)) return [];
  const $ = load(fs.readFileSync(file, "utf8"));
  const items = [];
  $(".faq-question-heading").each((i, h) => {
    const q = $(h).text().replace(/\s+/g, " ").trim();
    const a = $(h).nextAll(".faq-content").first();
    if (q && a.length) items.push({ q, a: a.html() });
  });
  return items;
}

/** Title, description and JSON-LD for pages.json; null when the page has no own content. */
export function ownMeta(slug, pagePath) {
  const own = loadOwn(slug);
  if (!own) return null;
  const url = SITE + pagePath;
  const ldJson = [];
  if (own.faq) ldJson.push(JSON.stringify(faqLd(own.faq, url)));
  // faqFromPage: FAQPage schema from the accordion that is already on the page, word for word.
  if (own.faqFromPage) {
    const items = faqOnPage(slug);
    if (items.length) ldJson.push(JSON.stringify(faqLd({ items }, url)));
    else console.warn(`own-content: no FAQ accordion found on ${slug}`);
  }
  if (own.trip) ldJson.push(JSON.stringify(tripLd(own, slug, pagePath)));
  for (const extra of own.ldJson || []) ldJson.push(JSON.stringify(extra));
  return { title: own.title, description: own.description, ogTitle: own.ogTitle, ogDescription: own.ogDescription, ldJson };
}
