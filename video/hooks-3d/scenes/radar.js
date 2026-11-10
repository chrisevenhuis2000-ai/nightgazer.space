// Lancering — een radarsatelliet die door wolken kijkt (Electron, iQPS). Eén wereld: een wolkendek bij nacht in lagen
// (goedkope volumetrie: vijf fbm-lagen met parallax, maanlicht op de toppen), de grond eronder, de satelliet erboven.
// Variant A: frame 0 = de satelliet boven de wolkenzee, eerste puls al onderweg. Variant B: frame 0 = de raket die door
// het wolkendek breekt. Beide eindigen boven de wolken, waar ze begonnen.
window.reel = {
  maak({ THREE, kit, scene, L, dur, data }) {
    const { logCam, haakkaart, rust, NZ } = K2(THREE);
    const { lijn, cirkel, gloed, KLEUR, smooth, venster, clamp01, lerp, easeOut } = kit;
    const VAR = "__VAR__";
    const WOLK = 0, GROND = -2.2, BAAN = 5.5;
    // ── het wolkendek: lagen met dezelfde ruis, elk een eigen dichtheid (licht van boven) ────────────────
    const lagen = [];
    for (let i = 0; i < 6; i++) {
      const h = WOLK - 0.42 + i * 0.14;
      const m = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uH: { value: i / 5 }, uGat: { value: 0 }, uGatP: { value: new THREE.Vector2(0, 0) }, uA: { value: 1 } },
        vertexShader: `varying vec2 vXZ; varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vXZ = w.xz; vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: NZ + `uniform float uT; uniform float uH; uniform float uGat; uniform vec2 uGatP; uniform float uA; varying vec2 vXZ; varying vec3 vW;
          void main(){
            vec2 p = vXZ * 0.32 + vec2(uT * 0.025, 0.0);
            float d = fbm(vec3(p, 1.7)) * 1.25 + 0.3 * fbm(vec3(p * 3.1, 4.0)) - 0.45;
            float dichtheid = smoothstep(uH * 0.32 - 0.05, uH * 0.32 + 0.32, d);
            float gat = uGat * (1.0 - smoothstep(0.6, 3.2, length(vXZ - uGatP)));
            float a = dichtheid * (1.0 - gat) * 0.42 * uA;
            float ver = 1.0 - smoothstep(14.0, 30.0, length(vW - cameraPosition));
            vec3 c = mix(vec3(0.04, 0.06, 0.12), vec3(0.30, 0.36, 0.52), uH * uH) * (0.75 + 0.4 * d);
            gl_FragColor = vec4(c * a * ver, a * ver);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), m); mesh.rotation.x = -Math.PI / 2; mesh.position.y = h; mesh.renderOrder = 2 + i;
      scene.add(mesh); lagen.push(m);
    }
    // ── de grond: donker land en zee; het radarbeeld groeit regel voor regel (de scanlijn) ─────────────────────
    const grondMat = new THREE.ShaderMaterial({
      uniforms: { uScan: { value: -20 }, uA: { value: 1 } }, transparent: true, depthWrite: true,
      vertexShader: `varying vec2 vXZ; varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vXZ = w.xz; vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: NZ + `uniform float uScan; uniform float uA; varying vec2 vXZ; varying vec3 vW;
        void main(){
          float land = smoothstep(0.5, 0.53, fbm(vec3(vXZ * 0.22, 9.0)) + vXZ.x * 0.03);
          float relief = fbm(vec3(vXZ * 1.4, 2.0)) * 0.7 + fbm(vec3(vXZ * 6.0, 5.0)) * 0.3;
          float spikkel = h3(vec3(floor(vXZ * 90.0), 1.0)); float velden = 0.0;
          vec3 donker = mix(vec3(0.006, 0.01, 0.025), vec3(0.015, 0.02, 0.03), land);
          float sar = (land * (0.12 + 0.5 * relief) + (1.0 - land) * 0.03) * (0.8 + 0.4 * spikkel);
          vec3 radar = vec3(sar) * vec3(0.78, 0.82, 0.88);
          float gedaan = smoothstep(uScan + 0.05, uScan - 0.05, vXZ.y);
          float lijn = exp(-pow((vXZ.y - uScan) * 14.0, 2.0)) * step(-19.0, uScan);
          vec3 c = mix(donker, radar * 0.75, gedaan) + vec3(1.0, 0.86, 0.55) * lijn * 0.6;
          gl_FragColor = vec4(c * uA, 1.0 - smoothstep(16.0, 30.0, length(vW - cameraPosition)));
        }`,
    });
    const grond = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), grondMat); grond.renderOrder = 1; grond.rotation.x = -Math.PI / 2; grond.position.y = GROND; scene.add(grond);
    const maan = gloed("#DCE6FF", { grootte: 2.2, scherp: 7, alpha: 0.6 }); maan.position.set(-14, 9, -24); scene.add(maan);
    // ── de satelliet: romp, een plat radarpaneel dat uitvouwt ─────────────────────────────────────
    const satMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: `varying vec3 vN; varying vec3 vW; void main(){ vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
        float d = max(dot(N, normalize(vec3(-0.5,0.7,-0.6))),0.0)*0.6+0.1; float r=pow(1.0-abs(dot(N,V)),3.0);
        gl_FragColor=vec4(vec3(0.78,0.72,0.58)*d + vec3(0.37,0.85,0.92)*r*0.5, 1.0); }`, side: THREE.DoubleSide });
    function satMatDonker() { return new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: `varying vec3 vN; varying vec3 vW; void main(){ vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW); float r=pow(1.0-abs(dot(N,V)),2.5);
        gl_FragColor=vec4(vec3(0.03,0.035,0.05) + vec3(1.0,0.85,0.6)*r*0.55*smoothstep(-6.0,0.0,vW.y), 1.0); }` }); }
    // Goudfolie (MLI) met kreukels, een donkerblauw paneel met cellen; licht van de maan, een turquoise rand.
    const MAANR = "normalize(vec3(-14.0, 9.0, -24.0))";
    const folie = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vP; void main(){ vN=normalize(mat3(modelMatrix)*normal); vP=position; vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: NZ + `varying vec3 vN; varying vec3 vW; varying vec3 vP; void main(){ vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW); vec3 Lm=${MAANR};
        float k = fbm(vP * 38.0); N = normalize(N + 0.35 * vec3(k - 0.5, fbm(vP * 41.0 + 3.0) - 0.5, fbm(vP * 37.0 + 7.0) - 0.5));
        float d = max(dot(N, Lm), 0.0); float sp = pow(max(dot(reflect(-Lm, N), V), 0.0), 18.0); float r = pow(1.0 - abs(dot(N, V)), 3.0);
        vec3 c = vec3(0.62, 0.44, 0.16) * (0.18 + 0.7 * d) + vec3(1.0, 0.86, 0.55) * sp * 0.9 + vec3(0.37, 0.85, 0.92) * r * 0.35;
        gl_FragColor = vec4(c, 1.0); }` });
    const paneelMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
      vertexShader: `varying vec3 vN; varying vec3 vW; varying vec2 vU; void main(){ vU=uv; vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`,
      fragmentShader: `varying vec3 vN; varying vec3 vW; varying vec2 vU; void main(){ vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW); vec3 Lm=${MAANR};
        vec2 g = abs(fract(vU * vec2(10.0, 4.0)) - 0.5); float lijn = 1.0 - smoothstep(0.42, 0.47, max(g.x, g.y));
        float sp = pow(max(dot(reflect(-Lm, N), V), 0.0), 40.0); float r = pow(1.0 - abs(dot(N, V)), 2.5);
        vec3 c = vec3(0.035, 0.06, 0.12) + vec3(0.45, 0.55, 0.65) * (1.0 - lijn) * 0.22 + vec3(0.8, 0.9, 1.0) * sp * 0.6 + vec3(0.37, 0.85, 0.92) * r * 0.25;
        gl_FragColor = vec4(c, 1.0); }` });
    const sat = new THREE.Group(); scene.add(sat);
    sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.3), folie));
    const kap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 12), folie); kap.position.y = 0.26; sat.add(kap);
    const vleugels = [-1, 1].map((s) => { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.025, 0.46), paneelMat); p.position.x = s * 0.6; g.add(p);
      g.add(lijn([new THREE.Vector3(0, 0, 0), new THREE.Vector3(s * 0.05, 0, 0)], { kleur: "#C9D6E8", breedte: 2 })); g.position.set(s * 0.15, -0.16, 0); sat.add(g); return g; });
    // ── de raket: slank, een warm spoor ─────────────────────────────────────────────────────────────
    const raket = new THREE.Group(); scene.add(raket);
    const rMat = satMatDonker();
    const romp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 16), rMat); raket.add(romp);
    const neus = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 16), rMat); neus.position.y = 0.71; raket.add(neus);
    const vlam = gloed("#FFE2A8", { grootte: 0.9, scherp: 5, alpha: 1 }); vlam.position.y = -0.7; raket.add(vlam);
    const spoorPts = []; for (let i = 0; i <= 80; i++) spoorPts.push(new THREE.Vector3(0, lerp(GROND - 1, BAAN, i / 80), 0));
    const spoor = lijn(spoorPts, { kleur: "#FFD9A0", breedte: 6 }); scene.add(spoor);
    const lanceer = VAR === "B" ? -0.6 : L(1, 0);
    const raketY = (t) => { const y0 = VAR === "B" ? -0.2 : GROND - 1, t0 = VAR === "B" ? 0 : L(1, 0); const x = clamp01((t - t0) / (L(2, 0.8) - t0)); return lerp(y0, BAAN + 1, x * x * 0.6 + x * 0.4); };
    // ── pulsen: warme ringen omlaag, echo omhoog ───────────────────────────────────────────────────
    const ringen = []; for (let i = 0; i < 4; i++) { const r = lijn(cirkel(1, 160), { kleur: "#FFE6B8", breedte: 5, dicht: true }); scene.add(r); ringen.push(r); }
    const satPos = (t) => new THREE.Vector3(lerp(-1.5, 1.5, t / dur), BAAN, lerp(2.0, -2.0, t / dur));
    const scan = (t) => lerp(-12, 10, smooth((t - L(7, 0)) / (L(8, 1) - L(7, 0))));
    // ── camera ───────────────────────────────────────────────────────────────────────────────
    const bijSat = (afst, fov, rich = [0.75, 0.32, 0.65]) => ({ doel: (t) => satPos(t).add(new THREE.Vector3(0, -0.35, 0)).toArray(), richting: rich, afstand: afst, fov });
    const bijRaket = (afst, fov) => ({ doel: (t) => [0, Math.max(raketY(t), 0.25) + 0.2, 0], kijk: (t) => [0, raketY(t) + 0.1, 0], richting: [0.85, 0.32, 0.6], afstand: afst, fov });
    const onder = { doel: [0, GROND, -2], kijk: [0, GROND, -3], richting: [0.05, 0.9, 0.6], afstand: 7.0, fov: 54 };
    // Rustpunten in de pauzes (P); van de baan naar de grond en terug altijd via een wijd beeld.
    const P = rust(L, data.lijnen.length);
    const wijd = { doel: [0, 1.6, 0], richting: [0.85, 0.25, 0.6], afstand: 14, fov: 46 };
    const omlaag = { doel: [0, 2.2, -0.5], richting: [0.25, 0.7, 0.66], afstand: 11, fov: 50 };
    const keys = [
      ...(VAR === "A"
        ? [{ t: 0, ...bijSat(5.2, 38) }, { t: P(0), ...bijSat(5.8, 39) }, { t: P(1), ...wijd }]
        : [{ t: 0, ...bijRaket(5.5, 40) }, { t: P(0), ...bijRaket(6.0, 42) }, { t: P(1), ...bijRaket(7.5, 44) }]),
      { t: P(2), ...bijSat(4.4, 40) },
      { t: P(3), ...bijSat(3.4, 38, [0.9, 0.08, 0.42]) },
      { t: P(4), ...bijSat(5.5, 46, [0.65, -0.2, 0.72]) },
      { t: P(5), ...bijSat(8.0, 50, [0.4, -0.1, 0.9]) },
      { t: P(6), ...omlaag },
      { t: P(7), ...onder },
      { t: P(8), ...onder, afstand: 7.6, richting: [0.0, 0.95, 0.35] },
      { t: (P(8) + dur) / 2, ...wijd, afstand: 15, vast: 0 },
      { t: dur, ...(VAR === "A" ? bijSat(5.2, 38) : bijSat(5.5, 40)) },
    ];
    const cam = logCam(keys);
    let camRef = null;
    return {
      camera: (c, t) => { cam(c, t); camRef = c; },
      update(t) {
        lagen.forEach((m) => { m.uniforms.uT.value = t; m.uniforms.uGat.value = smooth((t - L(6, 0)) / (L(6, 1) - L(6, 0))) * (1 - smooth((t - L(8, 0)) / (L(8, 1) - L(8, 0)))); m.uniforms.uGatP.value.set(0, -2); });
        const sp = satPos(t); sat.position.copy(sp); sat.rotation.y = 0.4;
        const uit = smooth((t - L(3, 0)) / (L(3, 1) - L(3, 0)));
        vleugels.forEach((g, i) => { g.rotation.z = (i ? -1 : 1) * lerp(1.45, 0, VAR === "A" && t < L(3, 0) ? 1 - smooth((t - L(0, 1)) / (L(1, 1) - L(0, 1))) : uit); });
        const ry = raketY(t); raket.position.set(0, ry, 0);
        raket.visible = t < L(2, 1) + 0.2 && (VAR === "B" || t >= L(1, 0)); raket.scale.setScalar(0.7);
        vlam.userData.set({ alpha: 0.9 + 0.1 * Math.sin(t * 40) });
        spoor.userData.set({ kop: clamp01((ry - GROND + 1) / (BAAN - GROND + 2)), len: 0.45, alpha: venster(t, VAR === "B" ? -1 : L(1, 0), L(2, 1) + 0.3, 0.2, 0.5) });
        // pulsen: in A al in frame 0 onderweg; daarna L4–L6
        ringen.forEach((r, i) => {
          const cyc = 2.4, aan = (VAR === "A" && t < L(0, 1) + 0.6) || (t > L(4, 0) && t < L(6, 1));
          const f = ((t + i * cyc / 4) % cyc) / cyc;
          const omlaag = i % 2 === 0;
          const y = omlaag ? lerp(sp.y - 0.3, GROND, f) : lerp(GROND, sp.y - 0.3, f);
          r.position.set(sp.x, y, sp.z); const s = omlaag ? lerp(0.15, 3.2, f) : lerp(3.2, 0.15, f); r.scale.set(s, 1, s);
          r.userData.set({ alpha: aan ? (omlaag ? 1 : 0.55) * Math.sin(Math.PI * f) : 0 });
        });
        grondMat.uniforms.uScan.value = t < L(7, 0) ? -20 : scan(t); grondMat.uniforms.uA.value = 1 - 0.6 * smooth((t - L(8, 0.5)) / (L(9, 0.5) - L(8, 0.5)));
      },
      overlay(t, ov) {
        haakkaart(ov, t, L, data);
        const lab = (k, p, dy, a, kleur = KLEUR.wit) => { if (a <= 0.01) return; const [x, y, voor] = ov.proj(p); if (!voor) return;
          ov.tekst(k, Math.max(220, Math.min(y + dy > 860 ? 720 : 860, x)), Math.max(290, Math.min(1470, y + dy)), { maat: 46, kleur, alpha: a, gloei: 10, gewicht: 700 }); };
        lab("raket", new THREE.Vector3(0, raketY(t), 0), -180, venster(t, VAR === "B" ? L(1, 0) : L(1, 0.2), L(2, 0.5), 0.3, 0.3));
        const kb = venster(t, L(2, 0.2), L(2, 1) + 0.2, 0.3, 0.3);
        if (kb > 0) ov.tekst("baan", 540, 420, { maat: 62, alpha: kb });
        lab("satelliet", satPos(t), -150, venster(t, L(3, 0), L(3, 1) + 0.2, 0.3, 0.3));
        lab("puls", satPos(t).setY(1.2), 0, venster(t, L(4, 0.2), L(4, 1) + 0.1, 0.3, 0.3), KLEUR.creme);
        lab("echo", satPos(t).setY(2.4), 0, venster(t, L(5, 0.2), L(5, 1) + 0.1, 0.3, 0.3), KLEUR.creme);
      },
      post: () => ({ bloei: 0.6, belichting: 0.95 }),
      flits: (t) => 0.45 * venster(t, L(7, 0.5), L(7, 0.5) + 0.5, 0.06, 0.44),
    };
  },
};
