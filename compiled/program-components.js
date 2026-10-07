/* Programmes muscu sur plusieurs semaines. Les décisions restent dans PersonalPrograms ; la charge de la semaine dans TrainingLoad.
   Restauré après l'allègement du lot 9, sans la nutrition ni l'ancien programme basket (remplacé par le parcours). */
const PP = window.PersonalPrograms;
const ptProgramWeekLabel = (week, weeks) => `Semaine ${week} sur ${weeks}`;
function PTProgramCatalog({
  data,
  update,
  go,
  notify
}) {
  const [familyId, setFamilyId] = usePTState(PP.families[0].id);
  const [weeks, setWeeks] = usePTState(8);
  const [daysPerWeek, setDaysPerWeek] = usePTState(3);
  const [minutes, setMinutes] = usePTState(Number(data.checkIn.minutes) || 30);
  const [equipment, setEquipment] = usePTState([...new Set(['bodyweight', ...data.owned])]);
  const [constraints, setConstraints] = usePTState(data.checkIn.constraints || []);
  const [error, setError] = usePTState('');
  const [replace, setReplace] = usePTState(false);
  const config = {
    familyId,
    weeks,
    daysPerWeek,
    minutes,
    equipment,
    constraints
  };
  const family = PP.familyById(familyId);
  const fit = PP.compatibility(data, config);
  const preview = fit.ok && !fit.blocked ? (() => {
    const draft = PP.createProgram(data, config);
    return draft.program ? PP.weekPreview(draft.program, 1, data) : null;
  })() : null;
  const create = () => {
    if (data.program && data.program.status !== 'archived' && !replace) {
      setReplace(true);
      return;
    }
    const made = PP.createProgram(data, config);
    if (made.error) {
      setError(made.error);
      return;
    }
    update(s => ({
      ...s,
      program: made.program,
      programArchive: s.program && s.program.id !== made.program.id ? [...(s.programArchive || []), PP.archive(s.program)].slice(-20) : s.programArchive || []
    }));
    notify('Programme créé. Tu peux lancer la première séance quand tu veux.');
    go('program');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('program'),
    eyebrow: "Plusieurs semaines, un cap",
    title: "Cr\xE9er ma muscu."
  }, "Choisis un objectif, ta disponibilit\xE9 r\xE9elle et ton mat\xE9riel. Rien n\u2019est verrouill\xE9 : tu peux mettre en pause ou changer."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "Mon objectif"), /*#__PURE__*/React.createElement("div", {
    className: "program-families"
  }, PP.families.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.id,
    type: "button",
    className: "program-family",
    "aria-pressed": familyId === f.id,
    onClick: () => setFamilyId(f.id)
  }, /*#__PURE__*/React.createElement("strong", null, f.label), /*#__PURE__*/React.createElement("small", null, f.summary)))), family?.basket && !window.BasketProfile?.complete(data.basketProfile) && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Remplis d\u2019abord ", /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('basket-profile')
  }, "Mon jeu"), " : tes faiblesses sur le terrain choisissent l\u2019accent de chaque s\xE9ance."), family?.id === 'condition' && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "S\xE9ances de conditionnement d\u2019inspiration g\xE9n\xE9rale. Aucune affiliation \xE0 une m\xE9thode ou une marque d\xE9pos\xE9e.")), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "Ma disponibilit\xE9"), /*#__PURE__*/React.createElement(PTField, {
    label: "Dur\xE9e du programme"
  }, /*#__PURE__*/React.createElement("select", {
    value: weeks,
    onChange: e => setWeeks(Number(e.target.value))
  }, PP.WEEK_CHOICES.map(w => /*#__PURE__*/React.createElement("option", {
    key: w,
    value: w
  }, w, " semaines")))), /*#__PURE__*/React.createElement(PTField, {
    label: "S\xE9ances par semaine"
  }, /*#__PURE__*/React.createElement("select", {
    value: daysPerWeek,
    onChange: e => setDaysPerWeek(Number(e.target.value))
  }, PP.DAY_CHOICES.map(d => /*#__PURE__*/React.createElement("option", {
    key: d,
    value: d
  }, d, " s\xE9ances")))), /*#__PURE__*/React.createElement(PTField, {
    label: "Temps par s\xE9ance"
  }, /*#__PURE__*/React.createElement("select", {
    value: minutes,
    onChange: e => setMinutes(Number(e.target.value))
  }, PP.MINUTE_CHOICES.map(m => /*#__PURE__*/React.createElement("option", {
    key: m,
    value: m
  }, m, " min"))))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "Mon mat\xE9riel"), /*#__PURE__*/React.createElement(PTEquipment, {
    owned: data.owned,
    selected: equipment,
    onChange: setEquipment
  }), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Mes contraintes"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    options: [{
      value: 'quiet',
      label: 'Pas de bruit'
    }, {
      value: 'no-floor',
      label: 'Pas au sol'
    }, {
      value: 'no-impact',
      label: 'Sans saut'
    }],
    value: constraints,
    onChange: setConstraints
  })))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "Compatibilit\xE9"), fit.blocked ? /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, fit.issues[0]) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, fit.covered, " cr\xE9neaux sur ", fit.total, " trouvent un mouvement compatible avec ce mat\xE9riel et ces contraintes."), fit.issues.map((issue, i) => /*#__PURE__*/React.createElement("p", {
    className: "notice",
    key: i
  }, issue)), !fit.ok && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, "Trop peu de mouvements disponibles pour construire ce programme. Change de mat\xE9riel, de contraintes ou d\u2019objectif."))), preview && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Aper\xE7u de la premi\xE8re semaine"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, preview.map(day => /*#__PURE__*/React.createElement("div", {
    className: "card stack-sm",
    key: day.dayKey
  }, /*#__PURE__*/React.createElement("strong", null, day.name), day.error ? /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, day.error) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "caption"
  }, "~", day.minutes, " min \xB7 ", day.exercises.length, " mouvements"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, day.exercises.map(e => /*#__PURE__*/React.createElement("li", {
    key: e.id
  }, e.name, " \xB7 ", ptDoseLabel(e))))))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Les mouvements rep\xE8res restent les m\xEAmes pendant tout le programme pour que tes charges soient comparables. Les accessoires tournent d\u2019une semaine \xE0 l\u2019autre."))), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), replace && /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack"
  }, /*#__PURE__*/React.createElement("p", null, "Un programme est d\xE9j\xE0 en cours. Le cr\xE9er maintenant archivera l\u2019actuel \u2014 ses s\xE9ances enregistr\xE9es restent dans ton historique."), /*#__PURE__*/React.createElement(PTButton, {
    onClick: create
  }, "Archiver et cr\xE9er le nouveau"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setReplace(false)
  }, "Annuler")), !replace && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !fit.ok || fit.blocked,
    onClick: create
  }, "Cr\xE9er ce programme"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Un programme est un cadre, pas une obligation. Aucune charge n\u2019augmente parce qu\u2019une semaine est pass\xE9e : seules tes s\xE9ries r\xE9ellement enregistr\xE9es comptent.")));
}
function PTProgramHome({
  data,
  update,
  go,
  notify
}) {
  const program = data.program;
  const [confirmLaunch, setConfirmLaunch] = usePTState(null);
  const [confirmArchive, setConfirmArchive] = usePTState(false);
  const [week, setWeek] = usePTState(null);
  const [error, setError] = usePTState('');
  if (!program || program.status === 'archived') return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    eyebrow: "Musculation, \xE0 c\xF4t\xE9 du parcours",
    title: "Ma muscu."
  }, "Un programme sur plusieurs semaines, s\xE9par\xE9 du parcours. Il ne double pas ce que le parcours travaille et s\u2019efface les jours o\xF9 tes jambes doivent rester fra\xEEches."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('program-new')
  }, "Cr\xE9er un programme", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('basket-profile')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "basket"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mon jeu"), /*#__PURE__*/React.createElement("small", null, window.BasketProfile?.complete(data.basketProfile) ? 'Questionnaire rempli : il règle l’accent de la muscu basket.' : 'Forces, faiblesses, club : à remplir avant la muscu basket.')), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), !!(data.programArchive || []).length && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Programmes archiv\xE9s"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, data.programArchive.map(p => {
    const f = PP.familyById(p.familyId),
      pr = PP.progressOf(p);
    return /*#__PURE__*/React.createElement("div", {
      className: "topline",
      key: p.id
    }, /*#__PURE__*/React.createElement("span", {
      className: "fine"
    }, f?.label || p.familyId, " \xB7 ", pr.done, "/", pr.total, " s\xE9ances"), /*#__PURE__*/React.createElement("button", {
      className: "text-button",
      onClick: () => {
        update(s => ({
          ...s,
          program: {
            ...PP.resume(p)
          },
          programArchive: (s.programArchive || []).filter(x => x.id !== p.id)
        }));
        notify('Programme repris là où il s’était arrêté.');
      }
    }, "Reprendre"));
  })))));
  const family = PP.familyById(program.familyId);
  const progress = PP.progressOf(program);
  const shownWeek = week || progress.currentWeek;
  const preview = PP.weekPreview(program, shownWeek, data);
  const paused = program.status === 'paused';

  // Le lancement passe toujours par le check-in de forme : c'est lui qui fixe la version du jour.
  const launch = dayKey => {
    if (data.draft?.status === 'active' && confirmLaunch !== dayKey) {
      setConfirmLaunch(dayKey);
      return;
    }
    setConfirmLaunch(null);
    setError('');
    go('program-checkin', `${shownWeek}:${dayKey}`);
  };
  const TL = window.TrainingLoad,
    day = TL ? TL.day(data) : null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    eyebrow: family?.label,
    title: "Ma muscu."
  }, family?.summary), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("section", {
    className: "card stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("strong", null, ptProgramWeekLabel(progress.currentWeek, program.weeks)), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, progress.phase.name)), /*#__PURE__*/React.createElement("span", {
    className: "mini-progress"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      transform: `scaleX(${progress.ratio})`
    }
  })), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, progress.done, " s\xE9ance", progress.done > 1 ? 's' : '', " enregistr\xE9e", progress.done > 1 ? 's' : '', " sur ", progress.total, " pr\xE9vues. ", progress.phase.note), progress.finished && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Programme termin\xE9. Tu peux le relancer, en cr\xE9er un autre, ou revenir aux s\xE9ances libres."), paused && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Programme en pause. Aucune s\xE9ance n\u2019est compt\xE9e tant qu\u2019il est en pause.")), day && /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Aujourd\u2019hui, avec le reste de ta semaine"), /*#__PURE__*/React.createElement("strong", null, {
    muscu: 'Bon jour pour la muscu.',
    pathway: 'Priorité au parcours aujourd’hui.',
    recovery: 'Jour de récupération.',
    rest: 'Pas de séance aujourd’hui.',
    session: 'Bon jour pour la muscu.'
  }[day.primary]), day.notes.length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, day.notes.map((n, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, n))) : /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Rien au club ni dans l\u2019app ne s\u2019y oppose."), day.protectLegs && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Si tu lances une s\xE9ance, les mouvements lourds pour les jambes en seront retir\xE9s.")), program.notes?.length > 0 && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Compatibilit\xE9 de ce programme"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, program.notes.map((n, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, n))))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h3", null, "Les s\xE9ances de la semaine"), /*#__PURE__*/React.createElement("div", {
    className: "week-switch"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Semaine pr\xE9c\xE9dente",
    disabled: shownWeek <= 1,
    onClick: () => setWeek(Math.max(1, shownWeek - 1))
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 15
  })), /*#__PURE__*/React.createElement("span", null, "S", shownWeek), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": "Semaine suivante",
    disabled: shownWeek >= program.weeks,
    onClick: () => setWeek(Math.min(program.weeks, shownWeek + 1))
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 15
  })))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Consulter une autre semaine ne valide rien et n\u2019augmente aucune charge."), preview.map(day => {
    const entry = (program.completed || []).find(c => c.week === shownWeek && c.day === day.dayKey);
    return /*#__PURE__*/React.createElement("div", {
      className: `card stack-sm${entry ? ' is-done' : ''}`,
      key: day.dayKey
    }, /*#__PURE__*/React.createElement("div", {
      className: "topline"
    }, /*#__PURE__*/React.createElement("strong", null, day.name), entry && /*#__PURE__*/React.createElement("span", {
      className: "caption"
    }, entry.partial ? 'Partielle' : 'Faite', " \xB7 ", shortDate(entry.date))), day.error ? /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, day.error) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
      className: "caption"
    }, "~", day.minutes, " min \xB7 ", day.exercises.length, " mouvements"), /*#__PURE__*/React.createElement("ul", {
      className: "reason-list"
    }, day.exercises.map(e => /*#__PURE__*/React.createElement("li", {
      key: e.id
    }, e.name, " \xB7 ", ptDoseLabel(e)))), !!day.changes?.length && /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, day.changes.join(' ')), confirmLaunch === day.dayKey ? /*#__PURE__*/React.createElement("div", {
      className: "notice warning stack"
    }, /*#__PURE__*/React.createElement("p", null, "Une s\xE9ance est d\xE9j\xE0 en cours. La remplacer effacera ce qui n\u2019a pas \xE9t\xE9 enregistr\xE9."), /*#__PURE__*/React.createElement(PTButton, {
      onClick: () => launch(day.dayKey)
    }, "Remplacer la s\xE9ance en cours"), /*#__PURE__*/React.createElement(PTButton, {
      quiet: true,
      onClick: () => {
        setConfirmLaunch(null);
        go('session');
      }
    }, "Reprendre la s\xE9ance en cours")) : /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      disabled: paused,
      onClick: () => launch(day.dayKey)
    }, entry ? 'Refaire cette séance' : 'Lancer cette séance', /*#__PURE__*/React.createElement(PTIcon, {
      name: "arrow",
      size: 18
    })), entry && /*#__PURE__*/React.createElement("button", {
      className: "text-button",
      onClick: () => {
        update(s => ({
          ...s,
          program: {
            ...s.program,
            completed: s.program.completed.filter(c => !(c.week === shownWeek && c.day === day.dayKey))
          }
        }));
        notify('Séance décochée dans le programme. Ton historique n’est pas modifié.');
      }
    }, "Retirer du suivi")));
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error)), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "G\xE9rer ce programme"), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, paused ? /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => {
      update(s => ({
        ...s,
        program: PP.resume(s.program)
      }));
      notify('Programme repris.');
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Reprendre"), /*#__PURE__*/React.createElement("small", null, "Repartir de la semaine ", progress.currentWeek, ".")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })) : /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => {
      update(s => ({
        ...s,
        program: PP.pause(s.program)
      }));
      notify('Programme mis en pause. Les séances libres restent disponibles.');
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "pause"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mettre en pause"), /*#__PURE__*/React.createElement("small", null, "Sans perdre l\u2019avancement.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('program-new')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "shuffle"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Changer de programme"), /*#__PURE__*/React.createElement("small", null, "L\u2019actuel sera archiv\xE9, pas supprim\xE9.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('basket-profile')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "basket"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mon jeu"), /*#__PURE__*/React.createElement("small", null, "Forces, faiblesses, calendrier du club.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), confirmArchive ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack"
  }, /*#__PURE__*/React.createElement("p", null, "Arr\xEAter ce programme ? Il est archiv\xE9 : tu pourras le reprendre plus tard, et les s\xE9ances enregistr\xE9es restent dans ton historique."), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => {
      update(s => ({
        ...s,
        program: null,
        programArchive: [...(s.programArchive || []), PP.archive(s.program)].slice(-20)
      }));
      notify('Programme archivé.');
      go('program');
    }
  }, "Oui, arr\xEAter ce programme"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setConfirmArchive(false)
  }, "Annuler")) : /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => setConfirmArchive(true)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "close",
    size: 18
  }), "Arr\xEAter ce programme"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Rep\xE8res de charge : conventions d\u2019entra\xEEnement courantes (pas de jambes lourdes la veille d\u2019un match, 24 h entre deux s\xE9ances de jambes, objectif de s\xE9ances par semaine de ton profil). Ce ne sont pas des normes m\xE9dicales."))));
}

