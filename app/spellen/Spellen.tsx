'use client'

/* /spellen: de twee dagspellen op één plek, zodat het menu-item en een
   uit het hoofd getypt adres ergens heen gaan. */

import { SiteFooter } from '../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { SpellenBlok } from '@/app/_plate/SpellenBlok'

export default function Spellen() {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={2} edition={editionLabel()} current="spellen" totalLabel="spellen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="pl-spellen-kop">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-spellen-kop" className="pl-h1">Spellen</h1>
            </div>
          </div>
          <p className="pl-body" style={{ maxWidth: '60ch' }}>
            Elke dag twee nieuwe: een echte ruimtefoto om te raden, en het sterrenbeeld dat vanavond boven Nederland staat om te tekenen.
          </p>
        </section>

        <section className="pl-wrap" aria-label="Spellen van de dag">
          <SpellenBlok />
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} />
    </div>
  )
}
