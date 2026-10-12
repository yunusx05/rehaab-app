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
  go
}) {
  const player = data.player || {};
  if (!player.position) return /*#__PURE__*/React.createElement("section", {
    className: "player-invite sport-reveal"
  }, /*#__PURE__*/React.createElement("span", {
    className: "training-kicker"
  }, "Profil joueur"), /*#__PURE__*/React.createElement("h2", null, "TON POSTE.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("em", null, "TON CORPS.")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ton gabarit, ton basket, ta pause, ta sant\xE9, tes objectifs : la s\xE9ance, le calendrier et les lectures de jeu en d\xE9pendent."), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('dossier')
  }, "Remplir mon dossier joueur", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })));
  const rank = JP.qiThemes(player),
    daily = QI.dailySet(data.qi, player, rank),
    left = daily.items.length - daily.done;
  const themes = daily.items.map(x => QI.themes[x.item.theme]).filter((v, i, a) => a.indexOf(v) === i).join(' · ');
  const pos = JP.positions[player.position];
  return /*#__PURE__*/React.createElement("div", {
    className: "image-grid home-duo sport-reveal"
  }, /*#__PURE__*/React.createElement(PTImageTile, {
    photo: ptHub('qi'),
    badge: left ? `${left} à lire` : null,
    done: !left,
    title: left ? 'Lire le jeu' : 'QI du jour fait',
    text: themes,
    onClick: () => go('qi-run', 'daily')
  }), /*#__PURE__*/React.createElement(PTImageTile, {
    photo: ptHub('card'),
    badge: pos ? `#${pos.number}` : null,
    title: "Ma carte joueur",
    text: `${pos ? pos.label : ''}${(player.archetypes || []).length ? ' · ' + player.archetypes.map(a => JP.archetypes[a]?.label).join(', ') : ''}`,
    onClick: () => go('profile')
  }));
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

