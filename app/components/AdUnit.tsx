'use client'
import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT, isSlot } from '@/lib/adsense'

interface AdUnitProps {
  /** Slot-ID uit het AdSense-dashboard (Advertenties → Per advertentieblok). */
  slot: string
  style?: React.CSSProperties
}

declare global {
  interface Window { adsbygoogle: unknown[] }
}

/**
 * AdSense display-unit. Toestemming regelt de Google CMP (via adsbygoogle.js
 * in <head>): zonder toestemming vraagt AdSense zelf geen gepersonaliseerde
 * advertenties op, of geen enkele. Geen eigen consent-check meer.
 * Zonder geldig slot (nog een placeholder) rendert er niets.
 */
export function AdUnit({ slot, style }: AdUnitProps) {
  const pushed = useRef(false)

  useEffect(() => {
    if (!isSlot(slot) || pushed.current) return
    pushed.current = true
    try { ;(window.adsbygoogle = window.adsbygoogle || []).push({}) } catch {}
  }, [slot])

  if (!isSlot(slot)) return null

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
