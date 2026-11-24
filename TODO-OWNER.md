# TODO-OWNER — Your Tanzania Trip

Status: 2026-10-27. Everything the site needs is filled in; there are no placeholders left on the site. Live at https://www.yourtanzaniatrip.com (Vercel, deploys from GitHub `main`).

## Three things only you can do

- [ ] **Activate the form delivery (one click).** The forms (travel proposal, contact, newsletter, quiz) send to bookings@yourtanzaniatrip.com through FormSubmit (since 2026-11-16). The first submission on the live site triggers a one-time e-mail from FormSubmit ("Confirm your e-mail") to that address; click the button in it once. Until then the visitor's own e-mail app opens with the request as fallback, so nothing is lost.
- [ ] **Make sure bookings@yourtanzaniatrip.com receives mail** (mailbox or forwarding at your domain host). The first form submission after the push sends a FormSubmit activation e-mail there; click it once.
- [ ] **www or not (Vercel, one click).** Vercel serves `www.yourtanzaniatrip.com` as the main address while the pages declare `https://yourtanzaniatrip.com` as canonical. In Vercel → Domains → Edit `www.yourtanzaniatrip.com` → redirect to `yourtanzaniatrip.com` (308). Or say so and I switch the canonical to www instead.

## Keep up to date (every few months)

- [ ] **Tripadvisor score** of Kilimanjaro Nature Tours: `partner.tripadvisor` (score, count, awards, checkedOn) in `docs/brand-tokens.json`. Shown in the header, footer, home page, reviews page and `/our-partner/` with the date it was checked.
- [ ] **Photos of yourself/Edrian**: optional. The site now shows Baraka and his crew (from the Kilimanjaro Nature Tours site) where the old consultant photos were. If you want your own portrait in the hero form and "Call an expert", give me a square photo.

## Decided and done (for reference)

