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
import { Archivo } from 'next/font/google'
import { MISSIONS } from '@/lib/missions-data'
import { AdUnit } from '../components/AdUnit'
import { SiteFooter, type FooterCol } from '../components/SiteFooter'
import { NAV_LINKS } from '../components/SiteNav'
import {
  PROXY, APOD_CACHE_KEY,
  type APODData, type ISSData, type Article,
  FALLBACK_ARTICLES, getLevel,
  topicMatches,
} from '@/lib/home-content'
import {
  Ico, Tip, useSky, skyTone, useUpcoming, type SkyState,
  SterrenkijkenPlate, DezeWeekPlate, ApodPlate, IssPlate, QuizPlate, NiveauPlate,
} from './Instruments'
import './staging.css'

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-archivo',
  display: 'swap',
})

const ROWS_PER_PAGE = 20

/* Ordered by how much the archive actually holds, so the strip is a real
   index rather than a wish list. 'Zonnestelsel' is gone (no articles carry
   it) and 'Educatie' and 'Kometen' are in, because they do. */
const TOPICS = [
  'Alles', 'Missies', 'Educatie', 'Maan', 'Mars',
  'James Webb', 'Kosmologie', 'Kometen', 'Zwarte Gaten', 'Sterrenkijken',
]

/* Quick filters for the bar under the header. Each one matches on category
   OR on words in the title, so a tag like SpaceX works even though no
   article carries it as a category. Every tag here resolves to real
   articles — none are decorative. */
const QUICK_TAGS: { tag: string; cat?: string; words?: string[] }[] = [
  { tag: 'Missies',   cat: 'missies' },
  { tag: 'JWST',      cat: 'james-webb', words: ['webb', 'jwst'] },
  { tag: 'SpaceX',    words: ['spacex', 'starship', 'falcon', 'starlink'] },
  { tag: 'Mars',      cat: 'mars', words: ['mars', 'perseverance', 'curiosity'] },
  { tag: 'Maan',      cat: 'maan', words: ['maan', 'lunar', 'moon', 'artemis'] },
  { tag: 'NASA',      words: ['nasa'] },
  { tag: 'ESA',       words: ['esa', 'ariane'] },
  { tag: 'Educatie',  cat: 'educatie' },
  { tag: 'Kosmologie', cat: 'kosmologie' },
]

function quickMatches(a: Article, spec: { cat?: string; words?: string[] }): boolean {
  if (spec.cat && a.category.toLowerCase() === spec.cat) return true
  if (!spec.words) return false
  const t = a.title.toLowerCase()
  return spec.words.some(w => t.includes(w))
}

const FOOTER_COLS: FooterCol[] = [
  { title: 'Onderwerpen', links: [['James Webb', '/nieuws/onderwerp/james-webb'], ['Mars', '/nieuws/onderwerp/mars'], ['Maan', '/nieuws/onderwerp/maan'], ['Kosmologie', '/nieuws/onderwerp/kosmologie'], ['Sterrenkijken', '/sterrenkijken']] },
  { title: 'Instrumenten', links: [['ISS-tracker', '/'], ['Sterrenkaart', '/sterrenkijken'], ['Lanceringskalender', '/missies']] },
  { title: 'Over ons', links: [['Redactie', '/over'], ['Contact', '/contact'], ['Privacy', '/privacy']] },
]

const LEVEL_WORD = { beg: 'Beginner', ama: 'Amateur', pro: 'Pro' } as const
const LEVEL_STEP = { beg: 1, ama: 2, pro: 3 } as const

function plateNo(total: number, i: number) {
  return `NG-${String(Math.max(total - i, 1)).padStart(4, '0')}`
}

function img(url: string, w: number) {
  return `${PROXY}/image-proxy?url=${encodeURIComponent(url)}&w=${w}`
}

/* ── Reading level as a mark, never a coloured badge ────────────────────── */
function Ladder({ level }: { level: 'beg' | 'ama' | 'pro' }) {
  const on = LEVEL_STEP[level]
  return (
    <span className="pl-ladder" aria-hidden="true">
      {[1, 2, 3].map(i => <i key={i} data-on={i <= on ? '1' : '0'} />)}
    </span>
  )
}

