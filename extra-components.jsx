/* Lot 41 · Extra : des séances à la carte, les jours où tu veux faire autre chose que ton programme (ou en plus).
   Un thème, un niveau, une durée de 10 à 60 min, un seul endroit. Le planning ne bouge pas : une séance Extra ne coche pas la séance prévue. */
const PT_EXTRA=[
  {id:'shoot',label:'Tir',icon:'basket',basket:true,place:'court'},
  {id:'handle',label:'Dribble',icon:'basket',basket:true,place:'home'},
  {id:'finish',label:'Finition',icon:'spark',basket:true,place:'court',courtOnly:true},
  {id:'moves',label:'Moves & appuis',icon:'run',basket:true,place:'court'},
  {id:'defense',label:'Défense',icon:'court',basket:true,place:'court',courtOnly:true},
  {id:'upper',label:'Haut du corps',icon:'weight',place:'home'},
  {id:'lower',label:'Bas du corps',icon:'body',place:'home',legs:true},
  {id:'core',label:'Abdos & gainage',icon:'core',place:'home'},
  {id:'explosive',label:'Explosivité',icon:'spark',place:'court',legs:true},
  {id:'mobility',label:'Mobilité & récup',icon:'refresh',place:'home'}
];
const PT_EXTRA_MINUTES=[10,15,20,30,45,60];
const PT_EXTRA_OUT=['court','outdoor','sand','hoop'];
// Ce qu'on emporte au terrain : le reste (charges, banc, machines) reste à la maison.
const PT_EXTRA_CARRY=['bodyweight','bands','miniband','sliders','ball','rope','cones','vest'];

function ptExtraPlan(data,{theme,place,minutes,tier}){
  const t=PT_EXTRA.find(x=>x.id===theme);if(!t)return {error:'Choisis un thème.'};
  const owned=data.owned||['bodyweight'],court=place==='court';
  const equipment=court?[...new Set(['bodyweight',...owned.filter(n=>PT_EXTRA_CARRY.includes(n)||PT_EXTRA_OUT.includes(n))])]:owned.filter(n=>!PT_EXTRA_OUT.includes(n));
  const SK=window.BasketSkills,BC=window.BasketCore,BP=window.BasketPathway,JP=window.PlayerProfile;
  const check={...data.checkIn,date:PT.dateKey(),equipment,minutes,format:'auto',motivation:'normal',energy:data.checkIn?.date===PT.dateKey()?data.checkIn.energy:'normal'};
  let plan=null;
  if(t.basket)plan=SK&&SK.areaSession?SK.areaSession(PT,data,{theme,minutes,tier,court}):null;
  else if(theme==='upper'||theme==='lower')plan=PT.zoneSession(data,{zone:theme,minutes,equipment});
  else if(theme==='core')plan=BC?BC.workout(PT,{...data,owned:equipment},{minutes}):null;
  else if(theme==='explosive')plan=court&&minutes<=20&&BP?BP.quickPlan(PT,JP,data,'vivacite'):PT.generate(data,{...check,focus:'plyo'});
  else if(theme==='mobility')plan=PT.generate(data,{...check,focus:'mobility'});
  if(!plan||plan.error)return plan||{error:'Séance indisponible pour l’instant.'};
  const where=court?'Tout au terrain.':'Tout à la maison.';
  return {...plan,id:PT.uid(),source:t.basket?'extra':plan.source,extra:theme,title:`Extra · ${t.label}`,
    reasons:[...(plan.reasons||[]).filter(r=>!/^Tout (se fait )?(au terrain|à la maison)/.test(r)),...(t.basket?[]:[where])]};
}

