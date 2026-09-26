'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Meldingen

   De service worker wordt pas geregistreerd als iemand meldingen áánzet.
   Een bezoeker die dit nooit gebruikt krijgt dus geen achtergrondproces dat
   hij niet gevraagd heeft.

   De ISS-overkomsten gaan als kant-en-klare wekkers mee naar de server. De
   baanberekening staat al in de browser en is daar nagemeten; hem ook in de
   worker bouwen zou betekenen dat dezelfde som op twee plekken kan afwijken.
   ══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SEINEN, pushMogelijk, serverSleutel, huidigAbonnement, abonneer, zegOp,
  type Sein, type Wekker,
} from '@/lib/push'
import { haalTle, vindPassages, helderheid } from '@/lib/iss'
import { compass, KOMPAS_VOLUIT } from '@/lib/sky-chart'
import { Ico } from '../Instruments'

const KEUZE_KEY = 'nightgazer_meldingen'

type Staat = 'kijken' | 'kan-niet' | 'niet-ingericht' | 'uit' | 'aan' | 'geweigerd'

export default function Meldingen({ lat, lon, plaats }: {
  lat: number; lon: number; plaats: string
}) {
  const [staat, setStaat] = useState<Staat>('kijken')
  const [sleutel, setSleutel] = useState<string | null>(null)
  const [gekozen, setGekozen] = useState<Sein[]>(['helder', 'noorderlicht', 'iss'])
  const [kpDrempel, setKpDrempel] = useState(6)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  useEffect(() => {
    let leeft = true
    const ac = new AbortController()

    ;(async () => {
      try {
        const raw = localStorage.getItem(KEUZE_KEY)
        if (raw) {
          const k = JSON.parse(raw)
          if (Array.isArray(k?.seinen)) setGekozen(k.seinen)
          if (typeof k?.kpDrempel === 'number') setKpDrempel(k.kpDrempel)
        }
      } catch { /* voorkeuren niet beschikbaar */ }

      if (!pushMogelijk()) { if (leeft) setStaat('kan-niet'); return }

      const k = await serverSleutel(ac.signal)
      if (!leeft) return
      if (!k) { setStaat('niet-ingericht'); return }
      setSleutel(k)

      if (Notification.permission === 'denied') { setStaat('geweigerd'); return }
      const sub = await huidigAbonnement()
      if (!leeft) return
      setStaat(sub && Notification.permission === 'granted' ? 'aan' : 'uit')
    })()

    return () => { leeft = false; ac.abort() }
  }, [])

  const bewaar = useCallback((seinen: Sein[], drempel: number) => {
    try { localStorage.setItem(KEUZE_KEY, JSON.stringify({ seinen, kpDrempel: drempel })) }
    catch { /* niet erg */ }
  }, [])

  /** De ISS-overkomsten als wekkers: een kwartier van tevoren. */
  const maakWekkers = useCallback(async (): Promise<Wekker[]> => {
    if (!gekozen.includes('iss')) return []
    try {
      const tle = await haalTle()
      return vindPassages(tle, lat, lon, 5).map(p => {
        const h = helderheid(p.mag)
        return {
          t: p.start.getTime() - 15 * 60000,
          soort: 'iss' as const,
          titel: `ISS over ${plaats} om ${p.start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`,
          tekst: `Over een kwartier, ${Math.round(p.duurSec / 60)} minuten lang, ${h.woord}. `
            + `Komt op in ${KOMPAS_VOLUIT[compass(p.startAz)]}.`,
          url: '/sterrenkijken/',
        }
      })
    } catch {
      return []
    }
  }, [gekozen, lat, lon, plaats])

  const zetAan = useCallback(async () => {
    if (!sleutel) return
    setBezig(true); setFout(null)
    try {
      const toestemming = await Notification.requestPermission()
      if (toestemming !== 'granted') {
        setStaat(toestemming === 'denied' ? 'geweigerd' : 'uit')
        return
      }
      const wekkers = await maakWekkers()
      await abonneer({ seinen: gekozen, lat, lon, plaats, kpDrempel }, wekkers, sleutel)
      bewaar(gekozen, kpDrempel)
      setStaat('aan')
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'aanmelden mislukt')
    } finally {
      setBezig(false)
    }
  }, [sleutel, gekozen, kpDrempel, lat, lon, plaats, maakWekkers, bewaar])

  /* Bij een wijziging terwijl het aanstaat: meteen doorgeven, anders denkt
     de bezoeker dat hij iets heeft uitgezet wat nog gewoon binnenkomt. */
  const wijzig = useCallback(async (seinen: Sein[], drempel: number) => {
    setGekozen(seinen); setKpDrempel(drempel); bewaar(seinen, drempel)
    if (staat !== 'aan' || !sleutel) return
    try {
      const wekkers = seinen.includes('iss') ? await maakWekkers() : []
      await abonneer({ seinen, lat, lon, plaats, kpDrempel: drempel }, wekkers, sleutel)
    } catch { /* volgende poging opnieuw */ }
  }, [staat, sleutel, lat, lon, plaats, maakWekkers, bewaar])

  const zetUit = useCallback(async () => {
    setBezig(true)
    try { await zegOp(); setStaat('uit') } finally { setBezig(false) }
  }, [])

  const uitleg = useMemo(() => {
    switch (staat) {
      case 'kan-niet':
        return 'Deze browser kan geen meldingen op de achtergrond tonen. '
          + 'Op een iPhone lukt het alleen als je NightGazer eerst aan je beginscherm toevoegt.'
      case 'niet-ingericht':
        return 'De meldingsdienst staat nog niet aan op de server. Zodra dat gebeurt verschijnt hier een knop.'
      case 'geweigerd':
        return 'Je hebt meldingen voor deze site geblokkeerd. Dat kun je terugdraaien via het slotje in de adresbalk.'
      default:
        return null
    }
  }, [staat])

  return (
    <div className="pl-meldk" data-staat={staat}>
      <div className="pl-meldk__kop">
        <div>
          <span className="pl-label">Waarschuw me</span>
          <p className="pl-meldk__zin">
            Een melding op je telefoon als er iets te zien is — ook als deze
            pagina dicht is.
          </p>
        </div>
        {staat === 'aan' && (
          <span className="pl-meldk__aan">
            <Ico.check size={13} />staat aan
          </span>
        )}
      </div>

      <ul className="pl-meldk__lijst">
        {SEINEN.map(s => {
          const aan = gekozen.includes(s.id)
          const bruikbaar = staat === 'uit' || staat === 'aan'
          return (
            <li key={s.id}>
              <button
                type="button"
                className="pl-meldk__sein"
                aria-pressed={aan}
                disabled={!bruikbaar}
                onClick={() => wijzig(
                  aan ? gekozen.filter(x => x !== s.id) : [...gekozen, s.id],
                  kpDrempel,
                )}
              >
                <span className="pl-meldk__vink" aria-hidden="true">{aan ? <Ico.check size={13} /> : null}</span>
                <span>
                  <span className="pl-meldk__naam">{s.naam}</span>
                  <span className="pl-body-s">{s.uitleg}</span>
                </span>
              </button>

              {s.id === 'noorderlicht' && aan && (
                <div className="pl-meldk__drempel">
                  <span className="pl-label">vanaf Kp</span>
                  <div className="pl-seg pl-seg--smal" role="group" aria-label="Drempel voor noorderlicht">
                    {[5, 6, 7].map(n => (
                      <button
                        key={n}
                        aria-pressed={kpDrempel === n}
                        disabled={!bruikbaar}
                        onClick={() => wijzig(gekozen, n)}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {uitleg && <p className="pl-body-s pl-meldk__uitleg">{uitleg}</p>}
      {fout && <p className="pl-body-s pl-meldk__fout">Er ging iets mis: {fout}</p>}

      <div className="pl-meldk__voet">
        {staat === 'uit' && (
          <button type="button" className="pl-btn pl-btn--act" onClick={zetAan} disabled={bezig || gekozen.length === 0}>
            {bezig ? 'Bezig…' : 'Zet meldingen aan'}
          </button>
        )}
        {staat === 'aan' && (
          <button type="button" className="pl-btn" onClick={zetUit} disabled={bezig}>
            {bezig ? 'Bezig…' : 'Zet meldingen uit'}
          </button>
        )}
        {staat === 'kijken' && <span className="pl-label">even kijken…</span>}

        <span className="pl-label pl-meldk__plaats">
          {staat === 'aan' || staat === 'uit' ? `gebaseerd op ${plaats}` : ''}
        </span>
      </div>
    </div>
  )
}
