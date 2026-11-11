'use client'

/* ══════════════════════════════════════════════════════════════════════════
   30 nachten omhoog — /omhoog

   De campagnepagina van 16 november tot 15 december 2026: elke avond één ding
   om te zien, van de Leoniden tot de Geminiden. Bovenaan "vanavond", daaronder
   alle dertig nachten om af te vinken, en aan het eind "Tel de Geminiden".

   Afvinken bewaart alleen in de eigen browser (localStorage, met try/catch,
   want in de Instagram-browser of een privévenster kan het ontbreken). De
   telling gaat naar de worker (cf-worker/geminiden.mjs). De afvinkkaart is
   een printversie van dezelfde lijst: in print verdwijnt de rest van de
   pagina en blijft een zwart-wit A4 over.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { PROXY } from '@/lib/home-content'
import { telGebeurtenis } from '@/lib/tel'
import {
  NACHTEN, HULPMIDDEL, OMHOOG_START, OMHOOG_EINDE, PROVINCIES, HEMEL, TEL_OPEN, TEL_DICHT, type Nacht,
} from '@/lib/omhoog'

const OPSLAG = 'omhoog-gezien'
const DAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function vandaagNL(d = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(d)
}

function kortDatum(iso: string) {
  const [y, m, dag] = iso.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, dag)).getUTCDay()
  return `${DAGEN[wd]} ${dag} ${MAANDEN[m - 1]}`
}

function leesGezien(): string[] {
  try { return JSON.parse(localStorage.getItem(OPSLAG) || '[]').filter((x: unknown) => typeof x === 'string') } catch { return [] }
}
function bewaarGezien(l: string[]) {
  try { localStorage.setItem(OPSLAG, JSON.stringify(l)) } catch { /* geen opslag: dan alleen deze sessie */ }
}

function NachtKaart({ n, nr, gezien, vandaag, wissel }: {
  n: Nacht; nr: number; gezien: boolean; vandaag: boolean; wissel: () => void
}) {
  return (
    <li className="pl-om__nacht" data-vandaag={vandaag || undefined} data-gezien={gezien || undefined} id={`nacht-${n.datum}`}>
      <div className="pl-om__kop">
        <span className="pl-label pl-label--stamp pl-num">{String(nr).padStart(2, '0')} · {kortDatum(n.datum)}{n.ochtend ? ' · ochtend' : ''}</span>
        {vandaag && <span className="pl-label pl-om__nu">Vanavond</span>}
      </div>
      <h3 className="pl-om__t">{n.titel}</h3>
      <p className="pl-body-s pl-om__tekst">{n.tekst}</p>
      <p className="pl-om__waar"><span className="pl-label">{HULPMIDDEL[n.met]}</span> <span className="pl-body-s">{n.wanneer}</span></p>
      <div className="pl-om__voet">
        {n.link && (
          n.link.href.startsWith('#')
            ? <a href={n.link.href} className="pl-voorw__a pl-body-s">{n.link.tekst}</a>
            : <Link href={n.link.href} className="pl-voorw__a pl-body-s">{n.link.tekst}</Link>
        )}
        <button type="button" className="pl-btn pl-om__vink" aria-pressed={gezien} onClick={wissel}>
          {gezien ? 'Gezien ✓' : 'Gezien?'}
        </button>
      </div>
    </li>
  )
}

interface Uitslag {
  tellingen: number; meteoren: number; minuten: number; perUur: number; perUurHelder: number
  provincies: { naam: string; tellingen: number; meteoren: number; perUur: number }[]
}

