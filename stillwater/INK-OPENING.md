# Ink circle → seal stamp → ripple opening

The user chose the Ink Bloom direction and supplied local motion and brush-circle references. A Canvas UI water wave crosses the screen after the loading circle and vermilion stamp of the existing 水 logo. The whole page fades in and settles into focus behind that wave. Supplied references remain local; the page uses original procedural geometry and the existing brand character, with no reference pixels or remote media services.

## Sequence

1. A charcoal enso paints clockwise from its heavy lower-left start on warm washi. A smooth, nearly opaque ink body has gently uneven edges and a few flowing bristle channels confined to its tapered finish. The interior has no stippling or pore mask. Its progress follows four settled first-scene tasks: the opening landscape, crane poster, document fonts and first film frame (or its painted fallback). The minimum loading passage is 1.5 seconds; asset readiness never waits indefinitely.
2. The completed circle rests for 160 ms and stays in place. A slightly tilted vermilion 水 seal presses into its center over 300 ms, compressing briefly before settling to its final size. The seal echoes the existing header logo, with a pale border and tiny uninked fibers.
3. The stamp impression holds for 380 ms and triggers one centered Canvas UI splash. Its two-crest wave train refracts the landscape, crane film and cloth lettering with the supplied damping, chromatic dispersion and crest lighting. Wave speed and wavelength fit the viewport diagonal so the crests pass every corner before fading. The previous circular aperture and hand-drawn rings are removed.
4. The paper cover fades uniformly across the full viewport during the first 22% of the 1.95-second wave. The initial 26 px page blur clears during its first 46%, leaving the broad refraction visible as it crosses the landscape. There is no page magnification. The cover, blur, event handlers and temporary input lock are then removed.

The opening replaces the initial scroll-controlled cloud cover. The three later cloud transitions, crane films, cloth panels and long scroll timeline are preserved. Opening cloud paintings remain in the artwork archive.

## Implementation

- `dist/ink-opening-model.js`: shared deterministic timing, uniform cover fade, ripple age, blur and navigation policy.
- `dist/ink-opening-paint.js`: native 2D enso, washi and seal impression painting, sized at up to 2× display density. It paints no ripple rings or radial reveal mask.
- `dist/canvas-ripple.js`: the supplied Canvas UI wave derivative, attenuation, refraction, dispersion and light equations adapted to the existing live WebGL renderers. Uses amplitude .5, two crests, decay 1, refraction 100, dispersion .5 and shine .5. Wavelength is at least 80 CSS px and scales with viewport radius; speed is at least the supplied .65 setting and increases so the trailing crests pass the farthest corner before the final tenth fades out.
- `dist/ink-opening.js`: asset progress, animation lifetime, skip behavior, input release and fallback deadlines.
- `dist/app.js`: starts the cover before page renderers initialize and supplies first-scene readiness promises.
- `dist/page-clouds.js`: disables the original opening cloud parting while preserving scene-change banks.

The blur targets only the visible opening elements and stage, so it does not rasterize the full long-scroll document. The effect stops drawing when complete. Skip opening and Escape release it immediately; users with reduced motion, direct chapter links, restored scroll positions or back/forward navigation see the page immediately. Failed assets use the existing scene/poster fallbacks. A maximum asset wait, controller deadline and independent boot deadline prevent an inaccessible loading cover. Hidden document content regains its prior input state, and keyboard focus returns to the brand when a focused skip control disappears.

The brush is baked once into a small transparent canvas at the current display density. Original procedural pigment fields control pressure, subtle contours and trailing bristles while leaving the main ink body solid. Their fixed coordinates keep the texture stable throughout loading. A radial clip advances the loading stroke; its pixels are not rebuilt on every browser frame. Geometry painting remains available when an offscreen canvas cannot be created. No supplied reference pixels are sampled, embedded or uploaded.

The Canvas UI ripple runs directly in the landscape, crane and cloth fragment shaders. Each surface maps fragment positions into the same viewport coordinates, retaining alignment across different origins and display densities. This uses the actual moving film and cloth textures, without a page screenshot, a React dependency or the experimental HTML-in-canvas capture API. Header and footer DOM text retain the existing blur reveal. The opening clock drives all ripple redraws and clears the shared state on completion, skip, reduced motion, page exit or timeout. Inactive rendering adds no ripple layout reads or extra texture samples. Browsers without the existing WebGL renderers retain their painted/static fallbacks and the blur reveal.

## Verification

`npm run build` includes syntax/import checks and `scripts/ink-opening-check.mjs`. The controller is exercised with cached, rejected and stalled assets; skipped and completed openings; mid-animation reduced-motion changes; deep links; back/forward visits; and readiness-listener cleanup. Pure frame checks cover portrait, desktop and ultrawide aspect ratios, uniform cover fading, diminishing blur, full amplitude at the corners and trailing-wave coverage before cleanup. Existing cloud and reversible-flight checks still pass.

The ignored `qa/ink-opening-preview.mp4` is a landscape motion study rendered from the actual paint/model modules, with the existing opening landscape and crane poster. Browser verification is recorded separately from that renderer study.

The smoothing revision is shown in `qa/ink-opening-preview-smooth.mp4`, rendered through the actual canvas painter. Its dense body, continuous contour and fine tapered finish were inspected in that render. A fresh browser check could not run because the browser connection returned `browser.user is unavailable`.

For the Canvas UI revision, reconnecting the browser restored automation. The real landscape, film and five cloth shaders compiled and rendered, the opening reached `complete`, and the console reported no warnings or errors. Tests cover shared splash coordinates across surfaces with different positions and pixel densities, start-after-seal timing, skip during a wave and complete clearing of ripple work after the reveal. The ignored `dist/qa/ripple-review.html` records the actual landscape shader for local visual review, saved as `qa/canvas-ui-ripple-preview.mp4`; these QA artifacts are not deployed source or copies of the supplied attachment.

The subsequent full-screen correction removes the old radial aperture entirely and scales the Canvas UI wave to the viewport. Build checks pass for 390×844, 1280×720 and 2560×1080, including both crests crossing the corners before fading. Visual retesting of this correction was unavailable because the browser tool reported local browser use disabled; the earlier recorded shader preview predates this sizing correction.

On the seal revision, the local page and brush circle were inspected in the in-app browser. An initial browser run reached the safety timeout with delayed animation frames. Progress easing now uses real elapsed time instead of a capped frame delta; a sparse-frame controller check verifies completion at one frame per second. A follow-up browser run reached `complete` with the cover hidden, its temporary blur property removed and no console errors. The local renderer study shows the intended stamp-to-ripple sequence separately from browser integration.

No generation service or paid media credits are used. The video decoder installed for reference inspection is isolated under ignored `.local/video-inspection/`; runtime has no new dependencies.
