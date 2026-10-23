import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import ErrorBoundary from './ErrorBoundary'
import SearchProvider from './components/SearchProvider'
import { AdSenseScript, ADSENSE_CLIENT } from './components/AdSenseScript'

/* Lettertypen staan in de repo (app/fonts, latin-subset, variabel, OFL)
   in plaats van next/font/google: dat haalde ze bij elke build op bij
   Google en brak de Cloudflare-build als Google een font-URL zonder
   extensie teruggaf. */
const inter = localFont({
  src: './fonts/inter-latin.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
})

const playfair = localFont({
  src: './fonts/playfair-display-latin.woff2',
  weight: '700 800',
  style: 'normal',
  variable: '--font-playfair',
  display: 'swap',
})

const jetbrains = localFont({
  src: './fonts/jetbrains-mono-latin.woff2',
  weight: '400 500',
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://nightgazer.space'),
  title:       { default: 'NightGazer — Astronomie voor Iedereen', template: '%s | NightGazer' },
  description: 'Nederlandstalig astronomie-platform met AI-aangedreven uitleg op jouw niveau. Van beginners tot professionals.',
  keywords:    ['astronomie', 'ruimtevaart', 'NASA', 'sterrenkijken', 'JWST', 'ruimte nieuws', 'nightgazer'],
  openGraph: {
    siteName: 'NightGazer',
    locale:   'nl_NL',
    type:     'website',
    images:   [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NightGazer — Astronomie voor Iedereen' }],
  },
  twitter: { card: 'summary_large_image', site: '@nightgazerspace' },
  other:   { 'google-adsense-account': ADSENSE_CLIENT },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://cosmosnl-proxy.chrisevenhuis2000.workers.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cosmosnl-proxy.chrisevenhuis2000.workers.dev" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`} style={{ fontFamily: 'var(--font-sans)' }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <SearchProvider />
        <AdSenseScript />
      </body>
    </html>
  )
}
