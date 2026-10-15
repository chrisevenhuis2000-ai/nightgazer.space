'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer nieuwsarchief — /nieuws en /nieuws/onderwerp/[category]

   Compositie: de ladenbank. Het archief is een kast, onderwerpen zijn laden.
   Een plakkende ladenrail links, de gekozen lade vult het blad rechts.
   Wereld en kleurwetten staan in DESIGN.md; de chrome komt uit shared.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { type Article, getLevel, topicMatches } from '@/lib/home-content'
import { TOPICS as TOPIC_PAGES } from '@/lib/topics'
import { Ico } from '@/app/_plate/Instruments'
import {
  archivo, ROWS_PER_PAGE, QUICK_TAGS, quickMatches,
  FOOTER_COLS, LEVEL_WORD, plateNo, img, Ladder,
  PlateHead, QuickBar, AdPlate, useArticles, editionLabel,
} from '@/app/_plate/shared'

/* ── De laden ─────────────────────────────────────────────────────────────
   Elke lade is een echte categorie uit het archief. De omschrijvingen komen
   uit lib/topics.ts waar die bestaan, zodat de nieuwspagina en de
   onderwerp-routes dezelfde tekst gebruiken. */
const DRAWERS: { key: string; label: string; slug?: string }[] = [
  { key: 'Alles',         label: 'Alle platen' },
  { key: 'Missies',       label: 'Missies',      slug: 'missies' },
  { key: 'Educatie',      label: 'Educatie',     slug: 'educatie' },
  { key: 'Maan',          label: 'Maan',         slug: 'maan' },
  { key: 'Mars',          label: 'Mars',         slug: 'mars' },
  { key: 'James Webb',    label: 'James Webb',   slug: 'james-webb' },
  { key: 'Kosmologie',    label: 'Kosmologie',   slug: 'kosmologie' },
  { key: 'Kometen',       label: 'Kometen',      slug: 'kometen' },
  { key: 'Zwarte Gaten',  label: 'Zwarte gaten' },
  { key: 'Sterrenkijken', label: 'Sterrenkijken' },
]

type Level = 'alle' | 'beg' | 'ama' | 'pro'

const LEVELS: { key: Level; label: string }[] = [
  { key: 'alle', label: 'Alle niveaus' },
  { key: 'beg',  label: 'Beginner' },
  { key: 'ama',  label: 'Amateur' },
  { key: 'pro',  label: 'Pro' },
]

function drawerDescription(key: string): string | null {
  const d = DRAWERS.find(x => x.key === key)
  if (!d?.slug) return null
  return TOPIC_PAGES.find(t => t.slug === d.slug)?.description ?? null
}

/* ── De hoofdplaat van de open lade ───────────────────────────────────────
   Grote emulsie met plaatnummer, precies zoals de plaat van vandaag op de
   voorpagina. Geen ring meer: die is voortaan alleen voor de beste nacht
   op /sterrenkijken. */
function Lede({ a, no }: { a: Article; no: string }) {
  const lvl = getLevel(a.category)
  return (
    <Link href={`/nieuws/${a.slug}`} className="pl-lede">
      <span className="pl-lede__fig">
        <span className="pl-emulsion" style={{ display: 'block' }}>
          {a.imageUrl
            ? <img src={img(a.imageUrl, 1100)} alt="" />
            : <span style={{ position: 'absolute', inset: 0, background: 'var(--pl-plate-2)' }} />}
        </span>
        <span className="pl-stampno pl-num">{no}</span>
      </span>

      <span className="pl-lede__body">
        <span className="pl-meta">
          <span className="pl-label pl-label--stamp">Nieuwste plaat</span>
          <span className="pl-meta__tick" aria-hidden="true" />
          <span>{a.category}</span>
        </span>

        <span className="pl-lede__t">{a.title}</span>

        {a.excerpt?.trim() && <span className="pl-lede__ex">{a.excerpt}</span>}

        <span className="pl-meta" style={{ marginTop: 4 }}>
          <Ladder level={lvl} />
          <span>{LEVEL_WORD[lvl]}</span>
          <span className="pl-meta__tick" aria-hidden="true" />
          <span className="pl-num">{a.date}</span>
          <span className="pl-meta__tick" aria-hidden="true" />
          <span className="pl-num">{a.readTime} min</span>
        </span>

        <span className="pl-read" style={{ minHeight: 28 }}>
          <span>Lees deze plaat</span>
          <span className="pl-read__rule" aria-hidden="true" />
          <Ico.arrow />
        </span>
      </span>
    </Link>
  )
}

