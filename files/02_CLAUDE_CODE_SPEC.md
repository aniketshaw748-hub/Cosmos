# Project Spec: Cosmos — 3D AI Space Explorer

> **Read this file in full before writing any code. Then summarize the plan back to me and ask any clarifying questions.**

---

## 1. Mission

Build a web app called **Cosmos** that lets users explore the solar system in 3D, click on celestial objects, and ask an AI tutor about them. Real NASA data, real-time(ish) positions, Kurzgesagt-style explanations.

**Target user:** anyone curious about space — kids, students, hobbyists. The app must feel like a game, not a textbook.

**Design principles:**
- **Frictionless:** open the URL, see beautiful space, click anything, get a delightful answer.
- **Real data:** NASA APIs everywhere we can; no fake numbers.
- **AI as interface:** the LLM is the *guide*, not a chatbot bolted on the side.
- **Hackathon-realistic:** ship a working v1 in 2 days. Polish > scope.

---

## 2. Tech Stack

Use the **latest stable versions** of all packages unless otherwise noted.

| Layer | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fast HMR, simple, modern |
| Language | **TypeScript** | Catches bugs Claude Code can't see |
| Framework | **React 18+** | Industry standard |
| 3D engine | **Three.js** via **React Three Fiber** (`@react-three/fiber`) | Declarative 3D in React |
| 3D helpers | **`@react-three/drei`** | OrbitControls, Stars, useTexture, etc. |
| Post-processing | **`@react-three/postprocessing`** | Bloom for the Sun and bright objects |
| Styling | **Tailwind CSS** | Fast UI iteration |
| State | **Zustand** | Lightweight global store for selected object, camera target, etc. |
| AI SDK | **`@anthropic-ai/sdk`** | For the tutor responses |
| Backend | **Vercel serverless functions** (in `/api`) | Hide API keys |
| Deployment | **Vercel** | One-command deploy |

Do **not** introduce: Next.js, Redux, a database, authentication. Keep it lean.

---

## 3. Project Structure

Create this structure exactly:

