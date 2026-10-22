'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer artikel — /nieuws/[slug]

   Compositie: de ontwikkelstrook. Het leesniveau is de belichting; elke
   alinea komt tevoorschijn zodra zijn herschrijving binnen is. Dat is geen
   versiering: de rewrite kómt al per alinea binnen, dus de metafoor en het
   werkelijke gedrag vallen samen.

   De route is statisch per slug (generateStaticParams + generateMetadata in
   page.tsx). page.tsx parseert de markdown tijdens de build en geeft hem als
   `initial` mee, zodat kop, beeld en originele tekst in de statische HTML
   staan. Alleen zonder `initial` haalt de client /content/articles/<slug>.md
   op. Herschrijven, verrijking en verwante platen blijven client-side.
   ══════════════════════════════════════════════════════════════════════════ */

import { Fragment, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { SiteFooter } from '@/app/components/SiteFooter'
import { LEVELS, type ReadingLevel } from '@/types'
import { type ArticleData, type Enrichment, type Kerncijfer, PROXY, IMG, parseMarkdown } from '@/lib/article-data'
import { type Article } from '@/lib/home-content'
import { MISSIONS } from '@/lib/missions-data'
import { TOPICS } from '@/lib/topics'
import { Ico, Tip } from '@/app/_plate/Instruments'
import {
  archivo, FOOTER_COLS, PlateHead, AdPlate, editionLabel, Ladder, plateNo, UitrustingVerwijzing,
} from '@/app/_plate/shared'

const ORDER: ReadingLevel[] = ['original', 'beginner', 'amateur', 'pro']
const LADDER: Record<Exclude<ReadingLevel, 'original'>, 'beg' | 'ama' | 'pro'> = {
  beginner: 'beg', amateur: 'ama', pro: 'pro',
}
const LEVEL_STORE = 'nightgazer_leesniveau_artikel'

/* Categorie → missiepagina. Naam, agentschap en status komen uit de
   missiedata zelf, zodat de kaart nooit iets beweert dat daar niet staat. */
const CATEGORY_TO_MISSION: Record<string, string> = {
  'james-webb': 'jwst', jwst: 'jwst', kosmologie: 'jwst',
  missies: 'starship', mars: 'perseverance', artemis: 'artemis', maan: 'artemis',
}

/* ── NASA-beeld voor platen zonder eigen beeld ─────────────────────────────
   Overgenomen van de vorige artikelpagina: zoekwoorden uit titel en tags,
   dan alleen de titel, dan de categorie. Deterministisch per slug, zodat
   hetzelfde artikel steeds hetzelfde beeld krijgt. */
const STOP = new Set([
  'a','an','the','of','in','to','for','on','at','by','from','and','or',
  'with','is','are','was','its','it','as','be','do','go','up','no','so',
  'if','live','coverage','how','nasa','esas','nasas',
  'makes','made','launches','launched','ready','preparing','gets','new',
  'returns','second','first','third','next','last','latest','update','updates',
  'invites','selects','selected','catches','finds','found','blog','sols',
  'data','stream','added','daily','minor','plane','bit','wave','rolls',
  'roll','oddly','high','rates','restless','unexpectedly','further',
  'teases','another','shot','ahead','about','will','has','have','had',
  'this','that','then','than','when','where','which',
])
const CAT_QUERIES: Record<string, string> = {
  missies: 'rocket launch spacecraft mission', missions: 'rocket launch spacecraft mission',
  'james-webb': 'james webb space telescope',
  kosmologie: 'galaxy nebula deep space hubble', cosmology: 'galaxy nebula deep space hubble',
  mars: 'mars surface curiosity rover',
  sterrenkijken: 'telescope observatory night sky', observing: 'telescope observatory night sky',
  educatie: 'astronaut spacewalk earth orbit', education: 'astronaut spacewalk earth orbit',
}

function imageQueries(a: ArticleData, slug: string): string[] {
  const title = (a.title || slug.replace(/-/g, ' '))
    .toLowerCase()
    .replace(/[''`'"]/g, '')
    .replace(/[^a-z0-9\-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => {
      if (!w || w.length < 2) return false
      if (/^[a-z\d]+-\d/.test(w) || /^\d+-[a-z]/.test(w)) return true
      return w.length > 2 && !STOP.has(w)
    })
    .slice(0, 6)
    .join(' ')
  const tags = (a.tags || [])
    .slice(0, 4)
    .map(t => t.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim())
    .filter(t => t.length > 2 && !STOP.has(t))
    .join(' ')
  const combined = [title, tags].filter(Boolean).join(' ')
    .split(/\s+/)
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 7)
    .join(' ')
  const cat = CAT_QUERIES[a.category?.toLowerCase() || ''] || 'space telescope astronomy'
  return [combined, title, cat].filter((q, i, arr) => q && arr.indexOf(q) === i)
}

/** Tag → onderwerp-pagina, alleen als die echt bestaat. */
function tagTopic(tag: string): string | null {
  const t = tag.toLowerCase()
  return TOPICS.find(x => x.slug === t || x.label.toLowerCase() === t)?.slug ?? null
}

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

/* ── Kerncijfers: drie waarden als een strook meetwaarden in de tekst ── */
function Cijfers({ items }: { items: Kerncijfer[] }) {
  return (
    <dl className="pl-cijfers" data-n={items.length}>
      {items.map(k => (
        <div key={k.label}>
          <dt className="pl-label">{k.label}</dt>
          <dd><span className="pl-cijfers__v">{k.waarde}</span>{k.eenheid && <span className="pl-cijfers__u"> {k.eenheid}</span>}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ── Citaat: alleen een uitspraak die letterlijk in het artikel staat ── */
function Citaat({ tekst, wie }: { tekst: string; wie: string }) {
  return (
    <figure className="pl-pull">
      <blockquote>{tekst}</blockquote>
      {wie && <figcaption>{wie}</figcaption>}
    </figure>
  )
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function ArtikelPlaat({ slug, initial = null }: {
  slug: string
  /** Tijdens de build geparseerd; staat daarmee in de statische HTML. */
  initial?: ArticleData | null
}) {
  const [article, setArticle] = useState<ArticleData | null>(initial)
  const [notFound, setNotFound] = useState(false)
  const [level, setLevel] = useState<ReadingLevel>('original')
  const [texts, setTexts] = useState<string[]>(initial?.paragraphs ?? [])
  const [states, setStates] = useState<ParaState[]>(() => (initial?.paragraphs ?? []).map(() => 'developed'))
  const [busy, setBusy] = useState(false)
  const [enrich, setEnrich] = useState<Enrichment | null>(null)
  const [related, setRelated] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [index, setIndex] = useState(-1)
  const [nasaImage, setNasaImage] = useState<{ url: string; credit: string } | null>(null)
  const [progress, setProgress] = useState(0)

  const cache = useRef<Partial<Record<ReadingLevel, string[]>>>(initial ? { original: initial.paragraphs } : {})
  const runId = useRef(0)

  /* De plaat ophalen — alleen als de build hem niet al meegaf */
  useEffect(() => {
    if (!slug || initial) return
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
  }, [slug, initial])

  /* Verwante platen en het archieftotaal */
  useEffect(() => {
    if (!article) return
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((list: Article[]) => {
        const cat = article.category.toLowerCase()
        setTotal(list.length)
        setIndex(list.findIndex(a => a.slug === slug))
        setRelated(
          list.filter(a => a.slug !== slug && a.category.toLowerCase() === cat).slice(0, 6)
        )
      })
      .catch(() => { /* zonder index geen contactstrip, geen ramp */ })
  }, [article, slug])

  /* Geen eigen beeld: zoek er een in de NASA-beeldbank. Faalt stil. */
  useEffect(() => {
    if (!article || article.imageUrl) return
    let alive = true
    const hash = slug.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0)
    const tryFetch = async (q: string, page: number) => {
      try {
        const res = await fetch(`${PROXY}/image-search?q=${encodeURIComponent(q)}&page=${page}&hash=${hash}`)
        if (!res.ok) return false
        const data = await res.json()
        if (!data?.url) return false
        if (alive) setNasaImage({ url: data.url, credit: data.credit || 'NASA' })
        return true
      } catch { return false }
    }
    ;(async () => {
      const page = (hash % 3) + 1
      for (const q of imageQueries(article, slug)) {
        if (!alive) return
        if (await tryFetch(q, page)) return
        if (await tryFetch(q, 1)) return
      }
    })()
    return () => { alive = false }
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

  /* Kerncijfers en kernfeiten in de kantlijn — alleen voor oudere artikelen
     zonder eigen kernpunten; nieuwe artikelen brengen ze statisch mee. */
  useEffect(() => {
    if (!article || article.kernpunten.length > 0) return
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

  const imageUrl = article?.imageUrl || nasaImage?.url || ''
  const imageCredit = article?.imageCredit || nasaImage?.credit || ''
  const mission = useMemo(() => {
    const id = CATEGORY_TO_MISSION[article?.category?.toLowerCase() ?? '']
    return id ? MISSIONS.find(m => m.id === id) ?? null : null
  }, [article])

  const structured = !!article && article.kernpunten.length > 0
  const headings = useMemo(
    () => (article?.blocks ?? []).filter((b): b is Extract<typeof b, { t: 'h' }> => b.t === 'h'),
    [article],
  )

  /* Welke sectie leest de lezer nu? Voor de inhoudsopgave in de kantlijn. */
  const [current, setCurrent] = useState('')
  useEffect(() => {
    if (!headings.length) return
    const els = headings.map(h => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e)
    const onScroll = () => {
      let id = ''
      for (const el of els) if (el.getBoundingClientRect().top < window.innerHeight * 0.35) id = el.id
      setCurrent(id)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  /* Waar komen cijfers en citaat in de tekst? Cijfers na de eerste sectie,
     het citaat bij de volgende tussenkop, zodat elke overgang er hooguit
     één krijgt. Zonder koppen: na alinea 2 en 4. */
  const slots = useMemo(() => {
    const b = article?.blocks ?? []
    const hs = b.map((x, i) => x.t === 'h' ? i : -1).filter(i => i >= 0)
    const cijfers = hs.length ? hs[0] : Math.min(2, b.length)
    let citaat = hs.length > 2 ? hs[1] : hs.length > 1 ? hs[hs.length - 1] : Math.min(4, b.length)
    if (citaat === cijfers) citaat = b.length
    return { cijfers, citaat }
  }, [article])

  const developing = useMemo(() => states.filter(s => s === 'latent').length, [states])
  const failed = useMemo(() => states.filter(s => s === 'failed').length, [states])

  if (notFound) {
    return (
      <div className={`pl ${archivo.variable}`}>
        <PlateHead total={0} edition={editionLabel()} current="nieuws" totalLabel="platen" />
        <main id="pl-main" className="pl-stack">
          <div className="pl-wrap">
            <div className="pl-plate" style={{ padding: '56px 24px', display: 'grid', gap: 14, justifyItems: 'start' }}>
              <h1 className="pl-h2">Deze plaat zit niet in het archief</h1>
              <p className="pl-body-s">
                Het artikel kon niet geladen worden. Probeer het opnieuw, of zoek
                verder in het archief.
              </p>
              <Link href="/nieuws/" className="pl-btn">Naar het archief</Link>
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
                  <span className="pl-num">{total > 0 && index >= 0 ? plateNo(total, index) : '—'}</span>
                  <span className="pl-meta__tick" aria-hidden="true" />
                  <span>{article.category}</span>
                  <span className="pl-meta__tick" aria-hidden="true" />
                  <span className="pl-num">{article.date}</span>
                  <span className="pl-meta__tick" aria-hidden="true" />
                  <span className="pl-num">{article.readTime} min</span>
                </div>

                <h1>{article.title}</h1>

                {imageUrl && (
                  <figure className={`pl-read-fig${structured ? ' pl-read-fig--wide' : ''}`}>
                    <div className="pl-emulsion">
                      <img src={IMG(imageUrl, 1200)} alt={article.imageAlt && article.imageAlt !== article.title ? article.imageAlt : ''} />
                    </div>
                    {imageCredit && <figcaption>Beeld · {imageCredit}</figcaption>}
                  </figure>
                )}

                {structured && (
                  <section className="pl-kort" aria-labelledby="pl-kort">
                    <h2 id="pl-kort" className="pl-label">In het kort</h2>
                    <ul>
                      {article.kernpunten.map(k => <li key={k}>{k}</li>)}
                    </ul>
                  </section>
                )}

                {developing > 0 && (
                  <p className="pl-label" role="status" style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                    <span className="pl-dot pl-live" aria-hidden="true" />
                    {developing} van {texts.length} alinea&rsquo;s aan het ontwikkelen
                  </p>
                )}

                <div className="pl-prose">
                  {article.blocks.map((b, n) => (
                    <Fragment key={b.t === 'h' ? b.id : `${level}-${b.i}`}>
                      {n === slots.cijfers && article.kerncijfers.length > 0 && <Cijfers items={article.kerncijfers} />}
                      {n === slots.citaat && article.citaat && <Citaat {...article.citaat} />}
                      {b.t === 'h'
                        ? <h2 id={b.id} className="pl-tkop">{b.text}</h2>
                        : <Para text={texts[b.i] ?? ''} state={states[b.i] ?? 'developed'} lead={b.i === 0} />}
                    </Fragment>
                  ))}
                  {slots.citaat >= article.blocks.length && article.citaat && <Citaat {...article.citaat} />}
                </div>

                {failed > 0 && developing === 0 && (
                  <p className="pl-fail" style={{ marginTop: 24 }}>
                    {failed} van {texts.length} alinea&rsquo;s kon niet herschreven worden.
                    Die staan hierboven in de oorspronkelijke tekst, niet in een
                    verzonnen versie.
                  </p>
                )}

                {article.sourceUrl && (
                  <p className="pl-body-s" style={{ marginTop: 30 }}>
                    Bron:{' '}
                    <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                      {article.source || new URL(article.sourceUrl).hostname}
                    </a>
                    . Deze Nederlandse versie is met AI-ondersteuning geschreven op basis van het oorspronkelijke artikel.
                  </p>
                )}

                {article.tags.length > 0 && (
                  <div className="pl-terms" style={{ marginTop: 30 }}>
                    {article.tags.map(t => {
                      const topic = tagTopic(t)
                      return topic
                        ? <Link key={t} href={`/nieuws/onderwerp/${topic}/`}>{t}</Link>
                        : <span key={t}>{t}</span>
                    })}
                  </div>
                )}
              </article>

              <aside className={`pl-read-side pl-read-side--rail${structured && !mission ? ' pl-read-side--toc' : ''}`}>
               <div className="pl-read-side__in">
                {mission && (
                  <Link href={`/missies/${mission.id}/`} className="pl-mission pl-lift">
                    <span className="pl-label">Gerelateerde missie</span>
                    <strong className="pl-h3">{mission.name}</strong>
                    <span className="pl-meta">
                      <span>{mission.agency}</span>
                      <span className="pl-meta__tick" aria-hidden="true" />
                      <span
                        className="pl-status"
                        data-on={mission.status === 'actief' ? '1' : '0'}
                        style={{ color: mission.status === 'actief' ? 'var(--pl-good)' : mission.status === 'mislukt' ? 'var(--pl-warn)' : 'var(--pl-ink-3)' }}
                      >
                        <i aria-hidden="true" />{mission.status}
                      </span>
                    </span>
                  </Link>
                )}

                {structured ? (
                  headings.length > 1 && (
                    <nav className="pl-toc" aria-label="Op deze pagina">
                      <p className="pl-label">Op deze pagina</p>
                      <ol>
                        {headings.map((h, i) => (
                          <li key={h.id}>
                            <a href={`#${h.id}`} aria-current={current === h.id ? 'location' : undefined}>
                              <span className="pl-num">{String(i + 1).padStart(2, '0')}</span>
                              {h.text}
                            </a>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  )
                ) : (<>
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
                </>)}
               </div>
              </aside>
            </div>
          )}
        </div>

        {/* ══ Uitrusting, alleen bij onderwerpen die je zelf kunt zien ══ */}
        {['sterrenkijken', 'kometen'].includes(article?.category?.toLowerCase() ?? '') && (
          <div className="pl-wrap">
            <UitrustingVerwijzing tekst="Zelf naar buiten? Van rood lampje tot eerste telescoop: dit heb je nodig om meer te zien." />
          </div>
        )}

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
              <Link href="/nieuws/" className="pl-read">
                <span>Het hele archief</span>
                <span className="pl-read__rule" aria-hidden="true" />
                <Ico.arrow />
              </Link>
            </div>

            <div className="pl-contact">
              {related.map(r => (
                <Link key={r.slug} href={`/nieuws/${r.slug}/`}>
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
          <AdPlate slot="2395877471" />
        </div>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Herschrijving op niveau: Claude · Beeld: NASA · ESA" />
    </div>
  )
}
