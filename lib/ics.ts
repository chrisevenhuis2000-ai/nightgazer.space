// ── Agenda-export (.ics, RFC 5545) ─────────────────────────────────────────
//
// Genereert geldige iCalendar-bestanden in de browser, zodat een bezoeker
// een meteorenzwerm of lancering in zijn eigen agenda kan zetten.
//
// Twee keuzes die eruit springen:
//
// 1. Zwermen krijgen een 'zwevende' tijd: 22:00 zonder tijdzone. Dat is in
//    RFC 5545 de vorm die 'lokale tijd van de kijker' betekent, en dat is
//    precies goed — een meteorenzwerm kijk je om tien uur 's avonds waar je
//    ook bent. Een vaste UTC-tijd zou voor een lezer in een andere zone het
//    verkeerde uur in de agenda zetten.
//
// 2. Lanceringen zijn hele dagen, nooit een tijdstip. De missiedata draagt
//    alleen een datum; er staat geen lanceervenster in. Een agenda-item om
//    09:00 zou een tijd verzinnen die nergens vandaan komt.

export interface CalEvent {
  uid: string
  title: string
  description?: string
  location?: string
  url?: string
  /** Hele dag, of een tijdvak met zwevende lokale tijd. */
  allDay: boolean
  start: Date
  end: Date
  /** Herinnering vooraf, in dagen. */
  remindDays?: number
}

const pad = (n: number) => String(n).padStart(2, '0')
const dateStamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const floating = (d: Date) => `${dateStamp(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`
const utc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
  + `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

/** Tekst ontsnappen zoals RFC 5545 voorschrijft. */
function esc(v: string): string {
  return v
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Regels vouwen op 75 octetten. Tellen in octetten, niet in tekens: 'ë' en
 * '·' zijn in UTF-8 twee bytes en een naïeve knip op 75 tekens levert
 * regels op die te lang zijn — sommige agenda's weigeren het bestand dan.
 * Een knip mag ook nooit midden in een meerbyte-teken vallen.
 */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let start = 0
  while (start < bytes.length) {
    const limit = out.length === 0 ? 75 : 74   // vervolgregels beginnen met een spatie
    let end = Math.min(start + limit, bytes.length)
    /* Niet midden in een UTF-8-teken knippen: vervolgbytes zijn 10xxxxxx. */
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--
    const chunk = new TextDecoder().decode(bytes.slice(start, end))
    out.push(out.length === 0 ? chunk : ' ' + chunk)
    start = end
  }
  return out.join('\r\n')
}

function vevent(e: CalEvent, stamp: Date): string[] {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${utc(stamp)}`,
  ]
  if (e.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${dateStamp(e.start)}`, `DTEND;VALUE=DATE:${dateStamp(e.end)}`)
  } else {
    lines.push(`DTSTART:${floating(e.start)}`, `DTEND:${floating(e.end)}`)
  }
  lines.push(`SUMMARY:${esc(e.title)}`)
  if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`)
  if (e.location) lines.push(`LOCATION:${esc(e.location)}`)
  if (e.url) lines.push(`URL:${e.url}`)
  lines.push('TRANSP:TRANSPARENT')
  if (e.remindDays) {
    lines.push(
      'BEGIN:VALARM', 'ACTION:DISPLAY',
      `TRIGGER:-P${e.remindDays}D`,
      `DESCRIPTION:${esc(e.title)}`,
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT')
  return lines
}

/** Bouwt een compleet .ics-bestand. */
export function buildIcs(events: CalEvent[], name = 'NightGazer'): string {
  const stamp = new Date()
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NightGazer//nightgazer.space//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    'X-WR-TIMEZONE:Europe/Amsterdam',
    ...events.flatMap(e => vevent(e, stamp)),
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Biedt het bestand aan als download. */
export function downloadIcs(events: CalEvent[], filename: string, name?: string): void {
  const blob = new Blob([buildIcs(events, name)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Een bestandsnaam zonder verrassingen. */
export function slugFile(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
