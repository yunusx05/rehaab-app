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
function PTBodyMap({selected='all',onSelect,back=false}){
  const uid=React.useId().replace(/:/g,'');
  const muscle=(id,label,d)=><path key={id+d} className={`muscle-zone${selected===id?' selected':''}`} d={d} onClick={()=>onSelect?.(selected===id?'all':id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(selected===id?'all':id);}}} tabIndex={onSelect?0:undefined} role={onSelect?'button':undefined} aria-label={label} aria-pressed={onSelect?selected===id:undefined}><title>{label}</title></path>;
  return <svg className="body-map" viewBox="0 0 240 350" role="group" aria-label={`Carte des muscles, ${back?'dos':'face'}`}>
    <defs><linearGradient id={uid} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#69716b"/><stop offset=".55" stopColor="#333a35"/><stop offset="1" stopColor="#1e2520"/></linearGradient></defs>
    <ellipse cx="120" cy="329" rx="69" ry="6" fill="#ffffff06"/>
    <g fill={`url(#${uid})`} stroke="#737e7538" strokeWidth="1.2">
      <path d="M108 51V42h24v9l21 11 15 15 10 44 10 34 9 31-7 4-16-32-13-31-10-30-3 60 9 29-5 49-14 69 4 22-22 2-3-23 4-68-1-31-8 31 4 69-4 22-21-2 4-22-14-69-5-49 9-29-3-60-10 30-13 31-16 32-7-4 9-31 10-34 10-44 15-15z"/>
      <path d="M104 22q1-19 16-19t16 19l-2 17-14 11-14-11z"/>
    </g>
    {muscle('shoulders','Épaules','M95 58Q76 60 72 80l13 9 15-17ZM145 58q19 2 23 22l-13 9-15-17Z')}
    {muscle('arms','Bras','M71 86l12 7-9 33-13 4ZM169 86l-12 7 9 33 13 4Z')}
    {back?<>
      {muscle('back','Dos','M102 57l18 9 18-9 10 32-12 48-16 15-16-15-12-48Z')}
      {muscle('glutes','Fessiers','M94 154l24 7v35l-26 7-6-24ZM146 154l-24 7v35l26 7 6-24Z')}
      {muscle('hamstrings','Ischio-jambiers','M90 207l24-7-3 51-12 16ZM150 207l-24-7 3 51 12 16Z')}
    </>:<>
      {muscle('chest','Pectoraux','M101 65l17 6v30l-27-7 2-18ZM139 65l-17 6v30l27-7-2-18Z')}
      {muscle('core','Abdominaux','M106 106h28l-2 44-12 9-12-9ZM91 100l11 8 4 42-10-10ZM149 100l-11 8-4 42 10-10Z')}
      {muscle('quads','Quadriceps','M91 183l23 1-3 63-13 18-10-41ZM149 183l-23 1 3 63 13 18 10-41Z')}
    </>}
    {muscle('calves','Mollets','M98 271l13-9-3 44-8 1ZM142 271l-13-9 3 44 8 1Z')}
    <g stroke="#111a13" strokeWidth="2" opacity=".8" pointerEvents="none"><path d="M120 72v78M108 118h24m-23 14h22m-20 11h18"/></g>
  </svg>;
}
function PTMuscleExplorer({value,onChange}){
  const [back,setBack]=usePTState(false);
  return <section className="muscle-explorer"><div className="muscle-copy"><span className="eyebrow">Cible ta séance</span><h2>{value==='all'?<>QUEL<br/>MUSCLE ?</>:ptMuscleLabels[value]}</h2><p className="fine">Touche une zone.</p><button className="chip rotate-body" onClick={()=>setBack(!back)}><PTIcon name="refresh" size={16}/>{back?'Voir de face':'Voir de dos'}</button>{value!=='all'&&<button className="text-button" onClick={()=>onChange('all')}>Tout afficher</button>}</div><PTBodyMap selected={value} onSelect={onChange} back={back}/></section>;
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
