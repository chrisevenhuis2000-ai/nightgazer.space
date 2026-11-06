#!/usr/bin/env node
// scripts/nieuws-vernieuw.js
// Eenmalig (november 2026): elk bestaand artikel opnieuw schrijven volgens
// de werkwijze van de nieuwsbot sinds november 2026 (scripts/nieuws-herschrijf.js):
//   - vanuit de oorspronkelijke bron, met een eigen opbouw en een eigen
//     sectie "Wat betekent dit?";
//   - artikelen van SpaceNews, SpaceflightNow en The Planetary Society zijn
//     een tip: de oorspronkelijke bron waar hun artikel naar linkt wordt de
//     bron. Is die er niet, of is het bericht niet relevant, dan verdwijnt
//     het artikel (slug in scripts/__fixtures__/verwijderde-artikelen.txt en
//     een 301 naar /nieuws/ in public/_redirects);
//   - beelden alleen van NASA, ESA of Pexels; andere beelden gaan eruit en
//     backfill-images.js zoekt een vrij beeld.
// Slug, datum, categorie en tags blijven. Een vernieuwd artikel krijgt
// `vernieuwd:` in de frontmatter en wordt bij een volgende run overgeslagen
// (net als artikelen die de nieuwe nieuwsbot al schreef),
// dus opnieuw draaien kan. Een API-fout laat het artikel zoals het was.
//
//   node scripts/nieuws-vernieuw.js [--limit N] [--slug x] [--dry-run]
// Schrijft het aantal nog te doen artikelen naar $VERNIEUW_OVER_PAD (voor de
// workflow die in porties werkt en tussendoor commit).

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const N = require('./nieuws-herschrijf')

const ROOT = path.join(__dirname, '..')
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles')
const VERWIJDERD_PAD = path.join(__dirname, '__fixtures__', 'verwijderde-artikelen.txt')
const REDIRECTS_PAD = path.join(ROOT, 'public', '_redirects')
const GELIJKTIJDIG = 4
const TIPBRONNEN = new Set(['SpaceNews', 'SpaceflightNow', 'The Planetary Society'])
const TIPHOSTS = /(^|\.)(spacenews\.com|spaceflightnow\.com|planetary\.org)$/

const arg = (naam, std = null) => { const i = process.argv.indexOf(naam); return i > -1 ? process.argv[i + 1] : std }
const LIMIT = parseInt(arg('--limit', '0'), 10) || 0
const SLUG = arg('--slug')
const DROOG = process.argv.includes('--dry-run')

const hostVan = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, '') } catch { return '' } }
const vandaag = () => new Date().toISOString().slice(0, 10)
const yaml = s => String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')
const melding = s => String(s).replace(/\r?\n/g, ' ').replace(/::/g, ': :')

/** Is dit artikel een tip (de bron is een nieuwssite)? */
function isTip(fm) {
  return TIPBRONNEN.has(String(fm.source || '')) || TIPHOSTS.test(hostVan(fm.sourceUrl))
}

/** De Engelse brontitel, uit de slug (die komt van de oorspronkelijke titel). */
const titelUitSlug = slug => slug.replace(/^\d{4}-[a-z]+-\d{1,2}-/, '').replace(/-/g, ' ')

/** Het nieuwe bestand. Alleen velden die lib/article-data.ts leest. */
function bouw(fm, r, extra) {
  const regels = [
    `title: "${yaml(r.title)}"`,
    `excerpt: "${yaml(r.excerpt)}"`,
    `category: "${yaml(fm.category || 'missies')}"`,
    'author: "Redactie NightGazer"',
    `publishedAt: "${yaml(fm.publishedAt instanceof Date ? fm.publishedAt.toISOString() : fm.publishedAt || '')}"`,
    `featured: ${fm.featured === true || fm.featured === 'true' ? 'true' : 'false'}`,
    `tags: ${JSON.stringify(Array.isArray(fm.tags) ? fm.tags : [])}`,
    `source: "${yaml(extra.source)}"`,
    `sourceUrl: "${yaml(extra.sourceUrl)}"`,
    ...(extra.tipSource ? [`tipSource: "${yaml(extra.tipSource)}"`, `tipUrl: "${yaml(extra.tipUrl)}"`] : []),
    `imageUrl: "${yaml(extra.imageUrl)}"`,
    `imageAlt: "${yaml(extra.imageUrl ? r.title : '')}"`,
    `imageCredit: "${yaml(extra.imageUrl ? extra.imageCredit : '')}"`,
    `vernieuwd: "${vandaag()}"`,
  ]
  return `---\n${regels.join('\n')}\n${N.structuurFrontmatter(r)}---\n\n${r.body}\n`
}

