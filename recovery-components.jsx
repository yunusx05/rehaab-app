/* Lot 18 : récupération et imprévus. Échauffement / retour au calme visibles dans l'aperçu, étirements ciblés sur le personnage,
   et « Un imprévu aujourd'hui ? » qui demande d'abord la raison. Décisions dans rehab-warmup.js (routines, récup) et season-plan.js (report). */

// Aperçu d'une séance : ce que seront l'échauffement guidé et le retour au calme (mêmes mouvements qu'au lancement, choisis pour la journée).
function PTRoutinePreview({data,plan}){
  const RW=window.RehabWarmup;
  if(!RW||!plan)return null;
  const r=RW.sessionRoutines(PT,window.PlayerProfile,data,plan);
  const mins=list=>Math.max(1,Math.round(list.reduce((n,e)=>n+ptMoveSeconds(e)+(e.rest||0),0)/60));
  if(!r.warmup.length&&!r.cooldown.length)return plan.warmupSeconds>0?<div className="warmup"><PTIcon name="body" size={26}/><div><h3>Échauffement · {Math.round(plan.warmupSeconds/60)} min</h3><p className="fine">Des gestes faciles, avant de charger.</p></div></div>:null;
  const row=(title,hint,list)=><div className="routine-row"><div className="topline"><h3>{title} · {mins(list)} min</h3><small className="caption">{list.length} mouvements</small></div><p className="fine">{hint}</p><ul className="routine-chips">{list.map(e=><li key={e.id}>{e.name}</li>)}</ul></div>;
  return <section className="routine-preview card stack-sm" aria-label="Échauffement et retour au calme">
    {r.warmup.length>0&&row('Échauffement guidé','Étirements dynamiques et activation, chronométrés. Il change chaque jour.',r.warmup)}
    {r.cooldown.length>0&&row('Retour au calme','Étirements tenus pour ce qui a travaillé, puis une minute de respiration.',r.cooldown)}
  </section>;
}

// Lot 19 : le matériel à sortir avant de commencer (exercices + échauffement + retour au calme), à cocher.
// En séance les routines sont déjà attachées ; dans l'aperçu on reprend celles du jour, comme PTRoutinePreview.
function PTGearList({plan,data}){
  const [ready,setReady]=usePTState([]);
  if(!plan)return null;
  let moves=[...(plan.warmupMoves||[]),...(plan.cooldownMoves||[])];
  if(!moves.length&&data&&window.RehabWarmup){try{const r=window.RehabWarmup.sessionRoutines(PT,window.PlayerProfile,data,plan);moves=[...r.warmup,...r.cooldown];}catch(e){}}
  const ids=[...new Set([...plan.exercises,...moves].flatMap(e=>e.needs||[]))].filter(id=>id!=='bodyweight');
  const gear=PT.equipment.filter(e=>ids.includes(e.id));
  if(!gear.length)return <section className="gear-list card stack-sm" aria-label="Matériel à préparer"><h3>Matériel à préparer</h3><p className="fine">Rien à sortir : poids du corps uniquement.</p></section>;
  return <section className="gear-list card stack-sm" aria-label="Matériel à préparer">
    <div className="topline"><h3>Matériel à préparer</h3><small className="caption">{ready.length}/{gear.length} prêt</small></div>
    <ul className="gear-items">{gear.map(g=><li key={g.id}><button type="button" aria-pressed={ready.includes(g.id)} onClick={()=>setReady(list=>toggleId(list,g.id))}><PTIcon name={g.icon} size={20}/><span>{g.label}</span><i aria-hidden="true"><PTIcon name="check" size={14}/></i></button></li>)}</ul>
  </section>;
}

