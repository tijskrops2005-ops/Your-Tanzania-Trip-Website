# CLAUDE.md — BennAI Frontend Regels

## Altijd als eerste doen
- **Laad de `frontend-design` skill** vóór het schrijven van frontend code, elke sessie, geen uitzonderingen.

## Referentie-afbeeldingen
- Als er een referentie-afbeelding is: kopieer de layout, spacing, typografie en kleuren exact. Gebruik placeholder-content (`https://placehold.co/` voor afbeeldingen, generieke tekst). Verbeter of voeg niets toe aan het ontwerp.
- Als er geen referentie is: ontwerp from scratch met hoge kwaliteit (zie guardrails hieronder).
- Maak een screenshot, vergelijk met de referentie, herstel afwijkingen, maak opnieuw een screenshot. Doe minimaal 2 vergelijkingsrondes. Stop alleen als er geen zichtbare verschillen meer zijn of als Rick het zegt.

## Lokale server
- **Altijd serveren via localhost** — maak nooit een screenshot van een `file:///` URL.
- Start de dev server: `node serve.mjs` (serveert de projectroot op `http://localhost:3000`)
- `serve.mjs` staat in de projectroot. Start het op de achtergrond vóór screenshots.
- Als de server al draait, start dan geen tweede instantie.

## Screenshot workflow
- Puppeteer is geïnstalleerd op `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache staat op `C:/Users/nateh/.cache/puppeteer/`.
- **Altijd screenshotten via localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots worden automatisch opgeslagen in `./temporary screenshots/screenshot-N.png` (auto-incrementeel, nooit overschreven).
- Optioneel label: `node screenshot.mjs http://localhost:3000 label` → slaat op als `screenshot-N-label.png`
- `screenshot.mjs` staat in de projectroot. Gebruik het zoals het is.
- Na het screenshotten, lees de PNG uit `temporary screenshots/` met de Read tool — Claude kan de afbeelding direct bekijken en analyseren.
- Wees specifiek bij vergelijkingen: "heading is 32px maar referentie toont ~24px", "card gap is 16px maar moet 24px zijn"
- Check: spacing/padding, font size/gewicht/line-height, kleuren (exacte hex), uitlijning, border-radius, schaduwen, afbeeldingsformaten

## Output standaarden
- Één `index.html` bestand, alle stijlen inline, tenzij Rick anders aangeeft
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder afbeeldingen: `https://placehold.co/BREEDTExHOOGTE`
- Mobile-first responsive

## BennAI Brand Assets
- Controleer altijd de `brand_assets/` map vóór het ontwerpen. Deze kan logo's, kleurengidsen, stijlgidsen of afbeeldingen bevatten.
- Als er assets aanwezig zijn, gebruik ze dan. Gebruik geen placeholders waar echte assets beschikbaar zijn.
- Als er een logo aanwezig is, gebruik het. Als er een kleurenpalet is gedefinieerd, gebruik exact die waarden — verzin geen merkkleuren.
- **BennAI huisstijl:** Donker, modern, tech-forward. Denk aan diepzwart/antraciet als basis, met een scherpe accentkleur (controleer `brand_assets/` voor exacte waarden). Uitstraling: premium, betrouwbaar, Dutch AI authority.

## Anti-generieke guardrails
- **Kleuren:** Gebruik nooit het standaard Tailwind-palet (indigo-500, blue-600, etc.). Kies een aangepaste BennAI brandkleur en leid van daaruit af.
- **Schaduwen:** Nooit vlakke `shadow-md`. Gebruik gelaagde, kleurgetinte schaduwen met lage opacity.
- **Typografie:** Nooit hetzelfde font voor headings en body. Combineer een display/serif met een strak sans-serif. Pas strakke tracking toe (`-0.03em`) op grote headings, ruime line-height (`1.7`) op body.
- **Gradients:** Laag meerdere radiale gradients. Voeg grain/textuur toe via SVG noise filter voor diepte.
- **Animaties:** Animeer alleen `transform` en `opacity`. Nooit `transition-all`. Gebruik spring-stijl easing.
- **Interactieve states:** Elk klikbaar element heeft hover-, focus-visible- en active-states. Geen uitzonderingen.
- **Afbeeldingen:** Voeg een gradient overlay toe (`bg-gradient-to-t from-black/60`) en een kleurbehandelingslaag met `mix-blend-multiply`.
- **Spacing:** Gebruik bewuste, consistente spacing tokens — geen willekeurige Tailwind-stappen.
- **Diepte:** Vlakken moeten een lagensysteem hebben (basis → verhoogd → zwevend), niet allemaal op hetzelfde z-vlak.

## Harde regels
- Voeg geen secties, features of content toe die niet in de referentie staan
- "Verbeter" een referentieontwerp niet — kopieer het
- Stop niet na één screenshot-ronde
- Gebruik geen `transition-all`
- Gebruik geen standaard Tailwind blauw/indigo als primaire kleur
- Schrijf alle commentaar en variabelenamen in het Engels, maar communiceer met Rick in het Nederlands

---

