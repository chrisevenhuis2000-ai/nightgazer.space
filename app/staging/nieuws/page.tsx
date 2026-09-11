import type { Metadata } from 'next'
import NieuwsStaging from './NieuwsStaging'

/* Staging wordt nooit geïndexeerd. De live /nieuws blijft canoniek tot deze
   rework is goedgekeurd. */
export const metadata: Metadata = {
  title: 'Staging — nieuwsarchief',
  description: 'Voorstel voor de nieuwe NightGazer-nieuwspagina. Niet live.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: 'https://nightgazer.space/nieuws/' },
}

export default function Page() {
  return <NieuwsStaging />
}
