/* Rehaab : nutrition du joueur qui reprend. Questionnaire -> repères du jour (énergie, protéines, glucides, lipides, eau),
   journée type autour de la séance, compléments (dose, heure, verdict), quoi manger, jeûne. Pur, sans DOM.
   Repères généraux tirés des consensus cités dans `sources` : pas un avis médical ni diététique. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BasketNutrition = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const isDay = v => typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const num = (v,lo,hi) => v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>=lo&&Number(v)<=hi;
  const r5 = n => Math.round(n/5)*5, r10 = n => Math.round(n/10)*10, r50 = n => Math.round(n/50)*50;
  const lib = (name,file) => { const g=typeof globalThis!=='undefined'?globalThis:{}; if(g[name]) return g[name]; try { return typeof require==='function'?require(file):null; } catch (e) { return null; } };

  // Questionnaire. numbers : poids, taille, âge (pré-remplis depuis le profil).
  const numbers = [
    {id:'weight',label:'Poids (kg)',min:40,max:200,step:0.1},
    {id:'height',label:'Taille (cm)',min:140,max:230,step:1},
    {id:'age',label:'Âge',min:18,max:80,step:1}
  ];
  const questions = [
    {id:'goal',label:'Ton objectif',options:[['lose','Perdre du gras'],['recomp','Perdre du gras en gardant le muscle'],['maintain','Garder mon poids'],['gain','Prendre du muscle']]},
    {id:'formula',label:'Formule de calcul de ta dépense (sexe biologique)',options:[['male','Masculine'],['female','Féminine']]},
    {id:'activity',label:'Ta journée hors sport',options:[['sedentary','Assis la plupart du temps'],['light','Un peu actif (marche, trajets)'],['moderate','Souvent debout ou en mouvement'],['high','Travail physique']]},
    {id:'trainTime',label:'Quand t’entraînes-tu le plus souvent ?',options:[['morning','Le matin'],['midday','Le midi'],['afternoon','L’après-midi'],['evening','Le soir (après 18 h)'],['varies','Ça change']]},
    {id:'meals',label:'Combien de repas par jour te conviennent ?',options:[['2','2 repas'],['3','3 repas'],['4','3 repas et une collation']]},
    {id:'diet',multi:true,optional:true,label:'Ton alimentation',options:[['halal','Halal'],['noPork','Sans porc'],['vegetarian','Végétarien'],['lactose','Sans lactose']]},
    {id:'digestion',label:'Ta digestion',options:[['ok','Pas de souci'],['sensitive','Ventre sensible (ballonnements, côlon irritable)']]},
    {id:'fish',label:'Poisson gras (saumon, sardine, maquereau) par semaine',options:[['0','Jamais ou presque'],['1','Une fois'],['2','Deux fois ou plus']]},
    {id:'sleep',label:'Ton sommeil',options:[['short','Moins de 6 h'],['mid','6 à 7 h'],['good','7 h ou plus']]},
    {id:'caffeine',label:'Café, thé, boissons énergisantes',options:[['none','Rien'],['some','1 à 2 par jour'],['lots','3 ou plus']]},
    {id:'fasting',label:'Tu jeûnes parfois ?',options:[['no','Non'],['ramadan','Oui, pendant le Ramadan'],['often','Oui, régulièrement']]},
    {id:'current',multi:true,optional:true,label:'Ce que tu prends déjà',options:[['whey','Protéine en poudre'],['creatine','Créatine'],['omega3','Oméga-3'],['vitd','Vitamine D'],['magnesium','Magnésium'],['preworkout','Pré-workout']]},
    {id:'health',multi:true,optional:true,label:'Ta santé (pour écarter ce qui ne te convient pas)',options:[['kidney','Problème de reins'],['meds','Traitement médical en cours'],['heart','Problème cardiaque ou de tension'],['ted','Trouble du comportement alimentaire']]}
  ];

  function blank() { return {answers:{},date:null}; }
  function validate(v) {
    if(!v||typeof v!=='object'||Array.isArray(v)) return null;
    const given=v.answers&&typeof v.answers==='object'?v.answers:{},answers={};
    questions.forEach(q=>{
      const x=given[q.id];
      if(q.multi){ if(Array.isArray(x)) answers[q.id]=[...new Set(x.filter(o=>q.options.some(p=>p[0]===o)))]; }
      else if(q.options.some(o=>o[0]===x)) answers[q.id]=x;
    });
    numbers.forEach(n=>{ if(num(given[n.id],n.min,n.max)) answers[n.id]=Number(given[n.id]); });
    return {answers,date:isDay(v.date)?v.date:null};
  }
  const missing = a => [...numbers.filter(n=>a[n.id]===undefined).map(n=>n.label.replace(/ \(.*\)/,'').toLowerCase()),...questions.filter(q=>!q.optional&&a[q.id]===undefined).map(q=>q.label.toLowerCase())];
  function complete(v) { const n=validate(v); return !!(n&&n.date&&!missing(n.answers).length); }
  // Pré-remplissage : profil et dernière pesée.
  function prefill(state) {
    const p=state.profile||{},last=(state.measurements||[]).filter(m=>num(m.weight,30,350)).sort((a,b)=>String(a.date).localeCompare(String(b.date))).pop();
    const out={};
    if(last) out.weight=Number(last.weight); else if(num(p.weight,40,200)) out.weight=Number(p.weight);
    if(num(p.height,140,230)) out.height=Number(p.height);
    if(num(p.age,18,80)) out.age=Number(p.age);
    return out;
  }

  // Énergie : Mifflin–St Jeor × activité, entraînement compté à part (5 MET nets, la part de repos est déjà dans le quotidien).
  const activity = {sedentary:1.2,light:1.375,moderate:1.55,high:1.725};
  const goals = {lose:{delta:-0.15,label:'Perdre du gras',protein:2.0},recomp:{delta:-0.05,label:'Recomposition',protein:2.0},maintain:{delta:0,label:'Entretien',protein:1.6},gain:{delta:0.1,label:'Prise de muscle',protein:1.8}};
  // Volume d'entraînement de la semaine : séances physiques du planning + club et match du questionnaire « Mon jeu ».
  function weekLoad(state) {
    const SP=lib('SeasonPlan','./season-plan.js'),a=state.dossier&&state.dossier.answers||{},bp=state.basketProfile||{};
    const sessions=SP?SP.target(state):Number(state.profile&&state.profile.weeklyTarget)||3;
    const minutes=Number(a.maxMinutes)||60;
    const sk=state.skills&&state.skills.program&&state.skills.program.status==='active'?state.skills.program:null;
    const club=(Array.isArray(bp.practiceDays)?bp.practiceDays.length:0)+(Number.isInteger(bp.matchDay)?1:0);
    return {sessions,minutes,skills:sk?sk.perWeek:0,skillMinutes:sk?sk.minutes:0,club,clubMinutes:90};
  }
  function energy(a,load) {
    const resting=10*a.weight+6.25*a.height-5*a.age+(a.formula==='female'?-161:5);
    const daily=resting*activity[a.activity];
    const weekMin=load.sessions*load.minutes+load.skills*load.skillMinutes*0.6+load.club*load.clubMinutes;
    const training=5*3.5*a.weight/200*weekMin/7;
    const total=daily+training,g=goals[a.goal];
    let target=total*(1+g.delta);const floor=resting*1.1;const raised=target<floor;if(raised) target=floor;
    return {resting:r10(resting),daily:r10(daily),training:r10(training),total:r10(total),target:r10(target),margin:r50(total*0.12),raised,weekMinutes:Math.round(weekMin)};
  }

  const trainHours = {morning:9,midday:12.5,afternoon:17.5,evening:19.5};
  const clock = h => { const x=((h%24)+24)%24; return `${Math.floor(x)} h${x%1?String(Math.round(x%1*60)).padStart(2,'0'):''}`; };

  // Aliments. Adaptés au halal, au végétarien, au sans-lactose et au ventre sensible (approche pauvre en FODMAP, reprise de ton plan).
  function foods(a) {
    const d=a.diet||[],veg=d.includes('vegetarian'),halal=d.includes('halal'),lact=d.includes('lactose'),sens=a.digestion==='sensitive';
    const meat=veg?[]:[halal?'Poulet, dinde, bœuf haché 5 % (certifiés halal)':'Poulet, dinde, bœuf haché 5 %','Poisson blanc, saumon, sardines, thon'];
    const protein=[...meat,'Œufs',lact?'Skyr ou fromage blanc sans lactose':'Skyr, fromage blanc, yaourt grec',...(sens?['Tofu ferme']:['Lentilles, pois chiches, haricots','Tofu, tempeh'])];
    const carbs=sens?['Riz blanc bien cuit, mangé chaud','Pommes de terre, patate douce','Flocons d’avoine (petite portion)','Pain au levain, pâtes (portions modérées)','Banane ferme, kiwi, orange, fruits rouges']:['Riz, pâtes, semoule','Pommes de terre, patate douce','Flocons d’avoine, pain complet ou au levain','Fruits : banane, pomme, dattes, fruits rouges','Légumineuses (aussi riches en protéines)'];
    const fats=['Huile d’olive ou de colza',sens?'Noix, noix de pécan (une petite poignée)':'Noix, amandes, noisettes','Avocat (petite portion)',...(veg?['Graines de chia, de lin']:['Poissons gras (oméga-3)'])];
    const greens=sens?['Courgette, carotte, épinards, haricots verts, bien cuits','Goût sans ail ni oignon : ciboulette, vert de cébette, huile infusée filtrée']:['Tous les légumes, crus ou cuits, à chaque repas','Une crudité ou un fruit à chaque repas'];
    const avoid=[...(sens?['Ail, oignon, légumineuses en grande quantité, pommes, poires, lait : les plus fréquents à fermenter']:[]),'Fritures et plats très gras juste avant la séance','Boissons sucrées en dehors de l’effort',...(halal?['Gélatine non certifiée (bonbons, certaines gélules, desserts)']:[])];
    return {protein,carbs,fats,greens,avoid};
  }

  // Compléments : verdict yes (utile pour toi), maybe (selon ta situation), doctor (à voir avec ton médecin), no (inutile).
  function supplements(a,m) {
    const h=a.health||[],cur=a.current||[],d=a.diet||[],halal=d.includes('halal'),sens=a.digestion==='sensitive',lact=d.includes('lactose');
    const out=[];
    out.push(h.includes('kidney')?{id:'creatine',name:'Créatine monohydrate',verdict:'doctor',dose:'—',when:'—',why:'Problème de reins déclaré : pas de créatine sans l’accord de ton médecin.'}
      :{id:'creatine',name:'Créatine monohydrate',verdict:'yes',dose:'3 à 5 g par jour, tous les jours, même au repos. Pas de phase de « charge » nécessaire.',when:'Avec un repas, à l’heure qui t’arrange : c’est la régularité qui compte. Le plus simple : le repas d’après séance.',
        why:'Le complément le mieux étudié pour la force, les sprints répétés et la récupération entre efforts courts : exactement l’effort du basket.',note:'Les premières semaines, 1 à 2 kg de plus sur la balance : c’est de l’eau dans le muscle, pas du gras.'+(halal?' Prends-la en poudre : les gélules sont souvent en gélatine.':''),already:cur.includes('creatine')});
    out.push({id:'whey',name:sens||lact?'Protéine en poudre · whey isolate':d.includes('vegetarian')?'Protéine en poudre (whey ou végétale)':'Protéine en poudre (whey)',verdict:'maybe',dose:'Une dose de 20 à 40 g de protéines.',when:'Après la séance, ou en collation si un repas en manque.',
      why:`Seulement si tes repas n’atteignent pas tes ${m.protein} g de protéines par jour. C’est un aliment pratique, pas un produit magique.`,
      note:[halal?'Choisis-la certifiée halal (la fabrication peut utiliser de la présure animale).':'',sens||lact?'Version isolate (presque sans lactose) et sans polyols : sorbitol, xylitol, maltitol, inuline.':''].filter(Boolean).join(' '),already:cur.includes('whey')});
    const caff=Math.round(a.weight*3/10)*10;
    if(h.includes('heart')||h.includes('meds')) out.push({id:'caffeine',name:'Caféine avant la séance',verdict:'doctor',dose:'—',when:'—',why:'Problème cardiaque, de tension ou traitement en cours : demande d’abord à ton médecin.'});
    else if(a.caffeine==='lots') out.push({id:'caffeine',name:'Caféine avant la séance',verdict:'no',dose:'—',when:'—',why:'Tu en prends déjà beaucoup : en ajouter n’apporte rien et pèse sur ton sommeil.'});
    else out.push({id:'caffeine',name:'Caféine avant la séance',verdict:a.sleep==='short'||a.trainTime==='evening'?'maybe':'yes',dose:`Environ 3 mg par kg, soit ${caff} mg. Repères EFSA : un expresso ≈ 80 mg, un café filtre (200 ml) ≈ 90 mg.`,
      when:'30 à 60 minutes avant la séance ou le match.',why:'Plus de vigilance et d’intensité sur les efforts répétés.',
      note:a.trainTime==='evening'||a.sleep==='short'?'Elle agit pendant des heures : séance le soir ou sommeil court, saute-la ou garde-la pour les matchs en journée. Le sommeil récupère mieux que la caféine.':'Pas de caféine après le milieu d’après-midi : elle abîme le sommeil.'});
    out.push(a.fish==='2'?{id:'omega3',name:'Oméga-3 (EPA + DHA)',verdict:'no',dose:'—',when:'—',why:'Tu manges déjà du poisson gras deux fois par semaine : le complément n’ajoute rien.'}
      :{id:'omega3',name:'Oméga-3 (EPA + DHA)',verdict:'maybe',dose:'Selon l’étiquette ; l’idéal reste deux portions de poisson gras par semaine.',when:'Avec un repas qui contient du gras (mieux absorbé, moins de remontées).',
        why:'Tu manges peu de poisson gras : les oméga-3 comptent pour le cœur et l’inflammation. L’aliment d’abord, le complément sinon.',note:halal?'Les gélules sont souvent en gélatine bovine ou porcine : prends-les certifiées halal ou en gélatine de poisson.':'',already:cur.includes('omega3')});
    out.push({id:'vitd',name:'Vitamine D',verdict:'doctor',dose:'Celle que prescrit ton médecin après le dosage.',when:'Avec un repas.',why:'Fais-la doser par une prise de sang, surtout d’octobre à mars quand le soleil manque. S’il en manque, ton médecin donne la dose : pas de mégadoses au hasard.',already:cur.includes('vitd')});
    out.push({id:'electrolytes',name:'Boisson avec sel et glucides',verdict:'maybe',dose:'Pendant l’effort, par petites gorgées.',when:'Séance de plus de 90 minutes, match, ou forte chaleur.',why:'Au-delà d’une heure et demie, l’eau seule ne remplace pas le sel perdu ni l’énergie. En dessous, de l’eau suffit.'});
    out.push({id:'magnesium',name:'Magnésium',verdict:'no',dose:'—',when:'—',why:'Pas utile par défaut. Oléagineux, céréales complètes, chocolat noir et eau minérale en apportent.'+(cur.includes('magnesium')?' Tu en prends : sans carence connue, tu peux arrêter.':''),already:cur.includes('magnesium')});
    out.push({id:'avoid',name:'À éviter',verdict:'no',dose:'—',when:'—',why:'BCAA (inutiles si tu manges assez de protéines), brûleurs de graisse, « boosters de testostérone », pré-workouts aux mélanges secrets'+(cur.includes('preworkout')?' (comme celui que tu prends : vérifie sa dose de caféine et la norme ci-dessous)':'')+'.',note:'Pour tout complément : cherche la norme AFNOR NF V94-001, qui garantit l’absence de substances dopantes.'});
    if(h.includes('meds')) out.forEach(s=>{if(s.verdict==='yes'||s.verdict==='maybe') s.note=[s.note,'Traitement en cours : montre cette liste à ton médecin ou à ton pharmacien avant de commencer.'].filter(Boolean).join(' ');});
    return out;
  }

  // Journée type autour de la séance. train : jour d'entraînement ou de repos.
  function day(a,m,{train=true}={}) {
    const T=trainHours[a.trainTime],at=(shift,txt)=>T!==undefined?`${clock(T+shift)}`:txt,sens=a.digestion==='sensitive',lact=(a.diet||[]).includes('lactose');
    const per=m.perMeal?`Environ ${m.perMeal} g de protéines`:'Une portion de protéines (une à deux paumes de main)';
    const creatine=m.creatineYes;
    if(!train) return [
      {time:'Matin',title:'Petit-déjeuner',what:`${per} (œufs, skyr, fromage blanc) et un féculent ou des flocons d’avoine.`,why:'Les protéines comptent autant les jours de repos : c’est là que le muscle se reconstruit.'},
      {time:'Midi',title:'Repas',what:`${per}, une petite portion de féculent, beaucoup de légumes.`,why:'Moins de féculents qu’un jour d’entraînement, puisque tu en dépenses moins.'},
      ...(a.meals==='4'?[{time:'Après-midi',title:'Collation',what:'Un fruit et un yaourt ou une poignée de noix.',why:'Tenir jusqu’au soir sans grignoter.'}]:[]),
      {time:'Soir',title:'Repas',what:`${per}, légumes, féculent selon ta faim.${creatine?' Créatine avec ce repas.':''}`,why:'Garder les mêmes protéines que les jours d’entraînement.'},
      {time:'Toute la journée',title:'Eau',what:`${m.waterBase} L environ.`,why:'Une urine claire est le repère le plus simple.'}
    ];
    const early=a.trainTime==='morning';
    const list=[];
    if(early){
      list.push({time:at(-1,'1 h avant'),title:'Avant la séance',what:`Un grand verre d’eau et une collation légère : banane ferme ou une tranche de pain blanc avec du miel${lact?'':', ou un yaourt'}.`,why:'Le dernier repas date de la veille : un peu de glucides faciles évite de manquer d’énergie, sans peser sur l’estomac.'});
    } else {
      list.push({time:at(-3,'3 h avant'),title:'Repas avant la séance',what:`${per}, un féculent (${sens?'riz blanc bien cuit, pomme de terre':'riz, pâtes, pommes de terre'}), des légumes cuits, peu de gras.`,why:'Trois heures pour digérer : tu arrives avec de l’énergie sans lourdeur.'});
      list.push({time:at(-1,'1 h avant'),title:'Collation si tu as faim',what:`Banane ferme, galettes de riz ou pain blanc avec du miel${lact?'':', ou un yaourt'}.`,why:'Des glucides faciles, presque sans fibres ni gras, pour ne pas avoir le ventre lourd.'});
    }
    if(m.caffeineWhen) list.push({time:at(-0.75,'45 min avant'),title:'Caféine (facultatif)',what:m.caffeineWhen,why:'Le pic d’effet arrive 30 à 60 minutes après.'});
    list.push({time:at(0,'Pendant'),title:'Pendant la séance',what:`De l’eau par petites gorgées : ${m.waterPerHour} par heure. Plus de 90 minutes ou un match : boisson avec un peu de sel et de glucides${sens?', ou une banane ferme':''}.`,why:'Arriver déshydraté fait baisser l’adresse et la vitesse.'});
    list.push({time:at(1.5,'Dans l’heure ou les deux qui suivent'),title:early?'Vrai petit-déjeuner':'Après la séance',what:`${per} et des glucides (riz, pâtes, pommes de terre, pain, fruits).${creatine?' Créatine avec ce repas.':''}`,why:'Les protéines lancent la réparation, les glucides refont les réserves pour la séance suivante.'});
    if(a.meals!=='2') list.push({time:'Autre repas',title:'Repas suivant',what:`${per}, légumes, féculent selon ton objectif.`,why:`Répartir les protéines en ${a.meals==='4'?'4':'3'} prises fait mieux travailler le muscle qu’une seule grosse prise.`});
    if(['gain','recomp','lose'].includes(a.goal)) list.push({time:'Avant de dormir',title:'Facultatif',what:lact?'Skyr ou fromage blanc sans lactose, ou une dose de protéine.':'Skyr, fromage blanc ou une dose de protéine.',why:'Des protéines qui se digèrent lentement pendant la nuit.'});
    return list;
  }

  function fastingTips(a) {
    if(!['ramadan','often'].includes(a.fasting)) return [];
    return [
      'Séance légère (skills, tir, mobilité) dans l’heure avant la rupture du jeûne ; séance intense 1 à 2 h après le repas du soir.',
      'Repas de l’aube : protéines (œufs, skyr), glucides lents (flocons d’avoine, pain complet) et beaucoup d’eau. Évite le très salé qui donne soif.',
      'Rupture : dattes et eau, puis un vrai repas avec protéines et féculent. Répartis ton eau entre la rupture et l’aube, par petites quantités.',
      'Créatine avec l’un des deux repas. La caféine à la rupture peut gêner ton sommeil.',
      'Garde tes protéines du jour sur deux ou trois prises, sinon la reprise musculaire ralentit.'
    ];
  }

  const comeback = [
    'Ton corps se souvient : le muscle revient plus vite qu’il ne s’était construit, à condition de manger assez de protéines.',
    'Pas de déficit agressif pendant la reprise : tendons et récupération en ont besoin. Mieux vaut perdre lentement que se blesser.',
    'Pèse-toi le matin et compare des moyennes sur 7 jours (écran « Poids de forme »), pas un jour contre l’autre.',
    'Toutes les deux semaines : si la moyenne ne va pas dans le sens voulu, ajuste de 150 kcal environ, sur les féculents.',
    'Le sommeil fait partie de la nutrition : 7 h ou plus, c’est là que le muscle se répare.'
  ];

  const sources = [
    'Mifflin MD et al., 1990 : équation de la dépense au repos.',
    'Morton RW et al., British Journal of Sports Medicine, 2018 : protéines et gain de muscle (repère 1,6 g/kg, jusqu’à 2,2 g/kg).',
    'Thomas DT et al., position ACSM / Academy of Nutrition and Dietetics, 2016 : glucides, hydratation, répartition autour de l’effort.',
    'Kreider RB et al., position de l’ISSN sur la créatine, 2017.',
    'Guest NS et al., position de l’ISSN sur la caféine, 2021 ; EFSA, avis sur la sécurité de la caféine, 2015.',
    'Maughan RJ et al., consensus du CIO sur les compléments alimentaires, 2018.'
  ];

  function plan(state) {
    const n=validate(state.nutrition)||blank(),a=n.answers;
    const miss=missing(a);
    if(miss.length) return {ok:false,missing:miss};
    const h=a.health||[];
    const load=weekLoad(state);
    const e=energy(a,load),g=goals[a.goal];
    const protein=r5(a.weight*g.protein),fat=r5(a.weight*0.9),carbs=Math.max(0,r5((e.target-protein*4-fat*9)/4));
    const meals=a.meals==='2'?2:a.meals==='4'?4:3;
    const m={protein,proteinRange:[r5(a.weight*1.6),r5(a.weight*2.2)],fat,carbs,carbsPerKg:Math.round(carbs/a.weight*10)/10,
      perMeal:r5(protein/meals),meals,waterBase:Math.round(a.weight*0.035*10)/10,waterPerHour:'0,4 à 0,8 L'};
    const supps=supplements(a,m);
    m.creatineYes=supps.some(s=>s.id==='creatine'&&s.verdict==='yes');
    const caff=supps.find(s=>s.id==='caffeine');
    m.caffeineWhen=caff&&caff.verdict==='yes'?`${caff.dose.split('.')[0]}.`:null;
    // Trouble du comportement alimentaire déclaré : pas de chiffre d'énergie, seulement les repères qualitatifs.
    const showNumbers=!h.includes('ted');
    if(!showNumbers) m.perMeal=null;
    const notes=[];
    if(m.carbsPerKg<3) notes.push(`Glucides à ${String(m.carbsPerKg).replace('.',',')} g par kg : c’est bas pour ton volume de basket (repère 3 à 5 g/kg). Si tu manques d’énergie, garde tes féculents autour des séances et réduis plutôt le gras.`);
    if(e.raised) notes.push('La cible a été relevée : plus bas, tu passerais trop près de ta dépense au repos.');
    return {ok:true,answers:a,load,energy:showNumbers?e:null,macros:showNumbers?m:{...m,protein:null,fat:null,carbs:null},goalLabel:g.label,
      training:day(a,m,{train:true}),rest:day(a,m,{train:false}),supplements:supps,foods:foods(a),fasting:fastingTips(a),comeback,notes,sources,
      blocked:showNumbers?null:'Trouble du comportement alimentaire déclaré : l’app n’affiche aucun chiffre de calories. Ton médecin ou ton diététicien reste la bonne référence.'};
  }

  function save(state,answers) { return {...state,nutrition:{answers:validate({answers}).answers,date:today()}}; }

  return {questions,numbers,blank,validate,complete,missing,prefill,weekLoad,energy,foods,supplements,day,plan,save,sources,comeback};
});
