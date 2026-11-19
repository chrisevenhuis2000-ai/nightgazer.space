// ── Gedeelde sterrenkijk-data en rekenlogica ───────────────────────────────
// Bron voor app/sterrenkijken/Belichtingstabel.tsx en de homepage-
// instrumenten: locaties, donkere plekken, zwermen, score en maanfase.

import type { CalEvent } from './ics'

// ── Types ───────────────────────────────────────────────────────────────────

export interface Location { lat: number; lon: number; name: string }
export interface WeatherData {
  cloud_cover: number; temperature_2m: number; relative_humidity_2m: number
  wind_speed_10m: number; visibility: number
}
export interface ScoreData { score: number; label: string; color: string; weather: WeatherData | null }
export interface DayForecast { date: Date; score: number; color: string; label: string; cloud: number; moonPhase: number }

export const PRESET_LOCATIONS: Location[] = [
  { lat: 53.1439, lon: 6.2642,  name: 'Marum, Groningen' },
  { lat: 53.2194, lon: 6.5665,  name: 'Groningen' },
  { lat: 52.3676, lon: 4.9041,  name: 'Amsterdam' },
  { lat: 52.0907, lon: 5.1214,  name: 'Utrecht' },
  { lat: 51.4416, lon: 5.4697,  name: 'Eindhoven' },
  { lat: 52.2215, lon: 6.8937,  name: 'Enschede' },
  { lat: 51.9225, lon: 4.4792,  name: 'Rotterdam' },
  { lat: 53.2012, lon: 5.7999,  name: 'Leeuwarden' },
  { lat: 52.5200, lon: 13.4050, name: 'Berlijn, DE' },
  { lat: 51.5074, lon: -0.1278, name: 'Londen, UK' },
  { lat: 48.8566, lon: 2.3522,  name: 'Parijs, FR' },
]

export const DARK_SPOTS = [
  { name: 'Terschelling',    lat: 53.43, lon: 5.35, bortle: '2–3', desc: 'Het donkerste stuk Nederland. Spectaculair voor Melkweg-fotografie.',            tip: 'Boschplaat aan de oostkant is het donkerst. Neem warme kleding mee!' },
  { name: 'Spiekeroog (DE)', lat: 53.77, lon: 7.69, bortle: '2–3', desc: 'IDA-gecertificeerd Dark Sky-eiland in Duitsland. Extreem donker.',               tip: 'Veerboot vanuit Neuharlingersiel. Perfecte Melkweg-conditie!' },
  { name: 'Lauwersmeer',     lat: 53.36, lon: 6.20, bortle: '3–4', desc: 'Nationaal Park, officieel Dark Sky Park. Beste locatie in Noord-Nederland.',       tip: 'Ga naar de zuidkant van het meer voor de minste lichtvervuiling.' },
  { name: 'Bargerveen',      lat: 52.68, lon: 7.03, bortle: '3–4', desc: 'Groot natuurgebied in Zuidoost-Drenthe, ver van grote steden.',                   tip: 'Combineer met een bezoek aan het veenmuseum overdag.' },
  { name: 'Bourtangermoor',  lat: 53.01, lon: 7.20, bortle: '3–4', desc: 'Grensgebied Drenthe/Duitsland, zeer weinig lichtvervuiling.',                     tip: 'Net over de Duitse grens is het nog donkerder.' },
  { name: 'Fochteloërveen',  lat: 52.96, lon: 6.38, bortle: '4',   desc: 'Hoogveengebied met weinig lichtvervuiling. Dichtbij en toegankelijk.',            tip: 'Vlak terrein = groot hemelbereik. Parkeer bij de ingang.' },
]

/* Het jaar waarop de piekdata en de conditie-inschatting hieronder slaan.
   Eén plek om bij te werken; de agenda leidt er de echte datum uit af in
   plaats van hem te raden. */
export const SHOWER_YEAR = 2026

