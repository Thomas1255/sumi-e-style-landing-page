import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { FLIGHT_CLIPS, SCENE_CUTS, SCENE_DISSOLVE, clipBounds, clipFrame, flightVideoState, sceneCloudStrength, flockTravel } from '../dist/flight-timeline.js';
import { routeCamera, SCENES } from '../dist/terrain.js';
import { INK_CLOUD_LAYERS, INK_CLOUD_SETS, INK_CLOUD_VARIANTS, INK_CLOUD_SCROLL_SPAN, INK_CLOUD_INTRO_SPAN, inkCloudFrame } from '../dist/ink-clouds.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
const js = await readFile(path.join(root, 'app.js'), 'utf8');
execFileSync(process.execPath, ['--check', path.join(root, 'app.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'flight-model.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'clouds.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'page-clouds.js')]);
for (const filename of ['terrain.js','flight-timeline.js','video-flock.js','cloth.js','page-cloth.js','ink-clouds.js','audio.js']) execFileSync(process.execPath, ['--check', path.join(root, filename)]);
// Resolve all relative module imports, including assets loaded from JavaScript.
for (const filename of ['app.js','terrain.js','flight-timeline.js','video-flock.js','page-cloth.js','page-clouds.js','ink-clouds.js']) {
  const module = await readFile(path.join(root, filename), 'utf8');
  for (const match of module.matchAll(/(?:from\s+|import\s+)['"](\.\/[^'"]+)['"]/g)) await access(path.resolve(root, match[1]));
  for (const match of module.matchAll(/['"](assets\/[^'"]+)['"]/g)) await access(path.join(root,match[1]));
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate document IDs');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(?:https?:|data:)/.test(match[1])) continue;
  await access(path.join(root, match[1]));
}
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(match[1])) throw new Error(`Missing anchor: ${match[1]}`);
}
for (const match of html.matchAll(/aria-controls="([^"]+)"/g)) {
  if (!ids.includes(match[1])) throw new Error(`Missing controlled panel: ${match[1]}`);
}
for (const match of css.matchAll(/url\(['"]?(assets\/[^'"\)]+)['"]?\)/g)) await access(path.join(root, match[1]));
if (!html.includes('prefers-reduced-motion') && !css.includes('prefers-reduced-motion')) throw new Error('Missing reduced-motion support');
const forward = [0, .12, .37, .62, .86, 1].map(p => flightVideoState(p));
const backward = [1, .86, .62, .37, .12, 0].map(p => flightVideoState(p)).reverse();
assert.deepEqual(forward, backward, 'Reversing scroll must retrace exactly the same frames');
assert.equal(flightVideoState(-1).layers[0].frame, 0);
assert.equal(flightVideoState(2).layers[0].frame, 144);
assert.deepEqual(flightVideoState(.2,true),flightVideoState(.8,true),'Reduced motion holds the film still');
for (const [index, clip] of FLIGHT_CLIPS.entries()) {
  await access(path.join(root,clip.src)); await access(path.join(root,clip.poster));
  const [start,end]=clipBounds(index);
  assert.equal(clipFrame(index,start),0); assert.equal(clipFrame(index,end),clip.frames-1);
  let previous=-1;
  for(let step=0;step<=1000;step++){
    const p=step/1000,frame=clipFrame(index,p),video=flightVideoState(p),camera=routeCamera(p);
    assert(frame>=previous && frame<clip.frames,'Clip frames must advance within the source duration');
    previous=frame;
    assert.equal(video.index,camera.index);assert.equal(video.next,camera.next);assert.equal(video.blend,camera.blend);
    assert(video.layers.filter(layer=>layer.opacity>.001).length<=1,'Mist transitions must not double the flock');
  }
}
for(const cut of SCENE_CUTS){
  const before=flightVideoState(cut-.00001),after=flightVideoState(cut+.00001);
  assert(before.layers[0].opacity<.001 && after.layers[1].opacity<.001,'Angle cuts must pass through mist');
  assert.equal(sceneCloudStrength(cut),1,'Clouds must conceal the center of every scene change');
  assert.equal(sceneCloudStrength(cut,true),0,'Reduced motion must avoid the cloud wash');
  assert(sceneCloudStrength(cut-SCENE_DISSOLVE/2)<1e-10);
  assert(sceneCloudStrength(cut+SCENE_DISSOLVE/2)<1e-10);
  for(const offset of [.01,.025,.04])assert(Math.abs(sceneCloudStrength(cut-offset)-sceneCloudStrength(cut+offset))<1e-10,'The cloud wash must retrace symmetrically');
}
for(const p of [0,.3,.55,.9,1])assert.equal(sceneCloudStrength(p),0,'Ambient scenes must remain clear');
assert.equal(INK_CLOUD_LAYERS.length,6,'Each side needs three independently painted cloud planes');
assert.equal(new Set(INK_CLOUD_LAYERS.map(layer=>layer.src)).size,6,'Cloud layers must use six distinct artworks');
assert.equal(INK_CLOUD_VARIANTS.length,4,'The opening and all three scene changes need their own composition');
assert.equal(INK_CLOUD_SETS.length,4,'Each passage needs its approved artwork set');
assert.deepEqual(INK_CLOUD_SETS[0],INK_CLOUD_LAYERS,'The original opening artwork must stay intact');
const cloudHashes=[];
for(const layers of INK_CLOUD_SETS){
  assert.equal(layers.length,6,'Every artwork set needs independent left/right layers at all three depths');
  for(const layer of layers){
    const png=await readFile(path.join(root,layer.src));
    assert.equal(png.toString('ascii',1,4),'PNG','Cloud artwork must be PNG');
    assert.equal(png[25],6,'Cloud PNGs must retain RGBA transparency');
    assert(Math.abs(png.readUInt32BE(16)/png.readUInt32BE(20)-layer.aspect)<1e-10,'Cloud geometry must preserve the painting aspect ratio');
    cloudHashes.push(createHash('sha256').update(png).digest('hex'));
  }
}
assert.equal(new Set(INK_CLOUD_SETS.flat().map(layer=>layer.src)).size,24,'Later transitions must never reuse an opening or other transition source');
assert.equal(new Set(cloudHashes).size,24,'Every cloud layer must have distinct painted content');
assert(INK_CLOUD_SCROLL_SPAN>=SCENE_DISSOLVE*2,'Cloud transitions need at least twice the scroll distance of the landscape dissolve');
assert(SCENE_CUTS.slice(1).every((cut,index)=>cut-SCENE_CUTS[index]>INK_CLOUD_SCROLL_SPAN),'Cloud sequences must leave clear space between scenes');
for(const viewport of [[1280,720],[390,844],[2560,1080]]){
  const compositions=[0,...SCENE_CUTS].map(p=>inkCloudFrame(p,...viewport));
  for(const [index,frame] of compositions.entries()){
    assert.equal(frame.setIndex,index,'Scroll position must select the correct approved set');
    assert.deepEqual(frame.layers.map(layer=>layer.src),INK_CLOUD_SETS[index].map(layer=>layer.src),'The rendered frame must use the matching six paintings');
  }
  assert.equal(new Set(compositions.map(frame=>frame.variant)).size,4,'Every transition must select a distinct cloud variant');
  assert.equal(new Set(compositions.map(frame=>JSON.stringify(frame.layers.map(({x,y,width,height,zIndex})=>({x,y,width,height,zIndex}))))).size,4,'Transition variety must change actual framing and overlaps');
  const arrivals=SCENE_CUTS.map(cut=>inkCloudFrame(cut-.04,...viewport).layers.map(layer=>layer.closure));
  assert.equal(new Set(arrivals.map(value=>JSON.stringify(value))).size,3,'Each scene change needs its own staggered choreography');
  const opening=inkCloudFrame(0,...viewport);
  assert(opening.active && opening.intro && opening.strength===1,'The first view must start with the cloud banks fully closed');
  assert(opening.layers.every(layer=>layer.closure===1),'All six clouds must cover the opening');
  const introPoints=[0,.01,.02,.03,.04,INK_CLOUD_INTRO_SPAN];
  const introFrames=introPoints.map(p=>inkCloudFrame(p,...viewport));
  for(let i=1;i<introFrames.length;i++)assert(introFrames[i].layers.every((layer,index)=>layer.closure<=introFrames[i-1].layers[index].closure),'Opening clouds must part gradually as the user scrolls');
  assert.equal(inkCloudFrame(0,...viewport,true).active,false,'Reduced motion must reveal the page immediately');
  const sample=[...introPoints,...SCENE_CUTS.flatMap(cut=>[-.05,-.025,0,.025,.05].map(offset=>cut+offset))];
  assert.deepEqual(sample.map(p=>inkCloudFrame(p,...viewport)),[...sample].reverse().map(p=>inkCloudFrame(p,...viewport)).reverse(),'Cloud layers must retrace on reverse scroll');
  for(const cut of SCENE_CUTS){
    assert(inkCloudFrame(cut,...viewport).layers.every(layer=>layer.closure===1),'All cloud planes must overlap at every perspective cut');
    assert.equal(inkCloudFrame(cut,...viewport,true).active,false,'Reduced motion must leave the clouds offscreen');
    for(const offset of [-SCENE_DISSOLVE/2-.005,SCENE_DISSOLVE/2+.005])assert(inkCloudFrame(cut+offset,...viewport).active,'Cloud travel must extend beyond the short scene dissolve');
    for(const offset of [-.005,.015])assert(inkCloudFrame(cut+offset,...viewport).layers.every(layer=>layer.closure===1),'Closed clouds must hold while the user keeps scrolling across the cut');
    const entering=inkCloudFrame(cut-.04,...viewport).layers;
    assert(entering[0].closure>entering[2].closure && entering[2].closure>entering[4].closure,'Rear, middle and front clouds need staggered arrival');
    const leaving=inkCloudFrame(cut+.05,...viewport).layers;
    assert(leaving[4].closure<leaving[2].closure && leaving[2].closure<leaving[0].closure,'Foreground clouds must clear ahead of the slower rear planes');
  }
  for(const p of [INK_CLOUD_INTRO_SPAN,.3,.55,.9,1]){
    const frame=inkCloudFrame(p,...viewport);
    assert.equal(frame.active,false,'Cloud banks must clear the landscape between scene cuts');
    assert(frame.layers.every((layer,index)=>INK_CLOUD_LAYERS[index].side==='left'?layer.x+layer.width<0:layer.x>viewport[0]),'Inactive banks must sit outside the viewport');
  }
}
assert(!js.includes('drawFlock'),'The page must use the approved film, not jointed wings');
const travelPoints=[0,.04,.08,.12,.16,.18];
const travel=travelPoints.map(p=>flockTravel(0,p));
assert.deepEqual(travel,[...travelPoints].reverse().map(p=>flockTravel(0,p)).reverse(),'Opening travel must retrace on reverse scroll');
assert(travel.every((pose,i)=>!i||pose.scale<travel[i-1].scale),'The opening flock must recede into the distance');
assert(travel.at(-1).y<travel[0].y,'The opening flock must climb forward through the valley');
assert.deepEqual(flockTravel(0,.12,true),flockTravel(0,0),'Reduced motion holds the opening flock');
for(const index of [1,2,3])assert.deepEqual(flockTravel(index,.12),flockTravel(index,.9),'Later perspectives must retain their placement');
const cameraForward = [0,.25,.5,.75,1].map(p => routeCamera(p));
const cameraReverse = [1,.75,.5,.25,0].map(p => routeCamera(p)).reverse();
assert.deepEqual(cameraForward,cameraReverse,'Camera must retrace the terrain on reverse scroll');
assert(cameraForward.every((camera,index)=>!index||camera.z>cameraForward[index-1].z),'Camera must move forward through world space');
assert.deepEqual(routeCamera(.2,true),routeCamera(.9,true),'Reduced motion must hold the camera');
assert.deepEqual([0,.30,.55,.9].map(p=>routeCamera(p).index),[0,1,2,3],'The flight must visit all four landscapes');
for(const scene of SCENES)await access(path.join(root,scene));
assert.equal((html.match(/data-cloth/g)||[]).length,5,'Every story panel must have cloth');
await import('./server-check.mjs');
console.log('Verified assets, reversible video frames, four synchronized landscapes, 24 unique PNGs in four staggered cloud sets, five cloth panels, reduced motion, and HTTP video seeking.');
