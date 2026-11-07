// NightGazer reel house style (2026-11): the shared kit for every reel.
// Continuous camera, navy nebula, drifting star dust, glowing teal lines, soft stylised planets,
// bloom, coral numbers and chevrons. Everything is a pure function of time (seek-safe), seeded.
import * as THREE from "three";
import { rng, starfield } from "./space.js";

export { THREE };
export const KLEUR = {
  navy: "#0E1336", teal: "#5FD8EA", tealDiep: "#2FA7C4", koraal: "#FF6F7D", magenta: "#C2378F",
  creme: "#FFE9C9", wit: "#EEF2FB", paars: "#7B5CF0", geel: "#F5D547",
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => { x = clamp01(x); return x * x * x * (x * (x * 6 - 15) + 10); };
export const sine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x) => Math.pow(clamp01(x), 3);
// fade window: 0 → 1 between a..a+fi, 1 → 0 between b-fo..b
export const venster = (t, a, b, fi = 0.3, fo = 0.3) => clamp01((t - a) / fi) * clamp01((b - t) / fo);
const col3 = (hex) => new THREE.Color(hex);

const NOISE = /* glsl */ `
  float h3(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(h3(i+vec3(0,0,0)),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }
  float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<6;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }`;

// ── Timing: line windows from the voice-over (window.__TIJDEN) ───────────────────────────────
// L(i, f): time at fraction f of spoken line i (f may be <0 or >1 to step into the gaps).
export function tijdlijn() {
  const T = window.__TIJDEN;
  const L = (i, f = 0) => {
    const [a, b] = T.lijnen[Math.max(0, Math.min(T.lijnen.length - 1, i))];
    return a + (b - a) * f;
  };
  return { T, L, dur: T.dur, eind: T.lijnen[T.lijnen.length - 1][1] };
}

// ── Camera keys: {t, p:[x,y,z], l:[x,y,z], fov, roll, e:'sine'|'lin'|'out'|'in'} ────────────
export function camKeys(keys) {
  const E = { sine, lin: clamp01, out: easeOut, in: easeIn, smooth };
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3();
  return function apply(cam, t) {
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const A = keys[i], B = keys[Math.min(i + 1, keys.length - 1)];
    const k = B.t > A.t ? (E[B.e || "sine"])((t - A.t) / (B.t - A.t)) : 1;
    const v = (x) => (typeof x === "function" ? x(t) : x);
    pa.fromArray(v(A.p)); pb.fromArray(v(B.p)); la.fromArray(v(A.l)); lb.fromArray(v(B.l));
    cam.position.copy(pa).lerp(pb, t <= A.t ? 0 : k);
    const look = la.clone().lerp(lb, t <= A.t ? 0 : k);
    cam.fov = lerp(A.fov ?? 40, B.fov ?? A.fov ?? 40, t <= A.t ? 0 : k);
    const roll = lerp(A.roll ?? 0, B.roll ?? A.roll ?? 0, t <= A.t ? 0 : k);
    cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    if (A.up) cam.up.fromArray(v(A.up)).lerp(new THREE.Vector3().fromArray(v(B.up || A.up)), t <= A.t ? 0 : k).normalize();
    cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  };
}

