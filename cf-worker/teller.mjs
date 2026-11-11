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
  'hemelfoto-start',  // eerste gok in Raad de hemelfoto (extra = puzzelnummer)
  'hemelfoto-klaar',  // puzzel af (extra = '3/6' of 'X/6')
  'hemelfoto-deel',   // tik op Deel je uitslag
  'hemelfoto-verder', // tik op een artikel of vervolglink na het raden
  'hemelfoto-teaser', // tik op het spelblokje op de voorpagina, /vandaag of /educatie
  'sterrenbeeld-start',  // eerste lijn in Teken het sterrenbeeld (extra = sterrenbeeld)
  'sterrenbeeld-klaar',  // sterrenbeeld af (extra = 'id:missers')
  'sterrenbeeld-verder', // tik op de vervolglink na het tekenen
  'sterrenbeeld-teaser', // tik op het spelblokje
  'uit-klik',            // tik op een link naar een winkel of Ko-fi (extra = 'bol' | 'amazon' | 'kofi' | 'kalender')
  'omhoog-vink',         // 30 nachten omhoog: nacht afgevinkt (extra = datum)
  'omhoog-print',        // 30 nachten omhoog: tik op Print de afvinkkaart
  'omhoog-deel',         // 30 nachten omhoog: tik op Deel de uitdaging
  'omhoog-blok',         // tik op het campagneblok op home, /vandaag of /sterrenkijken (extra = datum)
  'geminiden-telling',   // Tel de Geminiden: telling verstuurd
])

/** Campagnekanalen (utm_source) van 30 nachten omhoog, voor /tel/stats. */
export const OMHOOG_KANALEN = ['instagram', 'facebook', 'x', 'youtube', 'pers', 'sterrenwacht', 'forum']

/** Pagina's met winkelknoppen: hun weergaven tellen als "geldpagina". */
export const GELDPAGINAS = [
  '/sterrenkijken/uitrusting/',
  '/sterrenkijken/eerste-telescoop/',
  '/sterrenkijken/cadeaugids/',
  '/sterrenkijken/hemelkalender/',
]

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

/** SQL voor /tel/stats: per dag weergaven, bezoeken, de push-trechter, de twee dagspellen en de klikken naar winkels en Ko-fi. */
export function statsSql(dagen) {
  const d = Math.max(1, Math.min(90, Math.floor(dagen) || 30))
  // sumIf/toStartOfDay: de functies die de SQL-API van Analytics Engine
  // ondersteunt. _sample_interval weegt de steekproef terug naar echte aantallen.
  return `
SELECT
  toStartOfDay(timestamp) AS dag,
  sumIf(_sample_interval, blob1 = 'pv') AS weergaven,
  sumIf(_sample_interval * double2, blob1 = 'pv') AS bezoeken,
  sumIf(_sample_interval * double2, blob1 = 'pv' AND blob4 = 'NL') AS bezoeken_nl,
  sumIf(_sample_interval * double2, blob1 = 'pv' AND blob9 != '') AS bezoeken_in_app,
  sumIf(_sample_interval, blob6 = 'push-teaser') AS push_teaser,
  sumIf(_sample_interval, blob6 = 'push-klik') AS push_klik,
  sumIf(_sample_interval, blob6 = 'push-aan') AS push_aan,
  sumIf(_sample_interval, blob6 = 'push-geweigerd') AS push_geweigerd,
  sumIf(_sample_interval, blob1 = 'pv' AND blob2 = '/spellen/hemelfoto/') AS hemelfoto_weergaven,
  sumIf(_sample_interval, blob6 = 'hemelfoto-teaser') AS hemelfoto_teaser,
  sumIf(_sample_interval, blob6 = 'hemelfoto-start') AS hemelfoto_start,
  sumIf(_sample_interval, blob6 = 'hemelfoto-klaar') AS hemelfoto_klaar,
  sumIf(_sample_interval, blob6 = 'hemelfoto-deel') AS hemelfoto_deel,
  sumIf(_sample_interval, blob6 = 'hemelfoto-verder') AS hemelfoto_verder,
  sumIf(_sample_interval, blob1 = 'pv' AND blob2 = '/spellen/sterrenbeeld/') AS sterrenbeeld_weergaven,
  sumIf(_sample_interval, blob6 = 'sterrenbeeld-teaser') AS sterrenbeeld_teaser,
  sumIf(_sample_interval, blob6 = 'sterrenbeeld-start') AS sterrenbeeld_start,
  sumIf(_sample_interval, blob6 = 'sterrenbeeld-klaar') AS sterrenbeeld_klaar,
  sumIf(_sample_interval, blob6 = 'sterrenbeeld-verder') AS sterrenbeeld_verder,
  sumIf(_sample_interval, blob1 = 'pv' AND blob2 IN (${GELDPAGINAS.map(p => `'${p}'`).join(', ')})) AS geldpagina_weergaven,
  sumIf(_sample_interval, blob1 = 'pv' AND blob2 = '/sterrenkijken/cadeaugids/') AS cadeaugids_weergaven,
  sumIf(_sample_interval, blob6 = 'uit-klik' AND blob7 = 'bol') AS klik_bol,
  sumIf(_sample_interval, blob6 = 'uit-klik' AND blob7 = 'amazon') AS klik_amazon,
  sumIf(_sample_interval, blob6 = 'uit-klik' AND blob7 = 'kofi') AS klik_kofi,
  sumIf(_sample_interval, blob1 = 'pv' AND blob2 = '/sterrenkijken/hemelkalender/') AS kalender_weergaven,
  sumIf(_sample_interval, blob6 = 'uit-klik' AND blob7 = 'kalender') AS klik_kalender,
  sumIf(_sample_interval, blob1 = 'pv' AND blob2 = '/omhoog/') AS omhoog_weergaven,
  sumIf(_sample_interval * double2, blob1 = 'pv' AND blob2 = '/omhoog/') AS omhoog_bezoeken,
${OMHOOG_KANALEN.map(k => `  sumIf(_sample_interval * double2, blob1 = 'pv' AND blob8 = '${k}') AS bron_${k},`).join('\n')}
  sumIf(_sample_interval, blob6 = 'omhoog-vink') AS omhoog_vink,
  sumIf(_sample_interval, blob6 = 'omhoog-print') AS omhoog_print,
  sumIf(_sample_interval, blob6 = 'omhoog-deel') AS omhoog_deel,
  sumIf(_sample_interval, blob6 = 'omhoog-blok') AS omhoog_blok,
  sumIf(_sample_interval, blob6 = 'geminiden-telling') AS geminiden_telling
FROM ${TEL_DATASET}
WHERE timestamp > NOW() - INTERVAL '${d}' DAY
GROUP BY dag
ORDER BY dag ASC
FORMAT JSON`
}
