# Interactive clouds

Adapted from the standalone Canvas UI Clouds source supplied by the user. The WebGL2 noise, wind-trail, shading, and compositing shaders are kept in `dist/clouds.js`; `dist/page-clouds.js` mounts the renderer over the existing page without adding React or changing the scroll structure.

The supplied visual settings are retained: scale 1, speed 0.6, cover 0.1, density 2.5, shading 0.1, opacity 0.64, shadow 0.06, wind 0.6, and cursor radius 350 px. Cloud color resolves to the page's warm paper background. Internal field resolution adapts to desktop and mobile screens.

The supplied configuration sets refraction and fogBlur to zero. The integration therefore uses the standard overlay rendering path and keeps text and controls in the native DOM, without relying on experimental HTML-in-canvas capture. The fog canvas ignores pointer events, so links, flight scrubbing, and touch scrolling continue to work. Header and footer controls remain above the mist.

Reduced-motion preferences freeze the cloud drift. Context restoration and browser history restoration recreate the renderer as needed; unsupported WebGL leaves the existing landscape visible.

Browser verification checks cloud drift, pointer wind trails, unchanged crane pose while the fog moves, scroll controls, and desktop/mobile layout.
