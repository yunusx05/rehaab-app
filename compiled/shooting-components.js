/* Lot 17 : séances de tir (routes « shooting », « shooting-new », « shooting-live ») et poids de forme (route « weight »).
   Graphiques en SVG à la main : une seule échelle par graphique, une série par graphique, tableau de données à la demande. */
const SH = window.Shooting,
  BW = window.BodyWeight;
const ptFr = n => String(n).replace('.', ',');
const ptDay = d => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

// Graphique en barres d'une série (une seule échelle). values : [{label, value|null, title}].
function PTBarChart({
  values,
  max,
  unit = '',
  label,
  format = v => `${v}${unit}`,
  highlight
}) {
  const [hover, setHover] = usePTState(null);
  const W = 320,
    H = 150,
    P = {
      t: 22,
      r: 8,
      b: 22,
      l: 30
    },
    iw = W - P.l - P.r,
    ih = H - P.t - P.b,
    bw = iw / values.length,
    top = max || Math.max(1, ...values.map(v => v.value || 0));
  const y = v => P.t + ih - v / top * ih,
    ticks = [0, top / 2, top];
  const shown = hover !== null ? values[hover] : null;
  return /*#__PURE__*/React.createElement("figure", {
    className: "chart"
  }, /*#__PURE__*/React.createElement("figcaption", {
    className: "chart-readout",
    "aria-live": "polite"
  }, shown ? `${shown.title} : ${shown.value === null ? 'aucune donnée' : format(shown.value)}` : label), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    role: "img",
    "aria-label": label
  }, ticks.map(t => /*#__PURE__*/React.createElement("g", {
    key: t
  }, /*#__PURE__*/React.createElement("line", {
    x1: P.l,
    x2: W - P.r,
    y1: y(t),
    y2: y(t),
    className: "chart-grid"
  }), /*#__PURE__*/React.createElement("text", {
    x: P.l - 6,
    y: y(t) + 3,
    className: "chart-axis",
    textAnchor: "end"
  }, Math.round(t)))), values.map((v, i) => {
    const x = P.l + i * bw + bw * .18,
      w = bw * .64;
    const h = v.value ? Math.max(4, ih - (y(v.value) - P.t)) : 0;
    return /*#__PURE__*/React.createElement("g", {
      key: i,
      tabIndex: "0",
      role: "button",
      "aria-label": `${v.title} : ${v.value === null ? 'aucune donnée' : format(v.value)}`,
      onMouseEnter: () => setHover(i),
      onMouseLeave: () => setHover(null),
      onFocus: () => setHover(i),
      onBlur: () => setHover(null),
      onClick: () => setHover(i)
    }, /*#__PURE__*/React.createElement("rect", {
      x: P.l + i * bw,
      y: P.t,
      width: bw,
      height: ih,
      fill: "transparent"
    }), v.value !== null && /*#__PURE__*/React.createElement("path", {
      d: `M${x},${P.t + ih} v${-(h - 4)} q0,-4 4,-4 h${w - 8} q4,0 4,4 v${h - 4} z`,
      className: `chart-bar${hover === i || highlight === i ? ' is-active' : ''}`
    }), v.value === null && /*#__PURE__*/React.createElement("line", {
      x1: x,
      x2: x + w,
      y1: P.t + ih - 1,
      y2: P.t + ih - 1,
      className: "chart-empty"
    }), highlight === i && v.value !== null && /*#__PURE__*/React.createElement("text", {
      x: x + w / 2,
      y: y(v.value) - 6,
      textAnchor: "middle",
      className: "chart-label"
    }, format(v.value)), /*#__PURE__*/React.createElement("text", {
      x: x + w / 2,
      y: H - 6,
      textAnchor: "middle",
      className: "chart-axis"
    }, v.label));
  })));
}

