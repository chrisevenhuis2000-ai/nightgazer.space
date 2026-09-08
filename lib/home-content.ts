// ── Shared homepage content & helpers ──────────────────────────────────────
// Extracted from app/page.tsx so the live homepage and the /staging rework
// read from one source instead of two copies.

export const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'
export const APOD_CACHE_KEY = 'nightgazer_apod_cache'

// ── Types ──────────────────────────────────────────────────────────────────
export interface APODData {
  title:       string
  explanation: string
  url:         string
  hdurl?:      string
  media_type:  string
  copyright?:  string
  date:        string
}

export interface ISSData {
  latitude:  number
  longitude: number
  altitude:  number
  velocity:  number
}

export interface Article {
  slug:      string
  title:     string
  excerpt:   string
  category:  string
  catColor:  string
  bgColor:   string
  author:    string
  date:      string
  readTime:  number
  featured:  boolean
  imageUrl?: string
}

// ── Fallback articles ──────────────────────────────────────────────────────
export const FALLBACK_ARTICLES: Article[] = [
  { slug: 'james-webb-k2-18b-biosignatuur', title: 'James Webb vindt mogelijke sporen van leven op K2-18b', excerpt: 'De JWST heeft dimethylsulfide gedetecteerd in de atmosfeer van K2-18b — een molecuul dat op Aarde uitsluitend door levende organismen wordt gemaakt.', category: 'James Webb', catColor: '#7aadff', bgColor: 'linear-gradient(135deg,#0a1030,#1a2860)', author: 'Redactie', date: '11 mrt 2026', readTime: 6, featured: true },
  { slug: 'desi-donkere-energie', title: 'DESI: donkere energie verzwakt al 4,5 miljard jaar', excerpt: 'De grootste 3D kaart van het heelal toont dat de kracht van donkere energie niet constant is — een potentiële revolutie in de kosmologie.', category: 'Kosmologie', catColor: '#c080ff', bgColor: 'linear-gradient(135deg,#0f0520,#1a0a35)', author: 'Redactie', date: '9 mrt 2026', readTime: 5, featured: false },
  { slug: 'starship-mechazilla', title: 'Starship IFT-7: booster gevangen door Mechazilla', excerpt: 'SpaceX\' mechanische arm ving opnieuw de Super Heavy booster op — een mijlpaal voor volledig herbruikbare ruimtevaart.', category: 'Missies', catColor: '#3dcfdf', bgColor: 'linear-gradient(135deg,#051a20,#0a3040)', author: 'Redactie', date: '7 mrt 2026', readTime: 4, featured: false },
  { slug: 'perseverance-mars', title: 'Perseverance vindt \'luipaardvlekken\' in Jezero krater', excerpt: 'Vreemde geologische patronen op Mars verbazen wetenschappers wereldwijd.', category: 'Mars', catColor: '#ff8a60', bgColor: 'linear-gradient(135deg,#1a0a05,#3a1510)', author: 'Redactie', date: '5 mrt 2026', readTime: 3, featured: false },
  { slug: 'komeet-c2026-a1', title: 'Komeet C/2026 A1 mogelijk zichtbaar met blote oog', excerpt: 'Astronomen zijn enthousiast over een heldere komeet die in april zichtbaar wordt.', category: 'Sterrenkijken', catColor: '#378ADD', bgColor: 'linear-gradient(135deg,#1a1505,#2a2010)', author: 'Redactie', date: '3 mrt 2026', readTime: 3, featured: false },
  { slug: 'neutronenster-uitgelegd', title: 'Wat is een neutronenster? Uitleg in 3 niveaus', excerpt: 'Van makkelijk naar technisch — ons AI-systeem legt het uit op jouw niveau.', category: 'Educatie', catColor: '#3ddf90', bgColor: 'linear-gradient(135deg,#051a10,#0a2a1a)', author: 'Redactie', date: '1 mrt 2026', readTime: 5, featured: false },
]

// ── Reading level ──────────────────────────────────────────────────────────
export function getLevel(category: string): 'beg' | 'ama' | 'pro' {
  const c = category.toLowerCase()
  if (c.includes('educatie') || c.includes('sterrenkijken')) return 'beg'
  if (c.includes('kosmologie') || c.includes('theoret'))    return 'pro'
  return 'ama'
}
export const LEVEL_LABEL = { beg: 'Beginner', ama: 'Amateur', pro: 'Pro' }
export const LEVEL_COLOR = {
  beg: { bg: 'rgba(224,80,64,0.12)',  color: '#e05040', border: '#e05040' },
  ama: { bg: 'rgba(61,223,144,0.12)', color: '#3ddf90', border: '#3ddf90' },
  pro: { bg: 'rgba(61,207,223,0.12)', color: '#3dcfdf', border: '#3dcfdf' },
}

// ── Per-article unique visual fingerprint ──────────────────────────────────
// Deterministic hash so every article always gets the same visual
export function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

