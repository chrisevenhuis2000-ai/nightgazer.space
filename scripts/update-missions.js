// scripts/update-missions.js
// Haalt dagelijks missiedata op via Launch Library 2 + SpaceX API
// en verrijkt met Claude voor Nederlandse tekstvelden.
// Merge-regels: API-data wint voor status/datum/vehicle/pad;
//               handmatig gecureerde velden (icon, gradients, facts) worden NOOIT overschreven.

const fs      = require('fs')
const path    = require('path')
const https   = require('https')

const MISSIONS_PATH = path.join(process.cwd(), 'content', 'missions.json')
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

const MONTHS_NL = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']

// ── Agency defaults ──────────────────────────────────────────────────────────
const AGENCY_COLORS = {
  NASA:       '#378ADD',
  ESA:        '#ffa040',
  SpaceX:     '#3dcfdf',
  Roscosmos:  '#cc4444',
  JAXA:       '#3ddf90',
  ISRO:       '#ff8c42',
  CNSA:       '#ff4444',
  'Rocket Lab': '#c080ff',
  ULA:        '#8888cc',
  Arianespace:'#ffa040',
}
const AGENCY_GRADIENTS = {
  NASA:       ['#04081a', '#08122a'],
  ESA:        ['#0e0a04', '#1e1408'],
  SpaceX:     ['#040e14', '#0a2030'],
  Roscosmos:  ['#140404', '#280808'],
  JAXA:       ['#041408', '#082014'],
  default:    ['#040408', '#080810'],
}

// Whitelist agentschappen voor auto-detectie nieuwe missies
const AGENCY_WHITELIST = ['NASA', 'ESA', 'SpaceX', 'JAXA', 'Roscosmos', 'ISRO', 'CNSA', 'Rocket Lab', 'ULA', 'Arianespace']

// Filter cargo/resupply vluchten
const CARGO_FILTER = /\b(CRS|resupply|Soyuz|Progress|Dragon\s+\d|NG-\d|Cygnus)\b/i

// ── Hulpfuncties ─────────────────────────────────────────────────────────────
function formatDutch(isoString) {
  if (!isoString) return 'Onbekend'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return 'Onbekend'
  return `${d.getUTCDate()} ${MONTHS_NL[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function fuzzyMatch(a, b) {
  const na = normalize(a), nb = normalize(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  // Eenvoudige overlap-score
  const shorter = na.length < nb.length ? na : nb
  const longer  = na.length < nb.length ? nb : na
  let matches = 0
  for (let i = 0; i < shorter.length - 2; i++) {
    if (longer.includes(shorter.slice(i, i + 3))) matches++
  }
  return matches / (shorter.length - 2) > 0.6
}

function mapLL2Status(ll2StatusName) {
  const s = (ll2StatusName || '').toLowerCase()
  if (s.includes('success')) return 'actief'
  if (s.includes('failure') || s.includes('partial')) return 'voltooid'
  return 'gepland'
}

function mapOrbit(orbitName) {
  const o = (orbitName || '').toLowerCase()
  if (o.includes('tli') || o.includes('moon') || o.includes('lunar')) return 'Maan'
  if (o.includes('mars')) return 'Mars'
  if (o.includes('jupiter')) return 'Jupiter-stelsel'
  if (o.includes('l2') || o.includes('lagrange')) return 'L2-punt'
  if (o.includes('helio')) return 'Heliocentrische baan'
  if (o.includes('geo')) return 'Geostationaire baan'
  if (o.includes('leo')) return 'Lage Aardeomloopbaan'
  if (o.includes('sso')) return 'Zonnesynchrone baan'
  return orbitName || 'Aardeomloopbaan'
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'NightGazer/1.0 (nightgazer.space)' } }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode === 429) { reject(new Error('LL2 rate limit (429)')); return }
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Claude verrijking ─────────────────────────────────────────────────────────
async function enrichWithClaude(mission, ll2Data) {
  if (!ANTHROPIC_KEY) {
    console.log(`  ⚠️  Geen ANTHROPIC_API_KEY — Claude verrijking overgeslagen voor ${mission.name}`)
    return null
  }

  const body = JSON.stringify({
    model:      'claude-sonnet-4-6',
    max_tokens: 600,
    system:     'Je bent redacteur van Nightgazer.space. Schrijf in het Nederlands, journalistieke stijl. Antwoord UITSLUITEND als geldig JSON zonder markdown of uitleg.',
    messages: [{
      role:    'user',
      content: `Missie: ${mission.name}
Agentschap: ${mission.agency}
Voertuig: ${ll2Data.vehicle || mission.vehicle}
Lanceerdatum: ${ll2Data.launchDate || mission.launched}
Baan/bestemming: ${ll2Data.orbit || mission.body}
Beschrijving (EN): ${ll2Data.description || '(geen beschrijving beschikbaar)'}

Geef JSON met precies deze velden:
{
  "objective": "Één zin die het doel samenvat (max 120 tekens)",
  "description": "Volledige beschrijving in 3-4 zinnen, journalistieke toon",
  "highlight": "Huidige status of meest recente prestatie (max 80 tekens)",
  "relatedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`,
    }],
  })

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed  = JSON.parse(data)
          const content = parsed.content?.[0]?.text || ''
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (!jsonMatch) { reject(new Error('Claude gaf geen JSON')); return }
          resolve(JSON.parse(jsonMatch[0]))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ── Missie matchen ────────────────────────────────────────────────────────────
