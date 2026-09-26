// ── ISS-overkomsten: wanneer je hem echt kunt zien ────────────────────────
//
// Coördinaten zeggen niemand iets. Wat telt is: hoe laat moet ik naar buiten,
// waar aan de hemel, hoe lang, en hoe helder. Dat vraagt drie dingen die
// tegelijk waar moeten zijn:
//
//   1. het ISS staat boven je horizon
//   2. het ISS hangt in de zon, want het heeft geen eigen licht
//   3. bij jou is het donker, anders verdrink je het in daglicht
//
// Voorwaarde 2 is waarom overkomsten altijd in de uren na zonsondergang of
// voor zonsopkomst vallen, en waarom een pass midden in de nacht vaak
// halverwege dooft: het ISS vliegt dan de aardschaduw in.
//
// De baanberekening gaat via SGP4 (satellite.js) op een verse TLE van
// Celestrak. Gecontroleerd tegen de gemelde positie: hoogte klopt op 0,1 km.

import {
  twoline2satrec, propagate, gstime, eciToEcf, ecfToLookAngles, geodeticToEcf,
  ecfToEci, degreesToRadians,
  type SatRec,
} from 'satellite.js'
import { sunAltitude, sunPosition } from './sky-chart'

export const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle'
const TLE_CACHE = 'nightgazer_iss_tle'
/* Een TLE van een halve dag oud is voor het ISS ruim nauwkeurig genoeg;
   vaker ophalen belast Celestrak zonder dat het iets oplevert. */
const TLE_MAX_LEEFTIJD = 12 * 3600 * 1000

const AU_KM = 149597870.7
const R_AARDE = 6378.137
const R2D = 180 / Math.PI
const D2R = Math.PI / 180

/** De zon als vector in hetzelfde ECI-stelsel waarin SGP4 rekent. */
function zonVector(t: Date): [number, number, number] {
  const { ra, dec } = sunPosition(t)
  const r = ra * D2R, d = dec * D2R
  return [
    AU_KM * Math.cos(d) * Math.cos(r),
    AU_KM * Math.cos(d) * Math.sin(r),
    AU_KM * Math.sin(d),
  ]
}

/**
 * Staat de satelliet in de aardschaduw? Cilindermodel: projecteer de
 * satellietpositie op de zonrichting. Wijst die naar de zon toe, dan hangt
 * hij aan de dagzijde en is hij sowieso verlicht. Anders telt alleen hoe ver
 * hij van de schaduwas af staat — binnen een aardstraal is het donker.
 *
 * De halfschaduw wordt genegeerd. Die is voor een baan op 420 km hooguit een
 * paar seconden breed en dus smaller dan de stap waarop hier gerekend wordt.
 */
function inSchaduw(sat: [number, number, number], zon: [number, number, number]): boolean {
  const n = Math.hypot(zon[0], zon[1], zon[2])
  const z: [number, number, number] = [zon[0] / n, zon[1] / n, zon[2] / n]
  const proj = sat[0] * z[0] + sat[1] * z[1] + sat[2] * z[2]
  if (proj > 0) return false
  const dx = sat[0] - proj * z[0]
  const dy = sat[1] - proj * z[1]
  const dz = sat[2] - proj * z[2]
  return Math.hypot(dx, dy, dz) < R_AARDE
}

export interface Tle { naam: string; l1: string; l2: string; opgehaald: number }

/** Haalt de TLE op, met een bewaarde kopie als die nog vers genoeg is. */
export async function haalTle(signal?: AbortSignal): Promise<Tle> {
  try {
    const raw = localStorage.getItem(TLE_CACHE)
    if (raw) {
      const t = JSON.parse(raw) as Tle
      if (t.l1 && t.l2 && Date.now() - t.opgehaald < TLE_MAX_LEEFTIJD) return t
    }
  } catch { /* geen bewaarde kopie, gewoon ophalen */ }

  const res = await fetch(TLE_URL, { signal })
  if (!res.ok) throw new Error(`Celestrak ${res.status}`)
  const regels = (await res.text()).trim().split('\n').map(r => r.trim())
  const l1 = regels.find(r => r.startsWith('1 '))
  const l2 = regels.find(r => r.startsWith('2 '))
  if (!l1 || !l2) throw new Error('geen TLE in het antwoord')

  const tle: Tle = { naam: regels[0] || 'ISS (ZARYA)', l1, l2, opgehaald: Date.now() }
  try { localStorage.setItem(TLE_CACHE, JSON.stringify(tle)) } catch { /* niet erg */ }
  return tle
}

