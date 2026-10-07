/* Skills basket : questionnaire, paliers, programme, panier du jour, ressenti en fin de séance.
   Décisions dans basket-skills.js (exercices, paliers, séances, blocs) et training-load.js (place dans la semaine). */
const ptSkillsDayLabel = {
  full: 'Bon jour pour une séance skills complète.',
  light: 'Séance skills légère conseillée : tir et dribble sur place, sans saut.',
  blocks: 'Séances skills de la semaine faites : les blocs continuent après tes autres séances.',
  none: 'Pas de séance skills aujourd’hui (club ou match) : le basket est déjà au programme.'
};
function ptSkillsLaunch({
  data,
  update,
  go,
  notify
}, {
  light = false,
  minutes
} = {}) {
  const SK = window.BasketSkills;
  if (data.draft?.status === 'active') {
    go('session');
    notify('Ta séance en cours est conservée.');
    return;
  }
  const plan = SK.session(PT, data, {
    minutes,
    light
  });
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
function PTSkillsHome({
  data,
  update,
  go,
  notify
}) {
  const SK = window.BasketSkills,
    TL = window.TrainingLoad;
  const s = SK.validate(data.skills),
    day = TL ? TL.day(data) : null,
    hoop = SK.hoopToday(s);
  const setSkills = fn => update(st => ({
    ...st,
    skills: fn(SK.validate(st.skills))
  }));
  if (!SK.complete(s)) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    eyebrow: "Skills basket",
    title: "Mes skills."
  }, "Dribble, tir, finition, appuis : un programme \xE0 ton niveau, reli\xE9 \xE0 ta muscu et \xE0 ton parcours."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("section", {
    className: "card stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Commence par le questionnaire"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Deux minutes : tu notes chaque point (main faible, dribble t\xEAte haute, catch & shoot, finition\u2026). Ton palier de d\xE9part et tes priorit\xE9s en sortent."), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('skills-quiz')
  }, "Faire le questionnaire", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, Object.entries(SK.areas).map(([id, a]) => /*#__PURE__*/React.createElement("div", {
    key: id,
    className: "home-action"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "basket"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, a.label), /*#__PURE__*/React.createElement("small", null, a.style ? `Inspiration ${a.style} · ` : '', a.why)))))));
  const prog = s.program || {
    perWeek: 2,
    minutes: 45,
    blocks: true,
    blockMinutes: 15,
    status: 'active'
  };
  const setProg = (k, v) => setSkills(x => ({
    ...x,
    program: {
      ...prog,
      ...(x.program || {}),
      [k]: v
    }
  }));
  const prio = SK.priorities(s, data.player).slice(0, 3);
  const last = [...s.log].reverse().slice(0, 5);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    eyebrow: "Skills basket",
    title: "Mes skills."
  }, SK.summary(s)), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Aujourd\u2019hui"), /*#__PURE__*/React.createElement("strong", null, day ? ptSkillsDayLabel[day.skills] : 'Séance skills disponible.'), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: hoop,
    onChange: e => setSkills(x => ({
      ...x,
      hoopDate: e.target.checked ? PT.dateKey() : null
    }))
  }), "J\u2019ai un panier aujourd\u2019hui"), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: day && day.skills === 'none',
    onClick: () => ptSkillsLaunch({
      data,
      update,
      go,
      notify
    }, {
      light: day?.skills === 'light'
    })
  }, day?.skills === 'light' ? 'Lancer la séance légère' : 'Lancer une séance skills', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), day && day.skills === 'blocks' && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => ptSkillsLaunch({
      data,
      update,
      go,
      notify
    }, {
      light: true,
      minutes: 30
    })
  }, "Une s\xE9ance de plus quand m\xEAme (30 min, l\xE9g\xE8re)")), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "Mes paliers"), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, Object.entries(SK.areas).map(([id, a]) => /*#__PURE__*/React.createElement("div", {
    key: id,
    className: "home-action"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "basket"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, a.label, " \xB7 ", SK.TIERS[s.levels[id] - 1]), /*#__PURE__*/React.createElement("small", null, a.style ? `Inspiration ${a.style} · ` : '', a.why))))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Tu montes d\u2019un palier apr\xE8s deux s\xE9ances \xAB trop facile \xBB (ou 70 % de tirs r\xE9ussis), tu redescends apr\xE8s deux \xAB trop dur \xBB (ou moins de 35 %).")), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Mes priorit\xE9s"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, prio.map(p => /*#__PURE__*/React.createElement("li", {
    key: p.id
  }, p.label, " \xB7 ", SK.areas[p.area].short.toLowerCase())))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "Mon programme skills"), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "S\xE9ances skills par semaine"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [1, 2, 3, 4].map(n => ({
      value: n,
      label: `${n}`
    })),
    value: prog.perWeek,
    onChange: v => setProg('perWeek', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Dur\xE9e d\u2019une s\xE9ance skills"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [30, 45, 60].map(n => ({
      value: n,
      label: `${n} min`
    })),
    value: prog.minutes,
    onChange: v => setProg('minutes', v)
  })), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: prog.blocks !== false,
    onChange: e => setProg('blocks', e.target.checked)
  }), "Ajouter un bloc skills apr\xE8s mes s\xE9ances muscu et parcours"), prog.blocks !== false && /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Dur\xE9e du bloc ajout\xE9"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [10, 15, 20].map(n => ({
      value: n,
      label: `${n} min`
    })),
    value: prog.blockMinutes,
    onChange: v => setProg('blockMinutes', v)
  }), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Apr\xE8s le haut du corps : dribble puis tir. Jour de footing : finition au cercle. Apr\xE8s les jambes : tir de forme, sans saut. Rien les jours de club ou de match."))), last.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Derni\xE8res s\xE9ances"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, last.map((x, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, x.date.slice(8, 10), "/", x.date.slice(5, 7), " \xB7 ", SK.areas[x.area].short, " \xB7 ", {
    easy: 'trop facile',
    right: 'juste',
    hard: 'trop dur'
  }[x.rating], x.attempts ? ` · ${x.made}/${x.attempts} tirs` : '')))), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('skills-quiz')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Refaire le questionnaire"), /*#__PURE__*/React.createElement("small", null, "Tes paliers seront recalcul\xE9s.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('library')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "book"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Tous les exercices"), /*#__PURE__*/React.createElement("small", null, "Onglet \xAB Basket \xBB de la biblioth\xE8que.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
}
function PTSkillsQuiz({
  data,
  update,
  go,
  notify
}) {
  const SK = window.BasketSkills,
    prev = SK.validate(data.skills);
  const [answers, setAnswers] = usePTState(prev.profile.answers),
    [tests, setTests] = usePTState({
      freeThrows: prev.profile.tests.freeThrows ?? '',
      spotShooting: prev.profile.tests.spotShooting ?? ''
    }),
    [error, setError] = usePTState('');
  const missing = Object.keys(SK.items).filter(k => answers[k] == null);
  const save = () => {
    if (missing.length) {
      setError(`Il reste ${missing.length} point${missing.length > 1 ? 's' : ''} à noter.`);
      return;
    }
    const next = SK.saveProfile(data.skills, {
      answers,
      tests
    });
    update(s => ({
      ...s,
      skills: next
    }));
    notify(`Paliers : ${Object.entries(SK.areas).map(([a, x]) => `${x.short} ${SK.TIERS[next.levels[a] - 1].toLowerCase()}`).join(', ')}.`);
    go('skills');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('skills'),
    eyebrow: "Questionnaire skills",
    title: "O\xF9 en es-tu ?"
  }, "Note chaque point comme tu le vis en match, pas \xE0 l\u2019entra\xEEnement tranquille."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg coach-form"
  }, Object.entries(SK.areas).map(([area, a]) => /*#__PURE__*/React.createElement("section", {
    key: area,
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, a.label), Object.entries(SK.items).filter(([, v]) => v.area === area).map(([id, v]) => /*#__PURE__*/React.createElement(PTCoachQ, {
    key: id,
    title: v.label
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: SK.ratings.map(([value, label]) => ({
      value,
      label
    })),
    value: answers[id],
    onChange: n => setAnswers(x => ({
      ...x,
      [id]: n
    }))
  }))))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Tests de tir (facultatifs)"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Avec un panier : ils ajustent ton palier de tir. Tes r\xE9sultats servent de rep\xE8re personnel."), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Lancers francs r\xE9ussis sur 20",
    type: "number",
    min: "0",
    max: "20",
    value: tests.freeThrows,
    onChange: e => setTests(t => ({
      ...t,
      freeThrows: e.target.value
    }))
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Mi-distance r\xE9ussis sur 25 (5 positions \xD7 5)",
    type: "number",
    min: "0",
    max: "25",
    value: tests.spotShooting,
    onChange: e => setTests(t => ({
      ...t,
      spotShooting: e.target.value
    }))
  }))), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: save
  }, "Calculer mes paliers", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))));
}

