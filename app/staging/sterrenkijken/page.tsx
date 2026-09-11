import type { Metadata } from 'next'
import SterrenkijkenStaging from './SterrenkijkenStaging'

export const metadata: Metadata = {
  title: 'Staging — sterrenkijken',
  description: 'Voorstel voor de nieuwe NightGazer-sterrenkijkpagina. Niet live.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: 'https://nightgazer.space/sterrenkijken/' },
}

export default function Page() {
  return <SterrenkijkenStaging />
}
