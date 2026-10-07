/* Bilan athlétique : ressenti, tests terrain facultatifs, résultat et ce qu'il change dans le parcours. Réutilise les composants de personal-app.jsx et pathway-components.jsx. */
const AP = window.AthleticProfile;
const apLevelClass = level => level === null ? 'is-unknown' : ['is-low', 'is-mid', 'is-high'][level];
// Étiquette affichée dans l'aperçu de séance pour le bloc kiné et le créneau du bilan.
const ptRoleTag = e => e.pathwayRole === 'soin' ? e.carePhase === 'calm' ? 'Soin · calmer' : 'Soin · renforcer' : e.pathwayRole === 'kiné' || e.role === 'rehab' || e.role === 'kine' ? 'Kiné' : e.pathwayRole === 'point faible' ? 'Point faible' : e.pathwayRole === 'priorité' ? e.courtFocus ? 'Priorité terrain' : 'Priorité du bilan' : null;
const apFresh = a => !!(a && a.date) && PT.dayDiff(PT.dateKey(), a.date) <= 28;
function PTAssessment({
  data,
  update,
  go,
  notify,
  id
}) {
  // bilan/tests ouvre directement les tests terrain (détente, RSI, sprint…), sans repasser par le questionnaire.
  const [step, setStep] = usePTState(id === 'tests' ? 1 : 0);
  const [draft, setDraft] = usePTState(() => AP.validateAthletic(data.athletic) || AP.create());
  // Chaque réponse et chaque mesure est gardée tout de suite : rien n'est perdu si le bilan est interrompu.
  const keep = next => {
    setDraft(next);
    update(s => ({
      ...s,
      athletic: next
    }));
  };
  const answer = (id, value) => keep({
    ...draft,
    answers: {
      ...draft.answers,
      [id]: value
    }
  });
  const steps = [{
    title: 'Ton ressenti.',
    intro: 'Dix questions sur ton corps aujourd’hui, comparé à avant ta pause. Pas de bonne réponse : c’est ce qui oriente ton programme.',
    valid: AP.answered(draft)
  }, {
    title: 'Tes tests.',
    intro: 'Facultatifs : un mur, un mètre et ton téléphone suffisent. Chaque mesure rend le bilan plus précis. Tu peux les faire maintenant ou plus tard.',
    valid: true
  }, {
    title: 'Ton bilan.',
    intro: 'Tes qualités, tes priorités et ce qu’elles changent dans tes séances.',
    valid: true
  }];
  const next = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "Bilan physique",
    title: steps[step].title,
    onBack: step === 0 ? () => go(data.pathway ? 'pathway' : 'today') : () => setStep(step - 1)
  }, steps[step].intro), /*#__PURE__*/React.createElement("div", {
    className: "step-caption"
  }, /*#__PURE__*/React.createElement("span", null, "Ton \xE9tat physique"), /*#__PURE__*/React.createElement("span", null, step + 1, " / ", steps.length)), /*#__PURE__*/React.createElement("div", {
    className: "step-track"
  }, steps.map((_, i) => /*#__PURE__*/React.createElement("span", {
    className: i <= step ? 'done' : '',
    key: i
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, step === 0 && AP.questions.map(q => /*#__PURE__*/React.createElement("section", {
    key: q.id,
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, q.label, q.optional ? /*#__PURE__*/React.createElement("small", {
    className: "caption"
  }, " \xB7 facultatif") : null), q.multi ? /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    value: draft.answers[q.id] || [],
    onChange: v => answer(q.id, v),
    options: q.options.map(([value, label]) => ({
      value,
      label
    }))
  }) : /*#__PURE__*/React.createElement(PTChoices, {
    value: draft.answers[q.id],
    onChange: v => answer(q.id, v),
    options: q.options.map(([value, label]) => ({
      value,
      label
    }))
  }))), step === 1 && /*#__PURE__*/React.createElement(PTAssessmentTests, {
    data: data,
    draft: draft,
    keep: keep,
    open: id === 'tests' ? 'jump' : null
  }), step === 2 && /*#__PURE__*/React.createElement(PTAssessmentResult, {
    data: data,
    draft: draft,
    update: update,
    go: go,
    notify: notify
  }), step < 2 && /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, !steps[step].valid && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "R\xE9ponds \xE0 chaque question pour continuer."), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !steps[step].valid,
    onClick: next
  }, step === 1 ? 'Voir mon bilan' : 'Continuer', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
}
function PTAssessmentTests({
  data,
  draft,
  keep,
  open
}) {
  const groups = AP.testGroups(data);
  const hidden = groups.some(g => g.tests.some(t => t.hidden));
  return /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, hidden && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, "Une douleur des jambes est signal\xE9e : les sauts, les sprints et les navettes sont masqu\xE9s. On les fera quand elle sera calm\xE9e."), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "\xC9chauffe-toi 5 minutes avant les sauts et les sprints. Arr\xEAte un test qui r\xE9veille une douleur."), groups.map(g => {
    const visible = g.tests.filter(t => !t.hidden);
    if (!visible.length) return null;
    const measured = visible.filter(t => AP.latest(draft, t.id)).length;
    return /*#__PURE__*/React.createElement("details", {
      key: g.id,
      className: "disclosure test-group",
      open: g.id === open || undefined
    }, /*#__PURE__*/React.createElement("summary", null, g.label, " \xB7 ", measured, " / ", visible.length), /*#__PURE__*/React.createElement("div", {
      className: "stack"
    }, visible.map(t => /*#__PURE__*/React.createElement(PTAssessmentTest, {
      key: t.id,
      test: t,
      draft: draft,
      keep: keep
    }))));
  }));
}
function PTAssessmentTest({
  test: t,
  draft,
  keep
}) {
  const [form, setForm] = usePTState(ptBlankTest);
  const [error, setError] = usePTState('');
  const last = AP.latest(draft, t.id);
  const result = last && AP.evaluate(t.id, last, draft.tests[t.id]);
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const save = () => {
    const {
      values,
      error
    } = ptTestValues(t, form);
    if (error) {
      setError(error);
      return;
    }
    keep(AP.recordTest(draft, t.id, values));
    setForm(ptBlankTest);
    setError('');
  };
  return /*#__PURE__*/React.createElement("article", {
    className: "test-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h3", null, t.label), result && /*#__PURE__*/React.createElement("span", {
    className: `caption${result.ok ? ' is-ok' : ''}`
  }, result.detail)), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, t.why), /*#__PURE__*/React.createElement("ol", {
    className: "instruction-list"
  }, t.how.map(line => /*#__PURE__*/React.createElement("li", {
    key: line
  }, line))), t.target && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Rep\xE8re : ", t.target, "."), (t.video || t.id === 'sprint10') && typeof PTVideoMeasure === 'function' && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Mesurer avec une vid\xE9o au ralenti"), /*#__PURE__*/React.createElement(PTVideoMeasure, {
    mode: t.video || 'sprint',
    onResult: value => {
      keep(AP.recordTest(draft, t.id, {
        value,
        method: 'video'
      }));
      setError('');
    }
  })), /*#__PURE__*/React.createElement(PTTestForm, {
    test: t,
    form: form,
    set: set
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    onClick: save
  }, last ? 'Remesurer' : 'Enregistrer', /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 18
  })));
}
function PTAssessmentResult({
  data,
  draft,
  update,
  go,
  notify
}) {
  const player = data.player || {};
  const res = AP.assess(draft),
    targets = AP.targets(draft, player);
  const preview = {
    ...data,
    athletic: draft
  };
  const start = AP.recommendedStart(preview);
  const pathway = data.pathway || BP.create({
    startStep: start.step
  });
  const step = BP.stepById(pathway.step);
  const days = step.days.map(day => {
    const plan = BP.sessionPlan(PT, JP, preview, pathway, day.key);
    return {
      day,
      items: plan.error ? [] : plan.exercises.filter(e => ptRoleTag(e))
    };
  });
  const tracked = ['vertical', 'broad', 'sprint5', 'sprint10'].map(id => ({
    id,
    t: AP.allTests()[id],
    r: AP.latest(draft, id),
    before: AP.previousValue(draft, id)
  })).filter(x => x.r);
  const apply = () => {
    const done = AP.finalize(draft);
    update(s => ({
      ...s,
      athletic: done,
      pathway: AP.seedPathwayTests(s.pathway || BP.create({
        startStep: start.step
      }), done)
    }));
    notify(data.pathway ? 'Bilan enregistré : tes séances ciblent maintenant tes points faibles.' : `Bilan enregistré : parcours lancé à l’étape ${start.step}.`);
    go('pathway');
  };
  const saveOnly = () => {
    update(s => ({
      ...s,
      athletic: AP.finalize(draft)
    }));
    notify('Bilan enregistré.');
    go('today');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Tes qualit\xE9s"), /*#__PURE__*/React.createElement("ul", {
    className: "quality-list"
  }, Object.values(res.qualities).map(q => /*#__PURE__*/React.createElement("li", {
    key: q.id,
    className: apLevelClass(q.level)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, q.label), /*#__PURE__*/React.createElement("small", null, q.levelLabel, q.failed.length ? ` · ${q.failed.map(f => f.label.toLowerCase()).join(', ')}` : '')), /*#__PURE__*/React.createElement("span", {
    className: "quality-bar",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null))))), res.asymmetries.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, "\xC9cart entre tes deux jambes : ", res.asymmetries.map(a => `${a.label.toLowerCase()} (côté ${a.weak === 'left' ? 'gauche' : 'droit'} en retrait${a.gap ? `, ${a.gap} %` : ''})`).join(' · '), ". Le travail sur une jambe commencera par ce c\xF4t\xE9.")), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Tes priorit\xE9s"), /*#__PURE__*/React.createElement("ol", {
    className: "step-list"
  }, targets.map((t, i) => /*#__PURE__*/React.createElement("li", {
    key: t.id,
    className: i === 0 ? 'is-current' : ''
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-num"
  }, i + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, t.label), /*#__PURE__*/React.createElement("small", null, t.why)))))), tracked.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Tes r\xE9f\xE9rences"), /*#__PURE__*/React.createElement("ul", {
    className: "criteria-list"
  }, tracked.map(x => /*#__PURE__*/React.createElement("li", {
    key: x.id,
    className: "is-ok"
  }, /*#__PURE__*/React.createElement("span", {
    className: "criteria-mark"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "chart",
    size: 16
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, x.t.label), /*#__PURE__*/React.createElement("small", null, x.r.value, " ", x.t.unit, x.before ? ` · avant : ${x.before.values[x.id]} ${x.t.unit} (${shortDate(x.before.date)})` : ' · première mesure'))))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Pas de norme pour ces tests : tu te compares \xE0 toi-m\xEAme, bilan apr\xE8s bilan.")), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Ce qui change dans ton programme"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, data.pathway ? `Ton parcours est à l’étape ${pathway.step} · ${step.name}. ${start.step < pathway.step ? `Le bilan conseille l’étape ${start.step} : ${start.reason} Tu peux revenir en arrière depuis le parcours.` : 'Tes séances gardent leur étape et gagnent le travail ci-dessous.'}` : `Étape conseillée : ${start.step} · ${step.name}. ${start.reason}`), days.map(({
    day,
    items
  }) => items.length > 0 && /*#__PURE__*/React.createElement("article", {
    key: day.key,
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "exercise-summary"
  }, /*#__PURE__*/React.createElement("span", {
    className: "exercise-number"
  }, day.key), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, day.name))), /*#__PURE__*/React.createElement("ul", {
    className: "dose-list"
  }, items.map(e => /*#__PURE__*/React.createElement("li", {
    key: e.id
  }, /*#__PURE__*/React.createElement("span", null, e.name), /*#__PURE__*/React.createElement("small", null, ptRoleTag(e), " \xB7 ", ptDoseLabel(e))))))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Le bloc kin\xE9 ouvre chaque s\xE9ance : ta zone douloureuse d\u2019abord, puis la mobilit\xE9 qui te manque et les tendons que la s\xE9ance sollicite. Il ne remplace pas l\u2019avis d\u2019un kin\xE9.")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ces rep\xE8res d\u2019entra\xEEnement ne sont pas un diagnostic. Refais ton bilan dans 4 semaines pour mesurer tes progr\xE8s."), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: apply
  }, data.pathway ? 'Appliquer à mon parcours' : `Lancer le parcours à l’étape ${start.step}`, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: saveOnly
  }, "Enregistrer sans toucher au parcours")));
}

// Rappel compact des points faibles, sur l'écran du parcours.
function PTAssessmentSummary({
  data,
  go
}) {
  const a = data.athletic;
  if (!a || !a.date) return /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('bilan')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "chart"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Faire mon bilan physique"), /*#__PURE__*/React.createElement("small", null, "10 questions et des tests facultatifs : tes s\xE9ances cibleront tes points faibles.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }));
  const targets = AP.targets(a, data.player || {});
  return /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("strong", null, "Tes priorit\xE9s du bilan"), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, shortDate(a.date))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, targets.map(t => t.label).join(' · ')), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('bilan')
  }, apFresh(a) ? 'Revoir mon bilan' : 'Refaire mon bilan (4 semaines passées)', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })));
}