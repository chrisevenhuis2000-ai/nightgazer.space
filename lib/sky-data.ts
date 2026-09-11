// ── Gedeelde sterrenkijk-data en rekenlogica ───────────────────────────────
// Uit app/sterrenkijken/SterrenkijkenClient.tsx getrokken zodat de live
// pagina en de /staging-rework uit één bron lezen.

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
  { name: 'Spiekeroog (DE)', lat: 53.77, lon: 7.69, bortle: '2–3', desc: 'IDA-gecertificeerd Dark Sky eiland in Duitsland. Extreem donker.',               tip: 'Veerboot vanuit Neuharlingersiel. Perfecte Melkweg-conditie!' },
  { name: 'Lauwersmeer',     lat: 53.36, lon: 6.20, bortle: '3–4', desc: 'Nationaal Park, officieel Dark Sky Park. Beste locatie in Noord-Nederland.',       tip: 'Ga naar de zuidkant van het meer voor minste lichtvervuiling.' },
  { name: 'Bargerveen',      lat: 52.68, lon: 7.03, bortle: '3–4', desc: 'Groot natuurgebied in Zuidoost-Drenthe, ver van grote steden.',                   tip: 'Combineer met een bezoek aan het veenmuseum overdag.' },
  { name: 'Bourtangermoor',  lat: 53.01, lon: 7.20, bortle: '3–4', desc: 'Grensgebied Drenthe/Duitsland, zeer weinig lichtvervuiling.',                     tip: 'Net over de Duitse grens is het nog donkerder.' },
  { name: 'Fochteloërveen',  lat: 52.96, lon: 6.38, bortle: '4',   desc: 'Hoogveengebied met weinig lichtvervuiling. Dichtbij en toegankelijk.',            tip: 'Vlak terrein = groot hemelbereik. Parkeer bij de ingang.' },
]

export const METEORS = [
  { name: 'Quadrantiden',  peak: '3–4 jan',   zhr: 110, rating: 1, month: 1,  note: 'Volle maan verstoorde zicht volledig' },
  { name: 'Lyriden',       peak: '21–22 apr',  zhr: 18,  rating: 4, month: 4,  note: 'Donkere hemel! Beste na middernacht' },
  { name: 'Eta Aquariden', peak: '5–6 mei',    zhr: 50,  rating: 2, month: 5,  note: 'Maanlicht verstoort helaas veel' },
  { name: 'Perseïden',     peak: '12–13 aug',  zhr: 100, rating: 5, month: 8,  note: 'BESTE KANS 2026! Nieuwe maan = perfecte condities' },
  { name: 'Draconiden',    peak: '8–9 okt',    zhr: 10,  rating: 3, month: 10, note: 'Klein maar donkere hemel, vroege avond' },
  { name: 'Orioniden',     peak: '21 okt',     zhr: 20,  rating: 2, month: 10, note: 'Maanlicht hindert, alleen helderste zichtbaar' },
  { name: 'Leoniden',      peak: '16–17 nov',  zhr: 15,  rating: 3, month: 11, note: 'Halve maan, redelijke condities' },
  { name: 'Geminiden',     peak: '13–14 dec',  zhr: 150, rating: 5, month: 12, note: 'Grootste shower! Minimale maanlicht' },
  { name: 'Ursiden',       peak: '21–22 dec',  zhr: 10,  rating: 1, month: 12, note: 'Bijna volle maan, lastig' },
]

