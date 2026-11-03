/** Anatomy Figure: a physical HBM package, not a scale model of a particular product.
 * Source geometry: wheresryan22/anatomy, MIT, 1482e8469b0a9e0d8cc18ea2740a01423d29ae80.
 * Concept: die TSV cutaways join a common interposer; width/speed/power share one lane model.
 * Parts: substrate laminate (3), interposer and exposed routing window (3), base die (3),
 * four cutaway DRAM dies (12), memory-bank regions (24), GPU die and regions (17), PHY (8).
 * Functional contacts and TSVs are repeated from the same prototypes, not decorative noise.
 */
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as k from './tools/anatomy/iso-kit.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const rings={};
const shape=(w,h,d,r=.035)=>{const key=[w,h,d,r].join(':');if(!rings[key])rings[key]={w,h,d,ring:k.roundedPlan({x:-w/2,y:-d/2,w,d,r:Math.min(r,w/3,d/3)},4)};return key;};
const solids=[];
const add=(name,part,w,h,d,x,y,z,color,r=.035)=>solids.push({name,part,shape:shape(w,h,d,r),at:[x,y,z],color});
add('package-core','substrate',10.8,.28,6.1,0,-1.42,0,0x354d5d,.12);
add('package-top-laminate','substrate',10.65,.045,5.96,0,-1.2575,0,0x78919b,.09);
add('package-lower-laminate','substrate',10.65,.035,5.96,0,-1.5775,0,0x526b79,.09);
// A single common silicon interposer with a flush redistribution surface.
add('interposer-silicon','interposer',10.3,.16,5.9,0,-1.11,0,0x9eb7c4,.055);
add('interposer-rdl-surface','interposer',10.3,.02,5.9,0,-1.02,0,0xb4c9d2,.055);
const cutDie=(name,part,x,bottom,h,w,d,color)=>{
 const rear=d-.56;
 add(name+'-silicon',part,w,h,rear,x,bottom+h/2,-.28,color,.04);
 for(const side of[-1,1])add(name+'-cutaway-cheek-'+side,part,.25,h,.56,x+side*(w/2-.125),bottom+h/2,d/2-.28,color,.025);
};
cutDie('base-die','base',-2.45,-.90,.38,3.60,3.50,0x416e7c);
for(let i=0;i<4;i++){
 const bottom=-.46+i*.60;
 cutDie('dram-'+i,'dram',-2.45,bottom,.48,3.35,3.50,0x79a6aa);
 // Six patterned bank regions per die, on the real upper face (schematic arrangement).
 for(let x=0;x<3;x++)for(let z=0;z<2;z++)add(`dram-${i}-bank-${x}-${z}`,'dram',.78,.014,1.04,-3.37+x*.92,bottom+.487,-1.02+z*1.22,0x628e95,.022);
}
add('gpu-silicon','gpu',4.40,.53,4.10,2.45,-.645,0,0x3f6478,.065);
for(let x=0;x<4;x++)for(let z=0;z<4;z++)add(`gpu-region-${x}-${z}`,'gpu',.53,.014,.63,1.35+x*.76,-.373,-1.36+z*.82,0x5a7d8e,.023);
for(let i=0;i<8;i++)add('phy-channel-'+i,'phy',.36,.025,.34,.59,-.367,-1.43+i*.405,0xc59c62,.018);
const anchors={dram:[-4.125,1.58,1.55],tsv:[-3.55,.98,1.48],bumps:[-3.55,.68,1.48],base:[-4.25,-.70,1.46],interposer:[5.15,-1.09,2.60],phy:[.59,-.35,1.42],gpu:[4.65,-.64,2.02],substrate:[5.4,-1.42,2.90]};
const lanes=Array.from({length:16},(_,i)=>{const x=-3.55+i*.145,z=2.02+i*.036;return {x,route:[[x,1.82,1.48],[x,-1.002,1.48],[x,-1.002,z],[.59,-1.002,z],[.59,-.35,1.42]]};});
const viaSections=[[-.90,.38],...Array.from({length:4},(_,i)=>[-.46+i*.60,.48])];
const joints=[[-.52,.06],[.02,.12],[.62,.12],[1.22,.12]];
const output={viaSections,joints,source:'Anatomy',commit:'1482e8469b0a9e0d8cc18ea2740a01423d29ae80',license:'MIT',rings,solids,anchors,lanes,stackTop:1.82,stackBottom:-.90};
mkdirSync(root+'src/papers/ai-memory-wall/generated',{recursive:true});
mkdirSync(root+'public/papers/ai-memory-wall',{recursive:true});
writeFileSync(root+'src/papers/ai-memory-wall/generated/hbm-anatomy.json',JSON.stringify(output,null,2)+'\n');
// Direct geometry checks: convex profiles, contact planes, non-overlapping die intervals.
for(const shape of Object.values(rings)){
 if(!shape.ring.every(p=>p.every(Number.isFinite)))throw new Error('Non-finite profile');
 if(shape.h<=0||shape.w<=0||shape.d<=0)throw new Error('Invalid solid extent');
}
for(let i=0;i<joints.length;i++){
 const lower=viaSections[i],upper=viaSections[i+1],joint=joints[i];
 if(Math.abs(lower[0]+lower[1]-joint[0])>1e-8||Math.abs(joint[0]+joint[1]-upper[0])>1e-8)throw new Error('TSV contact plane mismatch');
}
if(Math.abs(viaSections.at(-1)[0]+viaSections.at(-1)[1]-output.stackTop)>1e-8)throw new Error('Protruding TSV');
console.log('Geometry checks: finite profiles; all TSV / bump contact planes flush.');
// Native Anatomy SVG from the identical parts list; also used as a WebGL-free fallback.
const P=k.fitProjection([...k.boxCorners({x:-5.4,y:-3.05,w:10.8,d:6.1,r:.1},-1.6,1.82)],820,500,{pad:35,azimuth:72,elevation:25});
const previewSolids=solids.slice();
for(let lane=0;lane<16;lane+=2){
 for(const [bottom,h]of[...viaSections,...joints])previewSolids.push({name:'cutaway-tsv',part:'tsv',shape:shape(.05,h,.05,.01),at:[lanes[lane].x,bottom+h/2,1.48],color:0xc9a56e});
}
const svgParts=previewSolids.map(s=>({s,depth:k.depthOf([s.at[0],s.at[2],s.at[1]],P)})).sort((a,b)=>a.s.part==='tsv'&&b.s.part!=='tsv'?1:b.s.part==='tsv'&&a.s.part!=='tsv'?-1:(a.s.at[1]-b.s.at[1])||a.depth-b.depth);
const tint=(hex,factor)=>'#'+[16,8,0].map(shift=>Math.min(255,Math.round(((hex>>shift)&255)*factor)).toString(16).padStart(2,'0')).join('');
const body=svgParts.map(({s})=>{
 const g=rings[s.shape],plan={x:s.at[0]-g.w/2,y:s.at[2]-g.d/2,w:g.w,d:g.d,r:Math.min(.05,g.w/3,g.d/3)};
 const palette=`--anatomy-paper:${tint(s.color,1)};--anatomy-top:${tint(s.color,1.10)};--anatomy-shade-0:${tint(s.color,.68)};--anatomy-shade-1:${tint(s.color,.78)};--anatomy-shade-2:${tint(s.color,.88)};--anatomy-shade-3:${tint(s.color,.96)};--anatomy-hi:#728e9b;--anatomy-mid:#6c8b99;--anatomy-lo:#536d7d`;
 return '<g style="'+palette+'">'+k.solidSvg(k.slabOf(plan,s.at[1]-g.h/2,g.h,P,4,.01),{tone:s.part==='substrate'?'lo':'mid'})+'</g>';
}).join('');
const svg=k.figureSvg({width:820,height:500,label:'HBM package: stacked DRAM dies, base die, common interposer and GPU. Schematic cutaway.',body:[body],standalone:'light'});
writeFileSync(root+'public/papers/ai-memory-wall/hbm-anatomy.svg',svg);
console.log(`Anatomy Figure: ${solids.length} core parts, ${Object.keys(rings).length} reusable profiles, 16 data lanes.`);
