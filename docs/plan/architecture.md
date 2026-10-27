# Architecture

[Back to plan](../../PLAN.md)

## Stack

Versions checked in October 2026. Always install the latest versions, but keep the major versions of three, R3F, drei and postprocessing compatible with each other.

| Concern          | Choice                                                | Notes                                                                                                      |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Runtime          | Node.js current LTS, 24 or newer                      | Node 20.11 is installed now. Current Vite needs 20.19 or newer, and Node 20 is end of life. Upgrade first. |
| Build            | Vite 8, React 19, TypeScript                          | React Three Fiber 9 needs React 19.                                                                        |
| 3D core          | `three` 0.18x, `@react-three/fiber` 9                 |                                                                                                            |
| 3D helpers       | `@react-three/drei` 10                                | CameraControls, Clouds, Html, Float, useGLTF, useProgress, Outlines, PerformanceMonitor, Instances         |
| Post effects     | `@react-three/postprocessing` 3 with `postprocessing` | Bloom, vignette, colour grading, depth of field                                                            |
| Frame animation  | `maath`                                               | `easing.damp` helpers inside `useFrame`                                                                    |
| DOM animation    | `motion` (formerly framer-motion)                     | Panels, buttons, welcome screen                                                                            |
| State            | `zustand` with `persist`                              | One store for the world, persisted visited islands and found objects                                       |
| Audio            | `howler`                                              | Uses Web Audio. iOS ignores the volume of plain audio elements, so fades need Web Audio.                   |
| Shader extension | `three-custom-shader-material` (optional)             | Wind on grass and trees while keeping toon lighting                                                        |
| Models           | Blender, GLB, `gltfjsx --transform`                   | Draco geometry, WebP textures, typed React components                                                      |
| Debug            | `leva`, `r3f-perf`                                    | Loaded only when the address has `?debug`                                                                  |
| Tests            | Vitest, Testing Library, Playwright                   | Unit tests for data and store, one browser smoke test                                                      |
| Hosting          | Vercel, or GitHub Pages                               | Static build, hash routing works on both                                                                   |

GSAP is not needed. CameraControls handles camera transitions, and the fly-in is a curve driven by `useFrame`. Add GSAP later only if a long multi-step timeline appears.

---

## Folder structure

```
public/
  cv.pdf
  audio/                 ambient.mp3, whoosh.mp3, click.mp3 ...
  draco/                 optional local Draco decoder
src/
  main.tsx
  App.tsx                chooses classic CV or 3D world, mounts overlay
  data/
    cv.ts                all CV content, typed
    world.ts             island positions, camera poses, themes
    types.ts
  store/
    useWorld.ts          zustand store
  routing/
    hash.ts              parse and build hash routes
    useHashSync.ts       keeps store and address bar in sync
  scenes/
    WorldCanvas.tsx      the Canvas, lazy loaded
    FlyIn.tsx
  world/
    SkyDome.tsx  CloudLayers.tsx  Lighting.tsx  Effects.tsx  Birds.tsx  Route.tsx
  islands/
    Island.tsx           shared wrapper: float, hover, click, label
    IslandLabel.tsx
    PlaceholderIsland.tsx
    home/  workshop/  grove/  radio/  arena/  market/  lighthouse/
  objects/
    Interactable.tsx     shared hover, click and glow behaviour
    ...                  reusable props such as Gear, Dish, Tram, Cat
  camera/
    CameraRig.tsx
  materials/
    toon.ts              gradient map and shared palette materials
  audio/
    sound.ts             howler wrapper
  ui/
    Overlay.tsx  Welcome.tsx  TopBar.tsx  IslandPanel.tsx  IslandMenu.tsx
    ClassicCV.tsx  WebGLFallback.tsx
  debug/
    Debug.tsx            leva and r3f-perf, dev only
  styles/
tests/
  e2e/smoke.spec.ts
reference/
  Renat_Kalimulin_CV.html   the original CV, kept for reference
```

---

## Data model

Content and layout are separate.
`cv.ts` holds what the CV says. `world.ts` holds where things are in 3D.
Updating the CV never requires touching 3D code.

