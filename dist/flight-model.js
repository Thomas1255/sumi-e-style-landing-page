export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = value => value * value * (3 - 2 * value);
const stops = [[0,.76,.53,.86],[.22,.75,.29,1.06],[.48,.29,.35,.91],[.72,.74,.27,1.03],[1,.83,.44,.7]];
// Scroll position is the sole clock: revisiting a position yields the same frame.
export function flightState(progress, reducedMotion = false) {
  const p = clamp(Number.isFinite(progress) ? progress : 0);
  const t = reducedMotion ? 0 : p;
  let a = stops[0], b = stops[1];
  for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0]) { a = stops[i]; b = stops[i+1]; }
  const segment = ease(clamp((t-a[0])/(b[0]-a[0])));
  const lerp = (x,y) => x+(y-x)*segment;
  const phase = t*Math.PI*2*9.5+.82;
  return { progress:p, camera:t, x:lerp(a[1],b[1]), y:lerp(a[2],b[2])+Math.sin(phase*2)*.006, scale:lerp(a[3],b[3]), wing:Math.sin(phase), farWing:Math.sin(phase+.16), pitch:Math.sin(t*Math.PI*3)*-.045, mist:t, frame:Math.round(t*359) };
}
