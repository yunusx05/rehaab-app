/* Shared sport UI. Training decisions continue to live in PersonalTraining. */
function usePTMotionPreference(){
  const [reduced,setReduced]=usePTState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  usePTEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const changed=()=>setReduced(query.matches);query.addEventListener('change',changed);return()=>query.removeEventListener('change',changed);},[]);
  return reduced;
}
function usePTVisibleMedia(ref,playing,source,onIntent){
  usePTEffect(()=>{
    const el=ref.current;if(!el||!source)return;
    let visible=false,system=false;
    const onscreen=()=>visible&&document.visibilityState==='visible';
    const sync=()=>{
      if(playing&&onscreen()){el.muted=true;if(el.paused)el.play().catch(err=>{if(err?.name==='NotAllowedError')onIntent?.(false);});}
      else if(!el.paused){system=true;el.pause();}
    };
    // Native controls and the custom button share one intent; pauses caused by scrolling or a hidden tab are not user choices.
    const paused=()=>{if(system){system=false;return;}if(onscreen())onIntent?.(false);};
    const played=()=>{if(!playing)onIntent?.(true);};
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:.12});
    observer.observe(el);document.addEventListener('visibilitychange',sync);el.addEventListener('canplay',sync);el.addEventListener('pause',paused);el.addEventListener('play',played);
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);el.removeEventListener('canplay',sync);el.removeEventListener('pause',paused);el.removeEventListener('play',played);el.pause();};
  },[playing,source]);
}
function PTSportMotion({children,identity}){
  const ref=usePTRef(null),reduced=usePTMotionPreference();
  usePTEffect(()=>{
    if(reduced||!window.gsap||!window.ScrollTrigger)return;
    gsap.registerPlugin(ScrollTrigger);
    const context=gsap.context(()=>{
      gsap.from('.sport-reveal',{y:12,opacity:0,duration:.28,stagger:.04,ease:'power3.out',clearProps:'all'});
      gsap.utils.toArray('.scroll-reveal').forEach(el=>gsap.from(el,{y:16,scale:.98,opacity:0,duration:.4,ease:'power3.out',clearProps:'all',scrollTrigger:{trigger:el,start:'top 94%',once:true}}));
    },ref);
    return()=>context.revert();
  },[identity,reduced]);
  return <div ref={ref}>{children}</div>;
}
// Zones traced over media/body renders in viewBox units: left-side points, mirrored as a pair or closed across the midline.
const ptBodyZones={
  front:[['shoulders','Épaules','pair','99 59 86 61 76 67 70 78 68 92 72 102 84 104 90 96 93 84 96 72 102 64'],['arms','Bras','pair','71 103 64 114 56 130 48 150 44 168 60 172 67 166 74 150 81 134 87 118 89 106 84 105'],['chest','Pectoraux','pair','119 65 104 62 96 68 92 80 93 92 99 98 110 101 119 99'],['core','Abdominaux','center','120 101 110 102 99 99 93 106 91 122 93 138 98 149 108 160 120 167'],['quads','Quadriceps','pair','96 152 89 166 87 190 89 215 92 236 100 246 110 244 116 232 118 206 118 186 110 172'],['calves','Mollets','pair','88 250 85 268 89 292 95 312 105 313 110 294 115 270 115 251 104 247']],
  back:[['shoulders','Épaules','pair','101 58 86 61 76 67 70 78 68 92 72 102 84 104 90 96 92 84 94 72 100 64'],['arms','Bras','pair','71 103 64 114 56 130 48 150 44 168 60 172 67 166 74 150 81 134 87 118 89 106 84 105'],['back','Dos','center','120 48 110 50 102 60 95 68 93 82 90 98 91 114 95 128 99 142 110 147 120 149'],['glutes','Fessiers','pair','119 150 108 147 98 149 92 160 90 172 95 182 106 187 118 185'],['hamstrings','Ischio-jambiers','pair','90 178 87 195 89 215 92 238 100 246 111 244 116 230 118 206 118 188 106 190 95 185'],['calves','Mollets','pair','88 250 85 268 89 292 95 312 105 313 110 294 115 270 115 251 104 247']]
};
const ptBodyPaths=Object.fromEntries(Object.entries(ptBodyZones).map(([view,zones])=>[view,zones.map(([id,label,kind,list])=>{
  const n=list.split(' ').map(Number),left=n.flatMap((x,i)=>i%2?[]:[[x,n[i+1]]]),right=left.map(([x,y])=>[240-x,y]),path=points=>`M${points.join(' ')}Z`;
  return {id,label,d:kind==='pair'?path(left)+path(right):path([...left,...right.reverse().filter(([x])=>x!==120)])};
})]));
function PTBodyMap({selected='all',onSelect,back=false}){
  const uid=React.useId().replace(/:/g,''),view=back?'back':'front',src=`media/body/${view}.webp`;
  usePTEffect(()=>{['front','back'].forEach(v=>{new Image().src=`media/body/${v}.webp`;});},[]);
  const toggle=id=>onSelect?.(selected===id?'all':id);
  // The render's own alpha clips the highlight to the body, so zone outlines only need to be precise between muscles.
  return <svg className="body-map" viewBox="0 0 240 350" role="group" aria-label={`Carte des muscles, ${back?'dos':'face'}`}>
    <defs>
      <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="350" style={{maskType:'alpha'}}><image href={src} width="240" height="350"/></mask>
      <filter id={`${uid}f`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>
    </defs>
    <ellipse cx="120" cy="336" rx="48" ry="5" fill="#0000004d"/>
    <image href={src} width="240" height="350" aria-hidden="true"/>
    <g className="muscle-layer" mask={`url(#${uid}m)`}>
      {ptBodyPaths[view].map(({id,label,d})=><path key={id} className={`muscle-zone${selected===id?' selected':''}`} d={d} filter={`url(#${uid}f)`} onClick={()=>toggle(id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(id);}}} tabIndex={onSelect?0:undefined} role={onSelect?'button':undefined} aria-label={label} aria-pressed={onSelect?selected===id:undefined}><title>{label}</title></path>)}
    </g>
  </svg>;
}
function PTMuscleExplorer({value,onChange}){
  const [back,setBack]=usePTState(false);
  return <section className="muscle-explorer"><div className="muscle-copy"><span className="eyebrow">Cible ta séance</span><h2>{value==='all'?<>QUEL<br/>MUSCLE ?</>:ptMuscleLabels[value]}</h2><p className="fine">Touche une zone.</p><button className="chip rotate-body" onClick={()=>setBack(!back)}><PTIcon name="refresh" size={16}/>{back?'Voir de face':'Voir de dos'}</button><button className="text-button muscle-reset" aria-hidden={value==='all'} disabled={value==='all'} tabIndex={value==='all'?-1:undefined} onClick={()=>onChange('all')}>Tout afficher</button></div><PTBodyMap selected={value} onSelect={onChange} back={back}/></section>;
}
function PTSportWeek({data,go}){
  const [offset,setOffset]=usePTState(0),[selected,setSelected]=usePTState(PT.dateKey());
  const monday=new Date(`${PT.dateKey()}T12:00:00`);monday.setDate(monday.getDate()-(monday.getDay()+6)%7+offset*7);
  const rows=data.sessions.filter(s=>s.date===selected),events=data.events.filter(e=>e.date===selected);
  return <section className="sport-week sport-reveal"><div className="topline"><h2>Ton rythme</h2><div className="week-switch"><button className="icon-button" aria-label="Semaine précédente" onClick={()=>setOffset(offset-1)}><PTIcon name="back" size={15}/></button><span>{monday.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span><button className="icon-button" aria-label="Semaine suivante" onClick={()=>setOffset(offset+1)}><PTIcon name="arrow" size={15}/></button></div></div><div className="week-calendar">{Array.from({length:7},(_,i)=>{const date=new Date(monday);date.setDate(date.getDate()+i);const key=PT.dateKey(date),done=data.sessions.some(s=>s.date===key),event=data.events.some(e=>e.date===key);return <button key={key} className={`day-cell${selected===key?' is-today':''}${done?' is-done':''}`} aria-pressed={selected===key} aria-label={date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})} onClick={()=>setSelected(key)}><small>{['L','M','M','J','V','S','D'][i]}</small><span>{date.getDate()}</span><i className={done?'filled':event?'planned':''}/></button>;})}</div>{selected!==PT.dateKey()&&<div className="day-results">{rows.map(s=><button className="history-row" key={s.id} onClick={()=>go('history',s.id)}><PTIcon name="check" size={16}/><div><strong>{s.title}</strong><small>{s.minutes} min</small></div><PTIcon name="arrow" size={16}/></button>)}{events.map(e=><button key={e.id} className="history-row" onClick={()=>go('event',e.id)}>{e.title}<PTIcon name="arrow" size={16}/></button>)}{!rows.length&&!events.length&&<span className="caption">Journée libre</span>}</div>}</section>;
}
function PTSportToday({data,update,go,notify}){
  const [focus,setFocus]=usePTState('muscle'),[minutes,setMinutes]=usePTState(30);
  const summary=PT.weeklySummary(data),ctx=PT.context(data),symptoms=PT.activeSymptoms(data);
  const followup=[...data.sessions].reverse().find(s=>s.nextDayPending&&PT.dayDiff(PT.dateKey(),s.date)>=1&&PT.dayDiff(PT.dateKey(),s.date)<=7);
  const upcoming=data.events.filter(e=>!e.completed&&e.date>=PT.dateKey()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,2);
  const prepare=(quick=false,chosenFocus=focus,chosenMinutes=minutes)=>{
    if(data.draft?.status==='active'){go('session');notify('Ta séance en cours est conservée.');return;}
    const check={...data.checkIn,date:PT.dateKey(),equipment:data.owned,minutes:chosenMinutes,focus:chosenFocus,motivation:chosenMinutes===8?'low':'normal',energy:data.checkIn.date===PT.dateKey()?data.checkIn.energy:'normal'};
    if(quick){const plan=PT.generate(data,check);if(plan.error){notify(plan.error);return;}update(s=>({...s,checkIn:check,draft:plan}));go('preview');}
    else {update(s=>({...s,checkIn:check}));go('prepare');}
  };
  const done=data.draft?Object.values(data.draft.entries).flat().filter(r=>r.done).length:0,total=data.draft?Object.values(data.draft.entries).flat().length:0;
  const presets=[{focus:'muscle',title:'FORCE & CONTRÔLE',time:30,exercise:'db-press'},{focus:'core',title:'CORE EXPRESS',time:15,exercise:'plank'},{focus:'mobility',title:'RESET MOBILITÉ',time:15,exercise:'cat'}];
  return <PTSportMotion identity="today"><div className="sport-home stack-lg">
    <div className="sport-greeting sport-reveal"><div><span className="caption">{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span><h1>{data.profile.name?`À TOI DE JOUER, ${data.profile.name}.`:'À TOI DE JOUER.'}</h1></div><button className="avatar-button" aria-label="Ouvrir mon profil" onClick={()=>go('profile')}>{data.profile.name?.slice(0,1).toUpperCase()||<PTIcon name="profile"/>}</button></div>
    <PTSportWeek data={data} go={go}/>
    {symptoms.length>0&&<button className="constraint-strip" onClick={()=>go('symptoms')}><PTIcon name="pain" size={18}/><span>{ctx.active.blocked?'Fais le point avant de démarrer':symptoms.map(s=>PT.regions[s.region]).join(' · ')+' : séance adaptée'}</span><PTIcon name="arrow" size={16}/></button>}
    {data.draft&&<button className="resume-workout sport-reveal" onClick={()=>go(data.draft.status==='active'?'session':'preview')}><PTThumbnail exercise={data.draft.exercises[0]}/><span><small>{data.draft.status==='active'?'Reprendre la séance':'Ta séance est prête'}</small><strong>{data.draft.title}</strong><span className="mini-progress"><i style={{transform:`scaleX(${total?done/total:0})`}}/></span></span><span className="round-play"><PTIcon name="play" size={20}/></span></button>}
    <div className="home-main-grid">
      <section className="training-hero sport-reveal"><div className="training-image"><img src="media/training-floor.jpg" alt="Salle de sport équipée pour la musculation"/></div><div className="training-hero-content"><span className="training-kicker">Ton prochain niveau</span><h2>PLUS FORT.<br/><em>PLUS LIBRE.</em></h2><div className="hero-bottom"><span>{minutes} min · {focusLabels[focus]}</span></div><PTButton primary onClick={()=>prepare(false)}>Trouver ma séance<span className="button-disc"><PTIcon name="arrow" size={18}/></span></PTButton></div></section>
      <section className="quick-builder sport-reveal"><div className="section-head"><h2>Le bon format.</h2><span className="caption">À toi de choisir</span></div><div className="sport-categories">{[{id:'muscle',label:'Force',icon:'weight'},{id:'basket',label:'Basket',icon:'basket'},{id:'cardio',label:'Cardio',icon:'run'},{id:'mobility',label:'Mobilité',icon:'body'}].map(c=><button key={c.id} aria-pressed={focus===c.id} onClick={()=>setFocus(c.id)}><PTIcon name={c.icon} size={23}/><span>{c.label}</span></button>)}</div><div className="quick-duration"><span>J’ai</span>{[15,30,45].map(n=><button aria-pressed={minutes===n} key={n} onClick={()=>setMinutes(n)}>{n}<small> min</small></button>)}</div><PTButton quiet onClick={()=>prepare(true)}>Préparer cette séance<PTIcon name="arrow" size={18}/></PTButton><div className="activity-compact"><PTRing value={summary.sessions} total={summary.target} label={`${summary.sessions} sur ${summary.target} séances`}><strong>{summary.sessions}<small>/{summary.target}</small></strong></PTRing><div><strong>Le rythme se construit.</strong><span>{summary.minutes} min cette semaine</span><button className="text-button accent-text" onClick={()=>go('progress')}>Mon activité <PTIcon name="arrow" size={14}/></button></div></div></section>
    </div>
    <section className="scroll-reveal"><div className="section-head"><h2>À TOI DE CHOISIR</h2><button className="text-button" onClick={()=>go('library')}>Explorer <PTIcon name="arrow" size={16}/></button></div><div className="workout-rail">{presets.map(p=><button key={p.focus} className="preset-workout" onClick={()=>prepare(true,p.focus,p.time)}><PTThumbnail exercise={PT.catalog.find(e=>e.id===p.exercise)}/><span className="preset-info"><small>{p.time} min</small><strong>{p.title}</strong><span className="preset-play"><PTIcon name="play" size={17}/></span></span></button>)}</div></section>
    <div className="home-shortcuts scroll-reveal"><button onClick={()=>go('program')}><PTIcon name="book"/><span>Mon programme<small>Semaine {data.programWeek}</small></span><PTIcon name="arrow" size={16}/></button><button onClick={()=>prepare(true,'mobility',8)}><PTIcon name="spark"/><span>Juste 8 minutes<small>Garde l’élan</small></span><PTIcon name="arrow" size={16}/></button></div>
    <PTAdaptation data={data}/>
    {followup&&<section className="card stack"><h3>Comment ça va depuis hier ?</h3><PTChoices value={null} options={[{value:'same',label:'Tout va bien'},{value:'worse',label:'Une gêne a augmenté'}]} onChange={v=>{update(s=>({...s,sessions:s.sessions.map(x=>x.id===followup.id?{...x,nextDay:v,nextDayPending:false}:x)}));if(v==='worse')go('symptoms');else notify('Ressenti enregistré.');}}/></section>}
    <section className="upcoming-events scroll-reveal"><div className="section-head"><h2>Sur ton agenda</h2><button className="icon-button" aria-label="Ajouter un match ou un entraînement" onClick={()=>go('event')}><PTIcon name="plus" size={19}/></button></div>{upcoming.length?upcoming.map(e=><button key={e.id} className="event-row" onClick={()=>go('event',e.id)}><span><strong>{e.title}</strong><small>{shortDate(e.date)}</small></span><PTIcon name="arrow" size={16}/></button>):<button className="calendar-empty" onClick={()=>go('event')}><PTIcon name="today"/><span>Un match prévu ?<small>Ajoute-le à ton planning.</small></span><PTIcon name="plus" size={18}/></button>}</section>
    {!!data.savedWorkouts.length&&<section><h2>Tes favoris</h2>{data.savedWorkouts.slice(-3).map(w=><button key={w.id} className="history-row" onClick={()=>{if(data.draft?.status==='active'){go('session');return;}const check={...data.checkIn,equipment:data.owned};const safe=w.plan.exercises.filter(e=>PT.allowed(e,data,check));if(!safe.length){notify('Aucun mouvement compatible avec tes contraintes actuelles.');return;}update(s=>({...s,draft:{...PT.clone(w.plan),id:PT.uid(),exercises:safe,status:'preview',entries:{},check,reasons:['Favori adapté à tes contraintes actuelles.']}}));go('preview');}}><PTIcon name="heart"/><div><strong>{w.name}</strong><small>{w.plan.exercises.length} exercices</small></div><PTIcon name="arrow" size={16}/></button>)}</section>}
  </div></PTSportMotion>;
}
