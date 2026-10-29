# Ink-only crane alternative

Created with the built-in ImageGen tool, inspired by the user's crane painting. Both approaches are retained as separate files. This is artwork for review; website and animation code have not changed.

## New ink-only option

- Transparent RGBA PNG: `crane-flock-ink-only-v1.png` (1774 x 887, verified alpha range 0–255).
- Landscape preview: `crane-flock-ink-only-on-wetlands-v1.png`.
- User style reference retained only in ignored `.local/private-references/`.

## Previous watercolor option — preserved

- Transparent flock: `crane-flock-sumi-watercolor.png`.
- Landscape preview: `crane-flock-on-wetlands.png`.

Choosing the previous option simply means using those files; they were not overwritten by this experiment.

## Ink-only flock — final prompt

Use case: style-transfer.
Asset type: transparent PNG, alternate crane-flock artwork preview; keep earlier watercolor artwork unchanged.
Image 1 is the STYLE REFERENCE supplied by the user: a dramatic crane painted in black sumi-e ink and diluted gray ink. Image 2 is a COMPOSITION REFERENCE for the existing nine-crane flock. Create a NEW alternative inspired by the expressive ink technique of image 1, while retaining the airy flock concept of image 2.
Primary request: exactly NINE graceful cranes flying away from the camera in a loose natural staggered V, painted ONLY in black ink and diluted neutral-gray ink, on a GENUINELY TRANSPARENT background. This must be visibly different from the previous blue/sage watercolor birds.
Reference-inspired technique: expressive masterful calligraphic brushwork, sweeping tapered wing gestures, bold near-black strokes suggesting primary feathers, broken dry-brush marks, fine flicked lines at feather tips, dilute smoky-gray washes shaping a light airy torso. Dark and light brush masses with substantial negative space and a few tiny restrained ink speckles right at wing contours. Strongly hand-painted, flowing and minimal. Much of the pale body is described through sparse ink contours and open transparent negative space, as if the unpainted paper were removed. No opaque white body fills.
Each crane should be drawn with a few assured brush gestures, rather than detailed feathers. Natural bird proportions and correct wing connections. Slender straight necks stretch FORWARD away from the viewer toward the upper center, tiny heads and beaks, long slender legs stream backward. Camera follows BEHIND and SLIGHTLY ABOVE the flock; do not copy the side-facing upright neck or standing/takeoff pose from the style reference. Different birds show different believable wingbeat phases and small banks. The nearest trailing cranes have the clearest brush gestures; the leading ones are smaller and paler.
Composition: horizontal landscape canvas, nine complete separated birds, no overlaps, no clipped wings/legs, generous transparent margins. Smaller lead crane at upper center, larger trailing birds lower left and lower right. Preserve similar overall spacing to composition reference 2 while drawing a more energetic organic flock, not a rigid repeated stamp.
Palette constraints: black, charcoal and NEUTRAL gray ink ONLY. Despite the reference's red crown, the new birds must have NO RED, no blue, no green, no colored watercolor. Use ink dilution and alpha to create light washes.
Background constraints: true transparent RGBA PNG. No paper rectangle or canvas texture outside bird marks, no gray sky or cloudy background, no ground, no landscape, no shadow, no drawn checkerboard. No red seal, text, lettering, labels, frames or watermark. No photorealism, no 3D, no vector icons. Preserve ink-brush transparency and isolated edges.

## Ink-only landscape comparison — final prompt

Use case: compositing.
Asset type: static landscape preview for comparing two crane artwork approaches. This is only a preview; do not add website interface.
Image 1 is the BASE LANDSCAPE: the current Japanese sumi-e watercolor wetlands map. Preserve this complete painting, its landscape aspect ratio, scenery, palette and detail.
Image 2 is the INSERT: nine flying cranes painted in black and neutral-gray ink, supplied as a transparent PNG. Overlay the actual birds without altering their brushwork, positions relative to one another, shapes or monochrome ink palette. Treat image 2's background as transparent alpha, never black.
Only composite the flock over the base landscape. Scale the entire flock uniformly to about 45 percent of the landscape width, and center its canvas near 61 percent of the landscape width and 49 percent of its height, matching the previous watercolor-flock comparison position. The small lead crane goes toward the distant river opening, the larger trailing cranes spread over nearer water. All nine cranes are flying above the river, viewed from behind and slightly above.
The cranes must keep expressive black sumi-e strokes, broken dry-brush feather tips, charcoal and diluted neutral-gray ink washes. Do not recolor them blue/green or add colored watercolor. Their ink marks and sparse light wash areas should show naturally over the existing painting, without a white rectangular backing.
Preserve the landscape; no restyling, no new scenery, no additional or missing birds, no added reflections, shadows or mist. No text, labels, border, watermark, interface or lettering. Output one opaque full-bleed landscape PNG showing the ink-only flock over the current map.
