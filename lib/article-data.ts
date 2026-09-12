// ── Gedeelde artikel-logica ────────────────────────────────────────────────
// Uit app/nieuws/[slug]/ArticleClient.tsx getrokken zodat de live pagina en
// de /staging-rework dezelfde markdown op dezelfde manier lezen.

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
}

export interface Enrichment {
  kerncijfers: { value: string; label: string; unit: string }[]
  kernfeiten:  string[]
  quote:       { text: string; author: string } | null
  headings:    string[]
}

export interface RelatedItem {
  slug:     string
  title:    string
  category: string
  imageUrl: string
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

  const paragraphs = body
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 30 && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('---') && !p.startsWith('>'))
    .map(p => p.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^[-*]\s/, ''))

  const category = fm.category || 'Astronomie'
  let date = fm.publishedAt || ''
  if (date) {
    try { date = new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) } catch {}
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
    rawBody:     body,
  }
}

