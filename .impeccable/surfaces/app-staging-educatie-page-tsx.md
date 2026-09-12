---
version: 1
slug: "app-staging-educatie-page-tsx"
primary_target: "app/staging/educatie/page.tsx"
related_targets: ["app/staging/educatie/EducatieStaging.tsx","lib/education-data.ts"]
---

Scope: de educatiepagina, /staging/educatie, vijfde en laatste hoofdsurface van de rework. Visitor mode: Read.

Audience: wie iets wil begrijpen en zelf bepaalt hoe diep. Job: astronomie leren op het eigen peil, dwars door de vakken heen. Constraints: AdSense blijft, wereld uit DESIGN.md, chrome uit shared.tsx, inhoud uit lib/education-data.ts.

## Direction contract

THESIS: het leesniveau is de pagina, niet een knopje erin. Eén keuze bovenaan herschrijft alle zes onderwerpen tegelijk. Weigert de kaartenrij met een niveauschakelaar per kaart, waarin het mechanisme een feature blijft in plaats van de structuur.

OWN-WORLD: ongewijzigd uit DESIGN.md. De ladder die elders een markering is, wordt hier de navigatie: drie treden, elk met zijn eigen laddermarkering, plakkend onder de kop.

STORY: de bezoeker kiest zijn diepte, leest het onderschrift dat zegt wat dat niveau betekent, en scrollt langs zes onderwerpen die allemaal op die diepte staan. Begrippen staan bij de tekst, kernfeiten en bronnen ernaast. De keuze blijft bewaard voor het volgende bezoek en geldt ook op artikelpagina's.

FIRST VIEWPORT: staging-balk, kop, de ladderbalk met drie treden. Bandkop 'Leren op jouw niveau' met het actieve niveau en het aantal onderwerpen, daaronder het onderschrift van dat niveau. Dan de eerste lesplaat: plaatnummer, onderwerp, kernconcept, de uitleg, de begrippenchips, en in de zijkolom kernfeiten en bronnen.

FORM: de niveauladder, kandidaat 3 van zeven gegronde structuren (drie afdrukken, leestafel, niveauladder, begrippenindex, collegerooster, vergelijkingsplaat, kaartenbak). Gedeeld 3/2/6 door seed 701da019, scope surface, mode read; de gebruiker vergrendelde de leidende kaart.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Opgelost tijdens de bouw: de zeven begrippen stonden eerst gestapeld in de zijkolom. Dat maakte die kolom 639px hoog tegen een tekstkolom van ~240px, met 371 tot 423px leegte op elk niveau — de Pro-tekst is namelijk maar 388 tekens tegen 271 voor Beginner, dus langere tekst redde het niet. Nu een chiprij onder de tekst met één gedeeld uitlegpaneel: leegte terug naar 26–78px.
