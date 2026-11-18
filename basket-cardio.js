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
    // Lot 32 : cardio basket. Efforts courts et répétés, comme en match : sprint, freinage, retour. Sur le terrain couvert (jamais bloqué par la pluie).
    court:{id:'court',label:'Navettes basket',title:'Cardio · navettes basket',key:'K4',
      impactId:'court-shuttle',
      doses:[{sets:8,seconds:15,rest:45},{sets:10,seconds:15,rest:30},{sets:12,seconds:15,rest:25},{sets:12,seconds:20,rest:20}],
      how:['Ligne de fond → lancer franc → ligne de fond → milieu → ligne de fond, puis on enchaîne tant que le temps court.','Freine en abaissant les hanches, pied extérieur bien posé, et repars. Touche la ligne avec la main.','Récupération debout, mains sur la tête, pas penché en avant : c’est là que le souffle se construit.'],
      why:'Le souffle du basket : répéter des sprints courts et des freinages sans perdre en vitesse, au 4e quart comme au 1er.'},
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

  // Fréquence choisie par le joueur : 0 à 3 séances par semaine (3 par défaut depuis le lot 32 : le souffle est son premier point faible).
  // L'ancien réglage par défaut (« 2 », jamais choisi à la main) passe à 3 ; un 0 ou un 1 choisi avant reste tel quel.
  function blank() {return {perWeek:3};}
  function validate(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return blank();
    const n=Number(v.perWeek),chosen=v.chosen===true;
    // Lot 42 : circuit training (0 ou 1 par semaine, 1 par défaut), gardé à part du nombre de cardios.
    // Lot 44 : jour fixe du circuit (0 = lundi … 6 = dimanche), sinon l'app choisit.
    const circuit={...(v.circuit===0?{circuit:0}:{}),...(Number.isInteger(v.circuitDay)&&v.circuitDay>=0&&v.circuitDay<7?{circuitDay:v.circuitDay}:{})};
    if(!Number.isInteger(n)||n<0||n>3) return {...blank(),...circuit};
    if(n===2&&!chosen) return {...blank(),...circuit};
    return chosen?{perWeek:n,chosen:true,...circuit}:{perWeek:n,...circuit};
  }
  function perWeek(state) {return validate(state&&state.cardio).perWeek;}
  // Une seule séance : on alterne corde et course d'une semaine à l'autre. Deux : les deux.
  // Avec un terrain de sable dans le matériel, la séance sable remplace la course fractionnée (les sprints y sont).
  function weekKinds(n, monday, state) {
    if(n<=0) return [];
    const second=state&&(state.owned||[]).includes('sand')?'sand':'run';
    if(n>=3) return ['court','rope',second];
    if(n>=2) return ['rope',second];
    // Lot 39 : un seul cardio à faire soi-même : les navettes basket (les plus proches du match) si tu as un terrain, sinon corde et course en alternance.
    if(state&&(state.owned||[]).includes('court')) return ['court'];
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
    // Lot 32 : une gêne (2/10 ou moins) ne retire plus les impacts, sauf si un lendemain de séance a été signalé « pire » ces 2 derniers jours.
    const flare=(state.sessions||[]).some(s=>s&&s.nextDay==='worse'&&diff(today(),s.date)>=0&&diff(today(),s.date)<=2);
    const pains=(state.symptoms||[]).filter(s=>s&&s.active&&LOWER.includes(s.region)&&(Number(s.severity)>2||flare));
    const step=state.pathway&&state.pathway.status!=='archived'?Number(state.pathway.step)||1:0;
    if(phase==='reset') return {ok:false,why:'Remise en route : aucun saut ni sprint pour l’instant. Cardio sans impact.'};
    if(pains.length) return {ok:false,why:'Une douleur est active (hanche, genou ou cheville) : cardio sans impact.'};
    // Étape 1 du parcours : pas de sprint ni de saut maximal. La corde (petits sauts) et la course facile restent permises.
    return {ok:true,step,gentle:step<2};
  }

  const find = (all,id) => all.find(e=>e.id===id);
  // Séance prête à lancer. PT : personal-engine, PP : player-profile, phase : phase actuelle du plan de saison ('reset', 'step1'…).
  function plan(PT, PP, state, kind, {now=today(), phase='', soft: forceSoft=false}={}) {
    if(kind==='wod') return wodPlan(PT,PP,state,{now,phase,soft:forceSoft});
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
    const indoor=rain&&k.id==='run'||k.id==='court';
    if(rain&&k.id==='run') reasons.push(owned.includes('court')?'Pluie notée aujourd’hui : le fractionné se fait en navettes sur ton terrain couvert.':'Pluie notée aujourd’hui : le fractionné se fait en intérieur, course sur place genoux hauts.');
    if(kind==='sand'&&!rain) reasons.push('Pas de terrain de sable dans ton matériel aujourd’hui : course fractionnée à la place.');
    if(impact.ok){
      const wanted=find(all,k.id==='court'?(owned.includes('court')?'court-shuttle':'run-in-place'):indoor?(owned.includes('court')?'court-shuttle':'run-in-place'):k.impactId);
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
    const ex={...rx,sets,seconds,rest,measure:'seconds',name:soft||indoor?`${chosen.name} · ${seconds} s / ${rest} s`:`${k.label} · ${seconds} s / ${rest} s`,instructions:indoor&&!soft&&k.id!=='court'?chosen.instructions:how,transfer:k.why};
    if(impact.ok&&impact.gentle&&!soft) reasons.push('Étape 1 du parcours : allure facile, jamais à fond. Les efforts rapides arrivent à l’étape 2.');
    reasons.push(`Niveau ${level+1} sur ${LEVELS} : ${sets} × ${seconds} s de travail, ${rest} s de récupération.`);
    if(lv.lapsed) reasons.push('Plus de trois semaines sans cette séance : on reprend un niveau plus bas.');
    if(lv.held) reasons.push('Dernière fois, une douleur a été signalée : le niveau ne monte pas avant une séance propre.');
    else if(!soft&&lv.next) reasons.push(`Encore ${lv.next} séance${lv.next>1?'s':''} sans douleur avant le niveau suivant.`);
    const exercises=[ex];
    return {id:PT.uid(),title:soft?`Cardio · ${chosen.id==='bike-interval'?'vélo par intervalles':'marche vive'}`:k.id==='court'?k.title:indoor?'Cardio · fractionné sur le terrain couvert':k.title,source:'cardio',cardioKind:kind,cardioLevel:level,cardioSoft:soft,
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

  // Lot 42 : circuit training full body, style CrossFit, une fois par semaine, à la maison.
  // Le format tourne chaque semaine : AMRAP (un maximum de tours), EMOM (un exercice par minute), intervalles 40/20.
  // Mouvements choisis dans ton matériel ; sauts, corde et burpees seulement si les impacts sont permis.
  const WOD_SLOTS = {
    power:['kb-swing','db-snatch','db-thruster','kb-deadlift'],
    legs:['db-thruster','box-jump-step','goblet','vest-step-up','db-step-up','reverse-lunge','squat'],
    push:['burpee','pushup','push-press','vest-pushup','burpee-nojump','incline-pushup'],
    pull:['plank-db-row','kb-row','db-row','band-row','inverted-row'],
    engine:['rope','bike-sprints','burpee','mountain-climber','slider-climber','jumping-jack','bike-interval','stepjack'],
    core:['plank-shoulder-tap','slider-bodysaw','bear-crawl','plank']
  };
  const WOD_FORMATS = ['amrap','emom','hiit'];
  const WOD_BLOCK = {amrap:[12,14,16,18],emom:[12,15,16,20]};
  const WOD_ROUNDS = [3,3,4,5];
  function circuitPerWeek(state) {const v=state&&state.cardio;return v&&v.circuit===0?0:1;}
  const weekIndex = d => Math.floor(Date.parse(`${d}T12:00:00Z`)/(7*86400000));
  function wodPlan(PT, PP, state, {now=today(), phase='', soft: forceSoft=false, format: wanted=null, minutes: budget=null}={}) {
    const safety=PT.safety(state);
    if(safety.blocked) return {error:'Douleur importante ou signe inhabituel : pas de séance. Demande un avis médical.'};
    // À la maison : ce qui demande le terrain, le parcours extérieur ou le sable est écarté.
    const owned=(state.owned||['bodyweight']).filter(n=>!['court','outdoor','sand','hoop'].includes(n));
    const impact=forceSoft?{ok:false,why:'Semaine chargée : le circuit de cette semaine se fait sans sauts.'}:impactStatus(state,phase), lv=levelOf(state,'wod',now);
    const level=impact.ok&&impact.gentle?Math.min(lv.level,1):lv.level;
    const check={...state.checkIn,equipment:owned,focus:'cardio',format:'circuit',minutes:25,date:now,guided:2,constraints:state.checkIn&&state.checkIn.constraints||[],impactCleared:impact.ok};
    const ctx={...PT.context(state,check),low:false,avoidImpact:!impact.ok};
    const all=PT.allExercises(state),ok=e=>e&&!(e.impact&&!impact.ok)&&PT.allowed(e,state,check,ctx)&&(!PP||PP.tolerates(e,safety.active));
    const wk=weekIndex(now);
    const format=WOD_FORMATS.includes(wanted)?wanted:WOD_FORMATS[((wk%3)+3)%3];
    // Variété : chaque semaine, on part d'un rang différent dans la liste de chaque famille.
    // Les listes sont rangées du plus « CrossFit » au plus simple : la rotation ne tourne que sur les trois premiers possibles.
    const pick=(slot,taken)=>{const list=WOD_SLOTS[slot].map(id=>find(all,id)).filter(e=>ok(e)&&!taken.includes(e.id)).slice(0,3);const r=Math.floor(wk/3)+Object.keys(WOD_SLOTS).indexOf(slot);return list.length?list[((r%list.length)+list.length)%list.length]:null;};
    const order=format==='emom'?['power','push','pull','engine']:['power','legs','push','pull','engine','core'];
    const taken=[],moves=[];
    order.forEach(slot=>{const e=pick(slot,taken);if(e){taken.push(e.id);moves.push(e);}});
    const count=format==='amrap'?5:format==='emom'?4:6;
    const list=moves.slice(0,count);
    if(list.length<3) return {error:'Pas assez de mouvements compatibles avec ton matériel et tes douleurs pour un circuit.'};
    const reps=[8,10,12,15][level];
    let exercises,blockSeconds=null,rounds;
    if(format==='amrap'){
      blockSeconds=(budget?Math.max(8,Math.min(WOD_BLOCK.amrap[level],budget-8)):WOD_BLOCK.amrap[level])*60;
      exercises=list.map(e=>{
        const rx=PT.makePrescription(e,'amrap',25,ctx);
        // Burpees comptés en répétitions, comme dans un WOD.
        if(/^burpee/.test(e.id)){const n=[6,8,10,12][level];return {...rx,sets:1,rest:10,measure:'reps',min:n,max:n,targetMin:n,targetMax:n};}
        if(e.measure==='seconds') return {...rx,sets:1,rest:10,seconds:e.id==='bike-sprints'?15:30,measure:'seconds'};
        const n=e.kind==='plyo'?[5,6,8,8][level]:e.unilateral?Math.max(6,reps-2):e.weighted?reps:reps+4;
        return {...rx,sets:1,rest:10,min:n,max:n,targetMin:n,targetMax:n};
      });
    } else if(format==='emom'){
      const minutes=budget?Math.max(8,Math.min(WOD_BLOCK.emom[level],budget-8)):WOD_BLOCK.emom[level];
      rounds=Math.max(2,Math.floor(minutes/list.length));blockSeconds=rounds*list.length*60;
      exercises=list.map(e=>({...PT.makePrescription(e,'emom',25,ctx),sets:rounds,seconds:[30,35,40,40][level],rest:20,measure:'seconds'}));
    } else {
      rounds=budget?Math.max(2,Math.min(WOD_ROUNDS[level],Math.floor((budget-6)/list.length))):WOD_ROUNDS[level];
      exercises=list.map(e=>({...PT.makePrescription(e,'hiit',25,ctx),sets:rounds,seconds:40,rest:20,measure:'seconds'}));
    }
    const name={amrap:`AMRAP ${Math.round(blockSeconds/60)} min`,emom:`EMOM ${Math.round(blockSeconds/60)} min`,hiit:`${rounds} tours · 40 s / 20 s`}[format];
    const reasons=['Circuit training full body, une fois par semaine : le souffle, la force et le gainage dans la même séance, sans faire avancer ton programme.',
      {amrap:'AMRAP : enchaîne les mouvements dans l’ordre, le plus de tours possible avant la fin du chrono. Note tes tours à la fin : la semaine où le format revient, essaie d’en faire un de plus.',
       emom:'EMOM : au début de chaque minute, fais le mouvement indiqué ; le reste de la minute, tu récupères. Si tu n’as plus le temps de souffler, ralentis le rythme, pas la technique.',
       hiit:'Intervalles : 40 secondes de travail, 20 secondes pour passer au mouvement suivant. Un tour = tous les mouvements.'}[format],
      `Niveau ${level+1} sur ${LEVELS}.`];
    if(!impact.ok) reasons.push(`${impact.why.replace(/[Cc]ardio sans impact\.?/,'')} Ni sauts, ni corde, ni burpees aujourd’hui.`.trim());
    else if(impact.gentle) reasons.push('Étape 1 du parcours : allure contrôlée, pas de course contre la montre.');
    if(lv.held) reasons.push('Dernière fois, une douleur a été signalée : le niveau ne monte pas avant une séance propre.');
    else if(lv.next) reasons.push(`Encore ${lv.next} séance${lv.next>1?'s':''} sans douleur avant le niveau suivant.`);
    reasons.push('Charges moyennes : tu dois pouvoir enchaîner toutes les répétitions sans t’arrêter. La technique passe avant le chrono.');
    const estimate=Math.ceil((300+(blockSeconds||PT.estimateSeconds(exercises,format))+60)/60);
    return {id:PT.uid(),title:`Circuit training · ${name}`,source:'cardio',cardioKind:'wod',cardioLevel:level,cardioSoft:!impact.ok,
      focus:'cardio',format,exercises,check,reasons,warmupSeconds:300,blockSeconds,estimatedMinutes:estimate,
      status:'preview',entries:{},createdAt:new Date().toISOString()};
  }

  return {KINDS,KIND_IDS,LEVELS,PER_LEVEL,WOD_SLOTS,blank,validate,perWeek,circuitPerWeek,weekKinds,history,levelOf,impactStatus,plan,wodPlan};
});
