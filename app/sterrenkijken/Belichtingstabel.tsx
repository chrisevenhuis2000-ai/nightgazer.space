'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer sterrenkijken — /sterrenkijken

   Bovenaan het hemelweer: vannacht in één zin, met de uurstrook ernaast
   (wolken per laag, doorzicht, seeing, dauw, maan). Daaronder de zeven
   nachten als rijen; de beste nacht krijgt de chinagraph-ring.
   Rekenregels in lib/hemelweer.ts, wereld en kleurwetten in DESIGN.md,
   chrome uit shared.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SiteFooter } from '../components/SiteFooter'
import {
  type Location,
  PRESET_LOCATIONS, DARK_SPOTS, METEORS, hemelVoorMaand,
  calcDistance,
} from '@/lib/sky-data'
import { type Uur, hemelUrl, leesUren, nacht, huidigeAvond, oordeel, hhmm } from '@/lib/hemelweer'
import { Oordeel, Uurstrook, toon } from './Hemelweer'
import { Ico } from '@/app/_plate/Instruments'
import {
  archivo, FOOTER_COLS, PlateHead, AdPlate, editionLabel, UitrustingVerwijzing, KalenderVerwijzing,
} from '@/app/_plate/shared'

import IssOverkomsten from './IssOverkomsten'
import Meldingen from './Meldingen'
import Noorderlicht from './Noorderlicht'
import ObjectVanDeNacht from './ObjectVanDeNacht'
import Hemelagenda from './Hemelagenda'
import Maankalender from './Maankalender'
import { OmhoogBlok } from '@/app/_plate/OmhoogBlok'
import { haalKp, laatstGemeten } from '@/lib/aurora'

const DarkSkyMap = dynamic(() => import('./DarkSkyMap'), {
  ssr: false,
  loading: () => <div className="pl-skel" style={{ position: 'absolute', inset: 0 }} />,
})

const LOC_KEY = 'nightgazer_stargazing_loc'
const DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

