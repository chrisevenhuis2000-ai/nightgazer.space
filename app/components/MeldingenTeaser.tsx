'use client'

/* Meldingen-blokje voor /vandaag en de voorpagina.

   Het echte meldingsblok staat op /sterrenkijken, halverwege een lange
   pagina; daar komt bijna niemand. Wie via Instagram binnenkomt landt op
   /vandaag. Dit blokje wijst de weg, in dezelfde vorm als het steunblok. */
import Link from 'next/link'
import { telGebeurtenis } from '@/lib/tel'

export function MeldingenTeaser({ tekst }: { tekst?: string }) {
  return (
    <div className="pl-plate pl-steun">
      <div className="pl-steun__t">
        <h2 className="pl-h3">Krijg een seintje als er iets te zien is</h2>
        <p className="pl-body-s">
          {tekst ?? 'Noorderlicht, een heldere nacht of de ISS boven jouw plek: een melding op je telefoon, ook als de site dicht is. Gratis, zonder account.'}
        </p>
      </div>
      <Link
        href="/sterrenkijken/#pl-meld"
        className="pl-btn pl-btn--act"
        onClick={() => telGebeurtenis('push-teaser', typeof location !== 'undefined' ? location.pathname : '')}
      >
        Zet meldingen aan
      </Link>
    </div>
  )
}
