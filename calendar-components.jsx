/* Lot 14 : calendrier de la semaine (route « calendar ») et plan de saison (route « plan »).
   Toute la logique est dans season-plan.js ; ces écrans affichent, lancent et déplacent les séances. */
const SP=window.SeasonPlan;
const ptCalIcon={pathway:'weight',reset:'body',muscu:'weight',vivacite:'spark',skills:'court',care:'heart',shooting:'basket'};
const ptCalStatus={done:'Faite',missed:'Manquée',planned:'Prévue'};
const ptShortDay=date=>`${date.slice(8,10)}/${date.slice(5,7)}`;

// Construit la séance correspondant à un élément du calendrier.
// day : le jour du calendrier. S'il porte déjà une séance skills, la séance du parcours n'ajoute pas son bloc skills (pas de doublon).
function ptCalendarPlan(data,item,day){
  const BP=window.BasketPathway,JP=window.PlayerProfile,SK=window.BasketSkills;
  const ownSkills=!!day&&day.items.some(x=>x.type==='skills');
  if(item.type==='pathway'&&data.pathway)return ownSkills&&BP.sessionPlanCore?BP.sessionPlanCore(PT,JP,data,data.pathway,item.day):BP.sessionPlan(PT,JP,data,data.pathway,item.day);
  if(item.type==='reset'){
    // Remise en route : les jours de l'étape 1, sans saut ni impact, hors parcours (rien n'est validé dans les étapes).
    const p=data.pathway&&data.pathway.step===1?data.pathway:BP.create({startStep:1});
    const plan=BP.sessionPlanCore?BP.sessionPlanCore(PT,JP,data,p,item.day):BP.sessionPlan(PT,JP,data,p,item.day);
    if(plan.error)return plan;
    const exercises=plan.exercises.filter(e=>!e.impact&&e.pattern!=='jump'&&!e.skillBlock);
    return {...plan,id:PT.uid(),source:'reset',pathwayId:undefined,pathwayStep:undefined,pathwayDay:undefined,title:item.label,exercises,reasons:['Remise en route : aucun saut ni sprint, les tendons d’abord.',...(plan.reasons||[]).filter(r=>!/saut|impact/i.test(r))],estimatedMinutes:Math.max(10,Math.round(PT.estimateSeconds(exercises,'classic')/60)+5)};
  }
  if(item.type==='vivacite')return BP.quickPlan(PT,JP,data,'vivacite');
  if(item.type==='skills'&&SK)return SK.session(PT,data,{minutes:item.minutes});
  return null;
}

