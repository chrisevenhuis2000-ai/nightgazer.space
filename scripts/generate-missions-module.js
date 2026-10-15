// scripts/generate-missions-module.js
// Reads content/missions.json → writes lib/missions-generated.ts
// Run automatically via prebuild in package.json

const fs   = require('fs')
const path = require('path')

const jsonPath = path.join(process.cwd(), 'content', 'missions.json')
const outPath  = path.join(process.cwd(), 'lib',     'missions-generated.ts')

if (!fs.existsSync(jsonPath)) {
  console.error('❌ content/missions.json niet gevonden')
  process.exit(1)
}

const raw  = fs.readFileSync(jsonPath, 'utf-8')
const { missions, _meta } = JSON.parse(raw)

// Strip internal fields (_ll2Id etc.) that are not part of MissionDetail
const clean = missions.map(m => {
  const { _ll2Id, _lastClaudeUpdate, _lastClaudeAttempt, _previousMisses, _herverrijk, ...rest } = m
  return rest
})

const ts = `// ⚠️  AUTO-GEGENEREERD — niet handmatig bewerken
// Bron: content/missions.json  |  Script: scripts/generate-missions-module.js
import type { MissionDetail } from './missions-data'

export const MISSIONS: MissionDetail[] = ${JSON.stringify(clean, null, 2)}

export const MISSIONS_LAST_UPDATED = "${_meta.lastUpdated}"
`

fs.writeFileSync(outPath, ts, 'utf-8')
console.log(`✅ missions-generated.ts aangemaakt (${clean.length} missies, bijgewerkt: ${_meta.lastUpdated})`)
