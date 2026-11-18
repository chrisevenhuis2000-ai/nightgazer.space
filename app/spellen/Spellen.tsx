'use client'

/* /spellen: de dagspellen op één plek. Bovenaan wat je vandaag al speelde en
   je week, daaronder het spel van de dag groot en de andere twee ernaast.
   Alles wat de pagina over jou weet, komt uit de localStorage van de spellen
   zelf: geen account, geen punten. Wie dat blokkeert, ziet gewoon de spellen. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { HemelfotoTeaser } from '@/app/_plate/HemelfotoTeaser'
import { SterrenbeeldTeaser } from '@/app/_plate/SpellenBlok'
import { nlDag, puzzelNr } from '@/lib/hemelfoto'
import { dagvraag, reeks, lokaleDag } from '@/lib/educatie-quiz'
import { telGebeurtenis } from '@/lib/tel'

const DAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const SPELLEN = 3

function lees<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}

/** iso-datum n dagen eerder, rekenend op de kalenderdag zelf. */
function dagTerug(iso: string, n: number): string {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) - n))
  return d.toISOString().slice(0, 10)
}

/** Tijd tot middernacht in Nederland, als "5 u 12 min". */
function totMorgen(): string {
  const nl = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }))
  const rest = 24 * 60 - (nl.getHours() * 60 + nl.getMinutes())
  const u = Math.floor(rest / 60), m = rest % 60
  return u > 0 ? `${u} u ${m} min` : `${m} min`
}

type Dag = { iso: string; d: string; n: number; vandaag: boolean; later: boolean }
type Stand = { iso: string; foto: boolean; beeld: boolean; vraag: boolean; week: Dag[]; reeks: number; klok: string }

