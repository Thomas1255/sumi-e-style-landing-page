import { clamp, SCENE_CUTS } from './flight-timeline.js';
import { createInkCloudRenderer } from './ink-cloud-renderer.js';
import { INK_CLOUD_PALETTES, CLOUD_REFERENCE_TONES, createCloudPaletteFilters } from './ink-cloud-palette.js';

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

// Approved S uses complete silhouettes: all six enter from the right and keep
// travelling left. Their transparent trailing edges remain visible on exit.
const WHISKER_SWEEP_LAYERS = [
  { id: 'rear-upper', depth: 'rear', src: 'assets/clouds/tangled-whiskers/01-rear-upper-cloud.png', aspect: 1672/941, width: 2.05, x: -.55, y: -.61, drift: .035, enter: [0,.36], leave: [.74,1] },
  { id: 'rear-lower', depth: 'rear', src: 'assets/clouds/tangled-whiskers/02-rear-low-cloud.png', aspect: 1920/819, width: 2.10, x: -.44, y: -.17, drift: -.025, enter: [.025,.39], leave: [.71,.99] },
  { id: 'middle-wall', depth: 'middle', src: 'assets/clouds/tangled-whiskers/03-middle-cluster.png', aspect: 1, width: 2.20, x: -.60, y: -1.60, drift: .025, enter: [.065,.41], leave: [.68,.97] },
  { id: 'middle-overhang', depth: 'middle', src: 'assets/clouds/tangled-whiskers/04-middle-pendant.png', aspect: 1448/1086, width: 1.50, x: -.20, y: -.45, drift: -.045, enter: [.11,.44], leave: [.65,.94] },
  { id: 'front-whiskers', depth: 'front', src: 'assets/clouds/tangled-whiskers/05-front-whiskers.png', aspect: 2, width: 1.55, x: -.12, y: -.30, drift: .055, enter: [.15,.455], leave: [.60,.87] },
  { id: 'front-billow', depth: 'front', src: 'assets/clouds/tangled-whiskers/06-front-low-billow.png', aspect: 1.5, width: 1.30, x: -.12, y: -.04, drift: -.035, enter: [.21,.46], leave: [.63,.90] }
].map(layer => ({ ...layer, side: 'right', opacity: 1 }));

// The final passage mixes all five approved bold-outline paintings. Each is a
// whole cloud with transparent margins, including its left-trailing tail tips.
const BOLD_INK_SWEEP_LAYERS = [
  { id: 'floating-canopy', depth: 'rear', src: 'assets/clouds/bold-ink/05-floating-canopy-bold.png', aspect: 2, width: 2.00, x: -.65, y: -.62, drift: -.035, enter: [0,.34], leave: [.74,1] },
  { id: 'low-bank', depth: 'rear', src: 'assets/clouds/bold-ink/02-low-tumbling-bank-bold.png', aspect: 2, width: 2.40, x: -.95, y: -.40, drift: .03, enter: [.04,.40], leave: [.72,.99] },
  { id: 'crown-front', depth: 'middle', src: 'assets/clouds/bold-ink/01-crown-front-bold.png', aspect: 2, width: 2.25, x: -1.10, y: -.48, drift: -.025, enter: [.08,.43], leave: [.67,.96] },
  { id: 'rising-tangle', depth: 'middle', src: 'assets/clouds/bold-ink/03-rising-tangle-bold.png', aspect: 2, width: 1.80, x: -.55, y: -.30, drift: .05, enter: [.15,.45], leave: [.64,.93] },
  { id: 'charcoal-front', depth: 'front', src: 'assets/clouds/bold-ink/04-charcoal-front-bold.png', aspect: 2, width: 1.50, x: -.25, y: -.15, drift: -.04, enter: [.23,.46], leave: [.60,.86] }
].map(layer => ({ ...layer, side: 'left', opacity: 1 }));

// The opening keeps its original paintings. Each later passage uses its own
// approved artwork, arrangement and wind direction.
export const INK_CLOUD_VARIANTS = Object.freeze([
  { id: 'opening-parting', layers: [] },
  { id: 'calligraphic-curls-banks', layers: [
    { scale: 1.06, y: .08, drift: .06, arc: -.035, enter: [0, .36], leave: [.72, 1], z: 2 },
    { scale: .92, y: -.20, drift: -.08, arc: .035, enter: [.05, .43], leave: [.69, .98], z: 1 },
    { scale: 1.32, y: -.35, inset: 0, drift: .08, arc: -.035, enter: [.04, .39], leave: [.66, .94], z: 4 },
    { scale: 1.38, y: .70, inset: 0, drift: -.06, arc: .035, enter: [.12, .45], leave: [.64, .93], z: 3 },
    { scale: 1.20, y: -.25, drift: .10, arc: -.025, enter: [.14, .43], leave: [.60, .84], z: 6 },
    { scale: 1.10, y: .32, drift: -.08, arc: .025, enter: [.23, .46], leave: [.63, .88], z: 5 }
  ] },
  { id: 'tangled-whiskers-sweep', direction: 'right-to-left', layers: [] },
  { id: 'bold-ink-rightward-sweep', direction: 'left-to-right', layers: [] }
].map(variant => Object.freeze({ ...variant, layers: Object.freeze(variant.layers.map(layer => Object.freeze(layer))) })));

