'use client'

/* ══════════════════════════════════════════════════════════════════════════
   NightGazer missiepagina — /missies/[slug]

   Eén plaat uit het lanceermanifest, in dezelfde archiefwereld als /missies:
   kop en voet uit shared.tsx, status als vierkant, alleen velden die de data
   echt kent. Een missie met een testcampagne (Starship) krijgt bovenaan het
   testlogboek: per vlucht wat de booster deed en wat het schip deed.
   Wereld en kleurwetten staan in DESIGN.md.
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { SiteFooter } from '@/app/components/SiteFooter'
import {
  getMissionBySlug, MISSIONS, MISSIONS_LAST_UPDATED,
  type MissionDetail, type CampagneVlucht, type TrapUitkomst,
} from '@/lib/missions-data'
import {
  buildSchedule, parseLaunchDate, destinationGroup, mapPrecision, inferPrecision,
  type ScheduledLaunch,
} from '@/lib/mission-schedule'
import { type Article } from '@/lib/home-content'
import { Ico, Tip } from '@/app/_plate/Instruments'
import {
  archivo, FOOTER_COLS, PlateHead, AdPlate, editionLabel, useMissionImages, img,
} from '@/app/_plate/shared'

/* ── Wat de data echt weet ─────────────────────────────────────────────── */

/* Het script vult onbekende velden met 'Onbekend'. Een vak dat dat zegt is
   een gat dat als fout leest; zo'n veld wordt niet getoond. */
function known(v: string | undefined): v is string {
  return !!v && !/^(onbekend|tbd|n\.?v\.?t\.?)$/i.test(v.trim())
}

/* Launch Library leverde API-adressen (…/?format=json) als missie-URL. Een
   bezoeker krijgt daar een scherm vol JSON; alleen een echte site telt. */
function isWebUrl(u: string | undefined): u is string {
  return !!u && /^https?:\/\//i.test(u) && !/thespacedevs\.com|[?&]format=json/i.test(u)
}

function statusWord(m: MissionDetail): string {
  if (m.status === 'mislukt') return 'mislukt'
  if (m.status === 'voltooid') return m.soort === 'lancering' ? 'gelanceerd' : 'afgerond'
  return m.status
}

function statusColor(m: MissionDetail): string {
  if (m.status === 'actief') return 'var(--pl-good)'
  if (m.status === 'mislukt') return 'var(--pl-warn)'
  return 'var(--pl-ink-3)'
}

/* Welk voertuig een missie deelt met andere: Starship heet in de data zowel
   'Starship' als 'Super Heavy + Starship (volledig stapel)'. */
function vehicleKey(m: MissionDetail): string {
  const v = `${m.vehicle} ${m.name}`.toLowerCase()
  if (v.includes('starship')) return 'starship'
  return (m.vehicle || '').toLowerCase().trim()
}

/* Een datum zo hard als hij is: een kwartaal blijft een kwartaal, en wordt
   niet 'dec 2026' omdat Launch Library het als de laatste dag levert. */
function dateText(m: MissionDetail): string {
  const d = parseLaunchDate(m.launched)
  if (!d) return known(m.launched) ? m.launched.replace(/^Sinds /, 'sinds ') : '—'
  const prec = mapPrecision(m.launchPrecision) ?? inferPrecision(d)
  const p = (m.launchPrecision || '').toLowerCase()
  if (prec === 'dag') return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  if (prec === 'maand') return d.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })
  return p.startsWith('quarter') ? `Q${p.replace(/\D/g, '')} ${d.getFullYear()}` : String(d.getFullYear())
}

function flightNumber(name: string): number | null {
  const n = name.match(/(?:flight|ift)[\s-]*(\d+)\s*$/i)
  return n ? Number(n[1]) : null
}

/* ── Verwant nieuws ───────────────────────────────────────────────────────
   Tags als 'spacex', 'falcon' of 'nasa' matchten vroeger elk artikel van dat
   agentschap: Starship toonde drie Falcon 9-lanceringen. Alleen woorden die
   bij deze missie horen tellen, en ze moeten als heel woord in de titel
   staan. */
