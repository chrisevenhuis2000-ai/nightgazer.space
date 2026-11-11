'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Zwermgids — /sterrenkijken/leoniden en /sterrenkijken/geminiden

   Een leespagina die één zoekvraag beantwoordt: wanneer en hoe laat kijk ik.
   Het antwoord staat in de kop en de lede; daaronder één beeld met een taak,
   de nachtbalk: van 18:00 tot 07:00 de hoogte van de radiant, wanneer de
   maan op is en wanneer het echt donker is, met het beste moment gemarkeerd.
   De lijn tekent zich één keer als de balk in beeld komt (de enige beweging);
   zonder JavaScript of met minder beweging staat hij er gewoon.
   Alle getallen komen uit lib/zwermgids.ts.
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { SiteFooter } from '../components/SiteFooter'
import { Steun } from '../components/Steun'
import { MeldingenTeaser } from '../components/MeldingenTeaser'
import { archivo, FOOTER_COLS, PlateHead, editionLabel, GidsBalk } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { nasaBeeld, nasaPagina } from '@/lib/uitrusting'
import { ZWERMGIDSEN, klok, opBalk, type Zwermgids as Gids } from '@/lib/zwermgids'

const VAN = 18, TOT = 31, MAX = 75
const x = (u: number) => ((u - VAN) / (TOT - VAN)) * 1000
const y = (alt: number) => 200 - (Math.max(alt, -8) / MAX) * 180
const pct = (u: number) => `${((u - VAN) / (TOT - VAN)) * 100}%`

function useTeken() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stil = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (stil || typeof IntersectionObserver === 'undefined') return
    el.dataset.anim = 'aan'
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { el.dataset.zicht = 'ja'; io.disconnect() }
    }), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function Nachtbalk({ g }: { g: Gids }) {
  const ref = useTeken()
  const lijn = g.nacht.map(p => `${x(p.uur).toFixed(1)},${y(p.radiant).toFixed(1)}`).join(' ')
  const vlak = `${x(VAN)},200 ${lijn} ${x(TOT)},200`
  const donkerVan = opBalk(g.donker.van), donkerTot = opBalk(g.donker.tot)
  const maanTot = g.maan.onder ? opBalk(g.maan.onder) : VAN
  // Hoogte op het beste moment, lineair tussen de twee hele uren eromheen.
  const i = g.nacht.findIndex(p => p.uur >= g.best.uur)
  const a = g.nacht[Math.max(0, i - 1)], b = g.nacht[Math.max(0, i)]
  const bestAlt = b.uur === a.uur ? b.radiant : a.radiant + (b.radiant - a.radiant) * (g.best.uur - a.uur) / (b.uur - a.uur)
  const piek = g.piekTekst.match(/(\d\d):(\d\d)/)
  const piekUur = piek ? opBalk(`${piek[1]}:${piek[2]}`) : null
  const piekOpBalk = piekUur !== null && piekUur >= VAN && piekUur <= TOT

  return (
    <figure className="pl-plate pl-zg__balk" ref={ref}>
      <div className="pl-zg__vlak">
        <div className="pl-zg__band pl-zg__band--donker" style={{ left: pct(donkerVan), width: `calc(${pct(donkerTot)} - ${pct(donkerVan)})` }} aria-hidden="true" />
        {maanTot > VAN && (
          <div className="pl-zg__band pl-zg__band--maan" style={{ left: 0, width: pct(maanTot) }} aria-hidden="true">
            <span className="pl-label">Maan op · {g.maan.verlicht}%</span>
          </div>
        )}
        <svg viewBox="0 0 1000 220" preserveAspectRatio="none" className="pl-zg__svg" aria-hidden="true">
          <line x1="0" x2="1000" y1="200" y2="200" className="pl-zg__horizon" />
          {[30, 60].map(a => <line key={a} x1="0" x2="1000" y1={y(a)} y2={y(a)} className="pl-zg__raster" />)}
          {piekOpBalk && <line x1={x(piekUur!)} x2={x(piekUur!)} y1="10" y2="200" className="pl-zg__piek" />}
          <polygon points={vlak} className="pl-zg__onder" />
        </svg>
        <svg viewBox="0 0 1000 220" preserveAspectRatio="none" className="pl-zg__svg pl-zg__svg--lijn" aria-hidden="true">
          <polyline points={lijn} className="pl-zg__lijn" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="pl-zg__hoogte pl-label pl-num" style={{ top: `${(y(60) / 220) * 100}%` }} aria-hidden="true">60°</span>
        <span className="pl-zg__hoogte pl-label pl-num" style={{ top: `${(y(30) / 220) * 100}%` }} aria-hidden="true">30°</span>
        <span className="pl-zg__hoogte pl-label pl-num" style={{ top: `${(200 / 220) * 100}%` }} aria-hidden="true">horizon</span>
        {piekOpBalk && (
          <span className="pl-zg__piektekst pl-label" style={{ left: pct(piekUur!) }} aria-hidden="true">{g.piekTekst}</span>
        )}
        <span
          className="pl-zg__best"
          style={{ left: pct(g.best.uur), top: `${(y(bestAlt) / 220) * 100}%` }}
          aria-hidden="true"
        >
          <i />
          <span className="pl-zg__besttekst pl-num">Beste moment {g.best.tekst}</span>
        </span>
      </div>
      <div className="pl-zg__as pl-num" aria-hidden="true">
        {[18, 20, 22, 24, 26, 28, 30].map(u => <span key={u} style={{ left: pct(u) }}>{klok(u)}</span>)}
      </div>
      <figcaption className="pl-zg__legenda">
        <span className="pl-zg__l-best"><i className="pl-zg__l pl-zg__l--best" aria-hidden="true" />Beste moment {g.best.tekst}</span>
        <span><i className="pl-zg__l pl-zg__l--lijn" aria-hidden="true" />Hoogte van de radiant: hoe hoger, hoe meer meteoren</span>
        <span><i className="pl-zg__l pl-zg__l--donker" aria-hidden="true" />Echt donker, {g.donker.van} tot {g.donker.tot}</span>
        {g.maan.onder && <span><i className="pl-zg__l pl-zg__l--maan" aria-hidden="true" />Maan boven de horizon tot {g.maan.onder}</span>}
        {!piekOpBalk && <span className="pl-zg__l-tekst">{g.piekTekst}</span>}
      </figcaption>
      <p className="sr-only">
        De radiant komt hoger naarmate de nacht vordert. Het beste moment is {g.best.tekst}.
        Het is echt donker van {g.donker.van} tot {g.donker.tot}{g.maan.onder ? `, en de maan gaat om ${g.maan.onder} onder` : ''}.
      </p>
    </figure>
  )
}

