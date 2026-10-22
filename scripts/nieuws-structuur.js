#!/usr/bin/env node
// scripts/nieuws-structuur.js
// Eenmalig: geef bestaande artikelen dezelfde structuur als nieuwe.
//
// Sinds oktober 2026 schrijft de nieuwsbot elk artikel met tussenkoppen,
// kernpunten, kerncijfers en hooguit één citaat (scripts/nieuws-herschrijf.js).
// De artikelen van daarvoor zijn één blok alinea's. Dit script vraagt Claude
// per artikel om die structuur, op basis van de bestaande Nederlandse tekst:
//   - de alinea's zelf veranderen niet: Claude geeft alleen koppen met het
//     alineanummer waar ze vóór komen, en dit script voegt ze in;
//   - kerncijfers en citaat gaan door dezelfde controle als bij nieuwe
//     artikelen (N.structuur): alleen wat letterlijk in de tekst staat.
// Artikelen die al kernpunten hebben, of niet Nederlands zijn, worden
// overgeslagen. Draait opnieuw zonder dubbel werk.
//
//   node scripts/nieuws-structuur.js [--limit N] [--dry-run] [--slug x]
// Te testen zonder netwerk: scripts/test-nieuws-structuur.js.

const fs = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')
const N = require('./nieuws-herschrijf')

const MODEL = 'claude-sonnet-5-5'
const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles')
const GELIJKTIJDIG = 4

const SCHEMA = {
  type: 'object',
  properties: {
    koppen: {
      type: 'array',
      description: 'Tussenkoppen om de twee à drie alinea’s; nooit vóór alinea 1',
      items: {
        type: 'object',
        properties: {
          voorAlinea: { type: 'integer', description: 'Nummer van de alinea waar de kop boven komt (2 of hoger)' },
          tekst:      { type: 'string', description: 'Korte, informatieve kop, 2 tot 7 woorden, zonder punt' },
        },
        required: ['voorAlinea', 'tekst'],
        additionalProperties: false,
      },
    },
    kernpunten:  N.SCHEMA.properties.kernpunten,
    kerncijfers: N.SCHEMA.properties.kerncijfers,
    citaat:      N.SCHEMA.properties.citaat,
  },
  required: ['koppen', 'kernpunten', 'kerncijfers', 'citaat'],
  additionalProperties: false,
}

const SYSTEM = [
  'Je bent eindredacteur van NightGazer, een Nederlandstalige astronomie- en ruimtevaartsite.',
  'Je krijgt een bestaand Nederlands artikel met genummerde alinea’s. Herschrijf niets: je maakt het alleen scanbaar.',
  'Geef tussenkoppen om de twee à drie alinea’s (bij 4 alinea’s één of twee, bij 7 alinea’s twee of drie), met het nummer van de alinea waar de kop boven komt. Nooit vóór alinea 1, geen koppen als "Inleiding" of "Conclusie".',
  'Geef drie kernpunten: korte zinnen met de kern van het artikel. Gebruik alleen feiten uit het artikel.',
  'Geef hooguit drie kerncijfers die letterlijk in het artikel staan, en hooguit één citaat van een persoon dat letterlijk in het artikel staat (anders null).',
].join(' ')

// ── Bestand ───────────────────────────────────────────────────────────────
function splits(raw) {
  const m = raw.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  return m ? { fm: m[1], body: m[2] } : null
}
const alineas = body => body.split(/\n\n+/).map(p => p.trim()).filter(Boolean)

/**
 * Koppen invoegen vóór de genoemde alinea's (1-geteld). Alleen alinea 2..n,
 * geen twee koppen op dezelfde plek, niet als er al een kop staat.
 */
function koppenInvoegen(body, koppen) {
  const delen = alineas(body)
  const bij = new Map()
  for (const k of koppen || []) {
    const i = Number(k?.voorAlinea)
    const t = String(k?.tekst || '').replace(/^#+\s*/, '').replace(/[.:]\s*$/, '').replace(/\s+/g, ' ').trim()
    if (!Number.isInteger(i) || i < 2 || i > delen.length || !t || bij.has(i)) continue
    if (delen[i - 2]?.startsWith('#') || delen[i - 1]?.startsWith('#')) continue
    bij.set(i, t)
  }
  return delen.map((p, j) => bij.has(j + 1) ? `## ${bij.get(j + 1)}\n\n${p}` : p).join('\n\n') + '\n'
}

/** Het bijgewerkte bestand, of null als het artikel al structuur heeft. */
function bijwerken(raw, out) {
  const d = splits(raw)
  if (!d || /^kernpunten:/m.test(d.fm)) return null
  const body = koppenInvoegen(d.body, out.koppen)
  const s = N.structuur(out, body)
  if (!s.kernpunten.length) return null
  return `---\n${d.fm}\n${N.structuurFrontmatter(s)}---\n\n${body}`
}

// ── Claude ────────────────────────────────────────────────────────────────
async function vraag(client, titel, body) {
  const genummerd = alineas(body).map((p, i) => `[${i + 1}] ${p}`).join('\n\n')
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: `Titel: ${titel}\n\n${genummerd}` }],
  })
  if (res.stop_reason !== 'end_turn') throw new Error(`stop_reason ${res.stop_reason}`)
  const tekst = (res.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
  return JSON.parse(tekst)
}

// ── Hoofdprogramma ────────────────────────────────────────────────────────
async function main({ dir = ARTICLES_DIR, client = new Anthropic({ maxRetries: 4 }), limit = Infinity, dryRun = false, slug = null } = {}) {
  const kandidaten = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
    .filter(f => !slug || f === `${slug}.md`)
    .filter(f => {
      const d = splits(fs.readFileSync(path.join(dir, f), 'utf8'))
      return d && !/^kernpunten:/m.test(d.fm) && N.isNederlands(d.body) && alineas(d.body).length >= 2
    })
    .slice(0, limit)

  const stats = { kandidaten: kandidaten.length, bijgewerkt: 0, mislukt: 0 }
  console.log(`${kandidaten.length} artikelen zonder structuur${dryRun ? ' (dry-run)' : ''}`)
  let volgende = 0
  const werker = async () => {
    while (volgende < kandidaten.length) {
      const f = kandidaten[volgende++]
      const pad = path.join(dir, f)
      const raw = fs.readFileSync(pad, 'utf8')
      const titel = (/^title:\s*"?(.*?)"?\s*$/m.exec(splits(raw).fm) || [])[1] || f
      try {
        const nieuw = bijwerken(raw, await vraag(client, titel, splits(raw).body))
        if (!nieuw) throw new Error('geen bruikbare kernpunten')
        if (!dryRun) fs.writeFileSync(pad, nieuw)
        stats.bijgewerkt++
        console.log(`✓ ${f}`)
      } catch (e) {
        stats.mislukt++
        console.log(`::warning title=Niet bijgewerkt::${f} — ${String(e.message || e).slice(0, 200)}`)
      }
    }
  }
  await Promise.all(Array.from({ length: GELIJKTIJDIG }, werker))
  console.log(`Bijgewerkt: ${stats.bijgewerkt} / mislukt: ${stats.mislukt}`)
  return stats
}

module.exports = { SCHEMA, SYSTEM, MODEL, koppenInvoegen, bijwerken, main }

if (require.main === module) {
  const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null }
  if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY ontbreekt'); process.exit(1) }
  main({ limit: Number(arg('--limit')) || Infinity, dryRun: process.argv.includes('--dry-run'), slug: arg('--slug') })
    .then(s => { if (s.mislukt > s.bijgewerkt) process.exit(1) })
    .catch(e => { console.error(e); process.exit(1) })
}
