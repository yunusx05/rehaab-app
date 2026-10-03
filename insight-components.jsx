/* Carte « Aujourd’hui », charge d’entraînement, courbes par mouvement et mesure vidéo au ralenti. Réutilise les composants de personal-app.jsx. */

// Jauge : ratio 7 jours / moyenne 4 semaines, de 0 à 2. Zones 0,8 – 1,3 – 1,5 comme dans PT.trainingLoad.
function PTLoadGauge({load}) {
  if(load.zone==='calibration'||load.ratio==null) return <p className="fine load-calibration">Calibration de ta charge : {Math.min(load.history,21)} jour{load.history>1?'s':''} d’historique sur 21. Enregistre aussi tes matchs et entraînements de club.</p>;
  const pos=Math.min(100,load.ratio/2*100);
  return <div className="load-gauge" role="img" aria-label={`Charge : ${String(load.ratio).replace('.',',')} fois ta moyenne, ${PT.loadZones[load.zone].toLowerCase()}`}>
    <div className="load-track"><span className="z-low" style={{width:'40%'}}/><span className="z-stable" style={{width:'25%'}}/><span className="z-rising" style={{width:'10%'}}/><span className="z-spike" style={{width:'25%'}}/><i style={{left:`${pos}%`}}/></div>
    <div className="topline caption"><span>{PT.loadZones[load.zone]}</span><span className="num">× {String(load.ratio).replace('.',',')}</span></div>
  </div>;
}

function PTTodayPlan({data,update,go,notify}) {
  const plan=PT.todayPlan(data);
  const quick=(focus,minutes)=>{
    if(data.draft?.status==='active'){go('session');notify('Ta séance en cours est conservée.');return;}
    const check={...data.checkIn,date:PT.dateKey(),equipment:data.owned,minutes,focus,motivation:'normal',energy:data.checkIn.date===PT.dateKey()?data.checkIn.energy:'normal'};
    const draft=PT.generate(data,check);if(draft.error){notify(draft.error);return;}
    update(s=>({...s,checkIn:check,draft}));go('preview');
  };
  const RW=window.RehabWarmup;
  const actions={
    symptoms:['Faire le point',()=>go('symptoms')],
    warmup:['Lancer l’échauffement',()=>RW&&typeof rwLaunch==='function'?rwLaunch({data,update,go,notify},s=>RW.warmupPlan(PT,window.PlayerProfile,s,RW.warmups[0].id)):go('today')],
    rehab:['Trouver mon protocole',()=>go('rehab')],
    mobility:['10 min de mobilité',()=>quick('mobility',15)],
    session:[plan.kind==='light'?'Séance légère · 20 min':'Préparer ma séance',()=>quick('muscle',plan.kind==='light'?20:30)],
    pathway:['Ouvrir mon parcours',()=>go('pathway')],
    program:['Ouvrir mon programme',()=>go('program')]
  };
  const [label,run]=actions[plan.action]||actions.session;
  return <section className={`today-plan kind-${plan.kind} sport-reveal`} aria-labelledby="today-plan-title">
    <span className="eyebrow">Aujourd’hui, pour toi</span>
    <h2 id="today-plan-title">{plan.title}</h2>
    <ul className="reason-list">{plan.why.map(w=><li key={w}>{w}</li>)}</ul>
    <PTLoadGauge load={plan.load}/>
    <PTButton primary onClick={run}>{label}<PTIcon name="arrow" size={18}/></PTButton>
  </section>;
}

// Charge des 6 dernières semaines : barres simples, la semaine en cours à droite.
function PTLoadHistory({data}) {
  const load=PT.trainingLoad(data),max=Math.max(1,...load.weeks.map(w=>w.load));
  return <section className="card stack">
    <div className="card-header"><h3>Charge d’entraînement</h3><small>minutes × effort</small></div>
    <div className="load-weeks">{load.weeks.map(w=><div key={w.week} className={w.week===0?'current':''}><span style={{height:`${Math.max(3,w.load/max*100)}%`}}/><small>{w.week===0?'Cette sem.':`S-${w.week}`}</small></div>)}</div>
    <PTLoadGauge load={load}/>
    <p className="fine">Repère de dosage : évite qu’une semaine dépasse nettement ta moyenne. Ce n’est pas une prédiction de blessure.{load.estimated?' Certaines activités sans effort noté comptent pour 5/10.':''}</p>
  </section>;
}

