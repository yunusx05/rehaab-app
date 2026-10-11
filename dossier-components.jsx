/* Dossier joueur : accueil, sommaire des 7 chapitres, questions une par une, puis « ce que le coach a compris ».
   La logique vit dans player-dossier.js ; ici, seulement l'affichage. Réutilise les composants de personal-app.jsx. */
const PD=window.PlayerDossier;
const pdPhoto=id=>`media/ui/dossier/${id}.webp`;
const pdDays=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// Premier lancement : le dossier complet, ou la version rapide d'avant pour démarrer tout de suite.
function PTDossierWelcome(props) {
  const {data,update,go}=props;
  const [quick,setQuick]=usePTState(false),[name,setName]=usePTState(data.profile.name||'');
  if(quick) return <PTOnboarding {...props}/>;
  const start=()=>{update(s=>({...s,profile:{...s.profile,name:name.trim().slice(0,40)},dossier:PD.prefill(s)}));go('dossier-q','morpho');};
  return <div className="stack-lg">
    <PTHeroCard photo={pdPhoto('hero')} eyebrow="Ton point de départ" title="Ton dossier joueur.">
      <p>Ton gabarit, ton basket, ta pause, ta santé, tes objectifs. Le coach construit ton plan à partir de tes réponses, pas d’un modèle tout fait.</p>
    </PTHeroCard>
    <PTField label="Comment t’appeler ?" autoComplete="given-name" maxLength="40" value={name} onChange={e=>setName(e.target.value)}/>
    <p className="fine">Quatre chapitres essentiels d’abord. Les trois autres affinent le plan quand tu veux. Tout reste sur ce téléphone.</p>
    <div className="stack-sm"><PTButton primary onClick={start}>Commencer mon dossier<PTIcon name="arrow" size={18}/></PTButton><PTButton quiet onClick={()=>setQuick(true)}>Version rapide (3 questions)</PTButton></div>
  </div>;
}

function PTDossier({data,update,go}) {
  const dossier=PD.validate(data.dossier)||PD.prefill(data),c=PD.completeness(dossier);
  const essentials=c.chapters.filter(x=>x.required&&!x.done).length,due=PD.checkinDue(data);
  const pending=(dossier.followups||[]).filter(f=>!f.answer).length;
  usePTEffect(()=>{if(!data.dossier)update(s=>({...s,dossier:PD.prefill(s)}));},[]);
  return <div className="stack-lg">
    <PTPageHead eyebrow="Dossier joueur" title="Ce que le coach sait de toi." onBack={data.profile.onboarded?()=>go('profile'):undefined}/>
    <PTHeroCard photo={pdPhoto('hero')} eyebrow={c.ready?'Dossier prêt':'En cours'} title={c.ready?'Ton plan part de là.':`Encore ${essentials} chapitre${essentials>1?'s':''} essentiel${essentials>1?'s':''}.`}
      aside={<PTRing value={c.percent} total={100} label={`Dossier rempli à ${c.percent} %`}><strong className="num">{c.percent}%</strong></PTRing>}>
      <p>{c.ready?'Plus tu complètes, plus les exercices et le calendrier collent à toi.':'Le gabarit, ton basket, ta santé et tes objectifs suffisent pour démarrer.'}</p>
      <div className="stack-sm">{c.ready&&<PTButton primary onClick={()=>go('dossier-synthese')}>Ce que le coach a compris</PTButton>}{c.next&&<PTButton primary={!c.ready} onClick={()=>go('dossier-q',c.next.id)}>{c.ready?'Affiner':'Continuer'} : {c.next.title.toLowerCase()}</PTButton>}</div>
    </PTHeroCard>
    {due&&<div className="notice"><p><strong>Point d’étape.</strong> Quatre semaines depuis ta dernière mise à jour : ton poids, tes douleurs et ta semaine ont peut-être changé.</p><button className="text-button" onClick={()=>go('dossier-q','health')}>Faire le point →</button></div>}
    {pending>0&&<div className="notice"><p>Le coach a {pending} question{pending>1?'s':''} pour toi.</p><button className="text-button" onClick={()=>go('dossier-synthese')}>Répondre →</button></div>}
    <div className="image-grid">{c.chapters.map((ch,i)=><PTImageTile key={ch.id} photo={pdPhoto(ch.photo)} eyebrow={`Chapitre ${i+1}`} title={ch.title} text={ch.short} badge={ch.required?'Essentiel':null} done={ch.done} progress={{count:ch.count,total:ch.total}} onClick={()=>go('dossier-q',ch.id)} tall={i===0}/>)}</div>
    <p className="fine">Ces réponses remplacent le profil joueur, « Mon jeu » et les questions du bilan physique : tu n’as plus à les remplir à part. Les tests chronométrés restent dans le bilan.</p>
  </div>;
}

