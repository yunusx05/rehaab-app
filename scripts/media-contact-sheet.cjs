// Planche de relecture : chaque ligne = départ | arrivée d'un exercice du lot 5 (dernière paire enregistrée).
// Usage : node scripts/media-contact-sheet.cjs <sortie.jpg> id [id ...]
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const output="C:/Users/Anton/Desktop/WORKS/generation d'image IA";
const ledger=JSON.parse(fs.readFileSync(path.join(output,'rehaab_media_lot_2026-10-01b.json'),'utf8'));
const [out,...ids]=process.argv.slice(2);
const files=[];
for(const id of ids){
  const pick=pose=>[...ledger.attempts].reverse().find(x=>x.id===id&&x.pose===pose&&x.status==='saved');
  const s=pick('start'),e=pick('end');
  if(s&&e)files.push(s.file,e.file);else console.error('incomplet',id);
}
if(!files.length)process.exit(1);
const inputs=files.flatMap(f=>['-i',f]);
const rows=files.length/2;
const scaled=files.map((_,i)=>`[${i}:v]scale=300:225[v${i}]`);
const layout=files.map((_,i)=>`${(i%2)*300}_${Math.floor(i/2)*225}`).join('|');
const filter=scaled.join(';')+';'+files.map((_,i)=>`[v${i}]`).join('')+`xstack=inputs=${files.length}:layout=${layout}`;
execFileSync('ffmpeg',['-y','-loglevel','error',...inputs,'-filter_complex',filter,'-q:v','4',out]);
console.log('OK',rows,'paires');