export const METEORS = [
  { name: 'Quadrantiden',  peak: '3–4 jan',   day: 3,  zhr: 110, rating: 1, month: 1,  radiant: 'Ossenhoeder',  note: 'Volle maan verstoorde het zicht volledig' },
  { name: 'Lyriden',       peak: '21–22 apr',  day: 21, zhr: 18,  rating: 4, month: 4,  radiant: 'Lier',         note: 'Donkere hemel! Beste na middernacht' },
  { name: 'Eta Aquariden', peak: '5–6 mei',    day: 5,  zhr: 50,  rating: 2, month: 5,  radiant: 'Waterman',     note: 'Maanlicht verstoort helaas veel' },
  { name: 'Perseïden',     peak: '12–13 aug',  day: 12, zhr: 100, rating: 5, month: 8,  radiant: 'Perseus',      note: 'BESTE KANS 2026! Nieuwe maan = perfecte condities' },
  { name: 'Draconiden',    peak: '8–9 okt',    day: 8,  zhr: 10,  rating: 3, month: 10, radiant: 'Draak', vroeg: true, note: 'Klein maar donkere hemel, vroege avond' },
  { name: 'Orioniden',     peak: '21 okt',     day: 21, zhr: 20,  rating: 2, month: 10, radiant: 'Orion',        note: 'Maanlicht hindert, alleen helderste zichtbaar' },
  { name: 'Leoniden',      peak: '16–17 nov',  day: 16, zhr: 15,  rating: 3, month: 11, radiant: 'Leeuw',        note: 'Halve maan, redelijke condities', gids: '/gidsen/leoniden/' },
  { name: 'Geminiden',     peak: '13–14 dec',  day: 13, zhr: 150, rating: 5, month: 12, radiant: 'Tweelingen',   note: 'Grootste shower! Minimaal maanlicht', gids: '/gidsen/geminiden/' },
  { name: 'Ursiden',       peak: '21–22 dec',  day: 21, zhr: 10,  rating: 1, month: 12, radiant: 'Kleine Beer',  note: 'Bijna volle maan, lastig' },
]

export type Shower = (typeof METEORS)[number]

/**
 * Het kijkvenster op de piekavond. De meeste zwermen zijn het best na
 * middernacht, wanneer je je aan de voorkant van de Aarde bevindt en er
 * frontaal in vliegt. De Draconiden zijn de uitzondering: hun radiant staat
 * bij het invallen van de duisternis het hoogst en zakt daarna, dus daar is
 * 22:00 al aan de late kant.
 */
export function showerWindow(s: Shower, year = SHOWER_YEAR): { start: Date; end: Date } {
  const vroeg = 'vroeg' in s && s.vroeg
  const start = new Date(year, s.month - 1, s.day, vroeg ? 20 : 22, 0, 0)
  return { start, end: new Date(start.getTime() + (vroeg ? 3 : 4) * 3600_000) }
}

/** Een zwerm als agenda-item. Gedeeld door de Hemelagenda op /sterrenkijken
    en scripts/generate-agenda.mjs (het vaste bestand /agenda/meteorenzwermen.ics). */
export function zwermAgenda(s: Shower, year = SHOWER_YEAR): CalEvent {
  const { start, end } = showerWindow(s, year)
  return {
    uid: `${s.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}@nightgazer.space`,
    title: `${s.name} — piek (tot ${s.zhr}/uur)`,
    description:
      (year === SHOWER_YEAR ? `${s.note}\n\n` : `Piek rond ${s.peak}; de precieze datum en de maanstand volgen op nightgazer.space.\n\n`)
      + `Tot ${s.zhr} meteoren per uur bij een ideaal donkere hemel; in de praktijk minder.\n`
      + `De radiant ligt in ${s.radiant}, maar kijk daar juist niet strak naar — `
      + `de mooiste sporen zie je er een stuk vandaan.\n\n`
      + `Kijken kan van ${start.getHours()}:00 tot ${end.getHours()}:00. `
      + `Geen telescoop of verrekijker: je ogen vangen het meeste. `
      + `Geef ze twintig minuten om aan het donker te wennen en kijk niet op je telefoon.\n\n`
      + `nightgazer.space/sterrenkijken`,
    url: 'https://nightgazer.space/sterrenkijken/',
    allDay: false,
    start,
    end,
    remindDays: 1,
  }
}

