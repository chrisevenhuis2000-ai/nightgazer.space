/* Aanraders voor /sterrenkijken/uitrusting.

   Eén bestand voor alle producten en winkellinks, zodat een partnerlink
   vervangen nooit meer is dan één regel plakken. Een winkel zonder link
   krijgt geen knop; een product zonder enige link toont alleen de uitleg.

   Bol: partnerlinks via partner.bol.com met de site-ID van NightGazer, naar
   de zoekresultaten voor het product. Een link uit de linkgenerator van Bol
   (naar een productpagina) mag er direct voor in de plaats.
   Amazon.nl: nog gewone zoeklinks, tot er een tracking-ID is. */

export type Winkel = 'bol' | 'amazon'

export const WINKEL_NAAM: Record<Winkel, string> = {
  bol:    'Bol',
  amazon: 'Amazon.nl',
}

/** Optisch schema op de productkaart. Alleen voor wat echt optiek is. */
export type Vorm = 'porro' | 'newton' | 'maknewt'

export type Product = {
  naam:   string
  /** Korte naam voor het lichtvangst-diagram. */
  kort?:  string
  /** Waarom dit product, in één of twee zinnen. */
  waarom: string
  /** Gebruikt de maker het zelf? Dan zegt de pagina dat. */
  zelf?:  boolean
  vorm?:  Vorm
  /** Opening in mm: zet het product in het lichtvangst-diagram. */
  opening?: number
  specs?: { label: string; waarde: string }[]
  links:  Partial<Record<Winkel, string>>
}

export type Groep = {
  id:    string
  titel: string
  /** Korte regel onder de titel: voor wie of wanneer. */
  label: string
  intro: string
  /** Wat je met deze stap ziet: één beeld van images.nasa.gov. */
  beeld: { nasaId: string; titel: string; credit: string }
  producten: Product[]
}

export const nasaBeeld = (id: string, maat: 'small' | 'medium' = 'medium') =>
  `https://images-assets.nasa.gov/image/${id}/${id}~${maat}.jpg`
export const nasaPagina = (id: string) => `https://images.nasa.gov/details/${id}`

/** De pupil van een donker-aangepast oog, de maat waartegen alles telt. */
export const OOG_MM = 7
export const lichtvangst = (mm: number) => Math.round((mm / OOG_MM) ** 2)

/** Het beeld achter de kop van de pagina. Alle id's komen uit de metadata
    van images-api.nasa.gov, niets uit het geheugen. */
export const KOPBEELD = {
  nasaId: 'NHQ202108100009',
  titel:  'Een Perseïde boven Spruce Knob, West Virginia, met de Melkweg erachter',
  credit: 'NASA/Bill Ingalls · 2021',
}

const BOL_SITE_ID = '1552276'
const bol = (q: string) => {
  const doel = `https://www.bol.com/nl/nl/s/?searchtext=${encodeURIComponent(q)}`
  return `https://partner.bol.com/click/click?p=2&t=url&s=${BOL_SITE_ID}&f=TXL`
    + `&url=${encodeURIComponent(doel)}&name=${encodeURIComponent(q)}`
}
// TIJDELIJK: gewone zoeklink, nog zonder tracking-ID.
const amazon = (q: string) => `https://www.amazon.nl/s?k=${encodeURIComponent(q)}`

