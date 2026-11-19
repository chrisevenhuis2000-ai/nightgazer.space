import type { Metadata } from 'next'
import Link from 'next/link'
import TekstPlaat, { type TekstArtikel } from '@/app/_plate/TekstPlaat'
import { STEUN_URL, STEUN_NAAM, STEUN_AFSCHRIFT } from '@/lib/steun'
import { ogBeeld } from '@/lib/og'

export const metadata: Metadata = {
  title:       'Over de maker',
  description: 'NightGazer wordt gemaakt door Crix, amateur-astronoom en astrofotograaf uit Groningen.',
  alternates:  { canonical: '/over/' },
  openGraph: {
    images:      ogBeeld(),
    title:       'Over de maker — NightGazer',
    description: 'NightGazer wordt gemaakt door Crix, amateur-astronoom en astrofotograaf uit Groningen.',
    url:         '/over/',
  },
}

const A = 'pl-voorw__a'

const ARTIKELEN: TekstArtikel[] = [
  {
    kop: 'Wie maakt dit?',
    tekst: <>
      <p>NightGazer wordt gemaakt door Crix, amateur-astronoom en astrofotograaf uit Groningen.</p>
      <p>
        Mijn sterrenkijken begon in januari 2026, eigenlijk per ongeluk. Ik kocht een telescoop
        voor mijn vriendin, als romantisch cadeau. Al snel stond ik er zelf vaker achter dan zij,
        en zo werd het mijn hobby.
      </p>
      <p>
        Ik kijk en fotografeer met een Explore Scientific Comet Hunter op een iOptron
        CEM25P-montering, met een Canon EOS 6D als camera. Mijn hemel is die van Groningen:
        Bortle 4, vlak bij het Lauwersmeer.
      </p>
    </>,
  },
  {
    kop: 'Waarom NightGazer?',
    tekst: <>
      <p>
        Ik heb mijn hele leven al stiekem naar boven gekeken, maar me nooit echt afgevraagd wat
        erachter zit. Sinds begin 2026 ben ik daar echt naar op zoek, en heb ik meerdere cursussen
        astronomie gevolgd.
      </p>
      <p>
        NightGazer is wat ik zelf had willen vinden toen ik begon: in gewoon Nederlands wat je
        vannacht kunt zien, hoe je het vindt, en het ruimtenieuws dat ertoe doet.
      </p>
    </>,
  },
  {
    kop: 'Hoe het nieuws wordt gemaakt',
    tekst: <>
      <p>
        Het nieuws wordt automatisch verzameld bij bronnen als NASA, ESA en SpaceNews, en met AI
        (Claude van Anthropic) in het Nederlands geschreven. Onder elk artikel staat de bron, met een
        link naar het origineel. Ik lees de nieuwe artikelen elke ochtend bij de koffie.
      </p>
      <ul>
        <li>Een artikel verschijnt alleen als de Nederlandse versie compleet is: echt Nederlands, een vertaalde titel en een volwaardige tekst. Lukt dat niet, dan verschijnt er niets.</li>
        <li>Zie je toch een fout? <Link href="/contact/" className={A}>Laat het weten</Link>.</li>
      </ul>
      <p>
        Elk artikel kun je ook in een eenvoudigere of juist diepere versie lezen. Ook die versies
        worden met AI gemaakt, uit hetzelfde artikel.
      </p>
    </>,
  },
  {
    kop: 'Wat je hier verder vindt',
    tekst: <>
      <ul>
        <li><Link href="/sterrenkijken/" className={A}>Sterrenkijken</Link>: het hemelweer per uur, een oordeel per nacht, donkere plekken in Nederland, ISS-overkomsten, de maan en de kans op noorderlicht.</li>
        <li><Link href="/omhoog/" className={A}>30 nachten omhoog</Link>: tot half december elke avond één ding om te zien.</li>
        <li><Link href="/gidsen/" className={A}>Gidsen</Link>: meteorenzwermen, je eerste telescoop, uitrusting en de cadeaugids.</li>
        <li><Link href="/hemelbrief/" className={A}>De Hemelbrief</Link>: elke vrijdag een korte mail met wat je dat weekend kunt zien.</li>
        <li><Link href="/missies/" className={A}>Missies</Link>: wat er gelanceerd wordt en hoe lopende ruimtemissies ervoor staan.</li>
      </ul>
      <p>
        Zelf gebruik ik de sterrenkijkpagina het meest. Heldere nachten zijn schaars in Nederland,
        en die pagina vertelt me of het vannacht de moeite waard is om de telescoop buiten te zetten.
      </p>
    </>,
  },
  ...(STEUN_URL ? [{
    kop: 'Steun NightGazer',
    tekst: <>
      <p>
        NightGazer is een hobbyproject zonder abonnement of betaalmuur. Vind je het nuttig, dan houdt
        een kleine bijdrage via {STEUN_NAAM} de site gratis voor iedereen.
      </p>
      <p className="pl-voorw__knop">
        <a href={STEUN_URL} target="_blank" rel="noopener" className="pl-btn pl-btn--act"
          aria-label={`NightGazer steunen via ${STEUN_NAAM} (opent in nieuw tabblad)`}>
          Trakteer op een koffie
        </a>
      </p>
      <p className="pl-voorw__klein">{STEUN_AFSCHRIFT}</p>
      <p>
        <strong>Ik zie &lsquo;CRIXIUM&rsquo; op mijn afschrift, klopt dat?</strong> Ja. Crixium is
        het bedrijf van de maker van NightGazer en verwerkt de donaties via Ko-fi en PayPal.
      </p>
    </>,
  }] : []),
  {
    kop: 'Contact',
    tekst: <p>
      Vragen, tips of een fout gezien? Kijk op de <Link href="/contact/" className={A}>contactpagina</Link>.
    </p>,
  },
]

export default function OverPage() {
  return (
    <TekstPlaat
      id="over"
      current="over"
      titel="Over NightGazer"
      sub="Gemaakt in Groningen, onder een donkere hemel"
      artikelen={ARTIKELEN}
    />
  )
}
