/* Carte « Ta séance du jour » et mesure vidéo au ralenti. Réutilise les composants de personal-app.jsx. */

// Lot 19 : ce qui a été fait aujourd'hui, validé noir sur blanc en haut de l'accueil (séances de l'app, pas les activités saisies à la main).
function PTDoneToday({
  data,
  go
}) {
  const today = PT.dateKey(),
    done = data.sessions.filter(s => s.date === today && s.source !== 'external');
  if (!done.length) return null;
  const last = done[done.length - 1],
    sets = done.reduce((n, s) => n + Object.values(s.entries || {}).flat().filter(r => r.done && !r.pain).length, 0),
    minutes = Math.round(done.reduce((n, s) => n + (Number(s.minutes) || 0), 0));
  return /*#__PURE__*/React.createElement("section", {
    className: "done-today sport-reveal",
    "aria-label": "S\xE9ance du jour valid\xE9e"
  }, /*#__PURE__*/React.createElement("span", {
    className: "done-today-check"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 26
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, done.length > 1 ? `${done.length} séances validées aujourd’hui` : 'Séance du jour validée'), /*#__PURE__*/React.createElement("strong", null, last.title), /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, minutes, " min \xB7 ", sets, " s\xE9ries", last.effort ? ` · effort ${last.effort}/10` : '', last.partial ? ' · partielle' : '')), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('history', last.id)
  }, "Voir le d\xE9tail"));
}
function PTTodayPlan({
  data,
  update,
  go,
  notify
}) {
  const plan = PT.todayPlan(data),
    BP = window.BasketPathway,
    JP = window.PlayerProfile,
    p = data.pathway;
  const launch = draft => {
    if (data.draft?.status === 'active') {
      go('session');
      notify('Ta séance en cours est conservée.');
      return;
    }
    if (!draft || draft.error) {
      notify(draft?.error || 'Séance indisponible aujourd’hui.');
      return;
    }
    update(s => ({
      ...s,
      draft
    }));
    go('preview');
  };
  const quick = (focus, minutes) => {
    if (data.draft?.status === 'active') {
      go('session');
      notify('Ta séance en cours est conservée.');
      return;
    }
    const check = {
      ...data.checkIn,
      date: PT.dateKey(),
      equipment: data.owned,
      minutes,
      focus,
      motivation: 'normal',
      energy: data.checkIn.date === PT.dateKey() ? data.checkIn.energy : 'normal'
    };
    const draft = PT.generate(data, check);
    if (draft.error) {
      notify(draft.error);
      return;
    }
    update(s => ({
      ...s,
      checkIn: check,
      draft
    }));
    go('preview');
  };
  // Séance du parcours : la prochaine séance prévue de la semaine, lancée directement.
  let next = null;
  if (p && BP) {
    const step = BP.stepById(p.step),
      status = BP.weekStatus(p),
      day = step.days.find(d => d.key === status.next);
    if (day) next = {
      step,
      status,
      day,
      plan: BP.sessionPlan(PT, JP, data, p, day.key)
    };
  }
  const ready = next && !next.plan.error;
  const PPR = window.PersonalPrograms,
    prog = data.program && data.program.status === 'active' ? data.program : null;
  const muscu = PPR && prog ? {
    progress: PPR.progressOf(prog),
    family: PPR.familyById(prog.familyId)
  } : null;
  const RW = window.RehabWarmup;
  const actions = {
    symptoms: ['Faire le point', () => go('symptoms')],
    warmup: ['Lancer l’échauffement', () => RW && typeof rwLaunch === 'function' ? rwLaunch({
      data,
      update,
      go,
      notify
    }, s => RW.warmupPlan(PT, JP, s, RW.warmups[0].id)) : go('today')],
    rehab: ['Trouver mon protocole', () => go('rehab')],
    mobility: ['10 min de mobilité', () => quick('mobility', 15)],
    session: [plan.kind === 'light' ? 'Séance légère · 20 min' : 'Préparer ma séance', () => plan.kind !== 'light' && data.player?.position && JP ? launch(JP.dailyBody(PT, data, {
      minutes: 30
    })) : quick('muscle', plan.kind === 'light' ? 20 : 30)],
    pathway: [ready ? 'Préparer ma séance' : 'Ouvrir mon parcours', () => ready ? launch(next.plan) : go('pathway')],
    // Programme muscu : le check-in de forme du programme fixe la version du jour (jambes protégées si la semaine l'exige).
    skills: ['Lancer ma séance skills', () => typeof ptSkillsLaunch === 'function' ? ptSkillsLaunch({
      data,
      update,
      go,
      notify
    }, {
      light: !!plan.light
    }) : go('skills')],
    program: [muscu ? 'Préparer ma séance muscu' : 'Créer ma muscu', () => muscu ? go('program-checkin', `${muscu.progress.currentWeek}:${muscu.progress.nextDay}`) : go('program-new')]
  };
  const [label, run] = actions[plan.action] || actions.session;
  const showPathway = plan.action === 'pathway' && next;
  const [mishap, setMishap] = usePTState(false);
  // Imprévu : la séance prévue au planning aujourd'hui est annulée ou reportée en un geste, et peut être rétablie dans la journée.
  const SPL = window.SeasonPlan,
    now = PT.dateKey();
  const excused = SPL ? SPL.excusedToday(data, now) : null;
  const plannedToday = SPL && !excused && plan.kind !== 'blocked' ? (SPL.weekSchedule(data, now, now).days.find(d => d.date === now)?.items || []).filter(x => x.status === 'planned') : [];
  // Programme du jour (lot 24) : tout ce que le calendrier prévoit aujourd'hui, lisible sans ouvrir le calendrier.
  const dayItems = SPL && plan.kind !== 'blocked' ? (SPL.weekSchedule(data, now, now).days.find(d => d.date === now)?.items || []).filter(x => x.type !== 'care') : [];
  const excuse = action => {
    const r = SPL.excuse(data, action, now);
    if (r.ok) update(s => ({
      ...s,
      calendar: r.calendar
    }));
    setMishap(false);
    notify(r.why);
  };
  const unexcuse = () => {
    update(s => ({
      ...s,
      calendar: SPL.unexcuse(s, now)
    }));
    notify('Séance rétablie aujourd’hui.');
  };
  // Cardio prévu aujourd'hui (corde ou course fractionnée) : lancé d'ici, comme depuis le planning.
  const cardioToday = plannedToday.find(x => x.type === 'cardio');
  const launchCardio = () => {
    if (data.draft?.status === 'active') {
      go('session');
      return;
    }
    const plan = typeof ptCalendarPlan === 'function' ? ptCalendarPlan(data, cardioToday, null) : null;
    if (!plan || plan.error) {
      notify(plan?.error || 'Séance indisponible aujourd’hui.');
      return;
    }
    update(s => ({
      ...s,
      draft: plan
    }));
    go('preview');
  };
  if (excused) return /*#__PURE__*/React.createElement("section", {
    className: "today-plan kind-rest",
    "aria-labelledby": "today-plan-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "today-plan-tag"
  }, "Repos"), /*#__PURE__*/React.createElement("h2", {
    id: "today-plan-title"
  }, excused.action === 'cancel' ? 'Séance annulée.' : 'Séance reportée.'), excused.why && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, excused.why), RW && typeof ptRecoveryLaunch === 'function' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => ptRecoveryLaunch({
      data,
      update,
      go,
      notify
    }, {
      feel: 'tired',
      minutes: 15
    })
  }, "R\xE9cup douce \xB7 15 min", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('stretch')
  }, "\xC9tirements cibl\xE9s (lourdeurs, tensions) \u2192")) : /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => quick('mobility', 15)
  }, "10 min de mobilit\xE9", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: unexcuse
  }, "Finalement, je peux m\u2019entra\xEEner"));
  // Lot 23 : plus de grande photo. La séance du jour tient en quelques lignes sous « Ma semaine », le « pourquoi » reste à un appui.
  return /*#__PURE__*/React.createElement("section", {
    className: `today-plan kind-${plan.kind}`,
    "aria-labelledby": "today-plan-title"
  }, /*#__PURE__*/React.createElement("div", {
    className: "today-plan-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "today-plan-tag"
  }, plan.kind === 'rest' ? 'Repos' : plan.kind === 'light' ? 'Version légère' : plan.kind === 'blocked' ? 'À vérifier' : 'Aujourd’hui'), plan.why.length > 0 && /*#__PURE__*/React.createElement("details", {
    className: "today-plan-more"
  }, /*#__PURE__*/React.createElement("summary", null, "Pourquoi ?"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, plan.why.map(w => /*#__PURE__*/React.createElement("li", {
    key: w
  }, w))))), /*#__PURE__*/React.createElement("h2", {
    id: "today-plan-title"
  }, showPathway ? next.day.name : plan.title), plan.action === 'program' && muscu && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, muscu.family?.short, " \xB7 semaine ", muscu.progress.currentWeek, "/", prog.weeks, " \xB7 ", muscu.family?.days.find(d => d.key === muscu.progress.nextDay)?.name), showPathway && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "\xC9tape ", next.step.id, " \xB7 ", next.step.name, " \xB7 semaine ", next.status.week, ready ? ` · ~${next.plan.estimatedMinutes} min, ${next.plan.exercises.length} exercices` : ''), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: run
  }, label, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), dayItems.length > 0 && /*#__PURE__*/React.createElement("ul", {
    className: "today-program",
    "aria-label": "Programme du jour"
  }, dayItems.map(x => /*#__PURE__*/React.createElement("li", {
    key: x.key,
    className: x.status === 'done' ? 'is-done' : ''
  }, /*#__PURE__*/React.createElement("span", {
    className: "today-program-label"
  }, x.status === 'done' && /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 13
  }), x.label), /*#__PURE__*/React.createElement("span", {
    className: "today-program-min"
  }, x.minutes, " min")))), /*#__PURE__*/React.createElement("div", {
    className: "today-plan-links"
  }, cardioToday && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: launchCardio
  }, "Lancer le cardio \u2192"), plannedToday.length > 0 && typeof PTMishap === 'function' ? /*#__PURE__*/React.createElement("button", {
    className: "text-button today-mishap",
    onClick: () => go('mishap')
  }, "Un impr\xE9vu aujourd\u2019hui ?") : plannedToday.length > 0 && !mishap && /*#__PURE__*/React.createElement("button", {
    className: "text-button today-mishap",
    "aria-expanded": "false",
    onClick: () => setMishap(true)
  }, "Un impr\xE9vu aujourd\u2019hui ?")), plannedToday.length > 0 && typeof PTMishap !== 'function' && mishap && /*#__PURE__*/React.createElement("div", {
    className: "today-mishap-panel stack-sm",
    role: "group",
    "aria-label": "Impr\xE9vu aujourd\u2019hui"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, plannedToday.map(x => x.label).join(' · ')), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    onClick: () => excuse('postpone')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "clock",
    size: 18
  }), "Reporter"), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => excuse('cancel')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "close",
    size: 18
  }), "Annuler")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Reporter : prochain jour libre qui respecte les r\xE8gles de charge. Annuler : la s\xE9ance saute cette semaine, sans rattrapage."), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setMishap(false)
  }, "Je garde ma s\xE9ance")));
}

