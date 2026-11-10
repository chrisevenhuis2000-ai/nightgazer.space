'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Teken het sterrenbeeld van vannacht

   Eén sterrenbeeld per dag dat die avond echt hoog boven Nederland staat,
   in precies de stand die je buiten ziet (horizon onder). Tik een ster,
   tik de volgende: een goede lijn blijft staan, een foute telt als misser.
   Sterren van buurbeelden staan er ook, die moet je overslaan.

   Net als de andere spellen: geen punten of ranglijst, alles in
   localStorage. Na afloop: het verhaal, waar je moet kijken, en je kunt
   meteen een ander sterrenbeeld van vanavond tekenen.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { telGebeurtenis } from '@/lib/tel'
import { nlDag } from '@/lib/hemelfoto'
import {
  BEELDEN, beeldVanDag, zichtbaar, lijnenVan, speelveld, straal, standVan, kijkuur, nlTijdstip,
  trek, hint, NIEUW, type Spel, type Beeld, type Punt,
} from '@/lib/sterrenbeeld'

const STORE = 'nightgazer_sterrenbeeld'
const MAAT = 1000
type Archief = Record<string, Record<string, Spel>>

function lees(): Archief {
  try { const raw = localStorage.getItem(STORE); return raw ? JSON.parse(raw) as Archief : {} } catch { return {} }
}
function schrijf(a: Archief) {
  /* Alleen de laatste tien dagen bewaren. */
  const dagen = Object.keys(a).sort().slice(-10)
  const kort: Archief = {}
  for (const d of dagen) kort[d] = a[d]
  try { localStorage.setItem(STORE, JSON.stringify(kort)) } catch { /* spelen kan ook zonder geheugen */ }
}

/* Vaste, zwakke achtergrondsterren: sfeer, niet aanklikbaar. */
const STOF = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x) }
  return { x: r(1) * MAAT, y: r(2) * MAAT, r: 1 + r(3) * 1.6, o: 0.18 + r(4) * 0.3 }
})

