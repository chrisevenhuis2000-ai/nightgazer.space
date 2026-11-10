// ── Raad de hemelfoto ────────────────────────────────────────────────────────
//
// Elke dag één echt beeld uit images.nasa.gov, eerst ver ingezoomd. Elke
// foute gok zoomt verder uit; na zes pogingen zie je de hele foto. Iedereen
// krijgt op dezelfde dag dezelfde foto (Nederlandse kalenderdag).
//
// Alle nasaId's, varianten en makers komen uit de metadata van
// images-api.nasa.gov (gecontroleerd november 2026), niets uit het geheugen.
// De pure logica staat hier, zodat scripts/test-hemelfoto.mjs hem kan testen
// zonder de pagina.

export type Soort =
  | 'Planeet' | 'Dwergplaneet' | 'Maan' | 'Ster' | 'Komeet'
  | 'Nevel' | 'Restant van een ster' | 'Sterrenhoop' | 'Sterrenstelsel'
  | 'Verschijnsel' | 'Ruimtevaartuig'

/** Iets wat je kunt raden. Ook de lokkers (zonder foto) hebben soort en
    afstand, zodat elke gok echte aanwijzingen oplevert. */
export type Kandidaat = {
  id: string
  naam: string
  /** Andere namen waarop je kunt zoeken (Messier-nummer, Engelse naam). */
  ook?: string[]
  soort: Soort
  /** Typische afstand tot de aarde, in lichtjaren. Alleen om te vergelijken. */
  lj: number
}

export type Hemelfoto = Kandidaat & {
  nasaId: string
  /** Grootste variant op images-assets.nasa.gov die bestaat. */
  variant: 'large' | 'medium' | 'orig'
  credit: string
  /** Waar het ingezoomde begin op valt, in procenten van het beeld. */
  focus: [number, number]
  afstand: string
  plek: string
  vastgelegd: string
  uitleg: string
  zelfZien: string
  /** Woorden waarop artikelen in het archief matchen (titel of intro). */
  zoek: string[]
  /** Altijd een vervolg, ook als er geen artikel matcht. */
  verder: { href: string; label: string }
}

const LJ_KM = 9.4607e12
const km = (n: number) => n / LJ_KM

