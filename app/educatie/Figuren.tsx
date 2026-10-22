'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Figuren bij de zes lessen — /educatie

   Elk onderwerp krijgt één figuur die het kernidee laat zien in plaats van
   het te vertellen: je schuift, kiest of kijkt, en de natuurkunde reageert.
   Beweging is hier uitleg (Explanation), geen versiering. Daarom:
   - alleen `transform`-vrije SVG-attributen per frame, en alleen terwijl de
     figuur in beeld is (IntersectionObserver);
   - elke figuur heeft een pauzeknop (WCAG 2.2.2: beweging langer dan 5 s);
   - bij prefers-reduced-motion start hij stil; de bediening werkt gewoon;
   - tekst in de SVG schaalt terug naar echte pixels (--fk), zodat labels
     op een telefoon niet tot 6px krimpen.
   Getallen zijn echt (omlooptijden, ontsnappingssnelheid) of afgerond met
   "ongeveer" erbij; niets is decoratief verzonnen.
   ══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

type Level = 'beg' | 'ama' | 'pro'
type Caption = Record<Level, string>

const nl = (n: number, d = 0) => n.toLocaleString('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d })

/* ── Klok: loopt alleen als de figuur in beeld is en niet gepauzeerd ── */
function useFigure() {
  const ref = useRef<HTMLElement>(null)
  const [playing, setPlaying] = useState(true)
  const [visible, setVisible] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [t, setT] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '80px' })
    io.observe(el)
    /* De SVG schaalt mee met de kolom; --fk houdt de tekst op echte pixels.
       Op een smalle kolom snijdt de figuur zijn eigen kader bij (viewBox),
       zodat het onderwerp groot blijft in plaats van mee te krimpen. */
    const ro = new ResizeObserver(() => {
      const svg = el.querySelector('svg')
      if (!svg) return
      setNarrow(el.getBoundingClientRect().width < 520)
      const w = svg.getBoundingClientRect().width
      const vw = svg.viewBox.baseVal?.width || w
      el.style.setProperty('--fk', String(vw / Math.max(w, 1)))
    })
    ro.observe(el)
    return () => { io.disconnect(); ro.disconnect() }
  }, [])

  useEffect(() => {
    if (!playing || !visible) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      setT(x => x + dt)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, visible])

  return { ref, t, playing, setPlaying, narrow }
}

function Frame({ title, figRef, playing, onToggle, level, caption, children, controls, readout }: {
  title: string
  figRef: React.RefObject<HTMLElement>
  playing: boolean
  onToggle: () => void
  level: Level
  caption: Caption
  children: ReactNode
  controls?: ReactNode
  readout?: ReactNode
}) {
  return (
    <figure className="pl-fig" ref={figRef}>
      <div className="pl-fig__head">
        <span className="pl-label">{title}</span>
        <button type="button" className="pl-fig__play" onClick={onToggle} aria-pressed={!playing}>
          {playing ? 'Pauzeer' : 'Speel af'}
        </button>
      </div>
      <div className="pl-fig__stage">{children}</div>
      {readout && <div className="pl-fig__read" aria-live="off">{readout}</div>}
      {controls && <div className="pl-fig__ctrl">{controls}</div>}
      <figcaption key={level} data-fresh="1">{caption[level]}</figcaption>
    </figure>
  )
}

function Read({ k, v }: { k: string; v: ReactNode }) {
  return (
    <span className="pl-fig__cell">
      <span className="pl-label">{k}</span>
      <span className="pl-num">{v}</span>
    </span>
  )
}

