# Cosmos — Project Memory

## What this is

A 3D web app for exploring the solar system with an AI tutor. Hackathon build for
SDG 4 (Quality Education). Open the URL → beautiful 3D space → click any planet, the
Sun, or a near-Earth asteroid → ask an AI tutor about it in a Kurzgesagt-style voice.

## Stack

Vite + React 19 + TypeScript + React Three Fiber + drei + postprocessing +
Tailwind CSS v4 + Zustand. Serverless `/api` functions proxy NASA APIs and the
Google Gemini API. Deploy target: Vercel.

## Commands

- `npm run dev` — dev server at http://localhost:5173 (`/api/*` routes work in dev via `vite-api-plugin.ts`)
- `npm run build` — type-check + production build
- `npm run preview` — preview the production build
- `npm run lint` — TypeScript check

## Conventions

- Components: PascalCase (`Planet.tsx`). Hooks / utilities: camelCase.
- ALL NASA + Gemini calls go through `/api` serverless functions — NEVER expose keys to the client.
- Cross-component state lives in the Zustand store (`src/store/useSceneStore.ts`).
- Tailwind utility classes for styling; no CSS modules.
- TypeScript strict mode; avoid `any`.

## Critical constraints

- 2-day hackathon build. Bias toward shipping over polish.
- 60fps target. Use `<instancedMesh>` for any group > 50 objects (asteroids).
- Planets are NOT to real scale — display constants live in `src/data/planets.ts`.
- Desktop only for v1. Small screens get a "best on desktop" notice.

## Local dev note

Vite does not natively run Vercel `/api` functions. `vite-api-plugin.ts` adapts them
so `npm run dev` serves `/api/apod`, `/api/neo`, and `/api/chat` locally. The same
files run natively on Vercel in production.

## Out of scope (do not build)

Auth / accounts, a database, server-side rendering, a galaxy beyond the solar
system, mobile-optimized 3D.

## Deviations from the original spec

- AI tutor uses **Google Gemini** (`@google/genai`), not Anthropic — per project owner.
- **Tailwind CSS v4** (Vite plugin, CSS-first config) instead of v3 + `tailwind.config.ts`.
- **React 19** + React Three Fiber v9 (the spec said "React 18+"; latest stable used).
