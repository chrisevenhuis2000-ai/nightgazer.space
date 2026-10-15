// scripts/test-missie-statustekst.js
// Highlight bij een statuswijziging: vast sjabloon, geen Claude. Alleen een
// 'missie' die actief wordt, gaat naar Claude, na één mode=detailed-request
// voor die id. Draait update-missions.js tegen een nep-LL2 en een nep-Claude.
//
//   Upcoming:   lancering gepland → voltooid (sjabloon, geen Claude);
//               missie gepland → actief (sjabloon + 1 Claude, data uit upcoming).
//   Op id:      lancering → voltooid, lancering → mislukt (sjabloon, geen
//               Claude, geen detailed-request); missie → actief (sjabloon,
//               precies 1 detailed-request + 1 Claude-aanroep).
//   Run 2:      verandert niets, geen requests, geen Claude.
//   Zonder API-sleutel: sjabloon wel, geen detailed-request.
//   D. Lancering-sjabloon wint altijd: elke lancering krijgt elke run de
//      highlight uit het sjabloon, ongeacht de tekst (ook Claude's tekst bij
//      een nieuwe lancering); een missie houdt de zijne. `_herverrijk` op
//      een actieve missie → 1 detailed-request + 1 Claude, vlag weg. Run 2:
//      0 aanroepen, geen requests, geen diff. Zonder sleutel blijft de vlag.
//
// MISSIE_SCRIPT wijst een ander script aan (zie test-missie-verrijking-mutaties.js).

const fs     = require('fs')
const os     = require('os')
const path   = require('path')
const assert = require('assert/strict')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { startMock } = require('./__fixtures__/ll2-mock.js')
const { startClaudeMock } = require('./__fixtures__/claude-mock.js')

const SCRIPT = process.env.MISSIE_SCRIPT || path.join(__dirname, 'update-missions.js')
const { highlightVoorStatus, launchDetailedUrl, datumTekst } = require(SCRIPT)

let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks++ }
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg); checks++ }

const DAY = 86400 * 1000
const ago = days => new Date(Date.now() - days * DAY).toISOString()
const byId = list => new Map(list.map(m => [m.id, m]))

// ── 0. Het sjabloon en de detailed-URL ────────────────────────────────────
const v = { datum: '12 apr 2026', voertuig: 'Falcon 9' }
eq(highlightVoorStatus('voltooid', v), 'Gelanceerd op 12 apr 2026 met Falcon 9', 'sjabloon voltooid')
eq(highlightVoorStatus('mislukt', v), 'Lancering mislukt op 12 apr 2026 (Falcon 9)', 'sjabloon mislukt')
eq(highlightVoorStatus('actief', v), 'Gelanceerd op 12 apr 2026 — missie in bedrijf', 'sjabloon actief')
eq(highlightVoorStatus('gepland', v), 'Lancering gepland: 12 apr 2026', 'sjabloon gepland (de bestaande vorm)')
eq(highlightVoorStatus('voltooid', { datum: '12 apr 2026' }), 'Gelanceerd op 12 apr 2026', 'voltooid zonder voertuig')
eq(highlightVoorStatus('mislukt', { datum: '12 apr 2026', voertuig: '' }), 'Lancering mislukt op 12 apr 2026', 'mislukt zonder voertuig')
// Gepland: de datum zo hard als LL2 hem kent (net_precision).
const gepland = precisie => highlightVoorStatus('gepland', { datum: '31 dec 2026', voertuig: 'Falcon 9', precisie })
eq(gepland('Year'), 'Lancering gepland: 2026', 'gepland, precisie Year → alleen het jaar')
eq(gepland('Fiscal Year'), 'Lancering gepland: 2026', 'gepland, precisie Fiscal Year → alleen het jaar')
eq(gepland('Year Half 2'), 'Lancering gepland: 2e helft 2026', 'gepland, Year Half 2')
eq(gepland('Quarter 4'), 'Lancering gepland: Q4 2026', 'gepland, Quarter 4')
eq(gepland('Month'), 'Lancering gepland: december 2026', 'gepland, Month → maand')
eq(gepland('Day'), 'Lancering gepland: 31 dec 2026', 'gepland, Day → de datum')
eq(gepland('Minute'), 'Lancering gepland: 31 dec 2026', 'gepland, Minute → de datum')
eq(gepland(undefined), 'Lancering gepland: 31 dec 2026', 'gepland, geen precisie → de datum')
eq(highlightVoorStatus('voltooid', { datum: '31 dec 2026', voertuig: 'Falcon 9', precisie: 'Year' }), 'Gelanceerd op 31 dec 2026 met Falcon 9', 'voltooid negeert de precisie')
eq(datumTekst('IFT-7 · Mrt 2026', 'Year'), 'IFT-7 · Mrt 2026', 'geen gewone datum → ongemoeid')
const du = new URL(launchDetailedUrl('abc-123'))
eq([du.pathname, du.searchParams.get('id'), du.searchParams.get('mode')], ['/2.3.0/launches/', 'abc-123', 'detailed'], 'detailed-URL: één id, mode=detailed')

