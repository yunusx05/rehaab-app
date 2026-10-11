/* Lot 17 : séances de tir (routes « shooting », « shooting-new », « shooting-live ») et poids de forme (route « weight »).
   Graphiques en SVG à la main : une seule échelle par graphique, une série par graphique, tableau de données à la demande. */
const SH=window.Shooting,BW=window.BodyWeight;
const ptFr=n=>String(n).replace('.',',');
const ptDay=d=>`${d.slice(8,10)}/${d.slice(5,7)}`;

// Graphique en barres d'une série (une seule échelle). values : [{label, value|null, title}].
function PTBarChart({values,max,unit='',label,format=v=>`${v}${unit}`,highlight}){
  const [hover,setHover]=usePTState(null);
  const W=320,H=150,P={t:22,r:8,b:22,l:30},iw=W-P.l-P.r,ih=H-P.t-P.b,bw=iw/values.length,top=max||Math.max(1,...values.map(v=>v.value||0));
  const y=v=>P.t+ih-(v/top)*ih,ticks=[0,top/2,top];
  const shown=hover!==null?values[hover]:null;
  return <figure className="chart">
    <figcaption className="chart-readout" aria-live="polite">{shown?`${shown.title} : ${shown.value===null?'aucune donnée':format(shown.value)}`:label}</figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map(t=><g key={t}><line x1={P.l} x2={W-P.r} y1={y(t)} y2={y(t)} className="chart-grid"/><text x={P.l-6} y={y(t)+3} className="chart-axis" textAnchor="end">{Math.round(t)}</text></g>)}
      {values.map((v,i)=>{const x=P.l+i*bw+bw*.18,w=bw*.64;const h=v.value?Math.max(4,ih-(y(v.value)-P.t)):0;
        return <g key={i} tabIndex="0" role="button" aria-label={`${v.title} : ${v.value===null?'aucune donnée':format(v.value)}`} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(i)} onBlur={()=>setHover(null)} onClick={()=>setHover(i)}>
          <rect x={P.l+i*bw} y={P.t} width={bw} height={ih} fill="transparent"/>
          {v.value!==null&&<path d={`M${x},${P.t+ih} v${-(h-4)} q0,-4 4,-4 h${w-8} q4,0 4,4 v${h-4} z`} className={`chart-bar${hover===i||highlight===i?' is-active':''}`}/>}
          {v.value===null&&<line x1={x} x2={x+w} y1={P.t+ih-1} y2={P.t+ih-1} className="chart-empty"/>}
          {(highlight===i)&&v.value!==null&&<text x={x+w/2} y={y(v.value)-6} textAnchor="middle" className="chart-label">{format(v.value)}</text>}
          <text x={x+w/2} y={H-6} textAnchor="middle" className="chart-axis">{v.label}</text>
        </g>;})}
    </svg>
  </figure>;
}

// Carte de tir : une zone = un cercle, pourcentage écrit (jamais la couleur seule), intensité selon le %.
function PTShotMap({zones}){
  const Z=SH.ZONES,by=Object.fromEntries(zones.map(z=>[z.key,z]));
  return <svg className="shot-map" viewBox="0 0 300 280" role="img" aria-label="Carte de tir : pourcentage de réussite par zone">
    <rect width="300" height="280" rx="14" className="court-floor"/>
    <path d="M24 0 V40 A134 134 0 0 0 276 40 V0" className="court-line" fill="none"/>
    <rect x="105" y="0" width="90" height="130" className="court-line" fill="none"/><circle cx="150" cy="130" r="30" className="court-line" fill="none"/>
    <circle cx="150" cy="18" r="7" className="court-rim"/>
    {Object.entries(Z).map(([k,z])=>{const d=by[k];const p=d?d.pct:null;return <g key={k}>
      <circle cx={z.x} cy={z.y} r="19" className={`shot-zone${d?'':' is-empty'}`} style={d?{fillOpacity:.18+.72*(p/100)}:null}/>
      <text x={z.x} y={z.y+4} textAnchor="middle" className="shot-zone-label">{d?`${p}%`:'–'}</text>
      <title>{`${z.label} : ${d?`${d.made}/${d.attempts} (${p} %)`:'pas encore de tir'}`}</title>
    </g>;})}
  </svg>;
}

