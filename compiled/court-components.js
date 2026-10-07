/* Questionnaire « Mon jeu » : ressentis terrain, forces, faiblesses, calendrier du club.
   Décisions dans basket-profile.js (priorités, accents) et training-load.js (charge de la semaine). */
function PTBasketProfile({
  data,
  update,
  go,
  notify
}) {
  const C = window.BasketProfile;
  const [form, setForm] = usePTState(() => C.validate(data.basketProfile) || C.blank()),
    [error, setError] = usePTState('');
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const skillOptions = Object.entries(C.skills).map(([value, s]) => ({
    value,
    label: s.label
  }));
  // Trois au plus : au-delà, plus rien n'est prioritaire.
  const pickUpTo3 = (k, v) => {
    if (v.length > 3) {
      setError('Trois choix au maximum : garde les plus marquants.');
      return;
    }
    setError('');
    set(k, v);
  };
  const save = () => {
    if (!form.weaknesses.length) {
      setError('Choisis au moins une situation où tu te sens en difficulté.');
      return;
    }
    const clean = C.save(form);
    update(s => ({
      ...s,
      basketProfile: clean
    }));
    notify('« Mon jeu » enregistré : ton parcours et ta muscu en tiennent compte.');
    go(data.program && data.program.status !== 'archived' ? 'program' : 'pathway');
  };
  const summary = C.summary(C.validate(form) && {
    ...C.validate(form),
    date: 'x'
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    eyebrow: "Questionnaire basket",
    title: "Mon jeu."
  }, "Ce que tu vis sur le terrain. Tes r\xE9ponses r\xE8glent les priorit\xE9s du parcours, l\u2019accent de ta muscu et la charge de ta semaine."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg coach-form"
  }, /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "O\xF9 es-tu en difficult\xE9 sur le terrain ? (3 au plus)"
  }, /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    options: skillOptions,
    value: form.weaknesses,
    onChange: v => pickUpTo3('weaknesses', v.filter(x => !form.strengths.includes(x)))
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Tes points forts (3 au plus)"
  }, /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    options: skillOptions.filter(o => !form.weaknesses.includes(o.value)),
    value: form.strengths,
    onChange: v => pickUpTo3('strengths', v)
  }), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "On les entretient sans y passer de temps en plus.")), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Apr\xE8s un match ou un gros entra\xEEnement"
  }, /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    options: C.feelings.map(([value, label]) => ({
      value,
      label
    })),
    value: form.feelings,
    onChange: v => set('feelings', v.includes('fine') && !form.feelings.includes('fine') ? ['fine'] : v.filter(x => x !== 'fine'))
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Ta p\xE9riode"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: C.seasons.map(([value, label]) => ({
      value,
      label
    })),
    value: form.season,
    onChange: v => set('season', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Entra\xEEnements au club"
  }, /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    options: C.days.map((label, value) => ({
      value,
      label
    })),
    value: form.practiceDays,
    onChange: v => set('practiceDays', v.filter(d => d !== form.matchDay))
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Jour de match habituel"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: -1,
      label: 'Pas de match fixe'
    }, ...C.days.map((label, value) => ({
      value,
      label
    }))],
    value: form.matchDay === null ? -1 : form.matchDay,
    onChange: v => setForm(f => ({
      ...f,
      matchDay: v === -1 ? null : v,
      practiceDays: f.practiceDays.filter(d => d !== v)
    }))
  }), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Un match saisi dans l\u2019app pour une date pr\xE9cise reste prioritaire.")), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Ce que la muscu doit t\u2019apporter"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: C.goals.map(([value, label]) => ({
      value,
      label
    })),
    value: form.goal,
    onChange: v => set('goal', v)
  })), summary && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, summary), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: save
  }, "Enregistrer mon jeu", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))));
}