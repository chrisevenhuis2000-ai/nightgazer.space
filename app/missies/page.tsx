import type { Metadata } from 'next'
import Lanceermanifest from './Lanceermanifest'

export const metadata: Metadata = {
  title:       'Ruimtemissies',
  description: 'Volg actieve en geplande ruimtemissies van NASA, ESA, SpaceX en meer. Het lanceermanifest van dit jaar, wat er nu vliegt en wat al gevlogen heeft.',
  alternates:  { canonical: '/missies/' },
  openGraph: {
    title:       'Ruimtemissies — NightGazer',
    description: 'Het lanceermanifest: geplande vluchten, lopende missies en het register van wat al gevlogen heeft.',
  },
}

export default function Page() {
  return <Lanceermanifest />
}
