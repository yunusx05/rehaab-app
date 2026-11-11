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
      why:'Le souffle des efforts courts répétés, comme une contre-attaque puis le retour en défense.'},
    // Lot 31 : terrain de beach-volley. Circuit dans le sable : plus d'effort à chaque appui, moins de choc à la réception.
    sand:{id:'sand',label:'Séance sable',title:'Cardio · séance sable',key:'K3',
      impactId:'sand-sprint',
      doses:[{sets:2,seconds:20,rest:40},{sets:2,seconds:25,rest:35},{sets:3,seconds:25,rest:35},{sets:3,seconds:30,rest:30}],
      how:['Pieds nus ou chaussettes de sable, terrain vérifié (ni verre ni cailloux).','Les exercices s’enchaînent en circuit : un tour complet, puis on recommence.','Le sable fatigue vite les mollets : garde la qualité, raccourcis si la foulée s’écrase.'],
      why:'Le sable demande plus de force à chaque appui et amortit les réceptions : détente et vivacité avec moins de choc pour les genoux.'}
  };
  // Circuit sable par niveau : on ajoute les sprints puis les sauts quand les séances précédentes sont passées sans douleur.
  const SAND = [
    ['sand-barefoot-walk','sand-shuffle','sand-pogo','sand-bear-crawl'],
    ['sand-barefoot-walk','sand-shuffle','sand-sprint','sand-pogo','sand-lunge-walk','sand-bear-crawl'],
    ['sand-barefoot-walk','sand-sprint','sand-shuffle','sand-lateral-bound','sand-squat-jump','sand-bear-crawl'],
    ['sand-barefoot-walk','sand-sprint','sand-lateral-bound','sand-broad-jump','sand-squat-jump','sand-shuffle','sand-bear-crawl']
  ];
  const SAND_SOFT = ['sand-barefoot-walk','sand-lunge-walk','sand-bear-crawl'];
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
  // Avec un terrain de sable dans le matériel, la séance sable remplace la course fractionnée (les sprints y sont).
  function weekKinds(n, monday, state) {
    if(n<=0) return [];
    const second=state&&(state.owned||[]).includes('sand')?'sand':'run';
    if(n>=2) return ['rope',second];
    const week=Math.floor(Date.parse(`${monday}T12:00:00Z`)/(7*86400000));
    return [week%2===0?'rope':second];
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
    if(!KINDS[kind]) return {error:'Séance cardio introuvable.'};
    // Séance sable impossible (pluie, pas de terrain) : fractionné de course à la place, compté comme la séance sable.
    const k=kind==='sand'?{...KINDS.run,key:KINDS.sand.key}:KINDS[kind];
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance. Demande un avis médical.'};
    const owned=state.owned||['bodyweight'];
    // Lot 31 : jour de pluie noté. Course et sable passent sur le terrain couvert (navettes) ; la corde ne change pas.
    const rain=!!(PT.rainOn&&PT.rainOn(state,now));
    // Courir dehors ne demande rien : le parcours extérieur est toujours disponible (sauf sous la pluie).
    const equipment=[...new Set([...owned,...(rain?[]:['outdoor'])])];
    if(kind==='sand'&&!rain&&owned.includes('sand')) return sandPlan(PT,PP,state,{now,forceSoft,phase,equipment});
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
    const indoor=rain&&k.id==='run';
    if(rain&&k.id==='run') reasons.push(owned.includes('court')?'Pluie notée aujourd’hui : le fractionné se fait en navettes sur ton terrain couvert.':'Pluie notée aujourd’hui : le fractionné se fait en intérieur, course sur place genoux hauts.');
    if(kind==='sand'&&!rain) reasons.push('Pas de terrain de sable dans ton matériel aujourd’hui : course fractionnée à la place.');
    if(impact.ok){
      const wanted=find(all,indoor?(owned.includes('court')?'court-shuttle':'run-in-place'):k.impactId);
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
    const ex={...rx,sets,seconds,rest,measure:'seconds',name:soft||indoor?`${chosen.name} · ${seconds} s / ${rest} s`:`${k.label} · ${seconds} s / ${rest} s`,instructions:indoor&&!soft?chosen.instructions:how,transfer:k.why};
    if(impact.ok&&impact.gentle&&!soft) reasons.push('Étape 1 du parcours : allure facile, jamais à fond. Les efforts rapides arrivent à l’étape 2.');
    reasons.push(`Niveau ${level+1} sur ${LEVELS} : ${sets} × ${seconds} s de travail, ${rest} s de récupération.`);
    if(lv.lapsed) reasons.push('Plus de trois semaines sans cette séance : on reprend un niveau plus bas.');
    if(lv.held) reasons.push('Dernière fois, une douleur a été signalée : le niveau ne monte pas avant une séance propre.');
    else if(!soft&&lv.next) reasons.push(`Encore ${lv.next} séance${lv.next>1?'s':''} sans douleur avant le niveau suivant.`);
    const exercises=[ex];
    return {id:PT.uid(),title:soft?`Cardio · ${chosen.id==='bike-interval'?'vélo par intervalles':'marche vive'}`:indoor?'Cardio · fractionné sur le terrain couvert':k.title,source:'cardio',cardioKind:kind,cardioLevel:level,cardioSoft:soft,
      focus:'cardio',format:'classic',exercises,check,reasons,warmupSeconds:240,estimatedMinutes:Math.ceil((240+PT.estimateSeconds(exercises,'classic'))/60)+3,
      status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  // Lot 31 : séance sable en circuit. Mêmes règles d'impact que le reste du cardio (parcours, douleurs, semaine chargée).
  function sandPlan(PT, PP, state, {now, forceSoft, phase, equipment}) {
    const k=KINDS.sand,safety=PT.safety(state);
    const impact=forceSoft?{ok:false,why:'Semaine chargée (club, match, jambes lourdes) : séance sable sans sauts ni sprints.'}:impactStatus(state,phase),lv=levelOf(state,'sand',now);
    // Étape 1 : pas de sauts dans le sable, seulement le premier niveau (marche, glissés, petits rebonds, ours).
    const level=impact.ok?(impact.gentle?Math.min(lv.level,1):lv.level):0;
    const check={...state.checkIn,equipment,focus:'cardio',format:'circuit',minutes:30,date:now,guided:2,constraints:state.checkIn&&state.checkIn.constraints||[],impactCleared:impact.ok};
    const ctx={...PT.context(state,check),low:false,avoidImpact:!impact.ok};
    const all=PT.allExercises(state),ok=e=>e&&PT.allowed(e,state,check,ctx)&&(!PP||PP.tolerates(e,safety.active));
    const ids=impact.ok?SAND[level]:SAND_SOFT,d=k.doses[level];
    const exercises=ids.map(id=>find(all,id)).filter(ok).map(e=>{
      const rx=PT.makePrescription(e,'circuit',30,ctx),warm=e.id==='sand-barefoot-walk';
      return {...rx,sets:warm?1:d.sets,rest:warm?30:d.rest,...(e.measure==='seconds'&&!warm?{seconds:Math.max(e.seconds,d.seconds)}:{}),
        ...(e.id==='sand-sprint'&&impact.gentle?{name:`${e.name} · 70 %`}:{})};
    });
    if(exercises.length<2) return {error:'Séance sable impossible aujourd’hui (douleurs ou contexte) : fais plutôt ta course fractionnée ou un cardio sans impact.'};
    const reasons=['Séance cardio régulière, hors parcours : elle ne fait pas avancer ton programme.',k.why,`Niveau ${level+1} sur ${LEVELS} : ${d.sets} tours du circuit, ${d.rest} s de récupération entre les exercices.`];
    if(!impact.ok) reasons.push(impact.why,'Sans impact : marche pieds nus, fentes et ours dans le sable.');
    else if(impact.gentle) reasons.push('Étape 1 du parcours : pas encore de sauts dans le sable, sprints à 70 %.');
    if(lv.held) reasons.push('Dernière fois, une douleur a été signalée : le niveau ne monte pas avant une séance propre.');
    else if(lv.next&&impact.ok) reasons.push(`Encore ${lv.next} séance${lv.next>1?'s':''} sans douleur avant le niveau suivant.`);
    reasons.push(...k.how);
    return {id:PT.uid(),title:k.title,source:'cardio',cardioKind:'sand',cardioLevel:level,cardioSoft:!impact.ok,
      focus:'cardio',format:'circuit',exercises,check,reasons,warmupSeconds:300,estimatedMinutes:Math.ceil((300+PT.estimateSeconds(exercises,'circuit'))/60)+3,
      status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  return {KINDS,KIND_IDS,LEVELS,PER_LEVEL,blank,validate,perWeek,weekKinds,history,levelOf,impactStatus,plan};
});
