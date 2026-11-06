// NightGazer — procedural space kit for HyperFrames (Three.js, seek-safe, seeded).
// Everything is a pure function of (time, seed). No Date, no rAF, no Math.random.
import * as THREE from "three";

export { THREE };

// ── Seeded RNG (mulberry32) ────────────────────────────────────────────────
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r) { // Box–Muller from a seeded source
  const u = Math.max(r(), 1e-9), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── Soft round sprite for point stars ─────────────────────────────────────
const POINT_VS = /* glsl */ `
  attribute float size;
  attribute vec3 tint;
  uniform float uScale;
  uniform float uExposure;
  varying vec3 vTint;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float d = max(-mv.z, 0.001);
    gl_PointSize = clamp(size * uScale / d, 0.0, 220.0);
    vTint = tint * uExposure;
    vFade = smoothstep(0.02, 0.6, d);
  }`;
const POINT_FS = /* glsl */ `
  varying vec3 vTint;
  varying float vFade;
  uniform float uSoft;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float r2 = dot(p, p) * 4.0;
    float core = exp(-r2 * uSoft);
    if (core < 0.004) discard;
    gl_FragColor = vec4(vTint * core * vFade, 1.0);
  }`;

function pointsMaterial({ scale = 300, soft = 6.0, exposure = 1.0, blending = THREE.AdditiveBlending } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: scale }, uSoft: { value: soft }, uExposure: { value: exposure } },
    vertexShader: POINT_VS, fragmentShader: POINT_FS,
    transparent: true, depthWrite: false, blending,
  });
}

