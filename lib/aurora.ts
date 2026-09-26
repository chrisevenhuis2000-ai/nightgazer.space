// ── Noorderlicht: Kp ophalen en vertalen naar een oordeel ──────────────────
//
// Rechtstreeks bij NOAA, niet via de eigen proxy. Die proxy geeft al sinds
// het formaat van NOAA veranderde `kp: null` terug voor alles, en NOAA stuurt
// zelf `access-control-allow-origin: *`, dus de tussenstap levert hier niets
// op behalve een extra plek waar het stuk kan.
//
// Eén feed volstaat: noaa-planetary-k-index-forecast.json bevat zowel de
// gemeten als de voorspelde waarden, met een veld dat zegt welke welke is.

export const NOAA_KP =
  'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json'

export interface KpEntry {
  tijd: Date
  kp: number
  /** 'gemeten' dekt NOAA's observed én estimated; beide zijn geen prognose. */
  soort: 'gemeten' | 'voorspeld'
}

/**
 * Geomagnetische breedte van Noord-Nederland (Groningen), berekend met de
 * dipoolbenadering rond de geomagnetische pool op 80,65°N 72,68°W. Dit is de
 * breedte die telt voor poollicht — niet de gewone, die ruim een graad lager
 * ligt. Amsterdam komt op 53,4°; het verschil van een halve graad scheelt in
 * de praktijk of je iets ziet of niet.
 */
export const GEOMAG_NOORD_NL = 54.0

/**
 * De equatoriale rand van de poollichtovaal in geomagnetische breedte.
 * Lineaire fit op de gangbare tabel (Kp 0 → 66,5°, Kp 9 → 48,1°), die op
 * elke tussenwaarde binnen 0,2° blijft.
 */
export function ovaalRand(kp: number): number {
  return 66.5 - 2.07 * kp
}

/**
 * Hoe ver de rand van de ovaal ten noorden van Groningen ligt, in kilometer.
 * Negatief betekent dat de ovaal over je heen ligt. Dit getal zegt meer dan
 * de Kp zelf: poollicht hangt op 100 tot 250 km hoogte en is daardoor ook
 * zichtbaar als de ovaal nog een paar honderd kilometer noordelijker staat —
 * je kijkt er dan tegenaan, laag boven de horizon.
 */
export function afstandTotOvaal(kp: number): number {
  return Math.round((ovaalRand(kp) - GEOMAG_NOORD_NL) * 111)
}

export type Toon = 'rust' | 'grens' | 'kans' | 'alarm'

export interface Oordeel {
  toon: Toon
  kort: string
  uitleg: string
  /** Vanaf welke Kp dit oordeel geldt; voor de schaalbalk. */
  drempel: number
}

/**
 * Het oordeel voor Noord-Nederland. De drempels volgen uit de ovaalrand ten
 * opzichte van 54°N geomagnetisch, niet uit een overgenomen vuistregel:
 *
 *   Kp 4 → rand op 58,2°, zo'n 470 km noordelijker. Alleen een camera vangt
 *          dan iets, en alleen boven een volstrekt donkere noordhorizon.
 *   Kp 5 → rand op 56,2°, ruim 240 km. Een groenige gloed laag in het noorden.
 *   Kp 6 → rand op 54,1°, vrijwel boven Groningen. Met het blote oog.
 *   Kp 7 → rand op 52,0°, zuidelijker dan wij. Helder en hoog aan de hemel.
 *
 * Onder Kp 4 is het antwoord gewoon nee, en dat hoort er ook zo te staan.
 */
export function oordeel(kp: number): Oordeel {
  if (kp >= 8) return {
    toon: 'alarm', drempel: 8, kort: 'Tot boven je hoofd',
    uitleg: 'Zware storm. De ovaal ligt over Nederland heen: kleuren tot recht boven je, mogelijk tot in het zuiden van het land.',
  }
  if (kp >= 7) return {
    toon: 'alarm', drempel: 7, kort: 'Grote kans, helder',
    uitleg: 'De ovaal zakt tot onder onze breedte. Met het blote oog duidelijk zichtbaar en hoog genoeg voor kleur — niet alleen een grijze waas.',
  }
  if (kp >= 6) return {
    toon: 'alarm', drempel: 6, kort: 'Goede kans in het noorden',
    uitleg: 'De rand van de ovaal staat vrijwel boven Groningen. Met het blote oog zichtbaar boven de noordelijke horizon, mits het daar helder en donker is.',
  }
  if (kp >= 5) return {
    toon: 'kans', drempel: 5, kort: 'Kleine kans, laag in het noorden',
    uitleg: 'Mogelijk een groenige gloed vlak boven de noordelijke horizon. Een camera met een lange sluitertijd ziet meestal meer dan je oog.',
  }
  if (kp >= 4) return {
    toon: 'grens', drempel: 4, kort: 'Grensgeval',
    uitleg: 'Vanaf hier heeft kijken pas zin, en dan nog alleen met een camera, op een donkere plek met vrij zicht naar het noorden.',
  }
  return {
    toon: 'rust', drempel: 0, kort: 'Geen kans',
    uitleg: 'De ovaal ligt ver boven Scandinavië. Vanuit Nederland valt er niets te zien, ook niet op een foto.',
  }
}

