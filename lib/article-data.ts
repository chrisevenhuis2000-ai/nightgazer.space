// ── Gedeelde artikel-logica ────────────────────────────────────────────────
// Gebruikt door de artikelpagina (app/nieuws/[slug]/ArtikelPlaat.tsx): types,
// proxy, beeld-URL en de markdown-parser.

// ── Types ──────────────────────────────────────────────────────────────────

export interface ArticleData {
  title:       string
  category:    string
  catColor:    string
  author:      string
  role:        string
  date:        string
  readTime:    number
  imageUrl:    string
  imageCredit: string
  tags:        string[]
  paragraphs:  string[]
  rawBody:     string
  /** Oorspronkelijke bron (frontmatter `source`/`sourceUrl`), onderaan getoond. */
  source:      string
  sourceUrl:   string
  imageAlt:    string
  /** De leesvolgorde: alinea's (index in `paragraphs`) en tussenkoppen. */
  blocks:      Block[]
  /** Statisch, door de nieuwsbot geschreven; leeg bij oudere artikelen. */
  kernpunten:  string[]
  kerncijfers: Kerncijfer[]
  citaat:      Citaat | null
}

export type Block =
  | { t: 'p'; i: number }
  | { t: 'h'; text: string; id: string }

export interface Kerncijfer { waarde: string; eenheid: string; label: string }
export interface Citaat     { tekst: string; wie: string }

export interface Enrichment {
  kerncijfers: { value: string; label: string; unit: string }[]
  kernfeiten:  string[]
  quote:       { text: string; author: string } | null
  headings:    string[]
}

export const CAT_COLORS: Record<string, string> = {
  'james-webb':    '#7aadff',
  'kosmologie':    '#c080ff',
  'cosmology':     '#c080ff',
  'missies':       '#3dcfdf',
  'missions':      '#3dcfdf',
  'mars':          '#ff8a60',
  'sterrenkijken': '#d4a84b',
  'observing':     '#d4a84b',
  'educatie':      '#3ddf90',
  'education':     '#3ddf90',
  'default':       '#7aadff',
}

export const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'
export const IMG   = (url: string, w?: number, _h?: number) =>
  `${PROXY}/image-proxy?url=${encodeURIComponent(url)}${w ? `&w=${w}` : ''}`

/* Kernpunten, kerncijfers en citaat staan als JSON op één frontmatterregel:
   geldige YAML voor gray-matter en simpel genoeg voor deze parser. */
function json<T>(v: string | undefined, fallback: T): T {
  if (!v) return fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

// ── Markdown parser ────────────────────────────────────────────────────────

export function parseMarkdown(raw: string, slug: string): ArticleData {
  // Normalise line endings (files may use \r\n on Windows)
  raw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  const fm: Record<string, string> = {}
  let body = raw

  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) return
      const key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key) fm[key] = val
    })
    body = fmMatch[2]
  }

  // Parse tags array from frontmatter
  let tags: string[] = []
  if (fmMatch) {
    const tagsLine = fmMatch[1].match(/^tags:\s*\[([^\]]*)\]/m)
    if (tagsLine) tags = tagsLine[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  }

  // Tussenkoppen (`## …`) blijven als eigen blok staan; alleen alinea's gaan
  // door de herschrijving op leesniveau.
  const paragraphs: string[] = []
  const blocks: Block[] = []
  const ids = new Set<string>()
  for (const chunk of body.split(/\n\n+/).map(p => p.trim())) {
    const h = chunk.match(/^#{2,3}\s+(.+)$/)
    if (h && !chunk.includes('\n')) {
      const text = h[1].replace(/\*/g, '').trim()
      let id = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sectie'
      while (ids.has(id)) id += '-2'
      ids.add(id)
      blocks.push({ t: 'h', text, id })
      continue
    }
    if (chunk.length <= 30 || chunk.startsWith('#') || chunk.startsWith('|') || chunk.startsWith('---') || chunk.startsWith('>')) continue
    blocks.push({ t: 'p', i: paragraphs.length })
    paragraphs.push(chunk.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^[-*]\s/, ''))
  }

  const category = fm.category || 'Astronomie'
  let date = fm.publishedAt || ''
  if (date) {
    // Vaste tijdzone: de build draait in UTC, de lezer in Nederland. Zonder
    // dit krijgt een artikel van 23:30 UTC op de server een andere datum dan
    // in de browser, en dat geeft een hydratie-mismatch.
    try { date = new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }) } catch {}
  }

  return {
    title:       fm.title       || slug.replace(/-/g, ' '),
    category,
    catColor:    CAT_COLORS[category.toLowerCase()] || CAT_COLORS['default'],
    author:      'Redactie NightGazer',
    role:        'NightGazer Redactie',
    date,
    readTime:    parseInt(fm.readTime) || 4,
    imageUrl:    fm.imageUrl    || '',
    imageCredit: fm.imageCredit || '',
    tags:        tags.slice(0, 6),
    paragraphs:  paragraphs.length ? paragraphs : ['Dit artikel wordt geladen...'],
    blocks:      paragraphs.length ? blocks : [{ t: 'p', i: 0 }],
    rawBody:     body,
    source:      fm.source || '',
    sourceUrl:   /^https?:\/\//.test(fm.sourceUrl || '') ? fm.sourceUrl : '',
    imageAlt:    fm.imageAlt    || '',
    kernpunten:  json<unknown[]>(fm.kernpunten, []).filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, 4),
    kerncijfers: json<Partial<Kerncijfer>[]>(fm.kerncijfers, [])
      .filter(k => k && typeof k.waarde === 'string' && typeof k.label === 'string')
      .map(k => ({ waarde: k.waarde!, label: k.label!, eenheid: typeof k.eenheid === 'string' ? k.eenheid : '' }))
      .slice(0, 3),
    citaat:      (() => {
      const c = json<Partial<Citaat> | null>(fm.citaat, null)
      return c && typeof c.tekst === 'string' && c.tekst.trim() ? { tekst: c.tekst.trim(), wie: typeof c.wie === 'string' ? c.wie : '' } : null
    })(),
  }
}

