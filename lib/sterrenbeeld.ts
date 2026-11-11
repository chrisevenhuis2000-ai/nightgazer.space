// ── Teken het sterrenbeeld van vannacht ─────────────────────────────────────
//
// Elke dag één sterrenbeeld dat die avond echt hoog genoeg boven Nederland
// staat. Je verbindt de sterren zelf; de stand op het scherm is de stand
// aan de hemel op het kijkmoment (21:00, in de zomer 23:00), gezien vanuit
// het midden van het land. Zo is wat je tekent precies wat je buiten ziet.
//
// Sterposities en namen komen uit lib/sky-chart.ts (J2000), dezelfde
// catalogus als de zoekkaart op /sterrenkijken. Hier staat alleen welke
// sterren een sterrenbeeld vormen en het verhaal erbij.

import { STARS, altAz, project, compass, KOMPAS_VOLUIT, type Star } from './sky-chart'
import { puzzelNr } from './hemelfoto'

export type Beeld = {
  id: string
  naam: string
  /** Paden van ster naar ster; elk opeenvolgend paar is een lijn. */
  paden: string[][]
  verhaal: string
  tip: string
  verder: { href: string; label: string }
}

export const BEELDEN: Beeld[] = [
  {
    id: 'orion', naam: 'Orion',
    paden: [['Betelgeuze', 'Bellatrix'], ['Bellatrix', 'Mintaka', 'Alnilam', 'Alnitak', 'Saiph', 'Rigel', 'Mintaka'], ['Betelgeuze', 'Alnitak'], ['Betelgeuze', 'Meissa', 'Bellatrix']],
    verhaal: 'De jager uit de Griekse mythen. Linksboven staat Betelgeuze, een rode reus die zo groot is dat hij op de plek van de zon tot voorbij Mars zou reiken. Rechtsonder staat het blauwwitte Rigel.',
    tip: 'Zoek eerst de drie sterren van de gordel op een rij. Daaronder hangt het zwaard, met de Orionnevel als vaag vlekje.',
    verder: { href: '/spellen/hemelfoto/', label: 'Speel ook Raad de hemelfoto' },
  },
  {
    id: 'stier', naam: 'Stier',
    paden: [['Aldebaran', 'Theta Tau', 'Gamma Tau', 'Delta Tau', 'Epsilon Tau', 'Aldebaran'], ['Aldebaran', 'Zeta Tau'], ['Epsilon Tau', 'Elnath']],
    verhaal: 'De V-vorm is de kop van de stier, met het oranje Aldebaran als oog. Aldebaran hoort er eigenlijk niet bij: hij staat op 65 lichtjaar, de sterrenhoop van de V op zo’n 150. Op de rug staat het Zevengesternte.',
    tip: 'Volg de gordel van Orion naar rechtsboven. De eerste heldere, oranje ster die je tegenkomt is Aldebaran.',
    verder: { href: '/sterrenkijken/', label: 'Wat staat er vannacht nog meer?' },
  },
  {
    id: 'grote-hond', naam: 'Grote Hond',
    paden: [['Sirius', 'Mirzam'], ['Sirius', 'Wezen', 'Adhara'], ['Wezen', 'Aludra']],
    verhaal: 'De trouwe hond van Orion. Sirius is de helderste ster van de hele nachthemel, en met 8,6 lichtjaar ook een van de dichtstbijzijnde. Laag bij de horizon fonkelt hij in alle kleuren.',
    tip: 'Volg de gordel van Orion naar linksonder. Het felle, flonkerende licht laag in het zuiden is Sirius.',
    verder: { href: '/sterrenkijken/', label: 'Kan ik vannacht kijken?' },
  },
  {
    id: 'tweelingen', naam: 'Tweelingen',
    paden: [['Castor', 'Pollux'], ['Castor', 'Tau Gem', 'Mebsuta', 'Eta Gem'], ['Mebsuta', 'Mu Gem'], ['Pollux', 'Kappa Gem', 'Wasat', 'Alhena'], ['Wasat', 'Mebsuta']],
    verhaal: 'Castor en Pollux, de tweelingbroers uit de mythen. Ze lijken op elkaar, maar Pollux is een oranje reus en Castor een stelsel van zes sterren die om elkaar heen draaien.',
    tip: 'Linksboven Orion staan twee heldere sterren vlak naast elkaar. De oranjere is Pollux.',
    verder: { href: '/sterrenkijken/', label: 'Bekijk de hemelagenda' },
  },
  {
    id: 'voerman', naam: 'Voerman',
    paden: [['Capella', 'Menkalinan', 'Theta Aur', 'Elnath', 'Iota Aur', 'Capella']],
    verhaal: 'Een vijfhoek met Capella, de zesde helderste ster aan de hemel. Capella lijkt één gele ster, maar het zijn twee reuzensterren die in 104 dagen om elkaar draaien.',
    tip: 'Op winteravonden staat Capella bijna recht boven je hoofd. De onderste hoek van de vijfhoek deelt hij met de Stier.',
    verder: { href: '/sterrenkijken/uitrusting/', label: 'Sterrenhopen met een verrekijker' },
  },
  {
    id: 'perseus', naam: 'Perseus',
    paden: [['Eta Per', 'Gamma Per', 'Mirfak', 'Delta Per', 'Epsilon Per', 'Zeta Per'], ['Mirfak', 'Algol']],
    verhaal: 'De held die Medusa versloeg. Algol, de ‘duivelsster’, is haar oog: elke 2 dagen en 21 uur schuift er een zwakkere ster voor en wordt hij een paar uur duidelijk zwakker. De Perseïden in augustus lijken uit dit sterrenbeeld te komen.',
    tip: 'Ga vanaf de W van Cassiopeia naar beneden, richting Capella. Het boogje sterren daartussen is Perseus.',
    verder: { href: '/sterrenkijken/', label: 'Wanneer is de volgende meteorenzwerm?' },
  },
  {
    id: 'cassiopeia', naam: 'Cassiopeia',
    paden: [['Caph', 'Schedar', 'Gamma Cas', 'Ruchbah', 'Segin']],
    verhaal: 'De ijdele koningin, als een W of M aan de hemel. Vanuit Nederland gaat ze nooit onder: ze draait de hele nacht en het hele jaar rond de Poolster.',
    tip: 'Ze staat altijd tegenover de Grote Beer, aan de andere kant van de Poolster. In de herfst hoog in het noordoosten.',
    verder: { href: '/spellen/hemelfoto/', label: 'Speel ook Raad de hemelfoto' },
  },
  {
    id: 'pegasus', naam: 'Pegasus',
    paden: [['Alpheratz', 'Algenib', 'Markab', 'Scheat', 'Alpheratz'], ['Markab', 'Theta Peg', 'Enif']],
    verhaal: 'Het gevleugelde paard, met het Grote Vierkant van de herfst als lijf. De linkerbovenhoek, Alpheratz, hoort officieel bij Andromeda; de sterrenbeelden delen hem.',
    tip: 'Op herfstavonden staat het Vierkant hoog in het zuiden. Er staan opvallend weinig sterren binnenin.',
    verder: { href: '/sterrenkijken/', label: 'Kan ik vannacht kijken?' },
  },
  {
    id: 'andromeda', naam: 'Andromeda',
    paden: [['Alpheratz', 'Delta And', 'Mirach', 'Almach'], ['Mirach', 'Mu And', 'Nu And']],
    verhaal: 'De prinses die aan een rots werd geketend en door Perseus werd gered. Vlak bij haar staat het Andromedastelsel, op 2,5 miljoen lichtjaar het verste wat je met het blote oog kunt zien.',
    tip: 'Ga van Mirach twee sterren omhoog, naar Mu en Nu. Net daarnaast zie je onder een donkere hemel een langgerekt vlekje: het Andromedastelsel.',
    verder: { href: '/sterrenkijken/uitrusting/', label: 'Welke verrekijker past?' },
  },
  {
    id: 'grote-beer', naam: 'Grote Beer',
    paden: [['Dubhe', 'Merak', 'Phecda', 'Megrez', 'Dubhe'], ['Megrez', 'Alioth', 'Mizar', 'Alkaid']],
    verhaal: 'Het bekendste deel van de Grote Beer is de steelpan. Trek een lijn door de twee voorste sterren, Merak en Dubhe, en je komt bij de Poolster. In de steel staat Mizar met het zwakke Alcor ernaast: een oude oogtest.',
    tip: 'Vanuit Nederland gaat de steelpan nooit onder. In de herfst staat hij ’s avonds laag in het noorden, in de lente hoog boven je.',
    verder: { href: '/sterrenkijken/', label: 'Bekijk de zoekkaart' },
  },
  {
    id: 'lier', naam: 'Lier',
    paden: [['Vega', 'Epsilon Lyr'], ['Vega', 'Zeta Lyr', 'Delta Lyr', 'Sulafat', 'Sheliak', 'Zeta Lyr']],
    verhaal: 'De lier van Orpheus. Vega, op 25 lichtjaar, is een van de drie sterren van de Zomerdriehoek. Tussen Sheliak en Sulafat zit de Ringnevel, het restant van een stervende ster.',
    tip: 'Op zomeravonden staat Vega bijna recht boven je. Het kleine parallellogram ernaast is de lier zelf.',
    verder: { href: '/sterrenkijken/eerste-telescoop/', label: 'Welke telescoop toont de Ringnevel?' },
  },
  {
    id: 'zwaan', naam: 'Zwaan',
    paden: [['Deneb', 'Sadr', 'Albireo'], ['Delta Cyg', 'Sadr', 'Gienah Cyg']],
    verhaal: 'Een zwaan die langs de Melkweg vliegt, ook wel het Noorderkruis. Deneb in de staart is een superreus en een van de verste sterren die je met het blote oog ziet. Albireo in de kop is met een kleine telescoop een goud-blauwe dubbelster.',
    tip: 'Deneb is de linkerbovenhoek van de Zomerdriehoek. Vanaf Deneb vliegt de zwaan met zijn lange hals naar het zuiden.',
    verder: { href: '/sterrenkijken/eerste-telescoop/', label: 'Je eerste telescoop kiezen' },
  },
  {
    id: 'arend', naam: 'Arend',
    paden: [['Tarazed', 'Altair', 'Alshain'], ['Tarazed', 'Zeta Aql'], ['Altair', 'Delta Aql', 'Lambda Aql']],
    verhaal: 'De adelaar van Zeus. Altair draait zo snel om zijn as, ongeveer één keer per negen uur, dat hij duidelijk afgeplat is. Hij is de onderste ster van de Zomerdriehoek.',
    tip: 'Zoek Altair met aan elke kant een zwakker sterretje: drie op een rij, met de heldere in het midden.',
    verder: { href: '/sterrenkijken/', label: 'Kan ik vannacht kijken?' },
  },
  {
    id: 'hercules', naam: 'Hercules',
    paden: [['Zeta Her', 'Eta Her', 'Pi Her', 'Epsilon Her', 'Zeta Her'], ['Kornephoros', 'Zeta Her'], ['Kornephoros', 'Delta Her', 'Rasalgethi'], ['Pi Her', 'Iota Her'], ['Epsilon Her', 'Delta Her']],
    verhaal: 'De sterke held, met een trapezium van vier sterren als lijf. Langs één zijde van dat trapezium, tussen Eta en Zeta, zit de Herculeshoop: honderdduizenden sterren in een bal.',
    tip: 'Kijk tussen Vega en Arcturus. Het zwakke trapezium valt pas op als je weet dat het er is.',
    verder: { href: '/sterrenkijken/uitrusting/', label: 'Sterrenhopen met een verrekijker' },
  },
  {
    id: 'noorderkroon', naam: 'Noorderkroon',
    paden: [['Theta CrB', 'Beta CrB', 'Alphecca', 'Gamma CrB']],
    verhaal: 'Een kleine halve cirkel van sterren, de kroon van Ariadne. Alphecca, de heldere parel in het midden, is een dubbelster die elkaar om de 17 dagen bedekt.',
    tip: 'Klein maar mooi: hij staat tussen Arcturus en Vega, een stuk dichter bij Arcturus.',
    verder: { href: '/sterrenkijken/', label: 'Bekijk de zoekkaart' },
  },
  {
    id: 'ossenhoeder', naam: 'Ossenhoeder',
    paden: [['Arcturus', 'Izar', 'Alkalurops', 'Nekkar', 'Seginus', 'Rho Boo', 'Arcturus'], ['Arcturus', 'Mufrid']],
    verhaal: 'Het sterrenbeeld heeft de vorm van een vlieger of ijshoorntje, met Arcturus onderaan. Die oranje reus is de helderste ster van de noordelijke hemel.',
    tip: 'Volg de boog van de steel van de Grote Beer verder door. De eerste heldere, oranje ster is Arcturus.',
    verder: { href: '/sterrenkijken/', label: 'Kan ik vannacht kijken?' },
  },
  {
    id: 'leeuw', naam: 'Leeuw',
    paden: [['Regulus', 'Eta Leo', 'Algieba', 'Zosma', 'Denebola', 'Chertan', 'Regulus'], ['Chertan', 'Zosma']],
    verhaal: 'Een liggende leeuw, met een achterstevoren vraagteken als manen en kop. Onderaan staat Regulus, het hart van de leeuw. In november komen de Leoniden uit deze richting.',
    tip: 'Gebruik de steelpan: water dat uit de pan lekt, valt op de rug van de Leeuw.',
    verder: { href: '/sterrenkijken/', label: 'Wanneer is de volgende meteorenzwerm?' },
  },
]

