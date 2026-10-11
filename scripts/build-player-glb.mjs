// Construit media/3d/player.glb : homme Quaternius (CC0) + coupe de cheveux + animations utiles, textures allégées.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,resample,textureCompress,weld,quantize,unpartition,meshopt} from '@gltf-transform/functions';
import sharp from 'sharp';
import {MeshoptEncoder} from 'meshoptimizer';
import path from 'node:path';
const [,,ubc,ual,out]=process.argv;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
await MeshoptEncoder.ready;
const base=path.join(ubc,'Universal Base Characters[Standard]');
const doc=await io.read(path.join(base,'Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'));
const root=doc.getRoot();
// Cheveux courts rattachés à l'os de la tête : on fusionne leur scène dans le document.
const hairDoc=await io.read(path.join(base,'Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/Hair_Buzzed.gltf'));
const {mergeDocuments}=await import('@gltf-transform/functions');
mergeDocuments(doc,hairDoc);
// Animations : seulement celles qui servent aux scènes.
const keep=new Set(['Idle_Loop','Jog_Fwd_Loop','Sprint_Loop','Walk_Loop','Crouch_Idle_Loop','Crouch_Fwd_Loop','Jump_Start','Jump_Loop','Jump_Land','Push_Loop']);
const animDoc=await io.read(path.join(ual,'Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb'));
animDoc.getRoot().listAnimations().forEach(a=>{if(!keep.has(a.getName()))a.dispose();});
animDoc.getRoot().listMeshes().forEach(m=>m.dispose());
mergeDocuments(doc,animDoc);
// Les pistes des animations visent les os de la bibliothèque : on les rebranche sur les os du personnage (même nom).
const scenes=root.listScenes(),mainScene=scenes[0];
const charNodes=new Map();mainScene.traverse(n=>{if(!charNodes.has(n.getName()))charNodes.set(n.getName(),n);});
for(const a of root.listAnimations()) for(const ch of a.listChannels()){const t=ch.getTargetNode();const m=t&&charNodes.get(t.getName());if(m&&m!==t)ch.setTargetNode(m);}
// Pistes inutiles sur téléphone : doigts, échelle, translations hors bassin.
for(const a of root.listAnimations()) for(const ch of a.listChannels()){const n=ch.getTargetNode()?.getName()||'',p=ch.getTargetPath();
  if(/thumb|index|middle|ring|pinky/i.test(n)||p==='scale'||p==='translation'&&!/pelvis|root/i.test(n)){const s=ch.getSampler();ch.dispose();if(s&&!s.listParents().some(x=>x.propertyType==='AnimationChannel'))s.dispose();}}
// Scènes en trop (cheveux, bibliothèque) : leurs nœuds racines rattachés à la scène principale si besoin, puis suppression.
// Cheveux : la peau est rebranchée sur les os du personnage (mêmes noms), le maillage rejoint le corps ; les autres squelettes sont supprimés.
let bodyNode=null;mainScene.traverse(n=>{if(n.getMesh()&&n.getSkin()&&!bodyNode)bodyNode=n;});
const bodyParent=bodyNode.listParents().find(p=>p.propertyType==='Node')||mainScene;
for(const sc of scenes.slice(1)){
  const extra=[];sc.traverse(n=>extra.push(n));
  for(const n of extra){if(n.getMesh()&&n.getSkin()){const sk=n.getSkin();const old=sk.listJoints(),mapped=old.map(j=>charNodes.get(j.getName())||j);old.forEach(j=>sk.removeJoint(j));mapped.forEach(j=>sk.addJoint(j));sk.setSkeleton(null);bodyParent.addChild(n);}}
  for(const n of extra){if(!(n.getMesh()&&n.getSkin()))n.dispose();}
  sc.dispose();}
// Données orphelines (animations retirées) : on ne garde que ce qu'utilisent maillages, peaux et animations restantes.
const used=new Set();
for(const m of root.listMeshes())for(const p of m.listPrimitives()){p.listAttributes().forEach(a=>used.add(a));if(p.getIndices())used.add(p.getIndices());}
for(const s of root.listSkins())if(s.getInverseBindMatrices())used.add(s.getInverseBindMatrices());
for(const a of root.listAnimations())for(const s of a.listSamplers()){used.add(s.getInput());used.add(s.getOutput());}
root.listAccessors().forEach(a=>{if(!used.has(a))a.dispose();});
// Textures : couleur de base seulement, 512 px en WebP ; cartes normales et rugosité retirées (trop lourdes pour un téléphone).
for(const mat of root.listMaterials()){mat.setNormalTexture(null);mat.setMetallicRoughnessTexture(null);mat.setRoughnessFactor(.75);mat.setMetallicFactor(0);}
await doc.transform(prune(),dedup(),resample(),weld(),
  textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:80}),
  unpartition(),meshopt({encoder:MeshoptEncoder,level:'high'}));
await io.write(out,doc);
console.log('ok',out,root.listAnimations().map(a=>a.getName()).join(','),root.listMeshes().map(m=>m.getName()).join(','));
