/* ══════════════════════════════════════════════════════════════════════════
   Ruimtezandbak: het pixelscherm

   Alles wordt pixel voor pixel in een klein buffer getekend (zo'n 200 bij
   200) en daarna met harde randen opgeschaald. Bollen krijgen licht van de
   dichtstbijzijnde ster, met een geordend raster (Bayer) op de schaduwgrens.
   Geen plaatjes, geen bibliotheek: de sprites worden elke beeldje berekend.
   ══════════════════════════════════════════════════════════════════════════ */

import type { Kleur, Lichaam, Wereld } from './zandbak'

export type Beeld = { w: number; h: number; px: Uint32Array }
export type Camera = { fx: number; fy: number; aePerPx: number }

/** '#rrggbb' naar een pixel (ABGR, zoals ImageData op little-endian). */
export function rgb(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return (0xff << 24 | (n & 0xff) << 16 | (n >> 8 & 0xff) << 8 | n >> 16) >>> 0
}
const R = (c: number) => c & 0xff, Gr = (c: number) => c >> 8 & 0xff, B = (c: number) => c >> 16 & 0xff
function meng(a: number, b: number, t: number): number {
  return (0xff << 24 | Math.round(B(a) + (B(b) - B(a)) * t) << 16 | Math.round(Gr(a) + (Gr(b) - Gr(a)) * t) << 8 | Math.round(R(a) + (R(b) - R(a)) * t)) >>> 0
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)]

export const KLEUR = {
  grond: rgb('#070915'),
  inkt: rgb('#EEF2FB'),
  inkt3: rgb('#868EB4'),
  act: rgb('#3DCFDF'),
  stamp: rgb('#B5D4F4'),
  warn: rgb('#E0685A'),
}

/* Drie tinten per materiaal: licht, basis, schaduw. */
type Tint = [number, number, number]
const T = (a: string, b: string, c: string): Tint => [rgb(a), rgb(b), rgb(c)]
const MATERIAAL: Record<Exclude<Kleur, 'zon' | 'rood' | 'wit'>, [Tint, Tint]> = {
  aarde:     [T('#7FB8F0', '#3B74C9', '#142449'), T('#9BD68A', '#4E9A5B', '#1B3326')],
  mars:      [T('#F2A577', '#C1572F', '#3F1910'), T('#D08A62', '#93401F', '#33140C')],
  venus:     [T('#FFF2CE', '#E2C483', '#4F3E22'), T('#F2DDA8', '#CBA866', '#45351C')],
  mercurius: [T('#D6CFC6', '#9A918A', '#33302D'), T('#B8B0A8', '#7A726C', '#2A2725')],
  rots:      [T('#E0B89A', '#A9785A', '#35251C'), T('#C49A7E', '#87604A', '#2B1E17')],
  reus:      [T('#F6E2BE', '#D4AA7A', '#45301D'), T('#DCAC7C', '#A66E46', '#382213')],
  ijsreus:   [T('#C9F3F5', '#6CC2D4', '#1A384C'), T('#A8E6EE', '#56AFC4', '#163244')],
  maan:      [T('#E6E6EE', '#A8A8B6', '#2F2F3A'), T('#C4C4D0', '#858593', '#272731')],
}
const STER: Record<'zon' | 'rood' | 'wit', number[]> = {
  zon:  ['#FFFFFF', '#FFF3B8', '#FFCF4D', '#F2992E', '#7A431A'].map(rgb),
  rood: ['#FFE6D2', '#FFA270', '#E35E3C', '#A93527', '#4E1A18'].map(rgb),
  wit:  ['#FFFFFF', '#E9F1FF', '#B9CDFF', '#7F9CF0', '#26357A'].map(rgb),
}

/** Kleur van het spoor: de basistint, wat gedempt. */
export function spoorKleur(k: Kleur): number {
  if (k === 'zon' || k === 'rood' || k === 'wit') return STER[k][3]
  return MATERIAAL[k][0][1]
}

/* ── Pixelbewerkingen ───────────────────────────────────────────────────── */

function zet(b: Beeld, x: number, y: number, c: number) {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return
  b.px[y * b.w + x] = c
}
function mengIn(b: Beeld, x: number, y: number, c: number, t: number) {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return
  const i = y * b.w + x
  b.px[i] = meng(b.px[i], c, t)
}

