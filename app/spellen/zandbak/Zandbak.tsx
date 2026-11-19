'use client'

/* ══════════════════════════════════════════════════════════════════════════
   Ruimtezandbak

   Zet sterren, planeten en manen neer en kijk hoe de zwaartekracht hun banen
   bepaalt. Tik: het nieuwe lichaam krijgt vanzelf een nette cirkelbaan. Sleep:
   je kiest zelf de vaart en richting, en een stippellijn laat zien waar hij
   heen gaat. Tik op iets dat er al staat om het te bekijken, zwaarder te maken
   of weg te halen.

   Bovenaan staan een paar "wat als"-vragen als kant-en-klare beginstand.
   Alles rekent in de browser (lib/zandbak.ts) en wordt pixel voor pixel
   getekend (lib/zandbak-teken.ts). Er wordt niets bewaard.
   ══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../../components/SiteFooter'
import { archivo, FOOTER_COLS, PlateHead, editionLabel } from '@/app/_plate/shared'
import { telGebeurtenis } from '@/lib/tel'
import {
  SCENES, bouw, cirkelSnelheid, baasOp, soortVan, straalVan, kleurBij, massaTekst, afstandTekst,
  tijdTekst, snelheidTekst, STANDAARD, SOORTNAAM, DAG, G, KMS,
  type Scene, type Soort, type Wereld, type Gebeurtenis, type Lichaam,
} from '@/lib/zandbak'
import { teken, schermStraal, type Beeld, type Camera, type Tekenopties } from '@/lib/zandbak-teken'

const TEMPO = [0.25, 0.5, 1, 2, 4, 8]
const ZOOM = [0.25, 0.4, 0.6, 1, 1.6, 2.5, 4]
const MAX_LICHAMEN = 30
/** Zo veel schermpixels slepen geeft precies de vaart van een cirkelbaan. */
const SLINGER_PX = 22
const SPOORPUNTEN = 420

const GEREEDSCHAP: Soort[] = ['planeet', 'maan', 'reus', 'ster']

/* Mini-sprites voor de knoppen, als SVG met harde pixelranden. */
function Pixel({ soort }: { soort: Soort }) {
  const kaart: Record<Soort, { p: string; c: string[] }> = {
    planeet: { p: '.aab.|abbbc|aabcc|abbcc|.bcc.', c: ['#4E9A5B', '#3B74C9', '#142449'] },
    maan:    { p: '.....|.aab.|.abc.|.bcc.|.....', c: ['#E6E6EE', '#A8A8B6', '#2F2F3A'] },
    reus:    { p: '.aaa.|bbbbc|aaacc|bbbcc|.acc.', c: ['#F6E2BE', '#A66E46', '#45301D'] },
    ster:    { p: '..a..|.bab.|aacaa|.bab.|..a..', c: ['#FFCF4D', '#F2992E', '#FFFFFF'] },
  }
  const { p, c } = kaart[soort]
  const rijen = p.split('|')
  return (
    <svg className="zb-pix" viewBox="0 0 5 5" aria-hidden="true" shapeRendering="crispEdges">
      {rijen.flatMap((rij, y) => rij.split('').map((k, x) => k === '.' ? null : (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={c[k.charCodeAt(0) - 97]} />
      )))}
    </svg>
  )
}

type Melding = { tekst: string; t: number }
type Slinger = NonNullable<Tekenopties['slinger']> & { soort: Soort; id: number }

function stofVoor(n: number): Float32Array {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const r = (k: number) => { const x = Math.sin(i * 91.7 + k * 47.3) * 24634.6345; return x - Math.floor(x) }
    a[3 * i] = r(1); a[3 * i + 1] = r(2); a[3 * i + 2] = r(3) ** 3
  }
  return a
}

