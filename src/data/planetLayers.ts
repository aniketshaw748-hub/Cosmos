/** A single interior layer of a planet (Feature 3 — Planet Dissection). */
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
