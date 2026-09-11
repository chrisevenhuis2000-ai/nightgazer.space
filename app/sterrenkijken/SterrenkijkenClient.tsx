'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  type Location, type WeatherData, type ScoreData, type DayForecast,
  PRESET_LOCATIONS, DARK_SPOTS, METEORS, SEASONS, SKY_OBJECTS, BORTLE_COLORS,
  calcDistance, calcScore, getMoonPhase,
} from '@/lib/sky-data'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ApodCard from '@/app/components/ApodCard'
import AuroraAlert from './AuroraAlert'
import { AdUnit } from '@/app/components/AdUnit'
import { SiteFooter, type FooterCol } from '@/app/components/SiteFooter'

const DarkSkyMap = dynamic(() => import('./DarkSkyMap'), {
  ssr:     false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#0d1030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A86A8' }}>Kaart laden...</span>
    </div>
  ),
})


// ── Nav + constants ─────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/nieuws',        label: 'Nieuws' },
  { href: '/sterrenkijken', label: 'Sterrenkijken' },
  { href: '/missies',       label: 'Missies' },
  { href: '/educatie',      label: 'Educatie' },
]



// ── SiteNav ─────────────────────────────────────────────────────────────────

function SiteNav({ onLocatieClick, locationName }: { onLocatieClick: () => void; locationName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = useCallback(() => setMobileOpen(false), [])
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, close])

  return (
    <>
      <nav aria-label="Hoofdnavigatie" style={{ position: 'sticky', top: 0, zIndex: 40, height: 'var(--nav-h)', background: 'rgba(26,26,46,0.96)', borderBottom: '1px solid #252858', backdropFilter: 'blur(16px)' }}>
        <div className="nav-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 40 }}>
          <Link href="/" aria-label="NightGazer — naar de startpagina" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 46, width: 'auto', display: 'block' }} />
          </Link>
          <ul className="nav-links" role="list" style={{ gap: 32, flex: 1, justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === '/sterrenkijken'
              return (
                <li key={href}>
                  <Link href={href} style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: isActive ? '#FFFFFF' : '#7A86A8', textDecoration: 'none', transition: 'color 0.15s', padding: '8px 0', borderBottom: isActive ? '1px solid #378ADD' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = isActive ? '#FFFFFF' : '#7A86A8')}
                  >{label}</Link>
                </li>
              )
            })}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {/* Location pill in nav (desktop) */}
            <button onClick={onLocatieClick} className="nav-loc-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A9BC4', background: 'none', border: '1px solid #252858', borderRadius: 3, padding: '5px 12px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s', maxWidth: 160, overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.color = '#378ADD' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' }}
            >
              <span>📍</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationName}</span>
            </button>
            <button className="nav-hamburger" aria-expanded={mobileOpen} aria-controls="mobile-nav" aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'} onClick={() => setMobileOpen(o => !o)} style={{ flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ display: 'block', width: 22, height: 2, background: '#8A9BC4', borderRadius: 1, transition: 'transform 0.25s, opacity 0.25s', transform: mobileOpen ? i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : 'none' : 'none', opacity: mobileOpen && i === 1 ? 0 : 1 }} />
              ))}
            </button>
          </div>
        </div>
      </nav>
      {mobileOpen && (
        <div id="mobile-nav" role="navigation" aria-label="Mobiele navigatie" style={{ position: 'fixed', top: 'calc(var(--topbar-h, 0px) + var(--nav-h))', left: 0, right: 0, background: 'rgba(26,26,46,0.98)', borderBottom: '1px solid #252858', backdropFilter: 'blur(20px)', padding: '24px', zIndex: 39, display: 'flex', flexDirection: 'column', gap: 4, animation: 'fadeIn 0.2s ease both' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={close} style={{ display: 'block', padding: '12px 0', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: href === '/sterrenkijken' ? '#FFFFFF' : '#8A9BC4', borderBottom: '1px solid #252858', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = href === '/sterrenkijken' ? '#FFFFFF' : '#8A9BC4')}
            >{label}</Link>
          ))}
        </div>
      )}
    </>
  )
}

// ── SiteFooter ──────────────────────────────────────────────────────────────

