/* QI basket sur de vrais matchs : lecteur YouTube intégré, ou lecteur natif quand l'extrait pointe vers un fichier (file),
   pause au moment de la décision,
   réponse chronométrée, puis la suite de l'action. Réutilise PTQiChoices / PTQiFeedback de qi-components.jsx. */
const PT_CLIP_SECONDS = 6;

// L'API YouTube n'est chargée qu'à l'ouverture d'un écran vidéo, une seule fois.
let ptYtPromise = null;
function ptYouTube() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ptYtPromise) ptYtPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previous) previous();
      resolve(window.YT);
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => {
      ptYtPromise = null;
      reject(new Error('offline'));
    };
    document.head.appendChild(s);
  });
  return ptYtPromise;
}
const ptYtErrors = {
  2: 'Lien vidéo invalide.',
  5: 'Cette vidéo ne peut pas être lue ici.',
  100: 'Vidéo introuvable ou privée.',
  101: 'La chaîne interdit la lecture hors de YouTube.',
  150: 'La chaîne interdit la lecture hors de YouTube.',
  offline: 'Pas de connexion : cette vidéo n’est pas encore enregistrée sur le téléphone.',
  file: 'Extrait introuvable.'
};
const ptClock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor(s % 1 * 10)}`;
const ptYtWatch = (id, start) => `https://www.youtube.com/watch?v=${id}&t=${Math.floor(start)}s`;

// Le lecteur remplace un nœud créé à la main : React ne gère jamais l'iframe.
function usePTYouTube(videoId, start = 0, controls = false) {
  const host = usePTRef(null),
    player = usePTRef(null);
  const [ready, setReady] = usePTState(false),
    [error, setError] = usePTState(null);
  usePTEffect(() => {
    if (!videoId || !host.current) return;
    let cancelled = false;
    setReady(false);
    setError(null);
    const mount = document.createElement('div');
    host.current.replaceChildren(mount);
    ptYouTube().then(YT => {
      if (cancelled) return;
      player.current = new YT.Player(mount, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        width: '100%',
        height: '100%',
        playerVars: {
          start: Math.floor(start),
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: controls ? 1 : 0,
          disablekb: controls ? 0 : 1,
          fs: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: () => {
            if (!cancelled) {
              player.current.mute();
              setReady(true);
            }
          },
          onError: e => {
            if (!cancelled) setError(e.data);
          }
        }
      });
    }).catch(() => {
      if (!cancelled) setError('offline');
    });
    return () => {
      cancelled = true;
      try {
        player.current?.destroy();
      } catch (e) {}
      player.current = null;
    };
  }, [videoId]);
  return {
    host,
    player,
    ready,
    error
  };
}

