/* Action mode reuses the existing prescriptions, validation, history and safety rules. */
function PTSetSheet({exercise,row,onChange,onSave,onClose,error}) {
  const dialog=usePTRef(null);
  usePTEffect(()=>{const el=dialog.current;el.showModal();return()=>el.close();},[]);
  return <dialog className="set-sheet" ref={dialog} onCancel={e=>{e.preventDefault();onClose();}}>
    <div className="sheet-handle"/>
    <div className="topline"><div><div className="eyebrow">Ta série, en un geste</div><h2>Ce que tu as fait.</h2></div><button className="icon-button" aria-label="Fermer la saisie" onClick={onClose}><PTIcon name="close"/></button></div>
    <PTRowInputs exercise={exercise} row={row} onChange={onChange}/>
    {error&&<p className="error" role="alert">{error}</p>}
    <PTButton primary onClick={onSave}><PTIcon name="check" size={20}/>Valider cette série</PTButton>
  </dialog>;
}

function PTSession({data,update,go,notify}) {
  const draft=data.draft;
  const [tick,setTick]=usePTState(Date.now()),[logging,setLogging]=usePTState(false),[error,setError]=usePTState('');
  const [finishing,setFinishing]=usePTState(!!draft?.reviewing),[effort,setEffort]=usePTState(''),[liked,setLiked]=usePTState(null),[notes,setNotes]=usePTState(''),[abandon,setAbandon]=usePTState(false);
  const wake=usePTRef(null),fired=usePTRef(null),saved=usePTRef(false);
  const running=!!(draft?.status==='active'&&!finishing&&(draft.clockStarted||draft.stageStarted||draft.timer?.endAt||draft.blockTimer?.endAt));
  const anchor=usePTRef(0);anchor.current=draft?.timer?.endAt||draft?.blockTimer?.endAt||draft?.stageStarted||draft?.clockStarted||0;
  // Timestamps remain the source of truth; one render per second, aligned on the active timer's boundaries, and none while paused.
  usePTEffect(()=>{
    if(!running)return;
    let id;const loop=()=>{const now=Date.now();setTick(now);id=setTimeout(loop,((anchor.current-now)%1000+1000)%1000+15);};
    const resume=()=>{if(document.visibilityState==='visible'){clearTimeout(id);loop();}};
    loop();document.addEventListener('visibilitychange',resume);
    return()=>{clearTimeout(id);document.removeEventListener('visibilitychange',resume);};
  },[running]);
  // Resume drafts created by the earlier interface without resetting the total clock.
  usePTEffect(()=>{if(draft?.status==='active'&&draft.clockStarted&&!draft.stageStarted&&!draft.reviewing){update(s=>({...s,draft:{...s.draft,stageElapsed:s.draft.stageElapsed||0,stageStarted:Date.now(),timer:s.draft.timer||(!s.draft.warmupDone?{id:PT.uid(),endAt:Date.now()+s.draft.warmupSeconds*1000,remaining:s.draft.warmupSeconds,duration:s.draft.warmupSeconds,kind:'warmup',label:'Échauffement'}:null)}}));}},[draft?.id,draft?.clockStarted]);
  usePTEffect(()=>{
    let cancelled=false;
    const acquire=async()=>{if(document.visibilityState==='visible'&&navigator.wakeLock&&!wake.current){try{const lock=await navigator.wakeLock.request('screen');if(cancelled)lock.release();else {wake.current=lock;lock.addEventListener('release',()=>{wake.current=null;});}}catch(e){}}};
    acquire();document.addEventListener('visibilitychange',acquire);
    return()=>{cancelled=true;document.removeEventListener('visibilitychange',acquire);wake.current?.release().catch(()=>{});};
  },[]);
  const remaining=timer=>timer?(timer.endAt?Math.max(0,Math.min(timer.remaining??Infinity,Math.ceil((timer.endAt-tick)/1000))):timer.remaining):0;
  const timerLeft=remaining(draft?.timer);
  usePTEffect(()=>{if(draft?.timer?.endAt&&timerLeft===0&&fired.current!==draft.timer.id){fired.current=draft.timer.id;ptBeep();}},[timerLeft,draft?.timer?.id]);
  if(!draft||draft.status!=='active')return <><PTPageHead title="Prêt à bouger ?"/><PTButton primary onClick={()=>go('today')}>Revenir à aujourd’hui</PTButton></>;
  const setDraft=fn=>update(s=>({...s,draft:s.draft?fn(s.draft):null}));
  const steps=PT.schedule(draft.exercises,draft.format),cursor=Math.min(draft.cursor||0,Math.max(0,steps.length-1)),step=steps[cursor];
  const exercise=draft.exercises.find(e=>e.id===step?.id),row=exercise?draft.entries[exercise.id]?.[step.set]:null;
  const completed=Object.values(draft.entries).flat().filter(r=>r.done&&!r.pain).length,total=Object.values(draft.entries).flat().length;
  const elapsed=Math.max(0,draft.elapsedBase+(draft.clockStarted?Math.max(0,tick-draft.clockStarted)/1000:0));
  const stageElapsed=Math.max(0,(draft.stageElapsed||0)+(draft.stageStarted?Math.max(0,tick-draft.stageStarted)/1000:0));
  const blocked=PT.safety(data).blocked,permitted=exercise&&PT.allowed(exercise,data,draft.check);
  const phase=!draft.warmupDone?'warmup':draft.timer?.kind==='rest'?'rest':'work';
  const paused=!draft.clockStarted,exerciseIndex=draft.exercises.findIndex(e=>e.id===exercise?.id);
  const makeTimer=(seconds,label,kind)=>({id:PT.uid(),endAt:Date.now()+seconds*1000,remaining:seconds,duration:seconds,label,kind});
  const freeze=t=>t?{...t,remaining:t.endAt?Math.max(0,Math.ceil((t.endAt-Date.now())/1000)):t.remaining,endAt:null}:null;
  const thaw=t=>t?{...t,endAt:Date.now()+t.remaining*1000}:null;
  const updateRow=r=>setDraft(d=>({...d,entries:{...d.entries,[exercise.id]:d.entries[exercise.id].map((old,i)=>i===step.set?r:old)}}));
  const beginWork=()=>{
    if(blocked||!permitted){go('symptoms');return;}
    setDraft(d=>({...d,warmupDone:true,clockStarted:d.clockStarted||Date.now(),stageElapsed:0,stageStarted:Date.now(),
      timer:exercise.measure==='seconds'?makeTimer(exercise.seconds,'Temps de travail','work'):null,
      blockTimer:d.blockTimer||(d.blockSeconds?makeTimer(d.blockSeconds,`Bloc ${d.format.toUpperCase()}`,'block'):null)}));
    window.scrollTo(0,0);
  };
  const pause=()=>setDraft(d=>({...d,elapsedBase:elapsed,clockStarted:paused?Date.now():null,stageElapsed,stageStarted:paused?Date.now():null,timer:paused?thaw(d.timer):freeze(d.timer),blockTimer:paused?thaw(d.blockTimer):freeze(d.blockTimer)}));
  const review=()=>{setLogging(false);setError('');setDraft(d=>({...d,reviewing:true,elapsedBase:elapsed,clockStarted:null,stageElapsed,stageStarted:null,timer:freeze(d.timer),blockTimer:freeze(d.blockTimer)}));setFinishing(true);window.scrollTo(0,0);};
  const reportPain=()=>{if(row)updateRow({...row,pain:true,done:false,result:'pain'});setDraft(d=>({...d,elapsedBase:elapsed,clockStarted:null,stageElapsed,stageStarted:null,timer:null,blockTimer:freeze(d.blockTimer)}));go('symptoms');};
  const openLog=()=>{
    setError('');
    // The timer offers a measured value; saving still requires explicit confirmation.
    if(exercise.measure==='seconds'&&!exercise.unilateral&&!row.seconds&&draft.stageStarted&&stageElapsed>=1)updateRow({...row,seconds:String(Math.min(exercise.seconds,Math.floor(stageElapsed)))});
    setLogging(true);
  };
  const advance=()=>{
    const problem=PT.validateRow(row,exercise);if(problem){setError(problem);return;}
    const entries={...draft.entries,[exercise.id]:draft.entries[exercise.id].map((r,i)=>i===step.set?{...r,done:true}:r)};
    // Revisited/edited sets must never hide uncompleted steps earlier in the schedule.
    let next=steps.findIndex((s,i)=>i>cursor&&!entries[s.id][s.set].done&&!entries[s.id][s.set].pain);
    if(next<0)next=steps.findIndex(s=>!entries[s.id][s.set].done&&!entries[s.id][s.set].pain);
    const done=next<0;
    const rest=draft.format==='emom'?Math.max(0,60-Math.floor(stageElapsed)):step.rest;
    setDraft(d=>({...d,entries,cursor:done?cursor:next,timer:done?null:makeTimer(rest,'Récupération','rest'),stageElapsed:0,stageStarted:Date.now(),
      ...(done&&!['amrap','emom'].includes(draft.format)?{reviewing:true,elapsedBase:elapsed,clockStarted:null,stageStarted:null,blockTimer:freeze(d.blockTimer)}:{})}));
    setLogging(false);setError('');if(!row.done){try{navigator.vibrate?.(40);}catch(e){}}
    if(done&&!['amrap','emom'].includes(draft.format))setFinishing(true);
    window.scrollTo(0,0);
  };
  const finish=()=>{
    if(saved.current)return;
    if(!effort){setError('Choisis ton ressenti de 1 à 10.');return;}
    const session=PT.finishDraft(draft,{effort:Number(effort),liked,notes});
    if(session.error){setError(session.error);return;}
    saved.current=true;
    // Une séance de programme avance le suivi ; une séance libre ne touche jamais au programme.
    update(s=>{
      const next={...s,sessions:s.sessions.some(x=>x.id===session.id)?s.sessions:[...s.sessions,session],draft:null};
      const PP=window.PersonalPrograms;
      if(PP&&session.programInstanceId&&s.program&&s.program.id===session.programInstanceId&&s.program.status==='active')
        next.program=PP.markCompleted(s.program,{week:session.programWeekIndex,day:session.programDay,sessionId:session.id,date:session.date,partial:session.partial});
      return next;
    });
    go('history',session.id);
  };
  const addRound=()=>{
    setDraft(d=>{const entries={...d.entries};d.exercises.forEach(e=>entries[e.id]=[...entries[e.id],PT.newRows({...e,sets:1})[0]]);
      const first=d.exercises[0];return {...d,entries,exercises:d.exercises.map(e=>({...e,sets:e.sets+1})),cursor:steps.length,stageElapsed:0,stageStarted:Date.now(),timer:first.measure==='seconds'?makeTimer(first.seconds,'Temps de travail','work'):null};});window.scrollTo(0,0);
  };
  if(finishing)return <div className="live-review"><PTPageHead onBack={()=>{setFinishing(false);setDraft(d=>({...d,reviewing:false}));}} eyebrow="Séance terminée" title="Bien joué."/>
    <div className="stack-lg"><div className="finish-symbol"><PTIcon name="check" size={42}/></div><div className="stats-row"><div className="stat"><strong>{completed}</strong><small>séries validées</small></div><div className="stat"><strong>{timeLabel(elapsed)}</strong><small>temps réel</small></div><div className="stat"><strong>{completed<total?'Partiel':'Fait'}</strong><small>à ton rythme</small></div></div>
      <section className="effort-picker stack"><h2>C’était comment ?</h2><div className="effort-scale" role="group" aria-label="Effort global de 1 à 10">{[1,2,3,4,5,6,7,8,9,10].map(n=><button key={n} aria-label={`Effort ${n} sur 10`} aria-pressed={Number(effort)===n} onClick={()=>setEffort(String(n))}>{n}</button>)}</div><div className="topline caption"><span>Très facile</span><span>Maximal</span></div>{effort&&<p className="fine">{Number(effort)>=8?'Bien reçu. Les prochaines propositions seront allégées.':'Bien reçu. Ce ressenti accompagnera tes résultats.'}</p>}</section>
      <PTChoices value={liked} onChange={setLiked} options={[{value:true,label:'À refaire',icon:'heart'},{value:false,label:'Autre chose',icon:'shuffle'}]}/>
      {['amrap','emom'].includes(draft.format)&&<div className="form-grid"><PTField label={draft.format==='amrap'?'Tours réalisés':'Minutes de travail validées'} type="number" min="0" value={draft.rounds||''} onChange={e=>setDraft(d=>({...d,rounds:e.target.value}))}/><PTField label="Reps supplémentaires" type="number" min="0" value={draft.extraReps||''} onChange={e=>setDraft(d=>({...d,extraReps:e.target.value}))}/></div>}
      <details className="disclosure"><summary>Ajouter une note</summary><PTField label="Pour la prochaine fois"><textarea maxLength="1000" value={notes} onChange={e=>setNotes(e.target.value)}/></PTField></details>
      {error&&<p className="error" role="alert">{error}</p>}<PTButton primary onClick={finish}>Enregistrer ma séance<PTIcon name="check" size={20}/></PTButton>
    </div></div>;
  const allDone=completed===total;
  const activeTimer=phase==='warmup'||phase==='rest'?draft.timer:draft.format==='amrap'?draft.blockTimer:draft.timer;
  const shownTime=activeTimer?remaining(activeTimer):phase==='warmup'?draft.warmupSeconds:stageElapsed;
  const coach=paused?'À ton rythme. Reprends quand tu veux.':phase==='warmup'?'Des gestes faciles. On se met en mouvement.':phase==='rest'?(timerLeft===0?'Prêt pour la suite ?':'Souffle. Relâche les épaules.'):allDone?'Toutes les séries sont validées.':activeTimer&&remaining(activeTimer)===0?'Temps écoulé. Confirme ce que tu as fait.':exercise.instructions[0];
  const mainAction=()=>{if(paused){pause();return;}if(blocked||!permitted){go('symptoms');return;}if(phase==='warmup'||phase==='rest'){beginWork();return;}if(allDone){review();return;}openLog();};
  const actionLabel=paused?'Reprendre la séance':blocked||!permitted?'Voir mes douleurs':phase==='warmup'?'Échauffement effectué':phase==='rest'?`Passer à l’exercice ${exerciseIndex+1}`:allDone?'Terminer la séance':'Terminé';
  const nextIndex=steps.findIndex((s,i)=>i>cursor&&!draft.entries[s.id][s.set].done&&!draft.entries[s.id][s.set].pain);
  const upcoming=phase==='warmup'?{step,exercise}:nextIndex<0?null:{step:steps[nextIndex],exercise:draft.exercises.find(e=>e.id===steps[nextIndex].id)};
  // Moving between sets never validates or discards a result: saving still requires the result sheet.
  const jump=index=>{setError('');setLogging(false);setDraft(d=>({...d,cursor:index,timer:null,stageElapsed:0,stageStarted:paused?null:Date.now()}));window.scrollTo(0,0);};
  return <div className={`live-session phase-${phase}`}>
    <header className="live-topbar"><button className="icon-button" aria-label="Revenir à l’accueil" onClick={()=>go('today')}><PTIcon name="back"/></button><div><span className="eyebrow"><span className={`live-dot${paused?' paused':''}`}/>Séance en direct</span><strong>{timeLabel(elapsed)}<span> · {PT.formats[draft.format]}</span></strong></div></header>
    <div className="live-progress" aria-label={`${completed} séries validées sur ${total}`}>{steps.map((s,i)=><span key={`${s.id}-${s.set}`} className={draft.entries[s.id][s.set].done?'done':i===cursor?'current':''}/>)}</div>
    {phase!=='warmup'&&<div className="live-step"><span>Exercice <b>{exerciseIndex+1}</b> / {draft.exercises.length}</span><span>Série <b>{step.set+1}</b> / {exercise.sets}</span></div>}
    <div className="live-visual">{phase==='warmup'?<div className="warmup-visual"><PTIcon name="body" size={80}/><span>On réveille le corps.</span></div>:<PTDemo key={exercise.id} exercise={exercise}/>}</div>
    <section className="live-command">
      <div className="live-heading"><div className="eyebrow">{phase==='warmup'?'Échauffement':phase==='rest'?'À suivre':PT.patterns[exercise.pattern]}</div><h1>{phase==='warmup'?'On y va doucement.':exercise.name}</h1></div>
      <div className={`live-timer${paused?' paused':''}`} role="timer" aria-label={`${phase==='rest'?'Repos':phase==='warmup'?'Échauffement':'Travail'} : ${timeLabel(shownTime)}`}>
        <svg viewBox="0 0 220 150" aria-hidden="true"><path className="dial-track" d="M30 131 A94 94 0 1 1 190 131" pathLength="100"/><path className="dial-value" d="M30 131 A94 94 0 1 1 190 131" pathLength="100" strokeDasharray={`${activeTimer?Math.min(100,shownTime/(activeTimer.duration||1)*100):100} 100`}/></svg>
        <div><small>{paused?'En pause':phase==='rest'?'Repos':activeTimer?'Temps restant':'Temps de série'}</small><strong>{timeLabel(shownTime)}</strong></div>
      </div>
      <div className="session-transport">{phase!=='warmup'&&<button type="button" aria-label="Série précédente" disabled={cursor===0} onClick={()=>jump(cursor-1)}><PTIcon name="back" size={20}/></button>}<button type="button" className="transport-pause" aria-label={paused?'Reprendre le chrono':'Mettre en pause'} onClick={pause}><PTIcon name={paused?'play':'pause'} size={24}/></button>{phase!=='warmup'&&<button type="button" aria-label={phase==='rest'?'Terminer le repos':'Passer cette série'} disabled={phase==='rest'?paused:nextIndex<0} onClick={()=>{if(phase!=='rest'){jump(nextIndex);return;}if(blocked||!permitted){go('symptoms');return;}beginWork();}}><PTIcon name="arrow" size={20}/></button>}</div>
      {phase!=='warmup'&&<PTExerciseMetrics exercise={exercise} weight={row.weight||PT.loadAdvice(exercise,data,draft.check)?.value}/>}
      {upcoming&&<div className="next-up"><PTThumbnail exercise={upcoming.exercise}/><div><small>{phase==='warmup'?'Pour commencer':'Ensuite'}</small><strong>{upcoming.exercise.name}</strong><small>Série {upcoming.step.set+1} / {upcoming.exercise.sets}</small></div></div>}
      <p className="live-coach" aria-live="polite"><PTIcon name={phase==='rest'?'heart':'spark'} size={17}/>{coach}</p>
      {blocked||!permitted?<div className="notice warning">{blocked?'Séance suspendue : fais le point sur la douleur signalée.':'Ce mouvement ne convient plus à tes contraintes actuelles.'}</div>:null}
      {phase==='rest'&&<span className="caption">{timerLeft>0?'Le repos reste disponible jusqu’au bout.':'Récupération terminée.'}</span>}
      {phase==='work'&&exercise.unilateral&&exercise.measure==='seconds'&&<PTButton quiet disabled={paused} onClick={()=>setDraft(d=>({...d,timer:makeTimer(exercise.seconds,'Autre côté','work'),stageElapsed:0,stageStarted:Date.now()}))}>Minuter l’autre côté<PTIcon name="refresh" size={18}/></PTButton>}
      {phase==='work'&&exercise.audio&&<PTAudioCue/>}
      {draft.blockTimer&&draft.format!=='amrap'&&<span className="caption">Bloc {draft.format.toUpperCase()} · {timeLabel(remaining(draft.blockTimer))}</span>}
    </section>
    <div className="live-extras">
      {phase==='warmup'&&<button className="text-button" onClick={()=>{setDraft(d=>({...d,warmupSkipped:true}));beginWork();}}>Je l’ai déjà fait avant d’ouvrir l’app</button>}
      {phase==='work'&&<details className="disclosure"><summary>Posture & charge</summary><div className="stack"><ol className="instruction-list">{exercise.instructions.map((line,i)=><li key={i}>{line}</li>)}</ol>{PT.loadAdvice(exercise,data,draft.check)&&<p className="fine">{PT.loadAdvice(exercise,data,draft.check).text}</p>}</div></details>}
      {allDone&&['amrap','emom'].includes(draft.format)&&<PTButton quiet disabled={paused||blocked} onClick={addRound}>Ajouter un tour<PTIcon name="plus" size={18}/></PTButton>}
      {!blocked&&!permitted&&<PTButton quiet onClick={()=>{const next=steps.findIndex((s,i)=>i>cursor&&PT.allowed(draft.exercises.find(e=>e.id===s.id),data,draft.check));if(next<0)review();else setDraft(d=>({...d,cursor:next,timer:null,stageElapsed:0,stageStarted:null}));}}>Passer à un mouvement compatible</PTButton>}
      <details className="disclosure"><summary>Options de séance</summary><div className="stack"><PTButton quiet onClick={review}>Terminer ici</PTButton><details className="disclosure"><summary>Voir les séries / corriger un résultat</summary><div className="set-history">{steps.map((s,i)=><button key={`${s.id}-${s.set}`} className={`${draft.entries[s.id][s.set].done?'done ':''}${i===cursor?'current':''}`} aria-label={`${draft.exercises.find(e=>e.id===s.id).name}, série ${s.set+1}`} onClick={()=>{setDraft(d=>({...d,cursor:i,timer:null,stageElapsed:0,stageStarted:paused?null:Date.now()}));window.scrollTo(0,0);}}>{i+1}{draft.entries[s.id][s.set].done?' ✓':''}</button>)}</div></details>
        <PTButton quiet onClick={()=>{setDraft(d=>{const entries={};const exercises=d.exercises.map(e=>{const rows=d.entries[e.id],done=rows.filter(r=>r.done),pending=rows.find(r=>!r.done&&!r.pain);entries[e.id]=pending?[...done,pending]:done;return {...e,sets:entries[e.id].length};}).filter(e=>e.sets);if(!exercises.length)return d;const sequence=PT.schedule(exercises,d.format),next=sequence.findIndex(s=>!entries[s.id][s.set].done);return {...d,entries,exercises,cursor:Math.max(0,next),timer:null,stageElapsed:0,stageStarted:paused?null:Date.now(),shortened:true};});notify('Une série restante par exercice. Tes résultats sont conservés.');}}>Raccourcir la fin · 10 min</PTButton>
        {abandon?<div className="notice warning stack"><p>Abandonner sans enregistrer ?</p><PTButton danger onClick={()=>{update(s=>({...s,draft:null}));go('today');}}>Abandonner sans enregistrer</PTButton><PTButton quiet onClick={()=>setAbandon(false)}>Garder ma séance</PTButton></div>:<button className="text-button" onClick={()=>setAbandon(true)}>Abandonner le brouillon</button>}
      </div></details>
    </div>
    <footer className="live-dock"><div className="dock-caption"><span>{phase==='rest'?'À suivre':phase==='warmup'?'Prépare-toi':`${completed}/${total} séries validées`}</span><button className="text-button" onClick={reportPain}>Une douleur ?</button></div><PTButton primary onClick={mainAction}><PTIcon name={paused?'play':phase==='work'?'check':'arrow'} size={22}/>{actionLabel}</PTButton></footer>
    {logging&&<PTSetSheet exercise={exercise} row={row} onChange={updateRow} onClose={()=>setLogging(false)} onSave={advance} error={error}/>}
  </div>;
}
