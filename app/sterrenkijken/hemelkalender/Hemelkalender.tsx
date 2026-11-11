'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Hemelkalender — /sterrenkijken/hemelkalender

   Productpagina van de pdf-kalender. Verkoop en download lopen via de
   Ko-fi-shop (lib/hemelkalender.ts); klikken daarheen telt lib/tel.ts als
   uit-klik 'kalender'. De voorbeelden zijn de echte pdf-pagina's, de
   maandbeelden linken naar hun bron op images.nasa.gov.
   ══════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { Ico } from '@/app/_plate/Instruments'
import { nasaBeeld, nasaPagina } from '@/lib/uitrusting'
import {
  KALENDER_URL, KALENDER_PRIJS, KALENDER_JAAR, KALENDER_KOP,
  HOOGTEPUNTEN, INHOUD, VOORBEELDEN, MAANDBEELDEN,
} from '@/lib/hemelkalender'

function Koop({ tekst = `Koop op Ko-fi · ${KALENDER_PRIJS}` }: { tekst?: string }) {
  return (
    <a href={KALENDER_URL} className="pl-cta__primary" target="_blank" rel="noopener"
       aria-label={`Hemelkalender ${KALENDER_JAAR} kopen op Ko-fi voor ${KALENDER_PRIJS} (opent in nieuw tabblad)`}>
      {tekst}
      <Ico.arrow />
    </a>
  )
}

export default function Hemelkalender() {
  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={12} edition={editionLabel()} current="gidsen" totalLabel="platen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        {/* ══ Kop ══ */}
        <section className="pl-wrap" aria-labelledby="pl-hk">
          <div className="pl-uhero pl-hk__kop">
            <div className="pl-uhero__in pl-hk__in">
              <div className="pl-hk__tekst">
                <h1 id="pl-hk" className="pl-h1">Hemelkalender {KALENDER_JAAR}</h1>
                <p className="pl-uhero__lede">
                  Het hele hemeljaar boven Nederland op twaalf platen. Elke nacht de stand van de maan,
                  en per maand de planeten, meteorenzwermen en verduisteringen, met een groot NASA-beeld
                  dat bij die maand hoort. Om op te hangen, of op je tablet mee naar buiten te nemen.
                </p>
                <dl className="pl-hk__spec">
                  <div><dt className="pl-label">Prijs</dt><dd>{KALENDER_PRIJS}</dd></div>
                  <div><dt className="pl-label">Formaat</dt><dd>PDF, A4 staand</dd></div>
                  <div><dt className="pl-label">Omvang</dt><dd>14 pagina’s</dd></div>
                </dl>
                <div className="pl-hk__koop">
                  <Koop />
                  <p className="pl-body-s">Je betaalt bij Ko-fi en downloadt de pdf meteen.</p>
                </div>
              </div>
              <a href={VOORBEELDEN[0].src} className="pl-hk__stapel" target="_blank" rel="noopener" aria-label="Voorblad groot bekijken (opent in nieuw tabblad)">
                <img src={VOORBEELDEN[1].src} alt="" className="pl-hk__stapel-achter" width={900} height={1274} />
                <img src={VOORBEELDEN[0].src} alt={VOORBEELDEN[0].alt} className="pl-hk__stapel-voor" width={900} height={1273} />
              </a>
            </div>
          </div>
        </section>

        {/* ══ Zo ziet hij eruit ══ */}
        <section className="pl-wrap" aria-labelledby="pl-hk-voorbeeld">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-hk-voorbeeld" className="pl-h2">Zo ziet hij eruit</h2>
              <span className="pl-label">Pagina’s uit de pdf</span>
            </div>
          </div>
          <ul className="pl-hk__paginas">
            {VOORBEELDEN.slice(1).map(v => (
              <li key={v.src}>
                <a href={v.src} target="_blank" rel="noopener" className="pl-hk__pagina" aria-label={`${v.alt} (groot bekijken, opent in nieuw tabblad)`}>
                  <img src={v.src} alt={v.alt} loading="lazy" width={900} height={1274} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ══ Inhoud en hoogtepunten ══ */}
        <section className="pl-wrap" aria-labelledby="pl-hk-inhoud">
          <div className="pl-hk__twee">
            <div className="pl-plate pl-hk__blok">
              <h2 id="pl-hk-inhoud" className="pl-h3">Wat erin staat</h2>
              <ul className="pl-hk__lijst">
                {INHOUD.map(r => <li key={r} className="pl-body">{r}</li>)}
              </ul>
              <p className="pl-body-s">
                Alle tijden zijn uitgerekend voor Utrecht; elders in Nederland scheelt het hooguit een paar minuten.
                Het weer rekent de kalender niet mee: welke nacht deze week helder is, zie je op{' '}
                <Link href="/sterrenkijken/" className="pl-voorw__a">Sterrenkijken</Link>.
              </p>
            </div>
            <div className="pl-plate pl-hk__blok">
              <h2 className="pl-h3">Hoogtepunten in {KALENDER_JAAR}</h2>
              <ol className="pl-hk__top">
                {HOOGTEPUNTEN.map(h => (
                  <li key={h.titel}>
                    <span className="pl-label pl-label--stamp pl-num">{h.datum}</span>
                    <span className="pl-hk__top-t">{h.titel}</span>
                    <span className="pl-body-s">{h.noot}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ══ De twaalf beelden ══ */}
        <section className="pl-wrap" aria-labelledby="pl-hk-beelden">
          <div className="pl-band">
            <div className="pl-band__t">
              <h2 id="pl-hk-beelden" className="pl-h2">Twaalf beelden van NASA</h2>
              <span className="pl-label">Elk beeld hoort bij wat er die maand te zien is</span>
            </div>
          </div>
          <ul className="pl-hk__beelden">
            {MAANDBEELDEN.map(b => (
              <li key={b.maand}>
                <a href={nasaPagina(b.nasaId)} target="_blank" rel="noopener" className="pl-hk__beeld"
                   aria-label={`${b.maand}: ${b.titel} (bron: images.nasa.gov, opent in nieuw tabblad)`}>
                  <div className="pl-hk__thumb"><img src={nasaBeeld(b.nasaId, 'small')} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden' }} /></div>
                  <span className="pl-label pl-label--stamp">{b.maand}</span>
                  <span className="pl-hk__beeld-t">{b.titel}</span>
                  <span className="pl-hk__beeld-c">{b.credit}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="pl-body-s pl-hk__voorblad">
            Voorblad: {KALENDER_KOP.titel.charAt(0).toLowerCase() + KALENDER_KOP.titel.slice(1)} ({KALENDER_KOP.credit}).
          </p>
        </section>

        {/* ══ Nog een keer de knop ══ */}
        <section className="pl-wrap" aria-label="Kopen">
          <div className="pl-plate pl-uitr-ref pl-hk__slot">
            <div>
              <span className="pl-label">Printen</span>
              <p className="pl-body">
                Druk hem thuis af of laat hem bij een copyshop op stevig A4 printen. Met je aankoop
                steun je NightGazer, dat ik in mijn vrije tijd maak.
              </p>
            </div>
            <Koop />
          </div>
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Beelden: NASA (images.nasa.gov)" />
    </div>
  )
}
