# Sounddesign — NightGazer social v2

**Klankconcept:** "het plaatarchief laat de ruimte horen". Twee lagen ontmoeten elkaar:
- **de ruimte:** ademende drones, ijle glinstering en een korrelige sterrenwolk;
- **het archief:** een tik van een mono-teller, emulsie-ritsel, glas op glas, het aanslaan van de lichtbak, een stempel en een sluiterklik.

Alles is gesynthetiseerd in `scripts/sound.py`. Er zitten geen samples, geen AI-modellen en geen netwerkbronnen in.

**Toonsoort: D.**
- **Spanning:** sus4 (G) boven de drone vanaf de planeet, de kleine sext (Bb) in de opbouw, en een dunne G/Bb die "door de plaat" blijft hangen tot het logo.
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
| **1,6000** | **48** | **76 800** | **Match-cut aarde → planeet** | **Impact:** korte, gedempte dreun (56 → 42 Hz, verval 0,25 s), met tanh-saturatie (oneven harmonischen, 3e/5e) en een D2-staart die overgaat in de planeet-drone. De galm krijgt alleen signaal vanaf 120 Hz | 0,39 |
| 1,6–5,4 | 48–162 | | Terminator schuift door het beeld | Planeet-drone (D2/A2, sus4 G vanaf ≈ 2,6 s); low-pass 220 → 1720 Hz volgt de lichtgrens; uitfaden 4,4–5,4 s | 0,12 |
| 2,2667 | 68 | 108 800 | "Ruimtenieuws. Op jouw niveau." | Zacht glas-accent (A6, inharmonische partialen, klinkt vrij uit) | 0,05 |
| 4,2000 | 126 | 201 600 | De camera klimt over de rand, M74 gaat open | Pad (D3/A3) en het begin van de granulaire sterrenwolk | 0,13 |
| 4,9000 | 147 | 235 200 | Uitlezing "M74 · Vissen" | Tik van de mono-teller | 0,30 |
| 5,2000 | 156 | 249 600 | *(geen beeldmoment: muzikale opbouw)* | Middenlaag pad (E4/G4/**Bb4**: spanning) | 0,04 |
| 6,2000 | 186 | 297 600 | *(geen beeldmoment: muzikale opbouw)* | Hoge laag (A4/D5/E5). De sterrenwolk wordt dichter tot maximaal 80 korrels/s; het filter gaat open tot 2,2 kHz (een kleurverandering, geen sweep) | 0,028 |
| **7,2000** | **216** | **345 600** | **Het beeld wordt een glasplaat** (de lift begint zichtbaar op dit frame, `power3.out`) | **Glas op glas** (2,6 kHz en 3,1 kHz, 45 ms na elkaar, klinkt vrij uit). De ruimte valt in 0,3 s weg en wordt een kamer; een dunne, donkere G/Bb blijft "door de plaat" hangen | 0,15 · G/Bb 0,035 |
| 7,3000 | 219 | 350 400 | Lichtbak in beeld rond de opgetilde plaat | Twee starter-tikken (frame 219 en 221), daarna een lage ballastbrom, gestemd op A (55/110/220/330 Hz) | 0,8 / 0,022 |
| 8,1000 | 243 | 388 800 | Plaatnummer gestempeld | Stempel ("thock", 180/410 Hz + gefilterde slag) | 0,30 |
| **8,4000** | **252** | **403 200** | **Logo belicht** | **Sluiterklik** (open + dicht na 52 ms) en het **open akkoord** D-majeur add9 (70 ms attack, verval 1,8 s). G → F♯ en Bb → A lossen hier op; de brom duikt 10 dB weg | 0,36 / 0,36 |
| 9,4–10,0 | 282–300 | | Alles stil | Het akkoord draagt de eindkaart en geeft vanaf 9,4 s over aan de orbit-drone, die op 10,0 s gelijk eindigt aan sample 0 (lus) | |

Elk geluid begint met een fade-in van minimaal 2 ms en eindigt met een fade-out van minimaal 2 ms (bij glas en impact 40 en 20 ms). Het eerste sample van een geluid is dus 0,0, en het eerste niet-nul-sample ligt op cue+1 (21 µs).

## Metingen (definitieve versie)

Alle metingen zijn gemaakt met `scripts/audio-verify.py` (ffmpeg `loudnorm`). Controle met ffmpeg `ebur128=peak=true` op de MP4: −14,0 LUFS, LRA 2,7 LU.

| Meting | Master-WAV | Definitieve MP4 (AAC) | Norm |
|---|---|---|---|
| Integrated loudness | −14,22 LUFS | **−14,23 LUFS** | −14 ± 1 |
| True peak | −1,50 dBTP | **−1,50 dBTP** | ≤ −1,0 |
| Loudness range | 2,6 LU | 2,6 LU | compact |

- **Formaat:** master en stems 48 kHz, PCM 24-bit, stereo, 480 000 samples. Stems clippen niet: de hoogste piek is −2,7 dBFS.
- **Limiter:** de pre-limiter-piek is −0,79 dBFS en de limiter grijpt maximaal 0,83 dB in, met een afgevlakte attack.
- **MP4-audio:** AAC LC, 48 kHz, stereo, doel 320 kbps. ffprobe meet gemiddeld 264 kbps: de AAC-encoder van ffmpeg gebruikt bij dit signaal minder bits dan het doel. De audio staat op **0 samples offset** van de master (kruiscorrelatie).
- **Videostream:** bit-identiek aan de HyperFrames-render, in zowel de MP4 met geluid als de stille MP4.
- **Mono:** correlatie gemiddeld 0,98 (per 100 ms minimaal 0,83); in mono verlies je 0,09 LU. Onder 150 Hz is de correlatie 0,99–1,00, omdat alle galmen hun zijsignaal pas boven 200 Hz doorlaten. Breedte zit alleen in de glinstering, de sterrenwolk en de galmstaarten erboven.
- **DC-offset:** < 1,3·10⁻⁵.
- **Lus 10,0 s → 0,0 s:** een sprong van 0,0082, tegen een normale samplestap (p99) van 0,06. Er ontstaat dus geen klik.
- **Tekstmomenten zijn niet het drukst.** Momentane loudness (400 ms, maximum per stuk):
  - hook 0–1,43 s: −12,4 LUFS;
  - tekst 2, 2,27–3,8 s: −13,6 LUFS;
  - eindkaart 8,4–10 s: −13,1 LUFS;
  - tegenover impact −9,6 en push-in −11,7. De push-in stijgt van −16,7 (4,2 s, overgang uit de planeet) naar −11,7 (6,3 s); vanaf 4,8 s is dat 2,5 LU. De impact blijft 2,1 LU boven de piek van de push-in.
- **Eindkaart:** het akkoord leidt van 8,5 tot 10 s (stem −12,9 LUFS op 8,7 s, −15,0 op 9,3 s). De drones blijven tot 9,3 s rond −29 en komen pas vanaf 9,5 s terug, onder het akkoord (−22,0 tegen −17,7 bij 9,6 s).
- **Determinisme:** twee aparte runs geven bit-identieke WAV's, voor de master en alle vier stems. SHA-256 van de master: `47932b7215066ce652168b1d0e58eaeb59876d752bd9841a6bbbea9d340ac5eb`.

### Synchronisatie

De cue-tijden komen uit de composities zelf: `audio-verify.py` leest ze uit `stage.html`, `plate.html` en `titles.html` en eist dat ze gelijk zijn aan het cue-frame. Vervolgens zoekt hij in de gedecodeerde MP4-audio het sterkste onset binnen ±1 frame, en eist dat het minstens 2× de mediane onset-sterkte heeft. De onset-detectie gebruikt librosa met een hop van 64 samples.

| Cue | Beeld in compositie (s) | Gemeten in MP4 (s) | Afwijking | In frames | Onset-sterkte |
|---|---|---|---|---|---|
| Kruisje vergrendelt | 1,0000 | 1,0133 | +13,3 ms | +0,40 | 11,8× |
| Hook weg (ritsel) | 1,4333 | 1,4493 | +16,0 ms | +0,48 | 5,6× |
| Match-cut (impact) | 1,6000 | 1,6040 | +4,0 ms | +0,12 | 3,9× |
| Tekst 2 (glas) | 2,2667 | 2,2707 | +4,0 ms | +0,12 | 8,4× |
| M74-uitlezing (tik) | 4,9000 | 4,9027 | +2,7 ms | +0,08 | 2,9× |
| Glasplaat (glas op glas) | 7,2000 | 7,2040 | +4,0 ms | +0,12 | 5,9× |
| Lichtbak (starter-tik) | 7,3000 ¹ | 7,3147 | +14,7 ms | +0,44 | 7,0× |
| Stempel | 8,1000 | 8,1080 | +8,0 ms | +0,24 | 8,5× |
| Logo (sluiter + akkoord) | 8,4000 | 8,4040 | +4,0 ms | +0,12 | 4,9× |

Alle cues zijn ook droog sample-exact geplaatst: elk geluid begint op exact frame × 1600. De positieve afwijkingen zijn de stijgtijd van de onset-functie. Bij de kruisje-tik (+13 ms) pakt de detector de escapement-naklik op 11 ms. De ritsel (+15 ms) heeft geen scherpe aanzet. ¹ De lichtbak heeft geen eigen tween: hij komt in beeld doordat de plaat vanaf `PLATE` (7,2 s) wordt opgetild. De verifier toetst hem daarom als `PLATE` + 0,1 s (3 frames). De +15 ms is de stijgtijd van de zachte eerste tik.

## Onafhankelijke review

Een aparte agent die de audio niet had gemaakt, heeft de cue-sheet, het spectrogram, de metingen en de frames beoordeeld en zelf nagemeten. Dit is verwerkt:

| # | Bevinding | Wat ik deed |
|---|---|---|
| 1 | **Blokkerend:** glasringen werden afgekapt (bij 7,7 en 3,67 s) | Een burst duurt nu 5× het langste verval, met een fade-out van 40 ms. Het glas sterft uit tot −63 dB |
| 2 | **Blokkerend:** het akkoord was het zachtste moment, en de drone nam de eindkaart over | Akkoord +7 dB, verval 0,55 → 1,8 s; de drone komt pas vanaf 9,5 s terug, onder het akkoord |
| 3 | Geluid op 7,2/7,3 s vóór de zichtbare lift (expo.inOut) | **Beeld aangepast:** de lift gebruikt nu `power3.out`, dus hij is op 7,2 s al in beweging en op 7,3 s staat de lichtbak in beeld |
| 4 | Glas op glas te luid | 0,30 → 0,15 (−6 dB) |
| 5 | Impact te zwaar, limiter 5 dB gain reduction, D1-sinus onhoorbaar | Impact −3 dB; verval 0,42 → 0,25 s; sweep 68→38 werd 56→42 Hz (geen sub-drop-gebaar meer); de galm krijgt pas signaal vanaf 120 Hz; D1 is weg; de limiter grijpt nu maximaal 0,83 dB in (doel ≤ 2 dB), met een afgevlakte attack |
| 6 | Breedte in het laag | Het zijsignaal van alle galmen loopt door een high-pass op 200 Hz. De correlatie onder 150 Hz is nu ≥ 0,98 |
| 7 | De opbouw werkte als een riser | Korreldichtheid ≤ 80/s; filter ≤ 2,2 kHz; de lagen zijn anders verdeeld; na de herbeoordeling de pad nog 2 dB lager. De push-in-piek ligt nu 2,1 LU onder de impact |
| 8 | De spanning verdween vóór het logo; de brom zat niet in de toonsoort | Een dunne G/Bb blijft van 7,2 tot 8,4 s staan en lost op in het akkoord; de brom is gestemd op A en duikt bij het logo weg |
| 9 | Fades van 1 ms | Minimaal 2 ms, afgedwongen in `click_safe` |
| 10 | Stem-impacts clipte | Opgelost door de lagere impact; `sound.py` controleert nu dat geen enkele stem clipt. Float-WAV heb ik niet gebruikt: libsndfile schrijft daar een PEAK-chunk met tijdstempel in, en dan zijn de stems niet meer bit-identiek |
| 11 | AUDIO.md en de code liepen uiteen | Gecorrigeerd: planeet-drone 1,6–5,4 s; oneven harmonischen; uitleg van de lichtbak; 5,2/6,2 s gemarkeerd als muzikale opbouw |
| 12 | De verifier kon geen sync-fout vangen | Leest de cue-tijden nu uit de composities, neemt het sterkste onset binnen ±1 frame met een minimale sterkte, en gebruikt de echte impact-burst. Na de herbeoordeling is de lichtbak weer meegenomen |

**Herbeoordeling:** dezelfde agent heeft de nieuwe versie opnieuw gemeten. Beide blokkerende punten zijn opgelost en er zijn geen nieuwe blokkerende punten ("Approved"). Zijn twee kleine opmerkingen (de push-in en de lichtbak in de verifier) zijn daarna verwerkt.

## Bestanden

`out/` staat niet in git; alles wordt opnieuw gemaakt met de scripts.
- `out/audio/nightgazer-social-v2-master.wav`: master, 48 kHz/24-bit, na de limiter.
- `out/audio/stem-ruimte-drones.wav`, `stem-archiefgeluiden.wav`, `stem-impacts.wav`, `stem-akkoord.wav`: met dezelfde master-gain, vóór de true-peak-limiter (die maximaal 0,83 dB ingrijpt). Opgeteld zijn ze daarom vrijwel gelijk aan de master.
- `out/audio/spectrogram.png`: de hele mix met de cue-momenten. `out/audio/verify.json`: alle metingen.
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
- **Luisteren:** ik kan niet luisteren, en de review-agent ook niet. Klankkwaliteit, smaak en of het "premium" klinkt, zijn beoordeeld via metingen, het spectrogram en de code, niet met oren.
- **Telefoonspeakers:** niet gemeten op een echt toestel. De lage lagen hebben wel harmonischen boven 100 Hz (zie het spectrogram), zodat ze daar waarneembaar zijn.
- **Bitrate:** ffmpeg meet gemiddeld 264 kbps in plaats van 320 kbps (zie boven).

---

# Varianten (ter vergelijking, keuze open)

De soundtrack hierboven ("huidig") blijft de standaard totdat er gekozen is. Er zijn drie alternatieven onder exact hetzelfde beeld. Alle drie volgen dezelfde regels: procedureel gesynthetiseerd, vaste seeds, geen samples en geen AI-modellen. Er zijn ook geen NASA-sonificaties of -opnames gebruikt.

**Opbouw:** `scripts/sound.py` blijft de engine. Daarin staan de DSP-kit, het cue-grid, de archiefgeluiden en de gedeelde masterketen `finish()` (naad, DC, −14 LUFS, true-peak-limiter op −1,5 dBTP). Een variant is een module in `scripts/variants/` die alleen stems levert (`stems()`) en zijn sync-cues opgeeft (`TRANSIENTS`). De verifier is voor alle vier dezelfde: `scripts/audio-verify.py --variant <naam>`.

```bash
# in video/social-v2/, na de HyperFrames-render (out/hf-render.mp4)
python3 scripts/variants/extract_sonification_data.py   # alleen nodig als het beeld verandert (schrijft sonificatie-data.json)
bash scripts/varianten.sh    # 4 masters → 4 MP4's → verify.json + spectrogram per variant → vergelijking.mp4
```

## 1 · "Orgel van de kosmos" (`variants/orgel.py`)
Een additief pijporgel met de registers 16', 8', 8'-fluit, 4', 2' en een mixtuur. Elke pijp is een harmonische reeks met ±0,5 cent ontstemming, en elke aanzet heeft een "chiff" (de ademruis van een aansprekende pijp). De galm is kathedraallang (5,5 s). Eén progressie in D loopt de hele 10 s door:

| Tijd (s) | Akkoord | Registers | Beeld |
|---|---|---|---|
| 0–1,6 | Dsus2 (D3 A3 E4, pedaal D2) | 8'-fluit + 4' | aarde, hook |
| **1,6** | **B♭** (pedaal B♭1) | 16' 8' 4' | match-cut |
| 2,9 | Gm/B♭ | 16' 8'-fluit 4' | tekst 2 (zwelkast terug) |
| **4,2** | **C** (pedaal C2) | + 2' | M74 |
| 5,7 | G (pedaal G1) | + mixtuur, zwelkast naar max (6,9 s) | push-in |
| **7,2** | **Asus4** (spanning) | terug naar 16' 8'-fluit 4' | glasplaat (+ glas) |
| **8,4** | **D add9** (oplossing) | 16' 8' 4' | logo (+ sluiter) |

De zwelkast (niveau en helderheid samen) is één curve. Op 1,6, 4,2 en 8,4 zit een stap van 10 ms: die geeft het accent op de cue zonder klik.

## 2 · "Puls van het observatorium" (`variants/puls.py`)
**Tempo: 150 BPM, constant.** Een zestiende is precies 0,1 s, dus 3 frames of 4800 samples. Elke cue op een veelvoud van 3 frames ligt daardoor exact op het grid, en een tempo-ramp is niet nodig. Een maat (4/4) duurt 1,6 s.

| Cue | Tijd (s) | Grid (maat.tel.16e) | 16e # | Afwijking grid |
|---|---|---|---|---|
| Kruisje | 1,0 | 1.3.3 | 10 | 0 |
| **Match-cut** | **1,6** | **2.1.1** (downbeat) | 16 | 0 |
| Tekst 2 | 2,2667 | ≈ 2.2.3 | ≈ 22,7 | 1 frame (geen grid-cue) |
| **M74** | **4,2** | **3.3.3** (8e vóór tel 4: de groove "valt in") | 42 | 0 |
| Uitlezing | 4,9 | 4.1.2 | 49 | 0 |
| **Glasplaat** | **7,2** | **5.3.1** | 72 | 0 |
| Stempel | 8,1 | 6.1.2 | 81 | 0 |
| **Logo** | **8,4** | **6.2.1** | 84 | 0 |

- **Percussie:** geen drumkit, maar instrumentgeluiden. Escapement-tikken (de teller-tik uit de engine), een stappenmotor van een telescoop (een korte, gestemde zoem) en een koepel-"thock" op de tel. De thock heeft zijn lichaam op 190 Hz en een knock op 450 Hz; er zit maar weinig sub onder, zodat een telefoonspeaker de tel nog speelt.
- **Opbouw per stuk:**
  - hook: 8e-tikken en een stationair draaiende koepelmotor;
  - 1,6–4,2: bas op 8en, motor op 2 en 4;
  - 4,2–7,2: volle 16en;
  - 7,2–8,4: break, met alleen kwarttikken boven een aangehouden A (Asus4);
  - 8,4: sonic logo met akkoord.
- **Bas:** D → B♭ → C → G → Asus4 → D. Eerst gesatureerd (harmonischen tot ongeveer 1 kHz), daarna een low-pass met een bodem van 950 Hz en een filterblip per noot. Bas en percussie gaan door een high-pass op 42 Hz.
- **Motief / sonic logo: A–D–E … F♯.**
  - 1,6: laag en onopgelost, eindigt op E.
  - 4,2: een octaaf hoger, draait naar G (sus).
  - 8,4: compleet, landt op F♯, de terts van D.

## 3 · "Het instrument antwoordt" (`variants/sonificatie.py`)
Het geluid komt uit de data van het beeld zelf. `extract_sonification_data.py` leest die eenmalig uit en zet ze in `sonificatie-data.json` (116 kB, in git), zodat de synthese geen texturen of render nodig heeft. Alle toonhoogtes worden gekwantiseerd naar **D-majeur pentatonisch** (D E F♯ A B).

| Laag | Data (bron) | Stuurt |
|---|---|---|
| Stadslichten 0–1,6 s | NASA Black Marble 2016 (`bm-europe.jpg`): een scan west→oost over 52,09° N (de breedtegraad van Utrecht, band ±0,3°), van 5° W tot 11,2° O. De speelkop is lon(t) = −5° + 10,12°·t, dus **Utrecht passeert op precies 1,0 s**, het moment dat het kruisje vergrendelt. | Elke stad (lokaal maximum van de radiantie) wordt een ping. Radiantie → toonhoogte (D5–D7) en niveau. Noord/zuid in de band → panning. Gemiddelde radiantie → dichtheid van een fijne korrel-ruis en het niveau van een lage D/A-bedding. De zee is stil (0,02), de Randstad het luidst (0,41). |
| Match-cut 1,6 s | Het verlichte deel van het cut-frame (2,1 %) | De helderheid van een aangeslagen lage D: donker, omdat het frame bijna zwart is |
| Planeet 1,6–5,4 s | De gerenderde film, frames 48–150: het verlichte deel van het beeld (luma > 0,25), oplopend van 2 % naar 56 % | De cutoff van een D/A-drone: 160 + 3400 Hz × verlicht deel. De terminator opent het filter |
| M74 4,2–7,2 s | De gerenderde film, frames 126–216: een **vaste ring** van 48 punten rond de kern van de spiraal, met in elk frame dezelfde hoeken en stralen. **De dolly is de speelkop:** de ring beweegt niet ten opzichte van de kern, dus wat er onder de punten verandert, komt alleen door het induwen van de camera | Een punt klinkt zodra er een heldere structuur onder schuift (luma stijgt van ≤ 0,5 naar > 0,5). Er is geen toevalspoort: 131 korrels in 3 s, schaars in het begin en dichter naarmate de camera de spiraal in duwt. Luma → toonhoogte en niveau. Blauw−rood → octaaf (de blauwste punten, jonge sterren, een octaaf hoger). x → panning. Hoek → moment binnen het frame (een draaiende scan). Afstand tot de kern → korrelduur. Gemiddelde ringhelderheid → niveau van een gloed-pad. Op 4,2 slaan de 5 helderste punten samen aan |
| Glasplaat 7,2 s | – | De data stopt. De laatste toonhoogtes blijven zacht hangen als cluster (+ glas) |
| Logo 8,4 s | – | Sluiter. De cluster glijdt in 120 ms naar de dichtstbijzijnde akkoordtonen van D add9: het instrument "antwoordt" in één toonsoort |

**Eerlijkheidsnoot:** tot ≈ 5,0 s staat de verlichte planeetrand nog in de ring rond de M74-kern. Die korrels komen dus deels van de planeet, niet van de galaxy. Dat is wat er in beeld staat, en het is niet weggepoetst.

## Metingen per variant

Gemeten op de MP4 (`out/varianten/<n>-<naam>.mp4`, AAC 320 kbps ingesteld, 48 kHz).

- **Meters:** de tabel gebruikt ffmpeg `loudnorm`, net als `verify.json`. Ter controle geeft ffmpeg `ebur128` op alle vier de MP4's −14,0 LUFS. De twee meters wijken onderling tot 0,5 LU af; beide liggen binnen ±1.
- **Sync:** onset-detectie op de gedecodeerde MP4-audio, met de cue-tijden gelezen uit de composities.
- **Telefoonband:** de loudness na een band-pass van 200 Hz tot 12 kHz, als benadering van een telefoonspeaker.

| | 0 · huidig | 1 · orgel | 2 · puls | 3 · sonificatie |
|---|---|---|---|---|
| Integrated (MP4) | −14,23 LUFS | −13,94 LUFS | −14,34 LUFS | −13,94 LUFS |
| True peak (MP4) | −1,50 dBTP | −1,50 dBTP | −1,31 dBTP | −1,50 dBTP |
| LRA | 2,6 LU | 6,1 LU | 3,3 LU | 1,9 LU |
| Mono: correlatie / verlies | 0,98 / 0,09 LU | 0,87 / 0,36 LU | 0,97 / 0,06 LU | 0,85 / 0,42 LU |
| Telefoonband: totaal / hook | −17,7 / −21,5 | −15,7 / −20,7 | −18,0 / −21,7 | −15,1 / −14,0 |
| Energie < 80 Hz | 39 % | 20 % | 32 % | 19 % |
| Max. hook / tekst 2 / eindkaart | −12,4 / −13,6 / −13,1 | −16,7 / −16,2 / −13,8 | −17,9 / −13,5 / −11,6 | −14,0 / −14,6 / −11,5 |
| Luidste moment | −9,6 (match-cut) | −9,6 (push-in) | −10,5 (push-in) | −9,3 (match-cut) |
| Sync 1,6 match-cut | +4,0 ms (0,12 fr) | +2,7 ms (0,08 fr) | +4,0 ms (0,12 fr) | +4,0 ms (0,12 fr) |
| Sync 4,2 M74 | −12,0 ms (0,36 fr) | +18,7 ms (0,56 fr) | +4,0 ms (0,12 fr) | +14,7 ms (0,44 fr) |
| Sync 7,2 glasplaat | +4,0 ms (0,12 fr) | +4,0 ms (0,12 fr) | +4,0 ms (0,12 fr) | +4,0 ms (0,12 fr) |
| Sync 8,4 logo | +4,0 ms (0,12 fr) | +5,3 ms (0,16 fr) | +4,0 ms (0,12 fr) | +4,0 ms (0,12 fr) |
| Onset-sterkte hoofdcues | 3,7–5,9× | 2,6–5,7× | 10–21× | 3,0–9,2× |
| Max. gain reduction limiter | 0,8 dB | 1,0 dB | 2,7 dB | 0,7 dB |

- **Alle vier:**
  - de hoofdcues vallen binnen ±1 frame;
  - geen tekstmoment is het drukst;
  - geen klikken (elke burst heeft fades van minimaal 2 ms, en de stappen in de zwelkast zijn over 10 ms gladgestreken);
  - DC < 7·10⁻⁵.
- **Determinisme:** twee runs geven bit-identieke masters. SHA-256:
  - huidig `47932b72…` (ongewijzigd)
  - orgel `8eab043a…`
  - puls `65a0f852…`
  - sonificatie `7eec2bcd…`
- **Videostream:** identiek in alle vier de MP4's.
- **Huidig op 4,2 s:** er staat geen klap. De gevonden onset (−12 ms) is het begin van de sterrenwolk en de pad-zwelling.
- **Orgel op 4,2 s:** +18,7 ms, de traagste aanzet. Op de cue-akkoorden spreken de pijpen sneller aan (25 ms) en met meer chiff.
- **LRA orgel 6,1 LU:** groter dan de rest, en dat is bewust. De zwelkast bouwt van zacht naar vol.
- **Puls:** de limiter grijpt 2,7 dB in, op de groove-transiënten (thock en tik samen). De true peak blijft −1,3 dBTP.

## Onafhankelijke review van de varianten

Een aparte agent die de varianten niet had gemaakt, heeft ze beoordeeld op metingen (zelf nagemeten), spectrogrammen, code en concept. **Hij kon niet luisteren, en ik ook niet.** Muzikaliteit, klankkwaliteit en de cliché-oordelen zijn afgeleid, niet gehoord.

**Verwerkt:**

| Bevinding | Wat ik deed |
|---|---|
| **Blokkerend (puls):** valt weg op een telefoonspeaker. 80 % van de energie zat onder 80 Hz; telefoonband −21,5, hook −36,5 | Thock-lichaam naar 190 Hz met knock op 450 Hz; bas eerst gesatureerd, dan low-pass met een bodem van 950 Hz; high-pass op 42 Hz; tikken luider. Nu −18,0 / −21,7 en 32 % onder 80 Hz, gelijk aan huidig |
| Sonificatie: de M74-ring werd elk frame willekeurig opnieuw bemonsterd, met een toevalspoort, dus de dolly was niet echt de speelkop | Vaste ring (dezelfde 48 punten in elk frame). Een korrel klinkt als er een heldere structuur onder een punt schuift. De hoek bepaalt het moment binnen het frame. De documentatie is aangepast |
| Sonificatie: de oplossing op het logo was het zwakste moment (8 dB onder de piek) | Glijden in 80 ms, cluster en lage D/A/F♯ luider, de aanslag op de cut zachter. De eindkaart ligt nu 2,2 dB onder de piek; het logo-onset is 6,4× (was 3,9×) |
| Orgel: het onset op 4,2 was fragiel (+24 ms, 2,7×) | Snellere aanspraak met meer chiff op de cue-akkoorden: +18,7 ms, 3,1× |
| Twee loudness-meters gaven verschillende cijfers | Hierboven benoemd |

**Niet veranderd, wel benoemd:**
- **Orgel als pastiche:** pijporgel, ruimte en de beweging ♭VI–♭VII–I (B♭ → C → D) liggen dicht bij *Interstellar*. Dat zit in het concept zelf, zoals gevraagd. Een andere progressie haalt het orgel er niet uit.
- **Puls als tech-promo:** tik en thock op elke tel lezen in het spectrogram als een standaard groove (hi-hat en kick). Ook dat is het concept.
- **Stille openingen:** orgel en sonificatie beginnen zacht. De sonificatie start boven zee, en die is bij de data stil. Dat kan een risico zijn voor het stoppen van de scroll.

**Rangorde van de reviewer** (vóór de fixes hierboven):
1. sonificatie: het meest eigen idee voor het merk, de beste telefoonvertaling en eerlijk in de kern;
2. huidig: het veiligst, met de meeste cues, maar het laag is zwaar, dus een dunne hook op telefoon;
3. orgel: de beste boog en schone cues, maar een stille hook en *Interstellar*-risico;
4. puls: de strakste sync, maar faalde op telefoon (inmiddels opgelost) en is generiek.

Zijn advies: houd huidig als standaard totdat iemand heeft geluisterd, en neem sonificatie als die muzikaal blijkt (geen "willekeurige windgong").