const FOOTER_TAGLINE = 'Nederlandstalig ruimtevaartnieuws — van Mars-rovers tot telescopen aan de rand van het heelal.'
const FOOTER_COLS: FooterCol[] = [
  { title: 'Pagina\'s', links: [['Home', '/'], ['Nieuws', '/nieuws'], ['Missies', '/missies'], ['Sterrenkijken', '/sterrenkijken'], ['Educatie', '/educatie']] },
  { title: 'Bronnen',   links: [['Open-Meteo', 'https://open-meteo.com'], ['Nominatim/OSM', 'https://nominatim.org'], ['NASA', 'https://nasa.gov']] },
]

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ scoreData, loading }: { scoreData: ScoreData | null; loading: boolean }) {
  const score = scoreData?.score ?? 0
  const color = scoreData?.color ?? '#7A86A8'
  const label = scoreData?.label ?? '—'
  const circumference = 2 * Math.PI * 54
  const dash = circumference * (score / 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r="54" fill="none" stroke="#252858" strokeWidth="10" />
          <circle cx="70" cy="70" r="54" fill="none" stroke={loading ? '#252858' : color}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${loading ? 0 : dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {loading
            ? <div style={{ width: 40, height: 8, background: '#252858', borderRadius: 2 }} />
            : <>
                <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A86A8', marginTop: 4 }}>/100</span>
              </>
          }
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: loading ? '#252858' : color }}>{loading ? '—' : label}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#7A86A8', marginTop: 4 }}>Sterrenkijk-score vanavond</div>
      </div>
    </div>
  )
}

function WeatherFactors({ weather, loading }: { weather: WeatherData | null; loading: boolean }) {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: '#0f1128', border: '1px solid #252858', borderRadius: 4, padding: '14px 16px' }}>
          <div style={{ height: 8, width: '60%', background: '#252858', borderRadius: 2, marginBottom: 8 }} />
          <div style={{ height: 20, width: '40%', background: '#1e2050', borderRadius: 2 }} />
        </div>
      ))}
    </div>
  )
  if (!weather) return null
  const factors = [
    { label: 'Bewolking',    value: `${weather.cloud_cover}%`,                icon: '☁',  color: weather.cloud_cover < 20 ? '#3ddf90' : weather.cloud_cover < 50 ? '#d4a84b' : '#e05040' },
    { label: 'Luchtvochtig', value: `${weather.relative_humidity_2m}%`,       icon: '💧', color: weather.relative_humidity_2m < 70 ? '#3ddf90' : weather.relative_humidity_2m < 85 ? '#d4a84b' : '#e05040' },
    { label: 'Windsnelheid', value: `${weather.wind_speed_10m} km/u`,         icon: '💨', color: weather.wind_speed_10m < 10 ? '#3ddf90' : weather.wind_speed_10m < 25 ? '#d4a84b' : '#e05040' },
    { label: 'Temperatuur',  value: `${weather.temperature_2m.toFixed(1)}°C`, icon: '🌡', color: weather.temperature_2m > -5 ? '#3ddf90' : '#e05040' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {factors.map(f => (
        <div key={f.label} style={{ background: '#0f1128', border: '1px solid #252858', borderRadius: 4, padding: '14px 16px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.73rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{f.icon}</span>{f.label}
          </div>
          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: f.color }}>{f.value}</div>
        </div>
      ))}
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= rating ? '#378ADD' : '#252858', boxShadow: i <= rating ? '0 0 4px #378ADD88' : 'none' }} />
      ))}
    </div>
  )
}

