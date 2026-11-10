import type { Metadata } from 'next'
import Hemelkalender from './Hemelkalender'

export const metadata: Metadata = {
  title:       'Hemelkalender 2027',
  description: 'De sterrenhemel boven Nederland in 2027 als A4-wandkalender: elke nacht de maan, per maand de planeten, meteorenzwermen en verduisteringen, met een NASA-beeld per maand. PDF voor €4.',
  alternates:  { canonical: '/sterrenkijken/hemelkalender/' },
  openGraph: {
    title:       'Hemelkalender 2027 — NightGazer',
    description: 'Elke nacht de maan en per maand wat er boven Nederland te zien is, met een NASA-beeld per maand. PDF, 14 pagina’s A4.',
    url:         '/sterrenkijken/hemelkalender/',
    images:      ['/hemelkalender/voorblad.jpg'],
  },
}

export default function Page() {
  return <Hemelkalender />
}
