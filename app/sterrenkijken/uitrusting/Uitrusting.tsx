'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Uitrusting — /sterrenkijken/uitrusting

   Aanraders met affiliate-links naar Bol en Amazon.nl. De producten, links
   en beelden staan in lib/uitrusting.ts. Eerlijkheid eerst: de melding over
   commissie staat in de kop, vóór het eerste product, en elke winkellink is
   rel="sponsored".

   Drie soorten beeld, elk met een eigen taak:
   - een NASA-plaat per stap: wat je met die stap aan de hemel ziet;
   - het lichtvangst-diagram: de openingen op schaal, tegen je pupil;
   - een optisch schema per kijker: waar het licht naartoe gaat.
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import {
  GROEPEN, WINKEL_NAAM, KOPBEELD, OOG_MM, nasaBeeld, nasaPagina, lichtvangst,
  type Winkel, type Vorm, type Product,
} from '@/lib/uitrusting'

const TOTAAL = GROEPEN.reduce((n, g) => n + g.producten.length, 0)

const productId = (p: Product) =>
  'p-' + p.naam.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/* ── Optische schema's: geometrie, geen tekening. Romp in stempelblauw,
      licht in baanblauw; nooit het live-blauw, want niets hier verandert. ── */
function Schema({ vorm }: { vorm: Vorm }) {
  const romp = { fill: 'none', stroke: 'var(--pl-stamp)', strokeWidth: 1.2, vectorEffect: 'non-scaling-stroke' as const }
  const licht = { fill: 'none', stroke: 'var(--pl-orbit)', strokeWidth: 1.4, vectorEffect: 'non-scaling-stroke' as const }
  const naam = { porro: 'Verrekijker met porroprisma', newton: 'Newton-spiegeltelescoop', maknewt: 'Maksutov-Newton' }[vorm]

  if (vorm === 'porro') {
    return (
      <svg viewBox="0 0 240 64" className="pl-uitr__schema" role="img" aria-label={`Schema: ${naam}. Licht gaat door de objectieflens, wordt door twee prisma's teruggekaatst en komt bij het oculair uit.`}>
        {/* objectief */}
        <path d="M30 10 Q38 32 30 54 Q22 32 30 10 Z" {...romp} />
        {/* twee prisma's, verspringend */}
        <rect x="112" y="22" width="26" height="26" {...romp} />
        <rect x="146" y="14" width="26" height="26" {...romp} />
        {/* oculair */}
        <rect x="206" y="20" width="14" height="14" {...romp} />
        {/* licht */}
        <polyline points="0,16 30,16 125,35" {...licht} />
        <polyline points="0,48 30,48 125,35" {...licht} />
        <polyline points="125,35 159,35 159,27 213,27" {...licht} strokeDasharray="3 3" />
        <line x1="213" y1="27" x2="240" y2="27" {...licht} />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 240 64" className="pl-uitr__schema" role="img" aria-label={`Schema: ${naam}. Licht valt de buis in, de holle spiegel achterin kaatst het terug naar een vlak spiegeltje dat het naar het oculair aan de zijkant stuurt.`}>
      {/* buis */}
      <rect x="10" y="12" width="214" height="40" {...romp} />
      {/* corrector voor de Maksutov-Newton */}
      {vorm === 'maknewt' && <path d="M16 12 Q22 32 16 52 M22 12 Q28 32 22 52" {...romp} />}
      {/* hoofdspiegel, hol */}
      <path d="M220 14 Q212 32 220 50" {...romp} strokeWidth={2} />
      {/* vangspiegel onder 45° en het oculair aan de zijkant */}
      <line x1="54" y1="38" x2="66" y2="26" {...romp} strokeWidth={2} />
      <rect x="54" y="0" width="12" height="12" {...romp} />
      {/* licht */}
      <polyline points="0,20 216,20 60,32" {...licht} />
      <polyline points="0,44 216,44 60,32" {...licht} />
      <line x1="60" y1="32" x2="60" y2="0" {...licht} />
    </svg>
  )
}

/* ── Lichtvangst: elke opening op schaal naast je pupil. Een cirkel is een
      meting hier, geen versiering: de oppervlakte is wat de kijker vangt. ── */
function Lichtvangst() {
  const kijkers = GROEPEN.flatMap(g => g.producten).filter(p => p.opening)
    .sort((a, b) => (a.opening ?? 0) - (b.opening ?? 0))
  return (
    <div className="pl-plate pl-licht">
      <div className="pl-edge" aria-hidden="true" />
      <ol className="pl-licht__rij">
        <li className="pl-licht__item">
          <span className="pl-licht__cirkel pl-licht__cirkel--oog" style={{ ['--mm' as string]: OOG_MM }} aria-hidden="true" />
          <span className="pl-licht__naam">Je oog</span>
          <span className="pl-licht__x pl-num">{OOG_MM} mm · ×1</span>
        </li>
        {kijkers.map(p => (
          <li key={p.naam} className="pl-licht__item">
            <a href={`#${productId(p)}`} className="pl-licht__a">
              <span className="pl-licht__cirkel" style={{ ['--mm' as string]: p.opening }} aria-hidden="true" />
              <span className="pl-licht__naam">{p.kort}</span>
              <span className="pl-licht__x pl-num">{p.opening} mm · ×{lichtvangst(p.opening!)}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="pl-body-s pl-licht__voet">
        Openingen op schaal. Het getal is hoeveel keer meer licht de kijker vangt dan je pupil
        van {OOG_MM} mm in het donker: de oppervlakte van de opening gedeeld door die van je pupil.
        Daarom zie je door een telescoop sterrenstelsels die voor je ogen onzichtbaar zijn.
      </p>
    </div>
  )
}

export default function Uitrusting() {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={TOTAAL} edition={editionLabel()} current="sterrenkijken" totalLabel="aanraders" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        {/* ══ Kop ══ */}
        <section className="pl-wrap" aria-labelledby="pl-uitr">
          <div className="pl-uhero">
            <div className="pl-uhero__ground" aria-hidden="true">
              <div className="pl-emulsion"><img src={nasaBeeld(KOPBEELD.nasaId)} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></div>
            </div>
            <div className="pl-uhero__in">
              <h1 id="pl-uitr" className="pl-h1">Wat heb je nodig om meer te zien?</h1>
              <p className="pl-uhero__lede">
                Niets, om te beginnen: op een heldere avond zie je met het blote oog al planeten,
                sterrenbeelden en de ISS. Wil je verder, dan is dit wat ik zou aanraden, in de
                volgorde waarin je het nodig hebt. Kijk op{' '}
                <Link href="/sterrenkijken/" className="pl-voorw__a">Sterrenkijken</Link> welke
                nacht deze week het best is.
              </p>

              <nav className="pl-ustappen" aria-label="Stappen op deze pagina">
                {GROEPEN.map((g, i) => (
                  <a key={g.id} href={`#pl-uitr-${g.id}`} className="pl-ustappen__a">
                    <span className="pl-label pl-label--stamp pl-num">Stap {i + 1}</span>
                    <span className="pl-ustappen__t">{g.titel}</span>
                    <span className="pl-label">{g.label}</span>
                  </a>
                ))}
              </nav>

              <p className="pl-uhero__melding">
                <span className="pl-label pl-label--stamp">Over deze links</span>
                <span>
                  Koop je iets via een knop op deze pagina, dan krijgt NightGazer een kleine
                  commissie van de winkel. Jij betaalt niets extra.
                </span>
              </p>
            </div>
            <p className="pl-uhero__credit">{KOPBEELD.titel} · {KOPBEELD.credit}</p>
          </div>
        </section>

        {/* ══ Lichtvangst ══ */}
        <section className="pl-wrap" aria-labelledby="pl-uitr-licht">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-uitr-licht" className="pl-h2">Waarom een grotere opening meer laat zien</h2>
              <span className="pl-label">Op schaal</span>
            </div>
          </div>
          <Lichtvangst />
        </section>

        {/* ══ De stappen ══ */}
        {GROEPEN.map((g, gi) => (
          <section key={g.id} id={`pl-uitr-${g.id}`} className="pl-wrap pl-ustap" aria-labelledby={`pl-uitr-${g.id}-t`}>
            <div className="pl-band">
              <div className="pl-band__t">
                <h2 id={`pl-uitr-${g.id}-t`} className="pl-h2">{g.titel}</h2>
                <span className="pl-label">{g.label}</span>
              </div>
              <p className="pl-label pl-label--stamp pl-num">Stap {gi + 1}</p>
            </div>

            <div className="pl-ustap__grid" data-kant={gi % 2 ? 'r' : 'l'}>
              <figure className="pl-ustap__fig">
                <a href={nasaPagina(g.beeld.nasaId)} target="_blank" rel="noopener" className="pl-ustap__img">
                  <div className="pl-emulsion">
                    <img src={nasaBeeld(g.beeld.nasaId)} alt={g.beeld.titel} loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                  </div>
                </a>
                <figcaption>
                  <span className="pl-label">Wat je ziet</span>
                  <span className="pl-ustap__t">{g.beeld.titel}</span>
                  <span className="pl-ustap__c">{g.beeld.credit}</span>
                </figcaption>
              </figure>

              <div className="pl-ustap__kolom">
                <p className="pl-ustap__intro">{g.intro}</p>
                <ul className="pl-ukaarten">
                  {g.producten.map(p => {
                    const winkels = (Object.keys(p.links) as Winkel[]).filter(w => p.links[w])
                    return (
                      <li key={p.naam} id={productId(p)} className="pl-ukaart pl-lift">
                        {p.vorm && <Schema vorm={p.vorm} />}
                        <div className="pl-ukaart__kop">
                          <h3 className="pl-h3">{p.naam}</h3>
                          {p.zelf && <span className="pl-ukaart__zelf pl-label pl-label--stamp">Gebruik ik zelf</span>}
                        </div>
                        <p className="pl-body-s">{p.waarom}</p>
                        {(p.specs || p.opening) && (
                          <dl className="pl-ukaart__specs">
                            {p.specs?.map(s => (
                              <div key={s.label} className="pl-field">
                                <dt className="pl-label">{s.label}</dt>
                                <dd className="pl-num">{s.waarde}</dd>
                              </div>
                            ))}
                            {p.opening && (
                              <div className="pl-field">
                                <dt className="pl-label">Lichtvangst</dt>
                                <dd className="pl-num">×{lichtvangst(p.opening)}</dd>
                              </div>
                            )}
                          </dl>
                        )}
                        {winkels.length > 0 && (
                          <div className="pl-ukaart__winkels">
                            {winkels.map(w => (
                              <a
                                key={w}
                                href={p.links[w]}
                                className="pl-btn"
                                target="_blank"
                                rel="sponsored noopener"
                                aria-label={`${p.naam} bekijken bij ${WINKEL_NAAM[w]} (opent in nieuw tabblad)`}
                              >
                                {WINKEL_NAAM[w]}
                                <Ico.arrow />
                              </a>
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Beelden: NASA (images.nasa.gov)" />
    </div>
  )
}
