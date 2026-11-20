/* Lot 14 : calendrier de la semaine (route « calendar ») et plan de saison (route « plan »).
   Toute la logique est dans season-plan.js ; ces écrans affichent, lancent et déplacent les séances. */
const SP = window.SeasonPlan;
const ptCalIcon = {
  pathway: 'weight',
  reset: 'body',
  muscu: 'weight',
  vivacite: 'spark',
  cardio: 'run',
  skills: 'court',
  care: 'heart',
  shooting: 'basket'
};
const ptCalStatus = {
  done: 'Faite',
  missed: 'Manquée',
  planned: 'Prévue'
};
const ptShortDay = date => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

// Construit la séance correspondant à un élément du calendrier.
// day : le jour du calendrier. S'il porte déjà une séance skills, la séance du parcours n'ajoute pas son bloc skills (pas de doublon).
function ptCalendarPlan(data, item, day) {
  const BP = window.BasketPathway,
    JP = window.PlayerProfile,
    SK = window.BasketSkills;
  const ownSkills = !!day && day.items.some(x => x.type === 'skills');
  const vivaToday = !!day && day.items.some(x => x.type === 'vivacite' && x.status === 'planned');
  if (item.type === 'pathway' && data.pathway && vivaToday && BP.withVivacite) {
    const base = ownSkills && BP.sessionPlanCore ? BP.sessionPlanCore(PT, JP, data, data.pathway, item.day) : BP.sessionPlan(PT, JP, data, data.pathway, item.day);
    return BP.withVivacite(PT, JP, data, base);
  }
  if (item.type === 'pathway' && data.pathway) return ownSkills && BP.sessionPlanCore ? BP.groupByPlace ? BP.groupByPlace(PT, data, BP.sessionPlanCore(PT, JP, data, data.pathway, item.day)) : BP.sessionPlanCore(PT, JP, data, data.pathway, item.day) : BP.sessionPlan(PT, JP, data, data.pathway, item.day);
  if (item.type === 'reset') {
    // Remise en route : les jours de l'étape 1, sans saut ni impact, hors parcours (rien n'est validé dans les étapes).
    const p = data.pathway && data.pathway.step === 1 ? data.pathway : BP.create({
      startStep: 1
    });
    const plan = BP.sessionPlanCore ? BP.sessionPlanCore(PT, JP, data, p, item.day) : BP.sessionPlan(PT, JP, data, p, item.day);
    if (plan.error) return plan;
    const exercises = plan.exercises.filter(e => !e.impact && e.pattern !== 'jump' && !e.skillBlock);
    const regroup = x => BP.groupByPlace ? BP.groupByPlace(PT, data, x) : x;
    return regroup({
      ...plan,
      id: PT.uid(),
      source: 'reset',
      pathwayId: undefined,
      pathwayStep: undefined,
      pathwayDay: undefined,
      title: item.label,
      exercises,
      reasons: ['Remise en route : aucun saut ni sprint, les tendons d’abord.', ...(plan.reasons || []).filter(r => !/saut|impact/i.test(r))],
      estimatedMinutes: Math.max(10, Math.round(PT.estimateSeconds(exercises, 'classic') / 60) + 5)
    });
  }
  if (item.type === 'vivacite') return BP.quickPlan(PT, JP, data, 'vivacite');
  if (item.type === 'cardio' && item.kind === 'wod' && window.BasketCardio) return window.BasketCardio.wodPlan(PT, JP, data, {
    phase: item.phase,
    minutes: item.minutes
  });
  if (item.type === 'cardio' && window.BasketCardio) return window.BasketCardio.plan(PT, JP, data, item.kind, {
    phase: item.phase,
    soft: item.soft
  });
  if (item.type === 'skills' && SK) return SK.session(PT, data, {
    minutes: item.minutes
  });
  return null;
}

// Lot 45 : thème de chaque séance (couleur et icône communes au planning, à « Mes thèmes » et à la légende).
const ptThemeOf = item => ['pathway', 'muscu', 'reset'].includes(item.type) ? 'muscu' : item.kind === 'wod' ? 'circuit' : item.type;
const ptThemeLabel = {
  muscu: 'Muscu',
  skills: 'Skills',
  shooting: 'Tir',
  vivacite: 'Vivacité',
  cardio: 'Cardio',
  circuit: 'Circuit',
  care: 'Soin'
};
const ptThemeIcon = {
  muscu: 'weight',
  skills: 'court',
  shooting: 'basket',
  vivacite: 'spark',
  cardio: 'run',
  circuit: 'run',
  care: 'heart'
};
const ptLongDay = date => new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric'
});

// Ce qu'un changement de thèmes fait à la semaine en cours, d'aujourd'hui à dimanche.
function ptWeekDiff(before, after, now) {
  const real = d => d.items.filter(x => x.type !== 'care');
  const list = w => w.days.filter(d => diff0(d.date, now) >= 0).flatMap(d => real(d).filter(x => x.status === 'planned').map(x => ({
    key: x.key,
    label: x.label,
    day: d.label.toLowerCase(),
    date: d.date
  })));
  const a = list(before),
    b = list(after);
  const removed = a.filter(x => !b.some(y => y.key === x.key)),
    added = b.filter(x => !a.some(y => y.key === x.key));
  const moved = b.filter(x => a.some(y => y.key === x.key && y.date !== x.date));
  const rest = after.days.filter((d, i) => diff0(d.date, now) >= 0 && !real(d).length && real(before.days[i]).length).map(d => d.label.toLowerCase());
  return {
    removed,
    added,
    moved,
    rest,
    none: !removed.length && !added.length && !moved.length
  };
}

// Thèmes éteints ou en pause : une ligne, avec le lien vers « Mes thèmes ».
function PTThemesOff({
  data,
  go
}) {
  if (!SP || !SP.themesOff) return null;
  const off = SP.themesOff(data, PT.dateKey());
  if (!off.length) return null;
  const text = off.map(t => t.until ? `${t.label} en pause jusqu’au ${ptLongDay(t.until)}` : `${t.label} éteint`).join(' · ');
  return /*#__PURE__*/React.createElement("button", {
    className: "themes-off",
    onClick: () => go('themes')
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "Hors de ton planning"), /*#__PURE__*/React.createElement("strong", null, text)), /*#__PURE__*/React.createElement("span", {
    className: "themes-off-link"
  }, "Mes th\xE8mes"));
}

