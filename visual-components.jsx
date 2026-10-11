/* Visual components share the existing React runtime and local training state. */
const ptMuscleLabels={chest:'Pectoraux',back:'Dos',shoulders:'Épaules',arms:'Bras',quads:'Quadriceps',glutes:'Fessiers',hamstrings:'Ischio-jambiers',calves:'Mollets',core:'Abdominaux'};
// Dose affichée dans les listes de séance : « 3 × 8–10 », « 3 × 30 s », « 3 × 10 tirs ».
const ptDoseLabel = e => e.measure === 'seconds' ? `${e.sets} × ${e.seconds} s`
  : e.measure === 'shots' ? `${e.sets} × ${e.targetMax || e.max} tirs`
  : `${e.sets} × ${e.targetMin === e.targetMax ? e.targetMax : `${e.targetMin}–${e.targetMax}`}${e.unilateral ? ' / côté' : ''}`;
function ptMuscles(e){
  const source=window.RehaabMedia?.[e.id]?.muscles;
  const translate={chest:'chest',lats:'back','middle back':'back','lower back':'back',traps:'back',shoulders:'shoulders',biceps:'arms',triceps:'arms',forearms:'arms',quadriceps:'quads',glutes:'glutes',hamstrings:'hamstrings',calves:'calves',abdominals:'core'};
  if(source?.length)return [...new Set(source.map(m=>translate[m]).filter(Boolean))];
  const specific={'db-shoulder':['shoulders'],lateral:['shoulders'],deadbug:['core'],bridge:['glutes'],legextension:['quads'],legcurl:['hamstrings'],copenhagen:['core'],rdl:['hamstrings','glutes']};
  return specific[e.id]||({push:['chest','shoulders'],pull:['back'],arms:['arms'],squat:['quads','glutes'],hinge:['glutes','hamstrings'],core:['core'],calf:['calves']}[e.pattern]||[]);
}
function ptKindIcon(e){return {strength:'weight',basket:'basket',cardio:'run',mobility:'body',plyo:'spark'}[e.kind]||'body';}
function PTThumbnail({exercise}){
  const e=exercise||{},m=window.RehaabMedia?.[e.id];
  // Cards stay still and fill their frame; videos are reserved for the exercise demonstration.
  const sources=[m?.card,m?.poster,m?.frames&&`media/${m.frames}/0.webp`].filter(Boolean);
  const [attempt,setAttempt]=usePTState(0),src=sources[attempt];
  usePTEffect(()=>setAttempt(0),[e.id]);
  return <span className={`movement-thumb${src?' has-image':''}`}>{src?<img loading="lazy" decoding="async" src={src} alt="" onError={()=>setAttempt(a=>a+1)}/>:<PTIcon name={ptKindIcon(e)} size={38}/>}<span className="thumb-type"><PTIcon name={m?.video?'play':m?.frames?'body':ptKindIcon(e)} size={13}/>{m?.video?'Vidéo':m?.frames?'Positions':e.kind==='basket'?'Technique':'Repères'}</span></span>;
}
function PTExerciseMetrics({exercise:e,weight}){
  const target=e.measure==='seconds'?`${e.seconds}s`:e.targetMin&&e.targetMax&&e.targetMin!==e.targetMax?`${e.targetMin}–${e.targetMax}`:e.targetMax||e.max;
  return <div className={`exercise-metrics${e.weighted?' with-weight':''}`}><div><span><PTIcon name="refresh" size={14}/>Séries</span><strong>{e.sets}</strong></div><div><span><PTIcon name={e.measure==='seconds'?'clock':e.measure==='shots'?'basket':'body'} size={14}/>{e.measure==='seconds'?'Durée':e.measure==='shots'?'Tirs':'Reps'}</span><strong>{target}</strong>{e.unilateral&&<small>/ côté</small>}</div>{e.weighted&&<div><span><PTIcon name="weight" size={14}/>Charge</span><strong>{weight?`${weight}`:'—'}{weight&&<small> kg</small>}</strong></div>}<div><span><PTIcon name="heart" size={14}/>Repos</span><strong>{e.rest}<small> s</small></strong></div></div>;
}
function PTRing({value,total,label,children}){
  const ratio=Math.min(1,Math.max(0,total?value/total:0));
  return <div className="activity-ring" role="img" aria-label={label}><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="ring-track" cx="60" cy="60" r="51"/><circle className="ring-value" cx="60" cy="60" r="51" pathLength="100" strokeDasharray={`${ratio*100} 100`}/></svg><div className="ring-content">{children}</div></div>;
}
function PTRewards({data,notify,compact=false}){
  const summary=PT.weeklySummary(data),count=new Set(data.sessions.map(s=>s.id)).size;
  const badges=[{title:'Premier pas',goal:1,icon:'play'},{title:'Bien lancé',goal:5,icon:'spark'},{title:'Dans le rythme',goal:10,icon:'check'}];
  const copy=async()=>{try{await navigator.clipboard.writeText(`Mon défi Rehaab cette semaine : ${summary.sessions}/${summary.target} séances, ${summary.minutes} minutes pour moi. On se motive ensemble, chacun à son rythme ?`);notify('Bilan copié. Tu peux le partager avec tes amis.');}catch(e){notify('Copie indisponible sur ce navigateur. Ton bilan reste affiché ici.');}};
  return <section className={`reward-card${compact?' compact':''}`}><div className="reward-main"><PTRing value={summary.sessions} total={summary.target} label={`${summary.sessions} séances sur ${summary.target} cette semaine`}><strong>{summary.sessions}<small>/{summary.target}</small></strong><span>séances</span></PTRing><div><div className="eyebrow">Défi de la semaine</div><h2>{summary.sessions>=summary.target?'Objectif atteint.':'À ton rythme.'}</h2><p className="fine">{summary.sessions>=summary.target?'Profite aussi des jours de repos.':`${Math.max(0,summary.target-summary.sessions)} séance${summary.target-summary.sessions>1?'s':''} pour ton repère hebdo.`}</p><span className="reward-points">{count*50} points de régularité</span></div></div>{!compact&&<><div className="badge-shelf">{badges.map(b=><div className={`earned-badge${count>=b.goal?' unlocked':''}`} key={b.goal}><span><PTIcon name={b.icon} size={24}/></span><strong>{b.title}</strong><small>{Math.min(count,b.goal)}/{b.goal} séances</small></div>)}</div><p className="caption">50 points par séance enregistrée, même partielle. Aucune course à l’intensité.</p><button className="text-button accent-text" onClick={copy}><PTIcon name="copy" size={16}/>Copier mon bilan pour mes amis</button></>}</section>;
}// Tuile photo : la photo porte le sujet, le texte reste lisible grâce au dégradé. Sans photo, un fond neutre la remplace.
function PTImageTile({photo,eyebrow,title,text,badge,done=false,progress,onClick,tall=false}){
  const [failed,setFailed]=usePTState(false);
  return <button type="button" className={`image-tile${tall?' tall':''}${done?' is-done':''}`} onClick={onClick}>
    {photo&&!failed&&<img src={photo} alt="" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>}
    <span className="image-tile-shade" aria-hidden="true"/>
    {(badge||done)&&<span className={`image-tile-badge${done?' done':''}`}>{done?<><PTIcon name="check" size={13}/>Fait</>:badge}</span>}
    <span className="image-tile-body">{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<strong>{title}</strong>{text&&<small>{text}</small>}
      {progress&&progress.total>0&&<span className="image-tile-progress" aria-label={`${progress.count} réponses sur ${progress.total}`}><span style={{width:`${Math.round(progress.count/progress.total*100)}%`}}/></span>}</span>
  </button>;
}
// Carte héros photo : en-tête vivant d'un écran, avec une action principale.
const ptHub=key=>`media/ui/hub/${key}.webp`;
// Photo de la séance du jour selon ce que l'app propose.
function ptTodayPhoto(action,data){
  if(action==='pathway')return `media/pathway/${Math.min(5,Math.max(1,data.pathway?.step||1))}.webp`;
  return ptHub({skills:'skills',program:'muscu',symptoms:'recovery',rehab:'recovery',mobility:'recovery',warmup:'week',session:'library'}[action]||'library');
}
function PTHeroCard({photo,eyebrow,title,children,aside}){
  const [failed,setFailed]=usePTState(false);
  return <section className="photo-hero">
    {photo&&!failed&&<img src={photo} alt="" decoding="async" onError={()=>setFailed(true)}/>}
    <span className="photo-hero-shade" aria-hidden="true"/>
    <div className="photo-hero-body"><div className="photo-hero-top">{eyebrow&&<span className="eyebrow">{eyebrow}</span>}{aside}</div><h2>{title}</h2>{children}</div>
  </section>;
}
