// ── Gedeelde educatie-inhoud ───────────────────────────────────────────────
// Uit app/educatie/EducatieClient.tsx getrokken zodat de live pagina en de
// /staging-rework uit één bron lezen. Zes onderwerpen, elk met uitleg op
// drie niveaus, kernfeiten, bronnen en begrippen.

export const LEVELS = [
  { key: 'beg', label: 'Beginner',  color: '#e05040', border: 'rgba(224,80,64,0.4)',  bg: 'rgba(224,80,64,0.1)',  desc: 'Geen voorkennis nodig. Heldere taal, mooie beelden, pakkende vergelijkingen.' },
  { key: 'ama', label: 'Amateur',   color: '#3ddf90', border: 'rgba(61,223,144,0.4)', bg: 'rgba(61,223,144,0.1)', desc: 'Je kent de basisconcepten. We duiken dieper in met getallen en terminologie.' },
  { key: 'pro', label: 'Pro',       color: '#3dcfdf', border: 'rgba(61,207,223,0.4)', bg: 'rgba(61,207,223,0.1)', desc: 'Wetenschappelijk niveau. Formules, peer-reviewed bronnen, vakjargon.' },
]

export const DEMO_CONCEPT = {
  title: 'Wat is een zwart gat?',
  beg: 'Een zwart gat is een plek in de ruimte waar de zwaartekracht zo sterk is dat zelfs licht er niet meer uit kan ontsnappen. Het ontstaat als een enorme ster aan het einde van zijn leven instort. De grens waarbij er geen terugkeer meer mogelijk is heet de "eventhorizon". Alles wat daarin valt, verdwijnt voor altijd.',
  ama: 'Een zwart gat is een regio in de ruimtetijd met een dusdanig sterke zwaartekrachtspotentiaal dat de ontsnappingssnelheid groter is dan c (lichtsnelheid). Stellaire zwarte gaten ontstaan na de gravitationele collaps van sterren > ~20 M☉. De Schwarzschild-straal Rs = 2GM/c² bepaalt de grootte van de eventhorizon. Supermassieve zwarte gaten (10⁶–10¹⁰ M☉) bevinden zich in de kernen van vrijwel alle grote sterrenstelsels.',
  pro: 'Een Kerr–Newman zwart gat wordt volledig beschreven door drie parameters: massa M, impulsmoment J en lading Q. De ergosphere buiten de Kerr-horizont maakt Penrose-processen mogelijk (energieonttrekking via frame-dragging). Hawking-straling (T_H = ℏc³/8πGMk_B) voorspelt zwarte-gatverdam­ping op tijdschalen τ ∝ M³. Bij SGR A* (M ≈ 4×10⁶ M☉) bevestigt het EHT-beeld de schaduwritmiek binnen GR-voorspellingen.',
}

