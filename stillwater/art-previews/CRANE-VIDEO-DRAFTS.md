# Crane video drafts for review

The four approved flock perspectives now have generated video tests. The first test is retained, and three additional Seedance 2.5 drafts were generated at 480p, six seconds each. The website and its current animation have not changed in this iteration. Upscaling and additional paid attempts remain subject to user review and approval.

| Perspective | Local video | Length | Credits spent |
| --- | --- | --- | --- |
| 1 — rear-following flock | `crane-video-test-01-480p.mp4` | 8.042 s | 24 |
| 2 — left turn | `crane-video-02-left-bank-480p.mp4` | 6.042 s | 18 |
| 3 — right turn | `crane-video-03-right-bank-480p.mp4` | 6.042 s | 18 |
| 4 — higher rear view | `crane-video-04-high-overhead-480p.mp4` | 6.042 s | 18 |

The new batch cost 54 credits. The confirmed balance after this batch is 32 credits, from an original balance of 110 and 78 total credits spent on all four tests. No additional generation or upscale was submitted.

The three new files were checked with ffprobe: each has one silent HEVC video stream at 854 x 480, 24 fps, with duration 6.042 seconds. Frame samples across each clip were inspected. The right-turn draft crowds the right edge early in the clip, so its framing should receive particular attention during user review. Completion of rendering does not mean the artwork or motion has been approved.

The green background is intentional for later compositing over the existing watercolor landscape. The generated video should supply the crane movement, replacing the earlier joint-based canvas wing animation after approval. During integration, page scroll will seek forward and backward through the selected clips; stopping scroll should hold the current frame.

Exact reference IDs, indexed job IDs, generation prompts, quotes, output URLs and media metadata are preserved in `CRANE-VIDEO-TESTS-02-04.json`. The original test remains documented in `CRANE-VIDEO-TEST-01.json`; approved reference PNGs are in `perspectives/`. QA contact sheets stay outside Git.
