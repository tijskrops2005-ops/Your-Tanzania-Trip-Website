# Leadtool (zakelijk): reisbureaus, reisbloggers, travel-creators

Zoekt via Apify zakelijke contactgegevens voor partnerschappen en samenwerkingen. Het resultaat is een CSV-bestand. De tool is alleen bedoeld voor zakelijke contacten, niet voor particulieren (zie "Mailen" hieronder).

## Starten

```bash
npm run leads -- agencies --market nl --city Utrecht
npm run leads -- bloggers --market nl
npm run leads -- creators --market nl
npm run leads -- all --market nl,be,de --limit 20
```

| Optie | Standaard | Betekenis |
|---|---|---|
| `agencies` | | Reisbureaus en touroperators uit Google Maps, met e-mail en socials van hun eigen website |
| `bloggers` | | Reisblogs over safari en Afrika (Google), met contactgegevens van de site |
| `creators` | | Instagram-accounts uit reis-hashtags in de taal van het land, met contactgegevens via hun link in bio. Reisbedrijven komen als `agency` in de lijst |
| `--market` | `nl` | `nl be de ch gb us se dk no fr es it` (komma-gescheiden) of `all`, in die volgorde |
| `--limit` | `30` | Reisbureaus per zoekterm, of het aantal sites/profielen per land |
| `--city` | – | Alleen bij `agencies`: zoek in één stad in plaats van het hele land (sneller en goedkoper) |
| `--minFollowers` | `1000` | Minimumaantal volgers voor creators |
| `--budget` | `0.5` | Maximaal aantal dollar per Apify-run (Apify accepteert minimaal $0,50) |

Zoektermen en hashtags per land staan in [markets.mjs](markets.mjs).

## Uitkomst

- `leads/leads.csv`: alle leads, zonder dubbele (gecontroleerd op e-mail, domein en Instagram). Vul zelf de kolom `status` in, bijvoorbeeld `gemaild`, `reactie`, `partner` of `opt-out`. Deze rijen worden nooit overschreven en een `opt-out` komt nooit opnieuw in de lijst.
- `leads/<datum>-<soort>-<landen>.csv`: alleen de nieuwe leads van die run.
- De map `leads/` staat niet in git.

Openen in Excel: Data → Uit tekst/CSV, scheidingsteken komma. Google Sheets opent het bestand direct.

## Kosten (gratis plan: $5 per maand)

Gemeten op 29-10-2026:

- Reisbureaus: ongeveer $0,006 per reisbureau.
- Blogs: ongeveer $0,015 per site.
- Creators: ongeveer $0,02 tot $0,03 per profiel.

Bij elke start laat de tool zien hoeveel tegoed er deze maand al op is.

## Mailen (AVG en Telecommunicatiewet)

- Mail alleen zakelijke adressen (info@, partner@ of het samenwerkingsadres van een creator) met een zakelijk voorstel. Stuur geen nieuwsbrief.
- Zet in je eerste mail wie je bent, waar je het adres hebt gevonden (`source_url`) en dat je geen mail meer stuurt als de ontvanger dat aangeeft. Zet de status dan op `opt-out`.
- Voeg leads niet toe aan een mailinglijst zonder toestemming.
