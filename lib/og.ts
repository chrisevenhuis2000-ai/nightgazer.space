/* Deelafbeelding voor Facebook, WhatsApp en X.

   Next vervangt het hele openGraph-blok van de root-layout zodra een pagina
   er zelf een heeft. Zonder `images` deelde een pagina zich dan als kale
   link (persona-rapport 19-11-2026: de Facebook-posts naar /omhoog). Elke
   pagina met een eigen openGraph-blok zet daarom `images: ogBeeld(...)`.

   Met een NASA-id een beeld uit de NASA-beeldbank (medium, ~1280 px breed,
   ruim onder de limiet van Facebook); zonder id de algemene kaart. */

export function ogBeeld(nasaId?: string, alt = 'NightGazer: sterrenkijken vanuit Nederland') {
  if (!nasaId) return [{ url: '/og-image.png', width: 1200, height: 630, alt }]
  return [{ url: `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~medium.jpg`, alt }]
}
