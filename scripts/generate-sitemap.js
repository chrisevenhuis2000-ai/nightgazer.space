const fs   = require('fs')
const path = require('path')

const DOMAIN       = 'https://nightgazer.space'
const ARTICLES_DIR = path.join(__dirname, '../content/articles')
const MISSIONS     = path.join(__dirname, '../content/missions.json')
const TOPICS_TS    = path.join(__dirname, '../lib/topics.ts')
const OUTPUT       = path.join(__dirname, '../public/sitemap.xml')

const today = new Date().toISOString().slice(0, 10)

// next.config.js zet trailingSlash: true — elke URL hier eindigt dus op '/',
// gelijk aan de canonicals op de pagina's zelf.
const url = p => (p.endsWith('/') ? p : `${p}/`)

// Static pages
const pages = [
  { loc: '/',              changefreq: 'daily',   priority: '1.0' },
  { loc: '/nieuws',        changefreq: 'daily',   priority: '0.9' },
  { loc: '/missies',       changefreq: 'weekly',  priority: '0.8' },
  { loc: '/sterrenkijken', changefreq: 'weekly',  priority: '0.7' },
  { loc: '/educatie',      changefreq: 'monthly', priority: '0.6' },
  { loc: '/over',          changefreq: 'yearly',  priority: '0.3' },
  { loc: '/contact',       changefreq: 'yearly',  priority: '0.3' },
  { loc: '/privacy',       changefreq: 'yearly',  priority: '0.2' },
]

// Topic pages — dezelfde slugs als generateStaticParams in
// app/nieuws/onderwerp/[category]/page.tsx (lib/topics.ts is TypeScript,
// dus de slugs worden uit de bron gelezen in plaats van gedupliceerd).
const topicSrc = fs.readFileSync(TOPICS_TS, 'utf8')
const topicSlugs = [...topicSrc.matchAll(/\{\s*slug:\s*'([^']+)'/g)].map(m => m[1])
if (!topicSlugs.length) throw new Error('generate-sitemap: geen onderwerpen gevonden in lib/topics.ts')
for (const slug of topicSlugs) {
  pages.push({ loc: `/nieuws/onderwerp/${slug}`, changefreq: 'daily', priority: '0.7' })
}

// Mission detail pages — alle missies, net als generateStaticParams in
// app/missies/[slug]/page.tsx.
const missionData = JSON.parse(fs.readFileSync(MISSIONS, 'utf8'))
const missions = Array.isArray(missionData) ? missionData : missionData.missions
for (const m of missions) {
  pages.push({ loc: `/missies/${m.id}`, changefreq: 'monthly', priority: '0.6' })
}

// Article pages
if (fs.existsSync(ARTICLES_DIR)) {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))
  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    pages.push({ loc: `/nieuws/${slug}`, changefreq: 'monthly', priority: '0.5' })
  }
}

// Build XML
const urls = pages.map(p => `  <url>
    <loc>${DOMAIN}${url(p.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

fs.writeFileSync(OUTPUT, xml)
console.log(`✓ Sitemap: ${pages.length} URLs → public/sitemap.xml`)
