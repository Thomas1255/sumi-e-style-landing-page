// Canvas UI Ripple: supplied wave derivative, damping, refraction, dispersion
// and crest lighting, adapted to the site's existing live WebGL surfaces.
// One opening splash is driven by the opening clock; no pointer/ambient loop.
export const CANVAS_RIPPLE_OPTIONS = Object.freeze({ amplitude: .5, speed: .65, wavelength: 80, rings: 2, decay: 1, refraction: 100, dispersion: .5, shine: .5 });
const OFF = Object.freeze({ x: 0, y: 0, age: 0, amplitude: 0 });
let current = OFF;

export function canvasRippleGeometry(width, height, duration = 1.95) {
  const radius = Math.hypot(Math.max(1, width), Math.max(1, height)) / 2;
  const wavelength = Math.max(CANVAS_RIPPLE_OPTIONS.wavelength, radius * .22);
  const bandWidth = wavelength * CANVAS_RIPPLE_OPTIONS.rings * .5;
  // The original demo speed leaves a splash confined near the center during
  // this short opening. Fit the wave train to the farthest viewport corner,
  // then let its trailing crests leave the screen before the final fade.
  const speed = Math.max(340 * CANVAS_RIPPLE_OPTIONS.speed, (radius + 2 * bandWidth) / (Math.max(.1, duration) * .88));
  return { radius, wavelength, bandWidth, speed };
}

export function setCanvasRipple(frame = null, width = 0, height = 0) {
  const end = frame ? Math.max(0, Math.min(1, (frame.bloom - .9) / .1)) : 1;
  current = frame && frame.bloom > 0 && !frame.done ? {
    x: width / 2, y: height / 2, age: frame.rippleAge,
    ...canvasRippleGeometry(width, height, frame.revealDuration),
    amplitude: CANVAS_RIPPLE_OPTIONS.amplitude * (1 - end * end * (3 - 2 * end))
  } : OFF;
}
export function canvasRippleState() { return { ...current }; }

// gl_FragCoord maps each independently positioned canvas into the same viewport
// coordinates. This keeps the cloth, film and landscape on one water surface.
export const CANVAS_RIPPLE_GLSL = `
uniform vec4 uCanvasRipple;
uniform vec4 uCanvasRippleViewport;
uniform vec2 uCanvasRipplePixels;
uniform vec4 uCanvasRippleWave;
uniform vec3 uCanvasRippleOpt;

vec2 canvasRippleGradient() {
  if (uCanvasRipple.w <= 0.0) return vec2(0.0);
  vec2 p = vec2(gl_FragCoord.x, uCanvasRipplePixels.y - gl_FragCoord.y) / uCanvasRipplePixels;
  vec2 frag = uCanvasRippleViewport.xy + p * uCanvasRippleViewport.zw;
  vec2 dv = frag - uCanvasRipple.xy;
  float r = length(dv);
  float front = uCanvasRippleWave.x * uCanvasRipple.z;
  float s = r - front;
  float k = 6.28318530718 / uCanvasRippleWave.y;
  float w2 = uCanvasRippleWave.z * uCanvasRippleWave.z;
  float env = exp(-s * s / w2) * exp(-uCanvasRippleWave.w * uCanvasRipple.z) * uCanvasRipple.w;
  env *= smoothstep(0.0, 0.08, uCanvasRipple.z);
  env *= inversesqrt(1.0 + front / max(uCanvasRippleWave.y, 1.0) * 0.2);
  if (env < 0.0015) return vec2(0.0);
  float dh = (k * cos(s * k) - 2.0 * s / w2 * sin(s * k)) * env;
  return dv / max(r, 1.0) * dh * uCanvasRippleWave.y * 0.16;
}
vec2 canvasRippleUv(vec2 uv, vec2 grad, vec2 size, float channel) {
  if (uCanvasRipple.w <= 0.0) return uv;
  return uv + grad * uCanvasRippleOpt.x / max(size, vec2(1.0)) * channel;
}
float canvasRippleDispersion() {
  return uCanvasRipple.w > 0.0 ? uCanvasRippleOpt.y * 0.35 : 0.0;
}
vec3 canvasRippleLight(vec3 color, vec2 grad) {
  float g = dot(grad, vec2(-0.55, -0.8));
  float glint = pow(clamp(g * 2.2, 0.0, 1.0), 2.0) * uCanvasRippleOpt.z;
  float shade = pow(clamp(-g * 1.6, 0.0, 1.0), 2.0) * uCanvasRippleOpt.z * 0.3;
  return (color + glint) * (1.0 - shade);
}`;

export function bindCanvasRipple(gl, program, canvas) {
  const loc = Object.fromEntries(['uCanvasRipple', 'uCanvasRippleViewport', 'uCanvasRipplePixels', 'uCanvasRippleWave', 'uCanvasRippleOpt'].map(name => [name, gl.getUniformLocation(program, name)]));
  return () => {
    const wave = current;
    gl.uniform4f(loc.uCanvasRipple, wave.x, wave.y, wave.age, wave.amplitude);
    if (wave.amplitude <= 0) return;
    const rect = canvas.getBoundingClientRect(), options = CANVAS_RIPPLE_OPTIONS;
    gl.uniform4f(loc.uCanvasRippleViewport, rect.left, rect.top, Math.max(rect.width, 1), Math.max(rect.height, 1));
    gl.uniform2f(loc.uCanvasRipplePixels, canvas.width, canvas.height);
    gl.uniform4f(loc.uCanvasRippleWave, wave.speed, wave.wavelength, wave.bandWidth, options.decay);
    gl.uniform3f(loc.uCanvasRippleOpt, options.refraction, options.dispersion, options.shine);
  };
}
