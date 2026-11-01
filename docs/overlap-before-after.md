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

## Ná

_Volgt na fase 1._
