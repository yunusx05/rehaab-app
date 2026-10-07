// Coach Rehaab : fonction Vercel qui interroge Gemini avec le bilan du jour et l'historique de l'app.
// Variables d'environnement (Vercel) : GEMINI_API_KEY (obligatoire), GEMINI_MODEL (facultatif).
// Pas de code d'accès (choix assumé pour un usage perso) : l'adresse est publique, mais chaque requête reste bornée en taille.
// La clé ne quitte jamais le serveur. L'app n'envoie que le résumé nécessaire, et ne stocke rien ici.
const MODEL_DEFAULT = 'gemini-3.6-flash';

const SYSTEM = `Tu es le coach personnel d'un joueur de basket adulte qui reprend après environ deux ans sans jouer : préparateur physique basket expérimenté, à l'aise avec tous les postes, et attentif aux blessures.
Il suit dans l'app un parcours « Retour au jeu » en 5 étapes (Fondations, Force, Puissance, Vitesse, Retour au jeu), qui porte le travail des jambes, des appuis et des sauts. Il peut aussi suivre un programme de musculation séparé (contexte "muscu"), complémentaire : haut du corps, chaîne postérieure, gainage, solidité au contact. Il fait des soins (protocoles par zone, intégrés aux séances quand une zone gêne) et des échauffements. Il joue en club (contexte "club" et "week").
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
- Choisis "target" : "pathway" (séance du parcours), "muscu" (séance du programme muscu) ou "none". Le parcours passe en premier quand les jambes sont fraîches ; la muscu prend la place la veille d'un match, après un entraînement de club ou quand le parcours est déjà fait. Jamais deux séances lourdes de jambes à moins de 24 h.
- Le jour d'un match : pas de séance (decision "rest"), seulement l'échauffement. Le lendemain : récupération ("mobility" ou "rehab").
- N'invente aucun exercice : tu choisis la séance et tu la doses avec les champs du plan.
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
        target: {type: 'STRING', enum: ['pathway', 'muscu', 'none']},
        why: {type: 'STRING'}
      },
      required: ['decision', 'intensity', 'setsFactor', 'restFactor', 'avoidRegions', 'avoidImpact', 'why']
    }
  },
  required: ['message', 'questions', 'plan']
};

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

  const contents = [
    {role: 'user', parts: [{text: `Contexte de l'app (JSON) :\n${context}`}]},
    {role: 'model', parts: [{text: 'Compris. J’attends le bilan du jour.'}]},
    ...messages.map(m => ({role: m.role === 'coach' ? 'model' : 'user', parts: [{text: m.text}]}))
  ];
  try {
    const model = process.env.GEMINI_MODEL || MODEL_DEFAULT;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-goog-api-key': key},
      body: JSON.stringify({systemInstruction: {parts: [{text: SYSTEM}]}, contents, generationConfig: {responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.4}})
    });
    const j = await r.json();
    const text = j.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
    if (!r.ok || !text) { res.status(502).json({error: 'Le coach ne répond pas pour le moment.'}); return; }
    const out = JSON.parse(text), p = out.plan || {};
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
      target: ['pathway', 'muscu', 'none'].includes(p.target) ? p.target : 'pathway',
      why: String(p.why || '').slice(0, 400)
    };
    res.status(200).json({message: String(out.message || '').slice(0, 1200), questions: (Array.isArray(out.questions) ? out.questions : []).slice(0, 2).map(q => String(q).slice(0, 200)), plan});
  } catch (e) {
    res.status(502).json({error: 'Le coach ne répond pas pour le moment.'});
  }
};
