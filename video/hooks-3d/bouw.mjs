// Bouwt het conceptplan (fase 2) uit de scènes en de teksten hieronder: concepten.yaml (reel-uitleg, NG-930x).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire("/home/user/nightgazer-social/package.json");
const YAML = require("yaml");
const dir = new URL(".", import.meta.url).pathname;
const kit2 = readFileSync(dir + "scenes/_kit2.js", "utf8");
const scene = (naam, v) => kit2 + "\n" + readFileSync(dir + `scenes/${naam}.js`, "utf8").replace("__VAR__", v);
const l = (tekst, spreek) => ({ tekst, spreek: spreek ?? tekst.replace(/\*/g, "") });

const NASA_VOY = "https://science.nasa.gov/solar-system/skywatching/night-sky-network/novembers-night-sky-notes-light-day-away/";
const voyager = (v) => ({
  onderwerp: "Voyager 1, een lichtdag",
  lijnen: [
    v === "A" ? l("Woensdag is Voyager 1 een hele lichtdag ver.") : l("Een bericht naar Voyager 1 is straks een dag onderweg."),
    v === "A" ? l("Stuur je hem nu een bericht,") : l("Het vertrekt met de snelheid van het licht."),
    l("het schiet de planeten voorbij,"),
    l("schuin omhoog, uit hun vlak."),
    l("Daar vliegt Voyager 1, al sinds *1977*.", "Daar vliegt Voyager 1, al sinds negentienzevenenzeventig."),
    l("Nu al meer dan *25,80 miljard km* ver.", "Nu al meer dan vijfentwintig komma tachtig miljard kilometer ver."),
    l("Op *18 november* is licht een hele dag onderweg.", "Op achttien november is licht een hele dag onderweg."),
    l("Zo lang reist jouw bericht."),
    l("Naar een plaat met groeten in *55 talen*.", "Naar een plaat met groeten in vijfenvijftig talen."),
    v === "A" ? l("Woensdag: een hele lichtdag ver.") : l("Een dag onderweg, van hier naar daar."),
  ],
  script: [
    { beeld: v === "A" ? "Voyager 1 groot in beeld, een lichtspoor terug naar een stipje aarde" : "Nederland bij nacht vanuit de ruimte; een puls vertrekt", camera: "dichtbij, licht inzoomen" },
    { beeld: "De puls schiet weg over de banen van de planeten en buigt omhoog uit het vlak", camera: "log-zoom mee met de puls, hoog boven het zonnestelsel" },
    { beeld: "De sonde met de schotel naar huis; de afstand telt op", camera: "naar de sonde, eromheen" },
    { beeld: "18 november: een hele lichtdag; de puls komt aan", camera: "achteruit, dan dichtbij" },
    { beeld: "De gouden plaat glinstert; terug naar het beeld van het begin", camera: "langs de plaat, terug naar frame 0" },
  ],
  labels: {
    haak1: v === "A" ? "Woensdag: Voyager 1" : "Een bericht naar Voyager 1", haak2: v === "A" ? "een hele lichtdag ver" : "is straks een dag onderweg",
    afstand: "25,80 MILJARD KM", jaar: "1977", datum: "18 NOVEMBER", lichtdag: "een hele lichtdag", talen: "55 TALEN",
    voyager: "Voyager 1", bericht: "Jouw bericht",
  },
  feiten: [
    { waarde: "25,80 miljard km", citaat: "At the time of this article, the Canberra antenna tracked Voyager 1 at 25.80 billion km, or just over 16 billion miles.", bron: NASA_VOY },
    { waarde: "25,80 MILJARD KM", citaat: "At the time of this article, the Canberra antenna tracked Voyager 1 at 25.80 billion km, or just over 16 billion miles.", bron: NASA_VOY },
    { waarde: "1977", citaat: "Launched in 1977 to fly by Jupiter and Saturn, Voyager 1 crossed into interstellar space in August 2012 and continues to collect data.", bron: "https://science.nasa.gov/mission/voyager/voyager-1/" },
    { waarde: "18 november", citaat: "On November 18, 2026, 49 years after its launch, Voyager 1 will cross the one-light-day mark, 16.1 billion miles from the Sun.", bron: NASA_VOY },
    { waarde: "18 NOVEMBER", citaat: "On November 18, 2026, 49 years after its launch, Voyager 1 will cross the one-light-day mark, 16.1 billion miles from the Sun.", bron: NASA_VOY },
    { waarde: "55 talen", citaat: "each craft carries the Golden Record, a 12-inch phonograph record with spoken greetings in 55 languages, 27 musical tracks, 116 images, and other sounds from Earth.", bron: NASA_VOY },
    { waarde: "55 TALEN", citaat: "each craft carries the Golden Record, a 12-inch phonograph record with spoken greetings in 55 languages, 27 musical tracks, 116 images, and other sounds from Earth.", bron: NASA_VOY },
  ],
  namen: ["Voyager 1"],
  oproep: "Meer uitleg: link in bio",
  muziek: { prompt: "warm cinematic ambient electronic score, slow lyrical piano over soft synth strings in D major, intimate start, steady gentle pulse, opens into a wide hopeful swell, no vocals, light bass, no low strings, clean mid-forward mix, 90 bpm" },
  scene: scene("voyager", v),
});

