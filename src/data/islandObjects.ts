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
  // Market Town (design: docs/plan/islands/market.md)
  { id: 'mone-pdl', label: 'PDL app', name: 'the fountain', cue: 'coins' },
  { id: 'mone-nextjs', label: 'Next.js migration', name: 'the old shack', cue: 'whirr' },
  { id: 'mone-bnpl', label: 'BNPL flows', name: 'the tram', cue: 'bell' },
  { id: 'mone-account', label: 'Account areas', name: 'the signpost', cue: 'whirr' },
  { id: 'mone-fsd', label: 'FSD and releases', name: 'the balloon', cue: 'hum' },
  { id: 'mone-packages', label: 'UI kit and API core', name: 'the crane', cue: 'knock' },
  // Arena (design: docs/plan/islands/arena.md)
  { id: 'olimp-apps', label: '3 apps, team of 6', name: 'the winners podium', cue: 'chime' },
  { id: 'olimp-preact', label: 'Bundle −40%', name: 'the winged shoe', cue: 'whirr' },
  { id: 'olimp-virtual', label: 'Virtual scrolling', name: 'the scoreboard', cue: 'whirr' },
  { id: 'olimp-iframe', label: 'iframe messages', name: 'the team booths', cue: 'beep' },
  // Green Grove (design: docs/plan/islands/grove.md)
  { id: 'eco-lead', label: 'Led the team', name: 'the recycling bins', cue: 'knock' },
  { id: 'eco-build', label: 'Frontend, APIs, mentoring', name: 'the saplings', cue: 'chime' },
  { id: 'eco-payments', label: 'ЮKassa payments', name: 'the collection box', cue: 'coins' },
  { id: 'eco-admin', label: 'Admin-editable content', name: 'the noticeboard', cue: 'paper' },
  // Workshop (design: docs/plan/islands/workshop.md)
  { id: 'salyut-lead', label: 'Led 5+ projects', name: 'the steam whistle', cue: 'bell' },
  { id: 'salyut-projects', label: '30+ projects', name: 'the oscilloscope', cue: 'beep' },
  {
    id: 'salyut-assemblies',
    label: '100+ element assemblies',
    name: 'the circuit board',
    cue: 'chime',
  },
  { id: 'salyut-macros', label: 'Python macros', name: 'the scroll', cue: 'paper' },
  // Lighthouse (design: docs/plan/islands/lighthouse.md)
  { id: 'kafka-auth', label: 'Authorization page', name: 'the lighthouse', cue: 'hum' },
] as const satisfies readonly IslandObject[];

export type IslandObjectId = (typeof ISLAND_OBJECTS)[number]['id'];

export const islandObject = (id: IslandObjectId): IslandObject =>
  ISLAND_OBJECTS.find((o) => o.id === id)!;

/** The object for an achievement, if its island has one yet. */
export const objectForAchievement = (achievementId: string): IslandObject | undefined =>
  ISLAND_OBJECTS.find((o) => o.id === achievementId);
