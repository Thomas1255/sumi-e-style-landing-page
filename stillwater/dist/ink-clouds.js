import { clamp, SCENE_CUTS } from './flight-timeline.js';

// Give the painted banks a longer scroll runway than the underlying scene dissolve.
export const INK_CLOUD_SCROLL_SPAN = .20;
export const INK_CLOUD_INTRO_SPAN = .05;

// Six separately painted PNGs; none is mirrored. Entries are in back-to-front order.
export const INK_CLOUD_LAYERS = Object.freeze([
  { id: 'left-rear', side: 'left', depth: 'rear', src: 'assets/clouds/left-01-rear-wisps.png', aspect: 2045 / 769, width: 1, minHeightWidth: 1.4, inset: .16, top: -.09, drift: .025, opacity: .86, enter: [0, .40], leave: [.70, 1] },
  { id: 'right-rear', side: 'right', depth: 'rear', src: 'assets/clouds/right-01-rear-plumes.png', aspect: 2024 / 777, width: 1.12, minHeightWidth: 1.6, inset: .17, top: .47, drift: -.035, opacity: .86, enter: [0, .43], leave: [.69, 1] },
  { id: 'left-middle', side: 'left', depth: 'middle', src: 'assets/clouds/left-02-middle-bank.png', aspect: 1, width: 1.18, minHeightWidth: 1.75, inset: .04, top: .50, drift: -.025, opacity: 1, enter: [.07, .43], leave: [.65, .95] },
  { id: 'right-middle', side: 'right', depth: 'middle', src: 'assets/clouds/right-02-middle-bank.png', aspect: 1, width: 1.28, minHeightWidth: 1.95, inset: .04, top: .48, drift: .035, opacity: 1, enter: [.10, .44], leave: [.64, .94] },
  { id: 'left-front', side: 'left', depth: 'front', src: 'assets/clouds/left-03-front-billow.png', aspect: 1672 / 941, width: .92, minHeightWidth: 1.25, inset: .19, top: .31, drift: .055, opacity: 1, enter: [.19, .46], leave: [.61, .86] },
  { id: 'right-front', side: 'right', depth: 'front', src: 'assets/clouds/right-03-front-roll.png', aspect: 1671 / 941, width: 1.04, minHeightWidth: 1.35, inset: .18, top: -.28, drift: -.045, opacity: 1, enter: [.21, .46], leave: [.60, .84] }
].map(layer => Object.freeze(layer)));

// Each passage has a composed arrangement and wind direction, never a random replay.
// Scale and offsets reframe the original PNGs without flipping or recoloring them.
export const INK_CLOUD_VARIANTS = Object.freeze([
  { id: 'opening-parting', layers: [] },
  { id: 'wetlands-left-roll', layers: [
    { scale: 1.06, y: .08, drift: .06, arc: -.035, enter: [0, .36], leave: [.72, 1], z: 2 },
    { scale: .92, y: -.20, drift: -.08, arc: .035, enter: [.05, .43], leave: [.69, .98], z: 1 },
    { scale: 1.04, y: -.10, inset: 0, drift: .08, arc: -.035, enter: [.04, .39], leave: [.66, .94], z: 4 },
    { scale: 1.08, y: .12, inset: 0, drift: -.06, arc: .035, enter: [.12, .45], leave: [.64, .93], z: 3 },
    { scale: 1.12, y: -.05, drift: .10, arc: -.025, enter: [.14, .43], leave: [.60, .84], z: 6 },
    { scale: .94, y: .10, drift: -.08, arc: .025, enter: [.23, .46], leave: [.63, .88], z: 5 }
  ] },
  { id: 'temples-right-crosswind', layers: [
    { scale: .94, y: .35, drift: -.10, arc: .04, enter: [.04, .43], leave: [.70, 1], z: 1 },
    { scale: 1.14, y: -.40, drift: .10, arc: -.04, enter: [0, .34], leave: [.73, 1], z: 2 },
    { scale: .98, y: .14, drift: -.09, arc: .04, enter: [.12, .44], leave: [.66, .94], z: 3 },
    { scale: 1.16, y: -.16, drift: .08, arc: -.04, enter: [.04, .40], leave: [.65, .96], z: 4 },
    { scale: 1.38, y: -.23, drift: .14, arc: -.04, enter: [.24, .46], leave: [.65, .90], z: 5 },
    { scale: 1.20, y: .24, drift: -.08, arc: .025, enter: [.14, .43], leave: [.60, .85], z: 6 }
  ] },
  { id: 'gorge-descending-banks', layers: [
    { scale: 1.12, y: .32, drift: -.18, arc: -.045, enter: [0, .37], leave: [.71, 1], z: 2 },
    { scale: 1.20, y: -.42, drift: .12, arc: .045, enter: [.05, .39], leave: [.70, 1], z: 1 },
    { scale: 1.18, y: .10, drift: -.24, arc: -.05, enter: [.10, .44], leave: [.65, .94], z: 4 },
    { scale: 1.02, y: -.12, drift: -.20, arc: .05, enter: [.08, .42], leave: [.67, .97], z: 3 },
    { scale: 1.22, y: 0, drift: -.15, arc: -.035, enter: [.22, .46], leave: [.60, .87], z: 5 },
    { scale: 1.12, y: -.12, drift: -.18, arc: .035, enter: [.16, .44], leave: [.62, .88], z: 6 }
  ] }
].map(variant => Object.freeze({ ...variant, layers: Object.freeze(variant.layers.map(layer => Object.freeze(layer))) })));

