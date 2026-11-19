import type { Metadata } from 'next'
import Cadeaugids from './Cadeaugids'
import { ogBeeld } from '@/lib/og'

export const metadata: Metadata = {
  title:       'Cadeaus voor sterrenkijkers',
  description: 'Een cadeau voor iemand die graag naar de sterren kijkt? Eerlijke aanraders per prijsklasse, van rood lampje tot eerste telescoop, en wat je beter niet geeft.',
  alternates:  { canonical: '/sterrenkijken/cadeaugids/' },
  openGraph: {
    images:      ogBeeld('NHQ202108110005', 'De Perseïden boven Spruce Knob · NASA/Bill Ingalls'),
    title:       'Cadeaus voor sterrenkijkers — NightGazer',
    description: 'Per prijsklasse: wat een sterrenkijker echt gebruikt, voor wie het past, en wat je beter niet geeft.',
    url:         '/sterrenkijken/cadeaugids/',
  },
}

export default function Page() {
  return <Cadeaugids />
}
