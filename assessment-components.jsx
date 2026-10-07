/* Bilan athlétique : ressenti, tests terrain facultatifs, résultat et ce qu'il change dans le parcours. Réutilise les composants de personal-app.jsx et pathway-components.jsx. */
const AP = window.AthleticProfile;
const apLevelClass = level => level === null ? 'is-unknown' : ['is-low','is-mid','is-high'][level];
// Étiquette affichée dans l'aperçu de séance pour le bloc kiné et le créneau du bilan.
const ptRoleTag = e => e.pathwayRole === 'soin' ? (e.carePhase === 'calm' ? 'Soin · calmer' : 'Soin · renforcer') : e.pathwayRole === 'kiné' || e.role === 'rehab' || e.role === 'kine' ? 'Kiné' : e.pathwayRole === 'point faible' ? 'Point faible' : e.pathwayRole === 'priorité' ? 'Priorité du bilan' : null;
const apFresh = a => !!(a && a.date) && PT.dayDiff(PT.dateKey(), a.date) <= 28;

function PTAssessment({data,update,go,notify,id}) {
  // bilan/tests ouvre directement les tests terrain (détente, RSI, sprint…), sans repasser par le questionnaire.
  const [step,setStep] = usePTState(id === 'tests' ? 1 : 0);
  const [draft,setDraft] = usePTState(() => AP.validateAthletic(data.athletic) || AP.create());
  // Chaque réponse et chaque mesure est gardée tout de suite : rien n'est perdu si le bilan est interrompu.
  const keep = next => { setDraft(next); update(s => ({...s, athletic: next})); };
  const answer = (id, value) => keep({...draft, answers: {...draft.answers, [id]: value}});
  const steps = [
    {title:'Ton ressenti.', intro:'Dix questions sur ton corps aujourd’hui, comparé à avant ta pause. Pas de bonne réponse : c’est ce qui oriente ton programme.', valid:AP.answered(draft)},
    {title:'Tes tests.', intro:'Facultatifs : un mur, un mètre et ton téléphone suffisent. Chaque mesure rend le bilan plus précis. Tu peux les faire maintenant ou plus tard.', valid:true},
    {title:'Ton bilan.', intro:'Tes qualités, tes priorités et ce qu’elles changent dans tes séances.', valid:true}
  ];
  const next = () => { setStep(step + 1); window.scrollTo(0, 0); };
  return <div>
    <PTPageHead eyebrow="Bilan physique" title={steps[step].title} onBack={step === 0 ? () => go(data.pathway ? 'pathway' : 'today') : () => setStep(step - 1)}>{steps[step].intro}</PTPageHead>
    <div className="step-caption"><span>Ton état physique</span><span>{step + 1} / {steps.length}</span></div>
    <div className="step-track">{steps.map((_, i) => <span className={i <= step ? 'done' : ''} key={i}/>)}</div>
    <div className="stack-lg">
      {step === 0 && AP.questions.map(q => <section key={q.id} className="stack-sm">
        <h3>{q.label}{q.optional ? <small className="caption"> · facultatif</small> : null}</h3>
        {q.multi
          ? <PTChips multi value={draft.answers[q.id] || []} onChange={v => answer(q.id, v)} options={q.options.map(([value,label]) => ({value, label}))}/>
          : <PTChoices value={draft.answers[q.id]} onChange={v => answer(q.id, v)} options={q.options.map(([value,label]) => ({value, label}))}/>}
      </section>)}
      {step === 1 && <PTAssessmentTests data={data} draft={draft} keep={keep} open={id === 'tests' ? 'jump' : null}/>}
      {step === 2 && <PTAssessmentResult data={data} draft={draft} update={update} go={go} notify={notify}/>}
      {step < 2 && <div className="button-row">
        {!steps[step].valid && <p className="fine">Réponds à chaque question pour continuer.</p>}
        <PTButton primary disabled={!steps[step].valid} onClick={next}>{step === 1 ? 'Voir mon bilan' : 'Continuer'}<PTIcon name="arrow" size={18}/></PTButton>
      </div>}
    </div>
  </div>;
}

