/* Quick Rehab (questionnaire + protocoles) et Warm Up basket. Réutilise les composants de personal-app.jsx. */
const RW = window.RehabWarmup;
const rwSides = [{value:'left',label:'Gauche'},{value:'right',label:'Droite'},{value:'both',label:'Deux côtés'},{value:'center',label:'Centre'}];
const rwThumb = id => PT.catalog.find(e => e.id === id) || PT.catalog[0];

// Lancer une séance courte : même règle que les Quick Workout (une séance active est conservée).
function rwLaunch({data, update, go, notify}, build) {
  if (data.draft?.status === 'active') { go('session'); notify('Ta séance en cours est conservée.'); return; }
  const plan = build(data);
  if (plan.error) { notify(plan.error); return; }
  update(s => ({...s, draft: plan})); go('preview');
}

function PTRehabRail(props) {
  const {data, go} = props;
  const painZones = RW.activeZones(data);
  const zones = [...RW.zones].sort((a, b) => painZones.includes(b.id) - painZones.includes(a.id));
  const last = [...(data.rehab?.log || [])].reverse().find(x => PT.dayDiff(PT.dateKey(), x.date) <= 21);
  const lastProtocol = last && RW.byId(last.protocolId);
  const lastLevel = lastProtocol ? (data.rehab.levels[lastProtocol.id] ?? last.level) : 0;
  const resume = () => rwLaunch(props, s => RW.rehabPlan(PT, window.PlayerProfile, s, lastProtocol.id, lastLevel, 15));
  return <section className="scroll-reveal rehab-rail"><div className="section-head"><h2>QUICK REHAB</h2><span className="caption">Une douleur, un protocole</span></div>
    <div className="workout-rail">
      {lastProtocol && <button className="preset-workout" onClick={resume}><PTThumbnail exercise={rwThumb(lastProtocol.levels[lastLevel][0][0] || lastProtocol.levels[lastLevel][0].ids[0])}/><span className="preset-info"><small>Reprendre · {RW.LEVELS[lastLevel]}</small><strong>{lastProtocol.title}</strong><span className="preset-play"><PTIcon name="play" size={17}/></span></span></button>}
      <button className="preset-workout quiz-tile" onClick={() => go('rehab')}><span className="quiz-tile-court" aria-hidden="true"><PTIcon name="pain" size={44}/></span><span className="preset-info"><small>2 min de questions</small><strong>Trouver mon protocole</strong><span className="preset-play"><PTIcon name="arrow" size={17}/></span></span></button>
      {zones.map(z => <button key={z.id} className="preset-workout" onClick={() => go('rehab', z.id)}><PTThumbnail exercise={rwThumb(z.thumb)}/><span className="preset-info"><small>{painZones.includes(z.id) ? 'Ta douleur' : 'Questionnaire ciblé'}</small><strong>{z.label}</strong><span className="preset-play"><PTIcon name="arrow" size={17}/></span></span></button>)}
    </div></section>;
}

function PTWarmupRail(props) {
  return <section className="scroll-reveal"><div className="section-head"><h2>WARM UP</h2><span className="caption">Avant de jouer</span></div>
    <div className="workout-rail">
      {RW.warmups.map(w => <button key={w.id} className="preset-workout" onClick={() => rwLaunch(props, s => RW.warmupPlan(PT, window.PlayerProfile, s, w.id))}><PTThumbnail exercise={rwThumb(w.thumb)}/><span className="preset-info"><small>{w.minutes} min</small><strong>{w.title}</strong><span className="preset-play"><PTIcon name="play" size={17}/></span></span></button>)}
    </div></section>;
}

function PTRehabSources({ids}) {
  return <details className="disclosure"><summary>Sur quoi c’est basé</summary><ul className="reason-list">{ids.map(k => RW.sources[k]).filter(Boolean).map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}</ul></details>;
}