export default function Zandbak() {
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  const scene = SCENES.find(s => s.id === sceneId) as Scene
  const [gereedschap, setGereedschap] = useState<Soort>('planeet')
  const [loopt, setLoopt] = useState(true)
  const [tempo, setTempo] = useState(2)
  const [zoom, setZoom] = useState(3)
  const [sporen, setSporen] = useState(true)
  const [namen, setNamen] = useState(true)
  const [selectie, setSelectie] = useState<number | null>(null)
  const [melding, setMelding] = useState<Melding | null>(null)
  /* Wordt vier keer per seconde opgehoogd, zodat tijd en info meelopen. */
  const [, setTik] = useState(0)

  const wereld = useRef<Wereld>(bouw(SCENES[0]))
  const canvas = useRef<HTMLCanvasElement>(null)
  const beeld = useRef<{ b: Beeld; img: ImageData; P: number } | null>(null)
  const slinger = useRef<Slinger | null>(null)
  const flitsen = useRef<Tekenopties['flitsen']>([])
  const zichtbaar = useRef(true)
  const stof = useRef(stofVoor(70))
  const volgNr = useRef<Record<Soort, number>>({ ster: 0, reus: 0, planeet: 0, maan: 0 })
  const vertraagd = useRef(false)
  const geplaatst = useRef(false)
  const spoorKlok = useRef(0)

  /* De waarden die de tekenlus nodig heeft, zonder elke keer opnieuw te starten. */
  const instel = useRef({ scene, loopt, tempo, zoom, sporen, namen, selectie })
  instel.current = { scene, loopt, tempo, zoom, sporen, namen, selectie }

  const camera = useCallback((b: Beeld): Camera => {
    const w = wereld.current, s = instel.current.scene
    const f = s.camera === 'zwaarste' ? (w.zwaarste() ?? { x: 0, y: 0 }) : w.zwaartepunt()
    return { fx: f.x, fy: f.y, aePerPx: (s.schaal / ZOOM[instel.current.zoom]) / (Math.min(b.w, b.h) / 2) }
  }, [])

  const meld = useCallback((tekst: string) => setMelding({ tekst, t: Date.now() }), [])

  function laad(s: Scene) {
    wereld.current = bouw(s)
    volgNr.current = { ster: 0, reus: 0, planeet: 0, maan: 0 }
    flitsen.current = []
    slinger.current = null
    setSelectie(null)
    setMelding(null)
    setZoom(3)
    setTempo(2)
    setSceneId(s.id)
  }

  /* Canvasmaat: elke kunstpixel is 2 of 3 schermpixels, altijd een heel getal. */
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const meet = () => {
      const vak = el.parentElement!
      const css = Math.floor(Math.min(vak.clientWidth, window.innerHeight * 0.72))
      const P = css >= 520 ? 3 : 2
      const n = Math.max(120, Math.floor(css / P))
      el.width = n; el.height = n
      el.style.width = `${n * P}px`; el.style.height = `${n * P}px`
      const ctx = el.getContext('2d')
      if (!ctx) return
      const img = ctx.createImageData(n, n)
      beeld.current = { b: { w: n, h: n, px: new Uint32Array(img.data.buffer) }, img, P }
    }
    meet()
    const ro = new ResizeObserver(meet)
    ro.observe(el.parentElement!)
    const io = new IntersectionObserver(([e]) => { zichtbaar.current = e.isIntersecting })
    io.observe(el)
    return () => { ro.disconnect(); io.disconnect() }
  }, [])

  /* Wie minder beweging wil, begint op pauze. */
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setLoopt(false)
  }, [])

  /* De lus: rekenen, sporen bijhouden, tekenen. */
  useEffect(() => {
    let raf = 0, vorige = performance.now(), info = 0
    const lus = (nu: number) => {
      raf = requestAnimationFrame(lus)
      const dtEcht = Math.min(0.05, (nu - vorige) / 1000)
      vorige = nu
      const ctx = canvas.current?.getContext('2d')
      const bb = beeld.current
      if (!ctx || !bb || !zichtbaar.current) return
      const w = wereld.current
      const { scene: s, loopt: aan, tempo: ti } = instel.current

      if (aan && !slinger.current) {
        const gewenst = s.dagenPerSec * TEMPO[ti] * DAG * dtEcht
        const uit: Gebeurtenis[] = []
        const gedaan = w.stap(gewenst, 3000, uit)
        vertraagd.current = gedaan < gewenst * 0.9
        for (const g of uit) {
          if (g.soort === 'botsing') {
            const l = w.lichamen.find(b => b.naam === g.naam)
            if (l) flitsen.current.push({ x: l.x, y: l.y, t0: nu })
            meld(`Botsing: ${g.b} is opgegaan in ${g.a}.`)
          } else {
            meld(`${g.naam} is ontsnapt en vliegt de ruimte in.`)
          }
        }
        if (uit.length) setSelectie(sel => (sel && w.lichamen.some(b => b.id === sel) ? sel : null))
        flitsen.current = flitsen.current.filter(f => nu - f.t0 < 800)

        /* Sporen: een vast aantal punten over zo'n 12 seconden aan gewone snelheid. */
        spoorKlok.current += gedaan
        const elk = (s.dagenPerSec * DAG * 12) / SPOORPUNTEN
        if (spoorKlok.current >= elk) {
          spoorKlok.current = 0
          const cam = camera(bb.b)
          for (const l of w.lichamen) {
            l.spoor.push(l.x - cam.fx, l.y - cam.fy)
            if (l.spoor.length > SPOORPUNTEN * 2) l.spoor.splice(0, 2)
          }
        }
      }

      const cam = camera(bb.b)
      const { sporen: sp, namen: nm, selectie: sel } = instel.current
      teken(bb.b, w, cam, { t: nu, sporen: sp, namen: nm, vergroot: s.vergroot ?? 1, selectie: sel, flitsen: flitsen.current, slinger: slinger.current, stof: stof.current })
      ctx.putImageData(bb.img, 0, 0)

      if (nu - info > 250) { info = nu; setTik(n => n + 1) }
    }
    raf = requestAnimationFrame(lus)
    return () => cancelAnimationFrame(raf)
  }, [camera, meld])

  /* ── Aanraken ──────────────────────────────────────────────────────────── */

  function punt(e: React.PointerEvent): { x: number; y: number } | null {
    const el = canvas.current, bb = beeld.current
    if (!el || !bb) return null
    const r = el.getBoundingClientRect()
    return { x: (e.clientX - r.left) / bb.P, y: (e.clientY - r.top) / bb.P }
  }
  function naarWereld(x: number, y: number): { x: number; y: number } {
    const bb = beeld.current!, cam = camera(bb.b)
    return { x: cam.fx + (x - bb.b.w / 2) * cam.aePerPx, y: cam.fy - (y - bb.b.h / 2) * cam.aePerPx }
  }

  function geraakt(x: number, y: number): Lichaam | null {
    const bb = beeld.current!, cam = camera(bb.b)
    let best: Lichaam | null = null, afstand = Infinity
    for (const l of wereld.current.lichamen) {
      const sx = bb.b.w / 2 + (l.x - cam.fx) / cam.aePerPx, sy = bb.b.h / 2 - (l.y - cam.fy) / cam.aePerPx
      const d = Math.hypot(sx - x, sy - y)
      if (d < schermStraal(l, scene.vergroot ?? 1) + 4 && d < afstand) { best = l; afstand = d }
    }
    return best
  }

  /** Vaart en richting bij loslaten; zonder slepen een cirkelbaan. */
  function snelheid(s: Slinger, m: number) {
    const w = wereld.current
    const p = naarWereld(s.x0, s.y0)
    const c = cirkelSnelheid(w, p.x, p.y, m)
    if (!s.sleept || !c.baas) return { ...p, vx: c.vx, vy: c.vy }
    const dx = s.x1 - s.x0, dy = -(s.y1 - s.y0)
    const len = Math.hypot(dx, dy) || 1
    const v = c.v * (len / SLINGER_PX)
    return { ...p, vx: c.baas.vx + v * dx / len, vy: c.baas.vy + v * dy / len }
  }

  /** Vooruitkijken: waar gaat het nieuwe lichaam heen? Ongeveer anderhalve omloop. */
  function voorspel(s: Slinger) {
    const w = wereld.current
    const m = STANDAARD[s.soort].m
    const st = snelheid(s, m)
    const baas = baasOp(w, st.x, st.y)
    if (!baas) { s.baan = []; return }
    const kloon = w.kloon()
    const nieuw = kloon.voegToe({ naam: '', soort: s.soort, m, ...st })
    const d = Math.hypot(st.x - baas.x, st.y - baas.y)
    const omloop = 2 * Math.PI * Math.sqrt(d ** 3 / (G * baas.m))
    const duur = Math.min(omloop * 1.5, instel.current.scene.dagenPerSec * DAG * 40)
    const baan: number[] = []
    const cam0 = camera(beeld.current!.b)
    const volg = instel.current.scene.camera
    for (let i = 0; i < 160; i++) {
      kloon.stap(duur / 160, 120)
      if (!kloon.lichamen.includes(nieuw)) break
      const f = volg === 'zwaarste' ? (kloon.zwaarste() ?? { x: 0, y: 0 }) : kloon.zwaartepunt()
      baan.push(nieuw.x - f.x + cam0.fx, nieuw.y - f.y + cam0.fy)
    }
    s.baan = baan
  }

  function neer(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = punt(e)
    if (!p) return
    const raak = geraakt(p.x, p.y)
    if (raak) { setSelectie(raak.id === selectie ? null : raak.id); return }
    if (wereld.current.lichamen.length >= MAX_LICHAMEN) { meld(`Er staan er al ${MAX_LICHAMEN}. Haal er eerst een weg.`); return }
    e.currentTarget.setPointerCapture(e.pointerId)
    const r = schermStraal({ soort: gereedschap, m: STANDAARD[gereedschap].m } as Lichaam, scene.vergroot ?? 1)
    slinger.current = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, sleept: false, baan: [], r, kleur: STANDAARD[gereedschap].kleur, soort: gereedschap, id: e.pointerId }
  }

  function beweeg(e: React.PointerEvent<HTMLCanvasElement>) {
    const s = slinger.current, p = punt(e)
    if (!s || !p || e.pointerId !== s.id) return
    s.x1 = p.x; s.y1 = p.y
    if (!s.sleept && Math.hypot(p.x - s.x0, p.y - s.y0) > 4) s.sleept = true
    if (s.sleept) voorspel(s)
  }

  function los(e: React.PointerEvent<HTMLCanvasElement>) {
    const s = slinger.current
    if (!s || e.pointerId !== s.id) return
    slinger.current = null
    const w = wereld.current
    const m = STANDAARD[s.soort].m
    const st = snelheid(s, m)
    const nr = ++volgNr.current[s.soort]
    const soort = s.soort
    const kleur = soort === 'planeet' ? (['aarde', 'mars', 'venus', 'rots', 'mercurius'] as const)[(nr - 1) % 5]
      : soort === 'reus' ? (nr % 2 ? 'reus' : 'ijsreus') : soort === 'ster' ? kleurBij('ster', m) : 'maan'
    const l = w.voegToe({ naam: `${STANDAARD[soort].label} ${nr}`, soort, kleur, m, ...st })
    setSelectie(null)
    if (!geplaatst.current) { geplaatst.current = true; telGebeurtenis('zandbak-plaats', `${scene.id}:${soort}`) }
    meld(s.sleept ? `${l.naam} is weggeschoten. Volg de stippellijn.` : `${l.naam} draait nu rond ${baasOp(w, l.x, l.y, l)?.naam ?? 'het midden'}.`)
  }

  function annuleer() { slinger.current = null }

  /* ── Een geselecteerd lichaam aanpassen ───────────────────────────────── */

  const gekozen = wereld.current.lichamen.find(l => l.id === selectie) ?? null
  /* Alleen iets dat zwaarder is kan de baas zijn: de zon draait niet om Venus. */
  const baas = gekozen && wereld.current.lichamen.some(l => l.m > gekozen.m)
    ? baasOp({ ...wereld.current, lichamen: wereld.current.lichamen.filter(l => l.m > gekozen.m) } as Wereld, gekozen.x, gekozen.y)
    : null

  function zwaarte(f: number) {
    if (!gekozen) return
    const oud = gekozen.soort
    gekozen.m = Math.min(20, Math.max(1e-9, gekozen.m * f))
    gekozen.soort = soortVan(gekozen.m)
    if (gekozen.soort !== oud) {
      gekozen.r = straalVan(gekozen.soort, gekozen.m)
      gekozen.kleur = kleurBij(gekozen.soort, gekozen.m, gekozen.kleur)
      meld(gekozen.soort === 'ster' ? `${gekozen.naam} is nu zo zwaar dat hij als ster gaat branden.` : `${gekozen.naam} is nu een ${SOORTNAAM[gekozen.soort]}.`)
    } else if (gekozen.soort === 'ster') {
      gekozen.kleur = kleurBij('ster', gekozen.m)
    }
    setTik(n => n + 1)
  }
  function weg() {
    if (!gekozen) return
    wereld.current.lichamen = wereld.current.lichamen.filter(l => l !== gekozen)
    meld(`${gekozen.naam} is weggehaald.`)
    setSelectie(null)
  }

  const w = wereld.current
  const breedte = beeld.current ? camera(beeld.current.b).aePerPx * beeld.current.b.w : scene.schaal * 2

  return (
    <div className={`pl ${archivo.variable}`}>
      <a href="#pl-main" className="skip-link">Ga naar hoofdinhoud</a>
      <PlateHead total={SCENES.length} edition={editionLabel()} current="spellen" totalLabel="wat-als-vragen" />

      <main id="pl-main" tabIndex={-1} className="pl-stack">
        <section className="pl-wrap" aria-labelledby="zb-t">
          <div className="pl-band">
            <div className="pl-band__t">
              <h1 id="zb-t" className="pl-h2">Ruimtezandbak</h1>
              <span className="pl-label">Bouw je eigen zonnestelsel</span>
            </div>
            <Link href="/spellen/" className="pl-btn">Alle spellen</Link>
          </div>

          <p className="pl-hf__lede">
            Zet sterren, planeten en manen neer en kijk hoe de zwaartekracht hun banen bepaalt. Begin met een
            van de vragen hieronder, of bouw zelf iets. Alles wordt echt doorgerekend, met dezelfde natuurwetten
            als in het echte zonnestelsel.
          </p>

          <div className="zb-scenes" role="group" aria-label="Kies een beginstand">
            {SCENES.map(s => (
              <button key={s.id} type="button" aria-pressed={s.id === sceneId} onClick={() => { laad(s); telGebeurtenis('zandbak-scene', s.id) }}>
                {s.knop}
              </button>
            ))}
          </div>

          <div className="zb">
            <figure className="zb__fig">
              <div className="zb__vak">
                <canvas
                  ref={canvas}
                  className="zb__canvas"
                  role="img"
                  aria-label={`${scene.titel}. ${w.lichamen.length} hemellichamen: ${w.lichamen.map(l => l.naam).join(', ')}.`}
                  onPointerDown={neer}
                  onPointerMove={beweeg}
                  onPointerUp={los}
                  onPointerCancel={annuleer}
                />
              </div>

              <div className="zb__balk">
                <span className="pl-label">Verstreken <span className="pl-num pl-live">{tijdTekst(w.t)}</span></span>
                <span className="pl-label">1 seconde = <span className="pl-num">{snelheidTekst(scene.dagenPerSec * TEMPO[tempo])}</span>{vertraagd.current && loopt ? ' (even trager, het is druk)' : ''}</span>
                <span className="pl-label">Beeld <span className="pl-num">{afstandTekst(breedte)}</span> breed</span>
              </div>

              <p className="zb__melding pl-body-s" role="status" aria-live="polite">
                {melding && Date.now() - melding.t < 7000 ? melding.tekst : ' '}
              </p>

              <div className="zb__bediening">
                <div className="zb__groep">
                  <p className="pl-label">Neerzetten</p>
                  <div className="pl-seg pl-seg--tap zb-gereedschap" data-smal="2" style={{ ['--kol' as string]: 4 }} role="group" aria-label="Wat zet je neer?">
                    {GEREEDSCHAP.map(s => (
                      <button key={s} type="button" aria-pressed={gereedschap === s} onClick={() => setGereedschap(s)}>
                        <Pixel soort={s} /> {STANDAARD[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="zb__groep">
                  <p className="pl-label">Tijd</p>
                  <div className="pl-seg pl-seg--tap" style={{ ['--kol' as string]: 3 }} role="group" aria-label="Tijd">
                    <button type="button" aria-pressed={!loopt} onClick={() => setLoopt(v => !v)}>{loopt ? 'Pauze' : 'Verder'}</button>
                    <button type="button" disabled={tempo === 0} onClick={() => setTempo(t => Math.max(0, t - 1))}>Trager</button>
                    <button type="button" disabled={tempo === TEMPO.length - 1} onClick={() => setTempo(t => Math.min(TEMPO.length - 1, t + 1))}>Sneller</button>
                  </div>
                </div>

                <div className="zb__groep">
                  <p className="pl-label">Beeld</p>
                  <div className="pl-seg pl-seg--tap" data-smal="2" style={{ ['--kol' as string]: 4 }} role="group" aria-label="Beeld">
                    <button type="button" aria-label="Uitzoomen" disabled={zoom === 0} onClick={() => setZoom(z => Math.max(0, z - 1))}>Verder weg</button>
                    <button type="button" aria-label="Inzoomen" disabled={zoom === ZOOM.length - 1} onClick={() => setZoom(z => Math.min(ZOOM.length - 1, z + 1))}>Dichterbij</button>
                    <button type="button" aria-pressed={sporen} onClick={() => { setSporen(v => !v); w.lichamen.forEach(l => { l.spoor = [] }) }}>Sporen</button>
                    <button type="button" aria-pressed={namen} onClick={() => setNamen(v => !v)}>Namen</button>
                  </div>
                </div>

                <div className="zb__groep">
                  <p className="pl-label">Opnieuw</p>
                  <div className="pl-seg pl-seg--tap" role="group" aria-label="Opnieuw">
                    <button type="button" onClick={() => laad(scene)}>Beginstand</button>
                    <button type="button" onClick={() => { w.lichamen = []; setSelectie(null); meld('Alles is weg. Begin maar met een ster.'); setGereedschap('ster') }}>Alles wissen</button>
                  </div>
                </div>
              </div>
            </figure>

            <div className="zb__kolom">
              {gekozen ? (
                <div className="zb-info">
                  <div className="zb-info__kop">
                    <p className="pl-label">Gekozen</p>
                    <button type="button" className="zb-info__sluit" onClick={() => setSelectie(null)} aria-label="Sluiten">Sluiten</button>
                  </div>
                  <h2 className="zb-info__naam">{gekozen.naam}</h2>
                  <dl className="zb-info__lijst">
                    <div><dt className="pl-label">Soort</dt><dd>{SOORTNAAM[gekozen.soort]}</dd></div>
                    <div><dt className="pl-label">Massa</dt><dd className="pl-num">{massaTekst(gekozen.m)}</dd></div>
                    {baas && <div><dt className="pl-label">Afstand tot {baas.naam}</dt><dd className="pl-num pl-live">{afstandTekst(Math.hypot(gekozen.x - baas.x, gekozen.y - baas.y))}</dd></div>}
                    {baas && <div><dt className="pl-label">Vaart</dt><dd className="pl-num pl-live">{Math.round(Math.hypot(gekozen.vx - baas.vx, gekozen.vy - baas.vy) * KMS * 10) / 10} km per seconde</dd></div>}
                  </dl>
                  <div className="zb-info__knoppen">
                    <button type="button" className="pl-btn" onClick={() => zwaarte(10)} disabled={gekozen.m >= 20}>10× zwaarder</button>
                    <button type="button" className="pl-btn" onClick={() => zwaarte(0.1)}>10× lichter</button>
                    <button type="button" className="pl-btn" onClick={weg}>Weghalen</button>
                  </div>
                </div>
              ) : null}

              <div className="zb-uitleg">
                <h2 className="zb-uitleg__t">{scene.titel}</h2>
                <p className="pl-body">{scene.uitleg}</p>
                <div className="pl-field">
                  <p className="pl-label">Probeer dit</p>
                  <p className="pl-body-s">{scene.probeer}</p>
                </div>
              </div>

              <div className="zb-uitleg">
                <p className="pl-label">Zo werkt het</p>
                <ol className="zb-stappen pl-body-s">
                  <li>Kies onder het scherm wat je wilt neerzetten.</li>
                  <li><b>Tik</b> op een lege plek: hij krijgt vanzelf een nette, ronde baan om wat daar het hardst trekt.</li>
                  <li><b>Sleep</b> vanaf een lege plek om zelf de richting en vaart te kiezen. Een langere pijl is harder. De stippellijn laat zien waar hij heen gaat.</li>
                  <li><b>Tik op iets dat er al staat</b> om te zien hoe zwaar en hoe snel het is, het zwaarder te maken of weg te halen.</li>
                </ol>
                <p className="pl-body-s zb-noot">De groottes zijn niet op schaal, anders zou je de planeten niet zien. Afstanden, massa&apos;s en snelheden kloppen wel.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pl-wrap">
          <p className="pl-body-s pl-hf__over">
            Elk hemellichaam trekt aan elk ander, precies volgens de zwaartekrachtwet van Newton. Botsen twee
            lichamen, dan smelten ze samen. Er wordt niets bewaard: na het sluiten begint alles opnieuw. Speel ook{' '}
            <Link href="/spellen/hemelfoto/" className="pl-voorw__a">Raad de hemelfoto</Link> of{' '}
            <Link href="/spellen/sterrenbeeld/" className="pl-voorw__a">Teken het sterrenbeeld</Link>.
          </p>
        </section>
      </main>

      <SiteFooter cols={FOOTER_COLS} note="Zwaartekracht berekend in je browser" />
    </div>
  )
}