export interface HemelObject { obj: string; where: string; mag?: string; tip: string }

// ── Planeten per maand ────────────────────────────────────────────────────
// Uitgerekend met astronomy-engine voor Utrecht (52,09 N 5,12 O), half van
// de maand, tijden in Nederlandse tijd. Een planeet staat erin als hij op een
// gewone kijktijd minstens 10 graden boven de horizon staat. Na december 2027
// valt de lijst terug op de diepe hemel; vul hem dan aan.
// (Persona-rapport 19-11-2026: de oude lijst zette Jupiter in november hoog
// in het zuiden en Saturnus aan de ochtendhemel. Dat was andersom.)

const J = 'Jupiter', S = 'Saturnus', M = 'Mars', V = 'Venus'
const TIP_J = 'Met een verrekijker zie je zijn vier grootste manen als stipjes op een rij.'
const TIP_S = 'Een kleine telescoop toont de ringen al los van de bol.'
const TIP_M = 'Herken hem aan zijn oranje kleur. Hij fonkelt niet, zoals planeten.'
const TIP_V = 'Het felste puntje aan de hemel na de maan. Kijk nooit naar Venus als de zon nog boven is.'

export const PLANETEN: Record<string, HemelObject[]> = {
  '2026-09': [
    { obj: S, where: 'De hele nacht, rond 01:00 hoog in het zuiden (Walvis)', mag: '0.3', tip: TIP_S },
    { obj: M, where: 'Ochtend, hoog in het oosten rond 06:00 (Tweelingen)', mag: '1.2', tip: TIP_M },
    { obj: J, where: 'Ochtend, laag in het oosten voor zonsopkomst (Kreeft)', mag: '–1.8', tip: TIP_J },
  ],
  '2026-10': [
    { obj: S, where: 'Avond en nacht, rond 23:00 op zijn hoogst in het zuiden (Walvis)', mag: '0.3', tip: TIP_S },
    { obj: J, where: 'Ochtend, komt rond 01:00 op in het oosten (Leeuw)', mag: '–1.9', tip: TIP_J },
    { obj: M, where: 'Ochtend, hoog in het zuidoosten rond 06:00 (Kreeft)', mag: '1.0', tip: TIP_M },
  ],
  '2026-11': [
    { obj: S, where: 'Avond, rond 21:00 op zijn hoogst in het zuiden (Walvis)', mag: '0.5', tip: TIP_S },
    { obj: J, where: 'Na middernacht in het oosten, rond 06:00 hoog in het zuiden (Leeuw)', mag: '–2.1', tip: TIP_J },
    { obj: M, where: 'Vlak naast Jupiter in de Leeuw, ochtend in het zuiden', mag: '0.7', tip: 'Op 16 november staan Mars en Jupiter maar 1,2 graad uit elkaar.' },
    { obj: V, where: 'Ochtendster, laag in het zuidoosten een uur voor zonsopkomst', mag: '–4.8', tip: TIP_V },
  ],
  '2026-12': [
    { obj: S, where: 'Begin van de avond in het zuiden, onder voor middernacht (Walvis)', mag: '0.7', tip: TIP_S },
    { obj: J, where: 'Komt rond 22:00 op, ochtend hoog in het zuiden (Leeuw)', mag: '–2.3', tip: TIP_J },
    { obj: M, where: 'Komt rond 22:30 op, ochtend hoog in het zuiden (Leeuw)', mag: '0.2', tip: 'Mars wordt deze winter elke week helderder, op weg naar februari.' },
    { obj: V, where: 'Ochtendster, laag in het zuidoosten voor zonsopkomst', mag: '–4.8', tip: TIP_V },
  ],
  '2027-01': [
    { obj: J, where: 'Vanaf 21:00 in het oosten, de rest van de nacht te zien (Leeuw)', mag: '–2.5', tip: TIP_J },
    { obj: M, where: 'Naast Jupiter in de Leeuw, vanaf 21:00 in het oosten', mag: '–0.5', tip: TIP_M },
    { obj: S, where: 'Begin van de avond in het zuidwesten (Walvis)', mag: '0.7', tip: TIP_S },
    { obj: V, where: 'Ochtendster, laag in het zuidoosten voor zonsopkomst', mag: '–4.4', tip: TIP_V },
  ],
  '2027-02': [
    { obj: J, where: 'De hele nacht, op 11 februari in oppositie (Leeuw)', mag: '–2.6', tip: 'Zo helder wordt Jupiter dit jaar niet meer. ' + TIP_J },
    { obj: M, where: 'De hele nacht, op 19 februari in oppositie (Leeuw)', mag: '–1.2', tip: 'Mars staat zo dicht bij als het dit jaar kan. Met een telescoop zie je soms een poolkap.' },
    { obj: S, where: 'Laag in het westen na de schemering (Walvis)', mag: '0.7', tip: 'Zijn laatste weken aan de avondhemel.' },
  ],
  '2027-03': [
    { obj: J, where: 'Avond hoog in het zuidoosten, rond 23:00 op zijn hoogst (Leeuw)', mag: '–2.4', tip: TIP_J },
    { obj: M, where: 'Avond, vlak bij Jupiter in de Leeuw', mag: '–0.8', tip: TIP_M },
  ],
  '2027-04': [
    { obj: J, where: 'Begin van de avond hoog in het zuiden, onder rond 04:00 (Kreeft)', mag: '–2.2', tip: TIP_J },
    { obj: M, where: 'Avond, hoog in het zuiden (Leeuw)', mag: '0.0', tip: TIP_M },
  ],
  '2027-05': [
    { obj: J, where: 'Avond in het zuidwesten (Leeuw)', mag: '–2.0', tip: TIP_J },
    { obj: M, where: 'Avond in het zuidwesten (Leeuw)', mag: '0.5', tip: TIP_M },
  ],
  '2027-06': [
    { obj: J, where: 'Laag in het westen kort na zonsondergang (Leeuw)', mag: '–1.9', tip: 'Zijn laatste weken aan de avondhemel.' },
    { obj: M, where: 'Avond in het zuidwesten (Leeuw)', mag: '0.9', tip: TIP_M },
    { obj: S, where: 'Ochtend, laag in het oosten voor zonsopkomst (Vissen)', mag: '0.5', tip: TIP_S },
  ],
  '2027-07': [
    { obj: S, where: 'Na middernacht in het oosten, ochtend in het zuidoosten (Vissen)', mag: '0.4', tip: TIP_S },
    { obj: M, where: 'Laag in het westen na de schemering (Maagd)', mag: '1.2', tip: TIP_M },
  ],
  '2027-08': [
    { obj: S, where: 'Vanaf 23:00 in het oosten, ochtend hoog in het zuiden (Vissen)', mag: '0.3', tip: TIP_S },
  ],
  '2027-09': [
    { obj: S, where: 'Bijna de hele nacht, rond 02:00 op zijn hoogst (Vissen)', mag: '0.1', tip: TIP_S },
  ],
  '2027-10': [
    { obj: S, where: 'De hele nacht, op 18 oktober in oppositie (Vissen)', mag: '–0.1', tip: 'Zo helder wordt Saturnus dit jaar niet meer. ' + TIP_S },
    { obj: J, where: 'Ochtend, laag in het oosten vanaf 04:00 (Leeuw)', mag: '–1.7', tip: TIP_J },
  ],
  '2027-11': [
    { obj: S, where: 'Avond, rond 23:00 op zijn hoogst in het zuiden (Vissen)', mag: '0.1', tip: TIP_S },
    { obj: J, where: 'Ochtend in het zuidoosten (Leeuw)', mag: '–1.9', tip: TIP_J },
  ],
  '2027-12': [
    { obj: S, where: 'Avond, rond 21:00 hoog in het zuiden (Vissen)', mag: '0.3', tip: TIP_S },
    { obj: J, where: 'Na middernacht op, ochtend in het zuidoosten (Maagd)', mag: '–2.0', tip: TIP_J },
  ],
}

