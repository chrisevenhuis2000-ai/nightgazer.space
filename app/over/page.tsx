import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/app/components/SiteNav'
import { SiteFooter } from '@/app/components/SiteFooter'

export const metadata: Metadata = {
  title:       'Over de maker',
  description: 'NightGazer wordt gemaakt door Crix, amateur-astronoom en astrofotograaf uit Groningen.',
  alternates:  { canonical: '/over/' },
  openGraph: {
    title:       'Over de maker — NightGazer',
    description: 'NightGazer wordt gemaakt door Crix, amateur-astronoom en astrofotograaf uit Groningen.',
    url:         '/over/',
  },
}

const kaart = { background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' } as const
const kop   = { fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 } as const
const tekst = { fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 } as const
const lijst = { fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.9, paddingLeft: 20 } as const
const link  = { color: '#378ADD' } as const

export default function OverPage() {
  return (
    <>
      <SiteNav />
      <main className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: '#378ADD', textDecoration: 'none' }}>Home</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>Over</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 8 }}>
          Over NightGazer
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 40 }}>
          Gemaakt in Groningen, onder een donkere hemel
        </p>

        <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
          <section style={kaart}>
            <h2 style={kop}>Wie maakt dit?</h2>
            <p style={tekst}>
              NightGazer wordt gemaakt door Crix, amateur-astronoom en astrofotograaf uit Groningen.
            </p>
            <p style={{ ...tekst, marginTop: 12 }}>
              Mijn sterrenkijken begon in januari 2026, eigenlijk per ongeluk. Ik kocht een telescoop
              voor mijn vriendin, als romantisch cadeau. Al snel stond ik er zelf vaker achter dan zij,
              en zo werd het mijn hobby.
            </p>
            <p style={{ ...tekst, marginTop: 12 }}>
              Ik kijk en fotografeer met een Explore Scientific Comet Hunter op een iOptron
              CEM25P-montering, met een Canon EOS 6D als camera. Mijn hemel is die van Groningen:
              Bortle 4, vlak bij het Lauwersmeer.
            </p>
          </section>

          <section style={kaart}>
            <h2 style={kop}>Waarom NightGazer?</h2>
            <p style={tekst}>
              Ik heb mijn hele leven al stiekem naar boven gekeken, maar me nooit echt afgevraagd wat
              erachter zit. Sinds begin 2026 ben ik daar echt naar op zoek, en heb ik meerdere cursussen
              astronomie gevolgd.
            </p>
            <p style={{ ...tekst, marginTop: 12 }}>
              NightGazer is wat ik zelf had willen vinden toen ik begon: ruimtenieuws in het Nederlands,
              uitleg op je eigen niveau, en de tools om te weten of je vannacht iets kunt zien.
            </p>
          </section>

          <section style={kaart}>
            <h2 style={kop}>Hoe het nieuws wordt gemaakt</h2>
            <p style={tekst}>
              Het nieuws op NightGazer wordt automatisch verzameld bij bronnen als NASA, ESA en SpaceNews,
              en met AI in het Nederlands herschreven. Onder elk artikel staat de bron, met een link naar
              het origineel. Ik lees de nieuwe artikelen elke ochtend bij de koffie.
            </p>
            <ul style={{ ...lijst, marginTop: 12 }}>
              <li>Een artikel wordt alleen gepubliceerd als de Nederlandse versie compleet is: echt Nederlands, een vertaalde titel en een volwaardige tekst. Lukt dat niet, dan verschijnt er niets.</li>
              <li>Zie je toch een fout? <Link href="/contact/" style={link}>Laat het weten</Link>.</li>
            </ul>
            <p style={{ ...tekst, marginTop: 12 }}>
              Elk artikel kun je bovendien op drie niveaus lezen, van beginner tot pro. Ook die versies
              worden met AI gemaakt, uit hetzelfde artikel.
            </p>
          </section>

          <section style={kaart}>
            <h2 style={kop}>Eigen tools</h2>
            <p style={tekst}>Naast het nieuws staan er tools op de site die ik zelf heb gebouwd:</p>
            <ul style={{ ...lijst, marginTop: 8 }}>
              <li><Link href="/sterrenkijken/" style={link}>Sterrenkijken</Link>: de komende zeven nachten in één tabel (bewolking, maan, wind) met een oordeel per nacht, plus een kaart met donkere plekken in Nederland en hun Bortle-klasse, ISS-overkomsten, maankalender, noorderlichtkans en een hemelagenda.</li>
              <li><Link href="/missies/" style={link}>Missies</Link>: een lanceermanifest en de status van lopende ruimtemissies, automatisch bijgewerkt.</li>
              <li>Op de <Link href="/" style={link}>homepage</Link>: de actuele positie van de ISS, de astronomiefoto van de dag van NASA en een dagelijkse quiz.</li>
            </ul>
            <p style={{ ...tekst, marginTop: 12 }}>
              Zelf gebruik ik de sterrenkijkgids het meest. Heldere nachten zijn schaars in Nederland,
              en die gids vertelt me of het vannacht de moeite waard is om de telescoop buiten te zetten.
            </p>
          </section>

          <section style={kaart}>
            <h2 style={kop}>Contact</h2>
            <p style={tekst}>
              Vragen, tips of een fout gezien? Kijk op de <Link href="/contact/" style={link}>contactpagina</Link>.
            </p>
          </section>
        </div>

        <div style={{ marginTop: 48 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none' }}>
            ← Terug naar home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
