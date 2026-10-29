# Phase 3. Welcome and fly-in

[Back to plan](../../PLAN.md) · Previous: [Phase 2](phase-2-islands-navigation.md) · Next: [Phase 4. Island art](phase-4-island-art.md)

**Estimate:** 2 days
**Goal:** the first impression. A welcome screen over the live sky, an Enter button, and a short cinematic dive through the clouds that lands on the overview.

---

## Tasks

### 1. Loading flow

- [x] Set the store's initial phase back to `'loading'`.
- [x] Render the welcome overlay immediately, before the 3D chunk downloads. It is plain HTML in `src/ui/Welcome.tsx`.
- [x] Read loading progress with drei `useProgress` inside the Canvas, and pass it out through the store or a small context.
- [x] When progress reaches 100 and the Canvas has rendered its first frame, set the phase to `'welcome'`.

```tsx
// inside the Canvas
function LoadingReporter() {
  const { progress, active } = useProgress();
  const setPhase = useWorld((s) => s.setPhase);
  useEffect(() => {
    if (!active && progress === 100 && useWorld.getState().phase === 'loading') setPhase('welcome');
  }, [active, progress, setPhase]);
  return null;
}
```

- [x] Load only what the overview needs before showing Enter. Island detail models can load later, see [Phase 7](phase-7-performance-mobile-a11y.md).

### 2. Welcome screen

- [x] Layout, centred over the sky:
  - "Welcome to my World" in the title font
  - name and role underneath
  - a progress line while loading
  - **Enter with sound** and **Enter quietly** buttons once loaded
  - a small "Just the CV, please" link to `#/cv`
- [x] Behind it, the camera hangs high above the cloud floor looking at the sky, with clouds drifting. The welcome screen and the world are the same scene, so the transition is seamless.
- [x] Animate the title in gently with `motion`: fade and rise, letters slightly staggered.
- [x] Focus the Enter button when it appears, so keyboard users can just press Enter.

### 3. Fly-in path

- [x] Define the path as points in `world.ts`: start high above the clouds, dive into the cloud layer, burst out underneath, swing towards the islands, end exactly at the overview pose.
- [x] Create `src/scenes/FlyIn.tsx`. It moves the camera along a Catmull-Rom curve while the phase is `'flyIn'`.

```tsx
// src/scenes/FlyIn.tsx (sketch)
const DURATION = 5;
const tmpTarget = new THREE.Vector3();
const overviewTarget = new THREE.Vector3(...OVERVIEW.target);

export function FlyIn() {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(FLY_IN_POINTS.map((p) => new THREE.Vector3(...p))),
    [],
  );
  const t = useRef(0);

  useFrame(({ camera }, delta) => {
    const { phase, setPhase } = useWorld.getState();
    if (phase !== 'flyIn') return;

    t.current = Math.min(t.current + delta / DURATION, 1);
    const k = easeInOutCubic(t.current);

    camera.position.copy(curve.getPointAt(k));
    const ahead = curve.getPointAt(Math.min(k + 0.02, 1));
    // look along the path, then blend towards the overview target near the end
    tmpTarget.lerpVectors(ahead, overviewTarget, smoothstep(0.65, 1, k));
    camera.lookAt(tmpTarget);

    if (t.current === 1) setPhase('world'); // CameraRig mounts and takes over
  });

  return null;
}

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
```

- [x] When `CameraRig` mounts, call `setLookAt` with the current camera position and the overview target without a transition. The handoff must be invisible.
- [x] If the visitor arrived with a deep link such as `#/radio`, focus that island right after the handoff.

### 4. Cloud burst effect

- [x] Add wisp clouds right on the path where the camera crosses the cloud layer.
- [x] Add a full-screen white overlay that fades to about 70 percent opacity inside the cloud and back to zero when leaving it.
- [x] Briefly widen the field of view during the dive, from 45 to about 60 and back, for a sense of speed. Call `camera.updateProjectionMatrix()` after each change.
- [ ] Optional: tiny camera shake while inside the cloud. Skipped: the veil and field-of-view kick already sell it.

### 5. Title beats during the dive (optional)

- [ ] Fade in the name, then the role, then nothing, timed to the curve progress. Skipped for now: the welcome screen already shows both.
- [ ] Keep them short. The world is the message.

### 6. Skip

