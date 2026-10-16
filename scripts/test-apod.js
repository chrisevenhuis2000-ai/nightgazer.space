// scripts/test-apod.js
// De APOD-route van de worker (cf-worker/apod.mjs + /apod in worker.js),
// tegen gereconstrueerde fixtures in scripts/__fixtures__/apod/ —
// science.nasa.gov was vanuit de bouwomgeving niet bereikbaar. De echte test
// is na deploy: cosmosnl-proxy.chrisevenhuis2000.workers.dev/apod.
//
//   1. Losse functies: nieuwste item, datum in oostkusttijd, credit/copyright,
//      beeldvalidatie (nooit /themes/ of nasa-logo), afgekapte tekst.
//   2. De hele route in worker.js met een nagebootste fetch en cache:
//      goede APOD → 24 u cache; logo als og:image → media_type 'none', 1 u;
//      feed kapot → 502 en niets in de cache; cache-hit → geen fetch.

const fs = require('fs')
const os = require('os')
const path = require('path')
const assert = require('assert/strict')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }
const FIX = path.join(__dirname, '__fixtures__', 'apod')
const lees = f => fs.readFileSync(path.join(FIX, f), 'utf-8')
const BEELD = 'https://assets.science.nasa.gov/dynamicimage/assets/science/apod/2026/10/helix_vanderberg.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg'
const LOGO = 'https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png'

