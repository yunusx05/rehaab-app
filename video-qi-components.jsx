/* QI basket sur de vrais matchs : lecteur YouTube intégré (rien n'est copié ni hébergé), pause au moment de la décision,
   réponse chronométrée, puis la suite de l'action. Réutilise PTQiChoices / PTQiFeedback de qi-components.jsx. */
const PT_CLIP_SECONDS = 6;

// L'API YouTube n'est chargée qu'à l'ouverture d'un écran vidéo, une seule fois.
let ptYtPromise = null;
function ptYouTube() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ptYtPromise) ptYtPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (previous) previous(); resolve(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { ptYtPromise = null; reject(new Error('offline')); };
    document.head.appendChild(s);
  });
  return ptYtPromise;
}
const ptYtErrors = {2:'Lien vidéo invalide.',5:'Cette vidéo ne peut pas être lue ici.',100:'Vidéo introuvable ou privée.',101:'La chaîne interdit la lecture hors de YouTube.',150:'La chaîne interdit la lecture hors de YouTube.',offline:'Pas de connexion : les vidéos YouTube demandent Internet.'};
const ptClock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
const ptYtWatch = (id, start) => `https://www.youtube.com/watch?v=${id}&t=${Math.floor(start)}s`;

// Le lecteur remplace un nœud créé à la main : React ne gère jamais l'iframe.
function usePTYouTube(videoId, start = 0, controls = false) {
  const host = usePTRef(null), player = usePTRef(null);
  const [ready, setReady] = usePTState(false), [error, setError] = usePTState(null);
  usePTEffect(() => {
    if (!videoId || !host.current) return;
    let cancelled = false; setReady(false); setError(null);
    const mount = document.createElement('div'); host.current.replaceChildren(mount);
    ptYouTube().then(YT => {
      if (cancelled) return;
      player.current = new YT.Player(mount, {videoId, host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%',
        playerVars: {start: Math.floor(start), playsinline: 1, rel: 0, modestbranding: 1, controls: controls ? 1 : 0, disablekb: controls ? 0 : 1, fs: 0, iv_load_policy: 3},
        events: {onReady: () => { if (!cancelled) { player.current.mute(); setReady(true); } }, onError: e => { if (!cancelled) setError(e.data); }}});
    }).catch(() => { if (!cancelled) setError('offline'); });
    return () => { cancelled = true; try { player.current?.destroy(); } catch (e) {} player.current = null; };
  }, [videoId]);
  return {host, player, ready, error};
}

