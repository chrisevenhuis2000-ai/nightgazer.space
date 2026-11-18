'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NachtHero — versie B van de homepage (designonderzoek nov 2026).

   Antwoord eerst: één groot cijfer voor vannacht, één zin, en een strook met
   de bewolking per donker uur waarin het beste venster oplicht. Rekent met
   dezelfde lib/hemelweer als /sterrenkijken, voor de plaats die de bezoeker
   daar koos (anders Amsterdam), zodat de twee pagina's nooit verschillen.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  type Nacht, hemelUrl, leesUren, nacht, huidigeAvond, oordeel, kopzin, hhmm,
  moonName, moonWaxing, moonIllumination,
} from '@/lib/hemelweer'
import { useUpcoming } from './Instruments'

const LOC_KEY = 'nightgazer_stargazing_loc' // zelfde sleutel als /sterrenkijken
type Plaats = { lat: number; lon: number; name: string }
const STANDAARD: Plaats = { lat: 52.3676, lon: 4.9041, name: 'Amsterdam' }

type Stand = { status: 'loading' } | { status: 'failed' } | { status: 'ok'; n: Nacht; op: Date }

/* De schaduw over de maanfoto: de echte fase van dit moment. Pas na mount
   berekend, want de statische HTML weet niet wanneer hij gelezen wordt.
   Wassend = rechts verlicht (zoals je hem vanuit Nederland ziet). */
function MaanSchaduw() {
  const [fase, setFase] = useState<{ k: number; wassend: boolean } | null>(null)
  useEffect(() => {
    const zet = () => { const nu = new Date(); setFase({ k: moonIllumination(nu), wassend: moonWaxing(nu) }) }
    zet()
    const t = setInterval(zet, 30 * 60000)
    return () => clearInterval(t)
  }, [])
  if (!fase) return null
  const r = 0.97
  const a = Math.abs(2 * fase.k - 1) * r          // halve breedte van de terminator-ellips
  const sweep = fase.k < 0.5 ? 0 : 1               // sikkel: schaduw buigt naar de lichte kant
  const d = `M0,${-r} A${r},${r} 0 0 0 0,${r} A${a.toFixed(4)},${r} 0 0 ${sweep} 0,${-r} Z`
  return (
    <svg className="nb-hero__fase" viewBox="-1 -1 2 2" aria-hidden="true">
      <path d={d} transform={fase.wassend ? undefined : 'scale(-1,1)'} />
    </svg>
  )
}

/* Eén zin; de tijden van het venster in amber, de rest gewoon. */
function Zin({ n }: { n: Nacht }) {
  const v = n.venster
  if (!v) return <>{kopzin(n)}.</>
  const uren = (v.tot.getTime() - v.van.getTime()) / 3600e3
  if (n.donker.length && uren >= n.donker.length - 1) return <><em>De hele nacht helder.</em></>
  if (uren >= 2) return <>Helder van <em>{hhmm(v.van)} tot {hhmm(v.tot)}</em>.</>
  return <>Kort helder rond <em>{hhmm(v.van)}</em>.</>
}

