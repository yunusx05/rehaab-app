/* Coach IA : bilan du jour en boutons, réponse de Gemini (api/coach.js), ajustement de la séance du jour.
   Les règles de douleur de l'app restent prioritaires : le coach allège ou retire, il n'ajoute jamais de charge. */
const COACH_ZONES = [{
  id: 'knee',
  label: 'Genou'
}, {
  id: 'ankle',
  label: 'Cheville / pied'
}, {
  id: 'calf',
  label: 'Mollet',
  region: 'ankle'
}, {
  id: 'quad',
  label: 'Cuisse avant',
  region: 'knee'
}, {
  id: 'hamstring',
  label: 'Arrière de cuisse',
  region: 'hip'
}, {
  id: 'hip',
  label: 'Hanche / aine'
}, {
  id: 'back',
  label: 'Dos'
}, {
  id: 'shoulder',
  label: 'Épaule'
}, {
  id: 'arm',
  label: 'Bras / coude',
  region: 'elbow'
}, {
  id: 'wrist',
  label: 'Poignet / main'
}, {
  id: 'neck',
  label: 'Cou'
}];
const COACH_FORM = [{
  value: 1,
  label: 'Épuisé'
}, {
  value: 2,
  label: 'Fatigué'
}, {
  value: 3,
  label: 'Correct'
}, {
  value: 4,
  label: 'En forme'
}, {
  value: 5,
  label: 'Au top'
}];
const COACH_DECISIONS = {
  normal: 'Séance prévue',
  light: 'Séance allégée',
  mobility: 'Mobilité douce',
  rehab: 'Soin de la zone',
  rest: 'Repos'
};
const ptCoachRegion = id => COACH_ZONES.find(z => z.id === id)?.region || id;
// Zone du bilan → protocole de soin le plus probable quand la zone le dit déjà (mollet, arrière de cuisse, bras).
const COACH_PROTOCOL = {
  calf: 'achilles',
  hamstring: 'hamstring',
  quad: 'knee-pfp',
  arm: 'elbow'
};
const ptCoachPains = (c, plan) => c.zones.map(z => {
  const region = ptCoachRegion(z),
    RW = window.RehabWarmup,
    chosen = plan?.rehabProtocol && RW?.byId(plan.rehabProtocol);
  return {
    region,
    severity: c.painLevel,
    protocol: chosen && RW.zoneOfRegion[region] === chosen.zone ? chosen.id : COACH_PROTOCOL[z] || ''
  };
});
const ptCoachLabel = (list, v) => list.find(o => o.value === v)?.label || '';
const ptCoachBlank = () => ({
  form: null,
  sleep: null,
  soreness: null,
  pain: null,
  zones: [],
  painLevel: 3,
  redFlags: false,
  basketYesterday: null,
  basketIntensity: null,
  basketSoon: null,
  minutes: 30,
  note: ''
});
// Une entrée enregistrée par une version précédente peut manquer de champs : on la complète avant tout affichage.
const ptCoachPlan = p => ({
  decision: 'light',
  intensity: 'reduced',
  setsFactor: 1,
  restFactor: 1,
  minutes: null,
  avoidImpact: false,
  rehabRegion: '',
  why: '',
  ...(p || {}),
  avoidRegions: Array.isArray(p?.avoidRegions) ? p.avoidRegions : []
});
const ptCoachEntry = x => x && {
  ...x,
  plan: ptCoachPlan(x.plan),
  checkin: {
    ...ptCoachBlank(),
    ...(x.checkin || {}),
    zones: Array.isArray(x.checkin?.zones) ? x.checkin.zones : []
  },
  messages: (Array.isArray(x.messages) ? x.messages : []).filter(m => m && typeof m.text === 'string').map(m => ({
    ...m,
    questions: Array.isArray(m.questions) ? m.questions : []
  }))
};
const ptCoachToday = data => ptCoachEntry([...(data.coachLog || [])].reverse().find(x => x.date === PT.dateKey()));

// Bilan en une phrase lisible : c'est aussi le premier message envoyé au coach.
function ptCoachSummary(c) {
  const sleep = {
      bad: 'mauvais',
      mid: 'moyen',
      good: 'bon'
    }[c.sleep],
    sore = {
      none: 'aucune',
      light: 'légères',
      strong: 'fortes'
    }[c.soreness];
  const yesterday = c.basketYesterday === 'none' ? 'non' : `${c.basketYesterday === 'match' ? 'match' : 'entraînement'}${c.basketIntensity ? `, ${{
    light: 'léger',
    medium: 'moyen',
    hard: 'dur'
  }[c.basketIntensity]}` : ''}`;
  const soon = {
    none: 'non',
    today: 'aujourd’hui',
    tomorrow: 'demain'
  }[c.basketSoon];
  const pain = c.pain === 'yes' ? `${c.zones.map(z => COACH_ZONES.find(x => x.id === z)?.label.toLowerCase()).join(', ') || 'zone non précisée'} à ${c.painLevel}/10${c.redFlags ? ', avec gonflement, douleur la nuit, instabilité ou fourmillements' : ''}` : 'aucune';
  return `Bilan du jour : forme ${c.form}/5 (${ptCoachLabel(COACH_FORM, c.form)}) ; sommeil ${sleep} ; courbatures ${sore} ; douleur : ${pain} ; basket hier : ${yesterday} ; basket prévu : ${soon} ; temps dispo ${c.minutes} min.${c.note.trim() ? ` Note : ${c.note.trim()}` : ''}`;
}

