/* Rehaab : poids de forme (lot 17). Pur, sans DOM.
   Poids actuel face au poids de jeu déclaré dans le dossier, moyenne sur 7 jours, tendance, rapport détente / poids.
   Aucune cible calorique. Garde-fous repris de l'ancien module nutrition (385d5df^) : mineur, suivi médical ou trouble
   alimentaire déclaré, poids déjà bas pour la taille → pas d'objectif de perte affiché.
   Repères sourcés : protéines 1,4 à 2,0 g/kg/j (ISSN, Jäger et al. 2017, PubMed 28642676) ; stratégie alimentaire autour
   de l'entraînement (ACSM / AND / DC, Thomas et al. 2016, PubMed 26891166). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BodyWeight = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = () => key(new Date());
  const at = (date, shift=0) => {const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+shift);return key(d);};
  const diff = (a,b) => Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);
  const round1 = n => Math.round(n*10)/10;
  const SOURCES = [
    {label:'ISSN 2017 · protéines et exercice (1,4 à 2,0 g/kg/j)',url:'https://pubmed.ncbi.nlm.nih.gov/28642676/'},
    {label:'ACSM, AND, DC 2016 · nutrition et performance sportive',url:'https://pubmed.ncbi.nlm.nih.gov/26891166/'},
    {label:'Messier et al. 2005 · perte de poids et charge sur le genou',url:'https://pubmed.ncbi.nlm.nih.gov/15986358/'}
  ];

  function blankPrefs() {return {followUp:false};}
  function validatePrefs(v) {return v&&typeof v==='object'&&!Array.isArray(v)?{followUp:v.followUp===true}:null;}

  // Pesées (profil + mesures), triées.
  function weighIns(state) {
    return (state.measurements||[]).filter(m=>m&&m.weight!==''&&m.weight!==null&&Number(m.weight)>0&&typeof m.date==='string').map(m=>({date:m.date,weight:Number(m.weight)})).sort((a,b)=>a.date.localeCompare(b.date));
  }
  // Moyenne des pesées des 7 derniers jours avant une date (incluse).
  function avg7(list,date) {
    const w=list.filter(m=>diff(date,m.date)>=0&&diff(date,m.date)<7);
    return w.length?round1(w.reduce((n,m)=>n+m.weight,0)/w.length):null;
  }
  const answers = state => (state.dossier&&state.dossier.answers)||{};
  function playWeight(state) {const a=answers(state);return Number(a.playWeight)>0?Number(a.playWeight):null;}
  function targetWeight(state) {const a=answers(state);return Number(a.targetWeight)>0?Number(a.targetWeight):null;}

  // Dernière détente mesurée (bilan athlétique ou parcours), en cm.
  function lastJump(state) {
    const lists=[(state.athletic&&state.athletic.tests&&state.athletic.tests.vertical)||[],(state.pathway&&state.pathway.tests&&state.pathway.tests.vertical)||[]].flat()
      .filter(r=>r&&Number(r.value)>0&&typeof r.date==='string').sort((a,b)=>a.date.localeCompare(b.date));
    return lists.length?{value:Number(lists[lists.length-1].value),date:lists[lists.length-1].date,first:lists[0]}:null;
  }

  function guard(state) {
    const p=state.profile||{},age=Number(p.age),h=Number(p.height)/100,list=weighIns(state),w=list.length?list[list.length-1].weight:Number(p.weight);
    const bmi=h>0&&w>0?w/(h*h):null,blocks=[],notes=[];
    if(age>0&&age<18) blocks.push('Les repères de poids de cette app s’adressent à des adultes. Pour un mineur, l’accompagnement passe par un professionnel de santé.');
    if(state.weightPrefs&&state.weightPrefs.followUp) blocks.push('Suivi médical ou alimentaire déclaré : l’app n’affiche ni écart ni objectif de poids. Ton professionnel de santé reste la bonne référence.');
    if(bmi!==null&&bmi<18.5) blocks.push('Le poids est déjà bas pour ta taille : aucun objectif de perte n’est proposé. Un avis professionnel est utile.');
    return {blocks,notes,bmi:bmi?round1(bmi):null};
  }

  function summary(state,now=today()) {
    const list=weighIns(state),last=list[list.length-1]||null,g=guard(state);
    const avg=last?avg7(list,now)??last.weight:null;
    const four=avg7(list,at(now,-28));
    const trend=avg!==null&&four!==null?round1((avg-four)/4):null; // kg par semaine sur 4 semaines
    const pw=playWeight(state),gap=avg!==null&&pw?round1(avg-pw):null;
    const jump=lastJump(state);
    const ratio=jump&&avg?Math.round(jump.value/avg*100)/100:null;
    const protein=avg?{min:Math.round(avg*1.4),max:Math.round(avg*2.0)}:null;
    return {last,avg,trend,playWeight:pw,target:targetWeight(state),gap:g.blocks.length?null:gap,jump,ratio,protein,guard:g,count:list.length,
      weighInDue:!last||diff(now,last.date)>=7};
  }
  // Prudence du plan : nettement au-dessus du poids de jeu (≥ 5 kg) et rien ne l'interdit.
  function cautious(state,now=today()) {const s=summary(state,now);return s.gap!==null&&s.gap>=5;}

  // Série pour la courbe : pesées des 12 dernières semaines et moyenne glissante sur 7 jours à chaque pesée.
  function series(state,weeks=12,now=today()) {
    const list=weighIns(state),from=at(now,-weeks*7);
    return list.filter(m=>diff(m.date,from)>=0&&diff(now,m.date)>=0).map(m=>({date:m.date,weight:m.weight,avg:avg7(list,m.date)}));
  }
  function addWeighIn(state,weight,now=today()) {
    const w=Number(weight);if(!(w>=30&&w<=350)) return {error:'Indique un poids entre 30 et 350 kg.'};
    const others=(state.measurements||[]).filter(m=>m.date!==now||m.weight==='');
    const id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now().toString(36)}`;
    return {state:{...state,profile:{...state.profile,weight:String(w)},measurements:[...others,{id,date:now,weight:w,waist:''}]}};
  }
  return {SOURCES,blankPrefs,validatePrefs,weighIns,avg7,playWeight,targetWeight,lastJump,guard,summary,cautious,series,addWeighIn};
});
