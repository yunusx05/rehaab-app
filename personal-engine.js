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
  const legacyExercises = [];
  function ex(id,name,kind,pattern,needs,body,instructions,options={}) {
    const target=kind==='basket'?legacyExercises:catalog;
    target.push({id,name,kind,pattern,needs,regions:body,instructions,level:1,impact:false,measure:'reps',sets:3,min:8,max:12,rest:75,seconds:40,weighted:false,...options});
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
  ex('incline','Développé incliné · haltères','strength','push',['dumbbells','bench'],upper,['Banc légèrement incliné, pieds stables.','Descends avec contrôle et conserve une marge de répétitions.'],{weighted:'dumbbells'});
  ex('overhead-triceps','Extension triceps au-dessus de la tête','strength','arms',['dumbbells'],['shoulder','elbow','wrist','back'],['Tiens un haltère à deux mains, en position stable.','Fléchis puis tends les coudes sans cambrer ; ne force pas l’amplitude.'],{weighted:'dumbbells',singleLoad:true});
  ex('copenhagen','Copenhagen sur genou','strength','core',['bench'],['shoulder','elbow','back','hip','knee'],['Genou supérieur en appui sur un banc stable, avant-bras au sol.','Soulève doucement le bassin. Exercice exigeant : ne pas utiliser pour tester une douleur à l’aine.'],{level:2,measure:'seconds',seconds:20,unilateral:true,floor:true});
  ex('kb-swing','Swing kettlebell','strength','hinge',['kettlebell'],lower.concat('shoulder','wrist'),['À réserver à une technique déjà apprise.','Propulse par les hanches, bras souples, dos stable. Termine avant la perte de contrôle.'],{weighted:'kettlebell',level:2,min:10,max:15});
  ex('band-shuffle','Pas latéraux · élastique','strength','squat',['bands','court'],lower,['Élastique autour des jambes, légère flexion confortable.','Fais de petits pas latéraux contrôlés sans laisser rentrer les genoux.'],{measure:'seconds',seconds:30});
  ex('halo','Halo kettlebell','strength','core',['kettlebell'],['shoulder','elbow','wrist','neck','back'],['Charge légère, pieds stables.','Fais passer la kettlebell autour de la tête sans forcer les épaules ni bouger le tronc.'],{weighted:'kettlebell',level:2,unilateral:true,min:6,max:8});
  ex('breath','Respiration diaphragmatique','mobility','mobility',['bodyweight'],[],['Installe-toi confortablement.','Inspire doucement, puis expire sans apnée ni effort forcé.'],{measure:'seconds',seconds:60,rest:15});
  ex('dips','Dips sur banc','strength','arms',['bench'],['shoulder','elbow','wrist','back'],['Banc stable, pieds proches pour moduler la difficulté.','Garde une amplitude courte et contrôlée. Arrête à toute gêne de l’épaule.'],{level:2,min:6,max:10});
  // --- Catalogue étendu : force, stabilité, équilibre, mobilité, conditionnement. Aucun média requis. ---
  ex('knee-pushup','Pompes sur genoux','strength','push',['bodyweight'],upper,['Genoux au sol, mains sous les épaules, bassin aligné avec le buste.','Descends avec contrôle sans creuser le bas du dos, puis repousse.'],{floor:true,min:8,max:15});
  ex('incline-pushup','Pompes mains surélevées','strength','push',['bench'],upper,['Mains sur un banc stable, corps aligné de la tête aux talons.','Plus le support est haut, plus le mouvement est accessible.'],{min:8,max:15});
  ex('decline-pushup','Pompes pieds surélevés','strength','push',['bench'],upper,['Pieds sur un banc stable, mains au sol sous les épaules.','Garde le bassin aligné. Arrête la série dès que l’alignement se dégrade.'],{level:2,min:5,max:10});
  ex('diamond-pushup','Pompes prise serrée','strength','arms',['bodyweight'],upper,['Mains rapprochées sous la poitrine, coudes près du buste.','Descends avec contrôle. Exigeant pour les poignets et les coudes.'],{level:2,min:4,max:10});
  ex('wide-pushup','Pompes prise large','strength','push',['bodyweight'],upper,['Mains un peu plus larges que les épaules.','Descends dans une amplitude confortable pour les épaules.'],{min:6,max:12});
  ex('tempo-pushup','Pompes lentes','strength','push',['bodyweight'],upper,['Compte trois secondes à la descente.','Marque une pause en bas sans t’affaisser, puis repousse.'],{min:4,max:8});
  ex('scap-pushup','Pompes scapulaires','strength','push',['bodyweight'],['shoulder','elbow','wrist','back'],['En position de planche, bras tendus et verrouillés.','Rapproche puis écarte les omoplates sans plier les coudes.'],{min:8,max:12,rest:45});
  ex('pike-pushup','Pompes en V','strength','push',['bodyweight'],upper,['Bassin haut, mains et pieds au sol, tête entre les bras.','Fléchis les coudes vers l’avant, dans une amplitude confortable pour l’épaule.'],{level:2,min:5,max:10});
  ex('band-pushup','Pompes avec résistance élastique','strength','push',['bands','bodyweight'],upper,['Élastique passé dans le dos, extrémités sous les mains.','Vérifie l’état de l’élastique avant chaque série.'],{level:2,min:5,max:10});
  ex('band-press','Développé poitrine · élastique','strength','push',['bands'],upper,['Élastique ancré derrière toi à hauteur de poitrine.','Pousse les mains vers l’avant sans hausser les épaules.'],{min:10,max:15});
  ex('cable-press','Développé poitrine · poulie','strength','push',['cable'],upper,['Règle les poulies à hauteur de poitrine, un pied légèrement avancé.','Pousse vers l’avant et reviens avec contrôle.'],{weighted:'cable',min:8,max:12});
  ex('db-fly','Écartés · haltères','strength','push',['dumbbells','bench'],upper,['Allongé sur le banc, coudes légèrement fléchis et fixes.','Ouvre les bras dans une amplitude confortable, charge légère.'],{weighted:'dumbbells',min:10,max:15,isolation:true});
  ex('cable-fly','Écartés · poulie','strength','push',['cable'],upper,['Poulies réglées à hauteur d’épaule, coudes fixes.','Rapproche les mains devant toi sans à-coup.'],{weighted:'cable',min:10,max:15,isolation:true});
  ex('bb-ohp','Développé militaire · barre','strength','push',['barbell'],upper.concat('back'),['Debout, barre à hauteur de clavicules, abdominaux engagés.','Pousse au-dessus de la tête sans cambrer. Ne cherche pas l’échec en solo.'],{weighted:'barbell',level:2,min:5,max:8});
  ex('kb-press','Développé épaules · kettlebell','strength','push',['kettlebell'],upper,['Kettlebell calée contre l’avant-bras, poignet droit.','Pousse d’un bras sans laisser le buste basculer.'],{weighted:'kettlebell',unilateral:true,level:2,min:5,max:10});
  ex('arnold-press','Développé rotatif · haltères','strength','push',['dumbbells'],upper,['Paumes vers toi en bas, rotation progressive vers l’avant en montant.','Charge modérée : la rotation demande du contrôle.'],{weighted:'dumbbells',level:2,min:8,max:12});
  ex('band-ohp','Développé épaules · élastique','strength','push',['bands'],upper,['Élastique sous les pieds, mains à hauteur d’épaules.','Pousse vers le haut sans cambrer le bas du dos.'],{min:10,max:15});
  ex('push-press','Développé avec impulsion · haltères','strength','push',['dumbbells'],upper.concat(lower),['Petite flexion de jambes, puis extension pour lancer la charge.','Reçois la charge bras tendus avec contrôle. Technique avant charge.'],{weighted:'dumbbells',level:2,min:5,max:8});
  ex('front-raise','Élévations frontales','strength','push',['dumbbells'],['shoulder','elbow','wrist'],['Bras tendus devant toi, charge légère.','Monte jusqu’à hauteur d’épaules sans balancer le buste.'],{weighted:'dumbbells',min:10,max:15,isolation:true});
  ex('band-lateral','Élévations latérales · élastique','strength','push',['bands'],['shoulder','elbow','wrist'],['Élastique sous les pieds, coudes légèrement fléchis.','Ouvre les bras à hauteur confortable, sans élan.'],{min:12,max:20,isolation:true});
  ex('close-grip-press','Développé couché prise serrée','strength','arms',['barbell','bench'],upper,['Mains à largeur d’épaules, coudes près du buste.','Utilise des sécurités ou un pareur. Garde une marge de répétitions.'],{weighted:'barbell',level:2,needsSafety:true,min:6,max:10});
  ex('chinup','Tractions supination','strength','pull',['pullup'],upper,['Paumes vers toi, vérifie la fixation de la barre.','Monte sans élan, redescends avec contrôle jusqu’aux bras tendus.'],{level:2,min:3,max:8});
  ex('neutral-pullup','Tractions prise neutre','strength','pull',['pullup'],upper,['Paumes face à face si la barre le permet.','Prise souvent plus confortable pour l’épaule. Descente contrôlée.'],{level:2,min:3,max:8});
  ex('inverted-row','Rowing inversé sous barre','strength','pull',['pullup'],upper.concat('hip'),['Barre basse, corps aligné, talons au sol.','Tire la poitrine vers la barre. Plus le corps est horizontal, plus c’est difficile.'],{min:6,max:12});
  ex('scap-pullup','Tractions scapulaires','strength','pull',['pullup'],upper,['Suspendu bras tendus, épaules relâchées vers le haut.','Abaisse les épaules sans plier les coudes, puis relâche lentement.'],{min:6,max:10,rest:45});
  ex('dead-hang','Suspension à la barre','strength','pull',['pullup'],upper,['Suspendu bras tendus, épaules engagées.','Descends dès que la prise se dégrade. Ne force pas un temps record.'],{measure:'seconds',seconds:20,rest:60});
  ex('bb-row-underhand','Rowing supination · barre','strength','pull',['barbell'],upper.concat('hip'),['Paumes vers l’avant, buste incliné depuis les hanches.','Tire vers le bas du ventre, dos stable, sans lancer la charge.'],{weighted:'barbell',level:2,min:6,max:10});
  ex('kb-row','Rowing · kettlebell','strength','pull',['kettlebell'],upper,['Buste incliné, main libre en appui sur la cuisse.','Tire le coude vers la hanche sans tourner le buste.'],{weighted:'kettlebell',unilateral:true,min:8,max:12});
  ex('chest-supported-row','Rowing buste appuyé','strength','pull',['dumbbells','bench'],upper,['Poitrine posée sur un banc incliné, bras pendants.','Le buste appuyé retire l’effort du bas du dos. Tire les coudes vers l’arrière.'],{weighted:'dumbbells',min:8,max:12});
  ex('band-pulldown','Tirage vertical · élastique','strength','pull',['bands'],upper,['Élastique ancré en hauteur, vérifie la solidité de l’ancrage.','Tire vers le haut de la poitrine sans hausser les épaules.'],{min:10,max:15});
  ex('cable-row-single','Tirage horizontal un bras · poulie','strength','pull',['cable'],upper,['Une seule poignée, buste stable et gainé.','Tire le coude vers la hanche sans laisser tourner le tronc.'],{weighted:'cable',unilateral:true,min:8,max:12});
  ex('facepull','Face pull · élastique','strength','pull',['bands'],['shoulder','elbow','wrist','back'],['Élastique ancré à hauteur de visage.','Tire les mains vers le front, coudes hauts, sans hausser les épaules.'],{min:12,max:20});
  ex('facepull-cable','Face pull · poulie','strength','pull',['cable'],['shoulder','elbow','wrist','back'],['Corde réglée à hauteur de visage, charge légère.','Écarte les mains en fin de tirage, sans à-coup.'],{weighted:'cable',min:12,max:20});
  ex('band-pullapart','Écartés · élastique','strength','pull',['bands'],['shoulder','elbow','wrist','back'],['Élastique tendu devant toi, bras tendus.','Écarte les mains en gardant les épaules basses.'],{min:12,max:20,isolation:true});
  ex('rear-delt-fly','Oiseau · haltères','strength','pull',['dumbbells'],['shoulder','elbow','wrist','back'],['Buste incliné vers l’avant, charge légère.','Ouvre les bras sur les côtés sans relever le buste.'],{weighted:'dumbbells',min:12,max:20,isolation:true});
  ex('db-pullover','Pull-over · haltère','strength','pull',['dumbbells','bench'],upper,['Allongé, un haltère tenu à deux mains au-dessus de la poitrine.','Descends derrière la tête seulement dans ton amplitude confortable.'],{weighted:'dumbbells',singleLoad:true,min:10,max:15});
  ex('straight-arm-pulldown','Pull-over bras tendus · poulie','strength','pull',['cable'],upper,['Bras tendus devant toi, buste légèrement incliné.','Ramène la barre vers les cuisses sans plier les coudes.'],{weighted:'cable',min:10,max:15,isolation:true});
  ex('shrug','Haussements d’épaules · haltères','strength','pull',['dumbbells'],['shoulder','back','neck','wrist'],['Haltères le long du corps, bras relâchés.','Monte les épaules verticalement, sans rotation ni à-coup.'],{weighted:'dumbbells',min:10,max:15,isolation:true});
  ex('bb-shrug','Haussements d’épaules · barre','strength','pull',['barbell'],['shoulder','back','neck','wrist'],['Barre devant les cuisses, bras tendus.','Monte les épaules sans tirer avec les bras ni pencher la tête.'],{weighted:'barbell',min:8,max:12,isolation:true});
  ex('box-squat','Squat sur banc','strength','squat',['bench'],lower,['Banc stable derrière toi, pieds à largeur confortable.','Assieds-toi avec contrôle, marque un temps, puis relève-toi.'],{min:8,max:12});
  ex('split-squat','Fente statique','strength','squat',['bodyweight'],lower,['Un pied devant, un pied derrière, appuis stables.','Descends verticalement sans avancer le genou au-delà du confort.'],{unilateral:true,min:6,max:12});
  ex('bulgarian','Fente bulgare','strength','squat',['bench'],lower,['Pied arrière posé sur un banc stable, pied avant assez loin.','Descends verticalement. Exercice exigeant pour l’équilibre.'],{level:2,unilateral:true,min:5,max:10});
  ex('db-bulgarian','Fente bulgare · haltères','strength','squat',['dumbbells','bench'],lower.concat('wrist'),['Haltères le long du corps, pied arrière sur le banc.','Descends avec contrôle. Commence léger avant d’ajouter de la charge.'],{weighted:'dumbbells',level:2,unilateral:true,min:5,max:10});
  ex('front-squat','Squat avant · barre','strength','squat',['barbell'],lower.concat('shoulder','wrist'),['Barre posée sur les épaules devant, coudes hauts.','Utilise un rack avec sécurités. Buste droit, descente contrôlée.'],{weighted:'barbell',level:2,needsSafety:true,min:5,max:8});
  ex('kb-front-squat','Squat frontal · kettlebell','strength','squat',['kettlebell'],lower.concat('shoulder','wrist'),['Kettlebell calée contre l’avant-bras, coude près du buste.','Descends avec contrôle, talons au sol.'],{weighted:'kettlebell',min:8,max:12});
  ex('goblet-db','Goblet squat · haltère','strength','squat',['dumbbells'],lower.concat('shoulder','wrist'),['Un haltère tenu verticalement contre la poitrine.','Descends avec contrôle, buste droit, sans décoller les talons.'],{weighted:'dumbbells',singleLoad:true,min:8,max:15});
  ex('lateral-lunge','Fente latérale','strength','squat',['bodyweight'],lower,['Grand pas sur le côté, l’autre jambe reste tendue.','Fléchis la hanche du côté chargé, pieds à plat.'],{unilateral:true,min:6,max:10});
  ex('cossack','Squat cosaque','strength','squat',['bodyweight'],lower,['Pieds très écartés, descends d’un côté en gardant l’autre jambe tendue.','Amplitude progressive : ne force pas l’aine ni le genou.'],{level:2,unilateral:true,min:4,max:8});
  ex('curtsy-lunge','Fente croisée','strength','squat',['bodyweight'],lower,['Recule un pied en diagonale derrière l’autre.','Reste stable sur la jambe avant. Amplitude modérée.'],{level:2,unilateral:true,min:6,max:10});
  ex('step-up','Montée sur banc','strength','squat',['bench'],lower,['Banc stable à hauteur confortable, pied entier posé dessus.','Monte en poussant sur la jambe haute, redescends avec contrôle.'],{unilateral:true,min:6,max:12});
  ex('db-step-up','Montée sur banc · haltères','strength','squat',['dumbbells','bench'],lower.concat('wrist'),['Haltères le long du corps, banc stable.','Pousse sur la jambe haute sans t’aider d’un élan de l’autre pied.'],{weighted:'dumbbells',level:2,unilateral:true,min:5,max:10});
  ex('walking-lunge','Fentes marchées','strength','squat',['court'],lower,['Trajet dégagé de quelques mètres.','Avance d’un pas contrôlé à chaque répétition, buste droit.'],{unilateral:true,min:6,max:12});
  ex('wall-sit','Chaise au mur','strength','squat',['bodyweight'],lower,['Dos au mur, cuisses à l’angle que tu tiens sans douleur.','Respire normalement. Termine dès que la position se dégrade.'],{measure:'seconds',seconds:30,rest:60});
  ex('band-squat','Squat avec élastique','strength','squat',['bands'],lower,['Élastique sous les pieds, extrémités aux épaules.','Descends avec contrôle. La résistance augmente en fin de mouvement.'],{min:10,max:15});
  ex('assisted-pistol','Squat sur une jambe assis-debout','strength','squat',['bench'],lower,['Assieds-toi sur un banc sur une seule jambe, l’autre tendue devant.','Relève-toi sans élan. Utilise un appui léger si nécessaire.'],{level:2,unilateral:true,min:3,max:8});
  ex('legpress-single','Presse à jambes · une jambe','strength','squat',['legpress'],lower,['Un seul pied centré sur la plateforme, charge nettement réduite.','Pousse sans verrouiller le genou brutalement.'],{weighted:'legpress',level:2,unilateral:true,min:8,max:12});
  ex('single-rdl','Soulevé de terre une jambe','strength','hinge',['bodyweight'],lower,['Un appui, l’autre jambe part vers l’arrière.','Bascule depuis la hanche, dos stable. La stabilité passe avant l’amplitude.'],{unilateral:true,min:5,max:10});
  ex('db-single-rdl','Soulevé de terre une jambe · haltère','strength','hinge',['dumbbells'],lower.concat('wrist'),['Un haltère dans la main opposée à la jambe d’appui.','Descends en gardant hanches et épaules alignées.'],{weighted:'dumbbells',singleLoad:true,level:2,unilateral:true,min:5,max:10});
  ex('bb-rdl','Soulevé de terre roumain · barre','strength','hinge',['barbell'],lower.concat('wrist'),['Barre proche des jambes, genoux légèrement fléchis.','Recule les hanches sans arrondir le dos, puis redresse-toi.'],{weighted:'barbell',level:2,min:6,max:10});
  ex('kb-rdl','Soulevé de terre roumain · kettlebell','strength','hinge',['kettlebell'],lower.concat('wrist'),['Kettlebell tenue à deux mains devant les cuisses.','Recule les hanches, dos stable, puis reviens debout.'],{weighted:'kettlebell',min:8,max:12});
  ex('sumo-deadlift','Soulevé de terre sumo','strength','hinge',['barbell'],lower.concat('wrist'),['Pieds larges, mains à l’intérieur des genoux.','Pousse le sol, dos stable. Ne cherche pas la charge maximale.'],{weighted:'barbell',level:2,min:5,max:8});
  ex('good-morning','Bonjour · barre','strength','hinge',['barbell'],lower.concat('shoulder'),['Barre sur le haut du dos, charge légère.','Bascule depuis les hanches dans une amplitude maîtrisée.'],{weighted:'barbell',level:2,min:8,max:12});
  ex('band-hinge','Tirage entre les jambes · élastique','strength','hinge',['bands'],lower,['Élastique ancré bas derrière toi, passé entre les jambes.','Recule les hanches puis reviens debout en serrant les fessiers.'],{min:10,max:15});
  ex('hip-thrust','Hip thrust au banc','strength','hinge',['bench'],['hip','knee','back'],['Haut du dos appuyé sur un banc stable, pieds au sol.','Monte le bassin sans cambrer, marque une pause en haut.'],{min:10,max:15});
  ex('db-hip-thrust','Hip thrust · haltère','strength','hinge',['dumbbells','bench'],['hip','knee','back','wrist'],['Haltère posé sur le bassin, tenu à deux mains.','Monte sans cambrer. Place la charge avec un appui, jamais en force.'],{weighted:'dumbbells',singleLoad:true,min:8,max:12});
  ex('bb-hip-thrust','Hip thrust · barre','strength','hinge',['barbell','bench'],['hip','knee','back','wrist'],['Barre protégée sur le bassin, haut du dos sur le banc.','Monte le bassin en poussant dans les talons, sans cambrer.'],{weighted:'barbell',level:2,min:6,max:10});
  ex('single-bridge','Pont fessier une jambe','strength','hinge',['bodyweight'],['hip','knee','back'],['Un pied au sol, l’autre jambe levée.','Monte le bassin sans le laisser tourner. Amplitude maîtrisée.'],{floor:true,unilateral:true,min:6,max:12});
  ex('glute-kickback','Extension de hanche · élastique','strength','hinge',['bands'],['hip','knee','back'],['Élastique autour de la cheville, ancré bas devant toi.','Recule la jambe sans cambrer le bas du dos.'],{unilateral:true,min:10,max:15,isolation:true});
  ex('back-extension','Extension du dos au banc','strength','hinge',['bench'],['back','hip'],['Bassin calé sur un banc stable, pieds bloqués ou tenus.','Remonte jusqu’à l’alignement, sans hyperextension.'],{level:2,min:8,max:12});
  ex('nordic-assisted','Flexion nordique assistée','strength','hinge',['partner','bodyweight'],['knee','hip','back'],['À genoux, chevilles tenues par un partenaire, sur une surface molle.','Descends très lentement et rattrape-toi avec les mains. Exercice exigeant.'],{floor:true,level:2,min:3,max:6,rest:120});
  ex('single-calf','Montées sur pointes une jambe','strength','calf',['bodyweight'],['ankle','knee'],['Un appui, l’autre pied décollé, main posée sur un support.','Monte et descends lentement, sans rebond.'],{unilateral:true,min:8,max:15});
  ex('db-calf','Montées sur pointes · haltères','strength','calf',['dumbbells'],['ankle','knee','wrist'],['Haltères le long du corps, appui stable.','Monte le talon complètement, redescends avec contrôle.'],{weighted:'dumbbells',min:10,max:15});
  ex('seated-calf','Mollets assis · haltères','strength','calf',['dumbbells','bench'],['ankle','knee'],['Assis, haltères posés sur les cuisses près des genoux.','Monte les talons lentement. Cible le mollet profond.'],{weighted:'dumbbells',min:12,max:20});
  ex('calf-hold','Maintien sur pointes','strength','calf',['bodyweight'],['ankle','knee'],['Monte sur la pointe des pieds, appui léger à portée de main.','Tiens la position sans osciller. Redescends avant de perdre l’équilibre.'],{measure:'seconds',seconds:30,rest:45});
  ex('tibialis','Relevés de pointes','strength','calf',['bodyweight'],['ankle','knee'],['Talons au sol, dos éventuellement appuyé contre un mur.','Relève les pointes de pieds lentement, puis redescends.'],{min:12,max:20});
  ex('bb-curl','Curl · barre','strength','arms',['barbell'],['elbow','wrist','shoulder'],['Barre tenue en supination, coudes près du buste.','Monte sans balancer le dos, redescends avec contrôle.'],{weighted:'barbell',min:8,max:12});
  ex('incline-curl','Curl incliné · haltères','strength','arms',['dumbbells','bench'],['elbow','wrist','shoulder'],['Assis sur un banc incliné, bras pendants vers l’arrière.','Charge légère : l’étirement du biceps est plus important.'],{weighted:'dumbbells',level:2,min:8,max:12,isolation:true});
  ex('concentration-curl','Curl concentré','strength','arms',['dumbbells','bench'],['elbow','wrist','shoulder'],['Assis, coude calé contre l’intérieur de la cuisse.','Monte sans bouger le coude, descente lente.'],{weighted:'dumbbells',singleLoad:true,unilateral:true,min:10,max:15,isolation:true});
  ex('reverse-curl','Curl prise pronation','strength','arms',['dumbbells'],['elbow','wrist','shoulder'],['Paumes vers le bas, charge nettement plus légère.','Monte sans casser les poignets.'],{weighted:'dumbbells',min:10,max:15,isolation:true});
  ex('band-curl','Curl · élastique','strength','arms',['bands'],['elbow','wrist','shoulder'],['Élastique sous les pieds, coudes près du buste.','Monte lentement, résiste à la descente.'],{min:12,max:20});
  ex('cable-curl','Curl · poulie','strength','arms',['cable'],['elbow','wrist','shoulder'],['Poulie basse, coudes fixes contre le buste.','Tension continue : inutile de charger lourd.'],{weighted:'cable',min:10,max:15,isolation:true});
  ex('skullcrusher','Extension triceps allongé','strength','arms',['dumbbells','bench'],['elbow','wrist','shoulder'],['Allongé, haltères au-dessus de la poitrine, coudes fixes.','Descends vers le front ou légèrement derrière, sans écarter les coudes.'],{weighted:'dumbbells',level:2,min:8,max:12,isolation:true});
  ex('db-kickback','Extension triceps arrière','strength','arms',['dumbbells'],['elbow','wrist','shoulder','back'],['Buste incliné, coude remonté et fixe contre le flanc.','Tends le bras vers l’arrière sans bouger le coude.'],{weighted:'dumbbells',unilateral:true,min:10,max:15,isolation:true});
  ex('cable-triceps','Extension triceps · poulie','strength','arms',['cable'],['elbow','wrist','shoulder'],['Poulie haute, coudes fixes contre le buste.','Tends les bras vers le bas sans hausser les épaules.'],{weighted:'cable',min:10,max:15,isolation:true});
  ex('wrist-curl','Flexion des poignets','strength','arms',['dumbbells'],['wrist','elbow'],['Avant-bras posés sur les cuisses, paumes vers le haut.','Charge très légère, amplitude courte et lente.'],{weighted:'dumbbells',min:12,max:20,isolation:true});
  ex('wrist-extension','Extension des poignets','strength','arms',['dumbbells'],['wrist','elbow'],['Avant-bras posés, paumes vers le bas.','Relève lentement les poignets. Charge minimale.'],{weighted:'dumbbells',min:12,max:20,isolation:true});
  ex('grip-hold','Maintien de charge','strength','arms',['dumbbells'],['wrist','elbow','shoulder'],['Haltères le long du corps, debout et stable.','Tiens jusqu’à la limite de ta prise, pose les charges avec contrôle.'],{weighted:'dumbbells',measure:'seconds',seconds:30,rest:60});
  ex('hollow-hold','Position creuse','strength','core',['bodyweight'],['back','hip','shoulder'],['Allongé, bas du dos plaqué au sol, bras et jambes tendus.','Monte les bras et les jambes seulement tant que le dos reste plaqué.'],{floor:true,measure:'seconds',seconds:20,rest:60});
  ex('plank-shoulder-tap','Planche avec touches d’épaule','strength','core',['bodyweight'],['shoulder','elbow','back','hip'],['En planche bras tendus, pieds légèrement écartés.','Touche une épaule à la fois sans laisser le bassin tourner.'],{floor:true,min:8,max:16});
  ex('plank-reach','Planche avec bras tendu','strength','core',['bodyweight'],['shoulder','elbow','back','hip'],['En planche sur les avant-bras, corps aligné.','Avance un bras devant toi sans bouger le bassin.'],{floor:true,unilateral:true,min:5,max:10});
  ex('side-plank-full','Gainage latéral jambes tendues','strength','core',['bodyweight'],['shoulder','elbow','back','hip'],['Coude sous l’épaule, jambes tendues et superposées.','Épaules et hanches alignées. Termine si la position s’affaisse.'],{floor:true,level:2,unilateral:true,measure:'seconds',seconds:25,rest:60});
  ex('side-plank-lift','Gainage latéral avec montées de bassin','strength','core',['bodyweight'],['shoulder','elbow','back','hip','knee'],['Position de gainage latéral, bassin légèrement descendu.','Remonte le bassin lentement sans basculer vers l’avant.'],{floor:true,level:2,unilateral:true,min:6,max:12});
  ex('bird-dog','Bird dog','strength','core',['bodyweight'],['back','hip','shoulder','knee'],['À quatre pattes, dos neutre.','Tends un bras et la jambe opposée sans creuser ni tourner le bassin.'],{floor:true,unilateral:true,min:6,max:12});
  ex('bear-hold','Position de l’ours','strength','core',['bodyweight'],['shoulder','wrist','back','hip','knee'],['À quatre pattes, genoux décollés de quelques centimètres.','Garde le dos immobile et respire. Repose les genoux avant de perdre la position.'],{floor:true,measure:'seconds',seconds:20,rest:60});
  ex('bear-crawl','Déplacement de l’ours','strength','core',['court'],['shoulder','wrist','back','hip','knee'],['Genoux décollés, trajet dégagé.','Avance bras et jambe opposés en gardant le bassin bas et stable.'],{level:2,measure:'seconds',seconds:25,rest:60});
  ex('leg-raise','Relevés de jambes au sol','strength','core',['bodyweight'],['back','hip'],['Allongé, mains sous les fessiers si besoin.','Descends les jambes seulement tant que le bas du dos reste plaqué.'],{floor:true,min:8,max:15});
  ex('reverse-crunch','Enroulement inversé','strength','core',['bodyweight'],['back','hip'],['Allongé, genoux fléchis au-dessus des hanches.','Enroule le bassin vers le haut sans élan de jambes.'],{floor:true,min:8,max:15});
  ex('hanging-knee-raise','Relevés de genoux suspendu','strength','core',['pullup'],upper.concat('hip'),['Suspendu à la barre, épaules engagées.','Monte les genoux sans balancer. Descends lentement.'],{level:2,min:5,max:12});
  ex('russian-twist','Rotations assises · kettlebell','strength','core',['kettlebell'],['back','hip','shoulder','wrist'],['Assis, buste incliné, talons au sol.','Tourne lentement d’un côté puis de l’autre. Charge légère.'],{weighted:'kettlebell',level:2,min:10,max:20});
  ex('cable-crunch','Enroulement à la poulie','strength','core',['cable'],['back','hip','shoulder'],['À genoux face à la poulie haute, corde tenue près du front.','Enroule le buste vers le bas sans tirer avec les bras.'],{weighted:'cable',min:10,max:15});
  ex('pallof-cable','Pallof press · poulie','strength','core',['cable'],['shoulder','wrist','back','hip'],['Poulie réglée à hauteur de poitrine, placée sur le côté.','Éloigne les mains du buste en résistant à la rotation.'],{weighted:'cable',unilateral:true,min:8,max:12});
  ex('suitcase-carry','Portée valise','strength','core',['dumbbells','court'],upper.concat(lower),['Un seul haltère, d’un seul côté, trajet dégagé.','Reste droit : c’est l’inclinaison qu’il faut empêcher, pas la charge qui compte.'],{weighted:'dumbbells',singleLoad:true,unilateral:true,measure:'seconds',seconds:30});
  ex('overhead-carry','Portée bras au-dessus de la tête','strength','core',['dumbbells','court'],upper.concat(lower),['Un haltère tenu bras tendu au-dessus de l’épaule.','Avance sans cambrer. Charge légère et trajet court.'],{weighted:'dumbbells',singleLoad:true,level:2,unilateral:true,measure:'seconds',seconds:25});
  ex('single-leg-stand','Équilibre sur une jambe','strength','core',['bodyweight'],['ankle','knee','hip'],['Appui proche d’un support, regard devant.','Tiens la position sans t’agripper. Repose le pied avant de basculer.'],{unilateral:true,measure:'seconds',seconds:30,rest:30});
  ex('single-leg-eyes','Équilibre sur une jambe, yeux fermés','strength','core',['bodyweight'],['ankle','knee','hip'],['Uniquement à côté d’un appui solide.','Ferme les yeux progressivement. Rouvre-les dès la moindre perte d’équilibre.'],{level:2,unilateral:true,measure:'seconds',seconds:15,rest:45});
  ex('single-leg-reach','Équilibre avec touche au sol','strength','core',['bodyweight'],['ankle','knee','hip','back'],['En appui sur une jambe, bascule depuis la hanche.','Touche le sol devant toi puis reviens droit, sans poser l’autre pied.'],{unilateral:true,min:5,max:10});
  ex('tandem-stand','Équilibre pieds alignés','strength','core',['bodyweight'],['ankle','knee','hip'],['Un pied directement devant l’autre, talon contre orteils.','Bras le long du corps si tu le peux. Support à portée de main.'],{unilateral:true,measure:'seconds',seconds:30,rest:30});
  ex('heel-toe-walk','Marche pied devant pied','strength','core',['court'],['ankle','knee','hip'],['Trajet dégagé, éventuellement le long d’un mur.','Pose le talon contre les orteils du pied précédent, sans précipitation.'],{measure:'seconds',seconds:40,rest:30});
  ex('airplane','Balance de l’avion','strength','hinge',['bodyweight'],lower.concat('shoulder'),['En appui sur une jambe, bras écartés.','Bascule le buste vers l’avant, jambe libre alignée derrière.'],{level:2,unilateral:true,measure:'seconds',seconds:20,rest:45});
  ex('monster-walk','Marche du monstre · élastique','strength','squat',['bands','court'],lower,['Élastique autour des cuisses ou des chevilles, légère flexion.','Avance en diagonale sans laisser rentrer les genoux.'],{measure:'seconds',seconds:30});
  ex('clamshell','Coquille · élastique','strength','hinge',['bands'],['hip','knee','back'],['Allongé sur le côté, genoux fléchis, élastique au-dessus des genoux.','Ouvre le genou supérieur sans basculer le bassin vers l’arrière.'],{floor:true,unilateral:true,min:12,max:20,isolation:true});
  ex('hip-abduction','Abduction de hanche debout · élastique','strength','hinge',['bands'],['hip','knee','back'],['Élastique autour des chevilles, appui léger d’une main.','Écarte la jambe sur le côté sans pencher le buste.'],{unilateral:true,min:12,max:20,isolation:true});
  ex('jumping-jack','Jumping jacks','cardio','cardio',['bodyweight'],lower.concat('shoulder'),['Surface adaptée, chaussures stables.','Garde une amplitude confortable et un rythme régulier.'],{measure:'seconds',seconds:30,rest:30,impact:true,level:2});
  ex('high-knees','Montées de genoux','cardio','cardio',['bodyweight'],lower,['Sur place, buste droit.','Monte les genoux à hauteur confortable, contacts légers.'],{measure:'seconds',seconds:25,rest:35,impact:true,level:2});
  ex('mountain-climber','Grimpeur','cardio','cardio',['bodyweight'],upper.concat(lower),['En appui bras tendus, corps aligné.','Ramène les genoux en alternance sans laisser le bassin monter.'],{floor:true,measure:'seconds',seconds:25,rest:35});
  ex('squat-thrust','Squat thrust','cardio','cardio',['bodyweight'],upper.concat(lower),['Mains au sol, recule les pieds en planche, puis reviens accroupi.','Sans saut : la version sautée est un burpee.'],{floor:true,measure:'seconds',seconds:30,rest:40});
  ex('burpee-nojump','Burpee sans saut','cardio','cardio',['bodyweight'],upper.concat(lower),['Descends en appui, planche, puis relève-toi en marchant les pieds.','Version sans impact. Garde un rythme que tu tiens sur toute la série.'],{floor:true,measure:'seconds',seconds:30,rest:45});
  ex('burpee','Burpee complet','cardio','cardio',['bodyweight'],upper.concat(lower),['Surface adaptée, espace dégagé.','Enchaîne descente, planche, retour et petit saut. Arrête avant la perte de contrôle.'],{floor:true,measure:'seconds',seconds:25,rest:60,impact:true,level:2});
  ex('skater','Pas du patineur','cardio','cardio',['court'],lower,['Petits déplacements latéraux, réception stable sur une jambe.','Marque l’équilibre à chaque appui. Amplitude progressive.'],{measure:'seconds',seconds:25,rest:45,impact:true,level:2});
  ex('shadow-box','Boxe dans le vide','cardio','cardio',['bodyweight'],upper.concat('hip'),['Garde les coudes souples, ne verrouille jamais les bras.','Alterne les côtés à un rythme régulier, appuis mobiles.'],{measure:'seconds',seconds:40,rest:30});
  ex('stair','Montées de marches','cardio','cardio',['outdoor'],lower,['Escalier éclairé, rampe à portée de main.','Monte à allure régulière, redescends en marchant.'],{measure:'seconds',seconds:120,rest:60,impact:true,level:2});
  ex('walk-hill','Marche rapide en côte','cardio','cardio',['outdoor'],lower,['Pente régulière, allure où tu peux encore parler.','Redescends en marchant tranquillement.'],{measure:'seconds',seconds:240,rest:60});
  ex('run-interval','Course · fractionné court','cardio','cardio',['outdoor'],lower,['Après un échauffement de marche et de course facile.','Accélère sans sprint maximal, puis récupère en marchant.'],{measure:'seconds',seconds:45,rest:90,impact:true,level:2});
  ex('rower-interval','Rameur · intervalles','cardio','cardio',['rower'],upper.concat(lower),['Échauffe-toi quelques minutes à allure facile.','Augmente la cadence sans casser l’ordre jambes-buste-bras.'],{measure:'seconds',seconds:40,rest:80,level:2});
  ex('box-jump-step','Saut sur banc, descente marchée','plyo','jump',['bench'],lower,['Banc bas et parfaitement stable. Uniquement sans symptôme.','Saute dessus, stabilise, puis redescends en marchant.'],{measure:'contacts',impact:true,level:2,min:3,max:6,rest:90});
  ex('broad-jump','Saut horizontal','plyo','jump',['court'],lower,['Espace dégagé, sol non glissant.','Saute vers l’avant et stabilise la réception avant de recommencer.'],{measure:'contacts',impact:true,level:2,min:3,max:5,rest:90});
  ex('split-jump','Fente sautée','plyo','jump',['bodyweight'],lower,['Uniquement si les fentes sont déjà indolores et maîtrisées.','Change de jambe en l’air, réception amortie et stable.'],{measure:'contacts',impact:true,level:2,min:3,max:6,rest:90});
  ex('depth-drop','Descente et réception','plyo','jump',['bench'],lower,['Depuis un support bas, descends sans sauter vers le haut.','Absorbe la réception et stabilise. La qualité prime sur la hauteur.'],{measure:'contacts',impact:true,level:2,min:3,max:5,rest:120});
  ex('worlds-greatest','Étirement complet en fente','mobility','mobility',['bodyweight'],['hip','knee','back','shoulder'],['Grande fente avant, main au sol à l’intérieur du pied.','Ouvre le buste vers le haut, sans forcer la rotation.'],{floor:true,unilateral:true,measure:'seconds',seconds:30,rest:20});
  ex('hip-90-90','Rotation de hanches assis','mobility','mobility',['bodyweight'],['hip','knee','back'],['Assis au sol, une jambe devant et une sur le côté, genoux à angle droit.','Bascule doucement d’un côté à l’autre, sans à-coup.'],{floor:true,measure:'seconds',seconds:40,rest:20});
  ex('childs-pose','Posture de l’enfant','mobility','mobility',['bodyweight'],['back','hip','shoulder','knee'],['À genoux, assieds-toi vers les talons, bras tendus devant.','Respire lentement. Sors de la position si les genoux tirent.'],{floor:true,measure:'seconds',seconds:45,rest:15});
  ex('downdog','Chien tête en bas','mobility','mobility',['bodyweight'],['shoulder','wrist','back','hip','ankle'],['Mains et pieds au sol, bassin poussé vers le haut.','Genoux légèrement fléchis si l’arrière des cuisses tire trop.'],{floor:true,measure:'seconds',seconds:40,rest:20});
  ex('pigeon','Posture du pigeon','mobility','mobility',['bodyweight'],['hip','knee','back'],['Une jambe repliée devant, l’autre tendue derrière.','Reste dans une tension supportable. Arrête si le genou est gêné.'],{floor:true,unilateral:true,measure:'seconds',seconds:40,rest:20});
  ex('deep-squat-hold','Maintien en squat profond','mobility','mobility',['bodyweight'],lower,['Descends à l’amplitude que tu contrôles, appui à portée de main.','Reste détendu et respire. Remonte avant que le dos ne s’arrondisse.'],{measure:'seconds',seconds:40,rest:25});
  ex('calf-stretch','Étirement du mollet au mur','mobility','mobility',['bodyweight'],['ankle','knee'],['Mains au mur, une jambe tendue derrière, talon au sol.','Avance le bassin doucement, sans décoller le talon.'],{unilateral:true,measure:'seconds',seconds:30,rest:20});
  ex('doorway-chest','Ouverture de poitrine à l’encadrement','mobility','mobility',['bodyweight'],['shoulder','elbow','back'],['Avant-bras contre un montant, coude à hauteur d’épaule.','Avance très légèrement le buste. Aucune douleur d’épaule.'],{unilateral:true,measure:'seconds',seconds:30,rest:20});
  ex('band-dislocate','Passages d’épaules · élastique','mobility','mobility',['bands'],['shoulder','elbow','wrist'],['Élastique tenu large devant toi, bras tendus.','Passe les bras au-dessus de la tête sans plier les coudes ni forcer.'],{measure:'seconds',seconds:40,rest:20});
  ex('quad-rotation','Rotation thoracique à quatre pattes','mobility','mobility',['bodyweight'],['shoulder','back','hip'],['À quatre pattes, une main derrière la nuque.','Ouvre le coude vers le plafond en suivant du regard.'],{floor:true,unilateral:true,measure:'seconds',seconds:30,rest:20});
  ex('neck-mob','Mobilité du cou','mobility','mobility',['bodyweight'],['neck','shoulder'],['Assis ou debout, épaules relâchées.','Tourne et incline lentement la tête dans une amplitude indolore.'],{measure:'seconds',seconds:40,rest:15});
  ex('wrist-mob','Mobilité des poignets','mobility','mobility',['bodyweight'],['wrist','elbow'],['À quatre pattes ou à genoux, mains posées au sol.','Fais lentement basculer le poids d’avant en arrière, sans douleur.'],{floor:true,measure:'seconds',seconds:40,rest:15});
  ex('hip-circles','Cercles de hanche','mobility','mobility',['bodyweight'],['hip','knee','back'],['En appui sur une jambe, main sur un support.','Dessine des cercles lents avec le genou levé, dans les deux sens.'],{unilateral:true,measure:'seconds',seconds:30,rest:20});

  ex('defense','Pas défensifs contrôlés','basket','footwork',['court'],lower,['Petit trajet latéral dégagé.','Déplace-toi sans croiser les pieds, avec une amplitude maîtrisée.'],{measure:'seconds',seconds:25,rest:45,level:2});

  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const dateKey = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const dayDiff = (a,b) => Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);
  const bounded = (v,min,max) => Number.isFinite(Number(v)) && v !== '' && v !== null && Number(v)>=min && Number(v)<=max;
  const isoDay = v => typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0,10)===v;
  function tryRequire(path) { try { return typeof require==='function'?require(path):null; } catch (e) { return null; } }
  function initialState() {
    return {version:VERSION,profile:{onboarded:false,name:'',age:'',height:'',weight:'',goal:'balanced',experience:'beginner',weeklyTarget:3,impactReady:false,safeties:false,basketLevel:'beginner'},owned:['bodyweight'],loads:{},preferences:{likes:[],avoids:[],anchors:[]},checkIn:{date:dateKey(),energy:'normal',motivation:'normal',minutes:30,equipment:['bodyweight'],focus:'muscle',format:'auto',novelty:'balanced',constraints:[],basketSkill:'shoot'},symptoms:[],events:[],sessions:[],measurements:[],customExercises:[],savedWorkouts:[],draft:null,programWeek:1,trash:[],program:null,programArchive:[],nutrition:null};
  }
  function assert(condition,message) { if (!condition) throw new Error(message); }
  function validateState(value) {
    assert(value && typeof value==='object' && !Array.isArray(value) && value.version===VERSION,'Version de sauvegarde non reconnue.');
    const s=clone(value); const base=initialState();
    if(s.checkIn?.focus==='basket')s.checkIn.focus='mixed';
    assert(s.profile && typeof s.profile==='object' && !Array.isArray(s.profile),'Profil invalide.');
    for(const key of ['sessions','symptoms','events','measurements','customExercises','savedWorkouts','owned']) assert(Array.isArray(s[key]),`Données invalides : ${key}.`);
    assert(s.sessions.length<20000 && s.customExercises.length<500 && s.events.length<10000,'Sauvegarde trop volumineuse.');
    assert(s.owned.every(id=>equipment.some(e=>e.id===id)),'Matériel inconnu.');
    assert(s.checkIn && equipmentIds(s.checkIn.equipment) && bounded(s.checkIn.minutes,5,180),'Préparation de séance invalide.');
    assert(s.preferences && ['likes','avoids','anchors'].every(k=>Array.isArray(s.preferences[k]) && s.preferences[k].every(x=>typeof x==='string')),'Préférences invalides.');
    assert(s.loads && typeof s.loads==='object' && !Array.isArray(s.loads),'Charges invalides.');
    Object.entries(s.loads).forEach(([key,values])=>assert(equipment.some(e=>e.id===key) && Array.isArray(values) && values.length<200 && values.every(n=>bounded(n,0.1,1500)),'Paliers de charge invalides.'));
    ['age','height','weight'].forEach(k=>assert(s.profile[k]==='' || bounded(s.profile[k],1,k==='age'?110:350),'Mesure de profil invalide.'));
    s.sessions.forEach(x=>{assert(typeof x.id==='string' && isoDay(x.date) && typeof x.title==='string' && bounded(x.minutes,0,1440) && x.entries && typeof x.entries==='object' && !Array.isArray(x.entries) && Array.isArray(x.exercises),'Séance enregistrée invalide.');assert(x.programInstanceId===undefined||x.programInstanceId===null||typeof x.programInstanceId==='string','Référence de programme invalide.');assert(x.programWeekIndex===undefined||bounded(x.programWeekIndex,1,52),'Semaine de programme invalide.');validateEntries(x.entries);});
    s.symptoms.forEach(x=>assert(typeof x.id==='string' && regions[x.region] && typeof x.active==='boolean' && bounded(x.severity,0,10) && isoDay(x.date),'Signalement de douleur invalide.'));
    s.events.forEach(x=>assert(typeof x.id==='string' && isoDay(x.date) && ['match','club','other'].includes(x.type) && typeof x.title==='string','Événement invalide.'));
    s.measurements.forEach(x=>assert(isoDay(x.date) && (x.weight==='' || bounded(x.weight,1,350)) && (x.waist==='' || bounded(x.waist,1,300)),'Mensuration invalide.'));
    s.customExercises.forEach(x=>assert(typeof x.id==='string' && x.id.startsWith('custom-') && typeof x.name==='string' && x.name.length<160 && equipmentIds(x.needs) && Array.isArray(x.regions) && x.regions.length>0 && x.regions.every(r=>regions[r]) && Array.isArray(x.instructions) && x.instructions.every(t=>typeof t==='string') && patterns[x.pattern] && ['strength','cardio','basket','mobility','plyo'].includes(x.kind) && ['reps','seconds','shots','contacts'].includes(x.measure) && bounded(x.min,1,100) && bounded(x.max,x.min,100) && bounded(x.seconds,1,3600) && bounded(x.rest,0,600),'Exercice personnel invalide.'));
    if(s.draft) { assert(typeof s.draft.id==='string' && Array.isArray(s.draft.exercises) && s.draft.exercises.length<100 && s.draft.entries && typeof s.draft.entries==='object' && ['preview','active'].includes(s.draft.status),'Séance en cours invalide.'); validateEntries(s.draft.entries); assert(s.draft.programInstanceId===undefined||typeof s.draft.programInstanceId==='string','Référence de programme invalide.'); assert(s.draft.programWeekIndex===undefined||bounded(s.draft.programWeekIndex,1,52),'Semaine de programme invalide.'); }
    assert(bounded(s.programWeek,1,12),'Semaine invalide.');
    // Nouvelles cles du lot « programmes » : absentes des anciennes sauvegardes, donc tolerees et completees.
    if(s.trash!==undefined && s.trash!==null) {
      assert(Array.isArray(s.trash) && s.trash.length<5000,'Corbeille invalide.');
      s.trash.forEach(x=>assert(x && typeof x==='object' && typeof x.id==='string','Séance retirée invalide.'));
    } else s.trash=[];
    if(s.programArchive!==undefined && s.programArchive!==null) assert(Array.isArray(s.programArchive) && s.programArchive.length<200,'Archive de programmes invalide.');
    else s.programArchive=[];
    const globals=typeof globalThis!=='undefined'?globalThis:{};
    const programs=globals.PersonalPrograms||tryRequire('./personal-programs.js');
    if(programs) {
      s.program=s.program?programs.validateProgram(s.program):null;
      s.programArchive=s.programArchive.map(p=>programs.validateProgram(p)).filter(Boolean);
    }
    const nutrition=globals.PersonalNutrition||tryRequire('./personal-nutrition.js');
    s.nutrition=nutrition?nutrition.validateNutrition(s.nutrition):(s.nutrition&&typeof s.nutrition==='object'&&!Array.isArray(s.nutrition)?s.nutrition:null);
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
    const hardRecently=recent.some(s=>Number(s.effort)>=8);
    const low=check.energy==='low' || returning || hardRecently || state.sessions.some(s=>dayDiff(now,s.date)>=0 && dayDiff(now,s.date)<=2 && s.nextDay==='worse');
    return {now,recent,upcoming,active,low,returning,hardRecently,protectLegs:upcoming.length>0 || recentLegs,avoidImpact:active.active.length>0 || upcoming.length>0 || recentLegs || low || !state.profile.impactReady || state.profile.experience==='beginner'};
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
    if(check.focus==='basket')check={...check,focus:'mixed'};
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
    const selected=pinned.filter(e=>e.kind!=='basket' && allowed(e,state,check,ctx)).map(e=>({...e,pinned:true}));
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
    if(ctx.low) reasons.push(ctx.returning?'Reprise : moins de volume, aucune hausse automatique de charge.':ctx.hardRecently?'Effort élevé récemment : volume allégé et format contrôlé.':'Énergie basse : séance allégée, sans HIIT imposé.');
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
      const candidate=(mapping[original.id]||[]).map(id=>(catalog.find(e=>e.id===id)||legacyExercises.find(e=>e.id===id))).find(e=>e && allowed(e,state,check,ctx));
      if(!candidate) {changes.push(`${original.name} : écarté (matériel, niveau ou contraintes).`);return;}
      const p=makePrescription(candidate,'superset',check.minutes,ctx);
      const volume=original.volume.replace(/×/g,'x'),sets=volume.match(/^(\d+)\s*x/i),reps=volume.match(/(?:x\s*|^)(\d+)(?:-(\d+))?/i);
      p.sets=sets?Math.min(6,Number(sets[1])):3;
      if(ctx.low)p.sets=Math.min(2,p.sets);
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
    return {...clone(plan),status:'active',date:dateKey(),startedAt:Date.now(),elapsedBase:0,clockStarted:Date.now(),entries,cursor:0,timer:{id:uid(),endAt:Date.now()+plan.warmupSeconds*1000,remaining:plan.warmupSeconds,duration:plan.warmupSeconds,kind:'warmup',label:'Échauffement'},stageElapsed:0,stageStarted:Date.now(),blockTimer:null,reviewing:false,warmupDone:false,rounds:'',extraReps:'',scoreNote:''};
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
