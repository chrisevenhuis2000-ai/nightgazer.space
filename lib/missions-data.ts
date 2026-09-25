export type MissionStatus = 'actief' | 'gepland' | 'voltooid'

export interface TimelineEntry {
  date:  string
  event: string
}

export interface MissionDetail {
  id:          string
  name:        string
  agency:      string
  agencyColor: string
  status:      MissionStatus
  launched:    string
  /**
   * Hoe hard de lanceerdatum is, rechtstreeks uit Launch Library 2
   * ('Minute', 'Hour', 'Day', 'Month', 'Quarter', 'Year', ...). Ontbreekt op
   * oudere records; dan valt mission-schedule terug op een heuristiek.
   */
  launchPrecision?: string
  objective:   string
  body:        string
  highlight:   string
  icon:        string
  bgFrom:      string
  bgTo:        string
  // Detail-only fields
  description:  string
  vehicle:      string
  launchSite:   string
  duration:     string
  distanceKm:   string
  missionUrl:   string
  timeline:     TimelineEntry[]
  facts:        { label: string; value: string }[]
  relatedTags:  string[]
}

// MISSIONS en MISSIONS_LAST_UPDATED worden gegenereerd door scripts/generate-missions-module.js
// vanuit content/missions.json — zie dat bestand voor handmatige aanpassingen.
import { MISSIONS, MISSIONS_LAST_UPDATED } from './missions-generated'
export { MISSIONS, MISSIONS_LAST_UPDATED }

export function getMissionBySlug(slug: string): MissionDetail | undefined {
  return MISSIONS.find(m => m.id === slug)
}

