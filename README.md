# 🪐 Cosmos — 3D AI Space Explorer

Explore the solar system in 3D, click on any celestial object, and ask an AI
tutor about it. Real NASA data, real-time-ish positions, Kurzgesagt-style
explanations.

Built for a hackathon — **SDG 4 (Quality Education)**. The pitch: _anywhere a
kid has a phone, they have a space tutor._

---

## ✨ What it does

- **A living solar system** — the Sun and all eight planets, textured and
  orbiting in real proportions of motion, with Saturn's rings, a 2,200-rock
  asteroid belt, bloom glow and a procedural starfield.
- **Click anything** — planets, the Sun, or a real near-Earth asteroid. The
  camera smoothly flies in and follows the object as it keeps orbiting, while a
  panel slides in with real-world stats.
- **An AI tutor, not a chatbot** — every object has a contextual tutor powered
  by Google Gemini. Ask "Why is Mars red?" and get a vivid, conversational
  answer grounded in the data on screen.
- **Real NASA data** — today's Astronomy Picture of the Day greets you on the
  landing screen; the near-Earth asteroids are pulled live from NASA's NeoWs
  feed, sized by their true diameter, with hazardous ones flagged.

## 🛠 Tech

Vite · React 19 · TypeScript · React Three Fiber · drei · postprocessing ·
Tailwind CSS v4 · Zustand · Google Gemini · NASA APIs · Vercel.

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local     # then fill in your two keys
npm run dev                    # http://localhost:5173
```

You need two free API keys in `.env.local`:

| Key              | Where to get it                                    |
| ---------------- | -------------------------------------------------- |
| `NASA_API_KEY`   | https://api.nasa.gov (instant, free — not DEMO_KEY) |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey                 |

The dev server runs the `/api` serverless functions too, via a small Vite
plugin (`vite-api-plugin.ts`) — so `npm run dev` is fully functional offline of
Vercel.

## 📜 Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Dev server with hot reload + `/api`   |
| `npm run build`   | Type-check + production build         |
| `npm run preview` | Preview the production build          |
| `npm run lint`    | TypeScript check                      |

## ⌨️ Controls

- **Drag** to orbit · **scroll** to zoom
- **Click** a planet, the Sun, or an asteroid to inspect it
- **Esc** to deselect · **Space** to pause/resume orbits
- **Surprise me** jumps the camera to a random world

## 🧭 How it's built

```
api/                 Vercel serverless functions (keys never reach the client)
  apod.ts            NASA Astronomy Picture of the Day proxy (1 h cache)
  neo.ts             NASA near-Earth object feed proxy (1 h cache)
  chat.ts            Google Gemini AI-tutor proxy
src/
  components/scene/  3D scene — Sun, planets, asteroids, camera rig, trails
  components/ui/     Overlay UI — landing splash, info panel, chat, HUD
  data/              Hardcoded planet constants + fallback facts
  lib/               Client fetchers, orbital math, object registry
  store/             Zustand global state
```

All NASA and Gemini calls go through `/api` so the keys stay server-side. The
camera follows a live registry of 3D objects, so it tracks planets as they
orbit. If the AI is ever unreachable, the tutor falls back to a static fact so
the experience never breaks.

## ☁️ Deploying to Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new)
   (Vercel auto-detects Vite + the `/api` functions — zero config).
2. Add `NASA_API_KEY` and `GEMINI_API_KEY` as Environment Variables in the
   Vercel project settings.
3. Deploy. The serverless functions in `api/` run natively on Vercel.

## 📝 Notes

- The planets are **not** to real scale — display sizes and orbit spacing are
  tuned for visual appeal (real scale is a black screen with dots). Real
  numbers live in `src/data/planets.ts` and power the info panel + AI context.
- Desktop only for v1 — small screens get a friendly notice.
- The AI tutor uses **Google Gemini**; the original spec used Anthropic. See
  [CLAUDE.md](./CLAUDE.md) for the full list of deliberate deviations.