/** Het tijdstip waarop de baanelementen zijn vastgesteld. */
export function tleEpoch(l1: string): Date {
  const jaar = Number(l1.slice(18, 20))
  const dag = Number(l1.slice(20, 32))
  const volJaar = jaar < 57 ? 2000 + jaar : 1900 + jaar
  return new Date(Date.UTC(volJaar, 0, 1) + (dag - 1) * 86400000)
}

interface Monster {
  t: Date
  alt: number      // hoogte boven de horizon, graden
  az: number
  afstand: number  // km
  verlicht: boolean
  donker: boolean  // is het bij de kijker donker genoeg
  mag: number
}

/**
 * Schijnbare helderheid. Een diffuus bolletje op afstand: de standaard-
 * magnitude van het ISS is −1,3 op 1000 km bij een fasehoek van 90°, en
 * daarvandaan schaalt het met de afstand en met hoeveel van de verlichte
 * kant je ziet. Vlak na zonsondergang, als het ISS bijna recht boven je
 * hangt en je van achteren op de zonzijde kijkt, levert dat −3,5 of beter.
 */
const STD_MAG = -1.3
function faseFunctie(psi: number): number {
  return (Math.sin(psi) + (Math.PI - psi) * Math.cos(psi)) / Math.PI
}
function magnitude(afstandKm: number, fasehoek: number): number {
  const f = Math.max(faseFunctie(fasehoek), 1e-4)
  const f90 = faseFunctie(Math.PI / 2)
  return STD_MAG + 5 * Math.log10(afstandKm / 1000) - 2.5 * Math.log10(f / f90)
}

function hoekTussen(a: number[], b: number[]): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const na = Math.hypot(a[0], a[1], a[2])
  const nb = Math.hypot(b[0], b[1], b[2])
  return Math.acos(Math.min(1, Math.max(-1, dot / (na * nb))))
}

function meet(rec: SatRec, t: Date, lat: number, lon: number): Monster | null {
  const pv = propagate(rec, t)
  if (!pv?.position) return null
  const eci = pv.position as { x: number; y: number; z: number }

  const gmst = gstime(t)
  const waarnemer = {
    longitude: degreesToRadians(lon),
    latitude: degreesToRadians(lat),
    height: 0.03,
  }
  const kijk = ecfToLookAngles(waarnemer, eciToEcf(eci, gmst))
  const alt = kijk.elevation * R2D

  const satV: [number, number, number] = [eci.x, eci.y, eci.z]
  const zonV = zonVector(t)
  const verlicht = !inSchaduw(satV, zonV)

  const obsEcf = geodeticToEcf(waarnemer)
  const obsEci = ecfToEci(obsEcf, gmst) as { x: number; y: number; z: number }
  const naarZon = [zonV[0] - satV[0], zonV[1] - satV[1], zonV[2] - satV[2]]
  const naarKijker = [obsEci.x - satV[0], obsEci.y - satV[1], obsEci.z - satV[2]]

  return {
    t,
    alt,
    az: (kijk.azimuth * R2D + 360) % 360,
    afstand: kijk.rangeSat,
    verlicht,
    donker: sunAltitude(lat, lon, t) < -6,
    mag: magnitude(kijk.rangeSat, hoekTussen(naarZon, naarKijker)),
  }
}

export interface Baanpunt { alt: number; az: number }

export interface Passage {
  start: Date; startAz: number
  top: Date; topAlt: number; topAz: number
  eind: Date; eindAz: number
  duurSec: number
  mag: number
  /** Dooft hij halverwege uit doordat hij de aardschaduw in vliegt? */
  dooft: boolean
  /** Het spoor over de hemel, om de tien seconden. */
  baan: Baanpunt[]
}

export interface Oordeel { woord: string; sterkte: 0 | 1 | 2 | 3 }

/** Een helderheid in gewone taal. Sirius is −1,4; Vega is 0,0. */
export function helderheid(mag: number): Oordeel {
  if (mag <= -3.0) return { woord: 'spectaculair helder', sterkte: 3 }
  if (mag <= -2.0) return { woord: 'heel helder', sterkte: 3 }
  if (mag <= -1.0) return { woord: 'helder', sterkte: 2 }
  if (mag <= 0.5) return { woord: 'goed te zien', sterkte: 1 }
  return { woord: 'zwak', sterkte: 0 }
}