// ── Testdata ──────────────────────────────────────────────────────────────
const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, '__fixtures__', 'missions.json'), 'utf-8'))
const basis = snapshot.missions.find(m => m.id === 'gps-iii-sv10')
const mission = (id, soort, launched) => ({
  ...basis, id, name: id, soort, status: 'gepland', _ll2Id: `00000000-${id}`, launched,
  vehicle: 'Falcon 9', highlight: `Lancering gepland: ${launched}`, _lastClaudeUpdate: ago(1),
})
const launch = (id, status, iso, vehicle) => ({
  id: `00000000-${id}`, name: id,
  mission: { name: id, description: `Description of ${id}.`, type: 'Communications', orbit: { name: 'Low Earth Orbit' }, agencies: [] },
  rocket: { configuration: { name: vehicle } },
  pad: { name: 'SLC-40' },
  launch_service_provider: { name: 'SpaceX' },
  window_start: iso, net: iso,
  status: { name: status },
})
const morgen = new Date(Date.now() + DAY)
const morgenIso = new Date(Date.UTC(morgen.getUTCFullYear(), morgen.getUTCMonth(), morgen.getUTCDate(), 12)).toISOString()
const fmt = iso => { const d = new Date(iso); return `${d.getUTCDate()} ${['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'][d.getUTCMonth()]} ${d.getUTCFullYear()}` }

const missies = [
  mission('up-lanc', 'lancering', fmt(morgenIso)),
  mission('up-missie', 'missie', fmt(morgenIso)),
  mission('st-lanc-ok', 'lancering', '10 apr 2026'),
  mission('st-lanc-fail', 'lancering', '10 apr 2026'),
  mission('st-missie', 'missie', '10 apr 2026'),
]
const upcoming = { results: [
  launch('up-lanc', 'Launch Successful', morgenIso, 'Falcon 9 Block 5'),
  launch('up-missie', 'Launch in Flight', morgenIso, 'Falcon Heavy'),
] }
const pool = [
  launch('st-lanc-ok', 'Launch Successful', '2026-04-12T10:00:00Z', 'Falcon 9'),
  launch('st-lanc-fail', 'Launch Failure', '2026-04-13T10:00:00Z', 'Falcon 9'),
  launch('st-missie', 'Launch Successful', '2026-04-14T10:00:00Z', 'Falcon 9'),
]

function setup(lijst = missies, up = upcoming) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missie-statustekst-'))
  const tmp = { dir, missions: path.join(dir, 'missions.json'), up: path.join(dir, 'up.json') }
  fs.writeFileSync(tmp.missions, JSON.stringify({ _meta: {}, missions: lijst }, null, 2))
  fs.writeFileSync(tmp.up, JSON.stringify(up))
  return tmp
}

