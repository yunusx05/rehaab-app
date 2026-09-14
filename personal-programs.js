/* Rehaab: multi-week program templates. Deterministic, no medical advice, no automatic load increase. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./personal-engine.js'));
  else root.PersonalPrograms = factory(root.PersonalTraining);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (PT) {
  'use strict';

  const VERSION = 1;
  const WEEK_CHOICES = [4, 8, 12];
  const DAY_CHOICES = [2, 3, 4, 5];
  const MINUTE_CHOICES = [15, 20, 30, 45, 60];

  // A slot describes an intent, not an exercise: the movement is resolved against the catalogue at launch.
  const slot = (role, pattern, options = {}) => ({role, pattern, ...options});
  const anchor = (pattern, prefer, options = {}) => slot('anchor', pattern, {prefer, ...options});
  const acc = (pattern, prefer, options = {}) => slot('accessory', pattern, {prefer, ...options});
  const fin = (pattern, prefer, options = {}) => slot('finisher', pattern, {prefer, ...options});
  const day = (key, name, slots) => ({key, name, slots});

  const phases = [
    {id:'adapt', name:'Adaptation', note:'Installer la technique et le rythme avant d’ajouter du volume.', setShift:-1, repShift:0, restShift:0},
    {id:'build', name:'Développement', note:'Volume de travail complet, charges toujours choisies par toi.', setShift:0, repShift:0, restShift:0},
    {id:'hold', name:'Consolidation', note:'Moins de répétitions, plus de qualité d’exécution et de repos.', setShift:0, repShift:-2, restShift:15},
    {id:'deload', name:'Allègement', note:'Semaine allégée volontairement : moins de séries, même technique.', setShift:-1, repShift:-2, restShift:0}
  ];
  const phaseById = id => phases.find(p => p.id === id) || phases[1];

  function phaseFor(week, weeks) {
    const w = Math.max(1, Math.min(Number(week) || 1, Number(weeks) || 1));
    const total = Math.max(1, Number(weeks) || 1);
    if (total >= 4 && w % 4 === 0) return phaseById('deload');
    const ratio = w / total;
    return ratio <= 1 / 3 ? phaseById('adapt') : ratio <= 2 / 3 ? phaseById('build') : phaseById('hold');
  }

  const families = [
    {
      id:'shred', label:'Shred · perte de gras', short:'Shred',
      summary:'Séances complètes avec un bloc de conditionnement à la fin, pour garder du muscle en déficit.',
      nutrition:'lose', focus:'mixed', format:'circuit', preferWeighted:true,
      dosage:{anchor:{sets:3, reps:[8,12], rest:75}, accessory:{sets:3, reps:[10,15], rest:60}, finisher:{sets:3, reps:[10,15], rest:45}},
      days:[
        day('A','Corps entier · poussée',[anchor('push',['db-press','floor-press','pushup','band-press']),acc('pull',['db-row','cable-row','band-row','inverted-row']),acc('squat',['goblet','db-squat','split-squat','squat']),acc('core',['plank','hollow-hold','deadbug']),fin('cardio',['rower','bike','march','mountain-climber'],{kind:'cardio'})]),
        day('B','Corps entier · tirage',[anchor('pull',['pulldown','bb-row','db-row','band-pulldown']),acc('hinge',['rdl','kb-deadlift','hip-thrust','bridge']),acc('push',['db-shoulder','pushup','band-ohp']),acc('core',['side-plank','pallof','bird-dog']),fin('cardio',['rower','stepjack','shadow-box','walk'],{kind:'cardio'})]),
        day('C','Bas du corps · circuit',[anchor('squat',['db-squat','goblet','legpress','squat']),acc('hinge',['single-rdl','rdl','legcurl','bridge']),acc('calf',['db-calf','calf','single-calf']),acc('core',['reverse-crunch','leg-raise','bear-hold']),fin('cardio',['bike','march','squat-thrust','walk'],{kind:'cardio'})]),
        day('D','Haut du corps · circuit',[anchor('push',['incline','db-press','pike-pushup','pushup']),acc('pull',['chest-supported-row','cable-row','band-row','inverted-row']),acc('arms',['curl','band-curl','triceps','diamond-pushup']),acc('core',['plank-shoulder-tap','hollow-hold','plank']),fin('cardio',['rower','shadow-box','march'],{kind:'cardio'})]),
        day('E','Conditionnement',[anchor('cardio',['bike-interval','rower-interval','run-interval','stepjack'],{kind:'cardio'}),acc('core',['russian-twist','plank-reach','deadbug']),acc('squat',['walking-lunge','lateral-lunge','wall-sit','squat']),fin('mobility',['worlds-greatest','hip-90-90','childs-pose'],{kind:'mobility'})])
      ]
    },
    {
      id:'bulk', label:'Bulk · prise de muscle', short:'Bulk',
      summary:'Découpage poussée / tirage / jambes, volume par groupe musculaire et repos longs.',
      nutrition:'gain', focus:'muscle', format:'classic', preferWeighted:true,
      dosage:{anchor:{sets:4, reps:[6,10], rest:120}, accessory:{sets:3, reps:[8,12], rest:90}, finisher:{sets:3, reps:[10,15], rest:60}},
      days:[
        day('A','Poussée',[anchor('push',['bb-press','db-press','floor-press','pushup']),acc('push',['incline','db-fly','cable-fly','wide-pushup']),acc('push',['db-shoulder','bb-ohp','arnold-press','pike-pushup']),acc('arms',['overhead-triceps','skullcrusher','cable-triceps','triceps']),fin('push',['lateral','band-lateral','front-raise'])]),
        day('B','Tirage',[anchor('pull',['pullup','pulldown','bb-row','db-row']),acc('pull',['cable-row','chest-supported-row','kb-row','band-row']),acc('pull',['rear-delt-fly','facepull','band-pullapart']),acc('arms',['bb-curl','curl','incline-curl','band-curl']),fin('core',['hanging-knee-raise','leg-raise','hollow-hold'])]),
        day('C','Jambes',[anchor('squat',['bb-squat','db-squat','legpress','goblet']),acc('hinge',['bb-rdl','rdl','legcurl','single-rdl']),acc('squat',['db-bulgarian','db-step-up','legextension','split-squat']),acc('calf',['db-calf','seated-calf','calf']),fin('core',['cable-crunch','reverse-crunch','plank'])]),
        day('D','Haut du corps',[anchor('push',['db-press','incline','bb-press','pushup']),anchor('pull',['bb-row','pulldown','db-row','inverted-row']),acc('push',['db-shoulder','arnold-press','band-ohp']),acc('arms',['curl','concentration-curl','band-curl']),fin('arms',['db-kickback','cable-triceps','triceps'])]),
        day('E','Bas du corps',[anchor('hinge',['deadlift','bb-rdl','rdl','kb-deadlift']),acc('squat',['front-squat','db-squat','legpress','goblet']),acc('hinge',['db-hip-thrust','hip-thrust','legcurl','single-bridge']),acc('calf',['seated-calf','db-calf','calf']),fin('core',['suitcase-carry','carry','side-plank'])])
      ]
    },
    {
      id:'fit', label:'Fit · forme générale', short:'Fit',
      summary:'Équilibre entre force, cardio léger et mobilité, sans séance épuisante.',
      nutrition:'maintain', focus:'mixed', format:'classic', preferWeighted:false,
      dosage:{anchor:{sets:3, reps:[8,12], rest:90}, accessory:{sets:3, reps:[10,15], rest:60}, finisher:{sets:2, reps:[10,15], rest:45}},
      days:[
        day('A','Corps entier · A',[anchor('push',['pushup','db-press','band-press','knee-pushup']),acc('pull',['band-row','inverted-row','db-row','cable-row']),acc('squat',['squat','goblet','box-squat','db-squat']),acc('core',['deadbug','plank','bird-dog']),fin('mobility',['cat','thoracic','childs-pose'],{kind:'mobility'})]),
        day('B','Corps entier · B',[anchor('hinge',['bridge','rdl','kb-deadlift','hip-thrust']),acc('push',['db-shoulder','band-ohp','wall-pushup','pushup']),acc('pull',['band-pulldown','cable-row','band-row']),acc('cardio',['walk','bike','march','rower'],{kind:'cardio'}),fin('mobility',['hamstring','hip-flexor','downdog'],{kind:'mobility'})]),
        day('C','Mobilité & gainage',[anchor('core',['plank','bird-dog','deadbug']),acc('core',['side-plank','pallof','bear-hold']),acc('calf',['calf','single-calf','tibialis']),acc('mobility',['worlds-greatest','hip-90-90','shoulder-mob'],{kind:'mobility'}),fin('mobility',['breath','childs-pose','neck-mob'],{kind:'mobility'})]),
        day('D','Corps entier · C',[anchor('squat',['split-squat','db-squat','squat','step-up']),acc('pull',['db-row','band-row','inverted-row']),acc('push',['incline-pushup','pushup','floor-press']),acc('core',['hollow-hold','plank-reach','deadbug']),fin('cardio',['march','stepjack','walk'],{kind:'cardio'})]),
        day('E','Cardio facile',[anchor('cardio',['walk','bike','rower','march'],{kind:'cardio'}),acc('core',['plank','deadbug','bird-dog']),acc('mobility',['calf-stretch','pigeon','quad-rotation'],{kind:'mobility'}),fin('mobility',['breath','childs-pose'],{kind:'mobility'})])
      ]
    },
    {
      id:'force', label:'Force · charges lourdes', short:'Force',
      summary:'Peu de mouvements, répétitions basses, repos longs. Demande du matériel chargé et des sécurités.',
      nutrition:'maintain', focus:'muscle', format:'classic', preferWeighted:true,
      dosage:{anchor:{sets:5, reps:[3,6], rest:180}, accessory:{sets:3, reps:[6,10], rest:120}, finisher:{sets:3, reps:[8,12], rest:90}},
      days:[
        day('A','Squat lourd',[anchor('squat',['bb-squat','front-squat','db-squat','legpress']),acc('hinge',['bb-rdl','rdl','legcurl','hip-thrust']),acc('core',['carry','suitcase-carry','plank']),fin('calf',['db-calf','calf','seated-calf'])]),
        day('B','Poussée lourde',[anchor('push',['bb-press','db-press','floor-press','pushup']),acc('push',['bb-ohp','db-shoulder','push-press','pike-pushup']),acc('pull',['bb-row','db-row','cable-row']),fin('arms',['close-grip-press','overhead-triceps','triceps'])]),
        day('C','Charnière lourde',[anchor('hinge',['deadlift','sumo-deadlift','bb-rdl','kb-deadlift']),acc('squat',['front-squat','db-squat','legpress','split-squat']),acc('core',['pallof','side-plank-full','plank']),fin('calf',['seated-calf','calf'])]),
        day('D','Tirage lourd',[anchor('pull',['pullup','bb-row','pulldown','inverted-row']),acc('pull',['bb-row-underhand','cable-row','kb-row','band-row']),acc('push',['db-shoulder','bb-ohp','pushup']),fin('arms',['bb-curl','curl','band-curl'])]),
        day('E','Accessoires',[anchor('arms',['bb-curl','curl','diamond-pushup']),acc('arms',['close-grip-press','overhead-triceps','cable-triceps']),acc('core',['hanging-knee-raise','leg-raise','hollow-hold']),fin('pull',['facepull','band-pullapart','rear-delt-fly'])])
      ]
    },
    {
      id:'condition', label:'Conditionnement fonctionnel', short:'Condition',
      summary:'Enchaînements variés à effort soutenu. Inspiré des séances fonctionnelles, sans affiliation à une méthode déposée.',
      nutrition:'maintain', focus:'mixed', format:'circuit', preferWeighted:false,
      dosage:{anchor:{sets:4, reps:[8,12], rest:60}, accessory:{sets:3, reps:[10,15], rest:45}, finisher:{sets:3, reps:[10,15], rest:45}},
      days:[
        day('A','Circuit · pousser & porter',[anchor('cardio',['rower','bike','squat-thrust','march'],{kind:'cardio'}),acc('push',['pushup','db-press','band-press','knee-pushup']),acc('squat',['goblet','walking-lunge','squat','wall-sit']),fin('core',['carry','plank-shoulder-tap','hollow-hold'])]),
        day('B','Circuit · tirer & charnière',[anchor('cardio',['rower-interval','bike-interval','stepjack','march'],{kind:'cardio'}),acc('pull',['inverted-row','band-row','db-row','cable-row']),acc('hinge',['kb-swing','kb-deadlift','bridge','rdl']),fin('core',['russian-twist','bear-hold','side-plank'])]),
        day('C','Mixte',[anchor('squat',['goblet','db-squat','walking-lunge','squat']),acc('push',['pushup','db-shoulder','band-ohp']),acc('pull',['band-row','inverted-row','kb-row']),acc('cardio',['mountain-climber','shadow-box','march','bike'],{kind:'cardio'}),fin('core',['plank-reach','hollow-hold','deadbug'])]),
        day('D','Appuis & réactivité',[anchor('cardio',['skater','high-knees','stepjack','march'],{kind:'cardio'}),acc('jump',['pogo','split-jump','landing'],{kind:'plyo',optional:true}),acc('squat',['lateral-lunge','cossack','split-squat','squat']),fin('core',['bear-crawl','bird-dog','plank'])]),
        day('E','Endurance',[anchor('cardio',['run','bike','rower','walk-hill'],{kind:'cardio'}),acc('core',['hollow-hold','plank','deadbug']),fin('mobility',['worlds-greatest','pigeon','childs-pose'],{kind:'mobility'})])
      ]
    },
    {
      id:'hybrid', label:'Hybride · force et endurance', short:'Hybride',
      summary:'Alterne séances de force et sorties d’endurance dans la même semaine.',
      nutrition:'maintain', focus:'mixed', format:'classic', preferWeighted:true,
      dosage:{anchor:{sets:4, reps:[5,8], rest:150}, accessory:{sets:3, reps:[8,12], rest:90}, finisher:{sets:3, reps:[10,15], rest:60}},
      days:[
        day('A','Force · haut du corps',[anchor('push',['bb-press','db-press','pushup','floor-press']),anchor('pull',['pullup','bb-row','pulldown','db-row']),acc('arms',['curl','overhead-triceps','band-curl']),fin('core',['carry','plank','hollow-hold'])]),
        day('B','Endurance',[anchor('cardio',['run','bike','rower','walk-hill'],{kind:'cardio'}),acc('core',['side-plank','deadbug','bird-dog']),fin('mobility',['calf-stretch','hamstring','hip-flexor'],{kind:'mobility'})]),
        day('C','Force · bas du corps',[anchor('squat',['bb-squat','db-squat','legpress','goblet']),acc('hinge',['bb-rdl','rdl','legcurl','single-rdl']),acc('calf',['db-calf','calf','seated-calf']),fin('core',['suitcase-carry','pallof','plank'])]),
        day('D','Mixte',[anchor('hinge',['deadlift','kb-swing','rdl','kb-deadlift']),acc('push',['db-shoulder','pushup','band-ohp']),acc('pull',['cable-row','band-row','inverted-row']),fin('cardio',['rower-interval','bike-interval','stepjack'],{kind:'cardio'})]),
        day('E','Sortie longue',[anchor('cardio',['walk-hill','run','bike','walk'],{kind:'cardio'}),acc('mobility',['worlds-greatest','hip-90-90','downdog'],{kind:'mobility'}),fin('mobility',['breath','childs-pose'],{kind:'mobility'})])
      ]
    },
    {
      id:'stability', label:'Stabilité & équilibre', short:'Stabilité',
      summary:'Gainage, appuis unilatéraux et contrôle. Utile après une reprise ou pour préparer les impacts.',
      nutrition:'maintain', focus:'core', format:'classic', preferWeighted:false,
      dosage:{anchor:{sets:3, reps:[8,12], rest:75}, accessory:{sets:3, reps:[8,12], rest:60}, finisher:{sets:2, reps:[10,15], rest:45}},
      days:[
        day('A','Gainage · anti-extension',[anchor('core',['plank','hollow-hold','deadbug']),acc('core',['bird-dog','bear-hold','plank-reach']),acc('squat',['split-squat','step-up','squat']),fin('mobility',['cat','hip-flexor','breath'],{kind:'mobility'})]),
        day('B','Gainage · anti-rotation',[anchor('core',['pallof','pallof-cable','side-plank']),acc('core',['plank-shoulder-tap','russian-twist','bird-dog']),acc('hinge',['single-rdl','bridge','single-bridge']),fin('mobility',['thoracic','hip-90-90','quad-rotation'],{kind:'mobility'})]),
        day('C','Appuis unilatéraux',[anchor('core',['single-leg-stand','tandem-stand','single-leg-reach']),acc('squat',['split-squat','lateral-lunge','step-up','squat']),acc('calf',['single-calf','calf-hold','tibialis']),fin('mobility',['ankle-mob','calf-stretch','downdog'],{kind:'mobility'})]),
        day('D','Gainage · latéral',[anchor('core',['side-plank','side-plank-full','side-plank-lift']),acc('core',['suitcase-carry','carry','bear-hold']),acc('hinge',['clamshell','hip-abduction','glute-kickback']),fin('mobility',['pigeon','hip-circles','breath'],{kind:'mobility'})]),
        day('E','Contrôle & respiration',[anchor('core',['deadbug','bird-dog','hollow-hold']),acc('core',['single-leg-stand','heel-toe-walk','tandem-stand']),acc('mobility',['worlds-greatest','shoulder-mob','neck-mob'],{kind:'mobility'}),fin('mobility',['breath','childs-pose'],{kind:'mobility'})])
      ]
    },
    {
      id:'mobility', label:'Mobilité & souplesse', short:'Mobilité',
      summary:'Séances courtes d’amplitude et de respiration, sans charge lourde.',
      nutrition:'maintain', focus:'mobility', format:'classic', preferWeighted:false,
      dosage:{anchor:{sets:2, reps:[8,12], rest:30}, accessory:{sets:2, reps:[8,12], rest:30}, finisher:{sets:2, reps:[8,12], rest:20}},
      days:[
        day('A','Hanches',[anchor('mobility',['hip-90-90','hip-flexor','pigeon'],{kind:'mobility'}),acc('mobility',['deep-squat-hold','worlds-greatest','hip-circles'],{kind:'mobility'}),acc('core',['bridge','deadbug','bird-dog']),fin('mobility',['breath','childs-pose'],{kind:'mobility'})]),
        day('B','Épaules & dos',[anchor('mobility',['shoulder-mob','doorway-chest','band-dislocate'],{kind:'mobility'}),acc('mobility',['thoracic','cat','downdog'],{kind:'mobility'}),acc('core',['bird-dog','plank','deadbug']),fin('mobility',['neck-mob','breath'],{kind:'mobility'})]),
        day('C','Chaîne postérieure',[anchor('mobility',['hamstring','downdog','calf-stretch'],{kind:'mobility'}),acc('mobility',['pigeon','quad-rotation','hip-flexor'],{kind:'mobility'}),acc('hinge',['bridge','single-bridge','clamshell']),fin('mobility',['breath','childs-pose'],{kind:'mobility'})]),
        day('D','Chevilles & pieds',[anchor('mobility',['ankle-mob','calf-stretch','deep-squat-hold'],{kind:'mobility'}),acc('calf',['tibialis','calf-hold','single-calf']),acc('core',['single-leg-stand','tandem-stand','heel-toe-walk']),fin('mobility',['breath','hip-circles'],{kind:'mobility'})]),
        day('E','Séance complète',[anchor('mobility',['worlds-greatest','cat','downdog'],{kind:'mobility'}),acc('mobility',['hip-90-90','thoracic','wrist-mob'],{kind:'mobility'}),acc('mobility',['pigeon','hamstring','shoulder-mob'],{kind:'mobility'}),fin('mobility',['breath','childs-pose'],{kind:'mobility'})])
      ]
    }
  ];
  const familyById = id => families.find(f => f.id === id) || null;

  function checkFor(state, config, overrides = {}) {
    const base = state.checkIn || {};
    return {
      ...base,
      date: PT.dateKey(),
      equipment: Array.isArray(config.equipment) && config.equipment.length ? config.equipment : ['bodyweight'],
      minutes: Number(config.minutes) || 30,
      focus: familyById(config.familyId)?.focus || 'mixed',
      format: familyById(config.familyId)?.format || 'classic',
      constraints: Array.isArray(config.constraints) ? config.constraints : (base.constraints || []),
      ...overrides
    };
  }

  function rotation(family, daysPerWeek) {
    const n = Math.max(1, Math.min(Number(daysPerWeek) || 3, family.days.length));
    return family.days.slice(0, n);
  }

  function rank(exercise, slotDef, family, state) {
    const preferred = (slotDef.prefer || []).indexOf(exercise.id);
    let score = preferred >= 0 ? 100 - preferred * 6 : 0;
    if (family.preferWeighted && exercise.weighted) score += 8;
    if (state.preferences?.likes?.includes(exercise.id)) score += 4;
    if (state.preferences?.anchors?.includes(exercise.id)) score += 6;
    if (exercise.level > 1) score -= 2;
    if (exercise.impact) score -= 3;
    return score;
  }

  function candidates(slotDef, state, check, ctx, family = {}, used = []) {
    return PT.allExercises(state)
      .filter(e => e.pattern === slotDef.pattern
        && (!slotDef.kind || e.kind === slotDef.kind)
        && !used.includes(e.id)
        && PT.allowed(e, state, check, ctx))
      .sort((a, b) => rank(b, slotDef, family, state) - rank(a, slotDef, family, state) || a.id.localeCompare(b.id));
  }

  // Anchors stay the same all program long so progress stays comparable; accessories rotate by week.
  function pick(slotDef, slotIndex, week, family, state, check, ctx, used, anchors) {
    const free = candidates(slotDef, state, check, ctx, family, used);
    if (!free.length) return null;
    if (slotDef.role === 'anchor') {
      const stored = anchors && anchors[slotDef.key];
      const kept = stored && free.find(e => e.id === stored);
      return kept || free[0];
    }
    const window = free.slice(0, Math.min(3, free.length));
    return window[(Math.max(1, Number(week) || 1) - 1 + slotIndex) % window.length];
  }

  function prescribe(exercise, slotDef, family, phase, check, ctx) {
    const dose = family.dosage[slotDef.role] || family.dosage.accessory;
    const p = PT.makePrescription(exercise, family.format, Number(check.minutes) || 30, ctx);
    p.sets = Math.max(1, Math.min(6, dose.sets + phase.setShift + (ctx.low ? -1 : 0)));
    p.rest = Math.max(15, Math.min(240, dose.rest + phase.restShift));
    if (p.measure === 'reps' || p.measure === 'contacts') {
      const min = Math.max(1, dose.reps[0] + phase.repShift);
      const max = Math.max(min, dose.reps[1] + phase.repShift);
      p.targetMin = Math.max(1, Math.min(min, 100));
      p.targetMax = Math.max(p.targetMin, Math.min(max, 100));
      if (exercise.kind === 'plyo') { p.targetMin = Math.min(exercise.min, p.targetMin); p.targetMax = Math.min(exercise.max, p.targetMax); }
    }
    if (p.measure === 'seconds') p.seconds = exercise.seconds;
    p.slotRole = slotDef.role;
    p.slotKey = slotDef.key;
    return p;
  }

  function resolveDay(program, week, dayKey, state, check, ctx) {
    const family = familyById(program.familyId);
    if (!family) return {error:'Programme inconnu.'};
    const template = family.days.find(d => d.key === dayKey);
    if (!template) return {error:'Séance inconnue dans ce programme.'};
    const phase = phaseFor(week, program.weeks);
    const exercises = [], used = [], changes = [];
    template.slots.forEach((raw, index) => {
      const slotDef = {...raw, key: `${dayKey}:${index}`};
      const chosen = pick(slotDef, index, week, family, state, check, ctx, used, program.anchors);
      if (!chosen) { if (!slotDef.optional) changes.push(`${PT.patterns[slotDef.pattern] || slotDef.pattern} : aucun mouvement compatible aujourd’hui.`); return; }
      const stored = program.anchors && program.anchors[slotDef.key];
      if (slotDef.role === 'anchor' && stored && stored !== chosen.id) {
        const original = PT.allExercises(state).find(e => e.id === stored);
        changes.push(`${original ? original.name : 'Mouvement repère'} → ${chosen.name} (matériel, niveau ou contraintes).`);
      }
      used.push(chosen.id);
      exercises.push(prescribe(chosen, slotDef, family, phase, check, ctx));
    });
    return {exercises, changes, phase, template, family};
  }

  function compatibility(state, config) {
    const family = familyById(config.familyId);
    if (!family) return {ok:false, issues:['Choisis un objectif de programme.'], covered:0, total:0};
    const check = checkFor(state, config), ctx = PT.context(state, check);
    if (ctx.active.blocked) return {ok:false, blocked:true, issues:['Douleur importante ou signe inhabituel signalé : la création de programme est suspendue. Demande un avis médical avant de reprendre.'], covered:0, total:0};
    const days = rotation(family, config.daysPerWeek);
    let covered = 0, total = 0;
    const missing = new Set();
    days.forEach(d => d.slots.forEach(raw => {
      if (raw.optional) return;
      total += 1;
      const found = PT.allExercises(state).some(e => e.pattern === raw.pattern && (!raw.kind || e.kind === raw.kind) && PT.allowed(e, state, check, ctx));
      if (found) covered += 1; else missing.add(PT.patterns[raw.pattern] || raw.pattern);
    }));
    const issues = [];
    if (missing.size) issues.push(`Sans mouvement disponible pour : ${[...missing].join(', ')}. Ces créneaux seront sautés tant que le matériel ou les contraintes ne changent pas.`);
    if (family.preferWeighted && !config.equipment.some(id => ['dumbbells','kettlebell','barbell','cable','legpress','legcurl','legextension'].includes(id)))
      issues.push('Ce programme est pensé pour des charges : sans matériel chargé, la progression reposera surtout sur les répétitions.');
    if (Number(config.minutes) < 20 && ['bulk','force','hybrid'].includes(family.id))
      issues.push('Moins de 20 minutes : certaines séances seront raccourcies et perdront des accessoires.');
    return {ok: covered > 0 && covered >= Math.ceil(total * 0.5), issues, covered, total};
  }

  function createProgram(state, config) {
    const family = familyById(config.familyId);
    if (!family) return {error:'Choisis un objectif de programme.'};
    const weeks = WEEK_CHOICES.includes(Number(config.weeks)) ? Number(config.weeks) : 8;
    const daysPerWeek = DAY_CHOICES.includes(Number(config.daysPerWeek)) ? Number(config.daysPerWeek) : 3;
    const minutes = PT.bounded(config.minutes, 10, 180) ? Number(config.minutes) : 30;
    const equipment = Array.isArray(config.equipment) && config.equipment.length ? [...new Set(config.equipment)] : ['bodyweight'];
    const startDate = PT.isoDay(config.startDate) ? config.startDate : PT.dateKey();
    const fit = compatibility(state, {...config, weeks, daysPerWeek, minutes, equipment});
    if (fit.blocked) return {error: fit.issues[0]};
    if (!fit.ok) return {error:'Trop peu de mouvements compatibles avec ce matériel et ces contraintes pour construire ce programme. Change de matériel ou choisis un autre objectif.'};
    const check = checkFor(state, {...config, minutes, equipment}), ctx = PT.context(state, check);
    const anchors = {};
    rotation(family, daysPerWeek).forEach(d => d.slots.forEach((raw, index) => {
      if (raw.role !== 'anchor') return;
      const key = `${d.key}:${index}`, used = Object.values(anchors);
      const chosen = pick({...raw, key}, index, 1, family, state, check, ctx, used, {});
      if (chosen) anchors[key] = chosen.id;
    }));
    return {
      program:{
        id: PT.uid(), version: VERSION, familyId: family.id, weeks, daysPerWeek, minutes, equipment,
        constraints: Array.isArray(config.constraints) ? config.constraints : [],
        startDate, createdAt: new Date().toISOString(), status:'active', anchors,
        days: rotation(family, daysPerWeek).map(d => d.key), completed:[], notes: fit.issues
      }
    };
  }

  function sessionPlan(program, week, dayKey, state, check = checkFor(state, program)) {
    const ctx = PT.context(state, check);
    if (ctx.active.blocked) return {error:'Une douleur importante ou un signe inhabituel empêche de lancer une séance. Demande un avis médical.'};
    const resolved = resolveDay(program, week, dayKey, state, check, ctx);
    if (resolved.error) return resolved;
    let {exercises} = resolved;
    if (!exercises.length) return {error:'Aucun mouvement de cette séance n’est compatible aujourd’hui. Adapte ton matériel ou choisis une autre séance.'};
    const warmupSeconds = Number(check.minutes) <= 15 ? 120 : 300;
    const budget = Math.max(180, Number(check.minutes) * 60 - warmupSeconds - 60);
    const over = () => PT.estimateSeconds(exercises, resolved.family.format) > budget;
    const floor = Math.min(exercises.length, 2);
    // Une séance courte perd d'abord des séries et du repos ; un mouvement n'est retiré qu'en dernier recours.
    while (over() && exercises.some(e => e.slotRole !== 'anchor' && e.sets > 2)) {
      const e = [...exercises].reverse().find(x => x.slotRole !== 'anchor' && x.sets > 2); e.sets -= 1;
    }
    while (over() && exercises.some(e => e.rest > 45)) {
      exercises.forEach(e => { e.rest = Math.max(45, e.rest - 15); });
    }
    while (over() && exercises.length > floor && exercises.some(e => e.slotRole !== 'anchor')) {
      const index = exercises.map(e => e.slotRole !== 'anchor').lastIndexOf(true);
      exercises.splice(index, 1);
    }
    while (over() && exercises.some(e => e.sets > 1)) {
      const e = [...exercises].reverse().find(x => x.sets > 1); e.sets -= 1;
    }
    const reasons = [
      `${resolved.family.label} · semaine ${week} sur ${program.weeks} · phase ${resolved.phase.name.toLowerCase()}.`,
      resolved.phase.note,
      ...resolved.changes
    ];
    if (ctx.low) reasons.push('Contexte de fatigue ou de reprise : volume réduit, aucune hausse automatique de charge.');
    if (ctx.active.active.length) reasons.push('Les mouvements sollicitant les zones signalées sont écartés. Cela ne garantit pas l’absence de douleur.');
    return {
      id: PT.uid(), title: `${resolved.family.short} · ${resolved.template.name}`, source:'program-plan',
      programInstanceId: program.id, programFamily: program.familyId, programWeekIndex: week, programDay: dayKey,
      focus: resolved.family.focus, format: resolved.family.format, exercises, check: PT.clone(check), reasons,
      warmupSeconds, estimatedMinutes: Math.ceil((warmupSeconds + 60 + PT.estimateSeconds(exercises, resolved.family.format)) / 60),
      status:'preview', entries:{}, createdAt: new Date().toISOString()
    };
  }

  function weekPreview(program, week, state, check = checkFor(state, program)) {
    const ctx = PT.context(state, check);
    return program.days.map(dayKey => {
      const resolved = resolveDay(program, week, dayKey, state, check, ctx);
      const family = familyById(program.familyId);
      const template = family?.days.find(d => d.key === dayKey);
      if (resolved.error) return {dayKey, name: template?.name || dayKey, exercises:[], error: resolved.error};
      return {
        dayKey, name: resolved.template.name, phase: resolved.phase,
        exercises: resolved.exercises.map(e => ({id:e.id, name:e.name, sets:e.sets, measure:e.measure, targetMin:e.targetMin, targetMax:e.targetMax, seconds:e.seconds, role:e.slotRole, unilateral:!!e.unilateral})),
        minutes: Math.ceil((300 + 60 + PT.estimateSeconds(resolved.exercises, resolved.family.format)) / 60),
        changes: resolved.changes
      };
    });
  }

  const totalSessions = program => Math.max(1, Number(program.weeks) * program.days.length);

  function progressOf(program) {
    const done = (program.completed || []).filter(c => !c.skipped);
    const total = totalSessions(program);
    const currentWeek = Math.max(1, Math.min(program.weeks, Math.floor(done.length / program.days.length) + 1));
    const doneThisWeek = done.filter(c => c.week === currentWeek).map(c => c.day);
    const next = program.days.find(d => !doneThisWeek.includes(d)) || program.days[0];
    return {done: done.length, total, ratio: Math.min(1, done.length / total), currentWeek, doneThisWeek, nextDay: next, phase: phaseFor(currentWeek, program.weeks), finished: done.length >= total};
  }

  function markCompleted(program, entry) {
    const week = Math.max(1, Math.min(Number(entry.week) || 1, program.weeks));
    const day = program.days.includes(entry.day) ? entry.day : program.days[0];
    const completed = (program.completed || []).filter(c => !(c.week === week && c.day === day));
    return {...program, completed:[...completed, {week, day, sessionId: entry.sessionId || null, date: PT.isoDay(entry.date) ? entry.date : PT.dateKey(), partial: !!entry.partial, skipped: !!entry.skipped}]};
  }

  const pause = program => ({...program, status:'paused', pausedAt:new Date().toISOString()});
  const resume = program => ({...program, status:'active', pausedAt:null});
  const archive = program => ({...program, status:'archived', archivedAt:new Date().toISOString()});

  function validateProgram(value) {
    if (value === null || value === undefined) return null;
    const p = PT.clone(value);
    const ok = p && typeof p === 'object' && !Array.isArray(p)
      && typeof p.id === 'string' && familyById(p.familyId)
      && WEEK_CHOICES.includes(Number(p.weeks)) && PT.bounded(p.minutes, 10, 180)
      && Array.isArray(p.equipment) && p.equipment.every(id => PT.equipment.some(e => e.id === id))
      && Array.isArray(p.days) && p.days.length > 0 && p.days.length <= 5
      && p.days.every(d => familyById(p.familyId).days.some(x => x.key === d))
      && PT.isoDay(p.startDate) && ['active','paused','archived'].includes(p.status)
      && p.anchors && typeof p.anchors === 'object' && !Array.isArray(p.anchors)
      && Array.isArray(p.completed) && p.completed.length <= 5000
      && p.completed.every(c => c && PT.bounded(c.week, 1, Number(p.weeks)) && p.days.includes(c.day) && PT.isoDay(c.date));
    if (!ok) throw new Error('Programme enregistré invalide.');
    p.weeks = Number(p.weeks); p.minutes = Number(p.minutes);
    p.daysPerWeek = p.days.length;
    p.constraints = Array.isArray(p.constraints) ? p.constraints.filter(x => typeof x === 'string') : [];
    p.notes = Array.isArray(p.notes) ? p.notes.filter(x => typeof x === 'string') : [];
    return p;
  }

  return {VERSION, WEEK_CHOICES, DAY_CHOICES, MINUTE_CHOICES, families, familyById, phases, phaseFor, rotation, checkFor,
    candidates, compatibility, createProgram, sessionPlan, weekPreview, progressOf, totalSessions, markCompleted,
    pause, resume, archive, validateProgram};
});
