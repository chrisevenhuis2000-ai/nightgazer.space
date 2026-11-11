'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Raad de hemelfoto — de dagpuzzel

   Eén echt NASA/ESA-beeld per dag, ver ingezoomd. Elke foute gok zoomt
   verder uit en vertelt of het antwoord dezelfde soort is en of het verder
   weg of dichterbij staat. Na zes pogingen, of bij de goede, zie je de hele
   foto met uitleg, hoe je het zelf ziet en een artikel uit het archief.

   Net als de vraag van de dag: geen punten, geen ranglijst (er zijn geen
   accounts). Wat je speelde blijft in localStorage; wie dat blokkeert, kan
   gewoon spelen, alleen zonder geheugen.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel, img } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import type { Article } from '@/lib/home-content'
import { telGebeurtenis } from '@/lib/tel'
import {
  ALLE, POGINGEN, fotoVan, puzzelNr, puzzelDatum, nlDag, richting, zoomVoor,
  zoekKandidaten, verwerkGok, deelTekst, type Stand, type Kandidaat, type Hemelfoto,
} from '@/lib/hemelfoto'

const STORE = 'nightgazer_hemelfoto'
const LEEG: Stand = { gokken: [], klaar: false, goed: false }
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const URL_SPEL = 'https://nightgazer.space/spellen/hemelfoto/'

type Archief = Record<string, Stand>

function leesArchief(): Archief {
  try { const raw = localStorage.getItem(STORE); return raw ? JSON.parse(raw) as Archief : {} } catch { return {} }
}
function schrijfArchief(a: Archief) {
  try { localStorage.setItem(STORE, JSON.stringify(a)) } catch { /* spelen kan ook zonder geheugen */ }
}

const datumKort = (iso: string) => `${+iso.slice(8, 10)} ${MAANDEN[+iso.slice(5, 7) - 1]}`

export const fotoUrl = (f: Pick<Hemelfoto, 'nasaId' | 'variant'>, w: number) =>
  img(`https://images-assets.nasa.gov/image/${f.nasaId}/${f.nasaId}~${f.variant}.jpg`, w)

/** Tijd tot middernacht in Nederland, als "5 u 12 min". */
function totMorgen(): string {
  const nu = new Date()
  const nl = new Date(nu.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }))
  const rest = (24 * 60) - (nl.getHours() * 60 + nl.getMinutes())
  const u = Math.floor(rest / 60), m = rest % 60
  return u > 0 ? `${u} u ${m} min` : `${m} min`
}

