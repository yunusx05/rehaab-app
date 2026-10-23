/* Action mode reuses the existing prescriptions, validation, history and safety rules. */
function PTSetSheet({
  exercise,
  row,
  onChange,
  onSave,
  onQuick,
  onClose,
  error
}) {
  const dialog = usePTRef(null);
  usePTEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => el.close();
  }, []);
  return /*#__PURE__*/React.createElement("dialog", {
    className: "set-sheet",
    ref: dialog,
    onCancel: e => {
      e.preventDefault();
      onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet-handle"
  }), /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Ta s\xE9rie, en un geste"), /*#__PURE__*/React.createElement("h2", null, "Ce que tu as fait.")), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Fermer la saisie",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "close"
  }))), onQuick && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: onQuick
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 20
  }), "Fait comme pr\xE9vu"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement(PTRowInputs, {
    exercise: exercise,
    row: row,
    onChange: onChange
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    onClick: () => onSave()
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 20
  }), "Valider cette s\xE9rie")));
}

// Lot 19 : la séance avance seule, segment par segment. Chaque chrono qui finit enchaîne le suivant :
// « Prépare-toi » (5 s) → travail ; côté 1 → « Change de côté » (5 s) → côté 2 ; travail minuté → série validée → repos → « Prépare-toi ».
// Un mouvement unilatéral est chronométré côté par côté ; l'aperçu compte donc les deux côtés.
const ptSideSeconds = m => m.measure === 'seconds' ? m.seconds : (m.targetMax || m.max || 10) * 3;
const ptMoveSeconds = m => ptSideSeconds(m) * (m.unilateral ? 2 : 1);
const ptTimer = (seconds, label, kind, extra = {}, paused = false) => ({
  id: PT.uid(),
  endAt: paused ? null : Date.now() + seconds * 1000,
  remaining: seconds,
  duration: seconds,
  label,
  kind,
  ...extra
});
const ptFromTemplate = (t, paused = false) => t ? ptTimer(t.seconds, t.label, t.kind, t.side ? {
  side: t.side
} : {}, paused) : null;
const ptRoutineTemplate = (m, kind) => ({
  seconds: ptSideSeconds(m),
  label: kind === 'warmup' ? 'Échauffement' : 'Retour au calme',
  kind,
  ...(m.unilateral ? {
    side: 1
  } : {})
});
const ptRoutineTimer = (m, kind, paused) => ptFromTemplate(ptRoutineTemplate(m, kind), paused);
const ptWorkTemplate = e => e && e.measure === 'seconds' ? {
  seconds: e.seconds,
  label: e.unilateral ? 'Côté gauche' : 'Temps de travail',
  kind: 'work',
  ...(e.unilateral ? {
    side: 1
  } : {})
} : null;
const ptReady = (next, paused = false) => ptTimer(5, 'Prépare-toi', 'ready', {
  next
}, paused);
const ptSwitch = (next, paused = false) => ptTimer(5, 'Change de côté', 'switch', {
  next
}, paused);
function ptRoutineStep(d, delta) {
  const kind = d.cooling ? 'cooldown' : 'warmup',
    list = (kind === 'warmup' ? d.warmupMoves : d.cooldownMoves) || [],
    key = kind === 'warmup' ? 'warmIndex' : 'coolIndex';
  const i = Math.max(0, Math.min(list.length - 1, (d[key] || 0) + delta));
  return list[i] ? {
    ...d,
    [key]: i,
    timer: ptRoutineTimer(list[i], kind, !d.clockStarted),
    stageElapsed: 0,
    stageStarted: d.clockStarted ? Date.now() : null
  } : d;
}
const ptRepsGoal = e => {
  const lo = e.targetMin || e.min,
    hi = e.targetMax || e.max,
    n = lo === hi ? `${hi}` : `${lo}–${hi}`;
  return e.measure === 'shots' ? `${n} tirs` : e.measure === 'contacts' ? `${n} contacts` : `${n} répétitions${e.unilateral ? ' / côté' : ''}`;
};
// À quoi sert l'exercice sur le terrain : son propre texte, sinon la table du lot 19, sinon celui de sa famille de mouvements.
const ptWhy = e => e ? e.transfer || PT.courtWhy?.[e.id] || PT.patternWhy?.[e.pattern] || '' : '';
const ptGoWords = ['C’est parti !', 'Allez, on y va !', 'À toi !', 'Go !'],
  ptPush = ['Tiens bon.', 'Respire, reste gainé.', 'Super, continue.', 'Propre, garde le rythme.', 'Encore un peu, c’est bien.'];
