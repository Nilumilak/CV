import type { Vec3 } from '@/data/types';

const params = new URLSearchParams(window.location.search);

/** Debug tools (leva, r3f-perf) are enabled by adding ?debug to the address. */
export const isDebug = params.has('debug');

function parseVec3(value: string | null): Vec3 | undefined {
  if (!value) return undefined;
  const parts = value.split(',').map(Number);
  return parts.length === 3 && parts.every(Number.isFinite) ? (parts as Vec3) : undefined;
}

/**
 * Optional camera override for screenshots and tuning:
 * ?cam=0,12,48&look=0,0,0
 */
export const debugCamera = {
  position: parseVec3(params.get('cam')),
  target: parseVec3(params.get('look')),
};