```
cosmos/
├── api/                          # Vercel serverless functions
│   ├── apod.ts                   # Proxy to NASA APOD
│   ├── neo.ts                    # Proxy to NASA NeoWs feed
│   └── chat.ts                   # Proxy to Anthropic API
├── public/
│   └── textures/                 # Planet/sun texture maps (8K JPGs)
├── src/
│   ├── components/
│   │   ├── scene/
│   │   │   ├── Scene.tsx         # Root <Canvas> + lighting
│   │   │   ├── Sun.tsx           # Glowing sphere + point light
│   │   │   ├── Planet.tsx        # Reusable planet component
│   │   │   ├── SolarSystem.tsx   # Maps planet data to <Planet>s
│   │   │   ├── AsteroidBelt.tsx  # Instanced mesh of asteroids
│   │   │   ├── Starfield.tsx     # Backdrop stars
│   │   │   └── CameraRig.tsx     # Smooth zoom-to-object
│   │   ├── ui/
│   │   │   ├── InfoPanel.tsx     # Slide-in panel for selected object
│   │   │   ├── ChatBox.tsx       # AI Q&A interface inside panel
│   │   │   ├── DailyHero.tsx     # APOD landing splash
│   │   │   ├── SuggestedQuestions.tsx
│   │   │   └── Loader.tsx        # Initial loading screen
│   ├── data/
│   │   ├── planets.ts            # Hardcoded planet data
│   │   └── facts.ts              # Static fallback facts per object
│   ├── lib/
│   │   ├── nasa.ts               # Client-side fetchers for /api/*
│   │   ├── ai.ts                 # Client-side chat fetcher
│   │   └── orbital.ts            # Orbital math helpers
│   ├── store/
│   │   └── useSceneStore.ts      # Zustand: selectedObject, cameraTarget, isLoading
│   ├── styles/
│   │   └── index.css             # Tailwind imports
│   ├── App.tsx
│   └── main.tsx
├── .env.local                    # NASA_API_KEY, ANTHROPIC_API_KEY
├── .env.example
├── .gitignore
├── CLAUDE.md                     # Project memory for Claude Code
├── README.md
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Implementation Phases

Build in this order. **Pause after each phase and run the dev server to verify it works before moving on.** Commit after each phase.

### Phase 0 — Scaffold (30 min)

1. `npm create vite@latest . -- --template react-ts`
2. Install deps:
   ```
   npm i three @react-three/fiber @react-three/drei @react-three/postprocessing zustand @anthropic-ai/sdk
   npm i -D tailwindcss postcss autoprefixer @types/three
   npx tailwindcss init -p
   ```
3. Configure Tailwind (`content: ["./index.html", "./src/**/*.{ts,tsx}"]`)
4. Set up `.env.local` with `NASA_API_KEY` and `ANTHROPIC_API_KEY` (read these from me — do not invent values)
5. Add `.env.local` to `.gitignore`
6. Create the folder structure above (empty files where needed)
7. **Commit:** `chore: scaffold project`

### Phase 1 — Core 3D Scene (2–3 hrs)

Goal: a Sun and 8 planets orbiting in a beautiful, controllable 3D scene.

1. **Planet data** (`src/data/planets.ts`): hardcode all 8 planets with:
   - `name`, `radius` (display, not real), `orbitRadius` (display), `orbitSpeed` (relative), `tilt`, `textureUrl`, `realDiameterKm`, `realDistanceFromSunKm`, `dayLengthHours`, `yearLengthDays`, `moons`, `color` (fallback if texture fails)
2. **Sun** (`Sun.tsx`): emissive yellow sphere + `<pointLight>` at origin + bloom-friendly material
3. **Planet** (`Planet.tsx`): textured sphere that revolves around origin using `useFrame`, with self-rotation
4. **Scene** (`Scene.tsx`): `<Canvas>` with `logarithmicDepthBuffer`, ambient + point lighting, `<OrbitControls>` from drei
5. **Starfield**: drei's `<Stars />` for the backdrop
6. **Bloom**: wrap scene in `<EffectComposer><Bloom intensity={1.5} /></EffectComposer>`
7. **Scale strategy**: render planets at exaggerated sizes — Earth ~1 unit, Sun ~10 units, orbits spaced 15–250 units. Real proportions look like a black screen with dots.
8. **Textures**: download from [solarsystemscope.com/textures](https://www.solarsystemscope.com/textures/) (free, public domain) into `public/textures/`. Use 2K versions for speed; 8K only if performance allows.
9. **Commit:** `feat: solar system renders`

### Phase 2 — Selection & Info Panel (1–2 hrs)

Goal: click any planet → smooth camera zoom + slide-in info panel.

1. **Zustand store** (`useSceneStore.ts`):
   ```ts
   { selectedObject: SceneObject | null, setSelected, cameraTarget, setCameraTarget }
   ```
2. **Click handling**: add `onClick` to `<Planet>` mesh; on click, set selectedObject in store
3. **Camera rig** (`CameraRig.tsx`): watches `cameraTarget`, smoothly lerps camera position using `useFrame`; falls back to free orbit when nothing selected
4. **InfoPanel** (`InfoPanel.tsx`): Tailwind side panel, slides in from right when `selectedObject` is set. Shows name, key stats (diameter, distance, day length, year length, moons), and an "X" to deselect
5. **Hover state**: cursor changes to pointer on hover; subtle outline glow
6. **Commit:** `feat: click planet to inspect`

### Phase 3 — Live NASA Data (1–2 hrs)

Goal: real data flowing into the experience.

1. **APOD landing** (`DailyHero.tsx`): on app load, fetch today's Astronomy Picture of the Day via `/api/apod` and show as a splash screen. User clicks "Explore" to dismiss.
2. **Asteroid belt** (`AsteroidBelt.tsx`):
   - Fetch NeoWs feed via `/api/neo` for today's date
   - Render 1500–3000 asteroids as an `<instancedMesh>` distributed between Mars and Jupiter orbits (use the real near-Earth ones as a subset placed closer to Earth)
   - Each asteroid is clickable; selection shows real name, estimated diameter, miss distance, velocity
3. **Serverless functions** (`api/apod.ts`, `api/neo.ts`):
   - Read `NASA_API_KEY` from `process.env`
   - Cache responses for 1 hour to avoid rate limits
   - Return JSON to the client
4. **Commit:** `feat: live NASA data integrated`

### Phase 4 — AI Tutor (2 hrs) — *the differentiator*

Goal: contextual, delightful Q&A about whatever is selected.

1. **ChatBox** (`ChatBox.tsx`): input + message list inside InfoPanel
2. **SuggestedQuestions**: 3 pre-generated question buttons per object type (e.g. for Jupiter: "Why is the Great Red Spot red?", "Could Jupiter become a star?", "How big is it compared to Earth?")
3. **Serverless `/api/chat.ts`**:
   - Accepts `{ object: {...selected object data...}, question: string, history: Message[] }`
   - Calls Anthropic API with `claude-sonnet-4-5` (or latest available)
   - Streams response back if possible; otherwise return full text
4. **System prompt** (this matters a lot — see Section 7 for exact text)
5. **Loading state**: pulsing dots while waiting
6. **Commit:** `feat: AI tutor live`

### Phase 5 — Polish (2 hrs)

In priority order — stop when time runs out:

1. **Smooth camera transitions** (already there, but tune the easing)
2. **Loading screen** with progress (textures are heavy)
3. **Subtle ambient sound** (optional — space whoosh from a free CC0 source)
4. **Mobile message**: detect small screens, show "Best on desktop" overlay (don't try to make 3D work on phones for v1)
5. **Keyboard shortcuts**: `Esc` to deselect, `Space` to pause orbits
6. **Tooltip on hover** showing planet name
7. **Trail lines** showing each planet's orbit path (drei `<Line>` or custom)
8. **Asteroid name labels on hover**
9. **"Random object" button** — surprise me
10. **Commit & deploy to Vercel.** Done.

---

## 5. NASA API Endpoints (exact)

All called from serverless functions, never from client.

| Purpose | Endpoint | Notes |
|---|---|---|
| APOD | `GET https://api.nasa.gov/planetary/apod?api_key={KEY}` | Returns today's image + explanation |
| NEO feed | `GET https://api.nasa.gov/neo/rest/v1/feed?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&api_key={KEY}` | Near-Earth asteroids passing in date range |
| NEO lookup | `GET https://api.nasa.gov/neo/rest/v1/neo/{id}?api_key={KEY}` | Detailed info on one asteroid |
| Mars Rover (stretch) | `GET https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key={KEY}` | If time, add a "Mars surface" mode |
| Image search (stretch) | `GET https://images-api.nasa.gov/search?q={query}` | No key needed; for AI to reference images |