/* ══ 1. Zonnestelsel — vier binnenplaneten op hun echte omlooptijden ════ */
const PLANETS = [
  { n: 'Mercurius', a: 0.387, T: 87.97 },
  { n: 'Venus',     a: 0.723, T: 224.7 },
  { n: 'Aarde',     a: 1,     T: 365.25 },
  { n: 'Mars',      a: 1.524, T: 686.98 },
]
function Banen({ level }: { level: Level }) {
  const f = useFigure()
  const day = 40 + f.t * 46                // één aardjaar ≈ 8 s
  const cx = 280, cy = 118, s = 72
  return (
    <Frame
      title="Planeten op ware snelheid"
      figRef={f.ref} playing={f.playing} onToggle={() => f.setPlaying(p => !p)} level={level}
      caption={{
        beg: 'Hoe dichter bij de zon, hoe sneller de ronde. Mercurius gaat vier keer rond in de tijd dat de Aarde één keer rondgaat.',
        ama: 'De omlooptijden zijn echt: 88, 225, 365 en 687 dagen. Mars heeft bijna twee aardjaren nodig voor één ronde.',
        pro: 'Keplers derde wet: T² ∝ a³. Mars op 1,524 AE geeft T = 1,524^1,5 ≈ 1,88 jaar. De banen zijn hier als cirkels getekend; hun excentriciteit is klein.',
      }}
      readout={<>
        <Read k="Dag" v={nl(Math.floor(day))} />
        <Read k="Rondes Mercurius" v={nl(day / 87.97, 1)} />
        <Read k="Rondes Mars" v={nl(day / 686.98, 2)} />
      </>}
    >
      <svg viewBox={f.narrow ? '130 0 300 236' : '0 0 560 236'} role="img" aria-label="Mercurius, Venus, Aarde en Mars draaien om de zon, elk op zijn echte omlooptijd.">
        <circle cx={cx} cy={cy} r="20" className="pl-fig__halo" />
        <circle cx={cx} cy={cy} r="9" className="pl-fig__sun" />
        {PLANETS.map(p => {
          const ang = (day / p.T) * Math.PI * 2 - Math.PI / 2
          const r = Math.sqrt(p.a) * s * 1.05
          const x = cx + Math.cos(ang) * r
          const y = cy + Math.sin(ang) * r * 0.86
          const earth = p.n === 'Aarde'
          return (
            <g key={p.n}>
              <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.86} className="pl-fig__orbit" />
              <circle cx={x} cy={y} r={earth ? 5.5 : 4.5} className={earth ? 'pl-fig__body pl-fig__body--key' : 'pl-fig__body'} />
              <text x={x + 9} y={y - 7} className="pl-fig__t">{p.n}</text>
            </g>
          )
        })}
      </svg>
    </Frame>
  )
}

