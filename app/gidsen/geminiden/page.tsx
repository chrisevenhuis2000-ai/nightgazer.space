import type { Metadata } from 'next'
import Zwermgids from '../Zwermgids'

export const metadata: Metadata = {
  title:       'Geminiden 2026: de beste vallende sterren van het jaar',
  description: 'De Geminiden zijn op hun best in de nacht van 13 op 14 december 2026: 49 tot 65 meteoren per uur, het meest rond 4:30, en de maan stoort niet. Zo zie je ze vanuit Nederland.',
  alternates:  { canonical: '/gidsen/geminiden/' },
  openGraph: {
    title:       'Geminiden 2026: de nacht van 13 op 14 december',
    description: 'Hoe laat, waar je kijkt en hoeveel vallende sterren je ziet, voor heel Nederland.',
    url:         '/gidsen/geminiden/',
  },
}

export default function Page() {
  return <Zwermgids slug="geminiden" />
}
