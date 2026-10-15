// scripts/test-missie-venster.js
// Het zoekvenster voor /launches/previous/ over meerdere runs.
//
// De test speelt LL2: per run maakt hij de pagina die LL2 zou teruggeven
// (alles vanaf net__gte, oudste eerst, hooguit 100, 'next' als er meer is)
// en draait dan update-missions.js. Scenario:
//   - ruim 150 lanceringen sinds de oudste vastgelopen missie, dus meer dan
//     één pagina;
//   - 'bubbles' (22 apr) staat nooit in LL2 (geschrapt / nieuwe id).
// Verwacht: run 1-3 lossen op wat de pagina dekt, bubbles krijgt 1, 2, 3
// missers en houdt zolang het venster vast; run 4 parkeert bubbles met een
// ::warning::, het venster schuift door en de rest wordt opgelost. Missies
// voorbij het einde van een pagina krijgen geen misser: die zijn niet gezocht.

const fs     = require('fs')
const os     = require('os')
const path   = require('path')
const assert = require('assert/strict')
const { execFileSync } = require('child_process')
const { parseDutch, previousUrl } = require('./update-missions.js')

let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks++ }
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg); checks++ }

const FIX = path.join(__dirname, '__fixtures__')
const DAY = 86400 * 1000
const NEVER = 'bubbles'
const MAX_MISSES = 3

// De echte request: oudste eerst, vanaf net__gte, één pagina van 100.
const url = new URL(previousUrl('2026-04-14'))
eq(url.searchParams.get('ordering'), 'net', 'previous wordt oudste-eerst opgevraagd (niet -net)')
eq(url.searchParams.get('net__gte'), '2026-04-14', 'net__gte = since')
eq(url.searchParams.get('limit'), '100', 'één pagina van 100')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'missie-venster-'))
const files = { missions: path.join(tmp, 'missions.json'), up: path.join(tmp, 'up.json'), prev: path.join(tmp, 'prev.json') }
fs.copyFileSync(path.join(FIX, 'missions.json'), files.missions)
fs.writeFileSync(files.up, JSON.stringify({ results: [] }))

const read = () => JSON.parse(fs.readFileSync(files.missions, 'utf-8')).missions
const start = read()
const isStale = m => m._ll2Id && m.status === 'gepland' && parseDutch(m.launched) && parseDutch(m.launched).getTime() < Date.now()
const staleIds = new Set(start.filter(isStale).map(m => m.id))
ok(staleIds.size >= 10 && staleIds.has(NEVER), 'snapshot heeft vastgelopen missies, waaronder bubbles')

// ── De LL2-pool: 160 vullers vanaf 15 apr (één per dag) plus elke
// vastgelopen missie twee dagen na haar datum — behalve bubbles.
const launch = (id, name, iso, status) => ({ id, name, net: iso, window_start: iso, status: { name: status } })
const pool = []
for (let i = 0; i < 160; i++) {
  const iso = new Date(Date.UTC(2026, 3, 15) + i * DAY + 6 * 3600 * 1000).toISOString()
  pool.push(launch(`vuller-${i}`, `Vuller ${i}`, iso, 'Launch Successful'))
}
const expectedStatus = {}
for (const m of start.filter(isStale)) {
  if (m.id === NEVER) continue
  const iso = new Date(parseDutch(m.launched).getTime() + 2 * DAY + 12 * 3600 * 1000).toISOString()
  const status = m.id === 'curveball' ? 'Launch Failure' : 'Launch Successful'
  pool.push(launch(m._ll2Id, m.name, iso, status))
  expectedStatus[m.id] = status === 'Launch Failure' ? 'mislukt' : (m.soort === 'missie' ? 'actief' : 'voltooid')
}
pool.sort((a, b) => new Date(a.net) - new Date(b.net))

// Wat het script als net__gte hoort te kiezen: de oudste niet-geparkeerde
// vastgelopen missie min 7 dagen (onafhankelijk nagebouwd).
function expectedSince(missions) {
  const win = missions.filter(m => isStale(m) && (m._previousMisses || 0) < MAX_MISSES)
  if (!win.length) return null
  return new Date(Math.min(...win.map(m => parseDutch(m.launched).getTime())) - 7 * DAY).toISOString().slice(0, 10)
}

