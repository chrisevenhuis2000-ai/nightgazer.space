/* ══════════════════════════════════════════════════════════════════════════
   Ruimtezandbak: de natuurkunde

   Eenheden zoals sterrenkundigen ze handig vinden: afstand in AE (de afstand
   aarde–zon), massa in zonmassa's en tijd in jaren. Dan is de
   zwaartekrachtconstante precies 4π² en draait de aarde op 1 AE in één jaar
   rond. Alles rekent in de browser, zonder server.

   Iedereen trekt aan iedereen (een N-lichamenprobleem). We rekenen met een
   leapfrog-stapje dat zichzelf kleiner maakt als twee lichamen dicht bij
   elkaar komen, zodat een scheervlucht niet ontploft.
   ══════════════════════════════════════════════════════════════════════════ */

export const G = 4 * Math.PI * Math.PI
export const DAG = 1 / 365.25
export const KM_PER_AE = 149_597_870.7
/** 1 AE per jaar in km/s. */
export const KMS = KM_PER_AE / (365.25 * 86400)

export const AARDMASSA = 3.003e-6
export const JUPITERMASSA = 9.546e-4
export const MAANMASSA = 3.694e-8

export type Soort = 'ster' | 'reus' | 'planeet' | 'maan'
export type Kleur =
  | 'zon' | 'rood' | 'wit'
  | 'aarde' | 'mars' | 'venus' | 'mercurius' | 'rots'
  | 'reus' | 'ijsreus'
  | 'maan'

export type Lichaam = {
  id: number
  naam: string
  soort: Soort
  kleur: Kleur
  m: number
  /** Straal in AE: alleen voor botsingen. */
  r: number
  x: number; y: number
  vx: number; vy: number
  /** Spoor: x,y-paren ten opzichte van het midden van beeld. */
  spoor: number[]
}

export type Gebeurtenis =
  | { soort: 'botsing'; a: string; b: string; naam: string }
  | { soort: 'ontsnapt'; naam: string }

/** Soort uit massa: zwaarder dan 0,08 zon gaat een ster branden. */
export function soortVan(m: number): Soort {
  if (m >= 0.075) return 'ster'
  if (m >= 10 * AARDMASSA) return 'reus'
  if (m >= 3 * MAANMASSA) return 'planeet'
  return 'maan'
}

/** Een redelijke straal bij een massa, alleen voor nieuwe lichamen. */
export function straalVan(soort: Soort, m: number): number {
  switch (soort) {
    case 'ster': return 0.00465 * Math.pow(m, 0.8)
    case 'reus': return 0.000477 * Math.min(1.1, Math.pow(m / JUPITERMASSA, 0.1))
    case 'planeet': return 4.26e-5 * Math.pow(m / AARDMASSA, 0.28)
    default: return 1.16e-5 * Math.pow(m / MAANMASSA, 0.33)
  }
}

export function kleurBij(soort: Soort, m: number, oud?: Kleur): Kleur {
  if (soort === 'ster') return m < 0.45 ? 'rood' : m > 1.6 ? 'wit' : 'zon'
  if (soort === 'reus') return oud === 'ijsreus' ? 'ijsreus' : 'reus'
  if (soort === 'planeet') return oud && ['aarde', 'mars', 'venus', 'mercurius', 'rots'].includes(oud) ? oud : 'rots'
  return 'maan'
}

export const STANDAARD: Record<Soort, { m: number; kleur: Kleur; label: string }> = {
  ster:    { m: 0.5,           kleur: 'rood',  label: 'Ster' },
  reus:    { m: JUPITERMASSA,  kleur: 'reus',  label: 'Gasreus' },
  planeet: { m: AARDMASSA,     kleur: 'aarde', label: 'Planeet' },
  maan:    { m: MAANMASSA,     kleur: 'maan',  label: 'Maan' },
}

export const SOORTNAAM: Record<Soort, string> = {
  ster: 'ster', reus: 'gasreus', planeet: 'rotsplaneet', maan: 'maan',
}

