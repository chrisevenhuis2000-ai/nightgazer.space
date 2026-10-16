'use client'

import Link from 'next/link'
import { SiteNav } from '@/app/components/SiteNav'
import { PrivacyInstellingen } from '@/app/components/PrivacyInstellingen'

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7A86A8', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: '#378ADD', textDecoration: 'none' }}>Home</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>Privacy</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 8 }}>
          Privacyverklaring
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 40 }}>
          Bijgewerkt: oktober 2026
        </p>

        <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Welke gegevens verzamelen we zelf?</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              NightGazer heeft geen accounts en verzamelt zelf geen persoonsgegevens. In je browser bewaren we wat voorkeuren in <code style={{ background: '#1a1b3a', padding: '1px 6px', borderRadius: 2, fontSize: '0.82rem', color: '#3dcfdf' }}>localStorage</code>, bijvoorbeeld je quizantwoorden, je leesniveau en een kopie van de foto van de dag. Die gegevens verlaten je apparaat niet.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Serverlogboeken</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Onze hosting (Cloudflare) houdt standaard technische logboeken bij, zoals IP-adressen en opgevraagde pagina&apos;s, om de site veilig en bereikbaar te houden. Wij gebruiken die niet voor profilering.
            </p>
          </section>

          <section id="toestemming" style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Toestemming: het venster van Google</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Voor advertenties en statistieken vragen we je toestemming via het toestemmingsvenster van Google (de Google CMP, een door IAB Europe gecertificeerd platform volgens het Transparency &amp; Consent Framework). Bezoek je ons vanuit de EER, het VK of Zwitserland, dan zie je dat venster bij je eerste bezoek. Je kiest daar per doel en per partner of je toestemming geeft.
            </p>
            <ul style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><strong style={{ color: '#c8d0e0' }}>Advertenties (Google AdSense)</strong>: met toestemming mag Google cookies plaatsen en advertenties op je interesses afstemmen. Zonder toestemming slaat Google daarvoor geen cookies op; afhankelijk van je keuze toont Google dan beperkte of geen advertenties.</li>
              <li><strong style={{ color: '#c8d0e0' }}>Statistieken (Google Analytics 4)</strong>: wordt pas geladen als je toestemming geeft voor het opslaan van gegevens en het meten van contentprestaties. Zonder die toestemming laden we Google Analytics helemaal niet.</li>
            </ul>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75, marginTop: 12 }}>
              <strong style={{ color: '#c8d0e0' }}>Toestemming wijzigen of intrekken</strong> kan altijd, even makkelijk als geven: via de link <em>Privacyinstellingen</em> onderaan elke pagina, of hier:{' '}
              <PrivacyInstellingen label="Privacyinstellingen openen" opPrivacyPagina style={{ fontFamily: 'inherit', fontSize: 'inherit', color: '#378ADD' }} />
              . Je kunt cookies van nightgazer.space ook altijd verwijderen in je browser.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Wie verwerkt wat?</h2>
            <ul style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><strong style={{ color: '#c8d0e0' }}>NightGazer</strong>: verantwoordelijk voor deze site; plaatst zelf geen tracking- of advertentiecookies.</li>
              <li><strong style={{ color: '#c8d0e0' }}>Google Ireland Limited</strong>: het toestemmingsvenster en Google AdSense (Google is daarbij zelf verwerkingsverantwoordelijke, samen met de advertentiepartners die je in het venster ziet), en Google Analytics (Google verwerkt die statistieken in onze opdracht). Zie het <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#378ADD', textDecoration: 'none' }}>privacybeleid van Google</a> en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" style={{ color: '#378ADD', textDecoration: 'none' }}>hoe Google gegevens gebruikt op sites van partners</a>.</li>
              <li><strong style={{ color: '#c8d0e0' }}>Cloudflare</strong>: hosting, CDN en onze proxy voor beelden, weer en de NASA-foto van de dag; eigen privacybeleid van toepassing.</li>
              <li><strong style={{ color: '#c8d0e0' }}>NASA, Open-Meteo, NOAA, Pexels</strong>: bronnen voor beelden en data; die halen we via onze server op, dus zij zien jouw browser niet.</li>
              <li><strong style={{ color: '#c8d0e0' }}>wheretheiss.at</strong>: live ISS-positie, rechtstreeks vanuit je browser (geen tracking, wel je IP-adres in hun logboek).</li>
            </ul>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Cookies</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Zonder toestemming gebruikt NightGazer alleen de lokale opslag hierboven. Het toestemmingsvenster van Google bewaart je keuze zelf (in een cookie), zodat het niet bij elk bezoek terugkomt. Advertentie- en analysecookies van Google worden alleen geplaatst als je daarvoor toestemming hebt gegeven.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Vragen?</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Vragen over deze privacyverklaring? Neem contact op via{' '}
              <a href="mailto:contact@nightgazer.space" style={{ color: '#378ADD', textDecoration: 'none' }}>contact@nightgazer.space</a>.
            </p>
          </section>
        </div>

        <div style={{ marginTop: 48 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none' }}>
            ← Terug naar home
          </Link>
        </div>
      </main>
    </>
  )
}