export const TOPIC_DETAILS: Record<string, {
  featuredConcept: string
  beg: string
  ama: string
  pro: string
  keyFacts: string[]
  sources: { label: string; url: string }[]
  glossary: { term: string; def: string }[]
}> = {
  zonnestelsel: {
    featuredConcept: 'Planetaire beweging',
    beg: 'De planeten bewegen in ellipsvormige banen om de zon. Hoe dichter een planeet bij de zon is, hoe sneller hij beweegt. De Aarde doet er 365 dagen over voor één ronde, Mars 687 dagen. De zwaartekracht van de zon trekt alle planeten naar zich toe en houdt ze zo in hun baan.',
    ama: 'Kepler formuleerde drie wetten (1609–1619): (1) Planeten bewegen in ellipsen met de zon in één brandpunt. (2) De verbindingslijn ster–planeet bestrijkt gelijke oppervlakken in gelijke tijden (behoud van impulsmoment). (3) T² ∝ a³ — de omlooptijd in het kwadraat is evenredig met de halve grootas in de derde macht. Newton verklaarde dit later met F = GMm/r².',
    pro: 'Afwijkingen van perfecte Kepler-ellipsen (seculareprecession) volgen uit N-body-storingen en, voor Mercurius, uit Algemene Relativiteitstheorie (43 boogseconden/eeuw). Lagrangepunten L1–L5 zijn evenwichtspunten in het beperkte drie-lichamenprobleem; L4/L5 zijn stabiel (Trojanen). De Tisserand-parameter T = a_J/a + 2√(a/a_J(1−e²))·cos(i) bepaalt de dynamische klasse van kleine lichamen.',
    keyFacts: [
      '8 planeten + 5 erkende dwergplaneten',
      'Zon–Aarde-afstand = 1 AU = 149,6 miljoen km',
      'Zonnestelsel gevormd ±4,6 miljard jaar geleden',
      'Oort-wolk reikt tot ±100.000 AU',
    ],
    sources: [
      { label: 'NASA Solar System Exploration', url: 'https://solarsystem.nasa.gov/' },
      { label: 'Wikipedia — Zonnestelsel', url: 'https://nl.wikipedia.org/wiki/Zonnestelsel' },
      { label: 'Wikipedia — Wetten van Kepler', url: 'https://nl.wikipedia.org/wiki/Wetten_van_Kepler' },
    ],
    glossary: [
      { term: 'AU', def: 'Astronomische Eenheid — de gemiddelde afstand Aarde–Zon (149,6 miljoen km). Standaardmaat voor afstanden binnen het zonnestelsel.' },
      { term: 'Ellips', def: 'Een gesloten ovaalvormige kromme. Planetaire banen zijn ellipsvormig met de zon in één van de twee brandpunten (1e wet van Kepler).' },
      { term: 'Perihelium', def: 'Het punt in de baan van een planeet of komeet dat het dichtst bij de zon ligt. In het perihelium beweegt het object het snelst.' },
      { term: 'Aphelium', def: 'Het punt in de baan het verst van de zon. In het aphelium is de baansnelheid het laagst.' },
      { term: 'Dwergplaneet', def: 'Een hemellichaam dat om de zon draait en voldoende massa heeft voor een bolvorm, maar zijn baan niet heeft vrijgemaakt. Pluto en Ceres zijn voorbeelden.' },
      { term: 'Oort-wolk', def: 'Een bolvormige wolk van ijsachtige objecten aan de rand van het zonnestelsel (tot ~100.000 AU). Geldt als de herkomst van langperiodieke kometen.' },
      { term: 'Lagrangepunt', def: 'Eén van vijf punten (L1–L5) in een twee-lichamen-systeem waar een klein object stabiel kan meebewegen. L2 is de positie van de JWST-telescoop.' },
    ],
  },
  sterren: {
    featuredConcept: 'Kernfusie',
    beg: 'In het hart van de zon smelten waterstofatomen samen tot helium. Dit heet kernfusie en levert enorm veel energie op — het is waarom de zon straalt. Elke seconde zet de zon 600 miljoen ton waterstof om. De zon doet dit al 4,6 miljard jaar en heeft nog minstens evenveel brandstof over.',
    ama: 'In sterren zoals de zon verloopt fusie via de proton-protonketen (pp-keten): 4 ¹H → ⁴He + 2e⁺ + 2νe + 26,7 MeV. In zwaardere sterren (> 1,3 M☉) domineert de efficiëntere CNO-cyclus (T-gevoeligheid ∝ T²⁰). De kern heeft T ≈ 15 miljoen K en P ≈ 250 miljard atm. De zon produceert 3,8 × 10²⁶ W aan stralingsvermogen.',
    pro: 'De pp-I keten levert ~85% van de zonneenergie. Neutrino-experimenten (Super-Kamiokande, SNO) bevestigen het standaard zonnemodel en losten het zonnige-neutrino-probleem op via neutrino-oscillatie. Na de hoofdreeks: heliumfusie via de triple-alpha-reactie (3 ⁴He → ¹²C) bij ~10⁸ K. Massieve sterren (>8 M☉) doorlopen snel Si-fusie tot een ijzerkern die implodeert als supernova type II.',
    keyFacts: [
      'Zon: oppervlaktetemperatuur ~5.778 K, kerntemperatuur ~15 miljoen K',
      'HR-diagram: hoofdreeks, reuzen, witten dwergen',
      'Ster met zon-massa leeft ±10 miljard jaar',
      'Neutronensterren: diameter ~20 km, dichtheid > 10¹⁷ kg/m³',
    ],
    sources: [
      { label: 'Wikipedia — Kernfusie', url: 'https://nl.wikipedia.org/wiki/Kernfusie' },
      { label: 'Wikipedia — Hertzsprung-Russell-diagram', url: 'https://nl.wikipedia.org/wiki/Hertzsprung-Russelldiagram' },
      { label: 'NASA — Life Cycle of a Star', url: 'https://science.nasa.gov/universe/stars/' },
    ],
    glossary: [
      { term: 'Kernfusie', def: 'Het samenvoegen van lichte atoomkernen tot een zwaardere kern, waarbij enorme energie vrijkomt (E = Δmc²). De energiebron van alle sterren.' },
      { term: 'Hoofdreeks', def: 'De stabiele fase in het sterleven waarbij waterstof wordt gefuseerd tot helium. De zon bevindt zich al 4,6 miljard jaar op de hoofdreeks.' },
      { term: 'HR-diagram', def: 'Hertzsprung-Russell-diagram: een grafiek die sterren indeelt op oppervlaktetemperatuur (x-as) en lichtkracht (y-as). Onthult evolutiestadia.' },
      { term: 'Supernova', def: 'Een catastrofale sterexplosie aan het einde van het leven van een massieve ster (>8 M☉). Verspreidt zware elementen door de interstellaire ruimte.' },
      { term: 'Neutronenster', def: 'Het compacte overblijfsel na een supernova: een bol van ~20 km doorsnede, vrijwel volledig uit neutronen opgebouwd, met dichtheid > 10¹⁷ kg/m³.' },
      { term: 'Witte dwerg', def: 'Het eindstadium van een ster als de zon: een aardsgrote, hete kern van koolstof en zuurstof die langzaam afkoelt. Geen actieve fusie meer.' },
      { term: 'Eventhorizon', def: 'De grens rond een zwart gat waarbinnen de ontsnappingssnelheid groter is dan de lichtsnelheid. Wat ervoorbij gaat, is voorgoed onbereikbaar.' },
    ],
  },
  sterrenstelsels: {
    featuredConcept: 'Donkere materie',
    beg: 'Sterrenstelsels draaien op een vreemde manier. De buitenste sterren bewegen net zo snel als de binnenste — terwijl je zou verwachten dat ze langzamer gaan. Er moet dus onzichtbare materie zijn die extra zwaartekracht uitoefent. We noemen dit donkere materie. Het maakt ~27% van het heelal uit, maar straalt geen licht uit.',
    ama: 'Vera Rubin ontdekte in de jaren 70 vlakke rotatiesnelheidscurven in spiraalgalaxieën. Zonder donkere materie zou v(r) ∝ 1/√r buiten de schijf. Geobserveerd: v(r) ≈ constant tot grote r. Galactische halo\'s bevatten M_DM ≈ 5–10 × M_visueel. Kandidaten: WIMPs, axionen, steriele neutrino\'s. Gravitationele lensing bevestigt donkere materie onafhankelijk van rotatiesnelheden.',
    pro: 'Het NFW-haloprofiel ρ(r) = ρs / [(r/rs)(1+r/rs)²] past bij ΛCDM N-body-simulaties (Navarro, Frenk & White 1997). De Bullet Cluster (1E 0657-558) toont na galactische botsing scheiding van röntgengas (baryonen) en gravitationele massa (DM via lensing), wat MOND weerlegt. Directe detectie-experimenten LUX-ZEPLIN en XENONnT hebben WIMPs nog niet gevonden (σ_SI < 10⁻⁴⁷ cm²).',
    keyFacts: [
      'Donkere materie: ~27% van de energie-inhoud van het heelal',
      'Melkweg: ±200–400 miljard sterren, diameter ~105.000 lj',
      'Dichtstbijzijnde sterrenstelsel: Canis Major Dwarf (~25.000 lj)',
      'Andromedastelsel botst in ±4,5 miljard jaar met de Melkweg',
    ],
    sources: [
      { label: 'Wikipedia — Donkere materie', url: 'https://nl.wikipedia.org/wiki/Donkere_materie' },
      { label: 'Wikipedia — Melkwegstelsel', url: 'https://nl.wikipedia.org/wiki/Melkwegstelsel' },
      { label: 'NASA — Dark Matter', url: 'https://science.nasa.gov/universe/dark-matter-dark-energy/' },
    ],
    glossary: [
      { term: 'Sterrenstelsel', def: 'Een enorm systeem van sterren, gas, stof en donkere materie gebonden door zwaartekracht. De Melkweg telt 200–400 miljard sterren.' },
      { term: 'Donkere materie', def: 'Onzichtbare materie die geen licht uitzendt of absorbeert, maar wel zwaartekracht uitoefent. Goed voor ~27% van de energie-inhoud van het heelal.' },
      { term: 'Rotatiesnelheidscurve', def: 'Een grafiek van de baansnelheid van sterren als functie van de afstand tot het centrum van een sterrenstelsel. Vlakke curven wijzen op donkere materie.' },
      { term: 'Gravitationele lensing', def: 'Het buigen van lichtstralen door een zware massa, conform Einsteins Algemene Relativiteitstheorie. Maakt onzichtbare massa zichtbaar.' },
      { term: 'Spiraalstelsel', def: 'Een type sterrenstelsel met een centrale bult en uitgestrekte spiraalvormige armen van sterren en gas. De Melkweg en Andromeda zijn spiraalstelsels.' },
      { term: 'Galactische kern', def: 'Het dichtst bevolkte, helderste centrale gebied van een sterrenstelsel. Bevat vaak een supermassief zwart gat (bij de Melkweg: Sgr A*, 4 miljoen M☉).' },
      { term: 'WIMP', def: 'Weakly Interacting Massive Particle — een hypothetische donkere-materiedeeltje dat alleen via zwaartekracht en de zwakke kernkracht wisselwerkt.' },
    ],
  },
  kosmologie: {
    featuredConcept: 'Oerknal & uitdijend heelal',
    beg: 'Het heelal begon 13,8 miljard jaar geleden vanuit een ongelooflijk hete, dichte toestand — de oerknal. Sindsdien dijt het uit. Verre sterrenstelsels bewegen van ons weg; hoe verder, hoe sneller. We zien dit aan roodverschuiving: licht van die stelsels verschuift naar rood, net als het geluid van een ambulance die wegrijdt.',
    ama: 'Hubble (1929) toonde v = H₀·d aan, met H₀ ≈ 67–73 km/s/Mpc. De kosmische achtergrondstraling (CMB) op T = 2,725 K is reststraling van 380.000 jaar na de oerknal. Big Bang Nucleosynthese (BBN) voorspelt een H:He-massaverhouding van ≈3:1, wat overeenkomt met geobserveerde vroeg-heelal-abundanties. Het heelal is ±vlak: Ω_tot ≈ 1.',
    pro: 'Het ΛCDM-model heeft zes vrije parameters (H₀, Ω_b, Ω_c, τ, n_s, A_s). Planck 2018 CMB-meting: H₀ = 67,4 ± 0,5 km/s/Mpc. De Hubble-spanning (>5σ verschil met lokale H₀ = 73 ± 1 km/s/Mpc via Cepheïden/Type Ia SN) suggereert mogelijke nieuwe fysica. Inflatie (exponentiële uitdijing t < 10⁻³² s) verklaart vlakheid, horizonprobleem en primordiale rimpels die CMB-anisotropieën zaaien.',
    keyFacts: [
      'Leeftijd heelal: 13,787 ± 0,020 miljard jaar (Planck 2018)',
      'Zichtbaar universum: diameter ~93 miljard lichtjaar',
      'Donkere energie: ~68%, donkere materie: ~27%, gewone materie: ~5%',
      'CMB-temperatuur: 2,7255 K (roodverschuiving z ≈ 1100)',
    ],
    sources: [
      { label: 'Wikipedia — Oerknal', url: 'https://nl.wikipedia.org/wiki/Oerknal' },
      { label: 'ESA — Planck Mission', url: 'https://www.esa.int/Science_Exploration/Space_Science/Planck' },
      { label: 'NASA — Big Bang', url: 'https://science.nasa.gov/universe/overview/' },
    ],
    glossary: [
      { term: 'Oerknal', def: 'De theorie dat het heelal ±13,8 miljard jaar geleden begon vanuit een extreem hete, dichte toestand en sindsdien uitdijt en afkoelt.' },
      { term: 'Roodverschuiving', def: 'De verschuiving van lichtgolven naar langere (roodere) golflengten doordat de bron van ons wegbeweegt of het heelal uitdijt. Symbool: z.' },
      { term: 'CMB', def: 'Kosmische Achtergrondstraling (Cosmic Microwave Background) — reststraling van 380.000 jaar na de oerknal, nu zichtbaar als microgolven op T = 2,7 K.' },
      { term: 'Donkere energie', def: 'Een onbekende vorm van energie die de uitdijing van het heelal versnelt. Goed voor ~68% van de totale energie-inhoud. Symbool: Λ (kosmologische constante).' },
      { term: 'Inflatie', def: 'Een fase van extreem snelle, exponentiële uitdijing in het eerste 10⁻³² seconde na de oerknal. Verklaart de vlakheid en uniformiteit van het heelal.' },
      { term: 'Hubble-constante (H₀)', def: 'De huidige uitdijingssnelheid van het heelal per afstandseenheid, uitgedrukt in km/s/Mpc. Actuele waarde: ~67–73 km/s/Mpc (Hubble-spanning).' },
      { term: 'ΛCDM', def: 'Het standaardmodel van de kosmologie: Lambda (donkere energie) + Cold Dark Matter. Beschrijft de structuur en evolutie van het heelal met hoge nauwkeurigheid.' },
    ],
  },
  exoplaneten: {
    featuredConcept: 'Detectiemethoden',
    beg: 'Exoplaneten zijn planeten om andere sterren. Ze zijn te ver weg om direct te zien, maar we detecteren ze indirect. De meest gebruikte methode: transitmethode. Als een planeet voor zijn ster passeert, wordt de ster ietsje donkerder. De NASA-telescoop Kepler vond zo 2.600+ planeten. TESS gaat verder met deze zoektocht.',
    ama: 'Twee hoofdmethoden: (1) Transitmethode: ΔF/F = (R_p/R_*)² voor centrale transit. (2) Radiale snelheidsmethode: sterrewobble K = (2πG/P)^(1/3) × M_p sin(i) / (M_* + M_p)^(2/3) × 1/√(1−e²). Gecombineerd geeft men bulkdichtheid ρ_p. Andere methoden: directe imaging (HR 8799), microlensing (OGLE, Roman), astrometrie (Gaia DR3 bevat ±10.000 kandidaten).',
    pro: 'Transmissiespectroscopie: ΔF(λ)/F = 2R_p H(λ) / R_*², waarbij H = kT_eq/μg de atmosferische schaallengte is. JWST heeft CO₂ (WASP-39b, 2022), SO₂, H₂O en C₂H₂ gedetecteerd. K2-18b-data (2023) suggereren dimethylsulfide (DMS, potentieel biosignatuur), onder voorbehoud. Het Earth Similarity Index (ESI) en habitability-modellen combineren T_eq, M_p, ρ_p en atmosferische retention via Jeans-parameter.',
    keyFacts: [
      '5.800+ bevestigde exoplaneten (2025, NASA Exoplanet Archive)',
      'Dichtstbijzijnde: Proxima Centauri b (~4,2 lichtjaar)',
      'Kepler-detecteerde dat ±20% van sterren een Aarde-achtige planeet heeft',
      'Bewoonbare zone: gebied waar vloeibaar water op oppervlak mogelijk is',
    ],
    sources: [
      { label: 'NASA Exoplanet Archive', url: 'https://exoplanetarchive.ipac.caltech.edu/' },
      { label: 'Wikipedia — Exoplaneet', url: 'https://nl.wikipedia.org/wiki/Exoplaneet' },
      { label: 'ESA — Exoplanets', url: 'https://www.esa.int/Science_Exploration/Space_Science/Exoplanets' },
    ],
    glossary: [
      { term: 'Exoplaneet', def: 'Een planeet die om een andere ster dan onze zon draait. Meer dan 5.800 exoplaneten zijn bevestigd (2025); miljarden worden geschat in de Melkweg.' },
      { term: 'Transitmethode', def: 'Detectiemethode waarbij een planeet zijn ster gedeeltelijk verduistert. De helderheid daalt met (R_planeet/R_ster)². Kepler en TESS gebruiken deze methode.' },
      { term: 'Radiale snelheidsmethode', def: 'Detectiemethode waarbij de slingerbewegingen van een ster door een planeet worden gemeten via dopplerverschuiving van spectraallijnen.' },
      { term: 'Bewoonbare zone', def: 'Het gebied rond een ster waar de temperatuur vloeibaar water op een planeetoppervlak toelaat. Ook wel "Goudlokje-zone" genoemd.' },
      { term: 'Biosignatuur', def: 'Een chemisch of fysisch signaal in een atmosfeer of oppervlak dat op de aanwezigheid van leven kan wijzen, zoals zuurstof, methaan of dimethylsulfide.' },
      { term: 'Transmissiespectroscopie', def: 'Het analyseren van sterrenlicht dat door de atmosfeer van een exoplaneet filtert bij een transit. Onthult de chemische samenstelling van de atmosfeer.' },
      { term: 'Super-Aarde', def: 'Een exoplaneet met een massa groter dan de Aarde (1–10 M⊕) maar kleiner dan Neptunus. Kunnen rotsachtig of gasachtig zijn.' },
    ],
  },
  ruimtevaart: {
    featuredConcept: 'Orbitale mechanica',
    beg: 'Een raket in een baan om de Aarde valt eigenlijk constant — maar gaat zo snel zijwaarts dat de Aarde onder hem wegbogt. De ISS cirkelt op 400 km hoogte met 27.600 km/u. Om van baan te wisselen brandt je de motor even bij — zelfs om lager te gaan moet je afremmen. Dit voelt contra-intuïtief maar is pure fysica.',
    ama: 'Tsiolkovsky\'s raketformule: Δv = v_e × ln(m₀/m_f). Eerste kosmische snelheid (LEO): v_c = √(GM/r) ≈ 7,9 km/s. Ontsnappingssnelheid: v_esc = √(2)·v_c ≈ 11,2 km/s. De Hohmann-transferbaan gebruikt twee motorbranden en is de meest energiezuinige overgang tussen twee cirkelbanen (Δv_totaal minimaal). Vis-viva: v² = GM(2/r − 1/a).',
    pro: 'Gravitational assist: in het planetaire referentiestelsel is |v_∞| behouden; in het heliocentrische stelsel wint de sonde impuls (Voyager-missies). Low-thrust trajectories (ionaandrijving, Isp > 3.000 s) volgen spiraalvormige banen; Edelbaum-approximatie geeft Δv ≈ π/2 |v₁ − v₂| voor inclination changes. Station-keeping via J2-perturbaties (aardoblateness) vereist periodieke correcties. Tidal locking, Hill sphere en Lagrange L2 zijn sleutels voor moderne missieontwerp (bijv. JWST op L2).',
    keyFacts: [
      'ISS hoogte: ~400 km, omlooptijd: ~92 minuten',
      'Maanvlucht Apollo 11: 3 dagen, 3 uur, 49 minuten',
      'Mars: minimale afstand ~55 miljoen km, reistijd ±6–9 maanden',
      'SpaceX Falcon 9: eerste herbruikbare orbital-class raket (2015)',
    ],
    sources: [
      { label: 'NASA — Space Mission Design', url: 'https://www.nasa.gov/missions/' },
      { label: 'Wikipedia — Orbitale mechanica', url: 'https://nl.wikipedia.org/wiki/Baanmechanica' },
      { label: 'ESA — How to get to space', url: 'https://www.esa.int/Enabling_Support/Space_Transportation' },
    ],
    glossary: [
      { term: 'Orbitale mechanica', def: 'De wetenschap van de beweging van objecten in de ruimte onder invloed van zwaartekracht. Gebaseerd op Newtons wetten en Keplers baanwetten.' },
      { term: 'Δv (delta-v)', def: 'De totale verandering in snelheid die nodig is voor een ruimtemanoeuvre. Bepaalt de benodigde brandstofmassa via de raketformule van Tsiolkovsky.' },
      { term: 'LEO', def: 'Low Earth Orbit — een baan om de Aarde op 200–2.000 km hoogte. De ISS bevindt zich op ~400 km. Vereist een snelheid van ~7,9 km/s.' },
      { term: 'Hohmann-transferbaan', def: 'De meest brandstofzuinige baan tussen twee cirkelvormige banen: een ellips die de twee banen raakt. Gebruikt twee korte motorbranden.' },
      { term: 'Ontsnappingssnelheid', def: 'De minimale snelheid om de zwaartekracht van een hemellichaam te ontsnappen zonder verdere aandrijving. Voor de Aarde: ~11,2 km/s.' },
      { term: 'Gravitational assist', def: 'Een vluchtmanoeuvre waarbij de zwaartekracht van een planeet wordt gebruikt om een sonde te versnellen of van richting te veranderen zonder brandstof.' },
      { term: 'Specifieke impuls (Isp)', def: 'Een maat voor de efficiëntie van een raketmotor: de stuwkracht per gewichtseenheid brandstof per seconde. Hogere Isp = zuiniger motor.' },
    ],
  },
}

