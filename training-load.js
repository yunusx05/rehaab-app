/* Rehaab : charge commune de la semaine. Le club, le parcours « Retour au jeu », le programme muscu et les soins
   comptent dans un seul calendrier, pour qu'un programme ne surcharge jamais l'autre.
   Règles simples, présentées comme des conventions d'entraînement courantes (pas des normes sourcées). Pur, sans DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TrainingLoad = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const at = (date, shift=0) => {const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+shift);return key(d);};
  const weekday = date => (new Date(`${date}T12:00:00`).getDay()+6)%7; // lundi = 0
  const diff = (a,b) => Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);

  // Mouvement qui charge lourdement les jambes ou les tendons : c'est le terrain du parcours, pas du programme muscu.
  const legHeavy = e => !!e && (['squat','hinge','jump'].includes(e.pattern) || !!e.impact || e.kind==='plyo');

  // Club : calendrier déclaré dans « Mon jeu » + événements saisis dans l'app (prioritaires, ils sont datés).
  function club(state, date) {
    const p=state.basketProfile||{}, wd=weekday(date);
    const events=(state.events||[]).filter(e=>e.date===date&&['match','club'].includes(e.type));
    const match=events.some(e=>e.type==='match')||p.matchDay===wd;
    const practice=!match&&(events.some(e=>e.type==='club')||(p.practiceDays||[]).includes(wd));
    return {match,practice,any:match||practice};
  }

  // Une séance de l'app a-t-elle chargé les jambes ? Séries réellement validées sur des mouvements de jambes.
  function legsWorked(session) {
    if(!session) return false;
    if(session.source==='external') return ['match','club'].includes(session.eventType);
    const done=(session.exercises||[]).filter(e=>legHeavy(e)&&e.pathwayRole!=='soin'&&((session.entries||{})[e.id]||[]).some(r=>r.done));
    return done.length>=2;
  }

  function day(state, date) {
    const now=date||key(new Date());
    const sessions=(state.sessions||[]).filter(s=>diff(now,s.date)>=0&&diff(now,s.date)<=6);
    const todays=sessions.filter(s=>s.date===now);
    const yesterday=club(state,at(now,-1)),today=club(state,now),tomorrow=club(state,at(now,1));
    const legsRecent=(state.sessions||[]).some(s=>diff(now,s.date)>=1&&diff(now,s.date)<=1&&legsWorked(s))||yesterday.match;
    const appWeek=sessions.filter(s=>['pathway','program-plan','generated','program'].includes(s.source)).length;
    const clubWeek=Array.from({length:7},(_,i)=>club(state,at(now,-i))).filter(c=>c.any).length;
    const target=Math.max(1,Number(state.profile&&state.profile.weeklyTarget)||3);
    const pathwayToday=todays.some(s=>s.source==='pathway'), muscuToday=todays.some(s=>s.source==='program-plan');
    const program=state.program&&state.program.status==='active'?state.program:null;
    const pathway=state.pathway&&state.pathway.status!=='archived'?state.pathway:null;
    const notes=[];
    let primary='pathway', protectLegs=false, maxMinutes=null;

    if(today.match){primary='rest';protectLegs=true;notes.push('Match aujourd’hui : pas de séance, seulement l’échauffement avant le match.');}
    else if(yesterday.match){primary='recovery';protectLegs=true;notes.push('Lendemain de match : récupération, mobilité et soins.');}
    else if(appWeek>=target){primary='recovery';notes.push(`${appWeek} séances dans l’app ces 7 derniers jours pour un objectif de ${target} : on récupère.`);}
    else {
      if(tomorrow.match){protectLegs=true;notes.push('Match demain : pas de jambes lourdes ni de sauts aujourd’hui.');}
      if(legsRecent){protectLegs=true;notes.push('Jambes déjà chargées dans les dernières 24 h.');}
      if(today.practice){protectLegs=true;notes.push('Entraînement au club aujourd’hui : la séance de l’app reste courte et sans jambes lourdes.');maxMinutes=30;}
      // Le parcours porte les jambes : il passe en premier quand elles sont fraîches. Sinon, la muscu du haut du corps prend la place.
      if(pathwayToday&&program&&!muscuToday){primary='muscu';protectLegs=true;maxMinutes=30;notes.push('Parcours déjà fait aujourd’hui : complément muscu court, haut du corps et gainage.');}
      else if(pathwayToday||muscuToday){primary='recovery';notes.push('Séance déjà faite aujourd’hui.');}
      else if(protectLegs&&program) primary='muscu';
      else if(pathway) primary='pathway';
      else if(program) primary='muscu';
      else primary='session';
    }
    if(clubWeek>=3&&appWeek+clubWeek>=target+3) notes.push(`Semaine chargée : ${clubWeek} jours de club et ${appWeek} séances dans l’app.`);
    return {date:now,primary,protectLegs,maxMinutes,notes,club:{yesterday,today,tomorrow},appWeek,clubWeek,target,pathwayToday,muscuToday};
  }

  // Programme muscu : retire ce qui charge les jambes quand elles doivent rester fraîches.
  function filterMuscu(exercises, plan) {
    if(!plan||!plan.protectLegs) return {exercises,removed:[]};
    const removed=exercises.filter(e=>e.pathwayRole!=='soin'&&legHeavy(e));
    return {exercises:exercises.filter(e=>!removed.includes(e)),removed};
  }

  // Les 7 prochains jours, pour l'écran : club, séances faites, conseil du jour.
  function week(state, date) {
    const now=date||key(new Date());
    return Array.from({length:7},(_,i)=>{const d=at(now,i);const c=club(state,d);return {date:d,weekday:weekday(d),...c,done:(state.sessions||[]).filter(s=>s.date===d).map(s=>s.source)};});
  }

  return {legHeavy,club,legsWorked,day,filterMuscu,week,weekday};
});
