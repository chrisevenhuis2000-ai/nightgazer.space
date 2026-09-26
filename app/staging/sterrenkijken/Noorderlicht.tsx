'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Noorderlicht — verwachting en melding

   De opzet: dit paneel schreeuwt niet als er niets is. Bij Kp onder de 4
   krimpt het tot één regel, want een permanent alarmerend kastje dat elke
   dag 'geen kans' roept leert bezoekers het te negeren — en dan missen ze
   de ene avond dat het wél raak is. Vanaf Kp 5 klapt het open.

   Kp komt rechtstreeks van NOAA. De eigen proxy geeft sinds NOAA's
   formaatwijziging null terug, en NOAA staat CORS toe, dus de tussenstap
   voegt hier alleen een extra storingspunt toe.
   ══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  haalKp, laatstGemeten, perNacht, oordeel, afstandTotOvaal, ovaalRand,
  type KpEntry, type Toon,
} from '@/lib/aurora'
import { darkWindow } from '@/lib/sky-chart'
import { Ico } from '../Instruments'

const MELD_KEY = 'nightgazer_poollicht_melding'
/* Elk kwartier opnieuw kijken. NOAA vernieuwt per drie uur, dus vaker
   pollen levert niets op behalve verkeer. */
const HERHAAL = 15 * 60 * 1000

const tijd = (d: Date) => d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
const dag = (d: Date) => d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

/* ── De schaal: waar staan we, en hoe ver is 'ja' nog? ─────────────────── */
function Schaal({ kp, toon }: { kp: number; toon: Toon }) {
  const pct = Math.min(100, (kp / 9) * 100)
  return (
    <div className="pl-kpschaal">
      <div className="pl-kpschaal__spoor" aria-hidden="true">
        {/* De gevulde balk maakt de stand afleesbaar zonder het streepje te
            hoeven zoeken; het streepje zelf blijft de precieze waarde. */}
        <span
          className="pl-kpschaal__vul"
          style={{ transform: `scaleX(${pct / 100})` }}
          data-toon={toon}
        />
        {[4, 5, 6, 7].map(d => (
          <span key={d} className="pl-kpschaal__drempel" style={{ left: `${(d / 9) * 100}%` }}>
            <i />
            <b className="pl-num">{d}</b>
          </span>
        ))}
        <span className="pl-kpschaal__nu pl-live" style={{ left: `${pct}%` }} />
      </div>
      <div className="pl-kpschaal__voet">
        <span className="pl-label">0 · rustig</span>
        <span className="pl-label">9 · zware storm</span>
      </div>
    </div>
  )
}

/* ── Melding zolang de pagina openstaat ───────────────────────────────── */
function Melding({ kp, drempel, onDrempel }: {
  kp: number | null
  drempel: number
  onDrempel: (n: number) => void
}) {
  const [staat, setStaat] = useState<NotificationPermission | 'niet-ondersteund'>('default')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setStaat('niet-ondersteund'); return
    }
    setStaat(Notification.permission)
  }, [])

  const vraag = useCallback(async () => {
    if (!('Notification' in window)) return
    const p = await Notification.requestPermission()
    setStaat(p)
  }, [])

  if (staat === 'niet-ondersteund') return null

  return (
    <div className="pl-meld">
      <div className="pl-meld__kop">
        <span className="pl-label">Waarschuw me</span>
        {staat === 'granted' && kp !== null && (
          <span className="pl-meld__aan">
            <Ico.check size={13} />actief boven Kp {drempel}
          </span>
        )}
      </div>

      <div className="pl-meld__rij">
        <label className="pl-label" htmlFor="pl-drempel">Vanaf Kp</label>
        <div className="pl-seg pl-seg--smal" role="group" aria-label="Kies de drempel">
          {[5, 6, 7].map(n => (
            <button key={n} aria-pressed={drempel === n} onClick={() => onDrempel(n)}>{n}</button>
          ))}
        </div>

        {staat !== 'granted' && (
          <button type="button" className="pl-btn" onClick={vraag}>
            {staat === 'denied' ? 'Geblokkeerd in je browser' : 'Zet melding aan'}
          </button>
        )}
      </div>

      <p className="pl-body-s pl-meld__uitleg">
        {staat === 'granted'
          ? `Je krijgt een melding zodra de Kp boven ${drempel} komt — maar alleen zolang deze pagina openstaat, want NightGazer is een statische site zonder server die je 's nachts kan wekken.`
          : 'De melding werkt alleen zolang deze pagina openstaat. '}
        Wil je ook gewaarschuwd worden met alles dicht, dan stuurt{' '}
        <a href="https://www.swpc.noaa.gov/content/subscribe-alerts" target="_blank" rel="noopener noreferrer">
          NOAA zelf gratis e-mailwaarschuwingen
        </a>{' '}
        bij een geomagnetische storm.
      </p>
    </div>
  )
}

