import type { Metadata } from 'next'
import Voorwaarden from './Voorwaarden'

export const metadata: Metadata = {
  title:       'Gebruiksvoorwaarden',
  description: 'De voorwaarden voor het gebruik van nightgazer.space en de NightGazer-accounts op sociale media.',
  alternates:  { canonical: '/voorwaarden/' },
  openGraph: {
    title:       'Gebruiksvoorwaarden — NightGazer',
    description: 'De voorwaarden voor het gebruik van nightgazer.space en de NightGazer-accounts op sociale media.',
    url:         '/voorwaarden/',
  },
}

export default function Page() {
  return <Voorwaarden />
}
