'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Je eerste telescoop kiezen — /sterrenkijken/eerste-telescoop

   Een gids in leesmodus. Drie beelden met elk een taak:
   - het vergrotingsdiagram: wat een opening echt aankan, tegen de doos;
   - de zichttabel: wat je per opening ziet, als ephemeris gezet;
   - een optisch schema per soort telescoop.
   Producten en winkellinks komen uit lib/uitrusting.ts; de melding over
   commissie staat in de kop, vóór de eerste link. Geen advertentievak op
   deze pagina: advertenties horen niet naast affiliate-knoppen.
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { Steun } from '../../components/Steun'
import { AffiliateMelding } from '../../components/AffiliateMelding'
import { archivo, FOOTER_COLS, PlateHead, editionLabel, UitrustingVerwijzing } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { Schema } from '../uitrusting/Schema'
import { GROEPEN, WINKEL_NAAM, nasaBeeld, nasaPagina, type Winkel, type Product } from '@/lib/uitrusting'
import {
  KIJKERS, DOELEN, KOLOMMEN, SOORTEN, ADVIEZEN, FOUTEN, GIDS_BEELD, LUCHT_GRENS,
  maxVergroting, grensMagnitude, type Zicht,
} from '@/lib/telescoopgids'

const SCHAAL = 600 // × aan de rechterrand van het diagram
const pct = (x: number) => `${Math.min(100, (x / SCHAAL) * 100)}%`

const PRODUCTEN = GROEPEN.flatMap(g => g.producten)
const product = (naam: string) => PRODUCTEN.find(p => p.naam === naam)

const STAPPEN = [
  { id: 'opening',  titel: 'Opening, niet vergroting', label: 'Waar je op let' },
  { id: 'zicht',    titel: 'Wat je ziet',              label: 'Per opening' },
  { id: 'soorten',  titel: 'Drie soorten',             label: 'Lens of spiegel' },
  { id: 'advies',   titel: 'Welke past bij jou',       label: 'Mijn advies' },
]

const ZICHT_TEKST: Record<Zicht, string> = { 2: 'goed te zien', 1: 'met moeite, op een goede nacht', 0: 'niet te zien' }

function Mark({ z }: { z: Zicht }) {
  return (
    <span className="pl-gzicht" data-z={z} title={ZICHT_TEKST[z]}>
      <i aria-hidden="true" />
      <span className="sr-only">{ZICHT_TEKST[z]}</span>
    </span>
  )
}

function Knoppen({ p }: { p: Product }) {
  const winkels = (Object.keys(p.links) as Winkel[]).filter(w => p.links[w])
  if (!winkels.length) return null
  return (
    <div className="pl-ukaart__winkels">
      {winkels.map(w => (
        <a key={w} href={p.links[w]} className="pl-btn" target="_blank" rel="sponsored noopener"
           aria-label={`${p.naam} bekijken bij ${WINKEL_NAAM[w]} (opent in nieuw tabblad)`}>
          {WINKEL_NAAM[w]}
          <Ico.arrow />
        </a>
      ))}
    </div>
  )
}

/* ── Vergroting: de balk is wat de opening aankan, de stippellijn wat de doos
      belooft. De verticale lijn is de grens van de lucht, niet van de kijker. ── */
function Vergroting() {
  return (
    <div className="pl-plate pl-gverg">
      <div className="pl-edge" aria-hidden="true" />
      <div className="pl-gverg__in">
        <ol className="pl-gverg__rijen" style={{ ['--lucht' as string]: pct(LUCHT_GRENS) }}>
          {KIJKERS.map(k => (
            <li key={k.naam} className="pl-gverg__rij">
              <span className="pl-gverg__naam">
                <span className="pl-gverg__k">{k.kort}</span>
                <span className="pl-label pl-num">{k.opening} mm</span>
              </span>
              <span className="pl-gverg__baan" aria-hidden="true">
                {k.doos && <span className="pl-gverg__doos" style={{ width: pct(k.doos) }} />}
                <span className="pl-gverg__balk" style={{ width: pct(maxVergroting(k.opening)) }} />
              </span>
              <span className="pl-gverg__x pl-num">
                {maxVergroting(k.opening)}×{k.doos ? <span className="pl-gverg__doosx"> · doos {k.doos}×</span> : null}
              </span>
            </li>
          ))}
        </ol>
        <div className="pl-gverg__as pl-num" aria-hidden="true">
          {[0, 100, 200, 300, 400, 500, 600].map(x => <span key={x} style={{ left: pct(x) }}>{x}×</span>)}
        </div>
        <ul className="pl-gverg__legenda">
          <li><i className="pl-gverg__l pl-gverg__l--balk" aria-hidden="true" />Grootste vergroting met scherp beeld: 2× de opening in mm</li>
          <li><i className="pl-gverg__l pl-gverg__l--doos" aria-hidden="true" />Wat er op de doos staat</li>
          <li><i className="pl-gverg__l pl-gverg__l--lucht" aria-hidden="true" />Rond {LUCHT_GRENS}×: daarboven laat de Nederlandse lucht het meestal afweten</li>
        </ul>
      </div>
    </div>
  )
}