// Courbe par mouvement repère : 1RM estimée (Epley) séance après séance, plus la meilleure série réelle.
function PTLiftCurves({data}) {
  const lifts=PT.trackedLifts(data),[id,setId]=usePTState(lifts[0]?.id||null);
  if(!lifts.length) return <section className="card stack"><h3>Mes courbes de progression</h3><p className="empty">Enregistre au moins deux séances avec charge sur le même mouvement pour voir sa courbe.</p></section>;
  const current=lifts.find(l=>l.id===id)||lifts[0],points=PT.liftHistory(data,current.id).filter(p=>p.e1rm>0);
  const values=points.map(p=>p.e1rm),lo=Math.min(...values),hi=Math.max(...values),span=Math.max(1,hi-lo);
  const W=300,H=120,x=i=>points.length<2?W/2:12+i*(W-24)/(points.length-1),y=v=>H-14-(v-lo)/span*(H-30);
  const first=points[0],last=points[points.length-1],delta=first&&last?Math.round((last.e1rm-first.e1rm)/first.e1rm*100):0;
  return <section className="card stack lift-curves">
    <div className="card-header"><h3>Mes courbes de progression</h3><small>{points.length} séances</small></div>
    <PTField label="Mouvement"><select value={current.id} onChange={e=>setId(e.target.value)}>{lifts.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></PTField>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${current.name} : de ${first.e1rm} à ${last.e1rm} kg estimés`}>
      <polyline points={points.map((p,i)=>`${x(i)},${y(p.e1rm)}`).join(' ')}/>
      {points.map((p,i)=><circle key={p.sessionId} cx={x(i)} cy={y(p.e1rm)} r="3.5"><title>{`${shortDate(p.date)} · ${p.weight} kg × ${p.reps}`}</title></circle>)}
    </svg>
    <div className="stats-row"><div className="stat"><strong>{last.weight}<small> kg</small></strong><small>× {last.reps} · dernière</small></div><div className="stat"><strong>{last.e1rm}</strong><small>max estimé (kg)</small></div><div className="stat"><strong>{delta>0?'+':''}{delta} %</strong><small>depuis le début</small></div></div>
    <p className="fine">Max estimé à partir de ta meilleure série (formule d’Epley). Ce n’est pas une charge à tenter : il sert seulement à comparer tes séances entre elles.</p>
  </section>;
}

// Mesure vidéo au ralenti, principe de l'app My Jump : temps de vol t entre décollage et réception, hauteur = g·t²/8.
// La vidéo reste sur le téléphone (URL locale), rien n'est envoyé.
const ptVideoModes={
  jump:{marks:['Décollage (orteils quittent le sol)','Réception (premier contact)'],unit:'cm'},
  rsi:{marks:['Arrivée au sol','Décollage','Réception'],unit:'RSI'},
  sprint:{marks:['Départ (premier mouvement)','Arrivée (buste passe la ligne)'],unit:'s'}
};
function ptVideoResult(mode,times,slow) {
  const d=(a,b)=>(times[b]-times[a])/slow;
  if(times.some(t=>t==null)) return {error:'Marque toutes les images.'};
  if(mode==='sprint'){const t=d(0,1);return t>0.3&&t<120?{value:Math.round(t*100)/100,detail:`${(Math.round(t*100)/100).toFixed(2)} s`}:{error:'Temps incohérent : vérifie l’ordre des images et le réglage du ralenti.'};}
  const flight=mode==='rsi'?d(1,2):d(0,1),h=9.81*flight*flight/8;
  if(!(flight>0.1&&flight<1.2)) return {error:'Temps de vol incohérent (attendu entre 0,1 et 1,2 s) : vérifie l’ordre des images et le ralenti.'};
  const cm=Math.round(h*1000)/10;
  if(mode==='jump') return {value:cm,detail:`${cm} cm · vol ${Math.round(flight*1000)} ms`};
  const contact=d(0,1);
  if(!(contact>0.05&&contact<1.5)) return {error:'Temps de contact incohérent : marque l’arrivée au sol avant le décollage.'};
  const rsi=Math.round(h/contact*100)/100;
  return {value:rsi,detail:`RSI ${rsi} · ${cm} cm en ${Math.round(contact*1000)} ms de contact`};
}
function PTVideoMeasure({mode,onResult}) {
  const cfg=ptVideoModes[mode],video=usePTRef(null);
  const [src,setSrc]=usePTState(null),[fps,setFps]=usePTState(240),[slow,setSlow]=usePTState(1),[times,setTimes]=usePTState(cfg.marks.map(()=>null)),[active,setActive]=usePTState(0),[now,setNow]=usePTState(0);
  usePTEffect(()=>()=>{if(src)URL.revokeObjectURL(src);},[src]);
  const load=e=>{const f=e.target.files?.[0];if(!f)return;setSrc(URL.createObjectURL(f));setTimes(cfg.marks.map(()=>null));setActive(0);};
  // Lecture image par image : on déplace currentTime d'une image du fichier (1/fps, ou 1/30 pour un ralenti déjà étiré à la lecture).
  const step=n=>{const v=video.current;if(!v)return;v.pause();const frame=1/(slow>1?30:fps);v.currentTime=Math.max(0,Math.min(v.duration||0,v.currentTime+n*frame));};
  const mark=()=>{const t=video.current?.currentTime??0;setTimes(list=>list.map((x,i)=>i===active?t:x));setActive(a=>Math.min(cfg.marks.length-1,a+1));};
  const result=ptVideoResult(mode,times,slow);
  return <div className="video-measure stack">
    <label className="btn quiet file-button"><PTIcon name="play" size={18}/>{src?'Choisir une autre vidéo':'Choisir ou filmer une vidéo'}<input type="file" accept="video/*" onChange={load}/></label>
    <div className="stack-sm"><span className="fine">Images par seconde du film</span><PTChips value={fps} onChange={setFps} options={[30,60,120,240].map(n=>({value:n,label:`${n}`}))}/></div>
    <div className="stack-sm"><span className="fine">À la lecture, la vidéo est…</span><PTChips value={slow} onChange={setSlow} options={[{value:1,label:'en temps réel'},{value:4,label:'ralentie ×4'},{value:8,label:'ralentie ×8'}]}/></div>
    {src&&<>
      <video ref={video} src={src} playsInline muted preload="auto" controls onTimeUpdate={e=>setNow(e.currentTarget.currentTime)} onSeeked={e=>setNow(e.currentTarget.currentTime)}/>
      <div className="frame-controls"><button className="icon-button" aria-label="Reculer de 5 images" onClick={()=>step(-5)}>«</button><button className="icon-button" aria-label="Image précédente" onClick={()=>step(-1)}>‹</button><span className="num">{now.toFixed(3)} s</span><button className="icon-button" aria-label="Image suivante" onClick={()=>step(1)}>›</button><button className="icon-button" aria-label="Avancer de 5 images" onClick={()=>step(5)}>»</button></div>
      <div className="mark-list">{cfg.marks.map((m,i)=><button key={m} className="chip" aria-pressed={active===i} onClick={()=>{setActive(i);if(times[i]!=null&&video.current)video.current.currentTime=times[i];}}>{i+1}. {m}{times[i]!=null?` · ${times[i].toFixed(3)} s`:''}</button>)}</div>
      <PTButton onClick={mark}>Marquer : {cfg.marks[active]}</PTButton>
      {times.every(t=>t!=null)&&(result.error?<p className="error" role="alert">{result.error}</p>:<div className="notice stack-sm"><strong>{result.detail}</strong><PTButton primary onClick={()=>onResult(result.value)}>Enregistrer ce résultat<PTIcon name="check" size={18}/></PTButton></div>)}
    </>}
    <p className="fine">Filme de profil, téléphone posé au sol, corps entier visible. Plus le ralenti est fort (240 i/s), plus la mesure est précise. La vidéo ne quitte pas ton téléphone.</p>
  </div>;
}
