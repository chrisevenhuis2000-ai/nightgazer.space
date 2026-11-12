'use client'

/* De Hemelbrief: aanmelden voor de wekelijkse mail.

   Eén veld en één knop, in de plaatstijl. De aanmelding gaat naar het
   formulier "Hemelbrief" in MailerLite (lib/hemelbrief.ts). MailerLite
   stuurt een bevestigingsmail (double opt-in); pas na die klik staat
   iemand op de lijst. Het verborgen veld "website" vangt spambots: een
   mens ziet het niet, een bot vult het in en wordt stil genegeerd.

   We posten als gewoon formulier (geen preflight). Mag de browser het
   antwoord niet lezen (CORS), dan proberen we het nog eens blind
   (no-cors): de aanmelding komt dan toch aan, alleen zien we niet of
   MailerLite hem goedkeurde. */
import { useState } from 'react'
import Link from 'next/link'
import { telGebeurtenis } from '@/lib/tel'
import { HEMELBRIEF_ACTIE, HEMELBRIEF_DAG } from '@/lib/hemelbrief'

type Staat = 'leeg' | 'bezig' | 'klaar' | 'fout' | 'ongeldig'

const waar = () => (typeof location !== 'undefined' ? location.pathname : '')

/** kaal: alleen het formulier, zonder plaat en kop (voor in de kop van /hemelbrief). */
export function Hemelbrief({ tekst, kaal }: { tekst?: string; kaal?: boolean }) {
  const [staat, setStaat] = useState<Staat>('leeg')

  async function verstuur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('website')) { setStaat('klaar'); return }
    const email = String(f.get('email') ?? '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStaat('ongeldig'); return }
    setStaat('bezig')
    const body = new URLSearchParams({ 'fields[email]': email, 'ml-submit': '1', anticsrf: 'true' })
    try {
      let ok = false
      try {
        const r = await fetch(HEMELBRIEF_ACTIE, { method: 'POST', body })
        const j = await r.json().catch(() => ({}))
        ok = r.ok && j?.success !== false
      } catch {
        await fetch(HEMELBRIEF_ACTIE, { method: 'POST', body, mode: 'no-cors' })
        ok = true
      }
      setStaat(ok ? 'klaar' : 'fout')
      telGebeurtenis(ok ? 'hemelbrief-aan' : 'hemelbrief-fout', waar())
    } catch {
      setStaat('fout')
      telGebeurtenis('hemelbrief-fout', waar())
    }
  }

  const inhoud = (
      staat === 'klaar' ? (
        <p className="pl-brief__klaar" role="status">
          <i className="pl-brief__vink" aria-hidden="true" />
          <span><strong>Bijna klaar.</strong> Je krijgt een mail van NightGazer. Klik op de bevestigingslink, dan sta je erop.
          Niets gezien? Kijk even bij je spam of reclame.</span>
        </p>
      ) : (
        <form className="pl-brief__form" onSubmit={verstuur} noValidate>
          <label className="sr-only" htmlFor="hemelbrief-mail">Je e-mailadres</label>
          <input
            id="hemelbrief-mail" name="email" type="email" autoComplete="email" inputMode="email" required
            className="pl-field-in pl-brief__in" placeholder="je@mailadres.nl"
            aria-invalid={staat === 'ongeldig' || undefined} aria-describedby="hemelbrief-uitleg"
            onInput={() => (staat === 'fout' || staat === 'ongeldig') && setStaat('leeg')}
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="pl-brief__val" aria-hidden="true" />
          <button type="submit" className="pl-btn pl-btn--act" disabled={staat === 'bezig'}>
            {staat === 'bezig' ? 'Even geduld' : 'Aanmelden'}
          </button>
          <p id="hemelbrief-uitleg" className={`pl-brief__uitleg${staat === 'fout' || staat === 'ongeldig' ? ' pl-brief__uitleg--fout' : ''}`} role={staat === 'fout' || staat === 'ongeldig' ? 'alert' : undefined}>
            {staat === 'ongeldig'
              ? 'Dat lijkt geen e-mailadres. Kijk even of er een @ en een punt in staan.'
              : staat === 'fout'
              ? 'Het aanmelden lukte niet. Probeer het over een paar minuten nog eens.'
              : kaal
              ? <>Gratis, en afmelden kan altijd. Je adres staat bij MailerLite en gaat nergens anders heen (<Link href="/privacy/" className="pl-voorw__a">privacy</Link>).</>
              : <>Je adres staat bij MailerLite en gaat nergens anders heen. Zie de <Link href="/privacy/" className="pl-voorw__a">privacyverklaring</Link>.</>}
          </p>
        </form>
      )
  )

  if (kaal) return <div className="pl-brief pl-brief--kaal" id="hemelbrief">{inhoud}</div>

  return (
    <div className="pl-plate pl-brief" id="hemelbrief">
      <div className="pl-brief__t">
        <h2 className="pl-h3">De Hemelbrief</h2>
        <p className="pl-body-s">
          {tekst ?? `Elke ${HEMELBRIEF_DAG} in je mail: wat je dat weekend aan de hemel ziet, wanneer het donker is en waar je moet kijken. Gratis, en afmelden kan altijd.`}
        </p>
      </div>
      {inhoud}
    </div>
  )
}
