'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Vandaag op Instagram — /vandaag

   De bio-link van @nightgazer.space wijst hierheen. Wie na een carrousel op
   de link tikt, moet in één oogopslag zien dat hij goed zit: dezelfde hook
   als de cover, dezelfde foto, en één knop naar het artikel met het
   antwoord. Daaronder de posts van de vorige dagen, voor wie een oudere
   carrousel zag.

   Welke carrousel "vandaag" is, hangt af van het tijdstip: de pagina wordt
   bij de build gemaakt, maar de browser kiest opnieuw zodra hij laadt, zodat
   een post die om 12:00 live gaat ook om 12:00 bovenaan staat.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { Steun } from '../components/Steun'
import { MeldingenTeaser } from '../components/MeldingenTeaser'
import { SpellenBlok } from '@/app/_plate/SpellenBlok'
import { Cadeautijd } from '@/app/_plate/Cadeautijd'
import { OmhoogBlok } from '@/app/_plate/OmhoogBlok'
import { archivo, FOOTER_COLS, PlateHead, editionLabel, img } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { artikelLink, nuInNederland, uitArchief, zichtbaar, type DagmapItem } from '@/lib/dagmap'

const INSTAGRAM = 'https://www.instagram.com/nightgazer.space/'
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

function datumTekst(d?: string) {
  if (!d) return ''
  const [y, m, dag] = d.split('-').map(Number)
  if (!y || !m || !dag) return ''
  return `${dag} ${MAANDEN[m - 1]}`
}

interface Kaart { slug: string; title: string; excerpt: string; imageUrl?: string; datum?: string; hook?: string; vraag?: string; gepubliceerd?: string }

/** "Uit ons archief · 7 mei": zo ziet niemand een ouder artikel aan voor nieuws van vandaag. */
const archiefTekst = (k: Kaart) => `Uit ons archief · ${datumTekst(k.gepubliceerd)}`

export default function Vandaag({ items, nieuwste, gebouwd }: {
  items: DagmapItem[]
  nieuwste: Kaart[]
  gebouwd: string
}) {
  const [nu, setNu] = useState(gebouwd)
  useEffect(() => { setNu(nuInNederland()) }, [])

  const live = zichtbaar(items, nu)
  const opPost = live.length > 0
  const lijst: Kaart[] = opPost ? live : nieuwste
  const [top, ...rest] = lijst

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={lijst.length} edition={editionLabel()} current="nieuws" totalLabel={opPost ? 'posts' : 'artikelen'} />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        {top && (
          <section className="pl-wrap" aria-labelledby="pl-vdg-kop">
            <div className="pl-uhero pl-vdg">
              {top.imageUrl && (
                <div className="pl-uhero__ground" aria-hidden="true">
                  <div className="pl-emulsion"><img src={img(top.imageUrl, 1600)} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></div>
                </div>
              )}
              <div className="pl-uhero__in">
                <span className="pl-label pl-label--stamp">
                  {opPost ? `Vandaag op Instagram · ${datumTekst(top.datum)}` : 'Het nieuwste artikel'}
                </span>
                <h1 id="pl-vdg-kop" className="pl-h1 pl-vdg__hook">{top.hook || top.title}</h1>
                {opPost && uitArchief(top) && <span className="pl-label">{archiefTekst(top)}</span>}
                {top.vraag && <p className="pl-vdg__vraag">{top.vraag}</p>}
                <p className="pl-uhero__lede">{top.excerpt}</p>
                <div className="pl-vdg__actie">
                  <Link href={artikelLink(top)} className="pl-btn pl-btn--act">
                    {opPost ? 'Lees het antwoord' : 'Lees het artikel'}
                    <Ico.arrow />
                  </Link>
                  {opPost && <span className="pl-vdg__titel">{top.title}</span>}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="pl-wrap">
          <OmhoogBlok />
        </div>

        <div className="pl-wrap">
          <Cadeautijd />
        </div>

        {rest.length > 0 && (
          <section className="pl-wrap" aria-labelledby="pl-vdg-eerder">
            <div className="pl-band">
              <div className="pl-band__t">
                <h2 id="pl-vdg-eerder" className="pl-h2">{opPost ? 'Eerdere posts' : 'Meer nieuws'}</h2>
              </div>
            </div>
            <ol className="pl-vdg__lijst">
              {rest.slice(0, 6).map(k => (
                <li key={`${k.datum}-${k.slug}`}>
                  <Link href={opPost ? artikelLink(k) : `/nieuws/${k.slug}/`} className="pl-vdg__rij">
                    <span className="pl-vdg__fig" aria-hidden="true">
                      {k.imageUrl && <span className="pl-emulsion pl-emulsion--sm"><img src={img(k.imageUrl, 320)} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></span>}
                    </span>
                    <span className="pl-vdg__tekst">
                      <span className="pl-label pl-num">{datumTekst(k.datum)}{opPost && uitArchief(k) ? ' · uit ons archief' : ''}</span>
                      <span className="pl-vdg__t">{k.hook || k.title}</span>
                      {k.hook && <span className="pl-body-s">{k.title}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="pl-wrap" aria-label="Spellen van de dag">
          <SpellenBlok />
        </section>

        <section className="pl-wrap" aria-label="Meldingen">
          <MeldingenTeaser />
        </section>

        <section className="pl-wrap" aria-label="Steun NightGazer">
          <Steun tekst="Ik maak deze dagelijkse nieuwsmap alleen, in mijn vrije tijd. Vind je hem nuttig? Een koffie helpt echt." />
        </section>

        <section className="pl-wrap" aria-label="Instagram">
          <div className="pl-vdg__volg">
            <p className="pl-body">Elke dag om 12:00 het ruimtenieuws in tien beelden.</p>
            <a href={INSTAGRAM} className="pl-btn" target="_blank" rel="noopener">
              Volg @nightgazer.space
              <Ico.arrow />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} />
    </div>
  )
}