function run(n) {
  const before = read()
  const since = expectedSince(before)
  const all = pool.filter(l => l.net.slice(0, 10) >= since)
  const page = { next: all.length > 100 ? 'https://ll.thespacedevs.com/2.3.0/launches/previous/?offset=100' : null, results: all.slice(0, 100) }
  fs.writeFileSync(files.prev, JSON.stringify(page))
  const stdout = execFileSync(process.execPath, [path.join(__dirname, 'update-missions.js')], {
    env: { ...process.env, MISSIONS_PATH: files.missions, LL2_FIXTURE: files.up, LL2_PREVIOUS_FIXTURE: files.prev, ANTHROPIC_API_KEY: '' },
    encoding: 'utf-8',
  })
  ok(stdout.includes(`sinds ${since}, oudste eerst`), `run ${n}: script kiest net__gte ${since}`)
  const coveredUntil = page.next ? new Date(page.results[page.results.length - 1].net).getTime() : Infinity
  return { before, after: read(), stdout, since, page, coveredUntil }
}

const byId = list => new Map(list.map(m => [m.id, m]))

// ── Run 1-3: bubbles pint het venster en verzamelt missers ──────────────
let r
for (let n = 1; n <= 3; n++) {
  r = run(n)
  const after = byId(r.after)
  ok(r.page.next, `run ${n}: meer dan 100 lanceringen in het venster`)
  eq(after.get(NEVER)._previousMisses, n, `run ${n}: bubbles heeft ${n} misser(s)`)
  eq(after.get(NEVER).status, 'gepland', `run ${n}: bubbles blijft gepland`)
  ok(r.stdout.split('\n').some(w => w.startsWith('::warning') && w.includes('niet gevonden in LL2 previous') && w.includes(`(${n}/${MAX_MISSES})`)), `run ${n}: waarschuwing met tellerstand`)
  for (const id of staleIds) {
    if (id === NEVER) continue
    const m = after.get(id), d = parseDutch(byId(r.before).get(id).launched).getTime()
    if (r.before.find(x => x.id === id).status !== 'gepland') continue
    if (d + 2 * DAY <= r.coveredUntil) eq(m.status, expectedStatus[id], `run ${n}: ${id} opgelost`)
    else {
      eq(m.status, 'gepland', `run ${n}: ${id} valt buiten de pagina en blijft staan`)
      eq(m._previousMisses, undefined, `run ${n}: ${id} niet gezocht, dus geen misser`)
    }
  }
}
const stuckAfter3 = r.after.filter(m => staleIds.has(m.id) && m.id !== NEVER && m.status === 'gepland').map(m => m.id)
ok(stuckAfter3.length > 0, 'na run 3 staan er nog missies voorbij de pagina (bubbles pint het venster)')

// ── Run 4: bubbles geparkeerd, venster schuift door, rest opgelost ──────
r = run(4)
const after4 = byId(r.after)
ok(r.since > '2026-04-22', `run 4: venster schuift voorbij bubbles (sinds ${r.since})`)
ok(r.stdout.split('\n').some(w => w.startsWith('::warning') && w.includes(NEVER === 'bubbles' ? 'Bubbles' : NEVER) && w.includes('handmatig nakijken')), 'run 4: bubbles gemeld voor handmatig nakijken')
eq(after4.get(NEVER)._previousMisses, MAX_MISSES, 'run 4: geparkeerde missie telt niet verder')
for (const id of stuckAfter3) eq(after4.get(id).status, expectedStatus[id], `run 4: ${id} alsnog opgelost`)
for (const id of staleIds) if (id !== NEVER) eq(after4.get(id)._previousMisses, undefined, `${id}: geen misser over`)

// ── Niets anders verandert ───────────────────────────────────────────────
const final = byId(r.after)
for (const m of start) {
  if (staleIds.has(m.id)) continue
  eq(JSON.stringify(final.get(m.id)), JSON.stringify(m), `${m.id} is onverwacht veranderd`)
}

console.log(`✅ ${checks} venstercontroles geslaagd (4 runs, ${pool.length} lanceringen in de pool)`)
fs.rmSync(tmp, { recursive: true, force: true })
