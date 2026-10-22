// ── Quizvragen voor /educatie ───────────────────────────────────────────────
// content/educatie-quiz.json wordt dagelijks bijgewerkt door
// scripts/educatie-quiz.js (workflow update-quiz.yml): per onderwerp een
// weekset van zeven gecontroleerde vragen, plus een vraag van de dag uit het
// nieuws. Ontbreekt iets, dan vallen we terug op de vaste vragen in
// lib/home-content.ts — de pagina heeft altijd een quiz.

import QUIZ from '@/content/educatie-quiz.json'
import { DAILY_QUESTIONS } from '@/lib/home-content'

export type Level = 'beg' | 'ama' | 'pro'
export type QuizLevel = { q: string; options: string[]; correct: number; explain: string }
export type Vraag = { id: string; beg: QuizLevel; ama: QuizLevel; pro: QuizLevel }
export type Dagvraag = Vraag & { datum: string; slug?: string; titel?: string; bron: 'nieuws' | 'vast' }

type QuizFile = {
  onderwerpen?: Record<string, { week: string; vragen: Vraag[] }>
  dagvragen?: { datum: string; slug: string; titel: string; beg: QuizLevel; ama: QuizLevel; pro: QuizLevel }[]
}
const DATA = QUIZ as QuizFile

/* Vaste vragen per onderwerp, voor als er (nog) geen weekset is. */
const VAST: Record<string, number[]> = {
  zonnestelsel:    [4, 12],
  sterren:         [10, 5, 0],
  sterrenstelsels: [3, 6],
  kosmologie:      [1, 7, 11],
  exoplaneten:     [2, 9],
  ruimtevaart:     [8, 14],
}

/** De lokale datum als YYYY-MM-DD: een dag begint om middernacht bij de lezer. */
export function lokaleDag(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 0 = maandag … 6 = zondag */
export const weekdag = (d = new Date()) => (d.getDay() + 6) % 7

export function vragenVoor(topicId: string): { vragen: Vraag[]; weekset: boolean } {
  const set = DATA.onderwerpen?.[topicId]
  if (set?.vragen?.length) return { vragen: set.vragen, weekset: true }
  const vast = (VAST[topicId] || [])
    .map(id => DAILY_QUESTIONS.find(q => q.id === id))
    .filter((q): q is (typeof DAILY_QUESTIONS)[number] => !!q)
    .map(q => ({ id: `vast-${q.id}`, beg: q.beg, ama: q.ama, pro: q.pro }))
  return { vragen: vast, weekset: false }
}

/**
 * De vraag van de dag: die van vandaag uit het nieuws, anders de nieuwste van
 * de afgelopen drie dagen (de workflow kan laat zijn), anders een vaste vraag
 * die per dag doordraait.
 */
export function dagvraag(nu = new Date()): Dagvraag {
  const vandaag = lokaleDag(nu)
  const grens = lokaleDag(new Date(nu.getTime() - 3 * 86400000))
  const nieuws = (DATA.dagvragen || [])
    .filter(d => d.datum <= vandaag && d.datum >= grens)
    .sort((a, b) => b.datum.localeCompare(a.datum))[0]
  if (nieuws) return { id: `dag-${nieuws.datum}`, bron: 'nieuws', ...nieuws }
  const idx = Math.floor(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()) / 86400000) % DAILY_QUESTIONS.length
  const q = DAILY_QUESTIONS[idx]
  return { id: `dag-${vandaag}`, datum: vandaag, bron: 'vast', beg: q.beg, ama: q.ama, pro: q.pro }
}

/**
 * De reeks: opeenvolgende dagen waarop je de vraag van de dag beantwoordde.
 * Vergevingsgezind: één dag overslaan mag, pas twee gemiste dagen op rij
 * breken de reeks. Vandaag telt nog niet als gemist — de dag is niet om.
 */
export function reeks(dagen: string[], nu = new Date()): number {
  const set = new Set(dagen)
  let n = 0, mis = 0
  const d = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())
  if (set.has(lokaleDag(d))) n++
  for (let i = 1; i < 400; i++) {
    d.setDate(d.getDate() - 1)
    if (set.has(lokaleDag(d))) { n++; mis = 0 }
    else if (++mis >= 2) break
  }
  return n
}