- [x] A Skip button in the bottom-right corner during the fly-in.
- [x] Any key or a click also skips.
- [x] Skipping jumps the camera to the end of the curve and sets the phase to `'world'`. No fade yet; the welcome overlay fading out covers most of it.
- [x] If `prefers-reduced-motion: reduce` is set, skip automatically with a simple cross-fade.
- [x] Returning visitors (`visited` is not empty) get a shorter version: the same dive from the welcome view in 3 seconds. (Revised 2026-10-29: it used to start the curve near the cloud layer, which made the camera jump from the welcome view straight into the clouds.)

### 7. Sound

- [x] ~~Create `src/audio/sound.ts` around howler.~~ Sound is synthesized with Web Audio instead: wind, a soft chord and a whoosh. No files, no licences. howler can return in Phase 6 with recorded music.

```ts
// src/audio/sound.ts (sketch)
import { Howl, Howler } from 'howler';

const ambient = new Howl({
  src: ['/audio/ambient.webm', '/audio/ambient.mp3'],
  loop: true,
  volume: 0,
});
const whoosh = new Howl({ src: ['/audio/whoosh.mp3'], volume: 0.5 });

export const sound = {
  start() {
    ambient.play();
    ambient.fade(0, 0.35, 2500);
  },
  whoosh() {
    whoosh.play();
  },
  mute(m: boolean) {
    Howler.mute(m);
  },
};
```

- [x] "Enter with sound" calls `sound.start()` and `sound.whoosh()` inside the click handler. Browsers only allow sound that starts from a user gesture.
- [x] "Enter quietly" leaves everything muted. The top bar toggle can turn sound on later.
- [x] (n/a, synthesized) Keep the ambient loop short, 60 to 90 seconds and about 1 MB, so Web Audio can decode it quickly.
- [x] (n/a, synthesized) Do not use howler's `html5: true` option. It switches to plain audio elements, and then fades stop working on iOS.
- [x] (n/a, synthesized) Start loading the audio files after the welcome screen appears, not before. They must never delay the Enter button.

---

## Acceptance criteria

- [x] The welcome text appears within 2 seconds on a normal connection.
- [ ] The fly-in runs at 60 FPS on a laptop and lasts 6 seconds or less. It lasts 5 seconds; FPS needs a check on a real GPU.
- [x] There is no jump when the fly-in hands the camera to CameraControls.
- [x] Skip, any key, reduced motion and the returning-visitor version all work.
- [ ] Sound starts only after "Enter with sound", fades in, and the toggle mutes it. The toggle state is tested; listen to it once on a real machine.
- [x] Deep links still work after the fly-in.

## Pitfalls

- **CameraControls fights the fly-in.** Do not mount it until the phase is `'world'`, as in the architecture sketch.
- **The camera ends looking the wrong way.** The last point of the curve must equal the overview position, and the blend must reach the overview target exactly at the end.
- **Speed feels uneven.** Use `getPointAt` (even spacing by length), not `getPoint`.
- **iOS volume.** Fades must go through Web Audio, because iOS ignores the volume of plain audio elements. Howler uses Web Audio unless `html5: true` is set.

---

## Progress notes

- **Loading.** `LoadingReporter` waits until drei's loading manager is idle for 12 frames. Enter appears about 2 seconds after load in the CPU-rendered test browser.
- **Dive.** The curve passes through one dense cloud (`FLY_IN_CLOUD` in `world.ts`) that hides the islands until the camera bursts out. The white veil follows the distance to that cloud's centre, not the camera height. A sea of clouds under the welcome view sits behind the overview camera, so the world never sees it.
- **Handoff.** `CameraRig` mounts only in the `'world'` phase and adopts the camera wherever the dive left it. `FlyIn` lands the camera with a layout effect, so the handoff reads the final pose.
- **Sound.** Web Audio synth: brown-noise wind with slow filter movement, an F major 7 pad, and a band-pass whoosh. It suspends when the tab is hidden and after muting.
- **Debug.** `?skipIntro` opens straight on the islands. `?introAt=0.5` freezes the dive at that point of the path, for tuning.
- **Layering.** Labels now sit in their own layer under the top bar and never enter its strip. The route line is opaque, because transparent lines drew on top of the clouds.
- **Tests.** 26 browser tests, including Skip, the full dive, a deep link after the intro, Just the CV, the sound toggle and reduced motion.
