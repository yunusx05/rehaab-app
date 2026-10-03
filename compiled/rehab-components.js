/* Quick Rehab (questionnaire + protocoles) et Warm Up basket. Réutilise les composants de personal-app.jsx. */
const RW = window.RehabWarmup;
const rwSides = [{
  value: 'left',
  label: 'Gauche'
}, {
  value: 'right',
  label: 'Droite'
}, {
  value: 'both',
  label: 'Deux côtés'
}, {
  value: 'center',
  label: 'Centre'
}];
const rwThumb = id => PT.catalog.find(e => e.id === id) || PT.catalog[0];

// Lancer une séance courte : même règle que les Quick Workout (une séance active est conservée).
function rwLaunch({
  data,
  update,
  go,
  notify
}, build) {
  if (data.draft?.status === 'active') {
    go('session');
    notify('Ta séance en cours est conservée.');
    return;
  }
  const plan = build(data);
  if (plan.error) {
    notify(plan.error);
    return;
  }
  update(s => ({
    ...s,
    draft: plan
  }));
  go('preview');
}
function PTRehabRail(props) {
  const {
    data,
    go
  } = props;
  const painZones = RW.activeZones(data);
  const zones = [...RW.zones].sort((a, b) => painZones.includes(b.id) - painZones.includes(a.id));
  const last = [...(data.rehab?.log || [])].reverse().find(x => PT.dayDiff(PT.dateKey(), x.date) <= 21);
  const lastProtocol = last && RW.byId(last.protocolId);
  const lastLevel = lastProtocol ? data.rehab.levels[lastProtocol.id] ?? last.level : 0;
  const resume = () => rwLaunch(props, s => RW.rehabPlan(PT, window.PlayerProfile, s, lastProtocol.id, lastLevel, 15));
  return /*#__PURE__*/React.createElement("section", {
    className: "scroll-reveal rehab-rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "QUICK REHAB"), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "Une douleur, un protocole")), /*#__PURE__*/React.createElement("div", {
    className: "workout-rail"
  }, lastProtocol && /*#__PURE__*/React.createElement("button", {
    className: "preset-workout",
    onClick: resume
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: rwThumb(lastProtocol.levels[lastLevel][0][0] || lastProtocol.levels[lastLevel][0].ids[0])
  }), /*#__PURE__*/React.createElement("span", {
    className: "preset-info"
  }, /*#__PURE__*/React.createElement("small", null, "Reprendre \xB7 ", RW.LEVELS[lastLevel]), /*#__PURE__*/React.createElement("strong", null, lastProtocol.title), /*#__PURE__*/React.createElement("span", {
    className: "preset-play"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 17
  })))), /*#__PURE__*/React.createElement("button", {
    className: "preset-workout quiz-tile",
    onClick: () => go('rehab')
  }, /*#__PURE__*/React.createElement("span", {
    className: "quiz-tile-court",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "pain",
    size: 44
  })), /*#__PURE__*/React.createElement("span", {
    className: "preset-info"
  }, /*#__PURE__*/React.createElement("small", null, "2 min de questions"), /*#__PURE__*/React.createElement("strong", null, "Trouver mon protocole"), /*#__PURE__*/React.createElement("span", {
    className: "preset-play"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 17
  })))), zones.map(z => /*#__PURE__*/React.createElement("button", {
    key: z.id,
    className: "preset-workout",
    onClick: () => go('rehab', z.id)
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: rwThumb(z.thumb)
  }), /*#__PURE__*/React.createElement("span", {
    className: "preset-info"
  }, /*#__PURE__*/React.createElement("small", null, painZones.includes(z.id) ? 'Ta douleur' : 'Questionnaire ciblé'), /*#__PURE__*/React.createElement("strong", null, z.label), /*#__PURE__*/React.createElement("span", {
    className: "preset-play"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 17
  })))))));
}
function PTWarmupRail(props) {
  return /*#__PURE__*/React.createElement("section", {
    className: "scroll-reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "WARM UP"), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "Avant de jouer")), /*#__PURE__*/React.createElement("div", {
    className: "workout-rail"
  }, RW.warmups.map(w => /*#__PURE__*/React.createElement("button", {
    key: w.id,
    className: "preset-workout",
    onClick: () => rwLaunch(props, s => RW.warmupPlan(PT, window.PlayerProfile, s, w.id))
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: rwThumb(w.thumb)
  }), /*#__PURE__*/React.createElement("span", {
    className: "preset-info"
  }, /*#__PURE__*/React.createElement("small", null, w.minutes, " min"), /*#__PURE__*/React.createElement("strong", null, w.title), /*#__PURE__*/React.createElement("span", {
    className: "preset-play"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 17
  })))))));
}
function PTRehabSources({
  ids
}) {
  return /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Sur quoi c\u2019est bas\xE9"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, ids.map(k => RW.sources[k]).filter(Boolean).map(s => /*#__PURE__*/React.createElement("li", {
    key: s.url
  }, /*#__PURE__*/React.createElement("a", {
    href: s.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, s.label)))));
}
function PTRehabQuiz({
  data,
  update,
  go,
  notify,
  id
}) {
  const [answers, setAnswers] = usePTState(() => {
    const pre = RW.prefill(data);
    const zone = RW.zones.some(z => z.id === id) ? id : pre.zone || null;
    const same = zone && zone === pre.zone;
    return {
      zone,
      where: same ? pre.where || null : null,
      severity: same && pre.severity != null ? pre.severity : 3,
      side: same && pre.side || 'right',
      onset: same ? pre.onset || null : null,
      flags: [],
      flagsChecked: false,
      triggers: [],
      minutes: 15,
      fromSymptom: same ? pre.fromSymptom : null
    };
  });
  const [step, setStep] = usePTState(0),
    [level, setLevel] = usePTState(null),
    [save, setSave] = usePTState(true);
  const set = (k, v) => setAnswers(a => ({
    ...a,
    [k]: v
  }));
  const zoneWhere = RW.where[answers.zone] || [];
  // Une seule option d'endroit : choisie d'office.
  const where = answers.where || (zoneWhere.length === 1 ? zoneWhere[0][0] : null);
  const full = {
    ...answers,
    where
  };
  const result = step === 3 ? RW.pick(full, data) : null;
  const chosenLevel = result && result.protocol ? Math.min(level ?? result.level, 2) : 0;
  const hasSymptom = !!answers.fromSymptom || PT.activeSymptoms(data).some(s => result?.protocol && s.region === result.protocol.region);
  const steps = [{
    title: 'Où as-tu mal ?',
    intro: 'Choisis la zone, puis l’endroit le plus précis possible.',
    valid: !!answers.zone && !!where
  }, {
    title: 'Comment ça va ?',
    intro: 'L’intensité et l’ancienneté choisissent le niveau de départ.',
    valid: !!answers.onset
  }, {
    title: 'Ce qu’il faut vérifier.',
    intro: 'Avant tout exercice ciblé, quelques signes demandent l’avis d’un professionnel.',
    valid: answers.flagsChecked
  }, {
    title: 'Ton protocole.',
    intro: 'Un protocole publié, adapté à ton matériel et à ta douleur.',
    valid: true
  }];
  const next = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  const launch = () => {
    const protocol = result.protocol;
    const symptom = save && !hasSymptom && Number(answers.severity) > 0 ? {
      id: PT.uid(),
      region: protocol.region,
      side: answers.side,
      severity: Number(answers.severity),
      onset: answers.onset === 'acute' ? 'new' : 'known',
      redFlags: false,
      note: `Quick Rehab · ${protocol.title}`,
      date: PT.dateKey(),
      active: true,
      followups: []
    } : null;
    const nextState = symptom ? {
      ...data,
      symptoms: [...data.symptoms, symptom]
    } : data;
    if (data.draft?.status === 'active') {
      go('session');
      notify('Ta séance en cours est conservée.');
      return;
    }
    const plan = RW.rehabPlan(PT, window.PlayerProfile, nextState, protocol.id, chosenLevel, answers.minutes);
    if (plan.error) {
      notify(plan.error);
      return;
    }
    update(s => ({
      ...s,
      symptoms: symptom ? [...s.symptoms, symptom] : s.symptoms,
      draft: plan
    }));
    go('preview');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "rehab-quiz"
  }, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "Quick Rehab",
    title: steps[step].title,
    onBack: step === 0 ? () => go('today') : () => setStep(step - 1)
  }, steps[step].intro), /*#__PURE__*/React.createElement("div", {
    className: "step-caption"
  }, /*#__PURE__*/React.createElement("span", null, "Ta douleur"), /*#__PURE__*/React.createElement("span", null, step + 1, " / ", steps.length)), /*#__PURE__*/React.createElement("div", {
    className: "step-track"
  }, steps.map((_, i) => /*#__PURE__*/React.createElement("span", {
    className: i <= step ? 'done' : '',
    key: i
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, step === 0 && /*#__PURE__*/React.createElement(React.Fragment, null, answers.fromSymptom && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Pr\xE9-rempli avec la douleur d\xE9j\xE0 signal\xE9e dans ton suivi."), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Zone"), /*#__PURE__*/React.createElement(PTChoices, {
    value: answers.zone,
    onChange: v => setAnswers(a => ({
      ...a,
      zone: v,
      where: null
    })),
    options: RW.zones.map(z => ({
      value: z.id,
      label: z.label,
      icon: z.icon,
      hint: RW.activeZones(data).includes(z.id) ? 'Douleur signalée' : undefined
    }))
  })), zoneWhere.length > 1 && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "O\xF9 exactement ?"), /*#__PURE__*/React.createElement(PTChoices, {
    columns: 1,
    value: where,
    onChange: v => set('where', v),
    options: zoneWhere.map(([value, label]) => ({
      value,
      label,
      hint: value !== 'unknown' ? RW.byId(value)?.short : 'On s’appuie sur ce qui déclenche la douleur'
    }))
  }))), step === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTField, {
    label: `Intensité ressentie : ${answers.severity} / 10`,
    hint: "0 = aucune douleur, tu veux pr\xE9venir. 7 et plus : avis m\xE9dical avant de reprendre."
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "10",
    step: "1",
    value: answers.severity,
    onChange: e => set('severity', Number(e.target.value))
  })), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "C\xF4t\xE9"), /*#__PURE__*/React.createElement(PTChips, {
    value: answers.side,
    onChange: v => set('side', v),
    options: rwSides
  })), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Depuis quand ?"), /*#__PURE__*/React.createElement(PTChoices, {
    value: answers.onset,
    onChange: v => set('onset', v),
    options: RW.onsets.map(([value, label]) => ({
      value,
      label
    }))
  }))), step === 2 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "As-tu un de ces signes ?"), /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    value: answers.flags,
    onChange: v => setAnswers(a => ({
      ...a,
      flags: v,
      flagsChecked: true
    })),
    options: RW.redFlags.map(([value, label]) => ({
      value,
      label
    }))
  }), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    "aria-pressed": answers.flagsChecked && !answers.flags.length,
    onClick: () => setAnswers(a => ({
      ...a,
      flags: [],
      flagsChecked: true
    }))
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 18
  }), "Aucun de ces signes")), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Qu\u2019est-ce qui d\xE9clenche la douleur ? ", /*#__PURE__*/React.createElement("small", {
    className: "caption"
  }, "\xB7 facultatif")), /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    value: answers.triggers,
    onChange: v => set('triggers', v),
    options: RW.triggers.map(([value, label]) => ({
      value,
      label
    }))
  }))), step === 3 && result && (result.stop ? /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("p", {
    className: "notice warning",
    role: "alert"
  }, result.reason), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Note-le dans ton suivi : les s\xE9ances g\xE9n\xE9r\xE9es en tiendront compte et resteront suspendues tant que le signe est pr\xE9sent."), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('symptoms')
  }, "Signaler cette douleur"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('today')
  }, "Revenir \xE0 aujourd\u2019hui"))) : result.error ? /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, result.error) : /*#__PURE__*/React.createElement("section", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, RW.zones.find(z => z.id === result.protocol.zone)?.label), /*#__PURE__*/React.createElement("h2", null, result.protocol.title), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, result.protocol.short, ".")), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Niveau"), /*#__PURE__*/React.createElement(PTChoices, {
    columns: 3,
    value: chosenLevel,
    onChange: setLevel,
    options: RW.LEVELS.map((label, i) => ({
      value: i,
      label,
      hint: i === result.level ? 'Conseillé' : undefined
    }))
  }), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, RW.levelHints[chosenLevel]), chosenLevel > result.level && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, "Plus haut que le niveau conseill\xE9 : arr\xEAte d\xE8s que la douleur d\xE9passe 2/10.")), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Dur\xE9e"), /*#__PURE__*/React.createElement(PTChips, {
    value: answers.minutes,
    onChange: v => set('minutes', v),
    options: [{
      value: 10,
      label: '≈ 10 min'
    }, {
      value: 15,
      label: '≈ 15 min'
    }, {
      value: 20,
      label: '≈ 20 min'
    }]
  })), !hasSymptom && Number(answers.severity) > 0 && /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: save,
    onChange: e => setSave(e.target.checked)
  }), " Ajouter cette douleur \xE0 mon suivi (", answers.severity, "/10). Les s\xE9ances du programme en tiendront compte."), /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "R\xE8gle de la douleur : 2/10 au maximum pendant l\u2019effort, revenue \xE0 la normale le lendemain. Ce protocole ne remplace pas l\u2019avis d\u2019un kin\xE9."), /*#__PURE__*/React.createElement(PTRehabSources, {
    ids: result.protocol.sources
  }), /*#__PURE__*/React.createElement("div", {
    className: "rehab-launch"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: launch
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 22
  }), "Voir ma s\xE9ance")))), step < 3 && /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, !steps[step].valid && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, step === 2 ? 'Coche les signes présents, ou « Aucun de ces signes ».' : 'Réponds pour continuer.'), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !steps[step].valid,
    onClick: next
  }, step === 2 ? 'Voir mon protocole' : 'Continuer', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
}

