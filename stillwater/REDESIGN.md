# Flying with the flock

Nine ink-painted cranes fly through a sumi-e watercolor landscape using the four approved generated films. Each upscaled clip is 1918 × 1080, 24 fps, silent H.264. Rear-follow, left-bank, right-bank and high-overhead perspectives accompany the wetlands, terraces, forest and peaks respectively. Wings and poses come entirely from the films; the former jointed wing renderer is retained only as an unused historical study.

`dist/flight-timeline.js` shares landscape cuts and transition widths with `terrain.js`. Scroll position selects an exact source frame within each clip's landscape interval; the films stay paused, and queued seeks coalesce while scrolling quickly. Moving upward retraces the same frames. During each landscape dissolve the flock passes through mist, avoiding a superimposed double flock. Its composition shifts across the viewport to leave room for the cloth.

`dist/video-flock.js` removes the green video backing with a WebGL chroma key and edge despill, preserving the gray ink, ivory feathers and red crowns. Transparent approved PNGs appear while loading or when video/WebGL is unavailable. Reduced motion holds the first landscape and first video frame. No autoplay, audio track or external media service is required at runtime.

The background uses four paintings composed from the correct forward-looking flight perspective: lotus wetlands, golden terraces, autumn forest and high mountain gorge. A restrained depth-dependent dolly gives near banks more motion than distant peaks; mist softens the transitions. This is a painted scroll animation, not a generated film or a physically navigable 3D terrain. Upright hills and trees remain intact instead of being flattened onto a displaced map.

The terrain assets and exact built-in ImageGen prompts are recorded in FLOCK-ARTWORK.md. Approved transparent crane studies, source films, upscales, generation prompts and credit records remain in `art-previews/`. Seek-friendly web copies in `dist/assets/videos/` use six-frame keyframe spacing, no B-frames and MP4 fast-start metadata. The original upscales are preserved unchanged. `server.mjs` supports byte-range requests for efficient local seeking.

## Canvas UI Cloth

`dist/cloth.js` adapts the supplied Canvas UI Cloth implementation, retaining its wave equation, top pinning, foreshortening, mesh normals, directional light, sheen, shadow, and cursor imprint. Its grid is reduced from 96 to 56 subdivisions for multiple responsive panels.

`dist/page-cloth.js` paints the actual DOM layout into a canvas texture using text-node ranges and computed fonts. This replaces only the experimental HTML-in-canvas capture step so the same cloth mesh can run in standard browsers. Native text, headings, and links remain in the DOM for accessibility, selection and keyboard navigation. Focus switches to the native content for reliable visible keyboard interaction. A linen panel remains readable if WebGL or texture capture is unavailable.

The five story panels have an ivory woven linen finish, stitched hems, vermilion seals and dark wooden hanging rails. Wind, speed, amplitude, drape, brush, lighting and sheen retain the supplied demo settings. The fabric corner radius is reduced to suit a hanging scroll.

This integration reuses the already generated and upscaled clips. No further generation or upscale job was run.

Run `npm run dev` from the repository root and visit http://localhost:5173. `npm run build` verifies modules/assets, anchors, video frame bounds and reversibility, shared landscape transitions, all five cloth panels, reduced motion and real HTTP byte-range responses. Its HTTP check requires loopback access.

Visual QA covers desktop 1280 × 720 and mobile 390 × 844, all four video angles, transparent compositing, cloth legibility, and reverse seeking. Returning to the same slider position reproduces the same paused video time. The original right-bank film contains some edge crowding/cropping; this integration preserves that approved footage rather than inventing replacement birds.