const APOD = "https://science.nasa.gov/image-article/apod-29-october-2026-the-horns-of-venus/";
const venus = (v) => ({
  onderwerp: "De hoorns van Venus",
  lijnen: [
    v === "A" ? l("Dit is geen maan.") : l("Vrijdagochtend zie je Venus laag in het zuidoosten."),
    v === "A" ? l("Het is Venus, eind oktober.") : l("Maar eind oktober deed ze iets vreemds."),
    l("Ze stond bijna tussen de zon en ons."),
    l("Dan zie je vooral haar nachtkant."),
    l("Maar haar dikke lucht buigt het zonlicht."),
    l("Zo groeit de sikkel voorbij *180 graden*.", "Zo groeit de sikkel voorbij honderdtachtig graden."),
    l("Nu staat ze 's ochtends laag in het zuidoosten."),
    l("Een verrekijker toont de sikkel."),
    v === "A" ? l("Geen maan. Venus.") : l("Vrijdagochtend, laag in het zuidoosten."),
  ],
  script: [
    { beeld: v === "A" ? "Een gloeiende, bijna gesloten boog in het donker" : "De ochtendhorizon boven Nederland; een fel punt laag in het zuidoosten", camera: "dichtbij, licht inzoomen" },
    { beeld: "Zon, Venus en aarde op een lijn, van opzij", camera: "achteruit tot alle drie in beeld zijn" },
    { beeld: "Stralen buigen om de rand; de boog groeit voorbij 180 graden", camera: "langs de rand" },
    { beeld: "Terug naar de horizon boven NL; zuidoost", camera: "log-zoom naar de aarde" },
    { beeld: "Terug naar het beeld van het begin", camera: "zoals frame 0" },
  ],
  labels: {
    ...(v === "B" ? { haak1: "Vrijdagochtend: Venus", haak2: "laag in het zuidoosten" } : {}),
    zon: "Zon", venus: "Venus", aarde: "Aarde", graden: "180 GRADEN", zuidoost: "Zuidoost",
  },
  feiten: [
    { waarde: "180 graden", citaat: "creating a glowing crescent arc that extends beyond 180 degrees", bron: APOD },
    { waarde: "180 GRADEN", citaat: "creating a glowing crescent arc that extends beyond 180 degrees", bron: APOD },
  ],
  oproep: "Vannacht kijken: link in bio",
  muziek: { prompt: "delicate harp and soft glass bells over warm airy synth pads in F major, curious and luminous, steady flowing arpeggios, a bright shimmering lift in the middle, gentle dawn-like ending, no vocals, light bass, no low strings, clean mix, 96 bpm" },
  scene: scene("venus", v),
});

