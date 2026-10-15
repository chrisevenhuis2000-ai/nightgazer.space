import type { Metadata } from 'next'
import Niveauladder from './Niveauladder'

export const metadata: Metadata = {
  title:       'Educatie',
  description: 'Leer over astronomie op jouw niveau — van beginner tot pro. Zes onderwerpen, uitleg op drie niveaus, begrippen en een korte quiz.',
  alternates:  { canonical: '/educatie/' },
  openGraph: {
    title:       'Educatie — NightGazer',
    description: 'Astronomie op jouw niveau: één keuze herschrijft alle zes onderwerpen.',
  },
}

export default function Page() {
  return <Niveauladder />
}
