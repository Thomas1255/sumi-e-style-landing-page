import { createClouds } from './clouds.js';
import { sceneCloudStrength } from './flight-timeline.js';

// Gentle ambient clouds use the supplied settings; scene changes swell the same field.
export const CLOUD_OPTIONS = Object.freeze({
  scale: 1,
  speed: .6,
  cover: .1,
  density: 2.5,
  shading: .1,
  opacity: .28,
  shadow: .06,
  shadowOffsetX: 200,
  shadowOffsetY: -10,
  shadowSoftness: 1,
  wind: .6,
  windRadius: 350,
  refraction: 0,
  fogBlur: 0,
  color: 'auto'
});

export function mountPageClouds(output) {
  if (!output) return null;
  const smallScreen = matchMedia('(max-width: 650px)');
  const source = document.createElement('canvas');
  const fallback = document.createElement('div');
  fallback.className = 'scene-cloud-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  output.after(fallback);
  let instance = null;
  let contextLost = false;
  let disposed = false;
  let progress = 0, reducedMotion = false;
  const quality = () => smallScreen.matches ? .5 : .8;

  function syncTransition() {
    const strength = sceneCloudStrength(progress, reducedMotion);
    instance?.setOptions({
      transition: strength,
      opacity: CLOUD_OPTIONS.opacity + (.985 - CLOUD_OPTIONS.opacity) * strength,
      cover: CLOUD_OPTIONS.cover + .28 * strength,
      wind: CLOUD_OPTIONS.wind * (1 - .94 * strength)
    });
    output.dataset.cloudTransition = strength.toFixed(6);
    fallback.style.opacity = String(instance && !contextLost ? 0 : strength * .96);
  }

  function start() {
    if (disposed || contextLost || instance) return;
    output.hidden = false;
    try {
      instance = createClouds({ source, content: document.documentElement, output }, {
        ...CLOUD_OPTIONS,
        quality: quality()
      });
      output.dataset.cloudState = instance ? 'active' : 'unavailable';
      output.hidden = !instance;
    } catch {
      output.dataset.cloudState = 'unavailable';
      output.hidden = true;
    }
    syncTransition();
  }

  function stop() {
    instance?.destroy();
    instance = null;
  }
  function resizeQuality() { instance?.setOptions({ quality: quality() }); }
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    stop();
    output.dataset.cloudState = 'context-lost';
    syncTransition();
  }
  function onContextRestored() {
    contextLost = false;
    start();
  }
  function onPageHide() { stop(); }
  function onPageShow() { start(); }

  output.addEventListener('webglcontextlost', onContextLost);
  output.addEventListener('webglcontextrestored', onContextRestored);
  smallScreen.addEventListener('change', resizeQuality);
  addEventListener('pagehide', onPageHide);
  addEventListener('pageshow', onPageShow);
  start();

  return {
    setProgress(next, reduced = false) {
      progress = next;
      reducedMotion = reduced;
      syncTransition();
    },
    destroy() {
      disposed = true;
      stop();
      output.removeEventListener('webglcontextlost', onContextLost);
      output.removeEventListener('webglcontextrestored', onContextRestored);
      smallScreen.removeEventListener('change', resizeQuality);
      removeEventListener('pagehide', onPageHide);
      removeEventListener('pageshow', onPageShow);
      output.hidden = true;
      fallback.remove();
    }
  };
}
