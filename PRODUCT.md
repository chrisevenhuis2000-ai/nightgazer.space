# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary, confirmed by the user: two audiences with the observer leading.

- **Terugkerende hobby-sterrenkijker** (leads). Knows the site, arrives with two questions: "wat is er nieuw?" and "kan ik vannacht iets zien?". Often on a phone, often in the evening, sometimes outdoors in the dark. This visitor's success is answered live data: ISS position, next launch, tonight's visibility, this week's events.
- **Nieuwsgierige leek** (second). Arrives from Google or social on a single article. Needs to understand what the site is and find one comprehensible story without prior knowledge.

The homepage must serve the observer first and the newcomer immediately after — a two-stage hierarchy, live instrument on top, reading layer below.

## Product Purpose

NightGazer (nightgazer.space) is a Dutch-language astronomy and spaceflight platform. It publishes daily news drawn from NASA, ESA and SpaceflightNow, rewrites articles to three reading levels (Beginner / Amateur / Pro), and pairs that reading layer with live observing tools: ISS tracking, launch and mission calendar, dark-sky map, aurora alert, NASA Astronomy Picture of the Day, and a daily quiz. Success is a returning visitor who both reads and observes.

## Positioning

Dutch-language astronomy coverage where every article exists at three reading levels, published automatically each day, sitting on the same page as live observing data. Neighbouring products pick one side: either translated space news, or a sky/tracking tool. NightGazer's mechanism is that the reading level adapts to the reader and the news sits next to the instruments.

## Operating Context

- Read in Dutch. An `/en` route exists but Dutch is the primary surface.
- Evening and night use is real: the visitor may be outdoors, dark-adapted, one-handed on a phone.
- Content arrives without an editor in the loop: GitHub Actions fetch articles and mission data daily, so the homepage always renders around unpredictable volume, unpredictable titles and sometimes missing images.
- Revenue is advertising (Google AdSense). Ad units are part of the page, not an afterthought.

## Capabilities and Constraints

- Next.js 14 App Router, React 18, TypeScript, Tailwind v3 plus CSS custom properties in `app/globals.css`.
- `output: 'export'` — fully static export with `trailingSlash: true`. No server runtime, no server-side data fetching, no Next `<Image>` optimisation (`images.unoptimized`). Every live value is fetched client-side.
- Live data comes from a Cloudflare Worker proxy (`cosmosnl-proxy.chrisevenhuis2000.workers.dev`) for APOD and NASA image search, and directly from `api.wheretheiss.at` for ISS position. All can fail; every widget needs a real loading and failure state.
- Article data: `public/content/articles-index.json`, 839 articles at time of writing, categories `missies, educatie, mars, kosmologie, james-webb, zwarte-gaten, maan, kometen, sterrenkijken`. Many articles have no image, so card visuals are generated deterministically from the slug.
- Mission data: `content/missions.json` → `lib/missions-data.ts`.
- Dependencies are deliberately few (leaflet, date-fns, gray-matter, clsx, rss-parser). No animation library, no icon library, no component library is installed. Adding one is a decision, not a default.

## Brand Commitments

Made binding by the user for this work:

- The NightGazer wordmark/logo (`public/logo-transparent.png`) stays.
- The brand blues stay the identity: `#185FA5` (orbit) and `#378ADD` (stellar).
- The Google AdSense unit stays on the homepage, same slot ID, comparable position in the reading flow.
- All six sidebar widgets stay present on the homepage: Sterrenkijken, Deze week, Dagelijkse quiz, ISS-tracker, APOD, AI-promo. They may be repositioned or restyled but not removed.

Explicitly released by the user: the news ticker and the animated starfield background are not protected and may be replaced.

Explicitly named failure mode by the user: a generic corporate result. The default dark-SaaS interface look is the anti-reference for this work.

## Evidence on Hand

- Real, current editorial content: 839 Dutch articles in `content/articles/` with categories, excerpts, dates and read times.
- Real mission records in `content/missions.json` with agencies, status, objectives and highlights.
- Real live feeds: NASA APOD, NASA image search, ISS position.
- Real assets: logo in light/dark/transparent variants, favicon, OG image.
- Not available and not to be invented: visitor numbers, subscriber counts, testimonials, press mentions, awards, partner logos, any claim about audience size. There is no newsletter backend confirmed — do not present a newsletter as working.

## Product Principles

1. **The instrument answers first.** Live, perishable data (tonight's sky, ISS, next launch) outranks evergreen layout. If a value is stale or failed, say so rather than showing a confident number.
2. **One subject, three depths.** Every article can be read at Beginner, Amateur or Pro level; the interface should make the reader's level visible and switchable, never hide it.
3. **Built for the dark.** The page is read at night, often outdoors. Contrast, tap targets and brightness are functional requirements, not preferences.
4. **Volume is the normal case.** The design must hold 839 articles and an unpredictable daily feed without an editor curating it.
5. **Ads are designed in.** Advertising funds the site, so its placement is part of the composition rather than a slot dropped into finished work.

## Accessibility & Inclusion

Dutch-language interface. Existing implementation already commits to WCAG 2.1 AA focus states, a skip link, `aria-label`/`aria-live` on the article grid, and a 44px minimum tap target (`--tap-min`). Treat these as the floor. Night-time outdoor reading makes contrast and tap-target size a product requirement.
