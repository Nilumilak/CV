import type { SoundCue } from '@/audio/sound';

/**
 * An interactive object on a career island. Its id is the achievement it stands for,
 * so the panel can put a "Show me" button on exactly that achievement.
 */
export interface IslandObject {
  /** The achievement id from cv.ts. */
  id: string;
  /** Short hover hint on the island. */
  label: string;
  /** What the object is, for screen readers ("Show me the robot"). */
  name: string;
  cue: SoundCue;
}

/** Every interactive object on the career islands. Home has its own list (homeObjects.ts). */
export const ISLAND_OBJECTS = [
  // Radio Tower (design: docs/plan/islands/radio.md)
  { id: 'radio-llm', label: 'LLM test generator', name: 'the robot', cue: 'beep' },
  { id: 'radio-platform', label: 'Test platform', name: 'the bunker lab', cue: 'hum' },
  { id: 'radio-ui', label: 'Framework UI', name: 'the screen', cue: 'click' },
  { id: 'radio-services', label: '5 services', name: 'the satellite dish', cue: 'whirr' },
  { id: 'radio-backend', label: 'Backend and tests', name: 'the containers', cue: 'knock' },
] as const satisfies readonly IslandObject[];

export type IslandObjectId = (typeof ISLAND_OBJECTS)[number]['id'];

export const islandObject = (id: IslandObjectId): IslandObject =>
  ISLAND_OBJECTS.find((o) => o.id === id)!;

/** The object for an achievement, if its island has one yet. */
export const objectForAchievement = (achievementId: string): IslandObject | undefined =>
  ISLAND_OBJECTS.find((o) => o.id === achievementId);
