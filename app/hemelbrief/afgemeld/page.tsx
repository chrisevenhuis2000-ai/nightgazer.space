import type { Metadata } from 'next'
import HemelbriefPagina from '../HemelbriefPagina'

export const metadata: Metadata = {
  title:       'Hemelbrief: Je bent afgemeld',
  alternates:  { canonical: '/hemelbrief/afgemeld/' },
  robots:      { index: false, follow: true },
}

export default function Page() {
  return <HemelbriefPagina soort="afgemeld" />
}
