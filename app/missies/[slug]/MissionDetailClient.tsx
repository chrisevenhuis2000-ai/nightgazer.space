'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getMissionBySlug, MISSIONS, MISSIONS_LAST_UPDATED } from '@/lib/missions-data'
import { AdUnit } from '@/app/components/AdUnit'
import { SiteFooter, type FooterCol } from '@/app/components/SiteFooter'

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

interface Article {
  slug:      string
  title:     string
  excerpt:   string
  category:  string
  catColor:  string
  author:    string
  date:      string
  readTime:  number
  featured:  boolean
  imageUrl?: string
}

const NAV_LINKS = [
  { href: '/nieuws',        label: 'Nieuws' },
  { href: '/sterrenkijken', label: 'Sterrenkijken' },
  { href: '/missies',       label: 'Missies' },
  { href: '/educatie',      label: 'Educatie' },
]

const STATUS_STYLE = {
  actief:   { bg: 'rgba(61,223,144,0.15)',  color: '#3ddf90', label: 'Actief' },
  gepland:  { bg: 'rgba(55,138,221,0.15)',  color: '#378ADD', label: 'Gepland' },
  voltooid: { bg: 'rgba(74,90,138,0.15)',   color: '#8A9BC4', label: 'Voltooid' },
  mislukt:  { bg: 'rgba(224,104,90,0.15)',  color: '#E0685A', label: 'Mislukt' },
}

// ── Starfield ───────────────────────────────────────────────────────────────
function Starfield() {
  useEffect(() => {
    const canvas = document.getElementById('detail-starfield') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.9 + 0.15,
      o: Math.random() * 0.4 + 0.08,
      s: (Math.random() - 0.5) * 0.01,
    }))
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      for (const s of stars) {
        s.o += s.s
        if (s.o > 0.55 || s.o < 0.06) s.s *= -1
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(210,220,255,${s.o.toFixed(2)})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas id="detail-starfield" suppressHydrationWarning aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ── Topbar ──────────────────────────────────────────────────────────────────
function Topbar() {
  const [date, setDate] = useState('')
  useEffect(() => {
    setDate(new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])
  return (
    <div role="banner" style={{ position: 'relative', zIndex: 30, height: 'var(--topbar-h)', background: 'rgba(26,26,46,0.97)', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', gap: 20, backdropFilter: 'blur(12px)' }} className="topbar-pad">
      <span suppressHydrationWarning className="topbar-date" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.15em', color: '#7A86A8', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      <div style={{ flex: 1 }} />
      <nav style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', flexShrink: 0 }}>
        <Link href="/" style={{ color: '#FFFFFF' }}>NL</Link>
      </nav>
    </div>
  )
}

// ── Navigation ───────────────────────────────────────────────────────────────
function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = useCallback(() => setMobileOpen(false), [])
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, close])
  return (
    <nav aria-label="Hoofdnavigatie" style={{ position: 'sticky', top: 0, zIndex: 20, height: 'var(--nav-h)', background: 'rgba(26,26,46,0.96)', borderBottom: '1px solid #252858', backdropFilter: 'blur(16px)' }}>
      <div className="nav-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 40 }}>
        <Link href="/" aria-label="NightGazer — naar de startpagina" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 46, width: 'auto', display: 'block' }} />
        </Link>
        <ul className="nav-links" role="list" style={{ gap: 32, flex: 1, justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = href === '/missies'
            return (
              <li key={href}>
                <Link href={href} style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: isActive ? '#FFFFFF' : '#7A86A8', textDecoration: 'none', padding: '8px 0', borderBottom: isActive ? '1px solid #378ADD' : 'none' }}>{label}</Link>
              </li>
            )
          })}
        </ul>
        <div style={{ flexShrink: 0 }}>
          <button className="nav-hamburger" aria-label="Menu" onClick={() => setMobileOpen(o => !o)} style={{ flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: 22, height: 2, background: '#8A9BC4', borderRadius: 1 }} />)}
          </button>
        </div>
      </div>
    </nav>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────────
const FOOTER_TAGLINE = 'Nederlandstalig ruimtevaartnieuws — van Mars-rovers tot telescopen aan de rand van het heelal.'
const FOOTER_COLS: FooterCol[] = [
  { title: 'Pagina\'s', links: [['Home', '/'], ['Nieuws', '/nieuws'], ['Missies', '/missies'], ['Sterrenkijken', '/sterrenkijken'], ['Educatie', '/educatie']] },
  { title: 'Bronnen',   links: [['NASA', 'https://nasa.gov'], ['ESA', 'https://esa.int'], ['SpaceX', 'https://spacex.com']] },
]

