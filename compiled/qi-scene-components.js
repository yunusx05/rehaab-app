/* Lot 16 : QI « Lis ton défenseur » en 3D (route « qi-scene »). Three.js (vendor/three.min.js) n'est chargé que sur cet écran.
   Caméra à hauteur des yeux du porteur ; mannequins générés par le code ; l'image se fige au moment de décider, puis la bonne
   action est rejouée et expliquée. Sans WebGL : vue de dessus en SVG avec les mêmes indices. */
const BS = window.BasketScenes;
let ptThreePromise = null;
function ptLoadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (!ptThreePromise) ptThreePromise = new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'vendor/three.min.js';
    s.async = true;
    s.onload = () => window.THREE ? ok(window.THREE) : ko(new Error('three'));
    s.onerror = () => {
      ptThreePromise = null;
      ko(new Error('three'));
    };
    document.head.appendChild(s);
  });
  return ptThreePromise;
}
function ptWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}
// Rendu stylisé (lot 16 bis) : toon shading à 3 paliers, contour noir par coque inversée, ombres en disque.
// Équipes : toi et ton coéquipier en lime, la défense en bleu. Mètres ; le panier est vers -z, tu es en (−0,25 ; 0 ; 0).
const PT_LIME = 0xc3e65a,
  PT_BLUE = 0x2f6fd6,
  PT_INK = 0x0b0c0b,
  PT_SKIN = [0x8d5a3b, 0x6b4429, 0xb57a52, 0x5a3a24];