function PTShooting({data,update,go,notify}){
  if(!SH)return <p className="empty">Module de tir indisponible.</p>;
  const sh=SH.validate(data.shooting)||SH.blank(),weeks=SH.weekly(sh,8),cmp=SH.compare(sh),rec=SH.records(sh),drills=SH.byDrill(sh),zones=SH.byZone(sh);
  const start=routine=>{const d=SH.fromRoutine(routine,{custom:sh.custom});if(d.error){notify(d.error);return;}update(s=>({...s,shooting:{...(SH.validate(s.shooting)||SH.blank()),draft:d}}));go('shooting-live');};
  const best=weeks.reduce((b,w,i)=>w.pct!==null&&(b===null||w.pct>weeks[b].pct)?i:b,null);
  return <><PTPageHead onBack={()=>go('pathway')} title="Mes séances de tir.">Compte tes réussis et tes ratés, l’app suit ton pourcentage semaine après semaine.</PTPageHead>
    <div className="stack-lg">
      {sh.draft&&<button className="resume-workout" onClick={()=>go('shooting-live')}><span><small>Séance de tir en cours</small><strong>{sh.draft.title}</strong></span><span className="round-play"><PTIcon name="play" size={20}/></span></button>}
      <div className="image-grid">{SH.ROUTINES.map((r,i)=><PTImageTile key={r.id} tall={i===0} photo={ptHub(i%2?'skills':'shooting')} title={r.label} text={r.why} onClick={()=>start(r.id)}/>)}</div>
      <PTButton quiet onClick={()=>go('shooting-new')}>Composer ma séance<PTIcon name="arrow" size={18}/></PTButton>
      {sh.sessions.length===0?<p className="empty">Ta première séance remplira ici ton pourcentage par semaine, ta carte de tir et tes records.</p>:<>
        <section className="stack-sm"><h2>{cmp.cur.attempts?`${cmp.cur.pct} % cette semaine`:'Pas encore de tir cette semaine'}</h2>
          <p className="fine">{cmp.cur.attempts?`${cmp.cur.made} réussis sur ${cmp.cur.attempts}`:''}{cmp.delta!==null?` · ${cmp.delta>=0?'+':''}${cmp.delta} points par rapport à la semaine précédente (${cmp.prev.pct} %)`:''}</p>
          <PTBarChart label="Réussite par semaine, en %" values={weeks.map(w=>({label:ptDay(w.monday),title:`Semaine du ${ptDay(w.monday)}`,value:w.pct}))} max={100} unit=" %" highlight={best}/>
          <PTBarChart label="Volume : tirs tentés par semaine" values={weeks.map(w=>({label:ptDay(w.monday),title:`Semaine du ${ptDay(w.monday)}`,value:w.attempts||null}))} format={v=>`${v} tirs`} highlight={weeks.length-1}/>
          <details className="disclosure"><summary>Voir les données</summary><div><table className="data-table"><thead><tr><th>Semaine</th><th>Réussis</th><th>Tentés</th><th>%</th></tr></thead><tbody>{weeks.map(w=><tr key={w.monday}><td>{ptDay(w.monday)}</td><td>{w.made}</td><td>{w.attempts}</td><td>{w.pct===null?'–':`${w.pct} %`}</td></tr>)}</tbody></table></div></details>
        </section>
        <section className="stack-sm"><h2>Carte de tir</h2><PTShotMap zones={zones}/></section>
        <section className="stack-sm"><h2>Records</h2><ul className="reason-list">
          {rec.bestSession&&<li>Meilleure séance (20 tirs ou plus) : {rec.bestSession.pct} % ({rec.bestSession.made}/{rec.bestSession.attempts}) le {ptDay(rec.bestSession.date)}.</li>}
          {rec.streak>0&&<li>Plus longue série : {rec.streak} réussis d’affilée.</li>}
          {rec.ft&&<li>Lancers francs : {rec.ft.made}/{rec.ft.attempts} le {ptDay(rec.ft.date)}.</li>}
        </ul></section>
        <section className="stack-sm"><h2>Par exercice</h2><table className="data-table"><thead><tr><th>Exercice</th><th>Réussis</th><th>%</th></tr></thead><tbody>{drills.map(d=><tr key={d.key}><td>{SH.drillLabel(d.key,sh.custom)}</td><td>{d.made}/{d.attempts}</td><td>{d.pct} %</td></tr>)}</tbody></table></section>
      </>}
    </div></>;
}