export const TOPICS = [
  {
    id: 'zonnestelsel', icon: '☀️', title: 'Zonnestelsel',
    color: '#ffa040', bg: 'linear-gradient(135deg,#120a00,#201400)',
    desc: 'Van Mercurius tot de Oort-wolk. Leer de planeten, manen en kleine lichamen kennen.',
    concepts: ['Planetaire beweging', 'Planetaire atmosferen', 'Ringen en manen', 'Dwergplaneten', 'Kometen & asteroïden'],
  },
  {
    id: 'sterren', icon: '⭐', title: 'Sterren & Leven',
    color: '#d4a84b', bg: 'linear-gradient(135deg,#120e00,#1e1600)',
    desc: 'Hoe sterren worden geboren, leven en sterven — en wat ze achterlaten.',
    concepts: ['Hoofdreeks & HR-diagram', 'Kernfusie', 'Supernovae', 'Neutronensterren', 'Zwarte gaten'],
  },
  {
    id: 'sterrenstelsels', icon: '🌌', title: 'Sterrenstelsels',
    color: '#c080ff', bg: 'linear-gradient(135deg,#0e0518,#14082a)',
    desc: 'Melkwegstelsels, bolvormige sterrenhopen en de grootschalige structuur van het heelal.',
    concepts: ['Melkweg structuur', 'Galactische kernen', 'Stelseltypes', 'Botsende stelsels', 'Donkere materie'],
  },
  {
    id: 'kosmologie', icon: '🔭', title: 'Kosmologie',
    color: '#378ADD', bg: 'linear-gradient(135deg,#040a14,#081224)',
    desc: 'De oerknal, uitdijend heelal, donkere energie en het lot van alles.',
    concepts: ['Oerknal theorie', 'Kosmische achtergrondstraling', 'Donkere energie', 'Inflatie', 'Multiversum'],
  },
  {
    id: 'exoplaneten', icon: '🪐', title: 'Exoplaneten',
    color: '#3ddf90', bg: 'linear-gradient(135deg,#041208,#081e10)',
    desc: 'Planeten om andere sterren — en de zoektocht naar buitenaards leven.',
    concepts: ['Detectiemethoden', 'Bewoonbare zone', 'Atmosfeer­analyse', 'Super-Aardes', 'Biosignaturen'],
  },
  {
    id: 'ruimtevaart', icon: '🚀', title: 'Ruimtevaart',
    color: '#3dcfdf', bg: 'linear-gradient(135deg,#041214,#08201e)',
    desc: 'Raketten, ruimtestations, en de ambitieuze missies naar de Maan en Mars.',
    concepts: ['Orbitale mechanica', 'Voortstuwing', 'Leven in de ruimte', 'Maanprogramma\'s', 'Mars kolonisatie'],
  },
]

