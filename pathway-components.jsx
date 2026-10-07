/* Parcours « Retour au jeu » : étapes, séances de la semaine, critères de passage, paliers de jeu. */
const ptRoleLabel = role => role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

function PTPathwayIntro({data,update,go}) {
  const advice = data.athletic?.date ? AP.recommendedStart(data) : null;
  const [start,setStart] = usePTState(advice ? advice.step : 1);
  const hasPlayer = !!data.player?.position;
  return <><PTPageHead onBack={() => go('today')} eyebrow="Parcours basket" title="Retour au jeu.">
      Cinq étapes pour revenir sur le terrain sans te blesser. On avance quand le corps a validé les critères, pas quand le calendrier le dit.
    </PTPageHead>
    <div className="stack-lg">
      <button className="home-action is-featured" onClick={() => go('bilan', 'tests')}><PTIcon name="chart"/><span><strong>Mesurer ma détente et mes tests</strong><small>Saut vertical, RSI, sprint : avec un mur, un mètre ou une vidéo au ralenti.</small></span><PTIcon name="arrow" size={18}/></button>
      {!hasPlayer && <div className="notice warning stack-sm"><p>Renseigne d’abord ton poste et tes douleurs : les séances s’adaptent à ton profil.</p><PTButton onClick={() => go('player')}>Créer mon profil joueur<PTIcon name="arrow" size={18}/></PTButton></div>}
      <ol className="step-list">
        {BP.steps.map(s => <li key={s.id} className={start === s.id ? 'is-current' : ''}>
          <span className="step-thumb"><img src={`media/pathway/${s.id}.webp`} alt="" loading="lazy" decoding="async"/><i className="step-num">{s.id}</i></span>
          <div><strong>{s.name}</strong><small>{s.minWeeks} semaines minimum{s.base ? ` · ${s.base}` : ''}</small></div>
        </li>)}
      </ol>
      {hasPlayer && !advice && <PTAssessmentSummary data={data} go={go}/>}
      <section className="stack-sm"><h3>Par où commencer ?</h3>
        <PTChips value={start} onChange={setStart} options={BP.steps.map(s => ({value:s.id, label:`Étape ${s.id}`}))}/>
        {advice && <p className="notice">Ton bilan conseille l’étape {advice.step}. {advice.reason}</p>}
        <p className="fine">{start === 1 ? 'Après une longue pause, l’étape 1 est la bonne porte d’entrée, même si tu te sens en forme : les tendons ont besoin de plus de temps que les muscles.' : 'Commencer plus loin suppose que tu réussis déjà les critères des étapes précédentes. Tu pourras revenir en arrière à tout moment.'}</p>
      </section>
      <PTButton primary onClick={() => update(s => ({...s, pathway: AP.seedPathwayTests(BP.create({startStep:start}), s.athletic)}))}>Commencer le parcours<PTIcon name="arrow" size={18}/></PTButton>
      {(data.pathwayArchive || []).slice(-1).map(old => <button key={old.id} className="home-action" onClick={() => update(s => {const {stoppedAt, ...kept} = old; return {...s, pathway: BP.validatePathway(kept), pathwayArchive: (s.pathwayArchive || []).filter(x => x.id !== old.id)};})}><PTIcon name="refresh"/><span><strong>Reprendre mon parcours arrêté</strong><small>Étape {old.step} · {BP.stepById(old.step)?.name}, arrêté le {shortDate(old.stoppedAt)}</small></span><PTIcon name="arrow" size={18}/></button>)}
      <div className="home-options">
        <button className="home-action" onClick={() => go('library')}><PTIcon name="book"/><span><strong>Tous les exercices</strong><small>{PT.allExercises(data).length} mouvements, filtrables par muscle, matériel et zone de soin.</small></span><PTIcon name="arrow" size={18}/></button>
        <button className="home-action" onClick={() => go('profile')}><PTIcon name="bench"/><span><strong>Mon matériel</strong><small>{data.owned.length} équipement{data.owned.length > 1 ? 's' : ''} · gilet lesté et disques slide disponibles.</small></span><PTIcon name="arrow" size={18}/></button>
      </div>
    </div></>;
}

