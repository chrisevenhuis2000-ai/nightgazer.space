import type { Metadata } from 'next'
import Uitrusting from './Uitrusting'

export const metadata: Metadata = {
  title:       'Uitrusting voor sterrenkijken',
  description: 'Wat heb je nodig om te beginnen met sterrenkijken? Van rood lampje en sterrenkaart tot verrekijker, eerste telescoop en boeken.',
  alternates:  { canonical: '/sterrenkijken/uitrusting/' },
  openGraph: {
    title:       'Uitrusting voor sterrenkijken — NightGazer',
    description: 'Van rood lampje tot eerste telescoop: wat je nodig hebt, en waarom.',
    url:         '/sterrenkijken/uitrusting/',
  },
}

export default function Page() {
  return <Uitrusting />
}
