import type { Metadata } from 'next'
import HomePage from './HomePage'
import { startset } from '@/lib/article-index'

/* Titel, beschrijving en openGraph komen uit de root-layout; hier alleen de
   canonical, zodat /?topic=… en varianten naar de homepage zelf wijzen. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/* De nieuwste platen gaan mee in de statische HTML: genoeg voor de
   hoofdplaat, de zijplaten, de strip en de eerste ledger-rij. */
const INITIAL = 40

export default function Page() {
  return <HomePage start={startset(INITIAL)} />
}