/**
 * De hoogte waarboven een overkomst werkelijk te zien is. Onder de tien
 * graden staan er bijna altijd huizen, bomen of horizonnevel in de weg, en
 * dat is ook de grens die kijkers van andere diensten gewend zijn. De start-
 * en eindtijd die hier uitkomen zijn dus 'wanneer je hem kunt oppikken',
 * niet 'wanneer hij meetkundig boven de horizon komt' — dat scheelt bij een
 * lage overkomst zomaar vijf minuten.
 */
const MIN_ALT = 10
/** Korter dan dit is het een schampertje dat je toch niet vindt. */
const MIN_DUUR = 30

/**
 * Zoekt de zichtbare overkomsten in de komende dagen.
 *
 * Grof stappen van 30 seconden en daarna verfijnen: een overkomst boven de
 * tien graden duurt minstens een paar minuten, dus een grove stap mist er
 * geen, en het scheelt tienduizenden baanberekeningen op een telefoon.
 */
export function vindPassages(
  tle: Tle, lat: number, lon: number, dagen = 5, vanaf = new Date(),
): Passage[] {
  const rec = twoline2satrec(tle.l1, tle.l2)
  const eindTijd = vanaf.getTime() + dagen * 86400000
  const GROF = 30000
  const passages: Passage[] = []

  let lopend: Monster[] | null = null

  for (let ms = vanaf.getTime(); ms <= eindTijd; ms += GROF) {
    const t = new Date(ms)
    /* Eerst de goedkope vraag: is het bij de kijker al donker? Zo niet, dan
       hoeft de baanberekening helemaal niet te draaien. Dat scheelt op een
       telefoon het leeuwendeel van het werk, want het ISS komt overdag even
       vaak over als 's nachts — je ziet hem alleen niet. */
    if (sunAltitude(lat, lon, t) >= -6) { if (lopend) { duwPassage(passages, rec, lopend, lat, lon, GROF); lopend = null } ; continue }
    const m = meet(rec, t, lat, lon)
    if (!m) continue
    /* Grof zoeken vanaf de meetkundige horizon, zodat een overkomst die maar
       kort boven de tien graden komt niet tussen twee stappen door valt. */
    const zichtbaar = m.alt > 0 && m.verlicht && m.donker

    if (zichtbaar) {
      if (!lopend) lopend = []
      lopend.push(m)
      continue
    }
    if (lopend) { duwPassage(passages, rec, lopend, lat, lon, GROF); lopend = null }
  }
  if (lopend) duwPassage(passages, rec, lopend, lat, lon, GROF)

  return passages
}

/** Verfijnt een grof gevonden venster naar seconden en bewaart het. */
function duwPassage(
  uit: Passage[], rec: SatRec, grof: Monster[], lat: number, lon: number, stap: number,
) {
  const eerste = grof[0].t.getTime() - stap
  const laatste = grof[grof.length - 1].t.getTime() + stap
  const fijn: Monster[] = []
  let hoogsteRuw = -90
  for (let ms = eerste; ms <= laatste; ms += 1000) {
    const m = meet(rec, new Date(ms), lat, lon)
    if (!m) continue
    if (m.alt > hoogsteRuw) hoogsteRuw = m.alt
    if (m.alt >= MIN_ALT && m.verlicht && m.donker) fijn.push(m)
  }
  if (fijn.length < MIN_DUUR) return

  let top = fijn[0]
  for (const m of fijn) if (m.alt > top.alt) top = m

  /* Uitdoven: hij verdwijnt terwijl hij nog ruim boven de horizon staat, en
     was op dat moment nog niet aan het ondergaan. Dan vliegt hij de
     aardschaduw in — je ziet hem voor je ogen doven in plaats van zakken. */
  const laatsteM = fijn[fijn.length - 1]
  const dooft = laatsteM.alt > MIN_ALT + 4 && hoogsteRuw > laatsteM.alt

  uit.push({
    start: fijn[0].t, startAz: fijn[0].az,
    top: top.t, topAlt: top.alt, topAz: top.az,
    eind: laatsteM.t, eindAz: laatsteM.az,
    duurSec: Math.round((laatsteM.t.getTime() - fijn[0].t.getTime()) / 1000),
    mag: Math.min(...fijn.map(m => m.mag)),
    dooft,
    baan: fijn.filter((_, i) => i % 10 === 0 || i === fijn.length - 1)
              .map(m => ({ alt: m.alt, az: m.az })),
  })
}
