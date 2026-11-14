/* Lot 41 · Extra : des séances à la carte, les jours où tu veux faire autre chose que ton programme (ou en plus).
   Un thème, un niveau, une durée de 10 à 60 min, un seul endroit. Le planning ne bouge pas : une séance Extra ne coche pas la séance prévue. */
const PT_EXTRA = [{
  id: 'shoot',
  label: 'Tir',
  icon: 'basket',
  basket: true,
  place: 'court'
}, {
  id: 'handle',
  label: 'Dribble',
  icon: 'basket',
  basket: true,
  place: 'home'
}, {
  id: 'finish',
  label: 'Finition',
  icon: 'spark',
  basket: true,
  place: 'court',
  courtOnly: true
}, {
  id: 'moves',
  label: 'Moves & appuis',
  icon: 'run',
  basket: true,
  place: 'court'
}, {
  id: 'defense',
  label: 'Défense',
  icon: 'court',
  basket: true,
  place: 'court',
  courtOnly: true
}, {
  id: 'upper',
  label: 'Haut du corps',
  icon: 'weight',
  place: 'home'
}, {
  id: 'lower',
  label: 'Bas du corps',
  icon: 'body',
  place: 'home',
  legs: true
}, {
  id: 'core',
  label: 'Abdos & gainage',
  icon: 'core',
  place: 'home'
}, {
  id: 'explosive',
  label: 'Explosivité',
  icon: 'spark',
  place: 'court',
  legs: true
}, {
  id: 'mobility',
  label: 'Mobilité & récup',
  icon: 'refresh',
  place: 'home'
}];
const PT_EXTRA_MINUTES = [10, 15, 20, 30, 45, 60];
const PT_EXTRA_OUT = ['court', 'outdoor', 'sand', 'hoop'];
// Ce qu'on emporte au terrain : le reste (charges, banc, machines) reste à la maison.
const PT_EXTRA_CARRY = ['bodyweight', 'bands', 'miniband', 'sliders', 'ball', 'rope', 'cones', 'vest'];
function ptExtraPlan(data, {
  theme,
  place,
  minutes,
  tier
}) {
  const t = PT_EXTRA.find(x => x.id === theme);
  if (!t) return {
    error: 'Choisis un thème.'
  };
  const owned = data.owned || ['bodyweight'],
    court = place === 'court';
  const equipment = court ? [...new Set(['bodyweight', ...owned.filter(n => PT_EXTRA_CARRY.includes(n) || PT_EXTRA_OUT.includes(n))])] : owned.filter(n => !PT_EXTRA_OUT.includes(n));
  const SK = window.BasketSkills,
    BC = window.BasketCore,
    BP = window.BasketPathway,
    JP = window.PlayerProfile;
  const check = {
    ...data.checkIn,
    date: PT.dateKey(),
    equipment,
    minutes,
    format: 'auto',
    motivation: 'normal',
    energy: data.checkIn?.date === PT.dateKey() ? data.checkIn.energy : 'normal'
  };
  let plan = null;
  if (t.basket) plan = SK && SK.areaSession ? SK.areaSession(PT, data, {
    theme,
    minutes,
    tier,
    court
  }) : null;else if (theme === 'upper' || theme === 'lower') plan = PT.zoneSession(data, {
    zone: theme,
    minutes,
    equipment
  });else if (theme === 'core') plan = BC ? BC.workout(PT, {
    ...data,
    owned: equipment
  }, {
    minutes
  }) : null;else if (theme === 'explosive') plan = court && minutes <= 20 && BP ? BP.quickPlan(PT, JP, data, 'vivacite') : PT.generate(data, {
    ...check,
    focus: 'plyo'
  });else if (theme === 'mobility') plan = PT.generate(data, {
    ...check,
    focus: 'mobility'
  });
  if (!plan || plan.error) return plan || {
    error: 'Séance indisponible pour l’instant.'
  };
  const where = court ? 'Tout au terrain.' : 'Tout à la maison.';
  return {
    ...plan,
    id: PT.uid(),
    source: t.basket ? 'extra' : plan.source,
    extra: theme,
    title: `Extra · ${t.label}`,
    reasons: [...(plan.reasons || []).filter(r => !/^Tout (se fait )?(au terrain|à la maison)/.test(r)), ...(t.basket ? [] : [where])]
  };
}
function PTExtra({
  data,
  update,
  go,
  notify
}) {
  const SK = window.BasketSkills;
  const [theme, setThemeRaw] = usePTState('shoot');
  const t = PT_EXTRA.find(x => x.id === theme) || PT_EXTRA[0];
  const [place, setPlace] = usePTState(t.place);
  const [minutes, setMinutes] = usePTState(30);
  const [tier, setTier] = usePTState(null);
  const setTheme = id => {
    const n = PT_EXTRA.find(x => x.id === id);
    setThemeRaw(id);
    setPlace(n.place);
    setTier(null);
  };
  const myTier = t.basket && SK?.extraLevel ? SK.extraLevel(data, theme) : null;
  // Calculée une fois par réglage : la liste affichée est exactement celle qui sera lancée.
  const plan = React.useMemo(() => ptExtraPlan(data, {
    theme,
    place: t.courtOnly ? 'court' : place,
    minutes,
    tier: tier || myTier
  }), [data, theme, place, minutes, tier, myTier]);
  const ctx = PT.context(data);
  // Ce que le planning prévoit aujourd'hui : Extra vient en plus, jamais à la place sans le savoir.
  const SPL = window.SeasonPlan,
    now = PT.dateKey();
  const todayItems = SPL ? (SPL.weekSchedule(data, now, now).days.find(d => d.date === now)?.items || []).filter(x => x.status === 'planned' && x.type !== 'care') : [];
  const start = () => {
    if (data.draft?.status === 'active') {
      go('session');
      notify('Une séance est en cours : termine-la d’abord.');
      return;
    }
    if (!plan || plan.error) {
      notify(plan?.error || 'Séance indisponible.');
      return;
    }
    update(s => ({
      ...s,
      draft: {
        ...plan,
        createdAt: new Date().toISOString()
      }
    }));
    go('preview');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "\xC0 la carte",
    title: "Extra."
  }, "Une s\xE9ance en plus, sur un seul th\xE8me. Ton programme ne bouge pas."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg extra-page"
  }, todayItems.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "extra-today",
    onClick: () => go('today')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "today",
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "Pr\xE9vu aujourd\u2019hui"), /*#__PURE__*/React.createElement("strong", null, todayItems.map(x => x.label).join(' · '))), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 16
  })), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Basket"), /*#__PURE__*/React.createElement(PTChips, {
    value: theme,
    onChange: setTheme,
    options: PT_EXTRA.filter(x => x.basket).map(x => ({
      value: x.id,
      label: x.label
    }))
  })), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Physique"), /*#__PURE__*/React.createElement(PTChips, {
    value: theme,
    onChange: setTheme,
    options: PT_EXTRA.filter(x => !x.basket).map(x => ({
      value: x.id,
      label: x.label
    }))
  })), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm extra-settings"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, "Dur\xE9e")), /*#__PURE__*/React.createElement(PTChips, {
    value: minutes,
    onChange: setMinutes,
    options: PT_EXTRA_MINUTES.map(m => ({
      value: m,
      label: m === 60 ? '1 h' : `${m} min`
    }))
  }), /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, "O\xF9")), t.courtOnly ? /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Au terrain, avec un panier.") : /*#__PURE__*/React.createElement(PTChips, {
    value: place,
    onChange: setPlace,
    options: [{
      value: 'court',
      label: 'Au terrain'
    }, {
      value: 'home',
      label: 'À la maison'
    }]
  }), t.basket && SK && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, "Niveau")), /*#__PURE__*/React.createElement(PTChips, {
    value: tier || myTier,
    onChange: setTier,
    options: SK.TIERS.map((label, i) => ({
      value: i + 1,
      label: i + 1 === myTier ? `${label} · ton palier` : label
    }))
  }))), t.legs && ctx.protectLegs && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, "Tes jambes ont d\xE9j\xE0 travaill\xE9 ou un match approche : pr\xE9f\xE8re le haut du corps, le tir ou la mobilit\xE9 aujourd\u2019hui."), /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm extra-summary",
    "aria-live": "polite"
  }, plan && !plan.error ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h3", null, plan.title), /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "~", plan.estimatedMinutes, " min \xB7 ", plan.exercises.length, " exercices")), /*#__PURE__*/React.createElement("ol", {
    className: "extra-list"
  }, plan.exercises.map(e => /*#__PURE__*/React.createElement("li", {
    key: e.id
  }, /*#__PURE__*/React.createElement("span", null, e.name), /*#__PURE__*/React.createElement("small", null, ptDoseLabel(e))))), (plan.reasons || []).length > 0 && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Pourquoi cette s\xE9ance"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, plan.reasons.map(r => /*#__PURE__*/React.createElement("li", {
    key: r
  }, r)))), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: start
  }, "Lancer cette s\xE9ance", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))) : /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, plan?.error || 'Choisis un thème.'))));
}