// Un thème éteint libère des jours : l'app propose une seule chose, qu'on accepte ou non. Sinon, repos.
function PTThemeSuggestion({
  data,
  update,
  notify
}) {
  if (!SP || !SP.themeSuggestion) return null;
  const now = PT.dateKey(),
    sug = SP.themeSuggestion(data, SP.mondayOf(now), now);
  if (!sug) return null;
  const accept = () => {
    update(s => {
      const n = SP.applyThemeSuggestion(s, sug.id);
      return n ? {
        ...n,
        themes: SP.dismissThemeSuggestion(n, sug.key)
      } : s;
    });
    notify('Ajouté. Le planning a trouvé sa place, sans casser tes règles de charge.');
  };
  const keep = () => {
    update(s => ({
      ...s,
      themes: SP.dismissThemeSuggestion(s, sug.key)
    }));
    notify('Le repos reste du repos.');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "theme-suggestion stack-sm",
    role: "status"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, sug.label), " ", sug.why), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: accept
  }, "Oui, ajouter"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: keep
  }, "Garder le repos")));
}
function PTCalendar({
  data,
  update,
  go,
  notify
}) {
  const [shift, setShift] = usePTState(0),
    [moving, setMoving] = usePTState(null),
    [confirm, setConfirm] = usePTState(null),
    [error, setError] = usePTState(''),
    [swapOpen, setSwapOpen] = usePTState(false),
    [picked, setPicked] = usePTState(null);
  if (!SP) return /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Calendrier indisponible.");
  const now = PT.dateKey(),
    monday = SP.at(SP.mondayOf(now), shift * 7);
  const week = SP.weekSchedule(data, monday, now),
    phase = week.phase.phase;
  const launch = (item, day) => {
    if (item.type === 'muscu') {
      go('program');
      return;
    }
    if (item.type === 'care') {
      go('rehab');
      return;
    }
    if (item.type === 'shooting') {
      go('shooting');
      return;
    }
    if (data.draft?.status === 'active') {
      setError('Une séance est en cours : termine-la ou reprends-la avant d’en lancer une autre.');
      return;
    }
    const plan = ptCalendarPlan(data, item, day);
    if (!plan || plan.error) {
      setError(plan?.error || 'Séance indisponible aujourd’hui.');
      return;
    }
    setError('');
    update(s => ({
      ...s,
      draft: plan
    }));
    go('preview');
  };
  const cannot = item => {
    const r = SP.missed(data, monday, item.key, now);
    if (r.ok) update(s => ({
      ...s,
      calendar: r.calendar
    }));
    notify(r.why);
  };
  // Liberté + alerte : un jour qui casse une règle demande confirmation, puis la séance y va quand même.
  const moveTo = (item, date, force = false) => {
    const r = SP.reschedule(data, monday, item.key, date, {
      force
    });
    if (!r.ok && r.canForce) {
      setConfirm({
        item,
        date,
        why: r.why
      });
      return;
    }
    setMoving(null);
    setConfirm(null);
    if (r.ok) update(s => ({
      ...s,
      calendar: r.calendar
    }));
    notify(r.why);
  };
  const reset = item => {
    update(s => ({
      ...s,
      calendar: SP.unmove(s, monday, item.key)
    }));
    setMoving(null);
    notify(`${item.label} : placement automatique rétabli.`);
  };
  const free = SP.freeDays(data);
  // Type de journée d'un seul jour (cette semaine) ; la semaine type se règle dans « Mes thèmes ».
  const setMode = (date, mode) => update(s => ({
    ...s,
    calendar: SP.setDayMode(s, date, mode, {
      every: false
    })
  }));
  const modeOptions = date => Object.entries(SP.modesFor ? SP.modesFor(data, date) : SP.MODES).map(([value, label]) => ({
    value,
    label
  }));
  const exportIcs = () => {
    ptDownload(`rehaab-plan-${now}.ics`, SP.ics(data, now, 4), 'text/calendar');
    notify('Calendrier exporté : ouvre le fichier pour ajouter les séances à ton agenda.');
  };
  // Lot 45 : le jour ouvert (aujourd'hui par défaut) montre ses actions ; les autres jours restent en une ligne.
  const visible = week.days.filter(d => !(d.before && d.items.length === 0));
  const open = visible.find(d => d.date === picked)?.date || visible.find(d => d.date === now)?.date || visible.find(d => diff0(d.date, now) >= 0)?.date || visible[0]?.date;
  const pick = date => {
    setPicked(date);
    setMoving(null);
    setConfirm(null);
    setSwapOpen(false);
    const el = document.getElementById(`day-${date}`);
    if (el && el.scrollIntoView) el.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  };
  const themesInWeek = [...new Set(week.days.flatMap(d => d.items.map(ptThemeOf)))];
  const movePanel = (item, here) => /*#__PURE__*/React.createElement("div", {
    className: "calendar-move stack-sm",
    role: "group",
    "aria-label": `Choisir le jour de ${item.label}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "calendar-move-days"
  }, week.days.map(x => {
    const past = diff0(x.date, now) < 0,
      isHere = x.date === here,
      rule = !past && !isHere ? SP.ruleBreakAt(data, monday, item.key, x.date) : null;
    return /*#__PURE__*/React.createElement("button", {
      key: x.date,
      className: `calendar-move-day${rule ? ' has-rule' : ''}`,
      disabled: past || isHere,
      "aria-pressed": isHere,
      onClick: () => moveTo(item, x.date)
    }, /*#__PURE__*/React.createElement("strong", null, ptLongDay(x.date)), /*#__PURE__*/React.createElement("small", null, isHere ? 'Jour actuel' : past ? 'Passé' : rule ? '⚠ règle' : x.club.match ? 'Match' : x.club.practice ? 'Club' : free.includes(x.weekday) ? 'Libre' : 'Jour off'));
  })), confirm?.item.key === item.key && /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm",
    role: "alert"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, ptLongDay(confirm.date), " :"), " ", confirm.why, " Placer quand m\xEAme ?"), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => moveTo(item, confirm.date, true)
  }, "Oui, ce jour-l\xE0"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setConfirm(null)
  }, "Choisir un autre jour"))), item.moved && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => reset(item)
  }, "Laisser l\u2019app choisir le jour"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Pour une autre semaine, change de semaine avec les fl\xE8ches en haut."));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    eyebrow: phase ? `${phase.name} · semaine ${week.phase.week}` : 'Mon plan',
    title: "Mon planning."
  }, "Ta semaine d\u2019un coup d\u2019\u0153il. Touche un jour pour ses s\xE9ances."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "calendar-nav"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Semaine pr\xE9c\xE9dente",
    onClick: () => {
      setShift(shift - 1);
      setPicked(null);
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 18
  })), /*#__PURE__*/React.createElement("strong", null, "Semaine du ", ptShortDay(monday)), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Semaine suivante",
    onClick: () => {
      setShift(shift + 1);
      setPicked(null);
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    className: "calendar-grid",
    role: "group",
    "aria-label": "Ta semaine"
  }, week.days.map(d => {
    const items = d.items.filter(x => x.type !== 'care'),
      past = diff0(d.date, now) < 0;
    return /*#__PURE__*/React.createElement("button", {
      key: d.date,
      className: `calendar-cell${d.date === now ? ' is-today' : ''}${d.date === open ? ' is-open' : ''}${past ? ' is-past' : ''}${d.before ? ' is-before' : ''}`,
      "aria-pressed": d.date === open,
      "aria-label": `${d.label} ${ptShortDay(d.date)} : ${items.length ? items.map(x => x.label).join(', ') : d.club.match ? 'match' : d.club.practice ? 'club' : 'repos'}`,
      disabled: d.before && !d.items.length,
      onClick: () => pick(d.date)
    }, /*#__PURE__*/React.createElement("small", null, d.label.slice(0, 3)), /*#__PURE__*/React.createElement("em", null, Number(d.date.slice(8))), /*#__PURE__*/React.createElement("i", {
      "aria-hidden": "true"
    }, items.map(x => /*#__PURE__*/React.createElement("b", {
      key: x.key,
      className: `theme-dot theme-${ptThemeOf(x)} is-${x.status}`
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: ptThemeIcon[ptThemeOf(x)] || 'weight',
      size: 12
    }))), !items.length && !d.club.match && !d.club.practice && /*#__PURE__*/React.createElement("b", {
      className: "theme-dot is-rest"
    })), d.club.match ? /*#__PURE__*/React.createElement("span", {
      className: "cell-tag is-match"
    }, "Match") : d.club.practice ? /*#__PURE__*/React.createElement("span", {
      className: "cell-tag"
    }, "Club") : null);
  })), themesInWeek.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "calendar-legend"
  }, themesInWeek.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: `theme-${t}`
  }, /*#__PURE__*/React.createElement("b", {
    className: "theme-dot"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: ptThemeIcon[t] || 'weight',
    size: 12
  })), ptThemeLabel[t] || t)))), /*#__PURE__*/React.createElement(PTThemesOff, {
    data: data,
    go: go
  }), shift === 0 && /*#__PURE__*/React.createElement(PTThemeSuggestion, {
    data: data,
    update: update,
    notify: notify
  }), week.skills.placed < week.skills.wanted && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, week.skills.wanted - week.skills.placed, " s\xE9ance", week.skills.wanted - week.skills.placed > 1 ? 's' : '', " skills sans place cette semaine : r\xE8gle un jour sur \xAB Skills \xBB ou \xAB Muscu + skills \xBB."), week.warnings.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "notice warning"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, week.warnings.map(w => /*#__PURE__*/React.createElement("li", {
    key: w
  }, w)))), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), (() => {
    const gone = week.days.filter(d => d.before && d.items.length === 0);
    return gone.length > 0 && /*#__PURE__*/React.createElement("p", {
      className: "fine calendar-before"
    }, gone.length > 1 ? `${gone[0].label} → ${gone[gone.length - 1].label}` : gone[0].label, " : avant le d\xE9but de ton plan.");
  })(), (week.unplaced || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card stack-sm calendar-unplaced-day"
  }, /*#__PURE__*/React.createElement("strong", null, "\xC0 placer cette semaine"), week.unplaced.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.key,
    className: `calendar-item calendar-unplaced is-planned theme-${ptThemeOf(item)}`
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: ptThemeIcon[ptThemeOf(item)] || 'weight',
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, item.label), /*#__PURE__*/React.createElement("small", null, item.minutes, " min"), /*#__PURE__*/React.createElement("small", {
    className: "calendar-warning"
  }, "\u26A0 ", item.why)), /*#__PURE__*/React.createElement("span", {
    className: "calendar-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "text-button calendar-move-btn",
    "aria-expanded": moving === item.key,
    onClick: () => {
      setConfirm(null);
      setMoving(moving === item.key ? null : item.key);
    }
  }, "Choisir le jour")), moving === item.key && movePanel(item, null)))), /*#__PURE__*/React.createElement("ol", {
    className: "calendar-week"
  }, visible.map(d => {
    const isOpen = d.date === open,
      future = diff0(d.date, now) >= 0;
    return /*#__PURE__*/React.createElement("li", {
      key: d.date,
      id: `day-${d.date}`,
      className: `calendar-day${d.date === now ? ' is-today' : ''}${d.club.match ? ' is-match' : ''}${isOpen ? ' is-open' : ' is-closed'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "calendar-day-head"
    }, isOpen ? /*#__PURE__*/React.createElement("strong", null, d.label) : /*#__PURE__*/React.createElement("button", {
      className: "calendar-day-toggle",
      "aria-expanded": false,
      onClick: () => pick(d.date)
    }, /*#__PURE__*/React.createElement("strong", null, d.label)), /*#__PURE__*/React.createElement("span", {
      className: "caption"
    }, ptShortDay(d.date)), isOpen && !d.club.match && future && /*#__PURE__*/React.createElement("select", {
      className: "calendar-day-mode",
      "aria-label": `Type de journée, ${d.label.toLowerCase()} ${ptShortDay(d.date)}`,
      value: d.mode === 'auto' && !d.free ? 'off' : d.mode,
      onChange: e => setMode(d.date, e.target.value)
    }, modeOptions(d.date).map(o => /*#__PURE__*/React.createElement("option", {
      key: o.value,
      value: o.value
    }, o.label))), d.club.match && /*#__PURE__*/React.createElement("span", {
      className: "badge"
    }, "Match"), d.club.practice && /*#__PURE__*/React.createElement("span", {
      className: "badge quiet"
    }, "Club"), !d.free && !d.club.match && !d.club.practice && /*#__PURE__*/React.createElement("span", {
      className: "caption"
    }, "non dispo"), isOpen && d.weighIn && window.BodyWeight && /*#__PURE__*/React.createElement("button", {
      className: "text-button calendar-weigh",
      onClick: () => go('weight')
    }, "Pes\xE9e du matin")), isOpen && d.date === now && typeof PTMishap === 'function' && d.items.some(x => x.status !== 'done') && /*#__PURE__*/React.createElement("button", {
      className: "text-button calendar-mishap",
      onClick: () => go('mishap')
    }, "Je ne peux pas aujourd\u2019hui \u2192"), isOpen && d.date === now && SP.swapOptions && /*#__PURE__*/React.createElement("button", {
      className: "text-button calendar-swap",
      "aria-expanded": swapOpen,
      onClick: () => setSwapOpen(!swapOpen)
    }, "Faire la s\xE9ance d\u2019un autre jour"), isOpen && d.date === now && swapOpen && /*#__PURE__*/React.createElement(PTSwapPicker, {
      data: data,
      update: update,
      notify: notify,
      after: () => setSwapOpen(false)
    }), d.items.length === 0 && /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, d.before ? 'Avant le début de ton plan.' : d.club.match ? 'Échauffement avant match, rien d’autre.' : d.club.practice ? 'Entraînement au club.' : 'Repos'), d.items.map(item => /*#__PURE__*/React.createElement("div", {
      key: item.key,
      className: `calendar-item is-${item.status} theme-${ptThemeOf(item)}`,
      onClick: isOpen ? undefined : () => pick(d.date)
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: ptThemeIcon[ptThemeOf(item)] || 'weight',
      size: 18
    }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, item.label), /*#__PURE__*/React.createElement("small", null, item.minutes, " min \xB7 ", ptCalStatus[item.status], item.moved ? ' · placée par toi' : '', item.legs === 'heavy' ? ' · jambes' : ''), isOpen && item.warning && /*#__PURE__*/React.createElement("small", {
      className: "calendar-warning"
    }, "\u26A0 ", item.warning)), isOpen && item.status !== 'done' && future && /*#__PURE__*/React.createElement("span", {
      className: "calendar-actions"
    }, d.date === now && /*#__PURE__*/React.createElement(PTButton, {
      primary: d.items.filter(x => x.status !== 'done').indexOf(item) === 0,
      onClick: () => launch(item, d)
    }, "Lancer"), d.date === now && typeof PTMishap !== 'function' && /*#__PURE__*/React.createElement("button", {
      className: "chip-action",
      onClick: () => cannot(item)
    }, "Je ne peux pas aujourd\u2019hui"), /*#__PURE__*/React.createElement("button", {
      className: "text-button calendar-move-btn",
      "aria-expanded": moving === item.key,
      onClick: () => {
        setConfirm(null);
        setMoving(moving === item.key ? null : item.key);
      }
    }, "Choisir le jour")), isOpen && moving === item.key && movePanel(item, d.date))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('themes')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "spark"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mes th\xE8mes"), /*#__PURE__*/React.createElement("small", null, "Allumer, \xE9teindre ou mettre en pause muscu, skills, tir, cardio\u2026 et ta semaine type.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('plan')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "chart"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mon plan de saison"), /*#__PURE__*/React.createElement("small", null, "Les phases, o\xF9 tu en es, et pourquoi ce plan.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: exportIcs
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "today"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Ajouter \xE0 mon agenda"), /*#__PURE__*/React.createElement("small", null, "Fichier .ics des 4 prochaines semaines, avec les rappels de ton t\xE9l\xE9phone.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Les r\xE8gles du calendrier"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, /*#__PURE__*/React.createElement("li", null, "Pas de jambes lourdes la veille ni le lendemain d\u2019un match."), /*#__PURE__*/React.createElement("li", null, "48 heures entre deux s\xE9ances de jambes lourdes."), /*#__PURE__*/React.createElement("li", null, "Pas de skills un jour de club (le basket y est d\xE9j\xE0), sauf si tu r\xE8gles ce jour sur \xAB Skills \xBB ou \xAB Muscu + skills \xBB."), /*#__PURE__*/React.createElement("li", null, "Skills sans jour libre : elles passent apr\xE8s une s\xE9ance physique, en version courte, plut\xF4t que de dispara\xEEtre."), /*#__PURE__*/React.createElement("li", null, "Une seule s\xE9ance physique par jour, et pas plus que ton objectif de la semaine."), /*#__PURE__*/React.createElement("li", null, "Circuit training : \xE0 la maison, ni un jour de match, ni la veille ou le lendemain, ni un jour de club, ni avec des jambes lourdes. S\u2019il n\u2019a pas de jour id\xE9al, il reste au programme avec une alerte, plut\xF4t que de dispara\xEEtre."), /*#__PURE__*/React.createElement("li", null, "Un th\xE8me \xE9teint dans \xAB Mes th\xE8mes \xBB ne place plus rien ; le soin reste toujours l\xE0 tant qu\u2019une douleur est active.")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ce sont des conventions d\u2019entra\xEEnement courantes, pas des normes m\xE9dicales (voir les sources du plan).")))));
}

