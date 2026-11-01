# Overlap met tanzania-specialist.com: vóór en ná

Meting met `scripts/check-overlap.py`: zichtbare tekst van onze pagina en van dezelfde slug op tanzania-specialist.com, zinnen van 8+ woorden, percentage = gelijke zinnen / onze zinnen. De concurrentpagina's zijn op 1 november 2026 opgehaald en staan gecached in `.cache/overlap/`, zodat de nameting tegen dezelfde snapshot loopt.

## Vóór (1 november 2026, live site)

| Pagina | Onze zinnen | Hun zinnen | Gelijk | Overlap |
|---|---|---|---|---|
| / | 66 | 142 | 33 | 50% |
| /itineraries/11-days-safari-trip-tanzania-zanzibar/ | 103 | 94 | 39 | 37.9% |
| /itineraries/15-days-trip-tanzania-zanzibar/ | 113 | 107 | 40 | 35.4% |
| /itineraries/9-days-safari-wildebeest-migration-near-the-mara-river/ | 97 | 91 | 40 | 41.2% |
| /itineraries/7-days-safari-tanzania/ | 93 | 86 | 39 | 41.9% |
| /itineraries/machame-route-7-days/ | 100 | 92 | 40 | 40% |
| /itineraries/10-days-zanzibar-island/ | 86 | 78 | 38 | 44.2% |
| /itineraries/10-days-safari-mikumi-udzungwa-ruaha-nyerere/ | 116 | 109 | 43 | 37.1% |
| /itineraries/5-day-tanzania-safari-small-group-trip/ | 62 | 58 | 27 | 43.5% |
| /climbing-kilimanjaro/ | 115 | 116 | 41 | 35.7% |
| /great-wildebeest-migration/ | 111 | 107 | 33 | 29.7% |
| /islands/zanzibar-island/ | 67 | 67 | 27 | 40.3% |
| /about-tanzania-specialist/ | 93 | 91 | 62 | 66.7% |
| /hakuna-matata-package/ | 73 | 73 | 34 | 46.6% |
| /faqs/ | 30 | 26 | 25 | 83.3% |
| /contact/ | 40 | 38 | 29 | 72.5% |

### Waar de gelijke zinnen zitten

- **22 zinnen staan op elke pagina** en komen uit de gedeelde footer: het quizblok ("Dreaming of Tanzania but not sure which safari fits you best?"), het nieuwsbriefblok, de keuzes en vragen in het reisvoorstel-formulier (bijv. "The classic highlights: Serengeti, Ngorongoro and incredible wildlife") en het verborgen anti-spamveld van Gravity Forms ("This field is for validation purposes…"). Eén keer herschrijven in `src/partials/footer.html` haalt ze van alle 768 pagina's.
- **Reispagina's**: het FAQ-blok (vragen en de seizoenslijst), de prijsvoetnoot ("Indicative costs per person, excluding international airline tickets"), "International flights (can be booked for you on request)", het blok "Make your dream trip come true" (twee zinnen bleven in de parafrase staan), dagtitels zoals "Outbound international flight home from Zanzibar Airport (ZNZ)" en de Machame-routeregels met hoogtes. Lodgenamen van 8+ woorden (bijv. "Ole Serai Luxury Camp - Turner Springs by Wellworth") tellen ook mee; dat zijn feitelijke namen en die blijven.
- **Home**: de kaartteksten van de 8 reizen, de tegels "Discover and explore" en de USP-lijst.
- **About** (66,7%), **Contact** (72,5%) en **FAQ-index** (83,3%) zijn nog grotendeels de oorspronkelijke tekst.

## Ná (1 november 2026, lokale build van branch `feature/own-content-seo`)

| Pagina | Vóór | Ná | Onze zinnen | Gelijk | Wat er nog gelijk is |
|---|---|---|---|---|---|
| / | 50% | **0%** | 88 | 0 | – |
| /itineraries/11-days-safari-trip-tanzania-zanzibar/ | 37.9% | **1.1%** | 87 | 1 | “ole serai luxury camp turner springs by wellworth” |
| /itineraries/15-days-trip-tanzania-zanzibar/ | 35.4% | **1%** | 96 | 1 | “serengeti sametu camp by karibu camps and lodges” |
| /itineraries/9-days-safari-wildebeest-migration-near-the-mara-river/ | 41.2% | **2.2%** | 91 | 2 | “serengeti mara river camp by karibu camps and lodges”, “serengeti sametu camp by karibu camps and lodges” |
| /itineraries/7-days-safari-tanzania/ | 41.9% | **1.2%** | 80 | 1 | “serengeti sametu camp by karibu camps and lodges” |
| /itineraries/machame-route-7-days/ | 40% | **0%** | 103 | 0 | – |
| /itineraries/10-days-zanzibar-island/ | 44.2% | **0%** | 67 | 0 | – |
| /itineraries/10-days-safari-mikumi-udzungwa-ruaha-nyerere/ | 37.1% | **2%** | 99 | 2 | “stanley s kopje camp by foxes safari camps”, “vuma hills tented camp by foxes safari camps” |
| /itineraries/5-day-tanzania-safari-small-group-trip/ | 43.5% | **0%** | 76 | 0 | – |
| /climbing-kilimanjaro/ | 35.7% | **0%** | 87 | 0 | – |
| /great-wildebeest-migration/ | 29.7% | **1.1%** | 93 | 1 | “serengeti mara river camp by karibu camps and lodges” |
| /islands/zanzibar-island/ | 40.3% | **0%** | 52 | 0 | – |
| /about-us/ | 66.7% | **0%** | 56 | 0 | – |
| /hakuna-matata-package/ | 46.6% | **0%** | 62 | 0 | – |
| /faqs/ | 83.3% | **0%** | 22 | 0 | – |
| /contact/ | 72.5% | **0%** | 28 | 0 | – |

Wat overblijft zijn namen van lodges en kampen van acht of meer woorden (“Serengeti Sametu Camp by Karibu Camps and Lodges”, “Ole Serai Luxury Camp - Turner Springs by Wellworth”, “Vuma Hills Tented Camp by Foxes Safari Camps”). Dat zijn feitelijke namen die we niet veranderen. De 22 gedeelde footer-zinnen zijn op alle 768 pagina's weg.

De meting is te herhalen met `python3 scripts/check-overlap.py --ours http://localhost:3000` (lokale build) of zonder `--ours` (live site).
