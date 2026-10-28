# Phase 2. Islands and navigation

[Back to plan](../../PLAN.md) · Previous: [Phase 1](phase-1-sky-world.md) · Next: [Phase 3. Welcome and fly-in](phase-3-welcome-flyin.md)

**Estimate:** 4 to 5 days
**Goal:** the complete CV is usable. Placeholder islands float in the sky, clicking one flies the camera there and opens a panel with all its content. Deep links, the browser Back button, keyboard navigation, the classic CV and the mobile panel all work.

This is the most important phase. After it, the site is a real CV you can send to people.

---

## Tasks

### 1. Island layout

- [x] Fill in `src/data/world.ts` for all seven islands.
- [x] Arrange career islands on a gentle arc from left (oldest) to right (newest), with varied heights so the overview has depth.
- [x] Put Home front and centre, nearest the overview camera. Put the Lighthouse off to one side.
- [x] Give each island a camera pose that frames it from a three-quarter angle, slightly above.

### 2. Placeholder island shape

- [x] Create `src/islands/PlaceholderIsland.tsx`: an upside-down rocky cone with a flat grassy top.
- [x] Displace vertices with a function of their position, not a random number per vertex. Cone geometry repeats vertices along its seam, and per-vertex randomness tears it open.

```tsx
// src/islands/PlaceholderIsland.tsx (sketch)
import { useMemo } from 'react';
import * as THREE from 'three';
import { palette } from '@/materials/toon';

function useRockGeometry(seed: number, radius = 5, depth = 7) {
  return useMemo(() => {
    const geo = new THREE.ConeGeometry(radius, depth, 28, 10);
    geo.rotateX(Math.PI); // tip points down
    geo.translate(0, -depth / 2, 0); // flat top at y = 0
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      if (y > -0.01) continue; // keep the top edge clean
      const n = Math.sin(x * 1.3 + seed) * Math.cos(z * 1.7 + seed * 2) + Math.sin(y * 2.1 + seed);
      const k = 1 + n * 0.12;
      p.setXYZ(i, x * k, y, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  }, [seed, radius, depth]);
}

export function PlaceholderIsland({ seed, highlighted }: { seed: number; highlighted: boolean }) {
  const rock = useRockGeometry(seed);
  return (
    <group>
      <mesh geometry={rock} material={palette.rock} />
      <mesh position={[0, 0.2, 0]} material={highlighted ? palette.grass : palette.grassDark}>
        <cylinderGeometry args={[5.1, 4.8, 0.5, 28]} />
      </mesh>
    </group>
  );
}
```

- [x] Add a couple of cones as trees and a box as a building, so each placeholder hints at its theme.

### 3. Island wrapper

- [x] Create `src/islands/Island.tsx`. It positions the island, makes it bob, handles hover and click, and renders the label.

```tsx
// src/islands/Island.tsx (sketch)
export function Island({ layout, children }: { layout: IslandLayout; children?: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const focused = useWorld((s) => s.focused);
  const focus = useWorld((s) => s.focus);
  const isFocused = focused === layout.id;

  useCursor(hovered && !isFocused);

  return (
    <group position={layout.position} scale={layout.scale}>
      <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.4} floatingRange={[-0.2, 0.2]}>
        <group
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (!isFocused) focus(layout.id);
          }}
        >
          {children ?? <PlaceholderIsland seed={layout.seed} highlighted={hovered} />}
        </group>
      </Float>
      <IslandLabel layout={layout} />
    </group>
  );
}
```

- [x] Keep the label outside `Float`, so it does not wobble.
- [x] Clicking empty sky should go back to the overview. Use `onPointerMissed` on the Canvas and call `back()` when an island is focused.

### 4. Labels

- [x] ~~Create the label with drei `Html`~~ Labels are DOM `<button>`s in a layer over the canvas, moved every frame by `LabelProjector`. drei `Html` creates a React root per label and logged unmount warnings under React 19 StrictMode.

```tsx
<Html position={layout.labelOffset} center distanceFactor={14} zIndexRange={[20, 0]}>
  <button
    className={styles.tag}
    onClick={() => focus(layout.id)}
    aria-label={`${chapter.company}, ${years}`}
  >
    <span className={styles.icon}>
      <IslandIcon id={layout.id} />
    </span>
    <span className={styles.name}>{chapter.company}</span>
    <span className={styles.years}>{years}</span>
    {visited && (
      <span className={styles.flag} aria-hidden>
        ⚑
      </span>
    )}
  </button>
</Html>
```

- [x] Style it like reference 1: light icon square, dark rounded bar, small caps text.
- [x] Hide labels of other islands while one is focused, so they do not clutter the view.
- [x] Add the "Now" badge for chapters whose `end` is `null`.

### 5. Route between islands

- [x] Create `src/world/Route.tsx`: a smooth curve through the career islands in timeline order.
- [x] For now draw it as a dashed drei `Line`. Phase 4 replaces it with rope bridges or a tram line.

### 6. Store

