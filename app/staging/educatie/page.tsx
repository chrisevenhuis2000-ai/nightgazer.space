import type { Metadata } from 'next'
import EducatieStaging from './EducatieStaging'

export const metadata: Metadata = {
  title: 'Staging — educatie',
  description: 'Voorstel voor de nieuwe NightGazer-educatiepagina. Niet live.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: 'https://nightgazer.space/educatie/' },
}

export default function Page() {
  return <EducatieStaging />
}