/** Een handgeschreven artikel (zonder bron): alleen de auteur rechtzetten. */
function alleenAuteur(raw) {
  return raw
    .replace(/^author: .*$/m, 'author: "Redactie NightGazer"')
    .replace(/^---\n/, `---\nvernieuwd: "${vandaag()}"\n`)
}

/**
 * Eén artikel. → { soort: 'vernieuwd' | 'verwijderd' | 'auteur' | 'fout', reden? }
 * `deps` alleen voor de tests: client, fetchPagina, ogBeeld.
 */
async function vernieuw(slug, raw, deps) {
  const { data: fm, content } = matter(raw)
  if (!fm.sourceUrl) return { soort: 'auteur', raw: alleenAuteur(raw) }

  const tip = isTip(fm)
  let bron
  if (tip) {
    const p = await N.primaireBron(fm.sourceUrl, deps.fetchPagina)
    if (!p.ok) return { soort: 'verwijderd', reden: `tip zonder oorspronkelijke bron: ${p.reden}` }
    bron = { tekst: p.tekst, naam: p.naam, url: p.url }
  } else {
    let tekst = ''
    try { tekst = N.brontekstUitHtml(await deps.fetchPagina(fm.sourceUrl)) } catch { /* bestaande tekst */ }
    // Pagina weg of te kort: de bestaande Nederlandse versie van deze vrije
    // bron (NASA, ESA) is dan de brontekst.
    if (N.woorden(tekst) < N.MIN_WOORDEN_BRON) tekst = content.trim()
    bron = { tekst: tekst.slice(0, 30000), naam: fm.source || N.bronNaam(fm.sourceUrl), url: fm.sourceUrl }
  }

  const r = await N.herschrijf(deps.client, {
    titel: titelUitSlug(slug), tekst: bron.tekst, bron: bron.naam, bronUrl: bron.url,
    tip: tip ? { bron: fm.source || hostVan(fm.sourceUrl), titel: titelUitSlug(slug) } : null,
  })
  if (!r.ok) return r.nietRelevant ? { soort: 'verwijderd', reden: r.reden } : { soort: 'fout', reden: r.reden }

  // Beeld: een vrij beeld blijft; anders het og:image van een vrije bron, of leeg.
  let imageUrl = '', imageCredit = ''
  if (fm.imageUrl && N.isVrijBeeld(fm.imageUrl)) { imageUrl = fm.imageUrl; imageCredit = fm.imageCredit || bron.naam }
  else if (N.isVrijeBron(bron.url)) {
    const og = await deps.ogBeeld(bron.url)
    if (og && N.isVrijBeeld(og)) { imageUrl = og; imageCredit = bron.naam }
  }

  return {
    soort: 'vernieuwd',
    raw: bouw(fm, r.data, {
      source: bron.naam, sourceUrl: bron.url,
      tipSource: tip ? (fm.source || hostVan(fm.sourceUrl)) : '', tipUrl: tip ? fm.sourceUrl : '',
      imageUrl, imageCredit,
    }),
  }
}

async function ogBeeld(url) {
  try {
    const html = await N.haalPagina(url)
    const m = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html) || /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html)
    if (!m) return null
    const u = new URL(m[1], url).toString()
    return /\.(jpe?g|png|webp)(\?|$)/i.test(new URL(u).pathname) ? u : null
  } catch { return null }
}