// ── Navy nebula background (screen space, parallax from the camera direction) ────────────────
export function nevel({ seed = 1, helder = 1.0, tint = [0.0, 0.0, 0.0] } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uDir: { value: new THREE.Vector3() }, uSeed: { value: seed }, uHelder: { value: helder }, uT: { value: 0 },
                uTint: { value: new THREE.Vector3(...tint) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.999,1.); }`,
    fragmentShader: NOISE + /* glsl */ `
      uniform vec3 uDir; uniform float uSeed; uniform float uHelder; uniform float uT; uniform vec3 uTint; varying vec2 vUv;
      void main(){
        vec2 p = (vUv - .5) * vec2(1.0, 1.778);
        vec3 q = vec3(p * 2.2 + uDir.xy * 1.6, uDir.z * 0.8 + uSeed) + vec3(uT*0.01, 0., 0.);
        float n = fbm(q);
        float m = fbm(q * 2.3 + vec3(4.1, uSeed, 2.0));
        float w = fbm(q * 0.7 + vec3(8.0, 1.0, uSeed));
        vec3 base = vec3(0.007, 0.009, 0.028);
        vec3 cloud = mix(vec3(0.018, 0.026, 0.07), vec3(0.03, 0.032, 0.085), m);
        vec3 c = mix(base, cloud, smoothstep(0.35, 0.8, n) * 0.85);
        c += vec3(0.03, 0.018, 0.055) * smoothstep(0.55, 0.85, w) * 0.5;   // violet wisps
        c += vec3(0.01, 0.03, 0.045) * smoothstep(0.6, 0.9, m) * 0.6;     // teal haze
        c += uTint;
        float v = 1.0 - 0.55 * pow(length(p * vec2(1.0, 0.62)), 2.0);
        gl_FragColor = vec4(c * uHelder * v, 1.0);
      }`,
    depthWrite: false, depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10;
  mesh.userData.update = (cam, t) => {
    const d = new THREE.Vector3(); cam.getWorldDirection(d);
    mat.uniforms.uDir.value.set(Math.atan2(d.x, -d.z) * 0.5, Math.asin(Math.max(-1, Math.min(1, d.y))) * 0.5, 0);
    mat.uniforms.uT.value = t;
  };
  return mesh;
}

// ── Drifting star dust, streaked by camera velocity ─────────────────────────────────────────
export function stof({ seed = 9, n = 1400, box = 14, kleur = "#BFD4FF" } = {}) {
  const r = rng(seed);
  const base = new Float32Array(n * 3), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { base.set([(r() - 0.5) * box, (r() - 0.5) * box, (r() - 0.5) * box], i * 3); b[i] = 0.25 + Math.pow(r(), 3) * 0.9; }
  const pos = new Float32Array(n * 6), cols = new Float32Array(n * 6);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const lines = new THREE.LineSegments(g, m); lines.frustumCulled = false;
  const c = col3(kleur);
  // Points (always visible as dust) drawn as tiny soft sprites too.
  const ppos = new Float32Array(n * 3), psz = new Float32Array(n), ptint = new Float32Array(n * 3);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(ppos, 3));
  pg.setAttribute("size", new THREE.BufferAttribute(psz, 1));
  pg.setAttribute("tint", new THREE.BufferAttribute(ptint, 3));
  const pm = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `attribute float size; attribute vec3 tint; varying vec3 vT;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(size*60./max(-mv.z,.05),0.,6.); vT=tint; }`,
    fragmentShader: `varying vec3 vT; void main(){ vec2 p=gl_PointCoord-.5; float a=exp(-dot(p,p)*14.); if(a<.01) discard; gl_FragColor=vec4(vT*a,1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(pg, pm); pts.frustumCulled = false;
  const grp = new THREE.Group(); grp.add(lines, pts);
  // update(cam, vel, scale): vel = camera velocity in world units per second; scale = world size of the box
  grp.userData.update = (cam, vel, scale = 1, amount = 1) => {
    const cp = cam.position, half = box / 2;
    // streak = where the particle was 1/12 s ago relative to the camera (a long shutter), capped
    const tail = vel.clone().multiplyScalar(1 / 12);
    const tl = tail.length(), cap = box * scale * 0.25;
    if (tl > cap) tail.multiplyScalar(cap / tl);
    const streak = tail.length() / scale;
    for (let i = 0; i < n; i++) {
      let x = base[i * 3] - cp.x / scale, y = base[i * 3 + 1] - cp.y / scale, z = base[i * 3 + 2] - cp.z / scale;
      x = ((x % box) + box * 1.5) % box - half; y = ((y % box) + box * 1.5) % box - half; z = ((z % box) + box * 1.5) % box - half;
      const X = cp.x + x * scale, Y = cp.y + y * scale, Z = cp.z + z * scale;
      ppos.set([X, Y, Z], i * 3); psz[i] = b[i] * scale * 0.5 * amount;
      const d = Math.sqrt(x * x + y * y + z * z) / half; const fade = clamp01(1.0 - d) * amount;
      ptint.set([c.r * b[i] * fade * 0.8, c.g * b[i] * fade * 0.8, c.b * b[i] * fade * 0.8], i * 3);
      pos.set([X, Y, Z, X + tail.x, Y + tail.y, Z + tail.z], i * 6);
      const a = b[i] * fade * clamp01(streak / 0.25) * 0.6;
      cols.set([c.r * a, c.g * a, c.b * a, 0, 0, 0], i * 6);
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    pg.attributes.position.needsUpdate = true; pg.attributes.size.needsUpdate = true; pg.attributes.tint.needsUpdate = true;
  };
  return grp;
}

// ── Glow line: screen-space ribbon along a 3D polyline ──────────────────────────────────────
// opts: kleur, breedte (px half-width), kern (0..1 core share), dicht (closed loop),
// draw-on: setKop(head 0..1), setStaart(len 0..1, 1 = full), basis (alpha of the undrawn rest), wrap (trail on a loop)
export function lijn(punten, { kleur = KLEUR.teal, breedte = 7, alpha = 1, dicht = false, basis = 0, wrap = false, streep = 0 } = {}) {
  const pts = dicht ? [...punten, punten[0]] : punten;
  const n = pts.length;
  const pos = new Float32Array(n * 2 * 3), prev = new Float32Array(n * 2 * 3), next = new Float32Array(n * 2 * 3);
  const side = new Float32Array(n * 2), u = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[i > 0 ? i - 1 : (dicht ? n - 2 : 0)], b = pts[i < n - 1 ? i + 1 : (dicht ? 1 : n - 1)];
    for (let s = 0; s < 2; s++) {
      const j = i * 2 + s;
      pos.set([p.x, p.y, p.z], j * 3); prev.set([a.x, a.y, a.z], j * 3); next.set([b.x, b.y, b.z], j * 3);
      side[j] = s ? 1 : -1; u[j] = i / (n - 1);
    }
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("prev", new THREE.BufferAttribute(prev, 3));
  g.setAttribute("next", new THREE.BufferAttribute(next, 3));
  g.setAttribute("side", new THREE.BufferAttribute(side, 1));
  g.setAttribute("u", new THREE.BufferAttribute(u, 1));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uRes: { value: new THREE.Vector2(1080, 1920) }, uW: { value: breedte }, uCol: { value: col3(kleur) },
                uA: { value: alpha }, uKop: { value: 1 }, uLen: { value: 1 }, uBasis: { value: basis }, uWrap: { value: wrap ? 1 : 0 },
                uStreep: { value: streep } },
    vertexShader: /* glsl */ `
      uniform vec2 uRes; uniform float uW; attribute vec3 prev; attribute vec3 next; attribute float side; attribute float u;
      varying float vS; varying float vU;
      void main(){
        mat4 m = projectionMatrix * modelViewMatrix;
        vec4 c = m * vec4(position,1.), a = m * vec4(prev,1.), b = m * vec4(next,1.);
        float cw = max(c.w, 1e-3);
        vec2 cs = c.xy / cw * uRes, as = a.xy / max(a.w,1e-3) * uRes, bs = b.xy / max(b.w,1e-3) * uRes;
        vec2 d1 = cs - as, d2 = bs - cs; vec2 dir;
        if (length(d1) < 1e-3) dir = normalize(d2 + 1e-6); else if (length(d2) < 1e-3) dir = normalize(d1); else dir = normalize(normalize(d1) + normalize(d2));
        vec2 nrm = vec2(-dir.y, dir.x);
        c.xy += nrm * side * uW * 2.0 / uRes * cw;
        gl_Position = c; vS = side; vU = u;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCol; uniform float uA; uniform float uKop; uniform float uLen; uniform float uBasis; uniform float uWrap; uniform float uStreep;
      varying float vS; varying float vU;
      void main(){
        float x = abs(vS);
        float core = 1.0 - smoothstep(0.16, 0.34, x);
        float glow = exp(-x * x * 5.0) * 0.5;
        float d = uWrap > 0.5 ? fract(uKop - vU + 1.0) : uKop - vU;
        float trail = (d >= 0.0 && d <= uLen) ? (uLen >= 0.999 ? 1.0 : pow(1.0 - d / uLen, 1.4)) : 0.0;
        float a = max(trail, uBasis);
        if (uStreep > 0.0) a *= step(0.45, fract(vU * uStreep));
        vec3 c = uCol * (core * 1.25 + glow) + vec3(1.0) * core * 0.35 * trail;
        gl_FragColor = vec4(c * a * uA, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  mesh.userData.set = ({ kop, len, alpha, basis, breedte, kleur } = {}) => {
    if (kop != null) mat.uniforms.uKop.value = kop;
    if (len != null) mat.uniforms.uLen.value = len;
    if (alpha != null) mat.uniforms.uA.value = alpha;
    if (basis != null) mat.uniforms.uBasis.value = basis;
    if (breedte != null) mat.uniforms.uW.value = breedte;
    if (kleur != null) mat.uniforms.uCol.value.set(kleur);
  };
  return mesh;
}
export function cirkel(r, n = 256, { y = 0, rx = r, rz = r, cx = 0, cz = 0 } = {}) {
  const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push(new THREE.Vector3(cx + Math.cos(a) * rx, y, cz + Math.sin(a) * rz)); } return out;
}

// ── Soft stylised sphere: 'aarde' | 'maan' | 'zon' | 'mars' ────────────────────────────────
export function bol(soort, { straal = 1, seed = 1, zon = new THREE.Vector3(1, 0.3, 0.5) } = {}) {
  const T = { aarde: 0, maan: 1, zon: 2, mars: 3 }[soort];
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: zon.clone().normalize() }, uSoort: { value: T }, uSeed: { value: seed }, uRim: { value: col3(KLEUR.teal) },
                uRimK: { value: soort === "maan" ? 0.35 : 1.0 }, uLicht: { value: 1.0 }, uMarker: { value: new THREE.Vector3(0, 0, 0) },
                uMarkerA: { value: 0 } },
    vertexShader: /* glsl */ `varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(position,1.)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW,1.); }`,
    fragmentShader: NOISE + /* glsl */ `
      uniform vec3 uSun; uniform int uSoort; uniform float uSeed; uniform vec3 uRim; uniform float uRimK; uniform float uLicht;
      uniform vec3 uMarker; uniform float uMarkerA;
      varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 p = normalize(vP); vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        vec3 alb; float emis = 0.0;
        if (uSoort == 0) {
          float land = smoothstep(0.50, 0.535, fbm(p * 2.1 + uSeed));
          float dry = smoothstep(0.45, 0.7, fbm(p * 4.0 + 3.0));
          vec3 ocean = mix(vec3(0.03,0.12,0.32), vec3(0.06,0.23,0.50), fbm(p*3.0+7.0));
          vec3 ground = mix(vec3(0.15,0.33,0.19), vec3(0.50,0.43,0.30), dry);
          alb = mix(ocean, ground, land);
          alb = mix(alb, vec3(0.92,0.95,1.0), smoothstep(0.94, 0.97, abs(p.y)));
          float cl = smoothstep(0.6, 0.8, fbm(p * 3.6 + vec3(1.0, uSeed, 2.0)));
          alb = mix(alb, vec3(0.92), cl * 0.5);
        } else if (uSoort == 1) {
          float mar = smoothstep(0.48, 0.62, fbm(p * 1.6 + uSeed));
          float cr = fbm(p * 9.0 + 2.0);
          alb = mix(vec3(0.70,0.70,0.72), vec3(0.40,0.41,0.45), mar) * (0.82 + 0.3 * cr);
          float pits = smoothstep(0.66, 0.72, fbm(p * 18.0 + 5.0)); alb *= 1.0 - pits * 0.25;
        } else if (uSoort == 3) {
          alb = mix(vec3(0.62,0.28,0.15), vec3(0.85,0.52,0.32), fbm(p * 3.0 + uSeed));
        } else {
          float g = fbm(p * 6.0 + uSeed);
          alb = mix(vec3(1.0,0.86,0.66), vec3(1.0,0.97,0.9), g); emis = 1.0;
        }
        vec3 col;
        if (emis > 0.5) {
          float limb = pow(clamp(dot(N, V), 0.0, 1.0), 0.45);
          col = alb * (0.75 + 0.9 * limb) * 2.2;
        } else {
          float ndl = dot(N, uSun);
          float wrap = clamp((ndl + 0.25) / 1.25, 0.0, 1.0);
          float dif = smoothstep(0.0, 1.0, wrap);
          col = alb * (0.07 + 0.9 * dif) * uLicht;
          col += vec3(0.02, 0.03, 0.07);
          float fr = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
          col += uRim * fr * uRimK * (0.25 + 0.9 * smoothstep(-0.3, 0.6, ndl));
        }
        // surface marker (a coral dot, used to show rotation)
        float md = distance(p, normalize(uMarker));
        col = mix(col, vec3(1.0, 0.36, 0.42) * 1.05, uMarkerA * (1.0 - smoothstep(0.055, 0.075, md)));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(straal, 128, 96), mat);
  mesh.userData.mat = mat;
  mesh.userData.setZon = (v) => mat.uniforms.uSun.value.copy(v).normalize();
  return mesh;
}