function PTShootingNew({data,update,go,notify}){
  const sh=SH.validate(data.shooting)||SH.blank();
  const [rows,setRows]=usePTState([]),[drill,setDrill]=usePTState('sk-catch-mid'),[zone,setZone]=usePTState('ft'),[target,setTarget]=usePTState(5);
  const zonesOf=d=>(SH.DRILLS[d]||{}).zones||Object.keys(SH.ZONES);
  const add=()=>{if(!zonesOf(drill).includes(zone))return;setRows(r=>[...r,[drill,zone,Number(target)]].slice(0,40));};
  const addAll=()=>setRows(r=>[...r,...zonesOf(drill).map(z=>[drill,z,Number(target)])].slice(0,40));
  const startIt=()=>{const d=SH.create(rows,{custom:sh.custom,title:'Ma séance de tir'});if(d.error){notify(d.error);return;}update(s=>({...s,shooting:{...(SH.validate(s.shooting)||SH.blank()),draft:d}}));go('shooting-live');};
  return <><PTPageHead onBack={()=>go('shooting')} title="Ma séance de tir."/>
    <div className="stack-lg">
      <div className="form-grid">
        <PTField label="Exercice"><select value={drill} onChange={e=>{setDrill(e.target.value);setZone(zonesOf(e.target.value)[0]);setTarget(SH.DRILLS[e.target.value]?.attempts||5);}}>{Object.entries(SH.DRILLS).map(([id,d])=><option key={id} value={id}>{d.label}</option>)}</select></PTField>
        <PTField label="Zone"><select value={zone} onChange={e=>setZone(e.target.value)}>{zonesOf(drill).map(z=><option key={z} value={z}>{SH.ZONES[z].label}</option>)}</select></PTField>
        <PTField label="Tirs" type="number" min="1" max="100" value={target} onChange={e=>setTarget(e.target.value)}/>
      </div>
      <div className="button-row"><PTButton quiet onClick={add}>Ajouter cette zone</PTButton>{zonesOf(drill).length>1&&<PTButton quiet onClick={addAll}>Toutes ses zones</PTButton>}</div>
      {rows.length>0?<ol className="dose-list">{rows.map(([d,z,t],i)=><li key={i}><span>{SH.drillLabel(d,sh.custom)} · {SH.ZONES[z].label}</span><small>{t} tirs <button className="text-button" onClick={()=>setRows(r=>r.filter((_,n)=>n!==i))}>Retirer</button></small></li>)}</ol>:<p className="empty">Ajoute des exercices : chaque ligne est un exercice dans une zone, avec un nombre de tirs.</p>}
      <PTButton primary disabled={!rows.length} onClick={startIt}>Commencer ({rows.reduce((n,r)=>n+r[2],0)} tirs)<PTIcon name="arrow" size={18}/></PTButton>
    </div></>;
}

function PTShootingLive({data,update,go,notify}){
  const sh=SH.validate(data.shooting)||SH.blank(),d=sh.draft;
  if(!d)return <><PTPageHead onBack={()=>go('shooting')} title="Séance de tir."/><p className="empty">Aucune séance en cours.</p><PTButton primary onClick={()=>go('shooting')}>Choisir une routine</PTButton></>;
  const it=d.items[d.cursor],t=SH.totals(d),streak=(()=>{let n=0;for(let i=it.log.length-1;i>=0&&it.log[i]===1;i--)n++;return n;})();
  const set=next=>update(s=>({...s,shooting:{...(SH.validate(s.shooting)||SH.blank()),draft:next}}));
  const tap=made=>{if(typeof ptCue==='function')ptCue(made?'tick':'left');set(SH.shot(d,made));};
  const end=()=>{
    const r=SH.finish(sh,d);
    update(s=>{let next={...s,shooting:r.shooting};const SK=window.BasketSkills;if(r.session&&SK&&SK.complete(s.skills)){next.skills=SK.record(s.skills,SH.toSkillSession(r.session)).skills;}return next;});
    notify(r.session?`Séance enregistrée : ${SH.totals(r.session).made}/${SH.totals(r.session).attempts} (${SH.totals(r.session).pct} %).`:'Séance vide : rien n’a été enregistré.');go('shooting');
  };
  return <><PTPageHead onBack={()=>go('shooting')} title={d.title}>{`Ligne ${d.cursor+1} sur ${d.items.length}`}</PTPageHead>
    <div className="stack-lg shot-live">
      <section className="shot-now"><span className="shot-zone-name">{SH.ZONES[it.zone].label}</span><strong>{SH.drillLabel(it.drill,sh.custom)}</strong>
        <span className="shot-count"><b>{it.made}</b>/{it.attempts}<small> sur {it.target}</small></span>
        <span className="mini-progress"><i style={{transform:`scaleX(${Math.min(1,it.attempts/it.target)})`}}/></span>
        <span className="fine">{t.attempts?`${t.pct} % sur la séance · ${t.made}/${t.attempts}`:'Premier tir'}{streak>1?` · série : ${streak}`:''}</span></section>
      <div className="shot-buttons"><button className="shot-btn is-made" onClick={()=>tap(true)}>Réussi</button><button className="shot-btn is-miss" onClick={()=>tap(false)}>Raté</button></div>
      <div className="button-row">
        <PTButton quiet disabled={!t.attempts} onClick={()=>set(SH.undo(d))}>Annuler le dernier tir</PTButton>
        {d.cursor<d.items.length-1&&<PTButton quiet onClick={()=>set({...d,cursor:d.cursor+1})}>Ligne suivante</PTButton>}
      </div>
      <PTButton primary onClick={end}>Terminer la séance</PTButton>
    </div></>;
}

