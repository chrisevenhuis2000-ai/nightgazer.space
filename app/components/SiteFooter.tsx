'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export interface FooterCol {
  title: string
  links: [string, string][] // [label, href]
}

interface SiteFooterProps {
  cols?:    FooterCol[]
  tagline?: string
  note?:    string
}

const DEFAULT_TAGLINE = 'Nederlandstalig astronomie-platform met AI-aangedreven uitleg op jouw niveau. Van beginners tot professionals.'
const DEFAULT_NOTE     = 'Afbeeldingen: NASA · ESA · Pexels'
const DEFAULT_COLS: FooterCol[] = [
  { title: 'Pagina\'s', links: [['Home', '/'], ['Nieuws', '/nieuws'], ['Missies', '/missies'], ['Sterrenkijken', '/sterrenkijken'], ['Educatie', '/educatie']] },
  { title: 'Bronnen',   links: [['NASA', 'https://nasa.gov'], ['ESA', 'https://esa.int'], ['SpaceX', 'https://spacex.com']] },
]

const SOCIALS = [
  { href: '#', label: 'NightGazer op X',         icon: <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M12.6 1h2.4l-5.2 6 6.2 8H12l-3.7-4.9L3.8 15H1.4l5.5-6.3L.8 1H5l3.4 4.5L12.6 1z" /></svg> },
  { href: '#', label: 'NightGazer op Instagram',  icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" width="13" height="13"><rect x="1.5" y="1.5" width="13" height="13" rx="3.5" /><circle cx="8" cy="8" r="3" /><circle cx="11.5" cy="4.5" r="0.7" fill="currentColor" stroke="none" /></svg> },
  { href: '#', label: 'NightGazer op YouTube',    icon: <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M14.5 4.5s-.2-1.2-.7-1.7c-.7-.7-1.4-.7-1.8-.8C10.5 2 8 2 8 2s-2.5 0-4 .1c-.4 0-1.1.1-1.8.8-.5.5-.7 1.7-.7 1.7S1.3 5.9 1.3 7.3v1.3c0 1.4.2 2.8.2 2.8s.2 1.2.7 1.7c.7.7 1.6.7 2 .7C5.5 14 8 14 8 14s2.5 0 4-.1c.4-.1 1.1-.1 1.8-.8.5-.5.7-1.7.7-1.7s.2-1.4.2-2.8V7.3C14.7 5.9 14.5 4.5 14.5 4.5zM6.5 10.2V5.8l4.5 2.2-4.5 2.2z" /></svg> },
]

const BADGES: [string, string][] = [['Claude AI', '⬡'], ['NASA Open APIs', '★']]

// ── Confined starfield — sized to the footer itself, not the viewport ──────
function FooterStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    const ctx    = canvas?.getContext('2d')
    if (!canvas || !parent || !ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0, H = 0

    function size() {
      W = parent!.clientWidth
      H = parent!.clientHeight
      canvas!.width  = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width  = `${W}px`
      canvas!.style.height = `${H}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()

    const stars = Array.from({ length: 70 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.8 + 0.2,
      o: Math.random() * 0.5 + 0.08,
      s: (Math.random() - 0.5) * (prefersReducedMotion ? 0 : 0.01),
    }))

    let raf: number
    function draw() {
      ctx!.clearRect(0, 0, W, H)
      for (const st of stars) {
        st.o += st.s
        if (st.o > 0.6 || st.o < 0.05) st.s *= -1
        ctx!.beginPath()
        ctx!.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(200,215,255,${st.o.toFixed(2)})`
        ctx!.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => size()
    window.addEventListener('resize', onResize, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ── Reveal-on-scroll: fades/slides the footer content in once, on first view ──
function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, visible }
}

export function SiteFooter({ cols = DEFAULT_COLS, tagline = DEFAULT_TAGLINE, note = DEFAULT_NOTE }: SiteFooterProps) {
  const { ref, visible } = useRevealOnScroll()

  return (
    <footer role="contentinfo" style={{ position: 'relative', zIndex: 1, background: '#0F1028', borderTop: '1px solid #252858', overflow: 'hidden' }}>
      <div className="footer-shimmer-line" aria-hidden="true" />
      <FooterStarfield />

      <div className="footer-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div ref={ref} className={`footer-grid footer-reveal stagger${visible ? ' is-visible' : ''}`}>
          <div>
            <Link href="/" className="footer-logo-link" style={{ display: 'inline-block', marginBottom: 16 }}>
              <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 42, width: 'auto', display: 'block' }} />
            </Link>
            <p style={{ fontSize: '0.82rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 280, marginBottom: 20 }}>{tagline}</p>
            <div style={{ display: 'flex', gap: 10 }} aria-label="Sociale media">
              {SOCIALS.map(({ href, label, icon }) => (
                <a key={label} href={href} aria-label={label} className="footer-social-icon"
                  style={{ width: 32, height: 32, border: '1px solid #2A2E62', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A86A8' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#8A9BC4')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7A86A8')}
                >{icon}</a>
              ))}
            </div>
          </div>

          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 16 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([label, href]) => {
                  const external = href.startsWith('http')
                  return external ? (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="footer-link"
                      style={{ fontSize: '0.82rem', color: '#8A9BC4', textDecoration: 'none', width: 'fit-content' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
                    >{label} ↗</a>
                  ) : (
                    <Link key={label} href={href} className="footer-link"
                      style={{ fontSize: '0.82rem', color: '#8A9BC4', textDecoration: 'none', width: 'fit-content' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
                    >{label}</Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-bottom-row" style={{ borderTop: '1px solid #252858', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.06em', color: '#7A86A8' }}>© {new Date().getFullYear()} NightGazer · nightgazer.space</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8' }}>{note}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {BADGES.map(([label, icon]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', border: '1px solid #252858', borderRadius: 2, fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#7A86A8' }}>
                <span aria-hidden="true">{icon}</span>{label}
              </span>
            ))}
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="footer-to-top" aria-label="Terug naar boven"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#7A86A8' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7A86A8')}
            >
              ↑ Naar boven
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
