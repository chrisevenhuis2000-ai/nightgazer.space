# NightGazer social v1

HyperFrames-project voor de eerste social post. 1080×1920 (9:16), 30 fps, precies 10,0 s, geen audio (geluid gaat er in de app onder). Stijl, fonts, GSAP en logo zijn gekopieerd uit `video/brand-v1/`.

| Beat | Tijd (s) | Op beeld | Bestand |
|---|---|---|---|
| Hook | 0–1,5 | "Kun je vannacht iets zien?" + cel VANNACHT 7/10, Bortle 4, `VOORBEELD`. Frame 0 is compleet en dient als thumbnail. | `compositions/hook.html` |
| Belofte | 1,5–2,75 | "Ruimtenieuws. In het Nederlands." | `compositions/belofte.html` |
| Dieptes | 2,75–5,15 | Kernfusie, ladder Beginner → Pro, letterlijke fragmenten uit `lib/education-data.ts` | `compositions/dieptes.html` |
| Instrument | 5,15–8,0 | ISS, volgende lancering, vannacht (illustratieve waarden) | `compositions/instrument.html` |
| Afsluiter | 8,0–10,0 | Logo (native 500 px), nightgazer.space, CTA "Vannacht kijken". Vanaf 8,9 s staat alles stil. | `compositions/afsluiter.html` |

De plaat (`compositions/plate.html`) staat vanaf frame 0 in beeld en blijft de hele video staan. Gedeelde stijl staat in `assets/social.css`, gedeelde bewegingshulpjes in `assets/ng.js`.

Safe zone voor alles wat ertoe doet: x 80–1000, y 250–1540. Daarbuiten staan alleen de decoratieve plaatvelden.

```bash
# in video/social-v1/
npx hyperframes check
npx hyperframes render . -o out/nightgazer-social-v1.mp4
ffmpeg -ss 0 -i out/nightgazer-social-v1.mp4 -frames:v 1 out/cover.png
```

`out/` staat in `.gitignore`: de MP4 en de cover worden niet gecommit.
