/* De Dagmap: de dagelijkse Instagram-carrousel en zijn bestemming /vandaag.

   content/dagmap.json houdt per carrousel één regel bij. nightgazer-social
   schrijft die regel zodra een carrousel is ingepland; de site toont hem op
   /vandaag vanaf het moment dat hij live gaat (datum + tijd, Nederlandse
   tijd). Zo opent de bio-link altijd het artikel van de post die je net zag. */

export interface DagmapRegel {
  /** YYYY-MM-DD, Nederlandse datum waarop de carrousel live gaat. */
  datum: string
  /** HH:MM, Nederlandse tijd. Standaard 12:00. */
  tijd?: string
  /** Slug van het artikel op nightgazer.space. */
  slug: string
  /** De hook van de cover, letterlijk. */
  hook: string
  /** De open vraag van de voorlaatste slide; het artikel beantwoordt hem. */
  vraag?: string
}

export interface DagmapItem extends DagmapRegel {
  title: string
  excerpt: string
  imageUrl?: string
  /** YYYY-MM-DD, publicatiedatum van het artikel. */
  gepubliceerd?: string
}

/** Een Dagmap kiest artikelen van hooguit zoveel dagen oud; ouder heet "Uit ons archief" (gebruikerstest 11-2026). */
export const VERS_DAGEN = 14

/** Dagen tussen twee datums (YYYY-MM-DD), b na a positief. */
function dagenTussen(a: string, b: string): number {
  const t = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
  return Math.round((t(b) - t(a)) / 86_400_000)
}

/** Was het artikel op de dag van de carrousel ouder dan VERS_DAGEN? Dan tonen we "Uit ons archief". */
export function uitArchief(r: { datum?: string; gepubliceerd?: string }): boolean {
  if (!r.datum || !r.gepubliceerd) return false
  return dagenTussen(r.gepubliceerd.slice(0, 10), r.datum) > VERS_DAGEN
}

/** Sorteersleutel 'YYYY-MM-DD HH:MM'. */
export const moment = (r: Pick<DagmapRegel, 'datum' | 'tijd'>) => `${r.datum} ${r.tijd || '12:00'}`

/** Het huidige moment in Nederland als 'YYYY-MM-DD HH:MM'. */
export function nuInNederland(d = new Date()): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map(x => [x.type, x.value]),
  )
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

/** Alleen carrousels die al live zijn, nieuwste eerst. */
export function zichtbaar<T extends DagmapRegel>(regels: T[], nu: string): T[] {
  return regels.filter(r => moment(r) <= nu).sort((a, b) => (moment(a) < moment(b) ? 1 : -1))
}

/** Link naar het artikel, met een eigen campagne per carrousel. */
export function artikelLink(r: Pick<DagmapRegel, 'slug' | 'datum'> | { slug: string; datum?: string }): string {
  const c = r.datum ? `dagmap-${r.datum}` : 'dagmap'
  return `/nieuws/${r.slug}/?utm_source=instagram&utm_medium=dagmap&utm_campaign=${c}`
}
