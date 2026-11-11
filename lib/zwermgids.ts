/* De zwermgidsen: /gidsen/leoniden en /gidsen/geminiden.

   Eén pagina per zwerm die mensen op Google zoeken ("Leoniden 2026",
   "Geminiden 2026"), met het antwoord bovenaan: wanneer, hoe laat, hoeveel.

   Bronnen, niets verzonnen:
   - Piek, aantallen per uur in Nederland, beste moment, snelheid en
     moederobject: hemel.waarnemen.com/meteoorzwermen/{Leoniden,Geminiden}_2026.html
     (bijgewerkt 13-09-2026). Tijden daar zijn Nederlandse tijd: hun maan-
     ondergang van 00:06 valt samen met onze eigen berekening.
   - Actieve periode: IMO-kalender 2026 (imo.net/calendar).
   - Zon, maan en de hoogte van de radiant per uur: berekend met
     astronomy-engine voor Utrecht (52,09 N; 5,12 O). Radiant Leoniden
     RA 152°, dec +22°; Geminiden RA 112°, dec +33°.
   Een volgend jaar betekent nieuwe getallen: werk dan dit bestand bij. */

export type Uur = { uur: number; radiant: number }

export type Zwermgids = {
  slug: 'leoniden' | 'geminiden'
  naam: string
  jaar: number
  /** De zin die in Google en bovenaan de pagina staat. */
  kop: string
  lede: string
  /** Korte tekst voor de plaat op /gidsen. */
  kaart: string
  beeld: { nasaId: string; titel: string; credit: string }
  specs: { label: string; waarde: string }[]
  /** De nacht van 18:00 tot 07:00, hoogte van de radiant in graden. */
  nacht: Uur[]
  donker: { van: string; tot: string }
  maan: { onder?: string; op?: string; verlicht: number }
  /** Beste moment op de nachtbalk, als uur met decimalen (6.0 = 06:00). */
  best: { uur: number; tekst: string }
  piekTekst: string
  richting: string
  stappen: { titel: string; tekst: string }[]
  bewolkt: string
  andere: 'leoniden' | 'geminiden'
}