// Personnage cliquable (mêmes rendus que la carte des muscles), plusieurs zones à la fois.
// Points du côté gauche de l'image, en unités du viewBox ; « pair » = recopié en miroir, « center » = fermé sur l'axe.
const ptPickZones={
  front:[['neck','center','120 48 112 49 109 57 112 62 120 63'],['shoulders','pair','99 59 86 61 76 67 70 78 68 92 72 102 84 104 90 96 93 84 96 72 102 64'],['chest','pair','119 65 104 62 96 68 92 80 93 92 99 98 110 101 119 99'],
    ['arms','pair','71 103 64 114 56 130 48 150 44 168 46 182 52 192 60 186 60 172 67 166 74 150 81 134 87 118 89 106 84 105'],['abs','center','120 101 110 102 99 99 93 106 91 122 93 138 98 147 108 156 120 160'],
    ['hipflex','pair','98 148 95 156 101 165 110 172 118 178 119 163 108 157'],['quads','pair','96 160 89 172 87 192 89 214 92 232 102 236 110 234 114 222 112 200 110 182 104 170'],
    ['adductors','pair','118 180 112 182 112 198 114 214 118 226 119 226'],['knees','pair','92 234 91 246 95 255 104 257 111 252 113 241 106 236'],['shins','pair','90 258 87 272 90 292 95 310 105 311 110 294 114 272 113 258 104 259'],
    ['feet','pair','91 313 87 323 90 333 104 336 110 330 107 314']],
  back:[['neck','center','120 46 111 48 108 57 111 62 120 63'],['shoulders','pair','101 58 86 61 76 67 70 78 68 92 72 102 84 104 90 96 92 84 94 72 100 64'],
    ['arms','pair','71 103 64 114 56 130 48 150 44 168 46 182 52 192 60 186 60 172 67 166 74 150 81 134 87 118 89 106 84 105'],['upperback','center','120 50 110 52 102 61 95 69 93 82 91 97 120 99'],
    ['lowback','center','120 99 91 97 91 114 95 128 99 141 110 146 120 148'],['glutes','pair','119 150 108 147 98 149 92 160 90 172 95 182 106 187 118 185'],
    ['hamstrings','pair','90 182 87 197 89 216 92 238 100 246 111 244 116 230 118 208 118 189 106 191 95 187'],['calves','pair','88 250 85 268 89 292 95 310 105 311 110 294 115 270 115 251 104 247'],
    ['feet','pair','91 313 87 323 90 333 104 336 110 330 107 314']]
};
const ptPickPaths=Object.fromEntries(Object.entries(ptPickZones).map(([view,zones])=>[view,zones.map(([id,kind,list])=>{
  const n=list.split(' ').map(Number),left=n.flatMap((x,i)=>i%2?[]:[[x,n[i+1]]]),right=left.map(([x,y])=>[240-x,y]),path=points=>`M${points.join(' ')}Z`;
  return {id,d:kind==='pair'?path(left)+path(right):path([...left,...right.reverse().filter(([x])=>x!==120)])};
})]));
function PTBodyPicker({value,onChange}){
  const RW=window.RehabWarmup,[back,setBack]=usePTState(false),uid=React.useId().replace(/:/g,''),view=back?'back':'front',src=`media/body/${view}.webp`;
  usePTEffect(()=>{['front','back'].forEach(v=>{new Image().src=`media/body/${v}.webp`;});},[]);
  const toggle=id=>onChange(value.includes(id)?value.filter(x=>x!==id):[...value,id]);
  return <div className="body-picker">
    <svg className="body-map" viewBox="0 0 240 350" role="group" aria-label={`Choisis les zones, ${back?'de dos':'de face'}`}>
      <defs><mask id={`${uid}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="350" style={{maskType:'alpha'}}><image href={src} width="240" height="350"/></mask>
        <filter id={`${uid}f`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
      <ellipse cx="120" cy="338" rx="48" ry="5" fill="#0000004d"/>
      <image href={src} width="240" height="350" aria-hidden="true"/>
      {/* Calque visible, découpé par la silhouette ; calque de touche par-dessus, sans masque (un masque bloque le toucher). */}
      <g className="muscle-layer pick-layer" mask={`url(#${uid}m)`} aria-hidden="true">
        {ptPickPaths[view].map(({id,d})=><path key={id} className={`muscle-zone pick-zone${value.includes(id)?' selected':''}`} d={d} filter={`url(#${uid}f)`}/>)}
      </g>
      <g className="pick-hits">
        {ptPickPaths[view].map(({id,d})=>{const label=RW.bodyZones[id].label,on=value.includes(id);return <path key={id} className="pick-hit" d={d} tabIndex={0} role="button" aria-label={label} aria-pressed={on} onClick={()=>toggle(id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(id);}}}><title>{label}</title></path>;})}
      </g>
    </svg>
    <button type="button" className="rotate-body btn quiet" onClick={()=>setBack(!back)}><PTIcon name="refresh" size={18}/>{back?'Voir de face':'Voir de dos'}</button>
    <div className="chips pick-chips" aria-live="polite">{value.length?value.map(id=><button type="button" key={id} className="chip" aria-pressed="true" onClick={()=>toggle(id)}>{RW.bodyZones[id].label} ✕</button>):<p className="fine">Touche les zones sur le personnage (face et dos). Plusieurs zones possibles.</p>}</div>
  </div>;
}

// Construire et lancer une récup ciblée (utilisé par « Étirements ciblés » et par les imprévus).
function ptRecoveryLaunch({data,update,go,notify},opts,before){
  const RW=window.RehabWarmup;
  if(data.draft?.status==='active'){go('session');notify('Ta séance en cours est conservée.');return;}
  const plan=RW.recoveryPlan(PT,window.PlayerProfile,data,opts);
  if(plan.error){notify(plan.error);return;}
  update(s=>({...(before?before(s):s),draft:plan}));go('preview');
}
const ptFeelOptions=feel=>Object.entries(window.RehabWarmup.feelings).map(([value,f])=>({value,label:f.label})).concat(feel?[]:[{value:'pain',label:'Douleur'}]);
function PTRecoveryBuilder({data,feel,setFeel,fixedFeel,zones,setZones,launch,label}){
  const RW=window.RehabWarmup,owned=data.owned||[];
  const [minutes,setMinutes]=usePTState(feel==='tired'?15:20),[tens,setTens]=usePTState(owned.includes('tens'));
  const pain=feel==='pain';
  const rehabZones=[...new Set(zones.map(z=>RW.bodyZones[z].rehab))];
  return <div className="stack-lg">
    {!fixedFeel&&<section className="stack-sm"><h3>Ce que tu ressens</h3><PTChips options={ptFeelOptions()} value={feel} onChange={setFeel}/>{feel&&!pain&&<p className="fine">{RW.feelings[feel].hint}.</p>}</section>}
    {feel!=='tired'&&<section className="stack-sm"><h3>{pain?'Où as-tu mal ?':feel==='heavy'?'Où sont les lourdeurs ?':feel==='tension'?'Où ça tire ?':'Où sont les courbatures ?'}</h3><PTBodyPicker value={zones} onChange={setZones}/></section>}
    {pain?<section className="stack-sm">
      <p className="notice">Une douleur ne s’étire pas : elle se soigne avec un protocole progressif. Choisis la zone pour l’ouvrir.</p>
      {rehabZones.length?<div className="button-row">{rehabZones.map(z=><PTButton key={z} primary onClick={()=>launch({rehab:z})}>Soin · {RW.zones.find(x=>x.id===z)?.label}<PTIcon name="arrow" size={18}/></PTButton>)}</div>
        :<PTButton primary onClick={()=>launch({rehab:true})}>Trouver mon protocole<PTIcon name="arrow" size={18}/></PTButton>}
    </section>:feel&&<>
      <section className="stack-sm"><h3>Durée</h3><PTChips options={[10,15,20,30].map(n=>({value:n,label:`${n} min`}))} value={minutes} onChange={setMinutes}/></section>
      {owned.includes('tens')&&<label className="check-label"><input type="checkbox" checked={tens} onChange={e=>setTens(e.target.checked)}/>Finir par 15 min d’électrostimulation, allongé (en plus)</label>}
      {!owned.some(x=>['foamroller','massagegun'].includes(x))&&<p className="fine">Un rouleau ou un pistolet de massage ? Ajoute-le dans ton matériel : il passe en premier sur chaque zone.</p>}
      <PTButton primary onClick={()=>launch({feel,zones,minutes,tens})}>{label}<PTIcon name="arrow" size={18}/></PTButton>
    </>}
  </div>;
}

// Route « stretch » : étirements ciblés. id = ressenti de départ (heavy, tension, sore, tired).
function PTStretchPicker(props){
  const {data,go,id}=props,RW=window.RehabWarmup;
  const [feel,setFeel]=usePTState(RW.feelings[id]?id:'tension'),[zones,setZones]=usePTState(id==='heavy'?['quads','hamstrings','calves']:[]);
  const launch=o=>{if(o.rehab){go('rehab',o.rehab===true?undefined:o.rehab);return;}ptRecoveryLaunch(props,o);};
  return <><PTPageHead onBack={()=>go('today')} eyebrow="Récupération" title="Étirements ciblés.">Lourdeur, tension, courbatures : touche les zones sur le personnage, la séance se construit pour elles.</PTPageHead>
    <PTRecoveryBuilder data={data} feel={feel} setFeel={setFeel} zones={zones} setZones={setZones} launch={launch} label="Voir ma séance"/>
    <PTRehabSources ids={['recovery','behm','foam','tens']}/></>;
}

// Route « mishap » : un imprévu. La raison d'abord, puis la solution qui va avec.
const ptMishapReasons=[
  {value:'time',label:'Pas assez de temps',hint:'Une version courte de ta séance',icon:'clock'},
  {value:'tired',label:'Grosse fatigue',hint:'Une récup douce à la place',icon:'heart'},
  {value:'sore',label:'Courbatures',hint:'Une séance pour les soulager',icon:'body'},
  {value:'heavy',label:'Jambes lourdes',hint:'Relâcher et surélever les jambes',icon:'body'},
  {value:'pain',label:'Une douleur',hint:'Le protocole de soin de la zone',icon:'pain'},
  {value:'basket',label:'Match ou entraînement ajouté',hint:'Ta séance glisse, place à l’échauffement',icon:'basket'},
  {value:'nogym',label:'Pas de salle ni de matériel',hint:'Ta séance, au poids du corps',icon:'body'},
  {value:'busy',label:'Autre empêchement',hint:'Reporter ou annuler',icon:'today'}
];
// Séance prévue aujourd'hui, refaite en plus court ou avec un autre matériel.
function ptMishapPlan(data,item,{minutes,state=data}){
  const BP=window.BasketPathway,JP=window.PlayerProfile,PP=window.PersonalPrograms,SK=window.BasketSkills;
  const check={...state.checkIn,date:PT.dateKey(),equipment:state.owned,minutes};
  const st={...state,checkIn:check};
  let plan=null;
  if(item?.type==='pathway'&&st.pathway&&BP)plan=BP.sessionPlan(PT,JP,st,st.pathway,item.day,{minutes});
  else if(item?.type==='muscu'&&PP&&st.program?.status==='active'){const pr=PP.progressOf(st.program);plan=PP.sessionPlan(st.program,pr.currentWeek,pr.nextDay,st,PP.checkFor(st,st.program,{minutes:Math.min(Number(st.program.minutes)||minutes,minutes)}));}
  else if(item?.type==='skills'&&SK)plan=SK.session(PT,st,{minutes});
  else if(item&&typeof ptCalendarPlan==='function')plan=ptCalendarPlan(st,item,ptMishapDay(st));
  if(!plan||plan.error)plan=st.player?.position&&JP?JP.dailyBody(PT,st,{minutes}):PT.generate(st,{...check,focus:'muscle'});
  return plan;
}
function ptMishapDay(state){const SPx=window.SeasonPlan,now=PT.dateKey();return SPx?SPx.weekSchedule(state,now,now).days.find(d=>d.date===now):null;}

function PTMishap(props){
  const {data,update,go,notify}=props,SPL=window.SeasonPlan,RW=window.RehabWarmup,now=PT.dateKey();
  const planned=SPL?(SPL.weekSchedule(data,now,now).days.find(d=>d.date===now)?.items||[]).filter(x=>x.status==='planned'):[];
  const main=planned.find(x=>['pathway','muscu','skills','reset','vivacite'].includes(x.type))||planned[0]||null;
  const [reason,setReason]=usePTState(null),[minutes,setMinutes]=usePTState(20),[zones,setZones]=usePTState([]),[kind,setKind]=usePTState('match');
  const [feel,setFeel]=usePTState(null);
  // Report de la séance prévue (si elle existe), appliqué à l'état passé en paramètre.
  const excuseIn=(s,action)=>{if(!SPL||!planned.length)return s;const r=SPL.excuse(s,action,now);return r.ok?{...s,calendar:r.calendar}:s;};
  const simple=action=>{if(!planned.length){go('today');return;}const r=SPL.excuse(data,action,now);if(r.ok)update(s=>({...s,calendar:r.calendar}));notify(r.why);go('today');};
  const launchPlan=(plan,note)=>{
    if(data.draft?.status==='active'){go('session');notify('Ta séance en cours est conservée.');return;}
    if(!plan||plan.error){notify(plan?.error||'Séance indisponible aujourd’hui.');return;}
    update(s=>({...s,draft:{...plan,reasons:[note,...(plan.reasons||[])]}}));go('preview');
  };
  const pick=v=>{setReason(v);setFeel(v==='sore'||v==='heavy'||v==='tired'?v:null);setZones(v==='heavy'?['quads','hamstrings','calves']:[]);window.scrollTo(0,0);};
  const back=()=>reason?setReason(null):go('today');
  const r=ptMishapReasons.find(x=>x.value===reason);
  return <><PTPageHead onBack={back} eyebrow="Un imprévu" title={r?r.label+'.':'Qu’est-ce qui se passe ?'}>{r?r.hint+'.':'Dis-nous pourquoi : la solution n’est pas la même pour un manque de temps, une grosse fatigue ou une douleur.'}</PTPageHead>
    <div className="stack-lg mishap">
      {main&&<p className="fine">Prévu aujourd’hui : {planned.map(x=>x.label).join(' · ')}.</p>}
      {!reason&&<PTChoices columns={1} value={reason} onChange={pick} options={ptMishapReasons}/>}
      {reason==='time'&&<section className="stack">
        <PTCoachQ title="Combien de temps as-tu ?"><PTChips options={[10,15,20,30].map(n=>({value:n,label:`${n} min`}))} value={minutes} onChange={setMinutes}/></PTCoachQ>
        <p className="fine">Même séance, resserrée sur l’essentiel : les mouvements clés restent, les séries et les accessoires sautent en premier.</p>
        <PTButton primary onClick={()=>launchPlan(ptMishapPlan(data,main,{minutes}),`Version courte (${minutes} min) : imprévu, pas assez de temps.`)}>Lancer la version courte<PTIcon name="arrow" size={18}/></PTButton>
        <div className="button-row"><PTButton quiet onClick={()=>simple('postpone')}>Plutôt reporter</PTButton></div>
      </section>}
      {['tired','sore','heavy'].includes(reason)&&<section className="stack">
        {reason==='tired'&&<p className="notice">Grosse fatigue : on ne force pas. Une récup douce aujourd’hui{planned.length?', et ta séance est reportée au prochain jour libre':''}.</p>}
        {reason!=='tired'&&<p className="fine">{reason==='sore'?'Bouger doucement soulage mieux que le repos complet.':'Faire circuler, relâcher, surélever.'}{planned.length?' Ta séance prévue est reportée au prochain jour libre.':''}</p>}
        <PTRecoveryBuilder data={data} feel={feel} setFeel={setFeel} fixedFeel zones={zones} setZones={setZones} label={planned.length?'Lancer ma récup · séance reportée':'Lancer ma récup'}
          launch={o=>ptRecoveryLaunch(props,o,s=>excuseIn(s,'postpone'))}/>
        <div className="button-row"><PTButton quiet onClick={()=>simple('postpone')}>Juste reporter</PTButton>{planned.length>0&&<PTButton quiet onClick={()=>simple('cancel')}>Annuler la séance</PTButton>}</div>
      </section>}
      {reason==='pain'&&<section className="stack">
        <p className="notice">Une douleur passe avant la séance. Choisis la zone : son protocole de soin s’ouvre{planned.length?' et ta séance est reportée':''}.</p>
        <PTRecoveryBuilder data={data} feel="pain" setFeel={()=>{}} fixedFeel zones={zones} setZones={setZones}
          launch={o=>{if(planned.length)update(s=>excuseIn(s,'postpone'));go('rehab',o.rehab===true?undefined:o.rehab);}}/>
      </section>}
      {reason==='basket'&&<section className="stack">
        <PTCoachQ title="Qu’est-ce qui s’ajoute ?"><PTChips options={[{value:'match',label:'Un match'},{value:'club',label:'Un entraînement'}]} value={kind} onChange={setKind}/></PTCoachQ>
        <p className="fine">Il est noté dans ton calendrier pour aujourd’hui{planned.length?' et ta séance glisse au prochain jour libre qui respecte tes règles (pas de jambes lourdes la veille d’un match)':''}. Lance l’échauffement sur place.</p>
        <PTButton primary onClick={()=>{
          const event={id:PT.uid(),date:now,type:kind,title:kind==='match'?'Match':'Entraînement club',completed:false};
          const w=RW.warmupPlan(PT,window.PlayerProfile,{...data,events:[...(data.events||[]),event]},kind==='match'?'match':'practice');
          update(s=>{const next=excuseIn({...s,events:[...(s.events||[]),event]},'postpone');return w.error||s.draft?.status==='active'?next:{...next,draft:w};});
          notify(kind==='match'?'Match ajouté aujourd’hui.':'Entraînement ajouté aujourd’hui.');go(w.error?'today':'preview');
        }}>Ajouter et voir mon échauffement<PTIcon name="arrow" size={18}/></PTButton>
      </section>}
      {reason==='nogym'&&<section className="stack">
        <PTCoachQ title="Temps disponible"><PTChips options={[15,20,30,45].map(n=>({value:n,label:`${n} min`}))} value={minutes} onChange={setMinutes}/></PTCoachQ>
        <p className="fine">Même intention, mouvements au poids du corps (un ballon et un terrain restent possibles s’ils sont dans ton matériel).</p>
        <PTButton primary onClick={()=>{const owned=['bodyweight',...(data.owned||[]).filter(x=>['ball','court','bands','miniband'].includes(x))];launchPlan(ptMishapPlan(data,main,{minutes,state:{...data,owned,checkIn:{...data.checkIn,equipment:owned}}}),'Sans salle aujourd’hui : même séance, au poids du corps.');}}>Lancer la version sans matériel<PTIcon name="arrow" size={18}/></PTButton>
        <div className="button-row"><PTButton quiet onClick={()=>simple('postpone')}>Plutôt reporter</PTButton></div>
      </section>}
      {reason==='busy'&&<section className="stack">
        {planned.length?<><div className="button-row"><PTButton primary onClick={()=>simple('postpone')}><PTIcon name="clock" size={18}/>Reporter</PTButton><PTButton danger onClick={()=>simple('cancel')}><PTIcon name="close" size={18}/>Annuler</PTButton></div>
          <p className="fine">Reporter : prochain jour libre qui respecte les règles de charge. Annuler : la séance saute cette semaine, sans rattrapage. Tu peux revenir en arrière dans la journée.</p></>
          :<p className="fine">Rien n’est prévu aujourd’hui dans ton planning : profite de ta journée.</p>}
      </section>}
      {reason&&<button className="text-button" onClick={()=>setReason(null)}>Changer de raison</button>}
    </div></>;
}
