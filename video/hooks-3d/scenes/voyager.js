// Snap het — een bericht naar Voyager 1 (een lichtdag op 18 november 2026). Eén wereld: zon, banen, de aarde (Black
// Marble, nachtkant), en ver boven het vlak de sonde. De camera reist mee met het bericht, met log-afstand (powers of ten).
// Variant A: frame 0 = de sonde, met het lichtspoor terug naar een stipje aarde. Variant B: frame 0 = Nederland bij nacht,
// het bericht vertrekt. A eindigt bij de sonde, B weer bij de aarde.
window.reel = {
  maak({ THREE, kit, scene, L, dur, data }) {
    const { textuurBol, atmosfeer, breedteLengte, logCam, haakkaart, rust } = K2(THREE);
    const { lijn, cirkel, gloed, zon: maakZon, KLEUR, smooth, venster, clamp01, lerp, easeOut } = kit;
    const VAR = "__VAR__";
    const E = new THREE.Vector3(6, 0, 0), RE = 0.32;
    const V = new THREE.Vector3(-70, 92, -96);                         // na Saturnus "headed north out of the ecliptic plane"
    const zonG = maakZon({ straal: 0.9 }); scene.add(zonG);
    [6, 31, 57].forEach((r, i) => scene.add(lijn(cirkel(r, 360), { kleur: KLEUR.teal, breedte: i ? 3 : 4, dicht: true, alpha: i ? 0.35 : 0.55 })));
    const jup = kit.bol("mars", { straal: 0.9, seed: 7, zon: new THREE.Vector3(1, 0, 0) }); jup.position.set(-22, 0, -22); scene.add(jup);
    const sat = kit.bol("maan", { straal: 0.75, seed: 9, zon: new THREE.Vector3(1, 0, 0) }); sat.position.set(40, 0, -40); scene.add(sat);
    const zonRicht = E.clone().negate().normalize();
    const aarde = textuurBol("aarde-nacht-2016.jpg", { straal: RE, zon: zonRicht, nacht: true, helder: 1.7 });
    // NL naar de camera-kant (de nachtkant, weg van de zon)
    const nl = breedteLengte(52.1, 5.2).normalize();
    aarde.quaternion.setFromUnitVectors(nl, new THREE.Vector3(0.55, 0.5, 0.67).normalize());
    aarde.position.copy(E); scene.add(aarde);
    const lucht = atmosfeer({ binnen: RE, straal: RE * 1.035, zon: zonRicht, kleur: [0.5, 0.75, 1.0], dag: 1.0, voor: 1.4 }); lucht.position.copy(E); scene.add(lucht);
    const nlPunt = (t) => nl.clone().applyQuaternion(aarde.quaternion).multiplyScalar(RE * 1.01).add(E);
    // de sonde: schotel, romp, gieken, de gouden plaat
    const sonde = new THREE.Group(); sonde.position.copy(V); scene.add(sonde);
    const mat = new THREE.ShaderMaterial({ uniforms: { uL: { value: zonRicht.clone() } },
      vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: `uniform vec3 uL; varying vec3 vN; varying vec3 vW; void main(){ vec3 N=normalize(vN); vec3 Vv=normalize(cameraPosition-vW);
        float d=max(dot(N,normalize(-vW)),0.0)*0.55+0.08; float r=pow(1.0-abs(dot(N,Vv)),3.0);
        gl_FragColor=vec4(vec3(0.80,0.83,0.88)*(0.25+0.75*d) + vec3(0.37,0.85,0.92)*r*0.7, 1.0); }`, side: THREE.DoubleSide });
    const prof = []; for (let i = 0; i <= 24; i++) { const r = i / 24; prof.push(new THREE.Vector2(r * 1.1, r * r * 0.38)); }
    const schotelMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
        float voor = step(0.0, dot(N, V)); float r = vUv.y;
        vec3 c = mix(vec3(0.13,0.15,0.19), vec3(0.50,0.53,0.58), smoothstep(0.0, 1.0, r)) * mix(0.55, 1.0, voor);
        c += vec3(0.37,0.85,0.92) * pow(1.0-abs(dot(N,V)),2.5) * 0.45;
        c *= 1.0 - 0.55 * smoothstep(0.93, 0.97, r) * (1.0 - smoothstep(0.985, 1.0, r));
        c += vec3(0.9,0.95,1.0) * exp(-pow((r - 0.62) * 40.0, 2.0)) * 0.12;
        gl_FragColor = vec4(c, 1.0); }` });
    const schotel = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), schotelMat); schotel.position.y = 0.05; sonde.add(schotel);
    const romp = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10), mat); romp.position.y = -0.17; sonde.add(romp);
    const goud = new THREE.Mesh(new THREE.CircleGeometry(0.15, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.86, 0.68, 0.36), side: THREE.DoubleSide }));
    goud.position.set(0, -0.17, 0.35); sonde.add(goud);
    const glint = gloed("#FFD58A", { grootte: 0.9, scherp: 10, alpha: 0 }); glint.position.set(0, -0.17, 0.4); sonde.add(glint);
    [[1, -0.1, 0.2, 3.0], [-1, -0.1, -0.3, 2.2], [0.2, -0.15, -1, 4.2]].forEach(([x, y, z, len]) => {
      const d = new THREE.Vector3(x, y, z).normalize();
      sonde.add(lijn([new THREE.Vector3(0, -0.17, 0), d.multiplyScalar(len).add(new THREE.Vector3(0, -0.17, 0))], { kleur: "#C9D6E8", breedte: 2.5, alpha: 0.9 }));
    });
    // de schotel (+Y) kijkt naar huis
    const naarHuis = E.clone().sub(V).normalize();
    sonde.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), naarHuis);
    const opzij = new THREE.Vector3().crossVectors(naarHuis, new THREE.Vector3(0, 1, 0)).normalize();
    const schuin = (a, b) => naarHuis.clone().multiplyScalar(a).add(opzij.clone().multiplyScalar(b)).add(new THREE.Vector3(0, 0.25, 0)).normalize().toArray();
    // het bericht: een puls met een spoor van de aarde naar de sonde
    const pad = []; for (let i = 0; i <= 200; i++) pad.push(new THREE.Vector3().lerpVectors(E, V, i / 200));
    const spoor = lijn(pad, { kleur: KLEUR.teal, breedte: 7, basis: 0 }); scene.add(spoor);
    const puls = gloed("#E8FBFF", { grootte: 1, scherp: 6, alpha: 0 }); scene.add(puls);
    const vertrek = VAR === "A" ? L(1, 0.4) : L(0, 0.5), aankomst = L(7, 0.6);
    const prog = (t) => { const x = clamp01((t - vertrek) / (aankomst - vertrek)); return x < 0.12 ? 0.12 * Math.pow(x / 0.12, 2.5) : x; };
    const pulsPos = (t) => new THREE.Vector3().lerpVectors(nlPunt(t), V, prog(t));
    // ── de camera ───────────────────────────────────────────────────────────────────────────
    const omhoog = V.clone().sub(E).normalize();
    const bijSonde = (afst, fov, rich = schuin(0.75, 0.6)) => ({ doel: V.toArray(), richting: rich, afstand: afst, fov });
    const bijAarde = (afst, fov) => ({ doel: E.clone().add(omhoog.clone().multiplyScalar(RE * 0.9)).toArray(), richting: nl.clone().applyQuaternion(aarde.quaternion).add(new THREE.Vector3(0, -0.35, 0)).normalize().toArray(), afstand: afst, fov });
    const metPuls = (afst, fov, rich) => ({ doel: (t) => pulsPos(t).toArray(), richting: rich, afstand: afst, fov });
    const boven = { doel: [0, 0, 0], richting: [0.15, 1, 0.55], afstand: 190, fov: 46 };
    // Rustpunten in de pauzes (P). Het doel blijft de sonde: de camera zoomt alleen uit en in langs de lijn naar huis
    // (over de aarde en de zon heen), met kleine draaien. Geen pan door de leegte, dus geen sprongen.
    // B deelt de camera met A; B verschilt in de haak en de puls die al in beeld onderweg is.
    const P = rust(L, data.lijnen.length);
    const langs = (afst, fov, a, b) => ({ doel: V.toArray(), richting: schuin(a, b), afstand: afst, fov });
    const keys = [
      { t: 0, ...bijSonde(11, 34) },
      { t: P(0), ...bijSonde(12.5, 35) },
      { t: P(1), ...langs(34, 38, 0.82, 0.5) },
      { t: P(2), ...langs(100, 42, 0.9, 0.36) },
      { t: P(3), ...langs(225, 46, 0.95, 0.24), vast: 0.2 },
      { t: P(4), ...bijSonde(10, 38), vast: 0.24 },
      { t: P(5), ...bijSonde(9.5, 38, schuin(0.62, 0.78)) },
      { t: P(6), ...bijSonde(11, 40, schuin(0.8, 0.35)) },
      { t: P(7), ...bijSonde(10, 38, schuin(0.6, 0.75)) },
      { t: P(8), ...bijSonde(9, 34, schuin(0.4, 0.9)) },
      { t: dur, ...(VAR === "A" ? bijSonde(11, 34) : bijSonde(13, 36)) },
    ];
    keys.hoog = 180;
    const cam = logCam(keys);
    return {
      camera: (c, t) => { cam(c, t); c.far = 4000; c.updateProjectionMatrix(); },
      update(t) {
        aarde.rotation.z = 0;
        const p = prog(t);
        spoor.userData.set({ kop: p, len: VAR === "A" && t < L(1, 0.4) ? 1 : 0.35, alpha: VAR === "A" && t < L(1, 0.4) ? 0.55 * (1 - smooth((t - L(0, 1)) / 0.6)) : venster(t, vertrek, L(9, 0.5), 0.2, 0.6), basis: 0.08 });
        puls.position.copy(pulsPos(t)); puls.scale.setScalar(0.12 + 2.0 * Math.sqrt(p));
        puls.userData.set({ alpha: venster(t, vertrek, aankomst + 0.3, 0.15, 0.3) });
        glint.userData.set({ alpha: venster(t, L(8, 0), L(9, 0.6), 0.4, 0.5) * (0.6 + 0.4 * Math.sin(t * 3) ** 2) });
      },
      overlay(t, ov) {
        haakkaart(ov, t, L, data);
        const k5 = venster(t, L(5, 0), L(5, 1) + 0.2, 0.25, 0.3);
        if (k5 > 0) ov.tekst("afstand", 540, 430, { maat: 96, alpha: k5, teller: (t - L(5, 0)) / 0.7 });
        const k4 = venster(t, L(4, 0.3), L(4, 1) + 0.1, 0.25, 0.3);
        if (k4 > 0) ov.tekst("jaar", 540, 430, { maat: 120, alpha: k4, teller: (t - L(4, 0.3)) / 0.6 });
        const k6 = venster(t, L(6, 0.1), L(7, 0.2), 0.25, 0.3);
        if (k6 > 0) { ov.tekst("datum", 540, 420, { maat: 112, alpha: k6, schaal: 0.85 + 0.15 * easeOut((t - L(6, 0.1)) / 0.3) }); ov.tekst("lichtdag", 540, 530, { maat: 50, kleur: KLEUR.wit, alpha: k6, gloei: 10, gewicht: 700 }); }
        const k8 = venster(t, L(8, 0.2), L(8, 1) + 0.3, 0.25, 0.3);
        if (k8 > 0) ov.tekst("talen", 540, 430, { maat: 104, alpha: k8, teller: (t - L(8, 0.2)) / 0.5 });
        const kv = venster(t, L(4, 0), L(7, 1), 0.3, 0.3);
        if (kv > 0) { const [x, y, voor] = ov.proj(V); if (voor) ov.tekst("voyager", Math.max(200, Math.min(880, x)), Math.max(300, Math.min(1460, y - 230)), { maat: 46, kleur: KLEUR.wit, alpha: kv * 0.95, gloei: 10, gewicht: 700 }); }
        const kb = VAR === "B" ? venster(t, 0, L(1, 0.5), 0.01, 0.4) : 0;
        if (kb > 0) { const [x, y, voor] = ov.proj(nlPunt(t)); if (voor) ov.tekst("bericht", Math.max(200, Math.min(880, x)), Math.max(300, Math.min(1460, y - 120)), { maat: 46, kleur: KLEUR.teal, alpha: kb, gloei: 12, gewicht: 700 }); }
      },
      post: () => ({ bloei: 0.65, belichting: 0.95 }),
      flits: (t) => 0.5 * venster(t, L(6, 0.15), L(6, 0.15) + 0.5, 0.06, 0.44),
      stof: (t) => ({ schaal: 1, mate: 1 }),
    };
  },
};
