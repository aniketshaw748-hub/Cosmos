import type { MoonData } from '../types';

/** A single interior layer of a body (Feature 3 — Dissection). */
export interface PlanetLayer {
  name: string;
  description: string;
  color: string;
  /** outer radius of this layer as a fraction of the planet's radius */
  outer: number;
}

export interface LayerSet {
  /** layers ordered outermost first */
  layers: PlanetLayer[];
  /** gas giants — interior is modelled, not directly observed */
  estimated: boolean;
}

/** Interior structure per planet. Thicknesses are roughly proportional to reality. */
export const PLANET_LAYERS: Record<string, LayerSet> = {
  mercury: {
    estimated: false,
    layers: [
      { name: 'Crust', description: 'A thin, cratered silicate shell.', color: '#8a8378', outer: 1.0 },
      { name: 'Mantle', description: 'A relatively thin rocky mantle.', color: '#6b5a48', outer: 0.86 },
      { name: 'Liquid Outer Core', description: 'Molten iron — unusually large.', color: '#d9772e', outer: 0.8 },
      { name: 'Solid Iron Inner Core', description: 'A dense, solid iron heart.', color: '#ffd24a', outer: 0.4 },
    ],
  },
  venus: {
    estimated: false,
    layers: [
      { name: 'Basaltic Crust', description: 'Young volcanic rock, resurfaced often.', color: '#9a8052', outer: 1.0 },
      { name: 'Rocky Mantle', description: 'A hot silicate mantle driving volcanism.', color: '#8a5a36', outer: 0.95 },
      { name: 'Iron Core', description: 'A large metallic core, partly molten.', color: '#ff9a3c', outer: 0.55 },
    ],
  },
  earth: {
    estimated: false,
    layers: [
      { name: 'Crust', description: 'Thin continental + oceanic shell.', color: '#3f7d52', outer: 1.0 },
      { name: 'Upper Mantle', description: 'Partly soft rock that drives plate tectonics.', color: '#c1701f', outer: 0.985 },
      { name: 'Lower Mantle', description: 'Hot, slow-flowing solid rock — the bulk of Earth.', color: '#8f4a17', outer: 0.85 },
      { name: 'Liquid Outer Core', description: 'Swirling iron-nickel that generates our magnetic field.', color: '#ff5a2a', outer: 0.545 },
      { name: 'Solid Inner Core', description: 'A solid iron-nickel ball as hot as the Sun’s surface.', color: '#ffe14d', outer: 0.19 },
    ],
  },
  mars: {
    estimated: false,
    layers: [
      { name: 'Basaltic Crust', description: 'A thick, ancient volcanic crust.', color: '#b5532a', outer: 1.0 },
      { name: 'Silicate Mantle', description: 'A rigid rocky mantle — little tectonic activity.', color: '#7a3b22', outer: 0.97 },
      { name: 'Iron-Sulfur Core', description: 'A large, partly liquid iron-sulfur core.', color: '#ffb24a', outer: 0.5 },
    ],
  },
  jupiter: {
    estimated: true,
    layers: [
      { name: 'Atmosphere', description: 'The visible banded cloud layers.', color: '#d9a066', outer: 1.0 },
      { name: 'Liquid Molecular Hydrogen', description: 'Hydrogen squeezed into a vast ocean.', color: '#c98f5a', outer: 0.9 },
      { name: 'Metallic Hydrogen', description: 'Hydrogen so compressed it conducts like a metal.', color: '#9a6b8f', outer: 0.78 },
      { name: 'Dense Core', description: 'A possibly rocky/icy core, partly dissolved.', color: '#6a4a3a', outer: 0.15 },
    ],
  },
  saturn: {
    estimated: true,
    layers: [
      { name: 'Atmosphere', description: 'Pale golden hydrogen-helium cloud layers.', color: '#e3c98f', outer: 1.0 },
      { name: 'Liquid Hydrogen', description: 'A deep ocean of liquid hydrogen.', color: '#cdb277', outer: 0.9 },
      { name: 'Metallic Hydrogen', description: 'Pressurised hydrogen behaving like a metal.', color: '#9a7b9a', outer: 0.6 },
      { name: 'Rocky Core', description: 'A dense rock-and-ice core.', color: '#6a5240', outer: 0.25 },
    ],
  },
  uranus: {
    estimated: true,
    layers: [
      { name: 'Hydrogen-Helium Atmosphere', description: 'A cold, hazy outer atmosphere.', color: '#9fe0e8', outer: 1.0 },
      { name: 'Icy Mantle', description: 'A hot, dense fluid of water, methane and ammonia ices.', color: '#7fb6c9', outer: 0.8 },
      { name: 'Rocky Core', description: 'A small rock-and-metal core.', color: '#5a5048', outer: 0.3 },
    ],
  },
  neptune: {
    estimated: true,
    layers: [
      { name: 'Hydrogen-Helium-Methane Atmosphere', description: 'A vivid blue, storm-wracked atmosphere.', color: '#3b6bd8', outer: 1.0 },
      { name: 'Icy Mantle', description: 'A super-hot fluid of water, ammonia and methane ices.', color: '#3f6fb0', outer: 0.8 },
      { name: 'Rocky Core', description: 'An Earth-mass rock-and-metal core.', color: '#574e46', outer: 0.3 },
    ],
  },
};