export const FOTOS: Hemelfoto[] = [
  {
    id: 'orionnevel', naam: 'Orionnevel', ook: ['M42', 'Orion Nebula'], soort: 'Nevel', lj: 1350,
    nasaId: 'PIA01322', variant: 'large', credit: 'NASA/JPL-Caltech/STScI · Spitzer en Hubble',
    focus: [36, 56],
    afstand: 'ongeveer 1.350 lichtjaar',
    plek: 'In een wintersterrenbeeld, onder drie sterren op een rij',
    vastgelegd: 'Twee ruimtetelescopen: Spitzer (infrarood) en Hubble (zichtbaar licht)',
    uitleg: 'Een enorme wolk gas en stof waarin op dit moment nieuwe sterren ontstaan. Het is het dichtstbijzijnde grote stervormingsgebied, en daarom een van de best bestudeerde plekken aan de hemel.',
    zelfZien: 'Van november tot maart staat Orion ’s avonds in het zuiden. Met het blote oog zie je onder de gordel een vaag vlekje, met een verrekijker al echte nevel, en met een kleine telescoop de vier sterretjes van het Trapezium in het hart.',
    zoek: ['orionnevel', 'm42', 'stervorming'],
    verder: { href: '/sterrenkijken/', label: 'Kan ik vannacht kijken?' },
  },
  {
    id: 'saturnus', naam: 'Saturnus', ook: ['Saturn'], soort: 'Planeet', lj: km(1.35e9),
    nasaId: 'PIA17172', variant: 'large', credit: 'NASA/JPL-Caltech/SSI · Cassini, 2013',
    focus: [18, 55],
    afstand: '1,2 tot 1,6 miljard km',
    plek: 'Een heldere, gelige ‘ster’ die niet fonkelt',
    vastgelegd: 'De ruimtesonde Cassini, vanuit de schaduw van de planeet',
    uitleg: 'Cassini fotografeerde Saturnus terwijl de planeet de zon afdekte. Daardoor lichten de ringen op in tegenlicht, en ergens tussen de ringen staat de aarde als een piepklein stipje.',
    zelfZien: 'Met elke telescoop vanaf ongeveer 30× vergroting zie je de ringen al. Het is voor veel mensen hét moment waarop ze verslingerd raken aan sterrenkijken.',
    zoek: ['saturnus', 'cassini', 'titan', 'enceladus'],
    verder: { href: '/sterrenkijken/eerste-telescoop/', label: 'Welke telescoop toont de ringen?' },
  },
  {
    id: 'andromeda', naam: 'Andromedastelsel', ook: ['M31', 'Andromedanevel', 'Andromeda Galaxy'], soort: 'Sterrenstelsel', lj: 2.5e6,
    nasaId: 'PIA04921', variant: 'large', credit: 'NASA/JPL-Caltech · GALEX, ultraviolet',
    focus: [50, 50],
    afstand: 'ongeveer 2,5 miljoen lichtjaar',
    plek: 'In een herfststerrenbeeld, naast het grote vierkant van Pegasus',
    vastgelegd: 'De ruimtetelescoop GALEX, in ultraviolet licht',
    uitleg: 'Ons buurstelsel, met meer dan duizend miljard sterren. In ultraviolet licht lichten vooral de jonge, hete sterren in de spiraalarmen op. Over een paar miljard jaar botst het misschien met onze Melkweg.',
    zelfZien: 'Het verste wat je met het blote oog kunt zien. Onder een donkere hemel zie je in de herfst een langgerekt vlekje; met een verrekijker wordt het een duidelijke ovale gloed.',
    zoek: ['andromeda', 'm31'],
    verder: { href: '/sterrenkijken/uitrusting/', label: 'Welke verrekijker past?' },
  },
  {
    id: 'maan', naam: 'De maan', ook: ['Maan', 'Moon', 'Volle maan'], soort: 'Maan', lj: km(384400),
    nasaId: 'GSFC_20171208_Archive_e000868', variant: 'large', credit: 'NASA/GSFC/Arizona State University · LRO',
    focus: [38, 34],
    afstand: '384.400 km',
    plek: 'Je kunt hem niet missen',
    vastgelegd: 'Een NASA-sonde die er sinds 2009 in een lage baan omheen draait',
    uitleg: 'Een mozaïek van duizenden opnamen van de maansonde LRO. De donkere vlakten zijn gestolde lava, de lichte delen oude hooglanden vol kraters.',
    zelfZien: 'Alles werkt, zelfs een gewone verrekijker. Kijk liever niet bij volle maan maar rond het eerste kwartier: langs de schaduwgrens geven de kraters lange schaduwen.',
    zoek: ['maan', 'artemis', 'lunar', 'krater'],
    verder: { href: '/sterrenkijken/', label: 'Bekijk de maankalender' },
  },
  {
    id: 'krabnevel', naam: 'Krabnevel', ook: ['M1', 'Crab Nebula'], soort: 'Restant van een ster', lj: 6500,
    nasaId: 'PIA03606', variant: 'large', credit: 'NASA/ESA/STScI · Hubble',
    focus: [50, 50],
    afstand: 'ongeveer 6.500 lichtjaar',
    plek: 'In de Stier, vlak bij de ‘hoornster’ Zeta Tauri',
    vastgelegd: 'De Hubble-ruimtetelescoop, in een mozaïek van 24 opnamen',
    uitleg: 'Wat over is van een ster die ontplofte. Chinese astronomen zagen die supernova in het jaar 1054 zelfs overdag. In het midden draait nog een neutronenster, dertig keer per seconde.',
    zelfZien: 'Een winterobject. Met een telescoop vanaf ongeveer 100 mm zie je een vaag, grijs vlekje. De draden uit deze foto blijven voor het oog onzichtbaar.',
    zoek: ['krabnevel', 'supernova', 'neutronenster', 'pulsar'],
    verder: { href: '/nieuws/onderwerp/kosmologie/', label: 'Meer over sterren die sterven' },
  },
  {
    id: 'iss', naam: 'Het ISS', ook: ['ISS', 'Internationaal ruimtestation', 'Ruimtestation'], soort: 'Ruimtevaartuig', lj: km(410),
    nasaId: 's132e013215', variant: 'large', credit: 'NASA · STS-132, mei 2010',
    focus: [50, 46],
    afstand: 'ongeveer 410 km boven de aarde',
    plek: 'Elke anderhalf uur rond de aarde',
    vastgelegd: 'Astronauten in de spaceshuttle Atlantis, vlak na het ontkoppelen',
    uitleg: 'Het Internationaal Ruimtestation, zo groot als een voetbalveld. Er wonen sinds 2000 onafgebroken mensen aan boord, die met 28.000 km per uur rond de aarde razen.',
    zelfZien: 'Met het blote oog: een heldere, rustig bewegende stip zonder knipperlicht, een paar minuten lang. Op NightGazer zie je wanneer hij vanavond overkomt.',
    zoek: ['iss', 'ruimtestation', 'astronaut'],
    verder: { href: '/sterrenkijken/', label: 'Wanneer komt het ISS over?' },
  },
  {
    id: 'ringnevel', naam: 'Ringnevel', ook: ['M57', 'Ring Nebula'], soort: 'Restant van een ster', lj: 2600,
    nasaId: 'PIA14443', variant: 'orig', credit: 'NASA/ESA/Hubble Heritage Team (STScI/AURA)',
    focus: [40, 30],
    afstand: 'ongeveer 2.600 lichtjaar',
    plek: 'In de Lier, tussen de sterren Sheliak en Sulafat',
    vastgelegd: 'De Hubble-ruimtetelescoop',
    uitleg: 'Een stervende ster die zijn buitenste lagen heeft afgestoten. We kijken bijna recht in een ton van gloeiend gas. Zo eindigt over vijf miljard jaar ook onze zon.',
    zelfZien: 'In de zomer en herfst hoog aan de hemel. Met een telescoop vanaf ongeveer 80 mm zie je een klein, grijs rookringetje. Een mooi eerste doel om te leren zoeken.',
    zoek: ['ringnevel', 'm57', 'planetaire nevel'],
    verder: { href: '/sterrenkijken/eerste-telescoop/', label: 'Je eerste telescoop kiezen' },
  },
  {
    id: 'noorderlicht', naam: 'Noorderlicht', ook: ['Poollicht', 'Aurora'], soort: 'Verschijnsel', lj: km(200),
    nasaId: 'iss072e159172', variant: 'large', credit: 'NASA · ISS Expeditie 72, oktober 2024',
    focus: [45, 58],
    afstand: '100 tot 300 km boven de aarde',
    plek: 'Rond de poolgebieden, soms tot boven Nederland',
    vastgelegd: 'Een astronaut aan boord van het ISS, eind oktober 2024',
    uitleg: 'Deeltjes van de zon botsen hoog in de atmosfeer op zuurstof en stikstof. Groen licht komt van zuurstof op zo’n 100 tot 250 km hoogte; het ISS vliegt er nog boven.',
    zelfZien: 'Na een flinke zonnestorm ook in Nederland: kijk laag naar het noorden, weg van stadslicht. Een telefooncamera ziet de kleuren vaak beter dan je ogen.',
    zoek: ['noorderlicht', 'poollicht', 'zonnestorm', 'aurora'],
    verder: { href: '/sterrenkijken/', label: 'Bekijk de noorderlichtverwachting' },
  },
  {
    id: 'draaikolkstelsel', naam: 'Draaikolkstelsel', ook: ['M51', 'Whirlpool Galaxy'], soort: 'Sterrenstelsel', lj: 2.3e7,
    nasaId: 'PIA10200', variant: 'large', credit: 'NASA/JPL-Caltech/ESA/CXC/STScI · vier ruimtetelescopen',
    focus: [52, 62],
    afstand: 'ongeveer 23 miljoen lichtjaar',
    plek: 'In de Jachthonden, onder de steel van de Grote Beer',
    vastgelegd: 'Vier ruimtetelescopen samen: Chandra, GALEX, Hubble en Spitzer',
    uitleg: 'Een spiraalstelsel dat we recht van boven zien, met bovenaan een kleiner stelsel dat ertegenaan schuurt. Die botsing zet gas in beweging en maakt de spiraalarmen zo scherp.',
    zelfZien: 'Vanuit Nederland gaat het nooit onder. Met een telescoop vanaf 150 mm onder een donkere hemel zie je twee vlekjes, en op een topnacht een vleugje spiraal.',
    zoek: ['draaikolk', 'm51', 'spiraalstelsel'],
    verder: { href: '/nieuws/onderwerp/kosmologie/', label: 'Meer over sterrenstelsels' },
  },
  {
    id: 'jupiter', naam: 'Jupiter', soort: 'Planeet', lj: km(7.8e8),
    nasaId: 'PIA21376', variant: 'orig', credit: 'NASA/JPL-Caltech/SwRI/MSSS · Juno',
    focus: [60, 45],
    afstand: '590 tot 970 miljoen km',
    plek: 'Na de maan en Venus het helderste aan de nachthemel',
    vastgelegd: 'De ruimtesonde Juno, een paar duizend km boven de wolken',
    uitleg: 'Jupiter als sikkel, iets wat je vanaf de aarde nooit ziet. De oranje vlek is de Grote Rode Vlek: een storm die groter is dan de aarde en al minstens 190 jaar raast.',
    zelfZien: 'Met een verrekijker zie je al vier maantjes op een rij. Met een kleine telescoop komen de wolkenbanden erbij, en op een rustige nacht de Grote Rode Vlek.',
    zoek: ['jupiter', 'juno', 'europa clipper', 'juice'],
    verder: { href: '/sterrenkijken/eerste-telescoop/', label: 'Wat zie je met welke telescoop?' },
  },
  {
    id: 'zuilen', naam: 'Zuilen van de Schepping', ook: ['Pillars of Creation', 'Adelaarsnevel', 'M16'], soort: 'Nevel', lj: 6500,
    nasaId: 'GSFC_20171208_Archive_e000842', variant: 'large', credit: 'NASA/ESA/Hubble Heritage Team · Hubble, 2014',
    focus: [44, 40],
    afstand: 'ongeveer 6.500 lichtjaar',
    plek: 'In een nevel in het sterrenbeeld Slang, ’s zomers laag in het zuiden',
    vastgelegd: 'De Hubble-ruimtetelescoop, in 2014 opnieuw en scherper gefotografeerd',
    uitleg: 'Zuilen van koud gas en stof, lichtjaren hoog, waarin nieuwe sterren ontstaan. Het licht van jonge, hete sterren eromheen blaast ze langzaam weg.',
    zelfZien: 'De Adelaarsnevel staat ’s zomers laag in het zuiden. Met een verrekijker zie je een sterrenhoopje met een vleugje nevel; de zuilen zelf komen alleen op lang belichte foto’s tevoorschijn.',
    zoek: ['zuilen', 'adelaarsnevel', 'pillars'],
    verder: { href: '/nieuws/onderwerp/james-webb/', label: 'Meer beroemde ruimtefoto’s' },
  },
  {
    id: 'zon', naam: 'De zon', ook: ['Zon', 'Sun'], soort: 'Ster', lj: km(1.496e8),
    nasaId: 'GSFC_20171208_Archive_e000790', variant: 'large', credit: 'NASA/SDO',
    focus: [50, 50],
    afstand: '150 miljoen km (8 lichtminuten)',
    plek: 'Dichterbij dan welke ster ook',
    vastgelegd: 'Het Solar Dynamics Observatory, in extreem ultraviolet licht',
    uitleg: 'Onze eigen ster, in licht dat je ogen niet zien. Je kijkt naar gas van ongeveer een miljoen graden; de donkere slierten zijn filamenten, wolken koeler gas die boven het oppervlak zweven.',
    zelfZien: 'Nooit zonder gecertificeerd zonnefilter voor de opening van je kijker. Met zo’n filter zie je zonnevlekken, en die veranderen van dag tot dag.',
    zoek: ['zon', 'zonnevlek', 'zonnestorm', 'zonnevlam'],
    verder: { href: '/sterrenkijken/uitrusting/', label: 'Veilig de zon bekijken' },
  },
  {
    id: 'paardenkopnevel', naam: 'Paardenkopnevel', ook: ['Horsehead Nebula', 'Barnard 33'], soort: 'Nevel', lj: 1500,
    nasaId: 'GSFC_20171208_Archive_e001518', variant: 'large', credit: 'NASA/ESA/Hubble Heritage Team · Hubble, infrarood',
    focus: [48, 26],
    afstand: 'ongeveer 1.500 lichtjaar',
    plek: 'In een wintersterrenbeeld, net onder de linker van drie sterren op een rij',
    vastgelegd: 'De Hubble-ruimtetelescoop, in infrarood licht',
    uitleg: 'Een donkere stofwolk in de vorm van een paardenhoofd. In infrarood kijkt Hubble door het stof heen, waardoor de ‘kop’ hier doorschijnend lijkt.',
    zelfZien: 'Een van de moeilijkste objecten voor het oog: je hebt een grote telescoop met een H-bèta-filter nodig. Op een foto met lange belichting is hij wel goed haalbaar.',
    zoek: ['paardenkop', 'horsehead', 'donkere nevel'],
    verder: { href: '/sterrenkijken/uitrusting/', label: 'Beginnen met astrofotografie' },
  },
  {
    id: 'mars', naam: 'Mars', soort: 'Planeet', lj: km(2.25e8),
    nasaId: 'PIA01253', variant: 'orig', credit: 'NASA/STScI · Hubble, 1997',
    focus: [50, 30],
    afstand: '55 tot 400 miljoen km',
    plek: 'Een oranje ‘ster’ die niet fonkelt',
    vastgelegd: 'De Hubble-ruimtetelescoop, vanuit een baan om de aarde',
    uitleg: 'Mars in de lente op het noordelijk halfrond. Bovenaan de witte poolkap van bevroren koolzuurgas en ijs, en de donkere vlekken zijn gebieden met kaal, donker gesteente.',
    zelfZien: 'Ongeveer elke 26 maanden staat Mars dicht bij de aarde. Dan toont een telescoop de poolkap en een paar donkere vlekken; de rest van de tijd is het een klein oranje schijfje.',
    zoek: ['mars', 'perseverance', 'curiosity', 'rover'],
    verder: { href: '/nieuws/onderwerp/mars/', label: 'Al het Mars-nieuws' },
  },
  {
    id: 'helixnevel', naam: 'Helixnevel', ook: ['Helix Nebula', 'NGC 7293', 'Oog van God'], soort: 'Restant van een ster', lj: 650,
    nasaId: 'PIA03678', variant: 'large', credit: 'NASA/JPL-Caltech/ESA · Hubble en Spitzer',
    focus: [50, 48],
    afstand: 'ongeveer 650 lichtjaar',
    plek: 'In de Waterman, ’s herfsts laag in het zuiden',
    vastgelegd: 'Hubble en Spitzer samen, in zichtbaar en infrarood licht',
    uitleg: 'Een van de dichtstbijzijnde stervende sterren. In het midden zit een witte dwerg, het hete restje van de ster, omringd door de gaslagen die hij heeft afgeworpen.',
    zelfZien: 'Groot maar zwak, en vanuit Nederland laag. Onder een echt donkere hemel zie je met een verrekijker of telescoop met weinig vergroting een bleke, ronde vlek.',
    zoek: ['helixnevel', 'witte dwerg', 'planetaire nevel'],
    verder: { href: '/nieuws/onderwerp/kosmologie/', label: 'Meer over sterren die sterven' },
  },
  {
    id: 'aarde', naam: 'De aarde', ook: ['Aarde', 'Earth', 'Blue Marble'], soort: 'Planeet', lj: 0,
    nasaId: 'GSFC_20171208_Archive_e001386', variant: 'large', credit: 'NASA/NOAA/GSFC · Suomi NPP, 2012',
    focus: [52, 46],
    afstand: 'je staat erop',
    plek: 'Onder je voeten',
    vastgelegd: 'De weersatelliet Suomi NPP, uit strook na strook samengesteld',
    uitleg: 'De ‘Blue Marble’ van 2012: Noord-Amerika onder een laag wolken. De satelliet vloog op zo’n 820 km hoogte; de beelden van een hele dag zijn tot één bol samengevoegd.',
    zelfZien: 'Dit uitzicht is voor astronauten. Wel kun je vanaf hier zien hoe de aarde de maan verlicht: bij een dunne maansikkel gloeit de rest van de maan zwak op. Dat heet aardschijn.',
    zoek: ['aarde', 'satelliet', 'klimaat'],
    verder: { href: '/missies/', label: 'Bekijk de missies' },
  },
  {
    id: 'carinanevel', naam: 'Carinanevel', ook: ['Carina Nebula', 'Cosmic Cliffs', 'NGC 3324'], soort: 'Nevel', lj: 7600,
    nasaId: 'carina_nebula', variant: 'large', credit: 'NASA/ESA/CSA/STScI · James Webb, 2022',
    focus: [40, 64],
    afstand: 'ongeveer 7.600 lichtjaar',
    plek: 'Aan de zuidelijke hemel, in het sterrenbeeld Kiel',
    vastgelegd: 'De James Webb-ruimtetelescoop, in een van zijn eerste beelden',
    uitleg: 'De ‘kosmische kliffen’: de rand van een gasholte die hete jonge sterren hebben uitgeblazen. Webb ziet in infrarood honderden nieuwe sterren die in zichtbaar licht verstopt zitten.',
    zelfZien: 'Vanuit Nederland komt deze nevel nooit boven de horizon. Op reis naar het zuidelijk halfrond is hij met het blote oog te zien als heldere vlek in de Melkweg.',
    zoek: ['webb', 'jwst', 'carina'],
    verder: { href: '/nieuws/onderwerp/james-webb/', label: 'Al het Webb-nieuws' },
  },
  {
    id: 'pluto', naam: 'Pluto', soort: 'Dwergplaneet', lj: km(5.2e9),
    nasaId: 'PIA19952', variant: 'large', credit: 'NASA/JHUAPL/SwRI · New Horizons, 2015',
    focus: [55, 40],
    afstand: 'ongeveer 5 miljard km',
    plek: 'Ver voorbij Neptunus, in de Kuipergordel',
    vastgelegd: 'De ruimtesonde New Horizons, tijdens de scheervlucht in juli 2015',
    uitleg: 'De linkerhelft van het lichte ‘hart’ is een vlakte van bevroren stikstof, ruim 1.000 km breed. De kleuren zijn versterkt om de verschillende soorten ijs te laten zien.',
    zelfZien: 'Te zwak voor bijna elke amateurkijker: helderheid 14 of zwakker. Met een grote telescoop, een goede kaart en geduld zie je een sterretje dat over een paar nachten verschuift.',
    zoek: ['pluto', 'new horizons', 'kuipergordel'],
    verder: { href: '/missies/', label: 'Bekijk de missies' },
  },
  {
    id: 'tarantulanevel', naam: 'Tarantulanevel', ook: ['Tarantula Nebula', '30 Doradus'], soort: 'Nevel', lj: 160000,
    nasaId: 'GSFC_20171208_Archive_e002020', variant: 'large', credit: 'ESO · 2,2 m-telescoop op La Silla',
    focus: [52, 46],
    afstand: 'ongeveer 160.000 lichtjaar',
    plek: 'In de Grote Magelhaense Wolk, aan de zuidelijke hemel',
    vastgelegd: 'Een telescoop van 2,2 meter op de berg La Silla in Chili',
    uitleg: 'Het actiefste stervormingsgebied in onze omgeving, in een klein buurstelsel van de Melkweg. Stond hij zo dichtbij als de Orionnevel, dan wierp hij ’s nachts schaduwen.',
    zelfZien: 'Niet te zien vanuit Nederland. Op het zuidelijk halfrond zie je de Grote Magelhaense Wolk met het blote oog als een losgeraakt stukje Melkweg.',
    zoek: ['tarantula', 'magelhaense'],
    verder: { href: '/nieuws/onderwerp/kosmologie/', label: 'Meer over sterrenstelsels' },
  },
  {
    id: 'neptunus', naam: 'Neptunus', ook: ['Neptune'], soort: 'Planeet', lj: km(4.5e9),
    nasaId: 'PIA02210', variant: 'orig', credit: 'NASA/JPL · Voyager 2, 1989',
    focus: [62, 62],
    afstand: '4,3 tot 4,7 miljard km',
    plek: 'De buitenste planeet, in deze jaren in de Vissen',
    vastgelegd: 'De ruimtesonde Voyager 2, de enige die er ooit langs vloog',
    uitleg: 'De blauwe kleur komt van methaan. Op Neptunus waaien de hardste winden van het zonnestelsel, tot 2.000 km per uur, terwijl hij maar een duizendste van ons zonlicht krijgt.',
    zelfZien: 'Te zwak voor het blote oog. Met een verrekijker en een zoekkaart vind je een sterretje; een telescoop met hoge vergroting toont een klein blauwig schijfje.',
    zoek: ['neptunus', 'voyager'],
    verder: { href: '/sterrenkijken/', label: 'Bekijk de hemelagenda' },
  },
  {
    id: 'sombrerostelsel', naam: 'Sombrerostelsel', ook: ['M104', 'Sombrero Galaxy'], soort: 'Sterrenstelsel', lj: 3.0e7,
    nasaId: 'PIA15226', variant: 'orig', credit: 'NASA/ESA/STScI · Hubble',
    focus: [50, 50],
    afstand: 'ongeveer 30 miljoen lichtjaar',
    plek: 'In de Maagd, in het voorjaar laag in het zuiden',
    vastgelegd: 'De Hubble-ruimtetelescoop, in een mozaïek van zes opnamen',
    uitleg: 'We kijken bijna precies op de rand van dit stelsel. De donkere band is een ring van stof, en de heldere bult in het midden bevat ontzettend veel oude sterren en een zwaar zwart gat.',
    zelfZien: 'Vanuit Nederland staat hij laag. Met een telescoop vanaf 150 mm zie je in het voorjaar een ovaal vlekje, en op een goede nacht de donkere stofband erdoorheen.',
    zoek: ['sombrero', 'm104', 'zwart gat'],
    verder: { href: '/nieuws/onderwerp/kosmologie/', label: 'Meer over sterrenstelsels' },
  },
  {
    id: 'zonsverduistering', naam: 'Totale zonsverduistering', ook: ['Zonsverduistering', 'Eclips', 'Solar eclipse'], soort: 'Verschijnsel', lj: km(1.496e8),
    nasaId: 'NHQ201708210101', variant: 'large', credit: 'NASA/Aubrey Gemignani · 21 augustus 2017',
    focus: [58, 68],
    afstand: 'de zon op 150 miljoen km, de maan ervoor op 384.400 km',
    plek: 'Overdag, op een smalle strook van de aarde',
    vastgelegd: 'Een NASA-fotograaf in Madras, Oregon (VS), in 2017',
    uitleg: 'De maan schuift precies voor de zon. Vlak voordat de zon helemaal verdwijnt, schijnt er nog licht door de dalen langs de maanrand: de ‘parels van Baily’. Daaromheen de corona, de buitenste laag van de zon.',
    zelfZien: 'De volgende totale verduistering dichtbij is op 2 augustus 2027, in Zuid-Spanje. Kijk alleen tijdens de totale fase zonder filter, daarvoor en daarna nooit.',
    zoek: ['zonsverduistering', 'eclips', 'verduistering'],
    verder: { href: '/sterrenkijken/uitrusting/', label: 'Veilig de zon bekijken' },
  },
  {
    id: 'uranus', naam: 'Uranus', ook: ['Uranus'], soort: 'Planeet', lj: km(2.9e9),
    nasaId: 'PIA18182', variant: 'orig', credit: 'NASA/JPL-Caltech · Voyager 2, 1986',
    focus: [80, 80],
    afstand: '2,6 tot 3,2 miljard km',
    plek: 'In deze jaren in de Stier, niet ver van het Zevengesternte',
    vastgelegd: 'De ruimtesonde Voyager 2, in januari 1986',
    uitleg: 'Een ijsreus die op zijn kant ligt: de as staat bijna plat, waardoor elke pool 42 jaar zon en daarna 42 jaar nacht heeft. In zichtbaar licht is hij vrijwel kaal en egaal blauwgroen.',
    zelfZien: 'Net te zien met het blote oog onder een heel donkere hemel. Met een verrekijker en een zoekkaart is hij makkelijk; een telescoop toont een klein groenig schijfje.',
    zoek: ['uranus', 'ijsreus'],
    verder: { href: '/sterrenkijken/', label: 'Bekijk de hemelagenda' },
  },
  {
    id: 'bellennevel', naam: 'Bellennevel', ook: ['Bubble Nebula', 'NGC 7635'], soort: 'Nevel', lj: 7100,
    nasaId: 'GSFC_20171208_Archive_e000383', variant: 'large', credit: 'NASA/ESA/Hubble Heritage Team · Hubble, 2016',
    focus: [48, 52],
    afstand: 'ongeveer 7.100 lichtjaar',
    plek: 'In Cassiopeia, de W aan de noordelijke hemel',
    vastgelegd: 'De Hubble-ruimtetelescoop, voor zijn 26e verjaardag',
    uitleg: 'Een zware, hete ster blaast met zijn sterrenwind een bel van gas op, zeven lichtjaar breed. De ster zelf staat niet in het midden van de bel, maar een eind opzij.',
    zelfZien: 'Vanuit Nederland gaat Cassiopeia nooit onder, maar de bel is zwak. Met een telescoop vanaf 200 mm en een nevelfilter zie je een bleke boog.',
    zoek: ['bellennevel', 'sterrenwind', 'hubble'],
    verder: { href: '/sterrenkijken/uitrusting/', label: 'Welke filters helpen?' },
  },
  {
    id: 'neowise', naam: 'Komeet NEOWISE', ook: ['NEOWISE', 'C/2020 F3', 'Komeet'], soort: 'Komeet', lj: km(1.03e8),
    nasaId: 'NHQ202007180001', variant: 'large', credit: 'NASA/Bill Ingalls · juli 2020',
    focus: [44, 77],
    afstand: 'op zijn dichtst 103 miljoen km',
    plek: 'In juli 2020 laag in het noordwesten, na zonsondergang',
    vastgelegd: 'Een NASA-fotograaf, met het ISS als streep door het beeld',
    uitleg: 'De helderste komeet op het noordelijk halfrond sinds Hale-Bopp in 1997. De streep bovenin is het ISS, dat tijdens de lange belichting overvloog.',
    zelfZien: 'In de zomer van 2020 zag je hem ook boven Nederland met het blote oog. De meeste kometen zijn zwakker: houd het nieuws in de gaten en neem een verrekijker mee.',
    zoek: ['komeet', 'kometen'],
    verder: { href: '/nieuws/onderwerp/kometen/', label: 'Al het kometennieuws' },
  },
]

