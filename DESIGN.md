# Design — NightGazer

<!-- Written from the built /staging homepage. The live pages still carry the
     previous system; this file describes what replaces it. -->

## World

**The photographic plate archive.** Content is not a feed of cards; it is a
collection of plates, each with a number, an exposure date, and an archivist's
marks. The interface is the archive's own furniture: emulsion grounds,
hairline rules, printed envelope fields, edge fiducial rulers, corner
registration marks. Live instruments are readouts printed over the plate.

What this refuses: the dark-space hero photo with glowing neon accents, and
the card grid as page structure. 839 articles are a ruled ledger.

## Colour

The existing NightGazer palette, re-cast in archive roles.

| Token | Value | Role |
|---|---|---|
| `--pl-ground` | `#0E1022` | The archive drawer. Page ground; the void between sections. |
| `--pl-plate` | `#15182F` | The emulsion field. Every plate and cell. |
| `--pl-plate-2` | `#1A1D38` | Raised emulsion: hover, empty figures. |
| `--pl-plate-lift` | `#1F2340` | Pressed/active surface. |
| `--pl-rule` | `#272C50` | **The only elevation device.** 1px, no shadows. |
| `--pl-rule-soft` | `#1E2240` | Interior divisions inside one plate. |
| `--pl-ink` | `#EEF2FB` | Primary text. |
| `--pl-ink-2` | `#9AA6C8` | Body and secondary. 7.2:1. |
| `--pl-ink-3` | `#868EB4` | Printed field labels, timestamps, credits. 5.1:1 on the darkest hover ground. |
| `--pl-mark` | `#378ADD` | **Chinagraph blue. Reserved by law.** |
| `--pl-act` | `#3DCFDF` | **Interactive only. Reserved by law.** 9.3:1. |
| `--pl-orbit` | `#185FA5` | Structural brand blue: lit fiducials, meters, loupe. |
| `--pl-stamp` | `#B5D4F4` | Provenance: plate numbers, focus rings, action rules. |
| `--pl-good` | `#4FD39B` | Conditions good, answer correct. |
| `--pl-warn` | `#E0685A` | Conditions poor, answer wrong, staging stamp. |

### Two reserved colours, two questions

The palette answers two different questions with two sibling blues, and
neither may answer the other's.