function matchMission(missions, ll2Launch) {
  // 1. Directe LL2 ID match
  const byId = missions.find(m => m._ll2Id === ll2Launch.id)
  if (byId) return byId

  // 2. Fuzzy naam match
  const launchName = ll2Launch.mission?.name || ll2Launch.name || ''
  return missions.find(m => fuzzyMatch(m.name, launchName)) || null
}

// ── Hoofdlogica ───────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Missiedata bijwerken...\n')

  // Laad bestaande missions.json
  const raw = JSON.parse(fs.readFileSync(MISSIONS_PATH, 'utf-8'))
  const { _meta, missions } = raw
  let changed     = false
  const autoUpdated = []

  // ── Haal Launch Library 2 op ──────────────────────────────────────────────
  let ll2Launches = []
  try {
    console.log('📡 Launch Library 2 ophalen...')
    const ll2 = await fetchJSON(
      'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?format=json&limit=100&ordering=window_start'
    )
    ll2Launches = ll2.results || []
    console.log(`   ${ll2Launches.length} aankomende lanceringen gevonden\n`)
  } catch (err) {
    console.warn(`⚠️  LL2 niet bereikbaar: ${err.message} — verder met SpaceX API`)
  }

  // ── Haal SpaceX op (aanvullend) ───────────────────────────────────────────
  let spaceXLaunches = []
  try {
    console.log('📡 SpaceX API ophalen...')
    spaceXLaunches = await fetchJSON('https://api.spacexdata.com/v4/launches/upcoming')
    console.log(`   ${spaceXLaunches.length} SpaceX-lanceringen gevonden\n`)
  } catch (err) {
    console.warn(`⚠️  SpaceX API niet bereikbaar: ${err.message}`)
  }

  // ── Bestaande missies bijwerken ───────────────────────────────────────────
  for (const ll2Launch of ll2Launches) {
    const mission = matchMission(missions, ll2Launch)
    if (!mission) continue

    const ll2Data = {
      vehicle:     ll2Launch.rocket?.configuration?.name || null,
      launchSite:  ll2Launch.pad?.name || null,
      launchDate:  ll2Launch.window_start || null,
      // LL2 zegt erbij hoe hard de datum is: 'Day', 'Month', 'Year', ...
      // Zonder dit veld is 31 december niet te onderscheiden van een echte
      // lanceerdag, en tekent de tijdas tientallen vluchten op één dag.
      netPrecision: ll2Launch.net_precision?.name || ll2Launch.net_precision?.abbrev || null,
      description: ll2Launch.mission?.description || null,
      orbit:       mapOrbit(ll2Launch.mission?.orbit?.name),
      missionUrl:  ll2Launch.mission?.agencies?.[0]?.url || null,
      ll2Status:   ll2Launch.status?.name || null,
    }

    // Sla _ll2Id op voor snelle toekomstige matching
    if (mission._ll2Id !== ll2Launch.id) {
      mission._ll2Id = ll2Launch.id
      changed = true
    }

    // Status bijwerken (API wint altijd)
    const newStatus = mapLL2Status(ll2Data.ll2Status)
    if (mission.status !== newStatus) {
      console.log(`  ✏️  ${mission.name}: status ${mission.status} → ${newStatus}`)
      mission.status = newStatus
      changed = true
      autoUpdated.push(mission.id)
    }

    // Lanceerdatum bijwerken (alleen bij concrete datum, niet bij TBD)
    if (ll2Data.launchDate && !ll2Data.ll2Status?.toLowerCase().includes('tbd')) {
      const dutchDate = formatDutch(ll2Data.launchDate)
      if (mission.launched !== dutchDate && !mission.launched.startsWith('IFT')) {
        console.log(`  ✏️  ${mission.name}: datum ${mission.launched} → ${dutchDate}`)
        mission.launched = dutchDate
        changed = true
      }
    }

    // Vehicle + launchSite (API wint als gevuld)
    if (ll2Data.vehicle && mission.vehicle !== ll2Data.vehicle) {
      mission.vehicle = ll2Data.vehicle
      changed = true
    }
    if (ll2Data.launchSite && !mission.launchSite.includes(ll2Data.launchSite)) {
      mission.launchSite = ll2Data.launchSite
      changed = true
    }

    // MissionURL (API wint als gevuld)
    if (ll2Data.missionUrl && mission.missionUrl !== ll2Data.missionUrl) {
      mission.missionUrl = ll2Data.missionUrl
      changed = true
    }

    // Claude verrijking (alleen als status gewijzigd of >30 dagen geleden)
    const lastClaude = mission._lastClaudeUpdate ? new Date(mission._lastClaudeUpdate) : null
    const daysSince  = lastClaude ? (Date.now() - lastClaude.getTime()) / 86400000 : Infinity
    const needsClaude = autoUpdated.includes(mission.id) || daysSince > 30

    if (needsClaude && ll2Data.description) {
      try {
        console.log(`  🤖 Claude verrijking voor ${mission.name}...`)
        await sleep(1000)
        const enriched = await enrichWithClaude(mission, ll2Data)
        if (enriched) {
          if (enriched.objective)    mission.objective    = enriched.objective
          if (enriched.description)  mission.description  = enriched.description
          if (enriched.highlight)    mission.highlight    = enriched.highlight
          if (enriched.relatedTags)  {
            // Union van bestaande + nieuwe tags
            const existing = new Set(mission.relatedTags || [])
            for (const t of enriched.relatedTags) existing.add(t.toLowerCase())
            mission.relatedTags = [...existing]
          }
          mission._lastClaudeUpdate = new Date().toISOString()
          changed = true
          console.log(`     ✅ Verrijking geslaagd`)
        }
      } catch (err) {
        console.warn(`     ⚠️  Claude mislukt: ${err.message}`)
      }
    }
  }

  // ── Nieuwe missies detecteren ─────────────────────────────────────────────
  const now180 = Date.now() + 180 * 86400 * 1000
  const existingIds  = new Set(missions.map(m => m._ll2Id).filter(Boolean))
  const existingNames = missions.map(m => normalize(m.name))

  for (const ll2Launch of ll2Launches) {
    // Al bekend?
    if (existingIds.has(ll2Launch.id)) continue
    const launchName = ll2Launch.mission?.name || ll2Launch.name || ''
    if (existingNames.some(n => fuzzyMatch(n, launchName))) continue

    // Filters
    const agencyName = ll2Launch.launch_service_provider?.name || ''
    if (!AGENCY_WHITELIST.some(a => agencyName.includes(a))) continue
    if (CARGO_FILTER.test(launchName)) continue
    const windowStart = new Date(ll2Launch.window_start || '').getTime()
    if (isNaN(windowStart) || windowStart > now180) continue

    console.log(`\n  🆕 Nieuwe missie gedetecteerd: ${launchName} (${agencyName})`)

    // Bepaal agency-specifieke defaults
    const agencyKey  = AGENCY_WHITELIST.find(a => agencyName.includes(a)) || 'default'
    const agencyColor = AGENCY_COLORS[agencyKey] || '#8A9BC4'
    const [bgFrom, bgTo] = AGENCY_GRADIENTS[agencyKey] || AGENCY_GRADIENTS.default
    const orbit = mapOrbit(ll2Launch.mission?.orbit?.name)

    const ll2Data = {
      vehicle:     ll2Launch.rocket?.configuration?.name || '',
      launchSite:  ll2Launch.pad?.name || '',
      launchDate:  ll2Launch.window_start || '',
      netPrecision: ll2Launch.net_precision?.name || ll2Launch.net_precision?.abbrev || null,
      description: ll2Launch.mission?.description || '',
      orbit,
    }

    let objective   = `${launchName} — ${agencyName} missie naar ${orbit}.`
    let description = `${launchName} is een geplande missie van ${agencyName} naar ${orbit}.`
    let highlight   = `Lancering gepland: ${formatDutch(ll2Data.launchDate)}`
    let relatedTags = [slugify(launchName), slugify(agencyName), slugify(orbit)]

    // Claude verrijking voor nieuwe missie
    if (ANTHROPIC_KEY && ll2Data.description) {
      try {
        await sleep(1000)
        const enriched = await enrichWithClaude({ name: launchName, agency: agencyName, vehicle: ll2Data.vehicle, body: orbit, launched: formatDutch(ll2Data.launchDate) }, ll2Data)
        if (enriched) {
          objective   = enriched.objective   || objective
          description = enriched.description || description
          highlight   = enriched.highlight   || highlight
          relatedTags = enriched.relatedTags || relatedTags
          console.log(`     ✅ Claude verrijking geslaagd`)
        }
      } catch (err) {
        console.warn(`     ⚠️  Claude mislukt: ${err.message}`)
      }
    }

    const newMission = {
      id:          slugify(launchName),
      _ll2Id:      ll2Launch.id,
      name:        launchName,
      agency:      agencyName,
      agencyColor,
      status:      'gepland',
      launched:    formatDutch(ll2Data.launchDate),
      launchPrecision: ll2Data.netPrecision,
      objective,
      body:        orbit,
      highlight,
      icon:        '🚀',
      bgFrom,
      bgTo,
      description,
      vehicle:     ll2Data.vehicle,
      launchSite:  ll2Data.launchSite,
      duration:    'Onbekend',
      distanceKm:  'Onbekend',
      missionUrl:  ll2Launch.mission?.agencies?.[0]?.url || ll2Launch.url || '',
      timeline: [
        { date: formatDutch(ll2Data.launchDate), event: `Geplande lancering van ${launchName}` },
      ],
      facts:       [],
      relatedTags,
    }

    missions.push(newMission)
    autoUpdated.push(newMission.id)
    changed = true
    console.log(`     ➕ Toegevoegd: ${newMission.id}`)
  }

  // ── Opslaan ───────────────────────────────────────────────────────────────
  if (!changed) {
    console.log('\n✅ Geen wijzigingen — missions.json is up-to-date')
    return
  }

  _meta.lastUpdated = new Date().toISOString()
  _meta.autoUpdated = autoUpdated

  fs.writeFileSync(MISSIONS_PATH, JSON.stringify({ _meta, missions }, null, 2), 'utf-8')
  console.log(`\n✅ missions.json opgeslagen (${missions.length} missies, ${autoUpdated.length} bijgewerkt)`)
}

main().catch(err => {
  console.error('❌ Fout:', err.message)
  process.exit(1)
})
