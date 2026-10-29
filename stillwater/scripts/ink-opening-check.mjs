import assert from 'node:assert/strict';
import { INK_OPENING_TIMING, inkOpeningFrame, shouldPlayInkOpening } from '../dist/ink-opening-model.js';
import { mountInkOpening, openingMediaReady } from '../dist/ink-opening.js';
import { CANVAS_RIPPLE_OPTIONS, setCanvasRipple, canvasRippleState, bindCanvasRipple } from '../dist/canvas-ripple.js';

assert(shouldPlayInkOpening());
for (const options of [{ reducedMotion: true }, { hash: '#passage-two' }, { scrollPosition: 500 }, { navigationType: 'back_forward' }]) assert(!shouldPlayInkOpening(options),'Restored, anchored and reduced-motion visits must open immediately');
assert(shouldPlayInkOpening({hash:'#top'}));
const bloomStart=INK_OPENING_TIMING.stamp+INK_OPENING_TIMING.stampHold;
const total=bloomStart+INK_OPENING_TIMING.reveal;
for(const [width,height] of [[1280,720],[390,844],[2560,1080]]){
  const start=inkOpeningFrame(0,width,height);
  assert.equal(start.phase,'stamp');assert.equal(start.sealOpacity,0);
  const impact=inkOpeningFrame(INK_OPENING_TIMING.stamp*.48,width,height);
  assert(impact.sealScale<1&&impact.sealOpacity===1,'The seal must press down before its impression settles');
  const seal=inkOpeningFrame(INK_OPENING_TIMING.stamp+100,width,height);
  assert.equal(seal.phase,'seal');assert.equal(seal.sealOpacity,1);assert.equal(seal.sealScale,1);
  assert.equal(seal.ringRadius,start.ringRadius,'The completed enso must frame the seal without contracting into a drop');
  assert.equal(seal.radius,0,'The seal impression must hold before the aperture opens');
  assert.equal(seal.sealOffsetY,0);
  let previousRadius=0,previousBlur=26;
  for(let time=bloomStart;time<=total;time+=10){
    const frame=inkOpeningFrame(time,width,height);
    assert(frame.radius>=previousRadius && frame.blur<=previousBlur,'The ripple must expand while the real page settles into focus');
    previousRadius=frame.radius;previousBlur=frame.blur;
    assert(frame.rippleAge>=0&&frame.rippleAge<=INK_OPENING_TIMING.reveal/1000);
  }
  const end=inkOpeningFrame(total,width,height);
  assert(end.done&&end.radius-end.feather>Math.hypot(width,height)/2,'The feathered aperture must clear every corner before cleanup');
  assert.equal(end.blur,0);assert.equal(end.zoom,1);assert.equal(end.washOpacity,0);
  assert(inkOpeningFrame(0,width,height,true).done,'Reduced motion must never start the ripple');
}

// The same CSS-space splash must cross canvases with different origins, sizes
// and backing densities. Idle draws must not read layout or retain wave energy.
const calls=new Map();let boundsReads=0;
const gl={getUniformLocation:(_,name)=>name,uniform4f:(name,...values)=>calls.set(name,values),uniform3f:(name,...values)=>calls.set(name,values),uniform2f:(name,...values)=>calls.set(name,values)};
const viewport={width:2560,height:1440,getBoundingClientRect(){boundsReads++;return {left:-22,top:-13,width:1324,height:746}}};
const fabric={width:1000,height:600,getBoundingClientRect(){boundsReads++;return {left:70,top:150,width:500,height:300}}};
const surface=bindCanvasRipple(gl,{},viewport),cloth=bindCanvasRipple(gl,{},fabric);
setCanvasRipple(inkOpeningFrame(bloomStart+500,1280,720),1280,720);
surface();assert.deepEqual(calls.get('uCanvasRipplePixels'),[2560,1440]);assert.deepEqual(calls.get('uCanvasRippleViewport'),[-22,-13,1324,746]);
const splash=calls.get('uCanvasRipple');
cloth();assert.deepEqual(calls.get('uCanvasRipple'),splash);assert.deepEqual(splash.slice(0,2),[640,360]);assert(Math.abs(splash[2]-.5)<1e-9);
assert.deepEqual(calls.get('uCanvasRippleViewport'),[70,150,500,300]);assert.deepEqual(calls.get('uCanvasRipplePixels'),[1000,600]);
assert.deepEqual(calls.get('uCanvasRippleWave'),[340*CANVAS_RIPPLE_OPTIONS.speed,80,80,1]);
setCanvasRipple();surface();cloth();assert.equal(boundsReads,2,'Completed ripples must not add layout work');assert.equal(calls.get('uCanvasRipple')[3],0);

