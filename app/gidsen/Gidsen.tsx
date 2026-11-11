'use client'

/* ══════════════════════════════════════════════════════════════════════════
   /gidsen: alle gidspagina's op één plek. De oudere gidsen houden hun adres
   onder /sterrenkijken, zodat bestaande links blijven werken; de zwermgidsen
   (Leoniden, Geminiden) staan onder /gidsen zelf.

   Opbouw: een kop met een NASA-plaat en drie "waar begin je?"-sprongen, dan
   de gidsen als platen met elk het beeld van hun eigen onderwerp. De
   aantallen op de platen komen uit de gidsen zelf (lib/), zodat ze kloppen
   als een gids groeit. Eén beweging: de platen ontwikkelen zich als ze in
   beeld komen (het beeld trekt van iets te groot en te donker naar scherp),
   niet bij voorkeur voor minder beweging.
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { nasaBeeld, nasaPagina, GROEPEN, type NasaMaat } from '@/lib/uitrusting'
import { SOORTEN } from '@/lib/telescoopgids'
import { KLASSEN } from '@/lib/cadeaugids'
import { KALENDER_PRIJS, KALENDER_JAAR, VOORBEELDEN } from '@/lib/hemelkalender'
import { ZWERMGIDSEN } from '@/lib/zwermgids'

type Plaat = { nasaId: string; maat?: NasaMaat; titel: string; credit: string; pos?: string }
type Gids = {
  href: string; soort: string; kop: string; tekst: string; meta: string; actie: string
  beeld?: Plaat
}

const AANRADERS = GROEPEN.reduce((n, g) => n + g.producten.length, 0)
const CADEAUS = KLASSEN.reduce((n, k) => n + k.cadeaus.length, 0)

const KOP: Plaat = {
  nasaId: 'NHQ202108110005', titel: 'De Melkweg met een Perseïde, Spruce Knob, augustus 2021', credit: 'NASA/Bill Ingalls',
}

const GIDSEN: Gids[] = [
  {
    href: '/sterrenkijken/eerste-telescoop/', soort: 'Telescoopgids', kop: 'Je eerste telescoop kiezen',
    tekst: 'Waar je op let, wat je echt ziet met 130, 152 of 200 mm, en welke kijker bij jou past.',
    meta: `${SOORTEN.length} soorten telescopen vergeleken`, actie: 'Lees de gids',
    beeld: { nasaId: 'PIA04227', maat: 'orig', titel: 'De Orionnevel door Hubble', credit: 'NASA en het Hubble Heritage Team (STScI/AURA)', pos: '50% 45%' },
  },
  {
    href: '/sterrenkijken/cadeaugids/', soort: 'Cadeaugids', kop: 'Een cadeau voor iemand die naar boven kijkt',
    tekst: 'Per prijsklasse, voor wie het past. Je hoeft zelf niets van telescopen te weten.',
    meta: `${KLASSEN.length} prijsklassen, ${CADEAUS} cadeaus`, actie: 'Lees de gids',
    beeld: { nasaId: 'PIA03162', titel: 'Saturnus door Hubble', credit: 'NASA en het Hubble Heritage Team (STScI/AURA)', pos: '50% 55%' },
  },
  {
    href: '/sterrenkijken/uitrusting/', soort: 'Uitrusting', kop: 'Wat heb je nodig om meer te zien?',
    tekst: 'Van rood lampje en sterrenkaart tot boeken voor bewolkte avonden, stap voor stap.',
    meta: `${GROEPEN.length} stappen, ${AANRADERS} aanraders`, actie: 'Lees de gids',
    beeld: { nasaId: 'GSFC_20171208_Archive_e001864', titel: 'Een wassende maansikkel, uit LRO-data', credit: 'NASA/Goddard Scientific Visualization Studio', pos: '50% 50%' },
  },
  {
    href: '/sterrenkijken/hemelkalender/', soort: `Hemelkalender ${KALENDER_JAAR}`, kop: 'Het hele hemeljaar aan de muur',
    tekst: 'Elke nacht de maan, per maand de planeten, meteorenzwermen en verduisteringen. Pdf om zelf te printen.',
    meta: `12 platen, ${KALENDER_PRIJS}`, actie: 'Bekijk de kalender',
  },
]

/* De zwermgidsen staan apart, bovenaan: ze horen bij een datum. */
const ZWERMEN: Gids[] = Object.values(ZWERMGIDSEN).map(z => ({
  href: `/gidsen/${z.slug}/`, soort: 'Meteorenzwerm', kop: z.kop,
  tekst: z.kaart,
  meta: `${z.specs.find(s => s.label === 'Per uur')?.waarde} per uur`, actie: 'Hoe laat kijken?',
  beeld: { nasaId: z.beeld.nasaId, titel: z.beeld.titel.replace(/^Een meteoor.*?,\s*/, 'Een meteoor, '), credit: z.beeld.credit, pos: '50% 40%' },
}))

const SPRONGEN = [
  { vraag: 'Ik wil een telescoop kopen', href: '/sterrenkijken/eerste-telescoop/' },
  { vraag: 'Ik zoek een cadeau', href: '/sterrenkijken/cadeaugids/' },
  { vraag: 'Ik wil vanavond al naar buiten', href: '/sterrenkijken/uitrusting/' },
]

/* Zet data-zicht="ja" op elke plaat zodra hij in beeld komt; de CSS doet de
   rest. Zonder IntersectionObserver of bij minder beweging: meteen zichtbaar. */
