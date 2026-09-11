// ── Lanceerschema: datums, vensters en groepering ──────────────────────────
// De missiedata draagt de lanceerdatum als Nederlandse tekst ('9 apr 2026').
// Hier wordt dat één keer omgezet naar iets sorteerbaars, zodat elke surface
// dezelfde volgorde en dezelfde vensters gebruikt.

import { MISSIONS, type MissionDetail } from './missions-data'

const NL_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mrt: 2, maa: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
}

export const MONTH_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/**
 * Leest een lanceerdatum uit het vrije tekstveld. Eén missie (Starship)
 * draagt 'IFT-7 · Mrt 2026' zonder dag; die levert bewust null op in plaats
 * van een gegokte dag, want een verzonnen datum op een tijdas is een leugen
 * met een positie.
 */
export function parseLaunchDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const m = String(raw).match(/(\d{1,2})\s+([a-zA-Z]{3})[a-zA-Z]*\.?\s+(\d{4})/)
  if (!m) return null
  const month = NL_MONTHS[m[2].toLowerCase()]
  if (month === undefined) return null
  const d = new Date(Number(m[3]), month, Number(m[1]))
  return Number.isNaN(d.getTime()) ? null : d
}

export interface ScheduledLaunch {
  mission: MissionDetail
  date: Date
  /** Dagen vanaf vandaag; negatief voor vluchten die al geweest zijn. */
  days: number
  /**
   * Hoe hard de datum is. Zonder dit onderscheid zou de tijdas 37 vluchten
   * op 31 december tekenen alsof dat een drukke dag is.
   */
  precision: LaunchPrecision
}

/** Hoe hard de lanceerdatum is. */
export type LaunchPrecision = 'dag' | 'maand' | 'jaar'

/**
 * Leidt de precisie af uit de datumvorm. Launch Library levert een NET-venster
 * als de laatste dag ervan: 'ergens in november' wordt 30 nov, 'ergens in
 * 2026' wordt 31 dec. Van de 51 komende vluchten heeft er 4 een echte dag,
 * 10 alleen een maand en 37 alleen een jaar.
 *
 * Heuristiek, want scripts/update-missions.js bewaarde LL2's net_precision
 * niet — dat is inmiddels toegevoegd, dus vanaf de volgende bot-run kan dit
 * veld de echte waarde lezen in plaats van te raden. Een echte lancering die
 * toevallig op een maandeinde valt wordt nu ten onrechte als schatting
 * gelabeld; dat is een veel kleinere fout dan 37 verzonnen merktekens op
 * één dag zetten.
 */
export function inferPrecision(d: Date): LaunchPrecision {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  if (next.getMonth() === d.getMonth()) return 'dag'
  return d.getMonth() === 11 && d.getDate() === 31 ? 'jaar' : 'maand'
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function buildSchedule(now = new Date()): {
  upcoming: ScheduledLaunch[]
  past: ScheduledLaunch[]
  undated: MissionDetail[]
} {
  const today = startOfDay(now)
  const upcoming: ScheduledLaunch[] = []
  const past: ScheduledLaunch[] = []
  const undated: MissionDetail[] = []

  for (const mission of MISSIONS) {
    const date = parseLaunchDate(mission.launched)
    if (!date) { undated.push(mission); continue }
    const days = Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000)
    const entry: ScheduledLaunch = { mission, date, days, precision: inferPrecision(date) }
    ;(days >= 0 ? upcoming : past).push(entry)
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())
  past.sort((a, b) => b.date.getTime() - a.date.getTime())
  return { upcoming, past, undated }
}

/** Een maandvenster op de strook. */
export interface MonthWindow {
  key: string          // '2026-09'
  label: string        // 'sep'
  year: number
  month: number        // 0-11
  start: Date
  end: Date            // exclusief
  count: number
  /** Vluchten in deze maand met een echte dag. */
  dated: number
  /** Vluchten die alleen 'ergens deze maand' zijn. */
  approx: number
  /** Vluchten die alleen voor dit jaar zijn aangekondigd. */
  yearOnly: number
}

export function monthWindows(launches: ScheduledLaunch[]): MonthWindow[] {
  if (!launches.length) return []
  const first = launches[0].date
  const last = launches[launches.length - 1].date
  const out: MonthWindow[] = []

  const cursor = new Date(first.getFullYear(), first.getMonth(), 1)
  const stop = new Date(last.getFullYear(), last.getMonth(), 1)

  while (cursor <= stop) {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 1)
    const inMonth = launches.filter(l => l.date >= start && l.date < end)
    out.push({
      key: `${y}-${String(m + 1).padStart(2, '0')}`,
      label: MONTH_SHORT[m],
      year: y,
      month: m,
      start,
      end,
      count: inMonth.length,
      dated: inMonth.filter(l => l.precision === 'dag').length,
      approx: inMonth.filter(l => l.precision === 'maand').length,
      yearOnly: inMonth.filter(l => l.precision === 'jaar').length,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out
}

/**
 * Verdeelt merktekens over rijen zodat ze elkaar niet overlappen.
 * Twee lanceringen binnen `minGapPct` van elkaar komen in verschillende
 * rijen; 51 vluchten in 16 weken betekent clusters, en die moeten telbaar
 * blijven in plaats van tot één streep te versmelten.
 */
export function assignLanes(positions: number[], minGapPct: number, maxLanes = 4): number[] {
  const lastInLane: number[] = []
  return positions.map(pos => {
    for (let lane = 0; lane < maxLanes; lane++) {
      if (lastInLane[lane] === undefined || pos - lastInLane[lane] >= minGapPct) {
        lastInLane[lane] = pos
        return lane
      }
    }
    // Voller dan maxLanes: terug naar rij 0, liever gestapeld dan verborgen.
    lastInLane[0] = pos
    return 0
  })
}

/** Agentschappen met hun aantal, grootste eerst. */
export function agencyCounts(missions: MissionDetail[]): { agency: string; count: number }[] {
  const map = new Map<string, number>()
  for (const m of missions) map.set(m.agency, (map.get(m.agency) ?? 0) + 1)
  return [...map.entries()]
    .map(([agency, count]) => ({ agency, count }))
    .sort((a, b) => b.count - a.count)
}

/** Ruwe bestemmingen groeperen naar iets wat een mens leest. */
export function destinationGroup(body: string): string {
  const b = (body || '').toLowerCase()
  if (b.includes('interstellair')) return 'Interstellair'
  if (b.includes('mars')) return 'Mars'
  if (b.includes('maan') || b.includes('lunar')) return 'Maan'
  if (b.includes('jupiter') || b.includes('europa')) return 'Jupiter'
  if (b.includes('l2')) return 'L2-punt'
  if (b.includes('suborbital')) return 'Suborbitaal'
  if (b.includes('geostation')) return 'Geostationair'
  if (b.includes('medium earth')) return 'Middelhoge baan'
  if (b.includes('sun-synchronous') || b.includes('polar')) return 'Poolbaan'
  if (b.includes('low earth') || b.includes('aardebaan') || b.includes('aardeomloop')) return 'Lage aardbaan'
  return 'Overig'
}
