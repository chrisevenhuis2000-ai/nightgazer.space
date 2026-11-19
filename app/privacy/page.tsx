import type { Metadata } from 'next'
import Link from 'next/link'
import TekstPlaat, { type TekstArtikel } from '@/app/_plate/TekstPlaat'
import { ogBeeld } from '@/lib/og'

const BIJGEWERKT = '19 november 2026'

export const metadata: Metadata = {
  title:       'Privacyverklaring',
  description: 'Welke gegevens NightGazer bewaart en welke niet: geen account, geen eigen cookies, en analytische cookies alleen na je toestemming.',
  alternates:  { canonical: '/privacy/' },
  openGraph: {
    images:      ogBeeld(),
    title:       'Privacyverklaring — NightGazer',
    description: 'Welke gegevens NightGazer bewaart en welke niet.',
    url:         '/privacy/',
  },
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="pl-voorw__a">{children}</a>
)

const ARTIKELEN: TekstArtikel[] = [
  {
    kop: 'Wat we zelf bewaren',
    tekst: <>
      <p>
        Je hebt geen account nodig en we vragen geen naam of adres. In je eigen browser bewaren we
        een paar dingen in <code>localStorage</code>, zoals je quizantwoorden van vandaag en je keuze
        in de cookiemelding. Dat blijft op je apparaat.
      </p>
      <p>
        Onze eigen bezoekersteller telt paginaweergaven en een paar klikken via een eigen
        Cloudflare-server. Daarbij bewaren we alleen de pagina, de site waar je vandaan kwam, het land
        en het soort apparaat. Geen IP-adres, geen cookie en niets waarmee je te herkennen bent.
      </p>
    </>,
  },
  {
    kop: 'De Hemelbrief',
    tekst: <p>
      Meld je je aan voor de wekelijkse mail, dan bewaart MailerLite je e-mailadres en het moment van
      aanmelden. Je staat pas op de lijst nadat je de bevestigingsmail hebt aangeklikt. Elke mail heeft
      een afmeldlink, en afmelden haalt je van de lijst. We gebruiken je adres alleen voor de
      Hemelbrief. Zie het <A href="https://www.mailerlite.com/legal/privacy-policy">privacybeleid van MailerLite</A>.
    </p>,
  },
  {
    kop: 'Meldingen',
    tekst: <p>
      Zet je op <Link href="/sterrenkijken/" className="pl-voorw__a">Sterrenkijken</Link> meldingen aan,
      dan bewaren we het adres dat je browser daarvoor aanmaakt, de meldingen die je koos en je plaats,
      afgerond, voor het weer en de ISS. Zet je de meldingen uit, dan wissen we dat meteen. Meldingen
      lopen via de meldingsdienst van je browser (Google, Apple of Mozilla).
    </p>,
  },
  {
    kop: 'Statistieken',
    tekst: <ul>
      <li>
        <strong>Google Analytics (GA4)</strong> plaatst pas cookies als je in de melding onderaan op
        Accepteren klikt. Zonder toestemming stuurt het alleen cookieloze, geanonimiseerde signalen
        (Consent Mode).
      </li>
      <li>
        <strong>Cloudflare Web Analytics</strong> telt bezoeken zonder cookies en zonder
        persoonsgegevens. Zie het <A href="https://www.cloudflare.com/privacypolicy/">privacybeleid van Cloudflare</A>.
      </li>
    </ul>,
  },
  {
    kop: 'Advertenties',
    tekst: <p>
      Er staan nu geen advertenties op de site. We hebben Google AdSense aangevraagd, en daarvoor laadt
      de code van Google al wel mee, met advertentiecookies uit. Gaan de advertenties aan, dan vragen
      we eerst je toestemming via het toestemmingsvenster van Google en passen we deze verklaring aan.
      Zie <A href="https://policies.google.com/technologies/partner-sites">hoe Google gegevens gebruikt</A>.
    </p>,
  },
  {
    kop: 'Winkellinks',
    tekst: <p>
      De links naar Astroshop en Amazon.nl op Uitrusting, Eerste telescoop en de cadeaugids zijn
      affiliate-links. Wij plaatsen daarvoor geen cookies. Klik je erop, dan kan de winkel op zijn
      eigen site cookies plaatsen om je aankoop aan NightGazer toe te schrijven.
    </p>,
  },
  {
    kop: 'Andere diensten',
    tekst: <ul>
      <li><strong>NASA</strong>, <strong>ESA</strong> en <strong>Pexels</strong> leveren beelden, via onze eigen server.</li>
      <li><strong>Open-Meteo</strong> levert het hemelweer per uur; je browser vraagt dat rechtstreeks op, met je plaats afgerond.</li>
      <li><strong>CelesTrak</strong> levert de baangegevens van de ISS; je browser rekent daarmee zelf de overkomsten uit.</li>
      <li><strong>Cloudflare</strong> host de site. Zoals elke host houdt het korte tijd serverlogboeken bij.</li>
    </ul>,
  },
  {
    kop: 'Cookies',
    tekst: <p>
      De site zelf plaatst geen cookies. Alleen Google Analytics doet dat, en alleen na je ja. Je kunt
      je keuze altijd wijzigen via &lsquo;Cookie-instellingen&rsquo; onderaan elke pagina.
    </p>,
  },
  {
    kop: 'Vragen',
    tekst: <p>
      Vragen over je gegevens, of wil je dat we iets wissen? Mail naar{' '}
      <a href="mailto:contact@nightgazer.space" className="pl-voorw__a">contact@nightgazer.space</a>.
    </p>,
  },
]

export default function PrivacyPage() {
  return (
    <TekstPlaat
      id="privacy"
      current="privacy"
      titel="Privacyverklaring"
      sub={<>Laatst bijgewerkt <span className="pl-num">{BIJGEWERKT}</span></>}
      intro={<p>
        Kort gezegd: je hebt geen account nodig, de site plaatst zelf geen cookies, en Google Analytics
        alleen als je daar ja op zegt. Hieronder staat precies wat er wordt bewaard en door wie.
      </p>}
      artikelen={ARTIKELEN}
    />
  )
}
