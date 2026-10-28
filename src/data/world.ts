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
  position: [target[0] + 10, target[1] + 7, target[2] + 18],
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

/**
 * The fly-in path, from high above the clouds down to the overview pose.
 * The welcome screen shows the view from the first point.
 * The camera passes through the cloud band in CloudLayers (FLY_IN_CLOUD_BAND) on the way.
 */
export const FLY_IN_POINTS: Vec3[] = [
  [0, 105, 200],
  [-6, 80, 160],
  [-4, 52, 118],
  [6, 34, 88],
  [4, 24, 66],
  OVERVIEW.position,
];

/** Height and depth of the sea of clouds under the welcome view. */
export const FLY_IN_CLOUD_BAND = { y: 50, z: 120 } as const;

/**
 * One dense cloud sitting right on the dive path. It hides the islands until the camera
 * bursts out of it, and the white veil peaks while the camera is inside.
 */
export const FLY_IN_CLOUD: { position: Vec3; size: Vec3; radius: number } = {
  position: [0, 46, 104],
  size: [60, 30, 44],
  radius: 26,
};