/** Wel te raden, nooit de foto van de dag (nog niet). Zonder lokkers zou de
    keuzelijst precies het antwoordenrijtje zijn. */
export const LOKKERS: Kandidaat[] = [
  { id: 'venus', naam: 'Venus', soort: 'Planeet', lj: km(1.7e8) },
  { id: 'mercurius', naam: 'Mercurius', ook: ['Mercury'], soort: 'Planeet', lj: km(1.55e8) },
  { id: 'plejaden', naam: 'Zevengesternte', ook: ['Plejaden', 'M45', 'Pleiades'], soort: 'Sterrenhoop', lj: 444 },
  { id: 'm13', naam: 'Herculeshoop', ook: ['M13', 'Bolvormige sterrenhoop'], soort: 'Sterrenhoop', lj: 22200 },
  { id: 'kattenoog', naam: 'Kattenoognevel', ook: ['NGC 6543', "Cat's Eye"], soort: 'Restant van een ster', lj: 3300 },
  { id: 'halternevel', naam: 'Halternevel', ook: ['M27', 'Dumbbell'], soort: 'Restant van een ster', lj: 1360 },
  { id: 'lagunenevel', naam: 'Lagunenevel', ook: ['M8', 'Lagoon'], soort: 'Nevel', lj: 4100 },
  { id: 'driehoek', naam: 'Driehoeksnevel', ook: ['M33', 'Triangulum'], soort: 'Sterrenstelsel', lj: 2.7e6 },
  { id: 'sigaar', naam: 'Sigaarstelsel', ook: ['M82', 'Cigar Galaxy'], soort: 'Sterrenstelsel', lj: 1.2e7 },
  { id: 'melkweg', naam: 'Centrum van de Melkweg', ook: ['Melkweg', 'Milky Way', 'Sagittarius A*'], soort: 'Sterrenstelsel', lj: 26000 },
  { id: 'titan', naam: 'Titan', ook: ['Maan van Saturnus'], soort: 'Maan', lj: km(1.35e9) },
  { id: 'europa', naam: 'Europa', ook: ['Maan van Jupiter'], soort: 'Maan', lj: km(7.8e8) },
  { id: 'hubble', naam: 'Hubble-ruimtetelescoop', ook: ['Hubble', 'HST'], soort: 'Ruimtevaartuig', lj: km(530) },
  { id: 'maansverduistering', naam: 'Maansverduistering', ook: ['Bloedmaan', 'Lunar eclipse'], soort: 'Verschijnsel', lj: km(384400) },
]

