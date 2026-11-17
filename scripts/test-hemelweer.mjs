// scripts/test-hemelweer.mjs
// Hemelweer (lib/hemelweer.ts): maan, donker, uurscore, venster en kopzin.
import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import ts from 'typescript'

process.env.TZ = 'Europe/Amsterdam' // de site rekent in Nederlandse tijd

const hier = path.dirname(fileURLToPath(import.meta.url))
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hemelweer-'))
for (const f of ['sky-chart', 'hemelweer']) {
  const bron = fs.readFileSync(path.join(hier, `../lib/${f}.ts`), 'utf8')
  const js = ts.transpileModule(bron, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
  fs.writeFileSync(path.join(tmp, `${f}.mjs`), js.replace(/from '\.\/sky-chart'/g, "from './sky-chart.mjs'"))
}
const H = await import(pathToFileURL(path.join(tmp, 'hemelweer.mjs')).href)

let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const AMS = [52.37, 4.90]

// ── Maan ─────────────────────────────────────────────────────────────────
// Volle maan 24 nov 2026 15:53 CET, nieuwe maan 9 dec 2026 01:52 CET.
ok(H.moonIllumination(new Date('2026-11-24T14:53Z')) > 0.98, 'maan: vol op 24 nov')
ok(H.moonIllumination(new Date('2026-12-09T00:52Z')) < 0.02, 'maan: nieuw op 9 dec')
ok(H.moonWaxing(new Date('2026-11-20T12:00Z')), 'maan: wassend voor volle maan')
ok(!H.moonWaxing(new Date('2026-11-28T12:00Z')), 'maan: afnemend erna')
// Rond volle maan komt de maan op bij zonsondergang en staat hij om middernacht hoog.
ok(H.moonAltitude(...AMS, new Date('2026-11-24T23:00Z')) > 40, 'maan: hoog om middernacht bij volle maan')
ok(H.moonAltitude(...AMS, new Date('2026-11-24T11:00Z')) < 0, 'maan: onder om het middaguur bij volle maan')

// ── Donker ───────────────────────────────────────────────────────────────
const g = H.nachtgrenzen(...AMS, new Date(2026, 10, 17))
ok(g.zonOnder && g.zonOnder.getHours() === 16, 'donker: zon onder rond 16:40 in november')
ok(g.donkerVan && g.donkerVan < g.astroVan && g.astroTot < g.donkerTot && g.donkerTot < g.zonOp, 'donker: grenzen in volgorde')
const juni = H.nachtgrenzen(...AMS, new Date(2026, 5, 21))
ok(juni.astroVan === null && juni.donkerVan !== null, 'donker: geen astronomische nacht rond midzomer, wel -12°')

// ── Scores ───────────────────────────────────────────────────────────────
ok(H.doorzicht(60, 40000, 0) === 5 && H.doorzicht(97, 8000, 50) === 1, 'doorzicht: grenzen')
ok(H.seeing(30, 5) === 5 && H.seeing(200, 40) === 1 && H.seeing(null, 5) === 3, 'seeing: grenzen')

// Nepnacht: 17 nov, helder van 21:00 tot 02:00, daarna dicht.
function nep(heldere) {
  const time = [], wolk = []
  const start = new Date(2026, 10, 17)
  for (let i = 0; i < 48; i++) {
    const t = new Date(start.getTime() + i * 3600e3)
    time.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}T${String(t.getHours()).padStart(2, '0')}:00`)
    wolk.push(heldere(t.getHours(), i) ? 5 : 95)
  }
  const vul = v => time.map(() => v)
  return { hourly: {
    time, cloud_cover: wolk, cloud_cover_low: wolk, cloud_cover_mid: vul(0), cloud_cover_high: vul(0),
    temperature_2m: vul(4), relative_humidity_2m: vul(70), dew_point_2m: vul(-1), wind_speed_10m: vul(8),
    visibility: vul(40000), precipitation_probability: vul(0), wind_speed_250hPa: vul(40),
  } }
}
const avond = new Date(2026, 10, 17)
const uren = H.leesUren(nep((h, i) => (i >= 21 && i < 26)), ...AMS)
ok(uren.length === 48 && uren[12].licht === 'dag' && uren[23].licht === 'donker', 'uren: dag en donker')
const nt = H.nacht(uren, ...AMS, avond)
ok(nt.venster && nt.venster.van.getHours() === 21 && nt.venster.tot.getHours() === 2, 'venster: 21:00 tot 02:00')
ok(nt.score >= 60, 'nacht: score uit het beste blok')
ok(H.kopzin(nt) === 'Helder van 21:00 tot 02:00', 'kopzin: venster')
ok(nt.uren[0].licht === 'dag' && nt.uren[nt.uren.length - 1].licht === 'dag', 'lijn: een uur marge aan beide kanten')

// Om 23:30 telt 21:00 niet meer mee, het venster begint bij het huidige uur.
const laat = H.nacht(uren, ...AMS, avond, new Date(2026, 10, 17, 23, 30))
ok(laat.venster.van.getHours() === 23, 'venster: verleden uren tellen niet')
ok(H.huidigeAvond(new Date(2026, 10, 18, 3)).getDate() === 17, 'avond: 03:00 hoort bij gisteravond')

const dicht = H.nacht(H.leesUren(nep(() => false), ...AMS), ...AMS, avond)
ok(dicht.venster === null && H.kopzin(dicht) === 'Bewolkt, vannacht geen sterren', 'kopzin: dicht')
const hele = H.nacht(H.leesUren(nep(() => true), ...AMS), ...AMS, avond)
ok(H.kopzin(hele) === 'De hele nacht helder', 'kopzin: hele nacht')

assert.throws(() => H.leesUren({}, ...AMS), 'lezen: zonder uurdata een fout, geen verzonnen nacht')

fs.rmSync(tmp, { recursive: true, force: true })
console.log(`✓ hemelweer: ${n} keuringen geslaagd`)
