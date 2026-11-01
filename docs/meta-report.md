# Meta-rapport: titles, descriptions, alt-teksten (1 november 2026)

Branch `feature/own-content-seo`. Bron: `content/pages.json` na `npm run rebrand`; de cijfers zijn opnieuw te maken met het script onderaan.

## Samenvatting

| | Vóór | Ná |
|---|---|---|
| Pagina's in de build | 768 | 768 |
| Indexeerbaar (in sitemap) | 551 | 506 |
| Zonder meta description | 59 | 0 |
| Description korter dan 110 tekens | 12 | 12 (activiteiten, zie onder) |
| Description langer dan 160 tekens | 16 | 0 |
| Dubbele titles | 2 (44 pagina's) | 0 |
| Dubbele descriptions | 1 | 1 (twee semi-submarine-excursies) |
| Title langer dan 60 tekens | 112 | 35 (lange activiteitnamen, zie onder) |
| Title korter dan 30 tekens | 11 | 8 |
| Afbeeldingen zonder alt-tekst | ±2.700 (20–30%) | 58 |

## Wat er veranderd is

1. **42 `/itinerary/`-tabbladen** hadden allemaal de title "Itinerary | Your Tanzania Trip" en geen description, en herhalen het dagprogramma van de reispagina. Ze staan nu op `noindex, follow`, net als de andere tabbladen (`/prices/`, `/accommodations/`, …), en zijn uit de sitemap. Zo blijft per reis één URL over voor Google. Terugdraaien kan in één regel in `scripts/rebrand.mjs` (stap 4).
2. **Hulppagina's** `/wishlist/`, `/processing-your-payment/` en `/review-your-opinion-matters/` zijn `noindex` (geen zoekresultaten, `/wishlist/` stond al in `robots.txt`).
3. **Nieuwe descriptions (140–160 tekens, met reden om te klikken)** via `content/own/<slug>.json` voor: About, `/travel-proposal/`, `/faqs/`, `/faqs/tanzania/`, `/blog/` (was 176), `/climbing-kilimanjaro/` (was 73), `/contact/`, `/accommodations/`, `/activities/`, `/practical-information/`, `/practical-information/easy-payments/`, `/practical-information/flying-doctors/` (was 169), `/traveller-guide/`, `/vehicles/`, `/what-to-expect/`, `/families-faq/`, `/honeymoon-faq/`, `/sustainability-policy/`, `/newsletter/`, `/blog/big-five-destination-tanzania/`, de 8 reizen, Kilimanjaro, Migratie, Zanzibar en Hakuna Matata.
4. **Vangnet:** een indexeerbare pagina zonder description krijgt automatisch de eerste alinea, afgekapt op een zinseinde (max. 155 tekens), gemarkeerd met `descriptionAuto`. Nu nog 1 pagina: `/travel-quiz/`.
5. **Titles:** "Affordable" weg (`/climbing-kilimanjaro/`), de dubbele Lemosho-titles zijn "Kilimanjaro: Lemosho Route, 7 days" en "…, 8 days", en titles langer dan 60 tekens verliezen het achtervoegsel "| Your Tanzania Trip" (Google kapt ze anders af; de merknaam staat in de URL en de Organization-data). De 10 Kilimanjaro-reisnamen en 7 andere reisnamen zijn eigen, kortere namen (zie `scripts/rebrand.mjs`, `copyRules`).
6. **Alt-teksten:** `scripts/alt-text.mjs` vult lege alts in vier stappen: (1) een lijst van 70 bekende bestanden met een beschrijvende tekst (hero's, dagfoto's, CTA-beelden, partnerfoto's), (2) het bijschrift van de `figure`, (3) de naam van de lodge bij carrousel-dia's, (4) de kop van de kaart waar de afbeelding in linkt. Als laatste redmiddel een leesbare versie van de bestandsnaam ("Leopard_Night-Game-Drive-Website-pics" → "Leopard night game drive"), behalve bij nietszeggende namen. Decoratieve beelden (`role="presentation"`) blijven leeg.

## Nog open

### Descriptions korter dan 110 tekens (12)
Activiteitenpagina's met een korte, maar bruikbare description; geen fout, wel kort: `/activity/1-excursion-in-zanzibar-safari-blue/`, `/activity/explore-karatu/`, `/activity/mountainbike-tour-arusha/`, `/activity/mountainbike-tour-mto-wa-mbu/`, `/activity/prison-island-tour/`, `/activity/spice-farm-tour-zanzibar/`, `/activity/stone-town-and-spice-farm-tour/`, `/activity/walk-from-materuni-village-to-kuringe-waterfall/`, `/blog/most-seen-animals-and-where-to-spot-them-on-your-tanzania-safari/`, `/discover-tanzania/`, `/islands/mnemba-island/`, `/national-parks/masai-mara-national-reserve/` (Kenia: overweeg deze pagina te laten vervallen; wij doen alleen Tanzania).

### Titles langer dan 60 tekens (35)
Allemaal activiteiten met lange eigen namen, bijvoorbeeld "A wonderful relaxing day Maasai style by Original Maasai Lodge - Africa Amini Life" (82). Voorstel: de activiteitnamen inkorten in `content/own/` als die pagina's aan de beurt zijn; nu geen prioriteit.

### Dubbele description (1)
`/activity/semi-submarine-experience-the-classic-reef-tour-corals-reef/` en `/activity/semi-submarine-experience-the-royal-beach-tour-reef-and-sandbank/`: twee varianten van dezelfde excursie met dezelfde tekst. Eén van beide een eigen zin geven.

### Afbeeldingen zonder alt (58 op 37 bestanden)
Bestanden met nietszeggende namen: `Downloading-images-for-new-website` (11×), `owl` (7×), en genummerde bestanden (`1.jpg`, `3.jpg`, `4-10.jpg`, …). Deze moeten bekeken worden om een tekst te schrijven; lijst met `node scripts/alt-text.mjs --report`.

### Voorstellijst alt-teksten buiten de fase-1-pagina's
De ±2.600 alts die uit bestandsnamen komen zijn bruikbaar maar niet mooi ("Ahadi lodge double room 4"). Per lodge- en activiteitenpagina kan een betere tekst in `KNOWN` in `scripts/alt-text.mjs`; de meest gebruikte bestanden staan bovenaan in het rapport van het script. Prioriteit: de foto's op de 32 parkpagina's en de 8 reizen (gedaan), daarna lodges.

## Dode elementen en structuur

- `#cookie-settings-anker`: niet aanwezig in de bron of de build (komt uit een oudere versie).
- Dubbele navigatiemenu's: de header bevat een desktop- en een mobiel menu (beide nodig; het thema wisselt ze met CSS). Samen 29 KB per pagina. Ontdubbelen vraagt een herbouw van het menu; niet gedaan.
- Lege `<h2>` op Contact: verwijderd.
- `/nl/`: geen dode verwijzingen gevonden. `BaseLayout.astro` leest nu `page.lang` (standaard `en`) en print `hreflang`-links zodra een pagina `alternates` heeft (`{ en: "/pad/", nl: "/nl/pad/" }`); tot die tijd staat er niets.
- `robots.txt`: ongewijzigd, Sitemap-regel klopt. AI-bots zijn toegestaan.
- `llms.txt` en `llms-full.txt` (506 pagina's) worden door `rebrand.mjs` gemaakt uit `pages.json`.

## Het script

```js
node -e '
const p=JSON.parse(require("fs").readFileSync("content/pages.json","utf8")).filter(x=>!(x.robots||"").includes("noindex"));
console.log({indexable:p.length,noDesc:p.filter(x=>!x.description).length,long:p.filter(x=>(x.description||"").length>160).length,longTitle:p.filter(x=>x.title.length>60).length});'
node scripts/alt-text.mjs --report
```
