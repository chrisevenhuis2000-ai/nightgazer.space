'use client'

/* ══════════════════════════════════════════════════════════════════════════
   ISS-overkomsten

   Niet "52,4°N 4,9°O op 428 km" maar "vanavond 21:14, 4 minuten, helder,
   komt op in het westen". Daar loop je voor naar buiten; van coördinaten
   niet.

   De koepel is de projectie die kijkers kennen: de rand is de horizon, het
   midden is recht boven je. Het spoor loopt dus letterlijk zoals je hem
   over de hemel ziet trekken, met een stip waar hij opkomt.
   ══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  haalTle, vindPassages, helderheid, tleEpoch,
  type Passage, type Tle,
} from '@/lib/iss'
import { compass, compass16, KOMPAS_VOLUIT } from '@/lib/sky-chart'
import { downloadIcs, slugFile } from '@/lib/ics'
import { Ico } from '../Instruments'

const VENSTER = 5      // dagen die standaard getoond worden
const VER_VENSTER = 21 // waar we zoeken als het venster leeg is

const klok = (d: Date) => d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
function duurTekst(s: number): string {
  if (s < 60) return `${s} seconden`
  if (s < 105) return 'ruim een minuut'
  return `${Math.round(s / 60)} minuten`
}

/** 'vanavond', 'morgenavond', of gewoon de dag. */
function wanneer(d: Date, nu = new Date()): string {
  const dag0 = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())
  const dag1 = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const verschil = Math.round((dag1.getTime() - dag0.getTime()) / 86400000)
  const ochtend = d.getHours() < 12
  if (verschil === 0) return ochtend ? 'vanochtend' : 'vanavond'
  if (verschil === 1) return ochtend ? 'morgenochtend' : 'morgenavond'
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })
    + (ochtend ? ' in de ochtend' : '')
}

/* ── De hemelkoepel ───────────────────────────────────────────────────── */
function Koepel({ p }: { p: Passage }) {
  const R = 104, C = 120
  /* Rand is de horizon, midden is het zenit. Azimut 0 (noord) staat boven,
     en oost ligt rechts — je kijkt hier van binnenuit omhoog. */
  const punt = (alt: number, az: number) => {
    const r = ((90 - alt) / 90) * R
    const a = (az - 90) * (Math.PI / 180)
    return [C + r * Math.cos(a), C + r * Math.sin(a)]
  }
  const d = p.baan
    .map((b, i) => `${i === 0 ? 'M' : 'L'}${punt(b.alt, b.az).map(n => n.toFixed(1)).join(' ')}`)
    .join(' ')
  const [sx, sy] = punt(p.baan[0].alt, p.baan[0].az)
  const laatste = p.baan[p.baan.length - 1]
  const [ex, ey] = punt(laatste.alt, laatste.az)

  return (
    <svg className="pl-koepel" viewBox="0 0 240 240" role="img"
         aria-label={`Baan over de hemel: komt op in ${KOMPAS_VOLUIT[compass(p.startAz)]}, `
           + `hoogste punt ${Math.round(p.topAlt)} graden, verdwijnt in ${KOMPAS_VOLUIT[compass(p.eindAz)]}`}>
      <circle cx={C} cy={C} r={R} className="pl-koepel__rand" />
      {[30, 60].map(a => (
        <circle key={a} cx={C} cy={C} r={((90 - a) / 90) * R} className="pl-koepel__ring" />
      ))}
      {[['N', 0], ['O', 90], ['Z', 180], ['W', 270]].map(([l, a]) => {
        const [x, y] = punt(-7, a as number)
        return <text key={l as string} x={x} y={y + 4} textAnchor="middle" className="pl-koepel__as">{l}</text>
      })}

      <path d={d} className="pl-koepel__spoor" />
      <circle cx={sx} cy={sy} r="4.5" className="pl-koepel__op" />
      <circle cx={ex} cy={ey} r="4.5" className="pl-koepel__af" />
    </svg>
  )
}

