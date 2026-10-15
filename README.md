# 🔭 Nightgazer.space

> Astronomie voor iedereen: Nederlandstalig ruimtevaartnieuws op drie leesniveaus, naast live waarneemtools.

Live: https://nightgazer.space

## Wat het doet

- **Dagelijks nieuws, automatisch.** GitHub Actions haalt elke ochtend RSS op (NASA, ESA, JPL, SpaceflightNow, SpaceNews, Planetary Society). Claude herschrijft de artikelen in het Nederlands op drie niveaus: Beginner, Amateur en Pro.
- **Live waarneemtools.** ISS-tracker, lanceringen en missies, donkere-hemelkaart, noorderlichtalert, NASA APOD en een dagelijkse quiz.
- **Pushmeldingen** voor heldere nachten, noorderlicht, ISS-overkomsten en lanceringen.
- **AdSense** met GDPR-toestemming.

## Stack

- Next.js 14 (App Router), React 18, TypeScript, gewone CSS met CSS-variabelen (`app/globals.css`, `app/_plate/plate.css`)
- `output: 'export'`: een volledig statische site zonder server-runtime. Alle live data wordt client-side opgehaald.
- Hosting op **Cloudflare Pages**, gebouwd via de git-koppeling.
- **Cloudflare Worker** (`cf-worker/`) als proxy voor API-sleutels, plus de cron voor pushmeldingen.

## Lokaal starten

```bash
git clone https://github.com/chrisevenhuis2000-ai/nightgazer.space
cd nightgazer.space
npm install
cp .env.example .env.local   # vul je keys in
npm run dev                  # draait eerst prebuild (index, rss, sitemap)
```

## Projectstructuur

```
app/                    Next.js routes
  page.tsx, HomePage    homepage (plaatarchief)
  _plate/               gedeelde chrome en plate.css van het designsysteem
  nieuws/               ladenbank, [slug] (artikel), onderwerp/[category]
  missies/              lanceermanifest + [slug]
  sterrenkijken/        belichtingstabel, kaart, ISS, noorderlicht, maankalender
  educatie/  tools/herschrijver/  en/  over/  contact/  privacy/
  components/           SiteNav, SiteFooter, AdUnit, CookieBanner, Search…
lib/                    data en logica (iss, aurora, sky-chart, missions, push, ics…)
content/articles/       markdown-artikelen (door de bot geschreven)
content/missions.json   missiedata (door de bot bijgewerkt)
scripts/                fetch-articles, backfill-images, update-missions, generate-*
cf-worker/              Cloudflare Worker: proxy-routes + push-cron
PRODUCT.md / DESIGN.md  productbrief en designsysteem van de redesign
```

## Automatisering

| Workflow | Wanneer | Wat |
|---|---|---|
| `fetch-articles.yml` | dagelijks 07:17 UTC | RSS → volledige brontekst → Claude (structured output) → `content/articles/`, daarna image-backfill. Geen geldige Nederlandse herschrijving (≥ 250 woorden, vertaalde titel) = niet publiceren; de run-samenvatting meldt `Claude-aanroepen` en gepubliceerd / overgeslagen |
| `update-missions.yml` | dagelijks 07:43 UTC | missiedata bijwerken → `content/missions.json`; highlight van een lancering altijd uit een vast sjabloon (status, datum, voertuig), van een missie bij een statuswijziging; Claude-tekst bij een nieuwe missie, en voor soort `missie` bij actief worden en elke 30 dagen. `"_herverrijk": true` op een actieve missie stuurt hem bij de volgende run opnieuw door die route. De run-samenvatting meldt `Claude-aanroepen: N` |
| `deploy.yml` | elke push naar main | Cloudflare Worker deployen |
| `setup-push.yml` | eenmalig | KV-namespace + VAPID-sleutels voor push |
| `backfill-images-once.yml` | handmatig | afbeeldingen opnieuw ophalen |

De site zelf wordt bij elke push door Cloudflare Pages gebouwd. `npm run build` draait via `prebuild` eerst `generate-missions-module`, `generate-index`, `generate-rss` en `generate-sitemap`, en kopieert daarna de artikelen naar `public/content/`. Die bestanden zijn gegenereerd en staan daarom niet in git.

**GitHub-secrets:** `ANTHROPIC_API_KEY`, `CLOUDFLARE_API_TOKEN`, optioneel `DEPLOY_HOOK_URL`
**Worker-secrets:** `NASA_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

## Worker-routes

`/apod`, `/image-search`, `/image-proxy`, `/weather`, `/space-weather`, `/launches`, `/push/*`, `POST /` (Anthropic-proxy voor de herschrijver). De cron draait elke 15 minuten voor de pushmeldingen.
