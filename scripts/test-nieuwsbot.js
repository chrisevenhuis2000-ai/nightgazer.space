// scripts/test-nieuwsbot.js
// De nieuwsbot (scripts/fetch-articles.js + scripts/nieuws-herschrijf.js)
// tegen een nep-Claude (lokale HTTP-server via de echte SDK) en nep-feeds.
//
//   1. valideer(): Nederlands, lengte, titel vertaald, geen "appeared first on".
//   2. herschrijf() per antwoordsoort: goed, afgekapt (max_tokens), API-fout,
//      Engels, te kort, snipper-zin, onvertaalde titel, kapotte JSON, weigering.
//   3. brontekst(): volledige pagina bij een teaser, alleen op de eigen host.
//   4. main(): alleen het goede item wordt gepubliceerd (auteur, bron), de rest
//      krijgt een ::warning:: en geen bestand; de samenvatting meldt
//      "Claude-aanroepen: N" en gepubliceerd / overgeslagen; een tweede run
//      probeert de overgeslagen items opnieuw; zonder sleutel niets.

const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const assert = require('assert/strict')
const Anthropic = require('@anthropic-ai/sdk')
const N = require('./nieuws-herschrijf')
const { main } = require('./fetch-articles')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }

// ── Teksten ───────────────────────────────────────────────────────────────
const NL_ZINNEN = [
  'De ruimtesonde heeft deze week de eerste metingen naar de aarde gestuurd, en volgens het team zijn die van uitstekende kwaliteit.',
  'Wetenschappers van het instituut zeggen dat de gegevens een nieuw licht werpen op de manier waarop de atmosfeer van de planeet in de loop van de tijd is veranderd.',
  'Het instrument aan boord werd speciaal voor deze missie ontwikkeld en kan veel zwakkere signalen opvangen dan zijn voorgangers.',
  'In de komende maanden wordt het gebied rond de evenaar systematisch in kaart gebracht, zodat onderzoekers kunnen zien waar zich ijs bevindt.',
  'De lancering vond plaats vanaf de basis in Florida, waarna de sonde een reis van bijna zeven maanden door het zonnestelsel maakte.',
  'Volgens de projectleider is dit een belangrijke stap voor toekomstige missies, omdat de techniek ook bij latere landers kan worden gebruikt.',
]
const nlTekst = n => { const uit = []; let i = 0; while (uit.join(' ').split(/\s+/).length < n) uit.push(NL_ZINNEN[i++ % NL_ZINNEN.length]); return uit.join(' ') }
const EN_ZIN = 'The spacecraft has sent its first measurements back to Earth this week, and according to the team they are of excellent quality and will be used for years.'
const enTekst = n => { const uit = []; while (uit.join(' ').split(/\s+/).length < n) uit.push(EN_ZIN); return uit.join(' ') }
const goedAntwoord = titel => ({ title: `Nederlandse titel bij ${titel.split(' ')[0]}`, excerpt: 'De sonde heeft de eerste metingen naar de aarde gestuurd. Die zijn volgens het team van goede kwaliteit.', body: nlTekst(320) })

