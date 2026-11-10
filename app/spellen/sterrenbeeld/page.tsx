import type { Metadata } from 'next'
import Sterrenbeeld from './Sterrenbeeld'

export const metadata: Metadata = {
  title:       'Teken het sterrenbeeld van vannacht',
  description: 'Elke dag een sterrenbeeld dat vanavond echt boven Nederland staat. Verbind de sterren, lees het verhaal en ontdek waar je het buiten vindt.',
  alternates:  { canonical: '/spellen/sterrenbeeld/' },
  openGraph: {
    title:       'Teken het sterrenbeeld van vannacht — NightGazer',
    description: 'Verbind de sterren van een sterrenbeeld dat vanavond boven Nederland staat, in precies de stand die je buiten ziet.',
    url:         '/spellen/sterrenbeeld/',
  },
}

export default function Page() {
  return <Sterrenbeeld />
}
