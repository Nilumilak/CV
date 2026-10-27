# Phase 2. Islands and navigation

[Back to plan](../../PLAN.md) · Previous: [Phase 1](phase-1-sky-world.md) · Next: [Phase 3. Welcome and fly-in](phase-3-welcome-flyin.md)

**Estimate:** 4 to 5 days
**Goal:** the complete CV is usable. Placeholder islands float in the sky, clicking one flies the camera there and opens a panel with all its content. Deep links, the browser Back button, keyboard navigation, the classic CV and the mobile panel all work.

This is the most important phase. After it, the site is a real CV you can send to people.

---

## Tasks

### 1. Island layout
- [ ] Fill in `src/data/world.ts` for all seven islands.
- [ ] Arrange career islands on a gentle arc from left (oldest) to right (newest), with varied heights so the overview has depth.
- [ ] Put Home front and centre, nearest the overview camera. Put the Lighthouse off to one side.
- [ ] Give each island a camera pose that frames it from a three-quarter angle, slightly above.

### 2. Placeholder island shape
- [ ] Create `src/islands/PlaceholderIsland.tsx`: an upside-down rocky cone with a flat grassy top.
- [ ] Displace vertices with a function of their position, not a random number per vertex. Cone geometry repeats vertices along its seam, and per-vertex randomness tears it open.

```tsx
// src/islands/PlaceholderIsland.tsx (sketch)
import { useMemo } from 'react';
import * as THREE from 'three';
import { palette } from '@/materials/toon';

function useRockGeometry(seed: number, radius = 5, depth = 7) {
  return useMemo(() => {
    const geo = new THREE.ConeGeometry(radius, depth, 28, 10);
    geo.rotateX(Math.PI);               // tip points down
    geo.translate(0, -depth / 2, 0);    // flat top at y = 0
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (y > -0.01) continue;          // keep the top edge clean
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

- [ ] Add a couple of cones as trees and a box as a building, so each placeholder hints at its theme.

### 3. Island wrapper
- [ ] Create `src/islands/Island.tsx`. It positions the island, makes it bob, handles hover and click, and renders the label.

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
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => { e.stopPropagation(); if (!isFocused) focus(layout.id); }}
        >
          {children ?? <PlaceholderIsland seed={layout.seed} highlighted={hovered} />}
        </group>
      </Float>
      <IslandLabel layout={layout} />
    </group>
  );
}
```

- [ ] Keep the label outside `Float`, so it does not wobble.
- [ ] Clicking empty sky should go back to the overview. Use `onPointerMissed` on the Canvas and call `back()` when an island is focused.

### 4. Labels
- [ ] Create `src/islands/IslandLabel.tsx` with drei `Html`. Make the label a real `<button>`. This gives keyboard focus and screen reader access for free.

```tsx
<Html position={layout.labelOffset} center distanceFactor={14} zIndexRange={[20, 0]}>
  <button className={styles.tag} onClick={() => focus(layout.id)} aria-label={`${chapter.company}, ${years}`}>
    <span className={styles.icon}><IslandIcon id={layout.id} /></span>
    <span className={styles.name}>{chapter.company}</span>
    <span className={styles.years}>{years}</span>
    {visited && <span className={styles.flag} aria-hidden>⚑</span>}
  </button>
</Html>
```

- [ ] Style it like reference 1: light icon square, dark rounded bar, small caps text.
- [ ] Hide labels of other islands while one is focused, so they do not clutter the view.
- [ ] Add the "Now" badge for chapters whose `end` is `null`.

### 5. Route between islands
- [ ] Create `src/world/Route.tsx`: a smooth curve through the career islands in timeline order.
- [ ] For now draw it as a dashed drei `Line`. Phase 4 replaces it with rope bridges or a tram line.

