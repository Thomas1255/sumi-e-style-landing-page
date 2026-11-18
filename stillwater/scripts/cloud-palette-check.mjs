import assert from 'node:assert/strict';
import { CLOUD_PALETTE_STEPS, CLOUD_REFERENCE_TONES, INK_CLOUD_PALETTES, cloudPaletteRgb } from '../dist/ink-cloud-palette.js';

for (const index of [0, 1]) for (const rgb of [[0,0,0], [.2,.17,.13], [.95,.84,.7], [1,1,1]]) {
  assert.deepEqual(cloudPaletteRgb(rgb, index), rgb, 'Opening and first-transition colors must remain identical');
}
for (const index of [2, 3]) {
  const palette = INK_CLOUD_PALETTES[index];
  assert.equal(palette.table.length, (CLOUD_PALETTE_STEPS + 1) * 3);
  for (let channel = 0; channel < 3; channel++) for (let step = 0; step <= CLOUD_PALETTE_STEPS; step++) {
    const value = palette.table[step * 3 + channel];
    assert(Number.isFinite(value) && value >= 0 && value <= 1, 'Palette curves must stay inside the RGB gamut');
    if (step) assert(value >= palette.table[(step - 1) * 3 + channel], 'Keep tonal order and brush detail without reversing brightness');
  }
  for (const [name, reference] of Object.entries(CLOUD_REFERENCE_TONES)) {
    const mapped = cloudPaletteRgb(palette.source[name].map(value => value / 255), index).map(value => value * 255);
    assert(mapped.every((value, channel) => Math.abs(value - reference[channel]) < 1), 'Ink, wash, paper and highlights must match the first palette within one RGB level');
  }
  const paper = cloudPaletteRgb(palette.source.paper.map(value => value / 255), index);
  assert(paper[2] * 255 < palette.source.paper[2] - 15, 'Later paper must lose the pale gray cast and gain the reference parchment warmth');
}
console.log('Verified first-transition palette matching: original opening/first colors, monotone RGB curves, warm paper and matched ink/wash/highlights.');