// Check-in de forme avant chaque séance de programme : la séance s'adapte, elle ne se saute pas.
function PTProgramCheckIn({
  data,
  update,
  go,
  notify,
  id
}) {
  const program = data.program;
  const [rawWeek, dayKey] = String(id || '').split(':');
  const week = Math.max(1, Math.min(Number(rawWeek) || 1, Number(program?.weeks) || 1));
  const [answers, setAnswers] = usePTState({});
  const [minutes, setMinutes] = usePTState(Number(program?.minutes) || 30);
  const [error, setError] = usePTState('');
  if (!program || program.status === 'archived' || !program.days.includes(dayKey)) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('program'),
    title: "S\xE9ance introuvable."
  }), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('program')
  }, "Revenir \xE0 mon programme"));
  const family = PP.familyById(program.familyId);
  const dayName = family?.days.find(d => d.key === dayKey)?.name || dayKey;
  const answered = PP.READINESS_QUESTIONS.every(q => answers[q.id] !== undefined);
  const level = PP.readinessLevel(answers);
  const check = PP.checkForSession(data, program, {
    answers,
    minutes
  });
  const preview = answered ? PP.sessionPlan(program, week, dayKey, data, check) : null;
  const launch = () => {
    const plan = PP.sessionPlan(program, week, dayKey, data, check);
    if (plan.error) {
      setError(plan.error);
      return;
    }
    // Le check-in du jour vit avec la séance, jamais dans les préférences durables.
    const persisted = Object.assign({}, plan.check);
    delete persisted.readiness;
    update(s => ({
      ...s,
      checkIn: {
        ...s.checkIn,
        ...persisted
      },
      draft: plan
    }));
    go('preview');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('program'),
    eyebrow: `${family?.short || ''} · semaine ${week} · ${dayName}`,
    title: "Comment tu te sens, l\xE0 ?"
  }, "Trois questions. La s\xE9ance se cale sur ta forme du jour ; elle ne se juge pas."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, PP.READINESS_QUESTIONS.map(q => /*#__PURE__*/React.createElement("section", {
    className: "stack-sm",
    key: q.id
  }, /*#__PURE__*/React.createElement("h3", null, q.label), /*#__PURE__*/React.createElement(PTChoices, {
    columns: 3,
    options: q.options,
    value: answers[q.id],
    onChange: v => setAnswers(a => ({
      ...a,
      [q.id]: v
    }))
  }))), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Combien de temps tu as devant toi ?"), /*#__PURE__*/React.createElement(PTChips, {
    value: Number(minutes),
    options: [10, 15, 20, 30, 45, 60].map(v => ({
      value: v,
      label: `${v} min`
    })),
    onChange: setMinutes
  }), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "La s\xE9ance ne d\xE9passera ni ce temps, ni la dur\xE9e pr\xE9vue au programme.")), answered && /*#__PURE__*/React.createElement("section", {
    className: "card stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("strong", null, level.label), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "~", PP.readinessMinutes(level, program.minutes, minutes), " min")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, level.note), preview && !preview.error && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "caption"
  }, preview.exercises.length, " mouvement", preview.exercises.length > 1 ? 's' : '', " \xB7 ~", preview.estimatedMinutes, " min"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, preview.exercises.map(e => /*#__PURE__*/React.createElement("li", {
    key: e.id
  }, e.name, " \xB7 ", ptDoseLabel(e))))), preview?.error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, preview.error)), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !answered || !!preview?.error,
    onClick: launch
  }, "Voir ma s\xE9ance du jour", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), !answered && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "R\xE9ponds aux trois questions pour voir la s\xE9ance adapt\xE9e."), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => {
      notify('Séance repoussée. Rien n’est perdu : le programme t’attend.');
      go('program');
    }
  }, "Pas aujourd\u2019hui, je reviendrai"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Un jour creux ne casse pas un programme. Une s\xE9ance courte enregistr\xE9e compte autant qu\u2019une s\xE9ance compl\xE8te dans ton suivi.")));
}