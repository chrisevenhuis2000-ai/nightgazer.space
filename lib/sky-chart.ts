// ── Zoekkaart: sterrencatalogus, projectie en zichtbaarheid ────────────────
//
// Alles hier rekent met echte posities (J2000) en echte tijd. Een zoekkaart
// die de sterren op geschatte plekken zet is erger dan geen zoekkaart, want
// je staat wel buiten in de kou.
//
// Bewust GEEN planeten. Hun positie verandert dagelijks en een nauwkeurige
// berekening vraagt VSOP87-reeksen; een benadering zou hier een verzonnen
// stip opleveren. Bovendien: een zoekkaart bestaat voor zwakke, vage dingen.
// Jupiter vind je zonder kaart — de Ringnevel niet.

export interface Star { name: string; ra: number; dec: number; mag: number; con: string }
export interface AltAz { alt: number; az: number }

const D2R = Math.PI / 180
const R2D = 180 / Math.PI
const norm360 = (x: number) => ((x % 360) + 360) % 360

/* ── Heldere sterren (J2000, RA in graden) ───────────────────────────────
   Genoeg om elk sterrenbeeld rond een doel herkenbaar te maken. Namen zijn
   de gangbare Nederlandse/internationale vorm. */
const S: [string, number, number, number, string][] = [
  // Orion
  ['Betelgeuze',  88.793,   7.407, 0.50, 'Ori'], ['Rigel',      78.634,  -8.202, 0.13, 'Ori'],
  ['Bellatrix',   81.283,   6.350, 1.64, 'Ori'], ['Saiph',      86.939,  -9.670, 2.09, 'Ori'],
  ['Alnitak',     85.190,  -1.943, 1.77, 'Ori'], ['Alnilam',    84.053,  -1.202, 1.69, 'Ori'],
  ['Mintaka',     83.002,  -0.299, 2.25, 'Ori'], ['Meissa',     83.784,   9.934, 3.39, 'Ori'],
  ['Eta Ori',     81.119,  -2.397, 3.36, 'Ori'], ['Pi3 Ori',    72.460,   6.961, 3.19, 'Ori'],
  // Stier
  ['Aldebaran',   68.980,  16.509, 0.85, 'Tau'], ['Elnath',     81.573,  28.608, 1.65, 'Tau'],
  ['Alcyone',     56.871,  24.105, 2.87, 'Tau'], ['Atlas',      57.291,  24.053, 3.63, 'Tau'],
  ['Electra',     56.219,  24.113, 3.70, 'Tau'], ['Maia',       56.457,  24.368, 3.87, 'Tau'],
  ['Merope',      56.582,  23.948, 4.18, 'Tau'], ['Zeta Tau',   84.411,  21.143, 3.00, 'Tau'],
  ['Theta Tau',   67.165,  15.871, 3.40, 'Tau'], ['Epsilon Tau',67.154,  19.180, 3.53, 'Tau'],
  ['Gamma Tau',   64.948,  15.628, 3.65, 'Tau'], ['Delta Tau',  65.734,  17.542, 3.77, 'Tau'],
  // Grote Hond / Kleine Hond
  ['Sirius',     101.287, -16.716,-1.46, 'CMa'], ['Adhara',    104.656, -28.972, 1.50, 'CMa'],
  ['Wezen',      107.098, -26.393, 1.83, 'CMa'], ['Mirzam',     95.675, -17.956, 1.98, 'CMa'],
  ['Aludra',     111.024, -29.303, 2.45, 'CMa'], ['Procyon',   114.825,   5.225, 0.34, 'CMi'],
  ['Gomeisa',    111.788,   8.289, 2.89, 'CMi'],
  // Tweelingen
  ['Pollux',     116.329,  28.026, 1.14, 'Gem'], ['Castor',    113.650,  31.888, 1.58, 'Gem'],
  ['Alhena',      99.428,  16.399, 1.93, 'Gem'], ['Mebsuta',   100.983,  25.131, 2.98, 'Gem'],
  ['Mu Gem',      95.740,  22.514, 2.88, 'Gem'], ['Eta Gem',    93.719,  22.507, 3.28, 'Gem'],
  ['Wasat',      110.031,  21.982, 3.53, 'Gem'], ['Kappa Gem',  116.112, 24.398, 3.57, 'Gem'],
  ['Tau Gem',    107.785,  30.245, 4.41, 'Gem'],
  // Voerman
  ['Capella',     79.172,  45.998, 0.08, 'Aur'], ['Menkalinan', 89.882,  44.947, 1.90, 'Aur'],
  ['Theta Aur',   89.930,  37.213, 2.62, 'Aur'], ['Iota Aur',   74.248,  33.166, 2.69, 'Aur'],
  // Perseus
  ['Mirfak',      51.081,  49.861, 1.79, 'Per'], ['Algol',      47.042,  40.956, 2.12, 'Per'],
  ['Zeta Per',    58.533,  31.884, 2.85, 'Per'], ['Epsilon Per',59.463,  40.010, 2.88, 'Per'],
  ['Delta Per',   55.731,  47.788, 3.01, 'Per'], ['Gamma Per',  46.199,  53.506, 2.93, 'Per'],
  ['Eta Per',     42.674,  55.896, 3.76, 'Per'],
  // Cassiopeia
  ['Schedar',     10.127,  56.537, 2.24, 'Cas'], ['Caph',        2.295,  59.150, 2.27, 'Cas'],
  ['Gamma Cas',   14.177,  60.717, 2.47, 'Cas'], ['Ruchbah',    21.454,  60.235, 2.68, 'Cas'],
  ['Segin',       28.599,  63.670, 3.38, 'Cas'],
  // Andromeda / Pegasus
  ['Alpheratz',    2.097,  29.090, 2.06, 'And'], ['Mirach',     17.433,  35.621, 2.06, 'And'],
  ['Almach',      30.975,  42.330, 2.10, 'And'], ['Delta And',  11.435,  30.861, 3.27, 'And'],
  ['Mu And',      14.189,  38.499, 3.86, 'And'], ['Nu And',     13.735,  41.079, 4.53, 'And'],
  ['Markab',     346.190,  15.205, 2.49, 'Peg'], ['Scheat',    345.944,  28.083, 2.42, 'Peg'],
  ['Algenib',      3.309,  15.184, 2.83, 'Peg'], ['Enif',      326.046,   9.875, 2.39, 'Peg'],
  ['Theta Peg',  340.751,   6.198, 3.53, 'Peg'],
  // Ram
  ['Hamal',       31.793,  23.463, 2.00, 'Ari'], ['Sheratan',   28.660,  20.808, 2.64, 'Ari'],
  // Grote Beer / Jachthonden
  ['Dubhe',      165.932,  61.751, 1.79, 'UMa'], ['Merak',     165.460,  56.382, 2.37, 'UMa'],
  ['Phecda',     178.458,  53.695, 2.44, 'UMa'], ['Megrez',    183.857,  57.033, 3.31, 'UMa'],
  ['Alioth',     193.507,  55.960, 1.77, 'UMa'], ['Mizar',     200.981,  54.926, 2.23, 'UMa'],
  ['Alkaid',     206.885,  49.313, 1.86, 'UMa'], ['Alcor',     201.306,  54.988, 3.99, 'UMa'],
  ['Cor Caroli', 194.007,  38.318, 2.89, 'CVn'], ['Chara',     188.435,  41.357, 4.24, 'CVn'],
  ['Polaris',     37.955,  89.264, 1.98, 'UMi'], ['Kochab',    222.676,  74.156, 2.08, 'UMi'],
  // Lier / Zwaan / Arend
  ['Vega',       279.234,  38.784, 0.03, 'Lyr'], ['Sheliak',   282.520,  33.363, 3.52, 'Lyr'],
  ['Sulafat',    284.736,  32.690, 3.24, 'Lyr'], ['Zeta Lyr',  281.193,  37.605, 4.34, 'Lyr'],
  ['Delta Lyr',  283.626,  36.899, 4.30, 'Lyr'], ['Epsilon Lyr',281.084, 39.670, 4.67, 'Lyr'],
  ['Deneb',      310.358,  45.280, 1.25, 'Cyg'], ['Sadr',      305.557,  40.257, 2.23, 'Cyg'],
  ['Gienah Cyg', 311.553,  33.970, 2.48, 'Cyg'], ['Delta Cyg', 296.244,  45.131, 2.87, 'Cyg'],
  ['Albireo',    292.680,  27.960, 3.08, 'Cyg'],
  ['Altair',     297.696,   8.868, 0.76, 'Aql'], ['Tarazed',   296.565,  10.613, 2.72, 'Aql'],
  ['Alshain',    298.828,   6.407, 3.71, 'Aql'], ['Zeta Aql',  286.353,  13.863, 2.99, 'Aql'],
  ['Delta Aql',  291.374,   3.115, 3.36, 'Aql'], ['Lambda Aql',293.090,  -4.882, 3.43, 'Aql'],
  ['Anser',      292.176,  24.665, 4.44, 'Vul'],
  // Hercules / Draak / Noorderkroon / Ossenhoeder
  ['Kornephoros',247.555,  21.490, 2.77, 'Her'], ['Zeta Her',  250.323,  31.602, 2.81, 'Her'],
  ['Pi Her',     258.758,  36.809, 3.16, 'Her'], ['Eta Her',   250.724,  38.922, 3.48, 'Her'],
  ['Epsilon Her',255.073,  30.926, 3.92, 'Her'], ['Rasalgethi',258.662,  14.390, 3.35, 'Her'],
  ['Delta Her',  258.762,  24.839, 3.12, 'Her'], ['Iota Her',  262.617,  46.006, 3.80, 'Her'],
  ['Eltanin',    269.152,  51.489, 2.23, 'Dra'], ['Rastaban',  262.608,  52.301, 2.79, 'Dra'],
  ['Thuban',     211.097,  64.376, 3.65, 'Dra'],
  ['Alphecca',   233.672,  26.715, 2.22, 'CrB'], ['Beta CrB',  231.957,  29.106, 3.66, 'CrB'],
  ['Gamma CrB',  235.073,  26.296, 3.81, 'CrB'], ['Theta CrB', 233.232,  31.359, 4.14, 'CrB'],
  ['Arcturus',   213.915,  19.182,-0.05, 'Boo'], ['Izar',      221.247,  27.074, 2.37, 'Boo'],
  ['Seginus',    218.020,  38.308, 3.03, 'Boo'], ['Nekkar',    225.487,  40.390, 3.49, 'Boo'],
  ['Mufrid',     208.671,  18.398, 2.68, 'Boo'], ['Rho Boo',   218.019,  30.371, 3.58, 'Boo'],
  ['Alkalurops', 225.085,  37.377, 4.29, 'Boo'],
  // Rasalhague / Schild / Leeuw / Kreeft
  ['Rasalhague', 263.734,  12.560, 2.08, 'Oph'], ['Cebalrai',  265.868,   4.567, 2.76, 'Oph'],
  ['Alpha Sct',  278.802, -8.244,  3.85, 'Sct'], ['Beta Sct',  280.628, -4.748,  4.22, 'Sct'],
  ['Regulus',    152.093,  11.967, 1.35, 'Leo'], ['Denebola',  177.265,  14.572, 2.14, 'Leo'],
  ['Algieba',    154.993,  19.841, 2.08, 'Leo'], ['Zosma',     168.527,  20.524, 2.56, 'Leo'],
  ['Chertan',    168.560,  15.430, 3.33, 'Leo'], ['Eta Leo',   151.833,  16.763, 3.49, 'Leo'],
  ['Asellus Bor',130.821,  21.469, 4.66, 'Cnc'], ['Asellus Aus',131.171, 18.154, 3.94, 'Cnc'],
  ['Acubens',    134.622,  11.858, 4.25, 'Cnc'], ['Iota Cnc',  131.674,  28.760, 4.02, 'Cnc'],
  // Boogschutter / Schorpioen (laag, maar de Lagunenevel staat er)
  ['Kaus Australis',276.043,-34.385,1.85, 'Sgr'], ['Nunki',     283.816, -26.297, 2.05, 'Sgr'],
  ['Kaus Media', 275.249, -29.828, 2.70, 'Sgr'], ['Kaus Bor',  276.993, -25.422, 2.81, 'Sgr'],
  ['Alnasl',     271.452, -30.424, 2.98, 'Sgr'], ['Phi Sgr',   281.414, -26.990, 3.17, 'Sgr'],
  ['Zeta Sgr',   285.653, -29.880, 2.60, 'Sgr'], ['Tau Sgr',   286.735, -27.670, 3.32, 'Sgr'],
  ['Antares',    247.352, -26.432, 1.09, 'Sco'], ['Dschubba',  240.083, -22.622, 2.29, 'Sco'],
  ['Graffias',   241.359, -19.805, 2.62, 'Sco'], ['Pi Sco',    239.713, -26.114, 2.89, 'Sco'],
  // Waterman / Vissen-hoek voor M15
  ['Sadalmelik',  331.446, -0.320, 2.95, 'Aqr'], ['Sadalsuud', 322.890,  -5.571, 2.90, 'Aqr'],
  ['Alphard',     141.897, -8.659, 1.98, 'Hya'],
]

