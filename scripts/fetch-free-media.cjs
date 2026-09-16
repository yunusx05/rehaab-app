// Télécharge les photos de position des exercices encore sans illustration, depuis free-exercise-db
// (Unlicense), d'après les correspondances relues à la main dans scripts/free-media-map.json.
// À lancer depuis la racine du projet AVANT toute génération IA : une photo réelle du bon mouvement
// vaut mieux qu'une image générée, et elle ne coûte rien.
//
//   node scripts/fetch-free-media.cjs           # télécharge et met à jour exercise-media.js
//   node scripts/fetch-free-media.cjs --dry-run # liste seulement ce qui serait téléchargé
//
// Le script n'écrase jamais un exercice qui a déjà une vidéo, une paire ou des photos : il complète.
const fs = require('node:fs');
const path = require('node:path');
const PT = require('../personal-engine.js');

const ROOT = path.join(__dirname, '..');
const FEDB_JSON = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FEDB_IMG = id => n => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${id}/${n}.jpg`;
const dryRun = process.argv.includes('--dry-run');

function currentMedia() {
  const src = fs.readFileSync(path.join(ROOT, 'exercise-media.js'), 'utf8');
  const window = {};
  new Function('window', src)(window);
  return window.RehaabMedia || {};
}

async function download(url, target) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} sur ${url}`);
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, Buffer.from(await r.arrayBuffer()));
}

(async () => {
  const {map} = JSON.parse(fs.readFileSync(path.join(__dirname, 'free-media-map.json'), 'utf8'));
  const catalogIds = new Set(PT.catalog.map(e => e.id));
  const media = currentMedia();
  const fedb = await (await fetch(FEDB_JSON)).json();

  const planned = [], skipped = [];
  for (const [exerciseId, folder] of Object.entries(map)) {
    if (!catalogIds.has(exerciseId)) { skipped.push(`${exerciseId} : absent du catalogue`); continue; }
    const existing = media[exerciseId];
    if (existing && (existing.frames || existing.video || existing.pair)) { skipped.push(`${exerciseId} : déjà illustré`); continue; }
    const source = fedb.find(x => x.id === folder);
    if (!source) { skipped.push(`${exerciseId} : ${folder} introuvable dans free-exercise-db`); continue; }
    if ((source.images || []).length < 2) { skipped.push(`${exerciseId} : ${folder} n'a pas deux positions`); continue; }
    planned.push({exerciseId, folder, muscles: source.primaryMuscles, name: source.name});
  }

  skipped.forEach(s => console.log('  ignoré ·', s));
  console.log(`${planned.length} exercices à illustrer depuis free-exercise-db.`);
  if (dryRun) { planned.forEach(p => console.log('  ', p.exerciseId, '->', p.folder)); return; }

  const added = {};
  for (const p of planned) {
    try {
      await Promise.all([0, 1].map(n => download(FEDB_IMG(p.folder)(n), path.join(ROOT, 'media', p.folder, `${n}.jpg`))));
      added[p.exerciseId] = {frames: p.folder, muscles: p.muscles};
      console.log('  photos ·', p.exerciseId, '->', p.folder);
    } catch (e) {
      console.log('  échec ·', p.exerciseId, ':', e.message);
    }
  }

  const next = {...media};
  for (const [id, entry] of Object.entries(added)) next[id] = {...next[id], ...entry};
  const ordered = Object.fromEntries(PT.catalog.map(e => e.id).filter(id => next[id]).map(id => [id, next[id]]));
  for (const [id, entry] of Object.entries(next)) if (!ordered[id]) ordered[id] = entry;

  fs.writeFileSync(path.join(ROOT, 'exercise-media.js'),
    `window.RehaabMedia = ${JSON.stringify(ordered, null, 2)};\n`);
  console.log(`${Object.keys(added).length} exercices ajoutés. Relis chaque paire avant de committer : une variante différente doit être retirée de scripts/free-media-map.json.`);
})();
