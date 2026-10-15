'use client'

/* The six homepage instruments, rebuilt for the plate-archive world.
   All six are preserved by brand commitment: Sterrenkijken, Deze week,
   Dagelijkse quiz, ISS-tracker, APOD, Niveau-lezen. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PROXY, type APODData, type ISSData,
  SK_DARK_SPOTS, skDist,
  DAILY_QUESTIONS, SPACE_EVENTS, daysUntil,
} from '@/lib/home-content'

/* ── Icons: one authored set, 1.25 stroke, no library, no emoji ────────── */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const Ico = {
  arrow: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><path d="M2.5 8h11M9.5 4l4 4-4 4" /></svg>
  ),
  cloud: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><path d="M4.4 12.5h7a2.6 2.6 0 0 0 .3-5.2A3.7 3.7 0 0 0 4.9 6.6a2.95 2.95 0 0 0-.5 5.9Z" /></svg>
  ),
  moon: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><path d="M9.6 2.2a5.9 5.9 0 1 0 4.2 8.9A6.4 6.4 0 0 1 9.6 2.2Z" /></svg>
  ),
  orbit: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><circle cx="8" cy="8" r="2.1" /><ellipse cx="8" cy="8" rx="6.4" ry="2.9" transform="rotate(-28 8 8)" /></svg>
  ),
  cal: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><rect x="2.2" y="3.4" width="11.6" height="10.4" /><path d="M2.2 6.6h11.6M5.4 1.9v2.4M10.6 1.9v2.4" /></svg>
  ),
  plate: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><rect x="2.2" y="2.2" width="11.6" height="11.6" /><path d="M2.2 5.1h2.9M10.9 13.8v-2.9M13.8 5.1h-2.9M5.1 2.2v2.9" /></svg>
  ),
  level: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><path d="M2.6 12.8V9.6M8 12.8V5.4M13.4 12.8V2.9" /></svg>
  ),
  crosshair: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><circle cx="8" cy="8" r="4.2" /><path d="M8 1.2v2.2M8 12.6v2.2M1.2 8h2.2M12.6 8h2.2" /></svg>
  ),
  search: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><circle cx="7" cy="7" r="4.4" /><path d="M10.3 10.3l3.4 3.4" /></svg>
  ),
  close: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" /></svg>
  ),
  check: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><path d="M3.2 8.4l3.1 3.1 6.5-6.9" /></svg>
  ),
  cross: (p: { size?: number }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 16 16" aria-hidden="true" {...S}><path d="M4 4l8 8M12 4l-8 8" /></svg>
  ),
}

/* ── Tooltip ───────────────────────────────────────────────────────────────
   Supplementary meaning for a data point. Reachable by keyboard, because a
   number nobody can interpret is not an accessible number. */
export function Tip({ label, children, align = 'left' }: {
  label: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <span className={`pl-tip${align === 'right' ? ' pl-tip--right' : ''}`}>
      <button type="button" className="pl-tip__trigger" aria-describedby={undefined}>
        {children}
        <span className="pl-tip__mark" aria-hidden="true">?</span>
      </button>
      <span className="pl-tip__body" role="tooltip">{label}</span>
    </span>
  )
}

/* ── Shared plate chrome ───────────────────────────────────────────────── */
function Cell({ label, aside, children, foot, id }: {
  label: string
  aside?: React.ReactNode
  children: React.ReactNode
  foot?: React.ReactNode
  id: string
}) {
  return (
    <section className="pl-cell" aria-labelledby={id}>
      <header className="pl-cell__head">
        <h3 id={id} className="pl-label">{label}</h3>
        {aside}
      </header>
      <div className="pl-cell__body">{children}</div>
      {foot && <footer className="pl-cell__foot">{foot}</footer>}
    </section>
  )
}

function FootLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="pl-read" style={{ minHeight: 22 }}>
      <span>{children}</span>
      <span className="pl-read__rule" aria-hidden="true" />
    </Link>
  )
}

/* ══ 1. Sterrenkijken — tonight's verdict ═══════════════════════════════ */

