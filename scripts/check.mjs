import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { flightState } from '../dist/flight-model.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
const js = await readFile(path.join(root, 'app.js'), 'utf8');
execFileSync(process.execPath, ['--check', path.join(root, 'app.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'flight-model.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'clouds.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'page-clouds.js')]);
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
const forward = [0, .12, .37, .62, .86, 1].map(p => flightState(p));
const backward = [1, .86, .62, .37, .12, 0].map(p => flightState(p)).reverse();
assert.deepEqual(forward, backward, 'Reversing scroll must retrace exactly the same frames');
assert.equal(flightState(-1).frame, 0);
assert.equal(flightState(2).frame, 359);
assert.notEqual(flightState(.2).wing, flightState(.23).wing, 'Scrolling must change the wing pose');
assert.notEqual(flightState(.2).camera, flightState(.7).camera, 'Scrolling must travel through the landscape');
assert.equal(flightState(.2, true).wing, flightState(.8, true).wing, 'Reduced motion holds a still wing pose');
for (let frame = 0; frame <= 359; frame++) {
  const state = flightState(frame / 359);
  assert(Object.values(state).every(Number.isFinite), `Nonfinite value in frame ${frame}`);
  assert(state.x > 0 && state.x < 1 && state.y > 0 && state.y < 1, 'Crane must stay in the frame');
}
console.log('Verified assets, anchors, cloud module syntax, all 360 flight frames, reversible scrubbing, and reduced-motion behavior.');
