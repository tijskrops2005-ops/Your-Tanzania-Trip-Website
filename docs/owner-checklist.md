# Checklist voor de eigenaar (november 2026)

Wat alleen jij kunt doen. In volgorde van effect op vindbaarheid.

## 1. Google Bedrijfsprofiel aanmaken
- Ga naar business.google.com en maak een profiel "Your Tanzania Trip".
- Adres: Sluitgatweg 10, 8308 RE Nagele (kies "ik lever aan klanten op hun adres" als je geen bezoekadres wilt tonen; het profiel blijft dan zonder pin, met regio Nederland).
- Categorie: primair **Reisbureau** (Travel agency), secundair **Touroperator** (Tour operator).
- Telefoon +31 6 29351377, website https://yourtanzaniatrip.com, openingstijden (bijv. ma–vr 9–18, za 10–14), WhatsApp als berichtkanaal.
- Foto's: logo, het team, een paar eigen safarifoto's (geen partnerfoto's zonder vermelding).
- Verificatie: per post, video of telefoon; duurt 1–7 dagen. Zonder verificatie is het profiel onzichtbaar.
- Zet daarna de directe reviewlink in `docs/brand-tokens.json` (`company.sameAs`) zodat hij in het Organization-schema komt.

## 2. Reviewverzoek na elke reis
Twee mails (EN en NL), 3–5 dagen na thuiskomst. Twee links: jouw Google-reviewlink `[INVULLEN]` en de Tripadvisor-pagina van de partner (https://www.tripadvisor.com/Attraction_Review-g297913-d12179305-Reviews-Kilimanjaro_Nature_Tours-Arusha_Arusha_Region.html). Vraag eerst om de Google-review (die bouwt jouw naam op), noem Tripadvisor als tweede voor Baraka's team.

**EN**
> Subject: How was Tanzania?
> Hi [name], welcome home. We hope the trip was everything you hoped for. Two small favours, if you have five minutes: a review of Your Tanzania Trip on Google ([link]) helps other travellers find us, and a review of Baraka's team on Tripadvisor ([link]) means a lot to the crew in Arusha. Thank you, and asante sana. Tijs and Edrian

**NL**
> Onderwerp: Hoe was Tanzania?
> Hoi [naam], welkom thuis. We hopen dat de reis was wat je ervan verwachtte. Twee kleine verzoeken als je vijf minuten hebt: een review van Your Tanzania Trip op Google ([link]) helpt andere reizigers ons te vinden, en een review van Baraka's team op Tripadvisor ([link]) betekent veel voor de crew in Arusha. Dank je wel, en asante sana. Tijs en Edrian

## 3. Zakelijk e-mailadres
- Maak info@yourtanzaniatrip.com aan (bij je domein- of mailprovider; Google Workspace of Microsoft 365 is het eenvoudigst).
- Daarna: `company.email` en `forms.endpoint` in `docs/brand-tokens.json` aanpassen, de placeholder `[INVULLEN: e-mail]` in de footer en op About verdwijnt dan vanzelf na `npm run rebrand`.
- Zet SPF, DKIM en DMARC, anders komen je voorstellen in spam.

## 4. Beslissing Tanzania Specialist
- De site gebruikt het maatwerkthema (opmaak, iconen, 2.186 themabeelden) en de structuur van tanzania-specialist.com. De teksten van de belangrijkste pagina's zijn nu eigen (zie `docs/overlap-before-after.md`); de overige ±500 pagina's zijn parafrases, de blogs grotendeels ook.
- Is er een afspraak of licentie met Tanzania Specialist voor thema en teksten? Zo ja: leg die vast. Zo nee: de resterende parafrases herschrijven heeft haast, en juridisch advies over het thema is verstandig. Zie `docs/site-audit-stack.md` §1 en `docs/rename-list.md`.

## 5. Beslissing Nederlandse versie
- De structuur is klaar (`lang` en `hreflang` per pagina in `BaseLayout.astro`), er is nog geen `/nl/`.
- Kies: (a) geen Nederlandse versie, (b) alleen de 8 reizen, home, About en Contact in het Nederlands, (c) alles. Optie (b) is het meeste rendement voor het minste werk.
- Het Nederlandse blogartikel "Safari in Tanzania met kinderen": vertalen naar het Engels onder dezelfde slug, of de basis van een latere `/nl/`.

## 6. Foto's en bio's
- Foto van Tijs, van Edrian, en een recente van Baraka (liggend, min. 1200 px breed, eigen opname of met toestemming).
- 2–3 zinnen bio per persoon: rol, hoe vaak in Tanzania, één persoonlijk detail.
- Startjaar van de samenwerking (`company.foundingDate`).
- Directe link naar de Google-reviews van Kilimanjaro Nature Tours (`partner.google.reviewUrl`); dan verschijnen de drie quotes weer.
- Socialmedia-URL's zodra ze bestaan (`company.sameAs`).

## 7. Search Console
- Voeg https://yourtanzaniatrip.com toe als domein-property (DNS-verificatie via je domeinprovider).
- Dien `https://yourtanzaniatrip.com/sitemap.xml` in.
- Na livegang: "URL-inspectie" → "Indexering aanvragen" voor de home, `/about-us/` en de 8 reizen.
- Controleer na twee weken: dekking (fouten), "Verbeteringen" (structured data), en of `/about-tanzania-specialist/` als 301 wordt gezien.

## 8. Na livegang (door mij, op jouw "ja")
- Overlapmeting herhalen tegen de live site; Rich Results Test met de live URL's; Lighthouse live.
- `docs/rename-list.md` uitvoeren na jouw akkoord (themamap, bestandsnamen).
