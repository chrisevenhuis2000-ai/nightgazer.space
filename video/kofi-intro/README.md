# NightGazer Ko-fi intro — "Help de sterren gratis te houden"

Merkpromo voor de introvideo op ko-fi.com/nightgazerspace. 1920 × 1080 (16:9, Ko-fi speelt hem af via een YouTube- of Vimeo-link), 30 fps, precies 32,0 s. Gebouwd op de huisstijl en de camerareis van de social-v2 brand video (`brand/social-v2`), zonder plaatkader, zonder plaatnummer en zonder "Illustratie"-label. Alleen tekst in beeld, geen voice-over.

## Script en beat-grid (frame-exact; de mix volgt `klank/draaiboek.json`)

| Tijd (s) | Beeld | Tekst | Klank |
|---|---|---|---|
| 0,00 | Europa bij nacht (NASA Black Marble), langzame push (frame 0 = poster) | **Elke nacht gebeurt er iets boven je dak.** | impact op frame 1 |
| 3,60 | Haak weggeveegd langs een haarlijn | | whoosh in |
| **4,00** | **Match-cut:** de horizon van de aarde wordt de rand van een planeet | | **hit (snel)** |
| 4,60 | Planeet, terminator schuift door beeld | NIGHTGAZER.SPACE · **Wat je vannacht ziet.** | |
| 6,2 / 7,4 / 8,6 | | Vannacht · Nieuws · Leren (drie regels) | |
| 12,70 | Tekst weg, adem | | |
| **13,50** | **Drop:** de camera klimt over de rand, M74 (ESA/Webb) komt op, rechts in beeld | | **onthulling (groot)** |
| 14,2 / 15,4 / 17,4 | Dolly door de melkweg | **Onafhankelijk. Zonder betaalmuur.** · Gemaakt in Nederland, voor iedereen die omhoog kijkt. | |
| **21,00** | De melkweg zakt terug in het merkblauw | **Help de sterren gratis te houden.** · Met een koffie houd je NightGazer draaiende. | **wissel (zacht)** |
| **25,50** | Eindkaart | logo · **nightgazer.space** · knop **Trakteer op een koffie** · ko-fi.com/nightgazerspace | **afsluiting + klanklogo** |
| 27,50–32,00 | Alles stil (alleen grain) | | uitklinken |

## Opbouw
- `index.html`: root met twee sub-composities en de soundtrack.
- `compositions/stage.html`: Three.js-wereld uit social-v2 (`assets/space.js`): nachtaarde, procedurele planeet, M74 in 2.5D, sterren, grade, grain en de merkblauwe grond.
- `compositions/titles.html`: alle tekst, de eindkaart en de beeldcredits.
- `klank/draaiboek.json`: cues en script voor audio-engine 7 (nightgazer-social, profiel film: ACE-Step-muziek, whoosh/hit per wissel, −14 LUFS).
- `klank/bouw-lxc.sh`: muziek, mix en render op de LXC (GPU), één zware job tegelijk.

## Bouwen (op de LXC)
```bash
# in video/kofi-intro/, texturen uit social-v2 (of: bash scripts/fetch-sources.sh && python3 scripts/prep-textures.py)
cp -r ../social-v2/assets/tex assets/tex
bash klank/bouw-lxc.sh muziek     # 3 ACE-Step-takes
bash klank/bouw-lxc.sh mix 2      # kies een take
bash klank/bouw-lxc.sh render     # out/kofi-intro.mp4 (+ stil, cover)
```
`out/` en `assets/tex/` staan in `.gitignore`.

## Op Ko-fi zetten
Ko-fi neemt alleen een link: upload `out/kofi-intro.mp4` naar YouTube (zichtbaarheid "Niet vermeld" is genoeg) of Vimeo, en plak de link bij Ko-fi → Edit page → Add an intro video.
