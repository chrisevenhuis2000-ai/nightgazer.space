import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { SiteNav } from '@/app/components/SiteNav'
import { SiteFooter } from '@/app/components/SiteFooter'

export const metadata: Metadata = {
  title:       'Over de maker',
  description: 'Wie maakt NightGazer, waarom de site bestaat en hoe het nieuws tot stand komt: AI-ondersteund, met bronvermelding bij elk artikel.',
  alternates:  { canonical: '/over/' },
  openGraph: {
    title:       'Over de maker — NightGazer',
    description: 'Wie maakt NightGazer, waarom de site bestaat en hoe het nieuws tot stand komt.',
    url:         '/over/',
  },
}

/* Plekken die Crix zelf moet invullen. Bewust opvallend geel, zodat de pagina
   niet per ongeluk live gaat met een open plek erin. */
function InTeVullen({ children }: { children: ReactNode }) {
  return (
    <mark style={{ background: '#3a3205', color: '#ffd84a', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: '0.8em' }}>
      [IN TE VULLEN: {children}]
    </mark>
  )
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
              Ik kijk en fotografeer bij het Lauwersmeer, onder een Bortle 4-hemel.
            </p>
            <p style={{ ...tekst, marginTop: 12 }}>
              <InTeVullen>hoe en wanneer je met sterrenkijken en astrofotografie bent begonnen</InTeVullen>
            </p>
            <p style={{ ...tekst, marginTop: 12 }}>
              <InTeVullen>je uitrusting (telescoop, camera, montering) en wat je het liefst fotografeert</InTeVullen>
            </p>
            <p style={{ ...tekst, marginTop: 12 }}>
              <InTeVullen>eventueel een eigen astrofoto met korte uitleg (object, datum, belichting)</InTeVullen>
            </p>
          </section>

          <section style={kaart}>
            <h2 style={kop}>Waarom deze site?</h2>
            <p style={tekst}>
              Goed ruimtenieuws is er genoeg, maar bijna allemaal in het Engels. NightGazer brengt het
              in het Nederlands, en combineert het met wat je als waarnemer in Nederland echt nodig hebt:
              wanneer is het donker en helder genoeg, waar is de hemel donker, wat staat er vannacht.
            </p>
            <p style={{ ...tekst, marginTop: 12 }}>
              <InTeVullen>je eigen reden: waarom je de site bent begonnen en voor wie je hem maakt</InTeVullen>
            </p>
          </section>

          <section style={kaart}>
            <h2 style={kop}>Hoe het nieuws wordt gemaakt</h2>
            <p style={tekst}>
              Het nieuws is <strong style={{ color: '#c8d4f0' }}>AI-ondersteund</strong>. Een script haalt
              dagelijks berichten op uit de openbare nieuwsfeeds van NASA, ESA, SpaceNews en Spaceflight Now.
              Claude, het taalmodel van Anthropic, schrijft op basis van het oorspronkelijke artikel een
              Nederlandse versie, met de opdracht alleen feiten uit de bron te gebruiken.
            </p>
            <ul style={{ ...lijst, marginTop: 12 }}>
              <li>Een artikel wordt alleen gepubliceerd als die Nederlandse versie compleet is: echt Nederlands, een vertaalde titel en een volwaardige tekst. Lukt dat niet, dan verschijnt er niets.</li>
              <li>Onder elk artikel staat de bron, met een link naar het oorspronkelijke bericht.</li>
              <li>Zie je toch een fout? <Link href="/contact/" style={link}>Laat het weten</Link>.</li>
            </ul>
            <p style={{ ...tekst, marginTop: 12 }}>
              <InTeVullen>lees of corrigeer je artikelen zelf voor of na publicatie? Zo ja: hoe</InTeVullen>
            </p>
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
              <InTeVullen>welke tool gebruik je zelf het meest, en hoe helpt die je bij het waarnemen</InTeVullen>
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
