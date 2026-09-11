'use client'

/* Gedeelde chrome voor de /staging-surfaces.
   De homepage en de nieuwspagina lezen hier uit één bron, zodat de kop,
   de filterbalk, het advertentieveld en de markeringen niet uit elkaar
   kunnen lopen. De wereld staat in DESIGN.md. */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Archivo } from 'next/font/google'
import { AdUnit } from '../components/AdUnit'
import { type FooterCol } from '../components/SiteFooter'
import {
  PROXY, type Article, FALLBACK_ARTICLES,
} from '@/lib/home-content'
import { Ico } from './Instruments'
import './staging.css'

export const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-archivo',
  display: 'swap',
})

/* Navigatie binnen staging: de twee herontworpen surfaces linken naar
   elkaar, de nog niet herontworpen pagina's linken naar de live versie. */
export const STG_NAV: { href: string; label: string; key: string }[] = [
  { href: '/staging',        label: 'Archief',       key: 'home' },
  { href: '/staging/nieuws', label: 'Nieuws',        key: 'nieuws' },
  { href: '/sterrenkijken',  label: 'Sterrenkijken', key: 'sterrenkijken' },
  { href: '/missies',        label: 'Missies',       key: 'missies' },
  { href: '/educatie',       label: 'Educatie',      key: 'educatie' },
]

export const ROWS_PER_PAGE = 20

/* Ordered by how much the archive actually holds, so the strip is a real
   index rather than a wish list. 'Zonnestelsel' is gone (no articles carry
   it) and 'Educatie' and 'Kometen' are in, because they do. */
export const TOPICS = [
  'Alles', 'Missies', 'Educatie', 'Maan', 'Mars',
  'James Webb', 'Kosmologie', 'Kometen', 'Zwarte Gaten', 'Sterrenkijken',
]

/* Quick filters for the bar under the header. Each one matches on category
   OR on words in the title, so a tag like SpaceX works even though no
   article carries it as a category. Every tag here resolves to real
   articles — none are decorative. */
export const QUICK_TAGS: { tag: string; cat?: string; words?: string[] }[] = [
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

export function quickMatches(a: Article, spec: { cat?: string; words?: string[] }): boolean {
  if (spec.cat && a.category.toLowerCase() === spec.cat) return true
  if (!spec.words) return false
  const t = a.title.toLowerCase()
  return spec.words.some(w => t.includes(w))
}

export const FOOTER_COLS: FooterCol[] = [
  { title: 'Onderwerpen', links: [['James Webb', '/nieuws/onderwerp/james-webb'], ['Mars', '/nieuws/onderwerp/mars'], ['Maan', '/nieuws/onderwerp/maan'], ['Kosmologie', '/nieuws/onderwerp/kosmologie'], ['Sterrenkijken', '/sterrenkijken']] },
  { title: 'Instrumenten', links: [['ISS-tracker', '/'], ['Sterrenkaart', '/sterrenkijken'], ['Lanceringskalender', '/missies']] },
  { title: 'Over ons', links: [['Redactie', '/over'], ['Contact', '/contact'], ['Privacy', '/privacy']] },
]

export const LEVEL_WORD = { beg: 'Beginner', ama: 'Amateur', pro: 'Pro' } as const
export const LEVEL_STEP = { beg: 1, ama: 2, pro: 3 } as const

export function plateNo(total: number, i: number) {
  return `NG-${String(Math.max(total - i, 1)).padStart(4, '0')}`
}

export function img(url: string, w: number) {
  return `${PROXY}/image-proxy?url=${encodeURIComponent(url)}&w=${w}`
}

/* ── Reading level as a mark, never a coloured badge ────────────────────── */
export function Ladder({ level }: { level: 'beg' | 'ama' | 'pro' }) {
  const on = LEVEL_STEP[level]
  return (
    <span className="pl-ladder" aria-hidden="true">
      {[1, 2, 3].map(i => <i key={i} data-on={i <= on ? '1' : '0'} />)}
    </span>
  )
}

/* ══ Staging banner ═══════════════════════════════════════════════════════ */
export function StagingBanner() {
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
export function PlateHead({ total, edition, current }: {
  total: number
  edition: string
  current: string
}) {
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
              {STG_NAV.map(({ href, label, key }) => (
                <li key={key}>
                  <Link href={href} aria-current={key === current ? 'page' : undefined}>{label}</Link>
                </li>
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
          {STG_NAV.map(({ href, label, key }) => (
            <Link key={key} href={href} onClick={close} aria-current={key === current ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </>
  )
}


/* ══ Quick bar: search plus one-click personalisation of the feed ═════════ */
export function QuickBar({ articles, active, onPick }: {
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


/* ══ Labelled advertising field ═══════════════════════════════════════════ */
export function AdPlate() {
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



/* ══ Article loading ══════════════════════════════════════════════════════
   The index plus the NASA image backfill for plates that carry no image.
   Both /staging surfaces use this, so the fetch behaviour cannot drift. */

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

function imageQuery(title: string, cat: string): string {
  const low = title.toLowerCase()
  const hit = NOUNS.filter(n => low.includes(n))
  if (hit.length) return hit.slice(0, 3).join(' ')
  const words = low.replace(/[^a-z\s]/g, ' ').split(/\s+/)
  const nl = [...new Set(words.map(w => NL_EN[w]).filter(Boolean))].slice(0, 3)
  if (nl.length) return nl.join(' ')
  return CAT_Q[(cat || '').toLowerCase()] || 'space astronomy cosmos'
}

export function useArticles(backfill = 24): Article[] {
  const [articles, setArticles] = useState<Article[]>(FALLBACK_ARTICLES)
  const fetched = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => { if (Array.isArray(data) && data.length) setArticles(data) })
      .catch(() => { /* the fallback list is already on screen */ })
  }, [])

  useEffect(() => {
    const todo = articles.filter(a => !a.imageUrl && !fetched.current.has(a.slug)).slice(0, backfill)
    if (!todo.length) return
    todo.forEach(a => fetched.current.add(a.slug))

    todo.forEach(async (a, i) => {
      await new Promise(r => setTimeout(r, i * 140))
      const hash = a.slug.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0)
      const page = (hash % 8) + 1
      const q = imageQuery(a.title, a.category)
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
  }, [articles, backfill])

  return articles
}

export function editionLabel(): string {
  return new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
