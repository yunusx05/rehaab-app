/* Rehaab : questionnaire « Mon jeu ». Ressentis terrain, forces, faiblesses, rythme du club.
   Les réponses règlent les priorités du parcours, l'accent du programme muscu et la charge de la semaine. Pur, sans DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BasketProfile = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const today = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

  // Ce qu'on vit sur le terrain → qualités physiques (mêmes identifiants que player-profile.js), et accent muscu.
  // accent : le type de travail en salle qui sert cette situation, sans refaire ce que le parcours fait déjà (sauts, sprints).
  const skills = {
    firststep:{label:'Premier pas en un contre un',qualities:{firststep:3,speed:1},accent:'hinge'},
    finish:{label:'Finir au contact près du cercle',qualities:{contact:3,core:2,antirot:1},accent:'antirot'},
    shootlegs:{label:'Tir quand les jambes sont lourdes',qualities:{endurance:2,unilateral:2},accent:'engine'},
    lateral:{label:'Défense en déplacement latéral',qualities:{lateral:3,hip:2,decel:1},accent:'hip'},
    rebound:{label:'Rebond, sauts répétés',qualities:{vertical:2,reactive:2,strength:1},accent:'hinge'},
    transition:{label:'Vitesse en transition',qualities:{speed:3,endurance:1},accent:'engine'},
    contact:{label:'Tenir au contact (écran, poste, box-out)',qualities:{contact:3,strength:2},accent:'upper'},
    engine:{label:'Souffle en fin de match',qualities:{endurance:3},accent:'engine'},
    handle:{label:'Dribble sous pression',qualities:{core:2,antirot:2,shoulder:1},accent:'grip'},
    brake:{label:'Freiner, changer de direction',qualities:{decel:3,ankle:1,unilateral:1},accent:'unilateral'}
  };
  const feelings = [
    ['legs','Jambes lourdes le lendemain'],['back','Le dos tire'],['knees','Genoux sensibles'],['ankles','Chevilles fragiles'],
    ['breath','À bout de souffle'],['shoulders','Épaules fatiguées'],['fine','Rien de spécial']
  ];
  const seasons = [['in','En saison (matchs)'],['pre','Présaison'],['off','Hors saison']];
  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  // Objectif en salle : ce que la musculation doit apporter au joueur.
  const goals = [
    ['durability','Tenir la saison sans me blesser'],['power','Plus d’explosivité'],
    ['mass','Prendre du gabarit pour le contact'],['lean','M’affûter, être plus léger']
  ];

  function blank() {return {strengths:[],weaknesses:[],feelings:[],season:'in',practiceDays:[],matchDay:null,goal:'durability',date:null};}

  function validate(value) {
    if(!value||typeof value!=='object'||Array.isArray(value)) return null;
    const keep=(list,ok,max)=>(Array.isArray(list)?[...new Set(list)]:[]).filter(ok).slice(0,max);
    const day=n=>Number.isInteger(n)&&n>=0&&n<=6;
    const out={
      strengths:keep(value.strengths,k=>!!skills[k],3),
      weaknesses:keep(value.weaknesses,k=>!!skills[k],3),
      feelings:keep(value.feelings,k=>feelings.some(f=>f[0]===k),7),
      season:seasons.some(s=>s[0]===value.season)?value.season:'in',
      practiceDays:keep(value.practiceDays,day,7).sort(),
      matchDay:day(value.matchDay)?value.matchDay:null,
      goal:goals.some(g=>g[0]===value.goal)?value.goal:'durability',
      date:typeof value.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.date)?value.date:null
    };
    // Une même situation ne peut pas être à la fois une force et une faiblesse.
    out.strengths=out.strengths.filter(k=>!out.weaknesses.includes(k));
    if(out.matchDay!==null) out.practiceDays=out.practiceDays.filter(d=>d!==out.matchDay);
    return out;
  }

  function complete(p) {return !!(p&&p.date&&p.weaknesses.length);}

  // Poids de qualités à ajouter aux priorités du joueur. Une faiblesse pèse ; une force retire un peu (on l'entretient).
  function weights(p) {
    const w={};
    if(!p) return w;
    p.weaknesses.forEach((k,i)=>Object.entries(skills[k].qualities).forEach(([q,v])=>w[q]=(w[q]||0)+v*(i===0?1.5:1)));
    p.strengths.forEach(k=>Object.entries(skills[k].qualities).forEach(([q,v])=>w[q]=(w[q]||0)-v*0.5));
    (p.feelings||[]).forEach(f=>{
      if(f==='ankles') w.ankle=(w.ankle||0)+2;
      if(f==='knees') {w.decel=(w.decel||0)+1;w.hip=(w.hip||0)+1;}
      if(f==='back') {w.core=(w.core||0)+2;w.antirot=(w.antirot||0)+1;}
      if(f==='breath') w.endurance=(w.endurance||0)+2;
      if(f==='shoulders') w.shoulder=(w.shoulder||0)+2;
    });
    return w;
  }

  // Accents du programme muscu, par ordre d'importance (faiblesses d'abord, puis ressentis).
  function accents(p) {
    if(!p) return [];
    const list=p.weaknesses.map(k=>skills[k].accent);
    if((p.feelings||[]).includes('back')) list.push('antirot');
    if((p.feelings||[]).includes('shoulders')) list.push('shoulder');
    if(p.goal==='mass') list.push('upper');
    return [...new Set(list)];
  }

  // Phrase de synthèse affichée et envoyée au coach.
  function summary(p) {
    if(!complete(p)) return null;
    const label=k=>skills[k].label.toLowerCase();
    const parts=[`Faiblesses : ${p.weaknesses.map(label).join(', ')}`];
    if(p.strengths.length) parts.push(`forces : ${p.strengths.map(label).join(', ')}`);
    const feel=(p.feelings||[]).filter(f=>f!=='fine').map(f=>feelings.find(x=>x[0]===f)[1].toLowerCase());
    if(feel.length) parts.push(`après un match : ${feel.join(', ')}`);
    parts.push(seasons.find(s=>s[0]===p.season)[1].toLowerCase());
    if(p.practiceDays.length||p.matchDay!==null) parts.push(`club : ${p.practiceDays.map(d=>days[d]).join(', ')||'aucun entraînement fixe'}${p.matchDay!==null?`, match le ${days[p.matchDay]}`:''}`);
    return parts.join(' ; ')+'.';
  }

  function save(value) {const v=validate(value)||blank();return {...v,date:today()};}

  return {skills,feelings,seasons,days,goals,blank,validate,complete,weights,accents,summary,save};
});
