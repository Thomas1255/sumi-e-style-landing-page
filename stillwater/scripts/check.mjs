import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { flockState } from '../dist/flight-model.js';
import { routeCamera, SCENES } from '../dist/terrain.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
const js = await readFile(path.join(root, 'app.js'), 'utf8');
execFileSync(process.execPath, ['--check', path.join(root, 'app.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'flight-model.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'clouds.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'page-clouds.js')]);
for (const filename of ['terrain.js','flock.js','cloth.js','page-cloth.js','audio.js']) execFileSync(process.execPath, ['--check', path.join(root, filename)]);
// Resolve all relative module imports, including assets loaded from JavaScript.
for (const filename of ['app.js','terrain.js','page-cloth.js','page-clouds.js']) {
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
const forward = [0, .12, .37, .62, .86, 1].map(p => flockState(p));
const backward = [1, .86, .62, .37, .12, 0].map(p => flockState(p)).reverse();
assert.deepEqual(forward, backward, 'Reversing scroll must retrace exactly the same frames');
assert.equal(flockState(-1)[0].frame, 0);
assert.equal(flockState(2)[0].frame, 719);
assert.notDeepEqual(flockState(.2),flockState(.23),'Scrolling must change the flock pose');
assert.deepEqual(flockState(.2,true),flockState(.8,true),'Reduced motion holds the flock still');
for (let frame = 0; frame <= 719; frame++) {
  const birds=flockState(frame/719);
  assert.equal(birds.length,9,'The flight must have nine cranes');
  assert(new Set(birds.map(b=>b.wing)).size>3,'Birds must have staggered wingbeats');
  for(const state of birds){
    assert(Object.values(state).every(Number.isFinite), `Nonfinite value in frame ${frame}`);
    assert(state.x>.1&&state.x<.95&&state.y>.1&&state.y<.9,'Flock must stay in the frame');
  }
}
const cameraForward = [0,.25,.5,.75,1].map(p => routeCamera(p));
const cameraReverse = [1,.75,.5,.25,0].map(p => routeCamera(p)).reverse();
assert.deepEqual(cameraForward,cameraReverse,'Camera must retrace the terrain on reverse scroll');
assert(cameraForward.every((camera,index)=>!index||camera.z>cameraForward[index-1].z),'Camera must move forward through world space');
assert.deepEqual(routeCamera(.2,true),routeCamera(.9,true),'Reduced motion must hold the camera');
assert.deepEqual([0,.30,.55,.9].map(p=>routeCamera(p).index),[0,1,2,3],'The flight must visit all four landscapes');
for(const scene of SCENES)await access(path.join(root,scene));
assert.equal((html.match(/data-cloth/g)||[]).length,5,'Every story panel must have cloth');
console.log('Verified modules/assets, anchors, 720 reversible flock frames, nine staggered cranes, four painted landscapes, five cloth panels, and reduced motion.');
