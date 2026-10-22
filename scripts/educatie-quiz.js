#!/usr/bin/env node
// scripts/educatie-quiz.js
// Ververst de quiz op /educatie. Draait elke dag (update-quiz.yml):
//   - één keer per ISO-week een nieuwe set van zeven vragen per onderwerp,
//     elk op drie niveaus (Beginner / Amateur / Pro). De pagina toont er
//     elke dag een andere van;
//   - elke dag één "vraag van de dag" over een artikel van de afgelopen dagen.
//
// Elke vraag gaat door twee poorten voordat hij op de site komt:
//   1. een tweede Claude-ronde controleert of het juiste antwoord klopt, of
//      er precies één juist antwoord is en of de uitleg feitelijk juist is;
//   2. een mechanische controle (vier verschillende opties, lengtes, index).
// Valt een onderwerp door beide poorten heen onder de vijf vragen, dan blijft
// de set van vorige week staan. Zonder set valt de pagina terug op de vaste
// vragen in lib/home-content.ts. Er gaat dus nooit een lege quiz live.
//
//   node scripts/educatie-quiz.js [--week] [--dag] [--dry-run]
//     --week  forceer een nieuwe weekset, ook als deze week er al een is
//     --dag   forceer een nieuwe vraag van de dag
// Te testen zonder netwerk: scripts/test-educatie-quiz.js.

const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const Anthropic = require('@anthropic-ai/sdk')

const MODEL_MAAK = 'claude-sonnet-5-5'
const MODEL_CHECK = 'claude-opus-5-5'
const QUIZ_PATH = process.env.QUIZ_PATH || path.join(__dirname, '..', 'content', 'educatie-quiz.json')
const ARTICLES_DIR = process.env.ARTICLES_DIR || path.join(__dirname, '..', 'content', 'articles')
const EDU_PATH = path.join(__dirname, '..', 'lib', 'education-data.ts')

const PER_WEEK = 7          // één vraag per dag van de week
const MIN_PER_WEEK = 5      // minder dan dit: oude set blijft staan
const VRAAG_MAAKT = 9       // ruim vragen, want de controle gooit er soms uit
const DAGVRAGEN_BEWAARD = 14
const NIVEAUS = ['beg', 'ama', 'pro']

// ── Onderwerpen uit lib/education-data.ts ─────────────────────────────────
// Eén bron voor de uitleg: het script leest hetzelfde bestand als de pagina.
function onderwerpen(file = EDU_PATH) {
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const mod = { exports: {} }
  new Function('module', 'exports', 'require', js)(mod, mod.exports, require)
  const { TOPICS, TOPIC_DETAILS } = mod.exports
  return TOPICS.map(t => ({ id: t.id, titel: t.title, begrippen: t.concepts, ...TOPIC_DETAILS[t.id] }))
}

// ── Datums ────────────────────────────────────────────────────────────────
const dagStr = d => d.toISOString().slice(0, 10)
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dag = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dag)
  const jaar = t.getUTCFullYear()
  const week = Math.ceil(((t - Date.UTC(jaar, 0, 1)) / 86400000 + 1) / 7)
  return `${jaar}-W${String(week).padStart(2, '0')}`
}

// ── Schema's ──────────────────────────────────────────────────────────────
const NIVEAU_SCHEMA = {
  type: 'object',
  properties: {
    q:       { type: 'string', description: 'De vraag, één zin' },
    options: { type: 'array', items: { type: 'string' }, description: 'Precies vier antwoordopties' },
    correct: { type: 'integer', description: 'Index (0-3) van het enige juiste antwoord' },
    explain: { type: 'string', description: 'Uitleg van 1 tot 3 zinnen waarom dit het juiste antwoord is' },
  },
  required: ['q', 'options', 'correct', 'explain'],
  additionalProperties: false,
}
const VRAAG_SCHEMA = {
  type: 'object',
  properties: { beg: NIVEAU_SCHEMA, ama: NIVEAU_SCHEMA, pro: NIVEAU_SCHEMA },
  required: ['beg', 'ama', 'pro'],
  additionalProperties: false,
}
const SET_SCHEMA = {
  type: 'object',
  properties: { vragen: { type: 'array', items: VRAAG_SCHEMA } },
  required: ['vragen'],
  additionalProperties: false,
}
const DAG_SCHEMA = {
  type: 'object',
  properties: { slug: { type: 'string', description: 'Slug van het gekozen artikel' }, vraag: VRAAG_SCHEMA },
  required: ['slug', 'vraag'],
  additionalProperties: false,
}
const CHECK_SCHEMA = {
  type: 'object',
  properties: {
    oordelen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nr:    { type: 'integer' },
          klopt: { type: 'boolean' },
          reden: { type: 'string' },
        },
        required: ['nr', 'klopt', 'reden'],
        additionalProperties: false,
      },
    },
  },
  required: ['oordelen'],
  additionalProperties: false,
}

