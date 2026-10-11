/* Profil joueur, cartes « Le corps / L’esprit » de l’accueil et séances courtes. Réutilise les composants de personal-app.jsx. */
const JP=window.PlayerProfile, BP=window.BasketPathway, QI=window.BasketQI;
const ppSides={left:'gauche',right:'droit',both:'deux côtés',center:'centre'};
const ppBlankPain={region:'',side:'right',severity:3,redFlags:false,note:''};

function PTPlayerProfile({data,update,go,notify}) {
  const [step,setStep]=usePTState(0);
  const [player,setPlayer]=usePTState(()=>JP.validatePlayer(data.player)||JP.validatePlayer({}));
  const [pains,setPains]=usePTState(()=>PT.activeSymptoms(data).map(s=>({...s})));
  const [draft,setDraft]=usePTState(ppBlankPain),[painError,setPainError]=usePTState('');
  const [owned,setOwned]=usePTState(data.owned);
  const set=(k,v)=>setPlayer(p=>({...p,[k]:v}));
  const toggleArchetype=id=>set('archetypes',player.archetypes.includes(id)?player.archetypes.filter(a=>a!==id):[...player.archetypes,id].slice(-3));
  const addPain=()=>{
    if(!draft.region){setPainError('Choisis la zone concernée.');return;}
    setPains(list=>[...list,{...draft,id:PT.uid(),date:PT.dateKey(),active:true,onset:'known',followups:[]}]);
    setDraft(ppBlankPain);setPainError('');
  };
  const removePain=id=>setPains(list=>list.filter(p=>p.id!==id));
  const steps=[
    {title:'Ton poste.',intro:'La préparation physique et les lectures de jeu partent de là.',valid:!!player.position},
    {title:'Ton profil de jeu.',intro:'Trois au maximum. Ils affinent les qualités travaillées et les situations tactiques.',valid:player.archetypes.length>0},
    {title:'Ce qui te gêne.',intro:'Une zone signalée ne disparaît pas de la séance : on la renforce avec des mouvements qu’elle tolère.',valid:true},
    {title:'Ton matériel.',intro:'La séance du jour n’utilise que ce que tu coches.',valid:true}
  ];
  const save=()=>{
    const keptIds=pains.map(p=>p.id);
    update(s=>({...s,
      player:JP.validatePlayer(player),
      owned,checkIn:{...s.checkIn,equipment:owned},
      symptoms:[...s.symptoms.map(x=>x.active&&!keptIds.includes(x.id)?{...x,active:false,resolvedAt:PT.dateKey()}:x).filter(x=>!keptIds.includes(x.id)),...pains]
    }));
    // Premier profil : le bilan physique vient juste après, pour que le parcours parte de l'état réel du corps.
    notify(data.athletic?'Profil joueur enregistré. Ta séance et tes lectures du jour sont recalculées.':'Profil joueur enregistré. Dernière étape : ton bilan physique.');
    go(data.athletic?(data.pathway?'today':'pathway'):'bilan');
  };
  const blocked=pains.some(p=>p.redFlags||Number(p.severity)>=7);
  return <div>
    <PTPageHead eyebrow="Profil joueur" title={steps[step].title} onBack={step===0?()=>go('profile'):undefined}>{steps[step].intro}</PTPageHead>
    <div className="step-caption"><span>Le corps et l’esprit</span><span>{step+1} / {steps.length}</span></div>
    <div className="step-track">{steps.map((_,i)=><span className={i<=step?'done':''} key={i}/>)}</div>
    <div className="stack-lg">
      {step===0&&<PTChoices value={player.position} onChange={v=>set('position',v)}
        options={Object.entries(JP.positions).map(([value,p])=>({value,label:`${p.number} · ${p.label}`,icon:'basket'}))}/>}
      {step===0&&<div className="stack-sm"><h3>Ton niveau</h3><PTChips value={player.level} onChange={v=>set('level',v)} options={[{value:'loisir',label:'Loisir'},{value:'club',label:'Club'},{value:'regional',label:'Régional'},{value:'national',label:'National'}]}/></div>}
      {step===0&&<div className="stack-sm"><h3>Ta dernière saison</h3><PTChips value={player.layoff} onChange={v=>set('layoff',v)} options={[{value:'none',label:'Je joue actuellement'},{value:'months',label:'Pause de quelques mois'},{value:'long',label:'Plus d’un an sans jouer'}]}/>{player.layoff==='long'&&<p className="fine">Le parcours « Retour au jeu » commencera par les fondations : tendons, chevilles et hanches avant la vitesse.</p>}</div>}
      {step===0&&<div className="stack-sm"><h3>Période</h3><PTChips value={player.season} onChange={v=>set('season',v)} options={[{value:'off',label:'Intersaison'},{value:'pre',label:'Présaison'},{value:'in',label:'En saison'}]}/></div>}

      {step===1&&<div className="choice-grid">{Object.entries(JP.archetypes).map(([id,a])=><button type="button" className="choice" key={id} aria-pressed={player.archetypes.includes(id)} onClick={()=>toggleArchetype(id)}>{a.label}<small>{a.hint}</small></button>)}</div>}
      {step===1&&<div className="stack-sm"><h3>Tes objectifs physiques</h3><p className="fine">Trois au maximum. Ils orientent tes séances et les tests à suivre.</p><PTChips multi value={player.goals||[]} onChange={v=>set('goals',v.slice(-3))} options={JP.goals.map(g=>({value:g.id,label:g.label}))}/></div>}
      {step===1&&player.position&&<p className="fine">Priorités physiques calculées : {JP.priorities(player).slice(0,3).map(q=>q.label.toLowerCase()).join(', ')}.</p>}

      {step===2&&<>
        {pains.length===0&&<p className="fine">Aucune douleur signalée. Tu peux passer à l’étape suivante.</p>}
        {pains.map(p=><article key={p.id} className="symptom-card stack-sm"><div className="topline"><h3>{PT.regions[p.region]} · {ppSides[p.side]}</h3><span className="num">{p.severity}/10</span></div>{p.note&&<p className="fine">{p.note}</p>}<button className="text-button" onClick={()=>removePain(p.id)}>Retirer</button></article>)}
        <section className="stack">
          <h2>Ajouter une douleur ou une faiblesse</h2>
          <div className="body-regions">{Object.entries(PT.regions).map(([id,label])=><button key={id} className="choice" aria-pressed={draft.region===id} onClick={()=>setDraft(d=>({...d,region:id}))}>{label}</button>)}</div>
          <PTChips value={draft.side} onChange={v=>setDraft(d=>({...d,side:v}))} options={[{value:'left',label:'Gauche'},{value:'right',label:'Droite'},{value:'both',label:'Deux côtés'},{value:'center',label:'Centre'}]}/>
          <PTField label={`Intensité ressentie : ${draft.severity} / 10`} hint="0-3 : gêne. 4-6 : douleur. 7 et plus : pas de séance générée."><input type="range" min="0" max="10" step="1" value={draft.severity} onChange={e=>setDraft(d=>({...d,severity:Number(e.target.value)}))}/></PTField>
          <PTField label="Quand est-ce que ça gêne ?"><textarea maxLength="1000" value={draft.note} onChange={e=>setDraft(d=>({...d,note:e.target.value}))} placeholder="Ex. à la réception des sauts, en descendant les escaliers…"/></PTField>
          <label className="check-label"><input type="checkbox" checked={draft.redFlags} onChange={e=>setDraft(d=>({...d,redFlags:e.target.checked}))}/>Gonflement, blocage, instabilité, traumatisme récent ou appui difficile.</label>
          {painError&&<p role="alert" className="error">{painError}</p>}
          <PTButton onClick={addPain}>Ajouter</PTButton>
        </section>
        {blocked&&<p className="notice warning">Avec cette intensité ou ces signes, l’app ne proposera pas de séance de musculation. Les lectures de jeu restent disponibles. Demande un avis médical avant de reprendre.</p>}
      </>}

      {step===3&&<PTEquipment inventory selected={owned} onChange={setOwned}/>}

      <div className="button-row">
        {step>0&&<PTButton quiet onClick={()=>setStep(step-1)}>Retour</PTButton>}
        <PTButton primary disabled={!steps[step].valid} onClick={()=>step<steps.length-1?setStep(step+1):save()}>{step===steps.length-1?'Voir ma journée':'Continuer'}<PTIcon name="arrow" size={18}/></PTButton>
      </div>
    </div>
  </div>;
}

