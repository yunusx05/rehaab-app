/* Skills basket : questionnaire, paliers, programme, panier du jour, ressenti en fin de séance.
   Décisions dans basket-skills.js (exercices, paliers, séances, blocs) et training-load.js (place dans la semaine). */
const ptSkillsDayLabel={full:'Bon jour pour une séance skills complète.',light:'Séance skills légère conseillée : tir et dribble sur place, sans saut.',blocks:'Séances skills de la semaine faites : les blocs continuent après tes autres séances.',none:'Pas de séance skills aujourd’hui (club ou match) : le basket est déjà au programme.'};

function ptSkillsLaunch({data,update,go,notify},{light=false,minutes}={}){
  const SK=window.BasketSkills;
  if(data.draft?.status==='active'){go('session');notify('Ta séance en cours est conservée.');return;}
  const plan=SK.session(PT,data,{minutes,light});
  if(plan.error){notify(plan.error);return;}
  update(s=>({...s,draft:plan}));go('preview');
}

function PTSkillsHome({data,update,go,notify}){
  const SK=window.BasketSkills,TL=window.TrainingLoad;
  const s=SK.validate(data.skills),day=TL?TL.day(data):null,hoop=SK.hoopToday(s);
  const setSkills=fn=>update(st=>({...st,skills:fn(SK.validate(st.skills))}));
  if(!SK.complete(s))return <><PTPageHead onBack={()=>go('pathway')} eyebrow="Skills basket" title="Mes skills.">Dribble, tir, finition, appuis : un programme à ton niveau, relié à ta muscu et à ton parcours.</PTPageHead><div className="stack-lg">
    <section className="card stack"><h2>Commence par le questionnaire</h2><p className="fine">Deux minutes : tu notes chaque point (main faible, dribble tête haute, catch & shoot, finition…). Ton palier de départ et tes priorités en sortent.</p><PTButton primary onClick={()=>go('skills-quiz')}>Faire le questionnaire<PTIcon name="arrow" size={18}/></PTButton></section>
    <div className="home-options">{Object.entries(SK.areas).map(([id,a])=><div key={id} className="home-action"><PTIcon name="basket"/><span><strong>{a.label}</strong><small>{a.style?`Inspiration ${a.style} · `:''}{a.why}</small></span></div>)}</div>
  </div></>;
  const prog=s.program||{perWeek:2,minutes:45,blocks:true,blockMinutes:15,status:'active'};
  const setProg=(k,v)=>setSkills(x=>({...x,program:{...prog,...(x.program||{}),[k]:v}}));
  const prio=SK.priorities(s,data.player).slice(0,3);
  const last=[...s.log].reverse().slice(0,5);
  return <><PTPageHead onBack={()=>go('pathway')} eyebrow="Skills basket" title="Mes skills.">{SK.summary(s)}</PTPageHead><div className="stack-lg">
    <section className="card stack-sm"><span className="eyebrow">Aujourd’hui</span>
      <strong>{day?ptSkillsDayLabel[day.skills]:'Séance skills disponible.'}</strong>
      <label className="check-label"><input type="checkbox" checked={hoop} onChange={e=>setSkills(x=>({...x,hoopDate:e.target.checked?PT.dateKey():null}))}/>J’ai un panier aujourd’hui</label>
      <PTButton primary disabled={day&&day.skills==='none'} onClick={()=>ptSkillsLaunch({data,update,go,notify},{light:day?.skills==='light'})}>{day?.skills==='light'?'Lancer la séance légère':'Lancer une séance skills'}<PTIcon name="arrow" size={18}/></PTButton>
      {day&&day.skills==='blocks'&&<button className="text-button" onClick={()=>ptSkillsLaunch({data,update,go,notify},{light:true,minutes:30})}>Une séance de plus quand même (30 min, légère)</button>}
    </section>
    <section className="stack"><h3>Mes paliers</h3>
      <div className="home-options">{Object.entries(SK.areas).map(([id,a])=><div key={id} className="home-action"><PTIcon name="basket"/><span><strong>{a.label} · {SK.TIERS[s.levels[id]-1]}</strong><small>{a.style?`Inspiration ${a.style} · `:''}{a.why}</small></span></div>)}</div>
      <p className="fine">Tu montes d’un palier après deux séances « trop facile » (ou 70 % de tirs réussis), tu redescends après deux « trop dur » (ou moins de 35 %).</p>
    </section>
    <section className="stack-sm"><h3>Mes priorités</h3><ul className="reason-list">{prio.map(p=><li key={p.id}>{p.label} · {SK.areas[p.area].short.toLowerCase()}</li>)}</ul></section>
    <section className="stack"><h3>Mon programme skills</h3>
      <PTCoachQ title="Séances skills par semaine"><PTChips options={[1,2,3,4].map(n=>({value:n,label:`${n}`}))} value={prog.perWeek} onChange={v=>setProg('perWeek',v)}/></PTCoachQ>
      <PTCoachQ title="Durée d’une séance skills"><PTChips options={[30,45,60].map(n=>({value:n,label:`${n} min`}))} value={prog.minutes} onChange={v=>setProg('minutes',v)}/></PTCoachQ>
      <label className="check-label"><input type="checkbox" checked={prog.blocks!==false} onChange={e=>setProg('blocks',e.target.checked)}/>Ajouter un bloc skills après mes séances muscu et parcours</label>
      {prog.blocks!==false&&<PTCoachQ title="Durée du bloc ajouté"><PTChips options={[10,15,20].map(n=>({value:n,label:`${n} min`}))} value={prog.blockMinutes} onChange={v=>setProg('blockMinutes',v)}/><p className="fine">Après le haut du corps : dribble puis tir. Jour de footing : finition au cercle. Après les jambes : tir de forme, sans saut. Rien les jours de club ou de match.</p></PTCoachQ>}
    </section>
    {last.length>0&&<section className="stack-sm"><h3>Dernières séances</h3><ul className="reason-list">{last.map((x,i)=><li key={i}>{x.date.slice(8,10)}/{x.date.slice(5,7)} · {SK.areas[x.area].short} · {{easy:'trop facile',right:'juste',hard:'trop dur'}[x.rating]}{x.attempts?` · ${x.made}/${x.attempts} tirs`:''}</li>)}</ul></section>}
    <div className="home-options">
      <button className="home-action" onClick={()=>go('skills-quiz')}><PTIcon name="refresh"/><span><strong>Refaire le questionnaire</strong><small>Tes paliers seront recalculés.</small></span><PTIcon name="arrow" size={18}/></button>
      <button className="home-action" onClick={()=>go('library')}><PTIcon name="book"/><span><strong>Tous les exercices</strong><small>Onglet « Basket » de la bibliothèque.</small></span><PTIcon name="arrow" size={18}/></button>
    </div>
  </div></>;
}

