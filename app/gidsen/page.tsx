import type { Metadata } from 'next'
import Gidsen from './Gidsen'

export const metadata: Metadata = {
  title:       'Gidsen voor sterrenkijkers',
  description: 'Je eerste telescoop kiezen, cadeaus voor sterrenkijkers, wat je nodig hebt om meer te zien en de Hemelkalender 2027.',
  alternates:  { canonical: '/gidsen/' },
}

export default function Page() {
  return <Gidsen />
}
