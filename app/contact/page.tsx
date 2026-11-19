import type { Metadata } from 'next'
import Link from 'next/link'
import TekstPlaat, { type TekstArtikel } from '@/app/_plate/TekstPlaat'
import { ogBeeld } from '@/lib/og'

export const metadata: Metadata = {
  title:       'Contact',
  description: 'Een vraag, een tip of een fout gezien op NightGazer? Mail Crix; je krijgt binnen een week antwoord.',
  alternates:  { canonical: '/contact/' },
  openGraph: {
    images:      ogBeeld(),
    title:       'Contact — NightGazer',
    description: 'Een vraag, een tip of een fout gezien op NightGazer? Mail Crix.',
    url:         '/contact/',
  },
}

const MAIL = 'contact@nightgazer.space'

const ARTIKELEN: TekstArtikel[] = [
  {
    kop: 'Vragen, tips of een fout gezien?',
    tekst: <>
      <p>
        Zag je een fout in een artikel, klopt een tijd niet, of heb je een idee voor de site? Mail het
        gerust. Een foto van wat je zag, of je plaats en het tijdstip, helpt bij het uitzoeken.
      </p>
      <p className="pl-voorw__knop">
        <a href={`mailto:${MAIL}`} className="pl-btn pl-btn--act">{MAIL}</a>
      </p>
    </>,
  },
  {
    kop: 'Je eigen hemelfoto',
    tekst: <p>
      Heb je het noorderlicht, een meteoor of de Maan op de foto gezet? Stuur hem gerust mee, met je
      voornaam en plaats. Willen we hem laten zien, dan vragen we eerst of dat mag, en staat je naam
      erbij.
    </p>,
  },
  {
    kop: 'Samenwerken',
    tekst: <p>
      Organiseer je met een sterrenwacht of vereniging een kijkavond of lezing? Laat het weten, dan
      kijken we of we hem kunnen noemen.
    </p>,
  },
  {
    kop: 'Sociale media',
    tekst: <p>
      Je vindt NightGazer ook op{' '}
      <a href="https://www.instagram.com/nightgazer.space/" className="pl-voorw__a" target="_blank" rel="noopener">Instagram</a>,{' '}
      <a href="https://www.facebook.com/profile.php?id=61589722948899" className="pl-voorw__a" target="_blank" rel="noopener">Facebook</a> en{' '}
      <a href="https://x.com/nightgazerspace" className="pl-voorw__a" target="_blank" rel="noopener">X</a>. Een
      berichtje daar mag ook, maar mail lezen we het snelst.
    </p>,
  },
  {
    kop: 'Reactietijd',
    tekst: <p>
      NightGazer is een hobbyproject van één persoon. Je krijgt binnen een week antwoord. Meer over de
      maker lees je op <Link href="/over/" className="pl-voorw__a">Over NightGazer</Link>.
    </p>,
  },
]

export default function ContactPage() {
  return (
    <TekstPlaat
      id="contact"
      current="contact"
      titel="Contact"
      sub="We horen graag van je"
      artikelen={ARTIKELEN}
    />
  )
}
