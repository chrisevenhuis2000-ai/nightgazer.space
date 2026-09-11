---
version: 1
slug: "app-staging-missies-page-tsx"
primary_target: "app/staging/missies/page.tsx"
related_targets: ["app/staging/missies/MissiesStaging.tsx","lib/mission-schedule.ts"]
---

Scope: de missiepagina, /staging/missies, vierde surface naast archief, nieuws en sterrenkijken. Visitor mode: Read.

Audience: wie wil weten wat er omhoog gaat en wat er nu vliegt. Job: het ritme van een lanceerjaar zien en de eerstvolgende vluchten vinden. Constraints: AdSense blijft, wereld uit DESIGN.md, chrome uit shared.tsx, data uit lib/missions-data.ts en lib/mission-schedule.ts.

## Direction contract

THESIS: cadans is het verhaal. Een tijdas over 2026 waarop elke vlucht met een echte datum een merkteken is; waar ze opeenhopen zie je het ritme. Weigert de kaartenrij die 84 missies gelijk laat wegen.

OWN-WORLD: ongewijzigd uit DESIGN.md. Toevoeging is één regel over eerlijkheid op een as: alleen vluchten met een echte dag krijgen een positie. Gevlogen tekens zijn stiller en korter dan geplande; de vandaag-lijn draagt chinagraph, want dat is een live, vergankelijke positie.

STORY: de bezoeker ziet de werkelijke cadans van het jaar tot vandaag, ziet daarna hoe dun de toekomst vastligt, kiest een maand, en leest de vluchten van dat venster. Daaronder wat er nu vliegt.

FIRST VIEWPORT: staging-balk, kop, agentschapsfilter. Bandkop 'Het lanceermanifest' met tellingen. Dan de strook: maandvakken met tellingen, de as met merktekens, de vandaag-lijn, en een voet die alle drie de datumniveaus benoemt. Daaronder de eerstvolgende twaalf vluchten.

FORM: de startbaanstrook, kandidaat 6 van zeven gegronde structuren (manifest, aftelklok, baankaart, vlootlijst, draaiboekkaarten, startbaanstrook, logboek per voertuig). Gedeeld 6/1/2 door seed e3cc5a02, scope surface, mode read; de gebruiker vergrendelde de leidende kaart.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Opgelost tijdens de bouw: van de 51 komende vluchten heeft er 4 een echte dag, 10 alleen een maand en 37 alleen een jaar. Launch Library levert NET-vensters als de laatste dag ervan, en scripts/update-missions.js bewaarde net_precision niet. Dat veld wordt nu wel weggeschreven; tot de volgende bot-run leidt lib/mission-schedule.ts de precisie af uit de datumvorm.

De as haalt het verleden van dit jaar erbij, want daar zitten 27 vluchten met echte datums. Zonder dat toonde de strook vier merktekens en leek er niets te gebeuren.
