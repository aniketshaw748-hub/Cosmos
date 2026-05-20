# Cosmos v2 — Feature Spec

> **Read this entire file before writing any code.** This is a feature spec for an existing project. The base app (Cosmos v1) is already built and working — 3D solar system with React Three Fiber, NASA APIs, and an AI tutor (powered by the Gemini API). This document describes the next round of features to add. Confirm understanding by summarizing the plan and asking clarifying questions before starting.

---

## Context

Cosmos v1 is shipped. The user opens a 3D scene with the Sun and 8 orbiting planets, clicks any planet to see a slide-in info panel, and chats with an AI tutor about it. NASA's APOD shows on landing. Asteroids from the NeoWs feed are clickable.

**What's missing or broken in v1:**
- When a planet is clicked, it keeps orbiting in the background and the chat panel overlays it awkwardly.
- Planets have no visible rotation axis.
- No way to see a planet's internal structure.
- No moons orbiting any planet, even ones that should have them.
- Some textures are low-resolution or placeholder.
- No way to see real NASA photos of a selected object.
- Beyond the solar system, the scene is empty black space.
- No sense of *when* anything in the scene formed — no time dimension at all.

**v2 fixes all of the above.** The features below are listed roughly in order of priority and dependency. Build them in this order unless asked otherwise.

---

## Feature 1 — Click-to-Focus Layout

When a planet (or the Sun, or a moon, or an asteroid) is selected, the entire scene should reorganize so the focused object sits clearly on the left side of the screen and the info panel + chatbot sits on the right.

### What should happen

- On selection, the camera smoothly moves so the object appears centered in the **left ~40% of the screen**.
- The object's **orbital motion freezes** while it is selected. It must not drift away from the camera or wander around — it stays locked in place visually.
- The object **continues rotating on its own axis** at its real rotation speed (Earth = one rotation per simulated day, Jupiter much faster, Venus slower and backwards, etc.).
- The InfoPanel and chatbox occupy the **right ~35–40% of the screen**, with a small gap from the right edge.
- The background (other planets, stars, etc.) continues moving normally but is slightly dimmed (~50% opacity or a subtle blur) so the focused object is clearly the subject.
- On deselect, everything smoothly returns to the normal orbital scene.

### Transitions

- Camera movement should be smooth (lerp/ease over ~1–1.5 seconds).
- Avoid jarring snaps. The user should feel pulled in, not teleported.

### Definition of done

- Click any planet → it slides to the left, locks in place, keeps spinning, chatbot opens on right.
- Click an empty area or close button → everything returns to free orbit.
- Works identically for the Sun, planets, moons, and asteroids.

---

## Feature 2 — Visible Rotation Axis

Every planet, when selected, should display its actual rotation axis as a visible line through its poles, tilted at the correct real-world angle.

### Data (use these exact values)

| Body    | Axial tilt | Notes |
|---------|------------|-------|
| Mercury | 0.034°     | Effectively upright |
| Venus   | 177.4°     | Almost completely upside-down; rotates backward |
| Earth   | 23.44°     | Classic |
| Mars    | 25.19°     | Very close to Earth's |
| Jupiter | 3.13°      | Nearly upright |
| Saturn  | 26.73°     | Like Earth's |
| Uranus  | 97.77°     | Tipped on its side, rolls around the Sun |
| Neptune | 28.32°     | Similar to Earth |

The Sun also has an axial tilt of about 7.25° relative to the ecliptic — show this too when the Sun is selected.

### Visual style

- A thin, slightly glowing line (or thin cylinder) that runs through the planet's center, extending a short distance past the north and south poles.
- Subtle color — white or a pale cyan, with low emissive glow.
- Optional tiny labels "N" and "S" at the ends of the axis, using drei's `<Html>` component.
- Only visible when the planet is selected (Feature 1). Hidden in normal orbital view.

### Definition of done

- Click any planet → axis appears at the correct tilt.
- The planet rotates *around* that axis (the axis stays still in space, the planet spins around it).
- Uranus visibly rolls on its side; Venus is upside-down.
- Deselect → axis disappears.

---

## Feature 3 — Planet Dissection

A "Dissect" button in the InfoPanel that visually opens the planet to reveal its internal structure, with each layer labeled.

### What it should look like