function PTDossierAnswer({q,value,onChange}) {
  const multi=q.type==='multi'||q.type==='rank';
  if(q.type==='single') return <PTChoices options={q.options} value={value} onChange={onChange}/>;
  if(multi) return <div className="choice-grid">{q.options.map(o=>{const pos=(value||[]).indexOf(o.value);return <button type="button" key={o.value} className="choice" aria-pressed={pos>=0} onClick={()=>onChange(PD.toggle(q,value,o.value))}>{q.type==='rank'&&pos>=0&&<span className="dossier-rank">{pos+1}</span>}{o.label}{o.hint&&<small>{o.hint}</small>}</button>;})}</div>;
  if(q.type==='number') return <div className="dossier-number"><input type="number" inputMode="decimal" min={q.min} max={q.max} step={q.step||1} value={value??''} aria-label={q.label} onChange={e=>onChange(e.target.value===''?undefined:Number(e.target.value))}/><span>{q.unit}</span></div>;
  if(q.type==='scale') return <div className="dossier-scale"><strong>{value??3}<small> / 10</small></strong><input type="range" min="0" max="10" step="1" value={value??3} aria-label={q.label} onChange={e=>onChange(Number(e.target.value))}/></div>;
  if(q.type==='days') return <PTChips multi value={value||[]} onChange={onChange} options={pdDays.map((label,i)=>({value:i,label}))}/>;
  if(q.type==='day') return <PTChips value={value} onChange={onChange} options={[...pdDays.map((label,i)=>({value:i,label})),{value:'none',label:'Pas de jour fixe'}]}/>;
  if(q.type==='text') return <textarea maxLength={q.max||200} value={value||''} aria-label={q.label} onChange={e=>onChange(e.target.value)}/>;
  if(q.type==='equipment') return <PTEquipment inventory selected={value||['bodyweight']} onChange={onChange}/>;
  return null;
}

function PTDossierChapter({data,update,go,notify,id}) {
  const chapter=PD.chapters.find(c=>c.id===id)||PD.chapters[0];
  const [answers,setAnswers]=usePTState(()=>({...((PD.validate(data.dossier)||PD.prefill(data)).answers)}));
  const [index,setIndex]=usePTState(0);
  const list=PD.questionsFor(chapter.id,answers),i=Math.min(index,list.length-1),q=list[i];
  const value=answers[q.id];
  // Le scale démarre à 3 : on l'enregistre dès l'affichage pour que « Suivant » soit possible sans toucher au curseur.
  usePTEffect(()=>{if(q.type==='scale'&&value===undefined)setAnswers(a=>({...a,[q.id]:3}));if(q.type==='equipment'&&value===undefined)setAnswers(a=>({...a,[q.id]:data.owned}));},[q.id]);
  const set=v=>setAnswers(a=>{const next={...a};if(v===undefined||(Array.isArray(v)&&!v.length))delete next[q.id];else next[q.id]=v;return next;});
  const clean=PD.cleanAnswer(q,value),ok=!q.required||PD.answered(q,clean);
  const numberOff=(q.type==='number')&&value!==undefined&&clean===undefined;
  const last=i===list.length-1;
  const save=()=>{
    const wasReady=PD.completeness(data.dossier).ready;
    const next=PD.saveChapter(data,chapter.id,answers);
    update(()=>next);
    const c=PD.completeness(next.dossier);
    notify(`Chapitre « ${chapter.title} » enregistré.`);
    if(c.ready&&!wasReady) go('dossier-synthese');
    else if(!c.ready&&c.next) go('dossier-q',c.next.id);
    else go('dossier');
  };
  const advance=()=>{if(last)save();else setIndex(i+1);};
  const pick=v=>{set(v);if(q.type==='single'&&!last)setTimeout(()=>setIndex(n=>n===i?i+1:n),220);};
  const flags=PD.redFlags(answers).length>0,severe=PD.pains(answers).some(p=>p.severity>=7);
  return <div>
    <button className="back-link" onClick={()=>i>0?setIndex(i-1):go('dossier')}><PTIcon name="back" size={18}/>Retour</button>
    <div className="dossier-banner"><img src={pdPhoto(chapter.photo)} alt="" decoding="async"/><span className="eyebrow">Dossier joueur</span><h1>{chapter.title}</h1></div>
    <div className="step-caption"><span>Question {i+1} sur {list.length}</span><span>{chapter.required?'Essentiel':'Pour affiner'}</span></div>
    <div className="step-track">{list.map((x,n)=><span className={n<=i?'done':''} key={x.id}/>)}</div>
    <section className="dossier-question" key={q.id}>
      <h2>{q.label}</h2>
      {q.hint&&<p className="fine">{q.hint}</p>}
      <PTDossierAnswer q={q} value={value} onChange={q.type==='single'?pick:set}/>
      {numberOff&&<p className="error">Entre une valeur entre {q.min} et {q.max} {q.unit}.</p>}
      {q.id==='flags'&&flags&&<div role="alert" className="notice warning">Fais examiner la zone par un médecin ou un kiné avant tout exercice ciblé. L’app ne proposera rien qui la sollicite tant que ce signe est signalé.</div>}
      {q.id.startsWith('pain-')&&q.type==='scale'&&severe&&<div role="alert" className="notice warning">7/10 ou plus : pas de séance générée tant que la douleur n’a pas été vue par un professionnel.</div>}
    </section>
    <div className="dossier-actions">
      <PTButton primary disabled={!ok||numberOff} onClick={advance}>{last?'Enregistrer le chapitre':'Suivant'}</PTButton>
      {!q.required&&!last&&<button className="text-button" onClick={()=>{set(undefined);setIndex(i+1);}}>Passer cette question</button>}
      {!q.required&&last&&value===undefined&&<p className="fine">Facultatif : tu peux enregistrer sans répondre.</p>}
    </div>
  </div>;
}