function PTExtra({data,update,go,notify}){
  const SK=window.BasketSkills;
  const [theme,setThemeRaw]=usePTState('shoot');
  const t=PT_EXTRA.find(x=>x.id===theme)||PT_EXTRA[0];
  const [place,setPlace]=usePTState(t.place);
  const [minutes,setMinutes]=usePTState(30);
  const [tier,setTier]=usePTState(null);
  const setTheme=id=>{const n=PT_EXTRA.find(x=>x.id===id);setThemeRaw(id);setPlace(n.place);setTier(null);};
  const myTier=t.basket&&SK?.extraLevel?SK.extraLevel(data,theme):null;
  // Calculée une fois par réglage : la liste affichée est exactement celle qui sera lancée.
  const plan=React.useMemo(()=>ptExtraPlan(data,{theme,place:t.courtOnly?'court':place,minutes,tier:tier||myTier}),[data,theme,place,minutes,tier,myTier]);
  const ctx=PT.context(data);
  // Ce que le planning prévoit aujourd'hui : Extra vient en plus, jamais à la place sans le savoir.
  const SPL=window.SeasonPlan,now=PT.dateKey();
  const todayItems=SPL?(SPL.weekSchedule(data,now,now).days.find(d=>d.date===now)?.items||[]).filter(x=>x.status==='planned'&&x.type!=='care'):[];
  const start=()=>{
    if(data.draft?.status==='active'){go('session');notify('Une séance est en cours : termine-la d’abord.');return;}
    if(!plan||plan.error){notify(plan?.error||'Séance indisponible.');return;}
    update(s=>({...s,draft:{...plan,createdAt:new Date().toISOString()}}));go('preview');
  };
  return <><PTPageHead eyebrow="À la carte" title="Extra.">Une séance en plus, sur un seul thème. Ton programme ne bouge pas.</PTPageHead>
    <div className="stack-lg extra-page">
      {todayItems.length>0&&<button className="extra-today" onClick={()=>go('today')}><PTIcon name="today" size={18}/><span><small>Prévu aujourd’hui</small><strong>{todayItems.map(x=>x.label).join(' · ')}</strong></span><PTIcon name="arrow" size={16}/></button>}
      <section className="stack-sm"><h2>Basket</h2>
        <PTChips value={theme} onChange={setTheme} options={PT_EXTRA.filter(x=>x.basket).map(x=>({value:x.id,label:x.label}))}/></section>
      <section className="stack-sm"><h2>Physique</h2>
        <PTChips value={theme} onChange={setTheme} options={PT_EXTRA.filter(x=>!x.basket).map(x=>({value:x.id,label:x.label}))}/></section>
      <section className="stack-sm extra-settings">
        <div className="topline"><span className="fine">Durée</span></div>
        <PTChips value={minutes} onChange={setMinutes} options={PT_EXTRA_MINUTES.map(m=>({value:m,label:m===60?'1 h':`${m} min`}))}/>
        <div className="topline"><span className="fine">Où</span></div>
        {t.courtOnly?<p className="fine">Au terrain, avec un panier.</p>
          :<PTChips value={place} onChange={setPlace} options={[{value:'court',label:'Au terrain'},{value:'home',label:'À la maison'}]}/>}
        {t.basket&&SK&&<><div className="topline"><span className="fine">Niveau</span></div>
          <PTChips value={tier||myTier} onChange={setTier} options={SK.TIERS.map((label,i)=>({value:i+1,label:i+1===myTier?`${label} · ton palier`:label}))}/></>}
      </section>
      {t.legs&&ctx.protectLegs&&<p className="notice warning">Tes jambes ont déjà travaillé ou un match approche : préfère le haut du corps, le tir ou la mobilité aujourd’hui.</p>}
      <section className="card stack-sm extra-summary" aria-live="polite">
        {plan&&!plan.error?<>
          <div className="topline"><h3>{plan.title}</h3><span className="caption">~{plan.estimatedMinutes} min · {plan.exercises.length} exercices</span></div>
          <ol className="extra-list">{plan.exercises.map(e=><li key={e.id}><span>{e.name}</span><small>{ptDoseLabel(e)}</small></li>)}</ol>
          {(plan.reasons||[]).length>0&&<details className="disclosure"><summary>Pourquoi cette séance</summary><ul className="reason-list">{plan.reasons.map(r=><li key={r}>{r}</li>)}</ul></details>}
          <PTButton primary onClick={start}>Lancer cette séance<PTIcon name="arrow" size={18}/></PTButton>
        </>:<p className="fine">{plan?.error||'Choisis un thème.'}</p>}
      </section>
    </div></>;
}