export const STARS: Star[] = S.map(([name, ra, dec, mag, con]) => ({ name, ra, dec, mag, con }))
const byName = new Map(STARS.map(s => [s.name, s]))

/* ── Sterrenbeeldlijnen ──────────────────────────────────────────────────
   Dit maakt het verschil tussen een veld met stippen en een herkenbaar
   patroon. Zonder lijnen is een zoekkaart onleesbaar. */
const LINE_SETS: string[][] = [
  ['Betelgeuze','Bellatrix','Mintaka','Alnilam','Alnitak','Saiph'],
  ['Betelgeuze','Alnitak'], ['Bellatrix','Mintaka'], ['Rigel','Mintaka'],
  ['Saiph','Alnitak'], ['Betelgeuze','Meissa','Bellatrix'],
  ['Aldebaran','Theta Tau','Gamma Tau','Delta Tau','Epsilon Tau','Aldebaran'],
  ['Aldebaran','Zeta Tau'], ['Epsilon Tau','Elnath'],
  ['Alcyone','Atlas'], ['Alcyone','Merope'], ['Alcyone','Maia'], ['Maia','Electra'],
  ['Sirius','Mirzam'], ['Sirius','Adhara','Wezen','Aludra'], ['Sirius','Wezen'],
  ['Procyon','Gomeisa'],
  ['Castor','Pollux'], ['Castor','Tau Gem','Mebsuta','Eta Gem','Mu Gem'],
  ['Pollux','Kappa Gem','Wasat','Alhena'], ['Wasat','Mebsuta'],
  ['Capella','Menkalinan','Theta Aur','Elnath'], ['Capella','Iota Aur','Elnath'],
  ['Mirfak','Algol','Zeta Per'], ['Mirfak','Delta Per','Epsilon Per'],
  ['Mirfak','Gamma Per','Eta Per'],
  ['Caph','Schedar','Gamma Cas','Ruchbah','Segin'],
  ['Alpheratz','Delta And','Mirach','Mu And','Nu And'], ['Mirach','Almach'],
  ['Alpheratz','Algenib','Markab','Scheat','Alpheratz'], ['Markab','Enif'], ['Theta Peg','Enif'],
  ['Hamal','Sheratan'],
  ['Dubhe','Merak','Phecda','Megrez','Alioth','Mizar','Alkaid'], ['Dubhe','Megrez'],
  ['Cor Caroli','Chara'],
  ['Vega','Epsilon Lyr'], ['Vega','Zeta Lyr','Delta Lyr','Sulafat','Sheliak','Zeta Lyr'],
  ['Deneb','Sadr','Albireo'], ['Delta Cyg','Sadr','Gienah Cyg'],
  ['Altair','Tarazed'], ['Altair','Alshain'], ['Tarazed','Zeta Aql'], ['Altair','Delta Aql','Lambda Aql'],
  ['Kornephoros','Zeta Her','Eta Her','Pi Her','Epsilon Her','Zeta Her'],
  ['Kornephoros','Delta Her','Rasalgethi'], ['Pi Her','Iota Her'],
  ['Eltanin','Rastaban'],
  ['Theta CrB','Beta CrB','Alphecca','Gamma CrB'],
  ['Arcturus','Izar','Seginus','Rho Boo','Arcturus'], ['Arcturus','Mufrid'], ['Seginus','Nekkar'],
  ['Regulus','Eta Leo','Algieba','Zosma','Denebola'], ['Zosma','Chertan','Regulus'],
  ['Asellus Bor','Asellus Aus','Acubens'], ['Asellus Bor','Iota Cnc'],
  ['Alnasl','Kaus Media','Kaus Australis'], ['Kaus Media','Kaus Bor','Phi Sgr','Nunki','Zeta Sgr','Tau Sgr'],
  ['Phi Sgr','Zeta Sgr'], ['Kaus Australis','Zeta Sgr'],
  ['Graffias','Dschubba','Pi Sco'], ['Dschubba','Antares'],
]

