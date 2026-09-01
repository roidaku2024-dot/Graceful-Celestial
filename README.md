# Graceful Celestial

A browser-first Batik and textile image studio with three workflows:

- **8K Resolution** sends a safely reduced source image to the server-side Replicate Real-ESRGAN integration. It selects a practical 2× or 4× model scale while targeting a 7,680px long edge when possible.
- **Batik Outline** creates a black and white contour SVG locally in the browser.
- **Photo → Vector Art** offers a professional **Color** / **Black & White** palette switch. Color mode reduces the source to a small, usable palette while preserving its principal Batik colors in editable SVG paths; Black & White mode retains the clean monochrome workflow. Both SVG and PNG exports preserve the selected vector colors.

## Configuration

The 8K workflow requires a server-side environment variable. Set it in your deployment provider (or local server environment):

```sh
REPLICATE_API_TOKEN=your_replicate_token
```

Never put this value in `index.html`, `script.js`, or any browser-visible source. The API handler reads it only from `process.env.REPLICATE_API_TOKEN`.

## Run and deploy

Serve the repository with a platform that supports serverless handlers under `api/` (for example, Vercel). Static hosting supports the local Outline and Vector tools, but the 8K Resolution action requires the `/api/enhance` handler and the environment variable above.