// ── Nep-Claude ────────────────────────────────────────────────────────────
// Het gedrag hangt af van een woord in de oorspronkelijke titel.
const aanvragen = []
const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', c => body += c)
  req.on('end', () => {
    const r = JSON.parse(body || '{}')
    aanvragen.push({ url: req.url, beta: req.headers['anthropic-beta'], body: r })
    const titel = (/Oorspronkelijke titel: (.*)/.exec(r.messages?.[0]?.content || '') || [])[1] || ''
    const json = (status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)) }
    const bericht = (stop, tekst, extra = {}) => json(200, { id: 'msg_test', type: 'message', role: 'assistant', model: r.model, stop_reason: stop, content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: tekst }], usage: { input_tokens: 10, output_tokens: 10 }, ...extra })
    if (/APIFOUT/.test(titel)) return json(400, { type: 'error', error: { type: 'invalid_request_error', message: 'model: claude-sonnet-4-20250514 is not available' } })
    if (/AFGEKAPT/.test(titel)) return bericht('max_tokens', JSON.stringify(goedAntwoord(titel)).slice(0, 300))
    if (/WEIGERING/.test(titel)) return bericht('refusal', '', { stop_details: { type: 'refusal', category: 'cyber' } })
    if (/KAPOTJSON/.test(titel)) return bericht('end_turn', 'Hier is het artikel: {title: ')
    if (/ENGELS/.test(titel)) return bericht('end_turn', JSON.stringify({ title: 'The new probe sends its first data', excerpt: 'The probe has sent its first data.', body: enTekst(320) }))
    if (/KORT/.test(titel)) return bericht('end_turn', JSON.stringify({ ...goedAntwoord(titel), body: nlTekst(80) }))
    if (/SNIPPER/.test(titel)) return bericht('end_turn', JSON.stringify({ ...goedAntwoord(titel), body: nlTekst(300) + '\n\nThe post Probe launches appeared first on SpaceNews.' }))
    if (/TITEL/.test(titel)) return bericht('end_turn', JSON.stringify({ ...goedAntwoord(titel), title: titel }))
    return bericht('end_turn', JSON.stringify(goedAntwoord(titel)))
  })
})

