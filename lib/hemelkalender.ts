/* Hemelkalender 2027 — /sterrenkijken/hemelkalender

   De pdf-kalender die via de Ko-fi-shop verkocht wordt. De data komen uit de
   generator (astronomy-engine, berekend voor Utrecht); hier staat alleen wat
   de productpagina toont. De voorbeeldpagina's in public/hemelkalender/ zijn
   schermafdrukken van de echte pdf. */

import type { NasaMaat } from './uitrusting'

export const KALENDER_URL = 'https://ko-fi.com/s/7ba52ed831'
export const KALENDER_PRIJS = '€4'
export const KALENDER_JAAR = 2027

export type KalenderBeeld = { nasaId: string; maat?: NasaMaat; maand: string; titel: string; credit: string }

/** Het voorblad: een Perseïde boven de Melkweg. */
export const KALENDER_KOP: KalenderBeeld = {
  nasaId: 'NHQ202108100009', maand: 'Voorblad',
  titel: 'Een Perseïde boven Spruce Knob, West Virginia, augustus 2021', credit: 'NASA/Bill Ingalls',
}

/** De hoogtepunten van 2027 boven Nederland, uit de generator. */
export const HOOGTEPUNTEN: { datum: string; titel: string; noot: string }[] = [
  { datum: '11 februari', titel: 'Jupiter in oppositie', noot: 'De hele nacht zichtbaar, op zijn helderst.' },
  { datum: '19 februari', titel: 'Mars in oppositie', noot: 'Een week na Jupiter staat ook Mars tegenover de zon.' },
  { datum: '2 augustus', titel: 'Gedeeltelijke zonsverduistering', noot: 'Van 10:08 tot 12:04; de maan bedekt 39% van de zon.' },
  { datum: '13 augustus', titel: 'Perseïden', noot: 'Tot 100 vallende sterren per uur, en de maan staat onder de horizon.' },
  { datum: '18 oktober', titel: 'Saturnus in oppositie', noot: 'De ringplaneet de hele nacht aan de hemel.' },
  { datum: '14 december', titel: 'Geminiden', noot: 'De rijkste zwerm van het jaar, dit keer wel bij volle maan.' },
]

/** Wat er in de kalender staat. */
export const INHOUD: string[] = [
  'Elke nacht de stand van de maan, om 21:00 uur',
  'Planeten, meteorenzwermen en verduisteringen op de dag zelf',
  'Zon op en onder, en vanaf hoe laat het echt donker is',
  'Welke planeten je ’s\u00a0avonds en ’s\u00a0ochtends ziet',
  'Per maand een groot NASA-beeld met uitleg en bron',
  'Voorin een leeswijzer, alle tijden in Nederlandse tijd',
]

/** Voorbeeldpagina's uit de pdf. */
export const VOORBEELDEN: { src: string; alt: string }[] = [
  { src: '/hemelkalender/voorblad.jpg', alt: 'Voorblad van de Hemelkalender 2027 met een vallende ster boven de Melkweg' },
  { src: '/hemelkalender/februari.jpg', alt: 'Februari: Mars door Hubble boven het maandraster met maanfasen en de opposities van Jupiter en Mars' },
  { src: '/hemelkalender/augustus.jpg', alt: 'Augustus: de gedeeltelijke zonsverduistering boven het maandraster met de Perseïden' },
  { src: '/hemelkalender/leeswijzer.jpg', alt: 'De leeswijzer: hoe je de maan, de tijden en de woorden in de kalender leest' },
]

/** De twaalf maandbeelden, zoals in de pdf (images.nasa.gov). */
export const MAANDBEELDEN: KalenderBeeld[] = [
  { maand: 'Januari', nasaId: 'PIA03162', titel: 'Saturnus door Hubble', credit: 'NASA en het Hubble Heritage Team (STScI/AURA)' },
  { maand: 'Februari', nasaId: 'GSFC_20171208_Archive_e000332', titel: 'Mars door Hubble', credit: 'NASA, ESA, het Hubble Heritage Team (STScI/AURA), J. Bell (ASU), M. Wolff (SSI)' },
  { maand: 'Maart', nasaId: 'PIA04227', maat: 'orig', titel: 'De Orionnevel', credit: 'NASA en het Hubble Heritage Team (STScI/AURA)' },
  { maand: 'April', nasaId: 'GSFC_20171208_Archive_e001861', titel: 'De volle maan', credit: 'NASA/Goddard Scientific Visualization Studio' },
  { maand: 'Mei', nasaId: 'GSFC_20171208_Archive_e001864', titel: 'Een wassende maansikkel', credit: 'NASA/Goddard Scientific Visualization Studio' },
  { maand: 'Juni', nasaId: 'iss071e364425', titel: 'Lichtende nachtwolken vanuit het ISS', credit: 'NASA/JSC' },
  { maand: 'Juli', nasaId: 'PIA26681', titel: 'De zon door SDO', credit: 'NASA/GSFC/Solar Dynamics Observatory' },
  { maand: 'Augustus', nasaId: 'NHQ202608120103', titel: 'Een gedeeltelijke zonsverduistering', credit: 'NASA/Joel Kowsky' },
  { maand: 'September', nasaId: 'PIA02210', maat: 'orig', titel: 'Neptunus door Voyager 2', credit: 'NASA/JPL' },
  { maand: 'Oktober', nasaId: 'PIA12513', maat: 'orig', titel: 'Saturnus en Rhea door Cassini', credit: 'NASA/JPL/Space Science Institute' },
  { maand: 'November', nasaId: 'PIA18182', titel: 'Uranus door Voyager 2', credit: 'NASA/JPL-Caltech' },
  { maand: 'December', nasaId: 'NHQ202108110003', titel: 'Een vallende ster', credit: 'NASA/Bill Ingalls' },
]
