import type { Metadata } from 'next'
import ArtikelStaging from './ArtikelStaging'

export const metadata: Metadata = {
  title: 'Staging — artikel',
  description: 'Voorstel voor de nieuwe NightGazer-artikelpagina. Niet live.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

export default function Page() {
  return <ArtikelStaging />
}