function PTAssessmentTests({data,draft,keep,open}) {
  const groups = AP.testGroups(data);
  const hidden = groups.some(g => g.tests.some(t => t.hidden));
  return <div className="stack">
    {hidden && <p className="notice warning">Une douleur des jambes est signalée : les sauts, les sprints et les navettes sont masqués. On les fera quand elle sera calmée.</p>}
    <p className="fine">Échauffe-toi 5 minutes avant les sauts et les sprints. Arrête un test qui réveille une douleur.</p>
    {groups.map(g => {
      const visible = g.tests.filter(t => !t.hidden);
      if (!visible.length) return null;
      const measured = visible.filter(t => AP.latest(draft, t.id)).length;
      return <details key={g.id} className="disclosure test-group" open={g.id === open || undefined}>
        <summary>{g.label} · {measured} / {visible.length}</summary>
        <div className="stack">{visible.map(t => <PTAssessmentTest key={t.id} test={t} draft={draft} keep={keep}/>)}</div>
      </details>;
    })}
  </div>;
}

function PTAssessmentTest({test:t,draft,keep}) {
  const [form,setForm] = usePTState(ptBlankTest);
  const [error,setError] = usePTState('');
  const last = AP.latest(draft, t.id);
  const result = last && AP.evaluate(t.id, last, draft.tests[t.id]);
  const set = (k,v) => setForm(f => ({...f, [k]: v}));
  const save = () => {
    const {values, error} = ptTestValues(t, form);
    if (error) { setError(error); return; }
    keep(AP.recordTest(draft, t.id, values));
    setForm(ptBlankTest); setError('');
  };
  return <article className="test-card">
    <div className="topline"><h3>{t.label}</h3>{result && <span className={`caption${result.ok ? ' is-ok' : ''}`}>{result.detail}</span>}</div>
    <p className="fine">{t.why}</p>
    <ol className="instruction-list">{t.how.map(line => <li key={line}>{line}</li>)}</ol>
    {t.target && <p className="fine">Repère : {t.target}.</p>}
    {(t.video||t.id==='sprint10')&&typeof PTVideoMeasure==='function'&&<details className="disclosure"><summary>Mesurer avec une vidéo au ralenti</summary><PTVideoMeasure mode={t.video||'sprint'} onResult={value=>{keep(AP.recordTest(draft,t.id,{value,method:'video'}));setError('');}}/></details>}
    <PTTestForm test={t} form={form} set={set}/>
    {error && <p className="error" role="alert">{error}</p>}
    <PTButton onClick={save}>{last ? 'Remesurer' : 'Enregistrer'}<PTIcon name="check" size={18}/></PTButton>
  </article>;
}

