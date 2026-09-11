'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer lanceermanifest — /staging/missies

   Compositie: de startbaanstrook. Een tijdas over de resterende maanden,
   elke lancering een merkteken. Waar de tekens opeenhopen zie je de cadans
   van een lanceerjaar — iets wat een lijst niet kan tonen.
   Wereld en kleurwetten staan in DESIGN.md; chrome komt uit shared.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { MISSIONS, type MissionDetail } from '@/lib/missions-data'
import {
  buildSchedule, monthWindows, assignLanes, agencyCounts, destinationGroup,
  type ScheduledLaunch, type MonthWindow,
} from '@/lib/mission-schedule'
import { Ico, Tip } from '../Instruments'
import {
  archivo, FOOTER_COLS, StagingBanner, PlateHead, AdPlate, editionLabel,
} from '../shared'

const DAYFMT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }

function shortAgency(a: string): string {
  return a.replace(' / ', '/').replace('Arianespace', 'Ariane')
}

/* ── De strook ─────────────────────────────────────────────────────────── */
function Strip({ launches, flown, windows, active, onWindow, selected, onSelect, today }: {
  launches: ScheduledLaunch[]
  flown: ScheduledLaunch[]
  windows: MonthWindow[]
  active: string | null
  onWindow: (key: string | null) => void
  selected: string | null
  onSelect: (id: string) => void
  today: Date
}) {
  /* De as loopt van het begin van de eerste maand tot het eind van de
     laatste, zodat maandvakken en merktekens dezelfde schaal delen. */
  const axisStart = windows[0]?.start ?? today
  const axisEnd = windows[windows.length - 1]?.end ?? today
  const span = Math.max(1, axisEnd.getTime() - axisStart.getTime())
  const pct = (d: Date) => ((d.getTime() - axisStart.getTime()) / span) * 100

  /* Alleen vluchten met een echte dag krijgen een merkteken. De rest is een
     NET-schatting; die op een dag zetten zou een cadans tekenen die niet
     bestaat. Ze worden per maand geteld in plaats van geplaatst. */
  const dated = useMemo(() => launches.filter(l => l.precision === 'dag'), [launches])
  const monthOnly = launches.filter(l => l.precision === 'maand').length
  const yearOnly = launches.filter(l => l.precision === 'jaar').length

  /* Gevlogen vluchten dragen wél een echte dag — daar zit de werkelijke
     cadans. Zonder het verleden toont de as vier merktekens en lijkt er
     niets te gebeuren, terwijl er dit jaar al 27 raketten omhoog gingen. */
  const marks = useMemo(
    () => [...flown.map(l => ({ l, flown: true })), ...dated.map(l => ({ l, flown: false }))]
      .sort((a, b) => a.l.date.getTime() - b.l.date.getTime()),
    [flown, dated]
  )
  const positions = useMemo(() => marks.map(m => pct(m.l.date)), [marks, axisStart, axisEnd]) // eslint-disable-line react-hooks/exhaustive-deps
  /* 1,4% van de as ≈ anderhalve dag: dichter op elkaar en de tekens
     smelten samen tot één streep, waardoor een drukke week er rustig uitziet. */
  const lanes = useMemo(() => assignLanes(positions, 1.4), [positions])

  const todayPct = pct(today)
  const inRange = todayPct >= 0 && todayPct <= 100

  return (
    <div className="pl-strip">
      {/* Maandbalk en as delen één schaal, dus ze scrollen samen. Negen
          maanden passen niet in 390px zonder over elkaar te vallen. */}
      <div className="pl-strip__scroll">
      <div className="pl-strip__months" role="group" aria-label="Kies een maand">
        {windows.map(w => (
          <button
            key={w.key}
            type="button"
            className="pl-strip__month"
            aria-pressed={active === w.key}
            onClick={() => onWindow(active === w.key ? null : w.key)}
          >
            {w.label}
            <em>{w.dated > 0 ? w.dated : '—'}{w.approx > 0 ? `+${w.approx}` : ''}</em>
          </button>
        ))}
      </div>

      <div className="pl-axis">
        <div className="pl-axis__rule" aria-hidden="true" />

        {windows.slice(1).map(w => (
          <div key={w.key} className="pl-axis__div" style={{ left: `${pct(w.start)}%` }} aria-hidden="true" />
        ))}

        {marks.map(({ l, flown: isFlown }, i) => {
          const w = active ? windows.find(x => x.key === active) : null
          const dim = w ? !(l.date >= w.start && l.date < w.end) : false
          const isSel = selected === l.mission.id
          return (
            <button
              key={l.mission.id}
              type="button"
              className="pl-tick"
              data-dim={dim ? '1' : '0'}
              data-sel={isSel ? '1' : '0'}
              data-flown={isFlown ? '1' : '0'}
              style={{ left: `${positions[i]}%`, height: `${(isFlown ? 18 : 26) + lanes[i] * 18}px` }}
              onClick={() => onSelect(l.mission.id)}
              aria-label={`${l.mission.name}, ${l.date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}${isFlown ? ', gevlogen' : ''}`}
            >
              <span className="pl-tick__tip" role="tooltip">
                <span className="pl-label pl-num" style={{ display: 'block', marginBottom: 5 }}>
                  {l.date.toLocaleDateString('nl-NL', DAYFMT)}
                  {isFlown ? ' · gevlogen'
                    : l.days === 0 ? ' · vandaag'
                    : l.days === 1 ? ' · morgen'
                    : ` · over ${l.days} dagen`}
                </span>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3 }}>
                  {l.mission.name}
                </span>
                <span className="pl-label" style={{ display: 'block', marginTop: 5 }}>
                  {shortAgency(l.mission.agency)} · {l.mission.vehicle || '—'}
                </span>
              </span>
            </button>
          )
        })}

        {inRange && (
          <>
            <div className="pl-axis__today" style={{ left: `${todayPct}%` }} aria-hidden="true" />
            <span className="pl-axis__todaycap pl-live" style={{ left: `${todayPct}%` }}>vandaag</span>
          </>
        )}
      </div>
      </div>

      <div className="pl-strip__foot">
        <span className="pl-label">
          {flown.length} gevlogen · {dated.length} gepland met vaste datum
          {windows.length > 0 && ` · ${windows[0].label} t/m ${windows[windows.length - 1].label} ${windows[windows.length - 1].year}`}
        </span>
        {(monthOnly > 0 || yearOnly > 0) && (
          <Tip label={
            <>
              <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Waarom staan die niet op de as?</span>
              Launch Library kent van deze vluchten alleen de periode en levert
              die als de laatste dag ervan. Op een dag zetten zou tientallen
              merktekens op 31 december opleveren en een drukte suggereren die
              er niet is. De maand is echt; de dag is dat niet.
            </>
          }>
            <span className="pl-label" style={{ color: 'var(--pl-ink-2)' }}>
              {monthOnly} alleen met maand · {yearOnly} alleen met jaar
            </span>
          </Tip>
        )}
        {active && (
          <button type="button" className="pl-tag" aria-pressed="true" onClick={() => onWindow(null)}>
            {windows.find(w => w.key === active)?.label}
            <Ico.close size={11} />
            <span className="sr-only"> — venster wissen</span>
          </button>
        )}
      </div>
    </div>
  )
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function MissiesStaging() {
  const [today, setToday] = useState<Date | null>(null)
  const [windowKey, setWindowKey] = useState<string | null>(null)
  const [agency, setAgency] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  /* De datum pas na mount, zodat server en client niet uiteenlopen. */
  useEffect(() => { setToday(new Date()) }, [])

  const schedule = useMemo(() => today ? buildSchedule(today) : null, [today])

  const agencies = useMemo(() => agencyCounts(MISSIONS).slice(0, 6), [])

  const upcoming = useMemo(() => {
    if (!schedule) return []
    return agency ? schedule.upcoming.filter(l => l.mission.agency === agency) : schedule.upcoming
  }, [schedule, agency])

  /* Alleen dit kalenderjaar: oudere missies (Voyager 1977, Curiosity 2011)
     zouden de as tot een streepje samendrukken. */
  const flown = useMemo(() => {
    if (!schedule || !today) return []
    const jan = new Date(today.getFullYear(), 0, 1)
    const list = schedule.past.filter(l => l.date >= jan)
    return agency ? list.filter(l => l.mission.agency === agency) : list
  }, [schedule, today, agency])

  const windows = useMemo(() => monthWindows([...flown, ...upcoming].sort((a, b) => a.date.getTime() - b.date.getTime())), [flown, upcoming])

  /* Het venster valt weg zodra het onder het actieve agentschap leeg is. */
  useEffect(() => {
    if (windowKey && !windows.some(w => w.key === windowKey)) setWindowKey(null)
  }, [windows, windowKey])

  const shown = useMemo(() => {
    const base = (() => {
      if (!windowKey) return upcoming
      const w = windows.find(x => x.key === windowKey)
      if (!w) return upcoming
      return upcoming.filter(l => l.date >= w.start && l.date < w.end)
    })()
    /* Vluchten met een echte dag eerst: die kun je in je agenda zetten. */
    const rank = { dag: 0, maand: 1, jaar: 2 } as const
    return [...base].sort((a, b) => {
      if (rank[a.precision] !== rank[b.precision]) return rank[a.precision] - rank[b.precision]
      return a.date.getTime() - b.date.getTime()
    })
  }, [upcoming, windows, windowKey])

  const active = useMemo(() => MISSIONS.filter(m => m.status === 'actief'), [])
  const activeShown = useMemo(
    () => agency ? active.filter(m => m.agency === agency) : active,
    [active, agency]
  )

  const pickTick = useCallback((id: string) => {
    setSelected(id)
    document.getElementById(`vlucht-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const lastUpdated = schedule ? today! : null

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <StagingBanner />
      <PlateHead total={MISSIONS.length} edition={editionLabel()} current="missies" totalLabel="missies" />

      {/* Agentschapsfilter in de sleuf waar de andere surfaces hun snelbalk hebben */}
      <div className="pl-quick">
        <div className="pl-locbar__in">
          <div className="pl-tags" role="group" aria-label="Filter op agentschap">
            <button type="button" className="pl-tag" aria-pressed={agency === null} onClick={() => setAgency(null)}>
              Alle<span className="pl-tag__n pl-num">{MISSIONS.length}</span>
            </button>
            {agencies.map(a => (
              <button
                key={a.agency}
                type="button"
                className="pl-tag"
                aria-pressed={agency === a.agency}
                onClick={() => setAgency(agency === a.agency ? null : a.agency)}
              >
                {shortAgency(a.agency)}<span className="pl-tag__n pl-num">{a.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main id="pl-main" tabIndex={-1} className="pl-stack">

        {/* ══ De strook ══ */}
        <section className="pl-wrap" aria-labelledby="pl-manifest">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="pl-manifest" className="pl-h2">Het lanceermanifest</h1>
              <Tip label={
                <>
                  <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>De strook lezen</span>
                  Elk merkteken is één geplande vlucht, geplaatst op zijn datum.
                  Waar de tekens opeenhopen ligt een drukke week. Klik een maand
                  om het venster te kiezen, of een teken om naar die vlucht te springen.
                </>
              }>
                <span className="pl-label">Cadans 2026</span>
              </Tip>
            </div>
            <p className="pl-label pl-num" aria-live="polite">
              {schedule ? `${upcoming.length} gepland · ${activeShown.length} actief` : '…'}
            </p>
          </div>

          {!schedule ? (
            /* 226px = maandbalk 41 + as 132 + voet 51 + randen, gemeten op
               de echte strook zodat er niets verspringt als hij verschijnt. */
            <div className="pl-skel" style={{ height: 226 }} />
          ) : upcoming.length === 0 ? (
            <div className="pl-plate" style={{ padding: '48px 24px', display: 'grid', gap: 14, justifyItems: 'start' }}>
              <h2 className="pl-h3">Geen geplande vluchten</h2>
              <p className="pl-body-s">
                {agency
                  ? `Het manifest heeft geen toekomstige vluchten van ${shortAgency(agency)}.`
                  : 'Het manifest heeft op dit moment geen toekomstige vluchten.'}
              </p>
              {agency && <button className="pl-btn" onClick={() => setAgency(null)}>Alle agentschappen</button>}
            </div>
          ) : (
            <Strip
              launches={upcoming}
              flown={flown}
              windows={windows}
              active={windowKey}
              onWindow={setWindowKey}
              selected={selected}
              onSelect={pickTick}
              today={today!}
            />
          )}
        </section>

        {/* ══ De vluchten ══
            Altijd gemonteerd, ook vóór de datum bekend is: conditioneel
            monteren liet alles eronder 700px verspringen zodra de lijst
            verscheen (CLS 0,22). De skeletrijen hebben dezelfde hoogte als
            de echte rijen. */}
        {(!schedule || shown.length > 0) && (
          <section className="pl-wrap" aria-labelledby="pl-flights">
            <div className="pl-band">
              <h2 id="pl-flights" className="pl-h2" style={{ fontSize: 'clamp(1.2rem,1.8vw,1.5rem)' }}>
                {windowKey
                  ? `Vluchten in ${windows.find(w => w.key === windowKey)?.label} ${windows.find(w => w.key === windowKey)?.year}`
                  : 'Eerstvolgende vluchten'}
              </h2>
              <p className="pl-label pl-num">{schedule ? shown.length : ''}</p>
            </div>

            <div className="pl-flights">
              {!schedule && Array.from({ length: 12 }, (_, i) => (
                <div key={`skel-${i}`} className="pl-flight" aria-hidden="true">
                  <span className="pl-skel" style={{ height: 13, width: 54 }} />
                  <span>
                    <span className="pl-skel" style={{ display: 'block', height: 15, width: '46%' }} />
                    <span className="pl-skel" style={{ display: 'block', height: 11, width: '30%', marginTop: 9 }} />
                  </span>
                  <span className="pl-skel" style={{ height: 12, width: 70 }} />
                  <span className="pl-skel" style={{ height: 12, width: 90, justifySelf: 'end' }} />
                </div>
              ))}
              {schedule && (windowKey ? shown : shown.slice(0, 12)).map(l => (
                <Link
                  key={l.mission.id}
                  id={`vlucht-${l.mission.id}`}
                  href={`/missies/${l.mission.id}`}
                  className="pl-flight"
                  data-sel={selected === l.mission.id ? '1' : '0'}
                >
                  <span>
                    {l.precision === 'jaar' ? (
                      <>
                        <span className="pl-flight__d" style={{ color: 'var(--pl-ink-3)' }}>2026</span>
                        <span className="pl-flight__in">alleen jaar</span>
                      </>
                    ) : l.precision === 'maand' ? (
                      <>
                        <span className="pl-flight__d" style={{ color: 'var(--pl-ink-2)' }}>
                          {l.date.toLocaleDateString('nl-NL', { month: 'short' })}
                        </span>
                        <span className="pl-flight__in">maand bekend</span>
                      </>
                    ) : (
                      <>
                        <span className="pl-flight__d">{l.date.toLocaleDateString('nl-NL', DAYFMT)}</span>
                        <span className="pl-flight__in pl-live">
                          {l.days === 0 ? 'vandaag' : l.days === 1 ? 'morgen' : `over ${l.days} d`}
                        </span>
                      </>
                    )}
                  </span>

                  <span style={{ minWidth: 0 }}>
                    <span className="pl-flight__t" style={{ display: 'block' }}>{l.mission.name}</span>
                    <span className="pl-meta" style={{ marginTop: 6 }}>
                      <span>{shortAgency(l.mission.agency)}</span>
                      {l.mission.launchSite && (
                        <>
                          <span className="pl-meta__tick" aria-hidden="true" />
                          <span>{l.mission.launchSite.split(',').slice(-2).join(',').trim()}</span>
                        </>
                      )}
                    </span>
                  </span>

                  <span className="pl-flight__meta">{l.mission.vehicle || '—'}</span>
                  <span className="pl-flight__dest">{destinationGroup(l.mission.body)}</span>
                </Link>
              ))}
            </div>

            {schedule && !windowKey && shown.length > 12 && (
              <p className="pl-label" style={{ marginTop: 14 }}>
                Nog {shown.length - 12} vluchten verderop in het jaar — kies een maand op de strook.
              </p>
            )}
          </section>
        )}

        {/* ══ Lopende missies ══ */}
        <section className="pl-wrap pl-gap-lg" aria-labelledby="pl-fleet">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-fleet" className="pl-h2">Wat er nu vliegt</h2>
              <span className="pl-label">Missies in bedrijf</span>
            </div>
            <p className="pl-label pl-num">{activeShown.length}</p>
          </div>

          {activeShown.length === 0 ? (
            <div className="pl-plate" style={{ padding: '40px 24px' }}>
              <p className="pl-body-s">Geen lopende missies van {agency && shortAgency(agency)}.</p>
            </div>
          ) : (
            <div className="pl-fleet">
              {activeShown.map((m: MissionDetail) => (
                <Link key={m.id} href={`/missies/${m.id}`} className="pl-fleetcell pl-lift">
                  <span className="pl-label">{shortAgency(m.agency)}</span>
                  <span className="pl-fleetcell__t">{m.name}</span>
                  <p className="pl-body-s" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                    {m.objective}
                  </p>
                  <span className="pl-meta">
                    <span>{destinationGroup(m.body)}</span>
                    <span className="pl-meta__tick" aria-hidden="true" />
                    <span className="pl-mstat" data-on="1"><i aria-hidden="true" />actief</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="pl-wrap">
          <AdPlate />
        </div>
      </main>

      <SiteFooter
        cols={FOOTER_COLS}
        note={lastUpdated ? `Lanceerdata: Launch Library 2 · bijgewerkt ${lastUpdated.toLocaleDateString('nl-NL')}` : 'Lanceerdata: Launch Library 2'}
      />
    </div>
  )
}