// Aperçu : « panier aujourd'hui » reconstruit la séance skills ou le bloc ajouté.
function PTSkillsHoop({
  data,
  update,
  plan
}) {
  const SK = window.BasketSkills;
  if (!SK || !plan || !(plan.source === 'skills' || plan.exercises.some(e => e.skillBlock))) return null;
  const hoop = SK.hoopToday(data.skills);
  const toggle = on => update(s => {
    const skills = {
        ...SK.validate(s.skills),
        hoopDate: on ? PT.dateKey() : null
      },
      st = {
        ...s,
        skills
      };
    let draft = s.draft;
    if (draft.source === 'skills') {
      const next = SK.session(PT, st, {
        minutes: draft.check?.minutes,
        light: draft.reasons.some(r => r.startsWith('Version légère'))
      });
      if (!next.error) draft = next;
    } else {
      const base = {
        ...draft,
        exercises: draft.exercises.filter(e => !e.skillBlock),
        reasons: draft.reasons.filter(r => !r.startsWith('Bloc skills')),
        estimatedMinutes: (draft.estimatedMinutes || 0) - (draft.skillBlockMinutes || 0)
      };
      draft = SK.withBlock(PT, st, base, {});
    }
    return {
      ...st,
      draft
    };
  });
  return /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: hoop,
    onChange: e => toggle(e.target.checked)
  }), "J\u2019ai un panier aujourd\u2019hui (tir et finition ajout\xE9s)");
}

// Fin de séance : ressenti par domaine, il fait évoluer les paliers avec les tirs notés.
function PTSkillsRating({
  draft,
  value,
  onChange
}) {
  const SK = window.BasketSkills;
  const list = [...new Set((draft.exercises || []).map(e => e.skillArea).filter(Boolean))];
  if (!SK || !list.length) return null;
  return /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Les skills, c\u2019\xE9tait\u2026"), list.map(a => /*#__PURE__*/React.createElement(PTCoachQ, {
    key: a,
    title: SK.areas[a].label
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'easy',
      label: 'Trop facile'
    }, {
      value: 'right',
      label: 'Juste'
    }, {
      value: 'hard',
      label: 'Trop dur'
    }],
    value: value[a],
    onChange: v => onChange({
      ...value,
      [a]: v
    })
  }))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Sans r\xE9ponse, tes tirs r\xE9ussis d\xE9cident."));
}