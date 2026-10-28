import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { IslandId } from '@/data/types';

export type Phase = 'loading' | 'welcome' | 'flyIn' | 'world';
export type Quality = 'high' | 'low';

export interface WorldState {
  phase: Phase;
  focused: IslandId | null;
  /** Last clicked interactive object (Phase 5). */
  activeObject: string | null;
  /** Object glowing because its achievement is hovered in the panel (Phase 5). */
  hintObject: string | null;
  sound: boolean;
  quality: Quality;
  /** Persisted across visits. */
  visited: IslandId[];
  /** Persisted across visits. */
  found: string[];

  setPhase: (phase: Phase) => void;
  enter: (withSound: boolean) => void;
  focus: (id: IslandId) => void;
  back: () => void;
  activateObject: (id: string) => void;
  setHint: (id: string | null) => void;
  toggleSound: () => void;
  setQuality: (quality: Quality) => void;
}

/** Storage that never throws: private windows and blocked storage just skip persistence. */
const safeStorage = createJSONStorage(() => {
  try {
    const probe = '__sky_cv_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    };
  }
});

const addOnce = <T>(list: T[], item: T) => (list.includes(item) ? list : [...list, item]);

export const useWorld = create<WorldState>()(
  persist(
    (set) => ({
      // Phase 3 adds the welcome screen and fly-in. Until then the world starts ready.
      phase: 'world',
      focused: null,
      activeObject: null,
      hintObject: null,
      sound: false,
      quality: 'high',
      visited: [],
      found: [],

      setPhase: (phase) => set({ phase }),
      enter: (withSound) => set({ phase: 'flyIn', sound: withSound }),
      focus: (id) =>
        set((s) =>
          s.focused === id
            ? s
            : {
                focused: id,
                activeObject: null,
                hintObject: null,
                visited: addOnce(s.visited, id),
              },
        ),
      back: () =>
        set((s) =>
          s.focused === null ? s : { focused: null, activeObject: null, hintObject: null },
        ),
      activateObject: (id) => set((s) => ({ activeObject: id, found: addOnce(s.found, id) })),
      setHint: (hintObject) => set({ hintObject }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setQuality: (quality) => set({ quality }),
    }),
    {
      name: 'sky-cv',
      version: 1,
      storage: safeStorage,
      partialize: (s) => ({ visited: s.visited, found: s.found }),
    },
  ),
);