export const LINES: [Star, Star][] = LINE_SETS.flatMap(path => {
  const out: [Star, Star][] = []
  for (let i = 0; i < path.length - 1; i++) {
    const a = byName.get(path[i]), b = byName.get(path[i + 1])
    if (a && b) out.push([a, b])
  }
  return out
})

// ── Tijd en positie ────────────────────────────────────────────────────────

/** Juliaanse dag uit een JS-Date (die al in UTC-ms rekent). */
export function julianDay(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5
}

/** Lokale sterrentijd in graden. Oosterlengte positief. */
export function localSiderealTime(d: Date, lon: number): number {
  const t = julianDay(d) - 2451545.0
  return norm360(280.46061837 + 360.98564736629 * t + lon)
}

/** Equatoriaal naar horizontaal. Azimut vanaf het noorden, met de klok mee. */
export function altAz(ra: number, dec: number, lat: number, lon: number, when: Date): AltAz {
  const H = (localSiderealTime(when, lon) - ra) * D2R
  const dr = dec * D2R, pr = lat * D2R
  const alt = Math.asin(Math.sin(dr) * Math.sin(pr) + Math.cos(dr) * Math.cos(pr) * Math.cos(H))
  const az = Math.atan2(
    -Math.cos(dr) * Math.sin(H),
    Math.sin(dr) * Math.cos(pr) - Math.cos(dr) * Math.sin(pr) * Math.cos(H),
  )
  return { alt: alt * R2D, az: norm360(az * R2D) }
}