const STER = new Map(STARS.map(s => [s.name, s]))

export const sleutel = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/** Alle lijnen van een sterrenbeeld als unieke sleutels. */
export function lijnenVan(b: Beeld): string[] {
  const set = new Set<string>()
  for (const p of b.paden) for (let i = 0; i < p.length - 1; i++) set.add(sleutel(p[i], p[i + 1]))
  return [...set]
}

export function sterrenVan(b: Beeld): Star[] {
  const namen = [...new Set(b.paden.flat())]
  return namen.map(n => STER.get(n)).filter((s): s is Star => !!s)
}

// ── Waar en wanneer ─────────────────────────────────────────────────────────

/** Midden van Nederland (bij Utrecht). Een paar graden verschil maakt voor
    de stand van een sterrenbeeld niets uit. */
export const NL = { lat: 52.09, lon: 5.12 }

/** Kijkuur: 21:00, en van april tot en met september 23:00 (eerder is het
    dan nog te licht). */
export function kijkuur(iso: string): number {
  const m = +iso.slice(5, 7)
  return m >= 4 && m <= 9 ? 23 : 21
}

/** Het moment `uur`:00 Nederlandse tijd op dag `iso`. */
export function nlTijdstip(iso: string, uur: number): Date {
  const [y, m, d] = iso.split('-').map(Number)
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hourCycle: 'h23' })
  for (const off of [1, 2]) {
    const t = new Date(Date.UTC(y, m - 1, d, uur - off))
    if (Number(fmt.format(t)) === uur) return t
  }
  return new Date(Date.UTC(y, m - 1, d, uur - 1))
}