const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const easeIO = t => {
  t = Math.min(1, Math.max(0, t));
  return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const lerp = (a, b, t) => a + (b - a) * t;
const RIM_Z = -7,
  BASE_Z = -8.575;
function ptToonKit(THREE) {
  const g = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
  g.minFilter = g.magFilter = THREE.NearestFilter;
  g.needsUpdate = true;
  const cache = {},
    ink = new THREE.MeshBasicMaterial({
      color: PT_INK,
      side: THREE.BackSide
    });
  const mat = c => cache[c] || (cache[c] = new THREE.MeshToonMaterial({
    color: c,
    gradientMap: g
  }));
  // Coque inversée légèrement agrandie : un contour net, lisible même petit à l'écran.
  const mesh = (geo, color, outline = true, k = 1.07) => {
    const m = new THREE.Mesh(geo, mat(color));
    if (outline) {
      const o = new THREE.Mesh(geo, ink);
      o.scale.setScalar(k);
      m.add(o);
    }
    return m;
  };
  return {
    mat,
    mesh,
    ink
  };
}
function ptNumberTexture(THREE, n, fg, bg) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = fg;
  g.font = 'italic 800 92px "Barlow Condensed", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(n), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Joueur articulé. Fait face à +z (rotation.y = π pour regarder le panier).
function ptPlayer(THREE, kit, {
  jersey,
  number,
  skin,
  ink = '#111212'
}) {
  const hex = '#' + jersey.toString(16).padStart(6, '0');
  const root = new THREE.Group(),
    hips = new THREE.Group();
  hips.position.y = 1;
  root.add(hips);
  const dark = new THREE.Color(jersey).multiplyScalar(.72).getHex();
  const shorts = kit.mesh(new THREE.CylinderGeometry(.19, .25, .32, 16), dark);
  shorts.position.y = -.1;
  hips.add(shorts);
  const torso = new THREE.Group();
  hips.add(torso);
  const shirtGeo = new THREE.CylinderGeometry(.235, .175, .5, 16);
  const shirt = kit.mesh(shirtGeo, jersey);
  shirt.scale.z = .66;
  shirt.position.y = .31;
  torso.add(shirt);
  const numTex = ptNumberTexture(THREE, number, ink, hex);
  [1, -1].forEach(s => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), new THREE.MeshBasicMaterial({
      map: numTex
    }));
    p.position.set(0, .34, s * .148);
    if (s < 0) p.rotation.y = Math.PI;
    torso.add(p);
  });
  const neck = kit.mesh(new THREE.CylinderGeometry(.055, .06, .12, 10), skin, false);
  neck.position.y = .62;
  torso.add(neck);
  const head = kit.mesh(new THREE.SphereGeometry(.115, 20, 16), skin);
  head.scale.y = 1.1;
  head.position.y = .77;
  torso.add(head);
  const hair = kit.mesh(new THREE.SphereGeometry(.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.1), 0x161210, false);
  hair.position.y = .79;
  torso.add(hair);
  const limb = (parent, x, y, r1, l1, r2, l2, c1, c2, end) => {
    const j = new THREE.Group();
    j.position.set(x, y, 0);
    parent.add(j);
    const a = kit.mesh(new THREE.CapsuleGeometry(r1, l1, 4, 10), c1);
    a.position.y = -(l1 / 2 + r1);
    j.add(a);
    const k = new THREE.Group();
    k.position.y = -(l1 + r1 * 2);
    j.add(k);
    const b = kit.mesh(new THREE.CapsuleGeometry(r2, l2, 4, 10), c2);
    b.position.y = -(l2 / 2 + r2);
    k.add(b);
    if (end) k.add(end(l2 + r2 * 2));
    return {
      j,
      k
    };
  };
  const shoe = len => {
    const g = new THREE.Group();
    const sock = kit.mesh(new THREE.CylinderGeometry(.062, .062, .12, 10), 0xf2f2ee, false);
    sock.position.y = -len + .1;
    g.add(sock);
    const s = kit.mesh(new THREE.BoxGeometry(.12, .09, .28), 0xf4f4f0);
    s.position.set(0, -len - .005, .05);
    g.add(s);
    return g;
  };
  const hand = len => {
    const h = kit.mesh(new THREE.SphereGeometry(.055, 12, 10), skin);
    h.position.y = -len;
    return h;
  };
  const legs = {},
    arms = {};
  [-1, 1].forEach(s => {
    legs[s] = limb(hips, s * .11, -.06, .075, .28, .062, .3, skin, skin, shoe);
    arms[s] = limb(torso, s * .255, .52, .052, .2, .046, .18, skin, skin, hand);
    const sh = kit.mesh(new THREE.SphereGeometry(.08, 12, 10), skin);
    sh.position.set(s * .235, .53, 0);
    torso.add(sh);
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshBasicMaterial({
    color: 0,
    transparent: true,
    opacity: .32,
    depthWrite: false
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .012;
  const P = {
    root,
    hips,
    torso,
    head,
    legs,
    arms,
    shadow,
    update: () => {},
    pose: o => ptSetPose(P, o)
  };
  return P;
}
// Pose. lead : jambe avancée (-1 = côté x négatif du monde, 1 = positif, 0 = aucune). arms : high | mid | low | dribble | shoot | pass | call | catch.
function ptSetPose(P, {
  crouch = .3,
  lean = .25,
  lead = 0,
  run = 0,
  phase = 0,
  shuffle = 0,
  arms = 'mid',
  armT = 0,
  jump = 0,
  side = 1,
  facing = 1
}) {
  P.hips.position.y = 1 - crouch * .24 + (run ? Math.abs(Math.sin(phase)) * .04 * run : 0);
  P.root.position.y = jump;
  P.torso.rotation.x = lean + run * .2;
  P.head.rotation.x = -lean * .6;
  [-1, 1].forEach(s => {
    const L = P.legs[s],
      w = s * facing;
    let thigh = crouch * .6,
      knee = crouch * 1.05;
    if (lead) {
      if (lead * facing === s) {
        thigh += .72;
        knee -= .05;
      } else {
        thigh -= .45;
        knee += .3;
      }
    }
    if (run) {
      const q = Math.sin(phase + (s > 0 ? Math.PI : 0));
      thigh += q * .85 * run;
      knee += Math.max(0, -q) * 1.2 * run + .2 * run;
    }
    L.j.rotation.x = -thigh;
    L.k.rotation.x = knee;
    L.j.rotation.z = s * (.14 + crouch * .12 + shuffle * (.5 + .5 * Math.sin(phase * 2 + (s > 0 ? Math.PI : 0))) * .22);
  });
  [-1, 1].forEach(s => {
    const A = P.arms[s];
    let x = -.25,
      z = s * .32,
      e = -.25;
    if (arms === 'high') {
      x = -2.85;
      z = s * .18;
      e = -.1;
    } else if (arms === 'mid') {
      x = -.85;
      z = s * .6;
      e = -.95 + Math.sin(phase * 1.5 + s) * .12;
    } else if (arms === 'dribble') {
      if (s === side) {
        x = -.55 + Math.sin(armT) * .28;
        z = s * .28;
        e = -.95;
      } else {
        x = -1.05;
        z = s * .18;
        e = -1.25;
      }
    } else if (arms === 'shoot') {
      x = -2.55 - armT * .35;
      z = s * .05;
      e = -1.5 + armT * 1.4;
    } else if (arms === 'pass') {
      x = -1.35;
      z = s * .15 + side * .55;
      e = -.15;
    } else if (arms === 'call') {
      if (s === side) {
        x = -2.9;
        z = s * .15;
        e = -.1;
      } else {
        x = -.3;
        z = s * .3;
        e = -.3;
      }
    } else if (arms === 'catch') {
      x = -1.35;
      z = s * .2;
      e = -.6;
    }
    if (run && arms !== 'dribble') {
      x = -.25 - Math.sin(phase + (s > 0 ? 0 : Math.PI)) * .75 * run;
      e = -1.25;
    }
    A.j.rotation.x = x;
    A.j.rotation.z = z;
    A.k.rotation.x = e;
  });
}
// Parquet et lignes complètes sur une texture (18 × 20 m, de z = −15 à z = 5).
function ptCourtTexture(THREE) {
  const W = 1024,
    H = 1138,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const X = x => (x + 9) / 18 * W,
    Z = z => (z + 15) / 20 * H,
    M = W / 18;
  for (let i = 0; i < W; i += 22) {
    const t = Math.sin(i * 12.9898) * 43758.5453 % 1;
    g.fillStyle = `hsl(29,${38 + t * 8}%,${30 + Math.abs(t) * 7}%)`;
    g.fillRect(i, 0, 22, H);
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(i, 0, 1, H);
  }
  for (let y = 0; y < H; y += 180) for (let i = 0; i < W; i += 22) {
    g.fillStyle = 'rgba(0,0,0,.14)';
    g.fillRect(i, (y + i * 7) % H, 22, 1);
  }
  g.fillStyle = 'rgba(195,230,90,.22)';
  g.fillRect(X(-2.45), Z(BASE_Z), 4.9 * M, 5.8 * M);
  g.strokeStyle = '#f3ead6';
  g.lineWidth = 6;
  const line = (x1, z1, x2, z2) => {
    g.beginPath();
    g.moveTo(X(x1), Z(z1));
    g.lineTo(X(x2), Z(z2));
    g.stroke();
  };
  line(-7.5, BASE_Z, 7.5, BASE_Z);
  line(-7.5, BASE_Z, -7.5, 5);
  line(7.5, BASE_Z, 7.5, 5);
  g.strokeRect(X(-2.45), Z(BASE_Z), 4.9 * M, 5.8 * M);
  const ft = BASE_Z + 5.8;
  g.beginPath();
  g.arc(X(0), Z(ft), 1.8 * M, 0, Math.PI);
  g.stroke();
  g.setLineDash([18, 14]);
  g.beginPath();
  g.arc(X(0), Z(ft), 1.8 * M, Math.PI, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.beginPath();
  g.arc(X(0), Z(RIM_Z), 1.25 * M, 0, Math.PI);
  g.stroke();
  const a = Math.asin(6.6 / 6.75),
    cz = RIM_Z + Math.cos(a) * 6.75;
  line(-6.6, BASE_Z, -6.6, cz);
  line(6.6, BASE_Z, 6.6, cz);
  g.beginPath();
  g.arc(X(0), Z(RIM_Z), 6.75 * M, Math.PI / 2 - a, Math.PI / 2 + a);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function ptGym(THREE, kit, S) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 20), new THREE.MeshLambertMaterial({
    map: ptCourtTexture(THREE)
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -5);
  S.add(floor);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({
    color: 0x1d1814
  }));
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(0, -.01, -5);
  S.add(apron);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshBasicMaterial({
    color: 0x15181c
  }));
  wall.position.set(0, 6, -12.5);
  S.add(wall);
  const band = new THREE.Mesh(new THREE.PlaneGeometry(40, .5), new THREE.MeshBasicMaterial({
    color: PT_LIME
  }));
  band.position.set(0, 2.2, -12.45);
  S.add(band);
  // Tribunes en gradins sur les côtés et au fond.
  [-1, 1].forEach(s => {
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(1, .45, 20), new THREE.MeshLambertMaterial({
        color: i % 2 ? 0x23272d : 0x1c1f24
      }));
      b.position.set(s * (9.6 + i), .22 + i * .45, -5);
      S.add(b);
    }
  });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(24, .45, 1), new THREE.MeshLambertMaterial({
      color: i % 2 ? 0x23272d : 0x1c1f24
    }));
    b.position.set(0, .22 + i * .45, -10.6 - i);
    S.add(b);
  }
  for (let i = -2; i <= 2; i++) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(2.2, .08, .5), new THREE.MeshBasicMaterial({
      color: 0xfff6dc
    }));
    l.position.set(i * 4, 9, -5);
    S.add(l);
  }
  // Panier : poteau rembourré, bras, panneau en verre cerclé de blanc, cercle orange et filet.
  const stan = kit.mesh(new THREE.BoxGeometry(.7, 1.6, .9), 0x2a2f36);
  stan.position.set(0, .8, BASE_Z - 1.2);
  S.add(stan);
  const pole = kit.mesh(new THREE.BoxGeometry(.2, 2.6, .2), 0x3a4048);
  pole.position.set(0, 2.6, BASE_Z - 1.1);
  S.add(pole);
  const arm = kit.mesh(new THREE.BoxGeometry(.16, .16, 1.25), 0x3a4048);
  arm.position.set(0, 3.7, BASE_Z - .55);
  S.add(arm);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, .04), new THREE.MeshBasicMaterial({
    color: 0xbfe3ff,
    transparent: true,
    opacity: .22
  }));
  glass.position.set(0, 3.4, BASE_Z + .05);
  S.add(glass);
  const white = new THREE.MeshBasicMaterial({
      color: 0xf4f4f0
    }),
    edge = (w, h, x, y) => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(w, h, .05), white);
      e.position.set(x, y, BASE_Z + .07);
      S.add(e);
    };
  edge(1.8, .05, 0, 3.9);
  edge(1.8, .05, 0, 2.9);
  edge(.05, 1.05, -.9, 3.4);
  edge(.05, 1.05, .9, 3.4);
  edge(.59, .04, 0, 3.47);
  edge(.59, .04, 0, 3.05);
  edge(.04, .45, -.29, 3.26);
  edge(.04, .45, .29, 3.26);
  const rim = kit.mesh(new THREE.TorusGeometry(.23, .02, 8, 32), 0xe5652a, false);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 3.05, RIM_Z);
  S.add(rim);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(.23, .14, .42, 12, 4, true), new THREE.MeshBasicMaterial({
    color: 0xf2f2ee,
    wireframe: true,
    transparent: true,
    opacity: .85
  }));
  net.position.set(0, 2.83, RIM_Z);
  S.add(net);
  return {
    net
  };
}

