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
}

/** Every interactive object on the career islands. Home has its own list (homeObjects.ts). */
export const ISLAND_OBJECTS = [
  // Radio Tower (design: docs/plan/islands/radio.md)
  { id: 'radio-llm', label: 'LLM test generator', name: 'the robot' },
  { id: 'radio-platform', label: 'Test platform', name: 'the bunker lab' },
  { id: 'radio-ui', label: 'Framework UI', name: 'the screen' },
  { id: 'radio-services', label: '5 services', name: 'the satellite dish' },
  { id: 'radio-backend', label: 'Backend and tests', name: 'the containers' },
  // Market Town (design: docs/plan/islands/market.md)
  { id: 'mone-pdl', label: 'PDL app', name: 'the fountain' },
  { id: 'mone-nextjs', label: 'Next.js migration', name: 'the new shop' },
  { id: 'mone-bnpl', label: 'BNPL flows', name: 'the tram' },
  { id: 'mone-account', label: 'Account areas', name: 'the signpost' },
  { id: 'mone-fsd', label: 'FSD and releases', name: 'the balloon' },
  { id: 'mone-packages', label: 'UI kit and API core', name: 'the windmill' },
  // Arena (design: docs/plan/islands/arena.md)
  { id: 'olimp-apps', label: '3 apps, team of 6', name: 'the winners podium' },
  { id: 'olimp-preact', label: 'Bundle −40%', name: 'the winged shoe' },
  { id: 'olimp-virtual', label: 'Virtual scrolling', name: 'the scoreboard' },
  { id: 'olimp-iframe', label: 'iframe messages', name: 'the team booths' },
  // Green Grove (design: docs/plan/islands/grove.md)
  { id: 'eco-lead', label: 'Led the team', name: 'the recycling bins' },
  { id: 'eco-build', label: 'Frontend, APIs, mentoring', name: 'the saplings' },
  { id: 'eco-payments', label: 'YooKassa payments', name: 'the collection box' },
  { id: 'eco-admin', label: 'Admin-editable content', name: 'the noticeboard' },
  // Workshop (design: docs/plan/islands/workshop.md)
  { id: 'salyut-lead', label: 'Led 5+ projects', name: 'the steam whistle' },
  { id: 'salyut-projects', label: '30+ projects', name: 'the oscilloscope' },
  {
    id: 'salyut-assemblies',
    label: '100+ element assemblies',
    name: 'the circuit board',
  },
  { id: 'salyut-macros', label: 'Python macros', name: 'the scroll' },
  // Lighthouse (design: docs/plan/islands/lighthouse.md)
  { id: 'kafka-auth', label: 'Authorization page', name: 'the lighthouse' },
] as const satisfies readonly IslandObject[];

export type IslandObjectId = (typeof ISLAND_OBJECTS)[number]['id'];

export const islandObject = (id: IslandObjectId): IslandObject =>
  ISLAND_OBJECTS.find((o) => o.id === id)!;

/** The object for an achievement, if its island has one yet. */
export const objectForAchievement = (achievementId: string): IslandObject | undefined =>
  ISLAND_OBJECTS.find((o) => o.id === achievementId);