/** A generic icy moon — icy crust, ice-rock mantle, small rock core. */
const GENERIC_ICY_MOON: LayerSet = {
  estimated: true,
  layers: [
    { name: 'Icy Crust', description: 'A shell of frozen water ice.', color: '#dfe7ec', outer: 1.0 },
    { name: 'Ice-Rock Mantle', description: 'A deep mix of ice and rock.', color: '#8fa3ad', outer: 0.9 },
    { name: 'Rocky Core', description: 'A small core of compressed rock.', color: '#6a5d4f', outer: 0.45 },
  ],
};

/** A generic rocky moon — cratered crust, rock-ice mantle, dense core. */
const GENERIC_ROCKY_MOON: LayerSet = {
  estimated: true,
  layers: [
    { name: 'Cratered Crust', description: 'An ancient, impact-scarred surface.', color: '#9a8f82', outer: 1.0 },
    { name: 'Rock-Ice Mantle', description: 'Solid rock mixed with ice.', color: '#6f6358', outer: 0.9 },
    { name: 'Dense Core', description: 'A core of compressed rock and metal.', color: '#5a4a3c', outer: 0.4 },
  ],
};

/** Interior structure for the scientifically distinctive moons. */
const SPECIFIC_MOON_LAYERS: Record<string, LayerSet> = {
  luna: {
    estimated: false,
    layers: [
      { name: 'Crust', description: 'A thin, dusty anorthosite crust.', color: '#b9b2a6', outer: 1.0 },
      { name: 'Mantle', description: 'Solid silicate rock — the bulk of the Moon.', color: '#776a59', outer: 0.99 },
      { name: 'Partly-Molten Layer', description: 'A soft, partially molten boundary layer.', color: '#c8702e', outer: 0.45 },
      { name: 'Solid Iron Core', description: 'A small solid iron core.', color: '#ffce5a', outer: 0.2 },
    ],
  },
  io: {
    estimated: false,
    layers: [
      { name: 'Sulfur-rich Crust', description: 'A crust constantly repaved by volcanism.', color: '#e8d24a', outer: 1.0 },
      { name: 'Molten Silicate Mantle', description: 'A global magma layer of partly molten rock.', color: '#c5532a', outer: 0.95 },
      { name: 'Iron-Sulfide Core', description: 'A large, dense metallic core.', color: '#ffb24a', outer: 0.5 },
    ],
  },
  europa: {
    estimated: true,
    layers: [
      { name: 'Icy Crust', description: 'A cracked outer shell of water ice.', color: '#e3ddcd', outer: 1.0 },
      { name: 'Subsurface Ocean', description: 'A deep global ocean of liquid saltwater.', color: '#2f7fb5', outer: 0.92 },
      { name: 'Rocky Mantle', description: 'A silicate rock mantle.', color: '#6f5a44', outer: 0.7 },
      { name: 'Iron Core', description: 'A dense metallic core.', color: '#ffb24a', outer: 0.35 },
    ],
  },
  ganymede: {
    estimated: true,
    layers: [
      { name: 'Icy Crust', description: 'An outer shell of water ice.', color: '#cfc8bc', outer: 1.0 },
      { name: 'Ocean & Ice Layers', description: 'Stacked layers of ice and liquid water.', color: '#3a86b0', outer: 0.9 },
      { name: 'Rocky Mantle', description: 'A silicate rock mantle.', color: '#6f5f4c', outer: 0.6 },
      { name: 'Iron Core', description: 'A molten iron core — it generates a magnetic field.', color: '#ffb24a', outer: 0.3 },
    ],
  },
  callisto: {
    estimated: true,
    layers: [
      { name: 'Icy-Rock Crust', description: 'An ancient crust of ice and rock.', color: '#8a8076', outer: 1.0 },
      { name: 'Mixed Ice-Rock Interior', description: 'A barely-separated blend of ice and rock.', color: '#5f574c', outer: 0.95 },
      { name: 'Compressed Rock Core', description: 'A partial core of denser rock.', color: '#4a4036', outer: 0.45 },
    ],
  },
  titan: {
    estimated: true,
    layers: [
      { name: 'Icy Crust', description: 'A crust of water ice beneath the haze.', color: '#d8c19a', outer: 1.0 },
      { name: 'Subsurface Ocean', description: 'A hidden ocean of water and ammonia.', color: '#3a7fa8', outer: 0.9 },
      { name: 'High-Pressure Ice', description: 'A layer of dense, exotic ice.', color: '#9aa6ad', outer: 0.7 },
      { name: 'Rocky Core', description: 'A core of hydrated silicate rock.', color: '#6a5a44', outer: 0.4 },
    ],
  },
  enceladus: {
    estimated: true,
    layers: [
      { name: 'Icy Crust', description: 'A bright shell of fresh water ice.', color: '#ffffff', outer: 1.0 },
      { name: 'Global Ocean', description: 'A worldwide ocean that feeds its geysers.', color: '#3a8fc0', outer: 0.85 },
      { name: 'Rocky Core', description: 'A porous, warm rocky core.', color: '#6a5a48', outer: 0.5 },
    ],
  },
  triton: {
    estimated: true,
    layers: [
      { name: 'Icy Crust', description: 'A crust of nitrogen and water ice.', color: '#dcc6d2', outer: 1.0 },
      { name: 'Possible Subsurface Ocean', description: 'A likely hidden layer of liquid water.', color: '#3a7fa8', outer: 0.85 },
      { name: 'Rocky Core', description: 'A large core of rock and metal.', color: '#6a5a4a', outer: 0.55 },
    ],
  },
  phobos: {
    estimated: true,
    layers: [
      { name: 'Dusty Regolith', description: 'A deep blanket of fine dust and grit.', color: '#9a8d7c', outer: 1.0 },
      { name: 'Fractured Rubble', description: 'A loose pile of shattered rock held together by gravity.', color: '#6a5f50', outer: 0.85 },
    ],
  },
  deimos: {
    estimated: true,
    layers: [
      { name: 'Dusty Regolith', description: 'A smooth blanket of fine dust.', color: '#a89a86', outer: 1.0 },
      { name: 'Fractured Rubble', description: 'A loose interior of broken rock.', color: '#74695a', outer: 0.85 },
    ],
  },
};

