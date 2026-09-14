/* Multi-week programs and energy estimates. Decisions stay in PersonalPrograms / PersonalNutrition. */
const PP = window.PersonalPrograms;
const PN = window.PersonalNutrition;

const ptProgramWeekLabel = (week, weeks) => `Semaine ${week} sur ${weeks}`;
const ptDoseLabel = e => e.measure === 'seconds' ? `${e.sets} × ${e.seconds} s`
  : e.measure === 'shots' ? `${e.sets} × ${e.targetMax || e.max} tirs`
  : `${e.sets} × ${e.targetMin === e.targetMax ? e.targetMax : `${e.targetMin}–${e.targetMax}`}${e.unilateral ? ' / côté' : ''}`;

function PTProgramCatalog({data,update,go,notify}) {
  const [familyId,setFamilyId] = usePTState(PP.families[0].id);
  const [weeks,setWeeks] = usePTState(8);
  const [daysPerWeek,setDaysPerWeek] = usePTState(3);
  const [minutes,setMinutes] = usePTState(Number(data.checkIn.minutes) || 30);
  const [equipment,setEquipment] = usePTState([...new Set(['bodyweight', ...data.owned])]);
  const [constraints,setConstraints] = usePTState(data.checkIn.constraints || []);
  const [error,setError] = usePTState('');
  const [replace,setReplace] = usePTState(false);

  const config = {familyId, weeks, daysPerWeek, minutes, equipment, constraints};
  const family = PP.familyById(familyId);
  const fit = PP.compatibility(data, config);
  const preview = fit.ok && !fit.blocked ? (() => {
    const draft = PP.createProgram(data, config);
    return draft.program ? PP.weekPreview(draft.program, 1, data) : null;
  })() : null;

  const create = () => {
    if (data.program && data.program.status !== 'archived' && !replace) { setReplace(true); return; }
    const made = PP.createProgram(data, config);
    if (made.error) { setError(made.error); return; }
    update(s => ({
      ...s,
      program: made.program,
      programArchive: s.program && s.program.id !== made.program.id ? [...(s.programArchive || []), PP.archive(s.program)].slice(-20) : (s.programArchive || [])
    }));
    notify('Programme créé. Tu peux lancer la première séance quand tu veux.');
    go('program');
  };

  return <><PTPageHead onBack={() => go('program')} eyebrow="Plusieurs semaines, un cap" title="Créer un programme.">
    Choisis un objectif, ta disponibilité réelle et ton matériel. Rien n’est verrouillé : tu peux mettre en pause ou changer.
  </PTPageHead>
  <div className="stack-lg">
    <section className="stack"><h3>Mon objectif</h3>
      <div className="program-families">{PP.families.map(f => <button key={f.id} type="button" className="program-family" aria-pressed={familyId === f.id} onClick={() => setFamilyId(f.id)}>
        <strong>{f.label}</strong><small>{f.summary}</small>
      </button>)}</div>
      {family?.id === 'condition' && <p className="fine">Séances de conditionnement d’inspiration générale. Aucune affiliation à une méthode ou une marque déposée.</p>}
    </section>

    <section className="stack"><h3>Ma disponibilité</h3>
      <PTField label="Durée du programme"><select value={weeks} onChange={e => setWeeks(Number(e.target.value))}>{PP.WEEK_CHOICES.map(w => <option key={w} value={w}>{w} semaines</option>)}</select></PTField>
      <PTField label="Séances par semaine"><select value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))}>{PP.DAY_CHOICES.map(d => <option key={d} value={d}>{d} séances</option>)}</select></PTField>
      <PTField label="Temps par séance"><select value={minutes} onChange={e => setMinutes(Number(e.target.value))}>{PP.MINUTE_CHOICES.map(m => <option key={m} value={m}>{m} min</option>)}</select></PTField>
    </section>

    <section className="stack"><h3>Mon matériel</h3>
      <PTEquipment owned={data.owned} selected={equipment} onChange={setEquipment}/>
      <details className="disclosure"><summary>Mes contraintes</summary><div>
        <PTChips multi options={[{value:'quiet',label:'Pas de bruit'},{value:'no-floor',label:'Pas au sol'},{value:'no-impact',label:'Sans saut'}]} value={constraints} onChange={setConstraints}/>
      </div></details>
    </section>

    <section className="stack"><h3>Compatibilité</h3>
      {fit.blocked
        ? <p className="error" role="alert">{fit.issues[0]}</p>
        : <>
          <p className="fine">{fit.covered} créneaux sur {fit.total} trouvent un mouvement compatible avec ce matériel et ces contraintes.</p>
          {fit.issues.map((issue, i) => <p className="notice" key={i}>{issue}</p>)}
          {!fit.ok && <p className="error" role="alert">Trop peu de mouvements disponibles pour construire ce programme. Change de matériel, de contraintes ou d’objectif.</p>}
        </>}
    </section>

    {preview && <details className="disclosure"><summary>Aperçu de la première semaine</summary><div className="stack">
      {preview.map(day => <div className="card stack-sm" key={day.dayKey}>
        <strong>{day.name}</strong>
        {day.error ? <p className="fine">{day.error}</p> : <>
          <p className="caption">~{day.minutes} min · {day.exercises.length} mouvements</p>
          <ul className="reason-list">{day.exercises.map(e => <li key={e.id}>{e.name} · {ptDoseLabel(e)}</li>)}</ul>
        </>}
      </div>)}
      <p className="fine">Les mouvements repères restent les mêmes pendant tout le programme pour que tes charges soient comparables. Les accessoires tournent d’une semaine à l’autre.</p>
    </div></details>}

    {error && <p className="error" role="alert">{error}</p>}
    {replace && <div className="notice warning stack">
      <p>Un programme est déjà en cours. Le créer maintenant archivera l’actuel — ses séances enregistrées restent dans ton historique.</p>
      <PTButton onClick={create}>Archiver et créer le nouveau</PTButton>
      <PTButton quiet onClick={() => setReplace(false)}>Annuler</PTButton>
    </div>}
    {!replace && <PTButton primary disabled={!fit.ok || fit.blocked} onClick={create}>Créer ce programme</PTButton>}
    <p className="fine">Un programme est un cadre, pas une obligation. Aucune charge n’augmente parce qu’une semaine est passée : seules tes séries réellement enregistrées comptent.</p>
  </div></>;
}

