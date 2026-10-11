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
const PT_LIME = 0xc3e65a,
  PT_DEF = 0x2b3138,
  PT_HELP = 0x3c434b,
  PT_MATE = 0xd9dccf;

// Terrain : parquet, lignes de la raquette et de l'arc à 3 points dessinées sur une texture.
function ptCourtTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#3a2c1f');
  grad.addColorStop(1, '#5a4330');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 1024);
  g.globalAlpha = .08;
  for (let x = 0; x < 1024; x += 32) {
    g.fillStyle = x % 64 ? '#000' : '#fff';
    g.fillRect(x, 0, 2, 1024);
  }
  g.globalAlpha = 1;
  // 1 m = 64 px ; origine (porteur) en bas au centre, panier vers le haut.
  const px = (x, z) => [512 + x * 64, 1000 + z * 64];
  g.strokeStyle = '#efe6d2';
  g.lineWidth = 5;
  const rim = px(0, -7.6);
  g.beginPath();
  g.arc(rim[0], rim[1], 6.75 * 64, Math.PI * .05, Math.PI * .95);
  g.stroke();
  const key = [px(-2.45, -8.8), px(2.45, -3.0)];
  g.strokeRect(key[0][0], key[0][1], key[1][0] - key[0][0], key[1][1] - key[0][1]);
  g.beginPath();
  g.arc(px(0, -3)[0], px(0, -3)[1], 1.8 * 64, 0, Math.PI);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Mannequin articulé : bassin, tronc, tête, bras et jambes en capsules. Les articulations sont des groupes pivot.
