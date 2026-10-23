'use client'

declare global {
  interface Window { googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void } }
}

/** Opent opnieuw het toestemmingsvenster van Google's CMP. */
export function CookieInstellingen({ style }: { style?: React.CSSProperties }) {
  function open() {
    window.googlefc = window.googlefc || {}
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || []
    window.googlefc.callbackQueue.push(() => window.googlefc?.showRevocationMessage?.())
  }
  return (
    <button type="button" onClick={open} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', ...style }}
      onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
      onMouseLeave={e => (e.currentTarget.style.color = (style?.color as string) ?? '')}
    >
      Cookie-instellingen
    </button>
  )
}
