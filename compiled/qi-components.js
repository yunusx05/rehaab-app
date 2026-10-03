/* QI basket : terrain animé, lectures de jeu, placements, fins de match, cartes, guide pick & roll, analyse de match. */
// Pictogramme de thème : le même demi-terrain pour tous, un ou deux repères pour la situation.
// Panier en haut, attaque en cercles pleins, défense en croix, déplacement en flèche.
const ptGlyphO = (x, y, k) => /*#__PURE__*/React.createElement("circle", {
  key: k,
  cx: x,
  cy: y,
  r: "2.4",
  className: "g-off"
});
const ptGlyphX = (x, y, k) => /*#__PURE__*/React.createElement("path", {
  key: k,
  d: `M${x - 2.2} ${y - 2.2}l4.4 4.4M${x + 2.2} ${y - 2.2}l-4.4 4.4`,
  className: "g-def"
});
const ptGlyphA = (x1, y1, x2, y2, k) => /*#__PURE__*/React.createElement("path", {
  key: k,
  d: `M${x1} ${y1}L${x2} ${y2}`,
  className: "g-move",
  markerEnd: "url(#glyph-head)"
});
const ptGlyphScreen = (x, y, k) => /*#__PURE__*/React.createElement("path", {
  key: k,
  d: `M${x - 3} ${y}h6`,
  className: "g-screen"
});
const ptQiGlyphs = {
  'pnr-handler': [ptGlyphO(10, 23, 1), ptGlyphScreen(14, 18, 2), ptGlyphA(11, 21, 19, 14, 3)],
  'pnr-screener': [ptGlyphO(14, 19, 1), ptGlyphScreen(14, 15, 2), ptGlyphA(15, 21, 17, 11, 3)],
  'post': [ptGlyphO(11, 13, 1), ptGlyphA(13, 12, 16, 8, 2)],
  'cuts': [ptGlyphO(27, 17, 1), ptGlyphA(25, 16, 19, 9, 2)],
  'offball': [ptGlyphO(6, 22, 1), ptGlyphA(7, 20, 12, 13, 2)],
  'spacing': [ptGlyphO(5, 20, 1), ptGlyphO(13, 24, 2), ptGlyphO(21, 24, 3), ptGlyphO(29, 20, 4), ptGlyphO(17, 12, 5)],
  'transition': [ptGlyphO(17, 26, 1), ptGlyphA(17, 24, 17, 10, 2)],
  'finishing-reads': [ptGlyphO(17, 20, 1), ptGlyphX(13, 12, 2), ptGlyphX(21, 12, 3), ptGlyphA(17, 18, 17, 10, 4)],
  'press-break': [ptGlyphO(10, 25, 1), ptGlyphX(14, 20, 2), ptGlyphX(21, 20, 3), ptGlyphA(12, 24, 20, 14, 4)],
  'rebound': [ptGlyphO(12, 12, 1), ptGlyphX(22, 12, 2), ptGlyphA(17, 14, 17, 8, 3)],
  'tempo': [/*#__PURE__*/React.createElement("circle", {
    key: "1",
    cx: "17",
    cy: "17",
    r: "7",
    className: "g-off"
  }), /*#__PURE__*/React.createElement("path", {
    key: "2",
    d: "M17 12v5l3.5 2",
    className: "g-move"
  })],
  'help-defense': [ptGlyphX(26, 17, 1), ptGlyphO(14, 15, 2), ptGlyphA(24, 16, 18, 12, 3)],
  'closeout': [ptGlyphO(28, 20, 1), ptGlyphX(19, 13, 2), ptGlyphA(21, 14, 26, 19, 3)],
  'rim-protection': [ptGlyphX(17, 11, 1), ptGlyphO(26, 19, 2), ptGlyphA(24, 18, 19, 12, 3)],
  'on-ball': [ptGlyphO(17, 23, 1), ptGlyphX(17, 17, 2)],
  'pnr-defense': [ptGlyphO(11, 22, 1), ptGlyphScreen(15, 18, 2), ptGlyphX(13, 18, 3), ptGlyphX(18, 16, 4)],
  'off-ball-defense': [ptGlyphO(28, 20, 1), ptGlyphX(21, 16, 2), ptGlyphO(10, 22, 3)],
  'transition-defense': [ptGlyphX(17, 10, 1), ptGlyphA(17, 12, 17, 25, 2)],
  'post-defense': [ptGlyphO(12, 13, 1), ptGlyphX(16, 13, 2)]
};
function PTQiGlyph({
  theme
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "qi-glyph",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 34 30",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("marker", {
    id: "glyph-head",
    viewBox: "0 0 10 10",
    refX: "8",
    refY: "5",
    markerWidth: "4",
    markerHeight: "4",
    orient: "auto-start-reverse"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0L10 5L0 10z",
    fill: "currentColor",
    stroke: "none"
  }))), /*#__PURE__*/React.createElement("g", {
    className: "g-court"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "1",
    y: "1",
    width: "32",
    height: "28",
    rx: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 1v6a12.5 12.5 0 0 0 24 0V1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 1v5h6V1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "6.4",
    r: "1.3"
  })), ptQiGlyphs[theme] || null));
}
function ptZigzag(x1, y1, x2, y2) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1,
    n = Math.max(3, Math.floor(len / 4)),
    ux = (x2 - x1) / len,
    uy = (y2 - y1) / len;
  let d = `M${x1} ${y1}`;
  for (let i = 1; i < n; i++) {
    const t = i / n,
      side = i % 2 ? 1.6 : -1.6;
    d += ` L${x1 + (x2 - x1) * t - uy * side} ${y1 + (y2 - y1) * t + ux * side}`;
  }
  return d + ` L${x2} ${y2}`;
}
// État affiché du terrain : positions par numéro, porteur (numéro ou [x, y] pour un tir), flèches.
function ptCourtState(court) {
  const holder = (court.o || []).find(p => p[3]);
  return {
    o: Object.fromEntries((court.o || []).map(([n, x, y]) => [String(n), [x, y]])),
    d: Object.fromEntries((court.d || []).map(([n, x, y]) => [String(n), [x, y]])),
    ball: holder ? String(holder[0]) : null,
    a: court.a || []
  };
}
function ptApplyFrame(state, frame) {
  return {
    o: {
      ...state.o,
      ...(frame.o || {})
    },
    d: {
      ...state.d,
      ...(frame.d || {})
    },
    ball: frame.ball === undefined ? state.ball : Array.isArray(frame.ball) ? frame.ball : String(frame.ball),
    a: frame.a || []
  };
}
function ptReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}
function usePTCourtPlayer(court) {
  const [view, setView] = usePTState(() => ptCourtState(court));
  const [playing, setPlaying] = usePTState(false);
  const timer = usePTRef(null);
  usePTEffect(() => () => clearTimeout(timer.current), []);
  const play = (frames, from, onDone) => {
    clearTimeout(timer.current);
    let state = from || view;
    if (!frames || !frames.length) {
      if (onDone) onDone();
      return;
    }
    // Mouvement réduit : on montre directement la position finale.
    if (ptReducedMotion()) {
      setView(frames.reduce(ptApplyFrame, state));
      if (onDone) onDone();
      return;
    }
    setView(state);
    setPlaying(true);
    let i = 0;
    const step = () => {
      state = ptApplyFrame(state, frames[i]);
      setView(state);
      i++;
      timer.current = setTimeout(i < frames.length ? step : () => {
        setPlaying(false);
        if (onDone) onDone();
      }, 950);
    };
    timer.current = setTimeout(step, 450);
  };
  return {
    view,
    playing,
    play
  };
}
function PTCourt({
  court,
  view,
  hidden = false,
  onTap,
  tap,
  target,
  you,
  label
}) {
  const ref = usePTRef(null);
  const v = view || ptCourtState(court);
  const ball = Array.isArray(v.ball) ? v.ball : v.ball && v.o[v.ball];
  const at = ([x, y]) => ({
    transform: `translate(${x}px, ${y}px)`
  });
  const handle = e => {
    if (!onTap) return;
    const box = ref.current.getBoundingClientRect();
    onTap(Math.round((e.clientX - box.left) / box.width * 100), Math.round((e.clientY - box.top) / box.height * 94));
  };
  const arrow = ([type, x1, y1, x2, y2], i) => {
    if (type === 'screen') {
      const len = Math.hypot(x2 - x1, y2 - y1) || 1,
        nx = -(y2 - y1) / len * 3,
        ny = (x2 - x1) / len * 3;
      return /*#__PURE__*/React.createElement("g", {
        key: `${i}-${x1}-${y1}`,
        className: "court-move"
      }, /*#__PURE__*/React.createElement("path", {
        d: `M${x1} ${y1}L${x2} ${y2}`
      }), /*#__PURE__*/React.createElement("path", {
        d: `M${x2 - nx} ${y2 - ny}L${x2 + nx} ${y2 + ny}`
      }));
    }
    return /*#__PURE__*/React.createElement("path", {
      key: `${i}-${x1}-${y1}`,
      className: `court-move is-${type}`,
      d: type === 'dribble' ? ptZigzag(x1, y1, x2, y2) : `M${x1} ${y1}L${x2} ${y2}`,
      markerEnd: "url(#court-head)"
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: `court-wrap${hidden ? ' is-hidden' : ''}${onTap ? ' is-tappable' : ''}`
  }, /*#__PURE__*/React.createElement("svg", {
    ref: ref,
    className: "court",
    viewBox: "0 0 100 94",
    role: "img",
    "aria-label": label || 'Demi-terrain de basket',
    onClick: handle
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("marker", {
    id: "court-head",
    viewBox: "0 0 10 10",
    refX: "8",
    refY: "5",
    markerWidth: "5",
    markerHeight: "5",
    orient: "auto-start-reverse"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0L10 5L0 10z",
    fill: "currentColor"
  }))), /*#__PURE__*/React.createElement("g", {
    className: "court-lines"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "99",
    height: "93"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "34",
    y: "0.5",
    width: "32",
    height: "37.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "38",
    r: "12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 0.5V28A47.5 47.5 0 0 0 94 28V0.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M42 10.5A8 8 0 0 0 58 10.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M44 7.5H56"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "10.5",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M38 93.5A12 12 0 0 1 62 93.5"
  })), !hidden && /*#__PURE__*/React.createElement(React.Fragment, null, v.a.map(arrow), Object.entries(v.d).map(([n, p]) => /*#__PURE__*/React.createElement("g", {
    key: `d${n}`,
    className: "court-def",
    style: at(p)
  }, /*#__PURE__*/React.createElement("path", {
    d: "M-2.6 -2.6L2.6 2.6M2.6 -2.6L-2.6 2.6"
  }), /*#__PURE__*/React.createElement("text", {
    x: "3.4",
    y: "-2.2"
  }, n))), Object.entries(v.o).map(([n, p]) => /*#__PURE__*/React.createElement("g", {
    key: `o${n}`,
    className: "court-off",
    style: at(p)
  }, /*#__PURE__*/React.createElement("circle", {
    r: "3.6"
  }), /*#__PURE__*/React.createElement("text", {
    y: "1.3"
  }, n))), ball && /*#__PURE__*/React.createElement("circle", {
    className: "court-ball",
    r: "5.4",
    style: at(ball)
  })), target && /*#__PURE__*/React.createElement("circle", {
    className: "court-target",
    cx: target[0],
    cy: target[1],
    r: target[2]
  }), tap && /*#__PURE__*/React.createElement("g", {
    className: "court-you",
    transform: `translate(${tap[0]} ${tap[1]})`
  }, /*#__PURE__*/React.createElement("circle", {
    r: "3.6"
  }), /*#__PURE__*/React.createElement("text", {
    y: "1.3"
  }, you || '?'))), hidden && /*#__PURE__*/React.createElement("span", {
    className: "court-hidden-label"
  }, "Sch\xE9ma masqu\xE9 \xB7 r\xE9ponds de m\xE9moire"));
}
function PTQiChoices({
  choices,
  picked,
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "qi-choices"
  }, choices.map((c, i) => {
    const state = picked === null ? '' : c.ok ? ' is-right' : picked === i ? ' is-wrong' : ' is-dim';
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: i,
      className: `qi-choice${state}`,
      disabled: picked !== null,
      "aria-pressed": picked === i,
      onClick: () => onPick(i)
    }, c.text);
  }));
}
function PTQiFeedback({
  ok,
  title,
  why,
  lesson
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `qi-feedback${ok ? ' is-right' : ' is-wrong'}`,
    role: "status"
  }, /*#__PURE__*/React.createElement("strong", null, title || (ok ? 'Bonne lecture.' : 'Pas la meilleure option.')), why && /*#__PURE__*/React.createElement("p", null, why), lesson && /*#__PURE__*/React.createElement("p", {
    className: "qi-lesson"
  }, lesson));
}
function ptQiItems(mode, data) {
  const player = data.player || {},
    rank = JP.qiThemes(player),
    qi = data.qi;
  const pick = (kind, n, theme = null, side = null) => QI.pool(kind, qi, player, rank, theme, side).slice(0, n).map(item => ({
    mode: kind,
    item
  }));
  if (mode === 'daily') return QI.dailySet(qi, player, rank).items;
  if (mode === 'place') return pick('place', 4);
  if (mode === 'clutch') return pick('clutch', 5);
  if (mode === 'scan') return pick('quiz', 5).map(x => ({
    ...x,
    scan: true
  }));
  if (mode === 'speed') return pick('quiz', 6).map(x => ({
    ...x,
    speed: true
  }));
  if (mode === 'defense') return [...pick('quiz', 4, null, 'def'), ...pick('place', 1, null, 'def'), ...pick('clutch', 1, null, 'def')];
  if (mode.startsWith('theme-')) {
    const theme = mode.slice(6);
    return [...pick('quiz', 4, theme), ...pick('place', 1, theme), ...pick('clutch', 2, theme)];
  }
  return pick('quiz', 5);
}
const ptQiTitles = {
  daily: 'Tes lectures du jour',
  quiz: 'Lire le jeu',
  scan: 'Scan 2 secondes',
  speed: 'Décision rapide',
  defense: 'Lire en défense',
  place: 'Où dois-tu être ?',
  clutch: 'Fin de match'
};
const PT_SPEED_SECONDS = 5;