/** Bresenham. `elke` > 1 maakt er een stippellijn van. */
export function lijn(b: Beeld, x0: number, y0: number, x1: number, y1: number, c: number, elke = 1, t = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx + dy, n = 0
  for (let k = 0; k < 2000; k++) {
    if (n++ % elke === 0) (t >= 1 ? zet(b, x0, y0, c) : mengIn(b, x0, y0, c, t))
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
}

/* ── Een klein pixellettertype, 3 bij 5 ─────────────────────────────────── */

const FONT: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
  8: '111101111101111', 9: '111101111001110', '-': '000000111000000', ' ': '000000000000000',
}

export function tekst(b: Beeld, s: string, x: number, y: number, c: number) {
  const t = s.toUpperCase()
  for (let i = 0; i < t.length; i++) {
    const g = FONT[t[i]] ?? FONT[' ']
    for (let k = 0; k < 15; k++) if (g[k] === '1') zet(b, x + i * 4 + (k % 3), y + Math.floor(k / 3), c)
  }
}
export const tekstBreedte = (s: string) => s.length * 4 - 1

/* ── Sprites ────────────────────────────────────────────────────────────── */

function ruis(x: number, y: number, z: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
  return s - Math.floor(s)
}
/** Waardenruis, glad genoeg voor continenten van een paar pixels. */
function glad(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = ruis(xi, yi, z), b2 = ruis(xi + 1, yi, z), c = ruis(xi, yi + 1, z), d = ruis(xi + 1, yi + 1, z)
  return a + (b2 - a) * u + (c - a) * v + (a - b2 - c + d) * u * v
}

/** Welke van de twee tinten op dit stukje bol (u, v in -1..1). */
function patroon(k: Kleur, u: number, v: number, zaad: number, draai: number): 0 | 1 | 2 {
  switch (k) {
    case 'aarde':
      if (Math.abs(v) > 0.82) return 2
      return glad(u * 2.2 + draai + zaad, v * 2.2, zaad) > 0.56 ? 1 : 0
    case 'reus': case 'ijsreus': case 'venus':
      return Math.floor((v + 1) * (k === 'venus' ? 2.5 : 4) + Math.sin(u * 3 + draai) * 0.35 + zaad) % 2 ? 1 : 0
    default:
      return glad(u * 3 + zaad + draai, v * 3, zaad) > 0.62 ? 1 : 0
  }
}

/** Een belichte bol. (lx, ly) wijst naar de ster in schermrichting. */
export function bol(b: Beeld, cx: number, cy: number, r: number, k: Kleur, lx: number, ly: number, zaad: number, draai: number) {
  const ix = Math.round(cx), iy = Math.round(cy)
  if (k === 'zon' || k === 'rood' || k === 'wit') return
  const [t0, t1] = MATERIAAL[k]
  const ijs: Tint = [rgb('#FFFFFF'), rgb('#DCE5F0'), rgb('#4E596C')]
  const ll = Math.hypot(lx, ly, 0.55) || 1
  const Lx = lx / ll, Ly = ly / ll, Lz = 0.55 / ll
  const n = Math.ceil(r)
  if (r < 1.2) {
    zet(b, ix, iy, t0[0])
    return
  }
  for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) {
    const d2 = dx * dx + dy * dy
    if (d2 > r * r + 0.35) continue
    const nx = dx / r, ny = dy / r
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
    const h = nx * Lx + ny * Ly + nz * Lz
    const p = patroon(k, nx, ny, zaad, draai)
    const tint = p === 2 ? ijs : p === 1 ? t1 : t0
    const x = ix + dx, y = iy + dy
    let c: number
    if (h > 0.72) c = tint[0]
    else if (h > 0.22) c = tint[1]
    else if (h > -0.05) c = bayer(x, y) < (h + 0.05) / 0.27 ? tint[1] : tint[2]
    else c = tint[2]
    zet(b, x, y, c)
  }
}

/** Een ster: harde kern, ringen, een geraste gloed en vier stralen. */
export function ster(b: Beeld, cx: number, cy: number, r: number, k: 'zon' | 'rood' | 'wit', t: number) {
  const ix = Math.round(cx), iy = Math.round(cy)
  const p = STER[k]
  const gloed = r + 3.5
  const n = Math.ceil(gloed)
  for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) {
    const d = Math.hypot(dx, dy)
    const x = ix + dx, y = iy + dy
    if (d <= r * 0.42) zet(b, x, y, p[0])
    else if (d <= r * 0.72) zet(b, x, y, p[1])
    else if (d <= r - 0.35) zet(b, x, y, p[2])
    else if (d <= r + 0.4) zet(b, x, y, p[3])
    else if (d <= gloed) {
      const s = 1 - (d - r) / (gloed - r)
      if (bayer(x, y) < s * 0.55) mengIn(b, x, y, p[4], 0.85)
    }
  }
  /* Stralen die heel zacht ademen. */
  const lang = Math.round(r + 3 + Math.sin(t / 700) * 1.2)
  for (let i = Math.ceil(r + 1); i <= lang; i++) {
    const a = 0.75 * (1 - (i - r) / (lang - r + 1))
    mengIn(b, ix + i, iy, p[1], a); mengIn(b, ix - i, iy, p[1], a)
    mengIn(b, ix, iy + i, p[1], a); mengIn(b, ix, iy - i, p[1], a)
  }
}

