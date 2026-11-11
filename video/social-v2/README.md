# NightGazer social v2 — "Vanaf je eigen dak"

De eerste social post van nightgazer.space. 1080 × 1920 (9:16), 30 fps, precies 10,0 s. Er is een soundtrack met muziek uit ElevenLabs en de eigen archiefgeluiden (zie `AUDIO.md`) en een stille versie. Concept C: de camera vertrekt boven je eigen dak en reist de diepte in. Het plaatarchief vangt alles op één glasplaat.

## Beat-grid (frame-exact; de soundtrack volgt dit raster, zie `AUDIO.md`)

| Tijd (s) | Moment | Soort |
|---|---|---|
| 0,00 | Europa bij nacht vanuit een baan, hook "Kun je vannacht iets zien?" (frame 0 = poster) | start |
| 1,00 | Het kruisje vergrendelt op Utrecht (frame 30) | accent |
| 1,4333 | Hook wordt weggeveegd langs een haarlijn | voorslag |
| **1,60** | **Match-cut:** de horizon van de aarde wordt de rand van een planeet | **cut / hit** |
| **2,2667** | "Ruimtenieuws. Op jouw niveau." | **hit** |
| 3,80 | Tekst weg, de terminator schuift door het beeld | adem |
| **4,20** | De camera klimt over de rand en M74 komt op | **hit (drop)** |
| 4,90 | Uitlezing "M74 · Vissen · ±32 mln lichtjaar" | accent |
| **7,20** | Het beeld wordt als glasplaat uit het kader getild, op de lichtbak | **cut / hit** |
| 8,10 | Het plaatnummer wordt gestempeld | accent |
| **8,40** | Logo, `nightgazer.space`, "Vannacht kijken" | **hit** |
| 9,00–10,00 | Alles stil (eindframe) | uitklinken |

## Opbouw
- `index.html`: de root met drie sub-composities.
- `compositions/stage.html`: de Three.js-wereld (aarde, planeet, M74 in 2.5D, sterren), de grade, de grain en de lichtbak.
- `compositions/plate.html`: het plaatkader, de uitlezingen, de leiderlijn naar Utrecht en de beeldcredit.
- `compositions/titles.html`: de drie tekstmomenten.
- `scripts/sound.py`: de soundtrack-engine (stems + master, 48 kHz/24-bit). De standaard is `scripts/variants/elevenlabs.py`: de ElevenLabs-muziek uit `assets/audio/elevenlabs-music.flac` met de archiefgeluiden erover. `scripts/audio-verify.py` meet hem.
- `assets/space.js`: procedurele bouwstenen (sterrenveld, planeet, nachtaarde, fotolagen, grain, camerahulpjes). Alles is een functie van tijd en seed; er zitten geen `Date`, `requestAnimationFrame` of `Math.random` in.

## Bronnen en render
Zie `SOURCES.md` voor bron, licentie en credit per beeld. De originelen en de afgeleide texturen staan in `.gitignore`.

```bash
# in video/social-v2/
bash scripts/fetch-sources.sh          # originelen → assets/src/
python3 scripts/prep-textures.py       # texturen   → assets/tex/
python3 scripts/sound.py               # soundtrack → out/audio/ (pip install -r scripts/audio-requirements.txt)
npx hyperframes check
npx hyperframes render . --crf 14 -o out/hf-render.mp4
ffmpeg -i out/hf-render.mp4 -i out/audio/nightgazer-social-v2-master.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart out/nightgazer-social-v2.mp4
ffmpeg -i out/hf-render.mp4 -map 0:v:0 -c:v copy -an -movflags +faststart out/nightgazer-social-v2-stil.mp4
ffmpeg -ss 0 -i out/nightgazer-social-v2.mp4 -frames:v 1 out/cover.png
python3 scripts/audio-verify.py out/nightgazer-social-v2.mp4
```

**Geluidsvarianten** (ter vergelijking; de standaard is de ElevenLabs-muziek): `bash scripts/varianten.sh` bouwt de standaard en de vier gesynthetiseerde soundtracks, zet ze onder hetzelfde beeld in `out/varianten/` en maakt `vergelijking.mp4`. Zie `AUDIO.md` → "Varianten".

`out/` staat in `.gitignore`: de MP4's, de cover en de audiobestanden worden niet gecommit.
