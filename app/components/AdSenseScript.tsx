import Script from 'next/script'

export const ADSENSE_CLIENT = 'ca-pub-1782461224909980'
const GA_ID = 'G-ETD8FLPPCL'

/**
 * Google-tags met Consent Mode v2. Toestemming regelt de gecertificeerde CMP
 * van Google (AdSense → Privacy en berichten), die door adsbygoogle.js zelf
 * wordt geladen. Tot die toestemming geeft, staat alles op 'denied'.
 * Het script laadt altijd: de AdSense-crawler moet de code kunnen zien.
 */
export function AdSenseScript() {
  return (
    <>
      <Script id="consent-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500
        });
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
      <Script
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
    </>
  )
}