async function run(tmp, ll2, claude, key = 'test-sleutel') {
  ll2.state.requests.length = 0
  claude.state.calls.length = 0
  const { stdout } = await promisify(execFile)(process.execPath, [SCRIPT], {
    env: {
      ...process.env,
      MISSIONS_PATH: tmp.missions, LL2_FIXTURE: tmp.up, LL2_BASE_URL: ll2.url,
      ANTHROPIC_API_KEY: key, ANTHROPIC_BASE_URL: claude.url, MISSIE_GEEN_PAUZE: '1', GITHUB_STEP_SUMMARY: '',
    },
    encoding: 'utf-8',
  })
  const reqs = ll2.state.requests.filter(u => u.pathname === '/2.3.0/launches/')
  return {
    stdout,
    calls: [...claude.state.calls].sort(),
    list: reqs.filter(u => u.searchParams.get('mode') === 'list'),
    detailed: reqs.filter(u => u.searchParams.get('mode') === 'detailed'),
    missions: byId(JSON.parse(fs.readFileSync(tmp.missions, 'utf-8')).missions),
  }
}

;(async () => {
  const ll2 = await startMock(pool)
  const claude = await startClaudeMock()

  // ── Run 1 ─────────────────────────────────────────────────────────────
  const tmp = setup()
  const r1 = await run(tmp, ll2, claude)
  const m = r1.missions
  eq(m.get('up-lanc').status, 'voltooid', 'upcoming lancering → voltooid')
  eq(m.get('up-lanc').highlight, `Gelanceerd op ${fmt(morgenIso)} met Falcon 9 Block 5`, 'upcoming lancering: sjabloon, met voertuig uit LL2')
  eq(m.get('up-missie').status, 'actief', 'upcoming missie → actief')
  eq(m.get('up-missie').highlight, `Gelanceerd op ${fmt(morgenIso)} — missie in bedrijf`, 'upcoming missie: sjabloon, niet Claude\'s highlight')
  eq(m.get('up-missie').description, 'Verrijkte beschrijving van up-missie.', 'upcoming missie: Claude-tekst')

  eq(m.get('st-lanc-ok').status, 'voltooid', 'op id: lancering → voltooid')
  eq(m.get('st-lanc-ok').highlight, 'Gelanceerd op 12 apr 2026 met Falcon 9', 'op id: lancering voltooid → sjabloon met LL2-datum')
  eq(m.get('st-lanc-fail').status, 'mislukt', 'op id: lancering → mislukt')
  eq(m.get('st-lanc-fail').highlight, 'Lancering mislukt op 13 apr 2026 (Falcon 9)', 'op id: lancering mislukt → sjabloon')
  eq(m.get('st-missie').status, 'actief', 'op id: missie → actief')
  eq(m.get('st-missie').highlight, 'Gelanceerd op 14 apr 2026 — missie in bedrijf', 'op id: missie actief → sjabloon, niet Claude\'s highlight')
  eq(m.get('st-missie').description, 'Verrijkte beschrijving van st-missie.', 'op id: missie actief → Claude-tekst uit de detailed-data')
  for (const id of ['up-lanc', 'st-lanc-ok', 'st-lanc-fail']) {
    eq(m.get(id).description, basis.description, `${id}: lancering → beschrijving ongemoeid`)
  }

  eq(r1.calls, ['st-missie', 'up-missie'], 'run 1: Claude alleen voor de missies die actief werden; lanceringen 0')
  eq(r1.list.length, 1, 'run 1: één mode=list-request voor de vastgelopen missies')
  eq(r1.detailed.length, 1, 'run 1: precies één mode=detailed-request')
  eq(r1.detailed[0].searchParams.get('id'), '00000000-st-missie', 'run 1: detailed-request alleen voor st-missie')
  ok(r1.stdout.split('\n').includes('Claude-aanroepen: 2'), 'run 1: log meldt "Claude-aanroepen: 2"')

  // ── Run 2: niets ──────────────────────────────────────────────────────
  const voor = fs.readFileSync(tmp.missions, 'utf-8')
  const r2 = await run(tmp, ll2, claude)
  eq(r2.calls, [], 'run 2: geen Claude')
  eq(r2.list.length + r2.detailed.length, 0, 'run 2: geen LL2-requests')
  eq(fs.readFileSync(tmp.missions, 'utf-8'), voor, 'run 2: missions.json ongemoeid')
  ok(r2.stdout.split('\n').includes('Claude-aanroepen: 0'), 'run 2: log meldt "Claude-aanroepen: 0"')
  fs.rmSync(tmp.dir, { recursive: true, force: true })

  // ── Zonder API-sleutel: sjabloon wel, geen detailed-request ───────────
  const tmpK = setup()
  const rk = await run(tmpK, ll2, claude, '')
  eq(rk.missions.get('st-missie').highlight, 'Gelanceerd op 14 apr 2026 — missie in bedrijf', 'zonder sleutel: sjabloon')
  eq(rk.missions.get('st-missie').description, basis.description, 'zonder sleutel: beschrijving ongemoeid')
  eq(rk.detailed.length, 0, 'zonder sleutel: geen detailed-request')
  eq(rk.calls, [], 'zonder sleutel: geen Claude')
  fs.rmSync(tmpK.dir, { recursive: true, force: true })

  await ll2.close()

  // ── D. Lancering-sjabloon wint altijd; _herverrijk ────────────────────
  const overJaar = new Date(Date.now() + 200 * DAY).toISOString()
  const dMissies = [
    { ...mission('d-lanc-oud', 'lancering', '3 mrt 2026'), status: 'voltooid', vehicle: 'Electron', highlight: 'Eerste vlucht – nieuwe generatie debuteert' },
    { ...mission('d-lanc-gepland', 'lancering', '31 dec 2026'), highlight: 'Geplande lancering eind 2026 met Falcon 9 naar een polaire baan.' },
    { ...mission('d-lanc-mislukt', 'lancering', '5 mei 2026'), status: 'mislukt', vehicle: 'Electron', highlight: 'Details volgen later.' },
    { ...mission('d-missie', 'missie', '14 apr 2026'), status: 'actief', highlight: 'Lancering gepland voor 14 april 2026', _herverrijk: true },
    { ...mission('d-missie-tekst', 'missie', '1 jan 2020'), status: 'actief', highlight: 'Eigen tekst van een missie' },
    { ...mission('d-lanc-jaar', 'lancering', '31 dec 2027'), highlight: 'Lancering gepland: 31 dec 2027' },
  ]
  const dUp = { results: [
    launch('nieuw-lanc', 'Go for Launch', morgenIso, 'Falcon 9'),
    { ...launch('d-lanc-jaar', 'To Be Determined', '2027-12-31T00:00:00Z', 'Falcon 9'), net_precision: { name: 'Year', abbrev: 'Y' } },
    { ...launch('nieuw-kwartaal', 'To Be Determined', '2027-12-31T00:00:00Z', 'Falcon 9'), net_precision: { name: 'Quarter 4', abbrev: 'Q4' } },
  ] }
  dUp.results[0].mission.name = 'Nieuw Lanc'
  dUp.results[2].mission.name = 'Nieuw Kwartaal'
  dUp.results[2].window_start = new Date(Date.now() + 100 * DAY).toISOString()
  const dPool = [launch('d-missie', 'Launch Successful', '2026-04-14T10:00:00Z', 'Falcon 9')]
  const ll2D = await startMock(dPool)
  const tmpD = setup(dMissies, dUp)
  const d1 = await run(tmpD, ll2D, claude)
  const md = d1.missions
  eq(md.get('d-lanc-oud').highlight, 'Gelanceerd op 3 mrt 2026 met Electron', 'D: voltooide lancering → sjabloon, ook zonder "gepland" in de oude tekst')
  eq(md.get('d-lanc-gepland').highlight, 'Lancering gepland: 31 dec 2026', 'D: geplande lancering → sjabloon, ook over Claude-tekst heen')
  eq(md.get('d-lanc-mislukt').highlight, 'Lancering mislukt op 5 mei 2026 (Electron)', 'D: mislukte lancering → sjabloon')
  eq(md.get('nieuw-lanc').highlight, `Lancering gepland: ${fmt(morgenIso)}`, 'D: nieuwe lancering → sjabloon wint van Claude\'s highlight')
  eq(md.get('nieuw-lanc').description, 'Verrijkte beschrijving van Nieuw Lanc.', 'D: nieuwe lancering → wel Claude-beschrijving')
  eq(md.get('d-missie-tekst').highlight, 'Eigen tekst van een missie', 'D: missie houdt zijn eigen highlight')
  eq(md.get('d-lanc-jaar').launchPrecision, 'Year', 'D: bestaande missie krijgt de precisie uit LL2')
  eq(md.get('d-lanc-jaar').highlight, 'Lancering gepland: 2027', 'D: precisie Year → "Lancering gepland: 2027"')
  eq(md.get('nieuw-kwartaal').launchPrecision, 'Quarter 4', 'D: nieuwe missie krijgt de precisie')
  ok(/^Lancering gepland: Q4 \d{4}$/.test(md.get('nieuw-kwartaal').highlight), 'D: nieuwe missie, Quarter 4 → "Lancering gepland: Q4 …"')
  eq(md.get('d-missie').highlight, 'Gelanceerd op 14 apr 2026 — missie in bedrijf', 'D: _herverrijk → sjabloon actief')
  eq(md.get('d-missie').description, 'Verrijkte beschrijving van d-missie.', 'D: _herverrijk → Claude-tekst uit de detailed-data')
  eq(md.get('d-missie')._herverrijk, undefined, 'D: _herverrijk-vlag weg')
  ok(claude.state.prompts['d-missie'].includes('Status: gelanceerd op 14 apr 2026; de missie is in bedrijf'), 'D: Claude krijgt de status mee (actief)')
  ok(claude.state.prompts['Nieuw Lanc'].includes('Status: nog niet gelanceerd; gepland voor'), 'D: Claude krijgt de status mee (gepland)')
  eq(d1.calls, ['Nieuw Kwartaal', 'Nieuw Lanc', 'd-missie'], 'D run 1: Claude voor de nieuwe lanceringen (bij aanmaak) en d-missie (_herverrijk)')
  eq(d1.detailed.map(u => u.searchParams.get('id')), ['00000000-d-missie'], 'D run 1: precies één detailed-request, voor d-missie')

  const voorD = fs.readFileSync(tmpD.missions, 'utf-8')
  const d2 = await run(tmpD, ll2D, claude)
  eq(d2.calls, [], 'D run 2: 0 Claude-aanroepen')
  eq(d2.list.length + d2.detailed.length, 0, 'D run 2: geen LL2-requests')
  eq(fs.readFileSync(tmpD.missions, 'utf-8'), voorD, 'D run 2: geen diff')
  ok(d2.stdout.split('\n').includes('Claude-aanroepen: 0'), 'D run 2: log meldt "Claude-aanroepen: 0"')
  fs.rmSync(tmpD.dir, { recursive: true, force: true })

  const tmpDK = setup(dMissies, dUp)
  const dk = await run(tmpDK, ll2D, claude, '')
  eq(dk.missions.get('d-missie')._herverrijk, true, 'D zonder sleutel: _herverrijk blijft staan')
  eq(dk.detailed.length, 0, 'D zonder sleutel: geen detailed-request')
  eq(dk.missions.get('d-lanc-oud').highlight, 'Gelanceerd op 3 mrt 2026 met Electron', 'D zonder sleutel: lancering-sjabloon wel')
  fs.rmSync(tmpDK.dir, { recursive: true, force: true })
  await ll2D.close()

  await claude.close()
  console.log(`✅ ${checks} statustekstcontroles geslaagd (run 1: 2 Claude, 1 detailed; run 2: niets; D: sjabloon wint, _herverrijk)`)
})().catch(err => { console.error(err); process.exit(1) })