const D2R = Math.PI / 180
function midden(sterren: Star[]): { ra: number; dec: number } {
  let x = 0, y = 0, z = 0
  for (const s of sterren) {
    x += Math.cos(s.dec * D2R) * Math.cos(s.ra * D2R)
    y += Math.cos(s.dec * D2R) * Math.sin(s.ra * D2R)
    z += Math.sin(s.dec * D2R)
  }
  return { ra: ((Math.atan2(y, x) / D2R) + 360) % 360, dec: Math.atan2(z, Math.hypot(x, y)) / D2R }
}

export type Stand = { alt: number; az: number; richting: string; hoogte: string }

export function standVan(b: Beeld, when: Date): Stand {
  const m = midden(sterrenVan(b))
  const { alt, az } = altAz(m.ra, m.dec, NL.lat, NL.lon, when)
  const hoogte = alt >= 75 ? 'bijna recht boven je' : alt >= 50 ? 'hoog aan de hemel' : alt >= 25 ? 'halverwege de horizon en het punt boven je' : 'laag boven de horizon'
  return { alt, az, richting: KOMPAS_VOLUIT[compass(az)], hoogte }
}

/** Minimale hoogte van het midden om ‘vanavond goed te zien’ te heten. */
export const MIN_HOOGTE = 28

