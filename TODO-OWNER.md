# TODO-OWNER — Your Tanzania Trip

Status: 2026-10-23 (afternoon). The site is the existing Tanzania Specialist site (your own site), kept one-to-one in layout, pages, trips and texts, restyled to the Your Tanzania Trip brand guide, with Kilimanjaro Nature Tours as the visible local partner. Live at https://www.yourtanzaniatrip.com (Vercel, deploys from GitHub `main`).

Everything that could not be filled in without inventing it is a visible, yellow-marked `[FILL: …]` placeholder on the site. All brand facts come from `docs/brand-tokens.json`; change them there and run `npm run rebrand && npx astro build`, then push.

## 1. Fill in (docs/brand-tokens.json unless stated)

- [ ] **Form delivery** → `forms.endpoint` and `forms.accessKey`. The forms (travel proposal, contact, newsletter, quiz) now work: without an endpoint they open the visitor's e-mail app with the filled-in request to info@yourtanzaniatrip.com. For real delivery to your inbox, create a free Web3Forms key at https://web3forms.com (enter info@yourtanzaniatrip.com, the key arrives by e-mail), then set `endpoint` to `https://api.web3forms.com/submit` and `accessKey` to the key. Any other service that accepts JSON POST works too.
- [ ] **Tripadvisor profile URL of Kilimanjaro Nature Tours** → `partner.tripadvisor.url`. Until set, "Read reviews on Tripadvisor" links to `/our-partner/`.
- [ ] **Date you last checked the Tripadvisor score** (5.0, 208 reviews) → `partner.tripadvisor.checkedOn`. Shown wherever the score appears.
- [ ] **WhatsApp number** → `company.whatsapp` (contact page).
- [ ] **IBAN and BIC** → `[FILL: IBAN]` / `[FILL: BIC]` on contact, Easy payments and the Tanzania FAQ (rules in `scripts/rebrand.mjs`, `contactRules`). Also `[FILL: bank name and address]` on Easy payments.
- [ ] **Package-travel protection / insolvency cover**: the old SGR/ANVR/ATOL claims were removed (footer, About, Terms, Guarantees, Easy payments, FAQ). Tell me what applies, or confirm there is none and I remove the placeholder lines.
- [ ] **Our Story** on About: a few sentences on why you started Your Tanzania Trip and how the partnership with Kilimanjaro Nature Tours came about (`aboutPage()` in `scripts/rebrand.mjs`).
- [ ] **TALA licence number and written permission** from Kilimanjaro Nature Tours to show their licences (TATO, TANAPA, Tanzania Tourist Board, TALA) → `partner.credentials`.

## 2. Photos and video to supply

- [ ] **Photo of you (Tijs)** for the hero form avatar, the "Call an expert" block and the contact page → replaces `public/brand/placeholder-photo.jpg` (square, at least 600×600).
- [ ] **Photo of Baraka Dalali** and a **team photo of Kilimanjaro Nature Tours**, with their permission → `public/brand/placeholder-photo.jpg` and `public/brand/placeholder-team.jpg` (home page partner section, `/our-partner/`).
- [ ] **Videos**: the 8 YouTube videos of the old operator (its logo was in every thumbnail and video, e.g. "Discover Tanzania in only 1 minute", the Kilimanjaro preparation guide, park videos) were removed from 87 pages. On trip pages the partner block took that spot. If you make your own videos, I add them back in the same places.
- [ ] **Jeep photos**: photos showing the old logo on the vehicles were swapped for logo-free photos from the same library (guide and guests at a tree, guest with binoculars, jeeps on a track, elephants from the jeep). The hero photo on the home page still shows a jeep with a small logo on the door at the far right; replace if you want it gone.
- [ ] **Menu thumbnail** "Request a proposal at no charge" was regenerated in brand style (`public/brand/request-thumbnail.jpg`); replace with a photo if you prefer.

## 3. Decide

- [ ] **Removed pages** (all redirect): the 7 "Meet the team" / "Hot seat" posts and the guide interview → `/our-partner/`; the Serengeti Safari Marathon posts and the albino press release → `/blog/`; "Why choose Tanzania Specialist" → About; "Certified responsible climbing" → Kilimanjaro; the Chapka insurance post → Travel insurance; "Our experts" page → `/our-partner/`; job pages → Contact. Say so if any should come back rewritten.
- [ ] **Hakuna Matata Package / Academy** (names and logo) are kept as products of the site. Rename if they stay with the old brand.
- [ ] **Texts about the old company's size or history** ("thousands of travellers", "over 100 hotels", "team of 30") were left except on About and Contact. Read About, the Hakuna Matata pages and "Exceptional travel" once and tell me what to rewrite.
- [ ] **Reviews of Your Tanzania Trip**: none shown. Once you have your own, we add them with first name, date and source.
- [ ] **Search** (Algolia) still uses the old index; results show old titles. Replace the keys in `src/partials/footer.html` (`var ts = …`) or remove the search icon.
- [ ] **Currency switch** to EUR/GBP does not work (prices were converted by the old server). USD only, unless prices are supplied in other currencies.
- [ ] **Social media**: no social block in the footer until you have accounts (add them to `docs/brand-tokens.json`).
- [ ] **www or not**: Vercel serves `www.yourtanzaniatrip.com` as the main address while the pages declare `https://yourtanzaniatrip.com` as canonical. Either set the www domain in Vercel to redirect to the apex (recommended), or tell me to switch `site` in `astro.config.mjs` to www.
- [ ] **Image file names** still contain the old name (e.g. `Rondreis-tanzania-specialist-…webp`); harmless, rename only if you want a clean media library.
- [ ] **Old copy**: the original-design Next.js build is in `../Safari website - NEXT BUILD (archive)/`. Delete it yourself when you no longer need it.

## Technical

- Build and view: `npx astro build`, then `node serve.mjs` → http://localhost:3000.
- Rebrand after changing tokens or rules: `npm run rebrand` (= extract → `scripts/rebrand.mjs` → `scripts/brand-theme.mjs`), then build. Publish: `git add -A && git commit && git push` (Vercel deploys `main`).
- Colours and fonts: `scripts/brand-theme.mjs` (from `.cache/theme-original/`) plus `src/styles/brand.css` (context colours, hover states, form feedback). Content, header, footer, partner pages, image swaps and removals: `scripts/rebrand.mjs`. Forms: `public/assets/js/forms.js`.
- Compare with the example site: `node scripts/compare.mjs / /blog/ …` writes live/local/diff screenshots to `temporary screenshots/compare/`.
- Known, pre-existing broken links from the source site (12 missing uploads / old park URLs): `node scripts/check-links.mjs`.