function PTDossierSynthesis({data,update,go,notify}) {
  const dossier=PD.validate(data.dossier)||PD.blank(),local=PD.localSynthesis(data);
  const shown=dossier.synthesis?.source==='ai'?dossier.synthesis:local;
  const [busy,setBusy]=usePTState(false),[error,setError]=usePTState(''),[drafts,setDrafts]=usePTState({});
  const open=dossier.followups.filter(f=>!f.answer);
  const ask=async()=>{
    setBusy(true);setError('');
    try{
      const res=await fetch('/api/coach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'dossier',messages:[{role:'user',text:'Voici mon dossier. Dis-moi ce que tu as compris et ce qu’il te manque.'}],context:{dossier:PD.summary(dossier),computed:{priorities:local.priorities,risks:local.risks}}})});
      const j=await res.json();
      if(!res.ok||!j.message) throw new Error(j.error||'Le coach ne répond pas pour le moment.');
      const known=new Set(dossier.followups.map(f=>f.question));
      update(s=>({...s,dossier:PD.validate({...(s.dossier||PD.blank()),
        synthesis:{message:j.message,priorities:j.priorities||[],risks:j.risks||[],source:'ai',date:PT.dateKey()},
        followups:[...((s.dossier&&s.dossier.followups)||[]),...(j.questions||[]).filter(x=>!known.has(x)).map(question=>({id:PT.uid(),question,answer:'',date:PT.dateKey()}))]})}));
      notify('Analyse du coach reçue.');
    }catch(e){setError(`${e.message||'Le coach ne répond pas.'} La synthèse ci-dessous est calculée par l’app, hors ligne.`);}
    setBusy(false);
  };
  const saveAnswers=()=>{
    update(s=>({...s,dossier:PD.validate({...s.dossier,followups:s.dossier.followups.map(f=>drafts[f.id]?.trim()?{...f,answer:drafts[f.id].trim()}:f)})}));
    setDrafts({});notify('Réponses enregistrées : le coach les lira à chaque décision.');
  };
  return <div className="stack-lg">
    <PTPageHead eyebrow="Dossier joueur" title="Ce que le coach a compris." onBack={()=>go('dossier')}/>
    <PTHeroCard photo={pdPhoto('goals')} eyebrow={shown.source==='ai'?'Analyse du coach IA':'Synthèse de l’app'} title="Ton point de départ."><p>{shown.message}</p></PTHeroCard>
    {shown.priorities.length>0&&<section className="stack-sm"><h2>Tes 3 priorités</h2>{shown.priorities.map((p,n)=><div className="dossier-priority" key={p.label}><b>{n+1}</b><div><strong>{p.label}</strong><p className="fine">{p.why}</p></div></div>)}</section>}
    {shown.risks.length>0&&<section className="stack-sm"><h2>Points d’attention</h2><ul className="reason-list">{shown.risks.map(r=><li key={r}>{r}</li>)}</ul></section>}
    {open.length>0&&<section className="stack"><h2>Ses questions pour toi</h2>{open.map(f=><label className="dossier-followup" key={f.id}><strong>{f.question}</strong><textarea maxLength="400" value={drafts[f.id]||''} onChange={e=>setDrafts(d=>({...d,[f.id]:e.target.value}))}/></label>)}<PTButton primary disabled={!Object.values(drafts).some(v=>v.trim())} onClick={saveAnswers}>Enregistrer mes réponses</PTButton></section>}
    {error&&<p role="alert" className="notice warning">{error}</p>}
    <div className="stack-sm">
      {!PD.completeness(dossier).ready&&<PTButton primary onClick={()=>go('dossier-q',PD.completeness(dossier).next.id)}>Compléter mon dossier</PTButton>}
      <PTButton primary={!open.length&&PD.completeness(dossier).ready} disabled={busy} onClick={ask}>{busy?'Le coach lit ton dossier…':shown.source==='ai'?'Relancer l’analyse du coach':'Demander l’analyse du coach IA'}</PTButton>
      <PTButton quiet onClick={()=>go('today')}>Voir ma séance du jour</PTButton>
    </div>
    <p className="fine">Le coach n’est pas médecin : il ne pose aucun diagnostic. Une douleur qui dure ou un signe inhabituel se montre à un professionnel.</p>
  </div>;
}
