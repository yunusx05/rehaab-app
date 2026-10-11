// Installe les extraits « Lis ton défenseur » repérés par scripts/scout-defender-reads.cjs.
// Usage : node scripts/install-defender-reads.cjs <dossier-brut> [--sheet planche.jpg]
//   - garde les moments réussis, pieds visibles, hommes uniquement, non refusés dans scripts/defender-reads-review.json ;
//   - télécharge chaque vidéo source (480p), coupe l'extrait (clips/reads/<id>.mp4, muet) et son affiche à l'instant de pause ;
//   - écrit defender-reads.js (window.RehaabReads) et, avec --sheet, une planche des images de pause pour la relecture.
const {execFile}=require('child_process'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),dir=path.join(root,'clips','reads');
const [raw,...rest]=process.argv.slice(2);if(!raw){console.error('Usage : node scripts/install-defender-reads.cjs <dossier-brut> [--sheet fichier.jpg]');process.exit(1);}
const sheetAt=rest.includes('--sheet')?rest[rest.indexOf('--sheet')+1]:null;
const run=(cmd,a)=>new Promise((ok,ko)=>execFile(cmd,a,{encoding:'utf8',maxBuffer:64e6},(e,o,er)=>e?ko(Object.assign(e,{stderr:er})):ok(o)));
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'defender-reads.json'),'utf8')).videos;
const reviewFile=path.join(__dirname,'defender-reads-review.json');
const review=fs.existsSync(reviewFile)?JSON.parse(fs.readFileSync(reviewFile,'utf8')):{refused:{},fixes:{}};
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(raw,{recursive:true});
const LEVEL={'lead-foot':1,sagging:1,'closeout-late':1,overplay:1,'hands-high':2,'closeout-fast':2,retreat:2,'help-comes':3,'help-stays':3};
const pick=[],perType={},CAP=Number(process.env.READS_CAP||12);
for(const [vid,v] of Object.entries(data)) (v.moments||[]).forEach((m,i)=>{
  const id=`r-${vid.replace(/[^A-Za-z0-9]/g,'').toLowerCase().slice(0,11)}-${i}`;
  if(!m.success||!m.feet_visible||!m.male_only||review.refused[id]) return;
  // Lecture enseignée : seules les réponses cohérentes avec l'indice sont gardées.
  const OK={'lead-foot':['drive-lead-side'],sagging:['shoot'],'closeout-late':['shoot'],'closeout-fast':['drive-lead-side','fake-drive'],overplay:['cross-opposite'],retreat:['shoot','hesi-go'],'help-comes':['pass-help-side'],'help-stays':['finish'],'hands-high':['drive-lead-side']};
  if(!(OK[m.cue]||[]).includes(m.action)) return;
  // Variété : pas plus de READS_CAP extraits par couple indice → action.
  const k=m.cue+'>'+m.action;if((perType[k]=(perType[k]||0)+1)>CAP) return;
  pick.push({id,vid,v,m:{...m,...(review.fixes[id]||{})}});
});
(async()=>{
  const items=[];
  for(const vid of [...new Set(pick.map(p=>p.vid))]){
    const src=path.join(raw,`${vid}.mp4`);
    if(!fs.existsSync(src)){try{await run('yt-dlp',['--no-warnings','--no-playlist','-f','bv*[height<=480][ext=mp4]/bv*[height<=480]/b[height<=480]/b','--remux-video','mp4','-o',src,`https://www.youtube.com/watch?v=${vid}`]);}catch(e){console.error(`${vid} : téléchargement impossible`);continue;}}
    for(const p of pick.filter(x=>x.vid===vid)){
      const from=Math.max(0,Number(p.m.start)-.3),to=Number(p.m.end)+.4,mp4=path.join(dir,`${p.id}.mp4`),poster=path.join(dir,`${p.id}.webp`);
      try{
        await run('ffmpeg',['-y','-loglevel','error','-ss',String(from),'-i',src,'-t',String(to-from),'-an','-vf','scale=-2:min(480\\,ih),fps=30','-c:v','libx264','-profile:v','main','-preset','slow','-crf','28','-g','15','-pix_fmt','yuv420p','-movflags','+faststart',mp4]);
        await run('ffmpeg',['-y','-loglevel','error','-ss',String(Number(p.m.pause)-from),'-i',mp4,'-frames:v','1','-vf','scale=480:-2','-q:v','75',poster]);
        items.push({id:p.id,file:`clips/reads/${p.id}.mp4`,poster:`clips/reads/${p.id}.webp`,start:0,pause:Math.round((Number(p.m.pause)-from)*100)/100,end:Math.round((to-from)*100)/100,
          cue:p.m.cue,action:p.m.action,level:LEVEL[p.m.cue]||2,what:String(p.m.what_fr||'').slice(0,220),why:String(p.m.why_fr||'').slice(0,300),
          source:{channel:p.v.channel,title:p.v.title,url:`https://www.youtube.com/watch?v=${p.vid}&t=${Math.floor(Number(p.m.start))}s`}});
        console.log(`${p.id} ← ${p.v.channel} · ${p.m.cue} → ${p.m.action}`);
      }catch(e){console.error(`${p.id} : découpe impossible`);}
    }
  }
  fs.writeFileSync(path.join(root,'defender-reads.js'),'/* Généré par scripts/install-defender-reads.cjs : extraits « Lis ton défenseur » (usage personnel). */\nwindow.RehaabReads = '+JSON.stringify(items,null,1)+';\n');
  console.log(`${items.length} extraits installés`);
  if(sheetAt&&items.length){
    const sharp=require(path.join(root,'node_modules','sharp'));
    const tiles=await Promise.all(items.map(async it=>sharp(path.join(root,it.poster)).resize(360,202,{fit:'cover'}).composite([{input:Buffer.from(`<svg width="360" height="26"><rect width="360" height="26" fill="black"/><text x="6" y="18" font-size="14" fill="white">${it.id} · ${it.cue} → ${it.action}</text></svg>`),top:0,left:0}]).toBuffer()));
    await sharp({create:{width:360*4,height:202*Math.ceil(tiles.length/4),channels:3,background:'#000'}}).composite(tiles.map((b,i)=>({input:b,left:(i%4)*360,top:Math.floor(i/4)*202}))).jpeg({quality:70}).toFile(sheetAt);
    console.log(`planche : ${sheetAt}`);
  }
})();
