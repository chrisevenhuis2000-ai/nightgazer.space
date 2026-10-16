'use client'

import { useState } from 'react'

declare global {
  interface Window {
    googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void }
  }
}

/* Opent het toestemmingsvenster van de Google CMP opnieuw
   (googlefc.showRevocationMessage), zodat bezoekers hun keuze kunnen
   wijzigen of intrekken. Is de CMP niet geladen (bijv. door een adblocker),
   dan in de footer naar de uitleg op /privacy, en op /privacy zelf een
   melding. */
export function PrivacyInstellingen({ label = 'Privacyinstellingen', opPrivacyPagina = false, style }: {
  label?: string
  opPrivacyPagina?: boolean
  style?: React.CSSProperties
}) {
  const [melding, setMelding] = useState(false)

  function open() {
    const fc = window.googlefc
    if (fc && typeof fc.showRevocationMessage === 'function') { fc.showRevocationMessage(); return }
    if (opPrivacyPagina) setMelding(true)
    else window.location.href = '/privacy#toestemming'
  }

  return (
    <>
      <button type="button" onClick={open} className="footer-link"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7A86A8', textDecoration: 'underline', textUnderlineOffset: 3, ...style }}>
        {label}
      </button>
      {melding && (
        <span role="status" style={{ display: 'block', marginTop: 8, fontSize: '0.82rem', color: '#8A9BC4' }}>
          Het toestemmingsvenster van Google kon niet geladen worden (een adblocker blokkeert het vaak). Zonder dat venster
          plaatst Google ook geen advertentie- of analysecookies. Je kunt bestaande cookies van nightgazer.space altijd
          verwijderen via de instellingen van je browser.
        </span>
      )}
    </>
  )
}
