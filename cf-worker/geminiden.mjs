// ── Tel de Geminiden — campagne "30 nachten omhoog" (13/14 dec 2026) ──────
//
// Bezoekers geven door hoeveel meteoren ze zagen, hoe lang ze keken, in welke
// provincie en hoe helder het was. Elke telling is één KV-sleutel in SUBS met
// de waarden in de metadata, zodat een list() alles teruggeeft zonder losse
// get()-aanroepen. Geen IP-adres, geen naam, geen cookie.
//
// Moet gelijk lopen met lib/omhoog.ts (PROVINCIES, HEMEL, TEL_OPEN/TEL_DICHT).

export const GEM_PREFIX = 'gem:'

export const PROVINCIES = [
  'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg',
  'Noord-Brabant', 'Noord-Holland', 'Overijssel', 'Utrecht', 'Zeeland', 'Zuid-Holland',
  'België', 'Elders',
]
export const HEMEL = ['Helder', 'Wat bewolkt', 'Veel bewolkt']

export const TEL_OPEN = Date.parse('2026-12-13T17:00:00Z')
export const TEL_DICHT = Date.parse('2026-12-15T11:00:00Z')

/** Maakt van een ingestuurde telling de metadata, of geeft de fout terug. */
export function keurTelling(body, nu = Date.now()) {
  if (nu < TEL_OPEN) return { fout: 'Het telformulier opent zondag 13 december om 18:00.' }
  if (nu > TEL_DICHT) return { fout: 'De telling is gesloten. Bedankt voor het kijken!' }
  if (!body || typeof body !== 'object') return { fout: 'Lege telling.' }
  const p = PROVINCIES.indexOf(body.provincie)
  const h = HEMEL.indexOf(body.hemel)
  const n = Number(body.aantal)
  const m = Number(body.minuten)
  const u = Number(body.uur)
  if (p < 0) return { fout: 'Kies een provincie.' }
  if (h < 0) return { fout: 'Kies hoe helder het was.' }
  if (!Number.isInteger(n) || n < 0 || n > 500) return { fout: 'Vul een aantal tussen 0 en 500 in.' }
  if (!Number.isInteger(m) || m < 10 || m > 480) return { fout: 'Kijk minstens 10 minuten.' }
  if (!Number.isInteger(u) || u < 0 || u > 23) return { fout: 'Kies het uur waarin je begon.' }
  /* Meer dan 4 per minuut haalt geen waarnemer in Nederland; zo'n telling
     zou het gemiddelde alleen vertekenen. */
  if (n / m > 4) return { fout: 'Dat zijn er meer dan vier per minuut. Klopt het aantal minuten?' }
  return { meta: { p, h, n, m, u } }
}

export function telSleutel(nu = Date.now()) {
  const r = Math.random().toString(36).slice(2, 8)
  return `${GEM_PREFIX}${nu.toString(36)}:${r}`
}

/** Totalen voor de uitslag. `lijst` = de metadata van alle tellingen. */
export function uitslag(lijst) {
  const geldig = lijst.filter(x => x && Number.isInteger(x.n) && Number.isInteger(x.m) && x.m > 0)
  const som = (a, k) => a.reduce((t, x) => t + x[k], 0)
  const perUur = a => {
    const min = som(a, 'm')
    return min > 0 ? Math.round((som(a, 'n') / min) * 600) / 10 : 0
  }
  const provincies = PROVINCIES.map((naam, i) => {
    const a = geldig.filter(x => x.p === i)
    return { naam, tellingen: a.length, meteoren: som(a, 'n'), perUur: perUur(a) }
  }).filter(x => x.tellingen > 0).sort((a, b) => b.meteoren - a.meteoren)
  const helder = geldig.filter(x => x.h === 0)
  return {
    tellingen: geldig.length,
    meteoren: som(geldig, 'n'),
    minuten: som(geldig, 'm'),
    perUur: perUur(geldig),
    perUurHelder: perUur(helder),
    provincies,
  }
}