/* ══ 2. Sterren — massa bepaalt leven en einde ═════════════════════════════ */
function Sterleven({ level }: { level: Level }) {
  const f = useFigure()
  const [m, setM] = useState(1)            // zonsmassa's
  const life = 10 * Math.pow(m, -2.5)      // miljard jaar, hoofdreeks, grove schaal
  const temp = 5800 * Math.pow(m, 0.5)     // K, grove hoofdreeksrelatie
  const fate = m < 8 ? 'Witte dwerg' : m < 20 ? 'Neutronenster' : 'Zwart gat'
  const phase = (f.t / 7) % 1              // één leven in 7 s
  const stage = phase < 0.62 ? 'Hoofdreeks' : phase < 0.84 ? (m < 8 ? 'Rode reus' : 'Superreus') : m < 8 ? 'Witte dwerg' : 'Supernova → ' + fate.toLowerCase()

  const base = 14 + 16 * Math.pow(Math.min(m, 25), 0.42)
  let r = base, warm = 0, flash = 0
  if (phase >= 0.62 && phase < 0.84) {
    const k = (phase - 0.62) / 0.22
    r = base * (1 + k * 1.3); warm = k
  } else if (phase >= 0.84) {
    const k = (phase - 0.84) / 0.16
    if (m >= 8 && k < 0.35) { flash = 1 - k / 0.35; r = base * 2.3 * (1 + flash * 0.4) }
    else r = m < 8 ? 7 : m < 20 ? 4 : 0
    warm = 0
  }
  /* Kleur volgt de temperatuur: koel = warm wit, heet = blauwwit. */
  const hot = Math.min(Math.max((Math.log10(temp) - 3.5) / 0.9, 0), 1)
  const tint = warm > 0
    ? `color-mix(in srgb, #E8A27A ${Math.round(warm * 70)}%, #EEF2FB)`
    : `color-mix(in srgb, #B5D4F4 ${Math.round(hot * 80)}%, #F3E3C8)`

  return (
    <Frame
      title="Het leven van een ster"
      figRef={f.ref} playing={f.playing} onToggle={() => f.setPlaying(p => !p)} level={level}
      caption={{
        beg: 'Zware sterren leven kort en eindigen met een knal. Een ster als de zon leeft rustig zo’n tien miljard jaar en wordt daarna een witte dwerg.',
        ama: 'Een ster van 10 zonsmassa’s verbrandt zijn brandstof ruim 300 keer sneller dan de zon. Boven ongeveer 8 zonsmassa’s eindigt een ster als supernova.',
        pro: 'Hoofdreeksleeftijd t ≈ 10 mld jaar · (M/M☉)^−2,5, uit L ∝ M^3,5. De grenzen 8 en 20 M☉ zijn indicatief: metalliciteit en massaverlies verschuiven ze.',
      }}
      readout={<>
        <Read k="Fase" v={stage} />
        <Read k="Levensduur" v={life >= 1 ? `≈ ${nl(life, life < 10 ? 1 : 0)} mld jaar` : `≈ ${nl(life * 1000)} mln jaar`} />
        <Read k="Einde" v={fate} />
      </>}
      controls={<>
        <label className="pl-label" htmlFor="pl-fig-m">Massa</label>
        <input id="pl-fig-m" type="range" min="-0.3" max="1.4" step="0.01"
          value={Math.log10(m)} onChange={e => setM(Math.pow(10, +e.target.value))}
          aria-valuetext={`${nl(m, 1)} zonsmassa’s`} />
        <span className="pl-num pl-fig__val">{nl(m, 1)} M☉</span>
      </>}
    >
      <svg viewBox={f.narrow ? '120 0 320 236' : '0 0 560 236'} role="img" aria-label={`Een ster van ${nl(m, 1)} zonsmassa’s doorloopt zijn leven: hoofdreeks, reus en eindstadium ${fate.toLowerCase()}.`}>
        {flash > 0 && <circle cx="280" cy="112" r={r * 1.5} className="pl-fig__flash" style={{ opacity: flash * 0.55 }} />}
        {r > 0 && <circle cx="280" cy="112" r={r + 14} className="pl-fig__halo" />}
        {r > 0 && <circle cx="280" cy="112" r={r} style={{ fill: tint }} />}
        {r === 0 && <circle cx="280" cy="112" r="10" className="pl-fig__hole" />}
        <line x1="140" x2="420" y1="222" y2="222" className="pl-fig__axis" />
        <line x1="140" x2={140 + 280 * phase} y1="222" y2="222" className="pl-fig__progress" />
      </svg>
    </Frame>
  )
}

