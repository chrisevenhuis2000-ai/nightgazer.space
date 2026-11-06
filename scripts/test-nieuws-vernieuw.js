// scripts/test-nieuws-vernieuw.js
// De eenmalige herschrijfronde (scripts/nieuws-vernieuw.js), met een
// nagebootste Claude en een nagebootst web:
//   1. Vrije bron (NASA) die niet bereikbaar is: de bestaande tekst is de
//      brontekst, het NASA-beeld blijft, de auteur wordt Redactie NightGazer.
//   2. SpaceNews-tip met een link naar NASA: NASA wordt de bron, SpaceNews de
//      tip, het SpaceNews-beeld gaat eruit en het og:image van NASA komt erin.
//      De tekst van de tip gaat niet naar Claude.
//   3. Tip zonder oorspronkelijke bron, of een niet-relevant bericht: verwijderd.
//   4. API-fout: 'fout', het bestand blijft zoals het was.
//   5. Handgeschreven artikel zonder bron: alleen de auteur.

const assert = require('assert/strict')
const matter = require('gray-matter')
const V = require('./nieuws-vernieuw')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }

const ZIN = 'De ruimtesonde heeft deze week de eerste metingen naar de aarde gestuurd, en volgens het team zijn die van uitstekende kwaliteit voor het onderzoek.'
const nl = n => { const u = []; while (u.join(' ').split(/\s+/).length < n) u.push(ZIN); return u.join(' ') }
const EN = 'The spacecraft has sent its first measurements back to Earth this week, and according to the team they are of excellent quality and will be used for years.'
const en = n => { const u = []; while (u.join(' ').split(/\s+/).length < n) u.push(EN); return u.join(' ') }
const TIPMERK = 'UNIEKTIPZINNETJE'

const antwoord = {
  relevant: true, relevantie: 'Ruimtevaart.', title: 'De sonde stuurt de eerste metingen',
  excerpt: 'De sonde heeft de eerste metingen naar de aarde gestuurd. Die zijn van goede kwaliteit.',
  body: `${nl(170)}\n\n## Ijs rond de evenaar\n\n${nl(110)}\n\n## Wat betekent dit?\n\n${nl(50)}`,
  kernpunten: ['De sonde stuurde de eerste metingen.', 'De gegevens zijn goed.', 'Het ijs wordt in kaart gebracht.'],
  kerncijfers: [], citaat: null,
}

const verzoeken = []
const client = {
  beta: { messages: { create: async req => {
    verzoeken.push(req)
    const inhoud = req.messages[0].content
    if (/APIFOUT/.test(inhoud)) throw new Error('kapot')
    const data = /ORKAAN/.test(inhoud) ? { relevant: false, relevantie: 'Gaat over een orkaan.', title: '', excerpt: '', body: '' } : antwoord
    return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(data) }] }
  } } },
}

const PAGINAS = {
  'https://spacenews.com/probe-data/': `<html><article><p>${TIPMERK} ${en(300)}</p><p>Read the <a href="https://www.nasa.gov/news-release/probe-data/">NASA release</a> for more.</p></article></html>`,
  'https://www.nasa.gov/news-release/probe-data/': `<html><article><p>${en(320)}</p></article></html>`,
  'https://spacenews.com/zonder-bron/': `<html><article><p>${en(300)}</p><p>Zie <a href="https://spacenews.com/ander-artikel/">ook</a>.</p></article></html>`,
}
const deps = {
  client,
  fetchPagina: async url => { if (PAGINAS[url]) return PAGINAS[url]; throw new Error('404') },
  ogBeeld: async url => url.includes('nasa.gov') ? 'https://www.nasa.gov/wp-content/uploads/probe.jpg' : null,
}

const art = (fm, body = nl(220)) => `---\n${Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n${body}\n`

