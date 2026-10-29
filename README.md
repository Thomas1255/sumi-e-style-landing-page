# Stillwater

A neo-traditional sumi-e and watercolor scroll inspired by the supplied river story. Follow nine ink-painted cranes through wetlands, golden terraces, autumn forest and a mountain gorge. Four approved, generated 1080p films provide the flight motion and changing perspectives. Scrolling advances or reverses each film; stopping holds its frame. Story text hangs on linen with the supplied Canvas UI Cloth effect, while Canvas UI Clouds adds drifting mist and cursor wind.

Includes chapter navigation, a keyboard-accessible flight slider, reduced-motion support, transparent painted fallbacks and opt-in water audio. The original video drafts, upscales, prompts and credit records are preserved in `stillwater/art-previews/`. Integration uses the existing approved videos and requires no new generation.

Run `npm run dev` and open http://localhost:5173. No dependency installation is required. Run `npm run build` to validate. Deployable files live in `stillwater/dist/`.

Current implementation details are in `stillwater/REDESIGN.md`. Selected artwork and exact built-in ImageGen prompts are in `stillwater/FLOCK-ARTWORK.md`. Earlier art studies and prompts are retained separately.

Repository: [Thomas1255/sumi-e-style-landing-page](https://github.com/Thomas1255/sumi-e-style-landing-page). The Git repository covers this entire workspace, with the site in `stillwater/`. Project work should be checked, committed, and pushed as described in `AGENTS.md`.

For Vercel, import this repository with Root Directory set to the repository root (leave it blank), and deploy the latest `main` commit. `vercel.json` selects the Other framework preset, runs `npm run build`, and serves `stillwater/dist` as static files. `server.mjs` is only for local previews; this site does not require a production server or serverless function.

Existing Vercel projects with Root Directory set to `stillwater` are also supported: `stillwater/vercel.json` selects the same static deployment with Output Directory `dist`, relative to that root. Use either the repository root or `stillwater` as Root Directory, not `stillwater/dist`.