export default function Sterrenbeeld() {
  const [iso, setIso] = useState<string | null>(null)
  const [id, setId] = useState<string | null>(null)
  const [archief, setArchief] = useState<Archief>({})
  const [sel, setSel] = useState<string | null>(null)
  const [flits, setFlits] = useState<{ a: string; b: string } | null>(null)
  const [tip, setTip] = useState<string | null>(null)
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const d = nlDag()
    setIso(d)
    setId(beeldVanDag(d).id)
    setArchief(lees())
  }, [])

  const beeld: Beeld | null = useMemo(() => BEELDEN.find(b => b.id === id) ?? null, [id])
  const moment = useMemo(() => (iso ? nlTijdstip(iso, kijkuur(iso)) : null), [iso])
  const punten = useMemo(() => (beeld && moment ? speelveld(beeld, moment, MAAT) : []), [beeld, moment])
  const anderen = useMemo(() => (iso ? zichtbaar(iso).filter(b => b.id !== id) : []), [iso, id])
  const vanDag = useMemo(() => (iso ? beeldVanDag(iso).id : null), [iso])

  if (!iso || !beeld || !moment) {
    return (
      <div className={`pl ${archivo.variable}`}>
        <PlateHead total={BEELDEN.length} edition={editionLabel()} current="sterrenkijken" totalLabel="sterrenbeelden" />
        <main id="pl-main" className="pl-stack"><div className="pl-wrap"><div className="pl-skel" style={{ height: 520 }} /></div></main>
      </div>
    )
  }

  const spel = archief[iso]?.[beeld.id] ?? NIEUW
  const alle = lijnenVan(beeld)
  const stand = standVan(beeld, moment)
  const uur = `${kijkuur(iso)}:00`
  const p = (naam: string) => punten.find(q => q.naam === naam)

  function bewaar(nieuw: Spel) {
    const a = { ...archief, [iso!]: { ...(archief[iso!] ?? {}), [beeld!.id]: nieuw } }
    setArchief(a)
    schrijf(a)
  }

  function tik(e: React.PointerEvent<SVGSVGElement>) {
    if (spel.klaar || !svg.current) return
    const m = svg.current.getScreenCTM()
    if (!m) return
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    let best: Punt | null = null, afstand = 70
    for (const q of punten) {
      const d = Math.hypot(q.x - pt.x, q.y - pt.y)
      if (d < afstand) { best = q; afstand = d }
    }
    if (!best) { setSel(null); return }
    if (!sel) { setSel(best.naam); return }
    if (sel === best.naam) { setSel(null); return }
    if (spel.getekend.length === 0 && spel.fouten === 0) telGebeurtenis('sterrenbeeld-start', beeld!.id)
    const { spel: nieuw, uitkomst } = trek(spel, beeld!, sel, best.naam)
    if (uitkomst === 'fout') {
      setFlits({ a: sel, b: best.naam })
      setTimeout(() => setFlits(null), 650)
      setSel(null)
    } else {
      setSel(nieuw.klaar ? null : best.naam)
    }
    if (nieuw !== spel) {
      bewaar(nieuw)
      if (nieuw.klaar) telGebeurtenis('sterrenbeeld-klaar', `${beeld!.id}:${nieuw.fouten}`)
    }
  }

  function vraagHint() {
    const k = hint(spel, beeld!)
    if (!k) return
    setTip(k)
    setTimeout(() => setTip(t => (t === k ? null : t)), 2600)
    bewaar({ ...spel, hints: spel.hints + 1 })
  }

  function wissel(b: Beeld) {
    setId(b.id); setSel(null); setTip(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const lijn = (k: string, cls: string) => {
    const [a, b] = k.split('|'); const A = p(a), B = p(b)
    if (!A || !B) return null
    return <line key={`${cls}-${k}`} className={cls} x1={A.x} y1={A.y} x2={B.x} y2={B.y} />
  }

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={BEELDEN.length} edition={editionLabel()} current="sterrenkijken" totalLabel="sterrenbeelden" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="pl-sb-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-sb-t" className="pl-h2">Teken het sterrenbeeld</h1>
              <span className="pl-label pl-meta">
                <span>{beeld.id === vanDag ? 'Van vannacht' : 'Ook vanavond'}</span>
                <span className="pl-meta__tick" aria-hidden="true" />
                <span className="pl-num">{uur}</span>
              </span>
            </div>
            {beeld.id !== vanDag && (
              <button type="button" className="pl-btn" onClick={() => wissel(beeldVanDag(iso))}>Naar vandaag</button>
            )}
          </div>

          <p className="pl-hf__lede">
            Verbind de sterren van <strong className="pl-sb__naam">{beeld.naam}</strong>, precies zoals het
            vanavond om {uur} boven Nederland staat. Tik een ster en dan de volgende.
            {punten.some(q => !q.hoort) && ' Pas op: er staan ook sterren van andere sterrenbeelden tussen.'}
          </p>

          <div className="pl-hf">
            <figure className="pl-hf__fig">
              <div className="pl-sb__veld" data-klaar={spel.klaar ? '1' : '0'}>
                <svg ref={svg} viewBox={`0 0 ${MAAT} ${MAAT}`} role="img"
                  aria-label={`Sterrenveld met ${punten.length} sterren. ${spel.getekend.length} van ${alle.length} lijnen getekend.`}
                  onPointerDown={tik}>
                  {STOF.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} className="pl-sb__stof" style={{ opacity: s.o }} />)}
                  {spel.getekend.map(k => lijn(k, 'pl-sb__lijn'))}
                  {tip && lijn(tip, 'pl-sb__tip')}
                  {flits && (() => { const A = p(flits.a), B = p(flits.b); return A && B ? <line className="pl-sb__fout" x1={A.x} y1={A.y} x2={B.x} y2={B.y} /> : null })()}
                  {punten.map(q => (
                    <g key={q.naam} data-naam={q.naam}>
                      {sel === q.naam && <circle cx={q.x} cy={q.y} r={straal(q.mag) + 16} className="pl-sb__sel" />}
                      <circle cx={q.x} cy={q.y} r={straal(q.mag)} className="pl-sb__ster" data-uit={spel.klaar && !q.hoort ? '1' : '0'} />
                      {spel.klaar && q.hoort && (
                        <text x={q.x + straal(q.mag) + 8} y={q.y + 6} className="pl-sb__label">{q.naam}</text>
                      )}
                    </g>
                  ))}
                </svg>
                <span className="pl-sb__horizon pl-label">Horizon · {stand.richting.replace('het ', '')}</span>
              </div>
              <div className="pl-sb__balk">
                <span className="pl-label"><span className="pl-num">{spel.getekend.length}</span> van <span className="pl-num">{alle.length}</span> lijnen</span>
                <span className="pl-label">Missers <span className="pl-num">{spel.fouten}</span></span>
                {!spel.klaar && (
                  <button type="button" className="pl-btn" onClick={vraagHint}>Hint</button>
                )}
              </div>
            </figure>

            <div className="pl-hf__kolom">
              {!spel.klaar ? (
                <div className="pl-sb__uitleg">
                  <p className="pl-label">Zo werkt het</p>
                  <ol className="pl-sb__stappen pl-body-s">
                    <li>Tik op een ster. Hij krijgt een ring.</li>
                    <li>Tik op de ster waar de lijn naartoe gaat. Klopt hij, dan blijft de lijn staan en kun je meteen verder.</li>
                    <li>Een foute lijn kleurt even rood en telt als misser. Tik op een lege plek om opnieuw te beginnen.</li>
                  </ol>
                  <p className="pl-body-s pl-hf__tip">Vast? Een hint laat één ontbrekende lijn even oplichten.</p>
                </div>
              ) : (
                <div className="pl-hf__uitslag" role="status">
                  <span className="pl-label" style={{ color: 'var(--pl-good)' }}>
                    {spel.fouten === 0 && spel.hints === 0 ? 'In één keer goed' : `Af, met ${spel.fouten} ${spel.fouten === 1 ? 'misser' : 'missers'}${spel.hints ? ` en ${spel.hints} ${spel.hints === 1 ? 'hint' : 'hints'}` : ''}`}
                  </span>
                  <h2 className="pl-hf__naam">{beeld.naam}</h2>
                  <p className="pl-body">{beeld.verhaal}</p>
                </div>
              )}

              <dl className="pl-hf__hints">
                <div className="pl-field">
                  <dt className="pl-label">Vanavond om {uur}</dt>
                  <dd>Kijk naar {stand.richting}, {stand.hoogte}.</dd>
                </div>
                {spel.klaar && (
                  <div className="pl-field">
                    <dt className="pl-label">Zo vind je het</dt>
                    <dd>{beeld.tip}</dd>
                  </div>
                )}
              </dl>

              {spel.klaar && (
                <Link href={beeld.verder.href} className="pl-read" onClick={() => telGebeurtenis('sterrenbeeld-verder', beeld.id)}>
                  <span>{beeld.verder.label}</span>
                  <span className="pl-read__rule" aria-hidden="true" />
                  <Ico.arrow />
                </Link>
              )}
            </div>
          </div>
        </section>

        {anderen.length > 0 && (
          <section className="pl-wrap" aria-labelledby="pl-sb-meer">
            <div className="pl-band">
              <h2 id="pl-sb-meer" className="pl-h2">Ook vanavond te zien</h2>
              <span className="pl-label">Teken er nog een</span>
            </div>
            <ul className="pl-hf__eerder">
              {[beeldVanDag(iso), ...anderen].filter((b, i, a) => a.findIndex(x => x.id === b.id) === i && b.id !== beeld.id).map(b => {
                const s = archief[iso]?.[b.id]
                const st = s?.klaar ? 'goed' : s && (s.getekend.length || s.fouten) ? 'bezig' : 'open'
                return (
                  <li key={b.id}>
                    <button type="button" data-st={st} onClick={() => wissel(b)}>
                      <span className="pl-sb__knop-n">{b.naam}</span>
                      <span className="pl-label">{standVan(b, moment).richting.replace('het ', '')}</span>
                      <span className="pl-hf__st">{st === 'goed' ? 'Getekend' : st === 'bezig' ? 'Bezig' : 'Nog tekenen'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="pl-wrap">
          <p className="pl-body-s pl-hf__over">
            De stand is berekend voor het midden van Nederland om {uur}, met dezelfde sterposities
            als de zoekkaart op Sterrenkijken. Morgen staat er een ander sterrenbeeld klaar. Speel ook{' '}
            <Link href="/spellen/hemelfoto/" className="pl-voorw__a">Raad de hemelfoto</Link>.
          </p>
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Sterposities: J2000-catalogus, berekend in je browser" />
    </div>
  )
}
