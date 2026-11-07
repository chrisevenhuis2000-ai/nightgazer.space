import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import Vandaag from './Vandaag'
import { leesIndex } from '@/lib/article-index'
import { nuInNederland, type DagmapItem, type DagmapRegel } from '@/lib/dagmap'

/* /vandaag: waar de Instagram-bio naartoe wijst. Bovenaan het artikel van de
   carrousel van vandaag, daaronder de vorige. Geen indexering: de pagina is
   een doorgang, de artikelen zelf zijn de inhoud. */

export const metadata: Metadata = {
  title:       'Vandaag op Instagram',
  description: 'Het artikel bij de Nightgazer-post van vandaag, en de posts van de afgelopen dagen.',
  alternates:  { canonical: '/vandaag/' },
  robots:      { index: false, follow: true },
}

function leesDagmap(): DagmapRegel[] {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'dagmap.json'), 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default function Page() {
  const index = leesIndex()
  const bySlug = new Map(index.map(a => [a.slug, a]))
  const items: DagmapItem[] = []
  for (const r of leesDagmap()) {
    const a = bySlug.get(r.slug)
    if (!a) continue // artikel verwijderd of hernoemd: niet naar een 404 sturen
    items.push({ ...r, title: a.title, excerpt: a.excerpt, imageUrl: a.imageUrl })
  }
  // Valt terug op het nieuwste nieuws als er (nog) geen carrousel live is.
  const nieuwste = index.slice(0, 7).map(a => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, imageUrl: a.imageUrl, datum: a.publishedAt?.slice(0, 10) }))
  return <Vandaag items={items} nieuwste={nieuwste} gebouwd={nuInNederland()} />
}