function PTRehabQuiz({data, update, go, notify, id}) {
  const [answers, setAnswers] = usePTState(() => {
    const pre = RW.prefill(data);
    const zone = RW.zones.some(z => z.id === id) ? id : pre.zone || null;
    const same = zone && zone === pre.zone;
    return {zone, where: same ? pre.where || null : null, severity: same && pre.severity != null ? pre.severity : 3, side: same && pre.side || 'right', onset: same ? pre.onset || null : null, flags: [], flagsChecked: false, triggers: [], minutes: 15, fromSymptom: same ? pre.fromSymptom : null};
  });
  const [step, setStep] = usePTState(0), [level, setLevel] = usePTState(null), [save, setSave] = usePTState(true);
  const set = (k, v) => setAnswers(a => ({...a, [k]: v}));
  const zoneWhere = RW.where[answers.zone] || [];
  // Une seule option d'endroit : choisie d'office.
  const where = answers.where || (zoneWhere.length === 1 ? zoneWhere[0][0] : null);
  const full = {...answers, where};
  const result = step === 3 ? RW.pick(full, data) : null;
  const chosenLevel = result && result.protocol ? Math.min(level ?? result.level, 2) : 0;
  const hasSymptom = !!answers.fromSymptom || PT.activeSymptoms(data).some(s => result?.protocol && s.region === result.protocol.region);
  const steps = [
    {title:'Où as-tu mal ?', intro:'Choisis la zone, puis l’endroit le plus précis possible.', valid:!!answers.zone && !!where},
    {title:'Comment ça va ?', intro:'L’intensité et l’ancienneté choisissent le niveau de départ.', valid:!!answers.onset},
    {title:'Ce qu’il faut vérifier.', intro:'Avant tout exercice ciblé, quelques signes demandent l’avis d’un professionnel.', valid:answers.flagsChecked},
    {title:'Ton protocole.', intro:'Un protocole publié, adapté à ton matériel et à ta douleur.', valid:true}
  ];
  const next = () => { setStep(step + 1); window.scrollTo(0, 0); };
  const launch = () => {
    const protocol = result.protocol;
    const symptom = save && !hasSymptom && Number(answers.severity) > 0 ? {id:PT.uid(), region:protocol.region, side:answers.side, severity:Number(answers.severity), onset:answers.onset === 'acute' ? 'new' : 'known', redFlags:false, note:`Quick Rehab · ${protocol.title}`, date:PT.dateKey(), active:true, followups:[]} : null;
    const nextState = symptom ? {...data, symptoms:[...data.symptoms, symptom]} : data;
    if (data.draft?.status === 'active') { go('session'); notify('Ta séance en cours est conservée.'); return; }
    const plan = RW.rehabPlan(PT, window.PlayerProfile, nextState, protocol.id, chosenLevel, answers.minutes);
    if (plan.error) { notify(plan.error); return; }
    update(s => ({...s, symptoms: symptom ? [...s.symptoms, symptom] : s.symptoms, draft: plan}));
    go('preview');
  };
  return <div className="rehab-quiz">
    <PTPageHead eyebrow="Quick Rehab" title={steps[step].title} onBack={step === 0 ? () => go('today') : () => setStep(step - 1)}>{steps[step].intro}</PTPageHead>
    <div className="step-caption"><span>Ta douleur</span><span>{step + 1} / {steps.length}</span></div>
    <div className="step-track">{steps.map((_, i) => <span className={i <= step ? 'done' : ''} key={i}/>)}</div>
    <div className="stack-lg">
      {step === 0 && <>
        {answers.fromSymptom && <p className="notice">Pré-rempli avec la douleur déjà signalée dans ton suivi.</p>}
        <section className="stack-sm"><h3>Zone</h3><PTChoices value={answers.zone} onChange={v => setAnswers(a => ({...a, zone:v, where:null}))} options={RW.zones.map(z => ({value:z.id, label:z.label, icon:z.icon, hint:RW.activeZones(data).includes(z.id) ? 'Douleur signalée' : undefined}))}/></section>
        {zoneWhere.length > 1 && <section className="stack-sm"><h3>Où exactement ?</h3><PTChoices columns={1} value={where} onChange={v => set('where', v)} options={zoneWhere.map(([value, label]) => ({value, label, hint:value !== 'unknown' ? RW.byId(value)?.short : 'On s’appuie sur ce qui déclenche la douleur'}))}/></section>}
      </>}
      {step === 1 && <>
        <PTField label={`Intensité ressentie : ${answers.severity} / 10`} hint="0 = aucune douleur, tu veux prévenir. 7 et plus : avis médical avant de reprendre."><input type="range" min="0" max="10" step="1" value={answers.severity} onChange={e => set('severity', Number(e.target.value))}/></PTField>
        <section className="stack-sm"><h3>Côté</h3><PTChips value={answers.side} onChange={v => set('side', v)} options={rwSides}/></section>
        <section className="stack-sm"><h3>Depuis quand ?</h3><PTChoices value={answers.onset} onChange={v => set('onset', v)} options={RW.onsets.map(([value, label]) => ({value, label}))}/></section>
      </>}
      {step === 2 && <>
        <section className="stack-sm"><h3>As-tu un de ces signes ?</h3><PTChips multi value={answers.flags} onChange={v => setAnswers(a => ({...a, flags:v, flagsChecked:true}))} options={RW.redFlags.map(([value, label]) => ({value, label}))}/>
          <PTButton quiet aria-pressed={answers.flagsChecked && !answers.flags.length} onClick={() => setAnswers(a => ({...a, flags:[], flagsChecked:true}))}><PTIcon name="check" size={18}/>Aucun de ces signes</PTButton></section>
        <section className="stack-sm"><h3>Qu’est-ce qui déclenche la douleur ? <small className="caption">· facultatif</small></h3><PTChips multi value={answers.triggers} onChange={v => set('triggers', v)} options={RW.triggers.map(([value, label]) => ({value, label}))}/></section>
      </>}
      {step === 3 && result && (result.stop ? <section className="stack">
        <p className="notice warning" role="alert">{result.reason}</p>
        <p className="fine">Note-le dans ton suivi : les séances générées en tiendront compte et resteront suspendues tant que le signe est présent.</p>
        <div className="button-row"><PTButton primary onClick={() => go('symptoms')}>Signaler cette douleur</PTButton><PTButton quiet onClick={() => go('today')}>Revenir à aujourd’hui</PTButton></div>
      </section> : result.error ? <p className="error" role="alert">{result.error}</p> : <section className="stack-lg">
        <div className="card stack-sm"><div className="eyebrow">{RW.zones.find(z => z.id === result.protocol.zone)?.label}</div><h2>{result.protocol.title}</h2><p className="fine">{result.protocol.short}.</p></div>
        <section className="stack-sm"><h3>Niveau</h3><PTChoices columns={3} value={chosenLevel} onChange={setLevel} options={RW.LEVELS.map((label, i) => ({value:i, label, hint:i === result.level ? 'Conseillé' : undefined}))}/>
          <p className="fine">{RW.levelHints[chosenLevel]}</p>
          {chosenLevel > result.level && <p className="notice warning">Plus haut que le niveau conseillé : arrête dès que la douleur dépasse 2/10.</p>}</section>
        <section className="stack-sm"><h3>Durée</h3><PTChips value={answers.minutes} onChange={v => set('minutes', v)} options={[{value:10, label:'≈ 10 min'}, {value:15, label:'≈ 15 min'}, {value:20, label:'≈ 20 min'}]}/></section>
        {!hasSymptom && Number(answers.severity) > 0 && <label className="check-label"><input type="checkbox" checked={save} onChange={e => setSave(e.target.checked)}/> Ajouter cette douleur à mon suivi ({answers.severity}/10). Les séances du programme en tiendront compte.</label>}
        <p className="notice">Règle de la douleur : 2/10 au maximum pendant l’effort, revenue à la normale le lendemain. Ce protocole ne remplace pas l’avis d’un kiné.</p>
        <PTRehabSources ids={result.protocol.sources}/>
        <div className="rehab-launch"><PTButton primary onClick={launch}><PTIcon name="play" size={22}/>Voir ma séance</PTButton></div>
      </section>)}
      {step < 3 && <div className="button-row">
        {!steps[step].valid && <p className="fine">{step === 2 ? 'Coche les signes présents, ou « Aucun de ces signes ».' : 'Réponds pour continuer.'}</p>}
        <PTButton primary disabled={!steps[step].valid} onClick={next}>{step === 2 ? 'Voir mon protocole' : 'Continuer'}<PTIcon name="arrow" size={18}/></PTButton>
      </div>}
    </div>
  </div>;
}