// Dark background color pairs — visually distinct across categories
export const DARK_PAIRS = [
  ['#04060f', '#0b1226'],
  ['#08040e', '#140820'],
  ['#04090a', '#0c1c1e'],
  ['#0e0804', '#201408'],
  ['#04080f', '#081524'],
  ['#0a0408', '#1c0810'],
  ['#060a04', '#101e08'],
  ['#0b060e', '#1a0c22'],
] as const

export function articleVisual(article: Article) {
  const h = slugHash(article.slug)
  const angle = 108 + (h % 144)                   // 108°–252°, unique angle
  const pair  = DARK_PAIRS[h % DARK_PAIRS.length]  // unique dark bg pair
  const cx    = 10 + (h % 75)                      // glow circle x: 10–85%
  const cy    = 5  + ((h >> 8) % 70)               // glow circle y: 5–75%
  return {
    gradient: `linear-gradient(${angle}deg, ${pair[0]} 0%, ${pair[1]} 100%)`,
    cx, cy,
  }
}

// ── Ticker fallback (shown before articles-index.json loads) ───────────────
export const TICKER_FALLBACK = FALLBACK_ARTICLES.map(a => a.title)

// ── Topic filters ──────────────────────────────────────────────────────────
export const TOPICS = ['Alles', 'James Webb', 'Mars', 'Missies', 'Zwarte Gaten', 'Maan', 'Sterrenkijken', 'Zonnestelsel', 'Kosmologie']

/** Article categories are slugs ('james-webb'); topic labels are prose
 *  ('James Webb'). Comparing them raw made every hyphenated topic match
 *  nothing, so both sides are normalised to plain lowercase words first. */
