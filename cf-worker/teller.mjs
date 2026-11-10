// ── Eigen bezoekersteller ──────────────────────────────────────────────────
//
// Cloudflare Web Analytics telt sinds 06-11-2026 ook Europese bezoekers, maar
// het beacon (static.cloudflareinsights.com) staat in elke adblocker en het
// telt geen gebeurtenissen: niemand ziet hoeveel mensen op "Zet meldingen
// aan" tikten en waar het daarna misging. Deze teller vult dat gat.
//
// Wat hij bewaart, per paginaweergave of gebeurtenis: het pad, de host van de
// verwijzer, het land (van Cloudflare, niet van het IP-adres zelf), het soort
// apparaat, de gebeurtenis en de utm_source. Geen IP-adres, geen cookie, geen
// id, niets op het apparaat van de bezoeker. Daardoor zijn er ook geen
// "unieke bezoekers"; een *bezoek* is een paginaweergave die van buiten de
// site komt (verwijzer is niet nightgazer.space). Dat is de eerlijke maat
// zonder iemand te volgen.
//
// Opslag: Workers Analytics Engine (binding TEL, dataset nightgazer_tel).
// Zonder binding doet /tel niets en antwoordt het gewoon 204.

export const TEL_DATASET = 'nightgazer_tel'

/** Gebeurtenissen die de site mag sturen. Alles daarbuiten wordt genegeerd. */
export const GEBEURTENISSEN = new Set([
  'push-staat',      // wat het meldingsblok liet zien (extra = de staat)
  'push-klik',       // tik op "Zet meldingen aan"
  'push-geweigerd',  // browser of bezoeker zei nee
  'push-aan',        // abonnement opgeslagen
  'push-fout',       // iets anders ging mis
  'push-uit',        // opgezegd
  'push-teaser',     // tik op het meldingen-blokje op /vandaag of de voorpagina
])

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|curl|wget|python|httpclient|axios|node-fetch|go-http|java\/|facebookexternalhit|embedly|monitor/i

export function isBot(ua) {
  return !ua || BOT.test(ua)
}

export function apparaat(ua) {
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobiel'
  return 'desktop'
}

/** Instagram-, Facebook- en TikTok-browsers: daar werkt push nooit. */
export function inAppBrowser(ua) {
  if (/Instagram/i.test(ua)) return 'instagram'
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return 'facebook'
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return 'tiktok'
  return ''
}

function kort(s, n) {
  return typeof s === 'string' ? s.slice(0, n) : ''
}

/**
 * Maakt van een binnengekomen meting één datapunt, of null als het geen
 * meting van een echte bezoeker op de echte site is.
 */
export function maakDatapunt(body, { ua, land, origin }) {
  if (isBot(ua)) return null
  if (origin && !/^https:\/\/(www\.)?nightgazer\.space$/.test(origin)) return null
  if (!body || typeof body !== 'object') return null

  const soort = body.t === 'ev' ? 'ev' : body.t === 'pv' ? 'pv' : null
  if (!soort) return null

  const pad = kort(body.p, 200)
  if (!pad.startsWith('/')) return null

  const gebeurtenis = soort === 'ev' ? kort(body.e, 40) : ''
  if (soort === 'ev' && !GEBEURTENISSEN.has(gebeurtenis)) return null

  const verwijzer = kort(body.r, 100).toLowerCase().replace(/^www\./, '')
  const vanBuiten = verwijzer !== 'nightgazer.space'

  return {
    indexes: [soort],
    blobs: [
      soort,                                     // blob1
      pad,                                       // blob2
      verwijzer,                                 // blob3
      kort(land, 2) || 'XX',                     // blob4
      apparaat(ua),                              // blob5
      gebeurtenis,                               // blob6
      kort(body.x, 40),                          // blob7: extra (bv. push-staat)
      kort(body.s, 40).toLowerCase(),            // blob8: utm_source
      inAppBrowser(ua),                          // blob9
    ],
    // double1: altijd 1 (tellen), double2: 1 als dit een nieuw bezoek is
    doubles: [1, soort === 'pv' && vanBuiten ? 1 : 0],
  }
}

/** SQL voor /tel/stats: per dag weergaven, bezoeken en de push-trechter. */
export function statsSql(dagen) {
  const d = Math.max(1, Math.min(90, Math.floor(dagen) || 30))
  return `
SELECT
  toDate(timestamp) AS dag,
  SUM(IF(blob1 = 'pv', _sample_interval, 0)) AS weergaven,
  SUM(IF(blob1 = 'pv', _sample_interval * double2, 0)) AS bezoeken,
  SUM(IF(blob1 = 'pv' AND blob4 = 'NL', _sample_interval * double2, 0)) AS bezoeken_nl,
  SUM(IF(blob1 = 'pv' AND blob9 != '', _sample_interval * double2, 0)) AS bezoeken_in_app,
  SUM(IF(blob6 = 'push-klik', _sample_interval, 0)) AS push_klik,
  SUM(IF(blob6 = 'push-aan', _sample_interval, 0)) AS push_aan,
  SUM(IF(blob6 = 'push-geweigerd', _sample_interval, 0)) AS push_geweigerd,
  SUM(IF(blob6 = 'push-teaser', _sample_interval, 0)) AS push_teaser
FROM ${TEL_DATASET}
WHERE timestamp > NOW() - INTERVAL '${d}' DAY
GROUP BY dag
ORDER BY dag ASC
FORMAT JSON`
}
