const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export const INK_OPENING_TIMING = Object.freeze({
  minimumLoading: 1500,
  maximumLoading: 5500,
  completeHold: 160,
  stamp: 300,
  stampHold: 380,
  reveal: 1950
});

export function shouldPlayInkOpening({ reducedMotion = false, hash = '', scrollPosition = 0, navigationType = 'navigate' } = {}) {
  return !reducedMotion && (!hash || hash === '#top') && scrollPosition < 8 && navigationType !== 'back_forward';
}

// The completed enso stays open around the seal. A short press leaves its ink
// impression before the same center sends the ripple through the page.
export function inkOpeningFrame(milliseconds, width, height, reducedMotion = false) {
  const time = Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0);
  const { stamp, stampHold, reveal } = INK_OPENING_TIMING;
  const bloomStart = stamp + stampHold, total = bloomStart + reveal;
  const press = clamp(time / stamp);
  const bloom = reducedMotion ? 1 : clamp((time - bloomStart) / reveal);
  const spread = 1 - Math.pow(1 - bloom, 2.6);
  const feather = Math.min(110, Math.max(38, Math.min(width, height) * .12));
  const maxRadius = Math.hypot(width, height) / 2 + feather * 2;
  const done = reducedMotion || time >= total;
  return {
    phase: done ? 'complete' : time < stamp ? 'stamp' : time < bloomStart ? 'seal' : 'bloom',
    done, bloom, rippleAge: bloom * reveal / 1000,
    ringRadius: 72,
    ringOpacity: 1 - smooth(bloom / .27),
    sealOpacity: smooth(press / .32) * (1 - smooth(bloom / .2)),
    sealScale: press < .48 ? 1.18 - .22 * smooth(press / .48) : .96 + .04 * smooth((press - .48) / .52),
    sealOffsetY: 7 * (smooth(press / .48) - 1),
    radius: maxRadius * spread,
    feather,
    blur: done ? 0 : 26 * (1 - smooth((bloom - .06) / .86)),
    zoom: done ? 1 : 1 + .035 * (1 - smooth(bloom)),
    washOpacity: done ? 0 : 1 - smooth((bloom - .88) / .12),
    labelOpacity: 1 - smooth(time / (stamp * .9))
  };
}
