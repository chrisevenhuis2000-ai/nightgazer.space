# NightGazer reel-huisstijl — testreels

Proef voor de nieuwe stijl van álle reels (naar het voorbeeld dat Crix op 7 nov 2026 deelde). 9:16, 1080 × 1920, 30 fps.
Geen plaatkader, geen plaatnummer, geen "Illustratie"-label.

**De stijl in het kort**
- Eén doorlopende camera: de scènes gaan in elkaar over door in en uit te zoomen en te kantelen, bijna geen harde knippen.
- Voice-over (stem G) met ondertitels van 1 tot 3 woorden: wit, vet, zachte schaduw, op ~60 % hoogte. `*woord*` = koraal.
- Donkerblauwe nevel met zwevend sterrenstof dat strepen trekt als de camera snel gaat.
- Gestileerde zachte 3D-bollen, gloeiende turquoise lijnen (banen, sporen), magenta zwaartekrachtraster.
- Accenten: grote koraalrode getallen, chevrons rond een cirkel, dubbele pijlen.
- Muziekbed (ACE-Step) ~12 LU onder de stem, mix op -14 LUFS.

| Reel | Pijler | Vraag |
|---|---|---|
| `maan` | Snap het | Waarom zie je altijd dezelfde kant van de Maan? |
| `iss` | Lancering | Waarom valt het ISS niet naar beneden? |
| `leoniden` | Vannacht | Leoniden, nacht van 17 op 18 november 2026 |

## Opbouw
- `assets/stijl.js`: de gedeelde kit (camera-keys, nevel, stof, gloeilijn, bollen, zon, raster, bloom, 2D-overlay).
- `assets/reels/<id>.js`: per reel de scène en de camera, alles getimed op de zinnen van de voice-over (`L(i, f)`).
- `reels/<id>.json`: de tekst (ondertitel + uitspraak), muziekprompt en bronnen.
- `compositions/stage.html` (WebGL + overlay), `compositions/titles.html` (ondertitels + korte afsluiter).
- `scripts/kies.py` kiest de actieve reel (schatting of gemeten tijden), `scripts/tijden.py` legt de voice-over-takes achter elkaar.

## Bouwen (op de LXC, één zware taak tegelijk)
```bash
bash klank/bouw-lxc.sh lijnen maan    # zinnen voor de voice-over
#   → out/maan/vo/lijn-01.wav … met stem G (VoxCPM2)
bash klank/bouw-lxc.sh tijden maan
bash klank/bouw-lxc.sh muziek maan
bash klank/bouw-lxc.sh mix maan
bash klank/bouw-lxc.sh render maan
```
Zonder voice-over toont `python3 -I scripts/kies.py <id>` de reel met geschatte tijden (voor `npx hyperframes snapshot`).