// ── Article card ─────────────────────────────────────────────────────────────
function ArticleCard({ article }: { article: Article }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={`/nieuws/${article.slug}`} style={{ textDecoration: 'none', display: 'block', border: `1px solid ${hovered ? 'rgba(55,138,221,0.3)' : 'transparent'}`, transition: 'border-color 0.2s', background: '#12132A', overflow: 'hidden' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {article.imageUrl ? (
        <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
          <img src={`https://images.weserv.nl/?url=${encodeURIComponent(article.imageUrl)}&w=640&h=280&fit=cover&output=webp`} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,19,42,0.9) 0%, transparent 60%)' }} />
        </div>
      ) : (
        <div style={{ height: 100, background: 'linear-gradient(135deg, #080c1a, #101828)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.6rem', opacity: 0.3 }}>🚀</span>
        </div>
      )}
      <div style={{ padding: '14px 16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: article.catColor || '#378ADD' }}>{article.category}</span>
          <span style={{ color: '#252858' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#7A86A8' }}>{article.readTime} min</span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.35, marginBottom: 6 }}>{article.title}</h3>
        <p style={{ fontSize: '0.73rem', color: '#8A9BC4', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.excerpt}</p>
      </div>
    </Link>
  )
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: '#252858' }} />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function MissionDetailClient({ slug }: { slug: string }) {
  const mission = getMissionBySlug(slug)
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    if (!mission) return
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => {
        if (!Array.isArray(data)) return
        const tags = mission.relatedTags.map(t => t.toLowerCase())
        const filtered = data.filter(a =>
          tags.some(t =>
            a.slug.toLowerCase().includes(t) ||
            a.title.toLowerCase().includes(t) ||
            (a.category ?? '').toLowerCase().includes(t)
          )
        )
        setArticles(filtered.slice(0, 3))
      })
      .catch(() => {})
  }, [mission])

  if (!mission) {
    return (
      <div style={{ minHeight: '100vh', background: '#04050f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: '#8A9BC4', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Missie niet gevonden.</p>
        <Link href="/missies" style={{ color: '#378ADD', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>← Terug naar missies</Link>
      </div>
    )
  }

  const st = STATUS_STYLE[mission.status]
  const others = MISSIONS.filter(m => m.id !== slug).slice(0, 3)

  return (
    <>
      <a href="#main-content" className="skip-link">Ga naar hoofdinhoud</a>
      <Starfield />
      <Topbar />
      <SiteNav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${mission.bgFrom} 0%, ${mission.bgTo} 100%)` }} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,40,88,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(37,40,88,0.25) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,5,15,1) 0%, rgba(4,5,15,0.3) 60%, transparent 100%)' }} />

        <div className="hero-content-pad" style={{ position: 'relative', zIndex: 2, paddingTop: 64, paddingBottom: 72 }}>
          {/* Breadcrumb */}
          <Link href="/missies" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A86A8', textDecoration: 'none', marginBottom: 32, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7A86A8')}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><path d="M11 6H1M5 10l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Alle missies
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '4rem', lineHeight: 1, flexShrink: 0 }}>{mission.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: mission.agencyColor }}>{mission.agency}</span>
                <span style={{ background: st.bg, color: st.color, fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 2, border: `1px solid ${st.color}40`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {mission.status === 'actief' && <span className="animate-pulse-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: st.color }} />}
                  {st.label}
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.6rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.08, marginBottom: 16, letterSpacing: '-0.01em' }}>{mission.name}</h1>
              <p style={{ fontSize: '1rem', color: '#8A9BC4', lineHeight: 1.7, maxWidth: 580, marginBottom: 0 }}>{mission.objective}</p>
            </div>
          </div>

          {/* Highlight callout */}
          <div style={{ marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: `${mission.agencyColor}12`, border: `1px solid ${mission.agencyColor}30`, borderRadius: 2 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 12 12"><path d="M6 1l1.5 3 3.5.5-2.5 2.4.6 3.5L6 8.9l-3.1 1.5.6-3.5L1 4.5 4.5 4z" stroke={mission.agencyColor} strokeWidth="1" fill="none" /></svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#8A9BC4' }}>{mission.highlight}</span>
          </div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="main-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--max-w)', margin: '0 auto' }}>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2, background: '#252858', border: '1px solid #252858', marginBottom: 72, marginTop: -2 }}>
          {[
            { label: 'Lancering',    value: mission.launched },
            { label: 'Bestemming',   value: mission.body },
            { label: 'Voertuig',     value: mission.vehicle },
            { label: 'Duur',         value: mission.duration },
            { label: 'Afstand',      value: mission.distanceKm },
            { label: 'Lanceerbasis', value: mission.launchSite },
          ].map(s => (
            <div key={s.label} style={{ background: '#12132A', padding: '18px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.71rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.79rem', color: '#FFFFFF', lineHeight: 1.4 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Last updated */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.71rem', color: '#7A86A8', textAlign: 'right', margin: '-16px 0 48px' }}>
          Bijgewerkt: {new Date(MISSIONS_LAST_UPDATED).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* Description */}
        <section aria-labelledby="desc-label" style={{ marginBottom: 72 }}>
          <SectionLabel>Over de missie</SectionLabel>
          <div className="mission-desc-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'start' }}>
            <p style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.85, margin: 0 }}>{mission.description}</p>
            <a href={mission.missionUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: mission.agencyColor, textDecoration: 'none', padding: '8px 16px', border: `1px solid ${mission.agencyColor}40`, borderRadius: 2, whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${mission.agencyColor}12`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Officiële pagina ↗
            </a>
          </div>
        </section>

        {/* Key facts */}
        <section aria-labelledby="facts-label" style={{ marginBottom: 72 }}>
          <SectionLabel>Kerngegevens</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2, background: '#252858', border: '1px solid #252858' }}>
            {mission.facts.map(f => (
              <div key={f.label} style={{ background: '#12132A', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.71rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A86A8' }}>{f.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.79rem', color: '#FFFFFF', lineHeight: 1.4 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section aria-labelledby="timeline-label" style={{ marginBottom: 72 }}>
          <SectionLabel>Tijdlijn</SectionLabel>
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div className="mission-timeline-line" style={{ position: 'absolute', left: 88, top: 0, bottom: 0, width: 1, background: '#252858' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {mission.timeline.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                  {/* Date */}
                  <div className="mission-timeline-date" style={{ width: 88, flexShrink: 0, paddingRight: 20, paddingTop: 18, paddingBottom: 18 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#7A86A8', letterSpacing: '0.06em', display: 'block', textAlign: 'right' }}>{entry.date}</span>
                  </div>
                  {/* Dot */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', paddingTop: 22 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: mission.agencyColor, boxShadow: `0 0 8px ${mission.agencyColor}66`, flexShrink: 0, marginLeft: -3 }} />
                  </div>
                  {/* Event */}
                  <div style={{ flex: 1, paddingLeft: 20, paddingTop: 16, paddingBottom: 16, borderBottom: i < mission.timeline.length - 1 ? '1px solid rgba(37,40,88,0.4)' : 'none' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.79rem', color: '#FFFFFF', lineHeight: 1.55, margin: 0 }}>{entry.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advertentie: tussen tijdlijn en gerelateerd nieuws */}
        <AdUnit slot="7516342216" style={{ margin: '0 0 40px' }} />

        {/* Related news */}
        {articles.length > 0 && (
          <section aria-labelledby="nieuws-label" style={{ marginBottom: 72 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <SectionLabel>Gerelateerd nieuws</SectionLabel>
              <Link href="/nieuws" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#378ADD', textDecoration: 'none', letterSpacing: '0.08em', flexShrink: 0, marginLeft: 16 }}>Alle nieuws →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2, background: '#252858', border: '1px solid #252858' }}>
              {articles.map(a => <ArticleCard key={a.slug} article={a} />)}
            </div>
          </section>
        )}

        {/* Other missions */}
        <section aria-labelledby="other-label" style={{ marginBottom: 80 }}>
          <SectionLabel>Andere missies</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2, background: '#252858', border: '1px solid #252858' }}>
            {others.map(m => {
              const ost = STATUS_STYLE[m.status]
              return (
                <Link key={m.id} href={`/missies/${m.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 20px', background: '#12132A', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = `linear-gradient(145deg, ${m.bgFrom}, ${m.bgTo})`)}
                  onMouseLeave={e => (e.currentTarget.style.background = '#12132A')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                    <span style={{ background: ost.bg, color: ost.color, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2 }}>{ost.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>{m.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: m.agencyColor, letterSpacing: '0.08em' }}>{m.agency}</div>
                  <p style={{ fontSize: '0.75rem', color: '#8A9BC4', margin: 0, lineHeight: 1.6 }}>{m.objective}</p>
                </Link>
              )
            })}
          </div>
        </section>

      </main>

      <SiteFooter cols={FOOTER_COLS} tagline={FOOTER_TAGLINE} note="Afbeeldingen: NASA · ESA · SpaceX" />
    </>
  )
}