// Courbe du poids : moyenne sur 7 jours (ligne), pesées (points), poids de jeu (repère pointillé, nommé directement).
function PTWeightChart({points,playWeight,weeks=12}){
  const [hover,setHover]=usePTState(null);
  if(points.length<2)return <p className="fine">La courbe apparaît après deux pesées.</p>;
  const W=320,H=170,P={t:20,r:10,b:22,l:34},iw=W-P.l-P.r,ih=H-P.t-P.b;
  const now=PT.dateKey(),start=Date.parse(`${points[0].date}T12:00:00Z`),endT=Date.parse(`${now}T12:00:00Z`),span=Math.max(1,endT-start);
  const vals=points.flatMap(p=>[p.weight,p.avg]).concat(playWeight?[playWeight]:[]),lo=Math.floor(Math.min(...vals)-1),hi=Math.ceil(Math.max(...vals)+1);
  const x=d=>P.l+((Date.parse(`${d}T12:00:00Z`)-start)/span)*iw,y=v=>P.t+ih-((v-lo)/(hi-lo))*ih;
  const line=points.map((p,i)=>`${i?'L':'M'}${x(p.date).toFixed(1)},${y(p.avg).toFixed(1)}`).join(' ');
  const shown=hover!==null?points[hover]:points[points.length-1];
  return <figure className="chart">
    <figcaption className="chart-readout" aria-live="polite">{`${ptDay(shown.date)} : pesée ${ptFr(shown.weight)} kg · moyenne 7 jours ${ptFr(shown.avg)} kg`}</figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Poids sur ${weeks} semaines : moyenne 7 jours de ${ptFr(points[0].avg)} à ${ptFr(points[points.length-1].avg)} kg${playWeight?`, poids de jeu ${ptFr(playWeight)} kg`:''}`}>
      {[lo,(lo+hi)/2,hi].map(t=><g key={t}><line x1={P.l} x2={W-P.r} y1={y(t)} y2={y(t)} className="chart-grid"/><text x={P.l-6} y={y(t)+3} textAnchor="end" className="chart-axis">{Math.round(t)}</text></g>)}
      {playWeight&&<g><line x1={P.l} x2={W-P.r} y1={y(playWeight)} y2={y(playWeight)} className="chart-ref"/><text x={W-P.r} y={y(playWeight)-5} textAnchor="end" className="chart-axis">Poids de jeu {ptFr(playWeight)} kg</text></g>}
      <path d={line} className="chart-line" fill="none"/>
      {points.map((p,i)=><g key={p.date} tabIndex="0" role="button" aria-label={`${ptDay(p.date)} : ${ptFr(p.weight)} kg`} onMouseEnter={()=>setHover(i)} onFocus={()=>setHover(i)} onClick={()=>setHover(i)}>
        <circle cx={x(p.date)} cy={y(p.weight)} r="12" fill="transparent"/>
        <circle cx={x(p.date)} cy={y(p.weight)} r="4" className={`chart-dot${hover===i?' is-active':''}`}/>
      </g>)}
      <text x={P.l} y={H-6} className="chart-axis">{ptDay(points[0].date)}</text><text x={W-P.r} y={H-6} textAnchor="end" className="chart-axis">{ptDay(points[points.length-1].date)}</text>
    </svg>
    <p className="chart-key fine">Points : tes pesées. Ligne : moyenne sur 7 jours, qui lisse les variations d’un jour à l’autre.</p>
  </figure>;
}

function PTWeight({data,update,go,notify}){
  const [value,setValue]=usePTState(''),[error,setError]=usePTState('');
  if(!BW)return <p className="empty">Module indisponible.</p>;
  const s=BW.summary(data),pts=BW.series(data,12),blocked=s.guard.blocks.length>0;
  const save=()=>{const r=BW.addWeighIn(data,value.replace(',','.'));if(r.error){setError(r.error);return;}setError('');setValue('');update(()=>r.state);notify('Pesée enregistrée.');};
  return <><PTPageHead onBack={()=>go('profile')} title="Poids de forme.">Ton poids face à ton poids de jeu, lissé sur 7 jours. Pèse-toi le matin, une fois par semaine suffit.</PTPageHead>
    <div className="stack-lg">
      <section className="card stack-sm">
        <PTField label="Pesée du jour (kg)" type="text" inputMode="decimal" autoComplete="off" placeholder="ex. 87,6" value={value} onChange={e=>setValue(e.target.value)}/>
        {error&&<p className="error" role="alert">{error}</p>}
        <PTButton primary disabled={!value} onClick={save}>Enregistrer ma pesée</PTButton>
        {s.weighInDue&&<p className="fine">{s.last?`Dernière pesée le ${ptDay(s.last.date)}.`:'Aucune pesée pour l’instant.'}</p>}
      </section>
      {blocked?<div className="notice warning stack-sm">{s.guard.blocks.map(b=><p key={b}>{b}</p>)}</div>:s.avg!==null&&<section className="stack-sm">
        <h2>{ptFr(s.avg)} kg en moyenne sur 7 jours</h2>
        <ul className="reason-list">
          {s.gap!==null&&<li>{s.gap>0?`${ptFr(s.gap)} kg au-dessus`:s.gap<0?`${ptFr(-s.gap)} kg en dessous`:'Pile'} de ton poids de jeu ({ptFr(s.playWeight)} kg).</li>}
          {s.trend!==null&&<li>Tendance sur 4 semaines : {s.trend>0?'+':''}{ptFr(s.trend)} kg par semaine.</li>}
          {s.target&&<li>Ton objectif déclaré : {ptFr(s.target)} kg.</li>}
          {s.gap!==null&&s.gap>=5&&<li>Tant que l’écart dépasse 5 kg, ton plan limite les sauts à 3 séries et travaille le souffle au vélo plutôt qu’en course, pour ménager les genoux.</li>}
        </ul>
        <PTWeightChart points={pts} playWeight={s.playWeight}/>
        <details className="disclosure"><summary>Voir les pesées</summary><div><table className="data-table"><thead><tr><th>Date</th><th>Pesée</th><th>Moyenne 7 j</th></tr></thead><tbody>{pts.slice().reverse().map(p=><tr key={p.date}><td>{ptDay(p.date)}</td><td>{ptFr(p.weight)} kg</td><td>{ptFr(p.avg)} kg</td></tr>)}</tbody></table></div></details>
      </section>}
      {s.jump&&s.avg&&<section className="card stack-sm"><h2>Détente et poids</h2><p>{s.jump.value} cm de saut vertical (mesuré le {ptDay(s.jump.date)}) pour {ptFr(s.avg)} kg : {ptFr(s.ratio)} cm par kg.</p><p className="fine">Un repère personnel à suivre dans le temps, pas une norme : il monte quand tu sautes plus haut, quand tu allèges, ou les deux.</p></section>}
      {!blocked&&s.protein&&<section className="card stack-sm"><h2>Repères d’alimentation sportive</h2>
        <ul className="reason-list"><li>Protéines : environ {s.protein.min} à {s.protein.max} g par jour (1,4 à 2,0 g par kg), réparties sur 3 à 4 repas.</li><li>Les jours d’entraînement, un repas avec des glucides 2 à 3 h avant et une collation protéinée après aident la récupération.</li><li>Pour perdre du poids sans perdre de détente : une baisse lente et régulière, sans sauter de repas les jours de séance.</li></ul>
        <p className="fine">Repères généraux, pas une prescription. Sources : {BW.SOURCES.slice(0,2).map((x,i)=><React.Fragment key={x.url}>{i>0&&' · '}<a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}</a></React.Fragment>)}.</p></section>}
      <label className="check-label"><input type="checkbox" checked={!!data.weightPrefs?.followUp} onChange={e=>update(st=>({...st,weightPrefs:{followUp:e.target.checked}}))}/>Je suis suivi par un professionnel pour mon poids ou mon alimentation (l’app n’affiche alors ni écart ni objectif).</label>
    </div></>;
}
