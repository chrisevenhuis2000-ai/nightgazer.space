// ── 30 nachten omhoog — campagne 16 november t/m 15 december 2026 ────────
//
// Elke avond (of ochtend) één ding om te zien boven Nederland, van de
// Leoniden tot de Geminiden. De posities zijn uitgerekend met
// astronomy-engine voor Utrecht (52,09 N 5,12 O), tijden in Nederlandse
// wintertijd. Elders in Nederland scheelt het hooguit een paar minuten.
// Leoniden en Geminiden: hemel.waarnemen.com (gecontroleerd 10-11-2026).
// Voyager 1 op één lichtdag: JPL Horizons (zie video/sonde-race).

export const OMHOOG_START = '2026-11-16'
export const OMHOOG_EINDE = '2026-12-15'

export type Hulpmiddel = 'oog' | 'verrekijker' | 'telescoop'

export interface Nacht {
  datum: string        // YYYY-MM-DD, de avond (of de ochtend) waarop het te zien is
  titel: string
  tekst: string
  wanneer: string      // tijd en richting, kort
  met: Hulpmiddel
  ochtend?: boolean    // vroeg opstaan in plaats van 's avonds
  link?: { href: string; tekst: string }
}

export const HULPMIDDEL: Record<Hulpmiddel, string> = {
  oog: 'Blote oog',
  verrekijker: 'Verrekijker',
  telescoop: 'Kleine telescoop',
}