// Joueur réaliste (Quaternius, CC0) : modèle chargé une fois, cloné par joueur ; maillot et short découpés dans le corps
// selon les os, teintés aux couleurs de l'équipe ; animations Quaternius + gestes basket orientés os par os.
let ptModelPromise = null;
function ptLoadModel(THREE) {
  if (!ptModelPromise) ptModelPromise = new Promise((ok, ko) => {
    const l = new THREE.GLTFLoader();
    l.setMeshoptDecoder(THREE.MeshoptDecoder);
    l.load('media/3d/player.glb', ok, undefined, ko);
  }).catch(e => {
    ptModelPromise = null;
    throw e;
  });
  return ptModelPromise;
}
const PT_JERSEY_BONES = new Set(['spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r']);
function ptOutfit(THREE, body, jersey, shorts) {
  const g = body.geometry,
    pos = g.attributes.position,
    nor = g.attributes.normal,
    si = g.attributes.skinIndex,
    sw = g.attributes.skinWeight,
    idx = g.index;
  const names = body.skeleton.bones.map(b => b.name),
    dom = new Int16Array(pos.count);
  for (let v = 0; v < pos.count; v++) {
    let best = 0,
      bw = -1;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(v, k);
      if (w > bw) {
        bw = w;
        best = si.getComponent(v, k);
      }
    }
    dom[v] = best;
  }
  // Bas du short : un quart de la cuisse au-dessus du genou.
  let tMin = Infinity,
    tMax = -Infinity;
  for (let v = 0; v < pos.count; v++) {
    if (/^thigh_/.test(names[dom[v]])) {
      const y = pos.getY(v);
      tMin = Math.min(tMin, y);
      tMax = Math.max(tMax, y);
    }
  }
  const cut = tMin + (tMax - tMin) * .22;
  const inJersey = v => PT_JERSEY_BONES.has(names[dom[v]]),
    inShorts = v => {
      const n = names[dom[v]];
      return n === 'pelvis' || /^thigh_/.test(n) && pos.getY(v) > cut;
    };
  body.updateWorldMatrix(true, false);
  const scale = new THREE.Vector3().setFromMatrixScale(body.matrixWorld).y || 1;
  const make = (test, color, off) => {
    const tri = [];
    const n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i += 3) {
      const a = idx ? idx.getX(i) : i,
        b = idx ? idx.getX(i + 1) : i + 1,
        c = idx ? idx.getX(i + 2) : i + 2;
      if (test(a) && test(b) && test(c)) tri.push(a, b, c);
    }
    const p = new Float32Array(pos.count * 3),
      o = off / scale;
    for (let v = 0; v < pos.count; v++) {
      p[v * 3] = pos.getX(v) + nor.getX(v) * o;
      p[v * 3 + 1] = pos.getY(v) + nor.getY(v) * o;
      p[v * 3 + 2] = pos.getZ(v) + nor.getZ(v) * o;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geo.setAttribute('normal', nor);
    geo.setAttribute('skinIndex', si);
    geo.setAttribute('skinWeight', sw);
    geo.setIndex(tri);
    const m = new THREE.SkinnedMesh(geo, new THREE.MeshStandardMaterial({
      color,
      roughness: .85
    }));
    m.bind(body.skeleton, body.bindMatrix);
    m.frustumCulled = false;
    body.parent.add(m);
    return m;
  };
  return {
    jersey: make(inJersey, jersey, .012),
    shorts: make(inShorts, shorts, .016)
  };
}
function ptRealPlayer(THREE, gltf, {
  jersey,
  number,
  ink = '#111212'
}) {
  const root = new THREE.Group(),
    model = THREE.cloneSkinned(gltf.scene);
  root.add(model);
  // Taille de joueur : 1,93 m.
  const box = new THREE.Box3().setFromObject(model),
    h = box.max.y - box.min.y || 1;
  model.scale.multiplyScalar(1.93 / h);
  model.position.y -= box.min.y * 1.93 / h;
  let body = null;
  model.traverse(o => {
    if (o.isSkinnedMesh) {
      o.frustumCulled = false;
      if (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count) body = o;
    }
  });
  model.updateMatrixWorld(true);
  const dark = new THREE.Color(jersey).multiplyScalar(.7).getHex();
  ptOutfit(THREE, body, jersey, dark);
  const bone = n => model.getObjectByName(n);
  // Numéro devant et derrière, collé au haut du dos.
  const hex = '#' + jersey.toString(16).padStart(6, '0'),
    tex = ptNumberTexture(THREE, number, ink, hex),
    spine = bone('spine_03');
  [1, -1].forEach(s => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true
    }));
    p.position.set(0, 1.4, s * .16);
    if (s < 0) p.rotation.y = Math.PI;
    root.add(p);
    root.updateMatrixWorld(true);
    spine && spine.attach(p);
  });
  const mixer = new THREE.AnimationMixer(model),
    acts = {};
  gltf.animations.forEach(c => {
    acts[c.name] = mixer.clipAction(c);
  });
  let curKey = null;
  const play = (key, ts = 1) => {
    if (key === curKey) {
      Object.values(acts).forEach(a => {
        if (a.isRunning()) a.timeScale = ts;
      });
      return;
    }
    curKey = key;
    const want = key === 'stance' ? {
      Idle_Loop: .45,
      Crouch_Idle_Loop: .55
    } : {
      [key]: 1
    };
    Object.entries(acts).forEach(([n, a]) => {
      if (want[n]) {
        if (!a.isRunning()) a.reset().play();
        a.setEffectiveWeight(want[n]);
        a.timeScale = ts;
        a.fadeIn(.18);
      } else if (a.isRunning()) a.fadeOut(.18);
    });
  };
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshBasicMaterial({
    color: 0,
    transparent: true,
    opacity: .32,
    depthWrite: false
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .012;
  const V = THREE.Vector3,
    Q = THREE.Quaternion,
    pa = new V(),
    pb = new V(),
    dq = new Q(),
    wq = new Q(),
    pq = new Q();
  // Oriente un os pour que le segment os → enfant pointe dans une direction du monde (indépendant des axes du squelette).
  const aim = (bn, ch, dir) => {
    const b = bone(bn),
      c = bone(ch);
    if (!b || !c) return;
    b.parent.updateMatrixWorld(true);
    b.updateMatrixWorld(true);
    pa.setFromMatrixPosition(b.matrixWorld);
    pb.setFromMatrixPosition(c.matrixWorld).sub(pa).normalize();
    dq.setFromUnitVectors(pb, dir.clone().normalize());
    b.getWorldQuaternion(wq);
    wq.premultiply(dq);
    b.parent.getWorldQuaternion(pq);
    b.quaternion.copy(pq.invert().multiply(wq));
    b.updateMatrixWorld(true);
  };
  const api = {
    root,
    shadow,
    mixer,
    update: dt => mixer.update(dt),
    pose({
      crouch = .3,
      lead = 0,
      run = 0,
      shuffle = 0,
      arms = 'mid',
      armT = 0,
      jump = 0,
      side = 1,
      facing = 1
    }) {
      root.position.y = jump;
      play(jump > .05 ? 'Jump_Loop' : run > .75 ? 'Sprint_Loop' : run > .3 ? 'Jog_Fwd_Loop' : crouch >= .28 || shuffle ? 'stance' : 'Idle_Loop', run > .3 ? Math.max(.8, run * 1.2) : 1);
      mixer.update(0);
      root.updateMatrixWorld(true);
      const f = facing,
        ry = root.rotation.y;
      const W = (x, y, z) => new V(x, y, z).applyAxisAngle(new V(0, 1, 0), ry - (facing < 0 ? Math.PI : 0));
      // Côté du monde (x) → os gauche/droit selon le sens où regarde le joueur.
      const sideBone = s => s * f > 0 ? '_l' : '_r';
      if (lead && !run && !jump) {
        const L = sideBone(lead),
          B = sideBone(-lead);
        aim('thigh' + L, 'calf' + L, W(lead * .3, -1, f * .4));
        aim('calf' + L, 'foot' + L, W(0, -1, f * .04));
        aim('thigh' + B, 'calf' + B, W(-lead * .22, -1, -f * .22));
        aim('calf' + B, 'foot' + B, W(0, -1, -f * .3));
      }
      const arm = (s, up, low) => {
        const S = sideBone(s);
        aim('upperarm' + S, 'lowerarm' + S, W(...up));
        aim('lowerarm' + S, 'hand' + S, W(...low));
      };
      if (arms === 'high') {
        arm(-1, [-.15, 1, f * .18], [-.05, 1, f * .05]);
        arm(1, [.15, 1, f * .18], [.05, 1, f * .05]);
      } else if (arms === 'mid' && !run) {
        arm(-1, [-.75, -.35, f * .55], [-.25, .3, f * 1]);
        arm(1, [.75, -.35, f * .55], [.25, .3, f * 1]);
      } else if (arms === 'dribble') {
        const hs = -side;
        arm(hs, [hs * .3, -.85, f * .45], [hs * .05, -.75 + Math.sin(armT) * .25, f * .7]);
        if (!run) arm(-hs, [-hs * .55, -.45, f * .55], [0, .35, f * 1]);
      } else if (arms === 'shoot') {
        arm(-1, [-.12, 1, f * (.5 - armT * .25)], [0, 1, f * (.25 - armT * .15)]);
        arm(1, [.12, 1, f * (.5 - armT * .25)], [0, 1, f * (.2 - armT * .15)]);
      } else if (arms === 'pass') {
        arm(-1, [side * .6 - .1, .1, f * .9], [side * .7, 0, f * .7]);
        arm(1, [side * .6 + .1, .1, f * .9], [side * .7, 0, f * .7]);
      } else if (arms === 'call') {
        arm(side, [side * .2, 1, f * .1], [0, 1, 0]);
      } else if (arms === 'catch') {
        arm(-1, [-.3, .1, f * 1], [-.1, .3, f * 1]);
        arm(1, [.3, .1, f * 1], [.1, .3, f * 1]);
      }
    },
    hand: (s = 1, f = 1) => {
      const b = bone('hand' + (s * f > 0 ? '_l' : '_r'));
      return b ? new V().setFromMatrixPosition(b.matrixWorld) : null;
    }
  };
  return api;
}
function PTScene3D({
  scene,
  phase,
  choice,
  onDecide,
  reduced,
  onStep,
  replayKey = 0
}) {
  const host = usePTRef(null),
    api = usePTRef(null);
  const [failed, setFailed] = usePTState(() => !ptWebGL());
  // Repli 2D : pas d'animation, la décision est ouverte tout de suite.
  usePTEffect(() => {
    if (failed && phase === 'intro' && onDecide) onDecide();
  }, [failed, scene.id]);
  usePTEffect(() => {
    if (failed) return;
    let disposed = false,
      frame = 0,
      renderer = null,
      resize = null;
    ptLoadThree().then(THREE => ptLoadModel(THREE).then(g => [THREE, g], e => {
      console.warn('[Rehaab] modèle 3D indisponible', e && e.message);
      return [THREE, null];
    })).then(([THREE, gltf]) => {
      if (disposed || !host.current) return;
      // Rendu utilisé, visible pour le diagnostic : real = joueurs Quaternius, fallback = joueurs stylisés.
      el.dataset.model = gltf ? 'real' : 'fallback';
      const mk = o => gltf ? ptRealPlayer(THREE, gltf, o) : ptPlayer(THREE, kit, {
        ...o,
        skin: PT_SKIN[(o.number + scene.id.length) % PT_SKIN.length]
      });
      const el = host.current,
        w = el.clientWidth || 360,
        h = Math.round(Math.min(w * .82, window.innerHeight * .6));
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'low-power'
      });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      const S = new THREE.Scene();
      S.background = new THREE.Color(0x101215);
      S.fog = new THREE.Fog(0x101215, 12, 26);
      const kit = ptToonKit(THREE);
      S.add(new THREE.HemisphereLight(0xfff4de, 0x2a2018, 1.35));
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(-3, 9, 5);
      S.add(sun);
      const gym = ptGym(THREE, kit, S);
      // Vue par-dessus ton épaule droite, légèrement en hauteur : ton défenseur est visible des pieds aux mains.
      const cam = new THREE.PerspectiveCamera(50, w / h, .1, 80);
      const camBase = new THREE.Vector3(1.95, 2.6, 3.5),
        look = new THREE.Vector3(-.35, .85, -2.2);
      cam.position.copy(camBase);
      cam.lookAt(look);
      const d = scene.defender,
        skin = i => PT_SKIN[(scene.id.length + i) % PT_SKIN.length];
      const add = o => {
        S.add(o.root);
        S.add(o.shadow);
        return o;
      };
      const me = add(mk({
        jersey: PT_LIME,
        number: 1,
        skin: skin(0)
      }));
      me.root.rotation.y = Math.PI;
      me.root.position.set(-.25, 0, 0);
      const def = add(mk({
        jersey: PT_BLUE,
        number: 7,
        skin: skin(1),
        ink: '#ffffff'
      }));
      const shade = d.shade ? BS.dir(d.shade) * .45 : 0;
      const start = d.move === 'closeout-fast' ? {
        z: -4.8,
        x: shade * .4
      } : d.move === 'closeout-late' ? {
        z: -6.4,
        x: 0
      } : d.move === 'retreat' ? {
        z: -1.35,
        x: 0
      } : {
        z: -d.distance - .35,
        x: shade
      };
      const end = {
        z: -d.distance,
        x: shade
      };
      def.root.position.set(start.x - .25, 0, start.z);
      let help = null,
        mate = null;
      if (scene.teammate) {
        const s = BS.dir(scene.teammate);
        mate = add(mk({
          jersey: PT_LIME,
          number: 3,
          skin: skin(2)
        }));
        mate.root.position.set(s * 6.1, 0, -5.9);
        mate.root.rotation.y = Math.PI + s * .9;
        help = add(mk({
          jersey: PT_BLUE,
          number: 12,
          skin: skin(3),
          ink: '#ffffff'
        }));
        const hs = BS.dir(scene.help || scene.teammate);
        help.root.position.set(hs * 4.9, 0, -5.4);
        help.root.rotation.y = -hs * .5;
      }
      const ballTex = (() => {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 64;
        const g = c.getContext('2d');
        g.fillStyle = '#d8642a';
        g.fillRect(0, 0, 128, 64);
        g.strokeStyle = '#2a140a';
        g.lineWidth = 3;
        [16, 48, 80, 112].forEach(x => {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, 64);
          g.stroke();
        });
        g.beginPath();
        g.moveTo(0, 32);
        g.lineTo(128, 32);
        g.stroke();
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.12, 24, 16), new THREE.MeshToonMaterial({
        map: ballTex,
        gradientMap: kit.mat(0xffffff).gradientMap
      }));
      S.add(ball);
      const marker = new THREE.Mesh(new THREE.RingGeometry(.3, .4, 40), new THREE.MeshBasicMaterial({
        color: PT_LIME,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = .02;
      S.add(marker);
      const syncShadows = () => [me, def, help, mate].filter(Boolean).forEach(p => {
        p.shadow.position.x = p.root.position.x;
        p.shadow.position.z = p.root.position.z;
        p.shadow.material.opacity = .32 - p.root.position.y * .3;
      });
      // Ballon dans la main de dribble (droite du porteur) : de la main au parquet.
      const handBall = (t, x = me.root.position.x + .32, z = me.root.position.z - .28, hi = .95) => {
        const b = Math.abs(Math.sin(t));
        ball.position.set(x, .13 + b * (hi - .13), z);
        ball.rotation.x += .12;
        return t;
      };
      const INTRO = reduced ? 0 : 2600;
      let mode = 'intro',
        replay = null,
        sim = 0,
        last = performance.now(),
        freezeAt = 0,
        step = -1;
      // Trace au sol du bon chemin, révélée pendant le rejeu.
      const dots = Array.from({
        length: 16
      }, () => {
        const m = new THREE.Mesh(new THREE.CircleGeometry(.07, 16), new THREE.MeshBasicMaterial({
          color: PT_LIME,
          transparent: true,
          opacity: 0,
          depthWrite: false
        }));
        m.rotation.x = -Math.PI / 2;
        m.position.y = .025;
        S.add(m);
        return m;
      });
      const setStep = n => {
        if (n !== step) {
          step = n;
          onStep && onStep(n);
        }
      };
      const intro = (k, now) => {
        const time = now / 1000,
          m = ease(k);
        // Toi : dribble sur place, posture basse.
        me.pose({
          crouch: .2,
          lean: .3,
          arms: 'dribble',
          armT: time * 9.4,
          phase: time * 4,
          side: -1,
          facing: -1
        });
        handBall(time * 4.7);
        // Défenseur : arrivée selon le scénario, puis posture et pied avancé.
        const moving = d.move === 'closeout-fast' || d.move === 'closeout-late';
        def.root.position.z = lerp(start.z, end.z, moving ? easeIO(k) : m);
        def.root.position.x = lerp(start.x, end.x, m) - .25 + (shade ? 0 : 0);
        const run = moving ? Math.max(0, 1 - k * 1.25) : 0,
          chop = moving && k > .72 && k < .95 ? 1 : 0;
        def.pose({
          crouch: moving && k < .8 ? .12 : d.move === 'retreat' ? .12 : .42,
          lean: moving && k < .8 ? .15 : .32,
          lead: k > .85 ? d.foot === 'square' ? 0 : BS.dir(d.foot) : 0,
          run: run + (d.move === 'retreat' ? .5 : 0) + chop * .45,
          phase: time * (chop ? 22 : 13),
          shuffle: moving || d.move === 'retreat' ? 0 : .6,
          arms: d.move === 'closeout-fast' && k < .95 ? 'high' : d.hands,
          armT: 0
        });
        if (d.move === 'retreat') def.root.position.z = lerp(start.z, end.z, m);
        if (help && scene.help) {
          const s = BS.dir(scene.help),
            tx = s * (scene.template === 'help-high' ? 3.7 : 1.6),
            tz = scene.template === 'help-high' ? -4.6 : -3.3;
          help.root.position.x = lerp(s * 4.9, tx, m);
          help.root.position.z = lerp(-5.4, tz, m);
          help.root.rotation.y = lerp(-s * .5, -s * .25, m);
          help.pose({
            crouch: .3,
            lean: .2,
            run: k < .9 ? .8 : 0,
            phase: time * 13,
            arms: k > .85 ? 'mid' : 'low'
          });
        } else if (help) help.pose({
          crouch: .32,
          lean: .2,
          shuffle: .3,
          phase: time * 3,
          arms: 'mid'
        });
        if (mate) mate.pose({
          crouch: .28,
          lean: .15,
          arms: scene.level >= 3 && k > .6 ? 'call' : 'low',
          side: BS.dir(scene.teammate) * -1,
          phase: time * 3
        });
        cam.position.set(camBase.x, camBase.y, lerp(camBase.z + .5, camBase.z, m));
        cam.lookAt(look);
      };
      api.current = {
        replay: action => {
          replay = {
            action,
            t0: sim
          };
          mode = 'replay';
          setStep(0);
          // Rejeu depuis la position figée : chacun revient à sa place.
          me.root.position.set(-.25, 0, 0);
          def.root.position.set(end.x - .25, 0, end.z);
          def.root.rotation.y = 0;
          def.root.position.y = 0;
          const A = BS.ACTIONS[action] || {
              side: 0
            },
            sd = A.side || (d.foot && d.foot !== 'square' ? BS.dir(d.foot) : 1);
          const path = action === 'shoot' ? null : action.startsWith('pass') ? (() => {
            const tx = mate ? mate.root.position.x : BS.dir(scene.teammate || 'right') * 6,
              tz = mate ? mate.root.position.z : -6;
            return k => [lerp(-.25, tx, k), lerp(-.3, tz, k)];
          })() : (() => {
            const lane = action === 'finish' || action === 'hesi-go' ? -.1 : sd * 1.35;
            return k => [lerp(-.25, lane, Math.min(1, k * 1.5)), lerp(0, -5.2, k)];
          })();
          dots.forEach((m, i) => {
            if (!path) {
              m.material.opacity = 0;
              return;
            }
            const [x, z] = path((i + 1) / dots.length);
            m.position.x = x;
            m.position.z = z;
            m.material.opacity = 0;
            m.userData.k = (i + 1) / dots.length;
          });
          const s = d.foot && d.foot !== 'square' ? BS.dir(d.foot) : 0;
          if (scene.help && help) marker.position.set(help.root.position.x, .02, help.root.position.z);else if (s) marker.position.set(def.root.position.x + s * .14, .02, def.root.position.z + .3);else marker.position.set(def.root.position.x, .02, def.root.position.z);
          marker.material.opacity = .95;
        }
      };
      const loop = now => {
        if (disposed) return;
        frame = requestAnimationFrame(loop);
        if (document.hidden) return;
        const dt = Math.min(50, now - last);
        last = now;
        const players = [me, def, help, mate].filter(Boolean);
        if (mode === 'intro') {
          const lin = INTRO ? sim / INTRO : 1,
            sp = lin > .68 ? .42 : 1;
          sim += dt * sp;
          players.forEach(p => p.update(dt * sp / 1000));
          // Les 30 derniers % de l'intro au ralenti : c'est là que le défenseur montre l'indice.
          const k = lin < .68 ? lin / .68 * .82 : .82 + Math.min(1, (lin - .68) / .32) * .18;
          intro(Math.min(1, k), sim);
          if (lin >= 1) {
            mode = 'freeze';
            freezeAt = now;
            onDecide && onDecide();
          }
        } else if (mode === 'freeze') {
          const p = easeIO(Math.min(1, (now - freezeAt) / 900));
          cam.position.set(lerp(camBase.x, camBase.x - .35, p), lerp(camBase.y, camBase.y - .25, p), lerp(camBase.z, camBase.z - .9, p));
          cam.lookAt(look);
        } else if (mode === 'replay' && replay) {
          sim += dt * .7;
          players.forEach(p => p.update(dt * .7 / 1000));
          const T = reduced ? 1 : Math.min(1, (sim - replay.t0) / 2400),
            a = replay.action,
            A = BS.ACTIONS[a] || {
              side: 0
            },
            time = sim / 1000;
          setStep(T < .3 ? 0 : T < .72 ? 1 : 2);
          dots.forEach(m => {
            m.material.opacity = m.userData.k !== undefined && T > .15 ? Math.min(.9, Math.max(0, (T - .15) * 1.6 - m.userData.k * .9) * 3) : 0;
          });
          const side = A.side || (d.foot && d.foot !== 'square' ? BS.dir(d.foot) : 1);
          if (a === 'shoot') {
            const up = Math.sin(Math.min(1, T / .45) * Math.PI);
            me.pose({
              crouch: .15,
              lean: .05,
              arms: 'shoot',
              armT: Math.min(1, T / .35),
              jump: T < .45 ? up * .45 : 0,
              facing: -1
            });
            const k = Math.max(0, (T - .28) / .62),
              bx = me.root.position.x,
              bz = me.root.position.z - .15;
            if (T < .28) ball.position.set(bx, 2.15 + (T < .45 ? up * .45 : 0), bz);else ball.position.set(lerp(bx, 0, k), lerp(2.6, 3.08, k) + Math.sin(Math.min(1, k) * Math.PI) * 1.9 - (k > 1 ? 0 : 0), lerp(bz, RIM_Z, Math.min(1, k)));
            if (k >= 1) {
              ball.position.y = Math.max(2.4, 3.05 - (T - .9) * 6);
              gym.net.scale.y = 1 + Math.sin((T - .9) * 40) * .08;
            }
            def.pose({
              crouch: .2,
              lean: .1,
              arms: 'high',
              jump: d.distance < 1.6 ? Math.max(0, Math.sin(Math.min(1, T / .5) * Math.PI)) * .3 : 0
            });
          } else if (a.startsWith('pass')) {
            const tx = BS.dir(scene.teammate || 'right');
            me.pose({
              crouch: .3,
              lean: .2,
              arms: T < .3 ? 'pass' : 'low',
              side: -tx,
              facing: -1
            });
            const k = Math.min(1, Math.max(0, (T - .12) / .45));
            ball.position.set(lerp(me.root.position.x, mate ? mate.root.position.x : tx * 6, k), 1.3 + Math.sin(k * Math.PI) * .35, lerp(-.3, mate ? mate.root.position.z + .3 : -6, k));
            if (mate) mate.pose({
              crouch: .3,
              lean: .15,
              arms: k > .7 ? 'catch' : 'call',
              side: -tx
            });
            if (help) help.pose({
              crouch: .35,
              lean: .25,
              arms: 'mid',
              run: T > .4 ? .6 : 0,
              phase: time * 12
            });
          } else {
            // Drive, crossover, hesi, feinte : le porteur part, le défenseur pivote en retard, la caméra suit.
            const pre = a === 'hesi-go' ? .32 : a === 'fake-drive' ? .34 : a.startsWith('cross') ? .18 : 0,
              k = Math.max(0, (T - pre) / (1 - pre)),
              m = easeIO(k);
            const lane = a === 'finish' || a === 'hesi-go' ? -.1 : side * 1.35;
            if (T < pre) {
              if (a === 'fake-drive') {
                me.pose({
                  crouch: .22,
                  lean: .05,
                  arms: 'shoot',
                  armT: 0,
                  facing: -1
                });
                ball.position.set(me.root.position.x, 1.85, -.2);
                const j = Math.sin(T / pre * Math.PI);
                def.pose({
                  crouch: .1,
                  lean: 0,
                  arms: 'high',
                  jump: j * .42
                });
              } else if (a === 'hesi-go') {
                me.pose({
                  crouch: .18,
                  lean: .05,
                  arms: 'dribble',
                  armT: time * 5,
                  side: -1,
                  facing: -1
                });
                handBall(time * 2.6, undefined, undefined, 1.15);
                def.pose({
                  crouch: .15,
                  lean: .05,
                  arms: 'low'
                });
              } else {
                const c = T / pre;
                me.pose({
                  crouch: .42,
                  lean: .35,
                  arms: 'dribble',
                  armT: time * 9,
                  side: -1,
                  facing: -1
                });
                ball.position.set(me.root.position.x + lerp(.32, -.32, c), .13 + Math.abs(Math.sin(c * Math.PI)) * .35, -.3);
              }
            } else {
              me.root.position.x = lerp(-.25, lane, Math.min(1, m * 1.5));
              me.root.position.z = lerp(0, -5.2, m);
              const fin = k > .82 ? (k - .82) / .18 : 0;
              me.pose({
                crouch: .25,
                lean: .45,
                run: fin ? 0 : 1,
                phase: time * 14,
                arms: fin ? 'shoot' : 'dribble',
                armT: fin ? fin : time * 14,
                side: a.startsWith('cross') ? 1 : -1,
                jump: Math.sin(fin * Math.PI) * .55,
                facing: -1
              });
              if (fin) ball.position.set(me.root.position.x + lerp(.2, 0, fin), lerp(1.6, 3.15, fin), lerp(me.root.position.z - .3, RIM_Z + .15, fin));else ball.position.set(me.root.position.x + (a.startsWith('cross') ? -.3 : .3), .13 + Math.abs(Math.sin(time * 14)) * .7, me.root.position.z - .35);
              def.root.rotation.y = lerp(0, -side * 1.3, Math.min(1, m * 2));
              def.root.position.x = lerp(end.x - .25, end.x - .25 + side * .3, Math.max(0, Math.min(1, (m - .25) * 1.4)));
              def.pose({
                crouch: .35,
                lean: .25,
                run: .7,
                phase: time * 11,
                arms: 'mid',
                jump: a === 'fake-drive' && k < .1 ? (.1 - k) * 2 : 0
              });
            }
          }
          const c = me.root.position;
          cam.position.set(c.x + 1.5, 2.5, c.z + 3.2);
          cam.lookAt(c.x - .2, 1.0, c.z - 3);
          marker.material.opacity = Math.max(.25, .95 - T * .7);
        }
        syncShadows();
        renderer.render(S, cam);
      };
      frame = requestAnimationFrame(loop);
      resize = new ResizeObserver(() => {
        const W = el.clientWidth;
        if (!W) return;
        const H = Math.round(Math.min(W * .82, window.innerHeight * .6));
        renderer.setSize(W, H);
        cam.aspect = W / H;
        cam.updateProjectionMatrix();
      });
      resize.observe(el);
    }).catch(e => {
      console.warn('[Rehaab] scène 3D indisponible', e && (e.stack || e.message));
      try {
        localStorage.setItem('rh_scene_error', String(e && (e.stack || e.message)).slice(0, 800));
      } catch (x) {}
      if (!disposed) setFailed(true);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (resize) resize.disconnect();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
      api.current = null;
    };
  }, [scene.id]);
  usePTEffect(() => {
    if (phase === 'replay' && api.current) api.current.replay(scene.answer);
  }, [phase, replayKey]);
  if (failed) return /*#__PURE__*/React.createElement(PTScene2D, {
    scene: scene,
    reveal: phase === 'replay'
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "scene-3d",
    ref: host,
    role: "img",
    "aria-label": "Sc\xE8ne en 3D vue par-dessus ton \xE9paule : ton d\xE9fenseur face \xE0 toi."
  });
}

// Repli sans WebGL : vue de dessus, mêmes indices dessinés (pieds, mains, aide).
function PTScene2D({
  scene,
  reveal
}) {
  const d = scene.defender,
    s = d.foot && d.foot !== 'square' ? BS.dir(d.foot) : 0,
    y = 210 - Math.min(3.6, d.distance) * 40,
    x = 160 + (d.shade ? BS.dir(d.shade) * 24 : 0);
  return /*#__PURE__*/React.createElement("svg", {
    className: "scene-2d",
    viewBox: "0 0 320 260",
    role: "img",
    "aria-label": "Vue de dessus de la sc\xE8ne"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "320",
    height: "260",
    fill: "#3a2c1f"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M40 0 A150 150 0 0 0 280 0",
    fill: "none",
    stroke: "#efe6d2",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "110",
    y: "0",
    width: "100",
    height: "90",
    fill: "none",
    stroke: "#efe6d2",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "160",
    cy: "236",
    r: "12",
    fill: "#c3e65a"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "174",
    cy: "226",
    r: "5",
    fill: "#d8642a"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: x,
    cy: y,
    r: "14",
    fill: "#2b3138",
    stroke: "#9aa0a6"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: x - 8,
    cy: y + (s === -1 ? 14 : 4),
    rx: "4",
    ry: "7",
    fill: reveal && s === -1 ? '#c3e65a' : '#9aa0a6'
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: x + 8,
    cy: y + (s === 1 ? 14 : 4),
    rx: "4",
    ry: "7",
    fill: reveal && s === 1 ? '#c3e65a' : '#9aa0a6'
  }), d.hands === 'high' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: x - 12,
    y1: y - 4,
    x2: x - 18,
    y2: y - 22,
    stroke: "#dfe3d6",
    strokeWidth: "3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: x + 12,
    y1: y - 4,
    x2: x + 18,
    y2: y - 22,
    stroke: "#dfe3d6",
    strokeWidth: "3"
  })), d.move !== 'static' && /*#__PURE__*/React.createElement("text", {
    x: x + 20,
    y: y,
    fill: "#dfe3d6",
    fontSize: "11"
  }, d.move === 'retreat' ? 'recule' : 'arrive vite'), scene.teammate && /*#__PURE__*/React.createElement("circle", {
    cx: 160 + BS.dir(scene.teammate) * 130,
    cy: "40",
    r: "10",
    fill: "#d9dccf"
  }), scene.help && /*#__PURE__*/React.createElement("circle", {
    cx: 160 + BS.dir(scene.help) * 60,
    cy: "120",
    r: "12",
    fill: "#3c434b",
    stroke: reveal ? '#c3e65a' : '#9aa0a6'
  }));
}
function PTQiScenes({
  data,
  update,
  go
}) {
  const reduced = usePTMotionPreference ? usePTMotionPreference() : false;
  const [set] = usePTState(() => BS.nextSet(data.qi));
  const [i, setI] = usePTState(0),
    [phase, setPhase] = usePTState('intro'),
    [choice, setChoice] = usePTState(null),
    [results, setResults] = usePTState([]),
    [left, setLeft] = usePTState(3);
  const decidedAt = usePTRef(0),
    [step, setStep] = usePTState(-1),
    [replayKey, setReplayKey] = usePTState(0);
  const scene = set.scenes[i];
  // Niveau 4 : 3 secondes pour décider, sinon la scène compte comme ratée.
  usePTEffect(() => {
    if (phase !== 'decide' || !scene?.timed) return;
    setLeft(3);
    const start = Date.now();
    const id = setInterval(() => {
      const r = 3 - (Date.now() - start) / 1000;
      setLeft(Math.max(0, r));
      if (r <= 0) {
        clearInterval(id);
        answer(null);
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, i]);
  if (!BS || !scene) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    title: "Lis ton d\xE9fenseur."
  }), /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Aucune sc\xE8ne disponible."));
  const answer = c => {
    if (phase !== 'decide') return;
    const r = BS.record(data.qi, scene, c, {
      ms: Date.now() - decidedAt.current
    });
    update(s => ({
      ...s,
      qi: BS.record(s.qi, scene, c, {
        ms: Date.now() - decidedAt.current
      }).qi
    }));
    setChoice(c);
    setResults(x => [...x, r.correct]);
    setPhase('replay');
  };
  const next = () => {
    setStep(-1);
    if (i + 1 < set.scenes.length) {
      setI(i + 1);
      setChoice(null);
      setPhase('intro');
    } else setPhase('done');
  };
  if (phase === 'done') {
    const ok = results.filter(Boolean).length;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
      onBack: () => go('qi'),
      title: "Lis ton d\xE9fenseur."
    }), /*#__PURE__*/React.createElement("div", {
      className: "stack-lg"
    }, /*#__PURE__*/React.createElement("section", {
      className: "card stack-sm"
    }, /*#__PURE__*/React.createElement("h2", null, ok, " bonne", ok > 1 ? 's' : '', " lecture", ok > 1 ? 's' : '', " sur ", results.length, "."), /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, "Niveau ", BS.level(data.qi), " \xB7 ", BS.LEVELS[BS.level(data.qi) - 1].label, ". 8 bonnes lectures sur les 10 derni\xE8res d\xE9bloquent le niveau suivant. Les sc\xE8nes rat\xE9es reviennent d\xE8s demain.")), /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      onClick: () => go('qi')
    }, "Retour au QI")));
  }
  const order = BS.optionOrder(scene),
    correct = choice === scene.answer;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    title: "Lis ton d\xE9fenseur."
  }, `Scène ${i + 1} sur ${set.scenes.length} · niveau ${scene.level} · ${BS.LEVELS[scene.level - 1].hint}${set.replay ? ' · scènes déjà vues aujourd’hui, pour t’entraîner encore' : ''}`), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "scene-stage"
  }, /*#__PURE__*/React.createElement(PTScene3D, {
    key: scene.id,
    scene: scene,
    phase: phase,
    choice: choice,
    reduced: reduced,
    replayKey: replayKey,
    onStep: setStep,
    onDecide: () => {
      decidedAt.current = Date.now();
      setPhase('decide');
    }
  }), phase === 'intro' && /*#__PURE__*/React.createElement("span", {
    className: "scene-status"
  }, "Regarde ton d\xE9fenseur\u2026"), phase === 'decide' && /*#__PURE__*/React.createElement("span", {
    className: "scene-status is-freeze"
  }, scene.timed ? `Décide · ${left.toFixed(1)} s` : 'Image figée : que fais-tu ?'), phase === 'decide' && scene.timed && /*#__PURE__*/React.createElement("span", {
    className: "scene-timer",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      transform: `scaleX(${left / 3})`
    }
  })), phase === 'replay' && step >= 0 && /*#__PURE__*/React.createElement("ol", {
    className: "scene-caption",
    "aria-live": "polite"
  }, [scene.cues.join(' '), `Bonne action : ${BS.actionLabel(scene.answer).toLowerCase()}.`, scene.why.split(/(?<=\.)\s/)[0]].map((c, n) => /*#__PURE__*/React.createElement("li", {
    key: n,
    className: n === step ? 'is-now' : n < step ? 'is-done' : ''
  }, /*#__PURE__*/React.createElement("b", null, n + 1), /*#__PURE__*/React.createElement("span", null, c))))), /*#__PURE__*/React.createElement("div", {
    className: "scene-options",
    role: "group",
    "aria-label": "Ta d\xE9cision"
  }, order.map(o => /*#__PURE__*/React.createElement("button", {
    key: o,
    className: `scene-option${choice === o ? correct ? ' is-right' : ' is-wrong' : ''}${phase === 'replay' && o === scene.answer ? ' is-answer' : ''}`,
    disabled: phase !== 'decide',
    onClick: () => answer(o)
  }, BS.actionLabel(o)))), phase === 'replay' && /*#__PURE__*/React.createElement("section", {
    className: `scene-feedback${correct ? ' is-right' : ' is-wrong'}`,
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("strong", null, correct ? 'Bonne lecture.' : choice ? 'Pas cette fois.' : 'Trop tard.', " ", correct ? '' : `La bonne action : ${BS.actionLabel(scene.answer).toLowerCase()}.`), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, scene.cues.map(c => /*#__PURE__*/React.createElement("li", {
    key: c
  }, c))), /*#__PURE__*/React.createElement("p", null, scene.why), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setReplayKey(k => k + 1)
  }, "Revoir l\u2019action"), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: next
  }, i + 1 < set.scenes.length ? 'Scène suivante' : 'Voir mon bilan', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))))));
}