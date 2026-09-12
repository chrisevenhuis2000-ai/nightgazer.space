'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer artikel — /staging/artikel?slug=…

   Compositie: de ontwikkelstrook. Het leesniveau is de belichting; elke
   alinea komt tevoorschijn zodra zijn herschrijving binnen is. Dat is geen
   versiering: de rewrite kómt al per alinea binnen, dus de metafoor en het
   werkelijke gedrag vallen samen.

   Deze route leest elk artikel client-side uit /content/articles/<slug>.md,
   zodat de staging-preview geen 887 extra pagina's aan de export toevoegt.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { LEVELS, type ReadingLevel } from '@/types'
import { type ArticleData, type Enrichment, PROXY, IMG, parseMarkdown } from '@/lib/article-data'
import { type Article } from '@/lib/home-content'
import { Ico, Tip } from '../Instruments'
import {
  archivo, FOOTER_COLS, StagingBanner, PlateHead, AdPlate, editionLabel, Ladder, plateNo,
} from '../shared'

const ORDER: ReadingLevel[] = ['original', 'beginner', 'amateur', 'pro']
const LADDER: Record<Exclude<ReadingLevel, 'original'>, 'beg' | 'ama' | 'pro'> = {
  beginner: 'beg', amateur: 'ama', pro: 'pro',
}
const LEVEL_STORE = 'nightgazer_leesniveau_artikel'

/** Per alinea: waar staat de ontwikkeling? */
type ParaState = 'developed' | 'latent' | 'failed'

