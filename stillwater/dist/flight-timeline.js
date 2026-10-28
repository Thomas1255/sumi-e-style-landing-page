// Landscape and film share one reversible scroll timeline.
export const SCENE_CUTS = Object.freeze([.18, .43, .68]);
export const SCENE_DISSOLVE = .095;
export const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const FLIGHT_CLIPS = Object.freeze([
  { name: 'rear-follow', src: 'assets/videos/crane-01-rear-follow.mp4', poster: 'assets/flock-01.png', frames: 193, fps: 24 },
  { name: 'left-bank', src: 'assets/videos/crane-02-left-bank.mp4', poster: 'assets/flock-02.png', frames: 145, fps: 24 },
  { name: 'right-bank', src: 'assets/videos/crane-03-right-bank.mp4', poster: 'assets/flock-03.png', frames: 145, fps: 24 },
  { name: 'high-overhead', src: 'assets/videos/crane-04-high-overhead.mp4', poster: 'assets/flock-04.png', frames: 145, fps: 24 }
]);
export function sceneState(progress, reducedMotion = false) {
  const p = reducedMotion ? 0 : clamp(Number.isFinite(progress) ? progress : 0);
  let index = 0, blend = 0;
  for (let i = 0; i < SCENE_CUTS.length; i++) {
    const start = SCENE_CUTS[i] - SCENE_DISSOLVE / 2;
    if (p >= start + SCENE_DISSOLVE) index = i + 1;
    else if (p > start) { index = i; blend = smooth((p - start) / SCENE_DISSOLVE); break; }
  }
  return { progress: p, index, next: Math.min(3, index + 1), blend };
}
export function clipBounds(index) {
  return [index === 0 ? 0 : SCENE_CUTS[index - 1] - SCENE_DISSOLVE / 2,
    index === 3 ? 1 : SCENE_CUTS[index] + SCENE_DISSOLVE / 2];
}
export function sceneCloudStrength(progress, reducedMotion = false) {
  const { blend } = sceneState(progress, reducedMotion);
  // A dense center holds across the perspective cut, then opens into the next view.
  return smooth(blend / .38) * (1 - smooth((blend - .62) / .38));
}
export function clipFrame(index, progress) {
  const [start, end] = clipBounds(index);
  return Math.round(clamp((progress - start) / (end - start)) * (FLIGHT_CLIPS[index].frames - 1));
}
export function flockTravel(index, progress, reducedMotion = false) {
  if (index !== 0 || reducedMotion) return { scale: 1, x: 0, y: 0 };
  const t = smooth(sceneState(progress).progress / SCENE_CUTS[0]);
  // The rear-follow flock gently climbs away along a curved path into the valley.
  return {
    scale: 1 - .14 * t,
    x: .008 * Math.sin(t * Math.PI) - .015 * t,
    y: -.065 * t + .004 * Math.sin(t * Math.PI * 2)
  };
}
export function flightVideoState(progress, reducedMotion = false) {
  const scene = sceneState(progress, reducedMotion);
  // Pass through the landscape's mist instead of superimposing two flocks.
  const outgoing = 1 - smooth((scene.blend - .12) / .38);
  const incoming = scene.next === scene.index ? 0 : smooth((scene.blend - .5) / .38);
  return { ...scene, layers: [
    { index: scene.index, frame: clipFrame(scene.index, scene.progress), opacity: outgoing },
    { index: scene.next, frame: clipFrame(scene.next, scene.progress), opacity: incoming }
  ] };
}