/* ── Het hele beeld ─────────────────────────────────────────────────────── */

/** Schermstraal in pixels: niet op schaal, wel zwaarder is groter. */
export function schermStraal(l: Lichaam, vergroot = 1): number {
  if (l.soort === 'ster') return Math.max(3, Math.min(8, 5 + 1.6 * Math.log10(l.m)))
  return Math.max(1.5, Math.min(6.5, 1.2 + 1.05 * Math.log10(l.m / 3.694e-8))) * vergroot
}

export type Tekenopties = {
  t: number
  sporen: boolean
  namen: boolean
  vergroot: number
  selectie: number | null
  flitsen: { x: number; y: number; t0: number }[]
  slinger: null | { x0: number; y0: number; x1: number; y1: number; sleept: boolean; baan: number[]; r: number; kleur: Kleur }
  /** Sterren op de achtergrond: [x, y, helderheid] per ster, in 0..1. */
  stof: Float32Array
}

export function scherm(cam: Camera, b: Beeld, x: number, y: number): [number, number] {
  return [b.w / 2 + (x - cam.fx) / cam.aePerPx, b.h / 2 - (y - cam.fy) / cam.aePerPx]
}

export function teken(b: Beeld, w: Wereld, cam: Camera, o: Tekenopties) {
  b.px.fill(KLEUR.grond)

  /* Achtergrondsterren, een paar twinkelen. */
  for (let i = 0; i < o.stof.length; i += 3) {
    const x = Math.floor(o.stof[i] * b.w), y = Math.floor(o.stof[i + 1] * b.h), h = o.stof[i + 2]
    const fl = h > 0.85 ? 0.55 + 0.45 * Math.sin(o.t / 450 + i) : 1
    mengIn(b, x, y, KLEUR.stamp, (0.12 + h * 0.4) * fl)
  }

  /* Sporen, oud naar nieuw steeds feller. */
  if (o.sporen) for (const l of w.lichamen) {
    const s = l.spoor, n = s.length / 2
    if (n < 2) continue
    const c = spoorKleur(l.kleur)
    let [px, py] = [b.w / 2 + s[0] / cam.aePerPx, b.h / 2 - s[1] / cam.aePerPx]
    for (let i = 1; i < n; i++) {
      const qx = b.w / 2 + s[2 * i] / cam.aePerPx, qy = b.h / 2 - s[2 * i + 1] / cam.aePerPx
      if (Math.abs(qx - px) + Math.abs(qy - py) < 400) lijn(b, px, py, qx, qy, c, 1, 0.12 + 0.55 * (i / n))
      px = qx; py = qy
    }
  }

  /* De voorspelde baan bij slepen. */
  if (o.slinger?.sleept && o.slinger.baan.length > 3) {
    const s = o.slinger.baan
    for (let i = 2; i < s.length; i += 2) {
      const [ax, ay] = scherm(cam, b, s[i - 2], s[i - 1]), [qx, qy] = scherm(cam, b, s[i], s[i + 1])
      if ((i / 2) % 3 !== 0) lijn(b, ax, ay, qx, qy, KLEUR.stamp, 1, 0.75)
    }
  }

  /* Waar is het licht? Elke bol kijkt naar de ster die hem het felst beschijnt. */
  const sterren = w.lichamen.filter(l => l.soort === 'ster')
  const zwaarste = w.zwaarste()
  const namen: { naam: string; sx: number; sy: number; r: number }[] = []
  for (const l of [...w.lichamen].sort((a, c) => a.m - c.m).reverse()) {
    const [sx, sy] = scherm(cam, b, l.x, l.y)
    const r = schermStraal(l, l === zwaarste && l.soort !== 'ster' ? Math.min(o.vergroot, 2) : o.vergroot)
    const buiten = sx < -r || sy < -r || sx > b.w + r || sy > b.h + r
    if (buiten) {
      /* Een pijltje aan de rand, zodat niets zomaar verdwijnt. */
      const ex = Math.max(1, Math.min(b.w - 2, sx)), ey = Math.max(1, Math.min(b.h - 2, sy))
      const c = spoorKleur(l.kleur)
      zet(b, Math.round(ex), Math.round(ey), c)
      zet(b, Math.round(ex) + (sx < 0 ? 1 : sx > b.w ? -1 : 0), Math.round(ey) + (sy < 0 ? 1 : sy > b.h ? -1 : 0), c)
      continue
    }
    if (l.soort === 'ster') {
      ster(b, sx, sy, r, l.kleur as 'zon' | 'rood' | 'wit', o.t + l.id * 300)
    } else {
      let best: Lichaam | null = null, kracht = 0
      for (const s of sterren) { const k = s.m / ((s.x - l.x) ** 2 + (s.y - l.y) ** 2); if (k > kracht) { kracht = k; best = s } }
      const lx = best ? best.x - l.x : -1, ly = best ? -(best.y - l.y) : -1
      const ln = Math.hypot(lx, ly) || 1
      bol(b, sx, sy, r, l.kleur, lx / ln, ly / ln, l.id * 1.7, l.soort === 'maan' ? 0 : o.t / 9000)
    }
    if (o.namen) namen.push({ naam: l.naam.toUpperCase(), sx, sy, r })
    if (o.selectie === l.id) {
      const rr = r + 3.5
      const stappen = Math.max(16, Math.round(rr * 6))
      for (let i = 0; i < stappen; i++) {
        if ((i + Math.floor(o.t / 120)) % 4 > 1) continue
        const a = (i / stappen) * Math.PI * 2
        zet(b, Math.round(sx + Math.cos(a) * rr), Math.round(sy + Math.sin(a) * rr), KLEUR.act)
      }
    }
  }

  /* Namen pas na alle bollen, zwaarste eerst, en nooit over elkaar heen. */
  const bezet: [number, number, number, number][] = namen.map(n => [n.sx - n.r - 1, n.sy - n.r - 1, n.sx + n.r + 1, n.sy + n.r + 1])
  for (const n of namen) {
    const tw = tekstBreedte(n.naam)
    const plekken: [number, number][] = [
      [n.sx + n.r + 3, n.sy - 2], [n.sx - n.r - 3 - tw, n.sy - 2],
      [n.sx - tw / 2, n.sy + n.r + 3], [n.sx - tw / 2, n.sy - n.r - 8],
    ]
    for (const [px, py] of plekken.map(([x, y]) => [Math.round(x), Math.round(y)])) {
      if (px < 1 || py < 1 || px + tw > b.w - 1 || py + 5 > b.h - 1) continue
      const vak: [number, number, number, number] = [px - 1, py - 1, px + tw + 1, py + 6]
      if (bezet.some(o => vak[0] < o[2] && vak[2] > o[0] && vak[1] < o[3] && vak[3] > o[1])) continue
      bezet.push(vak)
      tekst(b, n.naam, px, py, KLEUR.inkt3)
      break
    }
  }

  /* Botsingen: een korte ring van pixels. */
  for (const f of o.flitsen) {
    const age = (o.t - f.t0) / 700
    if (age < 0 || age > 1) continue
    const [sx, sy] = scherm(cam, b, f.x, f.y)
    const rr = 2 + age * 12
    const c = meng(rgb('#FFF3B8'), rgb('#E0685A'), age)
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2
      if (ruis(i, Math.floor(o.t / 60), 3) < age * 0.7) continue
      zet(b, Math.round(sx + Math.cos(a) * rr), Math.round(sy + Math.sin(a) * rr), c)
    }
  }

  /* Neerzetten: spook op de plek, pijl naar waar je sleept. */
  if (o.slinger) {
    const s = o.slinger
    const ix = Math.round(s.x0), iy = Math.round(s.y0)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      zet(b, Math.round(ix + Math.cos(a) * (s.r + 2)), Math.round(iy + Math.sin(a) * (s.r + 2)), KLEUR.act)
    }
    if (s.sleept) {
      lijn(b, s.x0, s.y0, s.x1, s.y1, KLEUR.act)
      const a = Math.atan2(s.y1 - s.y0, s.x1 - s.x0)
      for (const d of [-2.5, 2.5]) lijn(b, s.x1, s.y1, s.x1 - Math.cos(a + d / 6) * 4, s.y1 - Math.sin(a + d / 6) * 4, KLEUR.act)
    }
  }
}
