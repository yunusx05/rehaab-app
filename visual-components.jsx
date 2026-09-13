/* Visual components share the existing React runtime and local training state. */
const ptMuscleLabels={chest:'Pectoraux',back:'Dos',shoulders:'Épaules',arms:'Bras',quads:'Quadriceps',glutes:'Fessiers',hamstrings:'Ischio-jambiers',calves:'Mollets',core:'Abdominaux'};
function ptMuscles(e){
  const source=window.RehaabMedia?.[e.id]?.muscles;
  const translate={chest:'chest',lats:'back','middle back':'back','lower back':'back',traps:'back',shoulders:'shoulders',biceps:'arms',triceps:'arms',forearms:'arms',quadriceps:'quads',glutes:'glutes',hamstrings:'hamstrings',calves:'calves',abdominals:'core'};
  if(source?.length)return [...new Set(source.map(m=>translate[m]).filter(Boolean))];
  const specific={'db-shoulder':['shoulders'],lateral:['shoulders'],deadbug:['core'],bridge:['glutes'],legextension:['quads'],legcurl:['hamstrings'],copenhagen:['core'],rdl:['hamstrings','glutes']};
  return specific[e.id]||({push:['chest','shoulders'],pull:['back'],arms:['arms'],squat:['quads','glutes'],hinge:['glutes','hamstrings'],core:['core'],calf:['calves']}[e.pattern]||[]);
}
function ptKindIcon(e){return {strength:'weight',basket:'basket',cardio:'run',mobility:'body',plyo:'spark'}[e.kind]||'body';}
function PTThumbnail({exercise:e,animated=false}){
  const [failed,setFailed]=usePTState(false),[visible,setVisible]=usePTState(false),m=window.RehaabMedia?.[e.id],container=usePTRef(null),video=usePTRef(null);
  usePTEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));if(container.current)observer.observe(container.current);return()=>observer.disconnect();},[]);
  usePTEffect(()=>{const el=video.current;if(!el)return;if(animated&&visible)el.play().catch(()=>{});else el.pause();},[animated,visible]);
  const src=m?.poster||(m?.frames?`media/${m.frames}/0.jpg`:null);
  return <span ref={container} className={`movement-thumb${src&&!failed?' has-image':''}${animated&&visible?' animating':''}`}>{src&&!failed?<><img loading="lazy" src={src} alt={`Position de ${e.name}`} onError={()=>setFailed(true)}/>{m?.video&&animated&&visible?<video ref={video} src={m.video} poster={src} muted loop playsInline autoPlay preload="none" aria-hidden="true" onError={()=>setFailed(true)}/>:m?.frames&&animated&&visible?<img className="thumb-second" src={`media/${m.frames}/1.jpg`} alt="" loading="lazy"/>:null}</>:<PTIcon name={ptKindIcon(e)} size={38}/>}<span className="thumb-type"><PTIcon name={m?.video?'play':src?'body':ptKindIcon(e)} size={13}/>{m?.video?'Vidéo':src?'Positions':e.kind==='basket'?'Technique':'Repères'}</span></span>;
}
function PTExerciseMetrics({exercise:e,weight}){
  const target=e.measure==='seconds'?`${e.seconds}s`:e.targetMin&&e.targetMax&&e.targetMin!==e.targetMax?`${e.targetMin}–${e.targetMax}`:e.targetMax||e.max;
  return <div className={`exercise-metrics${e.weighted?' with-weight':''}`}><div><span><PTIcon name="refresh" size={14}/>Séries</span><strong>{e.sets}</strong></div><div><span><PTIcon name={e.measure==='seconds'?'clock':e.measure==='shots'?'basket':'body'} size={14}/>{e.measure==='seconds'?'Durée':e.measure==='shots'?'Tirs':'Reps'}</span><strong>{target}</strong>{e.unilateral&&<small>/ côté</small>}</div>{e.weighted&&<div><span><PTIcon name="weight" size={14}/>Charge</span><strong>{weight?`${weight}`:'—'}{weight&&<small> kg</small>}</strong></div>}<div><span><PTIcon name="heart" size={14}/>Repos</span><strong>{e.rest}<small> s</small></strong></div></div>;
}
function PTRing({value,total,label,children}){
  const ratio=Math.min(1,Math.max(0,total?value/total:0));
  return <div className="activity-ring" role="img" aria-label={label}><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="ring-track" cx="60" cy="60" r="51"/><circle className="ring-value" cx="60" cy="60" r="51" pathLength="100" strokeDasharray={`${ratio*100} 100`}/></svg><div className="ring-content">{children}</div></div>;
}
function PTWeekPulse({data}){
  const summary=PT.weeklySummary(data),monday=new Date(`${PT.dateKey()}T12:00:00`);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
  return <section className="week-pulse"><div className="topline"><span className="eyebrow">Ton rythme cette semaine</span><span className="caption">{summary.minutes} min</span></div><div className="week-calendar">{Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);const key=PT.dateKey(d),done=data.sessions.some(s=>s.date===key),today=key===PT.dateKey();return <div key={key} className={`day-cell${today?' is-today':''}${done?' is-done':''}`} aria-label={`${d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric'})}${done?', séance enregistrée':''}${today?', aujourd’hui':''}`}><small>{['L','M','M','J','V','S','D'][i]}</small><span>{done?<PTIcon name="check" size={16}/>:d.getDate()}</span></div>;})}</div></section>;
}
function PTRewards({data,notify,compact=false}){
  const summary=PT.weeklySummary(data),count=new Set(data.sessions.map(s=>s.id)).size;
  const badges=[{title:'Premier pas',goal:1,icon:'play'},{title:'Bien lancé',goal:5,icon:'spark'},{title:'Dans le rythme',goal:10,icon:'check'}];
  const copy=async()=>{try{await navigator.clipboard.writeText(`Mon défi Rehaab cette semaine : ${summary.sessions}/${summary.target} séances, ${summary.minutes} minutes pour moi. On se motive ensemble, chacun à son rythme ?`);notify('Bilan copié. Tu peux le partager avec tes amis.');}catch(e){notify('Copie indisponible sur ce navigateur. Ton bilan reste affiché ici.');}};
  return <section className={`reward-card${compact?' compact':''}`}><div className="reward-main"><PTRing value={summary.sessions} total={summary.target} label={`${summary.sessions} séances sur ${summary.target} cette semaine`}><strong>{summary.sessions}<small>/{summary.target}</small></strong><span>séances</span></PTRing><div><div className="eyebrow">Défi de la semaine</div><h2>{summary.sessions>=summary.target?'Objectif atteint.':'À ton rythme.'}</h2><p className="fine">{summary.sessions>=summary.target?'Profite aussi des jours de repos.':`${Math.max(0,summary.target-summary.sessions)} séance${summary.target-summary.sessions>1?'s':''} pour ton repère hebdo.`}</p><span className="reward-points">{count*50} points de régularité</span></div></div>{!compact&&<><div className="badge-shelf">{badges.map(b=><div className={`earned-badge${count>=b.goal?' unlocked':''}`} key={b.goal}><span><PTIcon name={b.icon} size={24}/></span><strong>{b.title}</strong><small>{Math.min(count,b.goal)}/{b.goal} séances</small></div>)}</div><p className="caption">50 points par séance enregistrée, même partielle. Aucune course à l’intensité.</p><button className="text-button accent-text" onClick={copy}><PTIcon name="copy" size={16}/>Copier mon bilan pour mes amis</button></>}</section>;
}
function PTAdaptation({data}){
  const latest=[...data.sessions].sort((a,b)=>b.date.localeCompare(a.date)||String(b.completedAt).localeCompare(String(a.completedAt)))[0];
  if(!latest?.effort)return null;
  const recent=PT.dayDiff(PT.dateKey(),latest.date)>=0&&PT.dayDiff(PT.dateKey(),latest.date)<=2;
  const hard=Number(latest.effort)>=8&&recent;
  return <div className="adaptation-note"><span className="small-icon"><PTIcon name={hard?'heart':'chart'} size={22}/></span><div><strong>{hard?'La suite sera plus douce':'Ton ressenti est enregistré'}</strong><p className="fine">{hard?'Effort élevé récemment : volume réduit et format contrôlé.':`Dernière séance : ${latest.effort}/10. Les hausses de charge restent liées à tes séries et à ta technique.`}</p></div></div>;
}
