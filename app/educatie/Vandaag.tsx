'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Vandaag — de band bovenaan /educatie

   Eén reden om morgen terug te komen, zonder punten of ranglijst (er zijn
   geen accounts, dus een ranglijst zou nep zijn):
   - de vraag van de dag, over het nieuws van gisteren;
   - de reeks: dagen op rij dat je hem beantwoordde. Eén dag overslaan mag;
   - je platen: de zes onderwerpfoto's, ontwikkeld zodra je dat onderwerp
     goed hebt. De beloning is de inhoud zelf, geen badge.
   Alles blijft in localStorage; wie dat blokkeert, ziet een werkende vraag
   zonder reeks.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Ico } from '@/app/_plate/Instruments'
import { img } from '@/app/_plate/shared'
import { dagvraag, reeks, lokaleDag, weekdag, type Level } from '@/lib/educatie-quiz'
import { PLATEN, plaatUrl } from '@/lib/educatie-platen'

const DAG_STORE = 'nightgazer_dagvraag'
const REEKS_STORE = 'nightgazer_reeks'
const DAGEN = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO']
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const KEYS = ['A', 'B', 'C', 'D']

function leesJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
function schrijf(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* niet erg */ }
}

export function Vandaag({ level, done, topics, onJump }: {
  level: Level
  done: Record<string, boolean>
  topics: { id: string; title: string }[]
  onJump: (id: string) => void
}) {
  const vraag = useMemo(() => dagvraag(), [])
  const [answers, setAnswers] = useState<Partial<Record<Level, number>>>({})
  const [dagen, setDagen] = useState<string[]>([])

  useEffect(() => {
    const saved = leesJson<{ id?: string; answers?: Partial<Record<Level, number>> }>(DAG_STORE, {})
    if (saved.id === vraag.id && saved.answers) setAnswers(saved.answers)
    setDagen(leesJson<string[]>(REEKS_STORE, []))
  }, [vraag.id])

  const v = vraag[level]
  const picked = answers[level]
  const answered = picked !== undefined
  const right = answered && picked === v.correct

  function answer(i: number) {
    if (answered) return
    const next = { ...answers, [level]: i }
    setAnswers(next)
    schrijf(DAG_STORE, { id: vraag.id, answers: next })
    /* De reeks telt beantwoorden, niet goed hebben: terugkomen is de gewoonte
       die we willen, en een fout antwoord leert net zo goed. */
    const vandaag = lokaleDag()
    if (!dagen.includes(vandaag)) {
      const nd = [...dagen, vandaag].sort().slice(-90)
      setDagen(nd)
      schrijf(REEKS_STORE, nd)
    }
  }

  const n = reeks(dagen)
  const vandaagIdx = weekdag()
  const week = DAGEN.map((d, i) => {
    const dt = new Date()
    dt.setDate(dt.getDate() - (vandaagIdx - i))
    return { d, hit: dagen.includes(lokaleDag(dt)), today: i === vandaagIdx, future: i > vandaagIdx }
  })
  const ontwikkeld = topics.filter(t => done[t.id]).length
  const [, mm, dd] = vraag.datum.split('-').map(Number)

  return (
    <div className="pl-today">
      <div className="pl-today__q">
        <p className="pl-label">
          Vraag van de dag
          <span className="pl-meta__tick" aria-hidden="true" />
          <span className="pl-num">{dd} {MAANDEN[mm - 1]}</span>
          {vraag.bron === 'nieuws' && <><span className="pl-meta__tick" aria-hidden="true" />uit het nieuws</>}
        </p>
        <p className="pl-today__qt">{v.q}</p>

        <div className="pl-today__opts">
          {v.options.map((opt, i) => {
            const state = !answered ? undefined
              : i === v.correct ? 'right'
              : i === picked ? 'wrong'
              : undefined
            return (
              <button key={i} type="button" className="pl-opt" data-state={state} disabled={answered} onClick={() => answer(i)}>
                <span className="pl-opt__k pl-num">{KEYS[i]}</span>
                <span>{opt}</span>
                <span style={{ display: 'flex', justifyContent: 'flex-end' }} aria-hidden="true">
                  {state === 'right' && <Ico.check size={14} />}
                  {state === 'wrong' && <Ico.cross size={14} />}
                </span>
              </button>
            )
          })}
        </div>

        {answered && (
          <div className="pl-check__why" role="status">
            <span className="pl-label" style={{ display: 'block', marginBottom: 7, color: right ? 'var(--pl-good)' : 'var(--pl-warn)' }}>
              {right ? 'Goed' : `Niet goed — het is ${KEYS[v.correct]}`}
            </span>
            {v.explain}
            {vraag.slug && (
              <Link href={`/nieuws/${vraag.slug}/`} className="pl-read" style={{ marginTop: 12, display: 'flex' }}>
                <span>Lees het artikel</span>
                <span className="pl-read__rule" aria-hidden="true" />
                <Ico.arrow />
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="pl-today__side">
        <div>
          <p className="pl-label">Reeks</p>
          <p className="pl-today__n">
            <span className="pl-num" data-zero={n === 0 ? '1' : '0'}>{n}</span>
            <span className="pl-label">{n === 1 ? 'dag' : 'dagen'}</span>
          </p>
          <div className="pl-week" role="img" aria-label={`Deze week beantwoord op ${week.filter(w => w.hit).length} van ${vandaagIdx + 1} dagen`}>
            {week.map(w => (
              <span key={w.d} data-hit={w.hit ? '1' : '0'} data-today={w.today ? '1' : '0'} data-future={w.future ? '1' : '0'}>
                <i />{w.d}
              </span>
            ))}
          </div>
          <p className="pl-today__small">Eén dag overslaan mag; je reeks breekt pas na twee gemiste dagen.</p>
        </div>

        <div>
          <p className="pl-label">Jouw platen <span className="pl-num">{ontwikkeld}/{topics.length}</span></p>
          <div className="pl-devstrip">
            {topics.map(t => {
              const p = PLATEN[t.id]
              const dev = !!done[t.id]
              return (
                <button key={t.id} type="button" className="pl-devstrip__cell" data-dev={dev ? '1' : '0'}
                  onClick={() => onJump(t.id)}
                  aria-label={`${t.title}: ${dev ? 'ontwikkeld' : 'nog latent'} — ga naar de les`}>
                  {p && <img src={img(plaatUrl(p.nasaId, 'thumb'), 160)} alt="" loading="lazy" decoding="async"
                    onError={e => { e.currentTarget.style.visibility = 'hidden' }} />}
                </button>
              )
            })}
          </div>
          <p className="pl-today__small">Beantwoord een les goed en de plaat ontwikkelt.</p>
        </div>
      </div>
    </div>
  )
}
