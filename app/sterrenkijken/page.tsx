import type { Metadata } from 'next'
import Belichtingstabel from './Belichtingstabel'

export const metadata: Metadata = {
  title:       'Sterrenkijken',
  description: 'Kan ik vannacht kijken? Zeven nachten bewolking, maan en wind in één tabel, donkere plekken in Nederland, ISS-overkomsten, noorderlicht en de maankalender.',
  alternates:  { canonical: '/sterrenkijken/' },
  openGraph: {
    title:       'Sterrenkijken — NightGazer',
    description: 'Plan je kijkavond: de beste nacht van de week, donkere plekken, ISS-overkomsten en de maan.',
  },
}

export default function Page() {
  return <Belichtingstabel />
}