function PTProgramHome({data,update,go,notify}) {
  const program = data.program;
  const [confirmLaunch,setConfirmLaunch] = usePTState(null);
  const [confirmArchive,setConfirmArchive] = usePTState(false);
  const [week,setWeek] = usePTState(null);
  const [error,setError] = usePTState('');

  if (!program || program.status === 'archived') return <><PTPageHead onBack={() => go('today')} eyebrow="Plusieurs semaines, un cap" title="Mes programmes.">
      Les séances libres restent disponibles. Un programme ajoute un fil conducteur sur plusieurs semaines.
    </PTPageHead>
    <div className="stack-lg">
      <PTButton primary onClick={() => go('program-new')}>Créer un programme<PTIcon name="arrow" size={18}/></PTButton>
      <div className="home-options">
        <button className="home-action" onClick={() => go('program-legacy')}><PTIcon name="basket"/><span><strong>Programme basket d’origine</strong><small>Tes trois blocs conservés, inchangés.</small></span><PTIcon name="arrow" size={18}/></button>
        <button className="home-action" onClick={() => go('nutrition')}><PTIcon name="chart"/><span><strong>Mes repères caloriques</strong><small>Estimation indicative selon ton profil.</small></span><PTIcon name="arrow" size={18}/></button>
      </div>
      {!!(data.programArchive || []).length && <details className="disclosure"><summary>Programmes archivés</summary><div className="stack">
        {data.programArchive.map(p => {const f = PP.familyById(p.familyId), pr = PP.progressOf(p);
          return <div className="topline" key={p.id}><span className="fine">{f?.label || p.familyId} · {pr.done}/{pr.total} séances</span>
            <button className="text-button" onClick={() => {update(s => ({...s, program:{...PP.resume(p)}, programArchive:(s.programArchive||[]).filter(x => x.id !== p.id)})); notify('Programme repris là où il s’était arrêté.');}}>Reprendre</button></div>;
        })}
      </div></details>}
    </div></>;

  const family = PP.familyById(program.familyId);
  const progress = PP.progressOf(program);
  const shownWeek = week || progress.currentWeek;
  const preview = PP.weekPreview(program, shownWeek, data);
  const paused = program.status === 'paused';

  const launch = dayKey => {
    if (data.draft?.status === 'active' && confirmLaunch !== dayKey) { setConfirmLaunch(dayKey); return; }
    const plan = PP.sessionPlan(program, shownWeek, dayKey, data);
    if (plan.error) { setError(plan.error); return; }
    update(s => ({...s, checkIn:{...s.checkIn, ...plan.check}, draft: plan}));
    setConfirmLaunch(null);
    go('preview');
  };

  return <><PTPageHead onBack={() => go('today')} eyebrow={family?.label} title="Mon programme.">
      {family?.summary}
    </PTPageHead>
    <div className="stack-lg">
      <section className="card stack">
        <div className="topline"><strong>{ptProgramWeekLabel(progress.currentWeek, program.weeks)}</strong><span className="caption">{progress.phase.name}</span></div>
        <span className="mini-progress"><i style={{transform:`scaleX(${progress.ratio})`}}/></span>
        <p className="fine">{progress.done} séance{progress.done > 1 ? 's' : ''} enregistrée{progress.done > 1 ? 's' : ''} sur {progress.total} prévues. {progress.phase.note}</p>
        {progress.finished && <p className="notice">Programme terminé. Tu peux le relancer, en créer un autre, ou revenir aux séances libres.</p>}
        {paused && <p className="notice">Programme en pause. Aucune séance n’est comptée tant qu’il est en pause.</p>}
      </section>

      {program.notes?.length > 0 && <details className="disclosure"><summary>Compatibilité de ce programme</summary><div>
        <ul className="reason-list">{program.notes.map((n,i) => <li key={i}>{n}</li>)}</ul>
      </div></details>}

      <section className="stack">
        <div className="topline"><h3>Les séances de la semaine</h3>
          <div className="week-switch">
            <button className="icon-button" aria-label="Semaine précédente" disabled={shownWeek <= 1} onClick={() => setWeek(Math.max(1, shownWeek - 1))}><PTIcon name="back" size={15}/></button>
            <span>S{shownWeek}</span>
            <button className="icon-button" aria-label="Semaine suivante" disabled={shownWeek >= program.weeks} onClick={() => setWeek(Math.min(program.weeks, shownWeek + 1))}><PTIcon name="arrow" size={15}/></button>
          </div>
        </div>
        <p className="fine">Consulter une autre semaine ne valide rien et n’augmente aucune charge.</p>
        {preview.map(day => {
          const entry = (program.completed || []).find(c => c.week === shownWeek && c.day === day.dayKey);
          return <div className={`card stack-sm${entry ? ' is-done' : ''}`} key={day.dayKey}>
            <div className="topline"><strong>{day.name}</strong>{entry && <span className="caption">{entry.partial ? 'Partielle' : 'Faite'} · {shortDate(entry.date)}</span>}</div>
            {day.error ? <p className="fine">{day.error}</p> : <>
              <p className="caption">~{day.minutes} min · {day.exercises.length} mouvements</p>
              <ul className="reason-list">{day.exercises.map(e => <li key={e.id}>{e.name} · {ptDoseLabel(e)}</li>)}</ul>
              {!!day.changes?.length && <p className="fine">{day.changes.join(' ')}</p>}
              {confirmLaunch === day.dayKey
                ? <div className="notice warning stack"><p>Une séance est déjà en cours. La remplacer effacera ce qui n’a pas été enregistré.</p>
                    <PTButton onClick={() => launch(day.dayKey)}>Remplacer la séance en cours</PTButton>
                    <PTButton quiet onClick={() => {setConfirmLaunch(null); go('session');}}>Reprendre la séance en cours</PTButton></div>
                : <PTButton primary disabled={paused} onClick={() => launch(day.dayKey)}>{entry ? 'Refaire cette séance' : 'Lancer cette séance'}<PTIcon name="arrow" size={18}/></PTButton>}
              {entry && <button className="text-button" onClick={() => {update(s => ({...s, program: {...s.program, completed: s.program.completed.filter(c => !(c.week === shownWeek && c.day === day.dayKey))}})); notify('Séance décochée dans le programme. Ton historique n’est pas modifié.');}}>Retirer du suivi</button>}
            </>}
          </div>;
        })}
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      <section className="stack"><h3>Gérer ce programme</h3>
        <div className="home-options">
          {paused
            ? <button className="home-action" onClick={() => {update(s => ({...s, program: PP.resume(s.program)})); notify('Programme repris.');}}><PTIcon name="play"/><span><strong>Reprendre</strong><small>Repartir de la semaine {progress.currentWeek}.</small></span><PTIcon name="arrow" size={18}/></button>
            : <button className="home-action" onClick={() => {update(s => ({...s, program: PP.pause(s.program)})); notify('Programme mis en pause. Les séances libres restent disponibles.');}}><PTIcon name="pause"/><span><strong>Mettre en pause</strong><small>Sans perdre l’avancement.</small></span><PTIcon name="arrow" size={18}/></button>}
          <button className="home-action" onClick={() => go('program-new')}><PTIcon name="shuffle"/><span><strong>Changer de programme</strong><small>L’actuel sera archivé, pas supprimé.</small></span><PTIcon name="arrow" size={18}/></button>
          <button className="home-action" onClick={() => go('program-legacy')}><PTIcon name="basket"/><span><strong>Programme basket d’origine</strong><small>Conservé à part, inchangé.</small></span><PTIcon name="arrow" size={18}/></button>
          <button className="home-action" onClick={() => go('nutrition')}><PTIcon name="chart"/><span><strong>Mes repères caloriques</strong><small>Estimation indicative, jamais une prescription.</small></span><PTIcon name="arrow" size={18}/></button>
        </div>
        {confirmArchive
          ? <div className="notice warning stack"><p>Archiver ce programme ? Il restera consultable et reprenable ; les séances enregistrées restent dans ton historique.</p>
              <PTButton danger onClick={() => {update(s => ({...s, program:null, programArchive:[...(s.programArchive||[]), PP.archive(s.program)].slice(-20)})); notify('Programme archivé.'); go('program');}}>Confirmer l’archivage</PTButton>
              <PTButton quiet onClick={() => setConfirmArchive(false)}>Annuler</PTButton></div>
          : <PTButton quiet onClick={() => setConfirmArchive(true)}>Archiver ce programme</PTButton>}
      </section>
    </div></>;
}

