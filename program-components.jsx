/* Programmes muscu sur plusieurs semaines. Les décisions restent dans PersonalPrograms ; la charge de la semaine dans TrainingLoad.
   Restauré après l'allègement du lot 9, sans la nutrition ni l'ancien programme basket (remplacé par le parcours). */
const PP = window.PersonalPrograms;

const ptProgramWeekLabel = (week, weeks) => `Semaine ${week} sur ${weeks}`;

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

  return <><PTPageHead onBack={() => go('program')} eyebrow="Plusieurs semaines, un cap" title="Créer ma muscu.">
    Choisis un objectif, ta disponibilité réelle et ton matériel. Rien n’est verrouillé : tu peux mettre en pause ou changer.
  </PTPageHead>
  <div className="stack-lg">
    <section className="stack"><h3>Mon objectif</h3>
      <div className="program-families">{PP.families.map(f => <button key={f.id} type="button" className="program-family" aria-pressed={familyId === f.id} onClick={() => setFamilyId(f.id)}>
        <strong>{f.label}</strong><small>{f.summary}</small>
      </button>)}</div>
      {family?.basket && !window.BasketProfile?.complete(data.basketProfile) && <p className="notice">Remplis d’abord <button className="text-button" onClick={() => go('basket-profile')}>Mon jeu</button> : tes faiblesses sur le terrain choisissent l’accent de chaque séance.</p>}
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

  if (!program || program.status === 'archived') return <><PTPageHead onBack={() => go('pathway')} eyebrow="Musculation, à côté du parcours" title="Ma muscu.">
      Un programme sur plusieurs semaines, séparé du parcours. Il ne double pas ce que le parcours travaille et s’efface les jours où tes jambes doivent rester fraîches.
    </PTPageHead>
    <div className="stack-lg">
      <PTButton primary onClick={() => go('program-new')}>Créer un programme<PTIcon name="arrow" size={18}/></PTButton>
      <div className="home-options">
        <button className="home-action" onClick={() => go('basket-profile')}><PTIcon name="basket"/><span><strong>Mon jeu</strong><small>{window.BasketProfile?.complete(data.basketProfile) ? 'Questionnaire rempli : il règle l’accent de la muscu basket.' : 'Forces, faiblesses, club : à remplir avant la muscu basket.'}</small></span><PTIcon name="arrow" size={18}/></button>
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

  // Le lancement passe toujours par le check-in de forme : c'est lui qui fixe la version du jour.
  const launch = dayKey => {
    if (data.draft?.status === 'active' && confirmLaunch !== dayKey) { setConfirmLaunch(dayKey); return; }
    setConfirmLaunch(null);
    setError('');
    go('program-checkin', `${shownWeek}:${dayKey}`);
  };

  const TL = window.TrainingLoad, day = TL ? TL.day(data) : null;
  return <><PTPageHead onBack={() => go('pathway')} eyebrow={family?.label} title="Ma muscu.">
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

      {day && <section className="card stack-sm"><span className="eyebrow">Aujourd’hui, avec le reste de ta semaine</span>
        <strong>{{muscu:'Bon jour pour la muscu.', pathway:'Priorité au parcours aujourd’hui.', recovery:'Jour de récupération.', rest:'Pas de séance aujourd’hui.', session:'Bon jour pour la muscu.'}[day.primary]}</strong>
        {day.notes.length > 0 ? <ul className="reason-list">{day.notes.map((n,i) => <li key={i}>{n}</li>)}</ul> : <p className="fine">Rien au club ni dans l’app ne s’y oppose.</p>}
        {day.protectLegs && <p className="fine">Si tu lances une séance, les mouvements lourds pour les jambes en seront retirés.</p>}
      </section>}

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
          <button className="home-action" onClick={() => go('basket-profile')}><PTIcon name="basket"/><span><strong>Mon jeu</strong><small>Forces, faiblesses, calendrier du club.</small></span><PTIcon name="arrow" size={18}/></button>
        </div>
        {confirmArchive
          ? <div className="notice warning stack"><p>Arrêter ce programme ? Il est archivé : tu pourras le reprendre plus tard, et les séances enregistrées restent dans ton historique.</p>
              <PTButton danger onClick={() => {update(s => ({...s, program:null, programArchive:[...(s.programArchive||[]), PP.archive(s.program)].slice(-20)})); notify('Programme archivé.'); go('program');}}>Oui, arrêter ce programme</PTButton>
              <PTButton quiet onClick={() => setConfirmArchive(false)}>Annuler</PTButton></div>
          : <PTButton danger onClick={() => setConfirmArchive(true)}><PTIcon name="close" size={18}/>Arrêter ce programme</PTButton>}
        <p className="fine">Repères de charge : conventions d’entraînement courantes (pas de jambes lourdes la veille d’un match, 24 h entre deux séances de jambes, objectif de séances par semaine de ton profil). Ce ne sont pas des normes médicales.</p>
      </section>
    </div></>;
}

