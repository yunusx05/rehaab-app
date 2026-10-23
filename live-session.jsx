/* Action mode reuses the existing prescriptions, validation, history and safety rules. */
function PTSetSheet({exercise,row,onChange,onSave,onQuick,onClose,error}) {
  const dialog=usePTRef(null);
  usePTEffect(()=>{const el=dialog.current;el.showModal();return()=>el.close();},[]);
  return <dialog className="set-sheet" ref={dialog} onCancel={e=>{e.preventDefault();onClose();}}>
    <div className="sheet-handle"/>
    <div className="topline"><div><div className="eyebrow">Ta série, en un geste</div><h2>Ce que tu as fait.</h2></div><button className="icon-button" aria-label="Fermer la saisie" onClick={onClose}><PTIcon name="close"/></button></div>
    {onQuick&&<PTButton primary onClick={onQuick}><PTIcon name="check" size={20}/>Fait comme prévu</PTButton>}
    <div className="stack"><PTRowInputs exercise={exercise} row={row} onChange={onChange}/>
    {error&&<p className="error" role="alert">{error}</p>}
    <PTButton onClick={()=>onSave()}><PTIcon name="check" size={20}/>Valider cette série</PTButton></div>
  </dialog>;
}

// Lot 19 : la séance avance seule, segment par segment. Chaque chrono qui finit enchaîne le suivant :
// « Prépare-toi » (5 s) → travail ; côté 1 → « Change de côté » (5 s) → côté 2 ; travail minuté → série validée → repos → « Prépare-toi ».
// Un mouvement unilatéral est chronométré côté par côté ; l'aperçu compte donc les deux côtés.
const ptSideSeconds=m=>m.measure==='seconds'?m.seconds:(m.targetMax||m.max||10)*3;
const ptMoveSeconds=m=>ptSideSeconds(m)*(m.unilateral?2:1);
const ptTimer=(seconds,label,kind,extra={},paused=false)=>({id:PT.uid(),endAt:paused?null:Date.now()+seconds*1000,remaining:seconds,duration:seconds,label,kind,...extra});
const ptFromTemplate=(t,paused=false)=>t?ptTimer(t.seconds,t.label,t.kind,t.side?{side:t.side}:{},paused):null;
const ptRoutineTemplate=(m,kind)=>({seconds:ptSideSeconds(m),label:kind==='warmup'?'Échauffement':'Retour au calme',kind,...(m.unilateral?{side:1}:{})});
const ptRoutineTimer=(m,kind,paused)=>ptFromTemplate(ptRoutineTemplate(m,kind),paused);
const ptWorkTemplate=e=>e&&e.measure==='seconds'?{seconds:e.seconds,label:e.unilateral?'Côté gauche':'Temps de travail',kind:'work',...(e.unilateral?{side:1}:{})}:null;
const ptReady=(next,paused=false)=>ptTimer(5,'Prépare-toi','ready',{next},paused);
const ptSwitch=(next,paused=false)=>ptTimer(5,'Change de côté','switch',{next},paused);
function ptRoutineStep(d,delta){
  const kind=d.cooling?'cooldown':'warmup',list=(kind==='warmup'?d.warmupMoves:d.cooldownMoves)||[],key=kind==='warmup'?'warmIndex':'coolIndex';
  const i=Math.max(0,Math.min(list.length-1,(d[key]||0)+delta));
  return list[i]?{...d,[key]:i,timer:ptRoutineTimer(list[i],kind,!d.clockStarted),stageElapsed:0,stageStarted:d.clockStarted?Date.now():null}:d;
}
const ptRepsGoal=e=>{const lo=e.targetMin||e.min,hi=e.targetMax||e.max,n=lo===hi?`${hi}`:`${lo}–${hi}`;return e.measure==='shots'?`${n} tirs`:e.measure==='contacts'?`${n} contacts`:`${n} répétitions${e.unilateral?' / côté':''}`;};
// À quoi sert l'exercice sur le terrain : son propre texte, sinon la table du lot 19, sinon celui de sa famille de mouvements.
const ptWhy=e=>e?(e.transfer||PT.courtWhy?.[e.id]||PT.patternWhy?.[e.pattern]||''):'';
const ptGoWords=['C’est parti !','Allez, on y va !','À toi !','Go !'],ptPush=['Tiens bon.','Respire, reste gainé.','Super, continue.','Propre, garde le rythme.','Encore un peu, c’est bien.'];
const ptPick=list=>list[Math.floor(Math.random()*list.length)];
// Feuille de match : un chiffre qui change monte depuis le bas (motion.css), le texte lu reste la valeur seule.
function PTRoll({value}){return <span className="roll"><span key={value} className="roll-in">{value}</span></span>;}
// Objectif d'une série en une ligne courte : « 3 × 8–12 », « 3 × 40 s ».
const ptSetLine=e=>`${e.sets} × ${e.measure==='seconds'?`${e.seconds} s`:ptRepsGoal(e).split(' ')[0]}`;
function PTSession({data,update,go,notify}) {
  const draft=data.draft;
  const [tick,setTick]=usePTState(Date.now()),[logging,setLogging]=usePTState(false),[error,setError]=usePTState('');
  const [finishing,setFinishing]=usePTState(!!draft?.reviewing),[effort,setEffort]=usePTState(''),[liked,setLiked]=usePTState(null),[notes,setNotes]=usePTState(''),[painAfter,setPainAfter]=usePTState(null),[skillRatings,setSkillRatings]=usePTState({}),[abandon,setAbandon]=usePTState(false),[menu,setMenu]=usePTState(false);
  const wake=usePTRef(null),fired=usePTRef(new Set()),saved=usePTRef(false),segmentEnd=usePTRef(null),announce=usePTRef(null);
  const voice=data.preferences?.voice!==false,say=text=>{if(voice)ptSay(text);};
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
  usePTEffect(()=>()=>{try{window.speechSynthesis?.cancel();}catch(e){}},[]);
  const remaining=timer=>timer?(timer.endAt?Math.max(0,Math.min(timer.remaining??Infinity,Math.ceil((timer.endAt-tick)/1000))):timer.remaining):0;
  const timerLeft=remaining(draft?.timer);
  // Bips de chaque chrono : départ, 3-2-1, fin. Compte à rebours : seulement 3-2-1 ; changement de côté : signal de fin du premier côté.
  // La voix du coach suit les mêmes instants. Chaque signal ne sonne qu'une fois ; rien en pause. Placé avant les retours anticipés.
  usePTEffect(()=>{
    const t=draft?.timer;if(!t||!t.endAt||finishing||draft.reviewing)return;
    const fire=(key,type)=>{if(fired.current.has(key))return false;fired.current.add(key);if(type)ptCue(type);return true;};
    const countdown=t.kind==='ready'||t.kind==='switch';
    if(timerLeft===0){if(!countdown)fire(`${t.id}-end`,'end');}
    else if(timerLeft<=3&&timerLeft<t.duration)fire(`${t.id}-${timerLeft}`,'tick');
    else if(timerLeft>=t.duration-1){if(fire(`${t.id}-start`,countdown?(t.kind==='switch'?'end':null):'start'))announce.current?.('start',t);}
    else if(t.kind==='work'&&t.duration>=20&&timerLeft===10){if(fire(`${t.id}-ten`))say('Plus que 10 secondes.');}
    else if(t.kind==='work'&&t.duration>=30&&timerLeft===Math.ceil(t.duration/2)){if(fire(`${t.id}-half`))say(ptPick(ptPush));}
  },[timerLeft,draft?.timer?.id,draft?.timer?.endAt,finishing]);
  // Fin d'un chrono : on enchaîne seul sur le segment suivant (décision dans segmentEnd, définie plus bas avec l'état courant).
  usePTEffect(()=>{
    const t=draft?.timer;if(!t||!t.endAt||finishing||draft.reviewing||timerLeft>0)return;
    const key=`${t.id}-next`;if(fired.current.has(key))return;fired.current.add(key);
    const id=setTimeout(()=>segmentEnd.current?.(t.id),t.kind==='ready'||t.kind==='switch'?150:900);
    return()=>clearTimeout(id);
  },[timerLeft,draft?.timer?.id,finishing]);
  // Série en répétitions : pas de chrono, on annonce le départ quand l'écran de travail s'affiche.
  const repsKey=draft?.status==='active'&&draft.warmupDone&&!draft.cooling&&!draft.timer&&draft.clockStarted&&!draft.reviewing&&!finishing?`${draft.id}-${draft.cursor||0}-${draft.side||1}`:null;
  usePTEffect(()=>{if(!repsKey||fired.current.has(`reps-${repsKey}`))return;fired.current.add(`reps-${repsKey}`);announce.current?.('reps');},[repsKey]);
  if(!draft||draft.status!=='active')return <><PTPageHead title="Prêt à bouger ?"/><PTButton primary onClick={()=>go('today')}>Revenir à aujourd’hui</PTButton></>;
  const setDraft=fn=>update(s=>({...s,draft:s.draft?fn(s.draft):null}));
  // Écran « Prêt ? » : rien ne tourne avant le tap. Le matériel à sortir, puis un compte à rebours avant le premier mouvement.
  if(draft.ready===false){
    const first=draft.warmupMoves?.[0];
    const next=first?ptRoutineTemplate(first,'warmup'):draft.warmupSeconds>0?{seconds:draft.warmupSeconds,label:'Échauffement',kind:'warmup'}:null;
    // Sans échauffement, on part directement sur le premier exercice (toujours après le « Prépare-toi »).
    const getReady=()=>{say(`C’est parti pour ${draft.title}. Prépare-toi.`);setDraft(d=>({...d,ready:true,...(next?{}:{warmupDone:true,blockTimer:d.blockSeconds?ptTimer(d.blockSeconds,`Bloc ${d.format.toUpperCase()}`,'block'):null}),clockStarted:Date.now(),stageElapsed:0,stageStarted:Date.now(),timer:ptReady(next||ptWorkTemplate(d.exercises[0]))}));window.scrollTo(0,0);};
    const minutes=Math.ceil(((draft.warmupMoves||[]).reduce((n,m)=>n+ptMoveSeconds(m),0)||draft.warmupSeconds||0)/60+PT.estimateSeconds(draft.exercises,draft.format)/60);
    return <div className="live-session live-ready-gate">
      <header className="live-topbar"><button className="icon-button" aria-label="Revenir à l’accueil" onClick={()=>go('today')}><PTIcon name="back"/></button><div className="live-position"><span className="eyebrow">Avant de commencer</span><strong>Prêt ?</strong></div><span className="live-topbar-spacer"/></header>
      <div className="ready-hero"><h1>{draft.title}</h1><div className="ready-score"><div><strong>{minutes}</strong><span>min environ</span></div><div><strong>{draft.exercises.length}</strong><span>exercices</span></div></div></div>
      <div className="stack-lg">
        {typeof PTGearList==='function'&&<PTGearList plan={draft}/>}
        <div className="next-up"><PTThumbnail exercise={first||draft.exercises[0]}/><div><small>Pour commencer</small><strong>{(first||draft.exercises[0]).name}</strong><small>{first?'Échauffement guidé':ptRepsGoal(draft.exercises[0])}</small></div></div>
        <p className="fine">Le chrono part après 5 secondes de préparation. Tu peux mettre en pause à tout moment.</p>
      </div>
      <footer className="live-dock"><PTButton primary onClick={getReady}><PTIcon name="play" size={22}/>Je suis prêt</PTButton></footer>
    </div>;
  }
  const steps=PT.schedule(draft.exercises,draft.format),cursor=Math.min(draft.cursor||0,Math.max(0,steps.length-1)),step=steps[cursor];
  const exercise=draft.exercises.find(e=>e.id===step?.id),row=exercise?draft.entries[exercise.id]?.[step.set]:null;
  const completed=Object.values(draft.entries).flat().filter(r=>r.done&&!r.pain).length,total=Object.values(draft.entries).flat().length;
  const elapsed=Math.max(0,draft.elapsedBase+(draft.clockStarted?Math.max(0,tick-draft.clockStarted)/1000:0));
  const stageElapsed=Math.max(0,(draft.stageElapsed||0)+(draft.stageStarted?Math.max(0,tick-draft.stageStarted)/1000:0));
  const blocked=PT.safety(data).blocked,permitted=exercise&&PT.allowed(exercise,data,draft.check);
  const phase=!draft.warmupDone?'warmup':draft.cooling?'cooldown':draft.timer?.kind==='rest'?'rest':'work';
  const countdown=['ready','switch'].includes(draft.timer?.kind)?draft.timer.kind:null;
  const moves=phase==='warmup'?draft.warmupMoves||[]:phase==='cooldown'?draft.cooldownMoves||[]:[];
  const moveIndex=Math.min(phase==='warmup'?draft.warmIndex||0:draft.coolIndex||0,Math.max(0,moves.length-1)),move=moves[moveIndex]||null,lastMove=moveIndex>=moves.length-1;
  const guided=!!move;
  const paused=!draft.clockStarted,exerciseIndex=draft.exercises.findIndex(e=>e.id===exercise?.id);
  const makeTimer=(seconds,label,kind)=>ptTimer(seconds,label,kind);
  const freeze=t=>t?{...t,remaining:t.endAt?Math.max(0,Math.ceil((t.endAt-Date.now())/1000)):t.remaining,endAt:null}:null;
  const thaw=t=>t?{...t,endAt:Date.now()+t.remaining*1000}:null;
  const updateRow=r=>setDraft(d=>({...d,entries:{...d.entries,[exercise.id]:d.entries[exercise.id].map((old,i)=>i===step.set?r:old)}}));
  const repsSides=exercise&&exercise.unilateral&&['reps','contacts'].includes(exercise.measure);
  const lastSet=exercise&&exercise.sets>1&&step.set+1===exercise.sets;
  // Toujours un « Prépare-toi » avant le travail : le chrono ne part jamais par surprise.
  const beginWork=()=>{
    if(blocked||!permitted){go('symptoms');return;}
    setDraft(d=>({...d,warmupDone:true,side:null,clockStarted:d.clockStarted||Date.now(),stageElapsed:0,stageStarted:Date.now(),
      timer:ptReady(ptWorkTemplate(exercise)),
      blockTimer:d.blockTimer||(d.blockSeconds?makeTimer(d.blockSeconds,`Bloc ${d.format.toUpperCase()}`,'block'):null)}));
    window.scrollTo(0,0);
  };
  const pause=()=>{if(!paused)try{window.speechSynthesis?.cancel();}catch(e){}setDraft(d=>({...d,elapsedBase:elapsed,clockStarted:paused?Date.now():null,stageElapsed,stageStarted:paused?Date.now():null,timer:paused?thaw(d.timer):freeze(d.timer),blockTimer:paused?thaw(d.blockTimer):freeze(d.blockTimer)}));};
  const review=()=>{setLogging(false);setError('');setMenu(false);setDraft(d=>({...d,reviewing:true,elapsedBase:elapsed,clockStarted:null,stageElapsed,stageStarted:null,timer:freeze(d.timer),blockTimer:freeze(d.blockTimer)}));setFinishing(true);window.scrollTo(0,0);};
  const reportPain=()=>{if(row)updateRow({...row,pain:true,done:false,result:'pain'});setDraft(d=>({...d,elapsedBase:elapsed,clockStarted:null,stageElapsed,stageStarted:null,timer:null,blockTimer:freeze(d.blockTimer)}));go('symptoms');};
  const openLog=()=>{
    setError('');
    // The timer offers a measured value; saving still requires explicit confirmation.
    if(exercise.measure==='seconds'&&!exercise.unilateral&&!row.seconds&&draft.stageStarted&&stageElapsed>=1)updateRow({...row,seconds:String(Math.min(exercise.seconds,Math.floor(stageElapsed)))});
    setLogging(true);
  };
  // « Fait » sans charge connue : la série est validée quand même, charge laissée vide (« Ajuster » pour la noter).
  // Une ligne sans charge n'entre jamais dans le calcul des charges suivantes (loadAdvice ne lit que des charges réelles).
  const quickProblem=r=>PT.validateRow(exercise.weighted&&!r.weight?{...r,weight:'1'}:r,exercise);
  const advance=(override,quick=false)=>{
    const current=override||row;
    const problem=quick?quickProblem(current):PT.validateRow(current,exercise);if(problem){if(override)updateRow(override);setError(problem);setLogging(true);return;}
    const entries={...draft.entries,[exercise.id]:draft.entries[exercise.id].map((r,i)=>i===step.set?{...current,done:true}:r)};
    // Revisited/edited sets must never hide uncompleted steps earlier in the schedule.
    let next=steps.findIndex((s,i)=>i>cursor&&!entries[s.id][s.set].done&&!entries[s.id][s.set].pain);
    if(next<0)next=steps.findIndex(s=>!entries[s.id][s.set].done&&!entries[s.id][s.set].pain);
    const done=next<0;
    // Dernière série : le retour au calme guidé passe avant le bilan (sauf AMRAP / EMOM, bornés par leur chrono).
    if(done&&!['amrap','emom'].includes(draft.format)&&draft.cooldownMoves?.length&&!draft.cooldownDone){
      setDraft(d=>({...d,entries,cursor,side:null,cooling:true,coolIndex:0,timer:ptRoutineTimer(d.cooldownMoves[0],'cooldown',false),stageElapsed:0,stageStarted:Date.now(),blockTimer:freeze(d.blockTimer)}));
      setLogging(false);setError('');window.scrollTo(0,0);return;
    }
    const rest=draft.format==='emom'?Math.max(0,60-Math.floor(stageElapsed)):step.rest>0?step.rest:exercise.rest>0?exercise.rest:60;
    setDraft(d=>({...d,entries,side:null,cursor:done?cursor:next,timer:done?null:makeTimer(rest,'Récupération','rest'),stageElapsed:0,stageStarted:Date.now(),
      ...(done&&!['amrap','emom'].includes(draft.format)?{reviewing:true,elapsedBase:elapsed,clockStarted:null,stageStarted:null,blockTimer:freeze(d.blockTimer)}:{})}));
    setLogging(false);setError('');if(!row.done){try{navigator.vibrate?.(40);}catch(e){}}
    if(done&&!['amrap','emom'].includes(draft.format)){setFinishing(true);say('Séance terminée. Bien joué !');}
    window.scrollTo(0,0);
  };
  // Série « comme prévu » : bas de la fourchette, charge préremplie, marge laissée vide (aucune hausse de charge n'en est déduite).
  const quickRow=()=>{
    const target=String(exercise.targetMin||exercise.min||'');
    if(exercise.measure==='seconds')return {...row,seconds:row.seconds||String(exercise.seconds)};
    if(exercise.measure==='reps'||exercise.measure==='contacts')return {...row,...(exercise.unilateral?{left:row.left||target,right:row.right||target}:{reps:row.reps||target}),weight:row.weight||String(PT.loadAdvice(exercise,data,draft.check)?.value??''),result:'passed',rir:''};
    return null;
  };
  const finish=()=>{
    if(saved.current)return;
    if(!effort){setError('Choisis ton ressenti de 1 à 10.');return;}
    if(draft.source==='rehab'&&painAfter==null){setError('Indique ta douleur sur la zone, de 0 à 10.');return;}
    // Les routines guidées ne sont pas gardées en entier dans l'historique : seulement ce qui a été fait.
    const {warmupMoves,cooldownMoves,...kept}=draft;
    const finished=PT.finishDraft({...kept,routines:{warmup:draft.warmupSkipped?[]:(warmupMoves||[]).map(e=>e.id),cooldown:draft.cooldownDone&&!draft.cooling?(cooldownMoves||[]).map(e=>e.id):[]}},{effort:Number(effort),liked,notes});
    if(finished.error){setError(finished.error);return;}
    // Soin intégré à une autre séance : la douleur après (facultative) fait aussi progresser son protocole.
    const cares=draft.source==='rehab'?[]:[...new Map(draft.exercises.filter(e=>e.pathwayRole==='soin'&&e.careProtocol).map(e=>[e.careProtocol,e.careLevel||0])).entries()];
    const session=draft.source==='rehab'||(cares.length&&painAfter!=null)?{...finished,painAfter}:finished;
    const RWL=window.RehabWarmup;let levelChange=0,skillChanges=[];
    saved.current=true;
    // Une séance du parcours avance le suivi ; une séance libre ne touche jamais au parcours.
    update(s=>{
      const next={...s,sessions:s.sessions.some(x=>x.id===session.id)?s.sessions:[...s.sessions,session],draft:null};
      // Quick Rehab : la douleur après la séance règle le niveau du protocole.
      if(RWL&&session.source==='rehab'&&session.protocolId){const r=RWL.record(s.rehab,{protocolId:session.protocolId,level:session.rehabLevel,painAfter:session.painAfter,sessionId:session.id,date:session.date},s.sessions);next.rehab=r.rehab;levelChange=r.change;}
      if(RWL&&cares.length&&painAfter!=null){let rehab=s.rehab;cares.forEach(([protocolId,level])=>{const r=RWL.record(rehab,{protocolId,level,painAfter,sessionId:session.id,date:session.date},s.sessions);rehab=r.rehab;if(r.change)levelChange=r.change;});next.rehab=rehab;}
      // Une séance du programme muscu avance son suivi ; une séance libre ne touche jamais au programme.
      const PPL=window.PersonalPrograms;
      if(PPL&&session.programInstanceId&&s.program&&s.program.id===session.programInstanceId&&s.program.status==='active')
        next.program=PPL.markCompleted(s.program,{week:session.programWeekIndex,day:session.programDay,sessionId:session.id,date:session.date,partial:session.partial});
      // Skills basket : tirs notés et ressenti font évoluer les paliers.
      const SKL=window.BasketSkills;
      if(SKL&&session.exercises.some(e=>e.skillArea)){const r=SKL.record(s.skills,session,skillRatings);next.skills=r.skills;skillChanges=r.changes;}
      const BP=window.BasketPathway;
      if(BP&&session.pathwayId&&s.pathway&&s.pathway.id===session.pathwayId&&s.pathway.step===session.pathwayStep)
        next.pathway=BP.markCompleted(s.pathway,{step:session.pathwayStep,week:session.pathwayWeek,day:session.pathwayDay,sessionId:session.id,date:session.date,partial:session.partial});
      return next;
    });
    if(skillChanges.length&&window.BasketSkills)setTimeout(()=>notify(skillChanges.map(c=>`${window.BasketSkills.areas[c.area].short} : palier ${c.dir>0?'suivant débloqué':'précédent, on consolide'}`).join(' · ')),0);
    if(cares.length&&levelChange)setTimeout(()=>notify(levelChange>0?'Soin bien toléré deux fois : il passe au niveau suivant.':'Douleur trop forte : le soin redescend d’un niveau.'),0);
    if(RWL&&['rehab','warmup'].includes(session.source)){const level=session.source!=='rehab'?'':levelChange>0?'Bien toléré deux fois : prochain niveau débloqué. ':levelChange<0?'Douleur trop forte : on redescend d’un niveau. ':'';setTimeout(()=>notify(`${level}Ta prochaine séance du parcours te proposera de retirer ce temps.`),0);}
    go('history',session.id);
  };
  const addRound=()=>{
    setDraft(d=>{const entries={...d.entries};d.exercises.forEach(e=>entries[e.id]=[...entries[e.id],PT.newRows({...e,sets:1})[0]]);
      const first=d.exercises[0];return {...d,entries,exercises:d.exercises.map(e=>({...e,sets:e.sets+1})),cursor:steps.length,side:null,stageElapsed:0,stageStarted:Date.now(),timer:ptReady(ptWorkTemplate(first))};});window.scrollTo(0,0);
  };
  // Fin de séance : l'écran se remplit de citron, le titre déborde du cadre, puis le bilan sur fond charbon.
  if(finishing)return <div className="live-review">
    <section className="finish-flood">
      <button className="back-link" onClick={()=>{setFinishing(false);setDraft(d=>({...d,reviewing:false}));}}><PTIcon name="back" size={18}/>Retour</button>
      <h1 className="finish-title"><span>Bien</span> <span>joué.</span></h1>
      <p className="finish-sub">Séance terminée · {draft.title}</p>
      <div className="finish-score"><div><strong>{completed}</strong><small>séries validées</small></div><div><strong>{timeLabel(elapsed)}</strong><small>temps réel</small></div><div><strong>{completed<total?'Partiel':'Fait'}</strong><small>à ton rythme</small></div></div>
    </section>
    <div className="stack-lg finish-form">
      <section className="effort-picker stack"><h2>C’était comment ?</h2><div className="effort-scale" role="group" aria-label="Effort global de 1 à 10">{[1,2,3,4,5,6,7,8,9,10].map(n=><button key={n} aria-label={`Effort ${n} sur 10`} aria-pressed={Number(effort)===n} onClick={()=>setEffort(String(n))}>{n}</button>)}</div><div className="topline caption"><span>Très facile</span><span>Maximal</span></div>{effort&&<p className="fine">{Number(effort)>=8?'Bien reçu. Les prochaines propositions seront allégées.':'Bien reçu. Ce ressenti accompagnera tes résultats.'}</p>}</section>
      {draft.source==='rehab'&&typeof PTRehabPainAfter==='function'&&<PTRehabPainAfter value={painAfter} onChange={setPainAfter}/>}
      {draft.source!=='rehab'&&draft.exercises.some(e=>e.pathwayRole==='soin')&&typeof PTRehabPainAfter==='function'&&<PTRehabPainAfter value={painAfter} onChange={setPainAfter}/>}
      {typeof PTSkillsRating==='function'&&<PTSkillsRating draft={draft} value={skillRatings} onChange={setSkillRatings}/>}
      <PTChoices value={liked} onChange={setLiked} options={[{value:true,label:'À refaire',icon:'heart'},{value:false,label:'Autre chose',icon:'shuffle'}]}/>
      {['amrap','emom'].includes(draft.format)&&<div className="form-grid"><PTField label={draft.format==='amrap'?'Tours réalisés':'Minutes de travail validées'} type="number" min="0" value={draft.rounds||''} onChange={e=>setDraft(d=>({...d,rounds:e.target.value}))}/><PTField label="Reps supplémentaires" type="number" min="0" value={draft.extraReps||''} onChange={e=>setDraft(d=>({...d,extraReps:e.target.value}))}/></div>}
      <details className="disclosure"><summary>Ajouter une note</summary><PTField label="Pour la prochaine fois"><textarea maxLength="1000" value={notes} onChange={e=>setNotes(e.target.value)}/></PTField></details>
      {error&&<p className="error" role="alert">{error}</p>}<PTButton primary onClick={finish}>Enregistrer ma séance<PTIcon name="check" size={20}/></PTButton>
    </div></div>;
  const allDone=completed===total;
  // Retour au calme : lancé à la fin (dernière série ou « Terminer la séance »), passable à tout moment.
  const startCooldown=()=>{if(!draft.cooldownMoves?.length||draft.cooldownDone)return false;setDraft(d=>({...d,cooling:true,coolIndex:0,timer:ptRoutineTimer(d.cooldownMoves[0],'cooldown',!d.clockStarted),stageElapsed:0,stageStarted:d.clockStarted?Date.now():null}));window.scrollTo(0,0);return true;};
  const endCooldown=()=>{setDraft(d=>({...d,cooling:false,cooldownDone:true}));review();};
  const stepMove=delta=>{setDraft(d=>ptRoutineStep(d,delta));window.scrollTo(0,0);};
  // Un exercice chronométré repart avec un « Prépare-toi » (gelé si la séance est en pause).
  const jump=index=>{setError('');setLogging(false);setMenu(false);const e=draft.exercises.find(x=>x.id===steps[index]?.id);setDraft(d=>({...d,cursor:index,side:null,timer:e&&e.measure==='seconds'?ptReady(ptWorkTemplate(e),paused):null,stageElapsed:0,stageStarted:paused?null:Date.now()}));window.scrollTo(0,0);};
  // Unilatéral en répétitions : le premier « Fait » vaut pour le côté gauche, puis 5 s pour changer de côté.
  const toSecondSide=()=>{setDraft(d=>({...d,timer:ptSwitch(null),stageStarted:Date.now()}));};
  const nextIndex=steps.findIndex((s,i)=>i>cursor&&!draft.entries[s.id][s.set].done&&!draft.entries[s.id][s.set].pain);
  // « Fait » (bouton du bas ou flèche droite) : valide la série « comme prévu » sans aucune question.
  // Chrono interrompu avant la fin : le temps réellement tenu est gardé. Tirs à compter : la feuille de saisie s'ouvre.
  const validateNext=()=>{
    if(blocked||!permitted){go('symptoms');return;}
    if(row.done){if(nextIndex>=0)jump(nextIndex);else if(allDone){if(!startCooldown())review();}return;}
    if(draft.timer?.kind==='work'&&draft.timer.side===1){fired.current.add(`${draft.timer.id}-next`);segmentEnd.current?.(draft.timer.id);return;}
    if(repsSides&&draft.side!==2){toSecondSide();return;}
    const quick=quickRow();
    const activeWork=draft.timer?.kind==='work'?draft.timer:null;
    const cut=exercise.measure==='seconds'&&!row.seconds&&activeWork&&remaining(activeWork)>0&&stageElapsed>=1;
    const candidate=quick&&cut?{...quick,seconds:String(Math.min(exercise.seconds,Math.floor(stageElapsed)))}:quick;
    if(!candidate||quickProblem(candidate)){openLog();return;}
    advance(candidate,true);
  };
  // Fin d'un chrono : quoi faire ensuite. Toujours relu avec l'état du moment (la ref est remplacée à chaque rendu).
  segmentEnd.current=id=>{
    const t=draft.timer;if(!t||t.id!==id)return;
    if(t.kind==='ready'){setDraft(d=>d.timer?.id===id?{...d,timer:ptFromTemplate(t.next),stageElapsed:0,stageStarted:Date.now()}:d);if(!t.next)ptCue('start');return;}
    if(t.kind==='switch'){setDraft(d=>d.timer?.id===id?{...d,side:2,timer:ptFromTemplate(t.next),stageElapsed:0,stageStarted:Date.now()}:d);if(!t.next){ptCue('start');}return;}
    if(t.side===1&&['warmup','cooldown','work'].includes(t.kind)){setDraft(d=>d.timer?.id===id?{...d,timer:ptSwitch({seconds:t.duration,label:t.kind==='work'?'Côté droit':t.label,kind:t.kind,side:2})}:d);return;}
    if(t.kind==='warmup'){if(guided&&!lastMove)stepMove(1);else if(!blocked&&permitted)beginWork();return;}
    if(t.kind==='cooldown'){if(!lastMove)stepMove(1);else endCooldown();return;}
    if(t.kind==='work'){if(!blocked&&permitted&&!row.done){const quick=quickRow();if(quick&&!quickProblem(quick))advance(quick,true);}return;}
    if(t.kind==='rest'&&!blocked&&permitted)beginWork();
  };
  // La voix du coach : ce qui arrive, en une phrase. Les noms viennent de l'état du moment.
  announce.current=(what,t)=>{
    if(what==='reps'){if(allDone||row?.done)return;say(`${draft.side===2?'Côté droit. ':''}${ptPick(ptGoWords)} ${ptRepsGoal(exercise).replace(' / côté','')}.${lastSet&&draft.side!==2?' Dernière série.':''}`);return;}
    if(!t)return;
    if(t.kind==='ready'){const n=t.next;const target=phase==='warmup'&&n?.kind==='warmup'?move||draft.warmupMoves?.[0]:exercise;say(`Prépare-toi. ${target?.name||'Échauffement'}${n?.side===1?', côté gauche':''}.${phase!=='warmup'&&lastSet?' Dernière série.':''}`);return;}
    if(t.kind==='switch'){say('Change de côté.');return;}
    if(t.kind==='work'){say(t.side===2?'Côté droit. Go !':ptPick(ptGoWords));return;}
    if(t.kind==='rest'){const nx=exercise;say(`Repos, ${t.duration} secondes. Ensuite : ${nx?.name||'la suite'}.`);return;}
    if(['warmup','cooldown'].includes(t.kind)&&move){say(t.side===2?'Côté droit.':`${move.name}${t.side===1?', côté gauche':''}.`);}
  };
  const activeTimer=phase==='warmup'||phase==='rest'||phase==='cooldown'||countdown?draft.timer:draft.format==='amrap'?draft.blockTimer:draft.timer;
  const shownTime=activeTimer?remaining(activeTimer):phase==='warmup'?draft.warmupSeconds:stageElapsed;
  const sideLabel=countdown==='switch'?null:(draft.timer?.side===2||(repsSides&&draft.side===2))?'Côté droit':(draft.timer?.side===1||(repsSides&&phase==='work'&&!row.done))?'Côté gauche':null;
  const why=phase==='work'?ptWhy(exercise):'';
  const coach=paused?'En pause. Reprends quand tu es prêt.':countdown==='ready'?'Mets-toi en place.':countdown==='switch'?'Change de côté, même consigne.':guided?move.instructions[0]:phase==='warmup'?'Des gestes faciles. On se met en mouvement.':phase==='rest'?(timerLeft===0?'C’est reparti.':'Souffle. Relâche les épaules.'):allDone?'Toutes les séries sont validées.':exercise.instructions[0];
  const mainAction=()=>{if(paused){pause();return;}if(countdown){fired.current.add(`${draft.timer.id}-next`);segmentEnd.current(draft.timer.id);return;}if(phase==='cooldown'){if(lastMove)endCooldown();else stepMove(1);return;}if(blocked||!permitted){go('symptoms');return;}if(phase==='warmup'&&guided&&!lastMove){stepMove(1);return;}if(phase==='warmup'||phase==='rest'){beginWork();return;}if(allDone){if(!startCooldown())review();return;}validateNext();};
  const actionLabel=paused?'Reprendre la séance':countdown?'C’est parti':phase==='cooldown'?(lastMove?'Terminer la séance':'Étirement suivant'):blocked||!permitted?'Voir mes douleurs':phase==='warmup'?(guided&&!lastMove?'Mouvement suivant':'Échauffement effectué'):phase==='rest'?(timerLeft>0?'Passer le repos':'Commencer la série'):allDone?'Terminer la séance':repsSides&&draft.side!==2&&!row.done?'Fait · côté gauche':'Fait';
  const upcoming=guided&&!lastMove?{exercise:moves[moveIndex+1],label:phase==='warmup'?'Mouvement suivant':'Étirement suivant'}:phase==='warmup'?{step,exercise}:null;
  const adjustRest=delta=>setDraft(d=>{const t=d.timer;if(!t||t.kind!=='rest')return d;const left=Math.max(5,(t.endAt?Math.ceil((t.endAt-Date.now())/1000):t.remaining)+delta);return {...d,timer:{...t,duration:Math.max(t.duration,left),remaining:left,endAt:t.endAt?Date.now()+left*1000:null}};});
  // Position : exercice n sur N, série a sur b, et une barre par exercice découpée en séries.
  const exerciseSets=draft.exercises.map(e=>({e,rows:draft.entries[e.id]||[]}));
  const restNext=phase==='rest'?{exercise,step}:null;
  const timerName=countdown?draft.timer.label:phase==='rest'?'Repos':phase==='warmup'?'Échauffement':phase==='cooldown'?'Retour au calme':'Travail';
  // Mini-lecteur du dock : la série qui suit, pendant le travail seulement (le repos l'affiche déjà en grand).
  const nextStep=nextIndex>=0?steps[nextIndex]:null,nextExercise=nextStep&&draft.exercises.find(e=>e.id===nextStep.id);
  const dockNext=phase==='work'&&!countdown&&nextExercise?{exercise:nextExercise,meta:`Série ${nextStep.set+1}/${nextExercise.sets}`}:null;
  const toggleVoice=()=>{const on=!voice;update(s=>({...s,preferences:{...s.preferences,voice:on}}));if(on)ptSay('Coach activé.');else try{window.speechSynthesis?.cancel();}catch(e){}};
  return <div className={`live-session phase-${phase}${countdown?` is-${countdown}`:''}`}>
    <header className="live-topbar"><button className="icon-button" aria-label="Revenir à l’accueil" onClick={()=>go('today')}><PTIcon name="back"/></button><div className="live-position">{phase==='warmup'||phase==='cooldown'?<><span className="eyebrow"><span className={`live-dot${paused?' paused':''}`}/>{phase==='warmup'?'Avant de commencer':'Après l’effort'}</span><strong>{phase==='warmup'?'Échauffement':'Retour au calme'}{guided?` · ${moveIndex+1} sur ${moves.length}`:''}</strong></>:<><span className="eyebrow"><span className={`live-dot${paused?' paused':''}`}/>Exercice {exerciseIndex+1} sur {draft.exercises.length}</span><strong>Série <PTRoll value={step.set+1}/> sur {exercise.sets}</strong></>}</div><div className="live-topbar-actions"><button className="icon-button" aria-label={voice?'Couper la voix du coach':'Activer la voix du coach'} aria-pressed={voice} onClick={toggleVoice}><PTIcon name={voice?'sound':'mute'} size={20}/></button><button className="icon-button" aria-label="Options de séance" aria-expanded={menu} onClick={()=>{setMenu(!menu);setAbandon(false);}}><PTIcon name="more" size={20}/></button></div></header>
    {menu&&<div className="live-menu stack-sm" role="group" aria-label="Options de séance">
      {abandon?<div className="notice warning stack-sm live-cancel-confirm" role="alert"><p>Annuler la séance sans enregistrer ? Les séries faites seront perdues.</p><PTButton danger onClick={()=>{update(s=>({...s,draft:null}));go('today');}}>Oui, annuler sans enregistrer</PTButton><PTButton quiet onClick={()=>setAbandon(false)}>Garder ma séance</PTButton></div>:<>
      <PTButton quiet onClick={review}>Terminer ici</PTButton>
      <PTButton quiet onClick={()=>{setMenu(false);setDraft(d=>{const entries={};const exercises=d.exercises.map(e=>{const rows=d.entries[e.id],done=rows.filter(r=>r.done),pending=rows.find(r=>!r.done&&!r.pain);entries[e.id]=pending?[...done,pending]:done;return {...e,sets:entries[e.id].length};}).filter(e=>e.sets);if(!exercises.length)return d;const sequence=PT.schedule(exercises,d.format),next=sequence.findIndex(s=>!entries[s.id][s.set].done);return {...d,entries,exercises,cursor:Math.max(0,next),timer:null,side:null,stageElapsed:0,stageStarted:paused?null:Date.now(),shortened:true};});notify('Une série restante par exercice. Tes résultats sont conservés.');}}>Raccourcir la fin · 10 min</PTButton>
      <details className="disclosure"><summary>Voir les séries / corriger un résultat</summary><div className="set-history">{steps.map((s,i)=><button key={`${s.id}-${s.set}`} className={`${draft.entries[s.id][s.set].done?'done ':''}${i===cursor?'current':''}`} aria-label={`${draft.exercises.find(e=>e.id===s.id).name}, série ${s.set+1}`} onClick={()=>jump(i)}>{i+1}{draft.entries[s.id][s.set].done?' ✓':''}</button>)}</div></details>
      <PTButton danger onClick={()=>setAbandon(true)}><PTIcon name="close" size={18}/>Annuler la séance</PTButton></>}
    </div>}
    <div className="live-progress" aria-label={`${completed} séries validées sur ${total}`}>{exerciseSets.map(({e,rows},i)=><span key={e.id} className={`ex-seg${phase!=='warmup'&&i===exerciseIndex?' current':''}`}>{rows.map((r,k)=><i key={k} className={r.done?'done':phase!=='warmup'&&i===exerciseIndex&&k===step.set?'now':''}/>)}</span>)}</div>
    {phase==='rest'?<section className="rest-screen" aria-live="polite">
      <div className={`live-timer rest-timer score${paused?' paused':''}`} role="timer" aria-label={`Repos : ${timeLabel(timerLeft)}`}>
        <strong>{timeLabel(timerLeft)}</strong>
        <small>{timerLeft>0?'Repos':'Repos terminé'} · {paused?'en pause':timerLeft>0?'souffle, relâche les épaules':'c’est reparti'}</small>
        <i className="score-bar" aria-hidden="true"><b style={{transform:`scaleX(${Math.min(1,timerLeft/(draft.timer.duration||1))})`}}/></i>
      </div>
      <div className="rest-adjust"><button type="button" onClick={()=>adjustRest(-15)} disabled={paused||timerLeft<=5}>−15 s</button><button type="button" className="transport-pause" aria-label={paused?'Reprendre le chrono':'Mettre en pause'} onClick={pause}><PTIcon name={paused?'play':'pause'} size={22}/></button><button type="button" onClick={()=>adjustRest(15)} disabled={paused}>+15 s</button></div>
      <div className="next-up rest-next"><PTThumbnail exercise={restNext.exercise}/><div><small>Ensuite · exercice {exerciseIndex+1} sur {draft.exercises.length}</small><strong>{restNext.exercise.name}</strong><small>Série {restNext.step.set+1} sur {restNext.exercise.sets}{lastSet?' · dernière':''}</small>{ptWhy(restNext.exercise)&&<small className="rest-why">{ptWhy(restNext.exercise)}</small>}</div></div>
    </section>:<>
    <section className="live-command">
      <div className="score-board">
      {countdown?<div className={`live-countdown score${paused?' paused':''}`} role="timer" aria-label={`${timerName} : ${timeLabel(shownTime)}`}><strong><PTRoll value={Math.max(0,shownTime)}/></strong><small>{countdown==='switch'?'Change de côté':'Prépare-toi'}</small></div>
      :phase==='work'&&!activeTimer&&exercise.measure!=='seconds'?<div className="live-target score" aria-label={`Objectif : ${ptRepsGoal(exercise)}`}><strong>{ptRepsGoal(exercise).split(' ')[0]}</strong><span>{ptRepsGoal(exercise).split(' ').slice(1).join(' ').replace(' / côté',repsSides?' de ce côté':'')}</span></div>:<div className={`live-timer score${paused?' paused':''}`} role="timer" aria-label={`${timerName} : ${timeLabel(shownTime)}`}>
        <strong>{timeLabel(shownTime)}</strong>
        <small>{paused?'En pause':activeTimer?'Temps restant':'Temps de série'}</small>
        {activeTimer&&<i className="score-bar" aria-hidden="true"><b style={{transform:`scaleX(${Math.min(1,shownTime/(activeTimer.duration||1))})`}}/></i>}
      </div>}
      <div className="session-transport">{guided&&<button type="button" aria-label={phase==='warmup'?'Mouvement précédent':'Étirement précédent'} disabled={moveIndex===0} onClick={()=>stepMove(-1)}><PTIcon name="back" size={20}/></button>}{!guided&&phase!=='warmup'&&<button type="button" aria-label="Série précédente" disabled={cursor===0} onClick={()=>jump(cursor-1)}><PTIcon name="back" size={20}/></button>}<button type="button" className="transport-pause" aria-label={paused?'Reprendre le chrono':'Mettre en pause'} onClick={pause}><PTIcon name={paused?'play':'pause'} size={24}/></button>{guided&&<button type="button" className="transport-validate" aria-label={lastMove?(phase==='warmup'?'Commencer la séance':'Terminer la séance'):(phase==='warmup'?'Mouvement suivant':'Étirement suivant')} disabled={paused} onClick={mainAction}><PTIcon name="arrow" size={20}/></button>}{!guided&&phase!=='warmup'&&<button type="button" className="transport-validate" aria-label={row.done?'Série suivante':'Valider la série et passer à la suite'} disabled={paused||row.done&&nextIndex<0&&!allDone} onClick={()=>{if(countdown){mainAction();return;}validateNext();}}><PTIcon name="arrow" size={20}/></button>}</div>
      </div>
      <div className="live-heading">{sideLabel&&<span className="side-badge">{sideLabel}</span>}<h1>{guided?move.name:phase==='warmup'?'On y va doucement.':exercise.name}</h1>{why&&<p className="live-why"><PTIcon name="basket" size={15}/><span>{why}</span></p>}</div>
    </section>
    <div className="live-visual">{guided?<PTDemo minimal key={`${phase}-${move.id}`} exercise={move}/>:phase==='warmup'?<div className="warmup-visual"><PTIcon name="body" size={80}/><span>On réveille le corps.</span></div>:<PTDemo minimal key={exercise.id} exercise={exercise}/>}</div>
    <div className="live-cues">
      <p className="live-coach" aria-live="polite"><PTIcon name="spark" size={17}/>{coach}</p>
      {phase!=='cooldown'&&(blocked||!permitted)?<div className="notice warning">{blocked?'Séance suspendue : fais le point sur la douleur signalée.':'Ce mouvement ne convient plus à tes contraintes actuelles.'}</div>:null}
      {phase==='work'&&exercise.audio&&<PTAudioCue/>}
      {draft.blockTimer&&draft.format!=='amrap'&&<span className="caption">Bloc {draft.format.toUpperCase()} · {timeLabel(remaining(draft.blockTimer))}</span>}
    </div></>}
    {(phase==='work'||phase==='rest')&&<section className="session-list" aria-label="Ta séance">
      <h2>Ta séance</h2>
      <ol>{exerciseSets.map(({e,rows},i)=>{const done=rows.length>0&&rows.every(r=>r.done||r.pain),current=i===exerciseIndex&&!done;
        return <li key={e.id} className={current?'is-current':done?'is-done':''} aria-current={current?'step':undefined}>
          <span className="session-list-n">{i+1}</span>
          <span className="session-list-name"><strong>{e.name}</strong><small>{current?`Série ${step.set+1} sur ${e.sets}`:ptSetLine(e)}</small></span>
          {done?<PTIcon name="check" size={20}/>:<span className="session-list-sets">{rows.filter(r=>r.done).length}/{rows.length}</span>}
        </li>;})}</ol>
    </section>}
    <div className="live-extras">
      {upcoming&&<div className="next-up"><PTThumbnail exercise={upcoming.exercise}/><div><small>{upcoming.label||'Pour commencer'}</small><strong>{upcoming.exercise.name}</strong>{upcoming.step?<small>Série {upcoming.step.set+1} / {upcoming.exercise.sets}</small>:<small>{upcoming.exercise.unilateral?`${ptSideSeconds(upcoming.exercise)} s par côté`:`${ptMoveSeconds(upcoming.exercise)} s`}</small>}</div></div>}
      {guided&&<details className="disclosure"><summary>Comment faire</summary><ol className="instruction-list">{move.instructions.map((line,i)=><li key={i}>{line}</li>)}</ol>{move.warning&&<p className="notice warning">{move.warning}</p>}</details>}
      {phase==='warmup'&&<button className="text-button" onClick={()=>{setDraft(d=>({...d,warmupSkipped:true}));beginWork();}}>{guided?'Passer l’échauffement (déjà fait)':'Je l’ai déjà fait avant d’ouvrir l’app'}</button>}
      {phase==='cooldown'&&<button className="text-button" onClick={endCooldown}>Passer le retour au calme</button>}
      {phase==='work'&&<details className="disclosure"><summary>Comment faire</summary><div className="stack"><ol className="instruction-list">{exercise.instructions.map((line,i)=><li key={i}>{line}</li>)}</ol><PTExerciseMetrics exercise={exercise} weight={row.weight||PT.loadAdvice(exercise,data,draft.check)?.value}/>{exercise.sideNote&&<p className="notice side-note"><strong>{exercise.weakSide?'Jambe faible':'Équilibre gauche / droite'} · </strong>{exercise.sideNote}</p>}{exercise.warning&&<p className="notice warning">{exercise.warning}</p>}{PT.loadAdvice(exercise,data,draft.check)&&<p className="fine">{PT.loadAdvice(exercise,data,draft.check).text}</p>}</div></details>}
      {allDone&&['amrap','emom'].includes(draft.format)&&<PTButton quiet disabled={paused||blocked} onClick={addRound}>Ajouter un tour<PTIcon name="plus" size={18}/></PTButton>}
      {!blocked&&!permitted&&<PTButton quiet onClick={()=>{const next=steps.findIndex((s,i)=>i>cursor&&PT.allowed(draft.exercises.find(e=>e.id===s.id),data,draft.check));if(next<0)review();else setDraft(d=>({...d,cursor:next,timer:null,side:null,stageElapsed:0,stageStarted:null}));}}>Passer à un mouvement compatible</PTButton>}
    </div>
    <footer className="live-dock">
      {dockNext&&<div className="dock-next"><PTThumbnail exercise={dockNext.exercise}/><span><small>Ensuite</small><strong>{dockNext.exercise.name}</strong></span><em>{dockNext.meta}</em></div>}
      <i className="dock-progress" aria-hidden="true"><b style={{transform:`scaleX(${total?completed/total:0})`}}/></i>
      <div className="dock-caption">{phase==='work'&&!countdown&&!row.done&&!allDone?<button className="text-button" onClick={openLog}>Ajuster la série</button>:<span>{phase==='rest'?'Repos en cours':phase==='warmup'?'Prépare-toi':phase==='cooldown'?'Retour au calme':`${completed}/${total} séries validées`}</span>}<button className="text-button" onClick={reportPain}>Une douleur ?</button></div><PTButton primary onClick={mainAction}><PTIcon name={paused?'play':phase==='work'&&!countdown?'check':'arrow'} size={22}/>{actionLabel}</PTButton></footer>
    {logging&&<PTSetSheet exercise={exercise} row={row} onChange={updateRow} onClose={()=>setLogging(false)} onSave={()=>advance()} onQuick={quickRow()&&!row.done?()=>advance(quickRow(),true):null} error={error}/>}
  </div>;
}