/** Positie van de zon (laag-precisie, ruim genoeg voor schemergrenzen). */
export function sunPosition(d: Date): { ra: number; dec: number } {
  const n = julianDay(d) - 2451545.0
  const L = norm360(280.460 + 0.9856474 * n)
  const g = norm360(357.528 + 0.9856003 * n) * D2R
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R
  const eps = (23.439 - 0.0000004 * n) * D2R
  return {
    ra: norm360(Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * R2D),
    dec: Math.asin(Math.sin(eps) * Math.sin(lam)) * R2D,
  }
}

export function sunAltitude(lat: number, lon: number, when: Date): number {
  const s = sunPosition(when)
  return altAz(s.ra, s.dec, lat, lon, when).alt
}

export const KOMPAS = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'] as const
export function compass(az: number): string {
  return KOMPAS[Math.round(norm360(az) / 45) % 8]
}
/* Zestien punten voor een baan over de hemel: met acht punten staat er bij
   een korte overkomst 'ZW naar ZW', wat klopt maar leest als een fout. */
const KOMPAS16 = ['N','NNO','NO','ONO','O','OZO','ZO','ZZO','Z','ZZW','ZW','WZW','W','WNW','NW','NNW'] as const
export function compass16(az: number): string {
  return KOMPAS16[Math.round(norm360(az) / 22.5) % 16]
}

