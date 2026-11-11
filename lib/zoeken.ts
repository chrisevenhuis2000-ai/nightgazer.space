// ── Zoeken ────────────────────────────────────────────────────────────────
//
// De zoekfunctie (app/components/SearchModal.tsx) doorzoekt drie soorten:
// vaste pagina's met hun zoekwoorden, de meteorenzwermen van dit jaar, en de
// artikelen. Getest in scripts/test-zoeken.mjs.
//
// shortcut: missies zitten er niet in (de missiedata is 228 KB en zou in elke
// pagina meeladen); de pagina Missies vangt "lancering", "raket" en dergelijke.

import { METEORS } from './sky-data'

export interface Treffer { soort: 'pagina' | 'hemel' | 'artikel'; titel: string; sub: string; href: string }
export interface ZoekArtikel { slug: string; title: string; excerpt: string; category: string; date?: string }

const PAGINAS: (Omit<Treffer, 'soort'> & { woorden: string })[] = [
  { titel: 'Cadeaugids', sub: 'Cadeaus voor sterrenkijkers, per prijsklasse', href: '/sterrenkijken/cadeaugids/', woorden: 'cadeau cadeaus kado gift sinterklaas kerst verjaardag geven' },
  { titel: 'Je eerste telescoop kiezen', sub: 'Gids: opening, vergroting en wat je echt ziet', href: '/sterrenkijken/eerste-telescoop/', woorden: 'telescoop telescopen kopen beginner opening vergroting dobson refractor reflector kijker' },
  { titel: 'Uitrusting', sub: 'Van rood lampje tot verrekijker', href: '/sterrenkijken/uitrusting/', woorden: 'uitrusting verrekijker rood lampje sterrenkaart boek boeken oculair statief' },
  { titel: 'Hemelkalender 2027', sub: 'Pdf-wandkalender, € 4', href: '/sterrenkijken/hemelkalender/', woorden: 'hemelkalender kalender agenda 2027 pdf maanstand maan planeten jaar' },
  { titel: 'Raad de hemelfoto', sub: 'Dagspel: herken de ingezoomde ruimtefoto', href: '/spellen/hemelfoto/', woorden: 'spel spellen spelletje hemelfoto foto raden puzzel quiz' },
  { titel: 'Teken het sterrenbeeld', sub: 'Dagspel: verbind de sterren van vanavond', href: '/spellen/sterrenbeeld/', woorden: 'spel spellen spelletje sterrenbeeld sterrenbeelden tekenen puzzel' },
  { titel: 'Kan ik vannacht kijken?', sub: 'Weer, ISS-overkomsten, noorderlicht en donkere plekken', href: '/sterrenkijken/', woorden: 'vannacht vanavond weer bewolking zicht iss overkomst noorderlicht poollicht donker lichtvervuiling bortle maan' },
  { titel: 'Missies en lanceringen', sub: 'Het lanceermanifest', href: '/missies/', woorden: 'missie missies lancering lanceringen raket spacex starship artemis esa nasa' },
  { titel: 'Meldingen en agenda', sub: 'Een seintje als er iets te zien is', href: '/sterrenkijken/#pl-meld', woorden: 'melding meldingen seintje notificatie push agenda ics' },
  { titel: 'Steun NightGazer', sub: 'Via Ko-fi', href: '/over/', woorden: 'steun steunen doneren donatie koffie kofi ko-fi over redactie' },
]

/** Kleine letters, zonder accenten: "Perseïden" vindt ook "perseiden". */
export function normaliseer(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Elk zoekwoord moet voorkomen. Woorden van drie letters of minder alleen
    als heel woord, zodat "iss" niet in "missie" valt. */
export function past(tekst: string, vraag: string): boolean {
  const t = normaliseer(tekst)
  const woorden = t.split(/[^a-z0-9]+/)
  return normaliseer(vraag).split(/[^a-z0-9]+/).filter(Boolean)
    .every(w => w.length <= 3 ? woorden.includes(w) : t.includes(w))
}

const HEMEL = METEORS.map(m => ({
  titel: m.name, sub: `Meteorenzwerm · piek ${m.peak} · tot ${m.zhr} per uur`,
  href: 'gids' in m && m.gids ? m.gids : '/sterrenkijken/#pl-showers', woorden: `${m.name} meteoren meteorenzwerm vallende sterren ${m.radiant}`,
}))

export const GIDSEN: Treffer[] = PAGINAS.slice(0, 4).map(p => ({ ...p, soort: 'pagina' }))

export function zoek(vraag: string, artikelen: ZoekArtikel[]): Treffer[] {
  const pagina = PAGINAS.filter(p => past(`${p.titel} ${p.sub} ${p.woorden}`, vraag)).slice(0, 3)
    .map(p => ({ soort: 'pagina' as const, titel: p.titel, sub: p.sub, href: p.href }))
  const hemel = HEMEL.filter(h => past(h.woorden, vraag)).slice(0, 3)
    .map(h => ({ soort: 'hemel' as const, titel: h.titel, sub: h.sub, href: h.href }))
  const artikel = artikelen.filter(a => past(`${a.title} ${a.excerpt} ${a.category}`, vraag)).slice(0, 8)
    .map(a => ({ soort: 'artikel' as const, titel: a.title, sub: [a.category, a.date].filter(Boolean).join(' · '), href: `/nieuws/${a.slug}/` }))
  return [...pagina, ...hemel, ...artikel]
}