**`--pl-mark` (#378ADD) — "is this changing?"** Live, perishable values only:
tonight's score, cloud cover, ISS coordinates, a countdown, today's APOD date,
the ring around today's plate. Never a link, a border, a hover state, or
decoration.

**`--pl-act` (#3DCFDF) — "does this respond to me?"** Interactive affordance
only: buttons, the active topic tab, the pressed quick filter, the read-link
rule, hovered row and card titles, the current nav item's underline, the focus
ring. Never a data value.

Both are mechanically checkable. No element outside `.pl-live` may compute to
`rgb(55, 138, 221)`; verified at 0. Every interactive element must reach
`rgb(61, 207, 223)` in at least one state; verified across buttons, tabs,
segmented controls, tags and read links.

`.pl button` must **not** set `color: inherit` — it out-specifies every
single-class button rule and silently strips the interactive colour.

Besides those two, exactly two semantic colours exist (`--pl-good`,
`--pl-warn`). A category, an agency, or a reading level never gets its own
colour — that is what marks are for.

### Contrast

Audited on the rendered page, not on intent: every text node in `.pl` is
checked against its composited background at its real font size and weight,
against 4.5:1 (3:1 for large text). **0 failures at both 1440px and 390px.**
Re-run it after any colour change. Three things it caught that intent missed:
`--pl-ink-3` at 4.17:1, white on `#378ADD` in the global skip link at 3.21:1,
and the chinagraph blue at 4.26:1 on a translucent tooltip ground.

## Type

- **Archivo** (400/500/600/700/800) carries everything. One face, because
  one condensed grotesk did all the work on a real plate envelope.
- **JetBrains Mono** for measurement only: coordinates, times, counts,
  magnitudes, plate numbers. `font-variant-numeric: tabular-nums`. Never as
  a costume for "technical".
- Printed label (`.pl-label`): 11px, 600, `0.2em` tracking, uppercase. Every
  region and every control carries one.
- Display: `clamp(1.85rem, 3.3vw, 2.95rem)`, weight 800, tracking `-0.032em`,
  `text-wrap: balance`. Tracking floor is `-0.04em`.
- Body measure 54–68ch, `text-wrap: pretty`.

## Form

- **Radius 0 everywhere.** A glass plate has square corners. Depth comes from
  corner registration marks (`.pl-plate::before/::after`), not rounding.
- **Elevation declared once.** A 1px rule or nothing. No card shadows, no
  border-plus-shadow ghost cards.
- **State is a mark, not a hue.** Reading level is a three-step ladder
  (`.pl-ladder`); mission status is a filled or open square (`.pl-status`).
- **No nested cards.** Sections sit in deliberate voids of ground. `.pl-stack`
  owns every vertical gap so no two paddings can add up.
- **Icons are authored SVG**, one 1.25 stroke, in `Instruments.tsx` (`Ico`).
  No icon library, no emoji standing in for an icon. Mission `icon` emoji
  from `missions.json` are deliberately not rendered.
- **Images get one art direction.** `.pl-emulsion` applies a silver-gelatin
  grade pulled toward the brand blue. Exception: `.pl-emulsion--map`, because
  a map is a diagram and legibility beats art direction.

## The hero

Depth is one `.pl-firstview__glow` layer: two deep-blue radial fields
(`--pl-orbit` at 30%, `--pl-mark` at 13%) anchored where the headline sits,
painted under the dark overlay so the display type lifts without the text
contrast moving. **No purple** — a blue-to-purple hero gradient is the single
most common generated-UI fingerprint, and the palette does not contain it.

Two actions, one primary: `.pl-cta__primary` ("Vannacht kijken" →
`/sterrenkijken`) in solid `--pl-act` with **dark** ink `#06131A` at 10:1,
because white on that cyan is 1.88:1. Secondary is a quiet ruled link
("Laatste updates" → the archive anchor). Both are 44px tall. The primary
points at `/sterrenkijken` rather than the live bar, since that bar is already
visible 100px below — a CTA that scrolls to what you can already see is not a
next step.

## Wayfinding and entry points

- **Quick bar** under the header: a search trigger (dispatches
  `nightgazer:search-open`, which `useSearchModal` listens for, so the whole
  site now has a clickable search) plus hashtag quick filters. Every tag
  matches on category **or** title keywords, and a tag resolving to zero
  articles is not rendered — no decorative filters.
- The quick tag narrows the archive pool first; the topic tabs filter within
  it, and the tab counts follow the narrowed pool so no tab promises rows the
  active tag already excluded.
- **Ticker** between the lead plate and the mission rail, filling what was an
  empty band of ground. Fixed 46px lane, duplicated once for a seamless loop,
  paused on hover and focus, and degraded to a plain horizontal scroller under
  `prefers-reduced-motion`.
- **Band headers** (`.pl-band`) with a `border-top` rule mark every section
  boundary, and instrument cells sit on a cooler ground (`#171A32`) with a
  solid header strip so live instruments never read as editorial content.

## Tooltips

Data points that need interpretation carry a `.pl-tip`. The trigger is a real
`<button>`, so the explanation is reachable by keyboard, and the ISS marker is
a focusable `.pl-hotspot` with its full readout. On screens below 860px the
tooltip anchors to the instrument bar rather than its trigger, because
trigger-anchored tooltips in right-hand cells ran off the viewport.

## Layout stability

Measured, not assumed: **CLS 0.0076 desktop, 0 mobile** (budget 0.10).
Live values render into fixed-height `.pl-instr__slot` boxes, every figure has
an `aspect-ratio`, counts reserve their width with `min-width` plus
`tabular-nums`, and skeletons match the shape of what is loading.

## Motion

The budget grew from one authored moment to a small standing set, on request.
Every item is quiet enough to compose rather than compete, and each one earns
its place by carrying information.

**The authored moment**

1. **The light-box loupe** — a radial `--pl-orbit` glow follows the pointer
   across the archive ledger, lifting the emulsion locally. Gated on the
   event's `pointerType`, never on a `(pointer: fine)` media query.

**Signals — motion follows the chinagraph law: if it breathes, it is live**

2. **`.pl-dot`** breathes on a 3.4s ease, with an expanding hairline halo.
   Applied only where a value actually refreshes: the ISS feed and the
   forecast-backed instruments. Mission status stays a static mark, because
   "actief" is a state, not a ticking value.
3. **The continuous readout** (`.pl-readout`) sweeps under a live feed, so a
   live number never looks frozen.
4. **The ticker** scrolls at a constant **55 px/s**, with the duration derived
   in JS from the measured lane width (`--pl-ticker-dur`) — constant speed,
   not constant duration, so adding headlines does not speed it up. Pauses on
   hover and focus.

**Depth and place**

5. **The chinagraph ring** settles in once over today's plate.
6. **`.pl-lift`** raises card-like surfaces exactly 2px on hover and focus,
   with a shadow tinted to the ground (`rgba(6,8,20,0.66)`) plus an
   orbit-blue rim — never generic black. Ledger rows are excluded on purpose:
   lifting a row would break the ruled grid, so rows answer with the loupe
   and a cyan title instead.
7. **`.pl-stars`** — two layers of silver grains drift across the hero on
   `translate3d` over 190s and 280s. Confined to that one block, never a
   page-wide canvas, `pointer-events: none`.

Two implementation traps, both of which bit once: a later `transition:
background` shorthand silently replaces `.pl-lift`'s transition list, and
`.pl a { color: inherit }` out-specifies `.pl-cta__primary` and turned its
dark ink white on cyan (1.88:1). Neither is visible without measuring.

No entry animation on any section: everything is visible at first paint.
`transform`, `opacity`, `box-shadow` only — no layout properties.
`prefers-reduced-motion: reduce` flattens all of it and removes the loupe.
Steady-state running animations with data loaded: 11.

## Browser surfaces

Themed, not left to the browser: `::selection`, `caret-color`, scrollbar
track and thumb (WebKit and `scrollbar-color`), focus ring
(`--pl-act`, 2px, 3px offset), tabular figures in every data column.

## Honesty rules

- A failed live feed says so (`.pl-instr__off`, `.pl-fail`) and shows no
  number. The ISS plate states outright why no last-known position is kept.
- Skeletons match the shape of what is loading.
- The advertising slot is a labelled field of the archive with its space
  reserved, not a hole punched into finished work.
- Illustrative content is labelled (the level-comparison plate says
  "voorbeeld"). No invented metrics, testimonials, or audience claims.

## Surfaces

Two surfaces exist in this world. They share `app/staging/shared.tsx`: the
staging banner, the plate header, the quick bar, the advertising field, the
`Ladder` mark, `plateNo`/`img`, and `useArticles`. Anything used by both goes
there — a second copy is how the two drift apart.

**`/staging` — the front page.** Mode Operate. The observer's live instruments
answer first, the reading layer follows, the ledger holds the volume.

**`/staging/nieuws` — the news archive.** Mode Read. The drawer bank: the
archive is a cabinet and topics are drawers. A sticky rail on the left carries
the topic drawers and the reading-level drawers with their counts; the open
drawer fills the sheet beside it.

One behaviour rule this surface adds to the system:

> **An open drawer slides out of the cabinet.** `padding-left` moves from 18px
> to 24px and a 2px `--pl-act` grip appears on the leading edge. It is a
> position and a grip, never a coloured badge — the same reason reading level
> is a ladder and mission status is a filled square.

Filters compose in one direction: the quick tag narrows the pool, then the
drawer and the level filter within it. Every count follows the narrowed pool,
so no drawer ever promises rows an active filter has already excluded. The
empty state names both active filters rather than shrugging.

## Content truth the design depends on

`scripts/generate-index.js` derives an excerpt from the article body when the
frontmatter has none. Before this, 521 of 873 articles (60%) had an empty
`excerpt`, so most cards and every ledger row rendered a headline with no
context. The derivation is the first paragraph, markdown stripped, cut on a
word boundary — it invents nothing. Any surface showing an excerpt should
still guard on `excerpt?.trim()`, because an article with an empty body would
produce an empty one.

Known and unresolved: titles and excerpts arrive in English from the NASA and
ESA feeds while the product promises Dutch. Surfacing excerpts made this more
visible; it is a content-pipeline question, not a design one.

## Layout notes worth keeping

`.pl-stack` must declare `grid-template-columns: minmax(0, 1fr)` and `.pl-wrap`
must set `width: 100%`. With an implicit `auto` track, the items' min-content
floor (`width:100%` plus `max-width`) blew every section out to 1320px on all
viewports. Both lines are load-bearing.

Breakpoints: 1080 (instrument bar to 3 columns, banks collapse, lead plate
stacks), 860 (nav to hamburger, ledger rows to two columns), 620 (instrument
bar to 2 columns, banks to one).
