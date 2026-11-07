// Lancering — "Waarom valt het ISS niet naar beneden?"
// One continuous camera: ISS close-up over the limb (it falls) → pull back to the whole Earth → three throws
// from a tower (short, longer, orbit at ~28.000 km/h) → the orbit loops → a rocket climbs and bends sideways into it.
export default {
  maak({ THREE, kit, scene, L, dur }) {
    const { lijn, cirkel, bol, gloed, camKeys, KLEUR, smooth, sine, venster, clamp01, lerp, easeOut } = kit;
    const R0 = 1.18, TAU = Math.PI * 2;
    const zonDir = new THREE.Vector3(0.95, 0.45, 0.45).normalize();
    scene.add(new THREE.AmbientLight(0x8fa4ff, 0.55));
    const key = new THREE.DirectionalLight(0xfff1dd, 2.4); key.position.copy(zonDir).multiplyScalar(10); scene.add(key);

    // ── Earth ──────────────────────────────────────────────────────────────────────────────
    const aarde = bol("aarde", { straal: 1, seed: 7, zon: zonDir }); scene.add(aarde);
    const atm = gloed("#6FB8FF", { grootte: 2.9, scherp: 9, alpha: 0.32 }); scene.add(atm);

    // ── ISS (simple stylised model) ────────────────────────────────────────────────────────
    const iss = new THREE.Group();
    const metaal = new THREE.MeshStandardMaterial({ color: 0xd8dde8, metalness: 0.55, roughness: 0.35 });
    const paneel = new THREE.MeshStandardMaterial({ color: 0x1a3c7a, metalness: 0.3, roughness: 0.4, emissive: 0x123a6a, emissiveIntensity: 0.6 });
    const truss = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.035, 0.035), metaal); iss.add(truss);
    [-0.42, -0.26, 0.26, 0.42].forEach((x) => [-1, 1].forEach((s) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.004, 0.36), paneel); p.position.set(x, 0, s * 0.21); iss.add(p);
    }));
    [[0, 0, 0, 0.42], [0.0, 0, 0.12, 0.2]].forEach(([x, y, z, l], i) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, l, 20), metaal); m.rotation.x = Math.PI / 2; m.position.set(x, y - 0.03, z); iss.add(m);
    });
    const rad = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.003, 0.16), new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.6 })); rad.position.set(0.12, -0.03, -0.1); iss.add(rad);
    iss.scale.setScalar(0.07); scene.add(iss);
    const issGloed = gloed("#CFE9FF", { grootte: 0.05, scherp: 8, alpha: 0.6 }); scene.add(issGloed);

    // ISS angle on its orbit (clockwise in the XY plane, starts at the top)
    const issA = (t) => Math.PI / 2 - 0.014 * t - TAU * 1.25 * sine((t - L(6, 1)) / (L(9, 1) - L(6, 1)));
    const issPos = (t) => { const a = issA(t); return new THREE.Vector3(Math.cos(a) * R0, Math.sin(a) * R0, 0); };
    const radiaal = (t) => issPos(t).normalize();

    // ── three throws from the tower at the top (GM = 1, plane z = 0, clockwise) ────────────
    function worp(f) {
      const pts = []; let x = 0, y = R0, vx = f / Math.sqrt(R0), vy = 0; const dt = 0.004; let ang = 0;
      pts.push(new THREE.Vector3(x, y, 0));
      for (let i = 0; i < 20000; i++) {
        const r = Math.hypot(x, y), ax = -x / r ** 3, ay = -y / r ** 3;
        vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt;
        if (i % 4 === 0) pts.push(new THREE.Vector3(x, y, 0));
        if (Math.hypot(x, y) < 1.0) break;
        ang = Math.atan2(x, y); if (ang < 0) ang += TAU;
        if (i > 100 && ang > TAU - 0.02) break;
      }
      return pts;
    }
    const worpen = [0.72, 0.9, 1.0].map((f) => { const p = worp(f); const l = lijn(p, { kleur: f === 1 ? KLEUR.teal : KLEUR.creme, breedte: f === 1 ? 11 : 9 }); scene.add(l); return { p, l }; });
    const toren = lijn([new THREE.Vector3(0, 0.99, 0), new THREE.Vector3(0, R0, 0)], { kleur: KLEUR.koraal, breedte: 9 }); scene.add(toren);
    const kop = gloed("#FFFFFF", { grootte: 0.13, scherp: 6 }); scene.add(kop);
    const vensters = [[L(3, 0.15), L(3, 1)], [L(4, 0.1), L(4, 1)], [L(5, 0.2), L(6, 1)]];
    const fracAt = (t, i) => { const [a, b] = vensters[i]; return i === 2 ? sine((t - a) / (b - a)) : easeOut((t - a) / (b - a)); };
    const ptAt = (pts, f) => { const x = clamp01(f) * (pts.length - 1); const i = Math.min(pts.length - 2, Math.floor(x)); return pts[i].clone().lerp(pts[i + 1], x - i); };

    // orbit ring (after the third throw closes)
    const baan = lijn(cirkel(R0, 360).map((v) => new THREE.Vector3(v.x, v.z, 0)).reverse(), { kleur: KLEUR.teal, breedte: 11, dicht: true, wrap: true, basis: 0.25 }); scene.add(baan);

    // rocket: up first, then sideways into the orbit (clockwise)
    const phi0 = (150 * Math.PI) / 180;
    const raketPad = []; for (let i = 0; i <= 200; i++) { const s = i / 200; const r = 1.0 + (R0 - 1.0) * Math.min(1, 1.5 * s - 0.5 * s * s * s); const ph = phi0 - 0.95 * s * s; raketPad.push(new THREE.Vector3(Math.cos(ph) * r, Math.sin(ph) * r, 0)); }
    const raket = lijn(raketPad, { kleur: KLEUR.koraal, breedte: 13 }); scene.add(raket);
    const raketKop = gloed("#FFB08A", { grootte: 0.16, scherp: 5 }); scene.add(raketKop);
    const raketF = (t) => { const a = L(8, 0.05), m = L(8, 1), b = L(9, 1); return t < m ? 0.42 * easeOut((t - a) / (m - a)) : 0.42 + 0.58 * sine((t - m) / (b - m)); };

    // ── camera ─────────────────────────────────────────────────────────────────────────────
    const z3 = (v, s) => v.clone().multiplyScalar(s);
    const site = new THREE.Vector3(Math.cos(phi0), Math.sin(phi0), 0);
    const cam = camKeys([
      { t: 0, p: (t) => issPos(t).add(z3(radiaal(t), 0.05)).add(new THREE.Vector3(0, 0, 0.16)).toArray(), l: (t) => issPos(t).add(z3(radiaal(t), -0.03)).toArray(), up: (t) => radiaal(t).toArray(), fov: 42 },
      { t: L(1, 1), p: (t) => issPos(t).add(z3(radiaal(t), 0.09)).add(new THREE.Vector3(0.05, 0, 0.3)).toArray(), l: (t) => issPos(t).add(z3(radiaal(t), -0.06)).toArray(), up: (t) => radiaal(t).toArray(), fov: 42 },
      { t: L(2, 1), p: (t) => issPos(t).add(z3(radiaal(t), 0.25)).add(new THREE.Vector3(0, 0, 0.75)).toArray(), l: (t) => issPos(t).add(z3(radiaal(t), -0.25)).toArray(), up: (t) => radiaal(t).toArray(), fov: 44 },
      { t: L(3, 0.6), p: [0.15, -0.3, 7.4], l: [0, -0.62, 0], up: [0, 1, 0], fov: 40 },
      { t: L(5, 0.5), p: [0.9, -0.4, 7.3], l: [0, -0.7, 0], up: [0, 1, 0], fov: 40 },
      { t: L(7, 1), p: [-0.8, -0.3, 7.6], l: [0, -0.72, 0], up: [0, 1, 0], fov: 40 },
      { t: L(8, 0.9), p: [-0.7, -0.05, 5.4], l: [-0.4, -0.4, 0], up: [0, 1, 0], fov: 40 },
      { t: L(9, 1), p: [0.2, -0.2, 7.6], l: [0, -0.7, 0], up: [0, 1, 0], fov: 40 },
      { t: dur, p: [0.35, -0.15, 8.1], l: [0, -0.72, 0], up: [0, 1, 0], fov: 40, e: "lin" },
    ]);

    let camRef = null; const camDist = () => (camRef ? camRef.position.length() : 10);
    return {
      camera: (c, t) => { cam(c, t); camRef = c; },
      stof: (t) => ({ schaal: t < L(3, 0.3) ? 0.25 : 1, mate: 1 }),
      update(t) {
        aarde.rotation.set(-0.5, t * 0.05, 0.35);
        aarde.userData.mat.uniforms.uRimK.value = clamp01((camDist() - 1.25) / 1.6);
        atm.userData.set({ alpha: 0.32 * clamp01((camDist() - 2.2) / 1.5) });
        // ISS: close-up until L3, then hidden until the orbit closes
        const ip = issPos(t); iss.position.copy(ip);
        iss.rotation.set(0, 0, issA(t) - Math.PI / 2);
        const zie = 1 - venster(t, L(3, 0.2), L(7, 0.1), 0.3, 0.3);
        iss.visible = zie > 0.5 && t < L(3, 0.5) || t > L(7, 0);
        iss.scale.setScalar(t > L(7, 0) ? 0.07 * 0.9 : 0.07);
        issGloed.position.copy(ip); issGloed.userData.set({ alpha: t > L(3, 0) ? 0.9 * venster(t, L(7, 0), dur + 1, 0.3, 0.1) : 0.25 });
        issGloed.scale.setScalar(t > L(3, 0) ? 1.6 : 1);
        // throws
        worpen.forEach((w, i) => {
          const f = fracAt(t, i);
          const vis = i === 2 ? venster(t, vensters[2][0], L(7, 0.4), 0.05, 0.4) : venster(t, vensters[i][0], L(7, 0.3), 0.05, 0.5);
          w.l.userData.set({ kop: f, len: 1, alpha: vis * (i === 2 ? 1 : 0.85) });
        });
        toren.userData.set({ alpha: venster(t, L(3, 0), L(7, 0.5), 0.3, 0.5) });
        let kp = null;
        for (let i = 2; i >= 0; i--) { const [a, b] = vensters[i]; if (t >= a && t <= b + 0.25) { kp = ptAt(worpen[i].p, fracAt(t, i)); break; } }
        kop.visible = !!kp; if (kp) kop.position.copy(kp);
        // orbit ring takes over from throw 3
        const ra = venster(t, L(6, 0.85), dur + 1, 0.4, 0.1);
        const a = issA(t); const u = ((Math.atan2(ip.y, ip.x) % TAU) + TAU) % TAU / TAU;
        baan.userData.set({ kop: (1 - u + 1) % 1, len: 0.5, alpha: ra, basis: 0.22 });
        baan.material.uniforms.uWrap.value = 1;
        // the ring's u runs counter-clockwise; the ISS goes clockwise → flip the trail direction
        baan.scale.set(1, 1, 1);
        // rocket
        const rf = raketF(t);
        raket.userData.set({ kop: rf, len: 1, alpha: venster(t, L(8, 0), dur + 1, 0.2, 0.1) });
        raketKop.visible = t > L(8, 0.05) && t < L(9, 1.05);
        raketKop.position.copy(ptAt(raketPad, rf));
      },
      overlay(t, ov) {
        // it falls: down chevrons under the ISS (towards the Earth's centre)
        const v = venster(t, 0.2, L(1, 0.6), 0.3, 0.35);
        if (v > 0) {
          const [x, y] = ov.proj(issPos(t)); const [x2, y2] = ov.proj(issPos(t).add(radiaal(t).multiplyScalar(-0.05)));
          const ang = Math.atan2(y2 - y, x2 - x);
          const puls = (t * 2.2) % 1;
          ov.dubbel(x + Math.cos(ang) * (190 + 40 * puls), y + Math.sin(ang) * (190 + 40 * puls), ang, 70, { kleur: KLEUR.koraal, alpha: v * (1 - puls * 0.5) });
        }
        // sideways: chevrons ahead of the ISS
        const s = venster(t, L(2, 0), L(2, 1) + 0.2, 0.2, 0.3);
        if (s > 0) {
          const ip = issPos(t), [x, y] = ov.proj(ip);
          const tan = new THREE.Vector3(Math.sin(issA(t)), -Math.cos(issA(t)), 0);
          const [x2, y2] = ov.proj(ip.clone().add(tan.multiplyScalar(0.05)));
          const ang = Math.atan2(y2 - y, x2 - x);
          for (let k = 0; k < 3; k++) { const ph = ((t * 2.4 + k / 3) % 1); ov.chevron(x + Math.cos(ang) * (150 + ph * 200), y + Math.sin(ang) * (150 + ph * 200), ang, 64, { kleur: KLEUR.koraal, alpha: s * Math.sin(ph * Math.PI) }); }
        }
        // speed counter
        const c = venster(t, L(5, 0), L(7, 0.1), 0.25, 0.35);
        if (c > 0) {
          const val = Math.round((28000 * easeOut((t - L(5, 0)) / (L(5, 1) - L(5, 0)))) / 100) * 100;
          ov.tekst(`${val.toLocaleString("nl-NL")} KM/U`, 540, 210, { maat: 112, alpha: c });
        }
        const d = venster(t, L(7, 0.2), L(8, 0.4), 0.25, 0.35);
        if (d > 0) {
          ov.tekst("16 RONDJES", 540, 190, { maat: 112, alpha: d, kleur: KLEUR.teal, schaal: 0.9 + 0.1 * easeOut((t - L(7, 0.2)) / 0.3) });
          ov.tekst("per dag", 540, 285, { maat: 50, alpha: d, kleur: KLEUR.wit, gloei: 10, gewicht: 700 });
        }
        // falling while flying: small down chevrons at the throw-3 head
        const f = venster(t, L(6, 0), L(6, 1), 0.3, 0.3);
        if (f > 0) {
          const p = ptAt(worpen[2].p, fracAt(t, 2)); const [x, y] = ov.proj(p); const [x0, y0] = ov.proj(new THREE.Vector3(0, 0, 0));
          const ang = Math.atan2(y0 - y, x0 - x);
          ov.dubbel(x + Math.cos(ang) * 70, y + Math.sin(ang) * 70, ang, 44, { kleur: KLEUR.koraal, alpha: f });
        }
      },
      post: () => ({ bloei: 0.6, belichting: 1.12 }),
      flits: (t) => 0.4 * venster(t, L(7, 0), L(7, 0) + 0.5, 0.06, 0.44),
    };
  },
};
