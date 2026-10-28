import { ISLAND_IDS, type IslandId } from '@/data/types';

/**
 * Hash routes work on any static host without server rewrites.
 *   #/ or empty  overview
 *   #/radio      focus an island
 *   #/cv         classic CV
 */
export type Route = { view: 'cv' } | { view: 'world'; island: IslandId | null };

export function parseHash(hash: string): Route {
  const part = hash.replace(/^#\/?/, '').replace(/\/$/, '').toLowerCase();
  if (part === 'cv') return { view: 'cv' };
  const isIsland = (ISLAND_IDS as readonly string[]).includes(part);
  return { view: 'world', island: isIsland ? (part as IslandId) : null };
}

export function toHash(route: Route): string {
  return route.view === 'cv' ? '#/cv' : `#/${route.island ?? ''}`;
}

/** Treat "", "#" and "#/" as the same address. */
export function sameHash(a: string, b: string): boolean {
  return toHash(parseHash(a)) === toHash(parseHash(b));
}
