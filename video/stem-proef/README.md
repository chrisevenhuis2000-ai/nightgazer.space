# Stemproef: stem G menselijker (09-11-2026)

Doel: een voice-over die een Nederlandse luisteraar niet meteen als AI herkent. Blinde test op de drie goedgekeurde
huisstijl-reels (Maan, ISS, Leoniden, uit `video/stijl-proef/` op branch `claude/project-thread-ntqob5`), met
dezelfde muziek en scène, en de huidige stem G als controle.

## Varianten

| | Wat | Model en licentie |
|---|---|---|
| controle | stem G zoals nu: per zin een take, snelste goede wint, vaste digitale stiltes | VoxCPM2, Apache-2.0 |
| A | VoxCPM2 slimmer: per blok van 2–3 zinnen (intonatie loopt door), 24 stappen, cfg uit de sweep, keuze op natuurlijkheid, spreektaal, gevarieerde pauzes met roomtone, lichte nabewerking | VoxCPM2, Apache-2.0 |
| A2 | als A, maar zonder de referentie als prompt-voortzetting (alleen als stemkleur), zodat de toon minder vastzit aan de 10 s ontworpen referentie | VoxCPM2, Apache-2.0 |
| C | Chatterbox Multilingual V3 (Nederlands), kloont stem G van dezelfde referentie | MIT (code én gewichten), PerTh-watermerk |
| B | (na een opname) VoxCPM2 kloont van een echte opname van Crix | VoxCPM2, Apache-2.0 |
| D | (vanaf 21-11) ElevenLabs v3 of v4, Nederlandse stem | abonnement |

Afgevallen op licentie van de gewichten: XTTS v2 (CPML), F5-TTS (CC BY-NC), Fish/OpenAudio (research), Voxtral TTS
(CC BY-NC), OmniVoice (niet-commercieel). Qwen3-TTS (Apache-2.0) spreekt geen Nederlands; Kokoro, Dia en NeuTTS ook niet.

## Draaien (LXC, als claude-ops, één zware job tegelijk)

```bash
git clone --depth 1 -b claude/project-thread-rhc43i https://github.com/chrisevenhuis2000-ai/nightgazer.space ~/werk/stem-proef/site
cd ~/werk/stem-proef/site/video/stem-proef
bash run-lxc.sh opzet && bash run-lxc.sh diagnose && bash run-lxc.sh controle
bash run-lxc.sh sweep                                   # kies daarna de beste cfg/stappen per prompt-stand
bash run-lxc.sh chatterbox-installeer && bash run-lxc.sh chatterbox-sweep
bash run-lxc.sh variant A  voxcpm --stappen 24 --cfg <beste> --prompt ja  --seeds 4
bash run-lxc.sh variant A2 voxcpm --stappen 24 --cfg <beste> --prompt nee --seeds 4
bash run-lxc.sh variant C  chatterbox --cfg <beste> --exag <beste> --seeds 4
for v in A A2 C; do bash run-lxc.sh film $v; done
```

`scripts/maak.py` schrijft per reel `vo.wav` en `tijden.json` in hetzelfde contract als nu
(`{"lijnen": [[start, eind], …], "dur": s}`), zodat camera en ondertitels (`L(i, f)`) gewoon werken.
`reels/*.json` zijn de spreektaal-versies: hetzelfde aantal zinnen als de goedgekeurde reels, `blokken` zegt welke
zinnen samen in één take gaan.

## Variant B: opname door Crix

Voorleesscript (rustig, alsof je het aan één vriend uitlegt, ~45 s):

> Als je vannacht omhoog kijkt, zie je licht dat al heel lang onderweg is. Sommige sterren zie je zoals ze waren
> toen je opa nog een kind was. Gek idee, toch? De Maan is dichterbij: een goeie seconde licht. En de Zon? Ruim acht
> minuten. Dus als de Zon nu uit zou gaan, merk je dat pas over acht minuten. Ik vind dat het mooiste van de
> sterrenhemel. Je kijkt niet alleen ver weg, je kijkt ook terug in de tijd. Pak vanavond een stoel, laat je ogen
> een kwartiertje wennen aan het donker, en kijk gewoon. Je gaat meer zien dan je denkt.

Opnametips: telefoon of usb-microfoon op 20–30 cm, iets naast je mond (niet erin blazen). Kleine kamer met zachte
spullen (slaapkamer, kast met kleding), deur dicht, geen ventilator of wasmachine. Eerst 3 s stil zijn. Niet
voorlezen maar vertellen; adem gewoon, een verspreking mag je herhalen. WAV of de hoogste kwaliteit van je
memo-app, geen ruisonderdrukking of effecten. Stuur het bestand en schrijf erbij dat NightGazer jouw stem mag
gebruiken voor de voice-over (dat is de schriftelijke toestemming). `ai.stem: true` blijft staan.