const NIVEAU_UITLEG = [
  'Elke vraag bestaat op drie niveaus over hetzelfde idee:',
  'beg (Beginner): geen voorkennis, alledaagse taal, geen formules;',
  'ama (Amateur): kent de basis, getallen en vaktermen mogen;',
  'pro (Pro): wetenschappelijk niveau, formules en vakjargon mogen.',
].join(' ')

const SYSTEM_MAAK = [
  'Je schrijft quizvragen voor NightGazer, een Nederlandstalige astronomiesite. Schrijf in helder Nederlands.',
  NIVEAU_UITLEG,
  'Elke vraag heeft vier antwoordopties waarvan er precies één juist is. De foute opties zijn geloofwaardig maar onmiskenbaar fout; geen "alle bovenstaande", geen woordspelletjes, geen strikvragen.',
  'Gebruik alleen gevestigde, controleerbare feiten. Twijfel je over een getal, laat het dan weg. Geen vragen over dingen die nog onzeker of omstreden zijn, tenzij de vraag juist over die onzekerheid gaat.',
  'De uitleg zegt waarom het juiste antwoord klopt en leert de lezer iets extra.',
].join(' ')

const SYSTEM_CHECK = [
  'Je bent een strenge feitencontroleur voor een Nederlandstalige astronomiesite.',
  'Je krijgt genummerde quizvragen, elk op drie niveaus. Beoordeel per vraag (alle drie de niveaus samen):',
  'klopt alleen als op elk niveau het aangewezen antwoord feitelijk juist is, geen enkele andere optie ook juist of verdedigbaar is, de uitleg geen feitelijke fouten bevat, en de vraag duidelijk is.',
  'Bij elke twijfel: klopt = false. Geef een korte reden.',
].join(' ')

// ── Claude ────────────────────────────────────────────────────────────────
async function vraagClaude(client, { model, system, user, schema, max = 16000 }) {
  const res = await client.beta.messages.create({
    model,
    max_tokens: max,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: user }],
  })
  if (res.stop_reason !== 'end_turn') throw new Error(`stop_reason ${res.stop_reason}`)
  return JSON.parse((res.content || []).filter(b => b.type === 'text').map(b => b.text).join(''))
}

const vraagTekst = (v, nr) => [
  `Vraag ${nr}`,
  ...NIVEAUS.map(n => {
    const x = v[n]
    const opts = (x.options || []).map((o, i) => `   ${'ABCD'[i]}. ${o}`).join('\n')
    return `[${n}] ${x.q}\n${opts}\n   Aangewezen antwoord: ${'ABCD'[x.correct] ?? '?'}\n   Uitleg: ${x.explain}`
  }),
].join('\n')

/** Laat de controleur oordelen; geeft alleen de vragen terug die kloppen. */
async function controleer(client, vragen, context) {
  if (!vragen.length) return { goed: [], afgekeurd: [] }
  const out = await vraagClaude(client, {
    model: MODEL_CHECK,
    system: SYSTEM_CHECK,
    user: `${context}\n\n${vragen.map((v, i) => vraagTekst(v, i + 1)).join('\n\n')}`,
    schema: CHECK_SCHEMA,
  })
  const oordeel = new Map((out.oordelen || []).map(o => [o.nr, o]))
  const goed = [], afgekeurd = []
  vragen.forEach((v, i) => {
    const o = oordeel.get(i + 1)
    // Geen oordeel telt als afgekeurd: wat niet gecontroleerd is, gaat niet live.
    if (o && o.klopt === true) goed.push(v)
    else afgekeurd.push({ q: v.beg?.q, reden: o ? o.reden : 'geen oordeel' })
  })
  return { goed, afgekeurd }
}