## Brand Style Guide (bindend voor alle ontwerp- en contentwerk)
- **Richting van de eigenaar (2026-10-23):** de site blijft de nagebouwde Tanzania Specialist-site (eigen site van de eigenaar), omgebouwd naar Your Tanzania Trip. **Bijlage B van de gids (het bouwprompt dat alles van Tanzania Specialist wil verwijderen en opnieuw bouwen) wordt níet uitgevoerd.** Gebruik de gids voor merkfeiten (logo, bedrijfsgegevens, naamgebruik, toon) en alleen voor verdere ontwerpwijzigingen als de eigenaar daar expliciet om vraagt.
- Bron: `docs/brand-style-guide.pdf` (v1.0, oktober 2026). Tekstversie: `docs/brand-style-guide.md`. Tokens: `docs/brand-tokens.json`. Logo's en iconen: `public/brand/`. Lees de tekstversie vóór elk ontwerp- of contentwerk; bij verschil wint de PDF.
- Kleuren: Forest `#20281B` (tekst, header/footer) · Copper `#A83800` (knoppen, links; hover Copper Dark `#8C2F00`) · Sunset Gold `#E69016` (accenten, iconen) · Mountain `#355248` (secundaire vlakken) · Savanna Sand `#DCC496` (randen, zachte panelen) · Ivory `#FAF6EC` (pagina-achtergrond) · Amber `#FCAB2A` (alleen in zonsondergang-verloop) · White (kaarten, velden). Nooit fel olijfgroen of mosterdgeel. Geen kleine copper-tekst op sand (3.8:1).
- Typografie: Marcellus (koppen; display 56, H1 40, H2 28) en Inter (H3 20 SemiBold, body 17 / regelhoogte 1.6, klein 13, labels 12–13 SemiBold hoofdletters 0.15em). Koppen in zinsopbouw-hoofdletters, geen zware condensed all-caps.
- Componenten: knoppen en velden 8px radius, kaarten 12px, sand-rand, zachte schaduw. Eén copper primaire knop per scherm. Focus = forest-rand + 2px gold ring. Links copper, onderstreept. Eén outline-iconenset (Lucide) in forest of gold, 1.5px.
- Logo: `logo-primary.png` in de header (op licht), `logo-reversed.png` in de footer (op donker); hoogte 56–64px desktop, 44px mobiel; min. 160px breed; nooit uitrekken, verkleuren, draaien of effecten; alt "Your Tanzania Trip". Nooit samen met het KNT-logo als één merk.
- Toon: persoonlijk, eerlijk, rustig, concreet. Nederlands altijd "je/jouw", nooit "u". Vaste termen: reis, reisprogramma, offerte, Plan je reis, Prijs op aanvraag. Geen superlatieven, geen nepschaarste.
- Bedrijf: Tijs Krops, Sluitgatweg 10, 8308 RE Nagele · KvK 97223344 · BTW NL005256557B94 · info@yourtanzaniatrip.com · +31 6 29351377. WhatsApp, tagline en reisgarantie zijn nog `[FILL]`. Partner: Kilimanjaro Nature Tours, Arusha (Baraka Dalali).
- Eerlijkheid: reviews alleen per bron met datum en link; nooit geleende scores of awards; prijzen alleen na bevestiging door de partner; geen AggregateRating/Review-schema op partnerscores; alleen eigen of gelicentieerde foto's.

## Project: Your Tanzania Trip (gaat voor op de regels hierboven)
- Doel: de bestaande site (eigendom van de gebruiker, oorspronkelijk tanzania-specialist.com) één-op-één behouden (indeling, pagina's, reizen, foto's, teksten, vormen zoals penseelranden en fotomaskers) en omgebouwd naar het merk **Your Tanzania Trip** (yourtanzaniatrip.com) volgens de brand style guide: kleuren, fonts (Marcellus + Inter), logo's, bedrijfsgegevens. De reviews/awards/lidmaatschappen van de oude exploitant zijn vervangen door de lokale partner Kilimanjaro Nature Tours (score met bron en datum, partnersectie op home, pagina `/our-partner/`).
- Stack: Astro (statische site). Content komt uit `content/` (gegenereerd met `npm run sync`), gedeelde header/footer in `src/partials/`, thema-CSS/JS en afbeeldingen in `public/wp-content/`.
- Rebranding gebeurt uitsluitend via scripts, nooit in gegenereerde bestanden: `scripts/rebrand.mjs` (tekst, header/footer, partnerpagina's, JSON-LD, redirects) en `scripts/brand-theme.mjs` (kleuren en fonts in de thema-CSS en gekleurde assets, vanaf `.cache/theme-original/`), plus `src/styles/brand.css` voor contextkleuren (header ivory, footer forest, links copper). `npm run rebrand` = extract → rebrand → brand-theme; daarna `npx astro build`.
- Alle merkfeiten komen uit `docs/brand-tokens.json` (`company`, `partner`, `color`). Niet verzonnen: wat ontbreekt staat als zichtbare `[FILL: …]`-plaatshouder (klasse `fill-marker`) tot de eigenaar het aanlevert. Zie `TODO-OWNER.md`.
- Een losse, originele Next.js-versie van de site (ander ontwerp, partner Kilimanjaro Nature Tours) staat buiten dit project in `../Safari website - NEXT BUILD (archive)/`.
- Screenshots: `node screenshot.mjs http://localhost:3000/ label` (server: `node serve.mjs` na `npx astro build`).
