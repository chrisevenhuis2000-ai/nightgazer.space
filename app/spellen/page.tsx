import type { Metadata } from 'next'
import Spellen from './Spellen'

export const metadata: Metadata = {
  title:       'Spellen',
  description: 'Twee dagspellen: raad de ingezoomde ruimtefoto en teken het sterrenbeeld dat vanavond boven Nederland staat.',
  alternates:  { canonical: '/spellen/' },
}

export default function Page() {
  return <Spellen />
}