/* Een oordeel in een tabelcel: een gevulde staaf plus het woord. */
function CellBar({ score, label }: { score: number; label: string }) {
  return (
    <span className="pl-cellbar" style={{ color: toon(score) }}>
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
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<(Location & { waar: string })[] | null>(null)

  /* Plaats zoeken bij Open-Meteo's eigen geocoder: gratis, zonder sleutel,
     en Nederland en België eerst zodat 'Bergen' niet in Noorwegen uitkomt. */
  async function zoek(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (term.length < 2) return
    setErr(''); setHits(null)
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=8&language=nl`)
      const d = await r.json()
      const lijst = (Array.isArray(d.results) ? d.results : [])
        .filter((x: { latitude?: unknown; longitude?: unknown }) => typeof x.latitude === 'number' && typeof x.longitude === 'number')
        .sort((a: { country_code?: string }, b: { country_code?: string }) =>
          Number(!['NL', 'BE'].includes(a.country_code ?? '')) - Number(!['NL', 'BE'].includes(b.country_code ?? '')))
        .slice(0, 6)
        .map((x: { name: string; latitude: number; longitude: number; admin1?: string; country?: string }) => ({
          name: x.name, lat: x.latitude, lon: x.longitude,
          waar: [x.admin1, x.country].filter(Boolean).join(', '),
        }))
      setHits(lijst)
      if (!lijst.length) setErr(`Geen plaats gevonden voor "${term}".`)
    } catch { setErr('Zoeken lukt nu niet. Kies hieronder een plaats.') }
  }

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
              <form onSubmit={zoek} role="search" className="pl-zoekplaats">
                <label className="pl-label" htmlFor="pl-zoekplaats">Zoek je woonplaats</label>
                <div>
                  <input id="pl-zoekplaats" className="pl-field-in" value={q} onChange={e => setQ(e.target.value)} placeholder="Bijvoorbeeld Dwingeloo" autoComplete="address-level2" />
                  <button className="pl-btn" type="submit">Zoek</button>
                </div>
              </form>
              {hits && hits.length > 0 && (
                <div className="pl-locgrid" style={{ marginBottom: 18 }}>
                  {hits.map(h => (
                    <button key={`${h.lat},${h.lon}`} type="button" onClick={() => { onPick({ lat: h.lat, lon: h.lon, name: h.name }); setOpen(false); setHits(null); setQ('') }}>
                      {h.name}{h.waar && <span style={{ color: 'var(--pl-ink-3)' }}> · {h.waar}</span>}
                    </button>
                  ))}
                </div>
              )}
              <p className="pl-label" style={{ marginBottom: 12 }}>Of kies een plaats</p>
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
/** YYYY-MM van de maand `plus` maanden na `d`. */
function maandSleutel(d: Date, plus: number): string {
  const x = new Date(d.getFullYear(), d.getMonth() + plus, 1)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
}

export default function Belichtingstabel() {
  const [location, setLocation] = useState<Location>({ lat: 52.3676, lon: 4.9041, name: 'Amsterdam' })
  const [uren, setUren] = useState<Uur[]>([])
  const [kp, setKp] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'failed'>('loading')
  const [bijgewerkt, setBijgewerkt] = useState<Date | null>(null)
  const [laden, setLaden] = useState(false)
  const [nu, setNu] = useState(() => new Date())
  const [ronde, setRonde] = useState(0)
  const [spot, setSpot] = useState(0)
  // Maand als YYYY-MM: de planeten verschillen per jaar.
  const [maandKey, setMaandKey] = useState(() => maandSleutel(new Date(), 0))
  const month = Number(maandKey.slice(5, 7))

  /* Komt de bezoeker binnen op een anker (#pl-meld vanuit de meldingenlink,
     #pl-showers vanuit de zoekfunctie), dan verschuift de pagina nog terwijl
     het weer, de ISS en het noorderlicht erboven laden. Daarom nog twee keer
     naar het anker scrollen, tenzij de bezoeker zelf al scrolt. */
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    let zelf = false
    const stop = () => { zelf = true }
    const opties = { passive: true, once: true } as const
    window.addEventListener('wheel', stop, opties)
    window.addEventListener('touchstart', stop, opties)
    const naar = () => { if (!zelf) document.getElementById(id)?.scrollIntoView({ block: 'start' }) }
    const t = [setTimeout(naar, 900), setTimeout(naar, 2400)]
    return () => { t.forEach(clearTimeout); window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop) }
  }, [])

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

  /* Hemelweer ophalen: één verzoek, acht dagen per uur. Rechtstreeks bij
     Open-Meteo (CORS staat open), zodat de eigen proxy dicht kan blijven en
     ook de PR-voorbeeldsites live data krijgen. */
  /* Andere plaats: oude uren weg, zodat een mislukte haal nooit het weer van
     de vorige plaats onder de nieuwe naam laat staan. */
  useEffect(() => { setUren([]); setStatus('loading') }, [location])

  useEffect(() => {
    let alive = true
    setLaden(true)
    const url = hemelUrl(location.lat, location.lon)
    fetch(url)
      /* Een onbekend veld geeft bij Open-Meteo een 400 voor alles; dan nog één
         keer zonder de straalstroom, en wordt seeing 'redelijk' in plaats van leeg. */
      .then(r => r.status === 400 ? fetch(url.replace(',wind_speed_250hPa', '')) : r)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (!alive) return
        setUren(leesUren(data, location.lat, location.lon))
        setBijgewerkt(new Date()); setNu(new Date())
        setStatus('ok')
      })
      /* Bij een mislukte verversing blijft de vorige stand staan. */
      .catch(() => { if (alive) setStatus(st => st === 'loading' ? 'failed' : st) })
      .finally(() => { if (alive) setLaden(false) })
    return () => { alive = false }
  }, [location, ronde])

  /* Live blijven: elke minuut de klok, elk half uur (of bij terugkomen in het
     tabblad na een half uur) nieuwe data. Open-Meteo rekent elk uur opnieuw. */
  useEffect(() => {
    const vers = () => {
      setNu(new Date())
      if (document.visibilityState === 'visible' && bijgewerkt && Date.now() - bijgewerkt.getTime() > 30 * 60000) {
        setRonde(r => r + 1)
      }
    }
    const t = setInterval(vers, 60000)
    document.addEventListener('visibilitychange', vers)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vers) }
  }, [bijgewerkt])

  /* Ruimteweer: Kp bepaalt of poollicht überhaupt kan.
     Rechtstreeks bij NOAA in plaats van via de eigen proxy — die geeft sinds
     NOAA's formaatwijziging null terug voor alles, waardoor deze kolom leeg
     bleef. NOAA staat CORS toe, dus de tussenstap voegde niets toe. */
  useEffect(() => {
    const ac = new AbortController()
    let alive = true
    haalKp(ac.signal)
      .then(e => { const n = laatstGemeten(e); if (alive && n) setKp(n.kp) })
      .catch(() => { /* Kp-kolom blijft leeg in plaats van te liegen */ })
    return () => { alive = false; ac.abort() }
  }, [])

  /* Vannacht en de zes nachten erna, allemaal uit hetzelfde model, zodat
     het oordeel bovenaan en de rij 'vannacht' in de tabel nooit verschillen. */
  const avond = huidigeAvond(nu).getTime()
  const vannacht = useMemo(
    () => uren.length ? nacht(uren, location.lat, location.lon, new Date(avond), nu) : null,
    [uren, nu, avond, location],
  )
  const week = useMemo(() => {
    if (!uren.length) return []
    const a = new Date(avond)
    return Array.from({ length: 7 }, (_, d) => d === 0 ? vannacht! : nacht(uren, location.lat, location.lon, new Date(a.getFullYear(), a.getMonth(), a.getDate() + d)))
      .filter(n => n.donker.length > 0)
  }, [uren, avond, vannacht, location])

  /* De beste nacht: hoogste score, bij gelijkspel de vroegste. */
  const bestIdx = useMemo(() => {
    if (week.length === 0) return -1
    let best = 0
    week.forEach((d, i) => { if (d.score > week[best].score) best = i })
    return week[best].score >= 40 ? best : -1
  }, [week])

  const uurNu = vannacht?.uren.find(u => nu >= u.t && nu.getTime() < u.t.getTime() + 3600e3)
    ?? uren.find(u => nu >= u.t && nu.getTime() < u.t.getTime() + 3600e3)

  const spots = useMemo(
    () => DARK_SPOTS
      .map((s, i) => ({ ...s, km: calcDistance(location.lat, location.lon, s.lat, s.lon), idx: i }))
      .sort((a, b) => a.km - b.km),
    [location]
  )

  const visible = useMemo(() => hemelVoorMaand(maandKey), [maandKey])
  const nextShower = useMemo(() => {
    const m = new Date().getMonth() + 1
    return METEORS.find(s => s.month >= m) ?? METEORS[0]
  }, [])

  const today = nu
  const maanVerlicht = Math.round((vannacht?.verlicht ?? 0.5) * 100)
  const monthName = new Date(2026, month - 1, 1).toLocaleDateString('nl-NL', { month: 'long' })

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={DARK_SPOTS.length} edition={editionLabel()} current="sterrenkijken" totalLabel="donkere plekken" />
      <LocationBar location={location} onPick={pickLocation} />

      <main id="pl-main" tabIndex={-1} className="pl-stack">

        <nav className="pl-wrap pl-spring" aria-label="Op deze pagina">
          {[['Vannacht', '#pl-when'], ['ISS', '#pl-iss'], ['Noorderlicht', '#pl-aurora'], ['Donkere plekken', '#pl-where'], ['Maan', '#pl-moon'], ['Agenda', '#pl-agenda'], ['Gidsen', '/gidsen/']].map(([t, h]) => (
            <a key={h} href={h}>{t}</a>
          ))}
        </nav>

        <div className="pl-wrap">
          <OmhoogBlok />
        </div>

        {/* ══ Wanneer ══ */}
        <section className="pl-wrap" aria-labelledby="pl-when">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-when" className="pl-h2">Wordt het helder vannacht?</h1>
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
            <>
              <div className="pl-tonight">
                {!vannacht ? (
                  <>
                    <div className="pl-verdict">
                      <div className="pl-skel" style={{ height: 30, width: '80%' }} />
                      <div className="pl-skel" style={{ height: 62, width: '50%' }} />
                      <div className="pl-skel" style={{ height: 220 }} />
                    </div>
                    <div className="pl-eph"><div className="pl-skel" style={{ height: '100%', minHeight: 420 }} /></div>
                  </>
                ) : (
                  <>
                    <Oordeel
                      n={vannacht}
                      plaats={location.name}
                      kp={kp}
                      bijgewerkt={bijgewerkt}
                      laden={laden}
                      verversen={() => setRonde(r => r + 1)}
                    />
                    <Uurstrook n={vannacht} nu={nu} />
                  </>
                )}
              </div>

              {/* De zeven nachten */}
              <div className="pl-eph pl-zevennacht">
                <table>
                  <caption>
                    <span className="pl-label">Zeven nachten · over de donkere uren</span>
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Nacht</th>
                      <th scope="col">Bewolking</th>
                      <th scope="col">Beste venster</th>
                      <th scope="col">Maan</th>
                      <th scope="col">Wind</th>
                      <th scope="col">Oordeel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status === 'loading' && Array.from({ length: 7 }, (_, i) => (
                      <tr key={i}><td colSpan={6} style={{ padding: '0 18px' }}>
                        <span className="pl-skel" style={{ display: 'block', height: 13 }} />
                      </td></tr>
                    ))}
                    {week.map((d, i) => (
                      <tr key={+d.avond} data-best={i === bestIdx ? '1' : '0'}>
                        <td>
                          {DAYS[d.avond.getDay()]} {d.avond.getDate()} {d.avond.toLocaleDateString('nl-NL', { month: 'short' })}
                          {i === 0 && <span className="pl-label" style={{ marginLeft: 8 }}>vannacht</span>}
                        </td>
                        <td className="pl-live">{d.wolk}%</td>
                        <td>{d.venster ? `${hhmm(d.venster.van)}–${hhmm(d.venster.tot)}` : '·'}</td>
                        <td>{Math.round(d.verlicht * 100)}%</td>
                        <td>{d.wind} km/u</td>
                        <td><CellBar score={d.score} label={oordeel(d.score)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {bestIdx >= 0 && (
                  <p className="pl-eph__flag">
                    <span className="pl-dot pl-live" aria-hidden="true" />
                    <span>
                      Beste nacht: <strong style={{ color: 'var(--pl-ink)' }}>
                        {week[bestIdx].avond.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </strong>
                      {week[bestIdx].venster
                        ? `, helder van ${hhmm(week[bestIdx].venster!.van)} tot ${hhmm(week[bestIdx].venster!.tot)}`
                        : `, ${week[bestIdx].wolk}% bewolking`}
                      {' '}bij {Math.round(week[bestIdx].verlicht * 100)}% maanlicht.
                    </span>
                  </p>
                )}
                {bestIdx < 0 && status === 'ok' && (
                  <p className="pl-eph__flag">
                    Geen enkele nacht deze week komt boven matig uit. Dat is eerlijker dan
                    een beste-van-slecht aanwijzen.
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        <div className="pl-wrap">
          <UitrustingVerwijzing tekst="Een heldere nacht gevonden? Van rood lampje tot eerste telescoop: dit heb je nodig om meer te zien." />
          <KalenderVerwijzing tekst="Het hele jaar vooruit kijken? Elke nacht de maan en per maand de planeten, vallende sterren en de zonsverduistering van 2 augustus, op een A4-wandkalender." />
        </div>

        {/* ══ ISS ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-iss">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-iss" className="pl-h2">Wanneer vliegt het ISS over?</h2>
              <span className="pl-label">zichtbaar met het blote oog</span>
            </div>
            <p className="pl-label">{location.name}</p>
          </div>

          <IssOverkomsten lat={location.lat} lon={location.lon} plaats={location.name} />
        </section>

        {/* ══ Noorderlicht ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-aurora">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-aurora" className="pl-h2">Kans op noorderlicht</h2>
              <span className="pl-label">Kp-index · NOAA</span>
            </div>
            <p className="pl-label">oordeel voor Noord-Nederland</p>
          </div>

          <Noorderlicht
            lat={location.lat}
            lon={location.lon}
            bewolking={uurNu ? Math.round(uurNu.wolk) : null}
          />
        </section>

        {/* ══ Meldingen ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-meld">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-meld" className="pl-h2">Laat het me weten</h2>
              <span className="pl-label">meldingen op je telefoon</span>
            </div>
            <p className="pl-label">{location.name}</p>
          </div>

          <Meldingen lat={location.lat} lon={location.lon} plaats={location.name} />
        </section>

        {/* ══ Waar ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-where">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-where" className="pl-h2">Waar is het donker?</h2>
              <span className="pl-label">Bortle-schaal · lager is donkerder</span>
            </div>
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
        {/* ══ Object van de nacht ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-tonight">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-tonight" className="pl-h2">Zoek dit vannacht op</h2>
              <span className="pl-label">met zoekkaart</span>
            </div>
            <p className="pl-label">{location.name}</p>
          </div>

          <ObjectVanDeNacht
            lat={location.lat}
            lon={location.lon}
            plaats={location.name}
            maanVerlicht={maanVerlicht}
            nacht={today}
          />
        </section>

        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-what">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-what" className="pl-h2">Waar kijk ik naar?</h2>
              <div className="pl-seg" role="group" aria-label="Kies een maand">
                {[0, 1, 2].map(d => {
                  const k = maandSleutel(new Date(), d)
                  return (
                    <button
                      key={k}
                      aria-pressed={k === maandKey}
                      onClick={() => setMaandKey(k)}
                    >
                      {new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1).toLocaleDateString('nl-NL', { month: 'short' })}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="pl-label">{visible.length} dingen om te zien in {monthName}</p>
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

        {/* ══ Maankalender ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-moon">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-moon" className="pl-h2">De maan deze maand</h2>
              <span className="pl-label">Fase om 20:00</span>
            </div>
          </div>
          <Maankalender />
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
                    <td>{'gids' in s && s.gids ? <Link href={s.gids} className="pl-voorw__a">{s.name}</Link> : s.name}</td>
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

        {/* ══ Hemelagenda ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-agenda">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-agenda" className="pl-h2">Zet het in je agenda</h2>
              <span className="pl-label">.ics voor elke agenda-app</span>
            </div>
            <p className="pl-label">zwermen en lanceringen</p>
          </div>

          <Hemelagenda />
        </section>

        <div className="pl-wrap">
          <AdPlate slot="6261315300" />
        </div>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Weer: Open-Meteo · Ruimteweer: NOAA SWPC" />
    </div>
  )
}
