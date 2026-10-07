/* Questionnaire « Mon jeu » : ressentis terrain, forces, faiblesses, calendrier du club.
   Décisions dans basket-profile.js (priorités, accents) et training-load.js (charge de la semaine). */
function PTBasketProfile({data,update,go,notify}) {
  const C=window.BasketProfile;
  const [form,setForm]=usePTState(()=>C.validate(data.basketProfile)||C.blank()),[error,setError]=usePTState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const skillOptions=Object.entries(C.skills).map(([value,s])=>({value,label:s.label}));
  // Trois au plus : au-delà, plus rien n'est prioritaire.
  const pickUpTo3=(k,v)=>{if(v.length>3){setError('Trois choix au maximum : garde les plus marquants.');return;}setError('');set(k,v);};
  const save=()=>{
    if(!form.weaknesses.length){setError('Choisis au moins une situation où tu te sens en difficulté.');return;}
    const clean=C.save(form);
    update(s=>({...s,basketProfile:clean}));
    notify('« Mon jeu » enregistré : ton parcours et ta muscu en tiennent compte.');
    go(data.program&&data.program.status!=='archived'?'program':'pathway');
  };
  const summary=C.summary(C.validate(form)&&{...C.validate(form),date:'x'});
  return <><PTPageHead onBack={()=>go('pathway')} eyebrow="Questionnaire basket" title="Mon jeu.">Ce que tu vis sur le terrain. Tes réponses règlent les priorités du parcours, l’accent de ta muscu et la charge de ta semaine.</PTPageHead>
  <div className="stack-lg coach-form">
    <PTCoachQ title="Où es-tu en difficulté sur le terrain ? (3 au plus)"><PTChips multi options={skillOptions} value={form.weaknesses} onChange={v=>pickUpTo3('weaknesses',v.filter(x=>!form.strengths.includes(x)))}/></PTCoachQ>
    <PTCoachQ title="Tes points forts (3 au plus)"><PTChips multi options={skillOptions.filter(o=>!form.weaknesses.includes(o.value))} value={form.strengths} onChange={v=>pickUpTo3('strengths',v)}/><p className="fine">On les entretient sans y passer de temps en plus.</p></PTCoachQ>
    <PTCoachQ title="Après un match ou un gros entraînement"><PTChips multi options={C.feelings.map(([value,label])=>({value,label}))} value={form.feelings} onChange={v=>set('feelings',v.includes('fine')&&!form.feelings.includes('fine')?['fine']:v.filter(x=>x!=='fine'))}/></PTCoachQ>
    <PTCoachQ title="Ta période"><PTChips options={C.seasons.map(([value,label])=>({value,label}))} value={form.season} onChange={v=>set('season',v)}/></PTCoachQ>
    <PTCoachQ title="Entraînements au club"><PTChips multi options={C.days.map((label,value)=>({value,label}))} value={form.practiceDays} onChange={v=>set('practiceDays',v.filter(d=>d!==form.matchDay))}/></PTCoachQ>
    <PTCoachQ title="Jour de match habituel"><PTChips options={[{value:-1,label:'Pas de match fixe'},...C.days.map((label,value)=>({value,label}))]} value={form.matchDay===null?-1:form.matchDay} onChange={v=>setForm(f=>({...f,matchDay:v===-1?null:v,practiceDays:f.practiceDays.filter(d=>d!==v)}))}/><p className="fine">Un match saisi dans l’app pour une date précise reste prioritaire.</p></PTCoachQ>
    <PTCoachQ title="Ce que la muscu doit t’apporter"><PTChips options={C.goals.map(([value,label])=>({value,label}))} value={form.goal} onChange={v=>set('goal',v)}/></PTCoachQ>
    {summary&&<p className="notice">{summary}</p>}
    {error&&<p className="error" role="alert">{error}</p>}
    <PTButton primary onClick={save}>Enregistrer mon jeu<PTIcon name="arrow" size={18}/></PTButton>
  </div></>;
}
