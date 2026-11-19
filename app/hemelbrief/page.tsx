import type { Metadata } from 'next'
import HemelbriefPagina from './HemelbriefPagina'
import { ogBeeld } from '@/lib/og'

export const metadata: Metadata = {
  title:       'De Hemelbrief: elke vrijdag de sterrenhemel in je mail',
  description: 'Gratis wekelijkse mail over de hemel boven Nederland: wat je dat weekend ziet, wanneer het donker is en waar je kijkt. Afmelden kan altijd.',
  alternates:  { canonical: '/hemelbrief/' },
  openGraph: {
    images:      ogBeeld('NHQ202108110001', 'De Melkweg met een Perseïde boven Spruce Knob · NASA/Bill Ingalls'),
    title:       'De Hemelbrief van NightGazer',
    description: 'Elke vrijdag: wat je dat weekend aan de hemel ziet.',
    url:         '/hemelbrief/',
  },
}

export default function Page() {
  return <HemelbriefPagina soort="aanmelden" />
}
