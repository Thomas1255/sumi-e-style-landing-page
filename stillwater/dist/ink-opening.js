import { INK_OPENING_TIMING, inkOpeningFrame, shouldPlayInkOpening } from './ink-opening-model.js';
import { paintInkOpening } from './ink-opening-paint.js';
import { setCanvasRipple } from './canvas-ripple.js';

export function openingMediaReady(media, timeout = 4200) {
  if (!media || media.readyState >= 2 || media.error) return Promise.resolve();
  return new Promise(resolve => {
    const finish = () => { clearTimeout(timer); media.removeEventListener('loadeddata', finish); media.removeEventListener('error', finish); resolve(); };
    const timer = setTimeout(finish, timeout);
    media.addEventListener('loadeddata', finish, { once: true });
    media.addEventListener('error', finish, { once: true });
  });
}

export function mountInkOpening({ onRippleFrame = () => {} } = {}) {
  const html = document.documentElement, root = document.querySelector('#ink-opening');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = root?.querySelector('canvas'), context = canvas?.getContext('2d');
  const enabled = shouldPlayInkOpening({ reducedMotion: reduced.matches, hash: location.hash, scrollPosition: scrollY, navigationType: performance.getEntriesByType('navigation')[0]?.type });
  const noop = { waitFor(promises) { return Promise.allSettled(promises); }, destroy() {} };
  if (!root || !context || !enabled) {
    html.classList.remove('ink-opening-pending', 'ink-revealing');
    if (root) { root.hidden = true; root.dataset.phase = 'skipped'; }
    return noop;
  }
  const label = root.querySelector('.ink-opening-label');
  const caption = root.querySelector('[role=status]'), progressBar = root.querySelector('[role=progressbar]');
  const skip = root.querySelector('button');
  const content = [...document.querySelectorAll('.skip-link,.site-header,#flight-story,.flight-controls')].map(element => ({ element, wasInert: element.inert }));
  content.forEach(({element}) => { element.inert = true; });
  html.classList.add('ink-opening-pending');
  root.hidden = false; root.dataset.phase = 'loading';
  let disposed = false, raf = 0, width = 1, height = 1;
  let assetProgress = 0, shownProgress = 0, transitionStart = null, fullSince = null;
  let started = false, lastPhase = 'loading', lastPercent = -1, rippleActive = false;
  const mountedAt = performance.now();
  let lastTime = mountedAt;

  function finish(reason = 'complete') {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(raf); clearTimeout(safety);
    setCanvasRipple();
    const hadFocus = root.contains(document.activeElement);
    html.classList.remove('ink-opening-pending', 'ink-revealing');
    html.style.removeProperty('--ink-reveal-blur'); html.style.removeProperty('--ink-reveal-scale');
    html.style.removeProperty('--ink-cover-blur');
    root.hidden = true; root.dataset.phase = reason;
    try { onRippleFrame(); } catch { /* A failed renderer must not block input release. */ }
    content.forEach(({element,wasInert}) => { element.inert = wasInert; });
    removeEventListener('resize', resize);
    removeEventListener('keydown', onKey);
    removeEventListener('pagehide', onPageHide);
    removeEventListener('ink-opening-timeout', onTimeout);
    reduced.removeEventListener('change', onMotion);
    skip.removeEventListener('click', onSkip);
    if (hadFocus) document.querySelector('.brand')?.focus({ preventScroll: true });
    dispatchEvent(new Event('resize'));
  }
  function onSkip() { finish('skipped'); }
  function onKey(event) { if (event.key === 'Escape') onSkip(); }
  function onPageHide() { finish('restored'); }
  function onTimeout() { finish('timeout'); }
  function onMotion(event) { if (event.matches) finish('reduced-motion'); }

  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function tick(now) {
    if (disposed) return;
    try {
      // Exponential easing is stable for any elapsed time. Capping this delta
      // makes a throttled tab lag behind its real asset progress until timeout.
      const dt = Math.max(0, now - lastTime); lastTime = now;
      if (transitionStart === null) {
        const elapsed = now - mountedAt;
        if (elapsed >= INK_OPENING_TIMING.maximumLoading) assetProgress = 1;
        const t = Math.min(1, elapsed / INK_OPENING_TIMING.minimumLoading), minimumArc = t*t*(3-2*t);
        const desired = Math.min(assetProgress, minimumArc);
        shownProgress += (desired - shownProgress) * (1 - Math.exp(-dt / 115));
        const percent = Math.round(shownProgress * 100);
        if (percent !== lastPercent) { progressBar.setAttribute('aria-valuenow', String(percent)); lastPercent = percent; }
        paintInkOpening(context, width, height, { loading: true, progress: shownProgress });
        if (assetProgress === 1 && shownProgress >= .997) {
          fullSince ??= now;
          if (now - fullSince >= INK_OPENING_TIMING.completeHold) {
            transitionStart = now; shownProgress = 1;
            progressBar.setAttribute('aria-valuenow', '100');
            caption.textContent = 'A world in ink and water';
          }
        }
      } else {
        const frame = inkOpeningFrame(now - transitionStart, width, height);
        const wasRippleActive = rippleActive;
        rippleActive = setCanvasRipple(frame, width, height);
        if (frame.phase !== lastPhase) {
          root.dataset.phase = frame.phase; lastPhase = frame.phase;
          if (frame.phase === 'stamp') caption.textContent = 'Sealed in ink';
          if (frame.phase === 'bloom') { html.classList.add('ink-revealing'); caption.textContent = 'The sky opens'; }
          if (frame.phase === 'focus') { html.classList.add('ink-revealing'); caption.textContent = 'Settling into focus'; }
        }
        label.style.opacity = String(frame.labelOpacity);
        html.style.setProperty('--ink-reveal-blur', `${frame.blur.toFixed(2)}px`);
        html.style.setProperty('--ink-cover-blur', `${frame.coverBlur.toFixed(2)}px`);
        html.style.setProperty('--ink-reveal-scale', frame.zoom.toFixed(5));
        paintInkOpening(context, width, height, { frame });
        if (rippleActive || wasRippleActive) onRippleFrame();
        if (frame.done) { finish(); return; }
      }
      raf = requestAnimationFrame(tick);
    } catch { finish('fallback'); }
  }
  const safety = setTimeout(onTimeout, 11000);
  skip.addEventListener('click', onSkip);
  addEventListener('keydown', onKey);
  addEventListener('resize', resize, { passive: true });
  addEventListener('pagehide', onPageHide);
  addEventListener('ink-opening-timeout', onTimeout);
  reduced.addEventListener('change', onMotion);
  resize(); raf = requestAnimationFrame(tick);
  return {
    waitFor(promises) {
      if (started || disposed) { void Promise.allSettled(promises); return; }
      started = true;
      if (!promises.length) { assetProgress = 1; return; }
      let completed = 0;
      for (const promise of promises) Promise.resolve(promise).then(settled, settled);
      function settled() { if (!disposed) assetProgress = ++completed / promises.length; }
    },
    destroy() { finish('destroyed'); }
  };
}