const paintedSet = (directory, aspects) => INK_CLOUD_LAYERS.map((layer, index) => ({
  ...layer,
  src: `assets/clouds/${directory}/${layer.id}.png`,
  aspect: aspects[index]
}));

export const INK_CLOUD_SETS = Object.freeze([
  INK_CLOUD_LAYERS,
  paintedSet('calligraphic-curls', [1897 / 829, 1774 / 887, 1, 1, 1672 / 941, 1672 / 941]),
  WHISKER_SWEEP_LAYERS,
  BOLD_INK_SWEEP_LAYERS
].map(layers => Object.freeze(layers.map(layer => Object.freeze(layer)))));

const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const interval = (value, [start, end]) => ease((value - start) / (end - start));

function sweepCloudLayerFrame(layer, phase, width, height, index) {
  // Preserve the approved 16:9 overlap, cropping its center on narrower or wider
  // viewports so the scene stays covered without stretching a cloud silhouette.
  const stageWidth = Math.max(width, height * 16/9), stageHeight = stageWidth * 9/16;
  const w = stageWidth * layer.width, h = w / layer.aspect;
  const entry = interval(phase, layer.enter), exit = interval(phase, layer.leave);
  const fromLeft = layer.side === 'left';
  const start = fromLeft ? -w - 24 : width + 24;
  const closed = stageWidth * layer.x + (width - stageWidth) / 2;
  const end = fromLeft ? width + 24 : -w - 24;
  return {
    id: layer.id, src: layer.src, side: layer.side, width: w, height: h,
    x: start + (closed - start) * entry + (end - closed) * exit,
    y: stageHeight * (layer.y + layer.drift * Math.sin(Math.PI * (entry + exit))) + (height - stageHeight) / 2,
    closure: entry * (1 - exit), opacity: layer.opacity, zIndex: index + 1
  };
}

// Position depends only on scroll: reversing or jumping cannot leave a timed animation behind.
export function inkCloudFrame(progress, viewportWidth, viewportHeight, reducedMotion = false, openingEnabled = true) {
  const p = reducedMotion ? 0 : clamp(Number.isFinite(progress) ? progress : 0);
  const halfSpan = INK_CLOUD_SCROLL_SPAN / 2;
  const cutIndex = SCENE_CUTS.findIndex(center => p > center - halfSpan && p < center + halfSpan);
  const cut = SCENE_CUTS[cutIndex];
  const intro = openingEnabled && !reducedMotion && p < INK_CLOUD_INTRO_SPAN;
  const setIndex = intro ? 0 : Math.max(0, cutIndex + 1);
  const variant = INK_CLOUD_VARIANTS[setIndex];
  // The layers already ease their own motion; a linear phase avoids accelerating twice.
  const phase = intro ? .60 + .40 * p / INK_CLOUD_INTRO_SPAN
    : cut === undefined ? 0 : clamp((p - cut + halfSpan) / INK_CLOUD_SCROLL_SPAN);
  const width = Math.max(1, viewportWidth), height = Math.max(1, viewportHeight);
  return {
    active: intro || cut !== undefined,
    intro,
    setIndex,
    variant: intro || cut !== undefined ? variant.id : 'clear',
    phase,
    strength: interval(phase, [0, .46]) * (1 - interval(phase, [.60, 1])),
    layers: INK_CLOUD_SETS[setIndex].map((layer, index) => {
      if (variant.direction) return sweepCloudLayerFrame(layer, phase, width, height, index);
      const motion = variant.layers[index] || {};
      const closure = interval(phase, motion.enter || layer.enter) * (1 - interval(phase, motion.leave || layer.leave));
      const w = Math.max(width * layer.width, height * layer.minHeightWidth) * (motion.scale ?? 1), h = w / layer.aspect;
      const inset = motion.inset ?? layer.inset;
      const closed = layer.side === 'left' ? -width * inset : width - w + width * inset;
      const outside = layer.side === 'left' ? -w - 24 : width + 24;
      const top = (layer.depth === 'middle' ? (height - h) * layer.top : height * layer.top) + height * (motion.y ?? 0);
      return {
        id: layer.id, src: layer.src, side: layer.side, width: w, height: h,
        x: outside + (closed - outside) * closure,
        y: top + height * ((motion.drift ?? layer.drift) * (1 - closure) + (motion.arc ?? 0) * Math.sin(Math.PI * closure)),
        closure, opacity: layer.opacity, zIndex: motion.z ?? index + 1
      };
    })
  };
}