/* ══ 3. Sterrenstelsels — rotatiecurve met en zonder donkere materie ═══════ */
const RINGS = [1, 2, 3, 4, 5, 6]
function Rotatie({ level }: { level: Level }) {
  const f = useFigure()
  const [dm, setDm] = useState(true)
  /* hoeksnelheid ω = v/r; zonder donkere materie v ∝ 1/√r, met: v vlak */
  const omega = (r: number) => (dm ? 1 / r : Math.pow(r, -1.5)) * 0.9
  const cx = 150, cy = 118
  return (
    <Frame
      title="Hoe snel draait een sterrenstelsel?"
      figRef={f.ref} playing={f.playing} onToggle={() => f.setPlaying(p => !p)} level={level}
      caption={{
        beg: 'Als alleen de zichtbare sterren trokken, zouden de buitenste sterren traag rondgaan. Ze gaan net zo snel als de binnenste. Er moet dus onzichtbare massa zijn.',
        ama: 'Vera Rubin mat in de jaren 70 dat de rotatiecurve vlak blijft. De lijn "verwacht" is wat zichtbare materie alleen zou geven; de punten volgen de gemeten vlakke curve.',
        pro: 'Een vlakke v(r) vraagt M(r) ∝ r, een halo met ρ ∝ r^−2 ver buiten de schijf. De verwachte curve hier is Kepleriaans (v ∝ r^−½), een vereenvoudiging van de echte schijfbijdrage.',
      }}
      controls={
        <div className="pl-seg pl-seg--tap" role="group" aria-label="Kies de massa in het stelsel">
          <button type="button" aria-pressed={!dm} onClick={() => setDm(false)}>Alleen zichtbaar</button>
          <button type="button" aria-pressed={dm} onClick={() => setDm(true)}>Met donkere materie</button>
        </div>
      }
    >
      <svg viewBox="0 0 560 236" role="img" aria-label={dm ? 'Sterren in een stelsel met donkere materie: binnen en buiten draaien even snel.' : 'Sterren in een stelsel zonder donkere materie: de buitenste sterren draaien veel trager.'}>
        {dm && <circle cx={cx} cy={cy} r="112" className="pl-fig__dmhalo" />}
        <ellipse cx={cx} cy={cy} rx="16" ry="14" className="pl-fig__sun" />
        {RINGS.map(r => Array.from({ length: 5 + r }, (_, i) => {
          const a = (i / (5 + r)) * Math.PI * 2 + f.t * omega(r) + r
          return <circle key={`${r}-${i}`} cx={cx + Math.cos(a) * r * 16} cy={cy + Math.sin(a) * r * 14} r={r === 6 ? 3 : 2.2} className={r === 6 ? 'pl-fig__body pl-fig__body--key' : 'pl-fig__body'} />
        }))}
        {/* v(r)-grafiek */}
        <g transform="translate(320 30)">
          <line x1="0" x2="0" y1="0" y2="160" className="pl-fig__axis" />
          <line x1="0" x2="210" y1="160" y2="160" className="pl-fig__axis" />
          <text x="0" y="-10" className="pl-fig__t">snelheid</text>
          <text x="210" y="182" textAnchor="end" className="pl-fig__t">afstand tot centrum</text>
          <polyline className={dm ? 'pl-fig__curve pl-fig__curve--dim' : 'pl-fig__curve'}
            points={Array.from({ length: 30 }, (_, i) => { const r = 0.6 + i * 0.2; return `${r * 33},${160 - 120 / Math.sqrt(r) * 0.85}` }).join(' ')} />
          <polyline className={dm ? 'pl-fig__curve' : 'pl-fig__curve pl-fig__curve--dim'}
            points={Array.from({ length: 30 }, (_, i) => { const r = 0.6 + i * 0.2; return `${r * 33},${160 - 120 * 0.85 * Math.min(1, r / 1.1) ** 0.5}` }).join(' ')} />
          {RINGS.map(r => <circle key={r} cx={r * 33} cy={160 - 120 * 0.85 * Math.min(1, r / 1.1) ** 0.5 + ((r * 7) % 5) - 2} r="3" className="pl-fig__dot" />)}
          <text x="206" y={160 - 120 / Math.sqrt(6.4) * 0.85 + 16} textAnchor="end" className="pl-fig__t">verwacht</text>
          <text x="206" y={160 - 102 - 8} textAnchor="end" className="pl-fig__t">gemeten</text>
        </g>
      </svg>
    </Frame>
  )
}

/* ══ 4. Kosmologie — uitdijing zonder middelpunt ═══════════════════════════ */
/* Gelijkmatig verspreid (gulden hoek) met een vaste kleine afwijking, zodat
   het veld er willekeurig uitziet maar overal even vol is. */
