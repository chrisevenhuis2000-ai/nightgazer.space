import type { Metadata } from 'next'
import EersteTelescoop from './EersteTelescoop'

export const metadata: Metadata = {
  title:       'Je eerste telescoop kiezen',
  description: 'Welke telescoop koop je als beginner? Waarom opening belangrijker is dan vergroting, wat je per opening ziet, en welke telescoop bij jou past.',
  alternates:  { canonical: '/sterrenkijken/eerste-telescoop/' },
  openGraph: {
    title:       'Je eerste telescoop kiezen — NightGazer',
    description: 'Opening boven vergroting: wat je echt ziet met 130, 152 en 200 mm, en welke telescoop bij jou past.',
    url:         '/sterrenkijken/eerste-telescoop/',
  },
}

export default function Page() {
  return <EersteTelescoop />
}
