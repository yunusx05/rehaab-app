function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
/* React 18, deliberately dependency-free beyond the app's existing stack. */
const PT = window.PersonalTraining;
const {
  useState: usePTState,
  useEffect: usePTEffect,
  useRef: usePTRef
} = React;
const focusLabels = {
  muscle: 'Musculation',
  core: 'Gainage',
  cardio: 'Cardio',
  plyo: 'Pliométrie',
  mobility: 'Mobilité & souplesse',
  mixed: 'Mix énergétique'
};
const goalLabels = {
  balanced: 'Un corps athlétique, un meilleur jeu',
  muscle: 'Développer mes muscles',
  basket: 'Progresser au basket',
  strength: 'Gagner en force',
  mobility: 'Bouger plus facilement'
};
const shortDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'short'
});
const timeLabel = seconds => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
const loadUnit = ex => ex.weighted === 'dumbbells' && !ex.singleLoad ? 'kg par haltère' : ex.weighted === 'barbell' ? 'kg, barre comprise' : ex.weighted === 'kettlebell' ? 'kg par kettlebell' : ex.weighted === 'vest' ? 'kg de gilet' : 'kg affichés';
const toggleId = (list, id) => list.includes(id) ? list.filter(x => x !== id) : [...list, id];
// Zones du corps : une même silhouette pour toutes, un point plein sur la zone concernée. Lisible à 22 px, là où un membre isolé ne l'est pas.
const ptZoneBody = /*#__PURE__*/React.createElement("g", {
  opacity: ".34"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "3.4",
  r: "1.9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 5.3v7.4M12 7.4 8.2 11.2M12 7.4l3.8 3.8M12 12.7 9.4 20m2.6-7.3L14.6 20"
}));
const ptZone = (x, y) => /*#__PURE__*/React.createElement(React.Fragment, null, ptZoneBody, /*#__PURE__*/React.createElement("circle", {
  cx: x,
  cy: y,
  r: "2.6",
  fill: "currentColor",
  stroke: "none"
}));
function PTIcon({
  name,
  size = 22
}) {
  const paths = {
    pause: /*#__PURE__*/React.createElement("path", {
      d: "M8 5v14M16 5v14"
    }),
    copy: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "8",
      y: "8",
      width: "12",
      height: "13",
      rx: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M16 8V3H3v13h5"
    })),
    today: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 11h16v9H4zM8 4v4m8-4v4M4 7h16v4H4z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m9 15 2 2 4-4"
    })),
    chart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 4v16h16M8 15l4-5 4 2 5-7"
    })),
    profile: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "8",
      r: "4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M4 21v-2a8 8 0 0 1 16 0v2"
    })),
    arrow: /*#__PURE__*/React.createElement("path", {
      d: "m9 5 7 7-7 7M4 12h12"
    }),
    back: /*#__PURE__*/React.createElement("path", {
      d: "m14 5-7 7 7 7M7 12h13"
    }),
    play: /*#__PURE__*/React.createElement("path", {
      d: "m8 4 12 8-12 8z"
    }),
    shuffle: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "m3 6 3 0 12 12h3m-4-4 4 4-4 4M3 18h3l4-4m4-4 4-4h3m-4-4 4 4-4 4"
    })),
    weight: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M7 9h10M7 15h10M3 7v10m4-12v14m10-14v14m4-12v10"
    })),
    basket: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 12h18M12 3v18M5 6c5 3 5 9 0 12M19 6c-5 3-5 9 0 12"
    })),
    heart: /*#__PURE__*/React.createElement("path", {
      d: "M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7z"
    }),
    spark: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"
    })),
    body: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "4",
      r: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M4 9h16M12 7v7m0 0-5 7m5-7 5 7"
    })),
    bike: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "5",
      cy: "17",
      r: "4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "19",
      cy: "17",
      r: "4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m5 17 4-9 6 9H5m4-9h7l3 9M8 5h4m4 0h3l-3 3"
    })),
    run: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "15",
      cy: "4",
      r: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m6 9 4-2 4 4 5 1M12 9l-3 6-5 4m5-4 6 1 1 6"
    })),
    band: /*#__PURE__*/React.createElement("path", {
      d: "M8 4C-3 15 7 26 17 16S17-7 8 4zm0 4c-5 7 0 12 6 6s0-12-6-6z"
    }),
    bench: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M3 10h18v4H3zm3 4v6m12-6v6"
    })),
    bar: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M3 8V4h18v4M8 4v6m8-6v6"
    })),
    machine: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M5 21V3h14v18M3 21h18M9 7h6M9 11h6M9 15h6"
    })),
    court: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M3 4h18v16H3zM12 4v16"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3"
    })),
    pin: /*#__PURE__*/React.createElement("path", {
      d: "m8 3 8 0-1 6 4 4H5l4-4-1-6zm4 10v8"
    }),
    check: /*#__PURE__*/React.createElement("path", {
      d: "m5 12 4 4L20 5"
    }),
    plus: /*#__PURE__*/React.createElement("path", {
      d: "M12 4v16M4 12h16"
    }),
    pain: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "m12 3 10 18H2zM12 9v5m0 3v.1"
    })),
    book: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3zM12 6v15"
    })),
    clock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 6v6l4 2"
    })),
    refresh: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M20 9a8 8 0 1 0 0 7M20 3v6h-6"
    })),
    close: /*#__PURE__*/React.createElement("path", {
      d: "m6 6 12 12M6 18 18 6"
    }),
    vest: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M8 3 4 6v15h7V9L8 3zm8 0 4 3v15h-7V9l3-6zM8 3c1 2 3 3 4 3s3-1 4-3"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M5 13h5m4 0h5"
    })),
    slider: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("ellipse", {
      cx: "7",
      cy: "16",
      rx: "5",
      ry: "2.2"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: "17",
      cy: "16",
      rx: "5",
      ry: "2.2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M5 10h4m6 0h4M7 7v3m10-3v3"
    })),
    knee: ptZone(10.6, 16.5),
    ankle: ptZone(9.4, 19.8),
    hip: ptZone(12, 12.8),
    spine: ptZone(12, 9.4),
    shoulder: ptZone(13.9, 9.2),
    wrist: ptZone(15.8, 11.2),
    neck: ptZone(12, 5.6)
  };
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, paths[name] || paths.body);
}
function PTButton({
  children,
  primary = false,
  quiet = false,
  danger = false,
  ...props
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: `btn${primary ? ' primary' : ''}${quiet ? ' quiet' : ''}${danger ? ' danger' : ''}`
  }, props), children);
}
function PTField({
  label,
  hint,
  children,
  ...props
}) {
  const id = React.useId(),
    controlProps = {
      id,
      'aria-labelledby': `${id}-label`,
      'aria-describedby': hint ? `${id}-hint` : undefined
    };
  return /*#__PURE__*/React.createElement("label", {
    className: "field",
    htmlFor: id
  }, /*#__PURE__*/React.createElement("span", {
    id: `${id}-label`
  }, label), children ? React.cloneElement(children, controlProps) : /*#__PURE__*/React.createElement("input", _extends({}, props, controlProps)), " ", hint && /*#__PURE__*/React.createElement("span", {
    className: "field-hint",
    id: `${id}-hint`
  }, hint));
}
function PTChoices({
  options,
  value,
  onChange,
  columns = 2
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `choice-grid${columns === 3 ? ' three' : ''}`
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "choice",
    key: o.value,
    "aria-pressed": value === o.value,
    onClick: () => onChange(o.value)
  }, o.icon && /*#__PURE__*/React.createElement("div", {
    className: "choice-icon"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: o.icon
  })), o.label, o.hint && /*#__PURE__*/React.createElement("small", null, o.hint))));
}
function PTChips({
  options,
  value,
  onChange,
  multi = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "chip",
    key: o.value,
    "aria-pressed": multi ? value.includes(o.value) : value === o.value,
    onClick: () => onChange(multi ? toggleId(value, o.value) : o.value)
  }, o.label)));
}
function PTPageHead({
  eyebrow,
  title,
  children,
  onBack
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, onBack && /*#__PURE__*/React.createElement("button", {
    className: "back-link",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "back",
    size: 18
  }), "Retour"), /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h1", null, title), children && /*#__PURE__*/React.createElement("p", null, children)));
}
function PTEquipment({
  selected,
  onChange,
  owned,
  inventory = false
}) {
  const [showAll, setShowAll] = usePTState(inventory || !owned || owned.length < 2);
  const visible = showAll ? PT.equipment : PT.equipment.filter(e => owned.includes(e.id));
  return /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "choice-grid"
  }, visible.map(e => /*#__PURE__*/React.createElement("button", {
    className: "choice",
    type: "button",
    key: e.id,
    "aria-pressed": selected.includes(e.id) || e.id === 'bodyweight',
    onClick: () => e.id !== 'bodyweight' && onChange(toggleId(selected, e.id))
  }, /*#__PURE__*/React.createElement("div", {
    className: "choice-icon"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: e.icon
  })), e.label, e.id === 'bodyweight' && /*#__PURE__*/React.createElement("small", null, "Toujours disponible")))), !inventory && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setShowAll(!showAll)
  }, showAll ? 'Afficher seulement mon matériel' : 'Autre matériel disponible aujourd’hui'));
}
function PTDemo({
  exercise
}) {
  const reduced = usePTMotionPreference(),
    media = window.RehaabMedia?.[exercise.id],
    url = media?.video;
  const [play, setPlay] = usePTState(!reduced),
    [failed, setFailed] = usePTState(false),
    [photosFailed, setPhotosFailed] = usePTState(false),
    [stillFailed, setStillFailed] = usePTState(false),
    [frame, setFrame] = usePTState(0),
    [attempt, setAttempt] = usePTState(0);
  const video = usePTRef(null);
  usePTEffect(() => {
    setFailed(false);
    setPhotosFailed(false);
    setStillFailed(false);
    setFrame(0);
  }, [exercise.id, url]);
  usePTEffect(() => setPlay(!reduced), [reduced]);
  // A failed film falls back to the exact start/end photos of the same movement, then to its own illustration, never to another variant.
  const primary = url && !failed ? url : null,
    frames = media?.frames && !photosFailed ? media.frames : null,
    still = !primary && !frames && media?.card && !stillFailed ? media.card : null;
  usePTVisibleMedia(video, play, primary ? `${primary}#${attempt}` : null, setPlay);
  const retry = () => {
    setFailed(false);
    setPhotosFailed(false);
    setStillFailed(false);
    setAttempt(a => a + 1);
  };
  const unavailable = failed && /*#__PURE__*/React.createElement("div", {
    className: "media-unavailable",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", null, "D\xE9monstration indisponible"), " ", /*#__PURE__*/React.createElement("button", {
    className: "demo-retry",
    onClick: retry
  }, "R\xE9essayer"));
  if (still) return /*#__PURE__*/React.createElement("div", {
    className: "movement-demo"
  }, unavailable, /*#__PURE__*/React.createElement("div", {
    className: "demo demo-still"
  }, /*#__PURE__*/React.createElement("img", {
    src: still,
    alt: `Illustration : ${exercise.name}`,
    onError: () => setStillFailed(true)
  })), /*#__PURE__*/React.createElement("div", {
    className: "demo-controls"
  }, /*#__PURE__*/React.createElement("span", null, "Illustration \xB7 suis les rep\xE8res ci-dessous")));
  if (!primary && !frames) return /*#__PURE__*/React.createElement("div", {
    className: "demo-fallback"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: ptKindIcon(exercise),
    size: 44
  }), /*#__PURE__*/React.createElement("span", null, url || media?.frames || media?.card ? 'Démonstration indisponible' : 'Pas de démonstration visuelle pour ce mouvement'), /*#__PURE__*/React.createElement("p", null, exercise.instructions[0]), (failed || photosFailed || stillFailed) && /*#__PURE__*/React.createElement("button", {
    className: "demo-retry",
    onClick: retry
  }, "R\xE9essayer"));
  return /*#__PURE__*/React.createElement("div", {
    className: "movement-demo"
  }, unavailable, /*#__PURE__*/React.createElement("div", {
    className: `demo${!play ? ' paused' : ''}${frame === 1 ? ' show-end' : ''}${primary && media?.poster ? ' has-backdrop' : ''}`,
    style: primary && media?.poster ? {
      '--backdrop': `url(${media.poster})`
    } : undefined
  }, primary ? /*#__PURE__*/React.createElement("video", {
    key: attempt,
    ref: video,
    muted: true,
    playsInline: true,
    loop: true,
    controls: true,
    preload: "metadata",
    poster: media?.poster,
    src: primary,
    onError: () => setFailed(true),
    "aria-label": `Démonstration vidéo de ${exercise.name}`
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: `media/${frames}/0.webp`,
    alt: `${exercise.name} : départ`,
    onError: () => setPhotosFailed(true)
  }), /*#__PURE__*/React.createElement("img", {
    className: "second",
    src: `media/${frames}/1.webp`,
    alt: `${exercise.name} : arrivée`,
    onError: () => setPhotosFailed(true)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "demo-controls"
  }, /*#__PURE__*/React.createElement("span", null, primary ? 'Vidéo en boucle' : media?.generated ? 'Illustration IA · 2 positions' : 'Départ ↔ arrivée · 2 positions'), /*#__PURE__*/React.createElement("div", {
    className: "media-meta"
  }, primary && media.credit && /*#__PURE__*/React.createElement("a", {
    className: "media-credit",
    href: "media/ATTRIBUTION.md",
    target: "_blank",
    rel: "noreferrer",
    title: media.credit,
    "aria-label": `Crédits de la vidéo : ${media.credit}`
  }, "CC"), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setPlay(!play)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: play ? 'pause' : 'play',
    size: 16
  }), play ? 'Pause démo' : 'Lire la démo'))), !primary && !play && /*#__PURE__*/React.createElement("div", {
    className: "position-switch"
  }, /*#__PURE__*/React.createElement("button", {
    "aria-pressed": frame === 0,
    onClick: () => setFrame(0)
  }, "D\xE9part"), /*#__PURE__*/React.createElement("button", {
    "aria-pressed": frame === 1,
    onClick: () => setFrame(1)
  }, "Arriv\xE9e")));
}
function PTExerciseDetails({
  exercise
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement(PTDemo, {
    key: exercise.id,
    exercise: exercise
  }), /*#__PURE__*/React.createElement("ol", {
    className: "instruction-list"
  }, exercise.instructions.map((line, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, line))), exercise.weighted && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Charge enregistr\xE9e en ", loadUnit(exercise), "."));
}
function ptReadLegacy() {
  const snapshot = {};
  try {
    Object.keys(localStorage).filter(k => k.startsWith('rh_') && !k.startsWith('rh_personal')).forEach(k => snapshot[k] = localStorage.getItem(k));
  } catch (e) {}
  return snapshot;
}
function ptDownload(name, content, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], {
    type
  }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function ptLoad() {
  try {
    const raw = localStorage.getItem(PT.STORAGE_KEY);
    return {
      data: raw ? PT.validateState(JSON.parse(raw)) : PT.initialState(),
      error: null
    };
  } catch (error) {
    return {
      data: PT.initialState(),
      error: 'La sauvegarde locale ne peut pas être lue. Elle n’a pas été écrasée. Exporte-la depuis Profil avant de restaurer une sauvegarde.'
    };
  }
}
function PTOnboarding({
  data,
  update,
  go
}) {
  const [step, setStep] = usePTState(0),
    [form, setForm] = usePTState(data.profile),
    [owned, setOwned] = usePTState(data.owned),
    [pain, setPain] = usePTState(false);
  const set = (k, v) => setForm(p => ({
    ...p,
    [k]: v
  }));
  const save = () => {
    update(s => ({
      ...s,
      profile: {
        ...form,
        onboarded: true
      },
      owned,
      checkIn: {
        ...s.checkIn,
        equipment: owned,
        focus: form.goal === 'mobility' ? 'mobility' : 'muscle'
      }
    }));
    go(pain ? 'symptoms' : 'today');
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "Ton point de d\xE9part",
    title: ['Un cap. De la liberté.', 'Apprendre à te connaître.', 'Avec ce que tu as.'][step]
  }, ['Le programme te guide. Tes envies gardent leur place.', 'Ces informations restent sur cet appareil. Tu pourras les actualiser.', 'Sélectionne ton matériel habituel. Tu préciseras ce qui est disponible avant chaque séance.'][step]), /*#__PURE__*/React.createElement("div", {
    className: "step-caption"
  }, /*#__PURE__*/React.createElement("span", null, "Configuration personnelle"), /*#__PURE__*/React.createElement("span", null, step + 1, " / 3")), /*#__PURE__*/React.createElement("div", {
    className: "step-track"
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    className: i <= step ? 'done' : '',
    key: i
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, step === 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTChoices, {
    options: Object.entries(goalLabels).map(([value, label]) => ({
      value,
      label,
      icon: value === 'basket' ? 'basket' : value === 'mobility' ? 'body' : 'weight'
    })),
    value: form.goal,
    onChange: v => set('goal', v)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Comment t\u2019appeler ?",
    autoComplete: "given-name",
    maxLength: "40",
    value: form.name,
    onChange: e => set('name', e.target.value)
  })), step === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "\xC2ge",
    type: "number",
    min: "18",
    max: "100",
    inputMode: "numeric",
    value: form.age,
    onChange: e => set('age', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Taille (cm)",
    type: "number",
    min: "100",
    max: "250",
    inputMode: "decimal",
    value: form.height,
    onChange: e => set('height', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Poids actuel (kg)",
    type: "number",
    min: "30",
    max: "350",
    step: "0.1",
    inputMode: "decimal",
    value: form.weight,
    onChange: e => set('weight', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "S\xE9ances vis\xE9es / semaine"
  }, /*#__PURE__*/React.createElement("select", {
    value: form.weeklyTarget,
    onChange: e => set('weeklyTarget', Number(e.target.value))
  }, [1, 2, 3, 4, 5, 6].map(v => /*#__PURE__*/React.createElement("option", {
    key: v,
    value: v
  }, v, " s\xE9ances"))))), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Ton exp\xE9rience actuelle"), /*#__PURE__*/React.createElement(PTChoices, {
    options: [{
      value: 'beginner',
      label: 'Je débute'
    }, {
      value: 'returning',
      label: 'Je reprends après une pause'
    }, {
      value: 'regular',
      label: 'Je m’entraîne régulièrement'
    }, {
      value: 'advanced',
      label: 'Je suis expérimenté'
    }],
    value: form.experience,
    onChange: v => set('experience', v)
  })), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: pain,
    onChange: e => setPain(e.target.checked)
  }), "J\u2019ai une douleur \xE0 signaler avant de commencer."), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Les s\xE9ances g\xE9n\xE9riques sont con\xE7ues pour des adultes. Aucune estimation de graisse corporelle ni diagnostic \xE0 partir du poids.")), step === 2 && /*#__PURE__*/React.createElement(PTEquipment, {
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
    onClick: () => step < 2 ? setStep(step + 1) : save(),
    disabled: step === 1 && (form.age !== '' && !PT.bounded(form.age, 18, 100) || form.height !== '' && !PT.bounded(form.height, 100, 250) || form.weight !== '' && !PT.bounded(form.weight, 30, 350))
  }, step === 2 ? 'C’est parti' : 'Continuer', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })))));
}
function PTPrepare({
  data,
  update,
  go,
  notify
}) {
  const [step, setStep] = usePTState(0),
    [check, setCheck] = usePTState({
      ...data.checkIn,
      equipment: [...new Set(['bodyweight', ...data.checkIn.equipment])]
    }),
    [error, setError] = usePTState(''),
    [conflict, setConflict] = usePTState(false);
  const set = (key, value) => setCheck(c => ({
    ...c,
    [key]: value
  }));
  const generate = () => {
    if (data.draft?.status === 'active' && !conflict) {
      setConflict(true);
      return;
    }
    const plan = PT.generate(data, check);
    if (plan.error) {
      setError(plan.error);
      return;
    }
    update(s => ({
      ...s,
      checkIn: check,
      draft: plan
    }));
    go('preview');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => step > 0 ? setStep(step - 1) : go('today'),
    eyebrow: "Une s\xE9ance, trois choix",
    title: ['Avec quoi ?', 'Combien de temps ?', 'Quelle envie ?'][step]
  }, ['Le matériel réellement disponible maintenant.', 'Échauffement et repos sont compris dans la proposition.', 'Le format reste un moyen. Ton envie donne la direction.'][step]), /*#__PURE__*/React.createElement("div", {
    className: "step-track"
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: i <= step ? 'done' : ''
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, step === 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTEquipment, {
    owned: data.owned,
    selected: check.equipment,
    onChange: v => set('equipment', v)
  }), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Mes contraintes du lieu"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PTChips, {
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
    value: check.constraints,
    onChange: v => set('constraints', v)
  }))), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('symptoms')
  }, "J\u2019ai une douleur \xE0 signaler \u2192")), step === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTChips, {
    value: Number(check.minutes),
    options: [8, 15, 20, 30, 45, 60].map(v => ({
      value: v,
      label: `${v} min`
    })),
    onChange: v => set('minutes', v)
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Ton \xE9nergie physique"), /*#__PURE__*/React.createElement(PTChoices, {
    columns: 3,
    options: [{
      value: 'low',
      label: 'Fatigué'
    }, {
      value: 'normal',
      label: 'Correcte'
    }, {
      value: 'high',
      label: 'En forme'
    }],
    value: check.energy,
    onChange: v => set('energy', v)
  }), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "\xCAtre motiv\xE9 ne veut pas forc\xE9ment dire \xEAtre repos\xE9.")), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Et l\u2019envie de commencer ?"), /*#__PURE__*/React.createElement(PTChoices, {
    options: [{
      value: 'low',
      label: 'Pas très motivé',
      hint: 'Court, familier, facile à lancer.'
    }, {
      value: 'normal',
      label: 'J’ai envie de bouger'
    }],
    value: check.motivation,
    onChange: v => set('motivation', v)
  }))), step === 2 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTChoices, {
    options: Object.entries(focusLabels).map(([value, label]) => ({
      value,
      label
    })),
    value: check.focus,
    onChange: v => set('focus', v)
  }), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "J\u2019ai un format pr\xE9cis en t\xEAte"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Format"
  }, /*#__PURE__*/React.createElement("select", {
    value: check.format,
    onChange: e => set('format', e.target.value)
  }, Object.entries(PT.formats).map(([v, label]) => /*#__PURE__*/React.createElement("option", {
    value: v,
    key: v
  }, label)))), /*#__PURE__*/React.createElement(PTField, {
    label: "Niveau de nouveaut\xE9"
  }, /*#__PURE__*/React.createElement("select", {
    value: check.novelty,
    onChange: e => set('novelty', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "familiar"
  }, "Des mouvements familiers"), /*#__PURE__*/React.createElement("option", {
    value: "balanced"
  }, "Un peu de nouveaut\xE9"), /*#__PURE__*/React.createElement("option", {
    value: "discover"
  }, "Surprends-moi"))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "La pliom\xE9trie, la souplesse et la technique basket gardent leur propre rythme. Un HIIT ne doit pas transformer les sauts en course \xE0 la fatigue.")))), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), conflict && /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm"
  }, /*#__PURE__*/React.createElement("p", null, "Une s\xE9ance est en cours. La remplacer abandonnera ses s\xE9ries non enregistr\xE9es dans l\u2019historique."), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('session')
  }, "Reprendre la s\xE9ance en cours"), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: generate
  }, "Abandonner le brouillon et proposer une s\xE9ance")), !conflict && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => step < 2 ? setStep(step + 1) : generate()
  }, step < 2 ? 'Continuer' : 'Propose-moi une séance', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))));
}
function PTPreview({
  data,
  update,
  go,
  notify
}) {
  const plan = data.draft,
    [replaceId, setReplaceId] = usePTState(null),
    [exclude, setExclude] = usePTState([]),
    [error, setError] = usePTState('');
  if (!plan) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    title: "Une s\xE9ance \xE0 cr\xE9er."
  }), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('prepare')
  }, "Choisir mon mat\xE9riel"));
  if (plan.status === 'active') return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    title: "Une s\xE9ance est en cours."
  }), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('session')
  }, "Reprendre"));
  const setPlan = fn => update(s => ({
    ...s,
    draft: fn(s.draft)
  }));
  const replace = (old, choice) => {
    const e = {
      ...PT.makePrescription(choice, plan.format, plan.check.minutes, PT.context(data, plan.check)),
      pinned: false
    };
    setPlan(p => ({
      ...p,
      exercises: p.exercises.map(x => x.id === old.id ? e : x),
      reasons: [...p.reasons, `${old.name} remplacé par ${choice.name}.`]
    }));
    setReplaceId(null);
  };
  const reroll = () => {
    const next = PT.generate(data, plan.check, {
      exclude,
      pinned: plan.exercises.filter(e => e.pinned)
    });
    if (next.error) {
      setError(next.error);
      return;
    }
    setPlan(() => next);
    setError('');
  };
  const start = () => {
    const unsafe = plan.exercises.filter(e => !PT.allowed(e, data, plan.check));
    if (unsafe.length) {
      setError('Le contexte a changé. Réévalue les exercices avant de démarrer : ' + unsafe.map(e => e.name).join(', '));
      return;
    }
    update(s => {
      const draft = PT.startDraft(plan, s);
      return {
        ...s,
        draft: {
          ...draft,
          stageElapsed: 0,
          stageStarted: Date.now(),
          timer: {
            id: PT.uid(),
            endAt: Date.now() + plan.warmupSeconds * 1000,
            remaining: plan.warmupSeconds,
            duration: plan.warmupSeconds,
            kind: 'warmup',
            label: 'Échauffement'
          }
        }
      };
    });
    go('session');
  };
  const minutes = plan.blockSeconds ? Math.ceil((plan.warmupSeconds + plan.blockSeconds + 60) / 60) : Math.ceil((plan.warmupSeconds + PT.estimateSeconds(plan.exercises, plan.format) + 60) / 60);
  return /*#__PURE__*/React.createElement("div", {
    className: "visual-preview"
  }, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go(plan.source === 'program' ? 'program-legacy' : plan.source === 'program-plan' ? 'program' : plan.source === 'pathway' ? 'pathway' : ['quick', 'rehab', 'warmup'].includes(plan.source) ? 'today' : 'prepare'),
    eyebrow: "Ta proposition",
    title: plan.title
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, typeof PTCreditPrompt === 'function' && /*#__PURE__*/React.createElement(PTCreditPrompt, {
    data: data,
    update: update,
    notify: notify
  }), plan.creditApplied && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Ajust\xE9e : ", plan.creditApplied.saved, " min retir\xE9es, d\xE9j\xE0 faites aujourd\u2019hui (", plan.creditApplied.labels.join(' + '), ")."), /*#__PURE__*/React.createElement("div", {
    className: "plan-meta"
  }, /*#__PURE__*/React.createElement("span", null, "~", minutes, " min"), /*#__PURE__*/React.createElement("span", null, PT.formats[plan.format]), /*#__PURE__*/React.createElement("span", null, plan.exercises.length, " exercices")), plan.check.motivation === 'low' && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Tu n\u2019as rien \xE0 rattraper. Termine cette courte s\xE9ance ; tu d\xE9cideras ensuite si tu en veux plus."), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Pourquoi cette s\xE9ance ?"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "reason-list"
  }, plan.reasons.map((r, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, r))))), plan.warmupSeconds > 0 && /*#__PURE__*/React.createElement("div", {
    className: "warmup"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "body",
    size: 26
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "\xC9chauffement \xB7 ", Math.round(plan.warmupSeconds / 60), " min"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Des gestes faciles, avant de charger."))), ['amrap', 'emom', 'hiit', 'superset', 'circuit'].includes(plan.format) && /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Le rythme de la s\xE9ance"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, {
    amrap: `AMRAP : ${Math.round(plan.blockSeconds / 60)} min. Fais des tours contrôlés, avec des pauses libres. Note les tours et les répétitions supplémentaires.`,
    emom: `EMOM : ${Math.round(plan.blockSeconds / 60)} min. Un exercice par minute, 30 secondes de travail maximum, le reste en récupération.`,
    hiit: 'HIIT : intervalles de 30 secondes, puis 30 secondes de récupération. L’effort reste maîtrisé.',
    superset: 'Supersets : alterne deux exercices, puis récupère. Le guidage gère l’ordre des séries.',
    circuit: 'Circuit : un passage par exercice, puis un nouveau tour. Le guidage garde l’ordre pour toi.'
  }[plan.format])), /*#__PURE__*/React.createElement("div", {
    className: "exercise-list"
  }, plan.exercises.map((e, i) => {
    const choices = PT.alternatives(e, data, plan.check, plan.exercises.map(x => x.id));
    const advice = PT.loadAdvice(e, data, plan.check);
    return /*#__PURE__*/React.createElement("article", {
      className: "exercise-item",
      key: e.id
    }, /*#__PURE__*/React.createElement(PTDemo, {
      exercise: e
    }), /*#__PURE__*/React.createElement("div", {
      className: "exercise-summary"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exercise-number"
    }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, e.name), ptRoleTag(e) && /*#__PURE__*/React.createElement("small", {
      className: "role-tag"
    }, ptRoleTag(e)))), /*#__PURE__*/React.createElement(PTExerciseMetrics, {
      exercise: e,
      weight: advice?.value
    }), /*#__PURE__*/React.createElement("details", {
      className: "disclosure"
    }, /*#__PURE__*/React.createElement("summary", null, "Posture & charge"), /*#__PURE__*/React.createElement("div", {
      className: "stack"
    }, /*#__PURE__*/React.createElement("ol", {
      className: "instruction-list"
    }, e.instructions.map((line, i) => /*#__PURE__*/React.createElement("li", {
      key: i
    }, line))), advice && /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, advice.text))), /*#__PURE__*/React.createElement("div", {
      className: "exercise-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "text-button",
      onClick: () => setReplaceId(replaceId === e.id ? null : e.id)
    }, "Remplacer"), /*#__PURE__*/React.createElement("button", {
      className: `icon-button${e.pinned ? ' selected' : ''}`,
      "aria-label": `${e.pinned ? 'Libérer' : 'Garder'} ${e.name}`,
      "aria-pressed": e.pinned,
      onClick: () => setPlan(p => ({
        ...p,
        exercises: p.exercises.map(x => x.id === e.id ? {
          ...x,
          pinned: !x.pinned
        } : x)
      }))
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: "pin",
      size: 19
    })), /*#__PURE__*/React.createElement("button", {
      className: `icon-button${data.preferences.likes.includes(e.id) ? ' selected' : ''}`,
      "aria-label": `J’aime ${e.name}`,
      "aria-pressed": data.preferences.likes.includes(e.id),
      onClick: () => update(s => ({
        ...s,
        preferences: {
          ...s.preferences,
          likes: toggleId(s.preferences.likes, e.id)
        }
      }))
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: "heart",
      size: 18
    }))), replaceId === e.id && /*#__PURE__*/React.createElement("div", {
      className: "stack-sm"
    }, /*#__PURE__*/React.createElement(PTField, {
      label: "Pourquoi changer ?"
    }, /*#__PURE__*/React.createElement("select", {
      defaultValue: "today",
      onChange: ev => {
        const reason = ev.target.value;
        if (reason === 'pain') {
          go('symptoms');
          return;
        }
        if (reason === 'dislike') update(s => ({
          ...s,
          preferences: {
            ...s.preferences,
            avoids: [...new Set([...s.preferences.avoids, e.id])]
          }
        }));
        if (reason === 'equipment') notify('Change le matériel dans la préparation si nécessaire.');
        setExclude(list => [...new Set([...list, e.id])]);
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: "today"
    }, "Pas envie aujourd\u2019hui"), /*#__PURE__*/React.createElement("option", {
      value: "dislike"
    }, "Je n\u2019aime pas cet exercice"), /*#__PURE__*/React.createElement("option", {
      value: "equipment"
    }, "Mat\xE9riel indisponible"), /*#__PURE__*/React.createElement("option", {
      value: "pain"
    }, "Il me fait mal"))), choices.length ? choices.slice(0, 5).map(c => /*#__PURE__*/React.createElement(PTButton, {
      quiet: true,
      key: c.id,
      onClick: () => replace(e, c)
    }, c.name)) : /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, "Pas de remplacement \xE9quivalent compatible. Tu peux retirer cet exercice."), /*#__PURE__*/React.createElement("button", {
      className: "text-button",
      disabled: plan.exercises.length === 1,
      onClick: () => {
        setPlan(p => ({
          ...p,
          exercises: p.exercises.filter(x => x.id !== e.id)
        }));
        setReplaceId(null);
      }
    }, "Retirer de cette s\xE9ance")));
  })), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "error"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "preview-start"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: start
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 22
  }), "D\xE9marrer la s\xE9ance")), !['program', 'pathway', 'quick', 'rehab', 'warmup'].includes(plan.source) && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: reroll
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "shuffle",
    size: 18
  }), "Une autre proposition"), typeof PTDraftCancel === 'function' && /*#__PURE__*/React.createElement(PTDraftCancel, {
    update: update,
    notify: notify,
    after: () => go(plan.source === 'pathway' ? 'pathway' : 'today')
  }), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "\xC9pingle les exercices \xE0 garder : seules les autres places changeront. Aucun exercice douloureux n\u2019est \xE0 poursuivre.")));
}
// iOS ne joue un son que si le contexte audio a été créé ou réveillé pendant un geste : on le prépare au premier toucher, puis on le réutilise.
let ptAudio = null;
function ptAudioContext() {
  try {
    if (!ptAudio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ptAudio = new Ctx();
    }
    if (ptAudio.state === 'suspended') ptAudio.resume().catch(() => {});
  } catch (e) {
    ptAudio = null;
  }
  return ptAudio;
}
['pointerdown', 'keydown'].forEach(type => window.addEventListener(type, () => ptAudioContext(), {
  capture: true,
  passive: true
}));
// Signaux sonores des chronos. start : départ (long, aigu) · tick : 3-2-1 (court) · end : fin (deux notes) · left/right : côté demandé.
const ptCueTones = {
  start: [[880, .35]],
  tick: [[660, .12]],
  end: [[990, .22], [1320, .4]],
  left: [[440, .25]],
  right: [[880, .25]]
};
function ptCue(type = 'end') {
  try {
    const ctx = ptAudioContext();
    if (ctx) {
      let at = ctx.currentTime;
      (ptCueTones[type] || ptCueTones.end).forEach(([freq, len]) => {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(.18, at + .01);
        gain.gain.setValueAtTime(.18, at + len - .03);
        gain.gain.exponentialRampToValueAtTime(.0001, at + len);
        osc.start(at);
        osc.stop(at + len);
        at += len + .06;
      });
    }
  } catch (e) {}
  try {
    navigator.vibrate?.(type === 'tick' ? 40 : type === 'end' ? [120, 60, 200] : 100);
  } catch (e) {}
}
function PTAudioCue() {
  const [active, setActive] = usePTState(false),
    [cue, setCue] = usePTState('À ton rythme');
  usePTEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const right = Math.random() < .5;
      setCue(right ? 'Droite' : 'Gauche');
      ptCue(right ? 'right' : 'left');
    }, 6000);
    return () => clearInterval(id);
  }, [active]);
  return /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "audio-cue",
    "aria-live": "polite"
  }, cue), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Bip aigu : droite. Bip grave : gauche."), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setActive(!active)
  }, active ? 'Arrêter les signaux' : 'Lancer les signaux · toutes les 6 s'));
}
function PTRowInputs({
  exercise: e,
  row,
  onChange
}) {
  const field = (key, label, opts = {}) => /*#__PURE__*/React.createElement(PTField, _extends({
    label: label,
    type: "number",
    inputMode: "decimal",
    min: "0",
    max: "10000",
    step: "1",
    value: row[key] ?? '',
    onChange: ev => onChange({
      ...row,
      [key]: ev.target.value
    })
  }, opts));
  return /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, (e.measure === 'reps' || e.measure === 'contacts') && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, e.unilateral ? /*#__PURE__*/React.createElement(React.Fragment, null, field('left', 'Répétitions · gauche'), field('right', 'Répétitions · droite')) : field('reps', e.measure === 'contacts' ? 'Contacts réellement faits' : 'Répétitions réalisées'), e.weighted && field('weight', `Charge (${loadUnit(e)})`, {
    step: '0.25'
  })), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "L\u2019objectif est pass\xE9 ?"), /*#__PURE__*/React.createElement(PTChoices, {
    options: [{
      value: 'passed',
      label: 'Oui, proprement'
    }, {
      value: 'hard',
      label: 'Oui, de justesse'
    }, {
      value: 'missed',
      label: 'Non, incomplet'
    }],
    value: row.result,
    onChange: value => onChange({
      ...row,
      result: value,
      rir: value === 'hard' ? '0' : row.rir
    })
  })), row.result === 'passed' && /*#__PURE__*/React.createElement(PTField, {
    label: "Combien de r\xE9p\xE9titions aurais-tu encore pu faire ?",
    hint: "Ton estimation suffit. Ne rien choisir ne vaut pas une marge confirm\xE9e."
  }, /*#__PURE__*/React.createElement("select", {
    value: row.rir ?? '',
    onChange: ev => onChange({
      ...row,
      rir: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Je ne sais pas"), /*#__PURE__*/React.createElement("option", {
    value: "0"
  }, "Aucune"), /*#__PURE__*/React.createElement("option", {
    value: "1"
  }, "1 r\xE9p\xE9tition"), /*#__PURE__*/React.createElement("option", {
    value: "2"
  }, "2 r\xE9p\xE9titions"), /*#__PURE__*/React.createElement("option", {
    value: "3"
  }, "3 ou plus"))), row.result === 'missed' && /*#__PURE__*/React.createElement(PTField, {
    label: "Qu\u2019est-ce qui t\u2019a limit\xE9 ?"
  }, /*#__PURE__*/React.createElement("select", {
    value: row.reason || '',
    onChange: ev => onChange({
      ...row,
      reason: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choisir"), /*#__PURE__*/React.createElement("option", {
    value: "strength"
  }, "La charge \xE9tait trop lourde"), /*#__PURE__*/React.createElement("option", {
    value: "fatigue"
  }, "Fatigue g\xE9n\xE9rale"), /*#__PURE__*/React.createElement("option", {
    value: "rest"
  }, "Repos trop court"), /*#__PURE__*/React.createElement("option", {
    value: "technique"
  }, "Technique d\xE9grad\xE9e"), /*#__PURE__*/React.createElement("option", {
    value: "time"
  }, "Manque de temps / interruption")))), e.measure === 'seconds' && /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, field('seconds', `Secondes réalisées${e.unilateral ? ' par côté' : ''}`), e.weighted && field('weight', `Charge (${loadUnit(e)})`, {
    step: '0.25'
  }), e.kind === 'basket' && field('losses', 'Pertes de balle (facultatif)')), e.measure === 'shots' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, field('made', 'Tirs réussis'), field('attempts', 'Tirs tentés')), /*#__PURE__*/React.createElement(PTField, {
    label: "Rep\xE8re de tir",
    hint: "M\xEAme emplacement et m\xEAme type de tir pour comparer tes r\xE9sultats.",
    value: row.location || '',
    maxLength: "80",
    placeholder: "Ex. lancer franc, sans saut",
    onChange: ev => onChange({
      ...row,
      location: ev.target.value
    })
  })));
}
function PTSymptoms({
  data,
  update,
  go,
  notify
}) {
  const [form, setForm] = usePTState({
      region: '',
      side: 'right',
      severity: 3,
      onset: 'new',
      redFlags: false,
      note: ''
    }),
    [error, setError] = usePTState(''),
    [resolving, setResolving] = usePTState(null);
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const add = () => {
    if (!form.region) {
      setError('Choisis la zone concernée.');
      return;
    }
    update(s => ({
      ...s,
      symptoms: [...s.symptoms, {
        ...form,
        id: PT.uid(),
        date: PT.dateKey(),
        active: true,
        followups: []
      }]
    }));
    setForm({
      region: '',
      side: 'right',
      severity: 3,
      onset: 'new',
      redFlags: false,
      note: ''
    });
    notify('Signalement enregistré. Les prochaines propositions en tiennent compte.');
    setError('');
  };
  const active = PT.activeSymptoms(data);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go(data.draft?.status === 'active' ? 'session' : 'today'),
    eyebrow: "Avant, pendant, apr\xE8s",
    title: "Comment va ton corps ?"
  }, "Une zone, un c\xF4t\xE9, ce qui se passe. Pas de diagnostic automatique."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, active.map(s => /*#__PURE__*/React.createElement("article", {
    key: s.id,
    className: "symptom-card stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("h3", null, PT.regions[s.region], " \xB7 ", {
    left: 'gauche',
    right: 'droite',
    both: 'deux côtés',
    center: 'centre'
  }[s.side]), /*#__PURE__*/React.createElement("span", {
    className: "num"
  }, s.severity, "/10")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Depuis le ", shortDate(s.date), s.note ? ` · ${s.note}` : ''), s.redFlags && /*#__PURE__*/React.createElement("p", {
    className: "error"
  }, "Signe inhabituel signal\xE9 : la g\xE9n\xE9ration de s\xE9ance est suspendue."), resolving === s.id ? /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Confirme uniquement si ce probl\xE8me n\u2019est plus actuel. Apr\xE8s un signe important, suis les consignes d\u2019un professionnel avant de reprendre."), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => {
      update(prev => ({
        ...prev,
        symptoms: prev.symptoms.map(x => x.id === s.id ? {
          ...x,
          active: false,
          resolvedAt: PT.dateKey()
        } : x)
      }));
      setResolving(null);
    }
  }, "Confirmer : ce signalement n\u2019est plus actuel"), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setResolving(null)
  }, "Le garder actif")) : /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setResolving(s.id)
  }, "Ce probl\xE8me n\u2019est plus actuel"))), /*#__PURE__*/React.createElement("section", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h2", null, "Signaler une douleur"), /*#__PURE__*/React.createElement("div", {
    className: "body-regions"
  }, Object.entries(PT.regions).map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    className: "choice",
    "aria-pressed": form.region === id,
    onClick: () => setForm(f => ({
      ...f,
      region: id,
      protocol: ''
    }))
  }, label))), /*#__PURE__*/React.createElement(PTChips, {
    value: form.side,
    onChange: v => set('side', v),
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
  }), window.RehabWarmup && (window.RehabWarmup.where[window.RehabWarmup.zoneOfRegion[form.region]] || []).length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "O\xF9 pr\xE9cis\xE9ment ? Le soin int\xE9gr\xE9 \xE0 tes s\xE9ances suit ce choix."), /*#__PURE__*/React.createElement(PTChips, {
    value: form.protocol || 'unknown',
    onChange: v => set('protocol', v),
    options: window.RehabWarmup.where[window.RehabWarmup.zoneOfRegion[form.region]].map(([value, label]) => ({
      value,
      label
    }))
  })), /*#__PURE__*/React.createElement(PTField, {
    label: `Intensité ressentie : ${form.severity} / 10`,
    hint: "Ce chiffre seul ne d\xE9termine pas si un exercice est s\xFBr."
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "10",
    step: "1",
    value: form.severity,
    onChange: e => set('severity', Number(e.target.value))
  })), /*#__PURE__*/React.createElement(PTChoices, {
    value: form.onset,
    onChange: v => set('onset', v),
    options: [{
      value: 'new',
      label: 'C’est nouveau'
    }, {
      value: 'known',
      label: 'Déjà connu / suivi'
    }]
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Quand est-ce que \xE7a g\xEAne ? Consignes re\xE7ues ?"
  }, /*#__PURE__*/React.createElement("textarea", {
    maxLength: "1000",
    value: form.note,
    onChange: e => set('note', e.target.value),
    placeholder: "Ex. en descendant les escaliers, depuis hier. Consignes de mon kin\xE9\u2026"
  })), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.redFlags,
    onChange: e => set('redFlags', e.target.checked)
  }), "Gonflement inhabituel, blocage, instabilit\xE9, traumatisme r\xE9cent ou difficult\xE9 \xE0 prendre appui."), /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, "Une douleur nouvelle pendant un exercice : arr\xEAte le mouvement qui la provoque. Une douleur forte, persistante ou accompagn\xE9e d\u2019un signe inhabituel demande un avis m\xE9dical. L\u2019app ne valide pas une reprise et ne suppose pas que le v\xE9lo ou un \xE9tirement soit s\xFBr."), error && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    className: "error"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: add
  }, "Enregistrer le signalement")), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Le filtre \xE9carte les exercices qui sollicitent la zone. Tes anciennes douleurs restent dans l\u2019historique, sans \xEAtre effac\xE9es. ", /*#__PURE__*/React.createElement("a", {
    href: "https://orthoinfo.aaos.org/en/recovery/knee-conditioning-program/",
    target: "_blank",
    rel: "noreferrer"
  }, "Rep\xE8res AAOS"), ".")));
}
function PTEvent({
  data,
  update,
  go,
  notify,
  id
}) {
  const existing = data.events.find(e => e.id === id),
    [form, setForm] = usePTState(existing || {
      title: '',
      type: 'match',
      date: PT.dateKey(),
      minutes: 60,
      effort: 5
    }),
    [error, setError] = usePTState(''),
    [remove, setRemove] = usePTState(false);
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const save = done => {
    if (!PT.isoDay(form.date) || !form.title.trim() || !PT.bounded(form.minutes, 1, 600)) {
      setError('Indique un nom, une date et une durée valides.');
      return;
    }
    if (done && form.date > PT.dateKey()) {
      setError('Un événement futur ne peut pas être enregistré comme déjà fait.');
      return;
    }
    const event = {
      ...form,
      id: existing?.id || PT.uid(),
      minutes: Number(form.minutes),
      completed: done || existing?.completed || false
    };
    update(s => {
      const events = existing ? s.events.map(e => e.id === existing.id ? event : e) : [...s.events, event];
      let sessions = s.sessions;
      if (done && !existing?.completed) {
        sessions = [...sessions, {
          id: PT.uid(),
          eventId: event.id,
          date: event.date,
          title: event.title,
          source: 'external',
          eventType: event.type,
          focus: ['match', 'club'].includes(event.type) ? 'basket' : 'cardio',
          format: 'external',
          minutes: Number(event.minutes),
          effort: Number(event.effort),
          entries: {},
          exercises: [],
          completedAt: new Date().toISOString(),
          partial: false,
          nextDay: 'unknown',
          nextDayPending: true,
          notes: 'Activité enregistrée manuellement.'
        }];
      }
      return {
        ...s,
        events,
        sessions
      };
    });
    notify(done ? 'Activité réelle ajoutée au suivi.' : 'Événement ajouté au calendrier.');
    go('today');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('today'),
    eyebrow: "La vraie vie compte aussi",
    title: existing ? 'Ton rendez-vous sportif.' : 'Match, club ou sortie ?'
  }, "Un \xE9v\xE9nement pr\xE9vu aide \xE0 pr\xE9parer la semaine. Il ne compte comme entra\xEEnement qu\u2019une fois effectu\xE9."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTChoices, {
    options: [{
      value: 'match',
      label: 'Match de basket',
      icon: 'basket'
    }, {
      value: 'club',
      label: 'Entraînement basket',
      icon: 'court'
    }, {
      value: 'other',
      label: 'Course, vélo ou autre',
      icon: 'run'
    }],
    value: form.type,
    onChange: v => set('type', v)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Nom",
    maxLength: "100",
    value: form.title,
    placeholder: form.type === 'match' ? 'Match du dimanche' : 'Entraînement / sortie',
    onChange: e => set('title', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Date",
    type: "date",
    value: form.date,
    onChange: e => set('date', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Dur\xE9e (minutes)",
    type: "number",
    min: "1",
    max: "600",
    value: form.minutes,
    onChange: e => set('minutes', e.target.value)
  })), /*#__PURE__*/React.createElement(PTField, {
    label: `Effort global si activité déjà faite : ${form.effort} / 10`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "1",
    max: "10",
    value: form.effort,
    onChange: e => set('effort', Number(e.target.value))
  })), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => save(false)
  }, existing ? 'Enregistrer les changements' : 'Ajouter à mon calendrier'), !existing?.completed && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => save(true)
  }, "Je l\u2019ai d\xE9j\xE0 fait \xB7 enregistrer l\u2019activit\xE9"), existing && /*#__PURE__*/React.createElement(React.Fragment, null, remove ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm"
  }, /*#__PURE__*/React.createElement("p", null, "Retirer ce rendez-vous du calendrier ? Une activit\xE9 d\xE9j\xE0 effectu\xE9e reste dans l\u2019historique."), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => {
      update(s => ({
        ...s,
        events: s.events.filter(e => e.id !== existing.id)
      }));
      go('today');
    }
  }, "Confirmer le retrait")) : /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setRemove(true)
  }, "Retirer du calendrier"))));
}
function PTHistory({
  data,
  update,
  go,
  notify,
  id
}) {
  const session = data.sessions.find(s => s.id === id),
    [editing, setEditing] = usePTState(null),
    [error, setError] = usePTState(''),
    [remove, setRemove] = usePTState(false);
  if (!session) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    title: "S\xE9ance introuvable."
  }), /*#__PURE__*/React.createElement(PTButton, {
    onClick: () => go('today')
  }, "Retour \xE0 l\u2019accueil"));
  const updateSession = fn => update(s => ({
    ...s,
    sessions: s.sessions.map(x => x.id === id ? fn(x) : x)
  }));
  const saveTemplate = () => {
    if (!session.exercises.length) {
      notify('Cette activité externe n’a pas de liste d’exercices à enregistrer.');
      return;
    }
    update(s => ({
      ...s,
      savedWorkouts: [...s.savedWorkouts, {
        id: PT.uid(),
        name: session.title,
        plan: {
          ...PT.clone(session),
          entries: {},
          status: 'preview',
          check: session.check || s.checkIn
        }
      }]
    }));
    notify('Séance ajoutée à tes favoris.');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('today'),
    eyebrow: shortDate(session.date),
    title: session.title
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "session-saved"
  }, /*#__PURE__*/React.createElement("span", {
    className: "saved-check"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 26
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "+50 points de r\xE9gularit\xE9"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Cette s\xE9ance compte. Tu peux \xEAtre fier du chemin."))), /*#__PURE__*/React.createElement(PTRewards, {
    data: data,
    compact: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "plan-meta"
  }, /*#__PURE__*/React.createElement("span", null, Math.round(session.minutes), " min"), /*#__PURE__*/React.createElement("span", null, session.partial ? 'Séance partielle' : 'Séance enregistrée'), /*#__PURE__*/React.createElement("span", null, "Effort ", session.effort || '—', "/10")), session.notes && /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, session.notes), session.exercises.length > 0 && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: saveTemplate
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "heart",
    size: 18
  }), "Garder cette s\xE9ance \xE0 refaire"), session.exercises.map(e => {
    const rows = session.entries[e.id] || [];
    return /*#__PURE__*/React.createElement("article", {
      key: e.id,
      className: "card stack"
    }, /*#__PURE__*/React.createElement("h3", null, e.name), /*#__PURE__*/React.createElement("table", {
      className: "history-table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "S\xE9rie"), /*#__PURE__*/React.createElement("th", null, "R\xE9sultat r\xE9el"), /*#__PURE__*/React.createElement("th", null, "Charge"), /*#__PURE__*/React.createElement("th", null, "\xC9tat"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", null, i + 1), /*#__PURE__*/React.createElement("td", null, !r.done ? '—' : e.measure === 'shots' ? `${r.made}/${r.attempts}` : e.measure === 'seconds' ? `${r.seconds} s${e.unilateral ? ' / côté' : ''}` : e.unilateral ? `G ${r.left} · D ${r.right}` : `${r.reps} ${e.measure === 'contacts' ? 'contacts' : 'reps'}`), /*#__PURE__*/React.createElement("td", null, r.weight ? `${r.weight} kg` : '—'), /*#__PURE__*/React.createElement("td", null, r.pain ? 'Douleur' : r.done ? 'Fait' : 'Non fait'))))), e.weighted && /*#__PURE__*/React.createElement("p", {
      className: "caption"
    }, loadUnit(e)), /*#__PURE__*/React.createElement("details", {
      className: "disclosure"
    }, /*#__PURE__*/React.createElement("summary", null, "Corriger une s\xE9rie"), /*#__PURE__*/React.createElement("div", {
      className: "stack"
    }, rows.map((r, i) => editing?.exercise === e.id && editing?.set === i ? /*#__PURE__*/React.createElement("div", {
      className: "stack",
      key: i
    }, /*#__PURE__*/React.createElement(PTRowInputs, {
      exercise: e,
      row: editing.row,
      onChange: row => setEditing({
        ...editing,
        row
      })
    }), /*#__PURE__*/React.createElement("label", {
      className: "check-label"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: editing.row.pain,
      onChange: ev => setEditing({
        ...editing,
        row: {
          ...editing.row,
          pain: ev.target.checked
        }
      })
    }), "Une douleur \xE9tait pr\xE9sente"), error && /*#__PURE__*/React.createElement("p", {
      className: "error",
      role: "alert"
    }, error), /*#__PURE__*/React.createElement(PTButton, {
      onClick: () => {
        const err = PT.validateRow(editing.row, e);
        if (err) {
          setError(err);
          return;
        }
        updateSession(s => ({
          ...s,
          editedAt: new Date().toISOString(),
          entries: {
            ...s.entries,
            [e.id]: s.entries[e.id].map((old, j) => j === i ? {
              ...editing.row,
              done: !editing.row.pain
            } : old)
          }
        }));
        setEditing(null);
        setError('');
        notify('Résultat corrigé. Les prochaines propositions utiliseront cette valeur.');
      }
    }, "Enregistrer la correction")) : /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "text-button",
      onClick: () => {
        setEditing({
          exercise: e.id,
          set: i,
          row: PT.clone(r)
        });
        setError('');
      }
    }, "S\xE9rie ", i + 1, " \u2192")))));
  }), ['amrap', 'emom'].includes(session.format) && /*#__PURE__*/React.createElement("div", {
    className: "notice"
  }, "Score d\xE9clar\xE9 : ", session.rounds || 0, " ", session.format === 'amrap' ? 'tours' : 'minutes', session.extraReps ? ` + ${session.extraReps} reps` : '', ". Comparable uniquement avec la m\xEAme dur\xE9e, les m\xEAmes mouvements, charges et cibles."), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Corriger la date, la dur\xE9e ou les notes"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Date r\xE9elle",
    type: "date",
    max: PT.dateKey(),
    value: session.date,
    onChange: e => {
      if (PT.isoDay(e.target.value) && e.target.value <= PT.dateKey()) updateSession(s => ({
        ...s,
        date: e.target.value
      }));
    }
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Dur\xE9e r\xE9elle (minutes)",
    type: "number",
    min: "0",
    max: "600",
    step: "0.1",
    value: session.minutes,
    onChange: e => {
      if (PT.bounded(e.target.value, 0, 600)) updateSession(s => ({
        ...s,
        minutes: Number(e.target.value)
      }));
    }
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Notes"
  }, /*#__PURE__*/React.createElement("textarea", {
    value: session.notes || '',
    maxLength: "1000",
    onChange: e => updateSession(s => ({
      ...s,
      notes: e.target.value
    }))
  })))), /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "Douleur apr\xE8s la s\xE9ance ?"), /*#__PURE__*/React.createElement(PTChoices, {
    options: [{
      value: 'same',
      label: 'Rien à signaler'
    }, {
      value: 'worse',
      label: 'Une gêne a augmenté'
    }],
    value: session.nextDay,
    onChange: v => {
      updateSession(s => ({
        ...s,
        nextDay: v,
        nextDayPending: false
      }));
      if (v === 'worse') go('symptoms');
    }
  })), remove ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack"
  }, /*#__PURE__*/React.createElement("p", null, "Retirer cette s\xE9ance de l\u2019historique ? Une copie sera gard\xE9e dans la corbeille locale incluse aux exports."), /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => {
      update(s => ({
        ...s,
        sessions: s.sessions.filter(x => x.id !== id),
        trash: [...(s.trash || []), session]
      }));
      notify('Séance retirée ; copie conservée dans la corbeille locale.');
      go('progress');
    }
  }, "Confirmer le retrait")) : /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setRemove(true)
  }, "Retirer cette s\xE9ance de l\u2019historique")));
}
function PTProfile({
  data,
  update,
  go,
  notify,
  storageError,
  setStorageError
}) {
  const [form, setForm] = usePTState(data.profile),
    [owned, setOwned] = usePTState(data.owned),
    [loads, setLoads] = usePTState(Object.fromEntries(Object.entries(data.loads).map(([k, v]) => [k, v.join(', ')]))),
    [error, setError] = usePTState(''),
    [pendingImport, setPendingImport] = usePTState(null),
    [showLegacy, setShowLegacy] = usePTState(false);
  const set = (k, v) => setForm(p => ({
    ...p,
    [k]: v
  }));
  const legacy = {
    ...ptReadLegacy(),
    ...(data.legacyArchive || {})
  };
  let legacyLog = {};
  try {
    const v = JSON.parse(legacy.rh_log || '{}');
    if (v && typeof v === 'object' && !Array.isArray(v)) legacyLog = v;
  } catch (e) {}
  let legacyMeasures = [];
  try {
    const v = JSON.parse(legacy.rh_meas || '[]');
    if (Array.isArray(v)) legacyMeasures = v.filter(m => m && typeof m === 'object');
  } catch (e) {}
  const save = () => {
    if (form.age !== '' && !PT.bounded(form.age, 18, 100) || form.height !== '' && !PT.bounded(form.height, 100, 250) || form.weight !== '' && !PT.bounded(form.weight, 30, 350)) {
      setError('Vérifie l’âge, la taille et le poids. Les séances génériques concernent des adultes.');
      return;
    }
    const parsed = {};
    for (const [key, text] of Object.entries(loads)) {
      if (!text.trim()) continue;
      const values = text.split(/[,;\s]+/).filter(Boolean).map(Number);
      if (values.some(v => !PT.bounded(v, .1, 1500))) {
        setError('Paliers : utilise des nombres positifs séparés par une virgule. Pour les décimales, utilise un point : 2.5, 5, 7.5.');
        return;
      }
      parsed[key] = [...new Set(values)].sort((a, b) => a - b);
    }
    update(s => ({
      ...s,
      profile: {
        ...form,
        onboarded: true
      },
      owned,
      loads: parsed,
      checkIn: {
        ...s.checkIn,
        equipment: owned
      },
      measurements: form.weight !== '' && Number(form.weight) !== Number(s.profile.weight) ? [...s.measurements, {
        id: PT.uid(),
        date: PT.dateKey(),
        weight: Number(form.weight),
        waist: ''
      }] : s.measurements
    }));
    setError('');
    notify('Profil actualisé. Ton objectif reste celui que tu as choisi.');
  };
  const exportData = () => {
    try {
      ptDownload(`rehaab-${PT.dateKey()}.json`, JSON.stringify(PT.exportBundle(data, legacy), null, 2));
      notify('Export préparé. Garde une copie hors de ce téléphone.');
    } catch (e) {
      setError(e.message);
    }
  };
  const importData = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('Fichier trop volumineux (maximum 15 Mo).');
      return;
    }
    try {
      const imported = PT.importBundle(await file.text());
      setPendingImport(imported);
      setError('');
    } catch (e) {
      setError(e.message || 'Fichier illisible. Aucune donnée modifiée.');
    }
  };
  const confirmImport = () => {
    try {
      localStorage.setItem('rh_personal_recovery_v1', JSON.stringify(PT.exportBundle(data, legacy)));
      const next = {
        ...pendingImport.state,
        legacyArchive: pendingImport.legacy
      };
      localStorage.setItem(PT.STORAGE_KEY, JSON.stringify(next));
      setStorageError(null);
      update(() => next);
      setForm(next.profile);
      setOwned(next.owned);
      setLoads(Object.fromEntries(Object.entries(next.loads).map(([k, v]) => [k, v.join(', ')])));
      setPendingImport(null);
      notify('Sauvegarde restaurée. Une copie de l’état précédent reste disponible.');
    } catch (e) {
      setError('Restauration impossible : vérifie l’espace disponible. Les données actuelles sont conservées.');
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    title: "Mon profil."
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-options"
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('player')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "basket"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mon profil joueur"), /*#__PURE__*/React.createElement("small", null, data.player?.position ? `${window.PlayerProfile.positions[data.player.position].label}${data.player.archetypes.length ? ' · ' + data.player.archetypes.map(a => window.PlayerProfile.archetypes[a].label).join(', ') : ''}` : 'Poste, profil de jeu, douleurs, matériel')), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('library')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "book"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Tous les exercices"), /*#__PURE__*/React.createElement("small", null, PT.allExercises(data).length, " mouvements")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "home-action",
    onClick: () => go('symptoms')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "pain"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Mes douleurs du moment"), /*#__PURE__*/React.createElement("small", null, PT.activeSymptoms(data).length, " signalement", PT.activeSymptoms(data).length > 1 ? 's' : '', " actif", PT.activeSymptoms(data).length > 1 ? 's' : '')), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Mes informations & mon niveau"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Pr\xE9nom",
    value: form.name,
    maxLength: "40",
    onChange: e => set('name', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "\xC2ge",
    type: "number",
    min: "18",
    max: "100",
    value: form.age,
    onChange: e => set('age', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Taille (cm)",
    type: "number",
    min: "100",
    max: "250",
    value: form.height,
    onChange: e => set('height', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Poids actuel (kg)",
    type: "number",
    min: "30",
    max: "350",
    step: "0.1",
    value: form.weight,
    onChange: e => set('weight', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "S\xE9ances / semaine"
  }, /*#__PURE__*/React.createElement("select", {
    value: form.weeklyTarget,
    onChange: e => set('weeklyTarget', Number(e.target.value))
  }, [1, 2, 3, 4, 5, 6].map(v => /*#__PURE__*/React.createElement("option", {
    value: v,
    key: v
  }, v))))), /*#__PURE__*/React.createElement(PTField, {
    label: "Exp\xE9rience actuelle"
  }, /*#__PURE__*/React.createElement("select", {
    value: form.experience,
    onChange: e => set('experience', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "beginner"
  }, "Je d\xE9bute"), /*#__PURE__*/React.createElement("option", {
    value: "returning"
  }, "Je reprends apr\xE8s une pause"), /*#__PURE__*/React.createElement("option", {
    value: "regular"
  }, "Entra\xEEnement r\xE9gulier"), /*#__PURE__*/React.createElement("option", {
    value: "advanced"
  }, "Exp\xE9riment\xE9"))), /*#__PURE__*/React.createElement(PTField, {
    label: "Mon niveau basket"
  }, /*#__PURE__*/React.createElement("select", {
    value: form.basketLevel,
    onChange: e => set('basketLevel', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "beginner"
  }, "Fondamentaux \xE0 construire"), /*#__PURE__*/React.createElement("option", {
    value: "regular"
  }, "Je joue r\xE9guli\xE8rement"), /*#__PURE__*/React.createElement("option", {
    value: "advanced"
  }, "Pratique exp\xE9riment\xE9e"))), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.impactReady,
    onChange: e => set('impactReady', e.target.checked)
  }), "Je pratique d\xE9j\xE0 la course et les sauts sans sympt\xF4me ; je respecte les \xE9ventuelles consignes de mon soignant."), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Cette case d\xE9crit ton exp\xE9rience. Elle ne remplace pas une autorisation de reprise et ne contourne aucune douleur signal\xE9e."), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.safeties,
    onChange: e => set('safeties', e.target.checked)
  }), "J\u2019ai un rack avec s\xE9curit\xE9s adapt\xE9es ou un pareur pour les mouvements \xE0 la barre."))), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Mon mat\xE9riel & mes vrais paliers de charge"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement(PTEquipment, {
    inventory: true,
    selected: owned,
    onChange: setOwned
  }), /*#__PURE__*/React.createElement("h3", null, "Les charges que je peux r\xE9ellement utiliser"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Ex. 5, 7.5, 10, 12.5. Halt\xE8res : poids d\u2019un halt\xE8re. Barre : poids total, barre comprise. Machines : paliers affich\xE9s. Aucun palier renseign\xE9 = aucune hausse chiffr\xE9e invent\xE9e."), PT.equipment.filter(e => owned.includes(e.id) && ['dumbbells', 'barbell', 'kettlebell', 'vest', 'cable', 'legpress', 'legextension', 'legcurl'].includes(e.id)).map(e => /*#__PURE__*/React.createElement(PTField, {
    key: e.id,
    label: `${e.label} · paliers en kg`,
    value: loads[e.id] || '',
    maxLength: "800",
    onChange: ev => setLoads(p => ({
      ...p,
      [e.id]: ev.target.value
    })),
    placeholder: "5, 7.5, 10, 12.5"
  })), /*#__PURE__*/React.createElement(PTButton, {
    onClick: save
  }, "Enregistrer mon mat\xE9riel"))), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: save
  }, "Enregistrer mon profil"), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Mes donn\xE9es & sauvegardes"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("p", {
    className: "notice"
  }, "Tout est enregistr\xE9 localement sur ce navigateur, sans compte ni synchronisation serveur. Effacer les donn\xE9es du navigateur peut effacer ton suivi. Fais r\xE9guli\xE8rement un export."), storageError && /*#__PURE__*/React.createElement("p", {
    className: "error"
  }, storageError), /*#__PURE__*/React.createElement(PTButton, {
    onClick: exportData
  }, "Exporter toutes mes donn\xE9es"), /*#__PURE__*/React.createElement("label", {
    className: "btn file-label"
  }, "Importer une sauvegarde", /*#__PURE__*/React.createElement("input", {
    "aria-label": "Importer une sauvegarde",
    type: "file",
    accept: ".json,application/json",
    onChange: importData
  })), pendingImport && /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack"
  }, /*#__PURE__*/React.createElement("p", null, "Sauvegarde v\xE9rifi\xE9e : ", pendingImport.state.sessions.length, " s\xE9ances, ", pendingImport.state.symptoms.length, " signalements. Remplacer le suivi actuel ? Une copie de r\xE9cup\xE9ration sera conserv\xE9e."), /*#__PURE__*/React.createElement(PTButton, {
    onClick: confirmImport
  }, "Confirmer la restauration"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setPendingImport(null)
  }, "Annuler")), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => {
      try {
        const raw = localStorage.getItem('rh_personal_recovery_v1');
        if (!raw) {
          notify('Aucune restauration précédente.');
          return;
        }
        ptDownload(`rehaab-recuperation-${PT.dateKey()}.json`, raw);
      } catch (e) {
        setError('Impossible de lire la copie de récupération.');
      }
    }
  }, "Exporter la copie avant restauration"), storageError && /*#__PURE__*/React.createElement(PTButton, {
    danger: true,
    onClick: () => {
      try {
        ptDownload(`rehaab-brut-${PT.dateKey()}.json`, localStorage.getItem(PT.STORAGE_KEY) || '{}');
      } catch (e) {
        setError('Stockage inaccessible.');
      }
    }
  }, "Exporter la sauvegarde brute non lisible"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setShowLegacy(!showLegacy)
  }, showLegacy ? 'Masquer' : 'Voir', " mon ancien historique"), showLegacy && /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Donn\xE9es originales conserv\xE9es sans migration destructive. Les anciennes cases coch\xE9es ne sont pas converties en s\xE9ries r\xE9ellement mesur\xE9es."), Object.entries(legacyLog).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 200).map(([date, list]) => /*#__PURE__*/React.createElement("p", {
    className: "fine",
    key: date
  }, date, " \xB7 ", Array.isArray(list) ? list.filter(x => typeof x === 'string').join(', ') : 'Détail non reconnu')), legacyMeasures.map((m, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    className: "fine"
  }, typeof m.date === 'string' ? m.date : 'Date inconnue', " \xB7 ", PT.bounded(m.poids, 1, 350) ? `${m.poids} kg` : '', PT.bounded(m.taille, 1, 300) ? ` · taille ${m.taille} cm` : '')), !Object.keys(legacyLog).length && !legacyMeasures.length && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Pas d\u2019ancien historique d\xE9tect\xE9 sur cet appareil.")), (data.trash || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("h3", null, "Corbeille locale"), data.trash.map(s => /*#__PURE__*/React.createElement("div", {
    className: "topline",
    key: s.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, s.title, " \xB7 ", shortDate(s.date)), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => update(prev => ({
      ...prev,
      sessions: prev.sessions.some(x => x.id === s.id) ? prev.sessions : [...prev.sessions, s],
      trash: prev.trash.filter(x => x.id !== s.id)
    }))
  }, "Restaurer")))))), /*#__PURE__*/React.createElement("details", {
    className: "disclosure"
  }, /*#__PURE__*/React.createElement("summary", null, "Cr\xE9dits des images et vid\xE9os"), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Photos de posture : ", /*#__PURE__*/React.createElement("a", {
    href: "https://github.com/yuhonas/free-exercise-db",
    target: "_blank",
    rel: "noreferrer"
  }, "free-exercise-db"), ". D\xE9tail des sources dans ", /*#__PURE__*/React.createElement("a", {
    href: "media/ATTRIBUTION.md",
    target: "_blank",
    rel: "noreferrer"
  }, "les attributions"), "."))), /*#__PURE__*/React.createElement(PTAppVersion, null)));
}
// Même numéro sur le téléphone et l’ordi = même version. Le cache actif dit ce que le service worker sert réellement.
function PTAppVersion() {
  const [cache, setCache] = usePTState(''),
    [checking, setChecking] = usePTState(false);
  const version = window.REHAAB_VERSION || '?';
  const read = () => {
    try {
      caches.keys().then(keys => setCache(keys.filter(k => k.startsWith('rehaab-')).map(k => k.replace('rehaab-', '')).join(', ') || 'aucun')).catch(() => {});
    } catch (e) {}
  };
  usePTEffect(read, []);
  const refresh = async () => {
    setChecking(true);
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
    } catch (e) {}
    setTimeout(() => window.location.reload(), 600);
  };
  const stale = cache && cache !== 'aucun' && cache.split(', ').every(c => c !== version);
  return /*#__PURE__*/React.createElement("section", {
    className: "card stack-sm app-version"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topline"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fine"
  }, "Version de l\u2019app"), /*#__PURE__*/React.createElement("strong", null, version)), cache && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Cache hors connexion : ", cache), stale && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, "Une ancienne version est encore en m\xE9moire sur cet appareil."), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    disabled: checking,
    onClick: refresh
  }, checking ? 'Vérification…' : 'Chercher une mise à jour'));
}
// L'erreur est gardée (rh_last_error) et affichée : sans elle, impossible de savoir ce qui a cassé sur l'appareil.
// Retour à l'accueil sans recharger : un rechargement dans un aperçu en iframe est bloqué par la politique du site.
class PTErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      key: 0
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error: String(error?.message || error || 'Erreur inconnue')
    };
  }
  componentDidCatch(error, info) {
    try {
      localStorage.setItem('rh_last_error', JSON.stringify({
        message: String(error?.message || error),
        stack: String(error?.stack || '').slice(0, 1500),
        component: String(info?.componentStack || '').slice(0, 1500),
        route: window.location.hash,
        version: window.REHAAB_VERSION || '',
        date: new Date().toISOString()
      }));
    } catch (e) {}
    console.error('[Rehaab]', error);
  }
  render() {
    if (this.state.error) return /*#__PURE__*/React.createElement("div", {
      className: "loading"
    }, /*#__PURE__*/React.createElement("strong", null, "Rehaab."), /*#__PURE__*/React.createElement("p", null, "L\u2019\xE9cran n\u2019a pas pu s\u2019ouvrir. Tes donn\xE9es locales n\u2019ont pas \xE9t\xE9 supprim\xE9es."), /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, "D\xE9tail : ", this.state.error), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: () => {
        window.location.hash = '#today';
        this.setState(s => ({
          error: null,
          key: s.key + 1
        }));
      }
    }, "Revenir \xE0 l\u2019accueil"));
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: this.state.key
    }, this.props.children);
  }
}
function PersonalApp() {
  const initial = usePTRef(null);
  if (!initial.current) initial.current = ptLoad();
  const [data, setData] = usePTState(initial.current.data),
    [storageError, setStorageError] = usePTState(initial.current.error),
    [route, setRoute] = usePTState(() => window.location.hash.slice(1).split('/')[0] || 'today'),
    [detailId, setDetailId] = usePTState(() => window.location.hash.slice(1).split('/')[1] || null),
    [toast, setToast] = usePTState(''),
    [online, setOnline] = usePTState(navigator.onLine);
  const storageBlocked = usePTRef(!!initial.current.error);
  // Écriture regroupée : une saisie rapide ne resérialise pas tout l’historique à chaque frappe. Fermer ou masquer l’app force l’écriture.
  const latest = usePTRef(data),
    pending = usePTRef(null);
  latest.current = data;
  const persist = () => {
    clearTimeout(pending.current);
    pending.current = null;
    if (storageBlocked.current) return;
    try {
      localStorage.setItem(PT.STORAGE_KEY, JSON.stringify(latest.current));
    } catch (e) {
      setStorageError('L’enregistrement local a échoué. Ne ferme pas l’app avant d’exporter ton suivi depuis Profil.');
    }
  };
  usePTEffect(() => {
    clearTimeout(pending.current);
    pending.current = setTimeout(persist, 250);
  }, [data]);
  usePTEffect(() => {
    const flush = () => {
      if (pending.current) persist();
    };
    const hidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);
  usePTEffect(() => {
    if (!storageError) storageBlocked.current = false;
  }, [storageError]);
  usePTEffect(() => {
    const changed = () => {
      const [page, id] = window.location.hash.slice(1).split('/');
      setRoute(page || 'today');
      setDetailId(id || null);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  usePTEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);
  usePTEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  // Observe writes from another tab instead of silently overwriting newer data.
  usePTEffect(() => {
    const handler = e => {
      if (e.key === PT.STORAGE_KEY && e.newValue) {
        storageBlocked.current = true;
        setStorageError('Ton suivi a changé dans un autre onglet. Recharge cet onglet avant de continuer, ou exporte son état actuel.');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  const go = (page, id) => {
    window.location.hash = page + (id ? `/${id}` : '');
    if (route === page && detailId === (id || null)) window.scrollTo(0, 0);
  };
  const update = fn => setData(prev => typeof fn === 'function' ? fn(prev) : fn);
  const props = {
    data,
    update,
    go,
    notify: setToast,
    id: detailId,
    storageError,
    setStorageError
  };
  const active = ['pathway', 'pathway-test', 'bilan', 'library', 'program', 'program-new', 'program-checkin', 'basket-profile'].includes(route) ? 'pathway' : route.startsWith('qi') ? 'qi' : route === 'profile' || route === 'player' ? 'profile' : route === 'coach' ? 'coach' : 'today';
  let content;
  if (!data.profile.onboarded && !storageError && route !== 'symptoms') content = /*#__PURE__*/React.createElement(PTOnboarding, props);else {
    const screens = {
      today: PTSportToday,
      prepare: PTPrepare,
      preview: PTPreview,
      session: PTSession,
      symptoms: PTSymptoms,
      event: PTEvent,
      player: PTPlayerProfile,
      bilan: PTAssessment,
      pathway: PTPathway,
      'pathway-test': PTPathwayTest,
      qi: PTQiHome,
      'qi-run': PTQiRun,
      'qi-video': PTQiVideoHome,
      'qi-video-run': PTQiVideoRun,
      'qi-video-edit': PTQiVideoEdit,
      'qi-cards': PTQiCards,
      'qi-pnr': PTQiPnr,
      'qi-review': PTQiReview,
      rehab: PTRehabQuiz,
      history: PTHistory,
      profile: PTProfile,
      coach: PTCoach,
      library: PTLibrary,
      program: PTProgramHome,
      'program-new': PTProgramCatalog,
      'program-checkin': PTProgramCheckIn,
      'basket-profile': PTBasketProfile
    };
    const Screen = screens[route] || PTSportToday;
    content = /*#__PURE__*/React.createElement(Screen, _extends({
      key: route + String(detailId)
    }, props));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `personal-app${route === 'session' && data.draft?.status === 'active' ? ' is-live' : ''}`
  }, /*#__PURE__*/React.createElement("a", {
    href: "#main-content",
    className: "skip-link",
    onClick: e => {
      e.preventDefault();
      document.getElementById('main-content')?.focus();
    }
  }, "Aller au contenu"), /*#__PURE__*/React.createElement("header", {
    className: "shell-header"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#today",
    className: "brand",
    "aria-label": "Rehaab, aujourd\u2019hui"
  }, "Rehaab", /*#__PURE__*/React.createElement("span", null, ".")), /*#__PURE__*/React.createElement("span", {
    className: "personal-label"
  }, online ? 'Ton espace personnel' : 'Hors connexion')), storageError && /*#__PURE__*/React.createElement("div", {
    role: "alert",
    className: "notice warning"
  }, /*#__PURE__*/React.createElement("p", null, storageError), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('profile')
  }, "Ouvrir les sauvegardes \u2192")), /*#__PURE__*/React.createElement("main", {
    id: "main-content",
    tabIndex: "-1"
  }, content), /*#__PURE__*/React.createElement("nav", {
    className: "bottom-nav",
    "aria-label": "Navigation principale"
  }, [{
    id: 'today',
    label: 'Aujourd’hui',
    icon: 'today'
  }, {
    id: 'pathway',
    label: 'Parcours',
    icon: 'weight'
  }, {
    id: 'coach',
    label: 'Coach',
    icon: 'spark'
  }, {
    id: 'qi',
    label: 'QI',
    icon: 'court'
  }, {
    id: 'profile',
    label: 'Profil',
    icon: 'profile'
  }].map(item => /*#__PURE__*/React.createElement("button", {
    className: "nav-button",
    key: item.id,
    "aria-current": active === item.id ? 'page' : undefined,
    onClick: () => go(item.id)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: item.icon,
    size: 21
  }), item.label))), toast && /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "toast"
  }, toast));
}
ReactDOM.createRoot(document.getElementById('root')).render( /*#__PURE__*/React.createElement(PTErrorBoundary, null, /*#__PURE__*/React.createElement(PersonalApp, null)));