function PTNutrition({data,update,go,notify}) {
  const stored = data.nutrition || PN.initialNutrition();
  const [form,setForm] = usePTState(stored);
  const [error,setError] = usePTState('');
  const set = (key,value) => setForm(f => ({...f, [key]: value}));
  const input = PN.fromState({...data, nutrition: form});
  const result = PN.estimate(input);
  const horizon = result.ok ? PN.horizon(result, data.profile.weight, form.targetWeight) : null;
  const weightSeries = data.measurements.filter(m => PT.bounded(m.weight,1,350));

  const save = () => {
    try { const clean = PN.validateNutrition(form); update(s => ({...s, nutrition: clean})); setError(''); notify('Repères enregistrés. Ce sont des estimations, pas des consignes.'); }
    catch (e) { setError(e.message); }
  };

  return <><PTPageHead onBack={() => go('program')} eyebrow="Des ordres de grandeur, pas une consigne" title="Mes repères caloriques.">
      Une estimation calculée à partir de ce que tu renseignes. Elle ne remplace ni un médecin ni un diététicien.
    </PTPageHead>
    <div className="stack-lg">
      <p className="notice">{PN.disclaimer}</p>

      <section className="card stack"><h3>Ce que le calcul utilise</h3>
        <div className="form-grid">
          <PTField label="Âge" type="number" min="18" max="100" value={data.profile.age} readOnly disabled/>
          <PTField label="Taille (cm)" type="number" value={data.profile.height} readOnly disabled/>
          <PTField label="Poids actuel (kg)" type="number" value={data.profile.weight} readOnly disabled/>
        </div>
        <p className="fine">Ces trois valeurs viennent de ton profil. <button className="text-button" onClick={() => go('profile')}>Les modifier dans mon profil</button></p>
        <PTField label="Formule de calcul" hint="Paramètre physiologique de la formule Mifflin–St Jeor. Il n’est jamais déduit de ton prénom.">
          <select value={form.bodyType} onChange={e => set('bodyType', e.target.value)}>
            <option value="">À choisir</option>
            {PN.bodyTypes.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </PTField>
        <PTField label="Mon activité hors séances">
          <select value={form.activity} onChange={e => set('activity', e.target.value)}>
            <option value="">À choisir</option>
            {PN.activityLevels.map(a => <option key={a.id} value={a.id}>{a.label} — {a.hint}</option>)}
          </select>
        </PTField>
        <PTField label="Mon objectif">
          <select value={form.goal} onChange={e => set('goal', e.target.value)}>
            <option value="">À choisir</option>
            {PN.goals.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </PTField>
        <div className="form-grid">
          <PTField label="Séances par semaine" type="number" min="0" max="14" value={form.weeklySessions} onChange={e => set('weeklySessions', e.target.value)}/>
          <PTField label="Minutes par séance" type="number" min="0" max="300" value={form.minutesPerSession} onChange={e => set('minutesPerSession', e.target.value)}/>
        </div>
        <PTField label="Poids repère visé (kg, facultatif)" type="number" min="30" max="350" step="0.1" value={form.targetWeight} onChange={e => set('targetWeight', e.target.value)}/>
        <label className="check-label"><input type="checkbox" checked={!!form.pregnancy} onChange={e => set('pregnancy', e.target.checked)}/>Je suis enceinte ou j’allaite.</label>
        <label className="check-label"><input type="checkbox" checked={!!form.medicalFollowUp} onChange={e => set('medicalFollowUp', e.target.checked)}/>J’ai un suivi médical ou un trouble du comportement alimentaire.</label>
        {error && <p className="error" role="alert">{error}</p>}
        <PTButton primary onClick={save}>Enregistrer ces repères</PTButton>
      </section>

      <section className="card stack"><h3>L’estimation</h3>
        {!result.ok
          ? <p className={result.blocks?.length ? 'error' : 'fine'} role={result.blocks?.length ? 'alert' : undefined}>{result.text}</p>
          : <>
            <div className="stats-row">
              <div className="stat"><strong>{result.resting}</strong><small>kcal au repos</small></div>
              <div className="stat"><strong>{result.total}</strong><small>kcal dépensées / jour</small></div>
              <div className="stat"><strong>{result.target}</strong><small>kcal à manger</small></div>
            </div>
            <p className="fine">Dépense estimée à environ ± {result.uncertainty} kcal près. « Dépensées » inclut ton activité quotidienne et tes séances ; « à manger » est la cible pour {result.goalLabel.toLowerCase()}.</p>
            <p className="fine">{result.goalNote}</p>
            {result.raised && <p className="notice">La cible a été relevée pour ne pas passer sous ta dépense au repos.</p>}
            <p className="fine">Repère de protéines : environ {result.proteinGrams} g par jour. Le reste des apports se répartit selon tes habitudes.</p>
            {result.weeklyChangeKg !== 0 && <p className="fine">Évolution estimée : {result.weeklyChangeKg > 0 ? '+' : ''}{result.weeklyChangeKg} kg par semaine, si l’apport et l’activité restent stables.</p>}
            {horizon && <p className="fine">{horizon.text}</p>}
            {result.notes?.map((n,i) => <p className="notice" key={i}>{n}</p>)}
            <details className="disclosure"><summary>Les hypothèses du calcul</summary><div>
              <ul className="reason-list">{result.assumptions.map((a,i) => <li key={i}>{a}</li>)}</ul>
              <p className="fine">Ces chiffres sont des moyennes de population. Ta dépense réelle peut s’en écarter nettement. La bonne mesure reste l’évolution de ton poids sur plusieurs semaines.</p>
            </div></details>
          </>}
      </section>

      <section className="card stack"><h3>Mon poids dans le temps</h3>
        {weightSeries.length > 1
          ? <PTWeightPlot values={weightSeries}/>
          : <p className="fine">Ajoute au moins deux pesées pour voir une tendance.</p>}
        <p className="fine">Saisis tes pesées depuis <button className="text-button" onClick={() => go('profile')}>mon profil</button>, section « Mes mesures au fil du temps ». Observe la tendance sur plusieurs semaines, pas une pesée isolée.</p>
      </section>
    </div></>;
}
