/* Bibliothèque : tous les exercices du catalogue, filtrables par muscle, type, matériel et zone de soin.
   Repris de l'écran supprimé au lot 9 (commit 385d5df), avec le filtre « Soin » branché sur les protocoles de rehab-warmup.js. */
function PTMuscleExplorer({
  value,
  onChange
}) {
  const [back, setBack] = usePTState(false);
  return /*#__PURE__*/React.createElement("section", {
    className: "muscle-explorer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "muscle-copy"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Filtrer par muscle"), /*#__PURE__*/React.createElement("h2", null, value === 'all' ? /*#__PURE__*/React.createElement(React.Fragment, null, "QUEL", /*#__PURE__*/React.createElement("br", null), "MUSCLE ?") : ptMuscleLabels[value]), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Touche une zone."), /*#__PURE__*/React.createElement("button", {
    className: "chip rotate-body",
    onClick: () => setBack(!back)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh",
    size: 16
  }), back ? 'Voir de face' : 'Voir de dos'), /*#__PURE__*/React.createElement("button", {
    className: "text-button muscle-reset",
    "aria-hidden": value === 'all',
    disabled: value === 'all',
    tabIndex: value === 'all' ? -1 : undefined,
    onClick: () => onChange('all')
  }, "Tout afficher")), /*#__PURE__*/React.createElement(PTBodyMap, {
    selected: value,
    onSelect: onChange,
    back: back
  }));
}
// Ids utilisés par les protocoles de soin d'une zone (tous niveaux confondus).
function ptCareIds(zone) {
  const RW = window.RehabWarmup;
  if (!RW || zone === 'all') return null;
  return new Set(RW.protocols.filter(p => p.zone === zone).flatMap(p => p.levels.flat().flatMap(slot => Array.isArray(slot) ? slot : slot.ids)));
}
function PTLibrary({
  data,
  update,
  go,
  notify
}) {
  const [query, setQuery] = usePTState(''),
    [kind, setKind] = usePTState('all'),
    [open, setOpen] = usePTState(null),
    [adding, setAdding] = usePTState(false),
    [error, setError] = usePTState('');
  const [muscle, setMuscle] = usePTState('all'),
    [equipment, setEquipment] = usePTState('all'),
    [care, setCare] = usePTState('all');
  const [custom, setCustom] = usePTState({
    name: '',
    kind: 'strength',
    pattern: 'push',
    needs: ['bodyweight'],
    regions: [],
    instructions: '',
    measure: 'reps',
    min: 8,
    max: 12,
    seconds: 30,
    rest: 60,
    weighted: false,
    impact: false,
    level: 1
  });
  const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');
  const careIds = ptCareIds(care),
    RW = window.RehabWarmup;
  const items = PT.allExercises(data).filter(e => (muscle === 'all' || ptMuscles(e).includes(muscle)) && (equipment === 'all' || e.needs.includes(equipment)) && (!careIds || careIds.has(e.id)) && (kind === 'all' || kind === 'liked' && data.preferences.likes.includes(e.id) || kind === 'owned' && e.needs.every(n => n === 'bodyweight' || data.owned.includes(n)) || kind === 'basket' && ['shoot', 'handle', 'finish', 'footwork', 'react', 'jump'].includes(e.pattern) || e.kind === kind) && normalize(e.name).includes(normalize(query)));
  const set = (k, v) => setCustom(c => ({
    ...c,
    [k]: v
  }));
  const reset = () => {
    setQuery('');
    setMuscle('all');
    setEquipment('all');
    setKind('all');
    setCare('all');
    setOpen(null);
  };
  const add = () => {
    if (!custom.name.trim() || !custom.instructions.trim() || !custom.regions.length) {
      setError('Ajoute un nom, des consignes et les zones sollicitées.');
      return;
    }
    const exercise = {
      ...custom,
      id: `custom-${PT.uid()}`,
      name: custom.name.trim(),
      instructions: custom.instructions.split('\n').filter(Boolean),
      min: Number(custom.min),
      max: Number(custom.max),
      sets: 3,
      seconds: Number(custom.seconds),
      rest: Number(custom.rest)
    };
    try {
      PT.validateState({
        ...data,
        customExercises: [...data.customExercises, exercise]
      });
    } catch (e) {
      setError(e.message);
      return;
    }
    update(s => ({
      ...s,
      customExercises: [...s.customExercises, exercise]
    }));
    setAdding(false);
    setError('');
    notify('Exercice personnel ajouté au catalogue.');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "library-view"
  }, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => history.length > 1 ? history.back() : go('pathway'),
    eyebrow: `${PT.allExercises(data).length} exercices`,
    title: "Tous les exercices."
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTMuscleExplorer, {
    value: muscle,
    onChange: v => {
      setMuscle(v);
      setOpen(null);
    }
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Rechercher un exercice",
    type: "search",
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Rowing, squat, cheville\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    className: "muscle-tabs",
    role: "group",
    "aria-label": "Type d\u2019exercice"
  }, [['all', 'Tous'], ['owned', 'Mon matériel'], ['liked', 'Favoris'], ['strength', 'Force'], ['basket', 'Basket'], ['plyo', 'Pliométrie'], ['cardio', 'Cardio'], ['mobility', 'Mobilité']].map(([value, label]) => /*#__PURE__*/React.createElement("button", {
    key: value,
    "aria-pressed": kind === value,
    onClick: () => {
      setKind(value);
      setOpen(null);
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    className: "library-filters"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Mat\xE9riel"
  }, /*#__PURE__*/React.createElement("select", {
    value: equipment,
    onChange: e => {
      setEquipment(e.target.value);
      setOpen(null);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "Tout le mat\xE9riel"), PT.equipment.map(e => /*#__PURE__*/React.createElement("option", {
    key: e.id,
    value: e.id
  }, e.label)))), RW && /*#__PURE__*/React.createElement(PTField, {
    label: "Soin d\u2019une zone"
  }, /*#__PURE__*/React.createElement("select", {
    value: care,
    onChange: e => {
      setCare(e.target.value);
      setOpen(null);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "Toutes les zones"), RW.zones.map(z => /*#__PURE__*/React.createElement("option", {
    key: z.id,
    value: z.id
  }, z.label))))), adding && /*#__PURE__*/React.createElement("section", {
    className: "card stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Mon mouvement personnel"), /*#__PURE__*/React.createElement(PTField, {
    label: "Nom",
    value: custom.name,
    maxLength: "120",
    onChange: e => set('name', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Famille"
  }, /*#__PURE__*/React.createElement("select", {
    value: custom.kind,
    onChange: e => set('kind', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "strength"
  }, "Musculation"), /*#__PURE__*/React.createElement("option", {
    value: "basket"
  }, "Basket"), /*#__PURE__*/React.createElement("option", {
    value: "cardio"
  }, "Cardio"), /*#__PURE__*/React.createElement("option", {
    value: "mobility"
  }, "Mobilit\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "plyo"
  }, "Pliom\xE9trie"))), /*#__PURE__*/React.createElement(PTField, {
    label: "Mouvement travaill\xE9"
  }, /*#__PURE__*/React.createElement("select", {
    value: custom.pattern,
    onChange: e => set('pattern', e.target.value)
  }, Object.entries(PT.patterns).map(([v, label]) => /*#__PURE__*/React.createElement("option", {
    key: v,
    value: v
  }, label))))), /*#__PURE__*/React.createElement(PTField, {
    label: "Consignes \xB7 une par ligne"
  }, /*#__PURE__*/React.createElement("textarea", {
    value: custom.instructions,
    maxLength: "2000",
    onChange: e => set('instructions', e.target.value)
  })), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Mat\xE9riel n\xE9cessaire"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PTEquipment, {
    inventory: true,
    selected: custom.needs,
    onChange: v => set('needs', v)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Zones sollicit\xE9es"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "S\xE9lectionne aussi les articulations d\u2019appui. Ce marquage sert au filtre de douleur ; il ne garantit pas la s\xE9curit\xE9."), /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    value: custom.regions,
    options: Object.entries(PT.regions).map(([value, label]) => ({
      value,
      label
    })),
    onChange: v => set('regions', v)
  })), /*#__PURE__*/React.createElement(PTField, {
    label: "Mesure"
  }, /*#__PURE__*/React.createElement("select", {
    value: custom.measure,
    onChange: e => set('measure', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "reps"
  }, "R\xE9p\xE9titions"), /*#__PURE__*/React.createElement("option", {
    value: "seconds"
  }, "Secondes"), /*#__PURE__*/React.createElement("option", {
    value: "shots"
  }, "Tirs r\xE9ussis / tent\xE9s"), /*#__PURE__*/React.createElement("option", {
    value: "contacts"
  }, "Contacts de saut"))), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "R\xE9p\xE9titions min.",
    type: "number",
    min: "1",
    max: "100",
    value: custom.min,
    onChange: e => set('min', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "R\xE9p\xE9titions max.",
    type: "number",
    min: "1",
    max: "100",
    value: custom.max,
    onChange: e => set('max', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Travail (secondes)",
    type: "number",
    min: "1",
    max: "600",
    value: custom.seconds,
    onChange: e => set('seconds', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Repos (secondes)",
    type: "number",
    min: "0",
    max: "600",
    value: custom.rest,
    onChange: e => set('rest', e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: custom.impact,
    onChange: e => set('impact', e.target.checked)
  }), "Cet exercice comporte des sauts ou des impacts."), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "error"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: add
  }, "Ajouter \xE0 ma biblioth\xE8que")), /*#__PURE__*/React.createElement("div", {
    className: "library-toolbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": adding ? 'Fermer l’ajout' : 'Ajouter mon exercice',
    onClick: () => setAdding(!adding)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "plus",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    className: "library-count",
    role: "status"
  }, items.length, " mouvements"), (query || muscle !== 'all' || equipment !== 'all' || kind !== 'all' || care !== 'all') && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: reset
  }, "Effacer les filtres")), /*#__PURE__*/React.createElement("div", {
    className: "exercise-library-grid"
  }, items.map(e => /*#__PURE__*/React.createElement("article", {
    className: `exercise-item library-tile${open === e.id ? ' expanded' : ''}`,
    key: e.id
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => setOpen(open === e.id ? null : e.id),
    "aria-expanded": open === e.id
  }, /*#__PURE__*/React.createElement(PTThumbnail, {
    exercise: e
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, e.name), /*#__PURE__*/React.createElement("small", null, PT.patterns[e.pattern], " \xB7 ", e.needs.filter(id => id !== 'bodyweight').map(id => PT.equipment.find(x => x.id === id)?.label).join(', ') || 'Poids du corps', data.preferences.avoids.includes(e.id) ? ' · écarté des propositions' : '')), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 16
  })), open === e.id && /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement(PTExerciseDetails, {
    exercise: e
  }), /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    value: [...(data.preferences.likes.includes(e.id) ? ['like'] : []), ...(data.preferences.avoids.includes(e.id) ? ['avoid'] : [])],
    options: [{
      value: 'like',
      label: 'J’aime'
    }, {
      value: 'avoid',
      label: 'Ne plus proposer'
    }],
    onChange: values => update(s => ({
      ...s,
      preferences: {
        ...s.preferences,
        likes: values.includes('like') ? [...new Set([...s.preferences.likes, e.id])] : s.preferences.likes.filter(id => id !== e.id),
        avoids: values.includes('avoid') ? [...new Set([...s.preferences.avoids, e.id])] : s.preferences.avoids.filter(id => id !== e.id)
      }
    }))
  }))))), !items.length && /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Aucun r\xE9sultat. Essaie un autre mot, ou efface les filtres.")));
}