export type SkyState = {
  score: number | null
  label: string
  clouds: number | null
  temp: number | null
  darkKm: number | null
  darkName: string
  status: 'loading' | 'ok' | 'failed'
}

export const SKY_INIT: SkyState = {
  score: null, label: '', clouds: null, temp: null,
  darkKm: null, darkName: '', status: 'loading',
}

/** Shared fetch so the instrument bar and this plate never disagree. */
export function useSky(): SkyState {
  const [sky, setSky] = useState<SkyState>(SKY_INIT)

  useEffect(() => {
    const lat = 52.3676, lon = 4.9041 // Amsterdam
    ;(async () => {
      try {
        const res = await fetch(`${PROXY}/weather?lat=${lat}&lon=${lon}`)
        if (!res.ok) throw new Error(String(res.status))
        const d = await res.json()
        const i = 20 // 20:00 local — the observing hour
        const cc = d.hourly.cloud_cover[i]
        const hum = d.hourly.relative_humidity_2m[i]
        const wind = d.hourly.wind_speed_10m[i]
        const tmp = d.hourly.temperature_2m[i]

        let s = 100
        if (cc > 80) s -= 50; else if (cc > 60) s -= 35; else if (cc > 40) s -= 20; else if (cc > 20) s -= 8
        if (hum > 90) s -= 15; else if (hum > 80) s -= 8
        if (wind > 30) s -= 15; else if (wind > 20) s -= 8
        if (tmp < -5) s -= 5
        s = Math.max(0, Math.min(100, s))

        const near = SK_DARK_SPOTS
          .map(sp => ({ ...sp, km: skDist(lat, lon, sp.lat, sp.lon) }))
          .sort((a, b) => a.km - b.km)[0]

        setSky({
          score: Math.round(s / 10),
          label: s >= 80 ? 'Uitstekend' : s >= 60 ? 'Goed' : s >= 40 ? 'Matig' : s >= 20 ? 'Slecht' : 'Bewolkt',
          clouds: cc,
          temp: Math.round(tmp),
          darkKm: near.km,
          darkName: near.name,
          status: 'ok',
        })
      } catch {
        setSky(s => ({ ...s, status: 'failed' }))
      }
    })()
  }, [])

  return sky
}

export function skyTone(score: number | null): string {
  if (score === null) return 'var(--pl-ink-2)'
  return score >= 6 ? 'var(--pl-good)' : score >= 4 ? 'var(--pl-stamp)' : 'var(--pl-warn)'
}

