/* Welkom: een korte, persoonlijke intro op de homepage, direct onder de
   eerste plaat. Een foto van de nachthemel, wie de site maakt en wat het
   is, en drie ingangen voor wie net begint, elk met het beeld van zijn
   onderwerp. Alle feiten over de maker komen van /over; pas ze daar en hier
   samen aan. */

import Link from 'next/link'
import { Ico } from './Instruments'
import { nasaBeeld } from '@/lib/uitrusting'

/* De foto is van de maker zelf (public/beeld, verkleind, zonder EXIF).
   De beelden bij de ingangen komen van NASA; id's uit images-api.nasa.gov. */
const BEELD = {
  src: '/beeld/andromeda-crix.jpg',
  alt: 'De Andromedanevel met haar twee begeleidende sterrenstelsels',
  credit: 'De Andromedanevel, door Crix gefotografeerd',
}

const INGANGEN = [
  {
    href: '/sterrenkijken/', kop: 'Kan ik vannacht kijken?',
    tekst: 'De komende nachten in één oogopslag: bewolking, maan en wind',
    beeld: nasaBeeld('GSFC_20171208_Archive_e001864', 'small'), pos: '50% 50%',
  },
  {
    href: '/sterrenkijken/eerste-telescoop/', kop: 'Je eerste telescoop',
    tekst: 'Waar je op let, en wat je er echt mee ziet',
    beeld: nasaBeeld('PIA03162', 'small'), pos: '50% 50%',
  },
  {
    href: '/gidsen/', kop: 'Alle gidsen',
    tekst: 'Rustig beginnen, van meteorenzwerm tot uitrusting',
    beeld: nasaBeeld('PIA04227', 'small'), pos: '60% 50%',
  },
]

export function Welkom() {
  return (
    <section className="pl-plate pl-welkom" aria-labelledby="pl-welkom-kop">
      <figure className="pl-welkom__beeld">
        <img src={BEELD.src} alt={BEELD.alt} width={1600} height={1122} decoding="async" />
        <figcaption className="pl-welkom__credit">{BEELD.credit}</figcaption>
      </figure>

      <div className="pl-welkom__ik">
        <span className="pl-label">Welkom bij NightGazer</span>
        <h2 id="pl-welkom-kop" className="pl-h2">Hoi, ik ben Crix</h2>
        <p className="pl-body">
          Ik maak NightGazer alleen, in mijn vrije tijd, vanuit Groningen. In januari 2026 kocht
          ik een telescoop als cadeau voor mijn vriendin. Al snel stond ik er zelf vaker achter
          dan zij, en sindsdien kijk ik omhoog zodra het helder is.
        </p>
        <p className="pl-body">
          Hier zet ik wat ik zelf had willen vinden toen ik begon: ruimtenieuws in het
          Nederlands, uitleg op je eigen niveau en een eerlijk antwoord op de vraag of je vannacht
          iets kunt zien. Elk artikel lees je als beginner, amateur of pro.
        </p>
        <dl className="pl-welkom__env">
          <div><dt className="pl-label">Kijkt sinds</dt><dd>januari 2026</dd></div>
          <div><dt className="pl-label">Telescoop</dt><dd>Comet Hunter</dd></div>
          <div><dt className="pl-label">Hemel</dt><dd>Bortle 4, Lauwersmeer</dd></div>
        </dl>
        <Link href="/over/" className="pl-read">
          <span>Meer over mij</span>
          <span className="pl-read__rule" aria-hidden="true" />
          <Ico.arrow />
        </Link>
      </div>

      <div className="pl-welkom__start">
        <span className="pl-label">Nieuw met sterrenkijken? Begin hier</span>
        <ul className="pl-welkom__rijen">
          {INGANGEN.map(r => (
            <li key={r.href}>
              <Link href={r.href} className="pl-welkom__rij">
                <span className="pl-welkom__duim" aria-hidden="true">
                  <img src={r.beeld} alt="" loading="lazy" decoding="async" style={{ objectPosition: r.pos }} />
                </span>
                <span className="pl-welkom__rtekst">
                  <span className="pl-welkom__kop">{r.kop}</span>
                  <span className="pl-body-s">{r.tekst}</span>
                </span>
                <Ico.arrow />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
