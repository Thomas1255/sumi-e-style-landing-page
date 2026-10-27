# Flying with the flock

Nine small, simplified cranes follow a loose V through a sumi-e watercolor landscape. Wings share connected shoulder-to-tip geometry, with staggered wingbeats, glides, quiet banking and distance-scaled sizes. The flock crosses gently to leave room for each cloth panel. Their poses and positions derive from scroll progress: stopping holds the flight, and scrolling upward retraces the same frames.

The background uses four paintings composed from the correct forward-looking flight perspective: lotus wetlands, golden terraces, autumn forest and high mountain gorge. A restrained depth-dependent dolly gives near banks more motion than distant peaks; mist softens the transitions. This is a painted scroll animation, not a generated film or a physically navigable 3D terrain. Upright hills and trees remain intact instead of being flattened onto a displaced map.

The four selected assets and exact built-in ImageGen prompts are recorded in FLOCK-ARTWORK.md. Earlier detailed bird and terrain studies remain available but are unused by the current page. A static painted fallback remains readable without WebGL. Reduced motion holds the camera and flock still.

## Canvas UI Cloth

`dist/cloth.js` adapts the supplied Canvas UI Cloth implementation, retaining its wave equation, top pinning, foreshortening, mesh normals, directional light, sheen, shadow, and cursor imprint. Its grid is reduced from 96 to 56 subdivisions for multiple responsive panels.

`dist/page-cloth.js` paints the actual DOM layout into a canvas texture using text-node ranges and computed fonts. This replaces only the experimental HTML-in-canvas capture step so the same cloth mesh can run in standard browsers. Native text, headings, and links remain in the DOM for accessibility, selection and keyboard navigation. Focus switches to the native content for reliable visible keyboard interaction. A linen panel remains readable if WebGL or texture capture is unavailable.

The five story panels have an ivory woven linen finish, stitched hems, vermilion seals and dark wooden hanging rails. Wind, speed, amplitude, drape, brush, lighting and sheen retain the supplied demo settings. The fabric corner radius is reduced to suit a hanging scroll.

No video has been generated and no Higgsfield video credits have been spent.

Run `npm run dev` from the workspace and visit http://localhost:5173. `npm run build` verifies modules/assets, anchors, 720 reversible flock states, nine staggered cranes, four landscape scenes, all five cloth panels and reduced motion.

Visual QA: desktop 1280 x 720 and mobile 390 x 844. Cloth textures and animation are active, pointer brushing reaches both cloth and clouds, and advancing then reversing the slider reproduces identical flight/camera state. Publication remains unavailable because the Sites connector returns "Sites project not found" for the existing project ID; the existing ID and audience are preserved.
