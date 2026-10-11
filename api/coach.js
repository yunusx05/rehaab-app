// Coach Rehaab : fonction Vercel qui interroge Gemini avec le bilan du jour et l'historique de l'app.
// Variables d'environnement (Vercel) : GEMINI_API_KEY (obligatoire), GEMINI_MODEL (facultatif).
// Pas de code d'accès (choix assumé pour un usage perso) : l'adresse est publique, mais chaque requête reste bornée en taille.
// La clé ne quitte jamais le serveur. L'app n'envoie que le résumé nécessaire, et ne stocke rien ici.
const MODEL_DEFAULT = 'gemini-3.6-flash';
// Architecte du plan : modèle le plus capable de la clé si GEMINI_MODEL_PLAN est défini, sinon le modèle du quotidien.
const {KNOWLEDGE} = require('./_knowledge.js');

const SYSTEM = `Tu es le coach personnel d'un joueur de basket adulte qui reprend après environ deux ans sans jouer : préparateur physique basket expérimenté, à l'aise avec tous les postes, et attentif aux blessures.
Il suit dans l'app un parcours « Retour au jeu » en 5 étapes (Fondations, Force, Puissance, Vitesse, Retour au jeu), qui porte le travail des jambes, des appuis et des sauts. Il peut aussi suivre un programme de musculation séparé (contexte "muscu"), complémentaire : haut du corps, chaîne postérieure, gainage, solidité au contact. Il fait des soins (protocoles par zone, intégrés aux séances quand une zone gêne) et des échauffements. Il joue en club (contexte "club" et "week"). Il suit aussi un programme de skills basket (contexte "skills" : paliers en maniement, tir, finition, appuis) : des séances skills seules et des blocs ajoutés après ses autres séances.
Le contexte "dossier", quand il est présent, résume tout ce qu'il a déclaré (gabarit, poids de jeu, pause, blessures, disponibilités, objectifs) : appuie-toi dessus.
Le contexte "season" donne sa phase, sa semaine, les séances prévues aujourd'hui et demain ; "trends" donne l'évolution sur 14 jours (douleur, forme, poids). Tiens-en compte.
Ton rôle : à partir de son état du jour, de sa semaine (club, parcours, muscu) et de ce qu'il vit sur le terrain (contexte "court" : forces, faiblesses, ressentis), décider ce qu'il fait aujourd'hui et doser la séance pour que l'ensemble reste complémentaire, sans surcharge.

Repères par poste (à adapter à ses faiblesses déclarées) :
- Meneur / arrière : premier pas, freinage et changements de direction, souffle sur la durée, chevilles réactives.
- Ailier : détente répétée, déplacements latéraux en défense, force sur une jambe, finir au contact.
- Intérieur : solidité au contact (écran, poste, rebond), force de base, dos et hanches, réceptions.

Règles :
- Réponds en français, tutoiement, phrases courtes, langage simple. 4 phrases maximum dans "message".
- Tu n'es pas médecin : jamais de diagnostic. Douleur forte (7/10 ou plus), gonflement, douleur nocturne, instabilité, engourdissement ou douleur qui augmente pendant l'effort : decision "rest" et conseille de consulter un professionnel de santé.
- Douleur légère à modérée sur une zone : garde l'entraînement mais retire cette zone (avoidRegions), ou propose le soin de la zone (decision "rehab").
- Fatigue forte, mauvais sommeil, grosses courbatures, match ou entraînement dur la veille, ou deux séances dures d'affilée : allège (intensity "reduced", setsFactor 0.6 à 0.8, avoidImpact si les jambes sont lourdes) ou decision "mobility".
- Match ou entraînement de basket aujourd'hui ou demain : pas de travail lourd des jambes, pas de sauts (avoidImpact true), séance courte.
- En forme et sans douleur : decision "normal", séance prévue telle quelle.
- Si une information essentielle manque (par exemple l'intensité d'une douleur), pose 1 ou 2 questions courtes dans "questions" ; sinon laisse "questions" vide.
- Douleur légère (3/10 ou moins) : l'app ajoute d'elle-même le soin de la zone à la séance (calmer au début, renforcer à la fin). Tu peux préciser le protocole dans "rehabProtocol" si le bilan le permet.
- Choisis "target" : "pathway" (séance du parcours), "muscu" (séance du programme muscu), "skills" (séance de skills basket : dribble, tir, finition) ou "none". Les skills conviennent quand le corps doit récupérer mais que l'envie de jouer est là : version légère (tir, dribble sur place) la veille ou le lendemain d'un match, jamais le jour d'un match ni d'un entraînement de club. Le parcours passe en premier quand les jambes sont fraîches ; la muscu prend la place la veille d'un match, après un entraînement de club ou quand le parcours est déjà fait. Jamais deux séances lourdes de jambes à moins de 24 h.
- Le jour d'un match : pas de séance (decision "rest"), seulement l'échauffement. Le lendemain : récupération ("mobility" ou "rehab").
- N'invente aucun exercice : tu choisis la séance et tu la doses avec les champs du plan.
- "because" : 2 ou 3 raisons courtes, chacune appuyée sur une donnée précise du contexte (« parce que … »).
Zones possibles pour avoidRegions : neck, shoulder, elbow, wrist, back, hip, knee, ankle.`;

