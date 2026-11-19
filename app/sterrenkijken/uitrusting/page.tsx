import type { Metadata } from 'next'
import Uitrusting from './Uitrusting'
import { ogBeeld } from '@/lib/og'

export const metadata: Metadata = {
  title:       'Uitrusting voor sterrenkijken',
  description: 'Wat heb je nodig om te beginnen met sterrenkijken? Van rood lampje en sterrenkaart tot verrekijker, eerste telescoop en boeken.',
  alternates:  { canonical: '/sterrenkijken/uitrusting/' },
  openGraph: {
    images:      ogBeeld('NHQ202508030001', 'Een Perseïde boven Spruce Knob · NASA/Bill Ingalls'),
    title:       'Uitrusting voor sterrenkijken — NightGazer',
    description: 'Van rood lampje tot eerste telescoop: wat je nodig hebt, en waarom.',
    url:         '/sterrenkijken/uitrusting/',
  },
}

export default function Page() {
  return <Uitrusting />
}
