'use client'

/* /gidsen: de vier gidspagina's op één plek. De adressen zelf blijven onder
   /sterrenkijken, zodat bestaande links blijven werken. */

import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { KALENDER_PRIJS, KALENDER_JAAR } from '@/lib/hemelkalender'

const GIDSEN = [
  { href: '/sterrenkijken/eerste-telescoop/', label: 'Eerste telescoop', kop: 'Je eerste telescoop kiezen', tekst: 'Waar je op let, wat je echt ziet met 130, 152 of 200 mm, en welke bij jou past.' },
  { href: '/sterrenkijken/cadeaugids/', label: 'Cadeaugids', kop: 'Een cadeau voor iemand die naar boven kijkt', tekst: 'Per prijsklasse, vanaf € 25. Je hoeft zelf niets van telescopen te weten.' },
  { href: '/sterrenkijken/uitrusting/', label: 'Uitrusting', kop: 'Wat heb je nodig om meer te zien?', tekst: 'Van rood lampje en sterrenkaart tot boeken voor bewolkte avonden.' },
  { href: '/sterrenkijken/hemelkalender/', label: `Hemelkalender ${KALENDER_JAAR} · ${KALENDER_PRIJS}`, kop: 'Het hele hemeljaar aan de muur', tekst: 'Elke nacht de maan, per maand de planeten en meteorenzwermen. Pdf, direct te downloaden.' },
]

export default function Gidsen() {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={GIDSEN.length} edition={editionLabel()} current="gidsen" totalLabel="gidsen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="pl-gidsen-kop">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-gidsen-kop" className="pl-h1">Gidsen</h1>
            </div>
          </div>
          <p className="pl-body" style={{ maxWidth: '60ch' }}>
            Alles wat ik zelf had willen weten toen ik begon met sterrenkijken: welke telescoop, wat je erbij nodig hebt, en wat je een sterrenkijker kunt geven.
          </p>
        </section>

        <section className="pl-wrap pl-overzicht" aria-label="Alle gidsen">
          {GIDSEN.map(g => (
            <div key={g.href} className="pl-plate pl-uitr-ref">
              <div>
                <span className="pl-label">{g.label}</span>
                <h2 className="pl-h3" style={{ margin: 0 }}>{g.kop}</h2>
                <p className="pl-body-s" style={{ margin: 0 }}>{g.tekst}</p>
              </div>
              <Link href={g.href} className="pl-read" aria-label={`Lees: ${g.kop}`}>
                <span>Lees de gids</span>
                <span className="pl-read__rule" aria-hidden="true" />
                <Ico.arrow />
              </Link>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} />
    </div>
  )
}
