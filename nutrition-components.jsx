/* Onglet Nutrition : questionnaire de départ (route « nutrition-q ») et conseils du jour (route « nutrition »).
   Toute la logique est dans basket-nutrition.js ; ces écrans posent les questions et affichent le plan. */
const ptNutriVerdict={yes:'Utile pour toi',maybe:'Selon ta situation',doctor:'Avec ton médecin',no:'Inutile pour toi'};

function PTNutritionQuiz({data,update,go,notify}){
  const BN=window.BasketNutrition,prev=BN.validate(data.nutrition)||BN.blank();
  const [answers,setAnswers]=usePTState(()=>({...BN.prefill(data),...prev.answers})),[error,setError]=usePTState('');
  const set=(k,v)=>setAnswers(a=>({...a,[k]:v}));
  const save=()=>{
    const miss=BN.missing(BN.validate({answers}).answers);
    if(miss.length){setError(`Il manque : ${miss.join(', ')}.`);return;}
    update(s=>BN.save(s,answers));notify('Profil nutrition enregistré : tes repères sont prêts.');go('nutrition');
  };
  return <><PTPageHead onBack={()=>go('nutrition')} eyebrow="Questionnaire nutrition" title="Ton profil.">Quelques questions pour adapter les repères à ta reprise, à tes horaires et à ton alimentation.</PTPageHead><div className="stack-lg coach-form">
    <section className="stack"><h2>Ton gabarit</h2><div className="form-grid">{BN.numbers.map(n=><PTField key={n.id} label={n.label} type="number" min={n.min} max={n.max} step={n.step} value={answers[n.id]??''} onChange={e=>set(n.id,e.target.value===''?undefined:e.target.value)}/>)}</div></section>
    {BN.questions.map(q=><PTCoachQ key={q.id} title={<>{q.label}{q.optional?<small className="caption"> · facultatif</small>:null}</>}>
      <PTChips multi={!!q.multi} value={q.multi?(answers[q.id]||[]):answers[q.id]} onChange={v=>set(q.id,v)} options={q.options.map(([value,label])=>({value,label}))}/>
    </PTCoachQ>)}
    {error&&<p className="error" role="alert">{error}</p>}
    <PTButton primary onClick={save}>Voir mes conseils<PTIcon name="arrow" size={18}/></PTButton>
    <p className="fine">Repères généraux tirés de consensus scientifiques, pas un avis médical ni diététique.</p>
  </div></>;
}

