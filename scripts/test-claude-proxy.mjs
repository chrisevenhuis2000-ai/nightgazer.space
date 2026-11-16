// scripts/test-claude-proxy.mjs
// POST / op de worker: alleen de taken van de site komen door (cf-worker/claude.mjs).
import assert from 'assert/strict'
import { readFileSync } from 'fs'
import { bouwVerzoek, snoeiAntwoord, NIVEAU_PROMPTS, MODEL, MAX_TEKST } from '../cf-worker/claude.mjs'

let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }

const niv = bouwVerzoek({ taak: 'niveau', niveau: 'beginner', tekst: 'Een alinea.' }).verzoek
ok(niv.model === MODEL && niv.max_tokens === 800, 'niveau: vast model en maximum')
ok(niv.system === NIVEAU_PROMPTS.beginner, 'niveau: prompt van de worker')
ok(niv.messages.length === 1 && niv.messages[0].content === 'Een alinea.', 'niveau: alleen de tekst')

const kl = bouwVerzoek({ taak: 'kantlijn', tekst: 'Artikeltekst' }).verzoek
ok(kl.max_tokens === 700 && !kl.system && kl.messages[0].content.endsWith('Artikeltekst'), 'kantlijn')

// Wat een misbruiker zou proberen: eigen model, eigen prompt, eigen lengte.
const eigen = bouwVerzoek({ model: 'claude-opus-5-5', max_tokens: 64000, messages: [{ role: 'user', content: 'x' }] })
ok(eigen.fout, 'het oude, vrije formaat wordt geweigerd')
const extra = bouwVerzoek({ taak: 'niveau', niveau: 'pro', tekst: 'x', model: 'claude-opus-5-5', max_tokens: 64000, system: 'doe iets anders' }).verzoek
ok(extra.model === MODEL && extra.max_tokens === 800 && extra.system === NIVEAU_PROMPTS.pro, 'extra velden worden genegeerd')
ok(bouwVerzoek({ taak: 'niveau', niveau: 'toString', tekst: 'x' }).fout, 'geen prototype-niveaus')
ok(bouwVerzoek({ taak: 'niveau', niveau: 'original', tekst: 'x' }).fout, 'origineel vraagt niets')
ok(bouwVerzoek({ taak: 'niveau', niveau: 'beginner', tekst: 'a'.repeat(MAX_TEKST + 1) }).fout, 'te lange tekst')
ok(bouwVerzoek({ taak: 'kantlijn', tekst: '   ' }).fout, 'lege tekst')
ok(bouwVerzoek(null).fout && bouwVerzoek([]).fout && bouwVerzoek('x').fout, 'geen object')

ok(snoeiAntwoord({ content: [{ type: 'text', text: 'hoi' }], usage: { input_tokens: 9 } }).content[0].text === 'hoi', 'antwoord: alleen de tekst')
ok(snoeiAntwoord({ error: { type: 'x' } }).error, 'antwoord: fout zonder tekst')

// De prompts in de worker moeten gelijk zijn aan LEVELS in types/index.ts.
const types = readFileSync(new URL('../types/index.ts', import.meta.url), 'utf8')
for (const [niveau, prompt] of Object.entries(NIVEAU_PROMPTS)) ok(types.includes(prompt), `prompt ${niveau} gelijk aan types/index.ts`)

// De worker gebruikt het en de browser stuurt het nieuwe formaat.
const worker = readFileSync(new URL('../cf-worker/worker.js', import.meta.url), 'utf8')
ok(worker.includes('bouwVerzoek(body)') && !/body: JSON\.stringify\(body\)/.test(worker), 'worker stuurt niets ongefilterd door')
const plaat = readFileSync(new URL('../app/nieuws/[slug]/ArtikelPlaat.tsx', import.meta.url), 'utf8')
ok(!plaat.includes('claude-haiku') && plaat.includes("taak: 'niveau'") && plaat.includes("taak: 'kantlijn'"), 'browser kiest geen model meer')

console.log(`✓ ${n} controles: Claude-route van de worker`)