export function SterrenkijkenPlate({ sky }: { sky: SkyState }) {
  const tone = skyTone(sky.score)

  return (
    <Cell
      id="pl-sk"
      label="Vanavond zichtbaar"
      aside={
        <Tip align="right" label={
          <>
            <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Hoe de score werkt</span>
            Berekend voor 20:00 uit bewolking, luchtvochtigheid, windsnelheid en
            temperatuur. 8–10 is uitstekend, onder 4 is het niet de moeite waard.
          </>
        }>
          <span className="pl-label pl-num" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {sky.status === 'ok' && <span className="pl-dot pl-live" aria-hidden="true" />}
            Amsterdam · 20:00
          </span>
        </Tip>
      }
      foot={<>
        <span className="pl-label">Bron · Open-Meteo</span>
        <FootLink href="/sterrenkijken">Volledig rapport</FootLink>
      </>}
    >
      {sky.status === 'failed' ? (
        <p className="pl-fail">
          Weerdata niet opgehaald. Het oordeel voor vanavond staat er daarom niet —
          probeer het later of open het volledige rapport.
        </p>
      ) : sky.status === 'loading' ? (
        <>
          <div className="pl-skel" style={{ height: 44, width: '58%' }} />
          <div className="pl-skel" style={{ height: 3 }} />
          <div className="pl-skel" style={{ height: 13, width: '76%' }} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span className="pl-num pl-live" style={{ fontSize: '2.6rem', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
              {sky.score}
            </span>
            <span className="pl-label pl-num">/ 10</span>
            <strong style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: tone, marginLeft: 'auto' }}>
              {sky.label}
            </strong>
          </div>

          <div className="pl-meter" style={{ color: tone }} aria-hidden="true">
            <i style={{ transform: `scaleX(${(sky.score ?? 0) / 10})` }} />
          </div>

          <dl style={{ display: 'grid', gap: 9, margin: 0 }}>
            {[
              { i: <Ico.cloud />, t: 'Bewolking', v: sky.clouds !== null ? `${sky.clouds}%` : '—', live: true },
              { i: null, t: 'Temperatuur', v: sky.temp !== null ? `${sky.temp} °C` : '—', live: true },
              { i: <Ico.moon />, t: 'Donkerste plek', v: sky.darkKm !== null ? `${sky.darkKm} km · ${sky.darkName}` : '—', live: false },
            ].map(r => (
              <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--pl-ink-3)', display: 'flex', width: 13, flexShrink: 0 }}>{r.i}</span>
                <dt className="pl-label" style={{ flex: 1 }}>{r.t}</dt>
                <dd className={`pl-num${r.live ? ' pl-live' : ''}`} style={{ margin: 0, fontSize: '0.8125rem', color: r.live ? undefined : 'var(--pl-ink-2)' }}>
                  {r.v}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Cell>
  )
}

/* ══ 2. Deze week — upcoming events ════════════════════════════════════ */

export function useUpcoming() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const list = SPACE_EVENTS
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)
  return { mounted, list }
}

export function DezeWeekPlate() {
  const { mounted, list } = useUpcoming()
  const three = list.slice(0, 3)
  const first = three[0]?.days ?? 999
  const heading = first <= 7 ? 'Deze week aan de hemel' : first <= 31 ? 'Deze maand aan de hemel' : 'Binnenkort aan de hemel'

  return (
    <Cell
      id="pl-week"
      label={mounted ? heading : 'Binnenkort aan de hemel'}
      aside={<span style={{ color: 'var(--pl-ink-3)', display: 'flex' }}><Ico.cal /></span>}
      foot={<>
        <span className="pl-label">Lanceringen &amp; verschijnselen</span>
        <FootLink href="/missies">Alle data</FootLink>
      </>}
    >
      {!mounted ? (
        <>
          <div className="pl-skel" style={{ height: 46 }} />
          <div className="pl-skel" style={{ height: 46 }} />
          <div className="pl-skel" style={{ height: 46 }} />
        </>
      ) : three.length === 0 ? (
        <p className="pl-body-s">Geen geplande verschijnselen in de agenda. Nieuwe data komen met de volgende missie-update binnen.</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
          {three.map(ev => (
            <li key={ev.id} style={{ display: 'grid', gridTemplateColumns: '54px minmax(0,1fr)', gap: 14, alignItems: 'start' }}>
              <div style={{ borderRight: '1px solid var(--pl-rule)', paddingRight: 12 }}>
                <div className="pl-num pl-live" style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1 }}>
                  {ev.days === 0 ? 'nu' : ev.days}
                </div>
                <div className="pl-label" style={{ marginTop: 4 }}>
                  {ev.days === 0 ? 'vandaag' : ev.days === 1 ? 'dag' : 'dagen'}
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.012em' }}>
                  {ev.title}
                </strong>
                <div className="pl-meta" style={{ marginTop: 5 }}>
                  <span>{ev.cat}</span>
                  <span className="pl-meta__tick" aria-hidden="true" />
                  <span className="pl-num">
                    {new Date(ev.date + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <p className="pl-body-s" style={{ marginTop: 6 }}>{ev.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Cell>
  )
}

/* ══ 3. APOD ═══════════════════════════════════════════════════════════ */

export function ApodPlate({ apod }: { apod: APODData | null }) {
  return (
    <Cell
      id="pl-apod"
      label="NASA · Foto van de dag"
      aside={apod && <span className="pl-label pl-num pl-live">{apod.date}</span>}
      foot={<>
        <span className="pl-label">{apod?.copyright ? `© ${apod.copyright}` : 'Publiek domein · NASA'}</span>
        <a href="https://apod.nasa.gov/apod/astropix.html" target="_blank" rel="noopener noreferrer" className="pl-read" style={{ minHeight: 22 }}>
          <span>Op NASA</span><span className="pl-read__rule" aria-hidden="true" />
        </a>
      </>}
    >
      <figure style={{ margin: 0 }}>
        <div className="pl-emulsion" style={{ aspectRatio: '3 / 2' }}>
          {apod?.media_type === 'image' ? (
            <img
              src={`${PROXY}/image-proxy?url=${encodeURIComponent(apod.url)}&w=760`}
              alt={apod.title}
              loading="lazy"
            />
          ) : (
            <div className="pl-skel" style={{ position: 'absolute', inset: 0 }} />
          )}
        </div>
        <figcaption style={{ marginTop: 13 }}>
          {apod ? (
            <>
              <strong className="pl-h3" style={{ display: 'block' }}>{apod.title}</strong>
              <p className="pl-body-s" style={{ marginTop: 7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {apod.explanation}
              </p>
            </>
          ) : (
            <>
              <div className="pl-skel" style={{ height: 15, width: '82%' }} />
              <div className="pl-skel" style={{ height: 13, width: '100%', marginTop: 8 }} />
              <div className="pl-skel" style={{ height: 13, width: '64%', marginTop: 6 }} />
            </>
          )}
        </figcaption>
      </figure>
    </Cell>
  )
}

/* ══ 4. ISS tracker ════════════════════════════════════════════════════ */

const WORLD_MAP = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png'

export function IssPlate({ iss, failed }: { iss: ISSData | null; failed: boolean }) {
  const px = iss ? ((iss.longitude + 180) / 360) * 100 : 50
  const py = iss ? ((90 - iss.latitude) / 180) * 100 : 50

  return (
    <Cell
      id="pl-iss"
      label="ISS · positie"
      aside={
        <span className={`pl-label${failed ? '' : ' pl-live'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {!failed && iss && <span className="pl-dot" aria-hidden="true" />}
          {failed ? 'geen signaal' : iss ? 'live · 5 s' : 'verbinden'}
        </span>
      }
      foot={<>
        <span className="pl-label">Bron · wheretheiss.at · 5 s</span>
        <FootLink href="/missies">Missies</FootLink>
      </>}
    >
      {failed ? (
        <p className="pl-fail">Positie niet opgehaald. Er staat hier geen laatst bekende waarde: die zou binnen enkele minuten duizenden kilometers verkeerd zijn.</p>
      ) : (
        <>
          <div className="pl-emulsion pl-emulsion--map" role="img" aria-label={iss ? `ISS op ${iss.latitude.toFixed(1)}° breedte, ${iss.longitude.toFixed(1)}° lengte` : 'Wereldkaart, ISS-positie wordt opgehaald'} style={{ aspectRatio: '2 / 1' }}>
            <img src={`${PROXY}/image-proxy?url=${encodeURIComponent(WORLD_MAP)}&w=760`} alt="" loading="lazy" />
            {/* Graticule — a real coordinate grid on a real map */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} aria-hidden="true">
              {[25, 50, 75].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="var(--pl-stamp)" strokeWidth="0.5" />)}
              {[16.6, 33.3, 50, 66.6, 83.3].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="var(--pl-stamp)" strokeWidth="0.5" />)}
            </svg>
            {iss && (
              <button
                type="button"
                className="pl-hotspot"
                style={{ left: `${px}%`, top: `${py}%` }}
                aria-label={`ISS-positie: ${iss.latitude.toFixed(2)} graden breedte, ${iss.longitude.toFixed(2)} graden lengte, hoogte ${Math.round(iss.altitude)} kilometer, snelheid ${(iss.velocity / 1000).toFixed(1)} duizend kilometer per uur`}
              >
                <span className="pl-hotspot__dot" aria-hidden="true" />
                <span className="pl-hotspot__tip" role="tooltip">
                  <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>ISS nu</span>
                  <dl style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '3px 14px', margin: 0, whiteSpace: 'nowrap' }}>
                    <dt className="pl-label">Breedte</dt>
                    <dd className="pl-num pl-live" style={{ margin: 0, fontSize: '0.78rem', textAlign: 'right' }}>{iss.latitude.toFixed(2)}°</dd>
                    <dt className="pl-label">Lengte</dt>
                    <dd className="pl-num pl-live" style={{ margin: 0, fontSize: '0.78rem', textAlign: 'right' }}>{iss.longitude.toFixed(2)}°</dd>
                    <dt className="pl-label">Hoogte</dt>
                    <dd className="pl-num pl-live" style={{ margin: 0, fontSize: '0.78rem', textAlign: 'right' }}>{Math.round(iss.altitude)} km</dd>
                    <dt className="pl-label">Snelheid</dt>
                    <dd className="pl-num pl-live" style={{ margin: 0, fontSize: '0.78rem', textAlign: 'right' }}>{(iss.velocity / 1000).toFixed(1)}k km/u</dd>
                  </dl>
                </span>
              </button>
            )}
          </div>

          <div className="pl-readout" aria-hidden="true" />

          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '14px 18px', margin: 0 }}>
            {[
              ['Breedtegraad', iss ? `${iss.latitude.toFixed(2)}°` : '—'],
              ['Lengtegraad', iss ? `${iss.longitude.toFixed(2)}°` : '—'],
              ['Hoogte', iss ? `${Math.round(iss.altitude)} km` : '—'],
              ['Snelheid', iss ? `${(iss.velocity / 1000).toFixed(1)}k km/u` : '—'],
            ].map(([t, v]) => (
              <div key={t} className="pl-field">
                <dt className="pl-label">{t}</dt>
                <dd className="pl-num pl-live" style={{ margin: 0, fontSize: '1.18rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>{v}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Cell>
  )
}

/* ══ 5. Dagelijkse quiz ════════════════════════════════════════════════ */

const LVLS = [
  { key: 'beg' as const, label: 'Beginner' },
  { key: 'ama' as const, label: 'Amateur' },
  { key: 'pro' as const, label: 'Pro' },
]

export function QuizPlate() {
  const [level, setLevel] = useState<'beg' | 'ama' | 'pro'>('beg')
  const [picked, setPicked] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!mounted) return
    try {
      const raw = localStorage.getItem(`quiz_${today}`)
      const saved = raw ? (JSON.parse(raw) as Record<string, number>) : {}
      setPicked(saved[level] ?? null)
    } catch { setPicked(null) }
  }, [level, mounted, today])

  const dayIdx = Math.floor(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) / 86_400_000
  ) % DAILY_QUESTIONS.length
  const q = DAILY_QUESTIONS[dayIdx]
  const variant = q[level]
  const answered = picked !== null
  const right = answered && picked === variant.correct

  function answer(i: number) {
    if (answered) return
    setPicked(i)
    try {
      const raw = localStorage.getItem(`quiz_${today}`)
      const saved = raw ? (JSON.parse(raw) as Record<string, number>) : {}
      saved[level] = i
      localStorage.setItem(`quiz_${today}`, JSON.stringify(saved))
    } catch { /* storage blocked — the answer still shows this session */ }
  }

  return (
    <Cell
      id="pl-quiz"
      label="Vraag van de dag"
      aside={
        <div className="pl-seg" role="group" aria-label="Kies je niveau">
          {LVLS.map(l => (
            <button key={l.key} aria-pressed={level === l.key} onClick={() => setLevel(l.key)}>{l.label}</button>
          ))}
        </div>
      }
      foot={<>
        <span className="pl-label">Morgen een nieuwe vraag</span>
        <FootLink href="/educatie">Meer leren</FootLink>
      </>}
    >
      {!mounted ? (
        <div className="pl-skel" style={{ height: 200 }} />
      ) : (
        <>
          <div className="pl-meta">
            <span>{q.topic}</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span>{LVLS.find(l => l.key === level)!.label}</span>
          </div>

          <p style={{ fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.45, letterSpacing: '-0.012em' }}>{variant.q}</p>

          <div style={{ display: 'grid', gap: 7 }}>
            {variant.options.map((opt, i) => {
              const state = !answered ? undefined
                : i === variant.correct ? 'right'
                : i === picked ? 'wrong'
                : undefined
              return (
                <button key={i} className="pl-opt" data-state={state} disabled={answered} onClick={() => answer(i)}>
                  <span className="pl-opt__k pl-num">{['A', 'B', 'C', 'D'][i]}</span>
                  <span>{opt}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }} aria-hidden="true">
                    {state === 'right' && <Ico.check size={14} />}
                    {state === 'wrong' && <Ico.cross size={14} />}
                  </span>
                </button>
              )
            })}
          </div>

          {answered && (
            <div role="status" style={{ borderTop: '1px solid var(--pl-rule)', paddingTop: 13, display: 'grid', gap: 7 }}>
              <span className="pl-label" style={{ color: right ? 'var(--pl-good)' : 'var(--pl-warn)' }}>
                {right ? 'Goed' : `Niet goed — het juiste antwoord is ${['A', 'B', 'C', 'D'][variant.correct]}`}
              </span>
              <p className="pl-body-s">{variant.explain}</p>
            </div>
          )}
        </>
      )}
    </Cell>
  )
}

/* ══ 6. Niveau-lezen (was: AI promo) ═══════════════════════════════════
   The old plate had three buttons that did nothing. These three show the
   same fact rewritten at each level — the feature itself, demonstrated. */

const LEVEL_DEMO: Record<'beg' | 'ama' | 'pro', string> = {
  beg: 'Een zwart gat is zo zwaar dat niets er nog uit kan komen — zelfs licht niet. De grens waarachter ontsnappen onmogelijk wordt, heet de waarnemingshorizon.',
  ama: 'De waarnemingshorizon van een niet-roterend zwart gat ligt op de Schwarzschild-straal, Rs = 2GM/c². Voor de zon zou die op ongeveer 3 km liggen.',
  pro: 'Voor een Kerr-metriek splitst de horizon in een buitenste en binnenste wortel van Δ = r² − 2Mr + a²; frame-dragging binnen de ergosfeer maakt het Penrose-proces mogelijk.',
}

export function NiveauPlate({ featuredSlug }: { featuredSlug: string }) {
  const [lvl, setLvl] = useState<'beg' | 'ama' | 'pro'>('beg')

  return (
    <Cell
      id="pl-niveau"
      label="Lees op jouw niveau"
      aside={<span style={{ color: 'var(--pl-ink-3)', display: 'flex' }}><Ico.level /></span>}
      foot={<>
        <span className="pl-label">Voorbeeld · elk artikel heeft drie versies</span>
        <FootLink href={`/nieuws/${featuredSlug}`}>Probeer het</FootLink>
      </>}
    >
      <p className="pl-body-s">
        Elk artikel op NightGazer bestaat in drie versies. Dezelfde vraag — <em>wat is een waarnemingshorizon?</em> — op de drie niveaus:
      </p>

      <div className="pl-seg" role="group" aria-label="Kies een niveau om te vergelijken" style={{ alignSelf: 'flex-start' }}>
        {LVLS.map(l => (
          <button key={l.key} aria-pressed={lvl === l.key} onClick={() => setLvl(l.key)}>{l.label}</button>
        ))}
      </div>

      <blockquote style={{ margin: 0, borderTop: '1px solid var(--pl-rule)', paddingTop: 14, display: 'grid', gap: 10 }}>
        <span className="pl-ladder" aria-hidden="true">
          <i data-on="1" />
          <i data-on={lvl !== 'beg' ? '1' : '0'} />
          <i data-on={lvl === 'pro' ? '1' : '0'} />
        </span>
        <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--pl-ink)' }}>{LEVEL_DEMO[lvl]}</p>
      </blockquote>
    </Cell>
  )
}
