/* Shared sport UI. Training decisions continue to live in PersonalTraining. */
function usePTMotionPreference() {
  const [reduced, setReduced] = usePTState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  usePTEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setReduced(query.matches);
    query.addEventListener('change', changed);
    return () => query.removeEventListener('change', changed);
  }, []);
  return reduced;
}
function usePTVisibleMedia(ref, playing, source, onIntent) {
  usePTEffect(() => {
    const el = ref.current;
    if (!el || !source) return;
    let visible = false,
      system = false;
    const onscreen = () => visible && document.visibilityState === 'visible';
    const sync = () => {
      if (playing && onscreen()) {
        el.muted = true;
        if (el.paused) el.play().catch(err => {
          if (err?.name === 'NotAllowedError') onIntent?.(false);
        });
      } else if (!el.paused) {
        system = true;
        el.pause();
      }
    };
    // Native controls and the custom button share one intent; pauses caused by scrolling or a hidden tab are not user choices.
    const paused = () => {
      if (system) {
        system = false;
        return;
      }
      if (onscreen()) onIntent?.(false);
    };
    const played = () => {
      if (!playing) onIntent?.(true);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, {
      threshold: .12
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', sync);
    el.addEventListener('canplay', sync);
    el.addEventListener('pause', paused);
    el.addEventListener('play', played);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      el.removeEventListener('canplay', sync);
      el.removeEventListener('pause', paused);
      el.removeEventListener('play', played);
      el.pause();
    };
  }, [playing, source]);
}
function PTSportMotion({
  children,
  identity
}) {
  const ref = usePTRef(null),
    reduced = usePTMotionPreference();
  usePTEffect(() => {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.from('.sport-reveal', {
        y: 12,
        opacity: 0,
        duration: .28,
        stagger: .04,
        ease: 'power3.out',
        clearProps: 'all'
      });
      gsap.utils.toArray('.scroll-reveal').forEach(el => gsap.from(el, {
        y: 16,
        scale: .98,
        opacity: 0,
        duration: .4,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: el,
          start: 'top 94%',
          once: true
        }
      }));
    }, ref);
    return () => context.revert();
  }, [identity, reduced]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref
  }, children);
}
// Zones traced over media/body renders in viewBox units: left-side points, mirrored as a pair or closed across the midline.
const ptBodyZones = {
  front: [['shoulders', 'Épaules', 'pair', '99 59 86 61 76 67 70 78 68 92 72 102 84 104 90 96 93 84 96 72 102 64'], ['arms', 'Bras', 'pair', '71 103 64 114 56 130 48 150 44 168 60 172 67 166 74 150 81 134 87 118 89 106 84 105'], ['chest', 'Pectoraux', 'pair', '119 65 104 62 96 68 92 80 93 92 99 98 110 101 119 99'], ['core', 'Abdominaux', 'center', '120 101 110 102 99 99 93 106 91 122 93 138 98 149 108 160 120 167'], ['quads', 'Quadriceps', 'pair', '96 152 89 166 87 190 89 215 92 236 100 246 110 244 116 232 118 206 118 186 110 172'], ['calves', 'Mollets', 'pair', '88 250 85 268 89 292 95 312 105 313 110 294 115 270 115 251 104 247']],
  back: [['shoulders', 'Épaules', 'pair', '101 58 86 61 76 67 70 78 68 92 72 102 84 104 90 96 92 84 94 72 100 64'], ['arms', 'Bras', 'pair', '71 103 64 114 56 130 48 150 44 168 60 172 67 166 74 150 81 134 87 118 89 106 84 105'], ['back', 'Dos', 'center', '120 48 110 50 102 60 95 68 93 82 90 98 91 114 95 128 99 142 110 147 120 149'], ['glutes', 'Fessiers', 'pair', '119 150 108 147 98 149 92 160 90 172 95 182 106 187 118 185'], ['hamstrings', 'Ischio-jambiers', 'pair', '90 178 87 195 89 215 92 238 100 246 111 244 116 230 118 206 118 188 106 190 95 185'], ['calves', 'Mollets', 'pair', '88 250 85 268 89 292 95 312 105 313 110 294 115 270 115 251 104 247']]
};
const ptBodyPaths = Object.fromEntries(Object.entries(ptBodyZones).map(([view, zones]) => [view, zones.map(([id, label, kind, list]) => {
  const n = list.split(' ').map(Number),
    left = n.flatMap((x, i) => i % 2 ? [] : [[x, n[i + 1]]]),
    right = left.map(([x, y]) => [240 - x, y]),
    path = points => `M${points.join(' ')}Z`;
  return {
    id,
    label,
    d: kind === 'pair' ? path(left) + path(right) : path([...left, ...right.reverse().filter(([x]) => x !== 120)])
  };
})]));
function PTBodyMap({
  selected = 'all',
  onSelect,
  back = false
}) {
  const uid = React.useId().replace(/:/g, ''),
    view = back ? 'back' : 'front',
    src = `media/body/${view}.webp`;
  usePTEffect(() => {
    ['front', 'back'].forEach(v => {
      new Image().src = `media/body/${v}.webp`;
    });
  }, []);
  const toggle = id => onSelect?.(selected === id ? 'all' : id);
  // The render's own alpha clips the highlight to the body, so zone outlines only need to be precise between muscles.
  return /*#__PURE__*/React.createElement("svg", {
    className: "body-map",
    viewBox: "0 0 240 350",
    role: "group",
    "aria-label": `Carte des muscles, ${back ? 'dos' : 'face'}`
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("mask", {
    id: `${uid}m`,
    maskUnits: "userSpaceOnUse",
    x: "0",
    y: "0",
    width: "240",
    height: "350",
    style: {
      maskType: 'alpha'
    }
  }, /*#__PURE__*/React.createElement("image", {
    href: src,
    width: "240",
    height: "350"
  })), /*#__PURE__*/React.createElement("filter", {
    id: `${uid}f`,
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "1.4"
  }))), /*#__PURE__*/React.createElement("ellipse", {
    cx: "120",
    cy: "336",
    rx: "48",
    ry: "5",
    fill: "#0000004d"
  }), /*#__PURE__*/React.createElement("image", {
    href: src,
    width: "240",
    height: "350",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("g", {
    className: "muscle-layer",
    mask: `url(#${uid}m)`
  }, ptBodyPaths[view].map(({
    id,
    label,
    d
  }) => /*#__PURE__*/React.createElement("path", {
    key: id,
    className: `muscle-zone${selected === id ? ' selected' : ''}`,
    d: d,
    filter: `url(#${uid}f)`,
    onClick: () => toggle(id),
    onKeyDown: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(id);
      }
    },
    tabIndex: onSelect ? 0 : undefined,
    role: onSelect ? 'button' : undefined,
    "aria-label": label,
    "aria-pressed": onSelect ? selected === id : undefined
  }, /*#__PURE__*/React.createElement("title", null, label)))));
}
function PTMuscleExplorer({
  value,
  onChange
}) {
  const [back, setBack] = usePTState(false);
  return /*#__PURE__*/React.createElement("section", {
    className: "muscle-explorer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "muscle-copy"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Cible ta s\xE9ance"), /*#__PURE__*/React.createElement("h2", null, value === 'all' ? /*#__PURE__*/React.createElement(React.Fragment, null, "QUEL", /*#__PURE__*/React.createElement("br", null), "MUSCLE ?") : ptMuscleLabels[value]), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Touche une zone."), /*#__PURE__*/React.createElement("button", {
    className: "chip rotate-body",
    onClick: () => setBack(!back)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh",
    size: 16
  }), back ? 'Voir de face' : 'Voir de dos'), /*#__PURE__*/React.createElement("button", {
    className: "text-button muscle-reset",
    "aria-hidden": value === 'all',
    disabled: value === 'all',
    tabIndex: value === 'all' ? -1 : undefined,
    onClick: () => onChange('all')
  }, "Tout afficher")), /*#__PURE__*/React.createElement(PTBodyMap, {
    selected: value,
    onSelect: onChange,
    back: back
  }));
}
// Le raccourci reflete le programme multi-semaines quand il existe, sinon l'invitation a en creer un.
function ptProgramShortcut(data) {
  const program = data.program,
    PP = window.PersonalPrograms;
  if (!program || program.status === 'archived' || !PP) return 'Construire un plan sur plusieurs semaines';
  const progress = PP.progressOf(program),
    family = PP.familyById(program.familyId);
  if (program.status === 'paused') return `${family ? family.short : 'Programme'} · en pause`;
  return `${family ? family.short : 'Programme'} · semaine ${progress.currentWeek}/${program.weeks}`;
}
function PTSportWeek({
  data,
  go
}) {
  const [offset, setOffset] = usePTState(0),
    [selected, setSelected] = usePTState(PT.dateKey());
  const monday = new Date(`${PT.dateKey()}T12:00:00`);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7 + offset * 7);
  const rows = data.sessions.filter(s => s.date === selected),
    events = data.events.filter(e => e.date === selected);
  return /*#__PURE__*/React.createElement("section", {
    className: "sport-week sport-reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h2", null, "Ton rythme"), /*#__PURE__*/React.createElement("div", {
    className: "week-switch"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Semaine pr\xE9c\xE9dente",
    onClick: () => setOffset(offset - 1)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 15
  })), /*#__PURE__*/React.createElement("span", null, monday.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Semaine suivante",
    onClick: () => setOffset(offset + 1)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 15
  })))), /*#__PURE__*/React.createElement("div", {
    className: "week-calendar"
  }, Array.from({
    length: 7
  }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const key = PT.dateKey(date),
      done = data.sessions.some(s => s.date === key),
      event = data.events.some(e => e.date === key);
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      className: `day-cell${selected === key ? ' is-today' : ''}${done ? ' is-done' : ''}`,
      "aria-pressed": selected === key,
      "aria-label": date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }),
      onClick: () => setSelected(key)
    }, /*#__PURE__*/React.createElement("small", null, ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]), /*#__PURE__*/React.createElement("span", null, date.getDate()), /*#__PURE__*/React.createElement("i", {
      className: done ? 'filled' : event ? 'planned' : ''
    }));
  })), selected !== PT.dateKey() && /*#__PURE__*/React.createElement("div", {
    className: "day-results"
  }, rows.map(s => /*#__PURE__*/React.createElement("button", {
    className: "history-row",
    key: s.id,
    onClick: () => go('history', s.id)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 16
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, s.title), /*#__PURE__*/React.createElement("small", null, s.minutes, " min")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 16
  }))), events.map(e => /*#__PURE__*/React.createElement("button", {
    key: e.id,
    className: "history-row",
    onClick: () => go('event', e.id)
  }, e.title, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 16
  }))), !rows.length && !events.length && /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "Journ\xE9e libre")));
}
function PTSportToday({
  data,
  update,
  go,
  notify
}) {
  const [focus, setFocus] = usePTState('muscle'),
    [minutes, setMinutes] = usePTState(30);
  const summary = PT.weeklySummary(data),
    ctx = PT.context(data),
    symptoms = PT.activeSymptoms(data);
  const followup = [...data.sessions].reverse().find(s => s.nextDayPending && PT.dayDiff(PT.dateKey(), s.date) >= 1 && PT.dayDiff(PT.dateKey(), s.date) <= 7);
  const upcoming = data.events.filter(e => !e.completed && e.date >= PT.dateKey()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  const prepare = (quick = false, chosenFocus = focus, chosenMinutes = minutes) => {
    if (data.draft?.status === 'active') {
      go('session');
      notify('Ta séance en cours est conservée.');
      return;
    }
    const check = {
      ...data.checkIn,
      date: PT.dateKey(),
      equipment: data.owned,
      minutes: chosenMinutes,
      focus: chosenFocus,
      motivation: chosenMinutes === 8 ? 'low' : 'normal',
      energy: data.checkIn.date === PT.dateKey() ? data.checkIn.energy : 'normal'
    };
    if (quick) {
      const plan = PT.generate(data, check);
      if (plan.error) {
        notify(plan.error);
        return;
      }
      update(s => ({
        ...s,
        checkIn: check,
        draft: plan
      }));
      go('preview');
    } else {
      update(s => ({
        ...s,
        checkIn: check
      }));
      go('prepare');
    }
  };
  const done = data.draft ? Object.values(data.draft.entries).flat().filter(r => r.done).length : 0,
    total = data.draft ? Object.values(data.draft.entries).flat().length : 0;
  return /*#__PURE__*/React.createElement(PTSportMotion, {
    identity: "today"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sport-home stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sport-greeting sport-reveal"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })), /*#__PURE__*/React.createElement("h1", null, data.profile.name ? `À TOI DE JOUER, ${data.profile.name}.` : 'À TOI DE JOUER.')), /*#__PURE__*/React.createElement("button", {
    className: "avatar-button",
    "aria-label": "Ouvrir mon profil",
    onClick: () => go('profile')
  }, data.profile.name?.slice(0, 1).toUpperCase() || /*#__PURE__*/React.createElement(PTIcon, {
    name: "profile"
  }))), typeof PTTodayPlan === 'function' && /*#__PURE__*/React.createElement(PTTodayPlan, {
    data: data,
    update: update,
    go: go,
    notify: notify
  }), /*#__PURE__*/React.createElement(PTSportWeek, {
    data: data,
    go: go
  }), symptoms.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "constraint-strip",
    onClick: () => go('symptoms')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "pain",
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, ctx.active.blocked ? 'Fais le point avant de démarrer' : symptoms.map(s => PT.regions[s.region]).join(' · ') + ' : séance adaptée'), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 16
  })), typeof PTBodyMind === 'function' && /*#__PURE__*/React.createElement(PTBodyMind, {
    data: data,
    update: update,
    go: go,
    notify: notify
  }), data.draft && /*#__PURE__*/React.createElement("button", {
    className: "resume-workout sport-reveal",
    onClick: () => go(data.draft.status === 'active' ? 'session' : 'preview')
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: data.draft.exercises[0]
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, data.draft.status === 'active' ? 'Reprendre la séance' : 'Ta séance est prête'), /*#__PURE__*/React.createElement("strong", null, data.draft.title), /*#__PURE__*/React.createElement("span", {
    className: "mini-progress"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      transform: `scaleX(${total ? done / total : 0})`
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "round-play"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 20
  }))), data.draft && typeof PTDraftCancel === 'function' && /*#__PURE__*/React.createElement(PTDraftCancel, {
    update: update,
    notify: notify
  }), /*#__PURE__*/React.createElement("div", {
    className: "home-main-grid"
  }, /*#__PURE__*/React.createElement("section", {
    className: "training-hero sport-reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "training-image"
  }, /*#__PURE__*/React.createElement("img", {
    src: "media/training-floor.webp",
    alt: "Salle de sport \xE9quip\xE9e pour la musculation"
  })), /*#__PURE__*/React.createElement("div", {
    className: "training-hero-content"
  }, /*#__PURE__*/React.createElement("span", {
    className: "training-kicker"
  }, "S\xE9ance libre \xB7 hors parcours"), /*#__PURE__*/React.createElement("h2", null, "PLUS FORT.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("em", null, "PLUS LIBRE.")), /*#__PURE__*/React.createElement("div", {
    className: "hero-bottom"
  }, /*#__PURE__*/React.createElement("span", null, minutes, " min \xB7 ", focusLabels[focus])), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => prepare(false)
  }, "Trouver ma s\xE9ance", /*#__PURE__*/React.createElement("span", {
    className: "button-disc"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))))), /*#__PURE__*/React.createElement("section", {
    className: "quick-builder sport-reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Le bon format."), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "\xC0 toi de choisir")), /*#__PURE__*/React.createElement("div", {
    className: "sport-categories"
  }, [{
    id: 'muscle',
    label: 'Force',
    icon: 'weight'
  }, {
    id: 'plyo',
    label: 'Explosivité',
    icon: 'spark'
  }, {
    id: 'cardio',
    label: 'Cardio',
    icon: 'run'
  }, {
    id: 'mobility',
    label: 'Mobilité',
    icon: 'body'
  }].map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    "aria-pressed": focus === c.id,
    onClick: () => setFocus(c.id)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: c.icon,
    size: 23
  }), /*#__PURE__*/React.createElement("span", null, c.label)))), /*#__PURE__*/React.createElement("div", {
    className: "quick-duration"
  }, /*#__PURE__*/React.createElement("span", null, "J\u2019ai"), [15, 30, 45].map(n => /*#__PURE__*/React.createElement("button", {
    "aria-pressed": minutes === n,
    key: n,
    onClick: () => setMinutes(n)
  }, n, /*#__PURE__*/React.createElement("small", null, " min")))), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => prepare(true)
  }, "Pr\xE9parer cette s\xE9ance", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "activity-compact"
  }, /*#__PURE__*/React.createElement(PTRing, {
    value: summary.sessions,
    total: summary.target,
    label: `${summary.sessions} sur ${summary.target} séances`
  }, /*#__PURE__*/React.createElement("strong", null, summary.sessions, /*#__PURE__*/React.createElement("small", null, "/", summary.target))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Le rythme se construit."), /*#__PURE__*/React.createElement("span", null, summary.minutes, " min cette semaine"), /*#__PURE__*/React.createElement("button", {
    className: "text-button accent-text",
    onClick: () => go('progress')
  }, "Mon activit\xE9 ", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 14
  })))))), typeof PTQuickRail === 'function' && /*#__PURE__*/React.createElement(PTQuickRail, {
    data: data,
    update: update,
    go: go,
    notify: notify
  }), typeof PTWarmupRail === 'function' && /*#__PURE__*/React.createElement(PTWarmupRail, {
    data: data,
    update: update,
    go: go,
    notify: notify
  }), typeof PTRehabRail === 'function' && /*#__PURE__*/React.createElement(PTRehabRail, {
    data: data,
    update: update,
    go: go,
    notify: notify
  }), /*#__PURE__*/React.createElement(PTAdaptation, {
    data: data
  }), followup && /*#__PURE__*/React.createElement("section", {
    className: "card stack"
  }, /*#__PURE__*/React.createElement("h3", null, "Comment \xE7a va depuis hier ?"), /*#__PURE__*/React.createElement(PTChoices, {
    value: null,
    options: [{
      value: 'same',
      label: 'Tout va bien'
    }, {
      value: 'worse',
      label: 'Une gêne a augmenté'
    }],
    onChange: v => {
      update(s => ({
        ...s,
        sessions: s.sessions.map(x => x.id === followup.id ? {
          ...x,
          nextDay: v,
          nextDayPending: false
        } : x)
      }));
      if (v === 'worse') go('symptoms');else notify('Ressenti enregistré.');
    }
  })), /*#__PURE__*/React.createElement("section", {
    className: "upcoming-events scroll-reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Sur ton agenda"), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Ajouter un match ou un entra\xEEnement",
    onClick: () => go('event')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "plus",
    size: 19
  }))), upcoming.length ? upcoming.map(e => /*#__PURE__*/React.createElement("button", {
    key: e.id,
    className: "event-row",
    onClick: () => go('event', e.id)
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, e.title), /*#__PURE__*/React.createElement("small", null, shortDate(e.date))), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 16
  }))) : /*#__PURE__*/React.createElement("button", {
    className: "calendar-empty",
    onClick: () => go('event')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "today"
  }), /*#__PURE__*/React.createElement("span", null, "Un match pr\xE9vu ?", /*#__PURE__*/React.createElement("small", null, "Ajoute-le \xE0 ton planning.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "plus",
    size: 18
  }))), !!data.savedWorkouts.length && /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h2", null, "Tes favoris"), data.savedWorkouts.slice(-3).map(w => /*#__PURE__*/React.createElement("button", {
    key: w.id,
    className: "history-row",
    onClick: () => {
      if (data.draft?.status === 'active') {
        go('session');
        return;
      }
      const check = {
        ...data.checkIn,
        equipment: data.owned
      };
      const safe = w.plan.exercises.filter(e => PT.allowed(e, data, check));
      if (!safe.length) {
        notify('Aucun mouvement compatible avec tes contraintes actuelles.');
        return;
      }
      update(s => ({
        ...s,
        draft: {
          ...PT.clone(w.plan),
          id: PT.uid(),
          exercises: safe,
          status: 'preview',
          entries: {},
          check,
          reasons: ['Favori adapté à tes contraintes actuelles.']
        }
      }));
      go('preview');
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "heart"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, w.name), /*#__PURE__*/React.createElement("small", null, w.plan.exercises.length, " exercices")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 16
  }))))));
}