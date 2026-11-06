/* Optische schema's voor /sterrenkijken/uitrusting en de telescoopgids. */
import type { Vorm } from '@/lib/uitrusting'

/* ── Optische schema's: geometrie, geen tekening. Romp in stempelblauw,
      licht in baanblauw; nooit het live-blauw, want niets hier verandert. ── */
export function Schema({ vorm }: { vorm: Vorm }) {
  const romp = { fill: 'none', stroke: 'var(--pl-stamp)', strokeWidth: 1.2, vectorEffect: 'non-scaling-stroke' as const }
  const licht = { fill: 'none', stroke: 'var(--pl-orbit)', strokeWidth: 1.4, vectorEffect: 'non-scaling-stroke' as const }
  const naam = { porro: 'Verrekijker met porroprisma', newton: 'Newton-spiegeltelescoop', maknewt: 'Maksutov-Newton', lens: 'Lenzentelescoop' }[vorm]

  if (vorm === 'lens') {
    return (
      <svg viewBox="0 0 240 64" className="pl-uitr__schema" role="img" aria-label={`Schema: ${naam}. Licht gaat door de objectieflens voorin en komt via een spiegelprisma achterin bij het oculair uit.`}>
        {/* buis */}
        <rect x="18" y="16" width="176" height="32" {...romp} />
        {/* objectief voorin */}
        <path d="M24 14 Q32 32 24 50 Q16 32 24 14 Z" {...romp} />
        {/* zenitprisma en oculair */}
        <path d="M194 22 L214 22 L214 42 Z" {...romp} />
        <rect x="200" y="0" width="14" height="14" {...romp} />
        {/* licht */}
        <polyline points="0,20 24,20 207,32" {...licht} />
        <polyline points="0,44 24,44 207,32" {...licht} />
        <line x1="207" y1="32" x2="207" y2="0" {...licht} />
      </svg>
    )
  }

  if (vorm === 'porro') {
    return (
      <svg viewBox="0 0 240 64" className="pl-uitr__schema" role="img" aria-label={`Schema: ${naam}. Licht gaat door de objectieflens, wordt door twee prisma's teruggekaatst en komt bij het oculair uit.`}>
        {/* objectief */}
        <path d="M30 10 Q38 32 30 54 Q22 32 30 10 Z" {...romp} />
        {/* twee prisma's, verspringend */}
        <rect x="112" y="22" width="26" height="26" {...romp} />
        <rect x="146" y="14" width="26" height="26" {...romp} />
        {/* oculair */}
        <rect x="206" y="20" width="14" height="14" {...romp} />
        {/* licht */}
        <polyline points="0,16 30,16 125,35" {...licht} />
        <polyline points="0,48 30,48 125,35" {...licht} />
        <polyline points="125,35 159,35 159,27 213,27" {...licht} strokeDasharray="3 3" />
        <line x1="213" y1="27" x2="240" y2="27" {...licht} />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 240 64" className="pl-uitr__schema" role="img" aria-label={`Schema: ${naam}. Licht valt de buis in, de holle spiegel achterin kaatst het terug naar een vlak spiegeltje dat het naar het oculair aan de zijkant stuurt.`}>
      {/* buis */}
      <rect x="10" y="12" width="214" height="40" {...romp} />
      {/* corrector voor de Maksutov-Newton */}
      {vorm === 'maknewt' && <path d="M16 12 Q22 32 16 52 M22 12 Q28 32 22 52" {...romp} />}
      {/* hoofdspiegel, hol */}
      <path d="M220 14 Q212 32 220 50" {...romp} strokeWidth={2} />
      {/* vangspiegel onder 45° en het oculair aan de zijkant */}
      <line x1="54" y1="38" x2="66" y2="26" {...romp} strokeWidth={2} />
      <rect x="54" y="0" width="12" height="12" {...romp} />
      {/* licht */}
      <polyline points="0,20 216,20 60,32" {...licht} />
      <polyline points="0,44 216,44 60,32" {...licht} />
      <line x1="60" y1="32" x2="60" y2="0" {...licht} />
    </svg>
  )
}
