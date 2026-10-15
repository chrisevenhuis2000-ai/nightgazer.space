// scripts/test-missie-status.js
// Statusregels van de missie-bot: mapLL2Status per soort, de startwaarde
// voor 'soort' bij nieuwe missies, /launches/previous/ voor vastgelopen
// 'gepland', en de opschoning van de Claude-verrijking. Draait tegen
// fixtures op een kopie van missions.json; geen netwerk, geen Claude.
//
//   npm run test:missies   (draait ook test-missie-koppeling.js)

const fs     = require('fs')
const os     = require('os')
const path   = require('path')
const assert = require('assert/strict')
const { execFileSync } = require('child_process')
const { mapLL2Status, soortVoorType, cleanEnrichment } = require('./update-missions.js')

let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks++ }
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg); checks++ }

// ── 1. Regels als losse functies ─────────────────────────────────────────
for (const [st, soort, want] of [
  ['Launch Successful', 'missie', 'actief'],
  ['Launch Successful', 'lancering', 'voltooid'],
  ['Launch Failure', 'missie', 'mislukt'],
  ['Launch Failure', 'lancering', 'mislukt'],
  ['Partial Failure', 'lancering', 'mislukt'],
  ['Launch in Flight', 'lancering', 'actief'],
  ['Go for Launch', 'missie', 'gepland'],
  ['To Be Determined', 'lancering', 'gepland'],
  ['On Hold', 'missie', 'gepland'],
  [null, 'missie', 'gepland'],
]) eq(mapLL2Status(st, soort), want, `mapLL2Status(${st}, ${soort})`)

for (const [type, want] of [
  ['Astrophysics', 'missie'], ['Planetary Science', 'missie'], ['Human Exploration', 'missie'],
  ['Communications', 'lancering'], ['Government/Top Secret', 'lancering'],
  ['Earth Science', 'lancering'], ['Dedicated Rideshare', 'lancering'], ['', 'lancering'],
]) eq(soortVoorType(type), want, `soortVoorType(${type})`)

eq(cleanEnrichment(null), null, 'cleanEnrichment(null)')
const ce = cleanEnrichment({ objective: '  Doel. ', description: '', highlight: 'x'.repeat(101), relatedTags: ['SpaceX', 3, ''] })
eq(ce, { objective: 'Doel.', description: null, highlight: null, relatedTags: ['spacex'] }, 'cleanEnrichment laat alleen bruikbare velden door')

// ── 2. Een run tegen de fixtures ─────────────────────────────────────────
const FIX = path.join(__dirname, '__fixtures__')
const day = 86400 * 1000
const future = t => t.replace(/__TOEKOMST_(\d+)D__/g, (_, n) => new Date(Date.now() + Number(n) * day).toISOString())
const upText = future(fs.readFileSync(path.join(FIX, 'll2-status-upcoming.json'), 'utf-8'))
const prevText = fs.readFileSync(path.join(FIX, 'll2-previous.json'), 'utf-8')
const upcoming = JSON.parse(upText), previous = JSON.parse(prevText)

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'missie-status-'))
const files = { missions: path.join(tmp, 'missions.json'), up: path.join(tmp, 'up.json'), prev: path.join(tmp, 'prev.json') }
// Vaste snapshot, zie test-missie-koppeling.js.
fs.copyFileSync(path.join(FIX, 'missions.json'), files.missions)
fs.writeFileSync(files.up, upText)
fs.writeFileSync(files.prev, prevText)

const before = JSON.parse(fs.readFileSync(files.missions, 'utf-8')).missions
const stdout = execFileSync(process.execPath, [path.join(__dirname, 'update-missions.js')], {
  env: { ...process.env, MISSIONS_PATH: files.missions, LL2_FIXTURE: files.up, LL2_PREVIOUS_FIXTURE: files.prev, ANTHROPIC_API_KEY: '' },
  encoding: 'utf-8',
})
const after = JSON.parse(fs.readFileSync(files.missions, 'utf-8')).missions
const byId = new Map(after.map(m => [m.id, m]))
const warnings = stdout.split('\n').filter(r => r.startsWith('::warning'))

const touched = new Set()
for (const l of [...upcoming.results, ...previous.results]) {
  const v = l._verwacht || {}
  if (v.missie) {
    touched.add(v.missie)
    const m = byId.get(v.missie)
    eq(m.status, v.status, `${v.missie}: status`)
    if (v.launched) eq(m.launched, v.launched, `${v.missie}: datum uit LL2 previous`)
    eq(m.soort, before.find(b => b.id === v.missie).soort, `${v.missie}: soort blijft ongemoeid`)
  }
  if (v.toevoegen) {
    touched.add(v.toevoegen)
    const m = byId.get(v.toevoegen)
    ok(m && m._ll2Id === l.id, `${v.toevoegen} toegevoegd`)
    eq(m.soort, v.soort, `${v.toevoegen}: soort uit mission.type`)
    eq(m.status, v.status, `${v.toevoegen}: status`)
    const missieWarn = warnings.some(w => w.includes("'missie'") && w.includes(l.id))
    eq(missieWarn, !!v.waarschuwing, `${v.toevoegen}: waarschuwing voor 'missie'-indeling`)
  }
}

// Vastgelopen missie die ook niet in previous staat: waarschuwen, niets doen.
const notFound = before.filter(m => m.status === 'gepland' && m._ll2Id && !touched.has(m.id) &&
  !previous.results.some(l => l.id === m._ll2Id) && warnings.some(w => w.includes(m._ll2Id) && w.includes('niet gevonden in LL2 previous')))
ok(notFound.length > 0, 'vastgelopen missie zonder previous-record geeft een waarschuwing')
ok(stdout.includes('de rest volgt bij een volgende run'), 'melding bij een tweede pagina van previous')

// Niets anders verandert, behalve de missertelling van vastgelopen missies
// die de previous-pagina dekte maar niet bevatte (zie test-missie-venster.js).
const missed = new Set(notFound.map(m => m.id))
for (const m of before) {
  if (touched.has(m.id)) continue
  const now = byId.get(m.id)
  if (missed.has(m.id)) {
    eq(now._previousMisses, (m._previousMisses || 0) + 1, `${m.id}: misser geteld`)
    const { _previousMisses, ...rest } = now
    eq(JSON.stringify(rest), JSON.stringify(m), `${m.id} is verder onveranderd`)
    continue
  }
  eq(JSON.stringify(now), JSON.stringify(m), `${m.id} is onverwacht veranderd`)
}

console.log(`✅ ${checks} statuscontroles geslaagd (${warnings.length} waarschuwingen)`)
fs.rmSync(tmp, { recursive: true, force: true })
