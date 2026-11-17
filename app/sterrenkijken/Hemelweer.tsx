'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Hemelweer — het antwoord op "wordt het helder?" voor vannacht.

   Links het oordeel in één zin met de feiten eronder, rechts de uurstrook:
   elk uur van de avondschemer tot de ochtendschemer, met wolken per laag,
   doorzicht, seeing, dauw en de maan. Zo leest een sterrenkijker het weer.
   De rekenregels staan in lib/hemelweer.ts.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Ico, Tip } from '@/app/_plate/Instruments'
import { type Nacht, type Uur, hhmm, kopzin, moonName, moonWaxing, oordeel } from '@/lib/hemelweer'

export function toon(score: number): string {
  return score >= 60 ? 'var(--pl-good)' : score >= 40 ? 'var(--pl-stamp)' : 'var(--pl-warn)'
}

const tijd = (d: Date | null) => d ? hhmm(d) : '—'
const VIJF = ['', 'slecht', 'matig', 'redelijk', 'goed', 'uitstekend']

function Staaf({ v, label }: { v: number; label: string }) {
  return (
    <span className="pl-rate" role="img" aria-label={`${label}: ${v} van 5`}>
      {[1, 2, 3, 4, 5].map(i => <i key={i} data-on={i <= v ? '1' : '0'} />)}
    </span>
  )
}

/* Een wolkenlaag als grijswaarde: hoe lichter de cel, hoe dichter de laag. */
function Laag({ v }: { v: number }) {
  return (
    <td className="pl-uur__wolk" style={{ background: `color-mix(in srgb, var(--pl-ink-2) ${Math.round(v * 0.55)}%, transparent)` }}>
      <span>{Math.round(v)}</span>
    </td>
  )
}

export function Oordeel({ n, plaats, kp, bijgewerkt, laden, verversen }: {
  n: Nacht
  plaats: string
  kp: number | null
  bijgewerkt: Date | null
  laden: boolean
  verversen: () => void
}) {
  const g = n.grenzen
  const midden = new Date(n.avond.getFullYear(), n.avond.getMonth(), n.avond.getDate() + 1)
  const maan = Math.round(n.verlicht * 100)
  const best = n.donker.length ? n.donker.reduce((a, u) => (u.score > a.score ? u : a)) : null
  const dauw = n.donker.some(u => u.dauw)

  return (
    <div className="pl-verdict">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Tip label={
          <>
            <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Hoe het oordeel ontstaat</span>
            Elk donker uur krijgt een score uit bewolking, regenkans, doorzicht, seeing en
            maanlicht. Het cijfer is het beste blok van drie uur dat nog komt: lang genoeg
            om echt te kijken.
          </>
        }>
          <span className="pl-label">Vannacht · {plaats}</span>
        </Tip>
      </div>

      <p className="pl-verdict__zin">{kopzin(n)}</p>

      <div className="pl-verdict__score">
        <span className="pl-verdict__n pl-num pl-live">{Math.round(n.score / 10)}</span>
        <span className="pl-label pl-num">/ 10</span>
        <strong style={{ marginLeft: 'auto', fontSize: '1.1rem', letterSpacing: '-0.02em', color: toon(n.score) }}>
          {oordeel(n.score)}
        </strong>
      </div>
      <div className="pl-meter" style={{ color: toon(n.score) }} aria-hidden="true">
        <i style={{ transform: `scaleX(${n.score / 100})` }} />
      </div>

      <dl className="pl-verdict__rows">
        {([
          ['Beste venster', n.venster ? `${hhmm(n.venster.van)} – ${hhmm(n.venster.tot)}` : best && best.score >= 40 ? `rond ${hhmm(best.t)}` : 'geen', true],
          ['Donker', `${tijd(g.donkerVan)} – ${tijd(g.donkerTot)}`, false],
          ['Maan', `${maan}% · ${moonName(n.verlicht, moonWaxing(midden))}`, false],
          ['Maan op / onder', `${tijd(g.maanOp)} / ${tijd(g.maanOnder)}`, false],
          ['Bewolking', `${n.wolk}% gemiddeld`, true],
          ['Doorzicht', best ? VIJF[best.doorzicht] : '—', true],
          ['Seeing (schatting)', best ? VIJF[best.seeing] : '—', true],
          ['Dauw', dauw ? 'kans op dauw, lens afdekken' : 'droog', true],
          ['Kp-index', kp === null ? '—' : `${kp.toFixed(1)}${kp >= 5 ? ' · poollicht mogelijk' : ''}`, kp !== null],
        ] as [string, string, boolean][]).map(([t, v, live]) => (
          <div key={t}>
            <dt className="pl-label">{t}</dt>
            <dd className={`pl-num${live ? ' pl-live' : ''}`} style={{ margin: 0, fontSize: '0.8125rem', textAlign: 'right', color: live ? undefined : 'var(--pl-ink-2)' }}>{v}</dd>
          </div>
        ))}
      </dl>

      <p className="pl-verdict__ververs">
        <span className="pl-dot pl-live" aria-hidden="true" />
        <span className="pl-label pl-num">
          {bijgewerkt ? `Bijgewerkt ${hhmm(bijgewerkt)}` : 'Ophalen…'}
        </span>
        <button type="button" className="pl-loc" onClick={verversen} disabled={laden} style={{ marginLeft: 'auto', height: 30 }}>
          {laden ? 'Bezig…' : 'Ververs'}
        </button>
      </p>

      <Link href="/sterrenkijken/uitrusting/" className="pl-read pl-verdict__uitr">
        <span>Heldere nacht? Dit heb je nodig</span>
        <span className="pl-read__rule" aria-hidden="true" />
        <Ico.arrow />
      </Link>
    </div>
  )
}

