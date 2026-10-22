'use client'

import Link from 'next/link'
import { SiteNav } from '@/app/components/SiteNav'

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
          Bijgewerkt: mei 2026
        </p>

        <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Welke gegevens verzamelen we?</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              NightGazer verzamelt geen persoonlijke gegevens. Er is geen account- of registratiesysteem. De enige lokale opslag die we gebruiken is <code style={{ background: '#1a1b3a', padding: '1px 6px', borderRadius: 2, fontSize: '0.82rem', color: '#3dcfdf' }}>localStorage</code> in je browser — uitsluitend om je quizantwoorden van de dag te onthouden. Deze gegevens verlaten nooit je apparaat.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Serverlogboeken</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Onze hostingprovider slaat standaard serverlogboeken op, zoals IP-adressen en bezochte pagina&apos;s. Deze gegevens zijn anoniem en worden niet door ons gebruikt voor profilering.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Derde partijen</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75, marginBottom: 16 }}>
              NightGazer maakt gebruik van de volgende externe diensten:
            </p>
            <ul style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong style={{ color: '#c8d0e0' }}>Google AdSense</strong> — voor het tonen van advertenties. Google kan cookies plaatsen en gebruiksgegevens verzamelen voor gepersonaliseerde advertenties. Alleen actief na uw toestemming. Zie het <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#378ADD', textDecoration: 'none' }}>privacybeleid van Google</a>.</li>
              <li><strong style={{ color: '#c8d0e0' }}>Bol en Amazon.nl</strong> — de winkellinks op de pagina Uitrusting zijn affiliate-links. NightGazer plaatst zelf geen cookies voor deze links; klik je erop, dan kan de winkel op zijn eigen site cookies plaatsen om je aankoop aan NightGazer toe te schrijven. Daarop is het privacybeleid van die winkel van toepassing.</li>
              <li><strong style={{ color: '#c8d0e0' }}>Google Analytics (GA4)</strong> — voor anonieme bezoekersstatistieken. Alleen actief na uw toestemming.</li>
              <li><strong style={{ color: '#c8d0e0' }}>NASA Open APIs</strong> — voor dagelijkse astronomie-foto&apos;s en afbeeldingen (geen tracking)</li>
              <li><strong style={{ color: '#c8d0e0' }}>Cloudflare</strong> — voor beeldproxy en CDN-diensten; eigen privacybeleid van toepassing</li>
              <li><strong style={{ color: '#c8d0e0' }}>wheretheiss.at</strong> — voor live ISS-positiedata (geen tracking)</li>
              <li><strong style={{ color: '#c8d0e0' }}>Pexels</strong> — voor aanvullende ruimtebeelden (via onze server, niet direct vanuit je browser)</li>
            </ul>
            <p style={{ fontSize: '0.82rem', color: '#6A7B9C', lineHeight: 1.75, marginTop: 16 }}>
              Meer informatie over hoe Google gegevens gebruikt:{' '}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" style={{ color: '#378ADD', textDecoration: 'none' }}>policies.google.com/technologies/partner-sites</a>
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Cookies</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              NightGazer gebruikt functionele cookies (zoals het opslaan van uw quizantwoorden en cookievoorkeur). Na uw uitdrukkelijke toestemming worden ook analytische cookies (Google Analytics) en advertentiecookies (Google AdSense) ingeschakeld. U kunt uw voorkeur op elk moment aanpassen via de cookiebanner onderaan de pagina.
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