export class Wereld {
  lichamen: Lichaam[] = []
  t = 0
  private volgende = 1
  /** Verder weg dan dit (in AE, vanaf het midden) is een lichaam ontsnapt. */
  grens = 60

  voegToe(l: Omit<Lichaam, 'id' | 'spoor' | 'r' | 'kleur' | 'soort'> & Partial<Pick<Lichaam, 'r' | 'kleur' | 'soort'>>): Lichaam {
    const soort = l.soort ?? soortVan(l.m)
    const nieuw: Lichaam = {
      ...l,
      id: this.volgende++,
      soort,
      kleur: l.kleur ?? kleurBij(soort, l.m),
      r: l.r ?? straalVan(soort, l.m),
      spoor: [],
    }
    this.lichamen.push(nieuw)
    return nieuw
  }

  /** Massamiddelpunt en totale impuls op nul, zodat niets wegdrijft. */
  centreer() {
    let M = 0, x = 0, y = 0, px = 0, py = 0
    for (const b of this.lichamen) { M += b.m; x += b.m * b.x; y += b.m * b.y; px += b.m * b.vx; py += b.m * b.vy }
    if (!M) return
    for (const b of this.lichamen) { b.x -= x / M; b.y -= y / M; b.vx -= px / M; b.vy -= py / M }
  }

  zwaartepunt(): { x: number; y: number } {
    let M = 0, x = 0, y = 0
    for (const b of this.lichamen) { M += b.m; x += b.m * b.x; y += b.m * b.y }
    return M ? { x: x / M, y: y / M } : { x: 0, y: 0 }
  }

  zwaarste(): Lichaam | null {
    let best: Lichaam | null = null
    for (const b of this.lichamen) if (!best || b.m > best.m) best = b
    return best
  }

  energie(): number {
    const L = this.lichamen
    let E = 0
    for (let i = 0; i < L.length; i++) {
      E += 0.5 * L[i].m * (L[i].vx ** 2 + L[i].vy ** 2)
      for (let j = i + 1; j < L.length; j++) E -= G * L[i].m * L[j].m / Math.hypot(L[i].x - L[j].x, L[i].y - L[j].y)
    }
    return E
  }

