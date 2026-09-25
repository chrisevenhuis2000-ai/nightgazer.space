'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Hemelagenda — meteorenzwermen en lanceringen, met .ics-export

   Wat hier telt is wat er NIET in staat. Van de zestig geplande vluchten
   draagt het merendeel alleen een jaartal; Launch Library levert zo'n venster
   als de laatste dag ervan, dus 'ergens in 2026' wordt 31 december. Die
   vluchten krijgen geen agenda-item — een afspraak op een verzonnen dag is
   erger dan geen afspraak. Ze staan wel in de lijst, met hun echte precisie
   erbij, zodat je weet dat ze bestaan.

   Zwermen krijgen een tijdvak van 22:00 tot 02:00 in zwevende lokale tijd;
   lanceringen worden hele dagen, omdat de data geen lanceertijd draagt.
   ══════════════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from 'react'
import { METEORS, SHOWER_YEAR, showerWindow, type Shower } from '@/lib/sky-data'
import { buildSchedule, type ScheduledLaunch } from '@/lib/mission-schedule'
import { downloadIcs, slugFile, type CalEvent } from '@/lib/ics'
import { Ico } from '../Instruments'

type Soort = 'zwerm' | 'lancering'
interface Item {
  key: string
  soort: Soort
  datum: Date
  titel: string
  regel: string
  detail: string
  /** Alleen items met een harde datum kunnen de agenda in. */
  agenda: CalEvent | null
  /** Waarom niet, als agenda null is. */
  waarom?: string
}

const dagLabel = (d: Date) =>
  d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

function zwermItem(s: Shower): Item {
  const { start, end: eind } = showerWindow(s)
  const beschrijving =
    `${s.note}\n\n`
    + `Tot ${s.zhr} meteoren per uur bij een ideaal donkere hemel; in de praktijk minder.\n`
    + `De radiant ligt in ${s.radiant}, maar kijk daar juist niet strak naar — `
    + `de mooiste sporen zie je er een stuk vandaan.\n\n`
    + `Kijken kan van ${start.getHours()}:00 tot ${eind.getHours()}:00. `
    + `Geen telescoop of verrekijker: je ogen vangen het meeste. `
    + `Geef ze twintig minuten om aan het donker te wennen en kijk niet op je telefoon.\n\n`
    + `nightgazer.space/sterrenkijken`

  return {
    key: `zwerm-${s.name}`,
    soort: 'zwerm',
    datum: start,
    titel: s.name,
    regel: `Piek ${s.peak} · ZHR ${s.zhr} · radiant in ${s.radiant}`,
    detail: s.note,
    agenda: {
      uid: `${slugFile(s.name)}-${SHOWER_YEAR}@nightgazer.space`,
      title: `${s.name} — piek (tot ${s.zhr}/uur)`,
      description: beschrijving,
      url: 'https://nightgazer.space/sterrenkijken/',
      allDay: false,
      start,
      end: eind,
      remindDays: 1,
    },
  }
}

function lanceringItem(l: ScheduledLaunch): Item {
  const m = l.mission
  const hard = l.precision === 'dag'
  const eind = new Date(l.date.getFullYear(), l.date.getMonth(), l.date.getDate() + 1)

  return {
    key: `lancering-${m.id}`,
    soort: 'lancering',
    datum: l.date,
    titel: m.name,
    regel: `${m.agency}${m.vehicle ? ` · ${m.vehicle}` : ''}`,
    detail: m.objective,
    waarom: hard ? undefined
      : l.precision === 'maand'
        ? 'Alleen de maand staat vast'
        : 'Alleen het jaar staat vast',
    agenda: hard ? {
      uid: `lancering-${m.id}@nightgazer.space`,
      title: `${m.name} — lancering`,
      description:
        `${m.objective}\n\n`
        + (m.vehicle ? `Raket: ${m.vehicle}\n` : '')
        + (m.launchSite ? `Vanaf: ${m.launchSite}\n` : '')
        + `\nLanceerdata schuiven vaak. Controleer de dag zelf even voor je gaat kijken.\n\n`
        + `nightgazer.space/missies`,
      location: m.launchSite || undefined,
      url: 'https://nightgazer.space/missies/',
      allDay: true,
      start: l.date,
      end: eind,
      remindDays: 1,
    } : null,
  }
}