// ── Additive glow sprite (billboard) ───────────────────────────────────────────────────────
export function gloed(kleur = KLEUR.creme, { grootte = 1, scherp = 4.0, alpha = 1 } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: col3(kleur) }, uA: { value: alpha }, uK: { value: scherp } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; vec4 mv = modelViewMatrix * vec4(0.,0.,0.,1.);
      vec2 s = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz)); mv.xy += position.xy * s; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uA; uniform float uK; varying vec2 vUv;
      void main(){ float r = length(vUv - .5) * 2.; float a = exp(-r * r * uK) * (1.0 - smoothstep(0.85, 1.0, r)); gl_FragColor = vec4(uCol * a * uA, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(grootte, grootte), mat);
  m.frustumCulled = false;
  m.userData.set = ({ alpha, kleur } = {}) => { if (alpha != null) mat.uniforms.uA.value = alpha; if (kleur) mat.uniforms.uCol.value.set(kleur); };
  return m;
}

// ── Sun: core sphere + layered glow ────────────────────────────────────────────────────────
export function zon({ straal = 1 } = {}) {
  const g = new THREE.Group();
  const kern = bol("zon", { straal });
  const g1 = gloed(KLEUR.creme, { grootte: straal * 5, scherp: 5, alpha: 0.9 });
  const g2 = gloed("#FFB27A", { grootte: straal * 11, scherp: 6, alpha: 0.28 });
  g.add(g2, g1, kern);
  return g;
}

