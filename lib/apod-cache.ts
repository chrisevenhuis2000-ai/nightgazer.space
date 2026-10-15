// ── APOD in localStorage ────────────────────────────────────────────────────
// De homepage bewaart de APOD van vandaag in localStorage. Een bewaarde APOD
// die nog uit de kapotte api.nasa.gov-tijd stamt (NASA-logo, een pad onder
// /themes/ of de titel "NASA Science") is ongeldig: negeren en opnieuw
// ophalen. Het versienummer laat ook oudere, verder goede items één keer
// opnieuw ophalen (zo komt de credit van de nieuwe worker meteen door).

import type { APODData } from './home-content'

export const APOD_CACHE_VERSIE = 3

export function isGeldigeApod(d: unknown): d is APODData {
  if (!d || typeof d !== 'object') return false
  const a = d as Partial<APODData>
  if (typeof a.title !== 'string' || !a.title.trim()) return false
  if (/^\s*nasa science\s*$/i.test(a.title)) return false
  const tekst = JSON.stringify(a).toLowerCase()
  if (tekst.includes('nasa-logo') || tekst.includes('/themes/')) return false
  return true
}

/** De bewaarde APOD als die van vandaag, van deze versie en geldig is; anders null. */
export function leesApodCache(raw: string | null, vandaag: string): APODData | null {
  if (!raw) return null
  try {
    const { v, date, data } = JSON.parse(raw)
    if (v !== APOD_CACHE_VERSIE || date !== vandaag) return null
    return isGeldigeApod(data) ? data : null
  } catch {
    return null
  }
}

export function schrijfApodCache(data: APODData, vandaag: string): string {
  return JSON.stringify({ v: APOD_CACHE_VERSIE, date: vandaag, data })
}
