// ── De plaat bij elk educatie-onderwerp ─────────────────────────────────────
// Eén NASA-beeld per onderwerp, uit images.nasa.gov (vrij te gebruiken met
// bronvermelding). Op /educatie staat de plaat "latent" tot je de vraag bij
// het onderwerp goed hebt; dan ontwikkelt hij. Alle id's en titels komen uit
// de metadata van images-api.nasa.gov, niets is overgetypt uit het geheugen.

export type Plaat = {
  nasaId: string
  titel: string        // Nederlandse omschrijving van wat je ziet
  credit: string
  illustratie?: boolean // kunstenaarsimpressie, geen foto
}

export const PLATEN: Record<string, Plaat> = {
  zonnestelsel: {
    nasaId: 'PIA17172',
    titel: 'Saturnus in tegenlicht, met de Aarde als stipje tussen de ringen',
    credit: 'NASA/JPL-Caltech/SSI · Cassini, 2013',
  },
  sterren: {
    nasaId: 'GSFC_20171208_Archive_e000920',
    titel: 'Een X-klasse zonnevlam uit zonnevlek AR 12192, in extreem uv',
    credit: 'NASA/SDO · 24 oktober 2014',
  },
  sterrenstelsels: {
    nasaId: 'GSFC_20171208_Archive_e000097',
    titel: 'Spiraalstelsels NGC 4302 (van opzij) en NGC 4298',
    credit: 'NASA/ESA · Hubble',
  },
  kosmologie: {
    nasaId: 'GSFC_20171208_Archive_e001651',
    titel: 'Het eXtreme Deep Field: duizenden sterrenstelsels in één klein stukje hemel',
    credit: 'NASA/ESA · Hubble, 2012',
  },
  exoplaneten: {
    nasaId: 'PIA21422',
    titel: 'De zeven planeten van TRAPPIST-1 op een rij',
    credit: 'NASA/JPL-Caltech',
    illustratie: true,
  },
  ruimtevaart: {
    nasaId: 'NHQ202211160030',
    titel: 'Lancering van Artemis I vanaf Launch Complex 39B',
    credit: 'NASA/Joel Kowsky · 16 november 2022',
  },
}

export const plaatUrl = (id: string, maat: 'thumb' | 'small' | 'medium' = 'medium') =>
  `https://images-assets.nasa.gov/image/${id}/${id}~${maat}.jpg`

export const plaatPagina = (id: string) => `https://images.nasa.gov/details/${id}`
