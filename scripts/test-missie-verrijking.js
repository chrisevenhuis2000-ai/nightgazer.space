// scripts/test-missie-verrijking.js
// Wanneer gaat een missie naar Claude? Draait update-missions.js meerdere
// keren tegen een nep-Claude (scripts/__fixtures__/claude-mock.js) en telt
// wie er langskwam.
//
//   A. De echte snapshot + upcoming-fixture: run 1 verrijkt de nieuwe
//      missies, run 2 verrijkt niets en meldt "Claude-aanroepen: 0" (ook in
//      $GITHUB_STEP_SUMMARY).
//   B. Synthetisch, over vier runs:
//      - een lancering zonder statuswijziging gaat niet naar Claude, ook niet
//        na 31 (of 400) dagen;
//      - een lancering met statuswijziging ook niet (alleen de highlight uit
//        het sjabloon; zie test-missie-statustekst.js);
//      - een missie wél na 31 dagen, niet na 5;
//      - een mislukte poging wordt niet de volgende dag herhaald, wel na 31
//        dagen;
//      - geen LL2-beschrijving → geen aanroep, wel een vastgelegde poging; komt
//        de beschrijving er alsnog, dan meteen verrijken.
//
// MISSIE_SCRIPT wijst een ander script aan (zie test-missie-verrijking-mutaties.js).

const fs     = require('fs')
const os     = require('os')
const path   = require('path')
const assert = require('assert/strict')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { startClaudeMock } = require('./__fixtures__/claude-mock.js')

const SCRIPT = process.env.MISSIE_SCRIPT || path.join(__dirname, 'update-missions.js')
const { claudeReden } = require(SCRIPT)

let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks++ }
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg); checks++ }

const FIX = path.join(__dirname, '__fixtures__')
const DAY = 86400 * 1000
const ago = days => new Date(Date.now() - days * DAY).toISOString()
const byId = list => new Map(list.map(m => [m.id, m]))

function setup(missions, upcoming) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missie-verrijking-'))
  const tmp = { dir, missions: path.join(dir, 'missions.json'), up: path.join(dir, 'up.json'), summary: path.join(dir, 'summary.md') }
  fs.writeFileSync(tmp.missions, JSON.stringify(missions, null, 2))
  fs.writeFileSync(tmp.up, JSON.stringify(upcoming))
  return tmp
}
const read = tmp => JSON.parse(fs.readFileSync(tmp.missions, 'utf-8'))
const write = (tmp, data) => fs.writeFileSync(tmp.missions, JSON.stringify(data, null, 2))

async function run(tmp, claude) {
  claude.state.calls.length = 0
  fs.writeFileSync(tmp.summary, '')
  const { stdout } = await promisify(execFile)(process.execPath, [SCRIPT], {
    env: {
      ...process.env,
      MISSIONS_PATH: tmp.missions,
      LL2_FIXTURE: tmp.up,
      LL2_BASE_URL: '',
      ANTHROPIC_API_KEY: 'test-sleutel',
      ANTHROPIC_BASE_URL: claude.url,
      MISSIE_GEEN_PAUZE: '1',
      GITHUB_STEP_SUMMARY: tmp.summary,
    },
    encoding: 'utf-8',
  })
  const calls = [...claude.state.calls].sort()
  const regel = `Claude-aanroepen: ${calls.length}`
  ok(stdout.split('\n').includes(regel), `log meldt "${regel}"`)
  ok(fs.readFileSync(tmp.summary, 'utf-8').split('\n').includes(regel), `run-samenvatting meldt "${regel}"`)
  return calls
}