// Dans l'aperçu d'une séance du programme : proposer de retirer le temps déjà fait aujourd'hui en rehab ou en warm-up.
function PTCreditPrompt({data, update, notify}) {
  const plan = data.draft;
  const credit = RW.pendingCredit(data);
  if (!credit || !RW.canCredit(plan) || plan.status !== 'preview') return null;
  const handled = sessions => sessions.map(x => credit.sessionIds.includes(x.id) ? {...x, creditHandled:true} : x);
  const accept = () => { update(s => ({...s, draft:RW.applyCredit(PT, s.draft, credit), sessions:handled(s.sessions)})); notify(`Séance ajustée : ${credit.minutes} min déjà faites aujourd’hui.`); };
  const decline = () => update(s => ({...s, draft:{...s.draft, creditDeclined:true}, sessions:handled(s.sessions)}));
  return <section className="card stack-sm credit-prompt" aria-live="polite">
    <h3>Déjà {credit.minutes} min aujourd’hui</h3>
    <p className="fine">{credit.labels.join(' + ')}. Retirer {credit.minutes} min de cette séance ?{credit.warmup ? ' L’échauffement est déjà fait.' : ''}</p>
    <div className="button-row"><PTButton primary onClick={accept}>Oui, ajuster</PTButton><PTButton quiet onClick={decline}>Non, garder</PTButton></div>
  </section>;
}

// Fin d'une séance de rehab : la douleur ressentie règle le niveau suivant.
function PTRehabPainAfter({value, onChange}) {
  return <section className="effort-picker stack"><h2>Douleur sur la zone, maintenant ?</h2>
    <div className="effort-scale" role="group" aria-label="Douleur de 0 à 10">{[0,1,2,3,4,5,6,7,8,9,10].map(n => <button key={n} aria-label={`Douleur ${n} sur 10`} aria-pressed={value === n} onClick={() => onChange(n)}>{n}</button>)}</div>
    <div className="topline caption"><span>Aucune</span><span>Maximale</span></div>
    {value != null && <p className="fine">{value <= 2 ? 'Bien toléré. Deux séances comme ça et le niveau monte.' : value <= 5 ? 'Acceptable si ça revient à la normale demain. Le niveau reste le même.' : 'Trop douloureux : le niveau redescend. Si ça persiste, demande l’avis d’un kiné.'}</p>}
  </section>;
}
