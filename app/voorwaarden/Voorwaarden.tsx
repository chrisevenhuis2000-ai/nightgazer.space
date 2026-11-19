'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer gebruiksvoorwaarden — /voorwaarden

   Tekst uit docs/voorwaarden-concept.md in nightgazer-social; nodig voor de
   TikTok-app-aanvraag. Eén plaat, de artikelen als een genummerde lijst
   velden. Pas BIJGEWERKT aan bij elke wijziging van de tekst.
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import TekstPlaat, { type TekstArtikel } from '@/app/_plate/TekstPlaat'

const BIJGEWERKT = '19 november 2026'

const ARTIKELEN: TekstArtikel[] = [
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
      NightGazer plaatst eigen video&apos;s en berichten op Instagram, Facebook, X, YouTube en TikTok. Daarvoor gebruiken we
      de officiële koppelingen van die platforms. Elke post wordt door een mens gecontroleerd voordat
      hij geplaatst wordt. Op het gebruik van die platforms zijn ook hun eigen voorwaarden van
      toepassing.
    </>,
  },
  {
    kop: 'Advertenties',
    tekst: <>
      Er staan nu geen advertenties op de site. We hebben Google AdSense aangevraagd; zodra die
      advertenties aangaan, vragen we eerst je toestemming en passen we deze tekst aan. Zie de{' '}
      <Link href="/privacy/" className="pl-voorw__a">privacyverklaring</Link> voor wat dat betekent
      voor je gegevens.
    </>,
  },
  {
    kop: 'Affiliate-links',
    tekst: <>
      Op de pagina{' '}
      <Link href="/sterrenkijken/uitrusting/" className="pl-voorw__a">Uitrusting</Link>, in de{' '}
      <Link href="/sterrenkijken/eerste-telescoop/" className="pl-voorw__a">telescoopgids</Link> en in de{' '}
      <Link href="/sterrenkijken/cadeaugids/" className="pl-voorw__a">cadeaugids</Link> staan links naar
      Astroshop en Amazon.nl. Koop je iets via zo&apos;n link, dan krijgt NightGazer een kleine commissie van
      de winkel. Jij betaalt niets extra en de aanbevelingen hangen niet af van de commissie. Als
      Amazon-partner verdien ik aan in aanmerking komende aankopen.
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
    <TekstPlaat
      id="voorwaarden"
      current="voorwaarden"
      titel="Gebruiksvoorwaarden"
      sub={<>Laatst bijgewerkt <span className="pl-num">{BIJGEWERKT}</span></>}
      intro={<p>
        NightGazer (nightgazer.space) is een Nederlandstalige website over sterrenkijken en
        ruimtevaart, gemaakt door Crix, amateur-astronoom uit Groningen. Door de site of de
        NightGazer-accounts op sociale media te gebruiken, ga je akkoord met deze voorwaarden.
      </p>}
      artikelen={ARTIKELEN}
    />
  )
}
