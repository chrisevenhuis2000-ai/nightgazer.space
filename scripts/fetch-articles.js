#!/usr/bin/env node
/**
 * scripts/fetch-articles.js
 *
 * Run: npm run fetch-articles
 *
 * Pulls articles from free RSS feeds, passes them through Claude for
 * a Dutch summary + rewrite, and saves as markdown files in content/articles/.
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

const ARTICLES_DIR  = path.join(__dirname, '..', 'content', 'articles')
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

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

async function translateAndSummarise(title, content) {
  if (!ANTHROPIC_KEY) {
    console.warn('  No ANTHROPIC_API_KEY — skipping AI translation')
    return { titleNL: title, excerptNL: content?.slice(0, 200) || '', bodyNL: content || '' }
  }

  const prompt = `Je bent een redacteur van een Nederlandse astronomie-website. Vertaal en herschrijf het volgende Engelstalige nieuwsartikel in het Nederlands. Geef je antwoord UITSLUITEND als JSON (geen markdown):
{
  "title": "Nederlandse titel",
  "excerpt": "Nederlandse samenvatting in 2-3 zinnen",
  "body": "Volledig artikel in het Nederlands (3-5 alinea's, journalistieke stijl)"
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 1000,
      messages:   [{
        role:    'user',
        content: `Titel: ${title}\n\nInhoud: ${content?.slice(0, 1500) || ''}`,
      }],
      system: prompt,
    }),
  })

  const data    = await res.json()
  const rawText = data.content?.[0]?.text || '{}'
  const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    return {
      titleNL:   parsed.title   || title,
      excerptNL: parsed.excerpt || '',
      bodyNL:    parsed.body    || content || '',
    }
  } catch {
    return { titleNL: title, excerptNL: '', bodyNL: content || '' }
  }
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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CosmosNLBot/1.0)' },
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

async function main() {
  if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR, { recursive: true })

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
  let newCount = 0

  for (const feed of FEEDS) {
    console.log(`\n📡 Fetching: ${feed.source}`)

    let feedData
    try {
      feedData = await parser.parseURL(feed.url)
    } catch (e) {
      console.warn(`  ⚠ Could not fetch ${feed.url}: ${e.message}`)
      continue
    }

    // Take only the 3 most recent items per feed
    const items = feedData.items.slice(0, 3)

    for (const item of items) {
      const title    = item.title?.trim() || 'Untitled'
      const slug     = slugify(title)
      const filePath = path.join(ARTICLES_DIR, `${slug}.md`)

      // Skip if already exists
      if (fs.existsSync(filePath)) {
        console.log(`  ⏭  Already exists: ${title}`)
        continue
      }

      console.log(`  ✍  Processing: ${title}`)

      const content  = item.contentSnippet || item.summary || item.content || ''
      const category = guessCategory(title, feed.category)

      const [{ titleNL, excerptNL, bodyNL }, { imageUrl, imageAlt, imageCredit }] = await Promise.all([
        translateAndSummarise(title, content),
        extractImage(item, title, feed.source),
      ])

      const frontmatter = `---
title: "${titleNL.replace(/"/g, '\\"')}"
excerpt: "${excerptNL.replace(/"/g, '\\"')}"
category: "${category}"
author: "Redactie CosmosNL"
publishedAt: "${new Date().toISOString()}"
featured: false
tags: []
source: "${feed.source}"
sourceUrl: "${item.link || ''}"
imageUrl: "${imageUrl}"
imageAlt: "${imageAlt.replace(/"/g, '\\"')}"
imageCredit: "${imageCredit}"
---

${bodyNL}
`
      fs.writeFileSync(filePath, frontmatter)
      newCount++
      console.log(`  ✅ Saved: ${slug}.md`)

      // Rate limit: wait 1s between API calls
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  console.log(`\n✨ Done! ${newCount} new articles saved to content/articles/`)
}

main().catch(console.error)
