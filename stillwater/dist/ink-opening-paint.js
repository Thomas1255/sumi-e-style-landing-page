const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const grain = seed => { const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
const circles = new WeakMap();
const BRUSH_START = 2.04, BRUSH_SPAN = TAU - .73;
const mix = (a, b, t) => a + (b - a) * t;
function paperHash(x, y) {
  let value = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}
function paperNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  return mix(mix(paperHash(ix, iy), paperHash(ix + 1, iy), fx), mix(paperHash(ix, iy + 1), paperHash(ix + 1, iy + 1), fx), fy);
}

// A dense ink body carries the stroke. Texture is confined to the thin edge
// and trailing bristles; fixed coordinates keep those details still in motion.
function paintBrushTexture(context, size, extent, radius, density) {
  const pixels = context.createImageData(size, size);
  const data = pixels.data;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = (px + .5) / density - extent, dy = ((py + .5) / density - extent) / 1.025;
      const distance = Math.hypot(dx, dy) / radius;
      if (distance < .62 || distance > 1.4) continue;
      const angle = Math.atan2(dy, dx);
      let arc = (angle - BRUSH_START + TAU * 2) % TAU;
      if (arc > TAU - .36) arc -= TAU;
      const t = arc / BRUSH_SPAN;
      if (t < -.065 || t > 1.01) continue;
      // Keep the subtle edge and pigment variation independent of pixel density.
      const x = dx * 72 / radius + 137, y = dy * 72 / radius + 231;
      const cloud = paperNoise(x * .13, y * .13);
      const edge = (paperNoise(x * .52, y * .52) - .5) * .035 + (paperNoise(x * 1.7, y * 1.7) - .5) * .012;
      const center = 1 + .014 * Math.sin(angle * 3) + .009 * Math.sin(angle * 7 + .8);
      const travel = clamp(t);
      const pressure = (1.2 - .38 * travel + .13 * Math.sin(travel * TAU + .4)) * (1 - .96 * smooth((travel - .82) / .18));
      const halfWidth = .205 * pressure;
      const across = (distance - center) / halfWidth;
      const heel = t < 0 ? t / (.046 + .012 * cloud) : 0;
      const outline = Math.hypot(across, heel);
      let coverage = clamp((1 - outline + edge) / .045);
      if (!coverage) continue;
      // Only the light finishing stroke splits into long, flowing bristles.
      // The wet body stays solid: no stippling or pore mask through its center.
      const dry = smooth((t - .53) / .23);
      const rake = .24 + .035 * Math.sin(t * 14 + .4) + (paperNoise(t * 12, 2) - .5) * .04;
      const lane = .045 + paperNoise(t * 16, 7) * .025;
      coverage *= 1 - dry * clamp((lane - Math.abs(across - rake)) / .035);
      const outerRake = .70 + .025 * Math.sin(t * 19);
      coverage *= 1 - dry * .9 * clamp((.035 - Math.abs(across - outerRake)) / .025);
      const bristles = paperNoise(across * 9 + .18 * Math.sin(t * 9), t * .8);
      coverage *= 1 - smooth((t - .84) / .16) * smooth((bristles - .58) / .18);
      const pigment = .985 + .015 * cloud;
      const index = (py * size + px) * 4;
      const shade = Math.round(18 + (1 - cloud) * 4);
      data[index] = shade; data[index + 1] = shade; data[index + 2] = shade - 2;
      data[index + 3] = Math.round(255 * coverage * pigment);
    }
  }
  context.putImageData(pixels, 0, 0);
}