const GAL = Array.from({ length: 40 }, (_, i) => {
  const r = Math.sqrt((i + 0.5) / 40) * 1.5
  const a = i * 2.39996
  const j = Math.sin(i * 12.9898) * 43758.5453
  const jit = (j - Math.floor(j)) * 0.14
  return { x: Math.cos(a) * r + jit, y: Math.sin(a) * r - jit }
})
function Uitdijing({ level }: { level: Level }) {
  const f = useFigure()
  const [home, setHome] = useState(0)
  const cyc = ((f.t + 4) / 7) % 1        // start halverwege, ook als hij stilstaat
  const scale = 1 + 0.55 * cyc               // schaalfactor groeit, daarna opnieuw
  const fade = cyc > 0.9 ? 1 - (cyc - 0.9) / 0.1 : cyc < 0.06 ? cyc / 0.06 : 1
  const h = GAL[home]
  const W = 560, H = 236, sx = 150, sy = 62
  /* Het thuisstelsel staat in het midden; alles schaalt vanaf daar. */
  const pos = (g: { x: number; y: number }, k: number) => ({
    x: W / 2 + (g.x - h.x) * sx * k,
    y: H / 2 + (g.y - h.y) * sy * k,
  })
  return (
    <Frame
      title="Uitdijend heelal"
      figRef={f.ref} playing={f.playing} onToggle={() => f.setPlaying(p => !p)} level={level}
      caption={{
        beg: 'Kies een ander sterrenstelsel als thuis: vanaf elk stelsel lijkt de rest weg te vliegen. Het heelal heeft geen middelpunt, de ruimte zelf rekt uit.',
        ama: 'Hoe verder weg, hoe langer het pijltje: dat is de wet van Hubble, v = H₀ · d. Met H₀ ≈ 70 km/s per megaparsec.',
        pro: 'Alle afstanden schalen met a(t): d = a(t)·χ, dus v = (ȧ/a)·d = H·d vanuit elk punt. Isotropie vanaf elke waarnemer is het kosmologisch principe.',
      }}
      readout={<>
        <Read k="Schaalfactor" v={`× ${nl(scale, 2)}`} />
        <Read k="Thuis" v={`stelsel ${home + 1}`} />
      </>}
      controls={
        <button type="button" className="pl-btn" onClick={() => setHome(x => (x + 5) % GAL.length)}>
          Ander thuisstelsel
        </button>
      }
    >
      <svg viewBox={f.narrow ? `120 0 320 ${H}` : `0 0 ${W} ${H}`} role="img" aria-label="Sterrenstelsels bewegen van elkaar weg; vanaf het gekozen thuisstelsel vliegen verre stelsels sneller weg dan nabije.">
        <g style={{ opacity: fade }}>
          {GAL.map((g, i) => {
            const p = pos(g, scale), p0 = pos(g, 1)
            const me = i === home
            return (
              <g key={i}>
                {!me && <line x1={p0.x} y1={p0.y} x2={p.x} y2={p.y} className="pl-fig__vec" />}
                <circle cx={p.x} cy={p.y} r={me ? 6 : 3.4}
                  className={me ? 'pl-fig__body pl-fig__body--key' : 'pl-fig__body'}
                  onClick={() => setHome(i)} style={{ cursor: 'pointer' }} />
              </g>
            )
          })}
        </g>
        <text x={pos(h, scale).x + 10} y={pos(h, scale).y - 9} className="pl-fig__t" style={{ opacity: fade }}>thuis</text>
      </svg>
    </Frame>
  )
}

