'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer sterrenkijken — /staging/sterrenkijken

   Compositie: de belichtingstabel. Zeven nachten als rijen, de factoren als
   kolommen; de beste nacht krijgt de chinagraph-ring. Je leest wánneer je
   gaat van de tabel af, niet uit zeven kaarten.
   Wereld en kleurwetten staan in DESIGN.md; chrome komt uit shared.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SiteFooter } from '../../components/SiteFooter'
import { PROXY } from '@/lib/home-content'
import {
  type Location, type WeatherData,
  PRESET_LOCATIONS, DARK_SPOTS, METEORS, SKY_OBJECTS,
  calcDistance, calcScore, getMoonPhase,
} from '@/lib/sky-data'

/* Eigen rijtype: DayForecast draagt geen wind of vocht, en de tabel toont
   die kolommen wél. Een kolom met een kop die iets anders belooft dan de
   waarde eronder is erger dan geen kolom. */
interface Night {
  date: Date
  cloud: number
  wind: number
  humidity: number
  moonPhase: number
  score: number
  label: string
}
import { Ico, Tip } from '../Instruments'
import {
  archivo, FOOTER_COLS, StagingBanner, PlateHead, AdPlate, editionLabel,
} from '../shared'

const DarkSkyMap = dynamic(() => import('../../sterrenkijken/DarkSkyMap'), {
  ssr: false,
  loading: () => <div className="pl-skel" style={{ position: 'absolute', inset: 0 }} />,
})

const LOC_KEY = 'nightgazer_stargazing_loc'
const DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

/* Maanfase 0–1 naar verlicht percentage: 0 en 1 zijn nieuwe maan, 0,5 vol. */
function moonLit(phase: number): number {
  return Math.round((1 - Math.abs(phase - 0.5) * 2) * 100)
}
function moonName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'Nieuwe maan'
  if (phase < 0.22) return 'Wassende sikkel'
  if (phase < 0.28) return 'Eerste kwartier'
  if (phase < 0.47) return 'Wassende maan'
  if (phase < 0.53) return 'Volle maan'
  if (phase < 0.72) return 'Afnemende maan'
  if (phase < 0.78) return 'Laatste kwartier'
  return 'Afnemende sikkel'
}

function scoreTone(score: number): string {
  return score >= 60 ? 'var(--pl-good)' : score >= 40 ? 'var(--pl-stamp)' : 'var(--pl-warn)'
}

/* Een oordeel in een tabelcel: een gevulde staaf plus het woord. */
function CellBar({ score, label }: { score: number; label: string }) {
  return (
    <span className="pl-cellbar" style={{ color: scoreTone(score) }}>
      <span className="pl-cellbar__t" aria-hidden="true">
        <i style={{ transform: `scaleX(${score / 100})` }} />
      </span>
      <span>{label}</span>
    </span>
  )
}

function Bortle({ value }: { value: string }) {
  /* Bortle 2 is het donkerst. Minder blokjes = donkerder = beter. */
  const n = parseInt(value, 10) || 4
  return (
    <span className="pl-bortle" aria-label={`Bortle-klasse ${value}`}>
      {[1, 2, 3, 4, 5].map(i => <i key={i} data-on={i <= n ? '1' : '0'} />)}
    </span>
  )
}

function Rate({ value }: { value: number }) {
  return (
    <span className="pl-rate" aria-label={`${value} van 5`}>
      {[1, 2, 3, 4, 5].map(i => <i key={i} data-on={i <= value ? '1' : '0'} />)}
    </span>
  )
}

