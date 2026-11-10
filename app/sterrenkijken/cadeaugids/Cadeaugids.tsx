'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Cadeaugids — /sterrenkijken/cadeaugids

   Voor wie een cadeau zoekt voor een sterrenkijker en zelf niet weet wat een
   Dobson is. Dezelfde producten en winkellinks als de pagina Uitrusting
   (lib/uitrusting.ts), gerangschikt op prijsklasse (lib/cadeaugids.ts).
   De melding over commissie staat in de kop, vóór de eerste knop, en elke
   winkellink is rel="sponsored". Geen advertentievak op deze pagina.
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { Steun } from '../../components/Steun'
import { AffiliateMelding } from '../../components/AffiliateMelding'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { WINKEL_NAAM, nasaBeeld, type Winkel } from '@/lib/uitrusting'
import { KLASSEN, NIET_DOEN, CADEAU_KOP } from '@/lib/cadeaugids'

const TOTAAL = KLASSEN.reduce((n, k) => n + k.cadeaus.length, 0)

export default function Cadeaugids() {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={TOTAAL} edition={editionLabel()} current="sterrenkijken" totalLabel="cadeaus" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        {/* ══ Kop ══ */}
        <section className="pl-wrap" aria-labelledby="pl-cadeau">
          <div className="pl-uhero">
            <div className="pl-uhero__ground" aria-hidden="true">
              <div className="pl-emulsion"><img src={nasaBeeld(CADEAU_KOP.nasaId)} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></div>
            </div>
            <div className="pl-uhero__in">
              <h1 id="pl-cadeau" className="pl-h1">Een cadeau voor iemand die naar boven kijkt</h1>
              <p className="pl-uhero__lede">
                Je hoeft zelf niets van telescopen te weten. Kies een prijsklasse en lees voor wie
                het cadeau past. Alles op deze pagina zou ik zelf geven of heb ik zelf in gebruik.
                Wil je het waarom weten, lees dan{' '}
                <Link href="/sterrenkijken/eerste-telescoop/" className="pl-voorw__a">hoe je een eerste telescoop kiest</Link>.
              </p>

              <nav className="pl-ustappen" aria-label="Prijsklassen op deze pagina">
                {KLASSEN.map(k => (
                  <a key={k.id} href={`#pl-cadeau-${k.id}`} className="pl-ustappen__a">
                    <span className="pl-label pl-label--stamp pl-num">{k.label}</span>
                    <span className="pl-ustappen__t">{k.titel}</span>
                    <span className="pl-label pl-num">{k.cadeaus.length} {k.cadeaus.length === 1 ? 'aanrader' : 'aanraders'}</span>
                  </a>
                ))}
              </nav>

              <AffiliateMelding />
            </div>
            <p className="pl-uhero__credit">{CADEAU_KOP.titel} · {CADEAU_KOP.credit}</p>
          </div>
        </section>

        {/* ══ De prijsklassen ══ */}
        {KLASSEN.map(k => (
          <section key={k.id} id={`pl-cadeau-${k.id}`} className="pl-wrap pl-ustap" aria-labelledby={`pl-cadeau-${k.id}-t`}>
            <div className="pl-band">
              <div className="pl-band__t">
                <h2 id={`pl-cadeau-${k.id}-t`} className="pl-h2">{k.titel}</h2>
                <span className="pl-label">Richtprijs, kijk in de winkel voor de prijs van vandaag</span>
              </div>
              <p className="pl-label pl-label--stamp pl-num">{k.label}</p>
            </div>

            <p className="pl-ustap__intro">{k.intro}</p>
            <ul className="pl-ukaarten pl-cadeaus">
              {k.cadeaus.map(({ product: p, voorWie }) => {
                const winkels = (Object.keys(p.links) as Winkel[]).filter(w => p.links[w])
                return (
                  <li key={p.naam} className="pl-ukaart pl-lift">
                    <div className="pl-ukaart__kop">
                      <h3 className="pl-h3">{p.naam}</h3>
                      {p.zelf && <span className="pl-ukaart__zelf pl-label pl-label--stamp">Gebruik ik zelf</span>}
                    </div>
                    <p className="pl-body-s"><span className="pl-label">Voor wie</span> {voorWie}</p>
                    <p className="pl-body-s">{p.waarom}</p>
                    {winkels.length > 0 && (
                      <div className="pl-ukaart__winkels">
                        {winkels.map(w => (
                          <a
                            key={w}
                            href={p.links[w]}
                            className="pl-btn"
                            target="_blank"
                            rel="sponsored noopener"
                            aria-label={`${p.naam} bekijken bij ${WINKEL_NAAM[w]} (opent in nieuw tabblad)`}
                          >
                            {WINKEL_NAAM[w]}
                            <Ico.arrow />
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {/* ══ Gratis ══ */}
        <section className="pl-wrap" aria-labelledby="pl-cadeau-gratis">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-cadeau-gratis" className="pl-h2">Het cadeau dat niets kost</h2>
              <span className="pl-label">Zonder doos</span>
            </div>
          </div>
          <div className="pl-plate pl-uitr-ref">
            <div>
              <span className="pl-label">Een avond samen kijken</span>
              <p className="pl-body">
                Kies een heldere avond, rijd naar een donkere plek en neem een thermoskan mee.
                Op de pagina Sterrenkijken staat welke nacht deze week het best is en wat er te zien valt.
              </p>
            </div>
            <Link href="/sterrenkijken/" className="pl-read">
              <span>Wat is er deze week te zien?</span>
              <span className="pl-read__rule" aria-hidden="true" />
              <Ico.arrow />
            </Link>
          </div>
        </section>

        {/* ══ Niet doen ══ */}
        <section className="pl-wrap" aria-labelledby="pl-cadeau-niet">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-cadeau-niet" className="pl-h2">Wat je beter niet geeft</h2>
              <span className="pl-label">Drie miskopen</span>
            </div>
          </div>
          <ul className="pl-ukaarten pl-cadeaus">
            {NIET_DOEN.map(f => (
              <li key={f.titel} className="pl-ukaart">
                <h3 className="pl-h3">{f.titel}</h3>
                <p className="pl-body-s">{f.tekst}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="pl-wrap" aria-label="Steun NightGazer">
          <Steun />
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Beeld: NASA (images.nasa.gov)" />
    </div>
  )
}
