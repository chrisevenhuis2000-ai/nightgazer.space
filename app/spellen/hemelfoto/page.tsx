import type { Metadata } from 'next'
import Hemelfoto from './Hemelfoto'

export const metadata: Metadata = {
  title:       'Raad de hemelfoto',
  description: 'Elke dag één echte ruimtefoto, ver ingezoomd. Raad wat het is in zes pogingen, en lees daarna hoe je het zelf aan de hemel vindt.',
  alternates:  { canonical: '/spellen/hemelfoto/' },
  openGraph: {
    title:       'Raad de hemelfoto — NightGazer',
    description: 'Eén echte NASA-foto per dag, ver ingezoomd. Herken jij hem in zes pogingen?',
    url:         '/spellen/hemelfoto/',
  },
}

export default function Page() {
  return <Hemelfoto />
}
