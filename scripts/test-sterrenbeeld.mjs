// scripts/test-sterrenbeeld.mjs
// Teken het sterrenbeeld (lib/sterrenbeeld.ts): bestaan alle sterren, staat
// het sterrenbeeld van de dag echt hoog, kloppen de tijden rond zomertijd,
// past het speelveld en werkt het tekenen.
import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import ts from 'typescript'

const hier = path.dirname(fileURLToPath(import.meta.url))
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sterrenbeeld-'))
for (const f of ['sky-chart', 'hemelfoto', 'sterrenbeeld']) {
  const bron = fs.readFileSync(path.join(hier, `../lib/${f}.ts`), 'utf8')
  let js = ts.transpileModule(bron, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
  js = js.replace(/from '\.\/([a-z-]+)'/g, "from './$1.mjs'")
  fs.writeFileSync(path.join(tmp, `${f}.mjs`), js)
}
const S = await import(pathToFileURL(path.join(tmp, 'sterrenbeeld.mjs')).href)
const K = await import(pathToFileURL(path.join(tmp, 'sky-chart.mjs')).href)

let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++ }
const sterNamen = new Set(K.STARS.map(s => s.name))

// ── Data ─────────────────────────────────────────────────────────────────
eq(new Set(S.BEELDEN.map(b => b.id)).size, S.BEELDEN.length, 'data: elk id uniek')
for (const b of S.BEELDEN) {
  for (const naam of b.paden.flat()) ok(sterNamen.has(naam), `data: ${b.id} ster ${naam} staat in de catalogus`)
  ok(S.lijnenVan(b).length >= 3, `data: ${b.id} heeft minstens drie lijnen`)
  ok(b.verhaal.length > 80 && b.tip.length > 40, `data: ${b.id} heeft verhaal en tip`)
  ok(!/[—]/.test(b.verhaal + b.tip), `data: ${b.id} zonder gedachtestreepjes`)
  ok(b.verder.href.startsWith('/') && b.verder.href.endsWith('/'), `data: ${b.id} vervolglink`)
}

// ── Tijd ─────────────────────────────────────────────────────────────────
eq(S.nlTijdstip('2026-11-10', 21).toISOString(), '2026-11-10T20:00:00.000Z', 'tijd: wintertijd 21:00 = 20:00 UTC')
eq(S.nlTijdstip('2027-06-21', 23).toISOString(), '2027-06-21T21:00:00.000Z', 'tijd: zomertijd 23:00 = 21:00 UTC')
eq(S.nlTijdstip('2027-03-28', 21).toISOString(), '2027-03-28T19:00:00.000Z', 'tijd: dag van de omschakeling is al zomertijd')
eq([S.kijkuur('2026-11-10'), S.kijkuur('2027-04-01'), S.kijkuur('2027-09-30'), S.kijkuur('2027-10-01')], [21, 23, 23, 21], 'tijd: kijkuur per seizoen')

// ── Sterrenbeeld van de dag ──────────────────────────────────────────────
const start = Date.UTC(2026, 10, 10)
const gezien = new Set()
for (let d = 0; d < 366; d++) {
  const iso = new Date(start + d * 86_400_000).toISOString().slice(0, 10)
  const b = S.beeldVanDag(iso)
  const alt = S.standVan(b, S.nlTijdstip(iso, S.kijkuur(iso))).alt
  ok(alt >= S.MIN_HOOGTE, `dag ${iso}: ${b.id} staat ${alt.toFixed(0)}° hoog`)
  ok(S.zichtbaar(iso).length >= 4, `dag ${iso}: genoeg keus voor ‘teken er nog een’`)
  gezien.add(b.id)
}
ok(gezien.size >= 14, `jaar: ${gezien.size} verschillende sterrenbeelden komen langs`)
eq(S.beeldVanDag('2026-11-10').id, S.beeldVanDag('2026-11-10').id, 'dag: vaste keuze')
ok(S.beeldVanDag('2026-11-10').id !== S.beeldVanDag('2026-11-11').id, 'dag: wisselt van dag op dag')
// Bekende stand: Cassiopeia staat op een novemberavond hoog in het noordoosten tot noorden.
const cas = S.standVan(S.BEELDEN.find(b => b.id === 'cassiopeia'), S.nlTijdstip('2026-11-10', 21))
ok(cas.alt > 65, 'stand: Cassiopeia hoog op 10 november')
const ori = S.standVan(S.BEELDEN.find(b => b.id === 'orion'), S.nlTijdstip('2027-01-15', 21))
ok(ori.alt > 25 && ori.alt < 45 && /zuid/.test(ori.richting), `stand: Orion half januari in het zuiden (${ori.richting}, ${ori.alt.toFixed(0)}°)`)