function Artikelen({ foto, onKlik }: { foto: Hemelfoto; onKlik: () => void }) {
  const [lijst, setLijst] = useState<Article[] | null>(null)
  useEffect(() => {
    let weg = false
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => {
        if (weg || !Array.isArray(data)) return
        const woorden = foto.zoek.map(w => w.toLowerCase())
        const raak = (a: Article) => {
          const t = `${a.title} ${a.excerpt ?? ''}`.toLowerCase()
          return woorden.some(w => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t))
        }
        setLijst(data.filter(raak).sort((a, b) => (b.publishedAt ?? b.date).localeCompare(a.publishedAt ?? a.date)).slice(0, 3))
      })
      .catch(() => { if (!weg) setLijst([]) })
    return () => { weg = true }
  }, [foto])

  return (
    <div className="pl-hf__verder">
      <p className="pl-label">Lees verder</p>
      {lijst === null && <div className="pl-skel" style={{ height: 64 }} />}
      {lijst && lijst.length > 0 && (
        <ul className="pl-hf__art">
          {lijst.map(a => (
            <li key={a.slug}>
              <Link href={`/nieuws/${a.slug}/`} onClick={onKlik}>
                <span className="pl-hf__art-t">{a.title}</span>
                <span className="pl-label pl-num">{a.readTime} min</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href={foto.verder.href} className="pl-read" onClick={onKlik}>
        <span>{foto.verder.label}</span>
        <span className="pl-read__rule" aria-hidden="true" />
        <Ico.arrow />
      </Link>
    </div>
  )
}

export default function Hemelfoto() {
  const vandaag = useMemo(() => puzzelNr(nlDag()), [])
  const [nr, setNr] = useState(vandaag)
  const [archief, setArchief] = useState<Archief>({})
  const [geladen, setGeladen] = useState(false)
  const [tekst, setTekst] = useState('')
  const [open, setOpen] = useState(false)
  const [gedeeld, setGedeeld] = useState<'' | 'gedeeld' | 'gekopieerd'>('')
  const [beeldFout, setBeeldFout] = useState(false)
  const invoer = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setArchief(leesArchief())
    /* ?nr=5 opent een eerdere puzzel; nooit een toekomstige. */
    try {
      const n = Number(new URLSearchParams(location.search).get('nr'))
      if (Number.isInteger(n) && n >= 1 && n < vandaag) setNr(n)
    } catch { /* geen parameter */ }
    setGeladen(true)
  }, [vandaag])

  const foto = fotoVan(nr)
  const stand = archief[nr] ?? LEEG
  const fout = stand.gokken.filter(g => g !== foto.id).length
  const zoom = stand.klaar ? 1 : zoomVoor(fout)
  const over = POGINGEN - stand.gokken.length
  const opties = useMemo(() => {
    const lijst = zoekKandidaten(tekst, stand.gokken)
    return tekst.trim() ? lijst.slice(0, 8) : lijst
  }, [tekst, stand.gokken])

  useEffect(() => { setBeeldFout(false); setGedeeld(''); setTekst('') }, [nr])

  function gok(k: Kandidaat) {
    if (stand.klaar) return
    const nieuw = verwerkGok(stand, k.id, foto.id)
    if (nieuw === stand) return
    if (stand.gokken.length === 0) telGebeurtenis('hemelfoto-start', String(nr))
    if (nieuw.klaar) telGebeurtenis('hemelfoto-klaar', nieuw.goed ? `${nieuw.gokken.length}/${POGINGEN}` : `X/${POGINGEN}`)
    const a = { ...archief, [nr]: nieuw }
    setArchief(a)
    schrijfArchief(a)
    setTekst('')
    setOpen(false)
    if (!nieuw.klaar) invoer.current?.focus()
  }

  async function deel() {
    const t = deelTekst(nr, stand, foto, nr === vandaag ? URL_SPEL : `${URL_SPEL}?nr=${nr}`)
    telGebeurtenis('hemelfoto-deel', String(nr))
    try {
      if (navigator.share) { await navigator.share({ text: t }); setGedeeld('gedeeld'); return }
    } catch { /* weggeklikt: dan kopiëren we */ }
    try { await navigator.clipboard.writeText(t); setGedeeld('gekopieerd') } catch { setGedeeld('') }
  }

  const datum = puzzelDatum(nr)
  const eerdere = Array.from({ length: Math.min(vandaag - 1, 14) }, (_, i) => vandaag - 1 - i)

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={vandaag} edition={editionLabel()} current="spellen" totalLabel={vandaag === 1 ? 'foto' : "foto's"} />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="pl-hf-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-hf-t" className="pl-h2">Raad de hemelfoto</h1>
              <span className="pl-label pl-meta">
                <span className="pl-num">#{nr}</span>
                <span className="pl-meta__tick" aria-hidden="true" />
                {nr === vandaag ? 'vandaag' : datumKort(datum)}
              </span>
            </div>
            {nr !== vandaag && (
              <button type="button" className="pl-btn" onClick={() => setNr(vandaag)}>Naar vandaag</button>
            )}
          </div>

          <p className="pl-hf__lede">
            Eén echte ruimtefoto per dag, ver ingezoomd. Elke foute gok zoomt verder uit en vertelt je
            of je in de goede richting zit. Je hebt zes pogingen.
          </p>

          <div className="pl-hf">
            {/* ── De foto ── */}
            <figure className="pl-hf__fig">
              <div className="pl-hf__frame" data-klaar={stand.klaar ? '1' : '0'}>
                {!beeldFout ? (
                  <img
                    key={foto.nasaId}
                    src={fotoUrl(foto, 1200)}
                    alt={stand.klaar ? `${foto.naam}: ${foto.credit}` : 'Ingezoomde ruimtefoto om te raden'}
                    style={{ transform: `scale(${zoom})`, transformOrigin: `${foto.focus[0]}% ${foto.focus[1]}%` }}
                    onError={() => setBeeldFout(true)}
                    draggable={false}
                  />
                ) : (
                  <p className="pl-hf__fout pl-body-s">De foto laadt niet. Probeer het over een minuut opnieuw.</p>
                )}
                <span className="pl-hf__zoom pl-num" aria-hidden="true">{zoom.toFixed(1).replace('.', ',')}×</span>
              </div>
              <ol className="pl-hf__pogingen" aria-label={`${stand.gokken.length} van ${POGINGEN} pogingen gebruikt`}>
                {Array.from({ length: POGINGEN }, (_, i) => {
                  const g = stand.gokken[i]
                  const st = !g ? 'leeg' : g === foto.id ? 'goed' : ALLE.find(k => k.id === g)?.soort === foto.soort ? 'bijna' : 'fout'
                  return <li key={i} data-st={st} />
                })}
              </ol>
              {!stand.klaar && (
                <p className="pl-body-s pl-hf__uitleg">
                  {POGINGEN} pogingen. Na elke foute gok zoomt de foto verder uit. Groen omrand: goede soort, ander object.
                </p>
              )}
              {stand.klaar && <figcaption className="pl-hf__credit">{foto.credit}</figcaption>}
            </figure>

            {/* ── Raden ── */}
            <div className="pl-hf__kolom">
              {!stand.klaar ? (
                <div className="pl-hf__invoer">
                  <label htmlFor="pl-hf-gok" className="pl-label">
                    Wat is dit? <span className="pl-num">{over}</span> {over === 1 ? 'poging' : 'pogingen'} over
                  </label>
                  <div className="pl-hf__zoek">
                    <Ico.search size={15} />
                    <input
                      id="pl-hf-gok"
                      ref={invoer}
                      type="text"
                      inputMode="search"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="Typ een planeet, nevel, stelsel…"
                      value={tekst}
                      disabled={!geladen}
                      onChange={e => { setTekst(e.target.value); setOpen(true) }}
                      onFocus={() => setOpen(true)}
                      onBlur={() => setTimeout(() => setOpen(false), 180)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && opties[0] && tekst.trim()) { e.preventDefault(); gok(opties[0]) }
                        if (e.key === 'Escape') setOpen(false)
                      }}
                      aria-controls="pl-hf-opties"
                      aria-expanded={open}
                    />
                  </div>
                  {open && (
                    <ul id="pl-hf-opties" className="pl-hf__opties" aria-label="Kies een antwoord">
                      {opties.length === 0 && <li className="pl-body-s pl-hf__geen">Niets gevonden. Probeer een andere naam.</li>}
                      {opties.map(k => (
                        <li key={k.id}>
                          <button type="button" onClick={() => gok(k)}>
                            <span>{k.naam}</span>
                            <span className="pl-label">{k.soort}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!tekst && (
                    <p className="pl-body-s pl-hf__tip">Tip: tik in het veld voor de hele lijst.</p>
                  )}
                </div>
              ) : (
                <div className="pl-hf__uitslag" role="status">
                  <span className="pl-label" style={{ color: stand.goed ? 'var(--pl-good)' : 'var(--pl-warn)' }}>
                    {stand.goed ? `Geraden in ${stand.gokken.length} van ${POGINGEN}` : 'Helaas, niet geraden'}
                  </span>
                  <h2 className="pl-hf__naam">{foto.naam}</h2>
                  <p className="pl-body">{foto.uitleg}</p>
                  <div className="pl-hf__acties">
                    <button type="button" className="pl-btn pl-btn--act" onClick={deel}>
                      <Ico.share size={14} /> Deel je uitslag
                    </button>
                    <span className="pl-label" aria-live="polite">
                      {gedeeld === 'gekopieerd' ? 'Gekopieerd, plak hem waar je wilt' : gedeeld === 'gedeeld' ? 'Gedeeld' : ''}
                    </span>
                  </div>
                </div>
              )}

              {stand.gokken.length > 0 && (
                <ol className="pl-hf__gokken" aria-label="Jouw gokken">
                  {stand.gokken.map(id => {
                    const k = ALLE.find(x => x.id === id)
                    if (!k) return null
                    const raak = id === foto.id
                    const zelfde = k.soort === foto.soort
                    const r = richting(k, foto)
                    return (
                      <li key={id} data-raak={raak ? '1' : '0'}>
                        <span className="pl-hf__g-naam">
                          {raak ? <Ico.check size={13} /> : <Ico.cross size={13} />}
                          {k.naam}
                        </span>
                        {!raak && (
                          <>
                            <span className="pl-hf__g-tag" data-ok={zelfde ? '1' : '0'}>
                              {zelfde ? `Ook een ${k.soort.toLowerCase()}` : `Geen ${k.soort.toLowerCase()}`}
                            </span>
                            <span className="pl-hf__g-tag" data-ok={r === 'even ver' ? '1' : '0'}>
                              {r === 'verder' ? 'Antwoord staat verder weg' : r === 'dichterbij' ? 'Antwoord staat dichterbij' : 'Ongeveer even ver'}
                            </span>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}

              {(fout >= 2 || stand.klaar) && (
                <dl className="pl-hf__hints">
                  <div className="pl-field"><dt className="pl-label">Waar</dt><dd>{foto.plek}</dd></div>
                  {(fout >= 4 || stand.klaar) && <div className="pl-field"><dt className="pl-label">Vastgelegd door</dt><dd>{foto.vastgelegd}</dd></div>}
                  {stand.klaar && <div className="pl-field"><dt className="pl-label">Afstand</dt><dd>{foto.afstand}</dd></div>}
                </dl>
              )}
              {!stand.klaar && fout < 2 && (
                <p className="pl-body-s pl-hf__tip">Na twee foute gokken krijg je een hint over waar het staat.</p>
              )}
            </div>
          </div>
        </section>

        {stand.klaar && (
          <section className="pl-wrap" aria-labelledby="pl-hf-zelf">
            <div className="pl-hf__na">
              <div className="pl-hf__zelf">
                <h2 id="pl-hf-zelf" className="pl-label pl-label--stamp">Zelf zien</h2>
                <p className="pl-body">{foto.zelfZien}</p>
              </div>
              <Artikelen foto={foto} onKlik={() => telGebeurtenis('hemelfoto-verder', foto.id)} />
            </div>
            {nr === vandaag && (
              <p className="pl-label pl-hf__morgen">Nieuwe foto over <span className="pl-num">{totMorgen()}</span></p>
            )}
          </section>
        )}

        {geladen && eerdere.length > 0 && (
          <section className="pl-wrap" aria-labelledby="pl-hf-eerder">
            <div className="pl-band">
              <h2 id="pl-hf-eerder" className="pl-h2">Eerdere foto’s</h2>
              <span className="pl-label">Gemist? Speel ze alsnog</span>
            </div>
            <ul className="pl-hf__eerder">
              {eerdere.map(n => {
                const s = archief[n]
                const st = !s || s.gokken.length === 0 ? 'open' : !s.klaar ? 'bezig' : s.goed ? 'goed' : 'fout'
                return (
                  <li key={n}>
                    <button type="button" data-st={st} aria-current={n === nr ? 'true' : undefined}
                      onClick={() => { setNr(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                      <span className="pl-num">#{n}</span>
                      <span className="pl-label">{datumKort(puzzelDatum(n))}</span>
                      <span className="pl-hf__st">{st === 'open' ? 'Nog spelen' : st === 'bezig' ? 'Bezig' : st === 'goed' ? 'Geraden' : 'Niet geraden'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="pl-wrap">
          <p className="pl-body-s pl-hf__over">
            Alle foto’s komen uit de beeldbank van NASA (images.nasa.gov), vrij te gebruiken met
            bronvermelding. Afstanden zijn afgerond; bij planeten hangt de afstand af van waar de
            aarde en de planeet in hun baan staan. Wat je speelt, blijft alleen op dit toestel.
          </p>
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Afbeeldingen: NASA · ESA" />
    </div>
  )
}
