// ── Welke hosts /image-proxy mag ophalen ────────────────────────────────────
// Zonder lijst was /image-proxy een open proxy voor elke URL. Dit zijn de
// hosts die de site echt gebruikt (inventaris oktober 2026; zie
// scripts/test-beeldhosts.js, die elke artikel- en missie-afbeelding tegen
// deze lijst houdt):
//
//   artikelen (RSS / og:image)  i0.wp.com, images-assets.nasa.gov,
//                               assets.science.nasa.gov, www.nasa.gov,
//                               www.esa.int, spacenews.com, science.nasa.gov
//   overige RSS-bronnen         spaceflightnow.com, www.jpl.nasa.gov,
//   (scripts/fetch-articles.js) www.planetary.org, i1–i3.wp.com (Jetpack-CDN
//                               naast i0, zelfde WordPress-sites)
//   APOD (cf-worker/apod.mjs)   assets.science.nasa.gov, apod.nasa.gov
//   /image-search               images-assets.nasa.gov, images.pexels.com
//   ISS-kaart (Instruments)     upload.wikimedia.org
//
// Komt er een nieuwe bron bij, zet de host dan hier en draai
// `npm run test:beeldhosts`.
export const BEELD_HOSTS = new Set([
  'assets.science.nasa.gov',
  'science.nasa.gov',
  'apod.nasa.gov',
  'images-assets.nasa.gov',
  'www.nasa.gov',
  'www.jpl.nasa.gov',
  'www.esa.int',
  'i0.wp.com', 'i1.wp.com', 'i2.wp.com', 'i3.wp.com',
  'spacenews.com',
  'spaceflightnow.com',
  'www.planetary.org',
  'images.pexels.com',
  'upload.wikimedia.org',
])

/** Mag /image-proxy deze URL ophalen? Alleen http(s), geen inloggegevens in
 *  de URL, en een host uit de lijst (exact, hoofdletterongevoelig). */
export function magBeeld(url) {
  let u
  try { u = new URL(url) } catch { return false }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
  if (u.username || u.password) return false
  return BEELD_HOSTS.has(u.hostname.toLowerCase())
}