function leesStand(): Stand {
  const iso = nlDag()
  const fotos = lees<Record<string, { klaar?: boolean }>>('nightgazer_hemelfoto', {})
  const beelden = lees<Record<string, Record<string, { klaar?: boolean }>>>('nightgazer_sterrenbeeld', {})
  const vragen = lees<string[]>('nightgazer_reeks', [])

  const foto = (dag: string) => !!fotos[puzzelNr(dag)]?.klaar
  const beeld = (dag: string) => Object.values(beelden[dag] ?? {}).some(s => s?.klaar)
  const vraag = (dag: string) => vragen.includes(dag)
  const telDag = (dag: string) => +foto(dag) + +beeld(dag) + +vraag(dag)

  /* De week van maandag tot zondag, zoals op /educatie. */
  const wd = (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7
  const week = DAGEN.map((d, i) => {
    const dag = dagTerug(iso, wd - i)
    return { iso: dag, d, n: i <= wd ? telDag(dag) : 0, vandaag: i === wd, later: i > wd }
  })

  /* Reeks: dagen waarop je minstens één spel speelde, vergevingsgezind
     zoals de vraag van de dag (pas twee gemiste dagen breken hem). */
  const gespeeld: string[] = []
  for (let i = 0; i < 60; i++) { const dag = dagTerug(iso, i); if (telDag(dag) > 0) gespeeld.push(dag) }

  return {
    iso, foto: foto(iso), beeld: beeld(iso), vraag: vraag(lokaleDag()),
    week, reeks: reeks(gespeeld, new Date(`${iso}T12:00:00`)), klok: totMorgen(),
  }
}

function Overzicht({ st }: { st: Stand | null }) {
  const n = st ? +st.foto + +st.beeld + +st.vraag : 0
  return (
    <div className="sp-stand">
      <div className="sp-stand__vandaag">
        <p className="pl-label">Vandaag gespeeld</p>
        <p className="sp-stand__n pl-num">{st ? <span className="pl-live">{n}</span> : '–'}<small> / {SPELLEN}</small></p>
        <div className="sp-stappen" aria-hidden="true">
          {[st?.foto, st?.beeld, st?.vraag].map((k, i) => <i key={i} data-k={k ? '1' : '0'} />)}
        </div>
        <p className="pl-body-s">
          {!st ? ' ' : n === SPELLEN ? 'Alles gespeeld. Morgen staan er nieuwe klaar.' : n === 0 ? 'Begin met de hemelfoto, dat kost een paar minuten.' : `Nog ${SPELLEN - n} te gaan vandaag.`}
        </p>
      </div>

      <div className="sp-stand__week">
        <p className="pl-label">Deze week</p>
        <ol className="sp-week" aria-label="Gespeelde spellen per dag deze week">
          {(st?.week ?? DAGEN.map(d => ({ iso: d, d, n: 0, vandaag: false, later: true }))).map(w => (
            <li key={w.iso} data-vandaag={w.vandaag ? '1' : '0'} data-later={w.later ? '1' : '0'}
              aria-label={`${w.d}: ${w.later ? 'nog niet' : `${w.n} van ${SPELLEN}`}`}>
              <span className="sp-week__staaf" aria-hidden="true">
                {Array.from({ length: SPELLEN }, (_, i) => <i key={i} data-k={i < w.n ? '1' : '0'} />)}
              </span>
              <b>{w.d}</b>
            </li>
          ))}
        </ol>
      </div>

      <div className="sp-stand__feit">
        <p className="pl-label">Dagen op rij</p>
        <p className="sp-stand__n pl-num">{st ? <span className="pl-live">{st.reeks}</span> : '–'}</p>
        <p className="pl-body-s">Eén dag overslaan mag.</p>
      </div>

      <div className="sp-stand__feit">
        <p className="pl-label">Nieuwe spellen over</p>
        <p className="sp-stand__klok pl-num">{st ? <span className="pl-live">{st.klok}</span> : '–'}</p>
        <p className="pl-body-s">Om middernacht, Nederlandse tijd.</p>
      </div>
    </div>
  )
}

function VraagTeaser({ klaar }: { klaar: boolean }) {
  const [q, setQ] = useState<{ vraag: string; datum: string } | null>(null)
  useEffect(() => { const v = dagvraag(); setQ({ vraag: v.beg.q, datum: v.datum }) }, [])
  if (!q) return <div className="pl-hft" aria-hidden="true" style={{ minHeight: 140 }} />
  const [, mm, dd] = q.datum.split('-').map(Number)
  return (
    <Link href="/educatie/#vraag-van-de-dag" className="pl-hft" onClick={() => telGebeurtenis('dagvraag-teaser', location.pathname)}>
      <span className="pl-hft__img sp-vraag__img" aria-hidden="true"><span>?</span></span>
      <span className="pl-hft__t">
        <span className="pl-label">Vraag van de dag <span className="pl-num">{dd} {MAANDEN[mm - 1]}</span></span>
        <span className="pl-hft__kop">{q.vraag}</span>
        <span className="pl-body-s">{klaar ? 'Beantwoord. Morgen een nieuwe vraag.' : 'Eén vraag over het nieuws, op jouw niveau.'}</span>
        <span className="pl-hft__cta">{klaar ? 'Bekijk de uitleg' : 'Beantwoord'} <Ico.arrow /></span>
      </span>
    </Link>
  )
}

export default function Spellen() {
  const [st, setSt] = useState<Stand | null>(null)

  useEffect(() => {
    const zet = () => setSt(leesStand())
    zet()
    const t = setInterval(zet, 60_000)
    /* Terug van een spel (vorige-knop of ander tabblad): opnieuw lezen. */
    window.addEventListener('focus', zet)
    window.addEventListener('pageshow', zet)
    return () => { clearInterval(t); window.removeEventListener('focus', zet); window.removeEventListener('pageshow', zet) }
  }, [])

  const datum = st ? `${+st.iso.slice(8, 10)} ${MAANDEN[+st.iso.slice(5, 7) - 1]}` : ''

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={SPELLEN} edition={editionLabel()} current="spellen" totalLabel="spellen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="pl-spellen-kop">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-spellen-kop" className="pl-h1">Spellen</h1>
            </div>
            <p className="pl-label">Spellen van <span className="pl-num">{datum || 'vandaag'}</span></p>
          </div>
          <p className="pl-body" style={{ maxWidth: '60ch' }}>
            Elke dag drie nieuwe, elk een paar minuten: een echte ruimtefoto om te raden, het sterrenbeeld dat vanavond boven Nederland staat om te tekenen, en een vraag over het nieuws.
          </p>
          <Overzicht st={st} />
        </section>

        <section className="pl-wrap" aria-label="Spellen van de dag">
          <div className="sp-hub">
            <div className="sp-hub__groot"><HemelfotoTeaser groot /></div>
            <div className="sp-hub__rest">
              <SterrenbeeldTeaser />
              <VraagTeaser klaar={!!st?.vraag} />
            </div>
          </div>
        </section>

        <section className="pl-wrap" aria-labelledby="sp-zo">
          <h2 id="sp-zo" className="pl-label">Zo werkt het</h2>
          <ul className="sp-regels">
            <li><b>Elke dag nieuw</b><span className="pl-body-s">Om middernacht staan er drie nieuwe spellen klaar. Gemist is gemist, morgen is er weer een.</span></li>
            <li><b>Geen account, geen punten</b><span className="pl-body-s">Je speelt voor jezelf. Geen ranglijst en geen aanmelding.</span></li>
            <li><b>Bewaard in je browser</b><span className="pl-body-s">Je uitslagen en je reeks blijven alleen op dit apparaat staan.</span></li>
          </ul>
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} />
    </div>
  )
}
