# Site-audit: stack en werkwijze (1 november 2026)

Verkenning vóór het SEO-werk op branch `feature/own-content-seo`. Dit document beantwoordt: wat is dit voor site, waar staan de teksten, hoe ontstaan JSON-LD, redirects en sitemap, en wat is er nog over van Tanzania Specialist.

## 1. Samenvatting

- De site is **geen WordPress**. Het is een **statische Astro-site** (Astro 5, Node 26) die op **Vercel** draait. Er is geen database, geen PHP, geen plugin die iets uitvoert.
- De HTML van tanzania-specialist.com is in 2026 **gecrawld** en ligt lokaal in `.cache/raw/` (790 pagina's, niet in git). Scripts maken daar `content/pages/*.html` (768 paginabodies) en `content/pages.json` (metadata) van. Die staan wél in git en worden door Astro gebouwd.
- Alle ombouw naar Your Tanzania Trip gebeurt met **scripts** (`npm run rebrand`), nooit met de hand in de gegenereerde bestanden. Eigen teksten zitten in `content/rewrites/<slug>.json` (539 pagina's met parafrases per tekstblok).
- Het "thema" `public/wp-content/themes/tanzania-specialist/` is **geen werkend WP-thema** maar een map met de gekopieerde CSS, JS, fonts en 2.186 afbeeldingen van het oorspronkelijke thema. Dat thema is door bureau **FBI Digital B.V.** op maat gebouwd voor Tanzania Specialist (zie `style.css`). Het is dus geen gekocht thema met licentie: wij gebruiken de maatwerk-opmaak van de concurrent. Dat is punt 4 van jouw checklist.
- Redirects staan in `astro.config.mjs`. Let op: in een statische Astro-build worden dat **HTML-pagina's met meta-refresh en status 200**, geen 301's. Voor echte 301's moeten ze ook in `vercel.json`. Dat neem ik mee in fase 1 (3.2).
- JSON-LD komt van de oude Yoast-uitvoer per pagina, opgeslagen in `pages.json` en door `rebrand.mjs` gerepareerd (Organization, logo, adres). Er is nog geen TouristTrip, FAQPage of partner-Organization.
- De sitemap (`src/pages/sitemap.xml.js`) zet op alle 551 URL's de bouwdatum als lastmod.
- Jouw bevindingen uit de SEO-check kloppen allemaal; hoofdstuk 9 zegt per punt waar het zit.

## 2. Stack

| Onderdeel | Wat | Waar |
|---|---|---|
| Framework | Astro 5.18, statische output (`astro build` → `dist/`), `trailingSlash: always` | `astro.config.mjs` |
| Pagina's | Eén catch-all route die elke pagina uit `content/` rendert | `src/pages/[...slug].astro` |
| Layout | `<head>`, GA4 met consent mode, header/footer-partials, scripts | `src/layouts/BaseLayout.astro` |
| Gedeelde chrome | header, footer, head-links, head-scripts (uit de oude homepage geknipt) | `src/partials/*.html` |
| Stijl | Theme-CSS 541 KB (`app.css`, omgekleurd door `brand-theme.mjs`) + `src/styles/brand.css`, `head.css`, `fonts.css`; Inter en Marcellus via `@fontsource` | `public/wp-content/themes/tanzania-specialist/public/css/`, `src/styles/` |
| Interactie | Oude theme-JS en jQuery, plus eigen scripts: `forms.js` (FormSubmit), `facetwp-static.js` (sorteren/filteren uit JSON), `site-search.js`, `currency.js`, `translate.js`, `cookie-consent.js` | `public/assets/js/`, `public/facetwp-static/`, `public/ajax/` |
| Formulieren | Gravity-Forms-markup, onderschept door `forms.js`, post naar FormSubmit (`forms.endpoint` in de tokens) | `public/assets/js/forms.js` |
| Blog-API | Eén Vercel-functie; posts als JSON in `content/blog-posts/`, gebouwd door `src/lib/blog-posts.js` | `api/blog-publish.js`, `vercel.json` (rewrite) |
| Hosting | Vercel-project `your-tanzania-trip-website`, deploy vanaf GitHub `main`; apex-domein is primair, www → 308 | `vercel.json`, Vercel-dashboard |
| Merkfeiten | Eén bron voor bedrijf, partner, kleuren, fonts, formulieren, GA4 | `docs/brand-tokens.json` |

Pakketten: `cheerio` (HTML bewerken in scripts), `puppeteer` (screenshots), `marked` (blog-Markdown), `pixelmatch`/`pngjs` (vergelijking). Python 3 is er, maar zonder `bs4`/`requests`; Lighthouse is niet geïnstalleerd.

## 3. Waar staan de teksten

De pipeline, van bron naar site:

```
.cache/raw/<slug>.html        gecrawlde HTML van tanzania-specialist.com (lokaal, 790 stuks)
        │  scripts/extract.mjs
        ▼
content/pages/<slug>.html     paginabody per URL (768), content/pages.json (metadata), content/redirects.json
src/partials/*.html           header, footer, head
        │  scripts/rebrand.mjs      tekstregels, header/footer, partnerblokken, verwijderde pagina's,
        │                           JSON-LD-reparatie, zoekindex, redirects-brand.json
        │  + content/rewrites/<slug>.json   parafrases per blok {orig, html}; toegepast als `orig` nog
        │                                    in de pagina staat en de tags gelijk zijn
        │  scripts/brand-theme.mjs  kleuren en fonts in de theme-CSS en gekleurde assets
        │  scripts/blog-reserved.mjs
        ▼
npx astro build  →  dist/      (Vercel doet dit bij elke push naar main)
```

Belangrijk voor het herschrijven:

- **Nooit** rechtstreeks in `content/pages/*.html` werken: `npm run rebrand` overschrijft alles vanaf `.cache/raw`.
- Het bestaande rewrites-mechanisme pakt alleen `<p>`, `<h2>`, `<h3>`, `<h4>` en `<li>` **binnen `.ts-prose`-containers** (zie `scripts/rewrite-extract.mjs`). Hero-koppen (H1), intro's buiten prose, CTA-blokken, tabelcellen, prijsuitleg en kaartteksten vallen erbuiten. Daarom staat er op de 8 reispagina's nog 19–40% gelijke tekst, en is de home (geen prose-blokken) nog grotendeels origineel.
- De home, About, Contact, FAQ-index, travel-proposal en guarantees staan expres **buiten** de rewrites (`SKIP_PREFIX`); die pagina's worden nu met losse functies in `rebrand.mjs` aangepast (`contactPage`, `aboutPage`, `callAnExpert`, `partnerHomeSection`).
- Dekking rewrites: 207 accommodaties, 84 itineraries (hoofd- en subpagina's), 80 blogs, 80 activiteiten, 32 parken, 11 practical-information, 7 eilanden, rest losse pagina's.
- Reispagina's hebben noindex-subpagina's (`/itinerary/`, `/accommodations/`, `/activities/`, `/practical-information/`, `/prices/`). Alleen `/itineraries/<slug>/` en `/itinerary/` zijn indexeerbaar. Van de 768 pagina's zijn 551 indexeerbaar en 217 noindex.

## 4. Metadata en JSON-LD

- Per pagina in `content/pages.json`: `title`, `description`, `robots`, `ogType/ogTitle/ogDescription/ogImage`, `bodyClass`, `extraScripts`, `extraStyles`, `stickyCta`, `ldJson`.
- `ldJson` is een lijst JSON-strings, letterlijk de Yoast-`@graph` van de oude site: `WebPage`, `ImageObject`, `BreadcrumbList`, `WebSite`, `Organization` op 767 pagina's; `Article` + `Person` op de 80 blogs. `fixJsonLd()` in `rebrand.mjs` zet Organization op onze naam, logo, adres, e-mail en telefoon, `sameAs: []`, en gooit `AggregateRating`/`Review` weg.
- Canonical en og:url maakt `BaseLayout.astro` uit het pad. Er is geen hreflang; `lang="en-US"` staat vast.
- Ontbreekt nu: `TouristTrip`, `FAQPage`, partner-`Organization`, `founder`, `vatID`, `contactPoint`, `areaServed`. Nieuwe schema's horen in `rebrand.mjs` (of een eigen module die `rebrand.mjs` aanroept), zodat ze elke rebrand meekomen.
- Tellingen: 61 indexeerbare pagina's zonder description (waaronder `/about-tanzania-specialist/`, `/faqs/`, `/travel-proposal/`), 2 dubbele titles.

## 5. Redirects

Drie bronnen, samengevoegd in `astro.config.mjs`:

1. `content/redirects.json` (72): de redirects die de oude WordPress-site zelf had.
2. `content/redirects-brand.json` (23): pagina's die de rebrand verwijdert (oprichtersinterviews, Africa Safari Trips, teampagina, vacatures). Wordt door `rebrand.mjs` geschreven uit de `removed`-map.
3. `previous_slugs` van blogposts uit de API.

Bevinding: Astro zonder adapter bouwt voor elke redirect een `index.html` met `<meta http-equiv="refresh">`, `noindex` en canonical naar het doel. Vercel serveert die met **200**. Google volgt zo'n meta-refresh wel, maar een 301 is sterker en sneller. Voorstel: `rebrand.mjs` schrijft dezelfde lijst ook als `redirects` in `vercel.json` met `statusCode: 301` (Vercel staat er ruim voldoende toe). De Astro-pagina's blijven als vangnet.

Voor `/about-tanzania-specialist/ → /about-us/` moet ook de pagina zelf verhuizen: `extract.mjs` leidt de slug uit de bestandsnaam af, dus dat wordt een hernoemregel in `rebrand.mjs` (bestand, `pages.json`-pad, 9 interne links, menu's in `header.html`/`footer.html`, breadcrumbs in de JSON-LD, zoekindex, sitemap).

## 6. Sitemap, robots, zoekindex

- `src/pages/sitemap.xml.js`: alle indexeerbare pagina's plus API-blogposts; `lastmod` = bouwdatum voor alle 551 URL's (vandaag `2026-11-01`). Echte wijzigingsdata zijn beschikbaar uit **git**: `content/pages/<slug>.html` staat in git, dus `git log -1 --format=%cI -- <bestand>` geeft de laatste inhoudelijke wijziging. Omdat Vercel ondiep kloont, moet dat lokaal in een `content/lastmod.json` worden gezet (stap in `npm run rebrand`). Pagina's zonder eigen wijziging krijgen dan geen lastmod.
- `public/robots.txt`: alles toegestaan behalve `/wishlist/`, `/processing-your-payment/`, `/ajax/`, `/facetwp-static/`; Sitemap-regel klopt. Geen `llms.txt`.
- Zoekfunctie: `public/search-index.json` (gebouwd door `rebrand.mjs`) + `/blog-search-index.json`.

## 7. Hosting en deploy

- Vercel bouwt met `astro build` vanaf GitHub `main`. Alleen `content/`, `src/`, `public/`, `api/` en configuratie zijn nodig; `.cache/` en `dist/` staan niet in git. De pipeline (`npm run rebrand`) kan dus **alleen op deze Mac** draaien.
- `vercel.json` heeft nu één rewrite voor de blog-API. Geen redirects, geen headers.
- De blog-API commit rechtstreeks op `main`; vóór een push eerst `git pull --rebase`.

## 8. Wat er nog van Tanzania Specialist in zit

| Waar | Aantal | Toelichting |
|---|---|---|
| Paden `/wp-content/themes/tanzania-specialist/…` in paginabodies | 2.092 | Vrijwel alles afbeeldingen (`public/images/…`: iconen, maskers, achtergronden) |
| Zelfde pad in `head-links.html` | 2 | `style.css` en `app.css` |
| `bodyClass` `wp-theme-tanzania-specialist` | 768 | Op elke pagina, in `pages.json` |
| Uploads in `/wp-content/uploads/old-tanzania-specialist_com/` | 160 verwijzingen | Oude blogfoto's in 6 jaarmappen |
| Uploadbestanden met de naam in de bestandsnaam | 185 unieke bestanden | o.a. `Tanzania-Specialist-safari-vehicule-1.jpg` (op 38 pagina's, 7 formaten), `Lake-Manyara-Flamingo-Tanzania-Specialist-…`, `Rondreis-tanzania-specialist-Tarangrire-…`, `Accommodation-example-Tanzania-Specialist.jpg`, `Tanzania-Specialist-Newsletter-.jpeg`, `Tanzania-specialist1/38/69/129` |
| Bestanden en mappen in `public/` met de naam | 151 | Inclusief de themamap en de `old-…_com`-map |
| URL `/about-tanzania-specialist/` | 1 pagina, 9 links + menu's | |
| Zichtbare tekst "Tanzania Specialist" | 0 | De rebrand-controle (`needles`) meldt geen resten in tekst |
| `style.css`-header | 1 | Theme Name staat al op Your Tanzania Trip; Author FBI Digital B.V., Text Domain `fbi-digital` |

De volledige lijst met nieuwe namen en risico komt in fase 1 als `docs/rename-list.md`.

## 9. Jouw SEO-bevindingen, teruggevonden in de code

| Bevinding | Waar het zit | Hoe we het aanpakken |
|---|---|---|
| Home-H1 "Your guide to Tanzania's wonders" | `content/pages/index.html`, hero | Nieuwe H1 via eigen-tekstbestand (hoofdstuk 11) |
| Home-title "Leading Travel Agency in Tanzania…" | `pages.json` (title en ogTitle); JSON-LD `WebPage.name` | Titelregel in `rebrand.mjs`, 3 opties voor jou |
| Quiz-blok "Dreaming of Tanzania but not sure which safari…" | `src/partials/footer.html` (dus op elke pagina) en `content/pages/travel-quiz.html` | Eigen tekst of weghalen; beide varianten lever ik |
| FAQ-index met Kenia en Oeganda | `content/pages/faqs.html` (4× Kenya, 4× Uganda) | Verwijderen in een `faqsPage()`-functie |
| Twee H1's op `/faqs/` | `faqs.html`: hero-H1 én "Get ready for the trip of your dreams" | Tweede H1 wordt H2 |
| `/about-tanzania-specialist/` | pagina, menu's, 9 links, geen meta description, placeholder in menu | Hernoemen naar `/about-us/` met 301 (hoofdstuk 5) |
| "climbling" en "Affordable" | `content/pages/climbing-kilimanjaro.html`; title in `pages.json` | Rewrite + titelregel |
| Bankgegevens op Contact | `contactPage()` in `rebrand.mjs` zet IBAN/BIC uit `brand-tokens.json` op de pagina | Regel aanpassen; tokens blijven |
| Google-reviews Deanne, Alex, Kara | `docs/brand-tokens.json` → `partner.quotes` (platform "Google"); er is alleen een Google-zoeklink, geen directe reviewlink | Blok verbergen en `[INVULLEN: bron + link]` tot jij bevestigt |
| "Call an expert" met Baraka's foto bij +31 | `callAnExpert()` in `rebrand.mjs` (commentaar bevestigt: portret is Baraka's) | Tijs/Edrian bij +31 en e-mail, Baraka bij Arusha "during your trip" |
| Tripadvisor-toewijzing | `headerTrustItem()`, `footerBand()`, `partnerCompact()`, `partnerPageBody()`; datum uit `partner.tripadvisor.checkedOn` = 27 October 2026 | Controleren op elke plek; één vaste zin |
| lastmod overal gelijk | `sitemap.xml.js` | Git-datum (hoofdstuk 6) |
| Zware HTML (home 212 KB, 11-days 408 KB in `dist/`) | 39–40 `<script>`-tags, inline `extraScripts`/`extraStyles`, dubbel menu (desktop + mobiel), verborgen tabs | Fase 4, met Lighthouse vóór/na |
| Dode elementen | `#cookie-settings-anker`: niet gevonden in de bron (mogelijk uit een oudere build); lege `<h2></h2>` op `contact.html` regel 83; `/nl/`-links: 0 gevonden | Controleren in `dist/` en opruimen |
| Alt-teksten | Home: 12 van 23 `<img>` leeg; 11-days: 5 van 7; Kilimanjaro: 8 van 20 | Beschrijvende alts voor fase-1-pagina's via `imageRules`/eigen-tekstbestand |

De 8 reizen op de home zijn precies jouw lijst: `11-days-safari-trip-tanzania-zanzibar`, `15-days-trip-tanzania-zanzibar`, `9-days-safari-wildebeest-migration-near-the-mara-river`, `7-days-safari-tanzania`, `machame-route-7-days`, `10-days-zanzibar-island`, `10-days-safari-mikumi-udzungwa-ruaha-nyerere`, `5-day-tanzania-safari-small-group-trip`.

## 10. Gereedschap

| Nodig voor | Status |
|---|---|
| Overlapcheck (3.5) | Python 3 aanwezig; `scripts/check-overlap.py` komt op de standaardbibliotheek (`urllib`, `html.parser`), dus zonder extra installatie |
| Screenshots | `screenshot.mjs` + Puppeteer werkt |
| Lighthouse (fase 4) | Niet geïnstalleerd; `npx lighthouse` moet eenmalig ~100 MB downloaden. Ik vraag het als fase 4 begint |
| Live-vergelijking | `scripts/compare.mjs` en `scripts/check-links.mjs` bestaan al |
| Rich Results Test | Handmatig in de browser; ik lever de URL's en leg de uitkomst vast in `docs/schema-validation.md` |

## 11. Voorstel voor de aanpak van fase 1

Het rewrites-mechanisme is goed voor parafrases, maar niet voor "alles nieuw". Daarom kom er één laag bij, in dezelfde stijl:

1. **`content/own/<slug>.json`** per fase-1-pagina (home, 8 reizen, Kilimanjaro, Migratie, Zanzibar, About, FAQ's, Contact, Hakuna Matata). Daarin:
   - `title`, `description`, `h1`, `intro`;
   - `replace`: lijst `{find, html}` voor bestaande blokken die vervangen worden (werkt op elk element, ook buiten `.ts-prose`);
   - `sections`: nieuwe blokken op een vast ankerpunt, zoals `whyThisTrip`, `priceNote`, `cta`;
   - `faq`: lijst `{q, a}`.
   `rebrand.mjs` past dit toe ná de rewrites. Uit `faq` maakt het zowel het zichtbare FAQ-blok als het `FAQPage`-schema, zodat beide per definitie gelijk zijn. Uit de bestaande prijsbox en het dagprogramma maakt het `TouristTrip`.
2. **Teksten** schrijf ik in het Engels volgens hoofdstuk 2 van jouw opdracht, met de feiten, prijzen, tabellen, dagprogramma's en lodges ongewijzigd. Tekst die ik niet uit de bestaande pagina's of de tokens kan halen, krijgt `[INVULLEN: …]`.
3. **Volgorde**: eerst `scripts/check-overlap.py` en de nulmeting (`docs/overlap-before-after.md`), dan home, dan de 8 reizen, dan Kilimanjaro/Migratie/Zanzibar/About/FAQ/Contact, dan de URL-wissel en `rename-list.md`, dan de nameting. Per deelstap een commit.
4. **Blog**: alleen meten (`docs/blog-overlap.md`), niet herschrijven.
5. **Thema (3.3)**: hernoemen betekent hier de map verplaatsen en 2.186 paden herschrijven in `extract.mjs`/`rebrand.mjs`, `brand-theme.mjs`, `patch-theme.mjs` en `head-links.html`, plus `bodyClass`. Technisch laag risico, omdat alle paden uit de scripts komen. Ik maak de lijst in `rename-list.md` en wacht op je akkoord, zoals afgesproken.

## 12. Vragen vóór fase 1

1. **Thema en teksten**: het thema is maatwerk van FBI Digital voor Tanzania Specialist, geen gekocht thema. Herschrijven van de teksten lost het tekstdeel op; de opmaak, iconen en 2.186 themabeelden blijven van hen. Wil je dat ik dat voor nu zo laat (jouw richting van 23 oktober) en alleen hernoem, of wil je in een latere fase ook eigen opmaak? Dit raakt checklistpunt 4.
2. **301's via `vercel.json`**: akkoord dat ik de redirects ook daar zet? Zonder dit blijven het meta-refresh-pagina's met status 200.
3. **Google-quotes**: de drie quotes staan in `brand-tokens.json` als Google-reviews van Kilimanjaro Nature Tours. Heb jij de directe link naar hun Google-profiel? Zo niet, dan verberg ik het blok.
4. **Sitemap-lastmod**: git-datum (mijn voorkeur) of helemaal weglaten?
5. **Blog**: na de meting kies jij per post. Posts die weg moeten, krijgen `noindex` plus een 410 via `vercel.json`. Akkoord met die techniek?

Pas na jouw "ja" op dit document begin ik aan fase 1.