  /** Kleinste natuurlijke tijdschaal tussen twee lichamen: daar past het stapje zich op aan. */
  private tijdschaal(): number {
    const L = this.lichamen
    let t = Infinity
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const dx = L[i].x - L[j].x, dy = L[i].y - L[j].y
      const d2 = dx * dx + dy * dy
      const d = Math.sqrt(d2)
      const vrij = Math.sqrt(d2 * d / (G * (L[i].m + L[j].m)))
      const v = Math.hypot(L[i].vx - L[j].vx, L[i].vy - L[j].vy)
      const vlucht = v > 0 ? d / v : Infinity
      t = Math.min(t, vrij, vlucht)
    }
    return t
  }

  private versnel(ax: Float64Array, ay: Float64Array) {
    const L = this.lichamen
    ax.fill(0); ay.fill(0)
    for (let i = 0; i < L.length; i++) {
      const a = L[i]
      for (let j = i + 1; j < L.length; j++) {
        const b = L[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const d2 = dx * dx + dy * dy + 1e-14
        const f = G / (d2 * Math.sqrt(d2))
        ax[i] += f * b.m * dx; ay[i] += f * b.m * dy
        ax[j] -= f * a.m * dx; ay[j] -= f * a.m * dy
      }
    }
  }

  /** Smelt botsende lichamen samen. Impuls en massa blijven behouden. */
  private botsingen(uit: Gebeurtenis[]): void {
    const L = this.lichamen
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j]
      if (Math.hypot(a.x - b.x, a.y - b.y) > a.r + b.r) continue
      const [groot, klein] = a.m >= b.m ? [a, b] : [b, a]
      const m = a.m + b.m
      const oudeSoort = groot.soort
      groot.x = (a.m * a.x + b.m * b.x) / m
      groot.y = (a.m * a.y + b.m * b.y) / m
      groot.vx = (a.m * a.vx + b.m * b.vx) / m
      groot.vy = (a.m * a.vy + b.m * b.vy) / m
      groot.m = m
      groot.soort = soortVan(m)
      groot.r = groot.soort === oudeSoort ? Math.cbrt(a.r ** 3 + b.r ** 3) : straalVan(groot.soort, m)
      if (groot.soort !== oudeSoort) groot.kleur = kleurBij(groot.soort, m, groot.kleur)
      uit.push({ soort: 'botsing', a: groot.naam, b: klein.naam, naam: groot.naam })
      L.splice(L.indexOf(klein), 1)
      return this.botsingen(uit)
    }
  }

  /**
   * Reken dt jaar vooruit. Geeft terug hoeveel tijd echt is doorgerekend: als
   * twee lichamen heel dicht langs elkaar scheren, gaat de klok liever even
   * langzamer dan dat de berekening onnauwkeurig wordt.
   */
  stap(dt: number, maxStappen = 4000, uit: Gebeurtenis[] = []): number {
    const n = () => this.lichamen.length
    if (n() === 0) { this.t += dt; return dt }
    let gedaan = 0, stappen = 0
    let ax = new Float64Array(n()), ay = new Float64Array(n())
    this.versnel(ax, ay)
    while (gedaan < dt && stappen < maxStappen) {
      const h = Math.min(dt - gedaan, 0.02 * this.tijdschaal())
      const L = this.lichamen
      for (let i = 0; i < L.length; i++) {
        L[i].vx += 0.5 * h * ax[i]; L[i].vy += 0.5 * h * ay[i]
        L[i].x += h * L[i].vx; L[i].y += h * L[i].vy
      }
      const voor = n()
      this.botsingen(uit)
      if (n() !== voor) { ax = new Float64Array(n()); ay = new Float64Array(n()) }
      this.versnel(ax, ay)
      for (let i = 0; i < this.lichamen.length; i++) {
        this.lichamen[i].vx += 0.5 * h * ax[i]; this.lichamen[i].vy += 0.5 * h * ay[i]
      }
      gedaan += h
      stappen++
    }
    this.t += gedaan
    this.ontsnapt(uit)
    return gedaan
  }

  /** Haal lichamen weg die ver weg zijn en nog steeds verder vliegen. */
  private ontsnapt(uit: Gebeurtenis[]) {
    const z = this.zwaarste()
    if (!z) return
    const c = this.zwaartepunt()
    this.lichamen = this.lichamen.filter(b => {
      if (b === z) return true
      const dx = b.x - c.x, dy = b.y - c.y
      if (Math.hypot(dx, dy) < this.grens || dx * b.vx + dy * b.vy < 0) return true
      uit.push({ soort: 'ontsnapt', naam: b.naam })
      return false
    })
  }

  /** Een kopie zonder sporen, om vooruit te kijken. */
  kloon(): Wereld {
    const w = new Wereld()
    w.lichamen = this.lichamen.map(b => ({ ...b, spoor: [] }))
    w.t = this.t
    w.grens = this.grens
    w.volgende = this.volgende
    return w
  }
}

/* ── Waar draait een nieuw lichaam omheen? ───────────────────────────────── */

/**
 * Het lichaam dat op deze plek de baas is. Eerst kijken we of het punt binnen
 * de invloedssfeer (Hill-sfeer) van een planeet ligt: dan draait een maan om
 * die planeet en niet om de zon. Anders wint wie het hardst trekt.
 */
export function baasOp(w: Wereld, x: number, y: number, negeer?: Lichaam): Lichaam | null {
  const L = w.lichamen.filter(b => b !== negeer)
  if (!L.length) return null
  const opMassa = [...L].sort((a, b) => a.m - b.m)
  for (const c of opMassa) {
    let P: Lichaam | null = null, best = 0
    for (const o of L) {
      if (o.m <= c.m) continue
      const k = o.m / ((o.x - c.x) ** 2 + (o.y - c.y) ** 2)
      if (k > best) { best = k; P = o }
    }
    if (!P) continue
    const hill = Math.hypot(c.x - P.x, c.y - P.y) * Math.cbrt(c.m / (3 * P.m))
    if (Math.hypot(x - c.x, y - c.y) < 0.6 * hill) return c
  }
  let baas: Lichaam | null = null, best = 0
  for (const o of L) {
    const k = o.m / ((o.x - x) ** 2 + (o.y - y) ** 2 + 1e-12)
    if (k > best) { best = k; baas = o }
  }
  return baas
}

