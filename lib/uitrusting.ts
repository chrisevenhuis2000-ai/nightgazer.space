/* Aanraders voor /sterrenkijken/uitrusting.

   Eén bestand voor alle producten en winkellinks, zodat een partnerlink
   vervangen nooit meer is dan één regel plakken. Een winkel zonder link
   krijgt geen knop; een product zonder enige link toont alleen de uitleg.

   TIJDELIJK: de links hieronder zijn gewone zoeklinks. Vervang ze door de
   partnerlinks uit het Bol Partnerprogramma en Amazon.nl Associates. */

export type Winkel = 'bol' | 'amazon'

export const WINKEL_NAAM: Record<Winkel, string> = {
  bol:    'Bol',
  amazon: 'Amazon.nl',
}

export type Product = {
  naam:   string
  /** Waarom dit product, in één of twee zinnen. */
  waarom: string
  /** Gebruikt de maker het zelf? Dan zegt de pagina dat. */
  zelf?:  boolean
  links:  Partial<Record<Winkel, string>>
}

export type Groep = {
  id:    string
  titel: string
  /** Korte regel onder de titel: voor wie of wanneer. */
  label: string
  intro: string
  producten: Product[]
}

const bol    = (q: string) => `https://www.bol.com/nl/nl/s/?searchtext=${encodeURIComponent(q)}`
const amazon = (q: string) => `https://www.amazon.nl/s?k=${encodeURIComponent(q)}`

export const GROEPEN: Groep[] = [
  {
    id:    'basis',
    titel: 'Voor de eerste avond',
    label: 'Klein budget',
    intro: 'Je ogen zijn het eerste instrument. Met een rood lampje en een sterrenkaart vind je de sterrenbeelden zonder je nachtzicht kwijt te raken.',
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
    producten: [
      {
        naam:   'Celestron UpClose G2 10x50',
        waarom: 'Het klassieke formaat voor de nachthemel: 50 mm vangt genoeg licht en je houdt hem nog uit de hand stil.',
        links:  { bol: bol('Celestron UpClose G2 10x50'), amazon: amazon('Celestron UpClose G2 10x50') },
      },
      {
        naam:   'Celestron SkyMaster 15x70',
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
    producten: [
      {
        naam:   'Sky-Watcher Heritage 130P FlexTube',
        waarom: 'Een tafeltelescoop die je in een minuut opzet. Genoeg voor de ringen van Saturnus en de banden van Jupiter.',
        links:  { bol: bol('Sky-Watcher Heritage 130P'), amazon: amazon('Sky-Watcher Heritage 130P') },
      },
      {
        naam:   'Sky-Watcher Skyliner 200P Dobson',
        waarom: '200 mm opening op een simpele draaibare voet. Groot, maar je groeit er jaren niet uit.',
        links:  { bol: bol('Sky-Watcher Skyliner 200P'), amazon: amazon('Sky-Watcher Skyliner 200P') },
      },
      {
        naam:   'Explore Scientific Comet Hunter',
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
