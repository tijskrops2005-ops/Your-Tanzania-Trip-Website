# Eindrapport SEO en eigen inhoud, november 2026

Branch `feature/own-content-seo`, nog niet live. Alle wijzigingen zitten in scripts en `content/own/`; `npm run rebrand && npx astro build` maakt de site opnieuw vanaf de bron.

## 1. Wijzigingen per pagina

| Pagina | Wat er veranderd is | Overlap vóór → ná |
|---|---|---|
| Home `/` | Nieuwe H1 "Tailor-made Tanzania trips with a private guide", title "Tailor-made Tanzania trips & safaris \| Your Tanzania Trip", intro met ons verhaal, blok "Why Your Tanzania Trip" met de beloftes, 8 reiskaarten met eigen teksten en prijsuitleg, Hakuna Matata-blok, partnerblok met juiste Tripadvisor-toewijzing, FAQ-blok (6 vragen) met FAQPage-schema. Google-quotes verborgen. | 50% → 0% |
| 8 reizen (`/itineraries/…`) | Nieuwe intro, "Why this trip", dagbeschrijvingen in eigen woorden (ook op het `/itinerary/`-tabblad), prijsvoetnoot "based on 6 travellers, low season", FAQ-blok met de zes gevraagde vragen, CTA "Request your free travel proposal", title en description, TouristTrip- en FAQPage-schema. | 35–44% → 0–2% |
| `/climbing-kilimanjaro/` | Volledig herschreven (routes, beste tijd, voorbereiding, kosten), "Affordable" uit de title, "climbling" en "Cimbing" gefixt, Kilimanjaro-reisnamen in eigen woorden. | 35,7% → 0% |
| `/great-wildebeest-migration/` | Volledig herschreven, maand-voor-maand en tabel behouden. | 29,7% → 1,1% |
| `/islands/zanzibar-island/` | Herschreven, inclusief excursielijst en lodgekeuzes; typefout "foo" weg. | 40,3% → 0% |
| `/about-us/` (was `/about-tanzania-specialist/`) | Nieuwe pagina: verhaal, drie teamleden met rol en bio (foto's `[INVULLEN]`), twee kantoren, "100+ lodges zelf bezocht", beloftes, Tripadvisor-toewijzing. 301 vanaf het oude pad. | 66,7% → 0% |
| `/hakuna-matata-package/` | Was niet eigen (46,6% gelijk); herschreven, FAQ vernieuwd met FAQPage-schema. | 46,6% → 0% |
| `/faqs/` | Kenia en Oeganda weg, één H1, eigen intro. | 83,3% → 0% |
| `/faqs/tanzania/` | FAQPage-schema uit de 80 zichtbare vragen; title en description. | – |
| `/contact/` | Bankgegevens weg, lege H2 weg, eigen teksten, "Call an expert" herverdeeld. | 72,5% → 0% |
| Alle 768 pagina's | Footer met bedrijfsregel en partnerregel; quizblok, nieuwsbrief en formulierkeuzes in eigen woorden (22 gedeelde zinnen weg); "Why Your Tanzania Trip?"-lijst zonder superlatieven; USP-chips; menu-placeholder weg; alt-teksten; 600px-logo's. | – |

Blog: niet aangepast (jouw keuze). Overige ±500 pagina's: ongewijzigde parafrases.

## 2. Redirects
- `/about-tanzania-specialist/` → `/about-us/` (301).
- Alle 96 bestaande redirects (oude WordPress-URL's en verwijderde pagina's) staan nu als 301 in `vercel.json`; Astro's meta-refresh-pagina's blijven als vangnet.
- Interne links, menu's, breadcrumbs, canonical, JSON-LD en sitemap wijzen naar `/about-us/`.

## 3. Hernoemde bestanden
Nog geen. `docs/rename-list.md` bevat 17 rijen (themamap, bodyclass, 37 uploadbestanden met de oude naam, ongebruikte bestanden) met nieuwe naam en risico; wacht op akkoord.

## 4. Overlap vóór/ná
Zie `docs/overlap-before-after.md`. Doel 0% gehaald op home, Kilimanjaro, Zanzibar, About, Hakuna Matata, FAQ, Contact en 4 van de 8 reizen; de rest 1–2%, uitsluitend lodgenamen van 8+ woorden.

## 5. Lighthouse vóór/ná
Zie `docs/lighthouse.md`. Mobiel: home 60 → 60 (toegankelijkheid 97 → 100, LCP 21,7 → 18,7 s, 1,5 MB minder per pagina door de logo's), reispagina 56 → 59 (SEO 92 → 100, LCP 20,4 → 17,0 s). De grote winst (CSS en JS van het thema, hero-video, lodgefoto's) staat als aanbeveling.

## 6. Schema-validatie
Zie `docs/schema-validation.md`. Vocabulairecheck: 135/135 pagina's schoon. Rich Results Test: home 5 geldige items, 11-daagse 3 geldige items, 0 fouten.

## 7. Meta
Zie `docs/meta-report.md`. 0 pagina's zonder description (was 59), 0 dubbele titles (was 44 pagina's), 42 `/itinerary/`-tabbladen en 3 hulppagina's op noindex, 58 afbeeldingen zonder alt (was ±2.700).

