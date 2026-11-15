import { SCENE_CUTS } from './flight-timeline.js';

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

// Material beyond the hanging length winds around the lower roller. Keep this
// geometry in step with rollFabric() in the cloth and shadow vertex shaders.
export function clothRollGeometry(open, height) {
  const amount = clamp(open), h = Math.max(1, height);
  const radius = 18 * Math.min(1, (1 - amount) * 10);
  const hanging = amount * (h - radius);
  return { radius, hanging, bottom: hanging + radius, materialEnd: Math.min(h, hanging + Math.PI * radius) };
}

// A weighted wooden hem moves as a rigid body. Both the fabric shader and the
// DOM roller consume this same transform in the same animation frame.
export function clothHemMotion(time, open, reducedMotion = false) {
  const weight = reducedMotion ? 0 : clamp(open);
  const x = 2.2 * Math.sin(time * .65) * weight;
  const y = 1.1 * Math.sin(time * .91 + .8) * weight;
  const angle = .0045 * Math.sin(time * .73 + 1.4) * weight;
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  return { x, y, cosine, sine, matrix: `matrix(${cosine},${sine},${-sine},${cosine},${x},${y})` };
}

// Reveal the new scroll as the painted cloud banks part, rather than spending
// its entire entrance behind the opaque center of the scene transition.
export function scrollSceneArrival(progress, index) {
  const cut = SCENE_CUTS[index - 1];
  return cut === undefined ? 1 : ease((progress - cut - .045) / .04);
}

// Use the section's position, not the sticky card's position: the animation
// retraces exactly on reverse scroll and completes before sticky positioning ends.
export function scrollRollFrame({ top, bottom, height, anchor, paddingBottom = 160, viewport,
  first = false, last = false, intro = 1, arrival = 1, reducedMotion = false }) {
  if (reducedMotion) return { open: 1, opacity: 1, phase: 'open' };
  const enter = first ? clamp(intro) : Math.min(clamp(arrival), ease((viewport * .75 - top) / (viewport * .70)));
  const end = last ? viewport + 24 : anchor + height + paddingBottom + viewport * .12;
  const leave = ease((bottom - end) / (viewport * .85));
  const open = Math.min(enter, leave);
  return {
    open,
    opacity: ease(open / .08),
    phase: enter <= 0 ? 'before' : leave <= 0 ? 'after' : open >= .999 ? 'open' : enter < leave ? 'unrolling' : 'rolling-up'
  };
}
