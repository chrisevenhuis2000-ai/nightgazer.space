// scripts/test-nieuws-statisch.js
// De statische HTML (na npm run build) toont de echte nieuwste artikelen, voor
// crawlers zonder JavaScript:
//   - out/nieuws/index.html en out/index.html bevatten de nieuwste titels uit
//     de index, met link, en het juiste totaal;
//   - de onderwerppagina's tonen de nieuwste artikelen van hun onderwerp, met
//     het juiste aantal;
//   - de oude ingebakken voorbeeldartikelen (K2-18b, DESI, neutronenster)
//     staan er niet als fallback in.

const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'out')
if (!fs.existsSync(path.join(OUT, 'nieuws', 'index.html'))) {
  console.error('Geen out/: draai eerst npm run build')
  process.exit(1)
}

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'content', 'articles-index.json'), 'utf-8'))
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#x27': "'", nbsp: ' ' }
// Alleen wat zonder JS zichtbaar is: scripts (ook de RSC-payload) eruit.
const zichtbaar = f => fs.readFileSync(path.join(OUT, f), 'utf-8')
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/&(amp|lt|gt|quot|#39|#x27|nbsp);/g, (_, e) => ENT[e])
const tekst = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const slugVan = v => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

for (const f of ['nieuws/index.html', 'index.html']) {
  const h = zichtbaar(f)
  const t = tekst(h)
  for (const a of index.slice(0, 10)) {
    ok(t.includes(a.title), `${f}: titel "${a.title.slice(0, 50)}"`)
    ok(h.includes(`href="/nieuws/${a.slug}/"`) || h.includes(`href="/nieuws/${a.slug}"`), `${f}: link naar ${a.slug}`)
  }
  ok(t.includes(`${index.length} platen`), `${f}: totaal ${index.length} platen`)
  ok(!t.includes(`40 van ${index.length} platen`), `${f}: geen "40 van ${index.length}" uit de startset`)
}

const nieuws = tekst(zichtbaar('nieuws/index.html'))
for (const oud of ['James Webb vindt mogelijke sporen van leven op K2-18b', 'DESI: donkere energie verzwakt', 'Wat is een neutronenster? Uitleg in 3 niveaus']) {
  const echt = index.findIndex(a => a.title.startsWith(oud))
  // Alleen fout als het oude artikel niet ook echt bij de nieuwste staat.
  if (echt < 0 || echt >= 40) ok(!nieuws.includes(oud), `nieuws: geen ingebakken "${oud}"`)
}

for (const dir of fs.readdirSync(path.join(OUT, 'nieuws', 'onderwerp'))) {
  const eigen = index.filter(a => slugVan(a.category) === dir)
  const t = tekst(zichtbaar(path.join('nieuws', 'onderwerp', dir, 'index.html')))
  for (const a of eigen.slice(0, 3)) ok(t.includes(a.title), `onderwerp ${dir}: titel "${a.title.slice(0, 40)}"`)
  ok(t.includes(`${eigen.length} van ${index.length} platen`), `onderwerp ${dir}: ${eigen.length} van ${index.length} platen`)
}

ok(!fs.readFileSync(path.join(ROOT, 'lib', 'home-content.ts'), 'utf-8').includes('FALLBACK_ARTICLES'), 'geen FALLBACK_ARTICLES meer in de code')

console.log(`✅ ${checks} controles geslaagd — statische HTML toont de ${index.length} artikelen uit de index`)