;(async () => {
  const A = await import(path.join(__dirname, '..', 'cf-worker', 'apod.mjs'))

  // ── 1. Losse functies ────────────────────────────────────────────────
  const items = A.parseFeed(lees('feed.xml'))
  eq(items.length, 2, 'feed: 2 items')
  eq(items[0].title, 'NGC 7293: The Helix Nebula – A Planetary Nebula', 'feed: nieuwste item eerst (op pubDate, niet op volgorde), entiteiten gedecodeerd')
  eq(items[0].link, 'https://science.nasa.gov/image-detail/apod-2026-10-15-ngc-7293-the-helix-nebula/', 'feed: link')

  eq(A.apodDatum(Date.parse('Thu, 15 Oct 2026 04:00:00 +0000')), '2026-10-15', 'datum: 04:00 UTC = 15 okt in New York')
  eq(A.apodDatum(Date.parse('Thu, 15 Oct 2026 03:00:00 +0000')), '2026-10-14', 'datum: 03:00 UTC = nog 14 okt in New York')

  eq(A.geldigBeeld(BEELD), BEELD, 'beeld: rendition op assets.science.nasa.gov')
  eq(A.geldigBeeld(LOGO), null, 'beeld: thema-logo afgekeurd')
  eq(A.geldigBeeld('https://assets.science.nasa.gov/x/nasa-logo.png'), null, 'beeld: nasa-logo afgekeurd, ook buiten /themes/')
  eq(A.geldigBeeld('https://science.nasa.gov/wp-content/themes/foo/bg.jpg'), null, 'beeld: alles onder /themes/ afgekeurd')
  eq(A.geldigBeeld('http://assets.science.nasa.gov/a.jpg'), null, 'beeld: geen http')
  eq(A.geldigBeeld('https://example.com/a.jpg'), null, 'beeld: geen andere host')
  eq(A.geldigBeeld('https://apod.nasa.gov/apod/image/2610/a.jpg'), 'https://apod.nasa.gov/apod/image/2610/a.jpg', 'beeld: apod.nasa.gov mag')
  eq(A.geldigBeeld('https://assets.science.nasa.gov/video/a.mp4'), null, 'beeld: geen video-bestand')
  eq(A.geldigBeeld(''), null, 'beeld: leeg')

  // Credit = copyright: alleen zonder credit toont de site "Publiek domein · NASA".
  eq(A.vindCredit('Image Credit & Copyright: Jan & Anna'), { credit: 'Jan & Anna', copyright: 'Jan & Anna' }, 'credit met copyright')
  eq(A.vindCredit('Image Credit: NASA, ESA, Hubble'), { credit: 'NASA, ESA, Hubble', copyright: 'NASA, ESA, Hubble' }, 'credit zonder het woord copyright → toch als copyright')
  eq(A.vindCredit('Video Credit & License: X'), { credit: 'X', copyright: 'X' }, 'video-credit met licentie')
  eq(A.vindCredit('Geen credit hier.'), { credit: null, copyright: null }, 'geen credit → null')

  // De echte APOD van 15 okt 2026 (credit Jason Kurth, Ty Buckley), in de
  // vormen die science.nasa.gov kan gebruiken.
  const MANHATTAN = 'Jason Kurth, Ty Buckley'
  const item15 = { ...items[0], title: 'The Milky Way over Manhattan', content: '', description: 'City lights outshine the stars. [&#8230;]' }
  for (const [f, wat] of [['artikel-credit-los.html', 'label en namen in aparte elementen, namen als links'],
                          ['artikel-credit-class.html', 'element met "credit" in de class, spatie vóór de komma'],
                          ['artikel-credit-jsonld.html', 'alleen in JSON-LD (creditText)']]) {
    eq(A.vindCredit('', lees(f)).credit, MANHATTAN, `credit uit het artikel: ${wat}`)
    const ap = A.bouwApod(item15, lees(f))
    eq(ap.copyright, MANHATTAN, `apod.copyright gevuld: ${wat}`)
    ok(!/Kurth/.test(ap.explanation), `credit niet in de uitleg: ${wat}`)
  }
  const zonder15 = A.bouwApod(item15, lees('artikel-zonder-credit.html'))
  eq(zonder15.copyright, undefined, 'echt geen credit (teaser "Image Credit: NASA/JPL" buiten <article> telt niet) → geen copyright → site toont "Publiek domein · NASA"')
  eq(zonder15.media_type, 'image', 'zonder credit wel gewoon het beeld')

  // Goede APOD
  const goed = A.bouwApod(items[0], lees('artikel.html'))
  eq(goed.date, '2026-10-15', 'apod: datum')
  eq(goed.title, 'NGC 7293: The Helix Nebula – A Planetary Nebula', 'apod: titel uit de feed')
  eq([goed.media_type, goed.url, goed.hdurl], ['image', BEELD, BEELD], 'apod: og:image als url en hdurl')
  eq(goed.copyright, 'Jan van der Berg & Anna Smit', 'apod: copyright')
  ok(goed.explanation.startsWith('Will our Sun look like this one day?') && goed.explanation.endsWith('to fluoresce.'), 'apod: volledige uitleg uit content:encoded')
  ok(!/Credit/.test(goed.explanation), 'apod: creditregel niet in de uitleg')
  for (const k of ['date', 'title', 'explanation', 'url', 'hdurl', 'media_type']) ok(typeof goed[k] === 'string', `apod: veld ${k} is tekst (zelfde vorm als api.nasa.gov)`)

  // Logo als og:image → geen beeld
  const logo = A.bouwApod(items[0], lees('artikel-logo.html'))
  eq([logo.media_type, logo.url, logo.hdurl], ['none', '', ''], 'logo als og:image → media_type none, geen url')
  ok(!JSON.stringify(logo).includes('nasa-logo') && !JSON.stringify(logo).includes('/themes/'), 'logo: nergens in de uitvoer')

  // Artikel niet op te halen → geen beeld, wel tekst
  const zonder = A.bouwApod(items[0], '')
  eq(zonder.media_type, 'none', 'geen artikel → media_type none')
  ok(zonder.explanation.length > 100, 'geen artikel → uitleg uit de feed')

  // Alleen een afgekapt excerpt in de feed → langste van excerpt en og:description
  const kort = A.bouwApod(items[1], '<meta property="og:description" content="The Pelican Nebula is slowly being transformed. IC 5070 is divided from the larger North America Nebula by a molecular cloud filled with dark dust, and lit by young stars.">')
  ok(kort.explanation.endsWith('lit by young stars.'), 'afgekapt excerpt → og:description')

  // Titel "NASA Science" (de oude fout) → nooit doorgeven
  assert.throws(() => A.bouwApod({ ...items[0], title: 'NASA Science' }, lees('artikel.html')), /NASA Science/); checks++
  assert.throws(() => A.bouwApod(undefined, ''), /feed-item/); checks++
  eq(A.parseFeed('<rss><channel></channel></rss>'), [], 'lege feed → geen items')

  // ── 2. De route in worker.js ─────────────────────────────────────────
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apod-worker-'))
  for (const f of fs.readdirSync(path.join(__dirname, '..', 'cf-worker')).filter(f => f.endsWith('.mjs'))) fs.copyFileSync(path.join(__dirname, '..', 'cf-worker', f), path.join(dir, f))
  fs.copyFileSync(path.join(__dirname, '..', 'cf-worker', 'worker.js'), path.join(dir, 'worker.mjs'))
  const worker = (await import(path.join(dir, 'worker.mjs'))).default

  const store = new Map()
  globalThis.caches = { default: {
    match: async k => { const v = store.get(k.url); return v ? new Response(v.body, { headers: v.headers }) : undefined },
    put: async (k, r) => { store.set(k.url, { body: await r.text(), headers: Object.fromEntries(r.headers) }) },
  } }
  let scenario = 'goed'; const opgehaald = []
  globalThis.fetch = async u => {
    u = String(u); opgehaald.push(u)
    if (u === A.APOD_FEED) {
      if (scenario === 'kapot') return new Response('oops', { status: 503 })
      // Een APOD van vandaag (oostkusttijd), zodat de 24u-regel geldt.
      const nu = new Date().toUTCString()
      return new Response(lees('feed.xml').replace('Thu, 15 Oct 2026 04:00:00 +0000', nu), { status: 200 })
    }
    if (u.startsWith('https://science.nasa.gov/image-detail/')) return new Response(lees(scenario === 'logo' ? 'artikel-logo.html' : 'artikel.html'), { status: 200 })
    return new Response('?', { status: 404 })
  }
  const vraag = () => worker.fetch(new Request('https://cosmosnl-proxy.example/apod', { headers: { Origin: 'https://nightgazer.space' } }), {})
  const vandaag = A.apodDatum(Date.now())
  const sleutel = `https://nasa-apod-cache/apod-v3?date=${vandaag}`

  scenario = 'kapot'
  let r = await vraag()
  eq(r.status, 502, 'route: feed kapot → 502')
  eq(store.size, 0, 'route: fout → niets gecachet')

  scenario = 'logo'
  r = await vraag(); let d = await r.json()
  eq([r.status, d.media_type, d.url], [200, 'none', ''], 'route: logo → 200, media_type none')
  eq(store.get(sleutel).headers['cache-control'], 'public, max-age=3600', 'route: afgekeurd beeld → maar 1 uur gecachet')
  ok(!JSON.stringify(d).includes('nasa-logo'), 'route: logo niet in de JSON')

  store.clear(); scenario = 'goed'; opgehaald.length = 0
  r = await vraag(); d = await r.json()
  eq([r.status, d.media_type, d.url, d.date], [200, 'image', BEELD, vandaag], 'route: goede APOD van vandaag')
  eq(store.get(sleutel).headers['cache-control'], 'public, max-age=86400', 'route: goede APOD van vandaag → 24 uur')
  eq(opgehaald.length, 2, 'route: feed + artikel opgehaald')
  eq(r.headers.get('access-control-allow-origin'), 'https://nightgazer.space', 'route: CORS zoals de andere routes')

  opgehaald.length = 0
  r = await vraag(); d = await r.json()
  eq([d.url, opgehaald.length], [BEELD, 0], 'route: tweede vraag uit de cache, geen fetch')

  fs.rmSync(dir, { recursive: true, force: true })
  console.log(`✅ ${checks} APOD-controles geslaagd (fixtures: ${fs.readdirSync(FIX).join(', ')})`)
})().catch(e => { console.error(e); process.exit(1) })

