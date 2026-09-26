const ALLOWED_ORIGINS = [
  'https://nightgazer.space',
  'https://www.nightgazer.space',
  // Local development: without this every proxied call (APOD, weer, NASA-beelden)
  // faalt op CORS zodra je `next dev` gebruikt.
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://stargazing.crixium.net',  // legacy — remove after migration
]

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

function cors(request, body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      ...extra,
    },
  })
}


// ══════════════════════════════════════════════════════════════════════════
// Web Push
//
// Alles hieronder blijft slapen tot er een KV-binding SUBS en een VAPID-paar
// is ingesteld. Zonder die drie dingen antwoorden de routes netjes 'nog niet
// ingericht' en doet de cron niets — zodat een deploy nooit stukloopt op
// ontbrekende configuratie.
//
// De push gaat zonder inhoud de deur uit. De versleuteling van een payload
// (aes128gcm over ECDH) is het soort crypto dat stilletjes fout gaat, en een
// melding die pas bij het tonen zijn tekst ophaalt is bovendien nooit oud.
// ══════════════════════════════════════════════════════════════════════════

const VAPID_SUB = 'https://nightgazer.space'

function b64url(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256hex(tekst) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tekst))
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** De privésleutel staat als JWK in een secret; importeren voor ES256. */
async function vapidKey(env) {
  const jwk = JSON.parse(env.VAPID_PRIVATE_KEY)
  return crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'],
  )
}

/** Het Authorization-kopje voor één pushdienst (RFC 8292). */
async function vapidHeader(endpoint, env) {
  const aud = new URL(endpoint).origin
  const kop = b64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const eis = b64url(new TextEncoder().encode(JSON.stringify({
    aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: VAPID_SUB,
  })))
  const basis = `${kop}.${eis}`
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, await vapidKey(env), new TextEncoder().encode(basis),
  )
  return `vapid t=${basis}.${b64url(sig)}, k=${env.VAPID_PUBLIC_KEY}`
}

/**
 * Stuurt een lege push. Antwoordt de dienst met 404 of 410, dan bestaat het
 * abonnement niet meer en ruimen we het op — anders blijft de lijst vollopen
 * met apparaten die nooit meer luisteren.
 */
async function stuurPush(rec, env) {
  const res = await fetch(rec.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidHeader(rec.endpoint, env),
      TTL: '900',
      Urgency: 'high',
      'Content-Length': '0',
    },
  })
  if (res.status === 404 || res.status === 410) return 'weg'
  return res.ok ? 'ok' : `fout ${res.status}`
}

// ── De seinen ─────────────────────────────────────────────────────────────

/** Maanfase 0..1; zelfde berekening als lib/sky-data.ts, zodat ze niet uiteenlopen. */
function maanFase(d) {
  const NIEUW = Date.parse('2000-01-06T18:14:00Z')
  const SYN = 29.53059 * 86400000
  return ((((d.getTime() - NIEUW) % SYN) + SYN) % SYN) / SYN
}
function maanVerlicht(d) {
  return Math.round((1 - Math.abs(maanFase(d) - 0.5) * 2) * 100)
}

