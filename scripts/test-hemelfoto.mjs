// scripts/test-hemelfoto.mjs
// Raad de hemelfoto (lib/hemelfoto.ts): de dagkeuze, de rondes, de gokken,
// de aanwijzingen en de deeltekst. Met --online ook: bestaat elke foto echt
// op images-assets.nasa.gov in de opgegeven variant.
import assert from 'assert/strict'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ts from 'typescript'

const hier = path.dirname(fileURLToPath(import.meta.url))
const bron = fs.readFileSync(path.join(hier, '../lib/hemelfoto.ts'), 'utf8')
const js = ts.transpileModule(bron, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const H = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++ }

// ── Data ─────────────────────────────────────────────────────────────────
const ids = H.ALLE.map(k => k.id)
eq(new Set(ids).size, ids.length, 'data: elk id is uniek')
const namen = H.ALLE.map(k => k.naam.toLowerCase())
eq(new Set(namen).size, namen.length, 'data: elke naam is uniek')
ok(H.FOTOS.length >= 20, 'data: genoeg foto’s voor drie weken zonder herhaling')
for (const f of H.FOTOS) {
  ok(f.uitleg.length > 60 && f.zelfZien.length > 60, `data: ${f.id} heeft uitleg en zelf zien`)
  ok(f.focus.every(v => v >= 0 && v <= 100), `data: ${f.id} focus binnen het beeld`)
  ok(f.zoek.length > 0 && f.verder.href.startsWith('/') && f.verder.href.endsWith('/'), `data: ${f.id} heeft zoekwoorden en een vervolg`)
  ok(Number.isFinite(f.lj) && f.lj >= 0, `data: ${f.id} heeft een afstand`)
  ok(!/[—]/.test(f.uitleg + f.zelfZien), `data: ${f.id} zonder gedachtestreepjes`)
}

// ── Dagen en puzzelnummers ───────────────────────────────────────────────
eq(H.puzzelNr('2026-11-10'), 1, 'dag: startdag is #1')
eq(H.puzzelNr('2026-11-11'), 2, 'dag: dag erna is #2')
eq(H.puzzelNr('2026-01-01'), 1, 'dag: nooit kleiner dan 1')
eq(H.puzzelNr('2027-03-28'), H.puzzelNr('2027-03-27') + 1, 'dag: zomertijd verschuift niets')
eq(H.puzzelDatum(1), '2026-11-10', 'dag: #1 hoort bij de startdag')
eq(H.puzzelDatum(H.puzzelNr('2027-06-15')), '2027-06-15', 'dag: datum en nummer zijn elkaars omgekeerde')
eq(H.nlDag(new Date('2026-11-10T23:30:00Z')), '2026-11-11', 'dag: half één ’s nachts in NL is al de volgende dag')
eq(H.nlDag(new Date('2026-07-01T21:59:00Z')), '2026-07-01', 'dag: zomertijd, 23:59 in NL is nog dezelfde dag')

// ── Rondes ───────────────────────────────────────────────────────────────
const N = H.FOTOS.length
eq(H.fotoVan(1).id, 'orionnevel', 'ronde: november begint met de Orionnevel')
for (let r = 0; r < 6; r++) {
  const ronde = Array.from({ length: N }, (_, i) => H.fotoVan(r * N + i + 1).id)
  eq(new Set(ronde).size, N, `ronde ${r + 1}: elke foto precies één keer`)
  if (r > 0) ok(H.fotoVan(r * N).id !== H.fotoVan(r * N + 1).id, `ronde ${r + 1}: begint niet met de foto van gisteren`)
}
eq(H.fotoVan(N + 5).id, H.fotoVan(N + 5).id, 'ronde: vaste volgorde, iedereen dezelfde foto')

