'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer gebruiksvoorwaarden — /voorwaarden

   Tekst uit docs/voorwaarden-concept.md in nightgazer-social; nodig voor de
   TikTok-app-aanvraag. Eén plaat, de artikelen als een genummerde lijst
   velden. Pas BIJGEWERKT aan bij elke wijziging van de tekst.
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'

const BIJGEWERKT = '22 oktober 2026'

const ARTIKELEN: { kop: string; tekst: React.ReactNode }[] = [
  {
    kop: 'Inhoud',
    tekst: <>
      Het nieuws op NightGazer is gebaseerd op openbare bronnen zoals NASA, ESA en JPL, en wordt met
      behulp van AI (Claude van Anthropic) in het Nederlands herschreven op drie leesniveaus. Elke
      pagina vermeldt de oorspronkelijke bron. We doen ons best om alles juist te houden, maar kunnen
      fouten niet uitsluiten. Waarneemgegevens zoals noorderlichtverwachtingen en ISS-overgangen zijn
      verwachtingen, geen garanties.
    </>,
  },
  {
    kop: 'Beeld',
    tekst: <>
      Beeldmateriaal komt van de vermelde bronnen onder hun eigen licentie, of is eigen werk. Wil je
      iets overnemen, controleer dan de licentie bij de bron.
    </>,
  },
  {
    kop: 'Sociale media',
    tekst: <>
      NightGazer plaatst eigen video&apos;s en berichten op TikTok en Instagram. Daarvoor gebruiken we
      de officiële koppelingen van die platforms. Elke post wordt door een mens gecontroleerd voordat
      hij geplaatst wordt. Op het gebruik van die platforms zijn ook hun eigen voorwaarden van
      toepassing.
    </>,
  },
  {
    kop: 'Advertenties',
    tekst: <>
      De site toont advertenties van Google AdSense. Zie het{' '}
      <Link href="/privacy/" className="pl-voorw__a">privacybeleid</Link> voor wat dat betekent voor
      je gegevens.
    </>,
  },
  {
    kop: 'Affiliate-links',
    tekst: <>
      Op de pagina{' '}
      <Link href="/sterrenkijken/uitrusting/" className="pl-voorw__a">Uitrusting</Link> staan links naar
      Bol en Amazon.nl. Koop je iets via zo&apos;n link, dan krijgt NightGazer een kleine commissie van
      de winkel. Jij betaalt niets extra en de aanbevelingen hangen niet af van de commissie.
    </>,
  },
  {
    kop: 'Aansprakelijkheid',
    tekst: <>
      NightGazer is een informatieve hobbywebsite. Je gebruikt de informatie op eigen
      verantwoordelijkheid.
    </>,
  },
  {
    kop: 'Contact',
    tekst: <>
      Vragen of een fout gezien? Mail naar{' '}
      <a href="mailto:social@nightgazer.space" className="pl-voorw__a">social@nightgazer.space</a> of
      gebruik de <Link href="/contact/" className="pl-voorw__a">contactpagina</Link>.
    </>,
  },
  {
    kop: 'Wijzigingen',
    tekst: <>
      We kunnen deze voorwaarden aanpassen; de datum bovenaan laat zien wanneer dat voor het laatst
      gebeurde.
    </>,
  },
]

export default function Voorwaarden() {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={ARTIKELEN.length} edition={editionLabel()} current="voorwaarden" totalLabel="artikelen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="pl-voorwaarden">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-voorwaarden" className="pl-h2">Gebruiksvoorwaarden</h1>
              <span className="pl-label">Laatst bijgewerkt <span className="pl-num">{BIJGEWERKT}</span></span>
            </div>
          </div>

          <div className="pl-plate pl-voorw">
            <div className="pl-edge" aria-hidden="true" />
            <p className="pl-voorw__intro">
              NightGazer (nightgazer.space) is een Nederlandstalige website over astronomie en
              ruimtevaart, gemaakt door Crix, amateur-astronoom uit Groningen. Door de site of de
              NightGazer-accounts op sociale media te gebruiken, ga je akkoord met deze voorwaarden.
            </p>
            <ol className="pl-voorw__list">
              {ARTIKELEN.map((a, i) => (
                <li key={a.kop} className="pl-voorw__item">
                  <span className="pl-label pl-label--stamp pl-num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h2 className="pl-h3">{a.kop}</h2>
                    <p className="pl-body">{a.tekst}</p>
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
