'use client'

/* 30 nachten omhoog: een plaat op de homepage, /vandaag en /sterrenkijken
   tijdens de campagne (12 nov t/m 15 dec 2026). Toont de nacht van vandaag;
   vóór de start de aankondiging. Buiten die periode niets. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Ico } from './Instruments'
import { telGebeurtenis } from '@/lib/tel'
import { nlDag } from '@/lib/hemelfoto'
import { NACHTEN, OMHOOG_START, OMHOOG_EINDE } from '@/lib/omhoog'

const AANKONDIGING = '2026-11-12'

export function OmhoogBlok() {
  const [dag, setDag] = useState<string | null>(null)
  useEffect(() => { setDag(nlDag()) }, [])
  if (!dag || dag < AANKONDIGING || dag > OMHOOG_EINDE) return null

  const k = NACHTEN.findIndex(n => n.datum === dag)
  const n = k >= 0 ? NACHTEN[k] : null
  const label = n ? `30 nachten omhoog · nacht ${k + 1} · ${n.ochtend ? 'vroeg in de ochtend' : 'vanavond'}` : '30 nachten omhoog · start maandag 16 november'
  const tekst = n
    ? `${n.titel}. ${n.wanneer}.`
    : dag < OMHOOG_START
      ? 'Van de Leoniden tot de Geminiden elke avond één ding om te zien, met een afvinkkaart om te printen.'
      : ''

  return (
    <div className="pl-plate pl-uitr-ref">
      <div>
        <span className="pl-label">{label}</span>
        <p className="pl-body">{tekst}</p>
      </div>
      <Link href="/omhoog/" className="pl-read" onClick={() => telGebeurtenis('omhoog-blok', dag)}>
        <span>{n ? 'Naar de uitdaging' : 'Doe mee'}</span>
        <span className="pl-read__rule" aria-hidden="true" />
        <Ico.arrow />
      </Link>
    </div>
  )
}
