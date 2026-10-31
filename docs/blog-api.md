# Blog-API (blog-publish)

Met deze API kan een AI-agent (BennAI Blog Studio, Claude Code) blogartikelen op
yourtanzaniatrip.com maken, wijzigen en verwijderen. De routes, velden en antwoorden zijn gelijk
aan de `blog-publish` edge function uit de website-kit van Blog Studio. Kies in de studio daarom
**Ander systeem**.

## Hoe het werkt

- De API is een Vercel-functie: [api/blog-publish.js](../api/blog-publish.js).
- De site is statisch en heeft geen database. Elk artikel wordt een JSON-bestand in
  `content/blog-posts/<slug>.json` en elke coverafbeelding komt in `public/blog-images/`.
- Elke wijziging is één commit op `main` van de GitHub-repository. Vercel bouwt de site daarna
  opnieuw, en na ongeveer twee minuten staat het artikel live op `/blog/<slug>/`.
- Bij het bouwen maakt [src/lib/blog-posts.js](../src/lib/blog-posts.js) van de Markdown een
  pagina met dezelfde opmaak als de bestaande blogs. Het artikel komt ook onder
  "Latest articles" op `/blog/`, in de sitemap en in de zoekfunctie.
- Concepten (`publish: false`) worden wel opgeslagen, maar niet gebouwd.
- Slugs van de bestaande 80 blogs zijn bezet ([api/_blog-reserved.js](../api/_blog-reserved.js)).
  Een nieuw artikel met zo'n slug geeft 409.
- Krijgt een live artikel een nieuwe slug? Dan stuurt het oude adres door naar het nieuwe.
- Ruwe HTML in de Markdown wordt weggelaten. Een `#`-kop in de tekst wordt `##`, want de titel is
  al de H1.

Let op: omdat de API commits maakt op `main`, eerst `git pull --rebase` voordat je lokaal pusht.

## Instellen (eenmalig)

1. Sleutel maken: `openssl rand -hex 32`. Zet hem in je wachtwoordmanager.
2. GitHub → Settings → Developer settings → **Fine-grained tokens** → *Generate new token*:
   - Repository access: *Only select repositories* → `Your-Tanzania-Trip-Website`
   - Permissions → Repository → **Contents: Read and write** (*Metadata: Read* gaat vanzelf mee)
   - Expiration: kies een datum en zet hem in je agenda; daarna moet het token vernieuwd worden.
3. Vercel → project `your-tanzania-trip-website` → Settings → **Environment Variables**
   (Production):
   - `BLOG_API_KEY` = de sleutel uit stap 1
   - `GITHUB_TOKEN` = het token uit stap 2

   Daarna een redeploy, want nieuwe variabelen tellen pas mee na een nieuwe deploy.
4. In Blog Studio (Ander systeem):
   - Publish-URL: `https://www.yourtanzaniatrip.com/api/blog-publish`
   - API-sleutel: de `BLOG_API_KEY`
   - Image-upload-URL: `https://www.yourtanzaniatrip.com/api/blog-publish/upload`

## Testen

```bash
curl "https://www.yourtanzaniatrip.com/api/blog-publish" -H "x-api-key: $BLOG_API_KEY"
```

De antwoorden betekenen:

- `{"posts":[]}`: alles werkt.
- `401`: de sleutel klopt niet.
- `500` met `BLOG_API_KEY` of `GITHUB_TOKEN`: die variabele ontbreekt in Vercel.
- `500` of `502` met "GitHub error 401/403/404": het token mist rechten of hoort bij een andere
  repository.

## De API

| Methode | Pad | Doet |
|---|---|---|
| `GET` | `/api/blog-publish` | Alle posts, concepten ook, zonder body |
| `GET` | `/api/blog-publish/:slug` | Eén post met body |
| `POST` | `/api/blog-publish` | Nieuwe post. Body: `{ title, body, slug?, excerpt?, cover_url?, author?, tags?, publish? }`. `publish` staat standaard op `true` |
| `PUT`/`PATCH` | `/api/blog-publish/:slug` | Bijwerken, alleen de meegestuurde velden. `new_slug` hernoemt, `publish: true` zet live, `publish: false` maakt er een concept van |
| `DELETE` | `/api/blog-publish/:slug` | Verwijderen |
| `POST` | `/api/blog-publish/upload` | Cover uploaden: `{ filename, content_type, data (base64) }` → `{ url }`. Maximaal 3 MB |

