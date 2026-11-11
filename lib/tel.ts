// ── Eigen, cookieloze teller ──────────────────────────────────────────────
//
// Stuurt een paginaweergave of gebeurtenis naar de worker (cf-worker/
// teller.mjs). Geen cookie, geen id, niets in localStorage: alleen het pad,
// de host van de verwijzer en eventueel de utm_source. sendBeacon met
// text/plain heeft geen CORS-preflight nodig en overleeft het wegklikken van
// de pagina.

import { PROXY } from './home-content'

type Meting =
  | { t: 'pv' }
  | { t: 'ev'; e: string; x?: string }

/* Bij navigatie binnen de site (Next-router) blijft document.referrer de
   oorspronkelijke verwijzer. Na de eerste weergave is de verwijzer dus
   altijd de site zelf, anders telt elke klik als een nieuw bezoek. */
let binnen = false

function verstuur(m: Meting) {
  if (typeof window === 'undefined') return
  try {
    const host = location.hostname
    if (host !== 'nightgazer.space' && host !== 'www.nightgazer.space') return
    let r = binnen ? host : ''
    if (!binnen) {
      try { r = document.referrer ? new URL(document.referrer).hostname : '' } catch { /* geen verwijzer */ }
    }
    if (m.t === 'pv') binnen = true
    const s = new URLSearchParams(location.search).get('utm_source') || ''
    const body = JSON.stringify({ ...m, p: location.pathname, r, s })
    const blob = new Blob([body], { type: 'text/plain' })
    if (navigator.sendBeacon?.(`${PROXY}/tel`, blob)) return
    fetch(`${PROXY}/tel`, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } })
      .catch(() => { /* een meting mag nooit iets breken */ })
  } catch { /* idem */ }
}

let laatstePad = ''

/** Eén weergave per pad; een re-render of terug-en-weer telt niet dubbel. */
export function telWeergave() {
  if (typeof window === 'undefined') return
  if (location.pathname === laatstePad) return
  laatstePad = location.pathname
  verstuur({ t: 'pv' })
}

export function telGebeurtenis(e: string, x?: string) {
  verstuur({ t: 'ev', e, x })
}

/* ── Klikken naar buiten: winkels en Ko-fi ─────────────────────────────────
   Eén luisteraar op het document, zodat elke bestaande en toekomstige knop
   meetelt zonder dat een pagina er iets voor hoeft te doen. Er gaat alleen
   mee wélke bestemming het was (astroshop, amazon of kofi) en vanaf welk pad;
   niet welk product, en niets over de bezoeker. */

export function uitDoel(href: string): 'astroshop' | 'amazon' | 'kofi' | 'kalender' | '' {
  let host = '', pad = ''
  try { const u = new URL(href, 'https://nightgazer.space'); host = u.hostname.toLowerCase(); pad = u.pathname } catch { return '' }
  if (/(^|\.)astroshop\.[a-z]+$/.test(host)) return 'astroshop'
  if (host === 'amazon.nl' || host.endsWith('.amazon.nl')) return 'amazon'
  // Een product in de Ko-fi-shop (/s/…) is de kalender, de rest is een bijdrage.
  if (host === 'ko-fi.com' || host.endsWith('.ko-fi.com')) return pad.startsWith('/s/') ? 'kalender' : 'kofi'
  return ''
}

let luistert = false

export function telUitklikken() {
  if (typeof document === 'undefined' || luistert) return
  luistert = true
  const meld = (ev: MouseEvent) => {
    // auxclick vuurt ook voor de rechterknop; alleen de middelste opent een tab.
    if (ev.type === 'auxclick' && ev.button !== 1) return
    const a = (ev.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!a) return
    const doel = uitDoel(a.href)
    if (doel) telGebeurtenis('uit-klik', doel)
  }
  document.addEventListener('click', meld, { capture: true })
  document.addEventListener('auxclick', meld, { capture: true })
}