/* ══ 5. Exoplaneten — de transitmethode ════════════════════════════════════ */
function Transit({ level }: { level: Level }) {
  const f = useFigure()
  const [k, setK] = useState(0.18)                 // Rplaneet / Rster
  const W = 560, cx = 280, cy = 78, R = 56
  const p = (f.t / 6 + 0.5) % 1          // start midden in de overgang
  const px = 40 + p * (W - 80)
  /* Bedekte fractie: volle schijf binnen de rand, lineair erover heen. */
  const cover = (x: number) => {
    const d = Math.abs(x - cx) / R
    return d <= 1 - k ? 1 : d >= 1 + k ? 0 : (1 + k - d) / (2 * k)
  }
  const flux = (x: number) => 1 - cover(x) * k * k
  const gy = (fl: number) => 178 + (1 - fl) / 0.1 * 48
  const pts: string[] = []
  for (let i = 0; i <= 140; i++) {
    const tx = 40 + (i / 140) * (W - 80)
    if (tx > px) break
    pts.push(`${tx.toFixed(1)},${gy(flux(tx)).toFixed(1)}`)
  }
  return (
    <Frame
      title="De transitmethode"
      figRef={f.ref} playing={f.playing} onToggle={() => f.setPlaying(p => !p)} level={level}
      caption={{
        beg: 'Schuif aan de planeet. Schuift hij voor zijn ster, dan wordt de ster heel even iets donkerder. Zo vond Kepler duizenden planeten die hij nooit zag.',
        ama: 'Een twee keer zo grote planeet geeft een vier keer zo diepe dip. Jupiter voor de zon: zo’n 1 %. De Aarde: maar 0,008 %.',
        pro: 'Diepte ΔF/F = (Rp/R★)². De vorm van in- en uittrede hangt af van impactparameter en randverduistering; die laat deze schets weg.',
      }}
      readout={<>
        <Read k="Helderheid" v={`${nl(flux(px) * 100, 2)} %`} />
        <Read k="Diepte dip" v={`${nl(k * k * 100, 2)} %`} />
      </>}
      controls={<>
        <label className="pl-label" htmlFor="pl-fig-k">Planeet</label>
        <input id="pl-fig-k" type="range" min="0.06" max="0.32" step="0.01" value={k}
          onChange={e => setK(+e.target.value)} aria-valuetext={`straal ${nl(k * 100)} procent van de ster`} />
        <span className="pl-num pl-fig__val">{nl(k * 100)} % van ster</span>
      </>}
    >
      <svg viewBox={f.narrow ? '120 0 320 236' : `0 0 ${W} 236`} role="img" aria-label="Een planeet trekt voor zijn ster langs; de lichtcurve eronder daalt even.">
        <defs>
          <radialGradient id="pl-fig-star" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EEF2FB" />
            <stop offset="72%" stopColor="#B5D4F4" />
            <stop offset="100%" stopColor="#185FA5" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R + 14} className="pl-fig__halo" />
        <circle cx={cx} cy={cy} r={R} fill="url(#pl-fig-star)" />
        <circle cx={px} cy={cy + 6} r={R * k} className="pl-fig__planet" />
        <line x1="40" x2={W - 40} y1={gy(1)} y2={gy(1)} className="pl-fig__axis" />
        <polyline points={pts.join(' ')} className="pl-fig__curve" />
        <circle cx={px} cy={gy(flux(px))} r="3.5" className="pl-fig__dot" />
        <text x={f.narrow ? 130 : 40} y={gy(1) - 8} className="pl-fig__t">lichtcurve</text>
      </svg>
    </Frame>
  )
}