// Semaine commune (club déclaré, séances de l'app) et conseil du jour calculé par l'app.
function ptCoachWeek(data) {
  const TL = window.TrainingLoad;
  if (!TL) return null;
  const d = TL.day(data),
    names = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  return {
    advice: d.primary,
    protectLegs: d.protectLegs,
    notes: d.notes,
    appSessions7d: d.appWeek,
    clubDays7d: d.clubWeek,
    weeklyTarget: d.target,
    next7: TL.week(data).map(x => ({
      day: names[x.weekday],
      match: x.match,
      practice: x.practice
    }))
  };
}
function ptCoachMuscu(data) {
  const PP = window.PersonalPrograms,
    p = data.program;
  if (!PP || !p || p.status !== 'active') return null;
  const pr = PP.progressOf(p),
    f = PP.familyById(p.familyId);
  return {
    program: f?.label,
    week: `${pr.currentWeek}/${p.weeks}`,
    nextSession: f?.days.find(d => d.key === pr.nextDay)?.name,
    sessionsPerWeek: p.days.length
  };
}
// Ce que le coach doit savoir : profil, parcours, séance prévue, 14 derniers jours de l'app et du club.
function ptCoachContext(data) {
  const today = PT.dateKey(),
    BP = window.BasketPathway,
    JP = window.PlayerProfile,
    p = data.pathway;
  let planned = null;
  if (p && BP) {
    const step = BP.stepById(p.step),
      status = BP.weekStatus(p),
      day = step.days.find(d => d.key === status.next);
    if (day) {
      const plan = BP.sessionPlan(PT, JP, data, p, day.key);
      planned = {
        name: day.name,
        step: `${step.id}/5 · ${step.name}`,
        week: status.week,
        minutes: plan.estimatedMinutes,
        exercises: plan.error ? [] : plan.exercises.map(e => ({
          name: e.name,
          sets: e.sets,
          regions: e.regions,
          impact: !!e.impact
        }))
      };
    }
  }
  return {
    today,
    profile: {
      age: data.profile.age,
      experience: data.profile.experience,
      basketLevel: data.profile.basketLevel
    },
    dossier: window.PlayerDossier?.summary(data.dossier) || null,
    player: data.player?.position ? {
      position: JP?.positions[data.player.position]?.label,
      profile: (data.player.archetypes || []).map(a => JP?.archetypes[a]?.label)
    } : null,
    plannedSession: planned,
    recentSessions: data.sessions.filter(s => PT.dayDiff(today, s.date) >= 0 && PT.dayDiff(today, s.date) <= 14).sort((a, b) => b.date.localeCompare(a.date)).map(s => ({
      daysAgo: PT.dayDiff(today, s.date),
      title: s.title,
      type: s.source,
      minutes: Math.round(s.minutes),
      effort: s.effort || null,
      partial: !!s.partial,
      painAfter: s.painAfter ?? null,
      exercises: (s.exercises || []).slice(0, 10).map(e => e.name)
    })),
    basketEvents: data.events.filter(e => Math.abs(PT.dayDiff(today, e.date)) <= 3).map(e => ({
      daysFromToday: -PT.dayDiff(today, e.date),
      title: e.title,
      type: e.type,
      done: !!e.completed
    })),
    activePains: PT.activeSymptoms(data).map(s => ({
      zone: PT.regions[s.region],
      severity: s.severity
    })),
    previousCheckins: (data.coachLog || []).slice(-6).map(x => ({
      date: x.date,
      form: x.checkin?.form,
      decision: x.plan?.decision,
      applied: !!x.applied
    })),
    court: window.BasketProfile?.summary(data.basketProfile) || null,
    skills: window.BasketSkills?.summary(data.skills) || null,
    week: ptCoachWeek(data),
    muscu: ptCoachMuscu(data),
    care: Object.entries(data.rehab?.levels || {}).map(([protocol, level]) => ({
      protocol,
      level: window.RehabWarmup?.LEVELS[level] || level
    })),
    season: ptCoachSeason(data, today),
    shooting: window.Shooting?.summary(data.shooting) || null,
    weight: (() => {
      const BW = window.BodyWeight;
      if (!BW) return null;
      const s = BW.summary(data);
      return s.avg === null ? null : {
        avg7: s.avg,
        trendPerWeek: s.trend,
        playWeight: s.playWeight,
        gap: s.gap
      };
    })(),
    trends: ptCoachTrends(data, today)
  };
}

// Lot 14 : phase du plan et séances prévues aujourd'hui / demain (season-plan.js).
function ptCoachSeason(data, today) {
  const SP = window.SeasonPlan;
  if (!SP) return null;
  try {
    const built = SP.build(data, today),
      week = SP.weekSchedule(data, today, today),
      next = SP.at(today, 1);
    const on = date => {
      const d = week.days.find(x => x.date === date) || SP.weekSchedule(data, date, today).days.find(x => x.date === date);
      return d ? d.items.map(x => ({
        label: x.label,
        legs: x.legs,
        status: x.status
      })) : [];
    };
    return {
      phase: built.current.phase?.name || null,
      week: built.current.week,
      deload: built.deload,
      today: on(today),
      tomorrow: on(next),
      warnings: week.warnings
    };
  } catch (e) {
    return null;
  }
}
// Tendances sur 14 jours : douleur (bilans du coach), forme, poids.
function ptCoachTrends(data, today) {
  const recent = (data.coachLog || []).filter(x => x.date && PT.dayDiff(today, x.date) >= 0 && PT.dayDiff(today, x.date) < 14);
  const pain = recent.map(x => Number(x.checkin?.painLevel)).filter(Number.isFinite);
  const weights = (data.measurements || []).filter(m => m.weight !== '' && PT.dayDiff(today, m.date) <= 14).sort((a, b) => a.date.localeCompare(b.date));
  return {
    painMax: pain.length ? Math.max(...pain) : null,
    painLast: pain.length ? pain[pain.length - 1] : null,
    forms: recent.map(x => x.checkin?.form).filter(Boolean),
    weightChange: weights.length >= 2 ? Math.round((Number(weights[weights.length - 1].weight) - Number(weights[0].weight)) * 10) / 10 : null,
    sessions14: data.sessions.filter(s => PT.dayDiff(today, s.date) >= 0 && PT.dayDiff(today, s.date) < 14).length
  };
}
// Repli hors connexion : mêmes principes que le coach, en règles simples.
function ptCoachLocal(c, data) {
  const regions = c.pain === 'yes' ? [...new Set(c.zones.map(ptCoachRegion))] : [];
  // Parcours ou muscu : la charge commune de la semaine tranche ; un match proche envoie vers la muscu (haut du corps).
  const day = data && window.TrainingLoad ? window.TrainingLoad.day(data) : null,
    hasMuscu = data?.program?.status === 'active';
  const target = hasMuscu && (day?.primary === 'muscu' || c.basketSoon !== 'none') ? 'muscu' : 'pathway';
  const plan = {
    decision: 'normal',
    intensity: 'normal',
    setsFactor: 1,
    restFactor: 1,
    minutes: c.minutes,
    avoidRegions: regions,
    avoidImpact: false,
    rehabRegion: '',
    rehabProtocol: '',
    target,
    why: ''
  };
  const tired = c.form <= 2 || c.sleep === 'bad' || c.soreness === 'strong' || c.basketYesterday !== 'none' && c.basketIntensity === 'hard';
  if (c.pain === 'yes' && (c.painLevel >= 7 || c.redFlags)) Object.assign(plan, {
    decision: 'rest',
    why: 'Douleur forte ou signe inhabituel.'
  });else if (c.pain === 'yes' && c.painLevel >= 4) Object.assign(plan, {
    decision: 'rehab',
    rehabRegion: regions[0] || '',
    why: 'Douleur modérée : le soin passe avant.'
  });else if (c.form === 1) Object.assign(plan, {
    decision: 'mobility',
    intensity: 'reduced',
    setsFactor: .6,
    why: 'Très fatigué : on récupère.'
  });else if (tired || c.basketSoon !== 'none') Object.assign(plan, {
    decision: 'light',
    intensity: 'reduced',
    setsFactor: .7,
    restFactor: 1.2,
    avoidImpact: c.basketSoon !== 'none' || c.soreness === 'strong',
    why: c.basketSoon !== 'none' ? 'Basket proche : jambes fraîches.' : 'Fatigue : volume réduit.'
  });else plan.why = 'En forme : séance prévue.';
  const message = {
    rest: 'Repos aujourd’hui. Si la douleur est forte, gonfle ou te réveille, fais-la examiner par un professionnel.',
    rehab: 'On soigne la zone qui gêne avant de forcer. Fais le protocole de soin.',
    mobility: 'Grosse fatigue : une récup douce de 15 à 20 minutes, pas plus.',
    light: 'On garde la séance, en plus léger.',
    normal: 'Tout est au vert : séance prévue.'
  }[plan.decision];
  return {
    message: `${message} (coach hors ligne : règles simples)`,
    questions: [],
    plan,
    offline: true
  };
}