export const GROEPEN: Groep[] = [
  {
    id:    'basis',
    titel: 'Voor de eerste avond',
    label: 'Klein budget',
    intro: 'Je ogen zijn het eerste instrument. Met een rood lampje en een sterrenkaart vind je de sterrenbeelden zonder je nachtzicht kwijt te raken.',
    beeld: {
      nasaId: 'NHQ202508030001',
      titel:  'Een meteoor boven Spruce Knob, West Virginia. Meteoren zie je het best met het blote oog',
      credit: 'NASA/Bill Ingalls · 2025',
    },
    producten: [
      {
        naam:   'Hoofdlamp met rood licht',
        waarom: 'Wit licht kost je twintig minuten aan donkeraanpassing; rood licht niet. Handen vrij voor kaart en telescoop.',
        links:  { bol: bol('hoofdlamp rood licht'), amazon: amazon('hoofdlamp rood licht') },
      },
      {
        naam:   'Draaibare sterrenkaart',
        waarom: 'Stel datum en tijd in en je ziet welke sterrenbeelden er boven je staan. Werkt zonder batterij en zonder fel scherm.',
        links:  { bol: bol('draaibare sterrenkaart'), amazon: amazon('draaibare sterrenkaart') },
      },
    ],
  },
  {
    id:    'verrekijker',
    titel: 'Een verrekijker',
    label: 'De slimste eerste aankoop',
    intro: 'Een verrekijker laat de manen van Jupiter, de kraters van de maan en de Andromedanevel zien, en past in elke tas.',
    beeld: {
      nasaId: 'GSFC_20171208_Archive_e001863',
      titel:  'Eerste kwartier: langs de schaduwgrens springen de kraters eruit. Simulatie uit hoogtedata van LRO',
      credit: 'NASA/Goddard · LRO',
    },
    producten: [
      {
        naam:   'Celestron UpClose G2 10x50',
        kort:   '10x50',
        vorm:   'porro',
        opening: 50,
        specs:  [{ label: 'Vergroting', waarde: '10×' }, { label: 'Opening', waarde: '50 mm' }],
        waarom: 'Het klassieke formaat voor de nachthemel: 50 mm vangt genoeg licht en je houdt hem nog uit de hand stil.',
        links:  { bol: bol('Celestron UpClose G2 10x50'), amazon: amazon('Celestron UpClose G2 10x50') },
      },
      {
        naam:   'Celestron SkyMaster 15x70',
        kort:   '15x70',
        vorm:   'porro',
        opening: 70,
        specs:  [{ label: 'Vergroting', waarde: '15×' }, { label: 'Opening', waarde: '70 mm' }],
        waarom: 'Meer vergroting en meer licht voor sterrenhopen en nevels. Zwaar genoeg dat je hem op een statief zet.',
        links:  { bol: bol('Celestron SkyMaster 15x70'), amazon: amazon('Celestron SkyMaster 15x70') },
      },
    ],
  },
  {
    id:    'telescoop',
    titel: 'Een eerste telescoop',
    label: 'Als je verder wilt',
    intro: 'Voor beginners werkt een eenvoudige spiegeltelescoop het best: veel opening voor je geld en snel opgesteld.',
    beeld: {
      nasaId: 'PIA03162',
      titel:  'Saturnus door Hubble. Door een eerste telescoop is hij kleiner, maar de ringen zie je meteen',
      credit: 'NASA en het Hubble Heritage Team · oktober 2000',
    },
    producten: [
      {
        naam:   'Sky-Watcher Heritage 130P FlexTube',
        kort:   'Heritage 130P',
        vorm:   'newton',
        opening: 130,
        specs:  [{ label: 'Opening', waarde: '130 mm' }, { label: 'Brandpunt', waarde: '650 mm' }],
        waarom: 'Een tafeltelescoop die je in een minuut opzet. Genoeg voor de ringen van Saturnus en de banden van Jupiter.',
        links:  { bol: bol('Sky-Watcher Heritage 130P'), amazon: amazon('Sky-Watcher Heritage 130P') },
      },
      {
        naam:   'Sky-Watcher Skyliner 200P Dobson',
        kort:   'Skyliner 200P',
        vorm:   'newton',
        opening: 200,
        specs:  [{ label: 'Opening', waarde: '200 mm' }, { label: 'Brandpunt', waarde: '1200 mm' }],
        waarom: '200 mm opening op een simpele draaibare voet. Groot, maar je groeit er jaren niet uit.',
        links:  { bol: bol('Sky-Watcher Skyliner 200P'), amazon: amazon('Sky-Watcher Skyliner 200P') },
      },
      {
        naam:   'Explore Scientific Comet Hunter',
        kort:   'Comet Hunter',
        vorm:   'maknewt',
        opening: 152,
        specs:  [{ label: 'Opening', waarde: '152 mm' }, { label: 'Brandpunt', waarde: '731 mm' }],
        waarom: 'Een compacte Maksutov-Newton met een breed beeldveld, geschikt voor kijken en voor astrofotografie.',
        zelf:   true,
        links:  { bol: bol('Explore Scientific Comet Hunter'), amazon: amazon('Explore Scientific Comet Hunter') },
      },
    ],
  },
  {
    id:    'boeken',
    titel: 'Boeken en gidsen',
    label: 'Voor bewolkte avonden',
    intro: 'Een goede gids vertelt je wat je ziet en waar je moet zoeken. Ook als het buiten bewolkt is.',
    beeld: {
      nasaId: 'sts054-97-018',
      titel:  'Orion, het sterrenbeeld waar Turn Left at Orion zijn naam aan dankt',
      credit: 'NASA · bemanning STS-54, 1993',
    },
    producten: [
      {
        naam:   'Sterrengids (jaarlijks)',
        waarom: 'Het Nederlandse jaarboek met per maand de planeten, de maan, verduisteringen en meteorenzwermen.',
        links:  { bol: bol('Sterrengids'), amazon: amazon('Sterrengids') },
      },
      {
        naam:   'Turn Left at Orion',
        waarom: 'Engelstalig, maar de beste gids om met een kleine telescoop objecten echt te vinden, met tekeningen van wat je in het oculair ziet.',
        links:  { bol: bol('Turn Left at Orion'), amazon: amazon('Turn Left at Orion') },
      },
    ],
  },
]