// ── 0. claudeReden los ────────────────────────────────────────────────────
{
  const now = Date.now()
  const r = (m, o = {}) => claudeReden(m, { heeftBeschrijving: true, now, ...o })
  eq(r({ soort: 'lancering', _lastClaudeUpdate: ago(400) }), null, 'lancering, 400 dagen, geen statuswijziging → niet')
  eq(r({ soort: 'lancering', status: 'voltooid', _lastClaudeUpdate: ago(1) }, { statusGewijzigd: true }), null, 'lancering met statuswijziging → niet (highlight uit het sjabloon)')
  eq(r({ soort: 'missie', status: 'actief', _lastClaudeUpdate: ago(1) }, { statusGewijzigd: true }), 'status', 'missie → actief → wel')
  eq(r({ soort: 'missie', status: 'mislukt', _lastClaudeUpdate: ago(1) }, { statusGewijzigd: true }), null, 'missie → mislukt → niet')
  eq(r({ soort: 'missie', _lastClaudeUpdate: ago(31) }), '30 dagen', 'missie na 31 dagen → wel')
  eq(r({ soort: 'missie', _lastClaudeUpdate: ago(29) }), null, 'missie na 29 dagen → niet')
  eq(r({ soort: 'lancering' }), 'nooit verrijkt', 'nooit verrijkt → wel')
  eq(r({ soort: 'lancering', _lastClaudeAttempt: { at: ago(1), reden: 'mislukt' } }), null, 'mislukt, 1 dag geleden → niet')
  eq(r({ soort: 'lancering', _lastClaudeAttempt: { at: ago(31), reden: 'mislukt' } }), 'nooit verrijkt', 'mislukt, 31 dagen geleden → wel')
  eq(r({ soort: 'missie', _lastClaudeUpdate: ago(60), _lastClaudeAttempt: { at: ago(1), reden: 'mislukt' } }), null, 'missie: verversing mislukt gisteren → niet')
  eq(r({ soort: 'lancering', _lastClaudeAttempt: { at: ago(1), reden: 'geen-beschrijving' } }, { heeftBeschrijving: false }), null, 'nog steeds geen beschrijving → niet')
  eq(r({ soort: 'lancering', _lastClaudeAttempt: { at: ago(1), reden: 'geen-beschrijving' } }), 'nooit verrijkt', 'beschrijving er alsnog → meteen')
  eq(r({ soort: 'lancering', _lastClaudeUpdate: ago(10), _lastClaudeAttempt: { at: ago(1), reden: 'geen-beschrijving' } }), 'eerdere poging', 'statuswijziging zonder beschrijving, beschrijving er alsnog → meteen')
  eq(r({ soort: 'lancering', _lastClaudeUpdate: ago(1), _lastClaudeAttempt: { at: ago(5), reden: 'mislukt' } }), null, 'oude poging vóór een geslaagde verrijking telt niet')
}

