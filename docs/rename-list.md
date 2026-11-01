# Rename-lijst: resten van "tanzania-specialist" in paden, bestandsnamen en code

Stand 1 november 2026, branch `feature/own-content-seo`. Zichtbare tekst bevat de oude naam nergens meer (de rebrand-controle meldt 0 treffers). Wat overblijft staat in URL's, bestandsnamen, paden en klassen. Per groep: waar, voorgestelde nieuwe naam, risico en wat het hernoemen vraagt. **Niets uit deze lijst is al hernoemd**, behalve de URL in de eerste rij.

| # | Waar | Aantal | Nieuwe naam | Risico | Opmerking |
|---|---|---|---|---|---|
| 1 | URL `/about-tanzania-specialist/` | 1 pagina, 9 links, 2 menu's, breadcrumbs, sitemap | `/about-us/` | laag | **Gedaan in fase 1.** 301 via `vercel.json`, meta-refresh als vangnet; interne links, menu's, canonical, JSON-LD en sitemap wijzen naar het nieuwe pad. |
| 2 | Themamap `public/wp-content/themes/tanzania-specialist/` (CSS, JS, fonts, 2.186 afbeeldingen) | 2.092 paden in 770 paginabodies, 2 in `head-links.html`, 1 in `app.css` | `public/wp-content/themes/your-tanzania-trip/` | laag–middel | Alle paden komen uit de scripts (`extract.mjs` → `localizeUrls`, `brand-theme.mjs`, `patch-theme.mjs`). Eén padregel in `rebrand.mjs` plus het verplaatsen van de map (en van `.cache/theme-original/`) is genoeg. Oude asset-URL's hoeven geen redirect: het zijn iconen en achtergronden, geen pagina's. Zie `docs/site-audit-stack.md` §1 over de herkomst van het thema. |
| 3 | `bodyClass` `wp-theme-tanzania-specialist` | 767 pagina's (`pages.json`) | `wp-theme-your-tanzania-trip` | laag | Alleen een klasse; de CSS gebruikt hem niet. Tegelijk met 2. |
| 4 | `style.css`-header van het thema | 1 | Author/Text Domain: `Your Tanzania Trip` / `your-tanzania-trip` | laag | Theme Name staat al goed; `Author: FBI Digital B.V.` en `Text Domain: fbi-digital` blijven de bouwer van het oorspronkelijke thema noemen. Alleen cosmetisch. |
| 5 | Uploadmap `public/wp-content/uploads/old-tanzania-specialist_com/` (6 jaarmappen, oude blogfoto's) | 39 pagina's, 160 verwijzingen | `public/wp-content/uploads/archive/` | laag | Alleen blogposts gebruiken deze foto's. Hernoemen = map verplaatsen + één padregel in `rebrand.mjs`. Google Afbeeldingen kan oude URL's kennen; een 301 per map kan in `vercel.json` (`/wp-content/uploads/old-tanzania-specialist_com/:path*` → `/wp-content/uploads/archive/:path*`). |
| 6 | `Tanzania-Specialist-safari-vehicule-1.jpg` (7 formaten) | 39 pagina's | `safari-vehicle-tanzania.jpg` | laag | Foto van een safariauto; staat op de partnerpagina/blokken. Hernoemen + padregel; redirect optioneel. |
| 7 | `Lake-Manyara-Flamingo-Tanzania-Specialist-1900x1000-1.jpg` (7 formaten) | 21 pagina's | `lake-manyara-flamingos.jpg` | laag | Hero van Lake Manyara-pagina's. Idem. Alt-tekst nu "Lake-Manyara-Flamingo-Tanzania-Specialist-1900x1000" → "Flamingos on Lake Manyara". |
| 8 | `Rondreis-tanzania-specialist-Tarangrire-1900x1000-1.webp` | 2 | `tarangire-safari.webp` | laag | Idem. |
| 9 | `Accommodation-example-Tanzania-Specialist.jpg` | 2 | `accommodation-example.jpg` | laag | Idem. |
| 10 | `Serengeti-Tanzania-Specialist-chita-1900x1000-1.webp`, `Luipaard-in-boom-Serengeti-Tanzania-Specialist-…`, `Ngorongoro-oerwoud-Tanzania-Specialist-…`, `Pemba-Tanzania-Specialist.com_.jpg` | 4, 1, 1, 1 | `serengeti-cheetah.webp`, `serengeti-leopard-tree.jpg`, `ngorongoro-forest.jpg`, `pemba-island.jpg` | laag | Nederlandse oude bestandsnamen (Luipaard, oerwoud). Idem. |
| 11 | `Tanzania-specialist1/38/69/129/134.avif/.jpg` | 5, 1, 2, 2, 0 | `safari-photo-1.avif` enz. (op inhoud benoemen) | laag | Alt-tekst "Tanzania specialist69" → beschrijvend. |
| 12 | `Travelife-Tanzania-Specialist_zebras`, `_`, `_sustainable` | 3, 3, 0 | `responsible-travel-zebras`, … | laag | Travelife was een lidmaatschap van de oude exploitant; de foto's zijn neutrale natuurfoto's. Controleer of ze het Travelife-logo tonen; zo ja, vervangen in plaats van hernoemen. |
| 13 | `Tanzania-Specialist-Newsletter-.jpeg` | 3 | `newsletter-banner.jpeg` | middel | Controleer of de afbeelding zelf de oude naam toont (bannerafbeelding). Zo ja: opnieuw maken (`scripts/render-cards.mjs`-stijl) of verwijderen. |
| 14 | `Dining-in-the-Wild-`, `The-Golden-Awakening-`, `The-Golden-Hour-Sundowner-Tanzania-Specialist.png`, `What-to-wear-on-safari-in-Tanzania-Tanzania-Specialist.avif` | 1 elk | zonder suffix | middel | Ontworpen beelden (activiteiten, infographic). Controleren op ingebakken logo; staan mogelijk al in `scripts/debrand-list.txt`. |
| 15 | Ongebruikte bestanden met de oude naam (0 verwijzingen): albino-serie 2022/10, `Tanzania-Specialist-Epimark-…`, `CREDIT_-…Serengeti-Marathon…`, `Tanzania-Specialist-Team-crop.avif`, `team_tanzania_specialist_jeeps.jpg`, `guide_tanzania_specialist.jpg`, `Tanzania-Travel-Tanzania-Specialist-jeep.jpg`, `Tanzania-Specialist-Safari-guide-Joseph-Abel-Laizer-…` | ±20 bestanden, 0 verwijzingen | verwijderen | laag | Horen bij verwijderde pagina's (oude teamposts, marathon, albino-persbericht) of tonen oud team/logo. Verwijderen uit `public/` en uit `scripts/download-assets`-lijsten. |
| 16 | `id="tanzania-specialist-africa-safari-trips"` (filterknop op de reizenpagina) | 1 | `id="your-tanzania-trip"` | laag | Alpine-state key; samen met de `clickedButtons[...]`-verwijzing aanpassen. |
| 17 | `scripts/rewrite-extract.mjs` `SKIP_PREFIX` en `scripts/rebrand.mjs` (regels en `removed`-map) | code | – | geen | Interne verwijzingen naar de oude slug blijven nodig om de oude bron om te zetten; geen SEO-effect. |

## Aanpak na akkoord

1. Map en bestanden verplaatsen in `public/` (en `.cache/theme-original/` voor het thema).
2. Eén `imageRules`/padregel per rij in `scripts/rebrand.mjs`, zodat `npm run rebrand` de nieuwe paden in alle 768 pagina's, `pages.json`, AJAX-fragmenten en FacetWP-data zet.
3. Redirects voor afbeeldingen alleen waar Google Afbeeldingen verkeer kan sturen (rij 5–7): in `vercel.json`.
4. `node scripts/check-links.mjs` en een `grep` op `tanzania-specialist` in `dist/` als controle; doel: alleen rij 17 blijft over.

Geschatte omvang: één sessie. Risico zit alleen in rij 13–14 (beelden met ingebakken naam), die eerst bekeken moeten worden.
