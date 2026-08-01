# KabineCam

A digital homage to the classic black-and-white photobooths found around Berlin.

Step in, press start, and take a strip of four photos — just like the real thing. No account, no uploads: everything happens right in your browser.

**Live at [kabinecam.com](https://kabinecam.com)**

---

## How it works

1. **Landing** — a booth window with a camera lens behind glass, and a Start button.
2. **Camera** — asks for camera access, then shows a mirrored square preview.
3. **Countdown** — three seconds before the first shot, so you can get into position.
4. **Four photos** — fired automatically, about 1.5 seconds apart, each with a flash and a shutter sound.
5. **Printing** — the finished strip feeds out of a slot in stepped, mechanical motion.
6. **Keep it** — download the strip as a PNG, or hop back in for another round.

## Features

- **Four-photo strip** in classic photobooth proportions, with black borders around and between frames
- **Black-and-white filter** applied per pixel on canvas, so the exported file carries the effect — not just the on-screen preview
- **Real shutter sound** on every shot, with a synthesized fallback if the recording can't load
- **Print animation** — the strip emerges through a slot with depth, shadow, and stepped motion
- **Saves properly on every device** — phones get the native share sheet, which is the only reliable route to the camera roll on iOS; desktops get a direct download
- **Privacy by design** — no backend, no uploads, no analytics. Photos are created and stay on your device.
- **Camera released when you switch tabs**, so the indicator light never lingers
- Responsive from phone portrait to desktop, and respects `prefers-reduced-motion`

## Stack

| | |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **UI** | React 19, plain JavaScript |
| **Styling** | CSS Modules |
| **Type** | Static — no backend, no database, no API routes |
| **Hosting** | [Vercel](https://vercel.com) |
| **Design** | Figma |
| **Built with** | [Claude Code](https://claude.com/claude-code) |

### Browser APIs

The app is essentially a tour of what the browser can do on its own:

- **`getUserMedia`** — camera access (requires HTTPS)
- **Canvas 2D** — square-cropping frames, per-pixel grayscale, and compositing the strip
- **Web Audio API** — playing the decoded shutter sound, and synthesizing a fallback from filtered noise
- **Web Share API** — handing the strip to the native share sheet on phones
- **Blob / object URLs** — desktop downloads, avoiding the multi-megabyte `data:` URLs a large canvas would otherwise produce
- **`next/og`** — generating the favicon and the social preview image at build time

## Running locally

Requires Node.js 18.18 or newer.

```bash
git clone https://github.com/camomillar/KabineCam.git
```

```bash
cd KabineCam && npm install
```

```bash
npm run dev
```

Then open **http://localhost:3000**.

> **Camera access needs a secure context.** `localhost` counts as secure, so the camera works in local development. If you serve the app from another machine on your network, the browser will block the camera unless it's over HTTPS.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

### Preview shortcuts

Two query strings skip ahead, which is useful for working on the later screens without granting camera access every time:

| URL | Goes to |
|---|---|
| `/?demo` | The results screen, with placeholder photos |
| `/?demo-camera` | The camera screen |

## Project structure

```
app/
├─ components/
│  ├─ PhotoBooth.jsx      Screen state: landing → camera → results
│  ├─ CameraView.jsx      Camera stream, countdown, capture, shutter sound
│  ├─ ResultsView.jsx     Strip composition, print animation, download
│  └─ InfoModal.jsx       About dialog with the stack and privacy note
├─ icon.jsx               Favicon, generated at build time
├─ opengraph-image.jsx    Social preview card, generated at build time
├─ layout.jsx             Fonts and metadata
├─ page.jsx
└─ globals.css
public/
└─ camerasound.mp3        Shutter recording
```

Each component has a matching `.module.css` file beside it.

### Tweakable constants

The timings live at the top of `app/components/CameraView.jsx`:

```js
const PHOTO_COUNT = 4             // photos per strip
const COUNTDOWN_DURATION = 3      // seconds before the first shot
const PAUSE_BETWEEN_PHOTOS = 1500 // milliseconds between shots
const SHUTTER_VOLUME = 1          // 0–1
```

## Deploying

The app is static with no environment variables, so any host that runs Next.js will do. On Vercel:

1. Import the repository at [vercel.com/new](https://vercel.com/new) — Next.js is detected automatically, no configuration needed.
2. Add your domain under **Settings → Domains**, and point the DNS records it gives you at your registrar.

HTTPS is required in production, or browsers will refuse camera access. Vercel provisions certificates automatically.

## Privacy

There is no server. Photos are captured, filtered, and composited entirely in the browser, and the resulting file is written straight to your device. Nothing is uploaded, stored, or transmitted, and there is no analytics or tracking of any kind.

---

Made with ♥ in Berlin