export const ZWERMGIDSEN: Record<Zwermgids['slug'], Zwermgids> = {
  leoniden: {
    slug: 'leoniden',
    naam: 'Leoniden',
    jaar: 2026,
    kop: 'Leoniden 2026: kijk woensdagochtend 18 november rond 6 uur',
    lede:
      'De Leoniden pieken dinsdagavond 17 november rond 21 uur, maar dan staat hun radiant nog onder de horizon. ' +
      'Het beste kijk je in de vroege ochtend van woensdag 18 november, rond 6 uur. Reken onder een donkere hemel op ' +
      '4 tot 10 Leoniden per uur. De maan gaat om 00:06 onder en stoort daarna niet meer.',
    kaart: 'De piek valt op dinsdagavond 17 november. Het meest zie je woensdagochtend rond 6 uur, als de maan al onder is.',
    beeld: {
      nasaId: 'NHQ202108110003',
      titel: 'Een meteoor in een opname van 30 seconden, tijdens de Perseïden van 2021 in West Virginia',
      credit: 'NASA/Bill Ingalls',
    },
    specs: [
      { label: 'Piek',          waarde: 'di 17 nov, ±21:00' },
      { label: 'Beste moment',  waarde: 'wo 18 nov, ±06:00' },
      { label: 'Per uur',       waarde: '4 tot 10' },
      { label: 'Maan onder',    waarde: '00:06' },
      { label: 'Snelheid',      waarde: '71 km/s' },
      { label: 'Actief',        waarde: '6 tot 30 nov' },
    ],
    nacht: [
      { uur: 18, radiant: -14 }, { uur: 19, radiant: -15 }, { uur: 20, radiant: -14 }, { uur: 21, radiant: -11 },
      { uur: 22, radiant: -6 },  { uur: 23, radiant: 1 },   { uur: 24, radiant: 9 },   { uur: 25, radiant: 17 },
      { uur: 26, radiant: 26 },  { uur: 27, radiant: 36 },  { uur: 28, radiant: 44 },  { uur: 29, radiant: 52 },
      { uur: 30, radiant: 58 },  { uur: 31, radiant: 60 },
    ],
    donker: { van: '18:45', tot: '06:05' },
    maan: { onder: '00:06', verlicht: 54 },
    best: { uur: 30, tekst: '06:00 · radiant 57° hoog' },
    piekTekst: 'Piek 21:00',
    richting: 'Het sterrenbeeld Leeuw staat dan hoog in het zuidzuidoosten.',
    stappen: [
      { titel: 'Zet je wekker op half 6', tekst: 'Rond 6 uur staat de Leeuw hoog en is het nog echt donker. Om 06:05 begint de schemering, en om 08:05 komt de zon op.' },
      { titel: 'Zoek het donker op', tekst: 'Weg van straatlantaarns en de gloed van de stad. Een tuin aan de donkere kant van het huis kan al genoeg zijn.' },
      { titel: 'Geef je ogen twintig minuten', tekst: 'Kijk niet op je telefoon, of zet hem op rood licht. Pas na een kwartier tot twintig minuten zie je ook de zwakkere meteoren.' },
      { titel: 'Kijk naast de Leeuw, niet erop', tekst: 'De sporen wijzen terug naar de Leeuw, maar de langste zie je een stuk daarvandaan. Kijk hoog in de lucht, zo’n 40 graden naast de radiant.' },
      { titel: 'Alleen je ogen', tekst: 'Een verrekijker of telescoop helpt niet: je wilt zoveel mogelijk hemel tegelijk zien. Een ligstoel, een deken en iets warms te drinken wel.' },
    ],
    bewolkt:
      'Leoniden zijn snel, zo’n 71 km/s, en laten soms een kort nalichtend spoor achter. Ze komen van komeet 55P/Tempel-Tuttle. ' +
      'Is het bewolkt? Tot vier dagen voor en na de piek vallen er nog Leoniden, alleen minder. En op 13 en 14 december volgen de Geminiden, de rijkste zwerm van het jaar.',
    andere: 'geminiden',
  },

  geminiden: {
    slug: 'geminiden',
    naam: 'Geminiden',
    jaar: 2026,
    kop: 'Geminiden 2026: de beste vallende sterren van het jaar, nacht van 13 op 14 december',
    lede:
      'De Geminiden zijn de rijkste meteorenzwerm van het jaar. In de nacht van zondag 13 op maandag 14 december zie je onder een donkere hemel ' +
      'zo’n 49 tot 65 Geminiden per uur, het meest rond half vijf ’s ochtends. De maan gaat al om 20:38 onder, dus die stoort niet.',
    kaart: 'De rijkste zwerm van het jaar, en dit jaar stoort de maan niet. Het meest zie je rond half vijf ’s ochtends.',
    beeld: {
      nasaId: 'NHQ202508030001',
      titel: 'Een meteoor boven de bomen in een opname van 30 seconden, tijdens de Perseïden van 2025 in West Virginia',
      credit: 'NASA/Bill Ingalls',
    },
    specs: [
      { label: 'Beste nacht',   waarde: 'zo 13 op ma 14 dec' },
      { label: 'Beste moment',  waarde: 'ma 14 dec, ±04:30' },
      { label: 'Per uur',       waarde: '49 tot 65' },
      { label: 'Maan onder',    waarde: '20:38' },
      { label: 'Snelheid',      waarde: '35 km/s' },
      { label: 'Actief',        waarde: '4 tot 17 dec' },
    ],
    nacht: [
      { uur: 18, radiant: 6 },  { uur: 19, radiant: 13 }, { uur: 20, radiant: 20 }, { uur: 21, radiant: 29 },
      { uur: 22, radiant: 38 }, { uur: 23, radiant: 47 }, { uur: 24, radiant: 56 }, { uur: 25, radiant: 64 },
      { uur: 26, radiant: 70 }, { uur: 27, radiant: 70 }, { uur: 28, radiant: 66 }, { uur: 29, radiant: 58 },
      { uur: 30, radiant: 49 }, { uur: 31, radiant: 40 },
    ],
    donker: { van: '18:33', tot: '06:35' },
    maan: { onder: '20:38', verlicht: 20 },
    best: { uur: 28.5, tekst: '04:30 · radiant 62° hoog' },
    piekTekst: 'Piek 11:45, overdag',
    richting: 'De Tweelingen staan dan hoog in het westzuidwesten.',
    stappen: [
      { titel: 'Begin al om 22 uur', tekst: 'Anders dan bij de meeste zwermen staat de radiant al ’s avonds hoog genoeg. Vanaf 22 uur loont het, en hoe later, hoe meer.' },
      { titel: 'Of zet je wekker op 4 uur', tekst: 'Rond half 5 zie je de meeste. Het echte maximum valt pas om 11:45 overdag; je kijkt dan zo’n zeven uur ervoor, maar het blijft de moeite waard.' },
      { titel: 'Zoek het donker op', tekst: 'Weg van straatlantaarns en de gloed van de stad. Hoe donkerder, hoe meer van de zwakkere meteoren je ziet.' },
      { titel: 'Geef je ogen twintig minuten', tekst: 'Kijk niet op je telefoon, of zet hem op rood licht. Pas na een kwartier tot twintig minuten zie je ook de zwakkere meteoren.' },
      { titel: 'Kleed je als voor een winternacht', tekst: 'Je zit een uur stil. Een ligstoel, een slaapzak, muts en handschoenen, en iets warms te drinken. Een verrekijker heb je niet nodig.' },
    ],
    bewolkt:
      'Geminiden zijn langzaam, zo’n 35 km/s, vaak helder en geelachtig. Ze komen niet van een komeet maar van de planetoïde Phaethon. ' +
      'De piek is kort: een dag ervoor of erna zie je nog maar een vijfde. Is het die nacht bewolkt, kijk dan de avond ervoor of erna, maar verwacht minder.',
    andere: 'leoniden',
  },
}

/** Uur (18 t/m 31) als klok, 24 → 00:00. */
export const klok = (u: number) => `${String(Math.floor(u) % 24).padStart(2, '0')}:${String(Math.round((u % 1) * 60)).padStart(2, '0')}`

/** "00:06" → uur op de nachtbalk (24.1); avonduren blijven 18-23. */
export function opBalk(t: string): number {
  const [h, m] = t.split(':').map(Number)
  const u = h + m / 60
  return u < 12 ? u + 24 : u
}
