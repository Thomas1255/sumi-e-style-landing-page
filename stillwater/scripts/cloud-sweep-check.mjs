import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { SCENE_CUTS } from '../dist/flight-timeline.js';
import { INK_CLOUD_SETS, INK_CLOUD_VARIANTS, INK_CLOUD_SCROLL_SPAN, inkCloudFrame } from '../dist/ink-clouds.js';

// Decode the actual approved 8-bit RGBA PNGs so the cropped-edge regression and
// scene coverage are checked from their pixels, rather than metadata alone.
function paintingAlpha(png) {
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(png[24], 8); assert.equal(png[25], 6); assert.equal(png[28], 0);
  const chunks = [];
  for (let offset = 8; offset + 12 <= png.length;) {
    const length = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8);
    assert(offset + length + 12 <= png.length);
    if (type === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (type === 'IEND') break;
  }
  const data = inflateSync(Buffer.concat(chunks)), stride = width * 4;
  assert.equal(data.length, height * (stride + 1));
  const alpha = new Uint8Array(width * height);
  let previous = new Uint8Array(stride), row = new Uint8Array(stride), cursor = 0;
  for (let y = 0; y < height; y++) {
    const filter = data[cursor++];
    assert(filter >= 0 && filter <= 4);
    for (let x = 0; x < stride; x++) {
      const left = x < 4 ? 0 : row[x - 4], up = previous[x], upperLeft = x < 4 ? 0 : previous[x - 4];
      let prediction = 0;
      if (filter === 1) prediction = left;
      else if (filter === 2) prediction = up;
      else if (filter === 3) prediction = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const p = left + up - upperLeft;
        const a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - upperLeft);
        prediction = a <= b && a <= c ? left : b <= c ? up : upperLeft;
      }
      row[x] = (data[cursor++] + prediction) & 255;
    }
    for (let x = 0; x < width; x++) alpha[y * width + x] = row[x * 4 + 3];
    [previous, row] = [row, previous];
  }
  return { width, height, alpha };
}

function sampleAlpha(painting, layer, x, y) {
  const u = (x - layer.x) / layer.width, v = (y - layer.y) / layer.height;
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return 0;
  const px = Math.max(0, Math.min(painting.width - 1, u * painting.width - .5));
  const py = Math.max(0, Math.min(painting.height - 1, v * painting.height - .5));
  const ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy;
  const right = Math.min(ix + 1, painting.width - 1), down = Math.min(iy + 1, painting.height - 1);
  const a = painting.alpha[iy * painting.width + ix] * (1 - fx) + painting.alpha[iy * painting.width + right] * fx;
  const b = painting.alpha[down * painting.width + ix] * (1 - fx) + painting.alpha[down * painting.width + right] * fx;
  return (a * (1 - fy) + b * fy) / 255 * layer.opacity;
}

for (const transition of [
  { index: 2, variant: 'tangled-whiskers-sweep', record: 'cloud-s-layered-v9', field: 'assets', direction: -1 },
  { index: 3, variant: 'bold-ink-rightward-sweep', record: 'cloud-bold-outline-prototypes-v11', field: 'variants', direction: 1 }
]) {
  const record = JSON.parse(await readFile(new URL(`../art-previews/${transition.record}/artwork-record.json`, import.meta.url), 'utf8'));
  const assets = record[transition.field], layers = INK_CLOUD_SETS[transition.index];
  assert.equal(INK_CLOUD_VARIANTS[transition.index].id, transition.variant);
  assert(layers.every(layer => layer.side === (transition.direction === 1 ? 'left' : 'right')), 'All cloud layers must enter from the approved side');
  assert.equal(layers.length, assets.length, 'Use every approved painting exactly once');
  const paintings = await Promise.all(layers.map(async layer => {
    const asset = assets.find(candidate => (candidate.runtimeId || candidate.id) === layer.id);
    assert(asset); assert.equal(layer.src, asset.runtimeSrc);
    const png = await readFile(new URL(`../dist/${layer.src}`, import.meta.url));
    assert.equal(createHash('sha256').update(png).digest('hex'), asset.sha256, 'Use the approved complete cloud unchanged');
    const painting = paintingAlpha(png);
    for (let y = 0; y < painting.height; y++) for (let x = 0; x < painting.width; x++) {
      if (x < 8 || y < 8 || x >= painting.width - 8 || y >= painting.height - 8) {
        assert(painting.alpha[y * painting.width + x] <= 2, 'The whole silhouette needs clear margins on every side');
      }
    }
    return painting;
  }));
  const cut = SCENE_CUTS[transition.index - 1], span = INK_CLOUD_SCROLL_SPAN;
  for (const viewport of [[1280,720], [390,844], [2560,1080], [844,390]]) {
    const [width, height] = viewport;
    const at = phase => inkCloudFrame(cut - span / 2 + phase * span, width, height);
    const fromLeft = transition.direction === 1;
    assert(at(.00001).layers.every(layer => fromLeft ? layer.x + layer.width < 0 : layer.x > width), 'Complete clouds start offscreen on the entry side');
    assert(at(.99999).layers.every(layer => fromLeft ? layer.x > width : layer.x + layer.width < 0), 'Every cloud must finish beyond the opposite edge');
    let previous = at(.00001);
    for (let step = 1; step < 1000; step++) {
      const next = at(step / 1000);
      assert(next.layers.every((layer, i) => (layer.x - previous.layers[i].x) * transition.direction >= -1e-7), 'The sweep must continue in its approved direction');
      previous = next;
    }
    const arrivals = at(.24).layers.map(layer => layer.closure.toFixed(5));
    assert.equal(new Set(arrivals).size, layers.length, 'Every painting needs a separately staggered arrival');
    const closed = at(.5);
    let minimum = 1, opaque = 0, samples = 0;
    for (let y = .5; y < height; y += 8) for (let x = .5; x < width; x += 8) {
      let transparent = 1;
      closed.layers.forEach((layer, i) => { transparent *= 1 - sampleAlpha(paintings[i], layer, x, y); });
      const alpha = 1 - transparent;
      minimum = Math.min(minimum, alpha); opaque += Number(alpha >= .99); samples++;
    }
    assert(minimum > .98 && opaque / samples > .99, `${transition.variant} must conceal the ${width}x${height} scene cut: minimum alpha ${minimum.toFixed(4)}, opaque fraction ${(opaque / samples).toFixed(4)}`);
  }
  console.log(`Verified ${transition.variant}: ${layers.length} approved complete clouds, transparent borders, one-way staggered travel and responsive scene coverage.`);
}
