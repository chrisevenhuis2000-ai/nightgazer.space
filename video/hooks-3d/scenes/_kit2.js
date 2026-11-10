// ── Kit 2 (proef): bouwstenen die in fase 3 naar _gedeeld/huisstijl.js gaan. Hier inline, want data.scene mag niets importeren.
// atmosfeer(): een halo-schil met dagkant + voorwaartse verstrooiing (tegenlicht), en `spreiding` die de boog rond de rand sluit.
// planeet(): een bol met terminator, nachtkant en een binnenrand die meedoet met de atmosfeer. textuurBol(): een NASA-kaart.
// logCam(): een camera die afstand logaritmisch interpoleert (powers of ten) tussen houdingen.
const K2 = (THREE) => {
  const NZ = `
    float h3(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }
    float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }`;
  const VS = `varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec2 vUv;
    void main(){ vP=position; vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.)).xyz;
      gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.); }`;
  function atmosfeer({ binnen = 1, straal = 1.06, kleur = [1.0, 0.84, 0.6], dag = 0.4, voor = 2.6, zon }) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uL: { value: zon.clone().normalize() }, uCol: { value: new THREE.Vector3(...kleur) }, uDag: { value: dag },
                  uVoor: { value: voor }, uSpread: { value: 0 }, uA: { value: 1 }, uR: { value: binnen / straal } },
      vertexShader: VS,
      fragmentShader: `uniform vec3 uL; uniform vec3 uCol; uniform float uDag; uniform float uVoor; uniform float uSpread; uniform float uA; uniform float uR;
        varying vec3 vW; varying vec3 vN;
        void main(){
          vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN);
          float d = clamp(-dot(N, V), 0.0, 1.0);
          float edge = sqrt(max(0.0, 1.0 - uR * uR));           // -dot(N,V) op de rand van de planeet
          float f = pow(clamp(d / max(edge, 1e-3), 0.0, 1.0), 3.0) * (1.0 - smoothstep(edge, edge + 0.08, d));
          float lp = dot(N, uL);
          float day = smoothstep(-0.25, 0.55, lp);
          vec3 Lp = uL - V * dot(uL, V); float lq = length(Lp) > 1e-4 ? dot(N, normalize(Lp)) : 0.0;
          float boog = smoothstep(-uSpread - 0.15, -uSpread + 0.15, lq);
          float fwd = pow(max(0.0, dot(-V, uL)), 6.0);
          float taps = mix(0.12 + 0.7 * clamp(uSpread - 0.3, 0.0, 1.0), 1.0, smoothstep(-0.9, 0.9, lq));
          vec3 c = uCol * f * (uDag * day + uVoor * fwd * boog * taps) * uA;
          gl_FragColor = vec4(c, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(straal, 160, 120), mat);
    m.userData.set = ({ spreiding, alpha, zon: z } = {}) => {
      if (spreiding != null) mat.uniforms.uSpread.value = spreiding;
      if (alpha != null) mat.uniforms.uA.value = alpha;
      if (z) mat.uniforms.uL.value.copy(z).normalize();
    };
    return m;
  }
  // soort: 'venus' (wolkendek), 'rots' (grijs). Terminator met zachte overgang, binnenrand warm bij tegenlicht.
  function planeet(soort, { straal = 1, zon, seed = 1 }) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uL: { value: zon.clone().normalize() }, uSeed: { value: seed }, uSpread: { value: 0 }, uLicht: { value: 1 } },
      vertexShader: VS,
      fragmentShader: NZ + `uniform vec3 uL; uniform float uSeed; uniform float uSpread; uniform float uLicht;
        varying vec3 vW; varying vec3 vN; varying vec3 vP;
        void main(){
          vec3 p = normalize(vP); vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
          ${soort === "venus"
            ? `float b = fbm(vec3(p.x*2.0, p.y*7.0, p.z*2.0) + uSeed); vec3 alb = mix(vec3(0.80,0.72,0.55), vec3(0.97,0.92,0.80), b);`
            : `float b = fbm(p*4.0 + uSeed); vec3 alb = mix(vec3(0.36,0.37,0.40), vec3(0.66,0.66,0.68), b);`}
          float lp = dot(N, uL);
          float lit = smoothstep(-0.04, 0.32, lp);
          vec3 c = alb * lit * 1.15 * uLicht + vec3(0.006, 0.008, 0.018);
          float mu = clamp(dot(N, V), 0.0, 1.0);
          float fwd = pow(max(0.0, dot(-V, uL)), 6.0);
          vec3 Lp = uL - V * dot(uL, V); float lq = length(Lp) > 1e-4 ? dot(N, normalize(Lp)) : 0.0;
          float boog = smoothstep(-uSpread - 0.15, -uSpread + 0.15, lq);
          c += vec3(1.0, 0.82, 0.58) * pow(1.0 - mu, 6.0) * fwd * boog * mix(0.12, 1.0, smoothstep(-0.9, 0.9, lq)) * 1.4;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(straal, 160, 120), mat);
    m.userData.set = ({ spreiding, licht } = {}) => {
      if (spreiding != null) mat.uniforms.uSpread.value = spreiding;
      if (licht != null) mat.uniforms.uLicht.value = licht;
    };
    return m;
  }
  // Een bol met een NASA-kaart uit assets/scenes/texturen/ (licentie en credit in texturen.json).
  // nacht: de kaart is licht (Black Marble): hij gloeit op de nachtkant en verdwijnt in de dag.
  function textuurBol(bestand, { straal = 1, zon, nacht = false, helder = 2.2 }) {
    window.THREE = window.THREE || THREE;          // HyperFrames wacht dan op de textuur vóór frame 0
    const tex = new THREE.TextureLoader().load("assets/scenes/texturen/" + bestand);
    tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 4;
    const mat = new THREE.ShaderMaterial({
      uniforms: { kaart: { value: tex }, uL: { value: zon.clone().normalize() }, uNacht: { value: nacht ? 1 : 0 }, uHelder: { value: helder } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D kaart; uniform vec3 uL; uniform float uNacht; uniform float uHelder;
        varying vec3 vW; varying vec3 vN; varying vec2 vUv;
        void main(){
          vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
          vec3 t = texture2D(kaart, vUv).rgb;
          float lp = dot(N, uL);
          float dag = smoothstep(-0.08, 0.3, lp);
          vec3 c;
          if (uNacht > 0.5) {
            float l = dot(t, vec3(0.3, 0.55, 0.15));
            vec3 stad = mix(vec3(0.9, 0.86, 0.74), t, 0.35) * smoothstep(0.12, 0.7, l) * 0.9;   // warm wit, niet oranje (QA paars)
            vec3 grond = t * 0.3 + vec3(0.010, 0.018, 0.040);
            c = (grond + stad) * uHelder * (1.0 - dag) * 0.6 + vec3(0.05, 0.12, 0.25) * dag;
          } else {
            c = t * (0.06 + 0.94 * dag) * uHelder;
          }
          float mu = clamp(dot(N, V), 0.0, 1.0);
          c *= mix(0.55, 1.0, smoothstep(0.0, 0.5, mu));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    return new THREE.Mesh(new THREE.SphereGeometry(straal, 192, 128), mat);
  }
  // Breedte/lengte → punt op de bol, met de UV-afbeelding van SphereGeometry (zoals scenes/aarde.js).
  const RAD = Math.PI / 180;
  const breedteLengte = (lat, lon, r = 1) => { const phi = (lon + 180) * RAD, c = Math.cos(lat * RAD); return new THREE.Vector3(-Math.cos(phi) * c * r, Math.sin(lat * RAD) * r, Math.sin(phi) * c * r); };
  // logCam: houdingen {t, doel:[x,y,z], richting:[x,y,z] (van doel naar camera), afstand, fov, op?:[x,y,z], e?}
  // De afstand loopt logaritmisch (powers of ten), richting en doel lopen glad mee.
  function logCam(keys) {
    // Standaard "maat": de camera staat (bijna) stil rond elke sleutel en beweegt in het midden van het stuk ertussen.
    // Zo loopt het beeld door op elke zinsgrens (render:qa: doorloop ≥ 0,5, 8 frames voor en na) en blijft de beweging
    // ertussen vloeiend. Het doel schuift mee met de afstand (ver weg schuift het, dichtbij staat het): een vaste
    // schermsnelheid in plaats van een vlucht door de leegte.
    const ss = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
    const ease = { sine: (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x))), lin: (x) => Math.max(0, Math.min(1, x)),
                   in: (x) => Math.pow(Math.max(0, Math.min(1, x)), 2.2), out: (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 2.2) };
    const a = new THREE.Vector3(), b = new THREE.Vector3(), d1 = new THREE.Vector3(), d2 = new THREE.Vector3(), u1 = new THREE.Vector3(), u2 = new THREE.Vector3();
    const v = (x, t) => (typeof x === "function" ? x(t) : x);
    return (cam, t) => {
      let i = 0; while (i < keys.length - 2 && t > keys[i + 1].t) i++;
      const A = keys[i], B = keys[Math.min(i + 1, keys.length - 1)];
      const D = B.t - A.t, x = t <= A.t ? 0 : D > 0 ? (t - A.t) / D : 1;
      const hA = D > 0 ? Math.min(A.vast ?? 0.32, 0.3 * D) / D : 0, hB = D > 0 ? Math.min(B.vast ?? 0.32, 0.3 * D) / D : 0;
      const k = B.e ? ease[B.e](x) : ss((x - hA) / Math.max(1e-6, 1 - hA - hB));
      const dA = v(A.afstand, t), dB = v(B.afstand, t);
      const afst = Math.exp(Math.log(dA) + (Math.log(dB) - Math.log(dA)) * (B.el ? ease[B.el](k) : k));
      const kd = Math.abs(Math.log(dB / dA)) > 0.3 ? (afst - dA) / (dB - dA) : k;
      a.fromArray(v(A.doel, t)); b.fromArray(v(B.doel, t)); const doel = a.lerp(b, kd);
      d1.fromArray(v(A.richting, t)).normalize(); d2.fromArray(v(B.richting, t)).normalize(); const dir = d1.lerp(d2, k).normalize();
      cam.position.copy(doel).addScaledVector(dir, afst);
      u1.fromArray(A.op || [0, 1, 0]); u2.fromArray(B.op || A.op || [0, 1, 0]); cam.up.copy(u1.lerp(u2, k).normalize());
      cam.fov = (A.fov ?? 40) + ((B.fov ?? A.fov ?? 40) - (A.fov ?? 40)) * k;
      const kijk = A.kijk || B.kijk ? new THREE.Vector3().fromArray(v(A.kijk || A.doel, t)).lerp(new THREE.Vector3().fromArray(v(B.kijk || B.doel, t)), k) : doel;
      cam.lookAt(kijk);
      // Het onderwerp iets boven het midden (y ≈ 780): vrij van de ondertitels (y 1130) en van de haak bovenin.
      if (cam.setViewOffset) cam.setViewOffset(1080, 1920, 0, keys.hoog ?? 0, 1080, 1920);
      cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    };
  }
  // De rustpunten van de camera: midden in de pauze na zin i (de laatste: kort na het eind).
  const rust = (L, n) => (i) => (i + 1 < n ? (L(i, 1) + L(i + 1, 0)) / 2 : L(i, 1) + 0.15);
  // De haakkaart: de hele haak groot bovenin, al in frame 0, tot de eerste zin klaar is (labels haak1/haak2).
  function haakkaart(ov, t, L, data, { y = 360, maat = 66 } = {}) {
    const a = 1 - Math.max(0, Math.min(1, (t - L(0, 1) - 0.15) / 0.35));
    if (a <= 0 || data.labels.haak1 === undefined) return;
    const twee = data.labels.haak2 !== undefined;
    ov.tekst("haak1", 540, y, { maat, kleur: "#EEF2FB", alpha: a, gloei: 8, gewicht: 800 });
    if (twee) ov.tekst("haak2", 540, y + maat * 1.12, { maat, kleur: "#FF6F7D", alpha: a, gloei: 14, gewicht: 800 });
  }
  return { atmosfeer, planeet, textuurBol, breedteLengte, logCam, haakkaart, rust, NZ };
};
