import type { IslandId } from '@/data/types';

/**
 * DOM label elements, keyed by island. Labels live in the normal page (see ui/IslandLabels),
 * and LabelProjector moves them every frame to their island's position on screen.
 * This avoids drei <Html>, which creates a separate React root per label.
 */
export const labelElements = new Map<IslandId, HTMLElement>();

export function registerLabel(id: IslandId, el: HTMLElement | null) {
  if (el) labelElements.set(id, el);
  else labelElements.delete(id);
}
