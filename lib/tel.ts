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