/** Bewolking vannacht om 22:00 lokaal, via Open-Meteo. */
async function bewolkingVannacht(lat, lon) {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&hourly=cloud_cover&forecast_days=2&timezone=auto`
  const r = await fetch(u)
  if (!r.ok) return null
  const d = await r.json()
  const uren = d?.hourly?.cloud_cover
  if (!Array.isArray(uren)) return null
  // index 22 = 22:00 vandaag in de lokale tijdzone van het punt
  const venster = uren.slice(21, 26).filter(v => typeof v === 'number')
  if (!venster.length) return null
  return Math.round(venster.reduce((a, b) => a + b, 0) / venster.length)
}

/** De hoogste gemeten Kp van dit moment. */
async function huidigeKp() {
  const r = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
  if (!r.ok) return null
  const rows = await r.json()
  if (!Array.isArray(rows)) return null
  const nu = Date.now()
  let laatste = null
  for (const x of rows) {
    const v = Number(x?.Kp ?? x?.kp)
    const t = Date.parse(`${x?.time_tag}Z`)
    if (Number.isFinite(v) && t <= nu) laatste = v
  }
  return laatste
}

/** Lanceringen met een echte dag, vandaag. */
async function lanceringenVandaag() {
  const r = await fetch(
    'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?format=json&limit=15'
    + '&mode=list&hide_recent_previous=true',
  )
  if (!r.ok) return []
  const d = await r.json()
  const vandaag = new Date().toISOString().slice(0, 10)
  return (d.results || [])
    .filter(l => l.net_precision?.name && /minute|hour|day/i.test(l.net_precision.name))
    .filter(l => (l.net || '').slice(0, 10) === vandaag)
    .map(l => ({ naam: l.mission?.name || l.name || 'Lancering', net: l.net }))
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // ── CORS preflight ────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin':  getAllowedOrigin(request),
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
          'Access-Control-Max-Age':       '86400',
        },
      })
    }

    // ── GET /image-search?q=...&page=1&hash=12345&exclude=url1,url2 ──────
    if (request.method === 'GET' && url.pathname === '/image-search') {
      const q       = url.searchParams.get('q')    || 'space astronomy'
      const page    = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
      const hash    = Math.abs(parseInt(url.searchParams.get('hash') || '0'))
      // Excluded URLs passed by client to prevent duplicate images across articles
      const exclude = new Set((url.searchParams.get('exclude') || '').split(',').filter(Boolean))

      // 1. NASA Images API (primary — most relevant for space/astronomy content)
      try {
        const res = await fetch(
          `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page_size=20&page=${page}`,
        )
        if (res.ok) {
          const data   = await res.json()
          const items  = data?.collection?.items || []
          const qTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 3)
          const start  = hash % (items.length || 1)
          for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < items.length; i++) {
              const item = items[(start + i) % items.length]
              const href = item?.links?.[0]?.href ?? ''
              if (!href || !/\.(jpg|jpeg|png|webp)/i.test(href)) continue
              // Skip excluded URLs
              if (exclude.has(href)) continue
              if (pass === 0 && qTerms.length > 0) {
                const meta = [
                  item?.data?.[0]?.title ?? '',
                  item?.data?.[0]?.description ?? '',
                  (item?.data?.[0]?.keywords ?? []).join(' '),
                ].join(' ').toLowerCase()
                const matchCount = qTerms.filter(t => meta.includes(t)).length
                const threshold  = qTerms.length <= 2 ? 1 : 2
                if (matchCount < threshold) continue
              }
              const photographer = item?.data?.[0]?.photographer ?? ''
              const center       = item?.data?.[0]?.center ?? 'NASA'
              return cors(request, JSON.stringify({
                url:    href,
                credit: photographer ? `${photographer} / ${center}` : center,
                source: 'nasa',
              }))
            }
          }
        }
      } catch { /* fall through */ }

      // 2. Pexels (fallback — broader stock photo library)
      const pexelsKey = env.PEXELS_API_KEY
      if (pexelsKey) {
        try {
          const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=20&page=${page}&orientation=landscape`,
            { headers: { Authorization: pexelsKey } },
          )
          if (res.ok) {
            const data    = await res.json()
            const photos  = data?.photos || []
            if (photos.length > 0) {
              const qTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 3)
              const start  = hash % photos.length
              for (let pass = 0; pass < 2; pass++) {
                for (let i = 0; i < photos.length; i++) {
                  const photo = photos[(start + i) % photos.length]
                  const imgUrl = photo?.src?.large2x || photo?.src?.large
                  if (!imgUrl) continue
                  if (exclude.has(imgUrl)) continue
                  if (pass === 0 && qTerms.length > 0) {
                    const alt = (photo.alt || '').toLowerCase()
                    if (!qTerms.some(t => alt.includes(t))) continue
                  }
                  return cors(request, JSON.stringify({
                    url:    imgUrl,
                    credit: `${photo.photographer} / Pexels`,
                    source: 'pexels',
                  }))
                }
              }
            }
          }
        } catch { /* fall through */ }
      }

      return cors(request, JSON.stringify({ url: null, credit: null }))
    }

    // ── GET /apod ─────────────────────────────────────────────────────────
    // Proxies NASA APOD and caches the result for a full day via CF Cache API
    // — APOD only changes once every 24h, so the cache key is date-scoped
    // (rather than a static key) and kept for 24h instead of re-fetching
    // NASA hourly. API key stays server-side — never exposed to the browser.
    if (request.method === 'GET' && url.pathname === '/apod') {
      const today    = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
      const cacheKey = new Request(`https://nasa-apod-cache/apod?date=${today}`)
      const cache    = caches.default

      const cached = await cache.match(cacheKey)
      if (cached) {
        const data = await cached.json()
        return cors(request, JSON.stringify(data))
      }

      const apiKey = env.NASA_API_KEY || 'DEMO_KEY'
      const res    = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`)
      if (!res.ok) {
        return cors(request, JSON.stringify({ error: `NASA ${res.status}` }), 502)
      }
      const data = await res.json()

      await cache.put(cacheKey, new Response(JSON.stringify(data), {
        headers: { 'Cache-Control': 'public, max-age=86400', 'Content-Type': 'application/json' },
      }))

      return cors(request, JSON.stringify(data))
    }

    // ── GET /weather?lat=52.37&lon=4.90 ──────────────────────────────────
    // Proxies Open-Meteo and caches the result for 30 minutes via CF Cache API
    // so individual browser visits don't each hit Open-Meteo directly.
    if (request.method === 'GET' && url.pathname === '/weather') {
      const lat    = url.searchParams.get('lat')    ?? '52.3676'
      const lon    = url.searchParams.get('lon')    ?? '4.9041'
      const days   = url.searchParams.get('days')   ?? '1'
      const fields = url.searchParams.get('fields') ?? 'cloud_cover,temperature_2m,relative_humidity_2m,wind_speed_10m'

      const cacheKey = new Request(`https://open-meteo-cache/weather?lat=${lat}&lon=${lon}&days=${days}&fields=${fields}`)
      const cache    = caches.default

      const cached = await cache.match(cacheKey)
      if (cached) {
        const data = await cached.json()
        return cors(request, JSON.stringify(data))
      }

      const upstream = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${fields}&forecast_days=${days}&timezone=auto`
      )
      if (!upstream.ok) {
        return cors(request, JSON.stringify({ error: 'upstream failed' }), 502)
      }
      const data = await upstream.json()

      // Store in CF cache for 30 minutes
      await cache.put(cacheKey, new Response(JSON.stringify(data), {
        headers: { 'Cache-Control': 'public, max-age=1800', 'Content-Type': 'application/json' },
      }))

      return cors(request, JSON.stringify(data))
    }

    // ── GET /image-proxy?url=...&w=900&q=82 ─────────────────────────────
    // Fetches an image server-side and re-serves it with proper CORS headers,
    // bypassing browser ORB restrictions on ESA/NASA cross-origin images.
    // When ?w= is provided, routes through images.weserv.nl for resize + WebP conversion.
    if (request.method === 'GET' && url.pathname === '/image-proxy') {
      const imageUrl = url.searchParams.get('url')
      if (!imageUrl) return cors(request, JSON.stringify({ error: 'No URL' }), 400)

      // Only allow http(s) URLs
      if (!/^https?:\/\//i.test(imageUrl)) {
        return cors(request, JSON.stringify({ error: 'Invalid URL' }), 400)
      }

      // Normalize URL: re-encode any non-ASCII / bare special characters
      let safeUrl = imageUrl
      try { safeUrl = new URL(imageUrl).href } catch { /* use as-is */ }

      const w = url.searchParams.get('w')           // target width in px (optional)
      const q = url.searchParams.get('q') || '82'   // quality (default 82)

      // Check Cloudflare edge cache first — avoids upstream fetch on cache hit
      const cache    = caches.default
      const cacheKey = new Request(request.url)
      const cached   = await cache.match(cacheKey)
      if (cached) return cached

      const directHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; NightGazerBot/1.0)',
        'Accept':     'image/webp,image/jpeg,image/png,image/*',
        'Referer':    new URL(safeUrl).origin + '/',
      }

      try {
        let upstream = null

        // Try weserv.nl for resize + WebP when width is requested
        if (w) {
          try {
            const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(safeUrl)}&w=${w}&output=webp&q=${q}&we`
            const r = await fetch(weservUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NightGazerBot/1.0)', 'Accept': 'image/*' },
              redirect: 'follow',
            })
            if (r.ok) upstream = r
            // else fall through to direct fetch below
          } catch { /* weserv unavailable — fall through */ }
        }

        // Direct fetch (primary when no w=, or fallback when weserv fails)
        if (!upstream) {
          upstream = await fetch(safeUrl, { headers: directHeaders, redirect: 'follow' })
        }

        if (!upstream.ok) {
          return cors(request, JSON.stringify({ error: `Upstream ${upstream.status}` }), 502)
        }

        const ct = upstream.headers.get('Content-Type') || ''
        if (!ct.startsWith('image/')) {
          return cors(request, JSON.stringify({ error: 'Not an image' }), 415)
        }

        const imgHeaders = {
          'Content-Type':                 ct,
          'Cache-Control':                'public, max-age=86400, stale-while-revalidate=604800',
          'Access-Control-Allow-Origin':  '*',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'Vary':                         'Accept',
        }

        // Buffer body so we can both cache and return the same bytes
        const buffer   = await upstream.arrayBuffer()
        const response = new Response(buffer, { status: 200, headers: imgHeaders })

        // Store in edge cache — subsequent requests from same PoP skip the upstream fetch
        await cache.put(cacheKey, response.clone())

        return response
      } catch (e) {
        return cors(request, JSON.stringify({ error: 'Upstream fetch failed' }), 502)
      }
    }

    // ── GET /space-weather → NOAA KP-index (ruimteweer / aurora) ────────────
    // Proxiet NOAA SWPC realtime planetary K-index. Gecached 30 min.
    // KP ≥ 5 = aurora mogelijk zichtbaar vanuit Nederland.
    if (request.method === 'GET' && url.pathname === '/space-weather') {
      const cacheKey = new Request('https://noaa-kp-cache/kp-index')
      const cache    = caches.default

      const cached = await cache.match(cacheKey)
      if (cached) {
        const data = await cached.json()
        return cors(request, JSON.stringify(data))
      }

      try {
        const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', {
          headers: { 'User-Agent': 'NightGazer/1.0 (nightgazer.space)' },
        })
        if (!res.ok) return cors(request, JSON.stringify({ error: `NOAA ${res.status}` }), 502)

        const raw = await res.json()
        // raw = [[time_tag, kp, observed, noaa_scale], ...]
        // NOAA levert sinds kort objecten in plaats van arrays:
        //   nu:  [{ time_tag, Kp, a_running, station_count }, ...]
        //   was: [[time_tag, kp, observed, scale], ...] met een kopregel
        // De oude parser las rij[1] en dat bestaat niet meer, dus kp werd
        // NaN en kwam als null bij de client aan. Beide vormen worden nu
        // gelezen, zodat een terugdraai aan hun kant ons niet opnieuw breekt.
        const rows = Array.isArray(raw) ? raw : []
        const parsed = rows
          .map(r => {
            if (r && typeof r === 'object' && !Array.isArray(r)) {
              const v = r.Kp ?? r.kp ?? r.kp_index
              return { time: r.time_tag, kp: v === null || v === undefined ? NaN : parseFloat(v) }
            }
            if (Array.isArray(r)) return { time: r[0], kp: parseFloat(r[1]) }
            return { time: null, kp: NaN }
          })
          .filter(e => Number.isFinite(e.kp))

        // Laatste 8 metingen = 24 uur bij 3-uurs intervallen
        const entries = parsed.slice(-8)
        const latest  = entries[entries.length - 1]
        const kp      = latest ? latest.kp : null
        const data    = {
          kp,
          kpText:  kp === null ? 'Onbekend'
                 : kp >= 8 ? 'Extreem' : kp >= 6 ? 'Sterk' : kp >= 5 ? 'Matig' : kp >= 3 ? 'Laag' : 'Rustig',
          aurora:  kp !== null && kp >= 5,
          entries,
          updated: new Date().toISOString(),
        }

        const response = new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
        })
        await cache.put(cacheKey, response.clone())
        return cors(request, JSON.stringify(data))
      } catch (e) {
        return cors(request, JSON.stringify({ error: 'NOAA niet bereikbaar' }), 502)
      }
    }

    // ── GET /launches → Aankomende lanceringen (7 dagen, via Launch Library 2) ──
    // Cachet 1 uur in CF Cache API — LL2 free tier is max 15 req/uur.
    if (request.method === 'GET' && url.pathname === '/launches') {
      const cacheKey = new Request('https://ll2-launches-cache/launches-7d')
      const cache    = caches.default

      const cached = await cache.match(cacheKey)
      if (cached) {
        const data = await cached.json()
        return cors(request, JSON.stringify(data))
      }

      // Kleine lookup map: LL2 naam-prefix → missie-id op nightgazer.space
      const MISSION_ID_MAP = {
        'starship':       'starship',
        'artemis':        'artemis',
        'perseverance':   'perseverance',
        'james webb':     'jwst',
        'webb':           'jwst',
        'smile':          'smile',
        'juice':          'juice',
        'curiosity':      'curiosity',
        'voyager':        'voyager1',
        'europa clipper': 'europa-clipper',
      }

      function resolveMissionId(name) {
        const lower = (name || '').toLowerCase()
        for (const [key, id] of Object.entries(MISSION_ID_MAP)) {
          if (lower.includes(key)) return id
        }
        return null
      }

      try {
        const now    = new Date().toISOString()
        const plus7  = new Date(Date.now() + 7 * 86400 * 1000).toISOString()
        const ll2Res = await fetch(
          `https://ll.thespacedevs.com/2.3.0/launches/upcoming/?format=json&limit=10` +
          `&window_start__gte=${now}&window_start__lte=${plus7}&ordering=window_start`,
          { headers: { 'User-Agent': 'NightGazer/1.0 (nightgazer.space)' } }
        )

        if (!ll2Res.ok) {
          return cors(request, JSON.stringify({ error: `LL2 ${ll2Res.status}` }), 502)
        }

        const ll2Data = await ll2Res.json()
        const launches = (ll2Data.results || []).map(l => ({
          id:          l.id,
          name:        l.mission?.name || l.name || '',
          agency:      l.launch_service_provider?.name || '',
          vehicle:     l.rocket?.configuration?.name || '',
          pad:         l.pad?.name || '',
          windowStart: l.window_start,
          windowEnd:   l.window_end,
          status:      l.status?.name || 'Onbekend',
          missionId:   resolveMissionId(l.mission?.name || l.name || ''),
        }))

        const response = new Response(JSON.stringify(launches), {
          headers: {
            'Content-Type':  'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        })
        await cache.put(cacheKey, response.clone())
        return cors(request, JSON.stringify(launches))
      } catch (e) {
        return cors(request, JSON.stringify({ error: 'LL2 niet bereikbaar' }), 502)
      }
    }


    // ── Push: sleutel opvragen ───────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/push/key') {
      return cors(request, JSON.stringify({
        publicKey: env.VAPID_PUBLIC_KEY || null,
        actief: Boolean(env.SUBS && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
      }))
    }

    // ── Push: aanmelden ──────────────────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/push/subscribe') {
      if (!env.SUBS) return cors(request, JSON.stringify({ error: 'push nog niet ingericht' }), 503)
      let body
      try { body = await request.json() } catch { return cors(request, JSON.stringify({ error: 'geen json' }), 400) }
      const endpoint = body?.subscription?.endpoint
      if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint)) {
        return cors(request, JSON.stringify({ error: 'geen geldig abonnement' }), 400)
      }
      const id = await sha256hex(endpoint)
      /* Een vervangen abonnement laat anders een dode sleutel achter. */
      if (body.vervangt) await env.SUBS.delete(`sub:${body.vervangt}`)
      const bestaand = await env.SUBS.get(`sub:${id}`, 'json')
      await env.SUBS.put(`sub:${id}`, JSON.stringify({
        endpoint,
        voorkeur: body.voorkeur || {},
        wekkers: Array.isArray(body.wekkers) ? body.wekkers.slice(0, 40) : [],
        laatst: bestaand?.laatst || {},
        bericht: bestaand?.bericht || null,
        bijgewerkt: Date.now(),
      }))
      return cors(request, JSON.stringify({ ok: true, id }))
    }

    // ── Push: afmelden ───────────────────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/push/unsubscribe') {
      if (!env.SUBS) return cors(request, JSON.stringify({ ok: true }))
      let body
      try { body = await request.json() } catch { return cors(request, JSON.stringify({ error: 'geen json' }), 400) }
      if (typeof body?.endpoint === 'string') await env.SUBS.delete(`sub:${await sha256hex(body.endpoint)}`)
      return cors(request, JSON.stringify({ ok: true }))
    }

    // ── Push: de tekst bij de zojuist verstuurde melding ─────────────────
    // De id is de SHA-256 van het endpoint. Dat endpoint is zelf een lange
    // willekeurige URL, dus de hash is in de praktijk een geheim — niemand
    // kan andermans melding opvragen zonder die URL al te hebben.
    if (request.method === 'GET' && url.pathname === '/push/message') {
      if (!env.SUBS) return cors(request, JSON.stringify({}), 404)
      const id = (url.searchParams.get('id') || '').toLowerCase()
      if (!/^[0-9a-f]{64}$/.test(id)) return cors(request, JSON.stringify({}), 400)
      const rec = await env.SUBS.get(`sub:${id}`, 'json')
      if (!rec?.bericht) return cors(request, JSON.stringify({}), 404)
      const bericht = rec.bericht
      rec.bericht = null
      await env.SUBS.put(`sub:${id}`, JSON.stringify(rec))
      return cors(request, JSON.stringify(bericht))
    }

    // ── POST / → Anthropic proxy (existing) ──────────────────────────────
    if (request.method === 'POST' && url.pathname === '/') {
      const body     = await request.json()
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      return cors(request, JSON.stringify(data))
    }

    return cors(request, JSON.stringify({ error: 'Not found' }), 404)
  },

  // ── Cron: wie moet er een melding krijgen? ──────────────────────────────
  async scheduled(event, env, ctx) {
    if (!env.SUBS || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return

    const nu = Date.now()
    const uurUtc = new Date(nu).getUTCHours()

    /* Kp en lanceringen zijn voor iedereen gelijk: één keer ophalen, niet
       per abonnee. Het weer verschilt per plek en wordt hieronder per
       afgeronde coördinaat gedeeld. */
    let kp = null, launches = []
    try { kp = await huidigeKp() } catch { /* geen Kp: dat sein slaat over */ }

    /* Launch Library knijpt een gedeeld Cloudflare-IP af rond vijftien
       aanvragen per uur, en /launches deelt datzelfde budget met de
       missiepagina. Elk kwartier vragen zou die pagina uithongeren voor een
       melding die maar één keer per dag hoeft. Dus: alleen de eerste tik van
       zeven uur, met acht uur als herkansing als het dan misging. */
    const minUtc = new Date(nu).getUTCMinutes()
    if ((uurUtc === 7 || uurUtc === 8) && minUtc < 15) {
      try { launches = await lanceringenVandaag() } catch { /* geen lijst: sein slaat over */ }
    }
    const weerCache = new Map()

    const lijst = await env.SUBS.list({ prefix: 'sub:' })
    for (const sleutel of lijst.keys) {
      const rec = await env.SUBS.get(sleutel.name, 'json')
      if (!rec?.endpoint) continue
      const v = rec.voorkeur || {}
      const seinen = Array.isArray(v.seinen) ? v.seinen : []
      const laatst = rec.laatst || {}
      let bericht = null

      // 1. ISS — de wekkerlijst die de browser heeft meegestuurd
      if (!bericht && seinen.includes('iss')) {
        const w = (rec.wekkers || [])
          .filter(x => x.soort === 'iss' && x.t > nu && x.t - nu <= 20 * 60000)
          .sort((a, b) => a.t - b.t)[0]
        if (w && (laatst.iss || 0) < w.t - 30 * 60000) {
          bericht = { title: w.titel, body: w.tekst, url: w.url, tag: 'iss' }
          laatst.iss = nu
        }
      }

      // 2. Noorderlicht — hooguit één melding per Kp-blok van drie uur
      if (!bericht && seinen.includes('noorderlicht') && kp !== null) {
        const drempel = Number(v.kpDrempel) || 6
        if (kp >= drempel && nu - (laatst.noorderlicht || 0) > 3 * 3600000) {
          bericht = {
            title: `Poollicht mogelijk — Kp ${kp.toFixed(1)}`,
            body: 'De poollichtovaal zakt tot boven Nederland. Zoek een donkere plek met vrij zicht naar het noorden.',
            url: '/sterrenkijken/', tag: 'aurora',
          }
          laatst.noorderlicht = nu
        }
      }

      // 3. Lancering — 's ochtends, één keer per dag
      if (!bericht && seinen.includes('lancering') && launches.length) {
        if (nu - (laatst.lancering || 0) > 20 * 3600000) {
          const l = launches[0]
          bericht = {
            title: `Vandaag een lancering: ${l.naam}`,
            body: l.net ? `Gepland om ${new Date(l.net).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })} Nederlandse tijd.` : 'Datum staat vast, tijd nog niet.',
            url: '/missies/', tag: 'launch',
          }
          laatst.lancering = nu
        }
      }

      // 4. Heldere nacht — alleen aan het eind van de middag, één keer per dag
      if (!bericht && seinen.includes('helder') && uurUtc >= 15 && uurUtc < 18
          && typeof v.lat === 'number' && nu - (laatst.helder || 0) > 20 * 3600000) {
        const sleutelWeer = `${v.lat.toFixed(1)},${v.lon.toFixed(1)}`
        if (!weerCache.has(sleutelWeer)) {
          try { weerCache.set(sleutelWeer, await bewolkingVannacht(v.lat, v.lon)) }
          catch { weerCache.set(sleutelWeer, null) }
        }
        const wolk = weerCache.get(sleutelWeer)
        const maan = maanVerlicht(new Date(nu))
        /* Streng genoeg dat de melding iets betekent. Wie elke halfbewolkte
           avond een seintje krijgt, zet hem binnen een week uit. */
        if (wolk !== null && wolk <= 20 && maan <= 55) {
          bericht = {
            title: 'Heldere nacht vannacht',
            body: `${wolk}% bewolking en de maan staat voor ${maan}% aan${v.plaats ? ` boven ${v.plaats}` : ''}. Goede avond om eropuit te gaan.`,
            url: '/sterrenkijken/', tag: 'helder',
          }
          laatst.helder = nu
        }
      }

      if (!bericht) continue

      rec.bericht = bericht
      rec.laatst = laatst
      await env.SUBS.put(sleutel.name, JSON.stringify(rec))
      try {
        const uitkomst = await stuurPush(rec, env)
        if (uitkomst === 'weg') await env.SUBS.delete(sleutel.name)
      } catch { /* volgende ronde opnieuw */ }
    }
  },
}
