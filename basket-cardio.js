/* Rehaab : cardio régulier (lot 22). Pur, sans DOM.
   - Deux séances par semaine placées par le calendrier : corde à sauter et course fractionnée.
   - Le niveau monte seul : une séance « propre » (sans douleur) compte pour la progression, deux séances = un niveau.
   - Versions sans impact (vélo par intervalles, sinon marche) quand les impacts ne sont pas de mise : phase « Remise en route »,
     zone du bas du corps douloureuse, corde absente du matériel. Les conventions de charge sont celles du reste de l'app. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BasketCardio = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = () => key(new Date());
  const diff = (a,b) => Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);
  const isDay = v => typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v));
  const lib = (name,file) => {const g=typeof globalThis!=='undefined'?globalThis:{};if(g[name])return g[name];try{return typeof require==='function'?require(file):null;}catch(e){return null;}};

  // Zones du bas du corps : une douleur active ici retire les impacts, sans retirer la séance.
  const LOWER = ['hip','knee','ankle'];
  const LEVELS = 4, PER_LEVEL = 2, LAPSE_DAYS = 21;

  const KINDS = {
    rope:{id:'rope',label:'Corde à sauter',title:'Cardio · corde à sauter',key:'K1',
      impactId:'rope',
      doses:[{sets:6,seconds:20,rest:40},{sets:8,seconds:30,rest:30},{sets:10,seconds:30,rest:30},{sets:8,seconds:40,rest:20}],
      how:['Petits sauts sur l’avant des pieds, genoux souples, coudes près du corps.','Le travail se fait aux poignets, pas aux bras. La corde frôle le sol.','Arrête la série dès que la réception devient lourde ou que le rythme casse.'],
      why:'Chevilles, mollets et souffle d’un seul coup : la base des appuis rapides et des sauts répétés.'},
    run:{id:'run',label:'Course fractionnée',title:'Cardio · course fractionnée',key:'K2',
      impactId:'run-interval',
      doses:[{sets:6,seconds:30,rest:90},{sets:8,seconds:30,rest:90},{sets:8,seconds:30,rest:60},{sets:10,seconds:30,rest:60}],
      how:['Marche d’abord 3 minutes, puis quelques foulées faciles.','Le temps de travail : cours à une allure soutenue, pas à bloc. La récupération se fait en marchant.','Pose le pied sous toi, foulée courte. Arrête si le genou ou la hanche se plaint.'],
      why:'Le souffle des efforts courts répétés, comme une contre-attaque puis le retour en défense.'}
  };
  const KIND_IDS = Object.keys(KINDS);

  // Fréquence choisie par le joueur : 0 à 2 séances par semaine (2 par défaut).
  function blank() {return {perWeek:2};}
  function validate(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return blank();
    const n=Number(v.perWeek);
    return {perWeek:Number.isInteger(n)&&n>=0&&n<=2?n:2};
  }
  function perWeek(state) {return validate(state&&state.cardio).perWeek;}
  // Une seule séance : on alterne corde et course d'une semaine à l'autre. Deux : les deux.
  function weekKinds(n, monday) {
    if(n<=0) return [];
    if(n>=2) return ['rope','run'];
    const week=Math.floor(Date.parse(`${monday}T12:00:00Z`)/(7*86400000));
    return [week%2===0?'rope':'run'];
  }

  // Séances de cette sorte, les plus récentes en premier.
  function history(state, kind) {
    return (state.sessions||[]).filter(s=>s&&s.source==='cardio'&&s.cardioKind===kind&&isDay(s.date)).sort((a,b)=>b.date.localeCompare(a.date));
  }
  // Séance « propre » : terminée sans douleur signalée, sans lendemain pire.
  const clean = s => !s.partial&&s.nextDay!=='worse'&&!Object.values(s.entries||{}).flat().some(r=>r&&r.pain);
  // Niveau 0 à 3. Une pause de plus de trois semaines fait redescendre d'un niveau (reprise douce).
  function levelOf(state, kind, now=today()) {
    const list=history(state,kind);
    let level=Math.min(LEVELS-1,Math.floor(list.filter(clean).length/PER_LEVEL));
    const lapsed=list.length>0&&diff(now,list[0].date)>LAPSE_DAYS;
    if(lapsed) level=Math.max(0,level-1);
    return {level,done:list.filter(clean).length,lapsed,last:list[0]?list[0].date:null,
      held:list.length>0&&!clean(list[0]),next:level<LEVELS-1?PER_LEVEL-(list.filter(clean).length%PER_LEVEL):0};
  }

  // Le parcours et les douleurs décident si les impacts sont possibles, pas le nombre de jours depuis la dernière séance :
  // c'est justement la reprise que cette séance doit relancer.
  function impactStatus(state, phase) {
    const pains=(state.symptoms||[]).filter(s=>s&&s.active&&LOWER.includes(s.region));
    const step=state.pathway&&state.pathway.status!=='archived'?Number(state.pathway.step)||1:0;
    if(phase==='reset') return {ok:false,why:'Remise en route : aucun saut ni sprint pour l’instant. Cardio sans impact.'};
    if(pains.length) return {ok:false,why:'Une douleur est active (hanche, genou ou cheville) : cardio sans impact.'};
    // Étape 1 du parcours : pas de sprint ni de saut maximal. La corde (petits sauts) et la course facile restent permises.
    return {ok:true,step,gentle:step<2};
  }

  const find = (all,id) => all.find(e=>e.id===id);
  // Séance prête à lancer. PT : personal-engine, PP : player-profile, phase : phase actuelle du plan de saison ('reset', 'step1'…).
  function plan(PT, PP, state, kind, {now=today(), phase='', soft: forceSoft=false}={}) {
    const k=KINDS[kind]; if(!k) return {error:'Séance cardio introuvable.'};
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance. Demande un avis médical.'};
    const owned=state.owned||['bodyweight'];
    // Courir dehors ne demande rien : le parcours extérieur est toujours disponible.
    const equipment=[...new Set([...owned,'outdoor'])];
    // forceSoft : le calendrier n'a trouvé aucun jour pour une séance à impacts cette semaine.
    const impact=forceSoft?{ok:false,why:'Semaine chargée (club, match, jambes lourdes) : le cardio de cette semaine se fait sans impact.'}:impactStatus(state,phase), lv=levelOf(state,kind,now);
    // Étape 1 : pas au-delà du niveau 1, et aucune allure « vite ».
    const level=impact.ok&&impact.gentle?Math.min(lv.level,1):lv.level;
    const base={...state.checkIn,equipment,focus:'cardio',format:'classic',minutes:25,date:now,guided:2,constraints:state.checkIn&&state.checkIn.constraints||[]};
    const check={...base,impactCleared:impact.ok};
    const ctx={...PT.context(state,check),low:false,avoidImpact:!impact.ok};
    const all=PT.allExercises(state);
    const ok=e=>e&&PT.allowed(e,state,check,ctx)&&(!PP||PP.tolerates(e,safety.active));
    const reasons=['Séance cardio régulière, hors parcours : elle ne fait pas avancer ton programme.'];
    let chosen=null,soft=false;
    if(impact.ok){
      const wanted=find(all,k.impactId);
      if(ok(wanted)) chosen=wanted;
      else if(kind==='rope'&&!owned.includes('rope')) reasons.push('Pas de corde à sauter dans ton matériel : ajoute-la dans ton profil pour la débloquer. En attendant, cardio sans impact.');
    } else reasons.push(impact.why);
    if(!chosen){
      soft=true;
      chosen=['bike-interval','walk','march'].map(id=>find(all,id)).find(ok);
      if(!chosen) return {error:'Aucun mouvement cardio compatible avec ton matériel et tes douleurs actuelles.'};
    }
    // Dose : même tableau que la version à impact, sans allure maximale quand l'impact est écarté.
    const d=k.doses[level];
    const rx=PT.makePrescription(chosen,'classic',25,ctx);
    const seconds=soft?Math.max(30,Math.min(d.seconds,40)):d.seconds;
    const rest=soft?Math.max(45,d.rest):d.rest;
    const sets=soft?Math.min(d.sets,8):d.sets;
    const how=soft?(chosen.id==='bike-interval'?['Résistance modérée, cadence rapide pendant le temps de travail.','Récupère en pédalant très doucement.','Sans impact : le travail est le même, sans le choc pour le genou et la cheville.']:['Allure vive, bras actifs pendant le temps de travail.','Récupère à allure tranquille.']):k.how;
    const ex={...rx,sets,seconds,rest,measure:'seconds',name:soft?`${chosen.name} · ${seconds} s / ${rest} s`:`${k.label} · ${seconds} s / ${rest} s`,instructions:how,transfer:k.why};
    if(impact.ok&&impact.gentle&&!soft) reasons.push('Étape 1 du parcours : allure facile, jamais à fond. Les efforts rapides arrivent à l’étape 2.');
    reasons.push(`Niveau ${level+1} sur ${LEVELS} : ${sets} × ${seconds} s de travail, ${rest} s de récupération.`);
    if(lv.lapsed) reasons.push('Plus de trois semaines sans cette séance : on reprend un niveau plus bas.');
    if(lv.held) reasons.push('Dernière fois, une douleur a été signalée : le niveau ne monte pas avant une séance propre.');
    else if(!soft&&lv.next) reasons.push(`Encore ${lv.next} séance${lv.next>1?'s':''} sans douleur avant le niveau suivant.`);
    const exercises=[ex];
    return {id:PT.uid(),title:soft?`Cardio · ${chosen.id==='bike-interval'?'vélo par intervalles':'marche vive'}`:k.title,source:'cardio',cardioKind:kind,cardioLevel:level,cardioSoft:soft,
      focus:'cardio',format:'classic',exercises,check,reasons,warmupSeconds:240,estimatedMinutes:Math.ceil((240+PT.estimateSeconds(exercises,'classic'))/60)+3,
      status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  return {KINDS,KIND_IDS,LEVELS,PER_LEVEL,blank,validate,perWeek,weekKinds,history,levelOf,impactStatus,plan};
});