function ptMannequin(THREE, color) {
  const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: .7,
      metalness: .05
    }),
    skin = new THREE.MeshStandardMaterial({
      color: 0x8a6a52,
      roughness: .8
    });
  const cap = (r, l, m = mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m);
  const root = new THREE.Group(),
    hips = new THREE.Group();
  hips.position.y = .98;
  root.add(hips);
  const torso = cap(.17, .42);
  torso.position.y = .32;
  hips.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 16), skin);
  head.position.y = .78;
  hips.add(head);
  const limb = (parent, x, y, upper, lower, r, m) => {
    const j = new THREE.Group();
    j.position.set(x, y, 0);
    parent.add(j);
    const a = cap(r, upper, m);
    a.position.y = -upper / 2 - r;
    j.add(a);
    const k = new THREE.Group();
    k.position.y = -upper - r * 2;
    j.add(k);
    const b = cap(r * .9, lower, m === mat ? skin : m);
    b.position.y = -lower / 2 - r;
    k.add(b);
    return {
      j,
      k
    };
  };
  const legL = limb(hips, -.12, 0, .36, .36, .07, mat),
    legR = limb(hips, .12, 0, .36, .36, .07, mat);
  const armL = limb(hips, -.24, .58, .26, .24, .05, skin),
    armR = limb(hips, .24, .58, .26, .24, .05, skin);
  root.userData = {
    hips,
    torso,
    legL,
    legR,
    armL,
    armR,
    mat
  };
  return root;
}
// Pose : pied avancé (côté vu par le porteur), mains, accroupi. Le mannequin fait face au porteur (+z).
function ptPose(m, {
  foot = 'square',
  hands = 'mid',
  crouch = .25,
  run = 0
}) {
  const u = m.userData;
  u.hips.position.y = .98 - crouch * .25;
  // Pied avancé à ta gauche = x négatif dans le monde = jambe « gauche » du mannequin vue de face côté -x.
  const fwd = side => foot === side ? .95 : foot === 'square' ? .15 : -.2;
  u.legL.j.rotation.x = -(crouch * .9) + fwd('left') * .6 + Math.sin(run) * .5;
  u.legL.k.rotation.x = crouch * 1.4;
  u.legR.j.rotation.x = -(crouch * .9) + fwd('right') * .6 - Math.sin(run) * .5;
  u.legR.k.rotation.x = crouch * 1.4;
  u.legL.j.rotation.z = -.18;
  u.legR.j.rotation.z = .18;
  const arm = (a, s) => {
    if (hands === 'high') {
      a.j.rotation.x = -2.7;
      a.j.rotation.z = s * .25;
      a.k.rotation.x = -.1;
    } else if (hands === 'low') {
      a.j.rotation.x = -.25;
      a.j.rotation.z = s * .5;
      a.k.rotation.x = -.3;
    } else {
      a.j.rotation.x = -1.0;
      a.j.rotation.z = s * .7;
      a.k.rotation.x = -.6;
    }
  };
  arm(u.armL, -1);
  arm(u.armR, 1);
  u.torso.rotation.x = crouch * .35;
}
const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const lerp = (a, b, t) => a + (b - a) * t;
function PTScene3D({
  scene,
  phase,
  choice,
  onDecide,
  reduced
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
    ptLoadThree().then(THREE => {
      if (disposed || !host.current) return;
      const el = host.current,
        w = el.clientWidth || 360,
        h = Math.round(Math.min(w * .8, window.innerHeight * .58));
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
      S.background = new THREE.Color(0x111212);
      S.fog = new THREE.Fog(0x111212, 9, 22);
      // Un pas derrière les yeux du porteur : le défenseur est visible des pieds aux mains.
      const cam = new THREE.PerspectiveCamera(58, w / h, .1, 60);
      cam.position.set(0, 1.78, 1.6);
      cam.lookAt(0, .85, -3.2);
      S.add(new THREE.HemisphereLight(0xf2f5e8, 0x2a2118, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(3, 8, 4);
      S.add(sun);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({
        map: ptCourtTexture(THREE),
        roughness: .85
      }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, -6.5);
      S.add(floor);
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, .05), new THREE.MeshStandardMaterial({
        color: 0xe8ece6,
        transparent: true,
        opacity: .85
      }));
      board.position.set(0, 3.4, -8.85);
      S.add(board);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.23, .018, 8, 32), new THREE.MeshStandardMaterial({
        color: 0xe2662b
      }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 3.05, -8.45);
      S.add(ring);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 3.4, 12), new THREE.MeshStandardMaterial({
        color: 0x3a3f45
      }));
      pole.position.set(0, 1.7, -9.6);
      S.add(pole);
      const d = scene.defender,
        def = ptMannequin(THREE, PT_DEF);
      S.add(def);
      const shade = d.shade ? BS.dir(d.shade) * .45 : 0;
      const start = d.move === 'closeout-fast' ? {
        z: -4.6,
        x: shade * .4
      } : d.move === 'closeout-late' ? {
        z: -6.6,
        x: 0
      } : d.move === 'retreat' ? {
        z: -1.4,
        x: 0
      } : {
        z: -d.distance,
        x: shade
      };
      const end = {
        z: -d.distance,
        x: shade
      };
      def.position.set(start.x, 0, start.z);
      let help = null,
        mate = null;
      if (scene.teammate) {
        const s = BS.dir(scene.teammate);
        mate = ptMannequin(THREE, PT_MATE);
        mate.position.set(s * 5.9, 0, -7.2);
        mate.rotation.y = -s * .9;
        S.add(mate);
        ptPose(mate, {
          hands: 'mid',
          crouch: .15
        });
      }
      if (scene.teammate) {
        const s = BS.dir(scene.help || scene.teammate);
        help = ptMannequin(THREE, PT_HELP);
        help.position.set(s * 4.9, 0, -6.6);
        help.rotation.y = -s * .5;
        S.add(help);
        ptPose(help, {
          hands: 'mid',
          crouch: .3
        });
      }
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 16), new THREE.MeshStandardMaterial({
        color: 0xd8642a,
        roughness: .6
      }));
      S.add(ball);
      const marker = new THREE.Mesh(new THREE.RingGeometry(.22, .3, 32), new THREE.MeshBasicMaterial({
        color: PT_LIME,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      }));
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = .02;
      S.add(marker);
      const INTRO = reduced ? 0 : 1400;
      let t0 = performance.now(),
        mode = 'intro',
        replay = null;
      const place = t => {
        const k = ease(t);
        def.position.z = lerp(start.z, end.z, k);
        def.position.x = lerp(start.x, end.x, k);
        const running = d.move === 'closeout-fast' || d.move === 'closeout-late' ? 1 - k : 0;
        ptPose(def, {
          foot: k > .85 ? d.foot : 'square',
          hands: d.move === 'closeout-fast' && k < .9 ? 'high' : d.hands,
          crouch: d.move === 'retreat' ? .12 : .28,
          run: running * t * 14
        });
        if (help && scene.help) {
          const s = BS.dir(scene.help);
          help.position.x = lerp(s * 4.9, s * (scene.template === 'help-high' ? 3.6 : 1.5), k);
          help.position.z = lerp(-6.6, scene.template === 'help-high' ? -5.2 : -3.4, k);
        }
        const bounce = Math.abs(Math.sin(t * Math.PI * 3));
        ball.position.set(.32, .3 + bounce * .55, -.35);
      };
      api.current = {
        replay: action => {
          replay = {
            action,
            t0: performance.now()
          };
          mode = 'replay';
          // Indice mis en évidence : anneau sous le pied avancé ou sous l'aide.
          const s = d.foot && d.foot !== 'square' ? BS.dir(d.foot) : 0;
          if (scene.help && help) {
            marker.position.set(help.position.x, .02, help.position.z);
          } else if (s) {
            marker.position.set(def.position.x + s * .12, .02, def.position.z + .35);
          } else {
            marker.position.set(def.position.x, .02, def.position.z);
          }
          marker.material.opacity = .95;
        }
      };
      const loop = now => {
        if (disposed) return;
        frame = requestAnimationFrame(loop);
        if (document.hidden) return;
        if (mode === 'intro') {
          const t = INTRO ? (now - t0) / INTRO : 1;
          place(Math.min(1, t));
          if (t >= 1) {
            mode = 'freeze';
            onDecide && onDecide();
          }
        } else if (mode === 'replay' && replay) {
          const T = reduced ? 1 : Math.min(1, (now - replay.t0) / 1600),
            k = ease(T),
            A = BS.ACTIONS[replay.action] || {
              side: 0
            },
            a = replay.action;
          const side = A.side || (d.foot && d.foot !== 'square' ? BS.dir(d.foot) : 1);
          if (a === 'shoot') {
            ball.position.set(lerp(.28, 0, k), lerp(1.6, 3.15, k) + Math.sin(k * Math.PI) * 1.6, lerp(-.5, -8.45, k));
          } else if (a.startsWith('pass')) {
            const tx = BS.dir(scene.teammate || 'right') * 5.9;
            ball.position.set(lerp(.28, tx, k), 1.1 + Math.sin(k * Math.PI) * .5, lerp(-.5, -7.2, k));
          } else {
            // Drives, crossover, hesi, feinte : la caméra avance le long de la bonne trajectoire.
            const pre = a === 'hesi-go' || a === 'fake-drive' ? .3 : 0,
              kk = Math.max(0, (T - pre) / (1 - pre)),
              m = ease(kk);
            if (a === 'fake-drive' && T < .3) {
              cam.position.y = 1.7 - Math.sin(T / .3 * Math.PI) * .12;
              def.position.y = Math.sin(T / .3 * Math.PI) * .35;
            } else def.position.y = 0;
            if (a === 'hesi-go' && T < .3) ptPose(def, {
              foot: 'square',
              hands: 'low',
              crouch: .08
            });
            const lane = a === 'finish' || a === 'hesi-go' ? 0 : side * 1.25;
            cam.position.x = lerp(0, lane, Math.min(1, m * 1.6));
            cam.position.z = lerp(1.6, -5.6, m);
            cam.position.y = lerp(1.78, 1.7, m);
            cam.lookAt(cam.position.x * .3, lerp(.85, 1.6, m), cam.position.z - 5);
            ball.position.set(cam.position.x + .28, .35 + Math.abs(Math.sin(kk * Math.PI * 5)) * .6, cam.position.z - .55);
            def.rotation.y = lerp(0, -side * 1.2, m);
          }
          marker.material.opacity = .95 - Math.min(.6, T * .6);
        }
        renderer.render(S, cam);
      };
      frame = requestAnimationFrame(loop);
      resize = new ResizeObserver(() => {
        const W = el.clientWidth;
        if (!W) return;
        const H = Math.round(Math.min(W * .8, window.innerHeight * .58));
        renderer.setSize(W, H);
        cam.aspect = W / H;
        cam.updateProjectionMatrix();
      });
      resize.observe(el);
    }).catch(() => {
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
  }, [phase]);
  if (failed) return /*#__PURE__*/React.createElement(PTScene2D, {
    scene: scene,
    reveal: phase === 'replay'
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "scene-3d",
    ref: host,
    role: "img",
    "aria-label": "Sc\xE8ne en 3D : ton d\xE9fenseur face \xE0 toi, vu depuis tes yeux."
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
  const decidedAt = usePTRef(0);
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
  }, `Scène ${i + 1} sur ${set.scenes.length} · niveau ${scene.level} · ${BS.LEVELS[scene.level - 1].hint}`), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "scene-stage"
  }, /*#__PURE__*/React.createElement(PTScene3D, {
    key: scene.id,
    scene: scene,
    phase: phase,
    choice: choice,
    reduced: reduced,
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
  }))), /*#__PURE__*/React.createElement("div", {
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
  }, c))), /*#__PURE__*/React.createElement("p", null, scene.why), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: next
  }, i + 1 < set.scenes.length ? 'Scène suivante' : 'Voir mon bilan', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
}