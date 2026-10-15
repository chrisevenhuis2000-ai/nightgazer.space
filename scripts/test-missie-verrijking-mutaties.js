// scripts/test-missie-verrijking-mutaties.js
// Mutatietest voor test-missie-verrijking.js: elke mutatie hieronder zet één
// regel uit update-missions.js terug naar fout gedrag (o.a. de oude bug: een
// nieuwe missie zonder _lastClaudeUpdate). De test moet op elke mutant
// falen; slaagt hij, dan beschermt hij die regel niet.

const fs   = require('fs')
const os   = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const SRC = fs.readFileSync(path.join(__dirname, 'update-missions.js'), 'utf-8')
const TEST = path.join(__dirname, 'test-missie-verrijking.js')

const MUTATIES = [
  ['nieuwe missie zonder _lastClaudeUpdate (de oude bug)',
    "await verrijk(newMission, ll2Data, 'nieuw', { vervangTags: true })",
    "await verrijk(newMission, ll2Data, 'nieuw', { vervangTags: true }); delete newMission._lastClaudeUpdate"],
  ['30-dagenverversing ook voor lanceringen',
    "else if (mission.soort === 'missie' && dagenSinds(laatste)",
    'else if (dagenSinds(laatste)'],
  ['geen 30-dagenverversing voor missies',
    "else if (mission.soort === 'missie' && dagenSinds(laatste)",
    'else if (false && dagenSinds(laatste)'],
  ['statuswijziging niet naar Claude',
    "if (statusGewijzigd) return 'status'",
    ''],
  ['mislukte poging de volgende dag opnieuw',
    'if (poging && dagenSinds(poging.at) <= CLAUDE_INTERVAL_DAGEN) {',
    'if (false) {'],
  ['mislukte poging niet vastgelegd',
    "mission._lastClaudeAttempt = { at, reden: 'mislukt' }",
    ''],
  ['beschrijving alsnog → toch 30 dagen wachten',
    "const nuWelBeschrijving = poging.reden === 'geen-beschrijving' && heeftBeschrijving",
    'const nuWelBeschrijving = false'],
  ['Claude-aanroepen niet geteld',
    'claudeAanroepen++',
    ''],
]

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missie-mutant-'))
let gevangen = 0
for (const [naam, van, naar] of MUTATIES) {
  if (SRC.split(van).length !== 2) {
    console.error(`❌ Mutatie '${naam}': tekst niet precies één keer gevonden in update-missions.js — werk de mutatietest bij`)
    process.exit(1)
  }
  const mutant = path.join(dir, `mutant-${gevangen}.js`)
  fs.writeFileSync(mutant, SRC.replace(van, naar))
  const r = spawnSync(process.execPath, [TEST], { env: { ...process.env, MISSIE_SCRIPT: mutant }, encoding: 'utf-8' })
  if (r.status === 0) {
    console.error(`❌ Mutatie '${naam}' niet gevangen: test-missie-verrijking.js slaagt nog`)
    process.exit(1)
  }
  const reden = (r.stderr.match(/AssertionError \[ERR_ASSERTION\]: ([^\n]*)/) || [, r.stderr.trim().split('\n')[0]])[1]
  console.log(`   gevangen: ${naam} — ${reden.slice(0, 110)}`)
  gevangen++
}
fs.rmSync(dir, { recursive: true, force: true })
console.log(`✅ ${gevangen}/${MUTATIES.length} mutaties gevangen door test-missie-verrijking.js`)