function TelMee({ nu }: { nu: number }) {
  const open = nu >= Date.parse(TEL_OPEN) && nu <= Date.parse(TEL_DICHT)
  const begonnen = nu >= Date.parse(TEL_OPEN)
  const [uitslag, setUitslag] = useState<Uitslag | null>(null)
  const [staat, setStaat] = useState<'' | 'bezig' | 'klaar'>('')
  const [fout, setFout] = useState('')
  const [v, setV] = useState({ provincie: '', hemel: 'Helder', aantal: '', minuten: '60', uur: '22' })

  useEffect(() => {
    if (!begonnen) return
    let weg = false
    const haal = () => fetch(`${PROXY}/geminiden`).then(r => r.json()).then(d => { if (!weg) setUitslag(d) }).catch(() => {})
    haal()
    const t = setInterval(haal, 120_000)
    return () => { weg = true; clearInterval(t) }
  }, [begonnen])

  async function verstuur(e: React.FormEvent) {
    e.preventDefault()
    setFout('')
    setStaat('bezig')
    try {
      const r = await fetch(`${PROXY}/geminiden`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ ...v, aantal: Number(v.aantal), minuten: Number(v.minuten), uur: Number(v.uur) }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setFout(d.fout || 'Versturen lukte niet. Probeer het zo nog eens.'); setStaat(''); return }
      telGebeurtenis('geminiden-telling', v.provincie)
      setStaat('klaar')
      fetch(`${PROXY}/geminiden`).then(x => x.json()).then(setUitslag).catch(() => {})
    } catch {
      setFout('Geen verbinding. Probeer het zo nog eens.')
      setStaat('')
    }
  }

  const uren = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6]

  return (
    <section className="pl-wrap" id="tel-mee" aria-labelledby="pl-om-tel">
      <div className="pl-plate pl-om__tel">
        <div className="pl-om__tel-tekst">
          <span className="pl-label pl-label--stamp">Nacht van zo 13 op ma 14 december</span>
          <h2 id="pl-om-tel" className="pl-h2">Tel de Geminiden</h2>
          <p className="pl-body">
            Ga zitten of liggen, kijk een vaste tijd omhoog en tel elke vallende ster. Daarna vul je hier
            in hoeveel je er zag. Samen maken we zo een beeld van de Geminiden boven Nederland. Je hoeft je
            nergens voor aan te melden, en we bewaren geen naam of adres.
          </p>
          <ol className="pl-om__stappen pl-body-s">
            <li>Kies een plek zonder lampen in je blikveld en laat je ogen 20 minuten wennen.</li>
            <li>Kijk minstens 10 minuten, liefst een uur, ongeveer naar het zuidoosten en hoog.</li>
            <li>Tel elke meteoor, ook de zwakke. Bewolking? Vul dat in, dan weegt je telling eerlijk mee.</li>
          </ol>
        </div>

        {open && staat !== 'klaar' && (
          <form className="pl-om__form" onSubmit={verstuur}>
            <label className="pl-field">
              <span className="pl-label">Waar keek je?</span>
              <select className="pl-field-in" required value={v.provincie} onChange={e => setV({ ...v, provincie: e.target.value })}>
                <option value="" disabled>Kies je provincie</option>
                {PROVINCIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="pl-field">
              <span className="pl-label">Hoeveel meteoren zag je?</span>
              <input className="pl-field-in" type="number" inputMode="numeric" min={0} max={500} required
                     value={v.aantal} onChange={e => setV({ ...v, aantal: e.target.value })} />
            </label>
            <div className="pl-om__rij">
              <label className="pl-field">
                <span className="pl-label">Hoe lang?</span>
                <select className="pl-field-in" value={v.minuten} onChange={e => setV({ ...v, minuten: e.target.value })}>
                  {[10, 15, 20, 30, 45, 60, 90, 120, 180].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </label>
              <label className="pl-field">
                <span className="pl-label">Begonnen om</span>
                <select className="pl-field-in" value={v.uur} onChange={e => setV({ ...v, uur: e.target.value })}>
                  {uren.map(u => <option key={u} value={u}>{String(u).padStart(2, '0')}:00</option>)}
                </select>
              </label>
            </div>
            <fieldset className="pl-field pl-om__hemel">
              <legend className="pl-label">Hoe helder was het?</legend>
              <div>
                {HEMEL.map(h => (
                  <label key={h} className="pl-body-s">
                    <input type="radio" name="hemel" value={h} checked={v.hemel === h} onChange={() => setV({ ...v, hemel: h })} /> {h}
                  </label>
                ))}
              </div>
            </fieldset>
            {fout && <p className="pl-body-s pl-om__fout" role="alert">{fout}</p>}
            <button type="submit" className="pl-cta__primary" disabled={staat === 'bezig'}>
              {staat === 'bezig' ? 'Versturen…' : 'Stuur mijn telling'} <Ico.arrow />
            </button>
          </form>
        )}

        {staat === 'klaar' && (
          <p className="pl-body pl-om__dank" role="status">Dank je! Je telling is binnen. Hieronder zie je het totaal van iedereen.</p>
        )}

        {!begonnen && (
          <p className="pl-body pl-om__binnenkort">
            Het formulier opent op zondag 13 december om 18:00. Zet het alvast in je agenda, en kijk de dag
            ervoor even naar de weersverwachting.
          </p>
        )}

        {begonnen && uitslag && (
          <div className="pl-om__uitslag" aria-live="polite">
            <dl className="pl-hk__spec">
              <div><dt className="pl-label">Tellingen</dt><dd>{uitslag.tellingen}</dd></div>
              <div><dt className="pl-label">Meteoren</dt><dd>{uitslag.meteoren}</dd></div>
              <div><dt className="pl-label">Per uur, gemiddeld</dt><dd>{uitslag.perUur.toLocaleString('nl-NL')}</dd></div>
              {uitslag.perUurHelder > 0 && <div><dt className="pl-label">Per uur bij heldere hemel</dt><dd>{uitslag.perUurHelder.toLocaleString('nl-NL')}</dd></div>}
            </dl>
            {uitslag.provincies.length > 0 && (
              <ul className="pl-om__prov">
                {uitslag.provincies.map(p => (
                  <li key={p.naam} className="pl-body-s">
                    <span>{p.naam}</span>
                    <span className="pl-num">{p.meteoren} in {p.tellingen} {p.tellingen === 1 ? 'telling' : 'tellingen'} · {p.perUur.toLocaleString('nl-NL')}/uur</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default function Omhoog() {
  const [vandaag, setVandaag] = useState(OMHOOG_START)
  const [nu, setNu] = useState(0)
  const [gezien, setGezien] = useState<string[]>([])
  const [gedeeld, setGedeeld] = useState(false)

  useEffect(() => {
    setVandaag(vandaagNL())
    setNu(Date.now())
    setGezien(leesGezien())
  }, [])

  const i = NACHTEN.findIndex(n => n.datum === vandaag)
  const voor = vandaag < OMHOOG_START
  const na = vandaag > OMHOOG_EINDE
  const uitgelicht = i >= 0 ? NACHTEN[i] : voor ? NACHTEN[0] : null

  function wissel(datum: string) {
    const aan = !gezien.includes(datum)
    const nieuw = aan ? [...gezien, datum] : gezien.filter(d => d !== datum)
    setGezien(nieuw)
    bewaarGezien(nieuw)
    if (aan) telGebeurtenis('omhoog-vink', datum)
  }

  async function deel() {
    const url = 'https://nightgazer.space/omhoog/?utm_source=deel'
    const tekst = '30 nachten omhoog: van de Leoniden tot de Geminiden elke avond iets om te zien boven Nederland.'
    telGebeurtenis('omhoog-deel')
    try {
      if (navigator.share) { await navigator.share({ title: '30 nachten omhoog', text: tekst, url }); return }
      await navigator.clipboard.writeText(`${tekst} ${url}`)
      setGedeeld(true)
    } catch { /* geannuleerd */ }
  }

  function print() {
    telGebeurtenis('omhoog-print')
    window.print()
  }

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={NACHTEN.length} edition={editionLabel()} current="sterrenkijken" totalLabel="nachten" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        {/* ══ Kop ══ */}
        <section className="pl-wrap" aria-labelledby="pl-om">
          <div className="pl-uhero pl-hk__kop">
            <div className="pl-uhero__in pl-om__in">
              <div className="pl-hk__tekst">
                <span className="pl-label pl-label--stamp">16 november – 15 december 2026</span>
                <h1 id="pl-om" className="pl-h1">30 nachten omhoog</h1>
                <p className="pl-uhero__lede">
                  Van de Leoniden tot de Geminiden: elke avond één ding om te zien boven Nederland. Bijna
                  alles lukt met het blote oog of een verrekijker, ook vanuit je tuin. Vink af wat je zag
                  en tel op 13 december mee met de Geminiden.
                </p>
                <div className="pl-om__knoppen">
                  <button type="button" className="pl-cta__primary" onClick={print}>Print de afvinkkaart <Ico.arrow /></button>
                  <button type="button" className="pl-btn" onClick={deel}>{gedeeld ? 'Link gekopieerd' : 'Deel de uitdaging'}</button>
                </div>
                <p className="pl-body-s">
                  {gezien.length} van de {NACHTEN.length} nachten gezien.{' '}
                  <a href="/omhoog/30-nachten-omhoog.pdf" className="pl-voorw__a" download onClick={() => telGebeurtenis('omhoog-print', 'pdf')}>Afvinkkaart als pdf</a>
                </p>
              </div>

              {uitgelicht ? (
                <div className="pl-plate pl-om__vanavond">
                  <span className="pl-label pl-label--stamp">{voor ? 'Het begint op' : 'Vanavond'} · {kortDatum(uitgelicht.datum)}</span>
                  <h2 className="pl-h3">{uitgelicht.titel}</h2>
                  <p className="pl-body-s">{uitgelicht.tekst}</p>
                  <p className="pl-om__waar"><span className="pl-label">{HULPMIDDEL[uitgelicht.met]}</span> <span className="pl-body-s">{uitgelicht.wanneer}</span></p>
                  <a href={`#nacht-${uitgelicht.datum}`} className="pl-voorw__a pl-body-s">Naar de lijst</a>
                </div>
              ) : na ? (
                <div className="pl-plate pl-om__vanavond">
                  <span className="pl-label pl-label--stamp">Afgelopen</span>
                  <h2 className="pl-h3">Bedankt voor het kijken</h2>
                  <p className="pl-body-s">De dertig nachten zijn voorbij. Wat er vanavond te zien is, staat elke dag op Sterrenkijken.</p>
                  <Link href="/sterrenkijken/" className="pl-voorw__a pl-body-s">Naar Sterrenkijken</Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ══ Dertig nachten ══ */}
        <section className="pl-wrap" aria-labelledby="pl-om-lijst">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-om-lijst" className="pl-h2">Alle dertig nachten</h2>
              <span className="pl-label">Tijden voor het midden van Nederland</span>
            </div>
          </div>
          <ol className="pl-om__lijst">
            {NACHTEN.map((n, k) => (
              <NachtKaart key={n.datum} n={n} nr={k + 1} vandaag={k === i}
                          gezien={gezien.includes(n.datum)} wissel={() => wissel(n.datum)} />
            ))}
          </ol>
        </section>

        {/* ══ Bewolkt ══ */}
        <section className="pl-wrap" aria-label="Als het bewolkt is">
          <div className="pl-plate pl-uitr-ref pl-om__bewolkt">
            <div>
              <span className="pl-label">Bewolkt?</span>
              <p className="pl-body">
                In november en december is het vaak grijs. Sla die avond gewoon over, of speel het spel van de
                dag: raad de hemelfoto of teken het sterrenbeeld van vannacht.
              </p>
            </div>
            <div className="pl-om__knoppen">
              <Link href="/spellen/hemelfoto/" className="pl-btn">Raad de hemelfoto</Link>
              <Link href="/spellen/sterrenbeeld/" className="pl-btn">Teken het sterrenbeeld</Link>
            </div>
          </div>
        </section>

        <TelMee nu={nu} />
      </main>

      {/* ══ Afvinkkaart: alleen in print ══ */}
      <div className="pl-om-print" aria-hidden="true">
        <h1>30 nachten omhoog</h1>
        <p>Van de Leoniden tot de Geminiden · 16 november – 15 december 2026 · nightgazer.space/omhoog</p>
        <table>
          <tbody>
            {NACHTEN.map((n, k) => (
              <tr key={n.datum}>
                <td className="vak">☐</td>
                <td className="nr">{k + 1}</td>
                <td className="dag">{kortDatum(n.datum)}</td>
                <td><strong>{n.titel}</strong> · {n.wanneer} · {HULPMIDDEL[n.met].toLowerCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Geminidennacht zo 13 op ma 14 december: tel mee op nightgazer.space/omhoog</p>
      </div>

      <SiteFooter cols={FOOTER_COLS} />
    </div>
  )
}