/* ── Het paneel ───────────────────────────────────────────────────────── */
export default function Noorderlicht({ lat, lon, bewolking }: {
  lat: number; lon: number; bewolking: number | null
}) {
  const [entries, setEntries] = useState<KpEntry[] | null>(null)
  const [staat, setStaat] = useState<'laden' | 'ok' | 'mislukt'>('laden')
  const [drempel, setDrempel] = useState(6)
  const gemeld = useRef<number | null>(null)

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(MELD_KEY))
      if (v >= 5 && v <= 7) setDrempel(v)
    } catch { /* voorkeur niet beschikbaar */ }
  }, [])

  const kiesDrempel = useCallback((n: number) => {
    setDrempel(n)
    try { localStorage.setItem(MELD_KEY, String(n)) } catch { /* niet erg */ }
  }, [])

  /* Ophalen, en elk kwartier opnieuw zolang de pagina open is. */
  useEffect(() => {
    const ac = new AbortController()
    let stop = false

    const trek = () => {
      haalKp(ac.signal)
        .then(e => { if (!stop) { setEntries(e); setStaat('ok') } })
        .catch(() => { if (!stop) setStaat(s => (s === 'ok' ? s : 'mislukt')) })
    }
    trek()
    const t = window.setInterval(trek, HERHAAL)
    return () => { stop = true; ac.abort(); window.clearInterval(t) }
  }, [])

  const nu = useMemo(() => (entries ? laatstGemeten(entries) : null), [entries])
  const nachten = useMemo(() => (entries ? perNacht(entries).slice(0, 3) : []), [entries])
  const venster = useMemo(() => darkWindow(lat, lon, new Date()), [lat, lon])

  /* De melding zelf. Eén keer per drempeloverschrijding, niet elk kwartier. */
  useEffect(() => {
    if (!nu || typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (nu.kp < drempel) { gemeld.current = null; return }
    if (gemeld.current === nu.tijd.getTime()) return
    gemeld.current = nu.tijd.getTime()
    const o = oordeel(nu.kp)
    new Notification(`Poollicht: Kp ${nu.kp.toFixed(1)}`, {
      body: `${o.kort}. ${o.uitleg}`,
      tag: 'nightgazer-poollicht',
    })
  }, [nu, drempel])

  if (staat === 'laden') {
    return <div className="pl-aurora pl-aurora--laden"><div className="pl-skel" style={{ height: 54 }} /></div>
  }

  if (staat === 'mislukt' || !nu) {
    return (
      <div className="pl-aurora pl-aurora--stil">
        <span className="pl-label">Poollicht</span>
        <p className="pl-body-s">
          De Kp-index is nu niet op te halen bij NOAA. Liever niets dan een getal
          dat er alleen maar uitziet als data.
        </p>
      </div>
    )
  }

  const o = oordeel(nu.kp)
  const hoogste = nachten.length ? Math.max(...nachten.map(n => n.kp)) : nu.kp
  const komt = oordeel(hoogste)
  /* Stil blijven mag alleen als er ook de komende nachten niets aankomt. */
  const stil: boolean = o.toon === 'rust' && komt.toon === 'rust'
  const afstand = afstandTotOvaal(nu.kp)

  if (stil) {
    return (
      <div className="pl-aurora pl-aurora--stil" data-toon="rust">
        <div className="pl-aurora__regel">
          <span className="pl-label">Poollicht</span>
          <span className="pl-aurora__kp pl-live pl-num">Kp {nu.kp.toFixed(1)}</span>
          <span className="pl-aurora__kort">{o.kort}</span>
          <span className="pl-aurora__rest pl-label">
            de ovaal ligt {afstand} km ten noorden van Groningen · ook de komende drie nachten niets
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="pl-aurora" data-toon={o.toon}>
      <div className="pl-aurora__kop">
        <div className="pl-aurora__nu">
          <span className="pl-label">Poollicht · Noord-Nederland</span>
          <p className="pl-aurora__groot">
            <span className="pl-live pl-num">Kp {nu.kp.toFixed(1)}</span>
            <span className="pl-aurora__oordeel" data-toon={o.toon}>{o.kort}</span>
          </p>
          <p className="pl-meta">
            <span>gemeten {tijd(nu.tijd)}</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span>NOAA SWPC</span>
          </p>
        </div>
        {o.toon === 'alarm' && <span className="pl-dot" aria-hidden="true" />}
      </div>

      <p className="pl-body-s pl-aurora__uitleg">{o.uitleg}</p>

      <Schaal kp={nu.kp} toon={o.toon} />

      <p className="pl-body-s pl-aurora__ovaal">
        De rand van de poollichtovaal staat nu op {ovaalRand(nu.kp).toFixed(1)}° geomagnetische
        breedte
        {afstand > 0
          ? `, zo'n ${afstand} km ten noorden van Groningen.`
          : `, ${Math.abs(afstand)} km ten zuiden van Groningen — de ovaal ligt over ons heen.`}
      </p>

      <div className="pl-aurora__nachten">
        <span className="pl-label">De komende nachten</span>
        <ol>
          {nachten.map(n => {
            const no = oordeel(n.kp)
            return (
              <li key={n.nacht.toISOString()} data-toon={no.toon}>
                <span className="pl-label">{dag(n.nacht)}</span>
                <span className="pl-num pl-aurora__nkp">Kp {n.kp.toFixed(1)}</span>
                <span className="pl-aurora__nwoord">{no.kort}</span>
                {n.voorspeld && <span className="pl-label pl-aurora__schat">verwachting</span>}
              </li>
            )
          })}
        </ol>
      </div>

      <div className="pl-aurora__check">
        <span className="pl-label">Lukt het vannacht?</span>
        <ul>
          <li data-ok={venster ? '1' : '0'}>
            {venster
              ? `Donker van ${tijd(venster.from)} tot ${tijd(venster.to)}.`
              : 'Het wordt vannacht niet donker genoeg — rond midzomer blijft de hemel hier te licht.'}
          </li>
          <li data-ok={bewolking === null ? '-' : bewolking <= 40 ? '1' : '0'}>
            {bewolking === null
              ? 'Bewolking onbekend.'
              : `${bewolking}% bewolking vannacht${bewolking > 40 ? ' — je hebt vooral een vrije noordhorizon nodig.' : '.'}`}
          </li>
          <li data-ok="-">
            Kijk naar het noorden, weg van stadslicht. De Waddenkust en het Lauwersmeer
            hebben de donkerste noordhorizon van het land.
          </li>
        </ul>
      </div>

      <Melding kp={nu.kp} drempel={drempel} onDrempel={kiesDrempel} />
    </div>
  )
}
