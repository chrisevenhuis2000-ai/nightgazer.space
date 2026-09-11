'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer homepage — full layout rework, staging build.

   Structure, top to bottom:
     staging banner → plate header → first viewport (live instrument bar on
     the emulsion) → lead plate + two side plates → mission rail →
     instrument bank A → labelled ad field → archive ledger (800+ plates,
     filterable, with the light-box loupe) → instrument bank B → footer

   Reader path: the observer's four live values answer first; the reading
   layer follows; the archive holds the volume.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { MISSIONS } from '@/lib/missions-data'
import { SiteFooter } from '../components/SiteFooter'
import {
  PROXY, APOD_CACHE_KEY,
  type APODData, type ISSData, type Article,
  getLevel, topicMatches,
} from '@/lib/home-content'
import {
  Ico, Tip, useSky, skyTone, useUpcoming, type SkyState,
  SterrenkijkenPlate, DezeWeekPlate, ApodPlate, IssPlate, QuizPlate, NiveauPlate,
} from './Instruments'
import {
  archivo, ROWS_PER_PAGE, TOPICS, QUICK_TAGS, quickMatches,
  FOOTER_COLS, LEVEL_WORD, LEVEL_STEP, plateNo, img, Ladder,
  StagingBanner, PlateHead, QuickBar, AdPlate, useArticles, editionLabel,
} from './shared'


/* ══ Ticker: the latest plates, filling the void under the lead ══════════ */
function Ticker({ articles }: { articles: Article[] }) {
  const laneRef = useRef<HTMLDivElement>(null)
  const items = articles.slice(0, 14)

  /* Constant speed, not constant duration: a lane with more plates in it is
     wider, so the duration has to grow with it or the scroll speeds up. */
  useEffect(() => {
    const lane = laneRef.current
    if (!lane) return
    const set = () => {
      const half = lane.scrollWidth / 2
      if (half > 0) lane.style.setProperty('--pl-ticker-dur', `${Math.round(half / 55)}s`)
    }
    set()
    const ro = new ResizeObserver(set)
    ro.observe(lane)
    return () => ro.disconnect()
  }, [items.length])

  if (!items.length) return null

  const strip = (dupe: boolean) => items.map(a => (
    <Link
      key={`${dupe ? 'b' : 'a'}-${a.slug}`}
      href={`/nieuws/${a.slug}`}
      className="pl-ticker__item"
      tabIndex={dupe ? -1 : undefined}
      aria-hidden={dupe || undefined}
    >
      <span className="pl-label">{a.category}</span>
      <span className="pl-ticker__t">{a.title}</span>
      <span className="pl-label pl-num">{a.readTime} min</span>
    </Link>
  ))

  return (
    <section className="pl-ticker" aria-label="Laatste platen">
      <div className="pl-ticker__label">
        <span className="pl-dot pl-live" aria-hidden="true" />
        <span className="pl-label">Nieuw binnen</span>
      </div>
      <div className="pl-ticker__view">
        {/* duplicated once so the marquee loops without a visible seam */}
        <div className="pl-ticker__lane" ref={laneRef}>{strip(false)}{strip(true)}</div>
      </div>
    </section>
  )
}

