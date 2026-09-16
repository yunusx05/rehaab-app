// Cherche, pour chaque exercice sans illustration, une correspondance dans les banques libres
// (free-exercise-db · Unlicense, et wger · CC BY-SA 4.0) AVANT toute génération par IA.
// Ne télécharge rien et ne modifie aucun média : il produit un rapport de propositions à relire.
// Usage : node scripts/match-free-media.cjs [> media/free-media-candidates.json]
const fs = require('node:fs');
const path = require('node:path');
const PT = require('../personal-engine.js');

const FEDB = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const WGER_VIDEOS = 'https://wger.de/api/v2/video/?limit=200&format=json';
const WGER_EXERCISES = 'https://wger.de/api/v2/exercise/?limit=1000&language=2&format=json';

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Le catalogue est en français, les banques en anglais : on rapproche par mots-clés du mouvement,
// pas par traduction littérale, puis on laisse un humain trancher.
const TERMS = {
  pompes:'push up', traction:'pull up', tractions:'pull up', rowing:'row', 'développé':'press',
  developpe:'press', squat:'squat', fente:'lunge', 'soulevé':'deadlift', souleve:'deadlift',
  curl:'curl', triceps:'triceps', mollet:'calf', mollets:'calf', gainage:'plank', planche:'plank',
  pont:'bridge', hanche:'hip', 'épaule':'shoulder', epaule:'shoulder', epaules:'shoulder',
  'élévation':'raise', elevation:'raise', 'élévations':'raise', 'écartés':'fly', ecartes:'fly',
  'poulie':'cable', 'élastique':'band', elastique:'band', kettlebell:'kettlebell', barre:'barbell',
  'haltère':'dumbbell', haltere:'dumbbell', 'haltères':'dumbbell', halteres:'dumbbell',
  banc:'bench', saut:'jump', sauts:'jump', assis:'seated', 'allongé':'lying', allonge:'lying',
  debout:'standing', 'incliné':'incline', incline:'incline', 'latéral':'side', lateral:'lateral',
  jambe:'leg', jambes:'leg', bassin:'hip', dos:'back', poitrine:'chest', abdos:'abs',
  genoux:'knee', genou:'knee', cheville:'ankle', poignet:'wrist', poignets:'wrist',
  'étirement':'stretch', etirement:'stretch', rotation:'twist', marche:'walk',
  'extension':'extension', flexion:'curl', abduction:'abduction', prise:'grip',
  montée:'up', montees:'raise', maintien:'hold', 'équilibre':'balance', equilibre:'balance'
};
const keywords = name => {
  const words = norm(name).split(' ');
  const out = new Set();
  words.forEach(w => { if (TERMS[w]) out.add(TERMS[w]); else if (w.length > 3) out.add(w); });
  return [...out];
};

// Un candidat n'est retenu que s'il partage le mouvement ET le matériel : une variante différente
// est pire qu'une absence d'image, la consigne affichée ne correspondrait plus au geste montré.
const EQUIP = {
  dumbbells:'dumbbell', barbell:'barbell', kettlebell:'kettlebell', cable:'cable',
  bands:'bands', bench:'bench', pullup:'body only', bodyweight:'body only'
};

function score(exercise, entry) {
  const want = keywords(exercise.name);
  const have = norm(entry.name).split(' ');
  const hits = want.filter(k => have.some(h => h === k || h.startsWith(k) || k.startsWith(h)));
  if (!hits.length) return 0;
  let s = hits.length * 10 - Math.abs(want.length - hits.length) * 2;
  const needs = (exercise.needs || []).filter(id => id !== 'bodyweight').map(id => EQUIP[id]).filter(Boolean);
  const entryEquip = norm(entry.equipment || '');
  if (needs.length) { if (needs.some(n => entryEquip.includes(n) || have.includes(n))) s += 8; else s -= 10; }
  else if (entryEquip && !['body only','none'].includes(entryEquip)) s -= 6;
  return s;
}

(async () => {
  const [fedb, videos, wgerExercises] = await Promise.all([
    fetch(FEDB).then(r => r.json()),
    fetch(WGER_VIDEOS).then(r => r.json()),
    fetch(WGER_EXERCISES).then(r => r.json()).catch(() => ({results:[]}))
  ]);

  const mediaSrc = fs.readFileSync(path.join(__dirname, '..', 'exercise-media.js'), 'utf8');
  const sandbox = {window:{}}; new Function('window', mediaSrc)(sandbox.window);
  const media = sandbox.window.RehaabMedia || {};
  const missing = PT.catalog.filter(e => { const m = media[e.id]; return !m || (!m.frames && !m.video && !m.pair && !m.card); });

  // Vidéos wger : seules les CC BY-SA 4.0 (licence 2) sont exploitables, comme pour le lot existant.
  const freeVideos = (videos.results || []).filter(v => v.license === 2);
  const videoNames = new Map((wgerExercises.results || []).map(x => [x.id, x.name]));

  const report = missing.map(e => {
    const photo = fedb
      .filter(x => (x.images || []).length >= 2)
      .map(x => ({id:x.id, name:x.name, equipment:x.equipment, muscles:x.primaryMuscles, score:score(e, x)}))
      .filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
    const video = freeVideos
      .map(v => ({videoId:v.id, name:videoNames.get(v.exercise_base ?? v.exercise) || '', url:v.video,
                  author:v.license_author, score:score(e, {name:videoNames.get(v.exercise_base ?? v.exercise) || ''})}))
      .filter(v => v.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);
    return {id:e.id, name:e.name, pattern:e.pattern, needs:e.needs, photoCandidates:photo, videoCandidates:video};
  });

  const withAny = report.filter(r => r.photoCandidates.length || r.videoCandidates.length);
  const strong = report.filter(r => r.photoCandidates[0]?.score >= 18);
  console.error(`${missing.length} exercices sans illustration · ${withAny.length} avec au moins une piste libre · ${strong.length} pistes fortes (score >= 18)`);
  console.error('Chaque paire retenue doit être relue image par image avant intégration : une variante différente est écartée.');
  process.stdout.write(JSON.stringify({generatedAt:new Date().toISOString(), missing:missing.length, report}, null, 2));
})();
