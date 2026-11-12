'use client'

/* ══════════════════════════════════════════════════════════════════════════
   De Hemelbrief: drie kleine pagina's in de plaatstijl.

   /hemelbrief/            aanmelden (deelbare link, bijvoorbeeld op Instagram)
   /hemelbrief/bevestigd/  waar MailerLite naartoe stuurt na de klik in de
                           bevestigingsmail (Forms → Hemelbrief → bevestigingspagina)
   /hemelbrief/afgemeld/   waar MailerLite naartoe stuurt na het afmelden

   Eén kop met een NASA-plaat, wat er in de brief staat, en een volgende stap.
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { Hemelbrief } from '../components/Hemelbrief'
import { Steun } from '../components/Steun'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { nasaBeeld, nasaPagina } from '@/lib/uitrusting'
import { HEMELBRIEF_DAG, HEMELBRIEF_EERSTE, HEMELBRIEF_INHOUD } from '@/lib/hemelbrief'

export type Soort = 'aanmelden' | 'bevestigd' | 'afgemeld'

const BEELD = { nasaId: 'NHQ202108110001', titel: 'De Melkweg met een Perseïde boven Spruce Knob, augustus 2021', credit: 'NASA/Bill Ingalls' }

const KOP: Record<Soort, { label: string; titel: string; lede: string }> = {
  aanmelden: {
    label: 'Gratis, elke ' + HEMELBRIEF_DAG,
    titel: 'De Hemelbrief: elk weekend weten wat je ziet',
    lede: `Elke ${HEMELBRIEF_DAG} een korte mail over de hemel boven Nederland: wat er dat weekend te zien is, wanneer het echt donker is en waar je moet kijken. Geschreven voor wie gewoon naar buiten wil.`,
  },
  bevestigd: {
    label: 'Aanmelding bevestigd',
    titel: 'Je staat op de lijst',
    lede: `Dank je wel. De eerste Hemelbrief komt op ${HEMELBRIEF_EERSTE}, daarna elke ${HEMELBRIEF_DAG}. Zet NightGazer bij je contacten, dan belandt hij niet in je spam.`,
  },
  afgemeld: {
    label: 'Afgemeld',
    titel: 'Je bent afgemeld',
    lede: 'Je krijgt de Hemelbrief niet meer, en je adres staat niet meer op de lijst. Je bent altijd welkom om op de site te kijken wat er vannacht te zien is.',
  },
}

const VERDER: Record<Soort, { href: string; label: string; tekst: string; actie: string }[]> = {
  aanmelden: [
    { href: '/gidsen/', label: 'Alvast lezen', tekst: 'Alle gidsen: je eerste telescoop, de Leoniden, de Geminiden en meer.', actie: 'Naar de gidsen' },
  ],
  bevestigd: [
    { href: '/gidsen/leoniden/', label: 'Deze week', tekst: 'De Leoniden: zo zie je de vallende sterren van 17 en 18 november.', actie: 'Hoe laat kijken?' },
    { href: '/sterrenkijken/', label: 'Vannacht', tekst: 'Kijk welke nacht deze week helder is en wat er dan te zien valt.', actie: 'Naar Sterrenkijken' },
  ],
  afgemeld: [
    { href: '/sterrenkijken/', label: 'Vannacht', tekst: 'Kijk welke nacht deze week helder is en wat er dan te zien valt.', actie: 'Naar Sterrenkijken' },
  ],
}

export default function HemelbriefPagina({ soort }: { soort: Soort }) {
  const k = KOP[soort]
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={HEMELBRIEF_INHOUD.length} edition={editionLabel()} current="" totalLabel="onderdelen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="pl-hb">
          <div className="pl-uhero pl-hb__kop" data-soort={soort}>
            <div className="pl-uhero__ground" aria-hidden="true">
              <div className="pl-emulsion"><img src={nasaBeeld(BEELD.nasaId, 'large')} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></div>
            </div>
            <div className="pl-uhero__in">
              <span className="pl-label pl-label--stamp pl-hb__label">
                {soort === 'bevestigd' && <i className="pl-hb__vink" aria-hidden="true" />}
                {k.label}
              </span>
              <h1 id="pl-hb" className="pl-h1">{k.titel}</h1>
              <p className="pl-uhero__lede">{k.lede}</p>
            </div>
            <p className="pl-uhero__credit">
              <a href={nasaPagina(BEELD.nasaId)} target="_blank" rel="noopener">{BEELD.titel} · {BEELD.credit}</a>
            </p>
          </div>
        </section>

        {soort === 'aanmelden' && (
          <section className="pl-wrap" aria-label="Aanmelden">
            <Hemelbrief />
          </section>
        )}

        {soort !== 'afgemeld' && (
          <section className="pl-wrap" aria-labelledby="pl-hb-inhoud">
            <div className="pl-band">
              <div className="pl-band__t">
                <h2 id="pl-hb-inhoud" className="pl-h2">Wat er in de brief staat</h2>
                <span className="pl-label">Vijf minuten lezen</span>
              </div>
            </div>
            <ol className="pl-voorw__list">
              {HEMELBRIEF_INHOUD.map((d, i) => (
                <li key={d.titel} className="pl-voorw__item">
                  <span className="pl-label pl-label--stamp pl-num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="pl-h3">{d.titel}</h3>
                    <p className="pl-body">{d.tekst}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="pl-wrap pl-gids__slot" aria-label="Verder">
          {soort === 'afgemeld' && <Hemelbrief tekst="Toch weer willen ontvangen? Meld je hier opnieuw aan." />}
          {VERDER[soort].map(v => (
            <div key={v.href} className="pl-plate pl-uitr-ref">
              <div>
                <span className="pl-label">{v.label}</span>
                <p className="pl-body">{v.tekst}</p>
              </div>
              <Link href={v.href} className="pl-read">
                <span>{v.actie}</span>
                <span className="pl-read__rule" aria-hidden="true" />
                <Ico.arrow />
              </Link>
            </div>
          ))}
          {soort === 'bevestigd' && <Steun />}
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Beeld: NASA (images.nasa.gov) · De Hemelbrief gaat via MailerLite" />
    </div>
  )
}
