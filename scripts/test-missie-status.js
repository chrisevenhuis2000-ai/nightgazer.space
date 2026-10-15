// scripts/test-missie-status.js
// Statusregels van de missie-bot: mapLL2Status per soort, de startwaarde
// voor 'soort' bij nieuwe missies, /launches/previous/ voor vastgelopen
// 'gepland' (opvragen op id), en de opschoning van de Claude-verrijking. Draait tegen
// fixtures op een kopie van missions.json; geen netwerk, geen Claude.
//
//   npm run test:missies   (draait ook test-missie-koppeling.js)

const fs     = require('fs')
const os     = require('os')
const path   = require('path')
const assert = require('assert/strict')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { startMock } = require('./__fixtures__/ll2-mock.js')
const { mapLL2Status, soortVoorType, cleanEnrichment, parseDutch } = require('./update-missions.js')

let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks++ }
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg); checks++ }
// De highlight van een lancering komt elke run uit het sjabloon (status, datum,
// voertuig); test-missie-statustekst.js test die. Hier telt de rest.
const vgl = m => (m && m.soort === 'lancering' ? { ...m, highlight: undefined } : m)

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

// ── 2. Een run tegen de fixtures en de nep-LL2 ────────────────────────────
;(async () => {
const FIX = path.join(__dirname, '__fixtures__')
const day = 86400 * 1000
const future = t => t.replace(/__TOEKOMST_(\d+)D__/g, (_, n) => new Date(Date.now() + Number(n) * day).toISOString())
const upText = future(fs.readFileSync(path.join(FIX, 'll2-status-upcoming.json'), 'utf-8'))
const upcoming = JSON.parse(upText)
const pool = JSON.parse(fs.readFileSync(path.join(FIX, 'll2-op-id.json'), 'utf-8')).results

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'missie-status-'))
const files = { missions: path.join(tmp, 'missions.json'), up: path.join(tmp, 'up.json') }
// Vaste snapshot, zie test-missie-koppeling.js.
fs.copyFileSync(path.join(FIX, 'missions.json'), files.missions)
fs.writeFileSync(files.up, upText)

const mock = await startMock(pool)
const before = JSON.parse(fs.readFileSync(files.missions, 'utf-8')).missions
const { stdout } = await promisify(execFile)(process.execPath, [path.join(__dirname, 'update-missions.js')], {
  env: { ...process.env, MISSIONS_PATH: files.missions, LL2_FIXTURE: files.up, LL2_BASE_URL: mock.url, ANTHROPIC_API_KEY: '' },
  encoding: 'utf-8',
})
await mock.close()
const after = JSON.parse(fs.readFileSync(files.missions, 'utf-8')).missions
const byId = new Map(after.map(m => [m.id, m]))
const warnings = stdout.split('\n').filter(r => r.startsWith('::warning'))

const touched = new Set()
for (const l of [...upcoming.results, ...pool]) {
  const v = l._verwacht || {}
  if (v.missie) {
    touched.add(v.missie)
    const m = byId.get(v.missie)
    eq(m.status, v.status, `${v.missie}: status`)
    if (v.launched) eq(m.launched, v.launched, `${v.missie}: datum uit LL2`)
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

// Eén request, op id, zonder datumvenster.
const lookups = mock.state.requests.filter(u => u.pathname === '/2.3.0/launches/')
eq(lookups.length, 1, 'precies één opvraging op id')
const q = lookups[0].searchParams
eq(q.get('mode'), 'list', 'mode=list (status en net)')
eq(q.get('limit'), '100', 'limit=100')
ok(!q.has('net__gte') && !q.has('ordering'), 'geen datumvenster of ordering meer')
const stuckIds = before.filter(m => m._ll2Id && m.status === 'gepland' && parseDutch(m.launched) && parseDutch(m.launched).getTime() < Date.now()).map(m => m._ll2Id)
eq(new Set(q.get('id').split(',')), new Set(stuckIds), 'alle vastgelopen _ll2Id\'s in die ene request')

// Vastgelopen missies die LL2 niet teruggeeft: eerste misser, nog geen warning.
const missed = new Set(before.filter(m => stuckIds.includes(m._ll2Id) && !pool.some(l => l.id === m._ll2Id)).map(m => m.id))
ok(missed.size > 0, 'er zijn vastgelopen missies die de nep-LL2 niet kent')
for (const id of missed) {
  eq(byId.get(id)._previousMisses, 1, `${id}: eerste misser`)
  ok(!warnings.some(w => w.includes(byId.get(id)._ll2Id)), `${id}: nog geen warning na één misser`)
}

// Niets anders verandert.
for (const m of before) {
  if (touched.has(m.id)) continue
  const now = byId.get(m.id)
  if (missed.has(m.id)) {
    const { _previousMisses, ...rest } = now
    eq(JSON.stringify(vgl(rest)), JSON.stringify(vgl(m)), `${m.id} is verder onveranderd`)
    continue
  }
  eq(JSON.stringify(vgl(now)), JSON.stringify(vgl(m)), `${m.id} is onverwacht veranderd`)
}

console.log(`✅ ${checks} statuscontroles geslaagd (${warnings.length} waarschuwingen)`)
fs.rmSync(tmp, { recursive: true, force: true })
})().catch(err => { console.error(err); process.exit(1) })
