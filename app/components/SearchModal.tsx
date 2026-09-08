'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
  const [results, setResults] = useState<Article[]>([])
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

  // Filter on query
  useEffect(() => {
    if (!query.trim()) { setResults(index.slice(0, 6)); setActive(0); return }
    const q = query.toLowerCase()
    const matches = index.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    ).slice(0, 8)
    setResults(matches)
    setActive(0)
  }, [query, index])

  const navigate = useCallback((slug: string) => {
    window.location.href = `/nieuws/${slug}`
    onClose()
  }, [onClose])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && results[active]) navigate(results[active].slug)
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
            placeholder="Zoek artikelen…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '1rem', fontFamily: 'var(--font-sans)', caretColor: '#378ADD' }}
          />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#7A86A8', background: '#1a1c42', border: '1px solid #252858', borderRadius: 4, padding: '2px 6px' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="search-modal-results" style={{ maxHeight: 400, overflowY: 'auto' }}>
          {results.length === 0 && query ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.77rem', color: '#7A86A8' }}>
              Geen artikelen gevonden voor "{query}"
            </div>
          ) : (
            results.map((a, i) => (
              <button
                key={a.slug}
                onClick={() => navigate(a.slug)}
                onMouseEnter={() => setActive(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '12px 20px',
                  background: i === active ? 'rgba(55,138,221,0.1)' : 'transparent',
                  border: 'none', borderBottom: '1px solid #1a1c3a', cursor: 'pointer',
                  textAlign: 'left', transition: 'background 0.1s',
                }}
              >
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 4, background: '#1a1c42', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {a.emoji || '🌌'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: a.catColor || '#7aadff' }}>{a.category}</span>
                    {a.date && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8' }}>{a.date}</span>}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#7A86A8', flexShrink: 0 }}>↵</span>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 20px', borderTop: '1px solid #1a1c3a', display: 'flex', gap: 16 }}>
          {[['↑↓', 'navigeer'], ['↵', 'open'], ['ESC', 'sluit']].map(([key, label]) => (
            <span key={key} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: '#1a1c42', border: '1px solid #252858', borderRadius: 3, padding: '1px 5px', color: '#7A86A8' }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
