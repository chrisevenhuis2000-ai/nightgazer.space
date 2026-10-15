import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import ArtikelPlaat from './ArtikelPlaat'
import { getAllSlugs } from './generateParams'
import { parseMarkdown, type ArticleData } from '@/lib/article-data'
import { articleCrumbs, breadcrumbList, newsArticle, jsonLd } from '@/lib/structured-data'

export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

/* Eén keer lezen per slug: generateMetadata en de pagina zelf delen dit. */
interface Loaded {
  data: Record<string, unknown>
  article: ArticleData
  publishedAt: string | null
  description: string
}

const cache = new Map<string, Loaded | null>()

function load(slug: string): Loaded | null {
  if (cache.has(slug)) return cache.get(slug)!
  const file = path.join(process.cwd(), 'content', 'articles', `${slug}.md`)
  if (!fs.existsSync(file)) { cache.set(slug, null); return null }
  const raw = fs.readFileSync(file, 'utf8')
  const { data } = matter(raw)
  // Dezelfde parser als de client, zodat server- en client-render gelijk zijn.
  const article = parseMarkdown(raw, slug)

  const ts = data.publishedAt ? new Date(data.publishedAt as string | Date) : null
  const publishedAt = ts && !isNaN(ts.getTime()) ? ts.toISOString() : null

  // Zonder excerpt (zo'n 60% van het archief) de eerste alinea, op een
  // woordgrens afgekapt — net als scripts/generate-index.js. Niets verzonnen.
  const excerpt = String(data.excerpt || '').trim()
  const first = article.paragraphs[0] && article.paragraphs[0] !== 'Dit artikel wordt geladen...' ? article.paragraphs[0] : ''
  const description = excerpt || (first.length > 160 ? `${first.slice(0, 157).replace(/\s+\S*$/, '')}…` : first)

  const loaded = { data, article, publishedAt, description }
  cache.set(slug, loaded)
  return loaded
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const l = load(params.slug)
  if (!l) return {}
  const { article, publishedAt, description } = l
  const canonical = `/nieuws/${params.slug}/`
  return {
    title: article.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      url: canonical,
      ...(publishedAt ? { publishedTime: publishedAt } : {}),
      section: article.category,
      ...(article.tags.length ? { tags: article.tags } : {}),
      ...(article.imageUrl ? { images: [{ url: article.imageUrl, alt: article.title }] } : {}),
    },
  }
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const l = load(params.slug)
  if (!l) return <ArtikelPlaat slug={params.slug} />
  const { data, article, publishedAt, description } = l

  const structured = [
    newsArticle({
      slug: params.slug,
      title: article.title,
      description,
      publishedAt,
      imageUrl: article.imageUrl,
      category: article.category,
      sourceUrl: typeof data.sourceUrl === 'string' && data.sourceUrl.startsWith('http') ? data.sourceUrl : '',
    }),
    breadcrumbList(articleCrumbs(article.title, article.category)),
  ]

  // De verrijking leest alleen de eerste 2500 tekens; meer hoeft niet mee in
  // de payload van elke pagina.
  const initial: ArticleData = { ...article, rawBody: article.rawBody.slice(0, 2500) }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <ArtikelPlaat slug={params.slug} initial={initial} />
    </>
  )
}

