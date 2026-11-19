import type { Metadata } from 'next'
import NieuwsArchief from './NieuwsArchief'
import { startset } from '@/lib/article-index'
import { ogBeeld } from '@/lib/og'

export const metadata: Metadata = {
  title:       'Nieuws',
  description: 'Het laatste astronomie- en ruimtevaartnieuws in het Nederlands. Dagelijks bijgewerkt met artikelen over NASA, ESA, JWST en meer.',
  alternates:  { canonical: '/nieuws/' },
  openGraph: {
    images:      ogBeeld(),
    title:       'Nieuws — NightGazer',
    description: 'Dagelijks astronomie- en ruimtevaartnieuws in het Nederlands.',
  },
}

export default function Page() {
  return <NieuwsArchief start={startset()} />
}
