# Interactive clouds

Adapted from the standalone Canvas UI Clouds source supplied by the user. The WebGL2 noise, wind-trail, shading, and compositing shaders are kept in `dist/clouds.js`; `dist/page-clouds.js` mounts the renderer over the existing page without adding React or changing the scroll structure.

Ambient clouds use scale 1, speed 0.6, cover 0.1, density 2.5, shading 0.1, opacity 0.28, shadow 0.06, wind 0.6, and cursor radius 350 px. Cloud color resolves to the page's warm paper background. Internal field resolution adapts to desktop and mobile screens.

The ambient Canvas UI field stays gentle. Scene transitions use 24 independent transparent sumi-e PNGs in `dist/ink-clouds.js`: the six original opening paintings and three newly approved sets of six layers. River mist ribbons cover wetlands to village; warm temple volutes cover village to autumn temples; cool mountain plumes cover temples to the overhead gorge. Each set has separate left and right rear, middle and foreground paintings, never mirrored or reused between transitions.

The page starts fully covered by the original opening clouds, then parts them over the first 5% of the scroll. Each later transition spans 20% of the journey around the landscape's perspective cut, with staggered entrances, a closed hold and staggered exits. Every set has its own overlap, scale, wind drift and order. All positions depend only on scroll progress, so stopping holds the clouds and reversing retraces the same composition. Header and footer controls remain above the clouds and the overlay never captures input.

Separate preloaded image banks prevent URL swaps or artwork flashes when jumping or reversing between scenes. Only the current six planes are visible and request compositor promotion. A warm paper veil covers a pending or failed bank; opening decode completion removes the initial loading cover independently of later banks. PNG transitions remain available when ambient WebGL is unavailable. Reduced motion disables transitions and reveals the page immediately.

The supplied configuration sets refraction and fogBlur to zero. The integration therefore uses the standard overlay rendering path and keeps text and controls in the native DOM, without relying on experimental HTML-in-canvas capture. The fog canvas ignores pointer events, so links, flight scrubbing, and touch scrolling continue to work. Header and footer controls remain above the mist.

Reduced-motion preferences freeze the cloud drift. Context restoration and browser history restoration recreate the renderer as needed; unsupported WebGL leaves the existing landscape visible.

Browser verification covers all three artwork banks, the closed opening, clear passages, desktop/mobile layouts and identical forward/reverse cloud transforms. Build checks validate all 24 PNGs, their unique content hashes, original aspect ratios, transparency, scene assignment and staggered reversible motion. Compositing the actual PNG alpha at 2 CSS pixel intervals confirms at least 98% opacity at every sampled point through the closed hold at 1280×720, 390×844 and 2560×1080. Artwork originals, exact generation prompts and approval records remain in `art-previews/sumi-cloud-transition-sets-v3/`.
