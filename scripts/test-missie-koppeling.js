// scripts/test-missie-koppeling.js
// Draait update-missions.js tegen een nagebouwde LL2-response
// (scripts/__fixtures__/ll2-upcoming.json) op een kopie van missions.json, en
// controleert dat er geen ongewenste koppelingen ontstaan. Geen netwerk,
// geen Claude, geen schrijfacties in content/.
//
//   npm run test:missies

const fs     = require('fs')
const os     = require('os')
const path   = require('path')
const assert = require('assert/strict')
const { execFileSync } = require('child_process')

const ROOT     = path.join(__dirname, '..')
const FIXTURE  = path.join(__dirname, '__fixtures__', 'll2-upcoming.json')
// Vaste snapshot (missions.json na #5, 64fab47), niet het levende bestand:
// de bot past dat dagelijks aan, en dan zou deze test willekeurig breken.
const MISSIONS = path.join(__dirname, '__fixtures__', 'missions.json')

// De oude matcher, alleen als referentie: bewijst dat de fixture de bug echt
// reproduceert. Niet gebruiken voor iets anders.
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '')
function oldFuzzy(a, b) {
  const na = norm(a), nb = norm(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  const sh = na.length < nb.length ? na : nb, lo = na.length < nb.length ? nb : na
  let m = 0
  for (let i = 0; i < sh.length - 2; i++) if (lo.includes(sh.slice(i, i + 3))) m++
  return m / (sh.length - 2) > 0.6
}

const day = 86400 * 1000
const fixtureText = fs.readFileSync(FIXTURE, 'utf-8')
  .replace(/__TOEKOMST_(\d+)D__/g, (_, n) => new Date(Date.now() + Number(n) * day).toISOString())
const fixture = JSON.parse(fixtureText)

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'missies-'))
const tmpMissions = path.join(tmp, 'missions.json')
const tmpFixture  = path.join(tmp, 'll2.json')
fs.copyFileSync(MISSIONS, tmpMissions)
fs.writeFileSync(tmpFixture, fixtureText)

const before = JSON.parse(fs.readFileSync(tmpMissions, 'utf-8')).missions
const byIdBefore = new Map(before.map(m => [m.id, m]))

const stdout = execFileSync(process.execPath, [path.join(__dirname, 'update-missions.js')], {
  env: { ...process.env, MISSIONS_PATH: tmpMissions, LL2_FIXTURE: tmpFixture, ANTHROPIC_API_KEY: '' },
  encoding: 'utf-8',
})
const after = JSON.parse(fs.readFileSync(tmpMissions, 'utf-8')).missions
const byIdAfter = new Map(after.map(m => [m.id, m]))

const KEY_FIELDS = ['_ll2Id', 'status', 'launched', 'vehicle', 'launchSite', 'objective', 'description', 'highlight']
const same = (a, b) => KEY_FIELDS.every(f => JSON.stringify(a[f]) === JSON.stringify(b[f]))
let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks++ }

// 0. De fixture reproduceert de oude bug.
const reproduced = []
for (const l of fixture.results) {
  if (!l._verwacht?.nietKoppelenAan || l._herkomst.includes('naam echt')) continue
  const name = l.mission?.name || l.name
  const old = before.find(m => m._ll2Id === l.id) || before.find(m => oldFuzzy(m.name, name))
  ok(old && old._ll2Id !== l.id, `fixture: oude matcher had '${name}' fout moeten koppelen`)
  reproduced.push(`${name} → ${old.id}`)
}

for (const l of fixture.results) {
  const v = l._verwacht || {}
  const name = l.mission?.name || l.name

  // 1. Nooit aan de missie die hij vroeger kaapte; die blijft onaangeroerd.
  if (v.nietKoppelenAan) {
    const m = byIdAfter.get(v.nietKoppelenAan)
    ok(m, `missie ${v.nietKoppelenAan} bestaat`)
    ok(m._ll2Id !== l.id, `${name} mag niet aan ${v.nietKoppelenAan} hangen`)
    ok(same(m, byIdBefore.get(v.nietKoppelenAan)), `${v.nietKoppelenAan} mag niet veranderen door ${name}`)
  }
  // 2. Wel koppelen waar dat hoort.
  if (v.koppelenAan) {
    const m = byIdAfter.get(v.koppelenAan)
    ok(m && m._ll2Id === l.id, `${name} hoort aan ${v.koppelenAan} te hangen`)
    if (v.launched) ok(m.launched === v.launched, `${v.koppelenAan}: datum ${m.launched}, verwacht ${v.launched}`)
  }
  // 3. Twijfel wordt gemeld.
  if (v.waarschuwing) ok(stdout.split('\n').some(r => r.startsWith('::warning') && r.includes(l.id)), `waarschuwing voor ${name}`)
  // 4. Niet als dubbele missie toevoegen.
  if (v.nietToevoegen) ok(!after.some(m => m._ll2Id === l.id), `${name} mag niet als nieuwe missie verschijnen`)
  // 5. Echt nieuw: toevoegen, met de eigen id.
  if (v.toevoegen) ok(byIdAfter.get(v.toevoegen)?._ll2Id === l.id, `${name} hoort toegevoegd te zijn als ${v.toevoegen}`)
}

// 6. Geen dubbele ids of LL2-ids.
const ll2 = after.map(m => m._ll2Id).filter(Boolean)
ok(new Set(ll2).size === ll2.length, 'geen dubbele _ll2Id')
ok(new Set(after.map(m => m.id)).size === after.length, 'geen dubbele missie-id')

// 7. Geen enkele bestaande missie verandert, behalve de bedoelde koppelingen.
const allowed = new Set(fixture.results.map(l => l._verwacht?.koppelenAan).filter(Boolean))
for (const m of before) {
  if (allowed.has(m.id)) continue
  ok(same(byIdAfter.get(m.id), m), `${m.id} is onverwacht veranderd`)
}

// 8. Elke nieuwe missie hangt aan zijn eigen lancering, met diens naam.
const added = after.filter(m => !byIdBefore.has(m.id))
for (const m of added) {
  const l = fixture.results.find(x => x.id === m._ll2Id)
  ok(l && (l.mission?.name || l.name) === m.name, `nieuwe missie ${m.id} hangt aan zijn eigen lancering`)
}

const warnings = stdout.split('\n').filter(r => r.startsWith('::warning'))
console.log(`✅ ${checks} controles geslaagd`)
console.log(`   oude matcher zou ${reproduced.length} lanceringen fout koppelen; nu 0`)
console.log(`   ${added.length} nieuwe missies (elk aan de eigen lancering), ${warnings.length} waarschuwingen:`)
for (const w of warnings) console.log('   ' + w)
fs.rmSync(tmp, { recursive: true, force: true })
