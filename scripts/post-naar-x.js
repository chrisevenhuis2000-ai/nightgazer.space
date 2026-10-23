/**
 * Plaatst nieuwe artikelen op X (Twitter), één post per artikel.
 *
 * Draait in de Auto-Fetch-workflow na het committen van nieuwe artikelen.
 * Welke artikelen al geplaatst zijn staat in content/x-geplaatst.json; alles
 * wat daar niet in staat is nieuw. Bestaat dat bestand nog niet, dan vult de
 * eerste run het met alle huidige artikelen en plaatst niets, zodat het
 * archief niet in één keer op X belandt.
 *
 * Nodig (GitHub-secrets): X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN,
 * X_ACCESS_SECRET (OAuth 1.0a, user context, app met Read and Write).
 * Ontbreken ze, dan doet het script niets en faalt de workflow niet.
 *
 * Opties via env:
 *   X_MAX_PER_RUN   hoeveel posts per run, standaard 5
 *   X_DRY_RUN=1     alleen tonen wat er geplaatst zou worden
 *   X_WACHT_MIN     hoe lang wachten tot het artikel live staat, standaard 20
 */

const fs     = require('fs')
const path   = require('path')
const crypto = require('crypto')
const matter = require('gray-matter')

const SITE_URL     = 'https://nightgazer.space'
const ARTICLES_DIR = path.join(__dirname, '../content/articles')
const LEDGER       = path.join(__dirname, '../content/x-geplaatst.json')
const TWEET_URL    = 'https://api.x.com/2/tweets'

// X telt elke link als 23 tekens, ongeacht de lengte.
const LINK_LENGTE = 23
const MAX_TEKENS  = 280

// ── OAuth 1.0a ──────────────────────────────────────────────────────────────

function pct(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

/**
 * Bouwt de Authorization-header. `extra` zijn query- of formparameters die in
 * de handtekening horen; een JSON-body (zoals bij /2/tweets) hoort er niet in.
 */
function oauthHeader({ method, url, keys, extra = {}, nonce, timestamp }) {
  const oauth = {
    oauth_consumer_key:     keys.apiKey,
    oauth_nonce:            nonce || crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(timestamp || Math.floor(Date.now() / 1000)),
    oauth_token:            keys.accessToken,
    oauth_version:          '1.0',
  }
  const params = { ...extra, ...oauth }
  const paramStr = Object.keys(params).sort()
    .map(k => `${pct(k)}=${pct(params[k])}`)
    .join('&')
  const base = [method.toUpperCase(), pct(url), pct(paramStr)].join('&')
  const signKey = `${pct(keys.apiSecret)}&${pct(keys.accessSecret)}`
  oauth.oauth_signature = crypto.createHmac('sha1', signKey).update(base).digest('base64')
  return 'OAuth ' + Object.keys(oauth).sort()
    .map(k => `${pct(k)}="${pct(oauth[k])}"`)
    .join(', ')
}

// ── Tekst ───────────────────────────────────────────────────────────────────

function tekens(s) {
  return [...s].length
}

function inkorten(s, max) {
  if (tekens(s) <= max) return s
  const kort = [...s].slice(0, Math.max(0, max - 1)).join('')
  return kort.replace(/\s+\S*$/, '').replace(/[\s,;:–-]+$/, '') + '…'
}

/** Titel, een stuk van de samenvatting en de link, binnen 280 tekens. */
function postTekst({ title, excerpt, url }) {
  const ruimte = MAX_TEKENS - LINK_LENGTE - 4 // twee keer "\n\n"
  const kop = inkorten(title.trim(), ruimte)
  const rest = ruimte - tekens(kop) - 2
  const samenvatting = excerpt && rest > 40 ? inkorten(excerpt.trim(), rest) : ''
  return [kop, samenvatting, url].filter(Boolean).join('\n\n')
}

// ── Artikelen ───────────────────────────────────────────────────────────────

function alleArtikelen() {
  return fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const { data } = matter(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8'))
      const slug = f.replace('.md', '')
      return {
        slug,
        title:   data.title || slug.replace(/-/g, ' '),
        excerpt: data.excerpt || '',
        url:     `${SITE_URL}/nieuws/${slug}/`,
        datum:   String(data.publishedAt || ''),
      }
    })
}

