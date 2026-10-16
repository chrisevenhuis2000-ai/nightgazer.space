// ── AdSense, Google CMP en GA4 ────────────────────────────────────────────
// Toestemming regelt de Google CMP (AdSense → Privacy en berichten): die komt
// mee met adsbygoogle.js en zet de TCF-API (__tcfapi) op de pagina. Wij
// hebben geen eigen banner meer; we lezen alleen wat de CMP vastlegt.

export const ADSENSE_CLIENT = 'ca-pub-1782461224909980'
export const GA4_ID = 'G-ETD8FLPPCL'

// Advertentieplekken. Een slot is het getal uit AdSense → Advertenties →
// Per advertentieblok. Zolang hier geen getal staat, rendert AdPlate niets:
// liever geen veld dan een kapotte advertentie.
export const SLOT_MISSIES  = '<SLOT_MISSIES>'
export const SLOT_EDUCATIE = '<SLOT_EDUCATIE>'

export const isSlot = (slot?: string): slot is string => !!slot && /^\d+$/.test(slot)

// Draait als allereerste script in <head>, vóór adsbygoogle.js.
//
// 1. Consent Mode v2: alles standaard 'denied'.
// 2. Zodra de Google CMP de TCF-API klaar heeft (googlefc.callbackQueue,
//    CONSENT_API_READY), luisteren we naar de TCF-toestemming en zetten die om
//    naar Consent Mode:
//      ad_storage          ← doel 1 (opslaan/lezen) + Google als vendor (755)
//      ad_user_data        ← doel 1 + 7 + Google
//      ad_personalization  ← doel 3 + 4 + Google
//      analytics_storage   ← doel 1 + 8 (contentprestaties meten) + Google
//    Valt de AVG niet van toepassing (gdprApplies === false), dan alles toe.
// 3. gtag.js (GA4) wordt pas geladen als analytics_storage is toegestaan:
//    vóór toestemming gaat er geen enkel request naar googletagmanager.com.
//    Trekt iemand toestemming later in, dan volgt een 'denied'-update.
export const CONSENT_SCRIPT = `(function(){
var GA=${JSON.stringify(GA4_ID)},GOOGLE=755,w=window;
w.dataLayer=w.dataLayer||[];
function gtag(){w.dataLayer.push(arguments);}
w.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
gtag('set','ads_data_redaction',true);
var gaGeladen=false;
function laadGA(){if(gaGeladen)return;gaGeladen=true;
var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+GA;document.head.appendChild(s);
gtag('js',new Date());gtag('config',GA);}
function verwerk(tc,ok){
if(!ok||!tc)return;
if(tc.eventStatus!=='tcloaded'&&tc.eventStatus!=='useractioncomplete')return;
var p=(tc.purpose&&tc.purpose.consents)||{},v=(tc.vendor&&tc.vendor.consents)||{};
var avg=tc.gdprApplies!==false,g=!avg||!!v[GOOGLE];
function mag(){if(!avg)return true;if(!g)return false;for(var i=0;i<arguments.length;i++)if(!p[arguments[i]])return false;return true;}
var c={ad_storage:mag(1)?'granted':'denied',ad_user_data:mag(1,7)?'granted':'denied',ad_personalization:mag(3,4)?'granted':'denied',analytics_storage:mag(1,8)?'granted':'denied'};
gtag('consent','update',c);
if(c.analytics_storage==='granted')laadGA();}
w.googlefc=w.googlefc||{};w.googlefc.callbackQueue=w.googlefc.callbackQueue||[];
w.googlefc.callbackQueue.push({CONSENT_API_READY:function(){if(typeof w.__tcfapi==='function')w.__tcfapi('addEventListener',2.2,verwerk);}});
})();`
