// scripts/test-teller.mjs
// De eigen bezoekersteller (cf-worker/teller.mjs) en de /tel-route.
import assert from 'assert/strict'
import { maakDatapunt, isBot, inAppBrowser, statsSql } from '../cf-worker/teller.mjs'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const INSTA = IPHONE.replace('Safari/604.1', 'Instagram 350.0.0.0 (iPhone15,3; iOS 18_1; nl_NL)')
const ctx = { ua: IPHONE, land: 'NL', origin: 'https://nightgazer.space' }
let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }

// Paginaweergave van buiten = bezoek
let p = maakDatapunt({ t: 'pv', p: '/vandaag/', r: 'l.instagram.com', s: 'instagram' }, ctx)
ok(p && p.blobs[0] === 'pv' && p.blobs[1] === '/vandaag/' && p.blobs[3] === 'NL' && p.blobs[4] === 'mobiel', 'pv-velden')
ok(p.doubles[1] === 1, 'van buiten telt als bezoek')
p = maakDatapunt({ t: 'pv', p: '/nieuws/', r: 'www.nightgazer.space' }, ctx)
ok(p.doubles[1] === 0, 'interne klik is geen nieuw bezoek')

// Gebeurtenissen: alleen bekende
ok(maakDatapunt({ t: 'ev', e: 'push-klik', p: '/sterrenkijken/' }, ctx).blobs[5] === 'push-klik', 'bekende gebeurtenis')
ok(maakDatapunt({ t: 'ev', e: 'iets-anders', p: '/' }, ctx) === null, 'onbekende gebeurtenis genegeerd')
p = maakDatapunt({ t: 'ev', e: 'uit-klik', x: 'bol', p: '/sterrenkijken/cadeaugids/' }, ctx)
ok(p && p.blobs[5] === 'uit-klik' && p.blobs[6] === 'bol', 'klik naar winkel telt, met bestemming')
ok(statsSql(30).includes("klik_kalender") && statsSql(30).includes("'/sterrenkijken/hemelkalender/'"), 'stats tonen de kalender')
ok(statsSql(30).includes("klik_kofi") && statsSql(30).includes("'/sterrenkijken/cadeaugids/'"), 'stats tonen klikken en geldpagina')

ok(statsSql(30).includes('omhoog_bezoeken') && statsSql(30).includes("blob8 = 'pers') AS bron_pers,"), 'stats tonen de campagne per kanaal')
ok(maakDatapunt({ t: 'ev', e: 'omhoog-vink', x: '2026-11-17', p: '/omhoog/' }, ctx)?.blobs[6] === '2026-11-17', 'afvinken telt')

// Weigeren
ok(maakDatapunt({ t: 'pv', p: '/' }, { ...ctx, ua: 'Googlebot/2.1' }) === null, 'bot')
ok(maakDatapunt({ t: 'pv', p: '/' }, { ...ctx, ua: 'Mozilla/5.0 HeadlessChrome/120' }) === null, 'headless')
ok(maakDatapunt({ t: 'pv', p: '/' }, { ...ctx, origin: 'https://evil.example' }) === null, 'andere origin')
ok(maakDatapunt({ t: 'pv', p: 'https://x' }, ctx) === null, 'pad moet met / beginnen')
ok(maakDatapunt({ t: 'xx', p: '/' }, ctx) === null, 'onbekend soort')
ok(maakDatapunt(null, ctx) === null, 'geen body')
ok(isBot(''), 'lege UA is bot')

// Geen IP of id in het datapunt
p = maakDatapunt({ t: 'pv', p: '/', r: '', ip: '1.2.3.4', id: 'abc' }, ctx)
ok(!JSON.stringify(p).includes('1.2.3.4') && !JSON.stringify(p).includes('abc'), 'geen ip/id')

// In-app-browser
ok(inAppBrowser(INSTA) === 'instagram', 'instagram herkend')
ok(inAppBrowser(IPHONE) === '', 'safari is geen in-app')
ok(maakDatapunt({ t: 'pv', p: '/' }, { ...ctx, ua: INSTA }).blobs[8] === 'instagram', 'in-app in blob9')

// SQL: dagen begrensd
ok(statsSql(9999).includes("INTERVAL '90' DAY") && statsSql('x').includes("INTERVAL '30' DAY"), 'dagen begrensd')

// Route in worker.js
globalThis.caches = { default: { match: async () => null, put: async () => {} } }
const { default: worker } = await import('../cf-worker/worker.js')
const punten = []
const env = { TEL: { writeDataPoint: d => punten.push(d) } }
const req = (body, ua = IPHONE) => new Request('https://w.dev/tel', {
  method: 'POST', body: JSON.stringify(body),
  headers: { 'Content-Type': 'text/plain', 'User-Agent': ua, Origin: 'https://nightgazer.space' },
})
let res = await worker.fetch(req({ t: 'pv', p: '/', r: '' }), env)
ok(res.status === 204 && punten.length === 1, '/tel schrijft één punt')
res = await worker.fetch(req({ t: 'pv', p: '/' }, 'curl/8'), env)
ok(res.status === 204 && punten.length === 1, 'bot: 204 zonder punt')
res = await worker.fetch(new Request('https://w.dev/tel', { method: 'POST', body: '{kapot' }), env)
ok(res.status === 204, 'kapotte json: 204')
res = await worker.fetch(req({ t: 'pv', p: '/' }), {})
ok(res.status === 204, 'zonder binding: 204')

// /push/stats telt sleutels over pagina's heen
const kv = { list: async ({ cursor }) => cursor ? { keys: [{ name: 'sub:c' }], list_complete: true } : { keys: [{ name: 'sub:a' }, { name: 'sub:b' }], list_complete: false, cursor: 'x' } }
res = await worker.fetch(new Request('https://w.dev/push/stats'), { SUBS: kv })
ok((await res.json()).abonnees === 3, 'push/stats telt 3')
res = await worker.fetch(new Request('https://w.dev/tel/stats'), {})
ok(res.status === 503, 'tel/stats zonder token: 503')

// Aanmelden: plek wordt afgerond opgeslagen
const opslag = {}
const kv2 = { get: async () => null, put: async (k, v) => { opslag[k] = JSON.parse(v) }, delete: async () => {} }
res = await worker.fetch(new Request('https://w.dev/push/subscribe', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ subscription: { endpoint: 'https://push.example/abc' }, voorkeur: { lat: 52.370216, lon: 4.895168, seinen: ['iss'] } }),
}), { SUBS: kv2 })
const rec = Object.values(opslag)[0]
ok(res.status === 200 && rec.voorkeur.lat === 52.37 && rec.voorkeur.lon === 4.9 && rec.voorkeur.seinen[0] === 'iss', 'plek afgerond')

console.log(`teller: ${n} controles geslaagd`)