/* ── Eén alinea ────────────────────────────────────────────────────────── */
function Para({ text, state, lead }: { text: string; state: ParaState; lead: boolean }) {
  return (
    <p className={`pl-para${lead ? ' pl-para--lead' : ''}`} data-state={state}>
      {text}
      {state === 'failed' && (
        <span className="pl-para__note">
          Herschrijven mislukt voor deze alinea — dit is de oorspronkelijke tekst.
        </span>
      )}
    </p>
  )
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function ArtikelStaging() {
  const [slug, setSlug] = useState<string | null>(null)
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [level, setLevel] = useState<ReadingLevel>('original')
  const [texts, setTexts] = useState<string[]>([])
  const [states, setStates] = useState<ParaState[]>([])
  const [busy, setBusy] = useState(false)
  const [enrich, setEnrich] = useState<Enrichment | null>(null)
  const [related, setRelated] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [progress, setProgress] = useState(0)

  const cache = useRef<Partial<Record<ReadingLevel, string[]>>>({})
  const runId = useRef(0)

  /* Welk artikel? Query-param, anders het nieuwste uit de index. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('slug')
    if (q) { setSlug(q); return }
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((list: Article[]) => setSlug(list[0]?.slug ?? null))
      .catch(() => setNotFound(true))
  }, [])

  /* De plaat ophalen */
  useEffect(() => {
    if (!slug) return
    fetch(`/content/articles/${slug}.md`)
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(raw => {
        const parsed = parseMarkdown(raw, slug)
        setArticle(parsed)
        setTexts(parsed.paragraphs)
        setStates(parsed.paragraphs.map(() => 'developed'))
        cache.current = { original: parsed.paragraphs }
      })
      .catch(() => setNotFound(true))
  }, [slug])

  /* Verwante platen en het archieftotaal */
  useEffect(() => {
    if (!article) return
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((list: Article[]) => {
        setTotal(list.length)
        setRelated(
          list.filter(a => a.slug !== slug && a.category === article.category).slice(0, 6)
        )
      })
      .catch(() => { /* zonder index geen contactstrip, geen ramp */ })
  }, [article, slug])

  /* Bewaard niveau terughalen */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LEVEL_STORE) as ReadingLevel | null
      if (saved && ORDER.includes(saved)) setLevel(saved)
    } catch { /* origineel blijft staan */ }
  }, [])

  /* Leesvoortgang */
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? Math.min(1, window.scrollY / h) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [article])

  /* ── Ontwikkelen: alinea's komen één voor één scherp ───────────────────
     De herschrijving loopt per alinea, dus de plaat ontwikkelt zich ook per
     alinea. Mislukt er één, dan zegt die alinea dat en toont het origineel —
     eeuwig laten gloeien zou een belofte zijn die niet meer komt. */
  const develop = useCallback(async (next: ReadingLevel) => {
    if (!article) return
    const id = ++runId.current
    setLevel(next)
    try { localStorage.setItem(LEVEL_STORE, next) } catch { /* niet erg */ }

    const cached = cache.current[next]
    if (cached) {
      setTexts(cached)
      setStates(cached.map(() => 'developed'))
      return
    }
    if (next === 'original') {
      setTexts(article.paragraphs)
      setStates(article.paragraphs.map(() => 'developed'))
      return
    }

    setBusy(true)
    setTexts(article.paragraphs)
    setStates(article.paragraphs.map(() => 'latent'))

    const out: string[] = [...article.paragraphs]
    await Promise.all(article.paragraphs.map(async (para, i) => {
      try {
        const res = await fetch(PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            system: LEVELS[next].prompt,
            messages: [{ role: 'user', content: para }],
          }),
        })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        const text = data.content?.[0]?.text
        if (!text) throw new Error('leeg antwoord')
        if (runId.current !== id) return
        out[i] = text
        setTexts(t => { const c = [...t]; c[i] = text; return c })
        setStates(s => { const c = [...s]; c[i] = 'developed'; return c })
      } catch {
        if (runId.current !== id) return
        setStates(s => { const c = [...s]; c[i] = 'failed'; return c })
      }
    }))

    if (runId.current !== id) return
    cache.current[next] = out
    setBusy(false)
  }, [article])

  /* Kerncijfers en kernfeiten in de kantlijn */
  useEffect(() => {
    if (!article) return
    let alive = true
    fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: `Analyseer dit astronomie-artikel en antwoord ALLEEN met geldig JSON:
{"kerncijfers":[{"value":"compacte waarde","label":"kort label","unit":"eenheid"}],"kernfeiten":["feit 1","feit 2","feit 3"],"quote":{"text":"opvallende uitspraak in het Nederlands","author":"naam of rol"},"headings":["Sectietitel 1","Sectietitel 2"]}
Regels: kerncijfers exact 3, kernfeiten 3-5, headings exact 2, alles in het Nederlands.

Artikel:
${article.rawBody.slice(0, 2500)}` }],
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const m = (d.content?.[0]?.text || '').match(/\{[\s\S]*\}/)
        if (alive && m) setEnrich(JSON.parse(m[0]) as Enrichment)
      })
      .catch(() => { /* geen kantlijn is beter dan een verzonnen kantlijn */ })
    return () => { alive = false }
  }, [article])

  const developing = useMemo(() => states.filter(s => s === 'latent').length, [states])
  const failed = useMemo(() => states.filter(s => s === 'failed').length, [states])

  if (notFound) {
    return (
      <div className={`pl ${archivo.variable}`}>
        <StagingBanner />
        <PlateHead total={0} edition={editionLabel()} current="nieuws" totalLabel="platen" />
        <main id="pl-main" className="pl-stack">
          <div className="pl-wrap">
            <div className="pl-plate" style={{ padding: '56px 24px', display: 'grid', gap: 14, justifyItems: 'start' }}>
              <h1 className="pl-h2">Deze plaat zit niet in het archief</h1>
              <p className="pl-body-s">
                Geef een bestaande slug mee, bijvoorbeeld
                {' '}<code>/staging/artikel?slug=james-webb-k2-18b-biosignatuur</code>.
              </p>
              <Link href="/staging/nieuws" className="pl-btn">Naar het archief</Link>
            </div>
          </div>
        </main>
        <SiteFooter cols={FOOTER_COLS} />
      </div>
    )
  }

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <StagingBanner />
      <PlateHead total={total} edition={editionLabel()} current="nieuws" totalLabel="platen" />

      {/* ══ Belichting ══ */}
      <div className="pl-expose">
        <div className="pl-expose__in">
          <span className="pl-expose__lab pl-label">Belichting</span>
          <div className="pl-expose__set" role="group" aria-label="Kies je leesniveau">
            {ORDER.map(k => (
              <button
                key={k}
                type="button"
                className="pl-expose__btn"
                aria-pressed={level === k}
                disabled={busy && level !== k}
                onClick={() => develop(k)}
              >
                {k === 'original'
                  ? <span className="pl-orig" aria-hidden="true" />
                  : <Ladder level={LADDER[k as Exclude<ReadingLevel, 'original'>]} />}
                {LEVELS[k].label}
              </button>
            ))}
          </div>
        </div>
        <div className="pl-progress" aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <div className="pl-wrap">
          {!article ? (
            <div className="pl-skel" style={{ height: 620 }} />
          ) : (
            <div className="pl-read-grid">
              <article className="pl-read-main">
                <div className="pl-meta">
                  <span className="pl-num">{total > 0 ? plateNo(total, 0) : '—'}</span>
                  <span className="pl-meta__tick" aria-hidden="true" />
                  <span>{article.category}</span>
                  <span className="pl-meta__tick" aria-hidden="true" />
                  <span className="pl-num">{article.date}</span>
                  <span className="pl-meta__tick" aria-hidden="true" />
                  <span className="pl-num">{article.readTime} min</span>
                </div>

                <h1>{article.title}</h1>

                {article.imageUrl && (
                  <figure className="pl-read-fig">
                    <div className="pl-emulsion">
                      <img src={IMG(article.imageUrl, 1200)} alt="" />
                    </div>
                    {article.imageCredit && <figcaption>Beeld · {article.imageCredit}</figcaption>}
                  </figure>
                )}

                {developing > 0 && (
                  <p className="pl-label" role="status" style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                    <span className="pl-dot pl-live" aria-hidden="true" />
                    {developing} van {texts.length} alinea&rsquo;s aan het ontwikkelen
                  </p>
                )}

                {texts.map((t, i) => (
                  <Para key={`${level}-${i}`} text={t} state={states[i] ?? 'developed'} lead={i === 0} />
                ))}

                {failed > 0 && developing === 0 && (
                  <p className="pl-fail" style={{ marginTop: 24 }}>
                    {failed} van {texts.length} alinea&rsquo;s kon niet herschreven worden.
                    Die staan hierboven in de oorspronkelijke tekst, niet in een
                    verzonnen versie.
                  </p>
                )}

                {article.tags.length > 0 && (
                  <div className="pl-terms" style={{ marginTop: 30 }}>
                    {article.tags.map(t => (
                      <Link key={t} href={`/staging/nieuws?onderwerp=${encodeURIComponent(t)}`}>
                        <button type="button">{t}</button>
                      </Link>
                    ))}
                  </div>
                )}
              </article>

              <aside className="pl-read-side">
                <Tip label={
                  <>
                    <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Waar komt dit vandaan?</span>
                    Kerncijfers, feiten en het citaat worden uit dit artikel gehaald
                    door Claude. Lukt dat niet, dan blijft de kantlijn leeg in plaats
                    van iets te tonen dat niet in het stuk staat.
                  </>
                }>
                  <span className="pl-label">Uit dit artikel</span>
                </Tip>

                {!enrich ? (
                  <>
                    <div className="pl-skel" style={{ height: 52 }} />
                    <div className="pl-skel" style={{ height: 52 }} />
                    <div className="pl-skel" style={{ height: 80 }} />
                  </>
                ) : (
                  <>
                    {enrich.kerncijfers?.length > 0 && (
                      <div className="pl-figs">
                        {enrich.kerncijfers.map(k => (
                          <div key={k.label} className="pl-fig">
                            <span className="pl-fig__v">{k.value}</span>
                            <span className="pl-label">{k.label}</span>
                            {k.unit && <span className="pl-fig__u">{k.unit}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {enrich.kernfeiten?.length > 0 && (
                      <div>
                        <p className="pl-label" style={{ marginBottom: 12 }}>Kernfeiten</p>
                        <ul className="pl-facts" style={{ listStyle: 'none', padding: 0 }}>
                          {enrich.kernfeiten.map(f => <li key={f}>{f}</li>)}
                        </ul>
                      </div>
                    )}

                    {enrich.quote?.text && (
                      <blockquote className="pl-quote">
                        {enrich.quote.text}
                        {enrich.quote.author && <cite>{enrich.quote.author}</cite>}
                      </blockquote>
                    )}
                  </>
                )}
              </aside>
            </div>
          )}
        </div>

        {/* ══ Contactstrip ══ */}
        {related.length > 0 && (
          <section className="pl-wrap" aria-labelledby="pl-rel">
            <div className="pl-band">
              <div className="pl-band__t">
                <h2 id="pl-rel" className="pl-h2" style={{ fontSize: 'clamp(1.2rem,1.8vw,1.5rem)' }}>
                  Verwante platen
                </h2>
                <span className="pl-label">{article?.category}</span>
              </div>
              <Link href="/staging/nieuws" className="pl-read">
                <span>Het hele archief</span>
                <span className="pl-read__rule" aria-hidden="true" />
                <Ico.arrow />
              </Link>
            </div>

            <div className="pl-contact">
              {related.map(r => (
                <Link key={r.slug} href={`/staging/artikel?slug=${r.slug}`}>
                  <span className="pl-contact__fig">
                    <span className="pl-emulsion" style={{ display: 'block' }}>
                      {r.imageUrl
                        ? <img src={IMG(r.imageUrl, 320)} alt="" loading="lazy" />
                        : <span style={{ position: 'absolute', inset: 0, background: 'var(--pl-plate-2)' }} />}
                    </span>
                  </span>
                  <span className="pl-contact__t">{r.title}</span>
                  <span className="pl-label pl-num">{r.readTime} min</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="pl-wrap">
          <AdPlate />
        </div>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Herschrijving op niveau: Claude · Beeld: NASA · ESA" />
    </div>
  )
}