// Carte de tir : une zone = un cercle, pourcentage écrit (jamais la couleur seule), intensité selon le %.
function PTShotMap({
  zones
}) {
  const Z = SH.ZONES,
    by = Object.fromEntries(zones.map(z => [z.key, z]));
  return /*#__PURE__*/React.createElement("svg", {
    className: "shot-map",
    viewBox: "0 0 300 280",
    role: "img",
    "aria-label": "Carte de tir : pourcentage de r\xE9ussite par zone"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "300",
    height: "280",
    rx: "14",
    className: "court-floor"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M24 0 V40 A134 134 0 0 0 276 40 V0",
    className: "court-line",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "105",
    y: "0",
    width: "90",
    height: "130",
    className: "court-line",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "150",
    cy: "130",
    r: "30",
    className: "court-line",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "150",
    cy: "18",
    r: "7",
    className: "court-rim"
  }), Object.entries(Z).map(([k, z]) => {
    const d = by[k];
    const p = d ? d.pct : null;
    return /*#__PURE__*/React.createElement("g", {
      key: k
    }, /*#__PURE__*/React.createElement("circle", {
      cx: z.x,
      cy: z.y,
      r: "19",
      className: `shot-zone${d ? '' : ' is-empty'}`,
      style: d ? {
        fillOpacity: .18 + .72 * (p / 100)
      } : null
    }), /*#__PURE__*/React.createElement("text", {
      x: z.x,
      y: z.y + 4,
      textAnchor: "middle",
      className: "shot-zone-label"
    }, d ? `${p}%` : '–'), /*#__PURE__*/React.createElement("title", null, `${z.label} : ${d ? `${d.made}/${d.attempts} (${p} %)` : 'pas encore de tir'}`));
  }));
}
function PTShooting({
  data,
  update,
  go,
  notify
}) {
  if (!SH) return /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Module de tir indisponible.");
  const sh = SH.validate(data.shooting) || SH.blank(),
    weeks = SH.weekly(sh, 8),
    cmp = SH.compare(sh),
    rec = SH.records(sh),
    drills = SH.byDrill(sh),
    zones = SH.byZone(sh);
  const start = routine => {
    const d = SH.fromRoutine(routine, {
      custom: sh.custom
    });
    if (d.error) {
      notify(d.error);
      return;
    }
    update(s => ({
      ...s,
      shooting: {
        ...(SH.validate(s.shooting) || SH.blank()),
        draft: d
      }
    }));
    go('shooting-live');
  };
  const best = weeks.reduce((b, w, i) => w.pct !== null && (b === null || w.pct > weeks[b].pct) ? i : b, null);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('pathway'),
    title: "Mes s\xE9ances de tir."
  }, "Compte tes r\xE9ussis et tes rat\xE9s, l\u2019app suit ton pourcentage semaine apr\xE8s semaine."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, sh.draft && /*#__PURE__*/React.createElement("button", {
    className: "resume-workout",
    onClick: () => go('shooting-live')
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "S\xE9ance de tir en cours"), /*#__PURE__*/React.createElement("strong", null, sh.draft.title)), /*#__PURE__*/React.createElement("span", {
    className: "round-play"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "image-grid"
  }, SH.ROUTINES.map((r, i) => /*#__PURE__*/React.createElement(PTImageTile, {
    key: r.id,
    tall: i === 0,
    photo: ptHub(i % 2 ? 'skills' : 'shooting'),
    title: r.label,
    text: r.why,
    onClick: () => start(r.id)
  }))), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('shooting-new')
  }, "Composer ma s\xE9ance", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), sh.sessions.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Ta premi\xE8re s\xE9ance remplira ici ton pourcentage par semaine, ta carte de tir et tes records.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, cmp.cur.attempts ? `${cmp.cur.pct} % cette semaine` : 'Pas encore de tir cette semaine'), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, cmp.cur.attempts ? `${cmp.cur.made} réussis sur ${cmp.cur.attempts}` : '', cmp.delta !== null ? ` · ${cmp.delta >= 0 ? '+' : ''}${cmp.delta} points par rapport à la semaine précédente (${cmp.prev.pct} %)` : ''), /*#__PURE__*/React.createElement(PTBarChart, {
    label: "R\xE9ussite par semaine, en %",
    values: weeks.map(w => ({
      label: ptDay(w.monday),
      title: `Semaine du ${ptDay(w.monday)}`,
      value: w.pct
    })),
    max: 100,
    unit: " %",
    highlight: best
  }), /*#__PURE__*/React.createElement(PTBarChart, {
    label: "Volume : tirs tent\xE9s par semaine",
    values: weeks.map(w => ({
      label: ptDay(w.monday),
      title: `Semaine du ${ptDay(w.monday)}`,
      value: w.attempts || null
    })),
    format: v => `${v} tirs`,
    highlight: weeks.length - 1
  }), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Voir les donn\xE9es"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Semaine"), /*#__PURE__*/React.createElement("th", null, "R\xE9ussis"), /*#__PURE__*/React.createElement("th", null, "Tent\xE9s"), /*#__PURE__*/React.createElement("th", null, "%"))), /*#__PURE__*/React.createElement("tbody", null, weeks.map(w => /*#__PURE__*/React.createElement("tr", {
    key: w.monday
  }, /*#__PURE__*/React.createElement("td", null, ptDay(w.monday)), /*#__PURE__*/React.createElement("td", null, w.made), /*#__PURE__*/React.createElement("td", null, w.attempts), /*#__PURE__*/React.createElement("td", null, w.pct === null ? '–' : `${w.pct} %`)))))))), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Carte de tir"), /*#__PURE__*/React.createElement(PTShotMap, {
    zones: zones
  })), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Records"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, rec.bestSession && /*#__PURE__*/React.createElement("li", null, "Meilleure s\xE9ance (20 tirs ou plus) : ", rec.bestSession.pct, " % (", rec.bestSession.made, "/", rec.bestSession.attempts, ") le ", ptDay(rec.bestSession.date), "."), rec.streak > 0 && /*#__PURE__*/React.createElement("li", null, "Plus longue s\xE9rie : ", rec.streak, " r\xE9ussis d\u2019affil\xE9e."), rec.ft && /*#__PURE__*/React.createElement("li", null, "Lancers francs : ", rec.ft.made, "/", rec.ft.attempts, " le ", ptDay(rec.ft.date), "."))), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Par exercice"), /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Exercice"), /*#__PURE__*/React.createElement("th", null, "R\xE9ussis"), /*#__PURE__*/React.createElement("th", null, "%"))), /*#__PURE__*/React.createElement("tbody", null, drills.map(d => /*#__PURE__*/React.createElement("tr", {
    key: d.key
  }, /*#__PURE__*/React.createElement("td", null, SH.drillLabel(d.key, sh.custom)), /*#__PURE__*/React.createElement("td", null, d.made, "/", d.attempts), /*#__PURE__*/React.createElement("td", null, d.pct, " %")))))))));
}
function PTShootingNew({
  data,
  update,
  go,
  notify
}) {
  const sh = SH.validate(data.shooting) || SH.blank();
  const [rows, setRows] = usePTState([]),
    [drill, setDrill] = usePTState('sk-catch-mid'),
    [zone, setZone] = usePTState('ft'),
    [target, setTarget] = usePTState(5);
  const zonesOf = d => (SH.DRILLS[d] || {}).zones || Object.keys(SH.ZONES);
  const add = () => {
    if (!zonesOf(drill).includes(zone)) return;
    setRows(r => [...r, [drill, zone, Number(target)]].slice(0, 40));
  };
  const addAll = () => setRows(r => [...r, ...zonesOf(drill).map(z => [drill, z, Number(target)])].slice(0, 40));
  const startIt = () => {
    const d = SH.create(rows, {
      custom: sh.custom,
      title: 'Ma séance de tir'
    });
    if (d.error) {
      notify(d.error);
      return;
    }
    update(s => ({
      ...s,
      shooting: {
        ...(SH.validate(s.shooting) || SH.blank()),
        draft: d
      }
    }));
    go('shooting-live');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('shooting'),
    title: "Ma s\xE9ance de tir."
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Exercice"
  }, /*#__PURE__*/React.createElement("select", {
    value: drill,
    onChange: e => {
      setDrill(e.target.value);
      setZone(zonesOf(e.target.value)[0]);
      setTarget(SH.DRILLS[e.target.value]?.attempts || 5);
    }
  }, Object.entries(SH.DRILLS).map(([id, d]) => /*#__PURE__*/React.createElement("option", {
    key: id,
    value: id
  }, d.label)))), /*#__PURE__*/React.createElement(PTField, {
    label: "Zone"
  }, /*#__PURE__*/React.createElement("select", {
    value: zone,
    onChange: e => setZone(e.target.value)
  }, zonesOf(drill).map(z => /*#__PURE__*/React.createElement("option", {
    key: z,
    value: z
  }, SH.ZONES[z].label)))), /*#__PURE__*/React.createElement(PTField, {
    label: "Tirs",
    type: "number",
    min: "1",
    max: "100",
    value: target,
    onChange: e => setTarget(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: add
  }, "Ajouter cette zone"), zonesOf(drill).length > 1 && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: addAll
  }, "Toutes ses zones")), rows.length > 0 ? /*#__PURE__*/React.createElement("ol", {
    className: "dose-list"
  }, rows.map(([d, z, t], i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("span", null, SH.drillLabel(d, sh.custom), " \xB7 ", SH.ZONES[z].label), /*#__PURE__*/React.createElement("small", null, t, " tirs ", /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setRows(r => r.filter((_, n) => n !== i))
  }, "Retirer"))))) : /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Ajoute des exercices : chaque ligne est un exercice dans une zone, avec un nombre de tirs."), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !rows.length,
    onClick: startIt
  }, "Commencer (", rows.reduce((n, r) => n + r[2], 0), " tirs)", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))));
}
function PTShootingLive({
  data,
  update,
  go,
  notify
}) {
  const sh = SH.validate(data.shooting) || SH.blank(),
    d = sh.draft;
  if (!d) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('shooting'),
    title: "S\xE9ance de tir."
  }), /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Aucune s\xE9ance en cours."), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('shooting')
  }, "Choisir une routine"));
  const it = d.items[d.cursor],
    t = SH.totals(d),
    streak = (() => {
      let n = 0;
      for (let i = it.log.length - 1; i >= 0 && it.log[i] === 1; i--) n++;
      return n;
    })();
  const set = next => update(s => ({
    ...s,
    shooting: {
      ...(SH.validate(s.shooting) || SH.blank()),
      draft: next
    }
  }));
  const tap = made => {
    if (typeof ptCue === 'function') ptCue(made ? 'tick' : 'left');
    set(SH.shot(d, made));
  };
  const end = () => {
    const r = SH.finish(sh, d);
    update(s => {
      let next = {
        ...s,
        shooting: r.shooting
      };
      const SK = window.BasketSkills;
      if (r.session && SK && SK.complete(s.skills)) {
        next.skills = SK.record(s.skills, SH.toSkillSession(r.session)).skills;
      }
      return next;
    });
    notify(r.session ? `Séance enregistrée : ${SH.totals(r.session).made}/${SH.totals(r.session).attempts} (${SH.totals(r.session).pct} %).` : 'Séance vide : rien n’a été enregistré.');
    go('shooting');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('shooting'),
    title: d.title
  }, `Ligne ${d.cursor + 1} sur ${d.items.length}`), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg shot-live"
  }, /*#__PURE__*/React.createElement("section", {
    className: "shot-now"
  }, /*#__PURE__*/React.createElement("span", {
    className: "shot-zone-name"
  }, SH.ZONES[it.zone].label), /*#__PURE__*/React.createElement("strong", null, SH.drillLabel(it.drill, sh.custom)), /*#__PURE__*/React.createElement("span", {
    className: "shot-count"
  }, /*#__PURE__*/React.createElement("b", null, it.made), "/", it.attempts, /*#__PURE__*/React.createElement("small", null, " sur ", it.target)), /*#__PURE__*/React.createElement("span", {
    className: "mini-progress"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      transform: `scaleX(${Math.min(1, it.attempts / it.target)})`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, t.attempts ? `${t.pct} % sur la séance · ${t.made}/${t.attempts}` : 'Premier tir', streak > 1 ? ` · série : ${streak}` : '')), /*#__PURE__*/React.createElement("div", {
    className: "shot-buttons"
  }, /*#__PURE__*/React.createElement("button", {
    className: "shot-btn is-made",
    onClick: () => tap(true)
  }, "R\xE9ussi"), /*#__PURE__*/React.createElement("button", {
    className: "shot-btn is-miss",
    onClick: () => tap(false)
  }, "Rat\xE9")), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    disabled: !t.attempts,
    onClick: () => set(SH.undo(d))
  }, "Annuler le dernier tir"), d.cursor < d.items.length - 1 && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => set({
      ...d,
      cursor: d.cursor + 1
    })
  }, "Ligne suivante")), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: end
  }, "Terminer la s\xE9ance")));
}