const RIJEN: [string, (u: Uur) => React.ReactNode][] = [
  ['Regen', u => u.regen >= 10 ? `${Math.round(u.regen)}%` : '·'],
  ['Doorzicht', u => <Staaf v={u.doorzicht} label="Doorzicht" />],
  ['Seeing', u => <Staaf v={u.seeing} label="Seeing" />],
  ['Dauw', u => u.dauw ? 'ja' : '·'],
  ['Maan', u => u.maan > 0 ? `${Math.round(u.maan)}°` : '·'],
  ['Temp.', u => `${Math.round(u.temp)}°`],
  ['Wind', u => Math.round(u.wind)],
]

export function Uurstrook({ n, nu }: { n: Nacht; nu: Date }) {
  const uurNu = (u: Uur) => nu >= u.t && nu.getTime() < u.t.getTime() + 3600e3
  const ref = useRef<HTMLDivElement>(null)
  /* Op een smal scherm begint de strook bij het huidige uur, niet bij 17:00. */
  const nuIdx = n.uren.findIndex(uurNu)
  useEffect(() => {
    const el = ref.current, th = el?.querySelector<HTMLElement>('thead th[data-nu="1"]')
    if (el && th) el.scrollLeft = Math.max(0, th.offsetLeft - 140)
  }, [nuIdx])
  return (
    <div className="pl-eph pl-uur" ref={ref}>
      <table>
        <caption>
          <span className="pl-label">Per uur · vannacht</span>
          <span className="pl-uur__legenda" aria-hidden="true">
            <i data-licht="schemer" /> schemer <i data-licht="donker" /> donker
          </span>
        </caption>
        <thead>
          <tr>
            <th scope="col">Uur</th>
            {n.uren.map(u => (
              <th key={+u.t} scope="col" data-licht={u.licht} data-nu={uurNu(u) ? '1' : '0'}>
                {String(u.t.getHours()).padStart(2, '0')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="pl-uur__score">
            <th scope="row">Hemel</th>
            {n.uren.map(u => (
              <td key={+u.t} data-nu={uurNu(u) ? '1' : '0'}>
                {u.licht === 'dag' ? <span className="pl-uur__dag">dag</span> : (
                  <span className="pl-uur__blok" style={{ color: toon(u.score) }} aria-label={`score ${Math.round(u.score / 10)} van 10`}>
                    <i style={{ height: `${Math.max(8, u.score)}%` }} />
                    <b>{Math.round(u.score / 10)}</b>
                  </span>
                )}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Wolken</th>
            {n.uren.map(u => <td key={+u.t} className="pl-live">{Math.round(u.wolk)}%</td>)}
          </tr>
          <tr><th scope="row">laag</th>{n.uren.map(u => <Laag key={+u.t} v={u.laag} />)}</tr>
          <tr><th scope="row">midden</th>{n.uren.map(u => <Laag key={+u.t} v={u.midden} />)}</tr>
          <tr><th scope="row">hoog</th>{n.uren.map(u => <Laag key={+u.t} v={u.hoog} />)}</tr>
          {RIJEN.map(([t, f]) => (
            <tr key={t}>
              <th scope="row">{t}</th>
              {n.uren.map(u => <td key={+u.t}>{f(u)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pl-uur__voet">
        Wolken in procent van de hemel. Laag (onder 2 km) houdt alles tegen, hoog (cirrus)
        maakt de hemel melkig. Seeing is een schatting uit de straalstroom: hoe rustiger,
        hoe scherper planeten en de maan in een telescoop. Wind in km/u, maan in graden boven de horizon.
      </p>
    </div>
  )
}
