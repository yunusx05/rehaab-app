/* Rehaab: energy estimates. Estimation only — never a prescription, never a medical or dietetic assessment. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./personal-engine.js'));
  else root.PersonalNutrition = factory(root.PersonalTraining);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (PT) {
  'use strict';

  const VERSION = 1;

  // Mifflin-St Jeor uses a physiological parameter. It is asked explicitly and never inferred from a first name.
  const bodyTypes = [
    {id:'male', label:'Formule masculine', offset:5},
    {id:'female', label:'Formule féminine', offset:-161},
    {id:'unspecified', label:'Je préfère ne pas préciser', offset:-78}
  ];
  const bodyTypeById = id => bodyTypes.find(b => b.id === id) || null;

  const activityLevels = [
    {id:'sedentary', label:'Assis la plupart du temps', hint:'Bureau, peu de déplacements', factor:1.2},
    {id:'light', label:'Un peu actif', hint:'Marche quotidienne, quelques déplacements', factor:1.375},
    {id:'moderate', label:'Actif', hint:'Debout souvent, trajets à pied ou à vélo', factor:1.55},
    {id:'high', label:'Très actif', hint:'Travail physique ou grosse activité quotidienne', factor:1.725}
  ];
  const activityById = id => activityLevels.find(a => a.id === id) || null;

  // The daily figure already includes usual activity; training is counted separately to avoid double counting.
  const goals = [
    {id:'lose', label:'Perdre du gras', delta:-0.18, floorRatio:0.8, note:'Déficit modéré. Un déficit plus agressif fait souvent perdre du muscle et de l’énergie.'},
    {id:'maintain', label:'Maintenir mon poids', delta:0, floorRatio:1, note:'Apport d’entretien estimé, à ajuster selon l’évolution réelle du poids.'},
    {id:'gain', label:'Prendre du muscle', delta:0.12, floorRatio:1, note:'Surplus modéré. Au-delà, la prise est surtout grasse.'},
    {id:'recomp', label:'Rester au même poids en gagnant du muscle', delta:-0.05, floorRatio:0.9, note:'Apport proche de l’entretien : la progression se lit sur les performances, pas sur la balance.'}
  ];
  const goalById = id => goals.find(g => g.id === id) || null;

  const round10 = n => Math.round(n / 10) * 10;
  const round5 = n => Math.round(n / 5) * 5;

  function restingEnergy(profile) {
    const {weight, height, age, bodyType} = profile;
    const type = bodyTypeById(bodyType);
    if (!type || !PT.bounded(weight, 30, 350) || !PT.bounded(height, 100, 250) || !PT.bounded(age, 18, 100)) return null;
    return 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + type.offset;
  }

  function trainingEnergy(profile, weeklySessions, minutesPerSession) {
    const sessions = PT.bounded(weeklySessions, 0, 14) ? Number(weeklySessions) : 0;
    const minutes = PT.bounded(minutesPerSession, 0, 300) ? Number(minutesPerSession) : 0;
    const weight = PT.bounded(profile.weight, 30, 350) ? Number(profile.weight) : 0;
    if (!sessions || !minutes || !weight) return 0;
    // ~6 METs for mixed training; the resting share is already in the daily figure, hence 5 METs net.
    const perSession = 5 * 3.5 * weight / 200 * minutes;
    return perSession * sessions / 7;
  }

  function guardrails(input, estimate) {
    const notes = [], blocks = [];
    const age = Number(input.age), weight = Number(input.weight), height = Number(input.height);
    const bmi = PT.bounded(weight, 30, 350) && PT.bounded(height, 100, 250) ? weight / Math.pow(height / 100, 2) : null;
    if (PT.bounded(age, 1, 17)) blocks.push('Les estimations caloriques de cette app s’adressent à des adultes. Pour un mineur, l’accompagnement passe par un professionnel de santé.');
    if (input.pregnancy) blocks.push('Grossesse ou allaitement déclaré : les besoins changent et ne se calculent pas avec cette formule. Parles-en à un professionnel de santé.');
    if (input.medicalFollowUp) blocks.push('Suivi médical ou trouble du comportement alimentaire déclaré : l’app n’affiche pas de cible calorique. Ton professionnel de santé reste la bonne référence.');
    if (bmi !== null && bmi < 18.5 && input.goal === 'lose') blocks.push('Le poids déclaré est déjà bas pour cette taille : aucune cible de perte n’est proposée ici. Un avis professionnel est préférable.');
    if (bmi !== null && bmi < 18.5 && input.goal !== 'lose') notes.push('Le poids déclaré est bas pour cette taille. L’estimation est indicative ; un avis professionnel reste utile.');
    if (estimate && estimate.target && estimate.resting && estimate.target < estimate.resting) notes.push('La cible calculée passerait sous ta dépense au repos : elle a été relevée. Un déficit plus marqué relève d’un suivi professionnel.');
    return {notes, blocks};
  }

  function estimate(input = {}) {
    const profile = {weight:input.weight, height:input.height, age:input.age, bodyType:input.bodyType};
    const missing = [];
    if (!PT.bounded(input.weight, 30, 350)) missing.push('poids');
    if (!PT.bounded(input.height, 100, 250)) missing.push('taille');
    if (!PT.bounded(input.age, 1, 110)) missing.push('âge');
    if (!bodyTypeById(input.bodyType)) missing.push('formule de calcul');
    if (!activityById(input.activity)) missing.push('niveau d’activité');
    if (missing.length) return {ok:false, missing, blocks:[], notes:[], text:`Renseigne : ${missing.join(', ')}.`};

    const early = guardrails(input, null);
    if (early.blocks.length) return {ok:false, missing:[], blocks:early.blocks, notes:early.notes, text:early.blocks[0]};

    const resting = restingEnergy(profile);
    if (resting === null || resting <= 0) return {ok:false, missing:['profil'], blocks:[], notes:[], text:'Profil incomplet pour une estimation.'};
    const activity = activityById(input.activity);
    const daily = resting * activity.factor;
    const training = trainingEnergy(profile, input.weeklySessions, input.minutesPerSession);
    const total = daily + training;
    const goal = goalById(input.goal) || goalById('maintain');
    let target = total * (1 + goal.delta);
    const floor = resting * goal.floorRatio;
    const raised = target < floor;
    if (raised) target = floor;

    const dailyGap = total - target;
    // ~7700 kcal per kilogram of body mass is a textbook order of magnitude, not an individual guarantee.
    const weeklyChange = dailyGap ? -(dailyGap * 7) / 7700 : 0;
    const protein = Math.round(Number(input.weight) * (goal.id === 'lose' ? 1.8 : 1.6));

    const result = {
      ok:true, resting: round10(resting), daily: round10(daily), training: round10(training), total: round10(total),
      target: round10(target), goal: goal.id, goalLabel: goal.label, goalNote: goal.note,
      weeklyChangeKg: Math.round(weeklyChange * 100) / 100, proteinGrams: round5(protein),
      uncertainty: Math.round(round10(total) * 0.12 / 10) * 10, raised,
      assumptions:[
        `Métabolisme de repos estimé par la formule Mifflin–St Jeor (${bodyTypeById(input.bodyType).label.toLowerCase()}).`,
        `Activité quotidienne : ${activity.label.toLowerCase()} (facteur ${activity.factor}).`,
        training > 0 ? `Séances déclarées comptées à part : environ ${round10(training)} kcal par jour en moyenne sur la semaine.` : 'Aucune séance déclarée : rien n’est ajouté pour l’entraînement.',
        'La dépense sportive n’est comptée qu’une fois : elle n’est pas incluse dans le facteur d’activité.'
      ]
    };
    const late = guardrails(input, result);
    result.notes = [...early.notes, ...late.notes];
    result.blocks = late.blocks;
    if (result.blocks.length) return {ok:false, missing:[], blocks:result.blocks, notes:result.notes, text:result.blocks[0]};
    return result;
  }

  function horizon(result, currentWeight, targetWeight) {
    if (!result?.ok || !PT.bounded(currentWeight, 30, 350) || !PT.bounded(targetWeight, 30, 350)) return null;
    const delta = Number(targetWeight) - Number(currentWeight);
    if (Math.abs(delta) < 0.5) return {text:'Ton poids cible est proche de ton poids actuel : l’estimation d’entretien suffit.'};
    if (!result.weeklyChangeKg || Math.sign(result.weeklyChangeKg) !== Math.sign(delta))
      return {text:'Avec cette cible calorique, l’évolution estimée ne va pas dans le sens de ce poids. Revois l’objectif ou l’apport.'};
    const weeks = Math.abs(delta / result.weeklyChangeKg);
    if (!Number.isFinite(weeks) || weeks > 260) return {text:'L’écart demandé est trop grand pour une estimation utile sur cette base.'};
    const low = Math.max(1, Math.floor(weeks * 0.8)), high = Math.ceil(weeks * 1.3);
    return {weeks: Math.round(weeks), low, high, text:`À ce rythme estimé, il faudrait de l’ordre de ${low} à ${high} semaines. Ce n’est pas une date : le poids varie aussi avec l’eau, le sommeil et le contenu digestif.`};
  }

  function fromState(state, overrides = {}) {
    const profile = state.profile || {};
    const nutrition = state.nutrition || {};
    const summary = PT.weeklySummary(state);
    return {
      weight: overrides.weight ?? profile.weight,
      height: overrides.height ?? profile.height,
      age: overrides.age ?? profile.age,
      bodyType: overrides.bodyType ?? nutrition.bodyType,
      activity: overrides.activity ?? nutrition.activity,
      goal: overrides.goal ?? nutrition.goal,
      weeklySessions: overrides.weeklySessions ?? (nutrition.weeklySessions !== undefined && nutrition.weeklySessions !== '' ? nutrition.weeklySessions : (summary.sessions || profile.weeklyTarget || 0)),
      minutesPerSession: overrides.minutesPerSession ?? (nutrition.minutesPerSession !== undefined && nutrition.minutesPerSession !== '' ? nutrition.minutesPerSession : (state.checkIn?.minutes || 30)),
      pregnancy: overrides.pregnancy ?? !!nutrition.pregnancy,
      medicalFollowUp: overrides.medicalFollowUp ?? !!nutrition.medicalFollowUp
    };
  }

  function initialNutrition() {
    return {bodyType:'', activity:'', goal:'', weeklySessions:'', minutesPerSession:'', targetWeight:'', pregnancy:false, medicalFollowUp:false, acknowledged:false};
  }

  function validateNutrition(value) {
    const base = initialNutrition();
    if (value === null || value === undefined) return base;
    if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Paramètres nutritionnels invalides.');
    const n = {...base, ...PT.clone(value)};
    if (n.bodyType !== '' && !bodyTypeById(n.bodyType)) throw new Error('Formule de calcul inconnue.');
    if (n.activity !== '' && !activityById(n.activity)) throw new Error('Niveau d’activité inconnu.');
    if (n.goal !== '' && !goalById(n.goal)) throw new Error('Objectif nutritionnel inconnu.');
    if (n.weeklySessions !== '' && !PT.bounded(n.weeklySessions, 0, 14)) throw new Error('Nombre de séances par semaine invalide.');
    if (n.minutesPerSession !== '' && !PT.bounded(n.minutesPerSession, 0, 300)) throw new Error('Durée de séance invalide.');
    if (n.targetWeight !== '' && !PT.bounded(n.targetWeight, 30, 350)) throw new Error('Poids cible invalide.');
    n.pregnancy = !!n.pregnancy; n.medicalFollowUp = !!n.medicalFollowUp; n.acknowledged = !!n.acknowledged;
    return n;
  }

  const disclaimer = 'Estimation indicative, pas une prescription. Elle ne remplace ni un médecin ni un diététicien, et ne convient pas en cas de grossesse, d’allaitement, de trouble du comportement alimentaire ou de suivi médical en cours.';

  return {VERSION, bodyTypes, bodyTypeById, activityLevels, activityById, goals, goalById, restingEnergy, trainingEnergy,
    estimate, horizon, fromState, initialNutrition, validateNutrition, disclaimer};
});
