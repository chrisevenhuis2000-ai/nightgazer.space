import type { Metadata } from 'next'
import HemelbriefPagina from './HemelbriefPagina'

export const metadata: Metadata = {
  title:       'De Hemelbrief: elke vrijdag de sterrenhemel in je mail',
  description: 'Gratis wekelijkse mail over de hemel boven Nederland: wat je dat weekend ziet, wanneer het donker is en waar je kijkt. Afmelden kan altijd.',
  alternates:  { canonical: '/hemelbrief/' },
  openGraph: {
    title:       'De Hemelbrief van NightGazer',
    description: 'Elke vrijdag: wat je dat weekend aan de hemel ziet.',
    url:         '/hemelbrief/',
  },
}

export default function Page() {
  return <HemelbriefPagina soort="aanmelden" />
}