// Courbe du poids : moyenne sur 7 jours (ligne), pesées (points), poids de jeu (repère pointillé, nommé directement).
function PTWeightChart({
  points,
  playWeight,
  weeks = 12
}) {
  const [hover, setHover] = usePTState(null);
  if (points.length < 2) return /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "La courbe appara\xEEt apr\xE8s deux pes\xE9es.");
  const W = 320,
    H = 170,
    P = {
      t: 20,
      r: 10,
      b: 22,
      l: 34
    },
    iw = W - P.l - P.r,
    ih = H - P.t - P.b;
  const now = PT.dateKey(),
    start = Date.parse(`${points[0].date}T12:00:00Z`),
    endT = Date.parse(`${now}T12:00:00Z`),
    span = Math.max(1, endT - start);
  const vals = points.flatMap(p => [p.weight, p.avg]).concat(playWeight ? [playWeight] : []),
    lo = Math.floor(Math.min(...vals) - 1),
    hi = Math.ceil(Math.max(...vals) + 1);
  const x = d => P.l + (Date.parse(`${d}T12:00:00Z`) - start) / span * iw,
    y = v => P.t + ih - (v - lo) / (hi - lo) * ih;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.avg).toFixed(1)}`).join(' ');
  const shown = hover !== null ? points[hover] : points[points.length - 1];
  return /*#__PURE__*/React.createElement("figure", {
    className: "chart"
  }, /*#__PURE__*/React.createElement("figcaption", {
    className: "chart-readout",
    "aria-live": "polite"
  }, `${ptDay(shown.date)} : pesée ${ptFr(shown.weight)} kg · moyenne 7 jours ${ptFr(shown.avg)} kg`), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    role: "img",
    "aria-label": `Poids sur ${weeks} semaines : moyenne 7 jours de ${ptFr(points[0].avg)} à ${ptFr(points[points.length - 1].avg)} kg${playWeight ? `, poids de jeu ${ptFr(playWeight)} kg` : ''}`
  }, [lo, (lo + hi) / 2, hi].map(t => /*#__PURE__*/React.createElement("g", {
    key: t
  }, /*#__PURE__*/React.createElement("line", {
    x1: P.l,
    x2: W - P.r,
    y1: y(t),
    y2: y(t),
    className: "chart-grid"
  }), /*#__PURE__*/React.createElement("text", {
    x: P.l - 6,
    y: y(t) + 3,
    textAnchor: "end",
    className: "chart-axis"
  }, Math.round(t)))), playWeight && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
    x1: P.l,
    x2: W - P.r,
    y1: y(playWeight),
    y2: y(playWeight),
    className: "chart-ref"
  }), /*#__PURE__*/React.createElement("text", {
    x: W - P.r,
    y: y(playWeight) - 5,
    textAnchor: "end",
    className: "chart-axis"
  }, "Poids de jeu ", ptFr(playWeight), " kg")), /*#__PURE__*/React.createElement("path", {
    d: line,
    className: "chart-line",
    fill: "none"
  }), points.map((p, i) => /*#__PURE__*/React.createElement("g", {
    key: p.date,
    tabIndex: "0",
    role: "button",
    "aria-label": `${ptDay(p.date)} : ${ptFr(p.weight)} kg`,
    onMouseEnter: () => setHover(i),
    onFocus: () => setHover(i),
    onClick: () => setHover(i)
  }, /*#__PURE__*/React.createElement("circle", {
    cx: x(p.date),
    cy: y(p.weight),
    r: "12",
    fill: "transparent"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: x(p.date),
    cy: y(p.weight),
    r: "4",
    className: `chart-dot${hover === i ? ' is-active' : ''}`
  }))), /*#__PURE__*/React.createElement("text", {
    x: P.l,
    y: H - 6,
    className: "chart-axis"
  }, ptDay(points[0].date)), /*#__PURE__*/React.createElement("text", {
    x: W - P.r,
    y: H - 6,
    textAnchor: "end",
    className: "chart-axis"
  }, ptDay(points[points.length - 1].date))), /*#__PURE__*/React.createElement("p", {
    className: "chart-key fine"
  }, "Points : tes pes\xE9es. Ligne : moyenne sur 7 jours, qui lisse les variations d\u2019un jour \xE0 l\u2019autre."));
}
function PTWeight({
  data,
  update,
  go,
  notify
}) {
  const [value, setValue] = usePTState(''),
    [error, setError] = usePTState('');
  if (!BW) return /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Module indisponible.");
  const s = BW.summary(data),
    pts = BW.series(data, 12),
    blocked = s.guard.blocks.length > 0;
  const save = () => {
    const r = BW.addWeighIn(data, value.replace(',', '.'));
    if (r.error) {
      setError(r.error);
      return;
    }
    setError('');
    setValue('');
    update(() => r.state);
    notify('Pesée enregistrée.');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('profile'),
    title: "Poids de forme."
  }, "Ton poids face \xE0 ton poids de jeu, liss\xE9 sur 7 jours. P\xE8se-toi le matin, une fois par semaine suffit."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Pes\xE9e du jour (kg)",
    type: "text",
    inputMode: "decimal",
    autoComplete: "off",
    placeholder: "ex. 87,6",
    value: value,
    onChange: e => setValue(e.target.value)
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !value,
    onClick: save
  }, "Enregistrer ma pes\xE9e"), s.weighInDue && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, s.last ? `Dernière pesée le ${ptDay(s.last.date)}.` : 'Aucune pesée pour l’instant.')), blocked ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm"
  }, s.guard.blocks.map(b => /*#__PURE__*/React.createElement("p", {
    key: b
  }, b))) : s.avg !== null && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, ptFr(s.avg), " kg en moyenne sur 7 jours"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, s.gap !== null && /*#__PURE__*/React.createElement("li", null, s.gap > 0 ? `${ptFr(s.gap)} kg au-dessus` : s.gap < 0 ? `${ptFr(-s.gap)} kg en dessous` : 'Pile', " de ton poids de jeu (", ptFr(s.playWeight), " kg)."), s.trend !== null && /*#__PURE__*/React.createElement("li", null, "Tendance sur 4 semaines : ", s.trend > 0 ? '+' : '', ptFr(s.trend), " kg par semaine."), s.target && /*#__PURE__*/React.createElement("li", null, "Ton objectif d\xE9clar\xE9 : ", ptFr(s.target), " kg."), s.gap !== null && s.gap >= 5 && /*#__PURE__*/React.createElement("li", null, "Tant que l\u2019\xE9cart d\xE9passe 5 kg, ton plan limite les sauts \xE0 3 s\xE9ries et travaille le souffle au v\xE9lo plut\xF4t qu\u2019en course, pour m\xE9nager les genoux.")), /*#__PURE__*/React.createElement(PTWeightChart, {
    points: pts,
    playWeight: s.playWeight
  }), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Voir les pes\xE9es"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Pes\xE9e"), /*#__PURE__*/React.createElement("th", null, "Moyenne 7 j"))), /*#__PURE__*/React.createElement("tbody", null, pts.slice().reverse().map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.date
  }, /*#__PURE__*/React.createElement("td", null, ptDay(p.date)), /*#__PURE__*/React.createElement("td", null, ptFr(p.weight), " kg"), /*#__PURE__*/React.createElement("td", null, ptFr(p.avg), " kg")))))))), s.jump && s.avg && /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "D\xE9tente et poids"), /*#__PURE__*/React.createElement("p", null, s.jump.value, " cm de saut vertical (mesur\xE9 le ", ptDay(s.jump.date), ") pour ", ptFr(s.avg), " kg : ", ptFr(s.ratio), " cm par kg."), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Un rep\xE8re personnel \xE0 suivre dans le temps, pas une norme : il monte quand tu sautes plus haut, quand tu all\xE8ges, ou les deux.")), !blocked && s.protein && /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Rep\xE8res d\u2019alimentation sportive"), /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, /*#__PURE__*/React.createElement("li", null, "Prot\xE9ines : environ ", s.protein.min, " \xE0 ", s.protein.max, " g par jour (1,4 \xE0 2,0 g par kg), r\xE9parties sur 3 \xE0 4 repas."), /*#__PURE__*/React.createElement("li", null, "Les jours d\u2019entra\xEEnement, un repas avec des glucides 2 \xE0 3 h avant et une collation prot\xE9in\xE9e apr\xE8s aident la r\xE9cup\xE9ration."), /*#__PURE__*/React.createElement("li", null, "Pour perdre du poids sans perdre de d\xE9tente : une baisse lente et r\xE9guli\xE8re, sans sauter de repas les jours de s\xE9ance.")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Rep\xE8res g\xE9n\xE9raux, pas une prescription. Sources : ", BW.SOURCES.slice(0, 2).map((x, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: x.url
  }, i > 0 && ' · ', /*#__PURE__*/React.createElement("a", {
    href: x.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, x.label))), ".")), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!data.weightPrefs?.followUp,
    onChange: e => update(st => ({
      ...st,
      weightPrefs: {
        followUp: e.target.checked
      }
    }))
  }), "Je suis suivi par un professionnel pour mon poids ou mon alimentation (l\u2019app n\u2019affiche alors ni \xE9cart ni objectif).")));
}