export default function EersteTelescoop() {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={STAPPEN.length} edition={editionLabel()} current="gidsen" totalLabel="stappen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        {/* ══ Kop ══ */}
        <section className="pl-wrap" aria-labelledby="pl-gids">
          <div className="pl-uhero">
            <div className="pl-uhero__ground" aria-hidden="true">
              <div className="pl-emulsion"><img src={nasaBeeld(GIDS_BEELD.kop.nasaId, GIDS_BEELD.kop.maat)} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></div>
            </div>
            <div className="pl-uhero__in">
              <h1 id="pl-gids" className="pl-h1">Je eerste telescoop kiezen</h1>
              <p className="pl-uhero__lede">
                Ik begon in januari 2026 met een telescoop die ik eigenlijk als cadeau kocht. Wat ik
                toen had willen weten, staat hier: waar je op let, wat je echt ziet, en welke
                telescoop bij jou past. Twijfel je nog, begin dan met een{' '}
                <Link href="/sterrenkijken/uitrusting/#pl-uitr-verrekijker" className="pl-voorw__a">verrekijker</Link>.
              </p>

              <nav className="pl-ustappen" aria-label="Stappen op deze pagina">
                {STAPPEN.map((s, i) => (
                  <a key={s.id} href={`#pl-gids-${s.id}`} className="pl-ustappen__a">
                    <span className="pl-label pl-label--stamp pl-num">Stap {i + 1}</span>
                    <span className="pl-ustappen__t">{s.titel}</span>
                    <span className="pl-label">{s.label}</span>
                  </a>
                ))}
              </nav>

              <AffiliateMelding />
            </div>
            <p className="pl-uhero__credit">{GIDS_BEELD.kop.titel} · {GIDS_BEELD.kop.credit}</p>
          </div>
        </section>

        {/* ══ 1. Opening ══ */}
        <section id="pl-gids-opening" className="pl-wrap pl-ustap" aria-labelledby="pl-gids-opening-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-gids-opening-t" className="pl-h2">Opening, niet vergroting</h2>
              <span className="pl-label">Waar je op let</span>
            </div>
            <p className="pl-label pl-label--stamp pl-num">Stap 1</p>
          </div>

          <div className="pl-ustap__grid" data-kant="l">
            <figure className="pl-ustap__fig">
              <a href={nasaPagina(GIDS_BEELD.jupiter.nasaId)} target="_blank" rel="noopener" className="pl-ustap__img">
                <div className="pl-emulsion">
                  <img src={nasaBeeld(GIDS_BEELD.jupiter.nasaId)} alt={GIDS_BEELD.jupiter.titel} loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                </div>
              </a>
              <figcaption>
                <span className="pl-label">Wat je ziet</span>
                <span className="pl-ustap__t">{GIDS_BEELD.jupiter.titel}</span>
                <span className="pl-ustap__c">{GIDS_BEELD.jupiter.credit}</span>
              </figcaption>
            </figure>

            <div className="pl-ustap__kolom">
              <p className="pl-ustap__intro">
                Het belangrijkste getal van een telescoop is de opening: de doorsnede van de lens of
                spiegel, in millimeters. Hoe groter de opening, hoe meer licht en hoe meer detail.
              </p>
              <p className="pl-body">
                Vergroting kies je zelf, met het oculair. Maar elke opening heeft een grens: boven
                ongeveer twee keer de opening in millimeters wordt het beeld niet scherper, alleen
                groter en vager. Een 70 mm-kijker met “525×” op de doos haalt in de praktijk zo’n 140×.
              </p>
              <dl className="pl-ukaart__specs pl-gids__mag">
                {KIJKERS.filter(k => k.product).map(k => (
                  <div key={k.naam} className="pl-field">
                    <dt className="pl-label">{k.kort}</dt>
                    <dd className="pl-num">mag. {grensMagnitude(k.opening)}</dd>
                  </div>
                ))}
              </dl>
              <p className="pl-body-s">
                Zwakste ster die je theoretisch nog ziet, onder een donkere hemel. Je blote oog haalt
                ongeveer magnitude 6, dus met 130 mm zie je al zo’n honderd keer zwakkere sterren.
              </p>
            </div>
          </div>

          <Vergroting />
        </section>

        {/* ══ 2. Wat je ziet ══ */}
        <section id="pl-gids-zicht" className="pl-wrap pl-ustap" aria-labelledby="pl-gids-zicht-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-gids-zicht-t" className="pl-h2">Wat je ziet per opening</h2>
              <span className="pl-label">Bortle 4 tot 5, ongeveer</span>
            </div>
            <p className="pl-label pl-label--stamp pl-num">Stap 2</p>
          </div>

          <div className="pl-plate pl-gtabel">
            <div className="pl-gtabel__scroll">
              <table>
                <caption className="sr-only">Wat je ziet met een verrekijker en met telescopen van 130, 152 en 200 mm</caption>
                <thead>
                  <tr>
                    <th scope="col" className="pl-label">Doel</th>
                    {KOLOMMEN.map(k => <th key={k} scope="col" className="pl-label pl-num">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DOELEN.map(d => (
                    <tr key={d.naam}>
                      <th scope="row">
                        <div className="pl-gtabel__doel">
                          <span className="pl-gtabel__n">{d.naam}</span>
                          <span className="pl-gtabel__w">{d.wat}</span>
                        </div>
                      </th>
                      {d.zicht.map((z, i) => <td key={i}><Mark z={z} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="pl-gtabel__legenda">
              <li><Mark z={2} /> Goed te zien</li>
              <li><Mark z={1} /> Met moeite, op een goede nacht</li>
              <li><Mark z={0} /> Niet te zien</li>
            </ul>
            <p className="pl-body-s pl-gtabel__voet">
              Een inschatting, geen belofte: de lucht, de maan en je ervaring maken veel uit. En ook
              met 200 mm zie je nevels in grijs, niet in de kleuren van foto’s.
            </p>
          </div>
        </section>

        {/* ══ 3. Drie soorten ══ */}
        <section id="pl-gids-soorten" className="pl-wrap pl-ustap" aria-labelledby="pl-gids-soorten-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-gids-soorten-t" className="pl-h2">Drie soorten telescopen</h2>
              <span className="pl-label">Lens of spiegel</span>
            </div>
            <p className="pl-label pl-label--stamp pl-num">Stap 3</p>
          </div>

          <ol className="pl-plate pl-gsoort">
            {SOORTEN.map(s => (
              <li key={s.vorm} className="pl-gsoort__rij">
                <Schema vorm={s.vorm} />
                <div className="pl-gsoort__t">
                  <h3 className="pl-h3">{s.naam}</h3>
                  <p className="pl-body">{s.tekst}</p>
                </div>
                <dl className="pl-gsoort__pm">
                  <div><dt className="pl-label">Sterk</dt><dd className="pl-body-s">{s.plus}</dd></div>
                  <div><dt className="pl-label">Let op</dt><dd className="pl-body-s">{s.min}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
          <p className="pl-body pl-gids__noot">
            De montering is de helft van de telescoop. Een goede spiegel op een wiebelig statief is
            een slechte telescoop. Daarom raad ik beginners een Dobson-voet aan: niets dat trilt,
            niets om in te stellen.
          </p>
        </section>

        {/* ══ 4. Advies ══ */}
        <section id="pl-gids-advies" className="pl-wrap pl-ustap" aria-labelledby="pl-gids-advies-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-gids-advies-t" className="pl-h2">Welke past bij jou?</h2>
              <span className="pl-label">Mijn advies</span>
            </div>
            <p className="pl-label pl-label--stamp pl-num">Stap 4</p>
          </div>

          <ul className="pl-ukaarten pl-gadvies">
            {ADVIEZEN.map(a => {
              const p = product(a.product)
              if (!p) return null
              return (
                <li key={a.product} className="pl-ukaart pl-lift">
                  {p.vorm && <Schema vorm={p.vorm} />}
                  <span className="pl-label pl-label--stamp">{a.situatie}</span>
                  <div className="pl-ukaart__kop">
                    <h3 className="pl-h3">{p.naam}</h3>
                    {p.zelf && <span className="pl-ukaart__zelf pl-label pl-label--stamp">Gebruik ik zelf</span>}
                  </div>
                  <p className="pl-body-s">{a.waarom}</p>
                  {p.specs && (
                    <dl className="pl-ukaart__specs">
                      {p.specs.map(s => (
                        <div key={s.label} className="pl-field">
                          <dt className="pl-label">{s.label}</dt>
                          <dd className="pl-num">{s.waarde}</dd>
                        </div>
                      ))}
                      {p.opening && (
                        <div className="pl-field">
                          <dt className="pl-label">Max. vergroting</dt>
                          <dd className="pl-num">{maxVergroting(p.opening)}×</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  <Knoppen p={p} />
                </li>
              )
            })}
          </ul>
          <p className="pl-body pl-gids__noot">
            Zelf kijk en fotografeer ik met de Comet Hunter op een iOptron CEM25P, een montering die
            de draaiing van de aarde volgt. Voor alleen kijken heb je die niet nodig.
          </p>
        </section>

        {/* ══ Fouten ══ */}
        <section className="pl-wrap" aria-labelledby="pl-gids-fouten">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-gids-fouten" className="pl-h2">Vier fouten bij de eerste aankoop</h2>
            </div>
          </div>
          <ol className="pl-voorw__list pl-gfout">
            {FOUTEN.map((f, i) => (
              <li key={f.titel} className="pl-voorw__item">
                <span className="pl-label pl-label--stamp pl-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="pl-h3">{f.titel}</h3>
                  <p className="pl-body">{f.tekst}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pl-wrap pl-gids__slot" aria-label="Verder">
          <UitrustingVerwijzing tekst="Alle aanraders op een rij, van rood lampje en sterrenkaart tot boeken voor bewolkte avonden." />
          <Steun />
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Beelden: NASA (images.nasa.gov)" />
    </div>
  )
}