// Décision « mobilité » : récup de rehab-warmup.js selon le bilan (courbatures fortes → anti-courbatures sur les jambes, sinon grosse fatigue).
function ptCoachRecovery(state, c, minutes, check) {
  const RW = window.RehabWarmup;
  if (!RW || !RW.recoveryPlan) return PT.generate(state, {
    ...check,
    focus: 'mobility',
    minutes
  });
  return RW.recoveryPlan(PT, window.PlayerProfile, state, {
    feel: c.soreness === 'strong' ? 'sore' : 'tired',
    minutes: Math.max(10, minutes),
    tens: false
  });
}

// Garde-fous codés : l'IA ne peut jamais passer outre une douleur forte ou un signe inhabituel.
function ptCoachGuard(plan, c) {
  const regions = c.pain === 'yes' ? c.zones.map(ptCoachRegion) : [];
  const safe = {
    ...plan,
    avoidRegions: [...new Set([...(plan.avoidRegions || []), ...regions])]
  };
  if (c.pain === 'yes' && (c.painLevel >= 7 || c.redFlags)) return {
    ...safe,
    decision: 'rest',
    why: 'Douleur forte ou signe inhabituel : pas de séance.'
  };
  return safe;
}
async function ptCoachAsk(data, messages) {
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      messages,
      context: ptCoachContext(data)
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || 'Le coach ne répond pas.'), {
    config: res.status === 503
  });
  return json;
}

// Applique la décision : la séance du jour (parcours, sinon séance du profil joueur) est allégée, filtrée, ou remplacée.
function ptCoachApply({
  data,
  update,
  go,
  notify
}, entry) {
  const c = entry.checkin,
    plan = entry.plan,
    today = PT.dateKey();
  if (data.draft?.status === 'active') {
    notify('Une séance est déjà en cours : termine-la avant d’appliquer le coach.');
    go('session');
    return;
  }
  const check = {
    ...data.checkIn,
    date: today,
    equipment: data.owned,
    minutes: plan.minutes || c.minutes,
    energy: c.form <= 2 || c.sleep === 'bad' ? 'low' : 'normal',
    motivation: c.form <= 2 ? 'low' : 'normal'
  };
  const state = {
    ...data,
    checkIn: check
  };
  const mark = () => update(s => ({
    ...s,
    checkIn: check,
    coachLog: (s.coachLog || []).map(x => x.id === entry.id ? {
      ...x,
      applied: true
    } : x)
  }));
  if (plan.decision === 'rest') {
    mark();
    notify('Repos aujourd’hui. Ton bilan est enregistré.');
    go('today');
    return;
  }
  const RW = window.RehabWarmup,
    JP = window.PlayerProfile;
  // Douleur vive (4/10 et plus) : le protocole de soin seul. En dessous : la séance continue, avec le soin intégré.
  if (plan.decision === 'rehab' && !(c.pain === 'yes' && c.painLevel < 4)) {
    mark();
    const region = plan.rehabRegion || plan.avoidRegions[0];
    go('rehab', RW && region ? RW.zoneOfRegion[region] : undefined);
    return;
  }
  let base;
  if (plan.decision === 'mobility') base = ptCoachRecovery(state, c, Math.min(20, check.minutes), check);else {
    const BP = window.BasketPathway,
      p = data.pathway,
      PP = window.PersonalPrograms,
      prog = data.program?.status === 'active' ? data.program : null;
    // Séance skills : légère si le corps doit récupérer (sauts et changements de direction retirés).
    if (plan.target === 'skills' && window.BasketSkills?.complete(data.skills)) {
      const sk = window.BasketSkills.session(PT, state, {
        minutes: check.minutes,
        light: plan.avoidImpact || plan.intensity === 'reduced'
      });
      if (!sk.error) {
        update(s => ({
          ...s,
          checkIn: check,
          draft: {
            ...sk,
            coach: {
              decision: plan.decision,
              why: plan.why
            },
            reasons: [`Coach : ${plan.why || COACH_DECISIONS[plan.decision]}`, ...sk.reasons]
          },
          coachLog: (s.coachLog || []).map(x => x.id === entry.id ? {
            ...x,
            applied: true
          } : x)
        }));
        go('preview');
        return;
      }
    }
    // Le coach peut choisir la muscu (veille de match, parcours déjà fait…) : séance du programme, jambes protégées si besoin.
    if (plan.target === 'muscu' && prog && PP) {
      const pr = PP.progressOf(prog);
      base = PP.sessionPlan(prog, pr.currentWeek, pr.nextDay, state, PP.checkFor(state, prog, {
        minutes: Math.min(prog.minutes, check.minutes),
        energy: check.energy
      }));
    }
    if ((!base || base.error) && p && BP) {
      const step = BP.stepById(p.step),
        day = step.days.find(d => d.key === BP.weekStatus(p).next);
      if (day) base = BP.sessionPlan(PT, JP, state, p, day.key, {
        minutes: check.minutes
      });
    }
    if ((!base || base.error) && data.player?.position && JP) base = JP.dailyBody(PT, state, {
      minutes: check.minutes
    });
    if (!base || base.error) base = PT.generate(state, {
      ...check,
      focus: 'muscle'
    });
  }
  if (!base || base.error) {
    notify(base?.error || 'Aucune séance possible aujourd’hui.');
    return;
  }
  const r = ptCoachAdapt(state, check, base, c, plan);
  if (r.error) {
    notify(r.error);
    return;
  }
  update(s => ({
    ...s,
    checkIn: check,
    draft: r.draft,
    coachLog: (s.coachLog || []).map(x => x.id === entry.id ? {
      ...x,
      applied: true
    } : x)
  }));
  go('preview');
}

