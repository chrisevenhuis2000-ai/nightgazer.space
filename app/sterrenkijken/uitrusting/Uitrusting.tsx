'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Uitrusting — /sterrenkijken/uitrusting

   Aanraders met affiliate-links naar Bol en Amazon.nl. De producten en links
   staan in lib/uitrusting.ts. Eerlijkheid eerst: de melding over commissie
   staat bovenaan, vóór het eerste product, en elke winkellink is
   rel="sponsored".
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { GROEPEN, WINKEL_NAAM, type Winkel } from '@/lib/uitrusting'

const TOTAAL = GROEPEN.reduce((n, g) => n + g.producten.length, 0)

export default function Uitrusting() {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={TOTAAL} edition={editionLabel()} current="sterrenkijken" totalLabel="aanraders" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="pl-uitr">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-uitr" className="pl-h2">Uitrusting voor sterrenkijken</h1>
              <span className="pl-label">Van eerste avond tot eerste telescoop</span>
            </div>
          </div>

          <div className="pl-plate pl-uitr__intro">
            <div className="pl-edge" aria-hidden="true" />
            <p className="pl-body">
              Je hebt niets nodig om te beginnen: op een heldere avond zie je met het blote oog al
              planeten, sterrenbeelden en de ISS. Kijk op{' '}
              <Link href="/sterrenkijken/" className="pl-voorw__a">Sterrenkijken</Link> welke nacht deze
              week het best is. Wil je verder, dan is dit wat ik zou aanraden, in de volgorde waarin je
              het nodig hebt.
            </p>
            <p className="pl-uitr__melding">
              <span className="pl-label pl-label--stamp">Over deze links</span>
              <span className="pl-body-s">
                Koop je iets via een knop op deze pagina, dan krijgt NightGazer een kleine commissie van
                de winkel. Jij betaalt niets extra. Zo helpen deze links de site gratis te houden.
              </span>
            </p>
          </div>
        </section>

        {GROEPEN.map((g, gi) => (
          <section key={g.id} className="pl-wrap" aria-labelledby={`pl-uitr-${g.id}`}>
            <div className="pl-band">
              <div className="pl-band__t">
                <h2 id={`pl-uitr-${g.id}`} className="pl-h2">{g.titel}</h2>
                <span className="pl-label">{g.label}</span>
              </div>
              <p className="pl-label pl-num">Stap {gi + 1}</p>
            </div>

            <div className="pl-plate">
              <p className="pl-body pl-uitr__gintro">{g.intro}</p>
              <ol className="pl-uitr__list">
                {g.producten.map((p, pi) => {
                  const winkels = (Object.keys(p.links) as Winkel[]).filter(w => p.links[w])
                  return (
                    <li key={p.naam} className="pl-uitr__item">
                      <span className="pl-label pl-label--stamp pl-num">{String(pi + 1).padStart(2, '0')}</span>
                      <div className="pl-uitr__tekst">
                        <h3 className="pl-h3">{p.naam}</h3>
                        {p.zelf && <span className="pl-label pl-label--stamp">Gebruik ik zelf</span>}
                        <p className="pl-body">{p.waarom}</p>
                      </div>
                      {winkels.length > 0 && (
                        <div className="pl-uitr__winkels">
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
              </ol>
            </div>
          </section>
        ))}
      </main>

      <SiteFooter cols={FOOTER_COLS} />
    </div>
  )
}