## 8. Nieuwe scripts en bestanden
- `scripts/own-content.mjs` + `content/own/*.json` (34 bestanden): eigen teksten, meta en schema per pagina.
- `scripts/check-overlap.py`, `scripts/check-schema.mjs`, `scripts/alt-text.mjs`, `scripts/lastmod.mjs`.
- `public/llms.txt`, `public/llms-full.txt`, `content/lastmod.json`, `vercel.json` (redirects).
- `src/layouts/BaseLayout.astro`: `lang` en `hreflang` per pagina, klaar voor `/nl/`.

## 9. Alle [INVULLEN]-punten en open vragen

**Zichtbaar op de site**
1. Startjaar van de samenwerking (About; ook `company.foundingDate` voor het schema).
2. Foto en bio van Tijs (About).
3. Foto en bio van Edrian (About).
4. Zakelijk e-mailadres (footer op elke pagina en About; `company.email` en `forms.endpoint` in de tokens).

**In de tokens, niet zichtbaar**
5. `partner.google.reviewUrl`: directe link naar de Google-reviews van Kilimanjaro Nature Tours; tot dan blijven de drie quotes verborgen.
6. `company.sameAs`: Instagram/TikTok/Facebook zodra ze bestaan.
7. Google-reviewlink van Your Tanzania Trip (na het Bedrijfsprofiel).

**Beslissingen**
8. Rename-lijst uitvoeren (`docs/rename-list.md`, rij 2–16)?
9. Quizblok: eigen tekst (nu) of weghalen (de uitslag draaide op WordPress en werkt mogelijk niet meer)?
10. Machame-prijs: "vanaf $2,329" is de 4-persoonsprijs; 6 personen is $2,335,67. Welke is leidend?
11. Nederlandse versie: nee, alleen de kernpagina's, of alles?
12. `/national-parks/masai-mara-national-reserve/` (Kenia) laten vervallen?
13. Twee semi-submarine-excursies met dezelfde description: één eigen zin.
14. Tanzania Specialist: afspraak/licentie voor thema en teksten?
15. `aggregateRating` op de partner-Organization alsnog toevoegen (afgeraden, zie schema-validation.md)?

## 10. Livegang
1. `git checkout main && git merge feature/own-content-seo` (of een pull request), `git push`.
2. Vercel bouwt automatisch; controleer `/about-tanzania-specialist/` (301), `/about-us/`, `/llms.txt`, `/sitemap.xml`.
3. Search Console: sitemap indienen, indexering aanvragen (zie `docs/owner-checklist.md`).
4. Overlapmeting, Rich Results Test en Lighthouse herhalen op de live URL's.