export const ALLE: Kandidaat[] = [...FOTOS, ...LOKKERS].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))

export const POGINGEN = 6
/** Vergroting per aantal foute gokken: 0 fout = verst ingezoomd. */
export const ZOOM = [7, 4.6, 3, 2.1, 1.5, 1.15, 1]

/** Puzzel 1 viel op deze dag (Nederlandse kalenderdag). */
export const START = '2026-11-10'

/** YYYY-MM-DD in Nederlandse tijd, onafhankelijk van de klok van het toestel
    of de tijdzone van de bezoeker. */
export function nlDag(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

const dagNr = (iso: string) => Math.round(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000)

/** 1 op de startdag; nooit kleiner dan 1. */
export function puzzelNr(iso = nlDag()): number {
  return Math.max(1, dagNr(iso) - dagNr(START) + 1)
}

/** De datum die bij een puzzelnummer hoort. */
export function puzzelDatum(nr: number): string {
  const ms = (dagNr(START) + nr - 1) * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}

/* Eerste ronde in de volgorde van FOTOS (handgekozen: afwisselend en Orion
   in november bovenaan). Daarna elke ronde een vaste schudding, zo dat een
   ronde nooit begint met de foto waarmee de vorige eindigde. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 }
}
function ronde(r: number): Hemelfoto[] {
  if (r === 0) return FOTOS
  const a = [...FOTOS]
  const rand = rng(r * 7919 + 17)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  const vorige = ronde(r - 1)
  if (a[0].id === vorige[vorige.length - 1].id) [a[0], a[1]] = [a[1], a[0]]
  return a
}

export function fotoVan(nr: number): Hemelfoto {
  const i = Math.max(0, nr - 1)
  return ronde(Math.floor(i / FOTOS.length))[i % FOTOS.length]
}

export type Afstandsrichting = 'verder' | 'dichterbij' | 'even ver'

/** Waar ligt het antwoord ten opzichte van de gok? 'even ver' binnen 25%. */
export function richting(gok: Kandidaat, antwoord: Kandidaat): Afstandsrichting {
  const a = antwoord.lj, g = gok.lj
  if (a === g) return 'even ver'
  if (a > 0 && g > 0 && Math.max(a, g) / Math.min(a, g) <= 1.25) return 'even ver'
  return a > g ? 'verder' : 'dichterbij'
}

export function zoomVoor(fout: number): number {
  return ZOOM[Math.min(Math.max(fout, 0), ZOOM.length - 1)]
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9*/ ]/g, ' ').replace(/\s+/g, ' ').trim()