function PTBodyMind({data,go}) {
  const player=data.player||{};
  if(!player.position) return <section className="player-invite sport-reveal"><span className="training-kicker">Profil joueur</span><h2>TON POSTE.<br/><em>TON CORPS.</em></h2><p className="fine">Ton gabarit, ton basket, ta pause, ta santé, tes objectifs : la séance, le calendrier et les lectures de jeu en dépendent.</p><PTButton primary onClick={()=>go('dossier')}>Remplir mon dossier joueur<PTIcon name="arrow" size={18}/></PTButton></section>;
  const rank=JP.qiThemes(player),daily=QI.dailySet(data.qi,player,rank),left=daily.items.length-daily.done;
  const themes=daily.items.map(x=>QI.themes[x.item.theme]).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
  const pos=JP.positions[player.position];
  return <div className="image-grid home-duo sport-reveal">
    <PTImageTile photo={ptHub('qi')} badge={left?`${left} à lire`:null} done={!left} title={left?'Lire le jeu':'QI du jour fait'} text={themes} onClick={()=>go('qi-run','daily')}/>
    <PTImageTile photo={ptHub('card')} badge={pos?`#${pos.number}`:null} title="Ma carte joueur" text={`${pos?pos.label:''}${(player.archetypes||[]).length?' · '+player.archetypes.map(a=>JP.archetypes[a]?.label).join(', '):''}`} onClick={()=>go('profile')}/>
  </div>;
}