// ── Zoeken ───────────────────────────────────────────────────────────────
eq(H.zoekKandidaten('m42')[0].id, 'orionnevel', 'zoek: Messier-nummer')
eq(H.zoekKandidaten('satur')[0].id, 'saturnus', 'zoek: begin van de naam')
eq(H.zoekKandidaten('Plejaden')[0].id, 'plejaden', 'zoek: andere naam van een lokker')
eq(H.zoekKandidaten('maan')[0].id, 'maan', 'zoek: exacte naam eerst')
ok(H.zoekKandidaten('  ').length === H.ALLE.length, 'zoek: lege tekst geeft de hele lijst')
ok(!H.zoekKandidaten('mars', ['mars']).some(k => k.id === 'mars'), 'zoek: al geraden kandidaten vallen weg')
eq(H.zoekKandidaten('xyzzy'), [], 'zoek: niets gevonden')

// ── Gokken ───────────────────────────────────────────────────────────────
const leeg = { gokken: [], klaar: false, goed: false }
let s = H.verwerkGok(leeg, 'mars', 'saturnus')
eq(s, { gokken: ['mars'], klaar: false, goed: false }, 'gok: fout, verder spelen')
eq(H.verwerkGok(s, 'mars', 'saturnus'), s, 'gok: dezelfde gok telt niet twee keer')
s = H.verwerkGok(s, 'saturnus', 'saturnus')
eq(s, { gokken: ['mars', 'saturnus'], klaar: true, goed: true }, 'gok: goed is klaar')
eq(H.verwerkGok(s, 'venus', 'saturnus'), s, 'gok: na afloop niets meer')
let t = leeg
for (const g of ['mars', 'venus', 'maan', 'zon', 'pluto', 'iss']) t = H.verwerkGok(t, g, 'saturnus')
eq(t.klaar && !t.goed && t.gokken.length, 6, 'gok: na zes fout is het klaar')

// ── Aanwijzingen ─────────────────────────────────────────────────────────
const k = id => H.ALLE.find(x => x.id === id)
eq(H.richting(k('mars'), k('saturnus')), 'verder', 'richting: Saturnus staat verder dan Mars')
eq(H.richting(k('andromeda'), k('orionnevel')), 'dichterbij', 'richting: Orion staat dichterbij dan Andromeda')
eq(H.richting(k('orionnevel'), k('paardenkopnevel')), 'even ver', 'richting: Orion en Paardenkop zijn even ver')
eq(H.richting(k('aarde'), k('aarde')), 'even ver', 'richting: zelfde ding')
eq(H.richting(k('aarde'), k('iss')), 'verder', 'richting: vanaf afstand 0 kan het alleen verder')
ok(H.zoomVoor(0) > H.zoomVoor(1) && H.zoomVoor(5) > H.zoomVoor(6), 'zoom: elke fout zoomt verder uit')
eq(H.zoomVoor(99), 1, 'zoom: nooit verder dan het hele beeld')

// ── Delen ────────────────────────────────────────────────────────────────
const d = H.deelTekst(3, { gokken: ['mars', 'jupiter', 'saturnus'], klaar: true, goed: true }, k('saturnus'), 'https://nightgazer.space/spellen/hemelfoto/')
eq(d, 'NightGazer Hemelfoto #3 · 3/6\n🟨🟨🟩\nhttps://nightgazer.space/spellen/hemelfoto/', 'deel: zelfde soort geel, goed groen')
ok(!d.toLowerCase().includes('saturnus'), 'deel: verklapt het antwoord niet')
ok(H.deelTekst(4, t, k('saturnus'), 'u').includes('X/6'), 'deel: niet geraden is X/6')

// ── Online: bestaan de beelden echt? ─────────────────────────────────────
if (process.argv.includes('--online')) {
  for (const f of H.FOTOS) {
    const url = `https://images-assets.nasa.gov/image/${f.nasaId}/${f.nasaId}~${f.variant}.jpg`
    const r = await fetch(url, { method: 'HEAD' })
    ok(r.ok, `online: ${f.id} ${url} geeft ${r.status}`)
  }
}

console.log(`✅ hemelfoto: ${n} controles geslaagd`)