// ── Gravity grid: a polar/cartesian line grid that dips into wells (magenta) ────────────────
export function zwaartekrachtRaster({ grootte = 20, lijnen = 22, kleur = KLEUR.magenta, putten = [] } = {}) {
  const grp = new THREE.Group();
  const diepte = (x, z) => { let d = 0; for (const w of putten) { const r2 = (x - w.x) ** 2 + (z - w.z) ** 2; d -= w.diep / Math.sqrt(r2 / (w.w * w.w) + 1); } return d; };
  const half = grootte / 2, steps = 120;
  for (let i = 0; i <= lijnen; i++) {
    const c = -half + (i / lijnen) * grootte;
    const a = [], b = [];
    for (let s = 0; s <= steps; s++) { const v = -half + (s / steps) * grootte; a.push(new THREE.Vector3(c, diepte(c, v), v)); b.push(new THREE.Vector3(v, diepte(v, c), c)); }
    grp.add(lijn(a, { kleur, breedte: 3.5, alpha: 0.55 }), lijn(b, { kleur, breedte: 3.5, alpha: 0.55 }));
  }
  grp.userData.alpha = (al) => grp.children.forEach((m) => m.userData.set({ alpha: al * 0.55 }));
  return grp;
}

export { starfield, rng };

// ── Bloom + grade (render target → blur chain → composite) ─────────────────────────────────
export function nabewerking(renderer, W, H) {
  const opt = { type: THREE.HalfFloatType, depthBuffer: true };
  const rtScene = new THREE.WebGLRenderTarget(W, H, { ...opt, samples: 4 });
  const lv = [2, 4, 8, 16].map((d) => [new THREE.WebGLRenderTarget(W / d, H / d, { type: THREE.HalfFloatType }), new THREE.WebGLRenderTarget(W / d, H / d, { type: THREE.HalfFloatType })]);
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mk = (frag, uniforms) => { const s = new THREE.Scene(); const m = new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({ uniforms, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`, fragmentShader: frag, depthTest: false, depthWrite: false })); s.add(m); return { s, m }; };
  const bright = mk(`uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th + 0.6, l), 1.); }`, { t: { value: null }, th: { value: 0.55 } });
  const blur = mk(`uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){
      vec3 c = texture2D(t, vUv).rgb * 0.2270270270;
      c += (texture2D(t, vUv + d * 1.3846153846).rgb + texture2D(t, vUv - d * 1.3846153846).rgb) * 0.3162162162;
      c += (texture2D(t, vUv + d * 3.2307692308).rgb + texture2D(t, vUv - d * 3.2307692308).rgb) * 0.0702702703;
      gl_FragColor = vec4(c, 1.); }`, { t: { value: null }, d: { value: new THREE.Vector2() } });
  const down = mk(`uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb, 1.); }`, { t: { value: null } });
  const comp = mk(`uniform sampler2D s; uniform sampler2D b0; uniform sampler2D b1; uniform sampler2D b2; uniform sampler2D b3; uniform float k; uniform float exp0; varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0., 1.); }
      void main(){
        vec3 c = texture2D(s, vUv).rgb;
        vec3 b = texture2D(b0, vUv).rgb * 0.5 + texture2D(b1, vUv).rgb * 0.7 + texture2D(b2, vUv).rgb * 0.9 + texture2D(b3, vUv).rgb * 1.1;
        c = (c + b * k) * exp0;
        c = aces(c);
        c = pow(c, vec3(1.0/2.2));
        gl_FragColor = vec4(c, 1.); }`, { s: { value: null }, b0: { value: null }, b1: { value: null }, b2: { value: null }, b3: { value: null }, k: { value: 0.55 }, exp0: { value: 1.15 } });
  return {
    rt: rtScene,
    begin() { renderer.setRenderTarget(rtScene); renderer.setClearColor(0x000000, 1); renderer.clear(); },
    end({ bloei = 0.55, belichting = 1.15, drempel = 0.55 } = {}) {
      bright.m.material.uniforms.t.value = rtScene.texture; bright.m.material.uniforms.th.value = drempel;
      renderer.setRenderTarget(lv[0][0]); renderer.render(bright.s, qcam);
      for (let i = 0; i < lv.length; i++) {
        if (i > 0) { down.m.material.uniforms.t.value = lv[i - 1][0].texture; renderer.setRenderTarget(lv[i][0]); renderer.render(down.s, qcam); }
        const w = lv[i][0].width, h = lv[i][0].height;
        blur.m.material.uniforms.t.value = lv[i][0].texture; blur.m.material.uniforms.d.value.set(1 / w, 0); renderer.setRenderTarget(lv[i][1]); renderer.render(blur.s, qcam);
        blur.m.material.uniforms.t.value = lv[i][1].texture; blur.m.material.uniforms.d.value.set(0, 1 / h); renderer.setRenderTarget(lv[i][0]); renderer.render(blur.s, qcam);
      }
      const u = comp.m.material.uniforms;
      u.s.value = rtScene.texture; u.b0.value = lv[0][0].texture; u.b1.value = lv[1][0].texture; u.b2.value = lv[2][0].texture; u.b3.value = lv[3][0].texture;
      u.k.value = bloei; u.exp0.value = belichting;
      renderer.setRenderTarget(null); renderer.render(comp.s, qcam);
    },
  };
}

// ── 2D overlay (coral numbers, chevrons, arrows) drawn on a canvas above the GL canvas ──────
export function overlay(canvas, camera) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const v = new THREE.Vector3();
  const api = {
    ctx,
    wis() { ctx.clearRect(0, 0, W, H); },
    proj(p) { v.copy(p).project(camera); return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z < 1]; },
    tekst(str, x, y, { maat = 96, kleur = KLEUR.koraal, alpha = 1, schaal = 1, gewicht = 800, uitlijn = "center", gloei = 28, mono = false } = {}) {
      if (alpha <= 0.001) return;
      ctx.save(); ctx.globalAlpha = clamp01(alpha); ctx.translate(x, y); ctx.scale(schaal, schaal);
      ctx.font = mono ? `500 ${maat}px "JetBrains Mono", monospace` : `${gewicht} ${maat}px Archivo, sans-serif`;
      ctx.textAlign = uitlijn; ctx.textBaseline = "middle";
      ctx.shadowColor = kleur; ctx.shadowBlur = gloei; ctx.fillStyle = kleur; ctx.fillText(str, 0, 0);
      ctx.shadowBlur = 0; ctx.globalAlpha = clamp01(alpha) * 0.55; ctx.fillStyle = "#fff"; ctx.fillText(str, 0, 0);
      ctx.restore();
    },
    chevron(x, y, hoek, maat = 40, { kleur = KLEUR.wit, alpha = 1, dik = 9 } = {}) {
      if (alpha <= 0.001) return;
      ctx.save(); ctx.globalAlpha = clamp01(alpha); ctx.translate(x, y); ctx.rotate(hoek);
      ctx.strokeStyle = kleur; ctx.lineWidth = dik; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.shadowColor = kleur; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(-maat * 0.35, -maat * 0.5); ctx.lineTo(maat * 0.25, 0); ctx.lineTo(-maat * 0.35, maat * 0.5); ctx.stroke();
      ctx.restore();
    },
    // chevrons around an ellipse (screen space), rotating with `fase`, pointing along the direction of travel
    ring(cx, cy, rx, ry, aantal, fase, { kleur = KLEUR.wit, alpha = 1, maat = 38, richting = 1 } = {}) {
      for (let i = 0; i < aantal; i++) {
        const a = fase + (i / aantal) * Math.PI * 2;
        const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        const tx = -Math.sin(a) * rx * richting, ty = Math.cos(a) * ry * richting;
        api.chevron(x, y, Math.atan2(ty, tx), maat, { kleur, alpha });
      }
    },
    dubbel(x, y, hoek, maat, opts) { // ››
      api.chevron(x - Math.cos(hoek) * maat * 0.32, y - Math.sin(hoek) * maat * 0.32, hoek, maat, opts);
      api.chevron(x + Math.cos(hoek) * maat * 0.32, y + Math.sin(hoek) * maat * 0.32, hoek, maat, opts);
    },
  };
  return api;
}
