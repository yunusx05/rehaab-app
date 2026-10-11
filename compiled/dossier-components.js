/* Dossier joueur : accueil, sommaire des 7 chapitres, questions une par une, puis « ce que le coach a compris ».
   La logique vit dans player-dossier.js ; ici, seulement l'affichage. Réutilise les composants de personal-app.jsx. */
const PD = window.PlayerDossier;
const pdPhoto = id => `media/ui/dossier/${id}.webp`;
const pdDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Premier lancement : le dossier complet, ou la version rapide d'avant pour démarrer tout de suite.
function PTDossierWelcome(props) {
  const {
    data,
    update,
    go
  } = props;
  const [quick, setQuick] = usePTState(false),
    [name, setName] = usePTState(data.profile.name || '');
  if (quick) return /*#__PURE__*/React.createElement(PTOnboarding, props);
  const start = () => {
    update(s => ({
      ...s,
      profile: {
        ...s.profile,
        name: name.trim().slice(0, 40)
      },
      dossier: PD.prefill(s)
    }));
    go('dossier-q', 'morpho');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTHeroCard, {
    photo: pdPhoto('hero'),
    eyebrow: "Ton point de d\xE9part",
    title: "Ton dossier joueur."
  }, /*#__PURE__*/React.createElement("p", null, "Ton gabarit, ton basket, ta pause, ta sant\xE9, tes objectifs. Le coach construit ton plan \xE0 partir de tes r\xE9ponses, pas d\u2019un mod\xE8le tout fait.")), /*#__PURE__*/React.createElement(PTField, {
    label: "Comment t\u2019appeler ?",
    autoComplete: "given-name",
    maxLength: "40",
    value: name,
    onChange: e => setName(e.target.value)
  }), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Quatre chapitres essentiels d\u2019abord. Les trois autres affinent le plan quand tu veux. Tout reste sur ce t\xE9l\xE9phone."), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: start
  }, "Commencer mon dossier", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setQuick(true)
  }, "Version rapide (3 questions)")));
}
function PTDossier({
  data,
  update,
  go
}) {
  const dossier = PD.validate(data.dossier) || PD.prefill(data),
    c = PD.completeness(dossier);
  const essentials = c.chapters.filter(x => x.required && !x.done).length,
    due = PD.checkinDue(data);
  const pending = (dossier.followups || []).filter(f => !f.answer).length;
  usePTEffect(() => {
    if (!data.dossier) update(s => ({
      ...s,
      dossier: PD.prefill(s)
    }));
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "Dossier joueur",
    title: "Ce que le coach sait de toi.",
    onBack: data.profile.onboarded ? () => go('profile') : undefined
  }), /*#__PURE__*/React.createElement(PTHeroCard, {
    photo: pdPhoto('hero'),
    eyebrow: c.ready ? 'Dossier prêt' : 'En cours',
    title: c.ready ? 'Ton plan part de là.' : `Encore ${essentials} chapitre${essentials > 1 ? 's' : ''} essentiel${essentials > 1 ? 's' : ''}.`,
    aside: /*#__PURE__*/React.createElement(PTRing, {
      value: c.percent,
      total: 100,
      label: `Dossier rempli à ${c.percent} %`
    }, /*#__PURE__*/React.createElement("strong", {
      className: "num"
    }, c.percent, "%"))
  }, /*#__PURE__*/React.createElement("p", null, c.ready ? 'Plus tu complètes, plus les exercices et le calendrier collent à toi.' : 'Le gabarit, ton basket, ta santé et tes objectifs suffisent pour démarrer.'), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, c.ready && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('dossier-synthese')
  }, "Ce que le coach a compris"), c.next && /*#__PURE__*/React.createElement(PTButton, {
    primary: !c.ready,
    onClick: () => go('dossier-q', c.next.id)
  }, c.ready ? 'Affiner' : 'Continuer', " : ", c.next.title.toLowerCase()))), due && /*#__PURE__*/React.createElement("div", {
    className: "notice"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Point d\u2019\xE9tape."), " Quatre semaines depuis ta derni\xE8re mise \xE0 jour : ton poids, tes douleurs et ta semaine ont peut-\xEAtre chang\xE9."), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('dossier-q', 'health')
  }, "Faire le point \u2192")), pending > 0 && /*#__PURE__*/React.createElement("div", {
    className: "notice"
  }, /*#__PURE__*/React.createElement("p", null, "Le coach a ", pending, " question", pending > 1 ? 's' : '', " pour toi."), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('dossier-synthese')
  }, "R\xE9pondre \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "image-grid"
  }, c.chapters.map((ch, i) => /*#__PURE__*/React.createElement(PTImageTile, {
    key: ch.id,
    photo: pdPhoto(ch.photo),
    eyebrow: `Chapitre ${i + 1}`,
    title: ch.title,
    text: ch.short,
    badge: ch.required ? 'Essentiel' : null,
    done: ch.done,
    progress: {
      count: ch.count,
      total: ch.total
    },
    onClick: () => go('dossier-q', ch.id),
    tall: i === 0
  }))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ces r\xE9ponses remplacent le profil joueur, \xAB Mon jeu \xBB et les questions du bilan physique : tu n\u2019as plus \xE0 les remplir \xE0 part. Les tests chronom\xE9tr\xE9s restent dans le bilan."));
}
function PTDossierAnswer({
  q,
  value,
  onChange
}) {
  const multi = q.type === 'multi' || q.type === 'rank';
  if (q.type === 'single') return /*#__PURE__*/React.createElement(PTChoices, {
    options: q.options,
    value: value,
    onChange: onChange
  });
  if (multi) return /*#__PURE__*/React.createElement("div", {
    className: "choice-grid"
  }, q.options.map(o => {
    const pos = (value || []).indexOf(o.value);
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: o.value,
      className: "choice",
      "aria-pressed": pos >= 0,
      onClick: () => onChange(PD.toggle(q, value, o.value))
    }, q.type === 'rank' && pos >= 0 && /*#__PURE__*/React.createElement("span", {
      className: "dossier-rank"
    }, pos + 1), o.label, o.hint && /*#__PURE__*/React.createElement("small", null, o.hint));
  }));
  if (q.type === 'number') return /*#__PURE__*/React.createElement("div", {
    className: "dossier-number"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    min: q.min,
    max: q.max,
    step: q.step || 1,
    value: value ?? '',
    "aria-label": q.label,
    onChange: e => onChange(e.target.value === '' ? undefined : Number(e.target.value))
  }), /*#__PURE__*/React.createElement("span", null, q.unit));
  if (q.type === 'scale') return /*#__PURE__*/React.createElement("div", {
    className: "dossier-scale"
  }, /*#__PURE__*/React.createElement("strong", null, value ?? 3, /*#__PURE__*/React.createElement("small", null, " / 10")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "10",
    step: "1",
    value: value ?? 3,
    "aria-label": q.label,
    onChange: e => onChange(Number(e.target.value))
  }));
  if (q.type === 'days') return /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    value: value || [],
    onChange: onChange,
    options: pdDays.map((label, i) => ({
      value: i,
      label
    }))
  });
  if (q.type === 'day') return /*#__PURE__*/React.createElement(PTChips, {
    value: value,
    onChange: onChange,
    options: [...pdDays.map((label, i) => ({
      value: i,
      label
    })), {
      value: 'none',
      label: 'Pas de jour fixe'
    }]
  });
  if (q.type === 'text') return /*#__PURE__*/React.createElement("textarea", {
    maxLength: q.max || 200,
    value: value || '',
    "aria-label": q.label,
    onChange: e => onChange(e.target.value)
  });
  if (q.type === 'equipment') return /*#__PURE__*/React.createElement(PTEquipment, {
    inventory: true,
    selected: value || ['bodyweight'],
    onChange: onChange
  });
  return null;
}
function PTDossierChapter({
  data,
  update,
  go,
  notify,
  id
}) {
  const chapter = PD.chapters.find(c => c.id === id) || PD.chapters[0];
  const [answers, setAnswers] = usePTState(() => ({
    ...(PD.validate(data.dossier) || PD.prefill(data)).answers
  }));
  const [index, setIndex] = usePTState(0);
  const list = PD.questionsFor(chapter.id, answers),
    i = Math.min(index, list.length - 1),
    q = list[i];
  const value = answers[q.id];
  // Le scale démarre à 3 : on l'enregistre dès l'affichage pour que « Suivant » soit possible sans toucher au curseur.
  usePTEffect(() => {
    if (q.type === 'scale' && value === undefined) setAnswers(a => ({
      ...a,
      [q.id]: 3
    }));
    if (q.type === 'equipment' && value === undefined) setAnswers(a => ({
      ...a,
      [q.id]: data.owned
    }));
  }, [q.id]);
  const set = v => setAnswers(a => {
    const next = {
      ...a
    };
    if (v === undefined || Array.isArray(v) && !v.length) delete next[q.id];else next[q.id] = v;
    return next;
  });
  const clean = PD.cleanAnswer(q, value),
    ok = !q.required || PD.answered(q, clean);
  const numberOff = q.type === 'number' && value !== undefined && clean === undefined;
  const last = i === list.length - 1;
  const save = () => {
    const wasReady = PD.completeness(data.dossier).ready;
    const next = PD.saveChapter(data, chapter.id, answers);
    update(() => next);
    const c = PD.completeness(next.dossier);
    notify(`Chapitre « ${chapter.title} » enregistré.`);
    if (c.ready && !wasReady) go('dossier-synthese');else if (!c.ready && c.next) go('dossier-q', c.next.id);else go('dossier');
  };
  const advance = () => {
    if (last) save();else setIndex(i + 1);
  };
  const pick = v => {
    set(v);
    if (q.type === 'single' && !last) setTimeout(() => setIndex(n => n === i ? i + 1 : n), 220);
  };
  const flags = PD.redFlags(answers).length > 0,
    severe = PD.pains(answers).some(p => p.severity >= 7);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    className: "back-link",
    onClick: () => i > 0 ? setIndex(i - 1) : go('dossier')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 18
  }), "Retour"), /*#__PURE__*/React.createElement("div", {
    className: "dossier-banner"
  }, /*#__PURE__*/React.createElement("img", {
    src: pdPhoto(chapter.photo),
    alt: "",
    decoding: "async"
  }), /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Dossier joueur"), /*#__PURE__*/React.createElement("h1", null, chapter.title)), /*#__PURE__*/React.createElement("div", {
    className: "step-caption"
  }, /*#__PURE__*/React.createElement("span", null, "Question ", i + 1, " sur ", list.length), /*#__PURE__*/React.createElement("span", null, chapter.required ? 'Essentiel' : 'Pour affiner')), /*#__PURE__*/React.createElement("div", {
    className: "step-track"
  }, list.map((x, n) => /*#__PURE__*/React.createElement("span", {
    className: n <= i ? 'done' : '',
    key: x.id
  }))), /*#__PURE__*/React.createElement("section", {
    className: "dossier-question",
    key: q.id
  }, /*#__PURE__*/React.createElement("h2", null, q.label), q.hint && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, q.hint), /*#__PURE__*/React.createElement(PTDossierAnswer, {
    q: q,
    value: value,
    onChange: q.type === 'single' ? pick : set
  }), numberOff && /*#__PURE__*/React.createElement("p", {
    className: "error"
  }, "Entre une valeur entre ", q.min, " et ", q.max, " ", q.unit, "."), q.id === 'flags' && flags && /*#__PURE__*/React.createElement("div", {
    role: "alert",
    className: "notice warning"
  }, "Fais examiner la zone par un m\xE9decin ou un kin\xE9 avant tout exercice cibl\xE9. L\u2019app ne proposera rien qui la sollicite tant que ce signe est signal\xE9."), q.id.startsWith('pain-') && q.type === 'scale' && severe && /*#__PURE__*/React.createElement("div", {
    role: "alert",
    className: "notice warning"
  }, "7/10 ou plus : pas de s\xE9ance g\xE9n\xE9r\xE9e tant que la douleur n\u2019a pas \xE9t\xE9 vue par un professionnel.")), /*#__PURE__*/React.createElement("div", {
    className: "dossier-actions"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !ok || numberOff,
    onClick: advance
  }, last ? 'Enregistrer le chapitre' : 'Suivant'), !q.required && !last && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => {
      set(undefined);
      setIndex(i + 1);
    }
  }, "Passer cette question"), !q.required && last && value === undefined && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Facultatif : tu peux enregistrer sans r\xE9pondre.")));
}
function PTDossierSynthesis({
  data,
  update,
  go,
  notify
}) {
  const dossier = PD.validate(data.dossier) || PD.blank(),
    local = PD.localSynthesis(data);
  const shown = dossier.synthesis?.source === 'ai' ? dossier.synthesis : local;
  const [busy, setBusy] = usePTState(false),
    [error, setError] = usePTState(''),
    [drafts, setDrafts] = usePTState({});
  const open = dossier.followups.filter(f => !f.answer);
  const ask = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'dossier',
          messages: [{
            role: 'user',
            text: 'Voici mon dossier. Dis-moi ce que tu as compris et ce qu’il te manque.'
          }],
          context: {
            dossier: PD.summary(dossier),
            computed: {
              priorities: local.priorities,
              risks: local.risks
            }
          }
        })
      });
      const j = await res.json();
      if (!res.ok || !j.message) throw new Error(j.error || 'Le coach ne répond pas pour le moment.');
      const known = new Set(dossier.followups.map(f => f.question));
      update(s => ({
        ...s,
        dossier: PD.validate({
          ...(s.dossier || PD.blank()),
          synthesis: {
            message: j.message,
            priorities: j.priorities || [],
            risks: j.risks || [],
            source: 'ai',
            date: PT.dateKey()
          },
          followups: [...(s.dossier && s.dossier.followups || []), ...(j.questions || []).filter(x => !known.has(x)).map(question => ({
            id: PT.uid(),
            question,
            answer: '',
            date: PT.dateKey()
          }))]
        })
      }));
      notify('Analyse du coach reçue.');
    } catch (e) {
      setError(`${e.message || 'Le coach ne répond pas.'} La synthèse ci-dessous est calculée par l’app, hors ligne.`);
    }
    setBusy(false);
  };
  const saveAnswers = () => {
    update(s => ({
      ...s,
      dossier: PD.validate({
        ...s.dossier,
        followups: s.dossier.followups.map(f => drafts[f.id]?.trim() ? {
          ...f,
          answer: drafts[f.id].trim()
        } : f)
      })
    }));
    setDrafts({});
    notify('Réponses enregistrées : le coach les lira à chaque décision.');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "Dossier joueur",
    title: "Ce que le coach a compris.",
    onBack: () => go('dossier')
  }), /*#__PURE__*/React.createElement(PTHeroCard, {
    photo: pdPhoto('goals'),
    eyebrow: shown.source === 'ai' ? 'Analyse du coach IA' : 'Synthèse de l’app',
    title: "Ton point de d\xE9part."
  }, /*#__PURE__*/React.createElement("p", null, shown.message)), shown.priorities.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Tes 3 priorit\xE9s"), shown.priorities.map((p, n) => /*#__PURE__*/React.createElement("div", {
    className: "dossier-priority",
    key: p.label
  }, /*#__PURE__*/React.createElement("b", null, n + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, p.label), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, p.why))))), shown.risks.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Points d\u2019attention"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, shown.risks.map(r => /*#__PURE__*/React.createElement("li", {
    key: r
  }, r)))), open.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Ses questions pour toi"), open.map(f => /*#__PURE__*/React.createElement("label", {
    className: "dossier-followup",
    key: f.id
  }, /*#__PURE__*/React.createElement("strong", null, f.question), /*#__PURE__*/React.createElement("textarea", {
    maxLength: "400",
    value: drafts[f.id] || '',
    onChange: e => setDrafts(d => ({
      ...d,
      [f.id]: e.target.value
    }))
  }))), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !Object.values(drafts).some(v => v.trim()),
    onClick: saveAnswers
  }, "Enregistrer mes r\xE9ponses")), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "notice warning"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, !PD.completeness(dossier).ready && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('dossier-q', PD.completeness(dossier).next.id)
  }, "Compl\xE9ter mon dossier"), /*#__PURE__*/React.createElement(PTButton, {
    primary: !open.length && PD.completeness(dossier).ready,
    disabled: busy,
    onClick: ask
  }, busy ? 'Le coach lit ton dossier…' : shown.source === 'ai' ? 'Relancer l’analyse du coach' : 'Demander l’analyse du coach IA'), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('today')
  }, "Voir ma s\xE9ance du jour")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Le coach n\u2019est pas m\xE9decin : il ne pose aucun diagnostic. Une douleur qui dure ou un signe inhabituel se montre \xE0 un professionnel."));
}