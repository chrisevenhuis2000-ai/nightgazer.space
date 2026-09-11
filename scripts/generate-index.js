const fs   = require('fs')
const path = require('path')

const ARTICLES_DIR = path.join(__dirname, '../content/articles')
const OUTPUT       = path.join(__dirname, '../public/content/articles-index.json')

const CAT_COLORS = {
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
  'maan':          '#c9d2ea',
  'kometen':       '#f4c26b',
  'zwarte-gaten':  '#9a9ad0',
  'exoplaneten':   '#3ddfcf',
}

const CAT_EMOJI = {
  'james-webb':    '🔭',
  'kosmologie':    '💫',
  'cosmology':     '💫',
  'missies':       '🚀',
  'missions':      '🚀',
  'mars':          '🔴',
  'sterrenkijken': '☄️',
  'observing':     '☄️',
  'educatie':      '⭐',
  'education':     '⭐',
  'maan':          '🌙',
  'kometen':       '☄️',
  'zwarte-gaten':  '⚫',
  'exoplaneten':   '🪐',
}

const CAT_BG = {
  'james-webb':    'linear-gradient(135deg,#0a1030,#1a2860)',
  'kosmologie':    'linear-gradient(135deg,#0f0520,#1a0a35)',
  'cosmology':     'linear-gradient(135deg,#0f0520,#1a0a35)',
  'missies':       'linear-gradient(135deg,#051a20,#0a3040)',
  'missions':      'linear-gradient(135deg,#051a20,#0a3040)',
  'mars':          'linear-gradient(135deg,#1a0a05,#3a1510)',
  'sterrenkijken': 'linear-gradient(135deg,#1a1505,#2a2010)',
  'observing':     'linear-gradient(135deg,#1a1505,#2a2010)',
  'educatie':      'linear-gradient(135deg,#051a10,#0a2a1a)',
  'education':     'linear-gradient(135deg,#051a10,#0a2a1a)',
  'maan':          'linear-gradient(135deg,#12141f,#242a45)',
  'kometen':       'linear-gradient(135deg,#1a1206,#3a2810)',
  'zwarte-gaten':  'linear-gradient(135deg,#050508,#15151f)',
  'exoplaneten':   'linear-gradient(135deg,#051a18,#0a3028)',
}

function parseFrontmatter(raw) {
  // Normalise line endings (files may have \r\n on Windows)
  const normalised = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const match = normalised.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key) fm[key] = val
  })
  return fm
}

/**
 * Leid een inleiding af uit de body wanneer de frontmatter er geen heeft.
 * 60% van het archief komt binnen zonder excerpt, terwijl de tekst zelf er
 * wel is — zonder dit blijft elke kaart en elke archiefregel een kop zonder
 * context. Verzint niets: het is letterlijk de eerste alinea, ingekort.
 */
function deriveExcerpt(raw, max = 170) {
  const normalised = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const body = normalised.replace(/^---\n[\s\S]*?\n---\n?/, '')

  const plain = body
    .replace(/^\s*!\[[^\]]*\]\([^)]*\)\s*$/gm, '')  // losse afbeeldingen
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')             // inline afbeeldingen
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')           // links -> linktekst
    .replace(/^#{1,6}\s+.*$/gm, '')                     // koppen
    .replace(/^\s*>\s?/gm, '')                          // citaten
    .replace(/^\s*[-*+]\s+/gm, '')                      // lijstbullets
    .replace(/`{1,3}[^`]*`{1,3}/g, '')                   // code
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')        // nadruk
    .replace(/\s+/g, ' ')
    .trim()

  if (!plain) return ''
  if (plain.length <= max) return plain

  const cut = plain.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '') + '…'
}

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))

const articles = files.map(file => {
  const slug = file.replace('.md', '')
  const raw  = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8')
  const fm   = parseFrontmatter(raw)
  const cat  = (fm.category || 'nieuws').toLowerCase()

  return {
    slug,
    title:       fm.title    || slug.replace(/-/g, ' '),
    excerpt:     (fm.excerpt && fm.excerpt.trim()) || deriveExcerpt(raw),
    category:    fm.category || 'Nieuws',
    catColor:    CAT_COLORS[cat]  || '#7aadff',
    emoji:       CAT_EMOJI[cat]   || '🌌',
    bgColor:     CAT_BG[cat]      || 'linear-gradient(135deg,#0a1030,#1a2860)',
    author:      fm.author   || 'Redactie CosmosNL',
    date:        fm.publishedAt ? new Date(fm.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    readTime:    parseInt(fm.readTime) || 3,
    featured:    fm.featured === 'true',
    imageUrl:    fm.imageUrl || '',
    publishedAt: fm.publishedAt || '2026-01-01T00:00:00.000Z',
  }
}).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

fs.writeFileSync(OUTPUT, JSON.stringify(articles, null, 2))
console.log(`✅ articles-index.json gegenereerd met ${articles.length} artikelen`)