export function zichtbaar(iso: string): Beeld[] {
  const t = nlTijdstip(iso, kijkuur(iso))
  return BEELDEN.filter(b => standVan(b, t).alt >= MIN_HOOGTE)
}

/** Het sterrenbeeld van de dag: wisselt dagelijks binnen wat er staat. */
export function beeldVanDag(iso: string): Beeld {
  const lijst = zichtbaar(iso)
  if (!lijst.length) return BEELDEN.find(b => b.id === 'grote-beer')!
  return lijst[(puzzelNr(iso) - 1) % lijst.length]
}

// ── Het speelveld ───────────────────────────────────────────────────────────

export type Punt = { naam: string; x: number; y: number; mag: number; hoort: boolean }

/**
 * Projecteert de sterren zoals je ze op het kijkmoment ziet, met de horizon
 * onder en het zenit boven, in een vierkant van `maat` pixels. Sterren van
 * andere sterrenbeelden die in beeld vallen komen mee: die hoor je over te
 * slaan.
 */
export function speelveld(b: Beeld, when: Date, maat = 1000): Punt[] {
  const eigen = sterrenVan(b)
  const namen = new Set(eigen.map(s => s.name))
  const s0 = standVan(b, when)
  const hor = (s: Star) => altAz(s.ra, s.dec, NL.lat, NL.lon, when)
  const proj = (s: Star) => {
    const h = hor(s)
    return project(-h.az, h.alt, -s0.az, s0.alt, 40, 1)
  }
  const pe = eigen.map(proj)
  const minX = Math.min(...pe.map(p => p.x)), maxX = Math.max(...pe.map(p => p.x))
  const minY = Math.min(...pe.map(p => p.y)), maxY = Math.max(...pe.map(p => p.y))
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const span = Math.max(maxX - minX, maxY - minY) || 1
  const marge = maat * 0.11
  const schaal = (maat - 2 * marge) / span
  const naar = (p: { x: number; y: number }) => ({ x: maat / 2 + (p.x - cx) * schaal, y: maat / 2 + (p.y - cy) * schaal })

  const punten: Punt[] = eigen.map((s, i) => ({ naam: s.name, mag: s.mag, hoort: true, ...naar(pe[i]) }))
  for (const s of STARS) {
    if (namen.has(s.name)) continue
    const p = proj(s)
    if (!p.vis) continue
    const q = naar(p)
    if (q.x < marge * 0.4 || q.x > maat - marge * 0.4 || q.y < marge * 0.4 || q.y > maat - marge * 0.4) continue
    if (punten.some(o => Math.hypot(o.x - q.x, o.y - q.y) < maat * 0.045)) continue
    punten.push({ naam: s.name, mag: s.mag, hoort: false, ...q })
  }
  return punten
}

