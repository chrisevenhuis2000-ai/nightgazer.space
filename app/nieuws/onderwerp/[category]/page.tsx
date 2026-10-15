import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TOPICS, getTopic } from '@/lib/topics'
import { breadcrumbList, jsonLd } from '@/lib/structured-data'
import NieuwsArchief from '../../NieuwsArchief'

export function generateStaticParams() {
  return TOPICS.map(t => ({ category: t.slug }))
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const topic = getTopic(params.category)
  if (!topic) return {}
  // De root-template voegt "| NightGazer" zelf toe.
  const title = `${topic.label} — Nieuws`
  return {
    title,
    description: topic.description,
    alternates:  { canonical: `/nieuws/onderwerp/${topic.slug}/` },
    openGraph:   { title: `${title} | NightGazer`, description: topic.description, type: 'website' },
  }
}

export default function TopicPage({ params }: { params: { category: string } }) {
  const topic = getTopic(params.category)
  if (!topic) notFound()
  const crumbs = breadcrumbList([
    { name: 'Home', path: '/' },
    { name: 'Nieuws', path: '/nieuws/' },
    { name: topic.label, path: `/nieuws/onderwerp/${topic.slug}/` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }} />
      <NieuwsArchief initialTopic={topic.slug} />
    </>
  )
}