**Rate limits:** Personal key = 1,000 req/hour. Cache aggressively. DEMO_KEY = 30/hour — don't use it.

---

## 6. Planet Data (use these constants)

For consistency, use these display values (NOT real-scale — they're tuned for visual appeal):

```ts
// Display sizes (units), not real diameters
{ name: "Mercury",  radius: 0.4,  orbitRadius: 15,   orbitSpeed: 4.15 }
{ name: "Venus",    radius: 0.9,  orbitRadius: 22,   orbitSpeed: 1.62 }
{ name: "Earth",    radius: 1.0,  orbitRadius: 30,   orbitSpeed: 1.00 }
{ name: "Mars",     radius: 0.5,  orbitRadius: 45,   orbitSpeed: 0.53 }
{ name: "Jupiter",  radius: 3.5,  orbitRadius: 80,   orbitSpeed: 0.084 }
{ name: "Saturn",   radius: 3.0,  orbitRadius: 130,  orbitSpeed: 0.034 } // include rings
{ name: "Uranus",   radius: 2.0,  orbitRadius: 180,  orbitSpeed: 0.012 }
{ name: "Neptune",  radius: 1.9,  orbitRadius: 230,  orbitSpeed: 0.006 }
```

Sun radius: 8.0. Each planet also stores **real-world stats** for the InfoPanel and AI prompt.

---

## 7. AI System Prompt (use this verbatim)

```
You are Cosmos, an AI space tutor inside a 3D space exploration app. The user is currently looking at {OBJECT_NAME} and has the following real data on screen: {OBJECT_DATA_JSON}.

Your voice is curious, vivid, and warm — like Kurzgesagt or Cleo Abram. You explain space in a way that makes people lean forward.

Rules:
- Open with the answer, not a preamble.
- Use one concrete analogy per concept (e.g. "Jupiter could fit 1,300 Earths inside it — imagine a basketball next to a peppercorn").
- 2–4 short paragraphs max. This is a panel, not an essay.
- If the user asks something you can't verify, say so honestly and offer what is known.
- End with a "Want to know more?" hook — a follow-up question they could ask.
- Never break character or mention you are an AI model unless directly asked.
- No emojis. No bullet points. Prose only.

The user's question: {QUESTION}
```

Test the prompt by asking "Why is Mars red?" while Mars is selected. The response should feel *delightful* — not generic. If it's flat, iterate on the prompt.

---

## 8. CLAUDE.md (drop this at repo root)

```markdown
# Cosmos — Claude Code Project Memory

## What this is
3D web app for exploring the solar system with an AI tutor. Built for a hackathon.
Stack: Vite + React + TypeScript + React Three Fiber + Tailwind + Zustand.
Deployed on Vercel with serverless API routes proxying NASA and Anthropic APIs.

## Commands
- `npm run dev` — start dev server (localhost:5173)
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — TypeScript + ESLint check

## Conventions
- Component files: PascalCase (e.g. `Planet.tsx`)
- Hooks/utilities: camelCase
- All NASA and Anthropic calls go through `/api` serverless functions — NEVER expose keys to client
- Use Zustand store for cross-component state (selectedObject, camera target)
- Tailwind for all styling; no CSS modules
- TypeScript strict mode; avoid `any`

## Critical constraints
- This is a 2-day hackathon build. Bias toward shipping over polish.
- Performance: 60fps target. Use `<instancedMesh>` for any group >50 objects.
- Scale cheat: planets are NOT to real scale. See `src/data/planets.ts`.
- Mobile is not supported in v1. Desktop only.

## Out of scope (do not build)
- Authentication / accounts
- Database (all data is fetched or hardcoded)
- Server-side rendering
- A "real" galaxy beyond the solar system (use procedural stars instead)
- Mobile-optimized 3D
```

---

## 9. Definition of Done (v1)

A user can:
- [ ] Open the app and see today's APOD as a landing screen
- [ ] Click "Explore" and enter the 3D solar system
- [ ] Orbit, pan, and zoom around the scene smoothly at 60fps
- [ ] Click any planet, the Sun, or a near-Earth asteroid
- [ ] See a slide-in panel with real stats about that object
- [ ] Click a suggested question or type their own
- [ ] Get a vivid, conversational AI explanation streamed back
- [ ] Deselect and click a different object without page reload
- [ ] Visit a live Vercel URL (not just localhost)

If any of the above doesn't work in the final demo, it's a bug. Everything else is bonus.

---

## 10. Final Instructions for Claude Code

1. Read this entire file before doing anything.
2. Confirm you've read it by summarizing the plan in 5 bullet points and listing any clarifying questions.
3. Ask me for the NASA and Anthropic API keys before Phase 0 — do not proceed without them.
4. Work through phases sequentially. After each phase: run the dev server, verify it works, commit with a clear message, then ask permission to proceed to the next phase.
5. If you hit an unclear decision, ask me — don't guess on architecture.
6. If something doesn't work after two attempts, stop and report what you tried.

Now: read, summarize, and ask your questions.