export function mountInkClouds(after, { openingEnabled = true } = {}) {
  const root = document.createElement('div');
  root.className = 'ink-cloud-transition';
  root.setAttribute('aria-hidden', 'true');
  root.dataset.cloudState = 'loading';
  root.append(createCloudPaletteFilters(document));
  const fallback = document.createElement('div');
  fallback.className = 'ink-cloud-loading';
  root.append(fallback);
  const surface = document.createElement('canvas');
  surface.className = 'ink-cloud-surface';
  surface.hidden = true;
  root.append(surface);
  // Keep decoded images in separate banks. Changing the active bank never swaps
  // an image URL during a scroll frame, including a fast jump or reverse scroll.
  const banks = INK_CLOUD_SETS.map((layers, setIndex) => {
    const element = document.createElement('div');
    element.className = 'ink-cloud-set';
    element.dataset.cloudSet = INK_CLOUD_VARIANTS[setIndex].id;
    element.hidden = true;
    const planes = layers.map(layer => {
      const image = new Image();
      image.className = 'ink-cloud-layer';
      image.alt = '';
      image.draggable = false;
      image.decoding = 'async';
      image.fetchPriority = setIndex === 0 ? 'high' : 'low';
      image.dataset.layer = layer.id;
      image.dataset.depth = layer.depth;
      image.src = layer.src;
      if (INK_CLOUD_PALETTES[setIndex]) image.style.filter = `url(#${INK_CLOUD_PALETTES[setIndex].id})`;
      element.append(image);
      return image;
    });
    root.append(element);
    return { element, planes, state: 'loading' };
  });
  after.after(root);
  let progress = 0, reduced = false, disposed = false;
  const renderer = createInkCloudRenderer(surface,render);

  function render() {
    const frame = inkCloudFrame(progress, innerWidth, innerHeight, reduced, openingEnabled);
    const bank = banks[frame.setIndex];
    banks.forEach(candidate => { candidate.element.hidden = candidate !== bank || !frame.active; });
    root.dataset.cloudState = bank.state;
    root.dataset.active = String(frame.active);
    root.dataset.intro = String(frame.intro);
    root.dataset.cloudVariant = frame.variant;
    root.dataset.cloudPalette = INK_CLOUD_PALETTES[frame.setIndex]?.id || 'original';
    root.dataset.cloudPhase = frame.phase.toFixed(6);
    root.dataset.cloudTransition = frame.strength.toFixed(6);
    fallback.style.opacity = String(bank.state === 'ready' ? 0 : frame.strength * .985);
    fallback.style.backgroundColor = INK_CLOUD_PALETTES[frame.setIndex] ? `rgb(${CLOUD_REFERENCE_TONES.paper.join(',')})` : '';
    const reconstructed = bank.state === 'ready' && !!renderer?.draw(frame,bank.planes,innerWidth,innerHeight,devicePixelRatio || 1);
    root.dataset.cloudRenderer = reconstructed ? 'reconstructed' : 'images';
    surface.hidden = !reconstructed;
    frame.layers.forEach((layer, index) => {
      const image = bank.planes[index];
      image.style.width = `${layer.width}px`;
      image.style.height = `${layer.height}px`;
      image.style.transform = `translate3d(${layer.x}px,${layer.y}px,0)`;
      image.style.opacity = String(layer.opacity);
      image.style.zIndex = String(layer.zIndex);
      image.dataset.closure = layer.closure.toFixed(6);
    });
    return frame.strength;
  }

  banks.forEach((bank, setIndex) => {
    Promise.allSettled(bank.planes.map(image => image.decode())).then(results => {
      if (disposed) return;
      bank.state = results.every(result => result.status === 'fulfilled') ? 'ready' : 'fallback';
      results.forEach((result, index) => { bank.planes[index].hidden = result.status === 'rejected'; });
      render();
      // Loading a later scene must neither delay nor uncover the opening.
      if (setIndex === 0) document.documentElement.classList.remove('cloud-intro-loading');
    });
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
      renderer?.destroy();
      document.documentElement.classList.remove('cloud-intro-loading');
      root.remove();
    }
  };
}