function PTCalendar({data,update,go,notify}){
  const [shift,setShift]=usePTState(0),[moving,setMoving]=usePTState(null),[confirm,setConfirm]=usePTState(null),[error,setError]=usePTState('');
  if(!SP)return <p className="empty">Calendrier indisponible.</p>;
  const now=PT.dateKey(),monday=SP.at(SP.mondayOf(now),shift*7);
  const week=SP.weekSchedule(data,monday,now),phase=week.phase.phase;
  const launch=(item,day)=>{
    if(item.type==='muscu'){go('program');return;}
    if(item.type==='care'){go('rehab');return;}
    if(item.type==='shooting'){go('shooting');return;}
    if(data.draft?.status==='active'){setError('Une séance est en cours : termine-la ou reprends-la avant d’en lancer une autre.');return;}
    const plan=ptCalendarPlan(data,item,day);
    if(!plan||plan.error){setError(plan?.error||'Séance indisponible aujourd’hui.');return;}
    setError('');update(s=>({...s,draft:plan}));go('preview');
  };
  const cannot=item=>{const r=SP.missed(data,monday,item.key,now);if(r.ok)update(s=>({...s,calendar:r.calendar}));notify(r.why);};
  // Liberté + alerte : un jour qui casse une règle demande confirmation, puis la séance y va quand même.
  const moveTo=(item,date,force=false)=>{const r=SP.reschedule(data,monday,item.key,date,{force});if(!r.ok&&r.canForce){setConfirm({item,date,why:r.why});return;}setMoving(null);setConfirm(null);if(r.ok)update(s=>({...s,calendar:r.calendar}));notify(r.why);};
  const reset=item=>{update(s=>({...s,calendar:SP.unmove(s,monday,item.key)}));setMoving(null);notify(`${item.label} : placement automatique rétabli.`);};
  // Mes jours d'entraînement : même réponse que dans le dossier joueur, modifiable ici.
  const free=SP.freeDays(data),perWeek=SP.target(data);
  const setLife=(k,v)=>update(s=>{const PD=window.PlayerDossier,base=s.dossier||(PD?PD.blank():{answers:{}});return {...s,dossier:{...base,answers:{...(base.answers||{}),[k]:v}}};});
  const fullDate=date=>new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'numeric'});
  // Type de journée : un seul jour (cette semaine) ou toute la semaine type.
  const setMode=(date,mode,every)=>update(s=>{
    let next={...s,calendar:SP.setDayMode(s,date,mode,{every})};
    const wd=SP.weekday(date),days=SP.freeDays(s);
    // « Auto » sur un jour non disponible le rend disponible : sinon l'app n'y placerait rien.
    if(every&&mode==='auto'&&!days.includes(wd)){const PD=window.PlayerDossier,base=s.dossier||(PD?PD.blank():{answers:{}});next={...next,dossier:{...base,answers:{...(base.answers||{}),freeDays:[...days,wd].sort((a,b)=>a-b)}}};}
    return next;
  });
  const weekMode=wd=>{const m=SP.dayMode({calendar:{week:(data.calendar||{}).week||{}}},SP.at(monday,wd));return m==='auto'&&!free.includes(wd)?'off':m;};
  const modeOptions=Object.entries(SP.MODES).map(([value,label])=>({value,label}));
  const sk=data.skills?.program;
  const setSkillsPerWeek=n=>update(s=>({...s,skills:{...s.skills,program:{...s.skills.program,perWeek:n,status:'active'}}}));
  const exportIcs=()=>{ptDownload(`rehaab-plan-${now}.ics`,SP.ics(data,now,4),'text/calendar');notify('Calendrier exporté : ouvre le fichier pour ajouter les séances à ton agenda.');};
  const physCount=week.days.flatMap(d=>d.items).filter(x=>x.physical).length;
  return <><PTPageHead onBack={()=>go('pathway')} eyebrow={phase?`${phase.name} · semaine ${week.phase.week}`:'Mon plan'} title="Mon planning.">Muscu et skills dans un seul planning. Règle chaque jour : muscu, skills, les deux ou repos.</PTPageHead>
    <div className="stack-lg">
      <div className="calendar-nav"><button className="icon-button" aria-label="Semaine précédente" onClick={()=>setShift(shift-1)}><PTIcon name="back" size={18}/></button><strong>Semaine du {ptShortDay(monday)}</strong><button className="icon-button" aria-label="Semaine suivante" onClick={()=>setShift(shift+1)}><PTIcon name="arrow" size={18}/></button></div>
      <p className="calendar-balance"><span><strong>{physCount}</strong> muscu</span><span><strong>{week.skills.placed}</strong> skills</span><span className="fine">cette semaine</span></p>
      {week.skills.placed<week.skills.wanted&&<p className="notice warning">{week.skills.wanted-week.skills.placed} séance{week.skills.wanted-week.skills.placed>1?'s':''} skills sans place cette semaine : règle un jour sur « Skills » ou « Muscu + skills ».</p>}
      <details className="card stack-sm calendar-life disclosure">
        <summary><strong>Ma semaine type</strong><small>Le type de chaque jour, toutes les semaines</small></summary>
        <div className="stack-sm">
          <div className="calendar-modes">{SP.DAYS.map((d,i)=><label key={d} className="calendar-mode-row"><span>{d}</span><select value={weekMode(i)} onChange={e=>setMode(SP.at(monday,i),e.target.value,true)}>{modeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>)}</div>
          <p className="fine">« Auto » : l’app choisit selon tes règles de charge. « Muscu + skills » : la séance skills, raccourcie, suit la séance physique.</p>
          <div className="topline"><span className="fine">Séances physiques / semaine</span><PTChips value={perWeek} onChange={v=>setLife('sessions',String(v))} options={[2,3,4,5,6].map(n=>({value:n,label:String(n)}))}/></div>
          {sk?<div className="topline"><span className="fine">Séances skills / semaine</span><PTChips value={sk.perWeek} onChange={setSkillsPerWeek} options={[1,2,3,4].map(n=>({value:n,label:String(n)}))}/></div>
            :<button className="text-button" onClick={()=>go('skills-quiz')}>Faire le questionnaire skills pour ajouter des séances skills →</button>}
        </div>
      </details>
      {week.warnings.length>0&&<div className="notice warning"><ul className="reason-list">{week.warnings.map(w=><li key={w}>{w}</li>)}</ul></div>}
      {error&&<p className="error" role="alert">{error}</p>}
      <ol className="calendar-week">{week.days.map(d=><li key={d.date} className={`calendar-day${d.date===now?' is-today':''}${d.club.match?' is-match':''}`}>
        <div className="calendar-day-head"><strong>{d.label}</strong><span className="caption">{ptShortDay(d.date)}</span>{!d.club.match&&diff0(d.date,now)>=0&&<select className="calendar-day-mode" aria-label={`Type de journée, ${d.label.toLowerCase()} ${ptShortDay(d.date)}`} value={d.mode==='auto'&&!d.free?'off':d.mode} onChange={e=>setMode(d.date,e.target.value,false)}>{modeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>}{d.club.match&&<span className="badge">Match</span>}{d.club.practice&&<span className="badge quiet">Club</span>}{!d.free&&!d.club.match&&!d.club.practice&&<span className="caption">non dispo</span>}{d.weighIn&&window.BodyWeight&&<button className="text-button calendar-weigh" onClick={()=>go('weight')}>Pesée du matin</button>}</div>
        {d.items.length===0&&<p className="fine">{d.before?'Avant le début de ton plan.':d.club.match?'Échauffement avant match, rien d’autre.':d.club.practice?'Entraînement au club.':'Repos'}{d.qi&&!d.club.match?' · QI du jour (5 min)':''}</p>}
        {d.items.map(item=><div key={item.key} className={`calendar-item is-${item.status}`}>
          <PTIcon name={ptCalIcon[item.type]||'weight'} size={18}/>
          <span><strong>{item.label}</strong><small>{item.minutes} min · {ptCalStatus[item.status]}{item.moved?' · placée par toi':''}{item.legs==='heavy'?' · jambes':''}</small>{item.warning&&<small className="calendar-warning">⚠ {item.warning}</small>}</span>
          {item.status!=='done'&&diff0(d.date,now)>=0&&<span className="calendar-actions">
            {d.date===now&&<PTButton primary onClick={()=>launch(item,d)}>Lancer</PTButton>}
            {d.date===now&&<button className="text-button" onClick={()=>typeof PTMishap==='function'?go('mishap'):cannot(item)}>Je ne peux pas aujourd’hui</button>}
            <button className="text-button" aria-expanded={moving===item.key} onClick={()=>{setConfirm(null);setMoving(moving===item.key?null:item.key);}}>Choisir le jour</button>
          </span>}
          {moving===item.key&&<div className="calendar-move stack-sm" role="group" aria-label={`Choisir le jour de ${item.label}`}>
            <div className="calendar-move-days">{week.days.map(x=>{const past=diff0(x.date,now)<0,here=x.date===d.date,rule=!past&&!here?SP.ruleBreakAt(data,monday,item.key,x.date):null;
              return <button key={x.date} className={`calendar-move-day${rule?' has-rule':''}`} disabled={past||here} aria-pressed={here} onClick={()=>moveTo(item,x.date)}><strong>{fullDate(x.date)}</strong><small>{here?'Jour actuel':past?'Passé':rule?'⚠ règle':x.club.match?'Match':x.club.practice?'Club':free.includes(x.weekday)?'Libre':'Jour off'}</small></button>;})}</div>
            {confirm?.item.key===item.key&&<div className="notice warning stack-sm" role="alert"><p><strong>{fullDate(confirm.date)} :</strong> {confirm.why} Placer quand même ?</p><div className="button-row"><PTButton primary onClick={()=>moveTo(item,confirm.date,true)}>Oui, ce jour-là</PTButton><PTButton quiet onClick={()=>setConfirm(null)}>Choisir un autre jour</PTButton></div></div>}
            {item.moved&&<button className="text-button" onClick={()=>reset(item)}>Laisser l’app choisir le jour</button>}
            <p className="fine">Pour une autre semaine, change de semaine avec les flèches en haut.</p>
          </div>}
        </div>)}
      </li>)}</ol>
      <details className="disclosure"><summary>Les règles du calendrier</summary><div><ul className="reason-list"><li>Pas de jambes lourdes la veille ni le lendemain d’un match.</li><li>48 heures entre deux séances de jambes lourdes.</li><li>Pas de skills un jour de club (le basket y est déjà), sauf si tu règles ce jour sur « Skills » ou « Muscu + skills ».</li><li>Skills sans jour libre : elles passent après une séance physique, en version courte, plutôt que de disparaître.</li><li>Une seule séance physique par jour, et pas plus que ton objectif de la semaine.</li></ul><p className="fine">Ce sont des conventions d’entraînement courantes, pas des normes médicales (voir les sources du plan).</p></div></details>
      <div className="home-options">
        <button className="home-action" onClick={()=>go('plan')}><PTIcon name="chart"/><span><strong>Mon plan de saison</strong><small>Les phases, où tu en es, et pourquoi ce plan.</small></span><PTIcon name="arrow" size={18}/></button>
        <button className="home-action" onClick={exportIcs}><PTIcon name="today"/><span><strong>Ajouter à mon agenda</strong><small>Fichier .ics des 4 prochaines semaines, avec les rappels de ton téléphone.</small></span><PTIcon name="arrow" size={18}/></button>
      </div>
    </div></>;
}
const diff0=(a,b)=>PT.dayDiff(a,b);

// Choix des créneaux proposés à l'IA architecte : la liste fermée de chaque créneau (exercices du créneau + fiches basket du même mouvement).
function ptArchitectSlots(data){
  const BP=window.BasketPathway,p=data.pathway;if(!BP)return {};
  const step=BP.stepById(p?p.step:1),out={};
  step.days.forEach(day=>day.slots.forEach((slot,i)=>{
    const base=slot.ids.map(id=>PT.catalog.find(e=>e.id===id)).filter(Boolean);
    const pattern=base[0]?.pattern,extra=PT.catalog.filter(e=>e.transfer&&e.pattern===pattern&&!slot.ids.includes(e.id)&&(step.id>=3||!e.impact)).slice(0,6);
    out[`${step.id}${day.key}${i}`]=[...base,...extra].map(e=>({id:e.id,name:e.name,transfer:e.transfer||''}));
  }));
  return out;
}

function PTSeasonPlan({data,update,go,notify}){
  const [loading,setLoading]=usePTState(false),[error,setError]=usePTState('');
  if(!SP)return <p className="empty">Plan indisponible.</p>;
  const built=SP.build(data),arch=data.seasonPlan?.architect,BP=window.BasketPathway;
  const gate=data.pathway&&BP?BP.gate(PT,data,data.pathway):null;
  const ask=async()=>{
    setLoading(true);setError('');
    const JP=window.PlayerProfile,AP=window.AthleticProfile;
    const context={dossier:window.PlayerDossier?.summary(data.dossier)||null,priorities:JP&&data.player?JP.priorities({...data.player,court:data.basketProfile},data.athletic).slice(0,5).map(p=>p.label):[],targets:AP&&data.athletic?AP.targets(data.athletic,data.player||{},3).map(t=>t.label):[],phase:built.current.phase?.name,phases:built.phases.map(p=>p.name),slots:ptArchitectSlots(data)};
    try{
      const r=await fetch('/api/coach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'plan',context,messages:[{role:'user',text:'Construis mon plan : diagnostic, accents par phase, choix par créneau, règles personnelles.'}]})});
      const j=await r.json();if(!r.ok||j.error)throw new Error(j.error||'Le coach ne répond pas.');
      const architect=SP.validateArchitect({...j,date:PT.dateKey()});
      update(s=>({...s,seasonPlan:{...(SP.validate(s.seasonPlan)||SP.blank()),architect}}));notify('Plan mis à jour par l’architecte. Les choix restent filtrés par tes douleurs et ton matériel.');
    }catch(e){setError('L’architecte n’est pas joignable (hors connexion ?). Ton plan reste construit par l’app.');}
    setLoading(false);
  };
  const set=patch=>update(s=>({...s,seasonPlan:{...(SP.validate(s.seasonPlan)||SP.blank()),...patch}}));
  return <><PTPageHead onBack={()=>go('calendar')} eyebrow="Plan de saison" title="Ton plan.">{built.returnRange?`Repère : ${built.returnRange.min} à ${built.returnRange.max} semaines jusqu’au retour au jeu, si les tests suivent. Ce n’est pas une promesse.`:'Les phases s’enchaînent à ton rythme, validées par tes tests.'}</PTPageHead>
    <div className="stack-lg">
      {built.need.reasons.length>0&&<section className="card stack-sm"><h2>Pourquoi ce plan</h2><ul className="reason-list">{built.need.reasons.map(r=><li key={r}>{r}</li>)}</ul></section>}
      <ol className="roadmap">{built.phases.map((ph,i)=><li key={ph.id} className={`roadmap-step${i===built.current.index?' is-current':i<built.current.index?' is-done':''}`}>
        <span className="roadmap-dot" aria-hidden="true"/>
        <div className="stack-sm"><div className="topline"><strong>{ph.name}</strong><span className="caption">{ph.weeks}</span></div>
          {i===built.current.index&&<p className="badge">Tu es ici · semaine {built.current.week}{built.deload?' · semaine allégée':''}</p>}
          <p className="fine">{ph.goal}</p>
          {i===built.current.index&&ph.rules&&<ul className="reason-list">{ph.rules.map(r=><li key={r}>{r}</li>)}</ul>}
          {arch?.accents?.filter(a=>ph.name.toLowerCase().includes(a.phase.toLowerCase())||a.phase===ph.id).map(a=><p key={a.text} className="court-transfer"><PTIcon name="spark" size={16}/><span><strong>Accent de l’architecte</strong>{a.text}</span></p>)}
        </div></li>)}</ol>
      {built.current.id==='reset'&&<PTButton quiet onClick={()=>{set({resetDone:PT.dateKey()});notify('Remise en route terminée : place au parcours.');}}>La remise en route est faite, je passe au parcours</PTButton>}
      {gate?.last&&gate.ready&&!data.seasonPlan?.devStart&&<PTButton primary onClick={()=>{set({devStart:PT.dateKey()});notify('Phase de développement lancée : cycles de 4 semaines.');}}>Commencer le développement</PTButton>}
      <p className="fine">Prochain point de test : {ptShortDay(built.nextTest)}. Détente, sprint et douleur font avancer le plan.</p>
      <section className="card stack">
        <h2>L’architecte (IA)</h2>
        {arch?<>
          {arch.message&&<p>{arch.message}</p>}
          {arch.priorities.length>0&&<ol className="stack-sm">{arch.priorities.map((p,i)=><li key={p.label} className="dossier-priority"><b>{i+1}</b><span><strong>{p.label}</strong><small>{p.why}</small></span></li>)}</ol>}
          {arch.rules.length>0&&<><h3>Tes règles personnelles</h3><ul className="reason-list">{arch.rules.map(r=><li key={r}>{r}</li>)}</ul></>}
          <p className="fine">{Object.keys(arch.choices).length} choix d’exercices appliqués à tes séances, toujours filtrés par tes douleurs et ton matériel. Mis à jour le {arch.date?ptShortDay(arch.date):'—'}.</p>
        </>:<p className="fine">L’architecte lit ton dossier et choisit, pour chaque créneau, l’exercice le plus utile parmi une liste fermée. La sécurité reste dans l’app.</p>}
        {error&&<p className="error" role="alert">{error}</p>}
        <PTButton primary={!arch} disabled={loading} onClick={ask}>{loading?'L’architecte réfléchit…':arch?'Refaire le plan avec l’architecte':'Demander à l’architecte'}</PTButton>
      </section>
    </div></>;
}

// Bilan de la semaine écoulée : carte de l'accueil, une fois par semaine.
function PTWeekReview({data,update,notify}){
  const [ai,setAi]=usePTState(null),[loading,setLoading]=usePTState(false);
  if(!SP)return null;
  const monday=SP.at(SP.mondayOf(PT.dateKey()),-7),done=(data.weeklyReviews||[]).some(r=>r.monday===monday);
  if(done)return null;
  const r=SP.review(data,monday);
  if(!r.planned&&!r.tests.length&&!r.weight)return null;
  const close=accepted=>update(s=>{let next=s;accepted.forEach(id=>{next=SP.applySuggestion(next,id);});return {...next,weeklyReviews:[...(s.weeklyReviews||[]),{monday,date:PT.dateKey(),accepted,message:ai||''}].slice(-26)};});
  const askAi=async()=>{setLoading(true);try{const res=await fetch('/api/coach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'review',context:{review:r,suggestions:r.suggestions},messages:[{role:'user',text:'Fais le debrief de ma semaine.'}]})});const j=await res.json();if(!res.ok||j.error)throw new Error();setAi(j.message);}catch(e){notify('Debrief IA indisponible : le bilan ci-dessus reste valable.');}setLoading(false);};
  return <section className="card stack-sm week-review">
    <span className="eyebrow">Bilan de la semaine</span>
    <h2>{r.done} séance{r.done>1?'s':''} sur {r.planned} prévue{r.planned>1?'s':''}.</h2>
    <ul className="reason-list">
      {r.missed.length>0&&<li>Manquées : {r.missed.join(', ')}.</li>}
      {r.weight&&<li>Poids : {r.weight.value} kg{r.weight.change!==null?` (${r.weight.change>0?'+':''}${r.weight.change} kg)`:''}.</li>}
      {r.shooting&&<li>Tir : {r.shooting.made}/{r.shooting.attempts} ({r.shooting.pct} %).</li>}
      {r.qi.answered>0&&<li>QI : {r.qi.correct}/{r.qi.answered} bonnes lectures.</li>}
      {r.tests.length>0&&<li>{r.tests.length} test{r.tests.length>1?'s':''} mesuré{r.tests.length>1?'s':''}.</li>}
      {r.pains.length>0&&<li>Douleur active : {r.pains.map(p=>`${PT.regions[p.region]} ${p.severity}/10`).join(', ')}.</li>}
    </ul>
    {ai&&<p className="coach-quote">{ai}</p>}
    {r.suggestions.length>0&&<div className="stack-sm">{r.suggestions.map(s=><p key={s.id} className="fine"><strong>{s.label}.</strong> {s.why}</p>)}</div>}
    <div className="stack-sm">
      {r.suggestions.some(s=>s.id==='lighter')&&<PTButton primary onClick={()=>{close(['lighter']);notify('Semaine prochaine : une séance de moins.');}}>Accepter : une séance de moins</PTButton>}
      <PTButton quiet onClick={()=>{close([]);notify('Bilan enregistré.');}}>{r.suggestions.some(s=>s.id==='lighter')?'Garder mon plan':'C’est noté'}</PTButton>
      {!ai&&<button className="text-button" disabled={loading} onClick={askAi}>{loading?'Le coach lit ta semaine…':'Debrief du coach (IA)'}</button>}
    </div>
  </section>;
}

// Bandeau de la semaine sur l'accueil : un point par séance prévue, le jour J mis en avant ; un appui ouvre le calendrier.
function PTWeekStrip({data,go}){
  if(!SP)return null;
  const now=PT.dateKey(),week=SP.weekSchedule(data,now,now),today=week.days.find(d=>d.date===now);
  const next=today?.items.find(x=>x.status==='planned');
  return <button className="week-strip sport-reveal" onClick={()=>go('calendar')} aria-label="Ouvrir ma semaine">
    <span className="week-strip-head"><span className="eyebrow">Ma semaine</span><strong>{next?`Aujourd’hui : ${next.label}`:today?.club.match?'Jour de match':today?.club.practice?'Club ce soir':'Repos aujourd’hui'}</strong></span>
    <span className="week-strip-days">{week.days.map(d=><span key={d.date} className={`week-strip-day${d.date===now?' is-today':''}${d.club.match?' is-match':''}`}><small>{d.label.slice(0,1)}</small><em>{Number(d.date.slice(8))}</em><i>{d.items.filter(x=>x.type!=='care').map(x=><b key={x.key} className={`dot is-${x.status} type-${x.type}`}/>)}{d.club.match&&<b className="dot is-match"/>}</i></span>)}</span>
  </button>;
}