/** Haalt de feed op en zet hem om. Gooit door bij netwerkfouten. */
export async function haalKp(signal?: AbortSignal): Promise<KpEntry[]> {
  const res = await fetch(NOAA_KP, { signal })
  if (!res.ok) throw new Error(`NOAA ${res.status}`)
  const raw: unknown = await res.json()
  if (!Array.isArray(raw)) throw new Error('onverwachte vorm')

  return raw
    .map((r): KpEntry | null => {
      if (!r || typeof r !== 'object' || Array.isArray(r)) return null
      const o = r as Record<string, unknown>
      /* NOAA schrijft het veld in deze feed met kleine letter, in de
         gemeten-feed met hoofdletter. Beide lezen kost niets. */
      const v = Number(o.kp ?? o.Kp)
      const t = String(o.time_tag ?? '')
      if (!Number.isFinite(v) || !t) return null
      /* De tijdstempels dragen geen zone maar zijn UTC. */
      const tijd = new Date(t.endsWith('Z') ? t : `${t}Z`)
      if (Number.isNaN(tijd.getTime())) return null
      return { tijd, kp: v, soort: o.observed === 'predicted' ? 'voorspeld' : 'gemeten' }
    })
    .filter((e): e is KpEntry => e !== null)
    .sort((a, b) => a.tijd.getTime() - b.tijd.getTime())
}

/**
 * De waarde van het blok dat nu loopt, oftewel de meest recente die echt
 * begonnen is.
 *
 * De tijdstempel moet er wel bij gecontroleerd worden: NOAA labelt de
 * blokken van vandaag als 'estimated', ook de blokken die nog moeten komen.
 * Zonder die controle meldt de site om het middaguur de Kp van negen uur
 * vanavond als de actuele waarde.
 */
export function laatstGemeten(entries: KpEntry[], nu = new Date()): KpEntry | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]
    if (e.soort === 'gemeten' && e.tijd <= nu) return e
  }
  return null
}

/**
 * De voorspelling per nacht. NOAA levert blokken van drie uur; voor
 * poollicht tellen alleen de donkere blokken, dus we nemen per nacht het
 * maximum over 21:00-06:00 lokaal. Een piek van Kp 6 om drie uur 's middags
 * is voor een kijker in Nederland geen nieuws.
 */
export interface NachtVerwachting {
  nacht: Date          // de avond waarop de nacht begint
  kp: number
  blokken: KpEntry[]
  voorspeld: boolean
}

export function perNacht(entries: KpEntry[], vanaf = new Date()): NachtVerwachting[] {
  const perDag = new Map<string, KpEntry[]>()

  for (const e of entries) {
    const u = e.tijd.getHours()
    /* Blokken voor 06:00 horen bij de nacht die de vorige avond begon. In de
       winter is het hier al om zes uur donker, dus de avondgrens ligt op
       18:00 en niet op 21:00 — anders mist de verwachting precies de uren
       waarin je in december staat te kijken. */
    const d = new Date(e.tijd)
    if (u < 6) d.setDate(d.getDate() - 1)
    else if (u < 18) continue           // overdag: niet relevant
    const sleutel = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const lijst = perDag.get(sleutel)
    if (lijst) lijst.push(e)
    else perDag.set(sleutel, [e])
  }

  const grens = new Date(vanaf.getFullYear(), vanaf.getMonth(), vanaf.getDate())
  return [...perDag.entries()]
    .map(([sleutel, blokken]) => {
      const [j, m, dg] = sleutel.split('-').map(Number)
      return {
        nacht: new Date(j, m, dg),
        kp: Math.max(...blokken.map(b => b.kp)),
        blokken,
        voorspeld: blokken.some(b => b.soort === 'voorspeld'),
      }
    })
    .filter(n => n.nacht >= grens)
    .sort((a, b) => a.nacht.getTime() - b.nacht.getTime())
}
