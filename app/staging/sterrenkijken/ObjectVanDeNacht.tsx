'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Object van de nacht — met zoekkaart

   Eén ding om vannacht op te zoeken, gekozen op wat er vanaf jouw plek echt
   hoog genoeg staat in het donkere venster, en hoe erg de maan in de weg
   zit. De zoekkaart tekent de echte sterrenhemel rond dat object: gnomonisch
   geprojecteerd, noorden boven, oosten links — zoals je het ziet als je
   omhoog kijkt.

   De schaalbalk staat er niet voor de sier. Zonder maat weet je niet of je
   een handbreedte of een vingerbreedte moet opschuiven, en dan vind je niets.
   ══════════════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from 'react'
import {
  STARS, LINES, TARGETS, project, altAz, objectOfTheNight, compass, KOMPAS_VOLUIT,
  type Target, type Viewing,
} from '@/lib/sky-chart'

const GEAR: Record<Target['gear'], string> = {
  oog: 'Blote oog', verrekijker: 'Verrekijker', telescoop: 'Telescoop',
}

const tijd = (d: Date) =>
  d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

/* ── De zoekkaart ─────────────────────────────────────────────────────── */
function Zoekkaart({ t }: { t: Target }) {
  const R = 168
  const C = 200

  const { stars, lines, scale, fov, kijker } = useMemo(() => {
    /* De catalogus houdt op bij de sterren die je met het blote oog ziet, en
       dat is precies wat een sterhop nodig heeft. Maar het veld moet groot
       genoeg zijn om de herkenningspunten te bevatten waar de hoptekst naar
       wijst — anders staat er 'tegenover Deneb' en is Deneb net buiten beeld.
       Dus tellen we niet zomaar sterren, maar bakens: mag 2,5 of helderder. */
    let fov = t.fov
    const inVeldBij = (f: number) => STARS.filter(s => project(s.ra, s.dec, t.ra, t.dec, f, R).vis)
    let inVeld = inVeldBij(fov)
    /* Baken = mag 3,0 of helderder; die zie je ook vanuit een stad staan.
       Het plafond van 22° houdt het een zoekkaart in plaats van een atlas:
       in een arme hemelhoek is vier bakens soms gewoon te veel gevraagd. */
    while (fov < 22 && (inVeld.filter(s => s.mag <= 3.0).length < 4 || inVeld.length < 10)) {
      fov += 2
      inVeld = inVeldBij(fov)
    }

    const stars = inVeld
      .map(s => ({ s, p: project(s.ra, s.dec, t.ra, t.dec, fov, R) }))
      .sort((a, b) => a.s.mag - b.s.mag)

    const lines = LINES
      .map(([a, b]) => ({
        a: project(a.ra, a.dec, t.ra, t.dec, fov, R),
        b: project(b.ra, b.dec, t.ra, t.dec, fov, R),
      }))
      .filter(l => l.a.vis || l.b.vis)

    const perGraad = R / Math.tan(fov * Math.PI / 180)
    const deg = fov <= 10 ? 2 : 5
    /* Een 7x50-verrekijker toont ongeveer 6,5° — die ring zegt je hoeveel je
       in één blik ziet, en dus hoe ver je nog moet opschuiven. */
    const kijker = perGraad * Math.tan(3.25 * Math.PI / 180)
    return {
      stars, lines, fov, kijker,
      scale: { deg, px: perGraad * Math.tan(deg * Math.PI / 180) },
    }
  }, [t])

  /* Alleen de helderste paar sterren krijgen een naam: een kaart vol tekst
     is geen kaart meer. */
  const labelled = new Set(stars.filter(x => x.s.mag < 3.4).slice(0, 7).map(x => x.s.name))

  return (
    <figure className="pl-chart">
      <svg viewBox="0 0 400 400" role="img"
           aria-label={`Zoekkaart voor ${t.name} in ${t.con}`}>
        <defs>
          <clipPath id={`veld-${t.id}`}><circle cx={C} cy={C} r={R} /></clipPath>
        </defs>

        <circle cx={C} cy={C} r={R} className="pl-chart__veld" />

        <g clipPath={`url(#veld-${t.id})`}>
          {lines.map((l, i) => (
            <line key={i} x1={C + l.a.x} y1={C + l.a.y} x2={C + l.b.x} y2={C + l.b.y}
                  className="pl-chart__lijn" />
          ))}

          {stars.map(({ s, p }) => (
            <circle key={s.name} cx={C + p.x} cy={C + p.y}
                    r={Math.max(1.5, 4.8 - s.mag * 0.72)}
                    className="pl-chart__ster" />
          ))}

          {stars.filter(x => labelled.has(x.s.name)).map(({ s, p }) => (
            <text key={s.name} x={C + p.x + 7} y={C + p.y + 3.5} className="pl-chart__naam">
              {s.name}
            </text>
          ))}

          {/* Wat er in één verrekijkerblik past. */}
          {kijker < R * 0.82 && (
            <circle cx={C} cy={C} r={kijker} className="pl-chart__kijker" />
          )}

          {/* Het doel. Gebroken ring, zodat hij nooit een ster afdekt. */}
          <g className="pl-live pl-chart__doel">
            <circle cx={C} cy={C} r="15" pathLength={100}
                    strokeDasharray="17 8" strokeDashoffset="4.25" />
            <line x1={C} y1={C - 26} x2={C} y2={C - 20} />
            <line x1={C} y1={C + 20} x2={C} y2={C + 26} />
          </g>
        </g>

        {/* Hemelrichtingen: noord boven, oost links. */}
        <text x={C} y="22" className="pl-chart__as" textAnchor="middle">N</text>
        <text x="16" y={C + 4} className="pl-chart__as">O</text>
        <text x="384" y={C + 4} className="pl-chart__as" textAnchor="end">W</text>
        <text x={C} y="391" className="pl-chart__as" textAnchor="middle">Z</text>

        {/* Schaalbalk */}
        <g className="pl-chart__schaal">
          <line x1={C - scale.px / 2} y1="378" x2={C + scale.px / 2} y2="378" />
          <line x1={C - scale.px / 2} y1="374" x2={C - scale.px / 2} y2="382" />
          <line x1={C + scale.px / 2} y1="374" x2={C + scale.px / 2} y2="382" />
          <text x={C} y="370" textAnchor="middle">{scale.deg}°</text>
        </g>
      </svg>

      <figcaption className="pl-chart__cap">
        <span>Veld {fov * 2}° breed · noorden boven, oosten links</span>
        <span>Een gestrekte vuist op armlengte is ongeveer 10°</span>
      </figcaption>
    </figure>
  )
}