function PTQiVideoItem({clip, onAnswer}) {
  const {host, player, ready, error} = usePTYouTube(clip.yt, clip.start);
  const [phase, setPhase] = usePTState('idle'), [picked, setPicked] = usePTState(null), [left, setLeft] = usePTState(PT_CLIP_SECONDS), [sound, setSound] = usePTState(false);
  const phaseRef = usePTRef(phase); phaseRef.current = phase;
  const deadline = usePTRef(0);
  // Une seule boucle de 50 ms surveille l'instant de pause, la fin de l'extrait et le chrono de décision.
  usePTEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const p = player.current; if (!p || !p.getCurrentTime) return;
      const t = p.getCurrentTime(), ph = phaseRef.current;
      if (ph === 'playing' && t >= clip.pause) { p.pauseVideo(); p.seekTo(clip.pause, true); deadline.current = Date.now() + PT_CLIP_SECONDS * 1000; setLeft(PT_CLIP_SECONDS); setPhase('question'); }
      else if (ph === 'question') { const s = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)); setLeft(s); if (s === 0) choose(-1); }
      else if (ph === 'reveal' && t >= clip.end) { p.pauseVideo(); setPhase('done'); }
    }, 50);
    return () => clearInterval(id);
  }, [ready, clip.id]);
  const start = (rate = 1) => { const p = player.current; if (!p) return; p.setPlaybackRate(rate); p.seekTo(clip.start, true); p.playVideo(); setPhase(phase === 'done' || phase === 'reveal' ? 'reveal' : 'playing'); };
  const choose = i => {
    if (phaseRef.current !== 'question') return;
    setPicked(i); setPhase('reveal');
    onAnswer(i >= 0 && clip.choices[i].ok);
    const p = player.current; if (p) { p.setPlaybackRate(1); p.playVideo(); }
  };
  const toggleSound = () => { const p = player.current; if (!p) return; if (sound) p.mute(); else p.unMute(); setSound(!sound); };
  const ok = picked !== null && picked >= 0 && clip.choices[picked]?.ok;
  return <div className="stack qi-video">
    <div className={`qi-video-frame phase-${phase}`}>
      <div ref={host} className="qi-video-host"/>
      {phase === 'question' && <div className="qi-video-freeze" aria-hidden="true"><span>Pause</span><strong>{left}</strong></div>}
      {!ready && !error && <div className="qi-video-cover"><span className="caption">Chargement de la vidéo…</span></div>}
    </div>
    {error ? <div className="notice warning stack-sm"><p>{ptYtErrors[error] || 'Vidéo indisponible.'}</p><a className="text-button" href={ptYtWatch(clip.yt, clip.start)} target="_blank" rel="noopener noreferrer">Ouvrir sur YouTube</a><PTButton quiet onClick={() => onAnswer(null)}>Passer cet extrait</PTButton></div>
    : <>
      <p className="qi-prompt">{clip.prompt}</p>
      {phase === 'idle' && <PTButton primary disabled={!ready} onClick={() => start()}><PTIcon name="play" size={20}/>Lancer l’action</PTButton>}
      {phase === 'playing' && <p className="caption" aria-live="polite">Regarde tout le terrain : la vidéo s’arrête au moment de décider.</p>}
      {(phase === 'question' || picked !== null) && <>
        {phase === 'question' && <p className="caption" role="timer" aria-live="assertive">{left} s pour choisir</p>}
        <PTQiChoices choices={clip.choices} picked={picked === null ? null : Math.max(picked, -2)} onPick={choose}/>
      </>}
      {picked !== null && <PTQiFeedback ok={ok} title={picked < 0 ? 'Trop tard : en match, la fenêtre se ferme.' : undefined} why={(clip.choices[picked] || clip.choices.find(c => c.ok))?.why} lesson={clip.lesson}/>}
      {phase === 'reveal' && <p className="caption" aria-live="polite">La suite de l’action…</p>}
      {phase === 'done' && <div className="button-row"><PTButton quiet onClick={() => start(0.5)}><PTIcon name="refresh" size={18}/>Revoir au ralenti</PTButton></div>}
      {ready && <button className="text-button" onClick={toggleSound}>{sound ? 'Couper le son' : 'Activer le son'}</button>}
      {clip.source && <p className="fine">Source : {clip.source}</p>}
    </>}
  </div>;
}

function PTQiVideoRun({data, update, go, id}) {
  const [items] = usePTState(() => { const pool = QI.videoPool(data.qi); const one = id && pool.find(c => c.id === id); return one ? [one] : pool.slice(0, 5); });
  const [index, setIndex] = usePTState(0), [answered, setAnswered] = usePTState(false), [score, setScore] = usePTState(0);
  const clip = items[index];
  const answer = correct => {
    if (correct === null) { setIndex(i => i + 1); return; }
    setAnswered(true); if (correct) setScore(n => n + 1);
    update(s => ({...s, qi: QI.record(s.qi, {id: clip.id, mode: 'video', theme: clip.theme, correct})}));
  };
  if (!items.length) return <><PTPageHead onBack={() => go('qi-video')} eyebrow="Vrais matchs" title="Aucun extrait pour l’instant."/><PTButton primary onClick={() => go('qi-video-edit')}>Ajouter un extrait</PTButton></>;
  if (!clip) return <><PTPageHead onBack={() => go('qi-video')} eyebrow="Vrais matchs" title={`${score} sur ${items.length}.`}>Les extraits ratés reviendront en premier la prochaine fois.</PTPageHead><PTButton primary onClick={() => go('qi-video')}>Revenir aux extraits<PTIcon name="arrow" size={18}/></PTButton></>;
  return <><PTPageHead onBack={() => go('qi-video')} eyebrow={`Vrais matchs · ${index + 1} / ${items.length} · ${QI.themes[clip.theme] || ''}`} title={clip.title}/>
    <div className="stack-lg qi-run">
      <div className="step-track">{items.map((_, i) => <span key={i} className={i <= index ? 'done' : ''}/>)}</div>
      <PTQiVideoItem key={clip.id} clip={clip} onAnswer={answer}/>
      {answered && <PTButton primary onClick={() => { setIndex(i => i + 1); setAnswered(false); window.scrollTo(0, 0); }}>{index + 1 < items.length ? 'Extrait suivant' : 'Voir mon résultat'}<PTIcon name="arrow" size={18}/></PTButton>}
    </div></>;
}