function normaliseTopic(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function topicMatches(category: string, topic: string): boolean {
  if (topic === 'Alles') return true
  return normaliseTopic(category).includes(normaliseTopic(topic))
}

export const PAGE_SIZE = 12 // articles per page

export const SK_DARK_SPOTS = [
  { name: 'Terschelling',    lat: 53.43, lon: 5.35 },
  { name: 'Spiekeroog (DE)', lat: 53.77, lon: 7.69 },
  { name: 'Lauwersmeer',     lat: 53.36, lon: 6.20 },
  { name: 'Bargerveen',      lat: 52.68, lon: 7.03 },
  { name: 'Bourtangermoor',  lat: 53.01, lon: 7.20 },
  { name: 'Fochteloërveen',  lat: 52.96, lon: 6.38 },
]

// ── Daily quiz data ─────────────────────────────────────────────────────────
export type QuizLevel = { q: string; options: string[]; correct: number; explain: string }
export const DAILY_QUESTIONS: { id: number; topic: string; beg: QuizLevel; ama: QuizLevel; pro: QuizLevel }[] = [
  {
    id: 0, topic: 'Zwarte gaten',
    beg: { q: 'Wat is een eventhorizon?', options: ['De baan van een planeet om een zwart gat', 'De grens waarbinnen niets — ook licht niet — kan ontsnappen', 'Het middelpunt van een zwart gat', 'Een kosmische schokgolf'], correct: 1, explain: 'De eventhorizon is de "point of no return" rond een zwart gat. De zwaartekracht is daar zo sterk dat de ontsnappingssnelheid groter is dan de lichtsnelheid — alles wat erover gaat, is voorgoed verdwenen voor de buitenwereld.' },
    ama: { q: 'De Schwarzschild-straal Rs = 2GM/c². Wat beschrijft Rs?', options: ['De straal van de accretieschijf', 'De straal van de eventhorizon van een niet-roterend zwart gat', 'De gemiddelde afstand tot het centrum van een neutronenster', 'De Hawking-temperatuur-straal'], correct: 1, explain: 'Rs = 2GM/c² geeft de eventhorizon van een niet-roterend (Schwarzschild-)zwart gat. Voor de zon zou Rs ≈ 3 km zijn. Sgr A* (4×10⁶ M☉) heeft Rs ≈ 12 miljoen km — kleiner dan de baan van Mercurius.' },
    pro: { q: 'Welk proces onttrekt energie aan een Kerr-zwart gat via de ergosphere?', options: ['Bondi-accretie', 'Penrose-proces via frame-dragging', 'Hawking-verdamping', 'Magnetorotatieve instabiliteit'], correct: 1, explain: 'In het Penrose-proces valt een deeltje in de ergosphere uiteen: één fragment belandt in een negatieve energiebaan (valt in het zwarte gat) en het andere ontsnapt met méér energie dan de inkomende deeltje had — ten koste van het rotatie-impulsmoment van het Kerr-zwarte gat.' },
  },
  {
    id: 1, topic: 'Oerknal',
    beg: { q: 'Hoe oud is het heelal?', options: ['4,6 miljard jaar', '13,8 miljard jaar', '100 miljard jaar', '1 biljoen jaar'], correct: 1, explain: 'Het heelal is 13,787 ± 0,020 miljard jaar oud, vastgesteld via de Planck-satelliet (2018). Ter vergelijking: de Aarde is slechts 4,6 miljard jaar oud — het heelal bestond al meer dan 9 miljard jaar vóór onze planeet.' },
    ama: { q: 'Wat geeft de Hubble-constante H₀ aan?', options: ['De ouderdom van het heelal', 'De uitdijingssnelheid van het heelal per afstandseenheid (km/s/Mpc)', 'De dichtheid van donkere materie', 'De temperatuur van de CMB'], correct: 1, explain: 'H₀ beschrijft hoe snel het heelal uitdijt: per Megaparsec extra afstand vliegen objecten ~67–73 km/s sneller van ons weg (Hubble-wet: v = H₀·d). De onzekerheid (67 vs 73) is de bekende "Hubble-spanning" — mogelijk nieuwe fysica.' },
    pro: { q: 'Welke observatie leverde het directe bewijs voor Big Bang Nucleosynthese (BBN)?', options: ['De ontdekking van de CMB in 1965', 'De gemeten H:He-massaverhouding van ~3:1 in oeroude sterrenstelsels', 'De roodverschuiving van verre quasars', 'De ontdekking van donkere energie via Type Ia supernovae'], correct: 1, explain: 'BBN voorspelt dat in de eerste minuten na de oerknal ~75% waterstof en ~25% helium (massaverhouding) werd gevormd. Deze primordiale abundanties, gemeten in metaalarme sterren en intergalactisch gas, bevestigen het standaard kosmologisch model.' },
  },
  {
    id: 2, topic: 'Exoplaneten',
    beg: { q: 'Hoe detecteert de transitmethode planeten?', options: ['De planeet zendt eigen licht uit dat we meten', 'De ster wordt iets donkerder als de planeet ervoor passeert', 'We fotograferen de planeet direct', 'De planeet vervormt de ster'], correct: 1, explain: 'Als een exoplaneet voor zijn ster langsbeweegt, blokkeert hij een klein deel van het sterlicht — de ster wordt even iets donkerder. Die dip in helderheid verraadt de planeet. Hoe groter de planeet, hoe dieper de dip: ΔF/F = (Rplaneet/Rster)².' },
    ama: { q: 'Welke telescoop ontdekte de meeste exoplaneten via de transitmethode?', options: ['Hubble', 'James Webb', 'Kepler/K2', 'Spitzer'], correct: 2, explain: 'De Kepler-ruimtetelescoop (2009–2018) ontdekte meer dan 2.600 bevestigde exoplaneten door 9 jaar lang ~150.000 sterren te monitoren op helderheidsvariaties. Zijn opvolger TESS (2018–heden) zoekt dichter bij huis naar planeten rond heldere sterren.' },
    pro: { q: 'Welke parameter beschrijft de atmosferische schaallengte H in transmissiespectroscopie?', options: ['H = kT/μg — thermische energie gedeeld door moleculaire massa × zwaartekracht', 'H = Rs/2 (halve Schwarzschild-straal)', 'H = Rplaneet/Rster', 'H = GMster/c²'], correct: 0, explain: 'De schaallengte H = kT_eq/(μg) bepaalt hoe snel de atmosfeer qua druk afneemt met hoogte. Een hoge T of lage μ (licht molecuul, bijv. H₂) geeft een grote H en dus een sterker transmissiesignaal — makkelijker te detecteren met JWST.' },
  },
  {
    id: 3, topic: 'Melkweg',
    beg: { q: 'Welk type sterrenstelsel is de Melkweg?', options: ['Elliptisch stelsel', 'Onregelmatig stelsel', 'Spiraalstelsel met een bar (staaf)', 'Bolvormig stelsel'], correct: 2, explain: 'De Melkweg is een balkspiraalsterrenstelsel (SBbc-type) — een spiraalstelsel met een centrale balkstructuur waaruit de spiraalvormige armen ontspringen. We bevinden ons op ~26.000 lichtjaar van het centrum, in de Orion-arm.' },
    ama: { q: 'Hoeveel sterren bevat de Melkweg bij benadering?', options: ['1 miljard', '10 miljard', '100–400 miljard', '1 biljoen'], correct: 2, explain: 'Schattingen lopen uiteen van 100 tot 400 miljard sterren in de Melkweg. Het grote bereik komt doordat we de distributie van zwakkere, moeilijk zichtbare sterren moeten extrapoleren. De meeste massa zit in de bulge en het halo.' },
    pro: { q: 'Wat is de massa van Sgr A* in zonsmassa\'s?', options: ['~4 × 10⁴ M☉', '~4 × 10⁶ M☉', '~4 × 10⁹ M☉', '~4 × 10¹² M☉'], correct: 1, explain: 'Sgr A* heeft een massa van ~4,1 × 10⁶ M☉, vastgesteld via de banen van sterren in de S-cluster (S2 heeft een omlooptijd van ~16 jaar). Dit bewijs leverde Andrea Ghez en Reinhard Genzel de Nobelprijs Natuurkunde 2020 op.' },
  },
  {
    id: 4, topic: 'Planetaire beweging',
    beg: { q: 'In welke vorm bewegen planeten om de zon?', options: ['Cirkels', 'Ellipsen', 'Spiralen', 'Parabolen'], correct: 1, explain: 'Planeten bewegen in elliptische banen met de zon in één van de twee brandpunten — dit is de eerste wet van Kepler (1609). Een cirkel is een speciaal geval van een ellips (excentriciteit = 0), maar echte planetaire banen zijn licht ovaalvormig.' },
    ama: { q: 'Wat stelt de derde wet van Kepler?', options: ['Planeten bewegen in ellipsen', 'Gelijke oppervlakken in gelijke tijden', 'T² ∝ a³ (omlooptijd² ∝ halve grootas³)', 'Alle planeten bewegen even snel'], correct: 2, explain: 'Keplers derde wet: T² ∝ a³. Mars staat op 1,52 AU, dus T_Mars² = 1,52³ ≈ 3,51, T_Mars ≈ 1,87 jaar ≈ 687 dagen. Newton bewees deze relatie later met zijn gravitatiewet F = GMm/r².' },
    pro: { q: 'Welk relativistisch effect verklaart de extra precessie van Mercurius\' perihelion (43 arcsec/eeuw)?', options: ['Speciale relativiteitstheorie (tijddilatatie)', 'Algemene relativiteitstheorie (ruimtetijdkromming)', 'Kwantumgravitatie', 'Poynting-Robertson-effect'], correct: 1, explain: 'De 43 arcsec/eeuw extra precessie van Mercurius (boven de Newtoniaans berekende 532 arcsec/eeuw) werd pas verklaard door Einsteins ART (1915) via de Schwarzschild-metriek. Dit was één van de eerste experimentele bevestigingen van de ART.' },
  },
  {
    id: 5, topic: 'HR-diagram',
    beg: { q: 'Wat laat een HR-diagram zien?', options: ['De afstanden van sterren tot de aarde', 'Het verband tussen stertemperatuur en lichtkracht', 'De rotatiesnelheid van sterrenstelsels', 'De ouderdom van planeten'], correct: 1, explain: 'Het Hertzsprung-Russell-diagram (1911/1913) toont sterren op basis van hun oppervlaktetemperatuur (x-as, van heet naar koel) en lichtkracht (y-as). De meeste sterren liggen op een diagonale band — de "hoofdreeks" — waarbinnen ook de zon staat.' },
    ama: { q: 'In welk gebied van het HR-diagram bevindt de zon zich?', options: ['Reuzentak', 'Witte-dwerg-sequentie', 'Hoofdreeks (spectrale klasse G)', 'Instabiliteitsstrook'], correct: 2, explain: 'De zon is een G2V-ster: spectrale klasse G (T ≈ 5.778 K), op de hoofdreeks (V = luminositeitsklasse). Ze heeft een absolute magnitude van +4,83. Over ~5 miljard jaar verlaat ze de hoofdreeks en wordt ze een rode reus.' },
    pro: { q: 'Wat bepaalt de positie van een ster op de Zero Age Main Sequence (ZAMS)?', options: ['Leeftijd en metalliciteit', 'Uitsluitend de initiële massa', 'Rotatiesnelheid en magnetisch veld', 'Afstand tot het galactisch centrum'], correct: 1, explain: 'De positie op de ZAMS wordt primair bepaald door de initiële massa (hoofdsequentie-massa-lichtsterktecorrelatie L ∝ M³·⁵ voor mid-range sterren). Metalliciteit en rotatie hebben een secondaire invloed maar de massa domineert de structuur volledig via de hydrostatisch evenwichtsvergelijking.' },
  },
  {
    id: 6, topic: 'Donkere materie',
    beg: { q: 'Wat is het sterkste indirecte bewijs voor donkere materie?', options: ['Sterren bewegen te snel aan de rand van sterrenstelsels', 'We zien zwarte gaten bewegen', 'Kometen draaien anders dan verwacht', 'De zon heeft een ongewone baan'], correct: 0, explain: 'De buitenste sterren van spiraalgalaxieën bewegen bijna even snel als de binnenste — terwijl ze, als alleen zichtbare materie de zwaartekracht leverde, veel langzamer zouden moeten zijn (zoals de buitenste planeten in ons zonnestelsel). Dit duidt op een grote hoeveelheid onzichtbare massa: donkere materie.' },
    ama: { q: 'Wat observeerde Vera Rubin in de jaren 70 als bewijs voor donkere materie?', options: ['Dat sterrenstelsels uitdijen', 'Vlakke rotatiesnelheidscurven van spiraalgalaxieën', 'Gravitationele lensing rond galaxiehopen', 'Röntgenstraling van galactische kernen'], correct: 1, explain: 'Rubin mat dat de rotatiesnelheid v(r) buiten de optische schijf van spiraalgalaxieën constant blijft in plaats van te dalen als v ∝ 1/√r. Dit vereist een onzichtbare massa-halo: M(r) ∝ r. Haar werk maakte donkere materie tot mainstream wetenschap.' },
    pro: { q: 'Welke observatie van de Bullet Cluster (1E 0657-558) weerlegt MOND-alternatieven voor donkere materie?', options: ['De röntgenemissie valt samen met de zwaarste gravitationele massa', 'De zwaartekrachtscentra (via lensing) zijn ruimtelijk gescheiden van het röntgengas', 'De roodverschuiving toont een botsingssnelheid van 10.000 km/s', 'De stervormingssnelheid is abnormaal hoog'], correct: 1, explain: 'Na de botsing van twee clusters is het heet röntgengas (baryonen, zichtbaar via Chandra) vertraagd door drukkrachten, terwijl de gravitationele massa (gemeten via zwakke lensing) ongehinderd doorsnelde. Die ruimtelijke scheiding kan alleen verklaard worden met niet-interacterende donkere materie — MOND kan dit niet reproduceren.' },
  },
  {
    id: 7, topic: 'Kosmische achtergrondstraling',
    beg: { q: 'Wat is de kosmische achtergrondstraling (CMB)?', options: ['Röntgenstraling van zwarte gaten', 'Restlicht van de oerknal, nu zichtbaar als microgolven', 'Licht van de verste sterrenstelsels', 'Straling van de zon buiten de atmosfeer'], correct: 1, explain: 'De CMB is het "nagloeden" van de oerknal. Zo\'n 380.000 jaar na de oerknal koelde het heelal genoeg af om waterstof te vormen — het licht dat daarna vrijkwam reist nog steeds door het heelal. Door de uitdijing is het roodverschoven tot microgolffrequenties met T = 2,7 K.' },
    ama: { q: 'Op welke temperatuur bevindt de CMB zich nu?', options: ['0 K (absolute nulpunt)', '2,725 K', '15 K', '1.000 K'], correct: 1, explain: 'De CMB heeft nu een temperatuur van 2,7255 K — bijna het absolute nulpunt. Oorspronkelijk, bij het "last scattering surface" (z ≈ 1100), was de temperatuur ~3.000 K. De uitdijing van het heelal heeft het licht met een factor 1100 roodverschoven.' },
    pro: { q: 'Hoelang na de oerknal werd de CMB uitgezonden (recombinatie-tijdperk)?', options: ['~3 minuten', '~380.000 jaar', '~1 miljoen jaar', '~380 miljoen jaar'], correct: 1, explain: 'Bij z ≈ 1100, ~380.000 jaar na de oerknal, daalde de temperatuur tot ~3.000 K: protonen en elektronen recombineerden tot neutraal waterstof. Het heelal werd transparant en fotonen konden vrij bewegen — de CMB is dat "last scattering surface", gefotografeerd door COBE, WMAP en Planck.' },
  },
  {
    id: 8, topic: 'Ruimtevaart',
    beg: { q: 'Wat is de ontsnappingssnelheid van de Aarde?', options: ['7,9 km/s', '11,2 km/s', '29,8 km/s', '300.000 km/s'], correct: 1, explain: 'Om de Aarde te verlaten zonder verdere aandrijving moet een object minimaal 11,2 km/s bereiken — de ontsnappingssnelheid. Ter vergelijking: een kogel gaat ~1 km/s. Raketten halen dit in meerdere trap-brandingen om de benodigde brandstofmassa te beperken.' },
    ama: { q: 'Wat beschrijft Tsiolkovsky\'s raketformule Δv = ve · ln(m₀/mf)?', options: ['De maximale hoogte van een raket', 'De snelheidswinst als functie van uitstootsnelheid en massaverhouding', 'De benodigde baankracht voor LEO', 'De Hohmann-transfersnelheid'], correct: 1, explain: 'De raketformule geeft de ideale snelheidsverandering Δv die een raket kan bereiken: ve is de uitlaatsnelheid van gassen, m₀ de beginmassa (inclusief brandstof) en mf de eindmassa. Het logaritmische verband betekent dat meer brandstof steeds minder oplevert — vandaar meerdere trappen.' },
    pro: { q: 'Wat is het voordeel van een gravitational assist (slingshot) boven een directe burn?', options: ['Meer Δv per kg brandstof omdat planetaire baanenergie wordt benut', 'De raketmotor kan langer branden', 'Het vermindert de reis-tijd altijd significant', 'Het verhoogt de Isp van het voortstuwingssysteem'], correct: 0, explain: 'Bij een gravitational assist wint de sonde impuls uit de baanenergie van de planeet (in het heliocentrisch stelsel). In het planetaire referentiestelsel is |v∞| behouden, maar de richting verandert — wat zich vertaalt naar een snelheidswinst in het heliocentrisch stelsel zonder brandstofverbruik.' },
  },
  {
    id: 9, topic: 'Bewoonbare zone',
    beg: { q: 'Wat bepaalt de "bewoonbare zone" rond een ster?', options: ['Het gebied waar de ster zichtbaar is', 'Het gebied waar vloeibaar water op een planeetoppervlak mogelijk is', 'Het gebied zonder meteorieten', 'De afstand waar zuurstof aanwezig is'], correct: 1, explain: 'De bewoonbare zone (habitable zone) is het gebied rond een ster waar de temperatuur op een planeetoppervlak vloeibaar water kan laten bestaan — een voorwaarde voor leven zoals wij dat kennen. Niet te heet (water verdampt) en niet te koud (water bevriest): de "Goudlokje-zone".' },
    ama: { q: 'Waarom heet de bewoonbare zone ook wel de "Goudlokje-zone"?', options: ['Naar astronoom Goudlokje (1892)', 'Naar het sprookje: niet te heet, niet te koud, maar precies goed', 'Omdat goud-achtige sterren de meeste bewoonbare planeten hebben', 'Omdat de zone de kleur goud heeft in diagrammen'], correct: 1, explain: 'Net als Goudlokje die pap zocht die "precies goed" was, is de bewoonbare zone het gebied dat "precies goed" is voor vloeibaar water: niet te dicht bij de ster (te heet) en niet te ver (te koud). De term werd populair gemaakt door James Kasting (1993).' },
    pro: { q: 'Welke parameter bepaalt primair de equilibriumtemperatuur T_eq van een exoplaneet?', options: ['T_eq ∝ (L_ster / a²)^(1/4) waarbij a de baanhalve-as is', 'T_eq = T_ster × (R_ster/2a)^(1/2) gecorrigeerd voor albedo', 'T_eq is gelijk aan de oppervlaktetemperatuur van de ster', 'T_eq hangt alleen af van de planeetmassa'], correct: 1, explain: 'T_eq = T_ster × (R_ster/2a)^(1/2) × (1 − A_Bond)^(1/4), waarbij A_Bond het reflectievermogen is. Dit geeft de temperatuur zonder broeikasgaseffect. Venus heeft A ≈ 0,77 (hoge albedo) maar is toch heter dan verwacht door CO₂ — bewijs van een sterk broeikaseffect.' },
  },
  {
    id: 10, topic: 'Kernfusie',
    beg: { q: 'Wat produceert de zon via kernfusie?', options: ['Waterstof uit helium', 'Helium uit waterstof, plus enorme energie', 'Zuurstof en stikstof', 'Zwaar water'], correct: 1, explain: 'In de zonkern smelten 4 waterstofatomen samen tot 1 heliumatoom. Het massaverschil (Δm ≈ 0,7% van de waterstofmassa) wordt omgezet in energie via E = mc². Elke seconde zet de zon 600 miljoen ton waterstof om — en heeft daar al 4,6 miljard jaar brandstof voor gehad.' },
    ama: { q: 'Via welke reactieketen fuseert de zon voornamelijk?', options: ['CNO-cyclus', 'Triple-alpha-reactie', 'Proton-protonketen (pp-I)', 'r-proces'], correct: 2, explain: 'De zon gebruikt voornamelijk de pp-I keten (proton-proton): 4¹H → ⁴He + 2e⁺ + 2νe + 26,7 MeV. De CNO-cyclus domineert pas in sterren zwaarder dan ~1,3 M☉ vanwege de sterkere temperatuurafhankelijkheid (T²⁰ vs T⁴ voor pp).' },
    pro: { q: 'Het zonnige neutrino-probleem was: welke oplossing werd bevestigd door SNO (2002)?', options: ['De zon fuseert minder dan modellen voorspellen', 'Elektroneutrino\'s oscilleren naar mu- en tauneutrino\'s en worden gemist door detectors', 'Het Standaard Model onderschat de neutrino-massa', 'Neutrino\'s bewegen sneller dan licht in de zonkern'], correct: 1, explain: 'Het SNO-experiment toonde aan dat het totale neutrino-flux (alle smaken) overeenkomt met het Standaard Zonnemodel, maar dat ~2/3 van de elektroneutrino\'s onderweg oscilleren naar andere smaken. Dit bewijst dat neutrino\'s massa hebben — een doorbraak buiten het Standaard Deeltjesmodel. Takaaki Kajita en Arthur McDonald kregen hiervoor de Nobelprijs 2015.' },
  },
  {
    id: 11, topic: 'Donkere energie',
    beg: { q: 'Wat doet donkere energie met het heelal?', options: ['Het vertraagt de uitdijing', 'Het versnelt de uitdijing van het heelal', 'Het trekt sterrenstelsels samen', 'Het heeft geen effect op grote schaal'], correct: 1, explain: 'Donkere energie — ontdekt in 1998 via Type Ia supernovae — versnelt de uitdijing van het heelal. In plaats van te vertragen door zwaartekracht, dijt het heelal steeds sneller uit. Donkere energie maakt ~68% van de totale energie-inhoud van het heelal uit.' },
    ama: { q: 'Welk percentage van de totale energie-inhoud van het heelal bestaat uit donkere energie?', options: ['~5%', '~27%', '~68%', '~95%'], correct: 2, explain: 'Volgens het ΛCDM-model bestaat het heelal uit: ~68% donkere energie (Λ), ~27% donkere materie en ~5% gewone (baryonische) materie. Alles wat we kunnen zien — sterren, planeten, gas, mensen — is die 5%. De rest is onbekend.' },
    pro: { q: 'Wat is de "equation of state" parameter w voor de kosmologische constante Λ?', options: ['w = 0', 'w = −1', 'w = +1/3', 'w = −1/3'], correct: 1, explain: 'De kosmologische constante heeft w = −1 (druk p = −ρc²), wat leidt tot constante energiedichtheid tijdens uitdijing. Als w ≠ −1 of tijdvariabel (quintessence), zou dat "dynamische donkere energie" zijn. DESI 2024 zag hints dat w licht afwijkt van −1, maar nog niet significant.' },
  },
  {
    id: 12, topic: 'Dwergplaneten',
    beg: { q: 'Waarom is Pluto in 2006 herklassificeerd als dwergplaneet?', options: ['Pluto is te klein om een planeet te zijn', 'Pluto heeft zijn baan niet vrijgemaakt van andere objecten', 'Pluto heeft geen manen', 'Pluto beweegt te langzaam'], correct: 1, explain: 'De IAU definieerde in 2006 dat een planeet: (1) de zon omcirkelt, (2) voldoende massa heeft voor een bolvorm, én (3) zijn baan heeft "vrijgemaakt" van andere objecten. Pluto voldoet aan 1 en 2 maar niet aan 3 — de Kuipergordel staat vol objecten langs zijn baan.' },
    ama: { q: 'Hoeveel erkende dwergplaneten zijn er in ons zonnestelsel?', options: ['3', '5', '12', '>200 kandidaten, 5 officieel erkend'], correct: 3, explain: 'De IAU heeft officieel 5 dwergplaneten erkend: Pluto, Eris, Makemake, Haumea en Ceres. Maar astronomen schatten dat er meer dan 200 objecten in de buitenste zones zijn die aan de definitie voldoen — ze zijn gewoon nog niet allemaal geclassificeerd.' },
    pro: { q: 'De IAU-definitie vereist "clearing the neighbourhood". Welke parameter kwantificeert dit?', options: ['Tisserand-parameter T_J', 'Planetaire discriminant μ = M/m (planeetmassa / geclearde zonale massa)', 'Hillsphere-ratio', 'Baanresonantieparameter'], correct: 1, explain: 'De planetaire discriminant μ = M_planeet / M_sone (massa planeet gedeeld door de totale massa van objecten in zijn baanom de zon) kwantificeert "clearing the neighbourhood". Aarde: μ ≈ 1,7 × 10⁶. Pluto: μ ≈ 0,077. De grens ligt bij ~100; alles eronder is een dwergplaneet.' },
  },
  {
    id: 13, topic: 'Sterrenkijken',
    beg: { q: 'Wat is de Bortle-schaal?', options: ['Een maat voor telescoopcapaciteit', 'Een schaal (1–9) voor de donkerte van de nachthemel', 'De helderheid van de maan', 'De grootte van een meteoor'], correct: 1, explain: 'De Bortle-schaal loopt van 1 (volkomen donker, Melkweg werpt schaduwen) tot 9 (stadscentrum, alleen de helderste sterren zichtbaar). Bortle 1 vind je op afgelegen eilanden of bergtoppen. Vanuit Amsterdam-centrum zit je op Bortle 8–9.' },
    ama: { q: 'Welke grootheid bepaalt of een hemellichaam met het blote oog zichtbaar is?', options: ['Absolute magnitude (M)', 'Schijnbare magnitude (m) < ~6', 'Afstand in parsec', 'Spectraalklasse'], correct: 1, explain: 'Schijnbare magnitude m beschrijft hoe helder een object er aan de hemel uitziet. Het menselijk oog ziet objecten tot m ≈ +6 onder donkere hemel (Bortle 1–2). Jupiter staat op m ≈ −2,9; Sirius op −1,46. Hoe lager (negatiever), hoe helderder.' },
    pro: { q: 'Wat is het oogscheidingsvermogen (resolutie) van een 200 mm telescoop bij λ = 550 nm?', options: ['~0,28 arcsec (Rayleigh-criterium: 1,22λ/D)', '~1 arcsec', '~5 arcsec', '~0,01 arcsec'], correct: 0, explain: 'Het Rayleigh-criterium θ = 1,22λ/D = 1,22 × 550×10⁻⁹ / 0,2 ≈ 3,35×10⁻⁶ rad ≈ 0,69 arcsec. In de praktijk beperkt "seeing" (atmosferische turbulentie) de resolutie op aarde tot ~1–3 arcsec. Alleen vanuit de ruimte of met adaptieve optiek benut je de volledige apertuur.' },
  },
  {
    id: 14, topic: 'ISS & Ruimtestations',
    beg: { q: 'Op welke hoogte vliegt het Internationaal Ruimtestation (ISS)?', options: ['~50 km', '~400 km', '~36.000 km', '~385.000 km'], correct: 1, explain: 'De ISS cirkelt op ~400 km hoogte in een Low Earth Orbit (LEO) met een snelheid van ~27.600 km/u. Op die hoogte doet het station er slechts ~92 minuten over om de Aarde te omcirkelen — dat is ruim 15 keer per dag! Je kunt het soms met het blote oog zien als een snel bewegend helder punt.' },
    ama: { q: 'Hoe lang duurt één omloop van de ISS om de Aarde?', options: ['~45 minuten', '~92 minuten', '~24 uur', '~7 dagen'], correct: 1, explain: 'Op ~400 km hoogte heeft de ISS een omlooptijd van ~92 minuten (v_c = √(GM/r) ≈ 7,66 km/s). Dit betekent dat astronomen aan boord ruim 15 zonsopgangen en -ondergangen per dag beleven. De ISS moet regelmatig worden opgestuwd omdat de resterende atmosfeer de baan langzaam afbreekt.' },
    pro: { q: 'Welke Δv is ruwweg nodig voor een Hohmann-transfer van LEO (400 km) naar GEO (35.786 km)?', options: ['~1,5 km/s totaal', '~3,9 km/s totaal (twee burns)', '~7,9 km/s (escape velocity)', '~11,2 km/s'], correct: 1, explain: 'Een Hohmann-transfer van LEO naar GEO vereist twee motorbrandingen: Δv₁ ≈ 2,46 km/s (apogee verhogen naar GEO) en Δv₂ ≈ 1,47 km/s (circulariseren in GEO), totaal ~3,93 km/s. Dit is waarom geosynchrone satellieten grote brandstoftanks nodig hebben en chemische voortstuwing gebruiken.' },
  },
]

export function skDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

// ── Event countdown strip ───────────────────────────────────────────────────
export const SPACE_EVENTS = [
  { id: 1,  date: '2026-04-09', title: 'ESA SMILE lancering',          icon: '🛰️', cat: 'Missie',  color: '#378ADD', desc: 'Solar wind Magnetosphere Ionosphere Link Explorer vertrekt vanuit Kourou.' },
  { id: 2,  date: '2026-04-22', title: 'Lyriden meteorenstroom',        icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~18/u. Donkere hemel aanbevolen, beste na middernacht.' },
  { id: 3,  date: '2026-04-28', title: 'Komeet C/2026 A1 piek',        icon: '🌠', cat: 'Komeet',  color: '#3ddf90', desc: 'Piekzichtbaarheid: mogelijk met blote oog in het westen na zonsondergang.' },
  { id: 4,  date: '2026-05-06', title: 'Eta Aquariden',                 icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~50/u. Brokstukken van komeet Halley. Beste voor dageraad.' },
  { id: 5,  date: '2026-06-20', title: 'Jupiter–Mars conjunctie',       icon: '♃', cat: 'Planeet', color: '#d4a84b', desc: 'Jupiter en Mars staan op minder dan 0,5° van elkaar — spectaculair met verrekijker.' },
  { id: 6,  date: '2026-08-12', title: 'Totale zonsverduistering',      icon: '🌑', cat: 'Eclips',  color: '#c080ff', desc: 'Totaliteitspad over Groenland, IJsland, Spanje en Rusland.' },
  { id: 7,  date: '2026-08-13', title: 'Perseïden piek',                icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~100/u. Nieuwe maan = ideale omstandigheden. BESTE KANS 2026.' },
  { id: 8,  date: '2026-08-30', title: 'Nancy Grace Roman-lancering',   icon: '🚀', cat: 'Missie',  color: '#378ADD', desc: 'Infraroodtelescoop naar L2 voor onderzoek naar donkere energie en exoplaneten — Falcon Heavy.' },
  { id: 9,  date: '2026-11-17', title: 'Leoniden',                      icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~15/u. Halve maan, redelijke condities.' },
  { id: 10, date: '2026-12-14', title: 'Geminiden piek',                icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~150/u. Grootste meteorenstroom van het jaar. Geen maanlicht.' },
]

export const CAT_COLORS: Record<string, string> = {
  Missie: '#378ADD', Meteor: '#ffa040', Komeet: '#3ddf90', Eclips: '#c080ff', Planeet: '#d4a84b',
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00Z')
  const now    = new Date(); now.setUTCHours(0,0,0,0)
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}
