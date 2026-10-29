const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export const INK_OPENING_TIMING = Object.freeze({
  minimumLoading: 1500,
  maximumLoading: 5500,
  completeHold: 160,
  stamp: 300,
  stampHold: 380,
  ripple: 1950,
  reveal: 2950
});

export function shouldPlayInkOpening({ reducedMotion = false, hash = '', scrollPosition = 0, navigationType = 'navigate' } = {}) {
  return !reducedMotion && (!hash || hash === '#top') && scrollPosition < 8 && navigationType !== 'back_forward';
}

// The completed enso stays open around the seal. A short press leaves its ink
// impression before the same center sends the ripple through the page.
export function inkOpeningFrame(milliseconds, width, height, reducedMotion = false) {
  const time = Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0);
  const { stamp, stampHold, ripple, reveal } = INK_OPENING_TIMING;
  const bloomStart = stamp + stampHold, total = bloomStart + reveal;
  const press = clamp(time / stamp);
  const bloom = reducedMotion ? 1 : clamp((time - bloomStart) / reveal);
  const rippleProgress = reducedMotion ? 1 : clamp((time - bloomStart) / ripple);
  const done = reducedMotion || time >= total;
  return {
    phase: done ? 'complete' : time < stamp ? 'stamp' : time < bloomStart ? 'seal' : rippleProgress < 1 ? 'bloom' : 'focus',
    done, bloom, rippleProgress, rippleAge: rippleProgress * ripple / 1000,
    rippleDuration: ripple / 1000, revealDuration: reveal / 1000,
    ringRadius: 72,
    ringOpacity: 1 - smooth(rippleProgress / .27),
    sealOpacity: smooth(press / .32) * (1 - smooth(rippleProgress / .2)),
    sealScale: press < .48 ? 1.18 - .22 * smooth(press / .48) : .96 + .04 * smooth((press - .48) / .52),
    sealOffsetY: 7 * (smooth(press / .48) - 1),
    // The wave and focus start together at the completed seal. Refraction ends
    // after 1.95 s; the same continuous blur easing settles one second later.
    blur: done ? 0 : 26 * (1 - smooth(bloom)),
    coverBlur: done ? 0 : 12 * smooth(bloom / .22),
    zoom: 1,
    // The cover dissolves uniformly. Canvas UI is the sole expanding ripple;
    // there is no second circular aperture or magnification underneath it.
    washOpacity: done ? 0 : 1 - smooth(bloom / .22),
    labelOpacity: 1 - smooth(time / (stamp * .9))
  };
}