/* ── De horizon: waar sta je heen te kijken ───────────────────────────── */
function Horizon({ alt, az }: { alt: number; az: number }) {
  const W = 900, H = 150, base = 112, pad = 18
  const span = W - pad * 2
  const x = pad + (az / 360) * span
  const y = base - (Math.max(0, alt) / 90) * (base - 20)

  return (
    <svg className="pl-horizon" viewBox={`0 0 ${W} ${H}`} role="img"
         aria-label={`Staat op ${Math.round(alt)} graden hoogte in ${KOMPAS_VOLUIT[compass(az)]}`}>
      {[30, 60].map(a => {
        const gy = base - (a / 90) * (base - 20)
        return (
          <g key={a}>
            <line x1="0" y1={gy} x2={W} y2={gy} className="pl-horizon__grid" />
            <text x="4" y={gy - 4} className="pl-horizon__lab">{a}°</text>
          </g>
        )
      })}
      <line x1="0" y1={base} x2={W} y2={base} className="pl-horizon__grond" />

      {['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW', 'N'].map((d, i) => (
        <g key={i}>
          <line x1={pad + (i / 8) * span} y1={base} x2={pad + (i / 8) * span} y2={base + 6} className="pl-horizon__tik" />
          <text x={pad + (i / 8) * span} y={base + 20} textAnchor="middle" className="pl-horizon__kompas">{d}</text>
        </g>
      ))}

      <g className="pl-live">
        <line x1={x} y1={y} x2={x} y2={base} className="pl-horizon__lood" />
        <circle cx={x} cy={y} r="6" className="pl-horizon__obj" />
      </g>
    </svg>
  )
}