;(async () => {
  // ── 1. Vrije bron, pagina weg ─────────────────────────────────────────────
  let u = await V.vernieuw('2026-october-20-probe-sends-data', art({
    title: 'Oud', category: 'missies', author: 'Redactie CosmosNL', publishedAt: '2026-10-20T08:00:00.000Z', tags: ['nasa', 'sonde'],
    source: 'NASA', sourceUrl: 'https://www.nasa.gov/weg/', imageUrl: 'https://www.nasa.gov/beeld.jpg', imageCredit: 'NASA',
  }), deps)
  eq(u.soort, 'vernieuwd', 'vrije bron: vernieuwd')
  let { data: fm, content } = matter(u.raw)
  eq(fm.author, 'Redactie NightGazer', 'auteur rechtgezet')
  eq(fm.title, antwoord.title, 'nieuwe titel')
  eq(fm.tags, ['nasa', 'sonde'], 'tags blijven')
  eq(fm.publishedAt, '2026-10-20T08:00:00.000Z', 'datum blijft')
  eq(fm.imageUrl, 'https://www.nasa.gov/beeld.jpg', 'vrij beeld blijft')
  ok(/^\d{4}-\d{2}-\d{2}$/.test(fm.vernieuwd), 'vernieuwd-datum gezet')
  ok(!fm.tipSource, 'geen tip')
  ok(/## Wat betekent dit\?/.test(content), 'duiding in de tekst')
  ok(Array.isArray(fm.kernpunten) && fm.kernpunten.length === 3, 'kernpunten in de frontmatter')
  ok(verzoeken.at(-1).messages[0].content.includes(ZIN), 'bestaande tekst als brontekst')
  eq(verzoeken.at(-1).messages[0].content.match(/Oorspronkelijke titel: (.*)/)[1], 'probe sends data', 'titel uit de slug')

  // ── 2. SpaceNews-tip met NASA-bron ───────────────────────────────────────
  u = await V.vernieuw('2026-october-21-probe-data', art({
    title: 'Oud', category: 'missies', author: 'Redactie CosmosNL', publishedAt: '2026-10-21T08:00:00.000Z', tags: [],
    source: 'SpaceNews', sourceUrl: 'https://spacenews.com/probe-data/', imageUrl: 'https://i0.wp.com/spacenews.com/foto.jpg', imageCredit: 'SpaceNews',
  }), deps)
  eq(u.soort, 'vernieuwd', 'tip: vernieuwd')
  fm = matter(u.raw).data
  eq(fm.source, 'NASA', 'NASA is de bron')
  eq(fm.sourceUrl, 'https://www.nasa.gov/news-release/probe-data/', 'bron-URL van NASA')
  eq(fm.tipSource, 'SpaceNews', 'SpaceNews is de tip')
  eq(fm.tipUrl, 'https://spacenews.com/probe-data/', 'tip-URL')
  eq(fm.imageUrl, 'https://www.nasa.gov/wp-content/uploads/probe.jpg', 'SpaceNews-beeld vervangen door NASA-beeld')
  ok(!u.raw.includes('spacenews.com/foto'), 'geen SpaceNews-beeld meer')
  ok(!verzoeken.at(-1).messages[0].content.includes(TIPMERK), 'tiptekst niet naar Claude')
  ok(/Aanleiding \(alleen een tip/.test(verzoeken.at(-1).messages[0].content), 'tip als aanleiding genoemd')

  // ── 3. Verwijderen ───────────────────────────────────────────────────────
  u = await V.vernieuw('2026-october-22-zonder-bron', art({ title: 'Oud', source: 'SpaceNews', sourceUrl: 'https://spacenews.com/zonder-bron/' }), deps)
  eq(u.soort, 'verwijderd', 'tip zonder bron: verwijderd')
  ok(/oorspronkelijke bron/.test(u.reden), 'reden genoemd')
  const n0 = verzoeken.length
  u = await V.vernieuw('2026-october-22-x', art({ title: 'Oud', source: 'SpaceflightNow', sourceUrl: 'https://spaceflightnow.com/weg/' }), deps)
  eq(u.soort, 'verwijderd', 'onbereikbare tip: verwijderd')
  eq(verzoeken.length, n0, 'geen Claude-aanroep zonder bron')
  u = await V.vernieuw('2026-october-23-ORKAAN', art({ title: 'Oud', source: 'NASA', sourceUrl: 'https://www.nasa.gov/weg/' }), deps)
  eq(u.soort, 'verwijderd', 'niet relevant: verwijderd')

  // ── 4. API-fout ──────────────────────────────────────────────────────────
  u = await V.vernieuw('2026-october-24-APIFOUT', art({ title: 'Oud', source: 'ESA', sourceUrl: 'https://www.esa.int/weg/' }), deps)
  eq(u.soort, 'fout', 'API-fout: fout')
  ok(!u.raw, 'geen nieuwe inhoud bij een fout')

  // ── 5. Zonder bron ───────────────────────────────────────────────────────
  u = await V.vernieuw('eigen-stuk', art({ title: 'Eigen', author: 'Dr. Mara Visser' }), deps)
  eq(u.soort, 'auteur', 'zonder bron: alleen auteur')
  fm = matter(u.raw).data
  eq(fm.author, 'Redactie NightGazer', 'auteur rechtgezet')
  eq(fm.title, 'Eigen', 'titel blijft')
  ok(fm.vernieuwd, 'vernieuwd gezet')

  // ── isTip / titelUitSlug ─────────────────────────────────────────────────
  ok(V.isTip({ source: 'The Planetary Society' }), 'Planetary Society is een tip')
  ok(V.isTip({ sourceUrl: 'https://www.spaceflightnow.com/x' }), 'host telt ook')
  ok(!V.isTip({ source: 'NASA', sourceUrl: 'https://www.nasa.gov/x' }), 'NASA is geen tip')
  eq(V.titelUitSlug('2026-november-3-esa-launches-probe'), 'esa launches probe', 'datum uit de slug')

  console.log(`✓ test-nieuws-vernieuw: ${checks} checks`)
})().catch(e => { console.error(e); process.exit(1) })