export function NachtHero({ total }: { total: number }) {
  const [plaats, setPlaats] = useState<Plaats>(STANDAARD)
  const [stand, setStand] = useState<Stand>({ status: 'loading' })
  const { mounted, list } = useUpcoming()
  const volgende = list[0]

  useEffect(() => {
    let p = STANDAARD
    try {
      const l = JSON.parse(localStorage.getItem(LOC_KEY) || 'null')
      if (typeof l?.lat === 'number' && typeof l?.lon === 'number') p = { lat: l.lat, lon: l.lon, name: l.name || 'jouw plek' }
    } catch { /* geen opgeslagen plaats */ }
    setPlaats(p)

    let alive = true
    const url = hemelUrl(p.lat, p.lon, 2)
    fetch(url)
      .then(r => r.status === 400 ? fetch(url.replace(',wind_speed_250hPa', '')) : r)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (!alive) return
        const nu = new Date()
        const n = nacht(leesUren(data, p.lat, p.lon), p.lat, p.lon, huidigeAvond(nu), nu)
        setStand({ status: 'ok', n, op: nu })
      })
      .catch(() => { if (alive) setStand({ status: 'failed' }) })
    return () => { alive = false }
  }, [])

  const n = stand.status === 'ok' ? stand.n : null
  /* Afronden naar beneden, zodat cijfer en oordeel (grenzen 20/40/60/80) altijd kloppen. */
  const cijfer = n ? Math.floor(n.score / 10) : null
  const v = n?.venster ?? null
  const inVenster = (t: Date) => !!v && t >= v.van && t < v.tot
  const maanOnder = n?.grenzen.maanOnder
  const maanOp = n?.grenzen.maanOp
  const donkerVan = n?.grenzen.donkerVan
  const donkerTot = n?.grenzen.donkerTot

  return (
    <section className="nb-hero" aria-labelledby="nb-hero-title">
      <div className="nb-hero__maan" aria-hidden="true"><MaanSchaduw /></div>

      <div className="nb-hero__in">
        <p className="nb-hero__plaats">
          <span className="nb-hero__stip" aria-hidden="true" />
          <strong>Vannacht in {plaats.name}</strong>
          {stand.status === 'ok' && <span> · bijgewerkt {hhmm(stand.op)}</span>}
          <Link href="/sterrenkijken" className="nb-hero__wissel">andere plaats</Link>
        </p>

        <h1 id="nb-hero-title" className="sr-only">
          Kan ik vannacht sterren kijken? {n ? `${oordeel(n.score)}, ${cijfer} uit 10. ${kopzin(n)}.` : ''}
        </h1>

        <div className="nb-hero__cijfer" aria-hidden="true">
          {stand.status === 'loading' && <div className="pl-skel" style={{ width: 260, height: 150 }} />}
          {stand.status === 'failed' && <p className="nb-hero__fout">Het hemelweer kwam niet binnen. Probeer het zo opnieuw of kijk op <Link href="/sterrenkijken">Sterrenkijken</Link>.</p>}
          {n && cijfer !== null && <>
            <span className="nb-hero__n">{cijfer}<sup>/10</sup></span>
            <span className="nb-hero__w"><strong>{oordeel(n.score)}</strong><span>de kijkscore voor vannacht</span></span>
          </>}
        </div>

        {n && (
          <p className="nb-hero__zin">
            <Zin n={n} />
            {maanOnder && donkerVan && maanOnder > donkerVan && n.verlicht > 0.2 && <> De maan gaat om {hhmm(maanOnder)} onder.</>}
          </p>
        )}

        {n && n.donker.length > 0 && (
          <>
            <div
              className="nb-strook"
              role="img"
              aria-label={`Bewolking per uur vannacht. ${v ? `Beste venster ${hhmm(v.van)} tot ${hhmm(v.tot)}.` : 'Geen helder venster.'}`}
              style={{ gridTemplateColumns: `repeat(${n.donker.length}, minmax(0, 1fr))` }}
            >
              {n.donker.map(u => (
                <div key={u.t.toISOString()} className={`nb-uur${inVenster(u.t) ? ' is-best' : ''}`} title={`${hhmm(u.t)}: ${Math.round(u.wolk)}% bewolkt`}>
                  <i style={{ height: `${Math.max(3, Math.round(u.wolk))}%` }} />
                  <b>{String(u.t.getHours()).padStart(2, '0')}</b>
                </div>
              ))}
            </div>
            <div className="nb-strook__leg">
              <span>Balk = bewolking per uur</span>
              {v && <span className="nb-strook__k">■ beste venster</span>}
              <Link href="/sterrenkijken" className="nb-strook__link">Hemelweer per uur →</Link>
            </div>
          </>
        )}
      </div>

      <dl className="nb-feiten">
        <div>
          <dt>Maan</dt>
          <dd className="nb-feiten__v">{n ? <>{Math.round(n.verlicht * 100)}<small>%</small></> : '—'}</dd>
          <dd className="nb-feiten__s">
            {n ? <>{moonName(n.verlicht, moonWaxing(new Date()))}{maanOnder ? `, onder om ${hhmm(maanOnder)}` : maanOp ? `, op om ${hhmm(maanOp)}` : ''}.</> : ' '}
          </dd>
        </div>
        <div>
          <dt>Echt donker</dt>
          <dd className="nb-feiten__v">{donkerVan ? hhmm(donkerVan) : '—'}</dd>
          <dd className="nb-feiten__s">{donkerTot ? `Tot ${hhmm(donkerTot)} in de ochtend.` : ' '}</dd>
        </div>
        <div>
          <dt>Bewolking</dt>
          <dd className="nb-feiten__v">{n ? <>{n.wolk}<small>%</small></> : '—'}</dd>
          <dd className="nb-feiten__s">Gemiddeld over de donkere uren.</dd>
        </div>
        <div>
          <dt>Volgende</dt>
          <dd className="nb-feiten__v">{mounted && volgende ? <>{volgende.days === 0 ? 'nu' : volgende.days}{volgende.days > 0 && <small> {volgende.days === 1 ? 'dag' : 'dagen'}</small>}</> : '—'}</dd>
          <dd className="nb-feiten__s">{mounted && volgende ? `${volgende.title}.` : ' '}</dd>
        </div>
      </dl>

      <p className="nb-hero__onder">
        Nederlands nieuws over sterrenkunde en ruimtevaart, {total} artikelen op drie niveaus.{' '}
        <a href="#pl-archief">Naar het nieuws →</a>
      </p>
    </section>
  )
}
