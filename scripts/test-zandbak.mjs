// scripts/test-zandbak.mjs
// Ruimtezandbak (lib/zandbak.ts): blijft de energie behouden, draait een
// getikte planeet echt in een cirkel, smelten botsers goed samen en doen de
// scènes wat de uitleg belooft.
import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import ts from 'typescript'

const hier = path.dirname(fileURLToPath(import.meta.url))
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zandbak-'))
for (const f of ['zandbak', 'zandbak-teken']) {
  const p = path.join(hier, `../lib/${f}.ts`)
  if (!fs.existsSync(p)) continue
  let js = ts.transpileModule(fs.readFileSync(p, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
  js = js.replace(/from '\.\/([a-z-]+)'/g, "from './$1.mjs'")
  fs.writeFileSync(path.join(tmp, `${f}.mjs`), js)
}
const Z = await import(pathToFileURL(path.join(tmp, 'zandbak.mjs')).href)
const scene = id => Z.SCENES.find(s => s.id === id)
const naam = (w, n) => w.lichamen.find(b => b.naam === n)
const afstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// 1. Zonnestelsel: tien jaar, energie binnen 0,1 %, aarde blijft op ~1 AE, jaar klopt.
{
  const w = Z.bouw(scene('zonnestelsel'))
  const E0 = w.energie()
  let min = 9, max = 0
  for (let i = 0; i < 3650; i++) {
    w.stap(Z.DAG)
    const d = afstand(naam(w, 'Aarde'), naam(w, 'Zon'))
    min = Math.min(min, d); max = Math.max(max, d)
  }
  assert.equal(w.lichamen.length, 5, 'alle planeten nog aanwezig')
  assert.ok(Math.abs((w.energie() - E0) / E0) < 1e-3, 'energie behouden')
  assert.ok(min > 0.98 && max < 1.02, `aarde blijft op 1 AE (${min.toFixed(3)}..${max.toFixed(3)})`)
  console.log('✓ zonnestelsel: 10 jaar stabiel, energie behouden')
}

// 2. Een getikte planeet krijgt een cirkelbaan; een maan naast een reus draait om de reus.
{
  const w = Z.bouw(scene('leeg'))
  const zet = (x, y, m, naam, soort) => { const c = Z.cirkelSnelheid(w, x, y, m); return { b: w.voegToe({ naam, soort, m, x, y, vx: c.vx, vy: c.vy }), baas: c.baas } }
  const { b: reus } = zet(1.5, 0, Z.JUPITERMASSA, 'Reus', 'reus')
  const { b: maan, baas } = zet(1.5 + 0.02, 0, Z.MAANMASSA, 'Maantje', 'maan')
  assert.equal(baas.naam, 'Reus', 'maan naast reus draait om de reus')
  const { baas: baas2 } = zet(0.6, 0.2, Z.AARDMASSA, 'Planeet', 'planeet')
  assert.equal(baas2.naam, 'Zon', 'planeet verder weg draait om de zon')
  let min = 9, max = 0
  for (let i = 0; i < 1000; i++) { w.stap(Z.DAG); const d = afstand(maan, reus); min = Math.min(min, d); max = Math.max(max, d) }
  assert.ok(w.lichamen.includes(maan) && min > 0.016 && max < 0.024, `maan blijft om de reus (${min.toFixed(4)}..${max.toFixed(4)})`)
  console.log('✓ tikken geeft een cirkelbaan, ook voor een maan om een reus')
}

// 3. Botsing: massa en impuls behouden, zwaarste houdt zijn naam.
{
  const w = new Z.Wereld()
  w.voegToe({ naam: 'Groot', soort: 'planeet', m: 3e-6, x: 0, y: 0, vx: 0, vy: 0 })
  w.voegToe({ naam: 'Klein', soort: 'maan', m: 1e-6, x: 0.001, y: 0, vx: -2, vy: 0 })
  const p0 = w.lichamen.reduce((s, b) => s + b.m * b.vx, 0)
  const uit = []
  w.stap(0.01, 4000, uit)
  assert.equal(w.lichamen.length, 1)
  assert.equal(w.lichamen[0].naam, 'Groot')
  assert.ok(Math.abs(w.lichamen[0].m - 4e-6) < 1e-15)
  assert.ok(Math.abs(w.lichamen[0].m * w.lichamen[0].vx - p0) < 1e-12, 'impuls behouden')
  assert.equal(uit[0].soort, 'botsing')
  console.log('✓ botsing smelt samen met behoud van massa en impuls')
}

// 4. Zon weg: de planeten vliegen weg en worden opgeruimd.
{
  const w = Z.bouw(scene('zonnestelsel'))
  w.lichamen = w.lichamen.filter(b => b.naam !== 'Zon')
  const uit = []
  for (let i = 0; i < 400; i++) w.stap(0.25, 4000, uit)
  assert.ok(w.lichamen.length < 4, 'planeten ontsnappen')
  console.log(`✓ zon weg: ${uit.filter(g => g.soort === 'ontsnapt').length} planeten ontsnapt`)
}

// 5. Scènes draaien zonder NaN; verslag voor de uitleg.
for (const s of Z.SCENES) {
  const w = Z.bouw(s)
  const uit = []
  const jaren = s.id === 'twee-manen' ? 2 : s.id === 'leeg' ? 1 : 12
  const stap = s.dagenPerSec * Z.DAG / 60
  let t = 0
  const t0 = Date.now()
  while (t < jaren) t += w.stap(stap, 4000, uit)
  for (const b of w.lichamen) assert.ok(Number.isFinite(b.x) && Number.isFinite(b.vx), `${s.id}: ${b.naam} eindig`)
  console.log(`✓ ${s.id}: ${jaren} jaar in ${Date.now() - t0} ms, over: ${w.lichamen.map(b => b.naam).join(', ')}; ${uit.map(g => g.soort + ':' + (g.b ? g.b + '>' + g.a : g.naam)).join(' ') || 'rustig'}`)
}

// 6. Teksten.
assert.equal(Z.tijdTekst(0), '0 dagen')
assert.equal(Z.tijdTekst(1 + 2 * Z.DAG), '1 jaar, 2 dagen')
assert.equal(Z.massaTekst(1), '1 zonmassa')
assert.equal(Z.massaTekst(Z.AARDMASSA), '1 keer de aarde')
assert.equal(Z.afstandTekst(0.00257), '384.000 km')
console.log('✓ teksten')