```ts
// src/data/types.ts
export const ISLAND_IDS = [
  'home',
  'workshop',
  'grove',
  'radio',
  'arena',
  'market',
  'lighthouse',
] as const;

export type IslandId = (typeof ISLAND_IDS)[number];

export type Vec3 = [number, number, number];

export interface Achievement {
  id: string; // 'radio-llm'
  title: string; // short headline, 6 words or fewer
  text: string; // the full sentence from the CV
  objectId?: string; // the 3D object that reveals it
}

export interface Chapter {
  id: IslandId;
  kind: 'job' | 'open-source' | 'about';
  company: string;
  role: string;
  start: string; // '2022-11'
  end: string | null; // null means ongoing
  employment?: string; // 'part-time'
  location?: string;
  summary: string; // one line under the title
  achievements: Achievement[];
  tech: string[];
  links?: { label: string; href: string }[];
}

export interface Profile {
  name: string;
  role: string;
  summary: string;
  contacts: { email: string; phone?: string; linkedin: string; github: string };
  skills: { group: string; items: string[] }[];
  education: { title: string; school: string; start: string; end: string }[];
  languages: { name: string; level: string }[];
}

export interface IslandLayout {
  id: IslandId;
  position: Vec3;
  scale: number;
  seed: number; // for the placeholder shape
  labelOffset: Vec3;
  camera: { position: Vec3; target: Vec3 };
  accent: string; // theme colour for label and panel
}
```

```ts
// src/data/world.ts (values are placeholders, tune them in Phase 2)
export const OVERVIEW = { position: [0, 18, 46] as Vec3, target: [0, 0, 0] as Vec3 };

export const ISLANDS: IslandLayout[] = [
  {
    id: 'home',
    position: [0, 0, 14],
    scale: 1.2,
    seed: 1,
    labelOffset: [0, 6, 0],
    camera: { position: [6, 5, 26], target: [0, 1, 14] },
    accent: '#E08A3C',
  },
  {
    id: 'workshop',
    position: [-24, 2, -6],
    scale: 1,
    seed: 2,
    labelOffset: [0, 6, 0],
    camera: { position: [-18, 7, 6], target: [-24, 2, -6] },
    accent: '#B8733A',
  },
  // grove, radio, arena, market, lighthouse ...
];
```

---

## State

```ts
// src/store/useWorld.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IslandId } from '@/data/types';

export type Phase = 'loading' | 'welcome' | 'flyIn' | 'world';
export type Quality = 'high' | 'low';

interface WorldState {
  phase: Phase;
  focused: IslandId | null;
  activeObject: string | null; // last clicked object
  hintObject: string | null; // object glowing because its achievement is hovered
  sound: boolean;
  quality: Quality;
  visited: IslandId[]; // persisted
  found: string[]; // persisted object ids

  setPhase: (p: Phase) => void;
  enter: (withSound: boolean) => void;
  focus: (id: IslandId) => void;
  back: () => void;
  activateObject: (id: string) => void;
  setHint: (id: string | null) => void;
  toggleSound: () => void;
  setQuality: (q: Quality) => void;
}

export const useWorld = create<WorldState>()(
  persist(
    (set) => ({
      phase: 'loading',
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
        set((s) => ({
          focused: id,
          activeObject: null,
          visited: s.visited.includes(id) ? s.visited : [...s.visited, id],
        })),
      back: () => set({ focused: null, activeObject: null }),
      activateObject: (id) =>
        set((s) => ({
          activeObject: id,
          found: s.found.includes(id) ? s.found : [...s.found, id],
        })),
      setHint: (hintObject) => set({ hintObject }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setQuality: (quality) => set({ quality }),
    }),
    { name: 'sky-cv', partialize: (s) => ({ visited: s.visited, found: s.found }) },
  ),
);
```

Rules for the store:

- Components subscribe to the smallest slice they need: `useWorld((s) => s.focused)`.
- Code inside `useFrame` reads with `useWorld.getState()` so it never causes re-renders.

---

## Routing

Hash routes work on any static host without server rewrites, including GitHub Pages.

| Address       | Shows                           |
| ------------- | ------------------------------- |
| `#/` or empty | Overview                        |
| `#/radio`     | Focus on the Radio Tower island |
| `#/cv`        | Classic CV                      |

Opening a deep link such as `#/radio` shows the welcome screen first. After Enter, a short fly-in goes straight to that island.

