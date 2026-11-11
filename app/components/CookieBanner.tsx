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
import { archivo } from '@/app/_plate/shared'

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

  return (
    <div role="dialog" aria-live="polite" aria-labelledby="ng-toestemming-kop" className={`ng-toestemming ${archivo.variable}`}>
      <p id="ng-toestemming-kop" className="ng-toestemming__label">Toestemming · Statistieken</p>
      <p className="ng-toestemming__tekst">
        Mag ik anoniem meten welke artikelen gelezen worden? Google Analytics zet
        daarvoor één cookie. Geen advertentiecookies.{' '}
        <Link href="/privacy/" className="ng-toestemming__link">Privacy</Link>
      </p>
      <div className="ng-toestemming__knoppen">
        <button type="button" onClick={() => kies(true)} className="ng-toestemming__knop ng-toestemming__knop--ja">
          Accepteren
        </button>
        <button type="button" onClick={() => kies(false)} className="ng-toestemming__knop">
          Weigeren
        </button>
      </div>
    </div>
  )
}
