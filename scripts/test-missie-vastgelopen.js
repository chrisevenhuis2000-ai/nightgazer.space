// scripts/test-missie-vastgelopen.js
// Vastgelopen 'gepland'-missies, opgevraagd op id bij een nep-LL2 over
// meerdere runs (scripts/__fixtures__/ll2-mock.js filtert op id, net als
// /2.3.0/launches/?id=…&mode=list).
//
// Scenario's:
//   A. De echte snapshot: alle vastgelopen missies in één request, ook al
//      kent de nep-LL2 ruim 150 andere lanceringen. 'bubbles' komt nooit
//      terug: 1 en 2 missers zonder warning, vanaf 3 een ::warning:: elke
//      run; komt hij later toch terug, dan opgelost en teller weg.
//   B. Een mislukte request telt niet als misser.
//   C. Meer dan 100 vastgelopen missies: in stukken van 100, alle opgelost.

const fs     = require('fs')
const os     = require('os')
const path   = require('path')
const assert = require('assert/strict')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { parseDutch, launchesByIdUrls, BOT_REGEL } = require('./update-missions.js')
const { startMock } = require('./__fixtures__/ll2-mock.js')

let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks++ }
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg); checks++ }
// De highlight van een lancering komt elke run uit het sjabloon (status, datum,
// voertuig); test-missie-statustekst.js test die. De tijdlijnregel van het
// script volgt elke run de status; test-missie-tijdlijn.js test die. Hier
// telt de rest.
const zonderBotRegel = m => (m && m._ll2Id && Array.isArray(m.timeline)
  ? { ...m, timeline: m.timeline.filter(e => !BOT_REGEL.test(e?.event || '')) }
  : m)
const vgl = m => zonderBotRegel(m && m.soort === 'lancering' ? { ...m, highlight: undefined } : m)

const FIX = path.join(__dirname, '__fixtures__')
const DAY = 86400 * 1000
const NEVER = 'bubbles'
const isStale = m => m._ll2Id && m.status === 'gepland' && parseDutch(m.launched) && parseDutch(m.launched).getTime() < Date.now()
const launch = (id, name, iso, status) => ({ id, name, net: iso, window_start: iso, status: { name: status } })
const byId = list => new Map(list.map(m => [m.id, m]))

// ── 0. De URL's: op id, mode=list, stukken van 100, geen venster ─────────
const ids = Array.from({ length: 250 }, (_, i) => `id-${i}`)
const urls = launchesByIdUrls(ids).map(u => new URL(u))
eq(urls.length, 3, '250 id\'s → 3 requests')
eq(urls.map(u => u.searchParams.get('id').split(',').length), [100, 100, 50], 'stukken van 100')
eq(urls.flatMap(u => u.searchParams.get('id').split(',')), ids, 'alle id\'s precies één keer, in volgorde')
for (const u of urls) {
  eq(u.pathname, '/2.3.0/launches/', 'endpoint /launches/')
  eq(u.searchParams.get('mode'), 'list', 'mode=list')
  eq(u.searchParams.get('limit'), '100', 'limit=100')
  ok(!u.searchParams.has('net__gte') && !u.searchParams.has('ordering'), 'geen datumvenster')
}

async function runScript(tmp, base) {
  const { stdout } = await promisify(execFile)(process.execPath, [path.join(__dirname, 'update-missions.js')], {
    env: { ...process.env, MISSIONS_PATH: tmp.missions, LL2_FIXTURE: tmp.up, LL2_BASE_URL: base, ANTHROPIC_API_KEY: '' },
    encoding: 'utf-8',
  })
  return stdout
}
function setup(missions) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missie-vast-'))
  const tmp = { dir, missions: path.join(dir, 'missions.json'), up: path.join(dir, 'up.json') }
  fs.writeFileSync(tmp.missions, JSON.stringify(missions, null, 2))
  fs.writeFileSync(tmp.up, JSON.stringify({ results: [] }))
  return tmp
}
const read = tmp => JSON.parse(fs.readFileSync(tmp.missions, 'utf-8')).missions