// Check-in de forme avant chaque séance de programme : la séance s'adapte, elle ne se saute pas.
function PTProgramCheckIn({data,update,go,notify,id}) {
  const program = data.program;
  const [rawWeek,dayKey] = String(id || '').split(':');
  const week = Math.max(1, Math.min(Number(rawWeek) || 1, Number(program?.weeks) || 1));
  const [answers,setAnswers] = usePTState({});
  const [minutes,setMinutes] = usePTState(Number(program?.minutes) || 30);
  const [error,setError] = usePTState('');

  if (!program || program.status === 'archived' || !program.days.includes(dayKey))
    return <><PTPageHead onBack={() => go('program')} title="Séance introuvable."/>
      <PTButton primary onClick={() => go('program')}>Revenir à mon programme</PTButton></>;

  const family = PP.familyById(program.familyId);
  const dayName = family?.days.find(d => d.key === dayKey)?.name || dayKey;
  const answered = PP.READINESS_QUESTIONS.every(q => answers[q.id] !== undefined);
  const level = PP.readinessLevel(answers);
  const check = PP.checkForSession(data, program, {answers, minutes});
  const preview = answered ? PP.sessionPlan(program, week, dayKey, data, check) : null;

  const launch = () => {
    const plan = PP.sessionPlan(program, week, dayKey, data, check);
    if (plan.error) { setError(plan.error); return; }
    // Le check-in du jour vit avec la séance, jamais dans les préférences durables.
    const persisted = Object.assign({}, plan.check);
    delete persisted.readiness;
    update(s => ({...s, checkIn:{...s.checkIn, ...persisted}, draft: plan}));
    go('preview');
  };

  return <><PTPageHead onBack={() => go('program')} eyebrow={`${family?.short || ''} · semaine ${week} · ${dayName}`} title="Comment tu te sens, là ?">
      Trois questions. La séance se cale sur ta forme du jour ; elle ne se juge pas.
    </PTPageHead>
    <div className="stack-lg">
      {PP.READINESS_QUESTIONS.map(q => <section className="stack-sm" key={q.id}>
        <h3>{q.label}</h3>
        <PTChoices columns={3} options={q.options} value={answers[q.id]} onChange={v => setAnswers(a => ({...a, [q.id]: v}))}/>
      </section>)}

      <section className="stack-sm"><h3>Combien de temps tu as devant toi ?</h3>
        <PTChips value={Number(minutes)} options={[10,15,20,30,45,60].map(v => ({value:v, label:`${v} min`}))} onChange={setMinutes}/>
        <p className="fine">La séance ne dépassera ni ce temps, ni la durée prévue au programme.</p>
      </section>

      {answered && <section className="card stack">
        <div className="topline"><strong>{level.label}</strong><span className="caption">~{PP.readinessMinutes(level, program.minutes, minutes)} min</span></div>
        <p className="fine">{level.note}</p>
        {preview && !preview.error && <>
          <p className="caption">{preview.exercises.length} mouvement{preview.exercises.length > 1 ? 's' : ''} · ~{preview.estimatedMinutes} min</p>
          <ul className="reason-list">{preview.exercises.map(e => <li key={e.id}>{e.name} · {ptDoseLabel(e)}</li>)}</ul>
        </>}
        {preview?.error && <p className="error" role="alert">{preview.error}</p>}
      </section>}

      {error && <p className="error" role="alert">{error}</p>}
      <PTButton primary disabled={!answered || !!preview?.error} onClick={launch}>Voir ma séance du jour<PTIcon name="arrow" size={18}/></PTButton>
      {!answered && <p className="fine">Réponds aux trois questions pour voir la séance adaptée.</p>}
      <button className="text-button" onClick={() => {notify('Séance repoussée. Rien n’est perdu : le programme t’attend.'); go('program');}}>Pas aujourd’hui, je reviendrai</button>
      <p className="fine">Un jour creux ne casse pas un programme. Une séance courte enregistrée compte autant qu’une séance complète dans ton suivi.</p>
    </div></>;
}