export const NACHTEN: Nacht[] = [
  {
    datum: '2026-11-16', ochtend: true, met: 'oog',
    titel: 'Mars en Jupiter naast elkaar',
    tekst: 'De uitdaging begint vroeg. Twee planeten staan maar 1,2 graad uit elkaar, ongeveer twee vingers breed op armlengte. Jupiter is de felle witte, Mars het oranje stipje ernaast.',
    wanneer: 'Ochtend rond 06:30, hoog in het zuiden',
  },
  {
    datum: '2026-11-17', met: 'oog',
    titel: 'Leoniden: vallende sterren',
    tekst: 'De Leoniden hebben vannacht hun piek. Reken bij een donkere hemel op 10 à 15 per uur, snel en soms met een spoor. Na middernacht is de maan onder en wordt het donkerder.',
    wanneer: 'Piek rond 21:00, maan onder om 00:06, kijk naar het oosten',
  },
  {
    datum: '2026-11-18', met: 'oog',
    titel: 'Eén lichtdag: Voyager 1',
    tekst: 'Vandaag is Voyager 1 voor het eerst een volle lichtdag van ons vandaan. Een radiosignaal dat nu vertrekt, komt morgen pas aan. Kijk vanavond naar de halve maan en bedenk: dat licht deed er iets meer dan een seconde over.',
    wanneer: 'Hele avond, maan in het zuiden',
    link: { href: '/nieuws/novembers-night-sky-notes-light-day-away/', tekst: 'Lees over de mijlpaal' },
  },
  {
    datum: '2026-11-19', met: 'verrekijker',
    titel: 'Het Zevengesternte',
    tekst: 'Tel hoeveel sterren je met het blote oog ziet: de meeste mensen komen op zes of zeven. Pak dan een verrekijker erbij en het worden er tientallen.',
    wanneer: '21:00, halfhoog in het oosten',
  },
  {
    datum: '2026-11-20', met: 'oog',
    titel: 'De maan bij Saturnus',
    tekst: 'Rechts van de maan staat een rustig, gelig puntje dat niet fonkelt. Dat is Saturnus, ruim vijf graden van de maan, ongeveer een vuist breed.',
    wanneer: '20:00, in het zuiden',
  },
  {
    datum: '2026-11-21', met: 'oog',
    titel: 'Vind de Poolster',
    tekst: 'Zoek de Grote Beer laag in het noorden. Trek een lijn door de twee achterste sterren van de steelpan en ga vijf keer die afstand omhoog: daar staat de Poolster, de enige ster die nooit beweegt.',
    wanneer: 'Hele avond, noorden',
  },
  {
    datum: '2026-11-22', met: 'oog',
    titel: 'Capella, de gele reus',
    tekst: 'De felste ster hoog in het noordoosten is Capella. Het zijn eigenlijk twee reuzensterren die om elkaar heen draaien, 43 lichtjaar ver.',
    wanneer: '21:00, hoog in het noordoosten',
  },
  {
    datum: '2026-11-23', met: 'oog',
    titel: 'Gezichten in de maan',
    tekst: 'De maan is bijna vol. De donkere vlekken zijn oude lavavlaktes, de "zeeën". Zie jij het konijn, het gezicht of de vrouw met de mand?',
    wanneer: 'Hele avond, oosten tot zuiden',
  },
  {
    datum: '2026-11-24', met: 'verrekijker',
    titel: 'Volle maan naast het Zevengesternte',
    tekst: 'De volle maan staat vanavond op ruim vijf graden van het Zevengesternte. Met een verrekijker zie je ze samen in beeld als je de maan net naar de rand schuift.',
    wanneer: '20:00, oosten',
  },
  {
    datum: '2026-11-25', met: 'oog',
    titel: 'Orion komt op',
    tekst: 'De wintersterren melden zich. Orion klimt schuin boven de horizon, met rode Betelgeuze linksboven en blauwwitte Rigel rechtsonder. Zie je het kleurverschil?',
    wanneer: 'Na 22:00, laag in het oosten',
  },
  {
    datum: '2026-11-26', met: 'oog',
    titel: 'Het ISS zien overkomen',
    tekst: 'Het ruimtestation is een felle, rustige stip die in een paar minuten over de hemel schuift. Op Sterrenkijken staan de overgangen van deze week voor jouw plek.',
    wanneer: 'Tijd per overgang, zie de lijst',
    link: { href: '/sterrenkijken/', tekst: 'ISS-overgangen bekijken' },
  },
  {
    datum: '2026-11-27', met: 'oog',
    titel: 'De zomerdriehoek neemt afscheid',
    tekst: 'Vega, Deneb en Altair vormen nog een grote driehoek in het westen, de laatste groet van de zomer. Over een paar weken zijn ze vroeg op de avond al onder.',
    wanneer: 'Kort na het donker, westen',
    link: { href: '/sterrenkijken/eerste-telescoop/', tekst: 'Eerst een telescoop? Lees dit vóór Black Friday' },
  },
  {
    datum: '2026-11-28', met: 'verrekijker',
    titel: 'De Andromedanevel',
    tekst: 'De maan komt pas om 20:46 op, dus vroeg op de avond is het donker. Bijna recht boven je hoofd zit een vaag langwerpig vlekje: een ander sterrenstelsel, 2,5 miljoen lichtjaar ver.',
    wanneer: '19:00 tot 20:30, bijna recht boven je',
  },
  {
    datum: '2026-11-29', met: 'verrekijker',
    titel: 'De Dubbele Sterrenhoop',
    tekst: 'Tussen Cassiopeia (de W) en Perseus liggen twee sterrenhopen naast elkaar. In een verrekijker lijkt het op een handvol strooisuiker.',
    wanneer: '20:00 tot 22:00, hoog in het noordoosten',
  },
  {
    datum: '2026-11-30', ochtend: true, met: 'oog',
    titel: 'De maan bij Jupiter en Mars',
    tekst: 'Vroeg op: de maan staat ruim twee graden van Jupiter, met Mars er een stukje naast. Drie heldere lichten in een rijtje.',
    wanneer: 'Ochtend rond 06:30, hoog in het zuidwesten',
  },
  {
    datum: '2026-12-01', met: 'verrekijker',
    titel: 'De Orionnevel',
    tekst: 'Onder de drie gordelsterren van Orion hangt het "zwaard". De middelste ster is geen ster maar een gaswolk waarin nieuwe sterren ontstaan, ook in een verrekijker al wazig.',
    wanneer: 'Na 22:30, zuidoosten',
  },
  {
    datum: '2026-12-02', met: 'verrekijker',
    titel: 'Uranus zoeken',
    tekst: 'Uranus staat tussen het Zevengesternte en de rode ster Aldebaran, iets dichter bij het Zevengesternte. In een verrekijker is het een zwak sterretje met een groenblauwe tint. De maan komt pas om 02:18 op.',
    wanneer: '21:00 tot 23:00, oosten tot zuidoosten',
  },
  {
    datum: '2026-12-03', met: 'telescoop',
    titel: 'Saturnus en Titan',
    tekst: 'In een kleine telescoop zie je Saturnus met zijn ringen en een sterretje ernaast: Titan, de grootste maan. Saturnus staat nog maar een paar weken goed op de avond.',
    wanneer: '19:00 tot 21:00, zuiden',
  },
  {
    datum: '2026-12-04', met: 'oog',
    titel: 'De Geminiden zijn begonnen',
    tekst: 'Vanaf nu valt er af en toe al een Geminide, traag en vaak fel. Het zijn er nog maar een paar per uur, maar het is een goede oefening voor de grote nacht.',
    wanneer: 'Na 21:00, overal aan de hemel',
  },
  {
    datum: '2026-12-05', ochtend: true, met: 'oog',
    titel: 'Sinterklaasochtend: maan en Venus',
    tekst: 'Voor wie vroeg wakker is: een dun maansikkeltje staat zeven graden van Venus, de helderste "ster" die je kunt zien.',
    wanneer: 'Ochtend 07:00 tot 07:45, laag in het zuidoosten',
    link: { href: '/sterrenkijken/cadeaugids/', tekst: 'Nog een cadeau nodig?' },
  },
  {
    datum: '2026-12-06', met: 'oog',
    titel: 'Sirius fonkelt',
    tekst: 'De helderste ster aan de hele nachthemel komt op. Laag bij de horizon flitst Sirius in alle kleuren, doordat onze lucht het licht breekt.',
    wanneer: 'Na 22:30, laag in het zuidoosten',
  },
  {
    datum: '2026-12-07', met: 'verrekijker',
    titel: 'De V van de Stier',
    tekst: 'Onder het Zevengesternte staat een V van sterren, de Hyaden, met rode Aldebaran als het oog van de stier. In een verrekijker vult de V het hele beeld.',
    wanneer: '21:00, oosten',
  },
  {
    datum: '2026-12-08', met: 'oog',
    titel: 'Hoe donker is jouw hemel?',
    tekst: 'Morgen is het nieuwe maan. Tel hoeveel sterren je binnen het Grote Vierkant van Pegasus ziet. Nul is stadshemel, vier of meer is mooi donker.',
    wanneer: '19:00 tot 21:00, hoog in het zuiden',
    link: { href: '/sterrenkijken/', tekst: 'Donkere plekken bij jou in de buurt' },
  },
  {
    datum: '2026-12-09', met: 'oog',
    titel: 'Nieuwe maan: de Melkweg',
    tekst: 'Donkerder dan vannacht wordt het deze maand niet. Buiten de stad zie je een zachte band van licht van Cassiopeia naar het zuidwesten lopen: onze eigen Melkweg, van de zijkant.',
    wanneer: 'Vanaf 19:00, ver van straatlicht',
  },
  {
    datum: '2026-12-10', met: 'oog',
    titel: 'Vier planeten in één nacht',
    tekst: 'Saturnus in het zuiden op de avond, Jupiter die rond middernacht opkomt, Mars ernaast en Venus vlak voor zonsopkomst. Hoeveel haal jij?',
    wanneer: 'Avond tot ochtend',
  },
  {
    datum: '2026-12-11', met: 'oog',
    titel: 'Vind de Tweelingen',
    tekst: 'Castor en Pollux zijn twee heldere sterren naast elkaar, links boven Orion. Daar lijken de Geminiden vandaan te komen. Zoek ze vanavond alvast op.',
    wanneer: '21:00, oosten',
  },
  {
    datum: '2026-12-12', met: 'oog',
    titel: 'Klaarmaken voor de grote nacht',
    tekst: 'Zet een tuinstoel klaar, leg een deken neer en kijk alvast de weersverwachting. Je ogen hebben 20 minuten nodig om aan het donker te wennen; kijk in die tijd niet op je telefoon.',
    wanneer: 'Overdag',
  },
  {
    datum: '2026-12-13', met: 'oog',
    titel: 'Geminidennacht: tel mee',
    tekst: 'De mooiste meteorenzwerm van het jaar, en de maan gaat al om 20:38 onder. Bij een heel donkere hemel kan het tegen de 120 per uur lopen, in een tuin eerder 20 tot 40. Tel ze en geef je telling hieronder door.',
    wanneer: 'Vanaf 21:00, best rond 04:30',
    link: { href: '#tel-mee', tekst: 'Naar het telformulier' },
  },
  {
    datum: '2026-12-14', met: 'oog',
    titel: 'Nog een Geminidennacht',
    tekst: 'De zwerm is nog flink actief en de maan is om 21:51 onder. Bekijk de uitslag van de telling en probeer het vannacht nog een keer.',
    wanneer: 'Na 22:00, overal aan de hemel',
    link: { href: '#tel-mee', tekst: 'Uitslag van de telling' },
  },
  {
    datum: '2026-12-15', met: 'oog',
    titel: 'Je dertigste nacht',
    tekst: 'Kies je favoriet van deze maand en ga er nog één keer voor naar buiten. Wat er in 2027 te zien is, staat nacht voor nacht in de Hemelkalender.',
    wanneer: 'Wanneer jij wilt',
    link: { href: '/sterrenkijken/hemelkalender/', tekst: 'Hemelkalender 2027' },
  },
]

/** De nacht van vandaag, of null buiten de campagne. `vandaag` = YYYY-MM-DD. */
export function nachtVan(vandaag: string): number {
  return NACHTEN.findIndex(n => n.datum === vandaag)
}

// ── Tel de Geminiden ─────────────────────────────────────────────────────

export const PROVINCIES = [
  'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg',
  'Noord-Brabant', 'Noord-Holland', 'Overijssel', 'Utrecht', 'Zeeland', 'Zuid-Holland',
  'België', 'Elders',
]

export const HEMEL = ['Helder', 'Wat bewolkt', 'Veel bewolkt'] as const

/** Het formulier staat open van zo 13 dec 18:00 tot di 15 dec 12:00 (NL-tijd). */
export const TEL_OPEN = '2026-12-13T17:00:00Z'
export const TEL_DICHT = '2026-12-15T11:00:00Z'