;(async () => {
  // ── A. Echte snapshot, bubbles komt nooit terug ───────────────────────
  const snapshot = JSON.parse(fs.readFileSync(path.join(FIX, 'missions.json'), 'utf-8'))
  const start = snapshot.missions
  const stale = start.filter(isStale)
  ok(stale.length >= 10 && stale.some(m => m.id === NEVER), 'snapshot heeft vastgelopen missies, waaronder bubbles')

  const pool = []
  for (let i = 0; i < 150; i++) pool.push(launch(`vuller-${i}`, `Vuller ${i}`, new Date(Date.UTC(2026, 3, 15) + i * DAY).toISOString(), 'Launch Successful'))
  const expected = {}
  for (const m of stale) {
    if (m.id === NEVER) continue
    const st = m.id === 'curveball' ? 'Launch Failure' : 'Launch Successful'
    pool.push(launch(m._ll2Id, m.name, new Date(parseDutch(m.launched).getTime() + 2 * DAY + 12 * 3600e3).toISOString(), st))
    expected[m.id] = st === 'Launch Failure' ? 'mislukt' : (m.soort === 'missie' ? 'actief' : 'voltooid')
  }
  const mock = await startMock(pool)
  const tmp = setup(snapshot)
  const neverId = stale.find(m => m.id === NEVER)._ll2Id

  for (let run = 1; run <= 4; run++) {
    mock.state.requests.length = 0
    const out = await runScript(tmp, mock.url)
    const now = byId(read(tmp))
    const lookups = mock.state.requests.filter(u => u.pathname === '/2.3.0/launches/')
    eq(lookups.length, 1, `run ${run}: één request`)
    if (run === 1) {
      eq(new Set(lookups[0].searchParams.get('id').split(',')), new Set(stale.map(m => m._ll2Id)), 'run 1: alle vastgelopen id\'s, ongeacht datum')
      for (const [id, st] of Object.entries(expected)) {
        eq(now.get(id).status, st, `run 1: ${id} → ${st}`)
        eq(now.get(id)._previousMisses, undefined, `run 1: ${id} zonder misser`)
      }
    } else {
      eq(lookups[0].searchParams.get('id'), neverId, `run ${run}: alleen bubbles is nog vastgelopen`)
    }
    eq(now.get(NEVER).status, 'gepland', `run ${run}: bubbles blijft gepland`)
    eq(now.get(NEVER)._previousMisses, run, `run ${run}: bubbles ${run} misser(s)`)
    const warned = out.split('\n').some(w => w.startsWith('::warning') && w.includes(neverId) && w.includes('handmatig nakijken'))
    eq(warned, run >= 3, `run ${run}: warning ${run >= 3 ? 'wel' : 'nog niet'}`)
  }

  // Bubbles komt toch terug: opgelost, teller weg.
  mock.state.pool = [...pool, launch(neverId, 'Bubbles', '2026-04-24T12:00:00.000Z', 'Launch Successful')]
  await runScript(tmp, mock.url)
  const back = byId(read(tmp)).get(NEVER)
  eq(back.status, 'voltooid', 'bubbles teruggevonden → voltooid')
  eq(back._previousMisses, undefined, 'bubbles: teller weg')

  // Missies die nooit vast zaten, zijn onveranderd.
  const fin = byId(read(tmp))
  for (const m of start) if (!isStale(m)) eq(JSON.stringify(vgl(fin.get(m.id))), JSON.stringify(vgl(m)), `${m.id} onveranderd`)
  fs.rmSync(tmp.dir, { recursive: true, force: true })

  // ── B. Mislukte request: geen misser ─────────────────────────────────
  const tmpB = setup(snapshot)
  mock.state.fail = true
  await runScript(tmpB, mock.url)
  mock.state.fail = false
  for (const m of read(tmpB)) ok(m._previousMisses === undefined, `B: ${m.id} geen misser bij een mislukte request`)
  fs.rmSync(tmpB.dir, { recursive: true, force: true })
  await mock.close()

  // ── C. Meer dan 100 vastgelopen missies: in stukken, alle opgelost ────
  const synth = Array.from({ length: 230 }, (_, i) => ({
    ...start.find(m => m.id === 'gps-iii-sv10'),
    id: `synth-${i}`, name: `Synth ${i}`, _ll2Id: `00000000-synth-${String(i).padStart(4, '0')}`, launched: '5 mei 2026',
  }))
  const tmpC = setup({ ...snapshot, missions: [...start, ...synth] })
  const mockC = await startMock(synth.map(m => launch(m._ll2Id, m.name, '2026-05-06T12:00:00.000Z', 'Launch Successful')))
  await runScript(tmpC, mockC.url)
  const lookupsC = mockC.state.requests.filter(u => u.pathname === '/2.3.0/launches/')
  const totalStale = 230 + stale.length
  eq(lookupsC.length, Math.ceil(totalStale / 100), `C: ${totalStale} id's in ${Math.ceil(totalStale / 100)} requests`)
  ok(lookupsC.every(u => u.searchParams.get('id').split(',').length <= 100), 'C: geen request met meer dan 100 id\'s')
  const afterC = byId(read(tmpC))
  for (const m of synth) eq(afterC.get(m.id).status, 'voltooid', `C: ${m.id} opgelost`)
  await mockC.close()
  fs.rmSync(tmpC.dir, { recursive: true, force: true })

  console.log(`✅ ${checks} controles vastgelopen missies geslaagd (A: 5 runs, B: mislukte request, C: ${totalStale} id's)`)
})().catch(err => { console.error(err); process.exit(1) })
