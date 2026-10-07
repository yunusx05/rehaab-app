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
    [abandon, setAbandon] = usePTState(false);
  const wake = usePTRef(null),
    fired = usePTRef(null),
    saved = usePTRef(false);
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
  const remaining = timer => timer ? timer.endAt ? Math.max(0, Math.min(timer.remaining ?? Infinity, Math.ceil((timer.endAt - tick) / 1000))) : timer.remaining : 0;
  const timerLeft = remaining(draft?.timer);
  const [voice, setVoice] = usePTState(() => {
    try {
      return localStorage.getItem('rh_voice') === '1';
    } catch (e) {
      return false;
    }
  });
  const spoken = usePTRef('');
  // Une annonce par étape (clé phase + série + minuteur). Placé avant les retours anticipés : l'ordre des hooks ne change jamais.
  usePTEffect(() => {
    if (!voice || !draft || draft.status !== 'active' || !draft.clockStarted || draft.reviewing || finishing || !draft.warmupDone) return;
    const ph = draft.timer?.kind === 'rest' ? 'rest' : 'work',
      st = PT.schedule(draft.exercises, draft.format),
      c = Math.min(draft.cursor || 0, st.length - 1),
      s = st[c];
    const ex = s && draft.exercises.find(e => e.id === s.id);
    if (!ex) return;
    const key = `${ph}-${c}-${draft.timer?.id || ''}`;
    if (spoken.current === key) return;
    spoken.current = key;
    // Pendant le repos, le curseur pointe déjà sur la série suivante.
    ptSay(ph === 'rest' ? `Repos ${draft.timer.duration} secondes. Prochain : ${ex.name}.` : `${ex.name}. Série ${s.set + 1} sur ${ex.sets}.`);
  }, [voice, draft?.warmupDone, draft?.timer?.id, draft?.cursor, draft?.clockStarted, finishing]);
  usePTEffect(() => {
    if (draft?.timer?.endAt && timerLeft === 0 && fired.current !== draft.timer.id) {
      fired.current = draft.timer.id;
      ptBeep();
      if (voice) ptSay('Repos terminé.');
    }
  }, [timerLeft, draft?.timer?.id]);
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
  const phase = !draft.warmupDone ? 'warmup' : draft.timer?.kind === 'rest' ? 'rest' : 'work';
  const paused = !draft.clockStarted,
    exerciseIndex = draft.exercises.findIndex(e => e.id === exercise?.id);
  const makeTimer = (seconds, label, kind) => ({
    id: PT.uid(),
    endAt: Date.now() + seconds * 1000,
    remaining: seconds,
    duration: seconds,
    label,
    kind
  });
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
  const beginWork = () => {
    if (blocked || !permitted) {
      go('symptoms');
      return;
    }
    setDraft(d => ({
      ...d,
      warmupDone: true,
      clockStarted: d.clockStarted || Date.now(),
      stageElapsed: 0,
      stageStarted: Date.now(),
      timer: exercise.measure === 'seconds' ? makeTimer(exercise.seconds, 'Temps de travail', 'work') : null,
      blockTimer: d.blockTimer || (d.blockSeconds ? makeTimer(d.blockSeconds, `Bloc ${d.format.toUpperCase()}`, 'block') : null)
    }));
    window.scrollTo(0, 0);
  };
  const pause = () => setDraft(d => ({
    ...d,
    elapsedBase: elapsed,
    clockStarted: paused ? Date.now() : null,
    stageElapsed,
    stageStarted: paused ? Date.now() : null,
    timer: paused ? thaw(d.timer) : freeze(d.timer),
    blockTimer: paused ? thaw(d.blockTimer) : freeze(d.blockTimer)
  }));
  const review = () => {
    setLogging(false);
    setError('');
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
  const advance = override => {
    const current = override || row;
    const problem = PT.validateRow(current, exercise);
    if (problem) {
      if (override) updateRow(override);
      setError(problem);
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
    const rest = draft.format === 'emom' ? Math.max(0, 60 - Math.floor(stageElapsed)) : step.rest;
    setDraft(d => ({
      ...d,
      entries,
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
    if (done && !['amrap', 'emom'].includes(draft.format)) setFinishing(true);
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
    const finished = PT.finishDraft(draft, {
      effort: Number(effort),
      liked,
      notes
    });
    if (finished.error) {
      setError(finished.error);
      return;
    }
    const session = draft.source === 'rehab' ? {
      ...finished,
      painAfter
    } : finished;
    const RWL = window.RehabWarmup;
    let levelChange = 0;
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
        stageElapsed: 0,
        stageStarted: Date.now(),
        timer: first.measure === 'seconds' ? makeTimer(first.seconds, 'Temps de travail', 'work') : null
      };
    });
    window.scrollTo(0, 0);
  };
  if (finishing) return /*#__PURE__*/React.createElement("div", {
    className: "live-review"
  }, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => {
      setFinishing(false);
      setDraft(d => ({
        ...d,
        reviewing: false
      }));
    },
    eyebrow: "S\xE9ance termin\xE9e",
    title: "Bien jou\xE9."
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "finish-symbol"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 42
  })), /*#__PURE__*/React.createElement("div", {
    className: "stats-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("strong", null, completed), /*#__PURE__*/React.createElement("small", null, "s\xE9ries valid\xE9es")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("strong", null, timeLabel(elapsed)), /*#__PURE__*/React.createElement("small", null, "temps r\xE9el")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("strong", null, completed < total ? 'Partiel' : 'Fait'), /*#__PURE__*/React.createElement("small", null, "\xE0 ton rythme"))), /*#__PURE__*/React.createElement("section", {
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
  const activeTimer = phase === 'warmup' || phase === 'rest' ? draft.timer : draft.format === 'amrap' ? draft.blockTimer : draft.timer;
  const shownTime = activeTimer ? remaining(activeTimer) : phase === 'warmup' ? draft.warmupSeconds : stageElapsed;
  const coach = paused ? 'À ton rythme. Reprends quand tu veux.' : phase === 'warmup' ? 'Des gestes faciles. On se met en mouvement.' : phase === 'rest' ? timerLeft === 0 ? 'Prêt pour la suite ?' : 'Souffle. Relâche les épaules.' : allDone ? 'Toutes les séries sont validées.' : activeTimer && remaining(activeTimer) === 0 ? 'Temps écoulé. Confirme ce que tu as fait.' : exercise.instructions[0];
  const mainAction = () => {
    if (paused) {
      pause();
      return;
    }
    if (blocked || !permitted) {
      go('symptoms');
      return;
    }
    if (phase === 'warmup' || phase === 'rest') {
      beginWork();
      return;
    }
    if (allDone) {
      review();
      return;
    }
    openLog();
  };
  const actionLabel = paused ? 'Reprendre la séance' : blocked || !permitted ? 'Voir mes douleurs' : phase === 'warmup' ? 'Échauffement effectué' : phase === 'rest' ? `Passer à l’exercice ${exerciseIndex + 1}` : allDone ? 'Terminer la séance' : 'Terminé';
  const nextIndex = steps.findIndex((s, i) => i > cursor && !draft.entries[s.id][s.set].done && !draft.entries[s.id][s.set].pain);
  const upcoming = phase === 'warmup' ? {
    step,
    exercise
  } : nextIndex < 0 ? null : {
    step: steps[nextIndex],
    exercise: draft.exercises.find(e => e.id === steps[nextIndex].id)
  };
  // Moving between sets never validates or discards a result: saving still requires the result sheet.
  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    try {
      localStorage.setItem('rh_voice', next ? '1' : '0');
    } catch (e) {}
    if (next) ptSay('Annonces vocales activées.');else window.speechSynthesis?.cancel();
  };
  const jump = index => {
    setError('');
    setLogging(false);
    setDraft(d => ({
      ...d,
      cursor: index,
      timer: null,
      stageElapsed: 0,
      stageStarted: paused ? null : Date.now()
    }));
    window.scrollTo(0, 0);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: `live-session phase-${phase}`
  }, /*#__PURE__*/React.createElement("header", {
    className: "live-topbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Revenir \xE0 l\u2019accueil",
    onClick: () => go('today')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: `live-dot${paused ? ' paused' : ''}`
  }), "S\xE9ance en direct"), /*#__PURE__*/React.createElement("strong", null, timeLabel(elapsed), /*#__PURE__*/React.createElement("span", null, " \xB7 ", PT.formats[draft.format]))), /*#__PURE__*/React.createElement("button", {
    className: "live-cancel",
    "aria-expanded": abandon,
    onClick: () => setAbandon(!abandon)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "close",
    size: 16
  }), "Annuler")), abandon && /*#__PURE__*/React.createElement("div", {
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
  }, "Garder ma s\xE9ance")), /*#__PURE__*/React.createElement("div", {
    className: "live-progress",
    "aria-label": `${completed} séries validées sur ${total}`
  }, steps.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: `${s.id}-${s.set}`,
    className: draft.entries[s.id][s.set].done ? 'done' : i === cursor ? 'current' : ''
  }))), phase !== 'warmup' && /*#__PURE__*/React.createElement("div", {
    className: "live-step"
  }, /*#__PURE__*/React.createElement("span", null, "Exercice ", /*#__PURE__*/React.createElement("b", null, exerciseIndex + 1), " / ", draft.exercises.length), /*#__PURE__*/React.createElement("span", null, "S\xE9rie ", /*#__PURE__*/React.createElement("b", null, step.set + 1), " / ", exercise.sets)), /*#__PURE__*/React.createElement("div", {
    className: "live-visual"
  }, phase === 'warmup' ? /*#__PURE__*/React.createElement("div", {
    className: "warmup-visual"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "body",
    size: 80
  }), /*#__PURE__*/React.createElement("span", null, "On r\xE9veille le corps.")) : /*#__PURE__*/React.createElement(PTDemo, {
    key: exercise.id,
    exercise: exercise
  })), /*#__PURE__*/React.createElement("section", {
    className: "live-command"
  }, /*#__PURE__*/React.createElement("div", {
    className: "live-heading"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, phase === 'warmup' ? 'Échauffement' : phase === 'rest' ? 'À suivre' : PT.patterns[exercise.pattern]), /*#__PURE__*/React.createElement("h1", null, phase === 'warmup' ? 'On y va doucement.' : exercise.name)), /*#__PURE__*/React.createElement("div", {
    className: `live-timer${paused ? ' paused' : ''}`,
    role: "timer",
    "aria-label": `${phase === 'rest' ? 'Repos' : phase === 'warmup' ? 'Échauffement' : 'Travail'} : ${timeLabel(shownTime)}`
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 220 150",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    className: "dial-track",
    d: "M30 131 A94 94 0 1 1 190 131",
    pathLength: "100"
  }), /*#__PURE__*/React.createElement("path", {
    className: "dial-value",
    d: "M30 131 A94 94 0 1 1 190 131",
    pathLength: "100",
    strokeDasharray: `${activeTimer ? Math.min(100, shownTime / (activeTimer.duration || 1) * 100) : 100} 100`
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, paused ? 'En pause' : phase === 'rest' ? 'Repos' : activeTimer ? 'Temps restant' : 'Temps de série'), /*#__PURE__*/React.createElement("strong", null, timeLabel(shownTime)))), /*#__PURE__*/React.createElement("div", {
    className: "session-transport"
  }, phase !== 'warmup' && /*#__PURE__*/React.createElement("button", {
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
  })), phase !== 'warmup' && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": phase === 'rest' ? 'Terminer le repos' : 'Passer cette série',
    disabled: phase === 'rest' ? paused : nextIndex < 0,
    onClick: () => {
      if (phase !== 'rest') {
        jump(nextIndex);
        return;
      }
      if (blocked || !permitted) {
        go('symptoms');
        return;
      }
      beginWork();
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 20
  }))), phase !== 'warmup' && /*#__PURE__*/React.createElement(PTExerciseMetrics, {
    exercise: exercise,
    weight: row.weight || PT.loadAdvice(exercise, data, draft.check)?.value
  }), upcoming && /*#__PURE__*/React.createElement("div", {
    className: "next-up"
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: upcoming.exercise
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, phase === 'warmup' ? 'Pour commencer' : 'Ensuite'), /*#__PURE__*/React.createElement("strong", null, upcoming.exercise.name), /*#__PURE__*/React.createElement("small", null, "S\xE9rie ", upcoming.step.set + 1, " / ", upcoming.exercise.sets))), /*#__PURE__*/React.createElement("p", {
    className: "live-coach",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: phase === 'rest' ? 'heart' : 'spark',
    size: 17
  }), coach), blocked || !permitted ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning"
  }, blocked ? 'Séance suspendue : fais le point sur la douleur signalée.' : 'Ce mouvement ne convient plus à tes contraintes actuelles.') : null, phase === 'rest' && /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, timerLeft > 0 ? 'Le repos reste disponible jusqu’au bout.' : 'Récupération terminée.'), phase === 'rest' && typeof PTRestQuestion === 'function' && /*#__PURE__*/React.createElement(PTRestQuestion, {
    key: cursor,
    seed: cursor,
    data: data,
    update: update
  }), phase === 'work' && exercise.unilateral && exercise.measure === 'seconds' && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    disabled: paused,
    onClick: () => setDraft(d => ({
      ...d,
      timer: makeTimer(exercise.seconds, 'Autre côté', 'work'),
      stageElapsed: 0,
      stageStarted: Date.now()
    }))
  }, "Minuter l\u2019autre c\xF4t\xE9", /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh",
    size: 18
  })), phase === 'work' && exercise.audio && /*#__PURE__*/React.createElement(PTAudioCue, null), draft.blockTimer && draft.format !== 'amrap' && /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "Bloc ", draft.format.toUpperCase(), " \xB7 ", timeLabel(remaining(draft.blockTimer)))), /*#__PURE__*/React.createElement("div", {
    className: "live-extras"
  }, 'speechSynthesis' in window && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    "aria-pressed": voice,
    onClick: toggleVoice
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "spark",
    size: 18
  }), voice ? 'Couper les annonces vocales' : 'Activer les annonces vocales'), phase === 'warmup' && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => {
      setDraft(d => ({
        ...d,
        warmupSkipped: true
      }));
      beginWork();
    }
  }, "Je l\u2019ai d\xE9j\xE0 fait avant d\u2019ouvrir l\u2019app"), phase === 'work' && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Posture & charge"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("ol", {
    className: "instruction-list"
  }, exercise.instructions.map((line, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, line))), PT.loadAdvice(exercise, data, draft.check) && /*#__PURE__*/React.createElement("p", {
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
        stageElapsed: 0,
        stageStarted: null
      }));
    }
  }, "Passer \xE0 un mouvement compatible"), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Options de s\xE9ance"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: review
  }, "Terminer ici"), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Voir les s\xE9ries / corriger un r\xE9sultat"), /*#__PURE__*/React.createElement("div", {
    className: "set-history"
  }, steps.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: `${s.id}-${s.set}`,
    className: `${draft.entries[s.id][s.set].done ? 'done ' : ''}${i === cursor ? 'current' : ''}`,
    "aria-label": `${draft.exercises.find(e => e.id === s.id).name}, série ${s.set + 1}`,
    onClick: () => {
      setDraft(d => ({
        ...d,
        cursor: i,
        timer: null,
        stageElapsed: 0,
        stageStarted: paused ? null : Date.now()
      }));
      window.scrollTo(0, 0);
    }
  }, i + 1, draft.entries[s.id][s.set].done ? ' ✓' : '')))), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => {
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
          stageElapsed: 0,
          stageStarted: paused ? null : Date.now(),
          shortened: true
        };
      });
      notify('Une série restante par exercice. Tes résultats sont conservés.');
    }
  }, "Raccourcir la fin \xB7 10 min"))), !abandon && /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => {
      setAbandon(true);
      window.scrollTo(0, 0);
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "close",
    size: 18
  }), "Annuler la s\xE9ance")), /*#__PURE__*/React.createElement("footer", {
    className: "live-dock"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dock-caption"
  }, /*#__PURE__*/React.createElement("span", null, phase === 'rest' ? 'À suivre' : phase === 'warmup' ? 'Prépare-toi' : `${completed}/${total} séries validées`), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: reportPain
  }, "Une douleur ?")), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: mainAction
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: paused ? 'play' : phase === 'work' ? 'check' : 'arrow',
    size: 22
  }), actionLabel)), logging && /*#__PURE__*/React.createElement(PTSetSheet, {
    exercise: exercise,
    row: row,
    onChange: updateRow,
    onClose: () => setLogging(false),
    onSave: () => advance(),
    onQuick: quickRow() && !row.done ? () => advance(quickRow()) : null,
    error: error
  }));
}