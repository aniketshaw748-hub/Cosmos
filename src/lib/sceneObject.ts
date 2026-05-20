import type { BodyDef, SceneObject } from '../types';

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
