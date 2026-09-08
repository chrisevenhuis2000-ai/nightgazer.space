'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MISSIONS } from '@/lib/missions-data'
import { AdUnit } from './components/AdUnit'
import { SiteFooter, type FooterCol } from './components/SiteFooter'
import {
  PROXY, APOD_CACHE_KEY,
  type APODData, type ISSData, type Article,
  FALLBACK_ARTICLES, getLevel, LEVEL_LABEL, LEVEL_COLOR,
  slugHash, articleVisual, TICKER_FALLBACK,
  TOPICS, topicMatches, PAGE_SIZE,
  SK_DARK_SPOTS, type QuizLevel, DAILY_QUESTIONS, skDist,
  SPACE_EVENTS, CAT_COLORS, daysUntil,
} from '@/lib/home-content'








// ── Starfield canvas ───────────────────────────────────────────────────────
function Starfield() {
  useEffect(() => {
    const canvas = document.getElementById('cosmosnl-starfield') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.9 + 0.15,
      o: Math.random() * 0.45 + 0.08,
      s: (Math.random() - 0.5) * (prefersReducedMotion ? 0 : 0.012),
    }))
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      for (const s of stars) {
        s.o += s.s
        if (s.o > 0.58 || s.o < 0.06) s.s *= -1
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
  return <canvas id="cosmosnl-starfield" suppressHydrationWarning aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ── Topbar ─────────────────────────────────────────────────────────────────
function Topbar({ items }: { items: string[] }) {
  const [date, setDate] = useState('')
  useEffect(() => {
    setDate(new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])
  return (
    <div role="banner" style={{ position: 'relative', zIndex: 30, height: 'var(--topbar-h)', background: 'rgba(26,26,46,0.97)', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', gap: 20, backdropFilter: 'blur(12px)' }} className="topbar-pad">
      <span suppressHydrationWarning className="topbar-date" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.15em', color: '#7A86A8', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      <div aria-hidden="true" className="ticker-mask" style={{ flex: 1, overflow: 'hidden' }}>
        <div className="ticker-scroll" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {[...items, ...items].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 48, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#7A86A8', letterSpacing: '0.06em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3dcfdf', flexShrink: 0, display: 'inline-block' }} />
              {item}
            </span>
          ))}
        </div>
      </div>
      <nav role="navigation" aria-label="Taal selectie" style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', flexShrink: 0 }}>
        <Link href="/" style={{ color: '#FFFFFF' }} aria-current="true">NL</Link>
      </nav>
    </div>
  )
}

// ── Navigation ─────────────────────────────────────────────────────────────
function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = useCallback(() => setMobileOpen(false), [])
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, close])
  const navLinks = [
    { href: '/nieuws',        label: 'Nieuws' },
    { href: '/sterrenkijken', label: 'Sterrenkijken' },
    { href: '/missies',       label: 'Missies' },
    { href: '/educatie',      label: 'Educatie' },
  ]
  return (
    <>
      <nav aria-label="Hoofdnavigatie" style={{ position: 'sticky', top: 0, zIndex: 20, height: 'var(--nav-h)', background: 'rgba(26,26,46,0.96)', borderBottom: '1px solid #252858', backdropFilter: 'blur(16px)' }}>
        <div className="nav-pad nav-inner" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 40 }}>
          <Link href="/" aria-label="NightGazer — naar de startpagina" style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo-transparent.png" alt="NightGazer" className="nav-logo" style={{ height: 46, width: 'auto', display: 'block' }} />
          </Link>
          <ul className="nav-links" role="list" style={{ gap: 32, flex: 1, justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BC4', textDecoration: 'none', transition: 'color 0.15s', padding: '8px 0' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
                >{label}</Link>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
              aria-label="Zoeken (Ctrl+K)"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(42,48,96,0.5)', border: '1px solid #252858', borderRadius: 6, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#378ADD')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#252858')}
            >
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>🔍</span>
              <span className="nav-search-text">Zoek…</span>
              <kbd className="nav-search-kbd">⌘K</kbd>
            </button>
            <button className="nav-hamburger" aria-expanded={mobileOpen} aria-controls="mobile-nav" aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'} onClick={() => setMobileOpen(o => !o)} style={{ flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ display: 'block', width: 22, height: 2, background: '#8A9BC4', borderRadius: 1, transition: 'transform 0.25s, opacity 0.25s', transform: mobileOpen ? i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : 'none' : 'none', opacity: mobileOpen && i === 1 ? 0 : 1 }} />
              ))}
            </button>
          </div>
        </div>
      </nav>
      {mobileOpen && (
        <div id="mobile-nav" role="navigation" aria-label="Mobiele navigatie" style={{ position: 'fixed', top: 'calc(var(--topbar-h) + var(--nav-h))', left: 0, right: 0, background: 'rgba(26,26,46,0.98)', borderBottom: '1px solid #252858', backdropFilter: 'blur(20px)', padding: '24px', zIndex: 19, display: 'flex', flexDirection: 'column', gap: 4, animation: 'fadeIn 0.2s ease both' }}>
          {[...navLinks].map(({ href, label }) => (
            <Link key={href} href={href} onClick={close} style={{ display: 'block', padding: '12px 0', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BC4', borderBottom: '1px solid #252858', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
            >{label}</Link>
          ))}
        </div>
      )}
    </>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ apod, featuredSlug }: { apod: APODData | null; featuredSlug: string }) {
  const heroHref   = apod ? 'https://apod.nasa.gov/apod/astropix.html' : `/nieuws/${featuredSlug}`
  const heroTarget = apod ? '_blank' : '_self'
  const heroLabel  = apod ? 'Bekijk op NASA' : 'Lees het artikel'
  return (
    <section aria-labelledby="hero-title" style={{ position: 'relative', zIndex: 1, minHeight: '88vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#12132A' }}>
        {apod?.media_type === 'image' && (
          <img src={`${PROXY}/image-proxy?url=${encodeURIComponent(apod.hdurl || apod.url)}&w=1400`} alt={apod.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, filter: 'brightness(0.85) saturate(1.15)' }} />
        )}
        {!apod && <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#12132A 0%,#1A2A4A 50%,#0a1020 100%)' }} />}
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0.75) 35%, rgba(26,26,46,0.1) 75%, transparent 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,26,46,0.55) 0%, transparent 60%)' }} />
      <div className="hero-content-pad animate-fadeUp" style={{ position: 'relative', zIndex: 2, maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div aria-hidden="true" style={{ width: 32, height: 1, background: '#378ADD' }} />
          <span role="status" aria-live="polite" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(224,80,64,0.15)', border: '1px solid rgba(224,80,64,0.4)', color: '#ff7060', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 2 }}>
            <span className="animate-pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05040', flexShrink: 0 }} aria-hidden="true" />
            NASA APOD
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', letterSpacing: '0.22em', color: '#378ADD', textTransform: 'uppercase' }}>Foto van de dag</span>
        </div>
        <h1 id="hero-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem,5.5vw,4.4rem)', fontWeight: 700, lineHeight: 1.06, color: '#FFFFFF', marginBottom: 20, letterSpacing: '-0.01em' }}>
          {apod?.title || 'Elke dag een nieuw venster op het heelal'}
        </h1>
        <p style={{ fontSize: '1rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520, marginBottom: 32 }}>
          {apod?.explanation ? apod.explanation.slice(0, 200) + '…' : 'NASA publiceert dagelijks de mooiste astronomische foto — wij leggen het uit op jouw niveau, van beginner tot professional.'}
        </p>
        <div className="hero-ctas" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={heroHref} target={heroTarget} rel="noopener noreferrer" className="btn-clip" style={{ background: '#FFFFFF', color: '#1A1A2E', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
          >
            {heroLabel}
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <a href="#nieuws" style={{ fontSize: '0.72rem', color: '#8A9BC4', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
          >
            Alle nieuws
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </div>
      {apod?.copyright && <div style={{ position: 'absolute', bottom: 16, right: 24, zIndex: 3, fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'rgba(120,130,160,0.5)' }}>© {apod.copyright}</div>}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 24, right: 40, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, #7A86A8, transparent)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A86A8', writingMode: 'vertical-rl' }}>Scroll</span>
      </div>
    </section>
  )
}

// ── Topics filter strip (controlled) ──────────────────────────────────────
function TopicsStrip({ active, onFilter, counts }: { active: string; onFilter: (t: string) => void; counts: Record<string, number> }) {
  return (
    <div role="navigation" aria-label="Onderwerp filter" style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid #252858', background: '#1A1A2E' }}>
      <div className="topics-pad" role="tablist" aria-label="Filter op onderwerp" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TOPICS.map(t => {
          const count = counts[t] ?? 0
          const isActive = active === t
          return (
            <button
              key={t}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilter(t)}
              style={{
                flexShrink: 0,
                padding: '13px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.77rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive ? '#FFFFFF' : '#8A9BC4',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid #378ADD' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#8A9BC4' }}
            >
              {t}
              {/* Article count badge */}
              {t !== 'Alles' && count > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 16, padding: '0 5px', background: isActive ? 'rgba(55,138,221,0.2)' : 'rgba(74,82,120,0.3)', color: isActive ? '#378ADD' : '#8A9BC4', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', borderRadius: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {count}
                </span>
              )}
              {isActive && <span aria-hidden="true" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#378ADD', marginLeft: 2 }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Bento card ─────────────────────────────────────────────────────────────
function BentoCard({ article, size }: { article: Article; size: 'hero' | 'md' | 'sm' }) {
  const thumbH   = size === 'hero' ? 320 : size === 'md' ? 180 : 130
  const { gradient, cx, cy } = articleVisual(article)
  const lvl  = getLevel(article.category)
  const lvlC = LEVEL_COLOR[lvl]

  return (
    <article className={`card-wrap bento-${size}`} style={{ background: '#12132A', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'background 0.25s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#16173A')}
      onMouseLeave={e => (e.currentTarget.style.background = '#12132A')}
    >
      <Link href={`/nieuws/${article.slug}`} aria-label={article.title} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: thumbH, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {/* Category top accent */}
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: article.catColor, zIndex: 2 }} />
          {/* Unique gradient background */}
          <div className="card-thumb-inner" style={{ width: '100%', height: '100%', background: gradient, position: 'relative' }}>
            {/* Actual image when available */}
            {article.imageUrl && (
              <img src={`${PROXY}/image-proxy?url=${encodeURIComponent(article.imageUrl)}&w=900`} alt="" aria-hidden="true"
                loading={size === 'hero' ? 'eager' : 'lazy'}
                fetchPriority={size === 'hero' ? 'high' : 'auto'}
                crossOrigin="anonymous"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7) saturate(1.1)' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            {/* Glow circle — unique position per article */}
            {!article.imageUrl && <div aria-hidden="true" style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, width: 120, height: 120, borderRadius: '50%', background: article.catColor, opacity: 0.18, filter: 'blur(28px)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />}
            {/* Category badge */}
            <span style={{ position: 'absolute', bottom: 12, left: 14, fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.catColor, background: 'rgba(26,26,46,0.75)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: 2, border: `1px solid ${article.catColor}30`, zIndex: 2 }}>
              {article.category}
            </span>
          </div>
        </div>
        <div style={{ padding: size === 'hero' ? 32 : size === 'md' ? 20 : 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 className={size === 'hero' ? 'bento-hero-title' : undefined} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.18, color: '#FFFFFF', fontSize: size === 'hero' ? '2rem' : size === 'md' ? '1.15rem' : '0.95rem', marginBottom: size === 'sm' ? 0 : 10 }}>
            {article.title}
          </h2>
          {size !== 'sm' && (
            <p style={{ fontSize: '0.92rem', color: '#8A9BC4', lineHeight: 1.65, flex: 1, display: '-webkit-box', WebkitLineClamp: size === 'hero' ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: size === 'hero' ? 20 : 16 }}>
              {article.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8', letterSpacing: '0.05em', marginTop: 'auto', paddingTop: size === 'sm' ? 8 : 12 }}>
            {size === 'hero' && <><span>{article.author}</span><span style={{ opacity: 0.4 }}>·</span></>}
            <span>{article.date}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{article.readTime} min</span>
            <span className="card-read-more" aria-hidden="true">Lees meer →</span>
          </div>
        </div>
      </Link>
    </article>
  )
}

// ── Article grid card ──────────────────────────────────────────────────────
// Replaces the old list row — richer card with unique visual + full excerpt
// ── Missies strip ──────────────────────────────────────────────────────────
function MissiesStrip() {
  const active = MISSIONS.filter(m => m.status === 'actief').slice(0, 5)
  return (
    <section aria-labelledby="missies-strip-label" style={{ margin: '32px 0 8px', borderTop: '1px solid #252858', paddingTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span id="missies-strip-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Actieve Missies</span>
          <div aria-hidden="true" style={{ width: 48, height: 1, background: '#2A2E62' }} />
        </div>
        <Link href="/missies" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none' }}>
          Alle missies →
        </Link>
      </div>
      <div className="missies-strip-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {active.map(m => (
          <Link key={m.id} href={`/missies/${m.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ background: `linear-gradient(135deg, ${m.bgFrom}, ${m.bgTo})`, border: '1px solid #252858', borderRadius: 6, padding: '14px 18px', minWidth: 160, maxWidth: 200, transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 130 }}
                 onMouseEnter={e => (e.currentTarget.style.borderColor = m.agencyColor)}
                 onMouseLeave={e => (e.currentTarget.style.borderColor = '#252858')}>
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: m.agencyColor, marginBottom: 4 }}>{m.agency}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>{m.name}</div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(61,207,111,0.12)', border: '1px solid rgba(61,207,111,0.25)', borderRadius: 20, padding: '2px 8px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3ddf90' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#3ddf90', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actief</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ArticleGridCard({ article }: { article: Article }) {
  const { gradient, cx, cy } = articleVisual(article)
  const lvl  = getLevel(article.category)
  const lvlC = LEVEL_COLOR[lvl]
  const [hovered, setHovered] = useState(false)

  return (
    <article
      style={{ background: hovered ? '#16173A' : '#12132A', border: '1px solid #252858', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s', borderColor: hovered ? article.catColor + '40' : '#252858', boxShadow: hovered ? `0 4px 32px ${article.catColor}18` : 'none', borderRadius: 2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/nieuws/${article.slug}`} aria-label={article.title} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>

        {/* Thumbnail — unique gradient per article */}
        <div style={{ height: 140, position: 'relative', overflow: 'hidden', flexShrink: 0, background: gradient }}>
          {/* Actual image when available */}
          {article.imageUrl && (
            <img src={`${PROXY}/image-proxy?url=${encodeURIComponent(article.imageUrl)}&w=800`} alt="" aria-hidden="true" loading="lazy" crossOrigin="anonymous"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65) saturate(1.1)' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          )}
          {/* Unique glow circle (only when no image) */}
          {!article.imageUrl && <div aria-hidden="true" style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, width: 100, height: 100, borderRadius: '50%', background: article.catColor, opacity: 0.2, filter: 'blur(24px)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />}
          {/* Bottom fade into card */}
          <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, transparent, rgba(12,14,24,0.9))' }} />
          {/* Hover zoom effect */}
          <div style={{ position: 'absolute', inset: 0, background: article.catColor, opacity: hovered ? 0.04 : 0, transition: 'opacity 0.25s' }} />
          {/* Category badge overlay */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.catColor, background: 'rgba(26,26,46,0.8)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: 2, border: `1px solid ${article.catColor}35` }}>
              {article.category}
            </span>
          </div>
          {/* Read time badge */}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#8A9BC4', background: 'rgba(26,26,46,0.7)', backdropFilter: 'blur(6px)', padding: '3px 7px', borderRadius: 2 }}>
              {article.readTime} min
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Title — the hero element */}
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.22, color: hovered ? '#fff' : '#FFFFFF', margin: 0, transition: 'color 0.15s', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h3>

          {/* Excerpt — gives the "why I should click" context */}
          <p style={{ fontSize: '0.78rem', color: '#8A9BC4', lineHeight: 1.65, margin: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.excerpt}
          </p>

          {/* Footer: level + date + hover arrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 10, borderTop: '1px solid #252858' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', background: lvlC.bg, color: lvlC.color, borderLeft: `2px solid ${lvlC.border}`, borderRadius: 2 }}>
              {LEVEL_LABEL[lvl]}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#7A86A8', marginLeft: 'auto' }}>
              {article.date}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: article.catColor, opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(-6px)', transition: 'opacity 0.15s, transform 0.15s' }} aria-hidden="true">
              → Lees
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

// ── Stargazing mini-widget ──────────────────────────────────────────────────

// ── Daily quiz widget ────────────────────────────────────────────────────────
function DailyQuizWidget() {
  const [level,    setLevel]    = useState<'beg' | 'ama' | 'pro'>('beg')
  const [selected, setSelected] = useState<number | null>(null)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Restore saved answer from localStorage when level changes
  useEffect(() => {
    if (!mounted) return
    const today = new Date().toISOString().slice(0, 10)
    try {
      const raw = localStorage.getItem(`quiz_${today}`)
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, number>
        setSelected(saved[level] !== undefined ? saved[level] : null)
      } else {
        setSelected(null)
      }
    } catch { /* ignore */ }
  }, [level, mounted])

  if (!mounted) return <div style={{ minHeight: 220, border: '1px solid #252858', background: '#16173A', borderRadius: 2 }} />

  const today  = new Date().toISOString().slice(0, 10)
  const dayIdx = Math.floor(Date.UTC(
    new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()
  ) / 86_400_000) % DAILY_QUESTIONS.length
  const q = DAILY_QUESTIONS[dayIdx]

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    try {
      const raw = localStorage.getItem(`quiz_${today}`)
      const saved = raw ? JSON.parse(raw) as Record<string, number> : {}
      saved[level] = idx
      localStorage.setItem(`quiz_${today}`, JSON.stringify(saved))
    } catch { /* ignore */ }
  }

  function switchLevel(lvl: 'beg' | 'ama' | 'pro') {
    setLevel(lvl)
    setSelected(null)
    try {
      const raw = localStorage.getItem(`quiz_${today}`)
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, number>
        setSelected(saved[lvl] !== undefined ? saved[lvl] : null)
      }
    } catch { /* ignore */ }
  }

  const variant = q[level]
  const answered = selected !== null
  const correct  = answered && selected === variant.correct

  const LVLS = [
    { key: 'beg' as const, label: 'Beginner', color: '#e05040', bg: 'rgba(224,80,64,0.1)',  border: 'rgba(224,80,64,0.4)'  },
    { key: 'ama' as const, label: 'Amateur',  color: '#3ddf90', bg: 'rgba(61,223,144,0.1)', border: 'rgba(61,223,144,0.4)' },
    { key: 'pro' as const, label: 'Pro',      color: '#3dcfdf', bg: 'rgba(61,207,223,0.1)', border: 'rgba(61,207,223,0.4)' },
  ]
  const activeLvl = LVLS.find(l => l.key === level)!

  return (
    <div role="region" aria-labelledby="quiz-widget-title" style={{ border: `1px solid ${answered ? (correct ? 'rgba(61,223,144,0.35)' : 'rgba(224,80,64,0.35)') : '#252858'}`, background: '#16173A', overflow: 'hidden', borderRadius: 2, transition: 'border-color 0.4s' }}>
      {/* Header */}
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span id="quiz-widget-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true">🧠</span>
          Vraag van de dag
        </span>
        {/* Level toggle */}
        <div role="group" aria-label="Kies niveau" style={{ display: 'flex', gap: 3 }}>
          {LVLS.map(l => (
            <button key={l.key} aria-pressed={level === l.key}
              onClick={() => switchLevel(l.key)}
              style={{ padding: '3px 9px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${level === l.key ? l.color : 'rgba(37,40,88,0.8)'}`, color: level === l.key ? l.color : '#7A86A8', background: level === l.key ? l.bg : 'transparent', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s' }}
            >{l.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Topic badge */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: activeLvl.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeLvl.color, display: 'inline-block', flexShrink: 0 }} aria-hidden="true" />
          {q.topic}
        </div>

        {/* Question */}
        <p style={{ fontSize: '0.86rem', fontWeight: 500, color: '#FFFFFF', lineHeight: 1.5, marginBottom: 14, margin: '0 0 14px' }}>{variant.q}</p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {variant.options.map((opt, i) => {
            const isSelected = selected === i
            const isCorrect  = i === variant.correct
            let bg = 'transparent', border = '#252858', color = '#8A9BC4'
            if (answered) {
              if (isCorrect)              { bg = 'rgba(61,223,144,0.12)'; border = '#3ddf90'; color = '#3ddf90' }
              else if (isSelected)        { bg = 'rgba(224,80,64,0.12)'; border = '#e05040'; color = '#e05040' }
            } else if (isSelected) {
              bg = activeLvl.bg; border = activeLvl.color; color = activeLvl.color
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                aria-pressed={isSelected}
                style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 2, cursor: answered ? 'default' : 'pointer', color, fontFamily: 'var(--font-sans)', fontSize: '0.78rem', lineHeight: 1.45, transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: 8 }}
                onMouseEnter={e => { if (!answered) { e.currentTarget.style.borderColor = activeLvl.color; e.currentTarget.style.color = '#FFFFFF' } }}
                onMouseLeave={e => { if (!answered) { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' } }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'inherit', flexShrink: 0, marginTop: 2 }}>{['A','B','C','D'][i]}</span>
                {opt}
                {answered && isCorrect  && <span aria-hidden="true" style={{ marginLeft: 'auto', flexShrink: 0 }}>✓</span>}
                {answered && isSelected && !isCorrect && <span aria-hidden="true" style={{ marginLeft: 'auto', flexShrink: 0 }}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {answered && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: correct ? 'rgba(61,223,144,0.07)' : 'rgba(224,80,64,0.07)', borderLeft: `2px solid ${correct ? '#3ddf90' : '#e05040'}`, animation: 'fadeIn 0.3s ease both' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: correct ? '#3ddf90' : '#e05040', marginBottom: 6 }}>
              {correct ? '✓ Correct!' : `✗ Niet helemaal — het juiste antwoord is ${['A','B','C','D'][variant.correct]}`}
            </div>
            <p style={{ fontSize: '0.76rem', color: '#B5D4F4', lineHeight: 1.7, margin: 0 }}>{variant.explain}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #252858', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8' }}>Morgen nieuwe vraag</span>
        <Link href="/educatie"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
        >
          Meer leren →
        </Link>
      </div>
    </div>
  )
}


function StargazingWidget() {
  const [score,    setScore]    = useState<number | null>(null)
  const [label,    setLabel]    = useState('Laden…')
  const [color,    setColor]    = useState('#7A86A8')
  const [clouds,   setClouds]   = useState<number | null>(null)
  const [temp,     setTemp]     = useState<number | null>(null)
  const [darkKm,   setDarkKm]   = useState<number | null>(null)
  const [darkName, setDarkName] = useState('')
  const [locName] = useState('Amsterdam')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const fetch20h = async (lat: number, lon: number) => {
      try {
        const url = `${PROXY}/weather?lat=${lat}&lon=${lon}`
        const res = await fetch(url)
        const d   = await res.json()
        const idx = 20
        const cc   = d.hourly.cloud_cover[idx]
        const hum  = d.hourly.relative_humidity_2m[idx]
        const wind = d.hourly.wind_speed_10m[idx]
        const temp = d.hourly.temperature_2m[idx]

        let s = 100
        if (cc   > 80) s -= 50; else if (cc   > 60) s -= 35; else if (cc   > 40) s -= 20; else if (cc   > 20) s -= 8
        if (hum  > 90) s -= 15; else if (hum  > 80) s -= 8
        if (wind > 30) s -= 15; else if (wind > 20) s -= 8
        if (temp < -5) s -= 5
        s = Math.max(0, Math.min(100, s))

        const lbl = s >= 80 ? 'Uitstekend' : s >= 60 ? 'Goed' : s >= 40 ? 'Matig' : s >= 20 ? 'Slecht' : 'Bewolkt'
        const clr = s >= 80 ? '#3ddf90'    : s >= 60 ? '#d4a84b' : s >= 40 ? '#ff8a60' : '#e05040'

        setScore(Math.round(s / 10))
        setLabel(lbl)
        setColor(clr)
        setClouds(cc)
        setTemp(Math.round(temp))

        const nearest = SK_DARK_SPOTS.map(sp => ({ ...sp, km: skDist(lat, lon, sp.lat, sp.lon) })).sort((a, b) => a.km - b.km)[0]
        setDarkKm(nearest.km)
        setDarkName(nearest.name)
      } catch { /* silent */ }
      setLoading(false)
    }

    fetch20h(52.3676, 4.9041)
  }, [])

  const circumference = 2 * Math.PI * 30 // r=30

  return (
    <div role="region" aria-labelledby="sk-widget-title" style={{ position: 'relative', border: '1px solid #252858', background: '#16173A', overflow: 'hidden', borderRadius: 2 }}>
      {/* Status accent — colour communicates conditions at a glance */}
      <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: loading ? '#252858' : color, transition: 'background 0.6s' }} />

      {/* Header */}
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span id="sk-widget-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true">🌠</span>
          Vanavond zichtbaar
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8' }}>{locName}</span>
      </div>

      {/* Score + highlights */}
      <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', gap: 18, background: loading ? 'transparent' : `radial-gradient(circle at 10% 20%, ${color}16, transparent 68%)`, transition: 'background 0.6s' }}>
        {/* Score ring */}
        <div aria-label={`Sterrenkijk-score: ${score ?? '…'} van 10`} style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          {!loading && (
            <div aria-hidden="true" style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: color, opacity: 0.18, filter: 'blur(14px)' }} />
          )}
          <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" style={{ position: 'relative' }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="#252858" strokeWidth="6" />
            <circle cx="36" cy="36" r="30" fill="none"
              stroke={loading ? '#252858' : color}
              strokeWidth="6"
              strokeDasharray={`${loading ? 0 : ((score ?? 0) / 10) * circumference} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 0.9s ease, stroke 0.4s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: loading ? '#7A86A8' : color, lineHeight: 1, transition: 'color 0.4s' }}>
              {loading ? '…' : (score ?? '?')}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#7A86A8', letterSpacing: '0.06em' }}>/10</span>
          </div>
        </div>

        {/* Label + info rows */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: loading ? '#7A86A8' : color, marginBottom: 8, transition: 'color 0.4s' }}>
            {loading ? 'Ophalen…' : label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {clouds !== null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: clouds < 20 ? '#3ddf90' : clouds < 50 ? '#d4a84b' : '#8A9BC4' }}>
                ☁ {clouds}% bewolking vanavond
              </span>
            )}
            {temp !== null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#8A9BC4' }}>
                🌡 {temp}°C vanavond
              </span>
            )}
            {darkKm !== null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#8A9BC4' }}>
                🌑 Dark sky {darkKm} km · {darkName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid #252858', padding: '10px 20px' }}>
        <Link href="/sterrenkijken"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
        >
          Volledig rapport
          <svg width="10" height="10" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>
    </div>
  )
}

// ── ISS Widget ─────────────────────────────────────────────────────────────
function ISSWidget({ iss }: { iss: ISSData | null }) {
  const px = iss ? ((iss.longitude + 180) / 360 * 100) : 50
  const py = iss ? ((90 - iss.latitude)  / 180 * 100) : 50
  return (
    <div role="region" aria-labelledby="iss-title" style={{ border: '1px solid #252858', background: '#16173A', overflow: 'hidden', borderRadius: 2 }}>
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span id="iss-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ position: 'relative', width: 7, height: 7, flexShrink: 0 }} aria-hidden="true">
            <span className="animate-pulse-dot" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3ddf90' }} />
            <span className="animate-live-ring" style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid #3ddf90' }} />
          </span>
          ISS Live Tracker
        </span>
        <span aria-live="polite" aria-atomic="true" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#7A86A8' }}>Realtime</span>
      </div>
      <div role="img" aria-label="ISS positie op wereldkaart" style={{ height: 160, background: '#0d1425', position: 'relative', overflow: 'hidden' }}>
        <img src={`${PROXY}/image-proxy?url=${encodeURIComponent('https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png')}&w=680`} alt="" aria-hidden="true" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, filter: 'brightness(1.3) saturate(0.5) sepia(0.4) hue-rotate(190deg)', position: 'absolute', inset: 0 }} />
        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }}>
          {[25, 50, 75].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#3dcfdf" strokeWidth="0.5" />)}
          {[16.6, 33.3, 50, 66.6, 83.3].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#3dcfdf" strokeWidth="0.5" />)}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#3dcfdf" strokeWidth="1" opacity="0.4" />
        </svg>
        {iss && (
          <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <ellipse cx={`${px}%`} cy="50%" rx="18%" ry="28%" fill="none" stroke="#3ddf90" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
          </svg>
        )}
        <div aria-hidden="true" style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, width: 12, height: 12, transform: 'translate(-50%,-50%)', zIndex: 2, transition: 'left 2s linear, top 2s linear' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3ddf90', boxShadow: '0 0 0 3px rgba(61,223,144,0.25), 0 0 14px rgba(61,223,144,0.6)' }} />
          <div className="animate-live-ring" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(61,223,144,0.5)' }} />
        </div>
        {iss && <div aria-hidden="true" style={{ position: 'absolute', left: `${Math.min(px + 2, 83)}%`, top: `${Math.max(py - 14, 4)}%`, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#3ddf90', letterSpacing: '0.1em', whiteSpace: 'nowrap', zIndex: 3 }}>ISS ↗</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {[
          { val: iss ? `${iss.latitude.toFixed(1)}°`               : '—',          lbl: 'Breedtegraad' },
          { val: iss ? `${iss.longitude.toFixed(1)}°`              : '—',          lbl: 'Lengtegraad' },
          { val: iss ? `${Math.round(iss.altitude)} km`            : '408 km',     lbl: 'Hoogte' },
          { val: iss ? `${(iss.velocity / 1000).toFixed(1)}k km/h` : '27.6k km/h', lbl: 'Snelheid' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '12px 20px', borderTop: '1px solid #252858', borderRight: i % 2 === 0 ? '1px solid #252858' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A86A8', marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── APOD widget ────────────────────────────────────────────────────────────
function APODWidget({ apod }: { apod: APODData | null }) {
  return (
    <div role="region" aria-labelledby="apod-widget-title" style={{ border: '1px solid #252858', background: '#16173A', overflow: 'hidden', borderRadius: 2 }}>
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858' }}>
        <span id="apod-widget-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4' }}>NASA Foto van de Dag</span>
      </div>
      {apod?.media_type === 'image' ? (
        <img src={`${PROXY}/image-proxy?url=${encodeURIComponent(apod.url)}&w=700`} alt={apod.title} loading="lazy" style={{ width: '100%', height: 160, objectFit: 'cover', filter: 'brightness(0.85) saturate(1.1)', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg,#0a1030,#1a2060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="4" fill="rgba(55,138,221,0.6)" /><circle cx="24" cy="24" r="10" fill="none" stroke="rgba(55,138,221,0.2)" strokeWidth="1" /><circle cx="24" cy="24" r="18" fill="none" stroke="rgba(55,138,221,0.08)" strokeWidth="1" /></svg>
        </div>
      )}
      {apod && (
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.1em', color: '#378ADD', marginBottom: 6 }}>
            {new Date(apod.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.3, marginBottom: 6 }}>{apod.title}</div>
          <p style={{ fontSize: '0.76rem', color: '#8A9BC4', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{apod.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ── AI promo widget ────────────────────────────────────────────────────────
function AIPromoWidget() {
  const LEVELS_UI = [
    { key: 'beg', label: 'Beginner', color: '#e05040', border: 'rgba(224,80,64,0.4)', bg: 'rgba(224,80,64,0.1)' },
    { key: 'ama', label: 'Amateur',  color: '#3ddf90', border: 'rgba(61,223,144,0.4)', bg: 'rgba(61,223,144,0.1)' },
    { key: 'pro', label: 'Pro',      color: '#3dcfdf', border: 'rgba(61,207,223,0.4)', bg: 'rgba(61,207,223,0.1)' },
  ]
  return (
    <div role="region" aria-label="AI feature" style={{ border: '1px solid rgba(55,138,221,0.3)', background: 'linear-gradient(135deg,rgba(16,17,42,0.95),rgba(20,25,60,0.95))', padding: 24, position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
      <div aria-hidden="true" style={{ position: 'absolute', right: 16, top: 12, fontSize: '4rem', color: '#8a6820', opacity: 0.12, lineHeight: 1, pointerEvents: 'none' }}>✦</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 12 }}>✦ AI Feature</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 10 }}>Lees elk artikel op jouw niveau</div>
      <p style={{ fontSize: '0.76rem', color: '#8A9BC4', lineHeight: 1.65, marginBottom: 16 }}>Kies Beginner, Amateur of Pro — onze AI herschrijft het artikel live voor jou.</p>
      <div role="group" aria-label="Lees niveau keuze" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {LEVELS_UI.map(l => (
          <button key={l.key} aria-label={`${l.label} niveau`} style={{ flex: 1, padding: '6px 0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', border: `1px solid ${l.border}`, color: l.color, background: 'transparent', borderRadius: 2, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = l.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{l.label}</button>
        ))}
      </div>
    </div>
  )
}


// ── This week widget ───────────────────────────────────────────────────────
function ThisWeekWidget() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const upcoming = SPACE_EVENTS
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)

  const first = upcoming[0]?.days ?? 999
  const heading =
    first <= 7  ? 'Deze week in de sterrenkunde' :
    first <= 31 ? 'Deze maand in de sterrenkunde' :
                  'Binnenkort in de sterrenkunde'

  if (!upcoming.length) return null

  return (
    <div role="region" aria-labelledby="thisweek-title" style={{ border: '1px solid #252858', background: '#16173A', overflow: 'hidden', borderRadius: 2 }}>
      {/* Header */}
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true">🗓️</span>
        <span id="thisweek-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4' }}>
          {mounted ? heading : 'Binnenkort in de sterrenkunde'}
        </span>
      </div>

      {/* Event rows */}
      {upcoming.map((ev, i) => {
        const clr    = CAT_COLORS[ev.cat] ?? '#8A9BC4'
        const urgent = ev.days <= 7
        const dayBadge =
          ev.days === 0 ? 'VANDAAG' :
          ev.days === 1 ? 'MORGEN'  :
          `${ev.days}d`
        const badgeColor = urgent ? '#e05040' : clr
        const badgeBg    = urgent ? 'rgba(224,80,64,0.10)' : `${clr}14`

        return (
          <div key={ev.id} style={{ padding: '13px 20px', borderBottom: i < upcoming.length - 1 ? '1px solid #1e1f42' : 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,40,88,0.35)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              {/* Icon */}
              <span style={{ fontSize: '1.15rem', lineHeight: 1, flexShrink: 0, marginTop: 1 }} aria-hidden="true">{ev.icon}</span>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title + badge */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2 }}>{ev.title}</span>
                  {mounted && (
                    <span style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.71rem', letterSpacing: '0.08em', color: badgeColor, background: badgeBg, border: `1px solid ${badgeColor}30`, padding: '2px 6px', borderRadius: 2, whiteSpace: 'nowrap' }}>
                      {dayBadge}
                    </span>
                  )}
                </div>

                {/* Category + date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: clr, flexShrink: 0, display: 'block' }} aria-hidden="true" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.71rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: clr }}>{ev.cat}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.71rem', color: '#7A86A8' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.71rem', color: '#7A86A8' }}>
                    {new Date(ev.date + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.72rem', color: '#6A7BAA', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.desc}</p>
              </div>
            </div>
          </div>
        )
      })}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #252858', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8' }}>Lanceringen & verschijnselen</span>
        <Link href="/missies"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
        >
          Alle evenementen →
        </Link>
      </div>
    </div>
  )
}

function EventCountdownStrip() {
  const [now, setNow] = useState(0)
  useEffect(() => { setNow(Date.now()) }, [])

  const upcoming = SPACE_EVENTS
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)

  if (!upcoming.length) return null

  return (
    <section aria-label="Aankomende ruimte-evenementen" style={{ background: '#0F1028', borderBottom: '1px solid #252858', borderTop: '1px solid #252858', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '0 var(--sp-10)', display: 'flex', alignItems: 'stretch', gap: 0 }}>

        {/* Left label — sticky */}
        <div className="event-strip-label" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20, borderRight: '1px solid #252858', paddingTop: 14, paddingBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8A9BC4', whiteSpace: 'nowrap' }}>
            🗓️ Aankomend
          </span>
        </div>

        {/* Scrollable cards */}
        <style>{`.ev-scroll::-webkit-scrollbar{display:none}`}</style>
        <div
          role="list"
          style={{ display: 'flex', gap: 0, overflowX: 'auto', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el: any) => { if (el) el.style.setProperty('--webkit-overflow-scrolling', 'touch') }}
        >
          {upcoming.map((ev, i) => {
            const clr   = CAT_COLORS[ev.cat] ?? '#8A9BC4'
            const urgent = ev.days <= 7
            const soon   = ev.days <= 30
            const dayClr = urgent ? '#e05040' : soon ? '#d4a84b' : clr

            return (
              <div
                key={ev.id}
                role="listitem"
                title={ev.desc}
                style={{ flexShrink: 0, minWidth: 152, borderRight: '1px solid #252858', padding: '12px 18px', cursor: 'default', transition: 'background 0.2s', position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,40,88,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Category dot + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: clr, flexShrink: 0, display: 'block' }} aria-hidden="true" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: clr }}>{ev.cat}</span>
                  {urgent && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.71rem', color: '#e05040', marginLeft: 4 }}>SNEL!</span>}
                </div>

                {/* Event name */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25, marginBottom: 8 }}>
                  {ev.icon} {ev.title}
                </div>

                {/* Countdown + date */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  {now > 0 && (
                    <>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: dayClr, lineHeight: 1 }}>
                        {ev.days === 0 ? 'Vandaag' : ev.days}
                      </span>
                      {ev.days > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8', letterSpacing: '0.06em' }}>
                          {ev.days === 1 ? 'dag' : 'dagen'}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8', marginTop: 2 }}>
                  {new Date(ev.date + 'T00:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {/* Bottom accent on hover via border-left */}
                <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: clr, opacity: 0, transition: 'opacity 0.2s' }}
                  ref={(el) => {
                    if (!el) return
                    const parent = el.parentElement
                    if (!parent) return
                    parent.addEventListener('mouseenter', () => { el.style.opacity = '1' })
                    parent.addEventListener('mouseleave', () => { el.style.opacity = '0' })
                  }}
                />
              </div>
            )
          })}

          {/* Missies link */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '12px 20px' }}>
            <Link href="/missies"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
            >
              Alle missies
              <svg width="10" height="10" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────
const FOOTER_COLS: FooterCol[] = [
  { title: 'Onderwerpen', links: [['James Webb', '/nieuws/onderwerp/james-webb'], ['Mars', '/nieuws/onderwerp/mars'], ['Maan', '/nieuws/onderwerp/maan'], ['Kosmologie', '/nieuws/onderwerp/kosmologie'], ['Sterrenkijken', '/sterrenkijken']] },
  { title: 'Tools',       links: [['ISS Tracker', '/'], ['Sterrenkaart', '/sterrenkijken'], ['Lanceringskalender', '/missies']] },
  { title: 'Over ons',    links: [['Redactie', '/over'], ['Contact', '/contact'], ['Privacy', '/privacy']] },
]

// ── Main page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [apod,         setApod]         = useState<APODData | null>(null)
  const [iss,          setIss]          = useState<ISSData | null>(null)
  const [articles,     setArticles]     = useState<Article[]>(FALLBACK_ARTICLES)
  const [activeFilter, setActiveFilter] = useState('Alles')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const nasaFetchedRef = useRef<Set<string>>(new Set())

  // Reset pagination when filter changes
  const handleFilter = useCallback((topic: string) => {
    setActiveFilter(topic)
    setVisibleCount(PAGE_SIZE)
  }, [])

  // Read ?topic query param on mount
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('topic')
    if (param) {
      const match = TOPICS.find(t => t.toLowerCase() === param.toLowerCase())
      if (match) setActiveFilter(match)
    }
  }, [])

  // Load articles from articles-index.json
  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => { if (Array.isArray(data) && data.length > 0) setArticles(data) })
      .catch(() => {})
  }, [])

  // Fetch unique, article-specific NASA images for cards without imageUrl.
  useEffect(() => {
    const CAT_QUERIES: Record<string, string> = {
      'missies':       'rocket launch spacecraft',
      'missions':      'rocket launch spacecraft',
      'james-webb':    'james webb space telescope infrared',
      'kosmologie':    'galaxy nebula deep space cosmos',
      'cosmology':     'galaxy nebula cosmos',
      'mars':          'mars red planet surface',
      'sterrenkijken': 'night sky stars milky way',
      'observing':     'telescope observatory night sky',
      'educatie':      'astronaut earth orbit space station',
      'education':     'astronaut earth orbit space station',
      'maan':          'moon lunar surface craters',
      'kometen':       'comet astronomy solar system',
      'komeet':        'comet astronomy solar system',
      'zon':           'sun solar flare corona',
      'planeten':      'planet solar system',
    }
    const SPACE_NOUNS = [
      'starship','falcon','artemis','starlink','spacex','hubble','webb','jwst',
      'perseverance','curiosity','ingenuity','voyager','cassini','landsat',
      'starliner','dragon','orion','sls','iss','juice','clipper',
      'saturn','jupiter','venus','mercury','neptune','uranus','pluto',
      'mars','moon','lunar','comet','asteroid','nebula','galaxy','aurora',
      'rocket','launch','orbit','astronaut','satellite','telescope','solar',
    ]
    const NL_EN: Record<string, string> = {
      'lancering':'launch','lanceert':'launch','gelanceerd':'launch',
      'raket':'rocket','satelliet':'satellite','ruimtestation':'space station',
      'maan':'moon','maansverduistering':'lunar eclipse',
      'zon':'sun','zonsverduistering':'solar eclipse',
      'sterrenstelsel':'galaxy','melkweg':'milky way',
      'komeet':'comet','meteorenregen':'meteor shower',
      'astronaut':'astronaut','telescoop':'telescope',
      'nevel':'nebula','planeet':'planet','missie':'mission',
      'booster':'booster','oppervlak':'surface','heelal':'cosmos',
    }
    const buildQ = (title: string, category: string): string => {
      const lower = title.toLowerCase()
      const nouns = SPACE_NOUNS.filter(n => lower.includes(n))
      if (nouns.length >= 1) return nouns.slice(0, 3).join(' ')
      const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/)
      const translated = [...new Set(words.map(w => NL_EN[w]).filter(Boolean) as string[])].slice(0, 3)
      if (translated.length >= 1) return translated.join(' ')
      return CAT_QUERIES[(category || '').toLowerCase()] || 'space astronomy cosmos'
    }

    const toFetch = articles
      .filter(a => !a.imageUrl && !nasaFetchedRef.current.has(a.slug))
      .slice(0, 20)
    if (!toFetch.length) return
    toFetch.forEach(a => nasaFetchedRef.current.add(a.slug))

    toFetch.forEach(async (a, idx) => {
      await new Promise(r => setTimeout(r, idx * 150))

      const hash = a.slug.split('').reduce((acc: number, c: string) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0)
      const page = (hash % 8) + 1
      const q    = buildQ(a.title, a.category)

      for (const pg of [page, ((page % 8) + 1)]) {
        try {
          const res = await fetch(
            `${PROXY}/image-search?q=${encodeURIComponent(q)}&page=${pg}&hash=${hash}`
          )
          if (!res.ok) continue
          const data = await res.json()
          if (!data?.url) continue
          setArticles(prev => prev.map(p => p.slug === a.slug ? { ...p, imageUrl: data.url } : p))
          return
        } catch {}
      }
    })
  }, [articles])

  // Fetch APOD — cached in localStorage per day so repeat visits render instantly
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      const cached = localStorage.getItem(APOD_CACHE_KEY)
      if (cached) {
        const { date, data } = JSON.parse(cached)
        if (date === today && data) { setApod(data); return }
      }
    } catch {}

    fetch(`${PROXY}/apod`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: APODData) => {
        setApod(data)
        try { localStorage.setItem(APOD_CACHE_KEY, JSON.stringify({ date: today, data })) } catch {}
      })
      .catch(() => {})
  }, [])

  // Fetch ISS every 5s
  useEffect(() => {
    const fetchISS = () => fetch('https://api.wheretheiss.at/v1/satellites/25544').then(r => r.json()).then(setIss).catch(() => {})
    fetchISS()
    const id = setInterval(fetchISS, 5000)
    return () => clearInterval(id)
  }, [])

  // Derived state
  const featuredArticle = articles.find(a => a.featured) ?? articles[0]
  const gridArticles    = articles.slice(0, 6) // bento always shows latest 6

  // Filtered articles for the card grid (all articles, filtered by topic)
  const filtered  = articles.filter(a => topicMatches(a.category, activeFilter))
  const visible   = filtered.slice(0, visibleCount)
  const hasMore   = visibleCount < filtered.length

  // Topic counts for the filter badges
  const counts = TOPICS.reduce((acc, t) => {
    acc[t] = t === 'Alles' ? articles.length : articles.filter(a => topicMatches(a.category, t)).length
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      <a href="#main-content" className="skip-link">Ga naar hoofdinhoud</a>
      <Starfield />
      <Topbar items={articles.length > 0 ? articles.slice(0, 8).map(a => a.title) : TICKER_FALLBACK} />
      <SiteNav />
      <Hero apod={apod} featuredSlug={featuredArticle.slug} />

      {/* Topics — now functional filter */}
      <TopicsStrip active={activeFilter} onFilter={handleFilter} counts={counts} />
      <EventCountdownStrip />

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="main-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--max-w)', margin: '0 auto' }}>

        {/* Bento: latest 6 articles (always unfiltered — quick overview) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16 }} id="nieuws">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Uitgelicht</span>
            <div aria-hidden="true" style={{ width: 48, height: 1, background: '#2A2E62' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8' }}>Laatste nieuws</span>
        </div>
        <div className="bento-grid">
          {gridArticles[0] && <BentoCard article={gridArticles[0]} size="hero" />}
          {gridArticles[1] && <BentoCard article={gridArticles[1]} size="md" />}
          {gridArticles[2] && <BentoCard article={gridArticles[2]} size="md" />}
          {gridArticles[3] && <BentoCard article={gridArticles[3]} size="sm" />}
          {gridArticles[4] && <BentoCard article={gridArticles[4]} size="sm" />}
          {gridArticles[5] && <BentoCard article={gridArticles[5]} size="sm" />}
        </div>

        <MissiesStrip />

        {/* ── Advertentie: tussen missies en artikelgrid ────────────────── */}
        {/* Vervang slot door jouw AdSense-eenheid-ID uit het dashboard */}
        <AdUnit slot="8887478647" style={{ margin: '24px 0' }} />

        {/* ── Article grid + sidebar ────────────────────────────────────── */}
        <div className="content-split">

          {/* Left: filtered card grid */}
          <section aria-labelledby="grid-label" aria-live="polite" aria-atomic="false">
            {/* Section header with filter status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span id="grid-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>
                  {activeFilter === 'Alles' ? 'Alle artikelen' : activeFilter}
                </span>
                <div aria-hidden="true" style={{ width: 32, height: 1, background: '#252858' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8' }}>
                {filtered.length} {filtered.length === 1 ? 'artikel' : 'artikelen'}
              </span>
            </div>

            {/* Empty state when filter has no results */}
            {filtered.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px solid #252858', borderRadius: 2 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#7A86A8', marginBottom: 8 }}>Geen artikelen gevonden</div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#7A86A8' }}>Probeer een ander onderwerp of bekijk alle artikelen.</p>
                <button onClick={() => handleFilter('Alles')} style={{ marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: '0.77rem', color: '#378ADD', background: 'none', border: '1px solid rgba(55,138,221,0.3)', padding: '8px 20px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Toon alle artikelen
                </button>
              </div>
            )}

            {/* Article card grid — 2 cols desktop, 1 col mobile */}
            {visible.length > 0 && (
              <div className="article-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
                {visible.map(a => <ArticleGridCard key={a.slug} article={a} />)}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 8 }}>
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', background: 'none', border: '1px solid rgba(55,138,221,0.35)', padding: '11px 28px', cursor: 'pointer', borderRadius: 2, transition: 'background 0.15s, border-color 0.15s' }}
                  aria-label={`Laad meer artikelen — ${filtered.length - visibleCount} resterend`}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(55,138,221,0.08)'; e.currentTarget.style.borderColor = 'rgba(55,138,221,0.6)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(55,138,221,0.35)' }}
                >
                  Laad meer
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8' }}>
                  {visible.length} van {filtered.length}
                </span>
                {/* Progress bar */}
                <div style={{ flex: 1, height: 2, background: '#252858', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#378ADD', width: `${(visible.length / filtered.length) * 100}%`, borderRadius: 1, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {/* All loaded indicator */}
            {!hasMore && filtered.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#7A86A8', flexShrink: 0 }}>Alle {filtered.length} artikelen geladen</span>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
              </div>
            )}
          </section>

          {/* Right: sticky sidebar */}
          <aside aria-label="Widgets" className="sidebar-grid" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)', alignSelf: 'start' }}>
            <StargazingWidget />
            <ThisWeekWidget />
            <DailyQuizWidget />
            <ISSWidget iss={iss} />
            <APODWidget apod={apod} />
            <AIPromoWidget />
          </aside>
        </div>

      </main>

      <SiteFooter cols={FOOTER_COLS} note="Afbeeldingen: NASA · ESA · Pexels" />
    </>
  )
}
