'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LEVELS, DEMO_CONCEPT, TOPIC_DETAILS, TOPICS, CONCEPTS, FAQS, TOPIC_TAGS,
} from '@/lib/education-data'
import Link from 'next/link'
import { SiteFooter, type FooterCol } from '@/app/components/SiteFooter'

// ── Nav links ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '/nieuws',        label: 'Nieuws' },
  { href: '/sterrenkijken', label: 'Sterrenkijken' },
  { href: '/missies',       label: 'Missies' },
  { href: '/educatie',      label: 'Educatie' },
]

// ── Level system ────────────────────────────────────────────────────────────

// ── Demo concept ────────────────────────────────────────────────────────────

// ── Topic educational detail (3-level content, key facts, sources) ──────────

// ── Learning topics ──────────────────────────────────────────────────────────

// ── Key concepts ─────────────────────────────────────────────────────────────

// ── FAQ items ─────────────────────────────────────────────────────────────────

// ── Nav component ────────────────────────────────────────────────────────────
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
    <>
      <nav aria-label="Hoofdnavigatie" style={{ position: 'sticky', top: 0, zIndex: 20, height: 'var(--nav-h)', background: 'rgba(26,26,46,0.96)', borderBottom: '1px solid #252858', backdropFilter: 'blur(16px)' }}>
        <div className="nav-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 40 }}>
          <Link href="/" aria-label="NightGazer — naar de startpagina" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 46, width: 'auto', display: 'block' }} />
          </Link>
          <ul className="nav-links" role="list" style={{ gap: 32, flex: 1, justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === '/educatie'
              return (
                <li key={href}>
                  <Link href={href} style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: isActive ? '#FFFFFF' : '#7A86A8', textDecoration: 'none', transition: 'color 0.15s', padding: '8px 0', borderBottom: isActive ? '1px solid #378ADD' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = isActive ? '#FFFFFF' : '#7A86A8')}
                  >{label}</Link>
                </li>
              )
            })}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
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
          {NAV_LINKS.map(({ href, label }) => (
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

// ── Hero ─────────────────────────────────────────────────────────────────────
function EducatieHero() {
  return (
    <section aria-labelledby="hero-title" style={{ position: 'relative', zIndex: 1, minHeight: '72vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #04060f 0%, #080e20 40%, #06101a 70%, #04080e 100%)' }} />
      {/* Grid */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,40,88,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(37,40,88,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.5) 70%, transparent 100%)' }} />
      {/* Decorative level rings */}
      <div aria-hidden="true" style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 520, height: 520, borderRadius: '50%', border: '1px solid rgba(224,80,64,0.08)', position: 'absolute' }} />
        <div style={{ width: 360, height: 360, borderRadius: '50%', border: '1px solid rgba(61,223,144,0.1)', position: 'absolute' }} />
        <div style={{ width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(61,207,223,0.14)', background: 'radial-gradient(circle, rgba(55,138,221,0.06) 0%, transparent 70%)', position: 'absolute' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(138,155,196,0.3)', textAlign: 'center', lineHeight: 2 }}>
          <div style={{ color: 'rgba(224,80,64,0.4)' }}>BEGINNER</div>
          <div style={{ color: 'rgba(61,223,144,0.4)' }}>AMATEUR</div>
          <div style={{ color: 'rgba(61,207,223,0.4)' }}>PRO</div>
        </div>
      </div>
      {/* Gradients */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0.65) 30%, rgba(26,26,46,0.1) 70%, transparent 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,26,46,0.75) 0%, transparent 55%)' }} />

      <div className="hero-content-pad animate-fadeUp" style={{ position: 'relative', zIndex: 2, maxWidth: 780 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div aria-hidden="true" style={{ width: 32, height: 1, background: '#3ddf90' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', letterSpacing: '0.22em', color: '#3ddf90', textTransform: 'uppercase' }}>Leren</span>
        </div>
        <h1 id="hero-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem,6vw,5rem)', fontWeight: 700, lineHeight: 1.04, color: '#FFFFFF', marginBottom: 20, letterSpacing: '-0.015em' }}>
          Astronomie<br />
          <span style={{ background: 'linear-gradient(135deg, #3ddf90, #378ADD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>op jouw niveau</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520, marginBottom: 36 }}>
          Van de eerste planeet tot kwantumzwaartekracht — elke uitleg is beschikbaar in drie niveaus. Onze AI past elk concept live aan voor jou: Beginner, Amateur of Pro.
        </p>
        {/* Level badges */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
          {LEVELS.map(l => (
            <div key={l.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: `1px solid ${l.border}`, background: l.bg, borderRadius: 2 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0, display: 'block' }} aria-hidden="true" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: l.color }}>{l.label}</span>
            </div>
          ))}
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            { value: '6', label: 'Leerpaden',      color: '#3ddf90' },
            { value: '3', label: 'Niveaus',         color: '#378ADD' },
            { value: '∞', label: 'Artikelen',       color: '#c080ff' },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <div className="edu-stat-value" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A86A8', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <a href="#leerpaden" className="btn-clip" style={{ background: '#3ddf90', color: '#04120a', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5aeaa6')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3ddf90')}
          >
            Start leren
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
        {/* Jump nav — wayfinding for the long scroll below */}
        <nav aria-label="Op deze pagina" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['#hoe-werkt-het', 'Hoe werkt het'], ['#leerpaden', 'Leerpaden'], ['#kernconcepten', 'Kernconcepten'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A86A8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7A86A8')}
            >
              ↓ {label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}

// ── Level demo ───────────────────────────────────────────────────────────────
function LevelDemo() {
  const [active, setActive] = useState<'beg' | 'ama' | 'pro'>('beg')
  const text = active === 'beg' ? DEMO_CONCEPT.beg : active === 'ama' ? DEMO_CONCEPT.ama : DEMO_CONCEPT.pro
  const lvl = LEVELS.find(l => l.key === active)!
  return (
    <section id="hoe-werkt-het" aria-labelledby="level-demo-title" style={{ position: 'relative', zIndex: 1, background: '#12132A', borderTop: '1px solid #252858', borderBottom: '1px solid #252858' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 100% at 100% 50%, rgba(55,138,221,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#378ADD', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden="true" style={{ width: 28, height: 1, background: '#378ADD', display: 'inline-block' }} />
            Hoe werkt het
            <span aria-hidden="true" style={{ width: 28, height: 1, background: '#378ADD', display: 'inline-block' }} />
          </div>
          <h2 id="level-demo-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15 }}>
            Eén concept, drie dieptes
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520 }}>
            Probeer het zelf — wissel van niveau en zie hoe dezelfde uitleg verandert.
          </p>
        </div>

        {/* Demo card */}
        <div style={{ maxWidth: 780, margin: '0 auto', border: '1px solid #252858', background: '#0F1028', overflow: 'hidden', borderRadius: 2 }}>
          {/* Concept header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }} aria-hidden="true">🌑</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: '#FFFFFF' }}>{DEMO_CONCEPT.title}</span>
            </div>
            {/* Level toggle */}
            <div role="group" aria-label="Kies niveau" style={{ display: 'flex', gap: 4 }}>
              {LEVELS.map(l => (
                <button key={l.key} aria-pressed={active === l.key} onClick={() => setActive(l.key as 'beg' | 'ama' | 'pro')} style={{ padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${active === l.key ? l.color : 'rgba(37,40,88,0.8)'}`, color: active === l.key ? l.color : '#7A86A8', background: active === l.key ? l.bg : 'transparent', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (active !== l.key) { e.currentTarget.style.borderColor = l.border; e.currentTarget.style.color = l.color } }}
                  onMouseLeave={e => { if (active !== l.key) { e.currentTarget.style.borderColor = 'rgba(37,40,88,0.8)'; e.currentTarget.style.color = '#7A86A8' } }}
                >{l.label}</button>
              ))}
            </div>
          </div>
          {/* Level description bar */}
          <div style={{ padding: '10px 24px', background: lvl.bg, borderBottom: `2px solid ${lvl.color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: lvl.color, flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', color: lvl.color }}>{lvl.desc}</span>
          </div>
          {/* Content */}
          <div style={{ padding: '28px 24px' }}>
            <p style={{ fontSize: active === 'pro' ? '0.83rem' : '0.92rem', color: '#B5D4F4', lineHeight: 1.85, fontFamily: active === 'pro' ? 'var(--font-mono)' : 'var(--font-sans)' }}>
              {text}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/nieuws/neutronenster-uitgelegd" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
          >
            Lees een volledig educatief artikel
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Leerpaden ────────────────────────────────────────────────────────────────

function Leerpaden() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [level, setLevel] = useState<'beg' | 'ama' | 'pro'>('beg')
  const [glossaryOpen, setGlossaryOpen] = useState<Record<string, boolean>>({})
  const [newsIndex, setNewsIndex] = useState<any[]>([])
  const activeLvl = LEVELS.find(l => l.key === level)!

  useEffect(() => {
    fetch('/content/index.json')
      .then(r => r.json())
      .then(data => setNewsIndex(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  return (
    <section id="leerpaden" aria-labelledby="leerpaden-title" style={{ position: 'relative', zIndex: 1, background: '#1A1A2E' }}>
      <div className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3ddf90', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span aria-hidden="true" style={{ width: 28, height: 1, background: '#3ddf90', display: 'inline-block' }} />
              Leerpaden
            </div>
            <h2 id="leerpaden-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 12 }}>
              Kies je leerpad
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520 }}>
              Elk leerpad biedt een gestructureerde route door een astronomie-onderwerp — van basis tot expert. Klik een kaart om de uitleg te openen.
            </p>
          </div>
          {/* Shared level toggle — applies to every leerpad below */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 8 }}>Jouw niveau</div>
            <div role="group" aria-label="Kies niveau voor alle leerpaden" style={{ display: 'flex', gap: 4 }}>
              {LEVELS.map(l => (
                <button key={l.key} aria-pressed={level === l.key}
                  onClick={() => setLevel(l.key as 'beg' | 'ama' | 'pro')}
                  style={{ padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${level === l.key ? l.color : 'rgba(37,40,88,0.8)'}`, color: level === l.key ? l.color : '#7A86A8', background: level === l.key ? l.bg : 'transparent', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s' }}
                >{l.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TOPICS.map(topic => {
            const detail = TOPIC_DETAILS[topic.id]
            const isOpen = expanded === topic.id
            const text = detail[level]

            return (
              <div key={topic.id} style={{ border: '1px solid #252858', overflow: 'hidden', background: '#12132A' }}>
                {/* Top accent */}
                <div aria-hidden="true" style={{ height: 2, background: topic.color }} />

                {/* Card header — always visible, click to toggle */}
                <button
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : topic.id)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'left', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,40,88,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', border: `1px solid ${topic.color}40`, background: topic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }} aria-hidden="true">
                      {topic.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 4 }}>{topic.title}</div>
                      <div style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.desc}</div>
                    </div>
                  </div>
                  {/* Chevron */}
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true" style={{ color: topic.color, flexShrink: 0, transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Expanded educational panel */}
                {isOpen && detail && (
                  <div style={{ borderTop: `1px solid ${topic.color}20`, animation: 'fadeIn 0.25s ease both' }}>
                    {/* Featured concept header */}
                    <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: topic.color, display: 'block', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: topic.color }}>Uitgelegd — {detail.featuredConcept}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#7A86A8', marginLeft: 'auto' }}>Niveau: <span style={{ color: activeLvl.color }}>{activeLvl.label}</span></span>
                    </div>

                    {/* Explanation text */}
                    <div style={{ padding: '16px 24px 0' }}>
                      <p style={{ fontSize: level === 'pro' ? '0.82rem' : '0.9rem', color: '#B5D4F4', lineHeight: 1.85, fontFamily: level === 'pro' ? 'var(--font-mono)' : 'var(--font-sans)', margin: 0 }}>
                        {text}
                      </p>
                    </div>

                    {/* Key facts + sources */}
                    <div style={{ padding: '20px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="content-split">
                      {/* Key facts */}
                      <div style={{ border: '1px solid #252858', background: 'rgba(37,40,88,0.2)', padding: 16, borderRadius: 2 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: topic.color, marginBottom: 12 }}>Kernfeiten</div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {detail.keyFacts.map((fact, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: topic.color, flexShrink: 0, marginTop: 6, display: 'block' }} aria-hidden="true" />
                              <span style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.6 }}>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sources */}
                      <div style={{ border: '1px solid #252858', background: 'rgba(37,40,88,0.2)', padding: 16, borderRadius: 2 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 12 }}>Bronnen</div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {detail.sources.map((src, i) => (
                            <li key={i}>
                              <a href={src.url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: '0.78rem', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
                              >
                                <svg width="10" height="10" fill="none" viewBox="0 0 12 12" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8M8 1h3m0 0v3m0-3L5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                {src.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #252858' }}>
                          <Link href={`/nieuws?topic=${topic.title}`}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: topic.color, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                            onMouseLeave={e => (e.currentTarget.style.color = topic.color)}
                          >
                            Artikelen over {topic.title}
                            <svg width="10" height="10" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Glossarium */}
                    <div style={{ borderTop: `1px solid ${topic.color}15`, margin: '0 24px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setGlossaryOpen(prev => ({ ...prev, [topic.id]: !prev[topic.id] })) }}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>📖 Begrippenlijst</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8', background: 'rgba(37,40,88,0.5)', border: '1px solid #252858', padding: '1px 6px', borderRadius: 10 }}>{detail.glossary.length} termen</span>
                        </div>
                        <svg width="13" height="13" fill="none" viewBox="0 0 16 16" aria-hidden="true" style={{ color: '#7A86A8', flexShrink: 0, transition: 'transform 0.25s', transform: glossaryOpen[topic.id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {glossaryOpen[topic.id] && (
                        <div style={{ paddingBottom: 20, animation: 'fadeIn 0.2s ease both' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                            {detail.glossary.map(entry => (
                              <div key={entry.term} style={{ background: 'rgba(37,40,88,0.15)', border: '1px solid #252858', borderRadius: 2, padding: '12px 14px' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', fontWeight: 700, color: topic.color, letterSpacing: '0.06em', marginBottom: 5 }}>{entry.term}</div>
                                <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.65, margin: 0 }}>{entry.def}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* In het nieuws */}
                    {(() => {
                      const terms = TOPIC_TAGS[topic.id] || []
                      const matches = newsIndex
                        .filter(a => terms.some(t => (a.title + ' ' + a.category).toLowerCase().includes(t)))
                        .slice(0, 2)
                      if (!matches.length) return null
                      return (
                        <div style={{ margin: '0 24px 24px', borderTop: '1px solid #252858', paddingTop: 16 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 10 }}>📰 In het nieuws</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {matches.map((a: any) => (
                              <a key={a.slug} href={`/nieuws/${a.slug}`} style={{ fontSize: '0.8rem', color: '#8A9CC0', textDecoration: 'none', lineHeight: 1.4, transition: 'color 0.15s' }}
                                 onMouseEnter={e => (e.currentTarget.style.color = '#378ADD')}
                                 onMouseLeave={e => (e.currentTarget.style.color = '#8A9CC0')}>
                                → {a.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Kernconcepten ─────────────────────────────────────────────────────────────
function Kernconcepten() {
  return (
    <section id="kernconcepten" aria-labelledby="concepten-title" style={{ position: 'relative', zIndex: 1, background: '#12132A', borderTop: '1px solid #252858' }}>
      <div className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c080ff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span aria-hidden="true" style={{ width: 28, height: 1, background: '#c080ff', display: 'inline-block' }} />
              Uitgelegd
            </div>
            <h2 id="concepten-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 12 }}>
              Kernconcepten
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 440 }}>
              Elke uitleg is beschikbaar op drie niveaus. Klik een artikel om te beginnen.
            </p>
          </div>
          <Link href="/nieuws" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BC4', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'color 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
          >
            Alle artikelen
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2, background: '#252858', border: '1px solid #252858' }}>
          {CONCEPTS.map(c => (
            <article key={c.slug}>
              <Link href={`/nieuws/${c.slug}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', color: 'inherit', background: '#12132A', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#16173A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#12132A')}
              >
                {/* Top accent */}
                <div aria-hidden="true" style={{ height: 2, background: c.color, flexShrink: 0 }} />
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.8rem' }} aria-hidden="true">{c.icon}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: c.color, marginBottom: 4 }}>{c.category}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>{c.title}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#8A9BC4', lineHeight: 1.7, flex: 1 }}>{c.desc}</p>
                  {/* Level pills */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {LEVELS.map(l => (
                      <span key={l.key} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: l.color, background: l.bg, border: `1px solid ${l.border}`, padding: '2px 7px', borderRadius: 2 }}>{l.label}</span>
                    ))}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}


// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" aria-labelledby="faq-title" style={{ position: 'relative', zIndex: 1, background: '#12132A', borderTop: '1px solid #252858' }}>
      <div className="main-pad" style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 14 }}>Veelgestelde vragen</div>
          <h2 id="faq-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15 }}>FAQ</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ border: '1px solid #252858', background: open === i ? '#16173A' : '#0F1028', overflow: 'hidden', transition: 'background 0.2s', borderRadius: 2 }}>
              <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'left' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#FFFFFF', lineHeight: 1.4 }}>{faq.q}</span>
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0, color: '#7A86A8', transition: 'transform 0.25s', transform: open === i ? 'rotate(45deg)' : 'none' }}>
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {open === i && (
                <div style={{ padding: '0 24px 20px', animation: 'fadeIn 0.2s ease both' }}>
                  <p style={{ fontSize: '0.84rem', color: '#8A9BC4', lineHeight: 1.75 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
const FOOTER_COLS: FooterCol[] = [
  { title: 'Onderwerpen', links: [['Kosmologie', '/nieuws/onderwerp/kosmologie'], ['James Webb', '/nieuws/onderwerp/james-webb'], ['Missies', '/nieuws/onderwerp/missies'], ['Kometen', '/nieuws/onderwerp/kometen'], ['Ruimtevaart', '/missies']] },
  { title: 'Tools',       links: [['Sterrenkijken', '/sterrenkijken'], ['Lanceringskalender', '/missies']] },
  { title: 'Over ons',    links: [['Redactie', '/over'], ['Contact', '/contact'], ['Privacy', '/privacy']] },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EducatiePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Ga naar hoofdinhoud</a>
      <SiteNav />
      <main id="main-content">
        <EducatieHero />
        <LevelDemo />
        <Leerpaden />
        <Kernconcepten />
        <FAQ />
      </main>
      <SiteFooter cols={FOOTER_COLS} note="Afbeeldingen: NASA · ESA · Pexels" />
    </>
  )
}
