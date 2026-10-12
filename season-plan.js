/* Rehaab : plan de saison et calendrier (lot 14). Pur, sans DOM.
   - build : phases du joueur (remise en route, 5 étapes du parcours, cycles de développement), position actuelle, prochains tests.
   - weekSchedule : place chaque séance sur un jour de la semaine, selon les disponibilités du dossier et les règles de charge.
   - reschedule / missed : déplacer une séance, ou la décaler après un jour manqué, en revalidant les règles.
   - review : bilan de la semaine écoulée (prévu / fait, douleurs, tests, poids, QI) et ajustements proposés.
   Les règles sont des conventions d'entraînement courantes, présentées comme telles (voir COACH-SOURCES.md). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SeasonPlan = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = () => key(new Date());
  const at = (date, shift=0) => {const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+shift);return key(d);};
  const weekday = date => (new Date(`${date}T12:00:00`).getDay()+6)%7; // lundi = 0
  const diff = (a,b) => Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);
  const mondayOf = date => at(date,-weekday(date));
  const isDay = v => typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v));
  const lib = (name,file) => {const g=typeof globalThis!=='undefined'?globalThis:{};if(g[name])return g[name];try{return typeof require==='function'?require(file):null;}catch(e){return null;}};
  const BPL = () => lib('BasketPathway','./basket-pathway.js');
  const PDL = () => lib('PlayerDossier','./player-dossier.js');
  const PTL = () => lib('PersonalTraining','./personal-engine.js');
  const SKL = () => lib('BasketSkills','./basket-skills.js');
  const SHL = () => lib('Shooting','./shooting.js');

  // Développement : cycles de 4 semaines après le retour au jeu, la 4e allégée. En saison, l'entretien prend le relais.
  const CYCLES = [
    {id:'dev-vertical',name:'Développement · détente',focus:'vertical',goal:'Gagner des centimètres : force puis saut dans la même séance, sauts avec élan, appel sur un pied.'},
    {id:'dev-quick',name:'Développement · vivacité',focus:'firststep',goal:'Premier pas et freinage : départs au signal, coupes, chevilles réactives.'},
    {id:'dev-strength',name:'Développement · force',focus:'strength',goal:'Remonter la force de base qui nourrit tout le reste, sans oublier les tendons.'},
    {id:'dev-maintain',name:'Entretien en saison',focus:'maintain',goal:'Deux séances courtes par semaine pour garder ce qui a été construit pendant les matchs.'}
  ];

  function activePains(state) {
    return (state.symptoms||[]).filter(s=>s&&s.active!==false&&!s.resolvedAt&&Number(s.severity)>0).map(s=>({region:s.region,severity:Number(s.severity)}));
  }
  // Phase 0 « Remise en route » : avant toute charge, quand la pause est longue, qu'une douleur est active ou que le poids s'est éloigné du poids de jeu.
  function resetNeed(state) {
    const a=state.dossier&&state.dossier.answers||{}, PD=PDL();
    const months=Number(a.layoffMonths)||(state.player&&state.player.layoff==='long'?12:0);
    const gap=PD&&PD.gap?PD.gap(a):null, pains=activePains(state), reasons=[];
    if(months>=12) reasons.push(`${months} mois sans jouer : les muscles reviennent vite, les tendons plus lentement.`);
    const PT=PTL(),zone=r=>((PT&&PT.regions[r])||r).toLowerCase();
    if(pains.length) reasons.push(`Douleur active (${pains.map(p=>`${zone(p.region)} ${p.severity}/10`).join(', ')}) : on calme avant de charger.`);
    if(gap!==null&&gap>=5) reasons.push(`${gap} kg au-dessus de ton poids de jeu : les sauts attendent que les tendons et le poids suivent.`);
    if(!reasons.length) return {weeks:0,reasons};
    const weeks=Math.min(4,2+(months>=24?1:0)+(gap!==null&&gap>=8?1:0)+(pains.some(p=>p.severity>=4)?1:0));
    return {weeks,reasons};
  }

  function blank() {return {start:null,resetWeeks:null,resetDone:null,devStart:null,architect:null};}
  function validate(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return null;
    const out=blank();
    if(isDay(v.start)) out.start=v.start;
    if(Number.isInteger(v.resetWeeks)&&v.resetWeeks>=0&&v.resetWeeks<=4) out.resetWeeks=v.resetWeeks;
    if(isDay(v.resetDone)) out.resetDone=v.resetDone;
    if(isDay(v.devStart)) out.devStart=v.devStart;
    out.architect=validateArchitect(v.architect);
    return out;
  }
  // Choix de l'IA architecte : identifiants seulement, revalidés à chaque séance par le moteur (la sécurité reste dans le code).
  function validateArchitect(a) {
    if(!a||typeof a!=='object'||Array.isArray(a)) return null;
    const text=(s,n)=>typeof s==='string'?s.trim().slice(0,n):'';
    const choices={};
    Object.entries(a.choices&&typeof a.choices==='object'?a.choices:{}).slice(0,80).forEach(([k,id])=>{if(/^\d[A-Z]\d{1,2}$/.test(k)&&typeof id==='string'&&/^[a-z0-9-]{2,40}$/.test(id))choices[k]=id;});
    const list=(v,n,m)=>(Array.isArray(v)?v:[]).map(x=>text(x,m)).filter(Boolean).slice(0,n);
    const priorities=(Array.isArray(a.priorities)?a.priorities:[]).filter(p=>p&&typeof p==='object').slice(0,3).map(p=>({label:text(p.label,60),why:text(p.why,300)})).filter(p=>p.label);
    const accents=(Array.isArray(a.accents)?a.accents:[]).filter(p=>p&&typeof p==='object').slice(0,8).map(p=>({phase:text(p.phase,30),text:text(p.text,240)})).filter(p=>p.phase&&p.text);
    return {date:isDay(a.date)?a.date:null,message:text(a.message,1200),priorities,accents,rules:list(a.rules,5,200),choices};
  }
  function blankCalendar() {return {moves:{},skips:{},forced:{}};}
  function validateCalendar(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return null;
    const moves={},skips={},forced={};
    Object.entries(v.moves&&typeof v.moves==='object'?v.moves:{}).slice(-12).forEach(([w,m])=>{if(!isDay(w)||!m||typeof m!=='object')return;const x={};Object.entries(m).slice(0,20).forEach(([k,d])=>{if(/^[A-Za-z0-9-]{1,20}$/.test(k)&&isDay(d))x[k]=d;});moves[w]=x;});
    Object.entries(v.skips&&typeof v.skips==='object'?v.skips:{}).slice(-12).forEach(([w,list])=>{if(isDay(w)&&Array.isArray(list))skips[w]=list.filter(k=>typeof k==='string'&&/^[A-Za-z0-9-]{1,20}$/.test(k)).slice(0,20);});
    // Déplacements forcés : choisis par l'utilisateur malgré une règle de charge (il a été prévenu).
    Object.entries(v.forced&&typeof v.forced==='object'?v.forced:{}).slice(-12).forEach(([w,list])=>{if(isDay(w)&&Array.isArray(list))forced[w]=list.filter(k=>typeof k==='string'&&/^[A-Za-z0-9-]{1,20}$/.test(k)).slice(0,20);});
    return {moves,skips,forced};
  }

  function build(state, now=today()) {
    const sp=validate(state.seasonPlan)||blank(), BP=BPL(), need=resetNeed(state), p=state.pathway&&state.pathway.status!=='archived'?state.pathway:null;
    const firstSession=(state.sessions||[]).map(s=>s.date).filter(isDay).sort()[0];
    const start=sp.start||(p&&p.startedAt)||(state.dossier&&isDay(state.dossier.date)&&state.dossier.date)||firstSession||now;
    const resetWeeks=sp.resetWeeks!==null?sp.resetWeeks:need.weeks;
    const phases=[];
    if(resetWeeks>0) phases.push({id:'reset',name:'Remise en route',weeks:resetWeeks>=4?'4 semaines':`${resetWeeks} à 4 semaines`,goal:'Préparer les tendons, retrouver le souffle et la mobilité, sans saut ni sprint.',rules:['Aucun saut ni sprint.','Marche, vélo, tendons, mobilité, haut du corps.','Douleur à 2/10 au maximum pendant l’effort, revenue à la normale le lendemain.'],why:need.reasons});
    (BP?BP.steps:[]).forEach(s=>phases.push({id:`step${s.id}`,step:s.id,name:s.name,weeks:`${s.minWeeks} semaines minimum, validées par tes tests`,goal:s.goal,rules:s.rules}));
    CYCLES.forEach(c=>phases.push({...c,weeks:'4 semaines, la dernière allégée',rules:['Semaine 4 allégée : volume réduit d’un tiers.','Tests de détente et de sprint en fin de cycle.']}));
    // Position actuelle.
    let current;
    const resetEnd=at(start,resetWeeks*7);
    if(resetWeeks>0&&!sp.resetDone&&diff(now,resetEnd)<0) current={id:'reset',week:Math.floor(diff(now,start)/7)+1,of:resetWeeks};
    else if(sp.devStart){
      const weeks=Math.max(0,Math.floor(diff(now,sp.devStart)/7)),inSeason=state.basketProfile&&state.basketProfile.season==='in';
      const c=inSeason?CYCLES[3]:CYCLES[Math.floor(weeks/4)%3];
      current={id:c.id,week:weeks%4+1,of:4};
    }
    else if(p&&BP) current={id:`step${p.step}`,week:BP.weekOf(p),of:BP.stepById(p.step).minWeeks};
    else current={id:resetWeeks>0?'reset':'step1',week:1,of:resetWeeks||3};
    const index=phases.findIndex(x=>x.id===current.id);
    // Tests toutes les 4 semaines depuis le début du plan.
    const elapsed=Math.max(0,diff(now,start)),nextTest=at(start,(Math.floor(elapsed/28)+1)*28);
    const minWeeks=phases.filter((x,i)=>i>=Math.max(0,index)&&x.step).reduce((n,x)=>n+(BP.stepById(x.step).minWeeks),0)+(current.id==='reset'?Math.max(0,resetWeeks-current.week+1):0);
    return {start,resetWeeks,need,phases,current:{...current,index,phase:phases[index]||null},nextTest,deload:current.week%4===0,
      returnRange:minWeeks?{min:minWeeks,max:Math.round(minWeeks*1.5)}:null};
  }

  // Séances de la semaine, avant placement. legs : heavy (jambes lourdes ou impacts), impact (appuis rapides), light.
  function legLoad(PT,ids) {
    const find=id=>PT&&PT.catalog.find(e=>e.id===id);
    return ids.map(find).filter(e=>e&&(['squat','hinge','jump'].includes(e.pattern)||e.impact||e.kind==='plyo')).length;
  }
  function items(state, built) {
    const BP=BPL(), PT=PTL(), out=[], p=state.pathway&&state.pathway.status!=='archived'?state.pathway:null;
    const a=state.dossier&&state.dossier.answers||{};
    const max=Number(a.maxMinutes)||Number(state.checkIn&&state.checkIn.minutes)||45;
    const cur=built.current.id;
    if(cur==='reset'){
      // Les jours du parcours, étape 1, sans saut : tendons, haut du corps, souffle.
      [['A','Tendons & jambes sans saut'],['B','Haut du corps & gainage'],['C','Souffle, chevilles & mobilité']].forEach(([d,label])=>out.push({key:`R${d}`,type:'reset',day:d,label:`Remise en route · ${label}`,legs:'light',minutes:Math.min(max,40),physical:true}));
    } else if(BP&&(p||cur.startsWith('dev'))){
      const step=BP.stepById(p?p.step:BP.steps.length);
      step.days.forEach(d=>out.push({key:`P${d.key}`,type:'pathway',day:d.key,label:`${step.short} · ${d.name}`,legs:legLoad(PT,d.slots.map(s=>s.ids[0]))>=2?'heavy':'light',minutes:Math.min(max,60),physical:true}));
    }
    const prog=state.program&&state.program.status==='active'?state.program:null;
    if(prog) for(let i=0;i<Math.min(3,Number(prog.daysPerWeek)||2);i++) out.push({key:`M${i+1}`,type:'muscu',label:'Muscu complémentaire',legs:'light',minutes:Math.min(max,Number(prog.minutes)||45),physical:true,extra:true});
    // Vivacité : à partir de l'étape 2 (ou en développement), une à deux fois par semaine.
    const step=p?p.step:cur.startsWith('dev')?5:0;
    if(step>=2) for(let i=0;i<(cur==='dev-quick'?2:1);i++) out.push({key:`V${i+1}`,type:'vivacite',label:'Vivacité · 15 min',legs:'impact',minutes:15});
    const SK=SKL(),sk=state.skills&&state.skills.program&&state.skills.program.status==='active'?state.skills.program:null;
    if(sk) for(let i=0;i<sk.perWeek;i++) out.push({key:`S${i+1}`,type:'skills',label:'Skills basket',legs:'light',minutes:Math.min(max,sk.minutes||45)});
    const hoop=a.hoop&&['daily','weekly'].includes(a.hoop);
    if(hoop||(state.shooting&&(state.shooting.sessions||[]).length)) out.push({key:'T1',type:'shooting',label:'Séance de tir',legs:'light',minutes:Math.min(max,40)});
    if(activePains(state).length) out.push({key:'C1',type:'care',label:'Soin de la zone sensible',legs:'light',minutes:10},{key:'C2',type:'care',label:'Soin de la zone sensible',legs:'light',minutes:10});
    return out;
  }

  // Jours libres du dossier ; sans réponse, tous les jours sauf le match.
  function freeDays(state) {
    const a=state.dossier&&state.dossier.answers||{};
    return Array.isArray(a.freeDays)&&a.freeDays.length?a.freeDays.filter(n=>Number.isInteger(n)&&n>=0&&n<7):[0,1,2,3,4,5,6];
  }
  function clubOf(state,date) {
    const p=state.basketProfile||{},wd=weekday(date);
    const ev=(state.events||[]).filter(e=>e.date===date&&['match','club'].includes(e.type));
    const match=ev.some(e=>e.type==='match')||p.matchDay===wd;
    const practice=!match&&(ev.some(e=>e.type==='club')||(p.practiceDays||[]).includes(wd));
    return {match,practice};
  }
  function target(state) {
    const a=state.dossier&&state.dossier.answers||{};
    return Math.max(1,Math.min(6,Number(a.sessions)||Number(state.profile&&state.profile.weeklyTarget)||3));
  }

  // Règles de placement (conventions courantes, voir COACH-SOURCES.md).
  function ruleBreak(item,date,placed,days) {
    const i=days.findIndex(d=>d.date===date),d=days[i];if(!d) return 'Jour hors de la semaine.';
    const prev=days[i-1]||{club:days.prevClub||{match:false,practice:false}},next=days[i+1]||{club:clubOfNext(days,i)};
    if(d.club.match&&item.type!=='care') return 'Jour de match : seulement l’échauffement.';
    if(item.legs==='heavy'&&next.club.match) return 'Veille de match : pas de jambes lourdes.';
    if(item.legs==='impact'&&next.club.match) return 'Veille de match : pas d’impacts répétés.';
    if(item.legs==='heavy'&&prev.club.match) return 'Lendemain de match : récupération, pas de jambes lourdes.';
    if(item.legs==='heavy'&&d.club.practice) return 'Entraînement au club ce jour-là : pas de jambes lourdes en plus.';
    if((item.type==='skills'||item.type==='shooting')&&(d.club.practice||d.club.match)) return 'Pas de skills ni de tir un jour de club : le basket y est déjà.';
    if(item.type==='shooting'&&placed.some(x=>x!==item&&x.type==='skills'&&x.date===date)) return 'Déjà une séance skills ce jour-là.';
    if(item.legs==='heavy'&&placed.some(x=>x!==item&&x.legs==='heavy'&&Math.abs(diff(x.date,date))<2)) return '48 heures minimum entre deux séances de jambes lourdes.';
    if(item.physical&&placed.some(x=>x!==item&&x.physical&&x.date===date)) return 'Une seule séance physique par jour.';
    if(item.type==='vivacite'&&placed.some(x=>x!==item&&x.legs==='heavy'&&x.date===date)) return 'Vivacité et jambes lourdes le même jour : trop de charge.';
    const total=placed.filter(x=>x!==item&&x.date===date&&x.type!=='care').reduce((n,x)=>n+x.minutes,0);
    if(item.type!=='care'&&total&&total+item.minutes>(days.maxMinutes||90)) return `Plus de ${days.maxMinutes||90} minutes ce jour-là : ta durée maximale est dépassée.`;
    if(d.before) return 'Avant le début de ton plan.';
    return null;
  }
  // Le lundi suivant : le match du dimanche n'est pas dans la semaine, mais le lendemain si.
  function clubOfNext(days,i){return days.nextClub&&i===days.length-1?days.nextClub:{match:false,practice:false};}

  function weekSchedule(state, monday=mondayOf(today()), now=today()) {
    monday=mondayOf(monday);
    const free=freeDays(state),cal=validateCalendar(state.calendar)||blankCalendar();
    const days=Array.from({length:7},(_,i)=>{const date=at(monday,i);return {date,weekday:i,label:DAYS[i],club:clubOf(state,date),free:free.includes(i),items:[]};});
    days.nextClub=clubOf(state,at(monday,7));days.prevClub=clubOf(state,at(monday,-1));
    const built=build(state,now),all=items(state,built),tgt=target(state),warnings=[];
    const ans=state.dossier&&state.dossier.answers||{};days.maxMinutes=Math.max(30,Math.round((Number(ans.maxMinutes)||75)*1.15));
    // Semaine du début : les jours d'avant ne comptent pas (rien de « manqué » avant d'avoir commencé).
    days.forEach(d=>{if(diff(d.date,built.start)<0){d.before=true;d.free=false;}});
    const startWeek=days.some(d=>d.before);
    const skips=cal.skips[monday]||[],moves=cal.moves[monday]||{},forced=cal.forced[monday]||[];
    // Séances physiques : autant que l'objectif hebdomadaire, le parcours d'abord.
    let physical=all.filter(x=>x.physical);
    if(physical.length>tgt){physical.filter(x=>x.extra).slice(0,physical.length-tgt).forEach(x=>x.dropped=true);physical=physical.filter(x=>!x.dropped);}
    if(physical.length>tgt) physical=physical.slice(0,tgt);
    const rest=all.filter(x=>!x.physical);
    const queue=[...physical.sort((a,b)=>(b.legs==='heavy')-(a.legs==='heavy')),...rest.filter(x=>x.type==='vivacite'),...rest.filter(x=>x.type==='skills'),...rest.filter(x=>x.type==='shooting'),...rest.filter(x=>x.type==='care')].filter(x=>!skips.includes(x.key));
    const placed=[];
    for(const item of queue){
      const moved=moves[item.key];
      const broken=moved?ruleBreak(item,moved,placed,days):null;
      if(moved&&!broken){placed.push({...item,date:moved,moved:true});continue;}
      // Choix de l'utilisateur : on le respecte, avec l'alerte affichée sur la séance.
      if(moved&&forced.includes(item.key)&&days.some(d=>d.date===moved)){placed.push({...item,date:moved,moved:true,forced:true,warning:broken});continue;}
      if(moved) warnings.push(`${item.label} : déplacement annulé (${ruleBreak(item,moved,placed,days)})`);
      // Meilleur jour : libre, sans règle enfreinte, le plus éloigné des autres séances du même type de charge.
      const options=days.filter(d=>(d.free||item.type==='care')&&!ruleBreak(item,d.date,placed,days)&&!(item.type==='care'&&placed.some(x=>x.date===d.date))).map(d=>{
        const same=placed.filter(x=>x.physical===item.physical||x.legs===item.legs);
        const gap=same.length?Math.min(...same.map(x=>Math.abs(diff(x.date,d.date)))):7;
        const load=placed.filter(x=>x.date===d.date).length;
        return {d,score:gap*2-load*3-(d.club.practice?2:0)+(item.type==='care'&&!placed.some(x=>x.date===d.date)?3:0)};
      }).sort((a,b)=>b.score-a.score||a.d.weekday-b.d.weekday);
      if(options.length) placed.push({...item,date:options[0].d.date});
      else if(item.type!=='care'&&!startWeek) warnings.push(`${item.label} : aucun jour libre compatible cette semaine${item.type==='vivacite'?' (fais-la juste après l’échauffement d’une séance du haut du corps)':''}.`);
    }
    // Statut : faite (séance correspondante enregistrée dans la semaine), manquée (jour passé), prévue.
    const shots=((state.shooting&&state.shooting.sessions)||[]).map(s=>({id:s.id,date:s.date,source:'shooting'}));
    const sessions=[...(state.sessions||[]),...shots].filter(s=>diff(s.date,monday)>=0&&diff(s.date,monday)<7);
    const used=new Set();
    const match=item=>sessions.find(s=>!used.has(s.id)&&(
      item.type==='pathway'&&s.source==='pathway'&&s.pathwayDay===item.day||item.type==='reset'&&['reset','pathway'].includes(s.source)||
      item.type==='muscu'&&s.source==='program-plan'||item.type==='skills'&&s.source==='skills'||
      item.type==='vivacite'&&s.source==='quick'&&/vivacit/i.test(s.title||'')||item.type==='shooting'&&s.source==='shooting'||item.type==='care'&&['rehab','quick'].includes(s.source)&&!/vivacit/i.test(s.title||'')));
    placed.sort((a,b)=>a.date.localeCompare(b.date)).forEach(item=>{
      const s=match(item);if(s)used.add(s.id);
      item.status=s?'done':diff(item.date,now)<0?'missed':'planned';item.doneDate=s?s.date:null;
      days.find(d=>d.date===item.date).items.push(item);
    });
    days.forEach(d=>{d.qi=!d.club.match;d.weighIn=d.weekday===0;});
    delete days.nextClub;delete days.prevClub;delete days.maxMinutes;
    return {monday,days,warnings,target:tgt,phase:built.current,skipped:all.filter(x=>skips.includes(x.key)).map(x=>x.label)};
  }

  // Contrôle d'un planning : utilisé par les tests et après chaque déplacement.
  function violations(state,schedule) {
    const out=[],placed=schedule.days.flatMap(d=>d.items);
    const days=schedule.days.map(d=>({...d}));days.nextClub=clubOf(state,at(schedule.monday,7));days.prevClub=clubOf(state,at(schedule.monday,-1));days.maxMinutes=Math.max(30,Math.round((Number((state.dossier&&state.dossier.answers||{}).maxMinutes)||75)*1.15));
    placed.filter(item=>!item.forced).forEach(item=>{const r=ruleBreak(item,item.date,placed,days);if(r)out.push({key:item.key,date:item.date,rule:r});});
    if(placed.filter(x=>x.physical).length>schedule.target) out.push({key:'*',rule:'Plus de séances physiques que l’objectif de la semaine.'});
    return out;
  }

  function reschedule(state, monday, itemKey, toDate, opts={}) {
    monday=mondayOf(monday);
    const before=weekSchedule(state,monday),item=before.days.flatMap(d=>d.items).find(x=>x.key===itemKey);
    if(!item) return {ok:false,why:'Séance introuvable cette semaine.'};
    if(diff(toDate,monday)<0||diff(toDate,monday)>6) return {ok:false,why:'Choisis un jour de cette semaine.'};
    const others=before.days.flatMap(d=>d.items).filter(x=>x.key!==itemKey);
    const days=before.days.map(d=>({...d}));days.nextClub=clubOf(state,at(monday,7));days.prevClub=clubOf(state,at(monday,-1));days.maxMinutes=Math.max(30,Math.round((Number((state.dossier&&state.dossier.answers||{}).maxMinutes)||75)*1.15));
    const why=ruleBreak(item,toDate,others,days);
    if(why&&!opts.force) return {ok:false,why,canForce:true};
    const cal=validateCalendar(state.calendar)||blankCalendar();
    const list=(cal.forced[monday]||[]).filter(k=>k!==itemKey);
    const calendar={...cal,moves:{...cal.moves,[monday]:{...(cal.moves[monday]||{}),[itemKey]:toDate}},forced:{...cal.forced,[monday]:why?[...list,itemKey]:list}};
    return {ok:true,calendar,forced:!!why,why:why?`${item.label} placée au ${DAYS[weekday(toDate)].toLowerCase()}, comme tu l’as choisi. Attention : ${why.charAt(0).toLowerCase()+why.slice(1)}`:`${item.label} déplacée au ${DAYS[weekday(toDate)].toLowerCase()} : règles de charge respectées.`};
  }
  // Règle cassée si la séance allait ce jour-là (null = jour compatible) : sert au choix du jour dans le calendrier.
  function ruleBreakAt(state, monday, itemKey, toDate) {
    monday=mondayOf(monday);
    const sch=weekSchedule(state,monday),item=sch.days.flatMap(d=>d.items).find(x=>x.key===itemKey);
    if(!item) return null;
    const others=sch.days.flatMap(d=>d.items).filter(x=>x.key!==itemKey);
    const days=sch.days.map(d=>({...d}));days.nextClub=clubOf(state,at(monday,7));days.prevClub=clubOf(state,at(monday,-1));days.maxMinutes=Math.max(30,Math.round((Number((state.dossier&&state.dossier.answers||{}).maxMinutes)||75)*1.15));
    return ruleBreak(item,toDate,others,days);
  }
  // Retour au placement automatique pour une séance déplacée.
  function unmove(state, monday, itemKey) {
    monday=mondayOf(monday);
    const cal=validateCalendar(state.calendar)||blankCalendar(),m={...(cal.moves[monday]||{})};delete m[itemKey];
    return {...cal,moves:{...cal.moves,[monday]:m},forced:{...cal.forced,[monday]:(cal.forced[monday]||[]).filter(k=>k!==itemKey)}};
  }
  // Jour manqué ou « Je ne peux pas aujourd'hui » : prochain jour libre compatible de la semaine, sinon report à la semaine suivante.
  function missed(state, monday, itemKey, now=today()) {
    monday=mondayOf(monday);
    const sch=weekSchedule(state,monday,now),item=sch.days.flatMap(d=>d.items).find(x=>x.key===itemKey);
    if(!item) return {ok:false,why:'Séance introuvable cette semaine.'};
    for(const d of sch.days.filter(d=>d.free&&diff(d.date,now)>0)){
      const r=reschedule(state,monday,itemKey,d.date);
      if(r.ok) return {...r,date:d.date,why:`${item.label} décalée au ${d.label.toLowerCase()} : c’est le premier jour libre qui respecte les règles.`};
    }
    const cal=validateCalendar(state.calendar)||blankCalendar();
    return {ok:true,skipped:true,calendar:{...cal,skips:{...cal.skips,[monday]:[...new Set([...(cal.skips[monday]||[]),itemKey])]}},
      why:`${item.label} : aucun jour compatible d’ici dimanche. Elle saute cette semaine ; le plan reprend lundi sans rattrapage forcé.`};
  }

  // Export .ics des prochaines semaines (rappels dans l'agenda du téléphone).
  function ics(state, from=today(), weeks=4) {
    const esc=s=>String(s).replace(/[\\;,]/g,m=>'\\'+m).replace(/\n/g,'\\n');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Rehaab//Plan//FR','CALSCALE:GREGORIAN'];
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
    for(let w=0;w<weeks;w++){
      const sch=weekSchedule(state,at(mondayOf(from),w*7),from);
      sch.days.forEach(d=>d.items.filter(x=>diff(d.date,from)>=0).forEach(x=>{
        const day=d.date.replace(/-/g,''),end=at(d.date,1).replace(/-/g,'');
        lines.push('BEGIN:VEVENT',`UID:${day}-${x.key}@rehaab`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${day}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${esc(`Rehaab · ${x.label}`)}`,`DESCRIPTION:${esc(`${x.minutes} min environ. Ouvre Rehaab pour lancer la séance.`)}`,'END:VEVENT');
      }));
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n')+'\r\n';
  }

  // Bilan de la semaine écoulée.
  function review(state, monday=at(mondayOf(today()),-7)) {
    monday=mondayOf(monday);
    const started=build(state,at(monday,7)).start;
    if(diff(at(monday,6),started)<0) return {monday,end:at(monday,6),planned:0,done:0,missed:[],tests:[],qi:{answered:0,correct:0},weight:null,shooting:null,pains:[],suggestions:[],before:true};
    const end=at(monday,6),inWeek=d=>typeof d==='string'&&diff(d,monday)>=0&&diff(d,end)<=0;
    const sch=weekSchedule(state,monday,at(monday,7)),list=sch.days.flatMap(d=>d.items).filter(x=>x.type!=='care');
    const done=list.filter(x=>x.status==='done'),missedList=list.filter(x=>x.status==='missed');
    const symptoms=(state.symptoms||[]).filter(s=>s&&(inWeek(s.date)||inWeek(s.updatedAt&&String(s.updatedAt).slice(0,10))));
    const weights=(state.measurements||[]).filter(m=>m.weight!==''&&m.weight!=null).sort((a,b)=>a.date.localeCompare(b.date));
    const before=weights.filter(m=>diff(m.date,monday)<0).pop(),last=weights.filter(m=>inWeek(m.date)).pop();
    const qi=((state.qi&&state.qi.answers)||[]).filter(a=>inWeek(a.date));
    const tests=Object.entries((state.pathway&&state.pathway.tests)||{}).flatMap(([id,l])=>(l||[]).filter(r=>inWeek(r.date)).map(r=>({id,...r})));
    const shots=(state.sessions||[]).filter(s=>inWeek(s.date)).flatMap(s=>(s.exercises||[]).filter(e=>e.measure==='shots').flatMap(e=>((s.entries||{})[e.id]||[]).filter(r=>r.done)));
    const SH=SHL(),own=SH&&state.shooting?(state.shooting.sessions||[]).filter(s=>inWeek(s.date)).map(s=>SH.totals(s)):[];
    const made=shots.reduce((n,r)=>n+(Number(r.made)||0),0)+own.reduce((n,t)=>n+t.made,0),attempts=shots.reduce((n,r)=>n+(Number(r.attempts)||0),0)+own.reduce((n,t)=>n+t.attempts,0);
    const pains=activePains(state);
    const suggestions=[];
    if(missedList.length>=2) suggestions.push({id:'lighter',label:'Semaine prochaine : une séance de moins',why:`${missedList.length} séances manquées : mieux vaut un plan tenu qu’un plan idéal.`});
    if(pains.some(p=>p.severity>=4)) suggestions.push({id:'care-first',label:'Soin en tête de chaque séance',why:'Une douleur à 4/10 ou plus est active : le soin passe avant la charge.'});
    if(done.length>=list.length&&list.length&&!pains.length) suggestions.push({id:'keep',label:'Garder le même plan',why:'Tout a été fait sans douleur : on avance comme prévu.'});
    return {monday,end,planned:list.length,done:done.length,missed:missedList.map(x=>x.label),tests,qi:{answered:qi.length,correct:qi.filter(a=>a.correct).length},
      weight:last?{value:Number(last.weight),change:before?Math.round((Number(last.weight)-Number(before.weight))*10)/10:null}:null,
      shooting:attempts?{made,attempts,pct:Math.round(made/attempts*100)}:null,pains:symptoms.length?pains:[],suggestions};
  }
  function applySuggestion(state,id) {
    if(id==='lighter'){const t=target(state);return {...state,profile:{...state.profile,weeklyTarget:Math.max(1,t-1)},dossier:state.dossier&&state.dossier.answers&&state.dossier.answers.sessions?{...state.dossier,answers:{...state.dossier.answers,sessions:String(Math.max(2,t-1))}}:state.dossier};}
    return state;
  }

  return {DAYS,CYCLES,mondayOf,weekday,at,clubOf,freeDays,ruleBreakAt,unmove,resetNeed,blank,validate,validateArchitect,blankCalendar,validateCalendar,build,items,weekSchedule,violations,reschedule,missed,ics,review,applySuggestion,target};
});
