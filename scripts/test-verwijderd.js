// scripts/test-verwijderd.js
// De verwijderde dunne artikelen (lijst: scripts/__fixtures__/verwijderde-artikelen.txt).
// Hun URL's geven de gewone statische 404; deze test bewaakt dat ze ook echt
// nergens meer zijn:
//   1. Geen bestand meer in content/articles.
//   2. Na een build: geen pagina in out/nieuws/<slug>/ en geen kopie in
//      out/content/articles/.
//   3. sitemap.xml, rss.xml en articles-index.json (bron en build) bevatten
//      geen verwijderde slug.
//   4. Geen interne link of slug-verwijzing in app/, lib/, content/ en out/
//      wijst naar een verwijderd artikel.
//   5. Geen overgebleven artikel bevat "appeared first on".
// Publiceert de nieuwsbot later een artikel opnieuw onder dezelfde slug (nu
// als echte Nederlandse versie), dan telt dat niet als fout.

const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }
const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'out')

const lijst = fs.readFileSync(path.join(__dirname, '__fixtures__', 'verwijderde-artikelen.txt'), 'utf-8')
  .split('\n').map(r => r.trim()).filter(r => r && !r.startsWith('#'))
const artDir = path.join(ROOT, 'content', 'articles')
const bestaand = new Set(fs.readdirSync(artDir).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)))
// Wat nu weg hoort te zijn: verwijderd en niet opnieuw gepubliceerd.
const weg = new Set(lijst.filter(s => !bestaand.has(s)))

ok(lijst.length > 600, `lijst is gevuld (${lijst.length})`)
eq(new Set(lijst).size, lijst.length, 'geen dubbele slugs in de lijst')

// ── 1. content/articles ──────────────────────────────────────────────────
const oudTerug = lijst.filter(s => bestaand.has(s)).filter(s => {
  const t = fs.readFileSync(path.join(artDir, s + '.md'), 'utf-8')
  return /appeared first on/i.test(t) || /Redactie CosmosNL/.test(t)
})
eq(oudTerug, [], 'geen verwijderd (oud) artikel meer in content/articles')

// ── 2. Gebouwde site ─────────────────────────────────────────────────────
const gebouwd = fs.existsSync(path.join(OUT, 'nieuws'))
if (gebouwd) {
  const paginas = fs.readdirSync(path.join(OUT, 'nieuws')).filter(s => weg.has(s))
  eq(paginas, [], 'geen pagina van een verwijderd artikel in out/nieuws/')
  const kopieDir = path.join(OUT, 'content', 'articles')
  const kopieen = fs.existsSync(kopieDir) ? fs.readdirSync(kopieDir).filter(f => weg.has(f.replace(/\.md$/, ''))) : []
  eq(kopieen, [], 'geen markdown van een verwijderd artikel in out/content/articles/')
  const aantal = fs.readdirSync(path.join(OUT, 'nieuws'), { withFileTypes: true })
    .filter(e => e.isDirectory() && bestaand.has(e.name)).length
  eq(aantal, bestaand.size, `elk overgebleven artikel heeft een pagina (${aantal})`)
}

// ── 3. Sitemap, RSS, index ───────────────────────────────────────────────
const slugsIn = (bestand) => {
  const t = fs.readFileSync(bestand, 'utf-8')
  const s = new Set()
  for (const m of t.matchAll(/\/nieuws\/([a-z0-9-]+)/g)) s.add(m[1])
  for (const m of t.matchAll(/"slug"\s*:\s*"([a-z0-9-]+)"/g)) s.add(m[1])
  return s
}
let feeds = 0
for (const rel of ['public/sitemap.xml', 'public/rss.xml', 'public/content/articles-index.json',
                   'out/sitemap.xml', 'out/rss.xml', 'out/content/articles-index.json']) {
  const f = path.join(ROOT, rel)
  if (!fs.existsSync(f)) continue
  feeds++
  eq([...slugsIn(f)].filter(s => weg.has(s)), [], `${rel}: geen verwijderde slug`)
}
ok(feeds >= 3 || !gebouwd, `sitemap, RSS en index gevonden (${feeds} bestanden)`)

// ── 4. Interne verwijzingen ──────────────────────────────────────────────
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : []
const pat = /\/nieuws\/([a-z0-9-]+)|slug:\s*['"]([a-z0-9-]+)['"]|"slug"\s*:\s*"([a-z0-9-]+)"/g
const fout = []
let bekeken = 0
for (const d of ['app', 'lib', 'content', 'out']) {
  for (const f of walk(path.join(ROOT, d))) {
    if (!/\.(tsx?|jsx?|mjs|json|md|html|xml|txt)$/.test(f)) continue
    bekeken++
    for (const m of fs.readFileSync(f, 'utf-8').matchAll(pat)) {
      const s = m[1] || m[2] || m[3]
      if (weg.has(s)) fout.push(`${path.relative(ROOT, f)} → ${s}`)
    }
  }
}
if (fout.length) console.error(fout.slice(0, 20).join('\n'))
eq(fout.length, 0, `geen verwijzing naar een verwijderd artikel (${bekeken} bestanden)`)

// ── 5. Kwaliteit van wat blijft ──────────────────────────────────────────
eq([...bestaand].filter(s => /appeared first on/i.test(fs.readFileSync(path.join(artDir, s + '.md'), 'utf-8'))), [], 'geen "appeared first on" meer')

console.log(`✅ ${checks} controles geslaagd — ${lijst.length} verwijderd, ${bestaand.size} artikelen over${gebouwd ? '' : ' (geen out/: draai eerst npm run build voor de controle op de gebouwde site)'}`)
