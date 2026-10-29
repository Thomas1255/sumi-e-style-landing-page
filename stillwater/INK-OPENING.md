# Ink circle → seal stamp → ripple opening

The user chose the Ink Bloom direction and supplied local motion and brush-circle references. The opening expands outward from the center, briefly shows a strongly blurred scene, then settles into focus. Its sumi-e treatment uses a broad, dry-brush enso loader and a vermilion stamp of the existing 水 logo. Supplied references remain local; the page uses original procedural geometry and the existing brand character, with no reference pixels or remote media services.

## Sequence

1. A charcoal enso paints clockwise from its heavy lower-left start on warm washi. An irregular pigment impression replaces smooth parallel strokes: ragged inner and outer edges, wandering dry-brush channels, uneven grey washes, uninked pores and a broken taper leave an open lower gap. Its progress follows four settled first-scene tasks: the opening landscape, crane poster, document fonts and first film frame (or its painted fallback). The minimum loading passage is 1.5 seconds; asset readiness never waits indefinitely.
2. The completed circle rests for 160 ms and stays in place. A slightly tilted vermilion 水 seal presses into its center over 300 ms, compressing briefly before settling to its final size. The seal echoes the existing header logo, with a pale border and tiny uninked fibers.
3. The stamp impression holds for 380 ms and sends out three faint, slightly irregular water rings. A feathered circular aperture expands from exactly the center, dissolving the seal and enso as it opens.
4. The actual page appears through that aperture with a 26 px blur and restrained 3.5% landscape magnification, resolving to full focus over 1.95 seconds. The cover, blur, magnification, event handlers and temporary input lock are then removed.

The opening replaces the initial scroll-controlled cloud cover. The three later cloud transitions, crane films, cloth panels and long scroll timeline are preserved. Opening cloud paintings remain in the artwork archive.

## Implementation

- `dist/ink-opening-model.js`: shared deterministic timing, aperture, ripple, blur and navigation policy.
- `dist/ink-opening-paint.js`: native 2D enso, washi, seal impression, aperture and ripple painting, sized at up to 2× display density.
- `dist/ink-opening.js`: asset progress, animation lifetime, skip behavior, input release and fallback deadlines.
- `dist/app.js`: starts the cover before page renderers initialize and supplies first-scene readiness promises.
- `dist/page-clouds.js`: disables the original opening cloud parting while preserving scene-change banks.

The blur targets only the visible opening elements and stage, so it does not rasterize the full long-scroll document. The effect stops drawing when complete. Skip opening and Escape release it immediately; users with reduced motion, direct chapter links, restored scroll positions or back/forward navigation see the page immediately. Failed assets use the existing scene/poster fallbacks. A maximum asset wait, controller deadline and independent boot deadline prevent an inaccessible loading cover. Hidden document content regains its prior input state, and keyboard focus returns to the brand when a focused skip control disappears.

The detailed brush is baked once into a small transparent canvas at the current display density. Original procedural pigment fields control pressure, dry channels, torn contours and paper absorption. Their fixed coordinates keep the texture stable throughout loading. A radial clip advances the loading stroke; its pixels are not rebuilt on every browser frame. Geometry painting remains available when an offscreen canvas cannot be created. No supplied reference pixels are sampled, embedded or uploaded.

## Verification

`npm run build` includes syntax/import checks and `scripts/ink-opening-check.mjs`. The controller is exercised with cached, rejected and stalled assets; skipped and completed openings; mid-animation reduced-motion changes; deep links; back/forward visits; and readiness-listener cleanup. Pure frame checks cover portrait, desktop and ultrawide aspect ratios, monotonically expanding ripples, diminishing blur and complete corner coverage. Existing cloud and reversible-flight checks still pass.

The ignored `qa/ink-opening-preview.mp4` is a landscape motion study rendered from the actual paint/model modules, with the existing opening landscape and crane poster. Browser verification is recorded separately from that renderer study.

On the seal revision, the local page and brush circle were inspected in the in-app browser. An initial browser run reached the safety timeout with delayed animation frames. Progress easing now uses real elapsed time instead of a capped frame delta; a sparse-frame controller check verifies completion at one frame per second. A follow-up browser run reached `complete` with the cover hidden, its temporary blur property removed and no console errors. The local renderer study shows the intended stamp-to-ripple sequence separately from browser integration.

No generation service or paid media credits are used. The video decoder installed for reference inspection is isolated under ignored `.local/video-inspection/`; runtime has no new dependencies.