// Lot 45 : « Mes thèmes ». Chaque thème s'allume, s'éteint ou se met en pause ; le planning se refait seul.
// Éteindre montre d'abord ce qui change cette semaine ; « Annuler » remet tout comme avant.
function PTThemes({
  data,
  update,
  go,
  notify
}) {
  const [pending, setPending] = usePTState(null),
    [undo, setUndo] = usePTState(null);
  if (!SP || !SP.THEMES) return /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Th\xE8mes indisponibles.");
  const now = PT.dateKey(),
    monday = SP.mondayOf(now),
    BC = window.BasketCardio;
  const sk = data.skills?.program,
    skActive = !!(sk && sk.status === 'active');
  const cardioN = BC ? BC.perWeek(data) : 0,
    circuitN = BC && BC.circuitPerWeek ? BC.circuitPerWeek(data) : 0;
  const themeOn = id => SP.themeOn(data, id, now);
  const isOn = id => themeOn(id) && (id === 'skills' ? skActive : id === 'cardio' ? cardioN > 0 : id === 'circuit' ? circuitN > 0 : true);
  const offInfo = id => SP.validateThemes(data.themes).off[id];
  const week = s => SP.weekSchedule(s, monday, now);
  const slice = s => ({
    themes: s.themes,
    cardio: s.cardio,
    skills: s.skills
  });
  const offState = (id, weeks) => ({
    ...data,
    themes: SP.setTheme(data, id, false, {
      weeks,
      now
    })
  });
  const onState = id => {
    let next = {
      ...data,
      themes: SP.setTheme(data, id, true, {
        now
      })
    };
    if (id === 'cardio' && cardioN === 0) next = {
      ...next,
      cardio: {
        ...(next.cardio || {}),
        perWeek: 1,
        chosen: true
      }
    };
    if (id === 'circuit') {
      const c = {
        ...(next.cardio || {})
      };
      delete c.circuit;
      next = {
        ...next,
        cardio: c
      };
    }
    return next;
  };
  const say = (d, word) => d.none ? `Rien ne change d’ici dimanche.` : [d.removed.length ? `${word} : ${d.removed.map(x => `${x.label} (${x.day})`).join(', ')}.` : '', d.added.length ? `Ajouté : ${d.added.map(x => `${x.label} (${x.day})`).join(', ')}.` : '', d.moved.length ? `Déplacé : ${d.moved.map(x => `${x.label} → ${x.day}`).join(', ')}.` : '', d.rest.length ? `${d.rest.join(', ')} : repos.` : ''].filter(Boolean).join(' ');
  const apply = (next, text) => {
    setUndo({
      prev: slice(data),
      text
    });
    setPending(null);
    update(s => ({
      ...s,
      ...slice(next)
    }));
    notify(text);
  };
  const turnOn = id => {
    const next = onState(id),
      d = ptWeekDiff(week(data), week(next), now);
    apply(next, `${SP.THEMES[id].label} rallumé. ${say(d, 'Retiré')}`);
  };
  const ask = id => setPending({
    id,
    weeks: 0
  });
  const setLife = (k, v) => update(s => {
    const PD = window.PlayerDossier,
      base = s.dossier || (PD ? PD.blank() : {
        answers: {}
      });
    return {
      ...s,
      dossier: {
        ...base,
        answers: {
          ...(base.answers || {}),
          [k]: v
        }
      }
    };
  });
  const setSkillsPerWeek = n => update(s => ({
    ...s,
    skills: {
      ...s.skills,
      program: {
        ...s.skills.program,
        perWeek: n,
        status: 'active'
      }
    }
  }));
  const setCardioPerWeek = n => update(s => ({
    ...s,
    cardio: {
      ...(s.cardio || {}),
      perWeek: n,
      chosen: true
    }
  }));
  const circuitDay = Number.isInteger(data.cardio?.circuitDay) ? String(data.cardio.circuitDay) : 'auto';
  const setCircuitDay = v => update(s => {
    const c = {
      ...(s.cardio || {})
    };
    if (v === 'auto') delete c.circuitDay;else c.circuitDay = Number(v);
    return {
      ...s,
      cardio: c
    };
  });
  const free = SP.freeDays(data);
  const weekMode = wd => {
    const m = SP.dayMode({
      calendar: {
        week: (data.calendar || {}).week || {}
      },
      themes: data.themes
    }, SP.at(monday, wd));
    return m === 'auto' && !free.includes(wd) ? 'off' : m;
  };
  const setWeekMode = (wd, mode) => update(s => {
    const date = SP.at(monday, wd);
    let next = {
      ...s,
      calendar: SP.setDayMode(s, date, mode, {
        every: true
      })
    };
    const days = SP.freeDays(s);
    if (mode === 'auto' && !days.includes(wd)) {
      const PD = window.PlayerDossier,
        base = s.dossier || (PD ? PD.blank() : {
          answers: {}
        });
      next = {
        ...next,
        dossier: {
          ...base,
          answers: {
            ...(base.answers || {}),
            freeDays: [...days, wd].sort((a, b) => a - b)
          }
        }
      };
    }
    return next;
  });
  const modeOptions = Object.entries(SP.modesFor ? SP.modesFor(data, now) : SP.MODES).map(([value, label]) => ({
    value,
    label
  }));
  const status = id => {
    const o = offInfo(id);
    if (o) return o.until ? `En pause jusqu’au ${ptLongDay(o.until)}` : 'Éteint';
    if (id === 'skills' && !skActive) return 'Questionnaire à faire';
    if (id === 'cardio' && !cardioN) return 'Réglé sur 0';
    if (id === 'circuit' && !circuitN) return 'Réglé sur 0';
    return 'Allumé';
  };
  const settings = id => {
    if (id === 'muscu') return /*#__PURE__*/React.createElement("div", {
      className: "topline"
    }, /*#__PURE__*/React.createElement("span", {
      className: "fine"
    }, "S\xE9ances physiques / semaine"), /*#__PURE__*/React.createElement(PTChips, {
      value: SP.target(data),
      onChange: v => setLife('sessions', String(v)),
      options: [2, 3, 4, 5, 6].map(n => ({
        value: n,
        label: String(n)
      }))
    }));
    if (id === 'skills') return skActive ? /*#__PURE__*/React.createElement("div", {
      className: "topline"
    }, /*#__PURE__*/React.createElement("span", {
      className: "fine"
    }, "S\xE9ances skills / semaine"), /*#__PURE__*/React.createElement(PTChips, {
      value: sk.perWeek,
      onChange: setSkillsPerWeek,
      options: [1, 2, 3, 4].map(n => ({
        value: n,
        label: String(n)
      }))
    })) : null;
    if (id === 'cardio') return BC ? /*#__PURE__*/React.createElement("div", {
      className: "topline"
    }, /*#__PURE__*/React.createElement("span", {
      className: "fine"
    }, "Cardio / semaine, club compris"), /*#__PURE__*/React.createElement(PTChips, {
      value: cardioN,
      onChange: setCardioPerWeek,
      options: [1, 2, 3].map(n => ({
        value: n,
        label: String(n)
      }))
    })) : null;
    if (id === 'circuit') return /*#__PURE__*/React.createElement("label", {
      className: "calendar-mode-row"
    }, /*#__PURE__*/React.createElement("span", null, "Jour du circuit"), /*#__PURE__*/React.createElement("select", {
      "aria-label": "Jour du circuit training",
      value: circuitDay,
      onChange: e => setCircuitDay(e.target.value)
    }, /*#__PURE__*/React.createElement("option", {
      value: "auto"
    }, "L\u2019app choisit"), SP.DAYS.map((d, i) => /*#__PURE__*/React.createElement("option", {
      key: d,
      value: i
    }, d))));
    if (id === 'shooting') return /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, "Une s\xE9ance par semaine, plus une par jour r\xE9gl\xE9 sur \xAB Shooting \xBB dans ta semaine type.");
    if (id === 'vivacite') return /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, "Une \xE0 deux fois par semaine, \xE0 partir de l\u2019\xE9tape 2 du parcours.");
    return null;
  };
  const preview = pending ? ptWeekDiff(week(data), week(offState(pending.id, pending.weeks)), now) : null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('calendar'),
    title: "Mes th\xE8mes."
  }, "Garde ce que tu veux travailler. Le planning se refait seul, sans casser tes r\xE8gles de charge."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, undo && /*#__PURE__*/React.createElement("div", {
    className: "theme-undo",
    role: "status"
  }, /*#__PURE__*/React.createElement("p", null, undo.text), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => {
      update(s => ({
        ...s,
        ...undo.prev
      }));
      setUndo(null);
      notify('Retour au planning d’avant.');
    }
  }, "Annuler")), /*#__PURE__*/React.createElement(PTThemeSuggestion, {
    data: data,
    update: update,
    notify: notify
  }), /*#__PURE__*/React.createElement("ul", {
    className: "theme-list"
  }, Object.entries(SP.THEMES).map(([id, t]) => {
    const on = isOn(id),
      asking = pending?.id === id;
    return /*#__PURE__*/React.createElement("li", {
      key: id,
      className: `theme-row theme-${id}${on ? ' is-on' : ' is-off'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "theme-row-head"
    }, /*#__PURE__*/React.createElement("b", {
      className: "theme-dot is-big"
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: ptThemeIcon[id] || 'weight',
      size: 18
    })), /*#__PURE__*/React.createElement("span", {
      className: "theme-row-text"
    }, /*#__PURE__*/React.createElement("strong", null, t.label), /*#__PURE__*/React.createElement("small", null, status(id))), id === 'skills' && !skActive && themeOn(id) ? /*#__PURE__*/React.createElement("button", {
      className: "text-button",
      onClick: () => go('skills-quiz')
    }, "Faire le questionnaire") : /*#__PURE__*/React.createElement("button", {
      type: "button",
      role: "switch",
      "aria-checked": on,
      "aria-label": `${t.label} : ${on ? 'allumé' : 'éteint'}`,
      className: "theme-switch",
      onClick: () => on ? ask(id) : turnOn(id)
    }, /*#__PURE__*/React.createElement("span", null))), /*#__PURE__*/React.createElement("p", {
      className: "fine theme-what"
    }, t.what), on && !asking && settings(id), asking && /*#__PURE__*/React.createElement("div", {
      className: "theme-confirm stack-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "topline"
    }, /*#__PURE__*/React.createElement("span", {
      className: "fine"
    }, "Combien de temps ?"), /*#__PURE__*/React.createElement(PTChips, {
      value: pending.weeks,
      onChange: v => setPending({
        ...pending,
        weeks: v
      }),
      options: [{
        value: 0,
        label: 'Jusqu’à nouvel ordre'
      }, {
        value: 1,
        label: '1 sem.'
      }, {
        value: 2,
        label: '2 sem.'
      }, {
        value: 4,
        label: '4 sem.'
      }]
    })), /*#__PURE__*/React.createElement("p", {
      className: "theme-preview"
    }, /*#__PURE__*/React.createElement("strong", null, "Cette semaine"), " ", say(preview, 'En moins')), id === 'muscu' && /*#__PURE__*/React.createElement("p", {
      className: "notice warning"
    }, "Ton parcours \xAB Retour au jeu \xBB se met en pause : ses \xE9tapes et ses tests n\u2019avancent plus tant que la muscu est \xE9teinte."), /*#__PURE__*/React.createElement("div", {
      className: "button-row"
    }, /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      onClick: () => apply(offState(id, pending.weeks), `${t.label} ${pending.weeks ? `en pause ${pending.weeks} sem.` : 'éteint'}. ${say(preview, 'Retiré')}`)
    }, pending.weeks ? 'Mettre en pause' : 'Éteindre'), /*#__PURE__*/React.createElement(PTButton, {
      quiet: true,
      onClick: () => setPending(null)
    }, "Annuler"))));
  })), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Le soin n\u2019est pas un th\xE8me : il reste au programme tant qu\u2019une douleur est active. Extra garde tout \xE0 la carte, tir compris."), /*#__PURE__*/React.createElement("details", {
    className: "card stack-sm calendar-life disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, /*#__PURE__*/React.createElement("strong", null, "Ma semaine type"), /*#__PURE__*/React.createElement("small", null, "Le type de chaque jour, toutes les semaines")), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "calendar-modes"
  }, SP.DAYS.map((d, i) => /*#__PURE__*/React.createElement("label", {
    key: d,
    className: "calendar-mode-row"
  }, /*#__PURE__*/React.createElement("span", null, d), /*#__PURE__*/React.createElement("select", {
    value: weekMode(i),
    onChange: e => setWeekMode(i, e.target.value)
  }, modeOptions.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)))))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "\xAB Auto \xBB : l\u2019app choisit selon tes r\xE8gles de charge. \xAB Muscu + skills \xBB : la s\xE9ance skills, raccourcie, suit la s\xE9ance physique. Les types li\xE9s \xE0 un th\xE8me \xE9teint sont masqu\xE9s."), /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, "Terrain de basket"), /*#__PURE__*/React.createElement(PTChips, {
    value: !!(data.calendar && data.calendar.courtNear),
    onChange: v => update(s => ({
      ...s,
      calendar: {
        ...(SP.validateCalendar(s.calendar) || SP.blankCalendar()),
        courtNear: v
      }
    })),
    options: [{
      value: false,
      label: 'Loin de chez moi'
    }, {
      value: true,
      label: 'À côté'
    }]
  })), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, data.calendar && data.calendar.courtNear ? 'À côté : une séance peut commencer au terrain (sprints, dribble) et finir à la maison.' : 'Loin : chaque séance se fait à un seul endroit. À la maison : charges, soin, abdos et sauts sur place. Au terrain : sprints, vivacité, navettes, dribble.'))), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('calendar')
  }, "Voir mon planning")));
}
const diff0 = (a, b) => PT.dayDiff(a, b);

// Lot 42 : faire aujourd'hui la séance d'un autre jour de la semaine (pluie, envie, contrainte).
// Les deux journées s'échangent ; le reste de la semaine ne bouge pas. Une règle de charge cassée demande confirmation.
function PTSwapPicker({
  data,
  update,
  notify,
  after
}) {
  const [pending, setPending] = usePTState(null);
  const SPx = window.SeasonPlan,
    now = PT.dateKey();
  if (!SPx || !SPx.swapOptions) return null;
  const opts = SPx.swapOptions(data, now);
  if (!opts.length) return /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Plus aucune s\xE9ance pr\xE9vue d\u2019ici dimanche : rien \xE0 \xE9changer cette semaine.");
  const pick = (date, confirmed = false) => {
    const r = SPx.swapDays(data, now, date, now);
    if (!r.ok) {
      notify(r.why);
      return;
    }
    if (r.warnings.length && !confirmed) {
      setPending({
        date,
        warnings: r.warnings
      });
      return;
    }
    update(s => ({
      ...s,
      calendar: r.calendar
    }));
    notify(r.why);
    setPending(null);
    if (after) after();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "swap-picker stack-sm"
  }, opts.map(d => /*#__PURE__*/React.createElement("button", {
    key: d.date,
    className: "home-action swap-day",
    "aria-pressed": pending?.date === d.date,
    onClick: () => pick(d.date)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Faire celle du ", d.label.toLowerCase(), " aujourd\u2019hui"), /*#__PURE__*/React.createElement("small", null, d.items.map(x => x.label).join(' + '))), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), pending && /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm",
    role: "alert"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Attention :"), " ", pending.warnings.join(' ')), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => pick(pending.date, true)
  }, "\xC9changer quand m\xEAme"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setPending(null)
  }, "Choisir un autre jour"))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ce qui \xE9tait pr\xE9vu aujourd\u2019hui part \xE0 la place de cette s\xE9ance. Le reste de la semaine ne bouge pas, et tu peux annuler l\u2019\xE9change depuis l\u2019accueil."));
}

// Choix des créneaux proposés à l'IA architecte : la liste fermée de chaque créneau (exercices du créneau + fiches basket du même mouvement).
function ptArchitectSlots(data) {
  const BP = window.BasketPathway,
    p = data.pathway;
  if (!BP) return {};
  const step = BP.stepById(p ? p.step : 1),
    out = {};
  step.days.forEach(day => day.slots.forEach((slot, i) => {
    const base = slot.ids.map(id => PT.catalog.find(e => e.id === id)).filter(Boolean);
    const pattern = base[0]?.pattern,
      extra = PT.catalog.filter(e => e.transfer && e.pattern === pattern && !slot.ids.includes(e.id) && (step.id >= 3 || !e.impact)).slice(0, 6);
    out[`${step.id}${day.key}${i}`] = [...base, ...extra].map(e => ({
      id: e.id,
      name: e.name,
      transfer: e.transfer || ''
    }));
  }));
  return out;
}
function PTSeasonPlan({
  data,
  update,
  go,
  notify
}) {
  const [loading, setLoading] = usePTState(false),
    [error, setError] = usePTState(''),
    [allPhases, setAllPhases] = usePTState(false);
  if (!SP) return /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Plan indisponible.");
  const built = SP.build(data),
    arch = data.seasonPlan?.architect,
    BP = window.BasketPathway;
  const gate = data.pathway && BP ? BP.gate(PT, data, data.pathway) : null;
  const ask = async () => {
    setLoading(true);
    setError('');
    const JP = window.PlayerProfile,
      AP = window.AthleticProfile;
    const context = {
      dossier: window.PlayerDossier?.summary(data.dossier) || null,
      priorities: JP && data.player ? JP.priorities({
        ...data.player,
        court: data.basketProfile
      }, data.athletic).slice(0, 5).map(p => p.label) : [],
      targets: AP && data.athletic ? AP.targets(data.athletic, data.player || {}, 3).map(t => t.label) : [],
      phase: built.current.phase?.name,
      phases: built.phases.map(p => p.name),
      slots: ptArchitectSlots(data)
    };
    try {
      const r = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'plan',
          context,
          messages: [{
            role: 'user',
            text: 'Construis mon plan : diagnostic, accents par phase, choix par créneau, règles personnelles.'
          }]
        })
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || 'Le coach ne répond pas.');
      const architect = SP.validateArchitect({
        ...j,
        date: PT.dateKey()
      });
      update(s => ({
        ...s,
        seasonPlan: {
          ...(SP.validate(s.seasonPlan) || SP.blank()),
          architect
        }
      }));
      notify('Plan mis à jour par l’architecte. Les choix restent filtrés par tes douleurs et ton matériel.');
    } catch (e) {
      setError('L’architecte n’est pas joignable (hors connexion ?). Ton plan reste construit par l’app.');
    }
    setLoading(false);
  };
  const set = patch => update(s => ({
    ...s,
    seasonPlan: {
      ...(SP.validate(s.seasonPlan) || SP.blank()),
      ...patch
    }
  }));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('calendar'),
    eyebrow: "Plan de saison",
    title: "Ton plan."
  }, built.returnRange ? `Repère : ${built.returnRange.min} à ${built.returnRange.max} semaines jusqu’au retour au jeu, si les tests suivent. Ce n’est pas une promesse.` : 'Les phases s’enchaînent à ton rythme, validées par tes tests.'), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, built.need.reasons.length > 0 && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Pourquoi ce plan"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, built.need.reasons.map(r => /*#__PURE__*/React.createElement("li", {
    key: r
  }, r))))), /*#__PURE__*/React.createElement("ol", {
    className: "roadmap"
  }, built.phases.map((ph, i) => {
    const near = allPhases || i === built.current.index || i === built.current.index + 1;
    return /*#__PURE__*/React.createElement("li", {
      key: ph.id,
      className: `roadmap-step${i === built.current.index ? ' is-current' : i < built.current.index ? ' is-done' : ''}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "roadmap-dot",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("div", {
      className: "stack-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "topline"
    }, /*#__PURE__*/React.createElement("strong", null, ph.name), /*#__PURE__*/React.createElement("span", {
      className: "caption"
    }, ph.weeks)), i === built.current.index && /*#__PURE__*/React.createElement("p", {
      className: "badge"
    }, "Tu es ici \xB7 semaine ", built.current.week, built.deload ? ' · semaine allégée' : ''), near && /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, ph.goal), i === built.current.index && ph.rules && /*#__PURE__*/React.createElement("ul", {
      className: "reason-list"
    }, ph.rules.map(r => /*#__PURE__*/React.createElement("li", {
      key: r
    }, r))), arch?.accents?.filter(a => ph.name.toLowerCase().includes(a.phase.toLowerCase()) || a.phase === ph.id).map(a => /*#__PURE__*/React.createElement("p", {
      key: a.text,
      className: "court-transfer"
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: "spark",
      size: 16
    }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Accent de l\u2019architecte"), a.text)))));
  })), !allPhases && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setAllPhases(true)
  }, "Voir le d\xE9tail de toutes les phases"), gate?.last && gate.ready && !data.seasonPlan?.devStart && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => {
      set({
        devStart: PT.dateKey()
      });
      notify('Phase de développement lancée : cycles de 4 semaines.');
    }
  }, "Commencer le d\xE9veloppement"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Prochain point de test : ", ptShortDay(built.nextTest), ". D\xE9tente, sprint et douleur font avancer le plan."), /*#__PURE__*/React.createElement("section", {
    className: "card stack"
  }, /*#__PURE__*/React.createElement("h2", null, "L\u2019architecte (IA)"), arch ? /*#__PURE__*/React.createElement(React.Fragment, null, arch.message && /*#__PURE__*/React.createElement("p", null, arch.message), arch.priorities.length > 0 && /*#__PURE__*/React.createElement("ol", {
    className: "stack-sm"
  }, arch.priorities.map((p, i) => /*#__PURE__*/React.createElement("li", {
    key: p.label,
    className: "dossier-priority"
  }, /*#__PURE__*/React.createElement("b", null, i + 1), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, p.label), /*#__PURE__*/React.createElement("small", null, p.why))))), arch.rules.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h3", null, "Tes r\xE8gles personnelles"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, arch.rules.map(r => /*#__PURE__*/React.createElement("li", {
    key: r
  }, r)))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, Object.keys(arch.choices).length, " choix d\u2019exercices appliqu\xE9s \xE0 tes s\xE9ances, toujours filtr\xE9s par tes douleurs et ton mat\xE9riel. Mis \xE0 jour le ", arch.date ? ptShortDay(arch.date) : '—', ".")) : /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "L\u2019architecte lit ton dossier et choisit, pour chaque cr\xE9neau, l\u2019exercice le plus utile parmi une liste ferm\xE9e. La s\xE9curit\xE9 reste dans l\u2019app."), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: !arch,
    disabled: loading,
    onClick: ask
  }, loading ? 'L’architecte réfléchit…' : arch ? 'Refaire le plan avec l’architecte' : 'Demander à l’architecte'))));
}