const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const interval = (value, [start, end]) => ease((value - start) / (end - start));

// Position depends only on scroll: reversing or jumping cannot leave a timed animation behind.
export function inkCloudFrame(progress, viewportWidth, viewportHeight, reducedMotion = false) {
  const p = reducedMotion ? 0 : clamp(Number.isFinite(progress) ? progress : 0);
  const halfSpan = INK_CLOUD_SCROLL_SPAN / 2;
  const cutIndex = SCENE_CUTS.findIndex(center => p > center - halfSpan && p < center + halfSpan);
  const cut = SCENE_CUTS[cutIndex];
  const intro = !reducedMotion && p < INK_CLOUD_INTRO_SPAN;
  const variant = INK_CLOUD_VARIANTS[intro ? 0 : Math.max(0, cutIndex + 1)];
  // The layers already ease their own motion; a linear phase avoids accelerating twice.
  const phase = intro ? .60 + .40 * p / INK_CLOUD_INTRO_SPAN
    : cut === undefined ? 0 : clamp((p - cut + halfSpan) / INK_CLOUD_SCROLL_SPAN);
  const width = Math.max(1, viewportWidth), height = Math.max(1, viewportHeight);
  return {
    active: intro || cut !== undefined,
    intro,
    variant: intro || cut !== undefined ? variant.id : 'clear',
    phase,
    strength: interval(phase, [0, .46]) * (1 - interval(phase, [.60, 1])),
    layers: INK_CLOUD_LAYERS.map((layer, index) => {
      const motion = variant.layers[index] || {};
      const closure = interval(phase, motion.enter || layer.enter) * (1 - interval(phase, motion.leave || layer.leave));
      const w = Math.max(width * layer.width, height * layer.minHeightWidth) * (motion.scale ?? 1), h = w / layer.aspect;
      const inset = motion.inset ?? layer.inset;
      const closed = layer.side === 'left' ? -width * inset : width - w + width * inset;
      const outside = layer.side === 'left' ? -w - 24 : width + 24;
      const top = (layer.depth === 'middle' ? (height - h) * layer.top : height * layer.top) + height * (motion.y ?? 0);
      return {
        id: layer.id, width: w, height: h,
        x: outside + (closed - outside) * closure,
        y: top + height * ((motion.drift ?? layer.drift) * (1 - closure) + (motion.arc ?? 0) * Math.sin(Math.PI * closure)),
        closure, opacity: layer.opacity, zIndex: motion.z ?? index + 1
      };
    })
  };
}

export function mountInkClouds(after) {
  const root = document.createElement('div');
  root.className = 'ink-cloud-transition';
  root.setAttribute('aria-hidden', 'true');
  root.dataset.cloudState = 'loading';
  const fallback = document.createElement('div');
  fallback.className = 'ink-cloud-loading';
  root.append(fallback);
  const planes = INK_CLOUD_LAYERS.map(layer => {
    const image = new Image();
    image.className = 'ink-cloud-layer';
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    image.dataset.layer = layer.id;
    image.dataset.depth = layer.depth;
    image.src = layer.src;
    root.append(image);
    return image;
  });
  after.after(root);
  let progress = 0, reduced = false, disposed = false;
  let ready = false;

  function render() {
    const frame = inkCloudFrame(progress, innerWidth, innerHeight, reduced);
    root.dataset.active = String(frame.active);
    root.dataset.intro = String(frame.intro);
    root.dataset.cloudVariant = frame.variant;
    root.dataset.cloudPhase = frame.phase.toFixed(6);
    root.dataset.cloudTransition = frame.strength.toFixed(6);
    fallback.style.opacity = String(ready ? 0 : frame.strength * .985);
    frame.layers.forEach((layer, index) => {
      const image = planes[index];
      image.style.width = `${layer.width}px`;
      image.style.height = `${layer.height}px`;
      image.style.transform = `translate3d(${layer.x}px,${layer.y}px,0)`;
      image.style.opacity = String(layer.opacity);
      image.style.zIndex = String(layer.zIndex);
      image.dataset.closure = layer.closure.toFixed(6);
    });
    return frame.strength;
  }

  Promise.allSettled(planes.map(image => image.decode())).then(results => {
    if (disposed) return;
    ready = results.every(result => result.status === 'fulfilled');
    results.forEach((result, index) => { planes[index].hidden = result.status === 'rejected'; });
    root.dataset.cloudState = ready ? 'ready' : 'fallback';
    render();
    document.documentElement.classList.remove('cloud-intro-loading');
  });
  addEventListener('resize', render, { passive: true });
  render();
  return {
    setProgress(next, reducedMotion = false) {
      progress = next;
      reduced = reducedMotion;
      return render();
    },
    destroy() {
      disposed = true;
      removeEventListener('resize', render);
      document.documentElement.classList.remove('cloud-intro-loading');
      root.remove();
    }
  };
}
