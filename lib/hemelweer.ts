/* ══════════════════════════════════════════════════════════════════════════
   Hemelweer — het weer zoals een sterrenkijker het leest.

   Per uur: wolken in drie lagen, doorzicht, seeing (schatting uit de
   straalstroom), dauwkans, de maan en hoe donker het is. Daaruit één score
   per uur, het beste venster van de nacht en één zin die je in twee
   seconden leest. Alles puur, zonder React, zodat scripts/test-hemelweer.mjs
   het kan keuren.
   ══════════════════════════════════════════════════════════════════════════ */

import { altAz, julianDay, sunAltitude, sunPosition } from './sky-chart'

const D2R = Math.PI / 180
const R2D = 180 / Math.PI
const norm360 = (x: number) => ((x % 360) + 360) % 360

/* Wat we bij Open-Meteo vragen. Eén verzoek voor de hele pagina. */
export const HEMEL_VELDEN = [
  'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
  'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'wind_speed_10m',
  'visibility', 'precipitation_probability', 'wind_speed_250hPa',
].join(',')

export function hemelUrl(lat: number, lon: number, dagen = 8): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}`
    + `&hourly=${HEMEL_VELDEN}&forecast_days=${dagen}&timezone=auto`
}

// ── De maan ───────────────────────────────────────────────────────────────

/** Maanpositie, laag-precisie (±0,3°): ruim genoeg voor op- en ondergang. */
export function moonPosition(d: Date): { ra: number; dec: number } {
  const n = julianDay(d) - 2451545.0
  const L = norm360(218.316 + 13.176396 * n)
  const M = norm360(134.963 + 13.064993 * n) * D2R
  const Ms = norm360(357.529 + 0.98560028 * n) * D2R
  const F = norm360(93.272 + 13.22935 * n) * D2R
  const Dl = norm360(297.850 + 12.190749 * n) * D2R
  const lam = (L + 6.289 * Math.sin(M) - 1.274 * Math.sin(M - 2 * Dl) + 0.658 * Math.sin(2 * Dl)
    + 0.214 * Math.sin(2 * M) - 0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F)) * D2R
  const bet = (5.128 * Math.sin(F)) * D2R
  const eps = 23.439 * D2R
  const ra = Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps), Math.cos(lam))
  const dec = Math.asin(Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam))
  return { ra: norm360(ra * R2D), dec: dec * R2D }
}

/** Hoogte van de maan zoals je hem ziet (met parallax), in graden. */
export function moonAltitude(lat: number, lon: number, when: Date): number {
  const m = moonPosition(when)
  const alt = altAz(m.ra, m.dec, lat, lon, when).alt
  return alt - 0.95 * Math.cos(alt * D2R)
}

/** Verlicht deel van de maan, 0–1, uit de hoek tussen zon en maan. */
export function moonIllumination(d: Date): number {
  const s = sunPosition(d), m = moonPosition(d)
  const cosE = Math.sin(s.dec * D2R) * Math.sin(m.dec * D2R)
    + Math.cos(s.dec * D2R) * Math.cos(m.dec * D2R) * Math.cos((s.ra - m.ra) * D2R)
  return (1 - cosE) / 2
}

/** Wassend of afnemend: de maan staat oostelijk (wassend) of westelijk van de zon. */
export function moonWaxing(d: Date): boolean {
  const s = sunPosition(d), m = moonPosition(d)
  return norm360(m.ra - s.ra) < 180
}

export function moonName(lit: number, waxing: boolean): string {
  if (lit < 0.03) return 'Nieuwe maan'
  if (lit > 0.97) return 'Volle maan'
  if (lit > 0.45 && lit < 0.55) return waxing ? 'Eerste kwartier' : 'Laatste kwartier'
  if (lit < 0.5) return waxing ? 'Wassende sikkel' : 'Afnemende sikkel'
  return waxing ? 'Wassende maan' : 'Afnemende maan'
}

/** Eerste tijdstip in [van, tot) waarop f van teken wisselt in de gevraagde richting. */
function kruising(f: (t: Date) => number, van: Date, tot: Date, omhoog: boolean, drempel: number): Date | null {
  const stap = 10 * 60000
  let prev = f(van)
  for (let t = van.getTime() + stap; t <= tot.getTime(); t += stap) {
    const a = f(new Date(t))
    if (omhoog ? (prev < drempel && a >= drempel) : (prev >= drempel && a < drempel)) return new Date(t)
    prev = a
  }
  return null
}

// ── Het donker ───────────────────────────────────────────────────────────

export interface Nachtgrenzen {
  zonOnder: Date | null
  donkerVan: Date | null   // zon onder -12°: echt donker genoeg om te kijken
  donkerTot: Date | null
  astroVan: Date | null    // zon onder -18°: volledig donker, alleen buiten de zomer
  astroTot: Date | null
  zonOp: Date | null
  maanOp: Date | null
  maanOnder: Date | null
}

/** Alle grenzen van de nacht die op `avond` begint (zoeken van 12:00 tot 12:00). */
export function nachtgrenzen(lat: number, lon: number, avond: Date): Nachtgrenzen {
  const van = new Date(avond.getFullYear(), avond.getMonth(), avond.getDate(), 12, 0, 0)
  const tot = new Date(van.getTime() + 24 * 3600e3)
  const zon = (t: Date) => sunAltitude(lat, lon, t)
  const maan = (t: Date) => moonAltitude(lat, lon, t)
  return {
    zonOnder: kruising(zon, van, tot, false, -0.833),
    donkerVan: kruising(zon, van, tot, false, -12),
    donkerTot: kruising(zon, van, tot, true, -12),
    astroVan: kruising(zon, van, tot, false, -18),
    astroTot: kruising(zon, van, tot, true, -18),
    zonOp: kruising(zon, van, tot, true, -0.833),
    maanOp: kruising(maan, van, tot, true, -0.583),
    maanOnder: kruising(maan, van, tot, false, -0.583),
  }
}

// ── Per uur ──────────────────────────────────────────────────────────────

export type Licht = 'dag' | 'schemer' | 'donker'

export interface Uur {
  t: Date
  licht: Licht
  zon: number
  wolk: number; laag: number; midden: number; hoog: number
  regen: number
  temp: number; dauwpunt: number; vocht: number
  wind: number; jet: number | null
  zicht: number
  maan: number          // hoogte in graden, negatief = onder
  doorzicht: number     // 1–5
  seeing: number        // 1–5, schatting
  dauw: boolean
  score: number         // 0–100; dag = 0
}

type Ruw = Record<string, (number | null)[] | string[] | undefined>
const getal = (a: unknown, i: number, val: number) => {
  const v = Array.isArray(a) ? a[i] : null
  return typeof v === 'number' && Number.isFinite(v) ? v : val
}

/** Doorzicht 1–5: vocht, nevel en sluierbewolking maken de hemel melkig. */
export function doorzicht(vocht: number, zichtM: number, hoog: number): number {
  let d = 5
  if (vocht >= 95) d -= 2; else if (vocht >= 85) d -= 1
  if (zichtM < 10000) d -= 2; else if (zichtM < 20000) d -= 1
  if (hoog >= 40) d -= 1
  return Math.max(1, d)
}

/* shortcut: seeing uit alleen de straalstroom en grondwind; een echt
   seeingmodel (turbulentie per laag) kan later via 7Timer of Meteoblue. */
export function seeing(jet: number | null, wind: number): number {
  let s = jet === null ? 3 : jet < 50 ? 5 : jet < 80 ? 4 : jet < 120 ? 3 : jet < 160 ? 2 : 1
  if (wind > 30) s -= 1
  return Math.max(1, s)
}

/** De score van één uur. Wolken wegen het zwaarst; de maan telt mee als hij op staat. */
export function uurScore(u: Omit<Uur, 'score'>, verlicht: number): number {
  if (u.licht === 'dag') return 0
  let s = 100 - u.wolk
  if (u.regen >= 50) s = Math.min(s, 10)
  s -= (5 - u.doorzicht) * 4
  s -= (5 - u.seeing) * 2
  if (u.maan > 0) s -= verlicht * Math.min(1, (u.maan + 5) / 30) * 20
  if (u.licht === 'schemer') s -= 15
  return Math.round(Math.max(0, Math.min(100, s)))
}

export function leesUren(data: { hourly?: Ruw }, lat: number, lon: number): Uur[] {
  const h = data.hourly
  if (!h || !Array.isArray(h.time) || !Array.isArray(h.cloud_cover)) throw new Error('geen uurdata')
  return (h.time as string[]).map((ts, i) => {
    /* Open-Meteo geeft lokale tijd zonder zone ("2026-11-17T21:00"); de
       browser leest dat als eigen lokale tijd. Klopt voor heel NL en BE. */
    const t = new Date(ts)
    const zon = sunAltitude(lat, lon, t)
    const wolk = getal(h.cloud_cover, i, 100)
    const hoog = getal(h.cloud_cover_high, i, 0)
    const vocht = getal(h.relative_humidity_2m, i, 80)
    const zicht = getal(h.visibility, i, 24000)
    const temp = getal(h.temperature_2m, i, 5)
    const dauwpunt = getal(h.dew_point_2m, i, temp - 3)
    const wind = getal(h.wind_speed_10m, i, 10)
    const jetRuw = getal(h.wind_speed_250hPa, i, -1)
    const jet = jetRuw < 0 ? null : jetRuw
    const basis = {
      t, zon, wolk, hoog, vocht, zicht, temp, dauwpunt, wind, jet,
      licht: (zon > -6 ? 'dag' : zon > -12 ? 'schemer' : 'donker') as Licht,
      laag: getal(h.cloud_cover_low, i, wolk),
      midden: getal(h.cloud_cover_mid, i, 0),
      regen: getal(h.precipitation_probability, i, 0),
      maan: moonAltitude(lat, lon, t),
      doorzicht: doorzicht(vocht, zicht, hoog),
      seeing: seeing(jet, wind),
      dauw: temp - dauwpunt <= 2,
    }
    return { ...basis, score: uurScore(basis, moonIllumination(t)) }
  })
}

// ── De nacht ─────────────────────────────────────────────────────────────

export interface Nacht {
  avond: Date
  uren: Uur[]           // van een uur voor het donker tot een uur erna
  donker: Uur[]         // alleen de uren met zon onder -6°
  score: number         // het beste blok van drie donkere uren
  venster: { van: Date; tot: Date; score: number } | null
  wolk: number          // gemiddelde bewolking over de donkere uren
  verlicht: number      // maan, 0–1, om middernacht
  wind: number
  grenzen: Nachtgrenzen
}

const uurMs = 3600e3

/** De avond waar 'nu' bij hoort: vóór 08:00 is het nog de nacht van gisteren. */
export function huidigeAvond(nu: Date): Date {
  const a = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())
  if (nu.getHours() < 8) a.setDate(a.getDate() - 1)
  return a
}

export function nacht(uren: Uur[], lat: number, lon: number, avond: Date, nu?: Date): Nacht {
  const van = new Date(avond.getFullYear(), avond.getMonth(), avond.getDate(), 12).getTime()
  const tot = van + 21 * uurMs // tot 09:00 de volgende ochtend
  const deze = uren.filter(u => u.t.getTime() >= van && u.t.getTime() < tot)
  const iDonker = deze.map((u, i) => u.licht !== 'dag' ? i : -1).filter(i => i >= 0)
  const lijn = iDonker.length
    ? deze.slice(Math.max(0, iDonker[0] - 1), iDonker[iDonker.length - 1] + 2)
    : []
  const donker = lijn.filter(u => u.licht !== 'dag')
  /* Voor het venster telt alleen wat nog komt: om 02:00 heb je niets aan 21:00. */
  const nog = nu ? donker.filter(u => u.t.getTime() + uurMs > nu.getTime()) : donker

  let score = 0
  for (let i = 0; i < nog.length; i++) {
    const blok = nog.slice(i, i + 3)
    score = Math.max(score, Math.round(blok.reduce((s, u) => s + u.score, 0) / blok.length))
  }

  /* Het venster: de langste aaneengesloten reeks uren van 60 of beter.
     Bij gelijke lengte de vroegste — dan hoef je niet om vier uur op. */
  let venster: Nacht['venster'] = null
  let run: Uur[] = []
  const sluit = () => {
    if (run.length && (!venster || run.length > (venster.tot.getTime() - venster.van.getTime()) / uurMs)) {
      venster = {
        van: run[0].t,
        tot: new Date(run[run.length - 1].t.getTime() + uurMs),
        score: Math.round(run.reduce((s, u) => s + u.score, 0) / run.length),
      }
    }
    run = []
  }
  for (const u of nog) { if (u.score >= 60) run.push(u); else sluit() }
  sluit()

  const middernacht = new Date(van + 12 * uurMs)
  const gem = (f: (u: Uur) => number) => donker.length ? Math.round(donker.reduce((s, u) => s + f(u), 0) / donker.length) : 0
  return {
    avond, uren: lijn, donker, score, venster,
    wolk: gem(u => u.wolk), wind: gem(u => u.wind),
    verlicht: moonIllumination(middernacht),
    grenzen: nachtgrenzen(lat, lon, avond),
  }
}

export function oordeel(score: number): string {
  return score >= 80 ? 'Uitstekend' : score >= 60 ? 'Goed' : score >= 40 ? 'Matig' : score >= 20 ? 'Slecht' : 'Onmogelijk'
}

const hhmm = (d: Date) => d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

/** Eén zin, het antwoord op "wordt het helder?". */
export function kopzin(n: Nacht): string {
  const v = n.venster
  if (v) {
    const uren = (v.tot.getTime() - v.van.getTime()) / uurMs
    if (n.donker.length && uren >= n.donker.length - 1) return 'De hele nacht helder'
    if (uren >= 2) return `Helder van ${hhmm(v.van)} tot ${hhmm(v.tot)}`
    return `Kort helder rond ${hhmm(v.van)}`
  }
  if (n.score >= 40) return 'Wisselend bewolkt, met opklaringen'
  if (n.donker.some(u => u.regen >= 50)) return 'Regen en wolken, binnen blijven'
  return 'Bewolkt, vannacht geen sterren'
}

export { hhmm }
