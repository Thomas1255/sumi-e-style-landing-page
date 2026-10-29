const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export const INK_OPENING_TIMING = Object.freeze({
  minimumLoading: 1500,
  maximumLoading: 5500,
  completeHold: 160,
  gather: 620,
  drop: 220,
  reveal: 1950
});

export function shouldPlayInkOpening({ reducedMotion = false, hash = '', scrollPosition = 0, navigationType = 'navigate' } = {}) {
  return !reducedMotion && (!hash || hash === '#top') && scrollPosition < 8 && navigationType !== 'back_forward';
}

// Time starts when the fully painted loading circle begins to gather into a drop.
// One continuous model keeps the drop, ripple, aperture and blur synchronized.
export function inkOpeningFrame(milliseconds, width, height, reducedMotion = false) {
  const time = Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0);
  const { gather, drop, reveal } = INK_OPENING_TIMING;
  const bloomStart = gather + drop, total = bloomStart + reveal;
  const morph = smooth(time / gather);
  const bloom = reducedMotion ? 1 : clamp((time - bloomStart) / reveal);
  const spread = 1 - Math.pow(1 - bloom, 2.6);
  const feather = Math.min(110, Math.max(38, Math.min(width, height) * .12));
  const maxRadius = Math.hypot(width, height) / 2 + feather * 2;
  const done = reducedMotion || time >= total;
  return {
    phase: done ? 'complete' : time < gather ? 'gather' : time < bloomStart ? 'drop' : 'bloom',
    done, morph, bloom,
    ringRadius: 54 * Math.pow(1 - morph, 1.8) + 3 * morph,
    ringOpacity: 1 - smooth((morph - .48) / .52),
    dropOpacity: smooth((morph - .35) / .5) * (1 - smooth(bloom / .15)),
    dropRadius: 5 + 1.2 * Math.sin(clamp((time - gather) / drop) * Math.PI),
    radius: maxRadius * spread,
    feather,
    blur: done ? 0 : 26 * (1 - smooth((bloom - .06) / .86)),
    zoom: done ? 1 : 1 + .035 * (1 - smooth(bloom)),
    washOpacity: done ? 0 : 1 - smooth((bloom - .88) / .12),
    labelOpacity: 1 - smooth(time / (gather * .62)),
    ripples: [0, .11, .24].map((delay, index) => {
      const age = clamp((bloom - delay) / (1 - delay));
      return { radius: maxRadius * (1 - Math.pow(1 - age, 2.6)), opacity: bloom > delay ? (1 - smooth(age)) * (.24 - index * .045) : 0 };
    })
  };
}