function PTQiVideoHome({data, update, go, notify}) {
  const pool = QI.videoPool(data.qi), mine = data.qi.clips || [];
  const [remove, setRemove] = usePTState(null);
  const done = new Set(data.qi.answers.filter(a => a.mode === 'video' && a.correct).map(a => a.id));
  return <><PTPageHead onBack={() => go('qi')} eyebrow="QI basket" title="Vrais matchs.">La vidéo s’arrête au moment de la décision. {PT_CLIP_SECONDS} secondes pour lire le jeu, puis la suite de l’action.</PTPageHead>
    <div className="stack-lg">
      <section className="mind-card"><h2>{pool.length ? `${pool.length} extrait${pool.length > 1 ? 's' : ''}` : 'Ta vidéothèque est vide.'}</h2><p className="fine">{pool.length ? `${done.size} bien lu${done.size > 1 ? 's' : ''} au moins une fois.` : 'Colle un lien YouTube, marque le début, l’instant de décision et la fin.'}</p>
        {pool.length > 0 && <PTButton primary onClick={() => go('qi-video-run')}>Lancer {Math.min(5, pool.length)} extrait{pool.length > 1 ? 's' : ''}<PTIcon name="play" size={18}/></PTButton>}
        <PTButton quiet onClick={() => go('qi-video-edit')}><PTIcon name="plus" size={18}/>Ajouter un extrait</PTButton></section>
      {pool.length > 0 && <section className="stack-sm"><h2>Les extraits</h2>{pool.map(c => <article key={c.id} className="clip-row">
        <button className="clip-open" onClick={() => go('qi-video-run', c.id)}><img src={`https://i.ytimg.com/vi/${c.yt}/mqdefault.jpg`} alt="" loading="lazy"/><span><strong>{c.title}</strong><small>{QI.themes[c.theme]}{done.has(c.id) ? ' · bien lu' : ''}{c.own ? '' : ' · de base'}</small></span></button>
        {c.own && <div className="clip-actions"><button className="text-button" onClick={() => go('qi-video-edit', c.id)}>Modifier</button>{remove === c.id ? <button className="text-button danger-text" onClick={() => { update(s => ({...s, qi: QI.removeClip(s.qi, c.id)})); setRemove(null); notify('Extrait retiré.'); }}>Confirmer</button> : <button className="text-button" onClick={() => setRemove(c.id)}>Retirer</button>}</div>}
      </article>)}</section>}
      <p className="fine">Les vidéos restent sur YouTube : l’app ne les copie pas et ne les héberge pas. Certaines chaînes interdisent la lecture intégrée ; l’app le signale et propose de l’ouvrir sur YouTube.</p>
    </div></>;
}