/* ══ Staging banner ═══════════════════════════════════════════════════════ */
function StagingBanner() {
  return (
    <div className="pl-staging" role="region" aria-label="Omgevingswaarschuwing">
      <div className="pl-staging__in">
        <span className="pl-staging__stamp">Staging</span>
        <span className="pl-staging__note">
          Voorstel voor de nieuwe homepage. Nog niet live en niet geïndexeerd door zoekmachines.
        </span>
        <Link href="/" className="pl-staging__link">Naar de huidige homepage</Link>
      </div>
    </div>
  )
}

/* ══ Header ═══════════════════════════════════════════════════════════════ */
function PlateHead({ total, edition }: { total: number; edition: string }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      <header className="pl-head">
        <div className="pl-head__in">
          <Link href="/" className="pl-head__logo" aria-label="NightGazer — naar de huidige homepage">
            <img src="/logo-transparent.png" alt="NightGazer" />
          </Link>

          <nav aria-label="Hoofdnavigatie">
            <ul className="pl-nav">
              <li><Link href="/staging" aria-current="page">Archief</Link></li>
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </nav>

          <div className="pl-prov">
            <span>Editie {edition}</span>
            <span className="pl-prov__tick" aria-hidden="true" />
            <span className="pl-num"><span className="pl-prov__n">{total}</span> platen</span>
          </div>

          <button
            className="pl-burger"
            aria-expanded={open}
            aria-controls="pl-mobnav"
            aria-label={open ? 'Menu sluiten' : 'Menu openen'}
            onClick={() => setOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {open && (
        <nav id="pl-mobnav" className="pl-mobnav" aria-label="Mobiele navigatie">
          <Link href="/staging" aria-current="page" onClick={close}>Archief</Link>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={close}>{label}</Link>
          ))}
        </nav>
      )}
    </>
  )
}

