---
version: 1
slug: "app-missies-slug-missiondetailclient-tsx"
primary_target: "app/missies/[slug]/MissionDetailClient.tsx"
related_targets: ["app/_plate/plate.css","content/missions.json","lib/missions-data.ts","scripts/update-missions.js"]
---

Scope: elke missiepagina onder /missies/[slug], met /missies/starship/ als leidende plaat. Visitor mode: Read.

Audience: wie vanaf het lanceermanifest op een vlucht klikt en wil weten wat die vlucht is, of hij al ging en hoe het afliep. Constraints: AdSense blijft (slot 7516342216), wereld uit DESIGN.md, chrome uit shared.tsx, data uit content/missions.json.

## Direction contract

THESIS: Starship is geen missie maar een testcampagne. Elke vlucht heeft twee uitkomsten, booster en schip; de reeks laat zien hoe die vlucht voor vlucht beter worden. Weigert de oude statistiekkaartjes die elk veld even zwaar lieten wegen, ook als het "Onbekend" zei.

OWN-WORLD: ongewijzigd uit DESIGN.md. Toevoeging: uitkomst van een trap als markering (gevuld, open, rood, gestippeld), nooit als gekleurde badge.

STORY: de bezoeker ziet in één oogopslag dertien vluchten in twee banen, leest daarnaast wanneer de volgende gaat (zo hard als de datum is), en daaronder per vlucht wat er gebeurde, met links naar de vluchtpagina's. Elke vluchtpagina wijst terug naar het logboek.

FIRST VIEWPORT: plaatkop, kop, envelopvelden (alleen bekende), daarna de banen en de volgende vlucht.

FORM: logboek per voertuig, een van de zeven gegronde structuren uit het manifest-contract (manifest, aftelklok, baankaart, vlootlijst, draaiboekkaarten, startbaanstrook, logboek per voertuig).

Skills: impeccable (audit, wereld), taste (inventaris, idee, één levend ding: de volgende vlucht), Emil Kowalski's review-animations en find-animation-opportunities (canvas en puls weg, hover alleen voor muis, drukfeedback 160 ms).

Gemeten na de bouw (dev-server, 1440 en 390 px): geen horizontale scroll, 0 elementen buiten `.pl-live` in `#378ADD`, 0 afgeronde hoeken, alleen Archivo en JetBrains Mono, geen lege secties.

Open: uitkomst van Flight 12 en 13 per trap staat nog niet in de data ("nog niet ingevuld"); Flight 14 ontbreekt in Launch Library-data.

## Beeld (2026-10-22)

Crix: "veel tekst, geen plaatjes". Each mission page now carries figures:
the first image is the hero ground, the second sits in the reading column
after the lead paragraph (Fig. 1), the rest form a numbered image plate
(`.pl-mgal`) below "Over". Every figure has a number, a Dutch caption and a
credit, and links to its NASA source page. Provenance is always stated:
own images (`beeld` in missions.json, curated from images.nasa.gov),
borrowed from a mission with the same vehicle ("Uit het Starship-programma",
"niet van deze vlucht zelf"), or live mood images from the NASA image
search ("Sfeerbeeld", "niet van deze vlucht"). An artist's concept says
"Impressie".
