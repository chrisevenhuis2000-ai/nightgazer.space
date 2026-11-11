import type { Metadata } from 'next'
import Zwermgids from '../Zwermgids'

export const metadata: Metadata = {
  title:       'Leoniden 2026: wanneer en hoe laat kijken',
  description: 'De Leoniden pieken op 17 november 2026. Het beste kijk je woensdagochtend 18 november rond 6 uur: 4 tot 10 meteoren per uur, de maan is dan onder. Zo zie je ze vanuit Nederland.',
  alternates:  { canonical: '/gidsen/leoniden/' },
  openGraph: {
    title:       'Leoniden 2026: kijk woensdagochtend 18 november rond 6 uur',
    description: 'Hoe laat, waar je kijkt en hoeveel vallende sterren je ziet, voor heel Nederland.',
    url:         '/gidsen/leoniden/',
  },
}

export default function Page() {
  return <Zwermgids slug="leoniden" />
}