// Extrait hébergé par l'app (clips/) : même interface que le lecteur YouTube, pour un seul code de déroulé.
function usePTFileVideo(src) {
  const host = usePTRef(null),
    player = usePTRef(null);
  const [ready, setReady] = usePTState(false),
    [error, setError] = usePTState(null);
  usePTEffect(() => {
    if (!src || !host.current) return;
    setReady(false);
    setError(null);
    const v = document.createElement('video');
    Object.assign(v, {
      src,
      muted: true,
      playsInline: true,
      preload: 'auto',
      poster: src.replace(/\.mp4$/, '.webp')
    });
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-label', 'Extrait de match');
    v.addEventListener('loadeddata', () => setReady(true), {
      once: true
    });
    v.addEventListener('error', () => setError(navigator.onLine === false ? 'offline' : 'file'));
    host.current.replaceChildren(v);
    player.current = {
      getCurrentTime: () => v.currentTime,
      seekTo: t => {
        v.currentTime = t;
      },
      playVideo: () => {
        v.play().catch(() => {});
      },
      pauseVideo: () => v.pause(),
      mute: () => {
        v.muted = true;
      },
      unMute: () => {
        v.muted = false;
      },
      setPlaybackRate: r => {
        v.playbackRate = r;
      }
    };
    return () => {
      v.pause();
      v.removeAttribute('src');
      v.load();
      player.current = null;
    };
  }, [src]);
  return {
    host,
    player,
    ready,
    error
  };
}
function PTQiVideoItem({
  clip,
  onAnswer
}) {
  const yt = usePTYouTube(clip.file ? null : clip.yt, clip.start),
    file = usePTFileVideo(clip.file);
  const {
    host,
    player,
    ready,
    error
  } = clip.file ? file : yt;
  const [phase, setPhase] = usePTState('idle'),
    [picked, setPicked] = usePTState(null),
    [left, setLeft] = usePTState(PT_CLIP_SECONDS),
    [sound, setSound] = usePTState(false);
  const phaseRef = usePTRef(phase);
  phaseRef.current = phase;
  const deadline = usePTRef(0);
  // Une seule boucle de 50 ms surveille l'instant de pause, la fin de l'extrait et le chrono de décision.
  usePTEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const p = player.current;
      if (!p || !p.getCurrentTime) return;
      const t = p.getCurrentTime(),
        ph = phaseRef.current;
      if (ph === 'playing' && t >= clip.pause) {
        p.pauseVideo();
        p.seekTo(clip.pause, true);
        deadline.current = Date.now() + PT_CLIP_SECONDS * 1000;
        setLeft(PT_CLIP_SECONDS);
        setPhase('question');
      } else if (ph === 'question') {
        const s = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
        setLeft(s);
        if (s === 0) choose(-1);
      } else if (ph === 'reveal' && t >= clip.end) {
        p.pauseVideo();
        setPhase('done');
      }
    }, 50);
    return () => clearInterval(id);
  }, [ready, clip.id]);
  const start = (rate = 1) => {
    const p = player.current;
    if (!p) return;
    p.setPlaybackRate(rate);
    p.seekTo(clip.start, true);
    p.playVideo();
    setPhase(phase === 'done' || phase === 'reveal' ? 'reveal' : 'playing');
  };
  const choose = i => {
    if (phaseRef.current !== 'question') return;
    setPicked(i);
    setPhase('reveal');
    onAnswer(i >= 0 && clip.choices[i].ok);
    const p = player.current;
    if (p) {
      p.setPlaybackRate(1);
      p.playVideo();
    }
  };
  const toggleSound = () => {
    const p = player.current;
    if (!p) return;
    if (sound) p.mute();else p.unMute();
    setSound(!sound);
  };
  const ok = picked !== null && picked >= 0 && clip.choices[picked]?.ok;
  return /*#__PURE__*/React.createElement("div", {
    className: "stack qi-video"
  }, /*#__PURE__*/React.createElement("div", {
    className: `qi-video-frame phase-${phase}`
  }, /*#__PURE__*/React.createElement("div", {
    ref: host,
    className: "qi-video-host"
  }), phase === 'question' && /*#__PURE__*/React.createElement("div", {
    className: "qi-video-freeze",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null, "Pause"), /*#__PURE__*/React.createElement("strong", null, left)), !ready && !error && /*#__PURE__*/React.createElement("div", {
    className: "qi-video-cover"
  }, /*#__PURE__*/React.createElement("span", {
    className: "caption"
  }, "Chargement de la vid\xE9o\u2026"))), error ? /*#__PURE__*/React.createElement("div", {
    className: "notice warning stack-sm"
  }, /*#__PURE__*/React.createElement("p", null, ptYtErrors[error] || 'Vidéo indisponible.'), /*#__PURE__*/React.createElement("a", {
    className: "text-button",
    href: ptYtWatch(clip.yt, clip.at ?? clip.start),
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Ouvrir sur YouTube"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => onAnswer(null)
  }, "Passer cet extrait")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "qi-prompt"
  }, clip.prompt), phase === 'idle' && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: !ready,
    onClick: () => start()
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 20
  }), "Lancer l\u2019action"), phase === 'playing' && /*#__PURE__*/React.createElement("p", {
    className: "caption",
    "aria-live": "polite"
  }, "Regarde tout le terrain : la vid\xE9o s\u2019arr\xEAte au moment de d\xE9cider."), (phase === 'question' || picked !== null) && /*#__PURE__*/React.createElement(React.Fragment, null, phase === 'question' && /*#__PURE__*/React.createElement("p", {
    className: "caption",
    role: "timer",
    "aria-live": "assertive"
  }, left, " s pour choisir"), /*#__PURE__*/React.createElement(PTQiChoices, {
    choices: clip.choices,
    picked: picked === null ? null : Math.max(picked, -2),
    onPick: choose
  })), picked !== null && /*#__PURE__*/React.createElement(PTQiFeedback, {
    ok: ok,
    title: picked < 0 ? 'Trop tard : en match, la fenêtre se ferme.' : undefined,
    why: (clip.choices[picked] || clip.choices.find(c => c.ok))?.why,
    lesson: clip.lesson
  }), phase === 'reveal' && /*#__PURE__*/React.createElement("p", {
    className: "caption",
    "aria-live": "polite"
  }, "La suite de l\u2019action\u2026"), phase === 'done' && /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => start(0.5)
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "refresh",
    size: 18
  }), "Revoir au ralenti")), ready && /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: toggleSound
  }, sound ? 'Couper le son' : 'Activer le son'), clip.source && /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Source : ", clip.source)));
}
function PTQiVideoRun({
  data,
  update,
  go,
  id
}) {
  const [items] = usePTState(() => {
    const pool = QI.videoPool(data.qi);
    const one = id && pool.find(c => c.id === id);
    return one ? [one] : pool.slice(0, 5);
  });
  const [index, setIndex] = usePTState(0),
    [answered, setAnswered] = usePTState(false),
    [score, setScore] = usePTState(0);
  const clip = items[index];
  const answer = correct => {
    if (correct === null) {
      setIndex(i => i + 1);
      return;
    }
    setAnswered(true);
    if (correct) setScore(n => n + 1);
    update(s => ({
      ...s,
      qi: QI.record(s.qi, {
        id: clip.id,
        mode: 'video',
        theme: clip.theme,
        correct
      })
    }));
  };
  if (!items.length) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi-video'),
    eyebrow: "Vrais matchs",
    title: "Aucun extrait pour l\u2019instant."
  }), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('qi-video-edit')
  }, "Ajouter un extrait"));
  if (!clip) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi-video'),
    eyebrow: "Vrais matchs",
    title: `${score} sur ${items.length}.`
  }, "Les extraits rat\xE9s reviendront en premier la prochaine fois."), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('qi-video')
  }, "Revenir aux extraits", /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi-video'),
    eyebrow: `Vrais matchs · ${index + 1} / ${items.length} · ${QI.themes[clip.theme] || ''}`,
    title: clip.title
  }), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg qi-run"
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-track"
  }, items.map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: i <= index ? 'done' : ''
  }))), /*#__PURE__*/React.createElement(PTQiVideoItem, {
    key: clip.id,
    clip: clip,
    onAnswer: answer
  }), answered && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => {
      setIndex(i => i + 1);
      setAnswered(false);
      window.scrollTo(0, 0);
    }
  }, index + 1 < items.length ? 'Extrait suivant' : 'Voir mon résultat', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }))));
}
function PTQiVideoHome({
  data,
  update,
  go,
  notify
}) {
  const pool = QI.videoPool(data.qi),
    mine = data.qi.clips || [];
  const [remove, setRemove] = usePTState(null);
  const done = new Set(data.qi.answers.filter(a => a.mode === 'video' && a.correct).map(a => a.id));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi'),
    eyebrow: "QI basket",
    title: "Vrais matchs."
  }, "La vid\xE9o s\u2019arr\xEAte au moment de la d\xE9cision. ", PT_CLIP_SECONDS, " secondes pour lire le jeu, puis la suite de l\u2019action."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement("section", {
    className: "mind-card"
  }, /*#__PURE__*/React.createElement("h2", null, pool.length ? `${pool.length} extrait${pool.length > 1 ? 's' : ''}` : 'Ta vidéothèque est vide.'), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, pool.length ? `${done.size} bien lu${done.size > 1 ? 's' : ''} au moins une fois.` : 'Colle un lien YouTube, marque le début, l’instant de décision et la fin.'), pool.length > 0 && /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: () => go('qi-video-run')
  }, "Lancer ", Math.min(5, pool.length), " extrait", pool.length > 1 ? 's' : '', /*#__PURE__*/React.createElement(PTIcon, {
    name: "play",
    size: 18
  })), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => go('qi-video-edit')
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "plus",
    size: 18
  }), "Ajouter un extrait")), pool.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h2", null, "Les extraits"), pool.map(c => /*#__PURE__*/React.createElement("article", {
    key: c.id,
    className: "clip-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "clip-open",
    onClick: () => go('qi-video-run', c.id)
  }, /*#__PURE__*/React.createElement("img", {
    src: c.file ? c.file.replace(/\.mp4$/, '.webp') : `https://i.ytimg.com/vi/${c.yt}/mqdefault.jpg`,
    alt: "",
    loading: "lazy"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, c.title), /*#__PURE__*/React.createElement("small", null, QI.themes[c.theme], done.has(c.id) ? ' · bien lu' : '', c.own ? '' : ' · de base'))), c.own && /*#__PURE__*/React.createElement("div", {
    className: "clip-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => go('qi-video-edit', c.id)
  }, "Modifier"), remove === c.id ? /*#__PURE__*/React.createElement("button", {
    className: "text-button danger-text",
    onClick: () => {
      update(s => ({
        ...s,
        qi: QI.removeClip(s.qi, c.id)
      }));
      setRemove(null);
      notify('Extrait retiré.');
    }
  }, "Confirmer") : /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => setRemove(c.id)
  }, "Retirer"))))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Les vid\xE9os restent sur YouTube : l\u2019app ne les copie pas et ne les h\xE9berge pas. Certaines cha\xEEnes interdisent la lecture int\xE9gr\xE9e ; l\u2019app le signale et propose de l\u2019ouvrir sur YouTube.")));
}
const ptBlankClip = () => ({
  id: `clip-${Date.now().toString(36)}`,
  yt: '',
  start: 0,
  pause: 0,
  end: 0,
  title: '',
  theme: 'pnr-handler',
  prompt: 'Que doit faire le porteur ?',
  lesson: '',
  source: '',
  choices: [{
    text: '',
    ok: true,
    why: ''
  }, {
    text: '',
    ok: false,
    why: ''
  }, {
    text: '',
    ok: false,
    why: ''
  }, {
    text: '',
    ok: false,
    why: ''
  }]
});
function PTQiVideoEdit({
  data,
  update,
  go,
  notify,
  id
}) {
  const existing = (data.qi.clips || []).find(c => c.id === id);
  const [clip, setClip] = usePTState(() => existing ? {
    ...existing,
    choices: [...existing.choices, ...ptBlankClip().choices].slice(0, 4)
  } : ptBlankClip());
  const [link, setLink] = usePTState(existing ? ptYtWatch(existing.yt, existing.start) : ''),
    [error, setError] = usePTState('');
  const {
    host,
    player,
    ready,
    error: ytError
  } = usePTYouTube(clip.yt, clip.start, true);
  const set = (k, v) => setClip(c => ({
    ...c,
    [k]: v
  }));
  const setChoice = (i, k, v) => setClip(c => ({
    ...c,
    choices: c.choices.map((x, j) => k === 'ok' ? {
      ...x,
      ok: j === i
    } : j === i ? {
      ...x,
      [k]: v
    } : x)
  }));
  const read = value => {
    setLink(value);
    const parsed = QI.parseYouTube(value);
    if (parsed) setClip(c => ({
      ...c,
      yt: parsed.id,
      start: c.yt === parsed.id ? c.start : parsed.start,
      pause: c.yt === parsed.id ? c.pause : 0,
      end: c.yt === parsed.id ? c.end : 0
    }));
  };
  const now = () => Math.round((player.current?.getCurrentTime?.() || 0) * 10) / 10;
  const markers = [['start', 'Début de l’action'], ['pause', 'Instant de décision (pause)'], ['end', 'Fin de la suite']];
  const save = () => {
    const filled = {
      ...clip,
      choices: clip.choices.filter(x => x.text.trim())
    };
    const problem = QI.clipError(filled);
    if (problem) {
      setError(problem);
      return;
    }
    update(s => ({
      ...s,
      qi: QI.saveClip(s.qi, filled)
    }));
    notify(existing ? 'Extrait mis à jour.' : 'Extrait ajouté à ta vidéothèque.');
    go('qi-video');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    onBack: () => go('qi-video'),
    eyebrow: "Vrais matchs",
    title: existing ? 'Modifier l’extrait.' : 'Ajouter un extrait.'
  }, "Colle un lien YouTube, puis marque trois instants pendant la lecture."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg"
  }, /*#__PURE__*/React.createElement(PTField, {
    label: "Lien YouTube",
    value: link,
    placeholder: "https://www.youtube.com/watch?v=\u2026",
    inputMode: "url",
    onChange: e => read(e.target.value)
  }), clip.yt && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "qi-video-frame editor"
  }, /*#__PURE__*/React.createElement("div", {
    ref: host,
    className: "qi-video-host"
  })), ytError && /*#__PURE__*/React.createElement("p", {
    className: "notice warning"
  }, ptYtErrors[ytError] || 'Vidéo indisponible.', " Choisis une autre vid\xE9o."), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, markers.map(([k, label]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "clip-marker"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, label), /*#__PURE__*/React.createElement("small", {
    className: "num"
  }, clip[k] ? ptClock(clip[k]) : '—')), /*#__PURE__*/React.createElement("div", {
    className: "button-row tight"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": `${label} : reculer de 0,5 s`,
    disabled: !clip[k],
    onClick: () => {
      const v = Math.max(0, Math.round((clip[k] - .5) * 10) / 10);
      set(k, v);
      player.current?.seekTo(v, true);
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("button", {
    className: "chip",
    disabled: !ready,
    onClick: () => set(k, now())
  }, "Maintenant"), /*#__PURE__*/React.createElement("button", {
    className: "icon-button",
    "aria-label": `${label} : avancer de 0,5 s`,
    disabled: !clip[k],
    onClick: () => {
      const v = Math.round((clip[k] + .5) * 10) / 10;
      set(k, v);
      player.current?.seekTo(v, true);
    }
  }, "+")))), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Mets la pause juste avant la passe ou le choix du porteur : c\u2019est l\u2019image que tu devras lire."))), /*#__PURE__*/React.createElement(PTField, {
    label: "Titre",
    maxLength: "80",
    value: clip.title,
    placeholder: "Ex. Pick & roll, aide du coin",
    onChange: e => set('title', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Th\xE8me"
  }, /*#__PURE__*/React.createElement("select", {
    value: clip.theme,
    onChange: e => set('theme', e.target.value)
  }, Object.entries(QI.themes).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, v)))), /*#__PURE__*/React.createElement(PTField, {
    label: "Question pos\xE9e \xE0 la pause",
    maxLength: "200",
    value: clip.prompt,
    onChange: e => set('prompt', e.target.value)
  }), /*#__PURE__*/React.createElement("section", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("h3", null, "R\xE9ponses"), /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "Coche la bonne. Deux r\xE9ponses minimum."), clip.choices.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "clip-choice"
  }, /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "clip-ok",
    checked: c.ok,
    onChange: () => setChoice(i, 'ok', true)
  }), "Bonne r\xE9ponse"), /*#__PURE__*/React.createElement(PTField, {
    label: `Réponse ${i + 1}`,
    maxLength: "120",
    value: c.text,
    onChange: e => setChoice(i, 'text', e.target.value)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: "Pourquoi",
    maxLength: "400",
    value: c.why,
    onChange: e => setChoice(i, 'why', e.target.value)
  })))), /*#__PURE__*/React.createElement(PTField, {
    label: "Le\xE7on \xE0 retenir (facultatif)"
  }, /*#__PURE__*/React.createElement("textarea", {
    maxLength: "400",
    value: clip.lesson,
    onChange: e => set('lesson', e.target.value)
  })), /*#__PURE__*/React.createElement(PTField, {
    label: "Source (facultatif)",
    maxLength: "120",
    value: clip.source,
    placeholder: "Ex. Finale 2024, 3e quart-temps",
    onChange: e => set('source', e.target.value)
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: save
  }, existing ? 'Enregistrer les changements' : 'Ajouter à ma vidéothèque', /*#__PURE__*/React.createElement(PTIcon, {
    name: "check",
    size: 18
  }))));
}