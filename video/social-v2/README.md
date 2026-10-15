# NightGazer social v2 — "Vanaf je eigen dak"

De eerste social post van nightgazer.space. 1080 × 1920 (9:16), 30 fps, precies 10,0 s, geen audio (het geluid kies je in de app). Concept C: de camera vertrekt boven je eigen dak en reist de diepte in. Het plaatarchief vangt alles op één glasplaat.

## Beat-grid (voor de muziek)

| Tijd (s) | Moment | Soort |
|---|---|---|
| 0,00 | Europa bij nacht vanuit een baan, hook "Kun je vannacht iets zien?" (frame 0 = poster) | start |
| 1,42 | Hook wordt weggeveegd langs een haarlijn | voorslag |
| **1,60** | **Match-cut:** de horizon van de aarde wordt de rand van een planeet | **cut / hit** |
| **2,28** | "Ruimtenieuws. Op jouw niveau." | **hit** |
| 3,80 | Tekst weg, de terminator schuift door het beeld | adem |
| **4,20** | De camera klimt over de rand en M74 komt op | **hit (drop)** |
| 4,9 | Uitlezing "M74 · Vissen · ±32 mln lichtjaar" | accent |
| **7,20** | Het beeld wordt als glasplaat uit het kader getild, op de lichtbak | **cut / hit** |
| 8,10 | Het plaatnummer wordt gestempeld | accent |
| **8,40** | Logo, `nightgazer.space`, "Vannacht kijken" | **hit** |
| 9,00–10,00 | Alles stil (eindframe) | uitklinken |

## Opbouw
- `index.html`: de root met drie sub-composities.
- `compositions/stage.html`: de Three.js-wereld (aarde, planeet, M74 in 2.5D, sterren), de grade, de grain en de lichtbak.
- `compositions/plate.html`: het plaatkader, de uitlezingen, de leiderlijn naar Utrecht en de beeldcredit.
- `compositions/titles.html`: de drie tekstmomenten.
- `assets/space.js`: procedurele bouwstenen (sterrenveld, planeet, nachtaarde, fotolagen, grain, camerahulpjes). Alles is een functie van tijd en seed; er zitten geen `Date`, `requestAnimationFrame` of `Math.random` in.

## Bronnen en render
Zie `SOURCES.md` voor bron, licentie en credit per beeld. De originelen en de afgeleide texturen staan in `.gitignore`.

```bash
# in video/social-v2/
bash scripts/fetch-sources.sh          # originelen → assets/src/
python3 scripts/prep-textures.py       # texturen   → assets/tex/
npx hyperframes check
npx hyperframes render . --crf 14 -o out/nightgazer-social-v2.mp4
ffmpeg -ss 0 -i out/nightgazer-social-v2.mp4 -frames:v 1 out/cover.png
```

`out/` staat in `.gitignore`: de MP4 en de cover worden niet gecommit.