const GENERIEK = new Set([
  'spacex', 'nasa', 'esa', 'jaxa', 'isro', 'cnsa', 'roscosmos', 'ula', 'arianespace',
  'rocket lab', 'musk', 'falcon', 'falcon 9', 'testvlucht', 'lancering', 'launch',
  'suborbital', 'suborbitaal', 'low earth orbit', 'lage aardbaan', 'leo', 'satelliet',
  'satellieten', 'raket', 'ruimtevaart', 'missie', 'herbruikbare raket',
])

function relatedTerms(m: MissionDetail): string[] {
  const agency = m.agency.toLowerCase()
  const terms = new Set<string>()
  for (const raw of m.relatedTags) {
    const t = raw.toLowerCase().replace(/-/g, ' ').trim()
    if (t.length < 3 || GENERIEK.has(t) || t === agency) continue
    terms.add(t)
  }
  return [...terms]
}

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

function useRelated(m: MissionDetail | undefined, limit = 6): Article[] | null {
  const [list, setList] = useState<Article[] | null>(null)
  useEffect(() => {
    if (!m) return
    const res = relatedTerms(m).map(t => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(t)}($|[^\\p{L}\\p{N}])`, 'iu'))
    if (!res.length) { setList([]); return }
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => {
        if (!Array.isArray(data)) { setList([]); return }
        const hits = data
          .filter(a => res.some(re => re.test(a.title)))
          .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
        setList(hits.slice(0, limit))
      })
      .catch(() => setList([]))
  }, [m, limit])
  return list
}

/* ── Het testlogboek ─────────────────────────────────────────────────────── */

const UITKOMST: Record<TrapUitkomst, string> = {
  gevangen: 'gevangen',
  zee:      'in zee',
  verloren: 'verloren',
  onbekend: 'nog niet ingevuld',
}

/* Uitkomst als markering, zoals status overal een vierkant is: gevuld is
   teruggekomen in de toren, open is gecontroleerd in zee, rood is verloren,
   gestippeld staat nog niet in de data. */
function Uitkomst({ o, word = true }: { o: TrapUitkomst; word?: boolean }) {
  return (
    <span className="pl-out" data-o={o}>
      <i aria-hidden="true" />
      {word ? UITKOMST[o] : <span className="sr-only">{UITKOMST[o]}</span>}
    </span>
  )
}

const MAAND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
function isoKort(iso: string): string {
  const [y, mo, d] = iso.split('-').map(Number)
  return d && mo ? `${d} ${MAAND[mo - 1]} ${y}` : iso
}

/* Volgende vlucht met hetzelfde voertuig. Alleen een echte dag wordt een
   aftelling; een kwartaal of jaar blijft een kwartaal of jaar. */
function NextFlight({ vkey, self }: { vkey: string; self: string }) {
  const [next, setNext] = useState<ScheduledLaunch | null | undefined>(undefined)
  useEffect(() => {
    const s = buildSchedule(new Date())
    setNext(s.upcoming.find(l => l.mission.id !== self && vehicleKey(l.mission) === vkey) ?? null)
  }, [vkey, self])

  if (next === undefined) return <div className="pl-next pl-skel" aria-hidden="true" />
  if (next === null) {
    return (
      <div className="pl-next">
        <span className="pl-label">Volgende vlucht</span>
        <span className="pl-next__when" style={{ color: 'var(--pl-ink-2)' }}>Nog niet in het manifest</span>
      </div>
    )
  }

  const p = (next.mission.launchPrecision || '').toLowerCase()
  const y = next.date.getFullYear()
  const when = next.precision === 'dag'
    ? null
    : next.precision === 'maand'
      ? `${next.date.toLocaleDateString('nl-NL', { month: 'long' })} ${y}`
      : p.startsWith('quarter') ? `Q${p.replace(/\D/g, '')} ${y}` : String(y)

  return (
    <Link href={`/missies/${next.mission.id}/`} className="pl-next pl-press">
      <span className="pl-label">Volgende vlucht</span>
      <span className="pl-next__t">{next.mission.name}</span>
      {next.precision === 'dag' ? (
        <span className="pl-next__when">
          <span className="pl-num pl-live">
            {next.days === 0 ? 'vandaag' : next.days === 1 ? 'morgen' : `over ${next.days} dagen`}
          </span>
          <span className="pl-label pl-num">{next.date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</span>
        </span>
      ) : (
        <span className="pl-next__when">
          <span className="pl-num">{when}</span>
          <span className="pl-label">{next.precision === 'maand' ? 'dag nog niet bekend' : 'maand en dag nog niet bekend'}</span>
        </span>
      )}
    </Link>
  )
}

function Testlogboek({ mission, vlucht }: { mission: MissionDetail; vlucht: CampagneVlucht[] }) {
  /* Welke vlucht onder de aandacht staat — gedeeld door banen en rijen,
     zoals de strook en de lijst op /missies. Alleen een muis zet hem: op
     touch blijft een hover na een tik hangen. */
  const [hot, setHot] = useState<string | null>(null)
  const enter = useCallback((id: string) => (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setHot(id)
  }, [])
  const leave = useCallback(() => setHot(null), [])

  const vkey = vehicleKey(mission)

  /* Een nummer dat tussen het logboek en de volgende vlucht ontbreekt, staat
     niet in de data. Dat wordt gezegd in plaats van overgeslagen. */
  const missing = useMemo(() => {
    const last = Math.max(...vlucht.map(v => flightNumber(v.vlucht) ?? 0))
    const later = MISSIONS
      .filter(m => vehicleKey(m) === vkey && m.status === 'gepland')
      .map(m => flightNumber(m.name))
      .filter((n): n is number => n !== null && n > last)
    if (!later.length || !last) return [] as number[]
    const first = Math.min(...later)
    return Array.from({ length: Math.max(0, first - last - 1) }, (_, i) => last + 1 + i)
  }, [vlucht, vkey])

  /* Op een smal scherm passen niet alle vluchten: de banen openen bij de
     nieuwste, want daar zit het nieuws. */
  const lanesRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = lanesRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  /* Versiegrenzen op de banen: waar V1 overgaat in V2 staat een streep. */
  const versieStart = (i: number) => i === 0 || vlucht[i - 1].versie !== vlucht[i].versie

  return (
    <section className="pl-wrap" aria-labelledby="pl-log">
      <div className="pl-band">
        <div className="pl-band__t">
          <h2 id="pl-log" className="pl-h2">Het testlogboek</h2>
          <Tip label={
            <>
              <span className="pl-label" style={{ display: 'block', marginBottom: 6 }}>Het logboek lezen</span>
              Elke kolom is een testvlucht. De bovenste baan is de Super
              Heavy-booster, de onderste het schip. Een gevuld vierkant kwam
              terug in de lanceertoren, een open vierkant landde gecontroleerd
              in zee, rood ging verloren. Gestippeld staat nog niet in de data.
            </>
          }>
            <span className="pl-label">{vlucht.length} vluchten · booster en schip</span>
          </Tip>
        </div>
      </div>

      <div className="pl-log">
        <div className="pl-lanes-wrap" ref={lanesRef}>
          <div className="pl-lanes" style={{ ['--n' as string]: vlucht.length }} aria-hidden="true">
            <span className="pl-lanes__lab" />
            {vlucht.map((v, i) => (
              <span
                key={`v-${v.vlucht}`}
                className="pl-lanes__ver pl-label"
                data-start={versieStart(i) ? '1' : '0'}
              >
                {versieStart(i) ? v.versie : ''}
              </span>
            ))}

            <span className="pl-lanes__lab" />
            {vlucht.map((v, i) => (
              <span key={`n-${v.vlucht}`} className="pl-lanes__head pl-num" data-start={versieStart(i) ? '1' : '0'} data-hot={hot === v.vlucht ? '1' : '0'}>
                {v.vlucht.replace(/^IFT-/, '').replace(/^Flight /, '')}
              </span>
            ))}

            {(['booster', 'schip'] as const).map(trap => (
              <div key={trap} className="pl-lanes__row">
                <span className="pl-lanes__lab pl-label">{trap === 'booster' ? 'Booster' : 'Schip'}</span>
                {vlucht.map((v, i) => (
                  <span
                    key={`${trap}-${v.vlucht}`}
                    className="pl-lanes__cell"
                    data-start={versieStart(i) ? '1' : '0'}
                    data-hot={hot === v.vlucht ? '1' : '0'}
                    onPointerEnter={enter(v.vlucht)}
                    onPointerLeave={leave}
                  >
                    <Uitkomst o={v[trap]} word={false} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <NextFlight vkey={vkey} self={mission.id} />
      </div>

      <table className="pl-logrows">
        <caption className="sr-only">Testvluchten van {mission.name}: uitkomst van booster en schip per vlucht</caption>
        <thead>
          <tr>
            <th scope="col" className="pl-label">Vlucht</th>
            <th scope="col" className="pl-label">Booster</th>
            <th scope="col" className="pl-label">Schip</th>
            <th scope="col" className="pl-label">Wat er gebeurde</th>
          </tr>
        </thead>
        <tbody>
          {[...vlucht].reverse().map(v => (
            <tr
              key={v.vlucht}
              data-hot={hot === v.vlucht ? '1' : '0'}
              onPointerEnter={enter(v.vlucht)}
              onPointerLeave={leave}
            >
              <th scope="row">
                <span className="pl-logrows__v">{v.vlucht}</span>
                <span className="pl-logrows__d pl-num">{isoKort(v.datum)} · {v.versie}</span>
              </th>
              <td><span className="pl-logrows__k pl-label">Booster</span><Uitkomst o={v.booster} /></td>
              <td><span className="pl-logrows__k pl-label">Schip</span><Uitkomst o={v.schip} /></td>
              <td>
                <span className="pl-body-s">{v.noot}</span>
                {(v.missie || v.bron) && (
                  <span className="pl-logrows__links">
                    {v.missie && (
                      <Link href={`/missies/${v.missie}/`} className="pl-read pl-press">
                        <span>Vluchtpagina</span>
                        <span className="pl-read__rule" aria-hidden="true" />
                      </Link>
                    )}
                    {v.bron && (
                      <Link href={v.bron} className="pl-read pl-press">
                        <span>Bron</span>
                        <span className="pl-read__rule" aria-hidden="true" />
                      </Link>
                    )}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {missing.length > 0 && (
        <p className="pl-label" style={{ marginTop: 14, lineHeight: 1.6 }}>
          Flight {missing.join(', ')} staat niet in de lanceerdata en ontbreekt hier daarom.
        </p>
      )}
    </section>
  )
}

/* ══ Pagina ═══════════════════════════════════════════════════════════════ */
export default function MissionDetailClient({ slug }: { slug: string }) {
  const mission = getMissionBySlug(slug)
  const related = useRelated(mission)

  const imgItems = useMemo(
    () => (mission ? [{ id: mission.id, vehicle: mission.vehicle, agency: mission.agency, body: mission.body }] : []),
    [mission]
  )
  const images = useMissionImages(imgItems, 1)
  const [broken, setBroken] = useState(false)

  /* Missies met hetzelfde voertuig eerst, op afstand in tijd; daarna missies
     van hetzelfde agentschap. Vroeger stonden hier altijd de eerste drie uit
     de lijst, op elke pagina dezelfde. */
  const others = useMemo(() => {
    if (!mission) return []
    const key = vehicleKey(mission)
    const t = parseLaunchDate(mission.launched)?.getTime() ?? Date.now()
    const dist = (m: MissionDetail) => Math.abs((parseLaunchDate(m.launched)?.getTime() ?? t) - t)
    const pool = MISSIONS.filter(m => m.id !== mission.id)
    /* Eén soort per lijst: onder 'Meer met Starship' geen Falcon 9. */
    const same = pool.filter(m => vehicleKey(m) === key).sort((a, b) => dist(a) - dist(b))
    if (same.length) return same.slice(0, 6)
    return pool.filter(m => m.agency === mission.agency).sort((a, b) => dist(a) - dist(b)).slice(0, 6)
  }, [mission])

  if (!mission) {
    return (
      <div className={`pl ${archivo.variable}`}>
        <PlateHead total={MISSIONS.length} edition={editionLabel()} current="missies" totalLabel="missies" />
        <main id="pl-main" className="pl-stack">
          <div className="pl-wrap">
            <div className="pl-plate" style={{ padding: '56px 24px', display: 'grid', gap: 14, justifyItems: 'start' }}>
              <h1 className="pl-h2">Deze missie staat niet in het manifest</h1>
              <p className="pl-body-s">Misschien is ze hernoemd of uit de lanceerdata verdwenen.</p>
              <Link href="/missies/" className="pl-btn">Naar het lanceermanifest</Link>
            </div>
          </div>
        </main>
        <SiteFooter cols={FOOTER_COLS} />
      </div>
    )
  }

  const campagne = mission.campagne && mission.campagne.length > 0 ? mission.campagne : null
  /* Een vlucht die in een campagne staat, wijst terug naar het logboek. */
  const parent = MISSIONS.find(m => m.campagne?.some(v => v.missie === mission.id))

  const spec = [
    { label: mission.soort === 'missie' && campagne ? 'Eerste vlucht' : 'Lancering', value: mission.launched.replace(/^Sinds /, '') },
    { label: 'Voertuig',     value: mission.vehicle },
    { label: 'Lanceerbasis', value: mission.launchSite },
    { label: 'Bestemming',   value: known(mission.body) ? destinationGroup(mission.body) : '' },
    { label: 'Duur',         value: mission.duration },
    { label: 'Afstand',      value: mission.distanceKm },
  ].filter(s => known(s.value))

  const facts = mission.facts.filter(f => known(f.value))
  const site = isWebUrl(mission.missionUrl) ? mission.missionUrl : null
  const hasSide = facts.length > 0 || !!site
  const image = images[mission.id]
  const sameVehicle = others.length > 0 && vehicleKey(others[0]) === vehicleKey(mission)
  const updated = new Date(MISSIONS_LAST_UPDATED).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className={`pl pl-mdetail ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={MISSIONS.length} edition={editionLabel()} current="missies" totalLabel="missies" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">

        {/* ══ Kop ══ */}
        <section className="pl-wrap" aria-labelledby="pl-mtitle">
          <div className="pl-mhead">
            <div className="pl-mhead__ground" aria-hidden="true">
              <span className="pl-emulsion">
                {image && !broken
                  ? <img src={img(image, 1400)} alt="" onError={() => setBroken(true)} />
                  : <span className="pl-noimg" />}
              </span>
            </div>
            <div className="pl-firstview__glow" aria-hidden="true" />

            <div className="pl-mhead__in">
              <Link href="/missies/" className="pl-crumb pl-press">
                <span className="pl-crumb__arrow" aria-hidden="true"><Ico.arrow size={12} /></span>
                Lanceermanifest
              </Link>

              <p className="pl-meta">
                <span>{mission.agency}</span>
                <span className="pl-meta__tick" aria-hidden="true" />
                <span className="pl-status" data-on={mission.status === 'actief' || mission.status === 'voltooid' ? '1' : '0'} style={{ color: statusColor(mission) }}>
                  <i aria-hidden="true" />{statusWord(mission)}
                </span>
                {parent && (
                  <>
                    <span className="pl-meta__tick" aria-hidden="true" />
                    <span>{parent.name.replace(/^SpaceX /, '')}-testcampagne</span>
                  </>
                )}
              </p>

              <h1 id="pl-mtitle" className="pl-h1">{mission.name}</h1>
              {mission.objective && <p className="pl-mhead__obj">{mission.objective}</p>}

              {parent && (
                <Link href={`/missies/${parent.id}/#pl-log`} className="pl-read pl-press">
                  <span>Naar het testlogboek</span>
                  <span className="pl-read__rule" aria-hidden="true" />
                  <Ico.arrow />
                </Link>
              )}
            </div>

            {spec.length > 0 && (
              <dl className="pl-mspec">
                {spec.map(s => (
                  <div key={s.label}>
                    <dt className="pl-label">{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        {/* ══ Testlogboek (alleen met een campagne) ══ */}
        {campagne && <Testlogboek mission={mission} vlucht={campagne} />}

        {/* ══ Over ══ */}
        <section className="pl-wrap" aria-labelledby="pl-over">
          <div className="pl-band">
            <h2 id="pl-over" className="pl-h2" style={{ fontSize: 'clamp(1.2rem,1.8vw,1.5rem)' }}>
              {mission.soort === 'lancering' ? 'Over deze vlucht' : 'Over de missie'}
            </h2>
            <p className="pl-label pl-num">Bijgewerkt {updated}</p>
          </div>

          <div className={hasSide ? 'pl-read-grid' : 'pl-read-grid pl-read-grid--solo'}>
            <div className="pl-read-main">
              <p className="pl-para pl-para--lead" style={{ marginTop: 0 }}>{mission.description}</p>

              {!campagne && mission.timeline.length > 0 && (
                <ol className="pl-mtime" aria-label="Tijdlijn">
                  {mission.timeline.map((e, i) => (
                    <li key={i}>
                      <span className="pl-mtime__d pl-num">{e.date}</span>
                      <span className="pl-mtime__e">{e.event}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {hasSide && (
              <aside className="pl-read-side" aria-label="Kerngegevens">
                {facts.length > 0 && (
                  <div>
                    <p className="pl-label" style={{ marginBottom: 14 }}>Kerngegevens</p>
                    <dl className="pl-mfacts">
                      {facts.map(f => (
                        <div key={f.label}>
                          <dt className="pl-label">{f.label}</dt>
                          <dd>{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {site && (
                  <a href={site} target="_blank" rel="noopener noreferrer" className="pl-read pl-press">
                    <span>Officiële pagina</span>
                    <span className="pl-read__rule" aria-hidden="true" />
                    <span aria-hidden="true">↗</span>
                    <span className="sr-only"> (opent in een nieuw tabblad)</span>
                  </a>
                )}
              </aside>
            )}
          </div>
        </section>

        <div className="pl-wrap">
          <AdPlate slot="7516342216" />
        </div>

        {/* ══ Verwant nieuws ══ */}
        {related && related.length > 0 && (
          <section className="pl-wrap" aria-labelledby="pl-rel">
            <div className="pl-band">
              <h2 id="pl-rel" className="pl-h2" style={{ fontSize: 'clamp(1.2rem,1.8vw,1.5rem)' }}>In het nieuws</h2>
              <Link href="/nieuws/" className="pl-read pl-press">
                <span>Het hele archief</span>
                <span className="pl-read__rule" aria-hidden="true" />
                <Ico.arrow />
              </Link>
            </div>
            <div className="pl-contact">
              {related.map(a => <RelatedCard key={a.slug} a={a} />)}
            </div>
          </section>
        )}

        {/* ══ Meer missies ══ */}
        {others.length > 0 && (
          <section className="pl-wrap" aria-labelledby="pl-more">
            <div className="pl-band">
              <h2 id="pl-more" className="pl-h2" style={{ fontSize: 'clamp(1.2rem,1.8vw,1.5rem)' }}>
                {sameVehicle && mission.vehicle ? `Meer met ${vehicleKey(mission) === 'starship' ? 'Starship' : mission.vehicle}` : `Meer van ${mission.agency}`}
              </h2>
              <Link href="/missies/" className="pl-read pl-press">
                <span>Het lanceermanifest</span>
                <span className="pl-read__rule" aria-hidden="true" />
                <Ico.arrow />
              </Link>
            </div>
            <div className="pl-flights">
              {others.map(m => (
                <Link key={m.id} href={`/missies/${m.id}/`} className="pl-flight">
                  <span>
                    <span className="pl-flight__d" style={{ color: 'var(--pl-ink-2)' }}>{dateText(m)}</span>
                    <span className="pl-flight__in" style={{ color: statusColor(m) }}>{statusWord(m)}</span>
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="pl-flight__t" style={{ display: 'block' }}>{m.name}</span>
                    <span className="pl-meta" style={{ marginTop: 6 }}><span>{m.agency}</span></span>
                  </span>
                  <span className="pl-flight__meta">{m.vehicle || '—'}</span>
                  <span className="pl-flight__dest">{destinationGroup(m.body)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter cols={FOOTER_COLS} note={`Lanceerdata: Launch Library 2 · bijgewerkt ${updated}`} />
    </div>
  )
}

function RelatedCard({ a }: { a: Article }) {
  const [broken, setBroken] = useState(false)
  return (
    <Link href={`/nieuws/${a.slug}/`} className="pl-press">
      <span className="pl-contact__fig">
        <span className="pl-emulsion pl-emulsion--sm" style={{ display: 'block' }}>
          {a.imageUrl && !broken
            ? <img src={img(a.imageUrl, 320)} alt="" loading="lazy" onError={() => setBroken(true)} />
            : <span className="pl-noimg" />}
        </span>
      </span>
      <span className="pl-contact__t">{a.title}</span>
      <span className="pl-label pl-num">{a.date}</span>
    </Link>
  )
}
