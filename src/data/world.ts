import type { IslandId, IslandLayout, Vec3 } from './types';

/**
 * Where everything sits in 3D. Rough values for now, tuned in Phase 2.
 * Career islands arc behind Home from left (oldest) to right (newest).
 */

export const OVERVIEW: { position: Vec3; target: Vec3 } = {
  position: [0, 18, 52],
  target: [0, 0, 0],
};

const islandCamera = (target: Vec3): IslandLayout['camera'] => ({
  position: [target[0] + 8, target[1] + 6, target[2] + 14],
  target,
});

export const ISLANDS: IslandLayout[] = [
  {
    id: 'home',
    position: [0, 0, 16],
    scale: 1.2,
    seed: 1,
    labelOffset: [0, 5.2, 0],
    camera: islandCamera([0, 1, 16]),
    accent: '#E08A3C',
  },
  {
    id: 'workshop',
    position: [-30, 3, -8],
    scale: 1,
    seed: 2,
    labelOffset: [0, 7, 0],
    camera: islandCamera([-30, 4, -8]),
    accent: '#B8733A',
  },
  {
    id: 'grove',
    position: [-18, -2, -16],
    scale: 1,
    seed: 3,
    labelOffset: [0, 7, 0],
    camera: islandCamera([-18, -1, -16]),
    accent: '#4E8B3A',
  },
  {
    id: 'radio',
    position: [0, 4, -22],
    scale: 1.1,
    seed: 4,
    labelOffset: [0, 9, 0],
    camera: islandCamera([0, 5, -22]),
    accent: '#F3C25B',
  },
  {
    id: 'arena',
    position: [18, -1, -16],
    scale: 1,
    seed: 5,
    labelOffset: [0, 7, 0],
    camera: islandCamera([18, 0, -16]),
    accent: '#3C7DD9',
  },
  {
    id: 'market',
    position: [30, 5, -8],
    scale: 1.2,
    seed: 6,
    labelOffset: [0, 10, 0],
    camera: islandCamera([30, 6, -8]),
    accent: '#C9573E',
  },
  {
    id: 'lighthouse',
    position: [-19, -6, 13],
    scale: 0.6,
    seed: 7,
    labelOffset: [0, 6, 0],
    camera: islandCamera([-19, -5, 13]),
    accent: '#D94B4B',
  },
];

export function layoutOf(id: IslandId): IslandLayout {
  const layout = ISLANDS.find((i) => i.id === id);
  if (!layout) throw new Error(`No layout for island "${id}"`);
  return layout;
}