// Une situation : l'action se joue, se fige, tu décides, puis la bonne lecture peut être rejouée.
function PTQiItem({
  entry,
  onAnswer
}) {
  const item = entry.item,
    isPlace = entry.mode === 'place',
    isClutch = entry.mode === 'clutch';
  const start = item.court ? ptCourtState(item.court) : null;
  const court = usePTCourtPlayer(item.court || {
    o: [],
    d: []
  });
  const [ready, setReady] = usePTState(!item.anim || isClutch);
  const [hidden, setHidden] = usePTState(false);
  const [picked, setPicked] = usePTState(null);
  const [tap, setTap] = usePTState(null);
  const [checked, setChecked] = usePTState(false);
  const [left, setLeft] = usePTState(PT_SPEED_SECONDS);
  const answered = isPlace ? checked : picked !== null;
  const endState = () => (item.anim || []).reduce(ptApplyFrame, start);
  usePTEffect(() => {
    if (item.anim && !isClutch) court.play(item.anim, start, () => setReady(true));
  }, []);
  usePTEffect(() => {
    if (!entry.scan || !ready) return;
    const t = setTimeout(() => setHidden(true), 2000);
    return () => clearTimeout(t);
  }, [ready]);
  usePTEffect(() => {
    if (!entry.speed || !ready || answered) return;
    if (left <= 0) {
      setPicked(-1);
      onAnswer(false);
      return;
    }
    const t = setTimeout(() => setLeft(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [ready, answered, left]);
  const choices = isClutch ? item.choices.map(([text, ok, why]) => ({
    text,
    ok: !!ok,
    why
  })) : item.choices;
  const right = choices && choices.find(c => c.ok);
  const placeOk = isPlace && tap && QI.hitTarget(item, tap[0], tap[1]);
  const showChoices = !isPlace && ready && (!entry.scan || hidden || picked !== null);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, QI.themes[item.theme], QI.sideOf(item) === 'def' ? ' · défense' : ''), isClutch && /*#__PURE__*/React.createElement("div", {
    className: "scoreboard"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "clock",
    size: 18
  }), /*#__PURE__*/React.createElement("strong", null, item.situation)), !isClutch && /*#__PURE__*/React.createElement(PTCourt, {
    view: court.view,
    hidden: entry.scan && hidden && picked === null,
    onTap: isPlace && ready && !checked ? (x, y) => setTap([x, y]) : null,
    tap: tap,
    you: item.you,
    target: isPlace && checked ? [...item.target, item.r] : null,
    label: item.prompt
  }), !isClutch && item.anim && /*#__PURE__*/React.createElement("div", {
    className: "court-controls"
  }, /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, court.playing ? 'Action en cours…' : ready && !answered ? 'Arrêt sur image : à toi de lire.' : ''), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    disabled: court.playing,
    onClick: () => court.play(item.anim, start, () => setReady(true))
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh",
    size: 15
  }), "Rejouer l\u2019action")), /*#__PURE__*/React.createElement("p", {
    className: "qi-prompt"
  }, item.prompt), entry.scan && ready && !hidden && picked === null && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "M\xE9morise les positions : le sch\xE9ma dispara\xEEt dans 2 secondes."), entry.speed && ready && !answered && /*#__PURE__*/React.createElement("div", {
    className: "speed-bar",
    role: "timer",
    "aria-label": `${left} secondes pour décider`
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      transform: `scaleX(${left / PT_SPEED_SECONDS})`
    }
  }), /*#__PURE__*/React.createElement("span", null, left, " s")), isPlace ? /*#__PURE__*/React.createElement(React.Fragment, null, !checked && ready && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, tap ? 'Touche ailleurs pour corriger, puis valide.' : `Touche le terrain là où ${item.offense ? 'tu vas' : 'tu te places'}.`), !checked && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !tap,
    onClick: () => {
      setChecked(true);
      onAnswer(!!placeOk);
    }
  }, "Valider ma position"), checked && /*#__PURE__*/React.createElement(PTQiFeedback, {
    ok: placeOk,
    why: placeOk ? 'Tu es dans la zone attendue.' : 'La zone attendue est entourée sur le terrain.',
    lesson: item.lesson
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, showChoices && /*#__PURE__*/React.createElement(PTQiChoices, {
    choices: choices,
    picked: picked,
    onPick: i => {
      setPicked(i);
      onAnswer(choices[i].ok);
    }
  }), picked === -1 && /*#__PURE__*/React.createElement(PTQiFeedback, {
    ok: false,
    title: "Temps \xE9coul\xE9.",
    why: `Sur le terrain, la fenêtre se referme vite. ${right.why}`,
    lesson: item.lesson
  }), picked !== null && picked >= 0 && /*#__PURE__*/React.createElement(PTQiFeedback, {
    ok: choices[picked].ok,
    why: choices[picked].ok ? choices[picked].why : `${choices[picked].why} ${right.why}`,
    lesson: item.lesson
  })), answered && item.solution && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    disabled: court.playing,
    onClick: () => court.play(item.solution, endState())
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 17
  }), "Voir la bonne lecture"));
}
function PTQiRun({
  data,
  update,
  go,
  id
}) {
  const mode = id || 'quiz';
  const [items] = usePTState(() => ptQiItems(mode, data));
  const [index, setIndex] = usePTState(0);
  const [answered, setAnswered] = usePTState(false);
  const [score, setScore] = usePTState(0);
  const current = items[index];
  const title = mode.startsWith('theme-') ? QI.themes[mode.slice(6)] : ptQiTitles[mode] || 'QI basket';
  const answer = correct => {
    setAnswered(true);
    if (correct) setScore(n => n + 1);
    update(s => ({
      ...s,
      qi: QI.record(s.qi, {
        id: current.item.id,
        mode: current.scan ? 'scan' : current.speed ? 'speed' : current.mode,
        theme: current.item.theme,
        correct
      })
    }));
  };
  const nextItem = () => {
    setIndex(i => i + 1);
    setAnswered(false);
    window.scrollTo(0, 0);
  };
  if (!items.length) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    eyebrow: "QI basket",
    title: "Rien \xE0 proposer ici."
  }), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('qi')
  }, "Revenir au QI"));
  if (!current) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    eyebrow: title,
    title: `${score} sur ${items.length}.`
  }, score === items.length ? 'Lecture parfaite. Les prochaines questions iront chercher plus loin.' : 'Les situations ratées reviendront en priorité, jusqu’à ce qu’elles deviennent des réflexes.'), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('qi')
  }, "Revenir au QI", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('today')
  }, "Retour \xE0 l\u2019accueil")));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    eyebrow: `${title} · ${index + 1} / ${items.length}`,
    title: current.item.title
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg qi-run"
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-track"
  }, items.map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: i <= index ? 'done' : ''
  }))), /*#__PURE__*/React.createElement(PTQiItem, {
    key: index,
    entry: current,
    onAnswer: answer
  }), answered && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: nextItem
  }, index + 1 < items.length ? 'Situation suivante' : 'Voir mon résultat', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))));
}
function PTQiHome({
  data,
  update,
  go
}) {
  const player = data.player || {},
    qi = data.qi,
    rank = JP.qiThemes(player);
  const daily = QI.dailySet(qi, player, rank),
    streak = QI.streak(qi),
    due = QI.dueCards(qi).length;
  const mine = (rank.length ? rank : Object.keys(QI.themes)).filter(t => QI.themes[t]);
  const ordered = [...mine, ...Object.keys(QI.themes).filter(t => !mine.includes(t))];
  const attack = ordered.filter(t => !QI.defenseThemes.includes(t)),
    defense = ordered.filter(t => QI.defenseThemes.includes(t));
  const modes = [{
    id: 'video',
    title: 'Vrais matchs',
    hint: 'Pause au moment de décider.',
    icon: 'play',
    route: ['qi-video']
  }, {
    id: 'quiz',
    title: 'Lire le jeu',
    hint: 'Situations animées, une décision.',
    icon: 'court',
    route: ['qi-run', 'quiz']
  }, {
    id: 'defense',
    title: 'Lire en défense',
    hint: 'Aides, pick & roll, repli.',
    icon: 'body',
    route: ['qi-run', 'defense']
  }, {
    id: 'speed',
    title: 'Décision rapide',
    hint: `${PT_SPEED_SECONDS} secondes pour choisir.`,
    icon: 'play',
    route: ['qi-run', 'speed']
  }, {
    id: 'scan',
    title: 'Scan 2 secondes',
    hint: 'Le schéma disparaît : lis vite.',
    icon: 'spark',
    route: ['qi-run', 'scan']
  }, {
    id: 'place',
    title: 'Où dois-tu être ?',
    hint: 'Touche le terrain au bon endroit.',
    icon: 'pin',
    route: ['qi-run', 'place']
  }, {
    id: 'clutch',
    title: 'Fin de match',
    hint: 'Score, chrono, décision.',
    icon: 'clock',
    route: ['qi-run', 'clutch']
  }, {
    id: 'pnr',
    title: 'Guide pick & roll',
    hint: 'Chaque défense, en mouvement.',
    icon: 'book',
    route: ['qi-pnr']
  }, {
    id: 'cards',
    title: 'Vocabulaire',
    hint: due ? `${due} cartes à revoir` : 'À jour',
    icon: 'copy',
    route: ['qi-cards']
  }, {
    id: 'review',
    title: 'Analyse de match',
    hint: 'Cinq minutes après ton match.',
    icon: 'chart',
    route: ['qi-review']
  }];
  const row = t => {
    const m = QI.mastery(qi, t);
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      className: "mastery-row",
      onClick: () => go('qi-run', `theme-${t}`)
    }, /*#__PURE__*/React.createElement(PTQiGlyph, {
      theme: t
    }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, QI.themes[t]), /*#__PURE__*/React.createElement("small", null, m.count ? `${Math.round(m.ratio * 100)} % sur les dernières` : mine.includes(t) ? 'Prioritaire pour ton poste' : 'Pas encore travaillé')), /*#__PURE__*/React.createElement("span", {
      className: "mastery-bar"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        transform: `scaleX(${m.ratio || 0})`
      }
    })), /*#__PURE__*/React.createElement(PTIcon, {
      name: "arrow",
      size: 16
    }));
  };
  const section = (label, list) => {
    const first = list.filter(t => mine.includes(t)),
      rest = list.filter(t => !mine.includes(t));
    return /*#__PURE__*/React.createElement("section", {
      className: "stack-sm"
    }, /*#__PURE__*/React.createElement("h2", null, label), (first.length ? first : rest.slice(0, 4)).map(row), first.length > 0 && rest.length > 0 && /*#__PURE__*/React.createElement("details", {
      className: "disclosure"
    }, /*#__PURE__*/React.createElement("summary", null, "Autres th\xE8mes"), /*#__PURE__*/React.createElement("div", {
      className: "stack-sm"
    }, rest.map(row))));
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "L\u2019esprit",
    title: "QI basket."
  }, player.position ? `Situations choisies pour un ${JP.positions[player.position].label.toLowerCase()}, en attaque comme en défense.` : 'Lectures de jeu, placements et fins de match, sans ballon.'), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, !player.position && /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm"
  }, /*#__PURE__*/React.createElement("p", null, "Renseigne ton poste pour recevoir les situations qui te concernent."), /*#__PURE__*/React.createElement(PTButton, {
    onClick: () => go('player')
  }, "Cr\xE9er mon profil joueur")), /*#__PURE__*/React.createElement("section", {
    className: "mind-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("span", {
    className: "training-kicker"
  }, "Aujourd\u2019hui"), streak > 0 && /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, streak, " jour", streak > 1 ? 's' : '', " d\u2019affil\xE9e")), /*#__PURE__*/React.createElement("h2", null, daily.done >= daily.items.length ? 'Lectures du jour faites.' : `${daily.items.length - daily.done} lecture${daily.items.length - daily.done > 1 ? 's' : ''} du jour.`), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, daily.items.map(x => QI.themes[x.item.theme]).filter((v, i, a) => a.indexOf(v) === i).join(' · ')), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('qi-run', 'daily')
  }, daily.done >= daily.items.length ? 'Refaire' : 'C’est parti', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, "\xC0 toi de choisir"), /*#__PURE__*/React.createElement("div", {
    className: "mode-grid"
  }, modes.map(m => /*#__PURE__*/React.createElement("button", {
    key: m.id,
    className: "mode-tile",
    onClick: () => go(...m.route)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: m.icon
  }), /*#__PURE__*/React.createElement("strong", null, m.title), /*#__PURE__*/React.createElement("small", null, m.hint))))), section('En attaque', attack), section('En défense', defense), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: qi.rest !== false,
    onChange: e => update(s => ({
      ...s,
      qi: {
        ...s.qi,
        rest: e.target.checked
      }
    }))
  }), "Me poser une question pendant les temps de repos des s\xE9ances")));
}
function PTQiCards({
  data,
  update,
  go
}) {
  const [deck] = usePTState(() => QI.dueCards(data.qi, PT.dateKey(), 10));
  const [index, setIndex] = usePTState(0),
    [shown, setShown] = usePTState(false),
    [known, setKnown] = usePTState(0);
  const card = deck[index];
  const grade = ok => {
    update(s => ({
      ...s,
      qi: QI.gradeCard(QI.record(s.qi, {
        id: card.id,
        mode: 'card',
        theme: card.theme,
        correct: ok
      }), card.id, ok)
    }));
    if (ok) setKnown(n => n + 1);
    setShown(false);
    setIndex(i => i + 1);
  };
  if (!card) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    eyebrow: "Vocabulaire",
    title: deck.length ? `${known} sur ${deck.length}.` : 'Tout est à jour.'
  }, deck.length ? 'Les cartes à revoir reviendront demain, les autres plus tard.' : 'Reviens demain pour les prochaines cartes.'), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('qi')
  }, "Revenir au QI"));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    eyebrow: `Vocabulaire · ${index + 1} / ${deck.length}`,
    title: card.term
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flash-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, QI.themes[card.theme]), shown ? /*#__PURE__*/React.createElement("p", null, card.def) : /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "D\xE9finis ce terme dans ta t\xEAte, puis v\xE9rifie.")), !shown ? /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => setShown(true)
  }, "Voir la d\xE9finition") : /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => grade(false)
  }, "\xC0 revoir"), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => grade(true)
  }, "Je savais", /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 18
  })))));
}
function PTAnimatedCourt({
  item
}) {
  const court = usePTCourtPlayer(item.court);
  const frames = [...(item.anim || []), ...(item.solution || [])];
  return /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement(PTCourt, {
    view: court.view,
    label: item.prompt
  }), frames.length > 0 && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    disabled: court.playing,
    onClick: () => court.play(frames, ptCourtState(item.court))
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 17
  }), court.playing ? 'Action en cours…' : 'Voir l’action et la bonne lecture'));
}
function PTQiPnr({
  go
}) {
  const [id, setId] = usePTState('drop');
  const g = QI.pnrGuide.find(x => x.id === id),
    item = QI.quiz.find(q => q.id === g.court);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    eyebrow: "Guide",
    title: "Pick & roll."
  }, "Reconna\xEEtre la d\xE9fense avant de choisir. Chaque couverture laisse quelque chose."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTChips, {
    value: id,
    onChange: setId,
    options: QI.pnrGuide.map(x => ({
      value: x.id,
      label: x.name
    }))
  }), /*#__PURE__*/React.createElement(PTAnimatedCourt, {
    key: id,
    item: item
  }), /*#__PURE__*/React.createElement("dl", {
    className: "pnr-guide"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "La reconna\xEEtre"), /*#__PURE__*/React.createElement("dd", null, g.spot)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Porteur"), /*#__PURE__*/React.createElement("dd", null, g.handler)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Poseur"), /*#__PURE__*/React.createElement("dd", null, g.screener)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Le pi\xE8ge"), /*#__PURE__*/React.createElement("dd", null, g.trap))), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('qi-run', 'theme-pnr-handler')
  }, "En attaque", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('qi-run', 'theme-pnr-defense')
  }, "En d\xE9fense"))));
}
function PTQiReview({
  data,
  update,
  go,
  notify
}) {
  const g = QI.group(data.player?.position);
  const matches = data.events.filter(e => e.type === 'match' && e.date <= PT.dateKey()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const [eventId, setEventId] = usePTState(matches[0]?.id || '');
  const [answers, setAnswers] = usePTState({});
  const questions = QI.review.filter(q => q.groups.includes(g));
  const past = data.qi.reviews.slice().reverse();
  const save = () => {
    if (!Object.values(answers).some(v => String(v).trim())) {
      notify('Réponds au moins à une question.');
      return;
    }
    update(s => ({
      ...s,
      qi: QI.addReview(s.qi, {
        eventId,
        answers
      })
    }));
    setAnswers({});
    notify('Analyse enregistrée.');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    eyebrow: "Apr\xE8s le match",
    title: "Analyse de match."
  }, "Cinq minutes, \xE0 chaud ou le lendemain. Une lecture r\xE9ussie, une rat\xE9e : c\u2019est ce qui fait progresser."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, matches.length > 0 ? /*#__PURE__*/React.createElement(PTField, {
    label: "Quel match ?"
  }, /*#__PURE__*/React.createElement("select", {
    value: eventId,
    onChange: e => setEventId(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Sans lien avec un match enregistr\xE9"), matches.map(m => /*#__PURE__*/React.createElement("option", {
    key: m.id,
    value: m.id
  }, m.title, " \xB7 ", shortDate(m.date))))) : /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('event')
  }, "Ajouter un match \xE0 ton agenda \u2192"), questions.map(q => /*#__PURE__*/React.createElement("section", {
    className: "stack-sm",
    key: q.id
  }, /*#__PURE__*/React.createElement("h3", null, q.label), q.type === 'text' ? /*#__PURE__*/React.createElement("textarea", {
    maxLength: "600",
    value: answers[q.id] || '',
    onChange: e => setAnswers(a => ({
      ...a,
      [q.id]: e.target.value
    }))
  }) : /*#__PURE__*/React.createElement(PTChips, {
    value: answers[q.id],
    onChange: v => setAnswers(a => ({
      ...a,
      [q.id]: v
    })),
    options: q.options.map(o => ({
      value: o,
      label: o
    }))
  }))), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: save
  }, "Enregistrer l\u2019analyse", /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 18
  })), past.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Tes analyses"), past.slice(0, 10).map(r => {
    const ev = data.events.find(e => e.id === r.eventId);
    return /*#__PURE__*/React.createElement("details", {
      className: "disclosure",
      key: r.id
    }, /*#__PURE__*/React.createElement("summary", null, ev ? ev.title : 'Match', " \xB7 ", shortDate(r.date)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
      className: "reason-list"
    }, QI.review.filter(q => r.answers[q.id]).map(q => /*#__PURE__*/React.createElement("li", {
      key: q.id
    }, /*#__PURE__*/React.createElement("strong", null, q.label), " : ", r.answers[q.id])))));
  }))));
}

// Pendant le repos d'une séance : une question courte, sans schéma.
function PTRestQuestion({
  data,
  update,
  seed
}) {
  const [question] = usePTState(() => QI.restQuestion(data.qi));
  const [picked, setPicked] = usePTState(null);
  if (data.qi?.rest === false) return null;
  return /*#__PURE__*/React.createElement("section", {
    className: "rest-question",
    key: seed
  }, /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "Question de repos \xB7 ", question.title), /*#__PURE__*/React.createElement("p", null, question.prompt), /*#__PURE__*/React.createElement(PTQiChoices, {
    choices: question.choices,
    picked: picked,
    onPick: i => {
      setPicked(i);
      update(s => ({
        ...s,
        qi: QI.record(s.qi, {
          id: question.id,
          mode: 'rest',
          theme: question.theme,
          correct: question.choices[i].ok
        })
      }));
    }
  }), picked !== null && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, question.choices[picked].ok ? 'Oui. ' : '', question.lesson));
}