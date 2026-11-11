/* Cadeaugids — /sterrenkijken/cadeaugids

   Dezelfde aanraders als lib/uitrusting.ts, maar gerangschikt zoals iemand
   die een cadeau zoekt ze nodig heeft: op prijsklasse en op voor wie het is.
   Er staan hier geen nieuwe winkellinks; elk product komt op naam uit
   lib/uitrusting.ts, zodat een link maar op één plek hoeft te veranderen.

   De prijsklassen zijn richtlijnen (stand november 2026) en sluiten op elkaar
   aan, zonder gaten. Tussen € en bedrag staat een vaste spatie (U+00A0). Prijzen wisselen
   per winkel en per week, dus de pagina noemt geen bedrag per product. */

import { product, type Product, type NasaMaat } from './uitrusting'

/** Eén beeld van images.nasa.gov: wat je met dit cadeau aan de hemel ziet. */
export type Beeld = { nasaId: string; maat?: NasaMaat; titel: string; credit: string }

export type Cadeau = {
  product: Product
  /** Voor wie dit een goed cadeau is, in één zin. */
  voorWie: string
}

export type Klasse = {
  id:    string
  titel: string
  /** De prijsklasse, als richtlijn. */
  label: string
  intro: string
  beeld: Beeld
  cadeaus: Cadeau[]
}

export const KLASSEN: Klasse[] = [
  {
    id:    'klein',
    titel: 'Een klein cadeau',
    label: 'Tot € 25',
    intro: 'Voor de schoen, of als extraatje bij iets groters. Dit zijn de dingen die elke sterrenkijker gebruikt en zelden voor zichzelf koopt.',
    beeld: {
      nasaId: 'NHQ202108110005',
      titel:  'De Melkweg en een vallende ster boven Spruce Knob, West Virginia. Dit zie je met alleen je ogen, ver van stadslicht',
      credit: 'NASA/Bill Ingalls · augustus 2021',
    },
    cadeaus: [
      { product: product('Hoofdlamp met rood licht'), voorWie: 'Voor iedereen die al een kijker heeft. Je kunt er nooit te veel van hebben.' },
      { product: product('Draaibare sterrenkaart'),   voorWie: 'Voor wie de sterrenbeelden wil leren kennen, ook voor kinderen vanaf een jaar of acht.' },
      { product: product('Sterrengids (jaarlijks)'),  voorWie: 'Voor de lezer: per maand wat er aan de Nederlandse hemel te zien is, het hele jaar door.' },
    ],
  },
  {
    id:    'midden',
    titel: 'Een echt cadeau',
    label: '€ 25 tot € 100',
    intro: 'Een verrekijker is het cadeau waar een beginner het meest aan heeft. Je ziet er direct mee, zonder opbouwen of uitlijnen.',
    beeld: {
      nasaId: 'GSFC_20171208_Archive_e001864',
      titel:  'Een jonge maansikkel. Met een 10x50 zie je de kraters langs de schaduwgrens. Simulatie uit hoogtedata van LRO',
      credit: 'NASA/Goddard Scientific Visualization Studio',
    },
    cadeaus: [
      { product: product('Celestron UpClose G2 10x50'), voorWie: 'Voor wie nog niets heeft. Ook overdag te gebruiken, dus hij belandt niet in de kast.' },
      { product: product('Turn Left at Orion'),         voorWie: 'Voor wie al een telescoop heeft en niet weet waar hij moet kijken.' },
    ],
  },
  {
    id:    'groot',
    titel: 'Een groot cadeau',
    label: '€ 100 tot € 300',
    intro: 'Vanaf hier zie je de ringen van Saturnus en de wolkbanden van Jupiter. Kies liever een kleine goede telescoop dan een grote wankele.',
    beeld: {
      nasaId: 'PIA03162',
      titel:  'Saturnus door Hubble. Door een 130 mm is hij kleiner, maar de ringen zie je meteen los van de bol',
      credit: 'NASA en het Hubble Heritage Team · oktober 2000',
    },
    cadeaus: [
      { product: product('Celestron SkyMaster 15x70'),         voorWie: 'Voor wie al een gewone verrekijker heeft en meer wil zien. Geef er een statief bij.' },
      { product: product('Sky-Watcher Heritage 130P FlexTube'), voorWie: 'De eerste telescoop die ik zou geven: in een minuut opgezet, past op een tuintafel.' },
    ],
  },
  {
    id:    'top',
    titel: 'Het cadeau van het jaar',
    label: 'Vanaf € 300',
    intro: 'Voor iemand die zeker weet dat de hobby blijft. Groot en zwaar, dus overleg of er een plek voor is.',
    beeld: {
      nasaId: 'PIA04227',
      maat:   'orig',
      titel:  'Een deel van de Orionnevel door Hubble. Door 200 mm zie je een grijze gloed met vier sterretjes in het hart, niet deze kleuren',
      credit: 'NASA en het Hubble Heritage Team · 1999',
    },
    cadeaus: [
      { product: product('Sky-Watcher Skyliner 200P Dobson'), voorWie: 'Voor wie een tuin of een auto heeft en jaren vooruit wil. Niet voor op een balkon.' },
    ],
  },
]

/** Wat je beter niet geeft, met de reden. Geen winkellinks. */
export const NIET_DOEN = [
  { titel: 'Een telescoop met "525×" op de doos', tekst: 'Vergroting zegt niets; opening bepaalt wat je ziet. Deze kijkers staan op een wiebelig statief en verdwijnen na twee avonden in de kast.' },
  { titel: 'Een ster met een certificaat',         tekst: 'Geen sterrenkundige organisatie erkent gekochte sternamen. Een avond samen kijken is een beter verhaal.' },
  { titel: 'Een grote telescoop als verrassing',   tekst: 'Boven de 150 mm moet je weten waar hij staat en wie hem tilt. Vraag het eerst, of geef een verrekijker.' },
]

export const CADEAU_KOP: Beeld = {
  nasaId: 'NHQ202108110001',
  titel:  'De Perseïden boven Spruce Knob, West Virginia, met de Melkweg erachter',
  credit: 'NASA/Bill Ingalls · augustus 2021',
}

/** Het cadeau dat niets kost: een avond samen kijken. */
export const GRATIS_BEELD: Beeld = {
  nasaId: 'NHQ202108110003',
  titel:  'Een vallende ster boven de bomen van Spruce Knob. Een thermoskan en een donkere plek zijn genoeg',
  credit: 'NASA/Bill Ingalls · augustus 2021',
}