// ── Diepe hemel per seizoen ───────────────────────────────────────────────
// Elk jaar gelijk, dus per maandnummer. Richting voor de vroege avond.

export const DIEPE_HEMEL: (HemelObject & { months: number[] })[] = [
  { obj: 'Andromedanevel (M31)', where: 'In de herfst \'s avonds bijna recht boven je', tip: 'Onder een donkere hemel met het blote oog een vaag langwerpig vlekje. Ons buurstelsel, 2,5 miljoen lichtjaar ver.', months: [9,10,11,12] },
  { obj: 'Zevengesternte (M45)', where: 'In de Stier, \'s avonds in het oosten, later hoog in het zuiden', tip: 'Met het blote oog zie je er zes of zeven, met een verrekijker tientallen.', months: [10,11,12,1,2,3] },
  { obj: 'Orionnevel (M42)', where: 'Onder de gordel van Orion, in de winter \'s avonds in het zuiden', tip: 'Door elke verrekijker een grijze gloed. Een telescoop toont vier sterretjes in het hart.', months: [12,1,2,3] },
  { obj: 'Dubbele Sterrenhoop', where: 'Tussen Cassiopeia en Perseus, hoog in het noordoosten', tip: 'Twee sterrenhopen naast elkaar in één verrekijkerbeeld.', months: [9,10,11,12,1] },
  { obj: 'Bolhoop M13', where: 'In Hercules, hoog aan de hemel', tip: 'Met een verrekijker een wazig bolletje, met een telescoop vanaf 200 mm losse sterren aan de rand.', months: [4,5,6,7,8,9] },
  { obj: 'Zomerdriehoek', where: 'Vega, Deneb en Altair, hoog aan de hemel', tip: 'Drie heldere sterren als grote driehoek. De Melkweg loopt er dwars doorheen.', months: [5,6,7,8,9,10] },
  { obj: 'Melkweg', where: 'Van noordoost naar zuid, op een donkere plek', tip: 'Alleen ver van de stad en zonder maan, bijvoorbeeld op Terschelling of bij het Lauwersmeer.', months: [7,8,9] },
]

