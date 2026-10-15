// scripts/test-verwijderd.js
// De verwijderde dunne artikelen (functions/nieuws/_middleware.js):
//   1. De middleware: 410 voor een verwijderde slug die niet (meer) bestaat,
//      gewone 404 voor een onbekende slug, en een pagina die wél bestaat gaat
//      altijd voor (bv. als de nieuwsbot een artikel opnieuw publiceert).
//   2. Geen verwijderde slug heeft nog een bestand in content/articles.
//   3. Geen interne link of slug-verwijzing in app/, lib/, content/ en (na een
//      build) public/ en out/ wijst nog naar een verwijderd artikel.
//   4. Geen overgebleven artikel bevat "appeared first on".

const fs = require('fs')
const os = require('os')
const path = require('path')
const assert = require('assert/strict')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }
const ROOT = path.join(__dirname, '..')

;(async () => {
  // Pages Functions zijn ES-modules; package.json is CommonJS → kopie als .mjs.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verwijderd-'))
  const kopie = path.join(dir, 'mw.mjs')
  fs.copyFileSync(path.join(ROOT, 'functions', 'nieuws', '_middleware.js'), kopie)
  const { onRequest, VERWIJDERD, slugUit } = await import(kopie)
  fs.rmSync(dir, { recursive: true, force: true })

  // ── 1. Middleware ──────────────────────────────────────────────────────
  const eenWeg = [...VERWIJDERD][0]
  const statisch = (status) => async () => new Response(status === 200 ? 'pagina' : 'niet gevonden', { status })
  const vraag = (pad, status, method = 'GET') => onRequest({ request: new Request(`https://nightgazer.space${pad}`, { method }), next: statisch(status) })

  let r = await vraag(`/nieuws/${eenWeg}/`, 404)
  eq(r.status, 410, 'verwijderde slug → 410')
  ok((await r.text()).includes('Dit artikel is verwijderd'), '410 heeft een nette "verwijderd"-pagina')
  eq(r.headers.get('x-robots-tag'), 'noindex', '410 met noindex')
  ok(/text\/html/.test(r.headers.get('content-type')), '410 is HTML')
  eq((await vraag(`/nieuws/${eenWeg}`, 404)).status, 410, 'ook zonder slash')
  eq((await vraag(`/nieuws/${eenWeg}/index.txt?_rsc=abc`, 404)).status, 410, 'ook de RSC-payload')
  eq((await vraag(`/nieuws/${eenWeg.toUpperCase()}/`, 404)).status, 410, 'hoofdletters maken niet uit')
  r = await vraag(`/nieuws/${eenWeg}/`, 404, 'HEAD')
  eq([r.status, await r.text()], [410, ''], 'HEAD → 410 zonder body')
  eq((await vraag('/nieuws/bestaat-niet-en-stond-er-nooit/', 404)).status, 404, 'onbekende slug blijft 404')
  r = await vraag(`/nieuws/${eenWeg}/`, 200)
  eq([r.status, await r.text()], [200, 'pagina'], 'bestaande pagina gaat voor (opnieuw gepubliceerd)')
  eq((await vraag('/nieuws/', 200)).status, 200, 'het nieuwsoverzicht zelf ongemoeid')
  eq(slugUit('/nieuws/%E0%A4%A/'), null, 'kapotte URL-codering → geen slug, geen crash')

  // ── 2. Geen bestanden meer ─────────────────────────────────────────────
  const artDir = path.join(ROOT, 'content', 'articles')
  const nog = fs.readdirSync(artDir).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3))
  ok(VERWIJDERD.size > 600, `lijst is gevuld (${VERWIJDERD.size})`)
  eq(nog.filter(s => VERWIJDERD.has(s)).filter(s => {
    // Opnieuw gepubliceerd door de nieuwsbot mag; dat is dan een echt artikel.
    const t = fs.readFileSync(path.join(artDir, s + '.md'), 'utf-8')
    return /appeared first on/i.test(t) || /Redactie CosmosNL/.test(t)
  }), [], 'geen verwijderd (oud) artikel meer in content/articles')

  // ── 3. Geen verwijzingen ───────────────────────────────────────────────
  const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : []
  const bestaand = new Set(nog)
  const pat = /\/nieuws\/([a-z0-9-]+)|slug:\s*['"]([a-z0-9-]+)['"]|"slug"\s*:\s*"([a-z0-9-]+)"/g
  const fout = []
  let bekeken = 0
  for (const d of ['app', 'lib', 'content', 'public', 'out']) {
    for (const f of walk(path.join(ROOT, d))) {
      if (!/\.(tsx?|jsx?|mjs|json|md|html|xml|txt)$/.test(f)) continue
      bekeken++
      const t = fs.readFileSync(f, 'utf-8')
      for (const m of t.matchAll(pat)) {
        const s = m[1] || m[2] || m[3]
        if (VERWIJDERD.has(s) && !bestaand.has(s)) fout.push(`${path.relative(ROOT, f)} → ${s}`)
      }
    }
  }
  if (fout.length) console.error(fout.slice(0, 20).join('\n'))
  eq(fout.length, 0, `geen verwijzing naar een verwijderd artikel (${bekeken} bestanden)`)

  // ── 4. Kwaliteit van wat blijft ────────────────────────────────────────
  eq(nog.filter(s => /appeared first on/i.test(fs.readFileSync(path.join(artDir, s + '.md'), 'utf-8'))), [], 'geen "appeared first on" meer')

  const gebouwd = fs.existsSync(path.join(ROOT, 'out'))
  console.log(`✅ ${checks} controles geslaagd — ${VERWIJDERD.size} verwijderd, ${nog.length} artikelen over${gebouwd ? '' : ' (geen out/: draai eerst npm run build voor de controle op de gebouwde site)'}`)
})().catch(e => { console.error(e); process.exit(1) })
