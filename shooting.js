/* Rehaab : séances de tir (lot 17). Pur, sans DOM.
   Créer une séance (routines ou exercices au choix), compter en direct réussis / ratés, suivre le pourcentage par exercice,
   par zone (carte de tir), par séance et par semaine, le volume, les records et la comparaison avec la semaine précédente.
   Les résultats alimentent aussi le palier de tir des skills (BasketSkills.record). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Shooting = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = () => key(new Date());
  const at = (date, shift=0) => {const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+shift);return key(d);};
  const diff = (a,b) => Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);
  const mondayOf = date => at(date,-((new Date(`${date}T12:00:00`).getDay()+6)%7));
  const uid = () => typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const pct = (made,attempts) => attempts?Math.round(made/attempts*100):null;

  // Zones de la carte de tir (demi-terrain, panier en haut ; coordonnées d'un viewBox 300 × 280).
  const ZONES = {
    paint:{label:'Raquette',x:150,y:70},ft:{label:'Lancer franc',x:150,y:130},
    'left-elbow':{label:'Coude gauche',x:105,y:125},'right-elbow':{label:'Coude droit',x:195,y:125},
    'left-mid':{label:'Mi-distance gauche',x:70,y:70},'right-mid':{label:'Mi-distance droite',x:230,y:70},
    'left-corner':{label:'Corner gauche',x:24,y:40},'right-corner':{label:'Corner droit',x:276,y:40},
    'left-wing':{label:'Aile gauche',x:52,y:170},'right-wing':{label:'Aile droite',x:248,y:170},'top':{label:'Axe à 3 points',x:150,y:225}
  };
  const FIVE_MID=['left-mid','left-elbow','ft','right-elbow','right-mid'],FIVE_3=['left-corner','left-wing','top','right-wing','right-corner'];
  // Exercices de tir : ceux de BasketSkills (fiches, démos) avec leurs zones, plus des formats de comptage.
  const DRILLS = {
    'sk-ft':{label:'Lancers francs',zones:['ft'],attempts:10},
    'sk-form':{label:'Tir de forme près du cercle',zones:['paint'],attempts:10},
    'sk-one-motion':{label:'Tir en un seul mouvement',zones:['paint','ft'],attempts:10},
    'sk-catch-mid':{label:'Catch & shoot mi-distance',zones:FIVE_MID,attempts:5},
    'sk-catch-3':{label:'Catch & shoot à 3 points',zones:FIVE_3,attempts:5},
    'sk-pullup1':{label:'Pull-up après un dribble',zones:['left-elbow','right-elbow'],attempts:5},
    'sk-fake-pullup':{label:'Feinte, un dribble, pull-up',zones:['left-elbow','right-elbow','ft'],attempts:5},
    'sk-hang-pullup':{label:'Pull-up après dribble suspendu',zones:['left-elbow','right-elbow'],attempts:5},
    'sk-relocate':{label:'Tir en sortie de déplacement',zones:['left-wing','right-wing','left-corner','right-corner'],attempts:5},
    'sk-feet-into-shot':{label:'Appuis vers le tir',zones:['left-mid','right-mid'],attempts:5},
    'sk-stepback':{label:'Step-back à 3 points',zones:['left-wing','top','right-wing'],attempts:5},
    'sk-sidestep':{label:'Side-step à 3 points',zones:['left-wing','right-wing'],attempts:5},
    'sk-fadeaway':{label:'Fadeaway',zones:['left-mid','right-mid'],attempts:5},
    'sk-ft-tired':{label:'Lancers francs fatigué',zones:['ft'],attempts:10},
    'sk-1min':{label:'Une minute de tir',zones:FIVE_MID,attempts:10}
  };
  const ROUTINES = [
    {id:'five-spots',label:'5 spots mi-distance + lancers',why:'La routine de base : même geste partout, puis 10 lancers.',drills:[['sk-form','paint'],...FIVE_MID.map(z=>['sk-catch-mid',z]),['sk-ft','ft']]},
    {id:'three',label:'Tour du monde à 3 points',why:'Cinq positions derrière la ligne, du corner au corner.',drills:FIVE_3.map(z=>['sk-catch-3',z])},
    {id:'pullups',label:'Pull-ups du meneur',why:'Tir après dribble des deux côtés, puis sous fatigue.',drills:[['sk-pullup1','left-elbow'],['sk-pullup1','right-elbow'],['sk-hang-pullup','left-elbow'],['sk-hang-pullup','right-elbow'],['sk-ft-tired','ft']]},
    {id:'ft50',label:'50 lancers francs',why:'La routine qui ne bouge jamais, compté sur 50.',drills:[['sk-ft','ft'],['sk-ft','ft'],['sk-ft','ft'],['sk-ft','ft'],['sk-ft','ft']]}
  ];
  const drillLabel = (id,custom=[]) => (DRILLS[id]||custom.find(c=>c.id===id)||{label:id}).label;

  function blank() {return {sessions:[],custom:[],draft:null};}
  function validItem(i) {return i&&typeof i.drill==='string'&&i.drill.length<60&&ZONES[i.zone]&&Number.isInteger(i.made)&&Number.isInteger(i.attempts)&&i.made>=0&&i.attempts>=i.made&&i.attempts<=500&&Number.isInteger(i.target)&&i.target>=1&&i.target<=100;}
  function validSession(s) {return s&&typeof s.id==='string'&&typeof s.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.date)&&Array.isArray(s.items)&&s.items.length<=40&&s.items.every(validItem);}
  function validate(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return null;
    const custom=(Array.isArray(v.custom)?v.custom:[]).filter(c=>c&&typeof c.id==='string'&&c.id.startsWith('custom-')&&typeof c.label==='string'&&c.label.trim()&&Array.isArray(c.zones)&&c.zones.every(z=>ZONES[z])).slice(0,30).map(c=>({id:c.id,label:c.label.trim().slice(0,60),zones:c.zones.slice(0,5),attempts:Math.min(50,Math.max(1,Number(c.attempts)||5))}));
    const sessions=(Array.isArray(v.sessions)?v.sessions:[]).filter(validSession).slice(-400).map(s=>({id:s.id,date:s.date,title:typeof s.title==='string'?s.title.slice(0,80):'Séance de tir',items:s.items.map(i=>({drill:i.drill,zone:i.zone,made:i.made,attempts:i.attempts,target:i.target,best:Number.isInteger(i.best)?i.best:0,log:Array.isArray(i.log)?i.log.filter(x=>x===0||x===1).slice(-500):[]}))}));
    const d=v.draft;
    const draft=d&&validSession(d)&&Number.isInteger(d.cursor)&&d.cursor>=0&&d.cursor<d.items.length?{id:d.id,date:d.date,title:typeof d.title==='string'?d.title.slice(0,80):'Séance de tir',cursor:d.cursor,items:d.items.map(i=>({...i,log:Array.isArray(i.log)?i.log.filter(x=>x===0||x===1).slice(-500):[],best:Number.isInteger(i.best)?i.best:0}))}:null;
    return {sessions,custom,draft};
  }

  // Nouvelle séance : liste de [exercice, zone], objectif de tirs par ligne.
  function create(pairs,{title='Séance de tir',custom=[],now=today()}={}) {
    const items=pairs.filter(([d,z])=>(DRILLS[d]||custom.some(c=>c.id===d))&&ZONES[z]).slice(0,40)
      .map(([drill,zone,target])=>({drill,zone,made:0,attempts:0,target:Math.min(100,Math.max(1,Number(target)||(DRILLS[drill]||custom.find(c=>c.id===drill)||{}).attempts||5)),best:0,log:[]}));
    if(!items.length) return {error:'Choisis au moins un exercice.'};
    return {id:uid(),date:now,title,cursor:0,items};
  }
  function fromRoutine(id,opts) {const r=ROUTINES.find(x=>x.id===id);return r?create(r.drills,{...opts,title:r.label}):{error:'Routine introuvable.'};}
  const streakOf = log => {let n=0;for(let i=log.length-1;i>=0&&log[i]===1;i--)n++;return n;};
  function shot(draft,made) {
    const items=draft.items.map((it,i)=>{if(i!==draft.cursor)return it;const log=[...it.log,made?1:0];return {...it,log,attempts:it.attempts+1,made:it.made+(made?1:0),best:Math.max(it.best,streakOf(log))};});
    const cur=items[draft.cursor];
    // Objectif atteint : la ligne suivante s'ouvre d'elle-même.
    const cursor=cur.attempts>=cur.target&&draft.cursor<items.length-1?draft.cursor+1:draft.cursor;
    return {...draft,items,cursor};
  }
  function undo(draft) {
    let c=draft.cursor;if(!draft.items[c].log.length&&c>0)c--;
    const it=draft.items[c];if(!it.log.length) return draft;
    const log=it.log.slice(0,-1),last=it.log[it.log.length-1];
    const best=log.reduce((m,_,i)=>Math.max(m,streakOf(log.slice(0,i+1))),0);
    return {...draft,cursor:c,items:draft.items.map((x,i)=>i===c?{...x,log,attempts:x.attempts-1,made:x.made-last,best}:x)};
  }
  function totals(s) {const made=s.items.reduce((n,i)=>n+i.made,0),attempts=s.items.reduce((n,i)=>n+i.attempts,0);return {made,attempts,pct:pct(made,attempts),streak:Math.max(0,...s.items.map(i=>i.best))};}
  function finish(sh,draft) {
    const items=draft.items.filter(i=>i.attempts>0);
    if(!items.length) return {shooting:{...sh,draft:null},session:null};
    const session={id:draft.id,date:draft.date,title:draft.title,items};
    return {shooting:{...sh,draft:null,sessions:[...sh.sessions,session].slice(-400)},session};
  }

  // Semaines (lundi) : réussis, tentés, %.
  function weekly(sh,weeks=8,now=today()) {
    const m=mondayOf(now);
    return Array.from({length:weeks},(_,i)=>{const monday=at(m,-(weeks-1-i)*7);const list=(sh.sessions||[]).filter(s=>diff(s.date,monday)>=0&&diff(s.date,monday)<7);const made=list.reduce((n,s)=>n+totals(s).made,0),attempts=list.reduce((n,s)=>n+totals(s).attempts,0);return {monday,made,attempts,pct:pct(made,attempts),sessions:list.length};});
  }
  function group(sh,by) {
    const out={};(sh.sessions||[]).forEach(s=>s.items.forEach(i=>{const k=i[by];out[k]=out[k]||{key:k,made:0,attempts:0};out[k].made+=i.made;out[k].attempts+=i.attempts;}));
    return Object.values(out).map(x=>({...x,pct:pct(x.made,x.attempts)})).sort((a,b)=>b.attempts-a.attempts);
  }
  const byDrill = sh => group(sh,'drill');
  const byZone = sh => group(sh,'zone');
  // Records : meilleure séance (au moins 20 tirs), meilleure série, meilleurs lancers francs sur une ligne d'au moins 10.
  function records(sh) {
    const s=(sh.sessions||[]).map(x=>({...x,t:totals(x)}));
    const best=s.filter(x=>x.t.attempts>=20).sort((a,b)=>b.t.pct-a.t.pct||b.t.attempts-a.t.attempts)[0]||null;
    const streak=Math.max(0,...s.map(x=>x.t.streak));
    const ft=s.flatMap(x=>x.items.filter(i=>i.drill.startsWith('sk-ft')&&i.attempts>=10).map(i=>({...i,date:x.date}))).sort((a,b)=>pct(b.made,b.attempts)-pct(a.made,a.attempts))[0]||null;
    return {bestSession:best?{date:best.date,pct:best.t.pct,made:best.t.made,attempts:best.t.attempts}:null,streak,ft:ft?{date:ft.date,made:ft.made,attempts:ft.attempts,pct:pct(ft.made,ft.attempts)}:null};
  }
  function compare(sh,now=today()) {const [prev,cur]=weekly(sh,2,now);return {prev,cur,delta:prev.pct!==null&&cur.pct!==null?cur.pct-prev.pct:null};}
  // Pour le palier de tir des skills : une séance au format attendu par BasketSkills.record.
  function toSkillSession(session) {
    const exercises=[],entries={};
    session.items.forEach((i,n)=>{const id=`${i.drill}-${n}`;exercises.push({id,skillArea:'shoot',measure:'shots'});entries[id]=[{done:true,made:i.made,attempts:i.attempts}];});
    return {id:session.id,date:session.date,exercises,entries};
  }
  function summary(sh,now=today()) {
    if(!sh||!(sh.sessions||[]).length) return null;
    const c=compare(sh,now);return `Tir : ${c.cur.attempts?`${c.cur.made}/${c.cur.attempts} cette semaine (${c.cur.pct} %)`:'aucun tir cette semaine'}${c.prev.attempts?`, ${c.prev.pct} % la semaine d’avant`:''}.`;
  }
  // Niveau de tir pour la carte joueur : 4 dernières semaines, au moins 50 tirs. Repères d'entraînement (tous tirs confondus), pas une norme.
  function level(sh,now=today()) {
    const w=sh?weekly(sh,4,now):[],made=w.reduce((n,x)=>n+x.made,0),attempts=w.reduce((n,x)=>n+x.attempts,0),p=pct(made,attempts);
    if(attempts<50) return {level:null,pct:p,attempts,trend:null};
    const c=compare(sh,now);
    return {level:p<40?0:p<55?1:2,pct:p,attempts,trend:c.delta===null?null:c.delta>=3?'up':c.delta<=-5?'down':null};
  }
  return {ZONES,DRILLS,ROUTINES,drillLabel,pct,blank,validate,create,fromRoutine,shot,undo,totals,finish,weekly,byDrill,byZone,records,compare,toSkillSession,summary,level,mondayOf};
});
