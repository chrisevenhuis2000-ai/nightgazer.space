'use client'
import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT } from './AdSenseScript'

interface AdUnitProps {
  /** Slot-ID uit jouw AdSense-dashboard (Advertenties → Weergaveadvertenties → slot) */
  slot: string
  style?: React.CSSProperties
}

declare global {
  interface Window { adsbygoogle: unknown[] }
}

/**
 * AdSense display-unit. Toestemming (gepersonaliseerd of niet) regelt
 * Google's CMP; de unit staat er dus altijd.
 * Roep in AdSense-dashboard "Weergaveadvertentie" aan per gewenste plek en
 * kopieer het gegenereerde slot-ID als prop mee.
 */
export function AdUnit({ slot, style }: AdUnitProps) {
  const pushed = useRef(false)

  // Push naar adsbygoogle zodra de <ins> in de DOM staat
  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try { ;(window.adsbygoogle = window.adsbygoogle || []).push({}) } catch {}
  }, [])

  return (
    <div style={{ textAlign: 'center', overflow: 'hidden', lineHeight: 0, ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
