'use client'

import { useEffect, useState } from 'react'

interface Artikel {
  slug:  string
  title: string
  date:  string
}

const SITE_URL = 'https://nightgazer.space'
const OPSLAG   = 'ng-x-geplaatst'
const AANTAL   = 30

// De X-webintent: gratis, in tegenstelling tot posten via de API.
function intentUrl(a: Artikel) {
  const q = new URLSearchParams({ text: a.title, url: `${SITE_URL}/nieuws/${a.slug}/` })
  return `https://x.com/intent/post?${q}`
}

function leesGeplaatst(): string[] {
  try { return JSON.parse(localStorage.getItem(OPSLAG) || '[]') } catch { return [] }
}

function bewaarGeplaatst(slugs: string[]) {
  try { localStorage.setItem(OPSLAG, JSON.stringify(slugs)) } catch { /* privévenster */ }
}

export function XPosten() {
  const [artikelen, setArtikelen] = useState<Artikel[] | null>(null)
  const [fout, setFout]           = useState(false)
  const [geplaatst, setGeplaatst] = useState<string[]>([])
  const [alles, setAlles]         = useState(false)

  useEffect(() => {
    setGeplaatst(leesGeplaatst())
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((lijst: Artikel[]) => setArtikelen(lijst.slice(0, AANTAL)))
      .catch(() => setFout(true))
  }, [])

  const markeer = (slug: string, aan: boolean) => {
    const volgende = aan ? [...new Set([...geplaatst, slug])] : geplaatst.filter(s => s !== slug)
    setGeplaatst(volgende)
    bewaarGeplaatst(volgende)
  }

  if (fout) return <p style={{ color: '#8A9BC4' }}>De artikelen konden niet worden geladen.</p>
  if (!artikelen) return <p style={{ color: '#7A86A8' }}>Laden…</p>

  const zichtbaar = alles ? artikelen : artikelen.filter(a => !geplaatst.includes(a.slug))

  return (
    <div style={{ maxWidth: 720 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#8A9BC4', marginBottom: 20 }}>
        <input type="checkbox" checked={alles} onChange={e => setAlles(e.target.checked)} />
        Ook al geplaatste artikelen tonen
      </label>

      {zichtbaar.length === 0 && (
        <p style={{ color: '#8A9BC4', fontSize: '0.88rem' }}>Alles van de laatste {AANTAL} artikelen staat al op X.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
        {zichtbaar.map(a => {
          const gedaan = geplaatst.includes(a.slug)
          return (
            <li key={a.slug} style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, opacity: gedaan ? 0.55 : 1 }}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <a href={`/nieuws/${a.slug}/`} style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.92rem', textDecoration: 'none' }}>{a.title}</a>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7A86A8', marginTop: 4 }}>{a.date}</div>
              </div>
              {gedaan ? (
                <button type="button" onClick={() => markeer(a.slug, false)}
                  style={{ background: 'none', border: '1px solid #2A2E62', borderRadius: 4, color: '#7A86A8', padding: '8px 14px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Geplaatst · ongedaan maken
                </button>
              ) : (
                <a href={intentUrl(a)} target="_blank" rel="noopener noreferrer" onClick={() => markeer(a.slug, true)}
                  style={{ background: '#378ADD', borderRadius: 4, color: '#FFFFFF', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Plaats op X
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
