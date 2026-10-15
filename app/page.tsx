import type { Metadata } from 'next'
import HomePage from './HomePage'

/* Titel, beschrijving en openGraph komen uit de root-layout; hier alleen de
   canonical, zodat /?topic=… en varianten naar de homepage zelf wijzen. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function Page() {
  return <HomePage />
}
