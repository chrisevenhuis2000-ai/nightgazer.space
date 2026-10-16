/* De artikelindex tijdens de build (alleen server: leest het bestand).
   scripts/generate-index.js schrijft hem in prebuild, nieuwste eerst.

   Pagina's geven een deel ervan mee aan de client-component, zodat de
   statische HTML de echte nieuwste artikelen toont (crawlers zonder JS zien
   de actuele lijst). De volledige index (~280 kB) gaat niet mee in de HTML;
   die haalt de browser daarna zelf op. Tot dan kloppen totalen, tellingen en
   plaatnummers via `perCategorie`, `totaal` en `posities`. */
import fs from 'fs'
import path from 'path'
import type { Article } from './home-content'

export interface Startset {
  /** De nieuwste artikelen (en bij een onderwerp ook de nieuwste daarvan). */
  initial:      Article[]
  /** Plaats van elk startartikel in de volledige index (voor plaatnummers). */
  posities:     Record<string, number>
  /** Aantal artikelen per categorie in de volledige index. */
  perCategorie: Record<string, number>
  totaal:       number
}

export function leesIndex(): Article[] {
  try {
    const file = path.join(process.cwd(), 'public', 'content', 'articles-index.json')
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const slugVan = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function startset(n = 40, onderwerp?: string, alle: Article[] = leesIndex()): Startset {
  const gekozen = new Set(alle.slice(0, n).map(a => a.slug))
  if (onderwerp) {
    alle.filter(a => slugVan(a.category) === onderwerp).slice(0, n).forEach(a => gekozen.add(a.slug))
  }
  const posities: Record<string, number> = {}
  const initial: Article[] = []
  alle.forEach((a, i) => { if (gekozen.has(a.slug)) { posities[a.slug] = i; initial.push(a) } })
  const perCategorie: Record<string, number> = {}
  for (const a of alle) perCategorie[a.category] = (perCategorie[a.category] || 0) + 1
  return { initial, posities, perCategorie, totaal: alle.length }
}
