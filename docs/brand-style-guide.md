# Your Tanzania Trip — Brand Style Guide (text reference)

Source of truth: `docs/brand-style-guide.pdf` (Version 1.0, October 2026). This file is a faithful text transcription for use while building; if the two ever differ, the PDF wins. Logo files: `public/brand/`. Machine-readable tokens: `docs/brand-tokens.json`.

---

## 01 · About the brand

Your Tanzania Trip is a personal travel brand for safaris, Kilimanjaro climbs and Zanzibar stays in Tanzania. Every trip is designed around the traveller, with a named local partner, **Kilimanjaro Nature Tours** in Arusha, which runs the trips on the ground. The identity is warm, calm and trustworthy: acacia green, burnt copper and sunset gold on savanna sand and ivory, set in elegant capital lettering.

Brand values:
- **Personal** — speak to one traveller. "Your trip" is the promise: "you"/"your" in English, "je"/"jouw" in Dutch.
- **Honest** — say who does what, what is included and what a price covers. Never show ratings or awards that are not ours or our named partner's.
- **Calm** — generous space, soft colour and short sentences. Planning a trip should feel easy.
- **Rooted in Tanzania** — real places, people and routes. Photos and words come from trips we actually offer.

Note from the guide: colours were measured digitally from the logo files (close approximations of the artwork). Fonts and sizes are the chosen brand system. Nothing in the guide is taken from another company's brand.

## 02 · Logo

An acacia tree and Kilimanjaro with a setting sun above the wordmark **YOUR TANZANIA TRIP**; a thin line with a small Africa symbol beneath it.

| Version | Look | Use | File |
| --- | --- | --- | --- |
| Primary | Dark lettering, TANZANIA in copper | Ivory, white and light photos. **Header logo.** | `public/brand/logo-primary.png` (1888×732), `logo-primary-600.png` |
| Reversed | Ivory lettering, TANZANIA in gold | Forest, Mountain and dark photos. **Footer logo.** | `public/brand/logo-reversed.png` (1913×722), `logo-reversed-600.png` |

Clear space and size:
- Clear space on every side ≥ the height of the capital letters in the wordmark.
- Minimum width 160px on screen, 40mm in print. Below that, use the round icon.
- Website header: logo height ~56–64px desktop, 44px mobile.
- Alt text: "Your Tanzania Trip".

Do: use the supplied files only, at original proportions; primary on light, reversed on dark; place on calm photo areas or a solid Ivory or Forest band.

Don't: stretch or squash · recolour · put the primary logo on dark · rotate · add shadows or effects · place on busy backgrounds.

Partner logos: never place our logo next to, or merged with, the Kilimanjaro Nature Tours logo as if they were one brand. Partner logos appear only in the partner section and only with written permission.

## 03 · Icon, favicon and social

The round icon shows the same landscape in a gold ring; use it wherever the full logo would be too small.

| Use | File | Size |
| --- | --- | --- |
| Browser tab | `favicon.ico`, `favicon-32.png`, `favicon-16.png` | 16, 32, 48 px |
| iPhone home screen | `apple-touch-icon.png` | 180 px |
| Android / web app | `icon-192.png`, `icon-512.png` | 192, 512 px |
| Social profile pictures | `icon.png` | 1092 px |
| Link previews (Open Graph) | `og-image.jpg` (reversed logo on Forest) | 1200 × 630 px |

## 04 · Colour palette

| Name | Role | HEX | RGB | Use |
| --- | --- | --- | --- | --- |
| Forest | Primary | `#20281B` | 32, 40, 27 | Headings, body text, header and footer backgrounds. (Logo lettering itself is near-black `#000800`.) |
| Copper | Action | `#A83800` | 168, 56, 0 | Primary buttons, links, the word TANZANIA in the logo |
| Sunset Gold | Highlight | `#E69016` | 230, 144, 22 | Highlights, icons, badges, reversed logo lettering. Use with dark text or on dark backgrounds |
| Mountain | Secondary | `#355248` | 53, 82, 72 | Calm section backgrounds, secondary headings, panels |
| Savanna Sand | Neutral | `#DCC496` | 220, 196, 150 | Borders, dividers, soft panels |
| Ivory | Base | `#FAF6EC` | 250, 246, 236 | Page background |

Supporting colours:

