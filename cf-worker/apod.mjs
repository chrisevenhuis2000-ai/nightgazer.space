// ── APOD via science.nasa.gov ──────────────────────────────────────────────
// api.nasa.gov/planetary/apod is stuk sinds APOD naar science.nasa.gov
// verhuisde: titel "NASA Science", url/hdurl = het NASA-logo uit het thema.
// Nieuwe bron: de RSS-feed science.nasa.gov/feed/apod-basic/ (nieuwste item:
// titel, link, datum, tekst) en de artikelpagina zelf (og:image = de echte
// foto onder assets.science.nasa.gov/…/renditions/cq5dam.web.1280.1280.jpeg).
//
// De uitvoer heeft dezelfde vorm als api.nasa.gov, zodat de site niet hoeft
// te veranderen: { date, title, explanation, url, hdurl, media_type,
// copyright? }. Bij twijfel over het beeld: media_type 'none' en geen url —
// liever geen beeld dan een logo.
//
// Alles hier is puur (tekst in, object uit), zodat scripts/test-apod.js het
// in Node kan testen; worker.js doet de fetches en de cache.

export const APOD_FEED = 'https://science.nasa.gov/feed/apod-basic/'

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' }

export function decodeEntities(s) {
  return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

const unCdata = s => String(s || '').replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')

// HTML → platte tekst: scripts/styles weg, blokgrenzen worden regels.
export function htmlToText(html) {
  return decodeEntities(String(html || '')
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|figcaption|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function tag(xml, name) {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(xml)
  return m ? unCdata(m[1]).trim() : ''
}

// Alle items uit de feed; de nieuwste eerst (op pubDate, niet op volgorde).
export function parseFeed(xml) {
  const items = []
  for (const m of String(xml || '').matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const x = m[1]
    const pub = tag(x, 'pubDate')
    const t = Date.parse(pub)
    items.push({
      title:       decodeEntities(htmlToText(tag(x, 'title'))),
      link:        decodeEntities(tag(x, 'link')).trim(),
      pubDate:     pub,
      time:        Number.isFinite(t) ? t : 0,
      description: tag(x, 'description'),
      content:     tag(x, 'content:encoded'),
    })
  }
  return items.sort((a, b) => b.time - a.time)
}

// <meta property|name="key" content="…"> in beide volgordes.
export function meta(html, key) {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html)
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i').exec(html)
  return decodeEntities((a || b || [])[1] || '').trim()
}

// Alleen een echte APOD-foto: https, op een nasa.gov-host, geen thema-asset
// of logo, en een beeldbestand. Al het andere → null.
export function geldigBeeld(url) {
  if (!url) return null
  let u
  try { u = new URL(url) } catch { return null }
  if (u.protocol !== 'https:') return null
  if (!/(^|\.)nasa\.gov$/i.test(u.hostname)) return null
  const p = decodeURIComponent(u.pathname).toLowerCase()
  if (p.includes('/themes/') || p.includes('nasa-logo') || p.includes('/wp-content/themes')) return null
  if (!/\.(jpe?g|png|gif|webp)$/.test(p)) return null
  return u.href
}

// De credit van een APOD. Op science.nasa.gov staat die niet altijd als
// "Image Credit & Copyright: Naam" op één regel; label en namen kunnen in
// aparte elementen staan, in een element met "credit" in de class, of in
// JSON-LD. We proberen het in die volgorde, en in de HTML alleen binnen
// <article>/<main> (zo telt een "Image Credit: NASA" in een teaser onderaan
// niet mee). Geen credit gevonden → null, en dan toont de site "Publiek
// domein · NASA".
const LABEL = /^\s*(?:(?:Image|Video|Illustration|Animation|Photo)\s+)?Credits?(?:\s*(?:&|and)\s*(?:Copyright|Licen[sc]e))?\s*:?\s*/i
const isLabelRegel = r => LABEL.test(r) && !r.replace(LABEL, '').trim()

function schoonNamen(t) {
  const n = String(t || '')
    .replace(LABEL, '')
    .replace(/\s+([,;])/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/^[\s:;,–—-]+|[\s;,–—-]+$/g, '')
    .trim()
  return n && n.length <= 200 && !/^(nasa science|credits?)$/i.test(n) ? n : null
}

function creditUitJsonLd(html) {
  for (const m of String(html || '').matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data
    try { data = JSON.parse(m[1]) } catch { continue }
    const stapel = [data]
    while (stapel.length) {
      const o = stapel.pop()
      if (!o || typeof o !== 'object') continue
      if (Array.isArray(o)) { stapel.push(...o); continue }
      for (const k of ['creditText', 'copyrightHolder']) {
        const v = o[k]
        const naam = typeof v === 'string' ? v : Array.isArray(v) ? v.map(x => x?.name || x).filter(x => typeof x === 'string').join(', ') : v?.name
        const n = schoonNamen(decodeEntities(naam || ''))
        if (n) return n
      }
      for (const v of Object.values(o)) if (v && typeof v === 'object') stapel.push(v)
    }
  }
  return null
}

export function inhoudVan(html) {
  const h = String(html || '')
  const m = /<article[\s>][\s\S]*?<\/article>/i.exec(h) || /<main[\s>][\s\S]*?<\/main>/i.exec(h)
  return m ? m[0] : h
}

function creditUitTekst(text) {
  const regels = String(text || '').split('\n').map(r => r.trim())
  for (let i = 0; i < regels.length; i++) {
    const r = regels[i]
    if (!LABEL.test(r) || !/credit/i.test(r)) continue
    if (isLabelRegel(r)) {
      // Label op een eigen regel ("Image Credit & Copyright"): de namen staan
      // op de volgende niet-lege regel.
      const volgende = regels.slice(i + 1).find(x => x)
      if (volgende && !LABEL.test(volgende)) { const n = schoonNamen(volgende); if (n) return n }
      continue
    }
    if (/:/.test(r)) { const n = schoonNamen(r); if (n) return n }
  }
  return null
}

function creditUitClass(html) {
  for (const m of String(html || '').matchAll(/<(\w+)[^>]*class=["'][^"']*credit[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = htmlToText(m[2]).replace(/\n+/g, ' ')
    const n = schoonNamen(t)
    if (n) return n
  }
  return null
}

// { credit, copyright }: copyright is de credit zelf (de site toont dan
// "© …"); alleen zonder credit blijft het veld weg.
export function vindCredit(feedTekst, artikelHtml = '') {
  const inhoud = inhoudVan(artikelHtml)
  const credit = creditUitJsonLd(artikelHtml)
    || creditUitTekst(feedTekst)
    || creditUitClass(inhoud)
    || creditUitTekst(htmlToText(inhoud))
  return { credit, copyright: credit }
}

// Datum van de APOD zoals NASA hem dateert: in Amerikaanse oostkusttijd.
export function apodDatum(time) {
  if (!time) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time))
}

const isAfgekapt = s => /(\[…\]|\[\.\.\.\]|…|\.\.\.)\s*$/.test(s)
function zonderCredit(s) {
  const regels = s.split('\n')
  const uit = []
  for (let i = 0; i < regels.length; i++) {
    const r = regels[i].trim()
    if (LABEL.test(r) && /credit/i.test(r)) { if (isLabelRegel(r)) i++; continue }
    uit.push(r)
  }
  return uit.join(' ').replace(/\s+/g, ' ').trim()
}

// Feed-item + HTML van de artikelpagina → APOD-object in de oude vorm.
// Gooit een fout als er geen bruikbare APOD in zit (geen titel of datum):
// dan cachet de worker niets.
export function bouwApod(item, artikelHtml) {
  if (!item || !item.title || !item.time) throw new Error('geen bruikbaar feed-item')
  const html = String(artikelHtml || '')

  const feedTekst = htmlToText(item.content || item.description)
  const ogBeschrijving = meta(html, 'og:description')
  let explanation = zonderCredit(feedTekst)
  if (!explanation || isAfgekapt(explanation)) {
    const lang = [explanation, ogBeschrijving].filter(Boolean).sort((a, b) => b.length - a.length)[0] || ''
    explanation = lang
  }

  const { copyright } = vindCredit(feedTekst, html)
  const beeld = geldigBeeld(meta(html, 'og:image') || meta(html, 'twitter:image'))

  const uit = {
    date:        apodDatum(item.time),
    title:       item.title,
    explanation,
    url:         beeld || '',
    hdurl:       beeld || '',
    media_type:  beeld ? 'image' : 'none',
    link:        item.link || null,
  }
  if (copyright) uit.copyright = copyright
  // De oude logo-fout mag nooit meer doorkomen, ook niet via de titel.
  if (/^nasa science$/i.test(uit.title)) throw new Error('titel "NASA Science": geen echte APOD')
  return uit
}
