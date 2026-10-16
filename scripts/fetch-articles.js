#!/usr/bin/env node
/**
 * scripts/fetch-articles.js
 *
 * Run: npm run fetch-articles
 *
 * Pulls articles from free RSS feeds, passes them through Claude for
 * a Dutch summary + rewrite, and saves as markdown files in content/articles/.
 *
 * Regel: geen geldige Nederlandse herschrijving = niet publiceren (zie
 * scripts/nieuws-herschrijf.js). Een overgeslagen item krijgt geen bestand en
 * wordt dus de volgende run opnieuw geprobeerd. De run-samenvatting
 * ($GITHUB_STEP_SUMMARY) meldt "Claude-aanroepen: N" en gepubliceerd /
 * overgeslagen, met een ::warning:: per overgeslagen item.
 *
 * Feeds used (all free, no auth):
 *   - NASA News:       https://www.nasa.gov/rss/dyn/breaking_news.rss
 *   - SpaceFlightNow: https://spaceflightnow.com/feed/
 *   - ESA News:        https://www.esa.int/rssfeed/Our_Activities/Space_Science
 *
 * Images: extracted from RSS enclosure/media tags, with NASA Images API fallback.
 */

const fs      = require('fs')
const path    = require('path')
const Parser  = require('rss-parser')
const N       = require('./nieuws-herschrijf')

const ARTICLES_DIR  = path.join(__dirname, '..', 'content', 'articles')

const FEEDS = [
  {
    url:      'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    source:   'NASA',
    category: 'missies',
  },
  {
    url:      'https://spaceflightnow.com/feed/',
    source:   'SpaceflightNow',
    category: 'missies',
  },
  {
    url:      'https://www.esa.int/rssfeed/Our_Activities/Space_Science',
    source:   'ESA',
    category: 'educatie',
  },
  {
    url:      'https://www.jpl.nasa.gov/news.rss',
    source:   'JPL',
    category: 'missies',
  },
  {
    url:      'https://www.planetary.org/rss/feed',
    source:   'The Planetary Society',
    category: 'educatie',
  },
  {
    url:      'https://spacenews.com/feed/',
    source:   'SpaceNews',
    category: 'missies',
  },
]

const CATEGORY_MAP = {
  'james webb': 'james-webb',
  'webb':       'james-webb',
  'jwst':       'james-webb',
  'mars':       'mars',
  'spacex':     'missies',
  'starship':   'missies',
  'rocket':     'missies',
  'black hole': 'zwarte-gaten',
  'exoplanet':  'exoplaneten',
  'moon':       'maan',
  'comet':      'kometen',
  'dark energy':'kosmologie',
  'galaxy':     'kosmologie',
}

function guessCategory(title, defaultCat) {
  const lower = title.toLowerCase()
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return cat
  }
  return defaultCat
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

/**
 * Parse og:image / twitter:image from an HTML string.
 * Returns an absolute URL or null.
 */
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

/**
 * Fetch the source article page and return its og:image URL or null.
 */
async function fetchOgImage(sourceUrl) {
  if (!sourceUrl) return null
  try {
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NightGazerBot/1.0)' },
      signal:  AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return parseOgImage(html, sourceUrl)
  } catch {
    return null
  }
}

/**
 * Extract image URL + credit from an RSS item.
 * Tries: enclosure → media tags → HTML content → og:image from source page.
 */