| Name | HEX | RGB | Use |
| --- | --- | --- | --- |
| Copper Dark | `#8C2F00` | 140, 47, 0 | Hover and active state of buttons and links |
| Amber | `#FCAB2A` | 252, 171, 42 | Light end of sunset gradients only |
| White | `#FFFFFF` | 255, 255, 255 | Cards and form fields |

## 05 · Colour use and contrast

Proportions (roughly): Ivory 55% · Forest 20% · Sand 10% · Mountain 7% · Copper 5% · Gold 3%. Copper and gold are accents.

Rules:
- Forest for headings and body text; Ivory for page backgrounds.
- Copper for buttons and links only. **One copper primary button per screen.**
- Gold for highlights, icons and accents on dark backgrounds; with dark text when it is a background.
- Keep greens dark and muted, as in the logo. **Never bright olive green or mustard yellow.**
- Sunset gradients (Amber → Gold → Copper) only as decoration: dividers, image overlays, the call-to-action band.

Measured contrast (WCAG 2.1 AA needs 4.5:1 for normal text):

| Pair | Ratio | |
| --- | --- | --- |
| Forest on Ivory | 14.1:1 | AA ✓ |
| Mountain on Ivory | 7.9:1 | AA ✓ |
| Ivory on Forest | 13.9:1 | AA ✓ |
| Forest on Sand | 9.0:1 | AA ✓ |
| Copper on Ivory | 6.0:1 | AA ✓ |
| Ivory on Copper | 6.0:1 | AA ✓ |
| Gold on Forest | 6.1:1 | AA ✓ |
| Copper on Sand | 3.8:1 | **too low** — never small copper text on Sand; use Forest |

## 06 · Typography

Headlines: **Marcellus** (light, elegant capitals with a slightly flared stroke, echoing the logo). Body and interface: **Inter**. Both free Google Fonts. Fallbacks: Georgia (headings) and Arial (body).

| Level | Font | Size | Example |
| --- | --- | --- | --- |
| Display | Marcellus | 56px / 42pt | Jouw reis door Tanzania |
| Heading 1 | Marcellus | 40px / 30pt | Populaire safari's |
| Heading 2 | Marcellus | 28px / 21pt | Serengeti & Ngorongoro, 7 dagen |
| Heading 3 | Inter SemiBold | 20px / 15pt | Wat is inbegrepen |
| Body | Inter Regular | 17px / 12.75pt, line height 1.6 | We stellen je reis samen met onze lokale partner in Arusha. |
| Small / caption | Inter Regular | 13px / 9.75pt | Prijs per persoon, gebaseerd op 2 reizigers. |
| Label / navigation | Inter SemiBold | 12–13px, capitals, 0.15em tracking | REIZEN · SAFARI'S · KILIMANJARO · ZANZIBAR |

Headlines use sentence case. Capitals only for small labels and navigation, as in the logo. Minimum body size 16px. No heavy condensed all-caps headings.

## 07 · Tone of voice

Warm, concrete and honest: a knowledgeable friend who has been there. Plain language, short sentences, real details, no hype. Personal · Honest · Calm · Concrete.

English — prefer / avoid:
- Prefer concrete details (park names, number of days, what is included) — avoid superlatives ("the best", "once in a lifetime").
- Prefer "your trip", "we will plan it with you", "free quote, no obligation" — avoid "customers", "packages", pressure ("only 2 left").
- Prefer naming our partner and what they do — avoid presenting partner ratings or awards as our own.
- Prefer action-led buttons ("Get my free quote") — avoid long or vague button labels.
- Prefer consistent terms (trip, itinerary, quote) — avoid changing names for the same thing.

Dutch — always "je", never "u":

| Wel | Niet |
| --- | --- |
| "Vraag je gratis offerte aan" | "Gelieve een offerte aan te vragen" |
| "We stellen je reis samen" | "U wordt door ons bediend" |
| "Jouw reis door Tanzania" | "De klant ontvangt het programma" |
| "Gratis en vrijblijvend" | "Boek nu, op = op!" |

Standard terms:

| English | Dutch |
| --- | --- |
| trip | reis |
| itinerary | reisprogramma |
| quote | offerte |
| Plan your trip | Plan je reis |
| Price on request | Prijs op aanvraag |

## 08 · Components

Soft and calm: **8px corners on buttons and fields, 12px on cards**, a Sand border, subtle shadows and clearly visible focus states.

Buttons:

| Button | Style | Use |
| --- | --- | --- |
| Primary | Copper fill, Ivory text; hover Copper Dark | The single main action on a screen |
| Secondary | Ivory fill, Forest 1.5px outline | Alternative actions |
| On dark | Ivory outline and text | On Forest or photo backgrounds |

