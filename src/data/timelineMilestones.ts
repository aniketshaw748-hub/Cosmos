/** Visual era the scene shows for a given milestone (Feature 7). */
export type Era =
  | 'nebula'
  | 'ignition'
  | 'disk'
  | 'forming'
  | 'collision'
  | 'bombardment'
  | 'life'
  | 'modern';

export interface Milestone {
  id: string;
  label: string;
  /** display date */
  date: string;
  description: string;
  era: Era;
}

/** The 14 milestones of solar-system history, oldest first. */
export const MILESTONES: Milestone[] = [
  {
    id: 'nebula',
    label: 'The Solar Nebula',
    date: '4.6 billion years ago',
    description: 'A vast cloud of gas and dust collapses under its own gravity.',
    era: 'nebula',
  },
  {
    id: 'sun-ignites',
    label: 'The Sun Ignites',
    date: '4.6 billion years ago',
    description: "Fusion begins at the cloud's center — the Sun is born.",
    era: 'ignition',
  },
  {
    id: 'disk',
    label: 'Protoplanetary Disk',
    date: '4.55 billion years ago',
    description: 'A spinning disk of debris forms around the young Sun.',
    era: 'disk',
  },
  {
    id: 'planets-form',
    label: 'The Planets Form',
    date: '4.5 billion years ago',
    description: 'Dust grains collide and grow into planetesimals, then into planets.',
    era: 'forming',
  },
  {
    id: 'theia',
    label: 'The Theia Impact',
    date: '4.5 billion years ago',
    description: 'A Mars-sized world strikes proto-Earth; the Moon forms from the debris.',
    era: 'collision',
  },
  {
    id: 'lhb',
    label: 'Late Heavy Bombardment',
    date: '4.1–3.8 billion years ago',
    description: 'A storm of asteroids batters the inner solar system.',
    era: 'bombardment',
  },
  {
    id: 'first-life',
    label: 'First Life',
    date: '3.8 billion years ago',
    description: "The earliest microbial life appears in Earth's oceans.",
    era: 'life',
  },
  {
    id: 'oxygenation',
    label: 'Great Oxygenation Event',
    date: '2.4 billion years ago',
    description: 'Cyanobacteria flood the atmosphere with oxygen.',
    era: 'life',
  },
  {
    id: 'cambrian',
    label: 'Cambrian Explosion',
    date: '540 million years ago',
    description: 'Complex multicellular life diversifies rapidly.',
    era: 'modern',
  },
  {
    id: 'dinosaurs',
    label: 'Age of Dinosaurs Begins',
    date: '230 million years ago',
    description: 'Dinosaurs emerge and come to dominate the land.',
    era: 'modern',
  },
  {
    id: 'chicxulub',
    label: 'Chicxulub Impact',
    date: '66 million years ago',
    description: 'An asteroid strike wipes out the dinosaurs.',
    era: 'modern',
  },
  {
    id: 'humans',
    label: 'Modern Humans',
    date: '300,000 years ago',
    description: 'Homo sapiens emerge in Africa.',
    era: 'modern',
  },
  {
    id: 'space-age',
    label: 'The Space Age Begins',
    date: '1957',
    description: 'Sputnik 1 launches — humanity reaches space.',
    era: 'modern',
  },
  {
    id: 'today',
    label: 'Today',
    date: 'Present day',
    description: 'The solar system as we currently see it.',
    era: 'modern',
  },
];

/** The milestone (and its index) nearest a 0..1 timeline position. */
export function milestoneAt(position: number): { milestone: Milestone; index: number } {
  const clamped = Math.min(1, Math.max(0, position));
  const index = Math.round(clamped * (MILESTONES.length - 1));
  return { milestone: MILESTONES[index], index };
}

/** The 0..1 timeline position of a milestone index. */
export function positionForIndex(index: number): number {
  return index / (MILESTONES.length - 1);
}