/** Snelheid voor een mooie cirkelbaan (tegen de klok in) rond wie hier de baas is. */
export function cirkelSnelheid(w: Wereld, x: number, y: number, m: number): { baas: Lichaam | null; vx: number; vy: number; v: number } {
  const baas = baasOp(w, x, y)
  if (!baas) return { baas, vx: 0, vy: 0, v: 0 }
  const dx = x - baas.x, dy = y - baas.y
  const d = Math.hypot(dx, dy) || 1e-9
  const v = Math.sqrt(G * (baas.m + m) / d)
  return { baas, vx: baas.vx - v * dy / d, vy: baas.vy + v * dx / d, v }
}

/** Rond `om` op afstand a in een (bijna) cirkelbaan, beginnend bij hoek φ. */
function inBaan(om: { x: number; y: number; vx: number; vy: number; m: number }, a: number, m: number, phi: number, e = 0) {
  const r = a * (1 - e)
  const v = Math.sqrt(G * (om.m + m) * (1 + e) / r)
  return {
    m,
    x: om.x + r * Math.cos(phi), y: om.y + r * Math.sin(phi),
    vx: om.vx - v * Math.sin(phi), vy: om.vy + v * Math.cos(phi),
  }
}

/* ── De scènes ───────────────────────────────────────────────────────────── */

export type Scene = {
  id: string
  titel: string
  /** De vraag, kort, op de knop. */
  knop: string
  /** Een paar zinnen: wat zie je, en wat is echt. */
  uitleg: string
  probeer: string
  /** Halve breedte van het beeld in AE. */
  schaal: number
  /** Dagen per seconde bij normale snelheid. */
  dagenPerSec: number
  /** Planeten en manen groter tekenen in ingezoomde scènes. */
  vergroot?: number
  camera: 'massa' | 'zwaarste'
  maak: (w: Wereld) => void
}

const ZON = { x: 0, y: 0, vx: 0, vy: 0, m: 1 }

function binnenplaneten(w: Wereld, zon = ZON) {
  w.voegToe({ naam: 'Zon', kleur: 'zon', ...zon, r: 0.00465 })
  w.voegToe({ naam: 'Mercurius', kleur: 'mercurius', soort: 'planeet', ...inBaan(zon, 0.387, 1.66e-7, 0.4, 0.206), r: 1.63e-5 })
  w.voegToe({ naam: 'Venus', kleur: 'venus', soort: 'planeet', ...inBaan(zon, 0.723, 2.45e-6, 2.3), r: 4.05e-5 })
  w.voegToe({ naam: 'Aarde', kleur: 'aarde', soort: 'planeet', ...inBaan(zon, 1.0, AARDMASSA, 4.1), r: 4.26e-5 })
  w.voegToe({ naam: 'Mars', kleur: 'mars', soort: 'planeet', ...inBaan(zon, 1.524, 3.23e-7, 5.6, 0.093), r: 2.27e-5 })
}

