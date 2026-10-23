import type { Metadata } from 'next'
import { SiteNav } from '@/app/components/SiteNav'
import { XPosten } from './XPosten'

// Werkpagina voor Crix, niet voor bezoekers: niet in de sitemap en niet in
// zoekmachines. Er staat niets op wat niet al openbaar is.
export const metadata: Metadata = {
  title:  'Op X plaatsen',
  robots: { index: false, follow: false },
}

export default function XPage() {
  return (
    <>
      <SiteNav />
      <main className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', paddingTop: 48, paddingBottom: 80 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 8 }}>
          Op X plaatsen
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 640, marginBottom: 32 }}>
          Nieuwste artikelen eerst. De knop opent X met de titel en de link al ingevuld; jij drukt
          daar op Posten. Dat gaat via je eigen account en kost niets. Wat je hier aanklikt, wordt in
          deze browser als geplaatst onthouden.
        </p>
        <XPosten />
      </main>
    </>
  )
}