function PTPathway({data,update,go,notify}) {
  const p = data.pathway;
  const [minutes,setMinutes] = usePTState(0);
  const [stopping,setStopping] = usePTState(false);
  const [confirm,setConfirm] = usePTState(null);
  const [error,setError] = usePTState('');
  if (!p) return <PTPathwayIntro data={data} update={update} go={go}/>;

  const step = BP.stepById(p.step), status = BP.weekStatus(p), gate = BP.gate(PT, data, p);
  const next = BP.stepById(p.step + 1);
  const launch = key => {
    if (data.draft?.status === 'active' && confirm !== key) { setConfirm(key); return; }
    const plan = BP.sessionPlan(PT, JP, data, p, key, {minutes: minutes || undefined});
    if (plan.error) { setError(plan.error); return; }
    setConfirm(null); setError('');
    update(s => ({...s, draft: plan}));
    go('preview');
  };

  return <><PTPageHead onBack={() => go('today')} eyebrow={`Étape ${step.id} sur ${BP.steps.length}${step.base ? ` · ${step.base}` : ''}`} title={`${step.name}.`}>{step.goal}</PTPageHead>
    <div className="stack-lg">
      <button className="home-action is-featured" onClick={() => go('bilan', 'tests')}><PTIcon name="chart"/><span><strong>Mesurer ma détente et mes tests</strong><small>Saut vertical, RSI, sprint : avec un mur, un mètre ou une vidéo au ralenti.</small></span><PTIcon name="arrow" size={18}/></button>
      <div className="step-track pathway-track">{BP.steps.map(s => <span key={s.id} className={s.id <= p.step ? 'done' : ''}/>)}</div>
      <section className="card stack-sm">
        <div className="topline"><strong>Semaine {status.week}{status.week > step.minWeeks ? ' · consolidation' : ''}</strong><span className="caption">{status.sessions} / {status.needed} séances</span></div>
        <span className="mini-progress"><i style={{transform:`scaleX(${Math.min(1, status.sessions / status.needed)})`}}/></span>
        <p className="fine">Trois séances par semaine{step.days.length === 2 ? ' (deux à cette étape)' : ''}, dans l’ordre que tu veux. Laisse au moins un jour entre deux séances de jambes.</p>
      </section>
      <PTAssessmentSummary data={data} go={go}/>
      <details className="disclosure"><summary>Les règles de cette étape</summary><div><ul className="reason-list">{step.rules.map(r => <li key={r}>{r}</li>)}</ul></div></details>

      <section className="stack">
        <div className="topline"><h2>Cette semaine</h2></div>
        <PTChips value={minutes} onChange={setMinutes} options={[{value:0,label:'Séance complète'},{value:30,label:'30 min'},{value:45,label:'45 min'}]}/>
        {step.days.map(day => {
          const plan = BP.sessionPlan(PT, JP, data, p, day.key, {minutes: minutes || undefined});
          const done = status.done.includes(day.key);
          return <article key={day.key} className={`card stack-sm pathway-day${done ? ' is-done' : ''}`}>
            <div className="exercise-summary"><span className="exercise-number">{day.key}</span><div><h3>{day.name}</h3><p>{plan.error ? 'Indisponible aujourd’hui' : `~${plan.estimatedMinutes} min · ${plan.exercises.length} mouvements`}{done ? ' · faite' : status.next === day.key ? ' · conseillée' : ''}</p></div></div>
            {plan.error ? <p className="fine">{plan.error}</p> : <ul className="dose-list">{plan.exercises.map(e => <li key={e.id}><span>{e.name}</span><small>{ptRoleLabel(e.pathwayRole)} · {ptDoseLabel(e)}</small></li>)}</ul>}
            {confirm === day.key && <div className="notice warning stack-sm"><p>Une séance est en cours. La remplacer effacera ce qui n’a pas été enregistré.</p><PTButton quiet onClick={() => {setConfirm(null); go('session');}}>Reprendre la séance en cours</PTButton></div>}
            {!plan.error && <PTButton primary={!done && status.next === day.key} onClick={() => launch(day.key)}>{confirm === day.key ? 'Remplacer et préparer' : done ? 'Refaire cette séance' : 'Préparer cette séance'}<PTIcon name="arrow" size={18}/></PTButton>}
          </article>;
        })}
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {p.step === BP.steps.length && <PTPathwayLadder data={data} update={update} go={go} notify={notify}/>}

      <section className="stack">
        <h2>{gate.last ? 'Pour boucler le parcours' : `Pour passer à l’étape ${next.id}`}</h2>
        <ul className="criteria-list">{gate.criteria.map(c => <li key={c.id} className={c.ok ? 'is-ok' : ''}>
          <span className="criteria-mark"><PTIcon name={c.ok ? 'check' : 'clock'} size={16}/></span>
          <div><strong>{c.label}</strong><small>{c.detail}</small></div>
          {BP.tests[c.id] && !['pain','ladder'].includes(c.id) && <button className="chip" onClick={() => go('pathway-test', c.id)}>{BP.latest(p, c.id) ? 'Remesurer' : 'Mesurer'}</button>}
        </li>)}</ul>
        <p className="fine">Ces repères d’entraînement ne sont pas des normes médicales. Un kiné peut les remplacer par ses propres tests.</p>
        {gate.ready && !gate.last && <PTButton primary onClick={() => {update(s => ({...s, pathway: BP.advance(s.pathway)})); notify(`Étape ${next.id} débloquée : ${next.name}.`); window.scrollTo(0,0);}}>Passer à l’étape {next.id} · {next.name}<PTIcon name="arrow" size={18}/></PTButton>}
        {gate.ready && gate.last && <p className="notice">Parcours bouclé. Garde deux séances de renforcement par semaine pendant la saison : c’est ce qui évite la blessure suivante.</p>}
        {!gate.ready && <p className="fine">Tu peux rester sur cette étape aussi longtemps que nécessaire : les semaines supplémentaires passent en consolidation.</p>}
      </section>

      <section className="stack"><h3>Gérer le parcours</h3>
        <div className="home-options">
          {p.step > 1 && <button className="home-action" onClick={() => {update(s => ({...s, pathway: BP.stepBack(s.pathway)})); notify('Retour à l’étape précédente. Tes séances et tes tests sont conservés.');}}><PTIcon name="back"/><span><strong>Revenir à l’étape {p.step - 1}</strong><small>Après une douleur ou une coupure.</small></span><PTIcon name="arrow" size={18}/></button>}
          <button className="home-action" onClick={() => go('library')}><PTIcon name="book"/><span><strong>Tous les exercices</strong><small>{PT.allExercises(data).length} mouvements, filtrables par muscle, matériel et zone de soin.</small></span><PTIcon name="arrow" size={18}/></button>
          <button className="home-action" onClick={() => go('player')}><PTIcon name="basket"/><span><strong>Mon profil joueur</strong><small>Poste, douleurs, matériel.</small></span><PTIcon name="arrow" size={18}/></button>
        </div>
        {stopping
          ? <div className="notice warning stack-sm"><p>Arrêter le parcours ? Il est archivé avec tes tests et ton avancement : tu pourras le reprendre à la même étape. Tes séances restent dans l’historique.</p>
              <PTButton danger onClick={() => {update(s => ({...s, pathway:null, pathwayArchive:[...(s.pathwayArchive || []), {...s.pathway, stoppedAt: PT.dateKey()}].slice(-10), draft: s.draft?.source === 'pathway' && s.draft.status !== 'active' ? null : s.draft})); notify('Parcours arrêté et archivé.'); go('today');}}>Oui, arrêter le parcours</PTButton>
              <PTButton quiet onClick={() => setStopping(false)}>Continuer le parcours</PTButton></div>
          : <PTButton danger onClick={() => setStopping(true)}><PTIcon name="close" size={18}/>Arrêter le parcours</PTButton>}
      </section>
    </div></>;
}

