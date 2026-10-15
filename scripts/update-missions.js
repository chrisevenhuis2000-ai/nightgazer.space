// scripts/update-missions.js
// Haalt dagelijks missiedata op via Launch Library 2 + SpaceX API
// en verrijkt met Claude voor Nederlandse tekstvelden.
// Merge-regels: API-data wint voor status/datum/vehicle/pad;
//               handmatig gecureerde velden (icon, gradients, facts) worden NOOIT overschreven.

const fs      = require('fs')
const path    = require('path')
const https   = require('https')

// MISSIONS_PATH en LL2_FIXTURE zijn er voor de lokale test
// (scripts/test-missie-koppeling.js); de workflow zet ze niet.
const MISSIONS_PATH = process.env.MISSIONS_PATH || path.join(process.cwd(), 'content', 'missions.json')
const LL2_FIXTURE   = process.env.LL2_FIXTURE || null
// Fixture voor /launches/previous/. Met LL2_FIXTURE maar zonder deze wordt
// die request overgeslagen: de test gaat nooit het netwerk op.
const LL2_PREVIOUS_FIXTURE = process.env.LL2_PREVIOUS_FIXTURE || null
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

// '9 apr 2026' → Date (UTC, net als formatDutch). Andere vormen → null.
function parseDutch(s) {
  const m = /^(\d{1,2}) ([a-z]{3}) (\d{4})$/.exec(s || '')
  if (!m) return null
  const month = MONTHS_NL.indexOf(m[2])
  return month < 0 ? null : new Date(Date.UTC(+m[3], month, +m[1]))
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function launchName(ll2Launch) {
  return ll2Launch.mission?.name || ll2Launch.name || ''
}

function isFuture(ll2Launch, now) {
  const t = new Date(ll2Launch.window_start || ll2Launch.net || '').getTime()
  return !isNaN(t) && t > now
}

// Twijfelgevallen gaan als annotatie naar de Actions-output, zodat ze in de
// run-samenvatting zichtbaar zijn in plaats van stil gekoppeld te worden.
function warn(msg) {
  console.log(`::warning title=Missie niet gekoppeld::${msg.replace(/\r?\n/g, ' ')}`)
}

// LL2-status → status op de site. Een geslaagde lancering hangt af van de
// soort: een missie gaat haar operationele fase in ('actief'), een
// lanceerdienstvlucht is daarmee klaar ('voltooid').
//   Launch Successful            → actief | voltooid (naar soort)
//   Launch Failure / Partial F.  → mislukt
//   Launch in Flight             → actief
//   Go, TBD, TBC, Hold, ...      → gepland
function mapLL2Status(ll2StatusName, soort) {
  const s = (ll2StatusName || '').toLowerCase()
  if (s.includes('failure')) return 'mislukt'          // ook 'Partial Failure'
  if (s.includes('in flight')) return 'actief'
  if (s.includes('success')) return soort === 'missie' ? 'actief' : 'voltooid'
  return 'gepland'
}

// Startwaarde voor 'soort' bij een nieuwe missie, uit LL2's mission.type.
// Alleen wetenschap en verkenning krijgen een operationele fase; al het
// andere (communicatie, overheid/geheim, rideshare, navigatie, test,
// onbekend) is een lancering. Bij twijfel dus 'lancering': die belandt niet
// in 'Wat er nu vliegt'.
const MISSIE_TYPES = ['astrophysics', 'planetary science', 'heliophysics', 'human exploration', 'robotic exploration', 'space science']
function soortVoorType(missionType) {
  const t = (missionType || '').toLowerCase()
  return MISSIE_TYPES.some(x => t.includes(x)) ? 'missie' : 'lancering'
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
    system: [
      'Je bent redacteur van Nightgazer.space. Schrijf in het Nederlands, journalistieke stijl.',
      'Gebruik uitsluitend de gegevens die hieronder worden aangeleverd. Voeg geen feiten, aantallen, namen of doelen toe die daar niet in staan.',
      'Verander het type missie niet. Een lancering van satellieten blijft een lancering, een ruimtesonde blijft een sonde, een bemande vlucht blijft een bemande vlucht. De huidige omschrijving geeft het type aan.',
      'Kun je een veld niet invullen op basis van de gegevens, geef dan een lege string ("") of een lege lijst.',
      'Antwoord UITSLUITEND als geldig JSON zonder markdown of uitleg.',
    ].join(' '),
    messages: [{
      role:    'user',
      content: `Missie: ${mission.name}
Soort: ${mission.soort === 'missie' ? 'missie met een operationele fase' : 'lancering (levert een nuttige lading af)'}
Huidige omschrijving (bepaalt het type, niet veranderen): ${mission.objective || '(geen)'}
Agentschap: ${mission.agency}
Voertuig: ${ll2Data.vehicle || mission.vehicle}
Lanceerdatum: ${ll2Data.launchDate || mission.launched}
Baan/bestemming: ${ll2Data.orbit || mission.body}
Beschrijving uit Launch Library 2 (EN): ${ll2Data.description}

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
          // Alleen een gewoon afgerond antwoord telt: een weigering of een
          // afgekapt antwoord ('refusal', 'max_tokens') schrijft niets weg.
          if (parsed.stop_reason !== 'end_turn') {
            reject(new Error(`Claude stopte met '${parsed.stop_reason || parsed.error?.type || 'onbekend'}'`))
            return
          }
          const content = parsed.content?.find?.(b => b.type === 'text')?.text || ''
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

// Wat de verrijking mag wegschrijven: alleen niet-lege tekst binnen een
// redelijke lengte, en tags als korte strings. Al het andere valt weg, zodat
// een half of vreemd antwoord nooit een goed veld overschrijft.
function cleanEnrichment(e) {
  if (!e || typeof e !== 'object') return null
  const text = (v, max) => (typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null)
  return {
    objective:   text(e.objective, 160),
    description: text(e.description, 900),
    highlight:   text(e.highlight, 100),
    relatedTags: Array.isArray(e.relatedTags)
      ? e.relatedTags.filter(t => typeof t === 'string' && t.trim() && t.length <= 40).map(t => t.trim().toLowerCase())
      : [],
  }
}

const hasDescription = d => typeof d === 'string' && d.trim().length > 0

// /launches/previous/ vanaf 'since', oudste eerst — zie 'Vastgelopen gepland'.
function previousUrl(since) {
  return `https://ll.thespacedevs.com/2.3.0/launches/previous/?format=json&limit=100&ordering=net&net__gte=${since}`
}

// ── Missie matchen ────────────────────────────────────────────────────────────
// Streng. Een LL2-id hoort bij precies één lancering, dus:
//   1. dezelfde _ll2Id → koppelen;
//   2. exact dezelfde genormaliseerde naam → alleen koppelen als die missie
//      nog aan geen enkele lancering hangt, en nooit een lopende of
//      afgeronde missie aan een lancering die nog moet komen.
// Geen deelstrings en geen trigram-overlap meer: daarmee werd "Starlink
// Group 17-22" over 17-21 heen gelegd en een geheime Falcon 9 over Voyager 1.
// Bij twijfel: niet koppelen, wel waarschuwen.
function matchMission(missions, ll2Launch, now = Date.now()) {
  const byId = missions.find(m => m._ll2Id === ll2Launch.id)
  if (byId) return byId

  const name = launchName(ll2Launch)
  const key  = normalize(name)
  if (!key) return null

  const same = missions.filter(m => normalize(m.name) === key)
  if (same.length === 0) return null
  if (same.length > 1) {
    warn(`${name} (${ll2Launch.id}): naam past op meerdere missies (${same.map(m => m.id).join(', ')})`)
    return null
  }

  const mission = same[0]
  if (mission._ll2Id) {
    warn(`${name} (${ll2Launch.id}): naam gelijk aan ${mission.id}, maar die hangt al aan LL2 ${mission._ll2Id}`)
    return null
  }
  if ((mission.status === 'actief' || mission.status === 'voltooid') && isFuture(ll2Launch, now)) {
    warn(`${name} (${ll2Launch.id}): ${mission.id} is '${mission.status}', de lancering ligt in de toekomst`)
    return null
  }
  return mission
}

// Mag deze LL2-lancering als nieuwe missie worden toegevoegd? Alleen als
// geen bestaande missie dezelfde id of exact dezelfde naam heeft, en de
// afgeleide id nog vrij is. Een exacte naamgenoot is óf hierboven gekoppeld,
// óf daar al als twijfelgeval gemeld.
function isNewLaunch(missions, ll2Launch) {
  if (missions.some(m => m._ll2Id === ll2Launch.id)) return false
  const name = launchName(ll2Launch)
  const key  = normalize(name)
  if (!key) {
    warn(`LL2 ${ll2Launch.id}: lancering zonder naam overgeslagen`)
    return false
  }
  if (missions.some(m => normalize(m.name) === key)) return false
  const id = slugify(name)
  if (missions.some(m => m.id === id)) {
    warn(`${name} (${ll2Launch.id}): missie-id '${id}' bestaat al voor een andere lancering`)
    return false
  }
  return true
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
    const ll2 = LL2_FIXTURE
      ? JSON.parse(fs.readFileSync(LL2_FIXTURE, 'utf-8'))
      : await fetchJSON(
        'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?format=json&limit=100&ordering=window_start'
      )
    ll2Launches = ll2.results || []
    console.log(`   ${ll2Launches.length} aankomende lanceringen gevonden\n`)
  } catch (err) {
    console.warn(`⚠️  LL2 niet bereikbaar: ${err.message} — verder met SpaceX API`)
  }

  // ── Haal SpaceX op (aanvullend) ───────────────────────────────────────────
  let spaceXLaunches = []
  if (!LL2_FIXTURE) try {
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

    // Weer in upcoming (verschoven lancering): de missertelling geldt niet meer.
    if (mission._previousMisses) { delete mission._previousMisses; changed = true }

    // Sla _ll2Id op voor snelle toekomstige matching
    if (mission._ll2Id !== ll2Launch.id) {
      mission._ll2Id = ll2Launch.id
      changed = true
    }

    // Status bijwerken (API wint altijd)
    const newStatus = mapLL2Status(ll2Data.ll2Status, mission.soort)
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

    // Geen LL2-beschrijving → geen verrijking: anders schrijft Claude op
    // basis van niets.
    if (needsClaude && hasDescription(ll2Data.description)) {
      try {
        console.log(`  🤖 Claude verrijking voor ${mission.name}...`)
        await sleep(1000)
        const enriched = cleanEnrichment(await enrichWithClaude(mission, ll2Data))
        if (enriched) {
          if (enriched.objective)    mission.objective    = enriched.objective
          if (enriched.description)  mission.description  = enriched.description
          if (enriched.highlight)    mission.highlight    = enriched.highlight
          if (enriched.relatedTags.length) {
            // Union van bestaande + nieuwe tags
            const existing = new Set(mission.relatedTags || [])
            for (const t of enriched.relatedTags) existing.add(t)
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

  // ── Vastgelopen 'gepland' oplossen ────────────────────────────────────────
  // Een lancering verdwijnt uit /upcoming/ zodra hij gevlogen heeft, en dan
  // bleef de status voor altijd op 'gepland' staan. Voor missies met een
  // _ll2Id, een verstreken datum en geen plek meer in upcoming wordt één
  // keer /previous/ gelezen (samen met upcoming twee requests per run, ruim
  // binnen de LL2-limiet). Koppelen gebeurt hier alleen op _ll2Id.
  //
  // Oudste eerst (ordering=net): past niet alles op één pagina van 100, dan
  // lost deze run de oudste op en schuift het venster bij de volgende run
  // vanzelf door. Met de nieuwste eerst vielen juist de oudste er steeds af.
  //
  // Een lancering die LL2 nooit meer teruggeeft (geschrapt, nieuwe id) mag
  // het venster niet vastpinnen: elke run waarin de pagina haar datum wél
  // dekte maar haar niet bevatte, telt als misser in _previousMisses. Na
  // MAX_PREVIOUS_MISSES telt ze niet meer mee voor net__gte en vraagt een
  // ::warning:: om handmatig nakijken.
  const MAX_PREVIOUS_MISSES = 3
  const now = Date.now()
  const inUpcoming = new Set(ll2Launches.map(l => l.id))
  const stale = missions.filter(m => {
    if (!m._ll2Id || m.status !== 'gepland' || inUpcoming.has(m._ll2Id)) return false
    const d = parseDutch(m.launched)
    return d && d.getTime() < now
  })
  const parked = stale.filter(m => (m._previousMisses || 0) >= MAX_PREVIOUS_MISSES)
  const inWindow = stale.filter(m => (m._previousMisses || 0) < MAX_PREVIOUS_MISSES)
  for (const m of parked) {
    warn(`${m.name} (${m._ll2Id}): ${m._previousMisses}× niet gevonden in LL2 previous, telt niet meer mee voor het zoekvenster — handmatig nakijken (geschrapt of nieuwe LL2-id?)`)
  }
  if (inWindow.length) {
    const oldest = new Date(Math.min(...inWindow.map(m => parseDutch(m.launched).getTime())) - 7 * 86400 * 1000)
    const since = oldest.toISOString().slice(0, 10)
    console.log(`📡 LL2 previous (${inWindow.length} missies met verstreken datum, sinds ${since}, oudste eerst)`)
    let previous = null
    try {
      if (LL2_PREVIOUS_FIXTURE) {
        previous = JSON.parse(fs.readFileSync(LL2_PREVIOUS_FIXTURE, 'utf-8'))
      } else if (!LL2_FIXTURE) {
        await sleep(1000)
        previous = await fetchJSON(previousUrl(since))
      }
    } catch (err) {
      console.warn(`⚠️  LL2 previous niet bereikbaar: ${err.message} — statussen blijven staan`)
    }
    if (previous) {
      const results = previous.results || []
      // Tot waar heeft deze pagina echt gezocht? Zonder vervolgpagina: alles
      // sinds 'since'. Met vervolgpagina: tot de laatste lancering erop.
      const lastNet = Math.max(...results.map(l => new Date(l.net || l.window_start || 0).getTime()).filter(t => !isNaN(t)), 0)
      const coveredUntil = previous.next ? lastNet : Infinity
      if (previous.next) {
        console.log(`   meer dan ${results.length} lanceringen sinds ${since}; deze run dekt t/m ${new Date(lastNet).toISOString().slice(0, 10)}, de rest volgt bij een volgende run`)
      }
      const byId = new Map(results.map(l => [l.id, l]))
      // Ook geparkeerde missies mogen gevonden worden als ze toevallig op de pagina staan.
      for (const mission of stale) {
        const l = byId.get(mission._ll2Id)
        if (!l) {
          if (!inWindow.includes(mission)) continue
          const d = parseDutch(mission.launched).getTime()
          if (d > coveredUntil) continue   // niet gezocht, dus ook geen misser
          mission._previousMisses = (mission._previousMisses || 0) + 1
          changed = true
          warn(`${mission.name} (${mission._ll2Id}): datum ${mission.launched} is voorbij, maar niet gevonden in LL2 previous (${mission._previousMisses}/${MAX_PREVIOUS_MISSES}) — status blijft '${mission.status}'`)
          continue
        }
        if (mission._previousMisses) { delete mission._previousMisses; changed = true }
        const newStatus = mapLL2Status(l.status?.name, mission.soort)
        if (newStatus !== mission.status) {
          console.log(`  ✏️  ${mission.name}: status ${mission.status} → ${newStatus} (LL2 previous: ${l.status?.name})`)
          mission.status = newStatus
          autoUpdated.push(mission.id)
          changed = true
        }
        const date = formatDutch(l.net || l.window_start)
        if (date !== 'Onbekend' && date !== mission.launched) {
          console.log(`  ✏️  ${mission.name}: datum ${mission.launched} → ${date}`)
          mission.launched = date
          changed = true
        }
      }
    }
  }

  // ── Nieuwe missies detecteren ─────────────────────────────────────────────
  const now180 = Date.now() + 180 * 86400 * 1000
  for (const ll2Launch of ll2Launches) {
    // Al bekend, exacte naamgenoot of bezette id? Dan niet toevoegen.
    if (!isNewLaunch(missions, ll2Launch)) continue
    const launchName = ll2Launch.mission?.name || ll2Launch.name || ''

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
    const missionType = ll2Launch.mission?.type || ''
    const soort = soortVoorType(missionType)
    if (soort === 'missie') {
      // Een nieuwe 'missie' komt in 'Wat er nu vliegt' terecht; laat iemand
      // die indeling nalopen.
      console.log(`::warning title=Nieuwe missie ingedeeld als 'missie'::${launchName} (${ll2Launch.id}), LL2-type '${missionType}' — controleer 'soort' in missions.json`)
    }

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
    if (ANTHROPIC_KEY && hasDescription(ll2Data.description)) {
      try {
        await sleep(1000)
        const enriched = cleanEnrichment(await enrichWithClaude({ name: launchName, agency: agencyName, vehicle: ll2Data.vehicle, body: orbit, launched: formatDutch(ll2Data.launchDate), soort, objective }, ll2Data))
        if (enriched) {
          objective   = enriched.objective   || objective
          description = enriched.description || description
          highlight   = enriched.highlight   || highlight
          relatedTags = enriched.relatedTags.length ? enriched.relatedTags : relatedTags
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
      status:      mapLL2Status(ll2Launch.status?.name, soort),
      soort,
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

module.exports = { matchMission, isNewLaunch, normalize, slugify, mapLL2Status, soortVoorType, parseDutch, cleanEnrichment, previousUrl }

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Fout:', err.message)
    process.exit(1)
  })
}
