# NightGazer brand video v1

HyperFrames-project, los van de Next.js-app. 1920×1080, 30 fps, 29,5 s, geen audio.

| # | Scène | Tijd (s) | Bestand |
|---|---|---|---|
| 1 | Lege plaat tekent zichzelf, plaatnummer gestempeld | 0–4 | `compositions/frame.html` (blijft de hele film staan) |
| 2 | Ruimtenieuws. Elke dag. In het Nederlands. + 2 echte titels | 4–9 | `compositions/belofte.html` |
| 3 | Kernfusie op Beginner → Amateur → Pro (tekst uit `lib/education-data.ts`) | 9–18,5 | `compositions/dieptes.html` |
| 4 | Instrumenten: ISS, aftelling, vannacht + Bortle (illustratieve waarden) | 18,5–22,5 | `compositions/instrument.html` |
| 5 | Logo (native 500 px) + "Astronomie voor Iedereen" | 22,5–26 | `compositions/logo.html` |
| 6 | Eindkaart nightgazer.space + CTA "Vannacht kijken" | 26–29,5 | `compositions/eindkaart.html` |

Fonts (Archivo, JetBrains Mono, SIL OFL) en GSAP staan lokaal in `assets/`, zodat de render deterministisch is. Kleuren en easing komen uit `app/_plate/plate.css`.

```bash
# in video/brand-v1/
npx hyperframes check
npx hyperframes render . -o out/nightgazer-brand-v1.mp4
ffmpeg -ss 29 -i out/nightgazer-brand-v1.mp4 -frames:v 1 out/nightgazer-brand-v1-poster.png
```

`out/` staat in `.gitignore`: de MP4 en poster worden niet gecommit.
