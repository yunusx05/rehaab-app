/* Coach IA : bilan du jour en boutons, réponse de Gemini (api/coach.js), ajustement de la séance du jour.
   Les règles de douleur de l'app restent prioritaires : le coach allège ou retire, il n'ajoute jamais de charge. */
const COACH_ZONES=[{id:'knee',label:'Genou'},{id:'ankle',label:'Cheville / pied'},{id:'calf',label:'Mollet',region:'ankle'},{id:'quad',label:'Cuisse avant',region:'knee'},{id:'hamstring',label:'Arrière de cuisse',region:'hip'},{id:'hip',label:'Hanche / aine'},{id:'back',label:'Dos'},{id:'shoulder',label:'Épaule'},{id:'arm',label:'Bras / coude',region:'elbow'},{id:'wrist',label:'Poignet / main'},{id:'neck',label:'Cou'}];
const COACH_FORM=[{value:1,label:'Épuisé'},{value:2,label:'Fatigué'},{value:3,label:'Correct'},{value:4,label:'En forme'},{value:5,label:'Au top'}];
const COACH_DECISIONS={normal:'Séance prévue',light:'Séance allégée',mobility:'Mobilité douce',rehab:'Soin de la zone',rest:'Repos'};
const ptCoachRegion=id=>COACH_ZONES.find(z=>z.id===id)?.region||id;
const ptCoachLabel=(list,v)=>list.find(o=>o.value===v)?.label||'';
const ptCoachBlank=()=>({form:null,sleep:null,soreness:null,pain:null,zones:[],painLevel:3,redFlags:false,basketYesterday:null,basketIntensity:null,basketSoon:null,minutes:30,note:''});
const ptCoachToday=data=>[...(data.coachLog||[])].reverse().find(x=>x.date===PT.dateKey());
const ptCoachToken=()=>{try{return localStorage.getItem('rh_coach_token')||'';}catch(e){return '';}};

// Bilan en une phrase lisible : c'est aussi le premier message envoyé au coach.
function ptCoachSummary(c){
  const sleep={bad:'mauvais',mid:'moyen',good:'bon'}[c.sleep],sore={none:'aucune',light:'légères',strong:'fortes'}[c.soreness];
  const yesterday=c.basketYesterday==='none'?'non':`${c.basketYesterday==='match'?'match':'entraînement'}${c.basketIntensity?`, ${{light:'léger',medium:'moyen',hard:'dur'}[c.basketIntensity]}`:''}`;
  const soon={none:'non',today:'aujourd’hui',tomorrow:'demain'}[c.basketSoon];
  const pain=c.pain==='yes'?`${c.zones.map(z=>COACH_ZONES.find(x=>x.id===z)?.label.toLowerCase()).join(', ')||'zone non précisée'} à ${c.painLevel}/10${c.redFlags?', avec gonflement, douleur la nuit, instabilité ou fourmillements':''}`:'aucune';
  return `Bilan du jour : forme ${c.form}/5 (${ptCoachLabel(COACH_FORM,c.form)}) ; sommeil ${sleep} ; courbatures ${sore} ; douleur : ${pain} ; basket hier : ${yesterday} ; basket prévu : ${soon} ; temps dispo ${c.minutes} min.${c.note.trim()?` Note : ${c.note.trim()}`:''}`;
}

// Ce que le coach doit savoir : profil, parcours, séance prévue, 14 derniers jours de l'app et du club.
function ptCoachContext(data){
  const today=PT.dateKey(),BP=window.BasketPathway,JP=window.PlayerProfile,p=data.pathway;
  let planned=null;
  if(p&&BP){const step=BP.stepById(p.step),status=BP.weekStatus(p),day=step.days.find(d=>d.key===status.next);
    if(day){const plan=BP.sessionPlan(PT,JP,data,p,day.key);planned={name:day.name,step:`${step.id}/5 · ${step.name}`,week:status.week,minutes:plan.estimatedMinutes,exercises:plan.error?[]:plan.exercises.map(e=>({name:e.name,sets:e.sets,regions:e.regions,impact:!!e.impact}))};}}
  return {
    today,
    profile:{age:data.profile.age,experience:data.profile.experience,basketLevel:data.profile.basketLevel},
    player:data.player?.position?{position:JP?.positions[data.player.position]?.label,profile:(data.player.archetypes||[]).map(a=>JP?.archetypes[a]?.label)}:null,
    plannedSession:planned,
    recentSessions:data.sessions.filter(s=>PT.dayDiff(today,s.date)>=0&&PT.dayDiff(today,s.date)<=14).sort((a,b)=>b.date.localeCompare(a.date)).map(s=>({daysAgo:PT.dayDiff(today,s.date),title:s.title,type:s.source,minutes:Math.round(s.minutes),effort:s.effort||null,partial:!!s.partial,painAfter:s.painAfter??null,exercises:(s.exercises||[]).slice(0,10).map(e=>e.name)})),
    basketEvents:data.events.filter(e=>Math.abs(PT.dayDiff(today,e.date))<=3).map(e=>({daysFromToday:-PT.dayDiff(today,e.date),title:e.title,type:e.type,done:!!e.completed})),
    activePains:PT.activeSymptoms(data).map(s=>({zone:PT.regions[s.region],severity:s.severity})),
    previousCheckins:(data.coachLog||[]).slice(-6).map(x=>({date:x.date,form:x.checkin?.form,decision:x.plan?.decision,applied:!!x.applied}))
  };
}

