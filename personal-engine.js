/* Rehaab: deterministic planning and progression. No medical diagnosis or clearance. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PersonalTraining = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 1;
  const STORAGE_KEY = 'rh_personal_v1';
  const equipment = [
    ['bodyweight','Poids du corps','body'], ['dumbbells','Haltères','weight'],
    ['kettlebell','Kettlebell','weight'], ['barbell','Barre + disques','weight'],
    ['bench','Banc','bench'], ['bands','Élastiques','band'], ['pullup','Barre de traction','bar'],
    ['cable','Poulie / tirage','machine'], ['legpress','Presse à jambes','machine'],
    ['legextension','Leg extension','machine'], ['legcurl','Leg curl','machine'],
    ['bike','Vélo','bike'], ['rower','Rameur','machine'], ['rope','Corde à sauter','band'],
    ['ball','Ballon','basket'], ['hoop','Panier','basket'], ['court','Terrain / espace','court'],
    ['outdoor','Parcours extérieur','run'], ['partner','Partenaire','body']
  ].map(([id,label,icon])=>({id,label,icon}));
  const regions = {neck:'Cou',shoulder:'Épaule',elbow:'Coude',wrist:'Poignet',back:'Dos',hip:'Hanche / aine',knee:'Genou',ankle:'Cheville / pied'};
  const patterns = {push:'Poussée',pull:'Tirage',squat:'Jambes · flexion',hinge:'Chaîne postérieure',core:'Gainage',calf:'Mollets',arms:'Bras',mobility:'Mobilité',cardio:'Cardio',shoot:'Tir',handle:'Dribble',finish:'Finition',footwork:'Appuis',react:'Réaction',jump:'Sauts'};
  const formats = {auto:'Au choix de l’app',classic:'Séries classiques',superset:'Supersets',hiit:'HIIT',amrap:'WOD · AMRAP',emom:'WOD · EMOM',circuit:'Circuit'};
  const upper = ['shoulder','elbow','wrist','back'];
  const lower = ['hip','knee','ankle','back'];
  const catalog = [];
  function ex(id,name,kind,pattern,needs,body,instructions,options={}) {
    catalog.push({id,name,kind,pattern,needs,regions:body,instructions,level:1,impact:false,measure:'reps',sets:3,min:8,max:12,rest:75,seconds:40,weighted:false,...options});
  }
  ex('pushup','Pompes','strength','push',['bodyweight'],upper,['Aligne tête, bassin et talons.','Descends avec contrôle, puis repousse sans perdre cet alignement.'],{media:'Pushups',min:6});
  ex('wall-pushup','Pompes au mur','strength','push',['bodyweight'],upper,['Mains au mur à hauteur de poitrine.','Recule les pieds à une distance confortable et fléchis les coudes sans cambrer.'],{min:10,max:15});
  ex('db-press','Développé couché · haltères','strength','push',['dumbbells','bench'],upper,['Pieds stables, omoplates posées sur le banc.','Descends les haltères avec contrôle. Ne cherche pas l’échec en solo.'],{weighted:'dumbbells',media:'Dumbbell_Bench_Press'});
  ex('floor-press','Développé au sol · haltères','strength','push',['dumbbells'],upper,['Allongé au sol, genoux fléchis.','Descends jusqu’au contact doux des bras avec le sol, puis repousse.'],{weighted:'dumbbells',media:'Dumbbell_Floor_Press',floor:true});
  ex('bb-press','Développé couché · barre','strength','push',['barbell','bench'],upper,['Utilise des sécurités réglées ou un pareur.','Garde une marge de répétitions ; ne bloque pas sous la barre.'],{weighted:'barbell',level:2,media:'Barbell_Bench_Press_-_Medium_Grip',needsSafety:true});
  ex('db-row','Rowing un bras · haltère','strength','pull',['dumbbells','bench'],upper,['Une main et un genou en appui stable.','Tire le coude vers la hanche sans tourner le buste.'],{weighted:'dumbbells',unilateral:true,media:'One-Arm_Dumbbell_Row'});
  ex('bb-row','Rowing · barre','strength','pull',['barbell'],upper.concat('hip'),['Incline le buste depuis les hanches, dos stable.','Tire vers le bas du ventre sans lancer le corps.'],{weighted:'barbell',level:2,media:'Bent_Over_Barbell_Row'});
  ex('band-row','Tirage · élastique','strength','pull',['bands'],upper,['Vérifie la solidité de l’ancrage et l’état de l’élastique.','Ramène les coudes vers l’arrière sans hausser les épaules.'],{min:10,max:15});
  ex('cable-row','Tirage horizontal · poulie','strength','pull',['cable'],upper,['Ajuste le siège et cale les pieds.','Tire les poignées vers le ventre, sans balancer le buste.'],{weighted:'cable',media:'Seated_Cable_Rows'});
  ex('pulldown','Tirage vertical · poulie','strength','pull',['cable'],upper,['Cale les cuisses et garde le buste stable.','Tire la barre devant toi vers le haut de poitrine, jamais derrière la nuque.'],{weighted:'cable',media:'Wide-Grip_Lat_Pulldown'});
  ex('pullup','Tractions contrôlées','strength','pull',['pullup'],upper,['Vérifie la fixation de la barre.','Monte sans élan et redescends avec contrôle.'],{level:2,min:3,max:8});
  ex('db-shoulder','Développé épaules · haltères','strength','push',['dumbbells','bench'],upper,['Assis, pieds au sol, dos soutenu.','Pousse sans cambrer, dans une amplitude confortable.'],{weighted:'dumbbells',media:'Dumbbell_Shoulder_Press'});
  ex('lateral','Élévations latérales','strength','push',['dumbbells'],['shoulder','elbow','wrist'],['Coudes légèrement fléchis, charge légère.','Ouvre les bras sans élan, jusqu’à une hauteur confortable.'],{weighted:'dumbbells',min:10,max:15,media:'Side_Lateral_Raise',isolation:true});
  ex('curl','Curl marteau','strength','arms',['dumbbells'],['elbow','wrist','shoulder'],['Paumes face à face, coudes près du buste.','Monte et descends sans balancer le dos.'],{weighted:'dumbbells',media:'Hammer_Curls',min:10,max:15});
  ex('triceps','Extension triceps · élastique','strength','arms',['bands'],['elbow','wrist','shoulder'],['Ancrage solide en hauteur.','Coudes fixes contre le buste : tends les bras sans à-coup.'],{min:10,max:15});
  ex('squat','Squat au poids du corps','strength','squat',['bodyweight'],lower,['Pieds posés à une largeur confortable.','Fléchis hanches et genoux sans décoller les talons. Ne force pas l’amplitude.'],{media:'Bodyweight_Squat',min:10,max:15});
  ex('goblet','Goblet squat · kettlebell','strength','squat',['kettlebell'],lower.concat('shoulder','wrist'),['Tiens la kettlebell près de la poitrine.','Descends avec contrôle, talons au sol, puis remonte.'],{weighted:'kettlebell',media:'Goblet_Squat'});
  ex('db-squat','Squat · haltères','strength','squat',['dumbbells'],lower.concat('wrist'),['Haltères le long du corps, pieds stables.','Descends avec contrôle sans arrondir le dos.'],{weighted:'dumbbells'});
  ex('bb-squat','Squat · barre','strength','squat',['barbell'],lower.concat('shoulder','wrist'),['Barre posée dans un rack avec sécurités adaptées.','Choisis une amplitude contrôlée. Ne cherche pas l’échec en solo.'],{weighted:'barbell',level:2,needsSafety:true});
  ex('reverse-lunge','Fente arrière · poids du corps','strength','squat',['bodyweight'],lower,['Recule un pied, garde ton équilibre.','Fléchis à une amplitude confortable puis reviens en appui stable.'],{unilateral:true,min:6,max:10});
  ex('db-lunge','Fente arrière · haltères','strength','squat',['dumbbells'],lower.concat('wrist'),['Haltères le long du corps.','Recule un pied et contrôle la descente, sans choc du genou au sol.'],{weighted:'dumbbells',unilateral:true,min:6,max:10});
  ex('rdl','Soulevé de terre roumain · haltères','strength','hinge',['dumbbells'],lower.concat('wrist'),['Genoux légèrement fléchis, haltères proches des jambes.','Recule les hanches en gardant le dos stable, puis redresse-toi.'],{weighted:'dumbbells'});
  ex('deadlift','Soulevé de terre · barre','strength','hinge',['barbell'],lower.concat('wrist'),['Barre proche des jambes, tronc stable.','Pousse le sol et relève-toi sans arracher la charge.'],{weighted:'barbell',level:2,min:5,max:8,media:'Barbell_Deadlift'});
  ex('kb-deadlift','Soulevé de kettlebell','strength','hinge',['kettlebell'],lower.concat('wrist'),['Kettlebell entre les pieds.','Recule les hanches, saisis la poignée et relève-toi avec contrôle.'],{weighted:'kettlebell'});
  ex('bridge','Pont fessier','strength','hinge',['bodyweight'],['hip','knee','back'],['Allongé, pieds au sol et genoux fléchis.','Soulève le bassin sans cambrer puis redescends doucement.'],{floor:true,min:10,max:15});
  ex('legpress','Presse à jambes','strength','squat',['legpress'],lower,['Ajuste le siège, garde bassin et dos au dossier.','Pousse sans verrouiller brutalement les genoux ; limite la descente à ton contrôle.'],{weighted:'legpress',media:'Leg_Press'});
  ex('legextension','Leg extension','strength','squat',['legextension'],['knee','hip'],['Aligne l’axe de la machine avec le genou.','Déplie les jambes sans élan et redescends avec contrôle.'],{weighted:'legextension',media:'Leg_Extensions'});
  ex('legcurl','Leg curl allongé','strength','hinge',['legcurl'],['knee','hip','back'],['Ajuste les rouleaux à la machine.','Ramène les talons sans soulever le bassin ni cambrer.'],{weighted:'legcurl',media:'Lying_Leg_Curls'});
  ex('calf','Montées sur pointes','strength','calf',['bodyweight'],['ankle','knee'],['Garde un support stable à portée de main.','Monte et descends les talons lentement, sans rebond.'],{min:10,max:15});
  ex('deadbug','Dead bug','strength','core',['bodyweight'],['back','hip','shoulder'],['Allongé, bras vers le plafond, hanches et genoux fléchis.','Éloigne lentement un bras et la jambe opposée sans creuser le bas du dos.'],{floor:true,unilateral:true,min:6,max:10});
  ex('plank','Planche sur les avant-bras','strength','core',['bodyweight'],['shoulder','elbow','back','hip'],['Coudes sous les épaules, corps aligné.','Respire sans laisser le bassin tomber ; termine si la position se dégrade.'],{floor:true,measure:'seconds',seconds:25,media:'Plank'});
  ex('side-plank','Gainage latéral sur genoux','strength','core',['bodyweight'],['shoulder','elbow','back','hip','knee'],['Coude sous l’épaule, genoux repliés au sol.','Soulève le bassin et garde épaules et hanches alignées.'],{floor:true,unilateral:true,measure:'seconds',seconds:20});
  ex('pallof','Pallof press · élastique','strength','core',['bands'],['shoulder','wrist','back','hip'],['Élastique ancré sur le côté, pieds stables.','Éloigne les mains de la poitrine en résistant à la rotation.'],{unilateral:true});
  ex('carry','Marche du fermier · haltères','strength','core',['dumbbells','court'],upper.concat(lower),['Marche sur un trajet dégagé, haltères le long du corps.','Reste droit, avance sans précipitation et pose les poids avec contrôle.'],{weighted:'dumbbells',measure:'seconds',seconds:30});
  ex('bike','Vélo facile','cardio','cardio',['bike'],['hip','knee','ankle','back'],['Ajuste la selle. Choisis une résistance qui permet de parler aisément.','Le vélo n’est pas automatiquement adapté à une douleur : arrête le mouvement qui la provoque.'],{measure:'seconds',seconds:300,rest:30});
  ex('bike-interval','Vélo · intervalles','cardio','cardio',['bike'],['hip','knee','ankle','back'],['Après un échauffement, accélère sans chercher un sprint maximal.','Récupère en pédalant doucement.'],{measure:'seconds',seconds:30,rest:60,level:2});
  ex('walk','Marche extérieure','cardio','cardio',['outdoor'],lower,['Choisis un parcours dégagé et une allure confortable.','Ralentis ou arrête si une douleur apparaît.'],{measure:'seconds',seconds:300,rest:0});
  ex('run','Course facile','cardio','cardio',['outdoor'],lower,['Choisis un parcours connu et une allure où tu peux parler.','Tu peux alterner course et marche. Pas d’objectif de vitesse aujourd’hui.'],{measure:'seconds',seconds:180,rest:60,impact:true,level:2});
  ex('rower','Rameur facile','cardio','cardio',['rower'],upper.concat(lower),['Pousse avec les jambes, puis accompagne avec le buste et les bras.','Reviens dans l’ordre inverse, à une allure facile.'],{measure:'seconds',seconds:180,rest:45});
  ex('march','Marche active sur place','cardio','cardio',['bodyweight'],lower,['Marche sur place sans saut, bras relâchés.','Reste à une allure permettant de parler.'],{measure:'seconds',seconds:40,rest:30});
  ex('stepjack','Pas ouverts alternés','cardio','cardio',['bodyweight'],lower.concat('shoulder'),['Ouvre un pied sur le côté, puis ramène-le. Alterne.','Accompagne avec les bras si cela reste confortable. Sans saut.'],{measure:'seconds',seconds:30,rest:30});
  ex('rope','Corde à sauter','cardio','cardio',['rope'],lower.concat('wrist','shoulder'),['Petits sauts contrôlés sur une surface adaptée.','Garde des séquences courtes et arrête avant de perdre la coordination.'],{measure:'seconds',seconds:20,rest:60,impact:true,level:2});
  ex('ankle-mob','Mobilité de cheville au mur','mobility','mobility',['bodyweight'],['ankle','knee'],['Pied à plat face au mur.','Avance doucement le genou sans décoller le talon, dans une amplitude non douloureuse.'],{measure:'seconds',seconds:40,unilateral:true,rest:20});
  ex('cat','Chat / vache','mobility','mobility',['bodyweight'],['wrist','shoulder','back','hip','knee'],['À quatre pattes, alterne dos légèrement arrondi et creusé.','Mouvement lent, sans chercher une amplitude maximale.'],{floor:true,measure:'seconds',seconds:40,rest:20,media:'Cat_Stretch'});
  ex('thoracic','Rotation thoracique allongée','mobility','mobility',['bodyweight'],['shoulder','back','hip'],['Allongé sur le côté, genoux repliés.','Ouvre doucement le bras supérieur sans forcer le dos.'],{floor:true,unilateral:true,measure:'seconds',seconds:40,rest:20});
  ex('hip-flexor','Souplesse des fléchisseurs de hanche','mobility','mobility',['bodyweight'],['hip','knee','back'],['Un genou sur un support confortable, l’autre pied devant.','Bascule légèrement le bassin et avance sans cambrer. Ne cherche pas la douleur.'],{floor:true,unilateral:true,measure:'seconds',seconds:30,rest:20,media:'Standing_Hip_Flexors'});
  ex('shoulder-mob','Glissés des bras au mur','mobility','mobility',['bodyweight'],['shoulder','back','elbow'],['Place le dos près du mur sans forcer le contact.','Fais glisser les bras vers le haut, seulement dans ton amplitude confortable.'],{measure:'seconds',seconds:40,rest:20});
  ex('hamstring','Souplesse arrière de cuisse','mobility','mobility',['bodyweight'],['hip','knee','back'],['Allongé, soutiens une cuisse avec les mains.','Déplie doucement le genou sans tirer ni forcer l’étirement.'],{floor:true,unilateral:true,measure:'seconds',seconds:30,rest:20});
  ex('landing','Réception contrôlée · petit saut','plyo','jump',['bodyweight'],lower,['Uniquement si tu pratiques déjà les sauts sans symptôme.','Fais un petit saut vertical, réceptionne doucement et stabilise avant de recommencer.'],{measure:'contacts',impact:true,level:2,min:3,max:5,rest:90});
  ex('pogo','Petits rebonds de cheville','plyo','jump',['bodyweight'],lower,['Petits rebonds, posture stable, contacts maîtrisés.','Arrête dès que les réceptions se dégradent ; pas de course au nombre de sauts.'],{measure:'contacts',impact:true,level:2,min:6,max:10,rest:90});
  ex('lateral-hop','Petit saut latéral et stabilisation','plyo','jump',['court'],lower,['Petit déplacement latéral, réception stable sur deux pieds.','Marque un arrêt entre les sauts. La qualité compte davantage que la distance.'],{measure:'contacts',impact:true,level:2,min:3,max:5,rest:90});
  ex('dribble','Dribble de contrôle','basket','handle',['ball'],['wrist','elbow','shoulder','hip','knee','back'],['Sur place, alterne main droite et main gauche.','Garde progressivement le regard devant toi sans perdre le contrôle.'],{measure:'seconds',seconds:40,rest:30});
  ex('weak-hand','Dribble · main non dominante','basket','handle',['ball'],['wrist','elbow','shoulder','hip','knee','back'],['Commence lentement avec ta main non dominante.','Change la hauteur du rebond sans accélérer au détriment du contrôle.'],{measure:'seconds',seconds:40,rest:30});
  ex('crossover','Changements de main sur place','basket','handle',['ball'],['wrist','elbow','shoulder','hip','knee','back'],['Alterne les mains devant toi, pieds stables.','Augmente la fluidité avant la vitesse. Note les pertes de balle.'],{measure:'seconds',seconds:40,rest:30});
  ex('form-shoot','Tir proche du panier','basket','shoot',['ball','hoop'],upper.concat(lower),['Choisis un repère proche et conserve-le pour comparer tes séances.','Garde une routine identique. Compte les tentatives et les réussites.'],{measure:'shots',min:10,max:10,seconds:120,rest:45});
  ex('free-throw','Lancers francs','basket','shoot',['ball','hoop'],upper.concat(lower),['Même placement et même routine sur chaque tir.','Saisis réussites et tentatives, sans modifier la distance pendant le bloc.'],{measure:'shots',min:10,max:10,seconds:120,rest:45});
  ex('spot-shoot','Tir à un repère fixe','basket','shoot',['ball','hoop','court'],upper.concat(lower),['Choisis un seul repère et note sa distance.','Garde le même type de tir pour que le résultat soit comparable.'],{measure:'shots',min:10,max:10,seconds:150,rest:45});
  ex('layup','Finition · main non dominante','basket','finish',['ball','hoop','court'],upper.concat(lower),['Approche lente, appuis maîtrisés, finition avec la main non dominante.','Reviens en marchant entre les tentatives.'],{measure:'shots',impact:true,level:2,min:6,max:6,seconds:120,rest:60});
  ex('pivot','Pivots et protection du ballon','basket','footwork',['ball','court'],upper.concat(lower),['Choisis un pied de pivot, tourne lentement sans le déplacer.','Protège le ballon et alterne le pied de pivot au bloc suivant.'],{measure:'seconds',seconds:30,rest:40});
  ex('defense','Pas défensifs contrôlés','basket','footwork',['court'],lower,['Petit trajet latéral dégagé.','Déplace-toi sans croiser les pieds, avec une amplitude maîtrisée.'],{measure:'seconds',seconds:25,rest:45,level:2});
  ex('reaction','Dribble sur signal sonore','basket','react',['ball'],['wrist','elbow','shoulder','hip','knee','back'],['Au signal « droite » ou « gauche », change de main.','Reste sur place. Ajuste la cadence au contrôle du ballon.'],{measure:'seconds',seconds:40,rest:40,audio:true});
  ex('pass','Passes à deux','basket','react',['ball','partner','court'],upper.concat(lower),['À distance confortable, passe à hauteur de poitrine.','Le partenaire indique la main cible. Privilégie la précision.'],{measure:'seconds',seconds:45,rest:30});
  ex('incline','Développé incliné · haltères','strength','push',['dumbbells','bench'],upper,['Banc légèrement incliné, pieds stables.','Descends avec contrôle et conserve une marge de répétitions.'],{weighted:'dumbbells'});
  ex('overhead-triceps','Extension triceps au-dessus de la tête','strength','arms',['dumbbells'],['shoulder','elbow','wrist','back'],['Tiens un haltère à deux mains, en position stable.','Fléchis puis tends les coudes sans cambrer ; ne force pas l’amplitude.'],{weighted:'dumbbells',singleLoad:true});
  ex('copenhagen','Copenhagen sur genou','strength','core',['bench'],['shoulder','elbow','back','hip','knee'],['Genou supérieur en appui sur un banc stable, avant-bras au sol.','Soulève doucement le bassin. Exercice exigeant : ne pas utiliser pour tester une douleur à l’aine.'],{level:2,measure:'seconds',seconds:20,unilateral:true,floor:true});
  ex('kb-swing','Swing kettlebell','strength','hinge',['kettlebell'],lower.concat('shoulder','wrist'),['À réserver à une technique déjà apprise.','Propulse par les hanches, bras souples, dos stable. Termine avant la perte de contrôle.'],{weighted:'kettlebell',level:2,min:10,max:15});
  ex('band-shuffle','Pas latéraux · élastique','strength','squat',['bands','court'],lower,['Élastique autour des jambes, légère flexion confortable.','Fais de petits pas latéraux contrôlés sans laisser rentrer les genoux.'],{measure:'seconds',seconds:30});
  ex('halo','Halo kettlebell','strength','core',['kettlebell'],['shoulder','elbow','wrist','neck','back'],['Charge légère, pieds stables.','Fais passer la kettlebell autour de la tête sans forcer les épaules ni bouger le tronc.'],{weighted:'kettlebell',level:2,unilateral:true,min:6,max:8});
  ex('breath','Respiration diaphragmatique','mobility','mobility',['bodyweight'],[],['Installe-toi confortablement.','Inspire doucement, puis expire sans apnée ni effort forcé.'],{measure:'seconds',seconds:60,rest:15});
  ex('dips','Dips sur banc','strength','arms',['bench'],['shoulder','elbow','wrist','back'],['Banc stable, pieds proches pour moduler la difficulté.','Garde une amplitude courte et contrôlée. Arrête à toute gêne de l’épaule.'],{level:2,min:6,max:10});

  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const dateKey = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const dayDiff = (a,b) => Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);
  const bounded = (v,min,max) => Number.isFinite(Number(v)) && v !== '' && v !== null && Number(v)>=min && Number(v)<=max;
  const isoDay = v => typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0,10)===v;
  function initialState() {
    return {version:VERSION,profile:{onboarded:false,name:'',age:'',height:'',weight:'',goal:'balanced',experience:'beginner',weeklyTarget:3,impactReady:false,safeties:false,basketLevel:'beginner'},owned:['bodyweight'],loads:{},preferences:{likes:[],avoids:[],anchors:[]},checkIn:{date:dateKey(),energy:'normal',motivation:'normal',minutes:30,equipment:['bodyweight'],focus:'muscle',format:'auto',novelty:'balanced',constraints:[],basketSkill:'shoot'},symptoms:[],events:[],sessions:[],measurements:[],customExercises:[],savedWorkouts:[],draft:null,programWeek:1};
  }
  function assert(condition,message) { if (!condition) throw new Error(message); }
  function validateState(value) {
    assert(value && typeof value==='object' && !Array.isArray(value) && value.version===VERSION,'Version de sauvegarde non reconnue.');
    const s=clone(value); const base=initialState();
    assert(s.profile && typeof s.profile==='object' && !Array.isArray(s.profile),'Profil invalide.');
    for(const key of ['sessions','symptoms','events','measurements','customExercises','savedWorkouts','owned']) assert(Array.isArray(s[key]),`Données invalides : ${key}.`);
    assert(s.sessions.length<20000 && s.customExercises.length<500 && s.events.length<10000,'Sauvegarde trop volumineuse.');
    assert(s.owned.every(id=>equipment.some(e=>e.id===id)),'Matériel inconnu.');
    assert(s.checkIn && equipmentIds(s.checkIn.equipment) && bounded(s.checkIn.minutes,5,180),'Préparation de séance invalide.');
    assert(s.preferences && ['likes','avoids','anchors'].every(k=>Array.isArray(s.preferences[k]) && s.preferences[k].every(x=>typeof x==='string')),'Préférences invalides.');
    assert(s.loads && typeof s.loads==='object' && !Array.isArray(s.loads),'Charges invalides.');
    Object.entries(s.loads).forEach(([key,values])=>assert(equipment.some(e=>e.id===key) && Array.isArray(values) && values.length<200 && values.every(n=>bounded(n,0.1,1500)),'Paliers de charge invalides.'));
    ['age','height','weight'].forEach(k=>assert(s.profile[k]==='' || bounded(s.profile[k],1,k==='age'?110:350),'Mesure de profil invalide.'));
    s.sessions.forEach(x=>{assert(typeof x.id==='string' && isoDay(x.date) && typeof x.title==='string' && bounded(x.minutes,0,1440) && x.entries && typeof x.entries==='object' && !Array.isArray(x.entries) && Array.isArray(x.exercises),'Séance enregistrée invalide.');validateEntries(x.entries);});
    s.symptoms.forEach(x=>assert(typeof x.id==='string' && regions[x.region] && typeof x.active==='boolean' && bounded(x.severity,0,10) && isoDay(x.date),'Signalement de douleur invalide.'));
    s.events.forEach(x=>assert(typeof x.id==='string' && isoDay(x.date) && ['match','club','other'].includes(x.type) && typeof x.title==='string','Événement invalide.'));
    s.measurements.forEach(x=>assert(isoDay(x.date) && (x.weight==='' || bounded(x.weight,1,350)) && (x.waist==='' || bounded(x.waist,1,300)),'Mensuration invalide.'));
    s.customExercises.forEach(x=>assert(typeof x.id==='string' && x.id.startsWith('custom-') && typeof x.name==='string' && x.name.length<160 && equipmentIds(x.needs) && Array.isArray(x.regions) && x.regions.length>0 && x.regions.every(r=>regions[r]) && Array.isArray(x.instructions) && x.instructions.every(t=>typeof t==='string') && patterns[x.pattern] && ['strength','cardio','basket','mobility','plyo'].includes(x.kind) && ['reps','seconds','shots','contacts'].includes(x.measure) && bounded(x.min,1,100) && bounded(x.max,x.min,100) && bounded(x.seconds,1,3600) && bounded(x.rest,0,600),'Exercice personnel invalide.'));
    if(s.draft) { assert(typeof s.draft.id==='string' && Array.isArray(s.draft.exercises) && s.draft.exercises.length<100 && s.draft.entries && typeof s.draft.entries==='object' && ['preview','active'].includes(s.draft.status),'Séance en cours invalide.'); validateEntries(s.draft.entries); }
    assert(bounded(s.programWeek,1,12),'Semaine invalide.');
    return {...base,...s,profile:{...base.profile,...s.profile}};
  }
  function validateEntries(entries) {
    Object.values(entries).forEach(rows=>{assert(Array.isArray(rows) && rows.length<200,'Séries invalides.');rows.forEach(r=>{
      assert(r && typeof r==='object' && typeof r.done==='boolean','Résultat invalide.');
      for(const key of ['reps','left','right','weight','seconds','attempts','made','rir','losses']) if(r[key]!==undefined && r[key]!=='' && r[key]!==null) assert(bounded(r[key],0,key==='rir'?10:10000),'Résultat numérique invalide.');
      if(r.made!=='' && r.attempts!=='' && r.made!=null && r.attempts!=null) assert(Number(r.made)<=Number(r.attempts),'Plus de réussites que de tentatives.');
    });});
  }
  function equipmentIds(ids) {return Array.isArray(ids) && ids.every(id=>equipment.some(e=>e.id===id));}
  function allExercises(state) {return catalog.concat(state.customExercises||[]);}
  function activeSymptoms(state) {return state.symptoms.filter(s=>s.active);}
  function safety(state) {
    const active=activeSymptoms(state);
    return {blocked:active.some(s=>s.redFlags || Number(s.severity)>=7),active,regions:[...new Set(active.map(s=>s.region))]};
  }
  function context(state, check=state.checkIn, now=dateKey()) {
    const recent=state.sessions.filter(s=>dayDiff(now,s.date)>=0 && dayDiff(now,s.date)<=2);
    const upcoming=state.events.filter(e=>!e.completed && dayDiff(e.date,now)>=0 && dayDiff(e.date,now)<=1 && ['match','club'].includes(e.type));
    const active=safety(state);
    const recentLegs=recent.some(s=>s.focus==='basket' || s.source==='external' && ['match','club'].includes(s.eventType) || s.exercises.some(e=>['squat','hinge','jump'].includes(e.pattern) && (s.entries[e.id]||[]).some(r=>r.done)));
    const last=[...state.sessions].sort((a,b)=>b.date.localeCompare(a.date))[0];
    const returning=!!last && dayDiff(now,last.date)>10 || state.profile.experience==='returning';
    const low=check.energy==='low' || returning || state.sessions.some(s=>dayDiff(now,s.date)>=0 && dayDiff(now,s.date)<=2 && s.nextDay==='worse');
    return {now,recent,upcoming,active,low,returning,protectLegs:upcoming.length>0 || recentLegs,avoidImpact:active.active.length>0 || upcoming.length>0 || recentLegs || low || !state.profile.impactReady || state.profile.experience==='beginner'};
  }
  function allowed(exercise,state,check=state.checkIn,ctx=context(state,check)) {
    if(ctx.active.blocked) return false;
    if(!exercise.needs.every(id=>id==='bodyweight'||check.equipment.includes(id))) return false;
    if(exercise.regions.some(r=>ctx.active.regions.includes(r))) return false;
    if(exercise.impact && (ctx.avoidImpact || check.constraints.includes('no-impact') || check.constraints.includes('quiet'))) return false;
    if(exercise.floor && check.constraints.includes('no-floor')) return false;
    if(exercise.level>1 && state.profile.experience==='beginner') return false;
    if(exercise.needsSafety && !state.profile.safeties) return false;
    if(state.preferences.avoids.includes(exercise.id)) return false;
    if(ctx.low && ['bike-interval','defense'].includes(exercise.id)) return false;
    return true;
  }
  function exposure(state,days=14,now=dateKey()) {
    const counts={};
    state.sessions.filter(s=>dayDiff(now,s.date)>=0 && dayDiff(now,s.date)<days).forEach(s=>s.exercises.forEach(e=>{const n=(s.entries[e.id]||[]).filter(r=>r.done && !r.pain).length;counts[e.pattern]=(counts[e.pattern]||0)+n;}));
    return counts;
  }
  function chooseFormat(check,ctx) {
    if(['basket','mobility','plyo','cardio'].includes(check.focus)) return 'classic';
    if(ctx.low || ctx.active.active.length) return 'classic';
    if(check.format!=='auto') return check.format;
    return check.focus==='mixed'?'circuit':check.minutes<25?'superset':'classic';
  }
  function makePrescription(e,format,minutes,ctx) {
    const sets=ctx.low?2:minutes>=35?3:2;
    const timed=['hiit','emom'].includes(format);
    return {...clone(e),sets:timed?3:sets,rest:e.kind==='plyo'?90:format==='hiit'?30:format==='emom'?30:e.rest,
      seconds:e.kind==='cardio' && format==='classic'?Math.max(60,Math.floor((minutes*60-300)/sets)):timed?30:e.seconds,
      measure:timed?'seconds':e.measure,targetMin:e.min,targetMax:e.max,format,pinned:false};
  }
  function estimateSeconds(exercises,format) {
    if(!exercises.length) return 0;
    let total=0;
    exercises.forEach((e,i)=>{
      const work=e.measure==='seconds'?e.seconds:e.measure==='shots'?e.seconds:(e.targetMax||e.max)*3*(e.unilateral?2:1);
      const rest=format==='superset' && i%2===0 && i+1<exercises.length?15:e.rest;
      total+=(work*(e.unilateral && e.measure==='seconds'?2:1)+rest)*e.sets+20;
    });
    return total;
  }
  function generate(state,check=state.checkIn,{random=Math.random,exclude=[],pinned=[],now=dateKey()}={}) {
    const ctx=context(state,check,now), format=chooseFormat(check,ctx);
    if(ctx.active.blocked) return {error:'Douleur importante ou signe inhabituel : la génération est suspendue. Demande un avis médical avant de reprendre.'};
    const pool=allExercises(state).filter(e=>allowed(e,state,check,ctx) && !exclude.includes(e.id));
    let kinds=check.focus==='basket'?['basket']:check.focus==='mobility'?['mobility']:check.focus==='plyo'?['plyo']:check.focus==='cardio'?['cardio']:check.focus==='mixed'?['strength','cardio']:['strength'];
    let candidates=pool.filter(e=>kinds.includes(e.kind) && (check.focus!=='core' || e.pattern==='core'));
    const counts=exposure(state,14,now);
    const last=state.sessions[state.sessions.length-1];
    const score=e=>{
      let n=random()* (check.novelty==='discover'?5:2);
      if(state.preferences.likes.includes(e.id)) n+=2;
      if(state.preferences.anchors.includes(e.id)) n+=4;
      n+=Math.max(0,4-(counts[e.pattern]||0))*.5;
      if(ctx.protectLegs && ['squat','hinge','calf'].includes(e.pattern)) n-=8;
      if(check.focus==='basket' && e.pattern===check.basketSkill) n+=6;
      if(last && last.exercises.some(x=>x.id===e.id) && !state.preferences.anchors.includes(e.id)) n-=check.novelty==='familiar'?0:2;
      return n;
    };
    candidates=candidates.map(e=>({e,score:score(e)})).sort((a,b)=>b.score-a.score).map(x=>x.e);
    const count=check.focus==='cardio'?1:Math.max(1,Math.min(check.focus==='plyo'?3:5,Math.floor(check.minutes/7)));
    const selected=pinned.filter(e=>allowed(e,state,check,ctx)).map(e=>({...e,pinned:true}));
    while(selected.length<count && candidates.length){
      const candidate=candidates.find(e=>!selected.some(x=>x.id===e.id) && (!selected.some(x=>x.pattern===e.pattern)||check.focus==='basket'||check.focus==='core'||check.focus==='mobility'||check.focus==='plyo')) || candidates.find(e=>!selected.some(x=>x.id===e.id));
      if(!candidate) break;
      selected.push(makePrescription(candidate,format,Number(check.minutes),ctx));
      candidates=candidates.filter(e=>e.id!==candidate.id);
    }
    if(!selected.length) return {error:'Aucun exercice compatible avec ce matériel et tes contraintes. Modifie le matériel ou l’intention ; ne contourne pas une douleur.'};
    const warmupSeconds=check.minutes<=10?120:300;
    const budget=Math.max(120,check.minutes*60-warmupSeconds-60);
    if(!['amrap','emom'].includes(format)) {
      while(estimateSeconds(selected,format)>budget && selected.some(e=>e.sets>1 && !e.pinned)) {
        const e=[...selected].reverse().find(e=>e.sets>1&&!e.pinned);e.sets--;
      }
      while(estimateSeconds(selected,format)>budget && selected.length>1 && selected.some(e=>!e.pinned)) selected.splice(selected.map(e=>e.pinned).lastIndexOf(false),1);
    }
    const titles={muscle:'Construire de la force',core:'Un gainage solide',basket:'Un geste de plus pour ton jeu',plyo:'Explosivité, avec contrôle',mobility:'Retrouver de l’aisance',cardio:'Prendre un peu d’air',mixed:'Bouger à ta façon'};
    const reasons=[`${equipment.filter(e=>check.equipment.includes(e.id)).map(e=>e.label).join(', ')||'Poids du corps'}.`];
    if(ctx.upcoming.length) reasons.push(`${ctx.upcoming[0].title} approche : priorité à la fraîcheur, pas aux impacts.`);
    else if(ctx.protectLegs) reasons.push('Les jambes ont déjà travaillé récemment : impacts écartés et priorité aux autres mouvements.');
    if(ctx.low) reasons.push(ctx.returning?'Reprise : moins de volume, aucune hausse automatique de charge.':'Énergie basse : séance allégée, sans HIIT imposé.');
    if(ctx.active.active.length) reasons.push('Les mouvements sollicitant les zones signalées sont écartés. Cela ne garantit pas l’absence de douleur.');
    if(format!==check.format && check.format!=='auto' && ['muscle','mixed','core'].includes(check.focus)) reasons.push('Le format demandé a été remplacé par des séries contrôlées compte tenu du contexte.');
    return {id:uid(),title:titles[check.focus],source:'generated',focus:check.focus,format,exercises:selected,check:clone(check),reasons,warmupSeconds,blockSeconds:['amrap','emom'].includes(format)?Math.floor(budget/60)*60:null,estimatedMinutes:Math.ceil((warmupSeconds+60+(['amrap','emom'].includes(format)?Math.floor(budget/60)*60:estimateSeconds(selected,format)))/60),status:'preview',entries:{},createdAt:new Date().toISOString()};
  }
  function alternatives(exercise,state,check,exclude=[]) {
    const ctx=context(state,check);
    return allExercises(state).filter(e=>e.id!==exercise.id && !exclude.includes(e.id) && e.pattern===exercise.pattern && allowed(e,state,check,ctx));
  }
  function fromProgram(program,week,letter,state,check=state.checkIn) {
    const source=program.blocks[Math.floor((week-1)/4)][letter],ctx=context(state,check);
    if(ctx.active.blocked) return {error:'Une douleur importante ou un signe inhabituel empêche de lancer une séance. Demande un avis médical.'};
    const mapping={p2a1:['db-squat','bb-squat','goblet','squat'],p2a2:week>8?['rdl']:['deadlift','rdl','kb-deadlift'],p2a3:['pogo'],p2a4:['copenhagen','side-plank'],b2a3:['landing'],p3a3:['landing'],p2b1:week>8?['incline']:['db-press','bb-press','floor-press'],p2b2:['bb-row','db-row','band-row','cable-row'],p2b3:['db-shoulder'],p2b4:['carry'],b2b4:['carry'],p2b5:['lateral'],p2b6:['curl'],p2b7:['overhead-triceps','triceps'],p2c1:['db-lunge','reverse-lunge'],p2c2:['pushup'],b2c2:['pushup'],p2c3:['kb-swing'],p2c4:['band-shuffle','defense'],p2d1:['incline','db-press'],p2d2:['db-row','bb-row','band-row'],p2d3:['lateral'],p2d4:['curl'],p2dc1:['halo'],p2dc2:['pallof'],p2dc3:['breath'],p2d5:['bike-interval','bike'],p3c4:['bike-interval','bike']};
    const exercises=[],changes=[];
    source.supersets.forEach((group,groupIndex)=>group.exercises.forEach(original=>{
      const candidate=(mapping[original.id]||[]).map(id=>catalog.find(e=>e.id===id)).find(e=>e && allowed(e,state,check,ctx));
      if(!candidate) {changes.push(`${original.name} : écarté (matériel, niveau ou contraintes).`);return;}
      const p=makePrescription(candidate,'superset',check.minutes,ctx);
      const volume=original.volume.replace(/×/g,'x'),sets=volume.match(/^(\d+)\s*x/i),reps=volume.match(/(?:x\s*|^)(\d+)(?:-(\d+))?/i);
      p.sets=ctx.low?2:sets?Math.min(6,Number(sets[1])):3;
      if(reps && ['reps','contacts'].includes(p.measure)){p.targetMin=Number(reps[1]);p.targetMax=Number(reps[2]||reps[1]);}
      const seconds=volume.match(/(?:x\s*|^)(\d+)(?:-(\d+))?\s*(sec|min)/i);
      if(seconds && p.measure==='seconds')p.seconds=Number(seconds[1])*(seconds[3]==='min'?60:1);
      p.rest=Math.max(candidate.rest,group.rest||0);p.programGroup=groupIndex;p.originalName=original.name;p.originalVolume=original.volume;p.legacyId=original.id;
      // A completed calendar week is never permission to add impacts or chase failure.
      if(week===12)p.sets=Math.min(2,p.sets);
      if(candidate.kind==='plyo'){p.targetMax=Math.min(candidate.max,p.targetMax);p.targetMin=Math.min(candidate.min,p.targetMin);}
      if(original.name!==candidate.name)changes.push(`${original.name} → ${candidate.name}.`);
      if(!exercises.some(e=>e.id===p.id))exercises.push(p);
      if(original.id==='p2d4') {
        const triceps=catalog.find(e=>e.id==='triceps');
        if(allowed(triceps,state,check,ctx))exercises.push({...makePrescription(triceps,'superset',check.minutes,ctx),sets:p.sets,programGroup:groupIndex,originalName:'Curl marteau + Dips sur banc',originalVolume:original.volume});
        else changes.push('Le second mouvement du duo bras est écarté : pas de variante compatible.');
      }
    }));
    if(!exercises.length)return {error:'Aucun mouvement de cette séance n’est compatible aujourd’hui. Choisis une autre séance ou adapte ton matériel.'};
    return {id:uid(),title:`Séance ${letter} · ${source.sub}`,source:'program',programWeek:week,programLetter:letter,focus:'muscle',format:'superset',exercises,check:clone(check),reasons:['Ton programme conservé, avec des mouvements précis et des charges suivies séparément.',...changes],warmupSeconds:300,estimatedMinutes:Math.ceil((estimateSeconds(exercises,'superset')+360)/60),status:'preview',entries:{},createdAt:new Date().toISOString()};
  }
  function recordsFor(state,exercise) {
    return state.sessions.filter(s=>s.format==='classic'||s.format==='superset').map(s=>({session:s,ex:s.exercises.find(e=>e.id===exercise.id),rows:(s.entries[exercise.id]||[]).filter(r=>r.done)})).filter(x=>x.ex && x.rows.length).sort((a,b)=>b.session.date.localeCompare(a.session.date)||String(b.session.completedAt).localeCompare(String(a.session.completedAt)));
  }
  function loadAdvice(exercise,state,check=state.checkIn,now=dateKey()) {
    if(!exercise.weighted || exercise.measure!=='reps' || !['classic','superset'].includes(exercise.format||'classic')) return null;
    const ctx=context(state,check,now), records=recordsFor(state,exercise);
    if(!allowed(exercise,state,check,ctx)) return {action:'blocked',value:null,text:'Mouvement écarté avec les contraintes actuelles.'};
    const latest=records[0];
    if(!latest) return {action:'calibrate',value:null,text:'Première référence : choisis une charge maîtrisée, puis renseigne tes répétitions et ta marge.'};
    const loaded=latest.rows.filter(r=>bounded(r.weight,.1,1500));
    if(!loaded.length) return {action:'calibrate',value:null,text:'Aucune charge réellement enregistrée sur cet exercice.'};
    const last=Number(loaded[loaded.length-1].weight),levels=[...new Set((state.loads[exercise.weighted]||[]).map(Number))].sort((a,b)=>a-b);
    if(latest.rows.some(r=>r.pain) || latest.session.nextDay==='worse') return {action:'review',value:null,text:'Douleur ou aggravation signalée : pas de progression. Réévalue le mouvement avant de le reprendre.'};
    if(ctx.low || dayDiff(now,latest.session.date)>14) return {action:'recheck',value:null,text:`Ancien repère : ${last} kg. Reprise ou fatigue : réévalue une charge maîtrisée à l’échauffement.`};
    const missed=latest.rows.some(r=>r.result==='missed');
    if(missed) {
      const failedStrength=latest.rows.filter(r=>r.result==='missed').every(r=>r.reason==='strength');
      if(failedStrength && records[1] && records[1].rows.some(r=>r.result==='missed' && r.reason==='strength')) {
        const lower=levels.filter(n=>n<last).pop();
        return {action:'reduce',value:lower??null,text:lower?`Difficulté de force répétée : proposition à ${lower} kg, à confirmer à l’échauffement.`:'Difficulté répétée : choisis un palier inférieur maîtrisé ; renseigne tes charges disponibles.'};
      }
      return {action:'hold',value:last,text:'Objectif incomplet : conserve le repère et vérifie repos, fatigue et technique avant de changer la charge.'};
    }
    const successful=x=>x && !x.session.partial && !x.session.nextDayPending && x.session.nextDay!=='worse' && x.rows.length>=(x.ex.sets||1) && x.rows.every(r=>!r.pain && r.result==='passed' && r.rir!=='' && r.rir!=null && Number(r.rir)>=2 && Number(r.weight)===last && (x.ex.unilateral?Math.min(Number(r.left),Number(r.right)):Number(r.reps))>=(exercise.targetMax||exercise.max));
    const targetSame=x=>x && (x.ex.targetMin||x.ex.min)===(exercise.targetMin||exercise.min) && (x.ex.targetMax||x.ex.max)===(exercise.targetMax||exercise.max) && x.ex.sets===exercise.sets;
    if(targetSame(latest) && targetSame(records[1]) && successful(latest) && successful(records[1])) {
      const next=levels.find(n=>n>last);
      if(next && (next-last)/last<=.1) return {action:'increase',value:next,text:`Deux séances au haut de la fourchette, avec de la marge : essaie ${next} kg à la prochaine séance, si l’échauffement le confirme.`};
      return {action:'hold',value:last,text:next?'Le prochain palier est trop grand pour une petite hausse : consolide cette charge.':'Objectif maîtrisé. Ajoute tes paliers disponibles pour proposer une hausse réaliste.'};
    }
    return {action:'hold',value:last,text:'Consolide les répétitions avec une technique maîtrisée. Une case cochée ne suffit pas pour augmenter.'};
  }
  function schedule(exercises,format) {
    const out=[];
    if(['superset','circuit','hiit','emom','amrap'].includes(format)) {
      const groups=format==='superset'?Array.from({length:Math.ceil(exercises.length/2)},(_,i)=>exercises.slice(i*2,i*2+2)):[exercises];
      groups.forEach(group=>{for(let r=0;r<Math.max(...group.map(e=>e.sets));r++) group.forEach((e,i)=>{if(r<e.sets)out.push({id:e.id,set:r,rest:format==='superset' && i<group.length-1?15:format==='circuit' && i<group.length-1?15:e.rest});});});
    } else exercises.forEach(e=>{for(let r=0;r<e.sets;r++)out.push({id:e.id,set:r,rest:e.rest});});
    return out;
  }
  function newRows(e) {return Array.from({length:e.sets},()=>({done:false,reps:'',left:'',right:'',weight:'',seconds:'',attempts:'',made:'',rir:'',losses:'',result:'',reason:'',pain:false}));}
  function startDraft(plan,state) {
    const entries={};plan.exercises.forEach(e=>{entries[e.id]=newRows(e);const advice=loadAdvice(e,state,plan.check);if(advice && advice.value!=null)entries[e.id].forEach(r=>r.weight=String(advice.value));});
    return {...clone(plan),status:'active',date:dateKey(),startedAt:Date.now(),elapsedBase:0,clockStarted:Date.now(),entries,cursor:0,timer:null,warmupDone:false,rounds:'',extraReps:'',scoreNote:''};
  }
  function validateRow(row,e) {
    if(row.pain) return '';
    if(e.measure==='reps'||e.measure==='contacts') {
      if(e.unilateral ? !bounded(row.left,1,1000)||!bounded(row.right,1,1000) : !bounded(row.reps,1,1000)) return 'Renseigne les répétitions réellement faites.';
      if(e.weighted && !bounded(row.weight,.1,1500)) return 'Renseigne la charge utilisée.';
      if(!row.result) return 'Indique si l’objectif est passé.';
      if(row.result==='missed' && !row.reason) return 'Indique ce qui a limité la série.';
    }
    if(e.measure==='seconds' && !bounded(row.seconds,1,10000)) return 'Renseigne le temps réellement effectué.';
    if(e.measure==='shots' && (!bounded(row.attempts,1,1000)||!bounded(row.made,0,Number(row.attempts)))) return 'Vérifie les réussites et les tentatives.';
    return '';
  }
  function finishDraft(draft,{effort,liked,notes='',now=Date.now()}={}) {
    const done=Object.values(draft.entries).flat().filter(r=>r.done&&!r.pain).length;
    const elapsed=Math.max(0,draft.elapsedBase+(draft.clockStarted?(now-draft.clockStarted)/1000:0));
    if(!done && !(['amrap','emom'].includes(draft.format) && Number(draft.rounds)>0)) return {error:'Aucun effort enregistré. Reprends la séance ou abandonne le brouillon sans créer de séance fictive.'};
    return {...clone(draft),status:'finished',completedAt:new Date(now).toISOString(),minutes:Math.round(elapsed/6)/10,effort:effort||null,liked:liked??null,notes,partial:done<Object.values(draft.entries).flat().length,nextDay:'unknown',nextDayPending:true,timer:null,clockStarted:null};
  }
  function weeklySummary(state,now=dateKey()) {
    const monday=new Date(`${now}T12:00:00`);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    const start=dateKey(monday),sessions=state.sessions.filter(s=>s.date>=start && s.date<=now);
    return {sessions:sessions.length,minutes:Math.round(sessions.reduce((n,s)=>n+s.minutes,0)),target:Number(state.profile.weeklyTarget)||3,exposure:exposure(state,14,now)};
  }
  function exportBundle(state,legacy={}) {return {app:'Rehaab',exportedAt:new Date().toISOString(),state:validateState(state),legacy};}
  function importBundle(raw) {const bundle=JSON.parse(raw);assert(bundle.app==='Rehaab','Ce fichier n’est pas une sauvegarde Rehaab récente.');return {state:validateState(bundle.state),legacy:bundle.legacy && typeof bundle.legacy==='object'?bundle.legacy:{}};}
  return {VERSION,STORAGE_KEY,equipment,regions,patterns,formats,catalog,clone,uid,dateKey,dayDiff,bounded,isoDay,initialState,validateState,validateRow,allExercises,activeSymptoms,safety,context,allowed,exposure,generate,alternatives,fromProgram,loadAdvice,schedule,newRows,startDraft,finishDraft,weeklySummary,exportBundle,importBundle,estimateSeconds,makePrescription};
});
