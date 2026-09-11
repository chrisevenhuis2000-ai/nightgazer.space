import type { Metadata } from 'next'
import MissiesStaging from './MissiesStaging'

export const metadata: Metadata = {
  title: 'Staging — lanceermanifest',
  description: 'Voorstel voor de nieuwe NightGazer-missiepagina. Niet live.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: 'https://nightgazer.space/missies/' },
}

export default function Page() {
  return <MissiesStaging />
}
