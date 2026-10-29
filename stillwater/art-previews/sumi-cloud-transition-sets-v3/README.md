# New cloud artwork for the three scene transitions

Status: all three sets approved and implemented on 2026-10-28. The original opening artwork is unchanged.

18 original transparent PNGs were created with the built-in ImageGen tool: three distinct sets of six independent layers. Every image was generated separately, using only its approved landscape as the palette/medium reference. No opening cloud artwork or other cloud was supplied as an input. No images were mirrored, sampled, recolored or cut into layers.

Each review page preserves the static artwork study and all six PNGs separately. Runtime copies in `stillwater/dist/assets/clouds/river-mist/`, `temple-volutes/` and `mountain-plumes/` are byte-for-byte identical to these originals. `stillwater/dist/ink-clouds.js` assigns a different set to each of the three scene cuts and retains the original six PNGs for the opening.

Each set has its own six scroll-driven planes, staggered entrance/exit speeds, vertical drift and overlaps. All 24 paintings preload into separate banks, so forward scrolling, reverse scrolling and chapter jumps select the matching decoded artwork without swapping image URLs during motion. The opening keeps its existing loading cover; a failed or pending bank has a warm paper fallback. The long 20% transition scroll span, closed hold and reduced-motion behavior are preserved.

Coverage was checked by compositing actual PNG alpha at 2 CSS pixel intervals at 1280×720, 390×844 and 2560×1080. Every sampled pixel remains at least 98% opaque during the closed hold. The build also verifies 24 distinct PNG content hashes, original aspect ratios, RGBA transparency, correct scene selection, staggered motion and exact reverse-scroll frames.

## 1. River mist ribbons

Wetlands to village. Long horizontal shelves, split mist streamers and pale celadon-gray washes.

[Review board](01-river-mist/review.html) · [Exact prompts](01-river-mist/PROMPTS.md) · [Artwork records](01-river-mist/artwork-record.json)

| Depth | Left PNG | Right PNG |
| --- | --- | --- |
| Rear | [Left rear](01-river-mist/left-rear.png) | [Right rear](01-river-mist/right-rear.png) |
| Middle | [Left middle](01-river-mist/left-middle.png) | [Right middle](01-river-mist/right-middle.png) |
| Foreground | [Left foreground](01-river-mist/left-front.png) | [Right foreground](01-river-mist/right-front.png) |

## 2. Temple cloud scrolls

Village to autumn temples. Large open curls, rounded cloud fans and expressive warm-gray brush accents.

[Review board](02-temple-volutes/review.html) · [Exact prompts](02-temple-volutes/PROMPTS.md) · [Artwork records](02-temple-volutes/artwork-record.json)

| Depth | Left PNG | Right PNG |
| --- | --- | --- |
| Rear | [Left rear](02-temple-volutes/left-rear.png) | [Right rear](02-temple-volutes/right-rear.png) |
| Middle | [Left middle](02-temple-volutes/left-middle.png) | [Right middle](02-temple-volutes/right-middle.png) |
| Foreground | [Left foreground](02-temple-volutes/left-front.png) | [Right foreground](02-temple-volutes/right-front.png) |

## 3. Mountain storm banks

Autumn temples to overhead gorge. Tall torn cloud masses, hanging vapor fringes and cool slate-blue ink washes.

[Review board](03-mountain-plumes/review.html) · [Exact prompts](03-mountain-plumes/PROMPTS.md) · [Artwork records](03-mountain-plumes/artwork-record.json)

| Depth | Left PNG | Right PNG |
| --- | --- | --- |
| Rear | [Left rear](03-mountain-plumes/left-rear.png) | [Right rear](03-mountain-plumes/right-rear.png) |
| Middle | [Left middle](03-mountain-plumes/left-middle.png) | [Right middle](03-mountain-plumes/right-middle.png) |
| Foreground | [Left foreground](03-mountain-plumes/left-front.png) | [Right foreground](03-mountain-plumes/right-front.png) |

All 18 files have real RGBA transparency, feathered alpha, unique SHA-256 hashes, and byte-for-byte equality with their generated originals. No asset duplicates the opening set. The original opening assets and every previous study remain preserved.