// ── 3. localStorage op de homepage (lib/apod-cache.ts) ──────────────────
// Getranspileerd met de TypeScript van het project, zodat de test de echte
// code draait.
;(async () => {
  const ts = require('typescript')
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'apod-cache.ts'), 'utf-8')
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText
  const mod = { exports: {} }
  new Function('module', 'exports', 'require', js)(mod, mod.exports, require)
  const C = mod.exports
  let n = 0
  const t = (c, m) => { assert.ok(c, m); n++ }
  const goed = { date: '2026-10-15', title: 'The Milky Way over Manhattan', explanation: 'x', url: 'https://assets.science.nasa.gov/a.jpg', hdurl: 'https://assets.science.nasa.gov/a.jpg', media_type: 'image', copyright: 'Jason Kurth, Ty Buckley' }
  const logo = { ...goed, title: 'NASA Science', url: 'https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png', hdurl: 'https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png' }
  t(C.isGeldigeApod(goed), 'cache: goede APOD geldig')
  t(!C.isGeldigeApod(logo), 'cache: oude logo-APOD ongeldig')
  t(!C.isGeldigeApod({ ...goed, title: 'NASA Science' }), 'cache: titel "NASA Science" ongeldig')
  t(!C.isGeldigeApod({ ...goed, hdurl: 'https://science.nasa.gov/wp-content/themes/x/bg.jpg' }), 'cache: /themes/ in hdurl ongeldig')
  t(!C.isGeldigeApod({ ...goed, url: 'https://assets.science.nasa.gov/nasa-logo.png' }), 'cache: nasa-logo in url ongeldig')
  t(!C.isGeldigeApod(null) && !C.isGeldigeApod({}), 'cache: leeg ongeldig')
  const vandaag = '2026-10-15'
  t(C.leesApodCache(C.schrijfApodCache(goed, vandaag), vandaag)?.title === goed.title, 'cache: goede APOD van vandaag terug')
  t(C.leesApodCache(C.schrijfApodCache(logo, vandaag), vandaag) === null, 'cache: logo-APOD van vandaag → null (opnieuw ophalen)')
  t(C.leesApodCache(JSON.stringify({ date: vandaag, data: logo }), vandaag) === null, 'cache: oud formaat (zonder versie) met logo → null')
  t(C.leesApodCache(JSON.stringify({ date: vandaag, data: goed }), vandaag) === null, 'cache: oud formaat zonder versie → één keer opnieuw ophalen')
  t(C.leesApodCache(C.schrijfApodCache(goed, '2026-10-14'), vandaag) === null, 'cache: van gisteren → null')
  t(C.leesApodCache('{kapot', vandaag) === null && C.leesApodCache(null, vandaag) === null, 'cache: kapot of leeg → null')
  console.log(`✅ ${n} localStorage-controles geslaagd (lib/apod-cache.ts)`)
})().catch(e => { console.error(e); process.exit(1) })