- [x] Implement `src/store/useWorld.ts` from [Architecture](architecture.md#state).
- [x] For this phase, start with `phase: 'world'` so you skip the welcome screen that does not exist yet.
- [x] Unit test `focus`, `back` and `visited`.

### 7. Camera rig

- [x] Replace OrbitControls with `src/camera/CameraRig.tsx` from [Architecture](architecture.md#camera-system).
- [x] Limit distance and angles so the visitor cannot look under the cloud floor or zoom out into nothing.
- [x] On desktop shift the focused island left with `setFocalOffset`, so the panel does not cover it. Reset the offset on Back.
- [x] In focus mode, limit zoom to a small range around the island.
- [x] Tune `smoothTime` until the flight feels calm, about 1.2 to 1.6 seconds.

### 8. Island panel

- [x] Create `src/ui/IslandPanel.tsx`. It reads the focused chapter from `cv.ts` and renders:
  - role, company, dates, employment type and location
  - one-line summary
  - every achievement: short title in bold, full text below
  - tech chips
  - links
  - Previous and Next island buttons in timeline order
  - a Back button
- [x] Slide it in from the right with `motion`. On screens narrower than 768 pixels, make it a bottom sheet that covers about half the screen and can be dragged taller.
- [x] Make it an accessible dialog: `role="dialog"`, `aria-labelledby` pointing at the title, focus moves to the title on open, Esc closes it.
- [x] Do not trap focus completely. Visitors should still reach the top bar.

### 9. Home island panel

- [x] The Home panel is different: summary, skills grouped as in the CV, education, languages and contacts.
- [x] Add a "Copy email" button that copies the address and shows a short "Copied" message.

### 10. Top bar and island menu

- [x] Create `src/ui/TopBar.tsx` with the name, an "Islands" menu button, "Classic CV" and "Download PDF". The sound toggle comes with sound in Phase 3.
- [x] The Islands menu lists all chapters in timeline order. Choosing one focuses it. This is the fastest route for recruiters and for keyboard users.

### 11. Keyboard navigation

- [x] Tab moves through the top bar and the island labels.
- [x] Enter or Space on a label focuses that island.
- [x] Left and Right arrows move to the previous or next island while one is focused.
- [x] Esc goes back to the overview.
- [x] Every focusable element has a visible focus ring in the `accent-gold` colour.

### 12. Routing

- [x] Implement `src/routing/hash.ts` and `useHashSync` from [Architecture](architecture.md#routing).
- [x] Check that opening `#/radio` directly focuses Radio Tower, and that browser Back returns to the overview.

### 13. Classic CV

- [x] Create `src/ui/ClassicCV.tsx`, rendered at `#/cv`, built only from `cv.ts`.
- [x] Reuse the layout and print styles from `reference/Renat_Kalimulin_CV.html`, so printing still gives a clean A4 page.
- [x] Add "Back to the sky" and "Download PDF" buttons.
- [x] Put `cv.pdf` in `public/`. Export it from the classic CV page with the browser's Save as PDF.

### 14. WebGL fallback

- [x] Create `useWebGLSupport()`: try `canvas.getContext('webgl2')`, and if it returns null show the classic CV with a short note.

### 15. Deploy and share

- [ ] Deploy, open it on a phone, and send the address to one friend for honest feedback. Waiting for Vercel.

---

## Acceptance criteria

- [x] Every line of the CV can be reached by clicking islands or through the Islands menu.
- [ ] Camera flights are smooth and never pass through an island. Smooth in tests; check the flights between neighbouring islands by eye on a real GPU.
- [x] `#/radio` and `#/cv` work when opened directly, and browser Back works.
- [x] The whole CV is usable with a keyboard only.
- [x] On a phone, the bottom sheet is readable and the island stays visible above it.
- [x] Without WebGL, the classic CV appears.
- [x] Data, store and routing tests pass.

## Pitfalls

- **Click goes through to the island behind.** Call `e.stopPropagation()` in every handler that should stop there.
- **Hover flickers.** `onPointerOut` fires when moving between child meshes. Handle hover on the parent group, as in the sketch.
- **Html labels are expensive in large numbers.** Seven is fine. Do not use `Html` for every small object later.
- **Html labels show through islands.** Use `occlude` only if needed, because it costs a raycast per frame. Hiding non-focused labels usually solves it.
- **Store and hash loop forever.** Compare before writing in both directions.

---

## Progress notes

- **Labels.** drei `Html` was replaced by plain DOM buttons positioned by `LabelProjector`. No extra React roots, normal tab order, and long names use `shortName` (Monetech, Kafka UI).
- **Camera.** On tall screens the camera backs off by up to 2.2 times, so phones see whole islands. On phones the vertical focal offset is positive: it lifts the island above the bottom sheet. A negative value pushed it under the sheet.
- **Bottom sheet.** It has a handle that toggles between half and full height. Dragging can come in Phase 7.
- **Routing.** The store-to-address effect reads the live store value. Reading the rendered value overwrote deep links on first load.
- **PDF.** `npm run pdf` builds the site and prints `#/cv` to `public/cv.pdf` (2 A4 pages). Run it after every CV change.
- **Photo.** The reference CV links a photo that is not in the repo. Put one in `public/` and set `profile.photo` to show it on the classic page.
- **Tests.** 28 unit tests and 14 browser tests, covering labels, Esc and focus return, deep links and Back, the Islands menu, keyboard only, the classic CV and PDF, and the no-WebGL fallback. Browser tests run one at a time, because CPU-rendered 3D pages starved each other in parallel.
- **Phone overview.** All islands are visible, but the outermost labels are cut at the screen edges. Phase 7 handles phone framing.
