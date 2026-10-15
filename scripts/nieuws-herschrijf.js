// scripts/nieuws-herschrijf.js
// Eén RSS-item → een Nederlands artikel, of niets.
//
// Waarom deze module: tot oktober 2026 publiceerde fetch-articles.js bij elke
// fout (API-fout, afgekapt antwoord, kapotte JSON) stilzwijgend de ruwe
// Engelse RSS-snipper. Sinds juni 2026 faalde élke aanroep binnen enkele
// honderden milliseconden — 652 van de 1011 artikelen waren daardoor Engelse
// snippers ("… appeared first on SpaceNews"), en AdSense wees de site af.
//
// De regel is nu: geen geldige Nederlandse herschrijving = niet publiceren.
//   - brontekst: de volledige artikelpagina (alleen op de eigen host van de
//     feed), anders de feedtekst; te kort → overslaan zónder Claude-aanroep;
//   - Claude met structured output (JSON-schema), ruime max_tokens, en
//     stop_reason moet end_turn zijn;
//   - uitvoer gevalideerd: Nederlands, titel vertaald, body ≥ 250 woorden,
//     geen "appeared first on".
// Alles hier is te testen zonder netwerk: scripts/test-nieuwsbot.js.

const Anthropic = require('@anthropic-ai/sdk')

const MODEL = 'claude-opus-5-5'
const MIN_WOORDEN_BODY = 250
const MIN_WOORDEN_BRON = 250
const MAX_TEKENS_BRON = 30000

const SCHEMA = {
  type: 'object',
  properties: {
    title:   { type: 'string', description: 'Nederlandse titel, vertaald (geen Engelse titel)' },
    excerpt: { type: 'string', description: 'Nederlandse samenvatting in 2-3 zinnen' },
    body:    { type: 'string', description: 'Het volledige artikel in het Nederlands, alinea’s gescheiden door een lege regel' },
  },
  required: ['title', 'excerpt', 'body'],
  additionalProperties: false,
}

const SYSTEM = [
  'Je bent redacteur van NightGazer, een Nederlandstalige astronomie- en ruimtevaartsite.',
  'Je krijgt een Engelstalig nieuwsartikel. Schrijf het als volwaardig Nederlands nieuwsartikel: vertaal de titel, schrijf een samenvatting van 2-3 zinnen en een artikel van 300 tot 600 woorden in 4 tot 7 alinea’s, in heldere journalistieke stijl.',
  'Gebruik alleen feiten uit de brontekst. Verzin geen cijfers, namen, citaten of gebeurtenissen. Leg vaktermen kort uit als dat helpt.',
  'Laat reclame, nieuwsbriefoproepen, "The post … appeared first on …" en andere sitezinnen uit de bron weg.',
  'Schrijf alles in het Nederlands; Engelse eigennamen (missies, bedrijven, instrumenten) mogen blijven.',
].join(' ')

// ── Tekst ─────────────────────────────────────────────────────────────────
const ENTITEITEN = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' }
function decode(s) {
  return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m }
    return ENTITEITEN[e.toLowerCase()] ?? m
  })
}

const AFSLUITER = /\s*The post\s.+?\sappeared first on\s.+?\.?\s*$/is

