# Your Hackathon Playbook: Building "Cosmos" with Claude Code

> A 3D, AI-powered space exploration app — built in a weekend.
> This brief is **for you**. It explains the setup, the workflow, and how to drive Claude Code effectively. The companion file `02_CLAUDE_CODE_SPEC.md` is the brief you paste into Claude Code.

---

## 1. The Mission

You're building **Cosmos** — a 3D web app where users explore the solar system in their browser, click on any celestial object (planets, the Sun, asteroids), and ask an AI tutor questions about it. NASA's APIs supply the real data. An LLM supplies the explanations in a Kurzgesagt/Cleo Abram-style voice.

**Hackathon goal:** SDG 4 (Quality Education) — make learning about space frictionless and exciting.

---

## 2. Prerequisites Checklist

Install these **before** you start. Don't skip — Claude Code can't fix a broken Node install for you.

### Required

- [ ] **Node.js 22 LTS** (or any v18+) — download from [nodejs.org](https://nodejs.org) or use `nvm`
- [ ] **Git** — [git-scm.com](https://git-scm.com)
- [ ] **VS Code** (or any editor; you'll mostly live in the terminal) — [code.visualstudio.com](https://code.visualstudio.com)
- [ ] **A modern browser** (Chrome/Edge/Firefox) — Chrome DevTools is best for WebGL debugging
- [ ] **A terminal** — Terminal.app on macOS, Windows Terminal + WSL2 on Windows, any on Linux

### Accounts & API keys

- [ ] **NASA API key** — sign up at [api.nasa.gov](https://api.nasa.gov) (takes 2 minutes, emailed instantly)
- [ ] **Anthropic API key** — sign up at [console.anthropic.com](https://console.anthropic.com) and add ~$5 credit (plenty for a hackathon)
- [ ] **Claude Code access** — either a Claude Pro subscription ($20/mo, includes Claude Code) *or* the Anthropic API key above with credits
- [ ] **GitHub account** — for committing code; judges often want a repo link
- [ ] *(Optional)* **Vercel account** — for one-click deployment to share a live demo URL

### Verify your setup

Open a terminal and run:

```bash
node --version    # should be v18.0.0 or higher (v22 ideal)
npm --version     # any recent version (v9+)
git --version     # any recent version
```

If any are missing, install them now before continuing.

---

## 3. Install Claude Code

The fastest path on macOS/Linux:

```bash
npm install -g @anthropic-ai/claude-code
```

> **Windows:** Use WSL2 (Ubuntu). Native Windows is not supported. Run the command inside your WSL terminal.

> **Permission error?** Don't use `sudo`. Either use `nvm` (recommended) or set npm's prefix to a user-owned folder.

Verify:

```bash
claude --version
```

First time you run `claude` in any directory, it'll prompt you to log in via browser. Use your Claude Pro account or your Anthropic API key.

---

## 4. Set Up Your Project Workspace

```bash
# Make a folder for the project
mkdir cosmos && cd cosmos

# Initialize git
git init

# Open Claude Code in this directory
claude
```

You're now in an interactive Claude Code session, sitting in an empty folder. This is your launchpad.

---

## 5. How to Use the Companion Brief (the *real* trick)

Open `02_CLAUDE_CODE_SPEC.md` on your phone or another window. You have two options for feeding it to Claude Code:

### Option A (recommended): Drop it in the folder

1. Save `02_CLAUDE_CODE_SPEC.md` into the `cosmos/` folder
2. In Claude Code, say:
   > *"Read `02_CLAUDE_CODE_SPEC.md` and use it as the project specification. Start by acknowledging the plan in your own words and asking me any clarifying questions before writing code."*
3. Claude Code will read the file and confirm understanding.

### Option B: Paste it directly

Just paste the whole spec into the chat. Same effect.

**Why Option A is better:** the spec stays in your repo, future Claude Code sessions can re-read it, and you can edit it as scope evolves.

---

## 6. Working Effectively with Claude Code

These are the moves that separate a smooth weekend from a painful one.

### Use Plan Mode for big steps

Before letting Claude Code write a lot of code, ask:
> *"Show me your plan before you start. Don't write code yet."*

Review the plan. Push back on anything that feels off-scope. Then say *"go ahead."*

### Commit constantly

After each working phase, commit:
```bash
git add . && git commit -m "Phase 2: planets clickable"
```
If Claude Code breaks something, `git reset --hard HEAD` is your undo button.

### Use `/clear` between phases

Claude Code's context window fills up. After completing a phase, run `/clear` to start fresh — it'll re-read `CLAUDE.md` and your spec, and runs faster with a clean slate.

### Let it run the dev server

Claude Code can `npm run dev` and read the output. Let it. It'll catch its own errors faster than you can.

### When stuck, ask for a smaller step

If something isn't working after 2 attempts, say:
> *"Stop. Show me just the minimum code to render one textured sphere. Nothing else."*

Then build back up.

### Use a `CLAUDE.md`

The spec includes a template. Drop it at the project root. Claude Code reads it automatically every session — it's your persistent memory.

---

## 7. Suggested 2-Day Hackathon Workflow

### Day 1 — Foundation (build the "wow" first)

**Morning (3–4 hrs)**
- Setup + Phase 0 + Phase 1 (scene with planets orbiting the Sun)
- Goal: demo-able 3D solar system spinning in your browser

**Afternoon (3–4 hrs)**
- Phase 2 (click → info panel with hardcoded facts)
- Phase 3 (NASA APOD on landing, asteroid feed populated)

**Evening**
- Phase 4 (wire up the AI chat per selected object)
- **First end-to-end demo should work tonight.** Even ugly. Working > pretty.

### Day 2 — Polish & ship

**Morning**
- Phase 5 polish: bloom/glow, smooth camera transitions, loading states
- Add starfield, fix any jank

**Afternoon**
- Record a 60-second demo video (judges often watch on 2× speed)
- Deploy to Vercel for a live URL
- Write the README

**Final hour: practice the pitch.** Don't skip this. A weak pitch kills a good build.

---

## 8. Common Pitfalls & How to Recover

| Pitfall | Fix |
|---|---|
| "It's running slow" | Tell Claude Code to add `<instancedMesh>` for asteroids and Level-of-Detail on planets |
| Planets are invisible / huge / overlap | Scale issue — ask Claude Code to "review the scale constants in `data/planets.ts`" |
| API key exposed in frontend | All NASA/Anthropic calls must go through `/api` serverless functions. Never put keys in client code. |
| Three.js errors in console | Paste the error to Claude Code. It will likely fix it in one round. |
| AI answers feel generic | Improve the system prompt — give it personality (see spec section 7) |
| Running out of time | Cut Phase 5 polish entirely. A working demo > a polished half-demo. |

---

## 9. Demo Day: What Judges Want to See

1. **Open with the wow** — full-screen 3D solar system, smooth camera, bloom glow. 5 seconds in, they're hooked.
2. **Click a planet** — info panel slides in, AI tutor answers a curious question.
3. **Show a Mark Rober-style moment** — e.g. "An asteroid the size of a 12-story building passed Earth yesterday" pulled live from NeoWs.
4. **Name the AI integration explicitly.** Don't assume judges notice. Say *"the explanation you just saw was generated live by Claude based on real NASA data."*
5. **Tie back to SDG 4.** One sentence: *"Anywhere a kid has a phone, they have a space tutor."*

---

## 10. After the Hackathon

If you place well: the natural V2 is voice mode ("just talk to it"), AR mode (point your phone at the sky), and a classroom mode for teachers. Each is a real product on its own. Worth keeping in your back pocket for the Q&A.

---

**You've got this. The hardest part is starting. Open the terminal, run `claude`, and paste the spec.**