// Adapte une séance déjà construite au bilan : zones épargnées, séries et repos dosés, soin ajouté pour une douleur légère.
// Séance « normale » sans douleur : les exercices ressortent identiques.
function ptCoachAdapt(state, check, base, c, plan) {
  const RW = window.RehabWarmup,
    JP = window.PlayerProfile;
  const avoid = new Set(plan.avoidRegions || []);
  // Le soin cible justement la zone épargnée : il échappe au filtre, le reste de la séance non.
  const spared = e => e.pathwayRole === 'soin' || !(e.regions || []).some(r => avoid.has(r)) && !(plan.avoidImpact && e.impact);
  let exercises = base.exercises.filter(spared);
  if (exercises.filter(e => e.pathwayRole !== 'soin').length < 2 && plan.decision !== 'mobility') {
    const mobility = PT.generate(state, {
      ...check,
      focus: 'mobility',
      minutes: 15
    });
    if (mobility.error) return {
      error: 'Trop de zones à épargner : repos ou soin aujourd’hui.'
    };
    base = mobility;
    exercises = [...exercises.filter(e => e.pathwayRole === 'soin'), ...mobility.exercises.filter(e => !(e.regions || []).some(r => avoid.has(r)))];
  }
  exercises = exercises.map(e => e.pathwayRole === 'soin' ? e : {
    ...e,
    sets: Math.max(1, Math.round(e.sets * (plan.setsFactor || 1))),
    rest: Math.round((e.rest || 60) * (plan.restFactor || 1))
  });
  // Douleurs du bilan coach pas encore soignées dans la séance : on ajoute leur protocole (calmer en tête, renforcer en fin).
  const covered = new Set(exercises.filter(e => e.pathwayRole === 'soin').map(e => e.careRegion));
  const pains = c.pain === 'yes' && !c.redFlags && c.painLevel < 7 ? ptCoachPains(c, plan).filter(p => !covered.has(p.region)) : [];
  const care = RW && pains.length ? RW.careBlock(PT, JP, state, {
    pains,
    check,
    minutes: check.minutes,
    exclude: exercises.map(e => e.id)
  }) : null;
  if (care && (care.head.length || care.tail.length)) {
    exercises = RW.withCare(exercises, care);
    const main = () => exercises.filter(e => e.pathwayRole !== 'soin' && !e.pinned);
    const total = () => PT.estimateSeconds(exercises, 'classic') + (base.warmupSeconds || 0) + 60;
    while (total() > check.minutes * 60 && main().length > 2) exercises.splice(exercises.indexOf(main().pop()), 1);
  }
  if (!exercises.length) return {
    error: 'Trop de zones à épargner : repos ou soin aujourd’hui.'
  };
  const reasons = [`Coach : ${plan.why || COACH_DECISIONS[plan.decision]}`, ...(plan.because || []).map(b => `Parce que ${b.replace(/^parce ques*/i, '')}`), ...(care?.note && exercises.some(e => e.pathwayRole === 'soin') ? [care.note] : []), ...(base.reasons || [])];
  return {
    draft: {
      ...base,
      id: PT.uid(),
      exercises,
      coach: {
        decision: plan.decision,
        why: plan.why
      },
      reasons,
      estimatedMinutes: Math.ceil((PT.estimateSeconds(exercises, 'classic') + (base.warmupSeconds || 0) + 60) / 60)
    }
  };
}
function PTCoachCard({
  data,
  go
}) {
  const entry = ptCoachToday(data);
  if (entry) return /*#__PURE__*/React.createElement("button", {
    className: "coach-card done sport-reveal",
    onClick: () => go('coach')
  }, /*#__PURE__*/React.createElement("span", {
    className: "coach-avatar"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "spark",
    size: 20
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "Bilan du jour fait \xB7 ", COACH_DECISIONS[entry.plan?.decision] || 'en cours'), /*#__PURE__*/React.createElement("strong", null, entry.plan?.why || 'Voir la réponse du coach')), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }));
  return /*#__PURE__*/React.createElement("button", {
    className: "coach-card is-ask sport-reveal",
    onClick: () => go('coach')
  }, /*#__PURE__*/React.createElement("span", {
    className: "coach-avatar"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "spark",
    size: 20
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "Bilan du coach \xB7 30 secondes"), /*#__PURE__*/React.createElement("strong", null, "Comment tu te sens aujourd\u2019hui ?")), /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  }));
}