Form fields: labels stay visible above the field (small capitals label style). Focus state = Forest border plus a 2px Gold ring. Error messages are specific and sit below the field.

Trip cards: white card, Sand border, 12px radius, photo on top with a duration badge ("7 dagen"), title in Marcellus, one line of description, "Prijs op aanvraag" in Copper. Image zoom on hover (respect `prefers-reduced-motion`).

Badges: Gold fill for "Populair", Sand fill for duration, Mountain fill with ivory text for type (e.g. "Kilimanjaro"). Links: Copper, underlined. Icons: one outline set (e.g. Lucide) in Forest or Gold, 1.5px stroke.

## 09 · Website structure

Home page, top to bottom:

| Section | Content |
| --- | --- |
| Utility bar (thin, Forest) | NL/EN · EUR/USD · partner rating with source · WhatsApp · Praktische info |
| Header (Ivory, sticky) | Logo · Reizen (mega-menu) · Safari's · Kilimanjaro · Zanzibar · Ontdek Tanzania (mega-menu) · ♡ · search · Plan je reis |
| Hero | Large photo, dark gradient, Marcellus headline, trip planner card (adults, children, date), button "Start met plannen", microcopy "Gratis en vrijblijvend. We stellen je reis samen, zonder kosten of verplichtingen." |
| USP row (Sand, gold check icons) | 100% op maat · Lokale partner in Arusha · Gratis offerte · Persoonlijk contact · Wij regelen alles |
| Intro | Who we are and how we work with Kilimanjaro Nature Tours |
| Popular trips | Trip cards: photo, days, title, one line, price or "op aanvraag", ♡ |
| Reviews ("Wat reizigers zeggen") | Partner rating per source with date and link, plus real review cards (only from `data/reviews.json`; if empty, partner block + "Lees reviews op Tripadvisor") |
| Inspiration | Six tiles: Safari's, Kilimanjaro, Zanzibar, Nationale parken, Eilanden, Huwelijksreis |
| Call to action | Mountain or Forest with a sunset accent: "Laat ons jouw reis op maat maken" · "Vraag je gratis offerte aan" |
| Footer (Forest) | Reversed logo · columns Reizen, Bestemmingen, Over ons, Contact (email, phone, WhatsApp) · partner mention · newsletter · legal links · KvK and BTW · © Your Tanzania Trip |

Other pages: Reizen (overview with filters; detail with day-by-day programme, map, inclusions, FAQ, sticky quote card) · Bestemmingen (Serengeti, Ngorongoro, Tarangire, Lake Manyara, Great Migration, Kilimanjaro, Zanzibar) · Plan je reis (multi-step form with progress bar and thank-you page) · Onze partner · Reviews · Over ons · Contact · Praktische info (visa, health, safety, packing list, best time to visit, FAQ) · Blog · Wishlist · legal pages (terms, cancellation, privacy, cookies).

## 10 · Imagery and formats

Photography: warm natural light (golden hour, mountain views, real camps and lodges, real guides). **Only photos we own or have licensed; never photos from other travel sites.** Every image gets alt text. Prefer people experiencing the place over empty stock shots. No heavy filters. Text only on calm areas or on a dark gradient overlay (Forest at 60–70%).

Reviews and prices: reviews always per source, with date and a link; never invent, rewrite or embellish them. Prices only when confirmed by the partner; otherwise "Prijs op aanvraag" / "Price on request".

| Format | Guideline |
| --- | --- |
| Website | Ivory background, generous whitespace, WCAG AA contrast, keyboard navigation, visible focus |
| Social posts | 1080 × 1350 (feed), 1080 × 1920 (stories); logo or icon visible at phone size; one message per post |
| Email and quotes | Primary logo top left, value first, one copper call to action, personal sign-off from a named person |
| Print | Vector (SVG/PDF) redraw of the logo for large sizes; check colours on a proof |

## 11 · Company and contact details

