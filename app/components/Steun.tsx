/* Steunblok: een gewone plaat met een doneerknop. Zonder link in
   lib/steun.ts rendert het niets, zodat er nooit een dode knop staat. */
import { STEUN_URL, STEUN_NAAM } from '@/lib/steun'

export function Steun({ tekst }: { tekst?: string }) {
  if (!STEUN_URL) return null
  return (
    <div className="pl-plate pl-steun">
      <div className="pl-steun__t">
        <h2 className="pl-h3">Steun NightGazer</h2>
        <p className="pl-body-s">
          {tekst ?? 'NightGazer is een hobbyproject zonder abonnement of betaalmuur. Vind je het nuttig, dan houdt een kleine bijdrage de site gratis voor iedereen.'}
        </p>
      </div>
      <a href={STEUN_URL} className="pl-btn" target="_blank" rel="noopener" aria-label={`NightGazer steunen via ${STEUN_NAAM} (opent in nieuw tabblad)`}>
        Steun via {STEUN_NAAM}
      </a>
    </div>
  )
}