;(async () => {
  const claude = await startClaudeMock()

  // ── A. Echte snapshot: tweede run verrijkt niets ──────────────────────
  const snapshot = JSON.parse(fs.readFileSync(path.join(FIX, 'missions.json'), 'utf-8'))
  const upcoming = JSON.parse(fs.readFileSync(path.join(FIX, 'll2-upcoming.json'), 'utf-8'))
  const tmpA = setup(snapshot, upcoming)
  const startA = byId(snapshot.missions)

  const run1 = await run(tmpA, claude)
  const afterA = read(tmpA).missions
  const nieuw = afterA.filter(m => !startA.has(m.id))
  ok(nieuw.length >= 5, `A: run 1 voegt nieuwe missies toe (${nieuw.length})`)
  for (const m of nieuw) {
    ok(run1.includes(m.name), `A: nieuwe missie ${m.id} verrijkt bij aanmaak`)
    ok(m._lastClaudeUpdate, `A: nieuwe missie ${m.id} krijgt _lastClaudeUpdate`)
  }
  for (const m of afterA) {
    const was = startA.get(m.id)
    if (!was || !run1.includes(m.name)) continue
    // Een bestaande lancering die al verrijkt was, gaat alleen bij een statuswijziging.
    if (was.soort === 'lancering' && was._lastClaudeUpdate) ok(was.status !== m.status, `A: lancering ${m.id} alleen bij een statuswijziging`)
  }

  const voor2 = fs.readFileSync(tmpA.missions, 'utf-8')
  const run2 = await run(tmpA, claude)
  eq(run2, [], 'A: tweede run verrijkt niets opnieuw')
  eq(fs.readFileSync(tmpA.missions, 'utf-8'), voor2, 'A: tweede run laat missions.json ongemoeid')
  fs.rmSync(tmpA.dir, { recursive: true, force: true })

  // ── B. Synthetisch ────────────────────────────────────────────────────
  const basis = snapshot.missions.find(m => m.id === 'gps-iii-sv10')
  const over60 = new Date(Date.now() + 60 * DAY).toISOString()
  const mission = (id, soort, extra) => ({
    ...basis, id, name: id, soort, status: 'gepland', _ll2Id: `00000000-${id}`,
    launched: '1 jan 2030', relatedTags: ['bestaand'], ...extra,
  })
  const launch = (id, name, status, description) => ({
    id, name,
    mission: { name, description, type: 'Communications', orbit: { name: 'Low Earth Orbit' }, agencies: [] },
    rocket: { configuration: { name: 'Falcon 9' } },
    pad: { name: 'SLC-40' },
    launch_service_provider: { name: 'SpaceX' },
    window_start: over60, net: over60,
    status: { name: status },
  })
  const missies = [
    mission('lanc-oud',    'lancering', { _lastClaudeUpdate: ago(31) }),
    mission('lanc-status', 'lancering', { _lastClaudeUpdate: ago(1) }),
    mission('missie-oud',  'missie',    { _lastClaudeUpdate: ago(31) }),
    mission('missie-vers', 'missie',    { _lastClaudeUpdate: ago(5) }),
    mission('lanc-faalt',  'lancering', {}),
    mission('lanc-leeg',   'lancering', {}),
  ]
  delete missies[4]._lastClaudeUpdate
  delete missies[5]._lastClaudeUpdate
  const beschrijving = 'Test launch description.'
  const pool = desc => ({
    results: [
      launch('00000000-lanc-oud', 'lanc-oud', 'Go for Launch', beschrijving),
      launch('00000000-lanc-status', 'lanc-status', 'Launch Successful', beschrijving),
      launch('00000000-missie-oud', 'missie-oud', 'Go for Launch', beschrijving),
      launch('00000000-missie-vers', 'missie-vers', 'Go for Launch', beschrijving),
      launch('00000000-lanc-faalt', 'lanc-faalt', 'Go for Launch', beschrijving),
      launch('00000000-lanc-leeg', 'lanc-leeg', 'Go for Launch', desc),
      launch('00000000-nieuw-een', 'Nieuw Een', 'Go for Launch', beschrijving),
      launch('00000000-nieuw-leeg', 'Nieuw Leeg', 'Go for Launch', desc),
    ],
  })
  const tmpB = setup({ _meta: {}, missions: missies }, pool(''))
  claude.state.fail.add('lanc-faalt')

  // Run 1
  const b1 = await run(tmpB, claude)
  eq(b1, ['Nieuw Een', 'lanc-faalt', 'missie-oud'], 'B run 1: nieuw, missie na 31 dagen, nooit verrijkt')
  let m = byId(read(tmpB).missions)
  ok(!b1.includes('lanc-oud'), 'B run 1: lancering zonder statuswijziging niet, ook niet na 31 dagen')
  ok(!b1.includes('lanc-status'), 'B run 1: lancering met statuswijziging niet')
  ok(!b1.includes('missie-vers'), 'B run 1: missie na 5 dagen niet')
  eq(m.get('lanc-faalt')._lastClaudeAttempt?.reden, 'mislukt', 'B run 1: mislukte poging vastgelegd')
  eq(m.get('lanc-faalt')._lastClaudeUpdate, undefined, 'B run 1: mislukt → geen _lastClaudeUpdate')
  eq(m.get('lanc-faalt').objective, basis.objective, 'B run 1: mislukt → tekst ongemoeid')
  eq(m.get('lanc-leeg')._lastClaudeAttempt?.reden, 'geen-beschrijving', 'B run 1: geen beschrijving → poging vastgelegd')
  eq(m.get('nieuw-leeg')._lastClaudeAttempt?.reden, 'geen-beschrijving', 'B run 1: nieuwe missie zonder beschrijving → poging vastgelegd')
  eq(m.get('nieuw-een').objective, 'Verrijkt doel van Nieuw Een', 'B run 1: nieuwe missie verrijkt')
  eq(m.get('nieuw-een').relatedTags, ['verrijkt'], 'B run 1: nieuwe missie krijgt Claude\'s tags')
  ok(m.get('nieuw-een')._lastClaudeUpdate && !m.get('nieuw-een')._lastClaudeAttempt, 'B run 1: nieuwe missie krijgt _lastClaudeUpdate')
  eq(m.get('lanc-status').status, 'voltooid', 'B run 1: lanc-status → voltooid')
  eq(m.get('lanc-status').highlight, 'Gelanceerd op ' + m.get('lanc-status').launched + ' met Falcon 9', 'B run 1: lanc-status: highlight uit het sjabloon')
  eq(m.get('missie-oud').relatedTags, ['bestaand', 'verrijkt'], 'B run 1: bestaande missie: tags samengevoegd')
  ok(new Date(m.get('missie-oud')._lastClaudeUpdate) > new Date(ago(1)), 'B run 1: missie-oud ververst')

  // Run 2, de volgende dag: niets opnieuw, ook de mislukte poging niet.
  let data = read(tmpB)
  for (const x of data.missions) if (x._lastClaudeAttempt) x._lastClaudeAttempt.at = ago(1)
  write(tmpB, data)
  claude.state.fail.clear()
  eq(await run(tmpB, claude), [], 'B run 2 (volgende dag): niets opnieuw, mislukte poging niet herhaald')

  // Run 3: LL2 heeft nu wél een beschrijving → meteen, niet pas na 30 dagen.
  fs.writeFileSync(tmpB.up, JSON.stringify(pool(beschrijving)))
  eq(await run(tmpB, claude), ['Nieuw Leeg', 'lanc-leeg'], 'B run 3: beschrijving er alsnog → meteen verrijkt')
  m = byId(read(tmpB).missions)
  ok(m.get('lanc-leeg')._lastClaudeUpdate && !m.get('lanc-leeg')._lastClaudeAttempt, 'B run 3: lanc-leeg verrijkt, poging weg')

  // Run 4, 31 dagen na de mislukte poging; lanc-oud 400 dagen oud.
  data = read(tmpB)
  for (const x of data.missions) {
    if (x.id === 'lanc-faalt') x._lastClaudeAttempt.at = ago(31)
    if (x.id === 'lanc-oud') x._lastClaudeUpdate = ago(400)
  }
  write(tmpB, data)
  eq(await run(tmpB, claude), ['lanc-faalt'], 'B run 4: mislukte poging na 31 dagen opnieuw; lancering na 400 dagen niet')
  m = byId(read(tmpB).missions)
  ok(m.get('lanc-faalt')._lastClaudeUpdate && !m.get('lanc-faalt')._lastClaudeAttempt, 'B run 4: lanc-faalt verrijkt, poging weg')

  // Run 5: rust.
  eq(await run(tmpB, claude), [], 'B run 5: niets')
  fs.rmSync(tmpB.dir, { recursive: true, force: true })

  await claude.close()
  console.log(`✅ ${checks} verrijkingscontroles geslaagd (A: snapshot, ${run1.length} aanroepen in run 1 en 0 in run 2; B: 5 runs)`)
})().catch(err => { console.error(err); process.exit(1) })