function PTAssessmentResult({data,draft,update,go,notify}) {
  const player = data.player || {};
  const res = AP.assess(draft), targets = AP.targets(draft, player);
  const preview = {...data, athletic: draft};
  const start = AP.recommendedStart(preview);
  const pathway = data.pathway || BP.create({startStep: start.step});
  const step = BP.stepById(pathway.step);
  const days = step.days.map(day => {
    const plan = BP.sessionPlan(PT, JP, preview, pathway, day.key);
    return {day, items: plan.error ? [] : plan.exercises.filter(e => ptRoleTag(e))};
  });
  const tracked = ['vertical','broad','sprint5','sprint10'].map(id => ({id, t: AP.allTests()[id], r: AP.latest(draft, id), before: AP.previousValue(draft, id)})).filter(x => x.r);
  const apply = () => {
    const done = AP.finalize(draft);
    update(s => ({...s, athletic: done, pathway: AP.seedPathwayTests(s.pathway || BP.create({startStep: start.step}), done)}));
    notify(data.pathway ? 'Bilan enregistré : tes séances ciblent maintenant tes points faibles.' : `Bilan enregistré : parcours lancé à l’étape ${start.step}.`);
    go('pathway');
  };
  const saveOnly = () => { update(s => ({...s, athletic: AP.finalize(draft)})); notify('Bilan enregistré.'); go('today'); };
  return <>
    <section className="stack-sm"><h2>Tes qualités</h2>
      <ul className="quality-list">{Object.values(res.qualities).map(q => <li key={q.id} className={apLevelClass(q.level)}>
        <div><strong>{q.label}</strong><small>{q.levelLabel}{q.failed.length ? ` · ${q.failed.map(f => f.label.toLowerCase()).join(', ')}` : ''}</small></div>
        <span className="quality-bar" aria-hidden="true"><i/><i/><i/></span>
      </li>)}</ul>
      {res.asymmetries.length > 0 && <p className="notice warning">Écart entre tes deux jambes : {res.asymmetries.map(a => `${a.label.toLowerCase()} (côté ${a.weak === 'left' ? 'gauche' : 'droit'} en retrait${a.gap ? `, ${a.gap} %` : ''})`).join(' · ')}. Le travail sur une jambe commencera par ce côté.</p>}
    </section>
    <section className="stack-sm"><h2>Tes priorités</h2>
      <ol className="step-list">{targets.map((t, i) => <li key={t.id} className={i === 0 ? 'is-current' : ''}><span className="step-num">{i + 1}</span><div><strong>{t.label}</strong><small>{t.why}</small></div></li>)}</ol>
    </section>
    {tracked.length > 0 && <section className="stack-sm"><h2>Tes références</h2>
      <ul className="criteria-list">{tracked.map(x => <li key={x.id} className="is-ok"><span className="criteria-mark"><PTIcon name="chart" size={16}/></span><div><strong>{x.t.label}</strong><small>{x.r.value} {x.t.unit}{x.before ? ` · avant : ${x.before.values[x.id]} ${x.t.unit} (${shortDate(x.before.date)})` : ' · première mesure'}</small></div></li>)}</ul>
      <p className="fine">Pas de norme pour ces tests : tu te compares à toi-même, bilan après bilan.</p>
    </section>}
    <section className="stack-sm"><h2>Ce qui change dans ton programme</h2>
      <p className="fine">{data.pathway ? `Ton parcours est à l’étape ${pathway.step} · ${step.name}. ${start.step < pathway.step ? `Le bilan conseille l’étape ${start.step} : ${start.reason} Tu peux revenir en arrière depuis le parcours.` : 'Tes séances gardent leur étape et gagnent le travail ci-dessous.'}` : `Étape conseillée : ${start.step} · ${step.name}. ${start.reason}`}</p>
      {days.map(({day, items}) => items.length > 0 && <article key={day.key} className="card stack-sm">
        <div className="exercise-summary"><span className="exercise-number">{day.key}</span><div><h3>{day.name}</h3></div></div>
        <ul className="dose-list">{items.map(e => <li key={e.id}><span>{e.name}</span><small>{ptRoleTag(e)} · {ptDoseLabel(e)}</small></li>)}</ul>
      </article>)}
      <p className="fine">Le bloc kiné ouvre chaque séance : ta zone douloureuse d’abord, puis la mobilité qui te manque et les tendons que la séance sollicite. Il ne remplace pas l’avis d’un kiné.</p>
    </section>
    <p className="fine">Ces repères d’entraînement ne sont pas un diagnostic. Refais ton bilan dans 4 semaines pour mesurer tes progrès.</p>
    <div className="stack-sm">
      <PTButton primary onClick={apply}>{data.pathway ? 'Appliquer à mon parcours' : `Lancer le parcours à l’étape ${start.step}`}<PTIcon name="arrow" size={18}/></PTButton>
      <PTButton quiet onClick={saveOnly}>Enregistrer sans toucher au parcours</PTButton>
    </div>
  </>;
}

// Rappel compact des points faibles, sur l'écran du parcours.
function PTAssessmentSummary({data,go}) {
  const a = data.athletic;
  if (!a || !a.date) return <button className="home-action" onClick={() => go('bilan')}><PTIcon name="chart"/><span><strong>Faire mon bilan physique</strong><small>10 questions et des tests facultatifs : tes séances cibleront tes points faibles.</small></span><PTIcon name="arrow" size={18}/></button>;
  const targets = AP.targets(a, data.player || {});
  return <section className="card stack-sm">
    <div className="topline"><strong>Tes priorités du bilan</strong><span className="caption">{shortDate(a.date)}</span></div>
    <p className="fine">{targets.map(t => t.label).join(' · ')}</p>
    <PTButton quiet onClick={() => go('bilan')}>{apFresh(a) ? 'Revoir mon bilan' : 'Refaire mon bilan (4 semaines passées)'}<PTIcon name="arrow" size={18}/></PTButton>
  </section>;
}