export default function Zwermgids({ slug }: { slug: Gids['slug'] }) {
  const g = ZWERMGIDSEN[slug]
  const ander = ZWERMGIDSEN[g.andere]
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={g.stappen.length} edition={editionLabel()} current="gidsen" totalLabel="stappen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        {/* ══ Kop: het antwoord ══ */}
        <section className="pl-wrap" aria-labelledby="pl-zg">
          <div className="pl-uhero pl-zg__kop">
            <div className="pl-uhero__ground" aria-hidden="true">
              <div className="pl-emulsion"><img src={nasaBeeld(g.beeld.nasaId, 'large')} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></div>
            </div>
            <div className="pl-uhero__in">
              <h1 id="pl-zg" className="pl-h1">{g.kop}</h1>
              <p className="pl-uhero__lede">{g.lede}</p>
              <dl className="pl-ukaart__specs pl-zg__specs">
                {g.specs.map(s => (
                  <div key={s.label} className="pl-field">
                    <dt className="pl-label">{s.label}</dt>
                    <dd className="pl-num">{s.waarde}</dd>
                  </div>
                ))}
              </dl>
              <p className="pl-body-s pl-zg__geldig">Tijden voor midden-Nederland (Utrecht), onder een donkere, heldere hemel.</p>
            </div>
            <p className="pl-uhero__credit">
              <a href={nasaPagina(g.beeld.nasaId)} target="_blank" rel="noopener">{g.beeld.titel} · {g.beeld.credit}</a>
            </p>
          </div>
        </section>

        {/* ══ De nacht ══ */}
        <section id="pl-zg-nacht" className="pl-wrap" aria-labelledby="pl-zg-nacht-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-zg-nacht-t" className="pl-h2">Wanneer je het meest ziet</h2>
              <span className="pl-label">De nacht van 18:00 tot 07:00</span>
            </div>
          </div>
          <p className="pl-body pl-zg__intro">
            Meteoren lijken uit één punt te komen, de radiant. Hoe hoger dat punt staat, hoe meer je
            er ziet. {g.richting}
          </p>
          <Nachtbalk g={g} />
        </section>

        {/* ══ Zo kijk je ══ */}
        <section id="pl-zg-kijken" className="pl-wrap" aria-labelledby="pl-zg-kijken-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-zg-kijken-t" className="pl-h2">Zo kijk je</h2>
              <span className="pl-label">Geen telescoop nodig</span>
            </div>
          </div>
          <ol className="pl-voorw__list">
            {g.stappen.map((s, i) => (
              <li key={s.titel} className="pl-voorw__item">
                <span className="pl-label pl-label--stamp pl-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="pl-h3">{s.titel}</h3>
                  <p className="pl-body">{s.tekst}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="pl-body pl-gids__noot">{g.bewolkt}</p>
        </section>

        <section className="pl-wrap pl-gids__slot" aria-label="Verder">
          <MeldingenTeaser />
          <div className="pl-plate pl-uitr-ref">
            <div>
              <span className="pl-label">{ander.naam} {ander.jaar}</span>
              <p className="pl-body">{ander.kop.replace(/^[^:]+:\s*/, '').replace(/^./, c => c.toUpperCase())}.</p>
            </div>
            <Link href={`/sterrenkijken/${ander.slug}/`} className="pl-read">
              <span>Naar de {ander.naam}</span>
              <span className="pl-read__rule" aria-hidden="true" />
              <Ico.arrow />
            </Link>
          </div>
          <Steun />
          <p className="pl-body-s pl-zg__bron">
            Gegevens: piek, aantallen en beste moment van{' '}
            <a href={`https://hemel.waarnemen.com/meteoorzwermen/${g.naam}_${g.jaar}.html`} target="_blank" rel="noopener" className="pl-voorw__a">hemel.waarnemen.com</a>,
            actieve periode van de <a href="https://www.imo.net/calendar/" target="_blank" rel="noopener" className="pl-voorw__a">IMO</a>.
            Zon, maan en radiant zelf berekend voor Utrecht.
          </p>
        </section>
      </main>

      <GidsBalk links={[
        { href: '#pl-zg-nacht', tekst: 'Hoe laat?' },
        { href: `/sterrenkijken/${ander.slug}/`, tekst: ander.naam },
        { href: '/sterrenkijken/', tekst: 'Kan ik vannacht kijken?' },
      ]} />
      <SiteFooter cols={FOOTER_COLS} note="Beeld: NASA (images.nasa.gov) · Gegevens: hemel.waarnemen.com, IMO" />
    </div>
  )
}
