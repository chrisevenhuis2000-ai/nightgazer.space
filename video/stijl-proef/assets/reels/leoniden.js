// Vannacht — Leoniden, nacht van dinsdag 17 op woensdag 18 november 2026.
// Continuous camera: behind the Earth on its orbit, a dust stream ahead → pull back over the solar system:
// comet Tempel-Tuttle's long orbit (33 years) leaves the dust → the Earth crosses it every November →
// 71 km/s, grains burn up → through the atmosphere (one flash) → the sky over the Netherlands: meteors
// radiate from Leo; the camera turns west to the setting first-quarter Moon and back.
export default {
  maak({ THREE, kit, scene, L, dur }) {
    const { lijn, cirkel, bol, gloed, zon, camKeys, KLEUR, smooth, sine, venster, clamp01, lerp, easeOut } = kit;
    const { rng } = kit;
    const TAU = Math.PI * 2, deg = Math.PI / 180;

    // ══ Solar system ═══════════════════════════════════════════════════════════════════════
    const RA = 4.0, ER = 0.2;
    const ruimte = new THREE.Group(); scene.add(ruimte);
    const deZon = zon({ straal: 0.55 }); ruimte.add(deZon);
    const aardeBaan = lijn(cirkel(RA, 360), { kleur: KLEUR.teal, breedte: 8, dicht: true, wrap: true, basis: 0.2 }); ruimte.add(aardeBaan);
    const aarde = bol("aarde", { straal: ER, seed: 5, zon: new THREE.Vector3(1, 0, 0) }); ruimte.add(aarde);
    const aGloed = gloed("#7FC4FF", { grootte: ER * 3.2, scherp: 8, alpha: 0.5 }); ruimte.add(aGloed);

    // Comet orbit: perihelion just inside the Earth's orbit, aphelion far out (stylised), tilted 18°
    // around the line through the Sun and the crossing point (retrograde, like 55P/Tempel-Tuttle).
    const q = 3.92, Q = 22, a = (q + Q) / 2, e = (Q - q) / (Q + q), p = a * (1 - e * e);
    const nuX = Math.acos((p / RA - 1) / e);                       // true anomaly where r = RA
    const pDir = -Math.PI / 2 - 0.25;                              // perihelion direction in the ecliptic (angle in xz)
    const knoop = new THREE.Vector3(Math.cos(pDir + nuX), 0, Math.sin(pDir + nuX)); // crossing direction
    const kantel = new THREE.Quaternion().setFromAxisAngle(knoop, 18 * deg);
    const komeetPunt = (nu) => { const r = p / (1 + e * Math.cos(nu)); return new THREE.Vector3(Math.cos(pDir + nu) * r, 0, Math.sin(pDir + nu) * r).applyQuaternion(kantel); };
    const kBaanPts = []; for (let i = 0; i <= 600; i++) kBaanPts.push(komeetPunt(-Math.PI + (i / 600) * TAU));
    const komeetBaan = lijn(kBaanPts, { kleur: KLEUR.creme, breedte: 4, alpha: 0.5 }); ruimte.add(komeetBaan);
    const kruis = komeetPunt(nuX);
    const lambdaX = Math.atan2(kruis.z, kruis.x);

    // Dust stream: grains spread along the comet's orbit, thickest near the crossing.
    const N = 5000, r0 = rng(17);
    const dpos = new Float32Array(N * 3), dsz = new Float32Array(N), dcol = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const nu = (r0() < 0.6 ? nuX + (r0() - 0.5) * 1.6 : -Math.PI + r0() * TAU);
      const c = komeetPunt(nu); const spread = 0.12 + 0.25 * r0();
      dpos.set([c.x + (r0() - 0.5) * spread, c.y + (r0() - 0.5) * spread * 0.6, c.z + (r0() - 0.5) * spread], i * 3);
      dsz[i] = 0.4 + Math.pow(r0(), 4) * 2.0;
      const b = 0.3 + r0() * 0.6; dcol.set([1.0 * b, 0.85 * b, 0.68 * b], i * 3);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(dpos, 3)); dg.setAttribute("size", new THREE.BufferAttribute(dsz, 1)); dg.setAttribute("tint", new THREE.BufferAttribute(dcol, 3));
    const dm = new THREE.ShaderMaterial({ uniforms: { uA: { value: 1 } },
      vertexShader: `attribute float size; attribute vec3 tint; varying vec3 vT; uniform float uA;
        void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(size*14./max(-mv.z,.05),1.0,9.); vT=tint*uA; }`,
      fragmentShader: `varying vec3 vT; void main(){ vec2 p=gl_PointCoord-.5; float a=exp(-dot(p,p)*12.); if(a<.01) discard; gl_FragColor=vec4(vT*a,1.); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const stroom = new THREE.Points(dg, dm); stroom.frustumCulled = false; ruimte.add(stroom);

    // Comet: nucleus, coma, tail pointing away from the Sun.
    const komeet = new THREE.Group(); ruimte.add(komeet);
    const kern = gloed("#FFFFFF", { grootte: 0.35, scherp: 7 }), coma = gloed("#BFF3FF", { grootte: 1.4, scherp: 6, alpha: 0.6 });
    komeet.add(coma, kern);
    const staartPts = []; for (let i = 0; i <= 40; i++) staartPts.push(new THREE.Vector3((1 - i / 40) * 3.2, 0, 0));
    const staart = lijn(staartPts, { kleur: "#9FE8F5", breedte: 16 }); komeet.add(staart);
    const nuT = (t) => lerp(-1.2, 2.75, sine((t - L(0, 0.6)) / (L(2, 1) - L(0, 0.6))));

    // Earth's orbit: arrives at the crossing point during line 3.
    const lam = (t) => lambdaX - 0.75 + 0.75 * sine(t / L(3, 0.7)) + 0.004 * Math.max(0, t - L(3, 0.7));
    const aardePos = (t) => new THREE.Vector3(Math.cos(lam(t)) * RA, 0, Math.sin(lam(t)) * RA);
    const raak = (t) => aardePos(t).clone().normalize().multiplyScalar(0); // unused helper

    // Burning grains near the Earth (lines 4–5): streaks that end in the atmosphere.
    const inval = new THREE.Vector3(0.2, -0.25, 1).normalize();   // direction the grains come from (relative)
    const flitsen = []; const r1 = rng(23);
    for (let i = 0; i < 22; i++) {
      const off = new THREE.Vector3((r1() - 0.5) * 2, (r1() - 0.5) * 2, 0).multiplyScalar(ER * 1.1);
      const l = lijn([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.0001)], { kleur: i % 3 ? "#FFE3B0" : "#BFF3FF", breedte: 5 });
      ruimte.add(l); flitsen.push({ off, l, t0: L(4, 0.1) + r1() * (L(5, 0.8) - L(4, 0.1)), len: 0.25 + r1() * 0.35 });
    }

    // ══ The sky over the Netherlands (after the flash) ═══════════════════════════════════════
    const S = new THREE.Vector3(0, -400, 0);
    const hemel = new THREE.Group(); hemel.position.copy(S); scene.add(hemel); hemel.visible = false;
    const koepel = new THREE.Mesh(new THREE.SphereGeometry(150, 64, 32), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: true,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec3 vD; void main(){ float h = clamp(vD.y, -0.2, 1.0);
        vec3 c = mix(vec3(0.09,0.10,0.24), vec3(0.012,0.016,0.06), pow(clamp(h,0.,1.), 0.45));
        c += vec3(0.05,0.04,0.09) * exp(-max(h,0.)*14.0);
        gl_FragColor = vec4(c, 1.); }` }));
    hemel.add(koepel);
    // Ground with a soft tree line (silhouette)
    const grond = new THREE.Mesh(new THREE.CircleGeometry(140, 64), new THREE.MeshBasicMaterial({ color: 0x03040b }));
    grond.rotation.x = -Math.PI / 2; grond.position.y = -1.6; hemel.add(grond);
    const bomen = (() => { const shp = new THREE.Shape(); const r = rng(5); shp.moveTo(-1, 0);
      const pts = []; for (let i = 0; i <= 360; i++) { const a = (i / 360) * TAU; const h = 0.55 + 1.5 * Math.pow(Math.abs(Math.sin(a * 23 + Math.sin(a * 7) * 2)), 3) * (0.4 + 0.6 * Math.abs(Math.sin(a * 3.3))) + r() * 0.25; pts.push([a, h]); }
      const pos = [], idx = [];
      pts.forEach(([a, h], i) => { const R = 90; pos.push(Math.cos(a) * R, -1.6, Math.sin(a) * R, Math.cos(a) * R, -1.6 + h, Math.sin(a) * R); if (i < pts.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } });
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x03040b, side: THREE.DoubleSide })); })();
    hemel.add(bomen);

    // Leo, on a tangent plane around the radiant. East (az 100°), altitude 38°.
    const richt = (az, alt) => new THREE.Vector3(Math.sin(az * deg) * Math.cos(alt * deg), Math.sin(alt * deg), -Math.cos(az * deg) * Math.cos(alt * deg));
    const RAD_AZ = 100, RAD_ALT = 38, D = 60;
    const C = richt(RAD_AZ, RAD_ALT).multiplyScalar(D);
    const rechts = new THREE.Vector3().crossVectors(C.clone().normalize(), new THREE.Vector3(0, 1, 0)).normalize();
    const omhoog = new THREE.Vector3().crossVectors(rechts, C.clone().normalize()).normalize();
    const K = D * deg * 1.0;
    const opVlak = (x, y) => C.clone().addScaledVector(rechts, x * K).addScaledVector(omhoog, y * K);
    const ster = { // [RA hours, Dec deg]
      regulus: [10.14, 12.0], eta: [10.12, 16.8], algieba: [10.33, 19.8], adhafera: [10.28, 23.4], rasalas: [9.88, 26.0], eps: [9.76, 23.8],
      zosma: [11.24, 20.5], chertan: [11.24, 15.4], denebola: [11.82, 14.6] };
    const RA0 = 10.6, DEC0 = 18.5;
    const sp = {}; for (const [k, [ra, dc]] of Object.entries(ster)) sp[k] = opVlak(-(ra - RA0) * 15 * Math.cos(dc * deg), dc - DEC0);
    const helder = { regulus: 1.0, denebola: 0.8, algieba: 0.85, zosma: 0.6, eps: 0.55, chertan: 0.5, eta: 0.5, adhafera: 0.4, rasalas: 0.45 };
    const leeuw = new THREE.Group(); hemel.add(leeuw);
    const sterSprites = Object.entries(sp).map(([k, v]) => { const g = gloed("#EAF2FF", { grootte: 1.8 * helder[k] + 0.6, scherp: 9 }); g.position.copy(v); leeuw.add(g); return g; });
    const vorm = [["regulus", "eta", "algieba", "adhafera", "rasalas", "eps"], ["algieba", "zosma", "denebola", "chertan", "regulus"], ["zosma", "chertan"]];
    const vormLijnen = vorm.map((ks) => { const l = lijn(ks.map((k) => sp[k]), { kleur: KLEUR.teal, breedte: 3.5, alpha: 0.7 }); leeuw.add(l); return l; });
    const radiant = opVlak(-(10.28 - RA0) * 15 * Math.cos(21.6 * deg), 21.6 - DEC0);
    const radGloed = gloed("#FFD9A0", { grootte: 5, scherp: 5, alpha: 0.0 }); radGloed.position.copy(radiant); leeuw.add(radGloed);

    // Meteors radiating from Leo (seeded times and directions).
    const meteoren = []; const r2 = rng(41);
    for (let i = 0; i < 16; i++) {
      const ang = r2() * TAU, start = 9 + r2() * 12, lengte = 9 + r2() * 16;
      const a0 = opVlak(0, 0); // placeholder
      const sx = Math.cos(ang), sy = Math.sin(ang);
      const rp = (d) => radiant.clone().addScaledVector(rechts, sx * d * K).addScaledVector(omhoog, sy * d * K);
      const pts = []; for (let j = 0; j <= 24; j++) pts.push(rp(start + (j / 24) * lengte));
      const l = lijn(pts, { kleur: i % 4 === 0 ? "#BFF3FF" : "#FFF1D6", breedte: 4 + r2() * 3 }); hemel.add(l);
      meteoren.push({ l, t0: L(5, 0.95) + r2() * (dur - 1.2 - L(5, 0.95)), d: 0.45 + r2() * 0.35 });
    }
    // The first-quarter Moon, low in the west, setting during line 7 (right half lit).
    const maan = bol("maan", { straal: 2.3, seed: 4 }); hemel.add(maan);
    const maanAlt = (t) => lerp(9, -1.5, smooth((t - L(7, 0.1)) / (L(7, 1) - L(7, 0.1))));
    const maanAz = 247;

    // ══ Camera ════════════════════════════════════════════════════════════════════════════
    const tang = (t) => new THREE.Vector3(-Math.sin(lam(t)), 0, Math.cos(lam(t)));
    const volg = (t, terug, op, zijw = 0) => aardePos(t).addScaledVector(tang(t), -terug).add(new THREE.Vector3(0, op, 0)).addScaledVector(aardePos(t).normalize(), zijw).toArray();
    const voor = (t, ver) => aardePos(t).addScaledVector(tang(t), ver).toArray();
    const top = kruis.clone().multiplyScalar(0.5).add(komeetPunt(Math.PI).multiplyScalar(0.3));
    const sky = (az, alt, fov) => ({ p: S.toArray(), l: S.clone().add(richt(az, alt).multiplyScalar(10)).toArray(), up: [0, 1, 0], fov });
    const leoMid = Object.values(sp).reduce((acc, v) => acc.add(v), new THREE.Vector3()).multiplyScalar(1 / Object.keys(sp).length);
    const opLeeuw = (fov, dy = 0) => ({ p: S.toArray(), l: S.clone().add(leoMid).add(new THREE.Vector3(0, dy, 0)).toArray(), up: [0, 1, 0], fov });
    const cam = camKeys([
      { t: 0, p: (t) => volg(t, 1.1, 0.32, 0.25), l: (t) => voor(t, 1.6), up: [0, 1, 0], fov: 42 },
      { t: L(0, 1), p: (t) => volg(t, 2.6, 1.6, 0.6), l: (t) => voor(t, 1.0), up: [0, 1, 0], fov: 44 },
      { t: L(1, 1), p: [top.x + 2, 30, top.z + 14], l: [top.x, 0, top.z], up: [0, 1, 0], fov: 50 },
      { t: L(2, 1), p: [top.x - 3, 27, top.z + 16], l: [top.x, 0, top.z - 1], up: [0, 1, 0], fov: 50 },
      { t: L(3, 0.9), p: (t) => volg(t, 1.6, 1.4, 1.8), l: (t) => aardePos(t).toArray(), up: [0, 1, 0], fov: 46 },
      { t: L(4, 1), p: (t) => volg(t, 0.75, 0.25, 0.35), l: (t) => aardePos(t).toArray(), up: [0, 1, 0], fov: 44 },
      { t: L(5, 0.75), p: (t) => volg(t, 0.24, 0.04, 0.06), l: (t) => aardePos(t).toArray(), up: [0, 1, 0], fov: 44, e: "in" },
      { t: L(5, 0.76), ...sky(RAD_AZ - 5, 8, 70) },
      { t: L(6, 0.9), ...opLeeuw(74, -4) },
      { t: L(7, 0.15), ...sky(170, 18, 70) },
      { t: L(7, 1), ...sky(maanAz, 6, 52) },
      { t: L(8, 0.8), ...opLeeuw(76, -6) },
      { t: dur, ...opLeeuw(72, -5), e: "lin" },
    ]);
    const omslag = L(5, 0.755);

    let camRef = null;
    return {
      camera: (c, t) => { cam(c, t); camRef = c; },
      stof: (t) => {
        if (t >= omslag) return { schaal: 1, mate: 0 };
        const v = venster(t, L(4, 0), L(5, 0.8), 0.3, 0.1);
        return v > 0 ? { schaal: 0.25, mate: 1, vel: inval.clone().multiplyScalar(-14 * v) } : { schaal: 0.6, mate: 1 };
      },
      update(t) {
        const inRuimte = t < omslag;
        ruimte.visible = inRuimte; hemel.visible = !inRuimte;
        if (inRuimte) {
          const ep = aardePos(t); aarde.position.copy(ep); aGloed.position.copy(ep);
          aarde.userData.setZon(ep.clone().negate()); aarde.rotation.y = t * 0.4;
          aardeBaan.userData.set({ kop: ((lam(t) % TAU) + TAU) % TAU / TAU, len: 0.3, basis: 0.14, alpha: 1 });
          // comet
          const nu = nuT(t), cp = komeetPunt(nu); komeet.position.copy(cp);
          const weg = cp.clone().normalize(); komeet.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), weg);
          const kz = venster(t, L(0, 0.6), L(3, 0.3), 0.5, 0.6);
          kern.userData.set({ alpha: kz }); coma.userData.set({ alpha: 0.6 * kz }); staart.userData.set({ alpha: kz * clamp01(6 / cp.length()) });
          komeetBaan.userData.set({ kop: clamp01((nu + Math.PI) / TAU), len: 1, alpha: 0.5 * venster(t, L(0, 0.8), L(4, 0.2), 0.6, 0.6) });
          dm.uniforms.uA.value = 0.55 + 0.6 * venster(t, L(3, 0.2), L(5, 1), 0.6, 0.2);
          // burning grains
          flitsen.forEach((f) => {
            const k = (t - f.t0) / f.len;
            if (k < 0 || k > 1.4) { f.l.userData.set({ alpha: 0 }); return; }
            const dirIn = inval.clone();
            const end = ep.clone().add(f.off).addScaledVector(dirIn, ER * 0.9);
            const start = end.clone().addScaledVector(dirIn, 0.9);
            const head = start.clone().lerp(end, Math.min(1, k));
            const tail = start.clone().lerp(end, Math.max(0, k - 0.45));
            const pa = f.l.geometry.attributes.position.array;
            const nx = f.l.geometry.attributes.next.array, pv = f.l.geometry.attributes.prev.array;
            [tail, tail, head, head].forEach((v, j) => pa.set([v.x, v.y, v.z], j * 3));
            [head, head, head, head].forEach((v, j) => nx.set([v.x, v.y, v.z], j * 3));
            [tail, tail, tail, tail].forEach((v, j) => pv.set([v.x, v.y, v.z], j * 3));
            f.l.geometry.attributes.position.needsUpdate = true; f.l.geometry.attributes.next.needsUpdate = true; f.l.geometry.attributes.prev.needsUpdate = true;
            f.l.userData.set({ alpha: (k > 1 ? 1 - (k - 1) / 0.4 : 1) * 1.2 });
          });
        } else {
          const ts = t - omslag;
          vormLijnen.forEach((l, i) => l.userData.set({ kop: smooth((t - L(6, 0.1) - i * 0.25) / 0.9), len: 1, alpha: 0.75 }));
          radGloed.userData.set({ alpha: 0.5 * venster(t, L(6, 0.3), dur + 1, 0.6, 0.1) });
          meteoren.forEach((m) => {
            const k = (t - m.t0) / m.d;
            m.l.userData.set({ kop: clamp01(k), len: 0.55, alpha: k < 0 ? 0 : k < 1 ? 1.3 : Math.max(0, 1.3 * (1 - (k - 1) / 0.5)) });
          });
          const md = richt(maanAz, maanAlt(t)); maan.position.copy(md.clone().multiplyScalar(70));
          // first quarter: lit from the side facing away from the (set) Sun → right half lit seen from here
          const rechtsM = new THREE.Vector3().crossVectors(md, new THREE.Vector3(0, 1, 0)).normalize();
          maan.userData.setZon(rechtsM.clone().negate());
          maan.visible = maanAlt(t) > -2.0;
        }
      },
      overlay(t, ov) {
        const k1 = venster(t, L(2, 0.05), L(3, 0.1), 0.25, 0.3);
        if (k1 > 0) ov.tekst("1 RONDJE = 33 JAAR", 540, 250, { maat: 84, alpha: k1, schaal: 0.92 + 0.08 * easeOut((t - L(2, 0.05)) / 0.3) });
        const k2 = venster(t, L(3, 0.3), L(3, 0.97), 0.25, 0.2);
        if (k2 > 0) ov.tekst("17 → 18 NOV", 540, 250, { maat: 104, alpha: k2, kleur: KLEUR.teal });
        const k3 = venster(t, L(4, 0), omslag, 0.2, 0.05);
        if (k3 > 0) { const v = Math.round(71 * easeOut((t - L(4, 0)) / (L(4, 1) - L(4, 0)))); ov.tekst(`${v} KM/S`, 540, 250, { maat: 124, alpha: k3 }); ov.tekst("= 255.600 km/u", 540, 360, { maat: 46, kleur: KLEUR.wit, gewicht: 700, gloei: 10, alpha: k3 * clamp01((t - L(4, 0.6)) / 0.3) }); }
        const k4 = venster(t, L(6, 0.2), L(7, 0.05), 0.3, 0.3);
        if (k4 > 0) ov.tekst("LEEUW", 540, 250, { maat: 96, alpha: k4, kleur: KLEUR.teal });
        const k5 = venster(t, L(7, 0.05), L(8, 0.05), 0.3, 0.3);
        if (k5 > 0) { ov.tekst("NA 00:00", 540, 250, { maat: 116, alpha: k5 }); ov.tekst("Maan onder rond 23:00", 540, 360, { maat: 44, kleur: KLEUR.wit, gewicht: 700, gloei: 10, alpha: k5 }); }
        const k6 = venster(t, L(8, 0.1), dur + 1, 0.3, 0.1) * (1 - venster(t, L(8, 1) + 0.3, dur + 2, 0.3, 0.1));
        if (k6 > 0) ov.tekst("± 15 PER UUR", 540, 250, { maat: 104, alpha: k6 });
      },
      post: (t) => (t < omslag ? { bloei: 0.6, belichting: 1.15 } : { bloei: 0.75, belichting: 1.2, drempel: 0.4 }),
      flits: (t) => 0.95 * venster(t, omslag - 0.18, omslag + 0.55, 0.18, 0.5),
    };
  },
};