// Smooth, broad pigment at the lower-left start, restrained brush edges and
// a split, tapering finish around an open lower gap.
// No pixels from a supplied reference are used or loaded by the page.
export function paintInkCircle(context, x, y, radius, progress, opacity = 1) {
  if (progress <= 0 || opacity <= 0) return;
  const density = Math.min(2, Math.max(1, Math.abs(context.getTransform?.()?.a || 1)));
  let brush = circles.get(context);
  if (!brush || brush.radius !== radius || brush.density !== density) {
    const extent = Math.ceil(radius * 1.42), size = Math.ceil(extent * 2 * density);
    let canvas = context.canvas?.ownerDocument?.createElement('canvas') ?? (typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(size, size) : null);
    // Native canvas implementations can also render local artwork studies.
    if (!canvas && typeof context.canvas?.getContext === 'function') {
      try { canvas = new context.canvas.constructor(size, size); } catch { /* Use geometry fallback. */ }
    }
    if (canvas) {
      canvas.width = canvas.height = size;
      const ink = canvas.getContext('2d');
      if (ink) {
        paintBrushTexture(ink, size, extent, radius, density);
        brush = { canvas, radius, density, extent }; circles.set(context, brush);
      }
    }
  }
  // Bake the bristle geometry once per display density. Advancing the painted
  // arc only clips this small transparent canvas, leaving the page renderer free.
  if (!brush || brush.radius !== radius || brush.density !== density) return paintBrush(context, x, y, radius, progress, opacity);
  context.save(); context.globalAlpha *= opacity;
  if (progress < 1) {
    context.beginPath(); context.moveTo(x, y);
    context.arc(x, y, radius * 1.5, BRUSH_START - .065 * BRUSH_SPAN, BRUSH_START + clamp(progress) * BRUSH_SPAN);
    context.closePath(); context.clip();
  }
  context.drawImage(brush.canvas, x - brush.extent, y - brush.extent, brush.extent * 2, brush.extent * 2);
  context.restore();
}

function paintBrush(context, x, y, radius, progress, opacity) {
  const end = clamp(progress);
  if (end <= 0 || opacity <= 0) return;
  context.save();
  context.lineCap = 'round'; context.lineJoin = 'round';
  const steps = 330, tracks = 76, start = BRUSH_START, span = BRUSH_SPAN;
  for (let bristle = 0; bristle < tracks; bristle++) {
    const across = bristle / (tracks - 1) * 2 - 1;
    const offset = across * radius * .2;
    const ink = .7 + grain(bristle + 4) * .25;
    context.strokeStyle = `rgba(28,29,27,${opacity * ink})`;
    context.lineWidth = radius * (.009 + grain(bristle + 61) * .008);
    context.beginPath();
    let connected = false;
    const tip = 1 - grain(bristle + 23) * .07;
    const heel = -.033 * Math.sqrt(1 - across * across) + grain(bristle + 8) * .004;
    for (let step = -11; step <= Math.ceil(end * steps); step++) {
      const t = Math.min(end, step / steps), a = start + t * span;
      const channel = ((bristle >= 44 && bristle <= 48) || (bristle >= 60 && bristle <= 62)) && t > .18 && t < .92;
      const broken = t > .82 && grain(bristle * 79 + Math.floor(t * 100)) > .79;
      if (t < heel || t > tip || channel || broken) { connected = false; continue; }
      const pressure = (1.14 - .34 * t + .13 * Math.sin(a * 1.8)) * (1 - .74 * smooth((t - .86) / .14));
      const wobble = radius * (.009 * Math.sin(a * 3) + .004 * Math.sin(a * 13 + bristle * .12));
      const r = radius + offset * pressure + wobble + radius * .003 * Math.sin(a * 67 + bristle * 3);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 1.025;
      if (connected) context.lineTo(px, py); else context.moveTo(px, py);
      connected = true;
    }
    context.stroke();
  }
  // Sparse pigment caught by the paper, fixed across frames rather than noise.
  for (let i = 0; i < 420; i++) {
    const t = grain(i + 100), a = start + t * span;
    if (t > end) continue;
    const pressure = (1.14 - .34 * t + .13 * Math.sin(a * 1.8)) * (1 - .74 * smooth((t - .86) / .14));
    const r = radius + (i % 2 ? -1 : 1) * radius * (.2 * pressure + grain(i + 9) * .026);
    context.fillStyle = `rgba(31,32,29,${opacity * (.12 + grain(i + 7) * .38)})`;
    const size = radius * (.003 + grain(i + 17) * .007);
    context.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r * 1.025, size, size);
  }
  context.restore();
}

