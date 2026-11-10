'use client'

/* De twee dagspellen naast elkaar: op de voorpagina, /vandaag en /educatie. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Ico } from './Instruments'
import { HemelfotoTeaser } from './HemelfotoTeaser'
import { telGebeurtenis } from '@/lib/tel'
import { nlDag } from '@/lib/hemelfoto'
import { beeldVanDag, speelveld, straal, kijkuur, nlTijdstip, standVan, type Punt } from '@/lib/sterrenbeeld'

export function SterrenbeeldTeaser() {
  const [st, setSt] = useState<{ naam: string; punten: Punt[]; uur: string; richting: string; klaar: boolean } | null>(null)

  useEffect(() => {
    const iso = nlDag()
    const b = beeldVanDag(iso)
    const t = nlTijdstip(iso, kijkuur(iso))
    let klaar = false
    try {
      const raw = localStorage.getItem('nightgazer_sterrenbeeld')
      klaar = !!(raw && JSON.parse(raw)?.[iso]?.[b.id]?.klaar)
    } catch { /* geen geheugen */ }
    setSt({ naam: b.naam, punten: speelveld(b, t, 200).filter(p => p.hoort), uur: `${kijkuur(iso)}:00`, richting: standVan(b, t).richting, klaar })
  }, [])

  if (!st) return <div className="pl-hft" aria-hidden="true" style={{ minHeight: 140 }} />

  return (
    <Link href="/spellen/sterrenbeeld/" className="pl-hft" onClick={() => telGebeurtenis('sterrenbeeld-teaser', location.pathname)}>
      <span className="pl-hft__img pl-hft__img--lucht" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          {st.punten.map(p => <circle key={p.naam} cx={p.x} cy={p.y} r={straal(p.mag, 200) * 1.3} fill="#EEF2FB" />)}
        </svg>
      </span>
      <span className="pl-hft__t">
        <span className="pl-label">Vanavond om <span className="pl-num">{st.uur}</span></span>
        <span className="pl-hft__kop">Teken {st.naam}</span>
        <span className="pl-body-s">
          {st.klaar ? `Getekend. Kijk vanavond naar ${st.richting}.` : 'Verbind de sterren zoals ze vanavond boven Nederland staan.'}
        </span>
        <span className="pl-hft__cta">{st.klaar ? 'Teken er nog een' : 'Speel mee'} <Ico.arrow /></span>
      </span>
    </Link>
  )
}

export function SpellenBlok() {
  return (
    <div className="pl-spellen">
      <HemelfotoTeaser />
      <SterrenbeeldTeaser />
    </div>
  )
}
