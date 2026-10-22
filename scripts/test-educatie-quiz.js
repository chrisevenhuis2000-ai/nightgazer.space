// scripts/test-educatie-quiz.js
// De quizgenerator (scripts/educatie-quiz.js) tegen een nep-Claude: de
// vormcontrole, het schudden, de controle-ronde en het terugvallen op de
// vorige set als een onderwerp te weinig goede vragen oplevert.

const fs = require('fs')
const os = require('os')
const path = require('path')
const assert = require('assert/strict')
const Q = require('./educatie-quiz')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }

const niveau = (q, correct = 1) => ({
  q, options: [`Fout ${q} 1`, `Goed ${q}`, `Fout ${q} 2`, `Fout ${q} 3`], correct,
  explain: 'Dit is de uitleg waarom het juiste antwoord klopt.',
})
const vraag = q => ({ beg: niveau(`${q} beginner?`), ama: niveau(`${q} amateur?`), pro: niveau(`${q} pro?`) })

// ── isoWeek ───────────────────────────────────────────────────────────────
eq(Q.isoWeek(new Date('2026-10-22T09:00:00Z')), '2026-W43', 'isoWeek: donderdag 22 okt 2026')
eq(Q.isoWeek(new Date('2027-01-01T09:00:00Z')), '2026-W53', 'isoWeek: 1 jan 2027 hoort bij 2026')

// ── vormcontrole ──────────────────────────────────────────────────────────
const s = Q.schoonNiveau(niveau('Hoe oud is het heelal?'))
ok(s && s.options[s.correct] === 'Goed Hoe oud is het heelal?', 'schud: juiste antwoord blijft juist na schudden')
eq(Q.schoonNiveau(niveau('Hoe oud is het heelal?')), s, 'schud: vaste volgorde voor dezelfde vraag')
eq(Q.schoonNiveau({ ...niveau('Drie opties maar?'), options: ['a', 'b', 'c'] }), null, 'vorm: drie opties afgekeurd')
eq(Q.schoonNiveau({ ...niveau('Dubbele opties hier?'), options: ['a', 'A', 'b', 'c'] }), null, 'vorm: dubbele optie afgekeurd')
eq(Q.schoonNiveau({ ...niveau('Index buiten bereik?'), correct: 4 }), null, 'vorm: index 4 afgekeurd')
eq(Q.schoonNiveau({ ...niveau('Alle bovenstaande?'), options: ['a', 'b', 'c', 'Alle bovenstaande'] }), null, 'vorm: "alle bovenstaande" afgekeurd')
eq(Q.schoonVraag({ beg: niveau('Alleen beginner?') }), null, 'vorm: vraag zonder alle drie de niveaus afgekeurd')
const posities = new Set(Array.from({ length: 30 }, (_, i) => Q.schoonNiveau(niveau(`Vraag nummer ${i}?`)).correct))
ok(posities.size >= 3, 'schud: het juiste antwoord staat niet steeds op dezelfde plek')

// ── onderwerpen uit lib/education-data.ts ─────────────────────────────────
const ond = Q.onderwerpen()
eq(ond.map(t => t.id), ['zonnestelsel', 'sterren', 'sterrenstelsels', 'kosmologie', 'exoplaneten', 'ruimtevaart'], 'onderwerpen: zes, uit education-data.ts')
ok(ond.every(t => t.beg && t.ama && t.pro), 'onderwerpen: uitleg op drie niveaus aanwezig')