function PTNutrition({data,go}){
  const BN=window.BasketNutrition,[dayType,setDayType]=usePTState('train');
  if(!BN)return <p className="empty">Nutrition indisponible.</p>;
  const p=BN.plan(data);
  if(!p.ok)return <><PTPageHead eyebrow="Nutrition" title="Manger pour rejouer.">Ce que tu manges, quand, et quels compléments valent le coup pour un joueur qui reprend.</PTPageHead><div className="stack-lg">
    <section className="card stack-sm"><h2>Commence par ton profil</h2><ul className="reason-list"><li>Tes repères du jour : énergie, protéines, glucides, eau.</li><li>Ta journée type autour de ta séance, à l’heure près.</li><li>Les compléments utiles pour toi, la dose et le moment, et ceux à éviter.</li><li>Halal, ventre sensible, jeûne : tout est pris en compte.</li></ul><PTButton primary onClick={()=>go('nutrition-q')}>Faire le questionnaire (2 min)<PTIcon name="arrow" size={18}/></PTButton></section>
  </div></>;
  const e=p.energy,m=p.macros,list=dayType==='train'?p.training:p.rest;
  return <><PTPageHead eyebrow={`Nutrition · ${p.goalLabel.toLowerCase()}`} title="Manger pour rejouer.">Repères calculés pour ton gabarit et ta semaine d’entraînement. Ajuste selon ta faim et ta balance.</PTPageHead><div className="stack-lg">
    {p.blocked?<p className="notice warning">{p.blocked}</p>:<section className="card stack-sm nutri-targets">
      <h2>Tes repères du jour</h2>
      <div className="nutri-kcal"><strong>{e.target}</strong><span>kcal par jour · à ± {e.margin} kcal près</span></div>
      <div className="nutri-macros">
        <span><strong>{m.protein} g</strong><small>protéines</small></span>
        <span><strong>{m.carbs} g</strong><small>glucides</small></span>
        <span><strong>{m.fat} g</strong><small>lipides</small></span>
        <span><strong>{String(m.waterBase).replace('.',',')} L</strong><small>eau</small></span>
      </div>
      <p className="fine">Dépense estimée {e.total} kcal (repos {e.resting}, journée {e.daily}, entraînement {e.training} en moyenne pour {Math.round(e.weekMinutes/60)} h par semaine). Protéines : repère de 1,6 à 2,2 g par kg, soit {m.proteinRange[0]} à {m.proteinRange[1]} g, en {m.meals} prises.</p>
      {p.notes.map(n=><p key={n} className="notice warning">{n}</p>)}
    </section>}
    <section className="stack-sm">
      <div className="topline"><h2>Ta journée type</h2><PTChips value={dayType} onChange={setDayType} options={[{value:'train',label:'Entraînement'},{value:'rest',label:'Repos'}]}/></div>
      <ol className="nutri-timeline">{list.map((x,i)=><li key={i}><span className="nutri-time">{x.time}</span><div><strong>{x.title}</strong><p>{x.what}</p><small>{x.why}</small></div></li>)}</ol>
    </section>
    <section className="stack-sm"><h2>Compléments</h2>
      <div className="stack-sm">{p.supplements.map(s=><article key={s.id} className={`card stack-sm nutri-supp is-${s.verdict}`}>
        <div className="topline"><strong>{s.name}</strong><span className="badge">{ptNutriVerdict[s.verdict]}</span></div>
        {s.already&&<small className="caption">Tu en prends déjà.</small>}
        <p className="fine">{s.why}</p>
        {s.dose!=='—'&&<p className="fine"><strong>Dose :</strong> {s.dose}</p>}
        {s.when!=='—'&&<p className="fine"><strong>Quand :</strong> {s.when}</p>}
        {s.note&&<p className="fine nutri-note">{s.note}</p>}
      </article>)}</div>
    </section>
    <section className="card stack-sm"><h2>Quoi manger</h2>
      {[['Protéines',p.foods.protein],['Glucides',p.foods.carbs],['Bons gras',p.foods.fats],['Légumes',p.foods.greens],['À limiter',p.foods.avoid]].map(([t,l])=><div key={t} className="stack-sm"><h3>{t}</h3><ul className="reason-list">{l.map(x=><li key={x}>{x}</li>)}</ul></div>)}
      <p className="fine">L’assiette d’un jour d’entraînement : un tiers de féculents, un tiers de légumes, un tiers de protéines. Un jour de repos : moins de féculents, plus de légumes.</p>
    </section>
    {p.fasting.length>0&&<section className="card stack-sm"><h2>Les jours de jeûne</h2><ul className="reason-list">{p.fasting.map(x=><li key={x}>{x}</li>)}</ul></section>}
    <section className="card stack-sm"><h2>Ancien sportif : ce qui compte</h2><ul className="reason-list">{p.comeback.map(x=><li key={x}>{x}</li>)}</ul>{window.BodyWeight&&<button className="text-button" onClick={()=>go('weight')}>Ouvrir mon poids de forme →</button>}</section>
    <details className="disclosure"><summary>Sur quoi reposent ces repères</summary><div><ul className="reason-list">{p.sources.map(x=><li key={x}>{x}</li>)}</ul><p className="fine">Ce sont des repères généraux, pas un avis médical ni diététique. Ventre sensible persistant, perte de poids rapide ou traitement en cours : parles-en à un professionnel de santé.</p></div></details>
    <PTButton quiet onClick={()=>go('nutrition-q')}>Modifier mon profil nutrition</PTButton>
  </div></>;
}