function PTPathwayLadder({data,update,go,notify}) {
  const p = data.pathway, level = BP.ladderLevel(p);
  const pendingIndex = p.ladder.findIndex(x => x.nextDay === null);
  const current = BP.ladder.find(r => r.id === level + 1);
  return <section className="stack"><h2>Paliers de jeu</h2>
    <p className="fine">Un palier est validé quand le lendemain est calme. Sinon, on reste au même palier.</p>
    <ol className="step-list">{BP.ladder.map(r => <li key={r.id} className={r.id <= level ? 'is-done' : r.id === level + 1 ? 'is-current' : ''}>
      <span className="step-num">{r.id <= level ? <PTIcon name="check" size={15}/> : r.id}</span><div><strong>{r.label}</strong><small>{r.hint}</small></div></li>)}</ol>
    {pendingIndex >= 0 ? <div className="card stack-sm"><strong>Et le lendemain de « {BP.ladder.find(r => r.id === p.ladder[pendingIndex].rung).label} » ?</strong>
      <PTChoices value={null} options={[{value:'ok',label:'Rien de spécial'},{value:'worse',label:'Une douleur est apparue'}]} onChange={v => {
        update(s => ({...s, pathway: BP.rungFeedback(s.pathway, pendingIndex, v)}));
        if (v === 'worse') { notify('Palier non validé. Signale la zone : les séances s’adapteront.'); go('symptoms'); } else notify('Palier validé.');
      }}/></div>
    : current && <PTButton onClick={() => {update(s => ({...s, pathway: BP.recordRung(s.pathway, current.id)})); notify('Palier noté. Dis-nous demain comment ça va.');}}>J’ai fait : {current.label}</PTButton>}
  </section>;
}

