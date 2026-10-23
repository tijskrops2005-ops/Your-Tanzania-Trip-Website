# TODO-OWNER — Your Tanzania Trip

Status: 2026-10-23. The site is the existing Tanzania Specialist site (your own site), kept one-to-one in layout, pages, trips, photos and texts, and restyled to the Your Tanzania Trip brand guide (`docs/brand-style-guide.md`): colours, fonts (Marcellus + Inter), logos, company details, and the local partner Kilimanjaro Nature Tours in place of the old operator's reviews and memberships.

Everything that could not be filled in without inventing it is a visible, yellow-marked `[FILL: …]` placeholder on the site. Each item below says where it lives. All brand facts come from `docs/brand-tokens.json`; change them there and run `npm run rebrand && npx astro build`.

## Fill in (docs/brand-tokens.json unless stated)

- [ ] **Tripadvisor profile URL of Kilimanjaro Nature Tours** → `partner.tripadvisor.url`. Until it is set, every "Read reviews on Tripadvisor" button links to `/our-partner/`.
- [ ] **Date you last checked the Tripadvisor score** (5.0, 208 reviews) → `partner.tripadvisor.checkedOn`. Shown in the header (screen readers), the footer band, the home page, the reviews page and `/our-partner/`. Re-check the score every few months and update the count and date.
- [ ] **WhatsApp number** → `company.whatsapp` (contact page).
- [ ] **IBAN and BIC** → shown as `[FILL: IBAN]` / `[FILL: BIC]` on the contact page, Easy payments and the Tanzania FAQ. Add them to the `contactRules` in `scripts/rebrand.mjs` (replace the two `[FILL]` strings) or in the tokens file and the rule.
- [ ] **Package-travel protection / insolvency cover**: the old SGR/ANVR/ATOL claims were removed (footer, About, Terms, Guarantees, Easy payments, FAQ). State what applies to Your Tanzania Trip, or confirm there is none and we remove the placeholder lines.
- [ ] **Our Story** on `/about-tanzania-specialist/`: the old founders' story was removed; write a few sentences about why you started Your Tanzania Trip and how the partnership with Kilimanjaro Nature Tours came about (`aboutPage()` in `scripts/rebrand.mjs`).
- [ ] **TALA licence number and written permission** from Kilimanjaro Nature Tours to show their licences (TATO, TANAPA, Tanzania Tourist Board, TALA) on `/our-partner/` → `partner.credentials`. Set `permissionGranted: true` and fill the number once you have it.
- [ ] **Photos**: a licensed photo of Baraka Dalali and of the Kilimanjaro Nature Tours team, with their permission → replace `public/brand/placeholder-photo.jpg` and `public/brand/placeholder-team.jpg` (home page partner section and `/our-partner/`).

## Decide

- [ ] **People in the photos**: the consultant photos (hero form, "Call an expert", contact page video still) and the page `/our-tanzania-travel-experts/` show the old operator's staff. Replace with your own or your partner's people, or remove the blocks. The office video on About was removed.
- [ ] **Photos with the old logo**: several safari-jeep photos show the Tanzania Specialist and Africa Safari Trips logos on the vehicles (home page, trip pages). Your photos, so they stay; replace them if you want a clean brand.
- [ ] **Travelife**: the Travelife page was redirected to Responsible Travel and mentions became `[FILL: sustainability certification]`. Keep only if Your Tanzania Trip holds it.
- [ ] **Hakuna Matata Package / Academy** (names and logo) are kept as products of the site. Rename if they stay with the old brand.
- [ ] **"Exceptional travel" and similar pages** that describe the old company's size or history ("thousands of travellers", "30 staff") were left as they are except on About and Contact. Read them once and tell me what to rewrite.
- [ ] **Reviews of Your Tanzania Trip**: none are shown. Once you have your own, we add them with first name, date and source (`/tanzania-traveller-reviews/`).
- [ ] **Search** (Algolia) still uses the old index; results show the old site's titles. Replace the keys in `src/partials/footer.html` (`var ts = …`) or remove the search icon.
- [ ] **Forms** (travel proposal, contact, newsletter, quiz) look identical but do not submit anywhere (no WordPress backend). Connect them to a form service or your own endpoint.
- [ ] **Currency switch** to EUR/GBP does not work (prices were converted by the old server). USD only, unless prices are supplied in other currencies.
- [ ] **Social media**: the old social links were removed; the footer has no social block. Add your own accounts to `docs/brand-tokens.json` when you have them and tell me.
- [ ] **Image file names** still contain the old name (for example `Tanzania-Specialist-safari-vehicule-1.jpg`); harmless, but rename if you want a clean media library.
- [ ] **Old copy**: the original-design Next.js build is in `../Safari website - NEXT BUILD (archive)/`. Delete it yourself when you no longer need it.

## Technical

- Build and view: `npx astro build`, then `node serve.mjs` → http://localhost:3000.
- Rebrand again after changing tokens or rules: `npm run rebrand` (= extract → `scripts/rebrand.mjs` → `scripts/brand-theme.mjs`), then build.
- Refresh everything from the cached source pages: `npm run sync`.
- Colours and fonts are applied by `scripts/brand-theme.mjs` (from `.cache/theme-original/`) plus `src/styles/brand.css`. Content, header, footer and the partner pages come from `scripts/rebrand.mjs`.
- Removed pages redirect: the two "5 questions with …" founder interviews → `/blog/`, `/africa-safari-trips/` → `/`, `/practical-information/travelife-partner-status/` → `/practical-information/responsible-travel/` (`content/redirects-brand.json`).
- Known, pre-existing broken links from the source site (a few missing uploads, `/national-parks-tanzania/...`, `/why-we-only-offer-private-safaris/`): see `node scripts/check-links.mjs`.
