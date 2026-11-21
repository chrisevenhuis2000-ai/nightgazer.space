import type { Metadata } from 'next'
import Spellen from './Spellen'

export const metadata: Metadata = {
  title:       'Spellen',
  description: 'Dagspellen over de sterrenhemel: raad de ingezoomde ruimtefoto, teken het sterrenbeeld van vanavond, en bouw je eigen zonnestelsel in de ruimtezandbak.',
  alternates:  { canonical: '/spellen/' },
}

export default function Page() {
  return <Spellen />
}