// ── Speelveld ────────────────────────────────────────────────────────────
for (const b of S.BEELDEN) {
  const iso = '2027-01-15'
  const t = S.nlTijdstip(iso, 21)
  const v = S.speelveld(b, t, 1000)
  const eigen = v.filter(p => p.hoort)
  eq(eigen.length, new Set(b.paden.flat()).size, `veld: ${b.id} toont al zijn sterren`)
  ok(v.every(p => p.x >= 0 && p.x <= 1000 && p.y >= 0 && p.y <= 1000), `veld: ${b.id} past in beeld`)
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
    if (!v[i].hoort && !v[j].hoort) continue
    ok(Math.hypot(v[i].x - v[j].x, v[i].y - v[j].y) > 28, `veld: ${b.id} ${v[i].naam} en ${v[j].naam} liggen niet op elkaar`)
  }
}
// Horizon onder: van een laag sterrenbeeld staat de laagste ster onderaan.
{
  const iso = '2027-01-15', t = S.nlTijdstip(iso, 21)
  const b = S.BEELDEN.find(x => x.id === 'orion')
  const v = S.speelveld(b, t).filter(p => p.hoort)
  const hoogte = naam => { const s = K.STARS.find(x => x.name === naam); return K.altAz(s.ra, s.dec, S.NL.lat, S.NL.lon, t).alt }
  const laagste = [...v].sort((a, c) => hoogte(a.naam) - hoogte(c.naam))[0]
  ok(laagste.y === Math.max(...v.map(p => p.y)), `veld: laagste ster (${laagste.naam}) staat onderaan`)
}

// ── Tekenen ──────────────────────────────────────────────────────────────
const cassi = S.BEELDEN.find(b => b.id === 'cassiopeia')
let spel = S.NIEUW
let r = S.trek(spel, cassi, 'Caph', 'Gamma Cas')
eq([r.uitkomst, r.spel.fouten], ['fout', 1], 'trek: geen lijn telt als misser')
r = S.trek(r.spel, cassi, 'Schedar', 'Caph')
eq(r.uitkomst, 'goed', 'trek: richting maakt niet uit')
eq(S.trek(r.spel, cassi, 'Caph', 'Schedar').uitkomst, 'al', 'trek: dubbele lijn telt niet')
spel = r.spel
eq(S.hint(spel, cassi), S.sleutel('Schedar', 'Gamma Cas'), 'hint: sluit aan op wat er al staat')
for (const [a, b] of [['Schedar', 'Gamma Cas'], ['Gamma Cas', 'Ruchbah'], ['Ruchbah', 'Segin']]) spel = S.trek(spel, cassi, a, b).spel
ok(spel.klaar && spel.fouten === 1, 'trek: alle lijnen = klaar')
eq(S.hint(spel, cassi), null, 'hint: niets meer te tonen')
eq(S.trek(spel, cassi, 'Caph', 'Segin').uitkomst, 'al', 'trek: na afloop telt niets meer')

fs.rmSync(tmp, { recursive: true, force: true })
console.log(`✅ sterrenbeeld: ${n} controles geslaagd`)