// Annuler la séance en cours : visible partout où une séance attend, toujours avec confirmation.
function PTDraftCancel({update,notify,after}) {
  const [confirm,setConfirm]=usePTState(false);
  if(!confirm) return <PTButton danger onClick={()=>setConfirm(true)}><PTIcon name="close" size={18}/>Annuler la séance en cours</PTButton>;
  return <div className="notice warning stack-sm"><p>Annuler sans enregistrer ? Les séries déjà faites seront perdues. Ton parcours et tes programmes ne changent pas.</p>
    <PTButton danger onClick={()=>{update(s=>({...s,draft:null}));setConfirm(false);notify('Séance annulée.');if(after)after();}}>Oui, annuler la séance</PTButton>
    <PTButton quiet onClick={()=>setConfirm(false)}>Garder ma séance</PTButton></div>;
}

// Carte joueur (lot 15) : poste, profil de jeu et qualités notées UNIQUEMENT depuis les tests et les réponses du bilan.
// Trois niveaux (à travailler, correct, point fort), jamais de note chiffrée inventée. Flèche : évolution d'un test suivi.
const PT_CARD_QUALITIES=['vertical','firststep','decel','reactive','strength','endurance'];
function PTPlayerCard({data,go}){
  const JP=window.PlayerProfile,AP=window.AthleticProfile,player=data.player||{};
  const pos=JP&&JP.positions[player.position],[failed,setFailed]=usePTState(false);
  const assessed=AP&&data.athletic?AP.assess(data.athletic).qualities:null;
  const rows=assessed?PT_CARD_QUALITIES.map(id=>assessed[id]).filter(Boolean):[];
  const source=q=>q.failed.length||q.passed.length?`test : ${(q.failed[0]||q.passed[0]).label.toLowerCase()}`:q.answer!==null&&q.answer!==undefined?'d’après ta réponse':'pas encore évalué';
  const trend=q=>{for(const t of [...q.passed,...q.failed]){const tr=AP.trend(t.id,data.athletic.tests?.[t.id]);if(tr)return tr.change>0?'up':tr.change<-5?'down':null;}return null;};
  const name=(data.profile.name||'Joueur').toUpperCase();
  return <section className="player-card" aria-label="Ma carte joueur">
    {!failed&&<img src={ptHub('card')} alt="" decoding="async" onError={()=>setFailed(true)}/>}
    <span className="player-card-shade" aria-hidden="true"/>
    <div className="player-card-top">
      <span className="player-card-number" aria-label={pos?`Numéro de poste ${pos.number}`:'Poste non renseigné'}>{pos?pos.number:'–'}</span>
      <span className="player-card-id"><strong>{name}</strong><small>{pos?pos.label:'Poste à renseigner'}{(player.archetypes||[]).length?` · ${player.archetypes.map(a=>JP.archetypes[a]?.label).join(', ')}`:''}</small></span>
    </div>
    {rows.length>0?<ul className="player-card-stats">{rows.map(q=>{const t=trend(q);return <li key={q.id}>
      <span className="stat-name">{q.label}</span>
      <span className="stat-bar" data-level={q.level===null||q.level===undefined?'none':q.level} aria-hidden="true"><i/><i/><i/></span>
      <span className="stat-level">{q.levelLabel}{t&&<span className={`stat-trend is-${t}`} aria-label={t==='up'?'en progrès':'en baisse'}><PTIcon name="arrow" size={12}/></span>}</span>
      <small className="stat-source">{source(q)}</small>
    </li>;})}</ul>:<p className="player-card-empty">Fais ton bilan physique : tes qualités apparaîtront ici, notées d’après tes tests et tes réponses.</p>}
    <div className="player-card-foot"><p>Notes tirées de tes tests et de tes réponses, rien d’inventé.</p><button className="text-button" onClick={()=>go('bilan')}>{rows.length?'Mettre à jour':'Faire mon bilan'}</button></div>
  </section>;
}