async function extractImage(item, title, source) {
  // 1. RSS enclosure
  if (item.enclosure?.url && /\.(jpg|jpeg|png|webp)/i.test(item.enclosure.url)) {
    return { imageUrl: item.enclosure.url, imageAlt: title, imageCredit: source }
  }

  // 2. media:thumbnail
  const thumb = item.mediaThumbnail?.['$']?.url || item.mediaThumbnail?.url
  if (thumb) return { imageUrl: thumb, imageAlt: title, imageCredit: source }

  // 3. media:content
  const mediaUrl = item.mediaContent?.['$']?.url || item.mediaContent?.url
  if (mediaUrl && /\.(jpg|jpeg|png|webp)/i.test(mediaUrl)) {
    return { imageUrl: mediaUrl, imageAlt: title, imageCredit: source }
  }

  // 4. media:group first item
  const groupItems = item.mediaGroup?.['media:content']
  if (Array.isArray(groupItems) && groupItems[0]?.['$']?.url) {
    return { imageUrl: groupItems[0]['$'].url, imageAlt: title, imageCredit: source }
  }

  // 5. Image inside content/description HTML
  const html = item.content || item['content:encoded'] || item.description || ''
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp))[^"']*["']/i)
  if (imgMatch) return { imageUrl: imgMatch[1], imageAlt: title, imageCredit: source }

  // 6. Scrape og:image from the source article page (skip GIFs and extensionless URLs)
  const ogImage = await fetchOgImage(item.link)
  if (ogImage && isValidImageUrl(ogImage)) return { imageUrl: ogImage, imageAlt: title, imageCredit: source }

  return { imageUrl: '', imageAlt: '', imageCredit: '' }
}

const yaml = s => String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')
const melding = s => String(s).replace(/\r?\n/g, ' ').replace(/::/g, ': :')

/**
 * @param {object} [opts] alleen voor de tests: feeds, articlesDir, laadFeed
 *   (feed → items), fetchPagina, client, now, samenvattingPad
 */
