import { createClouds } from './clouds.js';

// The visual settings supplied with Canvas UI Clouds. Only render resolution
// adapts to screen size; drift, coverage, color, and cursor wind stay consistent.
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
  let instance = null;
  let contextLost = false;
  let disposed = false;
  const quality = () => smallScreen.matches ? .5 : .8;

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
    destroy() {
      disposed = true;
      stop();
      output.removeEventListener('webglcontextlost', onContextLost);
      output.removeEventListener('webglcontextrestored', onContextRestored);
      smallScreen.removeEventListener('change', resizeQuality);
      removeEventListener('pagehide', onPageHide);
      removeEventListener('pageshow', onPageShow);
      output.hidden = true;
    }
  };
}
