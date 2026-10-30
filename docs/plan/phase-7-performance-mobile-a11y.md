# Phase 7. Performance, mobile and accessibility

[Back to plan](../../PLAN.md) · Previous: [Phase 6](phase-6-polish.md) · Next: [Phase 8. Launch](phase-8-launch.md)

**Estimate:** 3 to 5 days
**Goal:** the site is smooth on a mid-range phone, fully usable without a mouse or without sight, and looks good when shared as a link.

Phase 2 already built the basics: classic CV, keyboard navigation, deep links, bottom sheet. This phase measures, tunes and fills the gaps.

---

## Budgets

| Metric                                 | Target                                                  |
| -------------------------------------- | ------------------------------------------------------- |
| Initial JavaScript before the 3D chunk | 100 KB gzip or less                                     |
| 3D chunk (three, R3F, drei, effects)   | 600 KB gzip or less                                     |
| Models and textures for the overview   | 5 MB or less                                            |
| All models and textures                | 10 MB or less                                           |
| Audio downloaded before Enter          | 0                                                       |
| Welcome text visible                   | Under 2 seconds on fast 4G                              |
| Draw calls in the overview             | 150 or fewer                                            |
| Triangles in view                      | 300,000 or fewer                                        |
| Frame rate                             | 60 FPS on a mid laptop, 30 FPS or better on a mid phone |

---

## Tasks

### 1. Measure first

- [ ] Use `?debug` with r3f-perf to read FPS, draw calls, triangles and GPU memory on every island.
- [ ] Run `npx vite-bundle-visualizer` to see what is in each chunk.
- [ ] Record a Chrome Performance trace of the fly-in and of an island flight.
- [ ] Test on a real mid-range Android phone and an iPhone. The emulator does not show GPU limits.
- [ ] Write the numbers in a table at the bottom of this file, before and after tuning.

### 2. Loading strategy

- [ ] The overview loads light versions of each island: silhouette, landmark, no interactive detail.
- [ ] The detailed island loads when it is focused, inside its own `Suspense`. Use drei `useGLTF.preload` for the next and previous islands while the visitor reads.
- [ ] Alternatively use drei `Detailed` for level of detail by distance, if both versions are small enough to load upfront.
- [ ] Import model files through Vite (`import url from './radio.glb?url'`) so they get hashed file names and can be cached forever.
- [ ] Load fonts with `font-display: swap` and preload the title font.

### 3. Adaptive quality

- [ ] Wrap the scene in drei `PerformanceMonitor`. On decline, lower the pixel ratio first, then switch `quality` to `'low'`.

```tsx
<PerformanceMonitor
  onDecline={() => { setDpr(1); useWorld.getState().setQuality('low'); }}
  onIncline={() => setDpr(Math.min(window.devicePixelRatio, 2))}
  flipflops={3}
  onFallback={() => useWorld.getState().setQuality('low')}
>
```

- [ ] Low quality means: no post effects, no shadows, half the clouds, fewer birds and particles, pixel ratio 1.
- [ ] Add a manual Quality switch in the top bar menu for people who want to choose.
- [ ] Start on low quality by default when `matchMedia('(pointer: coarse)')` matches and the screen is small.

### 4. Rendering savings

- [ ] Confirm all repeated props use `Instances` or `Merged`.
- [ ] Confirm materials are shared, not cloned per mesh.
- [ ] Pause expensive work for islands outside the view. A simple distance check from the camera is enough to skip their `useFrame` animations.
- [ ] R3F stops rendering when the browser tab is hidden. Also pause audio then.

### 5. Mobile

- [ ] **Camera framing.** In portrait, increase the overview distance or field of view based on the aspect ratio, so all islands fit.
- [ ] **Touch.** One finger rotates within limits, two fingers zoom. Disable panning.
- [ ] **Tap.** There is no hover on touch. The first tap on an object shows its tooltip and plays it. Never require hover to discover anything.
- [ ] **Bottom sheet.** Drag handle, three heights (peek, half, full). The island stays visible above the half height.
- [ ] **Viewport.** Use `100dvh`, not `100vh`, so the browser toolbar does not cut the bottom off.
- [ ] **Context loss.** Listen for `webglcontextlost` on the canvas and show "Tap to reload the world" with a link to the classic CV.
- [ ] **Safe areas.** Respect `env(safe-area-inset-*)` for the top bar and the sheet on phones with notches.

