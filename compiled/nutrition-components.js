/* Onglet Nutrition : questionnaire de départ (route « nutrition-q ») et conseils du jour (route « nutrition »).
   Toute la logique est dans basket-nutrition.js ; ces écrans posent les questions et affichent le plan. */
const ptNutriVerdict = {
  yes: 'Utile pour toi',
  maybe: 'Selon ta situation',
  doctor: 'Avec ton médecin',
  no: 'Inutile pour toi'
};
function PTNutritionQuiz({
  data,
  update,
  go,
  notify
}) {
  const BN = window.BasketNutrition,
    prev = BN.validate(data.nutrition) || BN.blank();
  const [answers, setAnswers] = usePTState(() => ({
      ...BN.prefill(data),
      ...prev.answers
    })),
    [error, setError] = usePTState('');
  const set = (k, v) => setAnswers(a => ({
    ...a,
    [k]: v
  }));
  const save = () => {
    const miss = BN.missing(BN.validate({
      answers
    }).answers);
    if (miss.length) {
      setError(`Il manque : ${miss.join(', ')}.`);
      return;
    }
    update(s => BN.save(s, answers));
    notify('Profil nutrition enregistré : tes repères sont prêts.');
    go('nutrition');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('nutrition'),
    eyebrow: "Questionnaire nutrition",
    title: "Ton profil."
  }, "Quelques questions pour adapter les rep\xE8res \xE0 ta reprise, \xE0 tes horaires et \xE0 ton alimentation."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg coach-form"
  }, /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Ton gabarit"), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, BN.numbers.map(n => /*#__PURE__*/React.createElement(PTField, {
    key: n.id,
    label: n.label,
    type: "number",
    min: n.min,
    max: n.max,
    step: n.step,
    value: answers[n.id] ?? '',
    onChange: e => set(n.id, e.target.value === '' ? undefined : e.target.value)
  })))), BN.questions.map(q => /*#__PURE__*/React.createElement(PTCoachQ, {
    key: q.id,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, q.label, q.optional ? /*#__PURE__*/React.createElement("small", {
      className: "caption"
    }, " \xB7 facultatif") : null)
  }, /*#__PURE__*/React.createElement(PTChips, {
    multi: !!q.multi,
    value: q.multi ? answers[q.id] || [] : answers[q.id],
    onChange: v => set(q.id, v),
    options: q.options.map(([value, label]) => ({
      value,
      label
    }))
  }))), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: save
  }, "Voir mes conseils", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Rep\xE8res g\xE9n\xE9raux tir\xE9s de consensus scientifiques, pas un avis m\xE9dical ni di\xE9t\xE9tique.")));
}
function PTNutrition({
  data,
  go
}) {
  const BN = window.BasketNutrition,
    [dayType, setDayType] = usePTState('train');
  if (!BN) return /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Nutrition indisponible.");
  const p = BN.plan(data);
  if (!p.ok) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "Nutrition",
    title: "Manger pour rejouer."
  }, "Ce que tu manges, quand, et quels compl\xE9ments valent le coup pour un joueur qui reprend."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Commence par ton profil"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, /*#__PURE__*/React.createElement("li", null, "Tes rep\xE8res du jour : \xE9nergie, prot\xE9ines, glucides, eau."), /*#__PURE__*/React.createElement("li", null, "Ta journ\xE9e type autour de ta s\xE9ance, \xE0 l\u2019heure pr\xE8s."), /*#__PURE__*/React.createElement("li", null, "Les compl\xE9ments utiles pour toi, la dose et le moment, et ceux \xE0 \xE9viter."), /*#__PURE__*/React.createElement("li", null, "Halal, ventre sensible, je\xFBne : tout est pris en compte.")), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('nutrition-q')
  }, "Faire le questionnaire (2 min)", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
  const e = p.energy,
    m = p.macros,
    list = dayType === 'train' ? p.training : p.rest;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: `Nutrition · ${p.goalLabel.toLowerCase()}`,
    title: "Manger pour rejouer."
  }, "Rep\xE8res calcul\xE9s pour ton gabarit et ta semaine d\u2019entra\xEEnement. Ajuste selon ta faim et ta balance."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, p.blocked ? /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, p.blocked) : /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm nutri-targets"
  }, /*#__PURE__*/React.createElement("h2", null, "Tes rep\xE8res du jour"), /*#__PURE__*/React.createElement("div", {
    className: "nutri-kcal"
  }, /*#__PURE__*/React.createElement("strong", null, e.target), /*#__PURE__*/React.createElement("span", null, "kcal par jour \xB7 \xE0 \xB1 ", e.margin, " kcal pr\xE8s")), /*#__PURE__*/React.createElement("div", {
    className: "nutri-macros"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, m.protein, " g"), /*#__PURE__*/React.createElement("small", null, "prot\xE9ines")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, m.carbs, " g"), /*#__PURE__*/React.createElement("small", null, "glucides")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, m.fat, " g"), /*#__PURE__*/React.createElement("small", null, "lipides")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, String(m.waterBase).replace('.', ','), " L"), /*#__PURE__*/React.createElement("small", null, "eau"))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "D\xE9pense estim\xE9e ", e.total, " kcal (repos ", e.resting, ", journ\xE9e ", e.daily, ", entra\xEEnement ", e.training, " en moyenne pour ", Math.round(e.weekMinutes / 60), " h par semaine). Prot\xE9ines : rep\xE8re de 1,6 \xE0 2,2 g par kg, soit ", m.proteinRange[0], " \xE0 ", m.proteinRange[1], " g, en ", m.meals, " prises."), p.notes.map(n => /*#__PURE__*/React.createElement("p", {
    key: n,
    className: "notice warning"
  }, n))), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h2", null, "Ta journ\xE9e type"), /*#__PURE__*/React.createElement(PTChips, {
    value: dayType,
    onChange: setDayType,
    options: [{
      value: 'train',
      label: 'Entraînement'
    }, {
      value: 'rest',
      label: 'Repos'
    }]
  })), /*#__PURE__*/React.createElement("ol", {
    className: "nutri-timeline"
  }, list.map((x, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "nutri-time"
  }, x.time), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, x.title), /*#__PURE__*/React.createElement("p", null, x.what), /*#__PURE__*/React.createElement("small", null, x.why)))))), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Compl\xE9ments"), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, p.supplements.map(s => /*#__PURE__*/React.createElement("article", {
    key: s.id,
    className: `card stack-sm nutri-supp is-${s.verdict}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("strong", null, s.name), /*#__PURE__*/React.createElement("span", {
    className: "badge"
  }, ptNutriVerdict[s.verdict])), s.already && /*#__PURE__*/React.createElement("small", {
    className: "caption"
  }, "Tu en prends d\xE9j\xE0."), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, s.why), s.dose !== '—' && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, /*#__PURE__*/React.createElement("strong", null, "Dose :"), " ", s.dose), s.when !== '—' && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, /*#__PURE__*/React.createElement("strong", null, "Quand :"), " ", s.when), s.note && /*#__PURE__*/React.createElement("p", {
    className: "fine nutri-note"
  }, s.note))))), /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Quoi manger"), [['Protéines', p.foods.protein], ['Glucides', p.foods.carbs], ['Bons gras', p.foods.fats], ['Légumes', p.foods.greens], ['À limiter', p.foods.avoid]].map(([t, l]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, t), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, l.map(x => /*#__PURE__*/React.createElement("li", {
    key: x
  }, x))))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "L\u2019assiette d\u2019un jour d\u2019entra\xEEnement : un tiers de f\xE9culents, un tiers de l\xE9gumes, un tiers de prot\xE9ines. Un jour de repos : moins de f\xE9culents, plus de l\xE9gumes.")), p.fasting.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Les jours de je\xFBne"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, p.fasting.map(x => /*#__PURE__*/React.createElement("li", {
    key: x
  }, x)))), /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Ancien sportif : ce qui compte"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, p.comeback.map(x => /*#__PURE__*/React.createElement("li", {
    key: x
  }, x))), window.BodyWeight && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('weight')
  }, "Ouvrir mon poids de forme \u2192")), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Sur quoi reposent ces rep\xE8res"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, p.sources.map(x => /*#__PURE__*/React.createElement("li", {
    key: x
  }, x))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ce sont des rep\xE8res g\xE9n\xE9raux, pas un avis m\xE9dical ni di\xE9t\xE9tique. Ventre sensible persistant, perte de poids rapide ou traitement en cours : parles-en \xE0 un professionnel de sant\xE9."))), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('nutrition-q')
  }, "Modifier mon profil nutrition")));
}