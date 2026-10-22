'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer educatie — /educatie

   Compositie: de niveauladder. Het leesniveau is de pagina, niet een knopje
   erin: één keuze bovenaan herschrijft alle zes onderwerpen tegelijk, zodat
   je dwars door de vakken heen leest op jouw diepte.
   Wereld en kleurwetten staan in DESIGN.md; chrome komt uit shared.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { LEVELS, TOPIC_DETAILS, TOPICS, CONCEPTS, FAQS } from '@/lib/education-data'
import { vragenVoor, weekdag } from '@/lib/educatie-quiz'
import { PLATEN, plaatUrl, plaatPagina } from '@/lib/educatie-platen'
import { Ico, Tip } from '@/app/_plate/Instruments'
import {
  archivo, FOOTER_COLS, PlateHead, editionLabel, Ladder, img, UitrustingVerwijzing,
} from '@/app/_plate/shared'
import { LessonFigure } from './Figuren'
import { Vandaag } from './Vandaag'

type Level = 'beg' | 'ama' | 'pro'
const LEVEL_KEYS: Level[] = ['beg', 'ama', 'pro']
const LEVEL_STORE = 'nightgazer_leesniveau'
const DONE_STORE = 'nightgazer_educatie_af'

/* ── Toetsvragen per onderwerp ────────────────────────────────────────────
   Elke maandag een nieuwe set van zeven vragen per onderwerp (scripts/
   educatie-quiz.js, gecontroleerd door een tweede Claude-ronde). Elke dag van
   de week toont een andere; "Nog een vraag" bladert verder door de set.
   Zonder set vallen we terug op de vaste vragen uit lib/home-content.ts. */