// Saisie d'une mesure, partagée par le parcours et le bilan athlétique.
const ptBlankTest = {left:'', right:'', value:'', best:'', last:''};
function ptTestValues(t, form) {
  const num = v => v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) < 10000;
  if (t.unit === 'check') return {values: t.sides ? {left: form.left === true, right: form.right === true} : {value: form.value === true}};
  if (t.unit === 'rsa') return !num(form.best) || !num(form.last) || Number(form.best) <= 0 ? {error: 'Indique le meilleur et le dernier temps.'} : {values: {best: Number(form.best), last: Number(form.last)}};
  if (t.sides) return !num(form.left) || !num(form.right) ? {error: 'Indique une valeur pour chaque côté.'} : {values: {left: Number(form.left), right: Number(form.right)}};
  return !num(form.value) ? {error: 'Indique une valeur.'} : {values: {value: Number(form.value)}};
}
function PTTestForm({test: t, form, set}) {
  const unit = t.unit === 'check' || t.unit === 'rsa' ? '' : ` (${t.unit})`;
  return <>
    {t.unit === 'check' && <div className="stack-sm">
      {t.sides ? ['left','right'].map(side => <label key={side} className="check-label"><input type="checkbox" checked={form[side] === true} onChange={e => set(side, e.target.checked)}/>{side === 'left' ? 'Jambe gauche' : 'Jambe droite'} : réussi proprement, sans douleur</label>)
        : <label className="check-label"><input type="checkbox" checked={form.value === true} onChange={e => set('value', e.target.checked)}/>Réussi proprement, sans douleur</label>}
    </div>}
    {t.unit === 'rsa' && <div className="form-grid"><PTField label="Meilleur sprint (s)" type="number" step="0.01" inputMode="decimal" value={form.best} onChange={e => set('best', e.target.value)}/><PTField label="Dernier sprint (s)" type="number" step="0.01" inputMode="decimal" value={form.last} onChange={e => set('last', e.target.value)}/></div>}
    {!['check','rsa'].includes(t.unit) && (t.sides
      ? <div className="form-grid"><PTField label={`Gauche${unit}`} type="number" step="0.1" inputMode="decimal" value={form.left} onChange={e => set('left', e.target.value)}/><PTField label={`Droite${unit}`} type="number" step="0.1" inputMode="decimal" value={form.right} onChange={e => set('right', e.target.value)}/></div>
      : <PTField label={`Résultat${unit}`} type="number" step="0.01" inputMode="decimal" value={form.value} onChange={e => set('value', e.target.value)}/>)}
  </>;
}

function PTPathwayTest({data,update,go,notify,id}) {
  const t = BP.tests[id], p = data.pathway;
  const [form,setForm] = usePTState(ptBlankTest);
  const [error,setError] = usePTState('');
  if (!t || !p) return <><PTPageHead onBack={() => go('pathway')} title="Test introuvable."/><PTButton primary onClick={() => go('pathway')}>Revenir au parcours</PTButton></>;
  const history = (p.tests[id] || []).slice().reverse();
  const set = (k,v) => setForm(f => ({...f, [k]: v}));
  const save = () => {
    const {values, error} = ptTestValues(t, form);
    if (error) { setError(error); return; }
    update(s => ({...s, pathway: BP.recordTest(s.pathway, id, values)}));
    const result = BP.evaluate(id, {...values}, BP.recordTest(p, id, values));
    notify(result.ok ? 'Critère validé.' : 'Mesure enregistrée. Pas encore le repère : on continue.');
    go('pathway');
  };
  return <><PTPageHead onBack={() => go('pathway')} eyebrow="Critère de passage" title={`${t.label}.`}>{t.why}</PTPageHead>
    <div className="stack-lg">
      <ol className="instruction-list">{t.how.map(line => <li key={line}>{line}</li>)}</ol>
      {t.target && <p className="notice">Repère : {t.target}.</p>}
      <PTTestForm test={t} form={form} set={set}/>
      {error && <p className="error" role="alert">{error}</p>}
      <PTButton primary onClick={save}>Enregistrer la mesure<PTIcon name="check" size={18}/></PTButton>
      {history.length > 0 && <section className="stack-sm"><h3>Mesures précédentes</h3>
        <ul className="criteria-list">{history.slice(0, 6).map((r,i) => {const ev = BP.evaluate(id, r, {tests:{[id]: (p.tests[id] || []).slice(0, (p.tests[id] || []).length - i)}});
          return <li key={i} className={ev.ok ? 'is-ok' : ''}><span className="criteria-mark"><PTIcon name={ev.ok ? 'check' : 'clock'} size={16}/></span><div><strong>{shortDate(r.date)}</strong><small>{ev.detail}</small></div></li>;})}</ul>
      </section>}
    </div></>;
}