// Protocoles de soin connus de l'app (rehab-warmup.js) : l'IA ne peut en citer aucun autre.
const PROTOCOLS = ['knee-patellar', 'knee-pfp', 'knee-control', 'ankle-sprain', 'ankle-stiff', 'achilles', 'plantar', 'shin', 'groin', 'hip-flexor', 'hip-lateral', 'hamstring', 'low-back', 'shoulder', 'hand', 'elbow', 'neck'];

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    message: {type: 'STRING'},
    questions: {type: 'ARRAY', items: {type: 'STRING'}},
    plan: {
      type: 'OBJECT',
      properties: {
        decision: {type: 'STRING', enum: ['normal', 'light', 'mobility', 'rehab', 'rest']},
        intensity: {type: 'STRING', enum: ['normal', 'reduced']},
        setsFactor: {type: 'NUMBER'},
        restFactor: {type: 'NUMBER'},
        minutes: {type: 'INTEGER'},
        avoidRegions: {type: 'ARRAY', items: {type: 'STRING', enum: ['neck', 'shoulder', 'elbow', 'wrist', 'back', 'hip', 'knee', 'ankle']}},
        avoidImpact: {type: 'BOOLEAN'},
        rehabRegion: {type: 'STRING'},
        rehabProtocol: {type: 'STRING', description: 'Un des protocoles connus, ou vide : ' + PROTOCOLS.join(', ')},
        target: {type: 'STRING', enum: ['pathway', 'muscu', 'skills', 'none']},
        why: {type: 'STRING'},
        because: {type: 'ARRAY', items: {type: 'STRING'}}
      },
      required: ['decision', 'intensity', 'setsFactor', 'restFactor', 'avoidRegions', 'avoidImpact', 'why']
    }
  },
  required: ['message', 'questions', 'plan']
};

// Mode « dossier » : l'IA lit le dossier complet du joueur, dit ce qu'elle a compris et pose les questions qui manquent.
const DOSSIER_SYSTEM = `Tu es préparateur physique basket et coach de développement. Tu lis le dossier d'un joueur adulte (gabarit, poste, pause, santé, corps, semaine, objectifs) et les priorités déjà calculées par l'app ("computed").
Ton rôle : dire en clair ce que tu as compris de lui, ses 3 priorités pour les prochaines semaines et pourquoi, les points d'attention, puis poser 2 à 5 questions de relance qui changeraient vraiment son programme.
Règles :
- Français, tutoiement, phrases courtes, langage simple. "message" : 5 phrases maximum.
- Tu n'es pas médecin : jamais de diagnostic. Signe d'alerte ou douleur à 7/10 ou plus : dis de consulter avant de cibler la zone.
- Tes priorités partent des siennes, mais l'ordre suit la sécurité : tendons, poids et appuis avant les sauts répétés quand il reprend après une longue pause, a pris du poids ou a mal.
- Chaque "why" s'appuie sur une réponse précise du dossier.
- Les questions portent sur ce qui manque ou reste flou (ce qui déclenche une douleur, l'historique exact d'une blessure, le contenu de ses entraînements en club, ses disponibilités réelles). Jamais une question déjà répondue dans le dossier ou dans les relances.
- Aucun chiffre présenté comme une norme ; pas de promesse de résultat.`;
const DOSSIER_SCHEMA = {
  type: 'OBJECT',
  properties: {
    message: {type: 'STRING'},
    priorities: {type: 'ARRAY', items: {type: 'OBJECT', properties: {label: {type: 'STRING'}, why: {type: 'STRING'}}, required: ['label', 'why']}},
    risks: {type: 'ARRAY', items: {type: 'STRING'}},
    questions: {type: 'ARRAY', items: {type: 'STRING'}}
  },
  required: ['message', 'priorities', 'risks', 'questions']
};

