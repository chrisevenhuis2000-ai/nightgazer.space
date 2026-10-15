# Sounddesign — NightGazer social v2

**Klankconcept:** "het plaatarchief laat de ruimte horen". Twee lagen ontmoeten elkaar:
- **de ruimte:** ademende drones, ijle glinstering en een korrelige sterrenwolk;
- **het archief:** een tik van een mono-teller, emulsie-ritsel, glas op glas, het aanslaan van de lichtbak, een stempel en een sluiterklik.

Alles is gesynthetiseerd in `scripts/sound.py`. Er zitten geen samples, geen AI-modellen en geen netwerkbronnen in.

**Toonsoort: D.**
- **Spanning:** sus4 (G) boven de drone vanaf de planeet, en de kleine sext (Bb) in de opbouw.
- **Oplossing op het logo:** D-majeur add9 in open ligging (D2 · A2 · F♯3 · E4 · A4 · D5).
- **Melodie:** geen.

## Engine-keuze: Python (numpy/scipy), niet Tone.js/OfflineAudioContext
- **Sample-exact:** elke cue is een integer sample-index, frame × 1600 (30 fps bij 48 kHz). Er zit geen scheduler tussen.
- **Bit-identiek reproduceerbaar:** float64 en vaste seeds (PCG64). `OfflineAudioContext` rekent in float32 en hangt af van de Chrome-versie en de SIMD-paden; bit-identiek is daar niet gegarandeerd.
- **Eén toolchain:** synthese, stems, master, loudness, onset-detectie en spectrogram komen uit dezelfde Python-omgeving.
- **Prijs:** effecten schreef ik zelf. Het gaat om een convolutiegalm met een synthetische, geseede impulsrespons, saturatie, tijdsvariabele filters en een true-peak-limiter met lookahead (4× overbemonsterd).

Versies staan in `scripts/audio-requirements.txt`.

## Cue-sheet (definitieve beeldtimings)