// ── main met een nep-client ───────────────────────────────────────────────
function nepClient({ afkeurenVoor = [], kapot = [], ronde = 'a' } = {}) {
  const calls = []
  return {
    calls,
    beta: { messages: { create: async req => {
      calls.push(req)
      const props = req.output_config.format.schema.properties
      const user = req.messages[0].content
      let out
      if (props.oordelen) {
        const n = (user.match(/^Vraag \d+$/gm) || []).length
        const afkeur = afkeurenVoor.some(id => user.includes(id))
        out = { oordelen: Array.from({ length: n }, (_, i) => ({ nr: i + 1, klopt: !(afkeur || (i === 0 && !user.includes('Bronartikel'))), reden: 'test' })) }
      } else if (props.slug) {
        out = { slug: 'komeet-nieuws', vraag: vraag('Waarom krijgt een komeet een staart') }
      } else {
        const id = /Onderwerp: (.*)/.exec(user)[1]
        if (kapot.some(k => id.includes(k))) throw new Error('API down')
        out = { vragen: [...Array.from({ length: 9 }, (_, i) => vraag(`${id} ${ronde}${i}`)), { beg: niveau('kapot') }] }
      }
      return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(out) }] }
    } } },
  }
}

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-'))
  const art = path.join(dir, 'articles'); fs.mkdirSync(art)
  const body = 'Een komeet krijgt een staart als het ijs verdampt door de warmte van de zon. '.repeat(10)
  fs.writeFileSync(path.join(art, 'komeet-nieuws.md'), `---\ntitle: "Komeet krijgt staart"\npublishedAt: "2026-10-21T07:00:00Z"\n---\n\n${body}\n`)
  fs.writeFileSync(path.join(art, 'oud.md'), `---\ntitle: "Oud nieuws"\npublishedAt: "2026-09-01T07:00:00Z"\n---\n\n${body}\n`)
  const file = path.join(dir, 'quiz.json')
  const nu = new Date('2026-10-22T08:00:00Z')

  // Eerste run: alles nieuw.
  const c1 = nepClient()
  const s1 = await Q.main({ client: c1, nu, file, dir: art })
  const q1 = JSON.parse(fs.readFileSync(file, 'utf8'))
  eq(s1.vernieuwd.length, 6, 'main: zes onderwerpen vernieuwd')
  eq(q1.onderwerpen.sterren.vragen.length, Q.PER_WEEK, 'main: zeven vragen per onderwerp (één per dag)')
  ok(!JSON.stringify(q1.onderwerpen.sterren).includes('Sterren & Leven a0 beginner'), 'main: door de controleur afgekeurde vraag staat er niet in')
  ok(!JSON.stringify(q1).includes('"kapot'), 'main: vraag zonder alle niveaus valt weg')
  eq(q1.onderwerpen.sterren.week, '2026-W43', 'main: week genoteerd')
  eq(q1.dagvragen[0].datum, '2026-10-22', 'main: vraag van de dag voor vandaag')
  eq(q1.dagvragen[0].slug, 'komeet-nieuws', 'main: dagvraag verwijst naar het artikel')
  ok(!c1.calls.find(c => c.output_config.format.schema.properties.slug).messages[0].content.includes('Oud nieuws'), 'main: alleen recente artikelen gaan mee')

  // Zelfde dag nog eens: niets te doen, geen API-aanroep.
  const c2 = nepClient()
  await Q.main({ client: c2, nu, file, dir: art })
  eq(c2.calls.length, 0, 'main: tweede run op dezelfde dag doet niets')

  // Volgende week: één onderwerp faalt, één wordt helemaal afgekeurd → vorige set blijft.
  const volgendeWeek = new Date('2026-10-27T08:00:00Z')
  const c3 = nepClient({ kapot: ['Kosmologie'], afkeurenVoor: ['Exoplaneten'], ronde: 'b' })
  const s3 = await Q.main({ client: c3, nu: volgendeWeek, file, dir: art })
  const q3 = JSON.parse(fs.readFileSync(file, 'utf8'))
  eq(s3.behouden.sort(), ['exoplaneten', 'kosmologie'], 'main: mislukte onderwerpen behouden')
  eq(q3.onderwerpen.kosmologie, q1.onderwerpen.kosmologie, 'main: kosmologie houdt de set van vorige week')
  eq(q3.onderwerpen.exoplaneten, q1.onderwerpen.exoplaneten, 'main: volledig afgekeurde set vervangt niets')
  eq(q3.onderwerpen.sterren.week, '2026-W44', 'main: geslaagde onderwerpen zijn vernieuwd')
  ok(c3.calls.some(c => c.messages[0].content.includes('Herhaal deze vragen van vorige week niet')), 'main: vorige vragen gaan mee om herhaling te voorkomen')

  console.log(`✓ ${checks} checks geslaagd`)
})().catch(e => { console.error(e); process.exit(1) })
