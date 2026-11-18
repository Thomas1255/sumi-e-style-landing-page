// Tone samples from the approved first passage: warm parchment, brown-gray
// wash and charcoal. The original PNGs and their alpha remain untouched.
export const CLOUD_PALETTE_STEPS = 64;
export const CLOUD_REFERENCE_TONES = Object.freeze({
  ink: Object.freeze([71.4, 62.4, 53.5]),
  wash: Object.freeze([165.9, 144.0, 121.8]),
  paper: Object.freeze([245.5, 217.8, 181.1]),
  highlight: Object.freeze([248.9, 223.9, 189.9])
});

const sourceTones = {
  2: { ink: [83.5, 73.2, 65.2], wash: [164.6, 146.0, 127.8], paper: [242.2, 225.0, 203.8], highlight: [248.7, 233.9, 213.8] },
  3: { ink: [66.4, 61.0, 55.2], wash: [160.7, 146.5, 133.7], paper: [247.5, 229.7, 207.9], highlight: [250.9, 237.0, 218.9] }
};
const toneNames = Object.keys(CLOUD_REFERENCE_TONES);
const clamp = value => Math.max(0, Math.min(1, value));

function curve(value, source, channel) {
  const knots = [[0, 0], ...toneNames.map(name => [source[name][channel] / 255, CLOUD_REFERENCE_TONES[name][channel] / 255]), [1, 1]];
  for (let index = 1; index < knots.length; index++) {
    if (value <= knots[index][0]) {
      const [x0, y0] = knots[index - 1], [x1, y1] = knots[index];
      return y0 + (y1 - y0) * (value - x0) / (x1 - x0);
    }
  }
  return 1;
}

export const INK_CLOUD_PALETTES = Object.freeze(Object.fromEntries(
  Object.entries(sourceTones).map(([index, source]) => [index, Object.freeze({
    id: `ink-cloud-palette-${index}`,
    source: Object.freeze(Object.fromEntries(toneNames.map(name => [name, Object.freeze(source[name])]))),
    table: Object.freeze(Array.from({ length: CLOUD_PALETTE_STEPS + 1 }, (_, step) =>
      [0, 1, 2].map(channel => curve(step / CLOUD_PALETTE_STEPS, source, channel))).flat())
  })])
));

// The same sampled curves drive both WebGL and the SVG image fallback.
export function cloudPaletteRgb(rgb, setIndex) {
  const palette = INK_CLOUD_PALETTES[setIndex];
  if (!palette) return [...rgb];
  return rgb.map((value, channel) => {
    const position = clamp(value) * CLOUD_PALETTE_STEPS, low = Math.floor(position);
    const high = Math.min(CLOUD_PALETTE_STEPS, low + 1), fraction = position - low;
    return palette.table[low * 3 + channel] * (1 - fraction) + palette.table[high * 3 + channel] * fraction;
  });
}

export function createCloudPaletteFilters(document) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute'; svg.style.pointerEvents = 'none';
  const defs = document.createElementNS(ns, 'defs');
  svg.append(defs);
  for (const palette of Object.values(INK_CLOUD_PALETTES)) {
    const filter = document.createElementNS(ns, 'filter');
    filter.id = palette.id;
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.setAttribute('x', '0%'); filter.setAttribute('y', '0%');
    filter.setAttribute('width', '100%'); filter.setAttribute('height', '100%');
    const transfer = document.createElementNS(ns, 'feComponentTransfer');
    ['R', 'G', 'B'].forEach((component, channel) => {
      const fn = document.createElementNS(ns, `feFunc${component}`);
      fn.setAttribute('type', 'table');
      fn.setAttribute('tableValues', palette.table.filter((_, index) => index % 3 === channel).map(value => value.toFixed(7)).join(' '));
      transfer.append(fn);
    });
    const alpha = document.createElementNS(ns, 'feFuncA');
    alpha.setAttribute('type', 'identity'); transfer.append(alpha);
    filter.append(transfer); defs.append(filter);
  }
  return svg;
}