/* ── De twee platen daaronder: half zo groot, dubbel zo veel ── */
function Second({ a, no }: { a: Article; no: string }) {
  const lvl = getLevel(a.category)
  return (
    <Link href={`/nieuws/${a.slug}`} className="pl-second">
      <span className="pl-second__fig">
        <span className="pl-emulsion pl-emulsion--sm" style={{ display: 'block' }}>
          {a.imageUrl
            ? <img src={img(a.imageUrl, 620)} alt="" loading="lazy" />
            : <span style={{ position: 'absolute', inset: 0, background: 'var(--pl-plate-2)' }} />}
        </span>
      </span>
      <span className="pl-meta">
        <span className="pl-num">{no}</span>
        <span className="pl-meta__tick" aria-hidden="true" />
        <span>{a.category}</span>
      </span>
      <span className="pl-second__t">{a.title}</span>
      <span className="pl-meta" style={{ marginTop: 'auto' }}>
        <Ladder level={lvl} />
        <span>{LEVEL_WORD[lvl]}</span>
        <span className="pl-meta__tick" aria-hidden="true" />
        <span className="pl-num">{a.readTime} min</span>
      </span>
    </Link>
  )
}

/* ── Eén ingang op het blad ───────────────────────────────────────────── */
function Entry({ a, no, bare = false }: { a: Article; no: string; bare?: boolean }) {
  const lvl = getLevel(a.category)
  const row = (
      <Link href={`/nieuws/${a.slug}`} className="pl-entry">
        <span className="pl-entry__no">{no}</span>

        <span className="pl-entry__fig">
          <span className="pl-emulsion pl-emulsion--sm" style={{ display: 'block' }}>
            {a.imageUrl
              ? <img src={img(a.imageUrl, 420)} alt="" loading="lazy" />
              : <span style={{ position: 'absolute', inset: 0, background: 'var(--pl-plate-2)' }} />}
          </span>
        </span>

        <span style={{ minWidth: 0 }}>
          <span className="pl-entry__t" style={{ display: 'block' }}>{a.title}</span>
          {a.excerpt?.trim() && (
            <span className="pl-entry__ex" style={{ display: 'block' }}>{a.excerpt}</span>
          )}
          <span className="pl-meta" style={{ marginTop: 11 }}>
            <Ladder level={lvl} />
            <span>{LEVEL_WORD[lvl]}</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span>{a.category}</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span className="pl-num">{a.date}</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span className="pl-num">{a.readTime} min</span>
          </span>
        </span>
      </Link>
  )
  return bare ? row : <li>{row}</li>
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
/** Href van een lade op een onderwerp-pagina. Daar is elke lade een echte
 *  link, zodat URL en open lade nooit uit elkaar lopen. */
function drawerHref(d: { key: string; slug?: string }): string {
  if (d.slug) return `/nieuws/onderwerp/${d.slug}/`
  if (d.key === 'Alles') return '/nieuws/'
  return `/nieuws/?onderwerp=${encodeURIComponent(d.key.toLowerCase())}`
}

export default function NieuwsArchief({ initialTopic }: {
  /** Slug uit lib/topics.ts; zet de lade al in de statische HTML open. */
  initialTopic?: string
} = {}) {
  const articles = useArticles(24)

  const [drawer, setDrawer] = useState(
    () => DRAWERS.find(d => d.slug && d.slug === initialTopic)?.key ?? 'Alles'
  )
  const [level, setLevel] = useState<Level>('alle')
  const [quickTag, setQuickTag] = useState<string | null>(null)
  const [shown, setShown] = useState(ROWS_PER_PAGE)

  const sheetRef = useRef<HTMLDivElement>(null)
  const loupeRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  /* Diep linken: /nieuws?onderwerp=zwarte%20gaten opent die lade meteen,
     ook voor laden zonder eigen onderwerp-pagina. */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const slug = p.get('onderwerp')
    if (slug) {
      const hit = DRAWERS.find(d => d.slug === slug || d.key.toLowerCase() === slug.toLowerCase())
      if (hit) setDrawer(hit.key)
    }
    const lvl = p.get('niveau')
    if (lvl && LEVELS.some(l => l.key === lvl)) setLevel(lvl as Level)
  }, [])

  /* De loupe, hetzelfde geautoriseerde moment als op het archiefblad */
  useEffect(() => {
    const sheet = sheetRef.current
    const loupe = loupeRef.current
    if (!sheet || !loupe) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const isTouch = (e: PointerEvent) => e.pointerType === 'touch'
    const move = (e: PointerEvent) => {
      if (isTouch(e)) return
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const r = sheet.getBoundingClientRect()
        loupe.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0)`
      })
    }
    const on = (e: PointerEvent) => { if (!isTouch(e)) sheet.setAttribute('data-lit', '1') }
    const off = () => sheet.setAttribute('data-lit', '0')

    sheet.addEventListener('pointermove', move)
    sheet.addEventListener('pointerenter', on)
    sheet.addEventListener('pointerleave', off)
    return () => {
      cancelAnimationFrame(frame.current)
      sheet.removeEventListener('pointermove', move)
      sheet.removeEventListener('pointerenter', on)
      sheet.removeEventListener('pointerleave', off)
    }
  }, [])

  /* De snelfilter versmalt de voorraad; lade en niveau filteren daarbinnen,
     en alle tellingen volgen de voorraad — zodat geen lade platen belooft
     die de actieve tag al heeft uitgesloten. */
  const pool = useMemo(() => {
    const spec = QUICK_TAGS.find(q => q.tag === quickTag)
    return spec ? articles.filter(a => quickMatches(a, spec)) : articles
  }, [articles, quickTag])

  const byLevel = useMemo(
    () => level === 'alle' ? pool : pool.filter(a => getLevel(a.category) === level),
    [pool, level]
  )

  const matched = useMemo(
    () => byLevel.filter(a => topicMatches(a.category, drawer)),
    [byLevel, drawer]
  )

  const drawerCounts = useMemo(() => DRAWERS.reduce((acc, d) => {
    acc[d.key] = d.key === 'Alles' ? byLevel.length : byLevel.filter(a => topicMatches(a.category, d.key)).length
    return acc
  }, {} as Record<string, number>), [byLevel])

  const levelCounts = useMemo(() => LEVELS.reduce((acc, l) => {
    acc[l.key] = l.key === 'alle' ? pool.length : pool.filter(a => getLevel(a.category) === l.key).length
    return acc
  }, {} as Record<Level, number>), [pool])

  const order = useMemo(() => new Map(articles.map((a, i) => [a.slug, i])), [articles])
  const rows = matched.slice(0, shown)
  const more = shown < matched.length

  useEffect(() => { setShown(ROWS_PER_PAGE) }, [drawer, level, quickTag])

  /* De cascade hoort bij de handeling: nieuwe sleutel = lade opnieuw open. */
  const settleKey = `${drawer}|${level}|${quickTag ?? ''}|${shown}`

  const openDrawer = useCallback((key: string) => setDrawer(key), [])
  const total = articles.length
  const active = DRAWERS.find(d => d.key === drawer)!
  const description = drawerDescription(drawer)

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={total} edition={editionLabel()} current="nieuws" />
      <QuickBar articles={articles} active={quickTag} onPick={setQuickTag} />

      <main id="pl-main" tabIndex={-1} className="pl-stack">

        <div className="pl-wrap">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 className="pl-h2">{initialTopic ? `${active.label} — nieuws` : 'Het nieuwsarchief'}</h1>
              {quickTag && (
                <button type="button" className="pl-tag" aria-pressed="true" onClick={() => setQuickTag(null)}>
                  #{quickTag}
                  <Ico.close size={11} />
                  <span className="sr-only"> — filter verwijderen</span>
                </button>
              )}
            </div>
            <p className="pl-label" aria-live="polite">
              {matched.length === total ? `${total} platen` : `${matched.length} van ${total} platen`}
            </p>
          </div>

          <div className="pl-cabinet">

            {/* ── De ladenrail ── */}
            <div className="pl-rail-col">
              <div className="pl-dgroup" role="group" aria-label="Onderwerplade">
                <div className="pl-dgroup__head"><span className="pl-label">Laden</span></div>
                {DRAWERS.map(d => {
                  const n = drawerCounts[d.key] ?? 0
                  const isOpen = drawer === d.key
                  if (initialTopic) {
                    return (
                      <Link key={d.key} href={drawerHref(d)} className="pl-drawer" aria-current={isOpen ? 'page' : undefined}>
                        <span>{d.label}</span>
                        <span className="pl-drawer__n">{n}</span>
                      </Link>
                    )
                  }
                  return (
                    <button
                      key={d.key}
                      type="button"
                      className="pl-drawer"
                      aria-current={isOpen}
                      disabled={n === 0 && !isOpen}
                      onClick={() => openDrawer(d.key)}
                    >
                      <span>{d.label}</span>
                      <span className="pl-drawer__n">{n}</span>
                    </button>
                  )
                })}
              </div>

              <div className="pl-dgroup" role="group" aria-label="Leesniveau">
                <div className="pl-dgroup__head"><span className="pl-label">Niveau</span></div>
                {LEVELS.map(l => {
                  const n = levelCounts[l.key] ?? 0
                  const isOpen = level === l.key
                  return (
                    <button
                      key={l.key}
                      type="button"
                      className="pl-drawer"
                      aria-current={isOpen}
                      disabled={n === 0 && !isOpen}
                      onClick={() => setLevel(l.key)}
                    >
                      <span className="pl-drawer__lvl">
                        {l.key !== 'alle' && <Ladder level={l.key} />}
                        {l.label}
                      </span>
                      <span className="pl-drawer__n">{n}</span>
                    </button>
                  )
                })}
              </div>

              <div className="pl-dgroup pl-dgroup--elders">
                <div className="pl-dgroup__head"><span className="pl-label">Elders</span></div>
                <Link href="/" className="pl-drawer">
                  <span>Naar de voorpagina</span>
                  <span aria-hidden="true"><Ico.arrow size={12} /></span>
                </Link>
                <Link href="/missies" className="pl-drawer">
                  <span>Missiekalender</span>
                  <span aria-hidden="true"><Ico.arrow size={12} /></span>
                </Link>
              </div>
            </div>

            {/* ── Het blad ── */}
            <div className="pl-sheet" ref={sheetRef} data-lit="0">
              <div className="pl-sheet__loupe" ref={loupeRef} aria-hidden="true" />

              <header className="pl-sheet__head">
                <div style={{ minWidth: 0 }}>
                  <h2 className="pl-h3" style={{ fontSize: '1.15rem' }}>{active.label}</h2>
                  {description
                    ? <p className="pl-sheet__desc">{description}</p>
                    : drawer === 'Alles' && (
                      <p className="pl-sheet__desc">
                        Elke plaat is een artikel, gearchiveerd met plaatnummer, onderwerp en leestijd.
                        Nieuwste eerst. Elk artikel bestaat in drie leesniveaus.
                      </p>
                    )}
                </div>
                <p className="pl-label pl-num" style={{ letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
                  {matched.length} {matched.length === 1 ? 'plaat' : 'platen'}
                </p>
              </header>

              <div className="pl-edge" aria-hidden="true" />

              {/* Gelaagd ritme: één hoofdplaat, twee tweede platen, dan pas het
                  register. Zo weegt de nieuwste plaat zwaarder dan de
                  twintigste, wat in een gelijkmatige rij nooit gebeurde. */}
              {rows.length === 0 ? (
                <div style={{ padding: '56px 24px', display: 'grid', gap: 14, justifyItems: 'start', position: 'relative', zIndex: 1 }}>
                  <h3 className="pl-h3">Deze lade is leeg</h3>
                  <p className="pl-body-s">
                    Er is niets dat tegelijk {active.label.toLowerCase()}
                    {level !== 'alle' && ` én ${LEVEL_WORD[level].toLowerCase()}`}
                    {quickTag && ` én #${quickTag}`} is. Laat een van de filters vallen.
                  </p>
                  <button
                    className="pl-btn"
                    onClick={() => { setDrawer('Alles'); setLevel('alle'); setQuickTag(null) }}
                  >
                    Alle platen
                  </button>
                </div>
              ) : (
                <div className="pl-settle" key={settleKey}>
                  <Lede a={rows[0]} no={plateNo(total, order.get(rows[0].slug) ?? 0)} />

                  {rows.length > 1 && (
                    <div className="pl-seconds" style={{ ['--i' as string]: 1 }}>
                      {rows.slice(1, 3).map(a => (
                        <Second key={a.slug} a={a} no={plateNo(total, order.get(a.slug) ?? 0)} />
                      ))}
                    </div>
                  )}

                  {rows.length > 3 && (
                    <>
                      <div className="pl-sheet__rule" style={{ ['--i' as string]: 2 }}>
                        <span className="pl-label">Verder in deze lade</span>
                        <span aria-hidden="true" />
                      </div>
                      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-live="polite">
                        {rows.slice(3).map((a, i) => (
                          <li key={a.slug} style={{ ['--i' as string]: Math.min(3 + i, 9) }}>
                            <Entry a={a} no={plateNo(total, order.get(a.slug) ?? 0)} bare />
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </div>
              )}

              {more && (
                <footer className="pl-sheet__foot">
                  <button className="pl-btn" onClick={() => setShown(s => s + ROWS_PER_PAGE)}>
                    Volgende {Math.min(ROWS_PER_PAGE, matched.length - shown)} platen
                  </button>
                  <span className="pl-label pl-num" style={{ letterSpacing: '0.1em' }}>
                    {rows.length} / {matched.length}
                  </span>
                  <div className="pl-meter" style={{ flex: 1, minWidth: 120, color: 'var(--pl-orbit)' }} aria-hidden="true">
                    <i style={{ transform: `scaleX(${rows.length / matched.length})` }} />
                  </div>
                </footer>
              )}

              {!more && rows.length > 0 && (
                <footer className="pl-sheet__foot">
                  <span className="pl-label">Alle {matched.length} platen in deze lade geladen</span>
                </footer>
              )}
            </div>
          </div>
        </div>

        <div className="pl-wrap">
          <AdPlate slot="3395478818" />
        </div>

      </main>

      <SiteFooter cols={FOOTER_COLS} note="Afbeeldingen: NASA · ESA · Pexels" />
    </div>
  )
}