// Exercise the real controller through asset failures, timeouts, skips and a
// preference change. These checks protect document visibility and input release.
function environment({reducedMotion=false,hash='',navigationType='navigate'}={}){
  let clock=0,id=0,drawCalls=0;
  const frames=new Map(),timers=new Map(),events=new Map(),motionEvents=new Map();
  const classes=new Set(['ink-opening-pending']);
  function element(){const listeners=new Map(),attributes=new Map(),properties=new Map();return {hidden:true,inert:false,dataset:{},style:{opacity:'',setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key),getPropertyValue:key=>properties.get(key)},classList:{add:(...values)=>values.forEach(v=>classes.add(v)),remove:(...values)=>values.forEach(v=>classes.delete(v)),contains:value=>classes.has(value)},addEventListener:(name,callback)=>listeners.set(name,callback),removeEventListener:name=>listeners.delete(name),setAttribute:(name,value)=>attributes.set(name,value),getAttribute:name=>attributes.get(name),listeners,focus(){this.focused=true}}}
  const root=element(),html=element(),skip=element(),label=element(),caption=element(),progress=element(),brand=element(),canvas=element();
  const page=[element(),element(),element(),element()];
  const context=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get(target,key){if(key in target)return target[key];return ()=>{drawCalls++}},set(target,key,value){target[key]=value;return true}});
  canvas.getContext=()=>context;
  root.querySelector=selector=>({'canvas':canvas,'.ink-opening-label':label,'[role=status]':caption,'[role=progressbar]':progress,'button':skip})[selector];
  root.contains=element=>element===skip;
  const document={documentElement:html,activeElement:null,querySelector:selector=>selector==='#ink-opening'?root:selector==='.brand'?brand:null,querySelectorAll:()=>page};
  const motion={matches:reducedMotion,addEventListener:(name,callback)=>motionEvents.set(name,callback),removeEventListener:name=>motionEvents.delete(name)};
  const replacements={document,location:{hash},scrollY:0,innerWidth:1280,innerHeight:720,devicePixelRatio:2,performance:{now:()=>clock,getEntriesByType:()=>[{type:navigationType}]},matchMedia:()=>motion,
    setTimeout:(callback,delay)=>{const next=++id;timers.set(next,{callback,at:clock+delay});return next},clearTimeout:key=>timers.delete(key),
    requestAnimationFrame:callback=>{const next=++id;frames.set(next,callback);return next},cancelAnimationFrame:key=>frames.delete(key),
    addEventListener:(name,callback)=>events.set(name,callback),removeEventListener:name=>events.delete(name),dispatchEvent:event=>events.get(event.type)?.(event)};
  const previous=new Map(Object.keys(replacements).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const [key,value] of Object.entries(replacements))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  return {root,html,page,skip,brand,document,progress,caption,classes,frames,events,motion,motionEvents,drawCalls:()=>drawCalls,
    advanceTo(target,step=16){while(clock<target){clock=Math.min(target,clock+step);for(const [key,timer] of [...timers])if(timer.at<=clock){timers.delete(key);timer.callback()}const current=[...frames];frames.clear();for(const [,callback] of current)callback(clock)}},
    restore(){for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
  };
}