async function main(opts = {}) {
  const feeds       = opts.feeds || FEEDS
  const articlesDir = opts.articlesDir || ARTICLES_DIR
  const now         = opts.now || (() => new Date())
  if (!fs.existsSync(articlesDir)) fs.mkdirSync(articlesDir, { recursive: true })

  const parser = new Parser({
    timeout: 10000,
    customFields: {
      item: [
        ['media:thumbnail',  'mediaThumbnail'],
        ['media:content',    'mediaContent'],
        ['media:group',      'mediaGroup'],
      ],
    },
  })
  const laadFeed = opts.laadFeed || (async feed => (await parser.parseURL(feed.url)).items)

  const heeftSleutel = !!(opts.client || process.env.ANTHROPIC_API_KEY)
  const client = opts.client || (heeftSleutel ? N.maakClient() : null)
  const stats = { aanroepen: 0, gepubliceerd: 0, overgeslagen: 0 }
  const overgeslagen = []
  const sla = (titel, reden) => {
    stats.overgeslagen++
    overgeslagen.push({ titel, reden })
    console.log(`::warning title=Niet gepubliceerd::${melding(titel)} — ${melding(reden)}`)
  }

  // Niet-relevante items (slug → titel, reden, datum). Staat in de
  // artikelmap, zodat de workflow hem met de artikelen meecommit; alleen
  // .md-bestanden daar worden artikelen.
  const nietRelevantPad = opts.nietRelevantPad || path.join(articlesDir, '.niet-relevant.json')
  let nietRelevant = {}
  try { nietRelevant = JSON.parse(fs.readFileSync(nietRelevantPad, 'utf-8')) || {} } catch { /* nog geen lijst */ }
  const onthoudNietRelevant = (slug, titel, reden) => {
    nietRelevant[slug] = { titel, reden, datum: now().toISOString().slice(0, 10) }
    const gesorteerd = Object.fromEntries(Object.entries(nietRelevant).sort(([a], [b]) => a.localeCompare(b)))
    fs.writeFileSync(nietRelevantPad, JSON.stringify(gesorteerd, null, 2) + '\n')
  }

  if (!heeftSleutel) console.log('::warning title=Geen ANTHROPIC_API_KEY::zonder sleutel wordt er niets gepubliceerd (geen ruwe RSS-tekst meer)')

  for (const feed of feeds) {
    console.log(`\n📡 Fetching: ${feed.source}`)

    let items
    try {
      items = await laadFeed(feed)
    } catch (e) {
      console.log(`::warning title=Feed niet bereikbaar::${feed.source} (${feed.url}): ${melding(e.message)}`)
      continue
    }

    // Take only the 3 most recent items per feed
    for (const item of (items || []).slice(0, 3)) {
      const title    = item.title?.trim() || 'Untitled'
      const slug     = slugify(title)
      const filePath = path.join(articlesDir, `${slug}.md`)

      // Al gepubliceerd. Een eerder overgeslagen item heeft geen bestand en
      // komt dus vanzelf opnieuw aan de beurt.
      if (fs.existsSync(filePath)) {
        console.log(`  ⏭  Already exists: ${title}`)
        continue
      }

      // Eerder als niet relevant beoordeeld: niet elke dag opnieuw laten
      // beoordelen (kost een aanroep, en een ander oordeel zou het alsnog
      // publiceren).
      if (nietRelevant[slug]) {
        console.log(`  ⏭  Eerder niet relevant: ${title} (${nietRelevant[slug].reden})`)
        continue
      }

      console.log(`  ✍  Processing: ${title}`)
      const vooraf = N.voorfilter(title)
      if (vooraf) {
        sla(title, `niet relevant: ${vooraf} (geen Claude-aanroep)`)
        onthoudNietRelevant(slug, title, vooraf)
        continue
      }
      if (!client) { sla(title, 'geen ANTHROPIC_API_KEY'); continue }

      const bron = await N.brontekst(item, feed.url, opts.fetchPagina)
      if (bron.woorden < N.MIN_WOORDEN_BRON) {
        sla(title, `brontekst te kort (${bron.woorden} woorden, minimaal ${N.MIN_WOORDEN_BRON}; geen Claude-aanroep)`)
        continue
      }

      const [r, { imageUrl, imageAlt, imageCredit }] = await Promise.all([
        N.herschrijf(client, { titel: title, tekst: bron.tekst, bron: feed.source }),
        opts.extractImage ? opts.extractImage(item, title, feed.source) : extractImage(item, title, feed.source),
      ])
      if (r.aanroep) stats.aanroepen++
      if (!r.ok) {
        sla(title, r.reden)
        if (r.nietRelevant) onthoudNietRelevant(slug, title, r.reden.replace(/^niet relevant: /, ''))
        continue
      }

      const category = guessCategory(title, feed.category)
      const frontmatter = `---
title: "${yaml(r.data.title)}"
excerpt: "${yaml(r.data.excerpt)}"
category: "${category}"
author: "Redactie NightGazer"
publishedAt: "${now().toISOString()}"
featured: false
tags: []
source: "${yaml(feed.source)}"
sourceUrl: "${yaml(item.link || '')}"
imageUrl: "${yaml(imageUrl)}"
imageAlt: "${yaml(imageAlt)}"
imageCredit: "${yaml(imageCredit)}"
---

${r.data.body}
`
      fs.writeFileSync(filePath, frontmatter)
      stats.gepubliceerd++
      console.log(`  ✅ Saved: ${slug}.md (${N.woorden(r.data.body)} woorden, bron ${bron.woorden} woorden${bron.uitPagina ? ' uit de artikelpagina' : ' uit de feed'})`)

      // Rate limit: wait 1s between API calls
      if (!opts.client) await new Promise(res => setTimeout(res, 1000))
    }
  }

  const regels = [
    `Claude-aanroepen: ${stats.aanroepen}`,
    `Gepubliceerd: ${stats.gepubliceerd} / overgeslagen: ${stats.overgeslagen}`,
    ...overgeslagen.map(o => `- overgeslagen: ${o.titel} — ${o.reden}`),
  ]
  console.log('\n' + regels.join('\n'))
  const pad = opts.samenvattingPad ?? process.env.GITHUB_STEP_SUMMARY
  if (pad) {
    try { fs.appendFileSync(pad, `### Nieuwsbot\n\n${regels.join('\n')}\n`) } catch (e) { console.warn(`⚠️  Run-samenvatting niet geschreven: ${e.message}`) }
  }
  return stats
}

module.exports = { main, FEEDS }

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1) })
}
