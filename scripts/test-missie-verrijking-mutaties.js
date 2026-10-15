// scripts/test-missie-verrijking-mutaties.js
// Mutatietest voor test-missie-verrijking.js en test-missie-statustekst.js:
// elke mutatie hieronder zet één regel uit update-missions.js terug naar fout
// gedrag (o.a. de oude bug: een nieuwe missie zonder _lastClaudeUpdate). Op
// elke mutant moet minstens één van de twee tests falen; slagen ze allebei,
// dan beschermt niets die regel.

const fs   = require('fs')
const os   = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const SRC = fs.readFileSync(path.join(__dirname, 'update-missions.js'), 'utf-8')
const TESTS = ['test-missie-verrijking.js', 'test-missie-statustekst.js'].map(f => path.join(__dirname, f))

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
  ['missie → actief niet naar Claude',
    "if (statusGewijzigd && mission.soort === 'missie' && mission.status === 'actief') return 'status'",
    ''],
  ['elke statuswijziging weer naar Claude',
    "if (statusGewijzigd && mission.soort === 'missie' && mission.status === 'actief') return 'status'",
    "if (statusGewijzigd) return 'status'"],
  ['geen sjabloon-highlight in upcoming',
    'if (statusGewijzigd) mission.highlight = highlightVoorMissie(mission)',
    ''],
  ['geen sjabloon-highlight bij opvragen op id',
    `if (!statusGewijzigd) continue
      mission.highlight = highlightVoorMissie(mission)`,
    'if (!statusGewijzigd) continue'],
  ['Claude overschrijft de sjabloon-highlight',
    'if (enriched.highlight && !behoudHighlight) mission.highlight = enriched.highlight',
    'if (enriched.highlight) mission.highlight = enriched.highlight'],
  ['missie → actief op id zonder detailed-request',
    "if (ANTHROPIC_KEY && claudeReden(mission, { statusGewijzigd, heeftBeschrijving: true }) === 'status') {",
    'if (false) {'],
  ['lancering-sjabloon niet elke run',
    'if (mission.highlight !== highlight) {\n      console.log(`  ✏️  ${mission.name}: highlight → ${highlight}`)',
    'if (false) {'],
  ['_herverrijk genegeerd',
    'if (!mission._herverrijk) continue',
    'continue'],
  ['_herverrijk-vlag niet gewist',
    'if (await naarActief(mission)) { delete mission._herverrijk; changed = true }',
    'if (await naarActief(mission)) { changed = true }'],
  ['status niet in de prompt',
    'Status: ${statusVoorPrompt(mission)}\n',
    ''],
  ['precisie van een bestaande missie niet bijgewerkt',
    'if (ll2Data.netPrecision && mission.launchPrecision !== ll2Data.netPrecision) {',
    'if (false) {'],
  ['gepland-sjabloon negeert de precisie',
    'return `Lancering gepland: ${datum ? datumTekst(datum, precisie) : d}`',
    'return `Lancering gepland: ${d}`'],
  ['kwartaal als jaar',
    "if (q) return `Q${q[1]} ${jaar}`",
    'if (q) return String(jaar)'],
  ['sjabloon mislukt zonder voertuig',
    'voertuig ? `Lancering mislukt op ${d} (${voertuig})`',
    'voertuig ? `Lancering mislukt op ${d}`'],
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
  const r = TESTS.map(t => spawnSync(process.execPath, [t], { env: { ...process.env, MISSIE_SCRIPT: mutant }, encoding: 'utf-8' })).find(x => x.status !== 0)
  if (!r) {
    console.error(`❌ Mutatie '${naam}' niet gevangen: beide tests slagen nog`)
    process.exit(1)
  }
  const reden = (r.stderr.match(/AssertionError \[ERR_ASSERTION\]: ([^\n]*)/) || [, r.stderr.trim().split('\n')[0]])[1]
  console.log(`   gevangen: ${naam} — ${reden.slice(0, 110)}`)
  gevangen++
}
fs.rmSync(dir, { recursive: true, force: true })
console.log(`✅ ${gevangen}/${MUTATIES.length} mutaties gevangen door test-missie-verrijking.js / test-missie-statustekst.js`)