- "Dissect" button in the InfoPanel.
- On click, the planet animates open — either a clipping plane cuts away the front hemisphere, or the planet "splits" so you can see a cross-section.
- Inside, concentric inner spheres represent each layer, in distinct colors.
- Labels (using drei's `<Html>` overlay) point at each layer with its name and a one-line description.
- "Re-assemble" button puts the planet back together.

### Layer data per planet

**Mercury:** Solid Iron Inner Core · Liquid Outer Core · Mantle · Crust

**Venus:** Iron Core · Rocky Mantle · Basaltic Crust

**Earth:** Solid Inner Core (iron-nickel) · Liquid Outer Core (iron-nickel) · Lower Mantle · Upper Mantle · Crust (continental + oceanic)

**Mars:** Iron-Sulfur Core · Silicate Mantle · Basaltic Crust

**Jupiter:** Dense Core (possibly rocky/icy) · Metallic Hydrogen Layer · Liquid Molecular Hydrogen · Atmosphere (visible cloud layers)

**Saturn:** Rocky Core · Metallic Hydrogen · Liquid Hydrogen · Atmosphere

**Uranus:** Rocky Core · Icy Mantle (water/methane/ammonia ices) · Hydrogen-Helium Atmosphere

**Neptune:** Rocky Core · Icy Mantle · Hydrogen-Helium-Methane Atmosphere

### Important honesty rule

For the gas giants (Jupiter, Saturn, Uranus, Neptune), the interior structure is **estimated based on current scientific models** — not directly observed. The labels for these planets must include a small disclaimer: *"Estimated structure based on current scientific models."*

### Visual style

- Each layer in a clearly different color (e.g. Earth's inner core in bright yellow/orange, outer core in red, mantle in brown/dark orange, crust in green/blue).
- Layer thicknesses should be **roughly proportional to reality** (e.g. Earth's crust is a thin shell, the mantle is the bulk, the core is small).
- Labels float beside the layer they're pointing at, with a thin line connecting label to layer.
- Smooth animation in and out.

### Definition of done

- Every planet has a working "Dissect" mode with at least 3 layers (some have 4–5).
- All layers are labeled with correct names and brief descriptions.
- Gas giants display the disclaimer.
- Animation is smooth in both directions.
- Dissection only works when a planet is selected (Feature 1) — it doesn't make sense in the orbital view.

---

## Feature 4 — Moons

Every planet that has moons in real life should have its major moons visible and orbiting it.

### Which moons to render

Render only the **major / scientifically significant moons** — not every one. (Jupiter has 95 known moons; we are not rendering all of them.)

| Planet  | Moons to render |
|---------|-----------------|
| Mercury | None |
| Venus   | None |
| Earth   | The Moon (Luna) |
| Mars    | Phobos, Deimos |
| Jupiter | Io, Europa, Ganymede, Callisto (the four Galilean moons) |
| Saturn  | Titan, Enceladus, Mimas, Tethys, Dione, Rhea, Iapetus |
| Uranus  | Miranda, Ariel, Umbriel, Titania, Oberon |
| Neptune | Triton |

### Each moon should:

- Be a small textured sphere using the real moon's surface map (free textures available from Solar System Scope and NASA's 3D Resources site).
- Orbit its parent planet using simple sin/cos math (same pattern as the existing planet orbits).
- Have an **orbital speed roughly proportional to its real orbital period** (Phobos orbits Mars in 7.6 hours, our Moon takes 27.3 days — Phobos should visibly orbit much faster).
- Have an orbital distance scaled for visual clarity, not real scale (don't try to use real km — they'd be invisible or off-screen).
- Be clickable. Clicking a moon opens the same InfoPanel + chatbot system as planets (Feature 1 applies).

### Behavior when parent planet is selected

- When the parent planet is "focused" (Feature 1), its moons should also stop orbiting briefly so the user can see them clearly arranged.
- When zoomed in on a planet, moons should be clearly visible (not microscopic dots).

### Definition of done

- All 24 moons listed above visible in the scene.
- Each one orbits its parent at a roughly accurate relative speed.
- Each one is clickable and brings up an info panel with real data (diameter, orbital period, parent planet, interesting facts).
- Saturn's Titan in particular should have an atmosphere texture (it has a thick orange atmosphere in reality).

---

## Feature 5 — Original Textures

Replace any placeholder, low-quality, or AI-generated textures with the real surface maps used by NASA and the educational/scientific community.

### Source of truth

- **Solar System Scope** (solarsystemscope.com/textures) — free, public domain, high-quality 8K maps for every planet and the Sun. This should be the default source.
- **NASA's 3D Resources** site for moons and additional objects.
- **NASA's SVS (Scientific Visualization Studio)** for Earth-specific layers.

### Per planet, use these maps

- **Diffuse / surface map** for every planet (required).
- **Normal map** where available, for surface detail (Mars, Mercury, the Moon especially).
- **Cloud layer** for Earth (separate sphere slightly larger than Earth, with a transparent cloud texture, rotating slightly faster than the surface).
- **Night-side lights** for Earth (city lights visible on the dark hemisphere).
- **Ring textures** for Saturn (mandatory) and Uranus (subtle rings — they exist but are dark).
- **Sun**: an emissive surface texture with detail (granulation, sunspots if possible).

### Resolution strategy

- Use **2K textures by default** for performance.
- Provide a settings toggle for "High quality" that swaps to 4K or 8K textures.
- Compress textures (JPG quality ~85, or WebP) — uncompressed 8K PNGs will destroy load times.

### Definition of done

- No placeholder textures remain.
- Earth has visible clouds, night-side lights, and the day/night terminator looks realistic.
- Saturn has proper rings with visible structure.
- Every moon has a real surface texture (not just a colored sphere).

---

## Feature 6 — NASA Real-Image Gallery

When any planet, moon, asteroid, or the Sun is selected, the user should be able to view a gallery of real NASA photos of that object.

### Implementation

- Add a **"View NASA Photos"** button in the InfoPanel.
- On click, open a modal/overlay showing a grid of real NASA images of that object.
- Use the **NASA Image and Video Library API**: `https://images-api.nasa.gov/search?q={OBJECT_NAME}&media_type=image`
- This API requires **no API key** — it's free and unauthenticated.
- Display ~12–24 thumbnail images in a responsive grid.
- Clicking a thumbnail opens a larger view with the image's title, date, NASA center, and description.
- Include a small "Source: NASA" credit on each image.

### Search strategy per object type

- **Planets:** search by name (e.g. "Mars", "Jupiter").
- **Moons:** search by moon name (e.g. "Europa", "Titan").
- **Sun:** search "Sun" or "solar".
- **Asteroids:** search by name when available (e.g. "Bennu", "Ryugu"). If no specific name, fall back to "near earth asteroid" with the object's designation.

### UX details

- Loading state while images fetch (skeleton or shimmer).
- Empty state if no images found ("No NASA photos available for this object").
- Modal closes on Escape key or clicking outside the modal.
- Pre-cache thumbnails for smoother browsing.

### Definition of done

- "View NASA Photos" button appears in every InfoPanel.
- Clicking it shows real, recent NASA images of the selected object.
- Images are properly credited.
- Works for all planets, all moons, the Sun, and asteroids.

---

## Feature 7 — Solar System Timeline (The Big One)

A scrubbable timeline at the bottom of the screen that lets users move through ~4.6 billion years of solar system history. As they scrub, the 3D scene visually changes to reflect what the solar system looked like at that point in time.

### The timeline UI

- Horizontal scrubber/slider at the **bottom of the screen**, spanning most of the width.
- A **"Show Timeline"** toggle that hides/shows this UI (it shouldn't always be visible — only when explicitly opened).
- The scrubber represents time from **4.6 billion years ago → today**.
- The scale should be **piecewise / logarithmic** — most milestones are in the deep past, but recent events (humans, modern era) need to be reachable too. Pure linear scale would hide everything recent.
- **Major milestones** are marked on the scrubber as dots or notches. Clicking a milestone jumps directly to it.
- A **"Play"** button auto-advances the timeline at a fixed speed (e.g. covers the full 4.6 By in ~60 seconds).
- A **"Reset to today"** button.
- Below the scrubber: the current era's name + date + a short AI-generated explanation in a card.

### The milestones (use these exactly)

1. **4.6 Bya — The Solar Nebula** — A vast cloud of gas and dust collapses under gravity.
2. **4.6 Bya — Sun Ignites** — Fusion begins at the cloud's center; the Sun is born.
3. **4.55 Bya — Protoplanetary Disk** — A spinning disk of debris forms around the young Sun.
4. **4.5 Bya — Planets Form** — Dust grains collide and grow into planetesimals, then into planets.
5. **4.5 Bya — Theia Impact** — A Mars-sized body collides with proto-Earth; the Moon forms from the debris.
6. **4.1–3.8 Bya — Late Heavy Bombardment** — A storm of asteroids batters the inner solar system.
7. **3.8 Bya — First Life** — Earliest microbial life appears in Earth's oceans.
8. **2.4 Bya — Great Oxygenation Event** — Cyanobacteria fill the atmosphere with oxygen.
9. **540 Mya — Cambrian Explosion** — Complex multicellular life diversifies rapidly.
10. **230 Mya — Age of Dinosaurs Begins** — Dinosaurs emerge and dominate.
11. **66 Mya — Chicxulub Impact** — An asteroid wipes out the dinosaurs.
12. **300,000 ya — Modern Humans** — Homo sapiens emerge in Africa.
13. **1957 — Space Age Begins** — Sputnik 1 launches.
14. **Today** — The solar system as we currently see it.

### How the scene should change as you scrub

- **Before 4.6 Bya (nebula era):** Hide the Sun and all planets. Show a large, slowly rotating volumetric cloud of dust and gas (use a particle system or shader).
- **Sun ignition:** Sun appears as a small bright point and grows; nebula starts dispersing.
- **Protoplanetary disk:** A flat, rotating disk of dust orbiting the young Sun. No planets yet.
- **Planets forming:** Planets appear gradually, smaller than today. Lots of debris/asteroids around.
- **Theia impact:** A visible animation of a Mars-sized object on a collision course with Earth, then a flash, then the Moon forms from the debris.
- **Late Heavy Bombardment:** Massively increase the asteroid count (10× normal), with many on planet-crossing orbits.
- **First life onward:** Earth gets a slight green/blue tint to its surface texture (life is taking hold).
- **Modern era:** Standard solar system as in the default view.

You don't need to perfectly animate every transition — discrete state changes between milestones are acceptable. The point is the user feels time passing as they scrub.

### AI explanation per milestone

When the user lands on a milestone (or scrubs near it), the AI tutor generates a short, vivid explanation in the same Kurzgesagt-style voice as the planet tutor. Reuse the existing AI integration; just feed it the milestone name + date as context.

### Definition of done

- Timeline UI opens with a button (toggleable).
- All 14 milestones are reachable by clicking notches on the scrubber.
- Scrubbing visually changes the scene state.
- The Theia impact and Late Heavy Bombardment are visibly dramatic (the "wow" moments).
- AI explanation updates as the user moves through time.
- Returning to "Today" restores the normal solar system view exactly.

---

## Feature 8 — Beyond the Solar System (Background Universe)

When the user zooms out or looks past the solar system, they should see a rich, beautiful cosmic backdrop instead of empty black space.

### What should be visible

- **Dense procedural starfield** — many more stars than the default drei `<Stars />`. Use ~10,000–20,000 points distributed in a large sphere around the scene.
- **Distant galaxies** — billboards (always-facing-camera textured planes) using real Hubble/JWST galaxy images. NASA's Hubble image library is free and public domain. Place ~30–50 of these at varying distances, sizes, and orientations to give a sense of depth.
- **Nebulae** — large, semi-transparent volumetric clouds using shader effects or stacked transparent textured planes. Use real nebula images (Orion Nebula, Eagle Nebula, Carina Nebula — all Hubble photos in the public domain). 5–10 nebulae scattered in the distance.
- **Cosmic dust** — subtle particle field at medium distance to add depth between the solar system and the deep background.
- **Milky Way band** — a faint, brighter band of stars stretching across the background, representing our galactic plane.

### Depth and atmosphere

- Objects further away should be **dimmer and slightly hazier**.
- Parallax should work naturally as the camera moves.
- The background should feel **vast and contemplative**, not cluttered. Less is more — a few stunning galaxies and nebulae beat 100 mediocre ones.

### Sources for assets

- NASA Hubble image gallery: hubblesite.org/images (free, public domain).
- ESA/Webb gallery: esawebb.org/images (also free for non-commercial use).
- Solar System Scope's 8K starmap (already used for the existing starfield) — keep it as a base layer.

### Definition of done

- Zooming out reveals a beautiful, layered cosmic backdrop.
- No empty black space visible in any direction.
- Stars, galaxies, and nebulae are clearly distinguishable from each other.
- Performance remains 60fps despite the added visuals (use instancing and LOD).

---

## Feature 9 — "Coming Soon" Message for Areas Outside the Solar System

When the user clicks on the background (anywhere that isn't a planet, moon, asteroid, or the Sun), show a friendly toast message indicating that exploration beyond the solar system is under development.

### Behavior

- Detect clicks that **miss all interactive objects** (no raycast hit on any mesh in the solar system).
- Show a centered toast/modal with this message (or similar):
  > *"Beyond the solar system — coming soon. We're working on bringing you the Milky Way, distant exoplanets, and the wider universe."*
- The toast auto-dismisses after ~4 seconds or on any click.
- **Debounce it** — don't show again for at least 10 seconds after a dismissal, so accidental clicks while panning the camera don't spam the user.
- Also trigger this message if the user tries to zoom out beyond a certain camera distance (e.g. 1000 units from origin).

### Visual style

- Subtle, elegant toast — not an alarming popup.
- A small icon (e.g. a stylized galaxy or telescope).
- Dark background with a glowing border, fitting the space theme.
- Should not interrupt the 3D scene — overlay it.

### Definition of done

- Clicking empty space triggers the message exactly once per ~10 seconds.
- Clicking a planet, moon, asteroid, or the Sun does NOT trigger it (those have their own actions).
- The message is dismissable and doesn't get stuck on screen.

---

## Cross-Cutting Concerns

### Performance

The features above significantly increase the visual load. Without care, the app will drop below 60fps. Apply these techniques aggressively:

- **Instanced meshes** for all moons, asteroids, and starfield points.
- **Level of Detail (LOD)** on planets — high-poly when close, low-poly when far.
- **Texture compression** — never ship uncompressed PNGs. Use WebP or compressed JPGs.
- **Frustum culling** is automatic in Three.js, but make sure it's not disabled.
- **Logarithmic depth buffer** is already enabled (don't remove it).
- **Lazy load** the NASA image gallery — don't fetch images until the user opens the modal.
- **Timeline scene states** should be implemented by toggling visibility, not by recreating geometry.

### Accessibility

- All buttons (Dissect, View Photos, Timeline toggle, etc.) need clear labels.
- The chat input should support keyboard navigation.
- Toast messages should have an accessible role (`role="alert"` or similar).

### Mobile

- 3D mobile support is still out of scope for v2. Continue showing the "Best on desktop" overlay on small screens.

### State management

- Use the existing Zustand store. Add new state slices for: `dissectMode`, `timelinePosition`, `galleryOpen`, `toastVisible`.
- Don't introduce a new state library.

### File structure

Add these new files; preserve the existing structure:

```
src/
├── components/
│   ├── scene/
│   │   ├── RotationAxis.tsx          // NEW
│   │   ├── Moon.tsx                  // NEW
│   │   ├── MoonSystem.tsx            // NEW — orchestrates moons per planet
│   │   ├── DissectedPlanet.tsx       // NEW
│   │   ├── BackgroundUniverse.tsx    // NEW — galaxies, nebulae, dust
│   │   └── TimelineScene.tsx         // NEW — manages scene state per timeline era
│   ├── ui/
│   │   ├── DissectButton.tsx         // NEW
│   │   ├── NASAGallery.tsx           // NEW
│   │   ├── TimelineScrubber.tsx      // NEW
│   │   └── ComingSoonToast.tsx       // NEW
├── data/
│   ├── moons.ts                      // NEW — moon data
│   ├── planetLayers.ts               // NEW — dissection data per planet
│   ├── axialTilts.ts                 // NEW
│   └── timelineMilestones.ts         // NEW
├── lib/
│   ├── nasaImages.ts                 // NEW — wraps the images-api.nasa.gov calls
│   └── orbital.ts                    // (existing) — extend with moon orbits
```

---

## Final Instructions for Claude Code

1. Read this entire document first. Don't start coding until you've read it.
2. Summarize the 9 features back to me in your own words, in one paragraph each. Confirm you understand the scope.
3. Identify any features that conflict with the existing codebase or any dependencies between features (e.g. Feature 3 depends on Feature 1 being done first).
4. Ask any clarifying questions before writing code.
5. Build the features in the listed order (1 through 9). After each feature is working: run the dev server, verify it visually, commit with a clear message, then ask permission to move to the next feature.
6. If you hit an unclear design decision, ask — don't guess.
7. If something doesn't work after two attempts, stop and report what you tried.
8. **Do not remove or break any existing v1 functionality.** Every existing feature (orbital scene, AI chat, APOD landing, asteroid belt) must still work after v2 ships.

Begin by reading, summarizing, and asking your questions.