// Onderstaande hardcoded array is vervangen door de JSON-driven import hierboven.
// Bewaard als referentie — wordt verwijderd bij eerstvolgende cleanup.
const _MISSIONS_LEGACY: MissionDetail[] = [
  {
    id: 'starship',
    name: 'SpaceX Starship',
    agency: 'SpaceX',
    agencyColor: '#3dcfdf',
    status: 'actief',
    launched: 'IFT-7 · Mrt 2026',
    objective: 'Volledig herbruikbare super-heavy raket testen voor Maan & Mars-missies.',
    body: 'Aardebaan',
    highlight: 'Mechazilla-arm ving booster op bij IFT-7',
    icon: '🚀',
    bgFrom: '#040e14',
    bgTo: '#0a2030',
    description: `Starship is het volledig herbruikbare twee-traps lanceersysteem van SpaceX, ontworpen voor transport van mensen en vracht naar de Maan, Mars en verder. Met een hoogte van 121 meter is het de krachtigste raket die ooit is gebouwd. Het systeem bestaat uit de Super Heavy-booster met 33 Raptor-motoren en het Starship-bovenste gedeelte met 6 Raptor-motoren. Bij IFT-7 (maart 2026) werd de Super Heavy-booster voor de tweede keer succesvol gevangen door de zogenoemde Mechazilla-armen aan de lanceerinstallatie in Boca Chica, Texas. Starship is ook geselecteerd door NASA als Human Landing System (HLS) voor de Artemis-maanlandingen.`,
    vehicle:    'Super Heavy + Starship (volledig stapel)',
    launchSite: 'Starbase, Boca Chica, Texas, VS',
    duration:   'Varieert per missie',
    distanceKm: 'Lage Aardeomloopbaan (~400 km)',
    missionUrl: 'https://www.spacex.com/vehicles/starship/',
    timeline: [
      { date: 'apr 2023',  event: 'IFT-1: eerste geïntegreerde vluchttest, explosie na scheiding' },
      { date: 'nov 2023',  event: 'IFT-2: succesvolle scheiding booster/schip, beide verloren boven zee' },
      { date: 'mrt 2024',  event: 'IFT-3: beide voertuigen bereiken ruimte; gecontroleerde herentry' },
      { date: 'jun 2024',  event: 'IFT-4: Starship-schip landt zacht in Indische Oceaan' },
      { date: 'okt 2024',  event: 'IFT-5: booster gevangen door Mechazilla-armen (eerste keer)' },
      { date: 'jan 2025',  event: 'IFT-6: booster wederom gevangen; schip gecontroleerd neergekomen' },
      { date: 'mrt 2026',  event: 'IFT-7: booster opnieuw gevangen; schip herentry geslaagd' },
    ],
    facts: [
      { label: 'Hoogte (volledig)',   value: '121 meter' },
      { label: 'Super Heavy motoren', value: '33 × Raptor V2' },
      { label: 'Starship motoren',    value: '6 × Raptor (3 zeeniveau + 3 vacuüm)' },
      { label: 'Stuwkracht (liftoff)',value: '~74,4 MN (>Apollo Saturn V × 2)' },
      { label: 'Max. lading LEO',     value: '>100 ton (herbruikbaar)' },
      { label: 'Bouwmateriaal',       value: 'Roestvrij staal (304L)' },
    ],
    relatedTags: ['starship', 'spacex', 'superheavy', 'falcon', 'musk', 'boca chica', 'mechazilla'],
  },

  {
    id: 'artemis',
    name: 'NASA Artemis II',
    agency: 'NASA',
    agencyColor: '#378ADD',
    status: 'actief',
    launched: '1 apr 2026',
    objective: 'Eerste bemande vlucht rond de Maan sinds Apollo 17 (1972).',
    body: 'Maan',
    highlight: 'Vier astronauten vliegen de Orion capsule',
    icon: '🌕',
    bgFrom: '#080812',
    bgTo: '#141430',
    description: `Artemis II is de eerste bemande vlucht van het Artemis-programma en de eerste bemande reis naar de Maan in meer dan vijftig jaar. Vier astronauten — drie van NASA en één van het Canadese ruimtevaartagentschap CSA — zullen in de Orion-capsule op het SLS Block 1-raketsysteem een vrije-retour-baan om de Maan beschrijven zonder te landen. De missie duurt ongeveer tien dagen en valideert alle systemen voor de latere Artemis III-maanlanding. De vier bemanningsleden zijn Reid Wiseman (commandant), Victor Glover, Christina Koch en de Canadees Jeremy Hansen.`,
    vehicle:    'SLS Block 1 + Orion MPCV',
    launchSite: 'LC-39B, Kennedy Space Center, Florida, VS',
    duration:   '~10 dagen',
    distanceKm: '~400.000 km (Maan)',
    missionUrl: 'https://www.nasa.gov/mission/artemis-ii/',
    timeline: [
      { date: 'nov 2022',   event: 'Artemis I: onbemande testmissie van SLS + Orion succesvol' },
      { date: 'apr 2023',   event: 'Bemanning Artemis II officieel bekendgemaakt' },
      { date: '2024–2025',  event: 'Vluchtsimulaties en trainingscampagnes voor bemanning' },
      { date: '1 apr 2026',  event: 'Lancering Artemis II (vrije-retour Maanbaan)' },
      { date: 'TBD 2027+',  event: 'Artemis III: eerste maanlanding met Starship HLS' },
    ],
    facts: [
      { label: 'Bemanning',            value: 'Reid Wiseman, Victor Glover, Christina Koch, Jeremy Hansen' },
      { label: 'Raket',                value: 'Space Launch System (SLS) Block 1' },
      { label: 'Capsule',              value: 'Orion MPCV (Multi-Purpose Crew Vehicle)' },
      { label: 'Traject',              value: 'Vrije-retour Maanbaan (geen landing)' },
      { label: 'Max. afstand tot Aarde', value: '~8.900 km achter Maan (dichts bij totale terugweg)' },
      { label: 'Eerste keer CSA bemand', value: 'Ja — Jeremy Hansen is eerste Canadees bij de Maan' },
    ],
    relatedTags: ['artemis', 'nasa', 'maan', 'orion', 'sls', 'maanlanding', 'moon'],
  },

  {
    id: 'perseverance',
    name: 'Mars 2020 Perseverance',
    agency: 'NASA',
    agencyColor: '#378ADD',
    status: 'actief',
    launched: '30 jul 2020',
    objective: 'Zoeken naar tekenen van vroeger microbieel leven in Jezero-krater.',
    body: 'Mars',
    highlight: 'Heeft >23 rotsmonsters verzameld voor toekomstige terugreis',
    icon: '🤖',
    bgFrom: '#140804',
    bgTo: '#281408',
    description: `Perseverance is de meest geavanceerde rover die ooit op Mars is geland. Hij landde op 18 februari 2021 in de Jezero-krater, waarvan wetenschappers geloven dat het ooit een meer was gevoed door een rivierdelta — een ideale omgeving voor het bewaren van fossiele biosignaturen. Aan boord bevindt zich ook de Ingenuity-helikopter, die als technologiedemonstrator meer dan 70 aangedreven vluchten maakte in de dunne Marsatmosfeer. Perseverance verzamelt zorgvuldig geselecteerde rotsmonsters die in buisjes worden opgeslagen op het Marsoppervlak voor een toekomstige Mars Sample Return-missie.`,
    vehicle:    'Atlas V 541',
    launchSite: 'SLC-41, Cape Canaveral, Florida, VS',
    duration:   'Onbepaald (nominaal: 1 Mars-jaar ≈ 687 Aarde-dagen)',
    distanceKm: '~225.000.000 km (gemiddeld Aarde–Mars)',
    missionUrl: 'https://mars.nasa.gov/mars2020/',
    timeline: [
      { date: '30 jul 2020',  event: 'Lancering met Atlas V 541' },
      { date: '18 feb 2021',  event: 'Landing in Jezero-krater via Sky Crane' },
      { date: '19 apr 2021',  event: 'Ingenuity maakt eerste aangedreven vlucht op Mars' },
      { date: 'sep 2021',     event: 'Eerste rotsmonster succesvol geboord en opgeslagen' },
      { date: 'jan 2022',     event: 'MOXIE produceert zuurstof uit Marsatmosfeer' },
      { date: '2023–2026',    event: '>23 monsters verzameld; depots aangelegd voor MSR' },
    ],
    facts: [
      { label: 'Massa',             value: '1.025 kg' },
      { label: 'Afmetingen',        value: '3,0 × 2,7 × 2,2 meter' },
      { label: 'Energiebron',       value: 'Multi-Mission RTG (MMRTG)' },
      { label: 'Instrumenten',      value: '7 wetenschappelijke instrumenten + Ingenuity' },
      { label: 'Geboorde monsters', value: '>23 (stand mrt 2026)' },
      { label: 'Rijafstand',        value: '>20 km (stand mrt 2026)' },
    ],
    relatedTags: ['perseverance', 'mars', 'nasa', 'jezero', 'rover', 'ingenuity', 'mars sample return'],
  },

  {
    id: 'jwst',
    name: 'James Webb Ruimtetelescoop',
    agency: 'NASA / ESA / CSA',
    agencyColor: '#c080ff',
    status: 'actief',
    launched: '25 dec 2021',
    objective: 'Infrarood telescoop in L2-punt — het vroegste heelal en exoplaneet-atmosferen.',
    body: 'L2-punt',
    highlight: 'Detecteerde mogelijke biosignaturen op K2-18b',
    icon: '🔭',
    bgFrom: '#08041a',
    bgTo: '#120828',
    description: `De James Webb Space Telescope is de wetenschappelijk krachtigste ruimtetelescoop ooit gebouwd, een samenwerking van NASA, ESA en CSA. Met een primaire spiegel van 6,5 meter — opgebouwd uit 18 gouden berylliumsegmenten — en instrumenten die werken in het nabij- en midden-infrarood, kan Webb objecten zien die voor Hubble onzichtbaar zijn. Het opereert op het Zon–Aarde L2-punt, 1,5 miljoen kilometer van de Aarde, waar een vijflaags zonnescherm ter grootte van een tennisveld het teleskoop koel houdt op –233°C. In 2023 detecteerde Webb dimethylsulfide (DMS) op exoplaneet K2-18b — een mogelijk biosignaal.`,
    vehicle:    'Ariane 5 ECA',
    launchSite: 'ELA-3, Kourou, Frans-Guiana',
    duration:   'Nominaal 10 jaar (brandstof voor 20+ jaar)',
    distanceKm: '1.500.000 km (L2-punt)',
    missionUrl: 'https://webb.nasa.gov/',
    timeline: [
      { date: '25 dec 2021',  event: 'Lancering met Ariane 5 vanuit Kourou' },
      { date: 'jan 2022',     event: 'Ontvouwing spiegel en zonnescherm succesvol afgerond' },
      { date: '24 jan 2022',  event: 'Injectie in L2-omloopbaan' },
      { date: 'jul 2022',     event: 'Eerste wetenschappelijke beelden vrijgegeven' },
      { date: 'sep 2022',     event: 'Directe beeldvorming van exoplaneet HIP 65426 b' },
      { date: 'sep 2023',     event: 'DMS gedetecteerd op K2-18b — mogelijk biosignaal' },
      { date: '2025–2026',    event: 'Continue observaties vroeg heelal, exoplaneet-atmosferen' },
    ],
    facts: [
      { label: 'Spiegel diameter',   value: '6,5 meter (18 segmenten)' },
      { label: 'Spiegelmateriaal',   value: 'Beryllium, verguld met goud' },
      { label: 'Golflengtebereik',   value: '0,6–28 micrometer (infrarood)' },
      { label: 'Werktemperatuur',    value: '–233°C (40 Kelvin)' },
      { label: 'Zonnescherm',        value: '5 lagen Kapton, zo groot als een tennisveld' },
      { label: 'Kostprijs',          value: '~$10 miljard' },
    ],
    relatedTags: ['webb', 'jwst', 'james webb', 'nasa', 'esa', 'telescoop', 'infrarood', 'exoplaneet', 'K2-18b'],
  },

  {
    id: 'smile',
    name: 'ESA SMILE',
    agency: 'ESA / CAS',
    agencyColor: '#ffa040',
    status: 'gepland',
    launched: '9 apr 2026',
    objective: 'Solar wind–Magnetosphere–Ionosphere Link Explorer: sondeert aardse magneetsfeer.',
    body: 'Aardebaan (elliptisch)',
    highlight: 'Eerste satelliet die auroragebieden simultaan in beeld brengt',
    icon: '🛰️',
    bgFrom: '#0e0a04',
    bgTo: '#1e1408',
    description: `SMILE (Solar wind Magnetosphere Ionosphere Link Explorer) is een gezamenlijke missie van de Europese Ruimtevaartorganisatie (ESA) en de Chinese Academie van Wetenschappen (CAS). De satelliet onderzoekt hoe de zonnewind wisselwerkt met de magneetsfeer en ionosfeer van de Aarde — processen die verantwoordelijk zijn voor de aurora borealis en kunnen leiden tot verstoring van satellieten en stroomnetten. SMILE is de eerste missie die gelijktijdig röntgenbeelden van de magnetopauze en UV-beelden van de auroravlekken kan maken, van hoog boven de pool.`,
    vehicle:    'Vega-C',
    launchSite: 'SLC-2, Kourou, Frans-Guiana',
    duration:   '3 jaar (nominaal)',
    distanceKm: '~121.000 km (apogeum elliptische baan)',
    missionUrl: 'https://www.esa.int/Science_Exploration/Space_Science/SMILE',
    timeline: [
      { date: '2015',        event: 'SMILE geselecteerd als ESA/CAS gezamenlijke missie' },
      { date: '2019–2024',   event: 'Ontwikkeling en bouw van instrumenten in Europa en China' },
      { date: '9 apr 2026',  event: 'Geplande lancering met Vega-C' },
      { date: 'mei 2026',    event: 'Injectie in driedaagse elliptische poolomloopbaan' },
      { date: '2026–2029',   event: 'Wetenschappelijke observaties magneetsfeer en aurora' },
    ],
    facts: [
      { label: 'Massa',                value: '~2.000 kg' },
      { label: 'Instrumenten',         value: 'SXI (röntgen), UVI (UV), LIA (lichtbeeldvorming), MAG (magnetometer)' },
      { label: 'Omlooptijd',           value: '~3 dagen (elliptisch)' },
      { label: 'Hoogste punt (apogeum)', value: '~121.000 km' },
      { label: 'Laagste punt (perigeum)', value: '~5.000 km' },
      { label: 'Samenwerking',         value: 'ESA + Chinese Academie van Wetenschappen (CAS)' },
    ],
    relatedTags: ['smile', 'esa', 'cas', 'magneetsfeer', 'aurora', 'zonnewind', 'ionosfeer'],
  },

  {
    id: 'juice',
    name: 'ESA JUICE',
    agency: 'ESA',
    agencyColor: '#ffa040',
    status: 'actief',
    launched: '14 apr 2023',
    objective: 'Jupiter Icy Moons Explorer — onderzoekt Europa, Ganymede en Callisto op bewoonbaarheid.',
    body: 'Jupiter-stelsel',
    highlight: 'Arriveert in 2031 bij Jupiter na Venus+Aarde-zwaartekrachtassist',
    icon: '🪐',
    bgFrom: '#0c0a04',
    bgTo: '#1a160a',
    description: `De Jupiter Icy Moons Explorer (JUICE) is de grootste interplanetaire missie die ESA ooit heeft gelanceerd. Na een reeks zwaartekrachtassists — langs Aarde/Maan (aug 2024), Venus (okt 2024) en nogmaals Aarde (jan 2026) — arriveert JUICE in juli 2031 bij Jupiter. Daar bestudeer de sonde drie ijsmanen: Ganymede, Callisto en Europa. Ganymede, de grootste maan van ons zonnestelsel, is bijzonder interessant omdat het de enige maan is met een eigen magnetisch veld en mogelijk een vloeibare oceaan diep onder zijn ijsoppervlak. In 2034 injecteert JUICE in een baan om Ganymede — de eerste sonde ooit in een baan om een maan van een andere planeet dan de Aarde.`,
    vehicle:    'Ariane 5 ECA+',
    launchSite: 'ELA-3, Kourou, Frans-Guiana',
    duration:   '~12 jaar (tot einde missie ~2035)',
    distanceKm: '~628.000.000 km (Jupiter gemiddeld)',
    missionUrl: 'https://www.esa.int/Science_Exploration/Space_Science/Juice',
    timeline: [
      { date: '14 apr 2023',  event: 'Lancering met Ariane 5 ECA+ vanuit Kourou' },
      { date: 'aug 2024',     event: 'Aarde/Maan-zwaartekrachtassist' },
      { date: 'okt 2024',     event: 'Venus-zwaartekrachtassist' },
      { date: 'jan 2026',     event: 'Tweede Aarde-zwaartekrachtassist' },
      { date: 'jul 2031',     event: 'Aankomst Jupiter-systeem; beginnen verkenning ijsmanen' },
      { date: 'dec 2034',     event: 'Injectie in baan om Ganymede (GEO)' },
      { date: 'sep 2035',     event: 'Einde missie: impactlanding op Ganymede' },
    ],
    facts: [
      { label: 'Massa (bij lancering)', value: '5.963 kg' },
      { label: 'Instrumenten',          value: '10 wetenschappelijke instrumenten' },
      { label: 'Zonnepanelen',          value: '85 m² (grootste interplanetaire sonde)' },
      { label: 'Vermogen bij Jupiter',  value: '~820 W' },
      { label: 'Communicatietijd',      value: '43–52 minuten (bij Jupiter)' },
      { label: 'Reistijd tot Jupiter',  value: '~8 jaar' },
    ],
    relatedTags: ['juice', 'jupiter', 'esa', 'ganymede', 'europa', 'callisto', 'ijsmaan', 'maan'],
  },

  {
    id: 'curiosity',
    name: 'MSL Curiosity',
    agency: 'NASA',
    agencyColor: '#378ADD',
    status: 'actief',
    launched: '26 nov 2011',
    objective: 'Onderzoekt geologische geschiedenis van Gale-krater op Mars.',
    body: 'Mars',
    highlight: 'Meer dan 4400 Mars-dagen actief — recordhouder',
    icon: '🤖',
    bgFrom: '#140a04',
    bgTo: '#241408',
    description: `De Mars Science Laboratory-rover Curiosity landt op 6 augustus 2012 in de Gale-krater op Mars en is inmiddels meer dan 4.400 Marsdagen (sols) actief — een absoluut record voor een Mars-rover. Curiosity's primaire ontdekking was het bewijs dat vloeibaar water vroeger heeft bestaan op het Marsoppervlak en dat de omstandigheden gunstig kunnen zijn geweest voor microbieel leven. De rover rijdt langzaam omhoog langs Mount Sharp, de centrale berg in de Gale-krater, en analyseert steeds oudere geologische lagen met zijn geavanceerde instrumentenpakket, inclusief een laserkanon (ChemCam) en een boorinstallatie.`,
    vehicle:    'Atlas V 541',
    launchSite: 'SLC-41, Cape Canaveral, Florida, VS',
    duration:   '>4.400 sols (nog actief, stand mrt 2026)',
    distanceKm: '~225.000.000 km (gemiddeld)',
    missionUrl: 'https://mars.nasa.gov/msl/',
    timeline: [
      { date: '26 nov 2011',  event: 'Lancering met Atlas V 541' },
      { date: '6 aug 2012',   event: 'Landing in Gale-krater via Sky Crane ("7 minuten van terreur")' },
      { date: 'sep 2013',     event: 'Bevestigd: Mars had ooit bewoonbare omstandigheden' },
      { date: 'dec 2013',     event: 'Naamgeving "John Klein"-boorlocatie na eerste succesvol boren' },
      { date: '2015–2020',    event: 'Beklimming Mount Sharp; vondst complex organisch materiaal' },
      { date: '2021–2026',    event: 'Actief onderzoek hoger gelegen lagen; >32 km gereden' },
    ],
    facts: [
      { label: 'Massa',             value: '899 kg' },
      { label: 'Afmetingen',        value: '3,0 × 2,7 × 2,1 meter' },
      { label: 'Energiebron',       value: 'Multi-Mission RTG (MMRTG)' },
      { label: 'Rijsnelheid max.',  value: '4 cm/s (~144 m/uur)' },
      { label: 'Rijafstand',        value: '>32 km (stand mrt 2026)' },
      { label: 'Instrumenten',      value: '10, waaronder ChemCam en SAM' },
    ],
    relatedTags: ['curiosity', 'mars', 'nasa', 'gale', 'msl', 'rover', 'mount sharp'],
  },

  {
    id: 'voyager1',
    name: 'Voyager 1',
    agency: 'NASA',
    agencyColor: '#378ADD',
    status: 'actief',
    launched: '5 sep 1977',
    objective: 'Verkenning buitenste planeten, nu door interstellaire ruimte.',
    body: 'Interstellair',
    highlight: 'Verst object door mensen gemaakt — >24 miljard km van de Zon',
    icon: '🌌',
    bgFrom: '#04060e',
    bgTo: '#080c18',
    description: `Voyager 1 is het verst verwijderde door mensen gemaakte object in de geschiedenis van de ruimtevaart. Gelanceerd in september 1977, maakte de sonde iconische opnamen van Jupiter (1979) en Saturnus (1980), inclusief de ontdekking van actieve vulkanen op Io. In augustus 2012 passeerde Voyager 1 officieel de heliopauze — de grens van de zonnewind — en begeeft zich nu door interstellaire ruimte. Radiogolven doen er ruim 22 uur over om de Aarde te bereiken. Aan boord bevindt zich een Gouden Plaat met geluiden en beelden van de Aarde, als boodschap voor eventuele buitenaardse beschavingen.`,
    vehicle:    'Titan IIIE / Centaur',
    launchSite: 'LC-41, Cape Canaveral, Florida, VS',
    duration:   '>48 jaar (nog actief, stand 2026)',
    distanceKm: '>24.000.000.000 km (>163 AU, stand mrt 2026)',
    missionUrl: 'https://voyager.jpl.nasa.gov/',
    timeline: [
      { date: '5 sep 1977',   event: 'Lancering met Titan IIIE/Centaur' },
      { date: 'mrt 1979',     event: 'Jupiter-flyby; ontdekking vulkanische activiteit op Io' },
      { date: 'nov 1980',     event: 'Saturnus-flyby; gedetailleerde beelden ringen en Titan' },
      { date: '14 feb 1990',  event: '"Pale Blue Dot" foto: Aarde vastgelegd op 6 miljard km' },
      { date: 'aug 2012',     event: 'Officieel de heliopauze gepasseerd — interstellaire ruimte bereikt' },
      { date: 'nov 2023',     event: 'Communicatieprobleem opgelost; sonde hervatten wetenschapdata' },
      { date: 'mrt 2026',     event: '>163 AU van de Zon; signaalvertraging >22 uur' },
    ],
    facts: [
      { label: 'Massa',               value: '721,9 kg' },
      { label: 'Afstand van Zon',     value: '>163 AU / >24 miljard km (mrt 2026)' },
      { label: 'Snelheid',            value: '~17 km/s (~61.200 km/uur)' },
      { label: 'Signaalvertraging',   value: '>22 uur enkele reis' },
      { label: 'Energiebron',         value: '3 × RTG (radioactief thermoelektrisch)' },
      { label: 'Gouden Plaat',        value: 'Beelden en geluiden van de Aarde (Carl Sagan)' },
    ],
    relatedTags: ['voyager', 'voyager 1', 'nasa', 'interstellair', 'jupiter', 'saturnus', 'pale blue dot'],
  },

  {
    id: 'europa-clipper',
    name: 'Europa Clipper',
    agency: 'NASA',
    agencyColor: '#378ADD',
    status: 'actief',
    launched: '14 okt 2024',
    objective: 'Onderzoekt of Jupiter\'s ijsmaan Europa bewoonbaar is — met een oceaan onder het ijs.',
    body: 'Europa (Jupiter)',
    highlight: 'Grootste NASA interplanetaire sonde ooit; aankomst Jupiter 2030',
    icon: '🌊',
    bgFrom: '#04080e',
    bgTo: '#080f1e',
    description: `Europa Clipper is de grootste ruimtesonde die NASA ooit heeft gebouwd voor een interplanetaire missie. Gelanceerd op 14 oktober 2024 met een SpaceX Falcon Heavy, zal de sonde in april 2030 bij het Jupiter-systeem aankomen. Daarna maakt Europa Clipper 49 vluchten langs Europa — de ijsmaan van Jupiter waarvan wetenschappers denken dat er een grote vloeibare oceaan onder het bevroren oppervlak schuilt. Die oceaan zou meer water kunnen bevatten dan alle oceanen op Aarde samen. De missie onderzoekt of die oceaan bewoonbaar zou kunnen zijn voor microbieel leven. Europa Clipper draagt 9 wetenschappelijke instrumenten, waaronder REASON (radar om door het ijs te kijken), een massaspectrometer om het dampveld boven Europa te analyseren en thermische camera's.`,
    vehicle:    'Falcon Heavy',
    launchSite: 'LC-39A, Kennedy Space Center, Florida, VS',
    duration:   '~6 jaar (tot ~2031)',
    distanceKm: '~628.000.000 km (Jupiter gemiddeld)',
    missionUrl: 'https://europa.nasa.gov/',
    timeline: [
      { date: '14 okt 2024', event: 'Lancering met SpaceX Falcon Heavy vanuit Kennedy Space Center' },
      { date: 'mrt 2025',    event: 'Mars-flyby voor eerste zwaartekrachtassist' },
      { date: 'dec 2026',    event: 'Aarde-flyby voor tweede zwaartekrachtassist' },
      { date: 'apr 2030',    event: 'Aankomst Jupiter-systeem; begin verkenningsfase' },
      { date: '2030–2034',   event: '49 geplande vluchten langs Europa op lage hoogte (tot ~25 km)' },
    ],
    facts: [
      { label: 'Massa (gelanceerd)',    value: '~6.065 kg' },
      { label: 'Zonnepanelen',          value: '~30 m²' },
      { label: 'Wetenschapsinstrumenten', value: '9, waaronder REASON (ijs-penetrerende radar)' },
      { label: 'Laagste flyby-hoogte',  value: '~25 km boven Europa\'s oppervlak' },
      { label: 'Oceaandiepte (schatting)', value: '~100–200 km' },
      { label: 'Communicatietijd',      value: '43–52 minuten (bij Jupiter)' },
    ],
    relatedTags: ['europa clipper', 'europa', 'jupiter', 'nasa', 'ijsmaan', 'oceaan', 'bewoonbaarheid', 'falcon heavy'],
  },
]
void _MISSIONS_LEGACY // suppress unused warning
