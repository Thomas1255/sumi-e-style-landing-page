import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { FLIGHT_CLIPS, SCENE_CUTS, SCENE_DISSOLVE, clipBounds, clipFrame, flightVideoState, sceneCloudStrength } from '../dist/flight-timeline.js';
import { routeCamera, SCENES } from '../dist/terrain.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
const js = await readFile(path.join(root, 'app.js'), 'utf8');
execFileSync(process.execPath, ['--check', path.join(root, 'app.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'flight-model.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'clouds.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'page-clouds.js')]);
for (const filename of ['terrain.js','flight-timeline.js','video-flock.js','cloth.js','page-cloth.js','audio.js']) execFileSync(process.execPath, ['--check', path.join(root, filename)]);
// Resolve all relative module imports, including assets loaded from JavaScript.
for (const filename of ['app.js','terrain.js','flight-timeline.js','video-flock.js','page-cloth.js','page-clouds.js']) {
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
assert(!js.includes('drawFlock'),'The page must use the approved film, not jointed wings');
const cameraForward = [0,.25,.5,.75,1].map(p => routeCamera(p));
const cameraReverse = [1,.75,.5,.25,0].map(p => routeCamera(p)).reverse();
assert.deepEqual(cameraForward,cameraReverse,'Camera must retrace the terrain on reverse scroll');
assert(cameraForward.every((camera,index)=>!index||camera.z>cameraForward[index-1].z),'Camera must move forward through world space');
assert.deepEqual(routeCamera(.2,true),routeCamera(.9,true),'Reduced motion must hold the camera');
assert.deepEqual([0,.30,.55,.9].map(p=>routeCamera(p).index),[0,1,2,3],'The flight must visit all four landscapes');
for(const scene of SCENES)await access(path.join(root,scene));
assert.equal((html.match(/data-cloth/g)||[]).length,5,'Every story panel must have cloth');
await import('./server-check.mjs');
console.log('Verified assets, reversible video frames, four synchronized landscapes, mist transitions, five cloth panels, reduced motion, and HTTP video seeking.');