// Mode « plan » : l'IA architecte lit le dossier et les priorités calculées, puis choisit un exercice par créneau
// dans une liste FERMÉE fournie par l'app. Le serveur rejette tout identifiant hors de cette liste.
const PLAN_SYSTEM = `Tu es l'architecte du plan d'un joueur de basket adulte. Tu reçois son dossier, ses priorités calculées par l'app, sa phase actuelle et, pour chaque créneau de ses séances, la liste fermée des exercices autorisés ("slots" : clé → [{id, name, transfer}]).
Ton rôle : un diagnostic (3 priorités et pourquoi), les accents par phase, un choix d'exercice par créneau parmi les autorisés, 3 à 5 règles personnelles et un message.
Règles :
- Français, tutoiement, phrases courtes. "message" : 5 phrases maximum.
- "choices" : uniquement des identifiants présents dans la liste du créneau. Si rien ne convient mieux que le premier, choisis le premier.
- Les règles personnelles protègent (« genou : pas de sauts répétés avant validation du tendon ») ; jamais de diagnostic, jamais de promesse chiffrée.
${KNOWLEDGE}`;
const PLAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    message: {type: 'STRING'},
    priorities: {type: 'ARRAY', items: {type: 'OBJECT', properties: {label: {type: 'STRING'}, why: {type: 'STRING'}}, required: ['label', 'why']}},
    accents: {type: 'ARRAY', items: {type: 'OBJECT', properties: {phase: {type: 'STRING'}, text: {type: 'STRING'}}, required: ['phase', 'text']}},
    rules: {type: 'ARRAY', items: {type: 'STRING'}},
    choices: {type: 'ARRAY', items: {type: 'OBJECT', properties: {slot: {type: 'STRING'}, id: {type: 'STRING'}}, required: ['slot', 'id']}}
  },
  required: ['message', 'priorities', 'accents', 'rules', 'choices']
};
// Mode « review » : debrief de la semaine écoulée, à partir du bilan calculé par l'app (prévu / fait, douleurs, tests, poids, tir, QI).
const REVIEW_SYSTEM = `Tu es le coach d'un joueur de basket adulte. Tu reçois le bilan de sa semaine calculé par l'app ("review") et ses ajustements possibles ("suggestions").
Écris un debrief court : ce qui s'est bien passé, ce qui coince, et ce que tu conseilles pour la semaine suivante parmi les suggestions (par leur id).
Français, tutoiement, 4 phrases maximum, aucune promesse chiffrée, jamais de diagnostic.
${KNOWLEDGE}`;
const REVIEW_SCHEMA = {type: 'OBJECT', properties: {message: {type: 'STRING'}, pick: {type: 'ARRAY', items: {type: 'STRING'}}}, required: ['message', 'pick']};

