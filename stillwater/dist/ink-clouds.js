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

const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const interval = (value, [start, end]) => ease((value - start) / (end - start));

// Position depends only on scroll: reversing or jumping cannot leave a timed animation behind.
export function inkCloudFrame(progress, viewportWidth, viewportHeight, reducedMotion = false) {
  const p = reducedMotion ? 0 : clamp(Number.isFinite(progress) ? progress : 0);
  const halfSpan = INK_CLOUD_SCROLL_SPAN / 2;
  const cut = SCENE_CUTS.find(center => p > center - halfSpan && p < center + halfSpan);
  const intro = !reducedMotion && p < INK_CLOUD_INTRO_SPAN;
  // The layers already ease their own motion; a linear phase avoids accelerating twice.
  const phase = intro ? .60 + .40 * p / INK_CLOUD_INTRO_SPAN
    : cut === undefined ? 0 : clamp((p - cut + halfSpan) / INK_CLOUD_SCROLL_SPAN);
  const width = Math.max(1, viewportWidth), height = Math.max(1, viewportHeight);
  return {
    active: intro || cut !== undefined,
    intro,
    phase,
    strength: interval(phase, [0, .46]) * (1 - interval(phase, [.60, 1])),
    layers: INK_CLOUD_LAYERS.map(layer => {
      const closure = interval(phase, layer.enter) * (1 - interval(phase, layer.leave));
      const w = Math.max(width * layer.width, height * layer.minHeightWidth), h = w / layer.aspect;
      const closed = layer.side === 'left' ? -width * layer.inset : width - w + width * layer.inset;
      const outside = layer.side === 'left' ? -w - 24 : width + 24;
      const top = layer.depth === 'middle' ? (height - h) * layer.top : height * layer.top;
      return {
        id: layer.id, width: w, height: h,
        x: outside + (closed - outside) * closure,
        y: top + height * layer.drift * (1 - closure),
        closure, opacity: layer.opacity
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
    root.dataset.cloudPhase = frame.phase.toFixed(6);
    root.dataset.cloudTransition = frame.strength.toFixed(6);
    fallback.style.opacity = String(ready ? 0 : frame.strength * .985);
    frame.layers.forEach((layer, index) => {
      const image = planes[index];
      image.style.width = `${layer.width}px`;
      image.style.height = `${layer.height}px`;
      image.style.transform = `translate3d(${layer.x}px,${layer.y}px,0)`;
      image.style.opacity = String(layer.opacity);
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