| Tijd (s) | Frame | Sample | Beeldmoment | Geluid | Niveau (stem, vóór master-gain) |
|---|---|---|---|---|---|
| 0,0000 | 0 | 0 | Europa bij nacht, hookvraag (poster) | Orbit-drone D2/A2/D3/A3, vol vanaf sample 0 (start op fase 0, dus geen klik en geen fade-in); 26 ijle stadslicht-pings (D6–D7, pentatonisch, breed) | drone 0,20 · glinstering 0,045 |
| 1,0000 | 30 | 48 000 | Kruisje vergrendelt op Utrecht | Tik van de mono-uitlezing (mechanische klik + metalen ring op 5,2 kHz + escapement-naklik op 11 ms) | 0,42 |
| 1,4333 | 43 | 68 800 | Hook weggeveegd langs een haarlijn | Emulsie-ritsel (bandpass-ruis 2,2–8,5 kHz, 170 ms) | 0,10 |
| **1,6000** | **48** | **76 800** | **Match-cut aarde → planeet** | **Impact:** sub-sweep 68 → 38 Hz, gesatureerd (2e/3e harmonische), lage dreun, D2-staart die overgaat in de planeet-drone | 0,55 |
| 1,6–4,2 | 48–126 | | Terminator schuift door het beeld | Planeet-drone (D1/D2/A2, sus4 G vanaf ≈2,6 s); low-pass 220 → 1720 Hz volgt de lichtgrens | 0,12 |
| 2,2667 | 68 | 108 800 | "Ruimtenieuws. Op jouw niveau." | Zacht glas-accent (A6, inharmonische partialen) | 0,05 |
| 4,2000 | 126 | 201 600 | De camera klimt over de rand, M74 gaat open | Achterlaag pad (D3/A3) en het begin van de granulaire sterrenwolk; filter opent | 0,11 |
| 4,9000 | 147 | 235 200 | Uitlezing "M74 · Vissen" | Tik van de mono-teller | 0,30 |
| 5,2000 | 156 | 249 600 | Tweede dieptelaag | Middenlaag pad (E4/G4/**Bb4**: spanning) | 0,065 |
| 6,2000 | 186 | 297 600 | Derde dieptelaag | Sterrenlaag (A4/D5/E5); de wolk wordt dichter (tot ≈170 korrels/s) en hoger | 0,05 |
| **7,2000** | **216** | **345 600** | **Het beeld wordt een glasplaat** | **Glas op glas** (2,6 kHz en 3,1 kHz, 45 ms na elkaar); de ruimte valt in 0,3 s weg en wordt een kamer (kleine galm) | 0,30 |
| 7,3000 | 219 | 350 400 | Lichtbak | Twee starter-tikken (frame 219 en 221), daarna een lage netbrom (100/200/300 Hz) | 0,8 / 0,022 |
| 8,1000 | 243 | 388 800 | Plaatnummer gestempeld | Stempel ("thock", 180/410 Hz + gefilterde slag) | 0,30 |
| **8,4000** | **252** | **403 200** | **Logo belicht** | **Sluiterklik** (open + dicht na 52 ms) en het **open akkoord** D-majeur add9 (70 ms attack, natuurlijke uitklank) | 0,36 / 0,16 |
| 9,0–10,0 | 270–300 | | Alles stil | Het akkoord klinkt uit; de orbit-drone komt terug en eindigt op 10,0 s gelijk aan sample 0 (lus) | |

Elk geluid begint met een fade-in van 1 tot 3 ms en eindigt met een fade-out. Het eerste sample van een geluid is dus 0,0, en het eerste niet-nul-sample ligt op cue+1 (21 µs).

## Metingen (definitieve versie)

Alle metingen zijn gemaakt met `scripts/audio-verify.py` en ffmpeg `loudnorm`.

| Meting | Master-WAV | Definitieve MP4 (AAC) | Norm |
|---|---|---|---|
| Integrated loudness | −14,33 LUFS | **−14,34 LUFS** | −14 ± 1 |
| True peak | −1,50 dBTP | **−1,41 dBTP** | ≤ −1,0 |
| Loudness range | 3,4 LU | 3,4 LU | compact |

- **Formaat master en stems:** 48 kHz, PCM 24-bit, stereo, 480 000 samples.
- **MP4-audio:** AAC LC, 48 kHz, stereo, doel 320 kbps. ffprobe meet gemiddeld 266 kbps: de AAC-encoder van ffmpeg gebruikt bij dit signaal minder bits dan het doel. De audio staat op **0 samples offset** van de master (kruiscorrelatie).
- **Videostream:** bit-identiek aan de HyperFrames-render.
- **Mono:** correlatie gemiddeld 0,83 (per 100 ms gemiddeld 0,92, minimaal 0,40); in mono verlies je 0,26 LU. Breedte zit alleen in de glinstering en de sterrenwolk.
- **DC-offset:** < 4·10⁻⁵.
- **Lus 10,0 s → 0,0 s:** een sprong van 0,0069, tegen een normale samplestap (p99) van 0,092. Er ontstaat dus geen klik.
- **Tekstmomenten zijn niet het drukst.** Momentane loudness (400 ms, maximum per stuk):
  - hook 0–1,43 s: −13,9 LUFS;
  - tekst 2, 2,27–3,8 s: −11,3 LUFS;
  - eindkaart 8,4–10 s: −15,8 LUFS;
  - tegenover impact −9,2 en push-in −10,5. De impact op 1,6 s is het luidste moment.
- **Determinisme:** twee aparte runs geven bit-identieke WAV's, voor de master en alle vier stems. SHA-256 van de master: `32dd214f0e8e9ad666d079c92343bf600cffba5831d86f652928d039e317b376`.

### Synchronisatie

Onset-detectie met librosa (hop 64 samples) op de gedecodeerde MP4-audio:

| Cue | Verwacht (s) | Gemeten (s) | Afwijking | In frames | Plaatsing |
|---|---|---|---|---|---|
| Kruisje vergrendelt | 1,0000 | 1,0040 | +4,0 ms | +0,12 | sample-exact |
| Hook weg (ritsel) | 1,4333 | 1,4200 | −13,3 ms | −0,40 | sample-exact |
| Match-cut (impact) | 1,6000 | 1,6040 | +4,0 ms | +0,12 | sample-exact |
| Tekst 2 (glas) | 2,2667 | 2,2707 | +4,0 ms | +0,12 | sample-exact |
| M74-uitlezing (tik) | 4,9000 | 4,9040 | +4,0 ms | +0,12 | sample-exact |
| Glasplaat (glas op glas) | 7,2000 | 7,2027 | +2,7 ms | +0,08 | sample-exact |
| Lichtbak (starter) | 7,3000 | 7,3147 | +14,7 ms | +0,44 | sample-exact |
| Stempel | 8,1000 | 8,1080 | +8,0 ms | +0,24 | sample-exact |
| Logo (sluiter + akkoord) | 8,4000 | 8,4040 | +4,0 ms | +0,12 | sample-exact |

"Sample-exact" is gecontroleerd op de droge plaatsing: elk geluid begint op exact frame × 1600. Wat onset-detectie in de mix vindt, valt overal binnen ±1 frame (33 ms). De kleine positieve afwijkingen zijn de stijgtijd van de onset-functie. De ritsel (−13 ms) heeft geen scherpe aanzet. De lichtbak (+15 ms) begint met een zachtere eerste tik, en de detector pakt de tweede.

## Bestanden

`out/` staat niet in git; alles wordt opnieuw gemaakt met de scripts.
- `out/audio/nightgazer-social-v2-master.wav`: master, 48 kHz/24-bit, na de limiter.
- `out/audio/stem-ruimte-drones.wav`, `stem-archiefgeluiden.wav`, `stem-impacts.wav`, `stem-akkoord.wav`: met dezelfde master-gain, maar vóór de true-peak-limiter. Opgeteld wijken ze daarom op de pieken iets af van de master.
- `out/audio/spectrogram.png`: de hele mix met de cue-momenten.
- `out/nightgazer-social-v2.mp4` (met audio), `out/nightgazer-social-v2-stil.mp4` (zonder audio) en `out/cover.png`.

```bash
# in video/social-v2/  (Python 3, pip install -r scripts/audio-requirements.txt)
python3 scripts/sound.py                        # stems + master → out/audio/
npx hyperframes render . --crf 14 -o out/hf-render.mp4
ffmpeg -i out/hf-render.mp4 -i out/audio/nightgazer-social-v2-master.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart out/nightgazer-social-v2.mp4
ffmpeg -i out/hf-render.mp4 -map 0:v:0 -c:v copy -an -movflags +faststart out/nightgazer-social-v2-stil.mp4
python3 scripts/audio-verify.py out/nightgazer-social-v2.mp4
```

## Niet geverifieerd
- **Luisteren:** ik kan niet luisteren. Klankkwaliteit, smaak en of het "premium" klinkt, zijn beoordeeld via metingen, het spectrogram en een onafhankelijke review, niet met oren.
- **Telefoonspeakers:** niet gemeten op een echt toestel. De lage lagen hebben wel harmonischen boven 100 Hz (zie het spectrogram), zodat ze daar waarneembaar zijn.
- **Bitrate:** ffmpeg meet gemiddeld 266 kbps in plaats van 320 kbps (zie boven).
