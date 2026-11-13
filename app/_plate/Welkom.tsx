/* Welkom: een korte, persoonlijke intro op de homepage, direct onder de
   eerste plaat. Links wie de site maakt en wat het is, rechts drie
   ingangen voor wie net begint. Alle feiten over de maker komen van /over;
   pas ze daar en hier samen aan. */

import Link from 'next/link'
import { Ico } from './Instruments'

const INGANGEN = [
  { href: '/sterrenkijken/', kop: 'Kan ik vannacht kijken?', tekst: 'De komende nachten in één oogopslag: bewolking, maan en wind' },
  { href: '/sterrenkijken/eerste-telescoop/', kop: 'Je eerste telescoop', tekst: 'Waar je op let, en wat je er echt mee ziet' },
  { href: '/gidsen/', kop: 'Alle gidsen', tekst: 'Rustig beginnen, van meteorenzwerm tot uitrusting' },
]

export function Welkom() {
  return (
    <section className="pl-plate pl-welkom" aria-labelledby="pl-welkom-kop">
      <div className="pl-welkom__ik">
        <span className="pl-label">Welkom bij NightGazer</span>
        <h2 id="pl-welkom-kop" className="pl-h2">Hoi, ik ben Crix</h2>
        <p className="pl-body">
          Ik maak NightGazer alleen, in mijn vrije tijd, vanuit Groningen. In januari 2026 kocht
          ik een telescoop als cadeau voor mijn vriendin. Al snel stond ik er zelf vaker achter
          dan zij, en sindsdien kijk ik omhoog zodra het helder is.
        </p>
        <p className="pl-body">
          Op deze site zet ik wat ik zelf had willen vinden toen ik begon: ruimtenieuws in het
          Nederlands, uitleg op je eigen niveau en een eerlijk antwoord op de vraag of je vannacht
          iets kunt zien. Elk artikel kun je lezen als beginner, amateur of pro.
        </p>
        <Link href="/over/" className="pl-read">
          <span>Meer over mij</span>
          <span className="pl-read__rule" aria-hidden="true" />
          <Ico.arrow />
        </Link>
      </div>

      <div className="pl-welkom__start">
        <span className="pl-label">Nieuw met sterrenkijken? Begin hier</span>
        <ul className="pl-tijd__rijen">
          {INGANGEN.map(r => (
            <li key={r.href}>
              <Link href={r.href} className="pl-tijd__rij pl-welkom__rij">
                <span className="pl-tijd__kop">{r.kop}</span>
                <span className="pl-body-s">{r.tekst}</span>
                <Ico.arrow />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
