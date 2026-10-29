# Stillwater

A neo-traditional sumi-e and watercolor scroll experience. Follow a flock of nine ink-painted cranes through wetlands, golden terraces, autumn forest and a mountain gorge.

## The experience

- Four generated crane films share a reversible scroll timeline with four painted landscapes. Scroll down to advance, scroll up to retrace, and stop to hold the current frame.
- Layered sumi-e cloud paintings conceal changes in perspective, with a distinct cloud composition for each transition. Gentle ambient mist adds movement between scenes.
- An ink-circle loader stamps the 水 seal before a full-screen Canvas UI ripple reveals the page.
- Story text hangs on animated linen using Canvas UI Cloth.
- Chapter navigation, a keyboard-accessible flight slider, reduced-motion support, painted fallbacks and optional pond audio keep the journey accessible.

## Run locally

Use Node.js with npm. The project is validated with Node.js 24 and has no npm package dependencies, so no installation step is required.

From the repository root:

```sh
npm run dev
```

Open [localhost:5173](http://localhost:5173/). Stop the server with `Ctrl+C` in the terminal that started it.

If that port is already in use, use the running preview or choose another port:

```sh
npm run dev -- --port 5175
```

Then open [localhost:5175](http://localhost:5175/).

## Validate changes

```sh
npm run build
```

This validates the maintained site files; it does not generate or overwrite `dist/`. Checks cover JavaScript syntax and imports, asset references, reversible flight timing, landscape synchronization, cloud coverage, the opening ripple, reduced-motion behavior and HTTP video seeking. `npm run check` runs the same validation.

The build uses a temporary local HTTP server for its video-range checks. Browser visual testing is a separate step.

## Project layout

```text
stillwater/
  dist/           Maintained HTML, CSS, JavaScript and runtime artwork
    assets/       Landscapes, cloud layers, crane posters and films
  scripts/        Validation checks
  server.mjs      Local preview server with HTTP byte-range support
  art-previews/   Generated artwork studies and media production assets
vercel.json       Static deployment configuration
```

`stillwater/dist/` is the deployable source and stays tracked in Git. Edit it directly. The preview server serves this directory only.

The site uses native JavaScript, Canvas, WebGL and the Web Audio API. Canvas UI effects are adapted to its existing renderers; React and a production Node server are not required. The approved crane films are bundled assets, and running the page does not generate new media or spend generation credits.

## Deploy

Serve `stillwater/dist/` with a static host that supports HTTP byte-range requests for video seeking.

For Vercel, the repository includes configurations for either project root:

| Root Directory | Build command | Output Directory |
| --- | --- | --- |
| Repository root | `npm run build` | `stillwater/dist` |
| `stillwater` | `npm run build` | `dist` |

Use the Other framework preset. Do not set Root Directory to `stillwater/dist`; the validation scripts live outside it. `server.mjs` is for local previews and is not part of the static deployment.