// Bilan de la semaine écoulée : carte de l'accueil, une fois par semaine.
function PTWeekReview({
  data,
  update,
  notify
}) {
  const [ai, setAi] = usePTState(null),
    [loading, setLoading] = usePTState(false);
  if (!SP) return null;
  const monday = SP.at(SP.mondayOf(PT.dateKey()), -7),
    done = (data.weeklyReviews || []).some(r => r.monday === monday);
  if (done) return null;
  const r = SP.review(data, monday);
  if (!r.planned && !r.tests.length && !r.weight) return null;
  const close = accepted => update(s => {
    let next = s;
    accepted.forEach(id => {
      next = SP.applySuggestion(next, id);
    });
    return {
      ...next,
      weeklyReviews: [...(s.weeklyReviews || []), {
        monday,
        date: PT.dateKey(),
        accepted,
        message: ai || ''
      }].slice(-26)
    };
  });
  const askAi = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'review',
          context: {
            review: r,
            suggestions: r.suggestions
          },
          messages: [{
            role: 'user',
            text: 'Fais le debrief de ma semaine.'
          }]
        })
      });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error();
      setAi(j.message);
    } catch (e) {
      notify('Debrief IA indisponible : le bilan ci-dessus reste valable.');
    }
    setLoading(false);
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm week-review"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Bilan de la semaine"), /*#__PURE__*/React.createElement("h2", null, r.done, " s\xE9ance", r.done > 1 ? 's' : '', " sur ", r.planned, " pr\xE9vue", r.planned > 1 ? 's' : '', "."), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, r.missed.length > 0 && /*#__PURE__*/React.createElement("li", null, "Manqu\xE9es : ", r.missed.join(', '), "."), r.weight && /*#__PURE__*/React.createElement("li", null, "Poids : ", r.weight.value, " kg", r.weight.change !== null ? ` (${r.weight.change > 0 ? '+' : ''}${r.weight.change} kg)` : '', "."), r.shooting && /*#__PURE__*/React.createElement("li", null, "Tir : ", r.shooting.made, "/", r.shooting.attempts, " (", r.shooting.pct, " %)."), r.tests.length > 0 && /*#__PURE__*/React.createElement("li", null, r.tests.length, " test", r.tests.length > 1 ? 's' : '', " mesur\xE9", r.tests.length > 1 ? 's' : '', "."), r.pains.length > 0 && /*#__PURE__*/React.createElement("li", null, "Douleur active : ", r.pains.map(p => `${PT.regions[p.region]} ${p.severity}/10`).join(', '), ".")), ai && /*#__PURE__*/React.createElement("p", {
    className: "coach-quote"
  }, ai), r.suggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, r.suggestions.map(s => /*#__PURE__*/React.createElement("p", {
    key: s.id,
    className: "fine"
  }, /*#__PURE__*/React.createElement("strong", null, s.label, "."), " ", s.why))), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, r.suggestions.some(s => s.id === 'lighter') && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => {
      close(['lighter']);
      notify('Semaine prochaine : une séance de moins.');
    }
  }, "Accepter : une s\xE9ance de moins"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => {
      close([]);
      notify('Bilan enregistré.');
    }
  }, r.suggestions.some(s => s.id === 'lighter') ? 'Garder mon plan' : 'C’est noté'), !ai && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    disabled: loading,
    onClick: askAi
  }, loading ? 'Le coach lit ta semaine…' : 'Debrief du coach (IA)')));
}

