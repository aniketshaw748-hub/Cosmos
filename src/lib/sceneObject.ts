import type { BodyDef, MoonData, NeoData, SceneObject, Stat } from '../types';

/** Converts a hardcoded body definition into a selectable SceneObject. */
export function bodyToSceneObject(body: BodyDef): SceneObject {
  return {
    id: body.id,
    name: body.name,
    kind: body.kind,
    radius: body.radius,
    blurb: body.blurb,
    stats: body.stats,
    suggestedQuestions: body.suggestedQuestions,
    aiContext: {
      name: body.name,
      type: body.kind,
      description: body.blurb,
      ...Object.fromEntries(body.stats.map((s) => [s.label, s.value])),
    },
  };
}

/** Converts a live near-Earth object into a selectable SceneObject. */
export function neoToSceneObject(
  neo: NeoData,
  displayRadius: number,
  position: [number, number, number],
): SceneObject {
  const stats: Stat[] = [
    { label: 'Estimated diameter', value: `${Math.round(neo.diameterMeters).toLocaleString()} m` },
    { label: 'Miss distance', value: `${Math.round(neo.missDistanceKm).toLocaleString()} km` },
    { label: 'Relative velocity', value: `${Math.round(neo.velocityKph).toLocaleString()} km/h` },
    { label: 'Close approach', value: neo.approachDate },
    { label: 'Potentially hazardous', value: neo.hazardous ? 'Yes — monitored' : 'No' },
  ];

  return {
    id: `neo-${neo.id}`,
    name: neo.name,
    kind: 'asteroid',
    radius: displayRadius,
    blurb: `A near-Earth asteroid tracked by NASA on its close approach to our planet.`,
    stats,
    suggestedQuestions: [
      'How dangerous is this asteroid, really?',
      'What is an asteroid like this made of?',
      'What would happen if it hit Earth?',
    ],
    aiContext: {
      name: neo.name,
      type: 'near-Earth asteroid',
      description: 'A real asteroid from NASA’s near-Earth object feed.',
      ...Object.fromEntries(stats.map((s) => [s.label, s.value])),
    },
    position,
  };
}

/** Converts a moon into a selectable SceneObject. */
export function moonToSceneObject(
  moon: MoonData,
  position: [number, number, number],
): SceneObject {
  const period =
    moon.periodDays < 1
      ? `${(moon.periodDays * 24).toFixed(1)} hours`
      : `${moon.periodDays.toFixed(1)} days`;
  const surface =
    moon.surface === 'haze' ? 'Hazy atmosphere' : moon.surface === 'icy' ? 'Icy' : 'Rocky';
  const stats: Stat[] = [
    { label: 'Diameter', value: `${moon.diameterKm.toLocaleString()} km` },
    { label: 'Orbital period', value: `${moon.retrograde ? 'retrograde ' : ''}${period}` },
    { label: 'Parent planet', value: moon.parentName },
    { label: 'Surface', value: surface },
  ];

  return {
    id: `moon-${moon.id}`,
    name: moon.name,
    kind: 'moon',
    radius: moon.displayRadius,
    blurb: moon.blurb,
    stats,
    suggestedQuestions: [
      `What makes ${moon.name} special?`,
      `Could there be life on ${moon.name}?`,
      `How did ${moon.name} form?`,
    ],
    aiContext: {
      name: moon.name,
      type: `moon of ${moon.parentName}`,
      description: moon.blurb,
      ...Object.fromEntries(stats.map((s) => [s.label, s.value])),
    },
    parentId: moon.parentId,
    position,
  };
}