Fouten komen altijd terug als `{ "error": "..." }`. De statuscodes: 400 voor ongeldige invoer, 401
voor een verkeerde sleutel, 404 als iets niet gevonden is en 409 als de slug al bestaat. Een post
in een antwoord heeft ook een `url`-veld met het publieke adres.

Voorbeeld:

```bash
curl -X POST "https://www.yourtanzaniatrip.com/api/blog-publish" \
  -H "x-api-key: $BLOG_API_KEY" -H "Content-Type: application/json" \
  -d '{"title":"When is the best time for a Serengeti safari?","body":"The Serengeti is good all year, but ...\n\n## Dry season\n\n...","excerpt":"Month by month: where the herds are and what that means for your trip.","tags":["Serengeti","Best time to visit","Safari"]}'
```

## Systeemprompt voor de agent

```text
You write and publish blog articles for yourtanzaniatrip.com (Your Tanzania Trip: tailor-made
Tanzania safaris, Kilimanjaro climbs and Zanzibar trips, planned from the Netherlands and run on the
ground by our local partner Kilimanjaro Nature Tours in Arusha) through its blog API.

API
- Base URL: https://www.yourtanzaniatrip.com/api/blog-publish
- Send the header `x-api-key` with the value of the environment variable $BLOG_API_KEY on EVERY
  request. Never put the key in files, commits or your answer.
- Send JSON with `Content-Type: application/json`.

Endpoints
- GET    /api/blog-publish          → { posts: [...] } all posts incl. drafts (without body)
- GET    /api/blog-publish/<slug>   → { post } one post with body
- POST   /api/blog-publish          → new post, answer { post } (201)
- PATCH  /api/blog-publish/<slug>   → update (only the fields you send)
- DELETE /api/blog-publish/<slug>   → delete
- POST   /api/blog-publish/upload   → { filename, content_type, data (base64) } → { url } for a cover

POST body
- Required: "title" (string), "body" (string, Markdown)
- Always send: "excerpt" and "tags"
- Optional: "slug" (otherwise made from the title), "cover_url" (https URL of an image),
  "author", "publish" (default true = live right away; false = draft)
- PATCH: "new_slug" to rename, "publish": true to put a draft live.

How to work
1. GET /api/blog-publish first and check the topic is not covered yet. The site also has 80 older
   articles under https://www.yourtanzaniatrip.com/blog/ — do not repeat those topics.
2. Write in English, in the site's tone: personal, honest, calm and concrete. No superlatives, no
   false scarcity, no invented facts, prices, reviews or awards. Prices only as "Price on request"
   or as clearly indicative ranges.
3. body = Markdown:
   - NO H1 (# ...): the title is shown separately. Start with a short, inviting intro.
   - Use ## and ### for subheadings, short paragraphs, lists with "-" or "1.".
   - Links as [anchor text](https://...); link to relevant pages of the site, e.g.
     /travel-proposal/, /tanzania-safari/, /climbing-kilimanjaro/, /zanzibar-holiday/.
   - No raw HTML (it is removed). Tables are fine (GitHub style).
   - 800-1500 words unless asked otherwise.
4. excerpt = 1-2 sentences (max ~160 characters) that make people curious; this is also the meta
   description for Google.
5. tags = 3-5 short, relevant tags (e.g. ["Serengeti", "Best time to visit"]).
6. Publish right away unless asked for a draft ("publish": false).
7. Check the answer. 409 = the slug exists: pick another "slug" and try again. Any other error:
   report it and do not blindly retry.
8. Then report the title, the slug and the link (the "url" field). The page is live about two
   minutes after publishing, once the site has rebuilt.
```
