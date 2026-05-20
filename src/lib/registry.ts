import type { Object3D } from 'three';

/**
 * Live registry of selectable 3D objects, keyed by id. The camera rig reads an
 * object's current world position from here so it can smoothly follow planets
 * as they orbit. Instanced asteroids are not registered — for those the camera
 * falls back to the snapshot `position` stored on the SceneObject.
 */
const registry = new Map<string, Object3D>();

export function registerObject(id: string, object: Object3D): void {
  registry.set(id, object);
}

export function unregisterObject(id: string): void {
  registry.delete(id);
}

export function getObject(id: string): Object3D | undefined {
  return registry.get(id);
}
