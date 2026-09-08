import type { Metadata } from 'next'
import StagingHome from './StagingHome'

/* Staging is never indexed and never followed. The live homepage stays the
   canonical one until this rework is promoted. */
export const metadata: Metadata = {
  title: 'Staging — nieuwe homepage',
  description: 'Voorstel voor de nieuwe NightGazer-homepage. Niet live.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: 'https://nightgazer.space/' },
}

export default function StagingPage() {
  return <StagingHome />
}