function leesLedger() {
  if (!fs.existsSync(LEDGER)) return null
  return JSON.parse(fs.readFileSync(LEDGER, 'utf8'))
}

function schrijfLedger(ledger) {
  fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n')
}

// ── Netwerk ─────────────────────────────────────────────────────────────────

const slaap = ms => new Promise(r => setTimeout(r, ms))

/** Wacht tot Cloudflare Pages het artikel serveert, anders toont X geen kaart. */
async function wachtTotLive(url, minuten) {
  const tot = Date.now() + minuten * 60_000
  while (Date.now() < tot) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
      if (res.ok) return true
    } catch { /* nog niet bereikbaar */ }
    await slaap(30_000)
  }
  return false
}

async function plaats(tekst, keys) {
  const res = await fetch(TWEET_URL, {
    method: 'POST',
    headers: {
      Authorization: oauthHeader({ method: 'POST', url: TWEET_URL, keys }),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: tekst }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`X antwoordde ${res.status}: ${JSON.stringify(body)}`)
  }
  return body.data && body.data.id
}

// ── Hoofdprogramma ──────────────────────────────────────────────────────────

async function main() {
  const keys = {
    apiKey:       process.env.X_API_KEY,
    apiSecret:    process.env.X_API_SECRET,
    accessToken:  process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  }
  const dryRun   = process.env.X_DRY_RUN === '1'
  const maxPosts = Number(process.env.X_MAX_PER_RUN || 5)
  const wachtMin = Number(process.env.X_WACHT_MIN || 20)

  if (!dryRun && Object.values(keys).some(v => !v)) {
    console.log('X-sleutels ontbreken; niets geplaatst.')
    return
  }

  const artikelen = alleArtikelen()
  const ledger = leesLedger()

  if (!ledger) {
    if (dryRun) {
      console.log(`Nog geen ${path.basename(LEDGER)}; de eerste echte run markeert ${artikelen.length} bestaande artikelen.`)
      return
    }
    const nu = new Date().toISOString()
    schrijfLedger({
      toelichting: 'Artikelen die al op X staan (of bij de start zijn overgeslagen). Zie scripts/post-naar-x.js.',
      geplaatst: Object.fromEntries(artikelen.map(a => [a.slug, { op: nu, overgeslagen: true }])),
    })
    console.log(`Eerste run: ${artikelen.length} bestaande artikelen gemarkeerd, niets geplaatst.`)
    return
  }

  const nieuw = artikelen
    .filter(a => !ledger.geplaatst[a.slug])
    .sort((a, b) => a.datum.localeCompare(b.datum))

  if (nieuw.length === 0) {
    console.log('Geen nieuwe artikelen voor X.')
    return
  }
  if (nieuw.length > maxPosts) {
    console.log(`${nieuw.length} nieuwe artikelen; deze run plaatst er ${maxPosts}, de rest volgt later.`)
  }

  let fouten = 0
  for (const a of nieuw.slice(0, maxPosts)) {
    const tekst = postTekst(a)
    if (dryRun) {
      console.log(`--- ${a.slug}\n${tekst}\n`)
      continue
    }
    if (!(await wachtTotLive(a.url, wachtMin))) {
      // De deploy is kennelijk nog niet klaar; de rest wacht op de volgende run.
      console.log(`${a.slug} staat na ${wachtMin} min nog niet live; volgende run opnieuw.`)
      break
    }
    try {
      const id = await plaats(tekst, keys)
      ledger.geplaatst[a.slug] = { op: new Date().toISOString(), id }
      schrijfLedger(ledger)
      console.log(`Geplaatst: ${a.slug} → https://x.com/i/status/${id}`)
    } catch (e) {
      fouten++
      console.error(`Mislukt: ${a.slug}: ${e.message}`)
      // 402/403/429: geen tegoed, geen rechten of limiet; verder proberen heeft geen zin.
      if (/ (402|403|429):/.test(e.message)) break
    }
  }
  if (fouten) process.exitCode = 1
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1) })
}

module.exports = { oauthHeader, postTekst, inkorten }
