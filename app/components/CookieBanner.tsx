'use client'

/* Eigen, kleine toestemmingsbanner voor alleen Google Analytics.
   Nodig zolang de CMP van Google (AdSense → Privacy en berichten) nog niet
   actief is: zonder toestemming krijgt GA4 geen meetbare gegevens.
   Advertentiecookies blijven 'denied'; daarover gaat deze banner niet.
   De keuze staat in localStorage; 'Cookie-instellingen' in de footer
   opent de banner opnieuw. */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ANALYTICS_KEUZE } from './AdSenseScript'

export const OPEN_BANNER = 'ng-cookie-instellingen'

declare global {
  interface Window { dataLayer?: unknown[] }
}

function zetToestemming(ja: boolean) {
  try { localStorage.setItem(ANALYTICS_KEUZE, ja ? 'ja' : 'nee') } catch {}
  window.dataLayer = window.dataLayer || []
  // gtag verwacht een arguments-object, geen gewone array.
  // eslint-disable-next-line prefer-rest-params
  const gtag = function (..._a: unknown[]) { window.dataLayer!.push(arguments) }
  gtag('consent', 'update', { analytics_storage: ja ? 'granted' : 'denied' })
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let keuze: string | null = null
    try { keuze = localStorage.getItem(ANALYTICS_KEUZE) } catch {}
    if (keuze !== 'ja' && keuze !== 'nee') setOpen(true)
    const heropen = () => setOpen(true)
    window.addEventListener(OPEN_BANNER, heropen)
    return () => window.removeEventListener(OPEN_BANNER, heropen)
  }, [])

  if (!open) return null

  function kies(ja: boolean) {
    zetToestemming(ja)
    setOpen(false)
  }

  const knop: React.CSSProperties = {
    padding: '9px 16px', borderRadius: 3, cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600,
  }

  return (
    <div role="dialog" aria-live="polite" aria-label="Toestemming voor bezoekersstatistieken"
      style={{
        position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 1000,
        maxWidth: 560, margin: '0 auto',
        background: '#12132A', border: '1px solid #252858', borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: '18px 20px',
      }}>
      <p style={{ fontSize: '0.88rem', color: '#C8D0E0', lineHeight: 1.6, margin: 0 }}>
        Mag NightGazer anonieme bezoekersstatistieken bijhouden met Google Analytics?
        Dat helpt mij zien welke artikelen jullie lezen. Daarvoor zet Google een
        analytische cookie. Advertentiecookies worden niet geplaatst.{' '}
        <Link href="/privacy/" style={{ color: '#378ADD', textDecoration: 'none' }}>Privacy</Link>
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => kies(true)}
          style={{ ...knop, background: '#2563B8', color: '#FFFFFF', border: '1px solid #2563B8' }}>
          Accepteren
        </button>
        <button type="button" onClick={() => kies(false)}
          style={{ ...knop, background: 'transparent', color: '#C8D0E0', border: '1px solid #3A3F78' }}>
          Weigeren
        </button>
      </div>
    </div>
  )
}
