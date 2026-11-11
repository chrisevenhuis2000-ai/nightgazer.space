'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { zoek, GIDSEN, type Treffer } from '@/lib/zoeken'

interface Article {
  slug:        string
  title:       string
  excerpt:     string
  category:    string
  catColor:    string
  emoji:       string
  date:        string
  imageUrl:    string
}

export function useSearchModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    // Klikbare ingang: elk element kan de zoekfunctie openen met
    // window.dispatchEvent(new Event('nightgazer:search-open'))
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('nightgazer:search-open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('nightgazer:search-open', onOpen)
    }
  }, [])

  return { open, setOpen }
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query,   setQuery]   = useState('')
  const [index,   setIndex]   = useState<Article[]>([])
  const [results, setResults] = useState<Treffer[]>([])
  const [active,  setActive]  = useState(0)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Load index once
  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then(setIndex)
      .catch(() => {})
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Filter on query. Leeg: de gidsen en het nieuwste nieuws.
  useEffect(() => {
    const nieuw = (a: Article): Treffer => ({ soort: 'artikel', titel: a.title, sub: [a.category, a.date].filter(Boolean).join(' · '), href: `/nieuws/${a.slug}/` })
    setResults(query.trim() ? zoek(query, index) : [...GIDSEN, ...index.slice(0, 4).map(nieuw)])
    setActive(0)
  }, [query, index])

  const navigate = useCallback((href: string) => {
    window.location.href = href
    onClose()
  }, [onClose])

  // Niets gevonden: dan staan de gidsen er, en die zijn ook met de toetsen te kiezen.
  const geen = results.length === 0 && !!query.trim()
  const lijst = geen ? GIDSEN : results

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, lijst.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && lijst[active]) navigate(lijst[active].href)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zoeken"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="search-modal-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(10,11,26,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}
    >
      <div className="search-modal-panel" style={{ width: '100%', maxWidth: 640, background: '#12132A', border: '1px solid #252858', borderRadius: 8, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #252858' }}>
          <span style={{ fontSize: '1rem', opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Zoek gidsen, zwermen, artikelen…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '1rem', fontFamily: 'var(--font-sans)', caretColor: '#378ADD' }}
          />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8', background: '#1a1c42', border: '1px solid #252858', borderRadius: 4, padding: '2px 6px' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="search-modal-results" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {geen && (
            <div style={{ padding: '18px 20px 6px', fontSize: '0.9rem', color: '#9AA6C8' }}>
              Niets gevonden voor &ldquo;{query}&rdquo;. Misschien zoek je een van deze gidsen:
            </div>
          )}
          {lijst.map((t, i) => {
            const kop = i === 0 || lijst[i - 1].soort !== t.soort
            const thumb = t.soort === 'artikel' ? index.find(a => `/nieuws/${a.slug}/` === t.href) : undefined
            return (
              <div key={t.href}>
                {kop && (
                  <div style={{ padding: '12px 20px 4px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A86A8' }}>
                    {t.soort === 'pagina' ? 'Gidsen en pagina’s' : t.soort === 'hemel' ? 'Aan de hemel' : 'Artikelen'}
                  </div>
                )}
                <button
                  onClick={() => navigate(t.href)}
                  onMouseEnter={() => setActive(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '12px 20px',
                    background: i === active ? 'rgba(55,138,221,0.1)' : 'transparent',
                    border: 'none', borderBottom: '1px solid #1a1c3a', cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                >
                  {thumb && (thumb.imageUrl ? (
                    <img src={thumb.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 4, background: '#1a1c42', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {thumb.emoji || '🌌'}
                    </div>
                  ))}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.titel}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9AA6C8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sub}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8', flexShrink: 0 }}>↵</span>
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 20px', borderTop: '1px solid #1a1c3a', display: 'flex', gap: 16 }}>
          {[['↑↓', 'navigeer'], ['↵', 'open'], ['ESC', 'sluit']].map(([key, label]) => (
            <span key={key} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: '#1a1c42', border: '1px solid #252858', borderRadius: 3, padding: '1px 5px', color: '#7A86A8' }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
