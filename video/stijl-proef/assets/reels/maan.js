// Snap het — "Waarom zie je altijd dezelfde kant van de Maan?"
// One continuous camera: the Moon's face → above the Earth-Moon system → one orbit = one spin (27 days)
// → side view with a gravity grid: Earth stretches the Moon and brakes its spin → locked → we look at its face.
export default {
  maak({ THREE, kit, scene, L, dur }) {
    const { lijn, cirkel, bol, gloed, zwaartekrachtRaster, camKeys, KLEUR, smooth, sine, venster, clamp01, lerp } = kit;
    const RB = 4.2, RM = 0.5, TAU = Math.PI * 2;
    const zonDir = new THREE.Vector3(0.9, 0.45, 0.55).normalize();

    // ── story clocks ───────────────────────────────────────────────────────────────────────
    const th0 = 0.3;
    const theta = (t) => th0 + 0.006 * t + TAU * sine((t - L(3, 0)) / (L(5, 1) - L(3, 0)));
    // extra spin (the "before" flashback): fast at L6–L7, braked during L8–L9, exactly a whole number of turns
    const omega = (t) => 3.2 * clamp01((t - L(6, 0)) / Math.max(0.2, L(6, 0.7) - L(6, 0))) * (1 - smooth((t - L(8, 0)) / (L(9, 0.6) - L(8, 0))));
    const t0 = L(6, 0) - 0.1, t1 = L(9, 0.6) + 0.1, N = 600;
    const Etab = new Float32Array(N + 1);
    for (let i = 1; i <= N; i++) { const ta = t0 + ((i - 0.5) / N) * (t1 - t0); Etab[i] = Etab[i - 1] + omega(ta) * ((t1 - t0) / N); }
    const Etot = Etab[N], fix = Etot > 0 ? (Math.max(1, Math.round(Etot / TAU)) * TAU) / Etot : 1;
    const extra = (t) => { const x = clamp01((t - t0) / (t1 - t0)) * N; const i = Math.floor(x); const f = x - i; return (i >= N ? Etab[N] : lerp(Etab[i], Etab[i + 1], f)) * fix; };
    const maanPos = (t) => { const a = theta(t); return new THREE.Vector3(Math.cos(a) * RB, 0, Math.sin(a) * RB); };
    const naarAarde = (t) => maanPos(t).negate().normalize();

    // ── objects ────────────────────────────────────────────────────────────────────────────
    const aarde = bol("aarde", { straal: 1, seed: 2, zon: zonDir }); scene.add(aarde);
    const aGloed = gloed("#5FB4FF", { grootte: 3.4, scherp: 7, alpha: 0.35 }); scene.add(aGloed);
    const draai = new THREE.Group(); scene.add(draai);           // oriented to the Earth (holds the tidal stretch)
    const maan = bol("maan", { straal: RM, seed: 4, zon: zonDir }); draai.add(maan);
    maan.userData.mat.uniforms.uMarker.value.set(-1, 0, 0);
    // pointer: from the Moon's centre out through the marked face
    const wijzer = lijn([new THREE.Vector3(-RM * 0.2, 0, 0), new THREE.Vector3(-RM * 2.6, 0, 0)], { kleur: KLEUR.koraal, breedte: 9 });
    maan.add(wijzer);
    const baan = lijn(cirkel(RB, 360), { kleur: KLEUR.teal, breedte: 11, dicht: true, wrap: true, basis: 0.16 }); scene.add(baan);
    // spin ring around the Moon (tilted with the orbit plane)
    const spinRing = lijn(cirkel(RM * 1.9, 160), { kleur: KLEUR.paars, breedte: 9, dicht: true, wrap: true, basis: 0.12 }); draai.add(spinRing);
    // tidal field lines Earth ↔ Moon, in the Earth→Moon frame (+X = towards the Moon)
    const veld = new THREE.Group(); scene.add(veld);
    [-0.75, -0.42, 0.42, 0.75].forEach((o) => {
      const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80; const x = lerp(1.05, RB - RM * 1.2, u); pts.push(new THREE.Vector3(x, o * Math.sin(Math.PI * u) * 1.1 + o * 0.25, 0)); }
      veld.add(lijn(pts, { kleur: KLEUR.magenta, breedte: 8 }));
    });
    const raster = zwaartekrachtRaster({ grootte: 22, lijnen: 26, putten: [{ x: 0, z: 0, diep: 1.6, w: 1.1 }] });
    raster.position.y = -1.9; scene.add(raster);

    // ── camera: one continuous move ────────────────────────────────────────────────────────
    const ooghoek = (t, afst, op = 0.12) => { const m = maanPos(t); return m.clone().add(naarAarde(t).multiplyScalar(afst)).add(new THREE.Vector3(0, op, 0)).toArray(); };
    const mid = (t) => maanPos(t).multiplyScalar(0.5).toArray();
    const zij = (t, afst, hoog) => { const m = maanPos(t).multiplyScalar(0.5); const d = maanPos(t).normalize(); const p = new THREE.Vector3(-d.z, 0, d.x); return m.add(p.multiplyScalar(afst)).add(new THREE.Vector3(0, hoog, 0)).toArray(); };
    const cam = camKeys([
      { t: 0, p: (t) => ooghoek(t, 2.9), l: (t) => maanPos(t).toArray(), fov: 36 },
      { t: L(0, 1), p: (t) => ooghoek(t, 3.3, 0.25), l: (t) => maanPos(t).toArray(), fov: 36, e: "lin" },
      { t: L(1, 1), p: (t) => { const m = maanPos(t), e = naarAarde(t); return m.clone().add(e.clone().multiplyScalar(1.6)).add(new THREE.Vector3(-e.z, 0, e.x).multiplyScalar(-3.0)).add(new THREE.Vector3(0, 3.0, 0)).toArray(); }, l: (t) => maanPos(t).multiplyScalar(0.62).toArray(), fov: 46 },
      { t: L(2, 1), p: [0.4, 14.5, 5.6], l: [0, 0, 0.4], fov: 52 },
      { t: L(4, 0.6), p: [4.6, 11.0, 10.0], l: [0, 0, 0], fov: 50 },
      { t: L(5, 1), p: [-2.5, 9.0, 11.5], l: [0, -0.3, 0], fov: 50 },
      { t: L(6, 1), p: (t) => zij(t, 7.4, 0.6), l: mid, fov: 50, roll: 1.25 },
      { t: L(7, 1), p: (t) => zij(t, 6.0, 0.9), l: (t) => maanPos(t).multiplyScalar(0.8).toArray(), fov: 50, roll: 1.38 },
      { t: L(8, 1), p: (t) => zij(t, 5.2, 1.4), l: (t) => maanPos(t).multiplyScalar(0.85).toArray(), fov: 50, roll: 1.42 },
      { t: L(9, 1), p: [-1.5, 12.0, 9.5], l: [0, 0, 0], fov: 50, roll: 0 },
      { t: L(10, 1), p: (t) => maanPos(t).normalize().multiplyScalar(1.45).add(new THREE.Vector3(0, 0.55, 0)).toArray(), l: (t) => maanPos(t).add(new THREE.Vector3(0, -0.15, 0)).toArray(), fov: 30 },
      { t: dur, p: (t) => maanPos(t).normalize().multiplyScalar(1.6).add(new THREE.Vector3(0, 0.62, 0)).toArray(), l: (t) => maanPos(t).add(new THREE.Vector3(0, -0.15, 0)).toArray(), fov: 36, e: "lin" },
    ]);

    let curSpin = 0, camRef = null;
    return {
      camera: (c, t) => { cam(c, t); camRef = c; },
      stof: (t) => ({ schaal: 1, mate: 1 }),
      update(t) {
        const a = theta(t);
        aarde.rotation.y = t * 0.12;
        const m = maanPos(t);
        draai.position.copy(m);
        draai.rotation.y = -a;
        // tidal stretch along the Earth-Moon line (L7 → stays a little)
        const s = smooth((t - L(7, 0)) / (L(7, 0.8) - L(7, 0))) * (1 - 0.6 * smooth((t - L(9, 0)) / (L(9, 1) - L(9, 0))));
        draai.scale.set(1, 1, 1);
        maan.scale.set(1 + 0.28 * s, 1 - 0.07 * s, 1 - 0.07 * s);
        // spin relative to the Earth direction: maan.rotation.y = -extra
        curSpin = extra(t);
        maan.rotation.y = -curSpin;
        // a stretched sphere must keep its long axis on the Earth line: use a wrapper scale instead
        if (s > 0.001) { maan.scale.set(1, 1, 1); draai.scale.set(1 + 0.28 * s, 1 - 0.07 * s, 1 - 0.07 * s); }
        maan.userData.mat.uniforms.uMarkerA.value = venster(t, 0.25, dur + 1, 0.5, 0.1);
        wijzer.userData.set({ alpha: venster(t, L(4, 0.3), L(10, 0.2), 0.4, 0.4) });
        // orbit ring: draws on in L2, trail follows the Moon
        const on = smooth((t - L(2, 0.2)) / (L(2, 1) - L(2, 0.2)));
        baan.userData.set({ kop: ((a % TAU) + TAU) % TAU / TAU, len: 0.45, alpha: on * (1 - 0.6 * venster(t, L(6, 0.5), L(9, 0.4), 0.5, 0.5)), basis: 0.18 });
        // spin ring: shows the Moon's own turn (L4–L5, L7–L9), head = spin angle
        const spinA = venster(t, L(4, 0), L(5, 1) + 0.2, 0.4, 0.4) + venster(t, L(6, 0.2), L(9, 0.9), 0.4, 0.5);
        spinRing.userData.set({ kop: (((a + curSpin) % TAU) + TAU) % TAU / TAU, len: 0.4, alpha: Math.min(1, spinA), basis: 0.15 });
        spinRing.rotation.y = 0;
        // field lines + grid
        veld.rotation.y = -a;
        const fa = venster(t, L(7, 0), L(9, 0.8), 0.4, 0.6);
        veld.children.forEach((c, i) => c.userData.set({ kop: smooth((t - L(7, 0) - i * 0.08) / 0.8) * 1.0, len: 1, alpha: fa }));
        raster.userData.alpha(venster(t, L(6, 0), L(9, 0.9), 0.8, 0.8));
        aGloed.position.set(0, 0, 0);
        aGloed.userData.set({ alpha: 0.35 * clamp01(((camRef ? camRef.position.length() : 10) - 2.4) / 1.5) });
      },
      overlay(t, ov) {
        // 27,3 DAGEN — the orbit and the spin take the same time
        const k = venster(t, L(5, 0), L(6, 0.15), 0.25, 0.3);
        if (k > 0) {
          const pop = 0.85 + 0.15 * kit.easeOut((t - L(5, 0)) / 0.3);
          ov.tekst("27,3 DAGEN", 540, 470, { maat: 124, alpha: k, schaal: pop });
          ov.tekst("1 rondje = 1 draai", 540, 580, { maat: 46, kleur: KLEUR.wit, alpha: k * 0.95, gloei: 10, gewicht: 700 });
        }
        // VROEGER — the flashback
        const v = venster(t, L(6, 0.4), L(8, 0.8), 0.25, 0.3);
        if (v > 0) {
          ov.tekst("VROEGER", 610, 250, { maat: 92, alpha: v });
          ov.dubbel(330, 250, Math.PI, 54, { kleur: KLEUR.koraal, alpha: v });
        }
        // spin chevrons around the Moon while it spins (screen space)
        const c = venster(t, L(6, 0.3), L(9, 0.6), 0.3, 0.5);
        if (c > 0) {
          const [x, y] = ov.proj(maanPos(t));
          const [x2, y2] = ov.proj(maanPos(t).add(new THREE.Vector3(0, RM * 2.3, 0)));
          const rr = Math.max(60, Math.hypot(x2 - x, y2 - y));
          const sp = omega(t) / 3.2;
          ov.ring(x, y, rr, rr, 10, -extra(t) * 0.6, { alpha: c * (0.35 + 0.65 * sp), maat: 30, richting: -1 });
        }
        // LOCKED — draai = baan
        const lk = venster(t, L(9, 0.35), L(10, 0.3), 0.25, 0.4);
        if (lk > 0) ov.tekst("DRAAI = BAAN", 540, 470, { maat: 104, kleur: KLEUR.teal, alpha: lk, schaal: 0.9 + 0.1 * kit.easeOut((t - L(9, 0.35)) / 0.3) });
      },
      post: (t) => ({ bloei: 0.6, belichting: 1.15 }),
      flits: (t) => 0.55 * venster(t, L(9, 0.3), L(9, 0.3) + 0.5, 0.06, 0.44),
    };
  },
};
