# Varied crane wing poses

Created with the built-in ImageGen tool. Artwork review only: no website or animation code has changed.

## Current review: v4

- Transparent PNG: `crane-flock-varied-poses-v4.png` (1774 x 887, RGBA, verified alpha 0–255).
- Landscape preview: `crane-flock-varied-poses-on-wetlands-v4.png`.
- The bottom-left crane now glides with smoother extended wings. The other eight keep their varied approved wingbeat poses.

## Previous previews retained

The original varied pose attempt is saved as `crane-flock-varied-poses-v3.png` and `crane-flock-varied-poses-on-wetlands-v3.png`. Earlier ink, red-crown and watercolor options are also preserved under their versioned filenames.

## Requirement for the upcoming animation

The user requests natural differences in flapping rhythm. Use independent starting phases, slightly different cadences, and occasional glide pauses per bird. Avoid synchronizing all birds or merely rotating one shared pose. Keep motion deterministic from scroll position so stopping holds the pose and reverse scrolling retraces the flight. Preserve the ink painting, red crowns, natural anatomy and the corrected bottom-left wing geometry. This timing work is pending artwork review and has not been implemented in this iteration.

## Varied wing poses (v3) — final prompt

Use case: precise-object-edit.
Asset type: transparent PNG of a crane flock, artwork preview before animation.
Image 1 is the EDIT TARGET: nine sumi-e ink cranes with red crowns.
Primary correction: the birds currently look too synchronized. Redraw ONLY THEIR WING POSES and subtle banking to show nine cranes caught at DIFFERENT INSTANTS of a natural flap-and-glide rhythm. The change must be obvious: a true mixture of steep upstrokes, deep downstrokes, level glides and transitional strokes, not nine variants of the same nearly horizontal wing angle.
Keep the same expressive black and neutral-gray sumi-e brushwork, dry-brush feather tips, gray washes, slender crane anatomy, forward-stretched necks, trailing legs, red ink crown on EACH head, and camera following BEHIND and SLIGHTLY ABOVE. Preserve nine birds and their loose staggered V, scale/distance progression and spacious landscape composition. Adjust spacing only slightly where needed to keep all wings separate and inside the frame.
Pose plan, based on their locations:
1. Smallest leading bird at top center: calm level glide, wings spread wide.
2. Upper-left follower: full upstroke, BOTH wings sweep steeply UP into a tall narrow V, above its back.
3. Upper-right follower: full DOWNSTROKE, BOTH wings drive well BELOW its body line with tips pointing down, visibly different from the upstroke.
4. Middle-left bird: broad level glide with a gentle left bank, one wing slightly higher.
5. Middle-right bird: recovery stroke, elbows flexed and outer primaries rising, a raised arched-wing pose.
6. Largest near lower-left bird: deep active downstroke, wings sweep down and backward, narrow foreshortened span compared with the gliders, NOT another horizontal spread.
7. Inner lower-left bird: mid-upstroke, wings raised about 40 degrees with gracefully bent wrists.
8. Inner lower-right bird: mid-downstroke, wings descend about 35 degrees, shallow M silhouette.
9. Largest near lower-right bird: full tall upstroke with raised elegant wings, slight right bank, different from its nearest neighbor.
Strong believable attached shoulder/elbow/wrist anatomy; each bird has exactly TWO wings, no ghost wings or motion trails. Steep raised wings and steep lowered wings must both be present. Their bodies remain in streamlined forward flight, not upright standing/takeoff.
Keep each red crown delicately painted on the HEAD, not elsewhere. Palette remains monochrome ink plus red crowns only. No blue or green.
Output: genuine transparent RGBA PNG, only the nine complete isolated cranes, no paper backdrop, no sky, no landscape, no shadows, no checkerboard, no text/labels/seal. Allow extra transparent margin so no raised or lowered wing is clipped. Same wide landscape aspect ratio.

## Varied pose landscape preview (v3) — final prompt

