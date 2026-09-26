/* ══════════════════════════════════════════════════════════════════════════
   NightGazer service worker

   Eén taak: meldingen ontvangen en tonen als de site dicht is. Bewust géén
   caching van pagina's — een verkeerd afgestelde cache serveert maandenoude
   artikelen en dat is erger dan een trage pagina.

   De push komt zonder inhoud binnen. Dat scheelt de versleuteling van de
   payload (aes128gcm met ECDH), die makkelijk stilletjes fout gaat, en het
   heeft een voordeel: de tekst wordt pas opgehaald op het moment van tonen,
   dus hij is nooit verouderd. Kan hij niet opgehaald worden, dan tonen we
   een algemene melding in plaats van niets — een stille push kost je in
   sommige browsers je toestemming.
   ══════════════════════════════════════════════════════════════════════════ */

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

/** Een korte, stabiele vingerafdruk van het abonnement. */
async function sleutel(endpoint) {
  const bytes = new TextEncoder().encode(endpoint)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(hash)].slice(0, 16)
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

async function haalBericht() {
  const sub = await self.registration.pushManager.getSubscription()
  if (!sub) return null
  const id = await sleutel(sub.endpoint)
  const res = await fetch(`${PROXY}/push/message?id=${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  const b = await res.json()
  return b && b.title ? b : null
}

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let b = null
    try { b = await haalBericht() } catch { /* net stuk; val terug */ }

    const titel = b?.title ?? 'NightGazer'
    const opties = {
      body: b?.body ?? 'Er is iets te zien vannacht. Tik om te kijken.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: b?.tag ?? 'nightgazer',
      renotify: true,
      data: { url: b?.url ?? '/sterrenkijken/' },
      /* Een overkomst duurt een paar minuten; die melding mag niet vanzelf
         verdwijnen voordat je je telefoon hebt gepakt. */
      requireInteraction: b?.tag === 'iss',
    }
    await self.registration.showNotification(titel, opties)
  })())
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const doel = event.notification.data?.url || '/sterrenkijken/'
  event.waitUntil((async () => {
    const vensters = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const v of vensters) {
      if (v.url.includes(new URL(doel, self.location.origin).pathname) && 'focus' in v) return v.focus()
    }
    return self.clients.openWindow(doel)
  })())
})

/* Sommige browsers vervangen het abonnement uit zichzelf. Zonder dit
   stilzwijgend opnieuw aanmelden stopt de bezoeker ongemerkt met meldingen. */
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil((async () => {
    try {
      const oud = event.oldSubscription
      const sleutelRes = await fetch(`${PROXY}/push/key`)
      const { publicKey } = await sleutelRes.json()
      if (!publicKey) return
      const nieuw = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      })
      await fetch(`${PROXY}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: nieuw.toJSON(),
          vervangt: oud ? await sleutel(oud.endpoint) : null,
        }),
      })
    } catch { /* volgende bezoek meldt zich opnieuw aan */ }
  })())
})