/* ── Locatiebalk ───────────────────────────────────────────────────────── */
function LocationBar({ location, onPick }: { location: Location; onPick: (l: Location) => void }) {
  const [open, setOpen] = useState(false)
  const [gps, setGps] = useState(false)
  const [err, setErr] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [name, setName] = useState('')

  const detect = useCallback(() => {
    if (!navigator.geolocation) { setErr('Deze browser geeft geen locatie door.'); return }
    setGps(true); setErr('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        let label = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&accept-language=nl`)
          const d = await r.json()
          const a = d.address ?? {}
          label = a.city || a.town || a.village || a.municipality || label
        } catch { /* de coördinaten zijn genoeg */ }
        setGps(false); setOpen(false)
        onPick({ lat: latitude, lon: longitude, name: label })
      },
      () => { setGps(false); setErr('Locatie geweigerd. Kies hieronder een plaats.') }
    )
  }, [onPick])

  function manual() {
    const la = parseFloat(lat), lo = parseFloat(lon)
    if (isNaN(la) || isNaN(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      setErr('Ongeldige coördinaten. Bijvoorbeeld 52.37 en 4.90.'); return
    }
    setErr(''); setOpen(false)
    onPick({ lat: la, lon: lo, name: name.trim() || `${la.toFixed(2)}°N, ${lo.toFixed(2)}°E` })
  }

  return (
    <div className="pl-quick">
      <div className="pl-locbar__in">
        <button type="button" className="pl-loc" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <Ico.crosshair />
          <span>{location.name}</span>
          <span className="pl-loc__now" aria-hidden="true">{open ? '×' : '▾'}</span>
        </button>
        <button type="button" className="pl-loc" onClick={detect} disabled={gps}>
          {gps ? 'Locatie bepalen…' : 'Gebruik mijn locatie'}
        </button>
        <span className="pl-label pl-num" style={{ marginLeft: 'auto' }}>
          {location.lat.toFixed(2)}°N {location.lon.toFixed(2)}°E
        </span>
      </div>

      {open && (
        <div className="pl-locpick">
          <div className="pl-locpick__in">
            <div>
              <p className="pl-label" style={{ marginBottom: 12 }}>Kies een plaats</p>
              <div className="pl-locgrid">
                {PRESET_LOCATIONS.map(l => (
                  <button
                    key={l.name}
                    type="button"
                    aria-pressed={l.name === location.name}
                    onClick={() => { onPick(l); setOpen(false) }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="pl-label" style={{ marginBottom: 12 }}>Of coördinaten</p>
              <div style={{ display: 'grid', gap: 8 }}>
                <input className="pl-field-in" value={lat} onChange={e => setLat(e.target.value)} placeholder="Breedtegraad, bijv. 52.37" inputMode="decimal" aria-label="Breedtegraad" />
                <input className="pl-field-in" value={lon} onChange={e => setLon(e.target.value)} placeholder="Lengtegraad, bijv. 4.90" inputMode="decimal" aria-label="Lengtegraad" />
                <input className="pl-field-in" value={name} onChange={e => setName(e.target.value)} placeholder="Naam (optioneel)" aria-label="Naam van de plaats" />
                <button className="pl-btn" onClick={manual} style={{ justifySelf: 'start' }}>Instellen</button>
              </div>
            </div>
          </div>
          {err && <p className="pl-fail" style={{ margin: '0 var(--pl-gut) 20px' }}>{err}</p>}
        </div>
      )}
    </div>
  )
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function SterrenkijkenStaging() {
  const [location, setLocation] = useState<Location>({ lat: 52.3676, lon: 4.9041, name: 'Amsterdam' })
  const [week, setWeek] = useState<Night[]>([])
  const [tonight, setTonight] = useState<WeatherData | null>(null)
  const [kp, setKp] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'failed'>('loading')
  const [spot, setSpot] = useState(0)
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)

  /* Bewaarde locatie terughalen */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOC_KEY)
      if (raw) {
        const l = JSON.parse(raw)
        if (typeof l?.lat === 'number' && typeof l?.lon === 'number') setLocation(l)
      }
    } catch { /* voorkeur niet beschikbaar, Amsterdam blijft staan */ }
  }, [])

  const pickLocation = useCallback((l: Location) => {
    setLocation(l)
    try { localStorage.setItem(LOC_KEY, JSON.stringify(l)) } catch { /* niet erg */ }
  }, [])

  /* Zeven nachten ophalen, telkens het beeld om 20:00 */
  useEffect(() => {
    let alive = true
    setStatus('loading')
    const url = `${PROXY}/weather?lat=${location.lat}&lon=${location.lon}&days=7`
      + `&fields=cloud_cover,temperature_2m,relative_humidity_2m,wind_speed_10m,visibility`

    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (!alive) return
        const h = data.hourly
        if (!h?.cloud_cover) throw new Error('geen uurdata')

        const at = (i: number): WeatherData => ({
          cloud_cover: h.cloud_cover[i] ?? 100,
          temperature_2m: h.temperature_2m[i] ?? 5,
          relative_humidity_2m: h.relative_humidity_2m[i] ?? 80,
          wind_speed_10m: h.wind_speed_10m[i] ?? 10,
          visibility: h.visibility?.[i] ?? 10000,
        })

        setTonight(at(20))
        const now = new Date()
        setWeek(Array.from({ length: 7 }, (_, d) => {
          const w = at(d * 24 + 20)
          const s = calcScore(w)
          /* 20:00 op die dag, zodat de maanfase in de tabel dezelfde is als
             die in het paneel voor vannacht. */
          const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 20, 0, 0)
          return {
            date,
            cloud: w.cloud_cover,
            wind: Math.round(w.wind_speed_10m),
            humidity: w.relative_humidity_2m,
            moonPhase: getMoonPhase(date),
            score: s.score,
            label: s.label,
          }
        }))
        setStatus('ok')
      })
      .catch(() => { if (alive) setStatus('failed') })

    return () => { alive = false }
  }, [location])

  /* Ruimteweer: Kp bepaalt of poollicht überhaupt kan */
  useEffect(() => {
    let alive = true
    fetch(`${PROXY}/space-weather`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { if (alive && typeof d?.kp === 'number') setKp(d.kp) })
      .catch(() => { /* Kp-kolom blijft leeg in plaats van te liegen */ })
    return () => { alive = false }
  }, [])

  const tonightScore = useMemo(() => tonight ? calcScore(tonight) : null, [tonight])

  /* De beste nacht: hoogste score, bij gelijkspel de vroegste. */
  const bestIdx = useMemo(() => {
    if (week.length === 0) return -1
    let best = 0
    week.forEach((d, i) => { if (d.score > week[best].score) best = i })
    return week[best].score >= 40 ? best : -1
  }, [week])

  const spots = useMemo(
    () => DARK_SPOTS
      .map((s, i) => ({ ...s, km: calcDistance(location.lat, location.lon, s.lat, s.lon), idx: i }))
      .sort((a, b) => a.km - b.km),
    [location]
  )

  const visible = useMemo(() => SKY_OBJECTS.filter(o => o.months.includes(month)), [month])
  const nextShower = useMemo(() => {
    const m = new Date().getMonth() + 1
    return METEORS.find(s => s.month >= m) ?? METEORS[0]
  }, [])

  const today = new Date()
  /* Eén tijdsbasis voor de maan: 20:00 vanavond, gelijk aan de tabelrijen. */
  const tonightPhase = useMemo(
    () => week[0]?.moonPhase
      ?? getMoonPhase(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 0, 0)),
    [week] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const monthName = new Date(2026, month - 1, 1).toLocaleDateString('nl-NL', { month: 'long' })

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <StagingBanner />
      <PlateHead total={DARK_SPOTS.length} edition={editionLabel()} current="sterrenkijken" totalLabel="donkere plekken" />
      <LocationBar location={location} onPick={pickLocation} />

      <main id="pl-main" tabIndex={-1} className="pl-stack">

        {/* ══ Wanneer ══ */}
        <section className="pl-wrap" aria-labelledby="pl-when">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-when" className="pl-h2">Kan ik vannacht kijken?</h1>
              <span className="pl-label">{location.name}</span>
            </div>
            <p className="pl-label pl-num">
              {today.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {status === 'failed' ? (
            <p className="pl-fail">
              Weerdata niet opgehaald voor {location.name}. Er staat hier geen oordeel:
              een verzonnen score zou je de nacht in sturen op niets. Probeer het later
              of kies een andere plaats.
            </p>
          ) : (
            <div className="pl-tonight">

              {/* Vannacht */}
              <div className="pl-verdict">
                <Tip label={
                  <>
                    <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Hoe het oordeel ontstaat</span>
                    Berekend voor 20:00 uit bewolking, luchtvochtigheid, windsnelheid en
                    temperatuur. Bewolking weegt het zwaarst — boven 80% blijft er niets over.
                  </>
                }>
                  <span className="pl-label">Vannacht</span>
                </Tip>

                {status === 'loading' || !tonightScore ? (
                  <>
                    <div className="pl-skel" style={{ height: 62, width: '70%' }} />
                    <div className="pl-skel" style={{ height: 140 }} />
                  </>
                ) : (
                  <>
                    <div className="pl-verdict__score">
                      <span className="pl-verdict__n pl-num pl-live">{Math.round(tonightScore.score / 10)}</span>
                      <span className="pl-label pl-num">/ 10</span>
                      <strong style={{ marginLeft: 'auto', fontSize: '1.1rem', letterSpacing: '-0.02em', color: scoreTone(tonightScore.score) }}>
                        {tonightScore.label}
                      </strong>
                    </div>

                    <div className="pl-meter" style={{ color: scoreTone(tonightScore.score) }} aria-hidden="true">
                      <i style={{ transform: `scaleX(${tonightScore.score / 100})` }} />
                    </div>

                    <dl className="pl-verdict__rows">
                      {[
                        ['Bewolking', `${tonight!.cloud_cover}%`, true],
                        ['Maanlicht', `${moonLit(tonightPhase)}% · ${moonName(tonightPhase)}`, false],
                        ['Wind', `${Math.round(tonight!.wind_speed_10m)} km/u`, true],
                        ['Luchtvochtigheid', `${tonight!.relative_humidity_2m}%`, true],
                        ['Temperatuur', `${Math.round(tonight!.temperature_2m)} °C`, true],
                        ['Kp-index', kp === null ? '—' : `${kp.toFixed(1)}${kp >= 5 ? ' · poollicht mogelijk' : ''}`, kp !== null],
                      ].map(([t, v, live]) => (
                        <div key={t as string}>
                          <dt className="pl-label">{t}</dt>
                          <dd className={`pl-num${live ? ' pl-live' : ''}`} style={{ margin: 0, fontSize: '0.8125rem', color: live ? undefined : 'var(--pl-ink-2)' }}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                )}
              </div>

              {/* De zeven nachten */}
              <div className="pl-eph">
                <table>
                  <caption>
                    <span className="pl-label">Zeven nachten · telkens om 20:00</span>
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Nacht</th>
                      <th scope="col">Bewolking</th>
                      <th scope="col">Maan</th>
                      <th scope="col">Wind</th>
                      <th scope="col">Oordeel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status === 'loading' && Array.from({ length: 7 }, (_, i) => (
                      <tr key={i}><td colSpan={5} style={{ padding: '0 18px' }}>
                        <span className="pl-skel" style={{ display: 'block', height: 13 }} />
                      </td></tr>
                    ))}
                    {week.map((d, i) => (
                      <tr key={i} data-best={i === bestIdx ? '1' : '0'}>
                        <td>
                          {DAYS[d.date.getDay()]} {d.date.getDate()} {d.date.toLocaleDateString('nl-NL', { month: 'short' })}
                          {i === 0 && <span className="pl-label" style={{ marginLeft: 8 }}>vannacht</span>}
                        </td>
                        <td>{d.cloud}%</td>
                        <td>{moonLit(d.moonPhase)}%</td>
                        <td>{d.wind} km/u</td>
                        <td><CellBar score={d.score} label={d.label} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {bestIdx >= 0 && (
                  <p className="pl-eph__flag">
                    <span className="pl-dot pl-live" aria-hidden="true" />
                    Beste venster: <strong style={{ color: 'var(--pl-ink)' }}>
                      {DAYS[week[bestIdx].date.getDay()]}nacht {week[bestIdx].date.getDate()}{' '}
                      {week[bestIdx].date.toLocaleDateString('nl-NL', { month: 'long' })}
                    </strong>
                    {' — '}{week[bestIdx].cloud}% bewolking, {moonLit(week[bestIdx].moonPhase)}% maanlicht.
                  </p>
                )}
                {bestIdx < 0 && status === 'ok' && (
                  <p className="pl-eph__flag">
                    Geen enkele nacht deze week komt boven matig uit. Dat is eerlijker dan
                    een beste-van-slecht aanwijzen.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ══ Waar ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-where">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-where" className="pl-h2">Waar is het donker?</h2>
              <span className="pl-label">Bortle-schaal · lager is donkerder</span>
            </div>
            <Link href="/sterrenkijken" className="pl-read">
              <span>Volledige kaart</span>
              <span className="pl-read__rule" aria-hidden="true" />
              <Ico.arrow />
            </Link>
          </div>

          <div className="pl-where">
            <div className="pl-where__map">
              <DarkSkyMap userLat={location.lat} userLon={location.lon} spots={DARK_SPOTS} />
            </div>

            <div className="pl-spots">
              {spots.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  className="pl-spot"
                  aria-pressed={spot === i}
                  onClick={() => setSpot(i)}
                >
                  <span className="pl-spot__no">{i + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className="pl-spot__t" style={{ display: 'block' }}>{s.name}</span>
                    <span className="pl-meta" style={{ marginTop: 6 }}>
                      <Bortle value={s.bortle} />
                      <span>Bortle {s.bortle}</span>
                    </span>
                    {spot === i && (
                      <>
                        <p className="pl-body-s" style={{ marginTop: 9 }}>{s.desc}</p>
                        <p className="pl-body-s" style={{ marginTop: 7, color: 'var(--pl-ink-3)' }}>{s.tip}</p>
                      </>
                    )}
                  </span>
                  <span className="pl-spot__km">{s.km} km</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Waarnaar ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-what">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-what" className="pl-h2">Waar kijk ik naar?</h2>
              <div className="pl-seg" role="group" aria-label="Kies een maand">
                {[-1, 0, 1].map(d => {
                  const m = ((month - 1 + d + 12) % 12) + 1
                  return (
                    <button
                      key={d}
                      aria-pressed={d === 0}
                      onClick={() => setMonth(m)}
                    >
                      {new Date(2026, m - 1, 1).toLocaleDateString('nl-NL', { month: 'short' })}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="pl-label">{visible.length} objecten in {monthName}</p>
          </div>

          <div className="pl-targets">
            {visible.map(o => (
              <article key={o.obj} className="pl-target pl-lift">
                <span className="pl-target__t">{o.obj}</span>
                <span className="pl-meta">
                  <span>{o.where}</span>
                  {o.mag && <><span className="pl-meta__tick" aria-hidden="true" /><span className="pl-num">mag {o.mag}</span></>}
                </span>
                <p className="pl-body-s">{o.tip}</p>
              </article>
            ))}
            {visible.length === 0 && (
              <div className="pl-target">
                <p className="pl-body-s">In {monthName} staat er niets uit deze lijst hoog genoeg.</p>
              </div>
            )}
          </div>
        </section>

        {/* ══ Meteorenzwermen ══ */}
        <section className="pl-wrap" aria-labelledby="pl-showers">
          <div className="pl-band">
            <h2 id="pl-showers" className="pl-h2">Meteorenzwermen 2026</h2>
            <p className="pl-label">ZHR = meteoren per uur bij ideale hemel</p>
          </div>

          <div className="pl-plate" style={{ overflowX: 'auto' }}>
            <table className="pl-showers">
              <thead>
                <tr>
                  <th scope="col">Zwerm</th>
                  <th scope="col">Piek</th>
                  <th scope="col">ZHR</th>
                  <th scope="col">Condities</th>
                  <th scope="col">Toelichting</th>
                </tr>
              </thead>
              <tbody>
                {METEORS.map(s => (
                  <tr key={s.name} data-next={s.name === nextShower.name ? '1' : '0'}>
                    <td>{s.name}</td>
                    <td>{s.peak}</td>
                    <td>{s.zhr}</td>
                    <td><Rate value={s.rating} /></td>
                    <td style={{ textAlign: 'left', whiteSpace: 'normal', minWidth: 220, fontFamily: 'var(--font-archivo)' }}>{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="pl-wrap">
          <AdPlate />
        </div>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Weer: Open-Meteo · Ruimteweer: NOAA SWPC" />
    </div>
  )
}
