---
version: 1
slug: "app-staging-nieuws-page-tsx"
primary_target: "app/staging/nieuws/page.tsx"
related_targets: ["app/staging/nieuws/NieuwsStaging.tsx","app/staging/shared.tsx"]
---

Scope: het nieuwsarchief, /staging/nieuws, ter beoordeling naast /staging voordat het app/nieuws vervangt. Visitor mode: Read.

Audience: de lezer die weet wat hij zoekt (onderwerp, niveau, of gewoon 'wat is nieuw'), plus de binnenkomer vanaf een artikel die verder wil. Job: uit 873 platen de juiste vinden zonder te scrollen. Constraints: AdSense blijft, de wereld uit DESIGN.md ligt vast, chrome komt uit shared.tsx.

## Direction contract

THESIS: het archief is een kast en onderwerpen zijn laden. Weigert het oneindige kaartenraster: navigatie zit in de rail, niet in de scroll.

OWN-WORLD: ongewijzigd overgenomen uit DESIGN.md. Geen nieuwe tokens, geen nieuwe kleuren. De enige toevoeging is een gedragsregel: de open lade schuift fysiek uit de kast (padding-left 18px -> 24px) met een 2px cyaan greep, in plaats van een kleurbadge te dragen.

STORY: de lezer ziet hoeveel het archief heeft, kiest een lade, en leest ingangen met plaatnummer, beeld, kop, inleiding en envelopregel. Kruisen met niveau en snelfilter blijft mogelijk; elke telling volgt de versmalde voorraad.

FIRST VIEWPORT: staging-balk, kop, snelbalk. Daaronder bandkop 'Het nieuwsarchief' met totaal. Dan de kast: rail links (232px, plakkend onder kop+snelbalk) met Laden, Niveau en Elders; blad rechts met ladekop, omschrijving uit lib/topics.ts, randlineaal en de eerste twintig ingangen.

FORM: de ladenbank, kandidaat 3 van zeven gegronde structuren (contactafdruk, dagregister, ladenbank, vergrotingstafel, dubbele kolom, kaartcatalogus, lichtbak-wand). Gedeeld 3/7/5 door seed cb8310ef, scope surface, mode read; de gebruiker vergrendelde de leidende kaart.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Opgelost tijdens de bouw: 60% van het archief had geen inleiding terwijl de body-tekst wel bestond. scripts/generate-index.js leidt die nu af uit de eerste alinea; dat raakt ook de live homepage en /nieuws.

Onopgelost: koppen en inleidingen komen Engelstalig binnen van NASA/ESA, terwijl de site Nederlands belooft. Zichtbaarder nu de inleidingen getoond worden.