function WeekVoorspelling({ forecast, loading }: { forecast: DayForecast[]; loading: boolean }) {
  const DAYS_NL_SHORT = ['Zo','Ma','Di','Wo','Do','Vr','Za']
  const PHASE_EMOJIS  = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘']
  return (
    <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>
        ☁ 7-daagse sterrenkijk-voorspelling · 20:00
      </div>
      <div style={{ padding: '20px 18px 12px', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {loading
          ? [1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ height: 9, width: 24, background: '#252858', borderRadius: 2 }} />
                <div style={{ height: 8, width: 16, background: '#1e2050', borderRadius: 2 }} />
                <div style={{ width: '70%', height: 80, background: '#1e2050', borderRadius: 3 }} />
                <div style={{ height: 14, width: 22, background: '#252858', borderRadius: 2 }} />
                <div style={{ height: 14, width: 18, background: '#1e2050', borderRadius: 2 }} />
              </div>
            ))
          : forecast.map((day, i) => {
              const isToday  = i === 0
              const dayName  = DAYS_NL_SHORT[day.date.getDay()]
              const dayNum   = day.date.getDate()
              const phaseIdx = Math.round(day.moonPhase * 8) % 8
              const barH     = Math.max(4, Math.round(day.score * 0.8))
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: isToday ? '6px 2px' : '0 2px', borderRadius: isToday ? 4 : 0, border: isToday ? `1px solid ${day.color}44` : '1px solid transparent', background: isToday ? `${day.color}08` : 'transparent' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.73rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: isToday ? day.color : '#8A9BC4', fontWeight: isToday ? 700 : 400 }}>
                    {isToday ? 'Van.' : dayName}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7A86A8' }}>{dayNum}</div>
                  <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div
                      title={`${day.label} · Score ${day.score}/100 · Bewolking ${day.cloud}%`}
                      style={{ width: '68%', height: barH, background: `linear-gradient(to top, ${day.color}cc, ${day.color}33)`, border: `1px solid ${day.color}55`, borderRadius: '3px 3px 2px 2px', boxShadow: isToday ? `0 0 10px ${day.color}44` : 'none', transition: 'height 0.8s ease' }}
                    />
                  </div>
                  <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: day.color, lineHeight: 1 }}>{day.score}</div>
                  <div title="Maanfase" style={{ fontSize: '0.85rem', lineHeight: 1 }}>{PHASE_EMOJIS[phaseIdx]}</div>
                </div>
              )
            })
        }
      </div>
      <div style={{ padding: '10px 18px', borderTop: '1px solid #252858', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[{ c: '#3ddf90', l: 'Uitstekend ≥80' }, { c: '#d4a84b', l: 'Goed 60–79' }, { c: '#ff8a60', l: 'Matig 40–59' }, { c: '#e05040', l: 'Slecht <40' }].map(({ c, l }) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c, opacity: 0.85 }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#8A9BC4' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaanKalender() {
  // SSR-safe: fixed initial value, update to live date in effect
  const [viewDate, setViewDate] = useState(new Date(2026, 3, 1))
  const [todayRef, setTodayRef] = useState({ y: 2026, m: 3, d: 1 })

  useEffect(() => {
    const n = new Date()
    setViewDate(new Date(n.getFullYear(), n.getMonth(), 1))
    setTodayRef({ y: n.getFullYear(), m: n.getMonth(), d: n.getDate() })
  }, [])

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const MONTHS_NL    = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
  const DAYS_NL      = ['Ma','Di','Wo','Do','Vr','Za','Zo']
  const PHASE_EMOJIS = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘']
  const PHASE_NAMES  = ['Nieuwe maan','Wassende sikkel','Eerste kwartier','Wassend gibbeus','Volle maan','Afnemend gibbeus','Laatste kwartier','Afnemende sikkel']

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startDow = new Date(year, month, 1).getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: (number | null)[] = [...Array(startDow).fill(null)]
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const btnStyle: React.CSSProperties = { background: 'none', border: '1px solid #252858', borderRadius: 2, color: '#8A9BC4', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  return (
    <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>🌙 Maankalender</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={btnStyle} onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', minWidth: 160, textAlign: 'center' }}>{MONTHS_NL[month]} {year}</span>
          <button style={btnStyle} onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 18px 4px' }}>
        {DAYS_NL.map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A86A8' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: '4px 18px 16px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const date     = new Date(year, month, day, 12)
          const phase    = getMoonPhase(date)
          const phaseIdx = Math.round(phase * 8) % 8
          const emoji    = PHASE_EMOJIS[phaseIdx]
          const isNew    = phaseIdx === 0
          const isFull   = phaseIdx === 4
          const isToday  = year === todayRef.y && month === todayRef.m && day === todayRef.d
          return (
            <div key={i} title={`${day} ${MONTHS_NL[month]}: ${PHASE_NAMES[phaseIdx]}`}
              style={{ textAlign: 'center', padding: '6px 2px', borderRadius: 3, border: isNew ? '1px solid rgba(61,223,144,0.5)' : isFull ? '1px solid rgba(224,80,64,0.4)' : isToday ? '1px solid rgba(55,138,221,0.4)' : '1px solid transparent', background: isToday ? 'rgba(55,138,221,0.10)' : isNew ? 'rgba(61,223,144,0.05)' : isFull ? 'rgba(224,80,64,0.05)' : 'transparent' }}
            >
              <div style={{ fontSize: '1rem', lineHeight: 1 }}>{emoji}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', marginTop: 3, color: isToday ? '#378ADD' : isNew ? '#3ddf90' : isFull ? '#e05040' : '#7A86A8', fontWeight: isToday ? 700 : 400 }}>{day}</div>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '10px 18px', borderTop: '1px solid #252858', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>🌑</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#3ddf90' }}>Nieuwe maan — beste kijkavond</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>🌕</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#e05040' }}>Volle maan — slechtste kijkavond</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, border: '1px solid rgba(55,138,221,0.5)', background: 'rgba(55,138,221,0.12)' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#378ADD' }}>Vandaag</span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SterrenkijkenPage() {
  const [tab,          setTab]          = useState<'vanavond' | 'kalender' | 'darksky' | 'locatie'>('vanavond')
  const [location,     setLocation]     = useState<Location>({ lat: 52.3676, lon: 4.9041, name: 'Amsterdam' })
  const [scoreData,    setScoreData]    = useState<ScoreData | null>(null)
  const [weekForecast, setWeekForecast] = useState<DayForecast[]>([])
  const [weatherLoad,  setWeatherLoad]  = useState(true)
  const [gpsLoading,   setGpsLoading]   = useState(false)
  const [manLat,       setManLat]       = useState('')
  const [manLon,       setManLon]       = useState('')
  const [manName,      setManName]      = useState('')
  const [locError,     setLocError]     = useState('')
  // SSR-safe: live month only set in effect to avoid hydration mismatch
  const [curMonth,     setCurMonth]     = useState(4)

  useEffect(() => { setCurMonth(new Date().getMonth() + 1) }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nightgazer_stargazing_loc')
      if (saved) setLocation(JSON.parse(saved))
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWeather = useCallback(async (loc: Location) => {
    setWeatherLoad(true); setScoreData(null); setWeekForecast([])
    try {
      const url  = `https://cosmosnl-proxy.chrisevenhuis2000.workers.dev/weather?lat=${loc.lat}&lon=${loc.lon}&days=7&fields=cloud_cover,temperature_2m,relative_humidity_2m,wind_speed_10m,visibility`
      const res  = await fetch(url)
      const data = await res.json()
      const h    = data.hourly
      setScoreData(calcScore({ cloud_cover: h.cloud_cover[20], temperature_2m: h.temperature_2m[20], relative_humidity_2m: h.relative_humidity_2m[20], wind_speed_10m: h.wind_speed_10m[20], visibility: h.visibility?.[20] ?? 10000 }))
      const now  = new Date()
      const days: DayForecast[] = Array.from({ length: 7 }, (_, d) => {
        const idx = d * 24 + 20
        const w: WeatherData = { cloud_cover: h.cloud_cover[idx] ?? 100, temperature_2m: h.temperature_2m[idx] ?? 5, relative_humidity_2m: h.relative_humidity_2m[idx] ?? 80, wind_speed_10m: h.wind_speed_10m[idx] ?? 10, visibility: h.visibility?.[idx] ?? 10000 }
        const scored = calcScore(w)
        const date   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d)
        return { date, score: scored.score, color: scored.color, label: scored.label, cloud: w.cloud_cover, moonPhase: getMoonPhase(date) }
      })
      setWeekForecast(days)
    } catch {
      setScoreData({ score: 0, label: 'Geen data', color: '#7A86A8', weather: null })
    } finally {
      setWeatherLoad(false)
    }
  }, [])

  useEffect(() => { fetchWeather(location) }, [location, fetchWeather])

  function saveLocation(loc: Location) {
    setLocation(loc)
    try { localStorage.setItem('nightgazer_stargazing_loc', JSON.stringify(loc)) } catch {}
  }

  function detectGPS() {
    if (!navigator.geolocation) { setLocError('GPS niet beschikbaar in deze browser.'); return }
    setGpsLoading(true); setLocError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        let name = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=nl`)
          const d = await r.json(); const a = d.address
          name = a.city || a.town || a.village || a.municipality || name
        } catch {}
        setGpsLoading(false); saveLocation({ lat, lon, name }); setTab('vanavond')
      },
      () => { setGpsLoading(false); setLocError('GPS toegang geweigerd. Kies handmatig een locatie.') }
    )
  }

  function saveManual() {
    const lat = parseFloat(manLat), lon = parseFloat(manLon)
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLocError('Ongeldige coördinaten. Gebruik bijv. 52.37 en 4.90.'); return
    }
    setLocError('')
    saveLocation({ lat, lon, name: manName || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E` })
    setTab('vanavond')
  }

  const darkSpotsSorted = [...DARK_SPOTS].sort((a, b) =>
    calcDistance(location.lat, location.lon, a.lat, a.lon) - calcDistance(location.lat, location.lon, b.lat, b.lon)
  )

  const upcomingMeteors = [...METEORS].sort((a, b) => {
    const d = (m: number) => { let diff = m - curMonth; if (diff < 0) diff += 12; return diff }
    return d(a.month) - d(b.month)
  })
  const hasCurrentMeteor = upcomingMeteors.some(m => m.month === curMonth)

  const activeSeasons   = SEASONS.filter(s => s.months.includes(curMonth))
  const inactiveSeasons = SEASONS.filter(s => !s.months.includes(curMonth))

  const visibleObjects = SKY_OBJECTS.filter(o => o.months.includes(curMonth))

  const TABS = [
    { id: 'vanavond', label: 'Vanavond', emoji: '🌙' },
    { id: 'kalender', label: 'Kalender', emoji: '📅' },
    { id: 'darksky',  label: 'Dark Sky', emoji: '🌑' },
    { id: 'locatie',  label: 'Locatie',  emoji: '📍' },
  ] as const

  const scoreColor = scoreData?.color ?? '#7A86A8'

  return (
    <>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes twinkle   { 0%,100%{opacity:var(--tw-op,0.5)} 50%{opacity:calc(var(--tw-op,0.5)*0.3)} }
        .sk-panel { animation: fadeIn 0.3s ease both; }
        .sk-tab-btn:hover  { background: rgba(55,138,221,0.08) !important; }
        .sk-preset:hover   { border-color: #378ADD !important; color: #FFFFFF !important; }
        .sk-darkspot:hover { border-color: rgba(55,138,221,0.3) !important; background: #16173A !important; }
        .sk-meteor:hover   { background: #16173A !important; }
        .sk-obj-row:hover  { background: rgba(55,138,221,0.04) !important; }
        @media (max-width: 900px) { .sk-3col { grid-template-columns: 1fr !important; } }
        @media (max-width: 600px) { .nav-loc-btn { display: none !important; } }
      `}</style>

      <SiteNav onLocatieClick={() => setTab('locatie')} locationName={location.name} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg,#06060f 0%,#0a0d28 45%,#0f1230 70%,#1A1A2E 100%)', borderBottom: '1px solid #252858', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,40px) clamp(32px,5vw,64px)', overflow: 'hidden' }}>
        {/* Deterministic background stars — no Math.random() */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 80 }, (_, i) => {
            const op = 0.25 + (i % 6) * 0.08
            const sz = i % 5 === 0 ? 2 : 1
            return (
              <div key={i} style={{
                position: 'absolute',
                width: sz, height: sz, borderRadius: '50%',
                background: '#B5D4F4',
                left:  `${(i * 1.618033 * 11.3) % 100}%`,
                top:   `${(i * 2.414213 *  7.7) % 100}%`,
                ['--tw-op' as string]: op,
                animation: `twinkle ${2 + i % 3}s ease-in-out ${(i * 0.37) % 2}s infinite`,
              } as React.CSSProperties} />
            )
          })}
        </div>
        {/* Nebula wisps */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 40% at 80% 20%, rgba(55,138,221,0.07) 0%, transparent 70%), radial-gradient(ellipse 30% 50% at 90% 60%, rgba(192,128,255,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
          {/* Sup-label */}
          <div className="animate-fadeUp" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span className="animate-live-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(55,138,221,0.4)' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#378ADD', display: 'block' }} />
            </span>
            Sterrenkijken · NightGazer
          </div>

          {/* Title */}
          <h1 className="animate-fadeUp" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(1.9rem,4.5vw,3.4rem)', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', marginBottom: 20, animationDelay: '0.05s' }}>
            Kan ik vanavond<br />sterren kijken?
          </h1>

          {/* Hero bottom row: score + location + CTA */}
          <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', animationDelay: '0.12s' }}>
            {/* Score pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${scoreColor}44`, borderRadius: 6, padding: '10px 18px', backdropFilter: 'blur(8px)' }}>
              {weatherLoad
                ? <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #252858', borderTop: '3px solid #378ADD', animation: 'livePulse 1s linear infinite' }} />
                : <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${scoreColor}44` }}>
                    <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem', fontWeight: 800, color: scoreColor }}>{scoreData?.score ?? 0}</span>
                  </div>
              }
              <div>
                <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: weatherLoad ? '#7A86A8' : scoreColor }}>
                  {weatherLoad ? 'Laden...' : scoreData?.label}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7A86A8', letterSpacing: '0.08em', marginTop: 2 }}>
                  {weatherLoad ? 'Weersdata ophalen' : `Vanavond · ${location.name}`}
                </div>
              </div>
            </div>

            {/* Location pill */}
            <button onClick={() => setTab('locatie')} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A9BC4', background: 'rgba(255,255,255,0.04)', border: '1px solid #252858', borderRadius: 4, padding: '8px 14px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.color = '#378ADD' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' }}
            >
              <span>📍</span>
              <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location.name}</span>
              <span style={{ opacity: 0.5 }}>▾</span>
            </button>

            {/* CTA */}
            <button onClick={() => setTab('darksky')} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: '#378ADD', border: 'none', borderRadius: 4, padding: '9px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
            >🌑 Dark Sky kaart</button>
          </div>
        </div>
      </div>

      {/* Advertentie: na hero, voor tabs */}
      <AdUnit slot="6261315300" style={{ margin: '0' }} />

      {/* ── Pill Tabs ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 'var(--nav-h)', zIndex: 30, background: 'rgba(26,26,46,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #252858' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px clamp(16px,4vw,40px)', display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map((t, i) => {
            const active = tab === t.id
            const first  = i === 0
            const last   = i === TABS.length - 1
            return (
              <button key={t.id} className="sk-tab-btn" onClick={() => setTab(t.id)}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? '#FFFFFF' : '#7A86A8', background: active ? 'rgba(55,138,221,0.18)' : 'transparent', border: `1px solid ${active ? '#378ADD' : '#252858'}`, borderLeft: (!first && !active) ? 'none' : undefined, cursor: 'pointer', transition: 'all 0.15s', borderRadius: first ? '4px 0 0 4px' : last ? '0 4px 4px 0' : 0, whiteSpace: 'nowrap' }}
              >
                <span>{t.emoji}</span>{t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,40px) 80px' }}>

        {/* VANAVOND */}
        {tab === 'vanavond' && (
          <div className="sk-panel sk-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

            {/* Kolom 1: 7-daagse */}
            <div className="animate-fadeUp" style={{ animationDelay: '0s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Voorspelling</span>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
              </div>
              <WeekVoorspelling forecast={weekForecast} loading={weatherLoad} />
            </div>

            {/* Kolom 2: Score + Weersfactoren */}
            <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 20, animationDelay: '0.07s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Score &amp; Weer</span>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
              </div>
              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>Score vanavond 20:00</div>
                <div style={{ padding: '28px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ScoreGauge scoreData={scoreData} loading={weatherLoad} />
                </div>
              </div>
              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>Weersfactoren</div>
                <div style={{ padding: 18 }}>
                  <WeatherFactors weather={scoreData?.weather ?? null} loading={weatherLoad} />
                </div>
              </div>
              <ApodCard />
            </div>

            {/* Kolom 3: Zichtbaar + Seizoenen + Dichtstbijzijnde Dark Sky */}
            <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 20, animationDelay: '0.14s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Vanavond</span>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
              </div>

              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>🔭 Zichtbaar vanavond</div>
                <div style={{ padding: '0 18px' }}>
                  {visibleObjects.map((o, i) => (
                    <div key={o.obj} className="sk-obj-row" style={{ padding: '14px 0', borderBottom: i < visibleObjects.length - 1 ? '1px solid #252858' : 'none', transition: 'background 0.15s', borderRadius: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{o.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#FFFFFF' }}>{o.obj}</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: '#8A9BC4', marginTop: 2 }}>{o.where}</div>
                        </div>
                        {o.mag && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: '#378ADD', background: 'rgba(55,138,221,0.1)', padding: '2px 6px', borderRadius: 2, flexShrink: 0 }}>{o.mag} mag</span>}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#378ADD', paddingLeft: 32 }}>→ {o.tip}</div>
                    </div>
                  ))}
                </div>
              </div>

              {activeSeasons.length > 0 && (
                <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#378ADD' }}>✦ Deze maand actief</div>
                  <div style={{ padding: '0 18px' }}>
                    {activeSeasons.map((s, i) => (
                      <div key={s.name} style={{ padding: '14px 0', borderBottom: i < activeSeasons.length - 1 ? '1px solid #252858' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#FFFFFF' }}>{s.name}</div>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: `0 0 5px ${s.color}88` }} />
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: '#8A9BC4', paddingLeft: 30, lineHeight: 1.6 }}>{s.targets}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: '#12132A', border: '1px solid rgba(55,138,221,0.25)', borderRadius: 4, padding: '18px', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 2px 16px rgba(55,138,221,0.06)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(55,138,221,0.1)', border: '1px solid rgba(55,138,221,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🌑</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 4 }}>Dichtstbijzijnde Dark Sky</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFFFF', marginBottom: 4 }}>{darkSpotsSorted[0].name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: '#8A9BC4' }}>
                    {calcDistance(location.lat, location.lon, darkSpotsSorted[0].lat, darkSpotsSorted[0].lon)} km · Bortle {darkSpotsSorted[0].bortle}
                  </div>
                </div>
                <button onClick={() => setTab('darksky')} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#378ADD', background: 'none', border: '1px solid rgba(55,138,221,0.3)', borderRadius: 2, padding: '6px 12px', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(55,138,221,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >Meer →</button>
              </div>
              <AuroraAlert />
            </div>
          </div>
        )}

        {/* KALENDER */}
        {tab === 'kalender' && (
          <div className="sk-panel sk-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

            {/* Kolom 1: Maankalender */}
            <div className="animate-fadeUp" style={{ animationDelay: '0s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Maanfasen</span>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
              </div>
              <MaanKalender />
            </div>

            {/* Kolom 2: Meteorenzwerms */}
            <div className="animate-fadeUp" style={{ animationDelay: '0.07s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Meteorenzwerms</span>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
              </div>
              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>☄ Meteorenzwerms 2026</div>
                <div>
                  {upcomingMeteors.map((m, i) => {
                    const isCurrent  = m.month === curMonth
                    const isNext     = i === 0 && !hasCurrentMeteor
                    const isHighlit  = isCurrent || isNext
                    return (
                      <div key={m.name} className="sk-meteor" style={{ padding: '14px 18px', borderBottom: i < upcomingMeteors.length - 1 ? '1px solid #252858' : 'none', background: isHighlit ? 'rgba(55,138,221,0.05)' : 'transparent', borderLeft: isHighlit ? '3px solid #378ADD' : '3px solid transparent', transition: 'background 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: isHighlit ? '#FFFFFF' : '#8A9BC4' }}>{m.name}</span>
                              {isCurrent && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', background: 'rgba(55,138,221,0.15)', padding: '2px 6px', borderRadius: 2 }}>Nu actief</span>}
                              {isNext && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4a84b', background: 'rgba(212,168,75,0.15)', padding: '2px 6px', borderRadius: 2 }}>Aankomend</span>}
                            </div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: '#7A86A8' }}>Piek: {m.peak} · ZHR: {m.zhr}/u</div>
                          </div>
                          <RatingStars rating={m.rating} />
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: m.rating >= 4 ? '#3ddf90' : m.rating >= 3 ? '#d4a84b' : '#e05040', lineHeight: 1.5 }}>{m.note}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Kolom 3: Seizoenen */}
            <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 16, animationDelay: '0.14s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Seizoenen</span>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
              </div>

              {activeSeasons.length > 0 && (
                <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#378ADD' }}>✦ Actief deze maand</div>
                  <div style={{ padding: '0 18px' }}>
                    {activeSeasons.map((s, i) => (
                      <div key={s.name} style={{ padding: '16px 0', borderBottom: i < activeSeasons.length - 1 ? '1px solid #252858' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>{s.name}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#8A9BC4', lineHeight: 1.65, marginBottom: 10 }}>{s.tip}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.73rem', letterSpacing: '0.08em', color: s.color, lineHeight: 1.6, marginBottom: 12 }}>→ {s.targets}</div>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(mo => (
                            <div key={mo} title={`Maand ${mo}`} style={{ flex: 1, height: 6, borderRadius: 2, background: s.months.includes(mo) ? s.color : '#252858', opacity: mo === curMonth ? 1 : s.months.includes(mo) ? 0.55 : 0.3 }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>Overige seizoenen</div>
                <div style={{ padding: '0 18px' }}>
                  {inactiveSeasons.map((s, i) => (
                    <div key={s.name} style={{ padding: '12px 0', borderBottom: i < inactiveSeasons.length - 1 ? '1px solid #252858' : 'none', opacity: 0.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{s.icon}</span>
                        <span style={{ fontSize: '0.85rem', color: '#8A9BC4' }}>{s.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(mo => (
                          <div key={mo} style={{ flex: 1, height: 4, borderRadius: 2, background: s.months.includes(mo) ? s.color : '#252858', opacity: 0.4 }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DARK SKY */}
        {tab === 'darksky' && (
          <div className="sk-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Dark Sky kaart</span>
              <div style={{ flex: 1, height: 1, background: '#252858' }} />
            </div>

            <div className="animate-fadeUp" style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 24px rgba(55,138,221,0.07)' }}>
              <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>🌑 Lichtvervuiling Nederland</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['2–3', '3–4', '4'].map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${BORTLE_COLORS[b]}18`, border: `1px solid ${BORTLE_COLORS[b]}44`, borderRadius: 3, padding: '3px 8px' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: BORTLE_COLORS[b], boxShadow: `0 0 4px ${BORTLE_COLORS[b]}88` }} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: BORTLE_COLORS[b] }}>Bortle {b}</span>
                    </div>
                  ))}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7A86A8', alignSelf: 'center' }}>Lager = donkerder</span>
                </div>
              </div>
              <div className="dark-sky-map-wrap">
                <DarkSkyMap spots={darkSpotsSorted} userLat={location.lat} userLon={location.lon} />
              </div>
              <div style={{ padding: '8px 18px', borderTop: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7A86A8' }}>
                Klik op een pin voor details · Lichtoverlay: Falchi et al. World Atlas 2022 · Scroll om in te zoomen
              </div>
            </div>

            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 16 }}>
              Gesorteerd op afstand vanaf {location.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {darkSpotsSorted.map((spot, i) => {
                const dist = calcDistance(location.lat, location.lon, spot.lat, spot.lon)
                const col  = BORTLE_COLORS[spot.bortle] ?? '#378ADD'
                return (
                  <div key={spot.name} className="sk-darkspot animate-fadeUp" style={{ background: '#12132A', border: `1px solid ${i === 0 ? 'rgba(55,138,221,0.35)' : '#252858'}`, borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.15s, background 0.15s', animationDelay: `${i * 0.06}s` }}>
                    <div style={{ height: 4, background: col }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>{spot.name}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.73rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: col, background: `${col}18`, padding: '2px 7px', borderRadius: 2, border: `1px solid ${col}40` }}>Bortle {spot.bortle}</span>
                            {i === 0 && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', background: 'rgba(55,138,221,0.12)', padding: '2px 6px', borderRadius: 2 }}>Dichtstbij</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.6rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>{dist}</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7A86A8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>km</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#8A9BC4', lineHeight: 1.65, marginBottom: 10 }}>{spot.desc}</p>
                      <div style={{ background: '#0F1028', borderRadius: 2, padding: '8px 12px' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 4 }}>Tip</div>
                        <div style={{ fontSize: '0.75rem', color: '#8A9BC4', lineHeight: 1.6 }}>{spot.tip}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* LOCATIE */}
        {tab === 'locatie' && (
          <div className="sk-panel" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A86A8' }}>Locatie</span>
              <div style={{ flex: 1, height: 1, background: '#252858' }} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 6 }}>Huidige locatie</div>
              <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF' }}>{location.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#7A86A8', marginTop: 4 }}>{location.lat.toFixed(4)}°N · {location.lon.toFixed(4)}°E</div>
            </div>

            {locError && (
              <div style={{ padding: '10px 14px', background: 'rgba(224,80,64,0.1)', border: '1px solid rgba(224,80,64,0.3)', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.76rem', color: '#ff8a7a', marginBottom: 20 }}>
                ⚠ {locError}
              </div>
            )}

            <button onClick={detectGPS} disabled={gpsLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', background: gpsLoading ? '#1e2050' : '#378ADD', color: gpsLoading ? '#7A86A8' : '#fff', border: 'none', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: gpsLoading ? 'default' : 'pointer', marginBottom: 24, transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!gpsLoading) e.currentTarget.style.background = '#4A9DE8' }}
              onMouseLeave={e => { if (!gpsLoading) e.currentTarget.style.background = '#378ADD' }}
            >
              {gpsLoading ? <><span style={{ animation: 'livePulse 1s ease-in-out infinite' }}>⟳</span> GPS bepalen...</> : <>📍 Gebruik mijn GPS-locatie</>}
            </button>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 12 }}>Snelkeuze</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PRESET_LOCATIONS.map(p => (
                  <button key={p.name} className="sk-preset" onClick={() => { saveLocation(p); setTab('vanavond') }}
                    style={{ padding: '7px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${location.name === p.name ? '#378ADD' : '#252858'}`, background: location.name === p.name ? 'rgba(55,138,221,0.1)' : 'transparent', color: location.name === p.name ? '#378ADD' : '#8A9BC4', borderRadius: 3, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                  >{p.name}</button>
                ))}
              </div>
            </div>

            <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7A86A8' }}>Handmatige coördinaten</div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[{ label: 'Breedtegraad', val: manLat, set: setManLat, placeholder: '52.37' }, { label: 'Lengtegraad', val: manLon, set: setManLon, placeholder: '4.90' }].map(f => (
                    <div key={f.label}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.73rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 6 }}>{f.label}</div>
                      <input type="number" step="0.01" value={f.val} placeholder={f.placeholder} onChange={e => f.set(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', background: '#0F1028', border: '1px solid #252858', borderRadius: 2, color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', outline: 'none' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#378ADD')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#252858')}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.73rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 6 }}>Locatienaam (optioneel)</div>
                  <input type="text" value={manName} placeholder="Mijn sterrenkijkplek" onChange={e => setManName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#0F1028', border: '1px solid #252858', borderRadius: 2, color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', outline: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#378ADD')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#252858')}
                  />
                </div>
                <button onClick={saveManual}
                  style={{ padding: '10px', background: '#378ADD', color: '#fff', border: 'none', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
                >Opslaan →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <SiteFooter cols={FOOTER_COLS} tagline={FOOTER_TAGLINE} note="Weer: Open-Meteo · Kaart: Nominatim/OSM" />
    </>
  )
}