const LEO = "https://www.nasa.gov/humans-in-space/leo-economy-frequently-asked-questions/";
const radar = (v) => ({
  onderwerp: "Radarsatelliet",
  lijnen: [
    v === "A" ? l("Deze satelliet kijkt dwars door wolken heen.") : l("Deze week: een satelliet die door wolken kijkt."),
    v === "A" ? l("Deze week brengt een Electron hem omhoog.") : l("Een Electron brengt hem omhoog."),
    l("Naar een lage baan rond de aarde."),
    l("Daar vouwt hij zijn antenne uit."),
    l("Hij stuurt pulsen naar de grond,"),
    l("en vangt de echo op."),
    l("Wolken houden die pulsen niet tegen."),
    l("Zo groeit er regel voor regel een beeld."),
    l("Dag en nacht."),
    v === "A" ? l("Dwars door de wolken.") : l("Gepland, dus het kan nog verschuiven."),
  ],
  script: [
    { beeld: v === "A" ? "De satelliet boven een wolkenzee bij nacht; een puls gaat al omlaag" : "Een slanke raket breekt door het wolkendek", camera: "dichtbij, licht uitzoomen" },
    { beeld: "De raket klimt naar een lage baan", camera: "mee omhoog" },
    { beeld: "De antenne vouwt uit; pulsen omlaag, echo omhoog", camera: "naast de satelliet, dan eronder" },
    { beeld: "Door een gat in de wolken: het radarbeeld groeit regel voor regel", camera: "omlaag door de wolken" },
    { beeld: "Terug boven de wolken, zoals het begin", camera: "omhoog naar frame 0" },
  ],
  labels: {
    haak1: v === "A" ? "Deze satelliet kijkt" : "Deze week: een satelliet", haak2: v === "A" ? "dwars door wolken heen" : "die door wolken kijkt",
    raket: "Electron", satelliet: "Radarsatelliet", puls: "Radarpuls", echo: "Echo", baan: "Lage baan: 2.000 km of lager",
  },
  feiten: [{ waarde: "2.000 km", citaat: "Low Earth orbit encompasses Earth-centered orbits with an altitude of 1,200 miles (2,000 km) or less.", bron: LEO }],
  oproep: "Volg de lancering: link in bio",
  muziek: { prompt: "soft sonar-like high pings and airy synth pads in G major, calm and curious, rhythmic echoing plucks, steady pulse, a bright lift in the middle, no vocals, no drums, light bass, no low strings, clean mix, 100 bpm" },
  scene: scene("radar", v),
});