// Bandeau de la semaine sur l'accueil : un point par séance prévue, le jour J mis en avant ; un appui ouvre le calendrier.
function PTWeekStrip({
  data,
  go
}) {
  if (!SP) return null;
  const now = PT.dateKey(),
    week = SP.weekSchedule(data, now, now),
    today = week.days.find(d => d.date === now);
  const next = today?.items.find(x => x.status === 'planned');
  return /*#__PURE__*/React.createElement("button", {
    className: "week-strip sport-reveal",
    onClick: () => go('calendar'),
    "aria-label": "Ouvrir ma semaine"
  }, /*#__PURE__*/React.createElement("span", {
    className: "week-strip-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Ma semaine", /*#__PURE__*/React.createElement("em", {
    className: "week-strip-open"
  }, "Calendrier \u2192")), /*#__PURE__*/React.createElement("strong", null, next ? `Aujourd’hui : ${next.label}` : today?.club.match ? 'Jour de match' : today?.club.practice ? 'Club ce soir' : 'Repos aujourd’hui')), /*#__PURE__*/React.createElement("span", {
    className: "week-strip-days"
  }, week.days.map(d => /*#__PURE__*/React.createElement("span", {
    key: d.date,
    className: `week-strip-day${d.date === now ? ' is-today' : ''}${d.club.match ? ' is-match' : ''}`
  }, /*#__PURE__*/React.createElement("small", null, d.label.slice(0, 1)), /*#__PURE__*/React.createElement("em", null, Number(d.date.slice(8))), /*#__PURE__*/React.createElement("i", null, d.items.filter(x => x.type !== 'care').map(x => /*#__PURE__*/React.createElement("b", {
    key: x.key,
    className: `dot is-${x.status} type-${x.type}`
  })), d.club.match && /*#__PURE__*/React.createElement("b", {
    className: "dot is-match"
  }))))));
}