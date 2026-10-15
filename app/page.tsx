import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import HomePage from './HomePage'
import type { Article } from '@/lib/home-content'

/* Titel, beschrijving en openGraph komen uit de root-layout; hier alleen de
   canonical, zodat /?topic=… en varianten naar de homepage zelf wijzen. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/* De index wordt in prebuild gegenereerd (scripts/generate-index.js), dus hij
   bestaat tijdens de build. De nieuwste platen gaan mee in de statische HTML:
   genoeg voor de hoofdplaat, de zijplaten, de strip en de eerste ledger-rij.
   Zonder dit toonde de HTML de ingebakken FALLBACK_ARTICLES (11 mrt 2026). */
const INITIAL = 40

function readIndex(): { initial: Article[]; total: number } {
  try {
    const file = path.join(process.cwd(), 'public', 'content', 'articles-index.json')
    const all = JSON.parse(fs.readFileSync(file, 'utf8')) as Article[]
    return { initial: all.slice(0, INITIAL), total: all.length }
  } catch {
    return { initial: [], total: 0 }
  }
}

export default function Page() {
  const { initial, total } = readIndex()
  return <HomePage initial={initial} initialTotal={total} />
}