```ts
// src/routing/hash.ts
import { ISLAND_IDS, type IslandId } from '@/data/types';

export type Route = { view: 'cv' } | { view: 'world'; island: IslandId | null };

export function parseHash(hash: string): Route {
  const part = hash.replace(/^#\/?/, '');
  if (part === 'cv') return { view: 'cv' };
  const isIsland = (ISLAND_IDS as readonly string[]).includes(part);
  return { view: 'world', island: isIsland ? (part as IslandId) : null };
}

export const toHash = (r: Route) => (r.view === 'cv' ? '#/cv' : `#/${r.island ?? ''}`);
```

`useHashSync` listens to `hashchange` and calls `focus` or `back`, and writes the hash when `focused` changes. Compare before writing so the two directions do not loop. Browser Back then works for free.

---

## App composition

The 3D world is a lazy chunk. The welcome text, top bar and classic CV never wait for three.js to download.

```tsx
// src/App.tsx (sketch)
const WorldCanvas = lazy(() => import('@/scenes/WorldCanvas'));

export function App() {
  const route = useRoute();
  const webgl = useWebGLSupport();

  if (route.view === 'cv' || !webgl) return <ClassicCV />;

  return (
    <>
      <Suspense fallback={null}>
        <WorldCanvas />
      </Suspense>
      <Overlay /> {/* Welcome, TopBar, IslandPanel: plain DOM */}
    </>
  );
}
```

```tsx
// src/scenes/WorldCanvas.tsx (sketch)
<Canvas
  flat // no tone mapping, keeps painted colours exact
  dpr={[1, 2]}
  camera={{ fov: 45, near: 0.1, far: 1200, position: [0, 120, 60] }}
  gl={{ antialias: true, powerPreference: 'high-performance' }}
  aria-hidden
>
  <SkyDome />
  <Lighting />
  <CloudLayers />
  <Islands />
  <Route />
  <CameraRig />
  <FlyIn />
  <Effects />
  {import.meta.env.DEV && <Debug />}
</Canvas>
```

---

## Camera system

The camera has three modes.

| Mode       | When                        | How                                                                                      |
| ---------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| Scripted   | Fly-in                      | `FlyIn` moves the camera along a curve in `useFrame`. CameraControls is not mounted yet. |
| Controlled | Overview and focus          | drei `CameraControls` with limits on distance and angles                                 |
| Transition | Overview to island and back | `controls.setLookAt(...position, ...target, true)` animates smoothly                     |

```tsx
// src/camera/CameraRig.tsx (sketch)
export function CameraRig() {
  const ref = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const focused = useWorld((s) => s.focused);
  const phase = useWorld((s) => s.phase);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const pose = focused ? layoutOf(focused).camera : OVERVIEW;
    c.smoothTime = 0.6;
    void c.setLookAt(...pose.position, ...pose.target, true);
  }, [focused]);

  if (phase !== 'world') return null; // fly-in owns the camera until then

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={8}
      maxDistance={70}
      minPolarAngle={Math.PI * 0.2}
      maxPolarAngle={Math.PI * 0.48}
    />
  );
}
```

On desktop the panel covers the right side, so the focused island should appear left of centre. Use `controls.setFocalOffset(x, 0, 0, true)` with a value based on panel width, and reset it to zero on Back.

---

## Coding rules for the 3D code

1. Never call `setState` inside `useFrame`. Mutate refs instead.
2. Never allocate objects such as `new Vector3()` inside `useFrame`. Create them once outside and reuse them.
3. Create geometries and materials once, in `useMemo` or at module level, and share palette materials across islands.
4. Use instancing (`Instances`, `Merged`) for anything repeated more than about ten times: grass tufts, rocks, trees, birds.
5. Every pointer handler that should not reach the island behind it calls `e.stopPropagation()`.
6. Every island and object reads its numbers from `world.ts` or props, never from magic numbers in JSX.

---

## Testing

| Layer             | Tool                       | What to test                                                                                                                                                    |
| ----------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data              | Vitest                     | Ids are unique. Every `objectId` exists in the object registry. Every chapter has at least one achievement. Every island in `cv.ts` has a layout in `world.ts`. |
| Store and routing | Vitest                     | `focus` adds to `visited`. `parseHash` handles bad input.                                                                                                       |
| UI                | Vitest and Testing Library | Panel renders all achievements. Classic CV renders all chapters.                                                                                                |
| Browser           | Playwright                 | Page loads, Enter works, `#/cv` shows text, `#/radio` opens a panel. Run against the preview build.                                                             |