export const KOMPAS_VOLUIT: Record<string, string> = {
  N: 'het noorden', NO: 'het noordoosten', O: 'het oosten', ZO: 'het zuidoosten',
  Z: 'het zuiden', ZW: 'het zuidwesten', W: 'het westen', NW: 'het noordwesten',
}

/**
 * Het donkere venster van vannacht: van de avond waarop de zon onder -12°
 * zakt tot het moment dat hij daar weer boven komt.
 *
 * -12° (nautische schemering), niet -18°: op 52°N komt de zon rond midzomer
 * niet dieper dan -14,2°, dus met -18° zou juni en juli hier maandenlang
 * 'geen nacht' opleveren. Met -12° blijft er ook op 21 juni een echt venster
 * over (23:20-02:10 lokaal), en dat is precies wanneer je buiten staat.
 * Lukt het niet, dan geeft dit null in plaats van een verzonnen tijd.
 */
export function darkWindow(lat: number, lon: number, night: Date): { from: Date; to: Date } | null {
  const start = new Date(night.getFullYear(), night.getMonth(), night.getDate(), 15, 0, 0)
  const step = 10 * 60000
  let from: Date | null = null, to: Date | null = null
  let prev = sunAltitude(lat, lon, start)
  for (let i = 1; i <= 17 * 6; i++) {
    const t = new Date(start.getTime() + i * step)
    const a = sunAltitude(lat, lon, t)
    if (!from && prev >= -12 && a < -12) from = t
    if (from && !to && prev < -12 && a >= -12) to = t
    prev = a
  }
  return from && to ? { from, to } : null
}

// ── Doelen ─────────────────────────────────────────────────────────────────

export interface Target {
  id: string
  name: string
  cat: string           // catalogusaanduiding
  ra: number            // J2000, graden
  dec: number
  mag: number
  type: string
  con: string           // sterrenbeeld, voluit
  size: string          // schijnbare afmeting
  gear: 'oog' | 'verrekijker' | 'telescoop'
  hop: string           // hoe je er vanaf een heldere ster komt
  why: string           // wat je eigenlijk ziet
  fov: number           // straal van de kaart in graden
}