const post = (id, titel, pijler, data, caption, tags, bronnen) => ({
  id, titel, pijler, template: "reel-uitleg", status: "idee", moment: "2026-11-12T17:30:00+01:00", platforms: ["instagram"],
  data: { voorbeeld: true, ...data }, instagram: { type: "reel", caption }, hashtags: tags, bronnen,
});
const bronVoy = [{ naam: "NASA, November's Night Sky Notes: Light-Day Away", url: NASA_VOY, licentie: "NASA (publiek domein)", credit: "NASA" }, { naam: "NASA, Voyager 1", url: "https://science.nasa.gov/mission/voyager/voyager-1/", licentie: "NASA (publiek domein)", credit: "NASA" }];
const bronVen = [{ naam: "NASA, APOD 29 October 2026: The Horns of Venus", url: APOD, licentie: "NASA (publiek domein)", credit: "NASA" }];
const bronRad = [{ naam: "NASA, Commercial Space FAQ", url: LEO, licentie: "NASA (publiek domein)", credit: "NASA" }];
const capVoy = "Op 18 november staat Voyager 1 een hele lichtdag van de zon. Een bericht dat je nu stuurt, is ongeveer een dag onderweg.\n\nMeer uitleg op nightgazer.space (link in bio)\nMeer uitleg: link in bio\n\nBron: NASA. 3D-animatie van NightGazer op NASA-gegevens; aarde: NASA Earth Observatory (Black Marble).";
const capVen = "Venus heeft soms hoorns. Eind oktober stond ze bijna tussen de zon en de aarde, en haar dikke atmosfeer boog het zonlicht tot een boog van meer dan 180 graden.\n\nVannacht kijken: link in bio\nMeer op nightgazer.space/sterrenkijken\n\nBron: NASA (APOD). 3D-animatie van NightGazer; aarde: NASA Earth Observatory (Black Marble).";
const capRad = "Deze week brengt een Electron een radarsatelliet omhoog. Hij stuurt pulsen naar de aarde en vangt de echo op, dag en nacht, ook door wolken. Een geplande tijd kan nog verschuiven.\n\nVolg de lancering: link in bio\nMeer op nightgazer.space/missies\n\nBron: NASA, Launch Library 2. 3D-animatie van NightGazer.";
const posts = [
  post("NG-9301", "Snap het, Voyager 1 een lichtdag (haak A: tijd)", "snap-het", voyager("A"), capVoy, ["#nightgazer", "#voyager1", "#nasa"], bronVoy),
  post("NG-9302", "Snap het, Voyager 1 een lichtdag (haak B: jij)", "snap-het", voyager("B"), capVoy, ["#nightgazer", "#voyager1", "#nasa"], bronVoy),
  post("NG-9303", "Vannacht, de hoorns van Venus (haak A: onmogelijk beeld)", "vannacht", venus("A"), capVen, ["#nightgazer", "#venus", "#sterrenkijken"], bronVen),
  post("NG-9304", "Vannacht, de hoorns van Venus (haak B: tijd en plek)", "vannacht", venus("B"), capVen, ["#nightgazer", "#venus", "#sterrenkijken"], bronVen),
  post("NG-9305", "Lancering, een radarsatelliet (haak A: tegen-intuïtief)", "lancering", radar("A"), capRad, ["#nightgazer", "#rocketlab", "#lancering"], bronRad),
  post("NG-9306", "Lancering, een radarsatelliet (haak B: tijd)", "lancering", radar("B"), capRad, ["#nightgazer", "#rocketlab", "#lancering"], bronRad),
];
const TIJDEN = { "NG-9301": {"lijnen":[[0.35,2.424],[2.724,3.669],[3.769,5.046],[5.146,7.04],[7.34,10.104],[10.404,12.793],[13.093,15.716],[16.016,17.066],[17.366,19.222],[19.522,20.931]],"dur":22.831},
"NG-9302": {"lijnen":[[0.35,2.573],[2.873,4.404],[4.704,5.981],[6.081,7.974],[8.274,11.038],[11.338,13.728],[14.028,16.65],[16.95,18],[18.3,20.156],[20.456,21.662]],"dur":23.562},
"NG-9303": {"lijnen":[[0.35,1.062],[1.362,2.59],[2.89,4.358],[4.658,5.804],[6.104,7.652],[7.952,10.436],[10.736,12.643],[12.943,14.245],[14.545,15.591]],"dur":17.491},
"NG-9304": {"lijnen":[[0.35,2.506],[2.806,4.318],[4.618,6.086],[6.386,7.531],[7.831,9.379],[9.679,12.163],[12.463,14.371],[14.671,15.972],[16.272,18.268]],"dur":20.168},
"NG-9305": {"lijnen":[[0.35,1.94],[2.24,3.944],[4.244,5.574],[5.874,7.141],[7.441,8.691],[8.791,9.901],[10.201,11.569],[11.869,13.866],[14.166,14.753],[15.053,15.724]],"dur":17.624},
"NG-9306": {"lijnen":[[0.35,2.368],[2.668,4.098],[4.398,5.728],[6.028,7.295],[7.595,8.846],[8.946,10.055],[10.355,11.723],[12.023,14.021],[14.321,14.908],[15.208,16.714]],"dur":18.614} };
// Alleen lokaal (schets met de echte stemtijden van de LXC, 09-11): concepten-lokaal.yaml, niet voor de LXC.
const lokaal = posts.map(p => ({ ...p, data: { ...p.data, tijden: TIJDEN[p.id] } }));
writeFileSync(dir + "concepten-lokaal.yaml", YAML.stringify({ week: "2026-W46", posts: lokaal }, { lineWidth: 0 }));
writeFileSync(dir + "concepten.yaml", "# Fase 2: concepten hooks en 3D (niet voor het plan)\n" + YAML.stringify({ week: "2026-W46", posts }, { lineWidth: 0 }));
console.log("ok", posts.length);
