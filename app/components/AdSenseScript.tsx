import Script from 'next/script'

export const ADSENSE_CLIENT = 'ca-pub-1782461224909980'
const GA_ID = 'G-ETD8FLPPCL'

/**
 * Zet op true zodra AdSense de site heeft goedgekeurd. Tot die tijd vult
 * Google de blokken niet: ze groeien leeg op (de pagina verspringt) of tonen
 * met een adblocker een wit veld. Het script hieronder laadt wel altijd, dat
 * is wat de AdSense-keuring nodig heeft; de blokken zelf zijn niet nodig.
 */
export const ADVERTENTIES_AAN = false

/** Sleutel in localStorage met de keuze uit de eigen Analytics-banner: 'ja' of 'nee'. */
export const ANALYTICS_KEUZE = 'ng-analytics-toestemming'

/**
 * Google-tags met Consent Mode v2. Alles staat standaard op 'denied'.
 * Toestemming voor Analytics vraagt de eigen banner (CookieBanner); heeft de
 * bezoeker eerder 'ja' gezegd, dan staat analytics_storage meteen op 'granted'.
 * Advertentiecookies blijven 'denied' tot de CMP van Google (AdSense → Privacy
 * en berichten) actief is; die wordt door adsbygoogle.js zelf geladen.
 * Het script laadt altijd: de AdSense-crawler moet de code kunnen zien.
 */
export function AdSenseScript() {
  return (
    <>
      <Script id="consent-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        var ngJa = false;
        try { ngJa = localStorage.getItem('${ANALYTICS_KEUZE}') === 'ja'; } catch (e) {}
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: ngJa ? 'granted' : 'denied',
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