// Mesure vidéo au ralenti, principe de l'app My Jump : temps de vol t entre décollage et réception, hauteur = g·t²/8.
// La vidéo reste sur le téléphone (URL locale), rien n'est envoyé.
const ptVideoModes = {
  jump: {
    marks: ['Décollage (orteils quittent le sol)', 'Réception (premier contact)'],
    unit: 'cm'
  },
  rsi: {
    marks: ['Arrivée au sol', 'Décollage', 'Réception'],
    unit: 'RSI'
  },
  sprint: {
    marks: ['Départ (premier mouvement)', 'Arrivée (buste passe la ligne)'],
    unit: 's'
  }
};
function ptVideoResult(mode, times, slow) {
  const d = (a, b) => (times[b] - times[a]) / slow;
  if (times.some(t => t == null)) return {
    error: 'Marque toutes les images.'
  };
  if (mode === 'sprint') {
    const t = d(0, 1);
    return t > 0.3 && t < 120 ? {
      value: Math.round(t * 100) / 100,
      detail: `${(Math.round(t * 100) / 100).toFixed(2)} s`
    } : {
      error: 'Temps incohérent : vérifie l’ordre des images et le réglage du ralenti.'
    };
  }
  const flight = mode === 'rsi' ? d(1, 2) : d(0, 1),
    h = 9.81 * flight * flight / 8;
  if (!(flight > 0.1 && flight < 1.2)) return {
    error: 'Temps de vol incohérent (attendu entre 0,1 et 1,2 s) : vérifie l’ordre des images et le ralenti.'
  };
  const cm = Math.round(h * 1000) / 10;
  if (mode === 'jump') return {
    value: cm,
    detail: `${cm} cm · vol ${Math.round(flight * 1000)} ms`
  };
  const contact = d(0, 1);
  if (!(contact > 0.05 && contact < 1.5)) return {
    error: 'Temps de contact incohérent : marque l’arrivée au sol avant le décollage.'
  };
  const rsi = Math.round(h / contact * 100) / 100;
  return {
    value: rsi,
    detail: `RSI ${rsi} · ${cm} cm en ${Math.round(contact * 1000)} ms de contact`
  };
}
function PTVideoMeasure({
  mode,
  onResult
}) {
  const cfg = ptVideoModes[mode],
    video = usePTRef(null);
  const [src, setSrc] = usePTState(null),
    [fps, setFps] = usePTState(240),
    [slow, setSlow] = usePTState(1),
    [times, setTimes] = usePTState(cfg.marks.map(() => null)),
    [active, setActive] = usePTState(0),
    [now, setNow] = usePTState(0);
  usePTEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);
  const load = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSrc(URL.createObjectURL(f));
    setTimes(cfg.marks.map(() => null));
    setActive(0);
  };
  // Lecture image par image : on déplace currentTime d'une image du fichier (1/fps, ou 1/30 pour un ralenti déjà étiré à la lecture).
  const step = n => {
    const v = video.current;
    if (!v) return;
    v.pause();
    const frame = 1 / (slow > 1 ? 30 : fps);
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + n * frame));
  };
  const mark = () => {
    const t = video.current?.currentTime ?? 0;
    setTimes(list => list.map((x, i) => i === active ? t : x));
    setActive(a => Math.min(cfg.marks.length - 1, a + 1));
  };
  const result = ptVideoResult(mode, times, slow);
  return /*#__PURE__*/React.createElement("div", {
    className: "video-measure stack"
  }, /*#__PURE__*/React.createElement("label", {
    className: "btn quiet file-button"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 18
  }), src ? 'Choisir une autre vidéo' : 'Choisir ou filmer une vidéo', /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "video/*",
    onChange: load
  })), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, "Images par seconde du film"), /*#__PURE__*/React.createElement(PTChips, {
    value: fps,
    onChange: setFps,
    options: [30, 60, 120, 240].map(n => ({
      value: n,
      label: `${n}`
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, "\xC0 la lecture, la vid\xE9o est\u2026"), /*#__PURE__*/React.createElement(PTChips, {
    value: slow,
    onChange: setSlow,
    options: [{
      value: 1,
      label: 'en temps réel'
    }, {
      value: 4,
      label: 'ralentie ×4'
    }, {
      value: 8,
      label: 'ralentie ×8'
    }]
  })), src && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("video", {
    ref: video,
    src: src,
    playsInline: true,
    muted: true,
    preload: "auto",
    controls: true,
    onTimeUpdate: e => setNow(e.currentTarget.currentTime),
    onSeeked: e => setNow(e.currentTarget.currentTime)
  }), /*#__PURE__*/React.createElement("div", {
    className: "frame-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Reculer de 5 images",
    onClick: () => step(-5)
  }, "\xAB"), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Image pr\xE9c\xE9dente",
    onClick: () => step(-1)
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    className: "num"
  }, now.toFixed(3), " s"), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Image suivante",
    onClick: () => step(1)
  }, "\u203A"), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Avancer de 5 images",
    onClick: () => step(5)
  }, "\xBB")), /*#__PURE__*/React.createElement("div", {
    className: "mark-list"
  }, cfg.marks.map((m, i) => /*#__PURE__*/React.createElement("button", {
    key: m,
    className: "chip",
    "aria-pressed": active === i,
    onClick: () => {
      setActive(i);
      if (times[i] != null && video.current) video.current.currentTime = times[i];
    }
  }, i + 1, ". ", m, times[i] != null ? ` · ${times[i].toFixed(3)} s` : ''))), /*#__PURE__*/React.createElement(PTButton, {
    onClick: mark
  }, "Marquer : ", cfg.marks[active]), times.every(t => t != null) && (result.error ? /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, result.error) : /*#__PURE__*/React.createElement("div", {
    className: "notice stack-sm"
  }, /*#__PURE__*/React.createElement("strong", null, result.detail), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => onResult(result.value)
  }, "Enregistrer ce r\xE9sultat", /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 18
  }))))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Filme de profil, t\xE9l\xE9phone pos\xE9 au sol, corps entier visible. Plus le ralenti est fort (240 i/s), plus la mesure est pr\xE9cise. La vid\xE9o ne quitte pas ton t\xE9l\xE9phone."));
}