const ptBlankClip = () => ({id: `clip-${Date.now().toString(36)}`, yt: '', start: 0, pause: 0, end: 0, title: '', theme: 'pnr-handler', prompt: 'Que doit faire le porteur ?', lesson: '', source: '', choices: [{text: '', ok: true, why: ''}, {text: '', ok: false, why: ''}, {text: '', ok: false, why: ''}, {text: '', ok: false, why: ''}]});
function PTQiVideoEdit({data, update, go, notify, id}) {
  const existing = (data.qi.clips || []).find(c => c.id === id);
  const [clip, setClip] = usePTState(() => existing ? {...existing, choices: [...existing.choices, ...ptBlankClip().choices].slice(0, 4)} : ptBlankClip());
  const [link, setLink] = usePTState(existing ? ptYtWatch(existing.yt, existing.start) : ''), [error, setError] = usePTState('');
  const {host, player, ready, error: ytError} = usePTYouTube(clip.yt, clip.start, true);
  const set = (k, v) => setClip(c => ({...c, [k]: v}));
  const setChoice = (i, k, v) => setClip(c => ({...c, choices: c.choices.map((x, j) => k === 'ok' ? {...x, ok: j === i} : j === i ? {...x, [k]: v} : x)}));
  const read = value => { setLink(value); const parsed = QI.parseYouTube(value); if (parsed) setClip(c => ({...c, yt: parsed.id, start: c.yt === parsed.id ? c.start : parsed.start, pause: c.yt === parsed.id ? c.pause : 0, end: c.yt === parsed.id ? c.end : 0})); };
  const now = () => Math.round((player.current?.getCurrentTime?.() || 0) * 10) / 10;
  const markers = [['start', 'Début de l’action'], ['pause', 'Instant de décision (pause)'], ['end', 'Fin de la suite']];
  const save = () => {
    const filled = {...clip, choices: clip.choices.filter(x => x.text.trim())};
    const problem = QI.clipError(filled); if (problem) { setError(problem); return; }
    update(s => ({...s, qi: QI.saveClip(s.qi, filled)})); notify(existing ? 'Extrait mis à jour.' : 'Extrait ajouté à ta vidéothèque.'); go('qi-video');
  };
  return <><PTPageHead onBack={() => go('qi-video')} eyebrow="Vrais matchs" title={existing ? 'Modifier l’extrait.' : 'Ajouter un extrait.'}>Colle un lien YouTube, puis marque trois instants pendant la lecture.</PTPageHead>
    <div className="stack-lg">
      <PTField label="Lien YouTube" value={link} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" onChange={e => read(e.target.value)}/>
      {clip.yt && <>
        <div className="qi-video-frame editor"><div ref={host} className="qi-video-host"/></div>
        {ytError && <p className="notice warning">{ptYtErrors[ytError] || 'Vidéo indisponible.'} Choisis une autre vidéo.</p>}
        <section className="stack-sm">{markers.map(([k, label]) => <div key={k} className="clip-marker">
          <span><strong>{label}</strong><small className="num">{clip[k] ? ptClock(clip[k]) : '—'}</small></span>
          <div className="button-row tight"><button className="icon-button" aria-label={`${label} : reculer de 0,5 s`} disabled={!clip[k]} onClick={() => { const v = Math.max(0, Math.round((clip[k] - .5) * 10) / 10); set(k, v); player.current?.seekTo(v, true); }}>−</button><button className="chip" disabled={!ready} onClick={() => set(k, now())}>Maintenant</button><button className="icon-button" aria-label={`${label} : avancer de 0,5 s`} disabled={!clip[k]} onClick={() => { const v = Math.round((clip[k] + .5) * 10) / 10; set(k, v); player.current?.seekTo(v, true); }}>+</button></div>
        </div>)}<p className="fine">Mets la pause juste avant la passe ou le choix du porteur : c’est l’image que tu devras lire.</p></section>
      </>}
      <PTField label="Titre" maxLength="80" value={clip.title} placeholder="Ex. Pick & roll, aide du coin" onChange={e => set('title', e.target.value)}/>
      <PTField label="Thème"><select value={clip.theme} onChange={e => set('theme', e.target.value)}>{Object.entries(QI.themes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></PTField>
      <PTField label="Question posée à la pause" maxLength="200" value={clip.prompt} onChange={e => set('prompt', e.target.value)}/>
      <section className="stack-sm"><h3>Réponses</h3><p className="fine">Coche la bonne. Deux réponses minimum.</p>
        {clip.choices.map((c, i) => <div key={i} className="clip-choice"><label className="check-label"><input type="radio" name="clip-ok" checked={c.ok} onChange={() => setChoice(i, 'ok', true)}/>Bonne réponse</label><PTField label={`Réponse ${i + 1}`} maxLength="120" value={c.text} onChange={e => setChoice(i, 'text', e.target.value)}/><PTField label="Pourquoi" maxLength="400" value={c.why} onChange={e => setChoice(i, 'why', e.target.value)}/></div>)}</section>
      <PTField label="Leçon à retenir (facultatif)"><textarea maxLength="400" value={clip.lesson} onChange={e => set('lesson', e.target.value)}/></PTField>
      <PTField label="Source (facultatif)" maxLength="120" value={clip.source} placeholder="Ex. Finale 2024, 3e quart-temps" onChange={e => set('source', e.target.value)}/>
      {error && <p className="error" role="alert">{error}</p>}
      <PTButton primary onClick={save}>{existing ? 'Enregistrer les changements' : 'Ajouter à ma vidéothèque'}<PTIcon name="check" size={18}/></PTButton>
    </div></>;
}
