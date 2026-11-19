import type { Metadata } from 'next'
import Belichtingstabel from './Belichtingstabel'
import { ogBeeld } from '@/lib/og'

export const metadata: Metadata = {
  title:       'Sterrenkijken',
  description: 'Wordt het helder vannacht? Live hemelweer per uur: wolken per laag, doorzicht, seeing, dauw en de maan, het beste kijkvenster en zeven nachten vooruit. Plus donkere plekken, ISS-overkomsten en noorderlicht.',
  alternates:  { canonical: '/sterrenkijken/' },
  openGraph: {
    images:      ogBeeld(),
    title:       'Sterrenkijken — NightGazer',
    description: 'Plan je kijkavond: de beste nacht van de week, donkere plekken, ISS-overkomsten en de maan.',
  },
}

export default function Page() {
  return <Belichtingstabel />
}