function verwijder(slug) {
  fs.unlinkSync(path.join(ARTICLES_DIR, `${slug}.md`))
  const lijst = fs.readFileSync(VERWIJDERD_PAD, 'utf-8')
  if (!lijst.split('\n').includes(slug)) fs.appendFileSync(VERWIJDERD_PAD, (lijst.endsWith('\n') ? '' : '\n') + slug + '\n')
  const regel = `/nieuws/${slug}/ /nieuws/ 301`
  const bestaand = fs.existsSync(REDIRECTS_PAD) ? fs.readFileSync(REDIRECTS_PAD, 'utf-8') : '# Verwijderde artikelen (scripts/nieuws-vernieuw.js) → het nieuwsarchief\n'
  if (!bestaand.includes(regel)) fs.writeFileSync(REDIRECTS_PAD, bestaand + (bestaand.endsWith('\n') ? '' : '\n') + regel + '\n')
}

async function main() {
  const alle = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3))
  // Overslaan: al vernieuwd, of al door de nieuwe nieuwsbot geschreven (die
  // eindigt altijd met "Wat betekent dit?").
  const open = alle.filter(s => {
    const t = fs.readFileSync(path.join(ARTICLES_DIR, `${s}.md`), 'utf-8')
    return !/^vernieuwd:/m.test(t.split('\n---')[0]) && !N.DUIDING.test(t)
  })
  let todo = SLUG ? open.filter(s => s === SLUG) : open
  if (LIMIT) todo = todo.slice(0, LIMIT)
  console.log(`📰 Vernieuwen: ${todo.length} van ${open.length} open artikelen${DROOG ? ' (droog)' : ''}`)

  if (!process.env.ANTHROPIC_API_KEY && !DROOG) throw new Error('ANTHROPIC_API_KEY ontbreekt')
  const deps = { client: DROOG ? null : N.maakClient(), fetchPagina: N.haalPagina, ogBeeld }
  const telling = { vernieuwd: 0, verwijderd: 0, auteur: 0, fout: 0 }
  const regels = []

  let i = 0
  async function werker() {
    while (i < todo.length) {
      const slug = todo[i++]
      const pad = path.join(ARTICLES_DIR, `${slug}.md`)
      const raw = fs.readFileSync(pad, 'utf-8')
      if (DROOG) {
        const { data } = matter(raw)
        console.log(`  · ${slug}: ${!data.sourceUrl ? 'alleen auteur' : isTip(data) ? `tip (${data.source})` : `vrije bron (${data.source})`}`)
        continue
      }
      let u
      try { u = await vernieuw(slug, raw, deps) } catch (e) { u = { soort: 'fout', reden: String(e.message || e).slice(0, 200) } }
      telling[u.soort]++
      if (u.soort === 'vernieuwd' || u.soort === 'auteur') fs.writeFileSync(pad, u.raw)
      if (u.soort === 'verwijderd') verwijder(slug)
      const r = `${u.soort}: ${slug}${u.reden ? ` — ${u.reden}` : ''}`
      regels.push(r)
      console.log(u.soort === 'fout' ? `::warning title=Niet vernieuwd::${melding(r)}` : `  ${r}`)
    }
  }
  await Promise.all(Array.from({ length: GELIJKTIJDIG }, werker))

  const over = open.length - (DROOG ? 0 : telling.vernieuwd + telling.verwijderd + telling.auteur)
  const kop = `Vernieuwd: ${telling.vernieuwd} · verwijderd: ${telling.verwijderd} · alleen auteur: ${telling.auteur} · fout: ${telling.fout} · nog open: ${over}`
  console.log('\n' + kop)
  if (process.env.VERNIEUW_OVER_PAD) fs.writeFileSync(process.env.VERNIEUW_OVER_PAD, String(telling.fout && over === telling.fout ? 0 : over))
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Nieuws vernieuwen\n\n${kop}\n\n${regels.map(r => `- ${r}`).join('\n')}\n\n`)
}

module.exports = { vernieuw, isTip, titelUitSlug, bouw }

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1) })
}