/* ── De ladder ─────────────────────────────────────────────────────────── */
function LadderBar({ level, onPick }: { level: Level; onPick: (l: Level) => void }) {
  return (
    <div className="pl-ladderbar">
      <div className="pl-ladderbar__in">
        <span className="pl-ladderbar__lab pl-label">Leesniveau</span>
        <div style={{ display: 'flex', flex: 1, minWidth: 0 }} role="group" aria-label="Kies je leesniveau">
          {LEVELS.map(l => (
            <button
              key={l.key}
              type="button"
              className="pl-rung"
              aria-pressed={level === l.key}
              onClick={() => onPick(l.key as Level)}
            >
              <Ladder level={l.key as Level} />
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── De toets onder een les ───────────────────────────────────────────────
   Lezen en dan controleren of het is blijven hangen. Zonder dit is de
   pagina een artikel, geen leerplatform. */
function Check({ topicId, topicTitle, level, done, onDone }: {
  topicId: string
  topicTitle: string
  level: Level
  done: boolean
  onDone: (ok: boolean) => void
}) {
  /* Eén gemiste poging mag een onderwerp niet permanent dichtzetten. De
     eerste misser geeft een duw zonder het antwoord te verklappen — dat
     terugbladeren ís het leermoment. Pas de tweede legt alles op tafel. */
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongs, setWrongs] = useState<number[]>([])
  const [extra, setExtra] = useState(0)
  const { vragen, weekset } = useMemo(() => vragenVoor(topicId), [topicId])
  const idx = vragen.length ? (weekdag() + extra) % vragen.length : 0
  const q = vragen.length ? vragen[idx][level] : null

  /* Van niveau of vraag wisselen betekent een ander antwoord. */
  useEffect(() => { setPicked(null); setWrongs([]) }, [level, idx])

  if (!q) return null
  const right  = picked !== null && picked === q.correct
  const spent  = wrongs.length >= 2
  const closed = right || spent
  const nudge  = !closed && wrongs.length === 1

  function answer(i: number) {
    if (closed || wrongs.includes(i)) return
    setPicked(i)
    if (i === q!.correct) onDone(true)
    else setWrongs(w => [...w, i])
  }

  return (
    <div className="pl-check">
      <div className="pl-check__head">
        <span className="pl-label">Controleer jezelf</span>
        <span className="pl-meta__tick" aria-hidden="true" />
        <span className="pl-label">{topicTitle}</span>
        <span className="pl-check__right">
          {done && !closed && (
            <span className="pl-done">
              <Ico.check size={13} />eerder goed
            </span>
          )}
          {weekset && (
            <span className="pl-label pl-num pl-check__count">
              {idx + 1}/{vragen.length} deze week
            </span>
          )}
        </span>
      </div>

      <p className="pl-check__q">{q.q}</p>

      <div className="pl-check__opts">
        {q.options.map((opt: string, i: number) => {
          const miss  = wrongs.includes(i)
          const state = miss ? 'wrong'
            : closed && i === q.correct ? 'right'
            : undefined
          return (
            <button key={i} className="pl-opt" data-state={state} disabled={closed || miss} onClick={() => answer(i)}>
              <span className="pl-opt__k pl-num">{['A', 'B', 'C', 'D'][i]}</span>
              <span>{opt}</span>
              <span style={{ display: 'flex', justifyContent: 'flex-end' }} aria-hidden="true">
                {state === 'right' && <Ico.check size={14} />}
                {state === 'wrong' && <Ico.cross size={14} />}
              </span>
            </button>
          )
        })}
      </div>

      {nudge && (
        <p className="pl-check__why" role="status">
          <span className="pl-label" style={{ display: 'block', marginBottom: 7, color: 'var(--pl-warn)' }}>
            Nog niet — je hebt nog één poging
          </span>
          Lees de uitleg hierboven nog eens terug en kies opnieuw.
        </p>
      )}

      {closed && (
        <p className="pl-check__why" role="status">
          <span className="pl-label" style={{ display: 'block', marginBottom: 7, color: right ? 'var(--pl-good)' : 'var(--pl-warn)' }}>
            {right ? 'Goed' : `Niet goed — het juiste antwoord is ${['A', 'B', 'C', 'D'][q.correct]}`}
          </span>
          {q.explain}
        </p>
      )}

      {closed && vragen.length > 1 && (
        <button type="button" className="pl-btn pl-check__next" onClick={() => setExtra(x => x + 1)}>
          Nog een vraag
          <Ico.arrow size={12} />
        </button>
      )}
    </div>
  )
}

/* ── De plaat bij een les ─────────────────────────────────────────────────
   Latent tot het onderwerp af is: een donker negatief met een vage vorm.
   Een goed antwoord ontwikkelt hem — de beloning is het beeld zelf. */
function LessonPlate({ topicId, done }: { topicId: string; done: boolean }) {
  const p = PLATEN[topicId]
  const [failed, setFailed] = useState(false)
  if (!p) return null
  const image = (
    <span className="pl-lplate__img">
      {!failed && (
        <img src={img(plaatUrl(p.nasaId), 640)} alt={done ? p.titel : ''} loading="lazy" decoding="async"
          onError={() => setFailed(true)} />
      )}
    </span>
  )
  return (
    <figure className="pl-lplate" data-dev={done ? '1' : '0'}>
      {done && !failed
        ? <a href={plaatPagina(p.nasaId)} target="_blank" rel="noopener noreferrer" aria-label={`${p.titel} — op images.nasa.gov`}>{image}</a>
        : image}
      <figcaption>
        <span className="pl-label pl-num">{p.nasaId.replace(/^GSFC_20171208_Archive_/, 'GSFC ')}</span>
        {done
          ? <><span className="pl-lplate__t">{p.titel}{p.illustratie ? ' (illustratie)' : ''}</span><span className="pl-lplate__c">{p.credit}</span></>
          : <span className="pl-lplate__c">Latent. Beantwoord de vraag goed om deze plaat te ontwikkelen.</span>}
        {failed && done && <span className="pl-lplate__c">Beeld nu niet bereikbaar.</span>}
      </figcaption>
    </figure>
  )
}

/* ── Eén onderwerp op het gekozen niveau ───────────────────────────────── */
function Lesson({ topic, level, no, swapKey, done, onDone }: {
  topic: (typeof TOPICS)[number]
  level: Level
  no: string
  swapKey: number
  done: boolean
  onDone: (ok: boolean) => void
}) {
  const detail = TOPIC_DETAILS[topic.id]
  const [term, setTerm] = useState<string | null>(null)
  if (!detail) return null

  const open = detail.glossary.find((g: { term: string }) => g.term === term)

  return (
    <article className="pl-lesson" id={`les-${topic.id}`} data-done={done ? '1' : '0'}>
      <div className="pl-lesson__no">
        <span className="pl-num pl-label">{no}</span>
        {done && (
          <span className="pl-done" style={{ marginTop: 10, display: 'flex' }}>
            <Ico.check size={12} />af
          </span>
        )}
      </div>

      <div className="pl-lesson__body">
        <h3 className="pl-lesson__t">{topic.title}</h3>
        <p className="pl-lesson__concept">{detail.featuredConcept}</p>

        {/* key op het niveau: React vervangt de knoop, zodat de overvloeiing
            opnieuw start wanneer je van trede wisselt */}
        <LessonFigure topicId={topic.id} level={level} />

        <p className="pl-lesson__text" key={`${topic.id}-${level}-${swapKey}`} data-fresh="1">
          {detail[level]}
        </p>

        <div className="pl-meta" style={{ marginTop: 20 }}>
          {topic.concepts.slice(0, 4).map((c: string, i: number) => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {i > 0 && <span className="pl-meta__tick" aria-hidden="true" />}
              {c}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <p className="pl-label">Begrippen in deze uitleg</p>
          <div className="pl-terms" role="group" aria-label={`Begrippen bij ${topic.title}`}>
            {detail.glossary.map((g: { term: string; def: string }) => (
              <button
                key={g.term}
                type="button"
                aria-pressed={term === g.term}
                onClick={() => setTerm(term === g.term ? null : g.term)}
              >
                {g.term}
              </button>
            ))}
          </div>
          {open && (
            <p className="pl-termdef" role="status">
              <strong>{open.term}</strong> — {open.def}
            </p>
          )}
        </div>

        <Check topicId={topic.id} topicTitle={topic.title} level={level} done={done} onDone={onDone} />
      </div>

      <aside className="pl-lesson__side">
        <LessonPlate topicId={topic.id} done={done} />
        <div>
          <p className="pl-label" style={{ marginBottom: 12 }}>Kernfeiten</p>
          <ul className="pl-facts" style={{ listStyle: 'none', padding: 0 }}>
            {detail.keyFacts.map((f: string) => <li key={f}>{f}</li>)}
          </ul>
        </div>

        <div>
          <p className="pl-label" style={{ marginBottom: 12 }}>Bronnen</p>
          <div className="pl-srcs">
            {detail.sources.map((s: { label: string; url: string }) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
                <Ico.arrow size={11} />
              </a>
            ))}
          </div>
        </div>
      </aside>
    </article>
  )
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function Niveauladder() {
  const [level, setLevel] = useState<Level>('beg')
  const [swapKey, setSwapKey] = useState(0)
  const [restored, setRestored] = useState(false)
  /* Welke onderwerpen je goed hebt beantwoord. Blijft staan, want een
     leerplatform dat vergeet waar je was is geen leerplatform. */
  const [done, setDone] = useState<Record<string, boolean>>({})

  /* Het gekozen niveau blijft staan — wie op Pro leest wil dat morgen weer. */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LEVEL_STORE)
      if (saved && LEVEL_KEYS.includes(saved as Level)) setLevel(saved as Level)
    } catch { /* voorkeur niet beschikbaar, beginner blijft staan */ }
    try {
      const raw = localStorage.getItem(DONE_STORE)
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>)
    } catch { /* voortgang niet beschikbaar, begin gewoon opnieuw */ }
    setRestored(true)
  }, [])

  const markDone = useCallback((id: string, ok: boolean) => {
    if (!ok) return
    setDone(prev => {
      if (prev[id]) return prev
      const next = { ...prev, [id]: true }
      try { localStorage.setItem(DONE_STORE, JSON.stringify(next)) } catch { /* niet erg */ }
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    setDone({})
    try { localStorage.removeItem(DONE_STORE) } catch { /* niet erg */ }
  }, [])

  const doneCount = useMemo(() => TOPICS.filter(t => done[t.id]).length, [done])

  const pick = useCallback((l: Level) => {
    setLevel(l)
    setSwapKey(k => k + 1)
    try { localStorage.setItem(LEVEL_STORE, l) } catch { /* niet erg */ }
  }, [])

  const jump = useCallback((id: string) => {
    document.getElementById(`les-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const active = useMemo(() => LEVELS.find(l => l.key === level)!, [level])

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={TOPICS.length} edition={editionLabel()} current="educatie" totalLabel="onderwerpen" />
      <LadderBar level={level} onPick={pick} />

      <main id="pl-main" tabIndex={-1} className="pl-stack">

        {/* ══ Wat dit niveau betekent ══ */}
        <section className="pl-wrap" aria-labelledby="pl-edu">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-edu" className="pl-h2">Leren op jouw niveau</h1>
              <Tip label={
                <>
                  <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Hoe dit werkt</span>
                  Je kiest het niveau één keer bovenaan; alle zes onderwerpen hieronder
                  worden op die diepte geschreven. Dezelfde keuze werkt ook op elke
                  artikelpagina, en hij blijft bewaard voor je volgende bezoek.
                </>
              }>
                <span className="pl-label">{active.label}</span>
              </Tip>
            </div>
            <p className="pl-label pl-num">{TOPICS.length} onderwerpen</p>
          </div>

          {restored && (
            <Vandaag
              level={level}
              done={done}
              topics={TOPICS.map((t: (typeof TOPICS)[number]) => ({ id: t.id, title: t.title }))}
              onJump={jump}
            />
          )}

          <p className="pl-levelnote" key={`note-${level}-${swapKey}`} data-fresh="1">
            {active.desc}
          </p>

          {/* Voortgangsrail: zes strepen, één per onderwerp. Klik om erheen
              te springen. Dit is wat van een artikel een leerplatform maakt. */}
          <div className="pl-track">
            <div className="pl-summary">
              <span className="pl-summary__n" data-zero={doneCount === 0 ? '1' : '0'}>{doneCount}</span>
              <span className="pl-label">van {TOPICS.length} afgerond</span>
            </div>

            <div className="pl-track__dots" role="group" aria-label="Voortgang per onderwerp">
              {TOPICS.map((t: (typeof TOPICS)[number]) => (
                <button
                  key={t.id}
                  type="button"
                  className="pl-track__dot"
                  data-state={done[t.id] ? 'done' : 'reading'}
                  aria-label={`${t.title}${done[t.id] ? ' — afgerond' : ''}`}
                  onClick={() => jump(t.id)}
                />
              ))}
            </div>

            {doneCount > 0 && (
              <button type="button" className="pl-reset" onClick={resetProgress}>
                Voortgang wissen
              </button>
            )}
          </div>
        </section>

        {/* ══ De zes onderwerpen ══ */}
        <section className="pl-wrap" aria-label="Onderwerpen">
          {!restored ? (
            <div className="pl-skel" style={{ height: 420 }} />
          ) : (
            TOPICS.map((t: (typeof TOPICS)[number], i: number) => (
              <Lesson
                key={t.id}
                topic={t}
                level={level}
                no={`NG-E${String(i + 1).padStart(2, '0')}`}
                swapKey={swapKey}
                done={!!done[t.id]}
                onDone={ok => markDone(t.id, ok)}
              />
            ))
          )}
        </section>

        {/* ══ Verder lezen ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-verder">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-verder" className="pl-h2">Verder lezen</h2>
              <span className="pl-label">Artikelen bij deze onderwerpen</span>
            </div>
            <Link href="/nieuws/" className="pl-read">
              <span>Het hele archief</span>
              <span className="pl-read__rule" aria-hidden="true" />
              <Ico.arrow />
            </Link>
          </div>

          <div className="pl-fleet">
            {CONCEPTS.map((c: (typeof CONCEPTS)[number]) => (
              <Link key={c.slug} href={`/nieuws/${c.slug}`} className="pl-fleetcell pl-lift">
                <span className="pl-label">{c.category}</span>
                <span className="pl-fleetcell__t">{c.title}</span>
                <p className="pl-body-s" style={{ flex: 1 }}>{c.desc}</p>
                <span className="pl-read" style={{ minHeight: 22 }}>
                  <span>Lees</span>
                  <span className="pl-read__rule" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="pl-wrap">
          <UitrustingVerwijzing tekst="Zelf de maan, Jupiter of de Andromedanevel zien? Dit heb je nodig om te beginnen." />
        </div>

        {/* ══ Vragen ══ */}
        <section className="pl-wrap" aria-labelledby="pl-vragen">
          <div className="pl-band">
            <h2 id="pl-vragen" className="pl-h2" style={{ fontSize: 'clamp(1.2rem,1.8vw,1.5rem)' }}>
              Veelgestelde vragen
            </h2>
            <p className="pl-label pl-num">{FAQS.length}</p>
          </div>

          <div className="pl-qa">
            {FAQS.map((f: { q: string; a: string }) => (
              <details key={f.q}>
                <summary>
                  <span>{f.q}</span>
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

      </main>

      <SiteFooter cols={FOOTER_COLS} note="Bronnen per onderwerp staan in de zijkolom" />
    </div>
  )
}