// Carte joueur (lot 15) : poste, profil de jeu et qualités notées UNIQUEMENT depuis les tests et les réponses du bilan.
// Trois niveaux (à travailler, correct, point fort), jamais de note chiffrée inventée. Flèche : évolution d'un test suivi.
const PT_CARD_QUALITIES = ['vertical', 'firststep', 'decel', 'reactive', 'strength', 'endurance'];
const PT_RADAR_SHORT = {
  vertical: 'Détente',
  firststep: '1er pas',
  decel: 'Appuis',
  reactive: 'Chevilles',
  strength: 'Force',
  endurance: 'Souffle',
  shooting: 'Tir'
};
// Toile d'araignée : un axe par qualité, trois anneaux = les trois niveaux. « À travailler » reste visible (1er anneau) ; non évaluée = centre.
function PTPlayerRadar({
  rows
}) {
  const W = 300,
    H = 250,
    cx = 150,
    cy = 128,
    R = 82,
    n = rows.length;
  const pt = (i, r) => {
    const a = (-90 + i * 360 / n) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ring = k => rows.map((_, i) => pt(i, R * k / 3).join(',')).join(' ');
  const val = q => q.level === null || q.level === undefined ? 0 : q.level + 1;
  const shape = rows.map((q, i) => pt(i, R * val(q) / 3).join(',')).join(' ');
  const label = rows.map(q => `${q.label} : ${q.levelLabel}`).join(', ');
  return /*#__PURE__*/React.createElement("svg", {
    className: "player-radar",
    viewBox: `0 0 ${W} ${H}`,
    role: "img",
    "aria-label": `Profil athlétique. ${label}.`
  }, [1, 2, 3].map(k => /*#__PURE__*/React.createElement("polygon", {
    key: k,
    points: ring(k),
    className: `radar-ring ring-${k}`
  })), rows.map((_, i) => {
    const [x, y] = pt(i, R);
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: cx,
      y1: cy,
      x2: x,
      y2: y,
      className: "radar-axis"
    });
  }), /*#__PURE__*/React.createElement("polygon", {
    points: shape,
    className: "radar-shape"
  }), rows.map((q, i) => {
    const [x, y] = pt(i, R * val(q) / 3);
    return q.level === null || q.level === undefined ? null : /*#__PURE__*/React.createElement("circle", {
      key: q.id,
      cx: x,
      cy: y,
      r: "4.5",
      className: `radar-dot level-${q.level}`
    }, /*#__PURE__*/React.createElement("title", null, `${q.label} : ${q.levelLabel}`));
  }), rows.map((q, i) => {
    const [x, y] = pt(i, R + 20),
      anchor = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end',
      none = q.level === null || q.level === undefined;
    return /*#__PURE__*/React.createElement("text", {
      key: q.id,
      x: x,
      y: y + 4,
      textAnchor: anchor,
      className: `radar-label${none ? ' is-none' : ''}`
    }, PT_RADAR_SHORT[q.id] || q.label, none ? ' ?' : '', q.trend === 'up' ? ' ↑' : q.trend === 'down' ? ' ↓' : '');
  }));
}
// Carte joueur : poste, profil de jeu et qualités notées UNIQUEMENT depuis les tests, les réponses du bilan et les tirs enregistrés.
// Trois niveaux (à travailler, correct, point fort), jamais de note chiffrée inventée.
function PTPlayerCard({
  data,
  go
}) {
  const JP = window.PlayerProfile,
    AP = window.AthleticProfile,
    SH = window.Shooting,
    player = data.player || {};
  const pos = JP && JP.positions[player.position],
    [failed, setFailed] = usePTState(false);
  const assessed = AP && data.athletic ? AP.assess(data.athletic).qualities : null;
  const source = q => q.failed.length || q.passed.length ? `test : ${(q.failed[0] || q.passed[0]).label.toLowerCase()}` : q.answer !== null && q.answer !== undefined ? 'd’après ta réponse' : 'pas encore évalué';
  const trend = q => {
    for (const t of [...q.passed, ...q.failed]) {
      const tr = AP.trend(t.id, data.athletic.tests?.[t.id]);
      if (tr) return tr.change > 0 ? 'up' : tr.change < -5 ? 'down' : null;
    }
    return null;
  };
  const levels = AP?.levelLabels || ['À travailler', 'Correct', 'Point fort'];
  const physical = PT_CARD_QUALITIES.map(id => assessed?.[id] ? {
    ...assessed[id],
    trend: trend(assessed[id]),
    source: source(assessed[id])
  } : {
    id,
    label: PT_RADAR_SHORT[id],
    level: null,
    levelLabel: 'Pas encore évalué',
    source: 'pas encore évalué'
  });
  const sh = SH?.level ? SH.level(data.shooting) : {
    level: null,
    attempts: 0
  };
  const shooting = {
    id: 'shooting',
    label: 'Tir',
    level: sh.level,
    levelLabel: sh.level === null ? 'Pas encore évalué' : levels[sh.level],
    trend: sh.trend,
    source: sh.level === null ? sh.attempts ? `${sh.attempts} tirs sur 4 semaines : 50 minimum` : 'enregistre tes séances de tir' : `${sh.pct} % sur 4 semaines (${sh.attempts} tirs)`
  };
  const rows = [...physical, shooting],
    any = rows.some(q => q.level !== null && q.level !== undefined);
  const name = (data.profile.name || 'Joueur').toUpperCase();
  return /*#__PURE__*/React.createElement("section", {
    className: "player-card",
    "aria-label": "Ma carte joueur"
  }, !failed && /*#__PURE__*/React.createElement("img", {
    src: ptHub('card'),
    alt: "",
    decoding: "async",
    onError: () => setFailed(true)
  }), /*#__PURE__*/React.createElement("span", {
    className: "player-card-shade",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "player-card-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "player-card-number",
    "aria-label": pos ? `Numéro de poste ${pos.number}` : 'Poste non renseigné'
  }, pos ? pos.number : '–'), /*#__PURE__*/React.createElement("span", {
    className: "player-card-id"
  }, /*#__PURE__*/React.createElement("strong", null, name), /*#__PURE__*/React.createElement("small", null, pos ? pos.label : 'Poste à renseigner', (player.archetypes || []).length ? ` · ${player.archetypes.map(a => JP.archetypes[a]?.label).join(', ')}` : ''))), any ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPlayerRadar, {
    rows: rows
  }), /*#__PURE__*/React.createElement("p", {
    className: "radar-legend",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null, "Centre : pas \xE9valu\xE9"), /*#__PURE__*/React.createElement("span", null, "1er anneau : \xE0 travailler"), /*#__PURE__*/React.createElement("span", null, "2e : correct"), /*#__PURE__*/React.createElement("span", null, "Bord : point fort")), /*#__PURE__*/React.createElement("details", {
    className: "player-card-detail"
  }, /*#__PURE__*/React.createElement("summary", null, "Le d\xE9tail de mes notes"), /*#__PURE__*/React.createElement("ul", {
    className: "player-card-stats"
  }, rows.map(q => /*#__PURE__*/React.createElement("li", {
    key: q.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-name"
  }, q.label), /*#__PURE__*/React.createElement("span", {
    className: "stat-level"
  }, q.levelLabel, q.trend && /*#__PURE__*/React.createElement("span", {
    className: `stat-trend is-${q.trend}`,
    "aria-label": q.trend === 'up' ? 'en progrès' : 'en baisse'
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 12
  }))), /*#__PURE__*/React.createElement("small", {
    className: "stat-source"
  }, q.source)))))) : /*#__PURE__*/React.createElement("p", {
    className: "player-card-empty"
  }, "Fais ton bilan physique et enregistre tes tirs : tes qualit\xE9s appara\xEEtront ici en toile, not\xE9es d\u2019apr\xE8s tes tests, tes r\xE9ponses et tes pourcentages."), /*#__PURE__*/React.createElement("div", {
    className: "player-card-foot"
  }, /*#__PURE__*/React.createElement("p", null, "Notes tir\xE9es de tes tests, de tes r\xE9ponses et de tes tirs, rien d\u2019invent\xE9."), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('bilan')
  }, assessed ? 'Mettre à jour' : 'Faire mon bilan')));
}

