# Lighthouse (mobiel) vóór en ná

Lighthouse 13.6, mobiele emulatie met standaardthrottling, headless Chrome, 1 november 2026. "Vóór" is de `main`-branch (lokaal gebouwd en geserveerd op poort 3100), "ná" is `feature/own-content-seo` na fase 4 (poort 3000). Beide lokaal, dus zonder CDN; live zijn de absolute tijden lager, de verhoudingen gelijk.

| Pagina | | Performance | Toegankelijkheid | Best practices | SEO | FCP | LCP | CLS | TBT | Speed Index | Totaal gewicht |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Home | vóór | 60 | 97 | 96 | 100 | 6,0 s | 21,7 s | 0,008 | 60 ms | 6,0 s | 3.759 KB |
| Home | ná | 60 | **100** | 96 | 100 | 6,0 s | **18,7 s** | 0,003 | 40 ms | 6,3 s | **3.233 KB** |
| 11 Days Safari & Zanzibar | vóór | 56 | 96 | 96 | 92 | 10,7 s | 20,4 s | 0,003 | 50 ms | 10,7 s | 11.930 KB |
| 11 Days Safari & Zanzibar | ná | 59 | 96 | 96 | **100** | 6,8 s | **17,0 s** | 0,006 | 30 ms | 6,8 s | 11.687 KB |

## Wat er in fase 4 is gedaan

- **Logo's:** de header laadde `logo-primary.png` van 644 KB (1888×732) en de footer `logo-reversed.png` van 1,1 MB. Nu de 600px-versies uit de logokit (98 KB en 136 KB). Scheelt 1,5 MB op elke pagina.
- **HTML-compressie** van Astro aangezet (`compressHTML: true`). Effect klein: de HTML was al compact.
- **Alt-teksten** op vrijwel alle afbeeldingen (toegankelijkheid home 97 → 100).
- **JSON-LD** absoluut en zonder zoekactie; SEO-score reispagina 92 → 100 (de 92 kwam van de ontbrekende/dubbele title en description van tabbladen en ongeldige structured data).

## Waar het gewicht zit (reispagina, 378 KB HTML)

| Onderdeel | Omvang |
|---|---|
| Accommodatie-carrousels (mobiel én desktop per dag, 12 blokken) | 148 KB |
| Inline SVG-iconen | 44 KB |
| Inline scripts (FacetWP-data, thema-init) | 39 KB |
| Header met desktop- en mobiel menu | 29 KB |
| Footer met formulieren en quiz | 24 KB |
| `srcset`-attributen | 12 KB |
| JSON-LD | 8 KB |
| HTML-commentaar | 4 KB |

Buiten de HTML: `app.css` 529 KB (render-blocking, 596–613 KB "ongebruikt" volgens Lighthouse), `app.js` 690 KB, de hero-video `safari-loop.mp4` 3,7 MB op reispagina's, en lodgefoto's van 500 KB tot 1,6 MB (`Ole-serai-turner-springs-1.jpg`).

## Aanbevelingen (niet gedaan; elk vraagt testen)

1. **CSS opschonen** (grootste winst voor FCP/LCP): `app.css` met PurgeCSS/UnoCSS terugbrengen tot de gebruikte klassen. Risico: Alpine-`:class`-bindingen en JS-gegenereerde markup; een safelist en visuele regressietests nodig (de `screenshot.mjs`-reeks + `compare.mjs`).
2. **Hero-video** op reispagina's alleen laden boven `lg` of vervangen door de poster op mobiel.
3. **Lodgefoto's** door een vaste maat halen (max. 1600 px, WebP/AVIF, ~150 KB); de grootste staan in de accommodatie-carrousels.
4. **`app.js`** splitsen: jQuery en de carrouselcode alleen op pagina's die ze gebruiken.
5. **Carrousels:** één markup voor mobiel en desktop (nu twee kopieën per dag).

Herhalen: `npx lighthouse http://localhost:3000/ --output=json --chrome-flags="--headless=new"` met `CHROME_PATH` naar de Puppeteer-Chrome.