;(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const client = new Anthropic({ apiKey: 'test-sleutel', baseURL: `http://127.0.0.1:${server.address().port}`, maxRetries: 0 })

  // ── 1. valideer ────────────────────────────────────────────────────────
  const g = goedAntwoord('Probe')
  eq(N.valideer(g, 'Probe sends first data').ok, true, 'valideer: goed Nederlands artikel')
  eq(N.valideer({ ...g, body: enTekst(320) }, 'x').reden.startsWith('body is niet Nederlands'), true, 'valideer: Engelse body')
  eq(N.valideer({ ...g, body: nlTekst(100) }, 'x').reden.startsWith('body te kort'), true, 'valideer: te kort')
  eq(N.valideer({ ...g, body: g.body + ' The post X appeared first on SpaceNews.' }, 'x').reden, 'bevat "appeared first on"', 'valideer: snipper-zin')
  eq(N.valideer({ ...g, title: 'Probe sends first data' }, 'Probe sends first data').reden, 'titel niet vertaald', 'valideer: titel gelijk aan de bron')
  eq(N.valideer({ ...g, title: 'The probe and the data of the mission' }, 'x').reden, 'titel is Engels', 'valideer: Engelse titel')
  eq(N.valideer({ ...g, excerpt: '' }, 'x').reden, 'veld excerpt ontbreekt of is leeg', 'valideer: leeg veld')
  eq(N.valideer(null, 'x').ok, false, 'valideer: geen object')

  // ── 2. herschrijf ──────────────────────────────────────────────────────
  const tekst = enTekst(400)
  const geval = async titel => N.herschrijf(client, { titel, tekst, bron: 'Test' })
  let r = await geval('Probe GOED sends data')
  eq([r.ok, r.aanroep], [true, true], 'herschrijf: goed antwoord → gepubliceerd')
  const laatste = aanvragen[aanvragen.length - 1]
  eq(laatste.body.model, 'claude-opus-5-5', 'request: model')
  ok(laatste.body.max_tokens >= 8000, `request: ruime max_tokens (${laatste.body.max_tokens})`)
  eq(laatste.body.output_config?.format?.type, 'json_schema', 'request: structured output (json_schema)')
  eq(laatste.body.output_config.format.schema.required, ['title', 'excerpt', 'body'], 'request: schema met title/excerpt/body')
  eq(laatste.body.fallbacks, 'default', 'request: fallbacks default')
  ok(/server-side-fallback-2026-07-01/.test(laatste.beta || ''), 'request: beta-header voor fallbacks')
  ok(laatste.body.messages[0].content.includes(tekst.slice(0, 200)), 'request: brontekst mee')
  ok(!('tool_choice' in laatste.body), 'request: geen geforceerde tool_choice')

  for (const [titel, verwacht] of [
    ['AFGEKAPT probe', /^stop_reason max_tokens$/],
    ['APIFOUT probe', /^API-fout 400: .*not available/],
    ['ENGELS probe', /^body is niet Nederlands/],
    ['KORT probe', /^body te kort \(\d+ woorden, minimaal 250\)$/],
    ['SNIPPER probe', /^bevat "appeared first on"$/],
    ['TITEL probe sends data', /^titel niet vertaald$/],
    ['KAPOTJSON probe', /^antwoord is geen geldige JSON$/],
    ['WEIGERING probe', /^stop_reason refusal \(cyber\)$/],
  ]) {
    r = await geval(titel)
    ok(!r.ok && r.aanroep && verwacht.test(r.reden), `herschrijf: ${titel.split(' ')[0]} → niet publiceren (${r.reden})`)
  }

  // ── 3. brontekst ───────────────────────────────────────────────────────
  const artikelHtml = `<html><body><nav><p>Menu menu menu menu menu menu menu</p></nav><article>${[1, 2, 3, 4, 5, 6].map(i => `<p>${EN_ZIN} Paragraph ${i} adds more detail about the mission and the instrument.</p>`).join('')}<p>The post Probe launches appeared first on SpaceNews.</p></article><footer><p>Copyright footer text that should never be included here.</p></footer></body></html>`
  const teaser = { title: 'x', link: 'https://spacenews.com/probe/', contentSnippet: 'The probe launched. The post Probe launched appeared first on SpaceNews.' }
  let gehaald = []
  const fakePagina = async u => { gehaald.push(u); return artikelHtml }
  let b = await N.brontekst(teaser, 'https://spacenews.com/feed/', fakePagina)
  ok(b.uitPagina && b.woorden > 150, `brontekst: teaser → volledige artikelpagina (${b.woorden} woorden)`)
  ok(!/appeared first on|Menu menu|Copyright footer/.test(b.tekst), 'brontekst: zonder snipper-zin, menu en footer')
  gehaald = []
  b = await N.brontekst({ ...teaser, link: 'https://evil.example/x' }, 'https://spacenews.com/feed/', fakePagina)
  eq([gehaald.length, b.uitPagina], [0, false], 'brontekst: link naar een andere host wordt niet opgehaald')
  b = await N.brontekst({ ...teaser, link: 'https://www.nasa.gov/x/' }, 'https://www.nasa.gov/rss/dyn/breaking_news.rss', async () => { throw new Error('403') })
  eq(b.uitPagina, false, 'brontekst: pagina niet bereikbaar → feedtekst')
  ok(!/appeared first on/.test(N.schoonFeedtekst(teaser.contentSnippet)), 'feedtekst: snipper-zin eraf')

  // ── 4. main() ──────────────────────────────────────────────────────────
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nieuwsbot-'))
  const samenvatting = path.join(os.tmpdir(), `nieuwsbot-summary-${process.pid}.md`)
  const lang = enTekst(350)
  const item = (title, extra = {}) => ({ title, link: `https://spacenews.com/${title.toLowerCase().replace(/\W+/g, '-')}/`, 'content:encoded': `<p>${lang}</p>`, ...extra })
  const feeds = [{ url: 'https://spacenews.com/feed/', source: 'SpaceNews', category: 'missies' }, { url: 'https://spacenews.com/feed/', source: 'SpaceNews (2)', category: 'missies' }]
  const feedItems = [item('Probe GOED sends first data'), item('AFGEKAPT probe'), item('APIFOUT probe'), item('Short note', { 'content:encoded': '<p>Too short.</p>', link: 'https://elders.example/x' })]
  // Een item dat al gepubliceerd is, telt niet mee.
  fs.writeFileSync(path.join(dir, 'already-there.md'), '---\ntitle: "x"\n---\n')
  const opts = { feeds, articlesDir: dir, laadFeed: async f => f.source === 'SpaceNews' ? [...feedItems.slice(0, 2), { ...item('Already there') }] : [], client, samenvattingPad: samenvatting, extractImage: async () => ({ imageUrl: '', imageAlt: '', imageCredit: '' }), fetchPagina: async () => { throw new Error('geen netwerk in de test') }, now: () => new Date('2026-10-16T07:17:00Z') }

  const logs = []; const log0 = console.log; console.log = (...a) => logs.push(a.join(' '))
  let stats
  try { stats = await main(opts) } finally { console.log = log0 }
  eq(stats, { aanroepen: 2, gepubliceerd: 1, overgeslagen: 1 }, 'main: 2 aanroepen, 1 gepubliceerd, 1 overgeslagen')
  const bestanden = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  eq(bestanden, ['already-there.md', 'probe-goed-sends-first-data.md'], 'main: alleen het goede item als bestand (afgekapt niet)')
  const md = fs.readFileSync(path.join(dir, 'probe-goed-sends-first-data.md'), 'utf-8')
  ok(md.includes('author: "Redactie NightGazer"') && !md.includes('CosmosNL'), 'main: auteur Redactie NightGazer')
  ok(md.includes('sourceUrl: "https://spacenews.com/probe-goed-sends-first-data/"') && md.includes('source: "SpaceNews"'), 'main: bron + link in de frontmatter')
  ok(N.woorden(md.split('---')[2]) >= 250 && !/appeared first on/.test(md), 'main: body ≥ 250 woorden, geen snipper-zin')
  ok(logs.some(l => l.startsWith('::warning title=Niet gepubliceerd::AFGEKAPT probe — stop_reason max_tokens')), 'main: ::warning:: voor het afgekapte item')
  const sv = fs.readFileSync(samenvatting, 'utf-8')
  ok(sv.includes('Claude-aanroepen: 2') && sv.includes('Gepubliceerd: 1 / overgeslagen: 1') && sv.includes('AFGEKAPT probe — stop_reason max_tokens'), 'main: run-samenvatting met aanroepen en gepubliceerd / overgeslagen')

  // Tweede run: het goede item bestaat, het overgeslagen item wordt opnieuw
  // geprobeerd (niet als verwerkt gemarkeerd), plus API-fout en een te korte
  // bron (geen aanroep).
  opts.laadFeed = async f => f.source === 'SpaceNews' ? feedItems.slice(0, 3) : feedItems.slice(3)
  fs.writeFileSync(samenvatting, '')
  logs.length = 0; console.log = (...a) => logs.push(a.join(' '))
  try { stats = await main(opts) } finally { console.log = log0 }
  eq(stats, { aanroepen: 2, gepubliceerd: 0, overgeslagen: 3 }, 'main run 2: afgekapt opnieuw geprobeerd, API-fout overgeslagen, korte bron zonder aanroep')
  ok(logs.some(l => /Already exists: Probe GOED/.test(l)), 'main run 2: gepubliceerd item niet opnieuw')
  ok(logs.some(l => /::warning title=Niet gepubliceerd::Short note — brontekst te kort .*geen Claude-aanroep/.test(l)), 'main run 2: korte bron → overgeslagen zonder aanroep')
  ok(logs.some(l => /::warning title=Niet gepubliceerd::APIFOUT probe — API-fout 400/.test(l)), 'main run 2: API-fout → ::warning::')

  // Zonder sleutel: niets publiceren (vroeger: de ruwe RSS-tekst).
  const zonder = fs.mkdtempSync(path.join(os.tmpdir(), 'nieuwsbot-zonder-'))
  const sleutel = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY
  logs.length = 0; console.log = (...a) => logs.push(a.join(' '))
  try { stats = await main({ ...opts, client: undefined, articlesDir: zonder, samenvattingPad: '' }) } finally { console.log = log0; if (sleutel !== undefined) process.env.ANTHROPIC_API_KEY = sleutel }
  eq([stats.gepubliceerd, fs.readdirSync(zonder).length], [0, 0], 'main zonder sleutel: niets gepubliceerd')

  fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(zonder, { recursive: true, force: true }); fs.rmSync(samenvatting, { force: true })
  server.close()
  console.log(`✅ ${checks} nieuwsbot-controles geslaagd`)
})().catch(e => { console.error(e); server.close(); process.exit(1) })
