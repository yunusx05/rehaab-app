// « Vu chez… » : relie les fiches du catalogue aux vidéos des créateurs repérées par l'éclaireur (scripts/drill-candidates.json).
// Usage : node scripts/install-drill-sources.cjs  → drill-sources.js (window.RehaabSources = {id:[{creator,title,url}]}).
// Un drill reconnu par Gemini comme une fiche existante (même nom) est crédité à l'instant exact où il est montré.
// scripts/drill-sources-manual.json ajoute les fiches écrites d'après une vidéo précise : {"id":[{"videoId":"…","start":12}]}.
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
global.window={};
const PT=require(path.join(root,'personal-engine.js')),SK=require(path.join(root,'basket-skills.js'));
const all=[...PT.catalog,...SK.drills];
const byName=new Map(all.map(e=>[e.name.toLowerCase(),e.id]));
const cand=JSON.parse(fs.readFileSync(path.join(__dirname,'drill-candidates.json'),'utf8')).videos;
const manualFile=path.join(__dirname,'drill-sources-manual.json');
const manual=fs.existsSync(manualFile)?JSON.parse(fs.readFileSync(manualFile,'utf8')):{};
const out={};
// Même chaîne vue sous son nom ou son identifiant : un seul libellé.
const alias={overtimeathletes:'Overtime Athletes',PJFPerformance:'PJF Performance'};
const add=(id,v,start)=>{
  if(!all.some(e=>e.id===id)||!v||!v.channel)return;
  v={...v,channel:alias[v.channel]||v.channel};
  const url=`https://www.youtube.com/watch?v=${v.videoId}&t=${Math.max(0,Math.floor(Number(start)||0))}s`;
  const list=out[id]=out[id]||[];
  // Une seule vidéo par créateur et par fiche : la première trouvée.
  if(!list.some(s=>s.creator===v.channel))list.push({creator:v.channel,title:v.title.trim(),url});
};
for(const v of Object.values(cand))for(const d of v.drills||[]){
  const id=byName.get(String(d.duplicate_of||d.name).toLowerCase());
  if(id)add(id,v,d.start);
}
for(const [id,refs] of Object.entries(manual))for(const r of refs)add(id,cand[r.videoId]||(r.channel&&{videoId:r.videoId,channel:r.channel,title:r.title||''}),r.start);
const ordered=Object.fromEntries(Object.keys(out).sort().map(k=>[k,out[k].slice(0,3)]));
fs.writeFileSync(path.join(root,'drill-sources.js'),'/* Généré par scripts/install-drill-sources.cjs : vidéos des créateurs où chaque fiche est montrée. */\nwindow.RehaabSources = '+JSON.stringify(ordered,null,1)+';\n');
const creators=[...new Set(Object.values(ordered).flat().map(s=>s.creator))];
console.log(`${Object.keys(ordered).length} fiches créditées, ${creators.length} créateurs : ${creators.join(', ')}`);