// Tous les questionnaires au même endroit (onglet Moi) : ce qui reste à faire en premier, puis ce qui est fait.
function PTQuestionnaires({
  data,
  go
}) {
  const PD = window.PlayerDossier,
    BPr = window.BasketProfile,
    SK = window.BasketSkills,
    JP = window.PlayerProfile;
  const when = date => date ? ` · mis à jour le ${new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })}` : '';
  const pct = PD ? PD.completeness(data.dossier).percent : 0,
    pains = PT.activeSymptoms(data).length,
    player = data.player || {};
  const list = [{
    id: 'dossier',
    icon: 'profile',
    title: 'Dossier joueur',
    done: pct >= 100,
    text: pct ? `Rempli à ${pct} %${when(data.dossier?.date)}` : 'Gabarit, pause, blessures, disponibilités, objectifs',
    go: () => go('dossier')
  }, {
    id: 'player',
    icon: 'basket',
    title: 'Poste & profil de jeu',
    done: !!player.position,
    text: player.position && JP ? `${JP.positions[player.position]?.label || ''}${(player.archetypes || []).length ? ' · ' + player.archetypes.map(a => JP.archetypes[a]?.label).join(', ') : ''}` : 'Ton poste, ton style, tes objectifs physiques',
    go: () => go('player')
  }, {
    id: 'game',
    icon: 'court',
    title: 'Mon jeu & mon club',
    done: !!BPr?.complete(data.basketProfile),
    text: BPr?.complete(data.basketProfile) ? `Forces, faiblesses et club renseignés${when(data.basketProfile?.date)}` : 'Forces, faiblesses, jours de club et de match',
    go: () => go('basket-profile')
  }, {
    id: 'bilan',
    icon: 'chart',
    title: 'Bilan physique & tests',
    done: !!data.athletic?.date,
    text: data.athletic?.date ? `Fait${when(data.athletic.date)} · détente, sprint, force` : 'Questions + tests : détente, sprint, force',
    go: () => go('bilan')
  }, {
    id: 'skills',
    icon: 'spark',
    title: 'Niveau skills basket',
    done: !!SK?.complete(data.skills),
    text: SK?.complete(data.skills) ? `Fait${when(data.skills?.profile?.date)}` : 'Dribble, tir, finition, défense : ton niveau de départ',
    go: () => go(SK?.complete(data.skills) ? 'skills' : 'skills-quiz')
  }, {
    id: 'pain',
    icon: 'pain',
    title: 'Mes douleurs du moment',
    done: true,
    text: pains ? `${pains} douleur${pains > 1 ? 's' : ''} suivie${pains > 1 ? 's' : ''} · soin intégré aux séances` : 'Aucune douleur signalée',
    go: () => go('symptoms')
  }, {
    id: 'gear',
    icon: 'weight',
    title: 'Mon matériel',
    done: data.owned.length > 1,
    text: `${data.owned.length} élément${data.owned.length > 1 ? 's' : ''} coché${data.owned.length > 1 ? 's' : ''}`,
    go: () => go('player')
  }].sort((a, b) => a.done - b.done);
  const todo = list.filter(x => !x.done).length;
  return /*#__PURE__*/React.createElement("section", {
    className: "stack-sm questionnaires",
    "aria-labelledby": "questionnaires-title"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h2", {
    id: "questionnaires-title"
  }, "Mes questionnaires"), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, todo ? `${todo} à faire` : 'Tout est à jour')), /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, list.map(x => /*#__PURE__*/React.createElement("button", {
    key: x.id,
    className: `home-action${x.done ? '' : ' is-todo'}`,
    onClick: x.go
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: x.icon
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, x.title, !x.done && /*#__PURE__*/React.createElement("em", {
    className: "todo-badge"
  }, "\xC0 faire")), /*#__PURE__*/React.createElement("small", null, x.text)), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
}