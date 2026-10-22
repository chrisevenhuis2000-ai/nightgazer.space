// scripts/test-nieuws-structuur.js
// De eenmalige structuur-run (scripts/nieuws-structuur.js) tegen een
// nep-client: koppen op de goede plek, alinea's ongewijzigd, verzonnen
// cijfers en citaten eruit, en artikelen met structuur blijven staan.

const fs = require('fs')
const os = require('os')
const path = require('path')
const assert = require('assert/strict')
const matter = require('gray-matter')
const S = require('./nieuws-structuur')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }

const A = [
  'De ruimtetelescoop heeft deze week een nieuwe komeet ontdekt in beelden die in september werden gemaakt, zo meldt het team.',
  'De telescoop is daar eigenlijk niet voor gebouwd: hij maakt diepe opnamen van verre sterrenstelsels en volgt geen snelle objecten.',
  "De komeet werd gevonden met nieuwe software. 'Ik was enthousiast toen mijn software een streep signaleerde', vertelt de onderzoeker.",
  'De komeet staat op ongeveer 1,3 miljard kilometer van de aarde en werd in totaal op 16 opnamen vastgelegd door de telescoop.',
  'Volgens het team is het een gelukkig toeval, omdat de telescoop elk stukje hemel maar één keer bezoekt en het vlak van de planeten mijdt.',
]
const raw = `---\ntitle: "Telescoop ontdekt komeet"\ncategory: "kometen"\n---\n\n${A.join('\n\n')}\n`

// ── koppenInvoegen ────────────────────────────────────────────────────────
const body = S.koppenInvoegen(A.join('\n\n'), [
  { voorAlinea: 3, tekst: 'Een streep in de beelden.' },
  { voorAlinea: 1, tekst: 'Nooit vóór de eerste' },
  { voorAlinea: 3, tekst: 'Dubbel' },
  { voorAlinea: 9, tekst: 'Bestaat niet' },
  { voorAlinea: 5, tekst: '## Een gelukkig toeval' },
])
eq(body.split('\n\n').filter(p => p.startsWith('## ')), ['## Een streep in de beelden', '## Een gelukkig toeval'], 'koppen: alleen geldige plekken, zonder punt of dubbele #')
eq(body.split('\n\n').filter(p => !p.startsWith('## ')).map(p => p.trim()), A, 'koppen: alinea’s ongewijzigd en in dezelfde volgorde')
ok(body.indexOf('## Een streep') < body.indexOf(A[2]) && body.indexOf('## Een streep') > body.indexOf(A[1]), 'koppen: kop staat vóór alinea 3')

// ── bijwerken ─────────────────────────────────────────────────────────────
const antwoord = {
  koppen: [{ voorAlinea: 3, tekst: 'Een streep in de beelden' }],
  kernpunten: ['Een telescoop vond een nieuwe komeet.', 'Nieuwe software zag hem.', 'Hij staat 1,3 miljard km ver.'],
  kerncijfers: [{ waarde: '1,3 mld', eenheid: 'km', label: 'Afstand' }, { waarde: '99', eenheid: '', label: 'Verzonnen' }, { waarde: '16', eenheid: '', label: 'Opnamen' }],
  citaat: { tekst: 'Ik was enthousiast toen mijn software een streep signaleerde', wie: 'De onderzoeker' },
}
const nieuw = S.bijwerken(raw, antwoord)
const m = matter(nieuw)
eq(m.data.title, 'Telescoop ontdekt komeet', 'bijwerken: bestaande frontmatter blijft')
eq(m.data.kernpunten.length, 3, 'bijwerken: kernpunten in de frontmatter (geldige YAML)')
eq(m.data.kerncijfers.map(k => k.waarde), ['1,3 mld', '16'], 'bijwerken: verzonnen kerncijfer valt weg')
eq(m.data.citaat.wie, 'De onderzoeker', 'bijwerken: letterlijk citaat blijft')
eq(S.bijwerken(raw, { ...antwoord, citaat: { tekst: 'Dit zei niemand in het hele artikel ooit', wie: 'x' } }).includes('citaat:'), false, 'bijwerken: verzonnen citaat valt weg')
eq(S.bijwerken(nieuw, antwoord), null, 'bijwerken: artikel met kernpunten blijft staan')
eq(S.bijwerken(raw, { ...antwoord, kernpunten: [] }), null, 'bijwerken: zonder kernpunten geen wijziging')

// ── main ──────────────────────────────────────────────────────────────────
;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'structuur-'))
  fs.writeFileSync(path.join(dir, 'komeet.md'), raw)
  fs.writeFileSync(path.join(dir, 'al-klaar.md'), nieuw)
  fs.writeFileSync(path.join(dir, 'engels.md'), `---\ntitle: "x"\n---\n\nThe probe has sent its first data back to Earth and the team is happy with it.\n\nThe data will be used for years by the scientists of the mission and their partners.\n`)
  fs.writeFileSync(path.join(dir, 'kapot.md'), raw.replace('Telescoop ontdekt komeet', 'KAPOT'))
  const vragen = []
  const client = { beta: { messages: { create: async req => {
    vragen.push(req)
    if (/KAPOT/.test(req.messages[0].content)) return { stop_reason: 'max_tokens', content: [] }
    return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(antwoord) }] }
  } } } }
  const log0 = console.log; console.log = () => {}
  let stats
  try { stats = await S.main({ dir, client }) } finally { console.log = log0 }
  eq(stats, { kandidaten: 2, bijgewerkt: 1, mislukt: 1 }, 'main: alleen Nederlandse artikelen zonder structuur')
  eq(vragen[0].model, 'claude-sonnet-5-5', 'main: model')
  eq(vragen[0].fallbacks, 'default', 'main: fallbacks default')
  ok(/\[3\] De komeet werd gevonden/.test(vragen.find(v => !/KAPOT/.test(v.messages[0].content)).messages[0].content), 'main: genummerde alinea’s')
  ok(/^## Een streep in de beelden$/m.test(fs.readFileSync(path.join(dir, 'komeet.md'), 'utf8')), 'main: bestand bijgewerkt')
  eq(fs.readFileSync(path.join(dir, 'kapot.md'), 'utf8'), raw.replace('Telescoop ontdekt komeet', 'KAPOT'), 'main: mislukt artikel ongewijzigd')
  eq(fs.readFileSync(path.join(dir, 'al-klaar.md'), 'utf8'), nieuw, 'main: artikel met structuur ongewijzigd')
  console.log(`✅ ${checks} structuur-controles geslaagd`)
})().catch(e => { console.error(e); process.exit(1) })