export function paintInkSeal(context, x, y, scale = 1, opacity = 1) {
  if (opacity <= 0) return;
  context.save(); context.translate(x, y); context.rotate(-.052); context.scale(scale, scale);
  context.globalAlpha *= opacity;
  context.fillStyle = '#a84d3a';
  context.beginPath(); context.moveTo(-28, -33); context.lineTo(28, -32);
  context.lineTo(29, 32); context.lineTo(-27, 33); context.closePath(); context.fill();
  context.strokeStyle = '#ead8bf'; context.lineWidth = .9;
  context.strokeRect(-24, -29, 48, 58);
  context.fillStyle = '#f1ecdf';
  context.font = '46px "Yu Mincho", "SimSun", "Noto Serif CJK SC", serif';
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText('水', 0, 2, 47);
  // Tiny uninked fibers make the impression feel pressed onto washi.
  context.fillStyle = '#f1ecdf';
  for (let i = 0; i < 85; i++) {
    context.globalAlpha = opacity * (.12 + grain(i + 3) * .34);
    context.fillRect(-27 + grain(i + 19) * 54, -32 + grain(i + 73) * 64, .35 + grain(i + 28) * .8, .4 + grain(i + 2));
  }
  context.restore();
}

export function paintInkOpening(context, width, height, { loading = false, progress = 0, frame = null } = {}) {
  const x = width / 2, y = height / 2;
  context.clearRect(0, 0, width, height);
  if (frame?.done) return;
  context.save();
  context.globalAlpha = frame?.washOpacity ?? 1;
  context.fillStyle = '#f1ecdf'; context.fillRect(0, 0, width, height);
  // Quiet washi fibers, fixed in place so loading does not look like noisy video.
  context.fillStyle = '#8c7c6110';
  for (let i = 0; i < 750; i++) {
    const px = ((i * 197 + 13) % 1009) / 1009 * width;
    const py = ((i * 131 + 71) % 997) / 997 * height;
    context.fillRect(px, py, .65, .65);
  }
  if (loading) {
    paintInkCircle(context, x, y, 72, progress, 1);
  } else if (frame) {
    paintInkCircle(context, x, y, frame.ringRadius, 1, frame.ringOpacity);
    if (frame.bloom > 0) {
      // Clear the paper from its center with a soft wet boundary. The real page
      // below this canvas is blurred independently, then settles into focus.
      const r = frame.radius, feather = Math.min(frame.feather, r * .65);
      context.save(); context.globalCompositeOperation = 'destination-out';
      const gradient = context.createRadialGradient(x, y, Math.max(0, r - feather), x, y, Math.max(1, r + feather));
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(.58, 'rgba(0,0,0,.86)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = gradient; context.fillRect(0, 0, width, height); context.restore();
      for (const [index, ripple] of frame.ripples.entries()) {
        if (ripple.radius < 2 || ripple.opacity <= 0) continue;
        context.save(); context.globalAlpha = ripple.opacity;
        context.strokeStyle = index ? '#798b7c' : '#5c716b';
        context.lineWidth = index ? .8 : 1.35;
        context.shadowColor = '#8c9c8b'; context.shadowBlur = 10 + index * 4;
        context.beginPath();
        for (let step = 0; step <= 140; step++) {
          const a = step / 140 * TAU;
          const wobble = 1 + .006 * Math.sin(a * 5 + index) + .003 * Math.sin(a * 11);
          const px = x + Math.cos(a) * ripple.radius * wobble;
          const py = y + Math.sin(a) * ripple.radius * wobble;
          if (step) context.lineTo(px, py); else context.moveTo(px, py);
        }
        context.closePath(); context.stroke(); context.restore();
      }
    }
    paintInkSeal(context, x, y + frame.sealOffsetY, frame.sealScale, frame.sealOpacity);
  }
  context.restore();
}
