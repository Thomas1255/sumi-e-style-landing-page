# Interactive clouds

Adapted from the standalone Canvas UI Clouds source supplied by the user. The WebGL2 noise, wind-trail, shading, and compositing shaders are kept in `dist/clouds.js`; `dist/page-clouds.js` mounts the renderer over the existing page without adding React or changing the scroll structure.

Ambient clouds use scale 1, speed 0.6, cover 0.1, density 2.5, shading 0.1, opacity 0.28, shadow 0.06, wind 0.6, and cursor radius 350 px. Cloud color resolves to the page's warm paper background. Internal field resolution adapts to desktop and mobile screens.

At each of the three scene changes, the same Canvas UI cloud field swells over the terrain, cranes and cloth. Its opacity reaches 0.985, coverage increases, and a 95% minimum mist density closes gaps across the viewport at the midpoint. Noise and shading remain visible in the dense wash. Cursor wind weakens during the transition so it cannot open a large hole over a perspective cut. Header and footer controls remain above the clouds and the overlay never captures input.

`sceneCloudStrength` shares the landscape's transition timeline. The dense center spans the angle change; scrolling onward clears the clouds, scrolling back reverses the envelope, and stopping holds the coverage while ambient cloud drift continues. Reduced motion disables the wash and freezes the landscape. A warm CSS mist veil provides the transition if WebGL2 is unavailable or its context is lost.

The supplied configuration sets refraction and fogBlur to zero. The integration therefore uses the standard overlay rendering path and keeps text and controls in the native DOM, without relying on experimental HTML-in-canvas capture. The fog canvas ignores pointer events, so links, flight scrubbing, and touch scrolling continue to work. Header and footer controls remain above the mist.

Reduced-motion preferences freeze the cloud drift. Context restoration and browser history restoration recreate the renderer as needed; unsupported WebGL leaves the existing landscape visible.

Browser verification checks cloud drift, pointer wind trails, unchanged crane pose while the fog moves, scroll controls, and desktop/mobile layout.
