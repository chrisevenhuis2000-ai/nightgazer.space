'use client'

/* Het blokje dat naar Raad de hemelfoto leidt: de ingezoomde foto van
   vandaag, precies zoals het spel begint. Wie vandaag al speelde, ziet de
   hele foto en de uitslag. Staat op de voorpagina, /vandaag en /educatie. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Ico } from './Instruments'
import { img } from './shared'
import { telGebeurtenis } from '@/lib/tel'
import { fotoVan, puzzelNr, nlDag, zoomVoor, POGINGEN, type Stand } from '@/lib/hemelfoto'

export function HemelfotoTeaser() {
  const [nr, setNr] = useState<number | null>(null)
  const [stand, setStand] = useState<Stand | null>(null)

  useEffect(() => {
    const n = puzzelNr(nlDag())
    setNr(n)
    try {
      const raw = localStorage.getItem('nightgazer_hemelfoto')
      const a = raw ? JSON.parse(raw) as Record<string, Stand> : {}
      setStand(a[n] ?? null)
    } catch { /* geen geheugen: gewoon het begin tonen */ }
  }, [])

  /* Pas na het laden de foto kiezen: dan klopt de Nederlandse dag ook als
     de pagina gisteren statisch gebouwd is. */
  if (nr === null) return <div className="pl-hft" aria-hidden="true" style={{ minHeight: 140 }} />

  const foto = fotoVan(nr)
  const klaar = !!stand?.klaar
  const zoom = klaar ? 1 : zoomVoor(0)
  const src = img(`https://images-assets.nasa.gov/image/${foto.nasaId}/${foto.nasaId}~${foto.variant}.jpg`, klaar ? 300 : 1200)

  return (
    <Link href="/spellen/hemelfoto/" className="pl-hft" onClick={() => telGebeurtenis('hemelfoto-teaser', location.pathname)}>
      <span className="pl-hft__img" aria-hidden="true">
        <img src={src} alt="" loading="lazy" decoding="async"
          style={{ transform: `scale(${zoom})`, transformOrigin: `${foto.focus[0]}% ${foto.focus[1]}%` }}
          onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
      </span>
      <span className="pl-hft__t">
        <span className="pl-label">Spel van de dag <span className="pl-num">#{nr}</span></span>
        <span className="pl-hft__kop">Raad de hemelfoto</span>
        <span className="pl-body-s">
          {klaar
            ? (stand!.goed ? `Geraden in ${stand!.gokken.length} van ${POGINGEN}. Morgen een nieuwe foto.` : 'Vandaag niet geraden. Morgen een nieuwe foto.')
            : 'Een echte ruimtefoto, ver ingezoomd. Herken jij hem in zes pogingen?'}
        </span>
        <span className="pl-hft__cta">{klaar ? 'Bekijk de uitleg' : stand?.gokken.length ? 'Verder spelen' : 'Speel mee'} <Ico.arrow /></span>
      </span>
    </Link>
  )
}
