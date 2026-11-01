# Schema-validatie (1 november 2026)

Branch `feature/own-content-seo`, lokale build. Twee controles: de schema.org-vocabulairecheck op alle pagina's en de Google Rich Results Test op representatieve pagina's.

## 1. Vocabulairecheck: `scripts/check-schema.mjs`

Controleert per pagina alle `application/ld+json`-blokken tegen het officiële schema.org-vocabulaire (`schemaorg-current-https.jsonld`): bestaat elk `@type`, is elke eigenschap gedefinieerd voor dat type of een bovenliggend type, en verwijzen `@id`-referenties naar een node in dezelfde graph.

```bash
curl -sLo /tmp/vocab.jsonld https://schema.org/version/latest/schemaorg-current-https.jsonld
node scripts/check-schema.mjs /tmp/vocab.jsonld / /about-us/ /itineraries/11-days-safari-trip-tanzania-zanzibar/
```

Uitkomst: **135 van 135 geteste pagina's zonder fouten** (home, alle bovenliggende pagina's, alle 291 reis-URL's voor zover indexeerbaar in de eerste 400 bestanden, eilanden, FAQ's).

Gevonden en verholpen tijdens de check:

| Fout | Pagina's | Oplossing |
|---|---|---|
| `WebSite.potentialAction` met `query-input` (Sitelinks-zoekvak) | alle | Verwijderd. Google toont het sitelinks-zoekvak sinds 2024 niet meer; de zoekfunctie werkt client-side. |
| `Organization.image` verwees naar een relatieve `@id` (`/#/schema/logo/image/`) | alle | Logo-`@id` absoluut gemaakt (`https://yourtanzaniatrip.com/#/schema/logo/image/`). |
| Alle Yoast-URL's en `@id`'s waren site-relatief (`/#website`, `/itineraries/…/`) | alle | `fixJsonLd()` maakt `@id`, `url`, `item`, `target`, `thumbnailUrl` en `contentUrl` absoluut. |

## 2. Google Rich Results Test (code-invoer)

De pagina's staan nog niet live, dus de JSON-LD is als code getest.

| Pagina | Resultaat | Gedetecteerd | Opmerkingen |
|---|---|---|---|
| `/itineraries/11-days-safari-trip-tanzania-zanzibar/` | 3 geldige items, 0 fouten, 0 waarschuwingen | Breadcrumbs, Lokale bedrijven (Organization met adres), Organisatie | Test-id `kY_FgD4QwsZmlElHY2zufg`. FAQPage en TouristTrip worden geparsed maar niet als rich result gemeld: FAQ-rich results toont Google sinds augustus 2023 alleen nog voor overheids- en gezondheidssites; TouristTrip is geen rich-result-type. Beide blijven nuttig als gestructureerde data voor Google en AI-zoekmachines. |
| `/` (home) | 5 geldige items, 0 fouten, 2 niet-kritieke meldingen | Breadcrumbs, Lokale bedrijven (2), Organisatie (2: Your Tanzania Trip en Kilimanjaro Nature Tours) | Test-id `oYktnM14f1aou48kXtWNeQ`. De twee meldingen zitten op de partner-node: optionele velden `streetAddress` en `postalCode` ontbreken. Kilimanjaro Nature Tours heeft een postbusadres (P.O. Box 611, USA River, Arusha); we verzinnen geen straat. |
| `/faqs/tanzania/` | niet apart in de RRT getest (invoer van 48 KB); vocabulairecheck geslaagd | FAQPage met 80 vragen, letterlijk gelijk aan de zichtbare accordeon | Dezelfde generator als de FAQPage op de home en de reizen, die wel door de RRT zijn gegaan. |

Na livegang: dezelfde URL's nogmaals testen met de URL-invoer van de Rich Results Test en in Search Console onder "Verbeteringen" volgen.

## 3. Wat er per paginatype in de JSON-LD staat

- **Alle pagina's:** `WebPage` (naam en beschrijving gelijk aan title en meta description), `BreadcrumbList`, `WebSite`, `Organization` Your Tanzania Trip (legalName, adres, telefoon, `vatID`, `founder` Tijs Krops en Edrian Waterman, `areaServed` Tanzania, `contactPoint` Engels/Nederlands; `foundingDate`, `email` en `sameAs` volgen zodra ze in `docs/brand-tokens.json` staan).
- **Home, About, `/our-partner/`:** extra `Organization` voor Kilimanjaro Nature Tours (adres, telefoon, e-mail, oprichter, Tripadvisor- en YouTube-link), gekoppeld via `WebPage.mentions`. Geen `aggregateRating`: Google accepteert alleen beoordelingen die op de site zelf zijn verzameld; de Tripadvisor-score staat met bron en datum in de `description`.
- **8 reispagina's:** `FAQPage` (6 vragen, gelijk aan het zichtbare blok) en `TouristTrip` (naam, beschrijving, `touristType`, `provider`, `itinerary` als `ItemList` van `TouristDestination` per dag, `offers` met vanaf-prijs en `UnitPriceSpecification` "per person, based on 6 travellers, low season, excluding international flights").
- **Home, Hakuna Matata, `/faqs/tanzania/`:** `FAQPage` uit de zichtbare vragen.
- **Blogs:** ongewijzigd (`Article` + `Person` van de oude export, met de gecorrigeerde Organization).
