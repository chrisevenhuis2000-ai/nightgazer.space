// Test: de tijdlijnregel die het script zelf schrijft volgt de status, en
// "Officiële pagina" wijst nooit naar de LL2-API.
//   node scripts/test-missie-tijdlijn.js
// Geen netwerk, geen Claude.

const assert = require('assert')
const { syncTijdlijn, isWebUrl, webUrl } = require('./update-missions.js')

let checks = 0
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg); checks++ }

const missie = (status, extra = {}) => ({
  name: 'Flight 12', status, launched: '22 mei 2026', launchPrecision: 'Day',
  timeline: [
    { date: 'apr 2023', event: 'Handmatige regel' },
    { date: '31 mei 2026', event: 'Geplande lancering van Flight 12' },
  ],
  ...extra,
})

// ── Status → regel ──
let m = missie('voltooid')
eq(syncTijdlijn(m), true, 'voltooid: regel bijgewerkt')
eq(m.timeline[1], { date: '22 mei 2026', event: 'Gelanceerd' }, 'voltooid → Gelanceerd op de echte datum')
eq(m.timeline[0], { date: 'apr 2023', event: 'Handmatige regel' }, 'handmatige regel onaangeroerd')
eq(syncTijdlijn(m), false, 'tweede run verandert niets')

m = missie('mislukt')
syncTijdlijn(m)
eq(m.timeline[1], { date: '22 mei 2026', event: 'Lancering mislukt' }, 'mislukt → Lancering mislukt')

m = missie('actief')
syncTijdlijn(m)
eq(m.timeline[1].event, 'Gelanceerd', 'actief → Gelanceerd')

// Terug naar gepland (verschoven na een scrub): de regel volgt, met precisie.
m = missie('gepland', { launched: '31 dec 2026', launchPrecision: 'Quarter 4' })
m.timeline[1] = { date: '22 mei 2026', event: 'Gelanceerd' }
syncTijdlijn(m)
eq(m.timeline[1], { date: 'Q4 2026', event: 'Geplande lancering van Flight 12' }, 'gepland → precisie uit LL2')

m = missie('gepland', { launched: '9 jun 2026', launchPrecision: 'Day' })
syncTijdlijn(m)
eq(m.timeline[1].date, '9 jun 2026', 'verschoven datum komt in de regel')

// Zonder botregel: niets toevoegen.
m = { name: 'X', status: 'voltooid', launched: '1 jan 2026', timeline: [{ date: '2020', event: 'Iets anders' }] }
eq(syncTijdlijn(m), false, 'geen botregel → niets')
eq(m.timeline.length, 1, 'geen regel toegevoegd')
eq(syncTijdlijn({ name: 'Y', status: 'voltooid', launched: '1 jan 2026' }), false, 'geen tijdlijn → niets')

// ── Webadressen ──
eq(isWebUrl('https://www.spacex.com/vehicles/starship/'), true, 'gewone site')
eq(isWebUrl('https://ll.thespacedevs.com/2.3.0/agencies/121/?format=json'), false, 'LL2-API')
eq(isWebUrl('https://example.org/x?format=json'), false, 'format=json')
eq(isWebUrl('javascript:alert(1)'), false, 'geen http(s)')
eq(isWebUrl(undefined), false, 'leeg')

eq(webUrl({
  mission: { info_urls: [{ url: 'https://ll.thespacedevs.com/x/?format=json' }, { url: 'https://www.nasa.gov/mission/x/' }], agencies: [{ url: 'https://ll.thespacedevs.com/2.3.0/agencies/44/?format=json' }] },
}), 'https://www.nasa.gov/mission/x/', 'eerste bruikbare info-url')
eq(webUrl({ mission: { agencies: [{ url: 'https://ll.thespacedevs.com/2.3.0/agencies/121/?format=json', info_url: 'https://www.spacex.com/' }] } }), 'https://www.spacex.com/', 'info_url van het agentschap')
eq(webUrl({ url: 'https://ll.thespacedevs.com/2.3.0/launches/abc/', mission: { agencies: [{ url: 'https://ll.thespacedevs.com/2.3.0/agencies/121/?format=json' }] } }), '', 'alleen API-adressen → leeg')

console.log(`✅ ${checks} tijdlijn- en linkcontroles geslaagd`)
