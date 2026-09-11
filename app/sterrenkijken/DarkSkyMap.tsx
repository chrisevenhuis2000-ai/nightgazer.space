'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface DarkSpot {
  name:   string
  lat:    number
  lon:    number
  bortle: string
  desc:   string
  tip:    string
}

const BORTLE_COLORS: Record<string, string> = {
  '2–3': '#3ddf90',
  '3–4': '#d4a84b',
  '4':   '#378ADD',
  '5':   '#8A9BC4',
}

// Approximate Bortle zones for the Netherlands as lat/lon circles
// [lat, lon, radiusKm, bortle]
const BORTLE_ZONES: [number, number, number, string][] = [
  // Terschelling / Wadden islands — very dark
  [53.40, 5.35, 14, '2–3'],
  [53.50, 5.80, 10, '2–3'], // Ameland
  [53.77, 7.69, 8,  '2–3'], // Spiekeroog DE
  // Lauwersmeer
  [53.36, 6.20, 16, '3–4'],
  // Bargerveen / Bourtangermoor
  [52.68, 7.03, 18, '3–4'],
  [53.01, 7.20, 14, '3–4'],
  // Fochteloërveen / Drenthe
  [52.96, 6.38, 20, '4'],
  // Veluwe
  [52.10, 5.80, 22, '4'],
  // Zeeland coast
  [51.55, 3.80, 12, '4'],
]

export default function DarkSkyMap({
  spots,
  userLat,
  userLon,
}: {
  spots:   DarkSpot[]
  userLat: number
  userLon: number
}) {
  const divRef      = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<unknown>(null)

  useEffect(() => {
    if (!divRef.current || mapRef.current) return

    let cancelled = false

    import('leaflet').then(L => {
      if (cancelled || !divRef.current) return

      // Fix default marker icon paths that webpack breaks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(divRef.current!, {
        center:        [52.5, 5.3],
        zoom:          7,
        zoomControl:   true,
        scrollWheelZoom: false,
      })
      mapRef.current = map

      // Base tiles — OpenStreetMap, donker gemaakt met een CSS-filter.
      // CARTO's Dark Matter is niet meer bruikbaar: dat endpoint stempelt
      // sinds kort "API KEY REQUIRED" over elke tegel, ongeacht de referer.
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom:     19,
        className:   'ng-tiles-dark',
      }).addTo(map)

      // Light pollution overlay — World Atlas of Artificial Night Sky Brightness 2022
      L.tileLayer('https://djlorenz.github.io/astronomy/lp2022/overlay/tiles/{z}/{x}/{y}.png', {
        opacity:     0.65,
        maxZoom:     10,
        attribution: '&copy; <a href="https://djlorenz.github.io/astronomy/lp2022/">Falchi et al. World Atlas 2022</a>',
      }).addTo(map)

      // Soft Bortle zone circles (semi-transparent fill, no outline)
      BORTLE_ZONES.forEach(([lat, lon, radiusKm, bortle]) => {
        const col = BORTLE_COLORS[bortle] ?? '#8A9BC4'
        L.circle([lat, lon], {
          radius:      radiusKm * 1000,
          color:       col,
          fillColor:   col,
          fillOpacity: 0.08,
          weight:      1,
          opacity:     0.25,
        }).addTo(map)
      })

      // Dark spot markers with glowing DIV icons
      spots.forEach((spot, i) => {
        const col = BORTLE_COLORS[spot.bortle] ?? '#8A9BC4'

        const icon = L.divIcon({
          html: `
            <div style="
              width:18px; height:18px; border-radius:50%;
              background:${col};
              border:2px solid rgba(255,255,255,0.85);
              box-shadow:0 0 10px ${col}bb, 0 0 20px ${col}44;
              cursor:pointer;
            "></div>`,
          className:  '',
          iconSize:   [18, 18],
          iconAnchor: [9, 9],
        })

        const popup = L.popup({
          className:   'ds-popup',
          maxWidth:    240,
          offset:      L.point(0, -6),
        }).setContent(`
          <div style="
            font-family:'JetBrains Mono',monospace;
            background:#12132A;
            color:#fff;
            padding:0;
            border-radius:4px;
            overflow:hidden;
          ">
            <div style="height:3px;background:${col}"></div>
            <div style="padding:12px 14px">
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:1rem;font-weight:700;margin-bottom:4px">${spot.name}</div>
              <div style="font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:${col};margin-bottom:8px">Bortle ${spot.bortle}${i === 0 ? ' · Dichtstbij' : ''}</div>
              <div style="font-size:0.72rem;color:#8A9BC4;line-height:1.55;margin-bottom:8px">${spot.desc}</div>
              <div style="background:#0F1028;border-radius:2px;padding:7px 10px">
                <div style="font-size:0.56rem;letter-spacing:0.1em;text-transform:uppercase;color:#378ADD;margin-bottom:3px">Tip</div>
                <div style="font-size:0.68rem;color:#8A9BC4;line-height:1.5">${spot.tip}</div>
              </div>
            </div>
          </div>
        `)

        L.marker([spot.lat, spot.lon], { icon }).addTo(map).bindPopup(popup)
      })

      // User location — pulsing blue dot
      const userIcon = L.divIcon({
        html: `
          <div style="position:relative;width:16px;height:16px">
            <div style="
              position:absolute;inset:0;border-radius:50%;
              background:rgba(55,138,221,0.25);
              animation:pulse 2s ease-in-out infinite;
            "></div>
            <div style="
              position:absolute;top:3px;left:3px;
              width:10px;height:10px;border-radius:50%;
              background:#378ADD;
              border:2px solid white;
              box-shadow:0 0 8px #378ADD99;
            "></div>
          </div>`,
        className:  '',
        iconSize:   [16, 16],
        iconAnchor: [8, 8],
      })

      L.marker([userLat, userLon], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<div style="font-family:'JetBrains Mono',monospace;background:#12132A;color:#378ADD;padding:8px 12px;font-size:0.7rem;border-radius:2px">📍 Jouw locatie</div>`)
    })

    return () => {
      cancelled = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (mapRef.current) { (mapRef.current as any).remove(); mapRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`
        .ds-popup .leaflet-popup-content-wrapper,
        .ds-popup .leaflet-popup-tip {
          background: #12132A !important;
          border: 1px solid #252858 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
          border-radius: 4px !important;
        }
        .ds-popup .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-close-button { color: #7A86A8 !important; top: 8px !important; right: 8px !important; }
        .leaflet-popup-close-button:hover { color: #fff !important; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <div ref={divRef} style={{ width: '100%', height: '100%' }} />
    </>
  )
}