export const TARGETS: Target[] = [
  { id: 'm42', name: 'Orionnevel', cat: 'M42', ra: 83.822, dec: -5.391, mag: 4.0, type: 'Emissienevel',
    con: 'Orion', size: '65′ × 60′', gear: 'verrekijker', fov: 16,
    hop: 'Zoek de drie gordelsterren van Orion. Daaronder hangt het zwaard: drie vage puntjes. Het middelste is geen ster.',
    why: 'Een kraamkamer van sterren op 1.340 lichtjaar. Met een verrekijker zie je de nevelvlek, met een telescoop de vier sterren van het Trapezium die hem verlichten.' },
  { id: 'm45', name: 'Pleiaden', cat: 'M45', ra: 56.75, dec: 24.117, mag: 1.6, type: 'Open sterrenhoop',
    con: 'Stier', size: '110′', gear: 'oog', fov: 14,
    hop: 'Volg de V van de Hyaden bij Aldebaran naar rechtsboven. Het wazige vlekje daar is het Zevengesternte.',
    why: 'Een jonge sterrenhoop van ruim honderd sterren, zo\'n 440 lichtjaar ver. Met het blote oog tel je er zes of zeven; door een verrekijker springen het er tientallen.' },
  { id: 'm31', name: 'Andromedanevel', cat: 'M31', ra: 10.685, dec: 41.269, mag: 3.4, type: 'Spiraalstelsel',
    con: 'Andromeda', size: '190′ × 60′', gear: 'oog', fov: 18,
    hop: 'Neem de W van Cassiopeia: de scherpste punt wijst als een pijl. Volg die richting ongeveer anderhalve handbreedte.',
    why: 'Het verste dat je met het blote oog kunt zien: 2,5 miljoen lichtjaar. Het licht dat nu je netvlies raakt vertrok voordat de eerste mens bestond.' },
  { id: 'm13', name: 'Hercules-bolhoop', cat: 'M13', ra: 250.423, dec: 36.460, mag: 5.8, type: 'Bolvormige sterrenhoop',
    con: 'Hercules', size: '20′', gear: 'verrekijker', fov: 14,
    hop: 'Zoek het trapezium van Hercules, de "steen". Op de westelijke zijde, tussen de twee bovenste sterren, zit hij op een derde van boven.',
    why: 'Een bol van een half miljoen sterren, 22.000 lichtjaar ver en zo\'n 11,7 miljard jaar oud. Door een telescoop valt de rand uiteen in losse sterren.' },
  { id: 'm57', name: 'Ringnevel', cat: 'M57', ra: 283.396, dec: 33.029, mag: 8.8, type: 'Planetaire nevel',
    con: 'Lier', size: '1,4′', gear: 'telescoop', fov: 9,
    hop: 'Precies halverwege de twee onderste sterren van de kleine parallellogram onder Vega: Sheliak en Sulafat.',
    why: 'De afgestoten buitenlaag van een stervende ster, van opzij een perfecte rookring. Klein maar onmiskenbaar — over vijf miljard jaar doet onze zon dit ook.' },
  { id: 'albireo', name: 'Albireo', cat: 'β Cygni', ra: 292.680, dec: 27.960, mag: 3.1, type: 'Dubbelster',
    con: 'Zwaan', size: '35″ scheiding', gear: 'telescoop', fov: 12,
    hop: 'De kop van het Zwaan-kruis, aan de tegenovergestelde kant van Deneb. Met het blote oog één ster.',
    why: 'De mooiste kleurcontrastster aan de hemel: een gouden reus naast een blauwe metgezel. Zelfs een kleine telescoop splitst hem.' },
  { id: 'm44', name: 'Bijenkorf', cat: 'M44', ra: 130.05, dec: 19.667, mag: 3.7, type: 'Open sterrenhoop',
    con: 'Kreeft', size: '95′', gear: 'verrekijker', fov: 14,
    hop: 'Midden tussen Regulus in de Leeuw en Pollux in de Tweelingen. Op een donkere plek een wazig plekje met het blote oog.',
    why: 'Al bij de Grieken bekend als een nevelvlek; Galilei zag er in 1609 veertig sterren in. Nu tellen we er ruim duizend, op 600 lichtjaar.' },
  { id: 'dubbel', name: 'Dubbele Cluster', cat: 'NGC 869/884', ra: 34.75, dec: 57.133, mag: 4.3, type: 'Twee open hopen',
    con: 'Perseus', size: '60′', gear: 'verrekijker', fov: 12,
    hop: 'Op de lijn tussen Cassiopeia en Perseus, iets richting Perseus. Met het blote oog een lichtvlekje in de Melkweg.',
    why: 'Twee sterrenhopen die elkaar in de verrekijker in één beeld raken. Beide jong — enkele miljoenen jaren — en ruim 7.000 lichtjaar ver.' },
  { id: 'm81', name: 'Bodes Stelsel', cat: 'M81 & M82', ra: 148.888, dec: 69.065, mag: 6.9, type: 'Twee sterrenstelsels',
    con: 'Grote Beer', size: '27′ × 14′', gear: 'telescoop', fov: 14,
    hop: 'Trek de diagonaal van de pan van de Grote Beer door: van Phecda via Dubhe, en evenver door.',
    why: 'Twee stelsels in één beeldveld op 12 miljoen lichtjaar. M81 is een nette spiraal, M82 een sigaar die door de zwaartekracht van zijn buur uit elkaar wordt getrokken.' },
  { id: 'm51', name: 'Draaikolkstelsel', cat: 'M51', ra: 202.470, dec: 47.195, mag: 8.4, type: 'Spiraalstelsel',
    con: 'Jachthonden', size: '11′ × 7′', gear: 'telescoop', fov: 10,
    hop: 'Vanaf Alkaid, de laatste ster van de steel van de Grote Beer, een klein stukje richting de Jachthonden.',
    why: 'Het eerste object waarin men spiraalarmen herkende, in 1845. Je kijkt er recht bovenop, met een klein begeleidend stelsel aan één arm vastgeklonken.' },
  { id: 'm27', name: 'Halternevel', cat: 'M27', ra: 299.902, dec: 22.721, mag: 7.4, type: 'Planetaire nevel',
    con: 'Vosje', size: '8′ × 6′', gear: 'telescoop', fov: 10,
    hop: 'Vanaf Albireo een stuk richting de Pijl (Sagitta). Net ten noorden van die kleine pijlvorm.',
    why: 'De eerste planetaire nevel die ooit werd ontdekt, door Messier in 1764. Groot en helder genoeg dat hij in een verrekijker al als vlekje opduikt.' },
  { id: 'm15', name: 'Pegasus-bolhoop', cat: 'M15', ra: 322.493, dec: 12.167, mag: 6.2, type: 'Bolvormige sterrenhoop',
    con: 'Pegasus', size: '18′', gear: 'verrekijker', fov: 12,
    hop: 'Trek de lijn van Theta Pegasi naar Enif door, en nog eens de helft van die afstand verder.',
    why: 'Een van de dichtstgepakte bolhopen die we kennen — de kern is mogelijk rond een zwart gat ingestort. Ruim 12 miljard jaar oud.' },
  { id: 'm35', name: 'M35', cat: 'M35', ra: 92.27, dec: 24.333, mag: 5.1, type: 'Open sterrenhoop',
    con: 'Tweelingen', size: '28′', gear: 'verrekijker', fov: 12,
    hop: 'Bij de voeten van de Tweelingen, vlak naast de ster Eta Geminorum.',
    why: 'Een hoop zo groot als de volle maan, met een paar honderd sterren op 2.800 lichtjaar. In dezelfde verrekijkerblik ligt de veel verdere hoop NGC 2158.' },
  { id: 'm37', name: 'M37', cat: 'M37', ra: 88.074, dec: 32.553, mag: 5.6, type: 'Open sterrenhoop',
    con: 'Voerman', size: '24′', gear: 'verrekijker', fov: 12,
    hop: 'In de vijfhoek van de Voerman, op de lijn tussen Elnath en Theta Aurigae.',
    why: 'De rijkste van de drie hopen in de Voerman: honderden sterren, met een opvallend oranje ster in het midden.' },
  { id: 'mizar', name: 'Mizar en Alcor', cat: 'ζ UMa', ra: 200.981, dec: 54.926, mag: 2.2, type: 'Dubbelster',
    con: 'Grote Beer', size: '12′ scheiding', gear: 'oog', fov: 12,
    hop: 'De middelste ster in de steel van de Grote Beer. Kijk goed: er staat een zwakker sterretje vlak naast.',
    why: 'Het klassieke oogtestje van de Arabische woestijn. Door een telescoop splitst Mizar zélf nog eens in tweeën — en spectroscopisch zijn het er zes.' },
  { id: 'm11', name: 'Wilde Eendhoop', cat: 'M11', ra: 282.766, dec: -6.271, mag: 5.8, type: 'Open sterrenhoop',
    con: 'Schild', size: '14′', gear: 'verrekijker', fov: 12,
    hop: 'Volg de staart van de Arend naar het zuiden, de Melkweg in, tot de Schild-sterrenwolk.',
    why: 'Zo dicht opeengepakt dat hij op een bolhoop lijkt. De naam komt van de V-vorm van de helderste sterren, als een vlucht eenden.' },
  { id: 'm8', name: 'Lagunenevel', cat: 'M8', ra: 270.904, dec: -24.387, mag: 6.0, type: 'Emissienevel',
    con: 'Boogschutter', size: '90′ × 40′', gear: 'verrekijker', fov: 12,
    hop: 'Boven het deksel van de "theepot" in de Boogschutter, laag in het zuiden.',
    why: 'Een enorme stervormingswolk richting het hart van de Melkweg. Vanuit Nederland blijft hij laag — je hebt een vrije zuidhorizon nodig.' },
  { id: 'm92', name: 'M92', cat: 'M92', ra: 259.281, dec: 43.136, mag: 6.4, type: 'Bolvormige sterrenhoop',
    con: 'Hercules', size: '14′', gear: 'verrekijker', fov: 12,
    hop: 'Boven het trapezium van Hercules, ongeveer even ver erboven als de steen hoog is.',
    why: 'De vergeten buur van M13, en ten onrechte: compacter en feller van kern. Een van de oudste objecten in de Melkweg.' },
  { id: 'm34', name: 'M34', cat: 'M34', ra: 40.531, dec: 42.762, mag: 5.5, type: 'Open sterrenhoop',
    con: 'Perseus', size: '35′', gear: 'verrekijker', fov: 12,
    hop: 'Halverwege tussen Algol in Perseus en Almach in Andromeda.',
    why: 'Een losse, ruime hoop van een honderdtal sterren — juist mooi in een verrekijker, waar hij helemaal in beeld past.' },
]