function PTSkillsQuiz({data,update,go,notify}){
  const SK=window.BasketSkills,prev=SK.validate(data.skills);
  const [answers,setAnswers]=usePTState(prev.profile.answers),[tests,setTests]=usePTState({freeThrows:prev.profile.tests.freeThrows??'',spotShooting:prev.profile.tests.spotShooting??''}),[error,setError]=usePTState('');
  const missing=Object.keys(SK.items).filter(k=>answers[k]==null);
  const save=()=>{
    if(missing.length){setError(`Il reste ${missing.length} point${missing.length>1?'s':''} à noter.`);return;}
    const next=SK.saveProfile(data.skills,{answers,tests});
    update(s=>({...s,skills:next}));
    notify(`Paliers : ${Object.entries(SK.areas).map(([a,x])=>`${x.short} ${SK.TIERS[next.levels[a]-1].toLowerCase()}`).join(', ')}.`);
    go('skills');
  };
  return <><PTPageHead onBack={()=>go('skills')} eyebrow="Questionnaire skills" title="Où en es-tu ?">Note chaque point comme tu le vis en match, pas à l’entraînement tranquille.</PTPageHead><div className="stack-lg coach-form">
    {Object.entries(SK.areas).map(([area,a])=><section key={area} className="stack"><h2>{a.label}</h2>
      {Object.entries(SK.items).filter(([,v])=>v.area===area).map(([id,v])=><PTCoachQ key={id} title={v.label}><PTChips options={SK.ratings.map(([value,label])=>({value,label}))} value={answers[id]} onChange={n=>setAnswers(x=>({...x,[id]:n}))}/></PTCoachQ>)}
    </section>)}
    <section className="stack"><h2>Tests de tir (facultatifs)</h2><p className="fine">Avec un panier : ils ajustent ton palier de tir. Tes résultats servent de repère personnel.</p>
      <div className="form-grid"><PTField label="Lancers francs réussis sur 20" type="number" min="0" max="20" value={tests.freeThrows} onChange={e=>setTests(t=>({...t,freeThrows:e.target.value}))}/><PTField label="Mi-distance réussis sur 25 (5 positions × 5)" type="number" min="0" max="25" value={tests.spotShooting} onChange={e=>setTests(t=>({...t,spotShooting:e.target.value}))}/></div>
    </section>
    {error&&<p className="error" role="alert">{error}</p>}
    <PTButton primary onClick={save}>Calculer mes paliers<PTIcon name="arrow" size={18}/></PTButton>
  </div></>;
}

// Aperçu : « panier aujourd'hui » reconstruit la séance skills ou le bloc ajouté.
function PTSkillsHoop({data,update,plan}){
  const SK=window.BasketSkills;
  if(!SK||!plan||!(plan.source==='skills'||plan.exercises.some(e=>e.skillBlock)))return null;
  const hoop=SK.hoopToday(data.skills);
  const toggle=on=>update(s=>{
    const skills={...SK.validate(s.skills),hoopDate:on?PT.dateKey():null},st={...s,skills};
    let draft=s.draft;
    if(draft.source==='skills'){const next=SK.session(PT,st,{minutes:draft.check?.minutes,light:draft.reasons.some(r=>r.startsWith('Version légère'))});if(!next.error)draft=next;}
    else{const base={...draft,exercises:draft.exercises.filter(e=>!e.skillBlock),reasons:draft.reasons.filter(r=>!r.startsWith('Bloc skills')),estimatedMinutes:(draft.estimatedMinutes||0)-(draft.skillBlockMinutes||0)};draft=SK.withBlock(PT,st,base,{});}
    return {...st,draft};
  });
  return <label className="check-label"><input type="checkbox" checked={hoop} onChange={e=>toggle(e.target.checked)}/>J’ai un panier aujourd’hui (tir et finition ajoutés)</label>;
}

// Fin de séance : ressenti par domaine, il fait évoluer les paliers avec les tirs notés.
function PTSkillsRating({draft,value,onChange}){
  const SK=window.BasketSkills;
  const list=[...new Set((draft.exercises||[]).map(e=>e.skillArea).filter(Boolean))];
  if(!SK||!list.length)return null;
  return <section className="stack-sm"><h2>Les skills, c’était…</h2>{list.map(a=><PTCoachQ key={a} title={SK.areas[a].label}><PTChips options={[{value:'easy',label:'Trop facile'},{value:'right',label:'Juste'},{value:'hard',label:'Trop dur'}]} value={value[a]} onChange={v=>onChange({...value,[a]:v})}/></PTCoachQ>)}<p className="fine">Sans réponse, tes tirs réussis décident.</p></section>;
}
