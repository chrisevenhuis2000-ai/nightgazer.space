---
version: 1
slug: "app-staging-sterrenkijken-page-tsx"
primary_target: "app/staging/sterrenkijken/page.tsx"
related_targets: ["app/staging/sterrenkijken/SterrenkijkenStaging.tsx","lib/sky-data.ts"]
---

Scope: de sterrenkijkpagina, /staging/sterrenkijken, ter beoordeling naast de andere twee staging-surfaces. Visitor mode: Operate.

Audience: de waarnemer die een kijkavond plant. Job: beslissen wanneer hij gaat, waarheen, en waarnaar hij kijkt — in die volgorde, want bewolking beslist vaker dan afstand. Constraints: AdSense blijft, de wereld uit DESIGN.md ligt vast, chrome uit shared.tsx, data uit lib/sky-data.ts.

## Direction contract

THESIS: lees de beste nacht van de tabel af, zoals uit een ephemeris. Weigert de rij losse weerkaarten: zeven nachten horen onder elkaar zodat je ze kunt vergelijken, niet naast elkaar zodat je moet scrollen.

OWN-WORLD: ongewijzigd uit DESIGN.md. Toevoeging is één markeringsregel: de beste nacht krijgt de chinagraph-ring om zijn rij, dezelfde ring als om de plaat van vandaag op de voorpagina. Bortle en zwermkwaliteit zijn gevulde blokjes, geen sterren of kleurbadges.

STORY: de bezoeker ziet het oordeel voor vannacht met de factoren die het maken, vergelijkt zeven nachten in één tabel, kiest daarna een donkere plek op afstand, en sluit af met wat er deze maand boven staat.

FIRST VIEWPORT: staging-balk, kop, locatiebalk met plaatskeuze en GPS. Daaronder bandkop 'Kan ik vannacht kijken?' met de datum. Dan het tweeluik: verdict-paneel links (score /10, meter, zes factorregels), ephemeris rechts (zeven rijen × nacht, bewolking, maan, wind, oordeel) met de ring om de beste nacht en een regel die het venster in woorden noemt.

FORM: de belichtingstabel, kandidaat 7 van zeven gegronde structuren (waarnemingsjournaal, planisfeer, veldkaart, barograafrol, drieluik, vertrekchecklist, belichtingstabel). Gedeeld 7/3/2 door seed 312c3bfd, scope surface, mode operate; de gebruiker vergrendelde de leidende kaart.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Opgelost tijdens de bouw: CARTO stempelt sinds kort "API KEY REQUIRED" over elke tegel, waardoor de dark-sky kaart ook op de live pagina onbruikbaar was. Nu OpenStreetMap met een omkeer-filter.

Bewust gelaten: de kaartmarkers houden hun Bortle-kleurschaal. Dat is de enige plek op de site waar een kleurramp een meetschaal draagt met een legenda ernaast, en DarkSkyMap wordt gedeeld met de live pagina.