### 6. Accessibility

- [ ] **Reduced motion.** With `prefers-reduced-motion: reduce`: skip the fly-in, stop island bobbing, make camera flights instant cross-fades, keep only gentle ambient motion.
- [ ] **Screen readers.** The canvas has `aria-hidden`. A visually hidden live region announces "Now viewing: Radio Gigabit, Senior Full Stack Engineer" on focus changes.
- [ ] **Headings.** The panel uses a proper heading order: the role as h2, sections as h3.
- [ ] **Contrast.** All text meets WCAG AA. Check labels against both bright sky and dark rock.
- [ ] **Focus.** Visible focus rings everywhere. Focus returns to the island label after closing the panel.
- [ ] **Keyboard run.** Do a full pass with only the keyboard, from welcome to the last island and the classic CV.
- [ ] **Screen reader run.** A quick pass with NVDA on Windows and VoiceOver on iPhone.
- [ ] **Zoom.** The UI stays usable at 200 percent browser zoom.

### 7. SEO and sharing

- [ ] `index.html` has a real title, "Renat Kalimulin, Senior Frontend Developer", and a meta description.
- [ ] Open Graph and Twitter tags with a 1200 by 630 preview image: a beautiful screenshot of the overview with the name on it.
- [ ] A favicon and an Apple touch icon: a tiny floating island.
- [ ] JSON-LD `Person` data with name, job title, and links to LinkedIn and GitHub.
- [ ] A `<noscript>` block with a short summary and a link to the PDF.
- [ ] Optional: prerender the classic CV to static HTML at build time, so link previews and crawlers see the full text. A small script that renders `ClassicCV` with `react-dom/server` into `dist/cv/index.html` is enough.

---

## Acceptance criteria

- [ ] All budgets above are met, with numbers recorded below.
- [ ] 30 FPS or better on a mid-range phone in the overview and on the busiest island.
- [ ] Full keyboard run and screen reader run pass.
- [ ] Reduced motion mode works.
- [ ] Sharing the link in a messenger shows the preview image, title and description.

## Pitfalls

- **Testing only on a powerful laptop.** Always check the real phone.
- **Hover-only discovery.** Anything that only shows on hover is invisible on phones.
- **Too-aggressive adaptive quality.** If quality keeps switching back and forth, rely on `flipflops` and `onFallback` so it settles on low and stays there.

---

## Measurements

| Date | Device | Scene | FPS | Draw calls | Triangles | Notes |
| ---- | ------ | ----- | --- | ---------- | --------- | ----- |
|      |        |       |     |            |           |       |

---

## Measurements and changes (2026-10-30)

Measured offline from the production build and the model files (no browser profiling yet; FPS and draw calls still need `?debug` on real devices).

| Metric                                  | Before       | After          | Budget   |
| --------------------------------------- | ------------ | -------------- | -------- |
| Initial JavaScript (gzip)               | 129 KB       | 129 KB         | 100 KB   |
| 3D code (gzip)                          | 376 KB       | 312 KB         | 600 KB   |
| Models, all (55 meshes, 282k triangles) | 9.8 MB       | 9.8 MB         | 10 MB    |
| Model textures in GPU memory            | about 170 MB | about 170 MB   | none set |
| Audio before Enter                      | 1.6 MB       | 0              | 0        |
| Waits before Enter shows                | every model  | sky and clouds |          |

- **Debug panel out of the bundle.** leva (64 KB gzip) only loads with `?debug` (`src/debug/DebugControls.tsx`); visitors render the defaults in `src/debug/worldLook.ts`.
- **No audio before Enter.** Sound files download the first time sound is turned on.
- **Enter sooner.** The welcome view shows only sky and clouds, so Enter appears once the cloud sea has loaded (`skyReady`). Each island marks itself loaded (`islandsLoaded`); if they aren't all in when the dive is deepest in the cloud bank (about 2.8 s in), the dive eases to a stop there, hidden by the white veil, and goes on once they are, or after 15 s.
- **Not worth it:** gzip on top of meshopt saves only 7%, and meshopt already runs at its highest level, so smaller downloads would need simplified models.
- **Considered, not done for now:** frame-rate-based resolution scaling, lower quality on phones, 512 px textures for small props, a manual quality switch.
