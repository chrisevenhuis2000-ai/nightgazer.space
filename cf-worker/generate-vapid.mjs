/* Genereert een VAPID-sleutelpaar voor de pushmeldingen.
   Draaien met:  node cf-worker/generate-vapid.mjs                       */

const paar = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'],
)
const b64url = b => Buffer.from(b).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const publiek = await crypto.subtle.exportKey('raw', paar.publicKey)   // 65 bytes, ongecomprimeerd
const prive = await crypto.subtle.exportKey('jwk', paar.privateKey)

console.log('\n── VAPID_PUBLIC_KEY ──────────────────────────────────────────')
console.log(b64url(publiek))
console.log('\n── VAPID_PRIVATE_KEY (als één regel JSON) ────────────────────')
console.log(JSON.stringify({ kty: prive.kty, crv: prive.crv, x: prive.x, y: prive.y, d: prive.d }))
console.log('\nZet ze zo klaar:')
console.log('  npx wrangler secret put VAPID_PUBLIC_KEY   --config cf-worker/wrangler.toml')
console.log('  npx wrangler secret put VAPID_PRIVATE_KEY  --config cf-worker/wrangler.toml\n')
