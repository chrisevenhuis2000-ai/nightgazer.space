// Vannacht — de hoorns van Venus. Eén wereld: zon, Venus en de aarde op (bijna) één lijn.
// Variant A: frame 0 = de bijna gesloten boog ("Dit is geen maan."). Variant B: frame 0 = de ochtendhorizon boven NL met
// Venus laag in het zuidoosten ("Vrijdagochtend…"), dan een log-zoom naar de sikkel. Beide eindigen waar ze begonnen.
window.reel = {
  maak({ THREE, kit, scene, L, dur, data, ov }) {
    const { atmosfeer, planeet, textuurBol, breedteLengte, logCam, haakkaart, rust } = K2(THREE);
    const { lijn, gloed, zon: maakZon, KLEUR, smooth, venster, clamp01, lerp, easeOut } = kit;
    const VAR = "__VAR__";
    // ── de wereld ───────────────────────────────────────────────────────────────────────────────
    const S = new THREE.Vector3(0, -9, -30), E = new THREE.Vector3(0, 0, 70), RE = 3;
    const Ld = S.clone().normalize();                                   // van Venus naar de zon
    const venus = planeet("venus", { straal: 1, zon: Ld, seed: 3 }); scene.add(venus);
    const halo = atmosfeer({ straal: 1.045, zon: Ld, dag: 0.5, voor: 3.0 }); scene.add(halo);
    const zonG = maakZon({ straal: 2.2 }); zonG.position.copy(S); scene.add(zonG);
    // De aarde: Black Marble (NASA, publiek domein), met NL bovenaan en het zuidoosten richting Venus.
    const ochtend = new THREE.Vector3(0.0, -0.32, -1).normalize();      // de zon net onder de horizon, in het zuidoosten
    const aarde = textuurBol("aarde-nacht-2016.jpg", { straal: RE, zon: ochtend, nacht: true, helder: 1.0 });
    const nl = breedteLengte(52.1, 5.2).normalize();
    const q1 = new THREE.Quaternion().setFromUnitVectors(nl, new THREE.Vector3(0, 1, 0));
    const noord = breedteLengte(53.1, 5.2).normalize().sub(nl).applyQuaternion(q1); noord.y = 0; noord.normalize();
    const oost = breedteLengte(52.1, 6.5).normalize().sub(nl).applyQuaternion(q1); oost.y = 0; oost.normalize();
    const zo = oost.clone().sub(noord).normalize();                     // zuidoost in het raakvlak
    const q2 = new THREE.Quaternion().setFromUnitVectors(zo, new THREE.Vector3(0, 0, -1));
    aarde.quaternion.copy(q2.multiply(q1)); aarde.position.copy(E); scene.add(aarde);
    const lucht = atmosfeer({ binnen: RE, straal: RE * 1.03, zon: ochtend, kleur: [0.55, 0.78, 1.0], dag: 0.9, voor: 1.2 });
    lucht.position.copy(E); lucht.userData.set({ spreiding: -0.2 }); scene.add(lucht);
    const vGloed = gloed("#FFF1D6", { grootte: 3.2, scherp: 9, alpha: 0 }); scene.add(vGloed);
    // de lijn zon – Venus – aarde en de lichtstralen die om de rand buigen
    const as = lijn([S.clone().multiplyScalar(0.9), new THREE.Vector3(0, 0, 0), E.clone().setZ(E.z - RE * 1.4)], { kleur: KLEUR.teal, breedte: 5 });
    scene.add(as);
    const stralen = new THREE.Group(); scene.add(stralen);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3, ring = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
      const pts = [];
      for (let k = 0; k <= 60; k++) {
        const u = k / 60, z = lerp(-9, 9, u), r = 1.09 + 0.55 * Math.pow(Math.abs(z) / 9, 2);
        pts.push(ring.clone().multiplyScalar(r).add(new THREE.Vector3(0, 0, z)).applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.atan2(-Ld.y, -Ld.z) * 0));
      }
      const l = lijn(pts, { kleur: KLEUR.creme, breedte: 4 }); l.lookAt(Ld.clone().negate()); stralen.add(l);
    }
    // ── tijd: de boog ─────────────────────────────────────────────────────────────────────────
    // A: frame 0 al bijna rond; B: pas na de zoom. Bij "nachtkant" klein, bij de onthulling voorbij 180 graden, slot = begin.
    const spreidingVan = (t) => {
      const begin = VAR === "A" ? 0.35 : 0.2;
      const krimp = smooth((t - L(2, 0)) / (L(3, 1) - L(2, 0)));
      const groei = smooth((t - L(4, 0.2)) / (L(5, 0.6) - L(4, 0.2)));
      const slot = smooth((t - L(7, 0)) / (L(8, 0.5) - L(7, 0)));
      return lerp(lerp(lerp(begin, -0.25, krimp), 0.92, groei), VAR === "A" ? 0.35 : 0.2, slot);
    };
    // ── de camera: één doorlopende beweging, log-afstand ─────────────────────────────────────────
    const naarAarde = [0.05, 0.12, 1];                          // richting van Venus naar de camera (aardekant)
    const sikkel = (afst, fov) => ({ doel: [0, -0.18, 0], richting: naarAarde, afstand: afst, fov });
    const horizonCam = E.clone().add(new THREE.Vector3(0, RE + 0.11, 0));
    const horizon = (fov, kijkY) => ({ doel: [0, 0, 0], kijk: [0, kijkY, 0], richting: horizonCam.clone().normalize().toArray(), afstand: horizonCam.length(), fov });
    const zij = { doel: [0, -4, 20], richting: [1, 0.15, 0], afstand: 150, fov: 46, op: [0, 0, -1] };
    // Rustpunten in de pauzes (P); de wissels in het midden van een zin, en nooit een draai van 90 graden in één zin.
    const P = rust(L, data.lijnen.length);
    const schuinZij = { doel: [0, -1, 5], richting: [0.45, 0.15, 0.88], afstand: 22, fov: 42, op: [0, 0.85, -0.5] };
    const zijZacht = { ...zij, richting: [0.85, 0.15, 0.5], op: [0, 0.5, -0.87] };
    const dicht = { doel: [0, 0, 0], richting: [0.9, 0.2, 0.4], afstand: 5.2, fov: 40, op: [0, 1, 0] };
    const begin = VAR === "A"
      ? [{ t: 0, ...sikkel(7.6, 34) }, { t: P(0), ...sikkel(7.2, 34) }, { t: P(1), ...sikkel(8.6, 36) }]
      : [{ t: 0, ...horizon(28, -6) }, { t: P(0), ...horizon(25, -3.5), vast: 0.6 }, { t: P(1), ...sikkel(8.6, 36) }];
    const keys = [
      ...begin,
      { t: P(2), ...schuinZij },
      { t: P(3), ...zijZacht },
      { t: P(4), ...dicht },
      { t: P(5), ...sikkel(7.2, 36) },
      { t: P(6), ...horizon(28, -6), vast: 0.6 },  // de grond verschijnt pas als de camera over de aarde komt: ruim vóór de zinsgrens
      { t: P(7), ...horizon(24, -4) },
      { t: dur, ...(VAR === "A" ? sikkel(7.6, 34) : horizon(26, -4.5)) },
    ];
    const cam = logCam(keys);
    let camRef = null;
    return {
      camera: (c, t) => { cam(c, t); camRef = c; },
      update(t) {
        const s = spreidingVan(t);
        venus.userData.set({ spreiding: s }); halo.userData.set({ spreiding: s });
        venus.rotation.y = t * 0.03;
        const afst = camRef ? camRef.position.length() : 8;
        vGloed.userData.set({ alpha: 0.9 * clamp01((afst - 20) / 25) });  // van ver: een felle stip
        const zonA = venster(t, L(2, 0.2), L(4, 0.2), 0.6, 0.6) * clamp01(((camRef ? camRef.position.length() : 8) - 26) / 40);
        zonG.visible = zonA > 0.01;
        zonG.children.forEach((c) => c.material && c.material.uniforms && c.material.uniforms.uA && (c.material.uniforms.uA.value = zonA));
        as.userData.set({ kop: smooth((t - L(2, 0.3)) / 1.0), len: 1, alpha: venster(t, L(2, 0.2), L(3, 1), 0.4, 0.5) });
        stralen.children.forEach((l, i) => l.userData.set({ kop: smooth((t - L(4, 0.45) - i * 0.07) / 2.0), len: 0.35, alpha: venster(t, L(4, 0), L(5, 0.7), 0.3, 0.5) }));
      },
      overlay(t, ov) {
        haakkaart(ov, t, L, data);
        const lab = (k, p, dy, a, o = {}) => { if (a <= 0.01) return; const [x, y, voor] = ov.proj(p); if (!voor) return;
          ov.tekst(k, Math.max(170, Math.min(y + dy > 840 ? 820 : 910, x)), Math.max(280, Math.min(1480, y + dy)), { maat: 46, kleur: KLEUR.wit, alpha: a, gloei: 10, gewicht: 700, ...o }); };
        const w = venster(t, L(2, 0.5), L(3, 1), 0.3, 0.4);
        lab("zon", S, -90, w); lab("venus", new THREE.Vector3(0, 0, 0), -80, w); lab("aarde", E, -110, w);
        const g = venster(t, L(5, 0), L(6, 0.2), 0.25, 0.35);
        if (g > 0) ov.tekst("graden", 540, 420, { maat: 120, alpha: g, schaal: 0.85 + 0.15 * easeOut((t - L(5, 0)) / 0.3), teller: (t - L(5, 0)) / 0.5 });
        const h = Math.max(venster(t, L(6, 0.3), L(8, 1) + 1, 0.3, 0.3) * (VAR === "A" ? venster(t, 0, L(7, 1) + 0.2, 0.1, 0.4) : 1),
                           VAR === "B" ? venster(t, -1, L(0, 1) + 0.4, 0.01, 0.4) : 0);
        if (h > 0 && camRef && camRef.position.length() > 30) {
          const [x, y] = ov.proj(new THREE.Vector3(0, 0, 0));
          ov.tekst("zuidoost", Math.max(200, Math.min(880, x)), Math.min(1480, y + 190), { maat: 44, kleur: KLEUR.teal, alpha: h, gloei: 12, gewicht: 700 });
          ov.dubbel(Math.max(200, Math.min(880, x)), Math.min(1480, y + 130), -Math.PI / 2, 40, { kleur: KLEUR.teal, alpha: h * 0.9 });
        }
      },
      post: () => ({ bloei: 0.7, belichting: 0.95 }),
      flits: (t) => 0.5 * venster(t, L(5, 0.35), L(5, 0.35) + 0.5, 0.06, 0.44),
      onderwerp: () => (VAR === "A" ? [200, 380, 880, 1060] : [140, 300, 940, 1500]),
    };
  },
};