| Item | Detail |
| --- | --- |
| Brand | Your Tanzania Trip · yourtanzaniatrip.com |
| Company and brand owner | Tijs Krops |
| Address | Sluitgatweg 10, 8308 RE Nagele, Netherlands |
| Chamber of Commerce (KvK) | 97223344 |
| VAT (BTW) | NL005256557B94 |
| Email | info@yourtanzaniatrip.com |
| Phone | +31 6 29351377 |
| WhatsApp | [FILL: confirm whether WhatsApp uses the same number] |
| Tagline | [FILL: owner picks one] — proposals: "Your trip, planned with care" · "Tanzania, tailor-made for you" · "Safari, summit and sea, your way" |
| Package-travel protection / insolvency cover / memberships (GGTO, ANVR, SGR) | [FILL] — claim none until confirmed |
| Local partner | Kilimanjaro Nature Tours, Arusha, Tanzania · kilimanjaronaturetours.com · run by Baraka Dalali · info@kilimanjaronaturetours.com · P.O. Box 611, USA River, Arusha |
| Partner credentials | TATO, TANAPA, Tanzania Tourist Board only with the partner's written permission. TALA licence number: [FILL] |

Approval of logo variants, colour changes and new brand uses goes through the brand owner.

## 12 · Quick reference

- Colours: Forest `#20281B` · Copper `#A83800` · Sunset Gold `#E69016` · Mountain `#355248` · Savanna Sand `#DCC496` · Ivory `#FAF6EC`
- Headlines: Marcellus · Body and UI: Inter Regular / SemiBold
- Primary button: Copper `#A83800`, Ivory text, 8px radius; hover `#8C2F00`
- Links: Copper, underlined
- Voice: Personal · Honest · Calm · Concrete. Dutch: "je"
- **Never:** bright olive or mustard, stretched or recoloured logos, borrowed ratings, invented reviews or prices

## Appendix A · Logo files

In this project: `public/brand/` (unzipped from `yourtanzaniatrip-logo-kit.zip`). Transparent files were prepared from the supplied artwork (black background removed from the reversed logo, edge fringing cleaned from the primary logo). For large print, have a designer make a vector redraw.

## Appendix B · Website build instructions (summary)

The PDF contains a full build prompt (version 2) for Claude Code. Key points, kept here so they are not lost:

- Goal: rebuild the site at localhost:3000 into the Your Tanzania Trip site, keeping the same page structure, user flow and level of polish, while making every piece of content and every visual detail our own (logo, colours, fonts, text, images, trips, reviews, links).
- Non-negotiable: nothing copied may remain from Tanzania Specialist / tanzania-specialist.com / Africa Safari Trips — not their text, images, logos, icons, badges, itineraries, trip names, prices, review scores/counts/quotes, outbound links, fonts (museo-sans, dk-liquid-embrace), colour values (olive `#465B2D`, brown `#3D1F17`, rust orange, mustard yellow), or exact markup/class names that mirror their site. Structure may be similar; expression must be our own.
- No borrowed ratings or awards; no invented facts (use `[FILL: …]`); be honest that Your Tanzania Trip is the contracting party and KNT runs the trips.
- Stack: Next.js App Router, TypeScript, Tailwind with the tokens above, `/nl` and `/en` with hreflang, canonical URLs, language switch that keeps the current page, `next/font/google`, `next/image` everywhere, sitemap, robots, Open Graph (default `og-image.jpg`), manifest with the icons, zod-validated forms with honeypot, email behind env variables, `.env.example`, WhatsApp click-to-chat, cookie banner that blocks analytics until consent, WCAG AA, Lighthouse 90+ desktop, responsive to 360px.
- Structured data allowed: Organization (our company details), WebSite, TouristTrip, BreadcrumbList, FAQPage. **Never AggregateRating or Review markup from the partner's ratings.**
- Prices: only partner figures in `data/prices.json`; otherwise "Prijs op aanvraag" with a quote button. Currencies EUR (default) and USD in the utility bar.
- Guardrails: `npm run audit:brand` fails on `tanzania-specialist`, `Tanzania Specialist`, `africasafaritrips`, `Africa Safari Trips`, `museo-sans`, `dk-liquid-embrace`, `5247`, `1689`, `Travellers' Choice 2026`, `465B2D` in `src`, `public`, `data` or `messages`. `npm run audit:release` also fails on any `[FILL` — expected until the owner supplies the facts; never resolved by inventing content.
- Phases: 1 Audit · 2 Foundation · 3 Remove · 4 Home page (ten sections) · 5 Trips and destinations · 6 Plan je reis and contact · 7 Partner, reviews, practical info, blog, about, legal · 8 SEO, performance and accessibility · 9 Guardrails and checks · 10 Handover (README, TODO-OWNER incl. package-travel rules, insolvency cover, US seller-of-travel registration).