// Repli hors connexion : mêmes principes que le coach, en règles simples.
function ptCoachLocal(c){
  const regions=c.pain==='yes'?[...new Set(c.zones.map(ptCoachRegion))]:[];
  const plan={decision:'normal',intensity:'normal',setsFactor:1,restFactor:1,minutes:c.minutes,avoidRegions:regions,avoidImpact:false,rehabRegion:'',why:''};
  const tired=c.form<=2||c.sleep==='bad'||c.soreness==='strong'||(c.basketYesterday!=='none'&&c.basketIntensity==='hard');
  if(c.pain==='yes'&&(c.painLevel>=7||c.redFlags))Object.assign(plan,{decision:'rest',why:'Douleur forte ou signe inhabituel.'});
  else if(c.pain==='yes'&&c.painLevel>=4)Object.assign(plan,{decision:'rehab',rehabRegion:regions[0]||'',why:'Douleur modérée : le soin passe avant.'});
  else if(c.form===1)Object.assign(plan,{decision:'mobility',intensity:'reduced',setsFactor:.6,why:'Très fatigué : on récupère.'});
  else if(tired||c.basketSoon!=='none')Object.assign(plan,{decision:'light',intensity:'reduced',setsFactor:.7,restFactor:1.2,avoidImpact:c.basketSoon!=='none'||c.soreness==='strong',why:c.basketSoon!=='none'?'Basket proche : jambes fraîches.':'Fatigue : volume réduit.'});
  else plan.why='En forme : séance prévue.';
  const message={rest:'Repos aujourd’hui. Si la douleur est forte, gonfle ou te réveille, fais-la examiner par un professionnel.',rehab:'On soigne la zone qui gêne avant de forcer. Fais le protocole de soin.',mobility:'Grosse fatigue : 15 minutes de mobilité, pas plus.',light:'On garde la séance, en plus léger.',normal:'Tout est au vert : séance prévue.'}[plan.decision];
  return {message:`${message} (coach hors ligne : règles simples)`,questions:[],plan,offline:true};
}

// Garde-fous codés : l'IA ne peut jamais passer outre une douleur forte ou un signe inhabituel.
function ptCoachGuard(plan,c){
  const regions=c.pain==='yes'?c.zones.map(ptCoachRegion):[];
  const safe={...plan,avoidRegions:[...new Set([...(plan.avoidRegions||[]),...regions])]};
  if(c.pain==='yes'&&(c.painLevel>=7||c.redFlags))return {...safe,decision:'rest',why:'Douleur forte ou signe inhabituel : pas de séance.'};
  return safe;
}