function useOntwikkel() {
  const ref = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const lijst = ref.current
    if (!lijst) return
    const items = [...lijst.querySelectorAll<HTMLElement>('[data-zicht]')]
    const stil = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (stil || typeof IntersectionObserver === 'undefined') { items.forEach(i => { i.dataset.zicht = 'ja' }); return }
    lijst.dataset.anim = 'aan'
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { (e.target as HTMLElement).dataset.zicht = 'ja'; io.unobserve(e.target) }
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.15 })
    items.forEach(i => io.observe(i))
    return () => io.disconnect()
  }, [])
  return ref
}

function Beeld({ g }: { g: Gids }) {
  if (!g.beeld) {
    return (
      <div className="pl-gx__beeld pl-gx__beeld--kalender" aria-hidden="true">
        <img src={VOORBEELDEN[1].src} alt="" className="pl-gx__blad pl-gx__blad--achter" loading="lazy" />
        <img src={VOORBEELDEN[0].src} alt="" className="pl-gx__blad pl-gx__blad--voor" loading="lazy" />
      </div>
    )
  }
  return (
    <div className="pl-gx__beeld" aria-hidden="true">
      <img src={nasaBeeld(g.beeld.nasaId, g.beeld.maat)} alt="" loading="lazy" style={{ objectPosition: g.beeld.pos }}
           onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
    </div>
  )
}

function Plaat({ g, i, groot }: { g: Gids; i: number; groot?: boolean }) {
  return (
    <li className={`pl-gx__item${groot ? ' pl-gx__item--groot' : ''}`} data-zicht="nee" style={{ ['--i' as string]: i }}>
      <Link href={g.href} className="pl-gx__a">
        <Beeld g={g} />
        <div className="pl-gx__tekst">
          <span className="pl-label pl-label--stamp">{g.soort}</span>
          <h3 className="pl-gx__kop">{g.kop}</h3>
          <p className="pl-body-s">{g.tekst}</p>
          <div className="pl-gx__voet">
            <span className="pl-gx__meta">{g.meta}</span>
            <span className="pl-read">
              <span>{g.actie}</span>
              <span className="pl-read__rule" aria-hidden="true" />
              <Ico.arrow />
            </span>
          </div>
        </div>
      </Link>
    </li>
  )
}

export default function Gidsen() {
  const lijst = useOntwikkel()
  const zwermLijst = useOntwikkel()
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={GIDSEN.length + ZWERMEN.length} edition={editionLabel()} current="gidsen" totalLabel="gidsen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        {/* ══ Kop ══ */}
        <section className="pl-wrap" aria-labelledby="pl-gidsen-kop">
          <div className="pl-uhero">
            <div className="pl-uhero__ground" aria-hidden="true">
              <div className="pl-emulsion"><img src={nasaBeeld(KOP.nasaId)} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></div>
            </div>
            <div className="pl-uhero__in pl-gx__kopin">
              <h1 id="pl-gidsen-kop" className="pl-h1">Gidsen voor sterrenkijkers</h1>
              <p className="pl-uhero__lede">
                Alles wat ik zelf had willen weten toen ik begon: welke telescoop, wat je erbij nodig hebt,
                wat je een sterrenkijker kunt geven, en wat er dit jaar aan de hemel gebeurt.
              </p>
              <nav className="pl-ustappen pl-gx__sprong" aria-label="Waar wil je beginnen?">
                {SPRONGEN.map(s => (
                  <Link key={s.href} href={s.href} className="pl-ustappen__a">
                    <span className="pl-ustappen__t">{s.vraag}</span>
                    <span className="pl-gx__pijl" aria-hidden="true"><Ico.arrow /></span>
                  </Link>
                ))}
              </nav>
            </div>
            <p className="pl-uhero__credit">{KOP.titel} · {KOP.credit}</p>
          </div>
        </section>

        {/* ══ Binnenkort aan de hemel ══ */}
        <section className="pl-wrap" aria-labelledby="pl-gidsen-zwermen">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-gidsen-zwermen" className="pl-h2">Vallende sterren dit najaar</h2>
              <span className="pl-label">Wanneer en hoe laat je kijkt</span>
            </div>
          </div>
          <ul className="pl-gx pl-gx--twee" ref={zwermLijst}>
            {ZWERMEN.map((g, i) => <Plaat key={g.href} g={g} i={i} />)}
          </ul>
        </section>

        {/* ══ De gidsen ══ */}
        <section className="pl-wrap" aria-labelledby="pl-gidsen-lijst">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-gidsen-lijst" className="pl-h2">Alle gidsen</h2>
              <span className="pl-label">Gratis te lezen, de kalender is een pdf</span>
            </div>
          </div>
          <ul className="pl-gx" ref={lijst}>
            {GIDSEN.map((g, i) => <Plaat key={g.href} g={g} i={i} groot={i === 0} />)}
          </ul>
          <p className="pl-gx__bron">
            Beelden:{' '}
            {[...ZWERMEN, ...GIDSEN].filter(g => g.beeld).map((g, i, a) => (
              <span key={g.href}>
                <a href={nasaPagina(g.beeld!.nasaId)} target="_blank" rel="noopener" className="pl-voorw__a">{g.beeld!.titel}</a>
                {' '}({g.beeld!.credit}){i < a.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>
        </section>

        {/* ══ Daarna ══ */}
        <section className="pl-wrap" aria-label="Naar buiten">
          <div className="pl-plate pl-uitr-ref">
            <div>
              <span className="pl-label">Vannacht</span>
              <p className="pl-body">Gelezen wat je nodig hebt? Kijk welke nacht deze week helder is en wat er dan te zien valt.</p>
            </div>
            <Link href="/sterrenkijken/" className="pl-read">
              <span>Naar Sterrenkijken</span>
              <span className="pl-read__rule" aria-hidden="true" />
              <Ico.arrow />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Beelden: NASA (images.nasa.gov)" />
    </div>
  )
}