/** Wat er in een maand (YYYY-MM) te zien is: eerst de planeten, dan de diepe hemel. */
export function hemelVoorMaand(sleutel: string): HemelObject[] {
  const maand = Number(sleutel.slice(5, 7))
  return [...(PLANETEN[sleutel] ?? []), ...DIEPE_HEMEL.filter(o => o.months.includes(maand))]
}

export const BORTLE_COLORS: Record<string, string> = { '2–3': '#3ddf90', '3–4': '#d4a84b', '4': '#378ADD', '5': '#8A9BC4' }

// ── Helpers ─────────────────────────────────────────────────────────────────

export function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
}

export function calcScore(w: WeatherData): ScoreData {
  let score = 100
  const { cloud_cover: cc, relative_humidity_2m: hum, wind_speed_10m: wind, temperature_2m: temp } = w
  if (cc > 80) score -= 50; else if (cc > 60) score -= 35; else if (cc > 40) score -= 20; else if (cc > 20) score -= 8
  if (hum > 90) score -= 15; else if (hum > 80) score -= 8
  if (wind > 30) score -= 15; else if (wind > 20) score -= 8
  if (temp < -5) score -= 5
  score = Math.max(0, Math.min(100, score))
  const label = score >= 80 ? 'Uitstekend' : score >= 60 ? 'Goed' : score >= 40 ? 'Matig' : score >= 20 ? 'Slecht' : 'Onmogelijk'
  const color = score >= 80 ? '#3ddf90' : score >= 60 ? '#d4a84b' : score >= 40 ? '#ff8a60' : '#e05040'
  return { score, label, color, weather: w }
}

export function getMoonPhase(date: Date): number {
  const KNOWN_NEW_MOON_MS = new Date('2000-01-06T18:14:00Z').getTime()
  const SYNODIC_MS = 29.53059 * 24 * 3600 * 1000
  return (((date.getTime() - KNOWN_NEW_MOON_MS) % SYNODIC_MS) + SYNODIC_MS) % SYNODIC_MS / SYNODIC_MS
}