export const CONCEPTS = [
  { slug: 'neutronenster-uitgelegd',   icon: '💫', title: 'Neutronenster',    category: 'Sterren',        color: '#d4a84b', desc: 'De extreem compacte overblijfselen van massieve sterren.' },
  { slug: 'desi-donkere-energie',       icon: '🌑', title: 'Donkere Energie',  category: 'Kosmologie',     color: '#c080ff', desc: 'De mysterieuze kracht achter de versnelde uitdijing van het heelal.' },
  { slug: 'james-webb-k2-18b-biosignatuur', icon: '🌍', title: 'Exoplaneten',     category: 'Exoplaneten',    color: '#3ddf90', desc: 'Planeten buiten ons zonnestelsel en de zoektocht naar leven.' },
  { slug: 'starship-mechazilla',        icon: '🚀', title: 'Orbitale Mechanica', category: 'Ruimtevaart',  color: '#3dcfdf', desc: 'Hoe raketten de juiste baan bereiken en terugkeren naar Aarde.' },
]

export const FAQS = [
  { q: 'Moet ik een telescoop hebben om te leren?',   a: 'Nee! Veel van de astronomie-concepten zijn puur theoretisch. Voor sterrenkijken helpt een verrekijker al enorm — maar kennis vereist geen instrument.' },
  { q: 'Wat is het verschil tussen de niveaus?',      a: 'Beginner gebruikt alledaagse taal en vergelijkingen. Amateur voegt getallen en terminologie toe. Pro is wetenschappelijk niveau met formules.' },
  { q: 'Kan ik van niveau wisselen in artikelen?',    a: 'Ja — elke artikel pagina heeft een Beginner / Amateur / Pro knop. Onze AI herschrijft het artikel direct voor jouw niveau.' },
  { q: 'Zijn er Nederlandse bronnen voor meer info?', a: 'Wij zijn het grootste Nederlandse astronomie-platform. Daarnaast zijn NOVA Astronomie en Sterrewacht Leiden uitstekende bronnen.' },
]

export const TOPIC_TAGS: Record<string, string[]> = {
  zonnestelsel:    ['zonnestelsel', 'maan', 'mars', 'venus', 'jupiter', 'planeet'],
  sterren:         ['ster', 'supernova', 'neutron', 'zwart gat', 'black hole'],
  sterrenstelsels: ['sterrenstelsel', 'melkweg', 'galaxy', 'quasar'],
  kosmologie:      ['kosmologie', 'oerknal', 'donkere', 'heelal', 'cosmology'],
  exoplaneten:     ['exoplaneet', 'exoplanet', 'biosignaat', 'bewoonbaar'],
  ruimtevaart:     ['lancering', 'raket', 'nasa', 'esa', 'astronaut', 'missie'],
}