- Company facts: Tijs Krops (trading as Your Tanzania Trip), Sluitgatweg 10, 8308 RE Nagele, KvK 97223344, BTW NL005256557B94, Knab IBAN NL74 KNAB 0776 8630 37 / BIC KNABNL2H, phone + WhatsApp +31 6 29351377, co-founder Edrian Waterman. No travel guarantee fund; the Guarantees, About, Terms and Easy-payments pages say so plainly and describe what is guaranteed instead.
- Partner: Kilimanjaro Nature Tours, Arusha, Baraka Dalali. Tripadvisor 5.0 (208 reviews, Travellers' Choice 2023 and 2024, checked 27 October 2026), Google profile link, three Google review quotes, badges (TATO, TANAPA, TTB), crew and founder story, one YouTube clip from their channel. Material from kilimanjaronaturetours.com (your own production).
- Removed from the old site: founders, staff posts, awards, SGR/ANVR/Travelife/KRTO claims, sister company, Facebook/SafariBookings links of the old operator.
- Photos and videos: every hero image on the site was checked. Photos showing the old logo on jeeps, or the old team, were replaced in place by logo-free photos (`scripts/clean-photos.py`, originals in `.cache/photos-original/`). The six hero videos of the old operator were replaced by our own 20-second slow-pan loop made from the partner's photos (`public/brand/video/safari-loop.mp4`). The Kilimanjaro Nature Tours YouTube clip is embedded on `/our-partner/`. If you ever shoot your own footage, drop the file in `public/brand/video/` and tell me.
- Kept as product: Hakuna Matata Package. (The Academy page was removed on 2026-11-16: it is the previous operator's project.)

## Done on 2026-11-16 (site audit + planner)

- **Plan my Trip on the homepage:** a four-step planner in the hero (what, how long, when, who). It passes the answers to `/travel-proposal/`, which fills them in (`public/assets/js/planner.js`). Bottom-of-page buttons and every new blog post link to it.
- **Honesty fixes:** the Hakuna Matata Academy page and menu item are gone (301 to Responsible Travel), because the academy belongs to the previous operator. Tree planting, street-kids training, the dispensary donation, "our own office in Tanzania", "nearly ten years of experience", "best price guarantee", "proposal within 24 hours", our "international team", "our guides", "we inspect every lodge" and "read our reviews" were rewritten to what is true now (`src/lib/fixes.js`). FAQ schema follows the same answers.
- **Errors fixed:** the wrong office address (Soctratesstraat) and "Rabobank" in the payment FAQ (the account is at Knab); the dead "Our Experts" link on all 800 pages; 14 other dead links; 15 pages with zero or two H1s; 250+ missing or duplicate titles and descriptions on itinerary tabs; invisible text (top bar, newsletter heading, price tables, form links); the old orange and copper colours in the forms, sliders and checkboxes; the `[INVULLEN: e-mail]` placeholder in the footer of every page; off-topic stock photos (zoo animals, desert tents, leopard print, Madagascar baobabs) taken out of the photo pool.
- **Checks you can rerun:** `node scripts/audit-site.mjs` (links, images, markers, titles) and `node scripts/contrast-probe.mjs 1440 /path/` (unreadable text) after `npm run build` and `node serve.mjs`.

- **2026-11-16, later:** homepage hero rebuilt after the Tanzania Specialist pattern (photo with a planner card: trip, arrival date, length, adults, children); "Start exploring" destination tiles; the zoomed safari loop under "A glimpse of Tanzania" replaced by a YouTube film (loads only after a click, credited under the player). Every form now sends the visitor an automatic thank-you e-mail through FormSubmit (`_autoresponse` in `public/assets/js/forms.js`).

## Still open (needs you)

- [ ] **About us:** start year, a photo and 2–3 sentences about Tijs (`[INVULLEN]` markers on `/about-us/`).
- [ ] **Blog depth:** 243 of the 250 new posts are under 300 words (average 159). Google can treat that as thin content. Ask me to expand them in batches (around 500–800 words each, with facts and internal links).
- [ ] **Reply time:** we removed "within 24 hours". If you can promise a reply time, tell me and it goes back in everywhere.

## Done on 2026-10-28

- **Unique texts:** all 162 informative pages (80 blogs, 32 destinations, islands, practical information, FAQs, theme pages) were paraphrased block by block: same facts, structure and links, new wording. Source: `content/rewrites/<slug>.json`, applied by `scripts/rebrand.mjs`. A few source typos were corrected on the way ("pole pole" = "slowly, slowly", "Habari").
- **Old logo in images:** every image on the site (2,553) was scanned with Apple Vision text recognition. Route maps, the migration map and infographics now carry the Your Tanzania Trip logo; small stickers on jeep doors were painted out; photos with large logos (spare-wheel covers, a branded bottle) were swapped for logo-free photos; the Hakuna Matata cards and the "Four reasons" flyer were re-rendered with true text.
- **Removed:** Instagram "social feed" blocks, the old operator's park videos, Drive links, the "Africa Safari App" page, insurance affiliate codes, the sister-company and two-offices claims.
- **Fixed:** site search (now our own index instead of the old Algolia one), sorting on trip overviews (price and duration), partner block (larger text, portrait fully visible).

- **Payments:** the old 25%-deposit / 120-days rule is gone everywhere; the site now says: a deposit on confirmation and the balance before departure, amounts on your proposal. The "No big payments" card is now "Clear payments".
- **Currency switch** (top bar and form box) converts all prices to EUR or GBP with the day's ECB rate (frankfurter.app); the choice is remembered. You still invoice in your own currency.
- **Language switch:** English plus automatic translation (Google Translate) into Dutch, German, French, Spanish and Italian. Machine translation may use the formal "u" in Dutch; for a fully hand-written Dutch site, ask for an /nl/ version.
- **Errors:** a check over 34 page types reports no JavaScript errors, failed requests or 404s (`node scripts/console-check.mjs`).

## Technical

- Build and view: `npx astro build`, then `node serve.mjs` → http://localhost:3000.
- Rebrand after changing tokens or rules: `npm run rebrand` (= extract → `scripts/rebrand.mjs` → `scripts/brand-theme.mjs`), then build. Publish: `git add -A && git commit && git push` (Vercel deploys `main`).
- Images (only needed again after a fresh `npm run sync`): `npm run images` (= `scripts/clean-photos.py` → `scripts/debrand.py` → `scripts/render-cards.mjs`; macOS, uses Apple Vision via `scripts/ocr-boxes.js`). Untouched originals are in `.cache/photos-original/`.
- New paraphrases: `node scripts/rewrite-extract.mjs` lists the text blocks per page in `.cache/rewrite-src/`; rewritten blocks go in `content/rewrites/<slug>.json`.
- Colours and fonts: `scripts/brand-theme.mjs` (from `.cache/theme-original/`) plus `src/styles/brand.css`. Content, header, footer, partner pages, image swaps and removals: `scripts/rebrand.mjs`. Forms: `public/assets/js/forms.js`. Practical-information tabs are regenerated from the pages (`public/ajax/fetch_post_content/`).
- Compare with the example site: `node scripts/compare.mjs / /blog/ …` → `temporary screenshots/compare/`.
- Known, pre-existing broken links from the source site (12 missing uploads / old park URLs): `node scripts/check-links.mjs`.

## Done on 2026-11-23 (website polish brief)

- **WhatsApp +31 6 12729607** everywhere (wa.me/31612729607): header and sidebar buttons, homepage, contact page, footer, mobile menu, confirmation e-mails, llms.txt. One setting: `company.whatsapp` in `docs/brand-tokens.json`. The phone line stays +31 6 29351377 (see question below).
- **Brand positioning:** Your Tanzania Trip is the brand; Baraka Dalali and his team are "our local partner in Arusha". The name Kilimanjaro Nature Tours stays only where it is legally relevant: the sentence that says who operates your trip as licensed Tanzanian tour operator (Terms, Guarantees, Easy payments, FAQ) and "Recognised by" on `/our-partner/`. Removed: links to kilimanjaronaturetours.com, info@kilimanjaronaturetours.com, the +255 number, the postal address, the partner logo and the channel link.
- **Navigation:** dropdown arrows always visible (Itineraries, Discover Tanzania, Practical info); dropdowns open on hover, with the keyboard (Escape closes) and with a first tap on touch screens; one type style in the menus; mobile menu with a visible close button and "Plan my Trip".
- **Plan my Trip:** readable counters (− 2 adults +, minimum 1 adult, 0 children), adult ages optional and child ages required with clear labels, 10 days as starting length, no preselected country, "Fields marked * are required", a clear message under every field that still needs an answer, an e-mail check, and question/answer labels in the e-mail you receive.
- **About us** rebuilt: story, why we work this way, who you deal with, how we work, partner reviews, contact. Removed claims nobody confirmed (proposal within 24 hours, "more than 100 lodges visited", 24/7 support).
- **Footer:** "About the photos" removed; new column Your Tanzania Trip (About us, Our local partner, Plan my Trip, Contact, FAQ, Blog); link columns now also on phones.
- **Checked:** no sideways scrolling at 375, 390, 768, 1024 and 1440 px on 14 key pages; menus, counters, validation and form sending tested in a browser; `node scripts/audit-site.mjs` clean.

## Done on 2026-11-23, second round (owner answers)

- **No company name of the partner anywhere:** always "Baraka" or "our local partner in Arusha", also in the licensed-operator sentence ("operated by our local partner in Arusha, a licensed Tanzanian tour operator led by Baraka Dalali") and in "Recognised by". No links, e-mail, phone, address or logo of the partner company remain (also not in llms.txt, the search index and the pop-up texts).
- **Phone and WhatsApp +31 6 12729607** (Edrian's number) everywhere; +31 6 29351377 is gone (`company.formerPhones`).
- **About us:** the story now starts with your safari with Baraka, keeping in touch and working together; the internship is no longer mentioned anywhere.
- **Trip Care** replaces the previous operator's Hakuna Matata Package: new page `/trip-care/` (old URL redirects), with personal planning, everything confirmed before you pay, payment schedule, travel documents, flights on request from $250 p.p., airport pick-up, private guide and vehicle, 24/7 support. No replacement-vehicle or garage promises.
- **Bank details:** the contact page now points to Easy payments (IBAN confirmed).
- Removed pages (lodges, academy) no longer appear in llms-full.txt and the site search; the remaining "reply within 24 hours" promises are now "personal reply".

## Done on 2026-11-23, third round (trust and polish)

- Start year 2025 in "Our story" and as `foundingDate` in the Organization schema; FormSubmit is active (requests arrive at bookings@).
- No visible [INVULLEN] markers on the live site any more; About us reads complete and gets the photos and bios as soon as they arrive.
- Old claims of the previous operator rewritten: "local tour operator based in Arusha with many nationalities", "travel consultants/experts", a named former consultant (Julia Trento), "multilingual specialists", "trusted Tanzanian travel company" with environmental projects, "our jeeps", "30% off for children" and "babies travel for free".
- Headings in capitals now in normal case, the benefit blocks have clean outline icons, the old certification-logo photo on Kilimanjaro is gone, the currency pop-up is gone, the nameless partner entry in the schema is gone, the Google search button with the company name is gone.

## Done on 2026-11-23, fourth round

- Reviews: Baraka's Tripadvisor and Google reviews are linked side by side (header, footer, homepage, About us, partner page, sidebars); the three Google quotes (Deanne, Alex, Kara) are on the partner page. Google link: the Google Maps listing of his company (`partner.google.reviewUrl`).
- Photos: About us shows six photos of Baraka's team and Tanzania until your own safari photos arrive; Tijs and Edrian have initials badges until their portraits arrive (no stock faces).
- Rwanda: the optional "Flight to Kigali" is gone from all itineraries (page redirects to Activities), the blog post about gorillas in Rwanda is unpublished (redirects to the blog), and the "Kenya & Uganda with our partners" section on the adventure page is replaced by Tanzanian activities.

## Still to deliver (whenever you are ready; the site is complete without them)

- [ ] Portrait photos of Tijs and Edrian (square, at least 600 × 600 px) and 2–3 sentences each.
- [ ] Photos of your safari with Baraka (landscape, at least 1600 px), or put them in `public/brand/safari-with-baraka/`.
- [ ] Optional: a direct share link from Baraka's Google Business Profile, to replace the Maps link.
- [ ] Social media URLs once the accounts exist.

## SEO, 2026-11-24

Done:
- 192 indexable pages had the old Tanzania Specialist title and/or meta description; all now have their own (`content/seo/*.json`, applied by `src/lib/polish.js`). Check: 0 indexable pages left with an old title or description.
- Category pages with their own title, description, H1 and intro: Private Tanzania Safaris, Climb Kilimanjaro With a Local Crew, Zanzibar Beach Holidays, Tanzania Trips and Sample Itineraries, and a new real page **/safari-and-zanzibar/** (was only a filter); all menu links point to it.
- All 42 trips have their own name; H1 = title; the new names also appear on all cards, in the menus, the search and the trip data for Google. All 42 trips now carry TouristTrip data with price for Google (was 8).
- Language switcher (machine translation) removed.
- Fixed: "95% of our guests reach the top", "we run our own safari jeeps / our office", "TanazaniaSpecialist.com" in the privacy policy, old file names as image descriptions, sustainability targets with past dates.

For you:
- [ ] **Google Search Console:** add the property yourtanzaniatrip.com (domain verification via your domain host, or send me the HTML meta tag code and I add it), submit https://yourtanzaniatrip.com/sitemap.xml, and after a few weeks check Pages > "Duplicate, Google chose different canonical than user".
- [ ] **Own Google Business Profile** for Your Tanzania Trip (Nagele, service-area business) and ask your first travellers for a review on your own name.
- [ ] **Dutch version?** A real Dutch version (own pages + hreflang) is a separate project; say if you want it, starting with the main pages.
- [ ] **Check:** the Marangu trip page says "8-day trip" in the old name but shows 7 days in the programme; the new name is "5-Day Kilimanjaro Climb via Marangu" (7 days in total). Correct?
- [ ] **Legal texts:** Terms and conditions (92 % the previous operator's text) and the sustainability policy are still largely the old operator's; have them checked or rewritten for your own company.
- [ ] Optional: one article per week on a niche topic (safari with children, honeymoon, best month per park) via the blog API.
