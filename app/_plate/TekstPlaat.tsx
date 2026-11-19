'use client'

/* ══════════════════════════════════════════════════════════════════════════
   TekstPlaat — één plaat met een intro en genummerde artikelen.

   Gedeeld door /voorwaarden, /privacy, /contact en /over, zodat die pagina's
   dezelfde kop, hetzelfde menu en dezelfde voet hebben als de rest van de site.
   ══════════════════════════════════════════════════════════════════════════ */

import { SiteFooter } from '../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from './shared'

export interface TekstArtikel { kop: string; tekst: React.ReactNode }

export default function TekstPlaat({ id, titel, sub, intro, artikelen, current }: {
  id: string
  titel: string
  /** Regel onder de titel, bijvoorbeeld de datum van bijwerken. */
  sub?: React.ReactNode
  intro?: React.ReactNode
  artikelen: TekstArtikel[]
  current: string
}) {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={artikelen.length} edition={editionLabel()} current={current} totalLabel="onderdelen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby={`pl-${id}`}>
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id={`pl-${id}`} className="pl-h2">{titel}</h1>
              {sub && <span className="pl-label">{sub}</span>}
            </div>
          </div>

          <div className="pl-plate pl-voorw">
            <div className="pl-edge" aria-hidden="true" />
            {intro && <div className="pl-voorw__intro">{intro}</div>}
            <ol className="pl-voorw__list">
              {artikelen.map((a, i) => (
                <li key={a.kop} className="pl-voorw__item">
                  <span className="pl-label pl-label--stamp pl-num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h2 className="pl-h3">{a.kop}</h2>
                    <div className="pl-body pl-voorw__tekst">{a.tekst}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} />
    </div>
  )
}
