# 🪐 Cosmos — 3D AI Space Explorer

Explore the solar system in 3D, click any celestial object, and ask an AI tutor
about it. Real NASA data, real-time-ish positions, Kurzgesagt-style explanations.

Built for a hackathon — SDG 4 (Quality Education). *Anywhere a kid has a phone,
they have a space tutor.*

## Tech

Vite · React 19 · TypeScript · React Three Fiber · drei · Tailwind CSS v4 ·
Zustand · Google Gemini · NASA APIs · Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev                  # http://localhost:5173
```

You need two free API keys in `.env.local`:

- `NASA_API_KEY` — https://api.nasa.gov
- `GEMINI_API_KEY` — https://aistudio.google.com/apikey

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Dev server with hot reload + `/api`   |
| `npm run build`   | Type-check + production build         |
| `npm run preview` | Preview the production build          |
| `npm run lint`    | TypeScript check                      |

## Architecture

- `src/components/scene/` — the 3D scene (Sun, planets, asteroids, camera).
- `src/components/ui/` — overlay UI (info panel, chat, landing splash).
- `src/data/` — hardcoded planet constants and fallback facts.
- `src/lib/` — client fetchers and orbital math.
- `src/store/` — Zustand global state.
- `api/` — Vercel serverless functions proxying NASA + Gemini (keys stay server-side).

More detail in [CLAUDE.md](./CLAUDE.md).
