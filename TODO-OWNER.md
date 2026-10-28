# TODO-OWNER — Your Tanzania Trip

Status: 2026-10-27. Everything the site needs is filled in; there are no placeholders left on the site. Live at https://www.yourtanzaniatrip.com (Vercel, deploys from GitHub `main`).

## Three things only you can do

- [ ] **Activate the form delivery (one click).** The forms (travel proposal, contact, newsletter, quiz) send to tijskrops2005@gmail.com through FormSubmit. The first submission on the live site triggers a one-time e-mail from FormSubmit ("Confirm your e-mail") to that address; click the button in it once. Until then the visitor's own e-mail app opens with the request as fallback, so nothing is lost.
- [ ] **Switch to info@yourtanzaniatrip.com** once that mailbox exists: change `company.email` and `forms.endpoint` (`https://formsubmit.co/ajax/info@yourtanzaniatrip.com`) in `docs/brand-tokens.json`, run `npm run rebrand && npx astro build`, push, and confirm the new FormSubmit activation e-mail.
- [ ] **www or not (Vercel, one click).** Vercel serves `www.yourtanzaniatrip.com` as the main address while the pages declare `https://yourtanzaniatrip.com` as canonical. In Vercel → Domains → Edit `www.yourtanzaniatrip.com` → redirect to `yourtanzaniatrip.com` (308). Or say so and I switch the canonical to www instead.

## Keep up to date (every few months)

- [ ] **Tripadvisor score** of Kilimanjaro Nature Tours: `partner.tripadvisor` (score, count, awards, checkedOn) in `docs/brand-tokens.json`. Shown in the header, footer, home page, reviews page and `/our-partner/` with the date it was checked.
- [ ] **Photos of yourself/Edrian**: optional. The site now shows Baraka and his crew (from the Kilimanjaro Nature Tours site) where the old consultant photos were. If you want your own portrait in the hero form and "Call an expert", give me a square photo.

## Decided and done (for reference)

- Company facts: Tijs Krops (trading as Your Tanzania Trip), Sluitgatweg 10, 8308 RE Nagele, KvK 97223344, BTW NL005256557B94, Knab IBAN NL74 KNAB 0776 8630 37 / BIC KNABNL2H, phone + WhatsApp +31 6 29351377, co-founder Edrian Waterman. No travel guarantee fund; the Guarantees, About, Terms and Easy-payments pages say so plainly and describe what is guaranteed instead.
- Partner: Kilimanjaro Nature Tours, Arusha, Baraka Dalali. Tripadvisor 5.0 (208 reviews, Travellers' Choice 2023 and 2024, checked 27 October 2026), Google profile link, three Google review quotes, badges (TATO, TANAPA, TTB), crew and founder story, one YouTube clip from their channel. Material from kilimanjaronaturetours.com (your own production).
- Removed from the old site: founders, staff posts, awards, SGR/ANVR/Travelife/KRTO claims, sister company, Facebook/SafariBookings links of the old operator.
- Photos and videos: every hero image on the site was checked. Photos showing the old logo on jeeps, or the old team, were replaced in place by logo-free photos (`scripts/clean-photos.py`, originals in `.cache/photos-original/`). The six hero videos of the old operator were replaced by our own 20-second slow-pan loop made from the partner's photos (`public/brand/video/safari-loop.mp4`). The Kilimanjaro Nature Tours YouTube clip is embedded on `/our-partner/`. If you ever shoot your own footage, drop the file in `public/brand/video/` and tell me.
- Kept as products: Hakuna Matata Package / Academy.

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