/* ══ First viewport: live instrument bar printed on the emulsion ══════════ */
function FirstView({ apod, iss, issFailed, total, latest, sky }: {
  apod: APODData | null
  iss: ISSData | null
  issFailed: boolean
  total: number
  latest: string
  sky: SkyState
}) {
  const { mounted, list } = useUpcoming()
  const next = list[0]

  return (
    <section className="pl-firstview" aria-labelledby="pl-fv-title">
      <div className="pl-firstview__ground" aria-hidden="true">
        <div className="pl-emulsion">
          {apod?.media_type === 'image' && (
            <img src={img(apod.hdurl || apod.url, 1600)} alt="" />
          )}
        </div>
        {/* Silver grains on the emulsion, drifting on transform only. */}
        <div className="pl-stars"><i /><i /></div>
        <div className="pl-firstview__glow" />
      </div>

      <div className="pl-edge pl-edge--lit" aria-hidden="true" />

      <div className="pl-firstview__title">
        <div style={{ display: 'grid', gap: 16 }}>
          <h1 id="pl-fv-title" className="pl-h1">
            Wat er vannacht te zien is, en wat er vandaag gebeurde
          </h1>
          <p className="pl-body" style={{ maxWidth: '54ch' }}>
            Het Nederlandse archief voor astronomie en ruimtevaart. Live condities boven,
            {' '}{total} platen eronder — elk artikel op drie niveaus.
          </p>

          <div className="pl-cta">
            <Link href="/sterrenkijken" className="pl-cta__primary">
              Vannacht kijken
              <Ico.arrow size={14} />
            </Link>
            <a href="#pl-archief" className="pl-cta__secondary">
              Laatste updates
              <Ico.arrow size={12} />
            </a>
          </div>
        </div>

        <dl className="pl-envelope">
          <div>
            <dt className="pl-label">Laatste opname</dt>
            <dd className="pl-num">{latest || '—'}</dd>
          </div>
          <div>
            <dt className="pl-label">Platen</dt>
            <dd className="pl-num">{total}</dd>
          </div>
          <div>
            <dt className="pl-label">Bronnen</dt>
            <dd>NASA · ESA</dd>
          </div>
        </dl>
      </div>

      <div className="pl-instr pl-instr--onplate" role="group" aria-label="Live condities">

        {/* 1 — tonight's verdict */}
        <div className="pl-instr__cell">
          <Tip label={
            <>
              <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Zichtbaarheidsscore</span>
              Berekend voor 20:00 uit bewolking, luchtvochtigheid, wind en temperatuur.
              8–10 uitstekend · 6–7 goed · onder 4 nauwelijks de moeite.
            </>
          }>
            <span className="pl-label">Vannacht</span>
          </Tip>
          <div className="pl-instr__slot">
            {sky.status === 'failed' ? (
              <span className="pl-instr__off">Weerdata niet opgehaald</span>
            ) : sky.status === 'loading' ? (
              <div className="pl-skel" style={{ height: 34, width: '62%' }} />
            ) : (
              <span className="pl-instr__val pl-num pl-live">
                {sky.score}<span className="pl-instr__unit"> / 10</span>
              </span>
            )}
          </div>
          {sky.status === 'ok' && (
            <span className="pl-instr__sub" style={{ color: skyTone(sky.score) }}>{sky.label}</span>
          )}
        </div>

        {/* 2 — cloud cover, the value that decides the evening */}
        <div className="pl-instr__cell">
          <Tip label={
            <>
              <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Bewolking om 20:00</span>
              Percentage van de hemel bedekt op het moment dat het donker wordt.
              Onder 20% zie je zwakke objecten; boven 50% blijft alleen de maan over.
            </>
          }>
            <span className="pl-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Ico.cloud />Bewolking 20:00
            </span>
          </Tip>
          <div className="pl-instr__slot">
            {sky.status === 'failed' ? (
              <span className="pl-instr__off">Geen weerdata</span>
            ) : sky.clouds === null ? (
              <div className="pl-skel" style={{ height: 34, width: '52%' }} />
            ) : (
              <span className="pl-instr__val pl-num pl-live">
                {sky.clouds}<span className="pl-instr__unit"> %</span>
              </span>
            )}
          </div>
          {sky.clouds !== null && (
            <span className="pl-instr__sub">
              {sky.clouds < 20 ? 'Vrijwel onbewolkt' : sky.clouds < 50 ? 'Deels bewolkt' : 'Te veel bewolking'}
            </span>
          )}
        </div>

        {/* 3 — ISS, with a continuous readout instead of a frozen number */}
        <div className="pl-instr__cell">
          <Tip label={
            <>
              <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>ISS-positie</span>
              Breedte- en lengtegraad van het ruimtestation, elke 5 seconden verversd.
              Het station legt ongeveer 7,7 km per seconde af.
              <a href="#pl-iss" style={{ display: 'block', marginTop: 8, color: 'var(--pl-act)' }}>Naar de kaart</a>
            </>
          }>
            <span className="pl-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Ico.orbit />ISS-positie
              {iss && !issFailed && (
                <span className="pl-dot pl-live" aria-hidden="true" style={{ marginLeft: 2 }} />
              )}
            </span>
          </Tip>
          <div className="pl-instr__slot">
            {issFailed ? (
              <span className="pl-instr__off">Geen signaal</span>
            ) : !iss ? (
              <div className="pl-skel" style={{ height: 34, width: '78%' }} />
            ) : (
              <span className="pl-instr__val pl-num pl-live" style={{ fontSize: 'clamp(1.1rem,1.7vw,1.4rem)' }}>
                {iss.latitude.toFixed(1)}° {iss.longitude.toFixed(1)}°
              </span>
            )}
          </div>
          {iss && !issFailed && (
            <>
              <div className="pl-readout" aria-hidden="true" />
              <span className="pl-instr__sub pl-num">{Math.round(iss.altitude)} km · {(iss.velocity / 1000).toFixed(1)}k km/u</span>
            </>
          )}
        </div>

        {/* 4 — the next thing worth staying up for */}
        <div className="pl-instr__cell">
          <Tip label={
            <>
              <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Volgend verschijnsel</span>
              {next
                ? <>{next.desc}<br /><span className="pl-num" style={{ color: 'var(--pl-ink-3)' }}>
                    {new Date(next.date + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span></>
                : 'Eerstvolgende lancering of hemelverschijnsel uit de agenda.'}
            </>
          }>
            <span className="pl-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Ico.cal />Volgende
            </span>
          </Tip>
          <div className="pl-instr__slot">
            {!mounted || !next ? (
              <div className="pl-skel" style={{ height: 34, width: '58%' }} />
            ) : (
              <span className="pl-instr__val pl-num pl-live">
                {next.days === 0 ? 'nu' : next.days}
                {next.days > 0 && <span className="pl-instr__unit"> {next.days === 1 ? 'dag' : 'dagen'}</span>}
              </span>
            )}
          </div>
          {mounted && next && <span className="pl-instr__sub">{next.title}</span>}
        </div>

        {/* 5 — the archive itself */}
        <div className="pl-instr__cell">
          <Tip align="right" label={
            <>
              <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Het archief</span>
              Elk artikel bestaat op drie leesniveaus en is gearchiveerd met plaatnummer,
              onderwerp en leestijd. Nieuwe platen komen dagelijks automatisch binnen.
            </>
          }>
            <span className="pl-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Ico.plate />Archief
            </span>
          </Tip>
          <div className="pl-instr__slot">
            <span className="pl-instr__val pl-num">{total}</span>
          </div>
          <a href="#pl-archief" className="pl-read" style={{ minHeight: 22 }}>
            <span>Naar het archief</span>
            <span className="pl-read__rule" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ══ Lead plate ═══════════════════════════════════════════════════════════ */
function LeadPlate({ lead, side, total }: { lead: Article; side: Article[]; total: number }) {
  const lvl = getLevel(lead.category)

  return (
    <section className="pl-lead" aria-labelledby="pl-lead-title">
      <article className="pl-lead__main">
        <Link href={`/nieuws/${lead.slug}`} className="pl-lead__fig" aria-hidden="true" tabIndex={-1}>
          <div className="pl-emulsion">
            {lead.imageUrl
              ? <img src={img(lead.imageUrl, 1200)} alt="" />
              : <div style={{ position: 'absolute', inset: 0, background: 'var(--pl-plate-2)' }} />}
          </div>
          {/* The archivist's chinagraph ring around today's selected plate */}
          <svg className="pl-ring pl-ring--draw" viewBox="0 0 100 56" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="58" cy="26" rx="17" ry="13" transform="rotate(-8 58 26)" />
          </svg>
          <span className="pl-stampno pl-num">{plateNo(total, 0)}</span>
        </Link>

        <div className="pl-lead__body">
          <div className="pl-meta">
            <span className="pl-label pl-label--stamp">Plaat van vandaag</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span>{lead.category}</span>
          </div>

          <h2 id="pl-lead-title" className="pl-h1" style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.7rem)' }}>
            <Link href={`/nieuws/${lead.slug}`}>{lead.title}</Link>
          </h2>

          {lead.excerpt?.trim() && <p className="pl-body">{lead.excerpt}</p>}

          <div className="pl-lead__close">
            <div className="pl-meta">
              <Ladder level={lvl} />
              <span>{LEVEL_WORD[lvl]}</span>
              <span className="pl-meta__tick" aria-hidden="true" />
              <span className="pl-num">{lead.date}</span>
              <span className="pl-meta__tick" aria-hidden="true" />
              <span className="pl-num">{lead.readTime} min</span>
            </div>

            <Link href={`/nieuws/${lead.slug}`} className="pl-read" style={{ minHeight: 30 }}>
              <span>Lees deze plaat</span>
              <span className="pl-read__rule" aria-hidden="true" />
              <Ico.arrow />
            </Link>
          </div>
        </div>
      </article>

      <div className="pl-lead__side">
        {[0, 1, 2].map(i => side[i]
          ? <SubPlate key={side[i].slug} a={side[i]} no={plateNo(total, i + 1)} />
          : <div key={`empty-${i}`} />)}
      </div>
    </section>
  )
}

function SubPlate({ a, no }: { a: Article; no: string }) {
  const lvl = getLevel(a.category)
  return (
    <article className="pl-sub pl-lift">
      <Link href={`/nieuws/${a.slug}`} className="pl-sub__fig" aria-hidden="true" tabIndex={-1}>
        <div className="pl-emulsion">
          {a.imageUrl
            ? <img src={img(a.imageUrl, 400)} alt="" loading="lazy" />
            : <div style={{ position: 'absolute', inset: 0, background: 'var(--pl-plate-2)' }} />}
        </div>
      </Link>
      <div style={{ display: 'grid', gap: 9, minWidth: 0 }}>
        <div className="pl-meta">
          <span className="pl-num">{no}</span>
          <span className="pl-meta__tick" aria-hidden="true" />
          <span>{a.category}</span>
        </div>
        <h3 className="pl-h3"><Link href={`/nieuws/${a.slug}`}>{a.title}</Link></h3>
        {a.excerpt?.trim() && (
          <p className="pl-body-s" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {a.excerpt}
          </p>
        )}
        <div className="pl-meta">
          <Ladder level={lvl} />
          <span>{LEVEL_WORD[lvl]}</span>
          <span className="pl-meta__tick" aria-hidden="true" />
          <span className="pl-num">{a.readTime} min</span>
        </div>
      </div>
    </article>
  )
}

/* ══ Mission rail ═════════════════════════════════════════════════════════ */
function MissionRail() {
  const rows = useMemo(
    () => [...MISSIONS].sort((a, b) => (a.status === 'actief' ? -1 : 1) - (b.status === 'actief' ? -1 : 1)).slice(0, 8),
    []
  )

  return (
    <section aria-labelledby="pl-miss-title">
      <div className="pl-band">
        <h2 id="pl-miss-title" className="pl-h2">Missies in bedrijf</h2>
        <Link href="/missies" className="pl-read">
          <span>Alle missies</span>
          <span className="pl-read__rule" aria-hidden="true" />
          <Ico.arrow />
        </Link>
      </div>

      <div className="pl-rail">
        {rows.map(m => {
          const live = m.status === 'actief'
          return (
            <Link key={m.id} href={`/missies/${m.id}`} className="pl-rail__cell pl-lift">
              <span className="pl-label">{m.agency}</span>
              <strong className="pl-h3">{m.name}</strong>
              <p className="pl-body-s" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                {m.objective}
              </p>
              <span
                className="pl-status"
                data-on={live ? '1' : '0'}
                style={{ color: live ? 'var(--pl-good)' : 'var(--pl-ink-3)' }}
              >
                <i aria-hidden="true" />{m.status}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/* ══ Archive ledger — the volume layer, with the light-box loupe ══════════ */
function Archive({ articles, total, quickTag, onClearQuick }: {
  articles: Article[]
  total: number
  quickTag: string | null
  onClearQuick: () => void
}) {
  const [filter, setFilter] = useState('Alles')
  const [shown, setShown] = useState(ROWS_PER_PAGE)
  const plateRef = useRef<HTMLDivElement>(null)
  const loupeRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('topic')
    if (!param) return
    const match = TOPICS.find(t => t.toLowerCase() === param.toLowerCase())
    if (match) setFilter(match)
  }, [])

  /* The one authored moment: attention lifts the emulsion locally. */
  useEffect(() => {
    const plate = plateRef.current
    const loupe = loupeRef.current
    if (!plate || !loupe) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /* Gate on the event's own pointerType rather than a `(pointer: fine)`
       media query: some environments report `pointer: none` for a real mouse,
       which silently killed the effect. Touch gets no loupe — there is no
       hover to follow. */
    const isTouch = (e: PointerEvent) => e.pointerType === 'touch'

    const move = (e: PointerEvent) => {
      if (isTouch(e)) return
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const r = plate.getBoundingClientRect()
        loupe.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0)`
      })
    }
    const on = (e: PointerEvent) => { if (!isTouch(e)) plate.setAttribute('data-lit', '1') }
    const off = () => plate.setAttribute('data-lit', '0')

    plate.addEventListener('pointermove', move)
    plate.addEventListener('pointerenter', on)
    plate.addEventListener('pointerleave', off)
    return () => {
      cancelAnimationFrame(frame.current)
      plate.removeEventListener('pointermove', move)
      plate.removeEventListener('pointerenter', on)
      plate.removeEventListener('pointerleave', off)
    }
  }, [])

  const order = useMemo(() => new Map(articles.map((a, i) => [a.slug, i])), [articles])

  /* The quick tag from the bar under the header narrows the pool first; the
     topic tabs then filter within it. Counts on the tabs follow the pool, so
     a tab never promises rows the active tag has already excluded. */
  const pool = useMemo(() => {
    const spec = QUICK_TAGS.find(q => q.tag === quickTag)
    return spec ? articles.filter(a => quickMatches(a, spec)) : articles
  }, [articles, quickTag])

  const counts = useMemo(() => TOPICS.reduce((acc, t) => {
    acc[t] = t === 'Alles' ? pool.length : pool.filter(a => topicMatches(a.category, t)).length
    return acc
  }, {} as Record<string, number>), [pool])

  const matched = useMemo(() => pool.filter(a => topicMatches(a.category, filter)), [pool, filter])
  const rows = matched.slice(0, shown)
  const more = shown < matched.length

  const pick = useCallback((t: string) => { setFilter(t); setShown(ROWS_PER_PAGE) }, [])

  useEffect(() => { setShown(ROWS_PER_PAGE); setFilter('Alles') }, [quickTag])

  return (
    <section id="pl-archief" aria-labelledby="pl-arch-title">
      <div className="pl-band">
        <div className="pl-band__t">
          <h2 id="pl-arch-title" className="pl-h2">Het archief</h2>
          {quickTag && (
            <button type="button" className="pl-tag" aria-pressed="true" onClick={onClearQuick}>
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

      <div className="pl-arch" ref={plateRef} data-lit="0">
        <div className="pl-arch__loupe" ref={loupeRef} aria-hidden="true" />

        <div className="pl-topics" role="tablist" aria-label="Filter op onderwerp">
          {TOPICS.map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={filter === t}
              onClick={() => pick(t)}
            >
              {t}
              {t !== 'Alles' && <span className="pl-topics__n pl-num">{counts[t] ?? 0}</span>}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: '52px 24px', display: 'grid', gap: 14, justifyItems: 'start', position: 'relative', zIndex: 1 }}>
            <h3 className="pl-h3">Geen platen onder deze combinatie</h3>
            <p className="pl-body-s">
              {quickTag
                ? `Er is niets dat zowel #${quickTag} als "${filter}" is. Laat een van de twee vallen.`
                : 'Het archief heeft hier nog niets van. Kies een ander onderwerp of open alle platen.'}
            </p>
            <button className="pl-btn" onClick={() => { pick('Alles'); onClearQuick() }}>Alle platen</button>
          </div>
        ) : (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-live="polite">
            {rows.map((a, i) => {
              const lvl = getLevel(a.category)
              const idx = order.get(a.slug) ?? i
              return (
                <li key={a.slug}>
                  <Link href={`/nieuws/${a.slug}`} className="pl-row">
                    <span className="pl-row__no pl-num">{plateNo(total, idx)}</span>
                    <span className="pl-row__fig">
                      <span className="pl-emulsion" style={{ display: 'block' }}>
                        {a.imageUrl
                          ? <img src={img(a.imageUrl, 220)} alt="" loading="lazy" />
                          : <span style={{ position: 'absolute', inset: 0, background: 'var(--pl-plate-2)' }} />}
                      </span>
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="pl-row__t" style={{ display: 'block' }}>{a.title}</span>
                      {a.excerpt?.trim() && <span className="pl-row__ex" style={{ display: 'block' }}>{a.excerpt}</span>}
                    </span>
                    <span className="pl-row__cat" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Ladder level={lvl} />
                      {a.category}
                    </span>
                    <span className="pl-row__r pl-num">{a.readTime} min</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {more && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="pl-btn" onClick={() => setShown(s => s + ROWS_PER_PAGE)}>
            Volgende {Math.min(ROWS_PER_PAGE, matched.length - shown)} platen
          </button>
          <span className="pl-label pl-num" style={{ letterSpacing: '0.1em' }}>
            {rows.length} / {matched.length}
          </span>
          <div className="pl-meter" style={{ flex: 1, minWidth: 120, color: 'var(--pl-orbit)' }} aria-hidden="true">
            <i style={{ transform: `scaleX(${rows.length / matched.length})` }} />
          </div>
        </div>
      )}
    </section>
  )
}

/* ══ Page ═════════════════════════════════════════════════════════════════ */
export default function StagingHome() {
  const [apod, setApod] = useState<APODData | null>(null)
  const [iss, setIss] = useState<ISSData | null>(null)
  const [issFailed, setIssFailed] = useState(false)
  const articles = useArticles(24)

  /* APOD, cached per day */
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      const cached = localStorage.getItem(APOD_CACHE_KEY)
      if (cached) {
        const { date, data } = JSON.parse(cached)
        if (date === today && data) { setApod(data); return }
      }
    } catch { /* storage blocked — fetch instead */ }

    fetch(`${PROXY}/apod`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: APODData) => {
        setApod(data)
        try { localStorage.setItem(APOD_CACHE_KEY, JSON.stringify({ date: today, data })) } catch { /* ignore */ }
      })
      .catch(() => { /* the plate ground stays empty rather than wrong */ })
  }, [])

  /* ISS, every 5s */
  useEffect(() => {
    let alive = true
    const tick = () => fetch('https://api.wheretheiss.at/v1/satellites/25544')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { if (alive) { setIss(d); setIssFailed(false) } })
      .catch(() => { if (alive && !iss) setIssFailed(true) })
    tick()
    const id = setInterval(tick, 5000)
    return () => { alive = false; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sky = useSky()
  const [quickTag, setQuickTag] = useState<string | null>(null)

  const pickQuick = useCallback((tag: string | null) => {
    setQuickTag(tag)
    if (tag) {
      document.getElementById('pl-archief')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const lead = articles.find(a => a.featured) ?? articles[0]
  const side = articles.filter(a => a.slug !== lead?.slug).slice(0, 3)
  const total = articles.length
  const edition = editionLabel()

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <StagingBanner />
      <PlateHead total={total} edition={edition} current="home" />
      <QuickBar articles={articles} active={quickTag} onPick={pickQuick} />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <div className="pl-wrap">
          <FirstView apod={apod} iss={iss} issFailed={issFailed} total={total} latest={articles[0]?.date ?? ''} sky={sky} />
        </div>

        {lead && (
          <div className="pl-wrap">
            <LeadPlate lead={lead} side={side} total={total} />
          </div>
        )}

        {/* Fills what was an empty band of ground under the lead plate. */}
        <div className="pl-wrap">
          <Ticker articles={articles} />
        </div>

        <div className="pl-wrap pl-gap-lg">
          <MissionRail />
        </div>

        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-instr-title">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-instr-title" className="pl-h2">Live instrumenten</h2>
              <span className="pl-label">Verversen zelf</span>
            </div>
            <Link href="/sterrenkijken" className="pl-read">
              <span>Sterrenkijken</span>
              <span className="pl-read__rule" aria-hidden="true" />
              <Ico.arrow />
            </Link>
          </div>
          <div className="pl-bank pl-bank--instr pl-bank--3">
            <SterrenkijkenPlate sky={sky} />
            <DezeWeekPlate />
            <ApodPlate apod={apod} />
          </div>
        </section>

        <div className="pl-wrap">
          <AdPlate />
        </div>

        <div className="pl-wrap pl-gap-lg">
          <Archive
            articles={articles}
            total={total}
            quickTag={quickTag}
            onClearQuick={() => setQuickTag(null)}
          />
        </div>

        <div className="pl-wrap pl-gap-lg">
          <div className="pl-bank pl-bank--instr pl-bank--2">
            <IssPlate iss={iss} failed={issFailed} />
            <QuizPlate />
          </div>
        </div>

        <div className="pl-wrap">
          <div className="pl-bank pl-bank--1">
            <NiveauPlate featuredSlug={lead?.slug ?? ''} />
          </div>
        </div>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Afbeeldingen: NASA · ESA · Pexels" />
    </div>
  )
}