const ptPick = list => list[Math.floor(Math.random() * list.length)];
// Feuille de match : un chiffre qui change monte depuis le bas (motion.css), le texte lu reste la valeur seule.
function PTRoll({
  value
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "roll"
  }, /*#__PURE__*/React.createElement("span", {
    key: value,
    className: "roll-in"
  }, value));
}
// Objectif d'une série en une ligne courte : « 3 × 8–12 », « 3 × 40 s ».
const ptSetLine = e => `${e.sets} × ${e.measure === 'seconds' ? `${e.seconds} s` : ptRepsGoal(e).split(' ')[0]}`;
function PTSession({
  data,
  update,
  go,
  notify
}) {
  const draft = data.draft;
  const [tick, setTick] = usePTState(Date.now()),
    [logging, setLogging] = usePTState(false),
    [error, setError] = usePTState('');
  const [finishing, setFinishing] = usePTState(!!draft?.reviewing),
    [effort, setEffort] = usePTState(''),
    [liked, setLiked] = usePTState(null),
    [notes, setNotes] = usePTState(''),
    [painAfter, setPainAfter] = usePTState(null),
    [skillRatings, setSkillRatings] = usePTState({}),
    [abandon, setAbandon] = usePTState(false),
    [menu, setMenu] = usePTState(false);
  const wake = usePTRef(null),
    fired = usePTRef(new Set()),
    saved = usePTRef(false),
    segmentEnd = usePTRef(null),
    announce = usePTRef(null);
  const voice = data.preferences?.voice !== false,
    say = text => {
      if (voice) ptSay(text);
    };
  const running = !!(draft?.status === 'active' && !finishing && (draft.clockStarted || draft.stageStarted || draft.timer?.endAt || draft.blockTimer?.endAt));
  const anchor = usePTRef(0);
  anchor.current = draft?.timer?.endAt || draft?.blockTimer?.endAt || draft?.stageStarted || draft?.clockStarted || 0;
  // Timestamps remain the source of truth; one render per second, aligned on the active timer's boundaries, and none while paused.
  usePTEffect(() => {
    if (!running) return;
    let id;
    const loop = () => {
      const now = Date.now();
      setTick(now);
      id = setTimeout(loop, ((anchor.current - now) % 1000 + 1000) % 1000 + 15);
    };
    const resume = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(id);
        loop();
      }
    };
    loop();
    document.addEventListener('visibilitychange', resume);
    return () => {
      clearTimeout(id);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [running]);
  // Resume drafts created by the earlier interface without resetting the total clock.
  usePTEffect(() => {
    if (draft?.status === 'active' && draft.clockStarted && !draft.stageStarted && !draft.reviewing) {
      update(s => ({
        ...s,
        draft: {
          ...s.draft,
          stageElapsed: s.draft.stageElapsed || 0,
          stageStarted: Date.now(),
          timer: s.draft.timer || (!s.draft.warmupDone ? {
            id: PT.uid(),
            endAt: Date.now() + s.draft.warmupSeconds * 1000,
            remaining: s.draft.warmupSeconds,
            duration: s.draft.warmupSeconds,
            kind: 'warmup',
            label: 'Échauffement'
          } : null)
        }
      }));
    }
  }, [draft?.id, draft?.clockStarted]);
  usePTEffect(() => {
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState === 'visible' && navigator.wakeLock && !wake.current) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          if (cancelled) lock.release();else {
            wake.current = lock;
            lock.addEventListener('release', () => {
              wake.current = null;
            });
          }
        } catch (e) {}
      }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', acquire);
      wake.current?.release().catch(() => {});
    };
  }, []);
  usePTEffect(() => () => {
    try {
      window.speechSynthesis?.cancel();
    } catch (e) {}
  }, []);
  const remaining = timer => timer ? timer.endAt ? Math.max(0, Math.min(timer.remaining ?? Infinity, Math.ceil((timer.endAt - tick) / 1000))) : timer.remaining : 0;
  const timerLeft = remaining(draft?.timer);
  // Bips de chaque chrono : départ, 3-2-1, fin. Compte à rebours : seulement 3-2-1 ; changement de côté : signal de fin du premier côté.
  // La voix du coach suit les mêmes instants. Chaque signal ne sonne qu'une fois ; rien en pause. Placé avant les retours anticipés.
  usePTEffect(() => {
    const t = draft?.timer;
    if (!t || !t.endAt || finishing || draft.reviewing) return;
    const fire = (key, type) => {
      if (fired.current.has(key)) return false;
      fired.current.add(key);
      if (type) ptCue(type);
      return true;
    };
    const countdown = t.kind === 'ready' || t.kind === 'switch';
    if (timerLeft === 0) {
      if (!countdown) fire(`${t.id}-end`, 'end');
    } else if (timerLeft <= 3 && timerLeft < t.duration) fire(`${t.id}-${timerLeft}`, 'tick');else if (timerLeft >= t.duration - 1) {
      if (fire(`${t.id}-start`, countdown ? t.kind === 'switch' ? 'end' : null : 'start')) announce.current?.('start', t);
    } else if (t.kind === 'work' && t.duration >= 20 && timerLeft === 10) {
      if (fire(`${t.id}-ten`)) say('Plus que 10 secondes.');
    } else if (t.kind === 'work' && t.duration >= 30 && timerLeft === Math.ceil(t.duration / 2)) {
      if (fire(`${t.id}-half`)) say(ptPick(ptPush));
    }
  }, [timerLeft, draft?.timer?.id, draft?.timer?.endAt, finishing]);
  // Fin d'un chrono : on enchaîne seul sur le segment suivant (décision dans segmentEnd, définie plus bas avec l'état courant).
  usePTEffect(() => {
    const t = draft?.timer;
    if (!t || !t.endAt || finishing || draft.reviewing || timerLeft > 0) return;
    const key = `${t.id}-next`;
    if (fired.current.has(key)) return;
    fired.current.add(key);
    const id = setTimeout(() => segmentEnd.current?.(t.id), t.kind === 'ready' || t.kind === 'switch' ? 150 : 900);
    return () => clearTimeout(id);
  }, [timerLeft, draft?.timer?.id, finishing]);
  // Série en répétitions : pas de chrono, on annonce le départ quand l'écran de travail s'affiche.
  const repsKey = draft?.status === 'active' && draft.warmupDone && !draft.cooling && !draft.timer && draft.clockStarted && !draft.reviewing && !finishing ? `${draft.id}-${draft.cursor || 0}-${draft.side || 1}` : null;
  usePTEffect(() => {
    if (!repsKey || fired.current.has(`reps-${repsKey}`)) return;
    fired.current.add(`reps-${repsKey}`);
    announce.current?.('reps');
  }, [repsKey]);
  if (!draft || draft.status !== 'active') return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    title: "Pr\xEAt \xE0 bouger ?"
  }), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('today')
  }, "Revenir \xE0 aujourd\u2019hui"));
  const setDraft = fn => update(s => ({
    ...s,
    draft: s.draft ? fn(s.draft) : null
  }));
  // Écran « Prêt ? » : rien ne tourne avant le tap. Le matériel à sortir, puis un compte à rebours avant le premier mouvement.
  if (draft.ready === false) {
    const first = draft.warmupMoves?.[0];
    const next = first ? ptRoutineTemplate(first, 'warmup') : draft.warmupSeconds > 0 ? {
      seconds: draft.warmupSeconds,
      label: 'Échauffement',
      kind: 'warmup'
    } : null;
    // Sans échauffement, on part directement sur le premier exercice (toujours après le « Prépare-toi »).
    const getReady = () => {
      say(`C’est parti pour ${draft.title}. Prépare-toi.`);
      setDraft(d => ({
        ...d,
        ready: true,
        ...(next ? {} : {
          warmupDone: true,
          blockTimer: d.blockSeconds ? ptTimer(d.blockSeconds, `Bloc ${d.format.toUpperCase()}`, 'block') : null
        }),
        clockStarted: Date.now(),
        stageElapsed: 0,
        stageStarted: Date.now(),
        timer: ptReady(next || ptWorkTemplate(d.exercises[0]))
      }));
      window.scrollTo(0, 0);
    };
    const minutes = Math.ceil(((draft.warmupMoves || []).reduce((n, m) => n + ptMoveSeconds(m), 0) || draft.warmupSeconds || 0) / 60 + PT.estimateSeconds(draft.exercises, draft.format) / 60);
    return /*#__PURE__*/React.createElement("div", {
      className: "live-session live-ready-gate"
    }, /*#__PURE__*/React.createElement("header", {
      className: "live-topbar"
    }, /*#__PURE__*/React.createElement("button", {
      className: "icon-button",
      "aria-label": "Revenir \xE0 l\u2019accueil",
      onClick: () => go('today')
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: "back"
    })), /*#__PURE__*/React.createElement("div", {
      className: "live-position"
    }, /*#__PURE__*/React.createElement("span", {
      className: "eyebrow"
    }, "Avant de commencer"), /*#__PURE__*/React.createElement("strong", null, "Pr\xEAt ?")), /*#__PURE__*/React.createElement("span", {
      className: "live-topbar-spacer"
    })), /*#__PURE__*/React.createElement("div", {
      className: "ready-hero"
    }, /*#__PURE__*/React.createElement("h1", null, draft.title), /*#__PURE__*/React.createElement("div", {
      className: "ready-score"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, minutes), /*#__PURE__*/React.createElement("span", null, "min environ")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, draft.exercises.length), /*#__PURE__*/React.createElement("span", null, "exercices")))), /*#__PURE__*/React.createElement("div", {
      className: "stack-lg"
    }, typeof PTGearList === 'function' && /*#__PURE__*/React.createElement(PTGearList, {
      plan: draft
    }), /*#__PURE__*/React.createElement("div", {
      className: "next-up"
    }, /*#__PURE__*/React.createElement(PTThumbnail, {
      exercise: first || draft.exercises[0]
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "Pour commencer"), /*#__PURE__*/React.createElement("strong", null, (first || draft.exercises[0]).name), /*#__PURE__*/React.createElement("small", null, first ? 'Échauffement guidé' : ptRepsGoal(draft.exercises[0])))), /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, "Le chrono part apr\xE8s 5 secondes de pr\xE9paration. Tu peux mettre en pause \xE0 tout moment.")), /*#__PURE__*/React.createElement("footer", {
      className: "live-dock"
    }, /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      onClick: getReady
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: "play",
      size: 22
    }), "Je suis pr\xEAt")));
  }
  const steps = PT.schedule(draft.exercises, draft.format),
    cursor = Math.min(draft.cursor || 0, Math.max(0, steps.length - 1)),
    step = steps[cursor];
  const exercise = draft.exercises.find(e => e.id === step?.id),
    row = exercise ? draft.entries[exercise.id]?.[step.set] : null;
  const completed = Object.values(draft.entries).flat().filter(r => r.done && !r.pain).length,
    total = Object.values(draft.entries).flat().length;
  const elapsed = Math.max(0, draft.elapsedBase + (draft.clockStarted ? Math.max(0, tick - draft.clockStarted) / 1000 : 0));
  const stageElapsed = Math.max(0, (draft.stageElapsed || 0) + (draft.stageStarted ? Math.max(0, tick - draft.stageStarted) / 1000 : 0));
  const blocked = PT.safety(data).blocked,
    permitted = exercise && PT.allowed(exercise, data, draft.check);
  const phase = !draft.warmupDone ? 'warmup' : draft.cooling ? 'cooldown' : draft.timer?.kind === 'rest' ? 'rest' : 'work';
  const countdown = ['ready', 'switch'].includes(draft.timer?.kind) ? draft.timer.kind : null;
  const moves = phase === 'warmup' ? draft.warmupMoves || [] : phase === 'cooldown' ? draft.cooldownMoves || [] : [];
  const moveIndex = Math.min(phase === 'warmup' ? draft.warmIndex || 0 : draft.coolIndex || 0, Math.max(0, moves.length - 1)),
    move = moves[moveIndex] || null,
    lastMove = moveIndex >= moves.length - 1;
  const guided = !!move;
  const paused = !draft.clockStarted,
    exerciseIndex = draft.exercises.findIndex(e => e.id === exercise?.id);
  const makeTimer = (seconds, label, kind) => ptTimer(seconds, label, kind);
  const freeze = t => t ? {
    ...t,
    remaining: t.endAt ? Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000)) : t.remaining,
    endAt: null
  } : null;
  const thaw = t => t ? {
    ...t,
    endAt: Date.now() + t.remaining * 1000
  } : null;
  const updateRow = r => setDraft(d => ({
    ...d,
    entries: {
      ...d.entries,
      [exercise.id]: d.entries[exercise.id].map((old, i) => i === step.set ? r : old)
    }
  }));
  const repsSides = exercise && exercise.unilateral && ['reps', 'contacts'].includes(exercise.measure);
  const lastSet = exercise && exercise.sets > 1 && step.set + 1 === exercise.sets;
  // Toujours un « Prépare-toi » avant le travail : le chrono ne part jamais par surprise.
  const beginWork = () => {
    if (blocked || !permitted) {
      go('symptoms');
      return;
    }
    setDraft(d => ({
      ...d,
      warmupDone: true,
      side: null,
      clockStarted: d.clockStarted || Date.now(),
      stageElapsed: 0,
      stageStarted: Date.now(),
      timer: ptReady(ptWorkTemplate(exercise)),
      blockTimer: d.blockTimer || (d.blockSeconds ? makeTimer(d.blockSeconds, `Bloc ${d.format.toUpperCase()}`, 'block') : null)
    }));
    window.scrollTo(0, 0);
  };
  const pause = () => {
    if (!paused) try {
      window.speechSynthesis?.cancel();
    } catch (e) {}
    setDraft(d => ({
      ...d,
      elapsedBase: elapsed,
      clockStarted: paused ? Date.now() : null,
      stageElapsed,
      stageStarted: paused ? Date.now() : null,
      timer: paused ? thaw(d.timer) : freeze(d.timer),
      blockTimer: paused ? thaw(d.blockTimer) : freeze(d.blockTimer)
    }));
  };
  const review = () => {
    setLogging(false);
    setError('');
    setMenu(false);
    setDraft(d => ({
      ...d,
      reviewing: true,
      elapsedBase: elapsed,
      clockStarted: null,
      stageElapsed,
      stageStarted: null,
      timer: freeze(d.timer),
      blockTimer: freeze(d.blockTimer)
    }));
    setFinishing(true);
    window.scrollTo(0, 0);
  };
  const reportPain = () => {
    if (row) updateRow({
      ...row,
      pain: true,
      done: false,
      result: 'pain'
    });
    setDraft(d => ({
      ...d,
      elapsedBase: elapsed,
      clockStarted: null,
      stageElapsed,
      stageStarted: null,
      timer: null,
      blockTimer: freeze(d.blockTimer)
    }));
    go('symptoms');
  };
  const openLog = () => {
    setError('');
    // The timer offers a measured value; saving still requires explicit confirmation.
    if (exercise.measure === 'seconds' && !exercise.unilateral && !row.seconds && draft.stageStarted && stageElapsed >= 1) updateRow({
      ...row,
      seconds: String(Math.min(exercise.seconds, Math.floor(stageElapsed)))
    });
    setLogging(true);
  };
  // « Fait » sans charge connue : la série est validée quand même, charge laissée vide (« Ajuster » pour la noter).
  // Une ligne sans charge n'entre jamais dans le calcul des charges suivantes (loadAdvice ne lit que des charges réelles).
  const quickProblem = r => PT.validateRow(exercise.weighted && !r.weight ? {
    ...r,
    weight: '1'
  } : r, exercise);
  const advance = (override, quick = false) => {
    const current = override || row;
    const problem = quick ? quickProblem(current) : PT.validateRow(current, exercise);
    if (problem) {
      if (override) updateRow(override);
      setError(problem);
      setLogging(true);
      return;
    }
    const entries = {
      ...draft.entries,
      [exercise.id]: draft.entries[exercise.id].map((r, i) => i === step.set ? {
        ...current,
        done: true
      } : r)
    };
    // Revisited/edited sets must never hide uncompleted steps earlier in the schedule.
    let next = steps.findIndex((s, i) => i > cursor && !entries[s.id][s.set].done && !entries[s.id][s.set].pain);
    if (next < 0) next = steps.findIndex(s => !entries[s.id][s.set].done && !entries[s.id][s.set].pain);
    const done = next < 0;
    // Dernière série : le retour au calme guidé passe avant le bilan (sauf AMRAP / EMOM, bornés par leur chrono).
    if (done && !['amrap', 'emom'].includes(draft.format) && draft.cooldownMoves?.length && !draft.cooldownDone) {
      setDraft(d => ({
        ...d,
        entries,
        cursor,
        side: null,
        cooling: true,
        coolIndex: 0,
        timer: ptRoutineTimer(d.cooldownMoves[0], 'cooldown', false),
        stageElapsed: 0,
        stageStarted: Date.now(),
        blockTimer: freeze(d.blockTimer)
      }));
      setLogging(false);
      setError('');
      window.scrollTo(0, 0);
      return;
    }
    const rest = draft.format === 'emom' ? Math.max(0, 60 - Math.floor(stageElapsed)) : step.rest > 0 ? step.rest : exercise.rest > 0 ? exercise.rest : 60;
    setDraft(d => ({
      ...d,
      entries,
      side: null,
      cursor: done ? cursor : next,
      timer: done ? null : makeTimer(rest, 'Récupération', 'rest'),
      stageElapsed: 0,
      stageStarted: Date.now(),
      ...(done && !['amrap', 'emom'].includes(draft.format) ? {
        reviewing: true,
        elapsedBase: elapsed,
        clockStarted: null,
        stageStarted: null,
        blockTimer: freeze(d.blockTimer)
      } : {})
    }));
    setLogging(false);
    setError('');
    if (!row.done) {
      try {
        navigator.vibrate?.(40);
      } catch (e) {}
    }
    if (done && !['amrap', 'emom'].includes(draft.format)) {
      setFinishing(true);
      say('Séance terminée. Bien joué !');
    }
    window.scrollTo(0, 0);
  };
  // Série « comme prévu » : bas de la fourchette, charge préremplie, marge laissée vide (aucune hausse de charge n'en est déduite).
  const quickRow = () => {
    const target = String(exercise.targetMin || exercise.min || '');
    if (exercise.measure === 'seconds') return {
      ...row,
      seconds: row.seconds || String(exercise.seconds)
    };
    if (exercise.measure === 'reps' || exercise.measure === 'contacts') return {
      ...row,
      ...(exercise.unilateral ? {
        left: row.left || target,
        right: row.right || target
      } : {
        reps: row.reps || target
      }),
      weight: row.weight || String(PT.loadAdvice(exercise, data, draft.check)?.value ?? ''),
      result: 'passed',
      rir: ''
    };
    return null;
  };
  const finish = () => {
    if (saved.current) return;
    if (!effort) {
      setError('Choisis ton ressenti de 1 à 10.');
      return;
    }
    if (draft.source === 'rehab' && painAfter == null) {
      setError('Indique ta douleur sur la zone, de 0 à 10.');
      return;
    }
    // Les routines guidées ne sont pas gardées en entier dans l'historique : seulement ce qui a été fait.
    const {
      warmupMoves,
      cooldownMoves,
      ...kept
    } = draft;
    const finished = PT.finishDraft({
      ...kept,
      routines: {
        warmup: draft.warmupSkipped ? [] : (warmupMoves || []).map(e => e.id),
        cooldown: draft.cooldownDone && !draft.cooling ? (cooldownMoves || []).map(e => e.id) : []
      }
    }, {
      effort: Number(effort),
      liked,
      notes
    });
    if (finished.error) {
      setError(finished.error);
      return;
    }
    // Soin intégré à une autre séance : la douleur après (facultative) fait aussi progresser son protocole.
    const cares = draft.source === 'rehab' ? [] : [...new Map(draft.exercises.filter(e => e.pathwayRole === 'soin' && e.careProtocol).map(e => [e.careProtocol, e.careLevel || 0])).entries()];
    const session = draft.source === 'rehab' || cares.length && painAfter != null ? {
      ...finished,
      painAfter
    } : finished;
    const RWL = window.RehabWarmup;
    let levelChange = 0,
      skillChanges = [];
    saved.current = true;
    // Une séance du parcours avance le suivi ; une séance libre ne touche jamais au parcours.
    update(s => {
      const next = {
        ...s,
        sessions: s.sessions.some(x => x.id === session.id) ? s.sessions : [...s.sessions, session],
        draft: null
      };
      // Quick Rehab : la douleur après la séance règle le niveau du protocole.
      if (RWL && session.source === 'rehab' && session.protocolId) {
        const r = RWL.record(s.rehab, {
          protocolId: session.protocolId,
          level: session.rehabLevel,
          painAfter: session.painAfter,
          sessionId: session.id,
          date: session.date
        }, s.sessions);
        next.rehab = r.rehab;
        levelChange = r.change;
      }
      if (RWL && cares.length && painAfter != null) {
        let rehab = s.rehab;
        cares.forEach(([protocolId, level]) => {
          const r = RWL.record(rehab, {
            protocolId,
            level,
            painAfter,
            sessionId: session.id,
            date: session.date
          }, s.sessions);
          rehab = r.rehab;
          if (r.change) levelChange = r.change;
        });
        next.rehab = rehab;
      }
      // Une séance du programme muscu avance son suivi ; une séance libre ne touche jamais au programme.
      const PPL = window.PersonalPrograms;
      if (PPL && session.programInstanceId && s.program && s.program.id === session.programInstanceId && s.program.status === 'active') next.program = PPL.markCompleted(s.program, {
        week: session.programWeekIndex,
        day: session.programDay,
        sessionId: session.id,
        date: session.date,
        partial: session.partial
      });
      // Skills basket : tirs notés et ressenti font évoluer les paliers.
      const SKL = window.BasketSkills;
      if (SKL && session.exercises.some(e => e.skillArea)) {
        const r = SKL.record(s.skills, session, skillRatings);
        next.skills = r.skills;
        skillChanges = r.changes;
      }
      const BP = window.BasketPathway;
      if (BP && session.pathwayId && s.pathway && s.pathway.id === session.pathwayId && s.pathway.step === session.pathwayStep) next.pathway = BP.markCompleted(s.pathway, {
        step: session.pathwayStep,
        week: session.pathwayWeek,
        day: session.pathwayDay,
        sessionId: session.id,
        date: session.date,
        partial: session.partial
      });
      return next;
    });
    if (skillChanges.length && window.BasketSkills) setTimeout(() => notify(skillChanges.map(c => `${window.BasketSkills.areas[c.area].short} : palier ${c.dir > 0 ? 'suivant débloqué' : 'précédent, on consolide'}`).join(' · ')), 0);
    if (cares.length && levelChange) setTimeout(() => notify(levelChange > 0 ? 'Soin bien toléré deux fois : il passe au niveau suivant.' : 'Douleur trop forte : le soin redescend d’un niveau.'), 0);
    if (RWL && ['rehab', 'warmup'].includes(session.source)) {
      const level = session.source !== 'rehab' ? '' : levelChange > 0 ? 'Bien toléré deux fois : prochain niveau débloqué. ' : levelChange < 0 ? 'Douleur trop forte : on redescend d’un niveau. ' : '';
      setTimeout(() => notify(`${level}Ta prochaine séance du parcours te proposera de retirer ce temps.`), 0);
    }
    go('history', session.id);
  };
  const addRound = () => {
    setDraft(d => {
      const entries = {
        ...d.entries
      };
      d.exercises.forEach(e => entries[e.id] = [...entries[e.id], PT.newRows({
        ...e,
        sets: 1
      })[0]]);
      const first = d.exercises[0];
      return {
        ...d,
        entries,
        exercises: d.exercises.map(e => ({
          ...e,
          sets: e.sets + 1
        })),
        cursor: steps.length,
        side: null,
        stageElapsed: 0,
        stageStarted: Date.now(),
        timer: ptReady(ptWorkTemplate(first))
      };
    });
    window.scrollTo(0, 0);
  };
  // Fin de séance : l'écran se remplit de citron, le titre déborde du cadre, puis le bilan sur fond charbon.
  if (finishing) return /*#__PURE__*/React.createElement("div", {
    className: "live-review"
  }, /*#__PURE__*/React.createElement("section", {
    className: "finish-flood"
  }, /*#__PURE__*/React.createElement("button", {
    className: "back-link",
    onClick: () => {
      setFinishing(false);
      setDraft(d => ({
        ...d,
        reviewing: false
      }));
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 18
  }), "Retour"), /*#__PURE__*/React.createElement("h1", {
    className: "finish-title"
  }, /*#__PURE__*/React.createElement("span", null, "Bien"), " ", /*#__PURE__*/React.createElement("span", null, "jou\xE9.")), /*#__PURE__*/React.createElement("p", {
    className: "finish-sub"
  }, "S\xE9ance termin\xE9e \xB7 ", draft.title), /*#__PURE__*/React.createElement("div", {
    className: "finish-score"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, completed), /*#__PURE__*/React.createElement("small", null, "s\xE9ries valid\xE9es")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, timeLabel(elapsed)), /*#__PURE__*/React.createElement("small", null, "temps r\xE9el")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, completed < total ? 'Partiel' : 'Fait'), /*#__PURE__*/React.createElement("small", null, "\xE0 ton rythme")))), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg finish-form"
  }, /*#__PURE__*/React.createElement("section", {
    className: "effort-picker stack"
  }, /*#__PURE__*/React.createElement("h2", null, "C\u2019\xE9tait comment ?"), /*#__PURE__*/React.createElement("div", {
    className: "effort-scale",
    role: "group",
    "aria-label": "Effort global de 1 \xE0 10"
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    "aria-label": `Effort ${n} sur 10`,
    "aria-pressed": Number(effort) === n,
    onClick: () => setEffort(String(n))
  }, n))), /*#__PURE__*/React.createElement("div", {
    className: "topline caption"
  }, /*#__PURE__*/React.createElement("span", null, "Tr\xE8s facile"), /*#__PURE__*/React.createElement("span", null, "Maximal")), effort && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, Number(effort) >= 8 ? 'Bien reçu. Les prochaines propositions seront allégées.' : 'Bien reçu. Ce ressenti accompagnera tes résultats.')), draft.source === 'rehab' && typeof PTRehabPainAfter === 'function' && /*#__PURE__*/React.createElement(PTRehabPainAfter, {
    value: painAfter,
    onChange: setPainAfter
  }), draft.source !== 'rehab' && draft.exercises.some(e => e.pathwayRole === 'soin') && typeof PTRehabPainAfter === 'function' && /*#__PURE__*/React.createElement(PTRehabPainAfter, {
    value: painAfter,
    onChange: setPainAfter
  }), typeof PTSkillsRating === 'function' && /*#__PURE__*/React.createElement(PTSkillsRating, {
    draft: draft,
    value: skillRatings,
    onChange: setSkillRatings
  }), /*#__PURE__*/React.createElement(PTChoices, {
    value: liked,
    onChange: setLiked,
    options: [{
      value: true,
      label: 'À refaire',
      icon: 'heart'
    }, {
      value: false,
      label: 'Autre chose',
      icon: 'shuffle'
    }]
  }), ['amrap', 'emom'].includes(draft.format) && /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: draft.format === 'amrap' ? 'Tours réalisés' : 'Minutes de travail validées',
    type: "number",
    min: "0",
    value: draft.rounds || '',
    onChange: e => setDraft(d => ({
      ...d,
      rounds: e.target.value
    }))
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Reps suppl\xE9mentaires",
    type: "number",
    min: "0",
    value: draft.extraReps || '',
    onChange: e => setDraft(d => ({
      ...d,
      extraReps: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Ajouter une note"), /*#__PURE__*/React.createElement(PTField, {
    label: "Pour la prochaine fois"
  }, /*#__PURE__*/React.createElement("textarea", {
    maxLength: "1000",
    value: notes,
    onChange: e => setNotes(e.target.value)
  }))), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: finish
  }, "Enregistrer ma s\xE9ance", /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 20
  }))));
  const allDone = completed === total;
  // Retour au calme : lancé à la fin (dernière série ou « Terminer la séance »), passable à tout moment.
  const startCooldown = () => {
    if (!draft.cooldownMoves?.length || draft.cooldownDone) return false;
    setDraft(d => ({
      ...d,
      cooling: true,
      coolIndex: 0,
      timer: ptRoutineTimer(d.cooldownMoves[0], 'cooldown', !d.clockStarted),
      stageElapsed: 0,
      stageStarted: d.clockStarted ? Date.now() : null
    }));
    window.scrollTo(0, 0);
    return true;
  };
  const endCooldown = () => {
    setDraft(d => ({
      ...d,
      cooling: false,
      cooldownDone: true
    }));
    review();
  };
  const stepMove = delta => {
    setDraft(d => ptRoutineStep(d, delta));
    window.scrollTo(0, 0);
  };
  // Un exercice chronométré repart avec un « Prépare-toi » (gelé si la séance est en pause).
  const jump = index => {
    setError('');
    setLogging(false);
    setMenu(false);
    const e = draft.exercises.find(x => x.id === steps[index]?.id);
    setDraft(d => ({
      ...d,
      cursor: index,
      side: null,
      timer: e && e.measure === 'seconds' ? ptReady(ptWorkTemplate(e), paused) : null,
      stageElapsed: 0,
      stageStarted: paused ? null : Date.now()
    }));
    window.scrollTo(0, 0);
  };
  // Unilatéral en répétitions : le premier « Fait » vaut pour le côté gauche, puis 5 s pour changer de côté.
  const toSecondSide = () => {
    setDraft(d => ({
      ...d,
      timer: ptSwitch(null),
      stageStarted: Date.now()
    }));
  };
  const nextIndex = steps.findIndex((s, i) => i > cursor && !draft.entries[s.id][s.set].done && !draft.entries[s.id][s.set].pain);
  // « Fait » (bouton du bas ou flèche droite) : valide la série « comme prévu » sans aucune question.
  // Chrono interrompu avant la fin : le temps réellement tenu est gardé. Tirs à compter : la feuille de saisie s'ouvre.
  const validateNext = () => {
    if (blocked || !permitted) {
      go('symptoms');
      return;
    }
    if (row.done) {
      if (nextIndex >= 0) jump(nextIndex);else if (allDone) {
        if (!startCooldown()) review();
      }
      return;
    }
    if (draft.timer?.kind === 'work' && draft.timer.side === 1) {
      fired.current.add(`${draft.timer.id}-next`);
      segmentEnd.current?.(draft.timer.id);
      return;
    }
    if (repsSides && draft.side !== 2) {
      toSecondSide();
      return;
    }
    const quick = quickRow();
    const activeWork = draft.timer?.kind === 'work' ? draft.timer : null;
    const cut = exercise.measure === 'seconds' && !row.seconds && activeWork && remaining(activeWork) > 0 && stageElapsed >= 1;
    const candidate = quick && cut ? {
      ...quick,
      seconds: String(Math.min(exercise.seconds, Math.floor(stageElapsed)))
    } : quick;
    if (!candidate || quickProblem(candidate)) {
      openLog();
      return;
    }
    advance(candidate, true);
  };
  // Fin d'un chrono : quoi faire ensuite. Toujours relu avec l'état du moment (la ref est remplacée à chaque rendu).
  segmentEnd.current = id => {
    const t = draft.timer;
    if (!t || t.id !== id) return;
    if (t.kind === 'ready') {
      setDraft(d => d.timer?.id === id ? {
        ...d,
        timer: ptFromTemplate(t.next),
        stageElapsed: 0,
        stageStarted: Date.now()
      } : d);
      if (!t.next) ptCue('start');
      return;
    }
    if (t.kind === 'switch') {
      setDraft(d => d.timer?.id === id ? {
        ...d,
        side: 2,
        timer: ptFromTemplate(t.next),
        stageElapsed: 0,
        stageStarted: Date.now()
      } : d);
      if (!t.next) {
        ptCue('start');
      }
      return;
    }
    if (t.side === 1 && ['warmup', 'cooldown', 'work'].includes(t.kind)) {
      setDraft(d => d.timer?.id === id ? {
        ...d,
        timer: ptSwitch({
          seconds: t.duration,
          label: t.kind === 'work' ? 'Côté droit' : t.label,
          kind: t.kind,
          side: 2
        })
      } : d);
      return;
    }
    if (t.kind === 'warmup') {
      if (guided && !lastMove) stepMove(1);else if (!blocked && permitted) beginWork();
      return;
    }
    if (t.kind === 'cooldown') {
      if (!lastMove) stepMove(1);else endCooldown();
      return;
    }
    if (t.kind === 'work') {
      if (!blocked && permitted && !row.done) {
        const quick = quickRow();
        if (quick && !quickProblem(quick)) advance(quick, true);
      }
      return;
    }
    if (t.kind === 'rest' && !blocked && permitted) beginWork();
  };
  // La voix du coach : ce qui arrive, en une phrase. Les noms viennent de l'état du moment.
  announce.current = (what, t) => {
    if (what === 'reps') {
      if (allDone || row?.done) return;
      say(`${draft.side === 2 ? 'Côté droit. ' : ''}${ptPick(ptGoWords)} ${ptRepsGoal(exercise).replace(' / côté', '')}.${lastSet && draft.side !== 2 ? ' Dernière série.' : ''}`);
      return;
    }
    if (!t) return;
    if (t.kind === 'ready') {
      const n = t.next;
      const target = phase === 'warmup' && n?.kind === 'warmup' ? move || draft.warmupMoves?.[0] : exercise;
      say(`Prépare-toi. ${target?.name || 'Échauffement'}${n?.side === 1 ? ', côté gauche' : ''}.${phase !== 'warmup' && lastSet ? ' Dernière série.' : ''}`);
      return;
    }
    if (t.kind === 'switch') {
      say('Change de côté.');
      return;
    }
    if (t.kind === 'work') {
      say(t.side === 2 ? 'Côté droit. Go !' : ptPick(ptGoWords));
      return;
    }
    if (t.kind === 'rest') {
      const nx = exercise;
      say(`Repos, ${t.duration} secondes. Ensuite : ${nx?.name || 'la suite'}.`);
      return;
    }
    if (['warmup', 'cooldown'].includes(t.kind) && move) {
      say(t.side === 2 ? 'Côté droit.' : `${move.name}${t.side === 1 ? ', côté gauche' : ''}.`);
    }
  };
  const activeTimer = phase === 'warmup' || phase === 'rest' || phase === 'cooldown' || countdown ? draft.timer : draft.format === 'amrap' ? draft.blockTimer : draft.timer;
  const shownTime = activeTimer ? remaining(activeTimer) : phase === 'warmup' ? draft.warmupSeconds : stageElapsed;
  const sideLabel = countdown === 'switch' ? null : draft.timer?.side === 2 || repsSides && draft.side === 2 ? 'Côté droit' : draft.timer?.side === 1 || repsSides && phase === 'work' && !row.done ? 'Côté gauche' : null;
  const why = phase === 'work' ? ptWhy(exercise) : '';
  const coach = paused ? 'En pause. Reprends quand tu es prêt.' : countdown === 'ready' ? 'Mets-toi en place.' : countdown === 'switch' ? 'Change de côté, même consigne.' : guided ? move.instructions[0] : phase === 'warmup' ? 'Des gestes faciles. On se met en mouvement.' : phase === 'rest' ? timerLeft === 0 ? 'C’est reparti.' : 'Souffle. Relâche les épaules.' : allDone ? 'Toutes les séries sont validées.' : exercise.instructions[0];
  const mainAction = () => {
    if (paused) {
      pause();
      return;
    }
    if (countdown) {
      fired.current.add(`${draft.timer.id}-next`);
      segmentEnd.current(draft.timer.id);
      return;
    }
    if (phase === 'cooldown') {
      if (lastMove) endCooldown();else stepMove(1);
      return;
    }
    if (blocked || !permitted) {
      go('symptoms');
      return;
    }
    if (phase === 'warmup' && guided && !lastMove) {
      stepMove(1);
      return;
    }
    if (phase === 'warmup' || phase === 'rest') {
      beginWork();
      return;
    }
    if (allDone) {
      if (!startCooldown()) review();
      return;
    }
    validateNext();
  };
  const actionLabel = paused ? 'Reprendre la séance' : countdown ? 'C’est parti' : phase === 'cooldown' ? lastMove ? 'Terminer la séance' : 'Étirement suivant' : blocked || !permitted ? 'Voir mes douleurs' : phase === 'warmup' ? guided && !lastMove ? 'Mouvement suivant' : 'Échauffement effectué' : phase === 'rest' ? timerLeft > 0 ? 'Passer le repos' : 'Commencer la série' : allDone ? 'Terminer la séance' : repsSides && draft.side !== 2 && !row.done ? 'Fait · côté gauche' : 'Fait';
  const upcoming = guided && !lastMove ? {
    exercise: moves[moveIndex + 1],
    label: phase === 'warmup' ? 'Mouvement suivant' : 'Étirement suivant'
  } : phase === 'warmup' ? {
    step,
    exercise
  } : null;
  const adjustRest = delta => setDraft(d => {
    const t = d.timer;
    if (!t || t.kind !== 'rest') return d;
    const left = Math.max(5, (t.endAt ? Math.ceil((t.endAt - Date.now()) / 1000) : t.remaining) + delta);
    return {
      ...d,
      timer: {
        ...t,
        duration: Math.max(t.duration, left),
        remaining: left,
        endAt: t.endAt ? Date.now() + left * 1000 : null
      }
    };
  });
  // Position : exercice n sur N, série a sur b, et une barre par exercice découpée en séries.
  const exerciseSets = draft.exercises.map(e => ({
    e,
    rows: draft.entries[e.id] || []
  }));
  const restNext = phase === 'rest' ? {
    exercise,
    step
  } : null;
  const timerName = countdown ? draft.timer.label : phase === 'rest' ? 'Repos' : phase === 'warmup' ? 'Échauffement' : phase === 'cooldown' ? 'Retour au calme' : 'Travail';
  // Mini-lecteur du dock : la série qui suit, pendant le travail seulement (le repos l'affiche déjà en grand).
  const nextStep = nextIndex >= 0 ? steps[nextIndex] : null,
    nextExercise = nextStep && draft.exercises.find(e => e.id === nextStep.id);
  const dockNext = phase === 'work' && !countdown && nextExercise ? {
    exercise: nextExercise,
    meta: `Série ${nextStep.set + 1}/${nextExercise.sets}`
  } : null;
  const toggleVoice = () => {
    const on = !voice;
    update(s => ({
      ...s,
      preferences: {
        ...s.preferences,
        voice: on
      }
    }));
    if (on) ptSay('Coach activé.');else try {
      window.speechSynthesis?.cancel();
    } catch (e) {}
  };
  return /*#__PURE__*/React.createElement("div", {
    className: `live-session phase-${phase}${countdown ? ` is-${countdown}` : ''}`
  }, /*#__PURE__*/React.createElement("header", {
    className: "live-topbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Revenir \xE0 l\u2019accueil",
    onClick: () => go('today')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back"
  })), /*#__PURE__*/React.createElement("div", {
    className: "live-position"
  }, phase === 'warmup' || phase === 'cooldown' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: `live-dot${paused ? ' paused' : ''}`
  }), phase === 'warmup' ? 'Avant de commencer' : 'Après l’effort'), /*#__PURE__*/React.createElement("strong", null, phase === 'warmup' ? 'Échauffement' : 'Retour au calme', guided ? ` · ${moveIndex + 1} sur ${moves.length}` : '')) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: `live-dot${paused ? ' paused' : ''}`
  }), "Exercice ", exerciseIndex + 1, " sur ", draft.exercises.length), /*#__PURE__*/React.createElement("strong", null, "S\xE9rie ", /*#__PURE__*/React.createElement(PTRoll, {
    value: step.set + 1
  }), " sur ", exercise.sets))), /*#__PURE__*/React.createElement("div", {
    className: "live-topbar-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": voice ? 'Couper la voix du coach' : 'Activer la voix du coach',
    "aria-pressed": voice,
    onClick: toggleVoice
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: voice ? 'sound' : 'mute',
    size: 20
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Options de s\xE9ance",
    "aria-expanded": menu,
    onClick: () => {
      setMenu(!menu);
      setAbandon(false);
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "more",
    size: 20
  })))), menu && /*#__PURE__*/React.createElement("div", {
    className: "live-menu stack-sm",
    role: "group",
    "aria-label": "Options de s\xE9ance"
  }, abandon ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm live-cancel-confirm",
    role: "alert"
  }, /*#__PURE__*/React.createElement("p", null, "Annuler la s\xE9ance sans enregistrer ? Les s\xE9ries faites seront perdues."), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => {
      update(s => ({
        ...s,
        draft: null
      }));
      go('today');
    }
  }, "Oui, annuler sans enregistrer"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setAbandon(false)
  }, "Garder ma s\xE9ance")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: review
  }, "Terminer ici"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => {
      setMenu(false);
      setDraft(d => {
        const entries = {};
        const exercises = d.exercises.map(e => {
          const rows = d.entries[e.id],
            done = rows.filter(r => r.done),
            pending = rows.find(r => !r.done && !r.pain);
          entries[e.id] = pending ? [...done, pending] : done;
          return {
            ...e,
            sets: entries[e.id].length
          };
        }).filter(e => e.sets);
        if (!exercises.length) return d;
        const sequence = PT.schedule(exercises, d.format),
          next = sequence.findIndex(s => !entries[s.id][s.set].done);
        return {
          ...d,
          entries,
          exercises,
          cursor: Math.max(0, next),
          timer: null,
          side: null,
          stageElapsed: 0,
          stageStarted: paused ? null : Date.now(),
          shortened: true
        };
      });
      notify('Une série restante par exercice. Tes résultats sont conservés.');
    }
  }, "Raccourcir la fin \xB7 10 min"), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Voir les s\xE9ries / corriger un r\xE9sultat"), /*#__PURE__*/React.createElement("div", {
    className: "set-history"
  }, steps.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: `${s.id}-${s.set}`,
    className: `${draft.entries[s.id][s.set].done ? 'done ' : ''}${i === cursor ? 'current' : ''}`,
    "aria-label": `${draft.exercises.find(e => e.id === s.id).name}, série ${s.set + 1}`,
    onClick: () => jump(i)
  }, i + 1, draft.entries[s.id][s.set].done ? ' ✓' : '')))), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => setAbandon(true)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "close",
    size: 18
  }), "Annuler la s\xE9ance"))), /*#__PURE__*/React.createElement("div", {
    className: "live-progress",
    "aria-label": `${completed} séries validées sur ${total}`
  }, exerciseSets.map(({
    e,
    rows
  }, i) => /*#__PURE__*/React.createElement("span", {
    key: e.id,
    className: `ex-seg${phase !== 'warmup' && i === exerciseIndex ? ' current' : ''}`
  }, rows.map((r, k) => /*#__PURE__*/React.createElement("i", {
    key: k,
    className: r.done ? 'done' : phase !== 'warmup' && i === exerciseIndex && k === step.set ? 'now' : ''
  }))))), phase === 'rest' ? /*#__PURE__*/React.createElement("section", {
    className: "rest-screen",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: `live-timer rest-timer score${paused ? ' paused' : ''}`,
    role: "timer",
    "aria-label": `Repos : ${timeLabel(timerLeft)}`
  }, /*#__PURE__*/React.createElement("strong", null, timeLabel(timerLeft)), /*#__PURE__*/React.createElement("small", null, timerLeft > 0 ? 'Repos' : 'Repos terminé', " \xB7 ", paused ? 'en pause' : timerLeft > 0 ? 'souffle, relâche les épaules' : 'c’est reparti'), /*#__PURE__*/React.createElement("i", {
    className: "score-bar",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      transform: `scaleX(${Math.min(1, timerLeft / (draft.timer.duration || 1))})`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "rest-adjust"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => adjustRest(-15),
    disabled: paused || timerLeft <= 5
  }, "\u221215 s"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "transport-pause",
    "aria-label": paused ? 'Reprendre le chrono' : 'Mettre en pause',
    onClick: pause
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: paused ? 'play' : 'pause',
    size: 22
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => adjustRest(15),
    disabled: paused
  }, "+15 s")), /*#__PURE__*/React.createElement("div", {
    className: "next-up rest-next"
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: restNext.exercise
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "Ensuite \xB7 exercice ", exerciseIndex + 1, " sur ", draft.exercises.length), /*#__PURE__*/React.createElement("strong", null, restNext.exercise.name), /*#__PURE__*/React.createElement("small", null, "S\xE9rie ", restNext.step.set + 1, " sur ", restNext.exercise.sets, lastSet ? ' · dernière' : ''), ptWhy(restNext.exercise) && /*#__PURE__*/React.createElement("small", {
    className: "rest-why"
  }, ptWhy(restNext.exercise))))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "live-command"
  }, /*#__PURE__*/React.createElement("div", {
    className: "score-board"
  }, countdown ? /*#__PURE__*/React.createElement("div", {
    className: `live-countdown score${paused ? ' paused' : ''}`,
    role: "timer",
    "aria-label": `${timerName} : ${timeLabel(shownTime)}`
  }, /*#__PURE__*/React.createElement("strong", null, /*#__PURE__*/React.createElement(PTRoll, {
    value: Math.max(0, shownTime)
  })), /*#__PURE__*/React.createElement("small", null, countdown === 'switch' ? 'Change de côté' : 'Prépare-toi')) : phase === 'work' && !activeTimer && exercise.measure !== 'seconds' ? /*#__PURE__*/React.createElement("div", {
    className: "live-target score",
    "aria-label": `Objectif : ${ptRepsGoal(exercise)}`
  }, /*#__PURE__*/React.createElement("strong", null, ptRepsGoal(exercise).split(' ')[0]), /*#__PURE__*/React.createElement("span", null, ptRepsGoal(exercise).split(' ').slice(1).join(' ').replace(' / côté', repsSides ? ' de ce côté' : ''))) : /*#__PURE__*/React.createElement("div", {
    className: `live-timer score${paused ? ' paused' : ''}`,
    role: "timer",
    "aria-label": `${timerName} : ${timeLabel(shownTime)}`
  }, /*#__PURE__*/React.createElement("strong", null, timeLabel(shownTime)), /*#__PURE__*/React.createElement("small", null, paused ? 'En pause' : activeTimer ? 'Temps restant' : 'Temps de série'), activeTimer && /*#__PURE__*/React.createElement("i", {
    className: "score-bar",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      transform: `scaleX(${Math.min(1, shownTime / (activeTimer.duration || 1))})`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "session-transport"
  }, guided && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": phase === 'warmup' ? 'Mouvement précédent' : 'Étirement précédent',
    disabled: moveIndex === 0,
    onClick: () => stepMove(-1)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 20
  })), !guided && phase !== 'warmup' && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "S\xE9rie pr\xE9c\xE9dente",
    disabled: cursor === 0,
    onClick: () => jump(cursor - 1)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 20
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "transport-pause",
    "aria-label": paused ? 'Reprendre le chrono' : 'Mettre en pause',
    onClick: pause
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: paused ? 'play' : 'pause',
    size: 24
  })), guided && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "transport-validate",
    "aria-label": lastMove ? phase === 'warmup' ? 'Commencer la séance' : 'Terminer la séance' : phase === 'warmup' ? 'Mouvement suivant' : 'Étirement suivant',
    disabled: paused,
    onClick: mainAction
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 20
  })), !guided && phase !== 'warmup' && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "transport-validate",
    "aria-label": row.done ? 'Série suivante' : 'Valider la série et passer à la suite',
    disabled: paused || row.done && nextIndex < 0 && !allDone,
    onClick: () => {
      if (countdown) {
        mainAction();
        return;
      }
      validateNext();
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 20
  })))), /*#__PURE__*/React.createElement("div", {
    className: "live-heading"
  }, sideLabel && /*#__PURE__*/React.createElement("span", {
    className: "side-badge"
  }, sideLabel), /*#__PURE__*/React.createElement("h1", null, guided ? move.name : phase === 'warmup' ? 'On y va doucement.' : exercise.name), why && /*#__PURE__*/React.createElement("p", {
    className: "live-why"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "basket",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, why)))), /*#__PURE__*/React.createElement("div", {
    className: "live-visual"
  }, guided ? /*#__PURE__*/React.createElement(PTDemo, {
    minimal: true,
    key: `${phase}-${move.id}`,
    exercise: move
  }) : phase === 'warmup' ? /*#__PURE__*/React.createElement("div", {
    className: "warmup-visual"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "body",
    size: 80
  }), /*#__PURE__*/React.createElement("span", null, "On r\xE9veille le corps.")) : /*#__PURE__*/React.createElement(PTDemo, {
    minimal: true,
    key: exercise.id,
    exercise: exercise
  })), /*#__PURE__*/React.createElement("div", {
    className: "live-cues"
  }, /*#__PURE__*/React.createElement("p", {
    className: "live-coach",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "spark",
    size: 17
  }), coach), phase !== 'cooldown' && (blocked || !permitted) ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning"
  }, blocked ? 'Séance suspendue : fais le point sur la douleur signalée.' : 'Ce mouvement ne convient plus à tes contraintes actuelles.') : null, phase === 'work' && exercise.audio && /*#__PURE__*/React.createElement(PTAudioCue, null), draft.blockTimer && draft.format !== 'amrap' && /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "Bloc ", draft.format.toUpperCase(), " \xB7 ", timeLabel(remaining(draft.blockTimer))))), (phase === 'work' || phase === 'rest') && /*#__PURE__*/React.createElement("section", {
    className: "session-list",
    "aria-label": "Ta s\xE9ance"
  }, /*#__PURE__*/React.createElement("h2", null, "Ta s\xE9ance"), /*#__PURE__*/React.createElement("ol", null, exerciseSets.map(({
    e,
    rows
  }, i) => {
    const done = rows.length > 0 && rows.every(r => r.done || r.pain),
      current = i === exerciseIndex && !done;
    return /*#__PURE__*/React.createElement("li", {
      key: e.id,
      className: current ? 'is-current' : done ? 'is-done' : '',
      "aria-current": current ? 'step' : undefined
    }, /*#__PURE__*/React.createElement("span", {
      className: "session-list-n"
    }, i + 1), /*#__PURE__*/React.createElement("span", {
      className: "session-list-name"
    }, /*#__PURE__*/React.createElement("strong", null, e.name), /*#__PURE__*/React.createElement("small", null, current ? `Série ${step.set + 1} sur ${e.sets}` : ptSetLine(e))), done ? /*#__PURE__*/React.createElement(PTIcon, {
      name: "check",
      size: 20
    }) : /*#__PURE__*/React.createElement("span", {
      className: "session-list-sets"
    }, rows.filter(r => r.done).length, "/", rows.length));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "live-extras"
  }, upcoming && /*#__PURE__*/React.createElement("div", {
    className: "next-up"
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: upcoming.exercise
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, upcoming.label || 'Pour commencer'), /*#__PURE__*/React.createElement("strong", null, upcoming.exercise.name), upcoming.step ? /*#__PURE__*/React.createElement("small", null, "S\xE9rie ", upcoming.step.set + 1, " / ", upcoming.exercise.sets) : /*#__PURE__*/React.createElement("small", null, upcoming.exercise.unilateral ? `${ptSideSeconds(upcoming.exercise)} s par côté` : `${ptMoveSeconds(upcoming.exercise)} s`))), guided && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Comment faire"), /*#__PURE__*/React.createElement("ol", {
    className: "instruction-list"
  }, move.instructions.map((line, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, line))), move.warning && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, move.warning)), phase === 'warmup' && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => {
      setDraft(d => ({
        ...d,
        warmupSkipped: true
      }));
      beginWork();
    }
  }, guided ? 'Passer l’échauffement (déjà fait)' : 'Je l’ai déjà fait avant d’ouvrir l’app'), phase === 'cooldown' && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: endCooldown
  }, "Passer le retour au calme"), phase === 'work' && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Comment faire"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("ol", {
    className: "instruction-list"
  }, exercise.instructions.map((line, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, line))), /*#__PURE__*/React.createElement(PTExerciseMetrics, {
    exercise: exercise,
    weight: row.weight || PT.loadAdvice(exercise, data, draft.check)?.value
  }), exercise.sideNote && /*#__PURE__*/React.createElement("p", {
    className: "notice side-note"
  }, /*#__PURE__*/React.createElement("strong", null, exercise.weakSide ? 'Jambe faible' : 'Équilibre gauche / droite', " \xB7 "), exercise.sideNote), exercise.warning && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, exercise.warning), PT.loadAdvice(exercise, data, draft.check) && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, PT.loadAdvice(exercise, data, draft.check).text))), allDone && ['amrap', 'emom'].includes(draft.format) && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    disabled: paused || blocked,
    onClick: addRound
  }, "Ajouter un tour", /*#__PURE__*/React.createElement(PTIcon, {
    name: "plus",
    size: 18
  })), !blocked && !permitted && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => {
      const next = steps.findIndex((s, i) => i > cursor && PT.allowed(draft.exercises.find(e => e.id === s.id), data, draft.check));
      if (next < 0) review();else setDraft(d => ({
        ...d,
        cursor: next,
        timer: null,
        side: null,
        stageElapsed: 0,
        stageStarted: null
      }));
    }
  }, "Passer \xE0 un mouvement compatible")), /*#__PURE__*/React.createElement("footer", {
    className: "live-dock"
  }, dockNext && /*#__PURE__*/React.createElement("div", {
    className: "dock-next"
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: dockNext.exercise
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "Ensuite"), /*#__PURE__*/React.createElement("strong", null, dockNext.exercise.name)), /*#__PURE__*/React.createElement("em", null, dockNext.meta)), /*#__PURE__*/React.createElement("i", {
    className: "dock-progress",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      transform: `scaleX(${total ? completed / total : 0})`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "dock-caption"
  }, phase === 'work' && !countdown && !row.done && !allDone ? /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: openLog
  }, "Ajuster la s\xE9rie") : /*#__PURE__*/React.createElement("span", null, phase === 'rest' ? 'Repos en cours' : phase === 'warmup' ? 'Prépare-toi' : phase === 'cooldown' ? 'Retour au calme' : `${completed}/${total} séries validées`), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: reportPain
  }, "Une douleur ?")), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: mainAction
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: paused ? 'play' : phase === 'work' && !countdown ? 'check' : 'arrow',
    size: 22
  }), actionLabel)), logging && /*#__PURE__*/React.createElement(PTSetSheet, {
    exercise: exercise,
    row: row,
    onChange: updateRow,
    onClose: () => setLogging(false),
    onSave: () => advance(),
    onQuick: quickRow() && !row.done ? () => advance(quickRow(), true) : null,
    error: error
  }));
}