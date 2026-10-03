/* Convertit une fois pour toutes les illustrations JPG de media/ en WebP (≈ −50 % de poids) puis réécrit les chemins
   dans le code de l'app. Les JPG d'origine sont supprimés. Usage : node scripts/convert-media-webp.cjs [--dry]
   WebP est lu par Safari iOS 14+ et tous les navigateurs récents : pas besoin de repli JPG. */
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root=path.join(__dirname,'..'),dry=process.argv.includes('--dry');
const QUALITY=78;
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
// Fichiers de l'app qui citent des chemins media/*.jpg.
const SOURCES=['exercise-media.js','sw.js','personal-app.jsx','pathway-components.jsx','sport-components.jsx','visual-components.jsx','tests/live-session.spec.cjs','tests/athletic-assessment.spec.cjs'];
(async()=>{
  const jpgs=walk(path.join(root,'media')).filter(f=>/\.jpe?g$/i.test(f));
  let before=0,after=0;
  for(const file of jpgs){
    const target=file.replace(/\.jpe?g$/i,'.webp');
    before+=fs.statSync(file).size;
    if(dry)continue;
    await sharp(file).webp({quality:QUALITY,effort:6}).toFile(target);
    after+=fs.statSync(target).size;
    fs.unlinkSync(file);
  }
  let rewritten=0;
  for(const rel of SOURCES){
    const file=path.join(root,rel);if(!fs.existsSync(file))continue;
    const text=fs.readFileSync(file,'utf8');
    // Seuls les chemins sous media/ changent : les autres .jpg (aucun aujourd'hui) restent intacts.
    const next=text.replace(/(media\/[^'"`\s)]*?)\.jpe?g\b/g,'$1.webp');
    if(next!==text){rewritten++;if(!dry)fs.writeFileSync(file,next);}
  }
  const mb=n=>(n/1048576).toFixed(1)+' Mo';
  console.log(`${jpgs.length} images · ${mb(before)} → ${dry?'(simulation)':mb(after)} · ${rewritten} fichiers réécrits`);
})().catch(e=>{console.error(e);process.exit(1);});
