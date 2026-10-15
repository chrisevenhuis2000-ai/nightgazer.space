import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import ArtikelPlaat from './ArtikelPlaat'
import { getAllSlugs } from './generateParams'

export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const file = path.join(process.cwd(), 'content', 'articles', `${params.slug}.md`)
  if (!fs.existsSync(file)) return {}
  const { data } = matter(fs.readFileSync(file, 'utf8'))
  const title   = data.title || params.slug.replace(/-/g, ' ')
  const excerpt = data.excerpt || ''
  return {
    title,
    description: excerpt,
    openGraph: {
      title,
      description: excerpt,
      type: 'article',
      ...(data.imageUrl ? { images: [{ url: data.imageUrl }] } : {}),
    },
  }
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return <ArtikelPlaat slug={params.slug} />
}
