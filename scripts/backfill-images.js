#!/usr/bin/env node
/**
 * scripts/backfill-images.js
 *
 * Run: npm run backfill-images
 * Run: npm run backfill-images -- --force   (re-fetch even if imageUrl already set)
 *
 * Voor elk artikel:
 *  1. Scrape og:image van de bronpagina (sourceUrl in frontmatter)
 *  2. Als dat mislukt: gebruik Claude (via CF Worker) om een gerichte zoekterm te
 *     genereren en haal een afbeelding op via NASA / Pexels
 */

const fs   = require('fs')
const path = require('path')

const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles')
const PROXY        = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'
const FORCE        = process.argv.includes('--force')

// Only accept URLs that are definitely images (not GIFs, not extensionless)
function isValidImageUrl(url) {
  if (!url) return false
  try {
    const path = new URL(url).pathname.toLowerCase()
    return /\.(jpg|jpeg|png|webp)(\?|$)/.test(path)
  } catch {
    return false
  }
}

// ── og:image scraping ─────────────────────────────────────────────────────────

function parseOgImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) {
      const url = m[1].trim()
      if (url.startsWith('http')) return url
      if (url.startsWith('//')) return 'https:' + url
      if (url.startsWith('/') && baseUrl) {
        try { return new URL(url, baseUrl).href } catch {}
      }
      return url
    }
  }
  return null
}

async function fetchOgImage(sourceUrl) {
  if (!sourceUrl) return null
  try {
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CosmosNLBot/1.0)' },
      signal:  AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return parseOgImage(html, sourceUrl)
  } catch (e) {
    console.warn(`  ⚠ og:image fetch error: ${e.message}`)
    return null
  }
}

// ── CF Worker fallback (Claude query + NASA/Pexels) ───────────────────────────

const CAT_QUERIES = {
  'missies':       'rocket launch spacecraft',
  'james-webb':    'james webb space telescope infrared',
  'kosmologie':    'galaxy nebula deep space cosmos',
  'mars':          'mars red planet surface rover',
  'sterrenkijken': 'night sky stars milky way',
  'educatie':      'astronaut earth orbit space station',
  'maan':          'moon lunar surface craters',
  'kometen':       'comet astronomy solar system',
  'komeet':        'comet astronomy solar system',
  'zon':           'sun solar flare corona',
  'planeten':      'planet solar system',
}

function slugHash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function stripMarkdown(md) {
  return md
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*?([^*\n]+)\*\*?/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/^\s*[-*+>]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function getQueryFromClaude(title, body) {
  const plainText = stripMarkdown(body).slice(0, 2500)
  const payload = {
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 20,
    system:     'You generate English image search queries for NASA or Pexels. Reply with ONLY 3-5 keywords on a single line — no explanation, no quotes, no newlines.',
    messages:   [{ role: 'user', content: `Dutch article title: ${title}\n\nContent:\n${plainText}` }],
  }
  try {
    const res   = await fetch(PROXY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data  = await res.json()
    const raw   = data?.content?.[0]?.text
    if (raw) {
      const q = raw.split(/[\n\r]/)[0].trim().replace(/\s+/g, ' ').slice(0, 80)
      if (q.length >= 3) return q
    }
  } catch {}
  return null
}

async function tryWorker(q, hash) {
  const url = `${PROXY}/image-search?q=${encodeURIComponent(q)}&hash=${hash}&page=1`
  try {
    const res  = await fetch(url)
    const data = await res.json()
    if (data.url) return { imageUrl: data.url, imageCredit: data.credit || 'NASA' }
  } catch {}
  return null
}

async function fetchViaWorker(slug, title, body, category) {
  const hash        = slugHash(slug)
  const claudeQuery = await getQueryFromClaude(title, body)
  const catQuery    = CAT_QUERIES[(category || '').toLowerCase()] || 'space astronomy cosmos stars'
  const shortQuery  = claudeQuery ? claudeQuery.split(' ').slice(0, 3).join(' ') : null

  const attempts = [claudeQuery, shortQuery, catQuery].filter(Boolean)
  for (const q of attempts) {
    const result = await tryWorker(q, hash)
    if (result) return { ...result, usedQuery: q }
    await new Promise(r => setTimeout(r, 300))
  }
  return null
}

// ── Frontmatter helpers ───────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const normalised = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const match = normalised.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { fm: {}, body: normalised }
  const fmRaw = match[1]
  const body  = match[2]
  const fm    = {}
  fmRaw.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
    fm[key] = val
  })
  return { fm, body }
}

function rebuildFrontmatter(fm) {
  return Object.entries(fm).map(([k, v]) => {
    // Lijsten en JSON-objecten (kernpunten, kerncijfers, citaat) ongemoeid laten.
    if (v === '[]' || (v.startsWith('[') && v.endsWith(']')) || (v.startsWith('{') && v.endsWith('}'))) return `${k}: ${v}`
    return `${k}: "${String(v).replace(/"/g, '\\"')}"`
  }).join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))
  let updated = 0
  let skipped = 0
  let failed  = 0

  console.log(`🔭 Backfill images — ${files.length} artikelen${FORCE ? ' (--force)' : ''}\n`)

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file)
    const raw      = fs.readFileSync(filePath, 'utf-8')
    const { fm, body } = parseFrontmatter(raw)

    if (!FORCE && fm.imageUrl && fm.imageUrl.trim() !== '') {
      process.stdout.write('.')
      skipped++
      continue
    }

    const slug      = file.replace('.md', '')
    const title     = fm.title || slug.replace(/-/g, ' ')
    const category  = fm.category || ''
    const sourceUrl = fm.sourceUrl || ''

    console.log(`\n  📄 ${title.slice(0, 60)}`)

    // Stap 1: scrape og:image van de originele bronpagina
    let imageUrl    = null
    let imageCredit = fm.source || 'Bron'

    if (sourceUrl) {
      const rawOg = await fetchOgImage(sourceUrl)
      imageUrl = (rawOg && isValidImageUrl(rawOg)) ? rawOg : null
      if (imageUrl) {
        console.log(`  🌐 og:image: ${imageUrl.slice(0, 70)}`)
      }
    }

    // Stap 2: fallback naar CF Worker (Claude-query + NASA/Pexels)
    if (!imageUrl) {
      console.log(`  🔍 Geen og:image — zoeken via Worker...`)
      const workerResult = await fetchViaWorker(slug, title, body, category)
      if (workerResult) {
        imageUrl    = workerResult.imageUrl
        imageCredit = workerResult.imageCredit
        console.log(`  🔀 Worker (${workerResult.usedQuery}): ${imageUrl.slice(0, 70)}`)
      }
    }

    if (!imageUrl) {
      console.log('  ✗ Geen afbeelding gevonden')
      failed++
      continue
    }

    fm.imageUrl    = imageUrl
    fm.imageAlt    = title
    fm.imageCredit = imageCredit

    const newContent = `---\n${rebuildFrontmatter(fm)}\n---\n${body}`
    fs.writeFileSync(filePath, newContent, 'utf-8')
    updated++
    console.log(`  ✅ Opgeslagen`)

    await new Promise(r => setTimeout(r, 400))
  }

  console.log(`\n\n✨ Klaar! ${updated} bijgewerkt, ${skipped} overgeslagen, ${failed} mislukt.`)
}

main().catch(console.error)
