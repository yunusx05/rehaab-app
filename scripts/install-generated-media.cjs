// Installe les paires générées du lot 5 dans l'app : 720 px, media/generated/<id>/0|1.webp, vignette = arrivée,
// entrée dans exercise-media.js et précache dans sw.js. Usage : node scripts/install-generated-media.cjs [--skip id ...]
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const output=require('./fal-key.cjs').generationsDir;
const ledger=JSON.parse(fs.readFileSync(path.join(output,'rehaab_media_lot_2026-10-01b.json'),'utf8'));
const args=process.argv.slice(2),skip=args[0]==='--skip'?new Set(args.slice(1)):new Set();
const mediaFile=path.join(root,'exercise-media.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(mediaFile,'utf8'),ctx);
const media=JSON.parse(JSON.stringify(ctx.window.RehaabMedia));
const latest=(id,pose)=>[...ledger.attempts].reverse().find(x=>x.id===id&&x.pose===pose&&x.status==='saved');
const ids=[...new Set(ledger.attempts.map(x=>x.id))].filter(id=>!skip.has(id)&&latest(id,'start')&&latest(id,'end'));
const installed=[];
for(const id of ids){
  const dir=path.join(root,'media','generated',id);fs.mkdirSync(dir,{recursive:true});
  ['start','end'].forEach((pose,i)=>execFileSync('ffmpeg',['-y','-loglevel','error','-i',latest(id,pose).file,'-vf','scale=720:-2','-c:v','libwebp','-quality','78',path.join(dir,`${i}.webp`)]));
  fs.copyFileSync(path.join(dir,'1.webp'),path.join(root,'media','cards',`${id}.webp`));
  media[id]={card:`media/cards/${id}.webp`,frames:`generated/${id}`,generated:true};
  installed.push(id);
}
fs.writeFileSync(mediaFile,'window.RehaabMedia = '+JSON.stringify(media,null,2)+';\n');
const swFile=path.join(root,'sw.js');let sw=fs.readFileSync(swFile,'utf8');
const lines=installed.flatMap(id=>[`./media/cards/${id}.webp`,`./media/generated/${id}/0.webp`,`./media/generated/${id}/1.webp`]).filter(l=>!sw.includes(`'${l}'`));
// Les illustrations vont dans PRECACHE_MEDIA : rempli en arrière-plan, jamais attendu à l'installation.
if(lines.length){const from=sw.indexOf('const PRECACHE_MEDIA = [');const end=sw.indexOf('\n];',from);sw=sw.slice(0,end)+',\n'+lines.map(l=>`  '${l}'`).join(',\n')+sw.slice(end);fs.writeFileSync(swFile,sw);}
console.log('INSTALLES',installed.length,'| précache +',lines.length);