// ── Zichtbaarheid vannacht ─────────────────────────────────────────────────

export interface Viewing {
  target: Target
  best: Date          // moment van hoogste stand binnen het donkere venster
  alt: number         // hoogte op dat moment, graden
  az: number
  dir: string         // kompasrichting
  score: number
}

/**
 * Hoe goed staat dit object vannacht? Hoogte weegt het zwaarst — onder de
 * 25° kijk je door te veel atmosfeer en te veel stadslicht. Een heldere maan
 * straft vage uitgestrekte dingen zwaarder af dan compacte heldere hopen.
 */
export function rateTonight(
  t: Target, lat: number, lon: number, win: { from: Date; to: Date }, moonLit: number,
): Viewing {
  let best = win.from, alt = -90, az = 0
  const span = win.to.getTime() - win.from.getTime()
  const steps = Math.max(4, Math.round(span / (15 * 60000)))
  for (let i = 0; i <= steps; i++) {
    const t0 = new Date(win.from.getTime() + (span * i) / steps)
    const p = altAz(t.ra, t.dec, lat, lon, t0)
    if (p.alt > alt) { alt = p.alt; az = p.az; best = t0 }
  }
  /* Hoogste stand telt, maar nog zwaarder telt of het object er al staat als
     je naar buiten gaat. Een object dat pas om vier uur 's nachts culmineert
     is astronomisch beter en praktisch onbruikbaar. */
  const vroeg = altAz(t.ra, t.dec, lat, lon, new Date(win.from.getTime() + 90 * 60000))
  let score = Math.max(0, alt) * 0.9 + Math.max(0, vroeg.alt) * 0.7
  if (alt < 25) score -= 45
  /* Maanlicht: nevels en stelsels verdrinken erin, hopen en dubbelsterren niet. */
  const kwetsbaar = t.type.includes('nevel') || t.type.includes('stelsel')
  score -= moonLit * (kwetsbaar ? 42 : 12)
  if (t.gear === 'oog') score += 8
  return { target: t, best, alt, az, dir: compass(az), score }
}

