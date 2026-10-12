/* Lot 14 : calendrier de la semaine (route « calendar ») et plan de saison (route « plan »).
   Toute la logique est dans season-plan.js ; ces écrans affichent, lancent et déplacent les séances. */
const SP = window.SeasonPlan;
const ptCalIcon = {
  pathway: 'weight',
  reset: 'body',
  muscu: 'weight',
  vivacite: 'spark',
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
function ptCalendarPlan(data, item) {
  const BP = window.BasketPathway,
    JP = window.PlayerProfile,
    SK = window.BasketSkills;
  if (item.type === 'pathway' && data.pathway) return BP.sessionPlan(PT, JP, data, data.pathway, item.day);
  if (item.type === 'reset') {
    // Remise en route : les jours de l'étape 1, sans saut ni impact, hors parcours (rien n'est validé dans les étapes).
    const p = data.pathway && data.pathway.step === 1 ? data.pathway : BP.create({
      startStep: 1
    });
    const plan = BP.sessionPlanCore ? BP.sessionPlanCore(PT, JP, data, p, item.day) : BP.sessionPlan(PT, JP, data, p, item.day);
    if (plan.error) return plan;
    const exercises = plan.exercises.filter(e => !e.impact && e.pattern !== 'jump' && !e.skillBlock);
    return {
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
    };
  }
  if (item.type === 'vivacite') return BP.quickPlan(PT, JP, data, 'vivacite');
  if (item.type === 'skills' && SK) return SK.session(PT, data, {
    minutes: item.minutes
  });
  return null;
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
    [error, setError] = usePTState('');
  if (!SP) return /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Calendrier indisponible.");
  const now = PT.dateKey(),
    monday = SP.at(SP.mondayOf(now), shift * 7);
  const week = SP.weekSchedule(data, monday, now),
    phase = week.phase.phase;
  const launch = item => {
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
    const plan = ptCalendarPlan(data, item);
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
  // Mes jours d'entraînement : même réponse que dans le dossier joueur, modifiable ici.
  const free = SP.freeDays(data),
    perWeek = SP.target(data);
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
  const fullDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric'
  });
  const exportIcs = () => {
    ptDownload(`rehaab-plan-${now}.ics`, SP.ics(data, now, 4), 'text/calendar');
    notify('Calendrier exporté : ouvre le fichier pour ajouter les séances à ton agenda.');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    eyebrow: phase ? `${phase.name} · semaine ${week.phase.week}` : 'Mon plan',
    title: "Mon planning."
  }, week.target, " s\xE9ances physiques pr\xE9vues. Choisis tes jours, ou d\xE9place une s\xE9ance o\xF9 tu veux."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "calendar-nav"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Semaine pr\xE9c\xE9dente",
    onClick: () => setShift(shift - 1)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 18
  })), /*#__PURE__*/React.createElement("strong", null, "Semaine du ", ptShortDay(monday)), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Semaine suivante",
    onClick: () => setShift(shift + 1)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm calendar-life"
  }, /*#__PURE__*/React.createElement("h2", null, "Mes jours d\u2019entra\xEEnement"), /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    value: free,
    onChange: v => {
      if (!v.length) {
        notify('Garde au moins un jour libre.');
        return;
      }
      setLife('freeDays', [...v].sort((a, b) => a - b));
    },
    options: SP.DAYS.map((d, i) => ({
      value: i,
      label: d.slice(0, 3)
    }))
  }), /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, "S\xE9ances par semaine"), /*#__PURE__*/React.createElement(PTChips, {
    value: perWeek,
    onChange: v => setLife('sessions', String(v)),
    options: [2, 3, 4, 5, 6].map(n => ({
      value: n,
      label: String(n)
    }))
  })), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "L\u2019app place tes s\xE9ances sur ces jours. Tu peux ensuite d\xE9placer chaque s\xE9ance sur le jour de ton choix.")), week.warnings.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "notice warning"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, week.warnings.map(w => /*#__PURE__*/React.createElement("li", {
    key: w
  }, w)))), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement("ol", {
    className: "calendar-week"
  }, week.days.map(d => /*#__PURE__*/React.createElement("li", {
    key: d.date,
    className: `calendar-day${d.date === now ? ' is-today' : ''}${d.club.match ? ' is-match' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "calendar-day-head"
  }, /*#__PURE__*/React.createElement("strong", null, d.label), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, ptShortDay(d.date)), d.club.match && /*#__PURE__*/React.createElement("span", {
    className: "badge"
  }, "Match"), d.club.practice && /*#__PURE__*/React.createElement("span", {
    className: "badge quiet"
  }, "Club"), !d.free && !d.club.match && !d.club.practice && /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "non dispo"), d.weighIn && window.BodyWeight && /*#__PURE__*/React.createElement("button", {
    className: "text-button calendar-weigh",
    onClick: () => go('weight')
  }, "Pes\xE9e du matin")), d.items.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, d.before ? 'Avant le début de ton plan.' : d.club.match ? 'Échauffement avant match, rien d’autre.' : d.club.practice ? 'Entraînement au club.' : 'Repos', d.qi && !d.club.match ? ' · QI du jour (5 min)' : ''), d.items.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.key,
    className: `calendar-item is-${item.status}`
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: ptCalIcon[item.type] || 'weight',
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, item.label), /*#__PURE__*/React.createElement("small", null, item.minutes, " min \xB7 ", ptCalStatus[item.status], item.moved ? ' · placée par toi' : '', item.legs === 'heavy' ? ' · jambes' : ''), item.warning && /*#__PURE__*/React.createElement("small", {
    className: "calendar-warning"
  }, "\u26A0 ", item.warning)), item.status !== 'done' && diff0(d.date, now) >= 0 && /*#__PURE__*/React.createElement("span", {
    className: "calendar-actions"
  }, d.date === now && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => launch(item)
  }, "Lancer"), d.date === now && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => cannot(item)
  }, "Je ne peux pas aujourd\u2019hui"), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    "aria-expanded": moving === item.key,
    onClick: () => {
      setConfirm(null);
      setMoving(moving === item.key ? null : item.key);
    }
  }, "Choisir le jour")), moving === item.key && /*#__PURE__*/React.createElement("div", {
    className: "calendar-move stack-sm",
    role: "group",
    "aria-label": `Choisir le jour de ${item.label}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "calendar-move-days"
  }, week.days.map(x => {
    const past = diff0(x.date, now) < 0,
      here = x.date === d.date,
      rule = !past && !here ? SP.ruleBreakAt(data, monday, item.key, x.date) : null;
    return /*#__PURE__*/React.createElement("button", {
      key: x.date,
      className: `calendar-move-day${rule ? ' has-rule' : ''}`,
      disabled: past || here,
      "aria-pressed": here,
      onClick: () => moveTo(item, x.date)
    }, /*#__PURE__*/React.createElement("strong", null, fullDate(x.date)), /*#__PURE__*/React.createElement("small", null, here ? 'Jour actuel' : past ? 'Passé' : rule ? '⚠ règle' : x.club.match ? 'Match' : x.club.practice ? 'Club' : free.includes(x.weekday) ? 'Libre' : 'Jour off'));
  })), confirm?.item.key === item.key && /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm",
    role: "alert"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, fullDate(confirm.date), " :"), " ", confirm.why, " Placer quand m\xEAme ?"), /*#__PURE__*/React.createElement("div", {
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
  }, "Pour une autre semaine, change de semaine avec les fl\xE8ches en haut."))))))), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Les r\xE8gles du calendrier"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, /*#__PURE__*/React.createElement("li", null, "Pas de jambes lourdes la veille ni le lendemain d\u2019un match."), /*#__PURE__*/React.createElement("li", null, "48 heures entre deux s\xE9ances de jambes lourdes."), /*#__PURE__*/React.createElement("li", null, "Pas de skills un jour de club : le basket y est d\xE9j\xE0."), /*#__PURE__*/React.createElement("li", null, "Une seule s\xE9ance physique par jour, et pas plus que ton objectif de la semaine.")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ce sont des conventions d\u2019entra\xEEnement courantes, pas des normes m\xE9dicales (voir les sources du plan)."))), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, /*#__PURE__*/React.createElement("button", {
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
  })))));
}
const diff0 = (a, b) => PT.dayDiff(a, b);

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
    [error, setError] = usePTState('');
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
  }, built.need.reasons.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Pourquoi ce plan"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, built.need.reasons.map(r => /*#__PURE__*/React.createElement("li", {
    key: r
  }, r)))), /*#__PURE__*/React.createElement("ol", {
    className: "roadmap"
  }, built.phases.map((ph, i) => /*#__PURE__*/React.createElement("li", {
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
  }, "Tu es ici \xB7 semaine ", built.current.week, built.deload ? ' · semaine allégée' : ''), /*#__PURE__*/React.createElement("p", {
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
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Accent de l\u2019architecte"), a.text))))))), built.current.id === 'reset' && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => {
      set({
        resetDone: PT.dateKey()
      });
      notify('Remise en route terminée : place au parcours.');
    }
  }, "La remise en route est faite, je passe au parcours"), gate?.last && gate.ready && !data.seasonPlan?.devStart && /*#__PURE__*/React.createElement(PTButton, {
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
  }, r.missed.length > 0 && /*#__PURE__*/React.createElement("li", null, "Manqu\xE9es : ", r.missed.join(', '), "."), r.weight && /*#__PURE__*/React.createElement("li", null, "Poids : ", r.weight.value, " kg", r.weight.change !== null ? ` (${r.weight.change > 0 ? '+' : ''}${r.weight.change} kg)` : '', "."), r.shooting && /*#__PURE__*/React.createElement("li", null, "Tir : ", r.shooting.made, "/", r.shooting.attempts, " (", r.shooting.pct, " %)."), r.qi.answered > 0 && /*#__PURE__*/React.createElement("li", null, "QI : ", r.qi.correct, "/", r.qi.answered, " bonnes lectures."), r.tests.length > 0 && /*#__PURE__*/React.createElement("li", null, r.tests.length, " test", r.tests.length > 1 ? 's' : '', " mesur\xE9", r.tests.length > 1 ? 's' : '', "."), r.pains.length > 0 && /*#__PURE__*/React.createElement("li", null, "Douleur active : ", r.pains.map(p => `${PT.regions[p.region]} ${p.severity}/10`).join(', '), ".")), ai && /*#__PURE__*/React.createElement("p", {
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
  }, "Ma semaine"), /*#__PURE__*/React.createElement("strong", null, next ? `Aujourd’hui : ${next.label}` : today?.club.match ? 'Jour de match' : today?.club.practice ? 'Club ce soir' : 'Repos aujourd’hui')), /*#__PURE__*/React.createElement("span", {
    className: "week-strip-days"
  }, week.days.map(d => /*#__PURE__*/React.createElement("span", {
    key: d.date,
    className: `week-strip-day${d.date === now ? ' is-today' : ''}${d.club.match ? ' is-match' : ''}`
  }, /*#__PURE__*/React.createElement("small", null, d.label.slice(0, 1)), /*#__PURE__*/React.createElement("i", null, d.items.filter(x => x.type !== 'care').map(x => /*#__PURE__*/React.createElement("b", {
    key: x.key,
    className: `dot is-${x.status} type-${x.type}`
  })), d.club.match && /*#__PURE__*/React.createElement("b", {
    className: "dot is-match"
  }))))));
}