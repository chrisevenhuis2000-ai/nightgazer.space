/* De gids "Je eerste telescoop kiezen" op /sterrenkijken/eerste-telescoop.

   Vuistregels, geen meetwaarden: elke tabel en elk diagram op de pagina
   zegt dat er ook bij. De producten zelf (met hun winkellinks) komen uit
   lib/uitrusting.ts, zodat een partnerlink op één plek staat. */

import type { Vorm } from './uitrusting'

/** Grootste vergroting die nog scherp beeld geeft: ongeveer 2× de opening in mm. */
export const maxVergroting = (mm: number) => mm * 2
/** Zwakste ster die je theoretisch nog ziet, onder een donkere hemel. */
export const grensMagnitude = (mm: number) => Math.round((2.7 + 5 * Math.log10(mm)) * 10) / 10

/** Boven deze vergroting laat de Nederlandse lucht het op de meeste nachten afweten. */
export const LUCHT_GRENS = 250

export type Kijker = {
  naam:    string
  kort:    string
  opening: number
  /** Komt dit product uit lib/uitrusting.ts? Dan is het de exacte naam daar. */
  product?: string
  /** Vergroting die op de doos staat; alleen voor het voorbeeld van de goedkope kijker. */
  doos?:   number
}

/** De kijkers in het vergrotingsdiagram, klein naar groot. */
export const KIJKERS: Kijker[] = [
  { naam: 'Goedkope lenzenkijker, 70 mm', kort: '70 mm lens', opening: 70, doos: 525 },
  { naam: 'Sky-Watcher Heritage 130P FlexTube', kort: 'Heritage 130P', opening: 130, product: 'Sky-Watcher Heritage 130P FlexTube' },
  { naam: 'Explore Scientific Comet Hunter', kort: 'Comet Hunter', opening: 152, product: 'Explore Scientific Comet Hunter' },
  { naam: 'Sky-Watcher Skyliner 200P Dobson', kort: 'Skyliner 200P', opening: 200, product: 'Sky-Watcher Skyliner 200P Dobson' },
]

/** 2 = goed te zien, 1 = met moeite of alleen op een goede nacht, 0 = niet. */
export type Zicht = 0 | 1 | 2

export const KOLOMMEN = ['10x50', '130 mm', '152 mm', '200 mm'] as const

export type Doel = { naam: string; wat: string; zicht: [Zicht, Zicht, Zicht, Zicht] }

/** Wat je ziet, per opening. Ruwe inschatting voor een hemel als Bortle 4 tot 5. */
export const DOELEN: Doel[] = [
  { naam: 'Kraters op de maan',        wat: 'Langs de schaduwgrens, het best rond eerste kwartier',  zicht: [2, 2, 2, 2] },
  { naam: 'Manen van Jupiter',         wat: 'Vier stipjes die elke avond anders staan',               zicht: [2, 2, 2, 2] },
  { naam: 'Wolkbanden van Jupiter',    wat: 'Twee donkere banden over de schijf',                     zicht: [0, 2, 2, 2] },
  { naam: 'Ringen van Saturnus',       wat: 'Los van de planeet, vanaf zo’n 30× vergroting',          zicht: [0, 2, 2, 2] },
  { naam: 'Cassinischeiding',          wat: 'De donkere spleet in de ringen',                         zicht: [0, 1, 1, 2] },
  { naam: 'Orionnevel',                wat: 'Grijze gloed met vier sterretjes in het hart',           zicht: [2, 2, 2, 2] },
  { naam: 'Andromedastelsel',          wat: 'Een langgerekte vlek, geen spiraal zoals op foto’s',     zicht: [2, 2, 2, 2] },
  { naam: 'Losse sterren in M13',      wat: 'De bolhoop valt aan de rand uiteen in sterren',          zicht: [0, 1, 1, 2] },
]

export type Soort = { vorm: Vorm; naam: string; tekst: string; plus: string; min: string }

export const SOORTEN: Soort[] = [
  {
    vorm: 'lens',
    naam: 'Lenzentelescoop',
    tekst: 'Een lens voorin bundelt het licht. Dit is de telescoop die je in de speelgoedwinkel ziet.',
    plus: 'Geen onderhoud, scherp beeld van maan en planeten.',
    min:  'Per centimeter opening duur. Onder de €300 vaak een klein exemplaar op een wiebelig statief.',
  },
  {
    vorm: 'newton',
    naam: 'Newton op een Dobson-voet',
    tekst: 'Een holle spiegel achterin vangt het licht. Op een simpele draaivoet die je met de hand duwt.',
    plus: 'De meeste opening voor je geld, en in een minuut opgesteld.',
    min:  'De spiegels moet je af en toe uitlijnen. Groot en zwaar vanaf 200 mm.',
  },
  {
    vorm: 'maknewt',
    naam: 'Maksutov-Newton',
    tekst: 'Een spiegel met een gebogen correctieplaat voorin. Compact, met een breed beeldveld.',
    plus: 'Scherp tot aan de rand van het beeld, ook geschikt voor astrofotografie.',
    min:  'Duurder dan een Newton met dezelfde opening, en zwaarder door de correctieplaat.',
  },
]

export type Advies = { situatie: string; product: string; waarom: string }

export const ADVIEZEN: Advies[] = [
  {
    situatie: 'Klein en snel opgesteld',
    product:  'Sky-Watcher Heritage 130P FlexTube',
    waarom:   'Op tafel, balkon of tuinstoel in een minuut klaar. Ruim genoeg voor de ringen van Saturnus en de banden van Jupiter.',
  },
  {
    situatie: 'Zoveel mogelijk zien',
    product:  'Sky-Watcher Skyliner 200P Dobson',
    waarom:   'De grootste stap in lichtvangst die nog in een auto past. Hier vallen bolhopen uiteen in losse sterren.',
  },
  {
    situatie: 'Kijken en later fotograferen',
    product:  'Explore Scientific Comet Hunter',
    waarom:   'Compact en scherp tot aan de rand. Voor foto’s heb je wel een volgende montering nodig.',
  },
]

export type Fout = { titel: string; tekst: string }

export const FOUTEN: Fout[] = [
  { titel: 'Kopen op vergroting',  tekst: 'Een doos met “525×” zegt niets. Opening bepaalt wat je ziet; vergroting boven twee keer de opening in millimeters geeft alleen een grotere vlek.' },
  { titel: 'Een wiebelig statief', tekst: 'Bij 100× trilt het beeld bij elke aanraking. Een stevige voet is belangrijker dan een extra oculair.' },
  { titel: 'Te groot beginnen',    tekst: 'De telescoop die je het vaakst gebruikt, is de telescoop die je makkelijk naar buiten draagt.' },
  { titel: 'Meteen naar binnen',   tekst: 'Een telescoop moet een half uur afkoelen buiten, en je ogen twintig minuten wennen aan het donker.' },
]

/** Beelden van images.nasa.gov; id’s uit de metadata van images-api.nasa.gov.
    PIA04227 heeft geen ~medium, alleen ~small en ~orig. */
export const GIDS_BEELD = {
  kop:     { nasaId: 'PIA04227', maat: 'orig' as const, titel: 'De Orionnevel door Hubble. Door een telescoop zie je het hart als grijze gloed', credit: 'NASA en het Hubble Heritage Team · 1999' },
  jupiter: { nasaId: 'PIA01593', titel: 'Jupiter door Hubble. Met 130 mm zie je de twee donkere wolkbanden', credit: 'NASA/Hubble Heritage Team · 1999' },
}
