// ── Cadeautijd ──────────────────────────────────────────────────────────────
//
// Welke tekst het cadeaublok op de homepage en /vandaag toont, op datum
// (Nederlandse kalenderdag, 'YYYY-MM-DD'). Buiten het seizoen wijst het blok
// alleen naar /gidsen. Getest in scripts/test-cadeautijd.mjs.

export type Seizoen = 'sint' | 'kerst' | 'januari' | 'uit'

/** Laatste besteldag voor fysieke cadeaus voor 5 december (Bol/Amazon). */
export const SINT_BESTEL = 'woensdag 2 december'

export function seizoen(iso: string): Seizoen {
  const m = +iso.slice(5, 7), d = +iso.slice(8, 10)
  if (m === 11 || (m === 12 && d <= 5)) return 'sint'
  if (m === 12 && d <= 24) return 'kerst'
  if (m === 12 || m === 1) return 'januari'
  return 'uit'
}

export const SEIZOEN_TEKST: Record<Exclude<Seizoen, 'uit'>, string> = {
  sint: `Voor Sinterklaas: bestel pakketjes uiterlijk ${SINT_BESTEL}.`,
  kerst: 'Te laat voor een pakketje? De Hemelkalender is een pdf: vandaag gekocht, vandaag gegeven.',
  januari: 'Het hele hemeljaar boven Nederland aan de muur.',
}
