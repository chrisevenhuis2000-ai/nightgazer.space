// ── Aanmelden voor meldingen ──────────────────────────────────────────────
//
// De browser levert het abonnement, de worker bewaart het en stuurt later de
// push. Wat hier opvalt: de ISS-overkomsten gaan mee in het abonnement.
//
// Dat is met opzet. De baanberekening draait al in de browser en is daar
// nagemeten; hem ook in de worker bouwen zou betekenen dat SGP4 op twee
// plekken staat en op twee plekken kan afwijken. De worker hoeft zo alleen
// een lijst tijdstippen af te lopen — een wekker, geen rekenmachine.

import { PROXY } from './home-content'

export type Sein = 'helder' | 'noorderlicht' | 'iss' | 'lancering'

export const SEINEN: { id: Sein; naam: string; uitleg: string }[] = [
  { id: 'helder',       naam: 'Heldere, donkere nacht', uitleg: 'Weinig bewolking én een maan die niet in de weg staat, bij jou in de buurt.' },
  { id: 'noorderlicht', naam: 'Noorderlicht',           uitleg: 'Zodra de Kp-index hoog genoeg is dat het vanuit Nederland kan.' },
  { id: 'iss',          naam: 'ISS-overkomst',          uitleg: 'Een kwartier voor een zichtbare overkomst boven jouw plek.' },
  { id: 'lancering',    naam: 'Lancering',              uitleg: 'De ochtend van een lancering met een vaste datum.' },
]

export interface Voorkeur {
  seinen: Sein[]
  lat: number
  lon: number
  plaats: string
  /** Vanaf welke Kp het noorderlicht een melding waard is. */
  kpDrempel: number
}

export type PushStaat =
  | 'niet-ondersteund'   // geen service worker of geen push in deze browser
  | 'uit-te-zetten'      // server heeft nog geen sleutel: push is niet ingericht
  | 'geweigerd'          // de bezoeker heeft meldingen geblokkeerd
  | 'aan'
  | 'uit'

/** base64url uit de VAPID-sleutel naar de bytes die subscribe() wil. */
function sleutelBytes(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const plat = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const ruw = atob(plat)
  return Uint8Array.from([...ruw].map(c => c.charCodeAt(0)))
}

export function pushMogelijk(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

let registratie: Promise<ServiceWorkerRegistration> | null = null
export function registreerSw(): Promise<ServiceWorkerRegistration> {
  if (!registratie) registratie = navigator.serviceWorker.register('/sw.js', { scope: '/' })
  return registratie
}

/** De publieke VAPID-sleutel van de server, of null als push nog niet leeft. */
export async function serverSleutel(signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`${PROXY}/push/key`, { signal })
    if (!res.ok) return null
    const d = await res.json()
    return typeof d?.publicKey === 'string' && d.publicKey.length > 20 ? d.publicKey : null
  } catch {
    return null
  }
}

/**
 * Kijkt of er al een abonnement is, zonder de service worker te registreren.
 * getRegistration() installeert niets; register() wel. Dat onderscheid is de
 * reden dat een bezoeker die dit nooit aanzet ook geen achtergrondproces
 * krijgt dat hij niet gevraagd heeft.
 */
export async function huidigAbonnement(): Promise<PushSubscription | null> {
  if (!pushMogelijk()) return null
  const reg = await navigator.serviceWorker.getRegistration('/')
  if (!reg) return null
  return reg.pushManager.getSubscription()
}

export interface Wekker { t: number; soort: Sein; titel: string; tekst: string; url: string }

/** Meldt aan (of werkt bij) met de gekozen seinen en de bekende wekkers. */
export async function abonneer(
  voorkeur: Voorkeur, wekkers: Wekker[], publicKey: string,
): Promise<void> {
  const reg = await registreerSw()
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: sleutelBytes(publicKey) as BufferSource,
    })
  }
  const res = await fetch(`${PROXY}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON(), voorkeur, wekkers }),
  })
  if (!res.ok) throw new Error(`aanmelden mislukt (${res.status})`)
}

export async function zegOp(): Promise<void> {
  const sub = await huidigAbonnement()
  if (!sub) return
  await fetch(`${PROXY}/push/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => { /* lokaal opzeggen lukt sowieso */ })
  await sub.unsubscribe()
}