let env=environment();
try{
  let redraws=0;
  const opening=mountInkOpening({onRippleFrame(){redraws++}});
  assert(env.page.every(element=>element.inert),'Page links must wait until the reveal or skip');
  opening.waitFor([Promise.resolve(),Promise.reject(new Error('First poster unavailable'))]);
  await Promise.resolve();await Promise.resolve();
  env.advanceTo(2100);assert.equal(env.root.dataset.phase,'stamp');assert.equal(env.progress.getAttribute('aria-valuenow'),'100');
  assert.equal(redraws,0,'The water surface must wait for the seal to finish');
  env.advanceTo(3200);assert.equal(env.root.dataset.phase,'bloom');assert(env.classes.has('ink-revealing'));assert(env.drawCalls()>0);
  assert(redraws>0&&canvasRippleState().amplitude>0,'The opening must drive Canvas UI refraction while revealing');
  env.advanceTo(6000);assert.equal(env.root.dataset.phase,'complete');assert(env.root.hidden);
  assert(env.page.every(element=>!element.inert));assert(!env.classes.has('ink-opening-pending'));assert(!env.classes.has('ink-revealing'));assert.equal(env.frames.size,0);
  assert.equal(env.html.style.getPropertyValue('--ink-reveal-blur'),undefined);
  assert.equal(canvasRippleState().amplitude,0,'Finish must clear the shared ripple on every surface');
  const stopped=redraws;env.advanceTo(9000);assert.equal(redraws,stopped,'No ripple redraws may continue after completion');
  opening.destroy();assert.equal(env.root.dataset.phase,'complete','Cleanup must be idempotent');
}finally{env.restore()}

env=environment();
try{
  mountInkOpening().waitFor([Promise.resolve()]);
  await Promise.resolve();await Promise.resolve();
  env.advanceTo(8000,1000);
  assert.equal(env.root.dataset.phase,'complete','Sparse animation frames must catch up to ready assets before the safety timeout');
  assert(env.page.every(element=>!element.inert));
}finally{env.restore()}

env=environment();
try{
  mountInkOpening().waitFor([new Promise(()=>{})]);
  env.advanceTo(10500);assert.equal(env.root.dataset.phase,'complete','A stalled asset must fall back and release the page');
  assert(env.page.every(element=>!element.inert));
}finally{env.restore()}

env=environment();
try{
  const opening=mountInkOpening();opening.waitFor([]);env.advanceTo(3200);
  assert(canvasRippleState().amplitude>0);env.document.activeElement=env.skip;
  env.skip.listeners.get('click')();
  assert.equal(env.root.dataset.phase,'skipped');assert(env.root.hidden);assert(env.brand.focused);assert.equal(env.frames.size,0);assert(env.page.every(element=>!element.inert));
  assert.equal(canvasRippleState().amplitude,0,'Skipping during a wave must remove refraction immediately');
}finally{env.restore()}

env=environment();
try{
  mountInkOpening();env.motionEvents.get('change')({matches:true});
  assert.equal(env.root.dataset.phase,'reduced-motion');assert(!env.classes.has('ink-opening-pending'));
}finally{env.restore()}
for(const options of [{reducedMotion:true},{hash:'#passage-three'},{navigationType:'back_forward'}]){
  env=environment(options);try{const opening=mountInkOpening();await opening.waitFor([Promise.reject(new Error('Skipped opening asset failed'))]);assert(env.root.hidden);assert.equal(env.frames.size,0);assert(env.page.every(element=>!element.inert));assert.equal(env.drawCalls(),0)}finally{env.restore()}
}

env=environment();
try{
  const media={...env.skip,readyState:0,error:null};
  const ready=openingMediaReady(media);assert(media.listeners.has('loadeddata'));
  media.listeners.get('loadeddata')();await ready;assert.equal(media.listeners.size,0,'Readiness listeners must be released');
}finally{env.restore()}
console.log('Verified ink opening: seal timing, Canvas UI ripple alignment across live surfaces, idle cleanup, full-corner reveal, blur settlement, failed/stalled assets, skip/focus, history, and reduced motion.');
