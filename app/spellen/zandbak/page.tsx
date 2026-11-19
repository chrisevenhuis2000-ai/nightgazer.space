import type { Metadata } from 'next'
import Zandbak from './Zandbak'
import { ogBeeld } from '@/lib/og'

export const metadata: Metadata = {
  title:       'Ruimtezandbak: bouw je eigen zonnestelsel',
  description: 'Zet sterren, planeten en manen neer en kijk hoe de zwaartekracht hun banen bepaalt. Met wat-als-vragen: wat als de aarde twee manen had, of als er een ster langs scheert?',
  alternates:  { canonical: '/spellen/zandbak/' },
  openGraph: {
    images:      ogBeeld(),
    title:       'Ruimtezandbak — NightGazer',
    description: 'Bouw je eigen zonnestelsel in pixelstijl en zie de zwaartekracht aan het werk. Wat als de aarde twee manen had?',
    url:         '/spellen/zandbak/',
  },
}

export default function Page() {
  return <Zandbak />
}
