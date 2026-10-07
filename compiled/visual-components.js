/* Visual components share the existing React runtime and local training state. */
const ptMuscleLabels = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  arms: 'Bras',
  quads: 'Quadriceps',
  glutes: 'Fessiers',
  hamstrings: 'Ischio-jambiers',
  calves: 'Mollets',
  core: 'Abdominaux'
};
// Dose affichée dans les listes de séance : « 3 × 8–10 », « 3 × 30 s », « 3 × 10 tirs ».
const ptDoseLabel = e => e.measure === 'seconds' ? `${e.sets} × ${e.seconds} s` : e.measure === 'shots' ? `${e.sets} × ${e.targetMax || e.max} tirs` : `${e.sets} × ${e.targetMin === e.targetMax ? e.targetMax : `${e.targetMin}–${e.targetMax}`}${e.unilateral ? ' / côté' : ''}`;
function ptMuscles(e) {
  const source = window.RehaabMedia?.[e.id]?.muscles;
  const translate = {
    chest: 'chest',
    lats: 'back',
    'middle back': 'back',
    'lower back': 'back',
    traps: 'back',
    shoulders: 'shoulders',
    biceps: 'arms',
    triceps: 'arms',
    forearms: 'arms',
    quadriceps: 'quads',
    glutes: 'glutes',
    hamstrings: 'hamstrings',
    calves: 'calves',
    abdominals: 'core'
  };
  if (source?.length) return [...new Set(source.map(m => translate[m]).filter(Boolean))];
  const specific = {
    'db-shoulder': ['shoulders'],
    lateral: ['shoulders'],
    deadbug: ['core'],
    bridge: ['glutes'],
    legextension: ['quads'],
    legcurl: ['hamstrings'],
    copenhagen: ['core'],
    rdl: ['hamstrings', 'glutes']
  };
  return specific[e.id] || {
    push: ['chest', 'shoulders'],
    pull: ['back'],
    arms: ['arms'],
    squat: ['quads', 'glutes'],
    hinge: ['glutes', 'hamstrings'],
    core: ['core'],
    calf: ['calves']
  }[e.pattern] || [];
}
function ptKindIcon(e) {
  return {
    strength: 'weight',
    basket: 'basket',
    cardio: 'run',
    mobility: 'body',
    plyo: 'spark'
  }[e.kind] || 'body';
}
function PTThumbnail({
  exercise: e
}) {
  const m = window.RehaabMedia?.[e.id];
  // Cards stay still and fill their frame; videos are reserved for the exercise demonstration.
  const sources = [m?.card, m?.poster, m?.frames && `media/${m.frames}/0.webp`].filter(Boolean);
  const [attempt, setAttempt] = usePTState(0),
    src = sources[attempt];
  usePTEffect(() => setAttempt(0), [e.id]);
  return /*#__PURE__*/React.createElement("span", {
    className: `movement-thumb${src ? ' has-image' : ''}`
  }, src ? /*#__PURE__*/React.createElement("img", {
    loading: "lazy",
    decoding: "async",
    src: src,
    alt: "",
    onError: () => setAttempt(a => a + 1)
  }) : /*#__PURE__*/React.createElement(PTIcon, {
    name: ptKindIcon(e),
    size: 38
  }), /*#__PURE__*/React.createElement("span", {
    className: "thumb-type"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: m?.video ? 'play' : m?.frames ? 'body' : ptKindIcon(e),
    size: 13
  }), m?.video ? 'Vidéo' : m?.frames ? 'Positions' : e.kind === 'basket' ? 'Technique' : 'Repères'));
}
function PTExerciseMetrics({
  exercise: e,
  weight
}) {
  const target = e.measure === 'seconds' ? `${e.seconds}s` : e.targetMin && e.targetMax && e.targetMin !== e.targetMax ? `${e.targetMin}–${e.targetMax}` : e.targetMax || e.max;
  return /*#__PURE__*/React.createElement("div", {
    className: `exercise-metrics${e.weighted ? ' with-weight' : ''}`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh",
    size: 14
  }), "S\xE9ries"), /*#__PURE__*/React.createElement("strong", null, e.sets)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(PTIcon, {
    name: e.measure === 'seconds' ? 'clock' : e.measure === 'shots' ? 'basket' : 'body',
    size: 14
  }), e.measure === 'seconds' ? 'Durée' : e.measure === 'shots' ? 'Tirs' : 'Reps'), /*#__PURE__*/React.createElement("strong", null, target), e.unilateral && /*#__PURE__*/React.createElement("small", null, "/ c\xF4t\xE9")), e.weighted && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(PTIcon, {
    name: "weight",
    size: 14
  }), "Charge"), /*#__PURE__*/React.createElement("strong", null, weight ? `${weight}` : '—', weight && /*#__PURE__*/React.createElement("small", null, " kg"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(PTIcon, {
    name: "heart",
    size: 14
  }), "Repos"), /*#__PURE__*/React.createElement("strong", null, e.rest, /*#__PURE__*/React.createElement("small", null, " s"))));
}
function PTRing({
  value,
  total,
  label,
  children
}) {
  const ratio = Math.min(1, Math.max(0, total ? value / total : 0));
  return /*#__PURE__*/React.createElement("div", {
    className: "activity-ring",
    role: "img",
    "aria-label": label
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 120 120",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    className: "ring-track",
    cx: "60",
    cy: "60",
    r: "51"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ring-value",
    cx: "60",
    cy: "60",
    r: "51",
    pathLength: "100",
    strokeDasharray: `${ratio * 100} 100`
  })), /*#__PURE__*/React.createElement("div", {
    className: "ring-content"
  }, children));
}
function PTRewards({
  data,
  notify,
  compact = false
}) {
  const summary = PT.weeklySummary(data),
    count = new Set(data.sessions.map(s => s.id)).size;
  const badges = [{
    title: 'Premier pas',
    goal: 1,
    icon: 'play'
  }, {
    title: 'Bien lancé',
    goal: 5,
    icon: 'spark'
  }, {
    title: 'Dans le rythme',
    goal: 10,
    icon: 'check'
  }];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Mon défi Rehaab cette semaine : ${summary.sessions}/${summary.target} séances, ${summary.minutes} minutes pour moi. On se motive ensemble, chacun à son rythme ?`);
      notify('Bilan copié. Tu peux le partager avec tes amis.');
    } catch (e) {
      notify('Copie indisponible sur ce navigateur. Ton bilan reste affiché ici.');
    }
  };
  return /*#__PURE__*/React.createElement("section", {
    className: `reward-card${compact ? ' compact' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "reward-main"
  }, /*#__PURE__*/React.createElement(PTRing, {
    value: summary.sessions,
    total: summary.target,
    label: `${summary.sessions} séances sur ${summary.target} cette semaine`
  }, /*#__PURE__*/React.createElement("strong", null, summary.sessions, /*#__PURE__*/React.createElement("small", null, "/", summary.target)), /*#__PURE__*/React.createElement("span", null, "s\xE9ances")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "D\xE9fi de la semaine"), /*#__PURE__*/React.createElement("h2", null, summary.sessions >= summary.target ? 'Objectif atteint.' : 'À ton rythme.'), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, summary.sessions >= summary.target ? 'Profite aussi des jours de repos.' : `${Math.max(0, summary.target - summary.sessions)} séance${summary.target - summary.sessions > 1 ? 's' : ''} pour ton repère hebdo.`), /*#__PURE__*/React.createElement("span", {
    className: "reward-points"
  }, count * 50, " points de r\xE9gularit\xE9"))), !compact && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "badge-shelf"
  }, badges.map(b => /*#__PURE__*/React.createElement("div", {
    className: `earned-badge${count >= b.goal ? ' unlocked' : ''}`,
    key: b.goal
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(PTIcon, {
    name: b.icon,
    size: 24
  })), /*#__PURE__*/React.createElement("strong", null, b.title), /*#__PURE__*/React.createElement("small", null, Math.min(count, b.goal), "/", b.goal, " s\xE9ances")))), /*#__PURE__*/React.createElement("p", {
    className: "caption"
  }, "50 points par s\xE9ance enregistr\xE9e, m\xEAme partielle. Aucune course \xE0 l\u2019intensit\xE9."), /*#__PURE__*/React.createElement("button", {
    className: "text-button accent-text",
    onClick: copy
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "copy",
    size: 16
  }), "Copier mon bilan pour mes amis")));
}