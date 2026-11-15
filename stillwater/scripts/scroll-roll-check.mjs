import assert from 'node:assert/strict';
import { clothRollGeometry, scrollRollFrame, scrollSceneArrival, clothHemMotion } from '../dist/scroll-roll.js';
import { SCENE_CUTS } from '../dist/flight-timeline.js';

SCENE_CUTS.forEach((cut,i)=>{
  assert.equal(scrollSceneArrival(cut,i+1),0,'The new scroll must wait behind a closed cloud curtain');
  assert(Math.abs(scrollSceneArrival(cut+.065,i+1)-.5)<1e-10,'The scroll must be halfway unrolled as the cloud banks part');
  assert(Math.abs(scrollSceneArrival(cut+.085,i+1)-1)<1e-10);
});
assert.equal(scrollSceneArrival(0,0),1);assert.equal(scrollSceneArrival(1,4),1);

for(const viewport of [540,720,844,1080]){
  const height=360,anchor=Math.min(viewport*.22,Math.max(80,viewport-height-100)),paddingBottom=160;
  const sectionHeight=viewport*4.95;
  const frame=top=>scrollRollFrame({top,bottom:top+sectionHeight,height,anchor,paddingBottom,viewport});
  const positions=Array.from({length:161},(_,i)=>viewport-i*viewport*.045);
  const forward=positions.map(frame),reverse=[...positions].reverse().map(frame).reverse();
  assert.deepEqual(forward,reverse,'Reversing or jumping must retrace the same roll without queued animation');
  const entering=Array.from({length:51},(_,i)=>frame(viewport*(.75-i*.014)).open);
  assert.equal(entering[0],0);assert(Math.abs(entering.at(-1)-1)<1e-10);
  assert(entering.every((value,i)=>!i||value>=entering[i-1]),'Fabric must progressively unroll without overshoot');
  const release=anchor+height+paddingBottom;
  const end=release+viewport*.12;
  const exiting=Array.from({length:51},(_,i)=>frame(end+viewport*.85*(1-i/50)-sectionHeight).open);
  assert.equal(exiting[0],1);assert(exiting.at(-1)<1e-10);
  assert(exiting.every((value,i)=>!i||value<=exiting[i-1]),'Fabric must wind upward without a fade or upward flight');
  assert.equal(frame(release-sectionHeight).open,0,'The roll must be completely shut before native sticky positioning releases');
  assert(frame(end+viewport*.425-sectionHeight).open>.4,'The closing motion needs a substantial scroll runway');
  assert.equal(scrollRollFrame({top:-1000,bottom:viewport,height,anchor,viewport,last:true}).open,0,'The final scroll must roll shut at the end of the page');
  for(const intro of [0,.1,.5,1])assert.equal(scrollRollFrame({top:0,bottom:sectionHeight,height,anchor,viewport,first:true,intro}).open,intro,'The first scroll must follow its opening reveal');
  assert.deepEqual(scrollRollFrame({top:viewport*2,bottom:viewport*6,height,anchor,viewport,reducedMotion:true}),{open:1,opacity:1,phase:'open'},'Reduced motion must keep the full content readable');
}
for(const height of [290,390,520]){
  let lastBottom=0;
  for(let i=0;i<=100;i++){
    const roll=clothRollGeometry(i/100,height);
    assert(roll.bottom>=lastBottom-1e-10,'The lower roller must move continuously down the sheet');
    assert(roll.materialEnd<=height&&roll.materialEnd>=roll.hanging);
    lastBottom=roll.bottom;
  }
  assert.deepEqual(clothRollGeometry(1,height),{radius:0,hanging:height,bottom:height,materialEnd:height},'Fully unrolled text must retain its original scale and geometry');
  assert.equal(clothRollGeometry(0,height).hanging,0);
}
for(const open of [0,.2,.7,1])for(let time=0;time<=60;time+=.5){
  const hem=clothHemMotion(time,open);
  assert(Math.abs(hem.x)<=2.2&&Math.abs(hem.y)<=1.1,'The weighted roller must sway gently');
  assert(Math.abs(hem.cosine**2+hem.sine**2-1)<1e-12,'The roller must rotate without stretching or bending');
  const matrix=hem.matrix.slice(7,-1).split(',').map(Number);
  assert.deepEqual(matrix.map(v=>v||0),[hem.cosine,hem.sine,-hem.sine,hem.cosine,hem.x,hem.y].map(v=>v||0),'The DOM roller and paper shader must receive the same rigid transform');
  for(const width of [292,440,500]){
    const left={x:hem.x-width*.5*hem.cosine,y:hem.y-width*.5*hem.sine};
    const right={x:hem.x+width*.5*hem.cosine,y:hem.y+width*.5*hem.sine};
    assert(Math.abs(Math.hypot(right.x-left.x,right.y-left.y)-width)<1e-10,'The attached lower edge must remain the length of the wooden roller');
  }
}
for(const time of [0,3,18,60]){
  for(const hem of [clothHemMotion(time,0),clothHemMotion(time,1,true)])assert.deepEqual([hem.x,hem.y,hem.cosine,hem.sine].map(v=>v||0),[0,0,1,0],'Closed and reduced-motion scrolls must keep their roller still');
}
console.log('Verified reversible scroll unrolling, rigid attached rollers, gentle sway, early roll-up, opening and final scrolls, and reduced motion.');