Use case: compositing.
Asset type: static comparison preview of a crane flock over the existing Japanese sumi-e watercolor wetlands map.
Image 1 is the BASE LANDSCAPE. Preserve the complete painting, its scenery, palette, composition, detail and wide aspect ratio.
Image 2 is the INSERT, a transparent PNG of EXACTLY NINE black-and-gray sumi-e cranes with small red head crowns, in deliberately VARIED wingbeat poses. Treat its background as genuine transparent alpha.
Overlay the actual entire flock image 2 onto the base landscape without changing the birds' nine distinct poses, their number, spacing, expressive brushwork or red crowns. Scale it uniformly to about 45 percent of the landscape width and center it near 61 percent of the landscape width and 49 percent of its height. The lead bird is over the distant river opening and the trailing birds spread over nearer water.
Essential: preserve the mixture of steep raised wings, steep lowered wings, level glides, transitional strokes and gentle banking from image 2. This is the whole point of the preview. Do not normalize them into nine similar outstretched-wing poses. Keep every wing naturally attached to its bird, no ghost wings or motion trails.
Keep black and neutral-gray ink with tiny red crowns; no colored watercolor on the birds. No paper rectangle behind the flock. No new or missing birds, reflections, shadows, mist, text, labels, border or interface. Only the painted flock over the unchanged landscape, as one full-bleed opaque landscape PNG.

## correctedLowerLeftPng — final prompt

Use case: precise-object-edit.
Image 1 is the EDIT TARGET, a flock of nine ink-painted cranes with red crowns and varied wingbeat poses.
Correct ONLY the LOWEST, LEFTMOST crane: the large trailing bird at the lower-left of the flock. Its current deeply drooping wings look unnatural. Keep its head, long forward-reaching neck, red crown, body location, trailing legs, flight direction and scale.
Replace JUST THIS ONE BIRD'S WINGS with an anatomically natural relaxed GLIDING pose: both wings spread broadly to the sides, nearly level with a shallow graceful downward sweep toward the outer tips. Slender wings with smooth continuous shoulder-to-elbow-to-wrist transitions, gentle joint angles, modest tapered separated primary feather tips. A slight natural bank is fine. No high rounded shoulder humps, no sharply folded inverted arches, no doubled wing roots, no kinked wrists, no hanging curled wings. Its silhouette should feel airy, streamlined and effortless, like the already good gliding crane immediately above it.
CRITICAL LOCK: The OTHER EIGHT CRANES ARE APPROVED. Preserve their EXACT poses, red crowns, placements, body proportions, brushwork and sizes. Do not touch their raised or lowered wings. Preserve all original ink texture, black/gray washes and red crown color. Keep exactly nine birds, with variety across the flock; do not synchronize the other birds to the corrected glider. The target bird remains at its current location. No overlapping cranes or clipped feathers.
No new color, text, motion trails, seals or other objects.
Transparent PNG asset. Preserve genuine alpha transparency around and between the cranes. No paper, no backdrop, no landscape, no shadow, no drawn checkerboard. Keep the same landscape canvas dimensions and all other contents unchanged.

## correctedLowerLeftOverlay — final prompt

Use case: precise-object-edit.
Image 1 is the EDIT TARGET, a flock of nine ink-painted cranes with red crowns and varied wingbeat poses.
Correct ONLY the LOWEST, LEFTMOST crane: the large trailing bird at the lower-left of the flock. Its current deeply drooping wings look unnatural. Keep its head, long forward-reaching neck, red crown, body location, trailing legs, flight direction and scale.
Replace JUST THIS ONE BIRD'S WINGS with an anatomically natural relaxed GLIDING pose: both wings spread broadly to the sides, nearly level with a shallow graceful downward sweep toward the outer tips. Slender wings with smooth continuous shoulder-to-elbow-to-wrist transitions, gentle joint angles, modest tapered separated primary feather tips. A slight natural bank is fine. No high rounded shoulder humps, no sharply folded inverted arches, no doubled wing roots, no kinked wrists, no hanging curled wings. Its silhouette should feel airy, streamlined and effortless, like the already good gliding crane immediately above it.
CRITICAL LOCK: The OTHER EIGHT CRANES ARE APPROVED. Preserve their EXACT poses, red crowns, placements, body proportions, brushwork and sizes. Do not touch their raised or lowered wings. Preserve all original ink texture, black/gray washes and red crown color. Keep exactly nine birds, with variety across the flock; do not synchronize the other birds to the corrected glider. The target bird remains at its current location. No overlapping cranes or clipped feathers.
No new color, text, motion trails, seals or other objects.
This is the landscape overlay preview. The target is the large trailing crane at the lower-left of the FLOCK, centered around 38 percent across and 56 percent down the image, directly beneath the left-middle gliding bird. Preserve the complete underlying landscape and all eight other cranes. Do not move, rescale or recolor the flock or scenery. Output the same opaque full-bleed landscape PNG.
