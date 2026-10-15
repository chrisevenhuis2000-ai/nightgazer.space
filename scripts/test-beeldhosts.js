// scripts/test-beeldhosts.js
// De allowlist van /image-proxy (cf-worker/beeldhosts.mjs).
//
//   1. magBeeld: toegestaan/geweigerd, ook de bekende trucs (andere host
//      met nasa.gov in de naam, inloggegevens in de URL, ander protocol).
//   2. Inventaris: elke afbeelding die de site echt toont valt binnen de
//      lijst — imageUrl van alle artikelen (content/articles en, na een build,
//      public/articles-index.json), afbeeldingen in artikeltekst, missies,
//      vaste beeld-URL's in app/ en de APOD-fixtures.
//   3. De route in worker.js met een nagebootste fetch: 403 zonder fetch voor
//      een andere host, redirect naar een andere host → 403, redirect binnen
//      de lijst wordt gevolgd.

const fs = require('fs')
const os = require('os')
const path = require('path')
const assert = require('assert/strict')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }
const ROOT = path.join(__dirname, '..')

;(async () => {
  const { magBeeld, BEELD_HOSTS } = await import(path.join(ROOT, 'cf-worker', 'beeldhosts.mjs'))

  // ── 1. magBeeld ────────────────────────────────────────────────────────
  for (const u of [
    'https://assets.science.nasa.gov/dynamicimage/assets/science/apod/2026/10/x.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg',
    'https://apod.nasa.gov/apod/image/2610/x.jpg',
    'https://images-assets.nasa.gov/image/x/x~medium.jpg',
    'https://i0.wp.com/spaceflightnow.com/wp-content/uploads/x.jpg?fit=1200',
    'https://images.pexels.com/photos/1/pexels-photo-1.jpeg?auto=compress',
    'https://WWW.ESA.INT/var/esa/storage/images/x.jpg',
    'http://www.nasa.gov/wp-content/uploads/x.jpg',
  ]) ok(magBeeld(u), `toegestaan: ${u.slice(0, 70)}`)
  for (const u of [
    'https://evil.example/x.jpg',
    'https://nasa.gov.evil.example/x.jpg',
    'https://evilnasa.gov/x.jpg',
    'https://www.nasa.gov@evil.example/x.jpg',
    'https://user:pw@www.nasa.gov/x.jpg',
    'ftp://www.nasa.gov/x.jpg',
    'javascript:alert(1)',
    'not a url',
    'https://169.254.169.254/latest/meta-data',
    'https://localhost/x.jpg',
  ]) ok(!magBeeld(u), `geweigerd: ${u}`)

  // ── 2. Inventaris ──────────────────────────────────────────────────────
  const gezien = new Map() // url → bron
  const voeg = (u, bron) => { if (typeof u === 'string' && /^https?:\/\//i.test(u) && !gezien.has(u)) gezien.set(u, bron) }

  const artDir = path.join(ROOT, 'content', 'articles')
  for (const f of fs.readdirSync(artDir).filter(f => f.endsWith('.md'))) {
    const t = fs.readFileSync(path.join(artDir, f), 'utf-8')
    const [, fm = '', body = ''] = t.startsWith('---') ? t.split('---') : ['', '', t]
    for (const m of fm.matchAll(/^(\w*[iI]mage\w*|thumbnail|cover)\s*:\s*["']?(https?:\/\/[^\s"']+)/gm)) voeg(m[2], `artikel ${f}`)
    for (const m of body.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/g)) voeg(m[1], `tekst ${f}`)
    for (const m of body.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)/g)) voeg(m[1], `tekst ${f}`)
  }
  const index = path.join(ROOT, 'public', 'content', 'articles-index.json')
  let uitIndex = 0
  if (fs.existsSync(index)) {
    const d = JSON.parse(fs.readFileSync(index, 'utf-8'))
    for (const a of Array.isArray(d) ? d : d.articles || []) for (const [k, v] of Object.entries(a)) if (/image/i.test(k) && typeof v === 'string' && v) { voeg(v, `index ${a.slug || ''}`); uitIndex++ }
  }
  const missies = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'missions.json'), 'utf-8')).missions
  for (const m of missies) for (const [k, v] of Object.entries(m)) if (typeof v === 'string' && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(v)) voeg(v, `missie ${m.id}.${k}`)
  // Vaste beeld-URL's in de code die door de proxy gaan (bv. de ISS-kaart):
  // constanten die in img(X, …) of image-proxy?url=${encodeURIComponent(X)}
  // terechtkomen. Wat de browser zelf laadt (Leaflet-iconen, kaarttegels)
  // gaat niet door de proxy en telt hier niet mee.
  const appDir = path.join(ROOT, 'app')
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])
  for (const f of walk(appDir).filter(f => /\.tsx?$/.test(f))) {
    const t = fs.readFileSync(f, 'utf-8')
    const namen = new Set([...t.matchAll(/(?:\bimg\(|image-proxy\?url=\$\{encodeURIComponent\()\s*([A-Z_][A-Z0-9_]*)\b/g)].map(m => m[1]))
    for (const n of namen) {
      const m = new RegExp(`const\\s+${n}\\s*=\\s*['"\`](https?:\\/\\/[^'"\`]+)['"\`]`).exec(t)
      if (m) voeg(m[1], `code ${path.relative(ROOT, f)} (${n})`)
    }
    for (const m of t.matchAll(/(?:\bimg\(|image-proxy\?url=\$\{encodeURIComponent\()\s*['"`](https?:\/\/[^'"`]+)['"`]/g)) voeg(m[1], `code ${path.relative(ROOT, f)}`)
  }
  const apodFix = path.join(__dirname, '__fixtures__', 'apod')
  for (const f of fs.readdirSync(apodFix).filter(f => f.endsWith('.html') && !f.includes('logo'))) {
    const m = /og:image" content="([^"]+)"/.exec(fs.readFileSync(path.join(apodFix, f), 'utf-8'))
    if (m) voeg(m[1], `apod-fixture ${f}`)
  }

  const buiten = [...gezien].filter(([u]) => !magBeeld(u))
  if (buiten.length) console.error('Buiten de lijst:\n' + buiten.slice(0, 20).map(([u, b]) => `  ${u}  (${b})`).join('\n'))
  eq(buiten.length, 0, 'inventaris: geen enkele afbeelding van de site valt buiten de lijst')
  ok(gezien.size > 500, `inventaris: genoeg afbeeldingen gezien (${gezien.size})`)
  const perHost = {}
  for (const [u] of gezien) { const h = new URL(u).hostname; perHost[h] = (perHost[h] || 0) + 1 }
  const ongebruikt = [...BEELD_HOSTS].filter(h => !perHost[h])

  // ── 3. De route in worker.js ───────────────────────────────────────────
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'beeldhosts-worker-'))
  for (const f of ['apod.mjs', 'beeldhosts.mjs']) fs.copyFileSync(path.join(ROOT, 'cf-worker', f), path.join(dir, f))
  fs.copyFileSync(path.join(ROOT, 'cf-worker', 'worker.js'), path.join(dir, 'worker.mjs'))
  const worker = (await import(path.join(dir, 'worker.mjs'))).default
  const store = new Map(); let cacheVragen = 0
  globalThis.caches = { default: {
    match: async k => { cacheVragen++; return store.get(k.url) },
    put: async (k, r) => { store.set(k.url, r) },
  } }
  const opgehaald = []
  const PNG = new Uint8Array([137, 80, 78, 71])
  globalThis.fetch = async (u, init = {}) => {
    u = String(u); opgehaald.push(u)
    if (u === 'https://www.nasa.gov/redirect-weg') return new Response(null, { status: 302, headers: { Location: 'https://evil.example/x.png' } })
    if (u === 'https://www.nasa.gov/redirect-goed') return new Response(null, { status: 301, headers: { Location: '/wp-content/uploads/goed.png' } })
    if (u.startsWith('https://www.nasa.gov/') || u.startsWith('https://images-assets.nasa.gov/')) return new Response(PNG, { status: 200, headers: { 'Content-Type': 'image/png' } })
    return new Response('nee', { status: 404 })
  }
  const vraag = u => worker.fetch(new Request(`https://proxy.example/image-proxy?url=${encodeURIComponent(u)}`, { headers: { Origin: 'https://nightgazer.space' } }), {})

  let r = await vraag('https://evil.example/x.png')
  eq([r.status, opgehaald.length, cacheVragen], [403, 0, 0], 'route: andere host → 403, geen fetch, geen cache-lookup')
  r = await vraag('https://www.nasa.gov@evil.example/x.png')
  eq(r.status, 403, 'route: inloggegevens-truc → 403')
  r = await vraag('https://images-assets.nasa.gov/image/a/a~medium.jpg')
  eq([r.status, r.headers.get('content-type')], [200, 'image/png'], 'route: toegestane host → beeld')
  opgehaald.length = 0
  r = await vraag('https://www.nasa.gov/redirect-weg')
  eq([r.status, opgehaald], [403, ['https://www.nasa.gov/redirect-weg']], 'route: redirect naar een andere host → 403, die host niet opgehaald')
  opgehaald.length = 0
  r = await vraag('https://www.nasa.gov/redirect-goed')
  eq([r.status, opgehaald], [200, ['https://www.nasa.gov/redirect-goed', 'https://www.nasa.gov/wp-content/uploads/goed.png']], 'route: redirect binnen de lijst wordt gevolgd')
  fs.rmSync(dir, { recursive: true, force: true })

  console.log(`✅ ${checks} beeldhost-controles geslaagd — ${gezien.size} afbeeldingen nagekeken${uitIndex ? ` (+ ${uitIndex} beeldvelden uit de build-index meegeteld)` : ' (geen build-index gevonden: draai eerst npm run build)'}`)
  console.log('   per host:', Object.entries(perHost).sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h} ${n}`).join(', '))
  if (ongebruikt.length) console.log('   in de lijst, (nog) niet in de data:', ongebruikt.join(', '))
})().catch(e => { console.error(e); process.exit(1) })
