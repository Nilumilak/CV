import type { IslandId } from '@/data/types';

/** Small line icons for labels and menus. 24×24, drawn with currentColor. */
const PATHS: Record<IslandId, string> = {
  // cottage
  home: 'M4 11 12 4l8 7v9H4z M10 20v-5h4v5',
  // gear
  workshop:
    'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1 7 17 M17 7l2.1-2.1',
  // leaf
  grove: 'M5 19C5 10 11 5 20 4c0 9-5 15-14 15z M5 19l8-8',
  // antenna with waves
  radio:
    'M12 10v11 M8 21h8 M12 10l-3 11 M12 10l3 11 M8.5 6.5a5 5 0 0 1 7 0 M6 4a8.5 8.5 0 0 1 12 0',
  // stadium
  arena: 'M3 10c0-2.2 4-4 9-4s9 1.8 9 4v5c0 2.2-4 4-9 4s-9-1.8-9-4z M3 10c0 2.2 4 4 9 4s9-1.8 9-4',
  // coin
  market:
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.5-2.5-1.5 M12 6.5v1.5 M12 16v1.5',
  // lighthouse
  lighthouse: 'M10 21l1-12h2l1 12z M9 21h6 M10 9h4l-.5-3h-3z M12 6V4 M5 7l3 1 M19 7l-3 1',
};

export function IslandIcon({ id, size = 20 }: { id: IslandId; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[id]} />
    </svg>
  );
}