### 6. Store
- [ ] Implement `src/store/useWorld.ts` from [Architecture](architecture.md#state).
- [ ] For this phase, start with `phase: 'world'` so you skip the welcome screen that does not exist yet.
- [ ] Unit test `focus`, `back` and `visited`.

### 7. Camera rig
- [ ] Replace OrbitControls with `src/camera/CameraRig.tsx` from [Architecture](architecture.md#camera-system).
- [ ] Limit distance and angles so the visitor cannot look under the cloud floor or zoom out into nothing.
- [ ] On desktop shift the focused island left with `setFocalOffset`, so the panel does not cover it. Reset the offset on Back.
- [ ] In focus mode, limit zoom to a small range around the island.
- [ ] Tune `smoothTime` until the flight feels calm, about 1.2 to 1.6 seconds.

### 8. Island panel
- [ ] Create `src/ui/IslandPanel.tsx`. It reads the focused chapter from `cv.ts` and renders:
  - role, company, dates, employment type and location
  - one-line summary
  - every achievement: short title in bold, full text below
  - tech chips
  - links
  - Previous and Next island buttons in timeline order
  - a Back button
- [ ] Slide it in from the right with `motion`. On screens narrower than 768 pixels, make it a bottom sheet that covers about half the screen and can be dragged taller.
- [ ] Make it an accessible dialog: `role="dialog"`, `aria-labelledby` pointing at the title, focus moves to the title on open, Esc closes it.
- [ ] Do not trap focus completely. Visitors should still reach the top bar.

### 9. Home island panel
- [ ] The Home panel is different: summary, skills grouped as in the CV, education, languages and contacts.
- [ ] Add a "Copy email" button that copies the address and shows a short "Copied" message.

### 10. Top bar and island menu
- [ ] Create `src/ui/TopBar.tsx` with the name, an "Islands" menu button, "Classic CV", "Download PDF" and a sound toggle placeholder.
- [ ] The Islands menu lists all chapters in timeline order. Choosing one focuses it. This is the fastest route for recruiters and for keyboard users.

### 11. Keyboard navigation
- [ ] Tab moves through the top bar and the island labels.
- [ ] Enter or Space on a label focuses that island.
- [ ] Left and Right arrows move to the previous or next island while one is focused.
- [ ] Esc goes back to the overview.
- [ ] Every focusable element has a visible focus ring in the `accent-gold` colour.

### 12. Routing
- [ ] Implement `src/routing/hash.ts` and `useHashSync` from [Architecture](architecture.md#routing).
- [ ] Check that opening `#/radio` directly focuses Radio Tower, and that browser Back returns to the overview.

### 13. Classic CV
- [ ] Create `src/ui/ClassicCV.tsx`, rendered at `#/cv`, built only from `cv.ts`.
- [ ] Reuse the layout and print styles from `reference/Renat_Kalimulin_CV.html`, so printing still gives a clean A4 page.
- [ ] Add "Back to the sky" and "Download PDF" buttons.
- [ ] Put `cv.pdf` in `public/`. Export it from the classic CV page with the browser's Save as PDF.

### 14. WebGL fallback
- [ ] Create `useWebGLSupport()`: try `canvas.getContext('webgl2')`, and if it returns null show the classic CV with a short note.

### 15. Deploy and share
- [ ] Deploy, open it on a phone, and send the address to one friend for honest feedback.

---

## Acceptance criteria

- [ ] Every line of the CV can be reached by clicking islands or through the Islands menu.
- [ ] Camera flights are smooth and never pass through an island.
- [ ] `#/radio` and `#/cv` work when opened directly, and browser Back works.
- [ ] The whole CV is usable with a keyboard only.
- [ ] On a phone, the bottom sheet is readable and the island stays visible above it.
- [ ] Without WebGL, the classic CV appears.
- [ ] Data, store and routing tests pass.

## Pitfalls

- **Click goes through to the island behind.** Call `e.stopPropagation()` in every handler that should stop there.
- **Hover flickers.** `onPointerOut` fires when moving between child meshes. Handle hover on the parent group, as in the sketch.
- **Html labels are expensive in large numbers.** Seven is fine. Do not use `Html` for every small object later.
- **Html labels show through islands.** Use `occlude` only if needed, because it costs a raycast per frame. Hiding non-focused labels usually solves it.
- **Store and hash loop forever.** Compare before writing in both directions.
