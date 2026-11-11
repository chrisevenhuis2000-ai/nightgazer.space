'use client'

/* Cadeautijd: één plaat op de homepage en /vandaag die in november en
   december de cadeaugids, de Hemelkalender en de telescoopgids naar voren
   haalt. De tekst wisselt op datum (lib/cadeautijd.ts); buiten het seizoen
   blijft er één regel naar /gidsen over. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Ico } from './Instruments'
import { GidsenVerwijzing } from './shared'
import { telGebeurtenis } from '@/lib/tel'
import { nlDag } from '@/lib/hemelfoto'
import { seizoen, SEIZOEN_TEKST, type Seizoen } from '@/lib/cadeautijd'
import { KALENDER_PRIJS, KALENDER_JAAR } from '@/lib/hemelkalender'
import { STEUN_URL } from '@/lib/steun'

const RIJEN = [
  { href: '/sterrenkijken/cadeaugids/', kop: 'Cadeaugids', tekst: 'Van rood lampje tot telescoop, per prijsklasse' },
  { href: '/sterrenkijken/hemelkalender/', kop: `Hemelkalender ${KALENDER_JAAR}`, tekst: `${KALENDER_PRIJS}, pdf, direct in huis` },
  { href: '/sterrenkijken/eerste-telescoop/', kop: 'Eerste telescoop kiezen', tekst: 'Waar je op let en wat je echt ziet' },
]

export function Cadeautijd() {
  // Pas na mount: de statische HTML is op de bouwdag gemaakt en mag niet met een andere datum hydrateren.
  const [nu, setNu] = useState<Seizoen | null>(null)
  useEffect(() => { setNu(seizoen(nlDag())) }, [])

  const klik = (href: string) => () => telGebeurtenis('cadeautijd', href)

  if (!nu) return null
  if (nu === 'uit') {
    return <GidsenVerwijzing tekst="Een telescoop kiezen, cadeaus en de Hemelkalender op één plek." onClick={klik('/gidsen/')} />
  }

  const rijen = nu === 'januari' ? RIJEN.slice(1, 2) : RIJEN
  return (
    <section className="pl-plate pl-tijd" aria-labelledby="pl-tijd-kop">
      <span className="pl-label">Cadeautijd</span>
      <h2 id="pl-tijd-kop" className="pl-h2">Een cadeau voor iemand die naar boven kijkt</h2>
      <p className="pl-tijd__seizoen">{SEIZOEN_TEKST[nu]}</p>
      <ul className="pl-tijd__rijen">
        {rijen.map(r => (
          <li key={r.href}>
            <Link href={r.href} className="pl-tijd__rij" onClick={klik(r.href)}>
              <span className="pl-tijd__kop">{r.kop}</span>
              <span className="pl-body-s">{r.tekst}</span>
              <Ico.arrow />
            </Link>
          </li>
        ))}
      </ul>
      <p className="pl-body-s">
        Ik bouw NightGazer alleen, in mijn vrije tijd.{' '}
        <a href={STEUN_URL} target="_blank" rel="noopener" onClick={klik('ko-fi')}>Steun het met een koffie</a>.
      </p>
    </section>
  )
}

/* De besteldatum bovenaan de cadeaugids, alleen voor Sinterklaas en Kerst.
   Ook pas na mount, om dezelfde reden als hierboven. */
export function BestelRegel() {
  const [nu, setNu] = useState<Seizoen | null>(null)
  useEffect(() => { setNu(seizoen(nlDag())) }, [])
  if (nu !== 'sint' && nu !== 'kerst') return null
  return <p className="pl-tijd__seizoen">{SEIZOEN_TEKST[nu]}</p>
}