/**
 * Het object van de nacht. Kiest uit de vijf best staande objecten op basis
 * van de datum, zodat de keuze de hele avond gelijk blijft maar elke nacht
 * verschuift — en zodat twee mensen op dezelfde plek hetzelfde zien.
 */
export function objectOfTheNight(
  lat: number, lon: number, night: Date, moonLit: number,
): { pick: Viewing; window: { from: Date; to: Date }; runnersUp: Viewing[] } | null {
  const win = darkWindow(lat, lon, night)
  if (!win) return null
  const rated = TARGETS
    .map(t => rateTonight(t, lat, lon, win, moonLit))
    .filter(v => v.alt >= 20)
    .sort((a, b) => b.score - a.score)
  if (rated.length === 0) return null
  const pool = rated.slice(0, 5)
  const dayNo = Math.floor(
    Date.UTC(night.getFullYear(), night.getMonth(), night.getDate()) / 86400000,
  )
  const pick = pool[dayNo % pool.length]
  return { pick, window: win, runnersUp: rated.filter(v => v !== pick).slice(0, 3) }
}

// ── Projectie voor de kaart ────────────────────────────────────────────────

/**
 * Gnomonische projectie op het raakvlak in het doel. Rechte lijnen aan de
 * hemel blijven recht, wat precies is wat je wilt als je van ster naar ster
 * hopt. Oost ligt links, zoals wanneer je met je hoofd in je nek staat.
 */
export function project(
  ra: number, dec: number, ra0: number, dec0: number, fov: number, r: number,
): { x: number; y: number; vis: boolean } {
  const d = dec * D2R, d0 = dec0 * D2R, dr = (ra - ra0) * D2R
  const cosc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(dr)
  if (cosc <= 0.01) return { x: 0, y: 0, vis: false }
  const k = r / Math.tan(fov * D2R)
  const x = (Math.cos(d) * Math.sin(dr)) / cosc
  const y = (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(dr)) / cosc
  const px = -x * k, py = -y * k
  return { x: px, y: py, vis: px * px + py * py <= r * r * 1.08 }
}
