# Ink circle → drop → ripple opening

The user chose the Ink Bloom direction and supplied the video described in `art-previews/ink-opening-reference-v1/README.md`. The reference opens outward from the center, briefly shows a strongly blurred scene, then settles into focus. The requested sumi-e treatment adds a painted ink-circle loader and one central drop before that reveal. The reference video is retained locally in the ignored `.local/private-references/` folder and excluded from GitHub.

## Sequence

1. A charcoal enso paints clockwise on warm washi. Multiple uneven bristle tracks, varying pigment and pressure give its edge a dry-brush texture. Its progress follows four settled first-scene tasks: the opening landscape, crane poster, document fonts and first film frame (or its painted fallback). The minimum loading passage is 1.5 seconds; asset readiness never waits indefinitely.
2. The completed circle rests for 160 ms, then gathers into the center over 620 ms. Its pigment resolves into one ink drop.
3. The drop holds for 220 ms and sends out three faint, slightly irregular water rings. A feathered circular aperture expands from exactly the center.
4. The actual page appears through that aperture with a 26 px blur and restrained 3.5% landscape magnification, resolving to full focus over 1.95 seconds. The cover, blur, magnification, event handlers and temporary input lock are then removed.

The opening replaces the initial scroll-controlled cloud cover. The three later cloud transitions, crane films, cloth panels and long scroll timeline are preserved. Opening cloud paintings remain in the artwork archive.

## Implementation

- `dist/ink-opening-model.js`: shared deterministic timing, aperture, ripple, blur and navigation policy.
- `dist/ink-opening-paint.js`: native 2D enso, washi, drop, aperture and ripple painting, sized at up to 2× display density.
- `dist/ink-opening.js`: asset progress, animation lifetime, skip behavior, input release and fallback deadlines.
- `dist/app.js`: starts the cover before page renderers initialize and supplies first-scene readiness promises.
- `dist/page-clouds.js`: disables the original opening cloud parting while preserving scene-change banks.

The blur targets only the visible opening elements and stage, so it does not rasterize the full long-scroll document. The effect stops drawing when complete. Skip opening and Escape release it immediately; users with reduced motion, direct chapter links, restored scroll positions or back/forward navigation see the page immediately. Failed assets use the existing scene/poster fallbacks. A maximum asset wait, controller deadline and independent boot deadline prevent an inaccessible loading cover. Hidden document content regains its prior input state, and keyboard focus returns to the brand when a focused skip control disappears.

## Verification

`npm run build` includes syntax/import checks and `scripts/ink-opening-check.mjs`. The controller is exercised with cached, rejected and stalled assets; skipped and completed openings; mid-animation reduced-motion changes; deep links; back/forward visits; and readiness-listener cleanup. Pure frame checks cover portrait, desktop and ultrawide aspect ratios, monotonically expanding ripples, diminishing blur and complete corner coverage. Existing cloud and reversible-flight checks still pass.

Local browser tooling reported that browser use was disabled, including after the user showed the setting enabled and the tool connection was refreshed. Full-page browser verification was therefore unavailable. The ignored `qa/ink-opening-preview.mp4` is a landscape motion study rendered from the actual paint/model modules, with the existing opening landscape and crane poster. It confirms the visual sequence separately from DOM/browser integration.

No generation service or paid media credits are used. The video decoder installed for reference inspection is isolated under ignored `.local/video-inspection/`; runtime has no new dependencies.