// ── Starfield: several depth shells, so a moving camera gets real parallax ─
export function starfield({ seed = 7, layers = [
  { count: 9000, rMin: 60, rMax: 90, size: 1.6, bright: 0.55 },
  { count: 5000, rMin: 30, rMax: 60, size: 1.9, bright: 0.7 },
  { count: 2500, rMin: 14, rMax: 30, size: 2.2, bright: 0.85 },
  { count: 500,  rMin: 6,  rMax: 14, size: 2.8, bright: 1.0 },
] } = {}) {
  const group = new THREE.Group();
  const r = rng(seed);
  layers.forEach((L) => {
    const pos = new Float32Array(L.count * 3), size = new Float32Array(L.count), tint = new Float32Array(L.count * 3);
    for (let i = 0; i < L.count; i++) {
      // uniform on a sphere shell
      const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const rad = L.rMin + (L.rMax - L.rMin) * r();
      pos.set([s * Math.cos(th) * rad, u * rad, s * Math.sin(th) * rad], i * 3);
      const mag = Math.pow(r(), 6);                 // few bright, many faint
      size[i] = L.size * (0.6 + mag * 3.2) * rad;    // size scaled by distance → constant-ish on screen
      const b = L.bright * (0.25 + mag * 1.6);
      const warm = r();                              // slight colour-temperature scatter (graded later)
      tint.set([b * (0.9 + 0.1 * warm), b * 0.96, b * (1.05 - 0.1 * warm)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("size", new THREE.BufferAttribute(size, 1));
    g.setAttribute("tint", new THREE.BufferAttribute(tint, 3));
    const pts = new THREE.Points(g, pointsMaterial({ scale: 1.0, soft: 7.0 }));
    pts.frustumCulled = false;
    group.add(pts);
  });
  group.userData.setExposure = (e) => group.children.forEach((c) => (c.material.uniforms.uExposure.value = e));
  return group;
}

// ── Spiral galaxy: logarithmic arms, bulge, disc, dust lanes ───────────────
export function galaxy({ seed = 21, stars = 150000, arms = 2, pitchDeg = 13, radius = 10, dust = 14000, glow = 26000 } = {}) {
  const group = new THREE.Group();
  const r = rng(seed);
  const k = 1 / Math.tan((pitchDeg * Math.PI) / 180);
  const pos = new Float32Array(stars * 3), size = new Float32Array(stars), tint = new Float32Array(stars * 3);
  for (let i = 0; i < stars; i++) {
    const kind = r();
    let x, y, z, br, sz, col;
    if (kind < 0.22) { // bulge: dense, warm, ellipsoidal
      const rad = Math.abs(gauss(r)) * radius * 0.13;
      const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      x = s * Math.cos(th) * rad; z = s * Math.sin(th) * rad; y = u * rad * 0.55;
      br = 0.55 + r() * 0.5; sz = 0.035 + r() * 0.035; col = [1.0, 0.93, 0.82];
    } else { // disc + arms
      const rad = radius * (0.08 + Math.pow(r(), 0.85) * 0.92);
      const arm = Math.floor(r() * arms);
      const inArm = r() < 0.72;
      const base = Math.log(rad / (radius * 0.08)) * k + (arm / arms) * Math.PI * 2;
      const clump = Math.sin(rad * 2.3 + arm * 1.7) * 0.5 + 0.5;  // knots along the arm
      const spread = inArm ? gauss(r) * (0.09 + 0.14 * (rad / radius)) * (0.55 + clump) : r() * Math.PI * 2;
      const th = base + spread;
      x = Math.cos(th) * rad; z = Math.sin(th) * rad;
      y = gauss(r) * radius * 0.012 * (1.4 - rad / radius);
      const young = inArm && r() < 0.35;
      br = (inArm ? 0.42 : 0.2) * (0.6 + r() * 0.8) * (young ? 1.8 : 1.0);
      sz = (young ? 0.05 : 0.03) * (0.7 + r() * 0.8);
      col = young ? [0.78, 0.88, 1.0] : [0.96, 0.95, 0.92];
    }
    pos.set([x, y, z], i * 3);
    size[i] = sz;
    tint.set([col[0] * br, col[1] * br, col[2] * br], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("size", new THREE.BufferAttribute(size, 1));
  g.setAttribute("tint", new THREE.BufferAttribute(tint, 3));
  const lum = new THREE.Points(g, pointsMaterial({ scale: 900, soft: 5.0 }));
  lum.frustumCulled = false;
  group.add(lum);


  // Diffuse light: large, faint sprites that turn the arms into luminous cloud instead of dots.
  const gpos = new Float32Array(glow * 3), gsize = new Float32Array(glow), gtint = new Float32Array(glow * 3);
  for (let i = 0; i < glow; i++) {
    const bul = r() < 0.18;
    let x, y, z, b, c;
    if (bul) {
      const rad = Math.abs(gauss(r)) * radius * 0.1;
      const th = r() * Math.PI * 2;
      x = Math.cos(th) * rad; z = Math.sin(th) * rad; y = gauss(r) * rad * 0.4;
      b = 0.022; c = [1.0, 0.9, 0.78];
    } else {
      const rad = radius * (0.1 + Math.pow(r(), 0.9) * 0.85);
      const arm = Math.floor(r() * arms);
      const th = Math.log(rad / (radius * 0.08)) * k + (arm / arms) * Math.PI * 2 + gauss(r) * 0.2;
      x = Math.cos(th) * rad; z = Math.sin(th) * rad; y = gauss(r) * radius * 0.01;
      b = 0.011 * (1.2 - rad / radius); c = [0.82, 0.9, 1.0];
    }
    gpos.set([x, y, z], i * 3);
    gsize[i] = 0.5 + r() * 0.7;
    gtint.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
  }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute("position", new THREE.BufferAttribute(gpos, 3));
  gg.setAttribute("size", new THREE.BufferAttribute(gsize, 1));
  gg.setAttribute("tint", new THREE.BufferAttribute(gtint, 3));
  const haze = new THREE.Points(gg, pointsMaterial({ scale: 900, soft: 2.2 }));
  haze.frustumCulled = false;
  haze.renderOrder = -1;
  group.add(haze);

  // Dust lanes: dark sprites on the inner edge of each arm, drawn normally over the light.
  const dpos = new Float32Array(dust * 3), dsize = new Float32Array(dust), dtint = new Float32Array(dust * 3);
  for (let i = 0; i < dust; i++) {
    const rad = radius * (0.12 + Math.pow(r(), 0.9) * 0.8);
    const arm = Math.floor(r() * arms);
    const th = Math.log(rad / (radius * 0.08)) * k + (arm / arms) * Math.PI * 2 - 0.22 + gauss(r) * 0.07;
    dpos.set([Math.cos(th) * rad, gauss(r) * radius * 0.006, Math.sin(th) * rad], i * 3);
    dsize[i] = 0.06 + r() * 0.08;
    dtint.set([1, 1, 1], i * 3);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  dg.setAttribute("size", new THREE.BufferAttribute(dsize, 1));
  dg.setAttribute("tint", new THREE.BufferAttribute(dtint, 3));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 900 }, uSoft: { value: 3.0 }, uExposure: { value: 1.0 } },
    vertexShader: POINT_VS,
    fragmentShader: /* glsl */ `
      varying vec3 vTint; varying float vFade; uniform float uSoft;
      void main(){ vec2 p=gl_PointCoord-0.5; float a=exp(-dot(p,p)*4.0*uSoft)*0.16*vFade; if(a<0.004) discard;
        gl_FragColor=vec4(0.02,0.02,0.03,a); }`,
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
  });
  const dustPts = new THREE.Points(dg, dustMat);
  dustPts.frustumCulled = false;
  dustPts.renderOrder = 2;
  group.add(dustPts);
  group.userData.setExposure = (e) => { lum.material.uniforms.uExposure.value = e; haze.material.uniforms.uExposure.value = e; };
  return group;
}

// ── Value noise for planet surfaces (GLSL) ────────────────────────────────
const NOISE = /* glsl */ `
  float h3(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(h3(i+vec3(0,0,0)),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }
  float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<6;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }`;

// ── Banded giant planet with terminator + atmosphere rim ──────────────────
export function planet({ radius = 1, sunDir = new THREE.Vector3(1, 0.25, 0.4), seed = 3 } = {}) {
  const group = new THREE.Group();
  const sun = sunDir.clone().normalize();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 160, 120),
    new THREE.ShaderMaterial({
      uniforms: { uSun: { value: sun }, uSeed: { value: seed }, uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vP; varying vec3 vW;
        void main(){ vP=position; vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz;
          gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: NOISE + /* glsl */ `
        uniform vec3 uSun; uniform float uSeed; uniform float uTime;
        varying vec3 vN; varying vec3 vP; varying vec3 vW;
        void main(){
          vec3 p = normalize(vP);
          float lat = p.y;
          float warp = fbm(p*3.0 + vec3(uSeed, uTime*0.02, 0.)) * 0.35;
          float bands = sin((lat + warp*0.25) * 22.0) * 0.5 + 0.5;
          float belts = sin((lat + warp*0.18) * 61.0 + fbm(p*5.0)*2.0) * 0.5 + 0.5;
          float fine  = fbm(vec3(p.x*3.0, lat*90.0 + warp*9.0, p.z*3.0 + uSeed));
          bands = mix(bands, belts, 0.35);
          float storm = smoothstep(0.62, 0.8, fbm(p*7.0 + vec3(2.0*uSeed)));
          float tone = mix(0.30, 1.0, bands*0.6 + fine*0.4) - storm*0.18;
          vec3 albedo = mix(vec3(0.62,0.58,0.52), vec3(0.92,0.90,0.86), tone);
          vec3 V = normalize(cameraPosition - vW);
          float ndl = dot(normalize(vN), uSun);
          float day = smoothstep(-0.08, 0.35, ndl);             // soft terminator
          float limb = pow(clamp(dot(normalize(vN), V), 0.0, 1.0), 0.35);
          vec3 col = albedo * day * (0.25 + 0.75*limb);
          col += vec3(0.010,0.014,0.024);                        // earthshine floor, keeps night side from flat black
          // One atmospheric limb, drawn in the body itself (a separate shell read as a doubled ring).
          float fr = pow(1.0 - clamp(dot(normalize(vN), V), 0.0, 1.0), 4.0);
          float fwd = pow(clamp(dot(-V, uSun), 0.0, 1.0), 4.0);
          col += vec3(0.45, 0.66, 1.0) * fr * (0.06 + 1.1*smoothstep(-0.35, 0.5, ndl) + 1.4*fwd);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.014, 160, 120),
    new THREE.ShaderMaterial({
      uniforms: { uSun: { value: sun } },
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vW;
        void main(){ vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz;
          gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: /* glsl */ `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 V=normalize(cameraPosition-vW);
          float rim = pow(1.0 - clamp(dot(normalize(vN), V), 0.0, 1.0), 3.2);
          float lit = smoothstep(-0.35, 0.6, dot(normalize(vN), uSun));
          float fwd = pow(clamp(dot(-V, uSun), 0.0, 1.0), 6.0);
          vec3 c = vec3(0.55,0.75,1.0) * rim * (0.05 + 1.1*lit + 2.2*fwd);
          gl_FragColor = vec4(c, rim); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    }),
  );
  group.add(body);
  group.userData.body = body;
  group.userData.setSun = (v) => { const n = v.clone().normalize(); body.material.uniforms.uSun.value.copy(n); atmo.material.uniforms.uSun.value.copy(n); };
  return group;
}

// ── Night Earth: NASA Black Marble (global + high-res Europe patch) ──────
// The patch covers lon [lon0, lon1], lat [lat0, lat1]; outside it the global map is used.
export function nightEarth({ radius = 1, globalTex, patchTex, patch = [-30, 45, 30, 75], sunDir = new THREE.Vector3(-1, 0.1, -0.35) } = {}) {
  const group = new THREE.Group();
  const sun = sunDir.clone().normalize();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 256, 192),
    new THREE.ShaderMaterial({
      uniforms: { uGlobal: { value: globalTex }, uPatch: { value: patchTex }, uBounds: { value: new THREE.Vector4(...patch) },
                  uSun: { value: sun }, uGain: { value: 2.4 } },
      vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz;
          gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: /* glsl */ `uniform sampler2D uGlobal; uniform sampler2D uPatch; uniform vec4 uBounds; uniform vec3 uSun; uniform float uGain;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          float lon = vUv.x*360.0-180.0, lat = vUv.y*180.0-90.0;
          vec3 lights = texture2D(uGlobal, vUv).rgb;
          vec2 pu = vec2((lon-uBounds.x)/(uBounds.y-uBounds.x), (lat-uBounds.z)/(uBounds.w-uBounds.z));
          if (pu.x > 0.0 && pu.x < 1.0 && pu.y > 0.0 && pu.y < 1.0) {
            // feather the patch edge into the global map
            float e = min(min(pu.x, 1.0-pu.x), min(pu.y, 1.0-pu.y));
            lights = mix(lights, texture2D(uPatch, pu).rgb, smoothstep(0.0, 0.04, e));
          }
          float ndl = dot(normalize(vN), uSun);
          float night = 1.0 - smoothstep(-0.12, 0.06, ndl);
          vec3 V=normalize(cameraPosition-vW);
          float limb = pow(clamp(dot(normalize(vN),V),0.,1.), 0.5);
          vec3 L = max(lights - vec3(0.035), vec3(0.0));
          vec3 col = pow(L, vec3(1.1)) * uGain * night * (0.3 + 0.7*limb);
          col += vec3(0.010,0.020,0.040) * smoothstep(-0.30, 0.20, ndl);   // twilight band on the dusk side
          gl_FragColor = vec4(col, 1.0); }`,
    }),
  );
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.018, 256, 192),
    new THREE.ShaderMaterial({
      uniforms: { uSun: { value: sun } },
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vW;
        void main(){ vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz;
          gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: /* glsl */ `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 V=normalize(cameraPosition-vW);
          float rim = pow(1.0 - clamp(dot(normalize(vN),V),0.,1.), 3.4);
          float dusk = smoothstep(-0.45, 0.25, dot(normalize(vN), uSun));
          vec3 c = vec3(0.35,0.62,1.0) * rim * (0.18 + 2.6*dusk);
          gl_FragColor = vec4(c, rim); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  );
  group.add(body, atmo);
  return group;
}

// ── A photograph in 2.5D: back / mid / star layers on planes at different depths ─
// Each plane is sized to the same angular size from `viewZ`, so the stack lines up
// at rest and separates (parallax) as the camera dollies.
export function photoLayers({ back, mid, stars, feather = null, aspect, height = 30, viewZ = 0, depths = [-80, -70, -64] } = {}) {
  const group = new THREE.Group();
  const mk = (tex, z, additive, opacity = 1) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const d = viewZ - z;
    const h = height * d / (viewZ - depths[1]);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(h * aspect, h),
      new THREE.MeshBasicMaterial({ map: tex, alphaMap: feather, transparent: true, opacity, depthWrite: false, toneMapped: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    m.position.z = z;
    group.add(m);
    return m;
  };
  // Back: the diffuse disc light, quiet. Mid: the structure, laid over it normally (no double exposure).
  // Stars: the compact sources, added on top so they read as light.
  group.userData.back = mk(back, depths[0], false, 0.28);
  group.userData.mid = mk(mid, depths[1], false, 1);
  group.userData.stars = mk(stars, depths[2], true, 0.85);
  group.userData.mid.material.color.setScalar(0.78);
  const base = { back: 0.28, mid: 1, stars: 0.85 };
  group.userData.setOpacity = (o) => ["back", "mid", "stars"].forEach((k) => (group.userData[k].material.opacity = base[k] * o));
  return group;
}

// ── Deterministic film grain tile (2D canvas → data URL), seeded per frame ─
export function grainTile(seed, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  const r = rng(seed);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + gauss(r) * 34;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = Math.max(0, Math.min(255, v));
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

// ── Camera helpers: cinematic easing between keyed poses ──────────────────
export const ease = {
  // expo.out-like and its in/out sibling, used for camera moves
  out: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOut: (t) => (t < 0.5 ? 0.5 * Math.pow(2, 20 * t - 10) : 1 - 0.5 * Math.pow(2, -20 * t + 10)),
  sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
};
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp01(t) { return Math.max(0, Math.min(1, t)); }

export function placeInView(obj, camera, ndcX, ndcY, dist) {
  camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  const v = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
  obj.position.copy(camera.position).addScaledVector(v, dist);
}

// Low-orbit look: camera at `alt` above the point `n` on a sphere of radius 1,
// facing along `north`, pitched `pitchDeg` below the local horizontal.
export function orbitLook(camera, n, alt, pitchDeg, roll = 0, fov = 40, yawDeg = 0) {
  const N = n.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const north = up.clone().sub(N.clone().multiplyScalar(up.dot(N))).normalize().applyAxisAngle(N, (yawDeg * Math.PI) / 180);
  camera.position.copy(N).multiplyScalar(1 + alt);
  const a = (pitchDeg * Math.PI) / 180;
  const dir = north.clone().multiplyScalar(Math.cos(a)).addScaledVector(N, -Math.sin(a));
  camera.up.copy(N).applyAxisAngle(dir, roll);
  camera.fov = fov; camera.updateProjectionMatrix();
  camera.lookAt(camera.position.clone().add(dir));
  camera.updateMatrixWorld();
}