/* ══ 6. Ruimtevaart — Newtons kanonskogel ═════════════════════════════════ */
const GM = 398600            // km³/s²
const RE = 6371              // km
const ALT = 400              // km, hoogte van het ISS
function baan(v: number) {
  /* Leapfrog-integratie vanaf 400 km hoogte, horizontaal weg. */
  let x = 0, y = RE + ALT, vx = v, vy = 0
  const dt = 8
  const pts: [number, number][] = [[x, y]]
  let end: 'grond' | 'baan' | 'weg' = 'baan'
  for (let i = 0; i < 2600; i++) {
    let r = Math.hypot(x, y)
    vx += -GM * x / r ** 3 * dt / 2; vy += -GM * y / r ** 3 * dt / 2
    x += vx * dt; y += vy * dt
    r = Math.hypot(x, y)
    vx += -GM * x / r ** 3 * dt / 2; vy += -GM * y / r ** 3 * dt / 2
    if (i % 3 === 0) pts.push([x, y])
    if (r < RE) { end = 'grond'; break }
    if (r > RE * 6) { end = 'weg'; break }
  }
  return { pts, end }
}
function Kanon({ level }: { level: Level }) {
  const f = useFigure()
  const [v, setV] = useState(7.7)
  const [path, setPath] = useState(() => baan(7.7))
  const [t0, setT0] = useState(0)
  const set = useCallback((nv: number) => { setV(nv); setPath(baan(nv)); setT0(f.t) }, [f.t])
  const scale = 52 / RE                 // aarde 52 px straal
  const cx = 200, cy = 118
  /* Teken de baan op, houd hem even vast, en begin opnieuw. */
  const step = f.playing ? Math.floor(((f.t - t0) * 70) % (path.pts.length + 84)) : path.pts.length
  const shown = path.pts.slice(0, Math.max(Math.min(step + 2, path.pts.length), 2))
  const vCirc = Math.sqrt(GM / (RE + ALT))
  const vEsc = Math.sqrt(2 * GM / (RE + ALT))
  const uitkomst = path.end === 'grond' ? 'valt terug op Aarde' : path.end === 'weg' ? 'ontsnapt aan de Aarde' : 'blijft in een baan'
  return (
    <Frame
      title="Hoe snel moet je om in een baan te blijven?"
      figRef={f.ref} playing={f.playing} onToggle={() => f.setPlaying(p => !p)} level={level}
      caption={{
        beg: 'In een baan blijven is eigenlijk steeds vallen, maar zo snel opzij gaan dat je de grond mist. Op de hoogte van het ISS lukt dat bij bijna 8 kilometer per seconde.',
        ama: `Op 400 km hoogte is de cirkelsnelheid ${nl(vCirc, 2)} km/s. Iets sneller geeft een ellips; vanaf ${nl(vEsc, 1)} km/s kom je nooit meer terug.`,
        pro: `v_cirkel = √(GM/r) = ${nl(vCirc, 2)} km/s en v_ontsnap = √2 · v_cirkel = ${nl(vEsc, 2)} km/s bij r = R⊕ + 400 km. Geen luchtweerstand in deze integratie.`,
      }}
      readout={<>
        <Read k="Snelheid" v={`${nl(v, 1)} km/s`} />
        <Read k="Uitkomst" v={uitkomst} />
        <Read k="Baan · ontsnappen" v={`${nl(vCirc, 1)} · ${nl(vEsc, 1)} km/s`} />
      </>}
      controls={<>
        <label className="pl-label" htmlFor="pl-fig-v">Snelheid</label>
        <input id="pl-fig-v" type="range" min="5" max="11.5" step="0.1" value={v}
          onChange={e => set(+e.target.value)} aria-valuetext={`${nl(v, 1)} kilometer per seconde, ${uitkomst}`} />
        <span className="pl-num pl-fig__val">{nl(v, 1)} km/s</span>
      </>}
    >
      <svg viewBox={f.narrow ? '50 0 300 236' : '0 0 560 236'} role="img" aria-label={`Een object vertrekt op 400 km hoogte met ${nl(v, 1)} km/s en ${uitkomst}.`}>
        <circle cx={cx} cy={cy} r={RE * scale + 10} className="pl-fig__halo" />
        <circle cx={cx} cy={cy} r={RE * scale} className="pl-fig__earth" />
        <polyline className="pl-fig__curve"
          points={shown.map(([x, y]) => `${(cx + x * scale).toFixed(1)},${(cy - y * scale).toFixed(1)}`).join(' ')} />
        {(() => { const [x, y] = shown[shown.length - 1]; return <circle cx={cx + x * scale} cy={cy - y * scale} r="4" className="pl-fig__body pl-fig__body--key" /> })()}
        <text x={cx} y={cy + 4} textAnchor="middle" className="pl-fig__t">Aarde</text>
      </svg>
    </Frame>
  )
}

export function LessonFigure({ topicId, level }: { topicId: string; level: Level }) {
  switch (topicId) {
    case 'zonnestelsel':    return <Banen level={level} />
    case 'sterren':         return <Sterleven level={level} />
    case 'sterrenstelsels': return <Rotatie level={level} />
    case 'kosmologie':      return <Uitdijing level={level} />
    case 'exoplaneten':     return <Transit level={level} />
    case 'ruimtevaart':     return <Kanon level={level} />
    default:                return null
  }
}
