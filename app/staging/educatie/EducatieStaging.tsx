'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer educatie — /staging/educatie

   Compositie: de niveauladder. Het leesniveau is de pagina, niet een knopje
   erin: één keuze bovenaan herschrijft alle zes onderwerpen tegelijk, zodat
   je dwars door de vakken heen leest op jouw diepte.
   Wereld en kleurwetten staan in DESIGN.md; chrome komt uit shared.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { LEVELS, TOPIC_DETAILS, TOPICS, CONCEPTS, FAQS } from '@/lib/education-data'
import { Ico, Tip } from '../Instruments'
import {
  archivo, FOOTER_COLS, StagingBanner, PlateHead, AdPlate, editionLabel, Ladder,
} from '../shared'

type Level = 'beg' | 'ama' | 'pro'
const LEVEL_KEYS: Level[] = ['beg', 'ama', 'pro']
const LEVEL_STORE = 'nightgazer_leesniveau'

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

/* ── Eén onderwerp op het gekozen niveau ───────────────────────────────── */
function Lesson({ topic, level, no, swapKey }: {
  topic: (typeof TOPICS)[number]
  level: Level
  no: string
  swapKey: number
}) {
  const detail = TOPIC_DETAILS[topic.id]
  const [term, setTerm] = useState<string | null>(null)
  if (!detail) return null

  const open = detail.glossary.find((g: { term: string }) => g.term === term)

  return (
    <article className="pl-lesson">
      <div className="pl-lesson__no">
        <span className="pl-num pl-label">{no}</span>
      </div>

      <div className="pl-lesson__body">
        <h3 className="pl-lesson__t">{topic.title}</h3>
        <p className="pl-lesson__concept">{detail.featuredConcept}</p>

        {/* key op het niveau: React vervangt de knoop, zodat de overvloeiing
            opnieuw start wanneer je van trede wisselt */}
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
      </div>

      <aside className="pl-lesson__side">
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
export default function EducatieStaging() {
  const [level, setLevel] = useState<Level>('beg')
  const [swapKey, setSwapKey] = useState(0)
  const [restored, setRestored] = useState(false)

  /* Het gekozen niveau blijft staan — wie op Pro leest wil dat morgen weer. */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LEVEL_STORE)
      if (saved && LEVEL_KEYS.includes(saved as Level)) setLevel(saved as Level)
    } catch { /* voorkeur niet beschikbaar, beginner blijft staan */ }
    setRestored(true)
  }, [])

  const pick = useCallback((l: Level) => {
    setLevel(l)
    setSwapKey(k => k + 1)
    try { localStorage.setItem(LEVEL_STORE, l) } catch { /* niet erg */ }
  }, [])

  const active = useMemo(() => LEVELS.find(l => l.key === level)!, [level])

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <StagingBanner />
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

          <p className="pl-levelnote" key={`note-${level}-${swapKey}`} data-fresh="1">
            {active.desc}
          </p>
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
            <Link href="/staging/nieuws" className="pl-read">
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

        <div className="pl-wrap">
          <AdPlate />
        </div>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Bronnen per onderwerp staan in de zijkolom" />
    </div>
  )
}