const clamp = (n, lo, hi, d) => Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Number(n))) : d;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({error: 'Méthode non autorisée.'}); return; }
  const key = process.env.GEMINI_API_KEY;
  if (!key) { res.status(503).json({error: 'Coach non configuré : ajoute GEMINI_API_KEY dans Vercel.'}); return; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') { res.status(400).json({error: 'Requête illisible.'}); return; }
  const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  const context = JSON.stringify(body.context || {}).slice(0, 24000);
  if (!messages.length || messages.some(m => typeof m?.text !== 'string' || m.text.length > 4000)) { res.status(400).json({error: 'Message invalide.'}); return; }

  const dossierMode = body.mode === 'dossier', planMode = body.mode === 'plan', reviewMode = body.mode === 'review';
  const contents = [
    {role: 'user', parts: [{text: `Contexte de l'app (JSON) :\n${context}`}]},
    {role: 'model', parts: [{text: 'Compris. J’attends le bilan du jour.'}]},
    ...messages.map(m => ({role: m.role === 'coach' ? 'model' : 'user', parts: [{text: m.text}]}))
  ];
  try {
    const model = (planMode && process.env.GEMINI_MODEL_PLAN) || process.env.GEMINI_MODEL || MODEL_DEFAULT;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-goog-api-key': key},
      body: JSON.stringify({systemInstruction: {parts: [{text: planMode ? PLAN_SYSTEM : reviewMode ? REVIEW_SYSTEM : dossierMode ? DOSSIER_SYSTEM : SYSTEM + String.fromCharCode(10) + KNOWLEDGE}]}, contents, generationConfig: {responseMimeType: 'application/json', responseSchema: planMode ? PLAN_SCHEMA : reviewMode ? REVIEW_SCHEMA : dossierMode ? DOSSIER_SCHEMA : SCHEMA, temperature: 0.4}})
    });
    const j = await r.json();
    const text = j.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
    if (!r.ok || !text) { res.status(502).json({error: 'Le coach ne répond pas pour le moment.'}); return; }
    const out = JSON.parse(text), p = out.plan || {};
    const str = (v, n) => String(v || '').slice(0, n);
    if (planMode) {
      // Liste fermée : seuls les identifiants proposés pour CE créneau sont acceptés.
      const slots = body.context && typeof body.context.slots === 'object' && body.context.slots ? body.context.slots : {};
      const allowed = slot => (Array.isArray(slots[slot]) ? slots[slot] : []).map(x => x && x.id).filter(Boolean);
      const choices = {};
      (Array.isArray(out.choices) ? out.choices : []).slice(0, 80).forEach(c => { if (c && /^\d[A-Z]\d{1,2}$/.test(String(c.slot)) && allowed(c.slot).includes(c.id)) choices[c.slot] = c.id; });
      res.status(200).json({
        message: str(out.message, 1200),
        priorities: (Array.isArray(out.priorities) ? out.priorities : []).filter(x => x && x.label).slice(0, 3).map(x => ({label: str(x.label, 60), why: str(x.why, 300)})),
        accents: (Array.isArray(out.accents) ? out.accents : []).filter(x => x && x.phase && x.text).slice(0, 8).map(x => ({phase: str(x.phase, 30), text: str(x.text, 240)})),
        rules: (Array.isArray(out.rules) ? out.rules : []).slice(0, 5).map(x => str(x, 200)).filter(Boolean),
        choices
      });
      return;
    }
    if (reviewMode) {
      const ids = (Array.isArray(body.context?.suggestions) ? body.context.suggestions : []).map(s => s && s.id).filter(Boolean);
      res.status(200).json({message: str(out.message, 900), pick: (Array.isArray(out.pick) ? out.pick : []).filter(id => ids.includes(id)).slice(0, 3)});
      return;
    }
    if (dossierMode) {
      res.status(200).json({
        message: str(out.message, 1500),
        priorities: (Array.isArray(out.priorities) ? out.priorities : []).filter(x => x && x.label).slice(0, 3).map(x => ({label: str(x.label, 80), why: str(x.why, 240)})),
        risks: (Array.isArray(out.risks) ? out.risks : []).slice(0, 3).map(x => str(x, 200)),
        questions: (Array.isArray(out.questions) ? out.questions : []).slice(0, 5).map(x => str(x, 240)).filter(Boolean)
      });
      return;
    }
    // Bornes côté serveur : l'IA ne peut ni gonfler une séance ni supprimer le repos.
    const plan = {
      decision: ['normal', 'light', 'mobility', 'rehab', 'rest'].includes(p.decision) ? p.decision : 'light',
      intensity: p.intensity === 'normal' ? 'normal' : 'reduced',
      setsFactor: clamp(p.setsFactor, 0.4, 1, 1),
      restFactor: clamp(p.restFactor, 1, 1.6, 1),
      minutes: p.minutes ? clamp(p.minutes, 10, 75, 30) : null,
      avoidRegions: (Array.isArray(p.avoidRegions) ? p.avoidRegions : []).filter(x => ['neck', 'shoulder', 'elbow', 'wrist', 'back', 'hip', 'knee', 'ankle'].includes(x)),
      avoidImpact: !!p.avoidImpact,
      rehabRegion: typeof p.rehabRegion === 'string' ? p.rehabRegion.slice(0, 20) : '',
      rehabProtocol: PROTOCOLS.includes(p.rehabProtocol) ? p.rehabProtocol : '',
      target: ['pathway', 'muscu', 'skills', 'none'].includes(p.target) ? p.target : 'pathway',
      why: String(p.why || '').slice(0, 400),
      because: (Array.isArray(p.because) ? p.because : []).slice(0, 3).map(x => String(x).slice(0, 200)).filter(Boolean)
    };
    res.status(200).json({message: String(out.message || '').slice(0, 1200), questions: (Array.isArray(out.questions) ? out.questions : []).slice(0, 2).map(q => String(q).slice(0, 200)), plan});
  } catch (e) {
    res.status(502).json({error: 'Le coach ne répond pas pour le moment.'});
  }
};
