// ── Structured data (JSON-LD) ──────────────────────────────────────────────
// NewsArticle voor artikelpagina's, BreadcrumbList voor artikel- en
// onderwerp-pagina's. Alles wat hier staat komt uit de frontmatter of uit
// lib/topics.ts; niets wordt erbij verzonnen (geen dateModified, geen
// persoonlijke auteur — de artikelen worden automatisch herschreven).

import { getTopic } from './topics'

export const SITE = 'https://nightgazer.space'

const PUBLISHER = {
  '@type': 'Organization',
  name: 'NightGazer',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/logo-transparent.png` },
}

export interface Crumb { name: string; path?: string }

export function breadcrumbList(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: `${SITE}${c.path}` } : {}),
    })),
  }
}

/** Kruimelpad van een artikel: Home › Nieuws › [onderwerp, als die pagina bestaat] › titel. */
export function articleCrumbs(title: string, category: string): Crumb[] {
  const topic = getTopic((category || '').toLowerCase())
  return [
    { name: 'Home', path: '/' },
    { name: 'Nieuws', path: '/nieuws/' },
    ...(topic ? [{ name: topic.label, path: `/nieuws/onderwerp/${topic.slug}/` }] : []),
    { name: title },
  ]
}

export function newsArticle(a: {
  slug: string
  title: string
  description: string
  publishedAt: string | null
  imageUrl: string
  category: string
  sourceUrl: string
}) {
  const url = `${SITE}/nieuws/${a.slug}/`
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title.length > 110 ? `${a.title.slice(0, 109)}…` : a.title,
    ...(a.description ? { description: a.description } : {}),
    ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
    ...(a.imageUrl ? { image: [a.imageUrl] } : {}),
    inLanguage: 'nl',
    articleSection: a.category,
    author: { '@type': 'Organization', name: 'NightGazer', url: `${SITE}/` },
    publisher: PUBLISHER,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    ...(a.sourceUrl ? { isBasedOn: a.sourceUrl } : {}),
  }
}

/** Serialiseert voor een <script type="application/ld+json">; `<` wordt
 *  ge-escaped zodat tekst uit een artikel het script-element nooit kan sluiten. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
