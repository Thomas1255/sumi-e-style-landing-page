# Crane video drafts for review

The four approved flock perspectives now have generated video tests and separately retained 1080p upscales. The first test is retained, and three additional Seedance 2.5 drafts were generated at 480p, six seconds each. The user approved upscaling all four clips. The website and its current animation have not changed in this iteration; additional paid attempts require separate approval.

| Perspective | Local video | Length | Credits spent |
| --- | --- | --- | --- |
| 1 — rear-following flock | `crane-video-test-01-480p.mp4` | 8.042 s | 24 |
| 2 — left turn | `crane-video-02-left-bank-480p.mp4` | 6.042 s | 18 |
| 3 — right turn | `crane-video-03-right-bank-480p.mp4` | 6.042 s | 18 |
| 4 — higher rear view | `crane-video-04-high-overhead-480p.mp4` | 6.042 s | 18 |

The three-clip generation batch cost 54 credits, leaving 32 credits after 78 total credits spent on all four tests. The subsequent four-clip upscale preflight quoted 5.2 credits; the confirmed balance decreased by 5.24 credits to 26.76. No new motion generation was submitted during upscaling.

## 1080p outputs

| Perspective | Upscaled local video |
| --- | --- |
| 1 — rear-following flock | `crane-video-01-rear-follow-1080p.mp4` |
| 2 — left turn | `crane-video-02-left-bank-1080p.mp4` |
| 3 — right turn | `crane-video-03-right-bank-1080p.mp4` |
| 4 — higher rear view | `crane-video-04-high-overhead-1080p.mp4` |

Bytedance Video Upscale used the standard tier, AIGC preset, 1080p target and 24 fps. All four exports were verified as silent H.264 at 1918 x 1080, preserving their source frame counts and durations (193 frames for view 1; 145 frames each for views 2–4). Frame samples were inspected. The source framing, including the existing right-edge crowding, is unchanged. All 480p originals are preserved. Full upscale settings, source/output job IDs, quotes, confirmed balance and media metadata are recorded in `CRANE-VIDEO-UPSCALING-1080P.json`.

The three new files were checked with ffprobe: each has one silent HEVC video stream at 854 x 480, 24 fps, with duration 6.042 seconds. Frame samples across each clip were inspected. The right-turn draft crowds the right edge early in the clip, so its framing should receive particular attention during user review. Completion of rendering does not mean the artwork or motion has been approved.

The green background is intentional for later compositing over the existing watercolor landscape. The generated video should supply the crane movement, replacing the earlier joint-based canvas wing animation after approval. During integration, page scroll will seek forward and backward through the selected clips; stopping scroll should hold the current frame.

Exact reference IDs, indexed job IDs, generation prompts, quotes, output URLs and media metadata are preserved in `CRANE-VIDEO-TESTS-02-04.json`. The original test remains documented in `CRANE-VIDEO-TEST-01.json`; approved reference PNGs are in `perspectives/`. QA contact sheets stay outside Git.