/* ── Eén regel in de lijst ────────────────────────────────────────────── */
function Rij({ p, onAgenda }: { p: Passage; onAgenda: (p: Passage) => void }) {
  const h = helderheid(p.mag)
  return (
    <li className="pl-iss__rij" data-sterkte={h.sterkte}>
      <span className="pl-iss__wanneer pl-label">{wanneer(p.start)}</span>
      <span className="pl-iss__tijd pl-live pl-num">{klok(p.start)}</span>
      <span className="pl-num pl-iss__duur">{Math.floor(p.duurSec / 60)}m {p.duurSec % 60}s</span>
      <span className="pl-iss__hoogte pl-num">{Math.round(p.topAlt)}°</span>
      <span className="pl-iss__helder">{h.woord}</span>
      <span className="pl-iss__route pl-label">
        {compass16(p.startAz)} → {compass16(p.eindAz)}
      </span>
      <button type="button" className="pl-chip pl-iss__agenda" onClick={() => onAgenda(p)}>
        <Ico.cal size={13} />Agenda
      </button>
    </li>
  )
}

/* ── Het paneel ───────────────────────────────────────────────────────── */
export default function IssOverkomsten({ lat, lon, plaats }: {
  lat: number; lon: number; plaats: string
}) {
  const [tle, setTle] = useState<Tle | null>(null)
  const [staat, setStaat] = useState<'laden' | 'ok' | 'mislukt'>('laden')

  useEffect(() => {
    const ac = new AbortController()
    let leeft = true
    haalTle(ac.signal)
      .then(t => { if (leeft) { setTle(t); setStaat('ok') } })
      .catch(() => { if (leeft) setStaat('mislukt') })
    return () => { leeft = false; ac.abort() }
  }, [])

  const { komend, verder } = useMemo(() => {
    if (!tle) return { komend: [] as Passage[], verder: [] as Passage[] }
    const k = vindPassages(tle, lat, lon, VENSTER)
    /* Pas verder vooruit kijken als er niets is — dat kost rekentijd die je
       niet wilt maken als het antwoord er al staat. */
    return { komend: k, verder: k.length ? [] : vindPassages(tle, lat, lon, VER_VENSTER) }
  }, [tle, lat, lon])

  const naarAgenda = useCallback((p: Passage) => {
    const h = helderheid(p.mag)
    downloadIcs([{
      uid: `iss-${p.start.getTime()}@nightgazer.space`,
      title: `ISS zichtbaar — ${Math.round(p.duurSec / 60)} min, ${h.woord}`,
      description:
        `Het internationale ruimtestation komt over ${plaats}.\n\n`
        + `Komt op in ${KOMPAS_VOLUIT[compass(p.startAz)]} om ${klok(p.start)}, `
        + `staat het hoogst om ${klok(p.top)} op ${Math.round(p.topAlt)}° in ${KOMPAS_VOLUIT[compass(p.topAz)]}, `
        + `en verdwijnt in ${KOMPAS_VOLUIT[compass(p.eindAz)]} om ${klok(p.eind)}.\n\n`
        + (p.dooft
          ? 'Let op: hij dooft halverwege uit in plaats van onder te gaan — dan vliegt hij de aardschaduw in.\n\n'
          : '')
        + 'Geen verrekijker nodig: het ISS ziet eruit als een heldere ster die gestaag doorvliegt, zonder te knipperen.\n\n'
        + 'nightgazer.space/sterrenkijken',
      allDay: false,
      start: new Date(p.start.getTime() - 5 * 60000),
      end: p.eind,
      remindDays: 0,
    }], slugFile(`iss ${klok(p.start)}`), 'ISS-overkomst')
  }, [plaats])

  if (staat === 'laden') {
    return <div className="pl-iss"><div className="pl-skel" style={{ height: 120 }} /></div>
  }
  if (staat === 'mislukt') {
    return (
      <div className="pl-iss pl-iss--leeg">
        <span className="pl-label">ISS-overkomsten</span>
        <p className="pl-body-s">
          De baangegevens zijn nu niet op te halen bij Celestrak. Zonder verse
          baanelementen zou elke tijd hier een gok zijn, en daar sta je niets
          aan in de kou.
        </p>
      </div>
    )
  }

  const eerste = komend[0]

  if (!eerste) {
    const volgende = verder[0]
    return (
      <div className="pl-iss pl-iss--leeg">
        <span className="pl-label">ISS-overkomsten</span>
        <p className="pl-body-s">
          De komende {VENSTER} nachten komt het ISS niet zichtbaar over {plaats}.
          Dat ligt niet aan het weer: hij vliegt wel degelijk over, maar overdag —
          en dan zie je hem niet.
          {volgende
            ? ` De eerstvolgende zichtbare overkomst is ${wanneer(volgende.start)} om ${klok(volgende.start)}.`
            : ' Ook de komende drie weken valt er geen zichtbare overkomst.'}
        </p>
      </div>
    )
  }

  const h = helderheid(eerste.mag)

  return (
    <div className="pl-iss" data-sterkte={h.sterkte}>
      <div className="pl-iss__eerste">
        <div className="pl-iss__tekst">
          <span className="pl-label">Eerstvolgende overkomst</span>
          <p className="pl-iss__zin">
            <b>{wanneer(eerste.start)} om <span className="pl-live">{klok(eerste.start)}</span></b>
            {', '}{duurTekst(eerste.duurSec)}{', '}
            <span className="pl-iss__woord" data-sterkte={h.sterkte}>{h.woord}</span>.
          </p>
          <p className="pl-body-s">
            {compass(eerste.startAz) === compass(eerste.eindAz)
              ? `Hij blijft laag boven ${KOMPAS_VOLUIT[compass(eerste.startAz)]} en schuift daar van `
                + `${compass16(eerste.startAz)} naar ${compass16(eerste.eindAz)}, met ${Math.round(eerste.topAlt)}° als hoogste punt`
              : `Hij komt op in ${KOMPAS_VOLUIT[compass(eerste.startAz)]}, staat om ${klok(eerste.top)} het `
                + `hoogst op ${Math.round(eerste.topAlt)}° in ${KOMPAS_VOLUIT[compass(eerste.topAz)]}`}
            {eerste.dooft
              ? ', en dooft daarna uit terwijl hij nog hoog staat — dan vliegt hij de aardschaduw in.'
              : compass(eerste.startAz) === compass(eerste.eindAz)
                ? '.'
                : `, en verdwijnt in ${KOMPAS_VOLUIT[compass(eerste.eindAz)]}.`}
          </p>
          <p className="pl-body-s pl-iss__hoe">
            Geen verrekijker nodig. Zoek een gestaag doorvliegend licht dat niet knippert —
            vliegtuigen knipperen, het ISS niet.
          </p>

          <div className="pl-iss__knoppen">
            <button type="button" className="pl-btn pl-btn--act" onClick={() => naarAgenda(eerste)}>
              <Ico.cal size={14} />Zet in agenda
            </button>
          </div>
        </div>

        <figure className="pl-iss__koepel">
          <Koepel p={eerste} />
          <figcaption className="pl-label">
            rand = horizon · midden = zenit
          </figcaption>
        </figure>
      </div>

      {komend.length > 1 && (
        <div className="pl-iss__lijst">
          <span className="pl-label">Alle overkomsten de komende {VENSTER} nachten</span>
          <ol>
            {komend.map(p => <Rij key={p.start.getTime()} p={p} onAgenda={naarAgenda} />)}
          </ol>
        </div>
      )}

      {tle && (
        <p className="pl-iss__bron pl-label">
          Baangegevens Celestrak, bijgewerkt{' '}
          {tleEpoch(tle.l1).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          {' · '}tijden gelden voor {plaats}
        </p>
      )}
    </div>
  )
}
