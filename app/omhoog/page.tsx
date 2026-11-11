import type { Metadata } from 'next'
import Omhoog from './Omhoog'

export const metadata: Metadata = {
  title:       '30 nachten omhoog',
  description: 'Van de Leoniden tot de Geminiden: van 16 november tot 15 december elke avond één ding om te zien boven Nederland, met afvinkkaart en een gezamenlijke telling van de Geminiden.',
  alternates:  { canonical: '/omhoog/' },
  openGraph: {
    title:       '30 nachten omhoog — NightGazer',
    description: 'Elke avond één ding om te zien boven Nederland, van de Leoniden tot de Geminiden. Vink af wat je zag en tel mee op 13 december.',
    url:         '/omhoog/',
  },
}

export default function Page() {
  return <Omhoog />
}