export const SEASONS = [
  { name: 'Melkweg Seizoen',         icon: '🌌', months: [3,4,5,6,7,8,9,10], color: '#c080ff', targets: 'Galactische kern, Sagittarius sterrenwolk, Rho Ophiuchi',          tip: 'Beste na middernacht bij nieuwe maan. Ga naar Lauwersmeer of Terschelling.' },
  { name: 'Nevelseizoen — Winter',   icon: '✨', months: [11,12,1,2,3],      color: '#ff8a60', targets: 'Orionnevel (M42), Paardekopnevel, Rosette-nevel, Krab-nevel (M1)',  tip: 'Orionnevel is prachtig door telescoop! Kijk richting het zuiden na 21:00.' },
  { name: 'Nevelseizoen — Zomer',    icon: '🔴', months: [5,6,7,8,9],        color: '#d4a84b', targets: 'Sluiernevel, NGC 7000, Lagune-nevel (M8), Ring-nevel (M57)',         tip: 'Ring-nevel (M57) in Lier is compact maar helder — prachtig door telescoop!' },
  { name: 'Sterrenstelsel Seizoen',  icon: '🔭', months: [3,4,5],            color: '#7aadff', targets: 'M31 Andromeda, M51 Draaikolk, M81/M82 Bode, M104 Sombrero',        tip: 'Andromedanevel is nog zichtbaar in het westen in maart.' },
  { name: 'Bolvormige Sterrenhopen', icon: '⭐', months: [5,6,7,8,9],        color: '#3ddf90', targets: 'M13 Hercules, M5 Slang, M22 Schutter, M92 Hercules',               tip: 'M13 is een must! Zichtbaar met verrekijker als wazig vlekje.' },
]

export const SKY_OBJECTS = [
  { obj: 'Jupiter',          where: 'Hoog in het zuiden, in Gemini',              mag: '–2.3', icon: '♃', tip: 'Perfect voor je telescoop! Probeer de Galileïsche manen.',                                 months: [11,12,1,2,3,4,5] },
  { obj: 'Venus',            where: 'Laag in het westen na zonsondergang',         mag: '–3.9', icon: '♀', tip: 'Schitterend helder, maar zakt snel onder de horizon.',                                    months: [1,2,3,4,5] },
  { obj: 'Saturnus',         where: 'Aan de ochtendhemel in het zuidoosten',       mag: '0.8',  icon: '♄', tip: 'Ringen zichtbaar door telescoop! Zoek naar de karakteristieke ringvorm.',                  months: [8,9,10,11,12,1] },
  { obj: 'Mars',             where: 'Aan de ochtendhemel voor zonsopkomst',        mag: '1.4',  icon: '♂', tip: 'Beter zichtbaar later dit jaar.',                                                         months: [3,4,5,6] },
  { obj: 'Orionnevel (M42)', where: 'Hoog in het zuidwesten (Orion)',              mag: '',     icon: '⭐', tip: 'Prachtig door elke telescoop! Orion is \'s nachts hoog zichtbaar.',                      months: [11,12,1,2,3] },
  { obj: 'Pleiaden (M45)',   where: 'In Stier, laag in het westen',               mag: '',     icon: '✨', tip: 'Met het blote oog zichtbaar als wazig vlekje — prachtig door verrekijker!',               months: [10,11,12,1,2,3] },
  { obj: 'Hercules (M13)',   where: 'Hoog aan de hemel in Hercules',               mag: '',     icon: '⭐', tip: 'Bolvormige sterrenhoop! Zichtbaar met verrekijker als wazig bolletje.',                   months: [4,5,6,7,8,9] },
  { obj: 'Zomerse Driehoek', where: 'Hoog aan de hemel (Vega, Deneb, Altair)',    mag: '',     icon: '△', tip: 'Drie heldere sterren als grote driehoek. De Melkweg loopt er dwars doorheen!',            months: [5,6,7,8,9,10] },
  { obj: 'Melkwegkern',      where: 'Laag in het zuiden (Boogschutter)',           mag: '',     icon: '🌌', tip: 'Beste na middernacht op een donkere locatie. Ga naar Terschelling of Lauwersmeer!',       months: [5,6,7,8,9] },
  { obj: 'Andromeda (M31)',  where: 'In het noordoosten (Andromeda)',              mag: '',     icon: '🔭', tip: 'Met het blote oog zichtbaar als wazig vlekje op donkere locaties. Ons buurstelsel!',     months: [8,9,10,11,12] },
]

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