/** Interior structure for a moon. */
export function moonLayers(moon: MoonData): LayerSet {
  return (
    SPECIFIC_MOON_LAYERS[moon.id] ??
    (moon.surface === 'icy' ? GENERIC_ICY_MOON : GENERIC_ROCKY_MOON)
  );
}

/** Generic interior of a small asteroid. */
export const ASTEROID_LAYERS: LayerSet = {
  estimated: true,
  layers: [
    { name: 'Dusty Regolith', description: 'A surface layer of dust and loose debris.', color: '#9a8b76', outer: 1.0 },
    { name: 'Fractured Rock', description: 'A shattered, porous rocky interior.', color: '#6f6253', outer: 0.9 },
    { name: 'Consolidated Core', description: 'A denser core of intact rock and metal.', color: '#564a3c', outer: 0.42 },
  ],
};

/** Interior structure of the Sun. */
export const SUN_LAYERS: LayerSet = {
  estimated: false,
  layers: [
    { name: 'Photosphere', description: 'The Sun’s visible surface.', color: '#ffd166', outer: 1.0 },
    { name: 'Convective Zone', description: 'Boiling plasma that carries heat to the surface.', color: '#ff9c3c', outer: 0.985 },
    { name: 'Radiative Zone', description: 'Energy creeps outward as radiation for ~100,000 years.', color: '#ffb84a', outer: 0.7 },
    { name: 'Core', description: 'Fusion turns hydrogen into helium at 15 million °C.', color: '#fff3c4', outer: 0.25 },
  ],
};