// Une question du bilan (défini hors du rendu : un composant recréé à chaque frappe ferait perdre le curseur).
function PTCoachQ({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "coach-q"
  }, /*#__PURE__*/React.createElement("h3", null, title), children);
}

/* Bilan avant séance : la question « comment tu te sens » posée au moment de lancer la séance prévue.
   « Rien à signaler » ne touche à rien ; sinon le coach adapte CETTE séance (jamais une autre). */
const PT_PRECHECK_SKIP = ['rehab', 'warmup', 'recovery'];
const ptPreCheckNeeded = plan => !!plan && plan.status !== 'active' && !plan.precheck && !plan.coach && !PT_PRECHECK_SKIP.includes(plan.source);
// Basket hier / aujourd'hui / demain : lu dans le calendrier (club déclaré, matchs saisis), plus demandé.
function ptPreCheckClub(data) {
  const SPx = window.SeasonPlan,
    today = PT.dateKey();
  if (!SPx) return {
    basketYesterday: 'none',
    basketIntensity: null,
    basketSoon: 'none'
  };
  const y = SPx.clubOf(data, SPx.at(today, -1)),
    t = SPx.clubOf(data, today),
    n = SPx.clubOf(data, SPx.at(today, 1));
  return {
    basketYesterday: y.match ? 'match' : y.practice ? 'practice' : 'none',
    basketIntensity: y.match ? 'hard' : y.practice ? 'medium' : null,
    basketSoon: t.match || t.practice ? 'today' : n.match || n.practice ? 'tomorrow' : 'none'
  };
}
// Réponses du bilan → questions de forme du programme de muscu (mêmes trois axes).
const ptPreCheckReadiness = c => ({
  energy: c.form <= 2 ? 0 : c.form === 3 ? 1 : 2,
  sleep: {
    bad: 0,
    mid: 1,
    good: 2
  }[c.sleep],
  soreness: {
    strong: 0,
    light: 1,
    none: 2
  }[c.soreness]
});
function PTPreCheck({
  data,
  update,
  go,
  notify,
  plan
}) {
  const [open, setOpen] = usePTState(false),
    [busy, setBusy] = usePTState(false),
    [error, setError] = usePTState(''),
    [result, setResult] = usePTState(null);
  const minutes = (plan?.estimatedMinutes || 45) + 10;
  const [c, setC] = usePTState(() => ({
    ...ptCoachBlank(),
    ...ptPreCheckClub(data),
    minutes
  }));
  if (!plan) return null;
  if (plan.precheck) {
    const p = plan.precheck;
    if (p.status !== 'adapted') return null;
    return /*#__PURE__*/React.createElement("section", {
      className: "precheck is-done",
      "aria-label": "Bilan avant s\xE9ance"
    }, /*#__PURE__*/React.createElement("span", {
      className: "coach-avatar"
    }, /*#__PURE__*/React.createElement(PTIcon, {
      name: "spark",
      size: 18
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "S\xE9ance adapt\xE9e par le coach \xB7 ", COACH_DECISIONS[p.decision] || ''), /*#__PURE__*/React.createElement("strong", null, p.why), p.notes?.length > 0 && /*#__PURE__*/React.createElement("ul", {
      className: "reason-list"
    }, p.notes.map(n => /*#__PURE__*/React.createElement("li", {
      key: n
    }, n))), /*#__PURE__*/React.createElement("button", {
      className: "text-button",
      onClick: () => go('coach')
    }, "Parler au coach \u2192")));
  }
  if (!ptPreCheckNeeded(plan)) return null;
  const set = (k, v) => setC(x => ({
    ...x,
    [k]: v
  }));
  const setDraft = fn => update(s => ({
    ...s,
    draft: fn(s.draft)
  }));
  const log = item => update(s => ({
    ...s,
    coachLog: [...(s.coachLog || []).filter(x => x.date !== item.date), item].slice(-60)
  }));
  const fine = () => {
    log({
      id: PT.uid(),
      date: PT.dateKey(),
      checkin: {
        ...c,
        form: 4,
        sleep: 'good',
        soreness: 'none',
        pain: 'no'
      },
      plan: ptCoachPlan({
        decision: 'normal',
        intensity: 'normal',
        why: 'Rien à signaler : séance prévue.'
      }),
      messages: [],
      applied: true,
      quick: true
    });
    setDraft(d => ({
      ...d,
      precheck: {
        date: PT.dateKey(),
        status: 'ok'
      }
    }));
  };
  const missing = c.form == null || !c.sleep || !c.soreness || !c.pain || c.pain === 'yes' && !c.zones.length;
  // Applique la décision à la séance prévue. Repos et soin vif : on propose, l'utilisateur choisit.
  const apply = entry => {
    const p = entry.plan,
      today = PT.dateKey();
    const check = {
      ...(plan.check || data.checkIn),
      date: today,
      minutes,
      energy: c.form <= 2 || c.sleep === 'bad' ? 'low' : 'normal',
      motivation: c.form <= 2 ? 'low' : 'normal'
    };
    const state = {
      ...data,
      checkIn: check
    };
    if (p.decision === 'rest' || p.decision === 'rehab' && !(c.pain === 'yes' && c.painLevel < 4)) {
      setResult(entry);
      return;
    }
    let base = plan,
      adaptPlan = p;
    // Grosse fatigue : une vraie récup (respiration, relâchement, étirements tenus), plus une simple séance de mobilité.
    if (p.decision === 'mobility') {
      base = ptCoachRecovery(state, c, Math.min(20, minutes), check);
      if (base.error) {
        setError(base.error);
        return;
      }
    } else if (plan.source === 'program-plan' && window.PersonalPrograms && data.program) {
      // Muscu : la forme du jour passe par le dosage du programme (pas de double réduction des séries).
      const PP = window.PersonalPrograms,
        prog = data.program,
        checkP = PP.checkForSession(data, prog, {
          answers: ptPreCheckReadiness(c),
          minutes: Number(prog.minutes) || minutes
        });
      const rebuilt = PP.sessionPlan(prog, plan.programWeekIndex, plan.programDay, data, checkP);
      if (!rebuilt.error) {
        base = rebuilt;
        adaptPlan = {
          ...p,
          setsFactor: 1,
          restFactor: 1
        };
      }
    }
    const r = ptCoachAdapt(state, check, base, c, adaptPlan);
    if (r.error) {
      setError(r.error);
      return;
    }
    const notes = [p.decision !== 'mobility' && adaptPlan.setsFactor < 1 && `Séries réduites (${Math.round(adaptPlan.setsFactor * 100)} %)`, p.restFactor > 1 && 'Repos allongé', p.avoidRegions.length > 0 && `Zones épargnées : ${p.avoidRegions.map(x => PT.regions[x]).join(', ')}`, p.avoidImpact && 'Pas de sauts ni d’impacts', base !== plan && plan.source === 'program-plan' && 'Volume calé sur ta forme du jour'].filter(Boolean);
    const unchanged = p.decision === 'normal' && r.draft.exercises.length === plan.exercises.length && r.draft.exercises.every((e, i) => e.id === plan.exercises[i].id && e.sets === plan.exercises[i].sets);
    update(s => ({
      ...s,
      coachLog: (s.coachLog || []).map(x => x.id === entry.id ? {
        ...x,
        applied: true
      } : x),
      draft: unchanged ? {
        ...s.draft,
        precheck: {
          date: today,
          status: 'ok'
        }
      } : {
        ...r.draft,
        precheck: {
          date: today,
          status: 'adapted',
          decision: p.decision,
          why: p.why || COACH_DECISIONS[p.decision],
          notes
        }
      }
    }));
    window.scrollTo(0, 0);
  };
  const send = async () => {
    if (missing) {
      setError('Réponds à chaque question pour que le coach adapte ta séance.');
      return;
    }
    setBusy(true);
    setError('');
    const messages = [{
      role: 'user',
      text: `${ptCoachSummary(c)} Séance prévue : ${plan.title}.`
    }];
    const ask = async () => {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          context: {
            ...ptCoachContext(data),
            plannedSession: {
              name: plan.title,
              minutes: plan.estimatedMinutes,
              exercises: plan.exercises.map(e => ({
                name: e.name,
                sets: e.sets,
                regions: e.regions,
                impact: !!e.impact
              }))
            }
          }
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Le coach ne répond pas.');
      return json;
    };
    let answer;
    try {
      answer = await ask();
    } catch (e) {
      answer = ptCoachLocal(c, data);
    }
    const entry = {
      id: PT.uid(),
      date: PT.dateKey(),
      checkin: c,
      plan: ptCoachGuard(ptCoachPlan(answer.plan), c),
      offline: !!answer.offline,
      messages: [...messages, {
        role: 'coach',
        text: answer.message,
        questions: answer.questions || []
      }],
      applied: false
    };
    log(entry);
    setBusy(false);
    apply(entry);
  };
  if (result) {
    const rest = result.plan.decision === 'rest',
      region = result.plan.rehabRegion || result.plan.avoidRegions[0],
      RW = window.RehabWarmup;
    return /*#__PURE__*/React.createElement("section", {
      className: `coach-plan precheck decision-${result.plan.decision}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "eyebrow"
    }, "Avant ta s\xE9ance"), /*#__PURE__*/React.createElement("h2", null, COACH_DECISIONS[result.plan.decision]), /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, result.plan.why), rest ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      onClick: () => {
        update(s => ({
          ...s,
          draft: null
        }));
        notify('Repos aujourd’hui. Ton bilan est enregistré.');
        go('today');
      }
    }, "OK, repos aujourd\u2019hui"), !(c.pain === 'yes' && (c.painLevel >= 7 || c.redFlags)) && /*#__PURE__*/React.createElement(PTButton, {
      quiet: true,
      onClick: () => {
        setResult(null);
        apply({
          ...result,
          plan: {
            ...result.plan,
            decision: 'mobility',
            why: 'Mobilité douce à la place de la séance.'
          }
        });
      }
    }, "Faire une mobilit\xE9 douce \xE0 la place")) : /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      onClick: () => {
        update(s => ({
          ...s,
          draft: null
        }));
        go('rehab', RW && region ? RW.zoneOfRegion[region] : undefined);
      }
    }, "Ouvrir le soin de la zone", /*#__PURE__*/React.createElement(PTIcon, {
      name: "arrow",
      size: 18
    })), /*#__PURE__*/React.createElement("button", {
      className: "text-button",
      onClick: () => go('coach')
    }, "Parler au coach \u2192"));
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "precheck stack",
    "aria-label": "Bilan avant s\xE9ance"
  }, /*#__PURE__*/React.createElement("div", {
    className: "precheck-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "coach-avatar"
  }, /*#__PURE__*/React.createElement(PTIcon, {
    name: "spark",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "Bilan du coach \xB7 avant la s\xE9ance"), /*#__PURE__*/React.createElement("strong", null, "Comment tu te sens ?"))), !open ? /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    onClick: fine
  }, "Rien \xE0 signaler"), /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setOpen(true)
  }, "Quelque chose ne va pas")) : /*#__PURE__*/React.createElement("div", {
    className: "stack coach-form"
  }, /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Ta forme"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: COACH_FORM,
    value: c.form,
    onChange: v => set('form', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Ta nuit"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'bad',
      label: 'Mauvaise'
    }, {
      value: 'mid',
      label: 'Moyenne'
    }, {
      value: 'good',
      label: 'Bonne'
    }],
    value: c.sleep,
    onChange: v => set('sleep', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Courbatures"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'none',
      label: 'Aucune'
    }, {
      value: 'light',
      label: 'Légères'
    }, {
      value: 'strong',
      label: 'Fortes'
    }],
    value: c.soreness,
    onChange: v => set('soreness', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Une douleur ?"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'no',
      label: 'Non'
    }, {
      value: 'yes',
      label: 'Oui'
    }],
    value: c.pain,
    onChange: v => set('pain', v)
  }), c.pain === 'yes' && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "O\xF9 ? (plusieurs choix possibles)"), /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    options: COACH_ZONES.map(z => ({
      value: z.id,
      label: z.label
    })),
    value: c.zones,
    onChange: v => set('zones', v)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: `Intensité : ${c.painLevel}/10`,
    type: "range",
    min: "1",
    max: "10",
    value: c.painLevel,
    onChange: e => set('painLevel', Number(e.target.value))
  }), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: c.redFlags,
    onChange: e => set('redFlags', e.target.checked)
  }), "Gonflement, douleur la nuit, articulation qui l\xE2che ou fourmillements"))), /*#__PURE__*/React.createElement(PTField, {
    label: "Autre chose ? (facultatif)",
    value: c.note,
    maxLength: "400",
    onChange: e => set('note', e.target.value),
    placeholder: "Ex. : jambes lourdes, stress, peu mang\xE9\u2026"
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: busy,
    onClick: send
  }, busy ? 'Le coach adapte ta séance…' : 'Adapter ma séance', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "text-button",
    onClick: () => {
      setOpen(false);
      setError('');
    }
  }, "Finalement, tout va bien")));
}
function PTCoach({
  data,
  update,
  go,
  notify
}) {
  const existing = ptCoachToday(data);
  const [c, setC] = usePTState(() => existing?.checkin || ptCoachBlank()),
    [busy, setBusy] = usePTState(false),
    [error, setError] = usePTState(''),
    [draft, setDraft] = usePTState(''),
    [redo, setRedo] = usePTState(false);
  const entry = redo ? null : existing;
  const set = (k, v) => setC(x => ({
    ...x,
    [k]: v
  }));
  const missing = c.form == null || !c.sleep || !c.soreness || !c.pain || !c.basketYesterday || !c.basketSoon || c.pain === 'yes' && !c.zones.length || c.basketYesterday !== 'none' && !c.basketIntensity;
  const save = fn => update(s => ({
    ...s,
    coachLog: fn(s.coachLog || []).slice(-60)
  }));
  const send = async () => {
    if (missing) {
      setError('Réponds à chaque question pour que le coach ait le tableau complet.');
      return;
    }
    setBusy(true);
    setError('');
    const messages = [{
      role: 'user',
      text: ptCoachSummary(c)
    }];
    let answer;
    try {
      answer = await ptCoachAsk(data, messages);
    } catch (e) {
      if (e.config) setError(e.message);
      answer = ptCoachLocal(c, data);
    }
    const plan = ptCoachGuard(answer.plan, c);
    const item = {
      id: PT.uid(),
      date: PT.dateKey(),
      checkin: c,
      plan,
      offline: !!answer.offline,
      messages: [...messages, {
        role: 'coach',
        text: answer.message,
        questions: answer.questions || []
      }],
      applied: false
    };
    save(log => [...log.filter(x => x.date !== item.date), item]);
    setRedo(false);
    setBusy(false);
  };
  const reply = async () => {
    const text = draft.trim();
    if (!text || !entry) return;
    setBusy(true);
    setError('');
    const messages = [...entry.messages.map(m => ({
      role: m.role,
      text: m.text
    })), {
      role: 'user',
      text
    }];
    try {
      const answer = await ptCoachAsk(data, messages);
      const plan = ptCoachGuard(answer.plan, entry.checkin);
      save(log => log.map(x => x.id === entry.id ? {
        ...x,
        plan,
        applied: false,
        messages: [...x.messages, {
          role: 'user',
          text
        }, {
          role: 'coach',
          text: answer.message,
          questions: answer.questions || []
        }]
      } : x));
      setDraft('');
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };
  if (entry) {
    const last = entry.messages.filter(m => m.role === 'coach').slice(-1)[0];
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
      eyebrow: "Coach \xB7 bilan du jour",
      title: "Ton plan du jour."
    }), /*#__PURE__*/React.createElement("div", {
      className: "stack-lg"
    }, /*#__PURE__*/React.createElement("div", {
      className: "coach-thread",
      "aria-live": "polite"
    }, entry.messages.map((m, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: `bubble ${m.role}`
    }, m.role === 'user' && i === 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("small", null, "Ton bilan"), m.text.replace(/^Bilan du jour : /, '')) : m.text, m.questions?.length > 0 && /*#__PURE__*/React.createElement("ul", null, m.questions.map(q => /*#__PURE__*/React.createElement("li", {
      key: q
    }, q)))))), /*#__PURE__*/React.createElement("section", {
      className: `coach-plan decision-${entry.plan.decision}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "eyebrow"
    }, "D\xE9cision"), /*#__PURE__*/React.createElement("h2", null, COACH_DECISIONS[entry.plan.decision]), /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, entry.plan.why), entry.plan.because?.length > 0 && /*#__PURE__*/React.createElement("ul", {
      className: "reason-list because-list"
    }, entry.plan.because.map(b => /*#__PURE__*/React.createElement("li", {
      key: b
    }, b))), /*#__PURE__*/React.createElement("ul", {
      className: "reason-list"
    }, entry.plan.decision !== 'rest' && entry.plan.setsFactor < 1 && /*#__PURE__*/React.createElement("li", null, "S\xE9ries r\xE9duites (", Math.round(entry.plan.setsFactor * 100), " %)"), entry.plan.restFactor > 1 && /*#__PURE__*/React.createElement("li", null, "Repos allong\xE9"), entry.plan.avoidRegions.length > 0 && /*#__PURE__*/React.createElement("li", null, "Zones \xE9pargn\xE9es : ", entry.plan.avoidRegions.map(r => PT.regions[r]).join(', ')), entry.plan.avoidImpact && /*#__PURE__*/React.createElement("li", null, "Pas de sauts ni d\u2019impacts"), !['rest', 'mobility'].includes(entry.plan.decision) && entry.checkin.pain === 'yes' && !entry.checkin.redFlags && entry.checkin.painLevel < (entry.plan.decision === 'rehab' ? 4 : 7) && /*#__PURE__*/React.createElement("li", null, "Soin int\xE9gr\xE9 : on calme la zone en d\xE9but de s\xE9ance, on la renforce \xE0 la fin")), entry.applied ? /*#__PURE__*/React.createElement("p", {
      className: "fine"
    }, "Appliqu\xE9 \xE0 ta s\xE9ance du jour.") : null, /*#__PURE__*/React.createElement(PTButton, {
      primary: true,
      onClick: () => ptCoachApply({
        data,
        update,
        go,
        notify
      }, entry)
    }, entry.plan.decision === 'rest' ? 'OK, repos aujourd’hui' : entry.plan.decision === 'rehab' && !(entry.checkin.pain === 'yes' && entry.checkin.painLevel < 4) ? 'Ouvrir le soin' : 'Appliquer à ma séance', /*#__PURE__*/React.createElement(PTIcon, {
      name: "arrow",
      size: 18
    })), entry.checkin.pain === 'yes' && /*#__PURE__*/React.createElement("button", {
      className: "text-button",
      onClick: () => go('symptoms')
    }, "Enregistrer cette douleur dans mon suivi \u2192")), entry.offline ? /*#__PURE__*/React.createElement("p", {
      className: "notice"
    }, "R\xE9ponse hors ligne. Reconnecte-toi pour parler au coach.") : /*#__PURE__*/React.createElement("div", {
      className: "coach-input"
    }, /*#__PURE__*/React.createElement(PTField, {
      label: "R\xE9pondre au coach",
      value: draft,
      maxLength: "600",
      onChange: e => setDraft(e.target.value),
      placeholder: last?.questions?.[0] || 'Une précision, une question…'
    }), /*#__PURE__*/React.createElement(PTButton, {
      disabled: busy || !draft.trim(),
      onClick: reply
    }, busy ? 'Le coach réfléchit…' : 'Envoyer')), error && /*#__PURE__*/React.createElement("p", {
      className: "error",
      role: "alert"
    }, error), /*#__PURE__*/React.createElement(PTButton, {
      quiet: true,
      onClick: () => {
        setC(entry.checkin);
        setRedo(true);
      }
    }, "Refaire mon bilan")));
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PTPageHead, {
    eyebrow: "Coach \xB7 bilan du jour",
    title: "Comment tu te sens ?"
  }, "R\xE9ponds en quelques touches. Le coach sait d\xE9j\xE0 ce que tu as fait dans l\u2019app."), /*#__PURE__*/React.createElement("div", {
    className: "stack-lg coach-form"
  }, /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Ta forme aujourd\u2019hui"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: COACH_FORM,
    value: c.form,
    onChange: v => set('form', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Ta nuit"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'bad',
      label: 'Mauvaise'
    }, {
      value: 'mid',
      label: 'Moyenne'
    }, {
      value: 'good',
      label: 'Bonne'
    }],
    value: c.sleep,
    onChange: v => set('sleep', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Courbatures"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'none',
      label: 'Aucune'
    }, {
      value: 'light',
      label: 'Légères'
    }, {
      value: 'strong',
      label: 'Fortes'
    }],
    value: c.soreness,
    onChange: v => set('soreness', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Une douleur ?"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'no',
      label: 'Non'
    }, {
      value: 'yes',
      label: 'Oui'
    }],
    value: c.pain,
    onChange: v => set('pain', v)
  }), c.pain === 'yes' && /*#__PURE__*/React.createElement("div", {
    className: "stack-sm"
  }, /*#__PURE__*/React.createElement("p", {
    className: "fine"
  }, "O\xF9 ? (plusieurs choix possibles)"), /*#__PURE__*/React.createElement(PTChips, {
    multi: true,
    options: COACH_ZONES.map(z => ({
      value: z.id,
      label: z.label
    })),
    value: c.zones,
    onChange: v => set('zones', v)
  }), /*#__PURE__*/React.createElement(PTField, {
    label: `Intensité : ${c.painLevel}/10`,
    type: "range",
    min: "1",
    max: "10",
    value: c.painLevel,
    onChange: e => set('painLevel', Number(e.target.value))
  }), /*#__PURE__*/React.createElement("label", {
    className: "check-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: c.redFlags,
    onChange: e => set('redFlags', e.target.checked)
  }), "Gonflement, douleur la nuit, articulation qui l\xE2che ou fourmillements"))), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Basket hier ?"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'none',
      label: 'Non'
    }, {
      value: 'practice',
      label: 'Entraînement'
    }, {
      value: 'match',
      label: 'Match'
    }],
    value: c.basketYesterday,
    onChange: v => set('basketYesterday', v)
  }), c.basketYesterday && c.basketYesterday !== 'none' && /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'light',
      label: 'Léger'
    }, {
      value: 'medium',
      label: 'Moyen'
    }, {
      value: 'hard',
      label: 'Dur'
    }],
    value: c.basketIntensity,
    onChange: v => set('basketIntensity', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Basket pr\xE9vu bient\xF4t ?"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [{
      value: 'none',
      label: 'Non'
    }, {
      value: 'today',
      label: 'Aujourd’hui'
    }, {
      value: 'tomorrow',
      label: 'Demain'
    }],
    value: c.basketSoon,
    onChange: v => set('basketSoon', v)
  })), /*#__PURE__*/React.createElement(PTCoachQ, {
    title: "Temps disponible"
  }, /*#__PURE__*/React.createElement(PTChips, {
    options: [15, 30, 45, 60].map(n => ({
      value: n,
      label: `${n} min`
    })),
    value: c.minutes,
    onChange: v => set('minutes', v)
  })), /*#__PURE__*/React.createElement(PTField, {
    label: "Autre chose ? (facultatif)",
    value: c.note,
    maxLength: "400",
    onChange: e => set('note', e.target.value),
    placeholder: "Ex. : jambes lourdes, stress, peu mang\xE9\u2026"
  }), error && /*#__PURE__*/React.createElement("p", {
    className: "error",
    role: "alert"
  }, error), /*#__PURE__*/React.createElement(PTButton, {
    primary: true,
    disabled: busy,
    onClick: send
  }, busy ? 'Le coach réfléchit…' : 'Envoyer au coach', /*#__PURE__*/React.createElement(PTIcon, {
    name: "arrow",
    size: 18
  })), redo && /*#__PURE__*/React.createElement(PTButton, {
    quiet: true,
    onClick: () => setRedo(false)
  }, "Revenir \xE0 la r\xE9ponse du coach")));
}