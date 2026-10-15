'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Maankalender — de maand als contactvel.

   Teruggezet van de vorige sterrenkijkpagina, in de plaatwereld: elke dag
   een vakje met een getekende fase (geen emoji), nieuwe maan en volle maan
   als markering met een woord erbij, vandaag in chinagraph omdat dat de
   enige vergankelijke waarde op dit vel is. De fase komt uit dezelfde
   getMoonPhase als de 7-nachtentabel, dus beide spreken elkaar nooit tegen.

   Altijd 42 vakjes (zes weken), ook vóór de datum bekend is, zodat het vel
   niet van hoogte verandert als de maand verschijnt.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from 'react'
import { getMoonPhase } from '@/lib/sky-data'

const SYNODIC_DAYS = 29.53059
const DAYS_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const PHASE_NAMES = [
  'Nieuwe maan', 'Wassende sikkel', 'Eerste kwartier', 'Wassende maan',
  'Volle maan', 'Afnemende maan', 'Laatste kwartier', 'Afnemende sikkel',
]

/** Fase 0–1 naar de acht benoemde fases; 0 = nieuw, 4 = vol. */
function phaseIndex(p: number): number {
  return Math.round(p * 8) % 8
}

/** Valt het moment van nieuwe of volle maan op deze kalenderdag? Alleen die
 *  ene dag krijgt de markering — afronden naar acht fases zou er vier
 *  markeren. */
function eventOn(y: number, m: number, d: number): 'nieuw' | 'vol' | null {
  const p0 = getMoonPhase(new Date(y, m, d, 0, 0, 0))
  const p1 = getMoonPhase(new Date(y, m, d + 1, 0, 0, 0))
  if (p1 < p0) return 'nieuw'
  if (p0 < 0.5 && p1 >= 0.5) return 'vol'
  return null
}

function phaseName(p: number, mark: 'nieuw' | 'vol' | null): string {
  if (mark === 'nieuw') return 'Nieuwe maan'
  if (mark === 'vol') return 'Volle maan'
  const idx = phaseIndex(p)
  if (idx === 0) return p < 0.5 ? 'Wassende sikkel' : 'Afnemende sikkel'
  if (idx === 4) return p < 0.5 ? 'Wassende maan' : 'Afnemende maan'
  return PHASE_NAMES[idx]
}

/* ── Eén getekende fase ─────────────────────────────────────────────────
   Een donkere schijf met het verlichte deel erover: een halve cirkel aan
   de verlichte kant plus de terminator als ellips. Wassend licht rechts,
   afnemend links (noordelijk halfrond). */
function Phase({ p, size = 20 }: { p: number; size?: number }) {
  const r = size / 2 - 1
  const c = size / 2
  const cos = Math.cos(2 * Math.PI * p)
  const rx = Math.abs(cos) * r
  const waxing = p < 0.5
  const litSweep = waxing ? 1 : 0
  const termSweep = waxing ? (cos > 0 ? 0 : 1) : (cos > 0 ? 1 : 0)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="pl-moon__ph">
      <circle cx={c} cy={c} r={r} className="pl-moon__dark" />
      {rx < r * 0.995 || cos < 0 ? (
        <path
          className="pl-moon__lit"
          d={`M ${c} ${c - r} A ${r} ${r} 0 0 ${litSweep} ${c} ${c + r} A ${rx} ${r} 0 0 ${termSweep} ${c} ${c - r} Z`}
        />
      ) : null}
    </svg>
  )
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000)
}

export default function Maankalender() {
  const [today, setToday] = useState<Date | null>(null)
  const [view, setView] = useState<{ y: number; m: number } | null>(null)

  /* De datum pas na mount: de export is statisch, de maan niet. */
  useEffect(() => {
    const n = new Date()
    setToday(n)
    setView({ y: n.getFullYear(), m: n.getMonth() })
  }, [])

  const cells = useMemo(() => {
    if (!view) return Array.from({ length: 42 }, () => null)
    const first = new Date(view.y, view.m, 1)
    const offset = (first.getDay() + 6) % 7
    const days = new Date(view.y, view.m + 1, 0).getDate()
    return Array.from({ length: 42 }, (_, i) => {
      const d = i - offset + 1
      if (d < 1 || d > days) return null
      /* 20:00, gelijk aan de tabel bovenaan: dat is wanneer je kijkt. */
      const p = getMoonPhase(new Date(view.y, view.m, d, 20, 0, 0))
      return { d, p, mark: eventOn(view.y, view.m, d) }
    })
  }, [view])

  /* Volgende nieuwe en volle maan, gerekend vanaf nu. */
  const next = useMemo(() => {
    if (!today) return null
    const p = getMoonPhase(today)
    return {
      nieuw: addDays(today, ((1 - p) % 1) * SYNODIC_DAYS),
      vol: addDays(today, (((0.5 - p) % 1) + 1) % 1 * SYNODIC_DAYS),
    }
  }, [today])

  const isToday = (d: number) =>
    !!today && !!view && view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate()

  const shift = (delta: number) => setView(v => {
    if (!v) return v
    const d = new Date(v.y, v.m + delta, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const monthLabel = view
    ? new Date(view.y, view.m, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
    : ' '
  const fmt = (d: Date) => d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="pl-plate pl-moon">
      <div className="pl-moon__head">
        <div className="pl-seg pl-seg--smal" role="group" aria-label="Kies een maand">
          <button type="button" onClick={() => shift(-1)} aria-label="Vorige maand">‹</button>
          <span className="pl-moon__month" aria-live="polite">{monthLabel}</span>
          <button type="button" onClick={() => shift(1)} aria-label="Volgende maand">›</button>
        </div>
        <dl className="pl-moon__next">
          <div>
            <dt className="pl-label">Volgende nieuwe maan</dt>
            <dd className="pl-num">{next ? fmt(next.nieuw) : '—'}</dd>
          </div>
          <div>
            <dt className="pl-label">Volgende volle maan</dt>
            <dd className="pl-num">{next ? fmt(next.vol) : '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="pl-moon__grid">
        {DAYS_NL.map(d => <span key={d} className="pl-moon__dow pl-label" aria-hidden="true">{d}</span>)}
        {cells.map((c, i) => c ? (
          <span
            key={i}
            className="pl-moon__cell"
            data-mark={c.mark ?? undefined}
            aria-current={isToday(c.d) ? 'date' : undefined}
            title={`${c.d} — ${phaseName(c.p, c.mark)}`}
          >
            <span className="sr-only">{`${c.d}: ${phaseName(c.p, c.mark)}`}</span>
            <Phase p={c.p} />
            <span className={`pl-moon__d pl-num${isToday(c.d) ? ' pl-live' : ''}`} aria-hidden="true">{c.d}</span>
            {c.mark && <span className="pl-moon__w" aria-hidden="true">{c.mark}</span>}
          </span>
        ) : (
          <span key={i} className="pl-moon__cell" data-empty="1" aria-hidden="true" />
        ))}
      </div>

      <p className="pl-moon__foot pl-body-s">
        Rond nieuwe maan is de hemel het donkerst: de beste nachten voor nevels en
        sterrenstelsels. Rond volle maan zie je vooral de maan zelf, planeten en heldere sterren.
        {' '}Berekend met de gemiddelde maancyclus: het exacte moment kan tot een dag
        afwijken van de almanak.
      </p>
    </div>
  )
}
