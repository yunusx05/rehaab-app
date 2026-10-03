/* Profil joueur, cartes « Le corps / L’esprit » de l’accueil et séances courtes. Réutilise les composants de personal-app.jsx. */
const JP = window.PlayerProfile,
  BP = window.BasketPathway,
  QI = window.BasketQI;
const ppSides = {
  left: 'gauche',
  right: 'droit',
  both: 'deux côtés',
  center: 'centre'
};
const ppBlankPain = {
  region: '',
  side: 'right',
  severity: 3,
  redFlags: false,
  note: ''
};
function PTPlayerProfile({
  data,
  update,
  go,
  notify
}) {
  const [step, setStep] = usePTState(0);
  const [player, setPlayer] = usePTState(() => JP.validatePlayer(data.player) || JP.validatePlayer({}));
  const [pains, setPains] = usePTState(() => PT.activeSymptoms(data).map(s => ({
    ...s
  })));
  const [draft, setDraft] = usePTState(ppBlankPain),
    [painError, setPainError] = usePTState('');
  const [owned, setOwned] = usePTState(data.owned);
  const set = (k, v) => setPlayer(p => ({
    ...p,
    [k]: v
  }));
  const toggleArchetype = id => set('archetypes', player.archetypes.includes(id) ? player.archetypes.filter(a => a !== id) : [...player.archetypes, id].slice(-3));
  const addPain = () => {
    if (!draft.region) {
      setPainError('Choisis la zone concernée.');
      return;
    }
    setPains(list => [...list, {
      ...draft,
      id: PT.uid(),
      date: PT.dateKey(),
      active: true,
      onset: 'known',
      followups: []
    }]);
    setDraft(ppBlankPain);
    setPainError('');
  };
  const removePain = id => setPains(list => list.filter(p => p.id !== id));
  const steps = [{
    title: 'Ton poste.',
    intro: 'La préparation physique et les lectures de jeu partent de là.',
    valid: !!player.position
  }, {
    title: 'Ton profil de jeu.',
    intro: 'Trois au maximum. Ils affinent les qualités travaillées et les situations tactiques.',
    valid: player.archetypes.length > 0
  }, {
    title: 'Ce qui te gêne.',
    intro: 'Une zone signalée ne disparaît pas de la séance : on la renforce avec des mouvements qu’elle tolère.',
    valid: true
  }, {
    title: 'Ton matériel.',
    intro: 'La séance du jour n’utilise que ce que tu coches.',
    valid: true
  }];
  const save = () => {
    const keptIds = pains.map(p => p.id);
    update(s => ({
      ...s,
      player: JP.validatePlayer(player),
      owned,
      checkIn: {
        ...s.checkIn,
        equipment: owned
      },
      symptoms: [...s.symptoms.map(x => x.active && !keptIds.includes(x.id) ? {
        ...x,
        active: false,
        resolvedAt: PT.dateKey()
      } : x).filter(x => !keptIds.includes(x.id)), ...pains]
    }));
    // Premier profil : le bilan physique vient juste après, pour que le parcours parte de l'état réel du corps.
    notify(data.athletic ? 'Profil joueur enregistré. Ta séance et tes lectures du jour sont recalculées.' : 'Profil joueur enregistré. Dernière étape : ton bilan physique.');
    go(data.athletic ? data.pathway ? 'today' : 'pathway' : 'bilan');
  };
  const blocked = pains.some(p => p.redFlags || Number(p.severity) >= 7);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "Profil joueur",
    title: steps[step].title,
    onBack: step === 0 ? () => go('profile') : undefined
  }, steps[step].intro), /*#__PURE__*/React.createElement("div", {
    className: "step-caption"
  }, /*#__PURE__*/React.createElement("span", null, "Le corps et l\u2019esprit"), /*#__PURE__*/React.createElement("span", null, step + 1, " / ", steps.length)), /*#__PURE__*/React.createElement("div", {
    className: "step-track"
  }, steps.map((_, i) => /*#__PURE__*/React.createElement("span", {
    className: i <= step ? 'done' : '',
    key: i
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, step === 0 && /*#__PURE__*/React.createElement(PTChoices, {
    value: player.position,
    onChange: v => set('position', v),
    options: Object.entries(JP.positions).map(([value, p]) => ({
      value,
      label: `${p.number} · ${p.label}`,
      icon: 'basket'
    }))
  }), step === 0 && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Ton niveau"), /*#__PURE__*/React.createElement(PTChips, {
    value: player.level,
    onChange: v => set('level', v),
    options: [{
      value: 'loisir',
      label: 'Loisir'
    }, {
      value: 'club',
      label: 'Club'
    }, {
      value: 'regional',
      label: 'Régional'
    }, {
      value: 'national',
      label: 'National'
    }]
  })), step === 0 && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Ta derni\xE8re saison"), /*#__PURE__*/React.createElement(PTChips, {
    value: player.layoff,
    onChange: v => set('layoff', v),
    options: [{
      value: 'none',
      label: 'Je joue actuellement'
    }, {
      value: 'months',
      label: 'Pause de quelques mois'
    }, {
      value: 'long',
      label: 'Plus d’un an sans jouer'
    }]
  }), player.layoff === 'long' && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Le parcours \xAB Retour au jeu \xBB commencera par les fondations : tendons, chevilles et hanches avant la vitesse.")), step === 0 && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "P\xE9riode"), /*#__PURE__*/React.createElement(PTChips, {
    value: player.season,
    onChange: v => set('season', v),
    options: [{
      value: 'off',
      label: 'Intersaison'
    }, {
      value: 'pre',
      label: 'Présaison'
    }, {
      value: 'in',
      label: 'En saison'
    }]
  })), step === 1 && /*#__PURE__*/React.createElement("div", {
    className: "choice-grid"
  }, Object.entries(JP.archetypes).map(([id, a]) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "choice",
    key: id,
    "aria-pressed": player.archetypes.includes(id),
    onClick: () => toggleArchetype(id)
  }, a.label, /*#__PURE__*/React.createElement("small", null, a.hint)))), step === 1 && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Tes objectifs physiques"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Trois au maximum. Ils orientent tes s\xE9ances et les tests \xE0 suivre."), /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    value: player.goals || [],
    onChange: v => set('goals', v.slice(-3)),
    options: JP.goals.map(g => ({
      value: g.id,
      label: g.label
    }))
  })), step === 1 && player.position && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Priorit\xE9s physiques calcul\xE9es : ", JP.priorities(player).slice(0, 3).map(q => q.label.toLowerCase()).join(', '), "."), step === 2 && /*#__PURE__*/React.createElement(React.Fragment, null, pains.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Aucune douleur signal\xE9e. Tu peux passer \xE0 l\u2019\xE9tape suivante."), pains.map(p => /*#__PURE__*/React.createElement("article", {
    key: p.id,
    className: "symptom-card stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h3", null, PT.regions[p.region], " \xB7 ", ppSides[p.side]), /*#__PURE__*/React.createElement("span", {
    className: "num"
  }, p.severity, "/10")), p.note && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, p.note), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => removePain(p.id)
  }, "Retirer"))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Ajouter une douleur ou une faiblesse"), /*#__PURE__*/React.createElement("div", {
    className: "body-regions"
  }, Object.entries(PT.regions).map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    className: "choice",
    "aria-pressed": draft.region === id,
    onClick: () => setDraft(d => ({
      ...d,
      region: id
    }))
  }, label))), /*#__PURE__*/React.createElement(PTChips, {
    value: draft.side,
    onChange: v => setDraft(d => ({
      ...d,
      side: v
    })),
    options: [{
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
    }]
  }), /*#__PURE__*/React.createElement(PTField, {
    label: `Intensité ressentie : ${draft.severity} / 10`,
    hint: "0-3 : g\xEAne. 4-6 : douleur. 7 et plus : pas de s\xE9ance g\xE9n\xE9r\xE9e."
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "10",
    step: "1",
    value: draft.severity,
    onChange: e => setDraft(d => ({
      ...d,
      severity: Number(e.target.value)
    }))
  })), /*#__PURE__*/React.createElement(PTField, {
    label: "Quand est-ce que \xE7a g\xEAne ?"
  }, /*#__PURE__*/React.createElement("textarea", {
    maxLength: "1000",
    value: draft.note,
    onChange: e => setDraft(d => ({
      ...d,
      note: e.target.value
    })),
    placeholder: "Ex. \xE0 la r\xE9ception des sauts, en descendant les escaliers\u2026"
  })), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: draft.redFlags,
    onChange: e => setDraft(d => ({
      ...d,
      redFlags: e.target.checked
    }))
  }), "Gonflement, blocage, instabilit\xE9, traumatisme r\xE9cent ou appui difficile."), painError && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "error"
  }, painError), /*#__PURE__*/React.createElement(PTButton, {
    onClick: addPain
  }, "Ajouter")), blocked && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, "Avec cette intensit\xE9 ou ces signes, l\u2019app ne proposera pas de s\xE9ance de musculation. Les lectures de jeu restent disponibles. Demande un avis m\xE9dical avant de reprendre.")), step === 3 && /*#__PURE__*/React.createElement(PTEquipment, {
    inventory: true,
    selected: owned,
    onChange: setOwned
  }), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, step > 0 && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setStep(step - 1)
  }, "Retour"), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !steps[step].valid,
    onClick: () => step < steps.length - 1 ? setStep(step + 1) : save()
  }, step === steps.length - 1 ? 'Voir ma journée' : 'Continuer', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
}
function PTBodyMind({
  data,
  update,
  go,
  notify
}) {
  const player = data.player || {},
    p = data.pathway;
  if (!player.position) return /*#__PURE__*/React.createElement("section", {
    className: "player-invite sport-reveal"
  }, /*#__PURE__*/React.createElement("span", {
    className: "training-kicker"
  }, "Profil joueur"), /*#__PURE__*/React.createElement("h2", null, "TON POSTE.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("em", null, "TON CORPS.")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Poste, profil de jeu, douleurs, mat\xE9riel : la s\xE9ance et les lectures de jeu du jour en d\xE9pendent."), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('player')
  }, "Cr\xE9er mon profil joueur", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })));
  const launch = plan => {
    if (plan.error) {
      notify(plan.error);
      return;
    }
    if (data.draft?.status === 'active') {
      go('session');
      notify('Une séance est déjà en cours : termine-la ou abandonne-la avant d’en lancer une autre.');
      return;
    }
    update(s => ({
      ...s,
      draft: plan
    }));
    go('preview');
  };
  let body;
  if (p) {
    const step = BP.stepById(p.step),
      status = BP.weekStatus(p),
      day = step.days.find(d => d.key === status.next),
      plan = BP.sessionPlan(PT, JP, data, p, day.key);
    body = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "training-kicker"
    }, "Le corps \xB7 \xE9tape ", step.id, "/", BP.steps.length), /*#__PURE__*/React.createElement("h2", null, day.name), /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, step.name, " \xB7 semaine ", status.week, " \xB7 ", plan.error ? 'indisponible aujourd’hui' : `~${plan.estimatedMinutes} min, ${plan.exercises.length} mouvements`), /*#__PURE__*/React.createElement("div", {
      className: "button-row"
    }, /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      disabled: !!plan.error,
      onClick: () => launch(plan)
    }, "Pr\xE9parer", /*#__PURE__*/React.createElement(PTIcon, {
      name: "arrow",
      size: 18
    })), /*#__PURE__*/React.createElement(PTButton, {
      quiet: true,
      onClick: () => go('pathway')
    }, "Le parcours")));
  } else {
    body = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "training-kicker"
    }, "Le corps"), /*#__PURE__*/React.createElement("h2", null, "Retour au jeu"), /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, "Cinq \xE9tapes, des crit\xE8res de passage, adapt\xE9es \xE0 ton poste. ", player.layoff === 'long' ? 'Recommandé après ta longue pause.' : ''), /*#__PURE__*/React.createElement("div", {
      className: "button-row"
    }, /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      onClick: () => go('pathway')
    }, "D\xE9couvrir", /*#__PURE__*/React.createElement(PTIcon, {
      name: "arrow",
      size: 18
    })), /*#__PURE__*/React.createElement(PTButton, {
      quiet: true,
      onClick: () => launch(JP.dailyBody(PT, data, {
        minutes: 30
      }))
    }, "S\xE9ance du jour")));
  }
  const athletic = data.athletic;
  if (!athletic?.date) body = /*#__PURE__*/React.createElement(React.Fragment, null, body, /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('bilan')
  }, "Faire mon bilan physique \xB7 10 min \u2192"));else if (!apFresh(athletic)) body = /*#__PURE__*/React.createElement(React.Fragment, null, body, /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('bilan')
  }, "Refaire mon bilan : 4 semaines sont pass\xE9es \u2192"));
  const rank = JP.qiThemes(player),
    daily = QI.dailySet(data.qi, player, rank),
    left = daily.items.length - daily.done;
  return /*#__PURE__*/React.createElement("div", {
    className: "body-mind sport-reveal"
  }, /*#__PURE__*/React.createElement("section", {
    className: "body-card"
  }, body), /*#__PURE__*/React.createElement("section", {
    className: "mind-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "training-kicker"
  }, "L\u2019esprit \xB7 QI basket"), /*#__PURE__*/React.createElement("h2", null, left ? `${left} lecture${left > 1 ? 's' : ''} du jour` : 'Lectures faites'), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, daily.items.map(x => QI.themes[x.item.theme]).filter((v, i, a) => a.indexOf(v) === i).join(' · ')), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: !!left,
    quiet: !left,
    onClick: () => go('qi-run', 'daily')
  }, left ? 'Lire le jeu' : 'Refaire', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('qi')
  }, "Tout le QI"))));
}
function PTQuickRail({
  data,
  update,
  go,
  notify
}) {
  const start = id => {
    if (data.draft?.status === 'active') {
      go('session');
      notify('Ta séance en cours est conservée.');
      return;
    }
    const plan = BP.quickPlan(PT, JP, data, id);
    if (plan.error) {
      notify(plan.error);
      return;
    }
    update(s => ({
      ...s,
      draft: plan
    }));
    go('preview');
  };
  const thumb = q => PT.catalog.find(e => e.id === q.ids[0][0]);
  return /*#__PURE__*/React.createElement("section", {
    className: "scroll-reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "QUICK WORKOUT"), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "\xC0 toi de choisir")), /*#__PURE__*/React.createElement("div", {
    className: "workout-rail"
  }, BP.quick.map(q => /*#__PURE__*/React.createElement("button", {
    key: q.id,
    className: "preset-workout",
    onClick: () => start(q.id)
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: thumb(q)
  }), /*#__PURE__*/React.createElement("span", {
    className: "preset-info"
  }, /*#__PURE__*/React.createElement("small", null, q.minutes, " min"), /*#__PURE__*/React.createElement("strong", null, q.title), /*#__PURE__*/React.createElement("span", {
    className: "preset-play"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 17
  }))))), /*#__PURE__*/React.createElement("button", {
    className: "preset-workout quiz-tile",
    onClick: () => go('qi-run', 'quiz')
  }, /*#__PURE__*/React.createElement("span", {
    className: "quiz-tile-court",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "court",
    size: 44
  })), /*#__PURE__*/React.createElement("span", {
    className: "preset-info"
  }, /*#__PURE__*/React.createElement("small", null, "5 min"), /*#__PURE__*/React.createElement("strong", null, "Quiz tactique rapide"), /*#__PURE__*/React.createElement("span", {
    className: "preset-play"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 17
  }))))));
}

// Annuler la séance en cours : visible partout où une séance attend, toujours avec confirmation.
function PTDraftCancel({
  update,
  notify,
  after
}) {
  const [confirm, setConfirm] = usePTState(false);
  if (!confirm) return /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => setConfirm(true)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "close",
    size: 18
  }), "Annuler la s\xE9ance en cours");
  return /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm"
  }, /*#__PURE__*/React.createElement("p", null, "Annuler sans enregistrer ? Les s\xE9ries d\xE9j\xE0 faites seront perdues. Ton parcours et tes programmes ne changent pas."), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => {
      update(s => ({
        ...s,
        draft: null
      }));
      setConfirm(false);
      notify('Séance annulée.');
      if (after) after();
    }
  }, "Oui, annuler la s\xE9ance"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setConfirm(false)
  }, "Garder ma s\xE9ance"));
}