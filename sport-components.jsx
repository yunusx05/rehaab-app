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
function PTSportToday({data,update,go,notify}){
  const ctx=PT.context(data),symptoms=PT.activeSymptoms(data);
  const done=data.draft?Object.values(data.draft.entries).flat().filter(r=>r.done).length:0,total=data.draft?Object.values(data.draft.entries).flat().length:0;
  return <PTSportMotion identity="today"><div className="sport-home stack-lg">
    <div className="sport-greeting sport-reveal"><div><span className="caption">{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span><h1>{data.profile.name?`À TOI DE JOUER, ${data.profile.name}.`:'À TOI DE JOUER.'}</h1></div><button className="avatar-button" aria-label="Ouvrir mon profil" onClick={()=>go('profile')}>{data.profile.name?.slice(0,1).toUpperCase()||<PTIcon name="profile"/>}</button></div>
    {symptoms.length>0&&<button className="constraint-strip" onClick={()=>go('symptoms')}><PTIcon name="pain" size={18}/><span>{ctx.active.blocked?'Fais le point avant de démarrer':symptoms.map(s=>PT.regions[s.region]).join(' · ')+' : séance adaptée'}</span><PTIcon name="arrow" size={16}/></button>}
    {data.draft&&<button className="resume-workout sport-reveal" onClick={()=>go(data.draft.status==='active'?'session':'preview')}><PTThumbnail exercise={data.draft.exercises[0]}/><span><small>{data.draft.status==='active'?'Reprendre la séance':'Ta séance est prête'}</small><strong>{data.draft.title}</strong><span className="mini-progress"><i style={{transform:`scaleX(${total?done/total:0})`}}/></span></span><span className="round-play"><PTIcon name="play" size={20}/></span></button>}
    {data.draft&&typeof PTDraftCancel==='function'&&<PTDraftCancel update={update} notify={notify}/>}
    {typeof PTCoachCard==='function'&&<PTCoachCard data={data} go={go}/>}
    {!data.draft&&typeof PTTodayPlan==='function'&&<PTTodayPlan data={data} update={update} go={go} notify={notify}/>}
    {typeof PTBodyMind==='function'&&<PTBodyMind data={data} go={go}/>}
    {typeof PTWarmupRail==='function'&&<PTWarmupRail data={data} update={update} go={go} notify={notify}/>}
    {typeof PTRehabRail==='function'&&<PTRehabRail data={data} update={update} go={go} notify={notify}/>}
  </div></PTSportMotion>;
}