export default function Hemelagenda() {
  const [filter, setFilter] = useState<'alles' | Soort>('alles')
  const [gedaan, setGedaan] = useState<string | null>(null)

  const items = useMemo(() => {
    const nu = new Date()
    const vandaag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())

    const zwermen = METEORS
      .map(zwermItem)
      .filter(i => i.datum >= vandaag)

    const alle = buildSchedule(nu).upcoming
      .map(lanceringItem)
      /* Een jaar vooruit; daarna is een lanceerdatum toch niet meer dan een
         voornemen. */
      .filter(i => i.datum.getTime() - vandaag.getTime() < 400 * 86400_000)

    /* Deze lijst bestaat om dingen in een agenda te zetten. Zevenenveertig
       vluchten zonder vaste dag bovenaan zetten begraaft de handvol die je
       wél kunt plannen. Ze verdwijnen niet — ze staan geteld in de voetnoot. */
    const lanceringen = alle.filter(i => i.agenda)

    return {
      rijen: [...zwermen, ...lanceringen].sort((a, b) => a.datum.getTime() - b.datum.getTime()),
      zonderDag: alle.length - lanceringen.length,
    }
  }, [])

  const zichtbaar = useMemo(
    () => filter === 'alles' ? items.rijen : items.rijen.filter(i => i.soort === filter),
    [items, filter],
  )
  const planbaar = useMemo(() => zichtbaar.filter(i => i.agenda), [zichtbaar])

  function zet(i: Item) {
    if (!i.agenda) return
    downloadIcs([i.agenda], slugFile(i.titel), i.titel)
    setGedaan(i.key)
    window.setTimeout(() => setGedaan(g => (g === i.key ? null : g)), 2600)
  }

  function zetAlles() {
    if (planbaar.length === 0) return
    downloadIcs(
      planbaar.map(i => i.agenda!),
      'nightgazer-hemelagenda',
      'NightGazer — hemelagenda',
    )
    setGedaan('alles')
    window.setTimeout(() => setGedaan(g => (g === 'alles' ? null : g)), 2600)
  }

  const geschat = filter === 'zwerm' ? 0 : items.zonderDag

  return (
    <div className="pl-agenda">
      <div className="pl-band">
        <div className="pl-band__t">
          <div className="pl-seg" role="group" aria-label="Filter de agenda">
            {([['alles', 'Alles'], ['zwerm', 'Zwermen'], ['lancering', 'Lanceringen']] as const).map(
              ([v, label]) => (
                <button key={v} aria-pressed={filter === v} onClick={() => setFilter(v)}>
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
        <button type="button" className="pl-btn pl-btn--act" onClick={zetAlles} disabled={planbaar.length === 0}>
          <Ico.cal size={14} />
          {gedaan === 'alles' ? 'Bestand gedownload' : `Alle ${planbaar.length} in agenda`}
        </button>
      </div>

      <ol className="pl-agenda__lijst">
        {zichtbaar.map(i => (
          <li key={i.key} className="pl-agenda__rij" data-soort={i.soort}>
            <div className="pl-agenda__datum">
              <span className="pl-num pl-agenda__dag">{dagLabel(i.datum)}</span>
              <span className="pl-label">{i.datum.getFullYear()}</span>
            </div>

            <div className="pl-agenda__wat">
              <span className="pl-agenda__soort pl-label">
                {i.soort === 'zwerm' ? 'Meteorenzwerm' : 'Lancering'}
              </span>
              <span className="pl-agenda__titel">{i.titel}</span>
              <span className="pl-meta">{i.regel}</span>
              <p className="pl-body-s">{i.detail}</p>
            </div>

            <div className="pl-agenda__actie">
              {i.agenda ? (
                <button type="button" className="pl-btn" onClick={() => zet(i)}>
                  {gedaan === i.key ? 'Gedownload' : 'Zet in agenda'}
                </button>
              ) : (
                <span className="pl-agenda__schatting pl-label" title="Zonder harde dag zou een agenda-item een datum verzinnen">
                  {i.waarom}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {zichtbaar.length === 0 && (
        <p className="pl-body-s">Niets gepland in deze categorie.</p>
      )}

      {geschat > 0 && (
        <p className="pl-agenda__voet pl-body-s">
          {geschat} {geschat === 1 ? 'vlucht heeft' : 'vluchten hebben'} nog geen vaste dag.
          Die {geschat === 1 ? 'krijgt' : 'krijgen'} bewust geen agenda-item: de bron levert een
          venster van een maand of een heel jaar, en dan zou een afspraak een dag verzinnen.
        </p>
      )}
    </div>
  )
}
