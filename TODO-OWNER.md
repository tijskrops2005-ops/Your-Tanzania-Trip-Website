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

## Technical

- Build and view: `npx astro build`, then `node serve.mjs` → http://localhost:3000.
- Rebrand after changing tokens or rules: `npm run rebrand` (= extract → `scripts/rebrand.mjs` → `scripts/brand-theme.mjs`), then build. Publish: `git add -A && git commit && git push` (Vercel deploys `main`).
- Colours and fonts: `scripts/brand-theme.mjs` (from `.cache/theme-original/`) plus `src/styles/brand.css`. Content, header, footer, partner pages, image swaps and removals: `scripts/rebrand.mjs`. Forms: `public/assets/js/forms.js`. Practical-information tabs are regenerated from the pages (`public/ajax/fetch_post_content/`).
- Compare with the example site: `node scripts/compare.mjs / /blog/ …` → `temporary screenshots/compare/`.
- Known, pre-existing broken links from the source site (12 missing uploads / old park URLs): `node scripts/check-links.mjs`.
