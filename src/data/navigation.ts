import { chapters } from './cv';
import type { Chapter, IslandId } from './types';

/** Reading order for Previous / Next: Home first, then the career in timeline order. */
export const ISLAND_ORDER: IslandId[] = ['home', ...chapters.map((c) => c.id)];

export function neighbours(id: IslandId): { prev: IslandId | null; next: IslandId | null } {
  const i = ISLAND_ORDER.indexOf(id);
  return {
    prev: i > 0 ? ISLAND_ORDER[i - 1] : null,
    next: i >= 0 && i < ISLAND_ORDER.length - 1 ? ISLAND_ORDER[i + 1] : null,
  };
}

export function chapterOf(id: IslandId): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

/** "2022 – now", "2015 – 2020" */
export function yearsOf(c: Pick<Chapter, 'start' | 'end'>): string {
  const from = c.start.slice(0, 4);
  const to = c.end ? c.end.slice(0, 4) : 'now';
  return from === to ? from : `${from} – ${to}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Nov 2022 – Present" */
export function datesOf(c: Pick<Chapter, 'start' | 'end'>): string {
  const fmt = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
  return `${fmt(c.start)} – ${c.end ? fmt(c.end) : 'Present'}`;
}