/* ── Het paneel ───────────────────────────────────────────────────────── */
export default function ObjectVanDeNacht({
  lat, lon, plaats, maanVerlicht, nacht,
}: {
  lat: number; lon: number; plaats: string; maanVerlicht: number; nacht: Date
}) {
  const [gekozen, setGekozen] = useState<string | null>(null)
  const [stap, setStap] = useState<number | null>(null)

  const res = useMemo(
    () => objectOfTheNight(lat, lon, nacht, maanVerlicht / 100),
    [lat, lon, nacht, maanVerlicht],
  )

  /* Een handmatige keuze uit de meelopers moet nog steeds echt doorgerekend
     worden, anders klopt de hoogte niet. */
  const zicht: Viewing | null = useMemo(() => {
    if (!res) return null
    if (!gekozen || gekozen === res.pick.target.id) return res.pick
    return res.runnersUp.find(v => v.target.id === gekozen) ?? res.pick
  }, [res, gekozen])

  if (!res || !zicht) {
    return (
      <div className="pl-plate pl-tonight pl-tonight--leeg">
        <p className="pl-label">Object van de nacht</p>
        <p className="pl-body-s">
          Vannacht wordt het vanaf {plaats} niet donker genoeg, of staat er niets uit
          de lijst hoog genoeg. Probeer het later in het jaar opnieuw.
        </p>
      </div>
    )
  }

  const t = zicht.target
  const win = res.window
  const span = win.to.getTime() - win.from.getTime()

  /* De schuif loopt over het donkere venster. Standaard staat hij op het
     beste moment, niet op 'nu' — je wilt weten wanneer je naar buiten moet. */
  const stappen = 48
  const huidig = stap ?? Math.round(((zicht.best.getTime() - win.from.getTime()) / span) * stappen)
  const moment = new Date(win.from.getTime() + (span * huidig) / stappen)
  const nu = altAz(t.ra, t.dec, lat, lon, moment)

  return (
    <div className="pl-tonight">
      <div className="pl-tonight__kaart">
        <Zoekkaart t={t} />
      </div>

      <div className="pl-tonight__tekst">
        <div className="pl-tonight__kop">
          <p className="pl-label">Object van de nacht</p>
          <h3 className="pl-tonight__naam">{t.name}</h3>
          <p className="pl-meta">
            <span className="pl-num">{t.cat}</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span>{t.type}</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span>in {t.con}</span>
          </p>
        </div>

        <dl className="pl-tonight__feiten">
          <div><dt>Helderheid</dt><dd className="pl-num">mag {t.mag.toFixed(1)}</dd></div>
          <div><dt>Afmeting</dt><dd className="pl-num">{t.size}</dd></div>
          <div><dt>Nodig</dt><dd>{GEAR[t.gear]}</dd></div>
        </dl>

        <div className="pl-tonight__blok">
          <p className="pl-label">Zo vind je hem</p>
          <p className="pl-body-s">{t.hop}</p>
        </div>

        <div className="pl-tonight__blok">
          <p className="pl-label">Wat je ziet</p>
          <p className="pl-body-s">{t.why}</p>
        </div>
      </div>

      <div className="pl-tonight__waar">
        <div className="pl-band pl-band--klein">
          <p className="pl-label">Waar sta je heen te kijken</p>
          <p className="pl-label">
            donker van {tijd(win.from)} tot {tijd(win.to)}
          </p>
        </div>

        <Horizon alt={nu.alt} az={nu.az} />

        <div className="pl-tonight__schuif">
          <label className="pl-label" htmlFor="pl-tijd">Tijdstip</label>
          <input
            id="pl-tijd"
            type="range"
            min={0}
            max={stappen}
            value={huidig}
            onChange={e => setStap(Number(e.target.value))}
            aria-valuetext={`${tijd(moment)}, hoogte ${Math.round(nu.alt)} graden`}
          />
          <output className="pl-tonight__uit">
            <span className="pl-live pl-num">{tijd(moment)}</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span className="pl-num">{Math.round(nu.alt)}° hoog</span>
            <span className="pl-meta__tick" aria-hidden="true" />
            <span>{KOMPAS_VOLUIT[compass(nu.az)]}</span>
          </output>
        </div>

        <p className="pl-body-s pl-tonight__tip">
          {nu.alt < 15
            ? 'Op dit moment staat hij te laag — je kijkt dan door te veel atmosfeer en stadslicht.'
            : zicht.best.getTime() - win.from.getTime() < 25 * 60000
              ? `Staat er al op zijn hoogst zodra het donker wordt: ${Math.round(zicht.alt)}° in ${KOMPAS_VOLUIT[compass(zicht.az)]}. Daarna zakt hij, dus ga er vroeg op uit.`
              : `Hoogste stand om ${tijd(zicht.best)}, op ${Math.round(zicht.alt)}° in ${KOMPAS_VOLUIT[compass(zicht.az)]}.`}
          {maanVerlicht > 55 && (t.type.includes('nevel') || t.type.includes('stelsel'))
            ? ` De maan is voor ${maanVerlicht}% verlicht; dat drukt juist dit soort vage objecten weg.`
            : ''}
        </p>

        {res.runnersUp.length > 0 && (
          <div className="pl-tonight__meer">
            <span className="pl-label">Ook te zien vannacht</span>
            <div className="pl-tonight__chips">
              {[res.pick, ...res.runnersUp].map(v => (
                <button
                  key={v.target.id}
                  type="button"
                  className="pl-chip"
                  aria-pressed={v.target.id === t.id}
                  onClick={() => { setGekozen(v.target.id); setStap(null) }}
                >
                  {v.target.name}
                  <span className="pl-num">{Math.round(v.alt)}°</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
