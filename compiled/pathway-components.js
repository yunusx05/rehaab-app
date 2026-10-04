/* Parcours « Retour au jeu » : étapes, séances de la semaine, critères de passage, paliers de jeu. */
const ptRoleLabel = role => role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
function PTPathwayIntro({
  data,
  update,
  go
}) {
  const advice = data.athletic?.date ? AP.recommendedStart(data) : null;
  const [start, setStart] = usePTState(advice ? advice.step : 1);
  const hasPlayer = !!data.player?.position;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('today'),
    eyebrow: "Parcours basket",
    title: "Retour au jeu."
  }, "Cinq \xE9tapes pour revenir sur le terrain sans te blesser. On avance quand le corps a valid\xE9 les crit\xE8res, pas quand le calendrier le dit."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-action is-featured",
    onClick: () => go('bilan', 'tests')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "chart"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mesurer ma d\xE9tente et mes tests"), /*#__PURE__*/React.createElement("small", null, "Saut vertical, RSI, sprint : avec un mur, un m\xE8tre ou une vid\xE9o au ralenti.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), !hasPlayer && /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm"
  }, /*#__PURE__*/React.createElement("p", null, "Renseigne d\u2019abord ton poste et tes douleurs : les s\xE9ances s\u2019adaptent \xE0 ton profil."), /*#__PURE__*/React.createElement(PTButton, {
    onClick: () => go('player')
  }, "Cr\xE9er mon profil joueur", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), /*#__PURE__*/React.createElement("ol", {
    className: "step-list"
  }, BP.steps.map(s => /*#__PURE__*/React.createElement("li", {
    key: s.id,
    className: start === s.id ? 'is-current' : ''
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-thumb"
  }, /*#__PURE__*/React.createElement("img", {
    src: `media/pathway/${s.id}.webp`,
    alt: "",
    loading: "lazy",
    decoding: "async"
  }), /*#__PURE__*/React.createElement("i", {
    className: "step-num"
  }, s.id)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, s.name), /*#__PURE__*/React.createElement("small", null, s.minWeeks, " semaines minimum", s.base ? ` · ${s.base}` : ''))))), hasPlayer && !advice && /*#__PURE__*/React.createElement(PTAssessmentSummary, {
    data: data,
    go: go
  }), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Par o\xF9 commencer ?"), /*#__PURE__*/React.createElement(PTChips, {
    value: start,
    onChange: setStart,
    options: BP.steps.map(s => ({
      value: s.id,
      label: `Étape ${s.id}`
    }))
  }), advice && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Ton bilan conseille l\u2019\xE9tape ", advice.step, ". ", advice.reason), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, start === 1 ? 'Après une longue pause, l’étape 1 est la bonne porte d’entrée, même si tu te sens en forme : les tendons ont besoin de plus de temps que les muscles.' : 'Commencer plus loin suppose que tu réussis déjà les critères des étapes précédentes. Tu pourras revenir en arrière à tout moment.')), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => update(s => ({
      ...s,
      pathway: AP.seedPathwayTests(BP.create({
        startStep: start
      }), s.athletic)
    }))
  }, "Commencer le parcours", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), (data.pathwayArchive || []).slice(-1).map(old => /*#__PURE__*/React.createElement("button", {
    key: old.id,
    className: "home-action",
    onClick: () => update(s => {
      const {
        stoppedAt,
        ...kept
      } = old;
      return {
        ...s,
        pathway: BP.validatePathway(kept),
        pathwayArchive: (s.pathwayArchive || []).filter(x => x.id !== old.id)
      };
    })
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Reprendre mon parcours arr\xEAt\xE9"), /*#__PURE__*/React.createElement("small", null, "\xC9tape ", old.step, " \xB7 ", BP.stepById(old.step)?.name, ", arr\xEAt\xE9 le ", shortDate(old.stoppedAt))), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('library')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "weight"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Tous les exercices"), /*#__PURE__*/React.createElement("small", null, "Le catalogue complet, filtrable par mat\xE9riel.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('profile')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "bench"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mon mat\xE9riel"), /*#__PURE__*/React.createElement("small", null, data.owned.length, " \xE9quipement", data.owned.length > 1 ? 's' : '', " \xB7 gilet lest\xE9 et disques slide disponibles.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('program')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "book"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mes autres programmes"), /*#__PURE__*/React.createElement("small", null, "Shred, force, hybride\u2026 Toujours s\xE9par\xE9s du parcours.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('program-legacy')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "basket"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Programme basket d\u2019origine"), /*#__PURE__*/React.createElement("small", null, "Tes trois blocs, conserv\xE9s tels quels.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
}
function PTPathway({
  data,
  update,
  go,
  notify
}) {
  const p = data.pathway;
  const [minutes, setMinutes] = usePTState(0);
  const [stopping, setStopping] = usePTState(false);
  const [confirm, setConfirm] = usePTState(null);
  const [error, setError] = usePTState('');
  if (!p) return /*#__PURE__*/React.createElement(PTPathwayIntro, {
    data: data,
    update: update,
    go: go
  });
  const step = BP.stepById(p.step),
    status = BP.weekStatus(p),
    gate = BP.gate(PT, data, p);
  const next = BP.stepById(p.step + 1);
  const launch = key => {
    if (data.draft?.status === 'active' && confirm !== key) {
      setConfirm(key);
      return;
    }
    const plan = BP.sessionPlan(PT, JP, data, p, key, {
      minutes: minutes || undefined
    });
    if (plan.error) {
      setError(plan.error);
      return;
    }
    setConfirm(null);
    setError('');
    update(s => ({
      ...s,
      draft: plan
    }));
    go('preview');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('today'),
    eyebrow: `Étape ${step.id} sur ${BP.steps.length}${step.base ? ` · ${step.base}` : ''}`,
    title: `${step.name}.`
  }, step.goal), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-action is-featured",
    onClick: () => go('bilan', 'tests')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "chart"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mesurer ma d\xE9tente et mes tests"), /*#__PURE__*/React.createElement("small", null, "Saut vertical, RSI, sprint : avec un mur, un m\xE8tre ou une vid\xE9o au ralenti.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "step-track pathway-track"
  }, BP.steps.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.id,
    className: s.id <= p.step ? 'done' : ''
  }))), /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("strong", null, "Semaine ", status.week, status.week > step.minWeeks ? ' · consolidation' : ''), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, status.sessions, " / ", status.needed, " s\xE9ances")), /*#__PURE__*/React.createElement("span", {
    className: "mini-progress"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      transform: `scaleX(${Math.min(1, status.sessions / status.needed)})`
    }
  })), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Trois s\xE9ances par semaine", step.days.length === 2 ? ' (deux à cette étape)' : '', ", dans l\u2019ordre que tu veux. Laisse au moins un jour entre deux s\xE9ances de jambes.")), /*#__PURE__*/React.createElement(PTAssessmentSummary, {
    data: data,
    go: go
  }), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Les r\xE8gles de cette \xE9tape"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, step.rules.map(r => /*#__PURE__*/React.createElement("li", {
    key: r
  }, r))))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h2", null, "Cette semaine")), /*#__PURE__*/React.createElement(PTChips, {
    value: minutes,
    onChange: setMinutes,
    options: [{
      value: 0,
      label: 'Séance complète'
    }, {
      value: 30,
      label: '30 min'
    }, {
      value: 45,
      label: '45 min'
    }]
  }), step.days.map(day => {
    const plan = BP.sessionPlan(PT, JP, data, p, day.key, {
      minutes: minutes || undefined
    });
    const done = status.done.includes(day.key);
    return /*#__PURE__*/React.createElement("article", {
      key: day.key,
      className: `card stack-sm pathway-day${done ? ' is-done' : ''}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "exercise-summary"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exercise-number"
    }, day.key), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, day.name), /*#__PURE__*/React.createElement("p", null, plan.error ? 'Indisponible aujourd’hui' : `~${plan.estimatedMinutes} min · ${plan.exercises.length} mouvements`, done ? ' · faite' : status.next === day.key ? ' · conseillée' : ''))), plan.error ? /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, plan.error) : /*#__PURE__*/React.createElement("ul", {
      className: "dose-list"
    }, plan.exercises.map(e => /*#__PURE__*/React.createElement("li", {
      key: e.id
    }, /*#__PURE__*/React.createElement("span", null, e.name), /*#__PURE__*/React.createElement("small", null, ptRoleLabel(e.pathwayRole), " \xB7 ", ptDoseLabel(e))))), confirm === day.key && /*#__PURE__*/React.createElement("div", {
      className: "notice warning stack-sm"
    }, /*#__PURE__*/React.createElement("p", null, "Une s\xE9ance est en cours. La remplacer effacera ce qui n\u2019a pas \xE9t\xE9 enregistr\xE9."), /*#__PURE__*/React.createElement(PTButton, {
      quiet: true,
      onClick: () => {
        setConfirm(null);
        go('session');
      }
    }, "Reprendre la s\xE9ance en cours")), !plan.error && /*#__PURE__*/React.createElement(PTButton, {
      primary: !done && status.next === day.key,
      onClick: () => launch(day.key)
    }, confirm === day.key ? 'Remplacer et préparer' : done ? 'Refaire cette séance' : 'Préparer cette séance', /*#__PURE__*/React.createElement(PTIcon, {
      name: "arrow",
      size: 18
    })));
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error)), p.step === BP.steps.length && /*#__PURE__*/React.createElement(PTPathwayLadder, {
    data: data,
    update: update,
    go: go,
    notify: notify
  }), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, gate.last ? 'Pour boucler le parcours' : `Pour passer à l’étape ${next.id}`), /*#__PURE__*/React.createElement("ul", {
    className: "criteria-list"
  }, gate.criteria.map(c => /*#__PURE__*/React.createElement("li", {
    key: c.id,
    className: c.ok ? 'is-ok' : ''
  }, /*#__PURE__*/React.createElement("span", {
    className: "criteria-mark"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: c.ok ? 'check' : 'clock',
    size: 16
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, c.label), /*#__PURE__*/React.createElement("small", null, c.detail)), BP.tests[c.id] && !['pain', 'ladder'].includes(c.id) && /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: () => go('pathway-test', c.id)
  }, BP.latest(p, c.id) ? 'Remesurer' : 'Mesurer')))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ces rep\xE8res d\u2019entra\xEEnement ne sont pas des normes m\xE9dicales. Un kin\xE9 peut les remplacer par ses propres tests."), gate.ready && !gate.last && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => {
      update(s => ({
        ...s,
        pathway: BP.advance(s.pathway)
      }));
      notify(`Étape ${next.id} débloquée : ${next.name}.`);
      window.scrollTo(0, 0);
    }
  }, "Passer \xE0 l\u2019\xE9tape ", next.id, " \xB7 ", next.name, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), gate.ready && gate.last && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Parcours boucl\xE9. Garde deux s\xE9ances de renforcement par semaine pendant la saison : c\u2019est ce qui \xE9vite la blessure suivante."), !gate.ready && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Tu peux rester sur cette \xE9tape aussi longtemps que n\xE9cessaire : les semaines suppl\xE9mentaires passent en consolidation.")), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "G\xE9rer le parcours"), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, p.step > 1 && /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => {
      update(s => ({
        ...s,
        pathway: BP.stepBack(s.pathway)
      }));
      notify('Retour à l’étape précédente. Tes séances et tes tests sont conservés.');
    }
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Revenir \xE0 l\u2019\xE9tape ", p.step - 1), /*#__PURE__*/React.createElement("small", null, "Apr\xE8s une douleur ou une coupure.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('player')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "basket"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mon profil joueur"), /*#__PURE__*/React.createElement("small", null, "Poste, douleurs, mat\xE9riel.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('library')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "weight"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Tous les exercices"), /*#__PURE__*/React.createElement("small", null, "Le catalogue complet.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('program')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "book"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mes autres programmes"), /*#__PURE__*/React.createElement("small", null, "S\xE9par\xE9s du parcours, \xE0 suivre ou non.")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), stopping ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm"
  }, /*#__PURE__*/React.createElement("p", null, "Arr\xEAter le parcours ? Il est archiv\xE9 avec tes tests et ton avancement : tu pourras le reprendre \xE0 la m\xEAme \xE9tape. Tes s\xE9ances restent dans l\u2019historique."), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => {
      update(s => ({
        ...s,
        pathway: null,
        pathwayArchive: [...(s.pathwayArchive || []), {
          ...s.pathway,
          stoppedAt: PT.dateKey()
        }].slice(-10),
        draft: s.draft?.source === 'pathway' && s.draft.status !== 'active' ? null : s.draft
      }));
      notify('Parcours arrêté et archivé.');
      go('today');
    }
  }, "Oui, arr\xEAter le parcours"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setStopping(false)
  }, "Continuer le parcours")) : /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => setStopping(true)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "close",
    size: 18
  }), "Arr\xEAter le parcours"))));
}
function PTPathwayLadder({
  data,
  update,
  go,
  notify
}) {
  const p = data.pathway,
    level = BP.ladderLevel(p);
  const pendingIndex = p.ladder.findIndex(x => x.nextDay === null);
  const current = BP.ladder.find(r => r.id === level + 1);
  return /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Paliers de jeu"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Un palier est valid\xE9 quand le lendemain est calme. Sinon, on reste au m\xEAme palier."), /*#__PURE__*/React.createElement("ol", {
    className: "step-list"
  }, BP.ladder.map(r => /*#__PURE__*/React.createElement("li", {
    key: r.id,
    className: r.id <= level ? 'is-done' : r.id === level + 1 ? 'is-current' : ''
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-num"
  }, r.id <= level ? /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 15
  }) : r.id), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, r.label), /*#__PURE__*/React.createElement("small", null, r.hint))))), pendingIndex >= 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("strong", null, "Et le lendemain de \xAB ", BP.ladder.find(r => r.id === p.ladder[pendingIndex].rung).label, " \xBB ?"), /*#__PURE__*/React.createElement(PTChoices, {
    value: null,
    options: [{
      value: 'ok',
      label: 'Rien de spécial'
    }, {
      value: 'worse',
      label: 'Une douleur est apparue'
    }],
    onChange: v => {
      update(s => ({
        ...s,
        pathway: BP.rungFeedback(s.pathway, pendingIndex, v)
      }));
      if (v === 'worse') {
        notify('Palier non validé. Signale la zone : les séances s’adapteront.');
        go('symptoms');
      } else notify('Palier validé.');
    }
  })) : current && /*#__PURE__*/React.createElement(PTButton, {
    onClick: () => {
      update(s => ({
        ...s,
        pathway: BP.recordRung(s.pathway, current.id)
      }));
      notify('Palier noté. Dis-nous demain comment ça va.');
    }
  }, "J\u2019ai fait : ", current.label));
}

// Saisie d'une mesure, partagée par le parcours et le bilan athlétique.
const ptBlankTest = {
  left: '',
  right: '',
  value: '',
  best: '',
  last: ''
};
function ptTestValues(t, form) {
  const num = v => v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) < 10000;
  if (t.unit === 'check') return {
    values: t.sides ? {
      left: form.left === true,
      right: form.right === true
    } : {
      value: form.value === true
    }
  };
  if (t.unit === 'rsa') return !num(form.best) || !num(form.last) || Number(form.best) <= 0 ? {
    error: 'Indique le meilleur et le dernier temps.'
  } : {
    values: {
      best: Number(form.best),
      last: Number(form.last)
    }
  };
  if (t.sides) return !num(form.left) || !num(form.right) ? {
    error: 'Indique une valeur pour chaque côté.'
  } : {
    values: {
      left: Number(form.left),
      right: Number(form.right)
    }
  };
  return !num(form.value) ? {
    error: 'Indique une valeur.'
  } : {
    values: {
      value: Number(form.value)
    }
  };
}
function PTTestForm({
  test: t,
  form,
  set
}) {
  const unit = t.unit === 'check' || t.unit === 'rsa' ? '' : ` (${t.unit})`;
  return /*#__PURE__*/React.createElement(React.Fragment, null, t.unit === 'check' && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, t.sides ? ['left', 'right'].map(side => /*#__PURE__*/React.createElement("label", {
    key: side,
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form[side] === true,
    onChange: e => set(side, e.target.checked)
  }), side === 'left' ? 'Jambe gauche' : 'Jambe droite', " : r\xE9ussi proprement, sans douleur")) : /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.value === true,
    onChange: e => set('value', e.target.checked)
  }), "R\xE9ussi proprement, sans douleur")), t.unit === 'rsa' && /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Meilleur sprint (s)",
    type: "number",
    step: "0.01",
    inputMode: "decimal",
    value: form.best,
    onChange: e => set('best', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Dernier sprint (s)",
    type: "number",
    step: "0.01",
    inputMode: "decimal",
    value: form.last,
    onChange: e => set('last', e.target.value)
  })), !['check', 'rsa'].includes(t.unit) && (t.sides ? /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: `Gauche${unit}`,
    type: "number",
    step: "0.1",
    inputMode: "decimal",
    value: form.left,
    onChange: e => set('left', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: `Droite${unit}`,
    type: "number",
    step: "0.1",
    inputMode: "decimal",
    value: form.right,
    onChange: e => set('right', e.target.value)
  })) : /*#__PURE__*/React.createElement(PTField, {
    label: `Résultat${unit}`,
    type: "number",
    step: "0.01",
    inputMode: "decimal",
    value: form.value,
    onChange: e => set('value', e.target.value)
  })));
}
function PTPathwayTest({
  data,
  update,
  go,
  notify,
  id
}) {
  const t = BP.tests[id],
    p = data.pathway;
  const [form, setForm] = usePTState(ptBlankTest);
  const [error, setError] = usePTState('');
  if (!t || !p) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    title: "Test introuvable."
  }), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('pathway')
  }, "Revenir au parcours"));
  const history = (p.tests[id] || []).slice().reverse();
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
    update(s => ({
      ...s,
      pathway: BP.recordTest(s.pathway, id, values)
    }));
    const result = BP.evaluate(id, {
      ...values
    }, BP.recordTest(p, id, values));
    notify(result.ok ? 'Critère validé.' : 'Mesure enregistrée. Pas encore le repère : on continue.');
    go('pathway');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    eyebrow: "Crit\xE8re de passage",
    title: `${t.label}.`
  }, t.why), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("ol", {
    className: "instruction-list"
  }, t.how.map(line => /*#__PURE__*/React.createElement("li", {
    key: line
  }, line))), t.target && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Rep\xE8re : ", t.target, "."), /*#__PURE__*/React.createElement(PTTestForm, {
    test: t,
    form: form,
    set: set
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: save
  }, "Enregistrer la mesure", /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 18
  })), history.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Mesures pr\xE9c\xE9dentes"), /*#__PURE__*/React.createElement("ul", {
    className: "criteria-list"
  }, history.slice(0, 6).map((r, i) => {
    const ev = BP.evaluate(id, r, {
      tests: {
        [id]: (p.tests[id] || []).slice(0, (p.tests[id] || []).length - i)
      }
    });
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      className: ev.ok ? 'is-ok' : ''
    }, /*#__PURE__*/React.createElement("span", {
      className: "criteria-mark"
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: ev.ok ? 'check' : 'clock',
      size: 16
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, shortDate(r.date)), /*#__PURE__*/React.createElement("small", null, ev.detail)));
  })))));
}