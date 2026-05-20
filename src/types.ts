/** What kind of object the user can select in the scene. */
export type BodyKind = 'star' | 'planet' | 'asteroid' | 'moon';

/** A single labelled fact shown in the info panel. */
export interface Stat {
  label: string;
  value: string;
}

/** Ring system config (Saturn). */
export interface RingConfig {
  /** inner radius in scene units */
  innerRadius: number;
  /** outer radius in scene units */
  outerRadius: number;
  /** radial colour strip texture */
  colorMap: string;
  /** radial alpha strip texture */
  alphaMap: string;
}

/** Hardcoded definition of the Sun or a planet (display values + real-world data). */
export interface BodyDef {
  id: string;
  name: string;
  kind: BodyKind;
  /** display radius, scene units (NOT real scale) */
  radius: number;
  /** display orbit radius, scene units (0 for the Sun) */
  orbitRadius: number;
  /** orbital speed relative to Earth (Earth = 1.0) */
  orbitSpeed: number;
  /** self-rotation speed (visual; negative = retrograde) */
  spinSpeed: number;
  /** axial tilt in radians */
  tilt: number;
  /** starting orbital phase in radians */
  phase: number;
  /** fallback colour if a texture fails to load */
  color: string;
  /** equirectangular surface texture */
  textureUrl?: string;
  /** night-side city-lights map (Earth) */
  nightUrl?: string;
  /** transparent cloud-layer texture (Earth) */
  cloudUrl?: string;
  /** self-lit body (the Sun) */
  emissive?: boolean;
  rings?: RingConfig;
  /** one-line description */
  blurb: string;
  /** real-world facts for the info panel */
  stats: Stat[];
  /** three starter questions for the AI tutor */
  suggestedQuestions: string[];
}

/** A currently-selected object, surfaced in the store, info panel and AI tutor. */
export interface SceneObject {
  id: string;
  name: string;
  kind: BodyKind;
  /** display radius — the camera rig uses it to pick a framing distance */
  radius: number;
  blurb: string;
  stats: Stat[];
  suggestedQuestions: string[];
  /** structured data handed to the AI tutor as context */
  aiContext: Record<string, unknown>;
  /** id of the parent planet, for moons */
  parentId?: string;
  /** world-space fallback position when the object isn't in the live registry */
  position?: [number, number, number];
}

/** A moon of a planet (Feature 4). */
export interface MoonData {
  id: string;
  name: string;
  parentId: string;
  parentName: string;
  /** display radius, scene units */
  displayRadius: number;
  /** orbit radius from the parent's centre, scene units */
  orbitRadius: number;
  /** real orbital period in days — drives relative orbital speed */
  periodDays: number;
  /** true for retrograde orbits (Triton) */
  retrograde?: boolean;
  /** starting orbital phase, radians */
  phase: number;
  /** surface tint */
  color: string;
  surface: 'rocky' | 'icy' | 'haze';
  diameterKm: number;
  blurb: string;
}

/** NASA Astronomy Picture of the Day (normalised by /api/apod). */
export interface ApodData {
  title: string;
  explanation: string;
  url: string;
  hdurl: string | null;
  mediaType: string;
  thumbnailUrl: string | null;
  date: string;
  copyright: string | null;
}

/** A single near-Earth object (normalised by /api/neo). */
export interface NeoData {
  id: string;
  name: string;
  diameterMeters: number;
  hazardous: boolean;
  missDistanceKm: number;
  velocityKph: number;
  approachDate: string;
  magnitude: number | null;
}

/** The near-Earth object feed for a single day. */
export interface NeoFeed {
  date: string;
  count: number;
  asteroids: NeoData[];
}

/** A single turn in an AI tutor conversation. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