export const SCENES: Scene[] = [
  {
    id: 'zonnestelsel',
    titel: 'Ons zonnestelsel',
    knop: 'Ons zonnestelsel',
    uitleg: 'De zon met de vier rotsplaneten, op de echte afstanden en met de echte snelheden. Mercurius draait het snelst en zijn baan is het minst rond. Mars doet bijna twee jaar over één rondje.',
    probeer: 'Tik op de zon en haal hem weg. De planeten vliegen dan in een rechte lijn verder, met de vaart die ze op dat moment hadden. Op aarde zouden we het pas na ruim 8 minuten merken: zo lang doet het licht, en ook de zwaartekracht, over de reis.',
    schaal: 1.75, dagenPerSec: 24, camera: 'massa',
    maak: w => binnenplaneten(w),
  },
  {
    id: 'twee-manen',
    titel: 'Wat als de aarde twee manen had?',
    knop: 'Aarde met twee manen',
    uitleg: 'De aarde met onze maan en een tweede, kleinere maan op ruim de helft van de afstand. Ze trekken steeds een beetje aan elkaar. Kijk naar de sporen: de banen blijven niet netjes liggen, maar schuiven en schommelen. De zon laten we hier weg, zodat je de manen goed ziet.',
    probeer: 'Laat het een tijdje lopen en kijk wat de manen met elkaar doen. Sommige onderzoekers denken dat de aarde ooit echt een tweede maantje had, dat langzaam op de maan is gebotst.',
    schaal: 0.0034, dagenPerSec: 3, vergroot: 2, camera: 'zwaarste',
    maak: w => {
      const aarde = { x: 0, y: 0, vx: 0, vy: 0, m: AARDMASSA }
      w.voegToe({ naam: 'Aarde', kleur: 'aarde', soort: 'planeet', ...aarde, r: 4.26e-5 })
      w.voegToe({ naam: 'Maan', kleur: 'maan', soort: 'maan', ...inBaan(aarde, 0.00257, MAANMASSA, 0.3, 0.055), r: 1.16e-5 })
      w.voegToe({ naam: 'Maan 2', kleur: 'maan', soort: 'maan', ...inBaan(aarde, 0.00142, MAANMASSA * 0.35, 2.6), r: 0.8e-5 })
    },
  },
  {
    id: 'twee-zonnen',
    titel: 'Een planeet met twee zonnen',
    knop: 'Twee zonnen',
    uitleg: 'Dit bestaat echt: Kepler-16, op 245 lichtjaar. Twee sterren draaien in 41 dagen om elkaar heen, en een planeet zo zwaar als Saturnus draait in 229 dagen om ze allebei. Daar gaat de zon dus twee keer onder.',
    probeer: 'Zet eens een planeet dicht bij de twee sterren. Die houdt het daar niet lang vol: hij wordt weggeslingerd of botst. Alleen op flinke afstand is een baan rond twee zonnen rustig.',
    schaal: 1.0, dagenPerSec: 8, camera: 'massa',
    maak: w => {
      const mA = 0.69, mB = 0.20, a = 0.224
      const vrel = Math.sqrt(G * (mA + mB) / a)
      w.voegToe({ naam: 'Ster A', kleur: 'zon', m: mA, x: -a * mB / (mA + mB), y: 0, vx: 0, vy: -vrel * mB / (mA + mB), r: 0.0030 })
      w.voegToe({ naam: 'Ster B', kleur: 'rood', m: mB, x: a * mA / (mA + mB), y: 0, vx: 0, vy: vrel * mA / (mA + mB), r: 0.0010 })
      w.voegToe({ naam: 'Kepler-16b', kleur: 'reus', soort: 'reus', ...inBaan({ ...ZON, m: mA + mB }, 0.705, 0.333 * JUPITERMASSA, 1.2) })
    },
  },
  {
    id: 'langsvlieger',
    titel: 'Wat als er een ster langs scheert?',
    knop: 'Ster scheert langs',
    uitleg: 'Een rode dwerg, half zo zwaar als de zon, komt van links aanvliegen en scheert vlak langs ons zonnestelsel. Kijk wat er met de aarde gebeurt als hij voorbij is.',
    probeer: 'Echt zo dichtbij komt een ster vrijwel nooit. De ster van Scholz kwam 70.000 jaar geleden het dichtst bij, maar bleef duizenden keren verder weg dan Mars. Zet zelf een ster neer en sleep om hem een vaart te geven.',
    schaal: 2.6, dagenPerSec: 30, camera: 'zwaarste',
    maak: w => {
      binnenplaneten(w)
      w.voegToe({ naam: 'Rode dwerg', kleur: 'rood', m: 0.5, x: -9, y: 2.0, vx: 5.2, vy: 0, r: 0.0025 })
    },
  },
  {
    id: 'jupiter-ster',
    titel: 'Wat als Jupiter een ster was?',
    knop: 'Jupiter wordt een ster',
    uitleg: 'Jupiter is 80 keer zwaarder gemaakt. Dan wordt hij in zijn kern heet genoeg om als een kleine rode ster te gaan branden. Verrassend: voor de aarde verandert er bijna niets, want Jupiter staat zo ver weg dat zijn trek klein blijft. Aan onze hemel zou hij wel een fel rood lichtpunt zijn, veel helderder dan Venus.',
    probeer: 'Tik op de rode ster en maak hem nog eens tien keer zwaarder. Dan is hij bijna zo zwaar als de zon en wordt het binnen een paar jaar onrustig voor de aarde.',
    schaal: 6.2, dagenPerSec: 70, camera: 'massa',
    maak: w => {
      w.voegToe({ naam: 'Zon', kleur: 'zon', ...ZON, r: 0.00465 })
      w.voegToe({ naam: 'Aarde', kleur: 'aarde', soort: 'planeet', ...inBaan(ZON, 1.0, AARDMASSA, 1.0), r: 4.26e-5 })
      w.voegToe({ naam: 'Mars', kleur: 'mars', soort: 'planeet', ...inBaan(ZON, 1.524, 3.23e-7, 3.4, 0.093), r: 2.27e-5 })
      w.voegToe({ naam: 'Jupiter', ...inBaan(ZON, 5.2, 80 * JUPITERMASSA, 5.0) })
    },
  },
  {
    id: 'leeg',
    titel: 'Begin met één ster',
    knop: 'Zelf bouwen',
    uitleg: 'Alleen een ster, verder niets. Zet er zelf planeten, manen en sterren bij. Tik en hij krijgt vanzelf een nette cirkelbaan. Sleep om zelf te kiezen hoe hard en welke kant op.',
    probeer: 'Zet een gasreus neer en tik dan vlak naast die reus met een maan: de maan gaat om de reus draaien in plaats van om de ster.',
    schaal: 2.0, dagenPerSec: 24, camera: 'massa',
    maak: w => { w.voegToe({ naam: 'Zon', kleur: 'zon', ...ZON, r: 0.00465 }) },
  },
]

