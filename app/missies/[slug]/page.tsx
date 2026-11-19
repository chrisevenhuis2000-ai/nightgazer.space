import { MISSIONS } from '@/lib/missions-data'
import MissionDetailClient from './MissionDetailClient'

export function generateStaticParams() {
  return MISSIONS.map(m => ({ slug: m.id }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const m = MISSIONS.find(x => x.id === params.slug)
  return {
    title: m ? `${m.name} · Ruimtemissies` : 'Missie',
    description: m?.objective ?? '',
    alternates: { canonical: `/missies/${params.slug}/` },
    /* Een losse lancering uit Launch Library is een korte pagina met vooral
       dezelfde velden; die houden we uit Google (en uit de sitemap). De
       pagina blijft bestaan voor wie hem vanuit het manifest opent. */
    ...(m?.soort === 'lancering' ? { robots: { index: false, follow: true } } : {}),
  }
}

export default function MissionPage({ params }: { params: { slug: string } }) {
  return <MissionDetailClient slug={params.slug} />
}