/* ══ Quick bar: search plus one-click personalisation of the feed ═════════ */
function QuickBar({ articles, active, onPick }: {
  articles: Article[]
  active: string | null
  onPick: (tag: string | null) => void
}) {
  const counts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const q of QUICK_TAGS) out[q.tag] = articles.filter(a => quickMatches(a, q)).length
    return out
  }, [articles])

  const openSearch = useCallback(() => {
    window.dispatchEvent(new Event('nightgazer:search-open'))
  }, [])

  return (
    <div className="pl-quick">
      <div className="pl-quick__in">
        <button type="button" className="pl-search" onClick={openSearch} aria-label="Zoek in het archief">
          <Ico.search />
          <span className="pl-search__word">Zoeken</span>
          <kbd aria-hidden="true">⌘K</kbd>
        </button>

        <span className="pl-quick__rule" aria-hidden="true" />

        <div className="pl-tags" role="group" aria-label="Snelfilters">
          {QUICK_TAGS.map(({ tag }) => {
            const n = counts[tag] ?? 0
            if (n === 0) return null
            const on = active === tag
            return (
              <button
                key={tag}
                type="button"
                className="pl-tag"
                aria-pressed={on}
                onClick={() => onPick(on ? null : tag)}
              >
                #{tag}
                <span className="pl-tag__n pl-num">{n}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

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

          <p className="pl-body">{lead.excerpt}</p>

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
        <p className="pl-body-s" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {a.excerpt}
        </p>
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

/* ══ Labelled advertising field ═══════════════════════════════════════════ */
function AdPlate() {
  const [consented, setConsented] = useState<boolean | null>(null)
  useEffect(() => {
    try { setConsented(localStorage.getItem('nightgazer_consent') === 'all') } catch { setConsented(false) }
  }, [])

  return (
    <aside className="pl-ad" aria-label="Advertentie">
      <div className="pl-ad__head">
        <span className="pl-label">Advertentie</span>
        <span className="pl-label" style={{ marginLeft: 'auto', letterSpacing: '0.14em' }}>
          Houdt het archief gratis
        </span>
      </div>
      <div className="pl-ad__body">
        <AdUnit slot="8887478647" style={{ width: '100%' }} />
        {consented === false && (
          <p className="pl-label" style={{ letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.7 }}>
            Gereserveerde ruimte — de advertentie verschijnt hier<br />zodra cookies zijn geaccepteerd.
          </p>
        )}
      </div>
    </aside>
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
                      <span className="pl-row__ex" style={{ display: 'block' }}>{a.excerpt}</span>
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
  const [articles, setArticles] = useState<Article[]>(FALLBACK_ARTICLES)
  const nasaFetched = useRef<Set<string>>(new Set())

  /* Articles */
  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => { if (Array.isArray(data) && data.length) setArticles(data) })
      .catch(() => { /* fallback list already rendered */ })
  }, [])

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

  /* Article images from the NASA library, for plates that have none */
  useEffect(() => {
    const CAT_Q: Record<string, string> = {
      missies: 'rocket launch spacecraft', missions: 'rocket launch spacecraft',
      'james-webb': 'james webb space telescope infrared',
      kosmologie: 'galaxy nebula deep space cosmos', cosmology: 'galaxy nebula cosmos',
      mars: 'mars red planet surface', sterrenkijken: 'night sky stars milky way',
      observing: 'telescope observatory night sky',
      educatie: 'astronaut earth orbit space station', education: 'astronaut earth orbit space station',
      maan: 'moon lunar surface craters', kometen: 'comet astronomy solar system',
      komeet: 'comet astronomy solar system', zon: 'sun solar flare corona',
      planeten: 'planet solar system', 'zwarte-gaten': 'black hole accretion disk',
    }
    const NOUNS = ['starship', 'falcon', 'artemis', 'starlink', 'spacex', 'hubble', 'webb', 'jwst', 'perseverance', 'curiosity', 'voyager', 'cassini', 'dragon', 'orion', 'iss', 'saturn', 'jupiter', 'venus', 'neptune', 'uranus', 'mars', 'moon', 'lunar', 'comet', 'asteroid', 'nebula', 'galaxy', 'aurora', 'rocket', 'launch', 'orbit', 'astronaut', 'satellite', 'telescope', 'solar']
    const NL_EN: Record<string, string> = {
      lancering: 'launch', lanceert: 'launch', raket: 'rocket', satelliet: 'satellite',
      ruimtestation: 'space station', maan: 'moon', zon: 'sun', sterrenstelsel: 'galaxy',
      melkweg: 'milky way', komeet: 'comet', astronaut: 'astronaut', telescoop: 'telescope',
      nevel: 'nebula', planeet: 'planet', missie: 'mission', heelal: 'cosmos',
    }
    const query = (title: string, cat: string) => {
      const low = title.toLowerCase()
      const hit = NOUNS.filter(n => low.includes(n))
      if (hit.length) return hit.slice(0, 3).join(' ')
      const words = low.replace(/[^a-z\s]/g, ' ').split(/\s+/)
      const nl = [...new Set(words.map(w => NL_EN[w]).filter(Boolean))].slice(0, 3)
      if (nl.length) return nl.join(' ')
      return CAT_Q[(cat || '').toLowerCase()] || 'space astronomy cosmos'
    }

    const todo = articles.filter(a => !a.imageUrl && !nasaFetched.current.has(a.slug)).slice(0, 24)
    if (!todo.length) return
    todo.forEach(a => nasaFetched.current.add(a.slug))

    todo.forEach(async (a, i) => {
      await new Promise(r => setTimeout(r, i * 140))
      const hash = a.slug.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0)
      const page = (hash % 8) + 1
      const q = query(a.title, a.category)
      for (const pg of [page, (page % 8) + 1]) {
        try {
          const res = await fetch(`${PROXY}/image-search?q=${encodeURIComponent(q)}&page=${pg}&hash=${hash}`)
          if (!res.ok) continue
          const data = await res.json()
          if (!data?.url) continue
          setArticles(prev => prev.map(p => (p.slug === a.slug ? { ...p, imageUrl: data.url } : p)))
          return
        } catch { /* try the next page, then give up quietly */ }
      }
    })
  }, [articles])

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
  const edition = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <StagingBanner />
      <PlateHead total={total} edition={edition} />
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