export function bouw(scene: Scene): Wereld {
  const w = new Wereld()
  scene.maak(w)
  w.centreer()
  w.grens = scene.schaal * 14
  return w
}

/* ── Getallen in gewone woorden ──────────────────────────────────────────── */

const nl = (n: number, d = 0) => n.toLocaleString('nl-NL', { maximumFractionDigits: d, minimumFractionDigits: 0 })

export function massaTekst(m: number): string {
  if (m >= 0.05) return `${nl(m, 2)} zonmassa`
  if (m >= 30 * AARDMASSA) return `${nl(m / JUPITERMASSA, m / JUPITERMASSA < 10 ? 1 : 0)} keer Jupiter`
  if (m >= 0.05 * AARDMASSA) return `${nl(m / AARDMASSA, m / AARDMASSA < 10 ? 2 : 0)} keer de aarde`
  return `${nl(m / MAANMASSA, 2)} keer onze maan`
}

export function afstandTekst(ae: number): string {
  if (ae >= 0.05) return `${nl(ae, 2)} AE`
  return `${nl(Math.round(ae * KM_PER_AE / 1000) * 1000)} km`
}

export function tijdTekst(jaar: number): string {
  const j = Math.floor(jaar + 1e-9)
  const d = Math.floor((jaar - j) * 365.25 + 1e-6)
  if (j === 0) return `${d} ${d === 1 ? 'dag' : 'dagen'}`
  return `${j} jaar, ${d} ${d === 1 ? 'dag' : 'dagen'}`
}

export function snelheidTekst(dagenPerSec: number): string {
  if (dagenPerSec >= 365.25) return `${nl(dagenPerSec / 365.25, 1)} jaar`
  if (dagenPerSec >= 1) return `${nl(dagenPerSec, dagenPerSec < 10 ? 1 : 0)} ${dagenPerSec === 1 ? 'dag' : 'dagen'}`
  return `${nl(dagenPerSec * 24, 0)} uur`
}