// ── Mechanische controle ──────────────────────────────────────────────────
function hash(s) {
  let h = 2166136261
  for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** Schudt de opties vast (zelfde vraag, zelfde volgorde), want modellen zetten
 *  het juiste antwoord graag op B. */
function schud(x) {
  let s = hash(x.q) || 1
  const idx = [0, 1, 2, 3]
  for (let i = 3; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0
    const j = s % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return { ...x, options: idx.map(i => x.options[i]), correct: idx.indexOf(x.correct) }
}

const tekst = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max
/** Eén niveau schoon, of null. */
function schoonNiveau(x) {
  if (!x || !tekst(x.q, 10, 240) || !tekst(x.explain, 20, 700)) return null
  if (!Array.isArray(x.options) || x.options.length !== 4) return null
  const opts = x.options.map(o => (typeof o === 'string' ? o.trim() : ''))
  if (opts.some(o => o.length < 1 || o.length > 140)) return null
  if (new Set(opts.map(o => o.toLowerCase())).size !== 4) return null
  if (opts.some(o => /^(alle|geen van de) (bovenstaande|antwoorden)/i.test(o))) return null
  if (!Number.isInteger(x.correct) || x.correct < 0 || x.correct > 3) return null
  return schud({ q: x.q.trim(), options: opts, correct: x.correct, explain: x.explain.trim() })
}
/** Een vraag op drie niveaus schoon, of null. */
function schoonVraag(v) {
  const uit = {}
  for (const n of NIVEAUS) {
    const x = schoonNiveau(v?.[n])
    if (!x) return null
    uit[n] = x
  }
  return uit
}

// ── Weekset per onderwerp ─────────────────────────────────────────────────
async function maakWeekset(client, t, oud = []) {
  const user = [
    `Onderwerp: ${t.titel}`,
    `Begrippen: ${t.begrippen.join(', ')}`,
    `Kernfeiten: ${(t.keyFacts || []).join(' · ')}`,
    `Uitleg op de site, Beginner: ${t.beg}`,
    `Amateur: ${t.ama}`,
    `Pro: ${t.pro}`,
    '',
    `Schrijf ${VRAAG_MAAKT} verschillende quizvragen over dit onderwerp, elk op drie niveaus.`,
    'Verspreid ze over de begrippen. Een deel mag rechtstreeks uit de uitleg hierboven komen; de rest gaat over gevestigde kennis die daar logisch op aansluit.',
    oud.length ? `Herhaal deze vragen van vorige week niet:\n${oud.map(q => `- ${q}`).join('\n')}` : '',
  ].join('\n')
  const out = await vraagClaude(client, { model: MODEL_MAAK, system: SYSTEM_MAAK, user, schema: SET_SCHEMA })
  const oudSet = new Set(oud.map(q => q.toLowerCase()))
  const schoon = (out.vragen || []).map(schoonVraag).filter(v => v && !oudSet.has(v.beg.q.toLowerCase()))
  const { goed, afgekeurd } = await controleer(client, schoon, `Onderwerp: ${t.titel}`)
  return { vragen: goed.slice(0, PER_WEEK), afgekeurd, gemaakt: (out.vragen || []).length, schoon: schoon.length }
}

// ── Vraag van de dag uit het nieuws ───────────────────────────────────────
function recenteArtikelen(dir, nu, dagen = 3, max = 6) {
  const matter = require('gray-matter')
  const grens = nu.getTime() - dagen * 86400000
  return fs.readdirSync(dir).filter(f => f.endsWith('.md'))
    .map(f => {
      const m = matter(fs.readFileSync(path.join(dir, f), 'utf8'))
      return { slug: f.replace(/\.md$/, ''), titel: m.data.title, datum: m.data.publishedAt, kernpunten: m.data.kernpunten || [], body: m.content.trim() }
    })
    .filter(a => a.titel && a.datum && new Date(a.datum).getTime() >= grens && new Date(a.datum).getTime() <= nu.getTime() && a.body.length > 400)
    .sort((a, b) => new Date(b.datum) - new Date(a.datum))
    .slice(0, max)
}

async function maakDagvraag(client, artikelen) {
  const user = [
    'Hieronder staan de nieuwste artikelen van de site. Kies het artikel waar de leukste leerzame vraag over te maken is.',
    'Schrijf daarover één quizvraag op drie niveaus. Het juiste antwoord moet in het artikel staan of er rechtstreeks uit volgen; de uitleg mag één gevestigd achtergrondfeit toevoegen.',
    'Vraag naar het idee of de natuurkunde achter het nieuws, niet naar een datum of een naam die je alleen weet als je het artikel uit je hoofd kent.',
    '',
    ...artikelen.map(a => `### slug: ${a.slug}\nTitel: ${a.titel}\n${a.body.slice(0, 5000)}`),
  ].join('\n')
  const out = await vraagClaude(client, { model: MODEL_MAAK, system: SYSTEM_MAAK, user, schema: DAG_SCHEMA })
  const art = artikelen.find(a => a.slug === out.slug)
  if (!art) throw new Error(`onbekend artikel '${out.slug}'`)
  const v = schoonVraag(out.vraag)
  if (!v) throw new Error('vraag haalt de mechanische controle niet')
  const { goed, afgekeurd } = await controleer(client, [v], `Bronartikel "${art.titel}":\n${art.body.slice(0, 5000)}`)
  if (!goed.length) throw new Error(`afgekeurd: ${afgekeurd[0]?.reden}`)
  return { slug: art.slug, titel: art.titel, ...goed[0] }
}

// ── Hoofdprogramma ────────────────────────────────────────────────────────
function lees(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return { versie: 1, onderwerpen: {}, dagvragen: [] } }
}

async function main({
  client = new Anthropic({ maxRetries: 4 }), nu = new Date(), file = QUIZ_PATH, dir = ARTICLES_DIR,
  forceerWeek = false, forceerDag = false, dryRun = false, edu = EDU_PATH,
} = {}) {
  const quiz = lees(file)
  quiz.onderwerpen ||= {}
  quiz.dagvragen ||= []
  const week = isoWeek(nu)
  const vandaag = dagStr(nu)
  const stats = { week, vernieuwd: [], behouden: [], dagvraag: null, fouten: [] }

  for (const t of onderwerpen(edu)) {
    const huidig = quiz.onderwerpen[t.id]
    if (huidig?.week === week && !forceerWeek) continue
    try {
      const r = await maakWeekset(client, t, (huidig?.vragen || []).map(v => v.beg.q))
      console.log(`${t.id}: ${r.gemaakt} gemaakt, ${r.schoon} door de vormcontrole, ${r.vragen.length} goedgekeurd`)
      for (const a of r.afgekeurd) console.log(`  ✗ ${a.q} — ${a.reden}`)
      if (r.vragen.length < MIN_PER_WEEK) throw new Error(`maar ${r.vragen.length} goedgekeurde vragen`)
      quiz.onderwerpen[t.id] = { week, vragen: r.vragen.map((v, i) => ({ id: `${week}-${t.id}-${i + 1}`, ...v })) }
      stats.vernieuwd.push(t.id)
    } catch (e) {
      stats.behouden.push(t.id)
      stats.fouten.push(`${t.id}: ${e.message}`)
      console.log(`::warning title=Quiz ${t.id} niet vernieuwd::${String(e.message).slice(0, 200)} — vorige set blijft staan`)
    }
  }

  if (forceerDag || !quiz.dagvragen.some(d => d.datum === vandaag)) {
    const artikelen = recenteArtikelen(dir, nu)
    if (!artikelen.length) {
      console.log('Geen artikelen van de afgelopen drie dagen: geen nieuwe vraag van de dag')
    } else {
      try {
        const d = await maakDagvraag(client, artikelen)
        quiz.dagvragen = [{ datum: vandaag, ...d }, ...quiz.dagvragen.filter(x => x.datum !== vandaag)].slice(0, DAGVRAGEN_BEWAARD)
        stats.dagvraag = d.slug
        console.log(`Vraag van de dag (${vandaag}): ${d.beg.q} — uit ${d.slug}`)
      } catch (e) {
        stats.fouten.push(`dagvraag: ${e.message}`)
        console.log(`::warning title=Geen vraag van de dag::${String(e.message).slice(0, 200)}`)
      }
    }
  }

  quiz.versie = 1
  quiz.bijgewerkt = nu.toISOString()
  if (!dryRun && (stats.vernieuwd.length || stats.dagvraag)) fs.writeFileSync(file, JSON.stringify(quiz, null, 2) + '\n')
  return stats
}

module.exports = { isoWeek, schoonNiveau, schoonVraag, schud, onderwerpen, recenteArtikelen, controleer, main, PER_WEEK, MIN_PER_WEEK }

if (require.main === module) {
  if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY ontbreekt'); process.exit(1) }
  main({
    forceerWeek: process.argv.includes('--week'),
    forceerDag: process.argv.includes('--dag'),
    dryRun: process.argv.includes('--dry-run'),
  }).then(s => {
    console.log(`Week ${s.week}: vernieuwd ${s.vernieuwd.join(', ') || '—'}; behouden ${s.behouden.join(', ') || '—'}; dagvraag ${s.dagvraag || '—'}`)
    // Alles mislukt (bijv. de API is onbereikbaar): de run wordt rood, zodat het opvalt.
    if (s.fouten.length && !s.vernieuwd.length && !s.dagvraag) process.exit(1)
  }).catch(e => { console.error(e); process.exit(1) })
}
