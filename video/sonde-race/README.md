# NightGazer reel — "De race naar de sterren"

9:16 (1080 × 1920), 30 fps, 30 s. Het format van de F1-klassementvideo's (een 3D-timing tower vertelt het hele verhaal, elke inhaalactie wordt een filmisch moment, banners slaan in), vertaald naar de verste ruimtesondes ooit. Geen plaatkader, geen plaatnummer, geen "Illustratie"-label.

Het klassement is echt: heliocentrische afstand per sonde uit NASA/JPL Horizons (`assets/data/horizons-kwartaal.json`, opgehaald 2026-11-07). Na contactverlies (Pioneer 11: 30 sep 1995, Pioneer 10: 23 jan 2003) is het een berekende baan; dat staat op de eindkaart.

| Tijd (s) | Beeld | Data |
|---|---|---|
| 0,0 | Haak: tower in diep perspectief. "Deze race duurt al 54 jaar." | 1972 |
| 3,4 | Banner **LANCERING**, Voyager 2 en 1 schuiven in | aug/sep 1977 |
| 6,3 | Voyager 1 passeert Voyager 2 (vonk rond de rij) | dec 1977 |
| 7,6 | Banner **ZWAARTEKRACHTSLINGER**, paarse nevel, 3D-achterstand van V1 op de leider vliegt naar de camera | mrt 1979 |
| 9,3 | Voyager 1 passeert Pioneer 11 | mrt 1981 |
| 10,2 | Doorspoelen (warp) | 1981 → 1998 |
| 11,6 | **Duel** in 3D: blokken V1 en P10 in nevel | |
| 13,4 | **Drop:** V1 zwaait over P10, lichtstralen, vonken. "17 FEB 1998" | 17 feb 1998 (NASA) |
| 15,2 | Terug naar de tower, V1 op P1 | |
| 16,6 | Banner **SIGNAAL STIL**: Pioneer 10 | jan 2003 |
| 18,6 | Banner **SNELSTE LANCERING**: New Horizons komt binnen | jan 2006 |
| 20,4 | Banner **INTERSTELLAIR**: de camera vliegt door de heliopauze | aug 2012 |
| 22,6 | Doorspoelen; Voyager 2 passeert onderweg Pioneer 10 (berekend, jul 2023) | 2013 → 2026 |
| 24,2 | **Finish: 1 LICHTDAG**, geblokte vlaggen, aarde als stipje | 18 nov 2026 |
| 27,4 | Eindkaart: nightgazer.space, "Meer uitleg: link in bio" | |

1 lichtdag = 25.902.068.371 km. Voyager 1 tot de aarde volgens Horizons: 25.901.124.220 km op 18-11-2026 00:00 en 25.903.316.943 km op 19-11 00:00, dus de grens valt op 18 november.

## Opbouw
- `index.html`: beat-grid `window.__RACE_T` en jaarkaart `window.__RACE_YEAR` (seconden → jaartal, de inhaalmomenten vallen op de beats).
- `compositions/stage.html`: Three.js, drie scènes (tower, duel, finish). Alles is een pure functie van de tijd.
- `compositions/titles.html`: haak, bijschriften, eindkaart.
- `scripts/maak-race-data.py`: Horizons-JSON → `assets/data/race-data.js`.
- `klank/`: ACE-Step + audio-engine 7, zie `klank/bouw-lxc.sh`.

## Bouwen (op de LXC)
```bash
bash klank/bouw-lxc.sh muziek
bash klank/bouw-lxc.sh mix 2
bash klank/bouw-lxc.sh render
```