/** Straal van een ster op het scherm: helderder is groter. `min` is de
    kleinste straal; op een smal scherm zet het spel die zo dat elke ster
    minstens 8 px breed is (fase 3, gebruikerstest 2026-11). */
export const straal = (mag: number, maat = 1000, min = 4) =>
  (maat / 1000) * Math.max(min, Math.min(Math.max(15, min + 5), 11.5 - mag * 2.2))

// ── Spelstand ───────────────────────────────────────────────────────────────

export type Spel = { getekend: string[]; fouten: number; hints: number; klaar: boolean }
export const NIEUW: Spel = { getekend: [], fouten: 0, hints: 0, klaar: false }

export type Uitkomst = 'goed' | 'al' | 'fout'

export function trek(spel: Spel, b: Beeld, a: string, c: string): { spel: Spel; uitkomst: Uitkomst } {
  if (spel.klaar || a === c) return { spel, uitkomst: 'al' }
  const k = sleutel(a, c)
  if (spel.getekend.includes(k)) return { spel, uitkomst: 'al' }
  const alle = lijnenVan(b)
  if (!alle.includes(k)) return { spel: { ...spel, fouten: spel.fouten + 1 }, uitkomst: 'fout' }
  const getekend = [...spel.getekend, k]
  return { spel: { ...spel, getekend, klaar: getekend.length === alle.length }, uitkomst: 'goed' }
}

/** Een lijn die nog ontbreekt, bij voorkeur vast aan wat er al staat. */
export function hint(spel: Spel, b: Beeld): string | null {
  const open = lijnenVan(b).filter(k => !spel.getekend.includes(k))
  if (!open.length) return null
  const getekendeSterren = new Set(spel.getekend.flatMap(k => k.split('|')))
  return open.find(k => k.split('|').some(n => getekendeSterren.has(n))) ?? open[0]
}