/** Platte tekst van een artikelpagina: de <p>'s binnen <article>/<main>. */
function brontekstUitHtml(html) {
  const h = String(html || '').replace(/<(script|style|noscript|nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, ' ')
  const blok = (/<article[\s>][\s\S]*?<\/article>/i.exec(h) || /<main[\s>][\s\S]*?<\/main>/i.exec(h) || [h])[0]
  const alineas = [...blok.matchAll(/<p[\s>][\s\S]*?<\/p>/gi)]
    .map(m => decode(m[0].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
    .filter(p => p.split(' ').length >= 6)
  return alineas.join('\n\n').replace(AFSLUITER, '').trim()
}

function schoonFeedtekst(t) {
  return decode(String(t || '').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(AFSLUITER, '').trim()
}

const woorden = s => String(s || '').trim().split(/\s+/).filter(Boolean).length

const NL = new Set('de het een van en op te dat die voor met zijn niet aan er ook als bij maar om naar dan door uit wordt worden heeft hebben deze dit nog werd kan over tot meer waar hun zij wel zou nieuwe onder tussen tijdens volgens'.split(' '))
const EN = new Set('the and of to that for on with as was are by this be from at an its has have which were their will would been but not or they also new after into about than more'.split(' '))
function taal(s) {
  const w = String(s || '').toLowerCase().match(/[a-zà-ÿ’']+/g) || []
  let nl = 0, en = 0
  for (const x of w) { if (NL.has(x)) nl++; if (EN.has(x)) en++ }
  return { nl, en, totaal: w.length }
}
const isNederlands = s => { const t = taal(s); return t.totaal > 0 && t.nl >= 3 * Math.max(t.en, 1) && t.nl / t.totaal >= 0.1 }
const normaal = s => String(s || '').toLowerCase().replace(/[^a-z0-9à-ÿ]+/g, ' ').trim()

/**
 * Is dit een publiceerbare Nederlandse herschrijving? → { ok, reden }
 * `origTitel` is de Engelse brontitel.
 */
function valideer(out, origTitel) {
  if (!out || typeof out !== 'object') return { ok: false, reden: 'geen JSON-object' }
  for (const k of ['title', 'excerpt', 'body']) if (typeof out[k] !== 'string' || !out[k].trim()) return { ok: false, reden: `veld ${k} ontbreekt of is leeg` }
  const alles = `${out.title}\n${out.excerpt}\n${out.body}`
  if (/appeared first on/i.test(alles)) return { ok: false, reden: 'bevat "appeared first on"' }
  const n = woorden(out.body)
  if (n < MIN_WOORDEN_BODY) return { ok: false, reden: `body te kort (${n} woorden, minimaal ${MIN_WOORDEN_BODY})` }
  if (!isNederlands(out.body)) { const t = taal(out.body); return { ok: false, reden: `body is niet Nederlands (nl ${t.nl} / en ${t.en} stopwoorden)` } }
  if (!isNederlands(out.excerpt) && taal(out.excerpt).en > 0) return { ok: false, reden: 'samenvatting is niet Nederlands' }
  if (normaal(out.title) === normaal(origTitel)) return { ok: false, reden: 'titel niet vertaald' }
  const tt = taal(out.title)
  if (tt.en > tt.nl) return { ok: false, reden: 'titel is Engels' }
  return { ok: true, reden: null }
}

// ── Brontekst ─────────────────────────────────────────────────────────────
// Alleen artikelpagina's op de host van de feed zelf (de bestaande
// brongrenzen); nooit een willekeurige link uit een feed.
function zelfdeBron(link, feedUrl) {
  try {
    const a = new URL(link).hostname.replace(/^www\./, ''), b = new URL(feedUrl).hostname.replace(/^www\./, '')
    return a === b || a.endsWith('.' + b) || b.endsWith('.' + a)
  } catch { return false }
}

async function haalPagina(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NightGazerBot/1.0; +https://nightgazer.space)' }, signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

/** De beste brontekst: de volledige pagina als die langer is dan de feedtekst. */
async function brontekst(item, feedUrl, fetchPagina = haalPagina) {
  const feed = schoonFeedtekst(item['content:encoded'] || item.content || item.contentSnippet || item.summary || '')
  let pagina = ''
  if (item.link && zelfdeBron(item.link, feedUrl)) {
    try { pagina = brontekstUitHtml(await fetchPagina(item.link)) } catch { /* feedtekst blijft over */ }
  }
  const beste = woorden(pagina) > woorden(feed) ? pagina : feed
  return { tekst: beste.slice(0, MAX_TEKENS_BRON), woorden: woorden(beste), uitPagina: beste === pagina && !!pagina }
}

// ── Claude ────────────────────────────────────────────────────────────────
function maakClient() {
  // Leest ANTHROPIC_API_KEY (en, voor de tests, ANTHROPIC_BASE_URL) uit de
  // omgeving. Herprobeert 429/5xx en netwerkfouten zelf.
  return new Anthropic({ maxRetries: 3 })
}

/**
 * Herschrijf één item. → { ok, data?, reden?, aanroep }
 * `aanroep` = of er een request naar de API is gedaan (voor de teller).
 */
async function herschrijf(client, { titel, tekst, bron }) {
  let res
  try {
    res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Weigert een veiligheidsclassifier een verzoek, dan draait de API het
      // zelf opnieuw op het aanbevolen vervangmodel.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Bron: ${bron}\nOorspronkelijke titel: ${titel}\n\nBrontekst:\n${tekst}` }],
    })
  } catch (err) {
    const status = err instanceof Anthropic.APIError && err.status ? ` ${err.status}` : ''
    return { ok: false, aanroep: true, reden: `API-fout${status}: ${String(err.message || err).slice(0, 200)}` }
  }
  if (res.stop_reason !== 'end_turn') {
    const extra = res.stop_reason === 'refusal' && res.stop_details ? ` (${res.stop_details.category || 'onbekend'})` : ''
    return { ok: false, aanroep: true, reden: `stop_reason ${res.stop_reason}${extra}` }
  }
  const tekstUit = (res.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
  let data
  try { data = JSON.parse(tekstUit) } catch { return { ok: false, aanroep: true, reden: 'antwoord is geen geldige JSON' } }
  const v = valideer(data, titel)
  if (!v.ok) return { ok: false, aanroep: true, reden: v.reden }
  return { ok: true, aanroep: true, data: { title: data.title.trim(), excerpt: data.excerpt.trim(), body: data.body.trim() } }
}

module.exports = {
  MODEL, MIN_WOORDEN_BODY, MIN_WOORDEN_BRON, SCHEMA, SYSTEM,
  brontekstUitHtml, schoonFeedtekst, woorden, taal, isNederlands, valideer,
  zelfdeBron, brontekst, maakClient, herschrijf,
}
