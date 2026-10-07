// Coach Rehaab : fonction Vercel qui interroge Gemini avec le bilan du jour et l'historique de l'app.
// Variables d'environnement (Vercel) : GEMINI_API_KEY (obligatoire), GEMINI_MODEL (facultatif).
// Pas de code d'accès (choix assumé pour un usage perso) : l'adresse est publique, mais chaque requête reste bornée en taille.
// La clé ne quitte jamais le serveur. L'app n'envoie que le résumé nécessaire, et ne stocke rien ici.
const MODEL_DEFAULT = 'gemini-3.6-flash';

const SYSTEM = `Tu es le coach personnel de préparation physique basket d'un joueur adulte qui reprend après environ deux ans sans jouer.
Il suit dans l'app un parcours « Retour au jeu » en 5 étapes (Fondations, Force, Puissance, Vitesse, Retour au jeu) et fait aussi des séances de soins (protocoles par zone) et d'échauffement.
Ton rôle : à partir de son état du jour et de ce qu'il a fait récemment (séances de l'app, basket en club), décider ce qu'il fait aujourd'hui et ajuster la séance prévue.

Règles :
- Réponds en français, tutoiement, phrases courtes, langage simple. 4 phrases maximum dans "message".
- Tu n'es pas médecin : jamais de diagnostic. Douleur forte (7/10 ou plus), gonflement, douleur nocturne, instabilité, engourdissement ou douleur qui augmente pendant l'effort : decision "rest" et conseille de consulter un professionnel de santé.
- Douleur légère à modérée sur une zone : garde l'entraînement mais retire cette zone (avoidRegions), ou propose le soin de la zone (decision "rehab").
- Fatigue forte, mauvais sommeil, grosses courbatures, match ou entraînement dur la veille, ou deux séances dures d'affilée : allège (intensity "reduced", setsFactor 0.6 à 0.8, avoidImpact si les jambes sont lourdes) ou decision "mobility".
- Match ou entraînement de basket aujourd'hui ou demain : pas de travail lourd des jambes, pas de sauts (avoidImpact true), séance courte.
- En forme et sans douleur : decision "normal", séance prévue telle quelle.
- Si une information essentielle manque (par exemple l'intensité d'une douleur), pose 1 ou 2 questions courtes dans "questions" ; sinon laisse "questions" vide.
- N'invente aucun exercice : tu ajustes seulement la séance prévue avec les champs du plan.
Zones possibles pour avoidRegions : neck, shoulder, elbow, wrist, back, hip, knee, ankle.`;

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
      why: String(p.why || '').slice(0, 400)
    };
    res.status(200).json({message: String(out.message || '').slice(0, 1200), questions: (Array.isArray(out.questions) ? out.questions : []).slice(0, 2).map(q => String(q).slice(0, 200)), plan});
  } catch (e) {
    res.status(502).json({error: 'Le coach ne répond pas pour le moment.'});
  }
};