/** Kandidaten die bij de zoektekst passen, beste eerst. */
export function zoekKandidaten(tekst: string, uitsluiten: string[] = []): Kandidaat[] {
  const q = norm(tekst)
  const pool = ALLE.filter(k => !uitsluiten.includes(k.id))
  if (!q) return pool
  const score = (k: Kandidaat) => {
    const namen = [k.naam, ...(k.ook ?? [])].map(norm)
    if (namen.some(n => n === q)) return 0
    if (namen.some(n => n.startsWith(q) || n.split(' ').some(w => w.startsWith(q)))) return 1
    if (namen.some(n => n.includes(q))) return 2
    return 9
  }
  return pool.map(k => [k, score(k)] as const).filter(([, s]) => s < 9).sort((a, b) => a[1] - b[1]).map(([k]) => k)
}

export type Stand = { gokken: string[]; klaar: boolean; goed: boolean }

export function verwerkGok(stand: Stand, gokId: string, antwoordId: string): Stand {
  if (stand.klaar || stand.gokken.includes(gokId)) return stand
  const gokken = [...stand.gokken, gokId]
  const goed = gokId === antwoordId
  return { gokken, goed, klaar: goed || gokken.length >= POGINGEN }
}

/** Deelregel zonder het antwoord te verklappen. Emoji alleen in de tekst
    die mensen zelf delen, nooit in de interface. */
export function deelTekst(nr: number, stand: Stand, antwoord: Kandidaat, url: string): string {
  const vakjes = stand.gokken.map(g => {
    if (g === antwoord.id) return '🟩'
    const k = ALLE.find(x => x.id === g)
    return k && k.soort === antwoord.soort ? '🟨' : '⬛'
  }).join('')
  const score = stand.goed ? `${stand.gokken.length}/${POGINGEN}` : `X/${POGINGEN}`
  return `NightGazer Hemelfoto #${nr} · ${score}\n${vakjes}\n${url}`
}