// Dans l'aperçu d'une séance du programme : proposer de retirer le temps déjà fait aujourd'hui en rehab ou en warm-up.
function PTCreditPrompt({
  data,
  update,
  notify
}) {
  const plan = data.draft;
  const credit = RW.pendingCredit(data);
  if (!credit || !RW.canCredit(plan) || plan.status !== 'preview') return null;
  const handled = sessions => sessions.map(x => credit.sessionIds.includes(x.id) ? {
    ...x,
    creditHandled: true
  } : x);
  const accept = () => {
    update(s => ({
      ...s,
      draft: RW.applyCredit(PT, s.draft, credit),
      sessions: handled(s.sessions)
    }));
    notify(`Séance ajustée : ${credit.minutes} min déjà faites aujourd’hui.`);
  };
  const decline = () => update(s => ({
    ...s,
    draft: {
      ...s.draft,
      creditDeclined: true
    },
    sessions: handled(s.sessions)
  }));
  return /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm credit-prompt",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("h3", null, "D\xE9j\xE0 ", credit.minutes, " min aujourd\u2019hui"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, credit.labels.join(' + '), ". Retirer ", credit.minutes, " min de cette s\xE9ance ?", credit.warmup ? ' L’échauffement est déjà fait.' : ''), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: accept
  }, "Oui, ajuster"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: decline
  }, "Non, garder")));
}

// Fin d'une séance de rehab : la douleur ressentie règle le niveau suivant.
function PTRehabPainAfter({
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "effort-picker stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Douleur sur la zone, maintenant ?"), /*#__PURE__*/React.createElement("div", {
    className: "effort-scale",
    role: "group",
    "aria-label": "Douleur de 0 \xE0 10"
  }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    "aria-label": `Douleur ${n} sur 10`,
    "aria-pressed": value === n,
    onClick: () => onChange(n)
  }, n))), /*#__PURE__*/React.createElement("div", {
    className: "topline caption"
  }, /*#__PURE__*/React.createElement("span", null, "Aucune"), /*#__PURE__*/React.createElement("span", null, "Maximale")), value != null && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, value <= 2 ? 'Bien toléré. Deux séances comme ça et le niveau monte.' : value <= 5 ? 'Acceptable si ça revient à la normale demain. Le niveau reste le même.' : 'Trop douloureux : le niveau redescend. Si ça persiste, demande l’avis d’un kiné.'));
}