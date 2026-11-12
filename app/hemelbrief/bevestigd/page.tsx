import type { Metadata } from 'next'
import HemelbriefPagina from '../HemelbriefPagina'

export const metadata: Metadata = {
  title:       'Hemelbrief: Je staat op de lijst',
  alternates:  { canonical: '/hemelbrief/bevestigd/' },
  robots:      { index: false, follow: true },
}

export default function Page() {
  return <HemelbriefPagina soort="bevestigd" />
}
