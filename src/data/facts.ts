import type { SceneObject } from '../types';

/**
 * Static fallback facts, used when the AI tutor is unreachable so the
 * experience never feels broken. Written in the Cosmos voice.
 */
export const FALLBACK_FACTS: Record<string, string> = {
  sun: "The Sun isn't burning like a campfire — it's fusing hydrogen into helium under crushing pressure, turning four million tonnes of itself into pure energy every single second. That light takes about eight minutes to reach you, so you always see the Sun as it was, never quite as it is.",
  mercury:
    'Mercury is a world of extremes. With almost no atmosphere to hold heat, its daytime side roasts near 430°C while its night side plunges below −170°C. Strangely, a single day there — one sunrise to the next — lasts longer than its entire 88-day year.',
  venus:
    'Venus is what a greenhouse effect looks like when it runs completely wild. A thick blanket of carbon dioxide traps so much heat that the surface sits around 465°C — hot enough to melt lead, and hotter than Mercury even though Venus is farther from the Sun.',
  earth:
    "Earth sits in the 'Goldilocks zone' — not too hot, not too cold — where water can stay liquid. Pair that with a protective magnetic field and a breathable atmosphere, and you get the only place in the known universe where life has ever taken hold.",
  mars: "Mars is red because it is, quite literally, rusting. Its soil is loaded with iron, and over billions of years that iron reacted with oxygen to form iron oxide — the same compound as the rust on an old bike. A fine rusty dust now coats the whole planet.",
  jupiter:
    'Jupiter is the Solar System’s giant — so massive that every other planet could fit inside it with room to spare. Its Great Red Spot is a single storm wider than Earth that has been spinning for centuries.',
  saturn:
    "Saturn's rings look solid but they're built from countless chunks of ice and rock, most no larger than a house. They span about 280,000 km yet are often only around 10 metres thick. Saturn itself is so light it would float in a big enough bathtub.",
  uranus:
    'Uranus orbits the Sun lying almost completely on its side, most likely knocked over by a colossal ancient collision. Because of that tilt, each pole gets 42 years of continuous sunlight followed by 42 years of darkness.',
  neptune:
    'Neptune was discovered with mathematics before anyone ever saw it — astronomers predicted exactly where to look from the way it tugged on Uranus. It also has the fastest winds in the Solar System, screaming along at up to 2,000 km/h.',
  asteroid:
    'Asteroids are leftover rubble from the birth of the Solar System 4.6 billion years ago — building blocks that never quite became a planet. NASA tracks the ones that pass near Earth very closely, but the overwhelming majority drift by at a safe, comfortable distance.',
};

/** Returns a fallback fact for an object, by id, kind, or its blurb. */
export function getFallbackFact(object: SceneObject): string {
  if (FALLBACK_FACTS[object.id]) return FALLBACK_FACTS[object.id];
  if (object.kind === 'asteroid') return FALLBACK_FACTS.asteroid;
  return object.blurb;
}
