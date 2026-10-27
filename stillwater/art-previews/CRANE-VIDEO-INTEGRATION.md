# Scroll video delivery

The four approved 1080p upscales are integrated into the maintained static site. Original drafts, upscales, PNG references and prompts are preserved. No new generation or upscale was requested during integration.

| Landscape | Perspective | Original upscale | Web copy | Frames at 24 fps |
| --- | --- | --- | --- | --- |
| Lotus wetlands | Rear-follow | crane-video-01-rear-follow-1080p.mp4 | dist/assets/videos/crane-01-rear-follow.mp4 | 193 |
| Golden terraces | Left-bank | crane-video-02-left-bank-1080p.mp4 | dist/assets/videos/crane-02-left-bank.mp4 | 145 |
| Bamboo and autumn | Right-bank | crane-video-03-right-bank-1080p.mp4 | dist/assets/videos/crane-03-right-bank.mp4 | 145 |
| High peaks | High-overhead | crane-video-04-high-overhead-1080p.mp4 | dist/assets/videos/crane-04-high-overhead.mp4 | 145 |

Web copies were technically re-encoded with FFmpeg, preserving 1918 × 1080 resolution and 24 fps:

```text
-an -c:v libx264 -preset fast -crf 18 -g 6 -keyint_min 6 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart
```

The short keyframe spacing makes forward and reverse seeks responsive. A browser WebGL shader keys green by channel dominance and saturation, with despill and a narrow outer feather. The approved transparent PNG for each angle supplies a loading/error fallback.

Landscape cuts remain at 18%, 43% and 68%, with a 9.5 percentage point dissolve span. Clip frames map across their full scene spans. The flock fades through the landscape mist between perspectives so only one flock is visible at a time. All video elements stay paused; scroll position and the accessible slider control their current time.