async function ptCoachAsk(data,messages){
  const token=ptCoachToken();
  if(!token)throw Object.assign(new Error('Ajoute ton code d’accès du coach (réglages en bas de l’écran).'),{config:true});
  const res=await fetch('/api/coach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,messages,context:ptCoachContext(data)})});
  const json=await res.json().catch(()=>({}));
  if(!res.ok)throw Object.assign(new Error(json.error||'Le coach ne répond pas.'),{config:res.status===401||res.status===503});
  return json;
}

// Applique la décision : la séance du jour (parcours, sinon séance du profil joueur) est allégée, filtrée, ou remplacée.
function ptCoachApply({data,update,go,notify},entry){
  const c=entry.checkin,plan=entry.plan,today=PT.dateKey();
  if(data.draft?.status==='active'){notify('Une séance est déjà en cours : termine-la avant d’appliquer le coach.');go('session');return;}
  const check={...data.checkIn,date:today,equipment:data.owned,minutes:plan.minutes||c.minutes,energy:c.form<=2||c.sleep==='bad'?'low':'normal',motivation:c.form<=2?'low':'normal'};
  const state={...data,checkIn:check};
  const mark=()=>update(s=>({...s,checkIn:check,coachLog:(s.coachLog||[]).map(x=>x.id===entry.id?{...x,applied:true}:x)}));
  if(plan.decision==='rest'){mark();notify('Repos aujourd’hui. Ton bilan est enregistré.');go('today');return;}
  if(plan.decision==='rehab'){mark();const RW=window.RehabWarmup,region=plan.rehabRegion||plan.avoidRegions[0];go('rehab',RW&&region?RW.zoneOfRegion[region]:undefined);return;}
  let base;
  if(plan.decision==='mobility')base=PT.generate(state,{...check,focus:'mobility',minutes:Math.min(20,check.minutes)});
  else{
    const BP=window.BasketPathway,JP=window.PlayerProfile,p=data.pathway;
    if(p&&BP){const step=BP.stepById(p.step),day=step.days.find(d=>d.key===BP.weekStatus(p).next);if(day)base=BP.sessionPlan(PT,JP,state,p,day.key);}
    if((!base||base.error)&&data.player?.position&&JP)base=JP.dailyBody(PT,state,{minutes:check.minutes});
    if(!base||base.error)base=PT.generate(state,{...check,focus:'muscle'});
  }
  if(!base||base.error){notify(base?.error||'Aucune séance possible aujourd’hui.');return;}
  const avoid=new Set(plan.avoidRegions||[]);
  let exercises=base.exercises.filter(e=>!(e.regions||[]).some(r=>avoid.has(r))&&!(plan.avoidImpact&&e.impact));
  if(exercises.length<2&&plan.decision!=='mobility'){
    const mobility=PT.generate(state,{...check,focus:'mobility',minutes:15});
    if(mobility.error){notify('Trop de zones à épargner : repos ou soin aujourd’hui.');return;}
    base=mobility;exercises=mobility.exercises.filter(e=>!(e.regions||[]).some(r=>avoid.has(r)));
  }
  exercises=exercises.map(e=>({...e,sets:Math.max(1,Math.round(e.sets*(plan.setsFactor||1))),rest:Math.round((e.rest||60)*(plan.restFactor||1))}));
  const draft={...base,id:PT.uid(),exercises,coach:{decision:plan.decision,why:plan.why},reasons:[`Coach : ${plan.why||COACH_DECISIONS[plan.decision]}`,...(base.reasons||[])]};
  update(s=>({...s,checkIn:check,draft,coachLog:(s.coachLog||[]).map(x=>x.id===entry.id?{...x,applied:true}:x)}));go('preview');
}

function PTCoachCard({data,go}){
  const entry=ptCoachToday(data);
  if(entry)return <button className="coach-card done sport-reveal" onClick={()=>go('coach')}><span className="coach-avatar"><PTIcon name="spark" size={20}/></span><span><small>Bilan du jour fait · {COACH_DECISIONS[entry.plan?.decision]||'en cours'}</small><strong>{entry.plan?.why||'Voir la réponse du coach'}</strong></span><PTIcon name="arrow" size={18}/></button>;
  return <section className="coach-card sport-reveal"><span className="eyebrow">Coach</span><h2>Comment tu te sens aujourd’hui ?</h2><p className="fine">30 secondes de questions, et ta séance s’adapte à ton état.</p><PTButton primary onClick={()=>go('coach')}>Faire mon bilan<PTIcon name="arrow" size={18}/></PTButton></section>;
}

function PTCoachSettings(){
  const [token,setToken]=usePTState(ptCoachToken()),[saved,setSaved]=usePTState(false);
  return <details className="disclosure"><summary>Réglages du coach</summary><div className="stack"><PTField label="Code d’accès du coach" type="password" autoComplete="off" value={token} onChange={e=>{setToken(e.target.value);setSaved(false);}} hint="Le même code que COACH_TOKEN dans Vercel. Gardé sur cet appareil uniquement."/><PTButton onClick={()=>{try{localStorage.setItem('rh_coach_token',token.trim());setSaved(true);}catch(e){}}}>Enregistrer le code</PTButton>{saved&&<p className="fine" role="status">Code enregistré sur cet appareil.</p>}</div></details>;
}

// Une question du bilan (défini hors du rendu : un composant recréé à chaque frappe ferait perdre le curseur).
function PTCoachQ({title,children}){return <div className="coach-q"><h3>{title}</h3>{children}</div>;}

function PTCoach({data,update,go,notify}){
  const existing=ptCoachToday(data);
  const [c,setC]=usePTState(()=>existing?.checkin||ptCoachBlank()),[busy,setBusy]=usePTState(false),[error,setError]=usePTState(''),[draft,setDraft]=usePTState(''),[redo,setRedo]=usePTState(false);
  const entry=redo?null:existing;
  const set=(k,v)=>setC(x=>({...x,[k]:v}));
  const missing=c.form==null||!c.sleep||!c.soreness||!c.pain||!c.basketYesterday||!c.basketSoon||(c.pain==='yes'&&!c.zones.length)||(c.basketYesterday!=='none'&&!c.basketIntensity);
  const save=(fn)=>update(s=>({...s,coachLog:fn(s.coachLog||[]).slice(-60)}));
  const send=async()=>{
    if(missing){setError('Réponds à chaque question pour que le coach ait le tableau complet.');return;}
    setBusy(true);setError('');
    const messages=[{role:'user',text:ptCoachSummary(c)}];
    let answer;
    try{answer=await ptCoachAsk(data,messages);}catch(e){if(e.config)setError(e.message);answer=ptCoachLocal(c);}
    const plan=ptCoachGuard(answer.plan,c);
    const item={id:PT.uid(),date:PT.dateKey(),checkin:c,plan,offline:!!answer.offline,messages:[...messages,{role:'coach',text:answer.message,questions:answer.questions||[]}],applied:false};
    save(log=>[...log.filter(x=>x.date!==item.date),item]);setRedo(false);setBusy(false);
  };
  const reply=async()=>{
    const text=draft.trim();if(!text||!entry)return;
    setBusy(true);setError('');
    const messages=[...entry.messages.map(m=>({role:m.role,text:m.text})),{role:'user',text}];
    try{
      const answer=await ptCoachAsk(data,messages);const plan=ptCoachGuard(answer.plan,entry.checkin);
      save(log=>log.map(x=>x.id===entry.id?{...x,plan,applied:false,messages:[...x.messages,{role:'user',text},{role:'coach',text:answer.message,questions:answer.questions||[]}]}:x));setDraft('');
    }catch(e){setError(e.message);}
    setBusy(false);
  };
  if(entry){
    const last=entry.messages.filter(m=>m.role==='coach').slice(-1)[0];
    return <><PTPageHead eyebrow="Coach · bilan du jour" title="Ton plan du jour."/><div className="stack-lg">
      <div className="coach-thread" aria-live="polite">{entry.messages.map((m,i)=><div key={i} className={`bubble ${m.role}`}>{m.role==='user'&&i===0?<><small>Ton bilan</small>{m.text.replace(/^Bilan du jour : /,'')}</>:m.text}{m.questions?.length>0&&<ul>{m.questions.map(q=><li key={q}>{q}</li>)}</ul>}</div>)}</div>
      <section className={`coach-plan decision-${entry.plan.decision}`}><span className="eyebrow">Décision</span><h2>{COACH_DECISIONS[entry.plan.decision]}</h2><p className="fine">{entry.plan.why}</p>
        <ul className="reason-list">{entry.plan.decision!=='rest'&&entry.plan.setsFactor<1&&<li>Séries réduites ({Math.round(entry.plan.setsFactor*100)} %)</li>}{entry.plan.restFactor>1&&<li>Repos allongé</li>}{entry.plan.avoidRegions.length>0&&<li>Zones épargnées : {entry.plan.avoidRegions.map(r=>PT.regions[r]).join(', ')}</li>}{entry.plan.avoidImpact&&<li>Pas de sauts ni d’impacts</li>}</ul>
        {entry.applied?<p className="fine">Appliqué à ta séance du jour.</p>:null}
        <PTButton primary onClick={()=>ptCoachApply({data,update,go,notify},entry)}>{entry.plan.decision==='rest'?'OK, repos aujourd’hui':entry.plan.decision==='rehab'?'Ouvrir le soin':'Appliquer à ma séance'}<PTIcon name="arrow" size={18}/></PTButton>
        {entry.checkin.pain==='yes'&&<button className="text-button" onClick={()=>go('symptoms')}>Enregistrer cette douleur dans mon suivi →</button>}
      </section>
      {entry.offline?<p className="notice">Réponse hors ligne. Reconnecte-toi pour parler au coach.</p>:<div className="coach-input"><PTField label="Répondre au coach" value={draft} maxLength="600" onChange={e=>setDraft(e.target.value)} placeholder={last?.questions?.[0]||'Une précision, une question…'}/><PTButton disabled={busy||!draft.trim()} onClick={reply}>{busy?'Le coach réfléchit…':'Envoyer'}</PTButton></div>}
      {error&&<p className="error" role="alert">{error}</p>}
      <PTButton quiet onClick={()=>{setC(entry.checkin);setRedo(true);}}>Refaire mon bilan</PTButton>
      <PTCoachSettings/>
    </div></>;
  }
  return <><PTPageHead eyebrow="Coach · bilan du jour" title="Comment tu te sens ?">Réponds en quelques touches. Le coach sait déjà ce que tu as fait dans l’app.</PTPageHead><div className="stack-lg coach-form">
    <PTCoachQ title="Ta forme aujourd’hui"><PTChips options={COACH_FORM} value={c.form} onChange={v=>set('form',v)}/></PTCoachQ>
    <PTCoachQ title="Ta nuit"><PTChips options={[{value:'bad',label:'Mauvaise'},{value:'mid',label:'Moyenne'},{value:'good',label:'Bonne'}]} value={c.sleep} onChange={v=>set('sleep',v)}/></PTCoachQ>
    <PTCoachQ title="Courbatures"><PTChips options={[{value:'none',label:'Aucune'},{value:'light',label:'Légères'},{value:'strong',label:'Fortes'}]} value={c.soreness} onChange={v=>set('soreness',v)}/></PTCoachQ>
    <PTCoachQ title="Une douleur ?"><PTChips options={[{value:'no',label:'Non'},{value:'yes',label:'Oui'}]} value={c.pain} onChange={v=>set('pain',v)}/>
      {c.pain==='yes'&&<div className="stack-sm"><p className="fine">Où ? (plusieurs choix possibles)</p><PTChips multi options={COACH_ZONES.map(z=>({value:z.id,label:z.label}))} value={c.zones} onChange={v=>set('zones',v)}/>
        <PTField label={`Intensité : ${c.painLevel}/10`} type="range" min="1" max="10" value={c.painLevel} onChange={e=>set('painLevel',Number(e.target.value))}/>
        <label className="check-label"><input type="checkbox" checked={c.redFlags} onChange={e=>set('redFlags',e.target.checked)}/>Gonflement, douleur la nuit, articulation qui lâche ou fourmillements</label></div>}</PTCoachQ>
    <PTCoachQ title="Basket hier ?"><PTChips options={[{value:'none',label:'Non'},{value:'practice',label:'Entraînement'},{value:'match',label:'Match'}]} value={c.basketYesterday} onChange={v=>set('basketYesterday',v)}/>
      {c.basketYesterday&&c.basketYesterday!=='none'&&<PTChips options={[{value:'light',label:'Léger'},{value:'medium',label:'Moyen'},{value:'hard',label:'Dur'}]} value={c.basketIntensity} onChange={v=>set('basketIntensity',v)}/>}</PTCoachQ>
    <PTCoachQ title="Basket prévu bientôt ?"><PTChips options={[{value:'none',label:'Non'},{value:'today',label:'Aujourd’hui'},{value:'tomorrow',label:'Demain'}]} value={c.basketSoon} onChange={v=>set('basketSoon',v)}/></PTCoachQ>
    <PTCoachQ title="Temps disponible"><PTChips options={[15,30,45,60].map(n=>({value:n,label:`${n} min`}))} value={c.minutes} onChange={v=>set('minutes',v)}/></PTCoachQ>
    <PTField label="Autre chose ? (facultatif)" value={c.note} maxLength="400" onChange={e=>set('note',e.target.value)} placeholder="Ex. : jambes lourdes, stress, peu mangé…"/>
    {error&&<p className="error" role="alert">{error}</p>}
    <PTButton primary disabled={busy} onClick={send}>{busy?'Le coach réfléchit…':'Envoyer au coach'}<PTIcon name="arrow" size={18}/></PTButton>
    {redo&&<PTButton quiet onClick={()=>setRedo(false)}>Revenir à la réponse du coach</PTButton>}
    <PTCoachSettings/>
  </div></>;
}
