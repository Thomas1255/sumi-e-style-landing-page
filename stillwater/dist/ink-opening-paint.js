const TAU = Math.PI * 2;

// Several uneven bristle tracks describe an enso. Their pigment and radius vary
// around the stroke; this is painted geometry rather than a rotating UI spinner.
export function paintInkCircle(context, x, y, radius, progress, opacity = 1) {
  const end = Math.max(0, Math.min(1, progress)) * (TAU - .025);
  if (end <= 0 || opacity <= 0) return;
  context.save();
  context.lineCap = 'round'; context.lineJoin = 'round';
  const steps = Math.max(2, Math.ceil(end * 34));
  // A wet pigment body gives the stroke weight; the finer bristles below leave
  // an irregular, drier edge rather than a thin mechanical progress ring.
  context.strokeStyle = `rgba(31,38,33,${opacity * .72})`;
  for (let step = 1; step <= steps; step++) {
    const a = step / steps * end - Math.PI * .57;
    const previous = (step - 1) / steps * end - Math.PI * .57;
    const weight = .65 + .3 * Math.sin(a * 1.2 + .6) + .12 * Math.sin(a * 4 + .2);
    context.lineWidth = Math.min(18, radius * .35) * weight;
    const r = radius + Math.min(1, radius / 25) * (1.2 * Math.sin(a * 3) + .6 * Math.sin(a * 11));
    const previousRadius = radius + Math.min(1, radius / 25) * (1.2 * Math.sin(previous * 3) + .6 * Math.sin(previous * 11));
    context.beginPath();
    context.moveTo(x + Math.cos(previous) * previousRadius * 1.035, y + Math.sin(previous) * previousRadius);
    context.lineTo(x + Math.cos(a) * r * 1.035, y + Math.sin(a) * r);
    context.stroke();
  }
  for (let bristle = 0; bristle < 24; bristle++) {
    const offset = (bristle / 23 - .5) * Math.min(18, radius * .35);
    context.strokeStyle = bristle % 5 === 0 ? `rgba(241,236,223,${opacity * .28})` : `rgba(38,46,42,${opacity * (.13 + .14 * (1 - Math.abs(bristle - 11.5) / 12))})`;
    context.lineWidth = (.55 + (bristle % 4) * .28) * Math.min(1, radius / 20);
    context.beginPath();
    for (let step = 0; step <= steps; step++) {
      const a = step / steps * end - Math.PI * .57;
      const grain = Math.sin(a * 7 + bristle * .28) * .8 + Math.sin(a * 19 + bristle) * .28;
      const r = radius + offset * (.67 + .3 * Math.sin(a * 1.4 + .3)) + grain * Math.min(1, radius / 25);
      const px = x + Math.cos(a) * r * 1.035, py = y + Math.sin(a) * r;
      if (step) context.lineTo(px, py); else context.moveTo(px, py);
    }
    context.stroke();
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
    paintInkCircle(context, x, y, 54, 1, .065);
    paintInkCircle(context, x, y, 54, progress, 1);
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
    if (frame.dropOpacity > 0) {
      context.save(); context.globalAlpha = frame.dropOpacity;
      context.translate(x, y); context.fillStyle = '#262e2a';
      const r = frame.dropRadius;
      context.beginPath(); context.moveTo(0, -r * 1.7);
      context.bezierCurveTo(r * .35, -r * .55, r * 1.12, -.15 * r, r, .6 * r);
      context.bezierCurveTo(r * .8, r * 1.65, -r * .95, r * 1.5, -r, .5 * r);
      context.bezierCurveTo(-r * 1.04, -.12 * r, -r * .25, -r * .7, 0, -r * 1.7);
      context.fill(); context.restore();
    }
  }
  context.restore();
}
